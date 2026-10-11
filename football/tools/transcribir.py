#!/usr/bin/env python3
"""Transcribe los comentarios de voz de 🔧 Revisar que siguen sin texto.

En el móvil, el navegador intenta transcribir mientras grabas, pero no
siempre puede. El audio se guarda igual (bucket `football-audios`) y este
script lo transcribe después con Whisper (faster-whisper, en local, sin
servicios de pago) y escribe el texto en `football_ratings.transcripcion`.
Es lo que necesita el agente que mejora los ejercicios: lee texto, no oye.

Uso (desde la raíz del repo):
    python3 football/tools/transcribir.py            # pendientes
    python3 football/tools/transcribir.py --todos    # también los ya hechos

La primera vez instala faster-whisper en un entorno propio
(~/.cache/football-stt) y baja el modelo «small» (~500 MB).
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VENV = os.path.expanduser("~/.cache/football-stt")
VPY = os.path.join(VENV, "bin", "python")
BUCKET = "football-audios"


def ensure_venv():
    """Se relanza dentro de un entorno con faster-whisper instalado."""
    if sys.prefix == VENV:
        return
    if not os.path.exists(VPY):
        print("Instalando faster-whisper (solo la primera vez)…", flush=True)
        subprocess.check_call([sys.executable, "-m", "venv", VENV])
        subprocess.check_call([VPY, "-m", "pip", "install", "-q", "faster-whisper"])
    os.execv(VPY, [VPY, os.path.abspath(__file__), *sys.argv[1:]])


def config():
    src = open(os.path.join(ROOT, "config.js"), encoding="utf-8").read()
    url = re.search(r'url:\s*"([^"]+)"', src).group(1)
    key = re.search(r'anonKey:\s*"([^"]+)"', src).group(1)
    return url.rstrip("/"), key


def api(method, url, key, body=None):
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None)
    req.add_header("apikey", key)
    req.add_header("Authorization", "Bearer " + key)
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    with urllib.request.urlopen(req, timeout=60) as r:
        data = r.read()
        return json.loads(data) if data else None


def main():
    ensure_venv()
    from faster_whisper import WhisperModel

    base, key = config()
    todos = "--todos" in sys.argv
    filtro = "audio_path=not.is.null" + ("" if todos else "&transcripcion=is.null")
    rows = api("GET", f"{base}/rest/v1/football_ratings?select=game,audio_path,note&{filtro}", key)
    if not rows:
        print("No hay audios pendientes de transcribir.")
        return
    print(f"{len(rows)} audio(s) por transcribir.", flush=True)
    model = WhisperModel("small", device="cpu", compute_type="int8", download_root=os.path.join(VENV, "models"))
    hechos = 0
    for row in rows:
        game, path = row["game"], row["audio_path"]
        audio_url = f"{base}/storage/v1/object/public/{BUCKET}/{path}"
        with tempfile.NamedTemporaryFile(suffix=os.path.splitext(path)[1]) as tmp:
            try:
                with urllib.request.urlopen(audio_url, timeout=60) as r:
                    tmp.write(r.read())
                tmp.flush()
                segs, _ = model.transcribe(tmp.name, language="es", vad_filter=True)
                texto = " ".join(s.text.strip() for s in segs).strip()
            except Exception as e:  # un audio roto no para los demás
                print(f"  ✗ {game}: {e}")
                continue
        # Solo se escribe si el audio sigue siendo el mismo (si Paco lo ha
        # cambiado mientras tanto, la fila ya no casa y no se pisa nada).
        api(
            "PATCH",
            f"{base}/rest/v1/football_ratings?game=eq.{game}&audio_path=eq.{urllib.parse.quote(path)}",
            key,
            {"transcripcion": texto or "(audio sin voz)", "transcrito_at": datetime.now(timezone.utc).isoformat()},
        )
        hechos += 1
        print(f"  ✓ {game}: {texto or '(sin voz)'}", flush=True)
    print(f"Hecho: {hechos} de {len(rows)}.")


if __name__ == "__main__":
    main()
