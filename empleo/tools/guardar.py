#!/usr/bin/env python3
"""Guarda candidatas en Supabase (empleo_ofertas) y revalida las activas.

    python3 empleo/tools/guardar.py insertar /tmp/candidatas.json
    python3 empleo/tools/guardar.py revalidar

insertar: ignora las que ya existen (misma URL en cualquiera de sus enlaces,
o misma empresa + puesto) y a las existentes les añade los enlaces nuevos.
Las nuevas entran con decision=pendiente, encontrado_en/verificada_en=hoy.
Si una candidata no trae `resumen`, se guarda un extracto de la descripción.

revalidar: abre el enlace 1 de cada oferta activa; si da 404/410 o redirige
a una página de error/listado, la marca activa=false; si carga, pone
verificada_en=hoy. Imprime un resumen por stderr.
"""
import datetime
import json
import os
import re
import subprocess
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = open(os.path.join(HERE, "..", "config.js")).read()
KEY = re.search(r'eyJ[^"]*', CFG).group(0)
URL = re.search(r"https://[a-z0-9]*\.supabase\.co", CFG).group(0)
HOY = datetime.date.today().isoformat()
COLS = ("empresa", "puesto", "ubicacion", "modalidad", "remoto_claro", "url", "fuente", "sector", "area",
        "seniority", "resumen", "fecha_publicacion", "etiquetas", "enlaces", "categoria", "empresa_data_ai", "empresa_top")


def api(method, path, body=None, prefer="return=representation"):
    req = urllib.request.Request(f"{URL}/rest/v1/{path}", method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"apikey": KEY, "Authorization": f"Bearer {KEY}",
                                          "Content-Type": "application/json", "Prefer": prefer})
    with urllib.request.urlopen(req, timeout=60) as r:
        t = r.read().decode()
        return json.loads(t) if t else None


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def nurl(u):
    """URL comparable: sin esquema, idioma de Workday, parámetros utm ni barra final."""
    u = re.sub(r"^https?://(www\.)?", "", u or "").split("#")[0]
    u = re.sub(r"[?&]utm_[^&]*", "", u).rstrip("/?&")
    return re.sub(r"/[a-z]{2}-[A-Z]{2}/", "/", u).lower()


def misma(a_emp, a_pto, b_emp, b_pto):
    """Misma empresa (prefijo) y mismo puesto (uno contiene al otro)."""
    ea, eb, pa, pb = norm(a_emp)[:6], norm(b_emp)[:6], norm(a_pto), norm(b_pto)
    return ea == eb and len(min(pa, pb, key=len)) >= 8 and (pa.startswith(pb) or pb.startswith(pa))


def insertar(path):
    cands = json.load(open(path))
    rows = api("GET", "empleo_ofertas?select=id,empresa,puesto,url,enlaces")
    by_url = {}
    for r in rows:
        for l in (r.get("enlaces") or []) + [{"url": r["url"]}]:
            by_url[nurl(l["url"])] = r
    nuevas, ampliadas = [], 0
    for c in cands:
        enl = c.get("enlaces") or [{"label": c.get("fuente", "Oferta"), "url": c["url"]}]
        ex = next((by_url[nurl(l["url"])] for l in enl if nurl(l["url"]) in by_url), None) \
            or next((r for r in rows if misma(r["empresa"], r["puesto"], c["empresa"], c["puesto"])), None)
        if ex:
            have = {nurl(l["url"]) for l in ex.get("enlaces") or []} | {nurl(ex["url"])}
            extra = [l for l in enl if nurl(l["url"]) not in have]
            if extra:
                ex["enlaces"] = (ex.get("enlaces") or []) + extra
                if ex.get("id"):
                    api("PATCH", f"empleo_ofertas?id=eq.{ex['id']}", {"enlaces": ex["enlaces"]}, "return=minimal")
                    ampliadas += 1
            continue
        row = {k: c.get(k) for k in COLS if c.get(k) is not None}
        row["url"] = enl[0]["url"]
        row["enlaces"] = enl
        row["fuente"] = enl[0].get("label")
        if not row.get("resumen"):
            row["resumen"] = (c.get("descripcion") or "")[:280] or None
        if c.get("fecha") and re.match(r"\d{4}-\d{2}-\d{2}$", c["fecha"]):
            row.setdefault("fecha_publicacion", c["fecha"])
        row.update(encontrado_en=HOY, verificada_en=HOY, decision="pendiente", activa=True,
                   etiquetas=row.get("etiquetas") or [])
        nuevas.append(row)
        rows.append(row)
        for l in enl:
            by_url[nurl(l["url"])] = row
    keys = set(COLS) | {"encontrado_en", "verificada_en", "decision", "activa"}
    nuevas = [{k: r.get(k) for k in keys} for r in nuevas]
    for r in nuevas:
        r["etiquetas"] = r["etiquetas"] or []
        r["remoto_claro"] = bool(r["remoto_claro"])
        r["empresa_data_ai"] = r["empresa_data_ai"] if r["empresa_data_ai"] is not None else True
        r["categoria"] = r["categoria"] or "partner"
        r["empresa_top"] = bool(r.get("empresa_top"))
        r["modalidad"] = r["modalidad"] or "desconocido"
    for i in range(0, len(nuevas), 100):
        api("POST", "empleo_ofertas", nuevas[i:i + 100], "return=minimal")
    print(json.dumps({"nuevas": len(nuevas), "ampliadas": ampliadas}))


def viva(url):
    try:
        out = subprocess.run(["curl", "-sL", "-m", "25", "-A", "Mozilla/5.0", "-o", "/dev/null", "-w",
                              "%{http_code} %{url_effective}", url], capture_output=True, text=True).stdout
        code, eff = out.split(" ", 1)
    except Exception:
        return None  # no concluyente: no tocar
    if code in ("404", "410") or re.search(r"error|404|not[-_]found|expired|closed", eff, re.I):
        return False
    if code.startswith("2"):
        return True
    return None


def revalidar():
    rows = api("GET", "empleo_ofertas?select=id,url,enlaces&activa=eq.true")
    muertas = vivas = dudas = 0
    for r in rows:
        u = (r.get("enlaces") or [{"url": r["url"]}])[0]["url"]
        v = viva(u)
        if v is True:
            api("PATCH", f"empleo_ofertas?id=eq.{r['id']}", {"verificada_en": HOY}, "return=minimal")
            vivas += 1
        elif v is False:
            api("PATCH", f"empleo_ofertas?id=eq.{r['id']}", {"activa": False}, "return=minimal")
            muertas += 1
        else:
            dudas += 1
    print(json.dumps({"vivas": vivas, "desactivadas": muertas, "sin_concluir": dudas}))


if __name__ == "__main__":
    {"insertar": lambda: insertar(sys.argv[2]), "revalidar": revalidar}[sys.argv[1]]()
