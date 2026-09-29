"""Ranking de Claude con la metodología de «¿Qué es un buen nombre?»:
seis medidas de 0 a 10 (corto, facil, memorable, sugiere, distintivo,
busqueda) y total = media × 10, igual que las 25 marcas de referencia.
Lee tools/fichas.json y guarda en nombremates_ideas: medidas, score (total)
y score_motivo (el porqué). Uso: python3 nombremates/tools/fichas.py
"""
import json, os, re, urllib.request
AQUI = os.path.dirname(os.path.abspath(__file__))
M = ["corto", "facil", "memorable", "sugiere", "distintivo", "busqueda"]
anon = re.search(r"eyJ[^\"']+", open(os.path.join(AQUI, "..", "config.js")).read()).group(0)
BASE = "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1/nombremates_ideas"
H = {"apikey": anon, "Authorization": f"Bearer {anon}", "Content-Type": "application/json"}
def req(method, url, body=None):
    r = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None, method=method, headers={**H, "Prefer": "return=representation"})
    return json.load(urllib.request.urlopen(r, timeout=60))
for f in json.load(open(os.path.join(AQUI, "fichas.json"), encoding="utf-8")):
    medidas = {k: {"nota": f["medidas"][k][0], "por_que": f["medidas"][k][1]} for k in M}
    total = round(sum(m["nota"] for m in medidas.values()) / (10 * len(M)) * 100)
    medidas["tipo"] = f["tipo"]
    filas = req("PATCH", f"{BASE}?nombre=ilike.{f['nombre']}", {"medidas": medidas, "score": total, "score_motivo": "Claude: " + f["por_que"]})
    # Los pendientes, en la cola por puntuación (los mejores primero).
    req("PATCH", f"{BASE}?nombre=ilike.{f['nombre']}&status=eq.pendiente", {"orden": round((100 - total) * 10)})
    print(total, f["nombre"], "→", len(filas), "fila(s)")
