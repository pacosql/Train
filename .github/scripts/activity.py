#!/usr/bin/env python3
"""Actividad de cada app para ordenar la portada (se ejecuta en el deploy).

1. Escribe activity.json en la raíz con la fecha del último commit que tocó
   cada carpeta de app enlazada desde index.html.
2. Inyecta en cada página .html de esas carpetas una línea que apunta en
   localStorage (clave train_activity, compartida por todo el origen
   github.io) cuándo se abrió la app. Así la portada sabe qué has usado
   aunque entres desde el icono del móvil y no desde la portada.

No se commitea nada: solo cambia la copia que se publica.
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
index = (ROOT / "index.html").read_text(encoding="utf-8")
apps = []
for m in re.finditer(r'<a class="app-card" href="([a-z0-9_-]+)/"', index):
    if m.group(1) not in apps and (ROOT / m.group(1)).is_dir():
        apps.append(m.group(1))

changes = {}
for app in apps:
    out = subprocess.run(
        ["git", "log", "-1", "--format=%cI", "--", f"{app}/"],
        cwd=ROOT, capture_output=True, text=True, check=False,
    ).stdout.strip()
    if out:
        changes[app] = out
(ROOT / "activity.json").write_text(
    json.dumps({"changes": changes}, ensure_ascii=False, indent=1), encoding="utf-8")

SNIPPET = ('<script>try{var k="train_activity",a=JSON.parse(localStorage.getItem(k)||"{}");'
           'a["{app}"]=Date.now();localStorage.setItem(k,JSON.stringify(a))}catch(e){}</script>')
head = re.compile(r"(<head[^>]*>)", re.IGNORECASE)
stamped = 0
for app in apps:
    for page in (ROOT / app).rglob("*.html"):
        text = page.read_text(encoding="utf-8", errors="ignore")
        if 'train_activity' in text or not head.search(text):
            continue
        page.write_text(head.sub(lambda m: m.group(1) + SNIPPET.replace("{app}", app), text, count=1),
                        encoding="utf-8")
        stamped += 1
print(f"activity.json: {len(changes)} apps; páginas marcadas: {stamped}")
