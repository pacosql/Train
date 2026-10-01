"""Álgebra, funciones, análisis, estadística y probabilidad (calculables).

Claves de error:
  ecuaciones: transpone_sin_cambiar_signo, divide_mal, resta_en_vez_de_dividir, signos_raices, una_sola_solucion
  polinomios: suma_exponentes_al_sumar, cuadrado_sin_doble_producto, signo_mal, olvida_termino
  funciones: pendiente_invertida, pendiente_signo, ordenada_por_pendiente
  derivadas: no_baja_exponente, no_resta_uno, deriva_constante
  integrales: no_divide, olvida_constante, deriva_en_vez
  estadística: mediana_sin_ordenar, media_sin_dividir, moda_por_mayor, rango_mal
  probabilidad: favorables_entre_desfavorables, cuenta_casos_mal, suma_en_vez_de_multiplicar
  combinatoria: permuta_en_vez_de_combinar, suma_en_vez
"""
import math
from fractions import Fraction as F
from .nucleo import Ejercicio, generador, fmt, genericos_num, NOMBRES
from .fracdec import ff
from .jerarquia import sup


def mono(c, e, var="x", primero=False):
    """Monomio en texto: c·x^e con signos bonitos."""
    if c == 0:
        return ""
    s = "−" if c < 0 else ("" if primero else "+")
    a = abs(c)
    if e == 0:
        cuerpo = ff(a)
    else:
        cuerpo = ("" if a == 1 else ff(a)) + var + (sup(e) if e > 1 else "")
    return (s + ("" if primero else " ") + cuerpo) if not primero else (s + cuerpo)


def poli(coefs, var="x"):
    """coefs: dict exponente -> coeficiente."""
    t = []
    for e in sorted(coefs, reverse=True):
        c = coefs[e]
        if c:
            t.append(mono(c, e, var, primero=not t))
    return " ".join(t) if t else "0"


@generador("ecuacion1")
def gen_ec1(rng, d, tipo="ax+b=c"):
    x = rng.randint(-9, 12) if d > 1 else rng.randint(1, 12)
    a = rng.choice([2, 3, 4, 5, 6, 7, 8, 9] + ([-2, -3, -5] if d > 2 else []))
    b = rng.randint(-15, 15) or 4
    if tipo == "x+b=c":
        a = 1
    c = a * x + b
    if tipo == "ambos_lados":
        # (a + p)x + b = p·x + c  ⇔  a·x + b = c
        p = rng.randint(1, 5)
        enun = f"{poli({1: a + p, 0: b})} = {poli({1: p, 0: c})}"
    else:
        enun = f"{poli({1: a, 0: b})} = {fmt(c)}"
    ej = Ejercicio(enunciado=f"Resuelve: {enun}", respuesta=f"x = {fmt(x)}", parametros={"op": "ec1", "a": a, "b": b, "c": c, "x": x})
    dist = []
    v1 = F(c + b, a)
    dist.append((f"x = {ff(v1) if v1.denominator == 1 else ff(v1)}", "transpone_sin_cambiar_signo"))
    dist.append((f"x = {fmt(c - b - a)}", "resta_en_vez_de_dividir"))
    v3 = F(a, c - b) if c - b else None
    if v3 is not None:
        dist.append((f"x = {ff(v3)}", "divide_mal"))
    dist.append((f"x = {fmt(-x)}", "signo_mal"))
    ej.distractores = [(v.replace("x = -", "x = −"), k) for v, k in dist]
    ej.genericos = [f"x = {fmt(x + 1)}", f"x = {fmt(x - 1)}", f"x = {fmt(x + 2)}"]
    ej.pasos = [{"paso": 1, "operacion": f"{poli({1: a})} = {fmt(c)} {'−' if b > 0 else '+'} {abs(b)}", "resultado": fmt(c - b), "texto": f"Paso el {fmt(b)} al otro lado cambiando de signo: {poli({1: a})} = {fmt(c)} {'−' if b > 0 else '+'} {abs(b)} = {fmt(c - b)}."},
                {"paso": 2, "operacion": f"x = {fmt(c - b)} : {fmt(a)}", "resultado": fmt(x), "texto": f"El {fmt(a)} que multiplica a la x pasa dividiendo: x = {fmt(c - b)} : {fmt(a)} = {fmt(x)}."},
                {"paso": 3, "operacion": "comprobar", "resultado": "ok", "texto": f"Compruebo: {fmt(a)} · {fmt(x)} {'+' if b >= 0 else '−'} {abs(b)} = {fmt(c)}. ✓"}]
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    ej.explicacion_adulto = "Una ecuación es una balanza: lo que se hace a un lado se hace al otro. 'Pasar' un término cambia su operación (sumar ↔ restar, multiplicar ↔ dividir)."
    return ej


@generador("ecuacion2")
def gen_ec2(rng, d, completa=True):
    r1, r2 = rng.choice([i for i in range(-9, 10) if i]), rng.choice([i for i in range(-9, 10) if i])
    while completa and r1 == r2:
        r2 = rng.choice([i for i in range(-9, 10) if i])
    if not completa:
        if rng.random() < 0.5:
            r2 = 0
        else:
            r2 = -r1 or 3
            r1 = abs(r2)
    b, c = -(r1 + r2), r1 * r2
    sol = sorted({r1, r2})
    txt = lambda s: " y ".join(f"x = {fmt(v)}" for v in s) if len(s) > 1 else f"x = {fmt(s[0])}"
    ej = Ejercicio(enunciado=f"Resuelve: {poli({2: 1, 1: b, 0: c})} = 0", respuesta=txt(sol), parametros={"op": "ec2", "b": b, "c": c, "r": sol})
    ej.distractores = [(txt(sorted({-r1, -r2})), "signos_raices"), (f"x = {fmt(sol[-1])}", "una_sola_solucion"), (txt(sorted({r1 + 1, r2 - 1})), None)]
    ej.genericos = [txt(sorted({r1 * 2, r2})), txt(sorted({r1, r2 + 2}))]
    disc = b * b - 4 * c
    ej.pasos = [{"paso": 1, "operacion": f"Δ = {b}² − 4·{c}", "resultado": str(disc), "texto": f"a = 1, b = {fmt(b)}, c = {fmt(c)}. Δ = b² − 4ac = {fmt(b * b)} − {fmt(4 * c)} = {fmt(disc)}."},
                {"paso": 2, "operacion": f"x = (−b ± √Δ)/2", "resultado": txt(sol), "texto": f"x = ({fmt(-b)} ± √{fmt(disc)}) / 2 = ({fmt(-b)} ± {int(math.isqrt(disc))}) / 2 → {txt(sol)}."}]
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    ej.explicacion_adulto = "Fórmula: x = (−b ± √(b² − 4ac)) / 2a. El signo de −b es la fuente de casi todos los fallos; que compruebe sustituyendo."
    return ej


@generador("sistema")
def gen_sistema(rng, d):
    x, y = rng.randint(-6, 9), rng.randint(-6, 9)
    for _ in range(100):
        a, b, c, e = rng.randint(1, 5), rng.choice([-3, -2, -1, 1, 2, 3]), rng.randint(1, 5), rng.choice([-3, -2, -1, 1, 2, 3])
        if a * e - b * c:
            break
    k1, k2 = a * x + b * y, c * x + e * y
    enun = f"{poli({1: a}, 'x')} {poli({1: b}, 'y') if b < 0 else '+ ' + poli({1: b}, 'y')} = {fmt(k1)}\n{poli({1: c}, 'x')} {poli({1: e}, 'y') if e < 0 else '+ ' + poli({1: e}, 'y')} = {fmt(k2)}"
    ej = Ejercicio(enunciado=f"Resuelve el sistema:\n{enun}", respuesta=f"x = {fmt(x)}, y = {fmt(y)}", parametros={"op": "sistema", "a": a, "b": b, "c": c, "e": e, "k1": k1, "k2": k2})
    ej.distractores = [(f"x = {fmt(y)}, y = {fmt(x)}", "intercambia"), (f"x = {fmt(-x)}, y = {fmt(y)}", "signo_mal"), (f"x = {fmt(x)}, y = {fmt(-y)}", "signo_mal")]
    ej.genericos = [f"x = {fmt(x + 1)}, y = {fmt(y)}", f"x = {fmt(x)}, y = {fmt(y + 1)}"]
    ej.pasos = [{"paso": 1, "operacion": "reducción o sustitución", "resultado": "", "texto": "Elimino una incógnita (multiplicando las ecuaciones para igualar coeficientes y restando, o despejando y sustituyendo)."},
                {"paso": 2, "operacion": "", "resultado": f"x = {fmt(x)}, y = {fmt(y)}", "texto": f"Sale x = {fmt(x)} e y = {fmt(y)}. Compruebo en las dos ecuaciones: {a}·{fmt(x)} + ({b})·{fmt(y)} = {fmt(k1)} ✓ y {c}·{fmt(x)} + ({e})·{fmt(y)} = {fmt(k2)} ✓."}]
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    ej.explicacion_adulto = "La solución de un sistema tiene que cumplir las dos ecuaciones a la vez: comprobarlo es la mejor defensa contra los errores de signo."
    return ej


@generador("polinomio")
def gen_polinomio(rng, d, tipo="valor"):
    if tipo == "valor":
        co = {2: rng.randint(-3, 4) or 1, 1: rng.randint(-6, 6), 0: rng.randint(-9, 9)}
        xv = rng.randint(-3, 4)
        r = sum(c * xv ** e for e, c in co.items())
        ej = Ejercicio(enunciado=f"Calcula el valor numérico de P(x) = {poli(co)} para x = {fmt(xv)}", respuesta=fmt(r), parametros={"op": "valor_num", "p": co, "x": xv})
        mal = sum(c * (-(abs(xv) ** e) if xv < 0 and e == 2 else xv ** e) for e, c in co.items())
        ej.distractores = [(fmt(mal) if mal != r else fmt(r + 2 * co[2]), "cuadrado_negativo"), (fmt(sum(c * xv * e if e else c for e, c in co.items())), "potencia_como_producto"),
                           (fmt(co[2] * xv ** 2 + co[1] + xv + co[0]), "signo_mal")]
        ej.genericos = genericos_num(r, rng, entero=False) if r < 0 else genericos_num(r, rng)
        ej.pasos = [{"paso": 1, "operacion": f"P({fmt(xv)})", "resultado": fmt(r), "texto": f"Sustituyo x por ({fmt(xv)}) con paréntesis: " + " ".join(mono(c, 0, primero=i == 0) if e == 0 else f"{'+' if c > 0 and i else '−' if c < 0 else ''} {abs(c)}·({fmt(xv)}){sup(e) if e > 1 else ''}" for i, (e, c) in enumerate(sorted(co.items(), reverse=True)) if c) + f" = {fmt(r)}."}]
    elif tipo == "identidad":
        a = rng.randint(1, 5)
        b = rng.randint(1, 9)
        k = rng.choice(["suma", "resta", "sumaxdif"])
        if k == "suma":
            enun, r = f"(x + {b})²", poli({2: 1, 1: 2 * b, 0: b * b})
            dist = [(poli({2: 1, 0: b * b}), "cuadrado_sin_doble_producto"), (poli({2: 1, 1: b, 0: b * b}), "doble_producto_sin_2"), (poli({2: 1, 1: 2 * b, 0: 2 * b}), None)]
        elif k == "resta":
            enun, r = f"(x − {b})²", poli({2: 1, 1: -2 * b, 0: b * b})
            dist = [(poli({2: 1, 0: -b * b}), "cuadrado_sin_doble_producto"), (poli({2: 1, 1: 2 * b, 0: b * b}), "signo_mal"), (poli({2: 1, 0: b * b}), "cuadrado_sin_doble_producto")]
        else:
            enun, r = f"(x + {b})(x − {b})", poli({2: 1, 0: -b * b})
            dist = [(poli({2: 1, 0: b * b}), "signo_mal"), (poli({2: 1, 1: -2 * b, 0: -b * b}), None), (poli({2: 1, 1: 2 * b, 0: b * b}), "confunde_identidades")]
        ej = Ejercicio(enunciado=f"Desarrolla: {enun}", respuesta=r, parametros={"op": "identidad", "tipo": k, "b": b})
        ej.distractores = dist
        ej.genericos = [poli({2: 1, 1: 3 * b, 0: b * b}), poli({2: 2, 1: 2 * b, 0: b * b})]
        regla = {"suma": "(a + b)² = a² + 2ab + b²", "resta": "(a − b)² = a² − 2ab + b²", "sumaxdif": "(a + b)(a − b) = a² − b²"}[k]
        ej.pasos = [{"paso": 1, "operacion": regla, "resultado": r, "texto": f"Aplico {regla} con a = x y b = {b}: {r}."}]
    else:  # suma de polinomios
        p1 = {2: rng.randint(-5, 5) or 2, 1: rng.randint(-7, 7), 0: rng.randint(-9, 9)}
        p2 = {2: rng.randint(-5, 5) or -1, 1: rng.randint(-7, 7), 0: rng.randint(-9, 9)}
        s = {e: p1[e] + p2[e] for e in p1}
        ej = Ejercicio(enunciado=f"Calcula: ({poli(p1)}) + ({poli(p2)})", respuesta=poli(s), parametros={"op": "suma_poli", "p1": p1, "p2": p2})
        ej.distractores = [(poli({4: p1[2] + p2[2], 2: p1[1] + p2[1], 0: p1[0] + p2[0]}), "suma_exponentes_al_sumar"), (poli({2: p1[2] + p2[2], 1: p1[1] - p2[1], 0: p1[0] + p2[0]}), "signo_mal"),
                           (poli({2: p1[2] + p2[2], 1: p1[1] + p2[1]}), "olvida_termino")]
        ej.genericos = [poli({2: s[2] + 1, 1: s[1], 0: s[0]}), poli({2: s[2], 1: s[1] + 1, 0: s[0]})]
        ej.pasos = [{"paso": 1, "operacion": "términos semejantes", "resultado": poli(s), "texto": f"Sumo los términos del mismo grado (x² con x², x con x, números con números): {poli(s)}. Los exponentes no cambian al sumar."}]
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    ej.explicacion_adulto = "Solo se suman términos semejantes (misma letra y mismo exponente). Al sustituir un número negativo, siempre entre paréntesis."
    return ej


@generador("funcion_lineal")
def gen_fun_lineal(rng, d, tipo="pendiente"):
    x1, y1 = rng.randint(-5, 5), rng.randint(-5, 5)
    m = rng.choice([-3, -2, -1, 1, 2, 3, 4] + ([F(1, 2), F(-1, 2)] if d > 2 else []))
    dx = rng.choice([1, 2, 3, 4]) * (2 if isinstance(m, F) else 1)
    x2, y2 = x1 + dx, y1 + m * dx
    n = y1 - m * x1
    if tipo == "pendiente":
        ej = Ejercicio(enunciado=f"¿Cuál es la pendiente de la recta que pasa por ({fmt(x1)}, {fmt(int(y1))}) y ({fmt(x2)}, {fmt(int(y2))})?", respuesta=ff(m), parametros={"op": "pendiente", "p1": [x1, y1], "p2": [x2, int(y2)]})
        ej.distractores = [(ff(F(1) / m), "pendiente_invertida"), (ff(-m), "pendiente_signo"), (ff(F(int(y2) + y1, x2 + x1)) if x2 + x1 else ff(m + 1), None)]
        ej.genericos = [ff(m + 1), ff(m - 1), ff(m * 2)]
        ej.pasos = [{"paso": 1, "operacion": "m = (y₂ − y₁)/(x₂ − x₁)", "resultado": ff(m), "texto": f"m = ({fmt(int(y2))} − ({fmt(y1)})) / ({fmt(x2)} − ({fmt(x1)})) = {fmt(int(y2 - y1))}/{fmt(dx)} = {ff(m)}."}]
    else:
        xv = rng.randint(-4, 6)
        yv = m * xv + n
        ej = Ejercicio(enunciado=f"Si f(x) = {poli({1: m, 0: n})}, ¿cuánto vale f({fmt(xv)})?", respuesta=ff(yv), parametros={"op": "imagen", "m": str(m), "n": str(n), "x": xv})
        ej.distractores = [(ff(m + n * xv), "ordenada_por_pendiente"), (ff(m * xv - n), "signo_mal"), (ff(m * xv), "olvida_termino")]
        ej.genericos = [ff(yv + 1), ff(yv - 1), ff(yv + 2)]
        ej.pasos = [{"paso": 1, "operacion": f"f({fmt(xv)})", "resultado": ff(yv), "texto": f"Sustituyo x por {fmt(xv)}: f({fmt(xv)}) = {ff(m)}·({fmt(xv)}) {'+' if n >= 0 else '−'} {ff(abs(n))} = {ff(yv)}."}]
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    ej.explicacion_adulto = "La pendiente es cuánto sube la y por cada unidad que avanza la x: diferencia de y entre diferencia de x, en ese orden."
    return ej


@generador("derivada")
def gen_derivada(rng, d, tipo="polinomio"):
    co = {rng.randint(3, 5): rng.randint(1, 6), 2: rng.randint(-7, 7) or 3, 1: rng.randint(-9, 9) or 2, 0: rng.randint(-9, 9) or 5}
    der = {e - 1: c * e for e, c in co.items() if e > 0}
    ej = Ejercicio(enunciado=f"Deriva: f(x) = {poli(co)}", respuesta=f"f′(x) = {poli(der)}", parametros={"op": "derivada", "f": co})
    ej.distractores = [(f"f′(x) = {poli({e - 1: c for e, c in co.items() if e > 0})}", "no_baja_exponente"),
                       (f"f′(x) = {poli({e: c * e for e, c in co.items() if e > 0})}", "no_resta_uno"),
                       (f"f′(x) = {poli({**{e - 1: c * e for e, c in co.items() if e > 0}, 0: der.get(0, 0) + co[0]})}", "deriva_constante")]
    ej.genericos = [f"f′(x) = {poli({e - 1: c * e + 1 for e, c in co.items() if e > 0})}"]
    ej.pasos = [{"paso": 1, "operacion": "(xⁿ)′ = n·xⁿ⁻¹", "resultado": poli(der), "texto": f"Derivo término a término: el exponente baja multiplicando y se le resta 1; la constante desaparece. f′(x) = {poli(der)}."}]
    ej.explicacion_nino = ej.pasos[0]["texto"]
    ej.explicacion_adulto = "Regla de la potencia: (xⁿ)′ = n·xⁿ⁻¹. La derivada de una constante es 0."
    return ej


@generador("integral")
def gen_integral(rng, d):
    co = {rng.randint(1, 3): rng.randint(1, 4) * 2, 0: rng.randint(1, 9)}
    e_max = max(co)
    co[e_max] *= (e_max + 1) // math.gcd(co[e_max], e_max + 1) if co[e_max] % (e_max + 1) else 1
    prim = {e + 1: F(c, e + 1) for e, c in co.items()}
    ej = Ejercicio(enunciado=f"Calcula ∫ ({poli(co)}) dx", respuesta=f"{poli(prim)} + C", parametros={"op": "integral", "f": co})
    ej.distractores = [(f"{poli({e + 1: c for e, c in co.items()})} + C", "no_divide"), (f"{poli(prim)}", "olvida_constante"),
                       (f"{poli({e - 1: c * e for e, c in co.items() if e > 0})} + C", "deriva_en_vez")]
    ej.genericos = [f"{poli({e + 1: F(c, e + 2) for e, c in co.items()})} + C"]
    ej.pasos = [{"paso": 1, "operacion": "∫xⁿ dx = xⁿ⁺¹/(n+1)", "resultado": poli(prim), "texto": f"Sumo 1 al exponente y divido por el nuevo exponente, término a término: {poli(prim)} + C."}]
    ej.explicacion_nino = ej.pasos[0]["texto"]
    ej.explicacion_adulto = "Integrar deshace la derivada: se comprueba derivando el resultado. No olvidar la constante C."
    return ej


@generador("estadistica")
def gen_estadistica(rng, d, tipo="media", n=None):
    n = n or rng.randint(5, 9)
    for _ in range(100):
        datos = [rng.randint(1, 10 if d == 1 else 20) for _ in range(n)]
        if tipo == "media" and sum(datos) % n:
            continue
        if tipo == "moda":
            m = rng.choice(datos)
            datos[rng.randrange(n)] = m
            datos[rng.randrange(n)] = m
            from collections import Counter
            c = Counter(datos).most_common()
            if len(c) > 1 and c[0][1] == c[1][1]:
                continue
        break
    lista = ", ".join(str(x) for x in datos)
    s = sorted(datos)
    if tipo == "media":
        r = sum(datos) // n
        ej = Ejercicio(enunciado=f"Calcula la media de: {lista}", respuesta=fmt(r), parametros={"op": "media", "datos": datos})
        ej.distractores = [(fmt(sum(datos)), "media_sin_dividir"), (fmt(s[n // 2]), "mediana_por_media"), (fmt(round(sum(datos) / (n - 1), 1)).replace(".", ","), "divide_mal")]
        ej.pasos = [{"paso": 1, "operacion": f"({' + '.join(map(str, datos))}) : {n}", "resultado": fmt(r), "texto": f"Sumo todos: {sum(datos)}. Divido entre cuántos hay ({n}): {sum(datos)} : {n} = {r}."}]
    elif tipo == "mediana":
        if n % 2 == 0:
            datos.append(rng.randint(1, 10))
            n += 1
            s = sorted(datos)
            lista = ", ".join(str(x) for x in datos)
        r = s[n // 2]
        ej = Ejercicio(enunciado=f"Calcula la mediana de: {lista}", respuesta=fmt(r), parametros={"op": "mediana", "datos": datos})
        ej.distractores = [(fmt(datos[n // 2]), "mediana_sin_ordenar"), (fmt(round(sum(datos) / n)), "media_por_mediana"), (fmt(s[n // 2 + 1]), None)]
        ej.pasos = [{"paso": 1, "operacion": "ordenar", "resultado": ", ".join(map(str, s)), "texto": f"Ordeno los datos: {', '.join(map(str, s))}. La mediana es el del medio: {r}."}]
    elif tipo == "moda":
        from collections import Counter
        r = Counter(datos).most_common(1)[0][0]
        ej = Ejercicio(enunciado=f"¿Cuál es la moda de estos datos? {lista}", respuesta=fmt(r), parametros={"op": "moda", "datos": datos})
        ej.distractores = [(fmt(max(datos)), "moda_por_mayor"), (fmt(Counter(datos).most_common(1)[0][1]), "frecuencia_por_dato"), (fmt(s[n // 2]), "mediana_por_moda")]
        ej.pasos = [{"paso": 1, "operacion": "contar", "resultado": fmt(r), "texto": f"Cuento cuántas veces sale cada dato. El que más se repite es {r} ({Counter(datos)[r]} veces): esa es la moda."}]
    else:  # rango
        r = max(datos) - min(datos)
        ej = Ejercicio(enunciado=f"Calcula el rango (recorrido) de: {lista}", respuesta=fmt(r), parametros={"op": "rango", "datos": datos})
        ej.distractores = [(fmt(datos[-1] - datos[0]) if datos[-1] - datos[0] >= 0 else fmt(max(datos)), "rango_mal"), (fmt(max(datos)), "rango_mal"), (fmt(max(datos) + min(datos)), "suma_en_vez")]
        ej.pasos = [{"paso": 1, "operacion": f"{max(datos)} − {min(datos)}", "resultado": fmt(r), "texto": f"Rango = mayor − menor = {max(datos)} − {min(datos)} = {r}."}]
    ej.genericos = genericos_num(int(ej.respuesta.replace(",", "")) if ej.respuesta.isdigit() else 5, rng)
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    ej.explicacion_adulto = "Media: se reparte a partes iguales. Mediana: el del medio tras ordenar. Moda: el que más se repite."
    return ej


COLORES = ["rojas", "azules", "verdes", "amarillas", "negras", "blancas"]


@generador("probabilidad")
def gen_probabilidad(rng, d, tipo="laplace"):
    if tipo == "cualitativa":
        cols = rng.sample(COLORES, 2)
        a = rng.randint(1, 6)
        caso = rng.choice(["seguro", "posible", "imposible"])
        if caso == "seguro":
            enun, bolsa = f"una bola {cols[0][:-1]}", f"{a} bolas {cols[0]}"
        elif caso == "posible":
            enun, bolsa = f"una bola {cols[0][:-1]}", f"{a} bolas {cols[0]} y {rng.randint(1, 6)} bolas {cols[1]}"
        else:
            enun, bolsa = f"una bola {rng.choice([c for c in COLORES if c not in cols])[:-1]}", f"{a} bolas {cols[0]} y {rng.randint(1, 6)} bolas {cols[1]}"
        ej = Ejercicio(enunciado=f"En una bolsa hay {bolsa}. Si sacas una sin mirar, ¿sacar {enun} es seguro, posible o imposible?", respuesta=caso,
                       parametros={"op": "azar", "caso": caso})
        otros = [c for c in ("seguro", "posible", "imposible") if c != caso]
        ej.distractores = [(otros[0], "confunde_posible_seguro"), (otros[1], "confunde_posible_seguro")]
        ej.genericos = ["no se puede saber"]
        ej.pasos = [{"paso": 1, "operacion": "", "resultado": caso, "texto": {"seguro": "Todas las bolas son de ese color: pase lo que pase, saldrá. Es seguro.",
                                                                                 "posible": "Hay bolas de ese color, pero también de otro: puede salir o no. Es posible.",
                                                                                 "imposible": "No hay ninguna bola de ese color: no puede salir. Es imposible."}[caso]}]
        ej.formato = "opcion_multiple"
    elif tipo == "laplace":
        a, b, c = rng.randint(1, 8), rng.randint(1, 8), rng.randint(0, 6)
        tot = a + b + c
        cols = rng.sample(COLORES, 3)
        bolsa = f"{a} bolas {cols[0]}, {b} {cols[1]}" + (f" y {c} {cols[2]}" if c else "")
        p = F(a, tot)
        ej = Ejercicio(enunciado=f"En una urna hay {bolsa}. ¿Qué probabilidad hay de sacar una bola {cols[0][:-1]}?", respuesta=ff(p), parametros={"op": "laplace", "fav": a, "tot": tot})
        ej.distractores = [(ff(F(a, tot - a)) if tot - a else "1", "favorables_entre_desfavorables"), (f"{a}/{tot}" if ff(p) != f"{a}/{tot}" else ff(F(a, tot + 1)), "no_simplifica"),
                           (ff(F(tot - a, tot)), "complementario")]
        ej.genericos = [ff(F(1, tot)), ff(F(a + 1, tot + 1)), ff(F(1, 3))]
        ej.pasos = [{"paso": 1, "operacion": "favorables / posibles", "resultado": ff(p), "texto": f"Casos favorables: {a}. Casos posibles: {tot}. P = {a}/{tot}" + (f" = {ff(p)}." if ff(p) != f"{a}/{tot}" else ".")}]
    elif tipo == "dados":
        s = rng.randint(3, 11)
        fav = sum(1 for i in range(1, 7) for j in range(1, 7) if i + j == s)
        p = F(fav, 36)
        ej = Ejercicio(enunciado=f"Se lanzan dos dados. ¿Qué probabilidad hay de que la suma sea {s}?", respuesta=ff(p), parametros={"op": "dados", "s": s})
        ej.distractores = [(ff(F(1, 11)), "cuenta_casos_mal"), (ff(F(fav, 12)), "cuenta_casos_mal"), (ff(F(1, 6)) if p != F(1, 6) else ff(F(1, 12)), None)]
        ej.genericos = [ff(F(fav + 1, 36)), ff(F(1, 36))]
        ej.pasos = [{"paso": 1, "operacion": "6 × 6 = 36", "resultado": "36", "texto": f"Hay 6 × 6 = 36 resultados igual de probables. Suman {s}: {fav} de ellos. P = {fav}/36 = {ff(p)}."}]
    else:
        return None
    ej.explicacion_nino = " ".join(p_["texto"] for p_ in ej.pasos)
    ej.explicacion_adulto = "Regla de Laplace: casos favorables entre casos posibles, cuando todos son igual de probables."
    return ej


@generador("combinatoria")
def gen_combinatoria(rng, d, tipo=None):
    n = rng.randint(4, 8)
    k = rng.randint(2, min(4, n - 1))
    tipo = tipo or rng.choice(["variaciones", "permutaciones", "combinaciones"])
    V, P, C = math.perm(n, k), math.factorial(n), math.comb(n, k)
    nom = rng.choice(NOMBRES)
    if tipo == "permutaciones":
        ej = Ejercicio(enunciado=f"¿De cuántas formas distintas se pueden colocar {n} libros diferentes en una estantería?", respuesta=fmt(P), parametros={"op": "perm", "n": n})
        ej.distractores = [(fmt(n * n), "potencia_en_vez"), (fmt(n), "suma_en_vez"), (fmt(math.factorial(n - 1)), "uno_de_menos")]
        ej.pasos = [{"paso": 1, "operacion": f"{n}!", "resultado": fmt(P), "texto": f"Para el primer hueco hay {n} opciones, para el segundo {n - 1}… {n}! = {fmt(P)}."}]
    elif tipo == "variaciones":
        ej = Ejercicio(enunciado=f"En una carrera con {n} corredores, ¿de cuántas formas se pueden repartir el oro, la plata{' y el bronce' if k == 3 else ''}{' y el cuarto puesto' if k == 4 else ''}?".replace("la plata y el cuarto", "la plata, el bronce y el cuarto") if k != 2 else f"En una carrera con {n} corredores, ¿de cuántas formas se pueden repartir el oro y la plata?",
                       respuesta=fmt(V), parametros={"op": "var", "n": n, "k": k})
        ej.distractores = [(fmt(C), "combina_en_vez_de_variar"), (fmt(n ** k), "con_repeticion"), (fmt(n * k), "multiplica_n_k")]
        ej.pasos = [{"paso": 1, "operacion": f"V({n},{k})", "resultado": fmt(V), "texto": f"Importa el orden y no se repite: {' × '.join(str(n - i) for i in range(k))} = {fmt(V)}."}]
    else:
        ej = Ejercicio(enunciado=f"{nom} tiene {n} amigos y puede invitar a {k} al cine. ¿Cuántos grupos distintos puede formar?", respuesta=fmt(C), parametros={"op": "comb", "n": n, "k": k})
        ej.distractores = [(fmt(V), "permuta_en_vez_de_combinar"), (fmt(n * k), "multiplica_n_k"), (fmt(n + k), "suma_en_vez")]
        ej.pasos = [{"paso": 1, "operacion": f"C({n},{k})", "resultado": fmt(C), "texto": f"No importa el orden: C({n},{k}) = {fmt(V)} : {k}! = {fmt(C)}."}]
    ej.genericos = genericos_num(int(ej.respuesta.replace(" ", "")), rng)
    ej.explicacion_nino = ej.pasos[0]["texto"]
    ej.explicacion_adulto = "Dos preguntas deciden la fórmula: ¿importa el orden? ¿se puede repetir?"
    return ej
