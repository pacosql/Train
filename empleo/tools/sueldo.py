#!/usr/bin/env python3
"""Sueldo de una oferta: lo saca del portal del empleador (dato estructurado si
lo hay, si no del texto de la descripción) y lo normaliza a euros/año.

    from sueldo import sueldo_oferta, parse
    sueldo_oferta(url, empresa) -> {"sueldo": "80–100K €", "sueldo_min_eur": 80000, "sueldo_max_eur": 100000} | None

    python3 empleo/tools/sueldo.py rellenar   # rellena las ofertas activas sin sueldo
"""
import html
import json
import os
import re
import subprocess
import sys
import urllib.parse

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126 Safari/537.36"
A_EUR = {"€": 1, "EUR": 1, "$": 0.86, "USD": 0.86, "£": 1.15, "GBP": 1.15, "CHF": 1.07, "PLN": 0.23}
CUR = r"(€|EUR|\$|USD|US\$|£|GBP|CHF|PLN)"
NUM = r"(\d{1,3}(?:[.,\s]\d{3})+|\d+(?:[.,]\d+)?)\s*([kK])?"
HORA = re.compile(r"per hour|/\s?h(ou)?r|hourly|por hora|/hora|per day|daily rate|por día", re.I)
RANGO = re.compile(
    rf"{CUR}\s?{NUM}\s*(?:-|–|—|to|a|hasta)\s*{CUR}?\s?{NUM}\s*{CUR}?"
    rf"|{NUM}\s*{CUR}\s*(?:-|–|—|to|a|hasta)\s*{NUM}\s*{CUR}"
    rf"|{NUM}\s*(?:-|–|—|to|a)\s*{NUM}\s*{CUR}", re.I)
UNO = re.compile(rf"(?:salary|salario|sueldo|compensation|base pay|pay range|retribución)[^.\n]{{0,60}}?{CUR}\s?{NUM}"
                 rf"|(?:salary|salario|sueldo|compensation|base pay|retribución)[^.\n]{{0,60}}?{NUM}\s*{CUR}", re.I)


def _num(s, k):
    s = s.strip()
    if re.fullmatch(r"\d{1,3}(?:[.,\s]\d{3})+", s):
        v = float(re.sub(r"[.,\s]", "", s))
    else:
        v = float(s.replace(",", "."))
    if k:
        v *= 1000
    return v


def _fmt(lo, hi):
    f = lambda v: f"{round(v / 1000)}K"
    return f"{f(lo)} €" if not hi or abs(hi - lo) < 1000 else f"{f(lo)}–{f(hi)} €"


def parse(text):
    """(min_eur, max_eur) anual o None."""
    if not text:
        return None
    text = html.unescape(html.unescape(text))
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    for m in RANGO.finditer(text):
        ctx = text[max(0, m.start() - 80): m.end() + 80]
        if HORA.search(ctx):
            continue
        g = [x for x in m.groups()]
        curs = [c for c in g if c and re.fullmatch(CUR, c, re.I)]
        nums = [(g[i], g[i + 1]) for i in range(len(g) - 1) if g[i] and re.match(r"\d", g[i])]
        if len(nums) < 2 or not curs:
            continue
        cur = curs[0].upper().replace("US$", "$")
        k_any = any(k for _, k in nums)
        lo = _num(nums[0][0], nums[0][1] or (k_any and not nums[0][1]))
        hi = _num(nums[1][0], nums[1][1])
        if lo < 1000 <= hi:  # "80-100K"
            lo *= 1000
        rate = A_EUR.get(cur, A_EUR.get(cur.strip(), 1))
        lo, hi = lo * rate, hi * rate
        if 15000 <= lo <= hi <= 1_500_000:
            return round(lo), round(hi)
    for m in UNO.finditer(text):
        ctx = text[max(0, m.start() - 40): m.end() + 80]
        if HORA.search(ctx):
            continue
        g = [x for x in m.groups() if x]
        cur = next((c for c in g if re.fullmatch(CUR, c, re.I)), None)
        n = next((g[i] for i in range(len(g)) if re.match(r"\d", g[i])), None)
        k = "k" in [x.lower() for x in g]
        if not (cur and n):
            continue
        v = _num(n, k) * A_EUR.get(cur.upper().replace("US$", "$"), 1)
        if 15000 <= v <= 1_500_000:
            return round(v), None
    return None


def _http(url, data=None, accept="application/json"):
    cmd = ["curl", "-sL", "-m", "30", "-A", UA, "-H", f"Accept: {accept}"]
    if data is not None:
        cmd += ["-X", "POST", "-H", "Content-Type: application/json", "-d", json.dumps(data)]
    try:
        return subprocess.run(cmd + [url], capture_output=True, text=True).stdout
    except Exception:
        return ""


def _j(url, data=None):
    try:
        return json.loads(_http(url, data))
    except Exception:
        return None


_ash = {}


def texto_oferta(url, empresa=None):
    """Texto (o dato estructurado) donde buscar el sueldo, según el portal."""
    m = re.search(r"jobs\.ashbyhq\.com/([^/]+)/([0-9a-f-]{36})", url)
    if m:
        org, jid = m.groups()
        if org not in _ash:
            d = _j(f"https://api.ashbyhq.com/posting-api/job-board/{org}?includeCompensation=true") or {}
            _ash[org] = {j["id"]: j for j in d.get("jobs", [])}
        j = _ash[org].get(jid) or {}
        c = j.get("compensation") or {}
        return " ".join(filter(None, [c.get("scrapeableCompensationSalarySummary"), c.get("compensationTierSummary"),
                                      j.get("descriptionPlain")]))
    m = re.search(r"greenhouse\.io/([^/]+)/jobs/(\d+)", url)
    gh = re.search(r"[?&]gh_jid=(\d+)", url)
    if m or gh:
        tok = m.group(1) if m else (empresa or "").lower().split()[0].strip(",")
        jid = m.group(2) if m else gh.group(1)
        d = _j(f"https://boards-api.greenhouse.io/v1/boards/{tok}/jobs/{jid}?pay_transparency=true") or {}
        pay = " ".join(f"{p.get('currency_type', '')} {p.get('min_cents', 0) / 100:.0f} - {p.get('currency_type', '')} {p.get('max_cents', 0) / 100:.0f}"
                       for p in d.get("pay_input_ranges") or [])
        return pay + " " + (d.get("content") or "")
    m = re.search(r"jobs(\.eu)?\.lever\.co/([^/]+)/([0-9a-f-]{36})", url)
    if m:
        eu, org, jid = m.groups()
        d = _j(f"https://api{'.eu' if eu else ''}.lever.co/v0/postings/{org}/{jid}") or {}
        sr = d.get("salaryRange") or {}
        s = f"{sr.get('currency', '')} {sr.get('min', '')} - {sr.get('currency', '')} {sr.get('max', '')}" if sr.get("min") and (sr.get("interval") or "per-year-salary") == "per-year-salary" else ""
        return s + " " + (d.get("descriptionPlain") or "") + " " + (d.get("additionalPlain") or "")
    m = re.search(r"([a-z0-9-]+)\.(wd\d+)\.myworkdayjobs\.com/(?:[a-z]{2}-[A-Z]{2}/)?([^/]+)(/job/.+?)(?:[?#]|$)", url)
    if m:
        ten, wd, site, path = m.groups()
        d = _j(f"https://{ten}.{wd}.myworkdayjobs.com/wday/cxs/{ten}/{site}{path}") or {}
        return (d.get("jobPostingInfo") or {}).get("jobDescription", "")
    m = re.search(r"smartrecruiters\.com/([^/]+)/(\d+)", url)
    if m:
        d = _j(f"https://api.smartrecruiters.com/v1/companies/{m.group(1)}/postings/{m.group(2)}") or {}
        comp = d.get("compensation") or {}
        s = f"{comp.get('currency', '')} {comp.get('min', '')} - {comp.get('currency', '')} {comp.get('max', '')}" if comp.get("min") else ""
        return s + " " + json.dumps((d.get("jobAd") or {}).get("sections") or {}, ensure_ascii=False)
    m = re.search(r"apply\.careers\.microsoft\.com/careers/job/(\d+)", url)
    if m:
        d = _j(f"https://apply.careers.microsoft.com/api/pcsx/position_details?position_id={m.group(1)}&domain=microsoft.com&hl=en") or {}
        return json.dumps(d.get("data") or {}, ensure_ascii=False)
    m = re.search(r"linkedin\.com/jobs/view/(?:[^/]*?-)?(\d+)", url)
    if m:
        return _http(f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{m.group(1)}", accept="text/html")
    if "himalayas.app" in url:
        slug = url.rstrip("/").split("/")[-1]
        d = _j("https://himalayas.app/jobs/api/search?q=" + urllib.parse.quote(slug.replace("-", " ")[:80])) or {}
        for j in d.get("jobs", []):
            if slug in (j.get("guid") or "") and j.get("minSalary"):
                return f"{j.get('currency', 'USD')} {j['minSalary']} - {j.get('currency', 'USD')} {j.get('maxSalary') or j['minSalary']}"
        return ""
    return _http(url, accept="text/html")[:400000]


def sueldo_oferta(urls, empresa=None, extra=""):
    """Prueba el texto ya conocido y luego cada enlace hasta encontrar sueldo."""
    for t in [extra] + [None] * len(urls):
        if t is None:
            u = urls.pop(0)
            t = texto_oferta(u, empresa)
        r = parse(t)
        if r:
            lo, hi = r
            return {"sueldo": _fmt(lo, hi), "sueldo_min_eur": lo, "sueldo_max_eur": hi or lo}
    return None


def rellenar():
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import guardar as g
    from concurrent.futures import ThreadPoolExecutor
    rows = g.api("GET", "empleo_ofertas?select=id,empresa,url,enlaces,resumen&activa=eq.true&sueldo=is.null")
    n = 0

    def una(r):
        nonlocal n
        urls = [l["url"] for l in (r.get("enlaces") or [{"url": r["url"]}])]
        s = sueldo_oferta(urls, r["empresa"], r.get("resumen") or "")
        if s:
            g.api("PATCH", f"empleo_ofertas?id=eq.{r['id']}", s, "return=minimal")
            n += 1
            print(f"{r['empresa']}: {s['sueldo']}", file=sys.stderr)

    with ThreadPoolExecutor(6) as ex:
        list(ex.map(una, rows))
    print(json.dumps({"revisadas": len(rows), "con_sueldo": n}))


if __name__ == "__main__":
    if sys.argv[1:] == ["rellenar"]:
        rellenar()
