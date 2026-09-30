"""Sube al bucket privado mates10-fuentes los originales archivados en local (fuentes/raw/) que aún
tienen ruta local en mates10_fuente_archivo, y actualiza la ruta a storage:mates10-fuentes/…

    python3 mates10/tools/subir_raw.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from db import q, lit  # noqa: E402
from archivar import subir_bucket, ROOT  # noqa: E402

filas = q("select id, ruta from mates10_fuente_archivo where ruta like 'mates10/fuentes/raw/%'")
base = os.path.dirname(ROOT)
ok = falta = 0
for f in filas:
    p = os.path.join(base, f["ruta"])
    if not os.path.exists(p):
        falta += 1
        print("no está en local:", f["ruta"])
        continue
    nueva = subir_bucket(p, open(p, "rb").read())
    q(f"update mates10_fuente_archivo set ruta = {lit(nueva)} where id = {lit(f['id'])}")
    ok += 1
print(f"subidos {ok}, sin fichero local {falta}")
print(q("select count(*) n, pg_size_pretty(sum((metadata->>'size')::bigint)) tam from storage.objects where bucket_id='mates10-fuentes'"))
