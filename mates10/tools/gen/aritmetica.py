"""Generadores de suma, resta, multiplicación, división y cálculo mental (primaria).

Claves de error (se enlazan con error_tipico.codigo en la spec de cada habilidad):
  suma:  sin_llevada, escribe_todo, cuenta_incluyendo, resta_en_vez, desalinea, mas_uno
  resta: menor_del_mayor, olvida_devolver, suma_en_vez, uno_de_mas, resta_invertida
  mult:  tabla_vecina, suma_en_vez, tabla_mas_a, sin_llevada, olvida_llevada, sin_desplazar, solo_unidades, ceros_mal
  div:   cociente_vecino, olvida_cero, multiplica, resto_mayor, resto_cambiado, divisor_dividendo
"""
from .nucleo import Ejercicio, generador, fmt, rr, genericos_num, ICONOS, NOMBRES


def digitos(n, k):
    return [int(c) for c in str(n).zfill(k)]


def num_con_cifras(rng, c, lo=None):
    lo = lo if lo is not None else (10 ** (c - 1) if c > 1 else 0)
    return rng.randint(lo, 10 ** c - 1)


# ---------------------------------------------------------------- SUMA

def hay_llevada(nums):
    k = max(len(str(n)) for n in nums)
    ds = [digitos(n, k) for n in nums]
    acc = 0
    for i in range(k - 1, -1, -1):
        s = sum(d[i] for d in ds) + acc
        if s >= 10:
            return True
        acc = 0
    return False


def suma_sin_llevada(nums):
    k = max(len(str(n)) for n in nums)
    ds = [digitos(n, k) for n in nums]
    return int("".join(str(sum(d[i] for d in ds) % 10) for i in range(k)))


def suma_escribe_todo(nums):
    k = max(len(str(n)) for n in nums)
    ds = [digitos(n, k) for n in nums]
    return int("".join(str(sum(d[i] for d in ds)) for i in range(k)).lstrip("0") or "0")


def pasos_suma(nums):
    k = max(len(str(n)) for n in nums)
    ds = [digitos(n, k) for n in nums]
    nom = ["unidades", "decenas", "centenas", "unidades de millar", "decenas de millar", "centenas de millar"]
    pasos, acc = [], 0
    for j, i in enumerate(range(k - 1, -1, -1)):
        col = [d[i] for d in ds]
        s = sum(col) + acc
        op = " + ".join(str(x) for x in col) + (f" + {acc} (me llevo)" if acc else "")
        if s >= 10 and i > 0:
            texto = f"Sumo las {nom[j]}: {op} = {s}. Escribo {s % 10} y me llevo {s // 10}."
        else:
            texto = f"Sumo las {nom[j]}: {op} = {s}. Escribo {s if i == 0 else s % 10}."
        pasos.append({"paso": j + 1, "operacion": op, "resultado": str(s), "texto": texto})
        acc = s // 10
    return pasos


def pasos_suma_abn(a, b):
    """ABN: se añade el segundo sumando por partes (decenas/centenas enteras, luego unidades)."""
    pasos, actual, resto, n = [], a, b, 1
    for unidad in (1000, 100, 10, 1):
        parte = (resto // unidad) * unidad
        if parte:
            pasos.append({"paso": n, "operacion": f"{actual} + {parte}", "resultado": str(actual + parte),
                          "texto": f"Añado {parte}: {actual} + {parte} = {actual + parte}. Me quedan por sumar {resto - parte}."})
            actual += parte
            resto -= parte
            n += 1
    return pasos


@generador("suma")
def gen_suma(rng, d, cifras=(1, 1), llevada=None, max_resultado=None, min_resultado=0, sumandos=None,
             horizontal=True, contexto=False, completar_diez=False):
    """cifras: tupla con las cifras de cada sumando. llevada: True/False/None (indiferente)."""
    cifras = list(cifras) if sumandos is None else [cifras[0]] * sumandos
    for _ in range(400):
        nums = []
        for c in cifras:
            lo = 10 ** (c - 1) if c > 1 else (1 if d == 1 else 0)
            hi = 10 ** c - 1
            if c == 1 and d == 1:
                hi = min(hi, 6 if not llevada else 9)
            nums.append(rng.randint(max(lo, 1) if c == 1 else lo, hi))
        s = sum(nums)
        if max_resultado and s > max_resultado:
            continue
        if s < min_resultado:
            continue
        if llevada is not None and hay_llevada(nums) != llevada:
            continue
        if completar_diez and not (len(nums) == 2 and nums[0] < 10 and nums[1] < 10 and s > 10):
            continue
        break
    else:
        return None
    op = " + ".join(fmt(n) for n in nums)
    ej = Ejercicio(enunciado=f"Calcula: {op}", respuesta=fmt(s), parametros={"op": "suma", "sumandos": nums, "a": nums[0], "b": nums[1] if len(nums) > 1 else None})
    if contexto and len(nums) == 2 and s <= 20:
        ic = rng.choice(ICONOS)
        ej.enunciado = f"{ic * nums[0]}  y  {ic * nums[1]}\n¿Cuántos hay en total?"
        ej.datos = {"lectura": f"Hay {nums[0]} y {nums[1]}. ¿Cuántos hay en total?"}
    a, b = nums[0], nums[-1]
    dist = [(suma_sin_llevada(nums), "sin_llevada"), (suma_escribe_todo(nums), "escribe_todo"),
            (s - 1, "cuenta_incluyendo"), (abs(a - b), "resta_en_vez"), (s + 1, "mas_uno")]
    if len(nums) == 2 and len(str(a)) != len(str(b)):
        corto, largo = (a, b) if len(str(a)) < len(str(b)) else (b, a)
        dist.append((largo + corto * 10 ** (len(str(largo)) - len(str(corto))), "desalinea"))
    ej.distractores = dist
    ej.genericos = genericos_num(s, rng)
    if max(nums) < 10 and len(nums) == 2:
        mayor, menor = max(a, b), min(a, b)
        if s > 10:
            falta = 10 - mayor
            ej.pasos = [
                {"paso": 1, "operacion": f"{mayor} + {falta}", "resultado": "10", "texto": f"Empiezo por el {mayor}. Para llegar a 10 le faltan {falta}."},
                {"paso": 2, "operacion": f"{menor} = {falta} + {menor - falta}", "resultado": str(menor - falta), "texto": f"Parto el {menor} en {falta} y {menor - falta}."},
                {"paso": 3, "operacion": f"10 + {menor - falta}", "resultado": str(s), "texto": f"10 + {menor - falta} = {s}."}]
            ej.explicacion_nino = f"Completa el 10: {mayor} + {falta} = 10, y te quedan {menor - falta}. 10 + {menor - falta} = {s}."
        else:
            ej.pasos = [{"paso": 1, "operacion": f"{mayor} + {menor}", "resultado": str(s), "texto": f"Empiezo en el {mayor} y cuento {menor} más: " + ", ".join(str(mayor + i) for i in range(1, menor + 1)) + "."}]
            ej.explicacion_nino = f"Empieza en el número mayor, {mayor}, y cuenta {menor} más: llegas a {s}."
        ej.explicacion_adulto = ("Está automatizando las sumas básicas. Si cuenta con los dedos desde el primer número, "
                                 "enséñale a empezar por el mayor y, si pasa de 10, a completar primero la decena.")
    else:
        ej.pasos = pasos_suma(nums)
        ej.explicacion_nino = "Coloca los números uno debajo de otro, unidades con unidades. " + " ".join(p["texto"] for p in ej.pasos) + f" Resultado: {fmt(s)}."
        ej.explicacion_adulto = ("Comprueba que coloca las cifras en su columna y que, cuando una columna pasa de 9, "
                                 "suma la 'llevada' a la siguiente. El error más común es olvidarla o escribir el número entero.")
        if len(nums) == 2:
            pa = pasos_suma_abn(a, b)
            ej.explicaciones_extra["abn"] = {"nino": " ".join(p["texto"] for p in pa) + f" Total: {fmt(s)}.", "pasos": pa,
                                             "adulto": "En ABN se suma por partes, de las cantidades grandes a las pequeñas, sin columnas ni llevadas."}
    return ej


# ---------------------------------------------------------------- RESTA

def hay_prestamo(a, b):
    k = len(str(a))
    da, db = digitos(a, k), digitos(b, k)
    return any(da[i] < db[i] for i in range(k))


def resta_menor_del_mayor(a, b):
    k = len(str(a))
    da, db = digitos(a, k), digitos(b, k)
    return int("".join(str(abs(da[i] - db[i])) for i in range(k)))


def resta_olvida_devolver(a, b):
    k = len(str(a))
    da, db = digitos(a, k), digitos(b, k)
    out = []
    for i in range(k):
        x, y = da[i], db[i]
        out.append(str((x + 10 - y) if x < y else x - y))
    try:
        return int("".join(out))
    except ValueError:
        return None


def pasos_resta(a, b):
    k = len(str(a))
    da, db = digitos(a, k), digitos(b, k)
    nom = ["unidades", "decenas", "centenas", "unidades de millar", "decenas de millar"]
    pasos, lleva = [], 0
    for j, i in enumerate(range(k - 1, -1, -1)):
        x, y = da[i], db[i] + lleva
        if x < y:
            texto = f"En las {nom[j]}: a {x} no le puedo quitar {y}. Lo convierto en {x + 10}: {x + 10} − {y} = {x + 10 - y}. Me llevo 1 a la columna siguiente."
            pasos.append({"paso": j + 1, "operacion": f"{x + 10} − {y}", "resultado": str(x + 10 - y), "texto": texto})
            lleva = 1
        else:
            texto = f"En las {nom[j]}: {x} − {y} = {x - y}."
            pasos.append({"paso": j + 1, "operacion": f"{x} − {y}", "resultado": str(x - y), "texto": texto})
            lleva = 0
    return pasos


def pasos_resta_abn(a, b):
    """ABN (detracción): se quita el sustraendo por partes."""
    pasos, actual, resto, n = [], a, b, 1
    for unidad in (1000, 100, 10, 1):
        parte = (resto // unidad) * unidad
        if parte:
            pasos.append({"paso": n, "operacion": f"{actual} − {parte}", "resultado": str(actual - parte),
                          "texto": f"Quito {parte}: {actual} − {parte} = {actual - parte}. Me quedan por quitar {resto - parte}."})
            actual -= parte
            resto -= parte
            n += 1
    return pasos


@generador("resta")
def gen_resta(rng, d, cifras=(1, 1), prestamo=None, min_resultado=0, max_minuendo=None, ceros=False, contexto=False):
    ca, cb = cifras
    for _ in range(400):
        a = num_con_cifras(rng, ca, 2 if ca == 1 else None)
        if max_minuendo:
            a = min(a, max_minuendo)
        if ceros and ca >= 3:
            a = int(str(a)[0] + "0" * (ca - 1)) if d >= 2 else int(str(a)[:-2] + "0" + str(a)[-1])
        b = num_con_cifras(rng, cb, 1 if cb == 1 else None)
        if b > a or a - b < min_resultado:
            continue
        if prestamo is not None and hay_prestamo(a, b) != prestamo:
            continue
        break
    else:
        return None
    r = a - b
    ej = Ejercicio(enunciado=f"Calcula: {fmt(a)} − {fmt(b)}", respuesta=fmt(r), parametros={"op": "resta", "a": a, "b": b})
    if contexto and a <= 10:
        ic = rng.choice(ICONOS)
        ej.enunciado = f"{ic * a}\nSe van {b}. ¿Cuántos quedan?"
        ej.datos = {"lectura": f"Hay {a}. Se van {b}. ¿Cuántos quedan?"}
    ej.distractores = [(resta_menor_del_mayor(a, b), "menor_del_mayor"), (resta_olvida_devolver(a, b), "olvida_devolver"),
                       (a + b, "suma_en_vez"), (r + 1, "uno_de_mas"), (r - 1, "uno_de_mas")]
    ej.genericos = genericos_num(r, rng)
    if a < 20 and b < 10:
        ej.pasos = [{"paso": 1, "operacion": f"{a} − {b}", "resultado": str(r), "texto": f"Empiezo en {a} y cuento hacia atrás {b}: " + ", ".join(str(a - i) for i in range(1, b + 1)) + "."}]
        ej.explicacion_nino = f"Empieza en {a} y cuenta {b} hacia atrás. Llegas a {r}. Comprueba: {r} + {b} = {a}."
        ej.explicacion_adulto = "Está aprendiendo a quitar. Si falla, pídele que compruebe sumando: el resultado más lo que quitas tiene que dar el número del principio."
    else:
        ej.pasos = pasos_resta(a, b)
        ej.explicacion_nino = "Coloca el número mayor arriba y ve columna por columna desde las unidades. " + " ".join(p["texto"] for p in ej.pasos) + f" Resultado: {fmt(r)}. Compruébalo: {fmt(r)} + {fmt(b)} = {fmt(a)}."
        ej.explicacion_adulto = ("El error más frecuente es restar la cifra pequeña de la grande en cada columna, sin importar cuál está arriba. "
                                 "Pídele que diga en voz alta '¿a este número le puedo quitar ese?' antes de cada columna.")
        pa = pasos_resta_abn(a, b)
        ej.explicaciones_extra["abn"] = {"nino": " ".join(p["texto"] for p in pa) + f" Quedan {fmt(r)}.", "pasos": pa,
                                         "adulto": "En ABN se resta quitando por partes (primero las decenas o centenas enteras), sin 'llevadas'."}
    return ej


# ---------------------------------------------------------------- MULTIPLICACIÓN

@generador("tabla")
def gen_tabla(rng, d, tablas=tuple(range(1, 11)), factores=tuple(range(0, 11)), sentido_suma=False):
    a = rng.choice(list(tablas))
    b = rng.choice([f for f in factores if (d > 1 or f <= 5 or a <= 5)] or list(factores))
    if rng.random() < 0.5 and not sentido_suma:
        a, b = b, a
    p = a * b
    if sentido_suma:
        ej = Ejercicio(enunciado=f"¿Qué multiplicación es {' + '.join([str(a)] * b)}?", respuesta=f"{b} × {a}",
                       parametros={"op": "mult", "a": b, "b": a})
        ej.distractores = [(f"{a} × {a}", "suma_en_vez"), (f"{b} + {a}", "suma_en_vez"), (f"{a + 1} × {b}", "tabla_vecina")]
        ej.genericos = [f"{b} × {a + 1}", f"{a} × {b + 1}", f"{b + 1} × {a}"]
        ej.pasos = [{"paso": 1, "operacion": f"{b} veces {a}", "resultado": f"{b} × {a}", "texto": f"Hay {b} veces el {a}: eso es {b} × {a} = {p}."}]
        ej.explicacion_nino = f"Cuenta cuántas veces se repite el {a}: {b} veces. Por eso es {b} × {a}."
        ej.explicacion_adulto = "Multiplicar es sumar el mismo número varias veces. Que cuente los sumandos iguales."
        return ej
    ej = Ejercicio(enunciado=f"Calcula: {a} × {b}", respuesta=fmt(p), parametros={"op": "mult", "a": a, "b": b})
    ej.distractores = [(a * (b + 1), "tabla_vecina"), (a * (b - 1) if b > 0 else None, "tabla_vecina"), (a + b, "suma_en_vez"),
                       ((a + 1) * b, "tabla_vecina"), (p + a, "tabla_mas_a")]
    ej.distractores = [(v, k) for v, k in ej.distractores if v is not None]
    ej.genericos = genericos_num(p, rng)
    base = min(a, b) if min(a, b) > 1 else max(a, b)
    otro = max(a, b) if base == min(a, b) else min(a, b)
    if otro >= 6 and base <= 10:
        ej.pasos = [{"paso": 1, "operacion": f"{base} × 5", "resultado": str(base * 5), "texto": f"Sé que {base} × 5 = {base * 5}."},
                    {"paso": 2, "operacion": f"{base} × {otro - 5}", "resultado": str(base * (otro - 5)), "texto": f"Y {base} × {otro - 5} = {base * (otro - 5)}."},
                    {"paso": 3, "operacion": f"{base * 5} + {base * (otro - 5)}", "resultado": str(p), "texto": f"Lo junto: {base * 5} + {base * (otro - 5)} = {p}."}]
        ej.explicacion_nino = f"{a} × {b} = {p}. Si no te acuerdas, pártelo: {base} × 5 = {base * 5} y {base} × {otro - 5} = {base * (otro - 5)}; juntos, {p}."
    else:
        ej.pasos = [{"paso": 1, "operacion": f"{a} × {b}", "resultado": str(p), "texto": f"{a} × {b} es sumar {b} veces el {a}: {p}."}]
        ej.explicacion_nino = f"{a} × {b} = {p}. Es lo mismo que {b} × {a}: el orden no cambia el resultado."
    ej.explicacion_adulto = ("Las tablas tienen que salir sin pensar para que la cabeza quede libre para lo demás. "
                             "Practicadlas saltadas y al revés (8 × 7 y 7 × 8), no en orden: en orden se recitan, no se aprenden.")
    return ej


def pasos_mult(a, b):
    pasos = []
    sb = str(b)
    parciales = []
    for j, c in enumerate(reversed(sb)):
        pp = a * int(c)
        parciales.append(pp * 10 ** j)
        txt = f"Multiplico {fmt(a)} × {c} = {fmt(pp)}" + (f" y lo coloco desplazado {j} lugar{'es' if j > 1 else ''} a la izquierda (vale {fmt(pp * 10 ** j)})." if j else ".")
        pasos.append({"paso": j + 1, "operacion": f"{a} × {c}", "resultado": str(pp), "texto": txt})
    if len(parciales) > 1:
        pasos.append({"paso": len(pasos) + 1, "operacion": " + ".join(fmt(x) for x in parciales), "resultado": str(sum(parciales)),
                      "texto": f"Sumo los resultados: {' + '.join(fmt(x) for x in parciales)} = {fmt(sum(parciales))}."})
    return pasos


def mult_sin_llevada(a, b):
    if b >= 10:
        return None
    return int("".join(str(int(c) * b % 10) for c in str(a)))


def mult_olvida_llevada(a, b):
    if b >= 10:
        return None
    return int("".join(str(int(c) * b) for c in str(a)))


@generador("mult")
def gen_mult(rng, d, cifras=(2, 1), llevada=None, por_potencia10=False):
    ca, cb = cifras
    for _ in range(300):
        a = num_con_cifras(rng, ca)
        if por_potencia10:
            b = rng.choice([10, 100, 1000][: max(1, d)])
        else:
            b = num_con_cifras(rng, cb, 2)
        if llevada is not None and b < 10 and ((mult_olvida_llevada(a, b) != a * b) != llevada):
            continue
        break
    else:
        return None
    p = a * b
    ej = Ejercicio(enunciado=f"Calcula: {fmt(a)} × {fmt(b)}", respuesta=fmt(p), parametros={"op": "mult", "a": a, "b": b})
    dist = [(mult_sin_llevada(a, b), "sin_llevada"), (mult_olvida_llevada(a, b), "olvida_llevada")]
    if b >= 10 and not por_potencia10:
        sb = str(b)
        dist.append((sum(a * int(c) for c in sb), "sin_desplazar"))
        dist.append((a * int(sb[-1]), "solo_unidades"))
    if por_potencia10:
        dist += [(a * b // 10, "ceros_mal"), (a * b * 10, "ceros_mal"), (a + b, "suma_en_vez")]
        ej.pasos = [{"paso": 1, "operacion": f"{a} × {b}", "resultado": str(p), "texto": f"Multiplicar por {fmt(b)} es añadir {len(str(b)) - 1} cero{'s' if b > 10 else ''} al final: {fmt(p)}."}]
        ej.explicacion_nino = ej.pasos[0]["texto"]
        ej.explicacion_adulto = "Por 10, 100 o 1000 se añaden tantos ceros como tenga. Que no cuente los ceros del primer número como si fueran del segundo."
    else:
        ej.pasos = pasos_mult(a, b)
        ej.explicacion_nino = " ".join(p_["texto"] for p_ in ej.pasos) + f" Resultado: {fmt(p)}."
        ej.explicacion_adulto = ("Los fallos típicos son olvidar lo que 'se lleva' o no correr un lugar a la izquierda el segundo resultado. "
                                 "Que estime antes (unos 20 × 40 = 800) para detectar resultados imposibles.")
    dist = [x for x in dist if x[0] is not None]
    ej.distractores = dist
    ej.genericos = [p + a, p - a, p + 10, p - 10]
    return ej


# ---------------------------------------------------------------- DIVISIÓN

@generador("div")
def gen_div(rng, d, cifras_dividendo=2, cifras_divisor=1, exacta=True, con_resto_en_respuesta=False, cero_en_cociente=False,
            desde_tabla=False):
    for _ in range(500):
        if desde_tabla:
            dv = rng.randint(2, 9 if d > 1 else 5)
            q = rng.randint(1, 10)
            D = dv * q
            r = 0
        else:
            dv = num_con_cifras(rng, cifras_divisor, 2)
            D = num_con_cifras(rng, cifras_dividendo)
            if exacta:
                D -= D % dv
            q, r = divmod(D, dv)
            if D < dv or q == 0:
                continue
        if cero_en_cociente and "0" not in str(q)[1:]:
            continue
        if exacta and r:
            continue
        if not exacta and not r:
            continue
        break
    else:
        return None
    if con_resto_en_respuesta:
        resp = f"cociente {fmt(q)}, resto {fmt(r)}"
        ej = Ejercicio(enunciado=f"Divide: {fmt(D)} : {fmt(dv)}. ¿Cuál es el cociente y el resto?", respuesta=resp,
                       parametros={"op": "div", "a": D, "b": dv, "q": q, "r": r})
        ej.distractores = [(f"cociente {fmt(q + 1)}, resto {fmt(r)}", "cociente_vecino"),
                           (f"cociente {fmt(q)}, resto {fmt(r + dv)}", "resto_mayor"), (f"cociente {fmt(q - 1)}, resto {fmt(r + dv)}", "resto_mayor"),
                           (f"cociente {fmt(r)}, resto {fmt(q)}", "resto_cambiado")]
        ej.genericos = [f"cociente {fmt(q)}, resto {fmt((r + 1) % dv)}", f"cociente {fmt(q + 1)}, resto {fmt(r)}", f"cociente {fmt(q - 1)}, resto {fmt(r)}"]
    else:
        ej = Ejercicio(enunciado=f"Calcula: {fmt(D)} : {fmt(dv)}", respuesta=fmt(q), parametros={"op": "div", "a": D, "b": dv, "q": q, "r": r})
        sq = str(q)
        dist = [(q + 1, "cociente_vecino"), (q - 1, "cociente_vecino"), (D * dv if D * dv < 10 ** 6 else None, "multiplica")]
        if "0" in sq[1:]:
            dist.insert(0, (int(sq.replace("0", "")), "olvida_cero"))
        ej.distractores = [(v, k) for v, k in dist if v is not None and v >= 0]
        ej.genericos = genericos_num(q, rng)
    if desde_tabla:
        ej.pasos = [{"paso": 1, "operacion": f"? × {dv} = {D}", "resultado": str(q), "texto": f"Busco en la tabla del {dv} qué número da {D}: {dv} × {q} = {D}."}]
        ej.explicacion_nino = f"Dividir es buscar en la tabla: ¿{dv} por cuánto da {D}? {dv} × {q} = {D}. Así que {D} : {dv} = {q}."
        ej.explicacion_adulto = "La división exacta se apoya en las tablas. Pregúntale la multiplicación al revés: '¿5 por cuánto da 35?'."
    else:
        ej.pasos = [{"paso": 1, "operacion": f"{D} : {dv}", "resultado": f"{q} (resto {r})", "texto": f"¿Cuántas veces cabe {fmt(dv)} en {fmt(D)}? Cabe {fmt(q)} veces" + (f" y sobran {fmt(r)}." if r else " exactas.")},
                    {"paso": 2, "operacion": f"{dv} × {q} + {r}", "resultado": str(D), "texto": f"Compruebo: {fmt(dv)} × {fmt(q)} + {fmt(r)} = {fmt(D)}."}]
        ej.explicacion_nino = ("Ve cogiendo cifras del dividendo por la izquierda hasta que quepa el divisor, y pregúntate cuántas veces cabe. "
                               + " ".join(p_["texto"] for p_ in ej.pasos))
        ej.explicacion_adulto = ("Comprobar siempre con 'divisor por cociente más resto = dividendo'. El resto nunca puede ser igual o mayor que el divisor; "
                                 "si al bajar una cifra no cabe, hay que poner un 0 en el cociente (el olvido más común).")
    return ej


# ---------------------------------------------------------------- CÁLCULO MENTAL

@generador("calcmental")
def gen_calcmental(rng, d, estrategia="dobles"):
    if estrategia == "dobles":
        a = rng.randint(1, 10 if d == 1 else 50 if d == 2 else 100)
        return _mental(rng, f"{a} + {a}", 2 * a, [(2 * a + 1, "casi_doble"), (a + 1, "suma_uno"), (2 * a - 2, "casi_doble")],
                       f"Es el doble de {a}: {a} + {a} = {2 * a}.", "Los dobles son la base de muchas estrategias: 6 + 7 es el doble de 6 más 1.")
    if estrategia == "casi_dobles":
        a = rng.randint(2, 9 if d < 3 else 49)
        return _mental(rng, f"{a} + {a + 1}", 2 * a + 1, [(2 * a, "casi_doble"), (2 * a + 2, "casi_doble"), (2 * a - 1, "casi_doble")],
                       f"{a} + {a + 1} es el doble de {a} y uno más: {2 * a} + 1 = {2 * a + 1}.", "Casi dobles: se apoya en el doble conocido.")
    if estrategia in ("mas9", "menos9"):
        a = rng.randint(11, 40 if d == 1 else 90)
        if estrategia == "mas9":
            return _mental(rng, f"{a} + 9", a + 9, [(a + 10, "compensacion_olvidada"), (a + 8, "compensacion_invertida"), (a - 9, "resta_en_vez")],
                           f"Sumar 9 es sumar 10 y quitar 1: {a} + 10 = {a + 10}, y {a + 10} − 1 = {a + 9}.", "Estrategia de compensación: +10 y −1.")
        return _mental(rng, f"{a} − 9", a - 9, [(a - 10, "compensacion_olvidada"), (a - 8, "compensacion_invertida"), (a + 9, "suma_en_vez")],
                       f"Restar 9 es restar 10 y sumar 1: {a} − 10 = {a - 10}, y {a - 10} + 1 = {a - 9}.", "Estrategia de compensación: −10 y +1.")
    if estrategia in ("decenas", "centenas"):
        u = 10 if estrategia == "decenas" else 100
        a = rng.randint(1, 9) * u + (rng.randint(0, 9) * (u // 10) if d > 1 else 0)
        b = rng.randint(1, 9) * u
        if rng.random() < 0.5:
            return _mental(rng, f"{a} + {b}", a + b, [(a + b // u, "cifra_suelta"), (a + b + u, "decena_de_mas"), (a + b - u, "decena_de_menos")],
                           f"Suma las {'decenas' if u == 10 else 'centenas'}: {a} + {b} = {a + b}.", "Sumar decenas o centenas enteras: solo cambia esa cifra.")
        a, b = max(a, b), min(a, b)
        return _mental(rng, f"{a} − {b}", a - b, [(a - b // u, "cifra_suelta"), (a - b + u, "decena_de_mas"), (a + b, "suma_en_vez")],
                       f"Resta las {'decenas' if u == 10 else 'centenas'}: {a} − {b} = {a - b}.", "Restar decenas o centenas enteras.")
    if estrategia == "complemento10":
        a = rng.randint(1, 9)
        return _mental(rng, f"{a} + ? = 10", 10 - a, [(10 + a, "suma_en_vez"), (9 - a, "uno_de_menos"), (11 - a, "uno_de_mas")],
                       f"Del {a} al 10 faltan {10 - a}: {a} + {10 - a} = 10.", "Los 'amigos del 10' son la base de la suma con llevada.")
    if estrategia == "complemento100":
        a = rng.randint(1, 99) if d > 1 else rng.randint(1, 9) * 10
        return _mental(rng, f"{a} + ? = 100", 100 - a, [(110 - a if a % 10 else 90 - a, "decena_mal"), (100 + a, "suma_en_vez"), (99 - a, "uno_de_menos")],
                       f"Del {a} al 100 faltan {100 - a}.", "Complementos a 100: primero a la decena siguiente, luego a 100.")
    if estrategia == "por5":
        a = rng.randint(2, 40 if d > 1 else 20) * 2
        return _mental(rng, f"{a} × 5", a * 5, [(a * 10, "sin_mitad"), (a // 2, "sin_por10"), (a + 5, "suma_en_vez")],
                       f"Multiplicar por 5 es multiplicar por 10 y hacer la mitad: {a} × 10 = {a * 10}, la mitad es {a * 5}.", "Estrategia: ×5 = ×10 : 2.")
    if estrategia == "por11":
        a = rng.randint(11, 45) if d > 1 else rng.randint(2, 9)
        return _mental(rng, f"{a} × 11", a * 11, [(a * 10, "sin_sumar"), (a * 11 + 10, "llevada_mal"), (a + 11, "suma_en_vez")],
                       f"{a} × 11 = {a} × 10 + {a} = {a * 10} + {a} = {a * 11}.", "×11 = ×10 + el número.")
    return None


def _mental(rng, op, r, dist, nino, adulto):
    ej = Ejercicio(enunciado=f"Calcula de cabeza: {op}", respuesta=fmt(r), parametros={"op": "mental", "expr": op})
    ej.distractores = dist
    ej.genericos = genericos_num(r, rng)
    ej.pasos = [{"paso": 1, "operacion": op, "resultado": str(r), "texto": nino}]
    ej.explicacion_nino = nino
    ej.explicacion_adulto = adulto
    return ej
