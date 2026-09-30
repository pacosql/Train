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
NOMBRE_UD = {"ha": "hectáreas", "a": "áreas", "ca": "centiáreas"}
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
    if u2 in NOMBRE_UD:
        enun = f"¿Cuántas {NOMBRE_UD[u2]} son {u(v, u1)}?"
    elif pregunta == "expresa":
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


# ---------------------------------------------------------------- comparar y operar medidas en unidades distintas

ESCALA = {
    "longitud": {"km": 10 ** 6, "hm": 10 ** 5, "dam": 10 ** 4, "m": 1000, "dm": 100, "cm": 10, "mm": 1},
    "masa": {"t": 10 ** 9, "kg": 10 ** 6, "hg": 10 ** 5, "dag": 10 ** 4, "g": 1000, "dg": 100, "cg": 10, "mg": 1},
    "capacidad": {"kl": 10 ** 6, "hl": 10 ** 5, "dal": 10 ** 4, "l": 1000, "dl": 100, "cl": 10, "ml": 1},
    "superficie": {"km²": 10 ** 12, "hm²": 10 ** 10, "dam²": 10 ** 8, "m²": 10 ** 6, "dm²": 10 ** 4, "cm²": 100, "mm²": 1,
                   "ha": 10 ** 10, "a": 10 ** 8, "ca": 10 ** 6},
    "volumen": {"m³": 10 ** 6, "dm³": 1000, "cm³": 1, "kl": 10 ** 6, "hl": 10 ** 5, "dal": 10 ** 4, "l": 1000, "dl": 100, "cl": 10, "ml": 1},
}
NOM_MAG = {"longitud": ("longitud", "longitudes", "más larga", "más corta"), "masa": ("masa", "masas", "más pesada", "más ligera"),
           "capacidad": ("capacidad", "capacidades", "mayor", "menor"), "superficie": ("superficie", "superficies", "mayor", "menor"),
           "volumen": ("cantidad", "cantidades", "mayor", "menor")}


RANGO = {"longitud": (1000, 5 * 10 ** 6), "masa": (10 ** 5, 5 * 10 ** 7), "capacidad": (100, 5 * 10 ** 4),
         "superficie": (10 ** 6, 10 ** 11), "volumen": (10 ** 3, 10 ** 7)}


def _objetivo(rng, magnitud):
    lo, hi = RANGO[magnitud]
    return _sig(D(10 ** rng.uniform(math.log10(lo), math.log10(hi))), 2)


def _sig(x, cifras):
    x = D(x)
    if x == 0:
        return x
    e = x.adjusted()
    return x.quantize(Decimal(1).scaleb(e - cifras + 1), rounding=ROUND_HALF_UP).normalize()


def _termino(rng, esc, unidades, objetivo, cifras, dec_max):
    for _ in range(50):
        un = rng.choice(unidades)
        v = _sig(D(objetivo) / D(esc[un]), cifras)
        if v < D("0.1") or ndec(v) > dec_max or v >= 10 ** 5:
            continue
        return un, v
    return None


@generador("t4_comparar_uds")
def gen_comparar_uds(rng, d, magnitud="longitud", unidades=None, ref="m", n=3, tipo="mayor", cifras=2, dec_max=3):
    """tipo: mayor | menor | ordenar (de menor a mayor)."""
    esc = ESCALA[magnitud]
    uds = unidades or list(esc)
    tipo = rng.choice(tipo) if isinstance(tipo, list) else tipo
    if tipo == "ordenar":
        n = 3
    for _ in range(200):
        base = _objetivo(rng, magnitud)
        items, vistos = [], set()
        for i in range(n):
            t = _termino(rng, esc, uds, base * D(rng.randint(60, 140)) / 100, cifras, dec_max)
            if not t:
                break
            un, v = t
            val = v * esc[un]
            if val in vistos or un in [x[0] for x in items] and len(uds) >= n:
                break
            vistos.add(val)
            items.append((un, v, val))
        if len(items) < n:
            continue
        crudo = sorted(items, key=lambda x: x[1])
        real = sorted(items, key=lambda x: x[2])
        if [x[1] for x in crudo] == [x[1] for x in real] or len({x[1] for x in items}) < n:
            continue  # el orden por los números sueltos debe engañar
        break
    else:
        return None
    txt = lambda it: u(it[1], it[0])
    nm = NOM_MAG[magnitud]
    lista = ", ".join(txt(x) for x in items)
    if tipo in ("mayor", "menor"):
        ok = real[-1] if tipo == "mayor" else real[0]
        enun = f"¿Cuál es la {nm[2] if tipo == 'mayor' else nm[3]} de estas {nm[1]}: {lista}?"
        resp = txt(ok)
        num_ok = crudo[-1] if tipo == "mayor" else crudo[0]
        inv = real[0] if tipo == "mayor" else real[-1]
        dist = [(txt(num_ok), "compara_numeros"), (txt(inv), "orden_invertido")] + [(txt(x), None) for x in items]
        gen = []
    else:
        enun = f"Ordena de menor a mayor: {lista}."
        resp = " < ".join(txt(x) for x in real)
        dist = [(" < ".join(txt(x) for x in reversed(real)), "orden_invertido"), (" < ".join(txt(x) for x in crudo), "compara_numeros")]
        perms = [[real[1], real[0], real[2]], [real[0], real[2], real[1]], [real[2], real[0], real[1]]]
        gen = [" < ".join(txt(x) for x in p) for p in perms]
    comun = min((x[0] for x in items), key=lambda k: esc[k])
    conv = ", ".join(f"{txt(x)} = {u(x[2] / esc[comun], comun)}" for x in items)
    pasos = [("misma unidad", conv, f"Paso todas a la misma unidad ({comun}): {conv}."),
             ("comparar", resp, f"Ahora ya puedo comparar los números: {resp}.")]
    adulto = "Antes de comparar medidas hay que expresarlas en la misma unidad; comparar solo los números (980 m > 1,2 km porque 980 > 1,2) es el error típico."
    return mk(enun, resp, "t4_comparar_uds", {"items": [[x[0], str(x[1])] for x in items], "tipo": tipo}, dist, pasos, adulto, genericos=gen)


@generador("t4_operar_uds")
def gen_operar_uds(rng, d, magnitud="longitud", unidades=None, resultado=None, terminos=2, ops=("+", "-"), cifras=2, dec_max=3,
                   dec_res=3, compleja=None, p_comparar=0, p_compleja_dec=0, pares_compleja=None):
    """Suma/resta de 2–3 medidas en unidades distintas; resultado en la unidad pedida.
    compleja: [grande, peque] para que el primer término vaya en forma compleja (2 m³ 350 dm³)."""
    x = rng.random()
    if x < p_comparar:
        return gen_comparar_uds(rng, d, magnitud=magnitud, unidades=unidades, ref=(resultado or unidades)[0], n=4,
                                tipo=["mayor", "menor"] if d < 3 else ["ordenar", "mayor"], cifras=2 if d < 3 else 3)
    if x < p_comparar + p_compleja_dec:
        return gen_compleja_dec(rng, d, magnitud=magnitud, pares=pares_compleja)
    esc = ESCALA[magnitud]
    uds = unidades or list(esc)
    res_opts = resultado or uds
    nt = rng.choice(terminos) if isinstance(terminos, list) else terminos
    for _ in range(300):
        R = rng.choice(res_opts)
        objetivo = _objetivo(rng, magnitud)
        ts = []
        for i in range(nt):
            t = _termino(rng, esc, uds, objetivo * D(rng.randint(15, 100)) / 100, cifras, dec_max)
            if not t:
                break
            ts.append(t)
        if len(ts) < nt or len({t[0] for t in ts}) < 2:
            continue
        signos = ["+"] + [rng.choice(ops) for _ in range(nt - 1)]
        comp = None
        if compleja:
            g, p = compleja
            a = rng.randint(1, 9)
            ratio = esc[g] // esc[p]
            b = rng.randint(1, ratio - 1) if d > 1 else rng.choice([x for x in range(1, ratio) if x % max(1, ratio // 10) == 0])
            comp = (g, p, a, b)
            ts[0] = (g, D(a) + D(b) * esc[p] / D(esc[g]))
        vals = [t[1] * esc[t[0]] for t in ts]
        if "-" in signos:
            orden = sorted(range(nt), key=lambda i: -vals[i])
            if comp and orden[0] != 0:
                continue
            ts = [ts[i] for i in orden]
            vals = [vals[i] for i in orden]
        tot = sum(v if s == "+" else -v for v, s in zip(vals, signos))
        if tot <= 0:
            continue
        r = tot / D(esc[R])
        if ndec(r) > dec_res or r >= 10 ** 7 or r < D("0.1"):
            continue
        break
    else:
        return None

    def txt(i):
        if comp and i == 0:
            return f"{comp[2]} {comp[0]} {comp[3]} {comp[1]}"
        return u(ts[i][1], ts[i][0])
    expr = txt(0) + "".join(f" {'+' if s == '+' else '−'} {txt(i + 1)}" for i, s in enumerate(signos[1:]))
    enun = f"Calcula y da el resultado en {R}: {expr}"
    resp = u(r, R)
    crudo = sum((D(comp[2] + comp[3]) if (comp and i == 0) else ts[i][1]) * (1 if s == "+" else -1) for i, s in enumerate(signos))
    dist = [(u(crudo, R) if crudo > 0 else None, "sin_igualar")]
    otras = [t[0] for t in ts if t[0] != R and esc[t[0]] != esc[R]]
    if otras:
        U = rng.choice(otras)
        dist.append((u(tot / D(esc[U]), R), "otra_unidad"))
    if comp:
        g, p, a, b = comp
        mal = (D(a) + D(b) / D(10 ** len(str(b)))) * esc[g]
        tot2 = tot - vals[0] + mal
        if tot2 > 0 and ndec(tot2 / D(esc[R])) <= 6:
            dist.append((u(tot2 / D(esc[R]), R), "compleja_una_cifra"))
    comun = min((t[0] for t in ts), key=lambda k: esc[k])
    conv = ", ".join(f"{txt(i)} = {u(vals[i] / esc[comun], comun)}" for i in range(nt))
    tot_c = tot / D(esc[comun])
    pasos = [("misma unidad", conv, f"Paso todo a {comun}: {conv}."),
             ("operar", u(tot_c, comun), f"Opero: {' '.join((('' if i == 0 else ('+ ' if s == '+' else '− ')) + fx(vals[i] / esc[comun])) for i, s in enumerate(signos))} = {u(tot_c, comun)}."),
             (f"{comun} → {R}", resp, f"Lo expreso en {R}: {resp}." if comun != R else f"Ya está en {R}: {resp}.")]
    adulto = "Solo se pueden sumar o restar medidas expresadas en la misma unidad; al final se pasa a la unidad pedida."
    return mk(enun, resp, "t4_operar_uds", {"expr": expr, "R": R}, dist, pasos, adulto, genericos=var_rel(r, R, 3))


@generador("t4_compleja_dec")
def gen_compleja_dec(rng, d, magnitud="superficie", pares=(("m²", "dm²"),)):
    """Forma compleja de dos unidades ↔ forma incompleja decimal en la unidad mayor (3 m² 5 dm² = 3,05 m²)."""
    esc = ESCALA[magnitud]
    g, p = rng.choice([tuple(x) for x in pares])
    ratio = esc[g] // esc[p]
    cif = len(str(ratio)) - 1
    a = rng.randint(1, 20)
    b = rng.randint(1, 9) if d == 3 else rng.randint(10 ** (cif - 1), ratio - 1)
    val = D(a) + D(b) / D(ratio)
    if rng.random() < 0.5:
        enun = f"Expresa {a} {g} {b} {p} en {g}."
        resp = u(val, g)
        dist = [(u(D(a) + D(b) / D(10 ** len(str(b))), g), "compleja_una_cifra"), (u(D(a) * ratio + b, g), "otra_unidad"),
                (u(D(a) + D(b) / D(ratio * 10), g), "factor_mal"), (u(D(a) + D(b) / D(ratio // 10), g) if ratio >= 100 else None, "factor_mal")]
        pasos = [(f"{b} {p} = {fx(D(b) / ratio)} {g}", fx(D(b) / ratio), f"1 {g} = {fmt(ratio)} {p}, así que {b} {p} = {b} : {fmt(ratio)} = {fx(D(b) / ratio)} {g}."),
                 (f"{a} + {fx(D(b) / ratio)}", fx(val), f"Sumo: {a} + {fx(D(b) / ratio)} = {resp}.")]
    else:
        enun = f"Expresa {u(val, g)} en {g} y {p}."
        resp = f"{a} {g} {b} {p}"
        dec = format(val.normalize(), "f").split(".")[1]
        b_mal = int(dec) if int(dec) != b else b * 10
        dist = [(f"{a} {g} {b_mal} {p}", "compleja_una_cifra"), (f"{a} {g} {b * 10} {p}" if b * 10 < ratio * 10 and b * 10 != b_mal else None, "factor_mal"),
                (f"{a} {g} {b // 10 if b >= 10 else b + 1} {p}", None), (f"{a + 1} {g} {b} {p}", None)]
        pasos = [(f"0,{dec} {g} × {fmt(ratio)}", f"{b} {p}", f"La parte entera son {a} {g}. La parte decimal: {fx(val - a)} × {fmt(ratio)} = {b} {p} (cada escalón vale {fmt(ratio)}, {cif} cifras)."),
                 ("", resp, f"Resultado: {resp}.")]
    adulto = f"En {magnitud} cada escalón de unidades ocupa {cif} cifras decimales: {b} {p} son {fx(D(b) / ratio)} {g}, no {fx(D(b) / D(10 ** len(str(b))))} {g}."
    return mk(enun, resp, "t4_compleja_dec", {"a": a, "b": b, "g": g, "p": p}, dist, pasos, adulto,
              genericos=var_num(val, g, pasos=(1, -1, 2)) if "Expresa" in enun and resp.endswith(g) else [f"{a + 2} {g} {b} {p}", f"{max(a - 1, 1)} {g} {b + 1} {p}"])


# ---------------------------------------------------------------- volumen ↔ capacidad ↔ masa de agua

@generador("t4_vol_cap")
def gen_vol_cap(rng, d, agua=True):
    casos = [("m³", "l", 1000), ("dm³", "l", 1), ("cm³", "ml", 1), ("l", "dm³", 1), ("ml", "cm³", 1), ("l", "cm³", 1000), ("m³", "l", 1000)]
    if d >= 2:
        casos += [("l", "m³", Decimal("0.001")), ("cm³", "l", Decimal("0.001")), ("dm³", "ml", 1000), ("cm³", "cl", Decimal("0.1"))]
    if agua and d >= 2:
        casos += [("dm³", "kg", 1), ("m³", "kg", 1000), ("l", "kg", 1)]
    u1, u2, f = rng.choice(casos)
    f = D(f)
    for _ in range(100):
        v = D(rng.randint(2, 99)) if d == 1 else _sig(D(rng.randint(11, 999)) / D(rng.choice([1, 10, 100])), 2)
        r = v * f
        if ndec(r) <= 3 and r < 10 ** 7:
            break
    if u2 == "kg":
        enun = f"¿Cuántos kg pesa el agua que cabe en un depósito de {u(v, u1)}?"
    else:
        enun = f"¿Cuántos {u2} son {u(v, u1)}?"
    resp = u(r, u2)
    dist = [(u(v / f if f != 1 else v * 1000, u2), "sentido_contrario")]
    if "m³" in (u1, u2):
        dist.insert(0, (u(v, u2), "m3_litro"))
    if "cm³" in (u1, u2) and "cl" not in (u1, u2):
        cl = {"ml": v, "l": v / 100 if u1 == "cm³" else v * 100}.get(u2 if u1 == "cm³" else u1)
        if u2 == "ml":
            dist.insert(0, (u(v / 10, u2), "cm3_cl"))
        elif u1 == "ml":
            dist.insert(0, (u(v * 10, u2), "cm3_cl"))
        elif u1 == "l" and u2 == "cm³":
            dist.insert(0, (u(v * 100, u2), "cm3_cl"))
        elif u1 == "cm³" and u2 == "l":
            dist.insert(0, (u(v / 100, u2), "cm3_cl"))
    if (u1, u2) == ("cm³", "cl"):
        dist.insert(0, (u(v, u2), "cm3_cl"))
    dist += [(u(r * 10, u2), None), (u(r / 10, u2), None), (u(r * 1000, u2) if f == 1 else None, None)]
    eq = {("m³", "l"): "1 m³ = 1000 l", ("dm³", "l"): "1 dm³ = 1 l", ("cm³", "ml"): "1 cm³ = 1 ml", ("l", "dm³"): "1 l = 1 dm³",
          ("ml", "cm³"): "1 ml = 1 cm³", ("l", "cm³"): "1 l = 1 dm³ = 1000 cm³", ("l", "m³"): "1000 l = 1 m³", ("cm³", "l"): "1000 cm³ = 1 dm³ = 1 l",
          ("dm³", "ml"): "1 dm³ = 1 l = 1000 ml", ("cm³", "cl"): "1 cm³ = 1 ml = 0,1 cl", ("dm³", "kg"): "1 dm³ de agua = 1 l = 1 kg",
          ("m³", "kg"): "1 m³ de agua = 1000 l = 1000 kg", ("l", "kg"): "1 l de agua pesa 1 kg"}[(u1, u2)]
    pasos = [("equivalencia", eq, f"Uso que {eq}."), (f"{fx(v)} × {fx(f)}" if f >= 1 else f"{fx(v)} : {fx(1 / f)}", fx(r), f"Entonces {u(v, u1)} = {resp}.")]
    adulto = "Claves: 1 dm³ = 1 l, 1 cm³ = 1 ml, 1 m³ = 1000 l; un litro de agua pesa 1 kg. Confundir el litro con el m³ o el cm³ con el cl son los errores típicos."
    return mk(enun, resp, "t4_vol_cap", {"v": str(v), "de": u1, "a": u2}, dist, pasos, adulto, genericos=var_rel(r, u2, 3))


# ---------------------------------------------------------------- comparar longitudes con unidades no convencionales

COLORES = ["roja", "azul", "verde", "amarilla", "naranja", "morada", "blanca", "negra"]


@generador("t4_comparar_nc")
def gen_comparar_nc(rng, d, max_medida=20):
    obj = rng.choice([("cuerda", "cuerdas", "palmos", "larga", "corta"), ("cinta", "cintas", "palmos", "larga", "corta"),
                      ("torre", "torres", "cubos", "alta", "baja"), ("serpiente de plastilina", "serpientes de plastilina", "clips", "larga", "corta"),
                      ("mesa", "mesas", "palmos", "larga", "corta")])
    cols = rng.sample(COLORES, 3)
    for _ in range(100):
        ms = rng.sample(range(3 if d == 1 else 6, max_medida + 1), 3)
        por_unidad = sorted(range(3), key=lambda i: ms[i] % 10)
        if d == 1 or len({m % 10 for m in ms}) == 3:
            break
    orden = sorted(range(3), key=lambda i: ms[i])
    nom = lambda i: f"la {cols[i]}"
    datos = f"La {obj[0]} {cols[0]} mide {ms[0]} {obj[2]}, la {cols[1]} mide {ms[1]} y la {cols[2]} mide {ms[2]}."
    tipo = "mas" if d == 1 else rng.choice(["mas", "menos"]) if d == 2 else "ordenar"
    if tipo == "mas":
        enun = f"{datos} ¿Cuál es la más {obj[3]}?"
        resp = nom(orden[2])
        dist = [(nom(orden[0]), "orden_invertido"), (nom(por_unidad[2]), "ultima_cifra"), (nom(orden[1]), None)]
    elif tipo == "menos":
        enun = f"{datos} ¿Cuál es la más {obj[4]}?"
        resp = nom(orden[0])
        dist = [(nom(orden[2]), "orden_invertido"), (nom(por_unidad[0]), "ultima_cifra"), (nom(orden[1]), None)]
    else:
        enun = f"{datos} Ordénalas de la más {obj[4]} a la más {obj[3]}."
        resp = ", ".join(nom(i) for i in orden)
        dist = [(", ".join(nom(i) for i in reversed(orden)), "orden_invertido"), (", ".join(nom(i) for i in por_unidad), "ultima_cifra"),
                (", ".join(nom(i) for i in [orden[1], orden[0], orden[2]]), None), (", ".join(nom(i) for i in [orden[0], orden[2], orden[1]]), None)]
    pasos = [("comparar", resp, f"Todas se miden con la misma unidad ({obj[2]}), así que basta comparar los números: {', '.join(str(ms[i]) for i in orden)} de menor a mayor."),
             ("", resp, f"Respuesta: {resp}.")]
    adulto = "Con la misma unidad, más unidades significa más longitud. Hay que comparar el número entero (12 > 9), no solo la última cifra, y respetar el orden que se pide."
    return mk(enun, resp, "t4_comparar_nc", {"medidas": ms, "colores": cols}, dist, pasos, adulto,
              genericos=["miden lo mismo"] if tipo != "ordenar" else [])
