"""Carga lotes de ejercicios ya generados: valida en cascada, crea plantillas, inserta ejercicio,
ejercicio_habilidad, ejercicio_error y ejercicio_explicacion, y guarda los rechazos.

Cada ejercicio (dict):
  dificultad, enunciado, respuesta, distractores [(valor, clave_error|None)], parametros, datos,
  explicacion_nino, explicacion_adulto, pasos, explicaciones_extra {escuela: {...}}, secundarias [codigos],
  plantilla (clave), formato, expresion_calculo
La clave de error se traduce a error_tipico.id con `mapa_errores` (clave → código de error_tipico).
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from db import q, lit  # noqa: E402
from validador import validar, IndiceCopia  # noqa: E402

_indice = None


def indice():
    global _indice
    if _indice is None:
        _indice = IndiceCopia()
    return _indice


def ciclo_de(curso_ref):
    return {"PRI1": "ciclo1", "PRI2": "ciclo1", "PRI3": "ciclo2", "PRI4": "ciclo2", "PRI5": "ciclo3", "PRI6": "ciclo3"}.get(curso_ref, "secundaria")


def info_habilidad(codigo):
    h = q(f"""select h.id, h.codigo, h.parametros, h.curso_ref, h.familia,
              (select json_object_agg(e.codigo, e.id) from mates10_error_tipico e where e.habilidad_id = h.id) errores,
              (select json_object_agg(coalesce(hm.nota_escuela, 'principal'), hm.metodo_id) from (
                  select m.escuela as nota_escuela, hm.metodo_id from mates10_habilidad_metodo hm join mates10_metodo m on m.id = hm.metodo_id
                  where hm.habilidad_id = h.id and hm.rol = 'principal') hm) metodos
              from mates10_habilidad h where h.codigo = {lit(codigo)}""")
    return h[0] if h else None


def metodo_principal(hinfo):
    """Método principal por defecto: el principal genérico/tradicional de la habilidad."""
    ms = hinfo.get("metodos") or {}
    for esc in ("generico", "tradicional"):
        if esc in ms:
            return ms[esc]
    return next(iter(ms.values()), None)


def huellas_existentes(hab_id):
    return {r["huella"] for r in q(f"""select e.huella from mates10_ejercicio e join mates10_ejercicio_habilidad eh on eh.ejercicio_id = e.id
                                        where eh.habilidad_id = {lit(hab_id)} and e.huella is not null""")}


def cargar_lote(codigo, ejercicios, lote, generado_por, mapa_errores=None, plantillas=None, generador="codigo", fuente_id=None,
                publicar_provisional=0):
    """Devuelve (aceptados, rechazados). plantillas: {clave: {dificultad, enunciado_plantilla, restricciones, solucion_plantilla}}."""
    h = info_habilidad(codigo)
    if not h:
        raise ValueError(f"habilidad {codigo} no existe")
    met = metodo_principal(h)
    if not met:
        raise ValueError(f"habilidad {codigo} sin método principal (habilidad_metodo)")
    errores = h["errores"] or {}
    mapa_errores = mapa_errores or {}
    huellas = huellas_existentes(h["id"])
    ok, rech = [], []
    for ej in ejercicios:
        ej.setdefault("formato", "opcion_multiple")
        valido, motivo = validar(ej, indice(), huellas, {"parametros": h["parametros"]})
        if valido:
            ok.append(ej)
        else:
            rech.append((motivo, ej))
    # rechazos
    for i in range(0, len(rech), 100):
        vals = [f"({lit(lote)},{lit(codigo)},{lit(m[0])},{lit(m[1])},{lit(json.dumps(e, ensure_ascii=False, default=str))}::jsonb)" for m, e in rech[i:i + 100]]
        q("insert into mates10_rechazo_validador (lote, habilidad_codigo, etapa, motivo, ejercicio) values " + ",".join(vals))
    if not ok:
        return 0, len(rech)
    # plantillas
    pid = {}
    for clave, p in (plantillas or {}).items():
        cod = f"{codigo}.{clave}"
        r = q(f"""insert into mates10_plantilla (codigo, habilidad_id, formato, dificultad, enunciado_plantilla, restricciones, solucion_plantilla,
                  explicacion_plantilla, generador) values ({lit(cod)}, {lit(h['id'])}, {lit(p.get('formato', 'opcion_multiple'))}, {int(p.get('dificultad', 1))},
                  {lit(p['enunciado_plantilla'])}, {lit(p.get('restricciones') or {})}, {lit(p.get('solucion_plantilla'))}, {lit(p.get('explicacion_plantilla'))},
                  {lit(generador)}) on conflict (codigo) do update set restricciones = excluded.restricciones returning id""")
        pid[clave] = r[0]["id"]
    ciclo = ciclo_de(h["curso_ref"])
    # publicación provisional (D-008): los primeros N con dificultad 1 primero
    orden_pub = sorted(range(len(ok)), key=lambda i: (ok[i]["dificultad"], i))[:publicar_provisional]
    pub = set(orden_pub)
    for i in range(0, len(ok), 80):
        trozo = ok[i:i + 80]
        vals = []
        for j, e in enumerate(trozo):
            prov = (i + j) in pub
            vals.append("(" + ",".join([
                lit(pid.get(e.get("plantilla"))), lit(e["formato"]), str(int(e["dificultad"])), lit(e["enunciado"]), lit(e.get("datos")),
                lit(e.get("parametros")), lit([e["respuesta"]]), lit([d[0] for d in e["distractores"]]), lit(ciclo), "'es-ES'",
                lit(e.get("imprimible", True)), lit(generado_por), lit(fuente_id), lit(e["huella"]), "true",
                lit("provisional" if prov else None), lit(prov)]) + ")")
        ids = q(f"""insert into mates10_ejercicio (plantilla_id, formato, dificultad, enunciado, datos, parametros, respuesta, distractores, ciclo_registro,
                    idioma, imprimible, generado_por, fuente_id, huella, validado_automatico, revision_tipo, publicado)
                    values {",".join(vals)} returning id, huella""")
        por_huella = {r["huella"]: r["id"] for r in ids}
        hab_rows, err_rows, exp_rows = [], [], []
        sec_ids = {}
        for e in trozo:
            eid = por_huella[e["huella"]]
            hab_rows.append(f"({lit(eid)},{lit(h['id'])},'principal')")
            for s in e.get("secundarias") or []:
                if s not in sec_ids:
                    r = q(f"select id from mates10_habilidad where codigo = {lit(s)}")
                    sec_ids[s] = r[0]["id"] if r else None
                if sec_ids[s] and sec_ids[s] != h["id"]:
                    hab_rows.append(f"({lit(eid)},{lit(sec_ids[s])},'secundaria')")
            for valor, clave in e["distractores"]:
                cod_err = mapa_errores.get(clave) if clave else None
                if clave and not cod_err and clave.startswith("E") and f"{codigo}.{clave}" in errores:
                    cod_err = f"{codigo}.{clave}"
                if cod_err and cod_err in errores:
                    err_rows.append(f"({lit(eid)},{lit(errores[cod_err])},{lit(valor)})")
            pasos = e.get("pasos") or e.get("explicacion_pasos")
            exp_rows.append(f"({lit(eid)},{lit(met)},{lit(e['explicacion_nino'])},{lit(e.get('explicacion_adulto'))},{lit(pasos)},{lit(generado_por)})")
            for esc, ex in (e.get("explicaciones_extra") or {}).items():
                mid = (h.get("metodos") or {}).get(esc)
                if mid and mid != met:
                    exp_rows.append(f"({lit(eid)},{lit(mid)},{lit(ex['nino'])},{lit(ex.get('adulto'))},{lit(ex.get('pasos'))},{lit(generado_por)})")
        q("insert into mates10_ejercicio_habilidad (ejercicio_id, habilidad_id, rol) values " + ",".join(hab_rows) + " on conflict do nothing")
        if err_rows:
            q("insert into mates10_ejercicio_error (ejercicio_id, error_tipico_id, respuesta_erronea) values " + ",".join(err_rows) + " on conflict do nothing")
        q("insert into mates10_ejercicio_explicacion (ejercicio_id, metodo_id, explicacion_nino, explicacion_adulto, explicacion_pasos, generado_por) values "
          + ",".join(exp_rows) + " on conflict do nothing")
    return len(ok), len(rech)
