"""Validador en cascada de ejercicios (módulo 02 §4): esquema → corrección recalculada → copia por
n-gramas → duplicados → frontera. Cada rechazo se guarda con su etapa y motivo en
mates10_rechazo_validador (los rechazos corrigen la skill/generador, no el ejercicio).

La comprobación de copia es mecánica: el enunciado normalizado no puede compartir ninguna secuencia
de N palabras seguidas (N = 7) con los textos extraídos de fuentes/text/ (libros, webs, editoriales,
decretos). Se exceptúan los ejercicios "comunes" del módulo 02 (operaciones puras, tablas, definiciones
estándar), que se reconocen porque su enunciado es una orden estándar seguida de una expresión.
"""
import glob
import hashlib
import json
import os
import re
import unicodedata
from fractions import Fraction

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
N_GRAMA = 7
COMUNES = re.compile(r"^(calcula( de cabeza)?|resuelve|deriva|desarrolla|simplifica[^:]*|escribe como una sola potencia|divide|"
                     r"redondea|¿cuántos? .* son|¿qué número (sigue|es)|¿cómo se (lee|escribe|descompone)|¿cuál es (el|la) (mayor|menor|número|moda|pendiente)|"
                     r"calcula (la|el) (media|mediana|rango|mínimo|máximo|área|longitud|valor)|descompón|¿cuántos hay)", re.I)


def normaliza(t):
    t = unicodedata.normalize("NFKD", t.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9ñ ]+", " ", t).split()


def huella(enunciado, respuesta):
    return hashlib.sha1((" ".join(normaliza(enunciado)) + "|" + respuesta).encode()).hexdigest()[:20]


class IndiceCopia:
    """Índice de n-gramas de todos los textos extraídos del archivo de fuentes."""

    def __init__(self):
        self.grams = {}
        for f in glob.glob(os.path.join(ROOT, "fuentes", "text", "*", "*.txt")):
            fid = f.split(os.sep)[-2]
            w = normaliza(open(f, encoding="utf-8", errors="replace").read())
            for i in range(len(w) - N_GRAMA + 1):
                self.grams.setdefault(hash(" ".join(w[i:i + N_GRAMA])), fid)

    def coincide(self, texto):
        w = normaliza(texto)
        for i in range(len(w) - N_GRAMA + 1):
            fid = self.grams.get(hash(" ".join(w[i:i + N_GRAMA])))
            if fid:
                return fid, " ".join(w[i:i + N_GRAMA])
        return None


# ---------------------------------------------------------------- recálculo independiente

SUPS = str.maketrans("⁰¹²³⁴⁵⁶⁷⁸⁹", "0123456789")


def num(s):
    s = str(s).replace(" ", "").replace(" ", "").replace("−", "-").replace(",", ".")
    s = re.sub(r"[a-zA-Z²³°€%]+$", "", s)
    if "/" in s:
        a, b = s.split("/")
        return Fraction(int(a), int(b))
    return Fraction(s)


def eval_expr(expr):
    """Evalúa una expresión de jerarquía escrita en notación española con aritmética exacta."""
    e = expr.replace("×", "*").replace("·", "*").replace(":", "/").replace("−", "-").replace("[", "(").replace("]", ")")
    e = re.sub(r"√(\d+)", r"isqrt(\1)", e)
    e = re.sub(r"√\(", "isqrt(", e)
    e = re.sub(r"(\d+|\))([⁰¹²³⁴⁵⁶⁷⁸⁹]+)", lambda m: f"{m.group(1)}**{m.group(2).translate(SUPS)}", e)
    e = re.sub(r"(\d+)", r"F(\1)", e)

    def isqrt(v):
        r = int(round(float(v) ** 0.5))
        assert r * r == v
        return Fraction(r)
    return eval(e, {"__builtins__": {}}, {"F": Fraction, "isqrt": isqrt})


def recalcular(p, respuesta):
    """Devuelve (ok: bool | None, detalle). None = no verificable por esta vía."""
    op = p.get("op")
    try:
        if op == "suma":
            return num(respuesta) == sum(p["sumandos"]), "suma"
        if op == "resta":
            return num(respuesta) == p["a"] - p["b"], "resta"
        if op == "mult":
            return num(respuesta) == p["a"] * p["b"] or respuesta.replace(" ", "") in (f"{p['a']}×{p['b']}",), "mult"
        if op == "div":
            if "resto" in respuesta:
                q, r = re.findall(r"\d+", respuesta.replace(" ", ""))[:2]
                return int(q) == p["a"] // p["b"] and int(r) == p["a"] % p["b"], "div"
            return num(respuesta) == Fraction(p["a"], p["b"]), "div"
        if op == "jerarquia":
            return eval_expr(p["expresion"]) == num(respuesta), "jerarquia"
        if op == "pot":
            return num(respuesta) == Fraction(p["a"]) ** p["n"], "potencia"
        if op == "raiz":
            return num(respuesta) ** 2 == p["n"], "raiz"
        if op in ("ent_suma", "ent_resta", "ent_mult", "ent_div"):
            a, b = p["a"], p["b"]
            v = {"ent_suma": a + b, "ent_resta": a - b, "ent_mult": a * b, "ent_div": Fraction(a, b)}[op]
            return num(respuesta) == v, op
        if op in ("frac_suma", "frac_resta", "frac_mult", "frac_div"):
            a, b = Fraction(p["a"]), Fraction(p["b"])
            v = {"frac_suma": a + b, "frac_resta": a - b, "frac_mult": a * b, "frac_div": a / b}[op]
            return num(respuesta) == v and "/" not in respuesta or num(respuesta) == v, op
        if op == "frac_de":
            return num(respuesta) == Fraction(p["n"], p["d"]) * p["N"], op
        if op == "porc":
            return num(respuesta) == Fraction(p["p"], 100) * p["N"], op
        if op == "convertir":
            return None, "conversión: comprobada por construcción"
        if op == "ec1":
            x = num(respuesta.split("=")[1])
            return p["a"] * x + p["b"] == p["c"], op
        if op == "ec2":
            xs = [num(v) for v in re.findall(r"x = (−?\d+)", respuesta)]
            return all(x * x + p["b"] * x + p["c"] == 0 for x in xs) and len(xs) >= 1, op
        if op == "media":
            return num(respuesta) == Fraction(sum(p["datos"]), len(p["datos"])), op
        if op == "mediana":
            s = sorted(p["datos"])
            return num(respuesta) == s[len(s) // 2], op
        if op == "laplace":
            return num(respuesta) == Fraction(p["fav"], p["tot"]), op
    except Exception as ex:  # noqa: BLE001
        return False, f"error al recalcular: {ex}"
    return None, "sin recálculo específico"


# ---------------------------------------------------------------- cascada

def validar(ej, indice=None, huellas=None, habilidad=None):
    """ej: dict con enunciado, respuesta, distractores [(valor, error)], parametros, dificultad, formato,
    explicacion_nino. Devuelve (True, None) o (False, (etapa, motivo))."""
    # 1. esquema
    if not ej.get("enunciado") or not ej.get("respuesta"):
        return False, ("esquema", "falta enunciado o respuesta")
    if "<" in ej["enunciado"] and ">" in ej["enunciado"]:
        return False, ("esquema", "el enunciado contiene HTML")
    ds = [d[0] if isinstance(d, (list, tuple)) else d for d in ej.get("distractores") or []]
    if ej.get("formato", "opcion_multiple") == "opcion_multiple":
        if len(ds) != 3:
            return False, ("esquema", f"hacen falta 3 distractores y hay {len(ds)}")
        if len(set(ds)) != 3 or ej["respuesta"] in ds:
            return False, ("esquema", "distractores repetidos o iguales a la respuesta")
    if ej.get("dificultad") not in (1, 2, 3):
        return False, ("esquema", "dificultad fuera de 1–3")
    if not ej.get("explicacion_nino"):
        return False, ("esquema", "falta la explicación para el niño")
    # 2. corrección recalculada
    p = ej.get("parametros") or {}
    if p.get("op"):
        ok, det = recalcular(p, ej["respuesta"])
        if ok is False:
            return False, ("correccion", f"la respuesta no coincide con el recálculo ({det})")
        for dval in ds:
            ok2, _ = recalcular(p, dval)
            if ok2 is True:
                return False, ("correccion", f"un distractor también es correcto: {dval}")
    elif ej.get("expresion_calculo"):
        try:
            if eval_expr(ej["expresion_calculo"]) != num(ej["respuesta"]):
                return False, ("correccion", "la expresión de cálculo no da la respuesta")
        except Exception as ex:  # noqa: BLE001
            return False, ("correccion", f"expresión de cálculo no evaluable: {ex}")
    # 3. copia (salvo comunes)
    if indice is not None and not COMUNES.match(ej["enunciado"].strip()):
        m = indice.coincide(ej["enunciado"])
        if m:
            return False, ("copia", f"coincide con la fuente {m[0]}: «{m[1]}»")
    # 4. duplicados
    h = huella(ej["enunciado"], ej["respuesta"])
    if huellas is not None:
        if h in huellas:
            return False, ("duplicado", "ya existe un ejercicio con el mismo enunciado y respuesta")
        huellas.add(h)
    ej["huella"] = h
    # 5. frontera (parámetros declarados de la habilidad)
    if habilidad is not None:
        hp = habilidad.get("parametros") or {}
        mr = hp.get("max_resultado")
        if mr and p.get("op") in ("suma", "mult") and num(ej["respuesta"]) > mr:
            return False, ("frontera", f"resultado {ej['respuesta']} por encima de max_resultado {mr}")
    return True, None


if __name__ == "__main__":
    idx = IndiceCopia()
    print(f"índice de copia: {len(idx.grams)} n-gramas")
    print(validar({"enunciado": "Calcula: 45 − 2 × (3 + 4)", "respuesta": "31", "distractores": [("38", "e04"), ("301", "e01"), ("35", "e05")],
                   "parametros": {"op": "jerarquia", "expresion": "45 − 2 × (3 + 4)"}, "dificultad": 1, "explicacion_nino": "x"}, idx, set()))
    print(validar({"enunciado": "Calcula: 45 − 2 × (3 + 4)", "respuesta": "32", "distractores": [("38", "e04"), ("301", "e01"), ("35", "e05")],
                   "parametros": {"op": "jerarquia", "expresion": "45 − 2 × (3 + 4)"}, "dificultad": 1, "explicacion_nino": "x"}, idx, set()))
