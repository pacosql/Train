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
    nfac = sum(cd.values()) + (1 if kd != 1 else 0)
    if nfac > 1 or (kd != 1 and cd):
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
