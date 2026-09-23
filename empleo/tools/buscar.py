#!/usr/bin/env python3
"""Busca ofertas de Partner/Alliances/Channel en los portales de empleo
OFICIALES de empresas de Data & AI (APIs públicas de Greenhouse, Ashby,
Lever, Workday, Microsoft y AWS) y filtra las que están en España o
son remotas en EMEA/Europa.

    python3 empleo/tools/buscar.py > /tmp/candidatas.json

Imprime un array JSON de candidatas con el enlace a la oferta real del
empleador, la ubicación tal cual la publica y la descripción en texto
plano (recortada) para que quien ejecute la rutina decida modalidad,
resumen y si encaja. No escribe en Supabase.
"""
import html
import json
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

# empresa visible -> token del portal
GREENHOUSE = {
    "Anthropic": "anthropic", "Databricks": "databricks", "Datadog": "datadog",
    "MongoDB": "mongodb", "Elastic": "elastic", "Dataiku": "dataiku",
    "Fivetran": "fivetran", "Collibra": "collibra", "Starburst": "starburst",
    "Neo4j": "neo4j", "Scale AI": "scaleai", "Glean": "gleanwork",
    "Celonis": "celonis", "Sigma Computing": "sigmacomputing",
    "Grafana Labs": "grafanalabs", "Cockroach Labs": "cockroachlabs",
    "SingleStore": "singlestore", "Amplitude": "amplitude",
    "Hightouch": "hightouch", "Dremio": "dremio", "Cresta": "cresta",
    "PolyAI": "polyai", "AssemblyAI": "assemblyai", "Labelbox": "labelbox",
    "Snorkel AI": "snorkelai", "C3 AI": "c3iot", "Workato": "workato",
    "Gong": "gongio", "Twilio": "twilio", "Okta": "okta",
}
ASHBY = {
    "OpenAI": "openai", "Cohere": "cohere", "ElevenLabs": "elevenlabs",
    "Perplexity": "perplexity", "Snowflake": "snowflake",
    "Synthesia": "synthesia", "Sierra": "sierra", "Harvey": "harvey",
    "Poolside": "poolside", "n8n": "n8n", "LangChain": "langchain",
    "Weaviate": "weaviate", "DeepL": "deepl", "Writer": "writer",
    "Runway": "runway", "Notion": "notion", "Supabase": "supabase",
    "Modal": "modal", "Baseten": "baseten", "Lovable": "lovable",
    "Legora": "legora", "Photoroom": "photoroom", "Dust": "dust",
    "Decagon": "decagon", "Confluent": "confluent", "ClickHouse": "clickhouse",
    "Airbyte": "airbyte", "Pinecone": "pinecone", "Cursor": "cursor",
    "Temporal": "temporal", "MotherDuck": "motherduck", "UiPath": "uipath",
}
LEVER = {"Palantir": "palantir", "Pigment": "pigment", "Contentsquare": "contentsquare"}
WORKDAY = {
    "NVIDIA": "nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite",
    "Salesforce": "salesforce.wd12.myworkdayjobs.com/External_Career_Site",
    "HPE": "hpe.wd5.myworkdayjobs.com/Jobsathpe",
    "Intel": "intel.wd1.myworkdayjobs.com/External",
    "Red Hat": "redhat.wd5.myworkdayjobs.com/jobs",
    "Workday": "workday.wd5.myworkdayjobs.com/Workday",
    "Adobe": "adobe.wd5.myworkdayjobs.com/external_experienced",
    "Alteryx": "alteryx.wd108.myworkdayjobs.com/AlteryxCareers",
    "Cloudera": "cloudera.wd5.myworkdayjobs.com/External_Career",
    "CrowdStrike": "crowdstrike.wd5.myworkdayjobs.com/crowdstrikecareers",
}

TITLE = re.compile(r"partner|alliance|channel|ecosystem|reseller|\bGSI\b|system integrator|\bISV\b", re.I)
TITLE_NO = re.compile(r"business partner|people partner|talent|recruit|\bHR\b|finance partner|engineer|developer|architect|scientist|counsel|legal|accountant|payroll|design partner", re.I)
SPAIN = re.compile(r"spain|españa|espana|madrid|barcelona|valencia|m[aá]laga|sevilla|bilbao|\bES\b", re.I)
EUROPE = re.compile(r"emea|europe|\beu\b|southern europe|iberia", re.I)
REMOTE = re.compile(r"remote|remoto", re.I)


def get(url, data=None, headers=None):
    h = {"User-Agent": "Mozilla/5.0", "Accept": "application/json"}
    h.update(headers or {})
    req = urllib.request.Request(url, data=data, headers=h)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8", "replace"))


def text(s, n=1500):
    s = re.sub(r"<[^>]+>", " ", html.unescape(s or ""))
    return re.sub(r"\s+", " ", s).strip()[:n]


def keep(title, loc, remote=False):
    if not TITLE.search(title) or TITLE_NO.search(title):
        return False
    if SPAIN.search(loc):
        return True
    return (remote or REMOTE.search(loc)) and EUROPE.search(loc + " " + title)


def greenhouse(emp, tok):
    out = []
    for j in get(f"https://boards-api.greenhouse.io/v1/boards/{tok}/jobs?content=true")["jobs"]:
        loc = (j.get("location") or {}).get("name", "")
        offices = " / ".join(o.get("name", "") for o in j.get("offices", []))
        full = loc + " / " + offices
        if keep(j["title"], full):
            out.append(dict(empresa=emp, puesto=j["title"], ubicacion=loc, url=j["absolute_url"],
                            fecha=(j.get("first_published") or j.get("updated_at") or "")[:10],
                            fuente=f"portal oficial {emp} (Greenhouse)", descripcion=text(j.get("content"))))
    return out


def ashby(emp, tok):
    out = []
    for j in get(f"https://api.ashbyhq.com/posting-api/job-board/{tok}")["jobs"]:
        locs = [j.get("location", "")] + [s.get("location", "") for s in j.get("secondaryLocations", [])]
        loc = " / ".join(filter(None, locs))
        remote = j.get("isRemote") or j.get("workplaceType") == "Remote"
        if keep(j["title"], loc, remote):
            out.append(dict(empresa=emp, puesto=j["title"], ubicacion=loc, url=j["jobUrl"],
                            fecha=(j.get("publishedAt") or "")[:10], workplace=j.get("workplaceType"),
                            fuente=f"portal oficial {emp} (Ashby)", descripcion=text(j.get("descriptionPlain") or j.get("descriptionHtml"))))
    return out


def lever(emp, tok):
    out = []
    for j in get(f"https://api.lever.co/v0/postings/{tok}?mode=json"):
        c = j.get("categories", {})
        loc = " / ".join(c.get("allLocations") or [c.get("location", "")])
        if keep(j["text"], loc, j.get("workplaceType") == "remote"):
            out.append(dict(empresa=emp, puesto=j["text"], ubicacion=loc, url=j["hostedUrl"],
                            workplace=j.get("workplaceType"), fuente=f"portal oficial {emp} (Lever)",
                            descripcion=text(j.get("descriptionPlain"))))
    return out


def workday(emp, path):
    host, site = path.split("/", 1)
    ten = host.split(".")[0]
    api = f"https://{host}/wday/cxs/{ten}/{site}"
    out, seen = [], set()
    for q in ["partner Spain", "partner Madrid", "partner EMEA", "alliances", "channel Spain", "channel EMEA", "ecosystem"]:
        body = json.dumps({"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": q}).encode()
        for j in get(api + "/jobs", body, {"Content-Type": "application/json"}).get("jobPostings", []):
            url = f"https://{host}/{site}{j['externalPath']}"
            if url in seen or not TITLE.search(j["title"]) or TITLE_NO.search(j["title"]):
                continue
            seen.add(url)
            loc = j.get("locationsText", "")
            desc = ""
            if re.match(r"\d+ Locations", loc) or not keep(j["title"], loc + " " + j["externalPath"]):
                try:
                    info = get(api + j["externalPath"]).get("jobPostingInfo", {})
                    loc = " / ".join([info.get("location", "")] + info.get("additionalLocations", []))
                    desc = text(info.get("jobDescription"))
                except Exception:
                    pass
            if keep(j["title"], loc + " " + j["externalPath"]):
                out.append(dict(empresa=emp, puesto=j["title"], ubicacion=loc, url=url, descripcion=desc,
                                publicada=j.get("postedOn"), fuente=f"portal oficial {emp} (Workday)"))
    return out


def microsoft():
    out, seen = [], set()
    import time
    for q in ["partner", "alliances", "channel", "ecosystem"]:
        for start in (0, 10, 20):
            time.sleep(1.5)
            d = get(f"https://apply.careers.microsoft.com/api/pcsx/search?domain=microsoft.com&query={q}&location=Spain&start={start}&sort_by=relevance")
            for j in d["data"]["positions"]:
                loc = " / ".join(j.get("locations", []))
                if j["id"] in seen or not keep(j["name"], loc):
                    continue
                seen.add(j["id"])
                out.append(dict(empresa="Microsoft", puesto=j["name"], ubicacion=loc,
                                url="https://apply.careers.microsoft.com" + j["positionUrl"],
                                workplace=j.get("workLocationOption"), fuente="portal oficial Microsoft",
                                fecha=__import__("datetime").date.fromtimestamp(j["postedTs"]).isoformat()))
    return out


def amazon():
    out, seen = [], set()
    for q in ["partner development manager", "partner manager", "alliances", "channel"]:
        d = get("https://www.amazon.jobs/en/search.json?result_limit=100&loc_query=Spain&base_query=" + urllib.request.quote(q))
        for j in d.get("jobs", []):
            loc = j.get("normalized_location") or j.get("location", "")
            aws = "web services" in (j.get("company_name") or "").lower() or j.get("business_category") == "aws"
            if j["id_icims"] in seen or not aws or not keep(j["title"], loc):
                continue
            seen.add(j["id_icims"])
            out.append(dict(empresa="Amazon Web Services (AWS)", puesto=j["title"], ubicacion=loc,
                            url="https://www.amazon.jobs" + j["job_path"], publicada=j.get("posted_date"),
                            fuente="portal oficial Amazon", descripcion=text(j.get("description"))))
    return out


def main():
    tasks = [(greenhouse, e, t) for e, t in GREENHOUSE.items()] + [(ashby, e, t) for e, t in ASHBY.items()] \
        + [(lever, e, t) for e, t in LEVER.items()] + [(workday, e, t) for e, t in WORKDAY.items()] \
        + [(lambda *_: microsoft(), "Microsoft", None), (lambda *_: amazon(), "Amazon", None)]

    def run(t):
        f, e, tok = t
        try:
            return f(e, tok)
        except Exception as ex:  # un portal caído no debe parar la búsqueda
            print(f"[aviso] {e}: {ex}", file=sys.stderr)
            return []

    with ThreadPoolExecutor(12) as ex:
        res = [o for r in ex.map(run, tasks) for o in r]
    json.dump(res, sys.stdout, ensure_ascii=False, indent=1)
    print(f"[ok] {len(res)} candidatas", file=sys.stderr)


if __name__ == "__main__":
    main()
