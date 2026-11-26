#!/usr/bin/env python3
"""Ofertas que el usuario ha visto él mismo (tabla empleo_vistas): las que manda el
marcador "📥 Empleo" desde LinkedIn con su sesión, y los enlaces que pega en la app.

    python3 empleo/tools/vistas.py procesar /tmp/r/c_vistas.json   # LinkedIn → candidatas
    python3 empleo/tools/guardar.py insertar /tmp/r/c_vistas.json
    python3 empleo/tools/vistas.py urls /tmp/r/vistas_urls.json    # enlaces sueltos, para revisar a mano
    python3 empleo/tools/vistas.py hecha <id> "<resultado>"

procesar: lee la ficha pública de cada oferta de LinkedIn y decide. Como son búsquedas del
propio usuario, la regla es más abierta: entra si el puesto es de su perfil y es en España o
remoto que admita España, sea la empresa que sea (encaje "visto"). Cada orden < 10 min:
procesa como mucho 150 por llamada; repetir mientras queden.
"""
import importlib.util
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import guardar as g  # noqa: E402


def _buscar():
    spec = importlib.util.spec_from_file_location("buscar", os.path.join(HERE, "buscar.py"))
    b = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(b)
    return b


def _hecha(vid, resultado):
    g.api("PATCH", f"empleo_vistas?id=eq.{vid}", {"procesada": True, "procesada_en": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                                                   "resultado": resultado[:200]}, "return=minimal")


def procesar(path, maximo=150):
    b = _buscar()
    filas = g.api("GET", "empleo_vistas?select=id,jid,titulo,empresa,ubicacion&procesada=eq.false&origen=eq.linkedin&order=id")[:maximo]
    ya = g.api("GET", "empleo_ofertas?select=url,enlaces,decision,activa")
    en_app = {}
    for r in ya:
        for l in (r.get("enlaces") or []) + [{"url": r["url"]}]:
            m = re.search(r"linkedin\.com/jobs/view/(?:[^/?]*-)?(\d+)", l["url"] or "")
            if m:
                en_app[m.group(1)] = r
    out = []

    def una(v):
        if v["jid"] in en_app:
            r = en_app[v["jid"]]
            return _hecha(v["id"], "ya estaba en la app" + ("" if r["activa"] else " (retirada: cerrada o fuera de regla)"))
        try:
            s = b.get(f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{v['jid']}", raw=True)
        except Exception:
            time.sleep(6)
            try:
                s = b.get(f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{v['jid']}", raw=True)
            except Exception as ex:
                return None if "429" in str(ex) else _hecha(v["id"], "no se pudo abrir (cerrada o privada)")
        c = lambda pat: b.html.unescape(re.sub(r"<[^>]+>", "", (re.search(pat, s, re.S) or [None, ""])[1])).strip()
        titulo = c(r'top-card-layout__title[^>]*>(.*?)</h') or v.get("titulo") or ""
        empresa = c(r'topcard__org-name-link[^>]*>(.*?)</a>') or c(r'topcard__flavor"[^>]*>(.*?)</span>') or v.get("empresa") or ""
        lugar = c(r'topcard__flavor topcard__flavor--bullet"[^>]*>(.*?)</span>') or v.get("ubicacion") or ""
        if not titulo or not empresa:
            return _hecha(v["id"], "no se pudo leer la ficha")
        if re.search(r"No longer accepting applications|Ya no se aceptan solicitudes", s):
            return _hecha(v["id"], "cerrada: ya no acepta candidaturas")
        m = re.search(r'show-more-less-html__markup[^>]*>(.*?)</div>', s, re.S)
        o = dict(puesto=titulo, empresa=empresa, ubicacion=lugar, descripcion=b.text(m.group(1)) if m else "",
                 url=f"https://www.linkedin.com/jobs/view/{v['jid']}", fuente="LinkedIn (tu sesión)", consulta="marcador LinkedIn")
        ind = re.findall(r'description__job-criteria-subheader">\s*Industries\s*</h3>\s*<span[^>]*>(.*?)</span>', s, re.S)
        o["empresa_data_ai"] = empresa.lower() in b.DATA_AI_NAMES or bool(b.DATA_AI_HINT.search((b.text(ind[0]) if ind else "") + " " + empresa))
        cat = b.categoria(titulo)
        if not cat:
            return _hecha(v["id"], "fuera de tus perfiles (por el título)")
        r = b.evaluar(dict(o))
        if not r:
            mod = b.modalidad(lugar, o["descripcion"])
            en_es = bool(b.SPAIN.search(lugar))
            rem = mod == "remoto" and (en_es or b.EUROPE.search(lugar) or b.SPAIN.search(o["descripcion"][:3000]))
            if not (en_es or rem):
                return _hecha(v["id"], f"ubicación no compatible con España ({lugar[:60]})")
            r = dict(o, categoria=cat, modalidad=mod, empresa_top=False, remoto_claro=bool(mod == "remoto" and en_es),
                     encaje="visto", encaje_motivo="La viste tú en LinkedIn: perfil y ubicación encajan, la empresa está fuera de la regla")
        r["enlaces"] = [{"label": "LinkedIn (tu sesión)", "url": r["url"]}]
        r["etiquetas"] = ["visto en LinkedIn"]
        r["descripcion"] = (r.get("descripcion") or "")[:1500]
        r.pop("workplace", None)
        out.append(r)
        _hecha(v["id"], "añadida a la app" + (" (fuera de la regla de empresa)" if r.get("encaje") == "visto" else ""))
        time.sleep(0.5)

    with ThreadPoolExecutor(4) as ex:
        list(ex.map(una, filas))
    json.dump(out, open(path, "w"), ensure_ascii=False, indent=0)
    quedan = len(g.api("GET", "empleo_vistas?select=id&procesada=eq.false&origen=eq.linkedin"))
    print(json.dumps({"revisadas": len(filas), "candidatas": len(out), "quedan": quedan}))


def urls(path):
    filas = g.api("GET", "empleo_vistas?select=id,url&procesada=eq.false&origen=eq.url&order=id")
    json.dump(filas, open(path, "w"), ensure_ascii=False, indent=0)
    print(json.dumps({"enlaces_para_revisar_a_mano": len(filas)}))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "procesar":
        procesar(sys.argv[2])
    elif cmd == "urls":
        urls(sys.argv[2])
    elif cmd == "hecha":
        _hecha(sys.argv[2], sys.argv[3])
    else:
        print(__doc__)
