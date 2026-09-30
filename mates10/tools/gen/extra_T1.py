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
    cual = "d" if rng.random() < 0.75 else "u"
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
        dist = [(str(cifras_concat(dd, u)), "E01"), (10 * dd + u % 10, "E02"), (dd + u, None), (n + 10, None)]
        exp = f"{u} unidades son 1 decena y {u - 10} unidades. Entonces hay {dd + 1} decenas y {u - 10} unidades: {n}."
    elif m == "c_a_d":
        c, dd, u = rng.randint(1, 8), rng.randint(10, 19), rng.randint(0, 9)
        n = 100 * c + 10 * dd + u
        txt = f"{_cant(c, 2)}, {_cant(dd, 1)} y {_cant(u, 0)}" if u else f"{_cant(c, 2)} y {_cant(dd, 1)}"
        dist = [(str(cifras_concat(c, dd, u)), "E01"), (100 * c + 10 * (dd % 10) + u, "E02"), (n + 100, None), (n - 10, None)]
        exp = f"{dd} decenas son 1 centena y {dd - 10} decenas. Hay {c + 1} centenas, {dd - 10} decenas y {u} unidades: {n}."
    else:
        c, dd, u = rng.randint(1, 7), rng.randint(10, 19), rng.randint(10, 19)
        n = 100 * c + 10 * dd + u
        txt = f"{_cant(c, 2)}, {_cant(dd, 1)} y {_cant(u, 0)}"
        dist = [(str(cifras_concat(c, dd, u)), "E01"), (100 * c + 10 * (dd % 10) + u % 10, "E02"), (n - 10, None), (n + 100, None)]
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
    dist = [(str(cifras_concat(*orden)), "E01"),
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
    conc = str(cifras_concat(*partes))
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
        mal3 = " + ".join(_pot(k, e + 1) if i == 0 else _pot(k, e) for i, (k, e) in enumerate(terms))
        return mk(f"Escribe {fmt(n)} con potencias de 10.", expr, [(mal1, "E01"), (mal2, None), (mal3, "E01")], "polinomica",
                  f"Cada cifra se multiplica por la potencia de 10 de su lugar (el exponente es el número de cifras que tiene a su derecha): {fmt(n)} = {expr}.",
                  "10² = 100, 10³ = 1 000… El exponente cuenta los ceros. El error típico es poner como exponente el número de cifras.", n=n)
    mal_e1 = sum(k * 10 ** (e - 1) if e else k for k, e in terms)
    mal_e2 = sum(k * 10 * e if e else k for k, e in terms)
    return mk(f"¿Qué número es {expr}?", n, [(sin_ceros(n), "E03"), (mal_e2, "E02"), (mal_e1, "E01"), (n * 10, None)], "polinomica",
              f"Calculo cada término y los junto: {' + '.join(fmt(k * 10 ** e) for k, e in terms)} = {fmt(n)}. Los lugares vacíos llevan 0.",
              "10ⁿ es un 1 seguido de n ceros; no es 10 · n.", n=n)


# ================================================================ NUM.LECT

ADULTO_LECT = "Leer y escribir números exige saber que los ceros no se dicen pero sí se escriben. Los dictados de números con ceros intermedios son la mejor práctica."


def _lect(rng, n, sentido, dist_cifras, dist_letras, extra=""):
    """dist_*: [(valor_int_o_str, clave)] para cada sentido."""
    if sentido == "letras_a_cifras":
        enun = rng.choice([f"¿Cómo se escribe con cifras «{letras(n)}»?", f"Escribe con cifras: {letras(n)}."])
        dist = [(v if isinstance(v, str) else fmt(v), k) for v, k in dist_cifras if v is not None and v != n]
        return mk(enun, fmt(n), dist, "leer", f"«{letras(n)}» se escribe {fmt(n)}.{extra}", ADULTO_LECT,
                  genericos=[fmt(n + 1), fmt(n + 10), fmt(max(0, n - 10))], n=n)
    dist = [(v if isinstance(v, str) else letras(v), k) for v, k in dist_letras if v is not None and v != n]
    return mk(f"¿Cómo se lee {fmt(n)}?", letras(n), dist, "leer", f"{fmt(n)} se lee «{letras(n)}».{extra}", ADULTO_LECT,
              genericos=[letras(n + 1), letras(n + 10), letras(max(0, n - 10))], n=n)


@generador("t1_lect01")
def g_lect01(rng, d, modos=("cantidad", "nombre_a_cifra", "cifra_a_nombre")):
    m = modo(rng, modos, "nombre_a_cifra")
    n = rng.randint(0, 5) if d == 1 else rng.randint(0, 10) if d == 2 else rng.choice([0, 6, 7, 9, 6, 9, 8, 10, 3])
    vec = {6: 7, 7: 6}.get(n)
    if m == "cantidad":
        if n == 0:
            obj = rng.choice(OBJETOS)
            return mk(f"En el plato no queda ninguna {obj[0]}. ¿Qué número dice cuántas {obj[1]} hay?" if obj[0][-1] == "a" else
                      f"En la caja no queda ningún {obj[0]}. ¿Qué número dice cuántos {obj[1]} hay?", 0, [(1, "E03"), (10, None), (2, None)], "leer",
                      "Cuando no hay ninguno, el número es el 0 (cero).", "El cero como «ninguno» no es evidente para un niño pequeño: jugad a quitar objetos hasta que no quede nada.", n=0)
        ic = rng.choice(ICONOS)
        resp = ic * n
        dist = [(ic * (n + 1), None), (ic * (n - 1) if n > 1 else None, None), (ic * {6: 9, 9: 6}.get(n, n + 2), "E01" if n in (6, 9) else None), (ic * (n + 2), None)]
        return mk(f"¿Dónde hay {n} ({letras(n)})?", resp, dist, "leer", f"Cuenta los dibujos de cada opción: la que tiene {n} es la buena.",
                  "Asociar cifra, nombre y cantidad es la base de todo lo demás.", n=n)
    dc = [({6: 9, 9: 6}.get(n), "E01"), (vec, "E04"), (1 if n == 0 else None, "E03"), (n + 1, None), (n - 1 if n else None, None), (n + 2, None)]
    dl = [({6: 9, 9: 6}.get(n), "E01"), (vec, "E04"), (n + 1, None), (n - 1 if n else None, None), (n + 2, None)]
    return _lect(rng, n, "letras_a_cifras" if m == "nombre_a_cifra" else "cifras_a_letras", dc, dl)


@generador("t1_lect02")
def g_lect02(rng, d, modos=("nombre_a_cifra", "cifra_a_nombre")):
    m = modo(rng, modos, "nombre_a_cifra")
    n = rng.randint(11, 15) if d == 1 else rng.randint(11, 20)
    inv = int(str(n)[::-1]) if n != 11 else None
    dieci = cifras_concat(10, n - 10) if 16 <= n <= 19 else None
    irr = [(n - 1 if 12 <= n <= 15 else None, "E03"), (n + 1 if 11 <= n <= 14 else None, "E03")]
    dc = [(inv, "E01"), (str(dieci) if dieci else None, "E02")] + irr + [(n + 10, None), (n - 10 if n > 10 else None, None)]
    dl = [(inv, "E01")] + irr + [(n + 1, None), (n - 1, None), (n + 10, None)]
    return _lect(rng, n, "letras_a_cifras" if m == "nombre_a_cifra" else "cifras_a_letras", dc, dl,
                 " Todos los números del 11 al 19 empiezan por 1 porque tienen una decena.")


@generador("t1_lect05")
def g_lect05(rng, d, modos=("nombre_a_cifra", "cifra_a_nombre")):
    m = modo(rng, modos, "nombre_a_cifra")
    n = rng.randint(21, 99)
    if d == 1:
        n = rng.choice([x for x in range(21, 60) if x % 10])
    if d == 3 and rng.random() < 0.6:
        n = rng.choice(range(60, 80))
    dd, u = divmod(n, 10)
    inv = 10 * u + dd if u and u != dd else None
    sete = n + 10 if dd == 6 else n - 10 if dd == 7 else None
    e04 = {22: 12, 20: 12}.get(n)
    dc = [(inv, "E01"), (str(cifras_concat(10 * dd, u)) if u else None, "E02"), (sete, "E03"), (e04, "E04"), (n + 10 if n < 90 else n - 20, None), (n + 1, None)]
    dl = [(inv, "E01"), (sete, "E03"), (e04, "E04"), (n + 10 if n < 90 else n - 20, None), (n + 1, None)]
    return _lect(rng, n, "letras_a_cifras" if m == "nombre_a_cifra" else "cifras_a_letras", dc, dl)


IRREG = {5: 4, 7: 6, 9: 8}


@generador("t1_lect06")
def g_lect06(rng, d, modos=("nombre_a_cifra", "cifra_a_nombre")):
    m = modo(rng, modos, "nombre_a_cifra")
    if d == 1:
        n = _num_con_ceros(rng, 3, 0)
    else:
        n = _num_con_ceros(rng, 3, 0.4)
        if d == 3 and rng.random() < 0.5:
            n = rng.choice([5, 7, 9]) * 100 + rng.choice([0, rng.randint(1, 9), rng.randint(10, 99)])
        if d == 3 and rng.random() < 0.1:
            n = 100
    c, r = divmod(n, 100)
    conc = str(cifras_concat(100 * c, r)) if r else None
    quit = sin_ceros(n) if "0" in str(n)[1:] and n % 100 else None
    vec = (IRREG[c] * 100 + r) if c in IRREG else None
    dc = [(conc, "E01"), (quit, "E02"), (vec, "E03"), (101 if n == 100 else None, "E04"), (n + 10 if n % 100 < 90 else n - 10, None), (n + 100 if c < 9 else n - 100, None)]
    dl = [(quit, "E02"), (vec, "E03"), ("ciento" if n == 100 else None, "E04"), (n + 10 if n % 100 < 90 else n - 10, None), (n + 100 if c < 9 else n - 100, None)]
    return _lect(rng, n, "letras_a_cifras" if m == "nombre_a_cifra" else "cifras_a_letras", dc, dl)


@generador("t1_lect07")
def g_lect07(rng, d, modos=("nombre_a_cifra", "cifra_a_nombre")):
    m = modo(rng, modos, "nombre_a_cifra")
    n = _num_con_ceros(rng, 4, 0.15 if d == 1 else 0.45)
    mi, r = divmod(n, 1000)
    conc = str(cifras_concat(1000 * mi, r)) if r else None
    s = str(n)
    quit_todos = sin_ceros(n) if "0" in s[1:] and n % 10 else None
    quit_uno = int(s[0] + s[1:].replace("0", "", 1)) if "0" in s[1:] and s[1:].count("0") >= 1 and int(s[0] + s[1:].replace("0", "", 1)) != quit_todos else None
    dc = [(conc, "E01"), (quit_todos, "E02"), (quit_uno, "E02"), (n + 100 if n % 1000 < 900 else n - 100, None), (n + 1000 if mi < 9 else n - 1000, None)]
    dl = [(n // 10 if n % 10 == 0 else None, "E03"), (quit_uno, "E02"), (quit_todos, "E02"), (n + 100 if n % 1000 < 900 else n - 100, None), (n + 1000 if mi < 9 else n - 1000, None)]
    return _lect(rng, n, "letras_a_cifras" if m == "nombre_a_cifra" else "cifras_a_letras", dc, dl)


@generador("t1_lect08")
def g_lect08(rng, d, modos=("nombre_a_cifra", "cifra_a_nombre")):
    m = modo(rng, modos, "nombre_a_cifra")
    n = _num_con_ceros(rng, rng.choice([5, 6]), 0.15 if d == 1 else 0.45)
    mi, r = divmod(n, 1000)
    conc = str(cifras_concat(1000 * mi, r)) if r else None
    corto = cifras_concat(mi, r) if r and r < 100 else None
    sin_mil = f"{letras(mi)} {letras(r)}" if r else None
    dc = [(conc, "E01"), (corto, "E02"), (n + 10000 if n < 990000 else n - 10000, None), (n + 1000, None), (n * 10 if n < 100000 else n // 10, None)]
    dl = [(sin_mil, "E03"), (corto, "E02"), (n + 10000 if n < 990000 else n - 10000, None), (n + 1000, None)]
    return _lect(rng, n, "letras_a_cifras" if m == "nombre_a_cifra" else "cifras_a_letras", dc, dl,
                 " Separo en grupos de tres cifras desde la derecha: el grupo de la izquierda son los miles.")


@generador("t1_lect03")
def g_lect03(rng, d, modos=("nombre_a_cifra", "cifra_a_nombre", "valor")):
    m = modo(rng, modos, "nombre_a_cifra")
    n = _num_con_ceros(rng, rng.choice([7, 8, 9]), 0.35 if d < 3 else 0.5)
    if m == "valor":
        return _valor_cifra(rng, n, "E03", "E03", None)
    M, resto = divmod(n, 10 ** 6)
    mi, u = divmod(resto, 1000)
    conc = str(M * 10 ** 6) + (str(mi * 1000) if mi else "") + (str(u) if u else "")
    conc = conc if conc != str(n) else None
    omit = cifras_concat(M, u) if mi == 0 and u else None
    dup = n * 1000 if mi == 0 and u and n * 1000 < 10 ** 12 else None
    dc = [(conc, "E01"), (omit, "E02"), (dup, "E02"), (n + 10 ** 6 if M < 999 else n - 10 ** 6, None), (n // 10 if n % 10 == 0 else n * 10, None), (n + 1000, None)]
    dl = [(omit, "E02"), (n + 10 ** 6 if M < 999 else n - 10 ** 6, None), (n + 10 ** 5 if (n // 10 ** 5) % 10 < 9 else n - 10 ** 5, None), (n + 1000, None)]
    return _lect(rng, n, "letras_a_cifras" if m == "nombre_a_cifra" else "cifras_a_letras", dc, dl,
                 " Separo en grupos de tres desde la derecha: unidades, miles y millones.")


@generador("t1_lect04")
def g_lect04(rng, d, modos=("nombre_a_cifra", "cifra_a_nombre", "billon")):
    m = modo(rng, modos, "nombre_a_cifra")
    if m == "billon":
        k = rng.randint(1, 999)
        n = k * 10 ** 9
        resp = letras(n)
        dist = [(letras(k * 10 ** 12) if k * 10 ** 12 < 10 ** 15 else None, "E01"), (letras(k * 10 ** 6), None), (letras(k * 10 ** 8) if k < 10 else letras(k * 10 ** 7), None)]
        return mk(f"¿Cómo se lee {fmt(n)}?", resp, dist, "leer",
                  f"Con 9 ceros detrás son miles de millones: {fmt(n)} = «{resp}». Un billón es un millón de millones (12 ceros).",
                  "Ojo: el «billion» inglés son mil millones; en español un billón tiene 12 ceros.", genericos=[letras(k * 10 ** 10)], n=n)
    cifras = rng.randint(10, 12) if d < 3 else rng.randint(13, 15)
    n = _num_con_ceros(rng, cifras, 0.6)
    s = str(n)
    grupos = []
    while s:
        grupos.insert(0, s[-3:])
        s = s[:-3]
    omit = None
    if len(grupos) >= 3:
        # quitar la clase de los miles de millones (o de los millares si no la hay)
        i = len(grupos) - 4 if len(grupos) >= 5 else len(grupos) - 2
        g2 = grupos[:i] + grupos[i + 1:]
        omit = int("".join(g2))
    dc = [(omit, "E02"), (n * 1000 if n * 1000 < 10 ** 16 else n // 1000, "E02" if omit is None else None), (n + 10 ** (cifras - 1) if int(str(n)[0]) < 9 else n - 10 ** (cifras - 1), None),
          (n // 1000 if omit is not None else n * 10, None)]
    dl = [(omit, "E02"), (n * 1000 if n * 1000 < 10 ** 15 else n // 1000, None), (n + 10 ** (cifras - 1) if int(str(n)[0]) < 9 else n - 10 ** (cifras - 1), None),
          (n + 10 ** 6, None)]
    return _lect(rng, n, "letras_a_cifras" if m == "nombre_a_cifra" else "cifras_a_letras", dc, dl,
                 " Separo en grupos de tres: unidades, miles, millones, miles de millones y billones.")


# ================================================================ NUM.ORD

ADULTO_ORD = "Para comparar: primero, ¿cuál tiene más cifras? Si tienen las mismas, se comparan de izquierda a derecha hasta la primera cifra distinta."


def _cmp_frase(a, b):
    return "<" if a < b else ">" if a > b else "="


def _ej_cmp_signo(rng, a, b, E_signo, adulto=ADULTO_ORD):
    """Opciones: afirmaciones «a ? b». Correcta la del signo bueno."""
    sg = _cmp_frase(a, b)
    otros = [x for x in "<>=" if x != sg]
    inv = ">" if sg == "<" else "<" if sg == ">" else None
    resp = f"{fmt(a)} {sg} {fmt(b)}"
    dist = [(f"{fmt(a)} {inv} {fmt(b)}" if inv else None, E_signo)] + [(f"{fmt(a)} {x} {fmt(b)}", None) for x in otros if x != inv]
    dist.append((f"{fmt(b)} {sg} {fmt(a)}" if sg != "=" else None, E_signo))
    txt = (f"{fmt(a)} es {'menor' if sg == '<' else 'mayor'} que {fmt(b)}, así que {resp}. La boca abierta del signo mira al número mayor."
           if sg != "=" else f"Son el mismo número: {resp}.")
    return mk(f"¿Qué comparación es correcta?", resp, dist, "comparar_signo", txt, adulto, genericos=[f"{fmt(b)} = {fmt(a)}" if a != b else f"{fmt(a)} < {fmt(a + 1)}"],
              a=a, b=b)


def _ej_extremo(rng, vals, tipo, claves, adulto=ADULTO_ORD, contexto=None):
    obj = max(vals) if tipo == "mayor" else min(vals)
    dist = [(fmt(v), claves.get(v)) for v in vals if v != obj]
    enun = contexto or f"¿Cuál es el número {tipo}: {', '.join(fmt(v) for v in vals)}?"
    return mk(enun, fmt(obj), dist, "extremo", f"El {tipo} es {fmt(obj)}. " + ADULTO_ORD.split(': ', 1)[1][0].upper() + ADULTO_ORD.split(': ', 1)[1][1:],
              adulto, datos={"opciones_fijas": True}, valores=vals, tipo=tipo)


def _ej_ordenar(rng, vals, asc, E_inv, E_otro=None, otro=None):
    s = sorted(vals, reverse=not asc)
    resp = ", ".join(fmt(v) for v in s)
    inv = ", ".join(fmt(v) for v in reversed(s))
    dist = [(inv, E_inv)]
    if otro:
        dist.append((", ".join(fmt(v) for v in otro), E_otro))
    for _ in range(10):
        t = s[:]
        i = rng.randint(0, len(t) - 2)
        t[i], t[i + 1] = t[i + 1], t[i]
        dist.append((", ".join(fmt(v) for v in t), None))
    return mk(f"Ordena de {'menor a mayor' if asc else 'mayor a menor'}: {', '.join(fmt(v) for v in vals)}", resp, dist, "ordenar",
              f"Busco el {'menor' if asc else 'mayor'}, luego el siguiente… Queda: {resp}.", ADULTO_ORD, valores=vals, asc=asc)


def _unidades_mayor(vals, obj):
    """Número que parecería mayor si se comparan solo las unidades."""
    u = max(vals, key=lambda v: (v % 10, v))
    return u if u != obj else None


def _primera_cifra_mayor(vals, obj):
    u = max(vals, key=lambda v: (int(str(v)[0]), v))
    return u if u != obj and int(str(u)[0]) > int(str(obj)[0]) else None


@generador("t1_ord01")
def g_ord01(rng, d, modos=("mayor", "menor"), maximo=20):
    m = modo(rng, modos, "mayor")
    top = 10 if d == 1 else maximo
    k = 3 if d == 1 else 4
    for _ in range(50):
        vals = rng.sample(range(0 if d > 1 else 1, top + 1), k)
        if d >= 2 and not any(v < 10 for v in vals) or not any(v >= 10 for v in vals) and d >= 2:
            continue
        break
    obj = max(vals) if m == "mayor" else min(vals)
    contrario = min(vals) if m == "mayor" else max(vals)
    claves = {contrario: "E02"}
    if m == "mayor":
        u = _unidades_mayor(vals, obj)
        if u and u != contrario:
            claves[u] = "E03"
    if k == 3:
        vals = vals + [None]
        vals = [v for v in vals if v is not None]
    ej = _ej_extremo(rng, vals, m, claves, "Comparar hasta 20: el que está más lejos contando es el mayor. Con dos cifras, el que tiene decena gana al que no la tiene.")
    if k == 3:
        extra = obj + rng.choice([1, 2]) if m == "menor" else obj - rng.choice([1, 2])
        if extra in vals or extra < 0:
            return None
        ej.distractores.append((fmt(extra), None))
        ej.enunciado = f"¿Cuál es el número {m}: {', '.join(fmt(v) for v in vals + [extra])}?"
        ej.parametros["valores"] = vals + [extra]
    return ej


@generador("t1_ord03")
def g_ord03(rng, d, modos=("signo", "extremo", "ordenar", "intercalar"), maximo=99, E_uni="E02", E_prim="E03", E_signo="E01", E_inv="E04"):
    m = modo(rng, modos, "signo")
    lo = 1 if maximo <= 99 else 10
    if m == "signo":
        a = rng.randint(lo, maximo)
        if d == 3 and rng.random() < 0.5:
            b = int(str(a)[::-1]) if len(str(a)) > 1 and a % 10 else a + rng.choice([1, 10])
        elif rng.random() < 0.15:
            b = a
        else:
            b = rng.randint(lo, maximo)
        if b > maximo or b < 1:
            return None
        return _ej_cmp_signo(rng, a, b, E_signo)
    if m == "extremo":
        tipo = rng.choice(["mayor", "menor"])
        vals = rng.sample(range(lo, maximo + 1), 4)
        if d >= 2:
            # trampas: uno con menos cifras pero primera cifra alta; otro con unidades altas
            vals[0] = rng.randint(7, 9) if maximo <= 99 else rng.randint(60, 99)
        if len(set(vals)) < 4:
            return None
        obj = max(vals) if tipo == "mayor" else min(vals)
        contrario = min(vals) if tipo == "mayor" else max(vals)
        claves = {}
        if tipo == "mayor":
            u = _unidades_mayor(vals, obj)
            p = _primera_cifra_mayor(vals, obj)
            if p:
                claves[p] = E_prim
            if u and u not in claves:
                claves[u] = E_uni
        return _ej_extremo(rng, vals, tipo, claves)
    if m == "ordenar":
        vals = rng.sample(range(lo, maximo + 1), 5 if d == 3 else 4)
        if d == 3 and maximo <= 99:
            dd = rng.randint(1, 8)
            vals = list({10 * dd + rng.randint(0, 9), 10 * dd + rng.randint(0, 9), 10 * (dd + 1) + rng.randint(0, 9), rng.randint(1, 9), 10 * dd + rng.randint(0, 9)})
            if len(vals) < 4:
                return None
        rng.shuffle(vals)
        return _ej_ordenar(rng, vals, rng.random() < 0.6, E_inv)
    a = rng.randint(lo, maximo - 3)
    b = a + 2
    return mk(f"¿Qué número está entre {fmt(a)} y {fmt(b)}?", a + 1, [(a - 1, None), (b + 1, None), (a + 10 if a + 10 != b else a + 11, None)], "intercalar",
              f"Entre {fmt(a)} y {fmt(b)} solo cabe {fmt(a + 1)}: {fmt(a)}, {fmt(a + 1)}, {fmt(b)}.", ADULTO_ORD, a=a, b=b)


@generador("t1_ord02")
def g_ord02(rng, d, modos=("extremo", "signo", "ordenar")):
    m = modo(rng, modos, "extremo")
    def grande(c):
        return rng.randint(10 ** (c - 1), 10 ** c - 1)
    c = rng.randint(5, 9) if d > 1 else rng.randint(4, 6)
    if m == "signo":
        a = grande(c)
        s = list(str(a))
        i = rng.randint(1, len(s) - 2)
        s[i] = str((int(s[i]) + rng.choice([1, 9])) % 10)
        b = int("".join(s))
        return _ej_cmp_signo(rng, a, b, "E03")
    if m == "ordenar":
        vals = [grande(rng.choice([c - 1, c, c])) for _ in range(4)]
        if len(set(vals)) < 4:
            return None
        return _ej_ordenar(rng, vals, rng.random() < 0.5, None)
    tipo = "mayor"
    # trampa E01: número con una cifra menos pero primera cifra 9; trampa E02: misma longitud, primera distinta menor pero cifras posteriores altas
    obj = grande(c)
    if str(obj)[0] == "9":
        obj -= 10 ** (c - 1)
    t1 = rng.randint(9 * 10 ** (c - 2), 10 ** (c - 1) - 1)
    s = str(obj)
    i = 1 + rng.randint(0, c - 3)
    if s[i] == "0":
        s = s[:i] + "1" + s[i + 1:]
        obj = int(s)
    t2 = int(s[:i] + str(int(s[i]) - 1) + "9" * (c - i - 1))
    t3 = obj - rng.randint(1, 10 ** (c - 2))
    vals = [obj, t1, t2, t3]
    if len(set(vals)) < 4 or t3 <= 0:
        return None
    rng.shuffle(vals)
    return _ej_extremo(rng, vals, tipo, {t1: "E01", t2: "E02"})


@generador("t1_ord04")
def g_ord04(rng, d, modos=("uno", "diez", "extremo")):
    m = modo(rng, modos, "uno")
    if m == "diez":
        k = rng.randint(1, 9)
        marks = ["0"] + ["•"] * 9 + ["100"]
        marks[k] = "⬆"
        return mk(f"En esta recta cada marca vale 10 más que la anterior:\n{' '.join(marks)}\n¿Qué número señala la flecha ⬆?", 10 * k,
                  [(k, "E02"), (10 * k - 10 if k > 1 else None, "E01"), (100 - 10 * k if 100 - 10 * k != 10 * k else None, None), (10 * k + 10, None)], "recta",
                  f"Cuento las marcas desde el 0 de 10 en 10: " + ", ".join(str(10 * i) for i in range(1, k + 1)) + f". La flecha está en el {10 * k}.",
                  "En la recta numérica hay que fijarse en cuánto vale cada salto antes de contar marcas.", k=k)
    ini = rng.randint(0, 9) * 10
    fin = ini + 10
    k = rng.randint(1, 9)
    if m == "extremo":
        k = rng.randint(6, 9)
    elif d == 1:
        k = rng.randint(1, 5)
    marks = [str(ini)] + ["•"] * 9 + [str(fin)]
    marks[k] = "⬆"
    v = ini + k
    dist = [(v - 1, "E01"), (fin + (fin - v) if k >= 5 else None, "E03"), (v + 1, None), (ini + (10 - k) if ini + 10 - k != v else None, None)]
    return mk(f"En esta recta hay una marca por cada número:\n{' '.join(marks)}\n¿Qué número señala la flecha ⬆?", v, dist, "recta",
              (f"Empiezo en el {ini} y cuento marcas hacia la derecha: " + ", ".join(str(ini + i) for i in range(1, k + 1)) + f". Es el {v}."
               if k < 6 else f"La flecha está cerca del {fin}: cuento hacia atrás desde el {fin}: " + ", ".join(str(fin - i) for i in range(1, 10 - k + 1)) + f". Es el {v}."),
              "Contar marcas en la recta: no se cuenta la marca de partida, se cuentan los saltos. Si la flecha está cerca del final, conviene contar hacia atrás.",
              ini=ini, k=k)


@generador("t1_ord06")
def g_ord06(rng, d, modos=("diez", "cien", "aprox")):
    m = modo(rng, modos, "diez")
    if m == "aprox":
        n = rng.randint(1, 9) * 100 + rng.choice([rng.randint(10, 40), rng.randint(60, 90)])
        c = n // 100 * 100
        cerca = c if n - c < 50 else c + 100
        lejos = c + 100 if cerca == c else c
        resp = f"entre {c} y {c + 100}, más cerca del {cerca}"
        otra_c = (n % 100) // 10 * 100
        dist = [(f"entre {c} y {c + 100}, más cerca del {lejos}", None),
                (f"entre {otra_c} y {otra_c + 100}, más cerca del {otra_c if otra_c != c else otra_c + 100}" if otra_c != c else None, "E03"),
                (f"entre {c + 100} y {c + 200}, más cerca del {c + 100}" if c < 800 else f"entre {c - 100} y {c}, más cerca del {c}", None),
                (f"entre {c - 100} y {c}, más cerca del {c}" if c >= 100 else None, None)]
        return mk(f"En una recta de 0 a 1000 con marcas de 100 en 100, ¿dónde va el {n}?", resp, dist, "recta_aprox",
                  f"{n} tiene {n // 100} centenas: está entre {c} y {c + 100}. Como {n % 100} {'es menos' if n - c < 50 else 'es más'} de 50, está más cerca del {cerca}.",
                  "Situar un número aproximadamente en la recta prepara el redondeo.", n=n)
    paso = 10 if m == "diez" else 100
    ini = rng.randint(1, 8) * 100 if paso == 10 else 0
    fin = ini + 10 * paso
    k = rng.randint(2, 9)
    marks = [str(ini)] + ["•"] * 9 + [str(fin)]
    marks[k] = "⬆"
    v = ini + k * paso
    dist = [(ini + k, "E01"), (ini + 100 * k if paso == 10 else None, "E02"), (v - paso, None), (v + paso, None), (ini + k * 10 if paso == 100 else None, None)]
    return mk(f"En esta recta cada marca vale {paso} más que la anterior:\n{' '.join(marks)}\n¿Qué número señala la flecha ⬆?", v, dist, "recta",
              f"Cada salto vale {paso}. Desde el {ini} cuento {k} saltos: " + ", ".join(str(ini + paso * i) for i in range(1, k + 1)) + f". Es el {v}.",
              "Antes de contar marcas hay que averiguar cuánto vale cada salto (mirando los números escritos en los extremos).", ini=ini, paso=paso, k=k)


@generador("t1_ord05")
def g_ord05(rng, d, modos=("signo", "extremo", "ordenar", "intercalar")):
    m = modo(rng, modos, "signo")
    if m == "extremo":
        # trampa E01: número de dos cifras con primera cifra alta; trampa E02: mismo centenar y unidades altas
        c = rng.randint(1, 8)
        obj = c * 100 + rng.randint(5, 9) * 10 + rng.randint(0, 4)
        t2 = c * 100 + (obj // 10 % 10 - rng.randint(1, 4)) * 10 + rng.randint(5, 9)
        t1 = rng.randint(max(c + 1, 5), 9) * 10 + rng.randint(0, 9)
        t3 = rng.randint(1, c) * 100 + rng.randint(0, 99) - (100 if c == 1 else 0)
        vals = [obj, t1, t2, t3] if t3 > 0 else None
        if not vals or len(set(vals)) < 4 or max(vals) != obj:
            return None
        rng.shuffle(vals)
        return _ej_extremo(rng, vals, "mayor", {t1: "E01", t2: "E02"})
    if m == "signo":
        a = rng.randint(100, 999)
        s = str(a)
        b = int(s[0] + s[2] + s[1]) if d >= 2 and s[1] != s[2] else rng.randint(10, 999)
        if rng.random() < 0.1:
            b = a
        return _ej_cmp_signo(rng, a, b, "E03")
    return g_ord03(rng, d, modos=(m,), maximo=999, E_inv=None)


@generador("t1_ord07")
def g_ord07(rng, d, modos=("signo", "extremo", "ordenar", "recta")):
    m = modo(rng, modos, "signo")
    if m == "extremo":
        mi = rng.randint(1, 8)
        obj = mi * 1000 + rng.randint(1, 3) * 100 + rng.randint(0, 99)
        t2 = mi * 1000 + (obj // 100 % 10 - 1) * 100 + 99   # «tiene nueves»
        t1 = rng.randint(900, 999)                          # menos cifras, primera cifra alta
        t3 = rng.randint(1000, mi * 1000 - 1) if mi > 1 else obj - rng.randint(1, 50)
        vals = [obj, t1, t2, t3]
        if len(set(vals)) < 4 or max(vals) != obj:
            return None
        rng.shuffle(vals)
        return _ej_extremo(rng, vals, "mayor", {t1: "E01", t2: "E02"})
    if m == "signo":
        a = rng.randint(1000, 9999)
        s = str(a)
        b = int(s[:2] + s[3] + s[2]) if d >= 2 and s[2] != s[3] else rng.randint(900, 9999)
        return _ej_cmp_signo(rng, a, b, "E03")
    if m == "recta":
        paso = rng.choice([100, 1000])
        ini = rng.randint(1, 8) * 1000 if paso == 100 else 0
        k = rng.randint(2, 9)
        marks = [fmt(ini)] + ["•"] * 9 + [fmt(ini + 10 * paso)]
        marks[k] = "⬆"
        v = ini + k * paso
        return mk(f"En esta recta cada marca vale {fmt(paso)} más que la anterior:\n{' '.join(marks)}\n¿Qué número señala la flecha ⬆?", v,
                  [(ini + k * (paso // 10), None), (v - paso, None), (v + paso, None)], "recta",
                  f"Cada salto vale {fmt(paso)}. Desde el {fmt(ini)} cuento {k} saltos y llego al {fmt(v)}.",
                  "Antes de contar marcas hay que averiguar cuánto vale cada salto.", ini=ini, paso=paso, k=k)
    return g_ord03(rng, d, modos=(m,), maximo=9999, E_inv=None)


# ================================================================ NUM.ORDINAL

ORD_F = [o[:-1] + "a" if o else o for o in ORDINALES]
PARTITIVO = {11: "onceavo", 12: "doceavo", 13: "treceavo", 14: "catorceavo", 15: "quinceavo", 16: "dieciseisavo", 17: "diecisieteavo",
             18: "dieciochoavo", 19: "diecinueveavo", 20: "veinteavo"}
DEC_ORD = {2: "vigésimo", 3: "trigésimo", 4: "cuadragésimo", 5: "quincuagésimo", 6: "sexagésimo", 7: "septuagésimo", 8: "octogésimo",
           9: "nonagésimo"}
UNI_ORD = ["", "primero", "segundo", "tercero", "cuarto", "quinto", "sexto", "séptimo", "octavo", "noveno"]
DEC_PART = {3: "treintavo", 4: "cuarentavo", 5: "cincuentavo", 6: "sesentavo", 7: "setentavo", 8: "ochentavo", 9: "noventavo"}


def ordinal(n, f=False):
    if n <= 20:
        o = ORDINALES[n]
    elif n == 100:
        o = "centésimo"
    else:
        dd, u = divmod(n, 10)
        o = DEC_ORD[dd] + ("" if u == 0 else " " + UNI_ORD[u])
    return o[:-1] + "a" if f and o.endswith("o") else o


def abrev(n, f=False):
    return f"{n}.{'ª' if f else 'º'}"


@generador("t1_ordinal01")
def g_ordinal01(rng, d, modos=("abreviatura", "fila", "penultimo")):
    m = modo(rng, modos, "fila")
    f = rng.random() < 0.5
    nom = rng.choice(NINAS if f else NINOS)
    if m == "abreviatura":
        n = rng.randint(1, 10)
        if rng.random() < 0.5:
            enun = f"¿Cómo se escribe con número y letra «{ordinal(n, f)}»?"
            resp = abrev(n, f)
            dist = [(str(n), "E01"), (abrev(n - 1, f) if 7 <= n <= 9 else abrev(n + 1, f), "E03" if 6 <= n <= 9 else None),
                    (abrev(n + 1, f) if 6 <= n <= 8 else None, "E03"), (abrev(n + 10, f), None), (abrev(11 - n, f) if 11 - n != n else None, None)]
        else:
            enun = f"¿Cómo se lee {abrev(n, f)}?"
            resp = ordinal(n, f)
            dist = [(letras(n), "E01"), (ordinal(n - 1, f) if 7 <= n <= 9 else None, "E03"), (ordinal(n + 1, f) if 6 <= n <= 8 else None, "E03"),
                    (ordinal(n + 1, f) if n < 10 else None, None), (ordinal(n - 1, f) if n > 1 else None, None)]
        return mk(enun, resp, dist, "ordinal", f"{abrev(n, f)} se lee «{ordinal(n, f)}».",
                  "Los ordinales dicen el puesto (primero, segundo…), no cuántos hay.", n=n)
    total = rng.randint(5, 10)
    if m == "penultimo":
        p = total - 1
        enun = f"En una fila de {total} niños que miran hacia la meta, {nom} está justo delante del último. ¿Qué puesto ocupa {nom} contando desde la meta?"
    else:
        p = rng.randint(1, total)
        dib = "🏁 " + " ".join("🧒" if i != p else ("👧" if f else "👦") for i in range(1, total + 1))
        enun = f"{dib}\n{nom} ({'👧' if f else '👦'}) está en una fila que empieza en la meta 🏁. ¿En qué puesto está {'ella' if f else 'él'}?"
    resp = ordinal(p, f)
    dist = [(letras(p) if p > 1 else "uno", "E01"), (ordinal(total - p + 1, f) if total - p + 1 != p else None, "E02"),
            (ordinal(p + 1, f) if 6 <= p <= 8 else None, "E03"), (ordinal(p - 1, f) if 7 <= p <= 9 else None, "E03"),
            (ordinal(p + 1, f) if p < 10 else None, None), (ordinal(p - 1, f) if p > 1 else None, None)]
    return mk(enun, resp, dist, "ordinal", f"Cuento desde la meta: {', '.join(ordinal(i, f) for i in range(1, p + 1))}. {nom} es {'la' if f else 'el'} {resp} ({abrev(p, f)}).",
              "Para los puestos hay que fijar desde dónde se cuenta (la meta, la puerta…). Jugad a hacer filas con muñecos y preguntar puestos.",
              n=p, total=total)


@generador("t1_ordinal02")
def g_ordinal02(rng, d, modos=("numero_a_nombre", "nombre_a_numero", "posicion")):
    m = modo(rng, modos, "numero_a_nombre")
    n = rng.randint(11, 20)
    f = rng.random() < 0.3
    confund = {12: 20, 20: 12}.get(n)
    if m == "nombre_a_numero":
        resp = abrev(n, f)
        dist = [(abrev(n - 10, f), None), (abrev(n + 10, f) if n + 10 <= 30 else None, None), (abrev(confund, f) if confund else None, "E03"),
                (abrev(n + 1, f), None), (abrev(n - 1, f), None)]
        return mk(f"¿Qué número de orden es «{ordinal(n, f)}»?", resp, dist, "ordinal",
                  f"«{ordinal(n, f)}» es el puesto {n}: se escribe {resp}.", "Del 13.º al 19.º se forman con «decimo-» delante: decimotercero, decimocuarto…", n=n)
    dist = [(PARTITIVO[n], "E01"), (f"décimo {letras(n - 10)}" if n != 20 else None, "E02"), (ordinal(confund, f) if confund else None, "E03"),
            (ordinal(n + 1, f) if n < 20 else ordinal(19, f), None), (ordinal(n - 1, f), None)]
    if m == "posicion":
        nom = rng.choice(NINAS if f else NINOS)
        cosa = rng.choice(["en la carrera", "en el concurso de dibujo", "en la cola del comedor", "en la lista de la clase"])
        enun = f"{nom} quedó {'la' if f else 'el'} número {n} {cosa}. ¿Cómo se dice su puesto?"
    else:
        enun = f"¿Cómo se lee {abrev(n, f)}?"
    return mk(enun, ordinal(n, f), dist, "ordinal", f"El puesto {n} es {'la' if f else 'el'} {ordinal(n, f)} ({abrev(n, f)}).",
              "Ojo: «doceavo» o «quinceavo» son fracciones (partes), no puestos. El puesto 12 es el duodécimo.", n=n)


@generador("t1_ordinal03")
def g_ordinal03(rng, d, modos=("numero_a_nombre", "nombre_a_numero")):
    m = modo(rng, modos, "numero_a_nombre")
    n = rng.choice([x for x in range(21, 101)]) if d > 1 else rng.choice(list(range(30, 100, 10)) + [100, 21, 25])
    if d == 3 and rng.random() < 0.6:
        n = rng.choice(range(60, 80))
    dd, u = divmod(n, 10)
    swap = n + 10 if dd == 6 else n - 10 if dd == 7 else None
    if m == "nombre_a_numero":
        resp = abrev(n)
        dist = [(abrev(swap) if swap else None, "E01"), (abrev(n + 10) if n <= 90 and n + 10 != swap else None, None), (abrev(n - 10) if n - 10 != swap else None, None),
                (abrev(10 * u + dd) if u and 10 * u + dd > 20 and 10 * u + dd != n else None, None), (abrev(n + 1) if n < 100 else None, None)]
        return mk(f"¿Qué número de orden es «{ordinal(n)}»?", resp, dist, "ordinal", f"«{ordinal(n)}» es el puesto {n} ({resp}).",
                  "Las decenas ordinales se parecen poco a los números: sexagésimo es 60 y septuagésimo es 70.", n=n)
    dist = [(ordinal(swap) if swap and swap <= 100 else None, "E01"), (DEC_PART.get(dd) if u == 0 and dd in DEC_PART else None, "E02"),
            (ordinal(n + 10) if n <= 90 and n + 10 != swap else None, None), (ordinal(n - 10) if n > 30 and n - 10 != swap else None, None), (ordinal(n + 1) if n < 100 else None, None)]
    return mk(f"¿Cómo se lee {abrev(n)}?", ordinal(n), dist, "ordinal", f"{abrev(n)} se lee «{ordinal(n)}».",
              "Las decenas ordinales: vigésimo, trigésimo, cuadragésimo, quincuagésimo, sexagésimo, septuagésimo, octogésimo, nonagésimo.", n=n)


# ================================================================ NUM.PARIDAD

@generador("t1_paridad01")
def g_paridad01(rng, d, modos=("parejas", "elegir")):
    m = modo(rng, modos, "parejas")
    if m == "parejas":
        n = rng.randint(2, 10) if d == 1 else rng.randint(5, 16)
        ic = rng.choice(ICONOS)
        q, r = divmod(n, 2)
        dib = "  ".join(ic * 2 for _ in range(q)) + ("  " + ic if r else "")
        def frase(p, s):
            return f"{p} pareja{'s' if p != 1 else ''} y " + ("no sobra ninguno: es par" if s == 0 else f"sobra{'n' if s > 1 else ''} {s}: es {'impar' if s == 1 else 'par'}")
        resp = frase(q, r)
        dist = [(frase(q, 1 - r), "E02"), (frase(q + 1, 0) if r else (frase(q - 1, 1) if q > 1 else None), "E02"), (frase(q + 1, r), None), (frase(q - 1, r) if q > 1 else None, None)]
        dist = [(v, k) for v, k in dist if v != resp]
        return mk(f"Haz parejas con estos dibujos:\n{dib}\n¿Qué pasa?", resp, dist, "parejas",
                  f"Salen {q} parejas y {'no sobra ninguno' if r == 0 else 'sobra 1'}. Si no sobra ninguno el número es par; si sobra uno, impar. {n} es {'par' if r == 0 else 'impar'}.",
                  "Par es lo que se puede repartir entre dos sin que sobre nada. Hacer parejas con objetos reales es la mejor manera de entenderlo.",
                  genericos=[frase(q + 1, 1), frase(q, 2)], n=n)
    tipo = rng.choice(["par", "impar"])
    top = 10 if d == 1 else 20
    buenos = [x for x in range(0, top + 1) if (x % 2 == 0) == (tipo == "par")]
    malos = [x for x in range(0, top + 1) if x not in buenos]
    if d == 3 and tipo == "par" and rng.random() < 0.6:
        v = 0
    else:
        v = rng.choice([x for x in buenos if x])
    otros = rng.sample([x for x in malos if x], 3)
    if d == 3 and tipo == "impar":
        otros[0] = 0
    vals = [v] + otros
    rng.shuffle(vals)
    claves = {x: ("E01" if x == 0 else "E02") for x in otros}
    return mk(f"¿Cuál de estos números es {tipo}: {', '.join(str(x) for x in vals)}?", str(v), [(str(x), claves[x]) for x in otros], "paridad",
              f"Haz parejas: con {v} {'no sobra ninguno' if v % 2 == 0 else 'sobra uno'}, así que {v} es {'par' if v % 2 == 0 else 'impar'}." +
              (" El 0 es par: no sobra nada." if v == 0 or 0 in vals else ""),
              "Pares: 0, 2, 4, 6, 8, 10… Impares: 1, 3, 5, 7, 9… El 0 también es par.", datos={"opciones_fijas": True}, valores=vals, tipo=tipo)


@generador("t1_paridad02")
def g_paridad02(rng, d, modos=("clasificar", "siguiente")):
    m = modo(rng, modos, "clasificar")
    if m == "siguiente":
        tipo = rng.choice(["par_siguiente", "impar_anterior", "impar_siguiente", "par_anterior"])
        n = rng.randint(20, 998)
        par = tipo.startswith("par")
        paso = 1 if tipo.endswith("siguiente") else -1
        r = n + paso
        while (r % 2 == 0) != par:
            r += paso
        pal = f"el número {'par' if par else 'impar'} que va justo {'después' if paso > 0 else 'antes'} del {n}"
        dist = [(n + paso if n + paso != r else None, "E03"), (r + 2 * paso, None), (r - 2 * paso if r - 2 * paso != n else r + 4 * paso, None), (n, None)]
        return mk(f"¿Cuál es {pal}?", r, dist, "paridad_siguiente",
                  f"Los {'pares' if par else 'impares'} van de 2 en 2. Busco {'hacia delante' if paso > 0 else 'hacia atrás'} desde {n}: {r} termina en {r % 10}, que es {'par' if par else 'impar'}.",
                  "Solo importa la última cifra: 0, 2, 4, 6, 8 son pares.", n=n, tipo=tipo)
    tipo = rng.choice(["par", "impar"])
    cif = [2, 3] if d < 3 else [3]
    def num(par_final, primera_par=None):
        for _ in range(100):
            x = rng.randint(10, 999) if len(cif) > 1 else rng.randint(100, 999)
            if (x % 2 == 0) == par_final and (primera_par is None or (int(str(x)[0]) % 2 == 0) == primera_par):
                return x
    v = num(tipo == "par", tipo != "par" if d > 1 else None)   # buena: primera cifra de la otra paridad (trampa)
    otros = []
    claves = {}
    t1 = num(tipo != "par", tipo == "par")                      # mala con primera cifra del tipo pedido → E01
    otros.append(t1)
    claves[t1] = "E01"
    if tipo == "impar":
        t2 = rng.randint(1, 99) * 10
        claves[t2] = "E02"
        otros.append(t2)
    else:
        v = rng.randint(1, 99) * 10 if d >= 2 and rng.random() < 0.5 else v
    while len(otros) < 3:
        x = num(tipo != "par")
        if x not in otros:
            otros.append(x)
            claves.setdefault(x, None)
    if len(set(otros + [v])) < 4:
        return None
    vals = [v] + otros
    rng.shuffle(vals)
    return mk(f"¿Cuál de estos números es {tipo}: {', '.join(str(x) for x in vals)}?", str(v), [(str(x), claves.get(x)) for x in otros], "paridad",
              f"Solo miro la última cifra: {v} termina en {v % 10}, que es {'par' if v % 2 == 0 else 'impar'}." + (" Un número que termina en 0 es par." if v % 10 == 0 else ""),
              "Par o impar lo decide solo la cifra de las unidades (0, 2, 4, 6, 8 → par). El 0 final también es par.",
              datos={"opciones_fijas": True}, valores=vals, tipo=tipo)


@generador("t1_paridad03")
def g_paridad03(rng, d, modos=("descartar", "predecir")):
    m = modo(rng, modos, "descartar")
    a, b = rng.randint(10, 499), rng.randint(10, 499)
    op = rng.choice(["+", "−"]) if d > 1 else "+"
    if a == b:
        return None
    if op == "−" and a < b:
        a, b = b, a
    r = a + b if op == "+" else a - b
    par_r = r % 2 == 0
    pa, pb = ("par" if a % 2 == 0 else "impar"), ("par" if b % 2 == 0 else "impar")
    regla = f"{pa} {op} {pb} = {'par' if par_r else 'impar'}"
    if m == "predecir":
        resp = f"{'par' if par_r else 'impar'}, porque {regla}"
        otra = "impar" if par_r else "par"
        mayor, p_mayor = (a, pa) if a >= b else (b, pb)
        dist = [(f"{otra}, porque {pa} {op} {pb} = {otra}", "E01" if pa == pb == "impar" else None),
                (f"{p_mayor}, porque {mayor} es {p_mayor} y es el mayor" if p_mayor == otra else None, "E02"),
                (f"no se puede saber sin hacer la cuenta", None), (f"{otra}, porque {a} es {pa}" if pa == otra else f"{otra}, porque {b} es {pb}" if pb == otra else None, None),
                (f"{otra}, porque los dos números son grandes", None)]
        return mk(f"Sin hacer la cuenta: ¿el resultado de {a} {op} {b} es par o impar?", resp, dist, "paridad_op",
                  f"{a} es {pa} y {b} es {pb}: {regla}. (Comprobación: {a} {op} {b} = {r}.)",
                  "par ± par = par; impar ± impar = par; par ± impar = impar. Sirve para detectar resultados imposibles.", a=a, b=b)
    malos = []
    for delta in rng.sample([-3, -1, 1, 3, 5, -5, 7], 7):
        x = r + delta
        if x > 0 and x not in malos:
            malos.append(x)
        if len(malos) == 3:
            break
    k = "E01" if pa == pb == "impar" else "E02" if (a > b and pa == ("par" if not par_r else "impar")) or (b > a and pb == ("par" if not par_r else "impar")) else None
    k = "E01" if pa == pb == "impar" else ("E02" if (pa if a >= b else pb) != ("par" if par_r else "impar") else None)
    return mk(f"Sin hacer la cuenta, solo uno de estos números puede ser el resultado de {a} {op} {b}. ¿Cuál?", r, [(x, k) for x in malos], "paridad_op",
              f"{a} es {pa} y {b} es {pb}, y {regla}. El único {'par' if par_r else 'impar'} de las opciones es {r}.",
              "par ± par = par; impar ± impar = par; par ± impar = impar.", a=a, b=b)


# ================================================================ NUM.REDON

ORDEN_NOM = {10: "la decena", 100: "la centena", 1000: "el millar", 10 ** 4: "la decena de millar", 10 ** 5: "la centena de millar",
             10 ** 6: "el millón", 10 ** 7: "la decena de millón"}
ADULTO_RED = "Redondear es buscar el número «redondo» más cercano: se mira solo la cifra de la derecha del orden pedido (5 o más, sube; menos de 5, se queda)."


def a_ord(a):
    o = ORDEN_NOM[a]
    return "al " + o[3:] if o.startswith("el ") else "a " + o


def red(n, a):
    return (n + a // 2) // a * a


def _texto_red(n, a):
    r = red(n, a)
    c = (n // (a // 10)) % 10 if a >= 10 else n % 10
    return (f"Para redondear {a_ord(a)} miro la cifra siguiente hacia la derecha: es un {c}. " +
            (f"Como es 5 o más, subo: {fmt(n)} → {fmt(r)}." if c >= 5 else f"Como es menos de 5, me quedo: {fmt(n)} → {fmt(r)}."))


@generador("t1_redon01")
def g_redon01(rng, d):
    x = rng.choice([20, 30, 40, 50, 60, 80, 100, 120, 150]) if d > 1 else rng.choice([20, 30, 40, 50])
    x = min(x, 150 if d == 3 else 100)
    ic = rng.choice(ICONOS)
    filas = []
    quedan = x
    while quedan:
        k = min(quedan, rng.randint(8, 12))
        filas.append(ic * k)
        quedan -= k
    opciones = sorted({x, max(5, x // 3 // 5 * 5), x * 3 if x <= 60 else x * 2, x // 2 // 5 * 5 if x >= 40 else x * 2})
    if len(opciones) < 4:
        opciones = sorted(set(opciones) | {x * 4})
    if len(opciones) < 4:
        return None
    lo, hi = min(opciones), max(opciones)
    dist = [(f"unos {v}", "E02" if v == lo else "E01" if v == hi else None) for v in opciones if v != x]
    return mk(f"Sin contar uno a uno: ¿cuántos {ic} hay, más o menos? (en cada fila hay unos 10)\n" + "\n".join(filas), f"unos {x}", dist, "estimar_coleccion",
              f"Hay unas {len(filas)} filas y en cada fila hay unos 10: {len(filas)} × 10 son unos {x}.",
              "Estimar con un grupo de referencia (una fila de 10) es una habilidad muy útil. Después se puede contar para comprobar cuánto nos hemos acercado.",
              datos={"opciones_fijas": True}, n=x)


@generador("t1_redon02")
def g_redon02(rng, d):
    n = rng.randint(11, 99)
    if d == 1:
        while n % 10 in (0, 5):
            n = rng.randint(11, 99)
    if d == 3 and rng.random() < 0.6:
        n = rng.randint(1, 9) * 10 + 5
    u = n % 10
    r = red(n, 10)
    t = n // 10 * 10
    dist = [(t if t != r and u != 5 else None, "E01"), (t if u == 5 else None, "E02"), (t + 10 if u < 5 else None, "E03"),
            (int(str(n)[:-1] + "0" + str(u)) if False else n * 10 if u == 0 else int(str(n) + "0"), "E04"), (u, "E04"), (r + 10, None), (r - 10 if r > 10 else None, None)]
    return mk(f"Redondea {n} a la decena.", r, dist, "redondeo", _texto_red(n, 10), ADULTO_RED + " En la recta: ¿a qué decena está más cerca?", n=n, a=10)


@generador("t1_redon03")
def g_redon03(rng, d, arrastre=False):
    a = rng.choice([10, 100])
    n = rng.randint(100, 9999) if d > 1 else rng.randint(100, 999)
    if arrastre:
        if a == 10:
            n = rng.randint(1, 99) * 100 + 90 + rng.randint(5, 9)
        else:
            n = rng.randint(1, 9) * 1000 + 900 + rng.randint(50, 99)
    r = red(n, a)
    t = n // a * a
    unid = red(n, a) if a == 10 else ((n // a) + (1 if n % 10 >= 5 else 0)) * a
    otro = red(n, 100 if a == 10 else 10)
    sube_sin_prop = None
    s = str(n)
    idx = len(s) - (2 if a == 10 else 3)
    if s[idx] == "9" and r > t:
        sube_sin_prop = s[:idx] + "10" + "0" * (len(s) - idx - 1)
    dist = [(unid if a == 100 and unid != r else None, "E01"), (t if t != r else None, "E02"), (otro if otro != r else None, "E03"),
            (sube_sin_prop, "E04"), (r + a, None), (r - a if r > a else None, None)]
    return mk(f"Redondea {fmt(n)} {a_ord(a)}.", r, dist, "redondeo", _texto_red(n, a) + (" Al subir, el 9 se convierte en 10 y se lleva una a la izquierda." if sube_sin_prop else ""),
              ADULTO_RED, n=n, a=a)


@generador("t1_redon05")
def g_redon05(rng, d):
    n = rng.randint(1000, 9999)
    if d == 3 and rng.random() < 0.5:
        n = rng.randint(9500, 9999)
    if d >= 2 and rng.random() < 0.4:
        n = rng.randint(1, 9) * 1000 + rng.choice([4, 5]) * 100 + rng.randint(0, 99)
    r = red(n, 1000)
    t = n // 1000 * 1000
    # E01: decide con la cifra de las decenas
    dec = (n // 10) % 10
    mal = t + 1000 if dec >= 5 else t
    dist = [(mal if mal != r else None, "E01"), (t if n >= 9500 else None, "E02"), (t if t != r and n < 9500 else None, None), (r + 1000, None), (r - 1000 if r > 1000 else None, None),
            (red(n, 100) if red(n, 100) != r else None, None)]
    return mk(f"Redondea {fmt(n)} al millar.", r, dist, "redondeo", _texto_red(n, 1000), ADULTO_RED, n=n, a=1000)


@generador("t1_redon07")
def g_redon07(rng, d):
    a = rng.choice([10 ** 3, 10 ** 4, 10 ** 5, 10 ** 6, 10 ** 7])
    cif = rng.randint(len(str(a)) + 1, 9)
    n = rng.randint(10 ** (cif - 1), 10 ** cif - 1)
    if d == 3:
        # provocar arrastre: cifra del orden = 9 y la siguiente ≥ 5
        s = list(str(n))
        idx = len(s) - len(str(a))
        if idx < 1:
            return None
        s[idx] = "9"
        s[idx + 1] = str(rng.randint(5, 9))
        n = int("".join(s))
    r = red(n, a)
    t = n // a * a
    s = str(n)
    idx = len(s) - len(str(a))
    sin_prop = int(s[:idx] + "10" + "0" * (len(s) - idx - 1)) if s[idx] == "9" and r > t else None
    dist = [(red(n, a // 10) if red(n, a // 10) != r else None, "E01"), (red(n, a * 10) if red(n, a * 10) != r and red(n, a * 10) > 0 else None, "E01"),
            (sin_prop, "E02"), (t if t != r else None, "E03"), (r + a, None), (r - a if r > a else None, None)]
    return mk(f"Redondea {fmt(n)} {a_ord(a)}.", r, dist, "redondeo", _texto_red(n, a), ADULTO_RED, n=n, a=a)


@generador("t1_redon04")
def g_redon04(rng, d):
    a = 10 if d == 1 else rng.choice([10, 100]) if d == 2 else 100
    op = rng.choice(["+", "−"])
    for _ in range(100):
        x = rng.randint(11 if a == 10 else 101, 999 if d < 3 else 9999)
        y = rng.randint(11 if a == 10 else 101, 999 if d < 3 else 9999)
        if op == "−" and x < y:
            x, y = y, x
        if x % a == 0 or y % a == 0:
            continue
        rx, ry = red(x, a), red(y, a)
        est = rx + ry if op == "+" else rx - ry
        exact = x + y if op == "+" else x - y
        solo1 = rx + y if op == "+" else rx - y
        trunc = x // a * a + y // a * a if op == "+" else x // a * a - y // a * a
        if est > 0 and len({est, exact, solo1, trunc}) == 4:
            break
    else:
        return None
    return mk(f"Estima redondeando a {ORDEN_NOM[a]}: {fmt(x)} {op} {fmt(y)}", est, [(exact, "E01"), (solo1, "E02"), (trunc, "E03")], "estimar",
              f"Redondeo cada número a {ORDEN_NOM[a]}: {fmt(x)} → {fmt(rx)} y {fmt(y)} → {fmt(ry)}. Luego opero de cabeza: {fmt(rx)} {op} {fmt(ry)} = {fmt(est)}.",
              "Estimar sirve para saber si un resultado es razonable antes (o después) de hacer la cuenta exacta.", x=x, y=y)


@generador("t1_redon06")
def g_redon06(rng, d):
    op = rng.choice(["×", ":"]) if d > 1 else "×"
    if op == "×":
        b = rng.randint(3, 9)
        if d == 1:
            x = rng.randint(12, 98)
            a = 10
        else:
            x = rng.randint(102, 998)
            a = 100
        if x % a == 0 or x % a in (5, 50):
            return None
        rx = red(x, a)
        est = rx * b
        return mk(f"Estima redondeando {x} a {ORDEN_NOM[a]}: {x} × {b}", est, [(est * 10, "E01"), (est // 10 if est % 10 == 0 else None, "E01"), (rx * 10, "E02"), (rx + b, "E03")],
                  "estimar", f"{x} está cerca de {rx}. {rx} × {b} = {est}: el resultado será más o menos {est}.",
                  "Para estimar un producto se redondea el número grande y se deja el pequeño; después, tabla y ceros.", x=x, b=b)
    b = rng.randint(3, 9)
    q = rng.randint(2, 9) * (10 if d == 3 else 1) * rng.choice([1, 10])
    R = q * b
    if R % 10 or R > 999 or R < 20:
        return None
    x = R + rng.choice([-3, -2, -1, 1, 2, 3, 4, -4]) * (1 if R < 100 else rng.choice([1, 2, 5]))
    if x <= 0 or x == R:
        return None
    return mk(f"Estima redondeando {x} a {fmt(R)}: {x} : {b}", q, [(q * 10, "E01"), (q // 10 if q % 10 == 0 else None, "E01"), (R // 10, "E02"), (R + b, "E03")],
              "estimar", f"{x} está muy cerca de {fmt(R)}, que se divide bien entre {b}: {fmt(R)} : {b} = {q}. El resultado será más o menos {q}.",
              "Para estimar una división se busca un número cercano que se divida bien (usando las tablas).", x=x, b=b)


@generador("t1_redon08")
def g_redon08(rng, d, modos=("producto", "contexto", "descartar")):
    m = modo(rng, modos, "producto")
    if m == "contexto":
        casos = [("En un estadio hay {n} personas. ¿Cómo lo diría un periodista?", "personas", 1000, rng.randint(12000, 89999)),
                 ("A un concierto fueron {n} personas. ¿Qué cifra redondeada es la adecuada para una noticia?", "personas", 1000, rng.randint(8000, 60000)),
                 ("Una ciudad tiene {n} habitantes. ¿Cómo lo dirías de forma aproximada?", "habitantes", 10000, rng.randint(120000, 990000)),
                 ("Un coche ha recorrido {n} km. ¿Cómo lo dirías de forma aproximada?", "km", 1000, rng.randint(21000, 190000))]
        t, u, a, n = rng.choice(casos)
        if n % a == 0:
            n += 7
        r = red(n, a)
        dist = [(f"unos {fmt(n)} {u}", "E02"), (next((f"unos {fmt(red(n, a * k))} {u}" for k in (10, 100, 1000) if red(n, a * k) not in (r, 0)), None), "E02"),
                (f"unos {fmt(red(n, 10))} {u}" if red(n, 10) != n else None, None), (f"unos {fmt(r * 10)} {u}", None)]
        return mk(t.format(n=fmt(n)), f"unos {fmt(r)} {u}", dist, "precision",
                  f"En este contexto basta con redondear {a_ord(a)}: {fmt(n)} → {fmt(r)}. Dar todas las cifras sobra; redondear demasiado pierde la información.",
                  "La precisión adecuada depende del contexto: nadie cuenta el público de un estadio de uno en uno.", n=n)
    if m == "producto":
        x = rng.randint(1100, 9900)
        y = rng.randint(11, 99)
        e = red(x, 10 ** (len(str(x)) - 1)) * red(y, 10)
        # aproximación de una cifra significativa del producto
        p = x * y
        k = 10 ** (len(str(p)) - 1)
        est = round(p / k) * k
        return mk(f"¿Cuál es la estimación razonable de {fmt(x)} × {y}?", est, [(est // 10, "E01"), (est * 10, "E01"), (est * 100, None)], "estimar",
                  f"{fmt(x)} es más o menos {fmt(red(x, 10 ** (len(str(x)) - 1)))} y {y} es más o menos {red(y, 10)}: {fmt(red(x, 10 ** (len(str(x)) - 1)))} × {red(y, 10)} = {fmt(e)}. "
                  f"El resultado anda por {fmt(est)}.", "Antes de hacer una cuenta larga, estimar el orden de magnitud evita errores de ceros.",
                  datos={"opciones_fijas": True}, x=x, y=y)
    x = rng.randint(120, 980)
    y = rng.randint(21, 98)
    p = x * y
    op = rng.choice(["×", "+"])
    if op == "+":
        x = rng.randint(1200, 9800)
        y = rng.randint(1200, 9800)
        p = x + y
    malos = [p * 10 + rng.randint(1, 9) * 10, p // 10 + 3, (p // 100) + 7]
    resp = fmt(p)
    return mk(f"Solo uno de estos resultados de {fmt(x)} {op} {fmt(y)} es posible. ¿Cuál?", resp, [(v, "E01") for v in malos], "descartar",
              f"Estimo: {fmt(red(x, 10 ** (len(str(x)) - 1)))} {op} {fmt(red(y, 10 ** (len(str(y)) - 1)))} ≈ "
              f"{fmt(red(x, 10 ** (len(str(x)) - 1)) * red(y, 10 ** (len(str(y)) - 1)) if op == '×' else red(x, 10 ** (len(str(x)) - 1)) + red(y, 10 ** (len(str(y)) - 1)))}. "
              f"Solo {resp} tiene ese tamaño.", "Descartar resultados por su tamaño es una comprobación rápida y muy potente.", x=x, y=y)


# ================================================================ NUM.ROM

ROMV = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
ROM = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"), (90, "XC"), (50, "L"), (40, "XL"), (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]


def romano(n):
    out = ""
    for v, s in ROM:
        while n >= v:
            out += s
            n -= v
    return out


def rom_valor(r):
    t = 0
    for i, ch in enumerate(r):
        v = ROMV[ch]
        if i + 1 < len(r) and ROMV[r[i + 1]] > v:
            t -= v
        else:
            t += v
    return t


def rom_suma_todo(r):
    return sum(ROMV[c] for c in r)


ADITIVO = [("CM", "DCCCC"), ("CD", "CCCC"), ("XC", "LXXXX"), ("XL", "XXXX"), ("IX", "VIIII"), ("IV", "IIII")]


def rom_sin_resta(r, todas=False):
    for a, b in ADITIVO:
        if a in r:
            r = r.replace(a, b, 1)
            if not todas:
                return r
    return r


ADULTO_ROM = "Si una letra pequeña va delante de una mayor, se resta (IV = 4, XC = 90); si va detrás, se suma. Ninguna letra se repite más de tres veces."


def _rom_ej(rng, n, sentido, dist_dec, dist_rom):
    r = romano(n)
    if sentido == "a_decimal":
        return mk(f"¿Qué número es {r}?", n, dist_dec, "romano", f"Leo por partes: {' + '.join(f'{s} = {v}' for v, s in _partes_rom(n))}. En total, {fmt(n)}.",
                  ADULTO_ROM, genericos=[n + 1, n - 1 if n > 1 else n + 2, n + 10], n=n)
    return mk(f"¿Cómo se escribe {fmt(n)} en números romanos?", r, dist_rom, "romano",
              f"Descompongo {fmt(n)} = {' + '.join(fmt(v) for v, s in _partes_rom(n))} y escribo cada parte: {r}.", ADULTO_ROM,
              genericos=[romano(n + 1), romano(n - 1) if n > 1 else "II", romano(n + 10)], n=n)


def _partes_rom(n):
    out = []
    for v, s in ROM:
        c = 0
        while n >= v:
            n -= v
            c += 1
        if c:
            out.append((v * c, s * c))
    return out


@generador("t1_rom01")
def g_rom01(rng, d, maximo=39, modos=("a_decimal", "a_romano")):
    m = modo(rng, modos, "a_decimal")
    n = rng.randint(1, maximo)
    if d >= 2 and rng.random() < 0.6:
        n = rng.choice([x for x in range(1, maximo + 1) if x % 10 in (4, 9)])
    r = romano(n)
    dd = [(rom_suma_todo(r) if rom_suma_todo(r) != n else None, "E02"), (rom_valor(r[::-1]) if r[::-1] != r and rom_valor(r[::-1]) != n else None, None), (n + 10, None), (n - 1, None)]
    inv = None
    for a, b in (("IV", "VI"), ("IX", "XI"), ("VI", "IV"), ("XI", "IX")):
        if r.endswith(a):
            inv = r[:-2] + b
            break
    dr = [(rom_sin_resta(r) if rom_sin_resta(r) != r else None, "E01"), (inv, "E03"), (romano(n + 1), None), (romano(n - 1) if n > 1 else None, None)]
    return _rom_ej(rng, n, m, dd, dr)


@generador("t1_rom02")
def g_rom02(rng, d, modos=("a_decimal", "a_romano")):
    m = modo(rng, modos, "a_decimal")
    n = rng.randint(40, 399)
    if d >= 2:
        n = rng.randint(0, 3) * 100 + rng.choice([40, 90, 45, 49, 95, 99, 44, 94, 41, 98])
        if n < 40:
            return None
    r = romano(n)
    bad = {99: "IC", 95: "VC", 49: "IL", 45: "VL"}.get(n % 100)
    dr = [(romano(n - n % 100) + bad if bad else None, "E01"), (r.replace("C", "LL", 1) if "C" in r and not r.startswith("XC") else r.replace("X", "VV", 1) if "X" in r else None, "E03"),
          (rom_sin_resta(r) if rom_sin_resta(r) != r else None, None), (romano(n + 10), None)]
    dd = [(rom_suma_todo(r) if rom_suma_todo(r) != n else None, "E02"), (n + 10, None), (n - 10, None), (n + 100 if n < 300 else n - 100, None)]
    return _rom_ej(rng, n, m, dd, dr)


@generador("t1_rom03")
def g_rom03(rng, d, modos=("a_decimal", "a_romano", "siglo")):
    m = modo(rng, modos, "a_decimal")
    n = rng.randint(400, 3999)
    if d >= 2 and rng.random() < 0.6:
        n = rng.choice([1, 1, 2, 3]) * 1000 + rng.choice([900, 400, 900]) + rng.randint(0, 99)
    if m == "siglo":
        s = rng.randint(1, 21)
        r = romano(s)
        swap = "".join({"D": "M", "M": "D"}.get(c, c) for c in r)
        return mk(f"¿En qué siglo estamos si pone «siglo {r}»? Escríbelo con cifras.", s,
                  [(rom_suma_todo(r) if rom_suma_todo(r) != s else None, None), (s + 1, None), (s - 1 if s > 1 else None, None), (s + 10, None)],
                  "romano", f"{r} = {s}: es el siglo {s}.", ADULTO_ROM, n=s)
    r = romano(n)
    swap_r = "".join({"D": "M", "M": "D"}.get(c, c) for c in r)
    swap_v = None
    try:
        swap_v = sum(ROMV[c] for c in swap_r) if swap_r != r else None
        swap_v = rom_valor(swap_r) if swap_r != r else None
    except KeyError:
        swap_v = None
    e01 = n - 1000 if "MCM" in r or r.startswith("MCM") else None
    dd = [(e01, "E01"), (swap_v if swap_v and swap_v != n else None, "E03"), (rom_suma_todo(r) if rom_suma_todo(r) != n else None, None), (n + 100, None), (n - 10, None)]
    dr = [(rom_sin_resta(r) if rom_sin_resta(r) != r else None, "E02"), (swap_r if swap_r != r else None, "E03"), (romano(n + 100) if n + 100 <= 3999 else None, None),
          (romano(n - 10), None)]
    return _rom_ej(rng, n, m, dd, dr)


def raya(s):
    return "".join(c + "̄" for c in s)


@generador("t1_rom04")
def g_rom04(rng, d, modos=("a_decimal", "a_romano")):
    m = modo(rng, modos, "a_decimal")
    if d == 1:
        a = rng.choice([4, 5, 6, 7, 8, 9, 10, 20, 50, 100])
        b = 0 if rng.random() < 0.5 else rng.randint(1, 999)
    else:
        a = rng.randint(4, 3999 if d == 3 else 99)
        b = rng.randint(0, 999)
    n = a * 1000 + b
    rr_ = raya(romano(a)) + (romano(b) if b else "")
    if m == "a_decimal":
        return mk(f"¿Qué número es {rr_}? (la raya encima multiplica por 1000)", n,
                  [(n * 1000 if n * 1000 < 10 ** 10 else None, "E01"), (a + b, "E02"), (a * 100 + b if a * 100 + b != n else None, None), (n + 1000, None)], "romano",
                  f"La parte con raya, {raya(romano(a))}, vale {fmt(a)} × 1000 = {fmt(a * 1000)}." + (f" Lo de detrás, {romano(b)}, vale {b}." if b else "") + f" Total: {fmt(n)}.",
                  "La raya encima multiplica por 1000 solo las letras que la llevan.", n=n)
    return mk(f"¿Cómo se escribe {fmt(n)} en números romanos?", rr_,
              [(romano(a) + (romano(b) if b else ""), "E02"), (raya(romano(a) + romano(b)) if b else None, "E01"), (raya(romano(a * 10)) if not b and a * 10 < 4000 else None, None),
               (raya(romano(a + 1)) + (romano(b) if b else ""), None), (raya(romano(a)) + romano(b + 1) if b < 999 else None, None)], "romano",
              f"{fmt(n)} = {fmt(a)} × 1000" + (f" + {b}" if b else "") + f". {fmt(a)} es {romano(a)} y le pongo raya encima" + (f"; {b} es {romano(b)}" if b else "") + f": {rr_}.",
              "La raya encima multiplica por 1000 solo las letras que la llevan.", n=n)
