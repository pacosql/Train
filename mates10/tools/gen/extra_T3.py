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
