"""Generadores específicos del grupo T3 (fracciones, decimales, porcentajes, proporcionalidad, reales,
radicales, logaritmos y complejos). Uno por habilidad: `t3_<codigo>`.

Las claves de error de estos generadores son directamente los sufijos del error típico de la habilidad
("E01", "E02"…): la spec las enlaza 1 a 1. Las claves None son distractores genéricos plausibles.
Toda la aritmética es exacta (Fraction); los números se escriben con la convención española
(coma decimal, signo menos «−», espacio fino de miles).
"""
import math
from fractions import Fraction as F
from .nucleo import Ejercicio, generador, fmt, letras, NOMBRES

SUP = str.maketrans("0123456789-−", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁻")
SUB = str.maketrans("0123456789-−", "₀₁₂₃₄₅₆₇₈₉₋₋")


def sup(n):
    return str(n).translate(SUP)


def sub(n):
    return str(n).translate(SUB)


# ---------------------------------------------------------------- utilidades de formato

def redondear(x, nd):
    x = F(x)
    s = 1 if x >= 0 else -1
    return s * F(math.floor(abs(x) * 10 ** nd + F(1, 2)), 10 ** nd)


def truncar(x, nd):
    x = F(x)
    s = 1 if x >= 0 else -1
    return s * F(math.floor(abs(x) * 10 ** nd), 10 ** nd)


def D(x, nd=None):
    """Decimal exacto con coma. nd fija el número de decimales (redondeando)."""
    x = F(x)
    if nd is None:
        nd = 0
        while (x * 10 ** nd).denominator != 1:
            nd += 1
            if nd > 14:
                raise ValueError(f"{x} no es decimal exacto")
    else:
        x = redondear(x, nd)
    n = int(x * 10 ** nd)
    neg = n < 0
    ent, dec = divmod(abs(n), 10 ** nd)
    s = fmt(ent) + ("," + str(dec).zfill(nd) if nd else "")
    return ("−" if neg else "") + s


def es_dec(x, maxnd=6):
    x = F(x)
    return any((x * 10 ** k).denominator == 1 for k in range(maxnd + 1))


def ndec(x):
    x = F(x)
    k = 0
    while (x * 10 ** k).denominator != 1:
        k += 1
    return k


def fr(x):
    x = F(x)
    s = "−" if x < 0 else ""
    x = abs(x)
    return s + (str(x.numerator) if x.denominator == 1 else f"{x.numerator}/{x.denominator}")


def fr_raw(n, d):
    """Fracción sin simplificar."""
    s = "−" if (n < 0) != (d < 0) and n != 0 else ""
    return f"{s}{abs(n)}/{abs(d)}"


def eur(x):
    x = F(x)
    return (D(x) if x.denominator == 1 else D(x, 2)) + " €"


def mixto(x):
    x = F(x)
    e, r = divmod(x.numerator, x.denominator)
    if r == 0:
        return str(e)
    return f"{e} {r}/{x.denominator}" if e else f"{r}/{x.denominator}"


def cuadrado_libre(n):
    """n = c²·k con k libre de cuadrados → (c, k)."""
    c, k = 1, n
    p = 2
    while p * p <= k:
        while k % (p * p) == 0:
            k //= p * p
            c *= p
        p += 1
    return c, k


def rad(c, k, idx=2):
    """c·ⁿ√k con c Fraction. k = 1 → número racional."""
    c = F(c)
    if k == 1 or c == 0:
        return fr(c)
    r = ("√" if idx == 2 else sup(idx) + "√") + (str(k) if k >= 0 else f"({k})")
    s = "−" if c < 0 else ""
    c = abs(c)
    num = "" if c.numerator == 1 else str(c.numerator)
    t = f"{num}{r}"
    if c.denominator != 1:
        t += f"/{c.denominator}"
    return s + t


def suma_txt(terms):
    """Une términos ya formateados ('3', '−2√5'…) como una suma legible."""
    out = ""
    for t in terms:
        if t in ("0", ""):
            continue
        if not out:
            out = t
        elif t.startswith("−"):
            out += " − " + t[1:]
        else:
            out += " + " + t
    return out or "0"


def mk(enun, resp, op, par, dist, pasos, adulto, genericos=None, datos=None):
    p = {"op": op}
    p.update(par or {})
    ej = Ejercicio(enunciado=enun, respuesta=resp, parametros=p, datos=datos)
    ej.distractores = [(v, k) for v, k in dist if v is not None and v != ""]
    ej.genericos = [g for g in (genericos or []) if g is not None]
    ej.pasos = [{"paso": i + 1, "operacion": o, "resultado": r, "texto": t} for i, (o, r, t) in enumerate(pasos)]
    ej.explicacion_nino = " ".join(t for _, _, t in pasos)
    ej.explicacion_adulto = adulto
    return ej


def elegir(rng, xs):
    return xs[rng.randrange(len(xs))]


# ---------------------------------------------------------------- COMPLEJOS

def im_txt(c, k=1):
    """Parte imaginaria c·√k·i como término con signo."""
    c = F(c)
    if c == 0:
        return "0"
    s = "−" if c < 0 else ""
    a = abs(c)
    if k == 1:
        if a == 1:
            return s + "i"
        return s + (f"{a.numerator}i" if a.denominator == 1 else f"({a.numerator}/{a.denominator})i")
    return s + rad(a, k) + " i" if a.denominator == 1 else s + f"({rad(a, k)})i"


def cx(a, b, ka=1, kb=1):
    """Complejo a·√ka + b·√kb·i en forma binómica."""
    return suma_txt([rad(a, ka) if a != 0 else "0", im_txt(b, kb)])


def cmul(z, w):
    return (z[0] * w[0] - z[1] * w[1], z[0] * w[1] + z[1] * w[0])


@generador("t3_complejo_01")
def gen_complejo_01(rng, d):
    if d == 1:
        n = rng.randint(2, 20)
        pasos = [(f"√−{n * n}", f"{n}i", f"√−{n * n} = √{n * n} · √−1 = {n} · i = {n}i.")]
        return mk(f"Calcula √−{n * n}.", f"{n}i", "t3_c_raizneg", {"n": n * n},
                  [(f"−{n}", "E01"), (f"{n}", None), (f"−{n}i", None), (f"{n * n}i", None)], pasos,
                  "√−a = √a · i: la raíz de un negativo no es un número real negativo, es un imaginario puro.")
    if d == 2:
        a, b = rng.choice([x for x in range(-9, 10) if x]), rng.choice([x for x in range(-9, 10) if x])
        z = cx(a, b)
        if rng.random() < 0.5:
            pasos = [("a + bi", f"{fmt(b)}", f"En {z} la parte real es {fmt(a)} y la parte imaginaria es el número que acompaña a la i: {fmt(b)} (sin la i).")]
            return mk(f"¿Cuál es la parte imaginaria de z = {z}?", fmt(b), "t3_c_partes", {"a": a, "b": b, "parte": "im"},
                      [(im_txt(b), "E02"), (fmt(a), None), (fmt(-b), None)], pasos,
                      "En a + bi la parte imaginaria es el número real b, no bi.")
        pasos = [("a + bi", fmt(a), f"En {z} la parte real es el término sin i: {fmt(a)}.")]
        return mk(f"¿Cuál es la parte real de z = {z}?", fmt(a), "t3_c_partes", {"a": a, "b": b, "parte": "re"},
                  [(fmt(b), None), (im_txt(b), None), (fmt(-a), None)], pasos, "La parte real es el término que no lleva i.")
    # ecuación de 2.º grado con discriminante negativo
    p = rng.choice([x for x in range(-6, 7) if x])
    q = rng.randint(1, 6)
    B, C = -2 * p, p * p + q * q
    eq = suma_txt(["x²", ("−" if B < 0 else "") + (f"{abs(B)}x" if abs(B) != 1 else "x"), fmt(C)]) + " = 0"
    disc = B * B - 4 * C
    resp = f"x = {fmt(p)} ± {im_txt(q)}"
    pasos = [("Δ = b² − 4ac", fmt(disc), f"Discriminante: {fmt(B)}² − 4 · {C} = {fmt(disc)}, negativo."),
             (f"√{fmt(disc)}", f"{2 * q}i", f"√({fmt(disc)}) = {2 * q}i."),
             ("x = (−b ± √Δ)/2", resp, f"x = ({fmt(-B)} ± {2 * q}i)/2 = {fmt(p)} ± {im_txt(q)}.")]
    return mk(f"Resuelve en los complejos: {eq}", resp, "t3_c_ec2", {"b": B, "c": C},
              [(f"x = {fmt(2 * p)} ± {im_txt(2 * q)}", "E03"), (f"x = {fmt(-p)} ± {im_txt(q)}", "E03"), (f"x = {fmt(p)} ± {q * q}i" if q > 1 else f"x = {fmt(q)} ± {im_txt(abs(p))}", None),
               ("no tiene solución", None)], pasos,
              "Con discriminante negativo, √Δ = √|Δ| · i y las dos soluciones son complejas conjugadas. Hay que dividir entre 2a todo el numerador.",
              genericos=[f"x = {fmt(q)} ± {im_txt(abs(p))}"])


I_POT = {0: "1", 1: "i", 2: "−1", 3: "−i"}


@generador("t3_complejo_02")
def gen_complejo_02(rng, d):
    n = rng.randint(5, 30) if d == 1 else rng.randint(31, 250) if d == 2 else -rng.randint(1, 60)
    r = n % 4
    resp = I_POT[r]
    q_ = abs(n) // 4
    e01 = I_POT[q_ % 4]
    e02 = "i" if n % 2 else "1"          # i² = 1
    e03 = {"1": "−1", "i": "−i", "−1": "1", "−i": "i"}[I_POT[abs(n) % 4]] if n < 0 else None
    ntxt = f"({fmt(n)})" if n < 0 else str(n)
    pasos = [(f"{fmt(n)} = 4 · {n // 4} + {r}", str(r), f"Las potencias de i se repiten cada 4 (i, −1, −i, 1). Divido {fmt(n)} entre 4: el resto es {r}."),
             (f"i^{r}", resp, f"Así que i^{ntxt} = i^{r} = {resp}.")]
    return mk(f"Calcula i^{ntxt}.", resp, "t3_c_poti", {"n": n},
              [(e03, "E03"), (e01, "E01"), (e02, "E02")], pasos,
              "i^n solo depende del resto de n entre 4 (con exponente negativo, el resto positivo: −23 = 4·(−6) + 1).",
              genericos=[v for v in I_POT.values()])


@generador("t3_complejo_03")
def gen_complejo_03(rng, d):
    nz = [x for x in range(-7, 8) if x]
    a, b, c, e = (rng.choice(nz) for _ in range(4))
    z, w = cx(a, b), cx(c, e)
    if d == 1:
        if rng.random() < 0.5:
            r = (a + c, b + e)
            pasos = [("sumar partes", cx(*r), f"Sumo las partes reales ({fmt(a)} + {fmt(c)} = {fmt(r[0])}) y las imaginarias ({fmt(b)} + {fmt(e)} = {fmt(r[1])}).")]
            return mk(f"Calcula ({z}) + ({w}).", cx(*r), "t3_c_suma", {"z": [a, b], "w": [c, e]},
                      [(cx(a - c, b - e), None), (cx(a + c, b - e), "E03"), (fmt(a + b + c + e), None), (cx(a + c, -(b + e)), None)], pasos,
                      "Se suman parte real con parte real e imaginaria con imaginaria.")
        r = (a - c, b - e)
        pasos = [("restar partes", cx(*r), f"Quito el paréntesis cambiando los signos del segundo: {cx(-c, -e)}. Real: {fmt(a)} − ({fmt(c)}) = {fmt(r[0])}; imaginaria: {fmt(b)} − ({fmt(e)}) = {fmt(r[1])}.")]
        return mk(f"Calcula ({z}) − ({w}).", cx(*r), "t3_c_resta", {"z": [a, b], "w": [c, e]},
                  [(cx(a - c, b + e), "E03"), (cx(a + c, b + e), None), (cx(-r[0], r[1]), None), (cx(a - c, -(b - e)), None)], pasos,
                  "Al restar un complejo se cambia el signo de sus DOS partes.")
    if d == 2:
        r = cmul((a, b), (c, e))
        pasos = [("distribuir", f"{fmt(a * c)} + {fmt(a * e + b * c)}i + {fmt(b * e)}i²", f"Multiplico todo por todo: {fmt(a * c)} + {fmt(a * e)}i + {fmt(b * c)}i + {fmt(b * e)}i²."),
                 ("i² = −1", cx(*r), f"Como i² = −1, {fmt(b * e)}i² = {fmt(-b * e)}. Resultado: {cx(*r)}.")]
        return mk(f"Calcula ({z}) · ({w}).", cx(*r), "t3_c_mult", {"z": [a, b], "w": [c, e]},
                  [(cx(a * c + b * e, a * e + b * c), "E01"), (cx(a * c, b * e), "E02"), (cx(r[0], -r[1]), None), (cx(-r[0], r[1]), None)], pasos,
                  "Se distribuye como con binomios y se sustituye i² por −1.")
    # potencia pequeña o combinación
    n = rng.choice([2, 2, 3])
    a, b = rng.choice([x for x in range(-4, 5) if x]), rng.choice([x for x in range(-4, 5) if x])
    r = (1, 0)
    for _ in range(n):
        r = cmul(r, (a, b))
    z = cx(a, b)
    if n == 2:
        pasos = [("(a + bi)² = a² + 2abi + b²i²", cx(*r), f"({z})² = {a * a} + {fmt(2 * a * b)}i + {b * b}i² = {a * a} − {b * b} + {fmt(2 * a * b)}i = {cx(*r)}.")]
        dist = [(cx(a * a + b * b, 2 * a * b), "E01"), (cx(a * a, b * b), "E02"), (cx(a * a - b * b, 0) if a * a != b * b else cx(0, a * b), None), (cx(r[0], -r[1]), None)]
    else:
        r2 = cmul((a, b), (a, b))
        pasos = [("(a + bi)²", cx(*r2), f"Primero ({z})² = {cx(*r2)} (usando i² = −1)."),
                 ("· (a + bi)", cx(*r), f"Después ({cx(*r2)}) · ({z}) = {cx(*r)}.")]
        mal = (1, 0)
        for _ in range(3):
            mal = (mal[0] * a + mal[1] * b, mal[0] * b + mal[1] * a)  # i² = +1
        dist = [(cx(*mal), "E01"), (cx(a ** 3, b ** 3), "E02"), (cx(r[0], -r[1]), None), (cx(-r[0], r[1]), None)]
    return mk(f"Calcula ({z}){sup(n)}.", cx(*r), "t3_c_pot", {"z": [a, b], "n": n}, dist, pasos,
              "Las potencias pequeñas se hacen multiplicando (o con el cuadrado de un binomio) y usando i² = −1.")


@generador("t3_complejo_04")
def gen_complejo_04(rng, d):
    nz = [x for x in range(-9, 10) if x]
    if d == 1:
        a, b = rng.choice(nz), rng.choice(nz)
        z = cx(a, b)
        if rng.random() < 0.5:
            pasos = [("conjugado", cx(a, -b), f"El conjugado cambia solo el signo de la parte imaginaria: {cx(a, -b)}.")]
            return mk(f"¿Cuál es el conjugado de z = {z}?", cx(a, -b), "t3_c_conj", {"z": [a, b]},
                      [(cx(-a, b), "E01"), (cx(-a, -b), None), (cx(b, a), None)], pasos,
                      "Conjugado: a − bi (se refleja en el eje real). Opuesto: −a − bi (cambian los dos signos).")
        pasos = [("opuesto", cx(-a, -b), f"El opuesto cambia el signo de las dos partes: {cx(-a, -b)}.")]
        return mk(f"¿Cuál es el opuesto de z = {z}?", cx(-a, -b), "t3_c_opuesto", {"z": [a, b]},
                  [(cx(a, -b), "E01"), (cx(-a, b), None), (cx(b, a), None)], pasos,
                  "Opuesto: −a − bi. Conjugado: a − bi. Se confunden con facilidad.")
    for _ in range(100):
        c, e = rng.choice([x for x in range(-4, 5) if x]), rng.choice([x for x in range(-4, 5) if x])
        if d == 2:
            q = (F(rng.choice(nz)), F(rng.choice(nz + [0])))
        else:
            m = c * c + e * e
            q = (F(rng.randint(-2 * m, 2 * m), m), F(rng.randint(-2 * m, 2 * m), m))
            if q[0].denominator == 1 and q[1].denominator == 1:
                continue
        num = cmul(q, (c, e))
        if num[0].denominator != 1 or num[1].denominator != 1 or num[0] == 0 or num[1] == 0 or abs(c) == abs(e):
            continue
        break
    else:
        return None
    a, b = int(num[0]), int(num[1])
    m = c * c + e * e
    nn = cmul((a, b), (c, -e))
    e02 = cx(F(a, c), F(b, e))
    e03d = c * c - e * e
    e03 = cx(F(nn[0], e03d), F(nn[1], e03d))
    resp = cx(*q)
    pasos = [("× conjugado", f"({cx(a, b)})({cx(c, -e)}) / ({cx(c, e)})({cx(c, -e)})", f"Multiplico arriba y abajo por el conjugado del denominador, {cx(c, -e)}."),
             ("denominador", str(m), f"Abajo queda {c}² + {e}² = {m} (sin i)."),
             ("numerador", cx(*nn), f"Arriba: ({cx(a, b)})({cx(c, -e)}) = {cx(*nn)}."),
             ("dividir", resp, f"Divido cada parte entre {m}: {resp}.")]
    return mk(f"Calcula ({cx(a, b)}) / ({cx(c, e)}).", resp, "t3_c_div", {"z": [a, b], "w": [c, e]},
              [(e02, "E02"), (e03, "E03"), (cx(q[0], -q[1]), None), (cx(-q[0], q[1]), None)], pasos,
              "Para dividir se multiplica por el conjugado del denominador; abajo queda c² + d² (real).")


# notables: ángulo → (cos, sin) como (coef, radicando)
def trig(ang):
    ang %= 360
    base = {0: ((1, 1), (0, 1)), 30: ((F(1, 2), 3), (F(1, 2), 1)), 45: ((F(1, 2), 2), (F(1, 2), 2)), 60: ((F(1, 2), 1), (F(1, 2), 3)),
            90: ((0, 1), (1, 1))}
    q, a = divmod(ang, 90)
    (c, kc), (s, ks) = base[a]
    for _ in range(q):  # rotar 90°: (cos, sin) → (−sin, cos)
        (c, kc), (s, ks) = (-F(s), ks), (F(c), kc)
    return (F(c), kc), (F(s), ks)


def ang_ok(rng, d):
    return rng.choice([x for x in range(0, 360, 15) if x % 30 == 0 or x % 45 == 0])


@generador("t3_complejo_06")
def gen_complejo_06(rng, d):
    if d == 1 or (d == 2 and rng.random() < 0.5):
        ang = rng.choice([30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330] if d > 1 else [0, 30, 45, 60, 90, 180, 270])
        r = rng.choice([2, 4, 6, 8, 10]) if ang % 90 else rng.randint(2, 9)
        (c, kc), (s, ks) = trig(ang)
        resp = cx(r * c, r * s, kc, ks)
        pasos = [("a = r·cos α", rad(r * c, kc), f"a = {r} · cos {ang}° = {rad(r * c, kc)}."),
                 ("b = r·sen α", rad(r * s, ks), f"b = {r} · sen {ang}° = {rad(r * s, ks)}."),
                 ("a + bi", resp, f"Forma binómica: {resp}.")]
        return mk(f"Escribe en forma binómica el complejo {r}{sub(ang)}°.", resp, "t3_c_pol_bin", {"r": r, "ang": ang},
                  [(cx(r * s, r * c, ks, kc), "E01"), (cx(c, s, kc, ks), "E02"), (cx(r * c, -r * s, kc, ks), None), (cx(-r * c, r * s, kc, ks), None)], pasos,
                  "a = r cos α y b = r sen α; el coseno va con la parte real. Hay que multiplicar por el módulo.")
    # binómica → polar
    ang = rng.choice([45, 135, 225, 315, 30, 60, 120, 150, 210, 240, 300, 330] if d == 3 else [45, 135, 225, 315, 90, 180, 270, 0])
    s_ = rng.randint(1, 5)
    (c, kc), (s, ks) = trig(ang)
    if ang % 90 == 0:
        r_txt, a, b, ka, kb = str(s_), s_ * c, s_ * s, kc, ks
    elif ang % 45 == 0:
        r_txt = rad(s_, 2)
        a, b, ka, kb = s_ * (1 if c > 0 else -1), s_ * (1 if s > 0 else -1), 1, 1
    else:
        r_txt = str(2 * s_)
        a, b, ka, kb = 2 * s_ * c, 2 * s_ * s, kc, ks
    z = cx(a, b, ka, kb)
    ref = {45: 45, 135: 45, 225: 45, 315: 45, 30: 30, 150: 30, 210: 30, 330: 30, 60: 60, 120: 60, 240: 60, 300: 60, 0: 0, 90: 90, 180: 0, 270: 90}[ang]
    mal_ang = ref if ang < 90 else (ang - 180 if 90 < ang < 270 else ang - 360)  # arctan sin corregir cuadrante
    e03 = f"{r_txt}{sub(mal_ang)}°" if mal_ang != ang else f"{r_txt}{sub((ang + 180) % 360)}°"
    resp = f"{r_txt}{sub(ang)}°"
    pasos = [("r = √(a² + b²)", r_txt, f"Módulo: r = √(a² + b²) = {r_txt}."),
             ("tg α = b/a", f"{ang}°", f"Argumento: miro el cuadrante del punto ({rad(a, ka)}, {rad(b, kb)}); el ángulo es {ang}°."),
             ("r_α", resp, f"Forma polar: {resp}.")]
    return mk(f"Escribe en forma polar el complejo z = {z}.", resp, "t3_c_bin_pol", {"z": z},
              [(e03, "E03"), (f"{r_txt}{sub((90 - ang) % 360)}°" if (90 - ang) % 360 != ang else None, "E01"), (f"{r_txt}{sub((ang + 90) % 360)}°", None),
               (f"{r_txt}{sub((360 - ang) % 360)}°" if ang not in (0, 180) else f"{r_txt}{sub((ang + 180) % 360)}°", None)], pasos,
              "El argumento se obtiene con tg α = b/a, pero hay que colocarlo en el cuadrante correcto según los signos de a y b.")


@generador("t3_complejo_07")
def gen_complejo_07(rng, d):
    def P(r, a):
        return f"{r}{sub(a)}°"
    if d == 1:
        r1, r2 = rng.randint(2, 6), rng.randint(2, 6)
        a1, a2 = rng.choice(range(10, 360, 5)), rng.choice(range(10, 360, 5))
        res = (a1 + a2) % 360
        pasos = [("módulos", str(r1 * r2), f"Multiplico los módulos: {r1} · {r2} = {r1 * r2}."),
                 ("argumentos", f"{res}°", f"Sumo los argumentos: {a1}° + {a2}° = {a1 + a2}°" + (f", que reducido a [0°, 360°) es {res}°." if a1 + a2 >= 360 else ".")),
                 ("r_α", P(r1 * r2, res), f"Resultado: {P(r1 * r2, res)}.")]
        return mk(f"Calcula {P(r1, a1)} · {P(r2, a2)}.", P(r1 * r2, res), "t3_c_polmul", {"r": [r1, r2], "a": [a1, a2]},
                  [(P(r1 * r2, a1 * a2), "E01"), (P(r1 + r2, res), "E02"), (P(r1 * r2, a1 + a2) if a1 + a2 >= 360 else P(r1 * r2, abs(a1 - a2)), "E03" if a1 + a2 >= 360 else None)], pasos,
                  "En forma polar se multiplican los módulos y se suman los argumentos (reduciendo a [0°, 360°)).",
                  genericos=[P(r1 * r2, abs(a1 - a2)), P(r1 + r2, a1 + a2)])
    if d == 2:
        r2 = rng.randint(2, 5)
        r1 = r2 * rng.randint(2, 6)
        a1, a2 = rng.choice(range(10, 360, 5)), rng.choice(range(10, 360, 5))
        res = (a1 - a2) % 360
        pasos = [("módulos", str(r1 // r2), f"Divido los módulos: {r1} : {r2} = {r1 // r2}."),
                 ("argumentos", f"{res}°", f"Resto los argumentos: {a1}° − {a2}° = {a1 - a2}°" + (f", que equivale a {res}°." if a1 - a2 < 0 else ".")),
                 ("r_α", P(r1 // r2, res), f"Resultado: {P(r1 // r2, res)}.")]
        return mk(f"Calcula {P(r1, a1)} : {P(r2, a2)}.", P(r1 // r2, res), "t3_c_poldiv", {"r": [r1, r2], "a": [a1, a2]},
                  [(P(r1 // r2, a1 - a2) if a1 < a2 else None, "E03"), (P(r1 - r2, res), "E02"), (P(r1 // r2, (a1 + a2) % 360), None), (P(r1 * r2, res), None)], pasos,
                  "Para dividir: se dividen los módulos y se restan los argumentos.")
    if rng.random() < 0.35:
        n = rng.choice([4, 6, 8, 10, 12])
        ang = rng.choice([45, 135, 225, 315])
        z = cx(1 if ang in (45, 315) else -1, 1 if ang < 180 else -1)
        r = 2 ** (n // 2)
        res = (n * ang) % 360
        (c, kc), (s, ks) = trig(res)
        fin = cx(r * c, r * s, kc, ks)
        pasos = [("polar", f"√2{sub(ang)}°", f"Paso a polar: {z} = √2{sub(ang)}°."),
                 ("Moivre", P(r, res), f"(√2)^{n} = {r} y {n} · {ang}° = {n * ang}° → {res}°."),
                 ("binómica", fin, f"Resultado: {P(r, res)} = {fin}.")]
        return mk(f"Calcula ({z})^{n} con la fórmula de Moivre.", f"{P(r, res)} = {fin}", "t3_c_moivre", {"z": z, "n": n},
                  [(f"{P(r, n * ang)}", "E03"), (P(rad(n, 2), res), "E04"), (f"{P(r, (ang + res) % 360)}", None), (f"{P(2 ** n, res)}", None)], pasos,
                  "(r_α)^n = (r^n)_(nα): el módulo se ELEVA y el argumento se MULTIPLICA; después se reduce el ángulo.")
    r = rng.randint(2, 3)
    n = rng.randint(2, 5) if r == 2 else rng.randint(2, 4)
    a = rng.choice(range(15, 360, 15))
    res = (n * a) % 360
    pasos = [("módulo", str(r ** n), f"El módulo se eleva: {r}^{n} = {r ** n}."),
             ("argumento", f"{res}°", f"El argumento se multiplica: {n} · {a}° = {n * a}°" + (f" → {res}°." if n * a >= 360 else ".")),
             ("r_α", P(r ** n, res), f"Resultado: {P(r ** n, res)}.")]
    return mk(f"Calcula ({P(r, a)}){sup(n)}.", P(r ** n, res), "t3_c_polpot", {"r": r, "a": a, "n": n},
              [(P(r ** n, n * a) if n * a >= 360 else None, "E03"), (P(r * n, res), "E04"), (P(r ** n, a), None), (P(r ** n, (a + n) % 360), None)], pasos,
              "Moivre: (r_α)^n = (r^n)_(nα). El módulo no se multiplica por n.", genericos=[P(r * n, n * a), P(n * r, a)])


@generador("t3_complejo_08")
def gen_complejo_08(rng, d):
    def P(r, a):
        return f"{r}{sub(a)}°"
    n = 2 if d == 1 else 3 if d == 2 else rng.choice([4, 5, 6])
    base = rng.choice([1, 2] if n > 3 else [1, 2, 3])
    R = base ** n
    if d == 3 and rng.random() < 0.5:
        ang = rng.choice([0, 90, 180, 270])
        w = {0: fmt(R), 90: f"{R}i" if R > 1 else "i", 180: fmt(-R), 270: f"−{R}i" if R > 1 else "−i"}[ang]
        enun = f"Resuelve z{sup(n)} = {w} (da las soluciones en forma polar)."
        intro = f"Paso {w} a polar: {P(R, ang)}. "
    else:
        ang = rng.choice(range(0, 360, 30 if n != 5 else 10))
        enun = f"Calcula las raíces {['', '', 'cuadradas', 'cúbicas', 'cuartas', 'quintas', 'sextas'][n]} de {P(R, ang)}."
        intro = ""
    args = [F(ang + 360 * k, n) for k in range(n)]
    if any(x.denominator != 1 for x in args):
        return None
    args = [int(x) for x in args]
    resp = ", ".join(P(base, x) for x in args)
    mod_mal = fr(F(R, n))
    pasos = [("módulo", str(base), intro + f"Módulo: {sup(n)}√{R} = {base}."),
             ("argumentos", ", ".join(f"{x}°" for x in args), f"Argumentos: ({ang}° + 360°·k)/{n} para k = 0, …, {n - 1}: " + ", ".join(f"{x}°" for x in args) + "."),
             ("raíces", resp, f"Hay {n} raíces, vértices de un polígono regular de {n} lados: {resp}.")]
    return mk(enun, resp, "t3_c_raices", {"R": R, "ang": ang, "n": n},
              [(P(base, args[0]), "E01"), (", ".join(P(mod_mal, x) for x in args) if base != F(R, n) else None, "E02"),
               (", ".join(P(base, (ang // n) + 360 * k) if ang % n == 0 else P(base, args[0] + 360 * k) for k in range(n)), "E03"),
               (", ".join(P(base, (args[0] + 360 * k // (n + 1)) % 360) for k in range(n)), None)], pasos,
              "Un complejo no nulo tiene exactamente n raíces n-ésimas: mismo módulo ⁿ√r y argumentos separados 360°/n.")


# ---------------------------------------------------------------- DECIMALES (numeración)

def fem(s):
    """Numeral en femenino (unidades, décimas, centésimas)."""
    if s == "uno":
        return "una"
    s = s.replace("ientos", "ientas").replace("quinientos", "quinientas")
    if s.endswith("veintiuno"):
        s = s[:-9] + "veintiuna"
    elif s.endswith(" uno"):
        s = s[:-4] + " una"
    return s


def cant(n, sing, plur):
    return f"una {sing}" if n == 1 else f"{fem(letras(n))} {plur}"


ORD_DEC = {1: ("décima", "décimas"), 2: ("centésima", "centésimas"), 3: ("milésima", "milésimas")}


def dec_palabras(e, k, nd):
    return f"{cant(e, 'unidad', 'unidades')} y {cant(k, *ORD_DEC[nd])}"


@generador("t3_dec_01")
def gen_dec_01(rng, d):
    if d == 1:
        e, k = rng.randint(0, 20), rng.randint(1, 9)
        v = F(e) + F(k, 10)
        txt = dec_palabras(e, k, 1)
        pasos = [("décimas", D(v), f"Las décimas van en el primer lugar después de la coma: {txt} = {D(v)}.")]
        return mk(f"Escribe con cifras: {txt}.", D(v), "t3_dec_leer", {"e": e, "k": k, "nd": 1},
                  [(f"{e}{k}", "E03"), (D(F(e) + F(k, 100)), None), (D(F(k) + F(e, 10)) if e < 10 else D(F(e) + F(k, 1000)), None)], pasos,
                  "Una cifra decimal = décimas; dos = centésimas.", genericos=[D(v + 1), D(F(e * 10 + k, 100))])
    if d == 2 or rng.random() < 0.4:
        if rng.random() < 0.5 or d == 3:
            e = rng.randint(1, 99 if d == 2 else 999)
            k = rng.randint(1, 9) if rng.random() < 0.6 else rng.randint(11, 99)
            v = F(e) + F(k, 100)
            txt = dec_palabras(e, k, 2)
            pasos = [("centésimas", D(v), f"Las centésimas ocupan el segundo lugar tras la coma; si hay menos de diez centésimas, las décimas son 0: {txt} = {D(v)}.")]
            dist = [(D(F(e) + F(k, 10)) if k < 10 else None, "E01"), (f"{fmt(e * 100 + k)}", "E03"), (D(F(e) + F(k, 1000)), None), (D(F(e) + F(k, 10)) if k >= 10 else None, None)]
            return mk(f"Escribe con cifras: {txt}.", D(v), "t3_dec_leer", {"e": e, "k": k, "nd": 2}, dist, pasos,
                      "El cero de las décimas es la trampa: «tres unidades y siete centésimas» es 3,07, no 3,7.",
                      genericos=[D(v + F(1, 10)), D(v + 1)])
        e, k = rng.randint(1, 99), rng.randint(1, 9)
        v = F(e) + F(k, 10)
        pasos = [("leer", dec_palabras(e, k, 1), f"En {D(v)} hay una sola cifra decimal: son décimas. Se lee {dec_palabras(e, k, 1)}.")]
        return mk(f"¿Cómo se lee {D(v)}?", dec_palabras(e, k, 1), "t3_dec_leer_inv", {"v": D(v)},
                  [(dec_palabras(e, k, 2), "E02"), (dec_palabras(e, k, 3), None), (dec_palabras(k, e, 1) if e != k and e < 1000 else None, None)], pasos,
                  "El nombre de la parte decimal lo da la última cifra: una cifra, décimas; dos, centésimas.",
                  genericos=[f"{fem(letras(e * 10 + k))} centésimas"])
    e, c = rng.randint(1, 60), rng.choice([rng.randint(1, 9), rng.randint(10, 95)])
    v = F(e) + F(c, 100)
    txt = f"{letras(e)} euros con {letras(c)} céntimo{'s' if c > 1 else ''}".replace("uno euros", "un euros").replace("un euros", "un euros")
    txt = txt.replace("uno euros", "un euros")
    if txt.startswith("un euros"):
        txt = "un euro" + txt[8:]
    txt = txt.replace("y uno euros", "y un euros").replace("veintiuno euros", "veintiún euros").replace(" uno céntimo", " un céntimo")
    resp = D(v, 2) + " €"
    pasos = [("céntimos", resp, f"Un céntimo es una centésima de euro: {c} céntimos = {D(F(c, 100), 2)} €. Total: {resp}.")]
    return mk(f"Escribe con cifras el precio: {txt}.", resp, "t3_dec_precio", {"e": e, "c": c},
              [(D(F(e) + F(c, 10) if c < 10 else F(e) + F(c, 1000)) + " €", "E01" if c < 10 else None), (f"{fmt(e * 100 + c)} €", "E03"), (D(F(e) + F(c, 1000), 3) + " €", None)], pasos,
              "Los céntimos son centésimas de euro: siempre dos cifras tras la coma (5 céntimos = 0,05 €).",
              genericos=[D(v + F(1, 10), 2) + " €", D(v + 1, 2) + " €"])


@generador("t3_dec_02")
def gen_dec_02(rng, d):
    t = rng.choice(["a", "e", "f"] if d == 1 else ["b", "c"] if d == 2 else ["d", "c3"])
    if t == "a":
        k = rng.randint(1, 9)
        v = F(k, 10)
        pasos = [("1 d = 10 c", str(10 * k), f"{D(v)} son {k} décimas, y cada décima son 10 centésimas: {k} × 10 = {10 * k} centésimas.")]
        return mk(f"¿Cuántas centésimas son {D(v)}?", str(10 * k), "t3_dec_equiv", {"v": D(v), "u": "c"},
                  [(str(k), "E02"), (str(100 * k), "E02"), (str(1000 * k), None)], pasos,
                  "1 décima = 10 centésimas: 0,4 = 0,40 = 40 centésimas.", genericos=[str(k + 10)])
    if t == "e":
        n = rng.choice([x for x in range(11, 100) if x % 10])
        pasos = [("centésimas", D(F(n, 100)), f"{n} centésimas son {n}/100 = {D(F(n, 100))}.")]
        return mk(f"¿Qué número decimal son {n} centésimas?", D(F(n, 100)), "t3_dec_equiv", {"n": n, "u": "c"},
                  [(D(F(n, 10)), "E02"), (D(F(n, 1000)), "E02"), (str(n), None)], pasos, "Centésima = 1/100: segunda cifra después de la coma.")
    if t == "f":
        k = rng.randint(1, 9)
        a, b = D(F(k, 10)), D(F(k, 10), 2)
        e = rng.randint(0, 9)
        a, b = D(e + F(k, 10)), D(e + F(k, 10), 2)
        pasos = [("0,5 = 0,50", "iguales", f"{b} son {10 * k + e * 100} centésimas y {a} son {k + e * 10} décimas, que también son {10 * k + e * 100} centésimas: valen lo mismo.")]
        return mk(f"¿Qué número es mayor: {a} o {b}?", "Son iguales", "t3_dec_ceros", {"v": a},
                  [(b, "E01"), (a, None), ("No se pueden comparar", None)], pasos,
                  "Añadir ceros a la derecha de la parte decimal no cambia el valor: 0,5 = 0,50 = 0,500.", datos={"opciones_fijas": True})
    if t == "b":
        e, k = rng.randint(1, 30), rng.randint(1, 9)
        v = F(e) + F(k, 10)
        pasos = [("1 u = 10 d", str(10 * e + k), f"{e} unidades son {10 * e} décimas; más {k} décimas: {10 * e + k} décimas.")]
        return mk(f"¿Cuántas décimas son {D(v)}?", str(10 * e + k), "t3_dec_equiv", {"v": D(v), "u": "d"},
                  [(str(k), "E03"), (str(100 * e + 10 * k), "E02"), (str(e + k), None)], pasos,
                  "Cada unidad son 10 décimas: hay que contar también la parte entera.")
    if t in ("c", "c3"):
        e, k = rng.randint(1, 9 if d == 2 else 60), rng.randint(11, 99)
        if k % 10 == 0:
            k += 1
        v = F(e) + F(k, 100)
        pasos = [("1 u = 100 c", str(100 * e + k), f"{e} unidad{'es' if e > 1 else ''} = {100 * e} centésimas; más {k}: {100 * e + k} centésimas.")]
        return mk(f"¿Cuántas centésimas son {D(v)}?", fmt(100 * e + k), "t3_dec_equiv", {"v": D(v), "u": "c"},
                  [(str(k), "E03"), (fmt(10 * e + k // 10), "E02"), (fmt(1000 * e + 10 * k), "E02")], pasos,
                  "Cada unidad son 100 centésimas: 2,35 = 235 centésimas, no 35.")
    e, k = rng.randint(1, 40), rng.randint(1, 9)
    v = F(e) + F(k, 10)
    pasos = [("× 100", fmt(100 * e + 10 * k), f"{D(v)} = {D(v, 2)}: son {fmt(100 * e + 10 * k)} centésimas.")]
    return mk(f"¿Cuántas centésimas son {D(v)}?", fmt(100 * e + 10 * k), "t3_dec_equiv", {"v": D(v), "u": "c"},
              [(fmt(10 * e + k), "E02"), (str(10 * k), "E03"), (str(k), "E03")], pasos,
              "Añadiendo un cero, 3,2 = 3,20: se ve que son 320 centésimas.")


ORDENES = {1: ("décimas", "decenas"), 2: ("centésimas", "centenas"), 3: ("milésimas", "unidades de millar")}


@generador("t3_dec_03")
def gen_dec_03(rng, d):
    if d in (1, 2):
        for _ in range(50):
            e = rng.randint(1, 999 if d == 2 else 99)
            ds_ = [rng.randint(0, 9) for _ in range(3)]
            if ds_[2] == 0:
                continue
            pos = rng.randint(1, 3)
            dig = ds_[pos - 1]
            todos = str(e) + "".join(map(str, ds_))
            if dig == 0 or todos.count(str(dig)) != 1:
                continue
            break
        else:
            return None
        v = F(e) + F(int("".join(map(str, ds_))), 1000)
        if d == 1:
            val = F(dig, 10 ** pos)
            pasos = [("posición", ORDENES[pos][0], f"En {D(v)} la cifra {dig} está en el lugar {pos} tras la coma: son {ORDENES[pos][0]}."),
                     ("valor", D(val), f"Vale {dig} {ORDENES[pos][0]} = {D(val)}.")]
            return mk(f"¿Qué valor tiene la cifra {dig} en el número {D(v)}?", D(val), "t3_dec_valor", {"v": D(v), "cifra": dig},
                      [(fmt(dig * 10 ** pos), "E01"), (str(dig), "E03"), (D(F(dig, 10 ** (pos + 1))) if pos < 3 else D(F(dig, 10 ** (pos - 1))), None)], pasos,
                      "Tras la coma: décimas (0,1), centésimas (0,01), milésimas (0,001). No confundir décimas con decenas.")
        pasos = [("posición", ORDENES[pos][0], f"Cuento lugares desde la coma: décimas, centésimas, milésimas. La cifra {dig} está en las {ORDENES[pos][0]}.")]
        otros = [ORDENES[p][0] for p in (1, 2, 3) if p != pos]
        return mk(f"En el número {D(v)}, ¿en qué orden está la cifra {dig}?", ORDENES[pos][0], "t3_dec_orden", {"v": D(v), "cifra": dig},
                  [(ORDENES[pos][1], "E01"), (otros[0], None), (otros[1], None)], pasos,
                  "Los órdenes decimales terminan en «-ésimas» y son simétricos a los enteros respecto de las unidades, no de la coma.",
                  datos={"opciones_fijas": True})
    # componer
    partes = {}
    for nombre, val in (("decenas", 10), ("unidades", 1), ("décimas", F(1, 10)), ("centésimas", F(1, 100)), ("milésimas", F(1, 1000))):
        if rng.random() < 0.6:
            partes[nombre] = (rng.randint(1, 9), val)
    if "milésimas" not in partes and "centésimas" not in partes:
        partes["milésimas"] = (rng.randint(1, 9), F(1, 1000))
    if len(partes) < 2 or ("décimas" in partes and "centésimas" in partes and "milésimas" in partes):
        partes.pop("décimas", None)
    if len(partes) < 2:
        partes["unidades"] = (rng.randint(1, 9), 1)
    orden = ["decenas", "unidades", "décimas", "centésimas", "milésimas"]
    items = [(n, partes[n]) for n in orden if n in partes]
    v = sum(c * val for _, (c, val) in items)
    SING = {"decenas": "decena", "unidades": "unidad", "décimas": "décima", "centésimas": "centésima", "milésimas": "milésima"}

    def uno(n, c):
        return f"{c} {SING[n] if c == 1 else n}"
    txt = ", ".join(uno(n, c) for n, (c, _) in items[:-1]) + f" y {uno(items[-1][0], items[-1][1][0])}"
    ent = "".join(str(c) for n, (c, val) in items if val >= 1) or "0"
    decs = "".join(str(c) for n, (c, val) in items if val < 1)
    e02 = f"{int(ent)},{decs}" if decs else None
    pasos = [("tabla", D(v), f"Coloco cada cifra en su orden y pongo 0 en los que faltan: {D(v)}.")]
    return mk(f"Escribe el número que tiene {txt}.", D(v), "t3_dec_componer", {"partes": txt},
              [(e02 if e02 and e02 != D(v) else None, "E02"), (D(v * 10), None), (D(v / 10), None)], pasos,
              "Los órdenes que no aparecen se rellenan con ceros: 5 unidades y 7 milésimas = 5,007.",
              genericos=[D(v + F(1, 10)), D(v + F(1, 100)), D(v * 100)])


@generador("t3_dec_04")
def gen_dec_04(rng, d):
    a, b = rng.sample(range(1, 10), 2)
    I = rng.randint(1, 9) if d < 3 else rng.randint(0, 3)
    if d == 1 or (d == 2 and rng.random() < 0.5):
        # mayor: M = I,x ; E01 = I,(x−1)y ; E03 = (I−1),zzz ; E04 = I,0x
        x = max(a, b)
        y = rng.randint(x, 9) if x < 9 else 9
        M = I + F(x, 10)
        e01 = I + F(x - 1, 10) + F(y, 100 if d == 1 else 100) + (F(rng.randint(1, 9), 1000) if d == 2 else 0)
        e03 = (I - 1) + F(rng.randint(800, 999), 1000)
        e04 = I + F(x, 100)
        nums = [M, e01, e03, e04]
        if len(set(nums)) < 4 or max(nums) != M:
            return None
        lista = sorted(nums, key=lambda _: rng.random())
        pasos = [("comparar", D(M), f"Comparo la parte entera: la mayor es {I}. Entre los que tienen {I}, miro las décimas: {D(M)} tiene {x} décimas, que es lo máximo. El mayor es {D(M)}.")]
        return mk(f"¿Cuál es el mayor de estos números: {'; '.join(D(n) for n in lista)}?", D(M), "t3_dec_comp", {"nums": [D(n) for n in lista], "tipo": "mayor"},
                  [(D(e01), "E01"), (D(e03), "E03"), (D(e04), "E04")], pasos,
                  "Se compara la parte entera y después cifra a cifra desde las décimas. Tener más cifras no hace mayor a un decimal.",
                  datos={"opciones_fijas": True})
    if d == 2:
        x = min(a, b)
        m = I + F(10 * x + rng.randint(1, 9), 100)
        e02 = m + F(rng.randint(1, 9), 1000)
        e03 = (I + 1) + F(rng.randint(1, 3), 10)
        g = I + F(x + 1, 10)
        nums = [m, e02, e03, g]
        if len(set(nums)) < 4 or min(nums) != m:
            return None
        lista = sorted(nums, key=lambda _: rng.random())
        pasos = [("comparar", D(m), f"La parte entera menor es {I}. Entre esos, comparo décimas y después centésimas: el menor es {D(m)}.")]
        return mk(f"¿Cuál es el menor de estos números: {'; '.join(D(n) for n in lista)}?", D(m), "t3_dec_comp", {"nums": [D(n) for n in lista], "tipo": "menor"},
                  [(D(e02), "E02"), (D(e03), "E03"), (D(g), None)], pasos,
                  "Ni más cifras significa mayor ni menos cifras significa mayor: se compara orden a orden.",
                  datos={"opciones_fijas": True})
    x, y = max(a, b), min(a, b)
    Ist = I
    nums = [Ist + F(x, 10), Ist + F(10 * y + x, 100), Ist + F(100 * y + x, 1000), Ist + F(10 * x + y, 100), Ist + F(10 * y + x, 1000)]
    if len(set(nums)) < 5:
        return None
    lista = sorted(nums, key=lambda _: rng.random())
    txt = [D(n) for n in lista]
    resp = " < ".join(D(n) for n in sorted(nums))

    def dec_part(s):
        return s.split(",")[1]
    e01 = " < ".join(sorted(txt, key=lambda s: (int(dec_part(s)), len(dec_part(s)))))
    e02 = " < ".join(sorted(txt, key=lambda s: (-len(dec_part(s)), s)))
    e04 = " < ".join(sorted(txt, key=lambda s: (float("0." + dec_part(s).replace("0", "")), len(s))))
    pasos = [("comparar", resp, "Completo con ceros para que todos tengan tres decimales y comparo como números naturales: " +
              ", ".join(f"{D(n)} → {D(n, 3)}" for n in sorted(nums)) + f". Orden: {resp}.")]
    return mk(f"Ordena de menor a mayor: {'; '.join(txt)}.", resp, "t3_dec_ordenar", {"nums": txt},
              [(e01 if e01 != resp else None, "E01"), (e02 if e02 != resp else None, "E02"), (e04 if e04 != resp else None, "E04")], pasos,
              "Truco: igualar el número de decimales con ceros (0,5 = 0,500) y comparar como naturales.",
              genericos=[" < ".join(reversed(resp.split(" < "))), " < ".join(sorted(txt))])


@generador("t3_dec_06")
def gen_dec_06(rng, d):
    if d == 1:
        den = rng.choice([10, 100])
        n = rng.randint(1, 9) if den == 10 or rng.random() < 0.5 else rng.randint(11, 99)
        v = F(n, den)
        pasos = [(f"{n}/{den}", D(v), f"Dividir entre {den} es correr la coma {len(str(den)) - 1} lugar{'es' if den > 10 else ''} a la izquierda: {n}/{den} = {D(v)}.")]
        return mk(f"Escribe {n}/{den} como número decimal.", D(v), "t3_dec_fracdec", {"n": n, "d": den},
                  [(D(F(n, 10)) if den == 100 and n < 10 else None, "E01"), (f"{n},{den}", "E02"), (D(v * 10) if den == 100 and n >= 10 else D(v / 10), None), (D(v * 100) if v * 100 != n else None, None)], pasos,
                  "El número de ceros del denominador indica cuántas cifras decimales hay: 7/100 = 0,07.")
    if d == 2:
        nd = rng.choice([1, 2, 2, 3])
        n = rng.randint(1, 10 ** nd - 1)
        if n % 10 == 0:
            n += 1
        e = rng.randint(0, 5)
        v = e + F(n, 10 ** nd)
        num = int(v * 10 ** nd)
        resp = f"{num}/{10 ** nd}"
        pasos = [("cifras decimales", resp, f"{D(v)} tiene {nd} cifra{'s' if nd > 1 else ''} decimal{'es' if nd > 1 else ''}: se quita la coma y se divide entre {10 ** nd}. {D(v)} = {resp}.")]
        return mk(f"Escribe {D(v)} como fracción decimal.", resp, "t3_dec_decfrac", {"v": D(v)},
                  [(f"{num}/{10 ** (nd - 1)}" if nd > 1 else f"{num}/100", "E03"), (f"{num}/{10 ** (nd + 1)}", "E03"), (f"{n}/{10 ** nd}" if e else f"{num}/{10 ** (nd + 2)}", None)], pasos,
                  "Tantos ceros en el denominador como cifras decimales: 0,25 = 25/100, no 25/10.")
    den = rng.choice([100, 1000])
    n = rng.choice([rng.randint(1, 9), rng.randint(101, 9999)])
    if n % 10 == 0:
        n += 3
    v = F(n, den)
    pasos = [(f"{fmt(n)}/{fmt(den)}", D(v), f"Divido entre {fmt(den)}: corro la coma {len(str(den)) - 1} lugares a la izquierda (relleno con ceros si hace falta): {D(v)}.")]
    return mk(f"Escribe {fmt(n)}/{fmt(den)} como número decimal.", D(v), "t3_dec_fracdec", {"n": n, "d": den},
              [(D(F(n, 10)) if n < 10 else D(F(n, den // 10)), "E01"), (f"{n},{den}", "E02"), (D(v / 10), None)], pasos,
              "El denominador 10, 100 o 1000 indica cuántas cifras decimales: 7/1000 = 0,007.")


ORD_NOMBRE = {0: "las unidades", 1: "las décimas", 2: "las centésimas", 3: "las milésimas"}


def _redondeo_casos(rng, d, ordenes, nd_extra=(1, 2)):
    for _ in range(200):
        o = rng.choice(ordenes)
        ext = rng.choice(nd_extra)
        nd = o + ext
        e = rng.randint(0, 99)
        dec = rng.randint(1, 10 ** nd - 1)
        if d == 3:
            # forzar arrastre: cifras 9 en el orden y siguiente ≥ 5
            s = list(str(dec).zfill(nd))
            for i in range(max(0, o - 1), o):
                s[i] = "9"
            if o == 0:
                s[0] = str(rng.randint(5, 9))
                e = rng.choice([9, 19, 29, 99, 49])
            s[o] = str(rng.randint(5, 9))
            dec = int("".join(s))
        v = e + F(dec, 10 ** nd)
        if (v * 10 ** nd).denominator != 1 or dec % 10 == 0:
            continue
        return v, o, nd
    return None


@generador("t3_dec_07")
def gen_dec_07(rng, d):
    r = _redondeo_casos(rng, d, [0, 1] if d == 1 else [0, 1, 2] if d == 2 else [1, 2])
    if not r:
        return None
    v, o, nd = r
    resp = D(redondear(v, o), o)
    sig = int(str(int(v * 10 ** (o + 1)))[-1])
    trunc = D(truncar(v, o), o)
    ult = int(str(int(v * 10 ** nd))[-1])
    e02 = D(truncar(v, o) + (F(1, 10 ** o) if ult >= 5 else 0), o) if nd > o + 1 else None
    e03 = None
    if sig >= 5 and o >= 1:
        t = D(truncar(v, o), o)
        last = int(t[-1])
        if last == 9:
            e03 = t[:-1] + "10"
    e04 = D(redondear(v, o - 1), o - 1) if o >= 1 else D(redondear(v, 1), 1)
    pasos = [("cifra siguiente", str(sig), f"Redondeo a {ORD_NOMBRE[o]}: miro la cifra siguiente, que es {sig}."),
             ("subir o dejar", resp, (f"Como {sig} ≥ 5, sumo 1 a {ORD_NOMBRE[o]}" + (" (y arrastra a los órdenes de la izquierda)" if e03 or (o == 0 and str(int(v))[-1] == '9') else "") if sig >= 5 else f"Como {sig} < 5, se queda igual") + f": {resp}.")]
    return mk(f"Redondea {D(v)} a {ORD_NOMBRE[o]}.", resp, "t3_redondeo", {"v": D(v), "orden": o},
              [(trunc if trunc != resp else None, "E01"), (e02 if e02 and e02 != resp else None, "E02"), (e03, "E03"), (e04, "E04")], pasos,
              "Solo se mira la cifra inmediatamente a la derecha del orden pedido; si es 5 o más se sube, arrastrando si hay nueves.",
              genericos=[D(redondear(v, o) + F(1, 10 ** o), o), D(max(redondear(v, o) - F(1, 10 ** o), 0), o)])


def dec_periodico(x):
    """(texto con arco, anteperiodo, periodo) de un racional positivo."""
    x = F(x)
    ent, r = divmod(x.numerator, x.denominator)
    den = x.denominator
    digs, vistos = [], {}
    while r and r not in vistos:
        vistos[r] = len(digs)
        r *= 10
        digs.append(str(r // den))
        r %= den
    if not r:
        return fmt(ent) + ("," + "".join(digs) if digs else ""), "".join(digs), ""
    i = vistos[r]
    ante, per = "".join(digs[:i]), "".join(digs[i:])
    return fmt(ent) + "," + ante + "".join(c + "̅" for c in per), ante, per


def puntos(x, n=6):
    """0,1666… (expansión con puntos suspensivos)."""
    x = F(x)
    ent, r = divmod(x.numerator, x.denominator)
    s = ""
    for _ in range(n):
        r *= 10
        s += str(r // x.denominator)
        r %= x.denominator
    return fmt(ent) + "," + s + "…"


@generador("t3_dec_08")
def gen_dec_08(rng, d):
    if d == 1:
        n, den = rng.choice([(1, 2), (1, 4), (3, 4), (1, 5), (2, 5), (3, 5), (4, 5), (1, 8), (3, 8), (1, 10), (7, 10), (1, 20), (1, 25), (1, 50)])
        if rng.random() < 0.3:
            n += den * rng.randint(1, 3)
    elif d == 2:
        for _ in range(50):
            den = rng.choice([8, 16, 20, 25, 40, 50]) if False else rng.choice([8, 20, 25, 4, 5])
            n = rng.randint(1, 3 * den)
            if n % den and ndec(F(n, den)) <= 3 and math.gcd(n, den) == 1:
                break
    else:
        for _ in range(50):
            den = rng.choice([3, 6, 7, 9, 11, 12, 15])
            n = rng.randint(1, 2 * den)
            if n % den and math.gcd(n, den) == 1:
                break
    v = F(n, den)
    exacto = es_dec(v, 4)
    resp = D(v) if exacto else D(v, 2)
    enun = f"Escribe {n}/{den} como número decimal." if exacto else f"Escribe {n}/{den} como número decimal redondeado a las centésimas."
    inv = F(den, n)
    e01 = D(inv) if es_dec(inv, 3) else D(inv, 2)
    pasos = [(f"{n} : {den}", resp, f"Una fracción es una división: {n} : {den} = {D(v) if exacto else puntos(v, 4)}" + ("." if exacto else f" ≈ {resp}."))]
    return mk(enun, resp, "t3_frac_a_dec", {"n": n, "d": den},
              [(e01, "E01"), (f"{n},{den}", "E02"), (D(F(den, 10 ** len(str(den)))) if n == 1 else f"0,{n}{den}", "E03" if n == 1 else "E02")], pasos,
              "La raya de fracción significa «dividido entre»: numerador entre denominador. 3/4 no es 3,4 ni 0,4.",
              genericos=[D(v * 10) if exacto else D(v * 10, 2), D(v + F(1, 10)) if exacto else D(v + F(1, 10), 2)])


@generador("t3_dec_09")
def gen_dec_09(rng, d):
    if d == 1:
        a = F(rng.randint(1, 99), 10)
        b = a + F(1, 10)
    elif d == 2:
        a = F(rng.randint(1, 9)) / 10 * 0 + F(rng.randint(0, 9)) + F(rng.randint(0, 9) * 10 + 9, 100)
        b = a + F(1, 100)
        if b.denominator not in (10, 1, 2, 5):
            return None
    else:
        a = F(rng.randint(1, 30)) + F(rng.randint(10, 999), 1000)
        b = a + F(1, 1000)
    m = (a + b) / 2
    e03 = None
    s = D(a)
    if "," in s:
        ult = int(s[-1])
        if ult < 9:
            e03 = s[:-1] + str(ult + 1)
        elif s[-2] not in ",9":
            e03 = s[:-2] + str(int(s[-2]) + 1) + "0"
    fuera = b + (b - a) * rng.choice([2, 5, 10])
    pasos = [("añadir cifras", D(m), f"Añado una cifra decimal a los dos: {D(a, ndec(m))} y {D(b, ndec(m))}. Entre ellos está {D(m)}.")]
    return mk(f"¿Qué número decimal está comprendido entre {D(a)} y {D(b)}?", D(m), "t3_dec_entre", {"a": D(a), "b": D(b)},
              [("No hay ninguno", "E01"), (D(fuera), "E02"), (e03 if e03 and e03 != D(m) else None, "E03"), (D(a - (b - a) / 2), None)], pasos,
              "Entre dos decimales distintos siempre hay otros: basta añadir una cifra decimal (entre 2,3 y 2,4 está 2,35).",
              datos={"opciones_fijas": True})


TIPO_DEC = {"exacto": "Decimal exacto", "puro": "Periódico puro", "mixto": "Periódico mixto", "irr": "Decimal infinito no periódico"}


def tipo_de(x):
    den = F(x).denominator
    while den % 2 == 0:
        den //= 2
    while den % 5 == 0:
        den //= 5
    if den == 1:
        return "exacto"
    d0 = F(x).denominator
    return "puro" if d0 % 2 and d0 % 5 else "mixto"


@generador("t3_dec_10")
def gen_dec_10(rng, d):
    if d in (1, 2):
        for _ in range(100):
            if d == 1:
                den = rng.choice([2, 4, 5, 8, 20, 25, 3, 9, 11, 7, 6, 12, 15, 30])
                n = rng.randint(1, 2 * den)
                if math.gcd(n, den) != 1:
                    continue
                k = 1
            else:
                den = rng.choice([4, 8, 5, 20, 3, 9, 6, 12, 15, 45, 11, 22])
                n = rng.randint(1, den)
                k = rng.choice([3, 3, 7, 9, 11, 6])
                if math.gcd(n, den) != 1:
                    continue
            N, Dn = n * k, den * k
            if Dn > 100:
                continue
            break
        else:
            return None
        v = F(N, Dn)
        t = tipo_de(v)
        t_mal = tipo_de(F(1, Dn)) if k > 1 else None  # clasificar por el denominador sin simplificar
        dist = []
        if t_mal and t_mal != t:
            dist.append((TIPO_DEC[t_mal], "E01"))
        if t == "exacto" and ndec(v) >= 3:
            dist.append((TIPO_DEC["puro"], "E03"))
        dist += [(TIPO_DEC[x], None) for x in ("exacto", "puro", "mixto", "irr") if x != t]
        red = v.denominator
        pasos = [("simplificar", fr(v), f"Simplifico: {N}/{Dn} = {fr(v)}." if k > 1 else f"{fr(v)} ya es irreducible."),
                 ("factores del denominador", str(red), f"Factorizo el denominador {red}: " + ("solo tiene 2 y/o 5 → exacto." if t == "exacto" else "no tiene 2 ni 5 → periódico puro." if t == "puro" else "tiene 2 o 5 y otros primos → periódico mixto.")),
                 ("comprobar", dec_periodico(v)[0], f"En efecto, {fr(v)} = {puntos(v) if t != 'exacto' else D(v)}.")]
        return mk(f"¿Qué tipo de expresión decimal tiene la fracción {N}/{Dn}?", TIPO_DEC[t], "t3_tipo_dec", {"n": N, "d": Dn}, dist, pasos,
                  "Se mira el denominador de la fracción IRREDUCIBLE: solo 2 y 5 → exacto; sin 2 ni 5 → periódico puro; mezcla → periódico mixto.",
                  datos={"opciones_fijas": True})
    for _ in range(100):
        den = rng.choice([6, 12, 15, 30, 18, 36, 45, 22, 44, 55, 60, 90, 24, 75])
        n = rng.randint(1, den - 1)
        if math.gcd(n, den) != 1:
            continue
        txt, ante, per = dec_periodico(F(n, den))
        if ante and per and len(per) <= 2 and ante != per:
            break
    else:
        return None
    if rng.random() < 0.5:
        pasos = [("dividir", puntos(F(n, den), 7), f"{n} : {den} = {puntos(F(n, den), 7)}"),
                 ("periodo", per, f"Las cifras que se repiten siempre son el periodo: {per}. Las de antes ({ante}) son el anteperiodo.")]
        return mk(f"¿Cuál es el periodo de la expresión decimal de {n}/{den}?", per, "t3_periodo", {"n": n, "d": den, "pide": "periodo"},
                  [(ante + per, "E02"), (ante, "E02"), (per[::-1] if len(per) > 1 and per[::-1] != per else per + per[0], None)], pasos,
                  "Anteperiodo: cifras decimales que no se repiten. Periodo: el bloque que se repite indefinidamente.",
                  genericos=[str((int(per) + 1) % 10), ante + "0"])
    pasos = [("dividir", puntos(F(n, den), 7), f"{n} : {den} = {puntos(F(n, den), 7)}"),
             ("anteperiodo", ante, f"El periodo es {per}; lo que hay entre la coma y el periodo es el anteperiodo: {ante}.")]
    return mk(f"¿Cuál es el anteperiodo de la expresión decimal de {n}/{den}?", ante, "t3_periodo", {"n": n, "d": den, "pide": "anteperiodo"},
              [(per, "E02"), (ante + per, "E02"), (str(n // den) if str(n // den) != ante else "0" + ante, None)], pasos,
              "Anteperiodo: cifras decimales que no se repiten. Periodo: el bloque que se repite indefinidamente.",
              genericos=[str((int(ante) + 1)), ante + "0"])


@generador("t3_dec_11")
def gen_dec_11(rng, d):
    for _ in range(100):
        I = rng.choice([0, 0, rng.randint(1, 5)])
        if d == 1:
            nd = rng.randint(1, 3)
            dec = rng.randint(1, 10 ** nd - 1)
            if dec % 10 == 0:
                continue
            v = I + F(dec, 10 ** nd)
            txt = D(v)
            resp = fr(v)
            pasos = [("quitar la coma", f"{int(v * 10 ** nd)}/{10 ** nd}", f"{txt} tiene {nd} decimal{'es' if nd > 1 else ''}: {txt} = {int(v * 10 ** nd)}/{10 ** nd}."),
                     ("simplificar", resp, f"Simplifico: {resp}.")]
            dist = [(fr(F(int(v * 10 ** nd), 10 ** (nd - 1))) if nd > 1 else fr(F(int(v * 10), 100)), None), (fr(F(dec, 10 ** nd)) if I else fr(F(dec, 10 ** (nd + 1))), "E04" if I else None),
                    (fr(F(int(v * 10 ** nd), 9 * 10 ** (nd - 1))), None)]
            adulto = "Un decimal exacto es una fracción decimal: se quita la coma, se divide entre 10, 100… y se simplifica."
            break
        per_len = rng.randint(1, 2)
        per = rng.randint(1, 10 ** per_len - 2)
        if per_len == 2 and (per < 10 or per % 11 == 0):
            continue
        if d == 2:
            v = I + F(per, 10 ** per_len - 1)
            nueves = "9" * per_len
            txt = dec_periodico(v)[0]
            if dec_periodico(v)[2] != str(per).zfill(per_len):
                continue
            resp = fr(v)
            pasos = [("regla práctica", f"{I * (10 ** per_len - 1) + per}/{nueves}" if I else f"{per}/{nueves}",
                      f"Periódico puro: numerador = número sin coma menos la parte entera ({int(str(I) + str(per).zfill(per_len))} − {I}); denominador = tantos 9 como cifras tiene el periodo ({nueves})."),
                     ("simplificar", resp, f"Simplifico: {resp}.")]
            dist = [(fr(I + F(per, 10 ** per_len)), "E01"), (fr(F(per, 10 ** per_len - 1)) if I else fr(F(per, 10 ** per_len - 1) + 1), "E04" if I else None),
                    (fr(I + F(per, 10 ** per_len + 1)), None)]
            adulto = "0,333… = 3/9 = 1/3: el periodo va sobre tantos nueves como cifras tenga. Ojo con la parte entera."
        else:
            a_len = rng.randint(1, 2)
            ante = rng.randint(0, 10 ** a_len - 1)
            v = I + (F(ante) + F(per, 10 ** per_len - 1)) / 10 ** a_len
            t, a_, p_ = dec_periodico(v)
            if a_ != str(ante).zfill(a_len) or p_ != str(per).zfill(per_len):
                continue
            txt = t
            todo = int(str(I) + a_ + p_)
            sinp = int(str(I) + a_)
            den = int("9" * per_len + "0" * a_len)
            resp = fr(v)
            pasos = [("regla práctica", f"({todo} − {sinp})/{den}", f"Periódico mixto: numerador = número sin coma ({todo}) menos la parte no periódica ({sinp}); denominador = un 9 por cifra del periodo y un 0 por cifra del anteperiodo ({den})."),
                     ("simplificar", resp, f"({todo} − {sinp})/{den} = {todo - sinp}/{den} = {resp}.")]
            dist = [(fr(F(todo, den)), "E02"), (fr(F(todo - sinp, int("9" * (per_len + a_len)))), "E03"), (fr(F(todo - sinp, 10 ** (per_len + a_len))), "E01"),
                    (fr(v - I) if I else None, "E04")]
            adulto = "En el mixto hay que restar la parte no periódica y poner nueves (periodo) seguidos de ceros (anteperiodo)."
        break
    else:
        return None
    dist = [(x, k) for x, k in dist if x != resp]
    return mk(f"Halla la fracción generatriz (irreducible) de {txt}" + (f" = {puntos(v)}" if d > 1 else "."), resp, "t3_generatriz", {"v": txt}, dist, pasos, adulto,
              genericos=[fr(v + 1), fr(v * 2), fr(v + F(1, 9))])


# ---------------------------------------------------------------- FRACCIONES (numeración)

DEN_NOMBRE = {2: ("medio", "medios"), 3: ("tercio", "tercios"), 4: ("cuarto", "cuartos"), 5: ("quinto", "quintos"), 6: ("sexto", "sextos"),
              7: ("séptimo", "séptimos"), 8: ("octavo", "octavos"), 9: ("noveno", "novenos"), 10: ("décimo", "décimos"),
              11: ("onceavo", "onceavos"), 12: ("doceavo", "doceavos")}


def frac_palabras(n, d):
    s, p = DEN_NOMBRE[d]
    return f"un {s}" if n == 1 else f"{letras(n)} {p}"


@generador("t3_frac_03")
def gen_frac_03(rng, d):
    den = rng.randint(2, 5) if d == 1 else rng.randint(2, 10) if d == 2 else rng.randint(7, 12)
    n = rng.randint(1, den - 1)
    if n == den - n and d > 1 and rng.random() < 0.5:
        n = max(1, n - 1)
    if rng.random() < 0.5:
        pasos = [("leer", f"{n}/{den}", f"«{frac_palabras(n, den)}»: el número ({n}) va arriba y el nombre de las partes ({DEN_NOMBRE[den][1]} = {den}) va abajo: {n}/{den}.")]
        return mk(f"Escribe con cifras: {frac_palabras(n, den)}.", f"{n}/{den}", "t3_frac_leer", {"n": n, "d": den, "sentido": "a_cifras"},
                  [(f"{den}/{n}", "E03"), (f"{n}/{den + 1 if den < 12 else den - 1}", "E02"), (f"{n}/{den - 1}" if den > 2 else f"{n + 1}/{den + 1}", None)], pasos,
                  "El numerador cuenta las partes que se toman; el denominador da el nombre (quintos, octavos…).",
                  genericos=[f"{den - n}/{den}", f"{n + 1}/{den}"])
    vecino = den + 1 if den < 12 else den - 1
    if den in (11, 12):
        e04 = f"{letras(n)} {'onces' if den == 11 else 'doces'}" if n > 1 else f"un {'once' if den == 11 else 'doce'}"
    else:
        e04 = None
    pasos = [("leer", frac_palabras(n, den), f"El denominador {den} se lee «{DEN_NOMBRE[den][1]}»: {n}/{den} se lee {frac_palabras(n, den)}.")]
    return mk(f"¿Cómo se lee la fracción {n}/{den}?", frac_palabras(n, den), "t3_frac_leer", {"n": n, "d": den, "sentido": "a_palabras"},
              [(f"{letras(n)} {letras(den)}" if n > 1 else f"uno {letras(den)}", "E01"), (frac_palabras(n, vecino), "E02"), (e04, "E04"), (frac_palabras(den - n, den) if den - n != n else None, None)], pasos,
              genericos=[f"{letras(n)} de {letras(den)}", frac_palabras(n, den + 2) if den < 11 else frac_palabras(n, den - 2)],
              adulto="Medios, tercios, cuartos… y a partir de 11 se añade «-avos»: onceavos, doceavos.")


@generador("t3_frac_04")
def gen_frac_04(rng, d):
    den = rng.randint(3, 12)
    if d < 3:
        a, b = rng.sample(range(1, den), 2)
        if d == 1:
            pasos = [("mismo denominador", fr_raw(max(a, b), den), f"Las dos tienen partes del mismo tamaño ({DEN_NOMBRE.get(den, ('', 'partes'))[1]}); es mayor la que coge más partes: {fr_raw(max(a, b), den)}.")]
            return mk(f"¿Qué fracción es mayor: {a}/{den} o {b}/{den}?", fr_raw(max(a, b), den), "t3_frac_comp_hom", {"a": a, "b": b, "d": den},
                      [(fr_raw(min(a, b), den), "E01"), ("Son iguales", "E02"), ("No se puede saber", None)], pasos,
                      "Con el mismo denominador, es mayor la fracción de mayor numerador.", datos={"opciones_fijas": True})
        sig = "<" if a < b else ">"
        pasos = [("comparar numeradores", sig, f"Mismo denominador: comparo numeradores, {a} {sig} {b}, así que {a}/{den} {sig} {b}/{den}.")]
        return mk(f"¿Qué signo va en el hueco? {a}/{den} ☐ {b}/{den}", sig, "t3_frac_comp_hom", {"a": a, "b": b, "d": den},
                  [(">" if sig == "<" else "<", "E01"), ("=", "E02"), ("No se pueden comparar", None)], pasos,
                  "Con el mismo denominador, es mayor la fracción de mayor numerador.", datos={"opciones_fijas": True})
    if den < 5:
        den = rng.randint(5, 12)
    nums = rng.sample(range(1, den), 4)
    txt = [f"{x}/{den}" for x in nums]
    resp = " < ".join(f"{x}/{den}" for x in sorted(nums))
    e03 = " < ".join(f"{x}/{den}" for x in sorted(nums, reverse=True))
    otro = sorted(nums)
    otro[1], otro[2] = otro[2], otro[1]
    otro2 = sorted(nums)
    otro2[0], otro2[1] = otro2[1], otro2[0]
    pasos = [("ordenar numeradores", resp, f"Todas son {DEN_NOMBRE[den][1]}: las ordeno por el numerador, de menor a mayor: {resp}.")]
    return mk(f"Ordena de menor a mayor: {', '.join(txt)}.", resp, "t3_frac_ord_hom", {"nums": nums, "d": den},
              [(e03, "E03"), (" < ".join(f"{x}/{den}" for x in otro), None), (" < ".join(f"{x}/{den}" for x in otro2), None)], pasos,
              "Mismo denominador: el orden de las fracciones es el de sus numeradores.")


@generador("t3_frac_05")
def gen_frac_05(rng, d):
    n = rng.randint(2, 5) if d == 1 else rng.randint(2, 10)
    k = rng.randint(2, 10 if d == 1 else 10) if d < 3 else rng.randint(5, 100 // n)
    N = n * k
    if N > 100:
        return None
    nombres = {2: "la mitad", 3: "la tercera parte", 4: "la cuarta parte", 5: "la quinta parte"}
    enun = f"¿Cuánto es 1/{n} de {N}?" if (d > 1 or rng.random() < 0.5 or n not in nombres) else f"¿Cuánto es {nombres[n]} de {N}?"
    otro = 2 if n != 2 else 4
    pasos = [(f"{N} : {n}", str(k), f"1/{n} de {N} es repartir {N} en {n} partes iguales y coger una: {N} : {n} = {k}.")]
    return mk(enun, str(k), "frac_de", {"n": 1, "d": n, "N": N},
              [(fmt(N * n), "E01"), (str(N - n), "E02"), (str(N // otro) if N % otro == 0 and N // otro != k else None, "E03")], pasos,
              "La fracción unitaria de un número se calcula dividiendo entre el denominador.",
              genericos=[str(k + 1), str(k - 1) if k > 1 else str(k + 2), str(k * 2)])


@generador("t3_frac_06")
def gen_frac_06(rng, d):
    den = rng.randint(3, 5) if d == 1 else rng.randint(3, 10) if d == 2 else rng.randint(6, 12)
    m = rng.randint(2, den - 1)
    if math.gcd(m, den) != 1 and d < 3:
        m = 1 + (m % (den - 1)) if math.gcd(1 + (m % (den - 1)), den) == 1 and 1 + (m % (den - 1)) > 1 else m
    maxN = 100 if d == 1 else 500 if d == 2 else 1000
    k = rng.randint(2, maxN // den)
    N = den * k
    r = m * k
    pasos = [(f"{N} : {den}", str(k), f"Divido {N} entre el denominador: {N} : {den} = {k} (una parte)."),
             (f"{k} × {m}", fmt(r), f"Multiplico por el numerador: {k} × {m} = {fmt(r)}.")]
    return mk(f"¿Cuánto es {m}/{den} de {fmt(N)}?", fmt(r), "frac_de", {"n": m, "d": den, "N": N},
              [(fmt(k), "E01"), (fmt(N * m), "E02"), (fmt(N // m * den) if N % m == 0 and N // m * den != r else None, "E03"), (fmt(N - r), "E04")], pasos,
              "m/n de N: se divide entre el denominador y se multiplica por el numerador.",
              genericos=[fmt(r + k), fmt(r - k)])


@generador("t3_frac_07")
def gen_frac_07(rng, d):
    OPC = {"p": "Menor que la unidad", "u": "Igual a la unidad", "i": "Mayor que la unidad", "x": "No existe: está mal escrita"}
    den = rng.randint(2, 12)
    t = rng.choice(["p", "u", "i"] if d == 1 else ["p", "i", "i", "u"])
    if t == "p":
        n = rng.randint(1, den - 1) if d == 1 else rng.randint(max(1, den // 3), den - 1)
        if d > 1 and den < 7:
            den = rng.randint(7, 12)
            n = rng.randint(1, 4)
    elif t == "u":
        n = den
    else:
        n = rng.randint(den + 1, 2 * den + 3) if d < 3 else rng.randint(den + 1, den + 3)
    if d == 3:
        den = rng.randint(5, 12)
        t = rng.choice(["p", "u", "i"])
        n = {"p": den - 1, "u": den, "i": den + 1}[t]
    dist = []
    if t == "p":
        dist = [(OPC["i"], "E01" if den >= 6 else None), (OPC["u"], None), (OPC["x"], None)]
        pasos = [("comparar", OPC["p"], f"El numerador ({n}) es menor que el denominador ({den}): se cogen menos partes de las que tiene la unidad. Es menor que 1.")]
    elif t == "u":
        dist = [(OPC["p"], "E02"), (OPC["i"], "E02"), (OPC["x"], None)]
        pasos = [("comparar", OPC["u"], f"Numerador y denominador son iguales ({n}): se cogen todas las partes, la unidad entera. {n}/{den} = 1.")]
    else:
        dist = [(OPC["x"], "E03"), (OPC["p"], None), (OPC["u"], None)]
        pasos = [("comparar", OPC["i"], f"El numerador ({n}) es mayor que el denominador ({den}): hace falta más de una unidad. Es mayor que 1.")]
    return mk(f"La fracción {n}/{den}, ¿es menor, igual o mayor que la unidad?", OPC[t], "t3_frac_unidad", {"n": n, "d": den}, dist, pasos,
              "Se compara el numerador con el denominador: menor → propia (< 1); igual → 1; mayor → impropia (> 1).",
              datos={"opciones_fijas": True})


@generador("t3_frac_08")
def gen_frac_08(rng, d):
    den = rng.randint(2, 6) if d == 1 else rng.randint(3, 12)
    e = rng.randint(1, 4) if d == 1 else rng.randint(1, 10)
    r = rng.randint(1, den - 1)
    N = e * den + r
    if d == 1 or (d == 2 and rng.random() < 0.5):
        resp = f"{e} {r}/{den}"
        pasos = [(f"{N} : {den}", f"{e} resto {r}", f"Divido {N} entre {den}: cociente {e}, resto {r}."),
                 ("mixto", resp, f"El cociente son los enteros y el resto el numerador: {resp}.")]
        return mk(f"Escribe {N}/{den} como número mixto.", resp, "t3_frac_mixto", {"N": N, "d": den, "sentido": "a_mixto"},
                  [(f"{r} {e}/{den}" if e < den and r != e else f"{e} {den}/{r}", "E03"), (f"{e} {den}/{r}" if den != r else f"{e + 1} {r}/{den}", "E03"),
                   (f"{e + 1} {r}/{den}", None), (f"{e} {r + 1}/{den}" if r + 1 < den else f"{e} {r - 1}/{den}" if r > 1 else f"{e - 1} {r}/{den}" if e > 1 else None, None)], pasos,
                  "Impropia → mixto: se divide el numerador entre el denominador; cociente = enteros, resto = nuevo numerador.")
    pasos = [(f"{e} · {den} + {r}", str(N), f"Multiplico el entero por el denominador y sumo el numerador: {e} · {den} + {r} = {N}."),
             ("impropia", f"{N}/{den}", f"Se mantiene el denominador: {N}/{den}.")]
    return mk(f"Escribe {e} {r}/{den} como fracción impropia.", f"{N}/{den}", "t3_frac_mixto", {"e": e, "r": r, "d": den, "sentido": "a_impropia"},
              [(f"{e + r}/{den}", "E01"), (f"{e * den}/{den}", "E02"), (f"{e}{r}/{den}" if int(f'{e}{r}') != N else None, "E04"), (f"{e * r + den}/{den}" if e * r + den != N else None, None)], pasos,
              "Mixto → impropia: entero × denominador + numerador, sobre el mismo denominador (2 3/4 = 11/4).",
              genericos=[f"{N}/{den * e}", f"{N + 1}/{den}"])


@generador("t3_frac_09")
def gen_frac_09(rng, d):
    for _ in range(100):
        a, b = rng.randint(1, 9), rng.randint(2, 12)
        if a >= b or math.gcd(a, b) != 1:
            continue
        k = rng.randint(2, 8 if d < 3 else 12)
        if a * k > 100 or b * k > 100:
            continue
        break
    if d == 1:
        # amplificar: a/b = ?/(b·k)
        pasos = [(f"{b} × {k} = {b * k}", str(k), f"El denominador pasa de {b} a {b * k}: se ha multiplicado por {k}."),
                 (f"{a} × {k}", str(a * k), f"Hago lo mismo arriba: {a} × {k} = {a * k}.")]
        return mk(f"Completa para que sean equivalentes: {a}/{b} = ?/{b * k}", str(a * k), "t3_frac_equiv", {"a": a, "b": b, "k": k, "tipo": "amplificar"},
                  [(str(a + b * k - b), "E03"), (str(a), "E02"), (str(b * k - a) if b * k - a != a * k else None, None)], pasos,
                  "Dos fracciones son equivalentes si se multiplica (o divide) numerador y denominador por el MISMO número.",
                  genericos=[str(a * k + 1), str(a * k - 1), str(a + k)])
    if d == 2:
        # simplificar: (a·k)/(b·k) = ?/b
        pasos = [(f"{b * k} : {k} = {b}", str(k), f"El denominador pasa de {b * k} a {b}: se ha dividido entre {k}."),
                 (f"{a * k} : {k}", str(a), f"Divido también el numerador: {a * k} : {k} = {a}.")]
        return mk(f"Completa para que sean equivalentes: {a * k}/{b * k} = ?/{b}", str(a), "t3_frac_equiv", {"a": a * k, "b": b * k, "k": k, "tipo": "simplificar"},
                  [(str(a * k - (b * k - b)) if a * k - (b * k - b) > 0 else None, "E03"), (str(a * k), "E02"), (str(b - a) if b - a != a else None, None)], pasos,
                  "Simplificar: dividir numerador y denominador entre el mismo número.",
                  genericos=[str(a + 1), str(a + k), str(max(a - 1, 1) if a > 1 else a + 2)])
    pasos = [(f"× {k}", f"{a * k}/{b * k}", f"Multiplico numerador y denominador por {k}: {a}/{b} = {a * k}/{b * k}.")]
    return mk(f"¿Cuál de estas fracciones es equivalente a {a}/{b}?", f"{a * k}/{b * k}", "t3_frac_equiv", {"a": a, "b": b, "k": k, "tipo": "elegir"},
              [(f"{a + k}/{b + k}", "E01"), (f"{a * k}/{b}", "E02"), (f"{a}/{b * k}", "E02")], pasos,
              "Sumar lo mismo arriba y abajo NO da una fracción equivalente; multiplicar sí.", datos={"opciones_fijas": True})


@generador("t3_frac_11")
def gen_frac_11(rng, d):
    n = 1 if d == 1 else rng.randint(2, 9)
    if d < 3:
        a, b = rng.sample([x for x in range(2, 13) if x > n], 2)
        mayor = min(a, b)
        pasos = [("mismo numerador", f"{n}/{mayor}", f"Las dos cogen {n} parte{'s' if n > 1 else ''}; los {DEN_NOMBRE[mayor][1]} son más grandes que los {DEN_NOMBRE[max(a, b)][1]} (el entero se parte en menos trozos). Es mayor {n}/{mayor}.")]
        return mk(f"¿Qué fracción es mayor: {n}/{a} o {n}/{b}?", f"{n}/{mayor}", "t3_frac_comp_num", {"n": n, "a": a, "b": b},
                  [(f"{n}/{max(a, b)}", "E01"), ("Son iguales", "E02"), ("No se puede saber", None)], pasos,
                  "Con el mismo numerador, es mayor la de MENOR denominador: sus partes son más grandes.", datos={"opciones_fijas": True})
    dens = rng.sample([x for x in range(2, 13) if x > n], 3)
    txt = [f"{n}/{x}" for x in dens]
    resp = " > ".join(f"{n}/{x}" for x in sorted(dens))
    mal = " > ".join(f"{n}/{x}" for x in sorted(dens, reverse=True))
    o = sorted(dens)
    o[0], o[1] = o[1], o[0]
    o2 = sorted(dens)
    o2[1], o2[2] = o2[2], o2[1]
    pasos = [("mismo numerador", resp, f"Mismo numerador: cuanto menor es el denominador, mayor es la fracción. De mayor a menor: {resp}.")]
    return mk(f"Ordena de mayor a menor: {', '.join(txt)}.", resp, "t3_frac_ord_num", {"n": n, "dens": dens},
              [(mal, "E01"), (" > ".join(f"{n}/{x}" for x in o), None), (" > ".join(f"{n}/{x}" for x in o2), None)], pasos,
              "Con el mismo numerador, la fracción es mayor cuanto menor es el denominador.")


@generador("t3_frac_12")
def gen_frac_12(rng, d):
    for _ in range(200):
        k = 2 if d < 3 else 3
        dens = rng.sample(range(2, 21 if d > 1 else 13), k)
        if d == 1:
            b = rng.randint(2, 6)
            dens = [b, b * rng.randint(2, 4)]
        m = math.lcm(*dens)
        if m > 120 or m == max(dens) and d == 2 or math.prod(dens) == m and d > 1:
            continue
        nums = [rng.randint(1, x - 1) for x in dens]
        if any(math.gcd(n, x) != 1 for n, x in zip(nums, dens)):
            continue
        break
    else:
        return None
    fs = [f"{n}/{x}" for n, x in zip(nums, dens)]
    resp = ", ".join(f"{n * m // x}/{m}" for n, x in zip(nums, dens))
    e01 = ", ".join(f"{n}/{m}" for n, x in zip(nums, dens))
    e02 = ", ".join(f"{n + m - x}/{m}" for n, x in zip(nums, dens))
    e04 = ", ".join(f"{n * m}/{m}" for n, x in zip(nums, dens))
    P = math.prod(dens)
    prod = ", ".join(f"{n * P // x}/{P}" for n, x in zip(nums, dens)) if P != m else None
    pasos = [("mcm", str(m), f"mcm({', '.join(map(str, dens))}) = {m}: será el denominador común."),
             ("amplificar", resp, "Cada numerador se multiplica por lo mismo que su denominador: " + "; ".join(f"{n}/{x} = {n}·{m // x}/{x}·{m // x} = {n * m // x}/{m}" for n, x in zip(nums, dens)) + ".")]
    return mk(f"Reduce a mínimo común denominador: {', '.join(fs)}.", resp, "t3_comun_den", {"fracs": fs},
              [(e01, "E01"), (e02, "E02"), (e04, "E04"), (prod, None)], pasos,
              "Denominador común = mcm; cada numerador se multiplica por el mismo número que su denominador.")


def orden_txt(fs, key, sep=" < "):
    return sep.join(fr_raw(f[0], f[1]) if isinstance(f, tuple) else f for f in sorted(fs, key=key))


@generador("t3_frac_13")
def gen_frac_13(rng, d):
    if d < 3:
        for _ in range(200):
            a = (rng.randint(1, 15), rng.randint(2, 20 if d > 1 else 10))
            b = (rng.randint(1, 15), rng.randint(2, 20 if d > 1 else 10))
            fa, fb = F(*a), F(*b)
            if fa == fb or a[1] == b[1] or a[0] == b[0] or (d == 1 and (fa > 1 or fb > 1)):
                continue
            if math.gcd(*a) != 1 or math.gcd(*b) != 1:
                continue
            may, men = (a, b) if fa > fb else (b, a)
            # queremos trampas: el menor tiene numerador o denominador "engañoso"
            if not (men[0] > may[0] or men[1] < may[1]):
                continue
            break
        else:
            return None
        key = "E01" if men[0] > may[0] else "E02"
        m = math.lcm(a[1], b[1])
        pasos = [("denominador común", str(m), f"Paso a denominador {m}: {a[0]}/{a[1]} = {a[0] * m // a[1]}/{m} y {b[0]}/{b[1]} = {b[0] * m // b[1]}/{m}."),
                 ("comparar", f"{may[0]}/{may[1]}", f"Es mayor la de mayor numerador: {may[0]}/{may[1]}.")]
        return mk(f"¿Qué fracción es mayor: {a[0]}/{a[1]} o {b[0]}/{b[1]}?", f"{may[0]}/{may[1]}", "t3_frac_comp", {"a": fr_raw(*a), "b": fr_raw(*b)},
                  [(f"{men[0]}/{men[1]}", key), ("Son iguales", "E03" if may[1] - may[0] == men[1] - men[0] else None), ("No se pueden comparar", None)], pasos,
                  "Se comparan reduciendo a común denominador, por productos cruzados o pasando a decimal; mirar solo numeradores o denominadores engaña.",
                  datos={"opciones_fijas": True})
    for _ in range(200):
        fs = []
        while len(fs) < 4:
            den = rng.randint(2, 12)
            n = rng.randint(1, den + 3)
            if math.gcd(n, den) == 1 and F(n, den) not in [F(*x) for x in fs] and n != den:
                fs.append((n, den))
        break
    resp = orden_txt(fs, lambda f: F(*f))
    e01 = orden_txt(fs, lambda f: (f[0], f[1]))
    e02 = orden_txt(fs, lambda f: (-f[1], f[0]))
    e03 = orden_txt(fs, lambda f: (-(f[1] - f[0]), f[0]))
    txt = ", ".join(fr_raw(*f) for f in fs)
    m = math.lcm(*[f[1] for f in fs])
    pasos = [("denominador común", str(m), f"Reduzco a denominador común {m}: " + ", ".join(f"{fr_raw(*f)} = {f[0] * m // f[1]}/{m}" for f in fs) + "."),
             ("ordenar", resp, f"Ordeno por los numeradores: {resp}.")]
    return mk(f"Ordena de menor a mayor: {txt}.", resp, "t3_frac_ord", {"fracs": [fr_raw(*f) for f in fs]},
              [(e01 if e01 != resp else None, "E01"), (e02 if e02 != resp else None, "E02"), (e03 if e03 != resp else None, "E03")], pasos,
              "Para ordenar fracciones cualesquiera, lo más seguro es pasarlas a común denominador (o a decimal).",
              genericos=[" < ".join(reversed(resp.split(" < ")))])


def factor_pequeno(n):
    for p in (2, 3, 5, 7, 11, 13):
        if n % p == 0:
            return p
    return None


@generador("t3_frac_14")
def gen_frac_14(rng, d):
    for _ in range(200):
        a, b = rng.randint(1, 12), rng.randint(2, 15)
        if a >= b and rng.random() < 0.7 or math.gcd(a, b) != 1 or a == b:
            continue
        g = rng.choice([4, 6, 8, 9, 12] if d == 1 else [12, 18, 20, 24, 30, 36] if d == 2 else [24, 36, 45, 48, 60, 72, 84])
        N, Dn = a * g, b * g
        if max(N, Dn) > (100 if d == 1 else 300 if d == 2 else 1000):
            continue
        break
    else:
        return None
    p = factor_pequeno(g)
    e01 = fr_raw(N // p, Dn // p)
    e03 = None
    for p1, p2 in ((2, 3), (3, 2), (2, 5), (5, 2)):
        if N % p1 == 0 and Dn % p2 == 0 and F(N // p1, Dn // p2) != F(a, b):
            e03 = fr(F(N // p1, Dn // p2))
            break
    e02 = None
    sN, sD = str(N), str(Dn)
    comunes = set(sN) & set(sD)
    for c in comunes:
        n2, d2 = sN.replace(c, "", 1), sD.replace(c, "", 1)
        if n2 and d2 and int(d2) > 0 and F(int(n2), int(d2)) != F(a, b):
            e02 = f"{int(n2)}/{int(d2)}"
            break
    pasos = [("mcd", str(g), f"mcd({N}, {Dn}) = {g}."),
             ("dividir", fr_raw(a, b), f"Divido numerador y denominador entre {g}: {N} : {g} = {a} y {Dn} : {g} = {b}. La fracción irreducible es {a}/{b}.")]
    return mk(f"Simplifica hasta la fracción irreducible: {N}/{Dn}", fr_raw(a, b), "t3_irreducible", {"N": N, "D": Dn},
              [(e01, "E01"), (e02, "E02"), (e03, "E03")], pasos,
              "Dividiendo entre el mcd se llega en un solo paso a la irreducible. Hay que dividir arriba y abajo por el MISMO número.",
              genericos=[fr_raw(b, a), fr_raw(a + 1, b), fr_raw(a, b + 1)])


@generador("t3_frac_15")
def gen_frac_15(rng, d):
    for _ in range(100):
        den = rng.randint(2, 6) if d == 1 else rng.randint(3, 12)
        m = rng.randint(1 if d == 1 else 2, den - 1)
        if math.gcd(m, den) != 1:
            continue
        k = rng.randint(2, 15 if d < 3 else 25)
        total = den * k
        parte = m * k
        break
    if d == 3 and rng.random() < 0.5:
        resto = total - parte
        pasos = [(f"{parte} : {m}", str(k), f"Si {m}/{den} son {parte}, 1/{den} es {parte} : {m} = {k}."),
                 (f"{k} × {den - m}", str(resto), f"Lo que queda son {den - m}/{den}: {k} × {den - m} = {resto}.")]
        return mk(f"Los {m}/{den} de una cantidad son {parte}. ¿Cuánto es lo que queda (el resto de la cantidad)?", str(resto), "t3_frac_total", {"m": m, "d": den, "parte": parte, "pide": "resto"},
                  [(str(total), None), (str(parte * (den - m) // den) if parte * (den - m) % den == 0 and parte * (den - m) // den != resto else None, "E01"),
                   (str(k), "E03"), (str(abs(total - parte - k)) if total - parte - k > 0 else None, None)], pasos,
                  "Primero se halla la parte unitaria (dividiendo entre el numerador) y después lo que se pide.",
                  genericos=[str(resto + k), str(resto * 2)])
    unidad = f"los {m}/{den}" if m > 1 else f"1/{den}"
    pasos = [(f"{parte} : {m}", str(k), f"Si {unidad} son {parte}, cada 1/{den} es {parte} : {m} = {k}." if m > 1 else f"1/{den} es {parte}."),
             (f"{k} × {den}", str(total), f"El total son {den}/{den}: {k} × {den} = {total}.")]
    e01 = F(parte * m, den)
    return mk(f"{'Los ' + str(m) + '/' + str(den) + ' de un número son' if m > 1 else '1/' + str(den) + ' de un número es'} {parte}. ¿Cuál es el número?", str(total), "t3_frac_total",
              {"m": m, "d": den, "parte": parte, "pide": "total"},
              [(fr(e01) if e01.denominator == 1 else None, "E01"), (fr(F(parte, den) * m) if (F(parte, den) * m).denominator == 1 else None, "E02"), (str(k) if m > 1 else None, "E03"),
               (str(parte + den), None)], pasos,
              "Problema inverso: se divide la parte entre el numerador y se multiplica por el denominador.",
              genericos=[str(total + k), str(total - k), str(parte * den)])


@generador("t3_frac_16")
def gen_frac_16(rng, d):
    for _ in range(100):
        a, b = rng.randint(1, 11), rng.randint(2, 20)
        if math.gcd(a, b) == 1 and a != b:
            break
    if d == 1:
        opcs = [(f"{a}/(−{b})", None), (f"{a}/{b}", "E03"), (f"(−{a})/(−{b})", "E03"), (f"−{b}/{a}", None)]
        pasos = [("signo", f"{a}/(−{b})", f"El signo menos puede ir delante, en el numerador o en el denominador: −{a}/{b} = (−{a})/{b} = {a}/(−{b}). En cambio (−{a})/(−{b}) es positiva.")]
        return mk(f"¿Qué fracción es igual a −{a}/{b}?", opcs[0][0], "t3_racional_signo", {"a": a, "b": b}, opcs[1:], pasos,
                  "Un solo signo menos (esté arriba, abajo o delante) hace la fracción negativa; dos signos menos se anulan.",
                  datos={"opciones_fijas": True})
    if d == 2 and rng.random() < 0.5:
        k = rng.randint(2, 6)
        N, Dn = a * k, b * k
        signo = rng.choice(["num", "den", "delante"])
        txt = f"(−{N})/{Dn}" if signo == "num" else f"{N}/(−{Dn})" if signo == "den" else f"−{N}/{Dn}"
        pasos = [("mcd", str(k), f"mcd({N}, {Dn}) = {k}. Divido los dos términos entre {k} y mantengo el signo (uno solo, negativo): −{a}/{b}.")]
        return mk(f"Simplifica: {txt}", f"−{a}/{b}", "t3_racional_simpl", {"expr": txt},
                  [(f"{a}/{b}", "E02"), (f"−{b}/{a}", None), (f"−{N // factor_pequeno(k)}/{Dn // factor_pequeno(k)}" if factor_pequeno(k) != k else f"−{a}/{b + 1}", None)], pasos,
                  "Al simplificar solo cambian los valores absolutos; el signo de la fracción se mantiene.")
    for _ in range(100):
        fs = []
        while len(fs) < (2 if d == 2 else 4):
            den = rng.randint(2, 12)
            n = rng.randint(1, den + 2)
            sg = -1 if (rng.random() < 0.75 or not fs) else 1
            f_ = F(sg * n, den)
            if math.gcd(n, den) == 1 and f_ not in fs and n != den:
                fs.append(f_)
        if sum(1 for x in fs if x < 0) >= 2 or d == 2:
            break
    if d == 2:
        x, y = fs[0], F(-rng.randint(1, 9), rng.randint(2, 12))
        if x > 0:
            x = -x
        if x == y or math.gcd(y.numerator, y.denominator) != 1:
            return None
        may, men = max(x, y), min(x, y)
        pasos = [("negativos", fr(may), f"Con negativos es mayor el que está más cerca de 0: |{fr(may)}| < |{fr(men)}|, así que {fr(may)} > {fr(men)}.")]
        return mk(f"¿Qué número es mayor: {fr(x)} o {fr(y)}?", fr(may), "t3_racional_comp", {"a": fr(x), "b": fr(y)},
                  [(fr(men), "E01"), ("Son iguales", None), (fr(-men), None)], pasos,
                  "Entre dos negativos es mayor el de menor valor absoluto: −2/3 > −3/4.", datos={"opciones_fijas": True})
    resp = " < ".join(fr(x) for x in sorted(fs))
    e01 = " < ".join(fr(x) for x in sorted(fs, key=lambda v: (v < 0, abs(v)) if False else abs(v) if v < 0 else 10 + v))
    pasos = [("ordenar", resp, "Primero los negativos: el que tiene mayor valor absoluto es el menor. Después los positivos. " + f"Orden: {resp}.")]
    return mk(f"Ordena de menor a mayor: {', '.join(fr(x) for x in fs)}.", resp, "t3_racional_ord", {"fracs": [fr(x) for x in fs]},
              [(e01 if e01 != resp else None, "E01"), (" < ".join(fr(x) for x in sorted(fs, key=abs)), None), (" < ".join(fr(x) for x in sorted(fs, reverse=True)), None)], pasos,
              "En la recta, los negativos más alejados del 0 son los menores: −5/6 < −3/4 < −2/3.")
