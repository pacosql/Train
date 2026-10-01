"""Carga la base de conocimiento de los módulos 04 y 06 desde los JSON minados:
  04-didactica/metodos.json   → mates10_metodo (+ habilidad_metodo por familia: se aplica al cargar la taxonomía)
  04-didactica/tecnicas.json  → mates10_tecnica_practica (+ habilidad_tecnica por familia)
  06-enganche/mecanismos.json → mates10_mecanismo_enganche

    python3 mates10/tools/cargar_didactica.py [metodos|tecnicas|mecanismos|asignaciones]...
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from db import q, lit  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def fuentes():
    return {r["codigo"]: r["id"] for r in q("select codigo, id from mates10_fuente where codigo is not null")}


def fuente_de(item, F, defecto="MATES10-DOC-UNIFICADO-1.1"):
    return F.get(item.get("fuente_codigo")) or item.get("fuente_id") or F[defecto]


def mecanismos():
    F = fuentes()
    d = json.load(open(os.path.join(ROOT, "06-enganche", "mecanismos.json"), encoding="utf-8"))
    vals = []
    for m in d["mecanismos"]:
        par = m.get("parametros") or {}
        if m.get("metricas"):
            par = {**par, "_metricas": m["metricas"]}
        if m.get("fuentes_adicionales"):
            par = {**par, "_fuentes_adicionales": m["fuentes_adicionales"]}
        vals.append("(" + ",".join([lit(m["codigo"]), lit(m["nombre"]), lit(m["descripcion"]), lit(m.get("origen") or ""), lit(fuente_de(m, F)),
                    lit(m["evidencia"]), lit(m["riesgo_menores"]), lit(m.get("uso_en_mates10")), lit(par), lit(m.get("edad_desde")),
                    lit(m.get("edad_hasta")), lit(m["estado"])]) + ")")
    q(f"""insert into mates10_mecanismo_enganche (codigo,nombre,descripcion,origen,fuente_id,evidencia,riesgo_menores,uso_en_mates10,parametros,
          edad_desde,edad_hasta,estado) values {",".join(vals)}
          on conflict (codigo) do update set nombre=excluded.nombre, descripcion=excluded.descripcion, origen=excluded.origen,
          fuente_id=excluded.fuente_id, evidencia=excluded.evidencia, riesgo_menores=excluded.riesgo_menores,
          uso_en_mates10=excluded.uso_en_mates10, parametros=excluded.parametros, edad_desde=excluded.edad_desde,
          edad_hasta=excluded.edad_hasta, estado=excluded.estado""")
    print(q("select estado, riesgo_menores, count(*) from mates10_mecanismo_enganche group by 1,2 order by 1,2"))


def metodos():
    F = fuentes()
    d = json.load(open(os.path.join(ROOT, "04-didactica", "metodos.json"), encoding="utf-8"))
    vals = []
    for m in d["metodos"]:
        vals.append("(" + ",".join([lit(m["codigo"]), lit(m["nombre"]), lit(m["escuela"]), lit(m["representacion"]), lit(m["descripcion"]),
                    lit(m.get("cuando_usar")), lit(m.get("edad_desde")), lit(m.get("familia")), lit(fuente_de(m, F))]) + ")")
    for i in range(0, len(vals), 100):
        q(f"""insert into mates10_metodo (codigo,nombre,escuela,representacion,descripcion,cuando_usar,edad_desde,familia,fuente_id)
              values {",".join(vals[i:i + 100])} on conflict (codigo) do update set nombre=excluded.nombre, escuela=excluded.escuela,
              representacion=excluded.representacion, descripcion=excluded.descripcion, cuando_usar=excluded.cuando_usar,
              edad_desde=excluded.edad_desde, familia=excluded.familia, fuente_id=excluded.fuente_id""")
    print(q("select escuela, count(*) from mates10_metodo group by 1"))


def tecnicas():
    F = fuentes()
    d = json.load(open(os.path.join(ROOT, "04-didactica", "tecnicas.json"), encoding="utf-8"))
    vals = []
    for t in d["tecnicas"]:
        regla = t.get("regla") or {}
        if t.get("tipo"):
            regla = {**regla, "_tipo": t["tipo"]}
        vals.append("(" + ",".join([lit(t["codigo"]), lit(t["nombre"]), lit(t["descripcion"]), lit(t["disparador"]), lit(regla),
                    lit(t["ambito"]), lit(fuente_de(t, F))]) + ")")
    q(f"""insert into mates10_tecnica_practica (codigo,nombre,descripcion,disparador,regla,ambito,fuente_id) values {",".join(vals)}
          on conflict (codigo) do update set nombre=excluded.nombre, descripcion=excluded.descripcion, disparador=excluded.disparador,
          regla=excluded.regla, ambito=excluded.ambito, fuente_id=excluded.fuente_id""")
    print(q("select disparador, ambito, count(*) from mates10_tecnica_practica group by 1,2"))


def asignaciones():
    """habilidad_metodo y habilidad_tecnica por familia (módulos 04: 'se rellena por familia')."""
    dm = json.load(open(os.path.join(ROOT, "04-didactica", "metodos.json"), encoding="utf-8"))
    n = 0
    for a in dm.get("asignaciones", []):
        fam, cod, rol = a["familia"], a["metodo"], a["rol"]
        mec = f"(select id from mates10_mecanica where codigo = {lit(a.get('mecanica'))})" if a.get("mecanica") else "null"
        nota = a.get("nota") or ""
        if rol == "remedio" and a.get("remedio_de"):
            nota = f"Remedio de: {a['remedio_de']}. {nota}".strip()
        r = q(f"""insert into mates10_habilidad_metodo (habilidad_id, metodo_id, rol, orden_presentacion, mecanica_id, nota)
                  select h.id, m.id, {lit(rol)}, {int(a.get('orden_presentacion') or 1)}, {mec}, {lit(nota or None)}
                  from mates10_habilidad h, mates10_metodo m where h.familia = {lit(fam)} and m.codigo = {lit(cod)}
                  on conflict do nothing returning 1""")
        n += len(r or [])
    # Toda habilidad necesita un principal (módulo 04): si su familia no tiene, el genérico de su bloque.
    q("""insert into mates10_habilidad_metodo (habilidad_id, metodo_id, rol, orden_presentacion, nota)
         select h.id, (select id from mates10_metodo where codigo = 'GENERICO.PASOS'), 'principal', 1, 'Sin método documentado para la familia: explicación genérica por pasos (D-030).'
         from mates10_habilidad h
         where not exists (select 1 from mates10_habilidad_metodo hm join mates10_metodo m on m.id = hm.metodo_id
                           where hm.habilidad_id = h.id and hm.rol = 'principal' and m.escuela in ('generico','tradicional'))
           and exists (select 1 from mates10_metodo where codigo = 'GENERICO.PASOS')
         on conflict do nothing""")
    print("habilidad_metodo por familia:", n, q("select rol, count(*) from mates10_habilidad_metodo group by 1"))
    dt = json.load(open(os.path.join(ROOT, "04-didactica", "tecnicas.json"), encoding="utf-8"))
    n = 0
    for g in dt.get("asignacion_por_familia", []):
        for fam in g["familias"]:
            for t in g["tecnicas"]:
                r = q(f"""insert into mates10_habilidad_tecnica (habilidad_id, tecnica_id, prioridad, parametros, nota)
                          select h.id, t.id, {int(t.get('prioridad') or 3)}, {lit(t.get('parametros'))}, {lit(g.get('familia_patron'))}
                          from mates10_habilidad h, mates10_tecnica_practica t where h.familia = {lit(fam)} and t.codigo = {lit(t['codigo'])}
                          on conflict (habilidad_id, tecnica_id) do update set prioridad = excluded.prioridad returning 1""")
                n += len(r or [])
    print("habilidad_tecnica:", n)


if __name__ == "__main__":
    for paso in sys.argv[1:] or ["metodos", "tecnicas", "mecanismos"]:
        globals()[paso]()
