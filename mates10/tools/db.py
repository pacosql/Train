"""Acceso a la base de datos de Mates10 vía la Management API de Supabase.

Usa $SUPABASE_ACCESS_TOKEN (nunca se guarda en el repo). Para DDL y cargas
masivas; la app usa la anon key.

    python3 mates10/tools/db.py "select count(*) from mates10_habilidad"
    python3 mates10/tools/db.py -f mates10/supabase/migrations/001_esquema.sql
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error

REF = "dzlhsdpgyxnjwudmrnul"
URL = f"https://api.supabase.com/v1/projects/{REF}/database/query"


def q(sql, retries=4):
    token = os.environ["SUPABASE_ACCESS_TOKEN"]
    body = json.dumps({"query": sql}).encode()
    for i in range(retries):
        req = urllib.request.Request(URL, data=body, method="POST", headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "mates10-tools",
        })
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.loads(r.read() or b"null")
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors="replace")
            if e.code in (429, 502, 503, 504) and i < retries - 1:
                time.sleep(2 ** (i + 1))
                continue
            raise RuntimeError(f"HTTP {e.code}: {msg[:2000]}") from None
        except (urllib.error.URLError, TimeoutError):
            if i < retries - 1:
                time.sleep(2 ** (i + 1))
                continue
            raise


def lit(v):
    """Literal SQL seguro para valores Python (str, num, bool, None, dict/list → jsonb)."""
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, (dict, list)):
        return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"


def arr(vals):
    return "array[" + ",".join(lit(v) for v in vals) + "]::text[]" if vals else "'{}'::text[]"


if __name__ == "__main__":
    if sys.argv[1] == "-f":
        sql = open(sys.argv[2], encoding="utf-8").read()
    else:
        sql = sys.argv[1]
    print(json.dumps(q(sql), ensure_ascii=False, indent=1, default=str)[:20000])
