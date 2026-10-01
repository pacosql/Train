"""Carga en mates10_colegio los centros de una comunidad autónoma que imparten
Educación Primaria, ESO o Bachillerato, desde el Registro Estatal de Centros
Docentes no Universitarios (RCD) del Ministerio de Educación.

    python3 mates10/tools/cargar_colegios.py ES-MC [--sin-detalle] [--seco]

Proceso (ver mates10/01-contenido/colegios/README.md):
  1. Por cada nivel (121 Primaria, 131 ESO, 133 Bachillerato) hace la búsqueda
     del RCD para la comunidad (https://www.educacion.gob.es/centros/buscarCentros)
     y descarga la página HTML de resultados y la exportación Excel oficial.
  2. Descarga la ficha (detalleCentro) de cada centro para obtener el
     municipio (el listado solo da la localidad) y el campo "Concertado".
  3. Archiva todo con archivar() como fuente 'RCD-<ES-XX>-<fecha>'.
  4. Upsert en mates10_colegio on conflict (sistema_id, codigo_oficial).

--sin-detalle: no descarga fichas; municipio = localidad del listado y el tipo
sale de la columna NATURALEZA del Excel. --seco: no escribe en la BD.
"""
import datetime
import io
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor

import requests
from bs4 import BeautifulSoup

sys.path.insert(0, os.path.dirname(__file__))
from db import q, lit, arr  # noqa: E402
import archivar as A  # noqa: E402

BASE = "https://www.educacion.gob.es/centros/"
# Código ISO de la comunidad → idComunidad del RCD (ver la portada del buscador).
RCD_COMUNIDAD = {
    "ES-AN": "01", "ES-AR": "02", "ES-AS": "03", "ES-IB": "04", "ES-CN": "05",
    "ES-CB": "06", "ES-CL": "07", "ES-CM": "08", "ES-CT": "09", "ES-EX": "10",
    "ES-GA": "11", "ES-RI": "12", "ES-MD": "13", "ES-MC": "14", "ES-NC": "15",
    "ES-VC": "16", "ES-PV": "17", "ES-CE": "18", "ES-ML": "19",
}
NIVELES = {"121": "primaria", "131": "eso", "133": "bachillerato"}
TIPO = {"Centro público": "publico", "Centro concertado": "concertado", "Centro privado": "privado"}


def sesion(idc):
    s = requests.Session()
    s.headers["User-Agent"] = A.UA
    s.get(BASE, timeout=60)
    s.post(BASE + "verBuscadorComunidad", data={"idComunidad": idc}, timeout=120)
    return s


def post(s, accion, data, intentos=4):
    for i in range(intentos):
        try:
            r = s.post(BASE + accion, data=data, timeout=300)
            r.raise_for_status()
            return r.content
        except requests.RequestException:
            if i == intentos - 1:
                raise
            time.sleep(2 ** (i + 1))


def filtro(idc, nivel):
    return {"idComunidad": idc, "idProvincia": "", "nivel": nivel, "naturaleza": "0",
            "concertado": "0", "familia": "0", "ensenanza": "0", "modalidad": "0",
            "tipoCentro": "0", "denominacion": "0", "loc": "0", "codCentro": "", "nombreCentro": ""}


def leer_xls(b):
    import xlrd  # pip install xlrd (el RCD exporta .xls BIFF)
    ws = xlrd.open_workbook(file_contents=b).sheet_by_index(0)
    cab = [str(c).strip() for c in ws.row_values(0)]
    filas = []
    for i in range(1, ws.nrows):
        d = dict(zip(cab, [str(c).strip() for c in ws.row_values(i)]))
        if len(d.get("CÓDIGO", "")) == 8 and d["CÓDIGO"].isdigit():
            filas.append(d)
    return filas


def leer_listado(html):
    soup = BeautifulSoup(html, "html.parser")
    out = {}
    for tr in soup.find_all("tr"):
        td = [t.get_text(" ", strip=True) for t in tr.find_all("td")]
        if len(td) >= 6 and len(td[4]) == 8 and td[4].isdigit():
            out[td[4]] = {"provincia": td[0], "localidad": td[1], "generica": td[2],
                          "especifica": td[3], "naturaleza": td[5]}
    return out


def municipio(m):
    """'Alcázares, Los' → 'Los Alcázares' (el RCD pospone el artículo)."""
    import re
    if not m:
        return m
    r = re.match(r"^(.+), (Los|Las|La|El|Els|Les|Lo|O|A|Os|As)$", m.strip())
    return f"{r.group(2)} {r.group(1)}" if r else m.strip()


def leer_detalle(html):
    soup = BeautifulSoup(html, "html.parser")
    campos = {}
    for b in soup.find_all("b"):
        k = b.get_text(" ", strip=True)
        sp = b.find_next_sibling("span")
        if k.endswith(":") and sp is not None:
            campos[k[:-1]] = sp.get_text(" ", strip=True)
    ens = []
    for tr in soup.find_all("tr"):
        td = [t.get_text(" ", strip=True) for t in tr.find_all("td")]
        if td:
            ens.append(" / ".join(x for x in td if x))
    return {"municipio": campos.get("Municipio"), "localidad": campos.get("Localidad"),
            "naturaleza": campos.get("Naturaleza"), "concertado": campos.get("Concertado"),
            "tipo_centro": campos.get("Tipo de centro"), "ensenanzas": ens}


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    sin_detalle = "--sin-detalle" in sys.argv
    seco = "--seco" in sys.argv
    sistema = args[0] if args else "ES-MC"
    idc = RCD_COMUNIDAD[sistema]
    hoy = datetime.date.today().isoformat()
    s = sesion(idc)

    listados, xls, centros = {}, {}, {}
    for nivel, clave in NIVELES.items():
        f = filtro(idc, nivel)
        listados[nivel] = post(s, "buscarCentros", f)
        xf = dict(f, provincial="", comarca="", pais="", localidad="", ensenanzaFP="")
        xf.pop("loc")
        xls[nivel] = post(s, "exportarListadoCentrosExcel", xf)
        lh = leer_listado(listados[nivel])
        lx = {d["CÓDIGO"]: d for d in leer_xls(xls[nivel])}
        print(f"{clave}: listado HTML {len(lh)}, Excel {len(lx)}", file=sys.stderr)
        if set(lh) != set(lx):
            print(f"  aviso: difieren HTML/Excel en {len(set(lh) ^ set(lx))} códigos", file=sys.stderr)
        for cod in set(lh) | set(lx):
            c = centros.setdefault(cod, {"codigo": cod, "ensenanzas": set()})
            c["ensenanzas"].add(clave)
            if cod in lx:
                d = lx[cod]
                c.update(nombre=f"{d['DENOMINACIÓN GENÉRICA']} {d['DENOMINACIÓN ESPECÍFICA']}".strip(),
                         especifica=d["DENOMINACIÓN ESPECÍFICA"], localidad=d["LOCALIDAD"],
                         provincia=d["PROVINCIA"], naturaleza=d["NATURALEZA"],
                         comunidad=d.get("COMUNIDAD AUTÓNOMA"))
            else:
                d = lh[cod]
                c.setdefault("nombre", f"{d['generica']} {d['especifica']}".strip())
                c.setdefault("especifica", d["especifica"])
                c.setdefault("localidad", d["localidad"])
                c.setdefault("provincia", d["provincia"])
                c.setdefault("naturaleza", d["naturaleza"])

    # El buscador cuela centros de ámbito estatal de otra comunidad (p. ej. el
    # CIDEAD de Madrid, 28xxxxxx, enseñanza a distancia): se descartan.
    from collections import Counter
    ca = Counter(c.get("comunidad") for c in centros.values()).most_common(1)[0][0]
    fuera = sorted(k for k, c in centros.items() if c.get("comunidad") not in (None, ca))
    if fuera:
        print(f"descartados por ser de otra comunidad: {fuera}", file=sys.stderr)
        for k in fuera:
            del centros[k]

    detalles = {}
    if not sin_detalle:
        def ficha(cod):
            return cod, post(s, "detalleCentro", {"codCentro": cod, "idComunidad": idc})
        with ThreadPoolExecutor(6) as ex:
            for cod, html in ex.map(ficha, sorted(centros)):
                detalles[cod] = leer_detalle(html)
        print(f"fichas: {len(detalles)}", file=sys.stderr)

    filas = []
    for cod, c in sorted(centros.items()):
        d = detalles.get(cod, {})
        tipo = TIPO.get(c.get("naturaleza"))
        if d.get("naturaleza") == "Centro público":
            tipo = "publico"
        elif d.get("naturaleza") == "Centro privado":
            tipo = "concertado" if (d.get("concertado") or "").lower().startswith("s") else "privado"
        if tipo is None:
            raise SystemExit(f"naturaleza desconocida en {cod}: {c.get('naturaleza')} / {d}")
        filas.append({"codigo_oficial": cod, "nombre": c["nombre"],
                      "municipio": municipio(d.get("municipio") or c.get("localidad")),
                      "localidad": d.get("localidad") or c.get("localidad"),
                      "tipo": tipo, "naturaleza_excel": c.get("naturaleza"),
                      "concertado_ficha": d.get("concertado"), "tipo_centro": d.get("tipo_centro"),
                      "ensenanzas": [e for e in NIVELES.values() if e in c["ensenanzas"]],
                      "ensenanzas_ficha": d.get("ensenanzas")})

    print("tipo:", dict(Counter(f["tipo"] for f in filas)), file=sys.stderr)
    print("enseñanzas:", dict(Counter(e for f in filas for e in f["ensenanzas"])), file=sys.stderr)
    dif = [f["codigo_oficial"] for f in filas if TIPO.get(f["naturaleza_excel"]) not in (None, f["tipo"])]
    if dif:
        print(f"aviso: tipo de la ficha ≠ NATURALEZA del Excel en {len(dif)}: {dif[:10]}", file=sys.stderr)

    # Archivo de la fuente: listado HTML (primaria) como original + resto de ficheros.
    codigo = f"RCD-{sistema}-{hoy}"
    url = f"{BASE}buscarCentros?idComunidad={idc}&nivel=121"
    fid = A.fuente_existente(codigo)
    if fid is None and not seco:
        fid = A.archivar(codigo=codigo, url=url, tipo="registro_oficial",
                         titulo=f"Registro Estatal de Centros Docentes no Universitarios (RCD) — {sistema}: "
                                f"centros con Primaria, ESO o Bachillerato ({hoy})",
                         origen="descarga_oficial", confianza="alta", modulos=["01"], sistema=sistema,
                         notas="Búsquedas del RCD por nivel 121/131/133 + exportación Excel + fichas detalleCentro. "
                               "Script: mates10/tools/cargar_colegios.py",
                         captura=False, data=listados["121"])
        rawdir = os.path.join(A.RAW, fid)
        extra = []
        for nivel, clave in NIVELES.items():
            if nivel != "121":
                extra.append((f"buscarCentros_{clave}.html", listados[nivel], "html"))
            extra.append((f"listado_centros_{clave}.xls", xls[nivel], "otro"))
        extra.append(("fichas_detalleCentro.json",
                      json.dumps(detalles, ensure_ascii=False, indent=1).encode(), "otro"))
        extra.append(("centros_normalizados.json",
                      json.dumps(filas, ensure_ascii=False, indent=1).encode(), "otro"))
        for i, (nombre, b, t) in enumerate(extra, start=3):
            p = os.path.join(rawdir, nombre)
            open(p, "wb").write(b)
            A._archivo(fid, p, t, nombre, orden=i)
    print(f"fuente {codigo}: {fid}", file=sys.stderr)

    if seco:
        print(json.dumps(filas, ensure_ascii=False, indent=1))
        return
    sis = f"(select id from mates10_sistema_educativo where codigo = {lit(sistema)})"
    for i in range(0, len(filas), 300):
        vals = ",\n".join(
            f"({sis}, {lit(f['codigo_oficial'])}, {lit(f['nombre'])}, {lit(f['municipio'])}, "
            f"{lit(f['tipo'])}, {arr(f['ensenanzas'])}, {lit(fid)})" for f in filas[i:i + 300])
        q(f"""insert into mates10_colegio (sistema_id, codigo_oficial, nombre, municipio, tipo, ensenanzas, fuente_id)
              values {vals}
              on conflict (sistema_id, codigo_oficial) do update set nombre = excluded.nombre,
                municipio = excluded.municipio, tipo = excluded.tipo, ensenanzas = excluded.ensenanzas,
                fuente_id = excluded.fuente_id""")
    print(f"upsert: {len(filas)} centros ({sistema})", file=sys.stderr)


if __name__ == "__main__":
    main()
