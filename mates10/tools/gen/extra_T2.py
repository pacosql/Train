"""Generadores del grupo T2 (multiplicación, división, divisibilidad, enteros, jerarquía, potencias y raíces).

Todos se registran como "t2_<nombre>". Cada uno devuelve un Ejercicio con parametros["op"] (el estándar del validador
—mult, div, pot, raiz, jerarquia— cuando el recálculo independiente es posible; si no, uno propio t2_…), distractores
ligados a claves de error descriptivas (se enlazan con E01… en specs/T2.json) y explicación por pasos.

Claves de error por generador: ver el docstring de cada uno.
"""
import math
from collections import Counter
from fractions import Fraction

from .nucleo import Ejercicio, generador, fmt, NOMBRES, OBJETOS

MUL, DIV, SUM, RES = "×", ":", "+", "−"
SUPS = str.maketrans("0123456789-", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻")


def sup(n):
    return str(n).translate(SUPS)


def P(textos):
    return [{"paso": i + 1, "operacion": op, "resultado": res, "texto": t} for i, (op, res, t) in enumerate(textos)]


def mk(enunciado, respuesta, op, par, dist, pasos, adulto, genericos=None, nino=None, datos=None):
    par = dict(par)
    par["op"] = op
    ej = Ejercicio(enunciado=enunciado, respuesta=respuesta, parametros=par, datos=datos)
    ej.distractores = [(v if isinstance(v, str) else fmt(v), k) for v, k in dist if v is not None]
    ej.pasos = P(pasos)
    ej.explicacion_nino = nino or " ".join(p["texto"] for p in ej.pasos)
    ej.explicacion_adulto = adulto
    ej.genericos = [g if isinstance(g, str) else fmt(g) for g in (genericos or []) if g is not None]
    return ej


def z(n):
    """Entero con signo explícito entre paréntesis: (−4), (+9)."""
    return f"({'−' if n < 0 else '+'}{fmt(abs(n))})"


def zn(n):
    """Entero entre paréntesis solo si es negativo."""
    return f"({fmt(n)})" if n < 0 else fmt(n)


def fr(x):
    """Fraction → texto: 7/8, −3/4, 2."""
    x = Fraction(x)
    if x.denominator == 1:
        return fmt(x.numerator)
    return ("−" if x < 0 else "") + f"{abs(x.numerator)}/{x.denominator}"


def es_primo(n):
    return n > 1 and all(n % i for i in range(2, int(n ** 0.5) + 1))


def divisores(n):
    return [i for i in range(1, n + 1) if n % i == 0]


def factoriza(n):
    out, p = [], 2
    while n > 1:
        while n % p == 0:
            out.append(p)
            n //= p
        p += 1
    return out


def ftxt_c(c):
    """Counter {primo: exponente} → '2³ · 3² · 5'."""
    return " · ".join(f"{p}{sup(e) if e > 1 else ''}" for p, e in sorted(c.items()) if e > 0)


def lista(xs, y=False):
    xs = [fmt(x) if not isinstance(x, str) else x for x in xs]
    if y and len(xs) > 1:
        return ", ".join(xs[:-1]) + " y " + xs[-1]
    return ", ".join(xs)


# ================================================================ TABLAS Y SENTIDO DE LA MULTIPLICACIÓN

ESTRATEGIA_TABLA = {
    0: lambda o: f"Cualquier número por 0 da 0.",
    1: lambda o: f"Multiplicar por 1 deja el número igual: {o} × 1 = {o}.",
    2: lambda o: f"La tabla del 2 son los dobles: {o} + {o} = {2 * o}.",
    3: lambda o: f"Es el triple: el doble de {o} ({2 * o}) más otra vez {o}: {2 * o} + {o} = {3 * o}.",
    4: lambda o: f"Es el doble del doble: el doble de {o} es {2 * o} y el doble de {2 * o} es {4 * o}.",
    5: lambda o: f"La tabla del 5 es la mitad de la del 10: {o} × 10 = {10 * o} y la mitad es {5 * o}.",
    6: lambda o: f"Es la del 5 más una vez: {o} × 5 = {5 * o} y {5 * o} + {o} = {6 * o}.",
    7: lambda o: f"Es la del 5 más la del 2: {o} × 5 = {5 * o} y {o} × 2 = {2 * o}; {5 * o} + {2 * o} = {7 * o}.",
    8: lambda o: f"Es el doble de la del 4: {o} × 4 = {4 * o} y el doble es {8 * o}.",
    9: lambda o: f"Es la del 10 menos una vez: {o} × 10 = {10 * o} y {10 * o} − {o} = {9 * o}.",
    10: lambda o: f"Por 10 se añade un cero: {10 * o}.",
}
ZONA_DIFICIL = [36, 42, 48, 49, 54, 56, 63, 64, 72]
FRASES_TABLA = ["Calcula: {a} × {b}", "¿Cuánto es {a} × {b}?", "Completa: {a} × {b} = ?"]


@generador("t2_tabla")
def gen_tabla(rng, d, tabla=None, frases=3):
    """Hechos de la tabla (tabla=k) o tablas mezcladas (tabla=None).
    Claves: vecino (k × (j±1)), suma (a + b), por0 (a × 0 = a), por1 (a × 1 = 1), otra_tabla (la del 2 o del 4 en vez de la del 3),
    dobla_una_vez (tabla del 4 → doble), cruza (otro hecho de la zona difícil 6-7-8-9), truco9 (9 × 7 = 73), ceros (cero de más o de menos)."""
    if tabla is not None:
        k = tabla
        pool = {1: [0, 1, 2, 3, 4], 2: [5, 6, 7], 3: [8, 9, 10]}[d]
        j = rng.choice(pool)
        a, b = (k, j) if rng.random() < 0.5 else (j, k)
    else:
        if d == 1:
            a, b = rng.randint(0, 5), rng.randint(0, 5)
        elif d == 2:
            a, b = rng.randint(2, 5), rng.randint(6, 10)
            if rng.random() < 0.5:
                a, b = b, a
        else:
            a, b = rng.randint(6, 9), rng.randint(6, 9)
        k, j = (a, b) if rng.random() < 0.5 else (b, a)
    p = a * b
    frase = FRASES_TABLA[rng.randrange(frases)]
    dist = []
    if 0 in (a, b) and max(a, b) > 0:
        dist.append((max(a, b), "por0"))
    if 1 in (a, b) and max(a, b) > 1:
        dist.append((1, "por1"))
    if tabla == 3 and j > 0:
        dist += [(2 * j, "otra_tabla"), (4 * j, "otra_tabla")]
    if tabla == 4 and j > 1:
        dist.append((2 * j, "dobla_una_vez"))
    if tabla == 9 and 2 <= j <= 9:
        dist.append((10 * j + (10 - j), "truco9"))
    if tabla == 10 and j > 0:
        dist += [(100 * j, "ceros"), (j, "ceros")]
    if tabla in (2,) or tabla is None:
        if a + b != p:
            dist.append((a + b, "suma"))
    if min(a, b) >= 6 and p in ZONA_DIFICIL:
        vec = {k * (j + 1), k * (j - 1), (k + 1) * j, (k - 1) * j}
        cand = [x for x in ZONA_DIFICIL if x != p and abs(x - p) <= 9 and x not in vec]
        if cand:
            dist.insert(0, (rng.choice(cand), "cruza"))
    if j > 0:
        dist.append((k * (j - 1), "vecino"))
    dist.append((k * (j + 1), "vecino"))
    if tabla is None and a + b != p:
        pass
    base, otro = (a, b) if tabla is None or a == tabla else (b, a)
    txt = ESTRATEGIA_TABLA[0](0) if p == 0 else ESTRATEGIA_TABLA[base](otro) if base in ESTRATEGIA_TABLA else f"{a} × {b} = {p}."
    ej = mk(frase.format(a=a, b=b), fmt(p), "mult", {"a": a, "b": b}, dist,
            [(f"{a} × {b}", str(p), f"{txt} Así que {a} × {b} = {p}.")],
            "Las tablas tienen que salir sin pensar. Practicadlas salteadas y al revés (7 × 3 y 3 × 7), no recitadas en orden: "
            "recitar la tabla desde el principio para llegar al hecho es señal de que aún no está memorizado.",
            genericos=[p + 1, p - 1, p + 2, p + 10, p - 2])
    ej.explicacion_nino = f"{a} × {b} = {p}. " + (txt if p else "Por 0 siempre da 0.") + " Recuerda: el orden no cambia el resultado."
    return ej


@generador("t2_mult_sentido")
def gen_mult_sentido(rng, d):
    """Sentido de la multiplicación (factores de una cifra).
    Claves: suma (suma los factores), cuenta_mal (un sumando/grupo de más o de menos), grupos_cambiados (confunde nº de grupos
    con el tamaño), uno_mas (a × b + b)."""
    hi = 5 if d == 1 else 7 if d == 2 else 9
    tipo = rng.choice({1: ["suma_a_mult", "veces"], 2: ["suma_a_mult", "cuadricula", "grupos_suma"], 3: ["cuadricula", "grupos_suma", "suma_a_mult", "veces"]}[d])
    n, a = rng.randint(2, hi), rng.randint(2, hi)
    if tipo == "suma_a_mult":
        suma = " + ".join([str(a)] * n)
        return mk(f"¿Qué multiplicación es {suma}?", f"{n} × {a}", "t2_sentido", {"a": n, "b": a, "tipo": tipo},
                  [(f"{n - 1} × {a}", "cuenta_mal"), (f"{n} + {a}", "suma"), (f"{n + 1} × {a}", "cuenta_mal")],
                  [("contar sumandos", str(n), f"Cuento cuántas veces se repite el {a}: {n} veces."),
                   (f"{n} × {a}", str(n * a), f"{n} veces {a} se escribe {n} × {a} (y da {n * a}).")],
                  "Multiplicar es sumar el mismo número varias veces. Que cuente los sumandos tocándolos uno a uno: el fallo típico es dejarse uno.",
                  genericos=[f"{a} × {a}", f"{n} × {a + 1}"])
    if tipo == "veces":
        return mk(f"¿Cuánto es {n} veces {a}?", fmt(n * a), "mult", {"a": n, "b": a, "tipo": tipo},
                  [(n + a, "suma"), (n * a + a, "uno_mas"), ((n - 1) * a, "cuenta_mal")],
                  [(" + ".join([str(a)] * n), str(n * a), f"{n} veces {a} es {' + '.join([str(a)] * n)} = {n * a}, es decir, {n} × {a} = {n * a}.")],
                  "'Veces' significa multiplicar: 3 veces 4 son tres grupos de 4. El error típico es sumar 3 + 4.",
                  genericos=[n * a + 1, n * a - 1, n * a + 2])
    if tipo == "cuadricula":
        cosa = rng.choice([("una caja de bombones", "bombones"), ("un huerto", "lechugas"), ("una tableta de chocolate", "onzas"),
                           ("un aparcamiento", "coches"), ("una bandeja de huevos", "huevos"), ("un mural", "fotos")])
        return mk(f"En {cosa[0]} hay {n} filas y en cada fila {a} {cosa[1]}. ¿Cuántos {cosa[1]} hay en total?", fmt(n * a), "mult",
                  {"a": n, "b": a, "tipo": tipo},
                  [(n + a, "suma"), (n * a + a, "uno_mas"), ((n - 1) * a, "cuenta_mal")],
                  [(f"{n} × {a}", str(n * a), f"Son {n} filas iguales de {a}: {n} × {a} = {n * a} {cosa[1]}.")],
                  "Filas y columnas son grupos iguales: filas × lo que hay en cada fila. Si suma filas y columnas, que las cuente de una en una.",
                  genericos=[n * a + 1, n * a - 1, n * a + 2])
    if a == n:
        a = n + 1 if n < hi else n - 1
    cosa = rng.choice(OBJETOS)
    caja = rng.choice(["bolsas", "cajas", "platos", "cestas"])
    return mk(f"Hay {n} {caja} con {a} {cosa[1]} en cada una. ¿Qué suma representa todos los {cosa[1]}?", " + ".join([str(a)] * n),
              "t2_sentido", {"a": n, "b": a, "tipo": tipo},
              [(" + ".join([str(n)] * a), "grupos_cambiados"), (f"{n} + {a}", "suma"), (" + ".join([str(a)] * (n + 1)), "cuenta_mal")],
              [("grupos", f"{n} grupos de {a}", f"Hay {n} {caja} y en cada una {a}: sumo el {a} tantas veces como {caja}, {n} veces."),
               (f"{n} × {a}", str(n * a), f"{' + '.join([str(a)] * n)} = {n} × {a} = {n * a}.")],
              "Tres bolsas de cuatro son 4 + 4 + 4: se suma el tamaño del grupo tantas veces como grupos haya. Que lo dibuje si se lía.",
              genericos=[" + ".join([str(a)] * (n - 1)) if n > 2 else f"{a} + {n}"])


# ================================================================ MULTIPLICACIÓN CON ALGORITMO

def columnas(a, b):
    """Multiplica a por una cifra b columna a columna: devuelve [(cifra, producto+llevada, escribe, lleva)]."""
    out, lleva = [], 0
    ds = [int(c) for c in str(a)][::-1]
    for i, c in enumerate(ds):
        t = c * b + lleva
        if i == len(ds) - 1:
            out.append((c, t, t, 0))
        else:
            out.append((c, t, t % 10, t // 10))
            lleva = t // 10
    return out


def texto_columnas(a, b):
    pasos = []
    lleva = 0
    ds = [int(c) for c in str(a)][::-1]
    nombres = ["unidades", "decenas", "centenas", "unidades de millar"]
    for i, c in enumerate(ds):
        t = c * b + lleva
        extra = f" + {lleva} que llevaba" if lleva else ""
        if i == len(ds) - 1:
            pasos.append((f"{c} × {b}{' + ' + str(lleva) if lleva else ''}", str(t), f"{nombres[i].capitalize()}: {c} × {b}{extra} = {t}; lo escribo entero."))
        else:
            pasos.append((f"{c} × {b}{' + ' + str(lleva) if lleva else ''}", str(t), f"{nombres[i].capitalize()}: {c} × {b}{extra} = {t}; escribo {t % 10}" + (f" y me llevo {t // 10}." if t >= 10 else ".")))
            lleva = t // 10
    return pasos


def mult_llevada_antes(a, b):
    """Suma la llevada a la cifra antes de multiplicar: (c + lleva) × b."""
    res, lleva = "", 0
    ds = [int(c) for c in str(a)][::-1]
    for i, c in enumerate(ds):
        t = (c + lleva) * b
        if i == len(ds) - 1:
            res = str(t) + res
        else:
            res = str(t % 10) + res
            lleva = (c * b) // 10
    return int(res)


def mult_sin_llevada(a, b):
    return int("".join(str(int(c) * b % 10) for c in str(a)))


def mult_escribe_todo(a, b):
    return int("".join(str(int(c) * b) for c in str(a)))


def mult_salta_cero(a, b):
    """Omite la cifra del resultado correspondiente al 0 intermedio del primer factor."""
    ds = str(a)
    if "0" not in ds[1:]:
        return None
    col = columnas(a, b)  # de derecha a izquierda
    partes = []
    for i, (c, t, esc, _) in enumerate(col):
        if c == 0 and i < len(col) - 1:
            continue
        partes.append(str(esc))
    return int("".join(reversed(partes)))


@generador("t2_mult1")
def gen_mult1(rng, d):
    """Número de 2–4 cifras por una cifra. Claves: sin_llevada, llevada_antes, escribe_todo, salta_cero, tabla (un hecho mal)."""
    for _ in range(200):
        b = rng.randint(2, 9 if d > 1 else 6)
        if d == 1:
            a = rng.randint(12, 49)
        elif d == 2:
            a = rng.randint(102, 999)
        else:
            a = rng.randint(1002, 9999)
            if rng.random() < 0.6:
                s = list(str(a))
                s[rng.choice([1, 2])] = "0"
                a = int("".join(s))
        if d == 2 and rng.random() < 0.35:
            a = int(str(a)[0] + "0" + str(a)[2])
        if mult_escribe_todo(a, b) == a * b:
            continue
        break
    p = a * b
    i = rng.randrange(len(str(a)))
    dist = [(mult_salta_cero(a, b), "salta_cero"), (mult_sin_llevada(a, b), "sin_llevada"), (mult_llevada_antes(a, b), "llevada_antes"),
            (mult_escribe_todo(a, b), "escribe_todo"), (p + b * 10 ** i if int(str(a)[::-1][i]) else p - b, "tabla")]
    dist = [(v, k) for v, k in dist if v is not None and v != p]
    pasos = texto_columnas(a, b)
    pasos.append((f"{fmt(a)} × {b}", fmt(p), f"Resultado: {fmt(a)} × {b} = {fmt(p)}."))
    return mk(f"Calcula: {fmt(a)} × {b}", fmt(p), "mult", {"a": a, "b": b}, dist, pasos,
              "Se multiplica de derecha a izquierda y lo que 'se lleva' se suma después de multiplicar la cifra siguiente, nunca antes. "
              "Con un 0 en medio: 0 por algo es 0, pero hay que sumar lo que se llevaba y escribir esa cifra. Estimar antes ayuda (406 × 3 ≈ 1 200).",
              genericos=[p + 10, p - 10, p + 100])


@generador("t2_mult10")
def gen_mult10(rng, d):
    """× 10, 100, 1000. Claves: ceros (número de ceros equivocado), no_cuenta (ignora los ceros que ya tenía), suma (suma el 10/100)."""
    if d == 1:
        m, a = 10, rng.randint(2, 99)
    elif d == 2:
        m, a = rng.choice([100, 1000]), rng.randint(3, 999)
    else:
        m = rng.choice([10, 100, 1000])
        a = rng.randint(2, 999) * rng.choice([10, 100])
        if rng.random() < 0.4:
            a = int(str(rng.randint(1, 9)) + "0" + str(rng.randint(1, 9)) + "0")
        if a > 99999:
            a = 3050
    p = a * m
    ceros = len(str(m)) - 1
    dist = []
    if a % 10 == 0:
        t = a
        while t % 10 == 0:
            t //= 10
        dist.append((t * m, "no_cuenta"))
    dist += [(p // 10, "ceros"), (p * 10, "ceros"), (a + m, "suma")]
    return mk(f"Calcula: {fmt(a)} × {fmt(m)}", fmt(p), "mult", {"a": a, "b": m}, dist,
              [(f"{fmt(a)} × {fmt(m)}", fmt(p), f"Multiplicar por {fmt(m)} es añadir {ceros} cero{'s' if ceros > 1 else ''} al final del número: "
                                                f"{fmt(a)} → {fmt(p)}. Cada cifra pasa a un orden {'superior' if ceros == 1 else f'{ceros} lugares a la izquierda'}.")],
              "Por 10, 100 o 1000 se añaden tantos ceros como tenga el 10, el 100 o el 1000; los ceros que ya tenía el número se quedan. "
              "Que diga el valor de cada cifra antes y después: las unidades pasan a decenas, etc.",
              genericos=[p + m, p * 100 if p * 100 < 10 ** 8 else p + 1])


def sin_ceros(n):
    c = 0
    while n % 10 == 0 and n:
        n //= 10
        c += 1
    return n, c


@generador("t2_mult_decenas")
def gen_mult_decenas(rng, d):
    """a × (cifra seguida de ceros). Claves: olvida_ceros (los de un factor), come_cero (quita el cero de 5 × 4 = 20), solo_cifras."""
    for _ in range(100):
        k = 1 if d == 1 else rng.choice([1, 2, 3])
        m = rng.randint(2, 9) * 10 ** k
        if d == 1:
            a = rng.randint(2, 9)
        elif d == 2:
            a = rng.randint(11, 99) if rng.random() < 0.5 else rng.randint(101, 999)
            if sin_ceros(a)[1]:
                continue
        else:
            a = rng.randint(2, 9) * 10 ** rng.choice([1, 2])
            if rng.random() < 0.6:
                m = rng.choice([2, 4, 5, 6, 8]) * 10 ** rng.choice([1, 2, 3])
                a = 5 * 10 ** rng.choice([1, 2]) if m // 10 ** sin_ceros(m)[1] % 2 == 0 else a
        break
    sa, ca = sin_ceros(a)
    sm, cm = sin_ceros(m)
    p = a * m
    dist = [(sa * sm, "solo_cifras")]
    if sa * sm % 10 == 0:
        dist.insert(0, (p // 10, "come_cero"))
    if ca:
        dist.append((sa * m, "olvida_ceros"))
    dist.append((a * sm, "olvida_ceros"))
    return mk(f"Calcula: {fmt(a)} × {fmt(m)}", fmt(p), "mult", {"a": a, "b": m}, dist,
              [(f"{sa} × {sm}", fmt(sa * sm), f"Multiplico las cifras sin los ceros: {sa} × {sm} = {fmt(sa * sm)}."),
               ("ceros", fmt(p), f"Añado los ceros de los dos factores ({ca + cm} en total): {fmt(p)}.")],
              "Se multiplican las cifras significativas y se añaden todos los ceros de los dos factores. Si el producto de las cifras ya "
              "acaba en cero (5 × 4 = 20), ese cero es parte del producto y se suma a los demás.",
              genericos=[p * 10, p + m])


@generador("t2_mult2")
def gen_mult2(rng, d, cifras_b=2):
    """Multiplicación por 2 o 3 cifras. Claves: sin_desplazar, cifra_a_cifra, mezcla_llevadas, suma_mal, desplaza_poco (3.ª fila
    un solo lugar), cero_medio (con 0 en medio del multiplicador no desplaza: 234 × 305 → 234 × 35)."""
    ca = {1: 2, 2: 3, 3: rng.choice([3, 4])}[d]
    for _ in range(200):
        a = rng.randint(10 ** (ca - 1) + 1, 10 ** ca - 1)
        if cifras_b == 2:
            b = rng.randint(12, 99)
            if b % 10 == 0:
                continue
        else:
            b = rng.randint(101, 999)
            if d == 3 or (d == 2 and rng.random() < 0.4):
                b = int(str(b)[0] + "0" + str(b)[2])
            if b % 10 == 0:
                continue
        break
    p = a * b
    sb = str(b)
    filas = [a * int(c) * 10 ** i for i, c in enumerate(reversed(sb))]
    dist = []
    if cifras_b == 2:
        u, t = int(sb[1]), int(sb[0])
        dist.append((a * u + a * t, "sin_desplazar"))
        if ca == 2:
            dist.append((int(str(int(str(a)[0]) * t) + str(int(str(a)[1]) * u)), "cifra_a_cifra"))
        col = columnas(a, u)
        c = col[-2][3] if len(col) > 1 else 0
        if c:
            dist.append((a * u + (a * t + c) * 10, "mezcla_llevadas"))
        dist.append((p - 10, "suma_mal"))
    else:
        u, t, c = int(sb[2]), int(sb[1]), int(sb[0])
        if t == 0:
            dist.append((a * int(sb[0] + sb[2]), "cero_medio"))
        dist.append((a * u + a * t * 10 + a * c * 10, "desplaza_poco"))
        dist.append((p + 100, "suma_mal"))
        dist.append((p - 1000, "suma_mal"))
    pasos = []
    for i, ch in enumerate(reversed(sb)):
        if ch == "0":
            pasos.append((f"{fmt(a)} × 0", "0", f"Por la cifra 0 la fila sería de ceros: me la salto y la siguiente fila la desplazo un lugar más."))
            continue
        fila = a * int(ch)
        pasos.append((f"{fmt(a)} × {ch}", fmt(fila), f"{fmt(a)} × {ch} = {fmt(fila)}" + (f", desplazado {i} lugar{'es' if i > 1 else ''} a la izquierda (vale {fmt(fila * 10 ** i)})." if i else ".")))
    sumas = [f for f in filas if f]
    pasos.append((" + ".join(fmt(f) for f in sumas), fmt(p), f"Sumo las filas: {' + '.join(fmt(f) for f in sumas)} = {fmt(p)}."))
    return mk(f"Calcula: {fmt(a)} × {fmt(b)}", fmt(p), "mult", {"a": a, "b": b}, dist, pasos,
              "Cada fila es el primer factor por una cifra del segundo, y se corre un lugar a la izquierda por cada posición (porque esa cifra "
              "vale decenas, centenas…). Que estime antes (unos 30 × 20 = 600) para detectar un resultado imposible.",
              genericos=[p + 10, p + 1000, p - 100])


@generador("t2_mult_prop")
def gen_mult_prop(rng, d):
    """Propiedades de la multiplicación. Claves: distribuye_primero (7 × (10 + 3) = 7 × 10 + 3), conmuta_resta (cree que la
    conmutativa vale para − y :), nombre (confunde el nombre de la propiedad)."""
    tipo = rng.choice({1: ["nombre", "nombre", "facil"], 2: ["distrib_valor", "distrib_forma", "nombre"], 3: ["cierta", "distrib_valor", "facil", "distrib_forma"]}[d])
    NOMBRES_P = ["conmutativa", "asociativa", "distributiva", "elemento neutro"]
    if tipo == "nombre":
        a, b, c = rng.sample(range(2, 10), 3)
        prop = rng.choice(["conmutativa", "asociativa", "distributiva", "elemento neutro"] if d > 1 else ["conmutativa", "elemento neutro", "asociativa"])
        igual = {"conmutativa": f"{a} × {b} = {b} × {a}", "asociativa": f"({a} × {b}) × {c} = {a} × ({b} × {c})",
                 "distributiva": f"{a} × ({b} + {c}) = {a} × {b} + {a} × {c}", "elemento neutro": f"{a * b} × 1 = {a * b}"}[prop]
        why = {"conmutativa": "cambia el orden de los factores y el producto no cambia",
               "asociativa": "cambia la forma de agrupar los factores y el producto no cambia",
               "distributiva": "multiplicar por una suma es multiplicar por cada sumando y sumar",
               "elemento neutro": "multiplicar por 1 deja el número igual"}[prop]
        return mk(f"¿Qué propiedad se aplica en {igual}?", prop, "t2_prop", {"tipo": tipo, "prop": prop},
                  [(x, "nombre") for x in NOMBRES_P if x != prop],
                  [(igual, prop, f"En {igual} se {why}: es la propiedad {prop}.")],
                  "Conmutativa = cambiar el orden; asociativa = cambiar los paréntesis de sitio (agrupar); distributiva = repartir el producto "
                  "entre los sumandos; neutro = por 1. Asociar el nombre a la acción ayuda más que memorizar fórmulas.")
    if tipo in ("distrib_valor", "distrib_forma"):
        a = rng.randint(3, 9)
        b = rng.choice([10, 20, 30, 100]) if d < 3 else rng.randint(11, 40)
        c = rng.randint(2, 9)
        op = SUM if rng.random() < 0.7 or c >= b else RES
        v = a * (b + c) if op == SUM else a * (b - c)
        mal = a * b + c if op == SUM else a * b - c
        expr = f"{a} × ({b} {op} {c})"
        if tipo == "distrib_valor":
            return mk(f"Calcula usando la propiedad distributiva: {expr}", fmt(v), "jerarquia", {"expresion": expr, "tipo": tipo},
                      [(mal, "distribuye_primero"), (a * b, None), (a + b + c if op == SUM else a * b + a * c, None)],
                      [(f"{a} × {b} {op} {a} × {c}", f"{a * b} {op} {a * c}", f"Reparto el {a} entre los dos términos: {a} × {b} {op} {a} × {c} = {a * b} {op} {a * c}."),
                       (f"{a * b} {op} {a * c}", fmt(v), f"{a * b} {op} {a * c} = {fmt(v)}.")],
                      "La distributiva reparte el factor entre TODOS los términos del paréntesis. El fallo típico es multiplicar solo el primero.",
                      genericos=[v + a, v - a, v + 10])
        return mk(f"¿A qué es igual {expr}?", f"{a} × {b} {op} {a} × {c}", "t2_prop", {"tipo": tipo},
                  [(f"{a} × {b} {op} {c}", "distribuye_primero"), (f"{a} + {b} {op} {a} + {c}", None), (f"{a} × {b} × {c}", None)],
                  [(expr, f"{a} × {b} {op} {a} × {c}", f"El {a} multiplica a todo el paréntesis, así que multiplica al {b} y también al {c}: {a} × {b} {op} {a} × {c}.")],
                  "La distributiva reparte el factor entre todos los términos del paréntesis. Comprobad con números: las dos expresiones deben dar lo mismo.",
                  genericos=[f"{a} × {b} {op} {b} × {c}"])
    if tipo == "cierta":
        a, b = rng.randint(6, 20), rng.randint(2, 5)
        if rng.random() < 0.5:
            a = b * rng.randint(2, 6)
        correcta = rng.choice([f"{a} × {b} = {b} × {a}", f"{a} + {b} = {b} + {a}", f"{a} × 1 = {a}"])
        return mk("¿Cuál de estas igualdades es cierta?", correcta, "t2_prop", {"tipo": tipo},
                  [(f"{a} − {b} = {b} − {a}", "conmuta_resta"), (f"{a * b} : {b} = {b} : {a * b}", "conmuta_resta"), (f"{a} × 0 = {a}", None)],
                  [("comprobar", correcta, f"Compruebo cada una calculando los dos lados. Solo {correcta} da lo mismo a los dos lados. "
                                           f"La resta y la división no son conmutativas: {a} − {b} = {a - b}, pero {b} − {a} no da {a - b}.")],
                  "La conmutativa vale para sumar y multiplicar, no para restar ni dividir. Comprobarlo con números es la mejor forma de convencerse.")
    x = rng.choice([25, 50, 5, 20])
    y = {25: 4, 50: 2, 5: 2, 20: 5}[x]
    m = rng.randint(3, 19)
    expr = f"{x} × {m} × {y}"
    v = x * m * y
    return mk(f"Calcula de la forma más fácil: {expr}", fmt(v), "jerarquia", {"expresion": expr, "tipo": "facil"},
              [(x * m + y, None), (x * y + m, None), (v // 10 if v % 10 == 0 else v + 10, None)],
              [(f"{x} × {y} × {m}", f"{x * y} × {m}", f"Cambio el orden (conmutativa) y agrupo (asociativa): {x} × {y} = {x * y}."),
               (f"{x * y} × {m}", fmt(v), f"{x * y} × {m} = {fmt(v)}.")],
              "Conmutativa y asociativa permiten reordenar y agrupar factores para buscar productos redondos (25 × 4 = 100, 5 × 2 = 10).",
              genericos=[v + 100, v - 100, v + x])
