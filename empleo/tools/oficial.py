#!/usr/bin/env python3
"""Enlace oficial de cada oferta: la página de la oferta en el portal de la propia
empresa (su ATS o su web), no la de un agregador (LinkedIn, Himalayas, WWR…).

    python3 empleo/tools/oficial.py rellenar            # activas sin comprobar
    python3 empleo/tools/oficial.py rellenar --todas    # recalcula todas las activas
    python3 empleo/tools/oficial.py pendientes /tmp/r/sin_oficial.json   # lo que queda para buscar a mano
    python3 empleo/tools/oficial.py aplicar /tmp/r/oficial_out*.json     # [{id, url_empresa|null, nota}]

Columnas: url_empresa (enlace oficial), url_empresa_estado ('oficial' | 'no_encontrado'),
url_empresa_nota (cómo se encontró o por qué no).
Pasos por oferta: 1) algún enlace que ya sea oficial; 2) el portal de la empresa si la
vigilamos (empleo_empresas); 3) detectar su portal (Greenhouse, Ashby, Lever, Workable,
SmartRecruiters, Recruitee) por el nombre y buscar el puesto. Lo que queda, a mano.
"""
import json
import os
import re
import subprocess
import sys
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import guardar as g  # noqa: E402

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
AGREGADOR = re.compile(
    r"linkedin\.com|himalayas\.app|weworkremotely\.com|jobicy\.com|remoteok\.com|remotive\.com|workingnomads\.com|"
    r"arbeitnow\.com|news\.ycombinator\.com|remoterocketship\.com|tecnoempleo\.com|jobs\.workable\.com|"
    r"welcometothejungle\.com|indeed\.|glassdoor\.|infojobs\.net|builtin\.com|builtin[a-z]+\.com|hirebase\.org|"
    r"jobgether\.com|wellfound\.com|otta\.com|dailyremote\.com|remoteleaf\.com|jooble\.|ziprecruiter\.|"
    r"talents\.vaia\.com|studysmarter\.|jobsglitch\.com|cryptojobslist\.com|web3\.career|flexa\.careers|"
    r"getro\.com|careers\.[a-z]+partners\.com|jobs\.[a-z]+ventures\.com|eu-startups\.com|startup\.jobs", re.I)


def es_oficial(url):
    return bool(url) and not AGREGADOR.search(url)


def _http(url, data=None, headers=()):
    cmd = ["curl", "-sL", "-m", "25", "-A", UA]
    for h in headers:
        cmd += ["-H", h]
    if data is not None:
        cmd += ["-X", "POST", "-H", "Content-Type: application/json", "-d", json.dumps(data)]
    try:
        return subprocess.run(cmd + [url], capture_output=True, text=True).stdout
    except Exception:
        return ""


def _j(url, data=None):
    try:
        return json.loads(_http(url, data, ["Accept: application/json"]))
    except Exception:
        return None


# ---------- ofertas de un portal: [(título, url)] ----------
_cache = {}


def jobs(ats, tok):
    k = (ats, tok)
    if k in _cache:
        return _cache[k]
    out = []
    try:
        if ats == "greenhouse":
            d = _j(f"https://boards-api.greenhouse.io/v1/boards/{tok}/jobs") or {}
            out = [(j["title"], j["absolute_url"]) for j in d.get("jobs", [])]
        elif ats == "ashby":
            d = _j(f"https://api.ashbyhq.com/posting-api/job-board/{tok}") or {}
            out = [(j["title"], j["jobUrl"]) for j in d.get("jobs", [])]
        elif ats == "lever":
            for host in ("api", "api.eu"):
                d = _j(f"https://{host}.lever.co/v0/postings/{tok}?mode=json")
                if isinstance(d, list) and d:
                    out = [(j["text"], j["hostedUrl"]) for j in d]
                    break
        elif ats == "workable":
            d = _j(f"https://apply.workable.com/api/v1/widget/accounts/{tok}") or {}
            out = [(j["title"], j.get("url") or j.get("shortlink")) for j in d.get("jobs", [])]
        elif ats == "smartrecruiters":
            d = _j(f"https://api.smartrecruiters.com/v1/companies/{tok}/postings?limit=100") or {}
            out = [(j["name"], f"https://jobs.smartrecruiters.com/{tok}/{j['id']}") for j in d.get("content", [])]
        elif ats == "recruitee":
            d = _j(f"https://{tok}.recruitee.com/api/offers/") or {}
            out = [(j["title"], j.get("careers_url")) for j in d.get("offers", [])]
        elif ats == "rippling":
            d = _j(f"https://api.rippling.com/platform/api/ats/v1/board/{tok}/jobs") or []
            out = [(j["name"], j["url"]) for j in d] if isinstance(d, list) else []
    except Exception:
        out = []
    _cache[k] = [(t, u) for t, u in out if t and u]
    return _cache[k]


def workday_buscar(tok, puesto):
    host, site = tok.split("/", 1)
    api = f"https://{host}/wday/cxs/{host.split('.')[0]}/{site}/jobs"
    d = _j(api, {"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": puesto}) or {}
    return [(j.get("title", ""), f"https://{host}/{site}{j.get('externalPath', '')}") for j in d.get("jobPostings", [])]


def _pal(s):
    s = re.sub(r"\([^)]*\)", " ", (s or "").lower())
    return {w for w in re.findall(r"[a-z0-9]+", s) if len(w) > 2 or w in ("ai", "ml", "eu", "uk", "vp", "gm")} - {
        "remote", "remoto", "spain", "madrid", "barcelona", "emea", "europe", "the", "and", "for", "with", "based", "hybrid"}


def casar(puesto, lista):
    """La oferta de la lista que es ese puesto: título igual (salvo ubicación) o muy parecido y sin empate."""
    pt = g._pto(puesto)
    for t, u in lista:
        if g._pto(t) == pt and len(pt) >= 6:
            return u
    pw = _pal(puesto)
    if not pw:
        return None
    sc = sorted(((len(pw & _pal(t)) / len(pw | _pal(t)), u) for t, u in lista if _pal(t)), reverse=True)
    if sc and sc[0][0] >= 0.75 and (len(sc) == 1 or sc[0][0] - sc[1][0] >= 0.15):
        return sc[0][1]
    return None


# ---------- detectar el portal de una empresa por su nombre ----------
_portal = {}


def slugs(nombre):
    n = re.sub(r"\(.*?\)", "", nombre or "").strip()
    n = re.sub(r"\b(inc|llc|ltd|gmbh|s\.?l\.?|s\.?a\.?|corp(oration)?|group|technologies|technology|labs?|ai|hq|software)\b\.?", "", n, flags=re.I).strip(" ,.-")
    base = [n, nombre or ""]
    out = []
    for b in base:
        b = b.lower()
        for s in (re.sub(r"[^a-z0-9]", "", b), re.sub(r"[^a-z0-9]+", "-", b).strip("-"), (re.findall(r"[a-z0-9]+", b) or [""])[0]):
            if len(s) >= 3 and s not in out:
                out.append(s)
    return out[:4]


def detectar_portal(nombre):
    k = g.norm(nombre)
    if k in _portal:
        return _portal[k]
    res = None
    for s in slugs(nombre):
        for ats in ("greenhouse", "ashby", "lever", "smartrecruiters", "recruitee", "workable"):
            if jobs(ats, s):
                res = (ats, s)
                break
        if res:
            break
    _portal[k] = res
    return res


# ---------- una oferta ----------
def resolver(o, emps):
    enl = [l["url"] for l in (o.get("enlaces") or [])] + [o.get("url")]
    for u in enl:
        if es_oficial(u):
            return u, "enlace del portal de la empresa"
    e = emps.get(g.norm(o["empresa"])) or next((v for kk, v in emps.items() if len(kk) >= 4 and (kk.startswith(g.norm(o["empresa"])) or g.norm(o["empresa"]).startswith(kk)) and min(len(kk), len(g.norm(o["empresa"]))) >= 4), None)
    if e and e.get("ats") == "workday" and e.get("ats_token"):
        u = casar(o["puesto"], workday_buscar(e["ats_token"], o["puesto"]))
        if u:
            return u, "encontrada en el Workday de la empresa"
    if e and e.get("ats") in ("greenhouse", "ashby", "lever", "workable", "smartrecruiters", "recruitee", "rippling") and e.get("ats_token"):
        u = casar(o["puesto"], jobs(e["ats"], e["ats_token"]))
        if u:
            return u, f"encontrada en el portal de la empresa ({e['ats']})"
    p = detectar_portal(o["empresa"])
    if p:
        u = casar(o["puesto"], jobs(*p))
        if u:
            return u, f"encontrada en el portal de la empresa ({p[0]})"
    return None, ("portal de la empresa detectado (%s), pero el puesto no aparece: puede estar cerrado" % p[0]) if p else "sin portal automático: buscar a mano"


def rellenar(todas=False):
    q = "empleo_ofertas?select=id,empresa,puesto,url,enlaces&activa=eq.true"
    if not todas:
        q += "&url_empresa_estado=is.null"
    rows = g.api("GET", q)
    emps = {g.norm(e["nombre"]): e for e in g.api("GET", "empleo_empresas?select=nombre,ats,ats_token")}
    c = {"oficial": 0, "sin": 0}

    def una(o):
        try:
            u, nota = resolver(o, emps)
        except Exception as ex:
            u, nota = None, f"error: {ex}"[:120]
        patch = {"url_empresa": u, "url_empresa_estado": "oficial" if u else None, "url_empresa_nota": nota}
        g.api("PATCH", f"empleo_ofertas?id=eq.{o['id']}", patch, "return=minimal")
        c["oficial" if u else "sin"] += 1

    with ThreadPoolExecutor(8) as ex:
        list(ex.map(una, rows))
    print(json.dumps({"revisadas": len(rows), **c}))


def pendientes(path):
    rows = g.api("GET", "empleo_ofertas?select=id,empresa,puesto,ubicacion,url,enlaces,url_empresa_nota,decision"
                        "&activa=eq.true&url_empresa_estado=is.null")
    json.dump([{"id": r["id"], "empresa": r["empresa"], "puesto": r["puesto"], "ubicacion": r["ubicacion"],
                "enlaces": [l["url"] for l in (r["enlaces"] or [{"url": r["url"]}])], "pista": r["url_empresa_nota"]}
               for r in rows], open(path, "w"), ensure_ascii=False, indent=0)
    print(json.dumps({"pendientes": len(rows)}))


def aplicar(*paths):
    n = s = 0
    for p in paths:
        for d in json.load(open(p)):
            u = d.get("url_empresa")
            ok = bool(u) and es_oficial(u)
            g.api("PATCH", f"empleo_ofertas?id=eq.{d['id']}", {
                "url_empresa": u if ok else None, "url_empresa_estado": "oficial" if ok else "no_encontrado",
                "url_empresa_nota": (d.get("nota") or ("encontrada a mano" if ok else "no está en la web de la empresa"))[:200]},
                "return=minimal")
            n += ok
            s += not ok
    print(json.dumps({"oficiales": n, "no_encontrado": s}))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "rellenar":
        rellenar("--todas" in sys.argv)
    elif cmd == "pendientes":
        pendientes(sys.argv[2])
    elif cmd == "aplicar":
        aplicar(*sys.argv[2:])
    else:
        print(__doc__)
