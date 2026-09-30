"""Construye mates10_mapa_curricular para los 19 sistemas a partir de la taxonomía y los decretos.

Capa sistema (una fila 'introduce' por habilidad y sistema):
  - curso: curso_ref de la taxonomía (referencia: decreto de Murcia; estatal por ciclo donde no reparte),
    salvo ajuste propio de la comunidad en 01-contenido/mapa/ajustes_<ES-XX>.json.
  - trimestre / mes / orden: secuencia de referencia de la taxonomía (trimestre_ref, orden_ref), fundida entre
    grupos por posición relativa. Es criterio (se afina con editoriales, colegios y fotos): lo dice `nota`.
  - fuente: el decreto (u orden) de esa comunidad y etapa; fuente_ref: el reparto que hace ese decreto.
  - confianza: alta si el decreto de la comunidad reparte por curso y es el de referencia (Murcia ESO/BAC)
    o un ajuste explícito; media en el resto (curso deducido dentro del ciclo/etapa del decreto).
Capa editorial: 01-contenido/mapa/editorial_<EDITORIAL>.json (si existe) → filas con `editorial`.

    python3 mates10/tools/cargar_mapa.py
"""
import glob
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from db import q, lit  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
TAX = os.path.join(ROOT, "01-contenido", "taxonomia")
DEC = os.path.join(ROOT, "01-contenido", "decretos")
MAPA = os.path.join(ROOT, "01-contenido", "mapa")
ETAPA = {"PRI": "PRI", "ESO": "ESO", "BAC": "BAC"}
# Mes dentro de cada trimestre según la posición relativa (septiembre pesa menos: inicio de curso y repaso).
MESES = {1: [(0.15, 9), (0.45, 10), (0.75, 11), (1.01, 12)], 2: [(0.34, 1), (0.67, 2), (1.01, 3)], 3: [(0.34, 4), (0.67, 5), (1.01, 6)]}


def secuencia():
    """Devuelve {codigo: (curso_ref, trimestre, orden_global, mes)}."""
    habs = []
    for f in glob.glob(os.path.join(TAX, "T*.json")):
        for h in json.load(open(f, encoding="utf-8"))["habilidades"]:
            habs.append((h["codigo"], h["curso_ref"], int(h.get("trimestre_ref") or 1), float(h.get("orden_ref") or 0), os.path.basename(f)[:2]))
    out = {}
    por_curso = {}
    for h in habs:
        por_curso.setdefault(h[1], []).append(h)
    for curso, hs in por_curso.items():
        # posición relativa dentro de (grupo, curso): funde las secuencias de los seis grupos
        rel = {}
        for g in {h[4] for h in hs}:
            del_g = sorted([h for h in hs if h[4] == g], key=lambda h: (h[2], h[3]))
            for i, h in enumerate(del_g):
                rel[h[0]] = (i + 0.5) / len(del_g)
        orden = sorted(hs, key=lambda h: (h[2], rel[h[0]], h[4]))
        for trim in (1, 2, 3):
            del_t = [h for h in orden if h[2] == trim]
            for i, h in enumerate(del_t):
                pos = (i + 0.5) / max(1, len(del_t))
                mes = next(m for lim, m in MESES[trim] if pos < lim)
                out[h[0]] = (curso, trim, orden.index(h) + 1, mes)
    return out


def fuente_decreto(sistema, etapa):
    p = os.path.join(DEC, f"{sistema}-{etapa}.json")
    if not os.path.exists(p):
        return None, None, None
    d = json.load(open(p, encoding="utf-8"))
    return d.get("fuente_codigo"), d.get("reparto"), d.get("nota_reparto")


def main():
    seq = secuencia()
    F = {r["codigo"]: r["id"] for r in q("select codigo, id from mates10_fuente where codigo is not null")}
    habs = {r["codigo"]: r["id"] for r in q("select codigo, id from mates10_habilidad where activo")}
    sistemas = q("select id, codigo from mates10_sistema_educativo order by codigo")
    cursos = {(r["sistema_id"], r["codigo"]): r["id"] for r in q("select id, sistema_id, codigo from mates10_curso")}
    q("delete from mates10_mapa_curricular where colegio_id is null and editorial is null")
    total = 0
    for s in sistemas:
        ajustes = {}
        pa = os.path.join(MAPA, f"ajustes_{s['codigo']}.json")
        if os.path.exists(pa):
            for a in json.load(open(pa, encoding="utf-8")):
                ajustes[a["habilidad"]] = a
        filas = []
        for cod, (curso, trim, orden, mes) in seq.items():
            if cod not in habs:
                continue
            aj = ajustes.get(cod)
            if aj and aj.get("excluir"):
                continue
            c = aj["curso"] if aj and aj.get("curso") else curso
            etapa = c[:3]
            fcod, reparto, nota_rep = fuente_decreto(s["codigo"], etapa)
            if not fcod or fcod not in F:
                fcod, reparto = f"DEC-ES-{etapa}", "estatal"
            conf = "alta" if aj else ("alta" if s["codigo"] == "ES-MC" and reparto == "curso" else "media")
            nota = ("Curso: " + (aj.get("nota") if aj else
                    f"referencia de la taxonomía ({curso}); el decreto de esta comunidad reparte por {reparto or 'etapa'}.")
                    + " Trimestre, mes y orden: secuencia didáctica de referencia (criterio), pendiente de afinar con editorial, colegio o foto.")
            t, m = (trim, mes) if not aj or not aj.get("trimestre") else (aj["trimestre"], aj.get("mes"))
            filas.append("(" + ",".join([lit(s["id"]), lit(cursos[(s["id"], c)]), str(t), lit(m), str(orden), lit(habs[cod]), "'introduce'",
                                         lit(conf), lit(F[fcod]), lit((aj or {}).get("fuente_ref") or (nota_rep or "")[:300] or None), lit(nota)]) + ")")
        for i in range(0, len(filas), 500):
            q("insert into mates10_mapa_curricular (sistema_id, curso_id, trimestre, mes, orden, habilidad_id, estado, confianza, fuente_id, fuente_ref, nota) values "
              + ",".join(filas[i:i + 500]))
        # Contradicciones: el decreto de la comunidad sitúa la habilidad en otro curso (módulo 07, rol 'contradice').
        contra = []
        for cod, a in ajustes.items():
            if cod in habs and a.get("curso") and a["curso"] != seq.get(cod, (None,))[0]:
                fcod, _, _ = fuente_decreto(s["codigo"], a["curso"][:3])
                if fcod in F:
                    nota = (f"{s['codigo']}: el decreto la sitúa en {a['curso']}; la referencia (Murcia) en {seq[cod][0]}. "
                            f"Decisión: en el mapa de esta comunidad manda su decreto. {a.get('nota') or ''}")
                    contra.append(f"({lit(habs[cod])},{lit(F[fcod])},{lit(a.get('fuente_ref'))},'contradice',{lit(nota)})")
        if contra:
            q("insert into mates10_habilidad_fuente (habilidad_id, fuente_id, fuente_ref, rol, nota) values " + ",".join(contra)
              + " on conflict (habilidad_id, fuente_id, rol) do update set nota = excluded.nota")
        total += len(filas)
        print(s["codigo"], len(filas), f"({len(ajustes)} ajustes)")
    print("total filas de sistema:", total)
    # capa editorial
    for f in glob.glob(os.path.join(MAPA, "editorial_*.json")):
        d = json.load(open(f, encoding="utf-8"))
        ed = d["editorial"]
        q(f"delete from mates10_mapa_curricular where editorial = {lit(ed)} and colegio_id is null")
        n = 0
        for s in sistemas:
            filas = []
            for r in d["filas"]:
                if r["habilidad"] not in habs or r.get("fuente") not in F:
                    continue
                filas.append("(" + ",".join([lit(s["id"]), lit(ed), lit(cursos[(s["id"], r["curso"])]), str(r["trimestre"]), lit(r.get("mes")), str(r["orden"]),
                                             lit(habs[r["habilidad"]]), lit(r.get("estado", "introduce")), lit(r.get("confianza", "media")), lit(F[r["fuente"]]),
                                             lit(r.get("fuente_ref")), lit(r.get("nota"))]) + ")")
            for i in range(0, len(filas), 500):
                q("insert into mates10_mapa_curricular (sistema_id, editorial, curso_id, trimestre, mes, orden, habilidad_id, estado, confianza, fuente_id, fuente_ref, nota) values "
                  + ",".join(filas[i:i + 500]))
            n += len(filas)
        print("editorial", ed, n)


if __name__ == "__main__":
    main()
