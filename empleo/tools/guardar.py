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
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = open(os.path.join(HERE, "..", "config.js")).read()
KEY = re.search(r'eyJ[^"]*', CFG).group(0)
URL = re.search(r"https://[a-z0-9]*\.supabase\.co", CFG).group(0)
HOY = datetime.date.today().isoformat()
COLS = ("empresa", "puesto", "ubicacion", "modalidad", "remoto_claro", "url", "fuente", "sector", "area",
        "seniority", "resumen", "fecha_publicacion", "etiquetas", "enlaces", "categoria", "empresa_data_ai", "empresa_top", "empleados", "sueldo", "sueldo_min_eur", "sueldo_max_eur")


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


def insertar(*paths):
    cands = [c for p in paths for c in json.load(open(p))]
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
        c["_nueva"] = True
        nuevas.append(row)
        rows.append(row)
        for l in enl:
            by_url[nurl(l["url"])] = row
    sys.path.insert(0, HERE)
    from sueldo import sueldo_oferta
    for r, c in zip(nuevas, [c for c in cands if c.get("_nueva")]):
        if not r.get("sueldo_min_eur"):
            sd = sueldo_oferta([l["url"] for l in r["enlaces"]], r.get("empresa"), c.get("descripcion") or "")
            if sd:
                r.update(sd)
    emp = {e["nombre"].lower(): e["empleados"] for e in api("GET", "empleo_empresas?select=nombre,empleados") if e.get("empleados")}
    for r in nuevas:
        r["empleados"] = r.get("empleados") or emp.get((r.get("empresa") or "").lower())
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


UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
CERRADA = re.compile(r"no longer accepting applications|no longer available|this job (is|has) (closed|expired)|job (has )?expired|"
                     r"position (has been )?(filled|closed)|job not found|page not found|posting (is )?closed|"
                     r"ya no (está|esta) disponible|oferta (cerrada|caducada)|vacante cerrada", re.I)
_cache = {}


def _http(url, accept="application/json"):
    """(código, url_final, cuerpo) sin lanzar excepciones."""
    try:
        out = subprocess.run(["curl", "-sL", "-m", "30", "-A", UA["User-Agent"], "-H", f"Accept: {accept}",
                              "-w", "\n%{http_code} %{url_effective}", url], capture_output=True, text=True).stdout
        body, meta = out.rsplit("\n", 1)
        code, eff = meta.split(" ", 1)
        return int(code), eff, body
    except Exception:
        return 0, url, ""


def _json(url):
    code, _, body = _http(url)
    try:
        return code, json.loads(body)
    except Exception:
        return code, None


def _gh_token(empresa):
    if "gh" not in _cache:
        _cache["gh"] = {e["nombre"].lower(): e["ats_token"] for e in
                        api("GET", "empleo_empresas?select=nombre,ats,ats_token&ats=eq.greenhouse")}
    return _cache["gh"].get((empresa or "").lower())


def estado(url, empresa=None):
    """True = viva, False = cerrada, None = no concluyente. Usa la API de cada portal."""
    h = re.sub(r"^https?://", "", url).split("/")[0].lower()
    m = re.search(r"greenhouse\.io/([^/]+)/jobs/(\d+)", url) or None
    gh_id = re.search(r"[?&]gh_jid=(\d+)", url)
    if m or gh_id:
        tok, jid = (m.group(1), m.group(2)) if m else (_gh_token(empresa) or h.split(".")[-2], gh_id.group(1))
        code, _, _ = _http(f"https://boards-api.greenhouse.io/v1/boards/{tok}/jobs/{jid}")
        return True if code == 200 else False if code == 404 else None
    m = re.search(r"jobs\.ashbyhq\.com/([^/]+)/([0-9a-f-]{36})", url)
    if m:
        org, jid = m.groups()
        if ("ash", org) not in _cache:
            code, d = _json(f"https://api.ashbyhq.com/posting-api/job-board/{org}")
            _cache[("ash", org)] = {j["id"] for j in d.get("jobs", [])} if d else None
        ids = _cache[("ash", org)]
        return None if ids is None else jid in ids
    m = re.search(r"jobs(\.eu)?\.lever\.co/([^/]+)/([0-9a-f-]{36})", url)
    if m:
        eu, org, jid = m.groups()
        code, _, _ = _http(f"https://api{'.eu' if eu else ''}.lever.co/v0/postings/{org}/{jid}")
        return True if code == 200 else False if code == 404 else None
    m = re.search(r"([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com/(?:[a-z]{2}-[A-Z]{2}/)?([^/]+)(/job/.+?)(?:[?#]|$)", url)
    if m:
        ten, wd, site, path = m.groups()
        # Lo más fiable: buscar la referencia (p. ej. JR357442) en el buscador del propio portal.
        ref = re.search(r"_([A-Za-z]*-?\d{4,}[A-Za-z0-9]*)(?:-\d+)?$", path)
        if ref:
            try:
                out = subprocess.run(["curl", "-s", "-m", "30", "-X", "POST", "-A", UA["User-Agent"],
                                      "-H", "Content-Type: application/json", "-H", "Accept: application/json",
                                      f"https://{ten}.{wd}.myworkdayjobs.com/wday/cxs/{ten}/{site}/jobs",
                                      "-d", json.dumps({"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": ref.group(1)})],
                                     capture_output=True, text=True).stdout
                d = json.loads(out)
                if "total" in d:
                    return any(ref.group(1).lower() in j.get("externalPath", "").lower() for j in d.get("jobPostings", []))
            except Exception:
                pass
        code, d = _json(f"https://{ten}.{wd}.myworkdayjobs.com/wday/cxs/{ten}/{site}{path}")
        if code == 200 and d and d.get("jobPostingInfo"):
            return bool(d["jobPostingInfo"].get("canApply", True))
        return False if code in (404, 410) or (code == 200 and d is not None) else None
    m = re.search(r"smartrecruiters\.com/([^/]+)/(\d+)", url)
    if m:
        code, d = _json(f"https://api.smartrecruiters.com/v1/companies/{m.group(1)}/postings/{m.group(2)}")
        return True if code == 200 and d and d.get("active", True) else False if code in (200, 404) else None
    m = re.search(r"apply\.careers\.microsoft\.com/careers/job/(\d+)", url)
    if m:
        code, d = _json(f"https://apply.careers.microsoft.com/api/pcsx/position_details?position_id={m.group(1)}&domain=microsoft.com&hl=en")
        st = (d or {}).get("status")
        return True if st == 200 else False if st == 404 else None
    m = re.search(r"linkedin\.com/jobs/view/(?:[^/]*?-)?(\d+)", url)
    if m:
        code, eff, body = _http(f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{m.group(1)}", "text/html")
        if code in (404, 410):
            return False
        if code == 200:
            return not (re.search(r"closed-job|No longer accepting applications", body, re.I))
        return None
    if "himalayas.app" in h:
        slug = url.rstrip("/").split("/")[-1]
        code, d = _json("https://himalayas.app/jobs/api/search?q=" + urllib.parse.quote(slug.replace("-", " ")[:80]))
        if not d:
            return None
        return any(slug in (j.get("guid") or "") or slug in (j.get("applicationLink") or "") for j in d.get("jobs", []))
    code, eff, body = _http(url, "text/html")
    if code in (404, 410) or re.search(r"expired|not[-_]found|/404|error=true|closed", eff, re.I):
        return False
    if code == 200:
        txt = re.sub(r"<[^>]+>", " ", body)[:200000]
        return False if CERRADA.search(txt) else True
    return None


def revalidar():
    """Comprueba TODOS los enlaces de cada oferta activa con la API de su portal.
    Enlace oficial (o el único) cerrado -> oferta desactivada (las aplicadas solo se etiquetan).
    Enlaces de agregadores cerrados -> se quitan de la oferta."""
    from concurrent.futures import ThreadPoolExecutor
    rows = api("GET", "empleo_ofertas?select=id,empresa,puesto,url,enlaces,decision,etiquetas&activa=eq.true")
    res = {"vivas": 0, "desactivadas": 0, "enlaces_quitados": 0, "sin_concluir": 0, "aplicadas_cerradas": 0}

    def una(r):
        enl = r.get("enlaces") or [{"label": "Oferta", "url": r["url"]}]
        est = [estado(l["url"], r["empresa"]) for l in enl]
        oficiales = [i for i, l in enumerate(enl) if "oficial" in (l.get("label") or "").lower()] or [0]
        principal = [est[i] for i in oficiales]
        if any(e is True for e in principal) or (all(e is None for e in principal) and any(e is True for e in est)):
            vivos = [l for l, e in zip(enl, est) if e is not False]
            patch = {"verificada_en": HOY}
            if len(vivos) != len(enl):
                patch.update(enlaces=vivos, url=vivos[0]["url"], fuente=vivos[0].get("label"))
                res["enlaces_quitados"] += len(enl) - len(vivos)
            api("PATCH", f"empleo_ofertas?id=eq.{r['id']}", patch, "return=minimal")
            res["vivas"] += 1
        elif all(e is False for e in principal) or all(e is False for e in est):
            if r["decision"] == "aplicada":
                et = list(dict.fromkeys((r.get("etiquetas") or []) + ["oferta cerrada"]))
                api("PATCH", f"empleo_ofertas?id=eq.{r['id']}", {"etiquetas": et}, "return=minimal")
                res["aplicadas_cerradas"] += 1
            else:
                api("PATCH", f"empleo_ofertas?id=eq.{r['id']}", {"activa": False}, "return=minimal")
                res["desactivadas"] += 1
                print(f"[cerrada] {r['empresa']} | {r['puesto']}", file=sys.stderr)
        else:
            res["sin_concluir"] += 1
            print(f"[duda] {r['empresa']} | {r['puesto']} | {est} | {[l['url'] for l in enl]}", file=sys.stderr)

    def segura(r):
        try:
            una(r)
        except Exception as e:  # fallo de red puntual: no tumbar toda la revalidación
            res["sin_concluir"] += 1
            print(f"[error] {r['empresa']} | {r['puesto']} | {e}", file=sys.stderr)

    with ThreadPoolExecutor(8) as ex:
        list(ex.map(segura, rows))
    print(json.dumps(res))


def para_resumir(path):
    """Exporta las ofertas activas que aún no ha revisado una IA (resumen en español,
    modalidad confirmada, empleados) para que la rutina las complete."""
    rows = api("GET", "empleo_ofertas?select=id,empresa,puesto,ubicacion,modalidad,remoto_claro,resumen,empleados,"
                      "categoria,url,enlaces&activa=eq.true&revisada_ia=eq.false")
    out = [{k: r[k] for k in ("id", "empresa", "puesto", "ubicacion", "modalidad", "remoto_claro", "resumen",
                              "empleados", "categoria")} | {"url": (r["enlaces"] or [{"url": r["url"]}])[0]["url"]}
           for r in rows]
    json.dump(out, open(path, "w"), ensure_ascii=False, indent=0)
    print(json.dumps({"para_resumir": len(out)}))


def aplicar_resumenes(*paths):
    """Aplica [{id, resumen, modalidad?, remoto_claro?, activa?, empleados?}] y marca revisada_ia."""
    ok_emp = {"1-50", "51-200", "201-1K", "1K-5K", "5K-10K", "10K-50K", "50K+"}
    n = 0
    for p in paths:
        for r in json.load(open(p)):
            patch = {k: r[k] for k in ("resumen", "modalidad", "remoto_claro", "activa") if r.get(k) is not None}
            if r.get("empleados") in ok_emp:
                patch["empleados"] = r["empleados"]
            patch["revisada_ia"] = True
            api("PATCH", f"empleo_ofertas?id=eq.{r['id']}", patch, "return=minimal")
            n += 1
    print(json.dumps({"aplicados": n}))


def limpiar_regla():
    """Retira (activa=false) las PENDIENTES que, con la modalidad ya confirmada, no cumplen la regla:
    no remotas -> partner/direccion/ejecutivo solo si Data & AI; sales/arquitecto/devrel solo si Top AI."""
    rows = api("GET", "empleo_ofertas?select=id,empresa,puesto,modalidad,categoria,empresa_data_ai,empresa_top"
                      "&activa=eq.true&decision=eq.pendiente&modalidad=neq.remoto")
    n = 0
    for r in rows:
        bad = not r["empresa_data_ai"] if r["categoria"] in ("partner", "direccion", "ejecutivo") else not r["empresa_top"]
        if bad:
            api("PATCH", f"empleo_ofertas?id=eq.{r['id']}", {"activa": False}, "return=minimal")
            n += 1
    print(json.dumps({"retiradas_por_regla": n}))


if __name__ == "__main__":
    {"insertar": lambda: insertar(*sys.argv[2:]), "revalidar": revalidar,
     "para_resumir": lambda: para_resumir(sys.argv[2]), "aplicar_resumenes": lambda: aplicar_resumenes(*sys.argv[2:]),
     "limpiar_regla": limpiar_regla}[sys.argv[1]]()
