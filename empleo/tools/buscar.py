#!/usr/bin/env python3
"""Busca ofertas para la app Empleo y las deja listas para revisar.

Qué busca:
  - categoria "partner": Partner Program / Partner Management / Alliances /
    Channel / Ecosystem / Partner Enablement…
  - categoria "direccion": CTO y dirección técnica (VP/Head/Director of
    Engineering, Data, AI, Technology; Chief Data/AI Officer…)

Dónde (regla del usuario):
  - REMOTO que admita España: de cualquier empresa.
  - No remoto (España presencial/híbrido): solo empresas de Data & AI.

Fuentes:
  - Portales oficiales de las empresas de empleo/tools/empresas.json
    (APIs públicas de Greenhouse, Ashby, Lever, Workable, SmartRecruiters,
    Workday, Microsoft y Amazon).
  - LinkedIn (búsqueda pública, ubicación España) + ficha de cada oferta.
  - Bolsas de remoto: Remotive y Himalayas.

    python3 empleo/tools/buscar.py > /tmp/candidatas.json

Imprime un array JSON. Cada candidata trae `enlaces` (enlace 1 = portal
oficial cuando existe, luego LinkedIn/agregadores), `modalidad`,
`remoto_claro`, `categoria`, `empresa_data_ai` y un extracto de la
descripción. No escribe en Supabase (eso lo hace la rutina tras revisar).
"""
import html
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
def _empresas():
    """Lista de compañías: la tabla empleo_empresas de Supabase es la fuente de
    verdad (la rutina añade ahí sin necesidad de hacer push); empresas.json es
    la copia de respaldo si Supabase no responde."""
    try:
        cfg = open(os.path.join(HERE, "..", "config.js")).read()
        key = re.search(r'eyJ[^"]*', cfg).group(0)
        url = re.search(r"https://[a-z0-9]*\.supabase\.co", cfg).group(0)
        req = urllib.request.Request(url + "/rest/v1/empleo_empresas?select=nombre,sector,data_ai,top,ats,ats_token,portal_url&activa=eq.true",
                                     headers={"apikey": key, "Authorization": "Bearer " + key})
        with urllib.request.urlopen(req, timeout=30) as r:
            rows = json.load(r)
        if rows:
            return rows
    except Exception as ex:
        print(f"[aviso] empresas desde Supabase: {ex}; uso empresas.json", file=sys.stderr)
    return json.load(open(os.path.join(HERE, "empresas.json")))


EMPRESAS = _empresas()

PARTNER = re.compile(r"partner|alliance|channel|ecosystem|reseller|\bGSI\b|system integrator|\bISV\b", re.I)
PARTNER_NO = re.compile(r"business partner|people partner|hr partner|talent|recruit|\bHR\b|finance partner|payroll|design partner|accountant|counsel|legal|engineer\b|developer|scientist|\bSDR\b|sales development rep|marketing channels?|growth marketing|channel sales representative|product manager|funding|membership|client partner|partner funding|delivery partner|partner site|partner operations analyst|people operations|customer success partner|client success partner|care partner|junior partner|m&a|language|resource partner|customer care|coordinator|influencer|creator|omnichannel|technical lead|health partnership|student|physicist|product success|sales partner –|staffing|sponsorship|care representative|partner success manager ii", re.I)
LEAD = re.compile(r"\bCTO\b|chief technology|chief (data|ai|artificial intelligence|digital|product and technology|information) officer|\bCDO\b|\bCAIO\b|\bVP\b.{0,20}(engineering|technology|data|ai|machine learning|platform)|vice president.{0,20}(engineering|technology|data|ai)|head of (engineering|technology|data|ai|artificial intelligence|machine learning|ml|platform|r&d)|(engineering|technology|data|ai) director|director.{0,40}(engineering|technology|data|ai\b|machine learning|platform)|director de (tecnolog|ingenier|datos|ia\b)|responsable de (tecnolog|ingenier|datos)", re.I)
LEAD_NO = re.compile(r"intern|becari|junior|assistant|recruit|talent|account executive|sales engineer|data ?center|facilities|construction|operations", re.I)
SPAIN = re.compile(r"spain|españa|espana|madrid|barcelona|valencia|m[aá]laga|sevilla|seville|bilbao|zaragoza|alicante|iberia|\bESP\b", re.I)
EUROPE = re.compile(r"emea|europe|european union|\beu\b|southern europe|iberia|cet\b|anywhere|worldwide|global", re.I)
REMOTE = re.compile(r"remote|remoto|teletrabajo|en remoto|work from home|distributed|home[- ]based|home office", re.I)
FULL_REMOTE_ES = re.compile(r"(remote|remoto|teletrabajo)[^.\n]{0,40}(spain|españa|espana)|(spain|españa)[^.\n]{0,30}(remote|remoto)|100\s?% (remote|remoto)|fully remote|full[- ]remote|remote[- ]first|teletrabajo total|remoto total", re.I)
HYBRID = re.compile(r"hybrid|híbrid|hibrid", re.I)
ONSITE = re.compile(r"on[- ]?site|in[- ]office|presencial", re.I)

DEVREL = re.compile(r"developer relations|devrel|developer advocate|advocate|evangelist|developer experience|developer community|community (manager|lead).{0,20}(developer|technical)|developer marketing|technical community", re.I)
ARQ = re.compile(r"solutions? architect|solution engineer|solutions engineer|sales engineer|customer engineer|pre-?sales|field cto|forward[- ]deployed|technical account manager|cloud solution architect|ai architect|technical specialist|solution specialist.{0,30}(technical|architect)|arquitecto de soluciones|ingeniero de preventa|preventa", re.I)
SALES = re.compile(r"account executive|account manager|account director|enterprise sales|strategic account|sales (director|manager|executive|lead|specialist)|business development (manager|director|lead|executive)|go[- ]to[- ]market|\bGTM\b|country (manager|lead|director)|territory manager|client director|commercial (director|lead|manager)|director comercial|ejecutivo de cuentas|gerente de cuentas|digital (solution|sales)|solution (area )?specialist|specialist.{0,20}(sales|azure|ai|cloud|data)|industry (lead|director|executive)|head of sales|vp.{0,10}sales|sales leader|sales representative|adoption (lead|manager|specialist)", re.I)
NEW_NO = re.compile(r"intern|becari|junior|graduate|trainee|\bSDR\b|\bBDR\b|sales development|inside sales|sales operations|sales ops|deal desk|enablement specialist|recruit|talent|support engineer|customer support|software engineer|site reliability|data center|technician|payroll|accounts? (payable|receivable)|finance", re.I)
TOP_NAMES = set()

UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
DATA_AI_NAMES = {e["nombre"].lower() for e in EMPRESAS if e["data_ai"]}
TOP_NAMES = {e["nombre"].lower() for e in EMPRESAS if e.get("top")}
DATA_AI_HINT = re.compile(r"\bAI\b|artificial intelligence|inteligencia artificial|machine learning|\bdata\b|datos|analytics|\bLLM|genai|cloud", re.I)


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def get(url, data=None, headers=None, raw=False, tries=3):
    h = {**UA, "Accept": "text/html" if raw else "application/json"}
    h.update(headers or {})
    for i in range(tries):
        try:
            req = urllib.request.Request(url, data=data, headers=h)
            with urllib.request.urlopen(req, timeout=30) as r:
                b = r.read().decode("utf-8", "replace")
                return b if raw else json.loads(b)
        except urllib.error.HTTPError as e:
            if e.code in (429, 503) and i < tries - 1:
                time.sleep(5 * (i + 1))
                continue
            raise


def text(s, n=4000):
    s = re.sub(r"<[^>]+>", " ", html.unescape(html.unescape(s or "")))
    return re.sub(r"\s+", " ", s).strip()[:n]


def categoria(title):
    """partner | direccion | devrel | arquitecto | sales (o None)."""
    if LEAD.search(title) and not LEAD_NO.search(title):
        return "direccion"
    if re.search(r"partner solutions? architect|partner (sales|technical) (engineer|architect)", title, re.I):
        return "partner"
    if PARTNER.search(title) and not PARTNER_NO.search(title):
        return "partner"
    if NEW_NO.search(title):
        return None
    if DEVREL.search(title):
        return "devrel"
    if ARQ.search(title):
        return "arquitecto"
    if SALES.search(title):
        return "sales"
    return None


def modalidad(loc, desc, workplace=None):
    w = (workplace or "").lower()
    blob = f"{loc} {desc}"
    if w in ("remote",) or re.search(r"remote|remoto", loc, re.I):
        return "remoto"
    if w == "hybrid" or HYBRID.search(loc):
        return "hibrido"
    if FULL_REMOTE_ES.search(desc):
        return "remoto"
    if (EUROPE.search(loc) or SPAIN.search(loc)) and REMOTE.search(desc) and not HYBRID.search(desc):
        return "remoto"
    if HYBRID.search(desc):
        return "hibrido"
    if w in ("onsite", "on-site") or ONSITE.search(loc):
        return "presencial"
    return "desconocido"


def evaluar(o):
    """Decide si la candidata cumple la regla y rellena modalidad/flags."""
    cat = categoria(o["puesto"])
    if not cat:
        return None
    loc, desc = o.get("ubicacion", ""), o.get("descripcion", "")
    mod = modalidad(loc, desc, o.get("workplace"))
    in_spain = bool(SPAIN.search(loc))
    remote_eu = mod == "remoto" and (in_spain or EUROPE.search(loc) or SPAIN.search(desc[:3000]))
    data_ai = o.get("empresa_data_ai")
    if data_ai is None:
        data_ai = o["empresa"].lower() in DATA_AI_NAMES
    top = o.get("empresa_top")
    if top is None:
        top = o["empresa"].lower() in TOP_NAMES
    if cat in ("partner", "direccion"):
        # Remoto que admita España: cualquier empresa. En España no remoto: solo Data & AI.
        ok = remote_eu or (in_spain and data_ai)
    else:
        # Sales / Solution Architect / DevRel: en las TOP todo lo de España + remoto;
        # en el resto de Data & AI, solo remoto que admita España.
        ok = (top and (in_spain or remote_eu)) or (data_ai and remote_eu)
    if not ok:
        return None
    o.update(categoria=cat, modalidad=mod, empresa_data_ai=bool(data_ai), empresa_top=bool(top),
             remoto_claro=bool(mod == "remoto" and (in_spain or re.search(r"spain|españa", desc, re.I))
                               and (REMOTE.search(loc) or REMOTE.search(o["puesto"]) or FULL_REMOTE_ES.search(desc)
                                    or (o.get("workplace") or "").lower() == "remote")))
    return o


# ---------- portales oficiales ----------

def greenhouse(e):
    out = []
    for j in get(f"https://boards-api.greenhouse.io/v1/boards/{e['ats_token']}/jobs?content=true")["jobs"]:
        if not categoria(j["title"]):
            continue
        loc = (j.get("location") or {}).get("name", "")
        loc += " / " + " / ".join(o.get("name", "") for o in j.get("offices", []))
        out.append(dict(puesto=j["title"], ubicacion=loc.strip(" /"), url=j["absolute_url"],
                        fecha=(j.get("first_published") or j.get("updated_at") or "")[:10],
                        descripcion=text(j.get("content"))))
    return out


def ashby(e):
    out = []
    for j in get(f"https://api.ashbyhq.com/posting-api/job-board/{e['ats_token']}")["jobs"]:
        if not categoria(j["title"]):
            continue
        locs = [j.get("location", "")] + [s.get("location", "") for s in j.get("secondaryLocations", [])]
        loc = " / ".join(filter(None, locs))
        wp = "remote" if j.get("isRemote") or j.get("workplaceType") == "Remote" else (j.get("workplaceType") or "")
        out.append(dict(puesto=j["title"], ubicacion=loc, url=j["jobUrl"], workplace=wp,
                        fecha=(j.get("publishedAt") or "")[:10],
                        descripcion=text(j.get("descriptionPlain") or j.get("descriptionHtml"))))
    return out


def lever(e):
    out = []
    for j in get(f"https://api.lever.co/v0/postings/{e['ats_token']}?mode=json"):
        if not categoria(j["text"]):
            continue
        c = j.get("categories", {})
        loc = " / ".join(c.get("allLocations") or [c.get("location", "")])
        out.append(dict(puesto=j["text"], ubicacion=loc, url=j["hostedUrl"], workplace=j.get("workplaceType"),
                        fecha=time.strftime("%Y-%m-%d", time.gmtime(j.get("createdAt", 0) / 1000)),
                        descripcion=text(j.get("descriptionPlain"))))
    return out


def workable(e):
    out = []
    d = get(f"https://apply.workable.com/api/v1/widget/accounts/{e['ats_token']}")
    for j in d.get("jobs", []):
        if not categoria(j["title"]):
            continue
        loc = ", ".join(filter(None, [j.get("city"), j.get("state"), j.get("country")]))
        out.append(dict(puesto=j["title"], ubicacion=loc, url=j.get("shortlink") or j.get("url"),
                        workplace="remote" if j.get("telecommuting") else "", fecha=j.get("published_on")))
    return out


def smartrecruiters(e):
    out = []
    for q in ("partner", "alliance", "channel", "CTO", "head of", "director", "VP"):
        d = get(f"https://api.smartrecruiters.com/v1/companies/{e['ats_token']}/postings?limit=100&q={urllib.parse.quote(q)}")
        for j in d.get("content", []):
            if not categoria(j["name"]):
                continue
            l = j.get("location", {})
            loc = ", ".join(filter(None, [l.get("city"), l.get("country")])) + (" (Remote)" if l.get("remote") else "")
            out.append(dict(puesto=j["name"], ubicacion=loc,
                            url=f"https://jobs.smartrecruiters.com/{e['ats_token']}/{j['id']}",
                            workplace="remote" if l.get("remote") else ("hybrid" if l.get("hybrid") else ""),
                            fecha=(j.get("releasedDate") or "")[:10]))
    return out


def workday(e):
    host, site = e["ats_token"].split("/", 1)
    api = f"https://{host}/wday/cxs/{host.split('.')[0]}/{site}"
    out, seen = [], set()
    qs = ["partner Spain", "partner EMEA", "partner remote", "alliances", "channel Spain", "channel EMEA",
          "ecosystem", "CTO", "head of engineering", "director engineering Spain", "head of data", "VP engineering"]
    if e.get("top"):
        qs += ["Spain", "Madrid", "Barcelona", "Spain Remote", "solutions architect", "developer relations",
               "developer advocate", "account manager Spain", "sales Spain", "sales EMEA remote", "architect EMEA remote"]
    for q in qs:
        body = json.dumps({"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": q}).encode()
        for j in get(api + "/jobs", body, {"Content-Type": "application/json"}).get("jobPostings", []):
            url = f"https://{host}/{site}{j.get('externalPath', '')}"
            if url in seen or not categoria(j.get("title", "")):
                continue
            seen.add(url)
            loc = j.get("locationsText", "") + " " + j["externalPath"].split("/")[2]
            desc = ""
            if re.match(r"\d+ Locations", j.get("locationsText", "")) or SPAIN.search(loc) or REMOTE.search(loc):
                try:
                    info = get(api + j["externalPath"]).get("jobPostingInfo", {})
                    loc = " / ".join([info.get("location", "")] + info.get("additionalLocations", []))
                    desc = text(info.get("jobDescription"))
                except Exception:
                    pass
            out.append(dict(puesto=j["title"], ubicacion=loc, url=url, descripcion=desc,
                            fecha_txt=j.get("postedOn")))
    return out


def eightfold(e):
    """Portales Eightfold (Microsoft, Qualcomm…): ats_token = "host|dominio".
    Lee todas las ofertas con ubicación España paginando, más búsquedas remotas."""
    host, dom = (e["ats_token"].split("|") + [""])[:2] if "|" in (e["ats_token"] or "") else \
        ("apply.careers.microsoft.com", "microsoft.com")
    out, seen = [], set()
    for q, loc in [("", "Spain"), ("remote", "Europe"), ("partner", "Europe"), ("developer relations", "Europe")]:
        for start in range(0, 600, 10):
            d = None
            for i in range(5):
                try:
                    d = get(f"https://{host}/api/pcsx/search?domain={dom}&query={urllib.parse.quote(q)}&location={loc}&start={start}&sort_by=timestamp")
                    break
                except Exception:
                    time.sleep(15 * (i + 1))
            if not d:
                log(f"[aviso] {e['nombre']}: sin respuesta en {q!r} start={start}")
                break
            pos = d.get("data", {}).get("positions", [])
            if not pos:
                break
            for j in pos:
                if j["id"] in seen or not categoria(j["name"]):
                    continue
                seen.add(j["id"])
                locs = " / ".join(j.get("locations", []))
                if loc != "Spain" and not SPAIN.search(locs) and "remote" not in (j.get("workLocationOption") or "").lower():
                    continue
                out.append(dict(puesto=j["name"], ubicacion=locs, url=f"https://{host}" + j["positionUrl"],
                                workplace=j.get("workLocationOption"),
                                fecha=time.strftime("%Y-%m-%d", time.gmtime(j["postedTs"]))))
            time.sleep(2.5)
            if loc != "Spain" and start >= 50:
                break
    return out


def microsoft(e):
    return eightfold(e)


def google(e):
    """Google Careers: los datos van incrustados en la página (AF_initDataCallback ds:1)."""
    out = []
    for page in range(1, 40):
        s = get(f"https://www.google.com/about/careers/applications/jobs/results/?location=Spain&page={page}", raw=True)
        i = s.find("AF_initDataCallback({key: 'ds:1'")
        if i < 0:
            break
        j = s.find("data:", i) + 5
        d = json.loads(s[j:s.find(", sideChannel", j)])
        jobs = d[0] or []
        for x in jobs:
            title = x[1]
            if not categoria(title):
                continue
            locs = " / ".join(l[0] for l in (x[9] or []))
            remote = bool(x[16] == 1 or "remote" in json.dumps(x[18]).lower())
            slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
            out.append(dict(puesto=title, ubicacion=locs + (" (Remote)" if remote else ""),
                            url=f"https://www.google.com/about/careers/applications/jobs/results/{x[0]}-{slug}",
                            workplace="remote" if remote else "",
                            fecha=time.strftime("%Y-%m-%d", time.gmtime((x[12] or [0])[0])),
                            descripcion=text((x[10] or [None, ""])[1]) + " " + text((x[3] or [None, ""])[1])))
        if len(jobs) < 20:
            break
        time.sleep(1)
    return out


def amazon(e):
    out = []
    for off in range(0, 1000, 100):
        d = get(f"https://www.amazon.jobs/en/search.json?result_limit=100&offset={off}&country=ESP"
                "&business_category%5B%5D=amazon-web-services")
        jobs = d.get("jobs", [])
        for j in jobs:
            if not categoria(j["title"]):
                continue
            out.append(dict(puesto=j["title"], ubicacion=(j.get("normalized_location") or j.get("location", "")) + ", Spain",
                            url="https://www.amazon.jobs" + j["job_path"], fecha_txt=j.get("posted_date"),
                            descripcion=text(j.get("description"))))
        if off + 100 >= (d.get("hits") or 0):
            break
    return out


HANDLERS = dict(google=google, eightfold=eightfold, greenhouse=greenhouse, ashby=ashby, lever=lever, workable=workable,
                smartrecruiters=smartrecruiters, workday=workday, microsoft=microsoft, amazon=amazon)


def portales():
    def run(e):
        f = HANDLERS.get(e["ats"])
        if not f:
            return []
        try:
            res = f(e)
        except Exception as ex:
            log(f"[aviso] {e['nombre']}: {ex}")
            return []
        for o in res:
            o.update(empresa=e["nombre"], empresa_data_ai=e["data_ai"], empresa_top=bool(e.get("top")), sector=e["sector"],
                     fuente=f"portal oficial {e['nombre']}")
        return res
    with ThreadPoolExecutor(12) as ex:
        return [o for r in ex.map(run, EMPRESAS) for o in r]


# ---------- LinkedIn (búsqueda pública) ----------

LI_QUERIES = [
    "partner manager", "partner development manager", "partner program", "partnerships manager",
    "alliances manager", "alliance director", "channel manager", "channel partner", "ecosystem manager",
    "partner enablement", "partner success", "head of partnerships", "director of partnerships",
    "CTO", "chief technology officer", "VP engineering", "head of engineering", "director of engineering",
    "head of data", "head of AI", "chief data officer", "head of machine learning", "director de tecnología",
    "partner manager remote", "CTO remote", "head of engineering remote", "partnerships remote",
    "responsable de partners", "gerente de canal", "director de alianzas", "director técnico",
    "responsable de alianzas", "jefe de ingeniería", "director de ingeniería", "channel account manager",
    "partner account manager", "partner sales", "alliances", "VP of engineering", "fractional CTO",
    "head of data science", "director de datos", "head of platform",
    "solutions architect", "solution architect AI", "developer relations", "developer advocate", "evangelist",
    "sales engineer", "customer engineer", "presales AI", "preventa", "enterprise account executive AI",
    "account executive cloud", "field CTO",
]
LI_REMOTE_EU = ["partner manager", "partnerships", "alliances", "channel manager", "CTO",
                "head of engineering", "VP engineering", "director of engineering", "head of data", "head of AI",
                "solutions architect", "developer relations", "developer advocate", "sales engineer"]


def linkedin():
    found = {}
    busquedas = [(q, {"location": "Spain"}) for q in LI_QUERIES] + \
                [(q, {"location": "European Union", "f_WT": "2"}) for q in LI_REMOTE_EU]
    for q, extra in busquedas:
        vacias = 0
        for start in range(0, 400, 10):
            try:
                s = get("https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?"
                        + urllib.parse.urlencode({"keywords": q, "start": start, **extra}), raw=True)
            except Exception as ex:
                log("[aviso] LinkedIn", q, start, ex)
                time.sleep(20)
                continue
            cards = s.split("<li>")[1:]
            if not cards:
                break
            nuevos = 0
            for c in cards:
                t = re.search(r'base-search-card__title">\s*(.*?)\s*<', c, re.S)
                co = re.search(r'base-search-card__subtitle">.*?>\s*(.*?)\s*<', c, re.S)
                l = re.search(r'job-search-card__location">\s*(.*?)\s*<', c, re.S)
                u = re.search(r'href="(https://[a-z]+\.linkedin\.com/jobs/view/[^"?]*)', c)
                d = re.search(r'datetime="([^"]*)"', c)
                if not (t and co and u):
                    continue
                title = html.unescape(t.group(1))
                if not categoria(title):
                    continue
                jid = re.search(r"(\d+)$", u.group(1)).group(1)
                if jid in found:
                    continue
                nuevos += 1
                found[jid] = dict(puesto=title, empresa=html.unescape(co.group(1)).strip(),
                                  ubicacion=html.unescape(l.group(1)).strip() if l else "",
                                  url=u.group(1).replace("es.linkedin.com", "www.linkedin.com"),
                                  fecha=d.group(1) if d else None, fuente="LinkedIn", jid=jid)
            # corta cuando varias páginas seguidas no aportan títulos válidos nuevos
            vacias = vacias + 1 if not nuevos else 0
            if vacias >= 4:
                break
            time.sleep(1.2)
    log(f"[li] {len(found)} ofertas en listados; leyendo fichas…")

    def ficha(o):
        try:
            s = get(f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{o['jid']}", raw=True)
        except Exception:
            time.sleep(8)
            try:
                s = get(f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{o['jid']}", raw=True)
            except Exception:
                return o
        m = re.search(r'show-more-less-html__markup[^>]*>(.*?)</div>', s, re.S)
        o["descripcion"] = text(m.group(1)) if m else ""
        ind = re.findall(r'description__job-criteria-subheader">\s*Industries\s*</h3>\s*<span[^>]*>(.*?)</span>', s, re.S)
        o["industria"] = text(ind[0]) if ind else ""
        ext = re.search(r'"(https?://[^"]+)"[^>]*>\s*<[^>]*>\s*Apply', s)
        if ext and "linkedin.com" not in ext.group(1):
            o["url_externa"] = html.unescape(ext.group(1))
        time.sleep(0.6)
        return o

    with ThreadPoolExecutor(3) as ex:
        res = list(ex.map(ficha, found.values()))
    for o in res:
        o["empresa_data_ai"] = (o["empresa"].lower() in DATA_AI_NAMES
                                or bool(DATA_AI_HINT.search(o.get("industria", "") + " " + o["empresa"])))
    return res


# ---------- bolsas de remoto ----------

def remotive():
    out = []
    for q in ("partner", "alliances", "channel", "CTO", "head of engineering", "VP engineering", "head of data",
              "solutions architect", "developer relations", "developer advocate", "sales engineer"):
        try:
            d = get("https://remotive.com/api/remote-jobs?search=" + urllib.parse.quote(q))
        except Exception as ex:
            log("[aviso] Remotive", ex)
            continue
        for j in d.get("jobs", []):
            loc = j.get("candidate_required_location", "")
            if not (SPAIN.search(loc) or EUROPE.search(loc)):
                continue
            out.append(dict(puesto=j["title"], empresa=j["company_name"], ubicacion=f"Remoto ({loc})",
                            url=j["url"], workplace="remote", fecha=(j.get("publication_date") or "")[:10],
                            descripcion=text(j.get("description")), fuente="Remotive"))
    return out


def himalayas():
    out = []
    for q in ("partner", "partnerships", "alliances", "channel", "ecosystem", "CTO", "chief technology",
              "head of engineering", "VP engineering", "director of engineering", "head of data", "head of AI",
              "solutions architect", "developer relations", "developer advocate", "evangelist", "sales engineer"):
        try:
            jobs = []
            for off in range(0, 300, 20):
                d = get(f"https://himalayas.app/jobs/api/search?country=ES&page={off // 20 + 1}&q=" + urllib.parse.quote(q))
                jobs += d.get("jobs", [])
                if off + 20 >= d.get("totalCount", 0):
                    break
                time.sleep(0.5)
        except Exception as ex:
            log("[aviso] Himalayas", ex)
            continue
        for j in jobs:
            locs = ", ".join(j.get("locationRestrictions") or []) or "Worldwide"
            out.append(dict(puesto=j["title"], empresa=j.get("companyName", ""), ubicacion=f"Remoto ({locs})",
                            url=j.get("applicationLink") or j.get("guid"), workplace="remote",
                            fecha=time.strftime("%Y-%m-%d", time.gmtime(j.get("pubDate", 0))) if j.get("pubDate") else None,
                            descripcion=text(j.get("description")), fuente="Himalayas"))
    return out


# ---------- unir ----------

def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def main():
    cands = []
    for nombre, f in (("portales", portales), ("remotive", remotive), ("himalayas", himalayas), ("linkedin", linkedin)):
        if os.environ.get("SIN_" + nombre.upper()):
            continue
        t = time.time()
        r = f()
        log(f"[{nombre}] {len(r)} con título válido ({time.time() - t:.0f}s)")
        cands += r

    if os.environ.get("RAW_OUT"):
        json.dump(cands, open(os.environ["RAW_OUT"], "w"), ensure_ascii=False)
    ok = [o for o in (evaluar(dict(o)) for o in cands) if o]
    # Fusiona la misma oferta vista en varios sitios -> varios enlaces.
    merged = {}
    for o in sorted(ok, key=lambda o: 0 if o["fuente"].startswith("portal") else 1):
        k = norm(o["empresa"])[:12] + "|" + norm(o["puesto"])[:40]
        link = {"label": o["fuente"], "url": o["url"]}
        if k in merged:
            m = merged[k]
            if link["url"] not in [x["url"] for x in m["enlaces"]]:
                m["enlaces"].append(link)
            if m["modalidad"] == "desconocido" and o["modalidad"] != "desconocido":
                m["modalidad"] = o["modalidad"]
            m["remoto_claro"] = m["remoto_claro"] or o["remoto_claro"]
            continue
        o["enlaces"] = [link]
        if o.get("url_externa"):
            o["enlaces"].append({"label": "Web del empleador", "url": o["url_externa"]})
        merged[k] = o
    res = list(merged.values())
    for o in res:
        o["descripcion"] = (o.get("descripcion") or "")[:1500]
        for k in ("jid", "workplace", "url_externa"):
            o.pop(k, None)
    json.dump(res, sys.stdout, ensure_ascii=False, indent=1)
    log(f"[ok] {len(res)} candidatas ({sum(o['modalidad'] == 'remoto' for o in res)} remotas)")


if __name__ == "__main__":
    main()
