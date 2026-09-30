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
        enun = f"Resuelve por {metodo}: {{{_eq2(a, b, c)}; {_eq2(d_, e, f)}}}"
    resp = _sxy(x, y)
    dist = []
    if metodo == "sustitucion":
        # E02: paréntesis al sustituir: de la 2.ª x = f − e y; en la 1.ª: a(f − e y) → a f − e y
        den = b - e
        if den:
            y2 = F(c - a * f, den)
            x2 = f - e * y2
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
    dist = [(TXT["SI"], "cero_cero_incompatible") if caso == "SCI" else (TXT["SCI"], None) if caso == "SI" else (TXT["SCI"], None)]
    dist.append(("Compatible determinado con z = 0" if caso == "SI" else TXT["SI"] if caso == "SCD" else TXT["SCD"], "cero_k_solucion" if caso == "SI" else None))
    dist.append((TXT["SCD"] if caso != "SCD" else "Compatible determinado con z = 0", None))
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
        enun, r, mal = f"|{k}A|", F(k) ** n * D0, F(k) * D0
    elif op == "inv":
        enun, r, mal = "|A⁻¹|", F(1, D0), F(-D0)
    elif op == "tras":
        enun, r, mal = "|Aᵗ|", F(D0), F(-D0)
    elif op == "kinv":
        enun, r, mal = f"|{k}A⁻¹|", F(k) ** n / D0, F(k) / D0
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
        n = rng.choice([2, 3, 4])
        rA = rng.randint(1, min(3, n))
        rAs = rA + (1 if rng.random() < 0.35 and rA < 3 else 0)
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
        enun = f"Un sistema de 3 ecuaciones con {n} incógnitas tiene rg(A) = {rA} y rg(A*) = {rAs}. ¿Qué tipo de sistema es?"
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
