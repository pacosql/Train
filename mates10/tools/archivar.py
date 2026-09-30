"""Archiva una fuente según el proceso del módulo 07.

Descargar → guardar original → (web: captura PDF) → extraer texto → hash →
fila en mates10_fuente y mates10_fuente_archivo. Solo entonces se puede usar.

Los ficheros viven en mates10/fuentes/raw/<fuente_id>/ y
mates10/fuentes/text/<fuente_id>/. Esa carpeta se excluye del despliegue de
GitHub Pages (ver .github/workflows/pages.yml): el archivo es interno.

Uso como librería:
    from archivar import archivar
    fid = archivar(codigo="BOE-RD-157-2022", url="https://www.boe.es/...pdf",
                   tipo="decreto", titulo="...", origen="descarga_oficial",
                   confianza="alta", modulos=["01"], sistema="ES")
Uso por línea de órdenes:
    python3 mates10/tools/archivar.py CODIGO URL tipo "titulo" [confianza]
Si la fuente (por código) ya existe, devuelve su id sin volver a descargar.
"""
import hashlib
import json
import mimetypes
import os
import re
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))
from db import q, lit, arr  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RAW = os.path.join(ROOT, "fuentes", "raw")
TEXT = os.path.join(ROOT, "fuentes", "text")
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"
MAX_BYTES = 25 * 1024 * 1024


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def descargar(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read(MAX_BYTES + 1)
        ctype = r.headers.get("Content-Type", "")
    if len(data) > MAX_BYTES:
        raise RuntimeError(f"fichero de más de {MAX_BYTES} bytes: {url}")
    return data, ctype


def es_pdf(data, ctype):
    return data[:5] == b"%PDF-" or "pdf" in ctype


def texto_pdf(path):
    try:
        out = subprocess.run(["pdftotext", "-layout", path, "-"], capture_output=True, timeout=300)
        if out.returncode == 0 and out.stdout.strip():
            return out.stdout.decode("utf-8", errors="replace")
    except FileNotFoundError:
        pass
    from pdfminer.high_level import extract_text
    return extract_text(path)


def texto_html(data):
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(data, "html.parser")
    for t in soup(["script", "style", "noscript", "svg"]):
        t.decompose()
    txt = soup.get_text("\n")
    return re.sub(r"\n\s*\n+", "\n\n", txt).strip()


def captura_pdf(url, dest):
    """Guarda la página web renderizada como PDF (la 'captura' del módulo 07)."""
    try:
        subprocess.run([CHROME, "--headless=new", "--no-sandbox", "--disable-gpu",
                        f"--user-agent={UA}", "--virtual-time-budget=8000",
                        f"--print-to-pdf={dest}", "--no-pdf-header-footer", url],
                       capture_output=True, timeout=120)
        return os.path.exists(dest) and os.path.getsize(dest) > 0
    except Exception:
        return False


def _archivo(fid, path, tipo, pagina=None, derivado=None, orden=0):
    b = open(path, "rb").read()
    ruta = os.path.relpath(path, os.path.dirname(ROOT))
    r = q(f"""insert into mates10_fuente_archivo (fuente_id, ruta, tipo_archivo, pagina_o_seccion,
              hash_sha256, tamano_bytes, derivado_de, orden)
              values ({lit(fid)}, {lit(ruta)}, {lit(tipo)}, {lit(pagina)}, {lit(sha256(b))},
              {len(b)}, {lit(derivado)}, {orden}) returning id""")
    return r[0]["id"]


def fuente_existente(codigo):
    r = q(f"select id from mates10_fuente where codigo = {lit(codigo)}")
    return r[0]["id"] if r else None


def crear_fuente(codigo, tipo, titulo, origen, confianza, capturado_por="agente Claude Code (Mates10)",
                 url=None, editorial=None, isbn=None, anio=None, sistema=None, curso=None,
                 modulos=(), notas=None):
    sis = f"(select id from mates10_sistema_educativo where codigo = {lit(sistema)})" if sistema else "null"
    cur = "null"
    if curso and sistema:
        cur = (f"(select c.id from mates10_curso c join mates10_sistema_educativo s on s.id=c.sistema_id "
               f"where s.codigo={lit(sistema)} and c.codigo={lit(curso)})")
    r = q(f"""insert into mates10_fuente (codigo, tipo, titulo, editorial, isbn, anio, origen, url_original,
              capturado_por, confianza, modulos, notas, sistema_id, curso_id)
              values ({lit(codigo)}, {lit(tipo)}, {lit(titulo)}, {lit(editorial)}, {lit(isbn)}, {lit(anio)},
              {lit(origen)}, {lit(url)}, {lit(capturado_por)}, {lit(confianza)}, {arr(list(modulos))},
              {lit(notas)}, {sis}, {cur})
              on conflict (codigo) do update set titulo = excluded.titulo returning id""")
    return r[0]["id"]


def archivar(codigo, url, tipo, titulo, origen="busqueda_web", confianza="alta", modulos=("01",),
             editorial=None, isbn=None, anio=None, sistema=None, curso=None, notas=None,
             pagina=None, captura=True, data=None):
    fid = fuente_existente(codigo)
    if fid:
        return fid
    faltas = []
    if data is None:
        data, ctype = descargar(url)
    else:
        ctype = mimetypes.guess_type(url or "")[0] or ""
    fid = crear_fuente(codigo, tipo, titulo, origen, confianza, url=url, editorial=editorial, isbn=isbn,
                       anio=anio, sistema=sistema, curso=curso, modulos=modulos, notas=notas)
    rawdir = os.path.join(RAW, fid)
    txtdir = os.path.join(TEXT, fid)
    os.makedirs(rawdir, exist_ok=True)
    os.makedirs(txtdir, exist_ok=True)
    nombre = os.path.basename(urllib.parse.urlparse(url or "").path) or "original"
    nombre = re.sub(r"[^A-Za-z0-9._-]", "_", urllib.parse.unquote(nombre))[:120]
    if (url or "").endswith((".md", ".txt")):
        p = os.path.join(rawdir, nombre)
        open(p, "wb").write(data)
        orig = _archivo(fid, p, "otro", pagina)
        txt = data.decode("utf-8", errors="replace")
    elif es_pdf(data, ctype):
        if not nombre.lower().endswith(".pdf"):
            nombre += ".pdf"
        p = os.path.join(rawdir, nombre)
        open(p, "wb").write(data)
        orig = _archivo(fid, p, "pdf", pagina)
        txt = texto_pdf(p)
    else:
        if not re.search(r"\.(html?|php|aspx?)$", nombre, re.I):
            nombre += ".html"
        p = os.path.join(rawdir, nombre)
        open(p, "wb").write(data)
        orig = _archivo(fid, p, "html", pagina)
        if captura and url:
            cp = os.path.join(rawdir, "captura.pdf")
            if captura_pdf(url, cp):
                _archivo(fid, cp, "captura_pantalla", pagina, derivado=orig, orden=1)
            else:
                faltas.append("captura PDF")
        txt = texto_html(data)
    tp = os.path.join(txtdir, "texto.txt")
    open(tp, "w", encoding="utf-8").write(txt or "")
    if not (txt or "").strip():
        faltas.append("texto extraído vacío (¿PDF escaneado?)")
    _archivo(fid, tp, "texto_extraido", pagina, derivado=orig, orden=2)
    if faltas:
        q(f"""update mates10_fuente set notas = coalesce(notas || ' | ', '') || {lit('Faltó: ' + ', '.join(faltas))}
              {", confianza = 'baja'" if 'texto' in ' '.join(faltas) else ''} where id = {lit(fid)}""")
    return fid


def texto_de(fid):
    p = os.path.join(TEXT, fid, "texto.txt")
    return open(p, encoding="utf-8").read() if os.path.exists(p) else ""


if __name__ == "__main__":
    codigo, url, tipo, titulo = sys.argv[1:5]
    conf = sys.argv[5] if len(sys.argv) > 5 else "alta"
    print(archivar(codigo, url, tipo, titulo, confianza=conf))
