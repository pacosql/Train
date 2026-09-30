"""Lecciones de la minería, guardadas en la base de datos (nombremates_lecciones).

Las sesiones de la rutina no siempre pueden hacer push al repo, así que lo
que aprende cada ejecución se guarda aquí para que la siguiente lo lea.
Uso: python3 nombremates/tools/lecciones.py leer [n]          → las n últimas (40 por defecto)
     python3 nombremates/tools/lecciones.py anotar "texto" [sesión]
"""
import json, os, sys, urllib.request

def sql(q):
    r = urllib.request.Request("https://api.supabase.com/v1/projects/dzlhsdpgyxnjwudmrnul/database/query",
        data=json.dumps({"query": q}).encode(), method="POST",
        headers={"Authorization": "Bearer " + os.environ["SUPABASE_ACCESS_TOKEN"], "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(r, timeout=60))
def lit(s): return "'" + (s or "").replace("'", "''") + "'"

accion = sys.argv[1] if len(sys.argv) > 1 else ""
if accion == "leer":
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 40
    for r in reversed(sql(f"select created_at, texto from public.nombremates_lecciones order by id desc limit {n}")):
        print(f"- {r['created_at'][:16]}: {r['texto']}")
elif accion == "anotar" and len(sys.argv) > 2:
    sql("insert into public.nombremates_lecciones (sesion, texto) values (" + lit(sys.argv[3] if len(sys.argv) > 3 else "") + ", " + lit(sys.argv[2]) + ")")
    print("lección guardada")
else:
    print(__doc__); sys.exit(2)
