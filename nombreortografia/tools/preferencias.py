"""Aprende el gusto de Paco a partir de TODOS sus votos y reordena la cola.

    python3 nombreortografia/tools/preferencias.py              # informe de rasgos
    python3 nombreortografia/tools/preferencias.py --reordenar  # además reordena los pendientes

Cada nombre se describe con rasgos (largo, número de palabras, si lleva
«Orto-», «Ortografía» entera, cifras, «faltas», «tilde», familia…). Con los
votos se calcula, para cada rasgo, cuánto sube o baja la probabilidad de 👍
(Naive Bayes con suavizado de Laplace). Los votos recientes pesan más: el
gusto cambia según ve nombres.

Al reordenar, la cola queda así: 2 de cada 3 puestos son los pendientes con
más probabilidad de gustar, y 1 de cada 3 es una SORPRESA (lo más nuevo, de la
última tanda), para seguir explorando y que el modelo no se encierre.
"""
import json, math, os, re, sys, urllib.request
AQUI = os.path.dirname(os.path.abspath(__file__))
anon = re.search(r"eyJ[^\"']+", open(os.path.join(AQUI, "..", "config.js")).read()).group(0)
BASE = "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1/nombreortografia_ideas"
H = {"apikey": anon, "Authorization": f"Bearer {anon}", "Content-Type": "application/json"}

def req(method, url, body=None):
    import time
    for i in range(5):  # la red a veces corta la conexión: reintentar
        try:
            r = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, method=method, headers={**H, "Prefer": "return=minimal"})
            t = urllib.request.urlopen(r, timeout=60).read()
            return json.loads(t) if t else None
        except Exception:
            if i == 4: raise
            time.sleep(2 * (i + 1))

def rasgos(nombre, metodo=""):
    l = nombre.lower(); f = set()
    palabras = max(1, len(re.findall(r"[A-ZÁÉÍÓÚÑ]|\d+", nombre)))
    f.add(f"palabras={min(palabras, 4)}")
    L = len(l); f.add("largo<=8" if L <= 8 else "largo9-12" if L <= 12 else "largo13-16" if L <= 16 else "largo>16")
    lo = l.replace("orthografia", "ortografia")
    if "ortografia" in lo: f.add("ortografia_entera"); f.add("ortografia_delante" if lo.startswith("ortografia") else "ortografia_detras")
    elif l.startswith("orto") or l.startswith("ortho"): f.add("orto_prefijo")
    if "orth" in l: f.add("th")
    if re.search(r"\d", nombre): f.add("cifra")
    if re.search(r"diez|cien|10|100|365|matricula|sobresal|apt[oa]|pleno|nota", l): f.add("nota_maxima")
    for w in ("falta", "tilde", "lengua", "letra", "grafi", "escrib", "ebau", "opo"):
        if w in l: f.add("palabra:" + w)
    if not re.search(r"ortografia|orto|orth|falta|tilde|lengua|letra|grafi|escrib", l): f.add("sin_raiz_conocida")
    if metodo: f.add("familia:" + metodo.split("(")[0].strip()[:40])
    return f

def modelo(decididas):
    tmax = max((d["tanda"] or 1) for d in decididas)
    g = {}; b = {}; G = B = 0.0
    for d in decididas:
        w = 0.5 + (d["tanda"] or 1) / tmax          # lo reciente pesa hasta 3× más que lo viejo
        bueno = d["status"] in ("me_gusta", "favorito")
        if d["status"] == "favorito": w *= 2
        if d["status"] == "nada": w *= 2
        for r in rasgos(d["nombre"], d.get("metodo") or ""):
            (g if bueno else b)[r] = (g if bueno else b).get(r, 0) + w
        if bueno: G += w
        else: B += w
    peso = {r: math.log((g.get(r, 0) + 1) / (G + 2)) - math.log((b.get(r, 0) + 1) / (B + 2)) for r in set(g) | set(b)}
    return peso, math.log(G / B), g, b

def prob(nombre, metodo, peso, base):
    # ×0.5: los rasgos se solapan (corto y una palabra van juntos) y Naive Bayes se pasa de confiado.
    z = base + 0.5 * sum(peso.get(r, 0) for r in rasgos(nombre, metodo) if not r.startswith("familia:"))
    return 1 / (1 + math.exp(-z))

# Cada cuántos puestos va una sorpresa (--cada 3 = 2 por probabilidad + 1 sorpresa).
CADA = int(sys.argv[sys.argv.index("--cada") + 1]) if "--cada" in sys.argv else 3

def main():
    todas = req("GET", f"{BASE}?select=id,nombre,status,tanda,metodo,score&limit=5000")
    dec = [d for d in todas if d["status"] in ("me_gusta", "favorito", "no_me_gusta", "nada")]
    peso, base, g, b = modelo(dec)
    print(f"== QUÉ LE GUSTA (de {len(dec)} votos; lo reciente pesa más) ==")
    for r, p in sorted(peso.items(), key=lambda kv: -kv[1]):
        if r.startswith("familia:") or g.get(r, 0) + b.get(r, 0) < 3: continue
        print(f"  {'+' if p > 0 else ''}{p:5.2f}  {r:22s} (👍{g.get(r, 0):.0f} 👎{b.get(r, 0):.0f})")
    pend = [d for d in todas if d["status"] == "pendiente"]
    if not pend: return
    for d in pend: d["p"] = prob(d["nombre"], d["metodo"] or "", peso, base)
    tmax = max((d["tanda"] or 0) for d in pend)
    sorpresas = sorted([d for d in pend if d["tanda"] == tmax], key=lambda d: -(d["score"] or 0))
    resto = sorted([d for d in pend if d["tanda"] != tmax], key=lambda d: -d["p"])
    # Las sorpresas también compiten por probabilidad: las que el modelo ve bien entran como «resto».
    favoritas = [d for d in sorpresas if d["p"] >= 0.3]
    sorpresas = [d for d in sorpresas if d["p"] < 0.3]
    resto = sorted(resto + favoritas, key=lambda d: -d["p"])
    cola = []
    while resto or sorpresas:
        for _ in range(CADA - 1):
            if resto: cola.append(resto.pop(0))
        if sorpresas: cola.append(sorpresas.pop(0))
    print("\n== CABEZA DE LA COLA (prob. de 👍) ==")
    for d in cola[:25]: print(f"  {d['p']:.0%}  {d['nombre']}  [t{d['tanda']}]")
    if "--reordenar" in sys.argv:
        for i, d in enumerate(cola):
            req("PATCH", f"{BASE}?id=eq.{d['id']}", {"orden": i - 10000})
        print(f"\nreordenados {len(cola)} pendientes ({CADA-1} por probabilidad + 1 sorpresa)")

if __name__ == "__main__":
    main()
