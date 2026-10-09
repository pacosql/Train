"""Ranking de Claude con la metodología de «¿Qué es un buen nombre?»:
seis medidas de 0 a 10 (corto, facil, memorable, sugiere, distintivo,
busqueda) y total = media ponderada × 10 (tools/medidas.py; distintivo pesa la mitad), igual que las 25 marcas de referencia.
Lee tools/fichas.json y guarda en empresa_ideas: medidas, score (total)
y score_motivo (el porqué). Uso: python3 empresa/tools/fichas.py
"""
import json, os, re, urllib.parse, urllib.request
AQUI = os.path.dirname(os.path.abspath(__file__))
import sys; sys.path.insert(0, AQUI)
from medidas import MEDIDAS as M, total as total_ponderado
anon = re.search(r"eyJ[^\"']+", open(os.path.join(AQUI, "..", "config.js")).read()).group(0)
BASE = "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1/empresa_ideas"
H = {"apikey": anon, "Authorization": f"Bearer {anon}", "Content-Type": "application/json"}
def req(method, url, body=None):
    import time
    for intento in range(5):  # la red a veces corta la conexión: reintentar
        try:
            r = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, method=method, headers={**H, "Prefer": "return=representation"})
            return json.load(urllib.request.urlopen(r, timeout=60))
        except Exception:
            if intento == 4: raise
            time.sleep(2 * (intento + 1))
for f in json.load(open(os.path.join(AQUI, "fichas.json"), encoding="utf-8")):
    medidas = {k: {"nota": f["medidas"][k][0], "por_que": f["medidas"][k][1]} for k in M}
    total = total_ponderado({k: medidas[k]["nota"] for k in M})
    medidas["tipo"] = f["tipo"]
    n = urllib.parse.quote(f["nombre"])  # tildes y eñes en la URL
    filas = req("PATCH", f"{BASE}?nombre=ilike.{n}", {"medidas": medidas, "score": total, "score_motivo": "Claude: " + f["por_que"]})
    # Los pendientes, en la cola por puntuación (los mejores primero).
    req("PATCH", f"{BASE}?nombre=ilike.{n}&status=eq.pendiente", {"orden": round((100 - total) * 10)})
    print(total, f["nombre"], "→", len(filas), "fila(s)")
