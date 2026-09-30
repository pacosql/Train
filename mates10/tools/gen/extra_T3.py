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


# ---------------------------------------------------------------- OPERACIONES CON FRACCIONES

def expr_txt(terms, ops):
    s = terms[0]
    for o, t in zip(ops, terms[1:]):
        s += f" {o} {t}"
    return s


@generador("t3_ofrac_01")
def gen_ofrac_01(rng, d):
    den = rng.randint(3, 12)
    k = 2 if d < 3 else 3
    for _ in range(100):
        nums = [rng.randint(1, den - 1 if d == 1 else den + 2) for _ in range(k)]
        ops = [rng.choice(["+", "−"]) for _ in range(k - 1)] if d > 1 else [rng.choice(["+", "+", "−"])]
        tot = nums[0]
        for o, n in zip(ops, nums[1:]):
            tot += n if o == "+" else -n
        parcial_ok = all(nums[0] + sum((n if o == "+" else -n) for o, n in zip(ops[:i], nums[1:i + 1])) >= 0 for i in range(k))
        if tot > 0 and tot != den and parcial_ok:
            break
    else:
        return None
    terms = [f"{n}/{den}" for n in nums]
    resp = f"{tot}/{den}"
    dsum = den
    for o in ops:
        dsum += den if o == "+" else -den
    e01 = f"{tot}/{dsum}" if dsum > 0 and dsum != den else None
    e02 = str(tot) if "−" in ops else None
    e03 = f"{tot}/{den ** k}"
    pasos = [("mismo denominador", resp, f"Tienen el mismo denominador ({den}): se deja igual y se opera con los numeradores: {expr_txt([str(n) for n in nums], ops)} = {tot}. Resultado: {resp}.")]
    return mk(f"Calcula: {expr_txt(terms, ops)}", resp, "t3_ofrac_hom", {"nums": nums, "ops": ops, "d": den},
              [(e01 or (f"{tot}/{2 * den}" if "+" in ops else None), "E01"), (e02, "E02"), (e03, "E03")], pasos,
              "Con el mismo denominador se suman o restan solo los numeradores; el denominador (tamaño de las partes) no cambia.",
              genericos=[f"{tot + 1}/{den}", f"{max(tot - 1, 1)}/{den}" if tot > 1 else f"{tot + 2}/{den}", f"{den}/{tot}"])


@generador("t3_ofrac_02")
def gen_ofrac_02(rng, d):
    for _ in range(100):
        den = rng.randint(2, 12)
        m = rng.randint(1, den - 1)
        if math.gcd(m, den) == 1:
            break
    a = 1 if d == 1 else rng.randint(1, 10)
    op = "−" if d == 1 else rng.choice(["+", "−"])
    orden = "nat_primero" if (op == "−" or rng.random() < 0.6) else "frac_primero"
    if op == "+":
        num = a * den + m
        enun = f"Calcula: {a} + {m}/{den}" if orden == "nat_primero" else f"Calcula: {m}/{den} + {a}"
        e01 = f"{a + m}/{den}"
        e02 = f"{a + m}/{1 + den}"
        e03 = None
    else:
        num = a * den - m
        enun = f"Calcula: {a} − {m}/{den}"
        e01 = f"{abs(m - a)}/{den}" if m != a else f"{a}/{den}"
        e02 = f"{a - m}/{den - 1}" if a > m and den > 1 else f"{m - a}/{den - 1}" if m > a else None
        e03 = f"−{num}/{den}"
    resp = f"{num}/{den}"
    pasos = [(f"{a} = {a * den}/{den}", f"{a * den}/{den}", f"Escribo {a} como fracción con denominador {den}: {a} = {a * den}/{den}."),
             ("operar numeradores", resp, f"{a * den}/{den} {op} {m}/{den} = {resp}" + (f" (= {mixto(F(num, den))})." if num > den else "."))]
    return mk(enun, resp, "t3_ofrac_natfrac", {"a": a, "m": m, "d": den, "op": op},
              [(e01, "E01"), (e02, "E02"), (e03, "E03")], pasos,
              "Un natural se escribe como fracción con el mismo denominador (1 = n/n, 3 = 3n/n) antes de sumar o restar.",
              genericos=[f"{num + 1}/{den}", f"{num}/{den + 1}", f"{a * m}/{den}"])


@generador("t3_ofrac_03")
def gen_ofrac_03(rng, d):
    den = rng.randint(2, 12)
    m = rng.randint(1, den - 1 if d < 3 else den + 3)
    a = rng.randint(2, 5 if d == 1 else 12)
    resp = f"{a * m}/{den}"
    pasos = [(f"{a} · {m}/{den}", resp, f"Multiplico el natural por el numerador y dejo el denominador: {a} · {m} = {a * m}, así que {resp}. Es como sumar {a} veces {m}/{den}.")]
    return mk(f"Calcula: {a} · {m}/{den}", resp, "t3_ofrac_natmult", {"a": a, "m": m, "d": den},
              [(f"{a * m}/{a * den}", "E01"), (f"{m}/{a * den}", "E02"), (f"{a + m}/{den}", "E03")], pasos,
              "a · m/n = (a·m)/n: el denominador no se multiplica (se suman trozos del mismo tamaño).",
              genericos=[f"{a * m}/{den + a}", f"{a * m + 1}/{den}"])


def _fracs(rng, k, dmax, nmax=None, distintos=True):
    for _ in range(200):
        fs = []
        for _ in range(k):
            den = rng.randint(2, dmax)
            n = rng.randint(1, nmax or den - 1)
            fs.append((n, den))
        if all(math.gcd(n, x) == 1 for n, x in fs) and (not distintos or len({x for _, x in fs}) == k):
            return fs
    return None


@generador("t3_ofrac_04")
def gen_ofrac_04(rng, d):
    k = 2 if d < 3 else rng.choice([2, 3])
    for _ in range(100):
        fs = _fracs(rng, k, 10 if d == 1 else 20 if d == 2 else 12)
        ops = ["+"] * (k - 1) if d == 1 else [rng.choice(["+", "−"]) for _ in range(k - 1)]
        vals = [F(*f) for f in fs]
        tot = vals[0]
        for o, v in zip(ops, vals[1:]):
            tot = tot + v if o == "+" else tot - v
        if tot > 0 and math.lcm(*[f[1] for f in fs]) <= 120:
            break
    else:
        return None
    mix = d == 3 and k == 2 and rng.random() < 0.5
    if mix:
        e = rng.randint(1, 3)
        vals[0] = vals[0] + e
        tot = tot + e
        terms = [f"{e} {fs[0][0]}/{fs[0][1]}"] + [fr_raw(*f) for f in fs[1:]]
    else:
        terms = [fr_raw(*f) for f in fs]
    m = math.lcm(*[f[1] for f in fs])
    sgn = [1] + [1 if o == "+" else -1 for o in ops]
    nsum = sum(s * f[0] for s, f in zip(sgn, fs))
    dsum = sum(f[1] for f in fs)
    e01 = fr_raw(nsum, dsum) if nsum > 0 and not mix else None
    e02 = fr(F(nsum, m)) if nsum > 0 and F(nsum, m) != tot and not mix else None
    e03 = fr(F(nsum, math.prod(f[1] for f in fs))) if nsum > 0 and not mix and k == 2 else None
    e04 = None
    if k == 2 and not mix:
        (a, b), (c, dd) = fs
        cruz = a * dd + sgn[1] * c * b
        if cruz > 0 and F(cruz, b + dd) != tot:
            e04 = fr_raw(cruz, b + dd)
    conv = [fr_raw(int(v * m), m) for v in vals]
    pasos = [("mcm", str(m), f"Denominador común: mcm({', '.join(str(f[1]) for f in fs)}) = {m}."),
             ("equivalentes", expr_txt(conv, ops), ("Paso el número mixto a fracción y " if mix else "") + f"escribo cada fracción con denominador {m}: {expr_txt(conv, ops)}."),
             ("operar y simplificar", fr(tot), f"Opero los numeradores: {fr_raw(int(tot * m), m)}" + (f" = {fr(tot)} simplificando." if F(int(tot * m), m).denominator != m else "."))]
    return mk(f"Calcula y simplifica: {expr_txt(terms, ops)}", fr(tot), "t3_ofrac_het", {"terms": terms, "ops": ops},
              [(e01, "E01"), (e02, "E02"), (e03, "E03"), (e04, "E04")], pasos,
              "Solo se pueden sumar partes del mismo tamaño: primero común denominador (y ajustar numeradores), después operar numeradores.",
              genericos=[fr(tot + F(1, m)), fr(tot * 2), fr(abs(tot - F(1, m))) if tot > F(1, m) else fr(tot + F(2, m))])


@generador("t3_ofrac_05")
def gen_ofrac_05(rng, d):
    k = 2 if d < 3 else 3
    for _ in range(200):
        fs = _fracs(rng, k, 10 if d == 1 else 20, nmax=None if d == 1 else 20, distintos=False)
        if not fs:
            continue
        r = math.prod((F(*f) for f in fs), start=F(1))
        sin = (math.prod(f[0] for f in fs), math.prod(f[1] for f in fs))
        if d >= 2 and F(*sin) == F(sin[0], sin[1]) and math.gcd(*sin) == 1:
            continue  # queremos que haya que simplificar
        if d == 1 and math.gcd(*sin) != 1:
            continue
        if all(f[0] < 21 and f[1] < 21 for f in fs):
            break
    else:
        return None
    terms = [fr_raw(*f) for f in fs]
    enun = "Calcula y simplifica: " + " · ".join(f"({t})" if k == 3 else t for t in terms)
    dist = []
    if k == 2:
        (a, b), (c, dd) = fs
        M = math.lcm(b, dd)
        e01 = F(a * (M // b) * c * (M // dd), M)
        dist = [(fr(e01) if e01 != r else None, "E01"), (fr(F(a * dd, b * c)) if F(a * dd, b * c) != r else None, "E02"), (fr_raw(a + c, b + dd) if F(a + c, b + dd) != r else None, "E03")]
    else:
        nsum, dsum = sum(f[0] for f in fs), sum(f[1] for f in fs)
        dist = [(fr_raw(nsum, dsum), "E03"), (fr(F(sin[0], fs[0][1])) if F(sin[0], fs[0][1]) != r else None, None)]
    dist.append((fr_raw(*sin) if F(*sin) == r and math.gcd(*sin) != 1 and False else None, None))
    pasos = [("multiplicar en línea", fr_raw(*sin), f"Numerador por numerador y denominador por denominador: {fr_raw(*sin)}."),
             ("simplificar", fr(r), f"Simplifico: {fr(r)}." if math.gcd(*sin) != 1 else "Ya es irreducible.")]
    return mk(enun, fr(r), "t3_ofrac_mult", {"terms": terms},
              dist, pasos, "Multiplicar fracciones: en línea recta (arriba con arriba, abajo con abajo); conviene simplificar antes de multiplicar.",
              genericos=[fr(r * 2), fr(1 / r) if r != 1 else "2", fr(r + 1)])


@generador("t3_ofrac_06")
def gen_ofrac_06(rng, d):
    for _ in range(200):
        fs = _fracs(rng, 2, 10 if d == 1 else 20, nmax=None if d == 1 else 20, distintos=False)
        if not fs:
            continue
        (a, b), (c, dd) = fs
        if d == 3 and rng.random() < 0.5:
            c, dd = rng.randint(2, 9), 1
        r = F(a, b) / F(c, dd)
        if r.numerator < 400 and r.denominator < 400 and F(a, b) != F(c, dd):
            break
    else:
        return None
    tb = str(c) if dd == 1 else f"{c}/{dd}"
    ta = f"{a}/{b}"
    pasos = [("inversa de la segunda", f"{ta} · {dd}/{c}", f"Dividir es multiplicar por la inversa de la segunda: {ta} : {tb} = {ta} · {dd}/{c}."),
             ("multiplicar", fr_raw(a * dd, b * c), f"= {fr_raw(a * dd, b * c)}"),
             ("simplificar", fr(r), f"Simplifico: {fr(r)}.")]
    return mk(f"Calcula y simplifica: {ta} : {tb}", fr(r), "frac_div", {"a": ta, "b": tb},
              [(fr(F(b, a) * F(c, dd)), "E02"), (fr(F(a * c, b * dd)), "E03"), (fr(1 / r), "E04")], pasos,
              "Se invierte la SEGUNDA fracción (el divisor) y se multiplica. Equivale a los productos cruzados: (a·d)/(b·c).",
              genericos=[fr(r * 2), fr(r + 1)])


@generador("t3_ofrac_07")
def gen_ofrac_07(rng, d):
    for _ in range(100):
        a, b = rng.randint(1, 6 if d == 1 else 10), rng.randint(2, 10)
        n = rng.randint(2, 3) if d == 1 else rng.randint(2, 5)
        if math.gcd(a, b) == 1 and a != b and b ** n <= 10000 and a ** n <= 10000:
            break
    else:
        return None
    base = F(a, b)
    if d == 1:
        txt, val = f"({a}/{b}){sup(n)}", base ** n
        e03 = None
    elif d == 2:
        txt, val = f"(−{a}/{b}){sup(n)}", (-base) ** n
        e03 = fr(-val)
    else:
        if rng.random() < 0.5:
            txt, val = f"−({a}/{b}){sup(n)}", -(base ** n)
        else:
            txt, val = f"(−{a}/{b}){sup(n)}", (-base) ** n
        e03 = fr(-val)
    sg = -1 if val < 0 else 1
    pasos = [("(a/b)ⁿ = aⁿ/bⁿ", fr(val), f"Elevo numerador y denominador: {a}{sup(n)} = {a ** n} y {b}{sup(n)} = {b ** n}."),
             ("signo", fr(val), ("El resultado es positivo." if sg > 0 else "El resultado es negativo.") +
              (f" (Base negativa con exponente {'par' if n % 2 == 0 else 'impar'}.)" if "(−" in txt else " (El menos está fuera del paréntesis: no se eleva.)" if txt.startswith("−") else "") + f" {txt} = {fr(val)}.")]
    return mk(f"Calcula: {txt}", fr(val), "t3_ofrac_pot", {"a": a, "b": b, "n": n, "expr": txt},
              [(fr(sg * F(a ** n, b)), "E01"), (fr_raw(sg * a * n, b * n), "E02"), (e03, "E03")], pasos,
              "Se elevan numerador y denominador. Base negativa: exponente par → positivo; impar → negativo. −(a/b)ⁿ siempre es negativo.",
              genericos=[fr(sg * F(a * n, b ** n)), fr(sg * F(b ** n, a ** n)), fr(sg * F(a ** n, b ** (n - 1)))])


@generador("t3_ofrac_08")
def gen_ofrac_08(rng, d):
    for _ in range(200):
        k = 2 if d < 3 else 3
        fs = _fracs(rng, k, 12 if d < 3 else 20, distintos=False)
        if not fs:
            continue
        vals = [F(n, x) * rng.choice([-1, 1]) for n, x in fs]
        if all(v > 0 for v in vals):
            vals[0] = -vals[0]
        if d == 2:
            op = rng.choice(["·", ":"])
            r = vals[0] * vals[1] if op == "·" else vals[0] / vals[1]
            if r.numerator > 400 or r.denominator > 400:
                continue
            t1 = fr(vals[0])
            t2 = f"({fr(vals[1])})" if vals[1] < 0 else fr(vals[1])
            enun = f"Calcula y simplifica: ({t1}) {op} {t2}" if vals[0] < 0 else f"Calcula y simplifica: {t1} {op} {t2}"
            pasos = [("signo", "−" if r < 0 else "+", f"Regla de los signos: {'distinto signo → negativo' if r < 0 else 'mismo signo → positivo'}."),
                     ("valor", fr(r), f"{'Multiplico en línea' if op == '·' else 'Multiplico por la inversa de la segunda'}: {fr(abs(r))}. Resultado: {fr(r)}.")]
            return mk(enun, fr(r), "frac_mult" if op == "·" else "frac_div", {"a": fr(vals[0]).replace("−", "-"), "b": fr(vals[1]).replace("−", "-")},
                      [(fr(-r), "E03"), (fr(1 / r) if abs(r) != 1 else None, None), (fr(-1 / r) if abs(r) != 1 else fr(2 * r), None)], pasos,
                      "Producto y cociente: mismo signo → positivo; distinto → negativo.",
                      genericos=[fr(r * 2), fr(r + 1), fr(r - 1)])
        ops = [rng.choice(["+", "−"]) for _ in range(k - 1)]
        tot = vals[0]
        for o, v in zip(ops, vals[1:]):
            tot = tot + v if o == "+" else tot - v
        if tot == 0 or math.lcm(*[v.denominator for v in vals]) > 120:
            continue
        break
    else:
        return None
    terms = [fr(vals[0])] + [f"({fr(v)})" if v < 0 else fr(v) for v in vals[1:]]
    # E01: pierde el signo del primer término al reducir
    t1 = -vals[0]
    for o, v in zip(ops, vals[1:]):
        t1 = t1 + v if o == "+" else t1 - v
    # E02: − (−x) se trata como − x
    t2 = vals[0]
    hay_e02 = False
    for o, v in zip(ops, vals[1:]):
        if o == "−" and v < 0:
            t2 = t2 + v
            hay_e02 = True
        else:
            t2 = t2 + v if o == "+" else t2 - v
    m = math.lcm(*[v.denominator for v in vals])
    pasos = [("quitar paréntesis", expr_txt([fr(vals[0])] + [fr(v if o == "+" else -v) for o, v in zip(ops, vals[1:])], ["+"] * len(ops)).replace("+ −", "− "),
              "Quito paréntesis: restar un negativo es sumar; sumar un negativo es restar."),
             ("común denominador", str(m), f"Denominador común {m}: " + ", ".join(f"{fr(v)} = {fr_raw(int(v * m), m)}" for v in vals) + "."),
             ("operar", fr(tot), f"Opero los numeradores con su signo y simplifico: {fr(tot)}.")]
    return mk(f"Calcula y simplifica: {expr_txt(terms, ops)}", fr(tot), "t3_ofrac_signo", {"vals": [fr(v) for v in vals], "ops": ops},
              [(fr(t1) if t1 != tot else None, "E01"), (fr(t2) if hay_e02 and t2 != tot else None, "E02"), (fr(-tot), None)], pasos,
              "Primero los signos (quitar paréntesis), después común denominador. El signo del numerador no se pierde al ampliar.",
              genericos=[fr(tot + F(1, m)), fr(tot - F(1, m)), fr(tot * 2)])


# ---------------------------------------------------------------- OPERACIONES CON DECIMALES

def sin_coma(x):
    return int(str(D(x)).replace(",", "").replace("−", "").replace(" ", "").replace(" ", ""))


def partes(x, nd):
    x = F(x)
    ent = int(x)
    dec = int(round((x - ent) * 10 ** nd))
    return ent, dec


@generador("t3_odec_01")
def gen_odec_01(rng, d):
    nd = 1 if d < 3 else 2
    for _ in range(200):
        a = F(rng.randint(10 ** nd, (100 if d < 3 else 500) * 10 ** nd), 10 ** nd)
        b = F(rng.randint(10 ** nd, (100 if d < 3 else 500) * 10 ** nd), 10 ** nd)
        if ndec(a) != nd or ndec(b) != nd:
            continue
        op = rng.choice(["+", "−"]) if d > 1 else "+"
        if op == "−" and a < b:
            a, b = b, a
        if a == b:
            continue
        ea, da = partes(a, nd)
        eb, db = partes(b, nd)
        lleva = (da + db >= 10 ** nd) if op == "+" else (da < db)
        if d == 1 and lleva:
            continue
        if d >= 2 and not lleva:
            continue
        r = a + b if op == "+" else a - b
        if r > 1000:
            continue
        break
    else:
        return None
    resp = D(r, nd)
    e01 = fmt(sin_coma(F(round(r * 10 ** nd), 10 ** nd)))
    e02 = e03 = e04 = None
    if op == "+":
        mal = f"{ea + eb},{da + db}"
        if nd == 1:
            e02 = mal
        else:
            e03 = mal
    else:
        sa, sb = D(a, nd).replace(",", "").rjust(8, "0"), D(b, nd).replace(",", "").rjust(8, "0")
        cols = "".join(str(abs(int(x) - int(y))) for x, y in zip(sa, sb))
        v = F(int(cols), 10 ** nd)
        if v != r:
            e04 = D(v, nd)
    euros = d == 3 and rng.random() < 0.5
    u = " €" if euros else ""
    enun = f"Calcula: {D(a, nd)} {op} {D(b, nd)}" if not euros else (f"Calcula: {D(a, nd)} € {op} {D(b, nd)} €")
    pasos = [("coma bajo coma", "", "Coloco los números con la coma debajo de la coma."),
             ("operar", resp, f"{'Sumo' if op == '+' else 'Resto'} como con naturales" + (", llevando de las décimas a las unidades" if op == "+" and nd == 1 else ", con las llevadas" if op == "+" else ", pidiendo prestado cuando haga falta") + f", y bajo la coma: {resp}{u}.")]
    return mk(enun, resp + u, "t3_odec_suma1", {"a": D(a), "b": D(b), "op": op},
              [(e01 + u, "E01"), ((e02 + u) if e02 else None, "E02"), ((e03 + u) if e03 else None, "E03"), ((e04 + u) if e04 else None, "E04")], pasos,
              "Coma debajo de coma; se opera como con naturales y las llevadas pasan de décimas a unidades igual que de unidades a decenas.",
              genericos=[D(r + F(1, 10), nd) + u, D(r + 1, nd) + u, D(abs(r - F(1, 10)), nd) + u])


@generador("t3_odec_02")
def gen_odec_02(rng, d):
    for _ in range(200):
        if d == 3 or (d == 2 and rng.random() < 0.4):
            a = F(rng.randint(2, 50))
            b = F(rng.randint(1, int(a) * 1000 - 1), 1000 if d == 3 else 100)
            if b.denominator == 1:
                continue
            op = "−"
        else:
            na, nb = rng.sample([1, 2, 3] if d == 2 else [1, 2], 2)
            a = F(rng.randint(1, 60 * 10 ** na), 10 ** na)
            b = F(rng.randint(1, 60 * 10 ** nb), 10 ** nb)
            if ndec(a) != na or ndec(b) != nb:
                continue
            op = rng.choice(["+", "−"])
            if op == "−" and a <= b:
                a, b = b, a
            if a == b:
                continue
        r = a + b if op == "+" else a - b
        if r <= 0:
            continue
        break
    else:
        return None
    resp = D(r)
    sa, sb = D(a), D(b)
    da_, db_ = ndec(a), ndec(b)
    m = max(da_, db_)
    ia, ib = sin_coma(a), sin_coma(b)
    e01 = None
    if da_ != db_:
        v = F(ia + ib if op == "+" else ia - ib, 10 ** m)
        if v > 0 and v != r:
            e01 = D(v)
    e02 = D(a - int(b) + (b - int(b))) if op == "−" and a.denominator == 1 and a - int(b) > 0 else None
    e03 = None
    if op == "−" and da_ < db_:
        A, B = D(a, m).replace(",", ""), D(b, m).replace(",", "")
        A = D(a).replace(",", "") + "_" * (db_ - da_)
        B = B.rjust(len(A), "0")
        out = ""
        for x, y in zip(A, B):
            out += y if x == "_" else str(abs(int(x) - int(y)))
        v = F(int(out), 10 ** m)
        if v != r:
            e03 = D(v)
    e04 = None
    if op == "+" and int(a) == 0 and int(b) == 0:
        v = F(ia + ib, 10 ** m)
        if v != r:
            e04 = D(v)
    pasos = [("igualar decimales", f"{D(a, m)} {op} {D(b, m)}", f"Coloco coma bajo coma y completo con ceros: {D(a, m)} {op} {D(b, m)}."),
             ("operar", resp, f"{'Sumo' if op == '+' else 'Resto'} como con naturales y bajo la coma: {resp}.")]
    return mk(f"Calcula: {sa} {op} {sb}", resp, "t3_odec_suma2", {"a": sa, "b": sb, "op": op},
              [(e01, "E01"), (e02, "E02"), (e03, "E03"), (e04, "E04")], pasos,
              "Coma bajo coma y rellenar con ceros: 10 − 3,75 = 10,00 − 3,75. Alinear por la derecha como con naturales es el error típico.",
              genericos=[D(r + F(1, 10)), D(r + 1), D(r * 10), D(abs(r - F(1, 10))) if r > F(1, 10) else D(r + F(2, 10))])


@generador("t3_odec_03")
def gen_odec_03(rng, d):
    nd = 1 if d == 1 else rng.randint(2, 3) if d == 3 else rng.randint(1, 2)
    for _ in range(100):
        a = F(rng.randint(10 ** nd + 1, 50 * 10 ** nd), 10 ** nd)
        if ndec(a) == nd:
            break
    n = rng.randint(2, 9) if d < 3 else rng.randint(11, 99)
    r = a * n
    ea, da = partes(a, nd)
    digs = sin_coma(a) * n
    pasos = [("sin coma", fmt(digs), f"Multiplico sin coma: {fmt(sin_coma(a))} × {n} = {fmt(digs)}."),
             ("colocar la coma", D(r), f"{D(a)} tiene {nd} cifra{'s' if nd > 1 else ''} decimal{'es' if nd > 1 else ''}: separo {nd} en el resultado → {D(F(digs, 10 ** nd), nd)} = {D(r)}.")]
    return mk(f"Calcula: {D(a)} × {n}", D(r), "t3_odec_multnat", {"a": D(a), "n": n},
              [(D(r * 10), "E01"), (f"{ea * n},{da * n}" if F(f"{ea * n}.{da * n}") != r else None, "E02"), (fmt(digs), "E03")], pasos,
              "Decimal × natural: se multiplica sin coma y se separan tantas cifras decimales como tenía el decimal.",
              genericos=[D(r / 10), D(r + n), D(r + 1)])


@generador("t3_odec_04")
def gen_odec_04(rng, d):
    p = rng.choice([10, 100] if d == 1 else [10, 100, 1000])
    nd = rng.randint(0, 1) if d == 1 else rng.randint(1, 3)
    a = F(rng.randint(1, 999 * 10 ** nd if d > 1 else 99 * 10 ** nd), 10 ** nd)
    if a.denominator == 1 and nd > 0:
        a += F(1, 10 ** nd)
    div = rng.random() < (0.3 if d == 1 else 0.5 if d == 2 else 0.8)
    r = a / p if div else a * p
    k = len(str(p)) - 1
    s = D(a)
    e01 = (s + "0" * k if "," in s else None) if not div else None
    e02 = D(a * p if div else a / p)
    e03 = (D(r * 10) if D(r * 10) != D(r) else None) if div else D(r / 10)
    pasos = [("mover la coma", D(r), f"{'Dividir' if div else 'Multiplicar'} por {fmt(p)} es mover la coma {k} lugar{'es' if k > 1 else ''} a la {'izquierda' if div else 'derecha'}" +
              (", completando con ceros" if (div and ndec(r) > ndec(a) + 0 and int(a) < p) or (not div and ndec(a) < k) else "") + f": {D(r)}.")]
    return mk(f"Calcula: {s} {':' if div else '×'} {fmt(p)}", D(r), "t3_odec_pot10", {"a": s, "p": p, "div": div},
              [(e01, "E01"), (e02, "E02"), (e03, "E03"), (D(r * 100) if div else D(r / 100), None)], pasos,
              "×10, ×100, ×1000: la coma se mueve a la derecha tantos lugares como ceros; al dividir, a la izquierda. Si faltan cifras, se ponen ceros.")


@generador("t3_odec_05")
def gen_odec_05(rng, d):
    for _ in range(200):
        na = 1
        nb = 1 if d == 1 else rng.randint(1, 2)
        a = F(rng.randint(11, 99 if d == 1 else 999), 10 ** na)
        b = F(rng.randint(2, 99 if d < 3 else 999), 10 ** nb)
        if ndec(a) != na or ndec(b) != nb or na + nb > 3:
            continue
        if d == 3 and b > 1 and rng.random() < 0.6:
            continue
        break
    else:
        return None
    r = a * b
    tot = na + nb
    digs = sin_coma(a) * sin_coma(b)
    ea, da = partes(a, na)
    eb, db = partes(b, nb)
    e03 = f"{ea * eb},{da * db}" if (ea or eb) else None
    pasos = [("sin comas", fmt(digs), f"Multiplico sin comas: {sin_coma(a)} × {sin_coma(b)} = {fmt(digs)}."),
             ("colocar la coma", D(r), f"Entre los dos factores hay {na} + {nb} = {tot} cifras decimales: separo {tot} → {D(F(digs, 10 ** tot), tot)} = {D(r)}.")]
    return mk(f"Calcula: {D(a)} × {D(b)}", D(r), "t3_odec_multdec", {"a": D(a), "b": D(b)},
              [(D(F(digs, 10 ** max(na, nb))) if na != nb or True else None, "E01"), (D(F(digs, 10)) if tot > 1 and max(na, nb) != 1 else D(F(digs, 10 ** (tot + 1))), "E02" if tot > 1 and max(na, nb) != 1 else None),
               (e03 if e03 and F(e03.replace(",", ".")) != r else None, "E03")], pasos,
              "Se multiplica sin comas y se separan tantas cifras decimales como sumen los dos factores. Multiplicar por un número menor que 1 da un resultado menor.",
              genericos=[D(r * 10), D(r / 10), D(r + 1)])


@generador("t3_odec_06")
def gen_odec_06(rng, d):
    for _ in range(200):
        b = rng.randint(2, 9) if d < 3 else rng.randint(11, 25)
        ndq = rng.randint(1, 2) if d < 3 else rng.randint(2, 3)
        q = F(rng.randint(1, 30 * 10 ** ndq), 10 ** ndq)
        if ndec(q) != ndq:
            continue
        a = q * b
        if ndec(a) > 3 or ndec(a) == 0:
            continue
        s = D(q)
        if d == 3 and "0" not in s.split(",")[1][:-1] and rng.random() < 0.7:
            continue
        break
    else:
        return None
    s = D(q)
    ent, dec = s.split(",")
    e03 = None
    if "0" in dec.rstrip("0")[:-1] or (dec.startswith("0") and len(dec) > 1):
        e03 = ent + "," + dec.replace("0", "", 1)
    pasos = [("dividir", D(q), f"Divido {D(a)} entre {b} como si fueran naturales; al bajar la primera cifra decimal pongo la coma en el cociente: {D(q)}."),
             ("comprobar", D(a), f"Compruebo: {D(q)} × {b} = {D(a)}.")]
    return mk(f"Calcula: {D(a)} : {b}", D(q), "t3_odec_divnat", {"a": D(a), "b": b},
              [(fmt(sin_coma(q)), "E01"), (D(q * 10), "E02"), (e03, "E03"), (D(q / 10), None)], pasos,
              "La coma del cociente se pone al bajar la primera cifra decimal del dividendo; si una cifra no llega al divisor, se pone un 0 en el cociente.")


@generador("t3_odec_07")
def gen_odec_07(rng, d):
    for _ in range(200):
        b = rng.choice([2, 4, 5, 8, 20, 25, 16, 40])
        if d == 1:
            b = rng.choice([2, 4, 5])
        a = rng.randint(1, 99 if d < 3 else 999)
        if d == 2 and a > b:
            a = rng.randint(1, b - 1)
        if a % b == 0:
            continue
        q = F(a, b)
        if ndec(q) > 3:
            continue
        break
    else:
        return None
    qq, rr_ = divmod(a, b)
    e02 = D(truncar(F(b, a), 2)) if a < b else None
    pasos = [("cociente entero", str(qq), f"{a} : {b} = {qq} y sobra {rr_}" + (" (el dividendo es menor: el cociente empieza por 0)." if a < b else ".")),
             ("seguir con decimales", D(q), f"Pongo la coma en el cociente, añado un 0 al resto y sigo dividiendo hasta que el resto sea 0: {D(q)}.")]
    return mk(f"Calcula con decimales hasta que la división sea exacta: {a} : {b}", D(q), "div", {"a": a, "b": b},
              [(f"{qq},{rr_}" if F(f"{qq}.{rr_}") != q else None, "E01"), (e02, "E02"), (fmt(sin_coma(q)), "E03"), (D(q * 10), None)], pasos,
              "El resto no es la parte decimal: se sigue dividiendo añadiendo ceros y poniendo la coma en el cociente.",
              genericos=[D(q + F(1, 10)), D(q / 10)])


@generador("t3_odec_08")
def gen_odec_08(rng, d):
    for _ in range(300):
        nb = 1 if d == 1 else rng.randint(1, 2)
        b = F(rng.randint(2, 99), 10 ** nb)
        if ndec(b) != nb or b.denominator == 1:
            continue
        q = F(rng.randint(2, 60 if d == 1 else 400), rng.choice([1, 1, 10] if d < 3 else [1, 10, 100]))
        a = q * b
        if ndec(a) > 3 or ndec(q) > 2:
            continue
        break
    else:
        return None
    k = ndec(b)
    e01 = a / (b * 10 ** k)
    e02 = F(sin_coma(a), sin_coma(b))
    pasos = [("divisor natural", f"{D(a * 10 ** k)} : {D(b * 10 ** k)}", f"Multiplico dividendo y divisor por {10 ** k} para que el divisor no tenga coma: {D(a)} : {D(b)} = {D(a * 10 ** k)} : {D(b * 10 ** k)}."),
             ("dividir", D(q), f"{D(a * 10 ** k)} : {D(b * 10 ** k)} = {D(q)}.")]
    return mk(f"Calcula: {D(a)} : {D(b)}", D(q), "t3_odec_divdec", {"a": D(a), "b": D(b)},
              [(D(e01) if es_dec(e01, 4) else D(e01, 2), "E01"), ((D(e02) if es_dec(e02, 4) else D(e02, 2)) if e02 != q else None, "E02"), (D(q * 10), None)], pasos,
              "Si el divisor es decimal, se multiplican dividendo y divisor por la misma potencia de 10. Dividir entre un número menor que 1 da un resultado mayor.",
              genericos=[D(q / 100), D(q + 1), D(q * 100)])


@generador("t3_odec_09")
def gen_odec_09(rng, d):
    f_, fv = rng.choice([("0,1", F(1, 10)), ("0,01", F(1, 100)), ("0,001", F(1, 1000)), ("0,5", F(1, 2)), ("0,25", F(1, 4))])
    div = rng.random() < 0.5
    N = F(rng.randint(2, 400)) if d < 3 else F(rng.randint(11, 999), 10)
    if f_ == "0,25" and not div and N.numerator % 4 and d < 3:
        N = F(4 * rng.randint(1, 50))
    if d == 3 and rng.random() < 0.5:
        N = F(rng.randint(2, 99))
        mayor = div
        resp = f"Mayor que {D(N)}" if mayor else f"Menor que {D(N)}"
        otro = f"Menor que {D(N)}" if mayor else f"Mayor que {D(N)}"
        pasos = [("predecir", resp, f"{'Dividir entre' if div else 'Multiplicar por'} un número menor que 1 da un resultado {'mayor' if div else 'menor'}: {D(N)} {':' if div else '×'} {f_} = {D(N / fv if div else N * fv)}.")]
        return mk(f"Sin calcular: el resultado de {D(N)} {':' if div else '×'} {f_}, ¿será mayor o menor que {D(N)}?", resp, "t3_odec_prediccion", {"N": D(N), "f": f_, "div": div},
                  [(otro, "E03" if not div else None), (f"Igual a {D(N)}", None), ("Depende de si es par o impar", None)], pasos,
                  "Multiplicar por un número entre 0 y 1 achica; dividir entre él agranda.", datos={"opciones_fijas": True})
    r = N / fv if div else N * fv
    equiv = {"0,1": 10, "0,01": 100, "0,001": 1000, "0,5": 2, "0,25": 4}[f_]
    if div:
        e01 = D(N / equiv) if f_ in ("0,1", "0,01", "0,001") else None
        e02 = D(N / equiv) if f_ in ("0,5", "0,25") else None
        txt = f"Dividir entre {f_} es lo mismo que multiplicar por {equiv}: {D(N)} × {equiv} = {D(r)}."
    else:
        e01 = D(N * equiv) if f_ in ("0,1", "0,01", "0,001") else None
        e02 = None
        txt = f"Multiplicar por {f_} es lo mismo que dividir entre {equiv}: {D(N)} : {equiv} = {D(r)}."
    if not es_dec(r, 6):
        return None
    pasos = [("equivalencia", D(r), txt)]
    return mk(f"Calcula de cabeza: {D(N)} {':' if div else '×'} {f_}", D(r), "t3_odec_notables", {"N": D(N), "f": f_, "div": div},
              [(e01, "E01"), (e02, "E02"), (D(N * equiv) if not div and f_ in ("0,5", "0,25") else None, "E03"), (D(r * 10), None), (D(r / 10), None)], pasos,
              "×0,1 = :10; ×0,5 = :2; :0,5 = ×2; :0,25 = ×4. Multiplicar por menos de 1 achica y dividir agranda.")


# ---------------------------------------------------------------- PORCENTAJES

def pct(x, nd=None):
    return (D(x) if nd is None else D(x, nd)) + " %"


def dnum(x, nd=2):
    """Decimal exacto si tiene ≤ nd cifras; si no, redondeado a nd."""
    return D(x) if es_dec(x, nd) else D(x, nd)


@generador("t3_porc_01")
def gen_porc_01(rng, d):
    p = rng.randint(11, 99) if d == 1 else rng.randint(2, 99) if d == 2 else rng.choice([1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 100, 1])
    if p % 10 == 0 and d < 3:
        p += 3
    t = rng.choice(["frac", "cuad"] if d == 1 else ["dec", "dec", "frac"] if d == 2 else ["dec", "ambos"])
    if t == "frac":
        pasos = [("n de cada 100", f"{p}/100", f"{p} % significa {p} de cada 100: {p}/100.")]
        return mk(f"Escribe el {p} % como fracción de denominador 100.", f"{p}/100", "t3_porc_sig", {"p": p, "forma": "fraccion"},
                  [(str(p), "E02"), (f"{p}/10", "E01" if p < 10 else None), (f"100/{p}", None), (f"{100 - p}/100", None)], pasos,
                  "El símbolo % significa «de cada 100»: n % = n/100.")
    if t == "cuad":
        pasos = [("contar", f"{p} %", f"De 100 cuadritos hay {p} coloreados: {p} de cada 100, es decir, el {p} %.")]
        return mk(f"En una cuadrícula de 100 cuadritos se colorean {p}. ¿Qué porcentaje de la cuadrícula está coloreado?", f"{p} %", "t3_porc_sig", {"p": p, "forma": "cuadricula"},
                  [(f"{100 - p} %", None), (pct(F(p, 10)), "E01"), (pct(F(p, 100)), None)], pasos,
                  "En una cuadrícula de 100, cada cuadrito es el 1 %.")
    if t == "dec" or p == 100:
        resp = D(F(p, 100))
        pasos = [("n/100", resp, f"{p} % = {p}/100 = {resp} (dividir entre 100 es correr la coma dos lugares a la izquierda).")]
        return mk(f"Escribe el {p} % como número decimal.", resp, "t3_porc_sig", {"p": p, "forma": "decimal"},
                  [(D(F(p, 10)), "E01" if p < 10 else None), (str(p), "E02"), (D(F(p, 10000)) if p != 100 else "0,01", "E03" if p == 100 else None), (D(F(p, 1000)), None)], pasos,
                  "n % = n/100: el 7 % es 0,07 (siete centésimas), no 0,7. El 100 % es 1, el total.")
    resp = f"{p}/100 = {D(F(p, 100))}"
    pasos = [("n/100", resp, f"{p} % = {p}/100; como decimal, {p} centésimas = {D(F(p, 100))}.")]
    return mk(f"¿Qué fracción y qué decimal corresponden al {p} %?", resp, "t3_porc_sig", {"p": p, "forma": "ambos"},
              [(f"{p}/100 = {D(F(p, 10))}", "E01"), (f"{p}/10 = {D(F(p, 10))}", None), (f"{p}/100 = {p}", "E02")], pasos,
              "n % = n/100 = n centésimas: el 7 % es 0,07.")


PORC_NOT = [(F(1, 2), 50), (F(1, 4), 25), (F(3, 4), 75), (F(1, 10), 10), (F(1, 5), 20), (F(1, 100), 1), (F(2, 5), 40), (F(3, 10), 30), (F(1, 20), 5), (F(1, 1), 100)]


@generador("t3_porc_02")
def gen_porc_02(rng, d):
    if d == 1:
        f_, p = rng.choice(PORC_NOT[:9])
        pasos = [("a denominador 100", f"{p} %", f"{fr(f_)} = {p}/100 = {p} %.")]
        return mk(f"¿Qué porcentaje es {fr(f_)} de una cantidad?", f"{p} %", "t3_porc_equiv", {"f": fr(f_), "p": p},
                  [(f"{f_.denominator} %", "E01"), ("1 %" if p == 10 else "50 %" if p == 20 else None, "E02"), (f"{f_.numerator + f_.denominator} %" if f_.numerator > 1 else f"{100 // f_.denominator + 10} %", None),
                   (f"{100 - p} %" if p != 50 else "5 %", None)], pasos,
                  "Porcentajes notables: 50 % = 1/2, 25 % = 1/4, 75 % = 3/4, 10 % = 1/10, 20 % = 1/5, 1 % = 1/100.",
                  genericos=[f"{p * 2} %", f"{p // 2} %"])
    if d == 2:
        f_, p = rng.choice(PORC_NOT)
        if rng.random() < 0.5:
            pasos = [("simplificar", fr(f_), f"{p} % = {p}/100 = {fr(f_)} simplificando.")]
            return mk(f"¿Qué fracción irreducible equivale al {p} %?", fr(f_), "t3_porc_equiv", {"p": p, "f": fr(f_)},
                      [(f"1/{p}" if p not in (1, 100) else "1/10", "E01"), ("1/100" if p == 10 else "1/2" if p == 20 else None, "E02"), (f"{p}/10" if p < 10 else fr(F(p, 10)) if p != 100 else "100", None),
                       (fr(1 - f_) if f_ != 1 else "1/100", None)], pasos,
                      "n % = n/100 y después se simplifica: 20 % = 20/100 = 1/5.", genericos=[fr(f_ * 2), fr(f_ / 2)])
        resp = D(F(p, 100))
        pasos = [("n/100", resp, f"{p} % = {p}/100 = {resp}.")]
        return mk(f"¿Qué número decimal equivale al {p} %?", resp, "t3_porc_equiv", {"p": p},
                  [(D(F(p, 10)), None), (str(p), None), ("0,01" if p == 10 else "0,5" if p == 20 else D(F(p, 1000)), "E02" if p in (10, 20) else None)], pasos,
                  "n % = n centésimas.", genericos=[D(F(p, 1000)), D(F(100 - p, 100)) if p != 100 else "10"])
    den = rng.choice([4, 5, 10, 20, 25, 50])
    n = rng.randint(1, den - 1)
    if math.gcd(n, den) != 1:
        n = 1
    p = n * 100 // den
    k = 100 // den
    pasos = [(f"× {k}", f"{p}/100", f"Amplifico para que el denominador sea 100: {n}/{den} = {n}·{k}/{den}·{k} = {p}/100."),
             ("porcentaje", f"{p} %", f"{p}/100 = {p} %.")]
    return mk(f"Expresa {n}/{den} como porcentaje.", f"{p} %", "t3_porc_equiv", {"n": n, "d": den},
              [(f"{n + den} %", "E03"), (f"{den} %", "E01"), (f"{n * den} %" if n * den != p else f"{n} %", None)], pasos,
              "Para pasar una fracción a porcentaje se busca una equivalente con denominador 100 (o se multiplica por 100).",
              genericos=[f"{p + 5} %", f"{100 - p} %"])


@generador("t3_porc_03")
def gen_porc_03(rng, d):
    for _ in range(100):
        if d == 1:
            p = rng.choice([50, 25, 10])
            N = rng.randint(2, 60) * (100 // math.gcd(p, 100)) // (1 if p != 10 else 1)
        elif d == 2:
            p = rng.choice([5, 15, 20, 30, 40, 60, 75, 12, 35, 45, 80, 90])
            N = rng.randint(2, 50) * (100 // math.gcd(p, 100))
        else:
            p = rng.randint(3, 97)
            N = rng.randint(100, 10000)
            if (N * p) % 100:
                N -= N % (100 // math.gcd(p, 100))
        r = F(N * p, 100)
        if N <= 10000 and N > 0 and r.denominator == 1 and N != p:
            break
    r = int(r)
    e01 = F(N, p)
    pasos = [(f"{fmt(N)} × {p} : 100", fmt(r), f"El {p} % es {p} de cada 100: {fmt(N)} × {p} = {fmt(N * p)}; y : 100 = {fmt(r)}." if d > 1 or p == 10 else
              f"El {p} % es {'la mitad' if p == 50 else 'la cuarta parte'}: {fmt(N)} : {100 // p} = {fmt(r)}.")]
    return mk(f"Calcula el {p} % de {fmt(N)}.", fmt(r), "porc", {"p": p, "N": N},
              [(dnum(e01) if e01 != r else None, "E01"), (fmt(N * p), "E02"), (fmt(N - r) if N - r != r else None, "E03"), (fmt(N - p) if N - p != r else None, "E04")], pasos,
              "r % de N = N · r / 100. El 50 % es la mitad; el 25 %, la cuarta parte; el 10 %, dividir entre 10.",
              genericos=[fmt(r + 10), fmt(r * 2), fmt(r // 2) if r > 1 else "2"])


CONT_VAR = [("Un abrigo de {N} € tiene un {p} % de descuento. ¿Cuánto cuesta ahora?", -1), ("Unas zapatillas de {N} € se rebajan un {p} %. ¿Cuál es el precio rebajado?", -1),
            ("Una suscripción anual de {N} € sube un {p} %. ¿Cuánto cuesta ahora?", 1), ("Una bici cuesta {N} € y le suben el precio un {p} %. ¿Cuánto cuesta ahora?", 1),
            ("A una factura de {N} € se le añade un {p} % de impuestos. ¿Cuánto se paga en total?", 1), ("Un juego de {N} € está rebajado un {p} %. ¿Cuánto hay que pagar?", -1)]


@generador("t3_porc_04")
def gen_porc_04(rng, d):
    for _ in range(100):
        p = rng.choice([10, 20, 25, 50]) if d == 1 else rng.choice([5, 15, 30, 40, 12, 35, 60]) if d == 2 else rng.choice([21, 8, 17, 35, 45, 4, 3])
        N = rng.randint(2, 60) * (100 // math.gcd(p, 100)) if d < 3 else rng.randint(20, 900)
        dif = F(N * p, 100)
        if d < 3 and dif.denominator != 1:
            continue
        if d == 3 and ndec(dif) > 2:
            continue
        break
    plant, s = rng.choice(CONT_VAR)
    r = N + s * dif
    pasos = [(f"{p} % de {N}", eur(dif), f"Calculo el {p} % de {N} €: {N} × {p} : 100 = {eur(dif)}."),
             (f"{N} {'+' if s > 0 else '−'} {eur(dif)}", eur(r), f"{'Lo sumo' if s > 0 else 'Lo resto'} al precio inicial: {eur(r)}.")]
    return mk(plant.format(N=fmt(N), p=p), eur(r), "t3_porc_var2", {"N": N, "p": p, "sentido": s},
              [(eur(dif), "E01"), (eur(N + s * p) if N + s * p != r else None, "E02"), (eur(N - s * dif), "E03")], pasos,
              "En dos pasos: primero el porcentaje (la rebaja o el aumento) y después restarlo o sumarlo a la cantidad inicial.",
              genericos=[eur(r + 1), eur(r - 1), eur(r + dif)])


CONT_PARTE = ["{P} de {T} alumnos aprueban el examen. ¿Qué porcentaje aprueba?", "En una bolsa hay {T} caramelos y {P} son de fresa. ¿Qué porcentaje son de fresa?",
              "Un equipo ha ganado {P} de sus {T} partidos. ¿Qué porcentaje de partidos ha ganado?", "De {T} socios de un club, {P} practican natación. ¿Qué porcentaje practica natación?",
              "¿Qué porcentaje representa {P} de {T}?"]


@generador("t3_porc_05")
def gen_porc_05(rng, d):
    for _ in range(200):
        T = rng.choice([20, 25, 40, 50, 80, 200, 250, 400, 500]) if d == 1 else rng.randint(12, 120) if d == 2 else rng.randint(6, 90)
        P = rng.randint(1, T - 1)
        v = F(P * 100, T)
        if d < 3 and v.denominator != 1:
            continue
        if d == 3 and es_dec(v, 1):
            continue
        break
    else:
        return None
    resp = pct(v) if d < 3 else pct(v, 1)
    enun = rng.choice(CONT_PARTE).format(P=P, T=T)
    if d == 3:
        enun += " (Redondea a las décimas.)"
    inv = F(T * 100, P)
    pasos = [(f"{P}/{T} · 100", resp, f"Divido la parte entre el total y multiplico por 100: {P}/{T} · 100 = {D(v) if d < 3 else puntos(v, 3)}" + ("." if d < 3 else f" ≈ {resp}."))]
    return mk(enun, resp, "t3_porc_que", {"P": P, "T": T},
              [(pct(inv, 1) if not es_dec(inv, 1) else pct(inv), "E01"), (D(F(P, T), 2) + " %", "E02"), (f"{T - P} %", "E03")], pasos,
              "Porcentaje = parte / total · 100. Primero la fracción que representa, después se pasa a porcentaje.",
              genericos=[pct(v + 10) if d < 3 else pct(v + 10, 1), pct(100 - v) if d < 3 else pct(100 - v, 1)])


@generador("t3_porc_06")
def gen_porc_06(rng, d):
    if d == 1:
        p = rng.choice([110, 120, 125, 150, 200, 250, 300])
        N = rng.randint(2, 40) * (100 // math.gcd(p, 100))
        r = F(N * p, 100)
        pasos = [(f"{fmt(N)} × {p} : 100", fmt(r), f"El {p} % es más que el total: {fmt(N)} × {p} : 100 = {fmt(r)}.")]
        return mk(f"Calcula el {p} % de {fmt(N)}.", fmt(r), "porc", {"p": p, "N": N},
                  [("No se puede: un porcentaje no pasa de 100", "E01"), (fmt(r - N) if r - N != N else fmt(N * p), None), (dnum(F(N * p, 1000)), None)], pasos,
                  "Un porcentaje mayor que 100 da más que la cantidad: el 150 % de N es N y su mitad.")
    if d == 2:
        p = rng.choice([F(1, 2), F(1, 4), F(3, 4), F(2, 10), F(4, 10), F(8, 10), F(1, 10)])
        N = rng.randint(2, 50) * 100 * (p.denominator // math.gcd(p.denominator, 100) or 1)
        r = N * p / 100
        if r.denominator != 1:
            N *= r.denominator
            r = N * p / 100
        pasos = [(f"{fmt(N)} × {D(p)} : 100", dnum(r), f"{D(p)} % = {D(p)}/100 = {D(p / 100)}. {fmt(N)} × {D(p / 100)} = {dnum(r)}.")]
        return mk(f"Calcula el {D(p)} % de {fmt(N)}.", dnum(r), "porc", {"p": D(p).replace(",", "."), "N": N},
                  [(dnum(r * 10), "E02"), (dnum(r * 100), "E02"), (dnum(r / 10), None)], pasos,
                  "Un porcentaje menor que 1 es menos de una centésima: el 0,5 % es la mitad del 1 %.")
    if rng.random() < 0.5:
        p = rng.choice([120, 125, 150, 175, 250, 300, 340, 210, 105])
        resp = D(F(p, 100))
        pasos = [("n/100", resp, f"{p} % = {p}/100 = {resp}.")]
        return mk(f"Escribe el {p} % como número decimal.", resp, "t3_porc_dec", {"p": p},
                  [(D(F(p, 1000)), "E03"), (D(F(p, 10)), "E03"), (str(p), None)], pasos, "n % = n/100 también para n > 100: 250 % = 2,5.")
    p = rng.choice([F(4, 10), F(5, 10), F(8, 10), F(25, 100), F(3, 10), F(15, 10), F(75, 100)])
    resp = D(p / 100)
    pasos = [("n/100", resp, f"{D(p)} % = {D(p)}/100 = {resp}.")]
    return mk(f"Escribe el {D(p)} % como número decimal.", resp, "t3_porc_dec", {"p": D(p)},
              [(D(p / 10), "E03"), (D(p), "E03"), (D(p / 1000), None)], pasos, "n % = n/100 también para n < 1: 0,4 % = 0,004.")


@generador("t3_porc_07")
def gen_porc_07(rng, d):
    for _ in range(100):
        p = rng.choice([10, 20, 25, 50]) if d == 1 else rng.choice([5, 15, 30, 40, 60, 75, 12, 35]) if d == 2 else rng.randint(3, 95)
        X = rng.randint(2, 80) * (100 // math.gcd(p, 100)) if d < 3 else rng.randint(20, 2000)
        P = F(X * p, 100)
        if P.denominator == 1:
            break
    P = int(P)
    pasos = [(f"{P} : {p}", dnum(F(P, p)), f"Si el {p} % son {P}, el 1 % es {P} : {p} = {dnum(F(P, p))}."),
             (f"× 100", fmt(X), f"El 100 % es 100 veces más: {fmt(X)}.")]
    return mk(f"El {p} % de un número es {fmt(P)}. ¿Cuál es el número?", fmt(X), "t3_porc_total", {"p": p, "P": P},
              [(dnum(F(P * p, 100)), "E01"), (fmt(P * p), "E02"), (fmt(P + p), "E03")], pasos,
              "Problema inverso: total = parte · 100 / porcentaje (o reducir al 1 % y multiplicar por 100).",
              genericos=[fmt(X + P), fmt(X * 2), fmt(X - P) if X > P else fmt(X + 10)])


@generador("t3_porc_08")
def gen_porc_08(rng, d):
    if d == 1:
        p = rng.choice([5, 8, 12, 15, 20, 25, 30, 35, 40, 3, 7, 21, 16, 45])
        up = rng.random() < 0.5
        idx = 1 + F(p, 100) if up else 1 - F(p, 100)
        pasos = [("índice", D(idx), f"{'Aumentar' if up else 'Disminuir'} un {p} % es quedarse con el {100 + p if up else 100 - p} %: multiplicar por {D(idx)}.")]
        return mk(f"¿Por qué número hay que multiplicar una cantidad para {'aumentarla' if up else 'disminuirla'} un {p} %?", D(idx), "t3_porc_indice", {"p": p, "sube": up},
                  [(D(F(p, 100)), "E01"), (D(1 + F(p, 10)) if up and p < 10 else D(1 + F(p, 100)) if not up else D(F(100 + p, 10)), "E02" if up and p < 10 else None), (D(1 - F(p, 100)) if up else D(F(p, 10)), None),
                   (str(100 + p if up else 100 - p), None)], pasos,
                  "Índice de variación: 1 + r/100 al aumentar, 1 − r/100 al disminuir.")
    if d == 2:
        for _ in range(100):
            p = rng.choice([F(35, 10), F(3), F(4), F(15), F(12), F(8), F(25, 10), F(21), F(6)])
            N = rng.randint(40, 3000)
            up = rng.random() < 0.5
            idx = 1 + p / 100 if up else 1 - p / 100
            r = N * idx
            if ndec(r) <= 2:
                break
        pasos = [("índice", D(idx), f"Índice de variación: 1 {'+' if up else '−'} {D(p / 100)} = {D(idx)}."),
                 ("multiplicar", eur(r), f"{fmt(N)} · {D(idx)} = {eur(r)}.")]
        return mk(f"Una cantidad de {fmt(N)} € {'aumenta' if up else 'disminuye'} un {D(p)} %. Calcula la cantidad final multiplicando por el índice de variación.", eur(r), "t3_porc_indice",
                  {"N": N, "p": D(p), "sube": up},
                  [(eur(N * p / 100), "E01"), (eur(N * (1 + p / 10)) if up and p < 10 else eur(N * (1 - p / 100 + F(2 * p, 100))), "E02" if up and p < 10 else None), (eur(N * (1 - p / 100) if up else N * (1 + p / 100)), None)], pasos,
                  "Cantidad final = cantidad inicial · índice (1 ± r/100). Un 3,5 % de subida es multiplicar por 1,035.",
                  genericos=[eur(r + 1), eur(r + 10)])
    for _ in range(100):
        A = rng.randint(20, 400)
        p = rng.choice([5, 10, 20, 25, 40, 50, 15, 30, 60, 75])
        up = rng.random() < 0.6
        B = F(A * (100 + p if up else 100 - p), 100)
        if B.denominator == 1:
            break
    B = int(B)
    e03 = F(abs(B - A) * 100, B)
    pasos = [("variación", fmt(abs(B - A)), f"La cantidad pasa de {A} a {B}: {'sube' if up else 'baja'} {abs(B - A)}."),
             ("respecto a la inicial", f"{p} %", f"{abs(B - A)}/{A} · 100 = {p} %: {'sube' if up else 'baja'} un {p} %.")]
    return mk(f"Un precio pasa de {A} € a {B} €. ¿Qué porcentaje ha {'subido' if up else 'bajado'}?", f"{p} %", "t3_porc_varpct", {"A": A, "B": B},
              [(pct(e03, 1) if not es_dec(e03, 1) else pct(e03), "E03"), (f"{abs(B - A)} %", None), (f"{100 + p if up else 100 - p} %", None)], pasos,
              "El porcentaje de variación se calcula siempre sobre la cantidad INICIAL.")


@generador("t3_porc_09")
def gen_porc_09(rng, d):
    if d == 2:
        p = rng.choice([10, 20, 25, 30, 40, 50, 5, 15])
        q = p if rng.random() < 0.6 else rng.choice([10, 20, 25, 30])
        idx = (1 + F(p, 100)) * (1 - F(q, 100))
        v = (idx - 1) * 100
        resp = ("Sube un " if v > 0 else "Baja un ") + pct(abs(v)) if v != 0 else "Queda igual"
        pasos = [("índices", f"{D(1 + F(p, 100))} · {D(1 - F(q, 100))}", f"Multiplico los índices: {D(1 + F(p, 100))} · {D(1 - F(q, 100))} = {D(idx)}."),
                 ("variación total", resp, f"{D(idx)} {'< 1' if idx < 1 else '> 1'}: {resp.lower()}.")]
        s = p - q
        e01 = "Queda igual" if s == 0 else ("Sube un " if s > 0 else "Baja un ") + pct(abs(s))
        return mk(f"Un precio sube un {p} % y después baja un {q} %. ¿Cuál es la variación total?", resp, "t3_porc_encad", {"p": p, "q": q},
                  [(e01 if e01 != resp else None, "E01"), (f"Sube un {pct((1 + F(p, 100) + 1 - F(q, 100) - 1) * 100)}", "E02"), (("Baja un " if v > 0 else "Sube un ") + pct(abs(v)) if v != 0 else "Baja un 1 %", None)], pasos,
                  "Las variaciones encadenadas se multiplican (índices), no se suman: subir y bajar un 20 % deja un 96 %.",
                  genericos=[f"Baja un {pct(p * q // 10 or 1)}", f"Sube un {pct(p + q)}"], datos=None)
    for _ in range(100):
        k = 2 if d == 1 else 3
        N = rng.choice([100, 200, 400, 500, 800, 1000, 1200, 2000, 250, 50, 80])
        vs = [rng.choice([10, 20, 25, 50, 5]) * rng.choice([1, -1]) for _ in range(k)]
        if all(v == vs[0] for v in vs):
            continue
        idx = [1 + F(v, 100) for v in vs]
        r = N * math.prod(idx)
        if ndec(r) <= 2:
            break
    txt = ", ".join(("sube un " if v > 0 else "baja un ") + f"{abs(v)} %" for v in vs[:-1]) + " y después " + ("sube un " if vs[-1] > 0 else "baja un ") + f"{abs(vs[-1])} %"
    e01 = N * (1 + F(sum(vs), 100))
    e02 = N * sum(idx)
    e03 = N * idx[0] + N * F(vs[1], 100) if k == 2 else N * idx[0] * idx[1] + N * F(vs[2], 100)
    pasos = [("índices", " · ".join(D(i) for i in idx), "Cada variación es un índice: " + ", ".join(D(i) for i in idx) + "."),
             ("multiplicar", eur(r), f"{fmt(N)} · " + " · ".join(D(i) for i in idx) + f" = {eur(r)}.")]
    return mk(f"Un artículo de {fmt(N)} € {txt}. ¿Cuál es el precio final?", eur(r), "t3_porc_encad", {"N": N, "vs": vs},
              [(eur(e01) if e01 != r else None, "E01"), (eur(e02), "E02"), (eur(e03) if e03 != r and e03 != e01 else None, "E03")], pasos,
              "Cada porcentaje se aplica sobre la cantidad que hay en ese momento: se multiplican los índices.",
              genericos=[eur(r + 10), eur(r * F(11, 10))])


@generador("t3_porc_10")
def gen_porc_10(rng, d):
    for _ in range(200):
        tipo = rng.choice(["desc", "iva", "sube"] if d > 1 else ["desc", "sube"])
        p = 21 if tipo == "iva" else rng.choice([10, 15, 20, 25, 30, 40]) if d < 3 else rng.choice([12, 35, 8, 16, 18, 22])
        I = rng.randint(10, 300) if d < 3 else rng.randint(20, 900)
        idx = 1 + F(p, 100) if tipo != "desc" else 1 - F(p, 100)
        Fi = I * idx
        if ndec(Fi) <= 2:
            break
    if tipo == "desc":
        enun = f"Tras una rebaja del {p} % se pagan {eur(Fi)}. ¿Cuál era el precio antes de la rebaja?"
        e01 = Fi * (1 + F(p, 100))
    elif tipo == "iva":
        enun = f"Un producto cuesta {eur(Fi)} con el 21 % de IVA incluido. ¿Cuál es su precio sin IVA?"
        e01 = Fi * F(79, 100)
    else:
        enun = f"Tras subir un {p} %, una entrada cuesta {eur(Fi)}. ¿Cuánto costaba antes de la subida?"
        e01 = Fi * (1 - F(p, 100))
    pasos = [("índice", D(idx), f"Índice de variación: {D(idx)}. Final = inicial · {D(idx)}."),
             ("dividir", eur(I), f"Inicial = final : índice = {D(Fi)} : {D(idx)} = {eur(I)}.")]
    return mk(enun, eur(I), "t3_porc_inicial", {"F": D(Fi), "p": p, "tipo": tipo},
              [(eur(redondear(e01, 2)), "E01"), (eur(redondear(Fi * idx, 2)), "E02"), (eur(redondear(Fi - Fi * F(p, 100) if tipo != "desc" else Fi + Fi * F(p, 100), 2)) if tipo == "iva" or True else None, "E03" if tipo == "iva" else None)], pasos,
              "Para volver a la cantidad inicial se DIVIDE la final entre el índice de variación; aplicar el porcentaje contrario al final no sirve.",
              genericos=[eur(I + 5), eur(I - 5)])


@generador("t3_porc_11")
def gen_porc_11(rng, d):
    for _ in range(200):
        C = rng.choice([500, 1000, 1200, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 8000, 10000, 12000, 20000])
        r = rng.choice([F(2), F(3), F(4), F(5), F(25, 10), F(35, 10), F(6), F(15, 10)])
        if d == 1:
            t, u, tt = rng.randint(1, 6), "años", None
            ta = F(t)
        elif rng.random() < 0.6 or d == 3:
            t, u = rng.choice([3, 4, 6, 8, 9, 10, 18]), "meses"
            ta = F(t, 12)
        else:
            t, u = rng.choice([30, 45, 60, 90, 120, 180, 240]), "días"
            ta = F(t, 360)
        I = C * r * ta / 100
        if ndec(I) > 2:
            continue
        break
    else:
        return None
    ttxt = f"{t} {u}" if not (t == 1 and u == "años") else "1 año"
    conv = "" if u == "años" else f" (el tiempo en años: {t}/{12 if u == 'meses' else 360})"
    if d < 3:
        pregunta_final = rng.random() < 0.3
        resp = eur(C + I) if pregunta_final else eur(I)
        pasos = [("I = C·r·t/100", eur(I), f"I = {fmt(C)} · {D(r)} · {fr(ta)} / 100 = {eur(I)}{conv}.")] + ([("capital final", eur(C + I), f"Capital final = {fmt(C)} + {D(I)} = {eur(C + I)}.")] if pregunta_final else [])
        enun = f"Se depositan {fmt(C)} € al {D(r)} % de interés simple anual durante {ttxt}. " + ("¿Cuál es el capital final?" if pregunta_final else "¿Qué interés se obtiene?")
        e01 = C * r * t / 100
        return mk(enun, resp, "t3_interes_simple", {"C": C, "r": D(r), "t": t, "u": u},
                  [(eur(e01 + (C if pregunta_final else 0)) if u != "años" else None, "E01"), (eur(C * r * ta + (C if pregunta_final else 0)), "E02"), (eur(I) if pregunta_final else eur(C + I), "E03")], pasos,
                  "Interés simple: I = C · r · t / 100 con t en años (meses/12, días/360). El capital final es C + I.",
                  genericos=[eur(I * 2), eur(I + 10)])
    I = C * r * ta / 100
    pasos = [("despejar C", eur(C), f"De I = C · r · t / 100: C = 100 · I / (r · t) = 100 · {D(I)} / ({D(r)} · {fr(ta)}) = {eur(C)}{conv}.")]
    e01 = 100 * I / (r * t)
    return mk(f"¿Qué capital, al {D(r)} % de interés simple anual, produce {eur(I)} de intereses en {ttxt}?", eur(C), "t3_interes_simple", {"I": D(I), "r": D(r), "t": t, "u": u, "pide": "C"},
              [(eur(redondear(e01, 2)), "E01"), (eur(redondear(I / (r * ta), 2)), "E02"), (eur(C + I), "E03")], pasos,
              "Se despeja C de I = C·r·t/100, con t en años.", genericos=[eur(C * 2), eur(C + 100)])


@generador("t3_porc_12")
def gen_porc_12(rng, d):
    C = rng.choice([1000, 2000, 3000, 4000, 5000, 6000, 8000, 10000, 15000, 20000])
    r = rng.choice([2, 3, 4, 5, 6, F(25, 10), F(35, 10)])
    t = rng.randint(2, 8)
    k, nom = (1, "anual") if d == 1 else rng.choice([(2, "semestral"), (4, "trimestral")]) if d == 2 else rng.choice([(12, "mensual"), (4, "trimestral"), (2, "semestral")])
    i = F(r) / 100 / k
    Cf = C * (1 + i) ** (k * t)
    e01 = C * (1 + F(r) / 100 * t)
    e02 = C * (1 + F(r) / 100) ** (k * t)
    e03 = C * (1 + F(r) / 100) * t
    cap = "" if k == 1 else f" con capitalización {nom}"
    pasos = [("rédito por periodo", D(i * 100) + " %", f"El {D(r)} % anual{cap} da un rédito por periodo de {D(r)}/{k} = {D(i * 100)} %." if k > 1 else f"Rédito anual: {D(r)} %."),
             ("periodos", str(k * t), f"Número de periodos: {k} · {t} = {k * t}."),
             ("Cf = C(1 + i)ⁿ", eur(redondear(Cf, 2)), f"Cf = {fmt(C)} · {D(1 + i)}^{k * t} ≈ {eur(redondear(Cf, 2))}.")]
    return mk(f"Se invierten {fmt(C)} € al {D(r)} % anual de interés compuesto{cap} durante {t} años. ¿Cuál es el capital final?", eur(redondear(Cf, 2)), "t3_interes_compuesto",
              {"C": C, "r": D(r), "t": t, "k": k},
              [(eur(redondear(e01, 2)), "E01"), (eur(redondear(e02, 2)) if k > 1 else None, "E02"), (eur(redondear(e03, 2)), "E03")], pasos,
              "Interés compuesto: Cf = C·(1 + i)ⁿ, con i el rédito de cada periodo (anual/k) y n el número de periodos (k·años).",
              genericos=[eur(redondear(Cf - C, 2)), eur(redondear(Cf * F(101, 100), 2))])


@generador("t3_porc_13")
def gen_porc_13(rng, d):
    k, nom = (2, "semestral") if d == 1 else (4, "trimestral") if d == 2 else (12, "mensual")
    r = rng.choice([F(x, 10) for x in range(15, 121, 5)])
    i = r / 100
    tae = ((1 + i / k) ** k - 1) * 100
    e03 = ((1 + i) ** k - 1) * 100
    pasos = [("rédito por periodo", D(r / k, 4) if not es_dec(r / k, 4) else D(r / k), f"Cada periodo: {D(r)} % / {k} = {D(r / k) if es_dec(r / k, 4) else D(r / k, 4)} %."),
             ("TAE = (1 + i/k)^k − 1", pct(tae, 2), f"TAE = (1 + {D(i / k) if es_dec(i / k, 6) else D(i / k, 6)})^{k} − 1 ≈ {D(tae / 100, 4)} → {pct(tae, 2)}.")]
    return mk(f"Un depósito ofrece un interés nominal del {D(r)} % anual con capitalización {nom}. ¿Cuál es su TAE?", pct(tae, 2), "t3_tae", {"r": D(r), "k": k},
              [(pct(r, 2), "E01"), (pct(tae + 100, 2), "E02"), (pct(e03, 2), "E03")], pasos,
              "La TAE es el interés anual equivalente: (1 + i/k)^k − 1. Siempre es algo mayor que el nominal si hay capitalización fraccionada.",
              genericos=[pct(tae + F(1, 10), 2), pct(tae - F(1, 10), 2)])


@generador("t3_porc_14")
def gen_porc_14(rng, d):
    C = rng.choice([3000, 5000, 6000, 8000, 10000, 12000, 15000, 18000, 20000, 25000, 30000])
    r = rng.choice([3, 4, 5, 6, 7, 8, F(45, 10), F(55, 10)])
    anios = rng.randint(2, 5) if d < 3 else rng.randint(5, 15)
    k = 1 if d == 1 else 12
    i = float(F(r) / 100 / k)
    n = anios * k
    a = C * i / (1 - (1 + i) ** -n)
    e01 = C * float(F(r) / 100) / (1 - (1 + float(F(r) / 100)) ** -n)
    e02 = C / n
    e03 = C * i / ((1 + i) ** n - 1)
    f2 = lambda x: eur(redondear(F(x).limit_denominator(10 ** 9), 2))
    per = "anuales" if k == 1 else "mensuales"
    pasos = [("i y n por periodo", f"i = {D(F(r) / 100 / k, 6) if not es_dec(F(r) / 100 / k, 6) else D(F(r) / 100 / k)}; n = {n}",
              f"Rédito por periodo i = {D(r)}/100" + (f"/12" if k == 12 else "") + f"; número de cuotas n = {n}."),
             ("a = C·i / (1 − (1 + i)^−n)", f2(a), f"a = {fmt(C)} · i / (1 − (1 + i)^−{n}) ≈ {f2(a)}.")]
    return mk(f"Se pide un préstamo de {fmt(C)} € al {D(r)} % anual, a devolver en {anios} años con cuotas {per} constantes. ¿Cuál es la cuota?", f2(a), "t3_prestamo",
              {"C": C, "r": D(r), "anios": anios, "k": k},
              [(f2(e01) if k > 1 else None, "E01"), (f2(e02), "E02"), (f2(e03), "E03"), (f2(a * 1.1), None)], pasos,
              "Cuota del sistema francés: a = C·i / (1 − (1 + i)^−n), con i y n referidos al mismo periodo que las cuotas.")


# ---------------------------------------------------------------- PROPORCIONALIDAD

def tabla_txt(pares):
    return "; ".join(f"{dnum(x)} → {dnum(y)}" for x, y in pares)


SIT_PROP = [("Los kilos de naranjas que compras y lo que pagas (a precio fijo por kilo)", "d"), ("El número de entradas de cine y su precio total", "d"),
            ("Los litros de gasolina y lo que cuestan", "d"), ("Las horas trabajadas y el sueldo, cobrando lo mismo por hora", "d"),
            ("Los metros de tela y su precio", "d"), ("Los huevos de una receta y los comensales", "d"),
            ("La edad de una persona y su altura", "n"), ("Los kilómetros de un taxi y lo que cuesta, con bajada de bandera", "n1"),
            ("El número de hermanos y el número de zapatos que hay en casa, con tus padres", "n1"), ("La tarifa de un gimnasio con cuota de inscripción y los meses que vas", "n1"),
            ("El número de obreros y los días que tardan en hacer una obra", "i"), ("La velocidad de un coche y el tiempo que tarda en un mismo viaje", "i"),
            ("El peso de un bebé y su edad en meses", "n"), ("La nota de un examen y las horas que has dormido", "n")]


@generador("t3_prop_01")
def gen_prop_01(rng, d):
    SI = "Sí, es de proporcionalidad directa"
    NO = "No es de proporcionalidad directa"
    if d == 3:
        sit, t = rng.choice(SIT_PROP)
        OPC = {"d": "Sí, son directamente proporcionales", "i": "No: son inversamente proporcionales", "n": "No son proporcionales",
               "n1": "No son proporcionales", "falso": "Sí, porque cuando una aumenta, la otra también"}
        resp = OPC[t]
        if t == "d":
            dist = [(OPC["i"], "E03"), (OPC["n"], None), ("No se puede saber sin una tabla", None)]
            txt = "Al doble de una, doble de la otra: el cociente es constante."
        elif t == "i":
            dist = [("Sí, son directamente proporcionales", "E03"), (OPC["n"], None), (OPC["falso"], None)]
            txt = "Cuando una se duplica, la otra se reduce a la mitad: es proporcionalidad inversa, no directa."
        else:
            dist = [(OPC["falso"], "E01"), (OPC["d"], "E01" if t == "n1" else None), (OPC["i"], None)]
            txt = "Aunque las dos crezcan, al doble de una no le corresponde el doble de la otra." if t == "n1" else "No hay una relación fija: al doble de una no le corresponde el doble de la otra."
        pasos = [("¿al doble, doble?", resp, txt)]
        return mk(f"¿Son directamente proporcionales estas magnitudes? {sit}.", resp, "t3_prop_reconocer", {"situacion": sit}, dist, pasos,
                  "Directa: al doble, doble; al triple, triple (cociente constante). Que las dos crezcan no basta.", datos={"opciones_fijas": True})
    k = rng.choice([F(2), F(3), F(5), F(4), F(25, 10), F(15, 10), F(6), F(12)])
    xs = sorted(rng.sample(range(1, 12), 3))
    prop = rng.random() < 0.5
    if prop:
        ys = [x * k for x in xs]
        pasos = [("cocientes", D(k), "Divido cada valor de abajo entre el de arriba: " + ", ".join(f"{dnum(y)} : {x} = {D(k)}" for x, y in zip(xs, ys)) + ". Siempre igual: es proporcional.")]
        return mk(f"¿Es de proporcionalidad directa esta tabla? {tabla_txt(zip(xs, ys))}", f"{SI} (constante {D(k)})", "t3_prop_reconocer", {"xs": xs, "ys": [D(y) for y in ys]},
                  [(f"{NO}: las diferencias no son iguales", "E02"), ("No: es de proporcionalidad inversa", "E03"), (f"{SI} (constante {D(k + 1)})", None)], pasos,
                  "Se comprueba que el cociente y/x es siempre el mismo (la constante de proporcionalidad).", datos={"opciones_fijas": True})
    c = rng.choice([1, 2, 3, 5])
    ys = [x * k + c for x in xs]
    step = xs[1] - xs[0]
    if d == 1:
        xs = [xs[0], xs[0] + step, xs[0] + 2 * step]
        ys = [x * k + c for x in xs]
    pasos = [("cocientes", NO, "Divido cada valor de abajo entre el de arriba: " + ", ".join(f"{dnum(y)} : {x} = {dnum(F(y) / x)}" for x, y in zip(xs, ys)) + ". No son iguales: no es proporcional.")]
    return mk(f"¿Es de proporcionalidad directa esta tabla? {tabla_txt(zip(xs, ys))}", NO, "t3_prop_reconocer", {"xs": xs, "ys": [D(y) for y in ys]},
              [(f"Sí: siempre suma {dnum(ys[1] - ys[0])}" if d == 1 else f"{SI}: cuando una crece, la otra también", "E02" if d == 1 else "E01"),
               (f"{SI}: cuando una crece, la otra también", "E01") if d == 1 else ("No: es de proporcionalidad inversa", "E03"), (f"{SI} (constante {dnum(F(ys[0]) / xs[0])})", None)], pasos,
              "Para que sea directa, el cociente tiene que ser constante; que aumente siempre lo mismo (diferencia constante) no basta.", datos={"opciones_fijas": True})


OBJ_PRECIO = [("cuadernos", "cuestan"), ("kilos de manzanas", "cuestan"), ("bolígrafos", "cuestan"), ("entradas", "cuestan"), ("litros de zumo", "cuestan"), ("metros de cable", "cuestan")]


@generador("t3_prop_02")
def gen_prop_02(rng, d):
    for _ in range(100):
        a = rng.randint(2, 12)
        u = F(rng.randint(2, 30)) if d == 1 else F(rng.randint(105, 995), 100) if d == 2 else F(rng.randint(12, 250), 10)
        c = rng.randint(2, 20)
        if c == a:
            continue
        b, r = a * u, c * u
        if ndec(b) <= 2 and ndec(r) <= 2:
            break
    if d == 3:
        xs = sorted(rng.sample(range(1, 15), 3))
        if c in xs:
            c = max(xs) + 1
        pares = [(x, x * u) for x in xs]
        r = c * u
        pasos = [("constante", dnum(u), f"Constante de proporcionalidad: {dnum(pares[0][1])} : {xs[0]} = {dnum(u)}."),
                 (f"{c} × {dnum(u)}", dnum(r), f"El valor que falta: {c} × {dnum(u)} = {dnum(r)}.")]
        return mk(f"Completa la tabla de proporcionalidad directa: {tabla_txt(pares)}; {c} → ?", dnum(r), "t3_prop_tabla", {"pares": [[x, D(y)] for x, y in pares], "x": c},
                  [(dnum(pares[-1][1] + (c - xs[-1])), "E01"), (dnum(u), "E03"), (dnum(r + u), None)], pasos,
                  "En una tabla de proporcionalidad directa todos los pares tienen el mismo cociente: se halla y se multiplica.",
                  genericos=[dnum(r - u), dnum(r * 2)])
    o, v = rng.choice(OBJ_PRECIO)
    pasos = [("valor unitario", eur(u), f"Reduzco a la unidad: {eur(b)} : {a} = {eur(u)} cada uno."),
             (f"{c} × {dnum(u)}", eur(r), f"Para {c}: {c} × {dnum(u)} = {eur(r)}.")]
    return mk(f"Si {a} {o} {v} {eur(b)}, ¿cuánto {v} {c} {o}?", eur(r), "t3_prop_unidad", {"a": a, "b": D(b), "c": c},
              [(eur(b + (c - a)) if b + (c - a) > 0 else None, "E01"), (eur(redondear(F(a) / b * c, 2)), "E02"), (eur(u), "E03")], pasos,
              "Reducción a la unidad: primero lo que corresponde a 1 (dividiendo) y después se multiplica.",
              genericos=[eur(r + u), eur(r - u)])


@generador("t3_prop_03")
def gen_prop_03(rng, d):
    if d == 1:
        E = rng.choice([50, 100, 200, 250, 500, 1000])
        pl = rng.randint(2, 20)
        real = F(pl * E, 100)
        pasos = [("× escala", f"{fmt(pl * E)} cm", f"Cada cm del plano son {E} cm reales: {pl} × {E} = {fmt(pl * E)} cm."),
                 ("a metros", f"{dnum(real)} m", f"{fmt(pl * E)} cm = {dnum(real)} m.")]
        return mk(f"En un plano a escala 1:{fmt(E)}, una pared mide {pl} cm. ¿Cuánto mide en la realidad?", f"{dnum(real)} m", "t3_escala", {"E": E, "plano": pl},
                  [(f"{dnum(F(pl, E) / 100)} m", "E01"), (f"{fmt(pl * E)} m", "E02"), (f"{dnum(real / 10)} m", None)], pasos,
                  "Escala 1:n: 1 cm del plano son n cm reales. Después se cambia de unidad.", genericos=[f"{dnum(real * 10)} m"])
    if d == 2:
        E = rng.choice([10000, 20000, 25000, 50000, 100000, 200000, 250000, 500000, 1000000])
        pl = F(rng.randint(10, 150), 10)
        km = pl * E / 100000
        if ndec(km) > 3:
            return None
        pasos = [("× escala", f"{D(pl * E)} cm", f"{D(pl)} cm × {fmt(E)} = {D(pl * E)} cm reales."),
                 ("a km", f"{D(km)} km", f"1 km = 100 000 cm: {D(pl * E)} cm = {D(km)} km.")]
        return mk(f"En un mapa a escala 1:{fmt(E)}, dos pueblos están a {D(pl)} cm. ¿Qué distancia real los separa?", f"{D(km)} km", "t3_escala", {"E": E, "plano": D(pl)},
                  [(f"{D(pl * E)} km", "E02"), (f"{D(km * 10)} km", "E02"), (f"{D(pl / E, 8) if False else dnum(pl * E / 1000)} km", None)], pasos,
                  "Distancia real = distancia en el mapa × escala; después se pasa de cm a km (÷ 100 000).", genericos=[f"{D(km / 10)} km"])
    E = rng.choice([50, 100, 200, 500, 1000, 2000, 5000])
    pl = rng.randint(2, 15)
    real_m = F(pl * E, 100)
    pasos = [("a cm", f"{fmt(pl * E)} cm", f"Paso la medida real a cm: {dnum(real_m)} m = {fmt(pl * E)} cm."),
             ("escala", f"1:{fmt(E)}", f"{pl} cm del plano son {fmt(pl * E)} cm reales: 1 cm son {fmt(pl * E)} : {pl} = {fmt(E)} cm. Escala 1:{fmt(E)}.")]
    return mk(f"En un plano, {pl} cm representan {dnum(real_m)} m reales. ¿Cuál es la escala?", f"1:{fmt(E)}", "t3_escala", {"plano": pl, "real_m": D(real_m)},
              [(f"{fmt(E)}:1", "E03"), (f"1:{dnum(F(E, 100))}", "E02"), (f"1:{fmt(pl * E)}", None)], pasos,
              "Para hallar la escala, las dos medidas en la misma unidad; escala = 1 : (real/plano).", genericos=[f"1:{fmt(E * 10)}"])


@generador("t3_prop_04")
def gen_prop_04(rng, d):
    if d == 1:
        for _ in range(100):
            a, b = rng.randint(2, 30), rng.randint(2, 30)
            if a != b and math.gcd(a, b) > 1:
                break
        g = math.gcd(a, b)
        grupo = rng.choice([("chicos", "chicas", "clase"), ("perros", "gatos", "refugio"), ("rojas", "azules", "caja")])
        resp = f"{a // g}/{b // g}"
        pasos = [("razón a/b", f"{a}/{b}", f"Razón de {grupo[0]} a {grupo[1]}: {a}/{b} (primero lo que se nombra primero)."),
                 ("simplificar", resp, f"Simplifico: {resp}.")]
        return mk(f"En una {grupo[2]} hay {a} {grupo[0]} y {b} {grupo[1]}. ¿Cuál es la razón (simplificada) entre {grupo[0]} y {grupo[1]}?", resp, "t3_razon", {"a": a, "b": b},
                  [(f"{b // g}/{a // g}", "E01"), (f"{a // g}/{(a + b) // g}" if (a + b) % g == 0 else f"{a}/{a + b}", None), (f"{a - b}/{b}" if a > b else f"{a}/{b - a}", None)], pasos,
                  "La razón a/b compara la primera cantidad con la segunda, en ese orden.")
    if d == 2:
        a, b = rng.randint(2, 12), rng.randint(2, 12)
        k = rng.randint(2, 5)
        es = rng.random() < 0.5
        c, dd = (a * k, b * k) if es else (a + k, b + k)
        OP = {True: f"Sí, porque {a} · {dd} = {b} · {c}", False: f"No, porque {a} · {dd} ≠ {b} · {c}"}
        if a == b:
            return None
        resp = OP[es]
        pasos = [("productos cruzados", resp, f"{a} · {dd} = {a * dd} y {b} · {c} = {b * c}: {'iguales, forman proporción' if es else 'distintos, no forman proporción'}.")]
        return mk(f"¿Forman proporción {a}/{b} y {c}/{dd}?", resp, "t3_proporcion", {"a": a, "b": b, "c": c, "d": dd},
                  [(OP[not es], None), (f"Sí, porque {b} − {a} = {dd} − {c}" if not es else f"No, porque {b} − {a} ≠ {dd} − {c}", "E03" if not es else None), ("Solo si los cuatro números son pares", None)], pasos,
                  "a/b = c/d forman proporción si a·d = b·c (productos cruzados). Las diferencias no sirven.", datos={"opciones_fijas": True})
    for _ in range(100):
        b = F(rng.randint(2, 20)) if rng.random() < 0.6 else F(rng.randint(15, 95), 10)
        c, dd = rng.randint(2, 30), rng.randint(2, 30)
        x = b * c / dd
        if c != dd and ndec(x) <= 2 and x.denominator != 3:
            break
    pasos = [("productos cruzados", f"x · {dd} = {dnum(b)} · {c}", f"x/{dnum(b)} = {c}/{dd} → x · {dd} = {dnum(b)} · {c} = {dnum(b * c)}."),
             ("despejar", dnum(x), f"x = {dnum(b * c)} : {dd} = {dnum(x)}.")]
    return mk(f"Calcula x en la proporción x/{dnum(b)} = {c}/{dd}.", dnum(x), "t3_proporcion", {"b": D(b), "c": c, "d": dd},
              [(dnum(b * dd / c), "E02"), (dnum(F(c * dd) / b), None), (dnum(b + c - dd) if b + c - dd > 0 else dnum(x + 1), None)], pasos,
              "Cuarto proporcional: productos cruzados (a·d = b·c) y se despeja.", genericos=[dnum(x * 2), dnum(x + 1)])


CTX_DIR = [("Si {a} kg de {o} cuestan {b} €, ¿cuánto cuestan {c} kg?", "€", ["peras", "fresas", "queso", "café"]),
           ("Un coche recorre {b} km en {a} horas a velocidad constante. ¿Cuántos km recorre en {c} horas?", "km", [""]),
           ("Una receta para {a} personas lleva {b} g de harina. ¿Cuánta harina hace falta para {c} personas?", "g", [""]),
           ("Un grifo echa {b} litros en {a} minutos. ¿Cuántos litros echa en {c} minutos?", "l", [""])]


@generador("t3_prop_05")
def gen_prop_05(rng, d):
    if d == 3:
        for _ in range(100):
            tasa = rng.choice([F(108, 100), F(112, 100), F(85, 100), F(125, 100), F(150, 100), F(90, 100)])
            X = rng.randint(20, 600)
            eu = X / tasa
            if ndec(redondear(eu, 2)) <= 2:
                break
        mon = "$" if tasa > 1 else "£"
        eu2 = redondear(eu, 2)
        pasos = [("regla de tres", f"x = {X} · 1 / {D(tasa)}", f"1 € → {D(tasa)} {mon}; x € → {X} {mon}. x = {X} : {D(tasa)}."),
                 ("resultado", eur(eu2), f"x ≈ {eur(eu2)}.")]
        return mk(f"Si 1 € = {D(tasa)} {mon}, ¿cuántos euros son {X} {mon}? (Redondea a los céntimos.)", eur(eu2), "t3_regla3_directa", {"tasa": D(tasa), "X": X},
                  [(eur(redondear(X * tasa, 2)), "E03"), (eur(redondear(eu * 10, 2)), None), (eur(X), None)], pasos,
                  "Con divisas, se plantea la regla de tres y se comprueba el sentido: si 1 € vale más de 1 $, habrá menos euros que dólares.",
                  genericos=[eur(eu2 + 1), eur(eu2 - 1)])
    for _ in range(100):
        a = rng.randint(2, 12)
        u = F(rng.randint(2, 40)) if d == 1 else F(rng.randint(15, 95), 10)
        c = rng.randint(2, 20)
        b, r = a * u, c * u
        if c != a and ndec(b) <= 2 and ndec(r) <= 2 and ndec(F(a * c) / b) <= 6:
            break
    plant, un, objs = rng.choice(CTX_DIR)
    enun = plant.format(a=a, b=dnum(b), c=c, o=rng.choice(objs))
    e01 = F(a * c) / b
    e02 = b * a / c
    pasos = [("proporción", f"{a}/{dnum(b)} = {c}/x", f"Es directa (más cantidad, más {un}): {a} → {dnum(b)}; {c} → x."),
             ("x = b·c/a", f"{dnum(r)} {un}", f"x = {dnum(b)} · {c} / {a} = {dnum(r)} {un}.")]
    return mk(enun, f"{dnum(r)} {un}", "t3_regla3_directa", {"a": a, "b": D(b), "c": c},
              [(f"{dnum(e01)} {un}", "E01"), (f"{dnum(e02)} {un}" if e02 != r else None, "E02"), (f"{dnum(b + c - a)} {un}" if b + c - a > 0 else None, None)], pasos,
              "Regla de tres directa: x = b · c / a. Se comprueba que el resultado tiene sentido (más cantidad → más precio).",
              genericos=[f"{dnum(r + u)} {un}", f"{dnum(r * 2)} {un}"])


@generador("t3_prop_06")
def gen_prop_06(rng, d):
    for _ in range(100):
        K = rng.choice([12, 24, 36, 48, 60, 72, 120, 180, 240, 360])
        divs = [x for x in range(1, K + 1) if K % x == 0 and x <= 30]
        xs = sorted(rng.sample(divs, 3))
        if len(set(xs)) == 3:
            break
    pares = [(x, K // x) for x in xs]
    if d == 1:
        inv = rng.random() < 0.5
        if inv:
            pasos = [("productos", str(K), "Multiplico cada pareja: " + ", ".join(f"{x} · {y} = {x * y}" for x, y in pares) + f". El producto es constante ({K}): inversa.")]
            return mk(f"¿Qué tipo de relación hay en esta tabla? {tabla_txt(pares)}", "Proporcionalidad inversa", "t3_prop_inv", {"pares": pares},
                      [("Proporcionalidad directa", None), ("No son proporcionales", None), ("Proporcionalidad inversa solo en los dos primeros valores", None)], pasos,
                      "Inversa: el producto x·y es constante (al doble, la mitad).", datos={"opciones_fijas": True})
        a0 = rng.randint(1, 3)
        y0 = rng.randint(12, 30)
        st = rng.randint(1, 3)
        pares = [(a0 + i, y0 - st * 2 * i) for i in range(3)]
        pasos = [("productos", "No", "Multiplico cada pareja: " + ", ".join(f"{x} · {y} = {x * y}" for x, y in pares) + ". No es constante: no es inversa (disminuye, pero restando siempre lo mismo).")]
        return mk(f"¿Qué tipo de relación hay en esta tabla? {tabla_txt(pares)}", "No son proporcionales", "t3_prop_inv", {"pares": pares},
                  [("Proporcionalidad inversa", "E01"), ("Proporcionalidad directa", None), ("Proporcionalidad inversa solo en los dos primeros valores", None)], pasos,
                  "Que una magnitud baje cuando la otra sube no basta: en la inversa el producto es constante.", datos={"opciones_fijas": True})
    x0, y0 = pares[0]
    nuevo = rng.choice([x for x in range(1, 61) if K % x == 0 and x not in xs and K // x > 0] or [None])
    if nuevo is None:
        return None
    r = K // nuevo
    base = pares[:2] if d == 2 else pares
    pasos = [("constante", str(K), f"El producto es constante: {x0} · {y0} = {K}."),
             (f"{K} : {nuevo}", str(r), f"Para {nuevo}: {K} : {nuevo} = {r}.")]
    return mk(f"Completa la tabla de proporcionalidad inversa: {tabla_txt(base)}; {nuevo} → ?", str(r), "t3_prop_inv", {"pares": base, "x": nuevo},
              [(dnum(F(y0 * nuevo, x0)), "E02"), (str(y0 - (nuevo - x0)) if y0 - (nuevo - x0) > 0 and y0 - (nuevo - x0) != r else None, "E03"), (str(r + 1), None), (str(r * 2), None)], pasos,
              "En la proporcionalidad inversa se multiplica cada pareja: siempre da lo mismo. El valor que falta es constante : x.")


CTX_INV = [("{a} obreros tardan {b} días en hacer una obra. ¿Cuántos días tardarían {c} obreros?", "días"),
           ("{a} grifos iguales llenan un depósito en {b} horas. ¿Cuántas horas tardarían {c} grifos?", "horas"),
           ("Con {a} máquinas iguales se hace un pedido en {b} horas. ¿Cuántas horas se tarda con {c} máquinas?", "horas"),
           ("Un pienso alcanza para {a} caballos durante {b} días. ¿Para cuántos días alcanza si hay {c} caballos?", "días")]


@generador("t3_prop_07")
def gen_prop_07(rng, d):
    if d == 3:
        for _ in range(200):
            v1, v2 = rng.choice([60, 72, 80, 90, 100, 120]), rng.choice([60, 72, 80, 90, 100, 120])
            mins = rng.choice([75, 90, 105, 135, 150, 165, 45, 100])
            dist_ = F(v1 * mins, 60)
            t2 = dist_ / v2 * 60
            if v1 != v2 and t2.denominator == 1 and t2 > 0:
                break
        else:
            return None
        h1 = f"{mins // 60} h {mins % 60} min" if mins % 60 else f"{mins // 60} h"
        t2 = int(t2)
        h2 = f"{t2 // 60} h {t2 % 60} min" if t2 % 60 else f"{t2 // 60} h"
        if t2 < 60:
            h2 = f"{t2} min"
        if mins < 60:
            h1 = f"{mins} min"
        mal = F(mins // 60) + F(mins % 60, 100)
        e02 = mal * v1 / v2
        e02t = f"{D(e02, 2)} h"
        pasos = [("a minutos", f"{mins} min", f"Paso el tiempo a minutos: {h1} = {mins} min."),
                 ("inversa", f"{mins} · {v1} / {v2}", f"A más velocidad, menos tiempo (inversa): t = {mins} · {v1} / {v2} = {t2} min."),
                 ("resultado", h2, f"{t2} min = {h2}.")]
        return mk(f"A {v1} km/h, un viaje dura {h1}. ¿Cuánto dura a {v2} km/h?", h2, "t3_regla3_inversa", {"v1": v1, "v2": v2, "min": mins},
                  [(e02t, "E02"), ((lambda t: f"{t // 60} h {t % 60} min" if t % 60 else f"{t // 60} h")(int(round(mins * v2 / v1))) if (mins * v2) % v1 == 0 else None, "E01"),
                   ((lambda t: f"{t // 60} h {t % 60} min" if t % 60 else f"{t // 60} h")(mins + 15), None)], pasos,
                  "Velocidad y tiempo son inversamente proporcionales; conviene pasar horas y minutos a minutos antes de operar.",
                  genericos=[(lambda t: f"{t // 60} h {t % 60} min" if t % 60 else f"{t // 60} h")(t2 + 10)])
    for _ in range(100):
        a = rng.randint(2, 12)
        c = rng.randint(2, 15)
        b = rng.randint(2, 30)
        r = F(a * b, c)
        if c != a and r.denominator == 1:
            break
    plant, un = rng.choice(CTX_INV)
    e01 = F(b * c, a)
    e03 = F(a, b) * c
    pasos = [("¿directa o inversa?", "inversa", "Más " + ("obreros" if "obreros" in plant else "caballos" if "caballos" in plant else "grifos" if "grifos" in plant else "máquinas") + f" → menos {un}: es inversa."),
             ("x = a·b/c", f"{fmt(int(r))} {un}", f"Multiplico los datos de la misma fila y divido: x = {a} · {b} / {c} = {fmt(int(r))} {un}.")]
    return mk(plant.format(a=a, b=b, c=c), f"{fmt(int(r))} {un}", "t3_regla3_inversa", {"a": a, "b": b, "c": c},
              [(f"{dnum(e01)} {un}", "E01"), (f"{dnum(e03)} {un}" if e03 != r and ndec(e03) <= 2 else None, "E03"), (f"{b + a - c} {un}" if b + a - c > 0 and b + a - c != r else None, None)], pasos,
              "Regla de tres inversa: x = a · b / c (se multiplican los datos de la misma fila).",
              genericos=[f"{fmt(int(r) + 1)} {un}", f"{fmt(int(r) * 2)} {un}", f"{fmt(b)} {un}"])


def reparto_txt(vals, un="€"):
    vs = [dnum(v) for v in vals]
    return (", ".join(vs[:-1]) + " y " + vs[-1]) + (f" {un}" if un else "")


@generador("t3_prop_08")
def gen_prop_08(rng, d):
    k = 2 if d == 1 else 3 if d == 2 else rng.choice([3, 4])
    for _ in range(200):
        ps = [rng.randint(1, 9) for _ in range(k)]
        if len(set(ps)) < k:
            continue
        u = rng.randint(2, 60) * (5 if d > 1 else 1)
        N = u * sum(ps)
        break
    partes_ = [u * p for p in ps]
    rev = [u * p for p in sorted(ps, reverse=True)]
    orden_ps = sorted(range(k), key=lambda i: ps[i])
    rev = [0] * k
    srt = sorted(ps)
    for i, idx in enumerate(orden_ps):
        rev[idx] = u * srt[k - 1 - i]
    e02 = [F(N, p) for p in ps]
    quien = rng.choice(["tres amigos" if k == 3 else "dos hermanas" if k == 2 else "cuatro socios"])
    pasos = [("suma", str(sum(ps)), f"Sumo los números: {' + '.join(map(str, ps))} = {sum(ps)}."),
             ("parte unitaria", str(u), f"{fmt(N)} : {sum(ps)} = {u} € por cada unidad."),
             ("multiplicar", reparto_txt(partes_), "Multiplico por cada número: " + ", ".join(f"{u} · {p} = {u * p}" for p in ps) + ".")]
    return mk(f"Reparte {fmt(N)} € entre {quien} de forma directamente proporcional a {reparto_txt(ps, '')}.", reparto_txt(partes_), "t3_reparto_directo", {"N": N, "ps": ps},
              [(reparto_txt([F(N, k)] * k) if N % k == 0 else reparto_txt([redondear(F(N, k), 2)] * k), "E01"), (reparto_txt(e02) if all(ndec(x) <= 2 for x in e02) else reparto_txt([redondear(x, 2) for x in e02]), "E02"),
               (reparto_txt(rev), "E03")], pasos,
              "Reparto directo: se divide la cantidad entre la suma de los números y se multiplica por cada uno. Quien tiene más, recibe más.",
              genericos=[reparto_txt([x + 10 for x in partes_])])


@generador("t3_prop_09")
def gen_prop_09(rng, d):
    k = 2 if d == 1 else 3
    for _ in range(300):
        ps = sorted(rng.sample(range(2, 13), k))
        m = math.lcm(*ps)
        ws = [m // p for p in ps]
        u = rng.randint(2, 40) * (10 if d == 3 else 5)
        N = u * sum(ws)
        if N <= 20000:
            break
    partes_ = [u * w for w in ws]
    sd = sum(ps)
    directo = [F(N * p, sd) for p in ps]
    e02 = list(reversed(sorted(directo)))
    inv_sum_mal = F(k, sum(ps))  # suma de inversos mal (1/a + 1/b = 2/(a+b))
    pasos = [("inversos", " + ".join(f"1/{p}" for p in ps), f"Reparto inverso a {reparto_txt(ps, '')} = reparto directo a sus inversos " + ", ".join(f"1/{p}" for p in ps) + "."),
             ("común denominador", ", ".join(f"{w}/{m}" for w in ws), f"Con denominador {m}: " + ", ".join(f"{w}/{m}" for w in ws) + f". Reparto directo a {reparto_txt(ws, '')}."),
             ("repartir", reparto_txt(partes_), f"{fmt(N)} : {sum(ws)} = {u}; partes: " + ", ".join(f"{u} · {w} = {u * w}" for w in ws) + ".")]
    return mk(f"Reparte {fmt(N)} € en partes inversamente proporcionales a {reparto_txt(ps, '')}.", reparto_txt(partes_), "t3_reparto_inverso", {"N": N, "ps": ps},
              [(reparto_txt([redondear(x, 2) for x in directo]), "E01"), (reparto_txt([redondear(x, 2) for x in e02]) if e02 != directo and [redondear(x, 2) for x in e02] != partes_ else None, "E02"),
               (reparto_txt([redondear(N * F(1, p) / inv_sum_mal, 2) for p in ps]) if k == 3 else None, "E03"), (reparto_txt([F(N, k)] * k) if N % k == 0 else None, None)], pasos,
              "Inverso: al número más pequeño le toca más. Se reparte directamente proporcional a los inversos 1/a, 1/b…",
              genericos=[reparto_txt([x + 10 for x in partes_])])


CTX_COMP = [("{m1} máquinas iguales, trabajando {h1} horas, fabrican {p1} piezas. ¿Cuántas piezas fabrican {m2} máquinas en {h2} horas?", ("d", "d"), "piezas"),
            ("{m1} obreros, trabajando {h1} horas al día, tardan {p1} días en una obra. ¿Cuántos días tardarán {m2} obreros trabajando {h2} horas al día?", ("i", "i"), "días"),
            ("{m1} grifos abiertos {h1} horas echan {p1} litros. ¿Cuántos litros echan {m2} grifos en {h2} horas?", ("d", "d"), "litros"),
            ("{m1} personas consumen {p1} kg de comida en {h1} días. ¿Cuántos kg consumirán {m2} personas en {h2} días?", ("d", "d"), "kg"),
            ("{m1} impresoras imprimen un lote en {p1} minutos imprimiendo {h1} páginas por minuto cada una... ", None, None)]


@generador("t3_prop_10")
def gen_prop_10(rng, d):
    for _ in range(300):
        plant, rel, un = rng.choice(CTX_COMP[:4])
        m1, m2 = rng.randint(2, 12), rng.randint(2, 12)
        h1, h2 = rng.randint(2, 10), rng.randint(2, 10)
        if m1 == m2 or h1 == h2:
            continue
        p1 = rng.randint(2, 60) * (5 if rel == ("d", "d") else 1)
        if rel == ("d", "d"):
            x = F(p1 * m2 * h2, m1 * h1)
            todas_dir = x
            inv_una = F(p1 * m1 * h2, m2 * h1)
            suma = F(p1 * m2, m1) + F(p1 * h2, h1)
        else:
            x = F(p1 * m1 * h1, m2 * h2)
            todas_dir = F(p1 * m2 * h2, m1 * h1)
            inv_una = F(p1 * m2 * h1, m1 * h2)
            suma = F(p1 * m1, m2) + F(p1 * h1, h2)
        if x.denominator == 1 and x > 0:
            break
    else:
        return None
    enun = plant.format(m1=m1, h1=h1, p1=p1, m2=m2, h2=h2)
    if rel == ("d", "d"):
        pasos = [("relaciones", "directa, directa", f"Más {'máquinas/grifos/personas'.split('/')[0] if 'máquinas' in plant else 'grifos' if 'grifos' in plant else 'personas'} → más {un}; más tiempo → más {un}: las dos directas."),
                 ("reducción a la unidad", dnum(F(p1, m1 * h1)), f"1 en 1: {p1} : ({m1} · {h1}) = {dnum(F(p1, m1 * h1)) if es_dec(F(p1, m1 * h1), 4) else fr(F(p1, m1 * h1))}."),
                 ("multiplicar", f"{fmt(int(x))} {un}", f"Para {m2} y {h2}: × {m2} × {h2} = {fmt(int(x))} {un}.")]
    else:
        pasos = [("relaciones", "inversa, inversa", "Más obreros → menos días; más horas al día → menos días: las dos inversas."),
                 ("días totales de 1 obrero a 1 h", str(p1 * m1 * h1), f"{m1} · {h1} · {p1} = {p1 * m1 * h1} (horas de trabajo en total)."),
                 ("dividir", f"{fmt(int(x))} {un}", f"{p1 * m1 * h1} : ({m2} · {h2}) = {fmt(int(x))} {un}.")]
    f_ = lambda v: f"{dnum(v) if ndec(v) <= 2 else D(v, 2)} {un}"
    return mk(enun, f"{fmt(int(x))} {un}", "t3_regla3_compuesta", {"m1": m1, "h1": h1, "p1": p1, "m2": m2, "h2": h2},
              [(f_(todas_dir) if todas_dir != x else None, "E01"), (f_(suma), "E02"), (f_(inv_una) if inv_una != x else None, "E03")], pasos,
              "Regla de tres compuesta: se analiza cada magnitud con la incógnita por separado (directa o inversa) y se combinan por reducción a la unidad.",
              genericos=[f_(x + 1), f_(x * 2)])
