"""Generadores del grupo T5 (álgebra, funciones, análisis y geometría analítica/trigonometría) — mina 2.

Todos se registran como "t5_<nombre>" y devuelven un Ejercicio con parametros["op"] propio ("t5_…", sin recálculo
genérico en el validador salvo los que reutilizan "ec1"), distractores ligados a claves de error descriptivas (se
enlazan con E01… en specs/T5.json) y explicación por pasos.

Convención de textos canónicos (una sola forma de escribir cada respuesta):
  números      enteros con signo menos tipográfico (−3); fracciones irreducibles a/b (−3/4); decimales con coma.
  polinomios   orden decreciente de grado, coeficiente 1 omitido, coeficiente fraccionario como 3x²/2, x³/3.
  soluciones   "x = −2, x = 3" (orden creciente); sin solución: "Sin solución real".
  intervalos   "(−∞, −3]", "[2, +∞)", uniones con " ∪ ".
  puntos       "(1, −2)"; vectores "(−3, 4)"; matrices "[1, 2; 3, 4]" (filas separadas por ';').
  rectas       explícita "y = 2x − 3"; general "2x − 3y − 7 = 0" (enteros primos entre sí, primer coeficiente > 0).
  radicales    "5√2", "√3/2", "(√6 − √2)/4".
"""
import math
from fractions import Fraction as F

from .nucleo import Ejercicio, generador, fmt

# ---------------------------------------------------------------- formato

_SUP = str.maketrans("0123456789-", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻")
_SUB = str.maketrans("0123456789-", "₀₁₂₃₄₅₆₇₈₉₋")
ARR = {"→": (1, 0), "←": (-1, 0), "↑": (0, 1), "↓": (0, -1)}
PAL = {"→": "derecha", "←": "izquierda", "↑": "arriba", "↓": "abajo"}


def flechas(seq):
    return " ".join(seq) + " (" + ", ".join(PAL[a] for a in seq) + ")"
OPUESTA = {"→": "←", "←": "→", "↑": "↓", "↓": "↑"}


def sp(e):
    """Exponente en superíndice (1 no se escribe)."""
    return "" if e == 1 else str(e).translate(_SUP)


def sub(n):
    return str(n).translate(_SUB)


def N(x):
    """Número canónico: entero o fracción irreducible con signo menos tipográfico."""
    x = F(x)
    if x.denominator == 1:
        return fmt(int(x))
    return ("−" if x < 0 else "") + f"{abs(x.numerator)}/{x.denominator}"


def D(x, nd=2):
    """Decimal redondeado con coma y sin ceros sobrantes."""
    v = round(float(x) + 0.0, nd)
    if v == 0:
        v = 0.0
    s = f"{abs(v):.{nd}f}".rstrip("0").rstrip(".")
    ent, _, dec = s.partition(".")
    return ("−" if v < 0 else "") + fmt(int(ent)) + ("," + dec if dec else "")


def _body(a, lit):
    """Cuerpo de un término con coeficiente a > 0 y parte literal lit (puede ser '')."""
    a = F(a)
    if not lit:
        return N(a)
    if a.denominator == 1:
        return ("" if a == 1 else N(a)) + lit
    return ("" if a.numerator == 1 else str(a.numerator)) + lit + "/" + str(a.denominator)


def terms(ts):
    """Suma de términos [(coef, literal)] en el orden dado, omitiendo ceros."""
    out = ""
    for c, lit in ts:
        c = F(c)
        if c == 0:
            continue
        b = _body(abs(c), lit)
        if not out:
            out = ("−" if c < 0 else "") + b
        else:
            out += (" − " if c < 0 else " + ") + b
    return out or "0"


def P(co, v="x"):
    """Polinomio en una variable: dict exponente -> coeficiente."""
    return terms([(co[e], (v + sp(e)) if e else "") for e in sorted(co, reverse=True)])


def par(s):
    """Pone paréntesis si la expresión tiene más de un término."""
    return f"({s})" if (" + " in s or " − " in s) else s


def mono(c, lits):
    """Monomio en varias letras: lits dict letra -> exponente (orden alfabético)."""
    lit = "".join(k + sp(e) for k, e in sorted(lits.items()) if e)
    return terms([(c, lit)])


def poly_multi(ts):
    """Polinomio en varias letras [(coef, {letra: exp})] en el orden dado."""
    return terms([(c, "".join(k + sp(e) for k, e in sorted(l.items()) if e)) for c, l in ts])


def sols(xs, v="x"):
    xs = sorted(set(F(x) for x in xs))
    return ", ".join(f"{v} = {N(x)}" for x in xs) if xs else "Sin solución real"


def pt(*c):
    return "(" + ", ".join(N(x) for x in c) + ")"


def mat(M):
    return "[" + "; ".join(", ".join(N(x) for x in fila) for fila in M) + "]"


def _extremo(x, cerrado, izq):
    if x is None:
        return ("(−∞" if izq else "+∞)")
    return ("[" if cerrado else "(") + N(x) if izq else N(x) + ("]" if cerrado else ")")


def intervalo(a, b, ca=False, cb=False):
    """a/b None = infinito."""
    return _extremo(a, ca, True) + ", " + _extremo(b, cb, False)


def union(*ivs):
    return " ∪ ".join(ivs)


def rad(n, k=1, q=1):
    """k·√n/q simplificado (n entero ≥ 0)."""
    k, q = F(k), F(q)
    s = 1
    m = n
    for f in range(2, int(math.isqrt(n)) + 1):
        while m % (f * f) == 0:
            m //= f * f
            s *= f
    c = k * s / q
    if m == 1 or n == 0:
        return N(c * (1 if n else 0))
    body = "√" + str(m)
    num = abs(c.numerator)
    t = ("" if num == 1 else str(num)) + body
    if c.denominator != 1:
        t += "/" + str(c.denominator)
    return ("−" if c < 0 else "") + t


def pif(x):
    """Múltiplo racional de π: 5π/4, π, −π/2, 0."""
    x = F(x)
    if x == 0:
        return "0"
    num = abs(x.numerator)
    t = ("" if num == 1 else str(num)) + "π" + ("" if x.denominator == 1 else "/" + str(x.denominator))
    return ("−" if x < 0 else "") + t


def lin(A, B, C, v=("x", "y")):
    """Recta general Ax + By + C = 0 normalizada (enteros primos entre sí, primer coef. no nulo > 0)."""
    A, B, C = F(A), F(B), F(C)
    den = math.lcm(A.denominator, B.denominator, C.denominator)
    A, B, C = A * den, B * den, C * den
    g = math.gcd(math.gcd(int(A), int(B)), int(C)) or 1
    A, B, C = A / g, B / g, C / g
    if A < 0 or (A == 0 and B < 0):
        A, B, C = -A, -B, -C
    return terms([(A, v[0]), (B, v[1]), (C, "")]) + " = 0"


def plano(A, B, C, Dd):
    A, B, C, Dd = (F(t) for t in (A, B, C, Dd))
    den = math.lcm(A.denominator, B.denominator, C.denominator, Dd.denominator)
    vals = [int(t * den) for t in (A, B, C, Dd)]
    g = math.gcd(*vals) or 1
    vals = [t // g for t in vals]
    first = next(t for t in vals[:3] if t)
    if first < 0:
        vals = [-t for t in vals]
    return terms([(vals[0], "x"), (vals[1], "y"), (vals[2], "z"), (vals[3], "")]) + " = 0"


def expl_y(m, n, v="y"):
    return f"{v} = " + P({1: m, 0: n})


def clean(o):
    if isinstance(o, F):
        return N(o)
    if isinstance(o, dict):
        return {str(k): clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [clean(v) for v in o]
    return o


_VISTOS = set()


def _norm(t):
    import unicodedata
    t = unicodedata.normalize("NFKD", t.lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    return " ".join(__import__("re").sub(r"[^a-z0-9ñ ]+", " ", t).split())


def mk(enun, resp, op, dist, gen=(), pasos=(), adulto="", **p):
    """Construye el Ejercicio; devuelve None si su huella (enunciado normalizado + respuesta) ya salió en este proceso,
    para que el validador no lo rechace como duplicado (la normalización borra símbolos como □, → o ²)."""
    h = (op, _norm(enun), resp)
    if h in _VISTOS:
        return None
    _VISTOS.add(h)
    ej = Ejercicio(enunciado=enun, respuesta=resp, parametros=clean({"op": op, **p}))
    ej.distractores = [(v, k) for v, k in dist if v is not None and v != ""]
    ej.genericos = [g for g in gen if g is not None and g != ""]
    pasos = list(pasos)
    ej.pasos = [{"paso": i + 1, "operacion": "", "resultado": resp if i == len(pasos) - 1 else "", "texto": t} for i, t in enumerate(pasos)]
    ej.explicacion_nino = " ".join(pasos)
    ej.explicacion_adulto = adulto
    return ej


def nz(rng, a, b, excl=()):
    while True:
        v = rng.randint(a, b)
        if v != 0 and v not in excl:
            return v


# ---------------------------------------------------------------- polinomios (dict exp -> coef)

def padd(p, q, k=1):
    r = dict(p)
    for e, c in q.items():
        r[e] = r.get(e, 0) + k * c
    return {e: c for e, c in r.items() if c}


def pmul(p, q):
    r = {}
    for e1, c1 in p.items():
        for e2, c2 in q.items():
            r[e1 + e2] = r.get(e1 + e2, 0) + c1 * c2
    return {e: c for e, c in r.items() if c}


def pscale(p, k):
    return {e: c * k for e, c in p.items() if c * k}


def pev(p, x):
    return sum(F(c) * F(x) ** e for e, c in p.items())


def proots(rs, k=1):
    p = {0: k}
    for r in rs:
        p = pmul(p, {1: 1, 0: -F(r)})
    return p


def pder(p):
    return {e - 1: c * e for e, c in p.items() if e > 0}


def pdiv(a, b):
    """División de polinomios: (cociente, resto)."""
    a = {e: F(c) for e, c in a.items() if c}
    q = {}
    db = max(b)
    while a and max(a) >= db:
        e = max(a) - db
        c = a[max(a)] / F(b[db])
        q[e] = c
        a = padd(a, pmul({e: c}, b), -1)
    return q, a


def fac(r, v="x"):
    """Factor (x − r) canónico."""
    r = F(r)
    if r == 0:
        return v
    return f"({v} − {N(r)})" if r > 0 else f"({v} + {N(-r)})"


def factorizado(k, raices, v="x"):
    """k·x^m·(x − r)ⁿ… con factores ordenados por raíz creciente (x primero)."""
    from collections import Counter
    c = Counter(F(r) for r in raices)
    s = ""
    if 0 in c:
        s += v + sp(c.pop(0))
    for r in sorted(c):
        s += fac(r, v) + sp(c[r])
    k = F(k)
    pre = "" if k == 1 else ("−" if k == -1 else N(k))
    return (pre + s) if s else N(k)


def frac_fact(k, num, den, v="x"):
    """Fracción de factores lineales: k·Π(x − r)/Π(x − s), simplificando comunes."""
    from collections import Counter
    cn, cd = Counter(F(r) for r in num), Counter(F(r) for r in den)
    com = cn & cd
    cn, cd = cn - com, cd - com
    k = F(k)
    kn, kd = F(k.numerator), F(k.denominator)
    top = factorizado(kn, list(cn.elements()), v) if (cn or kn != 1) else "1"
    if not cn and kn == -1:
        top = "−1"
    if not cd and kd == 1:
        return top
    bot = factorizado(kd, list(cd.elements()), v)
    nfac = len(cd) + (1 if kd != 1 else 0)
    if nfac > 1:
        bot = f"({bot})" if not (bot.startswith("(") and bot.endswith(")") and bot.count("(") == 1) else bot
    return f"{top}/{bot}"


# ================================================================ ALG.COMPUT

def _mover(pos, seq):
    x, y = pos
    for a in seq:
        dx, dy = ARR[a]
        x, y = x + dx, y + dy
    return x, y


def _dentro(pos, seq, n, base=1):
    x, y = pos
    for a in seq:
        dx, dy = ARR[a]
        x, y = x + dx, y + dy
        if not (base <= x <= n - 1 + base and base <= y <= n - 1 + base):
            return False
    return True


def _cas(p):
    return f"({p[0]}, {p[1]})"


CUAD = "Las casillas se nombran (columna, fila) y la (1, 1) es la de abajo a la izquierda."


@generador("t5_cuadricula")
def gen_cuadricula(rng, d, n=5):
    k = {1: rng.randint(2, 3), 2: 4, 3: rng.randint(5, 6)}[d]
    for _ in range(200):
        pos = (rng.randint(1, n), rng.randint(1, n))
        seq = [rng.choice(list(ARR)) for _ in range(k)]
        if d > 1 and not any(a in "←→" for a in seq):
            continue
        if _dentro(pos, seq, n):
            break
    fin = _mover(pos, seq)
    espejo = [OPUESTA[a] if a in "←→" else a for a in seq]
    rep = [i for i in range(1, k) if seq[i] == seq[i - 1]]
    salta = seq[:rep[0]] + seq[rep[0] + 1:] if rep else seq[:-1]
    dist = [(_cas(_mover(pos, espejo)), "izq_der"), (_cas(_mover(pos, salta)), "salta"), (_cas(_mover(pos, seq[1:])), "cuenta_salida")]
    gen = [_cas((fin[0] + 1, fin[1])), _cas((fin[0], fin[1] - 1)), _cas((fin[1], fin[0])), _cas((fin[0] - 1, fin[1]))]
    return mk(f"En una cuadrícula de {n} × {n}. {CUAD} Sales de la casilla {_cas(pos)} y sigues estas flechas, un paso cada una: {flechas(seq)}. ¿En qué casilla terminas?",
              _cas(fin), "t5_cuadricula", dist, gen,
              [f"Empiezo en {_cas(pos)}. → suma 1 a la columna, ← resta 1, ↑ suma 1 a la fila y ↓ resta 1.",
               f"Voy flecha a flecha: " + ", ".join(_cas(_mover(pos, seq[:i + 1])) for i in range(k)) + ".",
               f"Termino en {_cas(fin)}."],
              "Conviene mover el dedo casilla a casilla y marcar cada flecha hecha; los errores típicos son invertir izquierda/derecha o saltarse una flecha repetida.",
              salida=pos, flechas=seq)


@generador("t5_cuadricula_error")
def gen_cuadricula_error(rng, d, n=6):
    k = {1: 4, 2: 5, 3: 6}[d]
    for _ in range(500):
        pos = (rng.randint(1, n), rng.randint(1, n))
        seq = [rng.choice(list(ARR)) for _ in range(k)]
        if not _dentro(pos, seq, n):
            continue
        i = rng.randrange(k - 1)  # la errónea nunca es la última (así el error 'señala la última' es distinto)
        c = seq[i]
        mal = rng.choice([a for a in ARR if a not in (c, OPUESTA[c])])
        if seq.count(mal) > 0:
            continue
        prog = seq[:i] + [mal] + seq[i + 1:]
        if _dentro(pos, prog, n):
            break
    meta = _mover(pos, seq)
    ords = ["1.ª", "2.ª", "3.ª", "4.ª", "5.ª", "6.ª"]
    txt = lambda j, a: f"La {ords[j]} flecha ({prog[j]}) debe ser {a}"
    ult = [a for a in ARR if a != prog[-1]]
    dist = [(txt(k - 1, rng.choice(ult)), "senala_ultima"), (txt(i, OPUESTA[mal]), "opuesta"),
            (txt((i + 1) % (k - 1), OPUESTA[prog[(i + 1) % (k - 1)]]), None)]
    gen = [txt(j, a) for j in range(k) for a in ARR if a != prog[j] and not (j == i and a == c)]
    rng.shuffle(gen)
    return mk(f"En una cuadrícula de {n} × {n}. {CUAD} Un robot sale de {_cas(pos)} y tiene que llegar a {_cas(meta)}, pero el programa {flechas(prog)} tiene UNA flecha equivocada. ¿Cuál es y cómo se arregla?",
              txt(i, c), "t5_cuadricula_error", dist, gen,
              [f"Sigo el programa desde {_cas(pos)}: termina en {_cas(_mover(pos, prog))}, no en {_cas(meta)}.",
               f"Si cambio la {ords[i]} flecha ({mal}) por {c}, el robot llega a {_cas(meta)}. Compruebo recorriéndolo otra vez."],
              "Para depurar, se compara dónde acaba el programa con dónde debería acabar: la diferencia indica qué flecha cambiar. Hay que comprobar el arreglo, no solo 'dar la vuelta' a la flecha.",
              salida=pos, meta=meta, programa=prog)


@generador("t5_bucle")
def gen_bucle(rng, d):
    for _ in range(200):
        b = rng.randint(1, 2) if d == 1 else rng.randint(2, 3)
        n = rng.randint(2, 3) if d == 1 else rng.randint(3, 5)
        bloque = [rng.choice(["→", "↑"] if d == 1 else list(ARR)) for _ in range(b)]
        if len(bloque) >= 2 and len(set(bloque)) == 1 and d > 1:
            continue
        pos = (rng.randint(0, 2), rng.randint(0, 2)) if d < 3 else (rng.randint(0, 5), rng.randint(0, 5))
        fin = _mover(pos, bloque * n)
        if min(fin) >= 0 and len(bloque) >= 1:
            break
    txt = _cas
    dist = [(txt(_mover(pos, bloque)), "una_vez"), (txt(_mover(pos, bloque + [bloque[-1]] * (n - 1))), "solo_ultima"),
            (txt(_mover(pos, bloque * (n + 1))), "vuelta_de_mas")]
    gen = [txt(_mover(pos, bloque * (n - 1))), txt((fin[1], fin[0])), txt((fin[0] + 1, fin[1]))]
    return mk(f"Un robot está en {txt(pos)} (columna, fila). Ejecuta: «repite {n} veces [{flechas(bloque)}]». Cada flecha es un paso. ¿Dónde termina?",
              txt(fin), "t5_bucle", dist, gen,
              [f"El bloque {' '.join(bloque)} mueve el robot {_mover((0, 0), bloque)[0]} a la derecha y {_mover((0, 0), bloque)[1]} arriba (si es negativo, al otro lado).",
               f"Se repite {n} veces: desde {txt(pos)} llego a {txt(fin)}."],
              "Un bucle repite TODO el bloque el número de veces indicado. Se puede calcular el efecto de una vuelta y multiplicarlo.",
              bloque=bloque, n=n, salida=pos)


def _aplica(x, op, k):
    return {"+": x + k, "−": x - k, "×": x * k, ":": F(x, k)}[op]


INV = {"+": "−", "−": "+", "×": ":", ":": "×"}


@generador("t5_maquina")
def gen_maquina(rng, d):
    for _ in range(500):
        ops = [rng.choice(["+", "−", "×", ":"])] if d == 1 else [rng.choice(["×", ":"]), rng.choice(["+", "−"])]
        if d == 2 and rng.random() < 0.4:
            ops = ops[::-1]
        ks = [rng.randint(2, 9) if o in "×:" else rng.randint(2, 50) for o in ops]
        x = rng.randint(2, 120)
        v = x
        ok = True
        for o, k in zip(ops, ks):
            v = _aplica(v, o, k)
            if v < 0 or v != int(v) or v > 1000:
                ok = False
        if ok:
            break
    y = int(v)
    maq = " → ".join(f"{o}{k}" for o, k in zip(ops, ks))
    if d < 3:
        sw = x
        for o, k in reversed(list(zip(ops, ks))):
            sw = _aplica(sw, o, k)
        dist = [(N(sw) if len(ops) > 1 else None, "orden_directo_cambiado"), (N(_aplica(x, INV[ops[0]], ks[0])) if len(ops) == 1 else None, "no_invierte")]
        enun = f"Una máquina de números hace: entrada → {maq} → salida. Si entra el {x}, ¿qué número sale?"
        resp = N(y)
        pasos = [f"Aplico las operaciones en orden: " + ", ".join(f"{o}{k}" for o, k in zip(ops, ks)) + f". Sale {y}."]
        gen = [N(y + 1), N(y - 1), N(y + 10), N(y - ks[-1]) if ops[-1] in "+−" else N(y + ks[-1])]
    else:
        # inverso: deshacer en orden inverso
        sm = y
        for o, k in zip(ops, ks):
            sm = _aplica(sm, INV[o], k)
        ni = y
        for o, k in reversed(list(zip(ops, ks))):
            ni = _aplica(ni, o if o in "+−" else INV[o], k)
        dist = [(N(sm) if F(sm).denominator == 1 else None, "deshace_mismo_orden"), (N(ni) if F(ni).denominator == 1 else None, "no_invierte")]
        enun = f"Una máquina de números hace: entrada → {maq} → salida. Ha salido el {y}. ¿Qué número entró?"
        resp = N(x)
        pasos = [f"Deshago las operaciones de la última a la primera, con la operación contraria: " +
                 ", ".join(f"{INV[o]}{k}" for o, k in reversed(list(zip(ops, ks)))) + f". Entró el {x}.",
                 f"Compruebo: {x} " + " ".join(f"{o}{k}" for o, k in zip(ops, ks)) + f" = {y}. ✓"]
        gen = [N(x + 1), N(x - 1), N(x + 2), N(y)]
    return mk(enun, resp, "t5_maquina", dist, gen, pasos,
              "Para ir hacia atrás en una máquina se deshace en orden inverso y con la operación contraria (como quitarse los zapatos antes que los calcetines).",
              ops=ops, ks=ks, entrada=x, salida=y)


@generador("t5_condicional")
def gen_condicional(rng, d):
    reglas = [("es par", lambda n: n % 2 == 0), ("es impar", lambda n: n % 2 == 1)]
    for _ in range(300):
        if rng.random() < 0.5:
            cond, f = rng.choice(reglas)
        else:
            t = rng.randint(5, 30)
            cond, f = (f"es mayor que {t}", (lambda t: lambda n: n > t)(t))
        a1 = rng.choice([("divide entre 2", lambda n: F(n, 2)), ("suma 5", lambda n: n + 5), ("resta 3", lambda n: n - 3),
                         ("multiplica por 2", lambda n: 2 * n), ("resta 10", lambda n: n - 10)])
        a2 = rng.choice([("multiplica por 3 y suma 1", lambda n: 3 * n + 1), ("suma 7", lambda n: n + 7), ("multiplica por 4", lambda n: 4 * n),
                         ("resta 1", lambda n: n - 1), ("multiplica por 2 y resta 1", lambda n: 2 * n - 1)])
        if a1[0] == a2[0]:
            continue
        n = rng.randint(2, 40)
        if d == 3:
            t2 = rng.randint(3, 25)
            cond2 = f"es menor que {t2}"
            f2 = (lambda t2: lambda m: m < t2)(t2)
        rama = f(n)
        r = a1[1](n) if rama else a2[1](n)
        otra = a2[1](n) if rama else a1[1](n)
        ambas = a2[1](a1[1](n))
        if d == 3:
            r2 = r + 100 if f2(r) else r - 1
            final = r2
        else:
            final = r
        if any(F(v).denominator != 1 or v < 0 for v in (r, otra, ambas, final)):
            continue
        break
    txt = f"Si el número {cond}, {a1[0]}; si no, {a2[0]}."
    if d == 3:
        txt += f" Después, al resultado: si {cond2}, súmale 100; si no, réstale 1."
        dist = [(N(otra + 100 if f2(otra) else otra - 1), "rama_equivocada"), (N(ambas + 100 if f2(ambas) else ambas - 1), "dos_ramas"),
                (N(r), None)]
    else:
        dist = [(N(otra), "rama_equivocada"), (N(ambas), "dos_ramas")]
    return mk(f"Sigue el algoritmo con la entrada {n}. {txt} ¿Qué sale?", N(final), "t5_condicional", dist,
              [N(final + 1), N(final - 1), N(final + 2), N(n)],
              [f"¿{n} {cond}? {'Sí' if rama else 'No'}, así que {a1[0] if rama else a2[0]}: sale {N(r)}."] +
              ([f"Segunda condición: ¿{N(r)} {cond2}? {'Sí: le sumo 100' if f2(r) else 'No: le resto 1'} → {N(final)}."] if d == 3 else []),
              "En un condicional solo se ejecuta UNA de las ramas: primero se evalúa la condición con el número que hay en ese momento.",
              entrada=n)


@generador("t5_contador")
def gen_contador(rng, d):
    for _ in range(300):
        x0 = rng.choice([0, 0, 1, 2, 5])
        n = rng.randint(3, 5)
        a = rng.randint(2, 6)
        t = rng.randint(4, 15)
        b = rng.randint(1, 4)
        tipo = rng.choice(["mayor", "par"]) if d > 1 else "mayor"
        m = rng.randint(2, 3) if d == 3 else 1

        def corre(vueltas, fija=None, sin_actualizar=False):
            x = x0
            decision = None
            for _ in range(vueltas):
                base = x0 if sin_actualizar else x
                y = base + a * m
                c = (y > t) if tipo == "mayor" else (y % 2 == 0)
                if fija is not None:
                    if decision is None:
                        decision = c
                    c = decision
                x = y - b if c else y
            return x
        r = corre(n)
        vals = {"no_actualiza": corre(n, sin_actualizar=True), "cond_una_vez": corre(n, fija=True),
                "vueltas_mal": corre(n + 1), "vueltas_menos": corre(n - 1)}
        if len({r, *vals.values()}) >= 4:
            break
    cuerpo = f"x = x + {a}" if m == 1 else f"repite {m} veces [x = x + {a}]"
    cond = f"si x > {t} entonces x = x − {b}" if tipo == "mayor" else f"si x es par entonces x = x − {b}"
    return mk(f"Traza el programa: x = {x0}; repite {n} veces [{cuerpo}; {cond}]. ¿Cuánto vale x al final?",
              N(r), "t5_contador", [(N(vals["no_actualiza"]), "no_actualiza"), (N(vals["cond_una_vez"]), "cond_una_vez"),
                                    (N(vals["vueltas_mal"]), "vueltas_mal"), (N(vals["vueltas_menos"]), "vueltas_mal")],
              [N(r + 1), N(r - 1), N(r + b)],
              [f"Hago una tabla con el valor de x en cada vuelta, empezando en {x0}.",
               "En cada vuelta primero sumo y después miro la condición con el valor NUEVO de x.",
               f"Tras {n} vueltas, x = {N(r)}."],
              "Trazar un programa es llevar una tabla vuelta a vuelta; la variable se actualiza y la condición se vuelve a evaluar en cada vuelta.",
              x0=x0, n=n, a=a, t=t, b=b)


@generador("t5_pseudocodigo")
def gen_pseudocodigo(rng, d):
    fs = [("i", lambda i: i), ("i·i", lambda i: i * i), ("2·i", lambda i: 2 * i), ("i + 1", lambda i: i + 1), ("3·i", lambda i: 3 * i)]
    for _ in range(200):
        ini = rng.randint(1, 3)
        fin = rng.randint(4, 8)
        ft, f = rng.choice(fs)
        cond = None
        if d >= 2 and rng.random() < 0.6:
            cond = rng.choice([("i es par", lambda i: i % 2 == 0), ("i es impar", lambda i: i % 2 == 1), (f"i no es múltiplo de 3", lambda i: i % 3 != 0)])
        s0 = 0 if d < 3 else rng.choice([0, 1, 10])

        def traza(a, b, acumula=True):
            s = s0
            for i in range(a, b + 1):
                if cond and not cond[1](i):
                    continue
                s = s + f(i) if acumula else f(i)
            return s
        r = traza(ini, fin)
        vals = [(traza(ini, fin - 1), "limite_bucle"), (traza(ini, fin + 1), "limite_bucle"), (traza(ini, fin, False), "no_acumula")]
        if len({r, *[v for v, _ in vals]}) == 4:
            break
    linea = f"s = s + {ft}"
    prog = f"s = {s0}; para i de {ini} a {fin}: " + (f"si {cond[0]}: {linea}" if cond else linea) + "; escribe s"
    return mk(f"¿Qué escribe este algoritmo? {prog}", N(r), "t5_pseudocodigo", [(N(v), k) for v, k in vals],
              [N(r + f(fin)), N(r - 1), N(r + 1)],
              [f"'s = s + …' significa: al valor que ya tiene s le sumo lo nuevo (acumula).",
               f"i toma los valores {ini}, {ini + 1}, …, {fin} (incluidos los dos extremos)" + (f", y solo sumo cuando {cond[0]}" if cond else "") + ".",
               f"Al final s = {N(r)}."],
              "Una asignación no es una ecuación: 's = s + i' se lee 'el nuevo s es el viejo s más i'. Los bucles 'para i de a a b' incluyen a y b.",
              programa=prog)


# ================================================================ ALG.EC1

@generador("t5_hueco_suma")
def gen_hueco_suma(rng, d):
    for _ in range(100):
        a, b = rng.randint(1, 12), rng.randint(1, 12)
        c = a + b
        if c <= 20:
            break
    formas = {1: ["□+a=c", "a+□=c"], 2: ["c−□=b", "□−a=b", "c−□=a"], 3: ["c=□+a", "b=c−□", "c=a+□"]}[d]
    f = rng.choice(formas)
    if f == "□+a=c":
        e, r, dist = f"□ + {a} = {c}", b, [(c + a, "opera_visibles")]
    elif f == "a+□=c":
        e, r, dist = f"{a} + □ = {c}", b, [(c + a, "opera_visibles")]
    elif f == "c−□=b":
        e, r, dist = f"{c} − □ = {b}", a, [(c + b, "hueco_resultado")]
    elif f == "c−□=a":
        e, r, dist = f"{c} − □ = {a}", b, [(c + a, "hueco_resultado")]
    elif f == "□−a=b":
        e, r, dist = f"□ − {a} = {b}", c, [(b - a if b > a else a - b, "opera_visibles")]
    elif f == "c=□+a":
        e, r, dist = f"{c} = □ + {a}", b, [(c + a, "igual_al_reves")]
    elif f == "c=a+□":
        e, r, dist = f"{c} = {a} + □", b, [(c + a, "igual_al_reves")]
    else:
        e, r, dist = f"{b} = {c} − □", a, [(b + c, "igual_al_reves")]
    return mk(f"¿Qué número va en el hueco? {e}", N(r), "t5_hueco", [(N(v), k) for v, k in dist],
              [N(r + 1), N(r - 1), N(r + 2), N(r - 2)],
              [f"Busco el número que hace que los dos lados valgan lo mismo.", f"Pruebo con {r}: {e.replace('□', str(r))}. ✓ El número es {r}."],
              "El signo = significa 'vale lo mismo que'. Para encontrar el hueco sirve la operación contraria o contar hacia delante/atrás.",
              igualdad=e)


@generador("t5_hueco_mult")
def gen_hueco_mult(rng, d):
    a, b = rng.randint(2, 10), rng.randint(2, 10)
    c = a * b
    if d == 1:
        f = rng.choice(["□×a", "a×□"])
        e = f"□ × {a} = {c}" if f == "□×a" else f"{a} × □ = {c}"
        r, dist = b, [(c * a, "multiplica"), (c - a, None)]
    elif d == 2:
        f = rng.choice(["c:□", "□:a"])
        if f == "c:□":
            e, r, dist = f"{c} : □ = {b}", a, [(c * b, "divide_al_reves"), (c - b, None)]
        else:
            e, r, dist = f"□ : {a} = {b}", c, [(F(b, a) if b % a == 0 else b + a, "divide_al_reves"), (b, None)]
    else:
        f = rng.choice(["suma", "div"])
        if f == "suma":
            for _ in range(50):
                p, q, s = rng.randint(2, 40), rng.randint(2, 40), rng.randint(2, 40)
                if p + q - s > 0 and p + q > s:
                    break
            e, r, dist = f"{s} + □ = {p} + {q}", p + q - s, [(p + q, "copia_lado")]
        else:
            m, n_ = rng.randint(2, 8), rng.randint(1, 8)
            tot = m + n_
            c2 = tot * a
            e, r, dist = f"{c2} : □ = {m} + {n_}", a, [(tot, "copia_lado"), (c2 * tot, "divide_al_reves")]
    return mk(f"¿Qué número va en el hueco? {e}", N(r), "t5_hueco", [(N(v), k) for v, k in dist],
              [N(r + 1), N(r - 1), N(r + 2), N(r * 2)],
              ["Si hay algo calculable en un lado, lo calculo primero.", f"Busco el número que iguala los dos lados: {e.replace('□', str(r))}. ✓ Es {r}."],
              "La multiplicación y la división son operaciones inversas: □ × 6 = 42 se resuelve con 42 : 6. El = obliga a que los dos lados valgan lo mismo.",
              igualdad=e)


@generador("t5_letra")
def gen_letra(rng, d):
    L = rng.choice(["x", "a", "n", "y", "m", "b"])
    x = rng.randint(2, 15)
    if d == 1:
        if rng.random() < 0.5:
            b = rng.randint(3, 40)
            e, dist = f"{L} + {b} = {x + b}", [(x + 2 * b, None)]
        else:
            b = rng.randint(2, 9)
            e = f"{b}{L} = {b * x}" if rng.random() < 0.5 else f"{b}·{L} = {b * x}"
            dist = [(b * x - 10 * b if b * x - 10 * b > 0 else b * x * b, "pegado"), (b * x - b, None)]
    else:
        a = rng.randint(2, 9)
        b = rng.randint(1, 30)
        s = rng.choice([1, -1]) if d == 3 else 1
        c = a * x + s * b
        if c <= 0:
            s, c = 1, a * x + b
        e = f"{a}·{L} {'+' if s > 0 else '−'} {b} = {c}"
        od = F(c, a) - s * b
        dist = [(od if od.denominator == 1 and od > 0 else c - s * b, "orden_directo"), (c - s * b, None), (F(c + s * b, a) if (c + s * b) % a == 0 else c - a, None)]
    r = x
    return mk(f"Halla el valor de la letra: {e}", f"{L} = {N(r)}", "t5_letra", [(f"{L} = {N(v)}", k) for v, k in dist],
              [f"{L} = {N(r + 1)}", f"{L} = {N(r - 1)}", f"{L} = {N(r + 2)}"],
              ["Deshago las operaciones empezando por la última que se hizo (la suma o la resta) y después la multiplicación.",
               f"{L} = {r}. Compruebo: {e.split('=')[0].replace(L, f'({r})').strip()} = {e.split('=')[1].strip()}. ✓"],
              "La letra es un número desconocido. Se despeja deshaciendo las operaciones en orden inverso; 3a significa 3 × a.",
              ecuacion=e)


def _lado(ts, v="x"):
    """ts: [(coef, exp)] en el orden dado."""
    return terms([(c, v if e == 1 else "") for c, e in ts])


@generador("t5_ec_comprobar")
def gen_ec_comprobar(rng, d):
    if d == 1:
        a, b, c, e = nz(rng, -6, 7), rng.randint(-9, 9), nz(rng, -6, 7), rng.randint(-9, 9)
        if a == c:
            c += 1
        izq, der = _lado([(a, 1), (b, 0)]), _lado([(c, 1), (e, 0)])
        preg = rng.choice(["segundo", "primero", "incognita", "terminos"])
        if preg == "segundo":
            return mk(f"En la ecuación {izq} = {der}, ¿cuál es el segundo miembro?", der, "t5_ec_elementos",
                      [(izq, "miembros"), (f"{izq} = {der}", None), (N(e) if e else "x", None)], [_lado([(c, 1)]), N(c)],
                      ["El primer miembro es lo que está a la izquierda del = y el segundo, lo que está a la derecha.", f"Segundo miembro: {der}."],
                      "Una ecuación tiene dos miembros separados por el signo =; cada miembro está formado por términos.")
        if preg == "primero":
            return mk(f"En la ecuación {izq} = {der}, ¿cuál es el primer miembro?", izq, "t5_ec_elementos",
                      [(der, "miembros"), (f"{izq} = {der}", None), (_lado([(a, 1)]), None)], [N(b), N(a)],
                      ["El primer miembro es lo que está a la izquierda del =.", f"Primer miembro: {izq}."],
                      "Una ecuación tiene dos miembros separados por el signo =.")
        if preg == "terminos":
            nt = sum(1 for v in (a, b, c, e) if v)
            return mk(f"¿Cuántos términos tiene en total la ecuación {izq} = {der}?", str(nt), "t5_ec_elementos",
                      [(str(nt - 1 if nt > 2 else nt + 1), None), ("2", "miembros"), (str(nt + 1), None)], ["1", "5", "6"],
                      ["Cada sumando de cada miembro es un término.", f"Hay {nt} términos."],
                      "Los términos son los sumandos (con su signo) de cada miembro.")
        return mk(f"En la ecuación {izq} = {der}, ¿cuál es la incógnita?", "x", "t5_ec_elementos",
                  [(N(a) if a not in (1, -1) else N(b or 7), None), (der, "miembros"), ("No tiene incógnita", None)], ["=", N(e or 3)],
                  ["La incógnita es la letra cuyo valor no conocemos.", "Es x."],
                  "La incógnita es el número desconocido, representado por una letra.")
    for _ in range(200):
        a, b, c, e = nz(rng, -7, 7), rng.randint(-12, 12), nz(rng, -7, 7), rng.randint(-12, 12)
        if a == c:
            continue
        x = rng.randint(-5, 6) if d == 3 else rng.randint(1, 6)
        if rng.random() < 0.5:
            e = a * x + b - c * x  # es solución
        L, R = a * x + b, c * x + e
        Lm, Rm = a * -x + b, c * -x + e  # signo mal del negativo: usa |x|
        if x < 0:
            Lm, Rm = a * abs(x) + b, c * abs(x) + e
        break
    izq, der = _lado([(a, 1), (b, 0)]), _lado([(c, 1), (e, 0)])
    si = lambda l, r: f"Sí: los dos miembros valen {N(l)}" if l == r else f"No: el primer miembro vale {N(l)} y el segundo {N(r)}"
    resp = si(L, R)
    dist = [(si(Lm, Rm) if x < 0 else si(L, R + 1), "signo_negativo" if x < 0 else None),
            (f"Sí: los dos miembros valen {N(L)}" if L != R else f"No: el primer miembro vale {N(L)} y el segundo {N(e)}", "un_miembro")]
    return mk(f"¿Es x = {N(x)} solución de la ecuación {izq} = {der}?", resp, "t5_ec_comprobar", dist,
              [si(L + 1, R), si(L, R - 1), si(L - 2, R + 2)],
              [f"Sustituyo x por ({N(x)}) en el primer miembro: {N(L)}.", f"Y en el segundo miembro: {N(R)}.",
               ("Coinciden: es solución." if L == R else "No coinciden: no es solución.")],
              "Comprobar una solución es sustituir en LOS DOS miembros; con números negativos, siempre entre paréntesis.",
              x=x, a=a, b=b, c=c, e=e)


@generador("t5_ec1_simple")
def gen_ec1_simple(rng, d):
    forma = rng.choice(["x+a=b", "ax=b"]) if d == 1 else ("ax+b=c" if d == 2 else rng.choice(["ax+b=c", "−ax+b=c", "b−ax=c"]))
    for _ in range(100):
        x = F(rng.randint(-9, 12)) if d > 1 else F(rng.randint(1, 15))
        if forma == "x+a=b":
            a, b = 1, nz(rng, -15, 15)
        elif forma == "ax=b":
            a, b = rng.choice([2, 3, 4, 5, 6, 7, 8, 9, -2, -3]), 0
        else:
            a = rng.choice([2, 3, 4, 5, 6, 7, 8, 9]) * (-1 if forma != "ax+b=c" else 1)
            b = nz(rng, -15, 15)
        if d == 3 and rng.random() < 0.35:
            x = F(rng.randint(-9, 9), rng.choice([2, 3, 4, 5]))
            if (a * x).denominator != 1:
                x = F(round(a * x), a) if a else x
        c = a * x + b
        if c.denominator == 1 and x != 0:
            break
    c = int(c)
    if forma == "b−ax=c":
        izq = terms([(b, ""), (a, "x")])
    else:
        izq = P({1: a, 0: b})
    enun = f"Resuelve: {izq} = {N(c)}"
    dist = []
    if b:
        dist.append((F(c + b, a), "sin_cambiar_signo"))
    if a not in (1,):
        dist.append((F(c - b) - a, "coef_restando"))
        dist.append((-x, "signo_coeficiente" if a < 0 else None))
        dist.append((F(c - b) * a, "coef_restando" if not b else None))
    else:
        dist.append((F(c) - b if False else c + b + 1, None))
    pasos = []
    if b:
        pasos.append(f"Paso el {N(b)} al otro miembro cambiando de signo: {P({1: a})} = {N(c)} {'−' if b > 0 else '+'} {N(abs(b))} = {N(c - b)}.")
    if a != 1:
        pasos.append(f"El {N(a)} que multiplica a la x pasa dividiendo (con su signo): x = {N(c - b)} : ({N(a)}) = {N(x)}.")
    pasos.append(f"Compruebo sustituyendo: {izq.replace('x', f'·({N(x)})') if False else 'el primer miembro vale ' + N(c)}. ✓")
    return mk(enun, f"x = {N(x)}", "ec1", [(f"x = {N(v)}", k) for v, k in dist],
              [f"x = {N(x + 1)}", f"x = {N(x - 1)}", f"x = {N(-x + 1)}", f"x = {N(x * 2)}"], pasos,
              "Lo que suma pasa restando y lo que multiplica pasa dividiendo, conservando su signo: con −3x = 12, x = 12 : (−3) = −4.",
              a=a, b=b, c=c)


def _lin_expr(ts):
    """ts: [(coef, 'x'|'')] → texto en el orden dado."""
    return terms(ts)


@generador("t5_ec1_dos_miembros")
def gen_ec1_dos(rng, d):
    for _ in range(300):
        x = F(rng.randint(-8, 10))
        if d == 3 and rng.random() < 0.3:
            x = F(rng.randint(-9, 9), rng.choice([2, 3, 5]))
        a, c = nz(rng, -9, 9), nz(rng, -9, 9)
        if a == c:
            continue
        b = nz(rng, -15, 15)
        e = (a - c) * x + b
        if e.denominator != 1 or e == 0:
            continue
        e = int(e)
        if d == 1 and (a < 0 or c < 0 or a <= c):
            continue
        break
    if d == 3:
        # partir términos: a = a1 + a2, c = c1 + c2, constante repartida
        a1 = nz(rng, -6, 8, (a,))
        a2 = a - a1
        c1 = nz(rng, -6, 8, (c,))
        c2 = c - c1
        b1 = nz(rng, -9, 9, (b,))
        izq = _lin_expr([(b1, ""), (a1, "x"), (a2, "x"), (b - b1, "")])
        der = _lin_expr([(c1, "x"), (c2, "x"), (e, "")])
    else:
        izq, der = P({1: a, 0: b}), P({1: c, 0: e})
    dist = [((F(e + b, a + c) if a + c else None), "sin_cambiar_signo"),
            ((F(e - b) * (a - c)), "divide_mal"), (F(e - b, a), "deja_x")]
    dist = [(f"x = {N(v)}", k) for v, k in dist if v is not None and v != x]
    return mk(f"Resuelve: {izq} = {der}", f"x = {N(x)}", "ec1", dist,
              [f"x = {N(x + 1)}", f"x = {N(-x)}", f"x = {N(x - 1)}", f"x = {N(x + 2)}"],
              ["Agrupo las x en el primer miembro y los números en el segundo, cambiando de signo lo que cambia de miembro.",
               f"{P({1: a - c})} = {N(e - b)}.", f"Divido entre {N(a - c)}: x = {N(x)}."],
              "Transponer es sumar o restar lo mismo en los dos miembros; por eso un término cambia de signo al cambiar de lado.",
              a=a - c, b=b, c=e)


def _dist(k, ts):
    """k·(ts) → lista de términos."""
    return [(k * c, l) for c, l in ts]


def _lin_eval(ts):
    """Suma (coef_x, const) de una lista de términos lineales."""
    return sum(F(c) for c, l in ts if l == "x"), sum(F(c) for c, l in ts if l == "")


@generador("t5_ec1_parentesis")
def gen_ec1_parentesis(rng, d):
    for _ in range(500):
        x = F(rng.randint(-6, 8))
        k1 = rng.randint(2, 6)
        p1 = [(rng.choice([1, 1, 2, 3]), "x"), (nz(rng, -9, 9), "")]
        k2 = nz(rng, -5, 5) if d > 1 else 0
        p2 = [(nz(rng, -6, 6), ""), (rng.choice([1, 2, -1]), "x")] if d > 1 else []
        if d == 3:
            k1 = -k1 if rng.random() < 0.4 else k1
        rc, rk = nz(rng, -4, 5), rng.randint(-10, 10)
        L = _dist(k1, p1) + _dist(k2, p2)
        ax, bx = _lin_eval(L)
        if ax == rc:
            continue
        # ajusta término independiente del 2.º miembro para que x sea solución
        rk = ax * x + bx - rc * x
        if rk.denominator != 1:
            continue
        # errores
        L1 = [(k1 * p1[0][0], "x"), (p1[1][0], "")] + _dist(k2, p2)  # distributiva incompleta en el 1.º
        e1 = _lin_eval(L1)
        sol1 = F(rk - e1[1], e1[0] - rc) if e1[0] != rc else None
        if k2 < 0:
            L2 = _dist(k1, p1) + [(k2 * p2[0][0], ""), (-k2 * p2[1][0], "x")]  # menos solo al primero
        else:
            L2 = _dist(k1, p1) + [(k2 * p2[0][0], ""), (p2[1][0], "x")] if p2 else L1
        e2 = _lin_eval(L2)
        sol2 = F(rk - e2[1], e2[0] - rc) if e2[0] != rc else None
        if sol1 not in (None, x) and sol2 != x:
            break
    def ptxt(k, p):
        if not p:
            return ""
        inner = _lin_expr(p)
        if k == 1:
            return f"({inner})"
        if k == -1:
            return f"−({inner})"
        return f"{N(k)}({inner})"
    izq = ptxt(k1, p1)
    if k2:
        t2 = ptxt(abs(k2), p2)
        izq += (" − " if k2 < 0 else " + ") + t2
    der = P({1: rc, 0: rk})
    dist = [(f"x = {N(sol1)}", "distributiva_incompleta")]
    if sol2 is not None and sol2 != x:
        dist.append((f"x = {N(sol2)}", "menos_delante" if k2 < 0 else "distributiva_incompleta"))
    return mk(f"Resuelve: {izq} = {der}", f"x = {N(x)}", "ec1", dist,
              [f"x = {N(-x)}", f"x = {N(x + 1)}", f"x = {N(x - 2)}", f"x = {N(x + 3)}"],
              [f"Quito paréntesis multiplicando el número de fuera por TODOS los términos de dentro (con su signo): {_lin_expr(L)} = {der}.",
               f"Reduzco: {P({1: ax, 0: bx})} = {der}.", f"Agrupo y despejo: {P({1: ax - rc})} = {N(rk - bx)} → x = {N(x)}."],
              "El número de delante multiplica a todos los términos del paréntesis; un signo menos delante cambia el signo de todos ellos.",
              a=int(ax - rc), b=int(bx), c=int(rk))


@generador("t5_ec1_denominadores")
def gen_ec1_denominadores(rng, d):
    for _ in range(800):
        m1, m2 = rng.sample([2, 3, 4, 5, 6], 2)
        a1, a2 = rng.choice([1, 1, 2, 3]), rng.choice([1, 2, 3])
        b1, b2 = nz(rng, -7, 7), nz(rng, -7, 7)
        s = rng.choice([1, -1]) if d > 1 else 1
        # ecuación: (a1 x + b1)/m1 + s (a2 x + b2)/m2 = K   (K entero en d<3, fracción en d3)
        x = F(rng.randint(-6, 9))
        if d == 3 and rng.random() < 0.4:
            x = F(rng.randint(-7, 7), 2)
        K = (a1 * x + b1) / m1 + s * (a2 * x + b2) / m2
        if d < 3 and K.denominator != 1:
            continue
        if K.denominator > 12:
            continue
        cx = F(a1, m1) + s * F(a2, m2)
        if cx == 0:
            continue
        mcm = math.lcm(m1, m2, K.denominator)
        # E01: solo multiplica los términos con denominador (K sin multiplicar)
        # (a1x+b1)·mcm/m1 + s(a2x+b2)·mcm/m2 = K
        ex = a1 * F(mcm, m1) + s * a2 * F(mcm, m2)
        e0 = b1 * F(mcm, m1) + s * b2 * F(mcm, m2)
        s1 = F(K - e0, ex) if (K.denominator == 1 and ex) else None
        # E02: raya ignorada: −(a2x + b2)/m2 → −a2x + b2
        s2 = None
        if s < 0:
            ex2 = a1 * F(mcm, m1) - a2 * F(mcm, m2)
            e02 = b1 * F(mcm, m1) + b2 * F(mcm, m2)
            s2 = F(K * mcm - e02, ex2) if ex2 else None
        if s1 not in (None, x) and (s < 0 and s2 not in (None, x) or s > 0 or d == 1):
            break
    t1 = f"({P({1: a1, 0: b1})})/{m1}"
    t2 = f"({P({1: a2, 0: b2})})/{m2}"
    enun = f"Resuelve: {t1} {'+' if s > 0 else '−'} {t2} = {N(K)}"
    dist = [(f"x = {N(s1)}", "solo_con_denominador")]
    if s2 is not None:
        dist.append((f"x = {N(s2)}", "raya_ignorada"))
    return mk(enun, f"x = {N(x)}", "t5_ec1_den", dist, [f"x = {N(-x)}", f"x = {N(x + 1)}", f"x = {N(x * 2)}", f"x = {N(x - 1)}"],
              [f"Multiplico los DOS miembros (todos los términos) por el mcm de los denominadores, {mcm}.",
               "Cada numerador va entre paréntesis: el signo menos de delante de una fracción afecta a todo su numerador.",
               f"Quito paréntesis, agrupo y despejo: x = {N(x)}."],
              "Multiplicar por el mcm convierte la ecuación en otra sin denominadores equivalente; la raya de fracción actúa como un paréntesis.",
              x=x, mcm=mcm)


@generador("t5_ec1_casos")
def gen_ec1_casos(rng, d):
    for _ in range(100):
        k = rng.randint(2, 5)
        b = nz(rng, -6, 6)
        c = nz(rng, -4, 4)
        e = rng.randint(-9, 9)
        inf = rng.random() < 0.5
        # k(x + b) + c x + e = (k + c) x + f
        f = k * b + e if inf else k * b + e + nz(rng, -6, 6)
        if k + c != 0:
            break
    if d == 1:
        izq = f"{k}(x {'+' if b > 0 else '−'} {abs(b)})"
        der = P({1: k, 0: f - e})
        f2 = f - e
        inf = (k * b == f2)
    else:
        izq = f"{k}(x {'+' if b > 0 else '−'} {abs(b)})" + (f" {'+' if c > 0 else '−'} {_body(abs(c), 'x')}") + (f" {'+' if e > 0 else '−'} {abs(e)}" if e else "")
        der = P({1: k + c, 0: f})
    resp = "Infinitas soluciones" if inf else "No tiene solución"
    dist = [("x = 0", "x_cero"), ("No tiene solución" if inf else "Infinitas soluciones", "identidad_sin_solucion" if inf else None),
            (f"x = {N(abs(f - k * b - e) or 1)}", None)]
    return mk(f"Resuelve: {izq} = {der}", resp, "t5_ec1_casos", dist, ["x = 1", "x = −1"],
              ["Quito paréntesis y paso las x a un miembro y los números al otro.",
               ("Las x se anulan y queda 0 = 0, que es cierto siempre: cualquier número es solución." if inf else
                "Las x se anulan y queda 0 = un número distinto de 0, que es falso siempre: no hay solución.")],
              "0·x = c con c ≠ 0 no tiene solución; 0·x = 0 la cumple cualquier x (identidad).",
              infinitas=inf)


# ================================================================ ALG.EC2

@generador("t5_ec2_incompleta")
def gen_ec2_inc(rng, d):
    tipo = rng.choice(["c", "b"]) if d > 1 else rng.choice(["c", "c", "b"])
    a = 1 if d == 1 else rng.choice([1, 2, 3, 4, 5])
    if tipo == "c":
        sin = d > 1 and rng.random() < 0.25
        r = F(rng.randint(1, 9), rng.choice([1, 1, 2, 3]) if d == 3 else 1)
        # a x² − a r² = 0 con r² racional → coeficientes enteros
        k = a * r.denominator ** 2 if r.denominator > 1 else a
        c = k * r * r
        if sin:
            enun = f"Resuelve: {P({2: k, 0: c})} = 0"
            resp = "Sin solución real"
            dist = [(sols([-r, r]), "raiz_negativo"), (sols([r]), "olvida_negativa"), ("x = 0", None)]
        else:
            enun = f"Resuelve: {P({2: k, 0: -c})} = 0" if rng.random() < 0.7 else f"Resuelve: {P({2: k})} = {N(c)}"
            resp = sols([-r, r])
            dist = [(sols([r]), "olvida_negativa"), (sols([-r * r, r * r]) if r * r != r else sols([-c, c]), None), (sols([-c, c]) if c != r else sols([-2 * r, 2 * r]), None)]
        pasos = [f"Despejo x²: x² = {N(-c if sin else c)}/{k}." if k != 1 else f"Despejo x²: x² = {N(-c if sin else c)}.",
                 "Un cuadrado no puede ser negativo: no hay solución real." if sin else f"Hago la raíz con ±: x = ±{N(r)}."]
    else:
        b = nz(rng, -9, 9)
        if d == 3 and abs(b) % a == 0:
            b += 1 if b > 0 else -1
        r = F(-b, a)
        enun = f"Resuelve: {P({2: a, 1: b})} = 0"
        resp = sols([0, r])
        dist = [(sols([r]), "divide_x"), (sols([0, -r]), None), (sols([0, F(b, 1)]) if a != 1 else sols([0, r + 1]), None)]
        pasos = [f"Saco factor común x: x({P({1: a, 0: b})}) = 0.", f"Un producto vale 0 si algún factor es 0: x = 0 o {P({1: a, 0: b})} = 0 → x = {N(r)}."]
    return mk(enun, resp, "t5_ec2", dist, ["x = 0", sols([1, -1]) if resp != sols([-1, 1]) else sols([2, -2]), "Sin solución real"], pasos,
              "En las incompletas no hace falta la fórmula: ax² + c = 0 se despeja (¡con ±!), y ax² + bx = 0 se factoriza. Dividir entre x pierde la solución x = 0.")


def _cuad(a, b, c):
    """Raíces racionales de ax² + bx + c (lista) o None si Δ no es cuadrado; [] si Δ < 0."""
    Dl = b * b - 4 * a * c
    if Dl < 0:
        return []
    s = math.isqrt(Dl)
    if s * s != Dl:
        return None
    return sorted({F(-b + s, 2 * a), F(-b - s, 2 * a)})


@generador("t5_ec2_completa")
def gen_ec2_completa(rng, d):
    for _ in range(500):
        if d == 1:
            r1, r2 = nz(rng, -9, 9), nz(rng, -9, 9)
            k = 1
            a, b, c = 1, -(r1 + r2), r1 * r2
        else:
            p1, q1 = nz(rng, -6, 6), rng.choice([1, 1, 2, 3])
            p2, q2 = nz(rng, -6, 6), rng.choice([1, 2]) if d == 3 else 1
            k = rng.choice([1, 1, 2, -1]) if d == 2 else 1
            a, b, c = k * q1 * q2, -k * (q1 * p2 + q2 * p1), k * p1 * p2
        if d > 1 and rng.random() < 0.15:
            # sin solución real
            a, b, c = rng.randint(1, 3), rng.randint(-5, 5), rng.randint(3, 9)
            if b * b - 4 * a * c >= 0:
                continue
        g = math.gcd(math.gcd(a, b), c)
        if g > 1:
            a, b, c = a // g, b // g, c // g
        if b == 0 or c == 0:
            continue
        rs = _cuad(a, b, c)
        if rs is None:
            continue
        break
    Dl = b * b - 4 * a * c
    resp = sols(rs)
    dist = []
    rb = _cuad(a, -b, c)
    if rb:
        dist.append((sols(rb), "signo_b"))
    Dm = -b * b - 4 * a * c
    if Dm >= 0 and math.isqrt(Dm) ** 2 == Dm:
        dist.append((sols([F(-b + math.isqrt(Dm), 2 * a), F(-b - math.isqrt(Dm), 2 * a)]), "b2_negativo"))
    elif Dm < 0 and rs:
        dist.append(("Sin solución real", "b2_negativo"))
    if Dl >= 0:
        s = math.isqrt(Dl)
        dist.append((sols([-b + F(s, 2 * a), -b - F(s, 2 * a)]), "divide_solo_raiz"))
        dist.append((sols([F(-b + s, a), F(-b - s, a)]), "denominador_a"))
    else:
        s = math.isqrt(-Dl)
        dist.append((sols([F(-b + s, 2 * a), F(-b - s, 2 * a)]) if s * s == -Dl else sols([F(-b, 2 * a)]), None))
    gen = [sols([-x for x in rs]) if rs else "x = 1", sols([rs[0] + 1, rs[-1]]) if rs else "x = 0", sols([x * 2 for x in rs]) if rs else "x = −1, x = 1"]
    forma = P({2: a, 1: b, 0: c})
    pasos = [f"a = {N(a)}, b = {N(b)}, c = {N(c)}. Δ = b² − 4ac = ({N(b)})² − 4·({N(a)})·({N(c)}) = {N(Dl)}."]
    if Dl < 0:
        pasos.append("Δ < 0: no hay soluciones reales.")
    else:
        pasos.append(f"x = (−b ± √Δ)/(2a) = ({N(-b)} ± {math.isqrt(Dl)})/{N(2 * a)} → {resp}.")
    return mk(f"Resuelve: {forma} = 0", resp, "t5_ec2", dist, gen, pasos,
              "x = (−b ± √(b² − 4ac))/(2a): todo el numerador se divide entre 2a; b² siempre es positivo; −b cambia el signo de b.",
              a=a, b=b, c=c)


@generador("t5_discriminante")
def gen_discriminante(rng, d):
    CAT = {1: "Dos soluciones reales distintas", 0: "Una solución real (doble)", -1: "Ninguna solución real"}
    if d < 3:
        for _ in range(200):
            a, b, c = nz(rng, -4, 5), rng.randint(-10, 10), nz(rng, -12, 12)
            caso = rng.choice([1, 0, -1])
            if caso == 0:
                r = nz(rng, -6, 6)
                k = rng.choice([1, 2, 3, -1])
                a, b, c = k, -2 * k * r, k * r * r
            Dl = b * b - 4 * a * c
            s = (Dl > 0) - (Dl < 0)
            if s == caso:
                break
        resp = CAT[s]
        otros = [v for k, v in CAT.items() if k != s]
        dist = [(CAT[1], "negativo_dos") if s == -1 else (otros[0], None), (otros[1] if s == -1 else otros[1], None), ("Infinitas soluciones", None)]
        if s == -1:
            dist = [(CAT[1], "negativo_dos"), (CAT[0], None), ("Infinitas soluciones", None)]
        return mk(f"Sin resolverla, ¿cuántas soluciones reales tiene {P({2: a, 1: b, 0: c})} = 0?", resp, "t5_discriminante", dist, [],
                  [f"Δ = b² − 4ac = ({N(b)})² − 4·({N(a)})·({N(c)}) = {N(Dl)}.",
                   {1: "Δ > 0: dos soluciones.", 0: "Δ = 0: una solución doble.", -1: "Δ < 0: ninguna solución real."}[s]],
                  "El discriminante Δ = b² − 4ac decide: positivo → 2 soluciones, cero → 1 (doble), negativo → ninguna real.", a=a, b=b, c=c)
    # parámetro para solución doble
    b = nz(rng, -12, 12)
    tipo = rng.choice(["c", "a", "b"])
    if tipo == "c":
        a = rng.choice([1, 1, 2, 3])
        k = F(b * b, 4 * a)
        enun = f"¿Para qué valor de k tiene {P({2: a, 1: b})} + k = 0 una solución doble?"
        resp = f"k = {N(k)}"
        dist = [("k = 0", "iguala_c"), (f"k = {N(F(b * b, 2 * a))}", None), (f"k = {N(-k)}", None)]
    elif tipo == "a":
        c = nz(rng, -6, 6)
        k = F(b * b, 4 * c)
        enun = f"¿Para qué valor de k tiene kx² {'+' if b > 0 else '−'} {_body(abs(b), 'x')} {'+' if c > 0 else '−'} {abs(c)} = 0 una solución doble?"
        resp = f"k = {N(k)}"
        dist = [("k = 0", "iguala_c"), (f"k = {N(-k)}", None), (f"k = {N(F(b * b, 2 * c))}", None)]
    else:
        a, c = rng.choice([(1, 4), (1, 9), (1, 16), (1, 25), (4, 1), (9, 1), (1, 36), (4, 9), (9, 4), (2, 8), (3, 12)])
        c *= rng.choice([1, 1])
        kk = 2 * math.isqrt(a * c)
        enun = f"¿Para qué valores de k tiene {P({2: a})} + kx + {c} = 0 una solución doble?"
        resp = f"k = {N(-kk)}, k = {N(kk)}"
        dist = [(f"k = {N(kk)}", None), ("k = 0", "iguala_c"), (f"k = {N(-2 * kk)}, k = {N(2 * kk)}", None)]
    return mk(enun, resp, "t5_discriminante", dist, ["k = 1", "k = −1"],
              ["Hay solución doble cuando el discriminante vale 0: b² − 4ac = 0.", f"Planteo esa ecuación con k y la resuelvo: {resp}."],
              "La condición 'una solución doble' es Δ = 0; no es lo mismo que igualar a 0 un coeficiente.")


@generador("t5_suma_producto")
def gen_suma_producto(rng, d):
    if d < 3:
        a = rng.choice([1, 2, 3, 4, 5, -1, -2]) if d == 2 else 1
        b, c = rng.randint(-12, 12), nz(rng, -15, 15)
        if b == 0:
            b = 5
        que = rng.choice(["suma", "producto"])
        forma = P({2: a, 1: b, 0: c})
        if que == "suma":
            r = F(-b, a)
            dist = [(N(F(b, a)), "suma_signo"), (N(F(c, a)), None), (N(-b), None)]
            if N(-b) == N(r):
                dist[2] = (N(b), None)
        else:
            r = F(c, a)
            dist = [(N(-F(c, a)), None), (N(F(-b, a)), None), (N(c * a) if a != 1 else N(c + 1), None)]
        return mk(f"Sin resolver la ecuación {forma} = 0, ¿cuánto vale {'la suma' if que == 'suma' else 'el producto'} de sus soluciones?", N(r), "t5_suma_producto", dist,
                  [N(r + 1), N(r - 1), N(2 * r)],
                  [f"Si x₁ y x₂ son las soluciones de ax² + bx + c = 0: x₁ + x₂ = −b/a y x₁·x₂ = c/a.", f"Aquí a = {N(a)}, b = {N(b)}, c = {N(c)}: la {que} es {N(r)}."],
                  "Las relaciones de Cardano-Vieta permiten obtener datos de las soluciones sin calcularlas; ¡ojo al signo de −b/a!", a=a, b=b, c=c)
    r1 = F(nz(rng, -7, 7))
    r2 = F(nz(rng, -7, 7), rng.choice([1, 2, 3]))
    if r1 == r2:
        r2 += 1
    q = r2.denominator
    a, b, c = q, -q * (r1 + r2), q * r1 * r2
    ok = lambda A, B, C: P({2: A, 1: B, 0: C}) + " = 0"
    resp = ok(a, b, c)
    dist = [(ok(a, -b, c), "factor_signo"), (ok(a, b, -c), None), (ok(1, -(r1 + r2), r1 * r2) if q == 1 else ok(1, b, c), None)]
    return mk(f"Escribe una ecuación de segundo grado con coeficientes enteros cuyas soluciones sean {N(r1)} y {N(r2)}.", resp, "t5_suma_producto", dist,
              [ok(a, b + 1, c), ok(a, b, c + 1)],
              [f"(x − x₁)(x − x₂) = 0 con x₁ = {N(r1)} y x₂ = {N(r2)}: x² − (x₁ + x₂)x + x₁·x₂ = 0.",
               f"Suma {N(r1 + r2)}, producto {N(r1 * r2)}" + (f"; multiplico por {q} para quitar denominadores" if q > 1 else "") + f": {resp}."],
              "Si r es solución, (x − r) es factor: la solución 3 da el factor (x − 3), no (x + 3).")


@generador("t5_bicuadrada")
def gen_bicuadrada(rng, d):
    cuad = [1, 4, 9, 16, 25, 36]
    caso = rng.choice(["dos_pos", "dos_pos", "pos_neg"]) if d < 3 else rng.choice(["pos_neg", "cero", "neg_neg", "dos_pos"])
    if caso == "dos_pos":
        z1, z2 = rng.sample(cuad, 2)
    elif caso == "pos_neg":
        z1, z2 = rng.choice(cuad), -rng.randint(1, 9)
    elif caso == "cero":
        z1, z2 = rng.choice(cuad), 0
    else:
        z1, z2 = -rng.randint(1, 5), -rng.randint(1, 5)
        if z1 == z2:
            z2 -= 1
    b, c = -(z1 + z2), z1 * z2
    xs = []
    for z in (z1, z2):
        if z > 0:
            xs += [math.isqrt(z), -math.isqrt(z)]
        elif z == 0:
            xs.append(0)
    resp = sols(xs)
    dist = [(sols([z for z in (z1, z2)]), "se_queda_en_z"), (sols([x for x in xs if x >= 0]) if len(xs) > 1 else None, "solo_positivas")]
    if min(z1, z2) < 0:
        zs = [abs(z) for z in (z1, z2)]
        e3 = []
        for z in zs:
            r = math.isqrt(z)
            if r * r == z:
                e3 += [r, -r]
        if e3:
            dist.append((sols(xs + e3), "raiz_z_negativo"))
    return mk(f"Resuelve: {P({4: 1, 2: b, 0: c})} = 0", resp, "t5_bicuadrada", dist,
              [sols([x * 2 for x in xs]) if xs else "x = 0", sols([1, -1]) if resp != sols([1, -1]) else sols([2, -2]), "Sin solución real"],
              [f"Cambio z = x²: z² {'+' if b >= 0 else '−'} {abs(b)}z {'+' if c >= 0 else '−'} {abs(c)} = 0 → z = {N(z1)} o z = {N(z2)}.",
               "Deshago el cambio: x = ±√z si z ≥ 0; si z < 0 no hay x real.", f"Soluciones: {resp}."],
              "Tras el cambio z = x² hay que volver a x: cada z positivo da dos soluciones (±), z = 0 da una y z negativo ninguna.")


@generador("t5_ec_polinomica")
def gen_ec_polinomica(rng, d):
    for _ in range(200):
        g = 3 if d < 3 else rng.choice([3, 4])
        rs = [rng.randint(-5, 5) for _ in range(g)]
        if d == 1:
            rs[0] = 0
        if len(set(rs)) < g - (1 if d == 3 else 0):
            continue
        p = proots(rs)
        if max(abs(c) for c in p.values()) <= 60:
            break
    resp = sols(rs)
    sin0 = [r for r in rs if r != 0]
    dist = [(sols(sin0) if 0 in rs else None, "divide_x"), (sols([-r for r in rs]), None), (sols(rs[:-1]) if len(set(rs)) > 2 else sols(rs + [1]), None)]
    return mk(f"Resuelve: {P(p)} = 0", resp, "t5_ec_polinomica", dist,
              [sols([r + 1 for r in rs]), sols(rs + [2 if 2 not in rs else -2])],
              ["Si no hay término independiente, saco factor común x (y x = 0 es solución)." if 0 in rs else "Busco raíces enteras entre los divisores del término independiente y aplico Ruffini.",
               f"Queda {factorizado(1, rs)} = 0, y un producto es 0 si alguno de sus factores lo es.", f"Soluciones: {resp}."],
              "Factorizar y aplicar 'producto igual a cero' funciona solo con el 0 al otro lado; dividir entre x pierde la solución x = 0.")


@generador("t5_ec_racional")
def gen_ec_racional(rng, d):
    if rng.random() < 0.6 or d == 3:
        # x/(x − a) + B/x = K/(x² − ax)  →  x² + Bx − Ba − K = 0
        for _ in range(500):
            a = nz(rng, -5, 5)
            r1 = nz(rng, -7, 7, (a,))
            falsa = rng.random() < 0.7
            r2 = rng.choice([0, a]) if falsa else nz(rng, -7, 7, (a, r1))
            B = -(r1 + r2)
            K = -B * a - r1 * r2
            if B and K:
                break
        enun = f"Resuelve: x/{fac(a)} {'+' if B > 0 else '−'} {abs(B)}/x = {N(K)}/({P({2: 1, 1: -a})})"
        validas = [r for r in (r1, r2) if r not in (0, a)]
        dist = [(sols([r1, r2]) if falsa else None, "no_comprueba"), (sols([-r for r in validas]), None), (sols([r1, r2, 0 if 0 not in (r1, r2) else a]), None)]
        pasos = [f"x² − {a}x = x{fac(a)} es el mcm: multiplico TODOS los términos por él: x·x {'+' if B > 0 else '−'} {abs(B)}{fac(a)} = {N(K)}.",
                 f"x² {'+' if B > 0 else '−'} {abs(B)}x {'+' if -B * a - K >= 0 else '−'} {abs(-B * a - K)} = 0 → x = {N(r1)} o x = {N(r2)}."]
    else:
        # A/(x − a) + B/x = 1  →  x² − (a + A + B)x + Ba = 0
        for _ in range(500):
            a = nz(rng, -5, 5)
            r1, r2 = nz(rng, -6, 6, (a,)), nz(rng, -6, 6, (a,))
            if r1 == r2 or (r1 * r2) % a:
                continue
            B = r1 * r2 // a
            A = r1 + r2 - a - B
            if A and B and A + B:
                break
        enun = f"Resuelve: {'−' if A < 0 else ''}{abs(A)}/{fac(a)} {'+' if B > 0 else '−'} {abs(B)}/x = 1"
        validas = [r1, r2]
        dist = [(sols([F(B * a + 1 if False else 1 + B * a, A + B)]), "multiplica_algunos"), (sols([-r for r in validas]), None), (sols([r1 + 1, r2 + 1]), None)]
        pasos = [f"Multiplico TODOS los términos (también el 1) por el mcm, x{fac(a)}: {A}x + ({B}){fac(a)} = x{fac(a)}.",
                 f"Queda x² {'−' if a + A + B > 0 else '+'} {abs(a + A + B)}x {'+' if B * a > 0 else '−'} {abs(B * a)} = 0 → x = {N(r1)} o x = {N(r2)}."]
    resp = sols(validas)
    pasos.append(("Compruebo: " + ", ".join(f"x = {N(r)} anula un denominador y no vale" for r in (r1, r2) if r in (0, a)) + ". ") if len(validas) < 2 else "Ninguna anula los denominadores. ")
    pasos[-1] += f"Solución: {resp}."
    return mk(enun, resp, "t5_ec_racional", dist, [sols([r + 1 for r in validas]), "Sin solución real", sols(validas + [7])], pasos,
              "Al multiplicar por una expresión con x pueden aparecer soluciones falsas: siempre se comprueba que no anulan ningún denominador. Hay que multiplicar TODOS los términos.")


@generador("t5_ec_irracional")
def gen_ec_irracional(rng, d):
    for _ in range(500):
        c = rng.randint(-4, 4)
        r1 = rng.randint(max(-c, -3), 9)
        r2 = rng.randint(-9, 9)
        a = r1 + r2 + 2 * c
        b = c * c - r1 * r2
        if a == 0 or r1 == r2:
            continue
        # √(ax + b) = x + c : x + c ≥ 0 en las válidas y radicando ≥ 0
        val = [r for r in (r1, r2) if r + c >= 0 and a * r + b >= 0]
        if not val:
            continue
        if d == 1 and len(val) != 2 and rng.random() < 0.5:
            continue
        if d > 1 and len(val) == 2 and rng.random() < 0.7:
            continue
        break
    rad_ = P({1: a, 0: b})
    if d == 3 and c != 0:
        enun = f"Resuelve: √({rad_}) {'−' if c > 0 else '+'} {abs(c)} = x"
    else:
        enun = f"Resuelve: √({rad_}) = {P({1: 1, 0: c})}"
    resp = sols(val)
    dist = [(sols([r1, r2]) if len(val) < 2 else None, "no_comprueba")]
    # E01: (x + c)² = x² + c²
    e1 = _cuad(1, -a, c * c - b)
    if e1 and c:
        dist.append((sols(e1), "eleva_termino"))
    dist.append((sols([-r for r in val]), None))
    return mk(enun, resp, "t5_ec_irracional", dist, [sols([r + 1 for r in val]), sols([r1, r2, 0]), "Sin solución real"],
              [f"Aíslo la raíz: √({rad_}) = {P({1: 1, 0: c})}.", f"Elevo al cuadrado los dos miembros (el derecho con la identidad notable): {rad_} = {P({2: 1, 1: 2 * c, 0: c * c})}.",
               f"Resuelvo: x = {N(r1)} o x = {N(r2)}.", f"Compruebo en la ecuación original (la raíz no puede ser negativa): {resp}."],
              "Elevar al cuadrado puede introducir soluciones falsas: la comprobación final es obligatoria. (a + b)² no es a² + b².")


def pot(b, e):
    """b^(e) con paréntesis si el exponente es compuesto."""
    e = str(e)
    return f"{b}^{e}" if (len(e) == 1 or e.isdigit()) else f"{b}^({e})"


@generador("t5_ec_exponencial")
def gen_ec_exponencial(rng, d):
    base = rng.choice([2, 3, 5])
    if d == 1:
        k = rng.randint(1, 5 if base == 2 else 3)
        q = rng.randint(-4, 4)
        Nn = base ** k
        enun = f"Resuelve: {pot(base, P({1: 1, 0: q}))} = {Nn}"
        x = k - q
        resp = f"x = {N(x)}"
        dist = [(f"x = {N(Nn - q)}", "iguala_bases_distintas"), (f"x = {N(k + q)}", None), (f"x = {N(F(Nn, base) - q)}", None)]
        pasos = [f"Escribo {Nn} como potencia de {base}: {Nn} = {base}{sp(k)}.", f"Igualo exponentes: {P({1: 1, 0: q})} = {k} → x = {N(x)}."]
    elif d == 2:
        for _ in range(100):
            m = rng.randint(2, 3)
            p, q, r, s = rng.randint(1, 3), rng.randint(-3, 3), rng.randint(1, 2), rng.randint(-2, 2)
            if p - m * r != 0 and (base ** m) <= 125:
                break
        x = F(m * s - q, p - m * r)
        enun = f"Resuelve: {pot(base, P({1: p, 0: q}))} = {pot(base ** m, P({1: r, 0: s}))}"
        resp = f"x = {N(x)}"
        dist = [(f"x = {N(F(s - q, p - r))}" if p != r else None, "iguala_bases_distintas"), (f"x = {N(-x)}", None), (f"x = {N(F(m * s + q, p - m * r))}", None)]
        pasos = [f"Escribo {base ** m} = {base}{sp(m)}: el segundo miembro es {base}^({m}·({P({1: r, 0: s})})).",
                 f"Igualo exponentes: {P({1: p, 0: q})} = {P({1: m * r, 0: m * s})} → x = {N(x)}."]
    else:
        m1, m2 = rng.sample(range(0, 4), 2)
        t1, t2 = base ** m1, base ** m2
        S, Pp = t1 + t2, t1 * t2
        enun = f"Resuelve: {pot(base, '2x')} − {S}·{pot(base, 'x')} + {Pp} = 0"
        resp = sols([m1, m2])
        dist = [(sols([t1, t2]), "se_queda_en_t"), (sols([max(m1, m2)]), None), (sols([-m1, -m2]), None)]
        pasos = [f"Cambio t = {base}^x (y {base}^(2x) = t²): t² − {S}t + {Pp} = 0 → t = {t1} o t = {t2}.",
                 f"Deshago el cambio: {base}^x = {t1} → x = {m1}; {base}^x = {t2} → x = {m2}."]
    return mk(enun, resp, "t5_ec_exp", dist, ["x = 0", "x = 1", "x = −1", "x = 2"], pasos,
              "Solo se igualan exponentes cuando las bases son iguales; si no, se reescriben las bases o se toman logaritmos. Tras un cambio de variable hay que deshacerlo.")


@generador("t5_ec_logaritmica")
def gen_ec_logaritmica(rng, d):
    lg = lambda b: "log" if b == 10 else f"log{sub(b)}"
    if d == 1:
        b = rng.choice([2, 3, 10, 5])
        k = rng.randint(1, 3 if b != 10 else 2)
        a = rng.randint(1, 5)
        c = rng.randint(-9, 9)
        v = b ** k - c
        if v % a:
            a = 1
        x = F(v, a)
        enun = f"Resuelve: {lg(b)}({P({1: a, 0: c})}) = {k}"
        resp = f"x = {N(x)}"
        dist = [(f"x = {N(F(k - c, a))}", None), (f"x = {N(F(b * k - c, a))}", None), (f"x = {N(F(k * k - c, a) if a else 0)}", None)]
        pasos = [f"Por definición de logaritmo: {P({1: a, 0: c})} = {b}{sp(k)} = {b ** k}.", f"x = {N(x)}, y el argumento es positivo. ✓"]
    else:
        for _ in range(200):
            b = rng.choice([2, 3, 10]) if d == 3 else rng.choice([2, 10])
            k = rng.randint(1, 4 if b == 2 else (2 if b == 3 else 2))
            Nn = b ** k
            divs = [i for i in range(1, Nn + 1) if Nn % i == 0]
            r1 = rng.choice(divs)
            r2 = -(Nn // r1)
            a = r1 + r2  # x(x − a) = N con raíces r1, r2
            if a != 0 and r1 - a > 0:
                break
        enun = f"Resuelve: {lg(b)} x + {lg(b)}({P({1: 1, 0: -a})}) = {k}"
        resp = f"x = {N(r1)}"
        dist = [(sols([r1, r2]), "no_descarta"), (f"x = {N(F(Nn + a, 2))}", "log_suma"), (f"x = {N(r2)}", None)]
        pasos = [f"log A + log B = log(A·B): {lg(b)}[x({P({1: 1, 0: -a})})] = {k} → x({P({1: 1, 0: -a})}) = {Nn}.",
                 f"x² {'−' if a > 0 else '+'} {abs(a)}x − {Nn} = 0 → x = {N(r1)} o x = {N(r2)}.",
                 f"x = {N(r2)} da argumentos negativos y se descarta. Solución: x = {N(r1)}."]
    return mk(enun, resp, "t5_ec_log", dist, ["x = 1", "x = 10", "Sin solución real"], pasos,
              "El logaritmo solo existe para argumentos positivos: toda solución se comprueba. log(A + B) no es log A + log B.")


# ================================================================ ALG.EXPR

def _expr_simple(rng, v, maxv=20):
    """Expresión a ± b con valor v (naturales hasta maxv)."""
    for _ in range(100):
        if rng.random() < 0.5:
            a = rng.randint(1, v - 1)
            return f"{a} + {v - a}", a, v - a, "+"
        a = rng.randint(v + 1, maxv)
        if a - v >= 0:
            return f"{a} − {a - v}", a, a - v, "−"


@generador("t5_igualdad")
def gen_igualdad(rng, d):
    for _ in range(200):
        v = rng.randint(4, 18 if d > 1 else 12)
        e1, a1, b1, o1 = _expr_simple(rng, v)
        e2, a2, b2, o2 = _expr_simple(rng, v)
        if e1 == e2 or (d == 1 and rng.random() < 0.5):
            e2 = str(v)
        if e1 != e2:
            break
    verdad = f"{e1} = {e2}"
    # falsas
    w = v + rng.choice([1, 2, -1])
    f1 = f"{e1} = {w} + {rng.randint(1, 4)}" if o1 == "+" else f"{e1} = {v} + {rng.randint(1, 4)}"  # igual como 'da'
    f2 = None
    x = rng.randint(1, 9)
    if a1 + x <= 20:
        f2 = f"{e1} = {v + x} − {x + rng.randint(1, 3)}"  # mira solo el primer número del otro lado
    p, q = rng.randint(2, 9), rng.randint(1, 8)
    while p == q:
        q = rng.randint(1, 8)
    f3 = f"{max(p, q)} − {min(p, q)} = {min(p, q)} − {max(p, q)}" if rng.random() < 0.3 else f"{p} + {q} = {p} − {q}" if p > q else f"{q} + {p} = {q} − {p}"
    f4 = f"{e1} ≠ {e2}"
    return mk("¿Cuál de estas igualdades es verdadera?", verdad, "t5_igualdad",
              [(f1, "igual_da"), (f2, "un_lado"), (f3, "parecido"), (f4, None)], [f"{e1} = {v + 1}"],
              [f"Calculo cada lado: {e1} vale {v} y {e2} vale {v}.", "Los dos lados valen lo mismo: la igualdad es verdadera."],
              "El = significa 'vale lo mismo que' (una balanza equilibrada), no 'el resultado es'. Hay que calcular los dos lados.",
              expresion=verdad)


def _expr2(rng, maxv, d):
    ops = ["+", "−", "×"]
    o = rng.choice(ops)
    if o == "×":
        a, b = rng.randint(2, 12 if d < 3 else 30), rng.randint(2, 12)
        return f"{a} × {b}", a * b, a
    a = rng.randint(10, maxv)
    b = rng.randint(1, a if o == "−" else maxv - a if maxv - a > 1 else 5)
    return (f"{a} + {b}", a + b, a) if o == "+" else (f"{a} − {b}", a - b, a)


@generador("t5_comparar_expr")
def gen_comparar_expr(rng, d):
    maxv = {1: 100, 2: 500, 3: 1000}[d]
    for _ in range(300):
        e1, v1, p1 = _expr2(rng, maxv, d)
        e2, v2, p2 = _expr2(rng, maxv, d)
        if rng.random() < 0.35:
            c = rng.randint(10, maxv // 2)
            a = c + rng.randint(2, 9)
            b = rng.randint(a - c + 1, a - c + 15)
            ee = rng.randint(max(1, c - a + b - 5), c - a + b + 5) if c - a + b + 5 > 1 else 1
            if a - b < c + ee and a - b >= 0:
                e1, v1, p1, e2, v2, p2 = f"{a} − {b}", a - b, a, f"{c} + {ee}", c + ee, c
                break
        if rng.random() < 0.2:
            e2, v2, p2 = str(v1 + rng.choice([-1, 0, 1])), v1 + 0, None
            v2 = int(e2)
        if e1 != e2 and abs(v1 - v2) <= max(10, v1 // 5):
            break
    s = "<" if v1 < v2 else (">" if v1 > v2 else "=")
    alt = {"<": ">", ">": "<", "=": "<"}
    dist = [(alt[s], "signo_al_reves")]
    if p2 is not None:
        sp_ = "<" if p1 < p2 else (">" if p1 > p2 else "=")
        if sp_ != s:
            dist.insert(0, (sp_, "primer_numero"))
    return mk(f"¿Qué signo va en el hueco? {e1} ☐ {e2}", s, "t5_comparar_expr", dist, ["=", "<", ">", "No se pueden comparar"],
              [f"Calculo (o razono): {e1} = {v1} y {e2} = {v2}.", f"{v1} {s} {v2}, así que va {s}."],
              "El pico del signo < o > apunta al menor. A veces se puede decidir sin calcular (25 + 38 < 25 + 40).",
              valores=[v1, v2])


TRAD = [
    ("El doble de un número más {n}", "2x + {n}", [("2(x + {n})", "orden"), ("x² + {n}", "doble_cuadrado"), ("2 + x + {n}", None)]),
    ("El doble de la suma de un número y {n}", "2(x + {n})", [("2x + {n}", "orden"), ("(x + {n})²", "doble_cuadrado"), ("x + 2·{n}", None)]),
    ("El cuadrado de un número menos {n}", "x² − {n}", [("2x − {n}", "doble_cuadrado"), ("{n} − x²", "menos_que"), ("(x − {n})²", "orden")]),
    ("{n} menos que el triple de un número", "3x − {n}", [("{n} − 3x", "menos_que"), ("3(x − {n})", "orden"), ("x³ − {n}", None)]),
    ("La mitad del siguiente de un número", "(x + 1)/2", [("x/2 + 1", "orden"), ("(x − 1)/2", None), ("2(x + 1)", None)]),
    ("El siguiente de la mitad de un número", "x/2 + 1", [("(x + 1)/2", "orden"), ("x/2 − 1", None), ("2x + 1", None)]),
    ("{n} más que el cuadrado de un número", "x² + {n}", [("2x + {n}", "doble_cuadrado"), ("(x + {n})²", "orden"), ("{n}x²", None)]),
    ("La mitad de un número menos {n}", "x/2 − {n}", [("(x − {n})/2", "orden"), ("{n} − x/2", "menos_que"), ("2x − {n}", None)]),
    ("{n} menos que un número", "x − {n}", [("{n} − x", "menos_que"), ("x + {n}", None), ("{n}x", None)]),
    ("La edad de Ana dentro de {n} años, si ahora tiene x años", "x + {n}", [("x − {n}", None), ("{n}x", None), ("{n} − x", "menos_que")]),
    ("La edad de Ana hace {n} años, si ahora tiene x años", "x − {n}", [("{n} − x", "menos_que"), ("x + {n}", None), ("x/{n}", None)]),
    ("La tercera parte de un número más {n}", "x/3 + {n}", [("(x + {n})/3", "orden"), ("3x + {n}", None), ("x/{n} + 3", None)]),
    ("El triple del cuadrado de un número", "3x²", [("(3x)²", "orden"), ("6x", "doble_cuadrado"), ("x³", None)]),
    ("El cuadrado del triple de un número", "(3x)²", [("3x²", "orden"), ("6x", "doble_cuadrado"), ("x⁶", None)]),
    ("El producto de un número por su siguiente", "x(x + 1)", [("x·x + 1", "orden"), ("x + (x + 1)", None), ("2x + 1", None)]),
    ("La suma de un número y su anterior", "x + (x − 1)", [("x(x − 1)", None), ("x − 1", None), ("2x + 1", None)]),
    ("{n} veces un número, menos {m}", "{n}x − {m}", [("{n}(x − {m})", "orden"), ("{m} − {n}x", "menos_que"), ("x{n} − {m}", None)]),
    ("El cuadrado de la suma de un número y {n}", "(x + {n})²", [("x² + {n}", "orden"), ("2(x + {n})", "doble_cuadrado"), ("x² + {n}²", None)]),
]


@generador("t5_traducir")
def gen_traducir(rng, d):
    idx = {1: [0, 2, 6, 8, 9, 10, 12, 16], 2: [1, 3, 7, 11, 13, 14, 15], 3: [4, 5, 17, 3, 13, 14]}[d]
    frase, resp, dist = TRAD[rng.choice(idx)]
    n, m = rng.randint(2, 12), rng.randint(1, 9)
    f = lambda s: s.format(n=n, m=m)
    return mk(f"¿Qué expresión algebraica corresponde a «{f(frase)}»? (x es el número)", f(resp), "t5_traducir",
              [(f(v), k) for v, k in dist], ["x + " + str(n + 1), f"{n + 1}x"],
              ["Leo la frase de fuera hacia dentro para saber qué operación se hace la última.", f"Queda {f(resp)}."],
              "'El doble de la suma' ≠ 'la suma del doble': el orden de las operaciones está en el orden de las palabras. Doble es ×2; cuadrado es elevar a 2.")


VARS = ["x", "y"]


def _val_terms(ts, vals, modo=None):
    tot = 0
    for c, lits in ts:
        t = F(c)
        for v, e in lits.items():
            xv = vals[v]
            if modo == "potencia_x2" and e > 1:
                t *= e * xv
            elif modo == "signo_cuadrado" and e % 2 == 0 and xv < 0:
                t *= -(abs(xv) ** e)
            else:
                t *= F(xv) ** e
        tot += t
    return tot


@generador("t5_valor_numerico")
def gen_valor_numerico(rng, d):
    for _ in range(200):
        nv = 1 if d == 1 else rng.choice([1, 2])
        vs = VARS[:nv]
        ts = [(rng.randint(2, 9), {"x": 1})] if d == 1 and rng.random() < 0.6 else []
        for _ in range(rng.randint(2, 3) - len(ts)):
            c = nz(rng, -5, 6)
            lits = {v: rng.randint(0, 2) for v in vs}
            if not any(lits.values()) and ts:
                lits = {vs[0]: 1}
            if any(l == lits for _, l in ts):
                continue
            ts.append((c, lits))
        if len(ts) < 2 or d == 3 and not any(e == 2 for _, l in ts for e in l.values()):
            continue
        vals = {v: (rng.randint(-4, 5) if d > 1 else rng.randint(1, 6)) for v in vs}
        if d > 1 and not any(v < 0 for v in vals.values()):
            continue
        break
    expr = poly_multi(ts)
    r = _val_terms(ts, vals)
    dist = [(N(_val_terms(ts, vals, "potencia_x2")), "potencia_x2"), (N(_val_terms(ts, vals, "signo_cuadrado")), "signo_cuadrado")]
    c0, l0 = ts[0]
    if len([e for e in l0.values() if e]) == 1 and list(v for v, e in l0.items() if e)[0] and all(0 < vals[v] < 10 for v in l0 if l0[v] == 1) and sum(l0.values()) == 1 and c0 > 0:
        v0 = [v for v, e in l0.items() if e][0]
        pegado = int(f"{c0}{vals[v0]}")
        dist.append((N(r - c0 * vals[v0] + pegado), "pega_numero"))
    asig = ", ".join(f"{v} = {N(vals[v])}" for v in vs)
    return mk(f"Calcula el valor numérico de {expr} para {asig}", N(r), "t5_valor_numerico", dist, [N(r + 1), N(r - 1), N(-r)],
              [f"Sustituyo cada letra por su valor entre paréntesis ({asig}).", "Calculo primero las potencias, después los productos y por último sumas y restas.", f"Resultado: {N(r)}."],
              "Con negativos, el paréntesis es imprescindible: (−2)² = 4 pero −2² = −4. 3x significa 3 · x.", valores=vals)


@generador("t5_monomio")
def gen_monomio(rng, d):
    letras = rng.sample(["x", "y", "z", "a", "b"], rng.randint(1, 2) if d == 1 else rng.randint(2, 3))
    lits = {l: rng.randint(1, 4) for l in letras}
    c = rng.choice([1, -1, 2, -3, 5, -7, 4, F(1, 2), F(-2, 3), 6])
    m = mono(c, lits)
    tarea = rng.choice(["grado", "coef"]) if d < 3 else rng.choice(["semejante", "grado", "parte"])
    g = sum(lits.values())
    if tarea == "grado":
        return mk(f"¿Cuál es el grado del monomio {m}?", str(g), "t5_monomio", [(str(max(lits.values())), "grado_mayor"), (str(len(lits)), None), (N(abs(c)) if N(abs(c)) != str(g) else str(g + 1), None)],
                  [str(g + 1), str(g - 1)], [f"El grado es la suma de los exponentes de las letras: {' + '.join(str(e) for e in lits.values())} = {g}."],
                  "El grado de un monomio suma los exponentes de TODAS sus letras.")
    if tarea == "coef":
        return mk(f"¿Cuál es el coeficiente del monomio {m}?", N(c), "t5_monomio", [("0" if abs(c) == 1 else N(-c), "coef_invisible"), ("No tiene coeficiente" if abs(c) == 1 else N(g), "coef_invisible" if abs(c) == 1 else None),
                                                                           (mono(1, lits), None)], [N(c + 1), N(g)],
                  [f"El coeficiente es el número que multiplica a las letras, con su signo" + (" (si no se ve, es 1 o −1)." if abs(c) == 1 else "."), f"Es {N(c)}."],
                  "Cuando no se escribe número, el coeficiente es 1 (o −1 si hay un signo menos).")
    if tarea == "parte":
        return mk(f"¿Cuál es la parte literal del monomio {m}?", mono(1, lits), "t5_monomio", [(m, None), (N(c), None), (mono(1, {k: 1 for k in lits}), None)],
                  [mono(1, {k: e + 1 for k, e in lits.items()})], [f"La parte literal son las letras con sus exponentes: {mono(1, lits)}."],
                  "Un monomio = coeficiente · parte literal.")
    # semejante
    c2 = rng.choice([3, -2, 4, -5, 7, F(1, 3)])
    ok = mono(c2, lits)
    sw = dict(lits)
    ks = list(lits)
    if len(set(lits.values())) > 1:
        sw[ks[0]], sw[ks[1]] = lits[ks[1]], lits[ks[0]]
    else:
        sw[ks[0]] += 1
    mas = dict(lits)
    mas[ks[-1]] += 1
    return mk(f"¿Cuál de estos monomios es semejante a {m}?", ok, "t5_monomio", [(mono(c2, sw), "semejante_letras"), (mono(c, mas), None), (mono(c2, {**lits, "t": 1}), None)],
              [mono(c2, {k: 1 for k in lits})], ["Dos monomios son semejantes si tienen la misma parte literal (mismas letras con los mismos exponentes).", f"{ok} lo es."],
              "x²y y xy² no son semejantes: los exponentes de cada letra deben coincidir.")


@generador("t5_reducir")
def gen_reducir(rng, d):
    for _ in range(200):
        g = 1 if d == 1 else 2
        tgt = {e: rng.randint(-7, 7) for e in range(g + 1)}
        if g == 2 and tgt[2] == 0:
            tgt[2] = 2
        if tgt[1] == 0:
            continue
        # repartir en términos
        ts = []
        for e, c in tgt.items():
            k = rng.randint(1, 2) if d > 1 or e == 1 else rng.randint(1, 2)
            parts = [nz(rng, -8, 8) for _ in range(k - 1)]
            parts.append(c - sum(parts))
            ts += [(p, e) for p in parts if p]
        if len(ts) < 3 or len(ts) > 6:
            continue
        rng.shuffle(ts)
        if ts[0][1] == 0 and rng.random() < 0.5:
            continue
        break
    expr = terms([(c, ("x" + sp(e)) if e else "") for c, e in ts])
    resp = P(tgt)
    sx = sum(c for c, e in ts if e == 1)
    dist = [(P({2: tgt.get(2, 0), 1: tgt[1] + tgt[0]}) if tgt[0] else P({2: tgt.get(2, 0) + tgt[1], 0: tgt[0]}), "no_semejantes")]
    if g == 2:
        dist.append((P({4: tgt[2], 1: tgt[1], 0: tgt[0]}), "suma_exponentes"))
    xs = [c for c, e in ts if e == 1]
    mal = sum(abs(c) for c in xs) if len(xs) > 1 else -sx
    dist.append((P({**tgt, 1: mal}) if mal != tgt[1] else P({**tgt, 1: -tgt[1]}), "pierde_signo"))
    return mk(f"Reduce: {expr}", resp, "t5_reducir", dist, [P({**tgt, 0: tgt[0] + 1}), P({**tgt, 1: tgt[1] + 1})],
              ["Agrupo los términos semejantes (misma letra y mismo exponente), cada uno con su signo.", f"Sumo sus coeficientes: {resp}."],
              "Solo se suman monomios semejantes y, al sumarlos, el exponente no cambia: 2x² + 3x² = 5x².")


@generador("t5_parentesis")
def gen_parentesis(rng, d):
    for _ in range(200):
        k1 = rng.randint(2, 6) * (1 if d < 3 else rng.choice([1, -1]))
        p1 = {1: rng.choice([1, 2, 3]), 0: nz(rng, -9, 9)}
        k2 = 0 if d == 1 else rng.choice([-1, -2, -3, -4, 2, 3, -5])
        p2 = {1: rng.choice([1, 2, -1]), 0: nz(rng, -9, 9)}
        extra = rng.randint(-6, 6) if d == 1 else 0
        res = padd(padd(pscale(p1, k1), pscale(p2, k2)), {0: extra})
        if res.get(1, 0) == 0:
            continue
        break
    t1 = f"{N(k1)}({P(p1)})" if k1 not in (1, -1) else f"({P(p1)})"
    expr = t1
    if k2:
        expr += (" − " if k2 < 0 else " + ") + (f"{abs(k2)}({P(p2)})" if abs(k2) != 1 else f"({P(p2)})")
    if extra:
        expr += (" + " if extra > 0 else " − ") + str(abs(extra))
    resp = P(res)
    e1 = padd(padd({1: k1 * p1[1], 0: p1[0]}, pscale(p2, k2)), {0: extra})
    dist = [(P(e1), "solo_primero")]
    if k2:
        e2 = padd(pscale(p1, k1), {1: k2 * p2[1], 0: -k2 * p2[0] if k2 == -1 else p2[0] * (-1 if k2 < 0 else 1)})
        dist.append((P(e2), "menos_solo_primero"))
        e3 = padd(pscale(p1, k1), {1: k2 * p2[1], 0: -k2 * p2[0]})
        dist.append((P(e3), "signo_segundo"))
    return mk(f"Quita paréntesis y reduce: {expr}", resp, "t5_parentesis", dist, [P({**res, 0: res.get(0, 0) + 2}), P({**res, 1: res[1] - 1})],
              [f"Multiplico el número de fuera por CADA término de dentro, con los signos: {terms([(k1 * c, 'x' if e else '') for e, c in sorted(p1.items(), reverse=True)])}" +
               (f" y {terms([(k2 * c, 'x' if e else '') for e, c in sorted(p2.items(), reverse=True)])}" if k2 else "") + ".",
               f"Reduzco términos semejantes: {resp}."],
              "Propiedad distributiva: a(b + c) = ab + ac. Un menos delante del paréntesis cambia el signo de todos los términos de dentro.")


def _mono_q(c, lits):
    """Cociente de monomios canónico: letras con exponente negativo al denominador."""
    c = F(c)
    num = {k: e for k, e in lits.items() if e > 0}
    den = {k: -e for k, e in lits.items() if e < 0}
    if not den and c.denominator == 1:
        return mono(c, num)
    top = mono(F(c.numerator), num) if num or abs(c.numerator) != 1 else ("−1" if c < 0 else "1")
    if not num and abs(c.numerator) == 1:
        top = "−1" if c < 0 else "1"
    bot_lit = "".join(k + sp(e) for k, e in sorted(den.items()))
    bot = (str(c.denominator) if c.denominator != 1 else "") + bot_lit
    nb = (1 if c.denominator != 1 else 0) + len(den)
    if nb > 1 or (c.denominator != 1 and den):
        bot = f"({bot})"
    return f"{top}/{bot}"


@generador("t5_monomios_op")
def gen_monomios_op(rng, d):
    letras = ["x", "y"] if d < 3 else ["x", "y", "z"][:rng.randint(2, 3)]
    op = rng.choice(["·", "·", ":"]) if d == 1 else rng.choice(["·", ":"])
    a, b = nz(rng, -6, 7), nz(rng, -6, 7)
    l1 = {l: rng.randint(1, 4) for l in letras}
    l2 = {l: rng.randint(1, 4) for l in letras}
    if d == 1:
        l1 = {"x": rng.randint(1, 4)}
        l2 = {"x": rng.randint(1, 4)}
    if op == "·":
        res = mono(a * b, {k: l1.get(k, 0) + l2.get(k, 0) for k in set(l1) | set(l2)})
        dist = [(mono(a * b, {k: l1.get(k, 0) * l2.get(k, 0) or l1.get(k, 0) + l2.get(k, 0) for k in set(l1) | set(l2)}), "multiplica_exponentes"),
                (mono(a + b, {k: l1.get(k, 0) + l2.get(k, 0) for k in set(l1) | set(l2)}), "suma_coeficientes"),
                (mono(a * b, {k: l1.get(k, 0) + l2.get(k, 0) + 1 for k in set(l1) | set(l2)}), None)]
    else:
        if d == 1:
            l1["x"] = l2["x"] + rng.randint(0, 3)
            a = a * b
        q = {k: l1.get(k, 0) - l2.get(k, 0) for k in set(l1) | set(l2)}
        res = _mono_q(F(a, b), q)
        dist = [(_mono_q(F(a, b), {k: abs(e) for k, e in q.items()}), "resta_al_reves"), (_mono_q(F(a, b), {k: l1.get(k, 0) + l2.get(k, 0) for k in q}), None),
                (_mono_q(F(a - b) if a != b else F(a * b), q), None)]
    enun = f"Calcula: ({mono(a, l1)}) {op} ({mono(b, l2)})"
    return mk(enun, res, "t5_monomios_op", dist, [_mono_q(-F(a, b) if op == ":" else -a * b, {k: 1 for k in letras}), _mono_q(F(a, b) * 2 if op == ":" else 2 * a * b, {k: 2 for k in letras})],
              ["Multiplico (o divido) los coeficientes con sus signos.",
               "Para cada letra: en el producto se SUMAN los exponentes; en el cociente se RESTAN (el del dividendo menos el del divisor); si queda negativo, la letra va al denominador.",
               f"Resultado: {res}."],
              "Propiedades de las potencias de igual base: xᵃ·xᵇ = xᵃ⁺ᵇ y xᵃ : xᵇ = xᵃ⁻ᵇ. El cociente de monomios no siempre es un monomio.")


# ================================================================ ALG.PATRON

FIG = ["🔴", "🔵", "🟢", "🟡", "⭐", "🔺", "⬛", "💜", "🌙", "❤️"]
FIG_NOM = {"🔴": "rojo", "🔵": "azul", "🟢": "verde", "🟡": "amarillo", "⭐": "estrella", "🔺": "triángulo", "⬛": "cuadrado", "💜": "morado",
           "🌙": "luna", "❤️": "corazón"}


def _fig(x):
    return f"{x} ({FIG_NOM[x]})" if x in FIG_NOM else x


@generador("t5_patron_sig")
def gen_patron_sig(rng, d):
    nucleo_t = {1: ["AB"], 2: ["AAB", "ABB"], 3: ["ABC", "AAB", "ABB"]}[d]
    t = rng.choice(nucleo_t)
    sim = rng.sample(FIG, 3)
    mapa = dict(zip("ABC", sim))
    nuc = [mapa[c] for c in t]
    reps = rng.randint(2, 3)
    extra = rng.randint(0, len(nuc) - 1)
    serie = nuc * reps + nuc[:extra]
    r = nuc[extra % len(nuc)]
    otros = [x for x in set(nuc) if x != r]
    dist = [(_fig(serie[-1]) if serie[-1] != r else None, "repite_ultimo")]
    if t in ("AAB", "ABB"):
        # núcleo mal delimitado: lo toma como AB alternando
        alt = serie[-2] if len(serie) > 1 else None
        dist.append((_fig(alt) if alt and alt != r else None, "nucleo_mal"))
    if t == "ABC":
        dist.append((_fig(serie[-2]) if serie[-2] != r else None, "alterna"))
    dist += [(_fig(o), None) for o in otros]
    fuera = [x for x in FIG if x not in nuc]
    return mk(f"¿Qué figura va después? {' '.join(serie)} … ({', '.join(FIG_NOM[x] for x in serie)}…)", _fig(r), "t5_patron", dist, [_fig(x) for x in rng.sample(fuera, 3)],
              [f"Busco el trozo que se repite: {' '.join(nuc)}.", f"La serie va por la posición {extra + 1} del trozo, así que sigue {_fig(r)}."],
              "En un patrón de repetición hay que encontrar el núcleo completo (lo que se repite), no fijarse solo en el último elemento.",
              nucleo=t, serie=serie)


@generador("t5_patron_hueco")
def gen_patron_hueco(rng, d):
    L = {1: 2, 2: 3, 3: 4}[d]
    letras = rng.random() < 0.4
    for _ in range(50):
        if letras:
            sim = rng.sample(list("ABCDEFGHKMPRST"), L)
        else:
            sim = rng.sample(FIG, L)
        if d > 1 and rng.random() < 0.4:
            sim[rng.randrange(1, L)] = sim[0]
        nuc = sim
        reps = 3
        serie = nuc * reps
        i = rng.randrange(len(serie))
        r = serie[i]
        if len(set(nuc)) > 1:
            break
    show = [("?" if j == i else x) for j, x in enumerate(serie)]
    fmtx = (lambda x: x) if letras else _fig
    dist = []
    for vec in (i - 1, i + 1):
        if 0 <= vec < len(serie) and serie[vec] != r:
            dist.append((fmtx(serie[vec]), "copia_vecino"))
            break
    dist.append((fmtx(serie[(i + 1) % len(serie)]) if serie[(i + 1) % len(serie)] != r else None, "desplaza"))
    dist.append((fmtx(serie[(i - 1) % len(serie)]) if serie[(i - 1) % len(serie)] != r else None, "desplaza"))
    pool = [x for x in (list("ABCDEFGHKMPRST") if letras else FIG) if x not in nuc]
    nombres = "" if letras else " (" + ", ".join("?" if x == "?" else FIG_NOM[x] for x in show) + ")"
    return mk(f"¿Qué falta en el lugar de «?»? {' '.join(show)}{nombres}", fmtx(r), "t5_patron", dist, [fmtx(x) for x in rng.sample(pool, 3)],
              [f"El trozo que se repite es {' '.join(nuc)} ({L} elementos).", f"El hueco está en la posición {i + 1}; dentro del trozo es la {i % L + 1}.ª: {fmtx(r)}."],
              "Se localiza el núcleo y se cuenta la posición del hueco dentro de él; mirar solo al vecino lleva a error.", serie=serie, hueco=i)


def _serie_txt(xs, hueco):
    return ", ".join("?" if j == hueco else fmt(x) for j, x in enumerate(xs))


@generador("t5_serie_aritmetica")
def gen_serie_aritmetica(rng, d, saltos=(1, 2, 5, 10), maxv=99, dec_cent=False):
    for _ in range(300):
        s = rng.choice(saltos)
        if dec_cent and rng.random() < 0.35:
            s = rng.choice([10, 20, 30, 50, 100, 200, 300]) if d > 1 else rng.choice([10, 20, 100])
        asc = rng.random() < 0.6 if d < 3 else rng.random() < 0.5
        n = 5
        a0 = rng.randint(0, maxv)
        xs = [a0 + (i * s if asc else -i * s) for i in range(n)]
        if min(xs) < 0 or max(xs) > maxv:
            continue
        hueco = n - 1 if d == 1 else rng.randrange(1, n)
        if d == 3 and not any((x // 10) != (xs[j - 1] // 10) for j, x in enumerate(xs) if j) and maxv < 200:
            continue
        break
    r = xs[hueco]
    prev = xs[hueco - 1]
    step = s if asc else -s
    dist = [(fmt(prev + (1 if asc else -1)) if s != 1 else None, "salto_uno"), (fmt(prev - step), "sentido"), ]
    if maxv < 200:
        dec = (r // 10) * 10 + (prev % 10) if False else (prev // 10) * 10 + r % 10
        dist.append((fmt(dec) if dec != r and dec >= 0 else None, "cambio_decena"))
    else:
        uu = prev - (s % 10) if not asc else prev + (s % 10)
        dist.append((fmt((prev // 10) * 10 + (uu % 10)) if (prev // 10) * 10 + (uu % 10) != r else None, "solo_unidades"))
        dist.append((fmt(prev + (xs[2] - xs[0])) if hueco else None, "salto_mal"))
    return mk(f"¿Qué número falta? {_serie_txt(xs, hueco)}", fmt(r), "t5_serie", dist, [fmt(r + 1), fmt(abs(r - 1)), fmt(r + 10), fmt(abs(r - 10))],
              [f"Miro cuánto cambia de un número al siguiente: {'sube' if asc else 'baja'} {s} cada vez.", f"El número que falta es {fmt(r)}."],
              "Hay que deducir el salto comparando varios términos seguidos y comprobar si la serie sube o baja.", serie=xs, hueco=hueco)


@generador("t5_serie_no_aritmetica")
def gen_serie_no_aritmetica(rng, d):
    for _ in range(300):
        tipo = rng.choice(["mult", "alterna"]) if d > 1 else "mult"
        if tipo == "mult":
            k = rng.choice([2, 3, 10] if d < 3 else [2, 3, 5, 10])
            div = d > 1 and rng.random() < 0.3
            a0 = rng.randint(1, 9)
            xs = [a0 * k ** i for i in range(5)]
            if div:
                xs = xs[::-1]
            regla = f"{'dividir entre' if div else 'multiplicar por'} {k}"
        else:
            p, m = rng.randint(2, 9), rng.randint(1, 6)
            if p == m:
                continue
            a0 = rng.randint(1, 50)
            xs = [a0]
            for i in range(6):
                xs.append(xs[-1] + (p if i % 2 == 0 else -m))
            regla = f"+{p}, −{m} alternando"
        if max(xs) <= 10000:
            break
    hueco = len(xs) - 1 if d < 3 else rng.randrange(2, len(xs))
    r = xs[hueco]
    last_jump = xs[hueco - 1] - xs[hueco - 2]
    dist = [(fmt(xs[hueco - 1] + last_jump), "busca_suma" if tipo == "mult" else "ignora_alternancia")]
    if tipo == "alterna":
        dist.append((fmt(xs[hueco - 1] + (xs[1] - xs[0])), None))
    else:
        dist.append((fmt(xs[hueco - 1] * (k + 1)) if not div else fmt(xs[hueco - 1] - (xs[hueco - 2] - xs[hueco - 1])), None))
    return mk(f"¿Qué número falta? {_serie_txt(xs, hueco)}", fmt(r), "t5_serie", dist, [fmt(r + 1), fmt(r - 1), fmt(r * 2), fmt(r + 10)],
              [f"No sube siempre lo mismo; pruebo otras reglas. La regla es: {regla}.", f"El número que falta es {fmt(r)}."],
              "Si la diferencia entre términos no es constante, se prueba si se multiplica (cociente constante) o si alternan dos saltos.", serie=xs, hueco=hueco)


@generador("t5_termino_lejano")
def gen_termino_lejano(rng, d):
    a1 = rng.randint(1, 9)
    s = rng.randint(2, 9)
    n = rng.randint(10, 20) if d == 1 else (rng.randint(20, 50) if d == 2 else rng.randint(50, 100))
    xs = [a1 + i * s for i in range(4)]
    r = a1 + (n - 1) * s
    k = 5
    ak = a1 + (k - 1) * s
    dist = [(fmt(n * s), "multiplica_posicion"), (fmt(ak * n // k) if n % k == 0 else fmt(ak * (n // k)), "proporcional"), (fmt(a1 + n * s), "un_salto_mas")]
    fig = rng.random() < 0.3
    enun = (f"Una serie de figuras usa {', '.join(map(str, xs))}… palillos (figura 1, 2, 3, 4…). ¿Cuántos palillos tendrá la figura {n}?" if fig else
            f"La serie {', '.join(map(str, xs))}… sigue siempre igual. ¿Qué número ocupa el lugar {n}?")
    return mk(enun, fmt(r), "t5_termino_lejano", dist, [fmt(r + 1), fmt(r - s + 1), fmt(r + 2)],
              [f"Hago una tabla posición → valor: 1 → {a1}, 2 → {a1 + s}, 3 → {a1 + 2 * s}… Cada vez {s} más.",
               f"Del lugar 1 al {n} hay {n - 1} saltos de {s}: {a1} + {n - 1} × {s} = {fmt(r)}."],
              "Para un término lejano no hay que escribirlos todos: se cuentan los saltos (uno menos que la posición) y se suman al primero.", a1=a1, s=s, n=n)


def _regla_n(s, c):
    return "·".join([str(s), "n"]) + ("" if c == 0 else (f" + {c}" if c > 0 else f" − {abs(c)}"))


@generador("t5_regla_patron")
def gen_regla_patron(rng, d):
    for _ in range(100):
        s = rng.randint(2, 7)
        a1 = rng.randint(s - 2 if s > 2 else 1, 12)
        c = a1 - s
        if c != 0 or d > 1:
            break
    xs = [a1 + i * s for i in range(3 if d < 3 else 4)]
    resp = _regla_n(s, c)
    dist = [("n + " + str(s), "salto_constante"), (_regla_n(a1, s), "primero_coef"), (_regla_n(s, a1), None)]
    if d == 3:
        n = rng.randint(15, 40)
        r = s * n + c
        fig = rng.random() < 0.5
        enun = (f"Las figuras de una serie tienen {', '.join(map(str, xs))}… cuadrados. Con la regla de la serie, ¿cuántos cuadrados tendrá la figura {n}?" if fig else
                f"En la tabla posición → valor: " + ", ".join(f"{i + 1} → {x}" for i, x in enumerate(xs)) + f". ¿Qué valor corresponde a la posición {n}?")
        return mk(enun, fmt(r), "t5_regla_patron", [(fmt(n + s), "salto_constante"), (fmt(a1 * n + s), "primero_coef"), (fmt(s * n), None)], [fmt(r + s), fmt(r - 1), fmt(r + 1)],
                  [f"Cada vez aumenta {s}: la regla es {resp}.", f"Para n = {n}: {s}·{n} {'+' if c >= 0 else '−'} {abs(c)} = {fmt(r)}."],
                  "La regla de un patrón lineal es (salto)·n + (primer término − salto).", s=s, a1=a1)
    enun = (f"Las figuras de una serie tienen {', '.join(map(str, xs))}… cuadrados (figura n = 1, 2, 3…). ¿Qué expresión da los cuadrados de la figura n?" if d == 1 else
            "En la tabla posición → valor: " + ", ".join(f"{i + 1} → {x}" for i, x in enumerate(xs)) + ". ¿Qué regla relaciona la posición n con el valor?")
    return mk(enun, resp, "t5_regla_patron", dist, [_regla_n(s + 1, c - 1), _regla_n(s, c + 1)],
              [f"El valor aumenta {s} cada vez: la regla empieza por {s}·n.", f"Para n = 1, {s}·1 = {s} y el valor es {a1}: hay que {'sumar' if c > 0 else 'restar'} {abs(c)}. Regla: {resp}." if c else f"Para n = 1 da {s}: la regla es {resp}."],
              "El salto multiplica a n; el número suelto se ajusta con el primer término. Se comprueba con dos posiciones.", s=s, a1=a1)


# ================================================================ ALG.INEC

def _ineq_sym(sim):
    return {"<": "<", ">": ">", "≤": "≤", "≥": "≥"}[sim]


@generador("t5_desigualdad_natural")
def gen_desigualdad_natural(rng, d):
    for _ in range(300):
        tipo = rng.choice(["suma", "resta", "mult"]) if d > 1 else rng.choice(["suma", "mult"])
        sim = rng.choice(["<", ">"])
        k = rng.randint(2, 6)
        if tipo == "suma":
            lhs, f = f"□ + {k}", (lambda n: n + k)
        elif tipo == "resta":
            lhs, f = f"□ − {k}", (lambda n: n - k)
        else:
            lhs, f = f"{k}·□", (lambda n: k * n)
        base = rng.randint(3, 12)
        lista = list(range(base, base + rng.randint(4, 5)))
        borde = f(rng.choice(lista[1:-1]))
        ok = [n for n in lista if (f(n) < borde if sim == "<" else f(n) > borde)]
        if 0 < len(ok) < len(lista) and any(f(n) == borde for n in lista):
            break
    def txt(xs):
        return "ninguno" if not xs else (fmt(xs[0]) if len(xs) == 1 else ", ".join(map(fmt, xs[:-1])) + " y " + fmt(xs[-1]))
    con_borde = sorted(ok + [n for n in lista if f(n) == borde])
    otro = [n for n in lista if n not in ok and f(n) != borde]
    return mk(f"¿Qué números de {{{', '.join(map(str, lista))}}} cumplen {lhs} {sim} {borde}?", txt(ok), "t5_desigualdad",
              [(txt(con_borde), "incluye_borde"), (txt(ok[:1]) if len(ok) > 1 else None, "solo_uno"), (txt(otro) if otro else txt(sorted(otro + [n for n in lista if f(n) == borde])), None)],
              [txt(lista), txt(ok[1:]) if len(ok) > 1 else txt(lista[:1])],
              [f"Pruebo cada número: " + "; ".join(f"{n} → {f(n)}" for n in lista) + ".", f"Cumplen {lhs} {sim} {borde}: {txt(ok)}."],
              "Una desigualdad puede tenerla muchos números; el borde (el que da justo el igual) no la cumple si es < o >.", lista=lista)


@generador("t5_inecuacion1")
def gen_inecuacion1(rng, d):
    for _ in range(300):
        a = nz(rng, -6, 6)
        if d == 1 and a < 0:
            a = -a
        b = rng.randint(-10, 10)
        x0 = F(rng.randint(-6, 6)) if d < 3 else F(rng.randint(-8, 8), rng.choice([1, 2, 3]))
        c = a * x0 + b
        if c.denominator != 1:
            continue
        if d == 2 and a > 0 and rng.random() < 0.7:
            continue
        break
    sim = rng.choice(["<", ">", "≤", "≥"])
    if d == 3:
        # forma con denominador: (a x + b)/m sim c/m … se presenta como (ax + b)/m sim c/m
        m = rng.choice([2, 3, 4])
        lhs = f"({P({1: a, 0: b})})/{m}"
        rhs = N(F(c, m))
    else:
        lhs, rhs = P({1: a, 0: b}), N(c)
    # solución: a x sim c − b → x sim' x0
    menor = sim in "<≤"
    if a < 0:
        menor = not menor
    cerr = sim in "≤≥"
    iv = lambda men, ce: intervalo(None, x0, cb=ce) if men else intervalo(x0, None, ca=ce)
    resp = iv(menor, cerr)
    dist = [(iv(not menor, cerr), "no_invierte" if a < 0 else None), (iv(menor, not cerr), "extremo_mal"), (iv(not menor, not cerr), None)]
    return mk(f"Resuelve la inecuación: {lhs} {sim} {rhs}", resp, "t5_inecuacion", dist, [iv(menor, cerr).replace(N(x0), N(-x0)) if x0 else iv(menor, cerr).replace("0", "1")],
              [f"Despejo como en una ecuación: {P({1: a})} {sim} {N(c - b)}.",
               f"Divido entre {N(a)}" + (" (negativo: se invierte el sentido)" if a < 0 else "") + f": x {'<' if menor and not cerr else '≤' if menor else '>' if not cerr else '≥'} {N(x0)}.",
               f"En intervalo: {resp} ({'cerrado' if cerr else 'abierto'} en {N(x0)})."],
              "Al multiplicar o dividir los dos miembros por un número negativo, el sentido de la desigualdad se invierte. ≤ y ≥ dan corchete; < y > paréntesis.",
              a=a, b=b, c=c)


@generador("t5_inecuacion2")
def gen_inecuacion2(rng, d):
    for _ in range(200):
        r1, r2 = sorted(rng.sample(range(-7, 8), 2))
        k = 1 if d < 3 else rng.choice([1, -1])
        if d == 1 and rng.random() < 0.3:
            r1 = 0
            r1, r2 = sorted([0, nz(rng, -7, 7)])
        break
    p = proots([r1, r2], k)
    sim = rng.choice(["<", ">", "≤", "≥"])
    cerr = sim in "≤≥"
    neg = sim in "<≤"  # queremos p < 0
    if k < 0:
        neg = not neg
    dentro = intervalo(r1, r2, cerr, cerr)
    fuera = union(intervalo(None, r1, cb=cerr), intervalo(r2, None, ca=cerr))
    resp = dentro if neg else fuera
    dist = [(f"x = {N(r1)}, x = {N(r2)}", "como_ecuacion"), (fuera if neg else dentro, "intervalo_equivocado")]
    if 0 in (r1, r2) and k == 1:
        other = r2 if r1 == 0 else r1
        dist.append((intervalo(other, None, ca=cerr) if other > 0 else intervalo(None, other, cb=cerr), "divide_x"))
    dist.append((intervalo(r1, r2, not cerr, not cerr) if neg else union(intervalo(None, r1, cb=not cerr), intervalo(r2, None, ca=not cerr)), None))
    if 0 in (r1, r2) and rng.random() < 0.5 and k == 1:
        other = r2 if r1 == 0 else r1
        enun = f"Resuelve la inecuación: x² {sim} {P({1: other})}"
    else:
        enun = f"Resuelve la inecuación: {P(p)} {sim} 0"
    return mk(enun, resp, "t5_inecuacion", dist, [intervalo(r1 - 1, r2 + 1, cerr, cerr)],
              [f"Busco las raíces de {P(p)} = 0: x = {N(r1)} y x = {N(r2)}.",
               f"Estudio el signo en cada trozo (o miro la parábola, {'abierta hacia arriba' if k > 0 else 'abierta hacia abajo'}): es {'negativa' if (k > 0) else 'positiva'} entre las raíces.",
               f"Solución: {resp}."],
              "Las raíces solo separan los intervalos; la solución es un conjunto de intervalos donde el polinomio tiene el signo pedido. No se divide entre x (su signo es desconocido).")


def _desig(a, b, sim):
    return f"{P({1: a, 0: b})}"


@generador("t5_sistema_inecuaciones")
def gen_sistema_inecuaciones(rng, d):
    for _ in range(300):
        x1, x2 = sorted(rng.sample(range(-8, 9), 2))
        # queremos x > x1 (o ≥) y x < x2 (o ≤)
        c1 = rng.random() < 0.5  # cerrado en x1
        c2 = not c1 if rng.random() < 0.7 else c1
        a1 = rng.randint(1, 5)
        b1 = rng.randint(-9, 9)
        a2 = rng.randint(1, 5) * (1 if d < 3 else rng.choice([1, -1]))
        b2 = rng.randint(-9, 9)
        # ineq1: a1 x + b1 (> o ≥) a1 x1 + b1
        s1 = "≥" if c1 else ">"
        # ineq2: a2 x + b2 (< o ≤) a2 x2 + b2 ; si a2 < 0 se invierte el símbolo escrito
        s2 = "≤" if c2 else "<"
        if a2 < 0:
            s2 = {"≤": "≥", "<": ">"}[s2]
        syms = s1 + s2
        if ("<" in syms) and (">" in syms):
            continue
        break
    e1 = f"{P({1: a1, 0: b1})} {s1} {N(a1 * x1 + b1)}"
    e2 = f"{P({1: a2, 0: b2})} {s2} {N(a2 * x2 + b2)}"
    resp = intervalo(x1, x2, c1, c2)
    dist = [(union(intervalo(None, x2, cb=c2), intervalo(x1, None, ca=c1)) if False else "ℝ", "une"), (intervalo(x1, x2, not c1, c2), "extremos_mal"), (intervalo(x1, x2, c1, not c2), "extremos_mal"),
            (intervalo(x1, None, ca=c1), None)]
    return mk(f"Resuelve el sistema de inecuaciones: {{{e1}; {e2}}}", resp, "t5_sistema_inecuaciones", dist, [intervalo(None, x2, cb=c2), intervalo(x1 - 1, x2 + 1, c1, c2)],
              [f"Resuelvo cada una: x {'≥' if c1 else '>'} {N(x1)} y x {'≤' if c2 else '<'} {N(x2)}" + (" (al dividir entre un negativo se invierte el sentido)" if a2 < 0 else "") + ".",
               f"La solución del sistema es lo común a las dos (la intersección): {resp}."],
              "La solución de un sistema de inecuaciones es la INTERSECCIÓN de las soluciones; cada extremo conserva si es abierto o cerrado.")


@generador("t5_inec_racional")
def gen_inec_racional(rng, d):
    a, b = rng.sample(range(-6, 7), 2)
    sim = rng.choice(["≥", "≤", ">", "<"]) if d > 1 else rng.choice(["≥", ">"])
    cerr = sim in "≥≤"
    pos = sim in "≥>"
    lo, hi = min(a, b), max(a, b)
    # (x − a)/(x − b): signo positivo fuera de [lo, hi]; ceros: a (numerador, incluible), b excluido siempre
    def ext(x, izq):
        c = cerr and x == a
        return c
    if pos:
        resp = union(intervalo(None, lo, cb=ext(lo, True)), intervalo(hi, None, ca=ext(hi, False)))
        mal2 = union(intervalo(None, lo, cb=cerr), intervalo(hi, None, ca=cerr))
        mal1 = intervalo(a, None, ca=cerr)
    else:
        resp = intervalo(lo, hi, ext(lo, True), ext(hi, False))
        mal2 = intervalo(lo, hi, cerr, cerr)
        mal1 = intervalo(None, a, cb=cerr)
    otro = intervalo(lo, hi, ext(lo, True), ext(hi, False)) if pos else union(intervalo(None, lo, cb=ext(lo, True)), intervalo(hi, None, ca=ext(hi, False)))
    return mk(f"Resuelve la inecuación: {fac(a)}/{fac(b)} {sim} 0",
              resp, "t5_inec_racional", [(mal1, "multiplica_denominador"), (mal2 if mal2 != resp else None, "incluye_cero_den"), (otro, None)],
              [intervalo(a, b, cerr, cerr) if a < b else intervalo(b, a, cerr, cerr)],
              [f"Ceros del numerador: x = {N(a)}; del denominador: x = {N(b)} (este nunca se incluye).",
               "Estudio el signo del cociente en cada intervalo que determinan.", f"Solución: {resp}."],
              "No se puede multiplicar por el denominador sin saber su signo; los ceros del denominador siempre se excluyen.")


# ================================================================ ALG.POLI

def _poli_desordenado(rng, co):
    ts = [(c, ("x" + sp(e)) if e else "") for e, c in co.items() if c]
    rng.shuffle(ts)
    return terms(ts), ts


@generador("t5_poli_elementos")
def gen_poli_elementos(rng, d):
    for _ in range(100):
        g = rng.randint(2, 5)
        co = {e: (nz(rng, -7, 7) if rng.random() < 0.7 else 0) for e in range(g + 1)}
        co[g] = nz(rng, -5, 5)
        if co[0] == 0:
            co[0] = nz(rng, -9, 9)
        txt, ts = _poli_desordenado(rng, co)
        if ts[0][1] != "x" + sp(g) and ts[-1][1] != "":
            break
    tarea = rng.choice(["grado", "indep", "coef"]) if d == 1 else rng.choice(["coef", "valor", "principal"]) if d == 2 else "valor"
    primer_exp = ts[0][1]
    pe = 0 if not primer_exp else (1 if primer_exp == "x" else int(str(primer_exp[1:]).translate(str.maketrans("⁰¹²³⁴⁵⁶⁷⁸⁹", "0123456789"))))
    if tarea == "grado":
        return mk(f"¿Cuál es el grado del polinomio P(x) = {txt}?", str(g), "t5_poli", [(str(pe) if pe != g else str(len(ts)), "grado_primero"), (str(len(ts)) if len(ts) != g else str(g + 1), "grado_primero"), (str(g - 1), None)],
                  [str(g + 2), "1"], [f"El grado es el mayor exponente de x con coeficiente no nulo: {g}."], "El grado no depende del orden en que estén escritos los términos.")
    if tarea == "indep":
        ult = ts[-1][0]
        return mk(f"¿Cuál es el término independiente de P(x) = {txt}?", N(co[0]), "t5_poli", [(N(ult), "indep_ultimo"), (N(-co[0]), None), ("0", None)],
                  [N(co[0] + 1), N(co[g])], [f"El término independiente es el que no lleva x: {N(co[0])}."], "El término independiente no tiene por qué ser el último escrito.")
    if tarea == "principal":
        return mk(f"¿Cuál es el coeficiente principal de P(x) = {txt}?", N(co[g]), "t5_poli", [(N(ts[0][0]) if ts[0][0] != co[g] else N(-co[g]), "grado_primero"), (N(co[0]), "indep_ultimo"), (str(g), None)],
                  [N(co[g] + 1)], [f"Es el coeficiente del término de mayor grado (x{sp(g)}): {N(co[g])}."], "El coeficiente principal acompaña a la potencia de mayor grado.")
    if tarea == "coef":
        k = rng.choice([e for e in range(1, g)] or [1])
        return mk(f"¿Cuál es el coeficiente de x{sp(k)} en P(x) = {txt}?", N(co.get(k, 0)), "t5_poli", [(N(-co.get(k, 0)) if co.get(k, 0) else "1", None), (str(k), None), (N(co[g]) if co[g] != co.get(k, 0) else N(co[0]), None)],
                  ["No tiene", N(co.get(k, 0) + 1)], [f"Busco el término en x{sp(k)}: " + (f"su coeficiente es {N(co[k])}." if co.get(k) else "no aparece, así que su coeficiente es 0.")],
                  "Si un grado no aparece, su coeficiente es 0 (polinomio incompleto).")
    a = rng.choice([-3, -2, -1, 2, 3]) if d == 3 else rng.choice([-2, -1, 1, 2])
    r = pev(co, a)
    mal = sum(F(c) * (abs(a) ** e if (c < 0 and e % 2 == 0) else F(a) ** e) * (-1 if (c < 0 and e % 2 == 0) else 1) * (-1 if c < 0 and e % 2 == 0 else 1) for e, c in co.items())
    mal2 = sum(F(c) * (-(F(a) ** e) if (e % 2 == 0 and a < 0 and c < 0) else F(a) ** e) for e, c in co.items())
    malneg = sum((-abs(c) * abs(a) ** e * -1 if (c < 0 and e % 2 == 0 and a < 0) else F(c) * F(a) ** e) for e, c in co.items())
    return mk(f"Calcula P({N(a)}) si P(x) = {txt}", N(r), "t5_poli", [(N(malneg) if malneg != r else N(r + 2 * abs(co[g]) * abs(a) ** g), "signo_potencia"), (N(sum(F(c) * a * e if e else F(c) for e, c in co.items())), None), (N(-r), None)],
              [N(r + 1), N(r - 1)], [f"Sustituyo x por ({N(a)}) en cada término, con paréntesis, y calculo potencias antes que productos.", f"P({N(a)}) = {N(r)}."],
              "−x⁴ con x = −2 vale −(−2)⁴ = −16: el signo menos de delante no se eleva.")


@generador("t5_poli_suma")
def gen_poli_suma(rng, d):
    g = rng.randint(2, 4)
    p = {e: rng.randint(-7, 7) for e in range(g + 1)}
    q = {e: rng.randint(-7, 7) for e in range(rng.randint(1, g) + 1)}
    p[g] = nz(rng, -5, 5)
    op = "+" if d == 1 else rng.choice(["−", "−", "+"])
    k = 1 if op == "+" else -1
    res = padd(p, q, k)
    if not res:
        res = {0: 0}
    enun = f"Calcula: ({P(p)}) {op} ({P(q)})"
    dist = []
    if op == "−":
        top = max(e for e, c in q.items() if c) if any(q.values()) else 0
        e1 = padd(p, {top: q.get(top, 0)}, -1)
        e1 = padd(e1, {e: c for e, c in q.items() if e != top})
        dist.append((P(e1), "resta_solo_primero"))
    # mezcla de grados: suma término de grado g−1 al de grado g
    mix = dict(res)
    if g - 1 in mix and g in mix:
        mix[g] = mix[g] + mix.pop(g - 1)
        dist.append((P(mix), "mezcla_grados"))
    dist.append((P(padd(p, q, -k)), None))
    return mk(enun, P(res), "t5_poli_suma", dist, [P(padd(res, {0: 1})), P(padd(res, {1: -1}))],
              [("Restar un polinomio es sumar su opuesto: cambio el signo de TODOS sus términos. " if op == "−" else "") + "Sumo los coeficientes de los términos del mismo grado.",
               f"Resultado: {P(res)}."],
              "Solo se agrupan términos del mismo grado, y el exponente se conserva. En la resta el signo cambia en todos los términos del sustraendo.")


@generador("t5_poli_producto")
def gen_poli_producto(rng, d):
    if d == 1:
        m = {rng.randint(1, 2): nz(rng, -5, 5)}
        q = {e: nz(rng, -6, 6) for e in range(rng.randint(1, 2) + 1)}
    elif d == 2:
        m = {1: rng.choice([1, 1, 2, 3]), 0: nz(rng, -7, 7)}
        q = {1: rng.choice([1, 1, 2, -1]), 0: nz(rng, -7, 7)}
    else:
        m = {2: rng.choice([1, 2]), 1: rng.randint(-5, 5), 0: nz(rng, -5, 5)}
        q = {1: rng.choice([1, 2, 3]), 0: nz(rng, -5, 5)}
    res = pmul(m, q)
    enun = f"Calcula: ({P(m)})({P(q)})" if len(m) > 1 else f"Calcula: {P(m)}·({P(q)})"
    dist = []
    if len(m) > 1:
        al = {}
        for e in set(m) & set(q):
            al[2 * e] = m[e] * q[e]
        dist.append((P(al) if al else P({0: 1}), "alineados"))
        s3 = padd(res, {min(res): -2 * res[min(res)]}) if res.get(min(res)) else res
        dist.append((P(s3), "signos"))
    sx = {}
    for e1, c1 in m.items():
        for e2, c2 in q.items():
            e = max(e1, e2) if (e1 and e2) else e1 + e2
            sx[e] = sx.get(e, 0) + c1 * c2
    dist.append((P({e: c for e, c in sx.items() if c}), "exponentes"))
    dist.append((P(padd(res, {1: 1})), None))
    return mk(enun, P(res), "t5_poli_producto", dist, [P(padd(res, {0: 1})), P(padd(res, {max(res): 1}))],
              ["Multiplico CADA término del primer factor por CADA término del segundo (coeficientes con signo; exponentes se suman).",
               f"Reduzco términos semejantes: {P(res)}."],
              "Propiedad distributiva completa: con dos binomios salen 4 productos. xᵃ·xᵇ = xᵃ⁺ᵇ.")


def _div_larga(D_, d_, comprime=False, suma=False):
    """División con errores: comprime = ignora huecos (sin ceros); suma = suma en vez de restar."""
    if comprime:
        exps = sorted(D_, reverse=True)
        top = exps[0]
        D_ = {top - i: D_[e] for i, e in enumerate(exps)}
    a = {e: F(c) for e, c in D_.items() if c}
    q = {}
    db = max(d_)
    for _ in range(10):
        if not a or max(a) < db:
            break
        e = max(a) - db
        c = a[max(a)] / F(d_[db])
        q[e] = c
        prod = pmul({e: c}, d_)
        if suma:
            a = padd(a, prod, 1)
            a.pop(e + db, None)
        else:
            a = padd(a, prod, -1)
    return q, a


@generador("t5_poli_division")
def gen_poli_division(rng, d):
    for _ in range(200):
        dg = 1 if d == 1 else 2
        d_ = {dg: 1, 0: nz(rng, -4, 4)} if dg == 1 else {2: 1, 1: rng.randint(-3, 3), 0: nz(rng, -3, 3)}
        qg = rng.randint(1, 2) if d < 3 else rng.randint(2, 3)
        q = {e: rng.randint(-4, 4) for e in range(qg + 1)}
        q[qg] = rng.choice([1, 2, 3])
        r = {e: rng.randint(-5, 5) for e in range(dg)}
        D_ = padd(pmul(d_, q), r)
        if d > 1 and len(D_) == max(D_) + 1 and rng.random() < 0.7:
            continue  # preferimos dividendos incompletos
        if max(abs(c) for c in D_.values()) <= 30:
            break
    qq, rr = pdiv(D_, d_)
    fmt_cr = lambda c, r_: f"c = {P(c) if c else '0'}, r = {P(r_) if r_ else '0'}"
    resp = fmt_cr(qq, rr)
    dist = []
    if len(D_) < max(D_) + 1:
        c1, r1 = _div_larga(D_, d_, comprime=True)
        dist.append((fmt_cr(c1, r1), "sin_huecos"))
    c2, r2 = _div_larga(D_, d_, suma=True)
    dist.append((fmt_cr(c2, r2), "suma_en_vez"))
    dist.append((fmt_cr(qq, padd(rr, {0: 1})), None))
    return mk(f"Divide ({P(D_)}) : ({P(d_)}). Da el cociente c y el resto r.", resp, "t5_poli_division", dist,
              [fmt_cr(padd(qq, {0: 1}), rr), fmt_cr(qq, pscale(rr, -1) if rr else {0: 2})],
              ["Ordeno el dividendo y dejo hueco (0) para los grados que faltan.",
               "Divido el primer término del dividendo entre el primero del divisor, multiplico por todo el divisor y lo RESTO; repito hasta que el grado del resto sea menor que el del divisor.",
               f"{resp}. Compruebo: D = d·c + r."],
              "El algoritmo es el mismo que el de los números: dividir, multiplicar y restar (cambiando signos). Los huecos evitan descolocar las columnas.")


def _ruffini_txt(c, r):
    return f"c = {P(c) if c else '0'}, r = {N(r)}"


@generador("t5_ruffini")
def gen_ruffini(rng, d):
    for _ in range(100):
        g = rng.randint(2, 3) if d == 1 else rng.randint(3, 5)
        co = {e: rng.randint(-6, 6) for e in range(g + 1)}
        co[g] = nz(rng, -3, 4)
        if d > 1:
            for e in rng.sample(range(1, g), 1):
                co[e] = 0
        a = nz(rng, -3, 3)
        q, r = pdiv(co, {1: 1, 0: -a})
        r = r.get(0, 0)
        if max(abs(c) for c in q.values()) <= 40:
            break
    div = fac(a)[1:-1]
    q2, r2 = pdiv(co, {1: 1, 0: a})
    dist = [(_ruffini_txt(q2, r2.get(0, 0)), "signo_a")]
    comp = {g - i: c for i, (e, c) in enumerate(sorted(((e, c) for e, c in co.items() if c), reverse=True))}
    if comp != {e: c for e, c in co.items() if c}:
        q3, r3 = pdiv(comp, {1: 1, 0: -a})
        dist.append((_ruffini_txt(q3, r3.get(0, 0)), "olvida_ceros"))
    dist.append((_ruffini_txt(pmul(q, {1: 1}), r), "grado_cociente"))
    return mk(f"Divide por Ruffini ({P(co)}) : ({div}). Da el cociente c y el resto r.", _ruffini_txt(q, r), "t5_ruffini", dist,
              [_ruffini_txt(q, r + 1), _ruffini_txt(padd(q, {0: 1}), r)],
              [f"Escribo los coeficientes de todos los grados (0 en los que faltan): {', '.join(N(co.get(e, 0)) for e in range(g, -1, -1))}.",
               f"Para dividir entre {div} uso a = {N(a)}: bajo el primero, multiplico por a y sumo a la columna siguiente.",
               f"El cociente tiene un grado menos: {_ruffini_txt(q, r)}."],
              "Ruffini solo sirve para divisores x − a: con x + 2 es a = −2. El cociente tiene un grado menos que el dividendo.")


@generador("t5_teorema_resto")
def gen_teorema_resto(rng, d):
    if d == 1:
        co = {e: rng.randint(-5, 5) for e in range(rng.randint(2, 4) + 1)}
        co[max(co)] = nz(rng, -3, 3)
        a = nz(rng, -3, 3)
        r = pev(co, a)
        return mk(f"Sin dividir, calcula el resto de ({P(co)}) : ({fac(a)[1:-1]})", N(r), "t5_teorema_resto", [(N(pev(co, -a)), "evalua_menos_a"), (N(co.get(0, 0)), None), (N(-r), None)],
                  [N(r + 1), N(r - 1), N(r + 2)], [f"Teorema del resto: el resto de dividir P(x) entre x − a es P(a). Aquí a = {N(a)}.", f"P({N(a)}) = {N(r)}."],
                  "Para x − 3 se calcula P(3); para x + 3, P(−3).")
    if d == 2:
        for _ in range(200):
            g = 3
            a = nz(rng, -3, 3)
            co = {3: 1, 2: rng.randint(-5, 5), 1: rng.randint(-8, 8), 0: 0}
            # k en el término de grado 1 o 2 o independiente
            e = rng.choice([0, 1, 2])
            base = dict(co)
            base[e] = 0
            # P(a) = base(a) + k·a^e = 0 → k
            if a ** e == 0:
                continue
            k = F(-pev(base, a), a ** e)
            if k.denominator == 1 and k != 0:
                break
        ts = [(c, ("x" + sp(ee)) if ee else "") for ee, c in sorted(base.items(), reverse=True) if c or ee == e]
        txt = " ".join([])
        partes = []
        for ee in sorted(set(list(base) + [e]), reverse=True):
            if ee == e:
                partes.append(("k" + ("x" + sp(ee) if ee else "")))
            elif base.get(ee):
                partes.append(terms([(base[ee], ("x" + sp(ee)) if ee else "")]))
        txt = partes[0]
        for p_ in partes[1:]:
            txt += (" − " + p_[1:]) if p_.startswith("−") else (" + " + p_)
        k2 = F(-pev(base, -a), (-a) ** e)
        return mk(f"Halla k para que {txt} sea divisible entre {fac(a)[1:-1]}", f"k = {N(k)}", "t5_teorema_resto",
                  [(f"k = {N(k2)}" if k2 != k else None, "evalua_menos_a"), (f"k = {N(-k)}", None), (f"k = {N(pev(base, a))}", None)], [f"k = {N(k + 1)}", "k = 0"],
                  [f"Divisible entre x − a significa resto 0, es decir, P(a) = 0 con a = {N(a)}.", f"Sustituyo y despejo: k = {N(k)}."],
                  "El teorema del resto convierte 'ser divisible' en una ecuación: P(a) = 0.")
    for _ in range(100):
        rs = sorted(rng.sample([-4, -3, -2, -1, 1, 2, 3, 4, 5], 3))
        k = rng.choice([1, 1, 2])
        p = proots(rs, k)
        if max(abs(c) for c in p.values()) <= 60:
            break
    resp = ", ".join(f"x = {N(r)}" for r in rs)
    return mk(f"Halla las raíces enteras de P(x) = {P(p)}", resp, "t5_teorema_resto",
              [(", ".join(f"x = {N(r)}" for r in sorted(-x for x in rs)), None), (", ".join(f"x = {N(r)}" for r in rs[:2]), None),
               (", ".join(f"x = {N(r)}" for r in sorted(set([1, -1, k, -k]))) if k > 1 else ", ".join(f"x = {N(r)}" for r in sorted(rs[:2] + [rs[2] + 1])), "divisores_principal" if k > 1 else None)],
              [", ".join(f"x = {N(r)}" for r in sorted([rs[0], rs[1], -rs[2]])) if -rs[2] not in rs else "x = 0"],
              [f"Las raíces enteras dividen al término independiente, {N(p[0])}.", "Pruebo divisores con el teorema del resto (o Ruffini) hasta encontrar los que dan 0.", f"Raíces: {resp}."],
              "Candidatas a raíces enteras: los divisores del término independiente (no del coeficiente principal).")


# ================================================================ ALG.IDENT

def _mterm(c, lx, ly):
    return (c, {"x": lx, "y": ly})


@generador("t5_factor_comun")
def gen_factor_comun(rng, d):
    for _ in range(300):
        nt = 2 if d == 1 else rng.randint(3, 4)
        g = rng.choice([2, 3, 4, 5, 6])
        fx = rng.randint(0, 2) if d > 1 else rng.randint(1, 2)
        fy = rng.randint(0, 1) if d == 3 else 0
        inner = []
        for i in range(nt):
            c = nz(rng, -5, 5)
            inner.append((c, {"x": rng.randint(0, 2), "y": rng.randint(0, 1) if d == 3 else 0}))
        # máximo: gcd coeficientes interiores 1 y alguna letra con exponente 0
        if math.gcd(*[abs(c) for c, _ in inner]) != 1:
            continue
        if min(l["x"] for _, l in inner) != 0 or (d == 3 and min(l["y"] for _, l in inner) != 0):
            continue
        if len({tuple(sorted(l.items())) for _, l in inner}) < nt:
            continue
        if inner[0][0] < 0:
            continue
        if d == 3 and not any(l["x"] == 0 and l["y"] == 0 for _, l in inner):
            continue
        break
    fac_ = mono(g, {"x": fx, "y": fy})
    tot = [(g * c, {"x": l["x"] + fx, "y": l["y"] + fy}) for c, l in inner]
    expr = poly_multi(tot)
    res = f"{fac_}({poly_multi(inner)})"
    solo_num = f"{g}({poly_multi([(c, {'x': l['x'] + fx, 'y': l['y'] + fy}) for c, l in inner])})"
    uno = [i for i, (c, l) in enumerate(inner) if l["x"] == 0 and l["y"] == 0 and abs(c) == 1]
    dist = [(f"{fac_}({poly_multi([t for i, t in enumerate(inner) if i not in uno])})" if uno and len(inner) - len(uno) >= 1 else None, "termino_vacio"),
            (solo_num if fx or fy else f"{fac_}({poly_multi([(c * 2, l) for c, l in inner])})", "factor_no_maximo")]
    mx = max(l["x"] for _, l in tot)
    if mx > fx:
        dist.append((f"{mono(g, {'x': mx, 'y': fy})}({poly_multi(inner)})", "mayor_exponente"))
    dist.append((f"{mono(g, {'x': fx, 'y': fy})}({poly_multi([(c, l) for c, l in inner[:-1]] + [(-inner[-1][0], inner[-1][1])])})", None))
    return mk(f"Saca factor común: {expr}", res, "t5_factor_comun", dist, [f"{mono(2 * g, {'x': fx, 'y': fy})}({poly_multi(inner)})"],
              [f"Máximo factor común: el mcd de los coeficientes ({g}) y cada letra común con su MENOR exponente: {fac_}.",
               f"Divido cada término entre {fac_}: {res}. (Si un término es igual al factor, dentro queda 1.)"],
              "Se comprueba multiplicando: el factor por el paréntesis debe devolver la expresión original, con el mismo número de términos.")


def _bin(a, la, b, lb):
    """(a·la ± b·lb) como lista de términos multi."""
    return [(a, la), (b, lb)]


@generador("t5_cuadrado_binomio")
def gen_cuadrado_binomio(rng, d):
    s = rng.choice([1, -1])
    if d == 1:
        a, la, b, lb = 1, {"x": 1}, rng.randint(1, 9) * s, {}
    elif d == 2:
        a, la, b, lb = rng.randint(2, 5), {"x": 1}, rng.randint(1, 7) * s, {}
    else:
        a, la = rng.randint(1, 4), {"x": rng.randint(1, 2)}
        b, lb = rng.randint(1, 5) * s, {"y": rng.randint(1, 2)} if rng.random() < 0.6 else {"x": 0}
    sq = lambda l: {k: 2 * e for k, e in l.items()}
    pr = lambda l1, l2: {k: l1.get(k, 0) + l2.get(k, 0) for k in set(l1) | set(l2)}
    res = poly_multi([(a * a, sq(la)), (2 * a * b, pr(la, lb)), (b * b, sq(lb))])
    enun = f"Desarrolla: ({poly_multi([(a, la), (b, lb)])})²"
    dist = [(poly_multi([(a * a, sq(la)), (b * b, sq(lb))]), "sin_doble_producto"), (poly_multi([(a * a, sq(la)), (a * b, pr(la, lb)), (b * b, sq(lb))]), "sin_2"),
            (poly_multi([(a * a, sq(la)), (2 * a * b, pr(la, lb)), (-b * b, sq(lb))]), "signo_ultimo"), (poly_multi([(a, sq(la)), (2 * a * b, pr(la, lb)), (b * b, sq(lb))]) if a != 1 else None, None)]
    return mk(enun, res, "t5_identidad", dist, [poly_multi([(a * a, sq(la)), (-2 * a * b, pr(la, lb)), (b * b, sq(lb))])],
              [f"(a {'+' if s > 0 else '−'} b)² = a² {'+' if s > 0 else '−'} 2ab + b², con a = {poly_multi([(a, la)])} y b = {poly_multi([(abs(b), lb)])}.", f"Resultado: {res}."],
              "(a ± b)² tiene TRES términos: el doble producto no se puede olvidar y b² siempre es positivo.")


@generador("t5_suma_diferencia")
def gen_suma_diferencia(rng, d):
    a = 1 if d == 1 else rng.randint(2, 6)
    b = rng.randint(1, 9)
    la = {rng.choice("xatym"): 1} if d < 3 else {"x": rng.randint(1, 2)}
    orden = rng.random() < (0.5 if d == 3 else 0.2)
    f1 = poly_multi([(a, la), (b, {})])
    f2 = poly_multi([(a, la), (-b, {})])
    if orden and d == 3:
        f1 = poly_multi([(-a, la), (b, {})])
        f2 = poly_multi([(a, la), (b, {})])
    enun = f"Desarrolla: ({f1})({f2})" if rng.random() < 0.5 else f"Desarrolla: ({f2})({f1})"
    sq = {k: 2 * e for k, e in la.items()}
    if orden and d == 3:
        res = poly_multi([(-a * a, sq), (b * b, {})])
        dist = [(poly_multi([(a * a, sq), (-b * b, {})]), "signo_segundo"), (poly_multi([(-a, sq), (b * b, {})]) if a != 1 else None, "coeficiente"), (poly_multi([(-a * a, sq), (-b * b, {})]), None)]
    else:
        res = poly_multi([(a * a, sq), (-b * b, {})])
        dist = [(poly_multi([(a * a, sq), (b * b, {})]), "signo_segundo"), (poly_multi([(a, sq), (-b * b, {})]) if a != 1 else None, "coeficiente"), (poly_multi([(a * a, sq), (-2 * a * b, la), (-b * b, {})]), None)]
    return mk(enun, res, "t5_identidad", dist, [poly_multi([(a * a, sq), (-b, {})]), poly_multi([(a * a, sq), (2 * a * b, la), (b * b, {})])],
              ["Suma por diferencia: (A + B)(A − B) = A² − B², donde A es el término que se repite igual y B el que cambia de signo.", f"Resultado: {res}."],
              "Los dobles productos se anulan; se eleva al cuadrado todo el término (coeficiente incluido).")


@generador("t5_factorizar_ident")
def gen_factorizar_ident(rng, d):
    caso = rng.choice(["dif", "cuad", "cuad"]) if d == 1 else rng.choice(["dif", "cuad", "no_suma", "no_trin"]) if d == 2 else rng.choice(["comun_cuad", "comun_dif", "no_trin", "dif"])
    a = 1 if d == 1 else rng.randint(1, 4)
    b = rng.choice([v for v in range(1, 10) if math.gcd(v, a) == 1])
    s = rng.choice([1, -1])
    ax = mono(a, {"x": 1})
    NO = "No es una identidad notable"
    if caso == "dif":
        enun, res = P({2: a * a, 0: -b * b}), f"({ax} + {b})({ax} − {b})"
        dist = [(f"({ax} − {b})²", None), (f"({ax} + {b})²", None), (f"({ax} + {N(b * b)})({ax} − {N(b * b)})" if b > 1 else f"{mono(a * a, {'x': 1})}(x − 1)", None)]
    elif caso == "cuad":
        enun, res = P({2: a * a, 1: 2 * a * b * s, 0: b * b}), f"({ax} {'+' if s > 0 else '−'} {b})²"
        dist = [(f"({ax} + {b})({ax} − {b})", None), (f"({ax} {'−' if s > 0 else '+'} {b})²", None), (f"({ax} {'+' if s > 0 else '−'} {b * b})²", None)]
    elif caso == "no_suma":
        enun, res = P({2: a * a, 0: b * b}), NO
        dist = [(f"({ax} + {b})({ax} − {b})", "suma_cuadrados"), (f"({ax} + {b})²", None), (f"({ax} − {b})²", None)]
    elif caso == "no_trin":
        mid = 2 * a * b + rng.choice([-1, 1, 2]) * (1 if b > 1 else 1)
        enun, res = P({2: a * a, 1: mid, 0: b * b}), NO
        dist = [(f"({ax} + {b})²", "trinomio_no_cuadrado"), (f"({ax} + {b})({ax} − {b})", None), (f"({ax} − {b})²", None)]
    else:
        k = rng.randint(2, 5)
        if caso == "comun_cuad":
            p = pscale(pmul({1: 1}, {2: 1, 1: 2 * b * s, 0: b * b}), k)
            enun, res = P(p), f"{k}x(x {'+' if s > 0 else '−'} {b})²"
            dist = [(f"{k}x(x {'+' if s > 0 else '−'} {b})(x {'−' if s > 0 else '+'} {b})", None), (f"x(x {'+' if s > 0 else '−'} {b})²", None), (f"{k}(x {'+' if s > 0 else '−'} {b})²", None)]
        else:
            p = pscale({2: 1, 0: -b * b}, k)
            enun, res = P(p), f"{k}(x + {b})(x − {b})"
            dist = [(f"(x + {b})(x − {b})", None), (f"{k}(x − {b})²", None), (f"({k}x + {b})({k}x − {b})", None)]
    dist.append((NO, None) if res != NO else (f"({ax} + {b})²", None))
    return mk(f"Factoriza usando identidades notables (si se puede): {enun}", res, "t5_factorizar_ident", dist, [f"(x + {b + 1})²"],
              ["Si hay factor común, lo saco primero.", "Busco: diferencia de cuadrados A² − B² = (A + B)(A − B), o trinomio cuadrado A² ± 2AB + B² = (A ± B)².",
               f"Resultado: {res}."],
              "A² + B² no se factoriza con números reales, y un trinomio solo es cuadrado perfecto si el término central es exactamente ±2AB.")


@generador("t5_factorizar_completo")
def gen_factorizar_completo(rng, d):
    for _ in range(300):
        g = 2 if d == 1 else rng.randint(3, 4)
        rs = [rng.randint(-4, 4) for _ in range(g)]
        k = rng.choice([1, 1, 2, 3, -1]) if d > 1 else rng.choice([1, 2, 3])
        p = proots(rs, k)
        if max(abs(c) for c in p.values()) <= 80 and len(set(rs)) >= (2 if d > 1 else 2):
            break
    res = factorizado(k, rs)
    dist = [(factorizado(k, [-r for r in rs]), "factor_signo"), (factorizado(1, rs) if k != 1 else factorizado(2, rs), "pierde_coef")]
    # para antes de tiempo: deja un factor cuadrático expandido
    nz_ = [r for r in rs if r != 0]
    if len(rs) >= 2:
        r1, r2 = sorted(rs)[-2:]
        resto = sorted(rs)[:-2]
        q = P(proots([r1, r2]))
        dist.append(((factorizado(k, resto) if resto or k != 1 else "") + f"({q})", "para_antes"))
    return mk(f"Factoriza completamente: {P(p)}", res, "t5_factorizar", dist, [factorizado(k, [r + 1 for r in rs]), factorizado(-k, rs)],
              ["Saco factor común si puedo; después busco raíces enteras (divisores del término independiente) con Ruffini o la fórmula.",
               f"Cada raíz r da un factor (x − r); no olvido el coeficiente principal ({N(k)}).", f"P(x) = {res}."],
              "Factorizar completamente: seguir hasta que ningún factor tenga raíces reales. La raíz 2 da el factor (x − 2).")


# ================================================================ ALG.FRACALG

@generador("t5_frac_simplificar")
def gen_frac_simplificar(rng, d):
    for _ in range(300):
        c = nz(rng, -6, 6)
        if d == 1:
            num, den = [c, rng.choice([0, nz(rng, -6, 6)])], [c, nz(rng, -6, 6)]
            kn, kd = rng.choice([1, 2, 3]), 1
        elif d == 2:
            num, den = [c, -c] if rng.random() < 0.5 else [c, nz(rng, -6, 6)], [c, c]
            kn, kd = 1, 1
        else:
            num, den = [c, nz(rng, -5, 5), 0], [c, nz(rng, -5, 5)]
            kn, kd = rng.choice([1, 2]), 1
        if len(set(num) & set(den)) and frac_fact(kn, num, den) != frac_fact(kn, num, []):
            pn, pd = proots(num, kn), proots(den, kd)
            if max(abs(v) for v in list(pn.values()) + list(pd.values())) <= 60:
                break
    pn, pd = proots(num, kn), proots(den, kd)
    res = frac_fact(F(kn, kd), num, den)
    # E01: tacha sumandos (x² con x²…): cociente de los términos que no son de mayor grado
    gn, gd = max(pn), max(pd)
    rn = {e: c for e, c in pn.items() if e != gn}
    rd = {e: c for e, c in pd.items() if e != gd}
    e1 = f"{par(P(rn))}/{par(P(rd))}" if rn and rd else None
    dist = [(e1, "tacha_sumandos")]
    # E02: tacha la x de x²
    if gn >= 2:
        dist.append((f"{par(P({e - 1 if e == gn else e: c for e, c in pn.items()}))}/{par(P(pd))}" if False else frac_fact(F(kn, kd), [r for r in num if r != 0][:1], den[1:] + [0]), "tacha_x"))
    dist.append((frac_fact(F(kn, kd), [-r for r in num], [-r for r in den]), None))
    return mk(f"Simplifica: ({P(pn)})/({P(pd)})", res, "t5_fracalg", dist, [frac_fact(F(kn, kd), num, [])],
              [f"Factorizo numerador y denominador: {factorizado(kn, num)} y {factorizado(kd, den)}.", f"Cancelo los factores comunes (nunca sumandos): {res}."],
              "Solo se simplifican FACTORES (lo que multiplica a todo), nunca sumandos: (x + 3)/(x + 5) no se simplifica.")


def dpar(t):
    """Paréntesis para un denominador salvo que sea un número o una sola potencia de x sin coeficiente."""
    import re as _re
    return t if _re.fullmatch(r"\d+|x[⁰¹²³⁴⁵⁶⁷⁸⁹]*", t) else f"({t})"


def _frac_expr(numpoly, denroots, k=1):
    """Fracción con numerador polinomio y denominador expandido desde raíces."""
    return f"{par(P(numpoly))}/{dpar(P(proots(denroots, k)))}"


def _frac_red(numpoly, denroots):
    """Simplifica numerador (polinomio) entre Π(x − r): devuelve texto canónico numerador/denominador expandidos."""
    den = list(denroots)
    num = dict(numpoly)
    changed = True
    while changed:
        changed = False
        for r in list(den):
            if num and pev(num, r) == 0:
                num, _ = pdiv(num, {1: 1, 0: -r})
                den.remove(r)
                changed = True
                break
    if not num:
        return "0"
    if not den:
        return P(num)
    return f"{par(P(num))}/{dpar(P(proots(den)))}"


@generador("t5_frac_suma")
def gen_frac_suma(rng, d):
    for _ in range(300):
        a, b = rng.sample(range(-5, 6), 2)
        A, B = nz(rng, -5, 5), nz(rng, -5, 5)
        op = 1 if d == 1 else rng.choice([1, -1])
        if d < 3:
            # A/(x − a) ± B/(x − b)
            num = padd(pscale({1: 1, 0: -b}, A), pscale({1: 1, 0: -a}, B), op)
            den = [a, b]
            enun = f"{A if A > 0 else '−' + str(-A)}/{fac(a)} {'+' if op * (1 if B > 0 else -1) > 0 else '−'} {abs(B)}/{fac(b)}".replace("/x ", "/x ")
            e1 = f"{N(A + op * B) if A + op * B else '0'}/{dpar(P({1: 2, 0: -a - b}))}"
        else:
            # A/(x − a) − (x + c)/((x − a)(x − b))
            c = rng.randint(-6, 6)
            num = padd(pscale({1: 1, 0: -b}, A), {1: 1, 0: c}, -1)
            den = [a, b]
            enun = f"{A if A > 0 else '−' + str(-A)}/{fac(a)} − {par(P({1: 1, 0: c}))}/({P(proots([a, b]))})"
            e1 = _frac_red(padd(pscale({1: 1, 0: -b}, A), {1: 1, 0: -c}, -1), den)  # signo menos solo al primero
        if not num or (d == 3 and _frac_red(num, den) == _frac_expr(num, den)):
            continue
        break
    res = _frac_red(num, den)
    dist = [(e1, "suma_num_den" if d < 3 else "signo_numerador"), (_frac_red(padd(num, {0: 1}), den), None), (_frac_red(pscale(num, -1), den), None)]
    return mk(f"Calcula y simplifica: {enun}", res, "t5_fracalg", dist, [_frac_expr(padd(num, {1: 1}), den)],
              [f"Común denominador: el mcm de los denominadores, {factorizado(1, den)}.", "Multiplico cada numerador por lo que le falta a su denominador y opero (un menos delante de una fracción afecta a todo su numerador).",
               f"Simplifico si se puede: {res}."],
              "Como con los números: a/b + c/d ≠ (a + c)/(b + d). Se reduce a común denominador y se simplifica al final.")


@generador("t5_frac_producto")
def gen_frac_producto(rng, d):
    for _ in range(300):
        rs = rng.sample([-4, -3, -2, -1, 1, 2, 3, 4, 5], 4)
        n1, d1 = [rs[0], rs[1]], [rs[2]]
        n2, d2 = [rs[2], 0] if d > 1 else [rs[2]], [rs[0]] if d > 1 else [rs[3]]
        div = d > 1 and rng.random() < 0.6
        if div:
            n2, d2 = d2, n2  # así el cociente da lo mismo que el producto anterior
        break
    k = 1
    txt = lambda nn, dd: f"{par(P(proots(nn)))}/{par(P(proots(dd)))}"
    if div:
        enun = f"{txt(n1, d1)} : {txt(n2, d2)}"
        tn, td = n1 + d2, d1 + n2
        mal = frac_fact(1, n1 + n2, d1 + d2)
    else:
        enun = f"{txt(n1, d1)} · {txt(n2, d2)}"
        tn, td = n1 + n2, d1 + d2
        mal = frac_fact(1, n1 + d2, d1 + n2)
    res = frac_fact(1, tn, td)
    dist = [(mal, "divide_sin_invertir" if div else None), (frac_fact(1, [-r for r in tn], [-r for r in td]), None), (frac_fact(1, tn[:1], td[:1] + [5]) if len(tn) > 1 else frac_fact(1, [1], td), "simplifica_mal")]
    return mk(f"Calcula y simplifica: {enun}", res, "t5_fracalg", dist, [frac_fact(2, tn, td)],
              [("Dividir es multiplicar por la inversa de la segunda fracción. " if div else "") + "Factorizo todos los numeradores y denominadores.",
               f"Multiplico y cancelo factores comunes entre cualquier numerador y cualquier denominador: {res}."],
              "Factorizar antes de multiplicar simplifica mucho; se cancela un factor de un numerador con uno de un denominador, nunca dos del mismo numerador.")


# ================================================================ ALG.SIST (2×2 y 3×3)

def _eq2(a, b, c, vx="x", vy="y"):
    return f"{terms([(a, vx), (b, vy)])} = {N(c)}"


def _solve2(a, b, c, d_, e, f):
    det = a * e - b * d_
    if det == 0:
        return None
    return F(c * e - b * f, det), F(a * f - c * d_, det)


def _sxy(x, y):
    return f"x = {N(x)}, y = {N(y)}"


def _sistema2(rng, d, frac=False, forma=None):
    for _ in range(500):
        x, y = F(rng.randint(-6, 8)), F(rng.randint(-6, 8))
        if frac and rng.random() < 0.4:
            x = F(rng.randint(-7, 7), rng.choice([2, 3]))
        a, b, d_, e = nz(rng, -5, 6), nz(rng, -5, 6), nz(rng, -5, 6), nz(rng, -5, 6)
        if forma == "sust":
            d_ = 1
        if forma == "igual":
            b, e = -1, -1
        if a * e - b * d_ == 0:
            continue
        c, f = a * x + b * y, d_ * x + e * y
        if c.denominator == 1 and f.denominator == 1:
            return x, y, a, b, int(c), d_, e, int(f)


@generador("t5_sist_comprobar")
def gen_sist_comprobar(rng, d):
    x, y, a, b, c, d_, e, f = _sistema2(rng, d)
    caso = rng.choice(["ambas", "primera", "segunda", "ninguna"])
    px, py = x, y
    if caso != "ambas":
        for _ in range(100):
            px, py = x + rng.randint(-3, 3), y + rng.randint(-3, 3)
            ok1, ok2 = a * px + b * py == c, d_ * px + e * py == f
            if (caso, ok1, ok2) in (("primera", True, False), ("segunda", False, True), ("ninguna", False, False)):
                break
        else:
            caso = "ambas"
            px, py = x, y
    ok1, ok2 = a * px + b * py == c, d_ * px + e * py == f
    OPC = {"ambas": "Sí: cumple las dos ecuaciones", "primera": "No: solo cumple la primera", "segunda": "No: solo cumple la segunda", "ninguna": "No: no cumple ninguna"}
    real = "ambas" if ok1 and ok2 else "primera" if ok1 else "segunda" if ok2 else "ninguna"
    resp = OPC[real]
    s1, s2 = a * py + b * px == c, d_ * py + e * px == f
    inter = "ambas" if s1 and s2 else "primera" if s1 else "segunda" if s2 else "ninguna"
    dist = [(OPC["ambas"] if real == "primera" else None, "solo_una"), (OPC[inter] if inter != real else None, "intercambia")]
    dist += [(v, None) for k, v in OPC.items() if k != real]
    return mk(f"¿Es ({N(px)}, {N(py)}) solución del sistema {{{_eq2(a, b, c)}; {_eq2(d_, e, f)}}}?", resp, "t5_sist_comprobar", dist, [],
              [f"Sustituyo x = {N(px)} e y = {N(py)} en la primera: {N(a * px + b * py)} {'=' if ok1 else '≠'} {N(c)}.",
               f"Y en la segunda: {N(d_ * px + e * py)} {'=' if ok2 else '≠'} {N(f)}.", "Solo es solución si cumple LAS DOS."],
              "Un par es solución del sistema si cumple todas las ecuaciones a la vez; el primer número del par es x.")


@generador("t5_sist_resolver")
def gen_sist_resolver(rng, d, metodo="sustitucion"):
    forma = {"sustitucion": "sust", "igualacion": "igual", "reduccion": None}[metodo]
    x, y, a, b, c, d_, e, f = _sistema2(rng, d, frac=(d == 3), forma=forma if d < 3 or forma == "sust" else None)
    if metodo == "igualacion" and d < 3:
        # y = mx + n en las dos
        e1, e2 = f"y = {P({1: a, 0: c})}".replace("y = ", "y = "), None
        m1, n1 = F(a), F(c)
        # reconstruye: a x − y = −c  →  y = a x + c : usamos b = e = −1
        e1 = f"y = {P({1: a, 0: -c})}" if False else f"y = {P({1: F(-a, b), 0: F(c, b)})}"
        e2 = f"y = {P({1: F(-d_, e), 0: F(f, e)})}"
        enun = f"Resuelve por igualación: {{{e1}; {e2}}}"
    else:
        nom = {"sustitucion": "sustitución", "igualacion": "igualación", "reduccion": "reducción"}[metodo]
        enun = f"Resuelve por {nom}: {{{_eq2(a, b, c)}; {_eq2(d_, e, f)}}}"
    resp = _sxy(x, y)
    dist = []
    if metodo == "sustitucion":
        # E02: paréntesis al sustituir: de la 2.ª x = f − e y; en la 1.ª: a(f − e y) → a f − e y
        den = b - e
        if den:
            y2 = F(c - a * f, den)
            x2 = f - e * y2
            if abs(x2) <= 40 and abs(y2) <= 40:
                dist.append((_sxy(x2, y2), "parentesis"))
        dist.append((f"y = {N(y)}", "olvida_incognita"))
        dist.append(("Infinitas soluciones", "misma_ecuacion"))
    elif metodo == "igualacion":
        dist.append((_sxy(y, x), "letras_distintas"))
        s2 = _solve2(a, b, c + 1, d_, e, f)
        dist.append((_sxy(*s2) if s2 else None, "denominadores"))
    else:
        s1 = _solve2(a * e, b * e, c, d_, e, f) if e != 1 else None  # multiplica solo el primer miembro
        if s1:
            dist.append((_sxy(*s1), "multiplica_un_miembro"))
        s2 = _solve2(a, b, c, -d_, -e, f)
        if s2:
            dist.append((_sxy(*s2), "suma_en_vez"))
    dist.append((_sxy(-x, y), None))
    return mk(enun, resp, "t5_sistema", dist, [_sxy(x, -y), _sxy(x + 1, y), _sxy(y, x)],
              {"sustitucion": ["Despejo x en la ecuación donde es más fácil y sustituyo esa expresión, entre paréntesis, en la OTRA ecuación.",
                               f"Resuelvo la ecuación en y: y = {N(y)}; vuelvo a la expresión despejada: x = {N(x)}."],
               "igualacion": ["Despejo la MISMA incógnita en las dos ecuaciones e igualo las dos expresiones.",
                              f"Resuelvo: x = {N(x)}; sustituyo en cualquiera: y = {N(y)}."],
               "reduccion": ["Multiplico una o las dos ecuaciones (todos sus términos, también el independiente) para que una incógnita tenga coeficientes opuestos.",
                             f"Sumo las ecuaciones, despejo y sustituyo: x = {N(x)}, y = {N(y)}."]}[metodo] + ["Compruebo en las dos ecuaciones."],
              "La solución de un sistema es un par (x, y) que cumple las dos ecuaciones; comprobarlo al final detecta casi todos los errores.",
              x=x, y=y)


@generador("t5_sist_tipos")
def gen_sist_tipos(rng, d):
    caso = rng.choice(["SCD", "SI", "SCI"]) if d > 1 else rng.choice(["SCD", "SCD", "SI", "SCI"])
    x, y, a, b, c, d_, e, f = _sistema2(rng, d)
    if caso != "SCD":
        k = rng.choice([2, 3, -2, -1, -3])
        d_, e = k * a, k * b
        f = k * c if caso == "SCI" else k * c + nz(rng, -5, 5)
    TXT = {"SCD": f"Compatible determinado: rectas secantes en {pt(x, y)}", "SI": "Incompatible: rectas paralelas", "SCI": "Compatible indeterminado: rectas coincidentes"}
    resp = TXT[caso]
    dist = []
    if caso == "SI":
        dist.append((TXT["SCI"], "paralelas_coincidentes"))
        dist.append(("Compatible determinado: rectas secantes en (0, 0)", None))
    elif caso == "SCI":
        dist.append((TXT["SI"], None))
        dist.append((f"Compatible determinado: rectas secantes en {pt(x, y)}", None))
    else:
        dist.append((f"Compatible determinado: rectas secantes en {pt(y, x)}" if x != y else None, "corte_al_reves"))
        dist.append((TXT["SI"], None))
        dist.append((TXT["SCI"], None))
    return mk(f"Clasifica el sistema {{{_eq2(a, b, c)}; {_eq2(d_, e, f)}}} e interprétalo gráficamente.", resp, "t5_sist_tipos", dist,
              [TXT["SI"], TXT["SCI"], f"Compatible determinado: rectas secantes en {pt(x + 1, y)}"],
              ["Comparo los coeficientes: si a/a' ≠ b/b', las rectas se cortan (una solución).",
               "Si son proporcionales, miro también los términos independientes: si también lo son, coinciden (infinitas); si no, son paralelas (ninguna).",
               f"{resp}."],
              "Coeficientes proporcionales no bastan para 'infinitas soluciones': hay que mirar el término independiente.")


@generador("t5_sist_no_lineal")
def gen_sist_no_lineal(rng, d):
    tipo = rng.choice(["sp", "sp", "parab"]) if d < 3 else rng.choice(["parab", "circ"])
    if tipo == "sp":
        p, q = rng.sample(range(-6, 9), 2)
        enun = f"{{x + y = {N(p + q)}; xy = {N(p * q)}}}"
        pares = sorted({(p, q), (q, p)})
        mal = [(p, p), (q, q)]
    elif tipo == "parab":
        r1, r2 = rng.sample(range(-4, 5), 2)
        m, n = rng.randint(-3, 3), rng.randint(-5, 5)
        # y = x² + bx + c ; y = m x + n con cortes r1, r2
        b = m - (r1 + r2)
        c = n + r1 * r2
        enun = f"{{y = {P({2: 1, 1: b, 0: c})}; y = {P({1: m, 0: n})}}}"
        pares = sorted({(r1, m * r1 + n), (r2, m * r2 + n)})
        mal = [(pares[0][0], pares[1][1]), (pares[1][0], pares[0][1])]
    else:
        tri = rng.choice([(3, 4, 5), (0, 5, 5), (6, 8, 10), (5, 12, 13), (0, 3, 3), (0, 4, 4)])
        a_, b_, r = tri
        sx, sy = rng.choice([1, -1]), rng.choice([1, -1])
        px, py = sx * a_, sy * b_
        # recta y = k x por el origen y el punto
        if px == 0:
            enun = f"{{x² + y² = {r * r}; x = 0}}"
            pares = sorted({(0, r), (0, -r)})
        else:
            k = F(py, px)
            enun = f"{{x² + y² = {r * r}; y = {P({1: k})}}}"
            pares = sorted({(px, py), (-px, -py)})
        mal = [(pares[0][0], pares[1][1]), (pares[1][0], pares[0][1])]
    fp = lambda ps: " y ".join(pt(*q) for q in sorted(ps))
    resp = fp(pares)
    dist = [(pt(*pares[0]), "un_par"), (fp(set(mal)) if set(mal) != set(pares) and mal[0] != mal[1] else None, "empareja_mal"), (pt(*pares[-1]), "un_par"),
            (fp({(-a, -b) for a, b in pares}), None)]
    return mk(f"Resuelve el sistema: {enun}", resp, "t5_sist_no_lineal", dist, [fp({(a + 1, b) for a, b in pares})],
              ["Despejo una incógnita en la ecuación lineal y la sustituyo en la otra: sale una ecuación de segundo grado.",
               "Cada solución de esa ecuación da un par; calculo la otra incógnita en la ecuación despejada.", f"Soluciones: {resp}."],
              "Los sistemas no lineales pueden tener varias soluciones; cada valor de x va con SU valor de y.")


def _solve3(A, b):
    """Gauss con fracciones. Devuelve lista o None si singular."""
    M = [[F(v) for v in fila] + [F(bb)] for fila, bb in zip(A, b)]
    n = 3
    for i in range(n):
        piv = next((r for r in range(i, n) if M[r][i] != 0), None)
        if piv is None:
            return None
        M[i], M[piv] = M[piv], M[i]
        for r in range(n):
            if r != i and M[r][i] != 0:
                k = M[r][i] / M[i][i]
                M[r] = [x - k * y for x, y in zip(M[r], M[i])]
    return [M[i][3] / M[i][i] for i in range(n)]


def det3(A):
    return (A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0])
            + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]))


def det2(A):
    return A[0][0] * A[1][1] - A[0][1] * A[1][0]


def rango(M):
    M = [[F(v) for v in f] for f in M]
    r = 0
    cols = len(M[0])
    for c in range(cols):
        piv = next((i for i in range(r, len(M)) if M[i][c] != 0), None)
        if piv is None:
            continue
        M[r], M[piv] = M[piv], M[r]
        for i in range(len(M)):
            if i != r and M[i][c] != 0:
                k = M[i][c] / M[r][c]
                M[i] = [x - k * y for x, y in zip(M[i], M[r])]
        r += 1
    return r


def _eq3(fila, b, vs=("x", "y", "z")):
    return f"{terms(list(zip(fila, vs)))} = {N(b)}"


def _sxyz(s):
    return f"x = {N(s[0])}, y = {N(s[1])}, z = {N(s[2])}"


def _matriz3(rng, lo=-3, hi=3, detmin=1):
    for _ in range(500):
        A = [[rng.randint(lo, hi) for _ in range(3)] for _ in range(3)]
        A[0][0] = 1
        if abs(det3(A)) >= detmin and all(any(v for v in f) for f in A):
            return A


@generador("t5_gauss3")
def gen_gauss3(rng, d):
    A = _matriz3(rng, -2 if d == 1 else -3, 2 if d == 1 else 4)
    s = [rng.randint(-3, 4) for _ in range(3)]
    b = [sum(A[i][j] * s[j] for j in range(3)) for i in range(3)]
    enun = "Resuelve por el método de Gauss: {" + "; ".join(_eq3(A[i], b[i]) for i in range(3)) + "}"
    resp = _sxyz(s)
    dist = []
    s1 = _solve3(A, [b[0], b[1] + b[0], b[2]])
    if s1:
        dist.append((_sxyz(s1), "fila_mal"))
    # E02: sustitución regresiva mal: x calculada con z pero sin y
    x2 = F(b[0] - A[0][2] * s[2], A[0][0])
    dist.append((_sxyz([x2, s[1], s[2]]) if x2 != s[0] else None, "regresiva_mal"))
    dist.append((_sxyz([s[1], s[0], s[2]]) if s[0] != s[1] else None, None))
    dist.append((_sxyz([-s[0], s[1], -s[2]]), None))
    return mk(enun, resp, "t5_gauss", dist, [_sxyz([s[0] + 1, s[1], s[2]]), _sxyz([s[0], s[1], s[2] + 1])],
              ["Uso la primera ecuación para eliminar la x de las otras dos (restando múltiplos de filas enteras, término independiente incluido).",
               "Con la nueva segunda ecuación elimino la y de la tercera: el sistema queda escalonado.",
               f"Despejo z en la última, luego y, luego x: {resp}. Compruebo en las tres ecuaciones."],
              "Las transformaciones de Gauss afectan a la fila entera, también al término independiente; la sustitución regresiva va de abajo arriba.")


@generador("t5_gauss_clasificar")
def gen_gauss_clasificar(rng, d):
    caso = rng.choice(["SCD", "SCI", "SI"])
    for _ in range(300):
        f1 = [1, rng.randint(-3, 3), rng.randint(-3, 3)]
        f2 = [rng.randint(-3, 3) for _ in range(3)]
        s = [rng.randint(-3, 3) for _ in range(3)]
        b1, b2 = sum(x * y for x, y in zip(f1, s)), sum(x * y for x, y in zip(f2, s))
        if rango([f1, f2]) < 2:
            continue
        if caso == "SCD":
            f3 = [rng.randint(-3, 3) for _ in range(3)]
            b3 = sum(x * y for x, y in zip(f3, s))
            if det3([f1, f2, f3]) == 0:
                continue
        else:
            p, q = rng.choice([1, 2, -1]), rng.choice([1, -1, 2])
            f3 = [p * x + q * y for x, y in zip(f1, f2)]
            b3 = p * b1 + q * b2 + (0 if caso == "SCI" else nz(rng, -4, 4))
            if not any(f3):
                continue
        break
    enun = "Clasifica el sistema: {" + "; ".join(_eq3(f, bb) for f, bb in ((f1, b1), (f2, b2), (f3, b3))) + "}"
    TXT = {"SCD": "Compatible determinado", "SCI": "Compatible indeterminado", "SI": "Incompatible"}
    resp = TXT[caso]
    Z0 = "Compatible determinado con z = 0"
    dist = {"SCI": [(TXT["SI"], "cero_cero_incompatible"), (TXT["SCD"], None), (Z0, None)],
            "SI": [(Z0, "cero_k_solucion"), (TXT["SCI"], None), (TXT["SCD"], None)],
            "SCD": [(TXT["SCI"], None), (TXT["SI"], None), (Z0, None)]}[caso]
    return mk(enun, resp, "t5_gauss", dist, [TXT[k] for k in TXT if k != caso],
              ["Escalono por Gauss.", {"SCD": "Quedan tres ecuaciones con pivote: solución única.",
                                         "SCI": "La última fila se anula entera (0 = 0): sobra una ecuación y hay infinitas soluciones (un parámetro).",
                                         "SI": "La última fila queda 0x + 0y + 0z = k con k ≠ 0: imposible, no hay solución."}[caso]],
              "0 = 0 indica una ecuación que sobra (infinitas soluciones si el resto es compatible); 0 = k (k ≠ 0) indica incompatible.")


# ================================================================ ALG.SISTLIN / MATRIZ

def _rand_mat(rng, m, n, lo=-4, hi=5):
    return [[rng.randint(lo, hi) for _ in range(n)] for _ in range(m)]


def madd(A, B, k=1):
    return [[a + k * b for a, b in zip(fa, fb)] for fa, fb in zip(A, B)]


def mscale(A, k):
    return [[k * a for a in f] for f in A]


def mmul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(len(B))) for j in range(len(B[0]))] for i in range(len(A))]


def mT(A):
    return [list(c) for c in zip(*A)]


def minv(A):
    n = len(A)
    M = [[F(v) for v in f] + [F(int(i == j)) for j in range(n)] for i, f in enumerate(A)]
    for i in range(n):
        piv = next(r for r in range(i, n) if M[r][i] != 0)
        M[i], M[piv] = M[piv], M[i]
        p = M[i][i]
        M[i] = [x / p for x in M[i]]
        for r in range(n):
            if r != i and M[r][i] != 0:
                k = M[r][i]
                M[r] = [x - k * y for x, y in zip(M[r], M[i])]
    return [f[n:] for f in M]


def cofactor(A, i, j):
    m = [[A[r][c] for c in range(len(A)) if c != j] for r in range(len(A)) if r != i]
    return (-1) ** (i + j) * (det2(m) if len(m) == 2 else det3(m)), (det2(m) if len(m) == 2 else det3(m))


@generador("t5_matriz_elementos")
def gen_matriz_elementos(rng, d):
    tarea = rng.choice(["dim", "elem"]) if d == 1 else rng.choice(["tras", "elem", "tipo"]) if d == 2 else "regla"
    m, n = rng.randint(2, 4), rng.randint(2, 4)
    while m == n and tarea == "dim":
        n = rng.randint(1, 4)
    A = _rand_mat(rng, m, n)
    if tarea == "dim":
        return mk(f"¿Qué dimensión tiene la matriz A = {mat(A)}?", f"{m} × {n}", "t5_matriz", [(f"{n} × {m}", "dimension_invertida"), (f"{m * n} × 1", None), (f"{m} × {m}", None)],
                  [f"{m + 1} × {n}"], [f"Tiene {m} filas y {n} columnas: dimensión {m} × {n} (primero filas)."], "La dimensión se da como filas × columnas.")
    if tarea == "elem":
        for _ in range(50):
            i, j = rng.randint(1, m), rng.randint(1, n)
            if i != j and j <= m and i <= n and A[i - 1][j - 1] != A[j - 1][i - 1]:
                break
        else:
            i, j = 1, 2
            A[1][0] = A[0][1] + 1
        return mk(f"En A = {mat(A)}, ¿cuánto vale el elemento a{sub(i)}{sub(j)}?", N(A[i - 1][j - 1]), "t5_matriz",
                  [(N(A[j - 1][i - 1]) if j <= m and i <= n else None, "fila_columna"), (N(A[i - 1][j - 1] + 1), None), (N(-A[i - 1][j - 1]) if A[i - 1][j - 1] else "1", None)],
                  [N(A[0][0]), N(A[-1][-1])], [f"a{sub(i)}{sub(j)} está en la fila {i}, columna {j}: vale {N(A[i - 1][j - 1])}."], "El primer subíndice es la fila y el segundo la columna.")
    if tarea == "tras":
        T = mT(A)
        return mk(f"Calcula la traspuesta de A = {mat(A)}", mat(T), "t5_matriz", [(mat(A), None), (mat([f[::-1] for f in A]), None), (mat([f[::-1] for f in T]), None)],
                  [mat(mscale(T, -1))], ["La traspuesta cambia filas por columnas: la fila 1 de A es la columna 1 de Aᵗ.", f"Aᵗ = {mat(T)}."],
                  "Si A es m × n, Aᵗ es n × m.")
    if tarea == "tipo":
        k = rng.randint(2, 3)
        tipo = rng.choice(["diagonal", "identidad", "simétrica", "triangular superior", "nula"])
        if tipo == "identidad":
            M = [[int(i == j) for j in range(k)] for i in range(k)]
        elif tipo == "nula":
            M = [[0] * k for _ in range(k)]
        elif tipo == "diagonal":
            M = [[nz(rng, -5, 5) if i == j else 0 for j in range(k)] for i in range(k)]
            if all(M[i][i] == 1 for i in range(k)):
                M[0][0] = 2
        elif tipo == "simétrica":
            M = [[0] * k for _ in range(k)]
            for i in range(k):
                for j in range(i, k):
                    M[i][j] = M[j][i] = nz(rng, -5, 5)
        else:
            M = [[nz(rng, -5, 5) if j >= i else 0 for j in range(k)] for i in range(k)]
        otros = [t for t in ["diagonal", "identidad", "simétrica", "triangular superior", "triangular inferior", "nula"] if t != tipo and not (tipo == "identidad" and t in ("diagonal", "simétrica")) and not (tipo in ("diagonal", "nula") and t in ("simétrica", "triangular superior", "triangular inferior", "diagonal"))]
        return mk(f"¿Qué tipo de matriz es {mat(M)}? (elige el nombre más preciso)", f"Matriz {tipo}", "t5_matriz", [(f"Matriz {t}", None) for t in rng.sample(otros, min(3, len(otros)))],
                  ["Matriz fila", "Matriz columna"], [f"Miro dónde están los ceros y si aᵢⱼ = aⱼᵢ: es {tipo}."], "Identidad ⊂ diagonal ⊂ triangular; simétrica si coincide con su traspuesta.")
    p, q, r = rng.randint(-3, 3), rng.randint(-3, 3), rng.randint(-3, 3)
    if p == q:
        q += 1
    M = [[p * i + q * j + r for j in range(1, n + 1)] for i in range(1, m + 1)]
    regla = terms([(p, "i"), (q, "j"), (r, "")])
    Mt = [[p * j + q * i + r for j in range(1, n + 1)] for i in range(1, m + 1)]
    return mk(f"Escribe la matriz A de dimensión {m} × {n} con a_ij = {regla}", mat(M), "t5_matriz", [(mat(Mt), "fila_columna"), (mat(mT(M)), "dimension_invertida"), (mat(mscale(M, -1)), None)],
              [mat(madd(M, [[1] * n for _ in range(m)]))], [f"i es el número de fila (1 a {m}) y j el de columna (1 a {n}); calculo cada elemento con la regla.", f"A = {mat(M)}."],
              "a_ij: i fila, j columna.")


@generador("t5_matriz_suma")
def gen_matriz_suma(rng, d):
    m, n = (2, 2) if d == 1 else (rng.randint(2, 3), rng.randint(2, 3))
    A, B = _rand_mat(rng, m, n), _rand_mat(rng, m, n)
    if d == 3 and m != n:
        m = n
        A, B = _rand_mat(rng, m, n), _rand_mat(rng, m, n)
    p, q = (1, rng.choice([1, -1])) if d == 1 else (rng.choice([2, 3, -1, -2]), rng.choice([1, -1, 2, -3]))
    Bu = mT(B) if d == 3 else B
    R = madd(mscale(A, p), mscale(Bu, q))
    expr = ("A" if p == 1 else "−A" if p == -1 else f"{p}A") + (" + " if q > 0 else " − ") + ("" if abs(q) == 1 else str(abs(q))) + ("Bᵗ" if d == 3 else "B")
    Am = [list(f) for f in A]
    Am[0] = [p * x for x in A[0]]
    mal1 = madd([f if i == 0 else f for i, f in enumerate(Am)], mscale(Bu, q)) if p != 1 else madd(A, mscale(Bu, -q))
    dist = [(mat(mal1), "escalar_una_fila" if p != 1 else None), (mat(madd(mscale(A, p), mscale(B, q))) if d == 3 and B != Bu else mat(madd(mscale(A, p), mscale(Bu, -q))), None),
            (mat(madd(mscale(A, q), mscale(Bu, p))) if p != q else mat(mscale(R, -1)), None)]
    return mk(f"Con A = {mat(A)} y B = {mat(B)}, calcula {expr}", mat(R), "t5_matriz", dist, [mat(madd(R, [[1] * n for _ in range(m)]))],
              ["Multiplico cada matriz por su número (TODOS sus elementos)" + (" y traspongo B" if d == 3 else "") + ".", "Sumo o resto elemento a elemento (misma posición).", f"Resultado: {mat(R)}."],
              "Solo se suman matrices de igual dimensión; el producto por un número afecta a todos los elementos.")


@generador("t5_matriz_producto")
def gen_matriz_producto(rng, d):
    if d == 1:
        A, B = _rand_mat(rng, 2, 2, -3, 4), _rand_mat(rng, 2, 2, -3, 4)
        enun_op = "A·B"
    elif d == 2:
        m, k, n = rng.choice([(2, 3, 2), (3, 2, 3), (2, 3, 3), (3, 2, 2), (2, 2, 3)])
        A, B = _rand_mat(rng, m, k, -3, 3), _rand_mat(rng, k, n, -3, 3)
        enun_op = "A·B"
    else:
        A = _rand_mat(rng, 2, 2, -3, 3) if rng.random() < 0.6 else _rand_mat(rng, 3, 3, -2, 2)
        B = A
        enun_op = "A²"
    R = mmul(A, B)
    dist = []
    if len(A) == len(B) and len(A[0]) == len(B[0]):
        dist.append((mat([[a * b for a, b in zip(fa, fb)] for fa, fb in zip(A, B)]), "elemento_a_elemento" if enun_op == "A·B" else "cuadrado_elementos"))
    if enun_op == "A·B" and len(B[0]) == len(A):
        BA = mmul(B, A)
        if len(BA) == len(R) and len(BA[0]) == len(R[0]):
            dist.append((mat(BA), "conmuta"))
    dist.append((mat(mT(R)), None))
    dist.append((mat(mscale(R, -1)), None))
    if enun_op == "A²":
        return mk(f"Con A = {mat(A)}, calcula A²", mat(R), "t5_matriz", dist, [mat(madd(R, mscale(A, 1)))],
                  ["A² = A·A: cada elemento es fila de A por columna de A (multiplicar término a término y sumar).", f"A² = {mat(R)}."],
                  "A² no es elevar cada elemento al cuadrado.")
    return mk(f"Con A = {mat(A)} y B = {mat(B)}, calcula A·B", mat(R), "t5_matriz", dist, [mat(madd(R, [[1] * len(R[0]) for _ in R]))],
              [f"A es {len(A)} × {len(A[0])} y B es {len(B)} × {len(B[0])}: se puede multiplicar y el resultado es {len(R)} × {len(R[0])}.",
               "Elemento (i, j) = fila i de A por columna j de B (productos sumados).", f"A·B = {mat(R)}."],
              "El producto de matrices es 'fila por columna' y en general A·B ≠ B·A.")


@generador("t5_determinante")
def gen_determinante(rng, d):
    if d == 1:
        A = _rand_mat(rng, 2, 2, -6, 7)
        v = det2(A)
        return mk(f"Calcula el determinante |{mat(A)}|", N(v), "t5_det", [(N(A[0][0] * A[1][1] + A[0][1] * A[1][0]), "signo_secundaria"), (N(-v), None), (N(A[0][0] * A[1][0] - A[0][1] * A[1][1]), None)],
                  [N(v + 1), N(v - 1)], [f"|a b; c d| = ad − bc = ({N(A[0][0])})·({N(A[1][1])}) − ({N(A[0][1])})·({N(A[1][0])}) = {N(v)}."], "El producto de la diagonal secundaria se RESTA.")
    if d == 2:
        A = _rand_mat(rng, 3, 3, -3, 4)
        v = det3(A)
        diag = A[0][0] * A[1][1] * A[2][2] + A[0][1] * A[1][2] * A[2][0] + A[0][2] * A[1][0] * A[2][1]
        return mk(f"Calcula el determinante |{mat(A)}|", N(v), "t5_det", [(N(diag), "sarrus_incompleto"), (N(-v), None), (N(A[0][0] * A[1][1] * A[2][2] - A[0][2] * A[1][1] * A[2][0]), None)],
                  [N(v + 1), N(v - 2)], ["Regla de Sarrus: suma de los tres productos 'paralelos' a la diagonal principal menos los tres paralelos a la secundaria.", f"|A| = {N(v)}."],
                  "Sarrus tiene seis productos: tres con signo + y tres con signo −.")
    for _ in range(300):
        A = _rand_mat(rng, 3, 3, -3, 4)
        i, j = rng.randrange(3), rng.randrange(3)
        cof, _m = cofactor(A, i, j)
        if cof == 0:
            continue
        A0 = [list(f) for f in A]
        A0[i][j] = 0
        base = det3(A0)
        k = F(-base, cof)
        if k.denominator == 1 and abs(k) <= 9:
            break
    txt = "[" + "; ".join(", ".join("k" if (r, c) == (i, j) else N(A[r][c]) for c in range(3)) for r in range(3)) + "]"
    return mk(f"¿Para qué valor de k se anula el determinante de {txt}?", f"k = {N(k)}", "t5_det", [(f"k = {N(-k)}", None), (f"k = {N(F(-base, _m))}" if _m != cof and _m else None, None), ("k = 0", None)],
              [f"k = {N(k + 1)}", f"k = {N(k - 1)}"], [f"Desarrollo el determinante con k: queda una expresión de primer grado en k ({N(cof)}k {'+' if base >= 0 else '−'} {N(abs(base))}).", f"La igualo a 0: k = {N(k)}."],
              "Con un parámetro, el determinante es un polinomio en k; sus raíces son los valores que lo anulan.")


@generador("t5_det_propiedades")
def gen_det_propiedades(rng, d):
    if d == 3:
        A = _rand_mat(rng, 3, 3, -3, 4)
        i, j = rng.randrange(3), rng.randrange(3)
        while (i + j) % 2 == 0:
            i, j = rng.randrange(3), rng.randrange(3)
        cof, m = cofactor(A, i, j)
        if cof == 0:
            A[0][0] += 1
            cof, m = cofactor(A, i, j)
        return mk(f"Calcula el adjunto A{sub(i + 1)}{sub(j + 1)} de la matriz {mat(A)}", N(cof), "t5_det", [(N(m), "signo_adjunto"), (N(A[i][j] * cof), None), (N(cof + 1), None)],
                  [N(cof - 1)], [f"Tacho la fila {i + 1} y la columna {j + 1}: el menor vale {N(m)}.", f"Adjunto = (−1)^({i + 1}+{j + 1})·menor = {N(cof)}."],
                  "El adjunto lleva el signo (−1)^(i+j): tablero de ajedrez + − + / − + − / + − +.")
    n = rng.choice([2, 3, 4]) if d == 2 else rng.choice([2, 3])
    D0 = nz(rng, -6, 6)
    k = rng.choice([2, 3, -1, -2])
    op = rng.choice(["kA", "inv", "tras", "kinv", "AB", "fila", "cambio"]) if d == 2 else rng.choice(["kA", "tras", "fila", "cambio"])
    if op == "kA":
        enun, r, mal = f"|{N(k)}A|", F(k) ** n * D0, F(k) * D0
    elif op == "inv":
        enun, r, mal = "|A⁻¹|", F(1, D0), F(-D0)
    elif op == "tras":
        enun, r, mal = "|Aᵗ|", F(D0), F(-D0)
    elif op == "kinv":
        enun, r, mal = f"|{N(k)}A⁻¹|", F(k) ** n / D0, F(k) / D0
    elif op == "AB":
        E = nz(rng, -5, 5)
        enun, r, mal = f"|A·B| sabiendo que |B| = {N(E)}", F(D0 * E), F(D0 + E)
    elif op == "fila":
        enun, r, mal = f"el determinante de la matriz que resulta al multiplicar una fila de A por {k}", F(k * D0), F(k) ** n * D0
    else:
        enun, r, mal = "el determinante de la matriz que resulta al intercambiar dos filas de A", F(-D0), F(D0)
    return mk(f"A es una matriz cuadrada de orden {n} con |A| = {N(D0)}. Calcula {enun}.", N(r), "t5_det",
              [(N(mal) if mal != r else N(-r), "k_por_det" if op in ("kA", "kinv") else None), (N(-r) if -r != mal else N(r + 1), None), (N(r * 2), None)], [N(r + 1), N(r - 1)],
              [{"kA": f"Multiplicar A por {k} multiplica cada una de sus {n} filas por {k}: |{k}A| = {k}^{n}·|A|.", "inv": "|A·A⁻¹| = |I| = 1, así que |A⁻¹| = 1/|A|.",
                "tras": "|Aᵗ| = |A|.", "kinv": f"|{k}A⁻¹| = {k}^{n}·|A⁻¹| = {k}^{n}/|A|.", "AB": "|A·B| = |A|·|B|.", "fila": f"Multiplicar UNA fila por {k} multiplica el determinante por {k}.",
                "cambio": "Intercambiar dos filas cambia el signo del determinante."}[op], f"Resultado: {N(r)}."],
              "|kA| = kⁿ|A| (n = orden), no k|A|: el número multiplica todas las filas.")


@generador("t5_rango")
def gen_rango(rng, d):
    if d < 3:
        r = rng.choice([1, 2, 3]) if d == 2 else rng.choice([1, 2, 2])
        m, n = 3, rng.choice([3, 4]) if d == 2 else 3
        for _ in range(300):
            base = _rand_mat(rng, r, n, -3, 3)
            if rango(base) != r:
                continue
            M = [list(f) for f in base]
            while len(M) < m:
                cs = [rng.randint(-2, 2) for _ in range(r)]
                M.append([sum(c * base[i][j] for i, c in enumerate(cs)) for j in range(n)])
            rng.shuffle(M)
            if all(any(f) for f in M):
                break
        return mk(f"Calcula el rango de la matriz {mat(M)}", str(r), "t5_rango", [("3" if r != 3 else "2", "rango_filas"), ("0" if r != 1 else "2", "menor_nulo"), (str(r % 3 + 1) if r % 3 + 1 not in (3,) else "1", None)],
                  ["1", "2", "4"], ["Escalono por Gauss (o busco el mayor menor no nulo).", f"Quedan {r} filas no nulas: rg = {r}."],
                  "El rango es el número de filas (o columnas) linealmente independientes, no el número de filas.")
    for _ in range(300):
        a, b = rng.randint(1, 3), rng.randint(-3, 3)
        f1 = [1, a, b]
        k = nz(rng, -3, 3)
        k0 = rng.randint(-5, 5)
        f2 = [k * v for v in f1]
        pos = rng.randrange(3)
        valor = f2[pos]
        f3 = [rng.randint(-3, 3) for _ in range(3)]
        if rango([f1, f3]) == 2:
            break
    txt = [N(v) for v in f2]
    txt[pos] = "m"
    M = f"[{', '.join(N(v) for v in f1)}; {', '.join(txt)}; {', '.join(N(v) for v in f3)}]"
    resp = f"Si m = {N(valor)}, rango 2; si m ≠ {N(valor)}, rango 3"
    return mk(f"Estudia el rango de {M} según los valores de m.", resp, "t5_rango", [(f"Rango 3 para todo m", "rango_filas"), (f"Si m = {N(valor)}, rango 1; si m ≠ {N(valor)}, rango 3", "menor_nulo"),
                                                                                     (f"Si m = {N(-valor) if valor else 1}, rango 2; si m ≠ {N(-valor) if valor else 1}, rango 3", None)],
              [f"Si m = 0, rango 2; si m ≠ 0, rango 3"], [f"La fila 2 es proporcional a la 1 solo si m = {N(valor)}.", "Calculo el determinante (depende de m) y veo dónde se anula; en ese caso busco un menor 2×2 no nulo.", f"{resp}."],
              "Con parámetro se estudia dónde se anula el menor de mayor orden y, en esos valores, los menores de orden inferior.")


def _inv_ok(rng, n):
    for _ in range(500):
        A = _rand_mat(rng, n, n, -3, 4)
        dt = det2(A) if n == 2 else det3(A)
        if dt in (1, -1) or (n == 2 and dt in (2, -2, 3, -3) and rng.random() < 0.3):
            return A, dt


@generador("t5_inversa")
def gen_inversa(rng, d):
    n = 2 if d < 3 else 3
    A, dt = _inv_ok(rng, n)
    Ai = minv(A)
    dist = []
    if all(v != 0 for f in A for v in f):
        dist.append((mat([[F(1, v) for v in f] for f in A]), "elemento_a_elemento"))
    if n == 2:
        a, b, c, e = A[0][0], A[0][1], A[1][0], A[1][1]
        dist.append((mat([[F(e, dt), F(-c, dt)], [F(-b, dt), F(a, dt)]]), "olvida_trasponer"))
        dist.append((mat([[F(e, dt), F(c, dt)], [F(b, dt), F(a, dt)]]), "sin_signos"))
    else:
        dist.append((mat(mT(Ai)), "olvida_trasponer"))
    dist.append((mat(mscale(Ai, -1)), None))
    return mk(f"Calcula la inversa de A = {mat(A)}", mat(Ai), "t5_inversa", dist, [mat(mT(A))],
              [f"|A| = {N(dt)} ≠ 0: A es invertible.", "A⁻¹ = (1/|A|)·Adj(A)ᵗ: matriz de adjuntos (con sus signos), traspuesta y dividida entre el determinante.",
               f"A⁻¹ = {mat(Ai)}. Compruebo que A·A⁻¹ = I."],
              "La inversa no se hace elemento a elemento; en 2×2: [a, b; c, d]⁻¹ = (1/|A|)[d, −b; −c, a].")


@generador("t5_ec_matricial")
def gen_ec_matricial(rng, d):
    A, dt = _inv_ok(rng, 2)
    while dt not in (1, -1):
        A, dt = _inv_ok(rng, 2)
    B = _rand_mat(rng, 2, 2, -3, 4)
    Ai = minv(A)
    tipo = rng.choice(["AX=B", "XA=B"]) if d < 3 else rng.choice(["AX+C=B", "AX−X=B"])
    if tipo == "AX=B":
        X, mal, enun = mmul(Ai, B), mmul(B, Ai), "A·X = B"
    elif tipo == "XA=B":
        X, mal, enun = mmul(B, Ai), mmul(Ai, B), "X·A = B"
    elif tipo == "AX+C=B":
        C = _rand_mat(rng, 2, 2, -3, 3)
        X, mal, enun = mmul(Ai, madd(B, C, -1)), mmul(madd(B, C, -1), Ai), f"A·X + C = B, con C = {mat(C)}"
    else:
        AI = madd(A, [[1, 0], [0, 1]], -1)
        if det2(AI) == 0:
            AI = madd(A, [[1, 0], [0, 1]], 1)
            A = madd(AI, [[1, 0], [0, 1]], 1) if False else A
        if det2(AI) == 0:
            return None
        X = mmul(minv(AI), B)
        mal = mmul(minv(madd(A, [[1, 1], [1, 1]], -1)), B) if det2(madd(A, [[1, 1], [1, 1]], -1)) else mmul(B, minv(AI))
        enun = "A·X − X = B"
        return mk(f"Resuelve la ecuación matricial {enun}, con A = {mat(A)} y B = {mat(B)}", mat(X), "t5_ec_matricial",
                  [(mat(mal), "factor_sin_identidad"), (mat(mmul(B, minv(AI))), "lado_equivocado"), (mat([[F(b, a) if a else F(b) for a, b in zip(fa, fb)] for fa, fb in zip(AI, B)]) if all(a for f in AI for a in f) else None, "divide")],
                  [mat(mscale(X, -1))], ["Saco factor común X por la derecha: (A − I)·X = B (la identidad, no el número 1).", "Multiplico por (A − I)⁻¹ por la IZQUIERDA: X = (A − I)⁻¹·B.", f"X = {mat(X)}."],
                  "Las matrices no se dividen y el producto no es conmutativo: se multiplica por la inversa por el mismo lado en que está la matriz.")
    dist = [(mat(mal), "lado_equivocado"), (mat([[F(b, a) if a else F(b) for a, b in zip(fa, fb)] for fa, fb in zip(A, B)]) if all(a for f in A for a in f) else None, "divide"), (mat(mscale(X, -1)), None)]
    return mk(f"Resuelve la ecuación matricial {enun}, con A = {mat(A)} y B = {mat(B)}", mat(X), "t5_ec_matricial", dist, [mat(mT(X))],
              [f"A es invertible (|A| = {N(dt)}); A⁻¹ = {mat(Ai)}.",
               ("Multiplico por A⁻¹ por la IZQUIERDA: X = A⁻¹·B" if tipo == "AX=B" else "Multiplico por A⁻¹ por la DERECHA: X = B·A⁻¹" if tipo == "XA=B" else "Paso C restando y multiplico por A⁻¹ por la izquierda: X = A⁻¹·(B − C)") + ".",
               f"X = {mat(X)}."],
              "Las matrices no se dividen y el producto no es conmutativo: se multiplica por la inversa por el mismo lado en que está la matriz.")


@generador("t5_proglin")
def gen_proglin(rng, d):
    for _ in range(300):
        a, b = rng.randint(3, 10), rng.randint(3, 10)
        vx = [(0, 0), (a, 0), (rng.randint(1, a - 1), rng.randint(2, b)), (0, b)]
        if d > 1:
            vx = [(rng.randint(0, 2), rng.randint(0, 2)), (a, rng.randint(0, 2)), (rng.randint(2, a), rng.randint(3, b + 2)), (rng.randint(0, 2), b)]
        p, q = rng.randint(1, 6), rng.randint(1, 6)
        if d == 3 and rng.random() < 0.5:
            p = -p
        tipo = "máximo" if d < 3 or rng.random() < 0.5 else "mínimo"
        vals = [p * x + q * y for x, y in vx]
        best = max(vals) if tipo == "máximo" else min(vals)
        if vals.count(best) == 1 and len(set(vx)) == 4:
            break
    i = vals.index(best)
    far = max(range(4), key=lambda j: vx[j][0] + vx[j][1])
    txt = lambda j: f"{tipo.capitalize()} {N(vals[j])} en {pt(*vx[j])}"
    dist = [(txt(far) if far != i else None, "vertice_lejano"), (f"{tipo.capitalize()} {N(best)}", "solo_valor")]
    dist += [(txt(j), None) for j in range(4) if j != i]
    return mk(f"La región factible es el cuadrilátero de vértices {', '.join(pt(*v) for v in vx)}. Halla el {tipo} de F(x, y) = {terms([(p, 'x'), (q, 'y')])} y dónde se alcanza.",
              txt(i), "t5_proglin", dist, [],
              ["El óptimo de una función lineal en un polígono se alcanza en un vértice: evalúo F en cada uno.",
               "; ".join(f"F{pt(*v)} = {N(val)}" for v, val in zip(vx, vals)) + ".", f"{txt(i)}."],
              "Hay que evaluar la función objetivo en TODOS los vértices y dar el valor y el punto.")


@generador("t5_sistema_matricial")
def gen_sistema_matricial(rng, d):
    n = 2 if d < 3 else 3
    vs = ["x", "y", "z"][:n]
    for _ in range(100):
        A = _rand_mat(rng, n, n, -3, 4)
        if n == 3:
            A[rng.randrange(3)][rng.randrange(3)] = 0
        if (det2(A) if n == 2 else det3(A)) != 0:
            break
    s = [rng.randint(-3, 4) for _ in range(n)]
    b = [sum(A[i][j] * s[j] for j in range(n)) for i in range(n)]
    enun = "{" + "; ".join(f"{terms(list(zip(A[i], vs)))} = {N(b[i])}" for i in range(n)) + "}"
    Am = [A[i] + [b[i]] for i in range(n)]
    if d < 3 and rng.random() < 0.5:
        return mk(f"Escribe la matriz de coeficientes A del sistema {enun}", mat(A), "t5_sistlin", [(mat(Am), None), (mat(mT(A)), None), (mat([[abs(v) for v in f] for f in A]) if any(v < 0 for f in A for v in f) else mat(mscale(A, -1)), None)],
                  [mat([f[::-1] for f in A])], ["Cada fila son los coeficientes de una ecuación, en el orden x, y" + (", z" if n == 3 else "") + ".", f"A = {mat(A)}."], "La matriz de coeficientes no incluye los términos independientes.")
    comp = [[v for v in f if v != 0] + [0] * sum(1 for v in f if v == 0) for f in A]
    compa = [comp[i] + [b[i]] for i in range(n)]
    dist = [(mat(A), "ampliada_sin_terminos"), (mat(compa) if compa != Am else None, "coef_ausente"), (mat([f[:-1] + [-f[-1]] for f in Am]), None)]
    return mk(f"Escribe la matriz ampliada A* del sistema {enun}", mat(Am), "t5_sistlin", dist, [mat(mT(A))],
              ["La ampliada es la de coeficientes con una columna más: los términos independientes.", "Si falta una incógnita en una ecuación, su coeficiente es 0.", f"A* = {mat(Am)}."],
              "Escribir el sistema como A·X = B: A coeficientes (con ceros donde falte una incógnita), B términos independientes.")


@generador("t5_rouche")
def gen_rouche(rng, d):
    if d == 1:
        ne = rng.choice([2, 3, 4])
        n = rng.choice([2, 3, 4])
        rA = rng.randint(1, min(ne, n))
        rAs = rA + (1 if rng.random() < 0.35 and rA < ne else 0)
    else:
        caso = rng.choice(["SCD", "SCI", "SI"])
        for _ in range(300):
            A = [[rng.randint(-3, 3) for _ in range(3)] for _ in range(3)]
            s = [rng.randint(-2, 3) for _ in range(3)]
            if caso == "SCD":
                if det3(A) == 0:
                    continue
                b = [sum(A[i][j] * s[j] for j in range(3)) for i in range(3)]
            else:
                if rango(A[:2]) < 2:
                    continue
                p, q = rng.choice([1, -1, 2]), rng.choice([1, 2, -1])
                A[2] = [p * x + q * y for x, y in zip(A[0], A[1])]
                b = [sum(A[i][j] * s[j] for j in range(3)) for i in range(3)]
                if caso == "SI":
                    b[2] += nz(rng, -3, 3)
            if all(any(f) for f in A):
                break
        n = 3
        rA = rango(A)
        rAs = rango([A[i] + [b[i]] for i in range(3)])
    if rA != rAs:
        resp = "Incompatible"
    elif rA == n:
        resp = "Compatible determinado"
    else:
        resp = f"Compatible indeterminado ({n - rA} parámetro{'s' if n - rA > 1 else ''})"
    if d > 1:
        ne = 3
    dist = []
    if rA != rAs:
        dist.append((f"Compatible indeterminado ({max(1, n - rA)} parámetro{'s' if n - rA > 1 else ''})", "distintos_sci"))
    if rA == rAs and rA == ne and n > ne:
        dist.append(("Compatible determinado", "compara_ecuaciones"))
    if rA == rAs and rA < n:
        dist.append(("Compatible determinado", "compara_ecuaciones" if rA == ne else None))
    for t in ["Incompatible", "Compatible determinado", "Compatible indeterminado (1 parámetro)", "Compatible indeterminado (2 parámetros)"]:
        if t != resp:
            dist.append((t, None))
    if d == 1:
        enun = f"Un sistema de {ne} ecuaciones con {n} incógnitas tiene rg(A) = {rA} y rg(A*) = {rAs}. ¿Qué tipo de sistema es?"
    else:
        enun = "Discute el sistema: {" + "; ".join(_eq3(A[i], b[i]) for i in range(3)) + "}"
    return mk(enun, resp, "t5_rouche", dist, [],
              [f"rg(A) = {rA}, rg(A*) = {rAs}, número de incógnitas n = {n}.",
               "Rouché-Fröbenius: rangos distintos → incompatible; iguales a n → compatible determinado; iguales y menores que n → indeterminado con n − rg parámetros.", f"{resp}."],
              "El rango se compara con el número de INCÓGNITAS, no con el de ecuaciones.")


FAM_PARAM = [
    ([[1, 1, 1], [1, "a", 1], [1, 1, "a"]], [1, 1, "a"]),
    ([["a", 1, 1], [1, "a", 1], [1, 1, "a"]], [1, 1, 1]),
    ([[1, 1, 1], [1, 2, "a"], [2, 3, 3]], [1, 2, "a"]),
    ([[1, 2, 1], [2, "a", 2], [1, 1, 1]], [3, 6, 2]),
    ([[1, 1, "a"], [1, "a", 1], ["a", 1, 1]], [1, 1, 1]),
    ([[1, -1, 1], [2, 1, "a"], [1, 2, 1]], [1, 3, "a"]),
    ([["a", 1, 0], [1, "a", 1], [0, 1, "a"]], [1, 1, 1]),
    ([[1, 1, 1], [2, "a", 2], [3, 3, "a"]], [1, 2, 3]),
    ([[1, 2, "a"], [1, "a", 2], [2, 4, 4]], [1, 1, 2]),
]


def _sust(M, a):
    return [[F(a) if v == "a" else F(v) for v in f] for f in M]


@generador("t5_discusion_param")
def gen_discusion_param(rng, d):
    for _ in range(100):
        Mt, bt = rng.choice(FAM_PARAM)
        if rng.random() < 0.5:
            # permuta variables para variar
            perm = rng.sample(range(3), 3)
            Mt = [[f[p] for p in perm] for f in Mt]
        vals = {a: det3(_sust(Mt, a)) for a in range(-6, 7)}
        crit = [a for a, v in vals.items() if v == 0]
        if crit:
            break
    txt = lambda f: terms([(v if v != "a" else 1, (("a" if v == "a" else "") + x)) for v, x in zip(f, "xyz")]).replace("1a", "a")
    def eq(f, bb):
        parts = []
        for v, x in zip(f, "xyz"):
            if v == "a":
                parts.append((1, "a" + x))
            else:
                parts.append((v, x))
        rhs = "a" if bb == "a" else N(bb)
        return f"{terms(parts)} = {rhs}"
    enun_s = "{" + "; ".join(eq(f, bb) for f, bb in zip(Mt, bt)) + "}"
    def clasif(a):
        A = _sust(Mt, a)
        b = [F(a) if v == "a" else F(v) for v in bt]
        rA, rAs = rango(A), rango([A[i] + [b[i]] for i in range(3)])
        return "Incompatible" if rA != rAs else ("Compatible determinado" if rA == 3 else f"Compatible indeterminado")
    if d < 3:
        a0 = rng.choice(crit)
        resp = clasif(a0)
        otros = [t for t in ["Incompatible", "Compatible determinado", "Compatible indeterminado"] if t != resp]
        return mk(f"Para a = {N(a0)}, ¿qué tipo de sistema es {enun_s}?", resp, "t5_discusion", [("Compatible determinado", "se_queda_det") if resp != "Compatible determinado" else (otros[0], None)] + [(t, None) for t in otros] + [("No se puede saber", None)], [],
                  [f"Para a = {N(a0)} el determinante de A se anula: no es compatible determinado.", "Sustituyo a en el sistema y comparo rg(A) con rg(A*).", f"{resp}."],
                  "En los valores críticos (|A| = 0) hay que sustituir el parámetro y estudiar los rangos.")
    crit_s = sorted(crit)
    resp = " y ".join(f"a ≠ {N(c)}" for c in crit_s)
    return mk(f"¿Para qué valores de a es compatible determinado el sistema {enun_s}?", resp, "t5_discusion",
              [(" y ".join(f"a = {N(c)}" for c in crit_s), None), (" y ".join(f"a ≠ {N(-c)}" for c in crit_s) if any(crit_s) else "a ≠ 1", None), ("Para todo a", "se_queda_det"),
               ((" y ".join(f"a ≠ {N(c)}" for c in crit_s[:1])) if len(crit_s) > 1 else None, None)],
              [], [f"Compatible determinado ⇔ |A| ≠ 0.", f"|A| se anula para {', '.join('a = ' + N(c) for c in crit_s)}.", f"Es compatible determinado si {resp}."],
              "Los valores críticos son las raíces de |A|; fuera de ellos el sistema es compatible determinado.")


@generador("t5_cramer")
def gen_cramer(rng, d):
    n = 2 if d < 3 else 3
    for _ in range(300):
        A = _rand_mat(rng, n, n, -4, 5)
        dA = det2(A) if n == 2 else det3(A)
        if dA:
            break
    s = [F(rng.randint(-4, 5)) for _ in range(n)]
    if d == 2 and rng.random() < 0.5:
        s[0] = s[0] + F(1, dA) if abs(dA) > 1 else s[0]
    b = [sum(A[i][j] * s[j] for j in range(n)) for i in range(n)]
    if any(v.denominator != 1 for v in b):
        s = [F(rng.randint(-4, 5)) for _ in range(n)]
        b = [sum(A[i][j] * s[j] for j in range(n)) for i in range(n)]
    vs = ["x", "y", "z"][:n]
    k = rng.randrange(n)
    def Dk(col):
        M = [[(b[i] if j == col else A[i][j]) for j in range(n)] for i in range(n)]
        return det2(M) if n == 2 else det3(M)
    val = F(Dk(k), dA)
    otro = (k + 1) % n
    enun = f"Resuelve por Cramer y da el valor de {vs[k]}: {{" + "; ".join(f"{terms(list(zip(A[i], vs)))} = {N(b[i])}" for i in range(n)) + "}"
    return mk(enun, f"{vs[k]} = {N(val)}", "t5_cramer", [(f"{vs[k]} = {N(F(Dk(otro), dA))}" if F(Dk(otro), dA) != val else None, "columna_equivocada"), (f"{vs[k]} = {N(-val)}", None),
                                                         (f"{vs[k]} = {N(F(dA, Dk(k)))}" if Dk(k) else f"{vs[k]} = 1", None)],
              [f"{vs[k]} = {N(val + 1)}", f"{vs[k]} = {N(val - 1)}"],
              [f"|A| = {N(dA)} ≠ 0: se puede aplicar Cramer.", f"Sustituyo la columna de {vs[k]} por la de términos independientes: |A_{vs[k]}| = {N(Dk(k))}.",
               f"{vs[k]} = |A_{vs[k]}|/|A| = {N(val)}."],
              "Para cada incógnita se sustituye SU columna; solo se puede usar si |A| ≠ 0.")


@generador("t5_homogeneo")
def gen_homogeneo(rng, d):
    for _ in range(300):
        A = _rand_mat(rng, 3, 3, -3, 3)
        i, j = rng.randrange(3), rng.randrange(3)
        cof, _m = cofactor(A, i, j)
        if cof == 0:
            continue
        A0 = [list(f) for f in A]
        A0[i][j] = 0
        k0 = F(-det3(A0), cof)
        if k0.denominator == 1 and abs(k0) <= 8 and all(any(f) for f in A):
            break
    k0 = int(k0)
    def eq(r):
        parts = []
        for c, x in enumerate("xyz"):
            if (r, c) == (i, j):
                parts.append((1, "k" + x))
            else:
                parts.append((A[r][c], x))
        return f"{terms(parts)} = 0"
    enun_s = "{" + "; ".join(eq(r) for r in range(3)) + "}"
    if d < 3:
        return mk(f"¿Para qué valor de k tiene soluciones distintas de la trivial el sistema {enun_s}?", f"k = {N(k0)}", "t5_homogeneo",
                  [(f"k ≠ {N(k0)}", "det_no_nulo"), ("Para ningún valor: un sistema homogéneo puede ser incompatible", "homogeneo_incompatible"), (f"k = {N(-k0) if k0 else 1}", None)],
                  [f"k = {N(k0 + 1)}"], ["Un sistema homogéneo siempre tiene la solución trivial (0, 0, 0).", f"Tiene otras soluciones si |A| = 0: {N(cof)}k {'+' if det3(A0) >= 0 else '−'} {N(abs(det3(A0)))} = 0 → k = {N(k0)}."],
                  "Homogéneo: siempre compatible; tiene soluciones no triviales exactamente cuando |A| = 0.")
    kk = k0 + rng.choice([1, 2, -1])
    return mk(f"Para k = {N(kk)}, ¿cuántas soluciones tiene el sistema {enun_s}?", "Solo la solución trivial (0, 0, 0)", "t5_homogeneo",
              [("No tiene solución", "homogeneo_incompatible"), ("Infinitas soluciones", "det_no_nulo"), ("Dos soluciones", None)], [],
              [f"|A| se anula solo para k = {N(k0)}; con k = {N(kk)}, |A| ≠ 0.", "Rango 3 = nº de incógnitas: compatible determinado, solo la solución (0, 0, 0)."],
              "Homogéneo: siempre compatible; si |A| ≠ 0 la única solución es la trivial.")


# ================================================================ FUN.CONC

CONTEXTOS_VAR = [("el precio que pagas", "los kilos de fruta que compras"), ("la distancia recorrida", "el tiempo que llevas andando"),
                 ("el área de un cuadrado", "la longitud de su lado"), ("la factura del agua", "los litros consumidos"),
                 ("la altura de una planta", "los días transcurridos"), ("el coste de un taxi", "los kilómetros recorridos"),
                 ("la temperatura del horno", "los minutos que lleva encendido"), ("el dinero ahorrado", "las semanas que pasan"),
                 ("el perímetro de un triángulo equilátero", "la longitud de su lado"), ("el peso de una caja de libros", "el número de libros"),
                 ("lo que cobra un fontanero", "las horas que trabaja"), ("la cantidad de gasolina del depósito", "los kilómetros recorridos")]


@generador("t5_concepto_funcion")
def gen_concepto_funcion(rng, d):
    if d == 1 or (d == 2 and rng.random() < 0.3):
        dep, ind = rng.choice(CONTEXTOS_VAR)
        orden = rng.random() < 0.5
        a, b = (dep, ind) if orden else (ind, dep)
        return mk(f"Relacionamos {a} con {b}. ¿Cuál es la variable independiente?", ind[0].upper() + ind[1:], "t5_concepto_funcion",
                  [(dep[0].upper() + dep[1:], "variables_al_reves"), ("Las dos son independientes", None), ("Ninguna: no es una función", None)], [],
                  [f"La variable independiente es la que elegimos libremente; la dependiente se calcula a partir de ella.", f"{dep[0].upper() + dep[1:]} depende de {ind}: la independiente es {ind}."],
                  "La dependiente 'depende de' la independiente: el precio depende de los kilos, no al revés.")
    for _ in range(100):
        xs = rng.sample(range(-3, 8), 5)
        ys = [rng.randint(-5, 9) for _ in xs]
        caso = rng.choice(["func_rep", "no_func", "func"])
        if caso == "func_rep":
            i, j = rng.sample(range(5), 2)
            ys[j] = ys[i]
        elif caso == "no_func":
            i, j = rng.sample(range(5), 2)
            xs[j] = xs[i]
            if ys[j] == ys[i]:
                ys[j] += 1
        if len(set(zip(xs, ys))) == 5:
            break
    pares = ", ".join(pt(x, y) for x, y in zip(xs, ys))
    from collections import Counter
    cx, cy = Counter(xs), Counter(ys)
    rx = [x for x, c in cx.items() if c > 1]
    ry = [y for y, c in cy.items() if c > 1]
    SI = "Sí: a cada x le corresponde un único valor de y"
    if rx:
        resp = f"No: x = {N(rx[0])} tiene dos valores de y"
        dist = [(SI, None), (f"No: y = {N(ry[0])} corresponde a dos valores de x" if ry else "No: hay valores de y negativos", "y_repetida" if ry else None),
                ("Sí: cada valor de y aparece una sola vez", None)]
    else:
        resp = SI
        dist = [(f"No: y = {N(ry[0])} corresponde a dos valores de x" if ry else None, "y_repetida"), (f"No: x = {N(xs[0])} tiene dos valores de y", None),
                ("No: los valores de x no están ordenados", None)]
    return mk(f"La relación viene dada por los pares (x, y): {pares}. ¿Es una función de x?", resp, "t5_concepto_funcion", dist, ["No: hay valores negativos"],
              ["Es función si cada valor de x tiene UNA sola imagen y.", "Busco si algún x se repite con valores de y distintos." + (" Sí: x = " + N(rx[0]) + "." if rx else " No ocurre."),
               "Que dos x distintas tengan la misma y no impide que sea función."],
              "Función: a cada x, un único y. Que se repitan valores de y está permitido.")


@generador("t5_formula_tabla")
def gen_formula_tabla(rng, d):
    tipo = rng.choice(["lin", "cuad"]) if d < 3 else rng.choice(["cuad", "inv"])
    if tipo == "lin":
        m, n = nz(rng, -4, 5), rng.randint(-6, 6)
        f, ftxt = (lambda x: m * x + n), f"y = {P({1: m, 0: n})}"
    elif tipo == "cuad":
        a, c = rng.choice([1, 1, 2, -1]), rng.randint(-5, 6)
        f, ftxt = (lambda x: a * x * x + c), f"y = {P({2: a, 0: c})}"
    else:
        k = rng.choice([6, 12, 24, -6, -12, 8])
        f, ftxt = (lambda x: F(k, x)), f"y = {N(k)}/x"
    if d == 1:
        x0 = rng.choice([v for v in range(-4, 5) if v != 0 and (tipo != "inv" or k % v == 0)])
        y0 = f(x0)
        mal = (a * -(x0 * x0) + c) if tipo == "cuad" and x0 < 0 else (y0 + 1 if tipo != "lin" else m * -x0 + n)
        return mk(f"Completa la tabla de {ftxt}: si x = {N(x0)}, ¿cuánto vale y?", N(y0), "t5_formula_tabla",
                  [(N(mal) if mal != y0 else N(y0 + 2), "cuadrado_negativo" if tipo == "cuad" and x0 < 0 else None), (N(x0), None), (N(-y0) if y0 else "1", None)],
                  [N(y0 + 1), N(y0 - 1)], [f"Sustituyo x = {N(x0)} (entre paréntesis) en la fórmula: y = {N(y0)}."], "Con negativos, (−2)² = 4.")
    for _ in range(100):
        x0 = rng.choice([v for v in range(-5, 6) if v != 0 and (tipo != "inv" or k % v == 0)])
        y0 = f(x0)
        if y0 != x0 and y0.__class__ is not None:
            break
    good = pt(x0, y0)
    swapped = pt(y0, x0) if F(y0) != F(x0) else None
    dist = [(swapped, "coordenadas_cambiadas")]
    if tipo == "cuad" and x0 < 0:
        dist.append((pt(x0, a * -(x0 * x0) + c), "cuadrado_negativo"))
    dist += [(pt(x0, f(x0) + 1), None), (pt(-x0, f(x0) + 2), None), (pt(x0 + 1, f(x0) - 1), None)]
    return mk(f"¿Cuál de estos puntos pertenece a la gráfica de {ftxt}?", good, "t5_formula_tabla", dist, [pt(0, 99)],
              ["Un punto (a, b) está en la gráfica si al sustituir x = a sale y = b.", f"Para x = {N(x0)} sale y = {N(y0)}: el punto {good} pertenece."],
              "El primer número del punto es la x. Hay que sustituir, no adivinar.")


@generador("t5_cortes_ejes")
def gen_cortes_ejes(rng, d):
    tipo = rng.choice(["lin", "cuad"]) if d == 1 else rng.choice(["cuad", "cuad", "inv"]) if d == 2 else rng.choice(["cuad", "lin"])
    eje = rng.choice(["X", "Y"]) if d < 3 else "X"
    if tipo == "lin":
        x0 = F(rng.randint(-6, 6)) if d < 3 else F(rng.randint(-7, 7), rng.choice([2, 3]))
        m = nz(rng, -4, 4) * (x0.denominator)
        n = -m * x0
        ftxt = f"y = {P({1: m, 0: n})}"
        cx = [x0]
        cy = n
    elif tipo == "cuad":
        r1, r2 = rng.sample(range(-6, 7), 2)
        k = rng.choice([1, 1, -1, 2]) if d > 1 else 1
        p = proots([r1, r2], k)
        ftxt = f"y = {P(p)}"
        cx = sorted([r1, r2])
        cy = p.get(0, 0)
    else:
        kk = rng.choice([4, 6, -8, 12, -3, 5])
        ftxt = f"y = {N(kk)}/x"
        cx, cy = [], None
    lista = lambda xs: " y ".join(pt(x, 0) for x in sorted(xs))
    if tipo == "inv":
        resp = "No corta a los ejes"
        return mk(f"¿En qué puntos corta la gráfica de {ftxt} a los ejes?", resp, "t5_cortes", [(pt(0, kk), "ejes_al_reves"), (pt(kk, 0), None), ("(0, 0)", None)], [pt(1, kk)],
                  ["Para x = 0 la fórmula no está definida (no se divide entre 0), y y = 0 es imposible porque el numerador no es 0.", "No corta a ningún eje (los ejes son sus asíntotas)."],
                  "La proporcionalidad inversa y = k/x nunca corta los ejes.")
    if eje == "Y":
        resp = pt(0, cy)
        dist = [(lista(cx) if cx else None, "ejes_al_reves"), (N(cy), "solo_coordenada"), (pt(cy, 0), None)]
        pasos = [f"Corte con el eje Y: hago x = 0 → y = {N(cy)}.", f"Punto {resp}."]
    else:
        resp = lista(cx)
        dist = [(pt(0, cy), "ejes_al_reves"), (" y ".join(N(x) for x in sorted(cx)), "solo_coordenada"), (" y ".join(pt(0, x) for x in sorted(cx)), None)]
        pasos = ["Corte con el eje X: hago y = 0 y resuelvo la ecuación.", f"x = {', '.join(N(x) for x in sorted(cx))}: puntos {resp}."]
    return mk(f"Calcula los puntos de corte de {ftxt} con el eje {eje}.", resp, "t5_cortes", dist, [lista([x + 1 for x in cx]) if cx else pt(0, 1)], pasos,
              "Eje X: y = 0. Eje Y: x = 0. La respuesta es un punto (con dos coordenadas).")


@generador("t5_tvm")
def gen_tvm(rng, d):
    co = {2: rng.choice([1, -1, 2]), 1: rng.randint(-4, 4), 0: rng.randint(-5, 5)} if d > 1 else {1: nz(rng, -5, 5), 0: rng.randint(-5, 5)}
    if d == 3:
        co = {3: rng.choice([1, -1]), 1: rng.randint(-3, 3), 0: rng.randint(-3, 3)}
    a = rng.randint(-3, 3)
    b = a + rng.randint(1, 4)
    fa, fb = pev(co, a), pev(co, b)
    r = (fb - fa) / (b - a)
    return mk(f"Calcula la tasa de variación media de f(x) = {P(co)} en el intervalo [{N(a)}, {N(b)}].", N(r), "t5_tvm",
              [(N(fb - fa), "no_divide" if b - a != 1 else None), (N(-r), "resta_al_reves"), (N((fb + fa) / (b - a)), None)], [N(r + 1), N(r - 1), N(r * 2)],
              [f"f({N(b)}) = {N(fb)} y f({N(a)}) = {N(fa)}.", f"TVM = (f(b) − f(a))/(b − a) = ({N(fb)} − ({N(fa)}))/{N(b - a)} = {N(r)}."],
              "La TVM es un cociente: variación de la función entre variación de x, en el mismo orden.")


# ================================================================ FUN.CUADR

def _dec_a(a):
    a = F(a)
    return N(a) if a.denominator == 1 else D(a, 3)


@generador("t5_parabola_forma")
def gen_parabola_forma(rng, d):
    vals = [F(1, 10), F(1, 5), F(1, 4), F(1, 2), F(3, 4), F(3, 2), F(2), F(5, 2), F(3), F(4), F(5)]
    for _ in range(100):
        a = rng.choice(vals) * rng.choice([1, -1])
        ref = F(1) if d == 1 else rng.choice(vals)
        if abs(a) != ref:
            break
    arriba = a > 0
    abierta = abs(a) < ref
    T = lambda up, op: f"Hacia {'arriba' if up else 'abajo'} y más {'abierta' if op else 'cerrada'}"
    reft = "y = x²" if ref == 1 else f"y = {_dec_a(ref)}x²"
    return mk(f"Compara la parábola y = {_dec_a(a)}x² con {reft}: ¿hacia dónde se abre y cómo es?", T(arriba, abierta), "t5_parabola",
              [(T(arriba, not abierta), "abs_grande_abierta"), (T(not arriba, abierta), "signo_ignorado"), (T(not arriba, not abierta), None)], [],
              [f"a = {_dec_a(a)} es {'positivo' if arriba else 'negativo'}: se abre hacia {'arriba' if arriba else 'abajo'}.",
               f"|a| = {_dec_a(abs(a))} es {'menor' if abierta else 'mayor'} que {_dec_a(ref)}: la parábola es más {'abierta' if abierta else 'cerrada'}."],
              "En y = ax², el signo de a decide hacia dónde se abre y |a| grande la estrecha (más cerrada).")


@generador("t5_parabola_vertice")
def gen_parabola_vertice(rng, d):
    for _ in range(200):
        a = rng.choice([1, 1, -1, 2, -2]) if d > 1 else 1
        h = rng.randint(-5, 5)
        k = rng.randint(-8, 8)
        b, c = -2 * a * h, a * h * h + k
        if b != 0:
            break
    p = {2: a, 1: b, 0: c}
    if d < 3:
        return mk(f"Calcula el vértice de la parábola y = {P(p)}", f"V{pt(h, k)}", "t5_vertice",
                  [(f"V{pt(-h, pev(p, -h))}", "signo_vertice"), (f"V{pt(h, 0)}", "y_vertice"), (f"V{pt(k, h)}", None)], [f"V{pt(h, k + 1)}"],
                  [f"x_v = −b/(2a) = {N(-b)}/{N(2 * a)} = {N(h)}.", f"y_v = f({N(h)}) = {N(k)}. Vértice V{pt(h, k)}."],
                  "x_v = −b/2a (con el signo menos) y la y del vértice se obtiene sustituyendo en la función.")
    rs = _cuad(a, b, c)
    if not rs:
        return mk(f"¿Cuál es el eje de simetría de la parábola y = {P(p)}?", f"x = {N(h)}", "t5_vertice", [(f"x = {N(-h)}", "signo_vertice"), (f"y = {N(k)}", None), (f"x = {N(k)}", None)],
                  [f"x = {N(h + 1)}"], [f"El eje es la recta vertical que pasa por el vértice: x = −b/(2a) = {N(h)}."], "El eje de simetría es x = x_v.")
    return mk(f"Calcula los cortes con el eje X de la parábola y = {P(p)}", " y ".join(pt(r, 0) for r in rs), "t5_vertice",
              [(" y ".join(pt(-r, 0) for r in sorted(-x for x in rs)), None), (pt(0, c), None), (f"V{pt(h, k)}", None)], [" y ".join(pt(r + 1, 0) for r in rs)],
              ["Hago y = 0 y resuelvo la ecuación de segundo grado.", f"Cortes: {' y '.join(pt(r, 0) for r in rs)} (simétricos respecto de x = {N(h)})."],
              "Los cortes con el eje X son simétricos respecto del eje de la parábola.")


def _canonica(a, h, k):
    a, h, k = F(a), F(h), F(k)
    pre = "" if a == 1 else ("−" if a == -1 else N(a))
    base = "x²" if h == 0 else f"({P({1: 1, 0: -h})})²"
    s = f"y = {pre}{base}"
    if k:
        s += f" {'+' if k > 0 else '−'} {N(abs(k))}"
    return s


@generador("t5_parabola_trasladada")
def gen_parabola_trasladada(rng, d):
    a = rng.choice([1, 2, -1, 3, -2, F(1, 2)])
    h, k = nz(rng, -6, 6), rng.randint(-7, 7)
    if d < 3:
        f = _canonica(a, h, k)
        return mk(f"¿Cuál es el vértice de la parábola {f}?", f"V{pt(h, k)}", "t5_trasladada", [(f"V{pt(-h, k)}", "signo_h"), (f"V{pt(h, -k)}" if k else f"V{pt(-h, 1)}", "vertical_al_reves"), (f"V{pt(-h, -k)}", None)],
                  [f"V{pt(k, h)}"], [f"y = a(x − h)² + k tiene vértice (h, k).", f"Aquí (x − ({N(h)}))²: h = {N(h)}; k = {N(k)}. V{pt(h, k)}."],
                  "(x + 3)² corresponde a h = −3: la gráfica se traslada a la izquierda.")
    a = rng.choice([1, 2, -1, 3])
    p = {2: a, 1: -2 * a * h, 0: a * h * h + k}
    return mk(f"Escribe en la forma y = a(x − h)² + k la parábola y = {P(p)}", _canonica(a, h, k), "t5_trasladada",
              [(_canonica(a, -h, k), "signo_h"), (_canonica(a, h, -k), "vertical_al_reves"), (_canonica(1, h, k) if a != 1 else _canonica(2, h, k), None)], [_canonica(a, h, k + 1)],
              [f"Vértice: x_v = −b/(2a) = {N(h)}, y_v = f({N(h)}) = {N(k)}.", f"La forma canónica es {_canonica(a, h, k)} (a no cambia)."],
              "Completar cuadrados o usar el vértice: y = a(x − x_v)² + y_v.")


# ================================================================ FUN.ELEM

@generador("t5_prop_inversa")
def gen_prop_inversa(rng, d):
    k = rng.choice([6, 8, 10, 12, 18, 20, 24, 30, 36, -6, -12, -24])
    tarea = "tabla" if d == 1 else rng.choice(["valor", "cuadrantes"]) if d == 2 else rng.choice(["cuadrantes", "cortes", "tabla"])
    if tarea == "tabla":
        xs = sorted(rng.sample([x for x in range(1, 13) if k % x == 0], 3))
        pares = ", ".join(pt(x, F(k, x)) for x in xs)
        lin_n = F(k, xs[0]) + xs[0]
        return mk(f"¿Qué fórmula corresponde a la tabla de pares {pares}?", f"y = {N(k)}/x", "t5_prop_inversa",
                  [(f"y = {P({1: -1, 0: lin_n})}", "lineal_decreciente"), (f"y = {N(F(k, xs[0] * xs[0]))}x" if False else f"y = {N(k)}x", None), (f"y = x/{N(k)}" if k > 0 else f"y = {N(-k)}/x", None)],
                  [f"y = {N(k + 1)}/x"], ["Multiplico x·y en cada par: siempre sale " + N(k) + ".", f"Producto constante → proporcionalidad inversa: y = {N(k)}/x."],
                  "En la proporcionalidad inversa el PRODUCTO x·y es constante; no basta con que y disminuya.")
    if tarea == "valor":
        x0 = rng.choice([x for x in range(-12, 13) if x and k % x == 0])
        return mk(f"Si y = {N(k)}/x, ¿cuánto vale y para x = {N(x0)}?", N(F(k, x0)), "t5_prop_inversa", [(N(k * x0), None), (N(k - x0), "lineal_decreciente"), (N(-F(k, x0)), None)],
                  [N(F(k, x0) + 1)], [f"y = {N(k)}/({N(x0)}) = {N(F(k, x0))}."], "y = k/x: se divide k entre x.")
    if tarea == "cuadrantes":
        resp = "En el 1.º y el 3.º" if k > 0 else "En el 2.º y el 4.º"
        return mk(f"¿En qué cuadrantes está la gráfica de y = {N(k)}/x?", resp, "t5_prop_inversa", [("En el 2.º y el 4.º" if k > 0 else "En el 1.º y el 3.º", None), ("En los cuatro cuadrantes", "corta_ejes"), ("Solo en el 1.º", None)], [],
                  [f"k = {N(k)} es {'positivo' if k > 0 else 'negativo'}: x e y tienen {'el mismo signo' if k > 0 else 'signos contrarios'}.", f"{resp}."],
                  "Si k > 0, la hipérbola está en los cuadrantes 1.º y 3.º; si k < 0, en el 2.º y el 4.º.")
    return mk(f"¿En qué punto corta la gráfica de y = {N(k)}/x al eje X?", "No corta al eje X", "t5_prop_inversa", [(pt(k, 0), "corta_ejes"), (pt(0, k), "corta_ejes"), ("(0, 0)", None)], [],
              ["Para cortar al eje X haría falta y = 0, pero k/x nunca vale 0.", "No corta al eje X (es una asíntota)."], "Los ejes son asíntotas de y = k/x.")


@generador("t5_trozos")
def gen_trozos(rng, d):
    for _ in range(100):
        c1 = rng.randint(-2, 3)
        f1 = {2: 1, 0: rng.randint(-3, 3)} if rng.random() < 0.5 else {1: nz(rng, -3, 3), 0: rng.randint(-4, 4)}
        f2 = {1: nz(rng, -3, 3), 0: rng.randint(-4, 5)}
        f3 = {0: rng.randint(-5, 5)} if d == 3 else None
        c2 = c1 + rng.randint(2, 4)
        izq_cerr = rng.random() < 0.5
        if pev(f1, c1) != pev(f2, c1):
            break
    s1, s2 = ("≤", ">") if izq_cerr else ("<", "≥")
    trozos = f"{P(f1)} si x {s1} {N(c1)}; {P(f2)} si x {s2} {N(c1)}"
    if d == 3:
        trozos = f"{P(f1)} si x {s1} {N(c1)}; {P(f2)} si {N(c1)} {'<' if izq_cerr else '≤'} x ≤ {N(c2)}; {P(f3)} si {N(c2)} < x"
    x0 = c1 if d > 1 else rng.choice([c1 - 2, c1 + 1, c1 - 1, c1 + 2])
    if d == 3 and rng.random() < 0.5:
        x0 = c2
    def f(x):
        if (x < c1) or (x == c1 and izq_cerr):
            return pev(f1, x)
        if d < 3 or x <= c2:
            return pev(f2, x)
        return pev(f3, x)
    r = f(x0)
    otro = pev(f2, x0) if r == pev(f1, x0) else pev(f1, x0)
    tot = pev(f1, x0) + pev(f2, x0) + (pev(f3, x0) if f3 else 0)
    enun = f"f(x) = {{{trozos}}}. Calcula f({N(x0)})."
    return mk(enun, N(r), "t5_trozos", [(N(otro) if otro != r else None, "tramo_extremo" if x0 in (c1, c2) else None), (N(tot) if tot != r else None, "todas_formulas"), (N(-r) if r else "1", None)],
              [N(r + 1), N(r - 1), N(r + 2)], [f"Busco en qué tramo está x = {N(x0)} (mirando si el extremo va con ≤ o con <).", f"Uso solo esa fórmula: f({N(x0)}) = {N(r)}."],
              "Cada x usa UNA fórmula; en los puntos de cambio decide el signo = de la condición.")


@generador("t5_exponencial")
def gen_exponencial(rng, d):
    a = rng.choice([1, 2, 3, 4, 5])
    b = rng.choice([F(2), F(3), F(1, 2), F(1, 3), F(5), F(1, 4), F(10)])
    btxt = N(b) if b.denominator == 1 else f"({N(b)})"
    f = f"y = {'' if a == 1 else str(a) + '·'}{btxt}^x"
    if d == 1 or (d == 2 and rng.random() < 0.5):
        crece = b > 1
        T = lambda c, p: f"{'Creciente' if c else 'Decreciente'}; corta al eje Y en {p}"
        return mk(f"¿Cómo es la función {f}?", T(crece, pt(0, a)), "t5_exponencial",
                  [(T(crece, "(0, 0)"), "pasa_origen"), (T(not crece, pt(0, a)), None), (T(crece, pt(0, 1)) if a != 1 else T(crece, pt(1, 0)), None)], [],
                  [f"La base {N(b)} es {'mayor' if crece else 'menor'} que 1: {'creciente' if crece else 'decreciente'}.", f"Para x = 0, b⁰ = 1, así que y = {a}: corta en {pt(0, a)}."],
                  "y = a·bˣ pasa por (0, a), nunca por el origen, y tiene asíntota horizontal y = 0.")
    x0 = rng.randint(1, 4) if d == 2 else rng.randint(-3, 3)
    v = a * b ** x0
    return mk(f"Si {f}, ¿cuánto vale y para x = {N(x0)}?", N(v), "t5_exponencial", [(N(a * F(x0) ** b) if b.denominator == 1 and x0 > 0 else N(a * x0 * x0), "potencia"), (N((a * b) ** x0), None), (N(a * b * x0), None)],
              [N(v + 1), N(v * 2)], [f"y = {a}·{N(b)}^{N(x0)} = {a}·{N(b ** x0)} = {N(v)}."], "En bˣ la variable está en el exponente; no es lo mismo 2ˣ que x².")


@generador("t5_logaritmica")
def gen_logaritmica(rng, d):
    b = rng.choice([2, 3, 10, 5, F(1, 2), F(1, 3)])
    lb = f"log{sub(b)}" if F(b).denominator == 1 and b != 10 else ("log" if b == 10 else f"log_{N(b)}")
    tarea = rng.choice(["valor", "corte"]) if d == 1 else rng.choice(["dominio", "monotonia"]) if d == 2 else "dominio"
    if tarea == "valor":
        bb = rng.choice([2, 3, 10])
        e = rng.randint(-2, 4)
        x = F(bb) ** e
        lb2 = "log" if bb == 10 else f"log{sub(bb)}"
        return mk(f"Calcula {lb2} {N(x)}", N(e), "t5_logaritmica", [(N(F(x, bb)) if F(x, bb) != e else N(e + 1), None), (N(-e) if e else "1", None), (N(x * bb), None)], [N(e + 1), N(e - 1)],
                  [f"{lb2} {N(x)} es el exponente al que hay que elevar {bb} para obtener {N(x)}: {bb}^{N(e)} = {N(x)}.", f"Vale {N(e)}."],
                  "log_b x = y ⇔ bʸ = x.")
    if tarea == "corte":
        return mk(f"¿En qué punto corta la gráfica de y = {lb} x al eje X?", "(1, 0)", "t5_logaritmica", [("(0, 1)", "corte_01"), ("(0, 0)", None), (pt(b, 0), None)], [],
                  [f"y = 0 ⇔ x = {N(b)}⁰ = 1.", "Corta en (1, 0)."], "Toda función logarítmica pasa por (1, 0); la exponencial pasa por (0, 1).")
    if tarea == "monotonia":
        crece = F(b) > 1
        return mk(f"¿Cómo es la función y = {lb} x?", f"{'Creciente' if crece else 'Decreciente'} y con dominio (0, +∞)", "t5_logaritmica",
                  [(f"{'Creciente' if crece else 'Decreciente'} y con dominio ℝ", "dominio_negativos"), (f"{'Decreciente' if crece else 'Creciente'} y con dominio (0, +∞)", None),
                   (f"{'Creciente' if crece else 'Decreciente'} y con dominio [0, +∞)", None)], [],
                  [f"La base {N(b)} es {'mayor' if crece else 'menor'} que 1: {'creciente' if crece else 'decreciente'}.", "Solo existe el logaritmo de números positivos: dominio (0, +∞)."],
                  "El logaritmo solo está definido para x > 0.")
    p, q = rng.choice([1, 2, 3, -1, -2]), rng.randint(-6, 6)
    lim = F(-q, p)
    resp = intervalo(lim, None) if p > 0 else intervalo(None, lim)
    return mk(f"Calcula el dominio de f(x) = {lb}({P({1: p, 0: q})})", resp, "t5_logaritmica",
              [("ℝ", "dominio_negativos"), (intervalo(lim, None, ca=True) if p > 0 else intervalo(None, lim, cb=True), "dominio_negativos"), (intervalo(None, lim) if p > 0 else intervalo(lim, None), None)], [],
              [f"El argumento debe ser positivo: {P({1: p, 0: q})} > 0.", f"x {'>' if p > 0 else '<'} {N(lim)}: dominio {resp}."],
              "Dominio del logaritmo: argumento estrictamente positivo (el 0 no vale).")


@generador("t5_trigonometrica_graf")
def gen_trigonometrica_graf(rng, d):
    A = rng.choice([1, 2, 3, 4, 5, F(1, 2), 6])
    k = rng.choice([1, 2, 3, 4, F(1, 2), 6]) if d > 1 else rng.choice([1, 2, 3, 4])
    fn = rng.choice(["sen", "cos"])
    kt = "" if k == 1 else (N(k) if k.__class__ is int or F(k).denominator == 1 else N(k))
    arg = "x" if k == 1 else (f"{kt}x" if F(k).denominator == 1 else f"x/{F(k).denominator}")
    At = "" if A == 1 else N(A)
    f = f"y = {At} {fn}({arg})".replace("y =  ", "y = ").replace("= " + fn, "= " + fn)
    if At:
        f = f"y = {At} {fn}({arg})" if F(A).denominator == 1 else f"y = ({At})·{fn}({arg})"
    else:
        f = f"y = {fn}({arg})"
    per = F(2) / F(k)
    if d < 3:
        resp = f"Amplitud {N(A)} y periodo {pif(per)}"
        return mk(f"¿Cuáles son la amplitud y el periodo de {f}?", resp, "t5_trig_graf",
                  [(f"Amplitud {N(A)} y periodo {pif(2 * F(k))}", "periodo_multiplicado"), (f"Amplitud {N(F(k))} y periodo {pif(per)}" if F(k) != F(A) else f"Amplitud 1 y periodo {pif(per)}", None),
                   (f"Amplitud {N(2 * F(A))} y periodo {pif(per)}", None)], [f"Amplitud {N(A)} y periodo 2π"],
                  [f"La amplitud es |A| = {N(A)}.", f"El periodo de {fn}(kx) es 2π/k = 2π/{N(k)} = {pif(per)}."],
                  "k dentro del argumento comprime la gráfica: el periodo se DIVIDE entre k.")
    resp = intervalo(-F(A), F(A), True, True)
    return mk(f"¿Cuál es el recorrido de {f}?", resp, "t5_trig_graf", [(intervalo(-1, 1, True, True) if A != 1 else intervalo(-2, 2, True, True), None), ("ℝ", "recorrido"), (intervalo(-2 * F(A), 2 * F(A), True, True), "recorrido")], [],
              [f"{fn} toma valores entre −1 y 1; multiplicado por {N(A)}, entre −{N(A)} y {N(A)}.", f"Recorrido {resp}."], "El seno y el coseno están acotados entre −1 y 1.")


@generador("t5_racional_simple")
def gen_racional_simple(rng, d):
    if d == 1:
        a, h, k = nz(rng, -6, 6), nz(rng, -5, 5), rng.randint(-5, 5)
        f = f"y = {N(a)}/{fac(h)}" + (f" {'+' if k > 0 else '−'} {abs(k)}" if k else "")
        resp = f"Vertical x = {N(h)}; horizontal y = {N(k)}"
        return mk(f"¿Cuáles son las asíntotas de {f}?", resp, "t5_racional", [(f"Vertical x = {N(-h)}; horizontal y = {N(k)}", "av_signo"), (f"Vertical x = {N(h)}; horizontal y = {N(a)}", "ah_independiente"),
                                                                              (f"Vertical x = {N(k)}; horizontal y = {N(h)}" if k != h else f"Vertical x = 0; horizontal y = 0", None)], [],
                  [f"El denominador se anula en x = {N(h)}: asíntota vertical.", f"Al crecer x, {N(a)}/{fac(h)} → 0, así que y → {N(k)}: asíntota horizontal."],
                  "y = a/(x − h) + k es la hipérbola y = a/x trasladada: asíntotas x = h e y = k.")
    for _ in range(100):
        a, b, c, e = nz(rng, -4, 5), rng.randint(-6, 6), rng.choice([1, 1, 2]), nz(rng, -6, 6)
        if a * e - b * c != 0 and b:
            break
    f = f"y = ({P({1: a, 0: b})})/({P({1: c, 0: e})})"
    av, ah = F(-e, c), F(a, c)
    resp = f"Vertical x = {N(av)}; horizontal y = {N(ah)}"
    return mk(f"¿Cuáles son las asíntotas de {f}?", resp, "t5_racional", [(f"Vertical x = {N(-av)}; horizontal y = {N(ah)}", "av_signo"), (f"Vertical x = {N(av)}; horizontal y = {N(F(b, e))}", "ah_independiente"),
                                                                          (f"Vertical x = {N(av)}; horizontal y = {N(-ah)}", None)], [],
              [f"Vertical: el denominador se anula en x = {N(av)}.", f"Horizontal: cociente de los coeficientes de x, y = {N(a)}/{N(c)} = {N(ah)}."],
              "En (ax + b)/(cx + d): asíntota vertical x = −d/c y horizontal y = a/c.")


@generador("t5_radical_absoluto")
def gen_radical_absoluto(rng, d):
    if d == 1:
        a, b = nz(rng, -4, 4), rng.randint(-8, 8)
        lim = F(-b, a)
        resp = intervalo(lim, None, ca=True) if a > 0 else intervalo(None, lim, cb=True)
        return mk(f"Calcula el dominio de f(x) = √({P({1: a, 0: b})})", resp, "t5_radical_abs",
                  [(intervalo(None, lim, cb=True) if a > 0 else intervalo(lim, None, ca=True), "dominio_raiz"), (intervalo(lim, None) if a > 0 else intervalo(None, lim), None), ("ℝ", None)], [],
                  [f"El radicando debe ser ≥ 0: {P({1: a, 0: b})} ≥ 0.", f"Despejo (si divido entre un negativo, cambio el sentido): {resp}."], "Raíz cuadrada: radicando mayor o igual que 0.")
    if d == 2:
        c = nz(rng, -6, 6)
        x0 = rng.randint(-8, 8)
        v = abs(x0 - c)
        return mk(f"Si f(x) = |x {'−' if c > 0 else '+'} {abs(c)}|, calcula f({N(x0)})", N(v), "t5_radical_abs", [(N(abs(x0) - abs(c)) if abs(x0) - abs(c) != v else N(-v), "abs_resta"), (N(x0 - c) if x0 - c != v else N(v + 1), None), (N(abs(x0) + abs(c)) if abs(x0) + abs(c) != v else N(v + 2), None)],
                      [N(v + 1)], [f"Calculo dentro: {N(x0)} {'−' if c > 0 else '+'} {abs(c)} = {N(x0 - c)}; el valor absoluto lo hace positivo: {N(v)}."], "|a − b| no es |a| − |b|.")
    tipo = rng.choice(["lin", "cuad"])
    if tipo == "lin":
        c = nz(rng, -6, 6)
        inner = P({1: 1, 0: -c})
        resp = f"{inner} si x ≥ {N(c)}; {P({1: -1, 0: c})} si x < {N(c)}"
        dist = [(f"{P({1: 1, 0: c})} si x ≥ {N(c)}; {P({1: -1, 0: -c})} si x < {N(c)}", "abs_resta"), (f"{inner} si x ≥ {N(-c)}; {P({1: -1, 0: c})} si x < {N(-c)}", None),
                (f"{P({1: -1, 0: c})} si x ≥ {N(c)}; {inner} si x < {N(c)}", None)]
    else:
        r = rng.randint(1, 5)
        inner = P({2: 1, 0: -r * r})
        resp = f"{inner} si |x| ≥ {r}; {P({2: -1, 0: r * r})} si |x| < {r}"
        dist = [(f"{P({2: 1, 0: r * r})} si |x| ≥ {r}; {P({2: -1, 0: -r * r})} si |x| < {r}", "abs_resta"), (f"{inner} si |x| ≥ {r * r}; {P({2: -1, 0: r * r})} si |x| < {r * r}", None),
                (f"{P({2: -1, 0: r * r})} si |x| ≥ {r}; {inner} si |x| < {r}", None)]
    return mk(f"Escribe como función a trozos f(x) = |{inner}|", resp, "t5_radical_abs", dist, [],
              [f"Busco dónde {inner} es positivo o cero (se queda igual) y dónde es negativo (se cambia de signo).", f"f(x) = {resp}."],
              "|f(x)| = f(x) donde f ≥ 0 y −f(x) donde f < 0: la parte negativa se refleja.")


# ================================================================ FUN.LINEAL

def _mfmt(m):
    """Coeficiente de y = mx con decimales si terminan (≤ 2 cifras)."""
    m = F(m)
    if m.denominator in (1, 2, 4, 5, 10, 20, 25, 50, 100):
        return D(m, 2)
    return N(m)


def _ymx(m):
    t = _mfmt(m)
    if "/" in t:
        return "y = " + terms([(m, "x")])
    if t == "1":
        return "y = x"
    if t == "−1":
        return "y = −x"
    return f"y = {t}x"


@generador("t5_prop_directa")
def gen_prop_directa(rng, d):
    m = rng.choice([F(2), F(3), F(5, 2), F(3, 2), F(4), F(1, 2), F(-2), F(7, 2), F(6), F(-3, 2)])
    if d < 3:
        xs = sorted(rng.sample(range(1, 11), 3))
        if m.denominator == 2:
            xs = [2 * x for x in xs[:3]]
        pares = ", ".join(pt(x, m * x) for x in xs)
        return mk(f"La tabla de una proporcionalidad directa tiene los pares {pares}. ¿Cuál es su fórmula?", _ymx(m), "t5_prop_directa",
                  [(_ymx(1 / m), "m_x_entre_y"), (f"y = x + {N(m * xs[0] - xs[0])}" if m * xs[0] - xs[0] > 0 else f"y = {_mfmt(m)}x + 1", None), (_ymx(-m), None)], [_ymx(m + 1)],
                  [f"m = y/x en cualquier par: {N(m * xs[0])}/{xs[0]} = {_mfmt(m)}.", f"Fórmula {_ymx(m)}."],
                  "En y = mx, m es el cociente y/x (constante), no x/y.")
    n = nz(rng, -5, 5)
    opts = [_ymx(m), f"y = {P({1: m, 0: n})}".replace(N(m) + "x", _mfmt(m) + "x") if m.denominator == 1 else f"y = {_mfmt(m)}x + {n}" if n > 0 else f"y = {_mfmt(m)}x − {-n}"]
    return mk("¿Cuál de estas funciones es de proporcionalidad directa?", _ymx(m), "t5_prop_directa",
              [(f"y = {_mfmt(m)}x {'+' if n > 0 else '−'} {abs(n)}", "toda_recta"), (f"y = {_mfmt(m)}/x", None), (f"y = x² + {abs(n)}", None)], [],
              ["La proporcionalidad directa es y = mx: recta que pasa por el origen (sin término independiente).", f"Es {_ymx(m)}."],
              "Una recta con ordenada distinta de 0 no pasa por (0, 0) y no es proporcional.")


@generador("t5_pendiente_ordenada")
def gen_pendiente_ordenada(rng, d):
    if d == 1:
        m, n = nz(rng, -6, 6), nz(rng, -9, 9)
        f = f"y = {P({1: m, 0: n})}" if rng.random() < 0.6 else f"y = {terms([(n, ''), (m, 'x')])}"
        resp = f"m = {N(m)}, n = {N(n)}"
        return mk(f"¿Cuáles son la pendiente m y la ordenada en el origen n de {f}?", resp, "t5_pendiente_ord", [(f"m = {N(n)}, n = {N(m)}", "m_n_cambiados"), (f"m = {N(-m)}, n = {N(n)}", None), (f"m = {N(m)}, n = {N(-n)}", None)],
                  [], [f"En y = mx + n, m es el coeficiente de x y n el término independiente.", f"{resp}."], "La pendiente acompaña a la x, se escriba en el orden que se escriba.")
    for _ in range(100):
        a, b, c = nz(rng, -6, 6), nz(rng, -5, 5), rng.randint(-12, 12)
        if abs(b) != 1 or d == 2:
            break
    m, n = F(-a, b), F(c, b)
    resp = f"m = {N(m)}, n = {N(n)}"
    return mk(f"¿Cuáles son la pendiente m y la ordenada en el origen n de la recta {terms([(a, 'x'), (b, 'y')])} = {N(c)}?", resp, "t5_pendiente_ord",
              [(f"m = {N(a)}, n = {N(c)}", "no_despeja"), (f"m = {N(-m)}, n = {N(n)}", None), (f"m = {N(n)}, n = {N(m)}", "m_n_cambiados")], [],
              [f"Despejo y: y = {P({1: m, 0: n})}.", f"{resp}."], "Para leer m y n hay que despejar y primero.")


@generador("t5_recta_puntos")
def gen_recta_puntos(rng, d):
    for _ in range(200):
        x1, y1 = rng.randint(-5, 5), rng.randint(-6, 6)
        dx = rng.choice([1, 2, 3, 4, -2, -1]) if d < 3 else rng.choice([2, 3, 4, 5])
        m = F(nz(rng, -4, 4)) if d < 3 else F(nz(rng, -5, 5), dx)
        x2, y2 = x1 + dx, y1 + m * dx
        if y2.denominator == 1 and dx:
            break
    n = y1 - m * x1
    resp = expl_y(m, n)
    if d == 1:
        enun = f"Escribe la ecuación de la recta de pendiente {N(m)} que pasa por {pt(x1, y1)}."
        dist = [(expl_y(m, y1 + m * x1), "signos_resta"), (expl_y(m, y1), None), (expl_y(-m, y1 + m * x1), None)]
    else:
        enun = f"Escribe la ecuación de la recta que pasa por {pt(x1, y1)} y {pt(x2, y2)}."
        mi = 1 / m
        dist = [(expl_y(mi, y1 - mi * x1), "pendiente_invertida"), (expl_y(-m, y1 + m * x1), "signos_resta"), (expl_y(m, y2 - m * x1), None)]
    return mk(enun, resp, "t5_recta", dist, [expl_y(m, n + 1), expl_y(m + 1, n)],
              ([f"Pendiente m = (y₂ − y₁)/(x₂ − x₁) = ({N(y2)} − ({N(y1)}))/({N(x2)} − ({N(x1)})) = {N(m)}."] if d > 1 else []) +
              [f"Punto-pendiente: y − ({N(y1)}) = {N(m)}(x − ({N(x1)})).", f"Despejo y: {resp}."],
              "m = Δy/Δx (las y arriba). Con negativos, los paréntesis evitan los errores de signo.")


@generador("t5_pendientes_comparar")
def gen_pendientes_comparar(rng, d):
    if d == 1:
        ms = rng.sample([-4, -3, -2, -1, 1, 2, 3, 4, 5], 4)
        ns = rng.sample(range(-8, 9), 4)
        best = max(range(4), key=lambda i: ms[i])
        big_n = max(range(4), key=lambda i: ns[i])
        big_abs = max(range(4), key=lambda i: abs(ms[i]))
        rs = [expl_y(m, n) for m, n in zip(ms, ns)]
        dist = [(rs[big_n] if big_n != best else None, "compara_ordenada"), (rs[big_abs] if big_abs != best and ms[big_abs] < 0 else None, "negativa_mayor")]
        dist += [(rs[i], None) for i in range(4) if i != best]
        return mk("¿Cuál de estas funciones crece más deprisa (más inclinada hacia arriba)? " + "; ".join(rs), rs[best], "t5_pendientes", dist, [],
                  ["La rapidez de crecimiento la da la pendiente m (no la ordenada n).", f"La mayor pendiente positiva es {N(ms[best])}: {rs[best]}."],
                  "Crece más deprisa la de mayor pendiente; la ordenada solo desplaza la recta. Una pendiente negativa significa que decrece.")
    if d == 2:
        m = nz(rng, -4, 4)
        n1, n2 = rng.sample(range(-8, 9), 2)
        x0, y0 = rng.randint(-4, 4), rng.randint(-5, 5)
        resp = expl_y(m, y0 - m * x0)
        return mk(f"Halla la recta paralela a y = {P({1: m, 0: n1})} que pasa por {pt(x0, y0)}.", resp, "t5_pendientes",
                  [(expl_y(-m, y0 + m * x0), None), (expl_y(m, n1), "compara_ordenada"), (expl_y(F(-1, m), y0 + F(1, m) * x0), None)], [expl_y(m, y0)],
                  [f"Paralelas: misma pendiente, m = {N(m)}.", f"Pasa por {pt(x0, y0)}: n = {N(y0)} − ({N(m)})·({N(x0)}) = {N(y0 - m * x0)}. {resp}."], "Rectas paralelas ⇔ misma pendiente.")
    for _ in range(100):
        m1, m2 = rng.sample([-3, -2, -1, 1, 2, 3, 4], 2)
        x0, y0 = rng.randint(-4, 5), rng.randint(-5, 6)
        break
    n1, n2 = y0 - m1 * x0, y0 - m2 * x0
    resp = pt(x0, y0)
    return mk(f"¿En qué punto se cortan las rectas y = {P({1: m1, 0: n1})} e y = {P({1: m2, 0: n2})}?", resp, "t5_pendientes",
              [(pt(y0, x0) if x0 != y0 else pt(x0, -y0), None), (pt(0, n1), "compara_ordenada"), (pt(x0, m1 * x0 + n2), None)], [pt(x0 + 1, y0)],
              ["Igualo las dos expresiones de y y despejo x.", f"x = {N(x0)}; sustituyo en una: y = {N(y0)}. Se cortan en {resp}."], "El punto de corte cumple las dos ecuaciones.")


@generador("t5_pendiente_angulo")
def gen_pendiente_angulo(rng, d):
    if d == 1:
        p = rng.choice([4, 5, 6, 8, 10, 12, 15, 20, 25])
        L = rng.choice([50, 100, 200, 250, 300, 400, 500])
        v = F(p * L, 100)
        return mk(f"Una carretera tiene una pendiente del {p} %. ¿Cuántos metros sube al avanzar {L} m en horizontal?", f"{D(v)} m", "t5_pendiente_ang",
                  [(f"{D(F(p * 100, L))} m" if F(p * 100, L) != v else f"{D(v * 10)} m", None), (f"{D(F(L, p))} m", None), (f"{D(p)} m", "porcentaje_angulo")], [f"{D(v + 1)} m"],
                  [f"{p} % significa {p} m de subida por cada 100 m en horizontal.", f"En {L} m: {p}·{L}/100 = {D(v)} m."], "La pendiente en % es el desnivel por cada 100 m horizontales.")
    if d == 2:
        ang, m = rng.choice([(45, "1"), (60, "√3"), (30, "√3/3"), (135, "−1"), (120, "−√3"), (150, "−√3/3")])
        if rng.random() < 0.4:
            mm = rng.choice([F(2), F(3), F(1, 2), F(-2), F(5), F(-3), F(3, 4), F(-1, 2), F(4), F(3, 2)])
            a_ = math.degrees(math.atan(float(mm)))
            a_ = a_ + 180 if a_ < 0 else a_
            return mk(f"Una recta tiene pendiente m = {N(mm)}. ¿Qué ángulo forma con el eje X? (redondea a décimas)", f"{D(a_, 1)}°", "t5_pendiente_ang",
                      [(f"{D(math.degrees(math.atan(1 / float(mm))) % 180, 1)}°", "tangente_invertida"), (f"{D(float(mm) * 45, 1)}°", "porcentaje_angulo"), (f"{D(180 - a_, 1)}°", None)], [],
                      [f"tg α = {N(mm)} → α = arctg({N(mm)}) ≈ {D(a_, 1)}°" + (" (sumando 180° porque la pendiente es negativa)." if mm < 0 else ".")],
                      "La pendiente es la tangente del ángulo de inclinación (entre 0° y 180°).")
        if rng.random() < 0.5:
            return mk(f"Una recta forma un ángulo de {ang}° con el eje X. ¿Cuál es su pendiente?", f"m = {m}", "t5_pendiente_ang",
                      [(f"m = {dict([(45, '√2/2'), (60, '1/2'), (30, '√3/2'), (135, '−√2/2'), (120, '−1/2'), (150, '−√3/2')])[ang]}", "tangente_invertida"), (f"m = {ang}", "porcentaje_angulo"),
                       (f"m = {dict([(45, '−1'), (60, '√3/3'), (30, '√3'), (135, '1'), (120, '−√3/3'), (150, '−√3')])[ang]}", "tangente_invertida")], [],
                      [f"m = tg α = tg {ang}° = {m}."], "La pendiente es la tangente del ángulo de inclinación (no el coseno ni el ángulo).")
        return mk(f"Una recta tiene pendiente m = {m}. ¿Qué ángulo forma con el eje X?", f"{ang}°", "t5_pendiente_ang",
                  [(f"{180 - ang}°", None), (f"{90 - ang if ang < 90 else 270 - ang}°", "tangente_invertida"), (f"{ang // 3 if ang % 3 == 0 else ang + 15}°", None)], [],
                  [f"tg α = {m} → α = {ang}° (entre 0° y 180°)."], "α = arctg m; si m < 0 el ángulo es obtuso.")
    p = rng.choice([5, 8, 10, 12, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200])
    ang = math.degrees(math.atan(p / 100))
    return mk(f"¿Qué ángulo con la horizontal forma una rampa con pendiente del {p} %? (redondea a décimas)", f"{D(ang, 1)}°", "t5_pendiente_ang",
              [(f"{p}°", "porcentaje_angulo"), (f"{D(math.degrees(math.atan(100 / p)), 1)}°", "tangente_invertida"), (f"{D(p * 0.9, 1)}°", None)], [f"{D(ang + 1, 1)}°"],
              [f"Pendiente {p} % → m = {D(F(p, 100))} = tg α.", f"α = arctg {D(F(p, 100))} ≈ {D(ang, 1)}°."], "100 % de pendiente son 45°, no 100°.")


# ================================================================ FUN.PROPS

def _dom_union(excl):
    excl = sorted(set(excl))
    return "ℝ − {" + ", ".join(N(e) for e in excl) + "}" if excl else "ℝ"


@generador("t5_dominio")
def gen_dominio(rng, d):
    tipo = rng.choice(["rac", "raiz"]) if d == 1 else rng.choice(["rac2", "log", "raiz_inv"]) if d == 2 else rng.choice(["raiz_rac", "log_rac", "raiz_rac"])
    if tipo == "rac":
        a, b = rng.sample(range(-6, 7), 2)
        f = f"f(x) = {fac(a)[1:-1] if a else 'x'}/{fac(b)}".replace("f(x) = x − ", "f(x) = (x − ").replace("f(x) = x + ", "f(x) = (x + ")
        f = f"f(x) = {fac(a) if a else 'x'}/{fac(b)}"
        resp = _dom_union([b])
        dist = [(_dom_union([a, b]), "excluye_numerador"), (_dom_union([-b]), None), ("ℝ", "olvida_restriccion")]
    elif tipo == "raiz":
        a = rng.randint(-6, 6)
        f = f"f(x) = √{fac(a)}" if a else "f(x) = √x"
        resp = intervalo(a, None, ca=True)
        dist = [(intervalo(a, None), "raiz_estricta"), (intervalo(None, a, cb=True), None), ("ℝ", "olvida_restriccion")]
    elif tipo == "rac2":
        r = rng.randint(1, 6)
        a = rng.randint(-5, 5)
        f = f"f(x) = {fac(a) if a else 'x'}/(x² − {r * r})"
        resp = _dom_union([r, -r])
        dist = [(_dom_union([r]), "olvida_restriccion"), (_dom_union([r, -r, a]), "excluye_numerador"), (_dom_union([r * r]), None)]
    elif tipo == "log":
        a = rng.randint(-6, 6)
        f = f"f(x) = ln{fac(a)}" if a else "f(x) = ln x"
        resp = intervalo(a, None)
        dist = [(intervalo(a, None, ca=True), "raiz_estricta"), ("ℝ", "olvida_restriccion"), (intervalo(None, a), None)]
    elif tipo == "raiz_inv":
        a = rng.randint(-6, 6)
        f = f"f(x) = √({P({1: -1, 0: a})})"
        resp = intervalo(None, a, cb=True)
        dist = [(intervalo(a, None, ca=True), None), (intervalo(None, a), "raiz_estricta"), ("ℝ", "olvida_restriccion")]
    elif tipo == "raiz_rac":
        a = rng.randint(-4, 2)
        r = rng.randint(a + 1, a + 6)
        f = f"f(x) = √{fac(a)}/{fac(r)}" if a else f"f(x) = √x/{fac(r)}"
        resp = union(intervalo(a, r, True, False), intervalo(r, None))
        dist = [(intervalo(a, None, ca=True), "olvida_restriccion"), (union(intervalo(a, r, False, False), intervalo(r, None)), "raiz_estricta"), (_dom_union([r]), "olvida_restriccion")]
    else:
        a = rng.randint(-4, 2)
        r = rng.randint(a + 1, a + 6)
        f = f"f(x) = ln{fac(a)}/{fac(r)}" if a else f"f(x) = ln x/{fac(r)}"
        resp = union(intervalo(a, r), intervalo(r, None))
        dist = [(intervalo(a, None), "olvida_restriccion"), (union(intervalo(a, r, True, False), intervalo(r, None)), "raiz_estricta"), (_dom_union([r]), "olvida_restriccion")]
    return mk(f"Calcula el dominio de {f}", resp, "t5_dominio", dist, [intervalo(None, None).replace("(−∞, +∞)", "∅")],
              ["Condiciones: denominador ≠ 0; radicando de raíz cuadrada ≥ 0; argumento del logaritmo > 0.", f"Junto todas las condiciones: {resp}."],
              "Se excluyen los ceros del DENOMINADOR (no los del numerador) y hay que tener en cuenta todas las restricciones a la vez.")


@generador("t5_paridad")
def gen_paridad(rng, d):
    TXT = {"par": "Par", "impar": "Impar", "ninguna": "Ni par ni impar"}
    if d < 3:
        exps = rng.sample(range(0, 6), rng.randint(2, 3))
        caso = rng.choice(["par", "impar", "ninguna"])
        if caso == "par":
            exps = sorted({e - e % 2 for e in exps} | {2})
        elif caso == "impar":
            exps = sorted({e + (1 - e % 2) for e in exps})
        else:
            exps = sorted(set(exps) | {2, 1})
        co = {e: nz(rng, -5, 5) for e in exps}
        f = f"f(x) = {P(co)}"
        pares = {e % 2 for e in co}
        caso = "par" if pares == {0} else "impar" if pares == {1} else "ninguna"
    else:
        f, caso = rng.choice([("f(x) = x·sen x", "par"), ("f(x) = x²·sen x", "impar"), ("f(x) = cos x + x²", "par"), ("f(x) = sen x + cos x", "ninguna"),
                              ("f(x) = |x| + 1", "par"), ("f(x) = x/(x² + 1)", "impar"), ("f(x) = x³/(x² + 4)", "impar"), ("f(x) = (x² + 1)/(x² − 4)", "par"),
                              ("f(x) = eˣ", "ninguna"), ("f(x) = x + cos x", "ninguna"), ("f(x) = x·cos x", "impar"), ("f(x) = sen(x²)", "par"),
                              ("f(x) = x³ − x", "impar"), ("f(x) = x⁴ − 3x² + 2", "par"), ("f(x) = x² + x", "ninguna"), ("f(x) = tg x", "impar")])
        k = rng.choice([2, 3, 5])
        f = f.replace("f(x) = ", f"f(x) = {k}·(") + ")" if rng.random() < 0.5 else f
    resp = TXT[caso]
    tiene2 = "²" in f
    dist = [(TXT["par"] if caso != "par" and tiene2 else None, "par_por_x2")]
    dist += [(t, None) for k_, t in TXT.items() if k_ != caso]
    dist.append(("Par e impar a la vez", None))
    return mk(f"Estudia la simetría de {f}", resp, "t5_paridad", dist, [],
              ["Calculo f(−x) en general (no con un solo valor).", {"par": "f(−x) = f(x): es par (simétrica respecto del eje Y).", "impar": "f(−x) = −f(x): es impar (simétrica respecto del origen).",
                                                                   "ninguna": "f(−x) no coincide ni con f(x) ni con −f(x): ni par ni impar."}[caso]],
              "Para demostrar simetría hay que comprobar f(−x) con la expresión general; probar un solo valor no basta.")


@generador("t5_operaciones_funciones")
def gen_operaciones_funciones(rng, d):
    f = {1: nz(rng, -4, 4), 0: rng.randint(-5, 5)} if rng.random() < 0.5 else {2: 1, 0: rng.randint(-4, 4)}
    g = {1: 1, 0: nz(rng, -5, 5)}
    a = rng.randint(-3, 4)
    op = rng.choice(["+", "−", "·"]) if d == 1 else rng.choice(["·", "/"]) if d == 2 else "dom"
    comp = pev(f, pev(g, a))
    if op in "+−·":
        v = pev(f, a) + pev(g, a) if op == "+" else pev(f, a) - pev(g, a) if op == "−" else pev(f, a) * pev(g, a)
        nombre = {"+": "f + g", "−": "f − g", "·": "f·g"}[op]
        return mk(f"Si f(x) = {P(f)} y g(x) = {P(g)}, calcula ({nombre})({N(a)})", N(v), "t5_op_funciones",
                  [(N(comp) if comp != v else None, "producto_composicion" if op == "·" else None), (N(pev(f, a) - pev(g, a) if op != "−" else pev(f, a) + pev(g, a)), None), (N(-v) if v else "1", None)],
                  [N(v + 1), N(v - 1)], [f"f({N(a)}) = {N(pev(f, a))} y g({N(a)}) = {N(pev(g, a))}.", f"({nombre})({N(a)}) = {N(v)}."],
                  "(f·g)(a) = f(a)·g(a); no es f(g(a)).")
    if op == "/":
        if pev(g, a) == 0:
            a += 1
        v = pev(f, a) / pev(g, a)
        return mk(f"Si f(x) = {P(f)} y g(x) = {P(g)}, calcula (f/g)({N(a)})", N(v), "t5_op_funciones",
                  [(N(comp), "producto_composicion"), (N(pev(g, a) / pev(f, a)) if pev(f, a) else "0", None), (N(pev(f, a) * pev(g, a)), None)], [N(v + 1)],
                  [f"f({N(a)}) = {N(pev(f, a))}, g({N(a)}) = {N(pev(g, a))}: (f/g)({N(a)}) = {N(v)}."], "(f/g)(a) = f(a)/g(a).")
    r = -g[0]
    return mk(f"Si f(x) = {P(f)} y g(x) = {P(g)}, ¿cuál es el dominio de f/g?", _dom_union([r]), "t5_op_funciones",
              [("ℝ", "dominio_cociente"), (_dom_union([-r]), None), (_dom_union([r] + ([x for x in _cuad(1, 0, f[0]) or []] if 2 in f else [F(-f.get(0, 0), f[1])] if 1 in f else [])) if (2 in f and _cuad(1, 0, f[0])) or (1 in f) else _dom_union([0]), "dominio_cociente")],
              [], [f"f/g no existe donde g(x) = 0: x = {N(r)}.", f"Dominio: {_dom_union([r])}."], "Del dominio de f/g se quitan los ceros de g (el denominador).")


@generador("t5_composicion")
def gen_composicion(rng, d):
    f = {1: nz(rng, -4, 4), 0: rng.randint(-5, 5)}
    g = {2: 1, 0: rng.randint(-4, 4)} if rng.random() < 0.6 else {1: nz(rng, -3, 3), 0: rng.randint(-5, 5)}
    if f == g:
        f[0] += 1
    def comp(p, q):  # p(q(x))
        r = {}
        for e, c in p.items():
            t = {0: c}
            for _ in range(e):
                t = pmul(t, q)
            r = padd(r, t)
        return r
    gf, fg = comp(g, f), comp(f, g)
    if d == 1:
        a = rng.randint(-3, 3)
        v = pev(gf, a)
        return mk(f"Si f(x) = {P(f)} y g(x) = {P(g)}, calcula (g∘f)({N(a)})", N(v), "t5_composicion",
                  [(N(pev(fg, a)) if pev(fg, a) != v else None, "orden_cambiado"), (N(pev(f, a) * pev(g, a)), "multiplica"), (N(pev(f, a) + pev(g, a)), None)], [N(v + 1), N(v - 1)],
                  [f"(g∘f)({N(a)}) = g(f({N(a)})): primero f({N(a)}) = {N(pev(f, a))}.", f"Después g({N(pev(f, a))}) = {N(v)}."], "g∘f: primero se aplica f y después g.")
    resp = P(gf)
    return mk(f"Si f(x) = {P(f)} y g(x) = {P(g)}, calcula (g∘f)(x)", resp, "t5_composicion",
              [(P(fg) if fg != gf else None, "orden_cambiado"), (P(pmul(f, g)), "multiplica"), (P(padd(f, g)), None)], [P(padd(gf, {0: 1}))],
              [f"(g∘f)(x) = g(f(x)): sustituyo la x de g por ({P(f)}).", f"Desarrollo: {resp}."], "La composición no es conmutativa: g∘f ≠ f∘g en general.")


@generador("t5_inversa_funcion")
def gen_inversa_funcion(rng, d):
    if d < 3:
        a = rng.choice([2, 3, 4, 5, -2, -3]) if d == 2 else rng.choice([2, 3, 4, 5])
        b = nz(rng, -9, 9)
        num = P({1: 1, 0: -b})
        if a > 0:
            resp = f"f⁻¹(x) = ({num})/{a}"
        else:
            resp = f"f⁻¹(x) = ({P({1: -1, 0: b})})/{-a}"
        return mk(f"Calcula la función inversa de f(x) = {P({1: a, 0: b})}", resp, "t5_inversa_f",
                  [(f"f⁻¹(x) = 1/({P({1: a, 0: b})})", "uno_entre_f"), (resp.replace("x", "y").replace("f⁻¹(y)", "f⁻¹(x)"), "no_intercambia"),
                   (f"f⁻¹(x) = ({P({1: 1, 0: b})})/{a}" if a > 0 else f"f⁻¹(x) = ({P({1: 1, 0: -b})})/{a}".replace("/-", "/−"), None)], [f"f⁻¹(x) = {P({1: a, 0: -b})}"],
                  ["Escribo y = f(x), intercambio x e y, y despejo y.", f"x = {P({1: a, 0: b}, 'y')} → {resp}."], "La inversa deshace f; no es 1/f(x).")
    tipo = rng.choice(["racional", "exp", "log"])
    k = nz(rng, -5, 5)
    if tipo == "racional":
        a, b, c, e = rng.choice([1, 2, 3]), rng.randint(-5, 5), rng.choice([1, 2]), nz(rng, -5, 5)
        if a * e - b * c == 0:
            b += 1
        f = f"({P({1: a, 0: b})})/({P({1: c, 0: e})})"
        resp = f"f⁻¹(x) = ({P({1: -e, 0: b})})/({P({1: c, 0: -a})})"
        dist = [(f"f⁻¹(x) = ({P({1: c, 0: e})})/({P({1: a, 0: b})})", "uno_entre_f"), (f"f⁻¹(x) = ({P({1: e, 0: -b})})/({P({1: c, 0: -a})})", None), (resp.replace("(x)", "(y)").replace("x", "y"), "no_intercambia")]
    elif tipo == "exp":
        f = f"e^x {'+' if k > 0 else '−'} {abs(k)}"
        resp = f"f⁻¹(x) = ln{fac(k)}"
        dist = [(f"f⁻¹(x) = 1/(e^x {'+' if k > 0 else '−'} {abs(k)})", "uno_entre_f"), (f"f⁻¹(x) = ln{fac(-k)}", None), (f"f⁻¹(x) = ln x {'−' if k > 0 else '+'} {abs(k)}", None)]
    else:
        f = f"ln{fac(k)}"
        resp = f"f⁻¹(x) = e^x {'+' if k > 0 else '−'} {abs(k)}"
        dist = [(f"f⁻¹(x) = 1/ln{fac(k)}", "uno_entre_f"), (f"f⁻¹(x) = e^x {'−' if k > 0 else '+'} {abs(k)}", None), (f"f⁻¹(x) = e^{fac(k)}", None)]
    return mk(f"Calcula la función inversa de f(x) = {f}", resp, "t5_inversa_f", dist, [],
              ["Escribo y = f(x), intercambio x e y, y despejo y (el logaritmo deshace la exponencial y viceversa).", f"{resp}. Compruebo que f(f⁻¹(x)) = x."],
              "f⁻¹ es la función que deshace f; sus gráficas son simétricas respecto de y = x.")


BASES_TRANS = [("x²", "y = x²"), ("√x", "y = √x"), ("|x|", "y = |x|"), ("x³", "y = x³"), ("1/x", "y = 1/x")]


def _aplica_base(b, arg):
    if b == "x²":
        return f"{par(arg) if arg != 'x' else 'x'}²" if arg == "x" else f"({arg})²"
    if b == "√x":
        return f"√{'x' if arg == 'x' else '(' + arg + ')'}"
    if b == "|x|":
        return f"|{arg}|"
    if b == "x³":
        return "x³" if arg == "x" else f"({arg})³"
    return f"1/{'x' if arg == 'x' else '(' + arg + ')'}"


@generador("t5_transformaciones")
def gen_transformaciones(rng, d):
    b, _ = rng.choice(BASES_TRANS)
    if d < 3:
        h = nz(rng, -5, 5)
        k = rng.randint(-5, 5) if d == 2 else 0
        arg = P({1: 1, 0: -h})
        f = f"y = {_aplica_base(b, arg)}" + (f" {'+' if k > 0 else '−'} {abs(k)}" if k else "")
        T = lambda hh, kk: ", ".join(x for x in [f"{abs(hh)} unidades a la {'derecha' if hh > 0 else 'izquierda'}" if hh else "", f"{abs(kk)} unidades hacia {'arriba' if kk > 0 else 'abajo'}" if kk else ""] if x)
        resp = T(h, k)
        return mk(f"¿Cómo se obtiene la gráfica de {f} a partir de la de y = {b}?", resp[0].upper() + resp[1:], "t5_transformaciones",
                  [(T(-h, k)[0].upper() + T(-h, k)[1:], "horizontal_al_reves"), ((T(h, -k)[0].upper() + T(h, -k)[1:]) if k else (T(0, -h)[0].upper() + T(0, -h)[1:]), None),
                   ((T(-h, -k)[0].upper() + T(-h, -k)[1:]) if k else (T(0, h)[0].upper() + T(0, h)[1:]), None)], [],
                  [f"f(x − h) desplaza la gráfica h unidades a la derecha (h = {N(h)}).", ("f(x) + k la sube k unidades." if k else "") + f" Resultado: {resp}."],
                  "Lo que va dentro del argumento actúa 'al revés': f(x + 2) se desplaza a la IZQUIERDA.")
    tipo = rng.choice(["-f", "f(-x)", "kf", "-f+k"])
    if tipo == "kf":
        kk = rng.choice([2, 3, 4, 5])
        f = f"y = {kk}{_aplica_base(b, 'x')}" if b not in ("√x", "|x|", "1/x") else f"y = {kk}·{_aplica_base(b, 'x')}"
        resp = f"Estirada verticalmente: las alturas se multiplican por {kk}"
        return mk(f"¿Cómo se obtiene la gráfica de {f} a partir de la de y = {b}?", resp, "t5_transformaciones",
                  [(f"Estirada horizontalmente: las x se multiplican por {kk}", "horizontal_al_reves"), (f"Desplazada {kk} unidades hacia arriba", None), ("Simétrica respecto del eje X", "eje_equivocado")], [],
                  [f"k·f(x) multiplica cada altura por k = {kk}.", f"{resp}."], "k·f(x) dilata en vertical; f(kx) comprime en horizontal.")
    if tipo == "-f+k":
        kk = nz(rng, -5, 5)
        f = f"y = −{_aplica_base(b, 'x')} {'+' if kk > 0 else '−'} {abs(kk)}"
        resp = f"Simétrica respecto del eje X y desplazada {abs(kk)} unidades hacia {'arriba' if kk > 0 else 'abajo'}"
        return mk(f"¿Cómo se obtiene la gráfica de {f} a partir de la de y = {b}?", resp, "t5_transformaciones",
                  [(f"Simétrica respecto del eje Y y desplazada {abs(kk)} unidades hacia {'arriba' if kk > 0 else 'abajo'}", "eje_equivocado"),
                   (f"Simétrica respecto del eje X y desplazada {abs(kk)} unidades a la {'derecha' if kk > 0 else 'izquierda'}", "horizontal_al_reves"),
                   (f"Simétrica respecto del eje X y desplazada {abs(kk)} unidades hacia {'abajo' if kk > 0 else 'arriba'}", None)], [],
                  ["−f(x) refleja respecto del eje X.", f"Sumar {N(kk)} fuera desplaza en vertical. {resp}."], "Lo que va fuera de f actúa sobre las alturas.")
    if tipo == "-f":
        b = rng.choice(["x²", "√x", "|x|", "2^x", "3^x"])
        f = f"y = −{_aplica_base(b, 'x') if '^' not in b else b}"
        resp, mal = "Simétrica respecto del eje X", "Simétrica respecto del eje Y"
    else:
        b = rng.choice(["√x", "2^x", "3^x", "ln x"])
        f = {"√x": "y = √(−x)", "2^x": "y = 2^(−x)", "3^x": "y = 3^(−x)", "ln x": "y = ln(−x)"}[b]
        resp, mal = "Simétrica respecto del eje Y", "Simétrica respecto del eje X"
    return mk(f"¿Cómo se obtiene la gráfica de {f} a partir de la de y = {b}?", resp, "t5_transformaciones",
              [(mal, "eje_equivocado"), ("Simétrica respecto del origen", None), ("Desplazada 1 unidad hacia abajo", None)], [],
              ["−f(x) cambia el signo de las y: refleja respecto del eje X. f(−x) cambia el signo de las x: refleja respecto del eje Y.", f"{resp}."],
              "−f(x): se reflejan las alturas (eje X). f(−x): se refleja izquierda-derecha (eje Y).")


# ================================================================ FUN.SUCES

def _an_txt(kind, p):
    if kind == "lin":
        return P({1: p[0], 0: p[1]}, "n")
    if kind == "cuad":
        return P({2: p[0], 1: p[1], 0: p[2]}, "n")
    if kind == "frac":
        return f"({P({1: p[0], 0: p[1]}, 'n')})/({P({1: p[2], 0: p[3]}, 'n')})"
    return f"(−1)ⁿ·{par(P({1: p[0], 0: p[1]}, 'n'))}"


def _an_val(kind, p, n):
    if kind == "lin":
        return p[0] * n + p[1]
    if kind == "cuad":
        return p[0] * n * n + p[1] * n + p[2]
    if kind == "frac":
        return F(p[0] * n + p[1], p[2] * n + p[3])
    return (-1) ** n * (p[0] * n + p[1])


@generador("t5_sucesion_termino")
def gen_sucesion_termino(rng, d):
    kind = rng.choice(["lin", "cuad"]) if d == 1 else rng.choice(["frac", "alt", "cuad"]) if d == 2 else "frac"
    for _ in range(100):
        p = [nz(rng, -3, 4), rng.randint(-5, 5), nz(rng, 1, 3), rng.randint(1, 5)] if kind == "frac" else [nz(rng, -3, 4), rng.randint(-5, 5), rng.randint(-5, 5)]
        if kind == "frac" and any(p[2] * n + p[3] == 0 for n in range(1, 30)):
            continue
        break
    an = _an_txt(kind, p)
    if d < 3:
        n = rng.randint(3, 12)
        v = _an_val(kind, p, n)
        mal_alt = -v if kind == "alt" else None
        return mk(f"Si aₙ = {an}, calcula a{sub(n)}", N(v), "t5_sucesiones", [(N(n), "n_por_an"), (N(mal_alt) if mal_alt is not None and mal_alt != v else N(_an_val(kind, p, n + 1)), "alterna_mal" if kind == "alt" else None),
                                                                            (N(_an_val(kind, p, n - 1)), None)], [N(v + 1) if F(v).denominator == 1 else N(v + F(1, 2))],
                  [f"Sustituyo n = {n} en el término general.", f"a{sub(n)} = {N(v)}."], "aₙ es el valor del término; n es su posición.")
    for _ in range(100):
        n = rng.randint(3, 15)
        v = _an_val(kind, p, n)
        if all(_an_val(kind, p, m) != v for m in range(1, 40) if m != n):
            break
    return mk(f"¿Es {N(v)} un término de la sucesión aₙ = {an}? Si lo es, ¿qué lugar ocupa?", f"Sí, es a{sub(n)}", "t5_sucesiones",
              [(f"Sí, es a{sub(n + 1)}", None), (f"Sí, es a{sub(n - 1)}", None), ("No es un término de la sucesión", None)], [],
              [f"Igualo aₙ = {N(v)} y despejo n.", f"Sale n = {n}, natural: es el término a{sub(n)}."], "Un número es término si al igualar sale n natural.")


@generador("t5_recurrencia")
def gen_recurrencia(rng, d):
    tipo = rng.choice(["lineal", "fib"]) if d < 3 else rng.choice(["fib", "prod", "fib2"])
    a1, a2 = rng.randint(1, 5), rng.randint(1, 6)
    k = rng.randint(4, 6) if d > 1 else rng.randint(3, 5)
    if tipo == "lineal":
        p, q = rng.choice([2, 3, -1]), rng.randint(-3, 4)
        regla = f"aₙ = {terms([(p, 'aₙ₋₁'), (q, '')])}"
        seq = [a1]
        for i in range(2, k + 1):
            seq.append(p * seq[-1] + q)
        usa_n = [a1]
        for i in range(2, k + 1):
            usa_n.append(p * usa_n[-1] + i)
        ini = f"a₁ = {a1}"
    else:
        seq = [a1, a2]
        if tipo == "fib":
            f = lambda x, y, i: x + y
            regla = "aₙ = aₙ₋₁ + aₙ₋₂"
        elif tipo == "prod":
            f = lambda x, y, i: x * y
            regla = "aₙ = aₙ₋₁·aₙ₋₂"
            a1, a2 = rng.randint(1, 3), rng.randint(2, 3)
            seq = [a1, a2]
        else:
            f = lambda x, y, i: 2 * x - y
            regla = "aₙ = 2aₙ₋₁ − aₙ₋₂"
            a2 = a1 + rng.randint(1, 5)
            seq = [a1, a2]
        for i in range(3, k + 1):
            seq.append(f(seq[-1], seq[-2], i))
        usa_n = [a1, a2]
        for i in range(3, k + 1):
            usa_n.append(usa_n[-1] + i)
        ini = f"a₁ = {a1}, a₂ = {seq[1]}"
    r = seq[-1]
    return mk(f"Una sucesión cumple {ini} y {regla}. Calcula a{sub(k)}", N(r), "t5_recurrencia",
              [(N(usa_n[-1]) if usa_n[-1] != r else None, "usa_n"), (N(seq[-2]), "desfase"), (N(seq[-1] + seq[-2]) if seq[-1] + seq[-2] != r else N(r + 1), None)], [N(r + 1), N(r - 1)],
              [f"Calculo los términos uno a uno: {', '.join(N(x) for x in seq)}.", f"a{sub(k)} = {N(r)}."], "En una recurrencia cada término se calcula con los ANTERIORES, no con n.")


@generador("t5_termino_general")
def gen_termino_general(rng, d):
    kind = "lin" if d == 1 else rng.choice(["cuad", "alt"]) if d == 2 else "frac"
    if kind == "lin":
        dd, c = nz(rng, -4, 6), rng.randint(-5, 6)
        f = lambda n: dd * n + c
        resp = P({1: dd, 0: c}, "n")
        dist = [(P({1: 1, 0: f(1) - 1 + dd - dd}, "n") if False else P({1: 1, 0: dd}, "n") if dd != 1 or c != dd else P({1: 2, 0: 0}, "n"), "constante_coef"),
                (P({1: f(1), 0: dd - f(1)}, "n") if f(1) != dd else P({1: dd, 0: c + 1}, "n"), None), (P({1: dd, 0: f(1)}, "n"), "solo_primero")]
    elif kind == "cuad":
        c = rng.randint(-3, 5)
        s = rng.choice([1, 2])
        f = lambda n: s * n * n + c
        resp = P({2: s, 0: c}, "n")
        dist = [(P({1: 2 * s, 0: f(1) - 2 * s}, "n"), "solo_primero"), (P({2: s, 0: c + 1}, "n"), None), (P({1: 3 * s, 0: f(1) - 3 * s}, "n"), None)]
    elif kind == "alt":
        m, c = rng.choice([1, 2, 3]), rng.randint(0, 3)
        f = lambda n: (-1) ** n * (m * n + c)
        resp = _an_txt("alt", [m, c])
        dist = [(f"(−1)ⁿ⁺¹·{par(P({1: m, 0: c}, 'n'))}", None), (P({1: m, 0: c}, "n"), None), (f"−{par(P({1: m, 0: c}, 'n'))}", "solo_primero")]
    else:
        while True:
            p, q, r, s = rng.choice([1, 2]), rng.randint(-1, 2), rng.choice([1, 2, 3]), rng.randint(0, 3)
            if p * s != q * r and all(r * n + s for n in range(1, 5)):
                break
        f = lambda n: F(p * n + q, r * n + s)
        resp = f"({P({1: p, 0: q}, 'n')})/{par(P({1: r, 0: s}, 'n'))}"
        a1n, a1d = p + q, r + s
        dist = [(f"({P({1: p, 0: a1n - p}, 'n')})/({P({1: r + 1, 0: a1d - r - 1}, 'n')})", "solo_primero"), (f"({P({1: p, 0: q}, 'n')})/({P({1: r, 0: s + 1}, 'n')})", None),
                (f"({P({1: 1, 0: p}, 'n')})/({P({1: 1, 0: r}, 'n')})", "constante_coef")]
    terms_txt = ", ".join((f"{p * n + q}/{r * n + s}" if kind == "frac" else N(f(n))) for n in range(1, 5))
    return mk(f"¿Cuál es el término general de la sucesión {terms_txt}, …?", f"aₙ = {resp}", "t5_termino_general",
              [(f"aₙ = {v}", k) for v, k in dist if v and v != resp], [f"aₙ = {P({1: 1, 0: 1}, 'n')}"],
              ["Busco qué cambia de un término a otro (diferencia constante, cuadrados, signos alternos, numerador y denominador por separado).",
               f"aₙ = {resp}. Compruebo con n = 1, 2, 3 y 4."], "Una fórmula solo vale si da TODOS los términos, no solo el primero.")


@generador("t5_prog_aritmetica")
def gen_prog_aritmetica(rng, d):
    a1, dd = rng.randint(-10, 15), nz(rng, -6, 7)
    an = lambda n: a1 + (n - 1) * dd
    if d == 1:
        n = rng.randint(8, 40)
        return mk(f"En una progresión aritmética a₁ = {N(a1)} y d = {N(dd)}. Calcula a{sub(n)}", N(an(n)), "t5_prog_aritm",
                  [(N(a1 + n * dd), "n_en_vez"), (N(a1 * n), None), (N(an(n) - dd * 2), None)], [N(an(n) + 1)],
                  [f"aₙ = a₁ + (n − 1)d = {N(a1)} + {n - 1}·({N(dd)}) = {N(an(n))}."], "Del término 1 al n hay n − 1 saltos.")
    if d == 2:
        i, j = sorted(rng.sample(range(2, 15), 2))
        return mk(f"En una progresión aritmética a{sub(i)} = {N(an(i))} y a{sub(j)} = {N(an(j))}. Calcula la diferencia d.", N(dd), "t5_prog_aritm",
                  [(N(an(j) - an(i)), "d_no_consecutivos"), (N(F(an(j) - an(i), j)), None), (N(-dd), None)], [N(dd + 1)],
                  [f"Entre a{sub(i)} y a{sub(j)} hay {j - i} saltos de d.", f"d = ({N(an(j))} − {N(an(i))})/{j - i} = {N(dd)}."], "La diferencia entre dos términos lejanos es (j − i)·d.")
    target = an(rng.randint(10, 60))
    n = (target - a1) // dd + 1
    return mk(f"En la progresión aritmética {', '.join(N(an(k)) for k in range(1, 4))}, …, ¿qué lugar ocupa el término {N(target)}?", f"El lugar {n}", "t5_prog_aritm",
              [(f"El lugar {n - 1}", "n_en_vez"), (f"El lugar {n + 1}", None), (f"El lugar {N(F(target, dd)) if F(target, dd).denominator == 1 else n + 2}", None)], [f"El lugar {n + 2}"],
              [f"d = {N(dd)}. Planteo {N(target)} = {N(a1)} + (n − 1)·({N(dd)}).", f"n − 1 = {n - 1}, n = {n}."], "aₙ = a₁ + (n − 1)d también sirve para hallar la posición n.")


@generador("t5_suma_aritmetica")
def gen_suma_aritmetica(rng, d):
    a1, dd = rng.randint(-5, 12), nz(rng, -3, 6)
    n = rng.randint(8, 30) if d < 3 else rng.randint(20, 100)
    an = a1 + (n - 1) * dd
    S = F((a1 + an) * n, 2)
    if d == 3 and rng.random() < 0.5:
        k = rng.choice(["impares", "pares", "múltiplos de 3"])
        a1, dd = {"impares": (1, 2), "pares": (2, 2), "múltiplos de 3": (3, 3)}[k]
        an = a1 + (n - 1) * dd
        S = F((a1 + an) * n, 2)
        enun = f"Calcula la suma de los {n} primeros números {k} (empezando por {a1})."
    else:
        enun = f"Calcula la suma de los {n} primeros términos de la progresión aritmética {', '.join(N(a1 + i * dd) for i in range(3))}, …"
    return mk(enun, N(S), "t5_suma_aritm", [(N((a1 + an) * n), "sin_dividir"), (N(F((a1 + dd) * n, 2)), "d_en_vez"), (N(F((a1 + an - dd) * n, 2)), None)], [N(S + dd)],
              [f"aₙ = a₁ + (n − 1)d = {N(an)}.", f"Sₙ = (a₁ + aₙ)·n/2 = ({N(a1)} + {N(an)})·{n}/2 = {N(S)}."], "La suma de una progresión aritmética es el número de términos por la media del primero y el último.")


@generador("t5_prog_geometrica")
def gen_prog_geometrica(rng, d):
    a1 = rng.choice([1, 2, 3, 4, 5, -2])
    r = rng.choice([2, 3, -2, F(1, 2), -3]) if d > 1 else rng.choice([2, 3, 5])
    r = F(r)
    an = lambda n: a1 * r ** (n - 1)
    if d == 1:
        terms_ = [an(k) for k in range(1, 4)]
        n = rng.randint(5, 8)
        return mk(f"En la progresión geométrica {', '.join(N(t) for t in terms_)}, …, calcula a{sub(n)}", N(an(n)), "t5_prog_geom",
                  [(N(terms_[0] + (n - 1) * (terms_[1] - terms_[0])), "como_aritmetica"), (N(a1 * r ** n), "exponente_n"), (N(a1 * r * (n - 1)), None)], [N(an(n) + 1)],
                  [f"Razón r = {N(terms_[1])}/{N(terms_[0])} = {N(r)}.", f"aₙ = a₁·rⁿ⁻¹ = {N(a1)}·{N(r)}^{n - 1} = {N(an(n))}."], "En una geométrica se MULTIPLICA por la razón; el exponente es n − 1.")
    i, j = rng.choice([(1, 3), (2, 4), (2, 5), (1, 4), (3, 5)])
    if j - i == 2 and r < 0:
        r = -r
    return mk(f"En una progresión geométrica a{sub(i)} = {N(an(i))} y a{sub(j)} = {N(an(j))}. Calcula la razón r.", N(r), "t5_prog_geom",
              [(N(F(an(j) - an(i), j - i)), "como_aritmetica"), (N(an(j) / an(i)) if an(j) / an(i) != r else None, None), (N(1 / r), None), (N(-r), None)], [N(r + 1)],
              [f"a{sub(j)} = a{sub(i)}·r^{j - i}: r^{j - i} = {N(an(j))}/{N(an(i))} = {N(an(j) / an(i))}.", f"r = {N(r)}."], "Entre términos no consecutivos se divide y se hace la raíz del orden adecuado.")


@generador("t5_suma_geometrica")
def gen_suma_geometrica(rng, d):
    a1 = rng.choice([1, 2, 3, 4, 5])
    r = F(rng.choice([2, 3])) if d < 3 else F(rng.choice([2, 3, -2, F(1, 2)]))
    n = rng.randint(4, 8)
    S = a1 * (r ** n - 1) / (r - 1)
    an = a1 * r ** (n - 1)
    if d == 2:
        enun = f"Calcula {' + '.join(N(a1 * r ** k) for k in range(3))} + … + {N(an)}"
    else:
        enun = f"Calcula la suma de los {n} primeros términos de la progresión geométrica {', '.join(N(a1 * r ** k) for k in range(3))}, …"
    return mk(enun, N(S), "t5_suma_geom", [(N(F((a1 + an) * n, 2)), "formula_aritmetica"), (N(a1 * (r ** (n - 1) - 1) / (r - 1)), "exponente_n1"), (N(an * r), None)], [N(S + 1)],
              [f"r = {N(r)}, n = {n}.", f"Sₙ = a₁(rⁿ − 1)/(r − 1) = {N(a1)}·({N(r)}^{n} − 1)/({N(r)} − 1) = {N(S)}."], "Sₙ = a₁(rⁿ − 1)/(r − 1): el exponente es n.")


@generador("t5_suma_infinita")
def gen_suma_infinita(rng, d):
    if d == 3:
        dig = rng.randint(1, 9)
        rep = rng.choice([1, 2])
        if rep == 1:
            txt = f"0,{dig} + 0,0{dig} + 0,00{dig} + …"
            S = F(dig, 9)
            r = F(1, 10)
        else:
            dd = rng.randint(10, 99)
            txt = f"0,{dd} + 0,00{dd} + 0,0000{dd} + …"
            S = F(dd, 99)
            r = F(1, 100)
        return mk(f"Calcula la suma {txt}", N(S), "t5_suma_inf", [("No existe: la suma de infinitos términos es infinita", "siempre_infinita"), (N(S * r), None), (N(F(dig if rep == 1 else dd, 10 if rep == 1 else 100)), None)], [N(S + F(1, 9))],
                  [f"Es geométrica con a₁ = {txt.split(' + ')[0]} y r = {N(r)}; |r| < 1.", f"S = a₁/(1 − r) = {N(S)}."], "Una suma infinita puede ser finita si |r| < 1.")
    a1 = rng.choice([1, 2, 3, 4, 6, 8, 9, 10, 12])
    r = rng.choice([F(1, 2), F(1, 3), F(-1, 2), F(2, 3), F(1, 4), F(3, 4), F(-1, 3)]) if d == 1 else rng.choice([F(1, 2), F(2), F(1, 3), F(-1, 2), F(3), F(3, 2), F(-2)])
    ts = ", ".join(N(a1 * r ** k) for k in range(3))
    if abs(r) < 1:
        S = a1 / (1 - r)
        return mk(f"Calcula la suma de todos los términos de la progresión geométrica {ts}, …", N(S), "t5_suma_inf",
                  [("No existe: la suma es infinita", "siempre_infinita"), (N(a1 / (1 + r)), None), (N(a1 * r / (1 - r)), None)], [N(S + 1)],
                  [f"r = {N(r)} y |r| < 1: la suma existe.", f"S = a₁/(1 − r) = {N(a1)}/(1 − ({N(r)})) = {N(S)}."], "La suma infinita existe solo si |r| < 1: S = a₁/(1 − r).")
    return mk(f"Calcula la suma de todos los términos de la progresión geométrica {ts}, …", "No existe: la suma es infinita", "t5_suma_inf",
              [(N(a1 / (1 - r)), "aplica_r_mayor"), ("0", None), (N(a1 * r), None)], [N(a1)],
              [f"r = {N(r)} y |r| ≥ 1: los términos no se hacen pequeños.", "La suma de infinitos términos no es un número: no existe."],
              "Con |r| ≥ 1 la fórmula a₁/(1 − r) no se puede usar.")


# ================================================================ ANA: utilidades de expresión

def cb(c, body, espacio=False):
    """Término |c|·body (sin signo) con la convención: 3x²/2, 4 ln|x|, √x/2, e^x."""
    c = abs(F(c))
    sep = " " if espacio else ""
    if c.denominator == 1:
        return body if c == 1 else f"{c.numerator}{sep}{body}"
    return (body if c.numerator == 1 else f"{c.numerator}{sep}{body}") + f"/{c.denominator}"


def suma(ts):
    """ts: [(coef, cuerpo_ya_formateado_sin_signo)] → suma con signos."""
    out = ""
    for c, b in ts:
        c = F(c)
        if c == 0:
            continue
        if not out:
            out = ("−" if c < 0 else "") + b
        else:
            out += (" − " if c < 0 else " + ") + b
    return out or "0"


def potx(e):
    return "x" + sp(e)


def tfmt(kind, c, e=1):
    """Cuerpo de un término de función potencial (sin signo)."""
    c = F(c)
    a = abs(c)
    if kind == "pow":
        return _body(a, potx(e)) if e else N(a)
    if kind == "rec":  # c/x^e
        den = ("" if a.denominator == 1 else str(a.denominator)) + potx(e)
        num = str(a.numerator)
        return f"{num}/{den}" if a.denominator == 1 else f"{num}/({den})"
    if kind == "sqrt":  # c√x
        return cb(a, "√x")
    if kind == "rsqrt":  # c/√x
        den = ("" if a.denominator == 1 else str(a.denominator)) + "√x"
        return f"{a.numerator}/{den}" if a.denominator == 1 else f"{a.numerator}/({den})"
    return N(a)


ORD = {"pow": 0, "sqrt": 1, "const": 2, "rec": 3, "rsqrt": 4}


def fsum(ts):
    """ts: [(kind, coef, exp)] ordenados canónicamente."""
    ts = [t for t in ts if F(t[1]) != 0]
    ts.sort(key=lambda t: (ORD[t[0]], -t[2] if t[0] == "pow" else t[2]))
    return suma([(c, tfmt(k, c, e)) for k, c, e in ts])


def deriv_terms(ts, err=None):
    out = []
    for k, c, e in ts:
        c = F(c)
        if k == "pow":
            if err == "no_baja":
                out.append(("pow", c, e - 1) if e > 1 else ("const", c, 0))
            else:
                out.append(("pow", c * e, e - 1) if e > 1 else ("const", c * e, 0))
        elif k == "const":
            if err == "constante":
                out.append(("const", c, 0))
        elif k == "rec":
            if err == "raiz_rec":
                out.append(("rec", c / e, e - 1) if e > 1 else ("const", c, 0))
            else:
                out.append(("rec", -c * e, e + 1))
        elif k == "sqrt":
            if err == "raiz_rec":
                out.append(("const", c, 0))
            else:
                out.append(("rsqrt", c / 2, 0))
    # agrupar constantes
    cst = sum(F(c) for k, c, e in out if k == "const")
    out = [t for t in out if t[0] != "const"] + ([("const", cst, 0)] if cst else [])
    return out


# ================================================================ ANA.DER

@generador("t5_derivada_def")
def gen_derivada_def(rng, d):
    if d == 3 and rng.random() < 0.4:
        k = nz(rng, -6, 6)
        p = nz(rng, -4, 4)
        r = F(-k, p * p)
        f = f"f(x) = {N(k)}/x"
        return mk(f"Calcula, usando la definición de derivada, f′({N(p)}) para {f}", N(r), "t5_derivada_def",
                  [("1", "f_mas_h"), (N(F(k, p)), None), (N(-r), None)], [N(r * 2)],
                  [f"f′({N(p)}) = lím h→0 [f({N(p)} + h) − f({N(p)})]/h = lím {N(k)}·[1/({N(p)} + h) − 1/{N(p)}]/h.", f"Opero la resta de fracciones, simplifico h y queda {N(k)}·(−1/{N(p * p)}) = {N(r)}."],
                  "La derivada es el límite del cociente incremental: se simplifica la h antes de hacer h → 0.")
    a, b, c = (nz(rng, -3, 3), rng.randint(-5, 5), rng.randint(-5, 5)) if d > 1 else (0, nz(rng, -6, 6), rng.randint(-5, 5))
    if d > 1 and a == 0:
        a = 1
    p = rng.randint(-3, 4)
    co = {2: a, 1: b, 0: c}
    r = 2 * a * p + b
    return mk(f"Calcula, usando la definición de derivada, f′({N(p)}) para f(x) = {P(co)}", N(r), "t5_derivada_def",
              [("1", "f_mas_h"), (N(a * (2 * p + 1) + b), "simplifica_h"), (N(pev(co, p)), None)], [N(r + 1), N(-r) if r else "2"],
              [f"f({N(p)} + h) − f({N(p)}) = {P({2: a, 1: 2 * a * p + b})}".replace("x", "h") + ".", f"Divido entre h: {P({1: a, 0: 2 * a * p + b})}".replace("x", "h") + f"; con h → 0 queda {N(r)}."],
              "Hay que calcular f(a + h) sustituyendo x por (a + h) en toda la fórmula; la h solo se simplifica cuando es factor común.")


@generador("t5_derivada_potencias")
def gen_derivada_potencias(rng, d):
    ts = []
    for e in rng.sample([2, 3, 4, 5], 2 if d == 1 else 1):
        ts.append(("pow", nz(rng, -6, 6), e))
    ts.append(("pow", nz(rng, -9, 9), 1))
    if d >= 2:
        ts.append(("rec", nz(rng, -5, 5), rng.randint(1, 2)))
    if d == 3:
        ts.append(("sqrt", rng.choice([1, 2, 3, 4, -2, 6]), 0))
    ts.append(("const", nz(rng, -9, 9), 0))
    f = fsum(ts)
    der = fsum(deriv_terms(ts))
    dist = [(f"f′(x) = {fsum(deriv_terms(ts, 'no_baja'))}", "no_baja_exponente"), (f"f′(x) = {fsum(deriv_terms(ts, 'constante'))}", "deriva_constante")]
    if d >= 2:
        dist.append((f"f′(x) = {fsum(deriv_terms(ts, 'raiz_rec'))}", "raiz_rec"))
    dist.append((f"f′(x) = {fsum([(k, -c if k == 'rec' else c, e) for k, c, e in deriv_terms(ts)])}" if d > 1 else f"f′(x) = {fsum(deriv_terms([(k, c, e + 1) if k == 'pow' else (k, c, e) for k, c, e in ts]))}", None))
    return mk(f"Deriva: f(x) = {f}", f"f′(x) = {der}", "t5_derivada", dist, [f"f′(x) = {fsum(deriv_terms(ts) + [('const', 1, 0)])}"],
              ["Derivo término a término: (xⁿ)′ = n·xⁿ⁻¹; la constante da 0.", "Escribo 1/xⁿ = x⁻ⁿ y √x = x^(1/2) para aplicar la misma regla.", f"f′(x) = {der}."],
              "Regla de la potencia para cualquier exponente: (1/x)′ = −1/x², (√x)′ = 1/(2√x).")


@generador("t5_tangente")
def gen_tangente(rng, d):
    co = {3: rng.choice([1, -1, 2]), 1: rng.randint(-4, 4), 0: rng.randint(-4, 4)} if d > 1 else {2: rng.choice([1, -1, 2]), 1: rng.randint(-4, 4), 0: rng.randint(-4, 4)}
    if d == 3:
        co[2] = rng.randint(-3, 3)
    a = rng.randint(-2, 3)
    fa = pev(co, a)
    m = pev(pder(co), a)
    resp = expl_y(m, fa - m * a)
    return mk(f"Halla la recta tangente a f(x) = {P(co)} en x = {N(a)}", resp, "t5_tangente",
              [(expl_y(fa, fa - fa * a), "pendiente_fa") if fa != m else (expl_y(m + 1, fa - (m + 1) * a), None), (expl_y(m, fa + m * a), None), (expl_y(-m, fa + m * a), None)],
              [expl_y(m, fa), expl_y(1 / m if m else 1, fa)],
              [f"Punto de tangencia: f({N(a)}) = {N(fa)}.", f"Pendiente: f′(x) = {P(pder(co))}, f′({N(a)}) = {N(m)}.", f"y − ({N(fa)}) = {N(m)}(x − ({N(a)})) → {resp}."],
              "La pendiente de la tangente es f′(a) (un número), y el punto es (a, f(a)).")


@generador("t5_derivada_prod_coc")
def gen_derivada_prod_coc(rng, d):
    if d == 1:
        f = {2: 1, 0: nz(rng, -5, 5)}
        g = {1: nz(rng, -4, 4), 0: rng.randint(-5, 5)}
        der = padd(pmul(pder(f), g), pmul(f, pder(g)))
        return mk(f"Deriva: f(x) = ({P(f)})({P(g)})", f"f′(x) = {P(der)}", "t5_derivada",
                  [(f"f′(x) = {P(pmul(pder(f), pder(g)))}", "producto_derivadas"), (f"f′(x) = {P(padd(pmul(pder(f), g), pmul(f, pder(g)), -1))}", None), (f"f′(x) = {P(pmul(pder(f), g))}", None)],
                  [f"f′(x) = {P(padd(der, {0: 1}))}"], ["(f·g)′ = f′·g + f·g′.", f"f′(x) = {P(der)}."], "La derivada de un producto NO es el producto de las derivadas.")
    if d == 2:
        a, b, c, e = nz(rng, -4, 4), rng.randint(-5, 5), rng.choice([1, 2]), nz(rng, -5, 5)
        if a * e - b * c == 0:
            b += 1
        num = a * e - b * c
        den = P({1: c, 0: e})
        resp = f"f′(x) = {N(num)}/({den})²"
        return mk(f"Deriva: f(x) = ({P({1: a, 0: b})})/({den})", resp, "t5_derivada",
                  [(f"f′(x) = {N(-num)}/({den})²", "orden_cociente"), (f"f′(x) = {N(num)}/({den})", "sin_cuadrado"), (f"f′(x) = {N(F(a, c))}", "producto_derivadas")], [f"f′(x) = {N(num + 1)}/({den})²"],
                  ["(f/g)′ = (f′·g − f·g′)/g².", f"Numerador: {N(a)}·({den}) − ({P({1: a, 0: b})})·{N(c)} = {N(num)}.", f"{resp}."],
                  "En el cociente el orden importa (f′g − fg′) y el denominador va al cuadrado.")
    a, b = nz(rng, -5, 5), nz(rng, -4, 4)
    f = {2: 1, 0: a}
    g = {1: 1, 0: -b}
    num = padd(pmul(pder(f), g), pmul(f, pder(g)), -1)
    den = f"({P(g)})²"
    resp = f"f′(x) = ({P(num)})/{den}"
    return mk(f"Deriva: f(x) = ({P(f)})/({P(g)})", resp, "t5_derivada",
              [(f"f′(x) = ({P(pscale(num, -1))})/{den}", "orden_cociente"), (f"f′(x) = ({P(num)})/({P(g)})", "sin_cuadrado"), (f"f′(x) = {P(pder(f))}", "producto_derivadas")], [f"f′(x) = ({P(padd(num, {0: 1}))})/{den}"],
              ["(f/g)′ = (f′·g − f·g′)/g².", f"f′·g − f·g′ = 2x({P(g)}) − ({P(f)})·1 = {P(num)}.", f"{resp}."],
              "En el cociente el orden importa (f′g − fg′) y el denominador va al cuadrado.")


def _fn(nombre, arg):
    return f"{nombre} x" if arg == "x" else f"{nombre}({arg})"


@generador("t5_cadena")
def gen_cadena(rng, d):
    tipo = rng.choice(["pot", "raiz"]) if d == 1 else rng.choice(["exp", "ln", "raiz", "pot"]) if d == 2 else rng.choice(["sen", "cos", "exp", "ln"])
    if tipo == "pot":
        a, b, n = rng.choice([2, 3, 4, 5, -2]), nz(rng, -6, 6), rng.randint(2, 7)
        u = P({1: a, 0: b})
        f = f"({u}){sp(n)}"
        resp = f"{N(n * a)}({u}){sp(n - 1)}"
        dist = [(f"{n}({u}){sp(n - 1)}", "olvida_interior"), (f"{N(n * a)}({u}){sp(n)}", None), (f"{N(n * a)}x{sp(n - 1)}", "deriva_dentro")]
    elif tipo == "raiz":
        p, q = nz(rng, -6, 6), rng.randint(-5, 5)
        u = P({2: 1, 1: p, 0: q})
        f = f"√({u})"
        resp = f"({P({1: 2, 0: p})})/(2√({u}))"
        dist = [(f"1/(2√({u}))", "olvida_interior"), (f"√({P({1: 2, 0: p})})", "deriva_dentro"), (f"({P({1: 2, 0: p})})/√({u})", None)]
    elif tipo == "exp":
        p, q = nz(rng, -5, 5), rng.randint(0, 3)
        u = P({2: q, 1: p}) if q else P({1: p, 0: rng.randint(-5, 5)})
        du = P({1: 2 * q, 0: p}) if q else N(p)
        f = f"e^({u})"
        resp = f"{par(du)}·e^({u})" if q else f"{N(p)}·e^({u})"
        dist = [(f"e^({u})", "olvida_interior"), (f"e^({du})", "deriva_dentro"), (f"({u})·e^({u})", None)]
    elif tipo == "ln":
        p, q = nz(rng, -5, 5), nz(rng, 1, 9)
        u = P({2: 1, 1: p, 0: q})
        f = f"ln({u})"
        resp = f"({P({1: 2, 0: p})})/({u})"
        dist = [(f"1/({u})", "olvida_interior"), (f"ln({P({1: 2, 0: p})})", "deriva_dentro"), (f"({P({1: 2, 0: p})})·ln({u})", None)]
    else:
        a, e = rng.randint(1, 5), rng.choice([2, 3])
        u = _body(a, potx(e))
        du = _body(a * e, potx(e - 1))
        if tipo == "sen":
            f = f"sen({u})"
            resp = f"{du}·cos({u})"
            dist = [(f"cos({u})", "olvida_interior"), (f"sen({du})", "deriva_dentro"), (f"−{du}·cos({u})", None)]
        else:
            f = f"cos({u})"
            resp = f"−{du}·sen({u})"
            dist = [(f"−sen({u})", "olvida_interior"), (f"cos({du})", "deriva_dentro"), (f"{du}·sen({u})", None)]
    return mk(f"Deriva: f(x) = {f}", f"f′(x) = {resp}", "t5_derivada", [(f"f′(x) = {v}", k) for v, k in dist], [],
              ["Regla de la cadena: derivada de la función de fuera evaluada en la de dentro, POR la derivada de la de dentro.", f"f′(x) = {resp}."],
              "(f(g(x)))′ = f′(g(x))·g′(x): no olvidar multiplicar por la derivada interior.")


@generador("t5_derivada_elementales")
def gen_derivada_elementales(rng, d):
    a = rng.randint(2, 9)
    tipo = rng.choice(["exp", "ax", "lnax"]) if d == 1 else rng.choice(["ln2", "log", "sen", "cos"]) if d == 2 else rng.choice(["tg", "cos", "ln2", "exp", "ax"])
    if tipo == "exp":
        f, resp = f"e^({a}x)", f"{a}·e^({a}x)"
        dist = [(f"{a}x·e^({a}x − 1)", "exp_potencia"), (f"e^({a}x)", None), (f"e^({a})", None)]
    elif tipo == "ax":
        f, resp = f"{a}^x", f"{a}^x·ln {a}"
        dist = [(f"x·{a}^(x − 1)", "exp_potencia"), (f"{a}^x", None), (f"{a}^x/ln {a}", None)]
    elif tipo == "lnax":
        f, resp = f"ln({a}x)", "1/x"
        dist = [(f"1/ln({a}x)", "ln_inverso"), (f"1/({a}x)", None), (f"{a}/x", None)]
    elif tipo == "ln2":
        f, resp = f"ln(x² + {a})", f"2x/(x² + {a})"
        dist = [(f"1/ln(x² + {a})", "ln_inverso"), (f"1/(x² + {a})", None), (f"2x·ln(x² + {a})", None)]
    elif tipo == "log":
        f, resp = f"log{sub(a)} x", f"1/(x·ln {a})"
        dist = [(f"1/log{sub(a)} x", "ln_inverso"), ("1/x", None), (f"ln {a}/x", None)]
    elif tipo == "sen":
        f, resp = f"sen({a}x)", f"{a}·cos({a}x)"
        dist = [(f"cos({a}x)", None), (f"−{a}·cos({a}x)", None), (f"{a}·sen({a}x)", None)]
    elif tipo == "cos":
        f, resp = f"cos({a}x)", f"−{a}·sen({a}x)"
        dist = [(f"{a}·sen({a}x)", "signo_coseno"), (f"−sen({a}x)", None), (f"−{a}·cos({a}x)", None)]
    else:
        f, resp = f"tg({a}x)", f"{a}/cos²({a}x)"
        dist = [(f"1/cos²({a}x)", None), (f"{a}·tg({a}x)", None), (f"−{a}/cos²({a}x)", None)]
    return mk(f"Deriva: f(x) = {f}", f"f′(x) = {resp}", "t5_derivada", [(f"f′(x) = {v}", k) for v, k in dist], [],
              ["(eˣ)′ = eˣ; (aˣ)′ = aˣ·ln a; (ln x)′ = 1/x; (sen x)′ = cos x; (cos x)′ = −sen x; (tg x)′ = 1/cos² x.", "Con la regla de la cadena multiplico por la derivada del argumento.", f"f′(x) = {resp}."],
              "eˣ no es una potencia de x: no se baja el exponente. La derivada del coseno lleva signo menos.")


@generador("t5_derivabilidad")
def gen_derivabilidad(rng, d):
    if d == 3 and rng.random() < 0.5:
        p = rng.randint(-4, 4)
        if rng.random() < 0.5:
            f = f"f(x) = |{P({1: 1, 0: -p})}|"
            resp = f"No: es continua en x = {N(p)} pero sus derivadas laterales (−1 y 1) no coinciden"
            dist = [(f"Sí: es continua en x = {N(p)}, luego es derivable", "continua_derivable"), (f"No: no es continua en x = {N(p)}", None), (f"Sí: sus derivadas laterales valen 1", None)]
        else:
            k = nz(rng, -4, 4)
            f = f"f(x) = {{2x si x ≤ {N(p)}; 2x {'+' if k > 0 else '−'} {abs(k)} si x ﹥ {N(p)}}}".replace("﹥", ">")
            resp = f"No: no es continua en x = {N(p)}"
            dist = [(f"Sí: las derivadas laterales valen 2 las dos", "olvida_continuidad"), (f"No: las derivadas laterales no coinciden", None), (f"Sí: es continua, luego es derivable", "continua_derivable")]
        return mk(f"¿Es derivable {f} en x = {N(p)}?", resp, "t5_derivabilidad", dist, [],
                  ["Derivable en un punto exige: continua en él Y derivadas laterales iguales.", f"{resp}."], "Derivable ⇒ continua, pero continua no implica derivable (|x| en 0).")
    for _ in range(200):
        p = nz(rng, -3, 3)
        a, b = nz(rng, -3, 3), rng.randint(-5, 5)
        m = 2 * a * p
        n = a * p * p + b - m * p
        break
    f = f"f(x) = {{ax² + b si x ≤ {N(p)}; {P({1: m, 0: n})} si x > {N(p)}}}"
    resp = f"a = {N(a)}, b = {N(b)}"
    a2 = F(m - 0, 1)
    return mk(f"Halla a y b para que {f} sea derivable en x = {N(p)}", resp, "t5_derivabilidad",
              [(f"a = {N(a)}, b = {N(n)}", "olvida_continuidad"), (f"a = {N(F(m, p))}, b = {N(b)}" if F(m, p) != a else f"a = {N(-a)}, b = {N(b)}", None), (f"a = {N(b)}, b = {N(a)}" if a != b else f"a = {N(a)}, b = {N(-b)}", None)],
              [f"a = {N(a + 1)}, b = {N(b)}"],
              [f"Derivadas laterales iguales en x = {N(p)}: 2a·({N(p)}) = {N(m)} → a = {N(a)}.", f"Continuidad en x = {N(p)}: a·{N(p * p)} + b = {N(m * p + n)} → b = {N(b)}."],
              "Para que sea derivable hay que imponer las DOS condiciones: continuidad y derivadas laterales iguales.")


# ================================================================ ANA.APLDER

def _cubica(rng, d):
    for _ in range(200):
        r1, r2 = sorted(rng.sample(range(-4, 5), 2))
        k = rng.choice([1, 1, -1]) if d > 1 else 1
        # f′ = 6k(x − r1)(x − r2) → f = k(2x³ − 3(r1 + r2)x² + 6 r1 r2 x) + c
        c = rng.randint(-5, 5)
        co = {3: 2 * k, 2: -3 * k * (r1 + r2), 1: 6 * k * r1 * r2, 0: c}
        if (r1 + r2) % 2 == 0 and rng.random() < 0.6:
            co = {3: k, 2: -F(3 * k * (r1 + r2), 2), 1: 3 * k * r1 * r2, 0: c}
        if all(F(v).denominator == 1 for v in co.values()):
            return co, r1, r2, k


@generador("t5_monotonia")
def gen_monotonia(rng, d):
    if d == 3 and rng.random() < 0.5:
        a = rng.randint(1, 5)
        f = f"f(x) = x + {a * a}/x"
        resp = f"Crece en {union(intervalo(None, -a), intervalo(a, None))} y decrece en {union(intervalo(-a, 0), intervalo(0, a))}"
        return mk(f"Estudia la monotonía de {f}", resp, "t5_monotonia",
                  [(f"Crece en {union(intervalo(None, -a), intervalo(a, None))} y decrece en {intervalo(-a, a)}", "olvida_dominio"),
                   (f"Decrece en {union(intervalo(None, -a), intervalo(a, None))} y crece en {union(intervalo(-a, 0), intervalo(0, a))}", None),
                   (f"Crece en {intervalo(0, None)} y decrece en {intervalo(None, 0)}", "signo_f")], [],
                  [f"f′(x) = 1 − {a * a}/x² = (x² − {a * a})/x²; se anula en x = ±{a} y no existe en x = 0.", "Estudio el signo de f′ en los intervalos que separan −a, 0 y a (el 0 no está en el dominio).", f"{resp}."],
                  "Los puntos fuera del dominio también separan intervalos de monotonía.")
    co, r1, r2, k = _cubica(rng, d)
    fuera = union(intervalo(None, r1), intervalo(r2, None))
    dentro = intervalo(r1, r2)
    T = lambda cre, dec: f"Crece en {cre} y decrece en {dec}"
    resp = T(fuera, dentro) if k > 0 else T(dentro, fuera)
    rs = _cuad(1, 0, 0)
    return mk(f"Estudia la monotonía de f(x) = {P(co)}", resp, "t5_monotonia",
              [(T(dentro, fuera) if k > 0 else T(fuera, dentro), None), (T(intervalo(r1, None), intervalo(None, r1)), "signo_f"), (T(intervalo(r2, None), intervalo(None, r2)), None)], [],
              [f"f′(x) = {P(pder(co))} se anula en x = {N(r1)} y x = {N(r2)}.", "Estudio el signo de f′ en cada intervalo: f′ > 0 crece, f′ < 0 decrece.", f"{resp}."],
              "La monotonía la decide el signo de f′ (no el de f).")


@generador("t5_extremos")
def gen_extremos(rng, d):
    if d == 1:
        a = rng.choice([1, 2, -1, -2, 3])
        h, kk = rng.randint(-4, 4), rng.randint(-6, 6)
        co = {2: a, 1: -2 * a * h, 0: a * h * h + kk}
        tipo = "Mínimo" if a > 0 else "Máximo"
        otro = "Máximo" if a > 0 else "Mínimo"
        return mk(f"Halla los extremos relativos de f(x) = {P(co)}", f"{tipo} en {pt(h, kk)}", "t5_extremos",
                  [(f"{otro} en {pt(h, kk)}", "clasificacion_invertida"), (f"{tipo} en x = {N(h)}", "solo_x"), (f"{tipo} en {pt(-h, kk)}", None)], [],
                  [f"f′(x) = {P(pder(co))} = 0 → x = {N(h)}.", f"f″ = {N(2 * a)} {'> 0: mínimo' if a > 0 else '< 0: máximo'}. f({N(h)}) = {N(kk)}."],
                  "Un extremo es un punto (x, f(x)); f″ > 0 es mínimo y f″ < 0 máximo.")
    if d == 3 and rng.random() < 0.3:
        c = rng.randint(-6, 6)
        k = rng.choice([1, 2, -1, 3])
        f = P({3: k, 0: c})
        return mk(f"Halla los extremos relativos de f(x) = {f}", "No tiene extremos relativos", "t5_extremos",
                  [(f"{'Mínimo' if k > 0 else 'Máximo'} en {pt(0, c)}", "todo_cero_extremo"), (f"{'Máximo' if k > 0 else 'Mínimo'} en {pt(0, c)}", "todo_cero_extremo"), ("Máximo en x = 0", "solo_x")], [],
                  [f"f′(x) = {P({2: 3 * k})} = 0 solo en x = 0.", "Pero f′ no cambia de signo en 0: no hay extremo (es un punto de inflexión)."],
                  "f′(a) = 0 no basta: tiene que haber cambio de signo de f′.")
    co, r1, r2, k = _cubica(rng, d)
    y1, y2 = pev(co, r1), pev(co, r2)
    if k > 0:
        resp = f"Máximo en {pt(r1, y1)} y mínimo en {pt(r2, y2)}"
        inv = f"Mínimo en {pt(r1, y1)} y máximo en {pt(r2, y2)}"
        sx = f"Máximo en x = {N(r1)} y mínimo en x = {N(r2)}"
    else:
        resp = f"Mínimo en {pt(r1, y1)} y máximo en {pt(r2, y2)}"
        inv = f"Máximo en {pt(r1, y1)} y mínimo en {pt(r2, y2)}"
        sx = f"Mínimo en x = {N(r1)} y máximo en x = {N(r2)}"
    return mk(f"Halla los extremos relativos de f(x) = {P(co)}", resp, "t5_extremos",
              [(inv, "clasificacion_invertida"), (sx, "solo_x"), (resp.replace(pt(r1, y1), pt(r1, y2)).replace(pt(r2, y2), pt(r2, y1)), None)], [],
              [f"f′(x) = {P(pder(co))} = 0 → x = {N(r1)}, x = {N(r2)}.", f"Con el signo de f′ (o de f″) clasifico; f({N(r1)}) = {N(y1)}, f({N(r2)}) = {N(y2)}.", f"{resp}."],
              "f″(a) > 0 → mínimo; f″(a) < 0 → máximo. El extremo se da como punto.")


@generador("t5_inflexion")
def gen_inflexion(rng, d):
    if d < 3 or rng.random() < 0.5:
        for _ in range(200):
            a = rng.choice([1, -1, 2])
            x0 = rng.randint(-3, 3)
            b = -3 * a * x0
            c, e = rng.randint(-6, 6), rng.randint(-5, 5)
            co = {3: a, 2: b, 1: c, 0: e}
            crit = _cuad(3 * a, 2 * b, c)
            if crit and len(crit) == 2 and all(x.denominator == 1 for x in crit):
                break
        y0 = pev(co, x0)
        resp = f"Punto de inflexión en {pt(x0, y0)}"
        dist = [(f"Puntos de inflexión en {' y '.join(pt(x, pev(co, x)) for x in crit)}" if crit else None, "inflexion_fprima"), (f"Punto de inflexión en {pt(-x0, pev(co, -x0))}" if x0 else f"Punto de inflexión en {pt(1, pev(co, 1))}", None),
                (f"Punto de inflexión en {pt(x0, 0)}" if y0 else f"Punto de inflexión en {pt(x0, 1)}", None)]
        pasos = [f"f″(x) = {P(pder(pder(co)))} se anula en x = {N(x0)} y cambia de signo.", f"f({N(x0)}) = {N(y0)}: {resp}."]
    else:
        c = rng.randint(1, 3)
        k = rng.choice([1, 2, -1])
        co = {4: k, 2: -6 * k * c * c, 0: rng.randint(-5, 5)}
        pts = [pt(-c, pev(co, -c)), pt(c, pev(co, c))]
        resp = f"Puntos de inflexión en {pts[0]} y {pts[1]}"
        crit = [-math.isqrt(3) * 0]  # no se usa
        s3 = 3 * c * c
        dist = [(f"Puntos de inflexión en {pt(0, co[0])}", "inflexion_fprima"), (f"Puntos de inflexión en {pt(-c * c, pev(co, -c * c))} y {pt(c * c, pev(co, c * c))}" if c > 1 else f"Puntos de inflexión en {pt(-2, pev(co, -2))} y {pt(2, pev(co, 2))}", None),
                (f"Puntos de inflexión en {pt(-c, 0)} y {pt(c, 0)}", None)]
        pasos = [f"f″(x) = {P(pder(pder(co)))} se anula en x = ±{c} y cambia de signo en ambos.", f"{resp}."]
    return mk(f"Halla los puntos de inflexión de f(x) = {P(co)}", resp, "t5_inflexion", dist, [], pasos,
              "Los puntos de inflexión se buscan con f″ (cambio de curvatura), no con f′.")


@generador("t5_rolle_tvm")
def gen_rolle_tvm(rng, d):
    if d == 3 and rng.random() < 0.4:
        p, k = rng.randint(-3, 3), rng.randint(1, 4)
        return mk(f"¿Se puede aplicar el teorema de Rolle a f(x) = |{P({1: 1, 0: -p})}| en [{N(p - k)}, {N(p + k)}]?", f"No: f no es derivable en x = {N(p)}", "t5_rolle",
                  [(f"Sí: f({N(p - k)}) = f({N(p + k)}) y el punto es c = {N(p)}", "sin_hipotesis"), (f"No: f no es continua en x = {N(p)}", None), ("Sí: f es continua en el intervalo", "sin_hipotesis")], [],
                  ["Rolle exige: continua en [a, b], derivable en (a, b) y f(a) = f(b).", f"|x − {N(p)}| tiene un pico en x = {N(p)}: no es derivable ahí, así que no se puede aplicar."],
                  "Antes de aplicar un teorema hay que comprobar TODAS sus hipótesis.")
    for _ in range(200):
        a = rng.choice([1, 2, -1, 3])
        bb = rng.randint(-6, 6)
        c0 = rng.randint(-5, 5)
        co = {2: a, 1: bb, 0: c0}
        if d == 1:
            v = F(-bb, 2 * a)
            if v.denominator != 1:
                continue
            L = rng.randint(1, 4)
            A, B = v - L, v + L
            teorema = "Rolle"
        else:
            A = rng.randint(-4, 2)
            B = A + rng.randint(2, 6)
            teorema = "del valor medio"
        c = F(A + B, 2)
        raices = [r for r in (_cuad(a, bb, c0) or []) if A < r < B]
        break
    dist = [(f"c = {N(raices[0])}" if raices else None, "confunde_bolzano"), (f"c = {N(A)}", None), (f"c = {N(-bb, ) if False else F(-bb, 2 * a) + 1}" if F(-bb, 2 * a) + 1 != c else f"c = {N(c + 1)}", None)]
    dist[2] = (f"c = {N(c + 1)}", None)
    return mk(f"Aplica el teorema {'de Rolle' if teorema == 'Rolle' else 'del valor medio'} a f(x) = {P(co)} en [{N(A)}, {N(B)}] y halla el punto c.", f"c = {N(c)}", "t5_rolle",
              dist, [f"c = {N(c - 1)}", f"c = {N(B)}"],
              ["f es polinómica: continua y derivable, se cumplen las hipótesis.",
               (f"f({N(A)}) = f({N(B)}) = {N(pev(co, A))}; busco c con f′(c) = 0." if teorema == "Rolle" else f"Busco c con f′(c) = (f({N(B)}) − f({N(A)}))/({N(B)} − ({N(A)})) = {N((pev(co, B) - pev(co, A)) / (B - A))}."),
               f"f′(c) = {N(2 * a)}c {'+' if bb >= 0 else '−'} {abs(bb)} → c = {N(c)}."],
              "Rolle y valor medio hablan de la DERIVADA (f′(c) = 0 o pendiente media); Bolzano habla de f(c) = 0.")


@generador("t5_parametros_funcion")
def gen_parametros_funcion(rng, d):
    if d == 1:
        p, q = rng.randint(-4, 4), rng.randint(-6, 6)
        a, b = -2 * p, q + p * p
        return mk(f"Halla a y b para que f(x) = x² + ax + b tenga un mínimo en el punto {pt(p, q)}", f"a = {N(a)}, b = {N(b)}", "t5_parametros",
                  [(f"a = {N(-a)}, b = {N(q - p * p)}", None), (f"a = 0, b = {N(q - p * p) if p else q + 1}", "extremo_solo_punto"), (f"a = {N(a)}, b = {N(q)}", None)], [f"a = {N(a + 1)}, b = {N(b)}"],
                  [f"Extremo en x = {N(p)}: f′({N(p)}) = 2·({N(p)}) + a = 0 → a = {N(a)}.", f"Pasa por {pt(p, q)}: {N(p * p)} + ({N(a)})·({N(p)}) + b = {N(q)} → b = {N(b)}."],
                  "'Extremo en (p, q)' da DOS condiciones: f′(p) = 0 y f(p) = q.")
    for _ in range(200):
        s, p = rng.sample(range(-3, 4), 2)
        c0 = rng.randint(-5, 5)
        a = -3 * s
        b = -3 * p * p - 2 * a * p
        a2 = F(-3 * (s + p), 2)
        b2 = 3 * s * p
        if a2 != a:
            break
    resp = f"a = {N(a)}, b = {N(b)}, c = {N(c0)}"
    return mk(f"Halla a, b y c para que f(x) = x³ + ax² + bx + c pase por {pt(0, c0)}, tenga un extremo en x = {N(p)} y un punto de inflexión en x = {N(s)}", resp, "t5_parametros",
              [(f"a = {N(a2)}, b = {N(b2)}, c = {N(c0)}", "inflexion_con_fprima"), (f"a = {N(-a)}, b = {N(b)}, c = {N(c0)}", None), (f"a = {N(a)}, b = {N(-b)}, c = {N(c0)}" if b else f"a = {N(a)}, b = 1, c = {N(c0)}", None)],
              [f"a = {N(a)}, b = {N(b)}, c = 0" if c0 else f"a = {N(a)}, b = {N(b)}, c = 1"],
              [f"f(0) = {N(c0)} → c = {N(c0)}.", f"Inflexión: f″({N(s)}) = 6·({N(s)}) + 2a = 0 → a = {N(a)}.", f"Extremo: f′({N(p)}) = 3·{N(p * p)} + 2a·({N(p)}) + b = 0 → b = {N(b)}."],
              "Cada dato se traduce en una ecuación: pasa por un punto → f; extremo → f′ = 0; inflexión → f″ = 0.")


# ================================================================ ANA.CONT

CONT_OPC = {"si": "Sí, es continua", "nofa": "No: no existe f(a)", "nolim": "No: no existe el límite", "nocoin": "No: el límite no coincide con f(a)"}


@generador("t5_continuidad_punto")
def gen_continuidad_punto(rng, d):
    a = rng.randint(-4, 4)
    tipo = rng.choice(["evit", "poly", "salto"]) if d == 1 else rng.choice(["evit", "nocoin", "salto", "asint", "poly"])
    if tipo == "evit":
        f = f"f(x) = ({P({2: 1, 0: -a * a})})/{fac(a)}" if a else "f(x) = (x² + 3x)/x"
        caso, err = "nofa", {"si": "solo_limite"}
    elif tipo == "poly":
        b = a + rng.choice([1, 2, -1, 3])
        f = f"f(x) = ({P({2: 1, 0: rng.randint(-5, 5)})})/{fac(b)}"
        caso, err = "si", {}
    elif tipo == "nocoin":
        q = a * a + nz(rng, -4, 4)
        f = f"f(x) = {{x² si x ≠ {N(a)}; {N(q)} si x = {N(a)}}}"
        caso, err = "nocoin", {"si": "solo_fa"}
    elif tipo == "salto":
        k = nz(rng, -4, 4)
        f = f"f(x) = {{x + {N(k)} si x ≤ {N(a)}; x si x ﹥ {N(a)}}}".replace("+ −", "− ").replace("﹥", ">")
        caso, err = "nolim", {"si": "solo_fa"}
    else:
        f = f"f(x) = 1/{fac(a)}" if a else "f(x) = 1/x"
        caso, err = "nofa", {}
    resp = CONT_OPC[caso]
    dist = [(v, err.get(k)) for k, v in CONT_OPC.items() if k != caso]
    return mk(f"¿Es continua {f} en x = {N(a)}?", resp, "t5_continuidad", dist, [],
              ["Continua en a ⇔ existe f(a), existe el límite en a y coinciden.", {"si": "Se cumplen las tres condiciones.", "nofa": f"La función no está definida en x = {N(a)}.",
                                                                                 "nolim": "Los límites laterales son distintos: no existe el límite.", "nocoin": "El límite existe pero vale distinto que f(a)."}[caso]],
              "Hay que comprobar las TRES condiciones; no basta con que exista f(a) ni con que exista el límite.")


@generador("t5_continuidad_param")
def gen_continuidad_param(rng, d):
    p = nz(rng, -3, 3) if d > 1 else rng.randint(1, 3)
    m, n = nz(rng, -4, 4), rng.randint(-6, 6)
    tipo = rng.choice(["a_izq", "a_der"]) if d > 1 else "a_izq"
    if tipo == "a_izq":
        a = m * p + n - p * p
        f = f"f(x) = {{x² + a si x ≤ {N(p)}; {P({1: m, 0: n})} si x > {N(p)}}}"
        e1 = n  # iguala fórmulas en x = 0
    else:
        k = rng.randint(2, 4)
        a = F(p * p + n - m * p, k) if False else None
        # a·x + n si x < p ; x² − a si x ≥ p  → a p + n = p² − a → a = (p² − n)/(p + 1)
        if p + 1 == 0:
            p = 2
        a = F(p * p - n, p + 1)
        f = f"f(x) = {{ax {'+' if n >= 0 else '−'} {abs(n)} si x < {N(p)}; x² − a si x ≥ {N(p)}}}"
        e1 = F(-n)
    return mk(f"Halla a para que {f} sea continua en x = {N(p)}", f"a = {N(a)}", "t5_continuidad_param",
              [(f"a = {N(e1)}" if e1 != a else None, "iguala_sin_evaluar"), (f"a = {N(-a)}" if a else "a = 1", None), (f"a = {N(a + 1)}", "un_lateral")], [f"a = {N(a - 1)}"],
              [f"Calculo los límites laterales en x = {N(p)} sustituyendo x = {N(p)} en cada fórmula.", f"Los igualo (y coinciden con f({N(p)})): a = {N(a)}."],
              "La condición de continuidad se plantea con los valores en el punto de cambio, no igualando las fórmulas en general.")


DISC_OPC = {"ev": "Evitable", "sf": "De salto finito", "si": "De salto infinito (asintótica)", "cont": "Es continua en ese punto"}


@generador("t5_tipo_discontinuidad")
def gen_tipo_discontinuidad(rng, d):
    a = rng.randint(-4, 4)
    tipo = rng.choice(["ev", "sf", "si"]) if d < 3 else rng.choice(["ev", "sf", "si", "cont", "ev2"])
    if tipo == "ev":
        b = nz(rng, -5, 5, (a,))
        f = f"f(x) = ({P(proots([a, b]))})/{fac(a)}"
        caso = "ev"
    elif tipo == "ev2":
        q = a * a + nz(rng, -3, 3)
        f = f"f(x) = {{x² si x ≠ {N(a)}; {N(q)} si x = {N(a)}}}"
        caso = "ev"
    elif tipo == "sf":
        if rng.random() < 0.5:
            f = f"f(x) = |{P({1: 1, 0: -a})}|/{fac(a)}" if a else "f(x) = |x|/x"
        else:
            k = nz(rng, -4, 4)
            f = f"f(x) = {{{P({1: 2, 0: k})} si x ≤ {N(a)}; 2x si x ﹥ {N(a)}}}".replace("﹥", ">")
        caso = "sf"
    elif tipo == "si":
        k = nz(rng, -6, 6)
        f = f"f(x) = {N(k)}/{fac(a)}" if a else f"f(x) = {N(k)}/x"
        if rng.random() < 0.4:
            f = f"f(x) = {N(k)}/{fac(a)}²" if a else f"f(x) = {N(k)}/x²"
        caso = "si"
    else:
        f = f"f(x) = {P({2: 1, 1: rng.randint(-4, 4)})}"
        caso = "cont"
    resp = DISC_OPC[caso]
    err = {"sf": {"ev": "evitable_salto"}, "si": {"ev": "asintotica_evitable"}}.get(caso, {})
    return mk(f"Clasifica la discontinuidad de {f} en x = {N(a)}", resp, "t5_discontinuidad", [(v, err.get(k)) for k, v in DISC_OPC.items() if k != caso], [],
              ["Calculo los límites laterales en el punto.", {"ev": "Existe el límite (finito) pero la función no vale eso en el punto: evitable.", "sf": "Los laterales son finitos y distintos: salto finito.",
                                                            "si": "Algún lateral es infinito: salto infinito (asíntota vertical).", "cont": "No hay discontinuidad: es continua."}[caso]],
              "Evitable: existe el límite. Salto finito: laterales finitos distintos. Asintótica: algún lateral infinito.")


@generador("t5_bolzano")
def gen_bolzano(rng, d):
    if d == 3 and rng.random() < 0.5:
        if rng.random() < 0.5:
            r = rng.randint(1, 4)
            f = f"f(x) = x² − {r * r}"
            A, B = -r - rng.randint(1, 2), r + rng.randint(1, 2)
            return mk(f"En [{N(A)}, {N(B)}], {f} cumple que f({N(A)}) y f({N(B)}) tienen el mismo signo. ¿Se puede asegurar que no tiene raíces en ese intervalo?",
                      "No: Bolzano no dice nada en ese caso (de hecho tiene dos raíces)", "t5_bolzano",
                      [("Sí: si los signos son iguales no hay raíces", "mismo_signo"), ("Sí: Bolzano lo garantiza", "mismo_signo"), ("No: tiene exactamente una raíz", None)], [],
                      ["Bolzano solo asegura una raíz cuando los signos son OPUESTOS.", f"Aquí hay raíces en x = ±{r}."], "Signos iguales en los extremos no implican que no haya raíces.")
        a = rng.randint(-2, 2)
        A, B = a - rng.randint(1, 2), a + rng.randint(1, 2)
        return mk(f"¿Se puede aplicar el teorema de Bolzano a f(x) = 1/{fac(a) if a else 'x'} en [{N(A)}, {N(B)}] para asegurar que tiene una raíz?", f"No: f no es continua en x = {N(a)}", "t5_bolzano",
                  [("Sí: f cambia de signo en el intervalo", "olvida_continuidad"), ("Sí: tiene una raíz en x = " + N(a), "olvida_continuidad"), ("No: f no cambia de signo", None)], [],
                  ["Bolzano exige que f sea continua en todo el intervalo cerrado.", f"1/{fac(a) if a else 'x'} no es continua en x = {N(a)}: no se puede aplicar (y de hecho no tiene raíces)."],
                  "Sin continuidad, el cambio de signo no garantiza una raíz.")
    for _ in range(300):
        co = {3: 1, 2: rng.randint(-3, 3), 1: rng.randint(-5, 5), 0: rng.randint(-6, 6)}
        vals = {x: pev(co, x) for x in range(-4, 5)}
        cambios = [x for x in range(-4, 4) if vals[x] * vals[x + 1] < 0]
        if len(cambios) == 1 and all(v != 0 for v in vals.values()):
            break
    k = cambios[0]
    resp = intervalo(k, k + 1)
    otros = [intervalo(j, j + 1) for j in range(-4, 4) if j != k]
    rng.shuffle(otros)
    return mk(f"¿En cuál de estos intervalos tiene seguro una raíz la ecuación {P(co)} = 0?", resp, "t5_bolzano",
              [(o, None) for o in otros[:3]] + [("En ninguno", "mismo_signo")], [],
              [f"f es polinómica, continua. Calculo el signo en los extremos: f({N(k)}) = {N(vals[k])} y f({N(k + 1)}) = {N(vals[k + 1])}.", f"Signos opuestos: por Bolzano hay una raíz en {resp}."],
              "Bolzano: f continua en [a, b] y f(a)·f(b) < 0 ⇒ existe c en (a, b) con f(c) = 0.")


# ================================================================ ANA.INT

def _prim_fmt(ts):
    """ts: [(tipo, coef)] tipos: ('pow', e) potencia, 'ln', 'exp', 'sen', 'cos'. Orden fijo."""
    out = []
    for t, c in ts:
        if t[0] == "pow":
            out.append((c, _body(1, potx(t[1])) if t[1] else "1", t))
        elif t == "ln":
            out.append((c, "ln|x|", t))
        elif t == "exp":
            out.append((c, "e^x", t))
        elif t == "sen":
            out.append((c, "sen x", t))
        elif t == "cos":
            out.append((c, "cos x", t))
    def body(c, b, t):
        if t[0] == "pow":
            return _body(abs(F(c)), potx(t[1])) if t[1] else N(abs(F(c)))
        return cb(c, b, espacio=(t in ("ln", "sen", "cos")))
    orden = {"ln": 1, "exp": 2, "sen": 3, "cos": 4}
    out.sort(key=lambda o: (0, -o[2][1]) if o[2][0] == "pow" else (orden[o[2]], 0))
    return suma([(c, body(c, b, t)) for c, b, t in out if F(c) != 0])


def _integra(ts):
    r = []
    for t, c in ts:
        if t[0] == "pow":
            r.append((("pow", t[1] + 1), F(c, t[1] + 1)))
        elif t == "rec1":
            r.append(("ln", c))
        elif t == "exp":
            r.append(("exp", c))
        elif t == "sen":
            r.append(("cos", -c))
        elif t == "cos":
            r.append(("sen", c))
    return r


def _deriva_mal(ts):
    r = []
    for t, c in ts:
        if t[0] == "pow" and t[1] > 0:
            r.append((("pow", t[1] - 1), c * t[1]))
        elif t == "exp":
            r.append(("exp", c))
        elif t == "sen":
            r.append(("cos", c))
        elif t == "cos":
            r.append(("sen", -c))
    return r


def _integrando_fmt(ts):
    parts = []
    for t, c in ts:
        if t[0] == "pow":
            parts.append((c, _body(1, potx(t[1])) if t[1] else "1", "pow", t[1]))
        elif t == "rec1":
            parts.append((c, "/x", "rec", 0))
        elif t == "exp":
            parts.append((c, "e^x", "exp", 0))
        elif t == "sen":
            parts.append((c, "sen x", "trig", 0))
        elif t == "cos":
            parts.append((c, "cos x", "trig", 0))
    out = []
    for c, b, k, e in parts:
        a = abs(F(c))
        if k == "pow":
            body = _body(a, potx(e)) if e else N(a)
        elif k == "rec":
            body = f"{N(a)}/x"
        else:
            body = cb(a, b, espacio=(k == "trig"))
        out.append((c, body))
    return suma(out)


@generador("t5_primitivas")
def gen_primitivas(rng, d):
    ts = [(("pow", e), nz(rng, -6, 6) * (e + 1 if rng.random() < 0.6 else 1)) for e in rng.sample([0, 1, 2, 3, 4], 2)]
    if d >= 2:
        ts.append(("rec1", nz(rng, -5, 5)))
        ts.append(("exp", nz(rng, -3, 4)))
    if d == 3:
        ts.append((rng.choice(["sen", "cos"]), nz(rng, -3, 3)))
    integ = _integrando_fmt(ts)
    prim = _prim_fmt(_integra(ts))
    if d == 3 and rng.random() < 0.4:
        # primitiva que pasa por un punto
        x0 = 0 if any(t == "rec1" for t, _ in ts) is False else 1
        ts2 = [t for t in ts if t[0] != "rec1" and t[0] not in ("sen", "cos")]
        integ2 = _integrando_fmt(ts2)
        prim2 = _integra(ts2)
        y0 = rng.randint(-5, 5)
        val = sum(F(c) * (F(x0) ** t[1] if t[0] == "pow" else (math.e ** x0 if t == "exp" else 0)) for t, c in prim2)
        if any(t == "exp" for t, _ in prim2):
            Cc = y0 - sum(F(c) * F(x0) ** t[1] for t, c in prim2 if t[0] == "pow") - sum(F(c) for t, c in prim2 if t == "exp")  # x0 = 0 → e⁰ = 1
        else:
            Cc = y0 - val
        if x0 == 0:
            resp = f"F(x) = {_prim_fmt(prim2 + [(('pow', 0), Cc)])}"
            return mk(f"Halla la primitiva de f(x) = {integ2} que pasa por {pt(0, y0)}", resp, "t5_primitivas",
                      [(f"F(x) = {_prim_fmt(prim2 + [(('pow', 0), y0)])}" if Cc != y0 else f"F(x) = {_prim_fmt(prim2)}", None), (f"F(x) = {_prim_fmt(_deriva_mal(ts2) + [(('pow', 0), y0)])}", "deriva"),
                       (f"F(x) = {_prim_fmt(prim2)}", "olvida_c") if Cc else (f"F(x) = {_prim_fmt(prim2 + [(('pow', 0), 1)])}", None)], [],
                      [f"Primitiva general: {_prim_fmt(prim2)} + C.", f"F(0) = {N(y0)} → C = {N(Cc)}.", f"{resp}."], "La condición F(x₀) = y₀ fija el valor de la constante C.")
    return mk(f"Calcula ∫ ({integ}) dx", f"{prim} + C", "t5_primitivas",
              [(f"{_prim_fmt(_deriva_mal(ts))} + C", "deriva"), (prim, "olvida_c"), (f"{_prim_fmt([(('pow', t[1] + 1), c) if t[0] == 'pow' else (t, c) for t, c in _integra(ts)])} + C" if False else
                                                                                     f"{_prim_fmt([(t, c * (t[1] if t[0] == 'pow' else 1)) for t, c in _integra(ts)])} + C", None)],
              [f"{prim} + 1 + C"],
              ["∫xⁿ dx = xⁿ⁺¹/(n + 1); ∫1/x dx = ln|x|; ∫eˣ dx = eˣ; ∫sen x dx = −cos x; ∫cos x dx = sen x.", f"Integro término a término: {prim} + C."],
              "Integrar es lo contrario de derivar: se comprueba derivando el resultado. La constante C es obligatoria.")


def _cfmt(c, body):
    """Coeficiente racional por un cuerpo: 3(x² + 1)⁴/8, (x² + 1)⁴/8, −e^(x²)/2."""
    c = F(c)
    s = "−" if c < 0 else ""
    return s + cb(abs(c), body)


@generador("t5_casi_inmediatas")
def gen_casi_inmediatas(rng, d):
    tipo = rng.choice(["pot", "ln"]) if d == 1 else rng.choice(["pot", "exp", "ln"]) if d == 2 else rng.choice(["exp", "cos", "sen", "pot"])
    a = rng.randint(1, 9)
    k = rng.choice([1, 2, 3, 4, 5, 6])
    if tipo == "pot":
        n = rng.randint(2, 5)
        integ = f"{'' if k == 1 else str(k)}x(x² + {a}){sp(n)}"
        body = f"(x² + {a}){sp(n + 1)}"
        resp = _cfmt(F(k, 2 * (n + 1)), body)
        mal = _cfmt(F(k, n + 1), body)
    elif tipo == "exp":
        integ = f"{'' if k == 1 else str(k)}x·e^(x²)"
        body = "e^(x²)"
        resp = _cfmt(F(k, 2), body)
        mal = _cfmt(F(k), body)
    elif tipo == "ln":
        p = rng.randint(-5, 5)
        integ = f"({P({1: 2 * k, 0: k * p})})/({P({2: 1, 1: p, 0: a})})"
        body = f"ln|{P({2: 1, 1: p, 0: a})}|"
        resp = cb(k, body, espacio=True)
        mal = cb(2 * k, body, espacio=True)
    elif tipo == "cos":
        integ = f"{'' if k == 1 else str(k)}x·cos(x²)"
        body = "sen(x²)"
        resp = _cfmt(F(k, 2), body)
        mal = _cfmt(F(k), body)
    else:
        integ = f"{'' if k == 1 else str(k)}x·sen(x²)"
        body = "cos(x²)"
        resp = _cfmt(F(-k, 2), body)
        mal = _cfmt(F(-k), body)
    return mk(f"Calcula ∫ {integ} dx", f"{resp} + C", "t5_casi_inmediatas",
              [(f"{mal} + C", "no_ajusta"), (resp, None), (f"{_cfmt(-F(1) * (1 if resp.startswith('−') else -1) * F(1), resp.lstrip('−'))} + C" if False else f"{resp.lstrip('−') if resp.startswith('−') else '−' + resp} + C", None)],
              [f"{cb(F(k, 3), body)} + C"],
              ["Busco la forma ∫f′·g(f) dx: aquí f = x² (o el polinomio de dentro) y su derivada aparece salvo una constante.", "Ajusto la constante multiplicando y dividiendo.", f"Resultado: {resp} + C."],
              "En las casi inmediatas hay que completar exactamente la derivada interior; se comprueba derivando.")


@generador("t5_cambio_variable")
def gen_cambio_variable(rng, d):
    tipo = rng.choice(["lnx", "raiz"]) if d == 1 else rng.choice(["expfrac", "senn", "raiz"]) if d == 2 else rng.choice(["exp2", "lnx", "senn"])
    n = rng.randint(1, 5)
    a = rng.randint(1, 9)
    kk = rng.choice([1, 2, 3])
    kt = "" if kk == 1 else f"{kk}"
    if tipo == "lnx":
        integ, cambio = f"{kt}(ln x){sp(n)}/x", "t = ln x"
        resp = cb(F(kk, n + 1), f"(ln x){sp(n + 1)}")
        dist = [(f"{cb(F(kk, n + 1), 't' + sp(n + 1))} + C", "no_deshace"), (f"{cb(F(kk, n + 1), 'x(ln x)' + sp(n + 1))} + C", "no_cambia_dx"), (f"{cb(F(kk), '(ln x)' + sp(n + 1))} + C", None)]
    elif tipo == "raiz":
        integ, cambio = f"{kt}x√(x² + {a})", f"t = x² + {a}"
        resp = cb(F(kk, 3), f"(x² + {a})^(3/2)")
        dist = [(f"{cb(F(kk, 3), 't^(3/2)')} + C", "no_deshace"), (f"{cb(F(2 * kk, 3), f'(x² + {a})^(3/2)')} + C", "no_cambia_dx"), (f"{cb(F(kk, 3), f'(x² + {a})^(1/2)')} + C", None)]
    elif tipo == "expfrac":
        integ, cambio = f"e^x/(e^x + {a})", f"t = e^x + {a}"
        resp = f"ln(e^x + {a})"
        dist = [(f"ln t + C", "no_deshace"), (f"x·ln(e^x + {a}) + C", "no_cambia_dx"), (f"e^x·ln(e^x + {a}) + C", None)]
    elif tipo == "exp2":
        integ, cambio = f"e^x/({a} + e^x)²", f"t = {a} + e^x"
        resp = f"−1/({a} + e^x)"
        dist = [(f"−1/t + C", "no_deshace"), (f"1/({a} + e^x) + C", None), (f"−e^x/({a} + e^x) + C", "no_cambia_dx")]
    else:
        integ, cambio = f"cos x·sen{sp(n)} x" if n > 1 else "cos x·sen x", "t = sen x"
        resp = cb(F(1, n + 1), f"sen{sp(n + 1)} x")
        dist = [(f"{cb(F(1, n + 1), 't' + sp(n + 1))} + C", "no_deshace"), (f"{cb(F(1, n + 1), f'x·sen{sp(n + 1)} x')} + C", "no_cambia_dx"), (f"−{cb(F(1, n + 1), f'cos{sp(n + 1)} x')} + C", None)]
    return mk(f"Calcula ∫ {integ} dx con el cambio {cambio}", f"{resp} + C", "t5_cambio_variable", dist, [resp],
              [f"Con {cambio}, dt = t′ dx: sustituyo también el dx.", "Integro en t.", f"Deshago el cambio: {resp} + C."],
              "En un cambio de variable hay que cambiar también dx y, al final, volver a la variable x.")


@generador("t5_partes")
def gen_partes(rng, d):
    a = rng.randint(1, 4)
    k = rng.choice([1, 1, 2, 3, 4])
    kt = "" if k == 1 else str(k)
    tipo = rng.choice(["xexp", "xexpb"]) if d == 1 else rng.choice(["xcos", "xsen", "xlnx", "xexpb"]) if d == 2 else rng.choice(["x2exp", "xlnx", "xcos", "xsen"])
    if tipo == "xexp" and rng.random() < 0.4:
        a = -a
    E = "e^x" if a == 1 else f"e^({N(a)}x)"
    fn = lambda nom: f"{nom} x" if a == 1 else f"{nom}({a}x)"
    if tipo == "xexp":
        integ = f"{kt}x·{E}"
        resp = _cfmt(F(k, a * a), f"{E}({P({1: a, 0: -1})})")
        dist = [(_cfmt(F(k, a * a), f"{E}({P({1: a, 0: 1})})"), "signo_formula"), (_cfmt(F(k, 2), f"x²·{E}"), "mala_u"), (_cfmt(F(k, a), f"x·{E}"), None)]
    elif tipo == "xexpb":
        b = nz(rng, -5, 5, (1,))
        integ = f"({P({1: 1, 0: b})})e^x" if k == 1 else f"{k}({P({1: 1, 0: b})})e^x"
        resp = _cfmt(k, f"e^x({P({1: 1, 0: b - 1})})")
        dist = [(_cfmt(k, f"e^x({P({1: 1, 0: b + 1})})"), "signo_formula"), (_cfmt(k, f"e^x({P({2: F(1, 2), 1: b})})"), "mala_u"), (_cfmt(k, f"e^x({P({1: 1, 0: b})})"), None)]
    elif tipo == "xcos":
        integ = f"{kt}x·{fn('cos')}"
        t1, t2 = cb(F(k, a), f"x·{fn('sen')}"), cb(F(k, a * a), fn("cos"))
        resp = f"{t1} + {t2}"
        dist = [(f"{t1} − {t2}", "signo_formula"), (cb(F(k, 2), f"x²·{fn('sen')}"), "mala_u"), (f"−{t1} + {t2}", None)]
    elif tipo == "xsen":
        integ = f"{kt}x·{fn('sen')}"
        t1, t2 = cb(F(k, a), f"x·{fn('cos')}"), cb(F(k, a * a), fn("sen"))
        resp = f"−{t1} + {t2}"
        dist = [(f"−{t1} − {t2}", "signo_formula"), (f"{t1} + {t2}", None), (cb(F(k, 2), f"x²·{fn('cos')}"), "mala_u")]
    elif tipo == "xlnx":
        n = rng.randint(1, 3)
        integ = f"{kt}x{sp(n)}·ln x"
        t1 = cb(F(k, n + 1), f"x{sp(n + 1)}·ln x")
        t2 = cb(F(k, (n + 1) ** 2), f"x{sp(n + 1)}")
        resp = f"{t1} − {t2}"
        dist = [(f"{t1} + {t2}", "signo_formula"), (t1, None), (cb(F(k), f"x{sp(n)}·(x·ln x − x)"), "mala_u")]
    else:
        a = rng.randint(1, 3) * rng.choice([1, -1])
        E = "e^x" if a == 1 else f"e^({N(a)}x)"
        integ = f"{kt}x²·{E}"
        g = math.gcd(a * a, 2)
        resp = _cfmt(F(k * g, a ** 3), f"{E}({P({2: F(a * a, g), 1: F(-2 * a, g), 0: F(2, g)})})")
        dist = [(_cfmt(F(k * g, a ** 3), f"{E}({P({2: F(a * a, g), 1: F(2 * a, g), 0: F(2, g)})})"), "signo_formula"), (_cfmt(F(k * g, a ** 3), f"{E}({P({2: F(a * a, g), 1: F(-2 * a, g)})})"), None),
                (_cfmt(F(k, 3), f"x³·{E}"), "mala_u")]
    return mk(f"Calcula ∫ {integ} dx", f"{resp} + C", "t5_partes", [(f"{v} + C", kk) for v, kk in dist], [resp],
              ["Por partes: ∫u dv = u·v − ∫v du, eligiendo u el factor que se simplifica al derivar (polinomio, o ln x)." + (" Aquí hay que aplicarlo dos veces." if tipo == "x2exp" else ""),
               f"Resultado: {resp} + C."],
              "La elección de u importa (ALPES: arcos, logaritmos, polinomios, exponenciales, senos) y la fórmula lleva un MENOS.")


def _ln_term(c, r):
    body = f"ln|{P({1: 1, 0: -r})}|"
    return (F(c), cb(abs(F(c)), body, espacio=True))


@generador("t5_racionales_int")
def gen_racionales_int(rng, d):
    for _ in range(200):
        a, b = rng.sample(range(-5, 6), 2)
        A, B = nz(rng, -4, 4), nz(rng, -4, 4)
        p, q = A + B, -(A * b + B * a)
        if p != 0 or d > 1:
            break
    den = P(proots([a, b]))
    ts = sorted([(a, A), (b, B)])
    resp = suma([_ln_term(c, r) for r, c in ts])
    if d < 3:
        integ = f"({P({1: p, 0: q})})/({den})" if p else f"{N(q)}/({den})"
        dist = [(f"{cb(1, 'ln|' + den + '|', True)} + C", "ln_denominador"), (f"{suma([_ln_term(c, -r) for r, c in ts])} + C", None), (f"{suma([_ln_term(c, r) for r, c in reversed([(a, B), (b, A)])])} + C" if A != B else f"{suma([_ln_term(-c, r) for r, c in ts])} + C", None)]
        pasos = [f"Descompongo: ({P({1: p, 0: q})})/({den}) = A/{fac(a)} + B/{fac(b)} → A = {N(A)}, B = {N(B)}." if True else "", f"Integro cada fracción simple: {resp} + C."]
        return mk(f"Calcula ∫ {integ} dx", f"{resp} + C", "t5_racionales_int", dist, [f"{resp}"], pasos,
                  "Con raíces reales simples se descompone en fracciones simples A/(x − a) + B/(x − b); no es ln del denominador entero.")
    # grado num ≥ grado den: x + fracción
    num = padd(pmul({1: 1}, proots([a, b])), {1: p, 0: q})
    integ = f"({P(num)})/({den})"
    resp2 = f"x²/2 + {resp}" if not resp.startswith("−") else f"x²/2 − {resp[1:]}"
    return mk(f"Calcula ∫ {integ} dx", f"{resp2} + C", "t5_racionales_int",
              [(f"{resp} + C", "no_divide"), (f"x²/2 + ln|{den}| + C", "ln_denominador"), (f"x + {resp} + C" if not resp.startswith("−") else f"x − {resp[1:]} + C", None)], [resp2],
              ["El grado del numerador no es menor que el del denominador: primero divido.", f"Queda x + ({P({1: p, 0: q})})/({den}), y descompongo la fracción en simples.", f"{resp2} + C."],
              "Si grado(P) ≥ grado(Q), se divide antes de descomponer.")


def _limsub(n):
    return str(n).translate(_SUB) if n >= 0 else "₋" + str(-n).translate(_SUB)


def _limsup(n):
    return str(n).translate(_SUP) if n >= 0 else "⁻" + str(-n).translate(_SUP)


@generador("t5_barrow")
def gen_barrow(rng, d):
    g = 1 if d == 1 else 2 if d == 2 else 3
    co = {e: rng.randint(-4, 4) for e in range(g + 1)}
    co[g] = nz(rng, -3, 3) * (g + 1 if rng.random() < 0.5 else 1)
    a = rng.randint(-2, 2)
    b = a + rng.randint(1, 3)
    prim = {e + 1: F(c, e + 1) for e, c in co.items() if c}
    v = pev(prim, b) - pev(prim, a)
    return mk(f"Calcula ∫{_limsub(a)}{_limsup(b)} ({P(co)}) dx", N(v), "t5_barrow",
              [(N(-v) if v else "1", "resta_al_reves"), (f"{N(v)} + C", "mantiene_c"), (N(pev(prim, b)), None)], [N(v + 1), N(v * 2)],
              [f"Primitiva: F(x) = {P(prim)}.", f"Barrow: F({N(b)}) − F({N(a)}) = {N(pev(prim, b))} − ({N(pev(prim, a))}) = {N(v)}."],
              "La integral definida es un número: F(b) − F(a), sin constante C.")


@generador("t5_areas")
def gen_areas(rng, d):
    if d == 1:
        r1, r2 = sorted(rng.sample(range(-3, 5), 2))
        k = rng.choice([1, -1, 2, -2, 3])
        co = proots([r1, r2], k)
        area = F(abs(k) * (r2 - r1) ** 3, 6)
        integral = -area if k > 0 else area
        return mk(f"Calcula el área del recinto limitado por la curva y = {P(co)} y el eje X", f"{N(area)} u²", "t5_areas",
                  [(f"{N(integral)} u²" if integral != area else f"{N(2 * area)} u²", "integral_con_signo"), (f"{N(area * 2)} u²", None), (f"{N(area / 2)} u²", None)], [],
                  [f"Cortes con el eje X: x = {N(r1)} y x = {N(r2)}.", f"∫ de {N(r1)} a {N(r2)} de la función = {N(integral)}; el área es su valor absoluto: {N(area)} u²."],
                  "Un área siempre es positiva: si la curva está por debajo del eje, se toma el valor absoluto.")
    if d == 2 and rng.random() < 0.6:
        sq = rng.randint(1, 6)
        if rng.random() < 0.5:
            area = F(4 * sq ** 3, 3)
            return mk(f"Calcula el área del recinto limitado por la parábola y = x² y la recta y = {sq * sq}", f"{N(area)} u²", "t5_areas",
                      [(f"{N(-area)} u²", "resta_al_reves"), (f"{N(2 * area)} u²", None), (f"{N(F(2 * sq ** 3, 3))} u²", "integral_con_signo")], [],
                      [f"Cortes: x² = {sq * sq} → x = ±{sq}.", f"Área = ∫ ({sq * sq} − x²) dx entre −{sq} y {sq} = {N(area)} u²."],
                      "Se integra (curva de arriba − curva de abajo) entre los puntos de corte.")
        area = F(8 * sq ** 3, 3)
        return mk(f"Calcula el área del recinto limitado por las parábolas y = x² e y = {P({2: -1, 0: 2 * sq * sq})}", f"{N(area)} u²", "t5_areas",
                  [(f"{N(-area)} u²", "resta_al_reves"), (f"{N(area / 2)} u²", None), (f"{N(2 * area)} u²", None)], [],
                  [f"Cortes: x² = {P({2: -1, 0: 2 * sq * sq})} → x = ±{sq}.", f"Área = ∫ ({P({2: -2, 0: 2 * sq * sq})}) dx entre −{sq} y {sq} = {N(area)} u²."],
                  "Se integra (curva de arriba − curva de abajo) entre los puntos de corte.")
    if d == 2:
        m = nz(rng, -4, 4)
        area = F(abs(m) ** 3, 6)
        return mk(f"Calcula el área del recinto limitado por las curvas y = x² e y = {P({1: m})}", f"{N(area)} u²", "t5_areas",
                  [(f"{N(-area)} u²", "resta_al_reves"), (f"{N(F(abs(m) ** 3, 3))} u²", None), (f"{N(F(abs(m) ** 3, 2))} u²", None)], [],
                  [f"Cortes: x² = {P({1: m})} → x = 0 y x = {N(m)}.", f"Área = |∫ ({P({1: m})} − x²) dx| entre ellos = {N(area)} u²."],
                  "Se integra (curva de arriba − curva de abajo) entre los puntos de corte.")
    if rng.random() < 0.6:
        r1, r2 = sorted(rng.sample(range(-3, 4), 2))
        t = rng.randint(1, 2)
        k = rng.choice([1, -1, 2])
        co = proots([r1, r2], k)
        pr = {e + 1: F(c, e + 1) for e, c in co.items()}
        I1 = pev(pr, r2) - pev(pr, r1)
        I2 = pev(pr, r2 + t) - pev(pr, r2)
        area = abs(I1) + abs(I2)
        return mk(f"Calcula el área del recinto limitado por la curva y = {P(co)}, el eje X y las rectas x = {N(r1)} y x = {N(r2 + t)}", f"{N(area)} u²", "t5_areas",
                  [(f"{N(I1 + I2)} u²" if I1 + I2 != area else f"{N(abs(I1))} u²", "integral_con_signo"), (f"{N(abs(I1 + I2))} u²" if abs(I1 + I2) != area else f"{N(area + 1)} u²", "integral_con_signo"), (f"{N(abs(I1))} u²", None)], [f"{N(2 * area)} u²"],
                  [f"La curva corta al eje X en x = {N(r2)} dentro del intervalo: separo en dos trozos.", f"|∫ de {N(r1)} a {N(r2)}| = {N(abs(I1))} y |∫ de {N(r2)} a {N(r2 + t)}| = {N(abs(I2))}.", f"Área = {N(area)} u²."],
                  "Si la función cambia de signo, hay que separar los recintos y sumar valores absolutos.")
    c = rng.randint(1, 3)
    k = rng.choice([1, 2])
    co = {3: k, 1: -k * c * c}
    area = F(k * c ** 4, 2)
    return mk(f"Calcula el área del recinto limitado por la curva y = {P(co)} y el eje X", f"{N(area)} u²", "t5_areas",
              [("0 u²", "integral_con_signo"), (f"{N(area / 2)} u²", None), (f"{N(area * 2)} u²", None)], [],
              [f"Cortes con el eje X: x = −{c}, x = 0, x = {c}.", "La curva cambia de signo en x = 0: calculo cada trozo por separado y sumo sus valores absolutos.", f"Área = {N(area)} u²."],
              "Si la función cambia de signo, hay que separar los recintos; integrar de un extremo a otro puede dar 0.")


@generador("t5_volumen_revolucion")
def gen_volumen_revolucion(rng, d):
    tipo = rng.choice(["raiz", "lin"]) if d == 1 else rng.choice(["cuad", "raiz", "const"]) if d == 2 else rng.choice(["esfera", "cuad", "lin", "raiz"])
    b = rng.randint(1, 4) if d < 3 else rng.randint(2, 6)
    if tipo == "raiz":
        k = rng.randint(1, 4)
        f = f"y = √x" if k == 1 else f"y = √({k}x)"
        V, sinC, sinPi = F(k * b * b, 2), None, F(k * b * b, 2)
    elif tipo == "lin":
        k = rng.randint(1, 3)
        f = f"y = {P({1: k})}"
        V, sinC, sinPi = F(k * k * b ** 3, 3), F(k * b * b, 2), F(k * k * b ** 3, 3)
    elif tipo == "cuad":
        f = "y = x²"
        V, sinC, sinPi = F(b ** 5, 5), F(b ** 3, 3), F(b ** 5, 5)
    elif tipo == "const":
        k = rng.randint(2, 5)
        f = f"y = {k}"
        V, sinC, sinPi = F(k * k * b), F(k * b), F(k * k * b)
    else:
        r = rng.randint(1, 7)
        f = f"y = √({r * r} − x²)"
        V, sinC, sinPi = F(4 * r ** 3, 3), None, F(4 * r ** 3, 3)
        return mk(f"Calcula el volumen que genera {f} al girar alrededor del eje X entre x = −{r} y x = {r}", f"{pif(V)} u³", "t5_volumen",
                  [(f"{N(V)} u³", "sin_pi"), (f"{pif(V / 2)} u³", None), (f"{pif(V * 3 / 4)} u³", None)], [],
                  [f"V = π∫ f(x)² dx = π∫ ({r * r} − x²) dx entre −{r} y {r}.", f"= {pif(V)} u³ (el volumen de una esfera de radio {r})."],
                  "Volumen de revolución: V = π∫ f(x)² dx.")
    return mk(f"Calcula el volumen que genera {f} al girar alrededor del eje X entre x = 0 y x = {b}", f"{pif(V)} u³", "t5_volumen",
              [(f"{pif(sinC)} u³" if sinC is not None and sinC != V else f"{pif(V * 2)} u³", "sin_cuadrado" if sinC is not None and sinC != V else None), (f"{N(sinPi)} u³", "sin_pi"), (f"{pif(V / 2)} u³", None)], [],
              [f"V = π∫ f(x)² dx entre 0 y {b}.", f"f(x)² = {'x' if tipo == 'raiz' and k == 1 else (str(k) + 'x' if tipo == 'raiz' else '...')}; integro y aplico Barrow: V = {pif(V)} u³."],
              "V = π∫ f(x)² dx: hay que elevar al cuadrado y no olvidar π.")


# ================================================================ ANA.LIM

@generador("t5_limite_punto")
def gen_limite_punto(rng, d):
    a = rng.randint(-4, 4)
    if d == 1:
        co = {2: rng.randint(-3, 3), 1: rng.randint(-5, 5), 0: rng.randint(-6, 6)}
        b = a + nz(rng, -3, 3)
        v = pev(co, a) / (a - b)
        return mk(f"Calcula lím x→{N(a)} ({P(co)})/{fac(b)}", N(v), "t5_limite", [(N(pev(co, a)), None), (N(-v) if v else "1", None), ("0" if v else "1", "cero_cero")], ["+∞", N(v + 1)],
                  [f"No hay indeterminación: sustituyo x = {N(a)}.", f"= {N(pev(co, a))}/{N(a - b)} = {N(v)}."], "Primero se sustituye; solo si sale 0/0 o k/0 hay que hacer algo más.")
    if d == 2:
        for _ in range(100):
            p, q = rng.randint(-5, 5), rng.randint(-5, 5)
            if p != a and q != a and p != q:
                break
        num, den = proots([a, p]), proots([a, q])
        v = F(a - p, a - q)
        return mk(f"Calcula lím x→{N(a)} ({P(num)})/({P(den)})", N(v), "t5_limite", [("0", "cero_cero"), ("1", "cero_cero"), (N(F(a - q, a - p)) if a != p else "+∞", None)], [N(v + 1), "No existe"],
                  [f"Sustituyendo sale 0/0: factorizo. ({fac(a)}{fac(p)})/({fac(a)}{fac(q)}).", f"Simplifico {fac(a)} y sustituyo: {N(v)}."], "0/0 es una indeterminación: no vale 0 ni 1; se factoriza y se simplifica.")
    k = nz(rng, -6, 6)
    tipo = rng.choice(["cuad", "lat", "sin"])
    if tipo == "cuad":
        resp = "+∞" if k > 0 else "−∞"
        return mk(f"Calcula lím x→{N(a)} {N(k)}/{fac(a)}²" if a else f"Calcula lím x→0 {N(k)}/x²", resp, "t5_limite",
                  [("0", "k_cero"), ("−∞" if k > 0 else "+∞", None), ("No existe", None)], [],
                  [f"Sale {N(k)}/0: el límite es infinito.", f"El denominador es un cuadrado (siempre positivo): el signo lo da {N(k)} → {resp}."], "k/0 no es 0: es infinito, con el signo que indiquen los laterales.")
    if tipo == "lat":
        lado = rng.choice(["⁺", "⁻"])
        s = (1 if lado == "⁺" else -1) * (1 if k > 0 else -1)
        resp = "+∞" if s > 0 else "−∞"
        return mk(f"Calcula lím x→{N(a)}{lado} {N(k)}/{fac(a)}" if a else f"Calcula lím x→0{lado} {N(k)}/x", resp, "t5_limite",
                  [("0", "k_cero"), ("−∞" if s > 0 else "+∞", None), ("No existe", None)], [],
                  [f"Sale {N(k)}/0; por {'la derecha' if lado == '⁺' else 'la izquierda'} el denominador es {'positivo' if lado == '⁺' else 'negativo'}.", f"Límite: {resp}."], "Los límites laterales de k/0 son ±∞ según los signos.")
    resp = "No existe (los límites laterales son −∞ y +∞)"
    return mk(f"Calcula lím x→{N(a)} {N(k)}/{fac(a)}" if a else f"Calcula lím x→0 {N(k)}/x", resp, "t5_limite",
              [("0", "k_cero"), ("+∞", None), ("−∞", None)], [],
              [f"Sale {N(k)}/0: calculo los laterales.", "Por un lado +∞ y por el otro −∞: el límite no existe."], "Si los laterales son distintos, el límite no existe.")


@generador("t5_limite_infinito")
def gen_limite_infinito(rng, d):
    n = rng.randint(1, 3)
    m = n if d == 1 else rng.choice([n, n - 1 if n > 1 else n + 1, n + 1])
    a, b = nz(rng, -5, 5), nz(rng, -4, 4)
    num = {n: a, 0: rng.randint(-5, 5)}
    if n > 1:
        num[n - 1] = rng.randint(-4, 4)
    den = {m: b, 0: rng.randint(-5, 5) or 1}
    haciam = "−∞" if d == 3 and rng.random() < 0.6 else "+∞"
    if n == m:
        v = F(a, b)
        resp = N(v)
    elif n < m:
        resp = "0"
    else:
        sgn = (1 if a * b > 0 else -1) * (1 if (haciam == "+∞" or (n - m) % 2 == 0) else -1)
        resp = "+∞" if sgn > 0 else "−∞"
    dist = [("1" if resp != "1" else "0", "infinito_uno"), ("0" if resp != "0" else "+∞", None)]
    if resp in ("+∞", "−∞"):
        dist.append(("−∞" if resp == "+∞" else "+∞", "signo_menos_infinito" if haciam == "−∞" else None))
    else:
        dist.append(("+∞", None))
        dist.append((N(-F(a, b)) if n == m and a != -b and F(a, b) != -F(a, b) else N(F(b, a)) if n == m else "−∞", None))
    return mk(f"Calcula lím x→{haciam} ({P(num)})/({P(den)})", resp, "t5_limite", dist, [N(F(a, b) + 1)],
              ["Comparo los grados de numerador y denominador.", {True: f"Mismo grado: cociente de coeficientes principales, {N(a)}/{N(b)}."}.get(n == m, "Grado del numerador menor: el límite es 0." if n < m else "Grado del numerador mayor: el límite es infinito; el signo sale de los coeficientes principales y de la potencia de x."),
               f"Resultado: {resp}."],
              "∞/∞ no es 1: depende de los grados. En −∞, las potencias impares son negativas.")


@generador("t5_limite_conjugado")
def gen_limite_conjugado(rng, d):
    c = 1 if d < 3 else rng.randint(2, 3)
    a = nz(rng, -8, 8)
    if d == 2 and rng.random() < 0.5:
        b = nz(rng, -8, 8, (a,))
        enun = f"Calcula lím x→+∞ (√({P({2: 1, 1: a})}) − √({P({2: 1, 1: b})}))"
        v = F(a - b, 2)
    else:
        q = rng.randint(-6, 6)
        enun = f"Calcula lím x→+∞ (√({P({2: c * c, 1: a, 0: q})}) − {P({1: c})})"
        v = F(a, 2 * c)
    return mk(enun, N(v), "t5_limite", [("0", "infinito_menos_infinito"), (N(2 * v), "conjugado_mal"), ("+∞", None)], [N(v + 1), N(-v)],
              ["Sale ∞ − ∞: multiplico y divido por el conjugado.", "Arriba queda una diferencia de cuadrados (sin raíces) y abajo una suma de raíces; divido entre x.", f"Límite = {N(v)}."],
              "∞ − ∞ es indeterminado; el conjugado usa (A − B)(A + B) = A² − B².")


@generador("t5_asintotas")
def gen_asintotas(rng, d):
    a = nz(rng, -5, 5)
    if d == 1:
        p, q = nz(rng, -4, 5), rng.randint(-6, 6)
        if p * a + q == 0:
            q += 1
        f = f"f(x) = ({P({1: p, 0: q})})/{fac(a)}"
        resp = f"Vertical x = {N(a)}; horizontal y = {N(p)}"
        dist = [(f"Vertical x = {N(a)}; horizontal y = {N(p)}; oblicua y = {P({1: p})}", "horizontal_y_oblicua"), (f"Vertical x = {N(-a)}; horizontal y = {N(p)}", None), (f"Vertical x = {N(a)}; horizontal y = {N(q)}", None)]
    elif d == 2:
        b = rng.randint(-5, 5)
        if a * a + b == 0:
            b += 1
        f = f"f(x) = ({P({2: 1, 0: b})})/{fac(a)}"
        resp = f"Vertical x = {N(a)}; oblicua y = {P({1: 1, 0: a})}"
        dist = [(f"Vertical x = {N(a)}; horizontal y = 1; oblicua y = {P({1: 1, 0: a})}", "horizontal_y_oblicua"), (f"Vertical x = {N(a)}; oblicua y = {P({1: 1, 0: -a})}", None), (f"Vertical x = {N(-a)}; oblicua y = {P({1: 1, 0: a})}", None)]
    else:
        r = nz(rng, -5, 5, (a,))
        f = f"f(x) = ({P(proots([r, 0]))})/({P(proots([r, a]))})"
        resp = f"Vertical x = {N(a)}; horizontal y = 1"
        rs = sorted([r, a])
        dist = [(f"Verticales x = {N(rs[0])} y x = {N(rs[1])}; horizontal y = 1", "av_evitable"), (f"Vertical x = {N(a)}; horizontal y = 1; oblicua y = x", "horizontal_y_oblicua"), (f"Vertical x = {N(a)}; horizontal y = 0", None)]
    return mk(f"Calcula las asíntotas de {f}", resp, "t5_asintotas", dist, [],
              ["Verticales: valores que anulan el denominador y NO el numerador (límite infinito).", "Horizontal si existe lím x→∞ f(x) finito; si no, oblicua y = mx + n con m = lím f(x)/x y n = lím (f(x) − mx).", f"{resp}."],
              "Un cero del denominador que también anula el numerador puede ser una discontinuidad evitable, no una asíntota. Horizontal y oblicua no coexisten en el mismo lado.")


def epow(v):
    v = F(v)
    if v == 0:
        return "1"
    if v == 1:
        return "e"
    if v.denominator == 1:
        return "e" + str(int(v)).translate(_SUP).replace("-", "⁻")
    return f"e^({N(v)})"


@generador("t5_limite_e")
def gen_limite_e(rng, d):
    c = nz(rng, -4, 4) if d > 1 else rng.randint(1, 4)
    if d == 1:
        k = nz(rng, -5, 5)
        enun = f"Calcula lím x→+∞ (1 + {N(k)}/x)^({P({1: c})})" if k > 0 else f"Calcula lím x→+∞ (1 − {N(-k)}/x)^({P({1: c})})"
        v = F(k * c)
        mal = F(k)
    else:
        a, b = rng.sample(range(-6, 7), 2)
        p = 1 if d == 2 else rng.choice([1, 2])
        enun = f"Calcula lím x→+∞ (({P({1: p, 0: a})})/{dpar(P({1: p, 0: b}))})^({P({1: c})})"
        v = F(c * (a - b), p)
        mal = F(a - b, p)
    return mk(enun, epow(v), "t5_limite_e", [("1", "uno_infinito"), (epow(mal) if mal != v else epow(v + 1), "olvida_exponente"), (epow(-v), None)], [epow(2 * v), "+∞"],
              ["Es una indeterminación 1^∞.", "Uso lím f^g = e^(lím g·(f − 1)).", f"g·(f − 1) → {N(v)}, así que el límite es {epow(v)}."],
              "1^∞ no vale 1: es una indeterminación que se resuelve con el número e.")


LHOP = [
    ("(e^({a}x) − 1)/({b}x)", lambda a, b: F(a, b), "0/0"),
    ("sen({a}x)/({b}x)", lambda a, b: F(a, b), "0/0"),
    ("ln(1 + {a}x)/({b}x)", lambda a, b: F(a, b), "0/0"),
    ("(1 − cos({a}x))/x²", lambda a, b: F(a * a, 2), "0/0"),
    ("(e^x − 1 − x)/x²", lambda a, b: F(1, 2), "0/0"),
    ("(x − sen x)/x³", lambda a, b: F(1, 6), "0/0"),
    ("tg({a}x)/({b}x)", lambda a, b: F(a, b), "0/0"),
    ("(e^({a}x) − e^({b}x))/x", lambda a, b: F(a - b), "0/0"),
]


@generador("t5_lhopital")
def gen_lhopital(rng, d):
    if d == 3 and rng.random() < 0.4:
        a, b = rng.randint(1, 5), rng.randint(1, 5)
        v = F(1 + a, b)
        return mk(f"Calcula lím x→0 (cos x + {a})/(x + {b})", N(v), "t5_lhopital",
                  [("0", "sin_indeterminacion"), (N(F(a, b)), None), ("1", None)], [N(v + 1)],
                  ["Antes de usar L'Hôpital compruebo la indeterminación: sustituyendo sale " + f"{1 + a}/{b}, que no es indeterminado.", f"El límite es {N(v)}."],
                  "L'Hôpital solo se aplica a 0/0 o ∞/∞.")
    for _ in range(50):
        tpl, fv, _ = rng.choice(LHOP[:3] + LHOP[6:] if d == 1 else LHOP)
        a, b = rng.randint(2, 6), rng.randint(1, 5)
        if a != b:
            break
    if d == 2 and rng.random() < 0.4:
        n, c = rng.randint(2, 5), rng.randint(1, 3)
        v = n * c ** (n - 1)
        return mk(f"Calcula lím x→{c} (x{sp(n)} − {c ** n})/(x − {c})", N(v), "t5_lhopital", [("0", None), (N(c ** n), None), (N(n * c ** n), "deriva_cociente")], [N(v + 1)],
                  [f"Sale 0/0. Derivo numerador y denominador por separado: {n}x{sp(n - 1)}/1.", f"Sustituyo x = {c}: {N(v)}."], "L'Hôpital: lím f/g = lím f′/g′ (derivadas por separado, no la del cociente).")
    txt = tpl.format(a=a, b=b)
    v = fv(a, b)
    return mk(f"Calcula lím x→0 {txt}", N(v), "t5_lhopital", [("0", None), ("1", None), (N(v * 2) if v != F(1, 2) else "2", "deriva_cociente")], [N(v + 1), "+∞"],
              ["Sustituyendo sale 0/0: aplico L'Hôpital (derivo numerador y denominador por separado).", "Si vuelve a salir 0/0, repito.", f"Límite = {N(v)}."],
              "L'Hôpital: lím f/g = lím f′/g′ cuando hay 0/0 o ∞/∞.")


# ================================================================ GEO: utilidades

class Q:
    """Números a + b√2 + c√3 + d√6 con coeficientes racionales (valores trigonométricos exactos)."""
    B = (1, 2, 3, 6)
    MUL = {(1, 1): (1, 1), (1, 2): (1, 2), (1, 3): (1, 3), (1, 6): (1, 6), (2, 2): (2, 1), (2, 3): (1, 6), (2, 6): (2, 3), (3, 3): (3, 1), (3, 6): (3, 2), (6, 6): (6, 1)}

    def __init__(self, c=None):
        self.c = {k: F(0) for k in self.B}
        if isinstance(c, dict):
            for k, v in c.items():
                self.c[k] = F(v)
        elif c is not None:
            self.c[1] = F(c)

    def __add__(self, o):
        o = o if isinstance(o, Q) else Q(o)
        return Q({k: self.c[k] + o.c[k] for k in self.B})

    def __neg__(self):
        return Q({k: -v for k, v in self.c.items()})

    def __sub__(self, o):
        return self + (-(o if isinstance(o, Q) else Q(o)))

    def __mul__(self, o):
        o = o if isinstance(o, Q) else Q(o)
        r = Q()
        for a, x in self.c.items():
            for b, y in o.c.items():
                if x and y:
                    k, m = self.MUL[(min(a, b), max(a, b))]
                    r.c[m] += x * y * k
        return r

    def conj_div(self, o):
        """self / o con o en Q(√2) o Q(√3) (o un racional)."""
        o = o if isinstance(o, Q) else Q(o)
        nz_ = [k for k, v in o.c.items() if v]
        if nz_ == [1]:
            return Q({k: v / o.c[1] for k, v in self.c.items()})
        for base in (2, 3):
            if set(nz_) <= {1, base}:
                a, b = o.c[1], o.c[base]
                conj = Q({1: a, base: -b})
                den = a * a - base * b * b
                num = self * conj
                return Q({k: v / den for k, v in num.c.items()})
        raise ValueError("división no soportada")

    def __eq__(self, o):
        o = o if isinstance(o, Q) else Q(o)
        return all(self.c[k] == o.c[k] for k in self.B)

    def __hash__(self):
        return hash(tuple(self.c.values()))

    def es_cero(self):
        return all(v == 0 for v in self.c.values())

    def fl(self):
        return float(self.c[1] + self.c[2] * math.sqrt(2) + self.c[3] * math.sqrt(3) + self.c[6] * math.sqrt(6))

    def txt(self):
        ts = [(k, v) for k, v in self.c.items() if v]
        if not ts:
            return "0"
        L = math.lcm(*[v.denominator for _, v in ts])
        items = [(k, int(v * L)) for k, v in ts]
        g = math.gcd(*[abs(n) for _, n in items], L)
        items = [(k, n // g) for k, n in items]
        L //= g
        def body(k, n):
            n = abs(n)
            if k == 1:
                return str(n)
            return ("" if n == 1 else str(n)) + f"√{k}"
        pos = [(k, n) for k, n in items if n > 0]
        neg = [(k, n) for k, n in items if n < 0]
        if not pos:
            inner = " + ".join(body(k, n) for k, n in neg)
            if L == 1:
                return "−" + inner if len(neg) == 1 else f"−({inner})"
            return ("−" + inner + f"/{L}") if len(neg) == 1 else f"−({inner})/{L}"
        s = " + ".join(body(k, n) for k, n in pos)
        for k, n in neg:
            s += " − " + body(k, n)
        if L == 1:
            return s
        return (s + f"/{L}") if len(items) == 1 else f"({s})/{L}"


R2, R3 = Q({2: 1}), Q({3: 1})
SEN = {0: Q(0), 30: Q(F(1, 2)), 45: Q({2: F(1, 2)}), 60: Q({3: F(1, 2)}), 90: Q(1)}
COS = {0: Q(1), 30: Q({3: F(1, 2)}), 45: Q({2: F(1, 2)}), 60: Q(F(1, 2)), 90: Q(0)}
TG = {0: Q(0), 30: Q({3: F(1, 3)}), 45: Q(1), 60: Q({3: 1})}


def trig(fn, ang):
    """Valor exacto de sen/cos/tg de un múltiplo de 30° o 45° (tg no definida → None)."""
    ang %= 360
    ref = {0: ang, 1: 180 - ang, 2: ang - 180, 3: 360 - ang}[ang // 90] if ang % 90 else None
    if ang % 90 == 0:
        s = {0: 0, 90: 1, 180: 0, 270: -1}[ang]
        c = {0: 1, 90: 0, 180: -1, 270: 0}[ang]
        if fn == "sen":
            return Q(s)
        if fn == "cos":
            return Q(c)
        return None if c == 0 else Q(F(s, c))
    q = ang // 90
    sgn = {"sen": [1, 1, -1, -1], "cos": [1, -1, -1, 1], "tg": [1, -1, 1, -1]}[fn][q]
    base = {"sen": SEN, "cos": COS, "tg": TG}[fn][ref]
    return base * sgn


def grad(x, nd=1):
    return f"{D(x, nd)}°"


def vec(*c):
    return pt(*c)


def dot(u, v):
    return sum(a * b for a, b in zip(u, v))


def cross(u, v):
    return (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])


def norm2(u):
    return sum(a * a for a in u)


def prim(v):
    """Vector primitivo (enteros primos entre sí, primer no nulo positivo)."""
    v = [F(x) for x in v]
    L = math.lcm(*[x.denominator for x in v])
    v = [int(x * L) for x in v]
    g = math.gcd(*v) or 1
    v = [x // g for x in v]
    first = next((x for x in v if x), 1)
    return tuple(-x if first < 0 else x for x in v)


def modulo(u):
    return rad(norm2(u))


def lincomb(a, b, u="u", v="v"):
    def t(c, n):
        c = F(c)
        if c.denominator == 1:
            return (c, "" if abs(c) == 1 else f"{abs(c.numerator)}") if False else None
    parts = []
    for c, nm in ((a, u), (b, v)):
        c = F(c)
        if c == 0:
            continue
        body = (nm if abs(c) == 1 else f"{abs(c.numerator)}{nm}") if c.denominator == 1 else f"({N(abs(c))}){nm}"
        parts.append((c, body))
    return suma(parts)


# ================================================================ GEO.VECT

@generador("t5_vector_coord")
def gen_vector_coord(rng, d):
    for _ in range(100):
        A = (rng.randint(-6, 6), rng.randint(-6, 6))
        tri = rng.choice([(3, 4), (4, 3), (6, 8), (5, 12), (8, 6), (12, 5), (1, 2), (2, 3), (1, 1), (2, 5)]) if d > 1 else (rng.randint(-6, 6), rng.randint(-6, 6))
        v = (tri[0] * rng.choice([1, -1]), tri[1] * rng.choice([1, -1]))
        B = (A[0] + v[0], A[1] + v[1])
        if v != (0, 0) and v[0] != v[1]:
            break
    if d == 1:
        return mk(f"Calcula las coordenadas del vector AB, con A{pt(*A)} y B{pt(*B)}", f"AB = {vec(*v)}", "t5_vector",
                  [(f"AB = {vec(-v[0], -v[1])}", "resta_al_reves"), (f"AB = {vec(A[0] + B[0], A[1] + B[1])}", None), (f"AB = {vec(v[1], v[0])}", None)], [f"AB = {vec(v[0] + 1, v[1])}"],
                  ["Coordenadas de AB = extremo − origen = B − A.", f"AB = ({N(B[0])} − ({N(A[0])}), {N(B[1])} − ({N(A[1])})) = {vec(*v)}."], "AB = B − A (el extremo menos el origen).")
    m = modulo(v)
    return mk(f"Calcula el módulo del vector AB, con A{pt(*A)} y B{pt(*B)}", f"|AB| = {m}", "t5_vector",
              [(f"|AB| = {N(norm2(v))}", "sin_raiz"), (f"|AB| = {N(abs(v[0]) + abs(v[1]))}", "sin_raiz"), (f"|AB| = {rad(abs(norm2(v) - 2 * abs(v[0] * v[1])) or 1)}", None)], [f"|AB| = {rad(norm2(v) + 1)}"],
              [f"AB = B − A = {vec(*v)}.", f"|AB| = √(({N(v[0])})² + ({N(v[1])})²) = √{norm2(v)} = {m}."], "El módulo es la raíz de la suma de los cuadrados de las coordenadas (Pitágoras).")


@generador("t5_vector_operaciones")
def gen_vector_operaciones(rng, d):
    u = (rng.randint(-5, 5), rng.randint(-5, 5))
    v = (rng.randint(-5, 5), rng.randint(-5, 5))
    a = 1 if d == 1 else rng.choice([2, 3, -1, -2])
    b = rng.choice([1, -1]) if d == 1 else rng.choice([2, 3, -1, -2, -3])
    r = (a * u[0] + b * v[0], a * u[1] + b * v[1])
    expr = lincomb(a, b)
    e1 = (a * u[0] + b * v[0], u[1] + b * v[1]) if a != 1 else (u[0] + b * v[0], u[1] + v[1])
    e2 = (-r[0], -r[1])
    return mk(f"Con u = {vec(*u)} y v = {vec(*v)}, calcula {expr}", vec(*r), "t5_vector",
              [(vec(*e1), "escalar_una_coord"), (vec(*e2), "resta_al_reves"), (vec(a * u[0] - b * v[0], a * u[1] - b * v[1]), None)], [vec(r[0] + 1, r[1])],
              [f"Multiplico cada vector por su número (las DOS coordenadas).", f"Sumo coordenada a coordenada: {expr} = {vec(*r)}."], "El producto por un número afecta a todas las coordenadas.")


@generador("t5_base_vectores")
def gen_base_vectores(rng, d):
    if d == 1:
        u = (nz(rng, -5, 5), nz(rng, -5, 5))
        if rng.random() < 0.5:
            k = rng.choice([2, 3, -1, -2, F(1, 2)])
            v = (u[0] * k, u[1] * k)
            if any(F(x).denominator != 1 for x in v):
                v = (u[0] * 2, u[1] * 2)
            resp, otro = "No: son proporcionales (linealmente dependientes)", "Sí: no son proporcionales"
            key = "base_proporcionales"
        else:
            for _ in range(50):
                v = (rng.randint(-5, 5), rng.randint(-5, 5))
                if u[0] * v[1] - u[1] * v[0] != 0:
                    break
            resp, otro = "Sí: no son proporcionales", "No: son proporcionales (linealmente dependientes)"
            key = None
        return mk(f"¿Forman base del plano u = {vec(*u)} y v = {vec(*v)}?", resp, "t5_base", [(otro, key), ("No: hacen falta tres vectores", None), ("Sí: dos vectores cualesquiera forman base", "base_proporcionales")], [],
                  ["Dos vectores del plano forman base si no son proporcionales.", f"Compruebo si {N(u[0])}/{N(v[0]) if v[0] else '0'} coincide con {N(u[1])}/{N(v[1]) if v[1] else '0'} (o el determinante): {resp}."],
                  "Dos vectores proporcionales tienen la misma dirección y no generan el plano.")
    for _ in range(100):
        u = (rng.randint(-3, 3), rng.randint(-3, 3))
        v = (rng.randint(-3, 3), rng.randint(-3, 3))
        det = u[0] * v[1] - u[1] * v[0]
        if det:
            break
    a, b = (F(rng.randint(-4, 4)), F(rng.randint(-4, 4))) if d == 2 else (F(rng.randint(-5, 5), det), F(rng.randint(-5, 5), det))
    if a == 0 and b == 0:
        a = F(1)
    w = (a * u[0] + b * v[0], a * u[1] + b * v[1])
    resp = f"w = {lincomb(a, b)}"
    return mk(f"Expresa w = {vec(*w)} como combinación lineal de u = {vec(*u)} y v = {vec(*v)}", resp, "t5_base",
              [(f"w = {lincomb(b, a)}" if a != b else f"w = {lincomb(-a, b)}", "coef_cruzados"), (f"w = {lincomb(-a, -b)}", None), (f"w = {lincomb(a, -b)}" if b else f"w = {lincomb(a + 1, b)}", None)], [],
              ["Planteo w = a·u + b·v: un sistema de dos ecuaciones (una por coordenada).", f"Lo resuelvo: a = {N(a)}, b = {N(b)}. {resp}."], "Cada coeficiente va con su vector: comprobar sustituyendo.")


@generador("t5_producto_escalar")
def gen_producto_escalar(rng, d):
    u = (nz(rng, -5, 5), rng.randint(-5, 5))
    v = (rng.randint(-5, 5), nz(rng, -5, 5))
    if d == 1:
        p = dot(u, v)
        return mk(f"Calcula el producto escalar de u = {vec(*u)} y v = {vec(*v)}", N(p), "t5_producto_escalar",
                  [(vec(u[0] * v[0], u[1] * v[1]), "como_vector"), (N(u[0] * v[1] + u[1] * v[0]), None), (N(-p) if p else "1", None)], [N(p + 1)],
                  [f"u·v = u₁v₁ + u₂v₂ = ({N(u[0])})·({N(v[0])}) + ({N(u[1])})·({N(v[1])}) = {N(p)}."], "El producto escalar es un NÚMERO, no un vector.")
    if d == 2:
        c = nz(rng, -4, 4)
        a1, a2 = nz(rng, -4, 4), nz(rng, -4, 4)
        # u = (a1, k), v = (a2, c): perpendicular si a1 a2 + k c = 0 → k = −a1 a2/c
        k = F(-a1 * a2, c)
        k1 = F(1 - a1 * a2, c)
        return mk(f"¿Para qué valor de k son perpendiculares u = ({N(a1)}, k) y v = ({N(a2)}, {N(c)})?", f"k = {N(k)}", "t5_producto_escalar",
                  [(f"k = {N(k1)}", "igual_uno"), (f"k = {N(-k)}" if k else "k = 1", None), (f"k = {N(F(a1 * a2, c) + 1)}", None)], [f"k = {N(k + 1)}"],
                  ["Perpendiculares ⇔ u·v = 0.", f"{N(a1)}·{N(a2)} + {N(c)}k = 0 → k = {N(k)}."], "La condición de perpendicularidad es u·v = 0.")
    p = dot(u, v)
    cosv = p / (math.sqrt(norm2(u)) * math.sqrt(norm2(v)))
    ang = math.degrees(math.acos(max(-1, min(1, cosv))))
    return mk(f"Calcula el ángulo que forman u = {vec(*u)} y v = {vec(*v)} (redondea a décimas)", grad(ang), "t5_producto_escalar",
              [(grad(180 - ang) if abs(ang - 90) > 0.05 else "0°", None), (grad(math.degrees(math.acos(max(-1, min(1, abs(cosv) * 0.9))))), None), (grad(ang / 2), None)], [grad(ang + 10)],
              [f"cos α = u·v/(|u||v|) = {N(p)}/(√{norm2(u)}·√{norm2(v)}) ≈ {D(cosv, 4)}.", f"α ≈ {grad(ang)}."], "cos α = u·v/(|u|·|v|); si u·v < 0 el ángulo es obtuso.")


# ================================================================ GEO.ANALIT

@generador("t5_punto_medio")
def gen_punto_medio(rng, d):
    for _ in range(100):
        A = (rng.randint(-7, 7), rng.randint(-7, 7))
        tri = rng.choice([(6, 8), (3, 4), (8, 6), (4, 3), (5, 12), (12, 5), (2, 4), (4, 2), (2, 6), (6, 2), (1, 3)]) if d == 2 else (2 * rng.randint(-4, 4), 2 * rng.randint(-4, 4))
        B = (A[0] + tri[0] * rng.choice([1, -1]), A[1] + tri[1] * rng.choice([1, -1]))
        if A != B:
            break
    M = (F(A[0] + B[0], 2), F(A[1] + B[1], 2))
    if d == 1:
        return mk(f"Calcula el punto medio del segmento de extremos A{pt(*A)} y B{pt(*B)}", f"M{pt(*M)}", "t5_punto_medio",
                  [(f"M{pt(F(B[0] - A[0], 2), F(B[1] - A[1], 2))}", "resta"), (f"M{pt(A[0] + B[0], A[1] + B[1])}", None), (f"M{pt(*M[::-1])}" if M[0] != M[1] else f"M{pt(M[0], -M[1])}", None)], [],
                  ["M = ((x₁ + x₂)/2, (y₁ + y₂)/2).", f"M{pt(*M)}."], "El punto medio es la media de las coordenadas (se suman, no se restan).")
    if d == 2:
        dd = (B[0] - A[0], B[1] - A[1])
        return mk(f"Calcula la distancia entre A{pt(*A)} y B{pt(*B)}", modulo(dd), "t5_punto_medio",
                  [(N(norm2(dd)), None), (N(abs(dd[0]) + abs(dd[1])), None), (rad(norm2((A[0] + B[0], A[1] + B[1]))), None)], [rad(norm2(dd) + 1)],
                  [f"d = √((x₂ − x₁)² + (y₂ − y₁)²) = √({N(dd[0])}² + {N(dd[1])}²) = {modulo(dd)}."], "La distancia es el módulo del vector AB.")
    S = (2 * B[0] - A[0], 2 * B[1] - A[1])
    return mk(f"Calcula el simétrico de A{pt(*A)} respecto del punto B{pt(*B)}", f"A′{pt(*S)}", "t5_punto_medio",
              [(f"A′{pt(*M)}", "simetrico_medio"), (f"A′{pt(2 * A[0] - B[0], 2 * A[1] - B[1])}", None), (f"A′{pt(B[0] - A[0], B[1] - A[1])}", None)], [],
              ["B es el punto medio de A y su simétrico A′: A′ = 2B − A.", f"A′{pt(*S)}."], "El simétrico no es el punto medio: el punto medio es B.")


@generador("t5_ecuacion_recta")
def gen_ecuacion_recta(rng, d):
    P0 = (rng.randint(-5, 5), rng.randint(-5, 5))
    for _ in range(100):
        v = (nz(rng, -5, 5), nz(rng, -5, 5))
        if abs(v[0]) != abs(v[1]) and math.gcd(*v) == 1:
            break
    A, B = v[1], -v[0]
    C = -(A * P0[0] + B * P0[1])
    resp = lin(A, B, C)
    wrong_m = F(v[0], v[1])  # pendiente invertida
    e1 = lin(wrong_m, -1, P0[1] - wrong_m * P0[0])
    e2 = lin(v[0], v[1], -(v[0] * P0[0] + v[1] * P0[1]))  # usa v como normal
    if d == 1:
        m = F(v[1], v[0])
        return mk(f"Escribe en forma general la recta que pasa por {pt(*P0)} con pendiente {N(m)}", lin(m, -1, P0[1] - m * P0[0]), "t5_ecuacion_recta",
                  [(lin(-1 / m, -1, P0[1] + P0[0] / m), None), (lin(m, -1, P0[1] + m * P0[0]), None), (lin(1 / m, -1, P0[1] - P0[0] / m), "pendiente_director")], [],
                  [f"Punto-pendiente: y − ({N(P0[1])}) = {N(m)}(x − ({N(P0[0])})).", f"Paso todo a un miembro con coeficientes enteros: {lin(m, -1, P0[1] - m * P0[0])}."], "Forma general Ax + By + C = 0 con enteros.")
    if d == 2:
        return mk(f"Escribe en forma general la recta que pasa por {pt(*P0)} con vector director {vec(*v)}", resp, "t5_ecuacion_recta",
                  [(e1, "pendiente_director"), (e2, "director_general"), (lin(A, B, -C), None)], [lin(A, B, C + 1)],
                  [f"Con director (v₁, v₂) = {vec(*v)}, la general es v₂x − v₁y + C = 0: {N(A)}x {'+' if B >= 0 else '−'} {N(abs(B))}y + C = 0.", f"Paso por {pt(*P0)}: C = {N(C)}. {resp}."],
                  "La pendiente es v₂/v₁ y (A, B) de la general es un vector NORMAL, no director.")
    return mk(f"¿Cuál de estos es un vector director de la recta {resp}?", vec(*v) if v[0] > 0 else vec(-v[0], -v[1]), "t5_ecuacion_recta",
              [(vec(A, B) if A > 0 or (A == 0 and B > 0) else vec(-A, -B), "director_general"), (vec(v[1], v[0]), None), (vec(v[0], -v[1]) if v[0] > 0 else vec(-v[0], v[1]), None)], [],
              ["En Ax + By + C = 0, (A, B) es normal; un director es (−B, A) o (B, −A).", f"Director: {vec(*v) if v[0] > 0 else vec(-v[0], -v[1])}."], "Normal (A, B) y director (−B, A) son perpendiculares.")


@generador("t5_posicion_rectas")
def gen_posicion_rectas(rng, d):
    for _ in range(200):
        A1, B1 = nz(rng, -5, 5), nz(rng, -5, 5)
        x0, y0 = rng.randint(-4, 4), rng.randint(-4, 4)
        C1 = -(A1 * x0 + B1 * y0)
        caso = rng.choice(["sec", "par", "coin"])
        if caso == "sec":
            A2, B2 = nz(rng, -5, 5), nz(rng, -5, 5)
            if A1 * B2 - A2 * B1 == 0:
                continue
            C2 = -(A2 * x0 + B2 * y0)
        else:
            k = rng.choice([2, -1, -2, 3])
            A2, B2 = k * A1, k * B1
            C2 = k * C1 if caso == "coin" else k * C1 + nz(rng, -4, 4)
        break
    r1 = terms([(A1, "x"), (B1, "y"), (C1, "")]) + " = 0"
    r2 = terms([(A2, "x"), (B2, "y"), (C2, "")]) + " = 0"
    T = {"sec": f"Secantes en {pt(x0, y0)}", "par": "Paralelas", "coin": "Coincidentes"}
    resp = T[caso]
    if caso == "sec":
        otro = (x0 + B1, y0 - A1)  # otro punto de la primera recta
        dist = [(f"Secantes en {pt(*otro)}", "corte_una_recta"), (T["par"], None), (T["coin"], None)]
    else:
        dist = [(T["coin"] if caso == "par" else T["par"], "paralelas_coincidentes"), (f"Secantes en {pt(x0, y0)}", None), ("Perpendiculares", None)]
    return mk(f"Estudia la posición relativa de las rectas r: {r1} y s: {r2}", resp, "t5_posicion_rectas", dist, [],
              ["Comparo A/A′ con B/B′: si son distintos, secantes (resuelvo el sistema para el corte).", "Si son iguales, miro C/C′: iguales → coincidentes; distintos → paralelas.", f"{resp}."],
              "Coeficientes proporcionales: paralelas o coincidentes según el término independiente.")


def continua(P0, v, vs=("x", "y", "z")):
    parts = []
    for c, a, x in zip(P0, v, vs):
        num = P({1: 1, 0: -c}, x) if c else x
        num = f"({num})" if c else x
        den = N(a) if a > 0 else f"({N(a)})"
        parts.append(f"{num}/{den}")
    return " = ".join(parts)


@generador("t5_recta_vectorial")
def gen_recta_vectorial(rng, d):
    P0 = (rng.randint(-5, 5), rng.randint(-5, 5))
    v = (nz(rng, -4, 4), nz(rng, -4, 4))
    if d == 1:
        resp = continua(P0, v)
        return mk(f"Escribe la ecuación continua de la recta que pasa por {pt(*P0)} con vector director {vec(*v)}", resp, "t5_recta_vect",
                  [(continua((-P0[0], -P0[1]), v), "signo_punto"), (continua(v, P0) if all(P0) else continua(v, (1, 1)), "director_punto"), (continua(P0, (v[1], v[0])), None)], [],
                  ["Continua: (x − x₀)/v₁ = (y − y₀)/v₂, con (x₀, y₀) el punto y (v₁, v₂) el director.", f"{resp}."], "En la continua, el punto aparece restando: x − x₀ (con x₀ = −1 queda x + 1).")
    if d == 2:
        g = lin(v[1], -v[0], -(v[1] * P0[0] - v[0] * P0[1]))
        return mk(f"Pasa a forma general la recta {continua(P0, v)}", g, "t5_recta_vect",
                  [(lin(v[1], -v[0], v[1] * P0[0] - v[0] * P0[1]), "signo_punto"), (lin(v[0], -v[1], -(v[0] * P0[0] - v[1] * P0[1])), "director_punto"), (lin(v[1], v[0], -(v[1] * P0[0] + v[0] * P0[1])), None)], [],
                  ["Multiplico en cruz: v₂(x − x₀) = v₁(y − y₀).", f"Paso todo a un miembro: {g}."], "Multiplicar en cruz y ordenar; se comprueba con el punto.")
    t = nz(rng, -3, 3)
    Q_ = (P0[0] + t * v[0], P0[1] + t * v[1])
    si = rng.random() < 0.5
    Qp = Q_ if si else (Q_[0], Q_[1] + nz(rng, -2, 2))
    resp = f"Sí: se obtiene con t = {N(t)}" if si else "No pertenece a la recta"
    return mk(f"¿Pertenece el punto {pt(*Qp)} a la recta (x, y) = {pt(*P0)} + t{vec(*v)}?", resp, "t5_recta_vect",
              [("No pertenece a la recta" if si else f"Sí: se obtiene con t = {N(t)}", None), (f"Sí: se obtiene con t = {N(-t)}", "signo_punto"), (f"Sí: se obtiene con t = {N(t + 1)}", None)], [],
              ["Busco un t que dé las dos coordenadas a la vez.", f"De la x: t = {N(F(Qp[0] - P0[0], v[0]))}; compruebo en la y. {resp}."], "Un punto está en la recta si EL MISMO t sirve para todas las coordenadas.")


@generador("t5_paralela_perpendicular")
def gen_paralela_perpendicular(rng, d):
    A, B = nz(rng, -5, 5), nz(rng, -5, 5)
    C = rng.randint(-8, 8)
    P0 = (rng.randint(-5, 5), rng.randint(-5, 5))
    r = terms([(A, "x"), (B, "y"), (C, "")]) + " = 0"
    m = F(-A, B)
    if d == 1:
        resp = lin(A, B, -(A * P0[0] + B * P0[1]))
        return mk(f"Halla la recta paralela a {r} que pasa por {pt(*P0)}", resp, "t5_par_perp",
                  [(lin(B, -A, -(B * P0[0] - A * P0[1])), None), (lin(A, B, C), None), (lin(A, B, A * P0[0] + B * P0[1]), None)], [],
                  ["Paralela: mismo vector normal (A, B), solo cambia C.", f"Sustituyo el punto: {resp}."], "Rectas paralelas: Ax + By + C′ = 0 con los mismos A y B.")
    resp = lin(B, -A, -(B * P0[0] - A * P0[1]))
    mp = -1 / m
    return mk(f"Halla la recta perpendicular a {r} que pasa por {pt(*P0)}", resp, "t5_par_perp",
              [(lin(-m, -1, P0[1] + m * P0[0]), "pendiente_opuesta"), (lin(1 / m, -1, P0[1] - P0[0] / m), "inversa_sin_signo"), (lin(A, B, -(A * P0[0] + B * P0[1])), None)], [],
              [f"La pendiente de r es m = {N(m)}; la perpendicular tiene m′ = −1/m = {N(mp)}.", f"Por {pt(*P0)}: {resp}."],
              "Perpendicular: pendiente inversa Y cambiada de signo (m·m′ = −1).")


NORMALES_ENTERAS = [(3, 4), (4, 3), (6, 8), (5, 12), (12, 5), (8, 6), (1, 0), (0, 1), (3, -4), (4, -3), (5, -12), (8, -15), (15, 8)]


@generador("t5_distancia_recta")
def gen_distancia_recta(rng, d):
    if d < 3:
        A, B = rng.choice(NORMALES_ENTERAS) if d == 1 else (nz(rng, -4, 4), nz(rng, -4, 4))
        C = rng.randint(-10, 10)
        P0 = (rng.randint(-5, 5), rng.randint(-5, 5))
        val = A * P0[0] + B * P0[1] + C
        if val == 0:
            C += 1
            val += 1
        n2 = A * A + B * B
        resp = rad(n2, abs(val), n2) if math.isqrt(n2) ** 2 != n2 else N(F(abs(val), math.isqrt(n2)))
        neg = (rad(n2, val, n2) if math.isqrt(n2) ** 2 != n2 else N(F(val, math.isqrt(n2))))
        return mk(f"Calcula la distancia del punto P{pt(*P0)} a la recta {terms([(A, 'x'), (B, 'y'), (C, '')])} = 0", resp, "t5_distancia",
                  [(neg if val < 0 else N(F(abs(val), n2)) if n2 != 1 else N(abs(val) + 1), "sin_valor_absoluto" if val < 0 else "sin_raiz"), (N(F(abs(val), n2)), "sin_raiz"), (N(abs(val)), None)], [N(F(abs(val) + 1, 5))],
                  [f"d = |Ax₀ + By₀ + C|/√(A² + B²) = |{N(val)}|/√{n2}.", f"d = {resp}."], "La distancia lleva valor absoluto y la raíz de A² + B² en el denominador.")
    m1, m2 = rng.sample([-3, -2, -1, 0, 1, 2, 3, F(1, 2), F(-1, 2)], 2)
    if 1 + m1 * m2 == 0:
        ang = 90.0
    else:
        ang = math.degrees(math.atan(abs((m2 - m1) / (1 + m1 * m2))))
    return mk(f"Calcula el ángulo que forman las rectas y = {P({1: m1, 0: 1})} e y = {P({1: m2, 0: -2})} (redondea a décimas)", grad(ang), "t5_distancia",
              [(grad(180 - ang) if ang != 90 else "0°", None), (grad(math.degrees(math.atan(abs(float(m2 - m1))))), None), (grad(ang / 2), None)], [grad(ang + 5)],
              ["tg α = |(m₂ − m₁)/(1 + m₁m₂)| (ángulo agudo entre las rectas).", f"α ≈ {grad(ang)}."], "El ángulo entre dos rectas se toma entre 0° y 90°.")


@generador("t5_circunferencia")
def gen_circunferencia(rng, d):
    a, b, r = rng.randint(-5, 5), rng.randint(-5, 5), rng.randint(1, 7)
    if d == 1:
        eq = f"({P({1: 1, 0: -a})})² + ({P({1: 1, 0: -b}, 'y')})² = {r * r}".replace("(x)²", "x²").replace("(y)²", "y²")
        return mk(f"¿Cuáles son el centro y el radio de la circunferencia {eq}?", f"C{pt(a, b)}, r = {r}", "t5_circunferencia",
                  [(f"C{pt(-a, -b)}, r = {r}", "signo_centro"), (f"C{pt(a, b)}, r = {r * r}", "radio_sin_raiz"), (f"C{pt(-a, -b)}, r = {r * r}", None)], [f"C{pt(b, a)}, r = {r}"],
                  ["(x − a)² + (y − b)² = r² tiene centro (a, b) y radio r.", f"C{pt(a, b)} y r = √{r * r} = {r}."], "(x + 3)² corresponde a a = −3. El número de la derecha es r².")
    if d == 2:
        Cc = a * a + b * b - r * r
        eq = terms([(1, "x²"), (1, "y²"), (-2 * a, "x"), (-2 * b, "y"), (Cc, "")]) + " = 0"
        return mk(f"Halla el centro y el radio de la circunferencia {eq}", f"C{pt(a, b)}, r = {r}", "t5_circunferencia",
                  [(f"C{pt(-a, -b)}, r = {r}", "signo_centro"), (f"C{pt(a, b)}, r = {r * r}", "radio_sin_raiz"), (f"C{pt(-2 * a, -2 * b)}, r = {r}", None)], [f"C{pt(a, b)}, r = {r + 1}"],
                  [f"Centro: (−D/2, −E/2) = {pt(a, b)}.", f"r = √(a² + b² − F) = √({a * a} + {b * b} − ({Cc})) = {r}."], "Completando cuadrados: x² − 2ax = (x − a)² − a².")
    A_, B_ = (rng.randint(-5, 5), rng.randint(-5, 5)), (rng.randint(-5, 5), rng.randint(-5, 5))
    while A_ == B_:
        B_ = (B_[0] + 1, B_[1])
    M = (F(A_[0] + B_[0], 2), F(A_[1] + B_[1], 2))
    v = (B_[0] - A_[0], B_[1] - A_[1])
    resp = lin(v[0], v[1], -(v[0] * M[0] + v[1] * M[1]))
    return mk(f"Halla la ecuación de la mediatriz del segmento de extremos A{pt(*A_)} y B{pt(*B_)}", resp, "t5_circunferencia",
              [(lin(v[1], -v[0], -(v[1] * M[0] - v[0] * M[1])), None), (lin(v[0], v[1], v[0] * M[0] + v[1] * M[1]), None), (lin(v[0], v[1], -(v[0] * A_[0] + v[1] * A_[1])), None)], [],
              [f"La mediatriz pasa por el punto medio M{pt(*M)} y es perpendicular a AB = {vec(*v)} (que es su normal).", f"{resp}."], "Mediatriz: puntos que equidistan de A y B.")


PIT = [(5, 3, 4), (5, 4, 3), (10, 6, 8), (10, 8, 6), (13, 5, 12), (13, 12, 5), (17, 8, 15), (17, 15, 8), (25, 7, 24), (25, 24, 7), (15, 9, 12), (15, 12, 9), (20, 12, 16)]


@generador("t5_conicas")
def gen_conicas(rng, d):
    if d == 1:
        a, b, c = rng.choice(PIT)
        vert = rng.random() < 0.3
        eq = f"x²/{a * a} + y²/{b * b} = 1" if not vert else f"x²/{b * b} + y²/{a * a} = 1"
        f = lambda cc: f"({N(-cc)}, 0) y ({N(cc)}, 0)" if not vert else f"(0, {N(-cc)}) y (0, {N(cc)})"
        fr = lambda s: f"(−{s}, 0) y ({s}, 0)" if not vert else f"(0, −{s}) y (0, {s})"
        return mk(f"Halla los focos de la elipse {eq}", f"Focos {f(c)}", "t5_conicas",
                  [(f"Focos {fr(rad(a * a + b * b))}", "c_suma"), (f"Focos {f(c * c)}", "semiejes_cuadrado"), (f"Focos {f(a)}", None)], [f"Focos {f(b)}"],
                  [f"Semiejes: a = {a}, b = {b}. En la elipse c² = a² − b² = {a * a - b * b}, c = {c}.", f"Focos {f(c)}."], "Elipse: c² = a² − b²; hipérbola: c² = a² + b². a y b son las raíces de los denominadores.")
    if d == 2:
        if rng.random() < 0.5:
            a, b, c = rng.choice(PIT)
            eq = f"x²/{a * a} + y²/{b * b} = 1"
            return mk(f"Calcula la excentricidad de la elipse {eq}", f"e = {N(F(c, a))}", "t5_conicas",
                      [(f"e = {N(F(c, b))}", None), (f"e = {N(F(c * c, a * a))}", "semiejes_cuadrado"), (f"e = {N(F(b, a))}", None)], [],
                      [f"c = √(a² − b²) = {c}.", f"e = c/a = {N(F(c, a))}."], "La excentricidad de una elipse es c/a (menor que 1).")
        c, a, b = rng.choice(PIT)
        eq = f"x²/{a * a} − y²/{b * b} = 1"
        return mk(f"Halla los focos de la hipérbola {eq}", f"Focos ({N(-c)}, 0) y ({N(c)}, 0)", "t5_conicas",
                  [(f"Focos (−{rad(abs(a * a - b * b)) if a != b else 0}, 0) y ({rad(abs(a * a - b * b))}, 0)", "c_suma"), (f"Focos ({N(-c * c)}, 0) y ({N(c * c)}, 0)", "semiejes_cuadrado"), (f"Focos (0, {N(-c)}) y (0, {N(c)})", None)], [],
                  [f"En la hipérbola c² = a² + b² = {c * c}, c = {c}.", f"Focos (±{c}, 0)."], "Hipérbola: c² = a² + b².")
    if rng.random() < 0.5:
        c, a, b = rng.choice(PIT)
        eq = f"x²/{a * a} − y²/{b * b} = 1"
        m = F(b, a)
        return mk(f"Halla las asíntotas de la hipérbola {eq}", f"y = {P({1: m})} e y = {P({1: -m})}", "t5_conicas",
                  [(f"y = {P({1: 1 / m})} e y = {P({1: -1 / m})}", None), (f"y = {P({1: m * m})} e y = {P({1: -m * m})}", "semiejes_cuadrado"), (f"y = {P({1: m})}", None)], [],
                  [f"Asíntotas de x²/a² − y²/b² = 1: y = ±(b/a)x.", f"a = {a}, b = {b}: y = ±{N(m)}x."], "y = ±(b/a)x con a y b los semiejes (raíces de los denominadores).")
    k = rng.choice([2, 4, 6, 8, 12, 16, -4, -8, 20])
    return mk(f"Halla el foco y la directriz de la parábola y² = {N(k)}x", f"Foco ({N(F(k, 4))}, 0); directriz x = {N(F(-k, 4))}", "t5_conicas",
              [(f"Foco ({N(F(k, 2))}, 0); directriz x = {N(F(-k, 2))}", None), (f"Foco ({N(F(-k, 4))}, 0); directriz x = {N(F(k, 4))}", None), (f"Foco ({N(k)}, 0); directriz x = {N(-k)}", "semiejes_cuadrado")], [],
              [f"y² = 4px con 4p = {N(k)}: p = {N(F(k, 4))}.", f"Foco (p, 0) = ({N(F(k, 4))}, 0) y directriz x = −p."], "En y² = 2px el foco es (p/2, 0); conviene identificar bien el parámetro.")


# ================================================================ GEO.ESPACIO

def _v3(rng, lo=-4, hi=4):
    return tuple(rng.randint(lo, hi) for _ in range(3))


@generador("t5_vectores_espacio")
def gen_vectores_espacio(rng, d):
    if d == 1:
        u = _v3(rng)
        while norm2(u) == 0:
            u = _v3(rng)
        return mk(f"Calcula el módulo del vector u = {vec(*u)}", f"|u| = {modulo(u)}", "t5_vect_espacio",
                  [(f"|u| = {rad(u[0] ** 2 + u[1] ** 2)}", "dos_coordenadas"), (f"|u| = {N(norm2(u))}", None), (f"|u| = {N(sum(abs(x) for x in u))}", None)], [f"|u| = {rad(norm2(u) + 1)}"],
                  [f"|u| = √(u₁² + u₂² + u₃²) = √{norm2(u)} = {modulo(u)}."], "En el espacio el módulo usa las TRES coordenadas.")
    if d == 2:
        u, v = _v3(rng), _v3(rng)
        p = dot(u, v)
        return mk(f"Calcula el producto escalar de u = {vec(*u)} y v = {vec(*v)}", N(p), "t5_vect_espacio",
                  [(vec(*(a * b for a, b in zip(u, v))), None), (N(u[0] * v[0] + u[1] * v[1]), "dos_coordenadas"), (N(-p) if p else "1", None)], [N(p + 1)],
                  [f"u·v = u₁v₁ + u₂v₂ + u₃v₃ = {N(p)}."], "El producto escalar es un número.")
    for _ in range(200):
        u, v = _v3(rng, -3, 3), _v3(rng, -3, 3)
        dep = rng.random() < 0.5
        if dep:
            a, b = rng.choice([1, 2, -1]), rng.choice([1, -1, 2])
            w = tuple(a * x + b * y for x, y in zip(u, v))
        else:
            w = _v3(rng, -3, 3)
        M = [list(u), list(v), list(w)]
        dt = det3(M)
        prop = any(all(x * q == y * p_ for x, y, p_, q in [(A[0], B[0], A[1], B[1]), (A[1], B[1], A[2], B[2]), (A[0], B[0], A[2], B[2])]) for A, B in ((u, v), (u, w), (v, w)))
        if (dt == 0) == dep and not prop and all(any(t) for t in (u, v, w)):
            break
    resp = "Son linealmente dependientes (determinante 0)" if dep else f"Son linealmente independientes (determinante {N(dt)})"
    return mk(f"¿Son linealmente independientes u = {vec(*u)}, v = {vec(*v)} y w = {vec(*w)}?", resp, "t5_vect_espacio",
              [("Son linealmente independientes: no hay dos proporcionales", "tres_proporcionalidad") if dep else ("Son linealmente dependientes (determinante 0)", None),
               ("Son linealmente dependientes: tres vectores siempre lo son", None), (f"Son linealmente independientes (determinante {N(-dt) if dt else 1})", None)], [],
              ["Tres vectores de ℝ³ son independientes si el determinante que forman es distinto de 0.", f"det = {N(dt)}: {resp}."],
              "Con tres vectores no basta mirar si hay dos proporcionales: uno puede ser combinación de los otros dos.")


@generador("t5_producto_vectorial")
def gen_producto_vectorial(rng, d):
    if d == 1:
        u, v = _v3(rng, -3, 4), _v3(rng, -3, 4)
        w = cross(u, v)
        wmal = (w[0], -w[1], w[2])
        return mk(f"Calcula u × v con u = {vec(*u)} y v = {vec(*v)}", vec(*w), "t5_prod_vectorial",
                  [(vec(*wmal) if wmal != w else vec(w[0] + 1, w[1], w[2]), "signo_j"), (vec(*(-x for x in w)), None), (vec(*(a * b for a, b in zip(u, v))), None)], [],
                  ["u × v = (u₂v₃ − u₃v₂, u₃v₁ − u₁v₃, u₁v₂ − u₂v₁) (determinante con i, j, k; el adjunto de j lleva signo menos).", f"u × v = {vec(*w)}."],
                  "El producto vectorial es un vector perpendicular a ambos; cuidado con el signo de la segunda componente.")
    if d == 2:
        A, B, C = _v3(rng, -2, 3), _v3(rng, -2, 3), _v3(rng, -2, 3)
        AB = tuple(b - a for a, b in zip(A, B))
        AC = tuple(c - a for a, c in zip(A, C))
        w = cross(AB, AC)
        if norm2(w) == 0:
            return None
        return mk(f"Calcula el área del triángulo de vértices A{pt(*A)}, B{pt(*B)} y C{pt(*C)}", f"{rad(norm2(w), 1, 2)} u²", "t5_prod_vectorial",
                  [(f"{rad(norm2(w))} u²", "area_sin_mitad"), (f"{N(F(norm2(w), 2))} u²", None), (f"{rad(norm2(w), 1, 6)} u²", None)], [],
                  [f"AB = {vec(*AB)}, AC = {vec(*AC)}; AB × AC = {vec(*w)}.", f"Área = |AB × AC|/2 = {rad(norm2(w), 1, 2)} u²."], "|u × v| es el área del paralelogramo; el triángulo es la mitad.")
    for _ in range(100):
        u, v, w = _v3(rng, -2, 3), _v3(rng, -2, 3), _v3(rng, -2, 3)
        m = det3([list(u), list(v), list(w)])
        if m:
            break
    return mk(f"Calcula el volumen del tetraedro determinado por u = {vec(*u)}, v = {vec(*v)} y w = {vec(*w)}", f"{N(F(abs(m), 6))} u³", "t5_prod_vectorial",
              [(f"{N(abs(m))} u³", "tetraedro_sin_sexto"), (f"{N(F(abs(m), 2))} u³", None), (f"{N(F(abs(m), 3))} u³", None)], [],
              [f"Producto mixto [u, v, w] = det(u, v, w) = {N(m)}.", f"V = |[u, v, w]|/6 = {N(F(abs(m), 6))} u³."], "El producto mixto da el volumen del paralelepípedo; el tetraedro es 1/6.")


@generador("t5_recta_espacio")
def gen_recta_espacio(rng, d):
    if d == 1:
        P0 = _v3(rng, -5, 5)
        v = tuple(nz(rng, -4, 4) for _ in range(3))
        resp = continua(P0, v, ("x", "y", "z"))
        return mk(f"Escribe la ecuación continua de la recta que pasa por {pt(*P0)} con vector director {vec(*v)}", resp, "t5_recta_espacio",
                  [(continua(tuple(-x for x in P0), v, ("x", "y", "z")), None), (continua(v, P0, ("x", "y", "z")) if all(P0) else continua(v, (1, 1, 1), ("x", "y", "z")), None), (continua(P0, v[::-1], ("x", "y", "z")), None)], [],
                  ["(x − x₀)/v₁ = (y − y₀)/v₂ = (z − z₀)/v₃.", f"{resp}."], "En la continua el punto aparece restando.")
    for _ in range(200):
        n1, n2 = _v3(rng, -3, 3), _v3(rng, -3, 3)
        w = cross(n1, n2)
        if norm2(w) == 0 or 0 in w and d == 3 and False:
            continue
        pw = prim(w)
        cands = [prim(n1), prim(n2), prim((w[0], -w[1], w[2]))]
        if all(norm2(c) and cross(c, w) != (0, 0, 0) for c in cands):
            break
    d1, d2 = rng.randint(-5, 5), rng.randint(-5, 5)
    r = f"{{{plano(*n1, d1)}; {plano(*n2, d2)}}}"
    return mk(f"¿Cuál de estos es un vector director de la recta {r}?", vec(*pw), "t5_recta_espacio",
              [(vec(*cands[0]), "director_normal"), (vec(*cands[1]), "director_normal"), (vec(*cands[2]), None)], [],
              ["El director es perpendicular a los dos vectores normales: v = n₁ × n₂.", f"n₁ × n₂ = {vec(*w)} ∼ {vec(*pw)}."], "Los coeficientes de cada plano forman su vector NORMAL, no un director de la recta.")


@generador("t5_plano")
def gen_plano(rng, d):
    if d == 1:
        P0 = _v3(rng, -4, 4)
        n = tuple(rng.randint(-4, 4) for _ in range(3))
        while norm2(n) == 0:
            n = _v3(rng)
        Dd = -dot(n, P0)
        resp = plano(*n, Dd)
        return mk(f"Halla el plano que pasa por {pt(*P0)} y tiene vector normal {vec(*n)}", resp, "t5_plano",
                  [(plano(*n, -Dd) if Dd else plano(*n, 1), None), (plano(*P0, -dot(P0, n)) if norm2(P0) else plano(1, 1, 1, 0), "normal_director"), (plano(*n, 0) if Dd else plano(*n, 2), None)], [],
                  ["Plano con normal (A, B, C): Ax + By + Cz + D = 0.", f"Sustituyo el punto para hallar D = {N(Dd)}: {resp}."], "Los coeficientes de x, y, z son el vector normal.")
    for _ in range(200):
        A, B, C = _v3(rng, -3, 3), _v3(rng, -3, 3), _v3(rng, -3, 3)
        u = tuple(b - a for a, b in zip(A, B))
        v = tuple(c - a for a, c in zip(A, C))
        n = cross(u, v)
        if norm2(n):
            break
    Dd = -dot(n, A)
    resp = plano(*n, Dd)
    mal = cross(u, u) if False else u
    return mk(f"Halla el plano que pasa por A{pt(*A)}, B{pt(*B)} y C{pt(*C)}", resp, "t5_plano",
              [(plano(*u, -dot(u, A)), "normal_director"), (plano(n[0], -n[1], n[2], -(n[0] * A[0] - n[1] * A[1] + n[2] * A[2])) if n[1] else plano(*n, -Dd), None), (plano(*n, -Dd) if Dd else plano(*n, 3), None)], [],
              [f"Vectores del plano: AB = {vec(*u)} y AC = {vec(*v)}.", f"Normal: AB × AC = {vec(*n)}.", f"Paso por A: {resp}."], "El normal se obtiene con el producto vectorial de dos vectores del plano.")


REL_RECTAS = {"par": "Paralelas", "coin": "Coincidentes", "sec": "Secantes", "cruz": "Se cruzan"}


def _vec_recta(P0, v, t="t"):
    return f"(x, y, z) = {pt(*P0)} + {t}{vec(*v)}"


@generador("t5_posicion_espacio")
def gen_posicion_espacio(rng, d):
    for _ in range(300):
        P1 = _v3(rng, -3, 3)
        v1 = _v3(rng, -2, 2)
        if norm2(v1) == 0:
            continue
        caso = rng.choice(["par", "coin", "sec", "cruz"])
        if caso in ("par", "coin"):
            k = rng.choice([1, 2, -1, -2])
            v2 = tuple(k * x for x in v1)
            s = rng.randint(-2, 2)
            P2 = tuple(p + s * x for p, x in zip(P1, v1))
            if caso == "par":
                off = _v3(rng, -2, 2)
                if cross(off, v1) == (0, 0, 0):
                    continue
                P2 = tuple(p + o for p, o in zip(P2, off))
        else:
            v2 = _v3(rng, -2, 2)
            if cross(v1, v2) == (0, 0, 0):
                continue
            t0, s0 = rng.randint(-2, 2), rng.randint(-2, 2)
            X = tuple(p + t0 * x for p, x in zip(P1, v1))
            P2 = tuple(x - s0 * y for x, y in zip(X, v2))
            if caso == "cruz":
                off = cross(v1, v2)
                P2 = tuple(p + o // math.gcd(*[abs(z) for z in off]) for p, o in zip(P2, off))
        w = tuple(b - a for a, b in zip(P1, P2))
        m = det3([list(w), list(v1), list(v2)])
        if caso == "sec" and m != 0 or caso == "cruz" and m == 0:
            continue
        break
    resp = REL_RECTAS[caso]
    err = {"cruz": {"sec": "cruza_secante"}, "sec": {"cruz": "cruza_secante"}}.get(caso, {})
    return mk(f"Estudia la posición relativa de r: {_vec_recta(P1, v1)} y s: {_vec_recta(P2, v2, 'λ')}", resp, "t5_posicion_espacio",
              [(v, err.get(k)) for k, v in REL_RECTAS.items() if k != caso], [],
              ["Comparo los directores: proporcionales → paralelas o coincidentes (miro si un punto de r está en s).",
               "No proporcionales → secantes si el determinante de (P₁P₂, u, v) es 0; si no, se cruzan.", f"{resp}."],
              "Dos rectas no paralelas del espacio pueden no cortarse: se cruzan.")


def _ang_vec(u, v, agudo=True):
    c = dot(u, v) / (math.sqrt(norm2(u)) * math.sqrt(norm2(v)))
    if agudo:
        c = abs(c)
    return math.degrees(math.acos(max(-1, min(1, c))))


@generador("t5_angulos_espacio")
def gen_angulos_espacio(rng, d):
    for _ in range(100):
        u, v = _v3(rng, -3, 3), _v3(rng, -3, 3)
        if norm2(u) and norm2(v) and cross(u, v) != (0, 0, 0) and dot(u, v) != 0:
            break
    tipo = {1: "rectas", 2: "planos", 3: "recta_plano"}[d]
    a = _ang_vec(u, v)
    obt = 180 - a
    if tipo == "rectas":
        enun = f"Calcula el ángulo entre las rectas de vectores directores u = {vec(*u)} y v = {vec(*v)} (redondea a décimas)"
        dist = [(grad(obt), "obtuso"), (grad(90 - a), "coseno_recta_plano"), (grad(a / 2), None)]
        resp = grad(a)
        pasos = [f"cos α = |u·v|/(|u||v|) = {abs(dot(u, v))}/(√{norm2(u)}·√{norm2(v)}).", f"α ≈ {resp} (se toma el agudo)."]
    elif tipo == "planos":
        enun = f"Calcula el ángulo entre los planos {plano(*u, 1)} y {plano(*v, -2)} (redondea a décimas)"
        dist = [(grad(obt), "obtuso"), (grad(90 - a), None), (grad(a / 2), None)]
        resp = grad(a)
        pasos = ["El ángulo entre planos es el de sus vectores normales.", f"cos α = |n₁·n₂|/(|n₁||n₂|) → α ≈ {resp}."]
    else:
        enun = f"Calcula el ángulo entre la recta de director {vec(*u)} y el plano {plano(*v, 3)} (redondea a décimas)"
        resp = grad(90 - a)
        dist = [(grad(a), "coseno_recta_plano"), (grad(180 - (90 - a)), "obtuso"), (grad((90 - a) / 2), None)]
        pasos = ["Entre recta y plano: sen α = |v·n|/(|v||n|) (v director, n normal).", f"α ≈ {resp}."]
    return mk(enun, resp, "t5_angulos_espacio", dist, [], pasos, "Los ángulos entre rectas y planos se dan entre 0° y 90°; entre recta y plano se usa el seno.")


NORM3 = [(2, -1, 2), (1, 2, 2), (2, 3, 6), (1, 4, 8), (4, 4, 7), (2, 6, 9), (6, 2, 3), (2, 2, 1), (1, -2, 2), (3, 4, 12), (0, 3, 4), (0, 0, 1), (6, -2, 3)]


@generador("t5_distancias_espacio")
def gen_distancias_espacio(rng, d):
    n = rng.choice(NORM3) if d < 3 else _v3(rng, -3, 3)
    while norm2(n) == 0:
        n = _v3(rng, -3, 3)
    Dd = rng.randint(-8, 8)
    P0 = _v3(rng, -4, 4)
    val = dot(n, P0) + Dd
    if val == 0:
        Dd += 1
        val += 1
    n2 = norm2(n)
    if d == 2:
        D2 = Dd + nz(rng, -9, 9)
        dist_ = abs(Dd - D2)
        resp = N(F(dist_, math.isqrt(n2))) if math.isqrt(n2) ** 2 == n2 else rad(n2, dist_, n2)
        return mk(f"Calcula la distancia entre los planos paralelos {plano(*n, Dd)} y {plano(*n, D2)}", resp, "t5_distancias",
                  [(N(F(dist_, n2)), "sin_raiz"), (N(dist_), None), (N(F(abs(Dd + D2), math.isqrt(n2))) if math.isqrt(n2) ** 2 == n2 and Dd + D2 else N(F(dist_, 2)), None)], [],
                  ["Distancia entre planos paralelos Ax + By + Cz + D = 0 y D′: |D − D′|/√(A² + B² + C²).", f"= {dist_}/√{n2} = {resp}."], "Hay que dividir entre la raíz de A² + B² + C².")
    resp = N(F(abs(val), math.isqrt(n2))) if math.isqrt(n2) ** 2 == n2 else rad(n2, abs(val), n2)
    return mk(f"Calcula la distancia del punto P{pt(*P0)} al plano {plano(*n, Dd)}", resp, "t5_distancias",
              [(N(F(abs(val), n2)), "sin_raiz"), (N(abs(val)), None), ((N(F(val, math.isqrt(n2))) if math.isqrt(n2) ** 2 == n2 else rad(n2, val, n2)) if val < 0 else N(F(abs(val) + 1, math.isqrt(n2) if math.isqrt(n2) ** 2 == n2 else 1)), None)], [],
              [f"d = |Ax₀ + By₀ + Cz₀ + D|/√(A² + B² + C²) = |{N(val)}|/√{n2}.", f"d = {resp}."], "Fórmula con valor absoluto y raíz en el denominador.")


@generador("t5_proyeccion_simetrico")
def gen_proyeccion_simetrico(rng, d):
    P0 = _v3(rng, -4, 4)
    if d == 1:
        eje = rng.choice(["z = 0", "y = 0", "x = 0"])
        i = {"x = 0": 0, "y = 0": 1, "z = 0": 2}[eje]
        S = list(P0)
        S[i] = -S[i]
        Pr = list(P0)
        Pr[i] = 0
        if P0[i] == 0:
            P0 = tuple(x + (1 if j == i else 0) for j, x in enumerate(P0))
            S = list(P0)
            S[i] = -S[i]
            Pr = list(P0)
            Pr[i] = 0
        return mk(f"Halla el simétrico del punto P{pt(*P0)} respecto del plano {eje}", pt(*S), "t5_proyeccion",
                  [(pt(*Pr), "simetrico_proyeccion"), (pt(*(-x for x in P0)), None), (pt(*[(-x if j != i else x) for j, x in enumerate(P0)]), None)], [],
                  [f"La proyección sobre {eje} es {pt(*Pr)}; el simétrico está al otro lado a la misma distancia.", f"P′{pt(*S)}."], "El simétrico es P′ = 2M − P, con M la proyección.")
    for _ in range(200):
        n = rng.choice(NORM3[:10] + [(1, 1, 1), (1, 0, 1), (1, 1, 0), (1, -1, 0)])
        t = F(rng.randint(-2, 2))
        M = tuple(p + t * x for p, x in zip(P0, n))
        Dd = -dot(n, M)
        if t != 0:
            break
    Pl = plano(*n, Dd)
    S = tuple(2 * m - p for m, p in zip(M, P0))
    if d == 2:
        return mk(f"Halla la proyección ortogonal del punto P{pt(*P0)} sobre el plano {Pl}", pt(*M), "t5_proyeccion",
                  [(pt(*S), "simetrico_proyeccion"), (pt(*(p + x for p, x in zip(P0, n))), "recta_no_perpendicular"), (pt(*(p - t * x for p, x in zip(P0, n))), None)], [],
                  ["Trazo la recta por P perpendicular al plano (director = normal) y la corto con el plano.", f"t = {N(t)}: proyección {pt(*M)}."], "La recta que proyecta debe ser perpendicular al plano.")
    return mk(f"Halla el simétrico del punto P{pt(*P0)} respecto del plano {Pl}", pt(*S), "t5_proyeccion",
              [(pt(*M), "simetrico_proyeccion"), (pt(*(p - 2 * t * x for p, x in zip(P0, n))), None), (pt(*(p + 3 * t * x for p, x in zip(P0, n))), None)], [],
              [f"Proyección M{pt(*M)} (corte de la perpendicular por P con el plano).", f"Simétrico P′ = 2M − P = {pt(*S)}."], "El simétrico no es la proyección: M es el punto medio de P y P′.")


# ================================================================ GEO.TRIG

@generador("t5_razones_agudo")
def gen_razones_agudo(rng, d):
    if d == 3 and rng.random() < 0.5:
        ang = rng.randint(10, 80)
        fn = rng.choice(["sen", "cos", "tg"])
        f = {"sen": math.sin, "cos": math.cos, "tg": math.tan}[fn]
        v = f(math.radians(ang))
        vr = f(ang)
        return mk(f"Con la calculadora (en grados), calcula {fn} {ang}° (redondea a 4 decimales)", D(v, 4), "t5_razones",
                  [(D(vr, 4), "radianes"), (D({"sen": math.cos, "cos": math.sin, "tg": lambda x: 1 / math.tan(x)}[fn](math.radians(ang)), 4), "opuesto_contiguo"), (D(v * 2, 4) if abs(v * 2) < 100 else D(v + 0.1, 4), None)], [],
                  ["La calculadora tiene que estar en modo grados (DEG).", f"{fn} {ang}° ≈ {D(v, 4)}."], "Si la calculadora está en radianes, sen 30 da −0,988: hay que usar el modo DEG.")
    h, a, b = rng.choice(PIT)
    k = rng.choice([1, 1, 2]) if d > 1 else 1
    fn = rng.choice(["sen", "cos", "tg"])
    val = {"sen": F(a, h), "cos": F(b, h), "tg": F(a, b)}[fn]
    mal1 = {"sen": F(b, h), "cos": F(a, h), "tg": F(b, a)}[fn]
    mal2 = {"sen": F(a, b), "cos": F(b, a), "tg": F(a, h)}[fn]
    return mk(f"En un triángulo rectángulo los catetos miden {a * k} y {b * k} y la hipotenusa {h * k}. Si α es el ángulo opuesto al cateto de {a * k}, calcula {fn} α.", f"{fn} α = {N(val)}", "t5_razones",
              [(f"{fn} α = {N(mal1)}", "opuesto_contiguo"), (f"{fn} α = {N(mal2)}", "tangente_hipotenusa" if fn == "tg" else None), (f"{fn} α = {N(1 / val)}", None)], [],
              ["sen α = opuesto/hipotenusa; cos α = contiguo/hipotenusa; tg α = opuesto/contiguo.", f"{fn} α = {N(val)}."], "Identificar bien el cateto opuesto (enfrente del ángulo) y el contiguo.")


@generador("t5_razones_notables")
def gen_razones_notables(rng, d):
    fns = ["sen", "cos", "tg"]
    angs = [30, 45, 60]
    def val(fn, a):
        return trig(fn, a)
    swap = {30: 60, 60: 30, 45: 45}
    if d == 1:
        fn, a = rng.choice(fns), rng.choice(angs)
        k = rng.choice([1, 1, 2, 3, 4])
        v = val(fn, a) * k
        enun = f"Calcula el valor exacto de {'' if k == 1 else str(k) + '·'}{fn} {a}°"
        m1 = val(fn, swap[a]) * k
        dist = [(m1.txt() if m1 != v else None, "sen30_sen60" if fn in ("sen", "cos") else "tg30_tg60"), (val({"sen": "cos", "cos": "sen", "tg": "sen"}[fn], a) * k if True else None, None),
                ((val(fn, a) * (k + 1)), None)]
        dist = [(x.txt() if isinstance(x, Q) else x, kk) for x, kk in dist]
        pasos = [f"{fn} {a}° = {val(fn, a).txt()} (triángulo equilátero o cuadrado).", f"Resultado: {v.txt()}."]
    else:
        (f1, a1), (f2, a2) = [(rng.choice(fns), rng.choice(angs)) for _ in range(2)]
        op = rng.choice(["+", "−", "·"]) if d == 2 else rng.choice(["·", "+", "²"])
        if op == "+":
            v = val(f1, a1) + val(f2, a2)
            enun = f"Calcula el valor exacto de {f1} {a1}° + {f2} {a2}°"
            m = val(f1, swap[a1]) + val(f2, swap[a2])
        elif op == "−":
            v = val(f1, a1) - val(f2, a2)
            enun = f"Calcula el valor exacto de {f1} {a1}° − {f2} {a2}°"
            m = val(f1, swap[a1]) - val(f2, swap[a2])
        elif op == "·":
            v = val(f1, a1) * val(f2, a2)
            enun = f"Calcula el valor exacto de {f1} {a1}° · {f2} {a2}°"
            m = val(f1, swap[a1]) * val(f2, swap[a2])
        else:
            v = val(f1, a1) * val(f1, a1) + val(f2, a2) * val(f2, a2)
            enun = f"Calcula el valor exacto de {f1}² {a1}° + {f2}² {a2}°"
            m = val(f1, a1) * 2 + val(f2, a2) * 2
        clave = "sen30_sen60" if "tg" not in (f1 + f2) else "tg30_tg60"
        dist = [(m.txt() if m != v else None, clave), ((v + Q(1)).txt(), None), ((v * 2).txt() if not v.es_cero() else "1", None), ((-v).txt() if not v.es_cero() else "2", None)]
        pasos = [f"{f1} {a1}° = {val(f1, a1).txt()} y {f2} {a2}° = {val(f2, a2).txt()}.", f"Opero con los valores exactos: {v.txt()}."]
    return mk(enun, v.txt(), "t5_notables", dist, [], pasos,
              "sen 30° = cos 60° = 1/2; sen 60° = cos 30° = √3/2; sen 45° = cos 45° = √2/2; tg 30° = √3/3, tg 45° = 1, tg 60° = √3.")


@generador("t5_relaciones_fundamentales")
def gen_relaciones_fundamentales(rng, d):
    if d < 3:
        h, a, b = rng.choice(PIT)
        dato = rng.choice(["sen", "cos"])
        cuad = rng.choice([1, 2, 3, 4]) if d == 2 else rng.choice([1, 2])
        ss = {1: (1, 1), 2: (1, -1), 3: (-1, -1), 4: (-1, 1)}[cuad]
        sv, cv = F(a, h) * ss[0], F(b, h) * ss[1]
        if dato == "sen":
            enun = f"Si sen α = {N(sv)} y α está en el {cuad}.º cuadrante, calcula cos α."
            resp, mal1, mal2 = f"cos α = {N(cv)}", f"cos α = {N(1 - sv)}", f"cos α = {N(-cv)}"
        else:
            enun = f"Si cos α = {N(cv)} y α está en el {cuad}.º cuadrante, calcula sen α."
            resp, mal1, mal2 = f"sen α = {N(sv)}", f"sen α = {N(1 - cv)}", f"sen α = {N(-sv)}"
        return mk(enun, resp, "t5_rel_fund", [(mal1, "uno_menos"), (mal2, "signo_cuadrante"), (resp.replace(N(cv if dato == 'sen' else sv), N(F(1, 1) / (cv if dato == 'sen' else sv))), None)], [],
                  ["sen²α + cos²α = 1 → la otra razón vale ±√(1 − dato²).", f"El signo lo da el cuadrante ({cuad}.º). {resp}."],
                  "sen α no es 1 − cos α: la relación es entre los CUADRADOS. El cuadrante decide el signo.")
    num, den = rng.choice([(1, 3), (2, 3), (1, 4), (3, 4), (1, 5), (2, 5), (3, 7), (1, 2)])
    cuad = rng.choice([1, 2])
    sv = F(num, den)
    m = den * den - num * num
    cv_txt = rad(m, 1 if cuad == 1 else -1, den)
    tg_txt = rad(m, num * (1 if cuad == 1 else -1), m)
    return mk(f"Si sen α = {N(sv)} y α está en el {cuad}.º cuadrante, calcula tg α.", f"tg α = {tg_txt}", "t5_rel_fund",
              [(f"tg α = {rad(m, num * (-1 if cuad == 1 else 1), m)}", "signo_cuadrante"), (f"tg α = {N(F(num, den - num))}", "uno_menos"), (f"tg α = {rad(m, 1 if cuad == 1 else -1, num)}", None)], [],
              [f"cos α = ±√(1 − sen²α) = {cv_txt} (signo del {cuad}.º cuadrante).", f"tg α = sen α/cos α = {tg_txt} (racionalizando)."],
              "tg α = sen α/cos α; se racionaliza para dar el resultado sin raíces en el denominador.")


@generador("t5_triangulo_rectangulo")
def gen_triangulo_rectangulo(rng, d):
    ang = rng.randint(15, 75)
    h = rng.randint(5, 30)
    if d == 1:
        que = rng.choice(["opuesto", "contiguo"])
        v = h * (math.sin if que == "opuesto" else math.cos)(math.radians(ang))
        m1 = h * (math.cos if que == "opuesto" else math.sin)(math.radians(ang))
        m2 = (math.sin if que == "opuesto" else math.cos)(math.radians(ang)) / h
        return mk(f"En un triángulo rectángulo la hipotenusa mide {h} cm y un ángulo agudo {ang}°. Calcula el cateto {que} a ese ángulo (redondea a centésimas).", f"{D(v)} cm", "t5_tri_rect",
                  [(f"{D(m1)} cm", "razon_mal"), (f"{D(m2, 4)} cm", "despeje_invertido"), (f"{D(h * math.tan(math.radians(ang)))} cm", None)], [],
                  [f"{'sen' if que == 'opuesto' else 'cos'} {ang}° = cateto {que}/hipotenusa.", f"Cateto = {h}·{'sen' if que == 'opuesto' else 'cos'} {ang}° ≈ {D(v)} cm."],
                  "Se elige la razón que relaciona el dato y la incógnita, y se despeja multiplicando.")
    if d == 2:
        c1 = rng.randint(3, 20)
        v = c1 * math.tan(math.radians(ang))
        return mk(f"Desde un punto a {c1} m del pie de un árbol se ve su copa con un ángulo de elevación de {ang}°. ¿Cuánto mide el árbol? (redondea a centésimas)", f"{D(v)} m", "t5_tri_rect",
                  [(f"{D(c1 * math.sin(math.radians(ang)))} m", "razon_mal"), (f"{D(c1 / math.tan(math.radians(ang)))} m", "despeje_invertido"), (f"{D(c1 * math.cos(math.radians(ang)))} m", None)], [],
                  [f"tg {ang}° = altura/{c1}.", f"altura = {c1}·tg {ang}° ≈ {D(v)} m."], "Altura y distancia horizontal son los dos catetos: tangente.")
    a, b = rng.randint(3, 15), rng.randint(3, 15)
    ang = math.degrees(math.atan(a / b))
    return mk(f"Los catetos de un triángulo rectángulo miden {a} cm y {b} cm. ¿Cuánto mide el ángulo opuesto al cateto de {a} cm? (redondea a décimas)", grad(ang), "t5_tri_rect",
              [(grad(90 - ang), "razon_mal"), (grad(math.degrees(math.atan(b / a)) if False else math.degrees(math.asin(min(1, a / (a + b))))), None), (grad(ang / 2), None)], [],
              [f"tg α = {a}/{b}.", f"α = arctg({a}/{b}) ≈ {grad(ang)}."], "Con los dos catetos se usa la tangente.")


@generador("t5_reduccion_cuadrante")
def gen_reduccion_cuadrante(rng, d):
    for _ in range(100):
        base = rng.choice([30, 45, 60])
        cuad = rng.choice([2, 3, 4])
        ang = {2: 180 - base, 3: 180 + base, 4: 360 - base}[cuad]
        if d == 3:
            ang = ang + 360 * rng.choice([1, 2]) if rng.random() < 0.5 else -(360 - ang)
        fn = rng.choice(["sen", "cos", "tg"])
        v = trig(fn, ang)
        if v is not None:
            break
    ref_val = trig(fn, base)
    otro = {30: 60, 60: 30, 45: 45}[base]
    m2 = trig(fn, otro) * (1 if (v.fl() > 0) else -1)
    return mk(f"Calcula el valor exacto de {fn} {ang}°", v.txt(), "t5_reduccion",
              [((-v).txt(), "signo_cuadrante"), (m2.txt() if m2 != v else (v * 2).txt(), "angulo_equivocado"), (ref_val.txt() if ref_val != v and ref_val != -v else (v + Q(1)).txt(), None)], [],
              [f"{ang}° corresponde a un ángulo del {cuad}.º cuadrante con ángulo de referencia {base}°" + (" (quitando vueltas completas)." if d == 3 else "."),
               f"{fn} {base}° = {ref_val.txt()}; el signo en ese cuadrante es {'positivo' if v.fl() > 0 else 'negativo'}: {v.txt()}."],
              "Suplementarios (180° − α) conservan el seno; los que difieren en 180° conservan la tangente; los opuestos conservan el coseno.")


@generador("t5_radianes")
def gen_radianes(rng, d):
    ang = rng.choice([30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360, 15, 75, 105, 20, 40, 72, 36, 18])
    if d == 3:
        ang = rng.choice([390, 405, 420, 450, 480, 540, 600, 720, 18, 36, 54, 108, 144, 162, 12, 24])
    r = F(ang, 180)
    if d == 1 or (d == 3 and rng.random() < 0.5):
        return mk(f"Expresa {ang}° en radianes", f"{pif(r)} rad", "t5_radianes",
                  [(f"{N(ang * 180)}/π rad", "factor_invertido"), (f"{pif(r * 2)} rad", None), (f"{pif(1 / r)} rad" if r != 1 else "2π rad", None)], [],
                  ["180° = π rad: multiplico por π/180.", f"{ang}·π/180 = {pif(r)} rad."], "Para pasar de grados a radianes se multiplica por π/180.")
    return mk(f"Expresa {pif(r)} rad en grados", f"{ang}°", "t5_radianes",
              [(f"{D(float(r) * 3.14, 2)}°", "pi_grados"), (f"{N(ang * 2)}°", None), (f"{D(float(r) * 180 / 3.14159, 1)}°" if False else f"{N(F(180, ang) if ang else 1)}°", None)], [],
              ["π rad = 180°: sustituyo π por 180°.", f"{pif(r)} = {ang}°."], "π rad son 180°, no 3,14°.")


@generador("t5_seno_coseno")
def gen_seno_coseno(rng, d):
    if d == 1:
        a, b = rng.randint(2, 12), rng.randint(2, 12)
        C = rng.choice([60, 120, 90]) if rng.random() < 0.7 else 60
        c2 = a * a + b * b - (a * b if C == 60 else -a * b if C == 120 else 0)
        return mk(f"En un triángulo, a = {a}, b = {b} y el ángulo C = {C}°. Calcula el lado c.", f"c = {rad(c2)}", "t5_seno_coseno",
                  [(f"c = {rad(a * a + b * b)}" if C != 90 else f"c = {rad(a * a + b * b - a * b)}", "sin_coseno" if C != 90 else None), (f"c = {rad(a * a + b * b + (a * b if C == 60 else -a * b))}" if C != 90 else f"c = {N(a + b)}", None), (f"c = {N(c2)}", None)], [],
                  [f"Teorema del coseno: c² = a² + b² − 2ab·cos C = {a * a} + {b * b} − 2·{a}·{b}·cos {C}° = {c2}.", f"c = {rad(c2)}."], "El teorema del coseno generaliza Pitágoras con el término −2ab·cos C.")
    if d == 2:
        A_, B_ = rng.sample([30, 45, 60, 120, 135], 2)
        if A_ + B_ >= 180:
            B_ = 30 if A_ != 30 else 45
        a = rng.randint(2, 12)
        b = (Q(a) * trig("sen", B_)).conj_div(trig("sen", A_))
        return mk(f"En un triángulo, a = {a}, A = {A_}° y B = {B_}°. Calcula el lado b.", f"b = {b.txt()}", "t5_seno_coseno",
                  [(f"b = {(Q(a) * trig('sen', A_)).conj_div(trig('sen', B_)).txt()}", None), (f"b = {(Q(a) * trig('cos', B_)).conj_div(trig('cos', A_)).txt() if trig('cos', A_).fl() else a}", None), (f"b = {(b * 2).txt()}", None)], [],
                  ["Teorema del seno: a/sen A = b/sen B.", f"b = a·sen B/sen A = {a}·{trig('sen', B_).txt()}/({trig('sen', A_).txt()}) = {b.txt()}."], "Cada lado va con el seno del ángulo OPUESTO.")
    # caso ambiguo: A = 30°, sen B = b·sen A/a con valor notable
    sB, (B1, B2) = rng.choice([(Q({3: F(1, 2)}), (60, 120)), (Q({2: F(1, 2)}), (45, 135))])
    a = rng.randint(2, 8)
    # b = a·sen B/sen 30 = 2a·sen B
    b = Q(2 * a) * sB
    return mk(f"En un triángulo, a = {a}, b = {b.txt()} y A = 30°. Halla el ángulo B.", f"B = {B1}° o B = {B2}°", "t5_seno_coseno",
              [(f"B = {B1}°", "caso_ambiguo"), (f"B = {B2}°", "caso_ambiguo"), (f"B = {90 - B1}° o B = {90 + B1}°", None)], [],
              [f"sen B = b·sen A/a = {sB.txt()}.", f"Hay dos ángulos con ese seno: {B1}° y {B2}°; los dos son válidos porque A + B < 180°."],
              "Con el teorema del seno puede haber dos soluciones (B y 180° − B): caso ambiguo.")


@generador("t5_formulas_trig")
def gen_formulas_trig(rng, d):
    if d < 3:
        combos = [(45, 30, "+"), (60, 45, "+"), (45, 30, "−"), (60, 45, "−"), (90, 15, "+") if False else (30, 45, "+"), (120, 45, "−"), (135, 30, "−"), (45, 60, "+")]
        a, b, op = rng.choice(combos)
        fn = rng.choice(["sen", "cos"]) if d == 1 else rng.choice(["sen", "cos", "tg"])
        ang = a + b if op == "+" else a - b
        if fn == "sen":
            v = trig("sen", a) * trig("cos", b) + (trig("cos", a) * trig("sen", b) if op == "+" else -(trig("cos", a) * trig("sen", b)))
            lin_ = trig("sen", a) + trig("sen", b) if op == "+" else trig("sen", a) - trig("sen", b)
        elif fn == "cos":
            v = trig("cos", a) * trig("cos", b) - (trig("sen", a) * trig("sen", b) if op == "+" else -(trig("sen", a) * trig("sen", b)))
            lin_ = trig("cos", a) + trig("cos", b) if op == "+" else trig("cos", a) - trig("cos", b)
        else:
            ta, tb = trig("tg", a), trig("tg", b)
            v = (ta + tb).conj_div(Q(1) - ta * tb) if op == "+" else (ta - tb).conj_div(Q(1) + ta * tb)
            lin_ = ta + tb if op == "+" else ta - tb
        return mk(f"Calcula el valor exacto de {fn} {ang}° usando {fn} ({a}° {op} {b}°)", v.txt(), "t5_formulas_trig",
                  [(lin_.txt(), "linealidad"), ((-v).txt(), None), ((v * 2).txt(), None)], [],
                  [{"sen": "sen(a ± b) = sen a·cos b ± cos a·sen b.", "cos": "cos(a ± b) = cos a·cos b ∓ sen a·sen b.", "tg": "tg(a ± b) = (tg a ± tg b)/(1 ∓ tg a·tg b)."}[fn],
                   f"Sustituyo los valores de {a}° y {b}°: {v.txt()}."], "sen(a + b) ≠ sen a + sen b.")
    h, p, q = rng.choice(PIT)
    sa, ca = F(p, h), F(q, h)
    tipo = rng.choice(["sen2", "cos2", "tg2"])
    if tipo == "sen2":
        v, mal = 2 * sa * ca, 2 * sa
        nom = "sen 2α"
    elif tipo == "cos2":
        v, mal = ca * ca - sa * sa, 2 * ca
        nom = "cos 2α"
    else:
        t = sa / ca
        v, mal = 2 * t / (1 - t * t) if t * t != 1 else None, 2 * t
        nom = "tg 2α"
        if v is None:
            return None
    return mk(f"Si sen α = {N(sa)} y α es agudo, calcula {nom}.", f"{nom} = {N(v)}", "t5_formulas_trig",
              [(f"{nom} = {N(mal)}", "doble_por_dos"), (f"{nom} = {N(-v)}", None), (f"{nom} = {N(v / 2)}", None)], [],
              [f"cos α = √(1 − sen²α) = {N(ca)}.", {"sen2": "sen 2α = 2 sen α cos α", "cos2": "cos 2α = cos²α − sen²α", "tg2": "tg 2α = 2 tg α/(1 − tg²α)"}[tipo] + f" = {N(v)}."],
              "sen 2α = 2 sen α cos α, no 2 sen α.")


def _angs(xs):
    return ", ".join(f"x = {x}°" for x in sorted(set(x % 360 for x in xs)))


def _sols_trig(fn, v):
    """Soluciones en [0, 360) de fn x = v (v valor notable como Q)."""
    return [a for a in range(0, 360, 15) if trig(fn, a) is not None and trig(fn, a) == v]


@generador("t5_ecuacion_trig")
def gen_ecuacion_trig(rng, d):
    vals = {"sen": [Q(F(1, 2)), Q(F(-1, 2)), Q({2: F(1, 2)}), Q({2: F(-1, 2)}), Q({3: F(1, 2)}), Q({3: F(-1, 2)}), Q(1), Q(-1), Q(0)],
            "cos": [Q(F(1, 2)), Q(F(-1, 2)), Q({2: F(1, 2)}), Q({2: F(-1, 2)}), Q({3: F(1, 2)}), Q({3: F(-1, 2)}), Q(1), Q(-1), Q(0)],
            "tg": [Q(1), Q(-1), Q({3: 1}), Q({3: -1}), Q({3: F(1, 3)}), Q({3: F(-1, 3)}), Q(0)]}
    if d == 1:
        fn = rng.choice(["sen", "cos", "tg"])
        v = rng.choice(vals[fn])
        xs = _sols_trig(fn, v)
        return mk(f"Resuelve en [0°, 360°): {fn} x = {v.txt()}", _angs(xs), "t5_ecuacion_trig",
                  [(_angs(xs[:1]) if len(xs) > 1 else _angs([xs[0] + 180]), "una_solucion"), (_angs([(x + 90) for x in xs]), None), (_angs([(360 - x) for x in xs]) if _angs([(360 - x) for x in xs]) != _angs(xs) else _angs([x + 45 for x in xs]), None)], [],
                  [f"El ángulo de referencia con {fn} = {v.txt() if not v.txt().startswith('−') else v.txt()[1:]} es conocido; busco los cuadrantes con el signo adecuado.", f"Soluciones en [0°, 360°): {_angs(xs)}."],
                  "Una ecuación trigonométrica suele tener dos soluciones por vuelta.")
    if d == 2 or rng.random() < 0.5:
        fn = rng.choice(["sen", "cos"])
        r1, r2 = rng.sample([F(1), F(-1), F(1, 2), F(-1, 2), F(0)], 2)
        # a t² + b t + c con raíces r1, r2 (coeficientes enteros)
        q = math.lcm(r1.denominator, r2.denominator)
        A, B, C = q * q, -q * q * (r1 + r2), q * q * r1 * r2
        g = math.gcd(math.gcd(int(A), int(B)), int(C))
        A, B, C = int(A) // g, int(B) // g, int(C) // g
        xs = _sols_trig(fn, Q(r1)) + _sols_trig(fn, Q(r2))
        enun = f"Resuelve en [0°, 360°): {terms([(A, fn + '²x'), (B, fn + ' x'), (C, '')])} = 0"
        return mk(enun, _angs(xs), "t5_ecuacion_trig", [(_angs(_sols_trig(fn, Q(r1))), "una_solucion"), (_angs(_sols_trig(fn, Q(r2))), "una_solucion"), (_angs(xs[:1] + _sols_trig(fn, Q(r2))[:1]), None)], [],
                  [f"Cambio t = {fn} x: {terms([(A, 't²'), (B, 't'), (C, '')])} = 0 → t = {N(r1)} o t = {N(r2)}.", f"Resuelvo {fn} x = {N(r1)} y {fn} x = {N(r2)}: {_angs(xs)}."],
                  "Tras el cambio de variable hay que resolver cada ecuación elemental y juntar todas las soluciones.")
    v = rng.choice([F(1, 2), F(-1, 2)])
    k = int(1 / v)
    xs = [0, 180] + _sols_trig("cos", Q(v))
    enun = f"Resuelve en [0°, 360°): sen 2x = {'' if k == 2 else '−'}sen x"
    return mk(enun, _angs(xs), "t5_ecuacion_trig", [(_angs(_sols_trig("cos", Q(v))), "divide_sen"), (_angs([0, 180]), "una_solucion"), (_angs([0] + _sols_trig("cos", Q(v))), None)], [],
              [f"2 sen x cos x {'−' if k == 2 else '+'} sen x = 0 → sen x (2cos x {'−' if k == 2 else '+'} 1) = 0.", f"sen x = 0 → x = 0°, 180°; cos x = {N(v)} → {_angs(_sols_trig('cos', Q(v)))}."],
              "No se divide entre sen x (se perderían las soluciones sen x = 0): se saca factor común.")
