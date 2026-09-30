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
FEMENINOS = {"canica", "pegatina", "galleta", "manzana", "flor", "concha", "piedra"}
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
    if tipo in ("suma_a_mult", "grupos_suma"):
        n = min(max(n, 3), 6)
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
        cosa = rng.choice([("una caja de bombones", "bombones", "Cuántos"), ("un huerto", "lechugas", "Cuántas"), ("una tableta de chocolate", "onzas", "Cuántas"),
                           ("un aparcamiento", "coches", "Cuántos"), ("una bandeja de huevos", "huevos", "Cuántos"), ("un mural", "fotos", "Cuántas")])
        return mk(f"En {cosa[0]} hay {n} filas y en cada fila {a} {cosa[1]}. ¿{cosa[2]} {cosa[1]} hay en total?", fmt(n * a), "mult",
                  {"a": n, "b": a, "tipo": tipo},
                  [(n + a, "suma"), (n * a + a, "uno_mas"), ((n - 1) * a, "cuenta_mal")],
                  [(f"{n} × {a}", str(n * a), f"Son {n} filas iguales de {a}: {n} × {a} = {n * a} {cosa[1]}.")],
                  "Filas y columnas son grupos iguales: filas × lo que hay en cada fila. Si suma filas y columnas, que las cuente de una en una.",
                  genericos=[n * a + 1, n * a - 1, n * a + 2])
    if a == n:
        a = n + 1 if n < hi else n - 1
    cosa = rng.choice(OBJETOS)
    caja, una = rng.choice([("bolsas", "una"), ("cajas", "una"), ("platos", "uno"), ("cestas", "una")])
    art = "todas las" if cosa[0] in FEMENINOS else "todos los"
    return mk(f"Hay {n} {caja} con {a} {cosa[1]} en cada {una}. ¿Qué suma representa {art} {cosa[1]}?", " + ".join([str(a)] * n),
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
    rng.shuffle(dist)
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


# ================================================================ DIVISIÓN

def div_larga(D, dv, error_resta=None):
    """Algoritmo de la división. Devuelve (cociente, resto, pasos). error_resta=i: en el paso i la resta da 1 de más."""
    s = str(D)
    pasos, q, r, i = [], "", 0, 0
    # primera cifra o cifras que contienen al divisor
    cur = 0
    while i < len(s) and cur < dv:
        cur = cur * 10 + int(s[i])
        i += 1
    paso = 0
    while True:
        c = cur // dv
        resta = cur - c * dv
        if error_resta is not None and paso == error_resta:
            resta += 1
        pasos.append((cur, c, resta))
        q += str(c)
        paso += 1
        if i >= len(s):
            r = resta
            break
        cur = resta * 10 + int(s[i])
        i += 1
    return int(q), r, pasos


def texto_div(D, dv):
    q, r, pasos = div_larga(D, dv)
    out = []
    for k, (cur, c, resta) in enumerate(pasos):
        if k == 0:
            t = f"Cojo {cur} (lo primero en lo que cabe el {dv}). {cur} : {dv} = {c}, porque {dv} × {c} = {dv * c}; resto {cur} − {dv * c} = {resta}."
        elif c == 0:
            t = f"Bajo la cifra siguiente: {cur}. El {dv} no cabe en {cur}: pongo un 0 en el cociente."
        else:
            t = f"Bajo la cifra siguiente: {cur}. {cur} : {dv} = {c} ({dv} × {c} = {dv * c}); resto {resta}."
        out.append((f"{cur} : {dv}", str(c), t))
    out.append((f"{fmt(dv)} × {fmt(q)} + {r}", fmt(D), f"Compruebo: {fmt(dv)} × {fmt(q)} + {r} = {fmt(D)}."))
    return out


def qr(q, r):
    return f"cociente {fmt(q)}, resto {fmt(r)}"


def sin_cero_interior(q):
    s = str(q)
    return int(s[0] + s[1:].replace("0", "")) if "0" in s[1:] else None


@generador("t2_div1")
def gen_div1(rng, d):
    """División exacta entre una cifra. Claves: invierte (dice que no se puede), olvida_cero, tabla_equivocada (cociente ±1),
    cifra_a_cifra (divide cada cifra por separado)."""
    for _ in range(500):
        dv = rng.randint(2, 9)
        if d == 1:
            q = rng.randint(2, 10)
        elif d == 2:
            q = rng.randint(11, 49)
        else:
            q = rng.randint(101, 199) if rng.random() < 0.4 else rng.randint(11, 140)
        D = q * dv
        if d == 2 and D > 99:
            continue
        if d == 3 and not (100 <= D <= 999):
            continue
        break
    s = str(D)
    cac = None
    if len(s) >= 2 and int(s[0]) >= dv:
        ds = [int(c) // dv for c in s]
        cac_s = "".join(str(x) for x in ds).lstrip("0")
        if cac_s and int(cac_s) != q:
            cac = int(cac_s)
    dist = [(sin_cero_interior(q), "olvida_cero"), (cac, "cifra_a_cifra"), (q + 1, "tabla_equivocada"), (q - 1, "tabla_equivocada"),
            ("No se puede dividir", "invierte")]
    if d == 1:
        pasos = [(f"{dv} × ? = {D}", str(q), f"Busco en la tabla del {dv} qué número da {D}: {dv} × {q} = {D}. Así que {D} : {dv} = {q}.")]
    else:
        pasos = texto_div(D, dv)
    return mk(f"Calcula: {fmt(D)} : {dv}", fmt(q), "div", {"a": D, "b": dv}, dist, pasos,
              "La división exacta se apoya en la tabla: '¿el 7 por cuánto da 56?'. En divisiones largas, lo que sobra de una cifra se junta con la "
              "siguiente (no se divide cada cifra por separado) y, si el divisor no cabe, se pone un 0 en el cociente.",
              genericos=[q + 2, q + 10, q - 2])


@generador("t2_div_resto")
def gen_div_resto(rng, d, cifras_divisor=1, prueba=False):
    """División entera (cociente y resto). Claves: resto_mayor (se queda corto: resto ≥ divisor), olvida_cero, resto_ultima_cifra
    (da como resto la última cifra que bajó), resta_mal (error en una resta intermedia), prueba_mal (prueba c × r + d o sin resto)."""
    for _ in range(800):
        if cifras_divisor == 1:
            dv = rng.randint(2, 9)
            D = rng.randint(*{1: (11, 99), 2: (100, 999), 3: (1000, 9999)}[d])
        else:
            if d == 1:
                dv, D = rng.randint(11, 49), rng.randint(100, 999)
            elif d == 2:
                dv, D = rng.randint(12, 99), rng.randint(1000, 9999)
            else:
                dv, D = rng.randint(101, 499), rng.randint(10000, 99999)
        q, r = divmod(D, dv)
        if r == 0 or q < 2:
            continue
        if d == 3 and cifras_divisor == 1 and "0" not in str(q)[1:] and rng.random() < 0.7:
            continue
        if cifras_divisor > 1 and d >= 2 and "0" not in str(q)[1:] and rng.random() < 0.5:
            continue
        break
    if prueba and rng.random() < 0.4:
        corr = f"{fmt(dv)} × {fmt(q)} + {fmt(r)} = {fmt(D)}"
        return mk(f"Al dividir {fmt(D)} entre {fmt(dv)} sale cociente {fmt(q)} y resto {fmt(r)}. ¿Qué cuenta sirve de prueba?", corr, "t2_prueba",
                  {"a": D, "b": dv, "q": q, "r": r},
                  [(f"{fmt(q)} × {fmt(r)} + {fmt(dv)}", "prueba_mal"), (f"{fmt(dv)} × {fmt(q)} = {fmt(D)}", "prueba_mal"),
                   (f"{fmt(D)} × {fmt(dv)} + {fmt(r)}", None)],
                  [("prueba", corr, f"Dividendo = divisor × cociente + resto: {fmt(dv)} × {fmt(q)} = {fmt(dv * q)} y {fmt(dv * q)} + {fmt(r)} = {fmt(D)}. "
                                     f"Además el resto ({fmt(r)}) es menor que el divisor ({fmt(dv)}).")],
                  "La prueba de la división es D = d × c + r con r < d. Si no se suma el resto, la prueba 'falla' aunque la división esté bien.")
    dist = []
    sc = sin_cero_interior(q)
    if sc:
        dist.append((qr(sc, r), "olvida_cero"))
    dist.append((qr(q - 1, r + dv), "resto_mayor"))
    if cifras_divisor == 1 and D % 10 != r and D % 10 < 10:
        dist.append((qr(q, D % 10), "resto_ultima_cifra"))
    if cifras_divisor == 1:
        try:
            q2, r2, _ = div_larga(D, dv, error_resta=0)
            if (q2, r2) != (q, r) and r2 >= 0 and len(str(q2)) == len(str(q)):
                dist.append((qr(q2, r2), "resta_mal"))
        except Exception:  # noqa: BLE001
            pass
    return mk(f"Divide: {fmt(D)} : {fmt(dv)}. ¿Cuál es el cociente y el resto?", qr(q, r), "div", {"a": D, "b": dv}, dist,
              texto_div(D, dv),
              "El resto siempre tiene que ser menor que el divisor; si no, cabía una vez más. Si al bajar una cifra el divisor no cabe, va un 0 en el "
              "cociente. Terminad siempre con la prueba: divisor × cociente + resto = dividendo.",
              genericos=[qr(q + 1, r), qr(q, (r + 1) % dv if (r + 1) % dv != r else r + 1), qr(q - 1, r)])


@generador("t2_div10")
def gen_div10(rng, d):
    """Dividir entre 10, 100, 1000 (cociente y resto). Claves: ceros (quita un número de ceros equivocado), sin_resto (quita cifras
    que no son ceros y no da resto), anade_ceros (multiplica)."""
    if d == 1:
        m = 10
        D = rng.randint(2, 999) * 10
    elif d == 2:
        m = rng.choice([100, 1000])
        D = rng.randint(2, 99) * m if rng.random() < 0.5 else rng.randint(1000, 99999)
    else:
        m = rng.choice([10, 100, 1000])
        D = rng.randint(10000, 99999)
        if rng.random() < 0.35:
            a, b = rng.randint(2, 9), rng.randint(2, 9)
            k = rng.choice([10, 100])
            D, m = a * b * k * 10, b * k
            if D % m == 0 and (a * b * k * 10) // m == a * 10 and m not in (10, 100, 1000):
                return mk(f"Calcula: {fmt(D)} : {fmt(m)}", fmt(D // m), "div", {"a": D, "b": m},
                          [(D // m // 10, "ceros"), (D // m * 10 if D // m * 10 != a * 10 else None, "ceros"), (D // (m // 10) if m % 100 == 0 else D * 10, "ceros")],
                          [(f"{fmt(D)} : {fmt(m)}", f"{fmt(D // (m // k * 1) // 1) if False else ''}{fmt(D // k)} : {m // k}",
                            f"Quito el mismo número de ceros a los dos ({len(str(k)) - 1}): {fmt(D)} : {fmt(m)} = {fmt(D // k)} : {fmt(m // k)}."),
                           (f"{fmt(D // k)} : {fmt(m // k)}", fmt(D // m), f"{fmt(D // k)} : {fmt(m // k)} = {fmt(D // m)}.")],
                          "Si dividendo y divisor acaban en ceros, se pueden quitar los mismos ceros a los dos y el cociente no cambia.",
                          genericos=[D // m + 1, D // m - 1, D // m + 10])
    q, r = divmod(D, m)
    k = len(str(m)) - 1
    if r == 0:
        return mk(f"Calcula: {fmt(D)} : {fmt(m)}", fmt(q), "div", {"a": D, "b": m},
                  [(D // (m * 10) if D % (m * 10) == 0 else None, "ceros"), (D // (m // 10) if m > 10 else None, "ceros"),
                   (D * m if D * m < 10 ** 8 else D * 10, "anade_ceros")],
                  [(f"{fmt(D)} : {fmt(m)}", fmt(q), f"Dividir entre {fmt(m)} es quitar {k} cero{'s' if k > 1 else ''} del final: {fmt(D)} → {fmt(q)}.")],
                  "Dividir entre 10, 100 o 1000 es quitar uno, dos o tres ceros (cada cifra baja de orden). Que no quite ceros que no son del final.",
                  genericos=[q + 1, q + 10, q - 1])
    return mk(f"Divide: {fmt(D)} : {fmt(m)}. ¿Cuál es el cociente y el resto?", qr(q, r), "div", {"a": D, "b": m},
              [(qr(q, 0), "sin_resto"), (qr(q // 10, D % (m * 10)) if q >= 10 else None, "ceros"), (qr(D // (m // 10), D % (m // 10)) if m > 10 else None, "ceros"),
               (qr(q * 10, r), None)],
              [(f"{fmt(D)} : {fmt(m)}", qr(q, r), f"Al dividir entre {fmt(m)} separo las {k} última{'s' if k > 1 else ''} cifra{'s' if k > 1 else ''}: "
                                                   f"lo de delante ({fmt(q)}) es el cociente y lo que queda ({fmt(r)}) es el resto."),
               ("prueba", fmt(D), f"Compruebo: {fmt(q)} × {fmt(m)} + {fmt(r)} = {fmt(D)}.")],
              "Entre 10, 100 o 1000: las últimas 1, 2 o 3 cifras son el resto y las demás el cociente. Si no acaba en ceros, no se pueden 'quitar' sin más: sobra algo.",
              genericos=[qr(q + 1, r), qr(q, r + 1), qr(q - 1, r)])


@generador("t2_div_terminos")
def gen_div_terminos(rng, d):
    """Hallar el término desconocido con D = d·c + r. Claves: olvida_resto (D = d·c), resta_resto (D = d·c − r),
    no_quita_resto (d = D : c sin quitar el resto), resto_grande (acepta r ≥ d)."""
    dv = rng.randint(2, 9) if d == 1 else rng.randint(6, 30) if d == 2 else rng.randint(11, 99)
    c = rng.randint(3, 30 if d > 1 else 12)
    r = rng.randint(1, dv - 1)
    D = dv * c + r
    tipo = {1: "dividendo", 2: rng.choice(["divisor", "cociente", "dividendo"]), 3: rng.choice(["divisor", "posible", "dividendo", "cociente"])}[d]
    adulto = ("Todo sale de la prueba de la división: D = d × c + r, con el resto menor que el divisor. Para hallar el divisor o el cociente, "
              "primero se quita el resto al dividendo y luego se divide.")
    if tipo == "dividendo":
        return mk(f"En una división, el divisor es {dv}, el cociente {c} y el resto {r}. ¿Cuál es el dividendo?", fmt(D), "t2_terminos",
                  {"d": dv, "c": c, "r": r, "incognita": tipo},
                  [(dv * c, "olvida_resto"), (dv * c - r, "resta_resto"), (dv + c + r, None)],
                  [(f"{dv} × {c} + {r}", fmt(D), f"Dividendo = divisor × cociente + resto = {dv} × {c} + {r} = {dv * c} + {r} = {fmt(D)}.")],
                  adulto, genericos=[D + 1, D + dv, D - 1])
    if tipo in ("divisor", "cociente"):
        buscado, dado = (dv, c) if tipo == "divisor" else (c, dv)
        while buscado == dado:
            c += 1
            D = dv * c + r
            buscado, dado = (dv, c) if tipo == "divisor" else (c, dv)
        mal = D // dado if D % dado and D // dado != buscado else None
        enun = (f"En una división, el dividendo es {fmt(D)}, el cociente {c} y el resto {r}. ¿Cuál es el divisor?" if tipo == "divisor"
                else f"En una división, el dividendo es {fmt(D)}, el divisor {dv} y el resto {r}. ¿Cuál es el cociente?")
        return mk(enun, fmt(buscado), "t2_terminos", {"D": D, "d": dv, "c": c, "r": r, "incognita": tipo},
                  [(mal, "no_quita_resto" if tipo == "divisor" else None), (buscado + 1, None), ((D + r) // dado if (D + r) % dado == 0 and (D + r) // dado != buscado else buscado - 1, None)],
                  [(f"{fmt(D)} − {r}", fmt(D - r), f"Quito el resto al dividendo: {fmt(D)} − {r} = {fmt(D - r)}."),
                   (f"{fmt(D - r)} : {dado}", fmt(buscado), f"{fmt(D - r)} : {dado} = {buscado}. Compruebo: {dv} × {c} + {r} = {fmt(D)}.")],
                  adulto, genericos=[buscado + 2, buscado - 2])
    # posible
    ok = f"divisor {dv}, cociente {c}, resto {r}"
    return mk(f"¿Cuál de estos datos puede ser de una división con dividendo {fmt(D)}?", ok, "t2_terminos", {"D": D, "d": dv, "c": c, "r": r, "incognita": tipo},
              [(f"divisor {dv}, cociente {c - 1}, resto {r + dv}", "resto_grande"), (f"divisor {c}, cociente {dv - 1}, resto {r + c}" if r + c != r else None, "resto_grande"),
               (f"divisor {dv}, cociente {c}, resto {r + 1 if r + 1 < dv else r - 1}", None)],
              [(f"{dv} × {c} + {r}", fmt(D), f"Compruebo cada opción con D = d × c + r y miro que el resto sea menor que el divisor. "
                                              f"{dv} × {c} + {r} = {fmt(D)} y {r} < {dv}: esta vale.")],
              adulto + " Una opción con el resto mayor o igual que el divisor nunca vale, aunque la cuenta cuadre.",
              genericos=[f"divisor {dv + 1}, cociente {c}, resto {r}"])


@generador("t2_div_prop")
def gen_div_prop(rng, d):
    """Propiedad fundamental de la división. Claves: solo_uno (cambia solo un término), suma_igual (suma/resta el mismo número a
    los dos), resto_igual (cree que el resto tampoco cambia)."""
    tipo = {1: "equivalente", 2: rng.choice(["equivalente", "simplificar"]), 3: rng.choice(["entera", "entera", "simplificar"])}[d]
    adulto = ("Si dividendo y divisor se multiplican (o dividen) por el mismo número, el cociente no cambia; en la división entera el resto "
              "queda multiplicado (o dividido) por ese número. Sumar o restar lo mismo a los dos NO conserva el cociente.")
    if tipo == "equivalente":
        dv, q = rng.randint(2, 9), rng.randint(2, 9)
        k = rng.randint(2, 5)
        D = dv * q
        ok = f"{D * k} : {dv * k}"
        return mk(f"¿Qué división tiene el mismo cociente que {D} : {dv}?", ok, "t2_divprop", {"D": D, "d": dv, "k": k},
                  [(f"{D * k} : {dv}", "solo_uno"), (f"{D} : {dv * k}", "solo_uno"), (f"{D + k} : {dv + k}", "suma_igual")],
                  [(f"{D} × {k} y {dv} × {k}", ok, f"Multiplico dividendo y divisor por {k}: {D * k} : {dv * k}. El cociente sigue siendo {q}.")],
                  adulto)
    if tipo == "simplificar":
        dv, q = rng.randint(2, 9), rng.randint(2, 9)
        k = rng.choice([10, 100])
        D = dv * q * k
        ok = f"{fmt(D // k)} : {dv}"
        return mk(f"¿Qué división da el mismo resultado que {fmt(D)} : {fmt(dv * k)}?", ok, "t2_divprop", {"D": D, "d": dv * k, "k": k},
                  [(f"{fmt(D // k)} : {fmt(dv * k)}", "solo_uno"), (f"{fmt(D - k)} : {fmt(dv * k - k)}", "suma_igual"), (f"{fmt(D)} : {dv}", "solo_uno")],
                  [(f"{fmt(D)} : {fmt(dv * k)}", ok, f"Divido los dos entre {k} (les quito {len(str(k)) - 1} cero{'s' if k > 10 else ''}): {ok} = {q}.")],
                  adulto)
    for _ in range(100):
        dv = rng.randint(3, 9)
        q = rng.randint(3, 12)
        r = rng.randint(1, dv - 1)
        k = rng.choice([2, 3, 10, 100]) if d == 3 else 10
        break
    D = dv * q + r
    return mk(f"Si {D} : {dv} = {q} y resto {r}, ¿cuánto es {fmt(D * k)} : {fmt(dv * k)}?", qr(q, r * k), "div", {"a": D * k, "b": dv * k},
              [(qr(q, r), "resto_igual"), (qr(q * k, r * k), "solo_uno"), (qr(q * k, r), "solo_uno")],
              [(f"{D} × {k} y {dv} × {k}", f"{fmt(D * k)} : {fmt(dv * k)}", f"Dividendo y divisor están multiplicados por {k}: el cociente no cambia ({q})."),
               (f"{r} × {k}", fmt(r * k), f"El resto sí queda multiplicado por {k}: {r} × {k} = {fmt(r * k)}. Compruebo: {fmt(dv * k)} × {q} + {fmt(r * k)} = {fmt(D * k)}.")],
              adulto)


# ================================================================ DIVISIBILIDAD

def _no_multiplos(rng, b, lo, hi, n, evitar=()):
    out = set()
    for _ in range(500):
        x = rng.randint(lo, hi)
        if x % b and x not in evitar:
            out.add(x)
        if len(out) >= n:
            break
    return sorted(out)


@generador("t2_multiplos")
def gen_multiplos(rng, d):
    """Múltiplos de un número. Claves: divisor (confunde múltiplo con divisor), mayor (cree múltiplo cualquier número mayor),
    olvida_propio (se deja el propio número), salta (se salta un múltiplo)."""
    bmax, nmax = {1: (10, 100), 2: (20, 300), 3: (99, 1000)}[d]
    b = rng.randint(3, bmax) if d < 3 else rng.randint(11, bmax)
    tipo = rng.choice(["cual", "lista", "decidir"] if d < 3 else ["cual", "decidir", "decidir"])
    adulto = ("Múltiplo de 7 = está en la 'tabla del 7' alargada (7 × algo); divisor de 7 = cabe exacto en el 7. Los múltiplos son infinitos "
              "y empiezan en 0 y en el propio número; ser más grande no basta.")
    if tipo == "lista":
        k = rng.choice([4, 5, 6])
        tope = b * k
        ok = [b * i for i in range(1, k + 1)]
        divs = [x for x in divisores(b)]
        salta = ok[:2] + ok[3:] + [b * (k + 1)]
        return mk(f"¿Cuáles son los múltiplos de {b} comprendidos entre 1 y {tope}?", lista(ok), "t2_multiplos", {"b": b, "tope": tope, "tipo": tipo},
                  [(lista(divs), "divisor") if len(divs) > 2 else (lista([b + i for i in range(k)]), None), (lista(ok[1:]), "olvida_propio"),
                   (lista(salta[:k]), "salta")],
                  [("tabla", lista(ok), f"Multiplico {b} por 1, 2, 3… sin pasarme de {tope}: " + ", ".join(f"{b} × {i} = {b * i}" for i in range(1, k + 1)) + ".")],
                  adulto, genericos=[lista([b * i + 1 for i in range(1, k + 1)])])
    if tipo == "cual":
        k = rng.randint(2, max(2, nmax // b))
        r = b * k
        otros = _no_multiplos(rng, b, max(b + 1, r - 3 * b), min(nmax, r + 3 * b), 4)
        divs = [x for x in divisores(b) if 1 < x < b]
        dist = [(fmt(rng.choice(divs)), "divisor")] if divs else []
        dist += [(fmt(x), "mayor") for x in otros]
        return mk(f"¿Cuál de estos números es múltiplo de {b}?", fmt(r), "t2_multiplos", {"b": b, "r": r, "tipo": tipo}, dist,
                  [(f"{fmt(r)} : {b}", str(k), f"{fmt(r)} : {b} = {k} exacta (o {b} × {k} = {fmt(r)}): {fmt(r)} es múltiplo de {b}. En los demás la división no es exacta.")],
                  adulto, datos={"opciones_fijas": True})
    k = rng.randint(2, max(2, nmax // b))
    N = b * k if rng.random() < 0.5 else b * k + rng.randint(1, b - 1)
    q, r = divmod(N, b)
    if r == 0:
        ok = f"Sí, porque {b} × {q} = {fmt(N)}"
        dist = [(f"No, porque {fmt(N)} : {b} no es exacta", None), (f"Sí, porque {fmt(N)} es mayor que {b}", "mayor"),
                (f"No, porque {b} no es divisor de {fmt(N)}", None)]
        texto = f"Divido {fmt(N)} : {b} = {q} exacta: {b} × {q} = {fmt(N)}. Sí es múltiplo."
    else:
        ok = f"No, porque {fmt(N)} : {b} = {q} y sobra {r}"
        dist = [(f"Sí, porque {fmt(N)} es mayor que {b}", "mayor"), (f"Sí, porque {b} × {q} = {fmt(N)}", None),
                (f"No, porque {fmt(N)} es mayor que {b}", None)]
        texto = f"Divido {fmt(N)} : {b} = {q} y sobra {r}: no es exacta, así que no es múltiplo."
    return mk(f"¿Es {fmt(N)} múltiplo de {b}?", ok, "t2_multiplos", {"b": b, "N": N, "tipo": tipo}, dist,
              [(f"{fmt(N)} : {b}", f"{q} resto {r}", texto)], adulto)


@generador("t2_divisor_rel")
def gen_divisor_rel(rng, d):
    """Relación divisor / múltiplo / divisible. Claves: invierte (7 es múltiplo de 126), division_con_resto (es divisor si la
    división 'se puede hacer' aunque sobre)."""
    tipo = rng.choice({1: ["cual"], 2: ["frases", "cual", "decidir"], 3: ["frases", "decidir"]}[d])
    adulto = ("'126 es múltiplo de 7', '7 es divisor de 126' y '126 es divisible por 7' dicen lo mismo: 126 : 7 es exacta. El grande es el "
              "múltiplo; el pequeño, el divisor. Si sobra algo, no hay relación.")
    if tipo == "frases":
        a, b = rng.randint(3, 25), rng.randint(3, 12)
        while a == b:
            b += 1
        N = a * b
        verdad = rng.choice([f"{N} es múltiplo de {b}", f"{a} es divisor de {N}", f"{N} es divisible por {a}", f"{b} es divisor de {N}"])
        falsas = [f"{b} es múltiplo de {N}", f"{N} es divisor de {a}", f"{a} es divisible por {N}", f"{N} es divisor de {b}"]
        rng.shuffle(falsas)
        return mk(f"Sabemos que {a} × {b} = {N}. ¿Qué frase es verdadera?", verdad, "t2_divisor", {"a": a, "b": b, "tipo": tipo},
                  [(f, "invierte") for f in falsas[:3]],
                  [("relación", verdad, f"Como {a} × {b} = {N}, la división de {N} entre {a} y entre {b} es exacta: {N} es el múltiplo y {a} y {b} son sus divisores. "
                                         f"Por eso es verdad que {verdad}.")], adulto)
    N = rng.randint(12, 100 if d == 1 else 1000)
    divs = divisores(N)
    if tipo == "cual":
        x = rng.choice([v for v in divs if 1 < v < N] or divs)
        malos = [v for v in range(2, min(N, 30)) if N % v]
        rng.shuffle(malos)
        dist = [(fmt(v), "division_con_resto") for v in malos[:4]]
        return mk(f"¿Cuál de estos números es divisor de {fmt(N)}?", fmt(x), "t2_divisor", {"N": N, "x": x, "tipo": tipo}, dist,
                  [(f"{fmt(N)} : {x}", fmt(N // x), f"{fmt(N)} : {x} = {fmt(N // x)} exacta, así que {x} es divisor de {fmt(N)}. Con los otros números sobra algo.")],
                  adulto, datos={"opciones_fijas": True})
    malos = [v for v in range(3, 13) if N % v]
    v = rng.choice(malos) if malos and rng.random() < 0.6 else rng.choice([t for t in divs if 1 < t < N] or [1])
    q, r = divmod(N, v)
    if r:
        ok = f"No, porque {fmt(N)} : {v} = {q} y sobran {r}"
        dist = [(f"Sí, porque {fmt(N)} : {v} = {q} y sobran {r}", "division_con_resto"), (f"Sí, porque {v} es menor que {fmt(N)}", None),
                (f"No, porque {v} es menor que {fmt(N)}", None)]
    else:
        ok = f"Sí, porque {fmt(N)} : {v} = {q} exacta"
        dist = [(f"No, porque {v} es menor que {fmt(N)}", None), (f"No, porque {fmt(N)} no es múltiplo de {v}", None),
                (f"Sí, porque {fmt(N)} es divisor de {v}", "invierte")]
    return mk(f"¿Es {v} divisor de {fmt(N)}?", ok, "t2_divisor", {"N": N, "v": v, "tipo": tipo}, dist,
              [(f"{fmt(N)} : {v}", f"{q} resto {r}", f"Divido {fmt(N)} : {v} = {q}" + (f" y sobran {r}: no es exacta, no es divisor." if r else " exacta: es divisor."))],
              adulto)


def suma_cifras(n):
    return sum(int(c) for c in str(n))


def _cumple(n, k):
    return n % k == 0


@generador("t2_criterios")
def gen_criterios(rng, d, grupo="basico"):
    """Criterios de divisibilidad. basico (2, 3, 5, 10) / avanzado (4, 6, 9, 11, 25).
    Claves: ultima_cifra_3 (criterio del 3 mirando la última cifra), primera_cifra (mira la primera cifra), cinco_diez (cree que acabar
    en 5 vale para el 10), suma_mal, ultima_cifra_4, seis_media (solo una condición del 6), nueve_por_tres, once_suma."""
    if grupo == "basico":
        k = rng.choice({1: [2, 5, 10], 2: [3, 3, 2, 5, 10], 3: [3, 3, 10]}[d])
        cifras = {1: 3, 2: 4, 3: rng.choice([5, 6])}[d]
    else:
        k = rng.choice({1: [4, 25, 9], 2: [6, 9, 4, 25], 3: [11, 6, 11, 9]}[d])
        cifras = {1: 4, 2: 5, 3: rng.choice([6, 7])}[d]
    lo, hi = 10 ** (cifras - 1), 10 ** cifras - 1
    if grupo == "basico" and d == 3 and rng.random() < 0.5:
        # completar una cifra para el 3
        for _ in range(100):
            base = rng.randint(lo // 10, hi // 10)
            s = str(base)
            pos = rng.randint(1, len(s) - 1)
            plantilla_ = s[:pos] + "_" + s[pos:]
            oks = [c for c in range(10) if int(s[:pos] + str(c) + s[pos:]) % 3 == 0]
            if s[0] != "0":
                break
        malos = sorted({(c + 1) % 10 for c in oks}) if 0 not in [(c + 1) % 10 for c in oks] else [c for c in range(10) if c not in oks][:3]
        ult = [c for c in (3, 6, 9)]
        res = lista([str(c) for c in oks], y=True).replace(" y ", " o ")
        sc = suma_cifras(int(s))
        return mk(f"¿Qué cifras pueden ir en {plantilla_} para que el número sea divisible por 3?", res, "t2_criterio", {"k": 3, "plantilla": plantilla_, "tipo": "completar"},
                  [(lista([str(c) for c in ult], y=True).replace(" y ", " o "), None) if ult != oks else (None, None),
                   (lista([str((c + 1) % 10) for c in oks], y=True).replace(" y ", " o "), "suma_mal"),
                   (lista([str((c + 2) % 10) for c in oks], y=True).replace(" y ", " o "), "suma_mal")],
                  [("suma de cifras", str(sc), f"Sumo las cifras que conozco: {' + '.join(s)} = {sc}."),
                   ("múltiplo de 3", res, f"Necesito que {sc} + la cifra que falta sea múltiplo de 3: vale {res}.")],
                  "Por 3: la suma de todas las cifras tiene que ser múltiplo de 3 (no importa en qué cifra acabe el número).",
                  genericos=["0, 3, 6 o 9", "2, 5 o 8", "1, 4 o 7"])
    for _ in range(300):
        r = rng.randint(lo, hi)
        if _cumple(r, k):
            break
    trampas = []
    for _ in range(3000):
        x = rng.randint(lo, hi)
        if _cumple(x, k):
            continue
        s = str(x)
        clave = None
        if k == 3 and s[-1] in "369":
            clave = "ultima_cifra_3"
        elif k == 3 and suma_cifras(x) % 3 in (1, 2) and rng.random() < 0.2:
            clave = "suma_mal"
        elif k == 2 and int(s[0]) % 2 == 0:
            clave = "primera_cifra"
        elif k == 10 and s[-1] == "5":
            clave = "cinco_diez"
        elif k == 5 and s[-1] in "2468" and rng.random() < 0.3:
            clave = None
        elif k == 4 and int(s[-1]) % 4 == 0:
            clave = "ultima_cifra_4"
        elif k == 6 and (x % 3 == 0 or x % 2 == 0):
            clave = "seis_media"
        elif k == 9 and x % 3 == 0:
            clave = "nueve_por_tres"
        elif k == 11 and suma_cifras(x) % 11 == 0:
            clave = "once_suma"
        elif k == 25 and s[-1] in "05":
            clave = None
        else:
            continue
        if all(t[0] != fmt(x) for t in trampas):
            trampas.append((fmt(x), clave))
        if len(trampas) >= 3 and sum(1 for t in trampas if t[1]) >= 2:
            break
    trampas.sort(key=lambda t: t[1] is None)
    sc = suma_cifras(r)
    s = str(r)
    expl = {
        2: f"Por 2: la última cifra ha de ser par. {fmt(r)} acaba en {s[-1]}, que es par.",
        5: f"Por 5: ha de acabar en 0 o en 5. {fmt(r)} acaba en {s[-1]}.",
        10: f"Por 10: ha de acabar en 0. {fmt(r)} acaba en 0.",
        3: f"Por 3: la suma de las cifras ha de ser múltiplo de 3. {' + '.join(s)} = {sc}, que es múltiplo de 3.",
        9: f"Por 9: la suma de las cifras ha de ser múltiplo de 9. {' + '.join(s)} = {sc}, que es múltiplo de 9.",
        4: f"Por 4: las dos últimas cifras han de formar un múltiplo de 4. {s[-2:]} = 4 × {int(s[-2:]) // 4}.",
        25: f"Por 25: ha de acabar en 00, 25, 50 o 75. {fmt(r)} acaba en {s[-2:]}.",
        6: f"Por 6: ha de ser divisible por 2 y por 3 a la vez. Acaba en {s[-1]} (par) y sus cifras suman {sc} (múltiplo de 3).",
        11: (f"Por 11: (suma de cifras de lugar impar) − (suma de las de lugar par) ha de ser 0 o múltiplo de 11. "
             f"({' + '.join(s[::-1][0::2])}) − ({' + '.join(s[::-1][1::2])}) = {sum(int(c) for c in s[::-1][0::2]) - sum(int(c) for c in s[::-1][1::2])}."),
    }[k]
    return mk(f"¿Cuál de estos números es divisible por {k}?", fmt(r), "t2_criterio", {"k": k, "r": r, "tipo": "cual"}, trampas,
              [(f"criterio del {k}", fmt(r), expl + " Los demás no cumplen el criterio.")],
              {"basico": "Por 2 y por 5 y por 10 se mira la última cifra; por 3, la suma de TODAS las cifras. Mezclar los criterios es el error más habitual.",
               "avanzado": "Por 4: las dos últimas cifras; por 25: acaba en 00, 25, 50, 75; por 9: suma de cifras múltiplo de 9 (no basta de 3); por 6: "
                           "a la vez por 2 y por 3; por 11: diferencia entre cifras de lugar impar y par."}[grupo],
              datos={"opciones_fijas": True})


@generador("t2_divisores")
def gen_divisores(rng, d):
    """Todos los divisores de un número < 100. Claves: sin_pareja (se deja la pareja grande), no_divisor (incluye uno que no es),
    multiplos (mezcla divisores y múltiplos)."""
    pool = {1: [6, 8, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28], 2: [30, 32, 33, 34, 35, 36, 38, 39, 40, 42, 44, 45, 48, 50, 52, 54, 55, 56],
            3: [60, 63, 64, 66, 68, 70, 72, 75, 76, 78, 80, 81, 84, 88, 90, 91, 92, 95, 96, 98, 99]}[d]
    n = rng.choice(pool)
    ds = divisores(n)
    parejas = [(x, n // x) for x in ds if x * x <= n]
    tipo = "lista" if d < 3 or rng.random() < 0.6 else "cuantos"
    adulto = "Buscar los divisores por parejas (1 × 36, 2 × 18, 3 × 12…) hasta que se repiten evita olvidar alguno. El 1 y el propio número siempre están."
    pasos = [("parejas", ", ".join(f"{a} × {b}" for a, b in parejas), "Busco parejas de números que multiplicados den " + str(n) + ": "
              + ", ".join(f"{a} × {b}" for a, b in parejas) + ".")]
    pequenos = [a for a, _ in parejas]
    if tipo == "cuantos":
        pasos.append(("contar", str(len(ds)), f"Los divisores son {lista(ds)}: en total {len(ds)}."))
        return mk(f"¿Cuántos divisores tiene {n}?", str(len(ds)), "t2_divisores", {"n": n, "tipo": tipo},
                  [(str(len(pequenos)), "sin_pareja"), (str(len(ds) - 2), None), (str(len(ds) + 1), None)], pasos, adulto,
                  genericos=[str(len(ds) - 1), str(len(ds) + 2)])
    no = next((x for x in range(2, n) if n % x and x > ds[1]), n - 1)
    con_no = sorted(ds + [no])
    pasos.append(("lista", lista(ds), f"Ordenados: {lista(ds)}."))
    return mk(f"¿Cuáles son todos los divisores de {n}?", lista(ds), "t2_divisores", {"n": n, "tipo": tipo},
              [(lista(pequenos), "sin_pareja") if pequenos != ds else (None, None), (lista(con_no), "no_divisor"), (lista(ds + [2 * n, 3 * n]), "multiplos")],
              pasos, adulto, genericos=[lista(ds[:-1]), lista(ds[1:])])


PRIMOS_100 = [p for p in range(2, 100) if es_primo(p)]


@generador("t2_primos")
def gen_primos(rng, d):
    """Primos y compuestos. Claves: impar_primo (todo impar es primo), uno_primo, dos_no_primo, sin_2_3_5 (da por primo un número
    sin divisor 2, 3 ni 5: 49, 77, 91)."""
    tipo = rng.choice({1: ["cual", "es"], 2: ["cual", "es"], 3: ["es", "es", "cual"]}[d])
    adulto = ("Primo = exactamente dos divisores (1 y él mismo). El 1 no es primo ni compuesto; el 2 es el único primo par. Ser impar no basta: "
              "49 = 7 × 7, 77 = 7 × 11, 91 = 7 × 13.")
    tope = 30 if d == 1 else 100
    if tipo == "cual":
        p = rng.choice([x for x in PRIMOS_100 if x < tope])
        impares_comp = [x for x in range(9, tope, 2) if not es_primo(x) and x % 5 and x != 1]
        sin235 = [x for x in (49, 77, 91) if x < tope]
        dist = [("1", "uno_primo"), (fmt(rng.choice(impares_comp)), "impar_primo")]
        if sin235:
            dist.insert(0, (fmt(rng.choice(sin235)), "sin_2_3_5"))
        dist.append((fmt(rng.choice([x for x in range(4, tope) if not es_primo(x)])), None))
        return mk("¿Cuál de estos números es primo?", fmt(p), "t2_primo", {"p": p, "tipo": tipo}, dist,
                  [(f"divisores de {p}", f"1 y {p}", f"{p} solo es divisible entre 1 y entre {p}: tiene exactamente dos divisores, es primo. "
                                                     f"Los demás tienen más divisores (o, en el caso del 1, uno solo).")],
                  adulto, datos={"opciones_fijas": True})
    cand = [2, 1] + [49, 77, 91, 51, 57, 87, 39, 63, 27, 33, 21] + PRIMOS_100[3:]
    n = rng.choice(cand if d == 3 else [1, 2] + [x for x in range(3, 30 if d == 1 else 100) if x % 2])
    if n == 1:
        ok = "Ni primo ni compuesto: solo tiene un divisor"
        dist = [("Sí, es primo", "uno_primo"), ("No, es compuesto", None), ("Sí, porque es impar", "impar_primo")]
        texto = "El 1 solo tiene un divisor (él mismo). Los primos tienen exactamente dos, así que el 1 no es primo ni compuesto."
    elif es_primo(n):
        ok = f"Sí, solo tiene dos divisores: 1 y {n}"
        dist = [("No, porque es par", "dos_no_primo") if n == 2 else ("No, porque es impar", None),
                (f"No, porque {n} = {n} × 1", None), ("No, es compuesto", None)]
        texto = f"Pruebo a dividir {n} entre 2, 3, 5, 7…: ninguna división es exacta. Solo tiene los divisores 1 y {n}: es primo."
    else:
        f = factoriza(n)[0]
        ok = f"No, {n} = {f} × {n // f}"
        dist = [("Sí, porque es impar", "impar_primo") if n % 2 else ("Sí, porque es par", None),
                ("Sí, porque no es divisible por 2, 3 ni 5", "sin_2_3_5") if all(n % q for q in (2, 3, 5)) else (f"No, porque es divisible por 5", None),
                ("Sí, solo tiene dos divisores", None)]
        texto = f"Pruebo a dividir entre 2, 3, 5, 7…: {n} : {f} = {n // f} exacta. Tiene más de dos divisores: es compuesto."
    return mk(f"¿Es primo el número {n}?", ok, "t2_primo", {"n": n, "tipo": tipo}, dist, [(f"divisores de {n}", ok, texto)], adulto)


def _mcm(*xs):
    m = 1
    for x in xs:
        m = m * x // math.gcd(m, x)
    return m


def _mcd(*xs):
    g = 0
    for x in xs:
        g = math.gcd(g, x)
    return g


@generador("t2_mcm_listas")
def gen_mcm_listas(rng, d):
    """m.c.m. por listas de múltiplos. Claves: producto, mcd (da el m.c.d.), no_menor (múltiplo común no mínimo), cero."""
    for _ in range(500):
        if d == 3 and rng.random() < 0.5:
            xs = sorted(rng.sample(range(2, 13), 3))
        else:
            xs = sorted(rng.sample(range(2, 11 if d == 1 else 21), 2))
        m = _mcm(*xs)
        p = math.prod(xs)
        if m > 200 or m == max(xs) or (d > 1 and m == p and rng.random() < 0.7):
            continue
        break
    g = _mcd(*xs)
    txt = ", ".join(map(str, xs))
    pasos = [(f"múltiplos de {x}", ", ".join(str(x * i) for i in range(1, m // x + 1)), f"Múltiplos de {x}: " + ", ".join(str(x * i) for i in range(1, m // x + 1)) + "…")
             for x in xs]
    pasos.append(("primer común", str(m), f"El primero que aparece en todas las listas (sin contar el 0) es {m}."))
    return mk(f"Calcula el m.c.m.({txt}) escribiendo listas de múltiplos.", fmt(m), "t2_mcm", {"nums": xs}, [
        (p if p != m else None, "producto"), (g, "mcd"), (2 * m, "no_menor"), (0, "cero")], pasos,
        "El m.c.m. es el MENOR múltiplo común distinto de 0: siempre es mayor o igual que el mayor de los números. Multiplicarlos da un múltiplo común, "
        "pero muchas veces no el menor.", genericos=[m + max(xs), 3 * m])


@generador("t2_mcd_listas")
def gen_mcd_listas(rng, d):
    """m.c.d. por listas de divisores. Claves: no_mayor (divisor común que no es el mayor), mcm (da el m.c.m.), uno_o_menor."""
    for _ in range(500):
        a, b = sorted(rng.sample(range(4, 40 if d == 1 else 100), 2))
        g = math.gcd(a, b)
        if d == 3 and g < 6:
            continue
        if d < 3 and g == a and rng.random() < 0.7:
            continue
        if g == 1 and rng.random() < 0.8:
            continue
        break
    comunes = [x for x in divisores(g)]
    no_mayor = comunes[-2] if len(comunes) > 1 else None
    m = a * b // g
    pasos = [(f"divisores de {a}", lista(divisores(a)), f"Divisores de {a}: {lista(divisores(a))}."),
             (f"divisores de {b}", lista(divisores(b)), f"Divisores de {b}: {lista(divisores(b))}."),
             ("comunes", lista(comunes), f"Comunes: {lista(comunes)}. El mayor es {g}.")]
    return mk(f"Calcula el m.c.d.({a}, {b}) escribiendo las listas de divisores.", fmt(g), "t2_mcd", {"nums": [a, b]},
              [(no_mayor if no_mayor and no_mayor != 1 else None, "no_mayor"), (m, "mcm"), (1 if g != 1 else a, "uno_o_menor"), (a if g != a else None, "uno_o_menor")],
              pasos, "El m.c.d. es el MAYOR número que divide a los dos: nunca es mayor que el menor de ellos. Si solo comparten el 1, el m.c.d. es 1.",
              genericos=[g * 2, g + 1])


@generador("t2_factorizar")
def gen_factorizar(rng, d):
    """Descomposición en factores primos. Claves: factor_compuesto, exponente_mal, con_uno, division_mal."""
    primos = [2, 3, 5] if d == 1 else [2, 3, 5, 7] if d == 2 else [2, 3, 5, 7, 11, 13]
    lim = {1: (12, 100), 2: (100, 1000), 3: (1000, 9999)}[d]
    for _ in range(1000):
        c = Counter()
        n = 1
        for _ in range(rng.randint(3, 7)):
            p = rng.choice(primos)
            c[p] += 1
            n *= p
        if lim[0] <= n <= lim[1] and len(c) >= 2 and max(c.values()) >= 2 and (d < 3 or max(c) >= 7):
            break
    ok = ftxt_c(c)
    ps = sorted(c)
    # factor compuesto: juntar dos primos
    comp = Counter(c)
    if c[2] >= 2:
        comp[2] -= 2
        comp[4] += 1
    else:
        comp[ps[0]] -= 1
        comp[ps[1]] -= 1
        comp[ps[0] * ps[1]] += 1
    mal_exp = Counter(c)
    pe = max(c, key=lambda p: c[p])
    mal_exp[pe] += rng.choice([-1, 1]) if c[pe] > 1 else 1
    tipo = rng.choice(["descomponer", "descomponer", "cual"])
    enun = f"Descompón {fmt(n)} en factores primos." if tipo == "descomponer" else f"¿Cuál es la descomposición en factores primos de {fmt(n)}?"
    pasos, m = [], n
    for p in sorted(c.elements()):
        pasos.append((f"{fmt(m)} : {p}", fmt(m // p), f"{fmt(m)} : {p} = {fmt(m // p)}."))
        m //= p
    pasos.append(("potencias", ok, f"He dividido entre {' · '.join(str(p) for p in sorted(c.elements()))}. Agrupado con potencias: {fmt(n)} = {ok}."))
    return mk(enun, ok, "t2_factorizar", {"n": n}, [(ftxt_c(comp), "factor_compuesto"), (ftxt_c(mal_exp), "exponente_mal"), ("1 · " + ok, "con_uno")],
              pasos, "Se divide sucesivamente entre primos (2, 3, 5, 7, 11…) hasta llegar a 1. Si en el resultado queda un 4, un 6 o un 9, aún no está "
                     "terminado. El exponente es cuántas veces aparece cada primo.",
              genericos=[ftxt_c(Counter({**c, ps[-1]: c[ps[-1]] + 1}))])


@generador("t2_mcm_mcd_fact")
def gen_mcm_mcd_fact(rng, d):
    """m.c.m. y m.c.d. por factorización. Claves: intercambia (da el otro), exponente_mal (exponente equivocado), mcd_no_comunes
    (mete factores no comunes en el m.c.d.), olvida_no_comun (se deja un primo no común en el m.c.m.)."""
    primos = [2, 3, 5, 7] if d < 3 else [2, 3, 5, 7, 11]
    for _ in range(2000):
        k = 3 if d == 3 and rng.random() < 0.4 else 2
        cs = []
        for _ in range(k):
            c = Counter()
            for p in primos:
                e = rng.choice([0, 0, 1, 1, 2, 3] if p <= 3 else [0, 0, 1])
                if e:
                    c[p] = e
            cs.append(c)
        ns = [math.prod(p ** e for p, e in c.items()) for c in cs]
        lim = {1: (10, 200), 2: (40, 999), 3: (100, 9999)}[d]
        if not all(lim[0] <= n <= lim[1] for n in ns) or len(set(ns)) < k:
            continue
        if any(x != y and y % x == 0 for x in ns for y in ns):
            continue
        comunes = set.intersection(*[set(c) for c in cs])
        todos = set().union(*[set(c) for c in cs])
        if not comunes or comunes == todos:
            continue
        break
    M = Counter({p: max(c[p] for c in cs) for p in todos})
    G = Counter({p: min(c[p] for c in cs) for p in comunes})
    m, g = math.prod(p ** e for p, e in M.items()), math.prod(p ** e for p, e in G.items())
    que = rng.choice(["mcm", "mcd"])
    txt = ", ".join(fmt(n) for n in ns)
    pasos = [(fmt(n), ftxt_c(c), f"{fmt(n)} = {ftxt_c(c)}.") for n, c in zip(ns, cs)]
    if que == "mcm":
        no_comun = sorted(todos - comunes)[-1]
        olvida = m // (no_comun ** M[no_comun])
        Gmax = Counter({p: max(c[p] for c in cs) for p in comunes})
        pasos.append(("m.c.m.", fmt(m), f"m.c.m.: factores comunes y no comunes con el MAYOR exponente: {ftxt_c(M)} = {fmt(m)}."))
        dist = [(g, "intercambia"), (olvida, "olvida_no_comun"), (math.prod(p ** min(c[p] for c in cs if p in c) for p in todos), "exponente_mal"),
                (math.prod(p ** e for p, e in Gmax.items()), None)]
        enun = f"Calcula el m.c.m.({txt}) descomponiendo en factores primos."
        resp = m
    else:
        Gmax = Counter({p: max(c[p] for c in cs) for p in comunes})
        pasos.append(("m.c.d.", fmt(g), f"m.c.d.: solo los factores comunes con el MENOR exponente: {ftxt_c(G) or '1'} = {fmt(g)}."))
        dist = [(m, "intercambia"), (math.prod(p ** e for p, e in Gmax.items()), "exponente_mal"),
                (g * math.prod(p ** min(c[p] for c in cs if p in c) for p in todos - comunes), "mcd_no_comunes")]
        enun = f"Calcula el m.c.d.({txt}) descomponiendo en factores primos."
        resp = g
    return mk(enun, fmt(resp), "t2_mcmmcd", {"nums": ns, "que": que}, dist, pasos,
              "m.c.m.: comunes y no comunes con el mayor exponente (sale grande, múltiplo de todos). m.c.d.: solo comunes con el menor exponente "
              "(sale pequeño, divide a todos). Comprobar que el m.c.m. es divisible por cada número detecta casi todos los errores.",
              genericos=[resp * 2, resp + 2])


# ================================================================ NÚMEROS ENTEROS

def sg(n):
    """Entero con signo explícito sin paréntesis: +5, −3, 0."""
    return "0" if n == 0 else ("+" if n > 0 else "−") + fmt(abs(n))


@generador("t2_ent_contexto")
def gen_ent_contexto(rng, d):
    """Enteros en contextos. Claves: signo_contexto (signo cambiado), cero_con_signo (0 positivo o negativo),
    pierde_positivo (traduce pierde/baja/debe como positivo)."""
    tipo = rng.choice({1: ["temp", "planta"], 2: ["dinero", "altitud", "temp", "planta"], 3: ["anio", "leer", "cero", "dinero", "altitud"]}[d])
    adulto = ("Por encima de un punto de referencia (0 °C, planta baja, nivel del mar, tener dinero) → positivo; por debajo o en contra "
              "(bajo cero, sótanos, deber, perder) → negativo. El 0 es la referencia: ni positivo ni negativo.")
    n = rng.randint(1, 15 if d == 1 else 100)
    if tipo == "cero":
        ref = rng.choice(["la planta baja de un edificio", "el nivel del mar", "una temperatura de 0 °C", "no tener ni deber dinero"])
        return mk(f"¿Qué número entero representa {ref} y de qué signo es?", "0, que no es ni positivo ni negativo", "t2_ent_ctx", {"tipo": tipo},
                  [("0, que es positivo", "cero_con_signo"), ("0, que es negativo", "cero_con_signo"), ("+1, que es positivo", None)],
                  [("referencia", "0", f"{ref[0].upper() + ref[1:]} es el punto de referencia: se representa con el 0, que no es positivo ni negativo.")], adulto)
    if tipo == "leer":
        k = rng.randint(1, 5)
        return mk(f"En el ascensor de un edificio, ¿qué significa el botón −{k}?", f"{k} planta{'s' if k > 1 else ''} por debajo de la planta baja", "t2_ent_ctx",
                  {"tipo": tipo, "n": -k},
                  [(f"{k} planta{'s' if k > 1 else ''} por encima de la planta baja", "signo_contexto"), (f"La planta {k}.ª", "signo_contexto"),
                   (f"{k} plantas menos que el último piso", None)],
                  [("signo −", f"−{k}", f"El signo − indica por debajo de la planta baja (que es el 0): el −{k} está {k} planta{'s' if k > 1 else ''} por debajo.")], adulto)
    ctx = {
        "temp": [(f"Un termómetro marca {min(n, 40)} grados bajo cero.", -min(n, 40), "signo_contexto"),
                 (f"Un termómetro marca {min(n, 45)} grados sobre cero.", min(n, 45), "signo_contexto")],
        "planta": [(f"Aparcamos el coche en el sótano {n if n < 6 else n % 5 + 1}.", -(n if n < 6 else n % 5 + 1), "signo_contexto"),
                   (f"Vivo en la {n if n < 20 else 12}.ª planta sobre la planta baja.", n if n < 20 else 12, "signo_contexto")],
        "dinero": [(f"{rng.choice(NOMBRES)} debe {n} € a su hermana.", -n, "pierde_positivo"), (f"{rng.choice(NOMBRES)} pierde {n} € jugando.", -n, "pierde_positivo"),
                   (f"{rng.choice(NOMBRES)} gana {n} € vendiendo limonada.", n, "signo_contexto")],
        "altitud": [(f"Un submarino navega a {n * 10} m bajo el nivel del mar.", -n * 10, "signo_contexto"),
                    (f"Un pueblo está a {n * 10} m sobre el nivel del mar.", n * 10, "signo_contexto"),
                    (f"Un buceador baja a {n} m de profundidad.", -n, "pierde_positivo")],
        "anio": [(f"Una ciudad se fundó en el año {n * 10} antes de Cristo.", -n * 10, "signo_contexto"),
                 (f"Un castillo se construyó en el año {n * 10 + 1000} después de Cristo.", n * 10 + 1000, "signo_contexto")],
    }[tipo]
    frase, v, clave = rng.choice(ctx)
    return mk(f"{frase} ¿Qué número entero lo representa?", sg(v), "t2_ent_ctx", {"tipo": tipo, "n": v},
              [(sg(-v), clave), (sg(v + (1 if v > 0 else -1)), None), (sg(-v - (1 if v < 0 else -1)), None)],
              [("signo", sg(v), f"{'Está por encima o a favor de la referencia (0): es positivo' if v > 0 else 'Está por debajo o en contra de la referencia (0): es negativo'}, "
                                f"así que se escribe {sg(v)}.")], adulto)


@generador("t2_ent_recta")
def gen_ent_recta(rng, d):
    """Enteros en la recta numérica (descrita con palabras). Claves: lado_contrario (negativos a la derecha),
    cuenta_desde_uno (cuenta una marca de más), ignora_escala."""
    esc = 1 if d == 1 else rng.choice([2, 5]) if d == 2 else rng.choice([5, 10, 2])
    k = rng.randint(1, 9 if d == 1 else 5)
    lado = "izquierda" if rng.random() < 0.75 else "derecha"
    v = -k * esc if lado == "izquierda" else k * esc
    adulto = ("En la recta los negativos están a la izquierda del 0 y cada marca vale lo que diga la escala. Que cuente saltos (no marcas) "
              "desde el 0 y los multiplique por la escala.")
    if d == 3 and rng.random() < 0.5:
        a = rng.randint(-4, 2) * esc
        k2 = rng.randint(2, 5)
        v2 = a - k2 * esc
        return mk(f"En una recta numérica graduada de {esc} en {esc}, ¿qué número está {k2} marcas a la izquierda del {fmt(a)}?", fmt(v2), "t2_ent_recta",
                  {"esc": esc, "desde": a, "marcas": -k2},
                  [(fmt(a + k2 * esc), "lado_contrario"), (fmt(a - (k2 + 1) * esc), "cuenta_desde_uno"), (fmt(a - k2), "ignora_escala") if esc > 1 else (None, None)],
                  [("saltos", f"{k2} × {esc}", f"Cada marca vale {esc}. {k2} marcas a la izquierda es restar {k2} × {esc} = {k2 * esc}."),
                   (f"{fmt(a)} − {k2 * esc}", fmt(v2), f"Desde el {fmt(a)}, bajando {k2 * esc}, llego al {fmt(v2)}.")], adulto,
                  genericos=[fmt(v2 - esc), fmt(v2 + 2 * esc)])
    dist = [(fmt(-v), "lado_contrario"), (fmt(v + (esc if v > 0 else -esc)), "cuenta_desde_uno")]
    if esc > 1:
        dist.append((fmt(k if v > 0 else -k), "ignora_escala"))
    return mk(f"En una recta numérica graduada de {esc} en {esc}, ¿qué número señala una flecha {k} marca{'s' if k > 1 else ''} a la {lado} del 0?", fmt(v),
              "t2_ent_recta", {"esc": esc, "marcas": k if lado == "derecha" else -k}, dist,
              [("escala", str(esc), f"Cada marca vale {esc}."),
               ("posición", fmt(v), f"{k} marca{'s' if k > 1 else ''} a la {lado} del 0 son {k} × {esc} = {k * esc} {'hacia los negativos' if lado == 'izquierda' else 'hacia los positivos'}: {fmt(v)}.")],
              adulto, genericos=[fmt(v - esc), fmt(v + 2 * esc), fmt(2 * v)])


@generador("t2_ent_comparar")
def gen_ent_comparar(rng, d):
    """Comparar y ordenar enteros. Claves: valor_sin_signo (compara negativos por su valor absoluto), cero_menor (pone el 0 como el
    más pequeño), orden_invertido."""
    R = {1: 20, 2: 100, 3: 1000}[d]
    if d == 1 or (d == 2 and rng.random() < 0.3):
        a = -rng.randint(1, R)
        b = -rng.randint(1, R) if rng.random() < 0.6 else rng.randint(0, R)
        while b == a:
            b = a + 1 if a + 1 != 0 else a - 1
        menor, mayor = min(a, b), max(a, b)
        ok = f"{fmt(menor)} < {fmt(mayor)}"
        return mk(f"¿Qué comparación es correcta entre {fmt(a)} y {fmt(b)}?", ok, "t2_ent_comp", {"a": a, "b": b},
                  [(f"{fmt(menor)} > {fmt(mayor)}", "valor_sin_signo"), (f"{fmt(mayor)} < {fmt(menor)}", "valor_sin_signo"), (f"{fmt(menor)} = {fmt(mayor)}", None)],
                  [("recta", ok, f"En la recta, {fmt(menor)} está más a la izquierda que {fmt(mayor)}, así que es menor: {ok}. "
                                 + ("Entre dos negativos es mayor el que está más cerca del 0." if mayor < 0 else ""))],
                  "Cualquier negativo es menor que 0 y que cualquier positivo; entre negativos, es mayor el que está más cerca del 0 (−3 > −8). "
                  "Pensar en temperaturas ayuda: −3 °C es más calor que −8 °C.")
    n = 4 if d == 2 else rng.choice([5, 6])
    xs = set()
    xs.add(0 if rng.random() < 0.7 else rng.randint(1, R))
    while len(xs) < n:
        x = rng.randint(-R, R)
        xs.add(x)
    xs = list(xs)
    if sum(1 for x in xs if x < 0) < 2:
        xs[0] = -abs(xs[0]) - 1 if xs[0] != 0 else xs[0]
        xs[-1] = -abs(xs[-1]) - 2
        xs = list(dict.fromkeys(xs))
    rng.shuffle(xs)
    desc = d == 3 and rng.random() < 0.5
    ok_l = sorted(xs, reverse=desc)
    signo = " > " if desc else " < "
    negs = sorted([x for x in xs if x < 0], key=abs, reverse=desc)
    pos = sorted([x for x in xs if x >= 0], reverse=desc)
    mal1 = (pos + negs if desc else negs + pos) if negs != sorted([x for x in xs if x < 0], reverse=desc) else None
    cero = [0] + [x for x in ok_l if x != 0] if not desc else [x for x in ok_l if x != 0] + [0]
    mal2 = cero if 0 in xs and cero != ok_l else None
    inv = list(reversed(ok_l))
    orden = "de mayor a menor" if desc else "de menor a mayor"
    return mk(f"Ordena {orden}: {', '.join(fmt(x) for x in xs)}", signo.join(fmt(x) for x in ok_l), "t2_ent_orden", {"nums": xs, "desc": desc},
              [(signo.join(fmt(x) for x in mal1), "valor_sin_signo") if mal1 else (None, None),
               (signo.join(fmt(x) for x in mal2), "cero_menor") if mal2 else (None, None),
               (signo.join(fmt(x) for x in inv), "orden_invertido")],
              [("negativos", ", ".join(fmt(x) for x in sorted([x for x in xs if x < 0])), "Primero los negativos: el que tiene más valor absoluto es el menor."),
               ("orden", signo.join(fmt(x) for x in ok_l), f"Después el 0 y los positivos. {orden.capitalize()}: {signo.join(fmt(x) for x in ok_l)}.")],
              "Cualquier negativo es menor que 0 y que cualquier positivo; entre negativos, es mayor el que está más cerca del 0. "
              "Situarlos en una recta dibujada evita casi todos los errores.",
              genericos=[signo.join(fmt(x) for x in sorted(xs, key=abs))], datos=None)


@generador("t2_ent_abs")
def gen_ent_abs(rng, d):
    """Opuesto y valor absoluto. Claves: abs_cambia_signo (|7| = −7), menos_abs (confunde −|a| con |−a|), solo_uno (da un solo número)."""
    R = {1: 20, 2: 100, 3: 1000}[d]
    tipo = rng.choice({1: ["abs", "op", "abs_pos"], 2: ["suma_abs", "menos_abs", "dos", "abs_pos"], 3: ["mixta", "menos_abs", "dos"]}[d])
    a = rng.randint(2, R)
    adulto = ("El valor absoluto es la distancia al 0: siempre positiva (o 0). El opuesto cambia el signo. −|−5| es 'el opuesto del valor absoluto de −5' = −5, "
              "y dos números (a y −a) tienen el mismo valor absoluto.")
    if tipo in ("abs", "abs_pos"):
        x = -a if tipo == "abs" else a
        enun = f"Calcula: |{fmt(x)}|" if x < 0 else f"¿Cuál es el valor absoluto de {fmt(x)}?"
        return mk(enun, fmt(a), "t2_ent_abs", {"tipo": tipo, "x": x},
                  [(fmt(-a), "abs_cambia_signo"), (fmt(a + 1), None), ("0", None)],
                  [(f"|{fmt(x)}|", fmt(a), f"El valor absoluto es la distancia de {fmt(x)} al 0, que es {fmt(a)}. Siempre sale positivo.")], adulto)
    if tipo == "op":
        x = rng.choice([-a, a])
        return mk(f"¿Cuál es el opuesto de {fmt(x)}?", fmt(-x), "t2_ent_abs", {"tipo": tipo, "x": x},
                  [(fmt(x), None), ("0", None)],
                  [("opuesto", fmt(-x), f"El opuesto está a la misma distancia del 0 pero al otro lado: el opuesto de {fmt(x)} es {fmt(-x)}.")], adulto,
                  genericos=[fmt(-x - 1), fmt(2 * x)])
    if tipo == "menos_abs":
        return mk(f"Calcula: −|−{fmt(a)}|", fmt(-a), "t2_ent_abs", {"tipo": tipo, "x": -a},
                  [(fmt(a), "menos_abs"), ("0", None), (fmt(-a - 1), None)],
                  [(f"|−{fmt(a)}|", fmt(a), f"Primero el valor absoluto: |−{fmt(a)}| = {fmt(a)}."),
                   (f"−{fmt(a)}", fmt(-a), f"El signo − de fuera da el opuesto: −{fmt(a)}.")], adulto)
    if tipo == "dos":
        return mk(f"¿Qué números enteros tienen valor absoluto {fmt(a)}?", f"{fmt(a)} y {fmt(-a)}", "t2_ent_abs", {"tipo": tipo, "x": a},
                  [(f"Solo el {fmt(a)}", "solo_uno"), (f"Solo el {fmt(-a)}", "solo_uno"), (f"{fmt(a)} y 0", None)],
                  [("distancia", f"±{fmt(a)}", f"Hay dos números a distancia {fmt(a)} del 0: uno a la derecha ({fmt(a)}) y otro a la izquierda ({fmt(-a)}).")], adulto)
    b = rng.randint(2, min(R, 50))
    if tipo == "suma_abs":
        x, y = -a, b if rng.random() < 0.5 else -b
        v = abs(x) + abs(y)
        return mk(f"Calcula: |{fmt(x)}| + |{fmt(y)}|", fmt(v), "t2_ent_abs", {"tipo": tipo, "x": x, "y": y},
                  [(fmt(x + y) if x + y != v else None, "abs_cambia_signo"), (fmt(-v), "abs_cambia_signo"), (fmt(abs(abs(x) - abs(y))), None)],
                  [(f"|{fmt(x)}| y |{fmt(y)}|", f"{fmt(abs(x))} y {fmt(abs(y))}", f"|{fmt(x)}| = {fmt(abs(x))} y |{fmt(y)}| = {fmt(abs(y))}."),
                   (f"{fmt(abs(x))} + {fmt(abs(y))}", fmt(v), f"{fmt(abs(x))} + {fmt(abs(y))} = {fmt(v)}.")], adulto)
    # mixta: −|−a| + |b − c|
    a = rng.randint(2, 20)
    b, c = rng.randint(1, 15), rng.randint(1, 15)
    while b == c:
        c += 1
    v = -a + abs(b - c)
    return mk(f"Calcula: −|−{a}| + |{b} − {c}|", fmt(v), "t2_ent_abs", {"tipo": tipo},
              [(fmt(a + abs(b - c)), "menos_abs"), (fmt(-a + (b - c)) if b < c else fmt(-a - abs(b - c)), "abs_cambia_signo"), (fmt(v + 1), None)],
              [(f"−|−{a}|", fmt(-a), f"|−{a}| = {a}, y con el − de delante queda −{a}."),
               (f"|{b} − {c}|", fmt(abs(b - c)), f"{b} − {c} = {fmt(b - c)} y su valor absoluto es {abs(b - c)}."),
               (f"−{a} + {abs(b - c)}", fmt(v), f"−{a} + {abs(b - c)} = {fmt(v)}.")], adulto)


@generador("t2_ent_variacion")
def gen_ent_variacion(rng, d):
    """Subir y bajar con enteros en contexto. Claves: resta_sin_cero (diferencia restando los números sin signo), sentido_contrario,
    cuenta_salida (cuenta el punto de partida como un salto)."""
    ctx = rng.choice(["temp", "planta", "saldo"])
    tipo = rng.choice({1: ["mover"], 2: ["mover", "diferencia"], 3: ["diferencia", "mover"]}[d])
    R = 10 if d == 1 else 20
    ud = {"temp": " °C", "planta": "", "saldo": " €"}[ctx]
    adulto = ("Con la recta o el termómetro delante: subir es ir a la derecha (o arriba) y bajar a la izquierda. Para la diferencia entre un negativo y "
              "un positivo, se cuenta hasta el 0 y desde el 0: de −4 a 9 hay 4 + 9 = 13.")
    if tipo == "mover":
        a = rng.randint(-R, R // 2)
        k = rng.randint(2, R)
        sube = rng.random() < 0.6
        v = a + k if sube else a - k
        if abs(v) > 20:
            v = a + k if not sube else a - k
            sube = not sube
        frase = {"temp": (f"A las 8 h la temperatura es de {fmt(a)} °C y {'sube' if sube else 'baja'} {k} grados. ¿Qué temperatura hace ahora?"),
                 "planta": (f"Un ascensor está en la planta {fmt(a)} y {'sube' if sube else 'baja'} {k} plantas. ¿En qué planta está ahora?"),
                 "saldo": (f"El saldo de una cuenta es de {fmt(a)} € y {'ingresan' if sube else 'se cobran'} {k} €. ¿Cuál es el saldo ahora?")}[ctx]
        return mk(frase, fmt(v) + ud, "t2_ent_var", {"a": a, "k": k if sube else -k},
                  [(fmt(a - k if sube else a + k) + ud, "sentido_contrario"), (fmt(v - 1 if sube else v + 1) + ud, "cuenta_salida"),
                   (fmt(-v) + ud if v != 0 else "1" + ud, None)],
                  [("recta", fmt(v), f"Parto del {fmt(a)} y {'subo' if sube else 'bajo'} {k}: {fmt(a)} {'+' if sube else '−'} {k} = {fmt(v)}. "
                                     f"Cuento los saltos, no el punto de partida.")], adulto,
                  genericos=[fmt(v + 2) + ud, fmt(v - 2) + ud])
    a = -rng.randint(1, R)
    b = rng.randint(1, R)
    if rng.random() < 0.3:
        a, b = -rng.randint(R // 2, R), -rng.randint(1, R // 2 - 1 if R > 4 else 1)
    v = b - a
    frase = {"temp": f"A las 6 h el termómetro marcaba {fmt(a)} °C y a mediodía, {fmt(b)} °C. ¿Cuánto ha aumentado la temperatura?",
             "planta": f"Un ascensor sube desde la planta {fmt(a)} hasta la planta {fmt(b)}. ¿Cuántas plantas ha subido?",
             "saldo": f"Una cuenta pasa de un saldo de {fmt(a)} € a {fmt(b)} €. ¿Cuántos euros ha aumentado?"}[ctx]
    mal = abs(b) - abs(a) if b > 0 else abs(a) + abs(b)
    return mk(frase, fmt(v), "t2_ent_var", {"a": a, "b": b},
              [(fmt(abs(mal)) if abs(mal) != v else None, "resta_sin_cero"), (fmt(v + 1), "cuenta_salida"), (fmt(-v), None)],
              [("hasta el 0", str(abs(a)), f"Desde {fmt(a)} hasta 0 hay {abs(a)}." if b > 0 else f"Desde {fmt(a)} hasta {fmt(b)} hay {v} saltos."),
               ("desde el 0", fmt(v), f"Desde 0 hasta {fmt(b)} hay {b}: en total {abs(a)} + {b} = {v}." if b > 0 else f"En total {v}.")], adulto,
              genericos=[fmt(v - 1), fmt(v + 2)])


@generador("t2_ent_suma")
def gen_ent_suma(rng, d, op="suma"):
    """Suma y resta de dos enteros con paréntesis. suma: claves regla_producto ((−5)+(−3)=+8), suma_abs (suma valores absolutos con
    signos distintos), signo_primero (signo del primero). resta: no_cambia (no cambia el signo del sustraendo), cambia_ambos,
    resta_al_reves (3 − 8 = 5)."""
    R = {1: 20, 2: 100, 3: 1000}[d]
    for _ in range(200):
        a, b = rng.randint(-R, R), rng.randint(-R, R)
        if a == 0 or b == 0 or abs(a) == abs(b):
            continue
        if op == "suma" and a > 0 and b > 0:
            continue
        if op == "resta" and a > 0 and b > 0 and a > b:
            continue
        break
    adulto_s = ("Mismo signo: se suman los valores absolutos y se deja el signo. Distinto signo: se restan y se pone el signo del que tiene "
                "mayor valor absoluto. La regla 'menos por menos, más' es de multiplicar, no de sumar.")
    if op == "suma":
        v = a + b
        dist = []
        if a < 0 and b < 0:
            dist.append((abs(v), "regla_producto"))
        else:
            big = a if abs(a) > abs(b) else b
            dist.append(((abs(a) + abs(b)) * (1 if big > 0 else -1), "suma_abs"))
            if (a > 0) != (v > 0) and v != 0:
                dist.append((abs(v) * (1 if a > 0 else -1), "signo_primero"))
            dist.append((-(abs(a) + abs(b)) * (1 if big > 0 else -1), None))
        dist += [(-v, None), (a - b, None)]
        if a * b > 0:
            txt = f"Mismo signo: sumo {fmt(abs(a))} + {fmt(abs(b))} = {fmt(abs(v))} y dejo el signo −: {fmt(v)}."
        else:
            txt = (f"Distinto signo: resto los valores absolutos, {fmt(max(abs(a), abs(b)))} − {fmt(min(abs(a), abs(b)))} = {fmt(abs(v))}, y pongo el signo del "
                   f"que tiene mayor valor absoluto ({z(a if abs(a) > abs(b) else b)}): {fmt(v)}.")
        return mk(f"Calcula: {z(a)} + {z(b)}", fmt(v), "ent_suma", {"a": a, "b": b}, dist, [(f"{z(a)} + {z(b)}", fmt(v), txt)], adulto_s,
                  genericos=[v + 1, v - 1, v + 10])
    v = a - b
    dist = [(a + b, "no_cambia"), (-a - b, "cambia_ambos")]
    if a > 0 and b > 0 and a < b:
        dist.insert(0, (b - a, "resta_al_reves"))
    dist += [(-v, None)]
    txt1 = f"Restar es sumar el opuesto: {z(a)} − {z(b)} = {z(a)} + {z(-b)}."
    txt2 = f"{z(a)} + {z(-b)} = {fmt(v)}."
    return mk(f"Calcula: {z(a)} − {z(b)}", fmt(v), "ent_resta", {"a": a, "b": b}, dist,
              [(f"{z(a)} + {z(-b)}", f"{z(a)} + {z(-b)}", txt1), (f"{z(a)} + {z(-b)}", fmt(v), txt2)],
              "Restar un entero es sumar su opuesto: solo cambia el signo del segundo, nunca el del primero. Restar un negativo es sumar: "
              "(−7) − (−12) = −7 + 12 = 5.", genericos=[v + 1, v - 1, v + 10])


def _sumas_expr(rng, d):
    """Expresión de sumas y restas de enteros con paréntesis de un nivel. Devuelve lista de términos (signo, contenido) donde
    contenido es int o lista de ints (paréntesis)."""
    R = 20 if d == 1 else 50 if d == 2 else 100
    n = {1: 3, 2: rng.choice([4, 5]), 3: rng.choice([5, 6])}[d]
    terms = []
    for i in range(n):
        s = "+" if i == 0 else rng.choice(["+", "−"])
        if i > 0 and rng.random() < 0.45:
            g = [rng.randint(-R, R) or 3 for _ in range(2 if d < 3 else rng.choice([2, 3]))]
            terms.append((s, g))
        else:
            terms.append((s, rng.randint(-R, R) or 5))
    if not any(isinstance(c, list) and s == "−" for s, c in terms):
        terms[-1] = ("−", [rng.randint(1, R), -rng.randint(1, R)])
    return terms


def _texto_sumas(terms):
    out = []
    for i, (s, c) in enumerate(terms):
        if isinstance(c, list):
            inner = fmt(c[0]) + "".join(f" {'+' if x > 0 else '−'} {fmt(abs(x))}" for x in c[1:])
            t = f"({inner})"
        else:
            t = fmt(c) if i == 0 else f"({fmt(c)})" if c < 0 else fmt(c)
        out.append(t if i == 0 else f"{s} {t}")
    return " ".join(out)


def _eval_sumas(terms, modo="ok"):
    tot = 0
    for s, c in terms:
        sig = 1 if s == "+" else -1
        if isinstance(c, list):
            if modo == "e01" and sig < 0:
                tot += -c[0] + sum(c[1:])
            elif modo == "e02" and sig < 0:
                tot += sum(c)
            else:
                tot += sig * sum(c)
        else:
            tot += sig * c
    return tot


@generador("t2_ent_cadena")
def gen_ent_cadena(rng, d):
    """Sumas y restas encadenadas de enteros con paréntesis. Claves: solo_primero (un − delante del paréntesis solo cambia el primer
    término), pierde_signo (no cambia ningún signo al quitar el paréntesis), agrupa_mal (se deja un término al agrupar)."""
    for _ in range(100):
        terms = _sumas_expr(rng, d)
        v = _eval_sumas(terms)
        e1, e2 = _eval_sumas(terms, "e01"), _eval_sumas(terms, "e02")
        if e1 != v and e2 != v and e1 != e2:
            break
    expr = _texto_sumas(terms)
    # términos sin paréntesis
    planos = []
    for s, c in terms:
        sig = 1 if s == "+" else -1
        for x in (c if isinstance(c, list) else [c]):
            planos.append(sig * x)
    pos = [x for x in planos if x > 0]
    neg = [x for x in planos if x < 0]
    olvido = v - planos[-1]
    plano_txt = " ".join(("+ " if x > 0 else "− ") + fmt(abs(x)) for x in planos)
    plano_txt = plano_txt[2:] if plano_txt.startswith("+ ") else "−" + plano_txt[2:]
    return mk(f"Calcula: {expr}", fmt(v), "jerarquia", {"expresion": expr}, [(e1, "solo_primero"), (e2, "pierde_signo"), (olvido, "agrupa_mal")],
              [("quitar paréntesis", plano_txt,
                "Quito los paréntesis: si delante hay un −, cambian de signo TODOS los términos de dentro. Queda " + plano_txt + "."),
               ("agrupar", f"{fmt(sum(pos))} y {fmt(sum(neg))}", f"Sumo los positivos ({fmt(sum(pos))}) y los negativos ({fmt(sum(neg))})."),
               ("total", fmt(v), f"{fmt(sum(pos))} {'−' if sum(neg) < 0 else '+'} {fmt(abs(sum(neg)))} = {fmt(v)}.")],
              "Un − delante de un paréntesis cambia el signo de todo lo de dentro, no solo del primero. Otra opción segura: resolver primero "
              "el paréntesis y luego restar el resultado.", genericos=[v + 1, v - 1, -v])


@generador("t2_ent_mult")
def gen_ent_mult(rng, d):
    """Producto y cociente de enteros. Claves: regla_suma (aplica la regla de la suma: (−4)·(+3) = −1 o (−4)·(−3) = −12),
    cuenta_negativos (recuento de negativos mal), signo_primero."""
    R = {1: 12, 2: 100, 3: 12}[d]
    if d == 3 or (d == 2 and rng.random() < 0.3):
        n = 3 if d == 2 else rng.choice([3, 4])
        fs = [rng.choice([-1, 1]) * rng.randint(1, 9 if d == 3 else 6) for _ in range(n)]
        if sum(1 for f in fs if f < 0) < 2:
            fs[0] = -abs(fs[0])
            fs[1] = -abs(fs[1])
        v = math.prod(fs)
        expr = " · ".join(z(f) for f in fs)
        nneg = sum(1 for f in fs if f < 0)
        return mk(f"Calcula: {expr}", fmt(v), "t2_ent_prod", {"factores": fs},
                  [(-v, "cuenta_negativos"), (abs(v) * (1 if fs[0] > 0 else -1) if (v > 0) != (fs[0] > 0) else None, "signo_primero"), (sum(fs), "regla_suma"),
                   (v * 2, None)],
                  [("valores absolutos", fmt(abs(v)), f"Multiplico sin signos: {' · '.join(fmt(abs(f)) for f in fs)} = {fmt(abs(v))}."),
                   ("signo", fmt(v), f"Hay {nneg} factor{'es' if nneg > 1 else ''} negativo{'s' if nneg > 1 else ''}: "
                                     f"{'número par → positivo' if nneg % 2 == 0 else 'número impar → negativo'}. Resultado: {fmt(v)}.")],
                  "Signos iguales dan +, distintos dan −. Con varios factores basta contar los negativos: par → positivo, impar → negativo.",
                  genericos=[v + 1, v - 1])
    div = rng.random() < 0.45
    a = rng.choice([-1, 1]) * rng.randint(2, R if d == 2 else 12)
    b = rng.choice([-1, 1]) * rng.randint(2, 12)
    if a > 0 and b > 0:
        a = -a
    if div:
        D = a * b
        v = a
        expr = f"{z(D)} : {z(b)}"
        dist = [(-v, "signo_primero" if b < 0 else None), (D * b if abs(D * b) < 10000 else v + 1, None)]
        return mk(f"Calcula: {expr}", fmt(v), "ent_div", {"a": D, "b": b}, dist,
                  [(f"{fmt(abs(D))} : {abs(b)}", fmt(abs(v)), f"Divido sin signos: {fmt(abs(D))} : {abs(b)} = {abs(v)}."),
                   ("signo", fmt(v), f"Signos {'iguales → +' if D * b > 0 else 'distintos → −'}: {fmt(v)}.")],
                  "Para dividir se usa la misma regla de los signos que para multiplicar: iguales +, distintos −.", genericos=[v + 1, v - 1, 2 * v])
    v = a * b
    if a < 0 and b < 0:
        rs = -(abs(v))
    else:
        rs = abs(v) * (1 if (a if abs(a) > abs(b) else b) > 0 else -1)
    dist = [(rs if rs != v else None, "regla_suma"), (a + b, "regla_suma"), (abs(v) * (1 if a > 0 else -1) if (v > 0) != (a > 0) else None, "signo_primero"), (-v, None)]
    return mk(f"Calcula: {z(a)} · {z(b)}", fmt(v), "ent_mult", {"a": a, "b": b}, dist,
              [(f"{abs(a)} · {abs(b)}", fmt(abs(v)), f"Multiplico sin signos: {abs(a)} · {abs(b)} = {fmt(abs(v))}."),
               ("signo", fmt(v), f"Signos {'iguales → +' if a * b > 0 else 'distintos → −'}: {fmt(v)}.")],
              "Signos iguales dan +, distintos dan −. La regla de la suma (se pone el signo del mayor) no sirve para multiplicar.",
              genericos=[v + 1, v - 1, v + 10])


# ================================================================ JERARQUÍA CON POTENCIAS Y RAÍCES (naturales)

from .jerarquia import ev_lista as _ev_lista, texto as _texto, pasos_explicacion as _pasos_jer  # noqa: E402

CUADRADOS = [4, 9, 16, 25, 36, 49, 64, 81, 100]


def _mapa(toks, f):
    """Aplica f a cada operando (recursivo en grupos); f devuelve el operando transformado."""
    out = []
    for t in toks:
        if isinstance(t, tuple) and t[0] == "grupo":
            t = ("grupo", _mapa(t[1], f), t[2])
        out.append(f(t) if not isinstance(t, str) else t)
    return out


def _olvida(toks):
    def f(t):
        if isinstance(t, tuple) and t[0] == "pot":
            return t[1]
        if isinstance(t, tuple) and t[0] == "raiz":
            return t[1]
        return t
    return _mapa(toks, f)


def _raiz_suma(toks):
    def f(t):
        if isinstance(t, tuple) and t[0] == "raiz" and isinstance(t[1], tuple) and t[1][0] == "grupo":
            g = t[1][1]
            if len(g) == 3 and all(isinstance(x, int) and int(x ** 0.5) ** 2 == x for x in (g[0], g[2])):
                return ("grupo", [("raiz", g[0]), g[1], ("raiz", g[2])], "()")
        return t
    return _mapa(toks, f)


def _op_antes_pot(toks):
    """a + b^n → (a + b)^n ; a · b^n → (a · b)^n (primera aparición, nivel superior o dentro de grupos)."""
    out = list(toks)
    for i in range(0, len(out) - 2, 2):
        if isinstance(out[i], int) and out[i + 1] in (SUM, MUL) and isinstance(out[i + 2], tuple) and out[i + 2][0] == "pot" and isinstance(out[i + 2][1], int):
            nuevo = ("pot", ("grupo", [out[i], out[i + 1], out[i + 2][1]], "()"), out[i + 2][2])
            return out[:i] + [nuevo] + out[i + 3:]
    for i, t in enumerate(out):
        if isinstance(t, tuple) and t[0] == "grupo":
            g = _op_antes_pot(t[1])
            if g != t[1]:
                return out[:i] + [("grupo", g, t[2])] + out[i + 1:]
    return toks


def _valor(toks, modo="ok"):
    try:
        v = _ev_lista(toks, modo)
        if v.denominator == 1 and v >= 0:
            return int(v)
    except (ZeroDivisionError, ValueError, TypeError):
        pass
    return None


def _natural_todo(toks):
    """Comprueba que todos los resultados parciales (grupos, potencias, raíces, operaciones) sean naturales."""
    def ok_operando(t):
        if isinstance(t, int):
            return True
        if t[0] == "grupo":
            return ok_lista(t[1])
        if t[0] == "pot":
            return ok_operando(t[1])
        if t[0] == "raiz":
            return ok_operando(t[1]) and _valor([t]) is not None
        return False

    def ok_lista(ts):
        if not all(ok_operando(t) for t in ts[0::2]):
            return False
        pasos = []
        try:
            v = _ev_lista(ts, "ok", pasos)
        except (ZeroDivisionError, ValueError):
            return False
        return v >= 0 and v.denominator == 1 and all(r >= 0 and r.denominator == 1 for *_, r in pasos)
    return ok_lista(toks)


@generador("t2_jerarq_pot")
def gen_jerarq_pot(rng, d):
    """Jerarquía con potencias y raíces (naturales). Claves: op_antes_pot (suma o multiplica antes que la potencia: 2 + 3² = 25),
    pot_producto (8³ = 24), raiz_suma (√(9 + 16) = 3 + 4), olvida_pot (olvida la potencia o la raíz al sustituir)."""
    hi = 12 if d == 1 else 20
    n = lambda: rng.randint(2, hi)  # noqa: E731
    for _ in range(500):
        sq = rng.choice(CUADRADOS)
        formas = {
            1: [lambda: [n(), SUM, ("pot", rng.randint(2, 5), 2), MUL, n()],
                lambda: [n(), MUL, ("pot", rng.randint(2, 4), rng.choice([2, 3]))],
                lambda: [n(), SUM, ("pot", rng.randint(2, 6), 2)],
                lambda: [("raiz", sq), MUL, n(), SUM, ("pot", rng.randint(2, 3), 3)],
                lambda: [n() * 4, RES, ("pot", rng.randint(2, 5), 2)]],
            2: [lambda: [("pot", rng.randint(2, 5), 3), DIV, ("grupo", [("raiz", rng.choice(CUADRADOS)), SUM, rng.randint(1, 5)], "()"), RES, ("raiz", rng.choice(CUADRADOS))],
                lambda: [n(), MUL, ("grupo", [n(), SUM, ("pot", rng.randint(2, 4), 2)], "()")],
                lambda: [("pot", ("grupo", [n(), RES, rng.randint(1, 9)], "()"), 2), SUM, ("raiz", rng.choice(CUADRADOS))],
                lambda: [n(), SUM, rng.randint(2, 5), MUL, ("pot", rng.randint(2, 4), 2)]],
            3: [lambda: [("pot", rng.randint(2, 8), 3), DIV, ("grupo", [("raiz", rng.choice(CUADRADOS)), SUM, rng.randint(1, 9)], "()"), RES, ("raiz", rng.choice(CUADRADOS))],
                lambda: [("raiz", ("grupo", [a, SUM, b], "()")), MUL, ("grupo", [n(), RES, ("pot", 2, rng.randint(2, 4))], "()")],
                lambda: [n(), MUL, ("grupo", [("pot", rng.randint(2, 5), 2), RES, ("raiz", rng.choice(CUADRADOS))], "[]"), SUM, ("pot", 2, rng.randint(3, 6))],
                lambda: [("grupo", [n(), SUM, ("pot", 3, 2), MUL, rng.randint(2, 4)], "[]"), DIV, rng.choice([2, 3, 5])]],
        }[d]
        a, b = rng.choice([(9, 16), (36, 64), (144, 256), (25, 144), (16, 9), (64, 36)])
        if d == 2 and rng.random() < 0.2:
            toks = [("raiz", ("grupo", [a, SUM, b], "()")), MUL, n()]
        else:
            toks = rng.choice(formas)()
        if not _natural_todo(toks):
            continue
        v = _valor(toks)
        if v is None or v > 5000:
            continue
        errs = []
        for modo, clave in (("e06", "pot_producto"),):
            x = _valor(toks, modo)
            if x is not None and x != v:
                errs.append((x, clave))
        for tr, clave in ((_op_antes_pot, "op_antes_pot"), (_raiz_suma, "raiz_suma"), (_olvida, "olvida_pot")):
            t2 = tr(toks)
            if t2 != toks:
                x = _valor(t2)
                if x is not None and x != v:
                    errs.append((x, clave))
        if len({e[0] for e in errs}) >= 2:
            break
    expr = _texto(toks, "·")
    errs.sort(key=lambda e: {"op_antes_pot": 0, "raiz_suma": 1, "pot_producto": 2, "olvida_pot": 3}[e[1]])
    ej = mk(f"Calcula: {expr}", fmt(v), "jerarquia", {"expresion": expr}, errs, [],
            "El orden es: paréntesis (de dentro afuera), potencias y raíces, multiplicaciones y divisiones de izquierda a derecha, y al final sumas y "
            "restas. La potencia se aplica solo a su base (2 + 3² = 2 + 9) y la raíz de una suma no es la suma de las raíces. Reescribir la "
            "expresión entera tras cada paso evita 'perder' una potencia.",
            genericos=[v + 1, v - 1, v + 10, v * 2])
    ej.pasos = _pasos_jer(toks, "·")
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos) + f" Resultado: {fmt(v)}."
    return ej


# ================================================================ JERARQUÍA CON ENTEROS

class N:
    """Nodo de expresión con enteros: ('n', v) | ('g', [toks], '()'|'[]') | ('p', nodo, exp) | ('neg', nodo)."""


def _ev(t, modo):
    k = t[0]
    if k == "n":
        return t[1]
    if k == "g":
        return _evl(t[1], modo)
    if k == "p":
        b = _ev(t[1], modo)
        return b ** t[2]
    if k == "neg":
        if modo == "e04" and t[1][0] == "p":
            return (-_ev(t[1][1], modo)) ** t[1][2]
        return -_ev(t[1], modo)
    raise ValueError(t)


def _ap(a, op, b, modo):
    if op == SUM:
        if modo == "e02" and a < 0 and b < 0:
            return -(a + b)
        return a + b
    if op == RES:
        if modo == "e02" and a < 0 and b > 0:
            return -a + b
        return a - b
    if op == MUL:
        return a * b
    if b == 0 or a % b:
        raise ValueError("no exacta")
    return a // b


def _evl(toks, modo="ok"):
    toks = list(toks)
    if modo == "e01":
        nuevo = [toks[0]]
        for i in range(1, len(toks), 2):
            op, t = toks[i], toks[i + 1]
            if op == RES and t[0] == "g" and "[" not in t[2] and all(o in (SUM, RES) for o in t[1][1::2]):
                g = t[1]
                nuevo += [RES, g[0]] + list(g[1:])
            else:
                nuevo += [op, t]
        toks = nuevo
    vals = [_ev(t, modo) for t in toks[0::2]]
    ops = list(toks[1::2])
    niveles = [[SUM, RES, MUL, DIV]] if modo == "e03" else [[MUL, DIV], [SUM, RES]]
    for nivel in niveles:
        i = 0
        while i < len(ops):
            if ops[i] in nivel:
                vals[i:i + 2] = [_ap(vals[i], ops[i], vals[i + 1], modo)]
                ops.pop(i)
            else:
                i += 1
    return vals[0]


def _txt(t, primero=False):
    k = t[0]
    if k == "n":
        return fmt(t[1]) if (t[1] >= 0 or primero) else f"({fmt(t[1])})"
    if k == "g":
        a, b = ("(", ")") if t[2] == "()" else ("[", "]")
        return a + _txtl(t[1]) + b
    if k == "p":
        base = t[1]
        bt = f"({fmt(base[1])})" if base[0] == "n" and base[1] < 0 else _txt(base)
        return bt + sup(t[2])
    if k == "neg":
        return "−" + _txt(t[1])


def _txtl(toks):
    s = _txt(toks[0], primero=True)
    for i in range(1, len(toks), 2):
        s += f" {'·' if toks[i] == MUL else toks[i]} {_txt(toks[i + 1])}"
    return s


def _pasos_ent(toks):
    """Pasos: grupos, potencias, productos/cocientes, sumas/restas (con sustitución)."""
    pasos = []

    def red_operando(t):
        if t[0] == "g":
            return ("n", _evl(t[1])), _txt(t)
        if t[0] in ("p", "neg"):
            return ("n", _ev(t, "ok")), _txt(t)
        return t, None

    actual = list(toks)
    # 1) grupos y potencias
    for i in range(0, len(actual), 2):
        if actual[i][0] != "n":
            nuevo, op = red_operando(actual[i])
            pasos.append((op, fmt(nuevo[1]), f"{'Resuelvo el paréntesis' if actual[i][0] == 'g' else 'Calculo la potencia'}: {op} = {fmt(nuevo[1])}."))
            actual[i] = nuevo
    if pasos:
        pasos[-1] = (pasos[-1][0], pasos[-1][1], pasos[-1][2] + f" Queda {_txtl(actual)}.")
    # 2) · y :
    for nivel, why in (((MUL, DIV), "Multiplicaciones y divisiones, de izquierda a derecha"), ((SUM, RES), "Sumas y restas, de izquierda a derecha")):
        i = 1
        while i < len(actual):
            if actual[i] in nivel:
                a, b = actual[i - 1][1], actual[i + 1][1]
                r = _ap(a, actual[i], b, "ok")
                op = f"{zn(a)} {'·' if actual[i] == MUL else actual[i]} {zn(b)}"
                actual[i - 1:i + 2] = [("n", r)]
                pasos.append((op, fmt(r), f"{why}: {op} = {fmt(r)}." + (f" Queda {_txtl(actual)}." if len(actual) > 1 else "")))
            else:
                i += 2
    return pasos


def _n(rng, lo, hi, neg=0.5):
    v = rng.randint(lo, hi)
    return ("n", -v if rng.random() < neg else v)


@generador("t2_jerarq_ent")
def gen_jerarq_ent(rng, d):
    """Operaciones combinadas con enteros. Claves: menos_parentesis (quita un paréntesis precedido de − sin cambiar los signos de
    dentro), regla_signos_suma ('menos con menos, más' al sumar), izq_der (ignora la jerarquía), menos_cuadrado (−3² = 9)."""
    R = 9 if d == 1 else 12
    for _ in range(800):
        p = lambda lo, hi: ("n", rng.randint(lo, hi))  # noqa: E731
        m = lambda: _n(rng, 1, R)  # noqa: E731
        formas = {
            1: [lambda: [p(2, 20), RES, ("g", [p(1, 9), RES, p(2, 15)], "()"), SUM, m(), MUL, m()],
                lambda: [("n", -rng.randint(2, 9)), SUM, m(), MUL, m()],
                lambda: [("neg", ("p", ("n", rng.randint(2, 5)), 2)), SUM, m(), MUL, m()],
                lambda: [m(), MUL, ("g", [p(1, 9), RES, p(2, 12)], "()"), RES, m()]],
            2: [lambda: [("n", -rng.randint(2, 9)), MUL, ("g", [p(1, 9), RES, p(2, 12)], "()"), SUM, m(), DIV, m()],
                lambda: [("p", ("n", -rng.randint(2, 4)), rng.choice([2, 3])), RES, m(), MUL, ("g", [m(), RES, p(1, 9)], "()")],
                lambda: [p(5, 30), RES, ("g", [m(), RES, p(2, 12)], "()"), MUL, m(), SUM, ("neg", ("p", ("n", rng.randint(2, 4)), 2))],
                lambda: [m(), SUM, m(), MUL, m(), RES, ("g", [m(), SUM, m()], "()")]],
            3: [lambda: [("n", -rng.randint(2, 9)), MUL, ("g", [p(1, 9), RES, p(2, 12)], "()"), SUM, m(), DIV, m(), RES, ("p", ("n", -rng.randint(2, 3)), 3)],
                lambda: [m(), RES, ("g", [("g", [m(), RES, p(1, 9)], "()"), MUL, m(), SUM, ("p", ("n", -2), rng.choice([2, 3]))], "[]"), DIV, m()],
                lambda: [("neg", ("p", ("n", rng.randint(2, 5)), 2)), SUM, ("g", [m(), RES, p(2, 9)], "()"), MUL, ("g", [m(), SUM, m()], "()")],
                lambda: [p(2, 20), RES, ("g", [m(), RES, p(2, 12)], "()"), SUM, ("p", ("n", -rng.randint(2, 3)), rng.choice([2, 3])), DIV, m()]],
        }[d]
        toks = rng.choice(formas)()
        try:
            v = _evl(toks)
        except (ValueError, ZeroDivisionError):
            continue
        if abs(v) > 300:
            continue
        errs = []
        for modo, clave in (("e01", "menos_parentesis"), ("e02", "regla_signos_suma"), ("e03", "izq_der"), ("e04", "menos_cuadrado")):
            try:
                x = _evl(toks, modo)
            except (ValueError, ZeroDivisionError):
                continue
            if x != v and x not in [e[0] for e in errs]:
                errs.append((x, clave))
        if len(errs) >= 2:
            break
    expr = _txtl(toks)
    ej = mk(f"Calcula: {expr}", fmt(v), "jerarquia", {"expresion": expr}, errs, _pasos_ent(toks),
            "Mismo orden que con naturales (paréntesis, potencias, · y :, + y −) y además las reglas de los signos. Un − delante de un paréntesis "
            "cambia el signo de todo lo de dentro; −3² es −(3²) = −9, pero (−3)² = 9; y 'menos por menos, más' es solo para multiplicar y dividir.",
            genericos=[v + 1, v - 1, -v if v else 2, v + 10])
    return ej


# ================================================================ JERARQUÍA CON FRACCIONES

F = Fraction


def _fev(t, modo):
    if t[0] == "f":
        return t[1]
    if t[0] == "g":
        return _fevl(t[1], modo)
    if t[0] == "p":
        b = _fev(t[1], modo)
        e = t[2]
        if modo == "e03p" and e == 0:
            return F(0)
        if modo == "e02p" and t[1][0] in ("f",) and b.denominator != 1:
            r = F(b.numerator ** e if e >= 0 else b.denominator ** -e, b.denominator if e >= 0 else abs(b.numerator))
            return r if e >= 0 else r * (1 if b > 0 or e % 2 == 0 else 1)
        if modo == "e04p" and b < 0 and e % 2:
            b = -b
        r = b ** e
        if modo == "e01p" and e < 0:
            return -abs(r)
        return r
    raise ValueError(t)


def _fap(a, op, b, modo, ta, tb):
    if op == SUM:
        if modo == "e02" and (a.denominator != 1 or b.denominator != 1) and a.denominator != b.denominator:
            return F(a.numerator + b.numerator, a.denominator + b.denominator)
        return a + b
    if op == RES:
        return a - b
    if op == MUL:
        if modo == "e04" and ((ta == "int" and b.denominator != 1) or (tb == "int" and a.denominator != 1)):
            return a if a.denominator != 1 else b
        return a * b
    if b == 0:
        raise ZeroDivisionError
    if modo == "e03":
        return a * b
    return a / b


def _fevl(toks, modo="ok"):
    vals = [_fev(t, modo) for t in toks[0::2]]
    tipos = ["int" if t[0] == "f" and t[1].denominator == 1 else "frac" for t in toks[0::2]]
    ops = list(toks[1::2])
    niveles = [[SUM, RES], [MUL, DIV]] if modo == "e01" else [[MUL, DIV], [SUM, RES]]
    for nivel in niveles:
        i = 0
        while i < len(ops):
            if ops[i] in nivel:
                vals[i:i + 2] = [_fap(vals[i], ops[i], vals[i + 1], modo, tipos[i], tipos[i + 1])]
                tipos[i:i + 2] = ["frac"]
                ops.pop(i)
            else:
                i += 1
    return vals[0]


def _ftxt(t, primero=False):
    if t[0] == "f":
        v = t[1]
        s = fr(v)
        if v < 0 and not primero:
            return f"({s})"
        return s
    if t[0] == "g":
        a, b = ("(", ")") if t[2] == "()" else ("[", "]")
        return a + _ftxtl(t[1]) + b
    if t[0] == "p":
        base = t[1]
        bt = _ftxt(base, True)
        if base[0] == "f" and (base[1].denominator != 1 or base[1] < 0):
            bt = f"({bt})"
        return bt + sup(t[2])


def _ftxtl(toks):
    s = _ftxt(toks[0], True)
    for i in range(1, len(toks), 2):
        s += f" {'·' if toks[i] == MUL else toks[i]} {_ftxt(toks[i + 1])}"
    return s


def _fpasos(toks):
    pasos = []
    actual = list(toks)
    for i in range(0, len(actual), 2):
        if actual[i][0] != "f":
            v = _fev(actual[i], "ok")
            pasos.append((_ftxt(actual[i]), fr(v), f"{'Resuelvo el paréntesis' if actual[i][0] == 'g' else 'Calculo la potencia'}: {_ftxt(actual[i])} = {fr(v)}."))
            actual[i] = ("f", v)
    for nivel, why in (((MUL, DIV), "Multiplicaciones y divisiones, de izquierda a derecha"), ((SUM, RES), "Sumas y restas, de izquierda a derecha")):
        i = 1
        while i < len(actual):
            if actual[i] in nivel:
                a, b = actual[i - 1][1], actual[i + 1][1]
                r = _fap(a, actual[i], b, "ok", None, None)
                op = f"{_ftxt(actual[i - 1], True)} {'·' if actual[i] == MUL else actual[i]} {_ftxt(actual[i + 1])}"
                extra = ""
                if actual[i] == DIV:
                    extra = f" (dividir es multiplicar por la inversa: {fr(a)} · {fr(1 / b)})"
                elif actual[i] in (SUM, RES) and a.denominator != b.denominator:
                    m = a.denominator * b.denominator // math.gcd(a.denominator, b.denominator)
                    extra = f" (común denominador {m})"
                actual[i - 1:i + 2] = [("f", r)]
                pasos.append((op, fr(r), f"{why}: {op} = {fr(r)}{extra}." + (f" Queda {_ftxtl(actual)}." if len(actual) > 1 else "")))
            else:
                i += 2
    return pasos


def _fr(rng, dmax=12, entero=0.0):
    if rng.random() < entero:
        return ("f", F(rng.randint(2, 5)))
    den = rng.randint(2, dmax)
    num = rng.randint(1, den * 2)
    while F(num, den).denominator == 1:
        num += 1
    return ("f", F(num, den))


@generador("t2_jerarq_frac")
def gen_jerarq_frac(rng, d):
    """Operaciones combinadas con fracciones (sin potencias). Claves: suma_antes (suma antes que multiplicar), suma_nd (suma
    numeradores y denominadores), divide_sin_invertir, entero_nd (multiplica el entero por numerador y denominador)."""
    for _ in range(1000):
        f = lambda: _fr(rng, 8 if d == 1 else 12)  # noqa: E731
        k = lambda: ("f", F(rng.randint(2, 5)))  # noqa: E731
        formas = {
            1: [lambda: [f(), SUM, f(), MUL, f()], lambda: [f(), MUL, k(), RES, f()], lambda: [f(), DIV, f(), SUM, f()], lambda: [f(), SUM, f(), MUL, k()]],
            2: [lambda: [("g", [f(), RES, f()], "()"), MUL, f()], lambda: [f(), SUM, f(), DIV, f()], lambda: [k(), MUL, ("g", [f(), SUM, f()], "()"), RES, f()],
                lambda: [f(), RES, f(), MUL, k()]],
            3: [lambda: [("g", [f(), RES, f()], "()"), DIV, f(), SUM, f(), MUL, k()], lambda: [f(), SUM, f(), MUL, ("g", [f(), RES, f()], "()")],
                lambda: [("g", [f(), SUM, f()], "()"), DIV, ("g", [f(), RES, f()], "()")]],
        }[d]
        toks = rng.choice(formas)()
        try:
            v = _fevl(toks)
        except ZeroDivisionError:
            continue
        # resultados parciales positivos y de tamaño razonable
        if v <= 0 or v.denominator > 60 or v.numerator > 200:
            continue
        if any(t[0] == "g" and _fevl(t[1]) <= 0 for t in toks[0::2]):
            continue
        errs = []
        for modo, clave in (("e01", "suma_antes"), ("e02", "suma_nd"), ("e03", "divide_sin_invertir"), ("e04", "entero_nd")):
            try:
                x = _fevl(toks, modo)
            except ZeroDivisionError:
                continue
            if x != v and x > 0 and fr(x) not in [e[0] for e in errs]:
                errs.append((fr(x), clave))
        if len(errs) >= 2:
            break
    expr = _ftxtl(toks)
    return mk(f"Calcula y simplifica: {expr}", fr(v), "t2_jerarq_frac", {"expresion": expr}, errs, _fpasos(toks),
              "Con fracciones la jerarquía es la misma: paréntesis, luego · y :, luego + y −. Para sumar hace falta común denominador (nunca sumar "
              "numeradores y denominadores); para dividir se multiplica por la inversa; un entero por una fracción multiplica solo al numerador. "
              "El resultado se da simplificado.",
              genericos=[fr(v + 1), fr(v * 2), fr(v / 2), fr(1 / v) if v != 1 else "2"])


@generador("t2_jerarq_potfrac")
def gen_jerarq_potfrac(rng, d):
    """Operaciones combinadas con racionales y potencias de exponente entero. Claves: exp_neg_negativo ((1/3)⁻¹ = −1/3),
    solo_numerador ((2/3)² = 4/3), cero_da_cero (2⁰ = 0), pierde_signo ((−1/3)³ = 1/27)."""
    for _ in range(1500):
        fq = lambda: ("f", F(rng.choice([1, 2, 3, 4, 5]), rng.choice([2, 3, 4, 5])))  # noqa: E731
        fqs = lambda: ("f", F(rng.choice([-1, 1]) * rng.choice([1, 2, 3]), rng.choice([2, 3, 4])))  # noqa: E731
        z0 = lambda: ("p", ("f", F(rng.randint(2, 9))), 0)  # noqa: E731
        formas = {
            1: [lambda: [("p", fq(), 2), SUM, z0()], lambda: [("p", fq(), -1), RES, fq()], lambda: [("p", fqs(), 3), SUM, fq()],
                lambda: [("p", fq(), 2), MUL, ("p", fq(), -1)]],
            2: [lambda: [("p", fq(), 2), MUL, ("p", fqs(), -1), SUM, z0()], lambda: [("p", fqs(), 3), DIV, ("p", fq(), -2)],
                lambda: [("g", [fq(), RES, fqs()], "()"), MUL, ("p", fq(), -2)], lambda: [("p", fqs(), 2), RES, ("p", fq(), -1), MUL, fq()]],
            3: [lambda: [("g", [("p", fq(), 2), RES, ("f", F(1))], "[]"), DIV, ("p", fqs(), -1), SUM, z0()],
                lambda: [("p", fqs(), -2), MUL, ("g", [("p", fq(), 3), RES, fq()], "[]")],
                lambda: [("p", fqs(), 3), SUM, ("p", ("f", F(2)), -3), DIV, ("p", fq(), 2)],
                lambda: [("g", [fq(), SUM, ("p", fqs(), -1)], "[]"), MUL, ("p", fq(), 2), RES, z0()]],
        }[d]
        toks = rng.choice(formas)()
        try:
            v = _fevl(toks)
        except ZeroDivisionError:
            continue
        if v.denominator > 400 or abs(v.numerator) > 400 or v == 0:
            continue
        errs = []
        for modo, clave in (("e01p", "exp_neg_negativo"), ("e02p", "solo_numerador"), ("e03p", "cero_da_cero"), ("e04p", "pierde_signo")):
            try:
                x = _fevl(toks, modo)
            except ZeroDivisionError:
                continue
            if x != v and fr(x) not in [e[0] for e in errs]:
                errs.append((fr(x), clave))
        if len(errs) >= 2:
            break
    expr = _ftxtl(toks)
    return mk(f"Calcula y da el resultado como fracción irreducible: {expr}", fr(v), "t2_jerarq_potfrac", {"expresion": expr}, errs, _fpasos(toks),
              "Recordad: a⁰ = 1; un exponente negativo invierte la base (no la hace negativa): (2/3)⁻¹ = 3/2; la potencia afecta a numerador y "
              "denominador; y una base negativa con exponente impar da negativo. Después, la jerarquía de siempre.",
              genericos=[fr(-v), fr(v + 1), fr(1 / v), fr(v * 2)])


# ================================================================ POTENCIAS

def _pb(b):
    """Base con paréntesis si es negativa."""
    return f"({fmt(b)})" if b < 0 else fmt(b)


@generador("t2_potencia")
def gen_potencia(rng, d):
    """Potencias de base natural. Claves: base_por_exp (5³ = 15, también 5 + 5 + 5), factor_de_mas (un factor de más o de menos),
    base_exp_cambiados (2³ = 9)."""
    for _ in range(300):
        if d == 1:
            b, e = rng.randint(2, 10), rng.choice([1, 2, 2, 3])
        elif d == 2:
            b, e = rng.randint(2, 12), rng.choice([2, 3, 3, 4])
        else:
            b, e = rng.choice([(2, rng.randint(5, 10)), (3, rng.randint(4, 7)), (rng.randint(11, 20), 2), (rng.randint(5, 20), 3), (rng.randint(4, 9), 4)])
        v = b ** e
        if v <= 10000 and not (e == 1 and d > 1):
            break
    tipo = "calcular" if d == 3 or rng.random() < 0.75 else "escribir"
    adulto = "La potencia es una multiplicación repetida: el exponente dice cuántas veces se repite la base como factor. El error típico es multiplicar base por exponente."
    if tipo == "escribir" and e > 1:
        prod = " · ".join([str(b)] * e)
        return mk(f"Escribe como potencia: {prod}", f"{b}{sup(e)}", "t2_pot_escribir", {"b": b, "e": e},
                  [(f"{e}{sup(b)}", "base_exp_cambiados"), (f"{b}{sup(e + 1)}", "factor_de_mas"), (f"{b} · {e}", "base_por_exp")],
                  [("contar factores", str(e), f"El {b} se repite {e} veces como factor: base {b}, exponente {e}: {b}{sup(e)}.")], adulto)
    dist = [(b * e, "base_por_exp"), (b ** (e + 1) if b ** (e + 1) < 10 ** 6 else None, "factor_de_mas"), (b ** (e - 1) if e > 1 else None, "factor_de_mas"),
            (e ** b if e > 1 and e ** b < 10 ** 6 else None, "base_exp_cambiados")]
    dist.sort(key=lambda x: {"base_por_exp": 0, "base_exp_cambiados": 1, "factor_de_mas": 2}[x[1]])
    prod = " · ".join([str(b)] * e) if e <= 10 else f"{b} · {b} · … · {b}"
    pasos = [(prod, fmt(v), f"{b}{sup(e)} es multiplicar el {b} por sí mismo {e} {'vez' if e == 1 else 'veces'}: {prod} = {fmt(v)}.")]
    return mk(f"Calcula: {b}{sup(e)}", fmt(v), "pot", {"a": b, "n": e}, dist, pasos, adulto, genericos=[v + b, v - 1, v + 10])


@generador("t2_pot_prop")
def gen_pot_prop(rng, d, enteros=False):
    """Propiedades de las potencias (reducir a una sola potencia). Claves: multiplica_exp (en producto de misma base), multiplica_bases,
    suma_exp_potpot (potencia de potencia sumando), misma_base_distintas (aplica la regla a bases distintas), divide_exp (en el cociente).
    Con enteros=True (exponentes enteros): resta_neg_mal, sin_base_comun, pierde_signo_potpot."""
    if not enteros:
        tipo = rng.choice({1: ["producto", "cociente", "potpot"], 2: ["producto", "cociente", "potpot", "mismo_exp"], 3: ["combinada", "mismo_exp", "potpot", "combinada"]}[d])
        b = rng.randint(2, 9)
        m, n = rng.randint(2, 9), rng.randint(2, 9)
        if tipo == "producto":
            enun, r = f"{b}{sup(m)} · {b}{sup(n)}", f"{b}{sup(m + n)}"
            dist = [(f"{b}{sup(m * n)}", "multiplica_exp"), (f"{b * b}{sup(m + n)}", "multiplica_bases"), (f"{b * b}{sup(m * n)}", None)]
            regla = "Producto de potencias de la misma base: se deja la base y se suman los exponentes"
        elif tipo == "cociente":
            m = n * rng.randint(2, 3) if rng.random() < 0.6 else max(m, n) + rng.randint(1, 4)
            enun, r = f"{b}{sup(m)} : {b}{sup(n)}", f"{b}{sup(m - n)}"
            dist = [(f"{b}{sup(m // n)}" if m % n == 0 else f"{b}{sup(m + n)}", "divide_exp" if m % n == 0 else None), (f"1{sup(m - n)}", None), (f"{b}{sup(m + n)}", None)]
            regla = "Cociente de potencias de la misma base: se deja la base y se restan los exponentes"
        elif tipo == "potpot":
            enun, r = f"({b}{sup(m)}){sup(n)}", f"{b}{sup(m * n)}"
            dist = [(f"{b}{sup(m + n)}", "suma_exp_potpot"), (f"{b}{sup(m ** n)}" if m ** n < 100 else f"{b}{sup(m * n + 1)}", None), (f"{b * n}{sup(m)}", None)]
            regla = "Potencia de una potencia: se deja la base y se multiplican los exponentes"
        elif tipo == "mismo_exp":
            a, c = rng.randint(2, 7), rng.randint(2, 7)
            if rng.random() < 0.5:
                enun, r = f"{a}{sup(m)} · {c}{sup(m)}", f"{a * c}{sup(m)}"
                dist = [(f"{a * c}{sup(2 * m)}", "misma_base_distintas"), (f"{a + c}{sup(m)}", None), (f"{a * c}{sup(m * m)}", None)]
                regla = "Producto de potencias con el mismo exponente: se multiplican las bases y se deja el exponente"
            else:
                enun, r = f"{a * c}{sup(m)} : {c}{sup(m)}", f"{a}{sup(m)}"
                dist = [(f"{a}{sup(0)}" if False else f"{a * c - c}{sup(m)}", None), (f"{a}{sup(2 * m)}", "misma_base_distintas"), (f"{a}{sup(1)}", None)]
                regla = "Cociente de potencias con el mismo exponente: se dividen las bases y se deja el exponente"
        else:
            c = rng.randint(2, 4)
            a = rng.randint(2, 4)
            B = a * c
            p1, p2 = rng.randint(2, 8), rng.randint(2, 8)
            q1 = rng.randint(2, p1 + p2 - 2)
            q2 = p1 + p2 - q1
            enun = f"({B}{sup(p1)} · {B}{sup(p2)}) : ({c}{sup(q1)} · {c}{sup(q2)})"
            r = f"{a}{sup(p1 + p2)}"
            dist = [(f"{a}{sup(p1 * p2 - q1 * q2)}" if p1 * p2 - q1 * q2 > 0 else f"{a}{sup(p1 * p2)}", None), (f"{B - c}{sup(p1 + p2)}", None),
                    (f"{a}{sup(0)}", None)]
            regla = (f"Misma base: {B}{sup(p1)} · {B}{sup(p2)} = {B}{sup(p1 + p2)} y {c}{sup(q1)} · {c}{sup(q2)} = {c}{sup(q1 + q2)}. "
                     f"Mismo exponente: {B}{sup(p1 + p2)} : {c}{sup(p1 + p2)} = ({B} : {c}){sup(p1 + p2)}")
        return mk(f"Escribe como una sola potencia: {enun}", r, "t2_pot_prop", {"tipo": tipo}, dist,
                  [(enun, r, f"{regla}: {r}.")],
                  "Tres reglas que se confunden entre sí: misma base multiplicando → se suman exponentes; potencia de potencia → se multiplican; "
                  "mismo exponente → se opera con las bases. Escribir el desarrollo una vez (2³ · 2² = 2·2·2 · 2·2) ayuda a ver por qué.",
                  genericos=[r.replace(sup(1), "") + "", f"{b}{sup(1)}"])
    # exponentes enteros
    tipo = rng.choice({1: ["producto", "cociente"], 2: ["cociente", "potpot", "base_comun"], 3: ["base_comun", "combinada", "potpot"]}[d])
    b = rng.choice([2, 3, 5, 7, 10])
    m, n = rng.choice([-1, 1]) * rng.randint(1, 6), rng.choice([-1, 1]) * rng.randint(1, 6)
    if tipo == "producto":
        if m > 0 and n > 0:
            m = -m
        enun, e = f"{b}{sup(m)} · {b}{sup(n)}", m + n
        dist = [(f"{b}{sup(m * n)}", "multiplica_exp"), (f"{b}{sup(m - n)}" if m - n != e else None, None), (f"{b * b}{sup(e)}", None)]
        regla = f"Misma base multiplicando: se suman los exponentes, {m} + ({n}) = {e}" if n < 0 else f"Misma base multiplicando: se suman los exponentes, {m} + {n} = {e}"
    elif tipo == "cociente":
        if n > 0:
            n = -n
        enun, e = f"{b}{sup(m)} : {b}{sup(n)}", m - n
        dist = [(f"{b}{sup(m + n)}", "resta_neg_mal"), (f"{b}{sup(n - m)}", None), (f"{b}{sup(m * n)}", None)]
        regla = f"Misma base dividiendo: se restan los exponentes, {m} − ({n}) = {e}"
    elif tipo == "potpot":
        m = -abs(m) if rng.random() < 0.7 else abs(m)
        n = rng.choice([-1, 1]) * rng.randint(2, 3)
        enun, e = f"({b}{sup(m)}){sup(n)}", m * n
        dist = [(f"{b}{sup(-e)}", "pierde_signo_potpot"), (f"{b}{sup(m + n)}", None), (f"{b}{sup(abs(m) * abs(n)) if e < 0 else sup(-e)}", None)]
        regla = f"Potencia de potencia: se multiplican los exponentes con su signo, ({m}) · ({n}) = {e}"
    elif tipo == "base_comun":
        b = rng.choice([2, 3])
        k = rng.choice([2, 3])
        B = b ** k
        m = rng.randint(2, 4) * rng.choice([1, -1])
        n = rng.randint(1, 5)
        e = k * m + n
        enun = f"{B}{sup(m)} · {b}{sup(n)}"
        dist = [(f"{B * b}{sup(m + n)}", "sin_base_comun"), (f"{b}{sup(m + n)}", "sin_base_comun"), (f"{b}{sup(k * m * n)}", None)]
        regla = f"Paso a base común: {B} = {b}{sup(k)}, así que {B}{sup(m)} = {b}{sup(k * m)}. Misma base: {k * m} + {n} = {e}"
    else:
        b = rng.choice([2, 3])
        p = rng.randint(2, 4)
        B = b ** 2
        C = b ** 3
        m = -rng.randint(1, 3)
        e = m + 2 * p - 3
        enun = f"{b}{sup(m)} · {B}{sup(p)} : {C}"
        dist = [(f"{b}{sup(m * 2 * p - 3)}", "multiplica_exp"), (f"{B * b}{sup(m + p - 1)}", "sin_base_comun"), (f"{b}{sup(e + 6)}", None)]
        regla = f"Base común: {B}{sup(p)} = {b}{sup(2 * p)} y {C} = {b}{sup(3)}. Exponentes: {m} + {2 * p} − 3 = {e}"
    r = f"{b}{sup(e)}"
    return mk(f"Escribe como una sola potencia: {enun}", r, "t2_pot_prop", {"tipo": tipo, "enteros": True}, dist,
              [(enun, r, f"{regla}. Queda {r}.")],
              "Las mismas reglas que con exponentes naturales, pero cuidando los signos: restar un exponente negativo es sumar, y en la potencia de "
              "potencia se multiplican los signos. Antes de aplicar las reglas, todas las bases tienen que ser iguales (4 = 2², 27 = 3³).",
              genericos=[f"{b}{sup(e + 1)}", f"{b}{sup(e - 1)}", f"{b}{sup(-e) if e else sup(1)}"])


@generador("t2_pot10")
def gen_pot10(rng, d):
    """Potencias de base 10. Claves: cero_mas_menos (un cero de más o de menos), diez_por_exp (10³ = 30), ceros_propios (no cuenta los
    ceros que ya tenía el número)."""
    tipo = rng.choice({1: ["calcular", "escribir"], 2: ["producto", "calcular", "escribir"], 3: ["producto", "producto", "escribir"]}[d])
    n = rng.randint(1, 9) if d == 1 else rng.randint(3, 12)
    adulto = "10ⁿ es un 1 seguido de n ceros. Para multiplicar un número por 10ⁿ se le añaden n ceros, además de los que ya tuviera."
    if tipo == "calcular":
        v = 10 ** n
        return mk(f"Calcula: 10{sup(n)}", fmt(v), "pot", {"a": 10, "n": n},
                  [(fmt(v * 10), "cero_mas_menos"), (fmt(v // 10), "cero_mas_menos"), (fmt(10 * n), "diez_por_exp")],
                  [("ceros", str(n), f"10{sup(n)} es un 1 seguido de {n} ceros: {fmt(v)}.")], adulto)
    if tipo == "escribir":
        v = 10 ** n
        return mk(f"Escribe {fmt(v)} como potencia de 10.", f"10{sup(n)}", "t2_pot10", {"n": n, "tipo": tipo},
                  [(f"10{sup(n + 1)}", "cero_mas_menos"), (f"10{sup(n - 1)}", "cero_mas_menos"), (f"{n}{sup(10)}", None)],
                  [("contar ceros", str(n), f"Cuento los ceros de {fmt(v)}: hay {n}. Por tanto es 10{sup(n)}.")], adulto)
    a = rng.randint(2, 99) if d == 2 else rng.choice([rng.randint(2, 999), rng.randint(2, 99) * 10, rng.randint(101, 999)])
    if d == 3 and rng.random() < 0.4:
        a = rng.randint(1, 9) * 10 ** rng.randint(1, 2)
    n = rng.randint(2, 6 if d == 2 else 8)
    v = a * 10 ** n
    t, c = sin_ceros(a)
    dist = []
    if c:
        dist.append((fmt(t * 10 ** n), "ceros_propios"))
    dist += [(fmt(v * 10), "cero_mas_menos"), (fmt(v // 10), "cero_mas_menos"), (fmt(a * 10 * n), "diez_por_exp")]
    return mk(f"Calcula: {fmt(a)} · 10{sup(n)}", fmt(v), "mult", {"a": a, "b": 10 ** n}, dist,
              [("añadir ceros", fmt(v), f"Multiplicar por 10{sup(n)} es añadir {n} ceros a {fmt(a)}: {fmt(v)}" + (f" (los {c} cero{'s' if c > 1 else ''} que ya tenía se quedan)." if c else "."))],
              adulto)


@generador("t2_pot_entera")
def gen_pot_entera(rng, d):
    """Potencias de base entera y exponente natural. Claves: menos_fuera (−a^n como (−a)^n), signo_fijo (siempre positivo o siempre
    negativo), base_por_exp."""
    tipo = rng.choice({1: ["calc", "menos"], 2: ["calc", "menos"], 3: ["mixta", "menos", "calc"]}[d])
    adulto = ("(−2)⁴ = 16 porque se multiplican cuatro (−2); −2⁴ = −16 porque la potencia solo afecta al 2. Base negativa: exponente par → +, impar → −.")
    if tipo == "mixta":
        a, b, c = rng.randint(2, 3), rng.randint(2, 3), rng.randint(2, 3)
        e1, e2, e3 = rng.choice([2, 4]), rng.choice([2, 4]), 3
        expr = f"−{a}{sup(e1)} + (−{b}){sup(e2)} − (−{c}){sup(e3)}"
        v = -(a ** e1) + (-b) ** e2 - (-c) ** e3
        mal1 = (a ** e1) + (-b) ** e2 - (-c) ** e3
        mal2 = -(a ** e1) + (-b) ** e2 - (c ** e3)
        return mk(f"Calcula: {expr}", fmt(v), "jerarquia", {"expresion": expr},
                  [(mal1, "menos_fuera"), (mal2, "signo_fijo"), (-(a * e1) + b * e2 + c * e3, "base_por_exp")],
                  [(f"−{a}{sup(e1)}", fmt(-(a ** e1)), f"−{a}{sup(e1)} = −({a}{sup(e1)}) = {fmt(-(a ** e1))}: la potencia solo afecta al {a}."),
                   (f"(−{b}){sup(e2)}", fmt((-b) ** e2), f"(−{b}){sup(e2)} = {fmt((-b) ** e2)} (exponente par → positivo)."),
                   (f"(−{c}){sup(e3)}", fmt((-c) ** e3), f"(−{c}){sup(e3)} = {fmt((-c) ** e3)} (exponente impar → negativo)."),
                   ("sumar", fmt(v), f"{fmt(-(a ** e1))} + {fmt((-b) ** e2)} − ({fmt((-c) ** e3)}) = {fmt(v)}.")], adulto,
                  genericos=[v + 1, v - 1, -v])
    b = rng.randint(2, 12 if d > 1 else 5)
    e = rng.randint(2, 6 if d > 1 else 4)
    if b ** e > 100000:
        e = 2 if b > 6 else 3
    if tipo == "menos":
        v = -(b ** e)
        return mk(f"Calcula: −{b}{sup(e)}", fmt(v), "jerarquia", {"expresion": f"−{b}{sup(e)}"},
                  [(fmt(b ** e), "menos_fuera"), (fmt(-b * e), "base_por_exp"), (fmt(-(b ** (e - 1))), None)],
                  [(f"{b}{sup(e)}", fmt(b ** e), f"La potencia solo afecta al {b}: {b}{sup(e)} = {fmt(b ** e)}."),
                   ("signo", fmt(v), f"Y el signo − de delante se queda: −{fmt(b ** e)}.")], adulto)
    v = (-b) ** e
    return mk(f"Calcula: (−{b}){sup(e)}", fmt(v), "pot", {"a": -b, "n": e},
              [(fmt(-v), "signo_fijo"), (fmt(-b * e), "base_por_exp"), (fmt(b * e), "base_por_exp")],
              [(" · ".join([f"(−{b})"] * e), fmt(v), f"Multiplico {e} veces (−{b}): el valor es {b}{sup(e)} = {fmt(b ** e)} y, como el exponente es "
                                                     f"{'par' if e % 2 == 0 else 'impar'}, el signo es {'+' if e % 2 == 0 else '−'}: {fmt(v)}.")], adulto,
              genericos=[fmt(v + 1), fmt(v - 1)])


@generador("t2_pot_negativa")
def gen_pot_negativa(rng, d):
    """Exponente cero y negativo. Claves: exp_neg_da_neg (2⁻³ = −8), cero_da_cero_o_base (5⁰ = 0 o 5), pierde_signo_base
    ((−2)⁻³ = 1/8), base_por_exp (3⁻² = −6)."""
    tipo = rng.choice({1: ["cero", "neg"], 2: ["neg", "neg_base_neg", "escribir"], 3: ["neg_base_neg", "escribir", "neg"]}[d])
    adulto = "a⁰ = 1 (si a ≠ 0). Un exponente negativo significa 'dar la vuelta': a⁻ⁿ = 1/aⁿ; el signo del exponente no hace negativo el resultado."
    if tipo == "cero":
        b = rng.choice([-1, 1]) * rng.randint(2, 10)
        return mk(f"Calcula: {_pb(b)}{sup(0)}" if b < 0 else f"¿Cuánto vale {b}{sup(0)}?", "1", "pot", {"a": b, "n": 0},
                  [("0", "cero_da_cero_o_base"), (fmt(b), "cero_da_cero_o_base"), (fmt(-1) if b > 0 else fmt(-b), None)],
                  [("a⁰", "1", f"Cualquier número distinto de 0 elevado a 0 da 1: {_pb(b)}{sup(0)} = 1.")], adulto)
    if tipo == "escribir":
        b = rng.randint(2, 6)
        n = rng.randint(2, 4 if b > 3 else 6)
        return mk(f"Escribe 1/{fmt(b ** n)} como potencia de base {b}.", f"{b}{sup(-n)}", "t2_pot_neg", {"b": b, "n": -n},
                  [(f"−{b}{sup(n)}", "exp_neg_da_neg"), (f"{b}{sup(n)}", None), (f"{b}{sup(-(n + 1))}", None)],
                  [("1/aⁿ", f"{b}{sup(-n)}", f"{fmt(b ** n)} = {b}{sup(n)}, y 1/{b}{sup(n)} = {b}{sup(-n)}.")], adulto)
    b = rng.randint(2, 10 if d > 1 else 5)
    if tipo == "neg_base_neg":
        b = -rng.randint(2, 5)
    n = rng.randint(1, 3 if abs(b) > 3 else 5)
    v = F(b) ** (-n)
    dist = [("−" + fmt(abs(b) ** n), "exp_neg_da_neg"), (fmt(b * -n), "base_por_exp"), ("0", None)]
    if v < 0:
        dist.insert(0, (fr(-v), "pierde_signo_base"))
    enun = f"Calcula y da el resultado como fracción: {_pb(b)}{sup(-n)}" if b > 0 else f"Calcula y expresa como fracción con su signo: {_pb(b)}{sup(-n)}"
    return mk(enun, fr(v), "pot", {"a": b, "n": -n}, dist,
              [("inversa", f"1/{_pb(b)}{sup(n)}", f"{_pb(b)}{sup(-n)} = 1/{_pb(b)}{sup(n)}."),
               (f"{_pb(b)}{sup(n)}", fmt(b ** n), f"{_pb(b)}{sup(n)} = {fmt(b ** n)}" + (" (base negativa, exponente impar → negativo)." if b < 0 and n % 2 else ".")),
               ("resultado", fr(v), f"Resultado: {fr(v)}.")], adulto, genericos=[fr(-v), fr(1 / v) if v != 0 else "1"])


# ================================================================ RAÍCES

@generador("t2_raiz_exacta")
def gen_raiz_exacta(rng, d):
    """Raíz cuadrada exacta. Claves: divide_dos (√64 = 32), cercano (√961 = 30 o 32), cualquiera_exacta (cree que todo número tiene raíz
    exacta), quita_cero (√4 900 = 700 o 7)."""
    tipo = "calc" if rng.random() < 0.8 else "es"
    if d == 1:
        r = rng.randint(2, 15)
    elif d == 2:
        r = rng.randint(11, 30) if rng.random() < 0.7 else rng.randint(2, 9) * 10
    else:
        r = rng.randint(31, 99) if rng.random() < 0.7 else rng.randint(1, 9) * 10
    n = r * r
    adulto = "√n es el número que multiplicado por sí mismo da n. Para cuadrados grandes: mirar la última cifra y el orden de magnitud (30² = 900 < 961 < 1600 = 40²)."
    if tipo == "es":
        m = rng.randint(max(2, r - 3), r + 3) ** 2 + rng.randint(1, 2 * r - 1)
        k = int(m ** 0.5)
        return mk(f"¿Es {fmt(m)} un cuadrado perfecto?", f"No, está entre {k}² = {fmt(k * k)} y {k + 1}² = {fmt((k + 1) ** 2)}", "t2_raiz_es", {"m": m},
                  [(f"Sí, √{fmt(m)} = {fmt(m // 2)}", "cualquiera_exacta"), (f"Sí, √{fmt(m)} = {k}", "cualquiera_exacta"),
                   (f"No, porque es {'par' if m % 2 == 0 else 'impar'}", None)],
                  [("cuadrados", f"{k}² y {k + 1}²", f"{k}² = {fmt(k * k)} y {k + 1}² = {fmt((k + 1) ** 2)}. {fmt(m)} está en medio, así que no es el cuadrado de ningún natural.")],
                  adulto)
    dist = [(n // 2, "divide_dos"), (r + 1, "cercano"), (r - 1, "cercano")]
    if r % 10 == 0:
        dist.insert(0, (r * 10, "quita_cero"))
        dist.insert(1, (r // 10, "quita_cero"))
    return mk(f"Calcula: √{fmt(n)}", fmt(r), "raiz", {"n": n}, dist,
              [(f"{r}²", fmt(n), f"Busco el número que al cuadrado da {fmt(n)}: {r} × {r} = {fmt(n)}. Así que √{fmt(n)} = {r}.")], adulto,
              genericos=[r + 2, r * 2, r - 2])


def _raiz_alg(n, factor=2):
    """Algoritmo de la raíz cuadrada. factor=2 correcto; factor=1 no duplica la raíz. Devuelve (raíz, resto)."""
    s = str(n)
    if len(s) % 2:
        s = "0" + s
    grupos = [int(s[i:i + 2]) for i in range(0, len(s), 2)]
    raiz, resto = 0, 0
    for g in grupos:
        cur = resto * 100 + g
        x = 0
        while x < 9 and (factor * raiz * 10 + x + 1) * (x + 1) <= cur:
            x += 1
        resto = cur - (factor * raiz * 10 + x) * x
        raiz = raiz * 10 + x
    return raiz, resto


def rr_txt(r, s):
    return f"raíz {fmt(r)}, resto {fmt(s)}"


@generador("t2_raiz_entera")
def gen_raiz_entera(rng, d, algoritmo=False):
    """Raíz cuadrada entera con resto. Claves: por_exceso, se_queda_corto (resto demasiado grande), resto_sin_cuadrado (resta la raíz, no su
    cuadrado), decimal (da una raíz decimal). Con algoritmo=True: agrupa_izquierda (separa de dos en dos desde la izquierda), no_duplica,
    salta_cero."""
    for _ in range(500):
        if not algoritmo:
            n = rng.randint(*{1: (10, 200), 2: (200, 5000), 3: (5000, 99999)}[d])
        else:
            n = rng.randint(*{1: (1000, 9999), 2: (10000, 999999), 3: (100000, 9999999)}[d])
        r = math.isqrt(n)
        s = n - r * r
        if s == 0:
            continue
        if algoritmo and d == 3 and "0" not in str(r) and rng.random() < 0.6:
            continue
        break
    adulto = ("La raíz entera es el mayor número cuyo cuadrado no se pasa del radicando; el resto es radicando − raíz². Prueba: radicando = "
              "raíz² + resto, con resto ≤ 2 · raíz.")
    if not algoritmo:
        dist = [(rr_txt(r + 1, (r + 1) ** 2 - n), "por_exceso"), (rr_txt(r - 1, n - (r - 1) ** 2), "se_queda_corto"), (rr_txt(r, n - r), "resto_sin_cuadrado"),
                (fmt(round(n ** 0.5, 2)).replace(".", ","), "decimal")]
        rng.shuffle(dist)
        pasos = [(f"{r}² ≤ {fmt(n)} < {r + 1}²", str(r), f"{r}² = {fmt(r * r)} cabe en {fmt(n)} y {r + 1}² = {fmt((r + 1) ** 2)} ya se pasa: la raíz entera es {r}."),
                 (f"{fmt(n)} − {fmt(r * r)}", fmt(s), f"Resto: {fmt(n)} − {fmt(r * r)} = {fmt(s)}. Prueba: {fmt(r * r)} + {fmt(s)} = {fmt(n)} y {fmt(s)} ≤ {2 * r}.")]
        return mk(f"Calcula la raíz cuadrada entera de {fmt(n)} y su resto.", rr_txt(r, s), "t2_raiz_entera", {"n": n}, dist, pasos, adulto,
                  genericos=[rr_txt(r, s + 1), rr_txt(r, s - 1) if s > 1 else rr_txt(r + 2, 0)])
    dist = []
    if len(str(n)) % 2:
        s2 = str(n)
        m = int(s2 + "0")  # 32 491 → 32 | 49 | 1(0): grupos desde la izquierda
        grupos = [int(s2[i:i + 2]) for i in range(0, len(s2), 2)]
        mal = 0
        for g in grupos:
            mal = mal * 100 + g
        rm = math.isqrt(mal)
        dist.append((rr_txt(rm, mal - rm * rm), "agrupa_izquierda"))
    rn, sn = _raiz_alg(n, factor=1)
    if (rn, sn) != (r, s) and sn >= 0:
        dist.append((rr_txt(rn, sn), "no_duplica"))
    sc = sin_cero_interior(r) if "0" in str(r)[1:] else None
    if "0" in str(r):
        rc = int(str(r).replace("0", "")) if str(r).replace("0", "") else None
        if rc and rc != r:
            dist.append((rr_txt(rc, s), "salta_cero"))
    dist.append((rr_txt(r + 1, (r + 1) ** 2 - n), None))
    dist.append((rr_txt(r, s + r), None))
    sn_ = str(n)
    if len(sn_) % 2:
        sn_ = " " + sn_
    grupos_txt = " | ".join(sn_[i:i + 2].strip() for i in range(0, len(sn_), 2))
    pasos = [("grupos", grupos_txt, f"Separo las cifras de dos en dos empezando por la derecha: {grupos_txt}.")]
    s_ = str(n)
    if len(s_) % 2:
        s_ = "0" + s_
    gs = [int(s_[i:i + 2]) for i in range(0, len(s_), 2)]
    raiz, resto = 0, 0
    for i, g in enumerate(gs):
        cur = resto * 100 + g
        x = 0
        while x < 9 and (2 * raiz * 10 + x + 1) * (x + 1) <= cur:
            x += 1
        if i == 0:
            pasos.append((f"√{g}", str(x), f"Primer grupo {g}: la mayor cifra cuyo cuadrado cabe es {x} ({x}² = {x * x}); resto {g - x * x}."))
        else:
            pasos.append((f"{2 * raiz}{x} × {x}", str((2 * raiz * 10 + x) * x),
                          f"Bajo el grupo: {cur}. Duplico la raíz ({2 * raiz}) y busco la cifra x con {2 * raiz}x × x ≤ {cur}: x = {x} "
                          f"({2 * raiz * 10 + x} × {x} = {(2 * raiz * 10 + x) * x}); resto {cur - (2 * raiz * 10 + x) * x}."))
        resto = cur - (2 * raiz * 10 + x) * x
        raiz = raiz * 10 + x
    pasos.append(("prueba", fmt(n), f"Raíz {fmt(r)}, resto {fmt(s)}. Prueba: {fmt(r)}² + {fmt(s)} = {fmt(r * r)} + {fmt(s)} = {fmt(n)}."))
    return mk(f"Calcula con el algoritmo la raíz cuadrada de {fmt(n)} (raíz entera y resto).", rr_txt(r, s), "t2_raiz_alg", {"n": n}, dist, pasos,
              adulto + " En el algoritmo, los grupos de dos cifras se hacen desde la derecha y en cada paso se duplica la raíz obtenida.",
              genericos=[rr_txt(r - 1, n - (r - 1) ** 2), rr_txt(r, s + 1)])


@generador("t2_raiz_enteros")
def gen_raiz_enteros(rng, d):
    """Raíces de enteros. Claves: solo_positiva (da una sola raíz), raiz_negativo (da raíz a un negativo), confunde_menos (−√a con √(−a))."""
    r = rng.randint(2, 20)
    n = r * r
    tipo = rng.choice({1: ["raices", "menos"], 2: ["raices", "negativo", "menos"], 3: ["negativo", "menos", "doble", "cero"]}[d])
    adulto = ("Un positivo tiene dos raíces cuadradas opuestas (±7 para 49); el 0, una sola; un negativo no tiene raíz cuadrada real, porque ningún "
              "número al cuadrado da negativo. −√9 es 'el opuesto de √9' = −3, que sí existe.")
    if tipo == "raices":
        return mk(f"¿Cuáles son las raíces cuadradas de {n}?", f"{r} y −{r}", "t2_raiz_ent", {"n": n, "tipo": tipo},
                  [(f"Solo {r}", "solo_positiva"), (f"Solo −{r}", "solo_positiva"), (f"{n // 2} y −{n // 2}", None)],
                  [("±", f"±{r}", f"{r}² = {n} y también (−{r})² = {n}. Las dos raíces son {r} y −{r}.")], adulto)
    if tipo == "negativo":
        return mk(f"Calcula, si existe: √(−{n})", "No existe (ningún número al cuadrado da negativo)", "t2_raiz_ent", {"n": -n, "tipo": tipo},
                  [(f"−{r}", "raiz_negativo"), (f"{r} y −{r}", "raiz_negativo"), (f"{r}", None)],
                  [("cuadrados", "≥ 0", f"Cualquier número al cuadrado da positivo o 0 ({r}² = {n}, (−{r})² = {n}). Ninguno da −{n}: la raíz no existe.")], adulto)
    if tipo == "cero":
        return mk("¿Cuántas raíces cuadradas tiene el 0?", "Una sola: el 0", "t2_raiz_ent", {"n": 0, "tipo": tipo},
                  [("Dos: 0 y −0", None), ("Ninguna", "raiz_negativo"), ("Dos: 1 y −1", None)],
                  [("0²", "0", "Solo 0² = 0; +0 y −0 son el mismo número. El 0 tiene una única raíz cuadrada.")], adulto)
    if tipo == "doble":
        return mk(f"¿Qué vale −√{n} y qué vale √(−{n})?", f"−{r}; no existe", "t2_raiz_ent", {"n": n, "tipo": tipo},
                  [(f"No existe; −{r}", "confunde_menos"), (f"−{r}; −{r}", "raiz_negativo"), (f"{r}; −{r}", None)],
                  [(f"−√{n}", f"−{r}", f"−√{n}: primero √{n} = {r} y luego el signo: −{r}."),
                   (f"√(−{n})", "no existe", f"√(−{n}): ningún número al cuadrado da −{n}, no existe.")], adulto)
    return mk(f"Calcula: −√{n}", f"−{r}", "t2_raiz_ent", {"n": n, "tipo": tipo},
              [("No existe", "confunde_menos"), (f"{r}", None), (f"{r} y −{r}", None)],
              [(f"√{n}", str(r), f"Primero la raíz: √{n} = {r}."), ("signo", f"−{r}", f"El − de fuera cambia el signo: −{r}.")], adulto)


def dec(x, nd):
    s = f"{x:.{nd}f}"
    return s.replace(".", ",")


@generador("t2_raiz_fracdec")
def gen_raiz_fracdec(rng, d):
    """Raíz de fracciones y decimales; aproximación. Claves: coma_mal (√0,81 = 0,09), solo_numerador (√(49/64) = 7/64), por_exceso
    (aproxima por exceso o redondea mal), termino_a_termino (√(a + b) = √a + √b)."""
    tipo = rng.choice({1: ["fraccion", "decimal"], 2: ["decimal", "aprox", "fraccion"], 3: ["aprox", "suma", "decimal"]}[d])
    adulto = ("√(a/b) = √a/√b (raíz de numerador y denominador). En decimales, el radicando tiene el doble de cifras decimales que la raíz "
              "(0,81 → 0,9). Aproximar por defecto es quedarse con el mayor valor cuyo cuadrado no se pasa. La raíz de una suma NO es la suma de raíces.")
    if tipo == "fraccion":
        a, b = rng.randint(1, 12), rng.randint(2, 15)
        while math.gcd(a, b) != 1 or a == b:
            a, b = rng.randint(1, 12), rng.randint(2, 15)
        return mk(f"Calcula: √({a * a}/{b * b})", f"{a}/{b}", "t2_raiz_frac", {"a": a, "b": b},
                  [(f"{a}/{b * b}", "solo_numerador"), (f"{a * a}/{b}", "solo_numerador"), (fr(F(a, b) + F(1, b)), None)],
                  [(f"√{a * a} y √{b * b}", f"{a} y {b}", f"Raíz del numerador: √{a * a} = {a}. Raíz del denominador: √{b * b} = {b}. Resultado: {a}/{b}.")], adulto,
                  genericos=[f"{a + 1}/{b}", f"{a}/{b + 1}"])
    if tipo == "decimal":
        r = rng.choice([rng.randint(1, 9), rng.randint(11, 30)])
        k = rng.choice([1, 2]) if r < 10 else 1
        rv = r / 10 ** k
        nv = r * r / 10 ** (2 * k)
        return mk(f"Calcula: √{dec(nv, 2 * k)}", dec(rv, k), "t2_raiz_dec", {"r": r, "k": k},
                  [(dec(rv / 10, k + 1), "coma_mal"), (dec(rv * 10, max(k - 1, 0)) if k > 1 else fmt(r), "coma_mal"), (dec(rv + 2 / 10 ** k, k), None)],
                  [(f"{r}²", fmt(r * r), f"Sin la coma: √{r * r} = {r}."),
                   ("coma", dec(rv, k), f"{dec(nv, 2 * k)} tiene {2 * k} decimales, así que la raíz tiene {k}: {dec(rv, k)}. Compruebo: {dec(rv, k)}² = {dec(nv, 2 * k)}.")],
                  adulto, genericos=[dec(rv + 1 / 10 ** k, k), dec(abs(rv - 1 / 10 ** k), k)])
    if tipo == "aprox":
        for _ in range(100):
            n = rng.randint(2, 99)
            if math.isqrt(n) ** 2 != n:
                break
        nd = 1 if d == 2 else rng.choice([1, 2])
        paso = 10 ** nd
        v = math.isqrt(n * paso * paso)  # truncado
        vd = v / paso
        nombre = "las décimas" if nd == 1 else "las centésimas"
        return mk(f"Aproxima √{n} por defecto hasta {nombre}.", dec(vd, nd), "t2_raiz_aprox", {"n": n, "nd": nd},
                  [(dec((v + 1) / paso, nd), "por_exceso"), (dec((v - 1) / paso, nd), None), (dec((v + 2) / paso, nd), None)],
                  [("cuadrados", f"{dec(vd, nd)}² y {dec((v + 1) / paso, nd)}²",
                    f"{dec(vd, nd)}² = {dec(vd * vd, 2 * nd)} ≤ {n} y {dec((v + 1) / paso, nd)}² = {dec(((v + 1) / paso) ** 2, 2 * nd)} > {n}."),
                   ("por defecto", dec(vd, nd), f"Por defecto me quedo con el menor: √{n} ≈ {dec(vd, nd)}.")], adulto)
    a, b, c = rng.choice([(3, 4, 5), (6, 8, 10), (5, 12, 13), (8, 6, 10), (4, 3, 5), (12, 5, 13)])
    den = rng.choice([2, 3, 4, 7, 9, 11])
    D = den * den
    return mk(f"Calcula: √({a * a}/{D} + {b * b}/{D})", fr(F(c, den)), "t2_raiz_frac", {"a": a, "b": b, "den": den},
              [(fr(F(a + b, den)), "termino_a_termino"), (fr(F(c, D)), "solo_numerador"), (fr(F(c * c, den)), None)],
              [("sumar", f"{c * c}/{D}", f"Primero la suma de dentro: {a * a}/{D} + {b * b}/{D} = {c * c}/{D}."),
               ("raíz", fr(F(c, den)), f"√({c * c}/{D}) = √{c * c}/√{D} = {c}/{den}.")], adulto)
