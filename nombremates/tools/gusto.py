"""Filtro «gusto Paco»: predice si a Paco le gustará un nombre a partir de
sus 👍/👎, no de la nota de las 6 medidas (que no predice su gusto: con
~2.900 decisiones, el % de 👍 es el mismo con nota 76 que con 86).

Cada nombre se parte en piezas: la parte de mates (mates, mate, mati,
cifra, suma, tablas, números, cuentas, ceros…) y la otra pieza («rock»,
«rompe», «nauta»…). La señal es cómo le han ido a esa otra pieza y a sus
vecinas (mismo comienzo) en las decisiones de Paco, con suavizado hacia
la media (3 %).

Uso: python3 nombremates/tools/gusto.py Nombre1 Nombre2 …     → % estimado y evidencia
     python3 nombremates/tools/gusto.py --json fichero.json     → lo mismo para candidatos
     python3 nombremates/tools/gusto.py --resumen               → piezas que más gustan / disgustan
Úsalo como pista, no como juez: la decisión final es tuya, leyendo los
👍 de Paco y sus 👎 recientes.
"""
import json, math, os, re, sys, unicodedata, urllib.request, collections

MATES = ["matematicas", "mates", "mate", "mati", "math", "cifras", "cifra", "sumas", "suma", "tablas", "tabla",
         "numeros", "numero", "cuentas", "cuenta", "ceros", "cero", "calculo", "calculos"]

def slug(s): return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", s.lower()).encode("ascii", "ignore").decode())

def piezas(nombre):
    """Devuelve (pieza_mates, otra) — p. ej. Rompeceros → ('ceros', 'rompe')."""
    s = slug(nombre)
    for m in MATES:
        if s.endswith(m) and len(s) > len(m) + 1: return m, s[: -len(m)]
    for m in MATES:
        if s.startswith(m) and len(s) > len(m) + 1: return m, s[len(m):]
    return "", s

def sql(q):
    r = urllib.request.Request("https://api.supabase.com/v1/projects/dzlhsdpgyxnjwudmrnul/database/query",
        data=json.dumps({"query": q}).encode(), method="POST",
        headers={"Authorization": "Bearer " + os.environ["SUPABASE_ACCESS_TOKEN"], "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(r, timeout=60))

def decisiones():
    return sql("select nombre, status in ('me_gusta','favorito') si from public.nombremates_ideas where status in ('me_gusta','favorito','no_me_gusta')")

class Modelo:
    def __init__(self, filas):
        self.base = sum(r["si"] for r in filas) / max(1, len(filas))
        self.otra = collections.defaultdict(lambda: [0, 0])   # pieza → [sí, total]
        self.raiz = collections.defaultdict(lambda: [0, 0])   # 4 primeras letras de la pieza
        self.mates = collections.defaultdict(lambda: [0, 0])
        self.gustan = []
        for r in filas:
            m, o = piezas(r["nombre"])
            for d, k in ((self.otra, o), (self.raiz, o[:4]), (self.mates, m)):
                d[k][0] += r["si"]; d[k][1] += 1
            if r["si"]: self.gustan.append(r["nombre"])
    def _p(self, c, peso):
        return (c[0] + peso * self.base) / (c[1] + peso)
    def gusto(self, nombre):
        m, o = piezas(nombre)
        po, pr, pm = self._p(self.otra[o], 3), self._p(self.raiz[o[:4]], 6), self._p(self.mates[m], 20)
        # Se combinan como en un Bayes ingenuo: cada evidencia multiplica las
        # probabilidades (así «tablas», 0 de 55, hunde aunque la otra pieza guste).
        lg = lambda x: math.log(x / (1 - x))
        b = lg(self.base)
        z = b + (lg(po) - b) + 0.5 * (lg(pr) - b) + (lg(pm) - b)
        p = 1 / (1 + math.exp(-z))
        ev = f"pieza «{o}» {self.otra[o][0]}/{self.otra[o][1]} · raíz «{o[:4]}» {self.raiz[o[:4]][0]}/{self.raiz[o[:4]][1]} · «{m or '—'}» {self.mates[m][0]}/{self.mates[m][1]}"
        return round(100 * p, 1), ev

def main():
    a = sys.argv[1:]
    mod = Modelo(decisiones())
    if a and a[0] == "--resumen":
        filas = sorted(((mod._p(c, 3), k, c) for k, c in mod.otra.items() if c[1] >= 1), reverse=True)
        print(f"media: {100 * mod.base:.1f} % de 👍")
        print("piezas que más le gustan:", ", ".join(f"{k} {c[0]}/{c[1]}" for _, k, c in filas[:40]))
        print("parte de mates:", ", ".join(f"{k or '—'} {c[0]}/{c[1]}" for k, c in sorted(mod.mates.items(), key=lambda x: -x[1][1])))
        return
    nombres = [c["nombre"] for c in json.load(open(a[1], encoding="utf-8"))] if a and a[0] == "--json" else a
    for n in sorted(nombres, key=lambda n: -mod.gusto(n)[0]):
        g, ev = mod.gusto(n)
        print(f"{g:5.1f} %  {n:18s} {ev}")

if __name__ == "__main__":
    main()
