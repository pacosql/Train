"""Genera ortografia10/datos.json a partir del material validado de orto/.

    python3 ortografia10/tools/datos.py

- P: palabras  [palabra, [faltas típicas], [ini, fin] | null, [opciones] | null, competencia, dificultad]
- M: ejercicios hechos a mano de orto/datos/manual (hueco, elige, caza, frase, parejas)
- F: frases reales de prensa que contienen una palabra de P: [frase, índice en P]
- C: competencias {id: [nombre, regla, truco, ejemplos, excepciones, bloque, curso]}
- B: bloques {id: [nombre, emoji]} · CU: cursos
"""
import json, os, re, random

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
ORTO = os.path.join(RAIZ, "orto", "datos")
SAL = os.path.join(RAIZ, "ortografia10", "datos.json")
random.seed(10)

pal = json.load(open(os.path.join(ORTO, "palabras.json")))
comp = json.load(open(os.path.join(ORTO, "competencias.json")))
frases = json.load(open(os.path.join(ORTO, "frases.json")))

# Palabras: nos quedamos con las que tienen alguna falta típica, sin repetir
# (palabra, competencia) y con las más frecuentes primero.
P, vistos = [], set()
for p in sorted(pal, key=lambda p: -p.get("f", 0)):
    if not p.get("alts") or (p["w"], p["c"]) in vistos or " " in p["w"]:
        continue
    vistos.add((p["w"], p["c"]))
    P.append([p["w"], p["alts"][:3], p.get("g"), p.get("op"), p["c"], p.get("d", 2)])

P = P[:4000]

# Frases de prensa con una palabra «traicionera» dentro (para cazar la falta).
idx = {}
for i, p in enumerate(P):
    idx.setdefault(p[0], i)
F, usadas = [], {}
for s in frases:
    if not (40 <= len(s) <= 120) or not s[0].isupper():
        continue
    toks = re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+", s)
    cand = [t for t in toks if t in idx and len(t) > 3]
    if not cand:
        continue
    t = random.choice(cand)
    if usadas.get(t, 0) >= 2:
        continue
    usadas[t] = usadas.get(t, 0) + 1
    F.append([s, idx[t]])
random.shuffle(F)
F = F[:1500]

M = []
for f in ["acentuacion", "adultos", "homofonos", "puntuacion", "pares_minimos"]:
    for it in json.load(open(os.path.join(ORTO, "manual", f + ".json"))):
        it = {k: v for k, v in it.items() if k in ("c", "t", "d", "q", "o", "a", "w", "x", "mal", "bien", "pares")}
        M.append(it)

C = {}
for c in comp["competencias"]:
    lec = c.get("lec") or {}
    C[c["id"]] = [c["n"], lec.get("regla", ""), lec.get("truco", ""), lec.get("ej", []), lec.get("exc", []), c["b"], c.get("c", 0)]

B = {b["id"]: [b["n"], b["e"]] for b in comp["bloques"]}
CU = comp["cursos"]
json.dump({"P": P, "F": F, "M": M, "C": C, "B": B, "CU": CU}, open(SAL, "w"), ensure_ascii=False, separators=(",", ":"))
print(f"P={len(P)} F={len(F)} M={len(M)} C={len(C)} -> {os.path.getsize(SAL) // 1024} KB")
