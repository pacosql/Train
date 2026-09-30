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
