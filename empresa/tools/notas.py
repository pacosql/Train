"""Ranking de Claude para TODO lo cargado: pone las 6 medidas, el score y el
porqué a cada nombre que aún no tiene ficha, y reordena la cola.

Las notas salen del propio fichero de candidatos, en un tercer campo:

    Nombre|por qué|c f m s d b      (corto fácil memorable sugiere distintivo búsqueda, 0-10)

Para los nombres sin notas en el fichero se usa una rúbrica automática
(longitud, pronunciación en español e inglés, competencia de la criba).
Las fichas escritas a mano (tools/fichas.json, fichas.py) mandan sobre esto:
este script nunca toca un nombre que ya tenga medidas, salvo con --todo.

    python3 empresa/tools/notas.py empresa/tools/out/candidatos.txt [--todo]
"""
import json, os, re, sys, unicodedata, urllib.parse, urllib.request
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from medidas import MEDIDAS as M, total
anon = re.search(r"eyJ[^\"']+", open(os.path.join(AQUI, "..", "config.js")).read()).group(0)
BASE = "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1/empresa_ideas"
H = {"apikey": anon, "Authorization": f"Bearer {anon}", "Content-Type": "application/json"}

def req(method, url, body=None):
    import time
    for i in range(5):
        try:
            r = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, method=method, headers={**H, "Prefer": "return=minimal"})
            t = urllib.request.urlopen(r, timeout=60).read()
            return json.loads(t) if t else None
        except Exception:
            if i == 4: raise
            time.sleep(2 * (i + 1))

def norm(s): return unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode()
def silabas(s): return max(1, len(re.findall(r"[aeiouy]+", norm(s))))

def leer_notas(path):
    out = {}
    if not path or not os.path.exists(path): return out
    for ln in open(path, encoding="utf8"):
        p = [x.strip() for x in ln.split("|")]
        if len(p) >= 3 and not ln.startswith("#"):
            n = [int(x) for x in p[2].split()]
            if len(n) == 6: out[norm(p[0])] = n
    return out

def rubrica(nombre):
    n = norm(nombre); L = len(n)
    c = 10 if L <= 6 else 9 if L <= 8 else 8 if L <= 10 else 6 if L <= 12 else 5 if L <= 14 else 3
    f = 9 - 2 * len(re.findall(r"j|ll|rr|gue|gui|que|qui", n)) - (1 if "z" in n else 0) - (1 if "h" in n else 0)
    return [c, max(3, f), 6, 5, 7, 6]

def motivos(nombre, notas, row):
    c, f, m, s, d, b = notas
    L = len(norm(nombre))
    leve = (row.get("colision_detalle") or "").split("YouTube: ")[-1].rstrip(".")
    sin_choque = "nada con ese nombre" in leve
    return {
        "corto": f"{L} letras, {silabas(nombre)} sílabas",
        "facil": "se dice y se escribe igual en español y en inglés" if f >= 8 else "en uno de los dos idiomas cuesta un poco decirlo o escribirlo" if f >= 6 else "hay que deletrearlo, sobre todo en inglés",
        "memorable": "crea una imagen clara" if m >= 8 else "algo de imagen" if m >= 6 else "abstracto, cuesta recordarlo",
        "sugiere": "suena a estudio que crea productos y negocios, sin atarse a una asignatura" if s >= 8 else "lo sugiere a medias" if s >= 6 else "no dice nada de lo que haces",
        "distintivo": ("sin desarrolladores, apps ni canales parecidos" if sin_choque else "hay algo parecido: " + leve) if d >= 7 else "palabra muy usada en nombres de empresa" if d >= 5 else "muy común o descriptivo",
        "busqueda": "buscarlo lleva solo a ti" if b >= 8 else "compite con otros resultados" if b >= 6 else "mucho ruido en Google",
    }

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    todo = "--todo" in sys.argv
    notas = leer_notas(args[0] if args else None)
    filas, off = [], 0
    while True:
        p = json.load(urllib.request.urlopen(urllib.request.Request(f"{BASE}?select=id,nombre,status,porque,metodo,medidas,colision_detalle&status=in.(pendiente,me_gusta,favorito,vetado)&order=id&limit=1000&offset={off}", headers=H)))
        filas += p
        if len(p) < 1000: break
        off += 1000
    n = 0
    for r in filas:
        if r["medidas"] and not todo: continue
        k = norm(r["nombre"])
        ns = notas.get(k) or rubrica(r["nombre"])
        mot = motivos(r["nombre"], ns, r)
        med = {m: {"nota": v, "por_que": mot[m]} for m, v in zip(M, ns)}
        med["tipo"] = r["metodo"] or ""
        sc = total(dict(zip(M, ns)))
        body = {"medidas": med, "score": sc, "score_motivo": "Claude: " + (r["porque"] or "")}
        # < 70 va a la reserva (orden ≥ 100000): sigue en la cola, detrás de los buenos.
        if r["status"] == "pendiente": body["orden"] = round((100 - sc) * 10) + (0 if sc >= 70 else 100000)
        req("PATCH", f"{BASE}?id=eq.{r['id']}", body); n += 1
    print(f"{n} nombres puntuados ({len(notas)} con notas a mano en el fichero)")

if __name__ == "__main__":
    main()
