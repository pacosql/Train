"""Aprende los gustos de Paco de sus decisiones y reordena la cola.

Cada nombre se parte en piezas («rasgos»): cabeza (Tinta, Azul, Trail…),
cola (Studios, North, Labs…), palabras que lo forman, familia (metodo),
longitud y número de piezas. Cada decisión suma o resta a sus rasgos:

    ⭐ +3   👍 +1.5   💚 +1 (me gusta, descartado)   👎 −0.3   🙅 −1.2

y las decisiones recientes pesan más (vida media: 600 decisiones), así lo
último que ha marcado manda. La afinidad de un pendiente es la suma de lo
que valen sus rasgos (con encogimiento: un rasgo visto 2 veces cuenta poco).

La cola sale así:
  - 3 de cada 4 huecos: el pendiente con más (afinidad + nota de Claude),
    sin repetir cabeza en los 4 últimos ni familia en el último.
  - 1 de cada 4 huecos: EXPLORAR, el mejor de Claude entre las cabezas que
    Paco casi no ha visto (< 3 decisiones). Así la cola no se encierra en lo
    ya conocido.
  - Cada vez que una cabeza vuelve a salir pierde puntos: la cola se reparte.

    python3 empresa/tools/afinidad.py            # reordena la cola
    python3 empresa/tools/afinidad.py --ver      # solo enseña rasgos y la cola, sin tocar nada
"""
import json, math, os, re, sys, unicodedata, urllib.request
AQUI = os.path.dirname(os.path.abspath(__file__))
anon = re.search(r"eyJ[^\"']+", open(os.path.join(AQUI, "..", "config.js")).read()).group(0)
BASE = "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1/empresa_ideas"
H = {"apikey": anon, "Authorization": f"Bearer {anon}", "Content-Type": "application/json"}

PESO = {"favorito": 3.0, "me_gusta": 1.5, "me_gusta_descartado": 1.0, "no_me_gusta": -0.3, "nada": -1.2}
VIDA_MEDIA = 600      # decisiones
ENCOGE = 4.0          # un rasgo necesita varias decisiones para pesar
COLAS = ["studios", "studio", "labs", "lab", "works", "games", "media", "learning", "kids", "house", "co"]

def norm(s): return unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode()

def piezas(nombre):
    """Palabras del nombre: por mayúsculas (TintaNorth) y separando colas pegadas (Tintastudios)."""
    n = norm(nombre)
    trozos = [t.lower() for t in re.findall(r"[A-Z]?[a-z]+|[A-Z]+(?![a-z])|\d+", n)] or [n.lower()]
    out = []
    for t in trozos:
        for c in COLAS:
            if t.endswith(c) and len(t) > len(c) + 2:
                out += [t[: -len(c)], c]; break
        else:
            out.append(t)
    return out

def cabeza(nombre):
    """Raíz para no repetir: las 4 primeras letras (Taledusk y TaleReef son la misma idea)."""
    return norm(nombre).lower()[:4]

def rasgos(row):
    p = piezas(row["nombre"])
    L = len(norm(row["nombre"]))
    r = {f"cab:{cabeza(row['nombre'])}", f"w:{p[0]}", f"cola:{p[-1]}" if len(p) > 1 else "cola:(sola)", f"n:{min(len(p), 3)}",
         f"len:{'corto' if L <= 7 else 'medio' if L <= 11 else 'largo'}", f"met:{row.get('metodo') or '?'}"}
    r |= {f"w:{t}" for t in p}
    return r

def leer():
    filas, off = [], 0
    while True:
        p = json.load(urllib.request.urlopen(urllib.request.Request(
            f"{BASE}?select=id,nombre,status,metodo,score,orden,decidido_at,nota&order=id&limit=1000&offset={off}", headers=H)))
        filas += p
        if len(p) < 1000: break
        off += 1000
    return filas

def modelo(filas):
    dec = [f for f in filas if f["status"] in PESO and not (f.get("nota") or "").startswith("(quitado por Claude)")]
    dec.sort(key=lambda f: f["decidido_at"] or "")
    suma, cuenta = {}, {}
    for i, f in enumerate(dec):
        w = PESO[f["status"]] * 0.5 ** ((len(dec) - 1 - i) / VIDA_MEDIA)
        for r in rasgos(f):
            suma[r] = suma.get(r, 0) + w; cuenta[r] = cuenta.get(r, 0) + 1
    valor = {r: suma[r] / (cuenta[r] + ENCOGE) for r in suma}
    return valor, cuenta

def afinidad(row, valor):
    return sum(valor.get(r, 0) for r in rasgos(row))

def ordenar(pend, valor, cuenta):
    for p in pend:
        p["_af"] = afinidad(p, valor)
        p["_v"] = p["_af"] + (p.get("score") or 70) / 20     # nota de Claude como desempate suave
        p["_cab"] = cabeza(p["nombre"])
        # Explorar = cabeza que Paco casi no ha visto (menos de 3 decisiones).
        p["_nuevo"] = cuenta.get(f"cab:{p['_cab']}", 0) < 3
    cola, usados, veces = [], set(), {}
    while len(usados) < len(pend):
        quiere_explorar = len(cola) % 4 == 3
        libres = [p for p in pend if p["id"] not in usados]
        fuente = [p for p in libres if p["_nuevo"]] if quiere_explorar else []
        fuente = fuente or libres
        ult_cab = {c["_cab"] for c in cola[-4:]}
        # Cada vez que una cabeza ya ha salido pierde 0.25: la cola se reparte
        # entre muchas ideas en vez de alternar dos.
        clave = (lambda p: -(p.get("score") or 0) / 20 + 0.25 * veces.get(p["_cab"], 0)) if quiere_explorar \
            else (lambda p: -p["_v"] + 0.25 * veces.get(p["_cab"], 0))
        cand = sorted(fuente, key=clave)
        elegido = next((p for p in cand if p["_cab"] not in ult_cab), cand[0])
        cola.append(elegido); usados.add(elegido["id"]); veces[elegido["_cab"]] = veces.get(elegido["_cab"], 0) + 1
    return cola

def main():
    ver = "--ver" in sys.argv
    filas = leer()
    valor, cuenta = modelo(filas)
    top = sorted(valor.items(), key=lambda x: -x[1])
    print("Rasgos que más gustan:", ", ".join(f"{k} {v:+.2f}" for k, v in top[:25]))
    print("Rasgos que menos:     ", ", ".join(f"{k} {v:+.2f}" for k, v in top[-15:]))
    pend = [f for f in filas if f["status"] == "pendiente" and (f.get("score") or 0) >= 70 and 0 <= (f.get("orden") or 0) < 100000]
    cola = ordenar(pend, valor, cuenta)
    print("Cola (primeros 40):", " · ".join(f"{p['nombre']}{'*' if p['_nuevo'] else ''}" for p in cola[:40]))
    if ver: return
    for i, p in enumerate(cola):
        r = urllib.request.Request(f"{BASE}?id=eq.{p['id']}", data=json.dumps({"orden": 10 + i}).encode(), method="PATCH",
                                   headers={**H, "Prefer": "return=minimal"})
        urllib.request.urlopen(r, timeout=60).read()
    print(f"{len(cola)} pendientes reordenados por afinidad (* = exploración)")

if __name__ == "__main__":
    main()
