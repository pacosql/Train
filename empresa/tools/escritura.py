"""Pone (o recalcula) la medida «escritura» — se escribe bien en español y en
inglés — a TODOS los nombres que ya tienen medidas, y rehace su score.
Paco, 15/10: «ponlo también como métrica y recalcúlalo».

    python3 empresa/tools/escritura.py          # todos
    python3 empresa/tools/escritura.py --ver    # solo enseña, no escribe
"""
import json, os, sys, urllib.request
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
from medidas import escritura, total, MEDIDAS
from notas import BASE, H, req

def main():
    ver = "--ver" in sys.argv
    filas, off = [], 0
    while True:
        p = json.load(urllib.request.urlopen(urllib.request.Request(f"{BASE}?select=id,nombre,status,medidas,score&medidas=not.is.null&order=id&limit=1000&offset={off}", headers=H)))
        filas += p
        if len(p) < 1000: break
        off += 1000
    cambios = 0
    for r in filas:
        med = r["medidas"]
        e, pq = escritura(r["nombre"])
        med["escritura"] = {"nota": e, "por_que": pq}
        notas = {k: med[k]["nota"] for k in MEDIDAS if isinstance(med.get(k), dict) and "nota" in med[k]}
        sc = total(notas)
        if ver:
            if r["status"] in ("favorito", "me_gusta", "pendiente"): print(f"{r['status'][:4]} {r['nombre']:<24} escritura {e:>2}  score {r['score']} → {sc}")
            continue
        body = {"medidas": med, "score": sc}
        if r["status"] == "pendiente": body["orden"] = round((100 - sc) * 10) + (0 if sc >= 70 else 100000)
        req("PATCH", f"{BASE}?id=eq.{r['id']}", body); cambios += 1
    print(f"{len(filas)} con medidas · {cambios} actualizados")
    if not ver:
        import afinidad; afinidad.main()

if __name__ == "__main__":
    main()
