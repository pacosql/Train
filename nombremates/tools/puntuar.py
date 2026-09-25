#!/usr/bin/env python3
"""Puntúa cada nombre (0-100) como marca para un producto online de mates
para niños en España (estilo Duolingo / Smartick / Kahoot): presencia de
marca y pocos problemas.

    python3 nombremates/tools/puntuar.py [--solo-probar] [--todo]

- Aplica una rúbrica automática (abajo, transparente) a todos los nombres
  en pendiente / me_gusta / favorito.
- Encima, las puntuaciones a mano de nombremates/tools/scores.txt
  (`nombre|score|motivo`) mandan: son la opinión de Claude nombre a nombre.
- Guarda score / score_motivo / score_at en nombremates_ideas y reordena la
  cola de pendientes por score (orden = (100 - score) * 10), así el usuario
  ve primero los que mejor marca serían. Por defecto solo puntúa los que no
  tienen score; con --todo, todos.
"""
import argparse, json, os, re, sys, unicodedata, urllib.parse, urllib.request
from datetime import datetime, timezone

URL = "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1/nombremates_ideas"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGhzZHBneXhuand1ZG1ybnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzEzMjgsImV4cCI6MjEwNTAwNzMyOH0.B572twWEEJjnNr1SZDrUCHBG9VgIEo9RXyZXyszjhrM"
AQUI = os.path.dirname(os.path.abspath(__file__))

def api(method, path, body=None, headers=None):
    h = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}
    h.update(headers or {})
    r = urllib.request.Request(URL + path, data=json.dumps(body).encode() if body is not None else None, headers=h, method=method)
    with urllib.request.urlopen(r) as resp:
        t = resp.read().decode()
        return json.loads(t) if t else None

def todos(sel):
    out, off = [], 0
    while True:
        page = api("GET", f"?select={sel}&status=in.(pendiente,me_gusta,favorito)&order=id.asc&limit=1000&offset={off}")
        out += page
        if len(page) < 1000: return out
        off += 1000

def norm(s):
    return unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()

# ---- Rúbrica ----------------------------------------------------------
VERBOS_POSITIVOS = set("""aprende acierta practica juega piensa resuelve domina avanza logra gana brilla crece sube
motiva mejora descubre imagina razona aprueba repasa saca mola flipa progresa comprende explica lidera demuestra
analiza deduce observa averigua preparate estudia conecta construye acelera arranca entrena calcula cuenta suma
multiplica supera consigue triunfa disfruta explora crea""".split())
TECNICOS = set("""hipotenusa cateto bisectriz mediatriz derivada integral tensor escalar logaritmo cociente
determinante coordenada progresion sucesion conjetura axioma lema teorema incognita ecuacion variable constante
tangente coseno seno radian apice arista prisma cartabon escuadra centesima milesima porciento combinacion
multiplo divisor modulo indice rango dominio dimension segmento paralela diagonal nabla kappa iota rho psi chi
omicron epsilon lambda theta sigma omega gamma delta beta alfa zeta phi tau mu nu xi quantum numerus summa ratio""".split())
INGLES = set("boost next king player power town vip full flash go top max jump click smart crack pro up kid kids junior byte bit bot".split())
FAMOSOS = set("gauss pitagoras fibonacci euler newton".split())
VACIAS = "del por con en mas otro otros nuevo nueva primer buen buena al el la un una los las mi tu su soy somos ese esa este esta todo todos sin para hasta desde sobre entre muy tan ya hoy cada".split()
DESCRIPTIVOS = set("mates matematicas calculo algebra geometria aritmetica operaciones numeros examen cole clase profe".split())

def silabas(p):
    p = norm(re.sub(r"\d+", "", p))
    grupos = re.findall(r"[aeiou]+", p)
    return max(1, len(grupos))

def rubrica(nombre):
    n = norm(nombre)
    letras = re.sub(r"\d+", "", n)
    pts, por = 50, []
    L = len(letras)
    if L <= 6: pts += 12; por.append("muy corto")
    elif L <= 8: pts += 8; por.append("corto")
    elif L <= 10: pts += 3
    elif L <= 12: pts -= 4; por.append("largo")
    else: pts -= 10; por.append("muy largo")
    s = silabas(nombre)
    if s <= 3: pts += 6
    elif s == 4: pts += 2
    elif s == 5: pts -= 3; por.append("5 sílabas")
    else: pts -= 8; por.append("muchas sílabas")
    raras = set(c for c in letras if c in "kwxy")
    if raras: pts -= 4 * len(raras); por.append("letra difícil de escribir al oído (" + "".join(sorted(raras)) + ")")
    if re.search(r"x10$", n): pts -= 6; por.append("«x10» se lee «por diez», ambiguo")
    m = re.search(r"(\d+)$", n)
    if m and m.group(1) not in ("10",): pts -= 12; por.append(f"el número {m.group(1)} no es la nota soñada: diluye la marca «10»")
    if re.search(r"(100|1000|mil)$", n): pts -= 3
    base = re.sub(r"\d+$", "", n)
    if re.search(r"\d", base): pts -= 8; por.append("número en medio del nombre")
    if base.startswith("mates") and len(base) > 5:
        resto = base[5:]
        pts += 2; por.append("Mates + palabra: dice qué es, pero solo sirve para mates")
        if resto in INGLES: pts -= 5; por.append("anglicismo")
        if resto in DESCRIPTIVOS: pts -= 6; por.append("descriptivo, difícil de registrar")
    elif base.endswith("mates") and len(base) > 5:
        resto = base[:-5]
        pts += 1; por.append("palabra + mates: solo sirve para mates")
        if resto in TECNICOS: pts -= 6; por.append("término técnico, frío para niños y padres")
        if resto in FAMOSOS: pts -= 6; por.append("nombre de matemático, muy usado por academias")
    elif m and m.group(1):
        if base in VERBOS_POSITIVOS: pts += 12; por.append("verbo positivo + 10: llamada a la acción, memorable y sirve para más asignaturas")
        elif base in TECNICOS: pts -= 6; por.append("término técnico + 10, frío para niños y padres")
        elif base in FAMOSOS: pts -= 4; por.append("matemático famoso: muy usado por academias, poco distintivo")
        elif base in DESCRIPTIVOS: pts -= 6; por.append("descriptivo (dice la materia), difícil de registrar")
        elif base in INGLES: pts -= 4; por.append("anglicismo")
        elif re.match("^(" + "|".join(VACIAS) + ")([a-z]|$)", base) or base in VACIAS: pts -= 15; por.append("frase o palabra vacía + 10: no es una marca")
        else: pts += 2; por.append("palabra + 10")
    else:
        pts += 6; por.append("nombre inventado o sin 10: distintivo, pero hay que explicarlo")
    if base in DESCRIPTIVOS and not base.startswith("mates"): pass
    return max(0, min(100, pts)), "; ".join(por) or "sin observaciones"

def manuales():
    out = {}
    p = os.path.join(AQUI, "scores.txt")
    if not os.path.exists(p): return out
    for ln in open(p, encoding="utf-8"):
        ln = ln.strip()
        if not ln or ln.startswith("#"): continue
        nombre, score, motivo = (x.strip() for x in ln.split("|", 2))
        out[norm(nombre)] = (float(score), motivo)
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--solo-probar", action="store_true")
    ap.add_argument("--todo", action="store_true", help="repuntuar también los que ya tienen score")
    a = ap.parse_args()
    man = manuales()
    filas = todos("id,nombre,status,score,orden")
    ahora = datetime.now(timezone.utc).isoformat()
    cambios = []
    for f in filas:
        k = norm(f["nombre"])
        if k in man:
            score, motivo = man[k]; motivo = "Claude: " + motivo
        else:
            if f["score"] is not None and not a.todo: continue
            score, motivo = rubrica(f["nombre"]); motivo = "Rúbrica: " + motivo
        if f["score"] is not None and float(f["score"]) == score and not a.todo and k not in man: continue
        body = {"score": score, "score_motivo": motivo, "score_at": ahora}
        if f["status"] == "pendiente": body["orden"] = round((100 - score) * 10)
        cambios.append((f, body))
    print(f"{len(filas)} nombres, {len(cambios)} a actualizar ({len(man)} manuales)", file=sys.stderr)
    for f, body in sorted(cambios, key=lambda x: -x[1]["score"])[:40]:
        print(f"{body['score']:5.0f}  {f['nombre']:<18} {body['score_motivo'][:90]}")
    if a.solo_probar: return
    for f, body in cambios:
        api("PATCH", f"?id=eq.{f['id']}", body)
    print("guardado", file=sys.stderr)

if __name__ == "__main__":
    main()
