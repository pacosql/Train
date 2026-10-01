"""Genera explorar/esquema.json: tablas mates10_*, columnas y claves foráneas.

La página Explorar lo usa para navegar relaciones (la anon key no puede leer
information_schema). Volver a ejecutar tras cada migración.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from db import q  # noqa: E402

cols = q("""select table_name t, column_name c, data_type d, ordinal_position o
            from information_schema.columns where table_schema='public' and table_name like 'mates10\\_%'
            order by table_name, ordinal_position""")
fks = q("""select tc.table_name t, kcu.column_name c, ccu.table_name rt, ccu.column_name rc
           from information_schema.table_constraints tc
           join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
           join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
           where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema='public' and tc.table_name like 'mates10\\_%'""")
pks = q("""select tc.table_name t, kcu.column_name c from information_schema.table_constraints tc
           join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name and kcu.table_schema = tc.table_schema
           where tc.constraint_type='PRIMARY KEY' and tc.table_schema='public' and tc.table_name like 'mates10\\_%'""")
out = {}
for r in cols:
    t = r["t"][len("mates10_"):]
    out.setdefault(t, {"columnas": [], "fks": {}, "pk": []})["columnas"].append({"nombre": r["c"], "tipo": r["d"]})
for r in fks:
    out[r["t"][8:]]["fks"][r["c"]] = {"tabla": r["rt"][8:], "columna": r["rc"]}
for r in pks:
    out[r["t"][8:]]["pk"].append(r["c"])
# fks lógicas no declaradas (objeto polimórfico / uuid[] / sin FK por diseño)
extra = {("intento", "sesion_id"): "sesion"}
for (t, c), rt in extra.items():
    out[t]["fks"].setdefault(c, {"tabla": rt, "columna": "id"})
dest = os.path.join(os.path.dirname(__file__), "..", "explorar", "esquema.json")
json.dump(out, open(dest, "w"), ensure_ascii=False, indent=1)
print(len(out), "tablas,", sum(len(v["fks"]) for v in out.values()), "relaciones")
