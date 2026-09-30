"""Carga ejercicios generados con la skill mates10-generar-ejercicios (02-ejercicios/ia/<CODIGO>.json).

Valida en cascada y carga; publica provisionalmente 5 por habilidad de primaria (D-008).
    python3 mates10/tools/cargar_ejercicios_ia.py mates10/02-ejercicios/ia/PROB.UNA.03.json [...]
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from db import q, lit  # noqa: E402
from cargar_ejercicios import cargar_lote  # noqa: E402


def cargar(ruta, provisional=5):
    d = json.load(open(ruta, encoding="utf-8"))
    cod = d["habilidad"]
    cur = q(f"select curso_ref from mates10_habilidad where codigo = {lit(cod)}")
    if not cur:
        print(f"{cod}: no existe")
        return 0, 0
    ejs, plantillas = [], {}
    for e in d["ejercicios"]:
        dist = [(x["valor"], x.get("error")) for x in e.get("distractores", [])]
        clave = e.get("plantilla") or "P01"
        plantillas.setdefault(clave, {"dificultad": e.get("dificultad", 1), "enunciado_plantilla": e["enunciado"],
                                      "solucion_plantilla": e.get("expresion_calculo"),
                                      "explicacion_plantilla": e.get("explicacion_nino")})
        ejs.append({"dificultad": int(e.get("dificultad", 1)), "enunciado": e["enunciado"], "respuesta": str(e["respuesta"]),
                    "distractores": dist, "parametros": None, "datos": e.get("datos"), "formato": "opcion_multiple",
                    "expresion_calculo": e.get("expresion_calculo"), "explicacion_nino": e.get("explicacion_nino"),
                    "explicacion_adulto": e.get("explicacion_adulto"), "pasos": e.get("explicacion_pasos"),
                    "secundarias": e.get("secundarias") or [], "plantilla": clave})
    prov = provisional if cur[0]["curso_ref"].startswith("PRI") else 0
    ok, ko = cargar_lote(cod, ejs, lote=f"ia-{cur[0]['curso_ref']}", generado_por=d.get("generado_por", "claude (skill mates10-generar-ejercicios v1)"),
                         plantillas=plantillas, generador="ia", publicar_provisional=prov)
    print(f"{cod}: {ok} cargados, {ko} rechazados")
    return ok, ko


if __name__ == "__main__":
    t = [0, 0]
    for r in sys.argv[1:]:
        a, b = cargar(r)
        t[0] += a
        t[1] += b
    print("TOTAL", t)
