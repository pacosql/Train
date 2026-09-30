"""Núcleo de los generadores por código (módulo 02, mina 2).

Un generador es una función gen(rng, d, **kw) -> Ejercicio | None, donde d es la dificultad (1–3)
dentro de la habilidad y kw la configuración de la habilidad (spec). Devuelve el ejercicio con su
respuesta, los distractores calculados aplicando errores típicos (cada uno con su clave de error) y
la explicación por pasos con el método principal. El núcleo completa hasta 3 distractores con
alternativas genéricas (D-011) y comprueba que ninguno coincide con la respuesta.
"""
import random
from dataclasses import dataclass, field
from fractions import Fraction

REGISTRY = {}


def generador(nombre):
    def deco(f):
        REGISTRY[nombre] = f
        return f
    return deco


@dataclass
class Ejercicio:
    enunciado: str
    respuesta: str
    parametros: dict
    distractores: list = field(default_factory=list)      # [(valor, clave_error | None)]
    pasos: list = field(default_factory=list)             # [{"paso", "operacion", "resultado", "texto"}]
    explicacion_nino: str = ""
    explicacion_adulto: str = ""
    formato: str = "opcion_multiple"
    datos: dict = None
    explicaciones_extra: dict = field(default_factory=dict)  # metodo_codigo -> {"nino", "pasos", "adulto"}
    genericos: list = field(default_factory=list)          # candidatos genéricos preferidos (sin error)


# ---------------------------------------------------------------- formato de números (convención española)

def fmt(n):
    """Entero o Fraction/decimal con convención española: coma decimal; espacio fino de miles con 5+ cifras."""
    if isinstance(n, Fraction):
        if n.denominator == 1:
            return fmt(n.numerator)
        return f"{n.numerator}/{n.denominator}"
    if isinstance(n, float):
        s = f"{n:.10f}".rstrip("0").rstrip(".")
        if "." in s:
            ent, dec = s.split(".")
            return fmt(int(ent)) + "," + dec if not ent.startswith("-") else "−" + fmt(-int(ent)) + "," + dec
        return fmt(int(s))
    neg = n < 0
    s = str(abs(n))
    if len(s) >= 5:
        grupos = []
        while s:
            grupos.insert(0, s[-3:])
            s = s[:-3]
        s = " ".join(grupos)
    return ("−" if neg else "") + s


def fdec(x, nd=None):
    """Decimal (float o Fraction) con coma y sin ceros sobrantes."""
    if nd is not None:
        x = round(float(x), nd)
    return fmt(float(x))


UNIDADES = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce",
            "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno",
            "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho",
            "veintinueve"]
DECENAS = {30: "treinta", 40: "cuarenta", 50: "cincuenta", 60: "sesenta", 70: "setenta", 80: "ochenta", 90: "noventa"}
CENTENAS = {100: "ciento", 200: "doscientos", 300: "trescientos", 400: "cuatrocientos", 500: "quinientos",
            600: "seiscientos", 700: "setecientos", 800: "ochocientos", 900: "novecientos"}


def letras(n, apocope=True):
    """Número natural en palabras (castellano). apocope: 'un' en vez de 'uno' delante de mil/millones."""
    if n < 30:
        return UNIDADES[n]
    if n < 100:
        d, u = divmod(n, 10)
        return DECENAS[d * 10] + ("" if u == 0 else " y " + UNIDADES[u])
    if n < 1000:
        c, r = divmod(n, 100)
        if n == 100:
            return "cien"
        return CENTENAS[c * 100] + ("" if r == 0 else " " + letras(r))
    if n < 1_000_000:
        m, r = divmod(n, 1000)
        pm = "mil" if m == 1 else _apoc(letras(m)) + " mil"
        return pm + ("" if r == 0 else " " + letras(r))
    if n < 1_000_000_000_000:
        m, r = divmod(n, 1_000_000)
        pm = "un millón" if m == 1 else _apoc(letras(m)) + " millones"
        return pm + ("" if r == 0 else " " + letras(r))
    m, r = divmod(n, 1_000_000_000_000)
    pm = "un billón" if m == 1 else _apoc(letras(m)) + " billones"
    return pm + ("" if r == 0 else " " + letras(r))


def _apoc(s):
    if s.endswith("veintiuno"):
        return s[:-9] + "veintiún"
    if s.endswith("uno"):
        return s[:-3] + "un"
    return s


ORDINALES = ["", "primero", "segundo", "tercero", "cuarto", "quinto", "sexto", "séptimo", "octavo", "noveno", "décimo",
             "undécimo", "duodécimo", "decimotercero", "decimocuarto", "decimoquinto", "decimosexto", "decimoséptimo",
             "decimoctavo", "decimonoveno", "vigésimo"]

NOMBRES = ["Lucía", "Hugo", "Martina", "Mateo", "Sofía", "Leo", "Julia", "Daniel", "Paula", "Álvaro", "Valeria", "Pablo",
           "Emma", "Manuel", "Carla", "Adrián", "Noa", "Mario", "Alba", "Marcos", "Sara", "Diego", "Olivia", "Iker",
           "Aitana", "Bruno", "Vega", "Hugo", "Lola", "Nicolás", "Irene", "Samuel", "Claudia", "Omar", "Aya", "Yeray"]

OBJETOS = [("canica", "canicas"), ("cromo", "cromos"), ("pegatina", "pegatinas"), ("caramelo", "caramelos"),
           ("lápiz", "lápices"), ("libro", "libros"), ("galleta", "galletas"), ("manzana", "manzanas"),
           ("globo", "globos"), ("flor", "flores"), ("concha", "conchas"), ("piedra", "piedras")]

ICONOS = ["🍎", "⭐", "🐟", "🌸", "⚽", "🐞", "🍓", "🚗", "🎈", "🐥"]


# ---------------------------------------------------------------- distractores

def genericos_num(v, rng, entero=True):
    """Alternativas genéricas plausibles para un número (D-011): ±1, ±10, cifras cambiadas, ±2."""
    c = [v + 1, v - 1, v + 10, v - 10, v + 2, v - 2]
    s = str(abs(v))
    if entero and len(s) >= 2:
        sw = int(s[:-2] + s[-1] + s[-2]) * (1 if v >= 0 else -1)
        c.insert(0, sw)
    rng.shuffle(c)
    return [x for x in c if (not entero or x >= 0)]


def completar(ej, rng, n=3, genericos=None, permitir_negativos=False):
    """Deja exactamente n distractores únicos, distintos de la respuesta, priorizando los de error típico."""
    vistos = {ej.respuesta}
    out = []
    for v, k in ej.distractores:
        vs = v if isinstance(v, str) else fmt(v)
        if vs in vistos or vs == "" or (not permitir_negativos and vs.startswith("−")):
            continue
        vistos.add(vs)
        out.append((vs, k))
        if len(out) == n:
            break
    for g in list(ej.genericos) + list(genericos or []):
        if len(out) == n:
            break
        gs = g if isinstance(g, str) else fmt(g)
        if gs in vistos or gs == "" or (not permitir_negativos and gs.startswith("−")):
            continue
        vistos.add(gs)
        out.append((gs, None))
    ej.distractores = out
    return len(out) == n


def rr(rng, a, b):
    return rng.randint(a, b)


def nuevo_rng(semilla):
    return random.Random(semilla)
