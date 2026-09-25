"""Criba una lista de candidatos y carga en Supabase los que pasan.

Uso, desde la raíz del repo:

    python3 nombremates/tools/cribar.py candidatos.txt --tanda 3 [--max 400] [--solo-probar] [--primero]

Formato de candidatos.txt: líneas `Nombre|por qué evoca` agrupadas bajo
cabeceras `# familia: <nombre>`. Los mejores primero: el orden del fichero
es el orden en que el usuario los verá.

Por cada nombre:
 1. Salta los ya comprobados alguna vez (tabla nombremates_comprobados).
 2. .com libre vía RDAP de Verisign (404 = libre). Se apunta en comprobados.
 3. Cribado de marcas PARECIDAS (no solo iguales) en YouTube (canales y
    suscriptores), App Store España y Google Play, troceando el nombre en
    palabras (ver seg.py). Los choques se cargan como `vetado` con motivo.
 4. Inserta en nombremates_ideas con `orden` creciente tras el último.

TMview (registro oficial de marcas) NO se consulta aquí: bloquea la IP a
las pocas consultas automáticas. Se mira a mano en la fase de finalistas.
"""
import argparse, difflib, html, json, re, sys, time, unicodedata, urllib.parse, urllib.request
import concurrent.futures as cf
from datetime import datetime, timezone
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from seg import segment, norm, _W as DICC

URL = "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1"
ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGhzZHBneXhuand1ZG1ybnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzEzMjgsImV4cCI6MjEwNTAwNzMyOH0.B572twWEEJjnNr1SZDrUCHBG9VgIEo9RXyZXyszjhrM"
H = {"apikey": ANON, "Authorization": "Bearer " + ANON, "Content-Type": "application/json"}
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

def sb(path, method="GET", body=None, prefer=None):
    h = dict(H)
    if prefer: h["Prefer"] = prefer
    req = urllib.request.Request(f"{URL}/{path}", data=json.dumps(body).encode() if body is not None else None, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            t = r.read()
            return json.loads(t) if t else None
    except urllib.error.HTTPError as e:
        raise SystemExit(f"Supabase {method} {path} → {e.code}: {e.read().decode('utf8', 'replace')[:500]}")

def sb_all(path):
    out = []
    for off in range(0, 100000, 1000):
        p = sb(f"{path}&limit=1000&offset={off}")
        out += p
        if len(p) < 1000: break
    return out

def slug(n):
    s = unicodedata.normalize("NFD", n.lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9-]", "", s)

def get(url, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "es-ES,es;q=0.9", "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=30) as r: return r.status, r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404: return 404, b""
            if e.code == 429: time.sleep(3 * (i + 1)); continue
            return e.code, b""
        except Exception: time.sleep(2 * (i + 1))
    return None, b""

# ---- dominios ----
RDAP = {"com": "https://rdap.verisign.com/com/v1/domain/", "net": "https://rdap.verisign.com/net/v1/domain/", "org": "https://rdap.publicinterestregistry.org/rdap/domain/"}
def rdap(s, tld):
    st, _ = get(RDAP[tld] + s + "." + tld)
    return True if st == 404 else False if st == 200 else None

# ---- notoriedad: parecidos por palabras ----
NUM = {"cero":"0","uno":"1","una":"1","un":"1","dos":"2","tres":"3","cuatro":"4","cinco":"5","seis":"6","siete":"7","ocho":"8","nueve":"9","diez":"10","once":"11","doce":"12","veinte":"20","cien":"100","ciento":"100","mil":"1000","ten":"10","one":"1","two":"2","three":"3"}
SYN = {"matematicas":"mates","matematica":"mates","math":"mates","maths":"mates","mate":"mates","matematico":"mates","matematicos":"mates","sumas":"suma","sumar":"suma","numeros":"numero","number":"numero","numbers":"numero","cuentas":"cuenta","contar":"cuenta","tablas":"tabla","cifras":"cifra","calcular":"calculo"}
STOP = {"de","la","el","los","las","y","e","con","en","a","al","del","un","una","mi","tu","por","para","que","o","the","of","and","su","me","te","se","lo","le","es","eres","soy","mis","tus","hasta","desde","sin","mas","by","for","with","to","in","my","your","il"}
GENERIC = {"mates","suma","numero","cuenta","tabla","cifra","calculo","juego","juegos","app","kids","ninos","nino","aprende","aprender","10","1","2","3","100","1000","0","pi","club","escuela","academia","online","play","game","games","fun","super","pro","mas","plus","go","top","max"}
FUERTES = "smartick kumon pitagorin matific numberblocks matemonstruos unicoos profesor10demates khanacademy lunnis alohamental cokitos chachimates patomates divertimates numerolandia pequemates tutomate math2me julioprofe matemovil susiprofe duolingo brainly genially kahoot pocoyo peppapig arbolabc mundoprimaria educaplay tiching snappet mathletics prodigy dragonbox splashlearn tinytap lingokids smileandlearn tocaboca edpuzzle photomath mathway cymath abaquito baamboozle mates10 matemagicas cantandoaprendo toycantando".split()

def tok(words):
    out = []
    for w in words:
        w = NUM.get(w, w); w = SYN.get(w, w)
        if len(w) > 4 and w.endswith("s") and not w.endswith("ss"): w = SYN.get(w[:-1], w[:-1])
        if w and w not in STOP and (len(w) > 1 or w.isdigit()): out.append(w)
    return set(out)
def tok_text(t):
    ws = []
    for w in norm(t).split(): ws += segment(w) if len(w) > 8 else [w]
    return tok(ws)

def relacion(ct, cj, other, kind):
    """None / 'leve' / 'choque' entre el candidato (tokens ct, pegado cj) y otro nombre."""
    o = tok_text(other); oj = norm(other).replace(" ", "")
    if not o: return None
    ratio = difflib.SequenceMatcher(None, cj, oj).ratio()
    if len(oj) >= 5 and ratio >= (0.92 if (oj in DICC or kind == "app") else 0.88): return "choque"
    cobertura = sum(len(t) for t in ct) / max(len(cj), 1)
    sh = ct & o; distintas = {t for t in sh if t not in GENERIC and not t.isdigit()}
    if cobertura < 0.75: return "leve" if sh - GENERIC else None  # nombre inventado: no vale cruzar palabras
    if o == ct and (distintas or ratio >= 0.8): return "choque"
    if ct <= o and len(ct) >= 2 and ((kind == "marca" and len(o) <= len(ct) + 2) or (kind != "marca" and distintas and len(o) <= len(ct) + 1)): return "choque"
    if o <= ct and len(o) >= 2 and distintas: return "choque"
    if len(o) == 1:
        t = next(iter(o))
        if t in ct and t not in GENERIC and t not in DICC and len(t) >= 5 and len(t) / len(cj) >= 0.55: return "choque"
    if len(oj) >= 5 and oj in cj and oj not in GENERIC and oj not in DICC and len(oj) / len(cj) >= 0.65: return "choque"
    if cj in oj and len(cj) >= 6 and cj not in DICC and len(cj) / len(oj) >= 0.6: return "choque"
    return "leve" if distintas else None

SUBS = re.compile(r"([\d.,]+)\s*(k|m|mil|M)?\s*(?:de\s+)?(?:suscriptores|subscribers)", re.I)
def subs_num(t):
    m = SUBS.search(t or "")
    if not m: return None
    v = float(m.group(1).replace(".", "").replace(",", ".")) if m.group(2) else float(m.group(1).replace(".", "").replace(",", ""))
    u = (m.group(2) or "").lower()
    return int(v * (1e6 if u == "m" else 1e3 if u in ("k", "mil") else 1))
def youtube(q):
    st, y = get("https://www.youtube.com/results?search_query=" + urllib.parse.quote(q))
    if st != 200: return None
    y = y.decode("utf8", "replace"); chans = {}
    for m in re.finditer(r'"channelRenderer":\{"channelId":"[^"]*","title":\{"simpleText":"((?:[^"\\]|\\.)*)"', y):
        name = json.loads('"%s"' % m.group(1)); seg = y[m.end(): m.end() + 3000]
        vals = [v for v in (subs_num(t) for t in re.findall(r'"simpleText":"([^"]*(?:suscriptores|subscribers)[^"]*)"', seg)) if v]
        chans[name] = max(vals) if vals else 0
    for m in re.finditer(r'"ownerText":\{"runs":\[\{"text":"((?:[^"\\]|\\.)*)"', y):
        chans.setdefault(json.loads('"%s"' % m.group(1)), None)
    return chans
def itunes(q):
    st, r = get("https://itunes.apple.com/search?" + urllib.parse.urlencode({"term": q, "country": "es", "entity": "software", "limit": 30}))
    return None if st != 200 else [a["trackName"] for a in json.loads(r)["results"]]
def play(q):
    st, p = get(f"https://play.google.com/store/search?q={urllib.parse.quote(q)}&c=apps&hl=es&gl=ES")
    return None if st != 200 else [html.unescape(t) for t in re.findall(r'class="DdYX5">([^<]*)', p.decode("utf8", "replace"))]

def cribar(nombre):
    s = slug(nombre); words = segment(nombre); spaced = " ".join(words); cj = norm(nombre).replace(" ", "")
    r = {"nombre": nombre, "slug": s, "palabras": spaced, "com": rdap(s, "com"), "choque": [], "leve": [], "errores": []}
    if r["com"] is not True: return r
    r["net"], r["org"] = rdap(s, "net"), rdap(s, "org")
    ct = tok(words) or {cj}
    for b in FUERTES:
        if b in cj or difflib.SequenceMatcher(None, cj, b).ratio() >= 0.88: r["choque"].append(f"parecido a la marca conocida «{b}»")
    ch = youtube(spaced)
    if ch is None: r["errores"].append("youtube")
    for name, subs in (ch or {}).items():
        rel = relacion(ct, cj, name, "marca" if subs and subs >= 50000 else "canal")
        if not rel: continue
        txt = f"canal YouTube «{name}»" + (f" ({subs:,} subs)".replace(",", ".") if subs else "")
        (r["choque"] if rel == "choque" and subs and subs >= 1000 else r["leve"]).append(txt)
    for fn, lab in ((itunes, "App Store"), (play, "Google Play")):
        apps = fn(spaced)
        if apps is None: r["errores"].append(lab); continue
        for a in apps:
            rel = relacion(ct, cj, re.split(r"\s[-–:|]\s|:", a)[0], "app")
            if rel: (r["choque"] if rel == "choque" else r["leve"]).append(f"app {lab} «{a}»")
    r["choque"] = list(dict.fromkeys(r["choque"]))[:4]; r["leve"] = list(dict.fromkeys(r["leve"]))[:4]
    return r

def leer_candidatos(path):
    rows, fam, vistos = [], "", set()
    for line in open(path, encoding="utf8"):
        line = line.strip()
        if not line: continue
        if line.startswith("#"): fam = line.split(":", 1)[-1].strip(); continue
        if "|" not in line: continue
        n, p = line.split("|", 1)
        n = n.strip()
        if not n or "ñ" in n.lower() or slug(n) in vistos or len(slug(n)) < 3: continue
        vistos.add(slug(n)); rows.append({"nombre": n, "porque": p.strip(), "metodo": fam})
    return rows

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("fichero"); ap.add_argument("--tanda", type=int, required=True)
    ap.add_argument("--max", type=int, default=400, help="cargar como mucho tantos nombres que pasen")
    ap.add_argument("--solo-probar", action="store_true", help="no escribe nada en Supabase")
    ap.add_argument("--primero", action="store_true", help="colocar estos nombres al principio de la cola (p. ej. los que salen de una sugerencia del usuario)")
    a = ap.parse_args()
    cands = leer_candidatos(a.fichero)
    # Se salta lo que ya está en ideas (con cualquier estado) y lo que se
    # comprobó alguna vez con el .com ocupado. Un nombre comprobado libre pero
    # que nunca llegó a ideas se vuelve a cribar (es barato y así aparece).
    ocupados = {r["nombre"] for r in sb_all("nombremates_comprobados?select=nombre,com_libre&com_libre=eq.false")}
    en_ideas = {slug(r["nombre"]) for r in sb_all("nombremates_ideas?select=nombre")}
    cands = [c for c in cands if slug(c["nombre"]) not in ocupados and slug(c["nombre"]) not in en_ideas]
    print(f"candidatos nuevos a comprobar: {len(cands)}", file=sys.stderr)
    # Los nombres nuevos van detrás de los pendientes buenos pero delante de
    # los flojos (orden ≥ 100000, la cola de reserva).
    if a.primero:
        # Delante de todo: orden negativo decreciente desde el mínimo actual.
        ult = sb("nombremates_ideas?select=orden&status=eq.pendiente&order=orden.asc.nullslast&limit=1")
        orden = min(0, (ult[0]["orden"] or 0) if ult else 0) - 1000
    else:
        ult = sb("nombremates_ideas?select=orden&orden=lt.100000&order=orden.desc&limit=1")
        orden = (ult[0]["orden"] or 0) if ult else 0
    now = datetime.now(timezone.utc).isoformat()
    res = {"com_ocupado": 0, "vetados": 0, "cargados": 0, "errores": 0}
    filas, comprobados = [], []
    with cf.ThreadPoolExecutor(6) as ex:
        for c, r in zip(cands, ex.map(lambda c: cribar(c["nombre"]), cands)):
            if r["com"] is None: res["errores"] += 1; continue
            comprobados.append({"nombre": r["slug"], "com_libre": r["com"]})
            if not r["com"]: res["com_ocupado"] += 1; continue
            if res["cargados"] >= a.max: continue
            tld = f".net {'libre' if r['net'] else 'ocupado' if r['net'] is False else '?'} · .org {'libre' if r['org'] else 'ocupado' if r['org'] is False else '?'}"
            det = "Registro de marcas (OEPM/EUIPO): se comprueba uno a uno cuando lo marques 👍 o ⭐. YouTube/App Store/Google Play: " + ("; ".join(r["leve"]) if r["leve"] else "nada con ese nombre o parecido") + "."
            orden += 1
            fila = {"nombre": c["nombre"], "status": "pendiente", "tanda": a.tanda, "metodo": c["metodo"], "porque": c["porque"], "com_libre": True,
                    "dominio_comprobado_at": now, "otros_tld": tld, "notoriedad": 1 if r["leve"] else 0, "colision_detalle": det, "orden": orden, "veto_motivo": None}
            if r["choque"]:
                fila.update(status="vetado", veto_motivo="; ".join(r["choque"]), notoriedad=2, colision_detalle="Choque: " + "; ".join(r["choque"]) + ". " + det)
                res["vetados"] += 1
            else:
                res["cargados"] += 1
            filas.append(fila)
            print(("VETADO " if r["choque"] else "OK     ") + c["nombre"] + ("  ← " + r["choque"][0] if r["choque"] else ""), file=sys.stderr)
    if not a.solo_probar:
        for i in range(0, len(filas), 200):
            sb("nombremates_ideas?on_conflict=nombre", "POST", filas[i:i+200], "resolution=ignore-duplicates,return=minimal")
        for i in range(0, len(comprobados), 200):
            sb("nombremates_comprobados?on_conflict=nombre", "POST", comprobados[i:i+200], "resolution=merge-duplicates,return=minimal")
    print(json.dumps(res))

if __name__ == "__main__":
    main()
