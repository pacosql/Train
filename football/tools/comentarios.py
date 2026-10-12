#!/usr/bin/env python3
"""Bandeja de Paco: 🔧 pendientes por ejercicio y 💬 comentarios generales.

Uso (desde la raíz del repo), normalmente después de transcribir.py:
    python3 football/tools/comentarios.py
        Lista los 🔧 abiertos y los 💬 pendientes, y descarga los adjuntos
        de cada comentario a /tmp/football-adjuntos/<id>/ para poder verlos
        (Claude puede abrir las imágenes con su herramienta de lectura).
    python3 football/tools/comentarios.py --atender ID "respuesta de una línea"
        Marca el comentario general ID como atendido con esa respuesta,
        que Paco ve en el menú de la app.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = "/tmp/football-adjuntos"


def config():
    src = open(os.path.join(ROOT, "config.js"), encoding="utf-8").read()
    return re.search(r'url:\s*"([^"]+)"', src).group(1).rstrip("/"), re.search(r'anonKey:\s*"([^"]+)"', src).group(1)


def api(method, url, key, body=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None)
    for h, v in (("apikey", key), ("Authorization", "Bearer " + key), ("Content-Type", "application/json"), ("Prefer", "return=minimal")):
        req.add_header(h, v)
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
        return json.loads(data) if data else None


def main():
    base, key = config()
    if "--atender" in sys.argv:
        i = sys.argv.index("--atender")
        cid, respuesta = sys.argv[i + 1], " ".join(sys.argv[i + 2 :]).strip()
        if not respuesta:
            sys.exit("Falta la respuesta.")
        api("PATCH", f"{base}/rest/v1/football_comentarios?id=eq.{int(cid)}", key,
            {"estado": "atendido", "respuesta": respuesta, "atendido_at": datetime.now(timezone.utc).isoformat()})
        print(f"💬 #{cid} marcado como atendido.")
        return

    revs = api("GET", f"{base}/rest/v1/football_ratings?review=eq.true&select=game,rating,note,transcripcion,updated_at&order=updated_at", key) or []
    print(f"🔧 {len(revs)} ejercicio(s) en Revisar")
    for r in revs:
        print(f"  · {r['game']} (valoración: {r['rating'] or 'ninguna'}): {r['note'] or r['transcripcion'] or '(audio sin transcribir)'}")

    coms = api("GET", f"{base}/rest/v1/football_comentarios?estado=eq.pendiente&select=*&order=created_at", key) or []
    print(f"\n💬 {len(coms)} comentario(s) general(es) pendiente(s)")
    for c in coms:
        texto = c["note"] or c["transcripcion"] or ("(audio sin transcribir)" if c["audio_path"] else "")
        print(f"  · #{c['id']} {c['created_at'][:16]}: {texto}")
        for a in c.get("adjuntos") or []:
            d = os.path.join(OUT, str(c["id"]))
            os.makedirs(d, exist_ok=True)
            dest = os.path.join(d, os.path.basename(a["path"]))
            url = f"{base}/storage/v1/object/public/football-adjuntos/{urllib.parse.quote(a['path'])}"
            with urllib.request.urlopen(url, timeout=60) as r, open(dest, "wb") as f:
                f.write(r.read())
            print(f"      📎 {a.get('name') or ''} ({a.get('mime') or '?'}) → {dest}")


if __name__ == "__main__":
    main()
