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
    if tipo == "suma_a_mult":
        n = max(n, 3)
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
