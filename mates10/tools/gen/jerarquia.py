"""Jerarquía de operaciones (OPER.JERARQ.*), potencias, raíces y enteros.

Expresión = lista de tokens alternando operando/operador. Operando: int | ("grupo", lista, "()"|"[]") |
("pot", base, exp) | ("raiz", n). Los errores típicos del anexo se implementan como evaluadores
alternativos (claves e01…e05, igual que JERARQ.02.E01…E05):
  e01 izquierda_a_derecha, e02 suma_antes_que_producto, e03 multiplica_antes_de_dividir,
  e04 parentesis_factor_olvidado, e05 distribuye_solo_al_primero, e06 potencia_como_producto
"""
from fractions import Fraction
from .nucleo import Ejercicio, generador, fmt, genericos_num

MUL, DIV, SUM, RES = "×", ":", "+", "−"


def ev_operando(o, modo):
    if isinstance(o, int):
        return Fraction(o)
    if o[0] == "grupo":
        return ev_lista(o[1], modo)
    if o[0] == "pot":
        b = ev_operando(o[1], modo)
        return b * o[2] if modo == "e06" else b ** o[2]
    if o[0] == "raiz":
        v = ev_operando(o[1], modo)
        r = int(round(float(v) ** 0.5))
        if r * r != v:
            raise ValueError("raíz no exacta")
        return Fraction(r)
    raise ValueError(o)


def aplicar(a, op, b):
    if op == SUM:
        return a + b
    if op == RES:
        return a - b
    if op == MUL:
        return a * b
    if b == 0:
        raise ZeroDivisionError
    return a / b


def ev_lista(toks, modo="ok", pasos=None):
    toks = transformar(toks, modo)
    vals = [ev_operando(t, modo) for t in toks[0::2]]
    ops = list(toks[1::2])
    if modo == "e01":
        niveles = [[SUM, RES, MUL, DIV]]
    elif modo == "e02":
        niveles = [[SUM, RES], [MUL, DIV]]
    elif modo == "e03":
        niveles = [[MUL], [DIV], [SUM, RES]]
    else:
        niveles = [[MUL, DIV], [SUM, RES]]
    for nivel in niveles:
        i = 0
        while i < len(ops):
            if ops[i] in nivel:
                r = aplicar(vals[i], ops[i], vals[i + 1])
                if pasos is not None and modo == "ok":
                    pasos.append((vals[i], ops[i], vals[i + 1], r))
                vals[i:i + 2] = [r]
                ops.pop(i)
            else:
                i += 1
    return vals[0]


def transformar(toks, modo):
    if modo not in ("e04", "e05"):
        return toks
    out = list(toks)
    for i in range(0, len(out) - 2, 2):
        if isinstance(out[i], int) and out[i + 1] == MUL and isinstance(out[i + 2], tuple) and out[i + 2][0] == "grupo":
            g = out[i + 2][1]
            if modo == "e04":
                return out[:i] + [out[i + 2]] + out[i + 3:]
            if modo == "e05" and len(g) >= 3 and g[1] in (SUM, RES):
                return out[:i] + [out[i], MUL] + list(g) + out[i + 3:]
    return toks


def texto(toks, signo_mult="×"):
    s = []
    for t in toks:
        if isinstance(t, int):
            s.append(str(t))
        elif isinstance(t, str):
            s.append(signo_mult if t == MUL else t)
        elif t[0] == "grupo":
            a, b = ("(", ")") if t[2] == "()" else ("[", "]")
            s.append(a + texto(t[1], signo_mult) + b)
        elif t[0] == "pot":
            base = texto([t[1]], signo_mult)
            s.append(f"{base}{sup(t[2])}")
        elif t[0] == "raiz":
            s.append(f"√{texto([t[1]], signo_mult)}")
    return " ".join(s).replace("( ", "(").replace(" )", ")").replace("[ ", "[").replace(" ]", "]")


SUP = str.maketrans("0123456789", "⁰¹²³⁴⁵⁶⁷⁸⁹")


def sup(n):
    return str(n).translate(SUP)


def natural_en_todo(toks):
    """Todos los resultados intermedios son naturales (definición de JERARQ.01/02)."""
    try:
        pasos = []
        _chk(toks, pasos)
        return all(r >= 0 and r.denominator == 1 for *_, r in pasos)
    except (ZeroDivisionError, ValueError):
        return False


def _chk(toks, pasos):
    for t in toks[0::2]:
        if isinstance(t, tuple) and t[0] == "grupo":
            _chk(t[1], pasos)
    v = ev_lista(toks, "ok", pasos)
    pasos.append((None, None, None, v))
    return v


def _num(rng, lo, hi):
    return rng.randint(lo, hi)


def plantilla(rng, nivel, d):
    """Devuelve una lista de tokens según el nivel (1: sin paréntesis, 2: con paréntesis y corchetes, 3: con potencias y raíces)."""
    hi = 12 if d == 1 else 20 if d == 2 else 50
    n = lambda: _num(rng, 2, hi)
    if nivel == 1:
        formas = [
            lambda: [n(), SUM, n(), MUL, n()],
            lambda: [n(), RES, n(), MUL, n()],
            lambda: [n() * 3, RES, n(), DIV, 1][:3] + [MUL, n()],
            lambda: [n(), MUL, n(), SUM, n(), MUL, n()],
            lambda: [n() * 4, DIV, 4, SUM, n(), MUL, n(), RES, n()],
            lambda: [n() * 10, DIV, 10, MUL, n()],
        ]
    elif nivel == 2:
        formas = [
            lambda: [n() * 5, RES, n(), MUL, ("grupo", [n(), SUM, n()], "()")],
            lambda: [("grupo", [n(), SUM, n()], "()"), MUL, n()],
            lambda: [n(), MUL, ("grupo", [n() * 2, RES, n()], "()"), SUM, n()],
            lambda: [n(), MUL, ("grupo", [("grupo", [n() * 4, RES, n()], "()"), DIV, n(), SUM, n() * 3, DIV, n()], "[]")],
            lambda: [n() * 3, RES, ("grupo", [n() * 2, RES, n()], "()"), MUL, n()],
            lambda: [("grupo", [n() * 3, RES, n()], "()"), DIV, ("grupo", [n(), RES, n()], "()")],
        ]
    else:
        formas = [
            lambda: [("pot", rng.randint(2, 5), rng.randint(2, 3)), DIV, ("grupo", [("raiz", rng.choice([4, 9, 16, 25, 36, 49])), SUM, n()], "()"), RES, ("raiz", rng.choice([4, 9, 16, 25, 36, 49, 64, 81]))],
            lambda: [n(), SUM, ("pot", rng.randint(2, 4), 2), MUL, n()],
            lambda: [("raiz", rng.choice([16, 25, 36, 49, 64, 81, 100])), MUL, ("grupo", [n(), RES, ("pot", 2, rng.randint(2, 4))], "()")],
            lambda: [("pot", ("grupo", [n(), RES, n()], "()"), 2), SUM, ("raiz", rng.choice([9, 16, 25, 36]))],
        ]
    return rng.choice(formas)()


def pasos_explicacion(toks, signo):
    """Pasos resolviendo de dentro afuera y respetando la jerarquía."""
    pasos = []
    actual = toks

    def reducir_una(ts):
        # 1) el primer grupo o potencia/raíz que contenga solo números: resolver
        for i, t in enumerate(ts):
            if isinstance(t, tuple):
                if t[0] == "grupo":
                    inner = t[1]
                    if all(not isinstance(x, tuple) for x in inner):
                        v = ev_lista(inner)
                        return ts[:i] + [int(v)] + ts[i + 1:], texto([t], signo), v, "Primero lo de dentro del paréntesis"
                    nuevo, op, v, why = reducir_una(inner)
                    return ts[:i] + [("grupo", nuevo, t[2])] + ts[i + 1:], op, v, why
                if t[0] == "pot" and not isinstance(t[1], tuple):
                    v = Fraction(t[1]) ** t[2]
                    return ts[:i] + [int(v)] + ts[i + 1:], texto([t], signo), v, "Las potencias y raíces van antes que multiplicar o dividir"
                if t[0] == "pot":
                    nuevo, op, v, why = reducir_una([t[1]])
                    return ts[:i] + [("pot", nuevo[0], t[2])] + ts[i + 1:], op, v, why
                if t[0] == "raiz":
                    v = ev_operando(t, "ok")
                    return ts[:i] + [int(v)] + ts[i + 1:], texto([t], signo), v, "Las potencias y raíces van antes que multiplicar o dividir"
        # 2) sin grupos: primera × o : de izquierda a derecha; si no, primera + o −
        for nivel, why in (((MUL, DIV), "Multiplicaciones y divisiones antes que sumas y restas, de izquierda a derecha"),
                           ((SUM, RES), "Por último sumas y restas, de izquierda a derecha")):
            for i in range(1, len(ts), 2):
                if ts[i] in nivel:
                    v = aplicar(Fraction(ts[i - 1]), ts[i], Fraction(ts[i + 1]))
                    return ts[:i - 1] + [int(v)] + ts[i + 2:], f"{ts[i - 1]} {signo if ts[i] == MUL else ts[i]} {ts[i + 1]}", v, why
        return None

    while len(actual) > 1 or isinstance(actual[0], tuple):
        r = reducir_una(actual)
        if r is None:
            break
        actual, op, v, why = r
        pasos.append({"paso": len(pasos) + 1, "operacion": op, "resultado": fmt(int(v)),
                      "texto": f"{why}: {op} = {fmt(int(v))}." + (f" Queda {texto(actual, signo)}." if len(actual) > 1 or isinstance(actual[0], tuple) else "")})
    return pasos


@generador("jerarquia")
def gen_jerarquia(rng, d, nivel=1, signo_mult="×"):
    for _ in range(400):
        toks = plantilla(rng, nivel, d)
        if not natural_en_todo(toks):
            continue
        ok = ev_lista(toks)
        if ok.denominator != 1 or ok < 0 or ok > 2000:
            continue
        errs = []
        for k in ("e01", "e02", "e03", "e04", "e05", "e06"):
            try:
                v = ev_lista(toks, k)
                if v != ok and v.denominator == 1 and v >= 0:
                    errs.append((fmt(int(v)), k))
            except (ZeroDivisionError, ValueError):
                pass
        if len({e[0] for e in errs}) >= 1:
            break
    else:
        return None
    expr = texto(toks, signo_mult)
    ej = Ejercicio(enunciado=f"Calcula: {expr}", respuesta=fmt(int(ok)), parametros={"op": "jerarquia", "expresion": expr, "nivel": nivel})
    ej.distractores = errs
    ej.genericos = genericos_num(int(ok), rng)
    ej.pasos = pasos_explicacion(toks, signo_mult)
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos) + f" Resultado: {fmt(int(ok))}."
    ej.explicacion_adulto = ("El orden es: paréntesis (de dentro afuera), potencias y raíces, multiplicaciones y divisiones de izquierda a derecha, "
                             "y al final sumas y restas de izquierda a derecha. Que reescriba la expresión entera después de cada paso, "
                             "sustituyendo lo resuelto: así no se pierde ningún factor.")
    return ej


# ---------------------------------------------------------------- potencias y raíces

@generador("potencia")
def gen_potencia(rng, d, tipo="calcular", base_max=10, exp_max=4, base_negativa=False):
    if tipo == "calcular":
        b = rng.randint(2, base_max if d > 1 else 5)
        e = rng.randint(2, exp_max if d > 1 else 3)
        if b ** e > 100000:
            e = 2
        if base_negativa and rng.random() < 0.6:
            b = -b
        v = b ** e
        ej = Ejercicio(enunciado=f"Calcula: {('(' + fmt(b) + ')') if b < 0 else b}{sup(e)}", respuesta=fmt(v), parametros={"op": "pot", "a": b, "n": e})
        ej.distractores = [(fmt(b * e), "potencia_como_producto"), (fmt(e ** abs(b)) if abs(b) < 8 else fmt(b ** (e + 1)), "base_exponente_cambiados"),
                           (fmt(-v), "signo_mal") if b < 0 else (fmt(b ** (e - 1)), "un_factor_de_menos")]
        ej.genericos = genericos_num(v, rng, entero=v >= 0)
        ej.pasos = [{"paso": 1, "operacion": " × ".join([fmt(b)] * e), "resultado": fmt(v), "texto": f"{b}{sup(e)} es multiplicar el {b} por sí mismo {e} veces: {' × '.join([fmt(b)] * e)} = {fmt(v)}."}]
        ej.explicacion_nino = ej.pasos[0]["texto"]
        ej.explicacion_adulto = "El error típico es multiplicar base por exponente (2³ = 6). El exponente dice cuántas veces se repite la base como factor."
        return ej
    # propiedades: producto/cociente de misma base, potencia de potencia
    b = rng.randint(2, 9)
    m, n = rng.randint(2, 9), rng.randint(2, 9)
    t = rng.choice(["producto", "cociente", "potencia"]) if tipo == "propiedades" else tipo
    if t == "producto":
        enun, r, dist = f"{b}{sup(m)} · {b}{sup(n)}", m + n, [(f"{b}{sup(m * n)}", "multiplica_exponentes"), (f"{b * b}{sup(m + n)}", "multiplica_bases"), (f"{b * b}{sup(m * n)}", "multiplica_todo")]
    elif t == "cociente":
        m, n = max(m, n) + 1, min(m, n)
        enun, r, dist = f"{b}{sup(m)} : {b}{sup(n)}", m - n, [(f"{b}{sup(m // n) if m % n == 0 else sup(m + n)}", "divide_exponentes"), (f"1{sup(m - n)}", "divide_bases"), (f"{b}{sup(m + n)}", "suma_exponentes")]
    else:
        enun, r, dist = f"({b}{sup(m)}){sup(n)}", m * n, [(f"{b}{sup(m + n)}", "suma_exponentes"), (f"{b ** n if b ** n < 1000 else b}{sup(m)}", "eleva_base"), (f"{b}{sup(m ** n) if m ** n < 1000 else sup(m * n + 1)}", "eleva_exponente")]
    resp = f"{b}{sup(r)}"
    ej = Ejercicio(enunciado=f"Escribe como una sola potencia: {enun}", respuesta=resp, parametros={"op": "pot_prop", "tipo": t, "b": b, "m": m, "n": n})
    ej.distractores = dist
    ej.genericos = [f"{b}{sup(r + 1)}", f"{b}{sup(max(r - 1, 2))}", f"{b + 1}{sup(r)}"]
    regla = {"producto": "misma base multiplicando: se suman los exponentes", "cociente": "misma base dividiendo: se restan los exponentes",
             "potencia": "potencia de una potencia: se multiplican los exponentes"}[t]
    ej.pasos = [{"paso": 1, "operacion": enun, "resultado": resp, "texto": f"Con {regla}. Queda {resp}."}]
    ej.explicacion_nino = ej.pasos[0]["texto"]
    ej.explicacion_adulto = "Las tres propiedades se confunden entre sí. Que escriba el desarrollo una vez (2³ · 2² = 2·2·2 · 2·2) para ver por qué se suman."
    return ej


@generador("raiz")
def gen_raiz(rng, d, tipo="exacta", maximo=400):
    if tipo == "exacta":
        r = rng.randint(2, int(maximo ** 0.5) if d > 1 else 10)
        n = r * r
        ej = Ejercicio(enunciado=f"Calcula: √{fmt(n)}", respuesta=fmt(r), parametros={"op": "raiz", "n": n})
        ej.distractores = [(fmt(n // 2), "divide_entre_dos"), (fmt(r + 1), "tabla_vecina"), (fmt(r - 1), "tabla_vecina")]
        ej.pasos = [{"paso": 1, "operacion": f"{r} × {r}", "resultado": str(n), "texto": f"Busco el número que multiplicado por sí mismo da {n}: {r} × {r} = {n}."}]
    else:
        n = rng.randint(10, maximo if d > 1 else 100)
        r = int(n ** 0.5)
        while r * r == n:
            n += 1
            r = int(n ** 0.5)
        res = n - r * r
        resp = f"raíz {r}, resto {res}"
        ej = Ejercicio(enunciado=f"Calcula la raíz cuadrada entera de {fmt(n)} y su resto.", respuesta=resp, parametros={"op": "raiz_entera", "n": n})
        ej.distractores = [(f"raíz {r + 1}, resto {(r + 1) ** 2 - n}", "raiz_por_exceso"), (f"raíz {r}, resto {res + 1}", "resto_mal"), (f"raíz {n // 2}, resto 0", "divide_entre_dos")]
        ej.pasos = [{"paso": 1, "operacion": f"{r}² ≤ {n} < {r + 1}²", "resultado": str(r), "texto": f"{r}² = {r * r} cabe en {n} y {r + 1}² = {(r + 1) ** 2} ya se pasa. La raíz entera es {r}."},
                    {"paso": 2, "operacion": f"{n} − {r * r}", "resultado": str(res), "texto": f"El resto es lo que sobra: {n} − {r * r} = {res}."}]
    ej.genericos = [fmt(r + 2), fmt(r * 2), fmt(max(r - 2, 1))] if tipo == "exacta" else [f"raíz {r - 1}, resto {n - (r - 1) ** 2}", f"raíz {r}, resto 0"]
    ej.explicacion_nino = " ".join(p["texto"] for p in ej.pasos)
    ej.explicacion_adulto = "La raíz cuadrada deshace el cuadrado. El error típico es dividir entre 2. Conocer los cuadrados hasta 20² ayuda mucho."
    return ej


# ---------------------------------------------------------------- enteros

@generador("enteros")
def gen_enteros(rng, d, op="suma", maximo=20):
    a = rng.randint(-maximo, maximo)
    b = rng.randint(-maximo, maximo)
    while a == 0 or b == 0 or (a > 0 and b > 0):
        a = rng.randint(-maximo, maximo)
        b = rng.randint(-maximo, maximo)
    p = lambda x: f"({fmt(x)})" if x < 0 else fmt(x)
    if op == "suma":
        r, enun = a + b, f"{fmt(a)} + {p(b)}"
        dist = [(-(a + b), "signo_mal"), (abs(a) + abs(b), "suma_valores_absolutos"), (-(abs(a) + abs(b)), "suma_valores_absolutos"), (a - b, "resta_en_vez")]
        txt = "Si tienen el mismo signo, sumo y dejo el signo. Si tienen distinto signo, resto el pequeño del grande y pongo el signo del que tiene más valor absoluto."
    elif op == "resta":
        r, enun = a - b, f"{fmt(a)} − {p(b)}"
        dist = [(a + b, "no_cambia_signo"), (-(a - b), "signo_mal"), (abs(a) - abs(b), "ignora_signos")]
        txt = f"Restar es sumar el opuesto: {fmt(a)} − {p(b)} = {fmt(a)} + {p(-b)}."
    elif op == "mult":
        a, b = rng.randint(-12, 12) or 3, rng.randint(-12, 12) or -4
        r, enun = a * b, f"{p(a)} · {p(b)}"
        dist = [(-(a * b), "regla_signos"), (a + b, "suma_en_vez"), (abs(a * b) if a * b < 0 else -abs(a * b), "regla_signos")]
        txt = "Multiplico los números y aplico la regla de los signos: signos iguales dan +, distintos dan −."
    else:
        q = rng.randint(-12, 12) or 5
        b = rng.randint(2, 9) * rng.choice([-1, 1])
        a = q * b
        r, enun = q, f"{p(a)} : {p(b)}"
        dist = [(-q, "regla_signos"), (a * b if abs(a * b) < 1000 else q + 1, "multiplica"), (abs(q) if q < 0 else q + 1, "regla_signos")]
        txt = "Divido los números y aplico la regla de los signos: signos iguales dan +, distintos dan −."
    ej = Ejercicio(enunciado=f"Calcula: {enun}", respuesta=fmt(r), parametros={"op": f"ent_{op}", "a": a, "b": b})
    ej.distractores = dist
    ej.genericos = [fmt(r + 1), fmt(r - 1), fmt(r + 2), fmt(r - 2)]
    ej.pasos = [{"paso": 1, "operacion": enun, "resultado": fmt(r), "texto": txt + f" Resultado: {fmt(r)}."}]
    ej.explicacion_nino = ej.pasos[0]["texto"]
    ej.explicacion_adulto = "Con enteros ayuda pensar en la recta numérica o en deber/tener dinero. Los signos son la fuente de casi todos los errores."
    return ej
