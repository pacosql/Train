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
            if nd > 30:
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
    """Número de cifras decimales (99 si no es un decimal exacto)."""
    x = F(x)
    k = 0
    while (x * 10 ** k).denominator != 1:
        k += 1
        if k > 14:
            return 99
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
    num = "" if c.numerator == 1 else str(c.numerator) + ("·" if idx > 2 else "")
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
    pasos = [(o, r, t.replace("….", "…").replace("-1·", "−1·").replace("(-", "(−")) for o, r, t in pasos]
    ej.enunciado = ej.enunciado.replace("….", "…")
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
        pide_im = rng.random() < 0.5
        a, b = (abs(a), b) if pide_im else (a, abs(b))
        z = cx(a, b)
        if pide_im:
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
    return mk(f"Calcula i^{ntxt}." if n >= 0 else f"Calcula i^{ntxt} (exponente negativo).", resp, "t3_c_poti", {"n": n},
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
    a, b = rng.randint(1, 5), rng.choice([x for x in range(-5, 6) if x])
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
        ang = rng.choice([45, 135]) if n % 4 else 45
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
    return mk(f"¿Cómo quedan ordenados de menor a mayor estos números: {'; '.join(txt)}?", resp, "t3_dec_ordenar", {"nums": txt},
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
    return mk(f"Busca un número decimal mayor que {D(a)} y menor que {D(b)}.", D(m), "t3_dec_entre", {"a": D(a), "b": D(b)},
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
    return mk(f"¿Cómo quedan ordenados de menor a mayor estos números: {', '.join(txt)}?", resp, "t3_frac_ord_hom", {"nums": nums, "d": den},
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
    return mk(f"¿Cómo quedan ordenados de mayor a menor estos números: {', '.join(txt)}?", resp, "t3_frac_ord_num", {"n": n, "dens": dens},
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
    return mk(f"¿Cómo quedan ordenados de menor a mayor estos números: {txt}?", resp, "t3_frac_ord", {"fracs": [fr_raw(*f) for f in fs]},
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
        signo = ["num", "den", "delante"][(N + Dn) % 3]
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
    return mk(f"¿Cómo quedan ordenados de menor a mayor estos números: {', '.join(fr(x) for x in fs)}?", resp, "t3_racional_ord", {"fracs": [fr(x) for x in fs]},
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
    enun = f"Calcula: {txt}" if d == 1 else f"Calcula la potencia de base negativa: {txt}" if txt.startswith("(−") else f"Calcula (el signo menos está fuera del paréntesis): {txt}"
    return mk(enun, fr(val), "t3_ofrac_pot", {"a": a, "b": b, "n": n, "expr": txt},
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
        enun = rng.choice([f"¿Qué porcentaje es {fr(f_)} de una cantidad?", f"¿A qué porcentaje equivale la fracción {fr(f_)}?",
                           f"Coger {fr(f_)} de una tarta es coger el … % de la tarta. ¿Qué porcentaje es?"])
        return mk(enun, f"{p} %", "t3_porc_equiv", {"f": fr(f_), "p": p},
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
        return mk(f"Calcula el {D(p)} % de {fmt(N)}.", dnum(r), "t3_porc_menor1", {"p": D(p), "N": N},
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
              [(eur(redondear(e01, 2)), "E03" if tipo == "iva" else "E01"), (eur(redondear(Fi * idx, 2)), "E02"), (eur(redondear(Fi + I * F(p, 100), 2)) if tipo == "iva" else None, None)], pasos,
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
    ip = dnum(i * 100, 4)
    pasos = [("rédito por periodo", ip + " %", f"El {D(r)} % anual{cap} da un rédito por periodo de {D(r)}/{k} = {ip} %." if k > 1 else f"Rédito anual: {D(r)} %."),
             ("periodos", str(k * t), f"Número de periodos: {k} · {t} = {k * t}."),
             ("Cf = C(1 + i)ⁿ", eur(redondear(Cf, 2)), f"Cf = {fmt(C)} · (1 + {dnum(i, 6)})^{k * t} ≈ {eur(redondear(Cf, 2))}.")]
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


SIT_PROP = [("Kilos de naranjas comprados en una frutería con precio fijo por kilo y euros pagados", "d"), ("Número de entradas de cine compradas y dinero total gastado", "d"),
            ("Litros de gasolina echados al depósito y euros que cuestan", "d"), ("Horas trabajadas y dinero cobrado, si se paga siempre lo mismo por hora", "d"),
            ("Metros de tela comprados y precio que se paga", "d"), ("Número de comensales y gramos de arroz de una paella", "d"),
            ("Altura de un niño y años que tiene", "n"), ("Kilómetros recorridos en taxi y precio, con bajada de bandera", "n1"),
            ("Meses de gimnasio y dinero pagado, si hay una cuota de inscripción", "n1"), ("Minutos hablados y factura del móvil, con una cuota fija mensual", "n1"),
            ("Número de pintores y días que tardan en pintar una casa", "i"), ("Velocidad de una moto y tiempo que tarda en un mismo recorrido", "i"),
            ("Peso de un bebé y meses de vida", "n"), ("Nota de un examen y horas de sueño la noche anterior", "n")]


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
        return mk(f"Magnitudes: {sit[0].lower() + sit[1:]}. ¿Son directamente proporcionales?", resp, "t3_prop_reconocer", {"situacion": sit}, dist, pasos,
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
    step = xs[1] - xs[0]
    xs = [xs[0], xs[0] + step, xs[0] + 2 * step]
    ys = [x * k + c for x in xs]
    pasos = [("cocientes", NO, "Divido cada valor de abajo entre el de arriba: " + ", ".join(f"{dnum(y)} : {x} = {dnum(F(y) / x)}" for x, y in zip(xs, ys)) + ". No son iguales: no es proporcional.")]
    return mk(f"¿Es de proporcionalidad directa esta tabla? {tabla_txt(zip(xs, ys))}", NO, "t3_prop_reconocer", {"xs": xs, "ys": [D(y) for y in ys]},
              [(f"Sí: siempre suma {dnum(ys[1] - ys[0])}", "E02"), (f"{SI}: cuando una crece, la otra también", "E01"), (f"{SI} (constante {dnum(F(ys[0]) / xs[0])})", None)], pasos,
              "Para que sea directa, el cociente tiene que ser constante; que aumente siempre lo mismo (diferencia constante) no basta.", datos={"opciones_fijas": True})


OBJ_PRECIO = [("cuadernos", "cuestan"), ("kilos de manzanas", "cuestan"), ("bolígrafos", "cuestan"), ("entradas", "cuestan"), ("litros de zumo", "cuestan"), ("metros de cable", "cuestan")]


@generador("t3_prop_02")
def gen_prop_02(rng, d):
    for _ in range(100):
        a = rng.randint(2, 12)
        u = F(rng.randint(2, 9)) if d == 1 else F(rng.randint(105, 995), 100) if d == 2 else F(rng.randint(12, 250), 10)
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
                  [(f"{D(F(pl, E) / 100)} m", "E01"), (f"{fmt(pl * E)} m", "E02"), (f"{dnum(real / 10)} m", None)], pasos,
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
        u = F(rng.randint(2, 12)) if d == 1 else F(rng.randint(15, 95), 10)
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
        if c != a and r.denominator == 1 and r > 1:
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
                 ("reducción a la unidad", dnum(F(p1, m1 * h1)), f"Reduzco a la unidad (1 y 1 unidad de tiempo): {p1} : ({m1} · {h1}) = {dnum(F(p1, m1 * h1)) if es_dec(F(p1, m1 * h1), 4) else fr(F(p1, m1 * h1))}."),
                 ("multiplicar", f"{fmt(int(x))} {un}", f"Para {m2} y {h2}: multiplico por {m2} y por {h2} → {fmt(int(x))} {un}.")]
    else:
        pasos = [("relaciones", "inversa, inversa", "Más obreros → menos días; más horas al día → menos días: las dos inversas."),
                 ("días totales de 1 obrero a 1 h", str(p1 * m1 * h1), f"{m1} · {h1} · {p1} = {p1 * m1 * h1} (horas de trabajo en total)."),
                 ("dividir", f"{fmt(int(x))} {un}", f"{p1 * m1 * h1} : ({m2} · {h2}) = {fmt(int(x))} {un}.")]
    f_ = lambda v: f"{dnum(v) if ndec(v) <= 2 else D(v, 2)} {un}"
    return mk(enun, f"{fmt(int(x))} {un}", "t3_regla3_compuesta", {"m1": m1, "h1": h1, "p1": p1, "m2": m2, "h2": h2},
              [(f_(todas_dir) if todas_dir != x else None, "E01"), (f_(suma), "E02"), (f_(inv_una) if inv_una != x else None, "E03")], pasos,
              "Regla de tres compuesta: se analiza cada magnitud con la incógnita por separado (directa o inversa) y se combinan por reducción a la unidad.",
              genericos=[f_(x + 1), f_(x * 2)])


# ---------------------------------------------------------------- NÚMEROS REALES

def sci(m, e):
    return f"{D(m)} · 10{sup(e)}"


def mantisa(rng, cifras):
    while True:
        m = F(rng.randint(10 ** (cifras - 1), 10 ** cifras - 1), 10 ** (cifras - 1))
        if cifras == 1 or m.numerator % 10:
            return m


@generador("t3_real_01")
def gen_real_01(rng, d):
    m = mantisa(rng, rng.randint(1, 3 if d < 3 else 4))
    if d == 1:
        e = rng.randint(3, 12)
    elif d == 2:
        e = -rng.randint(2, 9)
    else:
        e = rng.choice([rng.randint(4, 14), -rng.randint(3, 12)])
    x = m * F(10) ** e
    if d < 3:
        resp = sci(m, e)
        if e > 0:
            dist = [(sci(m, e - 1), "E02"), (sci(m * 10, e - 1), "E03"), (sci(m, -e), "E01")]
            txt = f"Muevo la coma {e} lugares a la izquierda para dejar una sola cifra no nula delante: {D(x)} = {resp}."
        else:
            dist = [(sci(m, -e), "E01"), (sci(m, e + 1), "E04"), (sci(m * 10, e - 1), "E03")]
            txt = f"Muevo la coma {-e} lugares a la derecha hasta la primera cifra no nula; el exponente es negativo: {D(x)} = {resp}."
        pasos = [("mantisa entre 1 y 10", D(m), f"La mantisa debe cumplir 1 ≤ a < 10: {D(m)}."), ("exponente", str(e), txt)]
        return mk(f"Escribe en notación científica: {D(x)}", resp, "t3_notacion_cientifica", {"x": D(x)}, dist, pasos,
                  "a · 10ⁿ con 1 ≤ a < 10. El exponente cuenta los lugares que se mueve la coma (positivo si el número es grande, negativo si es menor que 1).",
                  genericos=[sci(m, e + 2), sci(m / 10, e + 1)])
    resp = D(x)
    pasos = [("mover la coma", resp, f"10{sup(e)}: muevo la coma {abs(e)} lugares a la {'derecha' if e > 0 else 'izquierda'}: {resp}.")]
    return mk(f"Escribe en notación decimal: {sci(m, e)}", resp, "t3_notacion_cientifica", {"m": D(m), "e": e},
              [(D(m * F(10) ** (-e)), "E01"), (D(x * 10), "E02"), (D(x / 10), "E02")], pasos,
              "Exponente positivo: la coma va a la derecha (número grande); negativo: a la izquierda (número pequeño).")


def normaliza(m, e):
    m = F(m)
    while m >= 10:
        m /= 10
        e += 1
    while m < 1:
        m *= 10
        e -= 1
    return m, e


@generador("t3_real_02")
def gen_real_02(rng, d):
    for _ in range(100):
        a, b = mantisa(rng, rng.randint(1, 2)), mantisa(rng, 1 if d < 3 else rng.randint(1, 2))
        m, n = rng.randint(-9, 12), rng.randint(-9, 12)
        if d == 1:
            m, n = rng.randint(2, 9), rng.randint(2, 9)
        op = "·" if d == 1 or rng.random() < 0.5 else ":"
        if op == ":":
            q = a / b
            if not es_dec(q, 3):
                continue
            rm, re_ = normaliza(q, m - n)
            e01 = sci(q, m // n if n and m % n == 0 else m * n) if False else None
            e02 = sci(q, m - n) if q != rm else None
            e03 = sci(rm, re_ + 2 * n)
            e01 = None
        else:
            pr = a * b
            if d >= 2 and pr < 10:
                continue
            rm, re_ = normaliza(pr, m + n)
            e01 = sci(rm, re_ - (m + n) + m * n)
            e02 = sci(pr, m + n) if pr != rm else None
            e03 = None
        if ndec(rm) <= 4 and m != n:
            break
    else:
        return None
    resp = sci(rm, re_)
    t = f"({sci(a, m)}) {op} ({sci(b, n)})"
    pasos = [("mantisas", D(a * b if op == '·' else a / b), f"Opero las mantisas: {D(a)} {op} {D(b)} = {D(a * b if op == '·' else a / b)}."),
             ("exponentes", f"10{sup(m + n if op == '·' else m - n)}", f"{'Sumo' if op == '·' else 'Resto'} los exponentes: {m} {'+' if op == '·' else '−'} ({n}) = {m + n if op == '·' else m - n}."),
             ("ajustar", resp, f"Ajusto para que la mantisa esté entre 1 y 10: {resp}.")]
    return mk(f"Calcula y expresa en notación científica: {t}", resp, "t3_nc_multdiv", {"a": D(a), "m": m, "b": D(b), "n": n, "op": op},
              [(e01, "E01"), (e02, "E02"), (e03, "E03"), (sci(rm, re_ + 1), None), (sci(rm, re_ - 1), None)], pasos,
              "Producto: mantisas por mantisas y se SUMAN exponentes; cociente: se dividen y se RESTAN. Después se ajusta la mantisa.")


@generador("t3_real_03")
def gen_real_03(rng, d):
    for _ in range(100):
        a, b = mantisa(rng, rng.randint(1, 2)), mantisa(rng, rng.randint(1, 2))
        m = rng.randint(2, 9) if d < 3 else rng.randint(-8, 9)
        k = rng.randint(1, 2 if d == 1 else 3)
        n = m - k
        op = "+" if d == 1 or rng.random() < 0.5 else "−"
        v = a * F(10) ** m + (b if op == "+" else -b) * F(10) ** n
        if v <= 0:
            continue
        rm, re_ = normaliza(v / F(10) ** m, m)
        if ndec(rm) <= 5:
            break
    resp = sci(rm, re_)
    sg = 1 if op == "+" else -1
    e01 = normaliza(a + sg * b, m + n) if a + sg * b > 0 else None
    e02 = normaliza(a + sg * b, m) if a + sg * b > 0 else None
    e03 = normaliza(a + sg * b * F(10) ** k, m) if a + sg * b * F(10) ** k > 0 else None
    bb = b / F(10) ** k
    pasos = [("igualar exponentes", f"{D(bb)} · 10{sup(m)}", f"Escribo {sci(b, n)} con exponente {m}: {sci(bb, m)}."),
             ("operar mantisas", D(a + sg * bb), f"{D(a)} {op} {D(bb)} = {D(a + sg * bb)}; resultado {sci(a + sg * bb, m)}."),
             ("ajustar", resp, f"En notación científica: {resp}.")]
    return mk(f"Calcula y expresa en notación científica: {sci(a, m)} {op} {sci(b, n)}", resp, "t3_nc_suma", {"a": D(a), "m": m, "b": D(b), "n": n, "op": op},
              [(sci(*e01) if e01 else None, "E01"), (sci(*e02) if e02 and sci(*e02) != resp else None, "E02"), (sci(*e03) if e03 and sci(*e03) != resp else None, "E03"),
               (sci(rm, re_ + 1), None)], pasos,
              "Para sumar o restar hay que igualar primero los exponentes (o pasar a decimal); no se suman exponentes.")


IRR = [("π", "3,14159265…", F(314159265, 10 ** 8)), ("√2", "1,41421356…", F(141421356, 10 ** 8)), ("√3", "1,73205080…", F(173205080, 10 ** 8)),
       ("e", "2,71828182…", F(271828182, 10 ** 8)), ("√5", "2,23606797…", F(223606797, 10 ** 8)), ("√7", "2,64575131…", F(264575131, 10 ** 8)),
       ("φ", "1,61803398…", F(161803398, 10 ** 8))]


@generador("t3_real_04")
def gen_real_04(rng, d):
    if d == 1:
        o = rng.randint(1, 2)
        x = F(rng.randint(10 ** (o + 1), 10 ** (o + 3) - 1), 10 ** (o + 2))
        if ndec(x) <= o:
            return None
        txt = D(x)
    elif d == 2:
        nom, txt, x = rng.choice(IRR)
        o = rng.randint(1, 3)
    else:
        # redondeo encadenado: cifra siguiente 4 seguida de 5-9
        o = rng.randint(1, 3)
        base = rng.randint(1, 99) * 10 ** o + rng.randint(0, 10 ** o - 1)
        x = F(base * 100 + 40 + rng.randint(5, 9), 10 ** (o + 2))
        txt = D(x)
    metodo = rng.choice(["truncamiento", "redondeo", "exceso", "defecto"] if d > 1 else ["truncamiento", "redondeo"])
    tr, rd = truncar(x, o), redondear(x, o)
    ex = tr + F(1, 10 ** o) if tr != x else tr
    val = {"truncamiento": tr, "redondeo": rd, "exceso": ex, "defecto": tr}[metodo]
    frase = {"truncamiento": "por truncamiento", "redondeo": "por redondeo", "exceso": "por exceso", "defecto": "por defecto"}[metodo]
    resp = D(val, o)
    dist = []
    if metodo == "truncamiento" and rd != tr:
        dist.append((D(rd, o), "E01"))
    if metodo == "redondeo" and rd != tr:
        dist.append((D(tr, o), "E01"))
    if metodo == "exceso":
        dist.append((D(tr, o), "E03"))
    if metodo == "defecto":
        dist.append((D(ex, o), "E03"))
    if d == 3 and metodo == "redondeo":
        enc = redondear(redondear(x, o + 1), o)
        if enc != rd:
            dist.insert(0, (D(enc, o), "E02"))
    dist += [(D(val + F(1, 10 ** o), o), None), (D(val, o + 1) if False else D(redondear(x, o + 1), o + 1), None), (D(val, o - 1) if o > 1 else D(redondear(x, 0), 0), None)]
    expl = {"truncamiento": "Truncar es cortar: se eliminan las cifras siguientes sin mirar nada.",
            "redondeo": "Redondear: se mira SOLO la cifra siguiente; si es 5 o más, se sube.",
            "exceso": "Por exceso: la aproximación mayor que el número (se sube la última cifra que se conserva).",
            "defecto": "Por defecto: la aproximación menor que el número (se corta)."}[metodo]
    pasos = [("orden", ORD_NOMBRE[o], f"Me quedo hasta {ORD_NOMBRE[o]}. {expl}"), ("resultado", resp, f"{txt} → {resp}.")]
    enun = f"Aproxima {nom + ' = ' + txt if d == 2 else txt} a {ORD_NOMBRE[o]} {frase}."
    return mk(enun, resp, "t3_aproximar", {"x": txt, "orden": o, "metodo": metodo}, dist, pasos,
              "Truncar corta; redondear mira solo la cifra siguiente (sin redondear en cadena). Exceso: aproximación mayor; defecto: menor.")


@generador("t3_real_05")
def gen_real_05(rng, d):
    if d == 1:
        x = F(rng.randint(1000, 99999), 1000)
        o = rng.randint(1, 2)
        a = redondear(x, o)
        if a == x:
            return None
        Ea = abs(x - a)
        pasos = [("|real − aproximación|", D(Ea), f"Ea = |{D(x)} − {D(a)}| = {D(Ea)} (siempre positivo).")]
        return mk(f"El valor real de una medida es {D(x)} y se aproxima por {D(a)}. ¿Cuál es el error absoluto?", D(Ea), "t3_error", {"x": D(x), "a": D(a), "pide": "Ea"},
                  [("−" + D(Ea), "E01"), (D(Ea * 10), None), (D(Ea / 10), None), (D(Ea / x, 4) if ndec(Ea / x) > 4 else D(Ea / x), None)], pasos,
                  "El error absoluto es la diferencia en valor absoluto: nunca es negativo.", genericos=[D(Ea + F(1, 1000))])
    if d == 2:
        for _ in range(100):
            n, den = rng.randint(1, 30), rng.choice([3, 6, 7, 9, 11, 12])
            x = F(n, den)
            if x.denominator == 1:
                continue
            o = rng.randint(1, 2)
            a = redondear(x, o)
            Ea = abs(x - a)
            if Ea == 0:
                continue
            Er = Ea / x * 100
            break
        resp = pct(redondear(Er, 2), 2)
        pasos = [("Ea", fr(Ea), f"Ea = |{fr(x)} − {D(a)}| = {fr(Ea)} ≈ {D(Ea, 4)}."),
                 ("Er = Ea / real", resp, f"Er = Ea / {fr(x)} = {D(Ea / x, 4)} → en %: {resp}.")]
        return mk(f"Se aproxima {fr(x)} por {D(a)}. Calcula el error relativo en % (con dos decimales).", resp, "t3_error", {"x": fr(x), "a": D(a), "pide": "Er"},
                  [(pct(redondear(Ea / a * 100 * 10, 2), 2) if False else pct(redondear(a / Ea, 2), 2), "E02"), (pct(redondear(Ea * 100, 2), 2) if redondear(Ea * 100, 2) != redondear(Er, 2) else None, None),
                   (pct(redondear(Er / 100, 4), 4), None), (pct(redondear(Er * 10, 2), 2), None)], pasos,
                  "Error relativo = error absoluto / valor real (y × 100 para darlo en %).")
    # comparar aproximaciones
    for _ in range(100):
        L1 = rng.choice([1000, 2000, 5000, 10000, 500])
        e1 = rng.choice([1, 2, 5, 10])
        L2 = rng.choice([10, 20, 50, 5])
        e2 = rng.choice([F(1, 10), F(5, 10), F(1), F(2)])
        r1, r2 = F(e1, L1), F(e2, L2)
        if r1 != r2 and e1 > e2:
            break
    mejor = "La del edificio" if r1 < r2 else "La de la mesa"
    peor = "La de la mesa" if r1 < r2 else "La del edificio"
    pasos = [("errores relativos", f"{D(r1 * 100, 3)} % y {D(r2 * 100, 3)} %", f"Edificio: {e1}/{L1} = {D(r1 * 100, 3)} %; mesa: {D(e2)}/{L2} = {D(r2 * 100, 3)} %."),
             ("comparar", mejor, f"Es mejor la de menor error relativo: {mejor.lower()}.")]
    return mk(f"Se mide un edificio de {fmt(L1)} cm con un error de {e1} cm y una mesa de {L2} cm con un error de {D(e2)} cm. ¿Qué medida es de más calidad?", mejor, "t3_error_comp",
              {"L1": L1, "e1": e1, "L2": L2, "e2": D(e2)},
              [(peor, "E03" if (e1 > e2) == (r1 < r2) else None), ("Las dos igual", None), ("No se puede saber sin el valor real exacto", None)], pasos,
              "La calidad de una aproximación se compara con el error relativo, no con el absoluto.", datos={"opciones_fijas": True})


CONJ = {"N": "Natural", "Z": "Entero (no natural)", "Q": "Racional (no entero)", "I": "Irracional"}


def num_clasificar(rng, d):
    t = rng.choice(["N", "Z", "Q", "I"])
    if t == "N":
        k = rng.randint(2, 15)
        return rng.choice([(f"√{k * k}", "N", "E02"), (f"{k * rng.randint(2, 5)}/{0}", None, None), (str(k), "N", None), (f"{k * 3}/3", "N", None)])
    if t == "Z":
        k = rng.randint(2, 12)
        return rng.choice([(f"−{k}", "Z", None), (f"−√{k * k}", "Z", "E02"), (f"−{k * 4}/4", "Z", None)])
    if t == "Q":
        a, b = rng.randint(1, 9), rng.choice([3, 7, 9, 11])
        if math.gcd(a, b) != 1 or a == b:
            a = 1
        opts = [(puntos(F(a, b), 5), "Q", "E01"), (f"√({(a * a)}/{b * b})" if a != b else "√(1/4)", "Q", "E02"), (D(F(rng.randint(1, 99), 100)), "Q", None),
                (f"−{rng.choice([1, 2, 4, 5])}/{rng.choice([3, 7, 11, 13])}", "Q", None), (dec_periodico(F(a, b))[0], "Q", "E01")]
        return rng.choice(opts)
    k = rng.choice([2, 3, 5, 6, 7, 8, 10, 11, 12, 13])
    return rng.choice([(f"√{k}", "I", None), ("π", "I", "E03"), (f"{rng.randint(2, 5)}π", "I", "E03"), (f"1 + √{k}", "I", None), ("0,101001000100001…", "I", None),
                       (f"0,{rng.randint(1, 9)}{rng.randint(1, 9)}1{rng.randint(1, 9)}11{rng.randint(1, 9)}111…".replace("…", "… (cada vez un 1 más)"), "I", None)])


@generador("t3_real_06")
def gen_real_06(rng, d):
    if d == 3 and rng.random() < 0.6:
        k = rng.randint(2, 20)
        forma = rng.choice([f"−{k}", f"−{k * 2}/2", f"−√{k * k}"])
        resp = "Z, Q y R"
        pasos = [("conjuntos", resp, f"{forma} = −{k} es un entero negativo: no es natural, pero sí entero, racional (−{k} = −{k}/1) y real.")]
        return mk(f"¿A qué conjuntos pertenece {forma}?", resp, "t3_conjuntos", {"x": forma},
                  [("Z y R (no es racional)", "E04"), ("N, Z, Q y R", None), ("Solo a Z", None), ("I y R", None)], pasos,
                  "N ⊂ Z ⊂ Q ⊂ R: todo entero es racional (se puede escribir como fracción con denominador 1).", datos={"opciones_fijas": True})
    for _ in range(50):
        x, t, err = num_clasificar(rng, d)
        if t is None:
            continue
        if d == 1 and err is not None and rng.random() < 0.5:
            continue
        break
    x = ("la raíz " if x.lstrip("−").startswith("√") else "el número ") + x
    resp = CONJ[t]
    dist = []
    if err == "E01":
        dist.append((CONJ["I"], "E01"))
    if err == "E02":
        dist.append((CONJ["I"], "E02"))
    if err == "E03":
        dist.append((CONJ["Q"], "E03"))
    dist += [(v, None) for k_, v in CONJ.items() if k_ != t]
    expl = {"N": "Es un número natural (entero positivo), aunque esté escrito como raíz o fracción.",
            "Z": "Es un entero negativo: está en Z pero no en N.",
            "Q": "Se puede escribir como fracción (decimal exacto o periódico) y no es entero.",
            "I": "Tiene infinitas cifras decimales sin periodo: no se puede escribir como fracción."}[t]
    pasos = [("clasificar", resp, f"{x}: {expl}")]
    return mk(f"¿Cuál es el conjunto numérico más pequeño al que pertenece {x}?", resp, "t3_clasificar_real", {"x": x}, dist, pasos,
              "Decimal periódico → racional. Raíz exacta → racional (incluso natural). π y las raíces no exactas → irracionales.",
              datos={"opciones_fijas": True})


INF = None


def itxt(iv):
    a, ca, b, cb = iv
    L = "(−∞" if a is None else ("[" if ca else "(") + fmt(a)
    R = "+∞)" if b is None else fmt(b) + ("]" if cb else ")")
    return f"{L}, {R}"


def idesig(iv):
    a, ca, b, cb = iv
    if a is None:
        return f"x {'≤' if cb else '<'} {fmt(b)}"
    if b is None:
        return f"x {'≥' if ca else '>'} {fmt(a)}"
    return f"{fmt(a)} {'≤' if ca else '<'} x {'≤' if cb else '<'} {fmt(b)}"


def interseccion(p, q):
    a1, c1, b1, d1 = p
    a2, c2, b2, d2 = q
    if a1 is None or (a2 is not None and a2 > a1):
        a, ca = a2, c2
    elif a2 is None or a1 > a2:
        a, ca = a1, c1
    else:
        a, ca = a1, c1 and c2
    if b1 is None or (b2 is not None and b2 < b1):
        b, cb = b2, d2
    elif b2 is None or b1 < b2:
        b, cb = b1, d1
    else:
        b, cb = b1, d1 and d2
    if a is not None and b is not None and (a > b or (a == b and not (ca and cb))):
        return None
    return (a, ca, b, cb)


def union(p, q):
    a1, c1, b1, d1 = p
    a2, c2, b2, d2 = q
    if a1 is None or a2 is None:
        a, ca = None, False
    elif a1 < a2:
        a, ca = a1, c1
    elif a2 < a1:
        a, ca = a2, c2
    else:
        a, ca = a1, c1 or c2
    if b1 is None or b2 is None:
        b, cb = None, False
    elif b1 > b2:
        b, cb = b1, d1
    elif b2 > b1:
        b, cb = b2, d2
    else:
        b, cb = b1, d1 or d2
    return (a, ca, b, cb)


def rand_iv(rng, semi=None):
    a = rng.randint(-9, 5)
    b = a + rng.randint(2, 9)
    ca, cb = rng.random() < 0.5, rng.random() < 0.5
    if semi == "izq":
        return (None, False, b, cb)
    if semi == "der":
        return (a, ca, None, False)
    return (a, ca, b, cb)


@generador("t3_real_08")
def gen_real_08(rng, d):
    if d == 1:
        iv = rand_iv(rng, rng.choice([None, None, "izq", "der"]))
        a, ca, b, cb = iv
        resp = itxt(iv)
        sw = itxt((a, not ca if a is not None else ca, b, not cb if b is not None else cb))
        dist = [(sw, "E01")]
        if a is None or b is None:
            dist.append((resp.replace("+∞)", "+∞]").replace("(−∞", "[−∞"), "E02"))
        else:
            dist.append((f"{('[' if cb else '(')}{fmt(b)}, {fmt(a)}{(']' if ca else ')')}", "E03"))
        dist.append((itxt((a, not ca, b, cb)) if a is not None else itxt((a, ca, b, not cb)), None))
        pasos = [("extremos", resp, "Corchete [ ] si el extremo está incluido (≤, ≥); paréntesis ( ) si no lo está (<, >) y siempre en ±∞. El menor se escribe a la izquierda.")]
        return mk(f"Escribe como intervalo o semirrecta: {idesig(iv)}", resp, "t3_intervalo", {"desig": idesig(iv)}, dist, pasos,
                  "≤ y ≥ → corchete; < y > → paréntesis; el infinito siempre con paréntesis.")
    if d == 2:
        iv = rand_iv(rng, rng.choice([None, None, "izq", "der"]))
        a, ca, b, cb = iv
        resp = idesig(iv)
        sw = idesig((a, not ca if a is not None else ca, b, not cb if b is not None else cb))
        pasos = [("leer", resp, f"{itxt(iv)}: " + ("el corchete incluye el extremo (≤ o ≥), el paréntesis lo excluye (< o >)."))]
        return mk(f"Escribe con desigualdades el conjunto {itxt(iv)}.", resp, "t3_intervalo", {"iv": itxt(iv)},
                  [(sw, "E01"), (idesig((a, not ca, b, cb)) if a is not None else idesig((a, ca, b, not cb)), None),
                   (idesig((a, ca, b, not cb)) if b is not None and a is not None else (f"x {'≤' if cb else '<'} {fmt(b)}".replace("x", "x", 1) if a is None else f"x {'≤' if ca else '<'} {fmt(a)}"), None)], pasos,
                  "[a, b) ↔ a ≤ x < b. Corchete = incluido; paréntesis = excluido.")
    for _ in range(100):
        p = rand_iv(rng, rng.choice([None, None, "izq", "der"]))
        q = rand_iv(rng, rng.choice([None, "izq", "der"]))
        inter = interseccion(p, q)
        if inter is None or inter == p or inter == q:
            continue
        un = union(p, q)
        if un == p or un == q:
            continue
        break
    else:
        return None
    op = rng.choice(["∩", "∪"])
    resp = itxt(inter) if op == "∩" else itxt(un)
    otro = itxt(un) if op == "∩" else itxt(inter)
    ai, cai, bi, cbi = inter if op == "∩" else un
    pasos = [("representar", resp, f"Represento {itxt(p)} y {itxt(q)} en la recta. " + ("La intersección es la parte común a los dos." if op == "∩" else "La unión es todo lo que está en alguno de los dos (se solapan)."
             ) + f" Resultado: {resp}.")]
    return mk(f"Calcula {itxt(p)} {op} {itxt(q)}.", resp, "t3_intervalo_op", {"p": itxt(p), "q": itxt(q), "op": op},
              [(otro, "E04"), (itxt((ai, not cai, bi, cbi)) if ai is not None else itxt((ai, cai, bi, not cbi)), "E01"),
               (itxt((ai, cai, bi, not cbi)) if bi is not None and ai is not None else None, None), (resp.replace("+∞)", "+∞]") if "+∞" in resp else None, "E02")], pasos,
              "Intersección: lo común (∩). Unión: todo lo de uno u otro (∪). Cuidado con qué extremos quedan incluidos.")


@generador("t3_real_09")
def gen_real_09(rng, d):
    if d == 1:
        o = rng.randint(0, 3)
        x = F(rng.randint(10 ** (o + 1), 10 ** (o + 3)), 10 ** o)
        if ndec(x) != o and o > 0:
            x += F(1, 10 ** o)
        metodo = rng.choice(["redondeada", "truncada"])
        cota = F(1, 2 * 10 ** o) if metodo == "redondeada" else F(1, 10 ** o)
        resp = D(cota)
        pasos = [("última cifra", ORD_NOMBRE[o], f"{D(x)} está {metodo} a {ORD_NOMBRE[o]} (una unidad de ese orden es {D(F(1, 10 ** o))})."),
                 ("cota", resp, f"Cota del error absoluto: {'media unidad' if metodo == 'redondeada' else 'una unidad'} de ese orden = {resp}.")]
        return mk(f"La cantidad {D(x)} está {metodo} a {ORD_NOMBRE[o]}. ¿Qué cota tiene el error absoluto?", resp, "t3_cota", {"x": D(x), "orden": o, "metodo": metodo},
                  [(D(F(1, 10 ** o)), "E01") if metodo == "redondeada" else (D(F(1, 2 * 10 ** o)), None), (D(cota / 10), None), (D(cota * 10), None)], pasos,
                  "Redondeo: el error es como mucho media unidad del último orden (0,005 si se redondea a centésimas). Truncamiento: una unidad.")
    if d == 2:
        ceros = rng.randint(0, 3)
        sig = str(rng.randint(1, 9)) + "".join(str(rng.randint(0, 9)) for _ in range(rng.randint(0, 3)))
        final0 = rng.random() < 0.5
        if final0:
            sig += "0"
        txt = "0," + "0" * ceros + sig if ceros or rng.random() < 0.6 else sig[0] + "," + sig[1:] if len(sig) > 1 else sig
        n = len(sig)
        pasos = [("contar", str(n), f"En {txt} los ceros de la izquierda solo colocan la coma: no cuentan. Cuentan las cifras desde la primera no nula" + (", incluido el cero final (indica precisión)" if final0 else "") + f": {n}.")]
        total = len(txt.replace(",", ""))
        return mk(f"¿Cuántas cifras significativas tiene {txt}?", str(n), "t3_cifras_sig", {"x": txt},
                  [(str(total) if total != n else None, "E02"), (str(n - 1) if final0 else str(n + 1), None), (str(n + 2), None), (str(max(n - 2, 1)) if n > 2 else str(n + 3), None)], pasos,
                  "Cifras significativas: desde la primera cifra distinta de cero; los ceros finales tras la coma sí cuentan.")
    o = rng.randint(1, 3)
    x = F(rng.randint(10 ** o + 1, 10 ** (o + 2)), 10 ** o)
    if ndec(x) != o:
        x += F(1, 10 ** o)
    cota = F(1, 2 * 10 ** o)
    er = cota / x
    resp = D(er, 5) if not es_dec(er, 5) else D(er)
    pasos = [("cota absoluta", D(cota), f"Redondeado a {ORD_NOMBRE[o]}: Ea ≤ {D(cota)}."),
             ("cota relativa", resp, f"Er ≤ Ea / valor = {D(cota)} / {D(x)} ≈ {resp}.")]
    return mk(f"La medida {D(x)} está redondeada a {ORD_NOMBRE[o]}. Calcula una cota del error relativo (redondea a cinco decimales).", resp, "t3_cota", {"x": D(x), "orden": o, "pide": "Er"},
              [(D(redondear(x / cota, 2)) if es_dec(x / cota, 2) else D(x / cota, 2), "E03"), (D(F(1, 10 ** o) / x, 5), "E01"), (D(cota), None), (D(er * 10, 5), None)], pasos,
              "Cota del error relativo = cota del error absoluto / valor aproximado.")


# ---------------------------------------------------------------- LOGARITMOS

def logtxt(a, b):
    return f"log{sub(a)} {b}" if isinstance(a, int) else f"log_({a}) {b}"


@generador("t3_log_01")
def gen_log_01(rng, d):
    if d == 1:
        a = rng.randint(2, 10)
        n = rng.randint(0, 5 if a < 5 else 3)
        b = a ** n
        if n == 0:
            pasos = [("a⁰ = 1", "0", f"{a}⁰ = 1, así que {logtxt(a, 1)} = 0.")]
            return mk(f"Calcula {logtxt(a, 1)}.", "0", "t3_log_def", {"a": a, "b": 1}, [("1", "E04"), (str(a), None), ("No existe", None)], pasos,
                      "log_a 1 = 0 siempre, porque a⁰ = 1.", genericos=["−1"])
        pasos = [(f"{a}^? = {b}", str(n), f"Busco a qué hay que elevar {a} para obtener {fmt(b)}: {a}{sup(n)} = {fmt(b)}. El logaritmo es {n}.")]
        return mk(f"Calcula {logtxt(a, fmt(b))}.", str(n), "t3_log_def", {"a": a, "b": b},
                  [(fmt(b // a) if b // a != n else None, "E01"), ("0" if n == 1 else None, "E04"), (str(n + 1), None), (str(n - 1) if n > 1 else str(n + 2), None), (fmt(b // 2) if b > 4 and b // 2 != n else None, None)], pasos,
                  "log_a b = c significa a^c = b: el logaritmo es un exponente.")
    if d == 2:
        a = rng.choice([2, 3, 5, 10, 4, 9, 8])
        t = rng.choice(["neg", "neg", "frac"])
        if t == "neg":
            n = rng.randint(1, 4 if a < 5 else 3)
            b = F(1, a ** n)
            arg = f"(1/{fmt(a ** n)})" if a != 10 else D(b)
            resp = f"−{n}"
            pasos = [(f"{a}^? = {fr(b)}", resp, f"1/{fmt(a ** n)} = {a}{sup(-n)}: el logaritmo es −{n}.")]
            return mk(f"Calcula {logtxt(a, arg)}.", resp, "t3_log_def", {"a": a, "b": fr(b)},
                      [(str(n), "E02"), (f"1/{n}" if n > 1 else "−1/2", None), (f"−{n + 1}", None), (fr(b / a) if False else None, None)], pasos,
                      "El logaritmo de un número entre 0 y 1 (con base > 1) es negativo: log₂(1/8) = −3.")
        # raíz: log_{a^k} a = 1/k
        base = rng.choice([2, 3, 5])
        k = rng.randint(2, 4)
        A = base ** k
        if rng.random() < 0.5:
            pasos = [(f"{A}^? = {base}", f"1/{k}", f"{base} = ᵏ√{A}: {A}^(1/{k}) = {base}. El logaritmo es 1/{k}.".replace("ᵏ", sup(k)))]
            return mk(f"Calcula {logtxt(A, base)}.", f"1/{k}", "t3_log_def", {"a": A, "b": base},
                      [(str(k), None), (fr(F(A, base)), "E01"), (f"−{k}", None), (f"−1/{k}", None)], pasos, "Si la base es mayor que el argumento, el logaritmo está entre 0 y 1.")
        pasos = [(f"{base}^? = √{base}", "1/2", f"√{base} = {base}^(1/2): el logaritmo es 1/2.")]
        return mk(f"Calcula {logtxt(base, '√' + str(base))}.", "1/2", "t3_log_def", {"a": base, "b": f"√{base}"},
                  [("2", None), ("−1/2", None), (f"1/{base}", None), ("1", "E04")], pasos, "√a = a^(1/2), así que log_a √a = 1/2.")
    t = rng.choice(["base", "arg", "neg", "mixto", "fracbase"])
    if t == "base":
        x = rng.randint(2, 6)
        n = rng.randint(2, 4)
        b = x ** n
        pasos = [(f"x{sup(n)} = {b}", str(x), f"log_x {b} = {n} significa x{sup(n)} = {b}: x = {x}.")]
        return mk(f"Halla la base x: log_x {fmt(b)} = {n}", f"x = {x}", "t3_log_def", {"b": b, "c": n, "pide": "base"},
                  [(f"x = {fr(F(b, n))}", "E01"), (f"x = {b * n}" if b * n < 10000 else f"x = {x + 1}", None), (f"x = {n ** x if n ** x != b else x * 2}", None)], pasos,
                  "La definición log_x b = c ⇔ x^c = b permite despejar la base.")
    if t == "arg":
        a = rng.randint(2, 6)
        n = rng.choice([-3, -2, -1, 2, 3, 4])
        v = F(a) ** n
        pasos = [(f"{a}^{n}", fr(v), f"log{sub(a)} x = {n} significa x = {a}^{n} = {fr(v)}.")]
        return mk(f"Halla x: {logtxt(a, 'x')} = {n}".replace("−", "−"), f"x = {fr(v)}", "t3_log_def", {"a": a, "c": n, "pide": "argumento"},
                  [(f"x = {fr(-abs(v))}" if n < 0 else f"x = {a * n}", "E02" if n < 0 else "E01"), (f"x = {fr(F(n) ** a) if abs(n) ** a < 10000 else n * a}", None), (f"x = {a * n}" if n < 0 else f"x = {fr(1 / v)}", None)], pasos,
                  "x = a^c. Con exponente negativo, x es una fracción positiva (nunca negativa).")
    if t == "neg":
        a = rng.randint(2, 5)
        n = rng.randint(2, 4)
        b = a ** n
        opcion = rng.choice([f"(−{b})", "0"])
        pasos = [("dominio", "No existe", f"No hay ningún exponente c con {a}^c = {opcion.strip('()')}: las potencias de base positiva son siempre positivas.")]
        return mk(f"Calcula {logtxt(a, opcion)}.", "No existe", "t3_log_def", {"a": a, "b": opcion},
                  [(f"−{n}" if opcion != "0" else "0", "E03"), (str(n) if opcion != "0" else "1", None), ("1" if opcion != "0" else f"−{n}", None)], pasos,
                  "Solo existen logaritmos de números positivos: log(−8) y log 0 no existen.")
    if t == "mixto":
        a = rng.choice([2, 3])
        k = rng.randint(1, 3)
        v = F(2 * k + 1, 2)
        arg = f"{a ** k}√{a}"
        pasos = [("potencia de la base", fr(v), f"{arg} = {a}^{k} · {a}^(1/2) = {a}^({fr(v)}). El logaritmo es {fr(v)}.")]
        return mk(f"Calcula {logtxt(a, '(' + arg + ')')}.", fr(v), "t3_log_def", {"a": a, "b": arg},
                  [(str(k), None), (fr(v - 1), None), (fr(-v), None), (str(k + 1), None)], pasos, "Se escribe el argumento como potencia de la base y se suman exponentes.")
    a = rng.choice([2, 3, 5])
    n = rng.randint(2, 4)
    b = a ** n
    pasos = [(f"(1/{a})^? = {b}", f"−{n}", f"{b} = {a}{sup(n)} = (1/{a}){sup(-n)}: el logaritmo es −{n}.")]
    return mk(f"Calcula log_(1/{a}) {b}.", f"−{n}", "t3_log_def", {"a": f"1/{a}", "b": b},
              [(str(n), "E02"), (f"1/{n}", None), (f"−1/{n}", None)], pasos, "Con base entre 0 y 1, los números mayores que 1 tienen logaritmo negativo.")


@generador("t3_log_02")
def gen_log_02(rng, d):
    if d == 1:
        for _ in range(100):
            a = rng.choice([2, 3, 5, 6, 10, 12, 15, 20])
            n = rng.randint(2, 3)
            T = a ** n
            divs = [x for x in range(2, T) if T % x == 0 and T // x > 1 and x != T // x]
            if divs:
                break
        x = rng.choice(divs)
        y = T // x
        pasos = [("log x + log y = log(xy)", logtxt(a, fmt(T)), f"{logtxt(a, x)} + {logtxt(a, y)} = {logtxt(a, f'({x} · {y})')} = {logtxt(a, fmt(T))}."),
                 ("calcular", str(n), f"{a}{sup(n)} = {fmt(T)}: vale {n}.")]
        return mk(f"Calcula {logtxt(a, x)} + {logtxt(a, y)}.", str(n), "t3_log_prop", {"a": a, "x": x, "y": y},
                  [(logtxt(a, x + y), "E01"), (str(n + 1), None), (str(n * 2), None), (str(n - 1), None)], pasos,
                  "log(a·b) = log a + log b. Pero log(a + b) no se puede descomponer.")
    if d == 2:
        if rng.random() < 0.5:
            a = rng.choice([2, 3, 5, 10])
            n = rng.randint(1, 3)
            y = rng.randint(2, 9)
            x = y * a ** n
            pasos = [("log x − log y = log(x/y)", logtxt(a, x // y), f"{logtxt(a, x)} − {logtxt(a, y)} = {logtxt(a, f'({x}/{y})')} = {logtxt(a, x // y)} = {n}.")]
            return mk(f"Calcula {logtxt(a, x)} − {logtxt(a, y)}.", str(n), "t3_log_prop", {"a": a, "x": x, "y": y},
                      [(logtxt(a, x - y), "E01"), (fr(F(x, y)), None), (str(n + 1), None), (str(n * 2), None)], pasos, "log(a/b) = log a − log b.")
        a = rng.choice([2, 3, 5])
        k = rng.randint(1, 3)
        m = rng.randint(2, 4)
        b = a ** k
        pasos = [("log(x^n) = n·log x", str(k * m), f"{logtxt(a, f'{b}{sup(m)}')} = {m} · {logtxt(a, b)} = {m} · {k} = {k * m}.")]
        return mk(f"Calcula {logtxt(a, f'{b}{sup(m)}')}.", str(k * m), "t3_log_prop", {"a": a, "b": b, "m": m},
                  [(str(k ** m), "E03") if k ** m != k * m else (str(k + m), None), (str(k + m) if k + m != k * m else str(k * m + 1), None), (str(m), None)], pasos,
                  "log(x^n) = n · log x: el exponente baja multiplicando.")
    p, r, q = rng.randint(2, 5), rng.randint(2, 3), rng.randint(2, 4)
    if rng.random() < 0.5:
        expr = f"log (x{sup(p)} · {sup(r) if r > 2 else ''}√y / z{sup(q)})"
        resp = f"{p} log x + (1/{r}) log y − {q} log z"
        pasos = [("producto y cociente", "log x^p + log ⁿ√y − log z^q", f"{expr} = log x{sup(p)} + log {sup(r) if r > 2 else ''}√y − log z{sup(q)}."),
                 ("potencias", resp, f"Bajo los exponentes (la raíz es exponente 1/{r}): {resp}.")]
        return mk(f"Desarrolla: {expr}", resp, "t3_log_desarrollar", {"p": p, "r": r, "q": q},
                  [(f"(log x){sup(p)} + (1/{r}) log y − (log z){sup(q)}", "E03"), (f"{p} log x + log y − {q} log z", "E04"), (f"({p} log x + (1/{r}) log y) / ({q} log z)", "E02"),
                   (f"{p} log x · (1/{r}) log y − {q} log z", None)], pasos,
                  "log(A·B/C) = log A + log B − log C y log(Aⁿ) = n log A; una raíz de índice r es exponente 1/r.")
    resp = f"log (a{sup(p)}·b{sup(q)} / c)" if r == 2 else f"log (a{sup(p)}·b{sup(q)} / c{sup(r)})"
    expr = f"{p} log a + {q} log b − {'' if r == 2 else r}{' ' if r != 2 else ''}log c".replace("−  ", "− ")
    rc = "c" if r == 2 else f"c{sup(r)}"
    pasos = [("subir exponentes", f"log a{sup(p)} + log b{sup(q)} − log {rc}", f"Los coeficientes pasan a exponentes: log a{sup(p)} + log b{sup(q)} − log {rc}."),
             ("agrupar", resp, f"Sumas → producto, restas → cociente: {resp}.")]
    return mk(f"Escribe como un único logaritmo: {expr}", resp, "t3_log_agrupar", {"p": p, "q": q, "r": r},
              [(f"log ({p}a + {q}b − {'' if r == 2 else r}c)".replace("− c", "− c"), "E01"), (f"log (a{sup(p)}·b{sup(q)}) / log {rc}", "E02"), (f"log ({p * q}ab / {'' if r == 2 else r}c)", None)], pasos,
              "n log a = log aⁿ; log A + log B = log(AB); log A − log B = log(A/B).")


L2, L3 = F(301, 1000), F(477, 1000)


@generador("t3_log_03")
def gen_log_03(rng, d):
    if d == 1:
        p, q = rng.choice([(1, 1), (2, 1), (1, 2), (3, 0), (0, 2), (2, 2), (3, 1), (0, 3), (1, 3), (4, 0), (2, 0), (4, 1), (3, 2), (5, 0), (0, 4), (2, 3), (5, 1), (1, 4), (6, 0)])
        c = 0
        rt = 1
    elif d == 2:
        p, q, c = rng.choice([(1, 1, -1), (-1, 0, 1), (-1, 1, 0), (1, 0, 1), (0, 1, 1), (1, 0, -1), (0, 1, -2), (1, 1, 1), (2, 0, -1), (-1, 2, 0), (-1, 1, 1), (2, 1, -1), (-2, 0, 2), (0, 2, -1), (3, 0, -2)])
        rt = 1
    else:
        p, q, c = rng.choice([(2, 1, 0), (1, 2, -2), (1, 1, -1), (0, 1, -1), (2, 0, 0), (1, 2, 0), (-1, 1, 0), (3, 0, -1), (0, 3, 0), (2, 1, -1)])
        rt = rng.choice([2, 3])
    val = F(2) ** p * F(3) ** q * F(10) ** c
    vtxt = D(val) if es_dec(val, 6) else fr(val)
    arg = vtxt if rt == 1 else ("√" if rt == 2 else "∛") + (vtxt if "," not in vtxt and "/" not in vtxt else f"({vtxt})")
    exact = (p * L2 + q * L3 + c) / rt
    resp = D(redondear(exact, 3), 3)
    partes_ = []
    if p:
        partes_.append(f"{p if p not in (1, -1) else ''}{'−' if p == -1 else ''}log 2".replace("−log", "− log") if p < 0 else f"{p if p != 1 else ''} log 2".strip())
    if q:
        partes_.append(f"{q if q != 1 else ''} log 3".strip() if q > 0 else f"− {abs(q) if q != -1 else ''} log 3".replace("  ", " "))
    if c:
        partes_.append(f"{c}" if c > 0 else f"− {abs(c)}")
    desc = " + ".join(partes_).replace("+ −", "−").replace("+ − ", "− ")
    pasos = [("descomponer", desc, f"{vtxt} = " + " · ".join(x for x in [f"2{sup(p)}" if p else "", f"3{sup(q)}" if q else "", f"10{sup(c)}" if c else ""] if x) + "."),
             ("propiedades", resp, (f"log {arg} = (1/{rt}) · (" if rt > 1 else f"log {arg} = ") + f"{fmt(p)}·0,301 + {fmt(q)}·0,477 + {fmt(c)}".replace("+ −", "− ") + (")" if rt > 1 else "") + f" ≈ {resp}.")]
    e02 = (p * L2 + q * L3 + 10 * c) / rt if c else None
    e03 = ((L2 ** abs(p) if p else 1) * (L3 ** abs(q) if q else 1)) if p and q and c == 0 and rt == 1 else None
    e01 = (L2 + L3) if (p, q, c) == (-1, 0, 1) else None
    return mk(f"Sabiendo que log 2 ≈ 0,301 y log 3 ≈ 0,477, calcula log {arg}.", resp, "t3_log_conocidos", {"p": p, "q": q, "c": c, "raiz": rt},
              [(D(redondear(e01, 3), 3) if e01 else None, "E01"), (D(redondear(e02, 3), 3) if e02 is not None else None, "E02"), (D(redondear(e03, 3), 3) if e03 else None, "E03"),
               (D(redondear(exact * rt, 3), 3) if rt > 1 else D(redondear(exact + F(301, 1000), 3), 3), None), (D(redondear(-exact, 3), 3) if exact != 0 else "1,000", None),
               (D(redondear(exact / 2, 3), 3), None)], pasos,
              "Se descompone el argumento en productos, cocientes y potencias de 2, 3 y 10, y se usan las propiedades (log 10 = 1).")


@generador("t3_log_04")
def gen_log_04(rng, d):
    if d < 3:
        a = rng.choice([2, 3, 5, 7, 4, 6, 8, 1.5, 0.5]) if d == 2 else rng.choice([2, 3, 5, 7])
        b = rng.choice([x for x in range(3, 200) if round(math.log(x, a), 6) != round(math.log(x, a))])
        v = math.log(b) / math.log(a)
        f3 = lambda x: D(redondear(F(x).limit_denominator(10 ** 9), 3), 3)
        at = D(F(a).limit_denominator(10)) if a != int(a) else str(int(a))
        pasos = [("cambio de base", f"log {b} / log {at}", f"log_{at} {b} = log {b} / log {at} (o ln {b} / ln {at})."),
                 ("calculadora", f3(v), f"≈ {f3(math.log10(b))} / {f3(math.log10(a))} ≈ {f3(v)}.")]
        at = at if "," not in at else f"({at})"
        return mk(f"Calcula con la calculadora log_{at} {b} (redondea a las milésimas).", f3(v), "t3_log_cambio", {"a": at, "b": b},
                  [(f3(1 / v), "E01"), (f3(math.log10(b) - math.log10(a)), "E02"), (f3(math.log10(b)), None), (f3(v + 1), None)], pasos,
                  "Cambio de base: log_a b = log b / log a (el argumento arriba, la base abajo).")
    t = rng.choice(["ln_e", "e_ln", "ln1", "lne", "ln_frac"])
    k = rng.randint(2, 9)
    if t == "ln_e":
        return mk(f"Calcula ln e{sup(k)}.", str(k), "t3_log_ident", {"k": k}, [("0", "E03"), ("1", None), (f"e{sup(k)}", None)],
                  [("ln e^x = x", str(k), f"ln e{sup(k)} = {k} · ln e = {k} · 1 = {k}.")], "ln y e^x son funciones inversas: ln e^x = x.")
    if t == "e_ln":
        return mk(f"Calcula e^(ln {k}).", str(k), "t3_log_ident", {"k": k}, [(f"ln {k}", "E03"), ("1", None), (f"e{sup(k)}", None)],
                  [("e^(ln x) = x", str(k), f"e^(ln {k}) = {k}: la exponencial deshace el logaritmo.")], "e^(ln x) = x para x > 0.")
    if t == "ln1":
        return mk(f"Calcula {k} · ln 1 + ln e.", "1", "t3_log_ident", {"k": k}, [(str(k + 1), "E03"), ("0", None), (str(k), None)],
                  [("ln 1 = 0, ln e = 1", "1", f"ln 1 = 0 y ln e = 1: {k} · 0 + 1 = 1.")], "ln 1 = 0 (e⁰ = 1) y ln e = 1.")
    if t == "lne":
        return mk(f"Calcula ln (1/e{sup(k)}).", f"−{k}", "t3_log_ident", {"k": k}, [(str(k), None), ("0", "E03"), (f"1/{k}", None)],
                  [("ln e^x = x", f"−{k}", f"1/e{sup(k)} = e{sup(-k)}: ln e{sup(-k)} = −{k}.")], "ln e^x = x también con exponentes negativos.")
    return mk(f"Calcula ln ∛(e{sup(k)}).", fr(F(k, 3)), "t3_log_ident", {"k": k}, [(str(k), None), (str(3 * k) if k != 1 else "3", None), ("0", "E03")],
              [("raíz = exponente fraccionario", fr(F(k, 3)), f"∛(e{sup(k)}) = e^({k}/3): ln = {fr(F(k, 3))}.")], "Una raíz es un exponente fraccionario: ln ⁿ√(e^k) = k/n.")


# ---------------------------------------------------------------- RADICALES

def extraer(N, idx=2):
    """N = c^idx · k con k sin factores de exponente ≥ idx → (c, k)."""
    c, k, p = 1, N, 2
    while p ** idx <= k:
        while k % (p ** idx) == 0:
            k //= p ** idx
            c *= p
        p += 1
    return c, k


def rtxt(k, idx=2):
    """ⁿ√k (sin coeficiente)."""
    if isinstance(k, int):
        s = str(k) if k >= 0 else f"(−{-k})"
    else:
        k = k.replace("-", "−")
        s = k if (k.isdigit() or len(k) == 1) else f"({k})"
    return ("√" if idx == 2 else sup(idx) + "√") + s


def surd(terms, den=1, idx=2):
    """terms: {radicando: coef entero}; devuelve texto simplificado de (Σ coef·ⁿ√k)/den."""
    t = {k: c for k, c in terms.items() if c}
    if not t:
        return "0"
    if den < 0:
        den = -den
        t = {k: -c for k, c in t.items()}
    g = den
    for c in t.values():
        g = math.gcd(g, abs(int(c)))
    den //= g
    t = {k: c // g for k, c in t.items()}
    orden = sorted(t.items(), key=lambda kv: kv[0])
    if den == 1:
        return suma_txt([rad(c, k, idx) for k, c in orden])
    if len(orden) == 1:
        k, c = orden[0]
        return rad(F(c, den), k, idx)
    num = suma_txt([rad(c, k, idx) for k, c in orden])
    return f"({num})/{den}"


@generador("t3_radic_01")
def gen_radic_01(rng, d):
    if d == 1:
        idx = rng.choice([2, 2, 3])
        r = rng.randint(2, 15 if idx == 2 else 6)
        N = r ** idx
        pasos = [(f"?{sup(idx)} = {N}", str(r), f"Busco el número que elevado a {idx} da {N}: {r}{sup(idx)} = {N}.")]
        return mk(f"Calcula {rtxt(N, idx)}.", str(r), "raiz" if idx == 2 else "t3_raiz_exacta", {"n": N, "indice": idx},
                  [(fr(F(N, idx)), "E01"), (str(r + 1), None), (str(r * idx) if r * idx != N else str(r - 1), None), (str(N // 2), None)], pasos,
                  "ⁿ√a es el número que elevado a n da a: no se divide a entre n.")
    if d == 2:
        t = rng.choice(["impar_neg", "par_neg", "cuarta"])
        if t == "impar_neg":
            idx = rng.choice([3, 5])
            r = rng.randint(2, 5 if idx == 3 else 3)
            N = r ** idx
            pasos = [("índice impar", f"−{r}", f"Índice impar: la raíz de un negativo es negativa. (−{r}){sup(idx)} = −{N}.")]
            return mk(f"Calcula {sup(idx)}√(−{N}).", f"−{r}", "t3_raiz_exacta", {"n": -N, "indice": idx},
                      [(str(r), "E03"), ("No existe", "E03"), (fr(F(-N, idx)), "E01")], pasos,
                      "Con índice impar, la raíz de un negativo existe y es negativa.")
        if t == "par_neg":
            idx = rng.choice([2, 4])
            r = rng.randint(2, 9 if idx == 2 else 4)
            N = r ** idx
            pasos = [("índice par", "No es un número real", f"Ningún número real elevado a {idx} da negativo: {rtxt(-N, idx)} no existe en los reales.")]
            return mk(f"Calcula {rtxt(-N, idx)}.", "No es un número real", "t3_raiz_exacta", {"n": -N, "indice": idx},
                      [(f"−{r}", "E02"), (str(r), None), (fr(F(-N, idx)), None)], pasos,
                      "Raíz de índice par de un negativo: no existe en los números reales.")
        idx = rng.choice([4, 5])
        r = rng.randint(2, 5 if idx == 4 else 3)
        N = r ** idx
        pasos = [(f"?{sup(idx)} = {N}", f"{'±' if idx % 2 == 0 else ''}{r}", f"{r}{sup(idx)} = {N}" + (f" y también (−{r}){sup(idx)} = {N}: dos valores opuestos." if idx % 2 == 0 else "."))]
        resp = f"±{r}" if idx % 2 == 0 else str(r)
        return mk(f"Calcula todas las raíces reales {sup(idx)}√{N}.", resp, "t3_raiz_exacta", {"n": N, "indice": idx},
                  [(fr(F(N, idx)), "E01"), (str(r) if idx % 2 == 0 else f"±{r}", None), (str(r * r), None)], pasos,
                  "La raíz de índice par de un positivo tiene dos valores opuestos.")
    idx = rng.choice([2, 3, 3, 4, 5])
    a, b = rng.randint(1, 5 if idx < 4 else 3), rng.randint(2, 7 if idx < 4 else 3)
    if math.gcd(a, b) != 1:
        a = 1
    neg = idx % 2 == 1 and rng.random() < 0.5
    A, B = a ** idx, b ** idx
    val = F(a, b) * (-1 if neg else 1)
    rad_txt = f"{'−' if neg else ''}{A}/{B}"
    pasos = [("numerador y denominador", fr(val), f"Hago la raíz de arriba y de abajo: {rtxt(A, idx)} = {a}, {rtxt(B, idx)} = {b}" + (" y, con índice impar, el signo se mantiene." if neg else "."))]
    return mk(f"Calcula {sup(idx) if idx > 2 else ''}√({rad_txt}).", fr(val), "t3_raiz_exacta", {"n": rad_txt, "indice": idx},
              [(fr(F(a, B) * (-1 if neg else 1)), "E04"), (fr(-val), "E03" if neg else None), (fr(F(A, idx * B)) if A > 1 else fr(F(b, a)), "E01" if A > 1 else None)], pasos,
              "ⁿ√(a/b) = ⁿ√a / ⁿ√b: hay que hacer la raíz del numerador Y del denominador.")


@generador("t3_radic_02")
def gen_radic_02(rng, d):
    if d == 1:
        n = rng.randint(2, 5)
        m = rng.randint(1, 7)
        if math.gcd(m, n) != 1 or m == n:
            m = 1 if n != 1 else 2
        v = rng.choice(["a", "x", "b"])
        if rng.random() < 0.5:
            resp = f"{v}^({m}/{n})"
            pasos = [("ⁿ√aᵐ = a^(m/n)", resp, f"El índice va al denominador y el exponente al numerador: {rtxt(v + sup(m) if m > 1 else v, n)} = {resp}.")]
            return mk(f"Escribe como potencia de exponente fraccionario: {rtxt(v + (sup(m) if m > 1 else ''), n)}", resp, "t3_radic_pot", {"m": m, "n": n},
                      [(f"{v}^({n}/{m})" if m > 1 else f"{v}^{n}", "E01"), (f"{v}^{m * n}" if m > 1 else f"{v}^(−{n})", None), (f"{v}^({m}/{n + m})", None)], pasos,
                      "ⁿ√(a^m) = a^(m/n): el índice de la raíz es el DENOMINADOR del exponente.")
        resp = rtxt(v + (sup(m) if m > 1 else ""), n)
        pasos = [("a^(m/n) = ⁿ√aᵐ", resp, f"El denominador ({n}) es el índice y el numerador ({m}) el exponente: {resp}.")]
        return mk(f"Escribe como radical: {v}^({m}/{n})", resp, "t3_radic_pot", {"m": m, "n": n},
                  [(rtxt(v + (sup(n) if n > 1 else ""), m) if m > 1 else f"{v}{sup(n)}", "E01"), (rtxt(v, m * n) if m > 1 else rtxt(v + sup(n), 2), None), (f"{m}{rtxt(v, n)}" if m > 1 else rtxt(v, n + 1), None)], pasos,
                  "a^(m/n) = ⁿ√(a^m).")
    if d == 2:
        for _ in range(100):
            b0 = rng.choice([2, 3, 5, 6, 7, 10])
            n = rng.choice([2, 3, 4, 5])
            m = rng.randint(1, 5)
            if b0 ** n > 3000 or math.gcd(m, n) != 1 or m == n or m == 1 and n == 2:
                continue
            B = b0 ** n
            val = b0 ** m
            if val > 100000:
                continue
            break
        resp = fmt(val)
        c1, k1 = extraer(B ** n, m) if m > 1 else (B ** n, 1)
        e01 = rad(c1, k1, m) if m > 1 and B ** n < 10 ** 7 else None
        pasos = [("raíz", str(b0), f"{B}^({m}/{n}) = ({rtxt(B, n)}){sup(m)}: primero la raíz, {rtxt(B, n)} = {b0}."),
                 ("potencia", resp, f"Después la potencia: {b0}{sup(m)} = {resp}.")]
        return mk(f"Calcula {B}^({m}/{n}).", resp, "t3_radic_pot", {"b": B, "m": m, "n": n},
                  [(fr(F(B * m, n)), "E02"), (e01, "E01"), (fmt(b0 * m), None), (fmt(val * b0), None)], pasos,
                  "a^(m/n): conviene hacer primero la raíz (denominador) y después la potencia (numerador).")
    if rng.random() < 0.5:
        b0 = rng.choice([2, 3, 4, 5])
        n = rng.choice([2, 3])
        m = rng.choice([1, 2])
        if m == n:
            m = 1
        B = b0 ** n
        val = F(1, b0 ** m)
        pasos = [("exponente negativo", f"1/{B}^({m}/{n})", f"Exponente negativo = inverso: {B}^(−{m}/{n}) = 1/{B}^({m}/{n})."),
                 ("calcular", fr(val), f"{B}^({m}/{n}) = {b0 ** m}, así que el resultado es {fr(val)}.")]
        return mk(f"Calcula {B}^(−{m}/{n}).", fr(val), "t3_radic_pot", {"b": B, "m": -m, "n": n},
                  [(f"−{b0 ** m}", "E03"), (fr(-val), "E03"), (fmt(b0 ** m), None), (fr(F(-B * m, n)), "E02")], pasos,
                  "El signo menos del exponente indica inverso (1/…), no un resultado negativo.")
    n = rng.choice([4, 6, 8, 9, 10, 12])
    g = rng.choice([x for x in (2, 3, 4) if n % x == 0])
    m = g * rng.randint(1, 3)
    if m % n == 0 or m >= n + 4:
        m = g
    v = rng.choice(["a", "x"])
    n2, m2 = n // g, m // g
    resp = rtxt(v + (sup(m2) if m2 > 1 else ""), n2) if n2 > 1 else (v + sup(m2) if m2 > 1 else v)
    pasos = [("dividir índice y exponente", resp, f"{rtxt(v + sup(m), n)} = {v}^({m}/{n}) = {v}^({m2}/{n2}) = {resp}: divido índice y exponente entre {g}.")]
    return mk(f"Simplifica el radical {rtxt(v + sup(m), n)}.", resp, "t3_radic_pot", {"m": m, "n": n},
              [(rtxt(v + sup(m - (n - m) if m > n - m else m - g), n - m) if n - m > 1 and m - (n - m) > 0 else rtxt(v + sup(m), n - g), "E04"),
               (rtxt(v + sup(m2 + 1), n2) if n2 > 1 else v + sup(m2 + 1), None), (rtxt(v + (sup(m2) if m2 > 1 else ""), n), None)], pasos,
              "Radicales equivalentes: se pueden dividir índice y exponente por el mismo número (no restar).")


@generador("t3_radic_03")
def gen_radic_03(rng, d):
    if d < 3:
        idx = 2 if d == 1 else 3
        for _ in range(100):
            k = rng.choice([2, 3, 5, 6, 7, 10] if idx == 2 else [2, 3, 4, 5, 6, 7, 9])
            c = rng.randint(2, 12 if idx == 2 else 5)
            N = c ** idx * k
            if N <= 2000 and extraer(N, idx) == (c, k):
                break
        resp = rad(c, k, idx)
        pasos = [("factorizar", f"{c}{sup(idx)} · {k}", f"Descompongo: {N} = {c ** idx} · {k} = {c}{sup(idx)} · {k}."),
                 ("extraer", resp, f"Saco {c} fuera de la raíz: {resp}.")]
        parcial = None
        for p in (2, 3, 5):
            if c % p == 0 and c != p:
                parcial = rad(p, N // p ** idx, idx)
                break
        return mk(f"Extrae factores del radical: {rtxt(N, idx)}", resp, "t3_radic_extraer", {"n": N, "indice": idx},
                  [(rad(c ** idx, k, idx), "E01"), (parcial, None), (rad(k, c, idx) if k != c else rad(c + 1, k, idx), None), (rad(c, k * idx, idx) if False else rad(c * idx, k, idx), None)], pasos,
                  "Se factoriza el radicando y cada factor con exponente igual al índice sale fuera SIN exponente (se le hace la raíz).")
    idx = rng.choice([2, 3])
    c = rng.randint(1, 5)
    k = rng.choice([2, 3, 5]) if idx == 2 else rng.choice([2, 3, 4])
    e1 = rng.randint(idx + 1, 3 * idx - 1)
    e2 = rng.choice([idx, idx * 2, 1, idx + 1])
    q1, r1 = divmod(e1, idx)
    q2, r2 = divmod(e2, idx)
    N = c ** idx * k
    fuera = (str(c) if c > 1 else "") + "x" + (sup(q1) if q1 > 1 else "") + ("y" + (sup(q2) if q2 > 1 else "") if q2 else "")
    dentro_parts = ([str(k)] if k > 1 else []) + (["x" + (sup(r1) if r1 > 1 else "")] if r1 else []) + (["y" + (sup(r2) if r2 > 1 else "")] if r2 else [])
    dentro = "".join(dentro_parts) or "1"
    resp = f"{fuera} {rtxt(dentro, idx)}" if dentro != "1" else fuera
    radicando = f"{N}x{sup(e1)}y{sup(e2) if e2 > 1 else ''}"
    mal_fuera = (str(c) if c > 1 else "") + "x" + (sup(q1) if q1 > 1 else "") + ("y" + (sup(q2) if q2 > 1 else "") if q2 else "")
    mal_dentro = ([str(k)] if k > 1 else []) + ["x" + (sup(q1) if q1 > 1 else "")] + (["y" + (sup(q2) if q2 > 1 else "")] if q2 else [])
    e02 = f"{mal_fuera} {rtxt(''.join(mal_dentro), idx)}" if q1 != r1 else None
    e01 = f"{c ** idx if c > 1 else ''}x{sup(q1 * idx) if q1 * idx > 1 else ''} {rtxt(dentro, idx)}" if dentro != "1" else None
    pasos = [("factorizar", f"{c}{sup(idx)}·{k}·x{sup(e1)}·y{sup(e2) if e2 > 1 else ''}", f"{N} = {c}{sup(idx)} · {k}; x{sup(e1)} = (x{sup(idx)}){sup(q1) if q1 > 1 else ''}·x{sup(r1) if r1 > 1 else ''}" + ("" if r1 else "") + "."),
             ("extraer", resp, f"Divido cada exponente entre el índice: el cociente sale fuera y el resto se queda dentro. Resultado: {resp}.")]
    return mk(f"Extrae factores del radical: {rtxt(radicando, idx)}", resp, "t3_radic_extraer", {"radicando": radicando, "indice": idx},
              [(e02, "E02"), (e01, "E01"), ((str(c) if c > 1 else "") + "x" + sup(q1 + 1) + ("y" + (sup(q2) if q2 > 1 else "") if q2 else "") + (f" {rtxt(dentro, idx)}" if dentro != "1" else ""), None), (f"x{sup(e1 // 2) if e1 // 2 > 1 else ''} {rtxt(str(N), idx)}", None)], pasos,
              "Para extraer: exponente : índice → el cociente sale como exponente fuera; el resto queda dentro.")


@generador("t3_radic_04")
def gen_radic_04(rng, d):
    if d < 3:
        idx = 2 if d == 1 else 3
        a = rng.randint(2, 7 if idx == 2 else 4)
        b = rng.choice([2, 3, 5, 6, 7, 10, 11]) if idx == 2 else rng.choice([2, 3, 4, 5, 6, 7])
        resp = rtxt(a ** idx * b, idx)
        pasos = [("elevar al índice", resp, f"Para meter {a} dentro lo elevo al índice: {a}{sup(idx)} = {a ** idx}. {a}{rtxt(b, idx)} = {rtxt(f'{a ** idx}·{b}', idx)} = {resp}.")]
        e02 = rtxt(a ** (idx - 1) * b, idx) if idx == 3 else rtxt(a ** 3 * b, idx)
        return mk(f"Introduce el factor dentro del radical: {a}{rtxt(b, idx)}", resp, "t3_radic_introducir", {"a": a, "b": b, "indice": idx},
                  [(rtxt(a * b, idx), "E01"), (e02, "E02"), (rtxt(a + b, idx), None), (rtxt(a ** idx + b, idx), None)], pasos,
                  "Un factor entra en la raíz elevado al índice: a·ⁿ√b = ⁿ√(aⁿ·b).")
    t = rng.choice(["neg", "frac", "letra"])
    if t == "neg":
        a = rng.randint(2, 6)
        b = rng.choice([2, 3, 5, 7])
        resp = f"−{rtxt(a * a * b)}"
        pasos = [("signo fuera", resp, f"El signo menos no puede entrar en una raíz de índice par: se queda fuera. −{a}√{b} = −√({a * a}·{b}) = {resp}.")]
        return mk(f"Introduce el factor dentro del radical: −{a}√{b}", resp, "t3_radic_introducir", {"a": -a, "b": b},
                  [(rtxt(a * a * b), "E03"), (rtxt(-a * a * b), "E03"), (f"−{rtxt(a * b)}", "E01")], pasos,
                  "En índice par el signo negativo se queda fuera de la raíz (la raíz cuadrada es siempre positiva).")
    if t == "frac":
        for _ in range(100):
            p, q = rng.randint(1, 4), rng.randint(2, 5)
            m, n = rng.randint(2, 30), rng.randint(2, 30)
            if math.gcd(p, q) != 1 or math.gcd(m, n) != 1:
                continue
            v = F(p * p * m, q * q * n)
            if v.numerator < 100 and v.denominator < 100 and v.denominator > 1:
                break
        resp = f"√({fr(v)})"
        pasos = [("elevar al cuadrado", f"{p * p}/{q * q}", f"({p}/{q})² = {p * p}/{q * q}."),
                 ("multiplicar y simplificar", resp, f"({p}/{q})·√({m}/{n}) = √({p * p}/{q * q} · {m}/{n}) = {resp}.")]
        return mk(f"Introduce el factor dentro del radical: ({p}/{q})·√({m}/{n})", resp, "t3_radic_introducir", {"p": p, "q": q, "m": m, "n": n},
                  [(f"√({fr(F(p * m, q * n))})", "E01"), (f"√({fr(F(p ** 3 * m, q ** 3 * n))})", "E02"), (f"√({fr(v * 2)})", None)], pasos,
                  "El coeficiente fraccionario entra elevado al índice: (p/q)² multiplica al radicando.")
    idx = rng.choice([2, 3])
    e = rng.randint(1, 3)
    c = rng.randint(2, 4)
    resp = rtxt(f"{c ** idx}x{sup(idx + e)}", idx)
    pasos = [("elevar al índice", resp, f"{c}x · {rtxt('x' + (sup(e) if e > 1 else ''), idx)} = {rtxt(f'{c}{sup(idx)}x{sup(idx)}·x' + (sup(e) if e > 1 else ''), idx)} = {resp}.")]
    return mk(f"Introduce el factor dentro del radical: {c}x·{rtxt('x' + (sup(e) if e > 1 else ''), idx)}", resp, "t3_radic_introducir", {"c": c, "e": e, "indice": idx},
              [(rtxt(f"{c}x{sup(1 + e)}", idx), "E01"), (rtxt(f"{c ** (idx + 1)}x{sup(idx + 1 + e)}", idx), "E02"), (rtxt(f"{c * idx}x{sup(idx * e)}", idx), None)], pasos,
              "Cada factor que entra se eleva al índice: c·x·ⁿ√(x^e) = ⁿ√(cⁿ·xⁿ⁺ᵉ).")


@generador("t3_radic_05")
def gen_radic_05(rng, d):
    idx = 2 if d < 3 else rng.choice([2, 3])
    k = rng.choice([2, 3, 5, 6, 7]) if idx == 2 else rng.choice([2, 3, 4, 5])
    for _ in range(100):
        nterm = 2 if d < 3 else 3
        if d == 1:
            cs = [rng.randint(1, 9) * rng.choice([1, 1, -1]) for _ in range(nterm)]
            ss = [1] * nterm
        else:
            cs = [rng.randint(1, 5) * (1 if i == 0 else rng.choice([1, -1])) for i in range(nterm)]
            ss = [rng.randint(1, 5) for _ in range(nterm)]
            if all(s_ == 1 for s_ in ss) or len(set(ss)) < 2:
                continue
        tot = sum(c * s_ for c, s_ in zip(cs, ss))
        if tot != 0 and cs[0] > 0:
            break
    else:
        return None
    rads = [s_ ** idx * k for s_ in ss]
    terms_txt = [rad(c, r, idx) if True else "" for c, r in zip(cs, rads)]
    expr = suma_txt(terms_txt)
    resp = rad(tot, k, idx)
    simpl = suma_txt([rad(c * s_, k, idx) for c, s_ in zip(cs, ss)])
    pasos = ([("extraer factores", simpl, "Extraigo factores para que sean semejantes: " + ", ".join(f"{rtxt(r, idx)} = {rad(s_, k, idx)}" for r, s_ in zip(rads, ss) if s_ > 1) + f". Queda {simpl}.")] if d > 1 else []) + \
            [("sumar coeficientes", resp, f"Son radicales semejantes ({rtxt(k, idx)}): sumo los coeficientes, {' + '.join(str(c * s_) for c, s_ in zip(cs, ss)).replace('+ -', '− ')} = {tot}. Resultado: {resp}.")]
    sum_rad = sum(c * r for c, r in zip(cs, rads))
    e01 = rad(1, sum_rad, idx) if sum_rad > 0 and d > 1 else None
    e02 = rad(sum(cs), k * len(cs), idx) if d == 1 and sum(cs) > 0 else rad(tot, k * 2, idx)
    return mk(f"Calcula y simplifica: {expr}", resp, "t3_radic_suma", {"expr": expr},
              [(e01 if e01 != resp else None, "E01"), (e02, "E02"), ("No se puede simplificar" if d > 1 else None, "E03"), (rad(tot + 1, k, idx), None), (rad(-tot, k, idx), None)], pasos,
              "Solo se suman radicales semejantes (mismo índice y radicando): se suman los coeficientes. A veces hay que extraer factores antes.")


@generador("t3_radic_06")
def gen_radic_06(rng, d):
    if d == 1:
        if rng.random() < 0.3:
            a = rng.choice([2, 3, 5, 6, 7])
            p, q = rng.randint(1, 5), rng.randint(1, 5)
            resp = fmt(p * q * a)
            pasos = [("√a · √a = a", resp, f"{rad(p, a)} · {rad(q, a)} = {p * q} · (√{a})² = {p * q} · {a} = {resp}.")]
            return mk(f"Calcula {rad(p, a)} · {rad(q, a)}.", resp, "t3_radic_prod", {"a": a, "p": p, "q": q},
                      [(rad(p * q, a), "E03"), (fmt(p * q * a * a), "E03"), (rtxt(p * q * a * a) if p * q > 1 else str(a + 1), "E02" if p * q > 1 else None)], pasos,
                      "√a · √a = a (no √a ni a²).")
        for _ in range(100):
            m, n = rng.choice([2, 3, 5, 6, 7, 10]), rng.choice([2, 3, 5, 6, 7, 10])
            p, q = rng.randint(1, 5), rng.randint(1, 5)
            if m != n:
                break
        c, k = extraer(m * n)
        resp = rad(p * q * c, k)
        pasos = [("√a·√b = √(ab)", f"{p * q}√{m * n}", f"Multiplico coeficientes ({p}·{q} = {p * q}) y radicandos ({m}·{n} = {m * n}): {p * q}√{m * n}."),
                 ("simplificar", resp, f"Simplifico: {resp}.")]
        return mk(f"Calcula {rad(p, m)} · {rad(q, n)}.", resp, "t3_radic_prod", {"p": p, "m": m, "q": q, "n": n},
                  [(rtxt(p * m * q * n) if p * q > 1 else rtxt(m + n), "E02"), (rad(p * q, m + n), None), (rad(p + q, m * n) if p + q != p * q else rad(p * q + 1, m * n), None)], pasos,
                  "Coeficientes con coeficientes y radicandos con radicandos: p√m · q√n = pq√(mn).")
    if d == 2:
        for _ in range(100):
            k = rng.choice([2, 3, 5, 6, 7])
            s1, s2 = rng.randint(1, 6), rng.randint(1, 4)
            idx = rng.choice([2, 2, 3])
            A = s1 ** idx * k * s2 ** idx
            B = k
            if A != B and A < 3000:
                break
        resp = str(s1 * s2)
        pasos = [("√a/√b = √(a/b)", f"{rtxt(A // B, idx)}", f"{rtxt(A, idx)} / {rtxt(B, idx)} = {rtxt(f'{A}/{B}', idx)} = {rtxt(A // B, idx)}."),
                 ("calcular", resp, f"= {resp}.")]
        return mk(f"Calcula {rtxt(A, idx)} / {rtxt(B, idx)}.", resp, "t3_radic_prod", {"a": A, "b": B, "indice": idx},
                  [(str(A // B), None), (rtxt(A - B, idx), None), (rad(s1 * s2, k, idx), None), (str(s1 * s2 * k), None)], pasos,
                  "Radicales del mismo índice: ⁿ√a / ⁿ√b = ⁿ√(a/b).")
    t = rng.choice(["cuad_suma", "sumdif", "cuad_dif2"])
    if t == "cuad_suma":
        a = rng.choice([2, 3, 5, 6, 7])
        b = rng.randint(1, 5)
        sg = rng.choice([1, -1])
        resp = surd({1: a + b * b, a: 2 * b * sg})
        pasos = [("(x ± y)² = x² ± 2xy + y²", resp, f"(√{a} {'+' if sg > 0 else '−'} {b})² = {a} {'+' if sg > 0 else '−'} 2·{b}·√{a} + {b * b} = {resp}.")]
        return mk(f"Calcula (√{a} {'+' if sg > 0 else '−'} {b})².", resp, "t3_radic_notable", {"a": a, "b": b, "signo": sg},
                  [(str(a + b * b), "E01"), (surd({1: a * a + b * b, a: 2 * b * sg}) if False else surd({1: a + b * b, a: b * sg}), None), (surd({1: a - b * b, a: 2 * b * sg}), None)], pasos,
                  "El cuadrado de un binomio tiene tres términos: no olvidar el doble producto.")
    if t == "sumdif":
        a, b = rng.sample([2, 3, 5, 6, 7, 10, 11], 2)
        if a < b:
            a, b = b, a
        p = rng.randint(1, 3)
        resp = fmt(p * p * a - b)
        pasos = [("(x + y)(x − y) = x² − y²", resp, f"Suma por diferencia: ({rad(p, a)})² − (√{b})² = {p * p * a} − {b} = {resp}.")]
        return mk(f"Calcula ({rad(p, a)} + √{b})({rad(p, a)} − √{b}).", resp, "t3_radic_notable", {"a": a, "b": b, "p": p},
                  [(fmt(p * p * a + b), None), (surd({1: p * p * a - b, a * b: 2 * p}), None), (fmt(p * a - b) if p * a - b != p * p * a - b else fmt(p * a + b), None), (rtxt(p * p * a - b) if p * p * a - b > 0 else None, "E03")], pasos,
                  "Suma por diferencia: (x + y)(x − y) = x² − y², y (√a)² = a.")
    a, b = rng.sample([2, 3, 5, 6, 7], 2)
    p = rng.randint(2, 3)
    c, k = extraer(a * b)
    resp = surd({1: p * p * a + b, k: -2 * p * c})
    pasos = [("(x − y)² = x² − 2xy + y²", resp, f"({rad(p, a)} − √{b})² = {p * p * a} − 2·{p}√{a * b} + {b} = {resp}.")]
    return mk(f"Calcula ({rad(p, a)} − √{b})².", resp, "t3_radic_notable", {"a": a, "b": b, "p": p},
              [(str(p * p * a + b), "E01"), (str(p * p * a - b), None), (surd({1: p * p * a + b, k: 2 * p * c}), None), (surd({1: p * a + b, k: -2 * p * c}), None)], pasos,
              "Cuadrado de una resta: x² − 2xy + y². Sin el doble producto el resultado es falso.")


@generador("t3_radic_07")
def gen_radic_07(rng, d):
    if d == 1:
        n1, n2 = rng.choice([2, 3, 4, 5]), rng.choice([2, 3, 4])
        n1, n2 = max(n1, n2), min(n1, n2)
        v = rng.choice(["a", "x", "2", "3", "5", "7", "b", "6", "10", "11"])
        resp = rtxt(v, n1 * n2)
        pasos = [("raíz de raíz", resp, f"La raíz de una raíz es otra raíz con el producto de los índices: {n1}·{n2} = {n1 * n2}. Resultado: {resp}.")]
        inner = rtxt(v, n2)
        return mk(f"Escribe como un solo radical: {rtxt(inner, n1) if n1 > 2 else '√(' + inner + ')'}", resp, "t3_radic_indices", {"n1": n1, "n2": n2, "v": v},
                  [(rtxt(v, n1 + n2), "E02"), (rtxt(v, max(n1, n2)), None), (rtxt(v + sup(n1), n2), None)], pasos,
                  "ⁿ√(ᵐ√a) = ⁿᵐ√a: los índices se multiplican.")
    if d == 2:
        for _ in range(100):
            n1, n2 = rng.sample([2, 3, 4, 6], 2)
            a, b = rng.choice([2, 3, 5]), rng.choice([2, 3, 5])
            m = math.lcm(n1, n2)
            R = a ** (m // n1) * b ** (m // n2)
            c, k = extraer(R, m)
            if R < 10 ** 6 and m <= 12 and a != b:
                break
        op = rng.choice(["·", ":"])
        if op == ":":
            val = F(a ** (m // n1), b ** (m // n2))
            resp = rtxt(fr(val), m) if val.denominator != 1 else (rad(*extraer(val.numerator, m), m) if True else "")
            e03v = F(a, b)
            pasos = [("índice común", str(m), f"mcm({n1}, {n2}) = {m}: {rtxt(a, n1)} = {rtxt(a ** (m // n1), m)} y {rtxt(b, n2)} = {rtxt(b ** (m // n2), m)}."),
                     ("dividir", resp, f"Divido los radicandos: {resp}.")]
            return mk(f"Calcula y escribe como un solo radical: {rtxt(a, n1)} : {rtxt(b, n2)}", resp, "t3_radic_indices", {"a": a, "n1": n1, "b": b, "n2": n2, "op": op},
                      [(rtxt(fr(e03v), n1 + n2), "E01"), (rtxt(fr(e03v), m), "E03"), (rtxt(fr(e03v), abs(n1 - n2)) if abs(n1 - n2) > 1 else rtxt(fr(e03v), 2 * m), None)], pasos,
                      "Para operar radicales de distinto índice se reducen a índice común (mcm), elevando cada radicando.")
        resp = rad(c, k, m)
        pasos = [("índice común", str(m), f"mcm({n1}, {n2}) = {m}: {rtxt(a, n1)} = {rtxt(a ** (m // n1), m)} y {rtxt(b, n2)} = {rtxt(b ** (m // n2), m)}."),
                 ("multiplicar", resp, f"Multiplico los radicandos: {rtxt(R, m)}" + (f" = {resp}." if resp != rtxt(R, m) else "."))]
        return mk(f"Calcula y escribe como un solo radical: {rtxt(a, n1)} · {rtxt(b, n2)}", resp, "t3_radic_indices", {"a": a, "n1": n1, "b": b, "n2": n2, "op": op},
                  [(rtxt(a * b, n1 + n2), "E01"), (rtxt(a * b, m), "E03"), (rtxt(a * b, max(n1, n2)) if rtxt(a * b, max(n1, n2)) != resp else rtxt(a * b, n1 * n2 + 1), "E01")], pasos,
                  "Radicales de distinto índice: primero a índice común (mcm) elevando los radicandos; después se multiplican.")
    for _ in range(100):
        (a, n1), (b, n2) = rng.sample([(2, 2), (3, 2), (5, 2), (3, 3), (5, 3), (2, 3), (10, 3), (4, 3), (7, 3), (3, 4), (10, 4), (6, 4)], 2)
        if n1 == n2:
            continue
        m = math.lcm(n1, n2)
        A, B = a ** (m // n1), b ** (m // n2)
        if A != B:
            break
    mayor, menor = (rtxt(a, n1), rtxt(b, n2)) if A > B else (rtxt(b, n2), rtxt(a, n1))
    pasos = [("índice común", str(m), f"Paso a índice {m}: {rtxt(a, n1)} = {rtxt(A, m)} y {rtxt(b, n2)} = {rtxt(B, m)}."),
             ("comparar radicandos", mayor, f"Con el mismo índice, es mayor el de mayor radicando: {mayor}.")]
    return mk(f"¿Qué número es mayor: {rtxt(a, n1)} o {rtxt(b, n2)}?", mayor, "t3_radic_comparar", {"a": a, "n1": n1, "b": b, "n2": n2},
              [(menor, "E03" if (a > b) != (A > B) else None), ("Son iguales", None), ("No se pueden comparar", None)], pasos,
              "Para comparar radicales de distinto índice se reducen a índice común; comparar solo los radicandos engaña.", datos={"opciones_fijas": True})


@generador("t3_radic_08")
def gen_radic_08(rng, d):
    if d == 1:
        a = rng.randint(1, 12)
        c = rng.choice([2, 3, 5, 6, 7, 10])
        resp = surd({c: a}, c)
        pasos = [("× √c / √c", f"{a}√{c}/{c}", f"Multiplico arriba y abajo por √{c}: {a}·√{c} / (√{c})² = {a}√{c}/{c}."),
                 ("simplificar", resp, f"Simplifico: {resp}.")]
        return mk(f"Racionaliza: {a}/√{c}", resp, "t3_racionalizar", {"a": a, "c": c},
                  [(fr(F(a, c)), "E01"), (surd({c: a}, c * c), None), (surd({c: c}, a) if a != c else surd({c: 1}, 2 * a), None)], pasos,
                  "Para quitar √c del denominador se multiplica numerador y denominador por √c.")
    if d == 2:
        if rng.random() < 0.4:
            k = rng.choice([2, 3, 5, 7])
            m = rng.choice([2, 3, 5, 7])
            if m == k:
                m = 11
            A = k * m
            resp = rtxt(k)
            pasos = [("√a/√b = √(a/b)", resp, f"√{A}/√{m} = √({A}/{m}) = √{k}.")]
            return mk(f"Simplifica: √{A}/√{m}", resp, "t3_racionalizar", {"a": A, "b": m},
                      [(str(k), "E03"), (rtxt(A - m), None), (surd({A * m: 1}, m), None)], pasos, "√a/√b = √(a/b); quitar las raíces y dividir no es válido.")
        a = rng.randint(1, 12)
        b = rng.randint(2, 6)
        c = rng.choice([2, 3, 5, 6, 7])
        resp = surd({c: a}, b * c)
        pasos = [("× √c", f"{a}√{c}/({b}·{c})", f"Multiplico arriba y abajo por √{c}: {a}√{c} / ({b}·{c})."),
                 ("simplificar", resp, f"Simplifico: {resp}.")]
        return mk(f"Racionaliza: {a}/({b}√{c})", resp, "t3_racionalizar", {"a": a, "b": b, "c": c},
                  [(fr(F(a, b * c)), "E01"), (surd({c: a}, b * c * c), None), (surd({c: a * b}, c), None)], pasos,
                  "Solo hay que multiplicar por el radical (√c), no por todo el denominador.")
    p = rng.choice([2, 3, 5])
    n = rng.choice([3, 3, 4])
    m = rng.randint(1, n - 1)
    a = rng.randint(1, 9)
    b = rng.randint(1, 5)
    falta = n - m
    resp = surd({p ** falta: a}, b * p, n)
    pasos = [("completar la potencia", rtxt(f"{p}{sup(falta) if falta > 1 else ''}", n), f"En el denominador hay {rtxt(f'{p}' + (sup(m) if m > 1 else ''), n)}: para que salga {p} necesito {rtxt(f'{p}' + (sup(falta) if falta > 1 else ''), n)} (exponentes {m} + {falta} = {n})."),
             ("racionalizar", resp, f"Multiplico arriba y abajo: {rtxt(p ** falta, n)} en el numerador y {p} en el denominador. Resultado: {resp}.")]
    rd = f"{p}" + (sup(m) if m > 1 else "")
    return mk(f"Racionaliza: {a}/({str(b) + '·' if b > 1 else ''}{rtxt(rd, n)})", resp, "t3_racionalizar", {"a": a, "b": b, "p": p, "m": m, "n": n},
              [(surd({p ** m: a}, b * p ** m, n) if m > 0 else None, "E02"), (fr(F(a, b * p)), "E01"), (surd({p ** falta: a}, b * p ** falta, n), None)], pasos,
              "Con raíz n-ésima se multiplica por el radical que completa el exponente hasta el índice: 1/∛4 → × ∛2.")


@generador("t3_radic_09")
def gen_radic_09(rng, d):
    if d == 1:
        for _ in range(100):
            b = rng.choice([2, 3, 5, 6, 7, 10, 11])
            c = rng.randint(1, 3)
            a = rng.randint(1, 8)
            if b != c * c:
                break
        sg = rng.choice([1, -1])
        den = b - c * c
        # a/(√b + sg·c) = a(√b − sg·c)/(b − c²)
        resp = surd({b: a, 1: -sg * a * c}, den)
        e01 = surd({b: a, 1: sg * a * c}, den)
        e02 = surd({b: a, 1: -sg * a * c}, b + c * c)
        e03 = f"{a}/√{b} {'+' if sg > 0 else '−'} {a if c == 1 else f'{a}/{c}'}"
        pasos = [("conjugado", f"√{b} {'−' if sg > 0 else '+'} {c}", f"Multiplico arriba y abajo por el conjugado del denominador: √{b} {'−' if sg > 0 else '+'} {c}."),
                 ("suma por diferencia", str(den), f"Abajo: (√{b})² − {c}² = {b} − {c * c} = {den}."),
                 ("resultado", resp, f"Resultado: {resp}.")]
        return mk(f"Racionaliza: {a}/(√{b} {'+' if sg > 0 else '−'} {c})", resp, "t3_racionalizar_bin", {"a": a, "b": b, "c": c, "signo": sg},
                  [(e01, "E01"), (e02, "E02"), (e03, "E03")], pasos,
                  "Con un binomio en el denominador se multiplica por su conjugado (cambiando el signo del medio) y se usa suma por diferencia.")
    if d == 2:
        b, c = rng.sample([2, 3, 5, 6, 7, 10, 11], 2)
        if b < c:
            b, c = c, b
        a = rng.randint(1, 8)
        sg = rng.choice([1, -1])
        den = b - c
        resp = surd({b: a, c: -sg * a}, den)
        pasos = [("conjugado", f"√{b} {'−' if sg > 0 else '+'} √{c}", f"Multiplico por el conjugado √{b} {'−' if sg > 0 else '+'} √{c}."),
                 ("suma por diferencia", str(den), f"Abajo: {b} − {c} = {den}."), ("resultado", resp, f"Resultado: {resp}.")]
        return mk(f"Racionaliza: {a}/(√{b} {'+' if sg > 0 else '−'} √{c})", resp, "t3_racionalizar_bin", {"a": a, "b": b, "c": c, "signo": sg},
                  [(surd({b: a, c: sg * a}, den), "E01"), (surd({b: a, c: -sg * a}, b + c), "E02"), (f"{a}/√{b} {'+' if sg > 0 else '−'} {a}/√{c}", "E03")], pasos,
                  "a/(√b ± √c): se multiplica por √b ∓ √c y el denominador queda b − c.")
    b, c = rng.sample([2, 3, 5, 6, 7, 10, 11], 2)
    if b < c:
        b, c = c, b
    ck, kk = extraer(b * c)
    den = b - c
    resp = surd({1: b + c, kk: 2 * ck}, den)
    pasos = [("conjugado", f"√{b} + √{c}", f"Multiplico arriba y abajo por √{b} + √{c}."),
             ("numerador", f"{b + c} + 2√{b * c}", f"Arriba: (√{b} + √{c})² = {b} + {c} + 2√{b * c}" + (f" = {b + c} + {rad(2 * ck, kk)}." if ck > 1 else ".")),
             ("denominador", str(den), f"Abajo: {b} − {c} = {den}. Simplifico: {resp}.")]
    return mk(f"Racionaliza y simplifica: (√{b} + √{c})/(√{b} − √{c})", resp, "t3_racionalizar_bin", {"b": b, "c": c},
              [(surd({1: b + c}, den), None), (surd({1: b + c, kk: 2 * ck}, b + c), "E02"), (surd({1: b - c, kk: 2 * ck}, den) if b - c != 0 else None, None), (surd({1: b + c, kk: ck}, den), None)], pasos,
              "(√b + √c)/(√b − √c): multiplicando por el conjugado, el numerador es un cuadrado de binomio (con doble producto).")


@generador("t3_radic_10")
def gen_radic_10(rng, d):
    t = rng.choice(["frac_raiz", "pita"] if d == 1 else ["pot_frac", "frac_raiz"] if d == 2 else ["frontera", "pot3"])
    if t == "frac_raiz":
        k = rng.choice([2, 3, 5])
        a, b = rng.sample(range(1, 7), 2)
        A, B = a * a * k, b * b * k
        resp = str(a + b)
        pasos = [("extraer", f"({rad(a, k)} + {rad(b, k)})/√{k}", f"√{A} = {rad(a, k)} y √{B} = {rad(b, k)}."),
                 ("dividir", resp, f"({rad(a + b, k)})/√{k} = {a + b}.")]
        return mk(f"Simplifica: (√{A} + √{B})/√{k}", resp, "t3_radic_comb", {"A": A, "B": B, "k": k},
                  [(f"{rad(1, A // k)} + √{B}" if A // k > 1 else f"1 + √{B}", "E02"), (rtxt(A + B) if extraer(A + B)[1] != 1 else str(a + b + 1), None), (str(a * b), None), (fr(F(a + b, k)), None)], pasos,
                  "Se simplifica cada radical (o se divide cada término entre √k), no solo el primero.")
    if t == "pita":
        p, q, r = rng.choice([(3, 4, 5), (6, 8, 10), (5, 12, 13), (8, 15, 17), (9, 12, 15), (12, 16, 20), (7, 24, 25), (20, 21, 29), (9, 40, 41), (15, 20, 25)])
        k = rng.choice([1, 1, 2])
        resp = str(r * k) if k == 1 else rad(r, 1)
        pasos = [("primero dentro", str(p * p + q * q), f"Primero opero dentro de la raíz: {p}² + {q}² = {p * p} + {q * q} = {r * r}."), ("raíz", str(r), f"√{r * r} = {r}.")]
        return mk(f"Calcula √({p}² + {q}²).", str(r), "t3_radic_comb", {"p": p, "q": q},
                  [(str(p + q), "E01"), (str(r + 1), None), (str(p * q), None), (rtxt(p + q), None)], pasos,
                  "La raíz no se reparte en una suma: √(a² + b²) ≠ a + b.")
    if t == "pot_frac":
        m, n = rng.sample([2, 3, 4, 5, 6], 2)
        v = rng.choice(["a", "x"])
        e = F(1, m) + F(1, n)
        resp = f"{v}^({fr(e)})"
        pasos = [("sumar exponentes", resp, f"{v}^(1/{m}) · {v}^(1/{n}) = {v}^(1/{m} + 1/{n}) = {v}^({fr(e)}).")]
        return mk(f"Simplifica: {rtxt(v, m)} · {rtxt(v, n)} (exprésalo como potencia).", resp, "t3_radic_comb", {"m": m, "n": n},
                  [(f"{v}^({fr(F(2, m + n))})", "E03"), (f"{v}^({fr(F(1, m * n))})", None), (f"{v}^({fr(F(1, m) * F(1, n) * 2)})" if F(2, m * n) != e else f"{v}^2", None)], pasos,
                  "Con exponentes fraccionarios se suman las fracciones con común denominador: 1/2 + 1/3 = 5/6.")
    if t == "frontera":
        k = rng.choice([2, 3])
        a, b = rng.sample(range(1, 6), 2)
        c = rng.randint(1, 3)
        mm = rng.choice([2, 3])
        A, B = a * a * k, b * b * k
        resp = fmt(a + b - c)
        pasos = [("primer término", str(a + b), f"(√{A} + √{B})/√{k} = ({rad(a, k)} + {rad(b, k)})/√{k} = {a + b}."),
                 ("segundo término", str(c), f"∛{c ** 3 * mm} · ∛(1/{mm}) = ∛{c ** 3} = {c}."),
                 ("restar", resp, f"{a + b} − {c} = {resp}.")]
        return mk(f"Simplifica: (√{A} + √{B})/√{k} − ∛{c ** 3 * mm} · ∛(1/{mm})", resp, "t3_radic_comb", {"A": A, "B": B, "k": k, "c": c, "m": mm},
                  [(f"{rad(1, A // k)} + √{B} − {c}" if A // k > 1 else f"1 + √{B} − {c}", "E02"), (fmt(a + b + c), None), (fmt(a + b - c * mm), None), (fmt(a + b), None)], pasos,
                  "Cada término se simplifica por separado; en los productos de raíces del mismo índice se multiplican los radicandos.")
    v = rng.choice(["a", "x"])
    m, n, p = rng.sample([2, 3, 4, 6], 3)
    e = F(1, m) + F(1, n) - F(1, p)
    if e <= 0:
        return None
    resp = rtxt(v + (sup(e.numerator) if e.numerator > 1 else ""), e.denominator) if e.denominator > 1 else v + (sup(e.numerator) if e.numerator > 1 else "")
    pasos = [("a potencias", f"{v}^(1/{m}) · {v}^(1/{n}) / {v}^(1/{p})", f"Paso a exponentes fraccionarios: {v}^(1/{m} + 1/{n} − 1/{p})."),
             ("operar", resp, f"1/{m} + 1/{n} − 1/{p} = {fr(e)}: {v}^({fr(e)}) = {resp}.")]
    e3 = F(2, m + n) - F(1, p)
    return mk(f"Simplifica y escribe como un solo radical: {rtxt(v, m)} · {rtxt(v, n)} / {rtxt(v, p)}", resp, "t3_radic_comb", {"m": m, "n": n, "p": p},
              [(f"{v}^({fr(e3)})" if e3 > 0 else f"{v}^({fr(F(2, m + n))})", "E03"), (rtxt(v, m * n * p), None), (rtxt(v, m + n - p) if m + n - p > 1 else rtxt(v, m + n + p), None)], pasos,
              "Pasar a exponentes fraccionarios permite combinar productos y cocientes de radicales de distinto índice.")
