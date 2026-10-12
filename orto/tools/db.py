# Ejecuta SQL contra el Supabase compartido con la Management API.
#   python3 orto/tools/db.py -f orto/supabase/001_esquema.sql
#   python3 orto/tools/db.py "select count(*) from orto_intento"
# Necesita SUPABASE_ACCESS_TOKEN en el entorno (nunca en el repo).
import json, os, sys, urllib.request
REF = "dzlhsdpgyxnjwudmrnul"
q = open(sys.argv[2]).read() if sys.argv[1] == "-f" else sys.argv[1]
req = urllib.request.Request(f"https://api.supabase.com/v1/projects/{REF}/database/query",
    data=json.dumps({"query": q}).encode(), method="POST",
    headers={"Authorization": "Bearer " + os.environ["SUPABASE_ACCESS_TOKEN"], "Content-Type": "application/json", "User-Agent": "orto-tools"})
try:
    print(urllib.request.urlopen(req).read().decode())
except urllib.error.HTTPError as e:
    print(e.code, e.read().decode()); sys.exit(1)
