"""Carga la taxonomía (mates10/01-contenido/taxonomia/T*.json) en la BD.

Valida códigos, prerrequisitos (existencia y ausencia de ciclos) y fuentes; hace upsert de
habilidad, error_tipico, habilidad_prerrequisito y habilidad_fuente. Los errores típicos y
prerrequisitos sin fuente propia apuntan a la fuente de criterio del grupo (D-010).

    python3 mates10/tools/cargar_taxonomia.py            # valida y carga todo
    python3 mates10/tools/cargar_taxonomia.py --validar  # solo valida
"""
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
from db import q, lit  # noqa: E402
from archivar import archivar  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TAX = os.path.join(ROOT, "01-contenido", "taxonomia")
CODIGO = re.compile(r"^[A-Z]+\.[A-Z0-9_]+\.\d{2}$")
CURSOS = ["PRI1", "PRI2", "PRI3", "PRI4", "PRI5", "PRI6", "ESO1", "ESO2", "ESO3", "ESO4", "BAC1", "BAC2"]


def leer():
    habs = {}
    for f in sorted(glob.glob(os.path.join(TAX, "T*.json"))):
        d = json.load(open(f, encoding="utf-8"))
        g = d.get("grupo") or os.path.basename(f)[:-5]
        for h in d["habilidades"]:
            h["_grupo"] = g
            if h["codigo"] in habs:
                print(f"DUPLICADO {h['codigo']} en {g} y {habs[h['codigo']]['_grupo']}")
            habs[h["codigo"]] = h
    # nivel_familia = orden de enseñanza dentro de la familia (curso, trimestre, orden), no el número del código:
    # algunos códigos los fija el anexo y no siguen ese orden (D-031).
    fams = {}
    for h in habs.values():
        fams.setdefault(h.get("familia") or ".".join(h["codigo"].split(".")[:2]), []).append(h)
    for hs in fams.values():
        hs.sort(key=lambda h: (CURSOS.index(h["curso_ref"]) if h.get("curso_ref") in CURSOS else 99,
                               int(h.get("trimestre_ref") or 1), float(h.get("orden_ref") or 0), h["codigo"]))
        for i, h in enumerate(hs, 1):
            h["nivel_familia"] = i
    return habs


def validar(habs, fuentes):
    probs = []
    for c, h in habs.items():
        if not CODIGO.match(c):
            probs.append(f"{c}: código mal formado")
        if c.split(".")[0] != h.get("bloque", c.split(".")[0]):
            probs.append(f"{c}: bloque {h.get('bloque')} no coincide con el prefijo")
        if h.get("curso_ref") not in CURSOS:
            probs.append(f"{c}: curso_ref {h.get('curso_ref')}")
        for k in ("nombre", "nombre_padres", "definicion"):
            if not h.get(k):
                probs.append(f"{c}: falta {k}")
        if h.get("fuente") not in fuentes:
            probs.append(f"{c}: fuente desconocida {h.get('fuente')}")
        for fx in h.get("fuentes_extra", []):
            if fx.get("fuente") not in fuentes:
                probs.append(f"{c}: fuente extra desconocida {fx.get('fuente')}")
            if fx.get("rol") == "contradice" and not fx.get("nota"):
                probs.append(f"{c}: 'contradice' sin nota")
        for p in h.get("prerrequisitos", []):
            if p["codigo"] not in habs:
                probs.append(f"{c}: prerrequisito inexistente {p['codigo']}")
        if not (1 <= int(h.get("importancia", 0)) <= 5) or not (1 <= int(h.get("carga_alumno", 0)) <= 5):
            probs.append(f"{c}: importancia/carga fuera de rango")
    # ciclos
    grafo = {c: [p["codigo"] for p in h.get("prerrequisitos", []) if p["codigo"] in habs] for c, h in habs.items()}
    color = {}

    def dfs(u, pila):
        color[u] = 1
        for v in grafo[u]:
            if color.get(v) == 1:
                probs.append("CICLO: " + " → ".join(pila + [u, v]))
            elif not color.get(v):
                dfs(v, pila + [u])
        color[u] = 2
    for c in grafo:
        if not color.get(c):
            dfs(c, [])
    return probs


def fuente_criterio(grupo):
    texto = ("Criterio del modelo (Claude, agente de taxonomía de Mates10) para errores típicos, prerrequisitos, "
             "importancia, carga y secuencia de referencia del grupo " + grupo + ".\n\n"
             "Instrucciones con las que se generó:\n\n" +
             open(os.path.join(TAX, "INSTRUCCIONES_AGENTE.md"), encoding="utf-8").read() + "\n\nFamilias:\n\n" +
             open(os.path.join(TAX, "familias.md"), encoding="utf-8").read())
    return archivar(codigo=f"CRIT-TAX-{grupo}", url=f"criterio-taxonomia-{grupo}.md", tipo="criterio_modelo",
                    titulo=f"Criterio del modelo: taxonomía, grupo {grupo}", origen="generado_modelo",
                    confianza="baja", modulos=["01"], data=texto.encode("utf-8"), captura=False,
                    notas="Criterio experto del modelo, pendiente de revisión humana (D-010).")


def cargar(habs, fuentes):
    bloques = {r["codigo"]: r["id"] for r in q("select codigo, id from mates10_bloque")}
    crit = {}
    for g in sorted({h["_grupo"] for h in habs.values()}):
        crit[g] = fuente_criterio(g)
    items = list(habs.values())
    for i in range(0, len(items), 60):
        vals = []
        for h in items[i:i + 60]:
            vals.append("(" + ",".join([
                lit(h["codigo"]), lit(bloques[h["codigo"].split(".")[0]]), lit(h["nombre"]), lit(h["nombre_padres"]),
                lit(h["definicion"]), lit(h.get("parametros") or {}), lit(h.get("ejemplo_frontera")),
                lit(h.get("ejemplo_fuera")), lit(int(h["importancia"])), lit(int(h["carga_alumno"])),
                lit(h.get("familia") or ".".join(h["codigo"].split(".")[:2])), lit(int(h.get("nivel_familia") or h["codigo"][-2:])),
                lit(h["curso_ref"]), lit(None if h.get("calculable") is False else "codigo"),
                lit(fuentes[h["fuente"]]), lit(h.get("fuente_ref"))]) + ")")
        q(f"""insert into mates10_habilidad (codigo,bloque_id,nombre,nombre_padres,definicion,parametros,ejemplo_frontera,
              ejemplo_fuera,importancia,carga_alumno,familia,nivel_familia,curso_ref,generador,fuente_id,fuente_ref)
              values {",".join(vals)}
              on conflict (codigo) do update set bloque_id=excluded.bloque_id, nombre=excluded.nombre,
              nombre_padres=excluded.nombre_padres, definicion=excluded.definicion, parametros=excluded.parametros,
              ejemplo_frontera=excluded.ejemplo_frontera, ejemplo_fuera=excluded.ejemplo_fuera,
              importancia=excluded.importancia, carga_alumno=excluded.carga_alumno, familia=excluded.familia,
              nivel_familia=excluded.nivel_familia, curso_ref=excluded.curso_ref, fuente_id=excluded.fuente_id,
              fuente_ref=excluded.fuente_ref""")
    ids = {r["codigo"]: r["id"] for r in q("select codigo, id from mates10_habilidad")}

    # errores típicos
    for i in range(0, len(items), 40):
        vals = []
        for h in items[i:i + 40]:
            for e in h.get("errores", []):
                f = fuentes.get(e.get("fuente")) or crit[h["_grupo"]]
                vals.append("(" + ",".join([lit(ids[h["codigo"]]), lit(f"{h['codigo']}.{e['sufijo']}"), lit(e["nombre"]),
                            lit(e["descripcion"]), lit(e["explicacion_nino"]), lit(e["indicacion_padres"]),
                            lit(e.get("regla")), lit(f), lit(e.get("fuente_ref"))]) + ")")
        if vals:
            q(f"""insert into mates10_error_tipico (habilidad_id,codigo,nombre,descripcion,explicacion_nino,indicacion_padres,
                  funcion,fuente_id,fuente_ref) values {",".join(vals)}
                  on conflict (codigo) do update set nombre=excluded.nombre, descripcion=excluded.descripcion,
                  explicacion_nino=excluded.explicacion_nino, indicacion_padres=excluded.indicacion_padres,
                  funcion=coalesce(mates10_error_tipico.funcion, excluded.funcion), fuente_id=excluded.fuente_id""")

    # prerrequisitos (se reescriben) y fuentes de la habilidad
    codigos = ",".join(lit(ids[c]) for c in habs)
    q(f"delete from mates10_habilidad_prerrequisito where habilidad_id in ({codigos})")
    q(f"delete from mates10_habilidad_fuente where habilidad_id in ({codigos})")
    pre, hf = [], []
    for h in items:
        for p in h.get("prerrequisitos", []):
            if p["codigo"] in ids and p["codigo"] != h["codigo"]:
                pre.append(f"({lit(ids[h['codigo']])},{lit(ids[p['codigo']])},{lit(p.get('peso', 'recomendable'))},{lit(crit[h['_grupo']])})")
        hf.append(f"({lit(ids[h['codigo']])},{lit(fuentes[h['fuente']])},{lit(h.get('fuente_ref'))},'define',null)")
        for fx in h.get("fuentes_extra", []):
            hf.append(f"({lit(ids[h['codigo']])},{lit(fuentes[fx['fuente']])},{lit(fx.get('ref'))},{lit(fx['rol'])},{lit(fx.get('nota'))})")
    for i in range(0, len(pre), 400):
        q("insert into mates10_habilidad_prerrequisito (habilidad_id,prerrequisito_id,peso,fuente_id) values "
          + ",".join(pre[i:i + 400]) + " on conflict do nothing")
    for i in range(0, len(hf), 400):
        q("insert into mates10_habilidad_fuente (habilidad_id,fuente_id,fuente_ref,rol,nota) values "
          + ",".join(hf[i:i + 400]) + " on conflict do nothing")
    print(q("""select (select count(*) from mates10_habilidad) habilidades, (select count(*) from mates10_error_tipico) errores,
               (select count(*) from mates10_habilidad_prerrequisito) prerrequisitos,
               (select count(*) from mates10_habilidad_fuente) habilidad_fuente"""))


if __name__ == "__main__":
    habs = leer()
    fuentes = {r["codigo"]: r["id"] for r in q("select codigo, id from mates10_fuente where codigo is not null")}
    fuentes.update({"MATES10-DOC-UNIFICADO-1.1": fuentes.get("MATES10-DOC-UNIFICADO-1.1")})
    probs = validar(habs, fuentes)
    print(f"{len(habs)} habilidades, {len(probs)} problemas")
    for p in probs[:200]:
        print("  ", p)
    if "--validar" not in sys.argv:
        bad = {p.split(":")[0] for p in probs if "fuente desconocida" in p or "falta" in p or "curso_ref" in p}
        if bad:
            print("Se omiten por problemas graves:", sorted(bad))
            for b in bad:
                habs.pop(b, None)
            # quita prerrequisitos a omitidas
            for h in habs.values():
                h["prerrequisitos"] = [p for p in h.get("prerrequisitos", []) if p["codigo"] in habs]
        cargar(habs, fuentes)
