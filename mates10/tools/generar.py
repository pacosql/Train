"""Genera ejercicios por código para las habilidades calculables (mina 2, generador "codigo").

Spec por habilidad en mates10/02-ejercicios/specs/<GRUPO>.json:
  {"OPER.SUMA.03": {"gen": "suma", "kw": {"cifras": [1, 1], "llevada": true, "max_resultado": 18},
                    "kw_por_dificultad": {"1": {...}, "3": {...}},        # opcional, se mezcla con kw
                    "errores": {"sin_llevada": "E01", "cuenta_incluyendo": "E02"},  # clave generador → sufijo del error típico
                    "secundarias": ["OPER.SUMA.01"], "permitir_negativos": false,
                    "plantilla": "Calcula: {a} + {b} (dos números de una cifra con llevada)"}}

    python3 mates10/tools/generar.py --seco OPER.SUMA.03          # muestra 8 ejemplos sin cargar
    python3 mates10/tools/generar.py --grupo T1 --n 40 --provisional 5
    python3 mates10/tools/generar.py --todas --n 40
"""
import argparse
import glob
import json
import os
import random
import sys

sys.path.insert(0, os.path.dirname(__file__))
from gen.nucleo import REGISTRY, completar  # noqa: E402
import gen.aritmetica  # noqa: E402,F401
import gen.numeracion  # noqa: E402,F401
import gen.jerarquia  # noqa: E402,F401
import gen.fracdec  # noqa: E402,F401
import gen.medida_geo  # noqa: E402,F401
import gen.algebra  # noqa: E402,F401

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SPECS = os.path.join(ROOT, "02-ejercicios", "specs")
REPARTO = {1: 0.4, 2: 0.35, 3: 0.25}


def leer_specs():
    out = {}
    for f in sorted(glob.glob(os.path.join(SPECS, "*.json"))):
        for k, v in json.load(open(f, encoding="utf-8")).items():
            v["_fichero"] = os.path.basename(f)
            out[k] = v
    return out


def kw_de(spec, d):
    kw = dict(spec.get("kw") or {})
    kw.update((spec.get("kw_por_dificultad") or {}).get(str(d), {}))
    for k, v in list(kw.items()):
        if isinstance(v, list) and k in ("cifras",):
            kw[k] = tuple(v)
    return kw


def generar(codigo, spec, n, semilla=None):
    """Devuelve (ejercicios, plantillas) sin validar ni cargar."""
    rng = random.Random(semilla if semilla is not None else hash(codigo) & 0xFFFFFFFF)
    f = REGISTRY[spec["gen"]]
    ejs, vistos = [], set()
    objetivos = {d: max(1, round(n * p)) for d, p in REPARTO.items()}
    if spec.get("dificultades"):
        objetivos = {d: (n // len(spec["dificultades"]) + 1 if d in spec["dificultades"] else 0) for d in (1, 2, 3)}
    for d, cuantos in objetivos.items():
        intentos = 0
        hechos = 0
        while hechos < cuantos and intentos < cuantos * 25:
            intentos += 1
            try:
                e = f(rng, d, **kw_de(spec, d))
            except Exception as ex:  # noqa: BLE001
                raise RuntimeError(f"{codigo}: el generador {spec['gen']} falló con {kw_de(spec, d)}: {ex}") from ex
            if e is None or not completar(e, rng, permitir_negativos=spec.get("permitir_negativos", False)):
                continue
            clave = (e.enunciado, e.respuesta)
            if clave in vistos:
                continue
            vistos.add(clave)
            ejs.append({
                "dificultad": d, "enunciado": e.enunciado, "respuesta": e.respuesta, "distractores": e.distractores,
                "parametros": e.parametros, "datos": e.datos, "formato": "opcion_multiple",
                "explicacion_nino": e.explicacion_nino, "explicacion_adulto": e.explicacion_adulto, "pasos": e.pasos,
                "explicaciones_extra": e.explicaciones_extra, "secundarias": spec.get("secundarias") or [],
                "plantilla": f"P{d}",
            })
            hechos += 1
    base = spec.get("plantilla") or f"Generador «{spec['gen']}»"
    plantillas = {f"P{d}": {"dificultad": d, "enunciado_plantilla": f"{base} · dificultad {d}", "restricciones": kw_de(spec, d),
                            "solucion_plantilla": f"gen.{spec['gen']}", "explicacion_plantilla": "Explicación por pasos generada por el mismo generador."}
                  for d in (1, 2, 3) if any(e["dificultad"] == d for e in ejs)}
    return ejs, plantillas


def mapa_errores(codigo, spec):
    return {k: f"{codigo}.{v}" for k, v in (spec.get("errores") or {}).items()}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("codigos", nargs="*")
    ap.add_argument("--seco", action="store_true")
    ap.add_argument("--grupo")
    ap.add_argument("--todas", action="store_true")
    ap.add_argument("--n", type=int, default=40)
    ap.add_argument("--provisional", type=int, default=5, help="publicar provisionalmente N por habilidad (solo primaria)")
    args = ap.parse_args()
    specs = leer_specs()
    cods = args.codigos or [c for c, s in specs.items() if args.todas or (args.grupo and s["_fichero"].startswith(args.grupo))]
    if args.seco:
        for c in cods:
            s = specs[c]
            ejs, _ = generar(c, s, 9)
            print(f"== {c} ({len(ejs)}) gen={s['gen']} kw={s.get('kw')}")
            for e in ejs[:9]:
                print(f"  d{e['dificultad']} | {e['enunciado'].replace(chr(10), ' / ')} = {e['respuesta']} | {e['distractores']}")
        return
    from cargar_ejercicios import cargar_lote
    from db import q, lit
    tot_ok = tot_ko = 0
    for c in cods:
        s = specs[c]
        cur = q(f"select curso_ref from mates10_habilidad where codigo = {lit(c)}")
        if not cur:
            print(f"{c}: no existe en la BD, se omite")
            continue
        prov = args.provisional if cur[0]["curso_ref"].startswith("PRI") else 0
        ejs, plantillas = generar(c, s, args.n)
        ok, ko = cargar_lote(c, ejs, lote=f"codigo-{s['_fichero'][:-5]}", generado_por="algoritmo", mapa_errores=mapa_errores(c, s),
                             plantillas=plantillas, generador="codigo", publicar_provisional=prov)
        tot_ok += ok
        tot_ko += ko
        print(f"{c}: {ok} cargados, {ko} rechazados")
    print(f"TOTAL {tot_ok} cargados, {tot_ko} rechazados")


if __name__ == "__main__":
    main()
