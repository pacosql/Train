#!/usr/bin/env python3
"""Adaptadores para las compañías de empleo_empresas con ats == "web".

    import portales_web
    ofertas = portales_web.web(EMPRESAS)      # mismo formato que portales()

Devuelve dicts (puesto, ubicacion, url, descripcion, fecha, workplace,
empresa, empresa_data_ai, empresa_top, sector, fuente) SOLO de ofertas cuyo
título pasa categoria(); evaluar() de buscar.py decide después la regla de
ubicación/modalidad. Reutiliza get/text/categoria/regex de buscar.py.

Método por compañía (ver ADAPTADORES): API/RSS/XML públicos siempre que
existen; Playwright (Node + chromium de /opt/pw-browsers) solo cuando no hay
nada mejor (Automattic). Sin cobertura posible: Stratio, Sovrano AI,
Informatica (ver SIN_COBERTURA).

    python3 empleo/tools/portales_web.py [Nombre ...]   # prueba suelta
"""
import html
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.parse
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed

HERE = os.path.dirname(os.path.abspath(__file__))
TOTAL_TIMEOUT = 7 * 60          # toda la función < 8 min
EMPRESA_TIMEOUT = 5 * 60


def _b():
    """Módulo buscar ya cargado (como script o importado) o import perezoso."""
    for n in ("buscar", "__main__"):
        m = sys.modules.get(n)
        if m is not None and hasattr(m, "categoria") and hasattr(m, "portales"):
            return m
    if HERE not in sys.path:
        sys.path.insert(0, HERE)
    import buscar
    return buscar


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def _get(url, *a, **kw):
    return _b().get(url, *a, **kw)


def _cat(t):
    return _b().categoria(t)


def _txt(s, n=4000):
    return _b().text(s, n)


def _elig(loc, desc="", remote=False):
    """Prefiltro de ubicación: España, Europa/EMEA/global o remoto."""
    b = _b()
    return bool(remote or b.SPAIN.search(loc) or b.EUROPE.search(loc) or b.REMOTE.search(loc)
                or b.SPAIN.search((desc or "")[:1500]))


def _detalle(url, n=3500):
    """Texto de la ficha (para modalidad) — solo se pide para ofertas candidatas."""
    try:
        s = _get(url, raw=True)
        s = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", s, flags=re.S)
        return _txt(s, n)
    except Exception:
        return ""


def _wp(s):
    s = (s or "").lower()
    if "remote" in s or "remoto" in s or "teletrab" in s:
        return "remote"
    if "hybrid" in s or "híbrid" in s or "hibrid" in s:
        return "hybrid"
    if "site" in s or "presencial" in s or "office" in s or "in person" in s:
        return "onsite"
    return ""


# ---------- delegados a adaptadores existentes de buscar.py ----------

def _deleg(handler, token):
    def f(e):
        return getattr(_b(), handler)(dict(e, ats=handler, ats_token=token))
    return f


# ---------- Teamtailor RSS (Multiverse, SDG, OpenNebula, Magnific/Freepik) ----------

def _teamtailor(url):
    def f(e):
        root = ET.fromstring(_get(url, raw=True).encode())
        ns = {"tt": "https://teamtailor.com/locations"}
        out = []
        for it in root.iter("item"):
            title = (it.findtext("title") or "").strip()
            if not _cat(title):
                continue
            locs = []
            for l in it.findall("tt:locations/tt:location", ns):
                locs.append(", ".join(filter(None, [l.findtext("tt:city", namespaces=ns), l.findtext("tt:country", namespaces=ns)])))
            rs = (it.findtext("remoteStatus") or "").strip().lower()
            loc = " / ".join(dict.fromkeys(filter(None, locs)))
            if rs in ("remote", "fully", "full"):
                loc = (loc + " (Remote)").strip()
            if not _elig(loc, remote=rs == "remote"):
                continue
            try:
                fecha = time.strftime("%Y-%m-%d", time.strptime((it.findtext("pubDate") or "")[:25].strip(), "%a, %d %b %Y %H:%M:%S"))
            except Exception:
                fecha = ""
            out.append(dict(puesto=title, ubicacion=loc, url=(it.findtext("link") or "").strip(),
                            workplace=_wp(rs), fecha=fecha, descripcion=_txt(it.findtext("description"))))
        return out
    return f


# ---------- Personio XML (QUIBIM) ----------

def _personio(sub):
    def f(e):
        root = ET.fromstring(_get(f"https://{sub}.jobs.personio.com/xml", raw=True).encode())
        out = []
        for p in root.iter("position"):
            title = (p.findtext("name") or "").strip()
            if not _cat(title):
                continue
            offs = [p.findtext("office")] + [o.text for o in p.findall("additionalOffices/office")]
            loc = " / ".join(filter(None, offs)) + (f" ({p.findtext('subcompany')})" if p.findtext("subcompany") else "")
            desc = " ".join(_txt(v.text, 3000) for v in p.findall("jobDescriptions/jobDescription/value"))
            out.append(dict(puesto=title, ubicacion=loc, url=f"https://{sub}.jobs.personio.com/job/{p.findtext('id')}",
                            fecha=(p.findtext("createdAt") or "")[:10], descripcion=desc[:4000]))
        return out
    return f


# ---------- Oracle HCM (Oracle, Dell) ----------

def _oracle_hcm(host, site, job_url):
    def f(e):
        items = []
        for off in range(0, 6000, 200):
            u = (f"https://{host}/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true"
                 f"&expand=requisitionList.secondaryLocations&finder=findReqs;siteNumber={site},limit=200,offset={off},"
                 "sortBy=POSTING_DATES_DESC")
            d = _get(u)["items"][0]
            r = d.get("requisitionList", [])
            items += r
            if len(r) < 200 and off + len(r) >= d.get("TotalJobsCount", 0):
                break
            if not r:
                break
        out = []
        for r in items:
            title = r.get("Title", "")
            if not _cat(title):
                continue
            sec = " / ".join(s.get("Name", "") for s in r.get("secondaryLocations") or [])
            loc = " / ".join(filter(None, [r.get("PrimaryLocation"), sec]))
            wt = (r.get("WorkplaceType") or r.get("WorkplaceTypeCode") or "")
            remote = "remote" in wt.lower()
            if not (r.get("PrimaryLocationCountry") == "ES" or _elig(loc, remote=remote)):
                continue
            out.append(dict(puesto=title, ubicacion=loc + (" (Remote)" if remote else ""), url=job_url.format(id=r["Id"]),
                            workplace=_wp(wt), fecha=(r.get("PostedDate") or "")[:10],
                            descripcion=_txt(r.get("ShortDescriptionStr"))))
        return out
    return f


# ---------- IBM careers (API de búsqueda) ----------

def ibm(e):
    out, seen = [], set()
    src = ["title", "url", "description", "dcdate", "field_keyword_05", "field_keyword_17", "field_keyword_19", "field_text_01"]
    for off in range(0, 4000, 100):
        body = json.dumps({"appId": "careers", "scopes": ["careers2"], "query": {"bool": {"must": []}}, "size": 100,
                           "from": off, "sort": [{"dcdate": "desc"}], "lang": "zz", "localeSelector": {},
                           "sm": {"query": "", "lang": "zz"}, "_source": src}).encode()
        d = _get("https://www-api.ibm.com/search/api/v2/", body, {"Content-Type": "application/json"})
        hits = d["hits"]["hits"]
        for h in hits:
            j = h["_source"]
            title = j.get("title", "")
            if not _cat(title) or j.get("url") in seen:
                continue
            loc = f"{j.get('field_keyword_19', '')} {j.get('field_keyword_05', '')}".strip()
            wp = j.get("field_keyword_17", "")
            if not _elig(loc, remote="remote" in wp.lower()):
                continue
            seen.add(j.get("url"))
            out.append(dict(puesto=title, ubicacion=loc, url=j["url"], workplace=_wp(wp), fecha=j.get("dcdate", ""),
                            descripcion=_txt(j.get("description"))))
        if len(hits) < 100:
            break
    return out


# ---------- ServiceNow (feed XML de jobs) ----------

def servicenow(e):
    root = ET.fromstring(_get("https://careers.servicenow.com/jobs/xml/?rss=true", raw=True).encode())
    out = []
    for j in root.iter("job"):
        g = lambda t: (j.findtext(t) or "").strip()
        title = g("title")
        if not _cat(title):
            continue
        rt = g("remotetype")
        loc = ", ".join(filter(None, [g("city"), g("state"), g("country")]))
        if not _elig(loc, remote="remote" in rt.lower()):
            continue
        out.append(dict(puesto=title, ubicacion=loc + (" (Remote)" if "remote" in rt.lower() else ""), url=g("url"),
                        workplace=_wp(rt), fecha=time.strftime("%Y-%m-%d", time.strptime(g("date")[:16], "%a, %d %b %Y")) if g("date") else "",
                        descripcion=_txt(g("description"))))
    return out


# ---------- Capgemini ----------

def capgemini(e):
    out = []
    for page in range(1, 10):
        d = _get(f"https://cg-jobstream-api.azurewebsites.net/api/job-search?country_code=es-es&page={page}&size=100")
        for j in d.get("data", []):
            title = j.get("title", "")
            if not _cat(title):
                continue
            url = j.get("apply_job_url") or ""
            if not url or url == "None":
                continue
            out.append(dict(puesto=title, ubicacion=f"{j.get('location', '')}, Spain", url=url,
                            fecha=(j.get("updated_at") or "")[:10], descripcion=_txt(j.get("description_stripped"))))
        if page * 100 >= d.get("total", 0):
            break
    return out


# ---------- SuccessFactors (SAP careers.sap.com, Denodo) ----------

def _sf(base, loc_param=""):
    def f(e):
        out, seen = [], set()
        for start in range(0, 1500, 25):
            s = _get(f"{base}/search/?createNewAlert=false&q={loc_param}&startrow={start}", raw=True)
            rows = re.findall(r'<tr class="data-row.*?</tr>', s, re.S)
            nuevos = 0
            for r in rows:
                m = re.search(r'<a href="([^"]+)" class="jobTitle-link">(.*?)</a>', r, re.S)
                if not m or m.group(1) in seen:
                    continue
                seen.add(m.group(1))
                nuevos += 1
                title = html.unescape(m.group(2)).strip()
                if not _cat(title):
                    continue
                l = re.search(r'class="colLocation[^>]*>\s*<span class="jobLocation">\s*(.*?)\s*</span>', r, re.S)
                loc = html.unescape(l.group(1)).strip() if l else ""
                url = urllib.parse.urljoin(base + "/", html.unescape(m.group(1)))
                if not _elig(loc):
                    continue
                out.append(dict(puesto=title, ubicacion=loc, url=url, descripcion=_detalle(url)))
            if not nuevos:
                break
        return out
    return f


# ---------- Nutanix (Jobvite) ----------

def nutanix(e):
    out, seen = [], set()
    for p in range(0, 12):
        s = _get(f"https://jobs.jobvite.com/nutanix/search?q=&p={p}", raw=True)
        rows = re.findall(r'<td class="jv-job-list-name">\s*<a href="(/nutanix/job/[^"]+)">(.*?)</a>.*?'
                          r'<td class="jv-job-list-location">(.*?)</td>', s, re.S)
        nuevos = 0
        for href, title, loc in rows:
            if href in seen:
                continue
            seen.add(href)
            nuevos += 1
            title, loc = html.unescape(title).strip(), re.sub(r"\s+", " ", html.unescape(loc)).strip()
            if not _cat(title) or not _elig(loc):
                continue
            url = "https://jobs.jobvite.com" + href
            out.append(dict(puesto=title, ubicacion=loc, url=url, descripcion=_detalle(url)))
        if not nuevos:
            break
    return out


# ---------- Teradata (GraphQL gr8people) ----------

def _teradata_vars():
    v = {"query": "", "filters": {"location": [], "workplaceType": [], "jobCategory": [], "positionType": []}}
    names = ["PositionTitle", "EmploymentType", "JobCategory", "ClassificationType", "GradeLevel", "Recruiter",
             "HiringManager", "CurrencyCode", "NumPositionsOpen", "SalaryRange", "PrimaryLocation"]
    names += [f"UserDefined{i}" for i in range(1, 46)] + ["UserDefinedBit1"]
    names += [f"UserDefinedDecimal{i}" for i in list(range(1, 26)) + [50, 51]]
    names += [f"UserDefined{t}Text{i}" for t in ("Small", "Medium", "Large") for i in range(1, 6)]
    v.update({"has" + n: False for n in names})
    return v


def teradata(e):
    out = []
    for start in range(0, 600, 100):
        v = _teradata_vars()
        v.update(first=100, start=start)
        body = json.dumps({"operationName": "searchJobs", "variables": v, "extensions": {"trustedDocument": {"id": "search-google-jobs"}}}).encode()
        d = _get("https://careers.teradata.com/graphql", body, {"Content-Type": "application/json", "apollo-require-preflight": "true"})
        nodes = d["data"]["searchJobs"]["results"]["nodes"]
        for n in nodes:
            title = n.get("title", "")
            if not _cat(title):
                continue
            places = " / ".join(p["name"] for p in n["places"]["nodes"]) or n["primaryPlace"]["name"]
            wt = n.get("workplaceType") or ""
            if not _elig(places, remote=wt == "REMOTE"):
                continue
            slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
            out.append(dict(puesto=title, ubicacion=places + (" (Remote)" if wt == "REMOTE" else ""),
                            url=f"https://careers.teradata.com/jobs/{n['key']}/{slug}", workplace=_wp(wt),
                            fecha=(n.get("postedOn") or "")[:10], descripcion=_txt(n.get("descriptionHTML"))))
        if len(nodes) < 100:
            break
    return out


# ---------- NTT DATA (Phenom widgets, filtro país España) ----------

def nttdata(e):
    out, seen = [], set()
    for frm in range(0, 1500, 100):
        body = json.dumps({"lang": "en_global", "deviceType": "desktop", "country": "global", "pageName": "search-results",
                           "ddoKey": "refineSearch", "sortBy": "Most recent", "subsearch": "", "from": frm, "jobs": True,
                           "counts": True, "all_fields": ["category", "country", "city"], "size": 100, "clearAll": False,
                           "jdsource": "facets", "isSliderEnable": False, "pageId": "page337", "siteType": "external",
                           "keywords": "", "global": True, "selected_fields": {"country": ["Spain"]},
                           "locationData": {}}).encode()
        d = _get("https://careers.nttdata.com/widgets", body, {"Content-Type": "application/json"})["refineSearch"]
        jobs = d["data"]["jobs"]
        for j in jobs:
            if j.get("country") != "Spain" or j["jobId"] in seen:
                continue
            seen.add(j["jobId"])
            if not _cat(j["title"]):
                continue
            url = (j.get("applyUrl") or "").split("?")[0] or f"https://careers.nttdata.com/global/en/job/{j['jobId']}"
            out.append(dict(puesto=j["title"], ubicacion=j.get("location") or "Spain", url=url,
                            workplace=_wp(j.get("RemoteType")), fecha=(j.get("postedDate") or "")[:10],
                            descripcion=_txt(j.get("descriptionTeaser"))))
        if len(jobs) < 100 or frm + 100 >= d.get("totalHits", 0):
            break
    return out


# ---------- SAS (iCIMS) ----------

def sas(e):
    out, seen = [], set()
    for pr in range(0, 40):
        s = _get(f"https://globalcareers-sas.icims.com/jobs/search?ss=1&in_iframe=1&pr={pr}", raw=True)
        cards = s.split('class="iCIMS_JobCardItem"')[1:]
        for c in cards:
            m = re.search(r'<a href="([^"]+)" class="iCIMS_Anchor"[^>]*>.*?<h3[^>]*>(.*?)</h3>', c, re.S)
            if not m:
                continue
            url = html.unescape(m.group(1)).split("?")[0]
            title = html.unescape(m.group(2)).strip()
            if url in seen:
                continue
            seen.add(url)
            f = {k.strip(): re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", v))).strip() for k, v in
                 re.findall(r'<dt class="iCIMS_JobHeaderField">(.*?)</dt>\s*<dd class="iCIMS_JobHeaderData">(.*?)</dd>', c, re.S)}
            country = next((v for k, v in f.items() if "Country" in k), "")
            city = next((v for k, v in f.items() if k.strip() == "City"), "")
            loc = ", ".join(filter(None, [city, country]))
            if not _cat(title) or not _elig(loc):
                continue
            out.append(dict(puesto=title, ubicacion=loc, url=url, descripcion=_detalle(url)))
        if not cards or "iCIMS_JobCardItem" not in s:
            break
    return out


# ---------- HiBob (lista Comeet en su web) ----------

def hibob(e):
    s = _get("https://www.hibob.com/careers/", raw=True)
    out = []
    for href, title, meta in re.findall(r'<a class="comeet-position[^"]*" href="([^"]+)"[^>]*>\s*<span[^>]*>(.*?)</span>\s*<span[^>]*>(.*?)</span>', s, re.S):
        title, meta = html.unescape(title).strip(), html.unescape(meta).strip()
        if not _cat(title):
            continue
        loc = meta.split("|")[-1].strip()
        if not _elig(loc):
            continue
        out.append(dict(puesto=title, ubicacion=loc, url=href, descripcion=_detalle(href)))
    return out


# ---------- Factorial ATS (Factorial, Tucuvi) ----------

def _factorial(base):
    def f(e):
        s = _get(base + "/", raw=True)
        out = []
        for blk in re.split(r"<h3[^>]*>", s)[1:]:
            loc = html.unescape(re.sub(r"<[^>]+>", "", blk.split("</h3>")[0])).strip()
            for li in re.findall(r"<li class='job-offer-item.*?</li>", blk, re.S):
                url = re.search(r"data-job-postings-url='([^']+)'", li)
                divs = [re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", d))).strip()
                        for d in re.findall(r'<div class="text-[^"]*">(.*?)</div>', li, re.S)]
                if not url or not divs or not _cat(divs[0]):
                    continue
                remote = "data-is-remote='true'" in li
                mod = divs[2] if len(divs) > 2 else ""
                if not _elig(loc, remote=remote or "remote" in mod.lower()):
                    continue
                out.append(dict(puesto=divs[0], ubicacion=loc + (" (Remote)" if remote else ""), url=url.group(1),
                                workplace="remote" if remote else _wp(mod), descripcion=_detalle(url.group(1))))
        return out
    return f


# ---------- Booksy (API propia de su web de empleo) ----------

def booksy(e):
    d = _get("https://careers.booksy.com/api/jobs?limit=100&offset=0&source=advSearch&internal=0")
    out = []
    for j in d.get("jobs", []):
        title = j.get("job_title", "")
        if not _cat(title):
            continue
        loc = j.get("formatted_address") or ", ".join(filter(None, [j.get("location_city"), j.get("location_country")]))
        if not _elig(loc):
            continue
        out.append(dict(puesto=title, ubicacion=loc, url=j["job_url"], descripcion=_txt(j.get("description"))))
    return out


# ---------- Keepler (Manatal careers-page) ----------

def keepler(e):
    d = _get("https://www.careers-page.com/api/v1.0/c/keepler/jobs/?page_size=100")
    out = []
    for j in d.get("results", []):
        title = j.get("position_name") or j.get("title") or ""
        if not _cat(title):
            continue
        loc = j.get("location_display") or ", ".join(filter(None, [j.get("city"), j.get("country")])) or "Spain"
        out.append(dict(puesto=title, ubicacion=loc, url=f"https://www.careers-page.com/keepler/job/{j.get('hash')}",
                        fecha=(j.get("created_at") or "")[:10], descripcion=_txt(j.get("description"))))
    return out


# ---------- Sngular (HTML con JSON-LD de migas) ----------

def sngular(e):
    s = _get("https://www.sngular.com/es/talento-y-cultura/jobs", raw=True)
    out = []
    for name, item in re.findall(r'"name":\s*"([^"]+)",\s*"item":\s*"(/es/talento-y-cultura/jobs/\d+/[^"]+)"', s):
        title = html.unescape(name)
        if not _cat(title):
            continue
        url = "https://www.sngular.com" + item
        d = _detalle(url)
        m = re.search(r"Ubicaci[oó]n\s+(.{0,60}?)\s+Remoto", d)
        loc = (m.group(1) if m else "") or "Spain"
        out.append(dict(puesto=title, ubicacion=loc, url=url, descripcion=d))
    return out


# ---------- Playwright (Node) — solo cuando no hay API ----------

PW_JS = r"""
const { chromium } = require('playwright');
(async () => {
  const [url, wait, expr] = [process.argv[2], +process.argv[3], process.argv[4]];
  const b = await chromium.launch({ executablePath: process.env.PW_CHROME, headless: true, args: ['--no-sandbox'] });
  const p = await (await b.newContext({ locale: 'en-US', userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36' })).newPage();
  try { await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); } catch (e) {}
  await p.waitForTimeout(wait);
  console.log(JSON.stringify(await p.evaluate(expr)));
  await b.close();
})();
"""


def _pw_eval(url, expr, wait_ms=7000):
    import glob
    chrome = next(iter(sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome"))), None)
    mods = next((p for p in ("/opt/node-tools/node_modules", "/opt/node22/lib/node_modules", "/usr/lib/node_modules",
                             "/usr/local/lib/node_modules") if os.path.isdir(os.path.join(p, "playwright"))), None)
    if not chrome or not mods:
        raise RuntimeError("Playwright/chromium no disponibles")
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False) as f:
        f.write(PW_JS)
    try:
        r = subprocess.run(["node", f.name, url, str(wait_ms), expr], capture_output=True, text=True, timeout=120,
                           env=dict(os.environ, NODE_PATH=mods, PW_CHROME=chrome))
    finally:
        os.unlink(f.name)
    if r.returncode:
        raise RuntimeError(r.stderr[-300:])
    return json.loads(r.stdout.strip().splitlines()[-1])


def automattic(e):
    """100 % remoto y global: la lista se pinta con JS (sin API pública)."""
    rows = _pw_eval("https://automattic.com/work-with-us/jobs/",
                    "[...document.querySelectorAll('a[href*=\"/work-with-us/job/\"]')].map(a=>{let c=a;"
                    "while(c.parentElement&&c.parentElement.querySelectorAll('a[href*=\"/work-with-us/job/\"]').length"
                    "===document.querySelectorAll('a[href='+JSON.stringify(a.getAttribute('href'))+']').length)c=c.parentElement;"
                    "return {u:a.href,t:c.innerText.split('\\n').map(x=>x.trim()).filter(Boolean)[0]||''}})")
    out, seen = [], set()
    for r in rows:
        if r["u"] in seen:
            continue
        seen.add(r["u"])
        title = r["t"] if r["t"].lower() not in ("apply", "open position") else ""
        if not title:
            title = r["u"].rstrip("/").rsplit("/", 1)[-1].replace("-", " ").title()
        if not _cat(title):
            continue
        out.append(dict(puesto=title, ubicacion="Remote (worldwide, distributed)", url=r["u"], workplace="remote",
                        descripcion="Automattic is fully distributed: remote worldwide. " + _detalle(r["u"], 2500)))
    return out


# ---------- registro ----------

ADAPTADORES = {
    # ATS real ya soportado por buscar.py -> conviene cambiar ats/ats_token en empleo_empresas
    "Mistral AI": _deleg("ashby", "mistral.ai"),
    "Aleph Alpha": _deleg("ashby", "AlephAlpha"),
    "Mews": _deleg("greenhouse", "mewssystems"),
    "Kyndryl": _deleg("workday", "kyndryl.wd5.myworkdayjobs.com/KyndrylProfessionalCareers"),
    "Cisco (Splunk)": _deleg("workday", "cisco.wd5.myworkdayjobs.com/Cisco_Careers"),
    "Qlik": _deleg("eightfold", "careerhub.qlik.com|qlik.com"),
    "Plain Concepts": _deleg("workable", "plainconcepts"),
    # RSS / XML / API propias
    "Multiverse Computing": _teamtailor("https://multiversecomputing.teamtailor.com/jobs.rss"),
    "SDG Group": _teamtailor("https://careers.sdggroup.com/jobs.rss"),
    "OpenNebula": _teamtailor("https://careers.opennebula.io/jobs.rss"),
    "Freepik": _teamtailor("https://jobs.magnific.com/jobs.rss"),
    "QUIBIM": _personio("quibim"),
    "Oracle": _oracle_hcm("eeho.fa.us2.oraclecloud.com", "CX_45001", "https://careers.oracle.com/en/sites/jobsearch/job/{id}"),
    "Dell Technologies": _oracle_hcm("enterpriseplatform.dell.com", "CX_1001",
                                     "https://enterpriseplatform.dell.com/hcmUI/CandidateExperience/en/sites/careers/job/{id}"),
    "IBM": ibm,
    "ServiceNow": servicenow,
    "Capgemini": capgemini,
    "SAP": _sf("https://careers.sap.com", "&optionsFacetsDD_country=ES"),
    "Denodo": _sf("https://jobs.denodo.com"),
    "Nutanix": nutanix,
    "Teradata": teradata,
    "NTT DATA": nttdata,
    "SAS": sas,
    "HiBob": hibob,
    "Factorial": _factorial("https://careers.factorial.com"),
    "Tucuvi": _factorial("https://tucuvipeople.factorial.com"),
    "Booksy": booksy,
    "Keepler": keepler,
    "Sngular": sngular,
    # Playwright
    "Automattic": automattic,
}

SIN_COBERTURA = {
    "Stratio": "sin portal público localizable (stratio.com/careers redirige a stratio.ai sin ofertas; solo LinkedIn/Indeed)",
    "Sovrano AI": "solo publica en LinkedIn (requiere login para listar)",
    "Informatica": "adquirida por Salesforce: sus ofertas están en el Workday de Salesforce (ya cubierto, ats=workday)",
}


def web(empresas):
    """Ofertas de las compañías con ats == "web" (mismo formato que portales())."""
    todo = [e for e in empresas if e.get("ats") == "web" and e["nombre"] in ADAPTADORES]
    t0 = time.time()

    def run(e):
        try:
            res = ADAPTADORES[e["nombre"]](e)
        except Exception as ex:
            log(f"[aviso] {e['nombre']}: {type(ex).__name__}: {ex}")
            return e, []
        for o in res:
            o.setdefault("descripcion", "")
            o.setdefault("fecha", "")
            o.update(empresa=e["nombre"], empresa_data_ai=e["data_ai"], empresa_top=bool(e.get("top")), sector=e["sector"],
                     fuente=f"portal oficial {e['nombre']}")
        return e, res

    out = []
    ex = ThreadPoolExecutor(10)
    futs = [ex.submit(run, e) for e in todo]
    try:
        for f in as_completed(futs, timeout=TOTAL_TIMEOUT):
            e, res = f.result()
            log(f"[web] {e['nombre']}: {len(res)}")
            out += res
    except Exception as exn:
        log(f"[aviso] web(): tiempo agotado/parcial ({type(exn).__name__}) tras {time.time() - t0:.0f}s")
    ex.shutdown(wait=False, cancel_futures=True)
    return out


if __name__ == "__main__":
    b = _b()
    nombres = set(sys.argv[1:])
    emps = [e for e in json.load(open(os.path.join(HERE, "empresas.json"))) if e.get("ats") == "web"
            and (not nombres or e["nombre"] in nombres)]
    t = time.time()
    res = web(emps)
    ok = [o for o in (b.evaluar(dict(o)) for o in res) if o]
    from collections import Counter
    log(f"[web] {len(res)} con título válido, {len(ok)} pasan evaluar ({time.time() - t:.0f}s)")
    for n, c in sorted(Counter(o["empresa"] for o in ok).items()):
        log(f"   {n}: {c}")
    json.dump(res, sys.stdout, ensure_ascii=False, indent=1)
