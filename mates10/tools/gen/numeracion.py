"""Generadores de numeración: conteo, lectura/escritura, comparar/ordenar, valor posicional,
redondeo, ordinales, pares/impares, romanos.

Claves de error:
  conteo: cuenta_de_mas, cuenta_de_menos, salta_numero
  lectura: cifra_cero_omitida, orden_invertido, clase_confundida, y_de_mas
  comparar: por_cifras_sueltas, por_longitud_ignorada, signo_invertido, decimal_por_longitud
  posicional: valor_de_la_cifra, posicion_contada_mal, cifra_por_valor
  redondeo: trunca, redondea_mal_5, a_otra_unidad
  romanos: suma_resta_mal, repite_cuatro, orden_invertido
"""
from .nucleo import Ejercicio, generador, fmt, letras, ORDINALES, ICONOS, genericos_num


@generador("contar")
def gen_contar(rng, d, maximo=10, paso=1, hacia_atras=False, iconos=True):
    if iconos and paso == 1 and not hacia_atras:
        n = rng.randint(2 if d == 1 else 5, min(maximo, 6 if d == 1 else 12 if d == 2 else maximo))
        ic = rng.choice(ICONOS)
        filas = [ic * min(5, n - i) for i in range(0, n, 5)]
        ej = Ejercicio(enunciado="¿Cuántos hay?\n" + "\n".join(filas), respuesta=str(n), parametros={"op": "contar", "n": n},
                       datos={"lectura": "¿Cuántos hay?", "sin_lectura": True})
        ej.distractores = [(n + 1, "cuenta_de_mas"), (n - 1, "cuenta_de_menos"), (n + 2, "cuenta_de_mas")]
        ej.pasos = [{"paso": 1, "operacion": "contar", "resultado": str(n), "texto": "Toca cada uno una sola vez mientras dices el número: " + ", ".join(str(i) for i in range(1, n + 1)) + "."}]
        ej.explicacion_nino = f"Cuenta tocando cada dibujo una vez. El último número que dices es cuántos hay: {n}."
        ej.explicacion_adulto = "Contar bien exige tocar cada objeto una sola vez y saber que el último número dice cuántos hay (cardinal)."
        return ej
    inicio = rng.randint(0, maximo - 4 * paso)
    if hacia_atras:
        inicio = rng.randint(4 * paso, maximo)
    serie = [inicio + (-paso if hacia_atras else paso) * i for i in range(4)]
    sig = serie[-1] + (-paso if hacia_atras else paso)
    ej = Ejercicio(enunciado=f"¿Qué número sigue? {', '.join(fmt(x) for x in serie)}, …", respuesta=fmt(sig),
                   parametros={"op": "serie", "inicio": inicio, "paso": -paso if hacia_atras else paso})
    ej.distractores = [(serie[-1] + (-1 if hacia_atras else 1), "salta_numero"), (sig + (-paso if hacia_atras else paso), "salta_numero"),
                       (serie[-1] - (-paso if hacia_atras else paso), "cuenta_de_menos")]
    ej.genericos = genericos_num(sig, rng)
    ej.pasos = [{"paso": 1, "operacion": f"{fmt(serie[-1])} {'−' if hacia_atras else '+'} {paso}", "resultado": fmt(sig),
                 "texto": f"Cada número es {paso} {'menos' if hacia_atras else 'más'} que el anterior: {fmt(serie[-1])} {'−' if hacia_atras else '+'} {paso} = {fmt(sig)}."}]
    ej.explicacion_nino = ej.pasos[0]["texto"]
    ej.explicacion_adulto = "Contar de 2 en 2, de 5 en 5 o de 10 en 10 prepara las tablas de multiplicar."
    return ej


def _num_cifras(rng, cifras, d, ceros=False):
    lo, hi = 10 ** (cifras - 1), 10 ** cifras - 1
    n = rng.randint(lo, hi)
    if ceros or d >= 2:
        s = list(str(n))
        for i in range(1, len(s)):
            if rng.random() < (0.25 if d == 2 else 0.4):
                s[i] = "0"
        n = int("".join(s))
    return n


def _mal_leido(n, rng):
    """Variantes erróneas plausibles de lectura/escritura."""
    s = str(n)
    out = []
    if "0" in s[1:]:
        out.append((int(s.replace("0", "")) if s.replace("0", "") else 0, "cifra_cero_omitida"))
    if len(s) >= 2:
        out.append((int(s[::-1].lstrip("0") or "0"), "orden_invertido"))
    if len(s) >= 4:
        out.append((int(s[:-3] + "0" + s[-3:]), "clase_confundida"))
        out.append((int(s[:-3] + s[-2:]), "clase_confundida"))
    return out


@generador("leer_numero")
def gen_leer(rng, d, cifras=2, sentido="letras_a_cifras"):
    n = _num_cifras(rng, cifras, d)
    if sentido == "letras_a_cifras":
        ej = Ejercicio(enunciado=f"¿Cómo se escribe con cifras «{letras(n)}»?", respuesta=fmt(n), parametros={"op": "leer", "n": n})
        ej.distractores = [(fmt(v), k) for v, k in _mal_leido(n, rng)]
        ej.genericos = [fmt(x) for x in genericos_num(n, rng)]
    else:
        ej = Ejercicio(enunciado=f"¿Cómo se lee {fmt(n)}?", respuesta=letras(n), parametros={"op": "leer", "n": n})
        ej.distractores = [(letras(v), k) for v, k in _mal_leido(n, rng) if v > 0]
        ej.genericos = [letras(x) for x in genericos_num(n, rng) if x > 0]
    cl = []
    s = str(n)
    if n >= 1_000_000:
        cl.append(f"{letras(int(s[:-6]))} millones")
    if n >= 1000 and int(s[-6:-3] or 0):
        cl.append(f"{letras(int(s[-6:-3]))} mil")
    ej.pasos = [{"paso": 1, "operacion": "separar", "resultado": fmt(n), "texto": f"Separo en grupos de tres desde la derecha: {fmt(n)}. Leo cada grupo con su nombre (millones, mil) y termino con las unidades."}]
    ej.explicacion_nino = f"{fmt(n)} se lee «{letras(n)}». Donde hay un 0 no se dice nada, pero el 0 tiene que estar al escribirlo."
    ej.explicacion_adulto = "El fallo típico es el cero: al escribir «dos mil cinco» ponen 25 o 2005 bien; practicad dictados de números con ceros intermedios."
    return ej


@generador("comparar")
def gen_comparar(rng, d, cifras=2, decimales=0, enteros_negativos=False, fracciones=False, tipo="mayor"):
    from fractions import Fraction
    def uno():
        if fracciones:
            den = rng.randint(2, 12)
            return Fraction(rng.randint(1, den * (2 if d > 2 else 1)), den)
        if decimales:
            return round(rng.uniform(0, 10 ** (cifras)), rng.randint(1, decimales))
        v = rng.randint(10 ** (cifras - 1), 10 ** cifras - 1)
        if enteros_negativos:
            v = rng.randint(-10 ** cifras + 1, 10 ** cifras - 1)
        return v
    for _ in range(100):
        vals = [uno() for _ in range(4)]
        if len(set(vals)) == 4:
            break
    else:
        return None
    if decimales and d >= 2:
        # trampa clásica: más cifras decimales no es mayor
        b = round(float(vals[0]) + 0.05, 2)
        vals[1] = b
        if len(set(vals)) < 4:
            return None
    obj = max(vals) if tipo == "mayor" else min(vals)
    f = (lambda v: fmt(v)) if not decimales else (lambda v: fmt(float(v)))
    ej = Ejercicio(enunciado=f"¿Cuál es el número {'mayor' if tipo == 'mayor' else 'menor'}?", respuesta=f(obj),
                   parametros={"op": "comparar", "valores": [str(v) for v in vals], "tipo": tipo}, datos={"opciones_fijas": True})
    otros = [v for v in vals if v != obj]
    claves = []
    for v in otros:
        k = None
        if decimales and len(str(v)) > len(str(obj)):
            k = "decimal_por_longitud"
        elif enteros_negativos and abs(v) > abs(obj) and v < 0:
            k = "signo_invertido"
        elif fracciones:
            k = "por_cifras_sueltas"
        else:
            k = "por_cifras_sueltas" if str(v)[0] > str(obj)[0] else None
        claves.append((f(v), k))
    ej.distractores = claves
    ej.pasos = [{"paso": 1, "operacion": "comparar", "resultado": f(obj), "texto":
                 "Comparo primero la parte entera; si es igual, las décimas, luego las centésimas." if decimales else
                 "Con negativos, el mayor es el que está más a la derecha en la recta: −2 es mayor que −8." if enteros_negativos else
                 "Paso las fracciones a igual denominador (o a decimal) y comparo." if fracciones else
                 "Si tienen distinto número de cifras, es mayor el que tiene más. Si tienen las mismas, comparo cifra a cifra desde la izquierda."}]
    ej.explicacion_nino = ej.pasos[0]["texto"] + f" El {'mayor' if tipo == 'mayor' else 'menor'} es {f(obj)}."
    ej.explicacion_adulto = "Comparar se hace de izquierda a derecha, cifra a cifra. Los decimales engañan: 0,5 es mayor que 0,45 aunque «45 > 5»."
    return ej


@generador("orden_ordinal")
def gen_ordinal(rng, d, maximo=10):
    n = rng.randint(1, min(maximo, 20))
    ej = Ejercicio(enunciado=f"¿Cómo se dice el puesto número {n} de una fila?", respuesta=ORDINALES[n], parametros={"op": "ordinal", "n": n})
    ej.distractores = [(ORDINALES[n + 1] if n < 20 else None, "vecino"), (ORDINALES[n - 1] if n > 1 else None, "vecino"),
                       (letras(n), "cardinal_por_ordinal")]
    ej.distractores = [x for x in ej.distractores if x[0]]
    ej.genericos = [ORDINALES[i] for i in rng.sample(range(1, 21), 5) if i != n]
    ej.pasos = [{"paso": 1, "operacion": f"{n}º", "resultado": ORDINALES[n], "texto": f"El que va en el puesto {n} es el {ORDINALES[n]} ({n}º)."}]
    ej.explicacion_nino = ej.pasos[0]["texto"]
    ej.explicacion_adulto = "Los ordinales dicen la posición (primero, segundo…), no la cantidad."
    return ej


@generador("paridad")
def gen_paridad(rng, d, maximo=20):
    n = rng.randint(1, maximo * (1 if d == 1 else 5))
    par = n % 2 == 0
    ej = Ejercicio(enunciado=f"¿El número {fmt(n)} es par o impar?", respuesta="par" if par else "impar", parametros={"op": "paridad", "n": n},
                   formato="verdadero_falso")
    ej.distractores = [("impar" if par else "par", "mira_otra_cifra")]
    ej.pasos = [{"paso": 1, "operacion": f"última cifra {str(n)[-1]}", "resultado": "par" if par else "impar", "texto": f"Miro la última cifra: {str(n)[-1]}. {'0, 2, 4, 6 y 8 son pares' if par else '1, 3, 5, 7 y 9 son impares'}."}]
    ej.explicacion_nino = ej.pasos[0]["texto"] + f" Así que {fmt(n)} es {'par' if par else 'impar'}."
    ej.explicacion_adulto = "Par = se puede repartir en dos grupos iguales. Solo importa la última cifra."
    return ej


NOMBRE_POS = ["unidades", "decenas", "centenas", "unidades de millar", "decenas de millar", "centenas de millar", "unidades de millón",
              "decenas de millón", "centenas de millón"]


@generador("valor_posicional")
def gen_posicional(rng, d, cifras=2, tipo="valor"):
    n = _num_cifras(rng, cifras, 1)
    s = str(n)
    i = rng.randint(0, len(s) - 1)
    while s[i] == "0":
        i = rng.randint(0, len(s) - 1)
    pos = len(s) - 1 - i
    c = int(s[i])
    val = c * 10 ** pos
    if tipo == "valor":
        ej = Ejercicio(enunciado=f"En el número {fmt(n)}, ¿cuánto vale la cifra {c} que está en las {NOMBRE_POS[pos]}?", respuesta=fmt(val),
                       parametros={"op": "posicional", "n": n, "pos": pos})
        ej.distractores = [(fmt(c), "cifra_por_valor"), (fmt(c * 10 ** (pos + 1)), "posicion_contada_mal"), (fmt(c * 10 ** max(pos - 1, 0)) if pos else None, "posicion_contada_mal")]
        ej.distractores = [x for x in ej.distractores if x[0]]
        ej.genericos = [fmt(c * 10 ** k) for k in range(0, len(s) + 1) if k != pos]
        ej.explicacion_nino = f"La cifra {c} está en las {NOMBRE_POS[pos]}, así que vale {fmt(val)}."
    elif tipo == "descomponer":
        partes = [int(ch) * 10 ** (len(s) - 1 - j) for j, ch in enumerate(s) if ch != "0"]
        resp = " + ".join(fmt(p) for p in partes)
        ej = Ejercicio(enunciado=f"¿Cómo se descompone {fmt(n)}?", respuesta=resp, parametros={"op": "descomponer", "n": n})
        mal1 = " + ".join(ch for ch in s if ch != "0")
        mal2 = " + ".join(fmt(int(ch) * 10 ** (len(s) - j)) for j, ch in enumerate(s) if ch != "0")
        mal3 = " + ".join(fmt(p) for p in partes[:-1]) + (" + " + fmt(partes[-1] * 10) if partes else "")
        ej.distractores = [(mal1, "cifra_por_valor"), (mal2, "posicion_contada_mal"), (mal3, "posicion_contada_mal")]
        ej.explicacion_nino = f"Cada cifra vale según su sitio: {resp} = {fmt(n)}."
    else:  # cuántas decenas/centenas tiene en total
        k = rng.randint(1, min(3, len(s) - 1))
        tot = n // 10 ** k
        ej = Ejercicio(enunciado=f"¿Cuántas {NOMBRE_POS[k]} tiene en total el número {fmt(n)}?", respuesta=fmt(tot),
                       parametros={"op": "cuantas", "n": n, "pos": k})
        ej.distractores = [(fmt(int(s[len(s) - 1 - k])), "valor_de_la_cifra"), (fmt(n // 10 ** (k + 1)), "posicion_contada_mal"), (fmt(n // 10 ** max(k - 1, 0)), "posicion_contada_mal")]
        ej.explicacion_nino = f"En {fmt(n)} caben {fmt(tot)} {NOMBRE_POS[k]} enteras: tapa las {k} últimas cifras y lee lo que queda."
    ej.pasos = [{"paso": 1, "operacion": "tabla de posiciones", "resultado": ej.respuesta, "texto": ej.explicacion_nino}]
    ej.explicacion_adulto = "El valor de una cifra depende de su posición. Una tabla de columnas (U, D, C, UM…) ayuda mucho."
    return ej


@generador("redondeo")
def gen_redondeo(rng, d, a=10, cifras=3, decimales=0):
    if decimales:
        n = round(rng.uniform(1, 100), decimales + 1)
        paso = 10 ** -decimales if isinstance(a, str) else a
        paso = {"unidad": 1, "decima": 0.1, "centesima": 0.01}.get(a, 1)
        r = round(round(n / paso) * paso, 4)
        t = round(int(n / paso) * paso, 4)
        ej = Ejercicio(enunciado=f"Redondea {fdec_(n)} a la {a}.", respuesta=fdec_(r), parametros={"op": "redondeo", "n": n, "a": a})
        ej.distractores = [(fdec_(t), "trunca"), (fdec_(round(r + paso, 4)), "redondea_mal_5"), (fdec_(round(n, 0)), "a_otra_unidad")]
    else:
        n = rng.randint(10 ** (cifras - 1), 10 ** cifras - 1)
        if d >= 2 and rng.random() < 0.5:
            n = (n // a) * a + a // 2  # justo en la mitad
        r = int((n + a // 2) // a * a)
        t = n // a * a
        ej = Ejercicio(enunciado=f"Redondea {fmt(n)} a las {({10: 'decenas', 100: 'centenas', 1000: 'unidades de millar'})[a]}.", respuesta=fmt(r),
                       parametros={"op": "redondeo", "n": n, "a": a})
        ej.distractores = [(fmt(t) if t != r else fmt(t + a), "trunca"), (fmt(r - a) if r - a != t else fmt(r + a), "redondea_mal_5"),
                           (fmt(int((n + a * 5) // (a * 10) * a * 10)), "a_otra_unidad")]
        ej.genericos = [fmt(r + a), fmt(r - a), fmt(n)]
    ej.pasos = [{"paso": 1, "operacion": "mirar la cifra siguiente", "resultado": ej.respuesta,
                 "texto": "Miro la cifra de la derecha de la posición a la que redondeo: si es 5 o más, subo; si es menos de 5, me quedo."}]
    ej.explicacion_nino = ej.pasos[0]["texto"] + f" {ej.enunciado.replace('Redondea ', '').rstrip('.')}: {ej.respuesta}."
    ej.explicacion_adulto = "Redondear es buscar el número 'redondo' más cercano. Con un 5 justo se redondea hacia arriba."
    return ej


def fdec_(x):
    return fmt(float(x))


ROM = [(1000, "M"), (900, "CM"), (500, "D"), (400, "CD"), (100, "C"), (90, "XC"), (50, "L"), (40, "XL"), (10, "X"), (9, "IX"), (5, "V"), (4, "IV"), (1, "I")]


def romano(n):
    out = ""
    for v, s in ROM:
        while n >= v:
            out += s
            n -= v
    return out


def romano_aditivo(n):
    out = ""
    for v, s in [(1000, "M"), (500, "D"), (100, "C"), (50, "L"), (10, "X"), (5, "V"), (1, "I")]:
        while n >= v:
            out += s
            n -= v
    return out


@generador("romanos")
def gen_romanos(rng, d, maximo=50, sentido="a_decimal"):
    n = rng.randint(1, maximo)
    r = romano(n)
    if sentido == "a_decimal":
        ej = Ejercicio(enunciado=f"¿Qué número es {r}?", respuesta=fmt(n), parametros={"op": "romano", "n": n})
        dist = []
        for i in range(len(r) - 1):
            if dict((s, v) for v, s in ROM).get(r[i], 0) < dict((s, v) for v, s in ROM).get(r[i + 1], 0):
                # suma en vez de restar: IV → 6
                v1 = dict((s, v) for v, s in ROM)[r[i]]
                dist.append((n + 2 * v1, "suma_resta_mal"))
        dist.append((int(str(n)[::-1]) if n > 9 else n + 5, "orden_invertido"))
        ej.distractores = dist
        ej.genericos = genericos_num(n, rng)
    else:
        ej = Ejercicio(enunciado=f"¿Cómo se escribe {fmt(n)} en números romanos?", respuesta=r, parametros={"op": "romano", "n": n})
        ej.distractores = [(romano_aditivo(n), "repite_cuatro"), (r[::-1], "orden_invertido")]
        ej.genericos = [romano(n + 1), romano(max(1, n - 1)), romano(n + 10), romano(max(1, n - 10))]
    ej.pasos = [{"paso": 1, "operacion": r, "resultado": str(n), "texto": "Si una letra pequeña va delante de una mayor, se resta (IV = 4); si va detrás, se suma (VI = 6). Nunca se repite una letra más de tres veces."}]
    ej.explicacion_nino = ej.pasos[0]["texto"] + f" {r} = {n}."
    ej.explicacion_adulto = "Los romanos aparecen en relojes, siglos y capítulos. La regla de la resta es lo que más cuesta."
    return ej
