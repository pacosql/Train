"""Imprime el estado de Nombre Mates para preparar la siguiente tanda.

    python3 nombremates/tools/contexto.py            # resumen + gustos + sugerencias + nombres ya probados
    python3 nombremates/tools/contexto.py --atender  # además marca las sugerencias como atendidas
    python3 nombremates/tools/contexto.py --probados # además lista todos los nombres ya probados
(cribar.py salta solo los repetidos, así que la lista completa es opcional)
"""
import json, sys, urllib.request
URL = "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1"
ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGhzZHBneXhuand1ZG1ybnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzEzMjgsImV4cCI6MjEwNTAwNzMyOH0.B572twWEEJjnNr1SZDrUCHBG9VgIEo9RXyZXyszjhrM"
H = {"apikey": ANON, "Authorization": "Bearer " + ANON, "Content-Type": "application/json"}
def sb(path, method="GET", body=None):
    h = dict(H)
    if method != "GET": h["Prefer"] = "return=minimal"
    req = urllib.request.Request(f"{URL}/{path}", data=json.dumps(body).encode() if body else None, method=method, headers=h)
    with urllib.request.urlopen(req, timeout=60) as r:
        t = r.read(); return json.loads(t) if t else None
def sb_all(path):
    out = []
    for off in range(0, 100000, 1000):
        p = sb(f"{path}&limit=1000&offset={off}"); out += p
        if len(p) < 1000: break
    return out
ideas = sb_all("nombremates_ideas?select=nombre,status,nota,tanda,metodo,decidido_at,orden&order=id")
cnt = {}
for i in ideas: cnt[i["status"]] = cnt.get(i["status"], 0) + 1
print("== ESTADO ==", json.dumps(cnt, ensure_ascii=False), "| tanda máxima:", max((i["tanda"] or 0) for i in ideas) if ideas else 0)
# La cola de revisión va por `orden`: los buenos primero; los que puntuaron
# flojo como marca tienen orden >= 100000 (reserva) y no cuentan como
# pendientes "de verdad" para decidir si hace falta otra tanda.
buenos = sum(1 for i in ideas if i["status"] == "pendiente" and (i["orden"] or 0) < 100000)
print("PENDIENTES:", buenos, "(buenos, los que cuentan para el umbral de 200) · en reserva flojos:", cnt.get("pendiente", 0) - buenos)
print("\n== ME GUSTA / DEFINITIVOS (con comentario si lo hay) ==")
for i in ideas:
    if i["status"] in ("me_gusta", "favorito"): print(f"  {'⭐' if i['status']=='favorito' else '👍'} {i['nombre']} [{i['metodo']}]" + (f" — «{i['nota']}»" if i["nota"] else ""))
print("\n== DESCARTADOS CON COMENTARIO ==")
for i in ideas:
    if i["status"] == "no_me_gusta" and i["nota"]: print(f"  👎 {i['nombre']} — «{i['nota']}»")
print("\n== DESCARTADOS (últimos 300, más reciente al final) ==")
des = sorted([i for i in ideas if i["status"] == "no_me_gusta"], key=lambda i: i["decidido_at"] or "")
print("  " + " ".join(i["nombre"] for i in des[-300:]))
log = sb("nombremates_rutina_log?select=created_at,modelo,tanda,cargados,vetados,com_ocupado,familias&order=id.desc&limit=8")
print("\n== ÚLTIMAS EJECUCIONES DE LA RUTINA (más reciente primero) ==")
for l in log or []:
    print(f"  {l['created_at'][:16]} tanda {l['tanda']} · {l['modelo'] or '?'} · cargados {l['cargados']}, vetados {l['vetados']}, .com ocupado {l['com_ocupado']} · {l['familias']}")
sug = sb("nombremates_sugerencias?select=id,texto,atendida,created_at&order=created_at")
print("\n== COMENTARIOS GENERALES DEL USUARIO ==")
for s in sug: print(f"  {'✓' if s['atendida'] else '●'} {s['texto']}")
if "--atender" in sys.argv:
    for s in sug:
        if not s["atendida"]: sb(f"nombremates_sugerencias?id=eq.{s['id']}", "PATCH", {"atendida": True})
if "--probados" in sys.argv:
    comp = sb_all("nombremates_comprobados?select=nombre&order=nombre")
    print(f"\n== YA PROBADOS ({len(comp)} nombres; no repetir ninguno) ==")
    print(" ".join(c["nombre"] for c in comp))
