"""Fracciones, decimales, porcentajes, proporcionalidad y divisibilidad.

Claves de error:
  fracción: invierte, pintadas_no_pintadas, solo_numerador, suma_numeradores_y_denominadores,
            suma_denominadores, multiplica_cruzado, invierte_la_primera, no_simplifica, simplifica_solo_uno,
            suma_mismo_numero
  decimal:  coma_mal_colocada, alinea_por_la_derecha, coma_sentido_contrario, cero_omitido, lee_como_entero
  porcentaje: divide_por_porcentaje, porcentaje_como_cantidad, suma_en_vez
  proporción: razonamiento_aditivo, inversa_por_directa, directa_por_inversa
  divisibilidad: confunde_mcm_mcd, producto_en_vez_de_mcm, uno_como_primo, divisor_por_multiplo, olvida_divisor
"""
import math
from fractions import Fraction as F
from .nucleo import Ejercicio, generador, fmt, genericos_num, letras, ICONOS


def ff(x):
    x = F(x)
    return fmt(x.numerator) if x.denominator == 1 else f"{x.numerator}/{x.denominator}"


def fd(x, nd=6):
    v = round(float(x), nd)
    if v == int(v):
        return fmt(int(v))
    return fmt(v)


# ---------------------------------------------------------------- FRACCIONES

@generador("fraccion")
def gen_fraccion(rng, d, tipo="dibujo", den_max=10):
    den = rng.randint(2, den_max if d > 1 else min(den_max, 6))
    num = rng.randint(1, den - 1)
    if tipo == "dibujo":
        barra = "■" * num + "□" * (den - num)
        ej = Ejercicio(enunciado=f"¿Qué fracción está pintada?\n{barra}", respuesta=f"{num}/{den}", parametros={"op": "frac_dibujo", "n": num, "d": den},
                       datos={"lectura": "¿Qué fracción de la barra está pintada?"})
        ej.distractores = [(f"{num}/{den - num}" if den - num != num else f"{den}/{num}", "pintadas_no_pintadas"), (f"{den}/{num}", "invierte"),
                           (f"{den - num}/{den}", "cuenta_las_blancas")]
        ej.genericos = [f"{num + 1}/{den}", f"{max(num - 1, 1)}/{den}", f"{num}/{den + 1}"]
        ej.pasos = [{"paso": 1, "operacion": f"{den} partes", "resultado": str(den), "texto": f"La barra tiene {den} partes iguales: ese es el denominador."},
                    {"paso": 2, "operacion": f"{num} pintadas", "resultado": str(num), "texto": f"Hay {num} pintadas: ese es el numerador. Fracción: {num}/{den}."}]
        ej.explicacion_adulto = "Abajo va el total de partes iguales; arriba las que se cogen. El error típico es poner pintadas sobre no pintadas."
    elif tipo == "de_numero":
        k = rng.randint(2, 12 if d > 1 else 5)
        N = den * k
        r = num * k
        ej = Ejercicio(enunciado=f"¿Cuánto es {num}/{den} de {N}?", respuesta=fmt(r), parametros={"op": "frac_de", "n": num, "d": den, "N": N})
        ej.distractores = [(fmt(N // den), "solo_denominador"), (fmt(N * num), "solo_numerador"), (fmt(N - r), "complemento")]
        ej.genericos = genericos_num(r, rng)
        ej.pasos = [{"paso": 1, "operacion": f"{N} : {den}", "resultado": str(k), "texto": f"Divido {N} en {den} partes iguales: {N} : {den} = {k}."},
                    {"paso": 2, "operacion": f"{k} × {num}", "resultado": str(r), "texto": f"Cojo {num} de esas partes: {k} × {num} = {r}."}]
        ej.explicacion_adulto = "Fracción de un número: se divide por el denominador y se multiplica por el numerador."
    elif tipo == "equivalente":
        k = rng.randint(2, 5)
        g = math.gcd(num, den)
        num, den = num // g, den // g
        r = f"{num * k}/{den * k}"
        ej = Ejercicio(enunciado=f"¿Qué fracción es equivalente a {num}/{den}?", respuesta=r, parametros={"op": "frac_equiv", "n": num, "d": den, "k": k})
        ej.distractores = [(f"{num + k}/{den + k}", "suma_mismo_numero"), (f"{num * k}/{den}", "solo_numerador"), (f"{den * k}/{num * k}", "invierte")]
        ej.genericos = [f"{num * k + 1}/{den * k}", f"{num * k}/{den * k + 1}", f"{num + 1}/{den}"]
        ej.pasos = [{"paso": 1, "operacion": f"{num}·{k} / {den}·{k}", "resultado": r, "texto": f"Multiplico arriba y abajo por el mismo número ({k}): {num}/{den} = {r}."}]
        ej.explicacion_adulto = "Equivalentes = misma cantidad con otras partes. Se multiplica o divide numerador y denominador por lo mismo; sumar lo mismo no vale."
    elif tipo == "simplificar":
        k = rng.randint(2, 9)
        g = math.gcd(num, den)
        num, den = num // g, den // g
        k2 = rng.choice([x for x in (2, 3) if k % x == 0] or [1])
        N, D = num * k, den * k
        r = f"{num}/{den}"
        parcial = f"{N // k2}/{D // k2}" if k2 > 1 and k2 != k else f"{N}/{D // k}" if D % k == 0 and N % k else f"{N // 2}/{D}" if N % 2 == 0 else f"{N}/{D}"
        ej = Ejercicio(enunciado=f"Simplifica hasta la fracción irreducible: {N}/{D}", respuesta=r, parametros={"op": "frac_simpl", "N": N, "D": D})
        ej.distractores = [(parcial, "no_simplifica"), (f"{N // k}/{D}", "simplifica_solo_uno"), (f"{N - k}/{D - k}" if N > k else f"{D}/{N}", "suma_mismo_numero")]
        ej.genericos = [f"{num + 1}/{den}", f"{num}/{den + 1}", f"{den}/{num}"]
        ej.pasos = [{"paso": 1, "operacion": f"mcd({N}, {D}) = {math.gcd(N, D)}", "resultado": str(math.gcd(N, D)), "texto": f"Busco el mayor número que divide a {N} y a {D}: {math.gcd(N, D)}."},
                    {"paso": 2, "operacion": f"{N}:{math.gcd(N, D)} / {D}:{math.gcd(N, D)}", "resultado": r, "texto": f"Divido arriba y abajo: {r}."}]
        ej.explicacion_adulto = "Irreducible = ya no se puede dividir más. Si divide solo por 2 una vez, puede quedar sin terminar."
    elif tipo == "comparar":
        a, b = F(rng.randint(1, 9), rng.randint(2, 10)), F(rng.randint(1, 9), rng.randint(2, 10))
        while a == b:
            b = F(rng.randint(1, 9), rng.randint(2, 10))
        mayor = max(a, b)
        ej = Ejercicio(enunciado=f"¿Qué fracción es mayor: {ff(a)} o {ff(b)}?", respuesta=ff(mayor), parametros={"op": "frac_comp", "a": ff(a), "b": ff(b)})
        menor = min(a, b)
        ej.distractores = [(ff(menor), "por_cifras_sueltas"), ("son iguales", "iguala")]
        ej.genericos = [ff(mayor + F(1, 10)), ff(a + b)]
        m = a.denominator * b.denominator // math.gcd(a.denominator, b.denominator)
        ej.pasos = [{"paso": 1, "operacion": f"denominador común {m}", "resultado": f"{ff(a)} = {a.numerator * m // a.denominator}/{m}; {ff(b)} = {b.numerator * m // b.denominator}/{m}",
                     "texto": f"Las paso a denominador común {m}: {ff(a)} = {a.numerator * m // a.denominator}/{m} y {ff(b)} = {b.numerator * m // b.denominator}/{m}. Es mayor la de numerador mayor: {ff(mayor)}."}]
        ej.explicacion_adulto = "Una fracción no es mayor por tener números más grandes: 1/2 es mayor que 3/8. Pasar a denominador común o a decimal lo aclara."
    else:
        return None
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    return ej


@generador("frac_operar")
def gen_frac_operar(rng, d, op="suma", mismo_den=False, mixtos=False):
    for _ in range(200):
        if mismo_den:
            den = rng.randint(3, 12)
            a, b = F(rng.randint(1, den - 1), den), F(rng.randint(1, den - 1), den)
        else:
            a, b = F(rng.randint(1, 9), rng.randint(2, 10)), F(rng.randint(1, 9), rng.randint(2, 10))
            if a.denominator == b.denominator:
                continue
        if op == "resta" and a < b:
            a, b = b, a
        if op == "resta" and a == b:
            continue
        break
    sim = {"suma": "+", "resta": "−", "mult": "·", "div": ":"}[op]
    an, ad, bn, bd = a.numerator, a.denominator, b.numerator, b.denominator
    txt_a, txt_b = f"{an}/{ad}", f"{bn}/{bd}"
    if op == "suma":
        r = a + b
        dist = [(f"{an + bn}/{ad + bd}", "suma_numeradores_y_denominadores"), (f"{an + bn}/{ad * bd}" if ad != bd else f"{an + bn}/{2 * ad}", "suma_denominadores")]
    elif op == "resta":
        r = a - b
        dist = [(f"{an - bn}/{abs(ad - bd) or ad}" if an > bn else f"{an}/{ad}", "suma_numeradores_y_denominadores"), (f"{abs(an - bn)}/{ad * bd}" if ad != bd else f"{an - bn}/0", "suma_denominadores")]
    elif op == "mult":
        r = a * b
        dist = [(f"{an * bd}/{ad * bn}", "multiplica_cruzado"), (f"{an * bn}/{ad}", "solo_numerador"), (f"{an * bn}/{ad + bd}", "suma_denominadores")]
    else:
        r = a / b
        dist = [(ff(a * b), "no_invierte"), (ff(b / a), "invierte_la_primera"), (f"{an * bn}/{ad * bd}", "no_invierte")]
    sin_simpl = {"suma": f"{an * bd + bn * ad}/{ad * bd}", "resta": f"{an * bd - bn * ad}/{ad * bd}", "mult": f"{an * bn}/{ad * bd}", "div": f"{an * bd}/{ad * bn}"}[op]
    if sin_simpl != ff(r) and not sin_simpl.endswith("/1"):
        dist.append((sin_simpl, "no_simplifica"))
    ej = Ejercicio(enunciado=f"Calcula y simplifica: {txt_a} {sim} {txt_b}", respuesta=ff(r), parametros={"op": f"frac_{op}", "a": txt_a, "b": txt_b})
    ej.distractores = [(x, k) for x, k in dist if "/0" not in x]
    ej.genericos = [ff(r + F(1, r.denominator)), ff(abs(r - F(1, r.denominator)) or F(1, 2)), ff(r * 2)]
    if op in ("suma", "resta"):
        m = ad * bd // math.gcd(ad, bd)
        ej.pasos = [{"paso": 1, "operacion": f"mcm({ad}, {bd}) = {m}", "resultado": str(m), "texto": f"Busco un denominador común: {m}." if ad != bd else f"Tienen el mismo denominador, {ad}: se queda igual."},
                    {"paso": 2, "operacion": f"{an * m // ad}/{m} {sim} {bn * m // bd}/{m}", "resultado": f"{(an * m // ad) + (1 if op == 'suma' else -1) * (bn * m // bd)}/{m}",
                     "texto": f"{txt_a} = {an * m // ad}/{m} y {txt_b} = {bn * m // bd}/{m}. {'Sumo' if op == 'suma' else 'Resto'} los numeradores: {(an * m // ad) + (1 if op == 'suma' else -1) * (bn * m // bd)}/{m}."},
                    {"paso": 3, "operacion": "simplificar", "resultado": ff(r), "texto": f"Simplifico: {ff(r)}."}]
        ej.explicacion_adulto = "Para sumar o restar fracciones hacen falta partes del mismo tamaño (mismo denominador). Nunca se suman los denominadores."
    elif op == "mult":
        ej.pasos = [{"paso": 1, "operacion": f"{an}·{bn} / {ad}·{bd}", "resultado": sin_simpl, "texto": f"Multiplico numerador por numerador y denominador por denominador: {sin_simpl}."},
                    {"paso": 2, "operacion": "simplificar", "resultado": ff(r), "texto": f"Simplifico: {ff(r)}."}]
        ej.explicacion_adulto = "Multiplicar fracciones es en línea recta: arriba con arriba, abajo con abajo."
    else:
        ej.pasos = [{"paso": 1, "operacion": f"{txt_a} · {bd}/{bn}", "resultado": sin_simpl, "texto": f"Dividir es multiplicar por la inversa de la segunda: {txt_a} · {bd}/{bn} = {sin_simpl}."},
                    {"paso": 2, "operacion": "simplificar", "resultado": ff(r), "texto": f"Simplifico: {ff(r)}."}]
        ej.explicacion_adulto = "Para dividir se da la vuelta a la SEGUNDA fracción y se multiplica. Darle la vuelta a la primera es el error típico."
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    return ej


# ---------------------------------------------------------------- DECIMALES

def dec_aleatorio(rng, ent_max=100, nd=2):
    return round(rng.randint(0, ent_max) + rng.randint(1, 10 ** nd - 1) / 10 ** nd, nd)


NOMBRE_DEC = {1: "décimas", 2: "centésimas", 3: "milésimas"}


@generador("decimal")
def gen_decimal(rng, d, tipo="leer", nd=2):
    if tipo == "leer":
        e = rng.randint(0, 99)
        k = rng.randint(1, 10 ** nd - 1)
        v = e + k / 10 ** nd
        txt = f"{letras(e)} unidades y {letras(k)} {NOMBRE_DEC[nd]}" if e != 1 else f"una unidad y {letras(k)} {NOMBRE_DEC[nd]}"
        ej = Ejercicio(enunciado=f"Escribe con cifras: {txt}", respuesta=fd(v), parametros={"op": "dec_leer", "e": e, "k": k, "nd": nd})
        ej.distractores = [(f"{e},{k}" if len(str(k)) < nd else f"{e},0{k}", "cero_omitido"), (fmt(e * 10 ** len(str(k)) + k), "lee_como_entero"),
                           (f"{e},{str(k).zfill(nd)}0" if nd < 3 else f"{e},{k}", "cero_omitido")]
        ej.genericos = [fd(v + 0.1), fd(v + 1), fd(max(v - 1, 0.01))]
        ej.pasos = [{"paso": 1, "operacion": "tabla", "resultado": fd(v), "texto": f"Las {NOMBRE_DEC[nd]} ocupan {nd} lugar{'es' if nd > 1 else ''} después de la coma: {letras(k)} {NOMBRE_DEC[nd]} se escribe ,{str(k).zfill(nd)}."}]
        ej.explicacion_adulto = "El cero tras la coma es la dificultad: 'tres unidades y cinco centésimas' es 3,05, no 3,5."
    elif tipo in ("suma", "resta"):
        a, b = dec_aleatorio(rng, 50, rng.randint(1, nd)), dec_aleatorio(rng, 50, rng.randint(1, nd))
        if tipo == "resta" and a < b:
            a, b = b, a
        r = round(a + b if tipo == "suma" else a - b, 6)
        sa, sb = fd(a), fd(b)
        # error: alinear por la derecha (ignorando la coma)
        da, db = len(sa.split(",")[1]) if "," in sa else 0, len(sb.split(",")[1]) if "," in sb else 0
        ia, ib = int(sa.replace(",", "")), int(sb.replace(",", ""))
        m = max(da, db)
        mal = (ia + ib if tipo == "suma" else ia - ib) / 10 ** m if da != db else None
        ej = Ejercicio(enunciado=f"Calcula: {sa} {'+' if tipo == 'suma' else '−'} {sb}", respuesta=fd(r), parametros={"op": f"dec_{tipo}", "a": a, "b": b})
        ej.distractores = [(fd(mal) if mal is not None and mal >= 0 else None, "alinea_por_la_derecha"), (fd(r * 10), "coma_mal_colocada"), (fd(r / 10), "coma_mal_colocada")]
        ej.distractores = [x for x in ej.distractores if x[0]]
        ej.genericos = [fd(r + 0.1), fd(r + 1), fd(abs(r - 0.1))]
        ej.pasos = [{"paso": 1, "operacion": "coma bajo coma", "resultado": "", "texto": "Coloco los números con la coma debajo de la coma (relleno con ceros si hace falta)."},
                    {"paso": 2, "operacion": f"{sa} {'+' if tipo == 'suma' else '−'} {sb}", "resultado": fd(r), "texto": f"{'Sumo' if tipo == 'suma' else 'Resto'} como con números naturales y bajo la coma: {fd(r)}."}]
        ej.explicacion_adulto = "Coma debajo de coma. El error típico es alinear los números por la derecha como si fueran enteros."
    elif tipo == "mult":
        a = dec_aleatorio(rng, 20 if d > 1 else 9, 1 if d == 1 else 2)
        b = rng.randint(2, 9) if d < 3 else dec_aleatorio(rng, 9, 1)
        r = round(a * b, 6)
        sa, sb = fd(a), fd(b)
        nd_tot = (len(sa.split(",")[1]) if "," in sa else 0) + (len(sb.split(",")[1]) if "," in sb else 0)
        entero = int(sa.replace(",", "")) * int(sb.replace(",", ""))
        ej = Ejercicio(enunciado=f"Calcula: {sa} × {sb}", respuesta=fd(r), parametros={"op": "dec_mult", "a": a, "b": b})
        ej.distractores = [(fd(entero / 10 ** max(nd_tot - 1, 0)), "coma_mal_colocada"), (fd(entero / 10 ** (nd_tot + 1)), "coma_mal_colocada"), (fmt(entero), "olvida_la_coma")]
        ej.genericos = [fd(r + 1), fd(r + 0.1)]
        ej.pasos = [{"paso": 1, "operacion": f"{sa.replace(',', '')} × {sb.replace(',', '')}", "resultado": fmt(entero), "texto": f"Multiplico sin mirar las comas: {fmt(entero)}."},
                    {"paso": 2, "operacion": f"{nd_tot} decimales", "resultado": fd(r), "texto": f"Entre los dos factores hay {nd_tot} cifra{'s' if nd_tot != 1 else ''} decimal{'es' if nd_tot != 1 else ''}: separo {nd_tot} desde la derecha → {fd(r)}."}]
        ej.explicacion_adulto = "En la multiplicación la coma no se alinea: se cuentan las cifras decimales de los dos factores."
    elif tipo == "por_potencia10":
        a = dec_aleatorio(rng, 99, rng.randint(1, 3))
        p = rng.choice([10, 100, 1000])
        dividir = rng.random() < 0.5
        r = round(a / p if dividir else a * p, 8)
        ej = Ejercicio(enunciado=f"Calcula: {fd(a)} {':' if dividir else '×'} {fmt(p)}", respuesta=fd(r, 8), parametros={"op": "dec_pot10", "a": a, "p": p, "dividir": dividir})
        ej.distractores = [(fd(a * p if dividir else a / p, 8), "coma_sentido_contrario"), (fd(r * 10, 8), "cuenta_ceros_mal"), (fd(r / 10, 8), "cuenta_ceros_mal")]
        ej.pasos = [{"paso": 1, "operacion": "mover la coma", "resultado": fd(r, 8), "texto": f"{'Dividir' if dividir else 'Multiplicar'} por {fmt(p)} es mover la coma {len(str(p)) - 1} lugar{'es' if p > 10 else ''} a la {'izquierda' if dividir else 'derecha'}: {fd(r, 8)}."}]
        ej.explicacion_adulto = "Por 10, 100, 1000 la coma se mueve tantos lugares como ceros: a la derecha al multiplicar, a la izquierda al dividir."
    elif tipo == "div":
        b = rng.randint(2, 9)
        q = dec_aleatorio(rng, 20, rng.randint(1, 2))
        a = round(q * b, 6)
        ej = Ejercicio(enunciado=f"Calcula: {fd(a)} : {b}", respuesta=fd(q), parametros={"op": "dec_div", "a": a, "b": b})
        ej.distractores = [(fd(q * 10), "coma_mal_colocada"), (fd(q / 10), "coma_mal_colocada"), (fmt(int(round(q * 100))), "olvida_la_coma")]
        ej.pasos = [{"paso": 1, "operacion": f"{fd(a)} : {b}", "resultado": fd(q), "texto": f"Divido como con naturales y, al bajar la primera cifra decimal, pongo la coma en el cociente: {fd(q)}."}]
        ej.explicacion_adulto = "Al dividir un decimal entre un natural, la coma del cociente se pone justo al bajar la primera cifra decimal."
    elif tipo == "fraccion_a_decimal":
        den = rng.choice([2, 4, 5, 8, 10, 20, 25, 100] if d < 3 else [3, 6, 9, 11])
        num = rng.randint(1, den - 1) if den > 2 else 1
        v = num / den
        ej = Ejercicio(enunciado=f"Escribe {num}/{den} como número decimal.", respuesta=fd(v, 4) if den not in (3, 6, 9, 11) else periodico(num, den),
                       parametros={"op": "frac_a_dec", "n": num, "d": den})
        ej.distractores = [(f"{num},{den}", "lee_como_entero"), (fd(den / num, 4), "invierte"), (fd(v * 10, 4), "coma_mal_colocada")]
        ej.pasos = [{"paso": 1, "operacion": f"{num} : {den}", "resultado": ej.respuesta, "texto": f"Una fracción es una división: {num} : {den} = {ej.respuesta}."}]
        ej.explicacion_adulto = "La raya de fracción significa 'dividido entre'. 3/4 no es 3,4."
    else:
        return None
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    return ej


def periodico(num, den):
    ent, r = divmod(num, den)
    digs, vistos = [], {}
    while r and r not in vistos:
        vistos[r] = len(digs)
        r *= 10
        digs.append(str(r // den))
        r %= den
    if not r:
        return fmt(ent) + "," + "".join(digs)
    i = vistos[r]
    return fmt(ent) + "," + "".join(digs[:i]) + "".join(c + "̅" for c in digs[i:])


# ---------------------------------------------------------------- PORCENTAJES Y PROPORCIONALIDAD

@generador("porcentaje")
def gen_porcentaje(rng, d, tipo="de_cantidad"):
    if tipo == "de_cantidad":
        p = rng.choice([10, 20, 25, 50, 75] if d == 1 else [5, 15, 30, 40, 60, 12, 35])
        N = rng.randint(2, 40) * (100 // math.gcd(p, 100))
        r = N * p // 100
        ej = Ejercicio(enunciado=f"¿Cuánto es el {p} % de {fmt(N)}?", respuesta=fmt(r), parametros={"op": "porc", "p": p, "N": N})
        ej.distractores = [(fmt(N // p) if N % p == 0 else fmt(N - r), "divide_por_porcentaje"), (fmt(p), "porcentaje_como_cantidad"), (fmt(N - r), "complemento")]
        ej.pasos = [{"paso": 1, "operacion": f"{fmt(N)} : 100 × {p}", "resultado": fmt(r), "texto": f"El {p} % es {p} de cada 100: {fmt(N)} × {p} : 100 = {fmt(r)}."}]
    elif tipo == "aumento":
        p = rng.choice([10, 20, 25, 50] if d == 1 else [5, 15, 30, 12, 21])
        N = rng.randint(2, 50) * (100 // math.gcd(p, 100))
        baja = rng.random() < 0.5
        r = N * (100 - p if baja else 100 + p) // 100
        ej = Ejercicio(enunciado=f"Un precio de {fmt(N)} € {'baja' if baja else 'sube'} un {p} %. ¿Cuál es el precio final?", respuesta=f"{fmt(r)} €",
                       parametros={"op": "porc_var", "p": p, "N": N, "baja": baja})
        ej.distractores = [(f"{fmt(N * p // 100)} €", "solo_el_porcentaje"), (f"{fmt(N - p if baja else N + p)} €", "suma_en_vez"),
                           (f"{fmt(N * (100 + p if baja else 100 - p) // 100)} €", "sentido_contrario")]
        ej.pasos = [{"paso": 1, "operacion": f"{p} % de {N}", "resultado": fmt(N * p // 100), "texto": f"El {p} % de {fmt(N)} es {fmt(N * p // 100)}."},
                    {"paso": 2, "operacion": f"{N} {'−' if baja else '+'} {N * p // 100}", "resultado": fmt(r), "texto": f"{'Lo resto' if baja else 'Lo sumo'}: {fmt(r)} €."}]
    else:
        return None
    ej.genericos = genericos_num(int(ej.respuesta.replace(" €", "").replace(" ", "")), rng)
    ej.explicacion_nino = " ".join(p_["texto"] for p_ in ej.pasos)
    ej.explicacion_adulto = "Un porcentaje es una fracción con denominador 100. El 25 % es la cuarta parte; el 50 %, la mitad."
    return ej


@generador("proporcion")
def gen_proporcion(rng, d, tipo="directa", contexto=True):
    for _ in range(200):
        a = rng.randint(2, 12)
        k = rng.randint(2, 9)
        c = rng.randint(2, 15)
        if c == a:
            continue
        if tipo == "directa":
            b = a * k
            r = c * k
            mal_ad = b + (c - a)
            mal_inv = F(a * b, c)
        else:
            b = rng.randint(2, 12) * c
            if (a * b) % c:
                continue
            r = a * b // c
            mal_ad = b - (c - a)
            mal_inv = F(b * c, a)
        if r <= 0 or mal_ad <= 0:
            continue
        break
    if tipo == "directa":
        o = rng.choice([("cuadernos", "€"), ("kilos de naranjas", "€"), ("horas", "km"), ("paquetes", "galletas")])
        enun = f"Si {a} {o[0]} cuestan {b} {o[1]}, ¿cuánto cuestan {c} {o[0]}?" if o[1] == "€" else f"Si en {a} {o[0]} hay {b} {o[1]}, ¿cuántos {o[1]} hay en {c} {o[0]}?"
        if o[0] == "horas":
            enun = f"Un tren recorre {b} km en {a} horas a velocidad constante. ¿Cuántos km recorre en {c} horas?"
    else:
        enun = f"{a} grifos iguales llenan un depósito en {b} horas. ¿Cuántas horas tardarían {c} grifos?"
    ej = Ejercicio(enunciado=enun, respuesta=fmt(r), parametros={"op": f"prop_{tipo}", "a": a, "b": b, "c": c})
    ej.distractores = [(fmt(mal_ad), "razonamiento_aditivo"), (ff(mal_inv) if mal_inv.denominator == 1 else fd(mal_inv, 2), "inversa_por_directa" if tipo == "directa" else "directa_por_inversa")]
    ej.genericos = genericos_num(r, rng)
    if tipo == "directa":
        ej.pasos = [{"paso": 1, "operacion": f"{b} : {a}", "resultado": fmt(b // a), "texto": f"Calculo lo que corresponde a 1: {b} : {a} = {b // a}."},
                    {"paso": 2, "operacion": f"{b // a} × {c}", "resultado": fmt(r), "texto": f"Y para {c}: {b // a} × {c} = {r}."}]
        ej.explicacion_adulto = "Proporcionalidad directa: si una cantidad se duplica, la otra también. El error típico es sumar la diferencia en vez de multiplicar."
    else:
        ej.pasos = [{"paso": 1, "operacion": f"{a} × {b}", "resultado": fmt(a * b), "texto": f"Con 1 grifo tardaría {a} veces más: {a} × {b} = {a * b} horas."},
                    {"paso": 2, "operacion": f"{a * b} : {c}", "resultado": fmt(r), "texto": f"Con {c} grifos, {c} veces menos: {a * b} : {c} = {r} horas."}]
        ej.explicacion_adulto = "Proporcionalidad inversa: más grifos, menos tiempo. Hay que preguntarse primero si al aumentar una la otra aumenta o disminuye."
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    return ej


# ---------------------------------------------------------------- DIVISIBILIDAD

def divisores(n):
    return [i for i in range(1, n + 1) if n % i == 0]


def es_primo(n):
    return n > 1 and all(n % i for i in range(2, int(n ** 0.5) + 1))


def factoriza(n):
    out, p = [], 2
    while n > 1:
        while n % p == 0:
            out.append(p)
            n //= p
        p += 1
    return out


def ftxt(fs):
    from collections import Counter
    from .jerarquia import sup
    c = Counter(fs)
    return " · ".join(f"{p}{sup(e) if e > 1 else ''}" for p, e in sorted(c.items()))


@generador("divisibilidad")
def gen_divisibilidad(rng, d, tipo="multiplo"):
    if tipo == "multiplo":
        b = rng.randint(2, 12)
        r = b * rng.randint(2, 12)
        otros = [r + 1, r - 1, r + b // 2 if b > 2 else r + 3]
        ej = Ejercicio(enunciado=f"¿Cuál de estos números es múltiplo de {b}?", respuesta=fmt(r), parametros={"op": "multiplo", "b": b, "r": r}, datos={"opciones_fijas": True})
        ej.distractores = [(fmt(x), None) for x in otros if x % b]
        ej.distractores.insert(0, (fmt(b // 2) if b % 2 == 0 and b > 2 else fmt(1), "divisor_por_multiplo"))
        ej.pasos = [{"paso": 1, "operacion": f"{r} : {b}", "resultado": str(r // b), "texto": f"{r} : {b} = {r // b} exacto, así que {r} está en la tabla del {b}: es múltiplo."}]
        ej.explicacion_adulto = "Múltiplo de 6: está en la tabla del 6 (grande). Divisor de 6: cabe exacto en el 6 (pequeño). Se confunden mucho."
    elif tipo == "divisores":
        n = rng.choice([12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 50, 60] if d > 1 else [6, 8, 10, 12, 15, 16, 18, 20])
        ds = divisores(n)
        resp = ", ".join(str(x) for x in ds)
        ej = Ejercicio(enunciado=f"¿Cuáles son todos los divisores de {n}?", respuesta=resp, parametros={"op": "divisores", "n": n})
        ej.distractores = [(", ".join(str(x) for x in ds if x not in (1, n)), "olvida_divisor"), (", ".join(str(x) for x in ds[:-1]), "olvida_divisor"),
                           (", ".join(str(n * k) for k in range(1, 5)), "divisor_por_multiplo")]
        ej.pasos = [{"paso": 1, "operacion": "parejas", "resultado": resp, "texto": "Busco parejas que multiplicadas den " + str(n) + ": " + ", ".join(f"{x} × {n // x}" for x in ds if x * x <= n) + ". Los divisores son " + resp + "."}]
        ej.explicacion_adulto = "Buscar divisores por parejas evita olvidar alguno. El 1 y el propio número siempre son divisores."
    elif tipo == "primo":
        primos = [p for p in range(2, 100 if d > 1 else 30) if es_primo(p)]
        comp = [c for c in range(4, 100 if d > 1 else 30) if not es_primo(c)]
        p = rng.choice(primos)
        trampas = [x for x in (1, 9, 15, 21, 27, 33, 39, 49, 51, 57, 87, 91) if x < (100 if d > 1 else 30)]
        ej = Ejercicio(enunciado="¿Cuál de estos números es primo?", respuesta=str(p), parametros={"op": "primo", "p": p}, datos={"opciones_fijas": True})
        ej.distractores = [(str(1), "uno_como_primo"), (str(rng.choice(trampas[1:])), "impar_es_primo"), (str(rng.choice(comp)), None)]
        ej.genericos = [str(x) for x in rng.sample(comp, 5)]
        ej.pasos = [{"paso": 1, "operacion": f"divisores de {p}", "resultado": "1 y él mismo", "texto": f"{p} solo se puede dividir exacto entre 1 y entre {p}: es primo."}]
        ej.explicacion_adulto = "Primo = exactamente dos divisores. El 1 no es primo. Ser impar no basta (9, 15, 21 no son primos)."
    elif tipo == "factorizar":
        n = rng.choice([12, 18, 20, 24, 28, 36, 40, 45, 48, 60, 72, 84, 90, 100, 120, 150, 180] if d > 1 else [12, 18, 20, 24, 30, 36])
        fs = factoriza(n)
        resp = ftxt(fs)
        ej = Ejercicio(enunciado=f"Descompón {n} en factores primos.", respuesta=resp, parametros={"op": "factorizar", "n": n})
        c = divisores(n)
        noprimo = next((x for x in c if 1 < x < n and not es_primo(x)), 4)
        ej.distractores = [(f"{noprimo} · {n // noprimo}", "factor_no_primo"), (ftxt(fs[:-1]), "olvida_factor"), (" · ".join(str(p) for p in sorted(set(fs))), "sin_exponentes")]
        ej.genericos = [ftxt(fs + [2]), ftxt(fs + [3]), ftxt([x if x != fs[-1] else fs[-1] + 2 for x in fs])]
        ej.pasos = [{"paso": 1, "operacion": "dividir por primos", "resultado": resp, "texto": f"Divido entre primos (2, 3, 5…) mientras se pueda: {' · '.join(str(p) for p in fs)} = {n}. Agrupado: {resp}."}]
        ej.explicacion_adulto = "Factorizar es escribir el número como producto de primos. Si aparece un 4 o un 6, aún no está terminado."
    else:  # mcm / mcd
        for _ in range(100):
            a, b = rng.randint(4, 30 if d > 1 else 15), rng.randint(4, 30 if d > 1 else 15)
            if a != b and math.gcd(a, b) > 1 and a * b // math.gcd(a, b) != a * b:
                break
        m, g = a * b // math.gcd(a, b), math.gcd(a, b)
        if tipo == "mcm":
            ej = Ejercicio(enunciado=f"Calcula el mínimo común múltiplo: mcm({a}, {b})", respuesta=str(m), parametros={"op": "mcm", "a": a, "b": b})
            ej.distractores = [(str(g), "confunde_mcm_mcd"), (str(a * b), "producto_en_vez_de_mcm"), (str(m * 2), None)]
            ej.pasos = [{"paso": 1, "operacion": f"{ftxt(factoriza(a))} y {ftxt(factoriza(b))}", "resultado": str(m), "texto": f"{a} = {ftxt(factoriza(a))} y {b} = {ftxt(factoriza(b))}. Cojo los factores comunes y no comunes con el mayor exponente: mcm = {m}."}]
        else:
            ej = Ejercicio(enunciado=f"Calcula el máximo común divisor: mcd({a}, {b})", respuesta=str(g), parametros={"op": "mcd", "a": a, "b": b})
            ej.distractores = [(str(m), "confunde_mcm_mcd"), ("1" if g != 1 else "2", None), (str(min(a, b)), "el_menor")]
            ej.pasos = [{"paso": 1, "operacion": f"{ftxt(factoriza(a))} y {ftxt(factoriza(b))}", "resultado": str(g), "texto": f"{a} = {ftxt(factoriza(a))} y {b} = {ftxt(factoriza(b))}. Cojo solo los factores comunes con el menor exponente: mcd = {g}."}]
        ej.explicacion_adulto = "El mcm es un múltiplo (mayor o igual que los dos números); el mcd es un divisor (menor o igual). Si el resultado no cumple eso, se han confundido."
    if tipo in ("mcm", "mcd"):
        base = m if tipo == "mcm" else g
        ej.genericos = [str(x) for x in (base * 3, base + a, base + b, base * 2, base + 1) if x > 0]
    elif not ej.genericos:
        ej.genericos = []
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    return ej
