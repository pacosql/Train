"""Generadores del grupo T4 (medida y geometría) para las habilidades calculables.

Todos se registran como "t4_<nombre>". Cada uno devuelve un Ejercicio con parametros["op"] propio (t4_…), distractores
ligados a claves de error descriptivas (se enlazan con E01… en specs/T4.json) y explicación por pasos.

Claves de error más usadas:
  conversión: sentido_contrario, pasos_menos, pasos_mas, mismo_numero, factor_10, factor_100, factor_otra_pareja,
              dam_dm, anade_ceros, sin_ceros
  forma compleja: yuxtapone, suma_como_iguales, separa_mal, factor_100
  sexagesimal: factor_100, divide_una_vez, h_60s, presta_100, no_reagrupa, pierde_resto, decimales_como_min, min_entre_100
  comparar/operar medidas: compara_numeros, orden_invertido, sin_igualar, otra_unidad, compleja_una_cifra
  geometría: ver cada generador.
"""
import math
from decimal import Decimal, ROUND_HALF_UP
from fractions import Fraction

from .nucleo import Ejercicio, generador, fmt, NOMBRES


# ---------------------------------------------------------------- utilidades

def D(x):
    return x if isinstance(x, Decimal) else Decimal(str(x))


def fx(x, nd=None):
    """Número con convención española (coma decimal, espacio de miles con 5+ cifras), sin ceros sobrantes."""
    if isinstance(x, Fraction):
        x = Decimal(x.numerator) / Decimal(x.denominator)
    x = D(x)
    if nd is not None:
        x = x.quantize(Decimal(1).scaleb(-nd), rounding=ROUND_HALF_UP)
    neg = x < 0
    x = abs(x)
    s = format(x.normalize(), "f")
    if "." in s:
        ent, dec = s.split(".")
        dec = dec.rstrip("0")
    else:
        ent, dec = s, ""
    ent_s = fmt(int(ent))
    out = ent_s + ("," + dec if dec else "")
    return ("−" if neg else "") + out


def r2(x, nd=2):
    return D(x).quantize(Decimal(1).scaleb(-nd), rounding=ROUND_HALF_UP)


def u(x, unidad, nd=None):
    return f"{fx(x, nd)} {unidad}".strip()


def ndec(x):
    s = format(D(x).normalize(), "f")
    return len(s.split(".")[1].rstrip("0")) if "." in s else 0


def mk(enunciado, respuesta, op, par, dist, pasos, adulto, genericos=None):
    """dist: [(valor, clave)], pasos: [(operacion, resultado, texto)]."""
    p = dict(par)
    p["op"] = op
    ej = Ejercicio(enunciado=enunciado, respuesta=respuesta, parametros=p)
    ej.distractores = [(v, k) for v, k in dist if v is not None]
    ej.pasos = [{"paso": i + 1, "operacion": o, "resultado": r, "texto": t} for i, (o, r, t) in enumerate(pasos)]
    ej.explicacion_nino = " ".join(t for _, _, t in pasos)
    ej.explicacion_adulto = adulto
    ej.genericos = list(genericos or [])
    return ej


def var_num(x, unidad="", pasos=(1, -1, 2, 10, -2, 5), nd=None, pos=True):
    out = []
    for k in pasos:
        y = D(x) + D(k)
        if pos and y <= 0:
            continue
        out.append(u(y, unidad, nd) if unidad else fx(y, nd))
    return out


def var_rel(x, unidad="", nd=2):
    """Variantes relativas (±10 %, ×2, :2) para resultados decimales."""
    x = D(x)
    out = []
    for f in (Decimal("1.1"), Decimal("0.9"), Decimal(2), Decimal("0.5"), Decimal("1.25")):
        y = r2(x * f, nd)
        if y > 0:
            out.append(u(y, unidad) if unidad else fx(y))
    return out


def plural(n, s, p):
    return s if n == 1 else p


# ---------------------------------------------------------------- conversiones del sistema métrico

POS = {
    "longitud": {"km": 0, "hm": 1, "dam": 2, "m": 3, "dm": 4, "cm": 5, "mm": 6},
    "masa": {"t": 0, "kg": 3, "hg": 4, "dag": 5, "g": 6, "dg": 7, "cg": 8, "mg": 9},
    "capacidad": {"kl": 0, "hl": 1, "dal": 2, "l": 3, "dl": 4, "cl": 5, "ml": 6},
    "superficie": {"km²": 0, "hm²": 1, "dam²": 2, "m²": 3, "dm²": 4, "cm²": 5, "mm²": 6, "ha": 1, "a": 2, "ca": 3},
    "volumen": {"km³": 0, "hm³": 1, "dam³": 2, "m³": 3, "dm³": 4, "cm³": 5, "mm³": 6},
}
BASE = {"longitud": 10, "masa": 10, "capacidad": 10, "superficie": 100, "volumen": 1000}
GEMELAS = {"dam": "dm", "dm": "dam", "dal": "dl", "dl": "dal", "dam²": "dm²", "dm²": "dam²", "dam³": "dm³", "dm³": "dam³", "dag": "dg", "dg": "dag"}


def _valor(rng, decimales, vmax):
    if not decimales:
        return D(rng.randint(2, vmax))
    nd = rng.choice([1, 1, 2, 2, 3]) if decimales is True else rng.randint(1, decimales)
    return D(rng.randint(1, vmax * 10 ** nd)) / D(10 ** nd)


@generador("t4_conv")
def gen_conv(rng, d, magnitud="longitud", unidades=None, pares=None, pasos_min=1, pasos_max=3, sentido=None,
             decimales=False, dec_max=3, vmax=99, resultado_natural=True, pregunta="cuantos"):
    """Conversión entre dos unidades de la misma magnitud. sentido: 'bajar' (a unidad menor), 'subir' o None.
    decimales: el dato o el resultado es decimal (se exige que alguno lo sea)."""
    pos = POS[magnitud]
    B = BASE[magnitud]
    uds = unidades or [k for k in pos if k not in ("ha", "a", "ca")]
    for _ in range(200):
        if pares:
            u1, u2 = rng.choice(pares)
        else:
            u1, u2 = rng.sample(uds, 2)
        k = pos[u2] - pos[u1]  # >0: a unidad menor
        if not (pasos_min <= abs(k) <= pasos_max):
            continue
        if sentido == "bajar" and k < 0 or sentido == "subir" and k > 0:
            continue
        f = D(B) ** k  # multiplicar v por f
        if decimales:
            v = _valor(rng, decimales, vmax)
            r = v * f
            if ndec(r) > dec_max or ndec(v) > dec_max or (ndec(v) == 0 and ndec(r) == 0) or r >= 10 ** 7 or v >= 10 ** 7:
                continue
        else:
            if k > 0:
                v = D(rng.randint(2, vmax))
                r = v * f
            else:
                r = D(rng.randint(2, vmax))
                v = r / f
        if r > 10 ** 9:
            continue
        break
    else:
        return None
    resp = u(r, u2)
    if pregunta == "expresa":
        enun = f"Expresa {u(v, u1)} en {u2}."
    else:
        enun = f"¿Cuántos {u2} son {u(v, u1)}?"
    sk = 1 if k > 0 else -1
    dist = [
        (u(v / f if k > 0 else v * (D(1) / f), u2), "sentido_contrario"),
        (u(v * D(B) ** (k - sk), u2) if abs(k) >= 2 else None, "pasos_menos"),
        (u(v * D(B) ** (k + sk), u2), "pasos_mas"),
        (u(v, u2), "mismo_numero"),
    ]
    if B > 10:
        dist.append((u(v * D(10) ** k, u2), "factor_10"))
    if B == 1000:
        dist.append((u(v * D(100) ** k, u2), "factor_100"))
    if pares:
        real = D(B) ** abs(k)
        otras = [D(x) for x in (10, 100, 1000) if D(x) != real]
        alt = rng.choice(otras)
        dist.append((u(v * alt if k > 0 else v / alt, u2), "factor_otra_pareja"))
    if u1 in GEMELAS or u2 in GEMELAS:
        a1, a2 = GEMELAS.get(u1, u1), GEMELAS.get(u2, u2)
        if a1 != a2 and a1 in pos and a2 in pos:
            kk = pos[a2] - pos[a1]
            dist.append((u(v * D(B) ** kk, u2), "dam_dm"))
    if ndec(v) > 0 and k > 0:
        s = fx(v) + "0" * (abs(k) * len(str(B)) - abs(k))
        dist.append((f"{s} {u2}", "anade_ceros"))
    if k < 0 and r < 1:
        digs = str(int(v * 10 ** ndec(v)))
        cand = "0," + digs
        dist.append((f"{cand} {u2}", "sin_ceros"))
    orden = {"sentido_contrario": 0}
    rng.shuffle(dist)
    dist.sort(key=lambda t: orden.get(t[1], 1))
    fl = B ** abs(k)
    nombre_b = {10: "10", 100: "100", 1000: "1000"}[B]
    pasos = [(f"{u1} → {u2}", f"{abs(k)} escalones",
              f"De {u1} a {u2} hay {abs(k)} {plural(abs(k), 'escalón', 'escalones')} hacia {'abajo' if k > 0 else 'arriba'} y cada escalón vale {nombre_b}."),
             (f"{fx(v)} {'×' if k > 0 else ':'} {fmt(fl)}", fx(r),
              f"Como paso a una unidad {'más pequeña' if k > 0 else 'más grande'}, {'multiplico' if k > 0 else 'divido'} por {fmt(fl)}"
              + (f" (muevo la coma {abs(k) * len(nombre_b[1:])} {plural(abs(k) * len(nombre_b[1:]), 'lugar', 'lugares')} a la {'derecha' if k > 0 else 'izquierda'})" if decimales else "")
              + f": {resp}.")]
    adulto = ("A una unidad menor salen más (se multiplica); a una mayor, menos (se divide). "
              + {10: "Cada escalón de la escalera de unidades vale 10.", 100: "En superficie cada escalón vale 100 (dos cifras), no 10.",
                 1000: "En volumen cada escalón vale 1000 (tres cifras), no 10 ni 100."}[B])
    return mk(enun, resp, "t4_conv", {"v": str(v), "de": u1, "a": u2, "mag": magnitud, "r": str(r)}, dist, pasos, adulto,
              genericos=[u(r * 2, u2), u(r + 1, u2), u(r * 10 if r * 10 != v else r * 3, u2)])


# ---------------------------------------------------------------- forma compleja ↔ incompleja (dos unidades)

@generador("t4_compleja")
def gen_compleja(rng, d, grande="m", peque="cm", factor=100, max_grande=9, modos=("a_peque", "a_compleja"),
                 simple=False, nombre_grande=None, nombre_peque=None):
    """Pasa «a grande b peque» a peque y al revés. simple=True añade el modo «a grande → peque» (enteros)."""
    modo = rng.choice(list(modos))
    a = rng.randint(1 if modo != "simple" else 2, max_grande)
    cif = len(str(factor)) - 1
    if d == 1:
        b = rng.choice([x for x in range(10 ** (cif - 1), factor) if x % (10 ** (cif - 1)) == 0])
    elif d == 2:
        b = rng.randint(10 ** (cif - 1), factor - 1)
    else:
        b = rng.randint(1, 10 ** (cif - 1) - 1) if cif > 1 else rng.randint(1, 9)
    total = a * factor + b
    if modo == "simple":
        total = a * factor
        enun = f"¿Cuántos {peque} son {a} {grande}?"
        resp = f"{fmt(total)} {peque}"
        dist = [(f"{fmt(a * factor // 10)} {peque}", "factor_100"), (f"{a} {peque}", "mismo_numero"),
                (f"{fmt(a * factor * 10)} {peque}", "factor_mas"), (f"{fx(D(a) / factor)} {peque}", "sentido_contrario")]
        pasos = [(f"{a} × {fmt(factor)}", fmt(total), f"1 {grande} = {fmt(factor)} {peque}, así que {a} {grande} = {a} × {fmt(factor)} = {fmt(total)} {peque}.")]
    elif modo == "a_peque":
        enun = f"¿Cuántos {peque} son {a} {grande} y {b} {peque}?"
        resp = f"{fmt(total)} {peque}"
        yux = int(f"{a}{b}")
        dist = [(f"{fmt(yux)} {peque}" if yux != total else None, "yuxtapone"), (f"{a + b} {peque}", "suma_como_iguales"),
                (f"{fmt(a * factor // 10 + b)} {peque}", "factor_100"), (f"{fmt(a * factor * 10 + b)} {peque}", "factor_mas")]
        pasos = [(f"{a} × {fmt(factor)}", fmt(a * factor), f"Paso los {grande} a {peque}: {a} × {fmt(factor)} = {fmt(a * factor)} {peque}."),
                 (f"{fmt(a * factor)} + {b}", fmt(total), f"Sumo los {b} {peque}: {fmt(a * factor)} + {b} = {fmt(total)} {peque}.")]
    else:
        enun = f"Expresa {fmt(total)} {peque} en {grande} y {peque}."
        resp = f"{a} {grande} y {b} {peque}"
        s = str(total)
        cortes = []
        for c in (cif - 1, cif + 1):
            if 0 < c < len(s):
                x, y = int(s[:-c]), int(s[-c:])
                if (x, y) != (a, b):
                    cortes.append(f"{fmt(x)} {grande} y {y} {peque}")
        dist = [(cortes[0] if cortes else None, "separa_mal"), (cortes[1] if len(cortes) > 1 else None, "separa_mal"),
                (f"{fmt(total // (factor // 10))} {grande} y {total % (factor // 10)} {peque}" if factor >= 100 else None, "factor_100"),
                (f"{a} {grande} y {b * 10 if b * 10 < factor else b + 1} {peque}", None), (f"{a + 1} {grande} y {b} {peque}", None)]
        pasos = [(f"{fmt(total)} : {fmt(factor)}", f"{a} y resto {b}", f"Cada {fmt(factor)} {peque} forman 1 {grande}: {fmt(total)} : {fmt(factor)} = {a} y sobran {b}."),
                 ("", resp, f"Por tanto, {fmt(total)} {peque} = {resp}.")]
    adulto = (f"1 {grande} = {fmt(factor)} {peque}. En la forma compleja la parte en {peque} ocupa {cif} cifras: "
              f"{a} {grande} y {b} {peque} = {fmt(a * factor)} + {b}. Juntar los números sin más (yuxtaponer) es el error típico.")
    return mk(enun, resp, "t4_compleja", {"a": a, "b": b, "factor": factor, "grande": grande, "peque": peque, "modo": modo}, dist, pasos, adulto,
              genericos=[f"{fmt(total + factor)} {peque}", f"{fmt(total + 10)} {peque}", f"{fmt(max(total - 10, 1))} {peque}"]
              if modo != "a_compleja" else [f"{a} {grande} y {b + 1} {peque}", f"{a - 1 if a > 1 else a + 2} {grande} y {b} {peque}"])


# ---------------------------------------------------------------- kilo/litro: medios y cuartos

@generador("t4_medios_cuartos")
def gen_medios_cuartos(rng, d, unidad="kilo", max_u=5):
    und = {"kilo": ("kilo", "kilos", "paquete", "paquetes", "¿Cuántos"), "litro": ("litro", "litros", "botella", "botellas", "¿Cuántas")}[unidad]
    tipo = rng.choice(["cuantos_cuartos", "cuantos_medios"] if d == 1 else ["cuantos_cuartos", "cuantos_medios", "de_piezas"] if d == 2
                      else ["de_piezas", "mezcla", "cuantos_cuartos"])
    n = rng.randint(1, max_u if d > 1 else 3)
    if tipo == "cuantos_cuartos":
        r = 4 * n
        enun = f"{und[4]} {und[3]} de un cuarto de {und[0]} hacen falta para tener {n} {plural(n, und[0], und[1])}?"
        resp = str(r)
        dist = [(str(2 * n), "cuartos_2"), (str(n), "cuenta_como_enteros"), (str(n + 4), None), (str(8 * n), None)]
        pasos = [("1 = 4 cuartos", str(r), f"En 1 {und[0]} caben 4 cuartos. En {n} {plural(n, und[0], und[1])}: {n} × 4 = {r}.")]
    elif tipo == "cuantos_medios":
        r = 2 * n
        enun = f"{und[4]} {und[3]} de medio {und[0]} hacen falta para tener {n} {plural(n, und[0], und[1])}?"
        resp = str(r)
        dist = [(str(n), "cuenta_como_enteros"), (str(4 * n), "cuartos_2"), (str(n + 2), None), (str(r + 1), None)]
        pasos = [("1 = 2 medios", str(r), f"En 1 {und[0]} caben 2 medios. En {n} {plural(n, und[0], und[1])}: {n} × 2 = {r}.")]
    elif tipo == "de_piezas":
        q = rng.choice([2, 4])
        m = rng.choice([x for x in range(q, max_u * q + 1, q)])
        r = m // q
        nom = "medio" if q == 2 else "un cuarto de"
        enun = f"Tengo {m} {und[3]} de {nom} {und[0]}. ¿Cuántos {und[1]} tengo en total?"
        resp = f"{r} {plural(r, und[0], und[1])}"
        dist = [(f"{m} {und[1]}", "cuenta_como_enteros"), (f"{m // 2} {plural(m // 2, und[0], und[1])}" if q == 4 else f"{m // 4 if m % 4 == 0 else m + 1} {und[1]}", "cuartos_2"),
                (f"{r + 1} {und[1]}", None), (f"{m * q} {und[1]}", None)]
        pasos = [(f"{m} : {q}", str(r), f"Con {q} {und[3]} de {nom} {und[0]} se completa 1 {und[0]}. {m} : {q} = {r}.")]
    else:
        a, b = rng.randint(1, 3), rng.randint(1, 3)
        cuartos = 2 * a + b
        enun = f"Junto {a} {plural(a, und[2], und[3])} de medio {und[0]} y {b} {plural(b, und[2], und[3])} de un cuarto de {und[0]}. ¿Cuántos cuartos de {und[0]} tengo?"
        resp = f"{cuartos} cuartos"
        dist = [(f"{a + b} cuartos", "cuenta_como_enteros"), (f"{a + b + a} cuartos" if a + b + a != cuartos else f"{4 * a + b} cuartos", None),
                (f"{4 * a + b} cuartos", None), (f"{cuartos + 2} cuartos", None)]
        pasos = [(f"{a} × 2 + {b}", str(cuartos), f"Cada medio {und[0]} son 2 cuartos: {a} × 2 = {2 * a} cuartos, más {b}: {cuartos} cuartos.")]
    adulto = f"1 {und[0]} = 2 medios = 4 cuartos; medio = 2 cuartos. Contar las piezas como si cada una fuera un {und[0]} entero es el error típico."
    return mk(enun, resp, "t4_medios_cuartos", {"tipo": tipo, "n": n}, dist, pasos, adulto, genericos=var_num(resp.split()[0]) if resp.isdigit() else [])


# ---------------------------------------------------------------- kilo/litro con fracción → gramos/ml

@generador("t4_mil_fraccion")
def gen_mil_fraccion(rng, d, grande="kg", peque="g", nombre="kilo"):
    fr = {1: [None, "medio"], 2: ["medio", "cuarto", None], 3: ["cuarto", "tres cuartos", "medio"]}[d]
    q = rng.choice(fr)
    a = rng.randint(0 if q else 1, 9) if d > 1 else rng.randint(0 if q else 1, 5)
    extra = {None: 0, "medio": 500, "cuarto": 250, "tres cuartos": 750}[q]
    total = a * 1000 + extra
    if a == 0:
        txt = {"medio": f"medio {nombre}", "cuarto": f"un cuarto de {nombre}", "tres cuartos": f"tres cuartos de {nombre}"}[q]
    else:
        txt = f"{a} {grande}" + ({None: "", "medio": " y medio", "cuarto": " y cuarto", "tres cuartos": " y tres cuartos"}[q])
    enun = f"¿Cuántos {peque} son {txt}?"
    resp = f"{fmt(total)} {peque}"
    dist = [(f"{fmt(a * 100 + extra // 10)} {peque}", "factor_100"), (f"{fmt(a * 1000 + extra // 10)} {peque}", "medio_50") if q else (f"{a * 10} {peque}", None),
            (f"{fmt(a * 1000 + (500 if q == 'cuarto' else 250 if q == 'medio' else 0))} {peque}" if q else None, None),
            (f"{fmt(a * 10000 + extra)} {peque}", None)]
    pasos = [(f"{a} × 1000" if a else "", fmt(a * 1000), f"1 {grande} = 1000 {peque}" + (f", así que {a} {grande} = {fmt(a * 1000)} {peque}." if a else ".")),
             (f"+ {extra}", fmt(total), ({None: "", "medio": "Medio", "cuarto": "Un cuarto", "tres cuartos": "Tres cuartos"}[q] + f" de {nombre} = {extra} {peque}. Total: {fmt(total)} {peque}.") if q else f"Total: {fmt(total)} {peque}.")]
    adulto = f"1 {grande} = 1000 {peque}; medio = 500, cuarto = 250, tres cuartos = 750. Confundirlo con 100 (como el metro y el centímetro) es el error típico."
    return mk(enun, resp, "t4_mil_fraccion", {"a": a, "fraccion": q}, dist, pasos, adulto, genericos=[f"{fmt(total + 1000)} {peque}", f"{fmt(total + 100)} {peque}"])
