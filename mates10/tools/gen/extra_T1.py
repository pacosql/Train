"""Generadores del grupo T1 (numeración y suma/resta/cálculo mental de primaria), uno por habilidad.

Cada generador se llama "t1_<familia><nn>" (p. ej. t1_cont01 = NUM.CONT.01) y devuelve distractores cuya clave es
directamente el sufijo del error típico de esa habilidad ("E01", "E02"…); los distractores sin error llevan clave None
o van en `genericos`. Los modos (`modos`) se eligen en la spec con kw_por_dificultad.
"""
from .nucleo import Ejercicio, generador, fmt, letras, ORDINALES, ICONOS, NOMBRES, OBJETOS, genericos_num

NINAS = ["Lucía", "Martina", "Sofía", "Julia", "Paula", "Valeria", "Emma", "Carla", "Noa", "Alba", "Sara", "Olivia", "Aitana",
         "Vega", "Lola", "Irene", "Claudia", "Aya"]
NINOS = ["Hugo", "Mateo", "Leo", "Daniel", "Álvaro", "Pablo", "Manuel", "Adrián", "Mario", "Marcos", "Diego", "Iker", "Bruno",
         "Nicolás", "Samuel", "Omar", "Yeray"]


def mk(enun, resp, dist, op, texto, adulto, genericos=None, pasos=None, datos=None, **params):
    """Ejercicio de un paso. resp y valores de dist pueden ser int o str; dist = [(valor, clave)]."""
    r = resp if isinstance(resp, str) else fmt(resp)
    ej = Ejercicio(enunciado=enun, respuesta=r, parametros=dict(op=op, **params), datos=datos)
    ej.distractores = [(v, k) for v, k in dist if v is not None and (isinstance(v, str) or v >= 0)]
    ej.genericos = [g for g in (genericos or []) if g is not None and (isinstance(g, str) or g >= 0)]
    ej.pasos = pasos or [{"paso": 1, "operacion": op, "resultado": r, "texto": texto}]
    ej.explicacion_nino = texto
    ej.explicacion_adulto = adulto
    return ej


def modo(rng, modos, defecto):
    return rng.choice(list(modos)) if modos else defecto


def iconos_filas(n, ic, por_fila=5, desordenado=False, rng=None):
    if not desordenado:
        return "\n".join(ic * min(por_fila, n - i) for i in range(0, n, por_fila))
    filas, quedan = [], n
    while quedan:
        k = min(quedan, rng.randint(1, 4))
        filas.append((" " * rng.randint(0, 4)) + "  ".join([ic] * k))
        quedan -= k
    return "\n".join(filas)


def cifras_concat(*xs):
    return int("".join(str(x) for x in xs))


def sin_ceros(n):
    s = str(n).replace("0", "")
    return int(s) if s else None


# ================================================================ NUM.CONT

@generador("t1_cont01")
def g_cont01(rng, d, desordenado=False):
    lo, hi = {1: (2, 5), 2: (4, 8), 3: (7, 10)}[d]
    n = rng.randint(lo, hi)
    ic = rng.choice(ICONOS)
    dib = iconos_filas(n, ic, 5, desordenado, rng)
    azar = rng.randint(1, max(1, n - 2))
    return mk(f"¿Cuántos hay?\n{dib}", n, [(n + 1, "E01"), (n - 1, "E02"), (azar, "E04")], "contar",
              f"Toca cada dibujo una sola vez mientras cuentas: {', '.join(str(i) for i in range(1, n + 1))}. El último número que dices es cuántos hay: {n}.",
              "Contar bien exige tocar cada objeto una vez y solo una, y saber que el último número dicho es el total. Si se equivoca, que tache o mueva cada objeto al contarlo.",
              genericos=[n + 2, n - 2], datos={"lectura": "¿Cuántos hay?", "sin_lectura": True}, n=n)


def marco10(n, lleno="🔴", vacio="⚪"):
    celdas = [lleno] * n + [vacio] * (10 - n)
    return "".join(celdas[:5]) + "\n" + "".join(celdas[5:])


DADO = {1: "⚀", 2: "⚁", 3: "⚂", 4: "⚃", 5: "⚄", 6: "⚅"}


@generador("t1_cont02")
def g_cont02(rng, d, modos=("dado", "marco10")):
    m = modo(rng, modos, "dado")
    if m == "dado":
        n = rng.randint(1, 6)
        ic = rng.choice(["🎲", "🟥", "🟦"])
        return mk(f"Mira el dado sin contar los puntos uno a uno. ¿Cuántos puntos tiene?\n{DADO[n]}", n,
                  [(n + 1, "E01"), (n - 1 if n > 1 else None, "E01"), (n + 2, None)], "subitizar",
                  f"Es la cara del {n} del dado. Esa forma se aprende de memoria y se reconoce de un vistazo.",
                  "Reconocer cantidades pequeñas sin contar (subitización) agiliza todo el cálculo. Jugad a enseñar caras de dado un segundo y decir el número.",
                  genericos=[n + 3, 7], datos={"lectura": "¿Cuántos puntos tiene el dado?", "sin_lectura": True}, n=n, dibujo=ic)
    lo, hi = {1: (1, 5), 2: (4, 8), 3: (6, 10)}[d]
    n = rng.randint(lo, hi)
    lleno = rng.choice(["🔴", "🔵", "🟢", "🟡"])
    dist = [(10 - n if 10 - n != n else None, "E02"), (5 if n > 5 else None, "E03"), (n + 1 if n < 10 else None, "E01"), (n - 1, "E01")]
    texto = (f"La fila de arriba tiene 5. Abajo hay {n - 5} más: 5 y {n - 5} son {n}." if n > 5 else f"En la fila de arriba hay {n}: se ve sin contar.")
    if n > 5:
        texto += f" También: faltan {10 - n} para 10, así que hay {n}."
    return mk(f"Marco de 10: cuenta los puntos de color (los blancos están vacíos).\n{marco10(n, lleno)}", n, dist, "subitizar", texto,
              "El marco de 10 enseña a ver los números como «5 y algo» o «10 menos algo», clave para sumar y restar con la decena.",
              genericos=[n + 2, n - 2], datos={"lectura": "¿Cuántos puntos de color hay en el marco?", "sin_lectura": True}, n=n)


def _serie_ej(serie, paso, dist, adulto, genericos=None):
    ult = serie[-1]
    sig = ult + paso
    txt = f"Cada número es {abs(paso)} {'más' if paso > 0 else 'menos'} que el anterior: {fmt(ult)} {'+' if paso > 0 else '−'} {abs(paso)} = {fmt(sig)}."
    return mk(f"¿Qué número sigue? {', '.join(fmt(x) for x in serie)}, …", sig, dist, "serie", txt, adulto,
              genericos=genericos if genericos is not None else [sig + 1, sig - 1, sig + 2], serie=serie, paso=paso)


@generador("t1_cont03")
def g_cont03(rng, d, modos=("contar", "siguiente")):
    m = modo(rng, modos, "siguiente")
    if m == "contar":
        n = rng.randint(11, 15 if d == 1 else 20)
        ic = rng.choice(ICONOS)
        return mk(f"¿Cuántos hay?\n{iconos_filas(n, ic, 5)}", n, [(n + 1, "E01"), (n - 1, None), (n + 2, "E01")], "contar",
                  f"Cuenta de 5 en 5 las filas completas y luego los sueltos: llegas a {n} ({letras(n)}).",
                  "De 11 a 15 los nombres son irregulares (once… quince): conviene contar en voz alta a menudo.",
                  genericos=[n - 2, n + 3], datos={"lectura": "¿Cuántos hay?", "sin_lectura": True}, n=n)
    n = rng.randint(10, 17) if d < 3 else rng.choice([18, 19, 19, 16, 17])
    s = n + 1
    if rng.random() < 0.5:
        enun = f"¿Qué número va después del {n}?"
    else:
        k = rng.randint(2, 4)
        enun = f"¿Qué número sigue? {', '.join(str(x) for x in range(n - k + 1, n + 1))}, …"
    dist = [(s + 1, "E01"), (10 if n == 19 else None, "E02"), (n - 1, "E03"), (n, None)]
    return mk(enun, s, dist, "siguiente",
              f"El siguiente es uno más: {n} + 1 = {s} ({letras(s)}).",
              "Contar hasta 20 exige aprenderse los nombres irregulares. El paso del 19 al 20 («veinte») suele costar.",
              genericos=[s + 2, s - 3], n=n)


@generador("t1_cont04")
def g_cont04(rng, d):
    if d == 1:
        n = rng.choice([x for x in range(20, 99) if x % 10 != 9])
    else:
        n = rng.choice(range(29, 99, 10)) if d == 3 or rng.random() < 0.6 else rng.choice([x for x in range(20, 99) if x % 10 in (7, 8)])
    s = n + 1
    forma = rng.randint(0, 2)
    if forma == 0:
        enun = f"¿Qué número va después del {n}?"
    else:
        k = rng.randint(2, 4)
        enun = f"¿Qué número sigue? {', '.join(str(x) for x in range(n - k + 1, n + 1))}, …"
    nueve = n % 10 == 9
    dist = [(n - 9 if nueve else None, "E01"), (n + 11 if nueve else None, "E02"),
            ({59: 70, 69: 80}.get(n), "E03"), (s + 1, None), (n - 1, None), (s + 10, None)]
    txt = f"El siguiente es uno más: {n} + 1 = {s}." + (f" Al pasar del 9 se completa una decena: después de {n} viene {s} ({letras(s)})." if nueve else "")
    return mk(enun, s, dist, "siguiente", txt,
              "El paso de decena (29 → 30) es el punto delicado: que diga la serie en voz alta con una tabla del 100 delante.", n=n)


@generador("t1_cont05")
def g_cont05(rng, d):
    if d == 1:
        n = rng.choice([x for x in range(2, 100) if x % 10 not in (0, 1)])
    else:
        n = rng.choice(range(10, 100, 10)) if d == 3 or rng.random() < 0.6 else rng.choice([x for x in range(11, 100) if x % 10 == 1])
    a = n - 1
    if rng.random() < 0.5:
        enun = f"¿Qué número va antes del {n}?"
    else:
        k = rng.randint(2, 4)
        enun = f"Cuenta hacia atrás. ¿Qué número sigue? {', '.join(str(x) for x in range(n + k - 1, n - 1, -1))}, …"
    dec = n % 10 == 0
    dist = [(n + 1, "E01"), (n + 9 if dec else None, "E02"), (n - 10 if dec else None, "E03"), (a - 1, None), (a + 10, None), (a - 10, None)]
    return mk(enun, a, dist, "anterior", f"El anterior es uno menos: {n} − 1 = {a}." + (" Al bajar de una decena exacta, las unidades pasan a 9 y la decena baja una." if dec else ""),
              "Contar hacia atrás cuesta más que hacia delante. El paso de 40 a 39 es el momento crítico.", n=n)


@generador("t1_cont06")
def g_cont06(rng, d, modos=("adelante_decena", "adelante", "atras")):
    m = modo(rng, modos, "adelante")
    k = rng.randint(3, 4)
    if m == "atras":
        u = rng.randint(0, 9)
        ini = rng.randint(k, 9) * 10 + u
        serie = [ini - 10 * i for i in range(k)]
        ult = serie[-1]
        if ult - 10 < 0:
            return None
        dist = [(ult - 1, "E01"), (ult - 11, "E02"), (ult + 10, "E03")]
        paso = -10
    else:
        u = 0 if m == "adelante_decena" else rng.randint(1, 9)
        ini = rng.randint(0 if u else 1, 9 - k) * 10 + u
        serie = [ini + 10 * i for i in range(k)]
        ult = serie[-1]
        if ult + 10 > 99:
            return None
        dist = [(ult + 1, "E01"), (ult + 11, "E02"), (ult - 10, None)]
        paso = 10
    return _serie_ej(serie, paso, dist, "Contando de 10 en 10 solo cambia la cifra de las decenas; las unidades se quedan igual.",
                     genericos=[ult + 2 * paso, ult + paso + 1, ult + paso - 1])


@generador("t1_cont07")
def g_cont07(rng, d, modos=("adelante_par", "adelante_impar", "cruce", "atras")):
    m = modo(rng, modos, "adelante_par")
    k = rng.randint(3, 4)
    for _ in range(50):
        if m == "atras":
            ini = rng.randint(12, 99)
            serie = [ini - 2 * i for i in range(k)]
            paso = -2
        else:
            ini = rng.randint(0, 90)
            if m == "adelante_par" and ini % 2:
                ini += 1
            if m == "adelante_impar" and ini % 2 == 0:
                ini += 1
            serie = [ini + 2 * i for i in range(k)]
            paso = 2
        sig = serie[-1] + paso
        cruza = sig // 10 != serie[-1] // 10
        if not (0 <= sig <= 99):
            continue
        if m == "cruce" and not cruza:
            continue
        break
    else:
        return None
    ult = serie[-1]
    if paso > 0:
        dist = [(ult + 1, "E01"), (ult + 4, "E02"), ((sig // 10) * 10 - 10 + sig % 10 if cruza else None, "E03"), (ult + 3, None)]
    else:
        dist = [(ult - 1, "E01"), (ult - 4, "E02"), (ult + 2, None), (ult - 3, None)]
    return _serie_ej(serie, paso, dist, "Contar de 2 en 2 es saltarse un número cada vez. Al pasar de decena (28, 30, 32) hay que tener cuidado.",
                     genericos=[sig + 2, sig - 1, sig + 1])


@generador("t1_cont08")
def g_cont08(rng, d, modos=("adelante", "atras")):
    m = modo(rng, modos, "adelante")
    k = rng.randint(3, 4)
    if m == "atras":
        ini = rng.randint(k, 20) * 5
        serie = [ini - 5 * i for i in range(k)]
        paso = -5
        ult = serie[-1]
        dist = [(ult - 1, "E01"), (ult - 10, "E02"), (ult + 5, "E03")]
    else:
        top = 10 if d == 1 else 20
        ini = rng.randint(0, top - k) * 5
        serie = [ini + 5 * i for i in range(k)]
        paso = 5
        ult = serie[-1]
        dist = [(ult + 1, "E01"), (ult + 10, "E02"), (ult - 5, None)]
    sig = ult + paso
    if not 0 <= sig <= 100:
        return None
    return _serie_ej(serie, paso, dist, "De 5 en 5 los números terminan siempre en 0 o en 5, alternando.", genericos=[sig + 1, sig - 1, sig + 5])


@generador("t1_cont09")
def g_cont09(rng, d, modos=("siguiente", "anterior")):
    m = modo(rng, modos, "siguiente")
    for _ in range(100):
        if d == 1:
            n = rng.randint(101, 998)
            if n % 10 in (0, 9):
                continue
        elif d == 2:
            n = rng.randint(10, 99) * 10 + (9 if m == "siguiente" else 0)
            if n % 100 in (0, 99):
                continue
        else:
            n = rng.randint(1, 9) * 100 + (-1 if m == "siguiente" else 0)
            if m == "anterior" and n == 100 and rng.random() < 0.5:
                pass
        if 99 <= n <= 999 and not (m == "siguiente" and n == 999) and not (m == "anterior" and n == 99):
            break
    else:
        return None
    if m == "siguiente":
        r = n + 1
        enun = f"¿Qué número va después del {n}?" if rng.random() < 0.6 else f"¿Qué número sigue? {n - 2}, {n - 1}, {n}, …"
        cen = n % 100 == 99
        dist = [(n - 99 if cen else None, "E01"), (cifras_concat(n // 100, 100) if cen and n >= 199 else None, "E02"),
                (n - 9 if n % 10 == 9 and not cen else None, None), (r + 1, None), (n - 1, None), (r + 10, None)]
        txt = f"El siguiente es uno más: {n} + 1 = {r}." + (" Se completa una centena: las decenas y unidades pasan a 0 y la centena sube una." if cen else "")
    else:
        r = n - 1
        enun = f"¿Qué número va antes del {n}?" if rng.random() < 0.6 else f"Cuenta hacia atrás. ¿Qué número sigue? {n + 2}, {n + 1}, {n}, …"
        cen = n % 100 == 0
        dist = [(n + 99 if cen else None, "E03"), (n - 10 if cen else None, "E03"), (n + 9 if n % 10 == 0 and not cen else None, None),
                (n + 1, None), (r - 1, None), (r - 10, None)]
        txt = f"El anterior es uno menos: {n} − 1 = {r}." + (" Al bajar de una centena exacta, las decenas y las unidades pasan a 9." if cen else "")
    return mk(enun, r, dist, "siguiente_anterior", txt,
              "Los pasos de centena (199 → 200, 300 → 299) son los que más fallan. Ayuda escribir la serie en una tira y leerla en voz alta.", n=n)


@generador("t1_cont10")
def g_cont10(rng, d, modos=("d10_adelante", "d100", "d10_atras", "cruce")):
    m = modo(rng, modos, "d10_adelante")
    k = 3
    for _ in range(200):
        if m == "d100":
            paso = rng.choice([100, -100])
            ini = rng.randint(0, 999)
        else:
            paso = 10 if m in ("d10_adelante",) else -10 if m == "d10_atras" else rng.choice([10, -10])
            ini = rng.randint(0, 999)
        serie = [ini + paso * i for i in range(k)]
        sig = serie[-1] + paso
        if min(serie + [sig]) < 0 or max(serie + [sig]) > 999:
            continue
        cruza = sig // 100 != serie[-1] // 100
        if abs(paso) == 10 and ((m == "cruce") != cruza or (m != "cruce" and any(x // 100 != serie[0] // 100 for x in serie))):
            continue
        break
    else:
        return None
    ult = serie[-1]
    dist = []
    if cruza and abs(paso) == 10:
        dist.append(((ult // 100) * 100 + sig % 100, "E01"))
        if paso > 0 and ult % 100 == 90 and ult >= 100:
            dist.append((cifras_concat(ult // 100, 100), "E02"))
    if abs(paso) == 10:
        dist.append((ult + (100 if paso > 0 else -100), "E03"))
    else:
        dist.append((ult + (10 if paso > 0 else -10), "E04"))
    dist += [(ult + (1 if paso > 0 else -1), None), (ult - paso, None)]
    return _serie_ej(serie, paso, dist, "En las series de 10 en 10 cambia la cifra de las decenas (y al pasar de 90 cambia la centena); de 100 en 100 solo cambia la de las centenas.",
                     genericos=[sig + paso, sig + (1 if paso > 0 else -1)])


@generador("t1_cont11")
def g_cont11(rng, d, modos=("adelante",)):
    m = modo(rng, modos, "adelante")
    p = rng.choice([3, 4])
    otro = 4 if p == 3 else 3
    k = 3
    maxm = 40 // p
    if m == "atras":
        i0 = rng.randint(k, maxm)
        serie = [(i0 - i) * p for i in range(k)]
        ult = serie[-1]
        if ult - p < 0:
            return None
        dist = [(ult - 1, "E01"), (ult - 2, "E01"), (ult - 2 * p, "E02"), (ult - otro, "E03")]
        paso = -p
    else:
        i0 = rng.randint(0 if d == 1 else 2, maxm - k)
        serie = [(i0 + i) * p for i in range(k)]
        ult = serie[-1]
        if ult + p > 40:
            return None
        dist = [(ult + otro, "E03"), (ult + 1, "E01"), (ult + 2 * p, "E02"), (ult + 2, "E01")]
        if p == 3:
            dist = [(ult + 4, "E03"), (ult + 1, "E01"), (ult + 6, "E02"), (ult + 2, "E01")]
        paso = p
    return _serie_ej(serie, paso, dist, f"Contar de {p} en {p} prepara la tabla del {p}: cada número es {p} más que el anterior.",
                     genericos=[ult + paso + 1, ult + paso - 1])


@generador("t1_cont12")
def g_cont12(rng, d, modos=("p1000", "p100", "cruce")):
    m = modo(rng, modos, "p100")
    k = 3
    for _ in range(300):
        if m == "p1000":
            paso = rng.choice([1000, -1000])
        elif m == "p100":
            paso = rng.choice([100, -100])
        else:
            paso = rng.choice([1, 10, 100, -1, -10, -100])
        ini = rng.randint(1000, 9999)
        if abs(paso) >= 100 and rng.random() < 0.6:
            ini -= ini % abs(paso)
        serie = [ini + paso * i for i in range(k)]
        sig = serie[-1] + paso
        if min(serie + [sig]) < 1000 or max(serie + [sig]) > 9999:
            continue
        cruza = sig // 1000 != serie[-1] // 1000
        if (m == "cruce") != cruza:
            continue
        if m != "cruce" and any(x // 1000 != serie[0] // 1000 for x in serie) and abs(paso) < 1000:
            continue
        break
    else:
        return None
    ult = serie[-1]
    dist = []
    if cruza and abs(paso) < 1000:
        dist.append(((ult // 1000) * 1000 + sig % 1000, "E01"))
        if paso > 0 and sig % 1000 == 0:
            dist.append((cifras_concat(ult // 1000, 1000), "E02"))
    if abs(paso) == 100:
        dist.append((ult + (1000 if paso > 0 else -1000), "E03"))
    elif abs(paso) == 1000:
        dist.append((ult + (100 if paso > 0 else -100), "E03"))
    s = 1 if paso > 0 else -1
    dist += [(ult + s * (10 if abs(paso) != 10 else 1), None), (ult - paso, None), (sig + paso, None)]
    return _serie_ej(serie, paso, dist, "Con números de cuatro cifras, mira qué cifra cambia en cada salto; al pasar de 9 en una posición, se cambia también la de la izquierda.",
                     genericos=[sig + paso, sig + s])


# ================================================================ NUM.DESC

NOM = ["unidades", "decenas", "centenas", "unidades de millar", "decenas de millar", "centenas de millar", "unidades de millón",
       "decenas de millón", "centenas de millón"]
NOM1 = ["unidad", "decena", "centena", "unidad de millar", "decena de millar", "centena de millar", "unidad de millón",
        "decena de millón", "centena de millón"]


def _cant(k, pos):
    return f"{k} {NOM1[pos] if k == 1 else NOM[pos]}"


def _partes(n):
    s = str(n)
    return [int(c) * 10 ** (len(s) - 1 - j) for j, c in enumerate(s) if c != "0"]


def _num_con_ceros(rng, cifras, prob=0.3):
    s = [str(rng.randint(1, 9))] + [("0" if rng.random() < prob else str(rng.randint(1, 9))) for _ in range(cifras - 1)]
    return int("".join(s))


ADULTO_POS = "El valor de una cifra depende del lugar que ocupa. Una tabla de columnas (U, D, C, UM…) o bloques de base 10 ayudan mucho."


@generador("t1_desc01")
def g_desc01(rng, d, modos=("du_a_numero",)):
    m = modo(rng, modos, "du_a_numero")
    dd = rng.randint(1, 9)
    u = rng.randint(1, 9) if d < 3 or rng.random() < 0.6 else 0
    n = 10 * dd + u
    if m == "numero_a_du":
        resp = f"{_cant(dd, 1)} y {_cant(u, 0)}"
        dist = [(f"{_cant(u, 1)} y {_cant(dd, 0)}" if u != dd and u else None, "E01"), (f"{_cant(dd, 1)} y {_cant(n, 0)}", None),
                (f"{_cant(dd + 1, 1)} y {_cant(u, 0)}" if dd < 9 else None, None), (f"{_cant(dd - 1, 1)} y {_cant(u + 10, 0)}", None)]
        return mk(f"¿Cuántas decenas y unidades tiene el número {n}?", resp, dist, "du", f"En {n}, el {dd} está en las decenas y el {u} en las unidades: {resp}.",
                  ADULTO_POS, genericos=[f"{_cant(dd, 1)} y {_cant(u + 1, 0)}"], n=n)
    if m == "bloques":
        dib = "▮" * dd + ("  " + "▪" * u if u else "")
        enun = f"Cada barra ▮ vale 10 y cada cubito ▪ vale 1.\n{dib}\n¿Qué número es?"
    else:
        enun = f"¿Qué número tiene {_cant(dd, 1)} y {_cant(u, 0)}?" if u else f"¿Qué número tiene {_cant(dd, 1)} y ninguna unidad?"
    dist = [(10 * u + dd if u and u != dd else None, "E01"), (dd + u if dd + u != n else None, "E02"), (dd if u == 0 else None, "E03"),
            (n + 10 if n < 90 else n - 10, None), (n + 1, None)]
    return mk(enun, n, dist, "du", f"{_cant(dd, 1)} son {10 * dd}" + (f", y {_cant(u, 0)} más: {10 * dd} + {u} = {n}." if u else f". Como no hay unidades, se escribe un 0: {n}."),
              ADULTO_POS, genericos=[n - 1, n + 2], n=n)


@generador("t1_desc02")
def g_desc02(rng, d, modos=("componer", "descomponer", "valor")):
    m = modo(rng, modos, "componer")
    dd, u = rng.randint(1, 9), rng.randint(1, 9)
    n = 10 * dd + u
    if m == "componer":
        return mk(f"¿Qué número es {10 * dd} + {u}?", n, [(cifras_concat(10 * dd, u), "E03"), (10 * u + dd if u != dd else None, None), (dd + u, None)],
                  "componer", f"{10 * dd} son {dd} decenas y {u} son {u} unidades: juntos forman {n}.", ADULTO_POS, genericos=[n + 10, n - 1], n=n)
    if m == "descomponer":
        resp = f"{10 * dd} + {u}"
        return mk(f"¿Cómo se descompone {n}?", resp, [(f"{dd} + {u}", "E02"), (f"{dd} + {10 * u}", None), (f"{10 * dd} + {10 * u}", None)],
                  "descomponer", f"El {dd} de {n} está en las decenas y vale {10 * dd}; el {u} vale {u}. Así, {n} = {resp}.", ADULTO_POS,
                  genericos=[f"{10 * (dd + 1)} + {u}", f"{10 * dd} + {u + 1}"], n=n)
    cual = rng.choice(["d", "u"])
    c, val = (dd, 10 * dd) if cual == "d" else (u, u)
    if dd == u:
        return None
    if cual == "d":
        dist = [(c, "E01"), (100 * c, None), (n, None)]
    else:
        dist = [(10 * c, None), (n, None), (c + 1, None)]
    return mk(f"¿Cuánto vale el {c} en el número {n}?", val, dist, "valor_cifra",
              f"El {c} está en las {'decenas' if cual == 'd' else 'unidades'}, así que vale {val}.", ADULTO_POS, genericos=[c * 100 + 1], n=n)


@generador("t1_desc03")
def g_desc03(rng, d, modos=("cdu_a_numero", "valor", "desordenado", "numero_a_cdu")):
    m = modo(rng, modos, "cdu_a_numero")
    ceros = d == 3
    n = _num_con_ceros(rng, 3, 0.35 if ceros else 0)
    c, dd, u = (int(x) for x in str(n))
    if m in ("cdu_a_numero", "desordenado"):
        piezas = [(c, 2), (dd, 1), (u, 0)]
        if m == "desordenado":
            orden = piezas[:]
            while orden == piezas:
                rng.shuffle(orden)
        else:
            orden = piezas
        txt = ", ".join(_cant(k, p) for k, p in orden[:-1]) + " y " + _cant(*orden[-1])
        dist = [(sin_ceros(n) if "0" in str(n) else None, "E01"), (cifras_concat(*[k for k, _ in orden]) if orden != piezas and orden[0][0] else None, "E03"),
                (int(str(n)[::-1]) if n % 10 else None, None), (n + 10 if dd < 9 else n - 10, None), (n + 100 if c < 9 else n - 100, None)]
        return mk(f"¿Qué número tiene {txt}?", n, dist, "cdu",
                  f"Coloco cada cantidad en su columna: {c} en las centenas, {dd} en las decenas y {u} en las unidades. Es el {n}." +
                  (" Donde no hay nada se escribe un 0." if "0" in str(n) else ""), ADULTO_POS, n=n)
    if m == "numero_a_cdu":
        resp = f"{c} c, {dd} d y {u} u"
        dist = [(f"{u} c, {dd} d y {c} u" if u != c else None, None), (f"{c} c, {10 * c + dd} d y {u} u", None), (f"{c} c, {u} d y {dd} u" if u != dd else None, None),
                (f"{c + 1} c, {dd} d y {u} u" if c < 9 else f"{c - 1} c, {dd} d y {u} u", None)]
        return mk(f"¿Cuántas centenas (c), decenas (d) y unidades (u) tiene {n}?", resp, dist, "cdu", f"En {n}: {c} en las centenas, {dd} en las decenas y {u} en las unidades.",
                  ADULTO_POS, n=n)
    pos = rng.choice([p for p, k in ((2, c), (1, dd)) if k])
    k = int(str(n)[2 - pos])
    if str(n).count(str(k)) > 1:
        return None
    val = k * 10 ** pos
    dist = [(k, "E02"), (k * 10 if pos == 2 else None, "E02"), (k * 100 if pos == 1 else None, None), (n, None)]
    return mk(f"¿Cuánto vale el {k} en el número {n}?", val, dist, "valor_cifra", f"El {k} está en las {NOM[pos]}: vale {val}.", ADULTO_POS, n=n)


@generador("t1_desc04")
def g_desc04(rng, d, modos=("d_a_u", "c_a_d", "doble")):
    m = modo(rng, modos, "d_a_u")
    if m == "d_a_u":
        dd, u = rng.randint(1, 8), rng.randint(10, 19)
        n = 10 * dd + u
        txt = f"{_cant(dd, 1)} y {_cant(u, 0)}"
        dist = [(cifras_concat(dd, u), "E01"), (10 * dd + u % 10, "E02"), (dd + u, None), (n + 10, None)]
        exp = f"{u} unidades son 1 decena y {u - 10} unidades. Entonces hay {dd + 1} decenas y {u - 10} unidades: {n}."
    elif m == "c_a_d":
        c, dd, u = rng.randint(1, 8), rng.randint(10, 19), rng.randint(0, 9)
        n = 100 * c + 10 * dd + u
        txt = f"{_cant(c, 2)}, {_cant(dd, 1)} y {_cant(u, 0)}" if u else f"{_cant(c, 2)} y {_cant(dd, 1)}"
        dist = [(cifras_concat(c, dd, u) if u else cifras_concat(c, dd, 0), "E01"), (100 * c + 10 * (dd % 10) + u, "E02"), (n + 100, None), (n - 10, None)]
        exp = f"{dd} decenas son 1 centena y {dd - 10} decenas. Hay {c + 1} centenas, {dd - 10} decenas y {u} unidades: {n}."
    else:
        c, dd, u = rng.randint(1, 7), rng.randint(10, 19), rng.randint(10, 19)
        n = 100 * c + 10 * dd + u
        txt = f"{_cant(c, 2)}, {_cant(dd, 1)} y {_cant(u, 0)}"
        dist = [(cifras_concat(c, dd, u), "E01"), (100 * c + 10 * (dd % 10) + u % 10, "E02"), (n - 10, None), (n + 100, None)]
        exp = f"{u} unidades son 1 decena y {u - 10} unidades; {dd} decenas son 1 centena y {dd - 10} decenas. En total: {n}."
    return mk(f"¿Qué número forman {txt}?", n, dist, "canje", exp,
              "Canjear 10 unidades por 1 decena (y al revés) es justo lo que se hace al «llevar» en la suma y la resta. Con bloques o monedas se entiende enseguida.", n=n)


@generador("t1_desc05")
def g_desc05(rng, d, modos=("descomponer", "componer", "desordenado")):
    m = modo(rng, modos, "descomponer")
    n = _num_con_ceros(rng, 3, 0 if m == "descomponer" and d == 1 else 0.35)
    partes = _partes(n)
    if m == "descomponer":
        resp = " + ".join(fmt(p) for p in partes)
        s = str(n)
        mal1 = " + ".join(ch for ch in s if ch != "0")
        mal2 = " + ".join(fmt(p // 10 if p >= 100 else p) for p in partes)
        mal3 = " + ".join(fmt(p * 10 if p < 100 else p) for p in partes)
        return mk(f"¿Cómo se descompone {n}?", resp, [(mal1, None), (mal2, None), (mal3, None)], "descomponer",
                  f"Cada cifra vale según su lugar: {resp} = {n}.", ADULTO_POS, n=n)
    if len(partes) < 2:
        return None
    orden = partes[:]
    if m == "desordenado":
        while orden == partes:
            rng.shuffle(orden)
    enun = f"¿Qué número es {' + '.join(fmt(p) for p in orden)}?"
    dist = [(cifras_concat(*orden) if cifras_concat(*orden) < 10 ** 7 else None, "E01"),
            (cifras_concat(*[str(p)[0] for p in orden]) if orden != partes else None, "E02"),
            (sin_ceros(n) if "0" in str(n) else None, "E03"), (n + 10 if n % 100 < 90 else n - 10, None), (n + 100 if n < 900 else n - 100, None)]
    return mk(enun, n, dist, "componer", f"Pongo cada sumando en su columna (centenas, decenas, unidades): {' + '.join(fmt(p) for p in partes)} = {n}." +
              (" El lugar vacío se rellena con un 0." if "0" in str(n) else ""), ADULTO_POS, n=n)


def _valor_cifra(rng, n, E_menos, E_mas, E_cifra):
    s = str(n)
    posibles = [i for i, ch in enumerate(s) if ch != "0" and s.count(ch) == 1 and len(s) - 1 - i >= 1]
    if not posibles:
        return None
    i = rng.choice(posibles)
    pos = len(s) - 1 - i
    k = int(s[i])
    val = k * 10 ** pos
    dist = [(k, E_cifra), (val // 10 if pos >= 2 else None, E_menos), (val * 10, E_mas)]
    return mk(f"¿Cuánto vale el {k} en el número {fmt(n)}?", val, dist, "valor_cifra",
              f"El {k} está en las {NOM[pos]}, así que vale {fmt(val)}.", ADULTO_POS, genericos=[val // 100 if pos >= 3 else None, n], n=n, pos=pos)


def _componer_grande(rng, n, E_concat, E_ceros):
    partes = _partes(n)
    if len(partes) < 2:
        return None
    orden = partes[:]
    if rng.random() < 0.3:
        rng.shuffle(orden)
    enun = f"¿Qué número es {' + '.join(fmt(p) for p in orden)}?"
    conc = cifras_concat(*partes)
    dist = [(conc, E_concat), (sin_ceros(n) if "0" in str(n) else None, E_ceros),
            (n + 10 ** (len(str(n)) - 2), None), (n - 10 ** (len(str(n)) - 1) if n >= 2 * 10 ** (len(str(n)) - 1) else None, None),
            (int(str(n)[:-1] + "0" + str(n)[-1]) if len(str(n)) < 9 else None, None)]
    return mk(enun, n, dist, "componer", f"Coloco cada sumando en su columna y relleno con ceros los lugares vacíos: {' + '.join(fmt(p) for p in partes)} = {fmt(n)}.",
              ADULTO_POS, n=n)


def _descomponer_grande(rng, n):
    partes = _partes(n)
    resp = " + ".join(fmt(p) for p in partes)
    mal_menos = " + ".join(fmt(p // 10 if p >= 10 else p) for p in partes)
    mal_mas = " + ".join(fmt(p * 10 if p >= 10 else p) for p in partes)
    mal_cifras = " + ".join(str(p)[0] for p in partes)
    return mk(f"¿Cómo se descompone {fmt(n)}?", resp, [(mal_menos, None), (mal_mas, None), (mal_cifras, None)], "descomponer",
              f"Cada cifra vale según su lugar: {fmt(n)} = {resp}.", ADULTO_POS, n=n)


@generador("t1_desc06")
def g_desc06(rng, d, modos=("descomponer", "valor", "componer")):
    m = modo(rng, modos, "valor")
    n = _num_con_ceros(rng, 4, 0.1 if d == 1 else 0.35)
    if m == "valor":
        return _valor_cifra(rng, n, "E01", None, "E01")
    if m == "componer":
        return _componer_grande(rng, n, "E02", "E03")
    return _descomponer_grande(rng, n)


@generador("t1_desc07")
def g_desc07(rng, d, modos=("total", "equivalencia", "billetes")):
    m = modo(rng, modos, "total")
    if m == "total":
        pos = rng.choice([1, 2]) if d < 3 else rng.choice([1, 2, 3])
        n = rng.randint(100 if pos == 1 else 10, 999) * 10 ** pos if d < 3 else rng.randint(1000, 9999)
        if n > 9999 or n < 1000 and d == 3:
            return None
        n = n - n % 10 ** pos if d < 3 else n
        tot = n // 10 ** pos
        cif = int(str(n)[len(str(n)) - 1 - pos])
        dist = [(cif, "E01"), (n // 10 ** (pos + 1), "E02"), (n // 10 ** (pos - 1) if pos > 1 else n, "E02")]
        enun = f"¿Cuántas {NOM[pos]} hay en total en {fmt(n)}?" if n % 10 ** pos == 0 else f"¿Cuántas {NOM[pos]} completas hay en {fmt(n)}?"
        return mk(enun, tot, dist, "equivalencia", f"Tapo las {pos} últimas cifras y leo lo que queda: en {fmt(n)} hay {fmt(tot)} {NOM[pos]}.",
                  "1 millar = 10 centenas = 100 decenas = 1 000 unidades. Es la base de la división por 10, 100 y 1 000.", n=n, pos=pos)
    if m == "equivalencia":
        pos = rng.choice([1, 2, 3])
        k = rng.randint(2, 99 if pos < 3 else 9) if d == 1 else rng.randint(11, 99)
        val = k * 10 ** pos
        if val > 9999:
            return None
        dist = [(k, "E03"), (k * 10 ** (pos - 1) if pos > 1 else None, "E03"), (k * 10 ** (pos + 1) if k * 10 ** (pos + 1) <= 99999 else None, None), (k + 10 ** pos, None)]
        return mk(f"¿Cuántas unidades son {k} {NOM[pos]}?", val, dist, "equivalencia",
                  f"Cada {NOM1[pos]} son {fmt(10 ** pos)} unidades: {k} × {fmt(10 ** pos)} = {fmt(val)}.",
                  "1 millar = 10 centenas = 100 decenas = 1 000 unidades.", k=k, pos=pos)
    b = rng.choice([10, 100])
    tot = rng.randint(2, 99) * b if b == 10 else rng.randint(2, 99) * 100
    if tot > 9999:
        return None
    q = tot // b
    dist = [(int(str(tot)[-2 if b == 10 else -3]), "E01"), (q // 10 if q >= 10 else None, "E02"), (tot // (b // 10), "E02"), (q + 1, None)]
    nom = rng.choice(NINAS + NINOS)
    return mk(f"{nom} quiere pagar {fmt(tot)} € solo con billetes de {b} €. ¿Cuántos billetes necesita?", q, dist, "billetes",
              f"Cada billete es {b} €. En {fmt(tot)} hay {fmt(q)} {'decenas' if b == 10 else 'centenas'}, así que hacen falta {fmt(q)} billetes.",
              "Pagar con billetes de 10 o de 100 es una forma muy práctica de ver cuántas decenas o centenas tiene un número.", tot=tot, b=b)


@generador("t1_desc08")
def g_desc08(rng, d, modos=("valor", "componer", "descomponer")):
    m = modo(rng, modos, "valor")
    n = _num_con_ceros(rng, rng.choice([5, 6]), 0.3)
    if m == "valor":
        return _valor_cifra(rng, n, "E01", "E01", None)
    if m == "componer":
        return _componer_grande(rng, n, "E02", "E02")
    return _descomponer_grande(rng, n)


SUP = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")


def _pot(k, e):
    return str(k) if e == 0 else f"{k}·10" if e == 1 else f"{k}·10{str(e).translate(SUP)}"


@generador("t1_desc09")
def g_desc09(rng, d, modos=("descomponer", "componer"), cifras=(4, 6)):
    m = modo(rng, modos, "descomponer")
    n = _num_con_ceros(rng, rng.randint(*cifras), 0.35)
    s = str(n)
    terms = [(int(ch), len(s) - 1 - j) for j, ch in enumerate(s) if ch != "0"]
    if len(terms) < 2:
        return None
    expr = " + ".join(_pot(k, e) for k, e in terms)
    if m == "descomponer":
        mal1 = " + ".join(_pot(k, e + 1) for k, e in terms)
        mal2 = " + ".join(_pot(k, e - 1) if e else str(k) for k, e in terms)
        mal3 = " + ".join(f"{k}·{10 ** e}" if e else str(k) for k, e in terms[:1]) + " + " + " + ".join(_pot(k, len(terms) - 1 - i) for i, (k, e) in enumerate(terms[1:], 1))
        return mk(f"Escribe {fmt(n)} con potencias de 10.", expr, [(mal1, "E01"), (mal2, None), (mal3 if mal3 != expr else None, None)], "polinomica",
                  f"Cada cifra se multiplica por la potencia de 10 de su lugar (el exponente es el número de cifras que tiene a su derecha): {fmt(n)} = {expr}.",
                  "10² = 100, 10³ = 1 000… El exponente cuenta los ceros. El error típico es poner como exponente el número de cifras.", n=n)
    mal_e1 = sum(k * 10 ** (e - 1) if e else k for k, e in terms)
    mal_e2 = sum(k * 10 * e if e else k for k, e in terms)
    return mk(f"¿Qué número es {expr}?", n, [(sin_ceros(n), "E03"), (mal_e2, "E02"), (mal_e1, "E01"), (n * 10, None)], "polinomica",
              f"Calculo cada término y los junto: {' + '.join(fmt(k * 10 ** e) for k, e in terms)} = {fmt(n)}. Los lugares vacíos llevan 0.",
              "10ⁿ es un 1 seguido de n ceros; no es 10 · n.", n=n)
