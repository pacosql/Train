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


# ---------------------------------------------------------------- sexagesimal: tiempo y ángulos

SEX = {"tiempo": ("h", "min", "s"), "angulo": ("°", "'", "\"")}
NOMSEX = {"h": ("hora", "horas"), "min": ("minuto", "minutos"), "s": ("segundo", "segundos"), "°": ("grado", "grados"),
          "'": ("minuto", "minutos"), "\"": ("segundo", "segundos")}


def sx(vals, tipo, ceros=False):
    """vals = (a, b, c) → '2 h 3 min 4 s' / '3° 25' 45"'. Omite componentes nulas (salvo que todo sea 0)."""
    us = SEX[tipo]
    partes = []
    for v, un in zip(vals, us):
        if v or ceros:
            partes.append(f"{fmt(v)} {un}" if tipo == "tiempo" else f"{fmt(v)}{un}")
    return " ".join(partes) if partes else (f"0 {us[-1]}" if tipo == "tiempo" else f"0{us[0]}")


def norm(seg):
    return (seg // 3600, seg % 3600 // 60, seg % 60)


def aseg(vals):
    return vals[0] * 3600 + vals[1] * 60 + vals[2]


@generador("t4_sexag")
def gen_sexag(rng, d, tipo="tiempo", modos=("a_menor", "a_compleja"), tres=None):
    us = SEX[tipo]
    modo = rng.choice(list(modos))
    tres = (d == 3) if tres is None else tres
    if tres:
        vals = (rng.randint(1, 5 if tipo == "tiempo" else 40), rng.randint(1, 59), rng.randint(1, 59))
        idx = (0, 1, 2)
    else:
        par = rng.choice([(0, 1), (1, 2)] if d == 1 else [(0, 1), (1, 2), (0, 2)])
        vals = [0, 0, 0]
        vals[par[0]] = rng.randint(1, 9 if par[0] == 0 else 59)
        vals[par[1]] = rng.randint(1, 59)
        vals = tuple(vals)
        idx = par
    menor = max(i for i in idx if vals[i]) if modo == "a_menor" else 2
    mult = [3600, 60, 1]
    if modo == "a_menor":
        # a la unidad menor presente (o segundos si hay tres)
        total = sum(v * mult[i] for i, v in enumerate(vals)) // mult[menor]
        enun = f"¿Cuántos {NOMSEX[us[menor]][1]} son {sx(vals, tipo)}?"
        resp = f"{fmt(total)} {us[menor]}" if tipo == "tiempo" else f"{fmt(total)}{us[menor]}"
        m100 = [10000, 100, 1]
        f100 = sum(v * m100[i] for i, v in enumerate(vals)) // m100[menor]
        un = (lambda x: f"{fmt(x)} {us[menor]}") if tipo == "tiempo" else (lambda x: f"{fmt(x)}{us[menor]}")
        dist = [(un(f100), "factor_100")]
        if vals[0] and menor == 2:
            dist.append((un(vals[0] * 60 + vals[1] * 60 + vals[2]), "h_60s"))
        dist += [(un(sum(v * mult[i] for i, v in enumerate(vals[:menor])) // mult[menor]), "olvida_ultima"),
                 (un(total + 60 if menor == 2 else total + 1), None)]
        pasos = [(f"{sx(vals, tipo)} → {us[menor]}", un(total),
                  " ".join(f"{vals[i]} {NOMSEX[us[i]][1]} = {fmt(vals[i] * mult[i] // mult[menor])} {NOMSEX[us[menor]][1]}." for i in range(menor) if vals[i])
                  + f" Sumo todo: {un(total)}.")]
    else:
        total = aseg(vals) if tres or idx == (0, 2) or idx == (1, 2) else (vals[0] * 60 + vals[1])
        if not (tres or 2 in idx):  # h y min → desde minutos
            h, m = divmod(total, 60)
            enun = f"Expresa {fmt(total)} {'minutos' if tipo == 'tiempo' else 'minutos (′)'} en forma compleja."
            if tipo == "angulo":
                enun = f"Expresa {fmt(total)}' en grados y minutos."
            else:
                enun = f"Expresa {fmt(total)} min en horas y minutos."
            resp = sx((h, m, 0), tipo)
            dist = [(sx((total // 100, total % 100, 0), tipo) if total >= 100 else None, "factor_100"),
                    (sx((h, m + 1, 0), tipo), None), (sx((h + 1, m, 0), tipo), None), (sx((h - 1 if h > 1 else h + 2, m, 0), tipo), None)]
            pasos = [(f"{fmt(total)} : 60", f"{h} y resto {m}", f"Cada 60 {NOMSEX[us[1]][1]} hacen 1 {NOMSEX[us[0]][0]}: {fmt(total)} : 60 = {h} y sobran {m}."),
                     ("", resp, f"Por tanto: {resp}.")]
        else:
            h, m, s_ = norm(total)
            un_s = "s" if tipo == "tiempo" else "\""
            enun = f"Expresa {fmt(total)} {un_s} en forma compleja." if tipo == "tiempo" else f"Expresa {fmt(total)}\" en grados, minutos y segundos."
            if tipo == "tiempo":
                enun = f"Expresa {fmt(total)} s en {'horas, minutos y segundos' if h else 'minutos y segundos'}."
            elif not h:
                enun = f"Expresa {fmt(total)}\" en minutos y segundos."
            resp = sx((h, m, s_), tipo)
            q, r = divmod(total, 60)
            dist = [(sx((q, 0, r), tipo) if q != h else None, "divide_una_vez"),
                    (sx((total // 10000, total % 10000 // 100, total % 100), tipo) if total % 100 < 60 else sx((total // 10000, total % 10000 // 100, total % 100 - 40), tipo), "factor_100"),
                    (sx((h, m + 1, s_), tipo), None), (sx((h + 1, m, s_), tipo), None), (sx((h, m, (s_ + 10) % 60), tipo), None)]
            pasos = [(f"{fmt(total)} : 60", f"{fmt(q)} y resto {r}", f"Divido entre 60 para pasar a {NOMSEX[us[1]][1]}: {fmt(total)} : 60 = {fmt(q)} y sobran {r} {NOMSEX[us[2]][1]}."),
                     (f"{fmt(q)} : 60", f"{h} y resto {m}", f"Vuelvo a dividir entre 60 para pasar a {NOMSEX[us[0]][1]}: {fmt(q)} : 60 = {h} y sobran {m} {NOMSEX[us[1]][1]}."),
                     ("", resp, f"Resultado: {resp}.")]
    adulto = f"El sistema sexagesimal va de 60 en 60 (1 {us[0]} = 60 {us[1]} = 3600 {us[2]}), no de 100 en 100. Para pasar a forma compleja hay que dividir entre 60 dos veces."
    return mk(enun, resp, "t4_sexag", {"vals": list(vals), "tipo": tipo, "modo": modo}, dist, pasos, adulto)


def _sex_rand(rng, tipo, d, mayor=None):
    top = mayor or (12 if tipo == "tiempo" else 90)
    if d == 1:
        return (rng.randint(1, top), rng.randint(1, 59), 0)
    return (rng.randint(1, top), rng.randint(1, 59), rng.randint(1, 59))


@generador("t4_sexag_op")
def gen_sexag_op(rng, d, tipo="tiempo", ops=("+", "-"), p_ref=0.0):
    """Suma/resta en forma compleja. p_ref: probabilidad (ángulos) de 90°/180° − x (complementario/suplementario)."""
    op = rng.choice(list(ops))
    ref = None
    if tipo == "angulo" and rng.random() < p_ref:
        ref = rng.choice([90, 180])
        b = (rng.randint(10, ref - 10), rng.randint(1, 59), rng.randint(1, 59) if d > 1 else 0)
        a = (ref, 0, 0)
        op = "-"
    else:
        for _ in range(100):
            a, b = _sex_rand(rng, tipo, d), _sex_rand(rng, tipo, d)
            if op == "-" and aseg(a) <= aseg(b):
                a, b = b, a
            if op == "-" and aseg(a) == aseg(b):
                continue
            lleva = (a[2] + b[2] >= 60 or a[1] + b[1] >= 60) if op == "+" else (a[2] < b[2] or a[1] < b[1])
            if lleva or d == 1:
                break
    if op == "+":
        r = norm(aseg(a) + aseg(b))
    else:
        r = norm(aseg(a) - aseg(b))
    if tipo == "angulo":
        r = (r[0], r[1], r[2])
    enun = (f"Calcula el {'complementario' if ref == 90 else 'suplementario'} de {sx(b, tipo)}." if ref else
            f"Calcula: {sx(a, tipo)} {'+' if op == '+' else '−'} {sx(b, tipo)}")
    resp = sx(r, tipo)
    dist = []
    if op == "+":
        dist.append((sx(tuple(x + y for x, y in zip(a, b)), tipo, ceros=False), "no_reagrupa"))
        s2 = a[2] + b[2]
        m2 = a[1] + b[1] + (1 if s2 >= 100 else 0)
        dist.append((sx((a[0] + b[0] + (1 if m2 >= 100 else 0), m2 % 100, s2 % 100), tipo), "reagrupa_100"))
        dist.append((sx(norm(aseg(a) + aseg(b) + 60), tipo), None))
    else:
        dist.append((sx(tuple(abs(x - y) for x, y in zip(a, b)), tipo), "sin_prestar"))
        s, m, h = a[2] - b[2], a[1] - b[1], a[0] - b[0]
        if s < 0:
            s += 100
            m -= 1
        if m < 0:
            m += 100
            h -= 1
        if h >= 0:
            dist.append((sx((h, m, s), tipo), "presta_100"))
        dist.append((sx(norm(aseg(a) - aseg(b) + 60), tipo), None))
        dist.append((sx(norm(abs(aseg(a) - aseg(b) - 3600)), tipo), None))
    us = SEX[tipo]
    if op == "+":
        crudo = tuple(x + y for x, y in zip(a, b))
        pasos = [("sumo por columnas", sx(crudo, tipo), f"Sumo cada unidad por separado: {sx(crudo, tipo, ceros=True)}."),
                 ("reagrupo", resp, f"Cada 60 {NOMSEX[us[2]][1]} forman 1 {NOMSEX[us[1]][0]} y cada 60 {NOMSEX[us[1]][1]} forman 1 {NOMSEX[us[0]][0]}: {resp}.")]
    else:
        pasos = [("preparo", sx(a, tipo, ceros=True), f"Coloco {sx(a, tipo, ceros=True)} encima de {sx(b, tipo, ceros=True)}. Si en una columna no puedo restar, pido 1 a la unidad de la izquierda, que vale 60 (no 100)."),
                 ("resto", resp, f"Resto columna a columna: {resp}.")]
    adulto = "Al sumar se reagrupa de 60 en 60; al restar, cada unidad que se pide prestada vale 60 de la unidad inferior, no 100."
    return mk(enun, resp, "t4_sexag_op", {"a": list(a), "b": list(b), "op": op, "tipo": tipo, "ref": ref}, dist, pasos, adulto)


@generador("t4_sexag_multdiv")
def gen_sexag_multdiv(rng, d, tipo="tiempo", ops=("×", ":"), factor_max=12):
    op = rng.choice(list(ops))
    n = rng.randint(2, factor_max if d > 1 else min(6, factor_max))
    if op == "×":
        a = _sex_rand(rng, tipo, d, mayor=10 if tipo == "tiempo" else 40)
        r = norm(aseg(a) * n)
        enun = f"Calcula: ({sx(a, tipo)}) × {n}"
        dist = [(sx(tuple(x * n for x in a), tipo), "no_reagrupa"), (sx(norm(aseg(a) * n + 60), tipo), None),
                (sx((a[0] * n, a[1], a[2]), tipo), "solo_primera"), (sx(norm(aseg(a) * (n + 1)), tipo), None)]
    else:
        for _ in range(100):
            q = _sex_rand(rng, tipo, d, mayor=5 if tipo == "tiempo" else 30)
            a = norm(aseg(q) * n)
            if a[0] % n or d == 1:
                break
        r = q
        enun = f"Calcula: ({sx(a, tipo)}) : {n}"
        pr = (a[0] // n, a[1] // n, a[2] // n)
        dist = [(sx(pr, tipo) if pr != r else None, "pierde_resto"), (sx(norm(aseg(q) + 60), tipo), None),
                (sx(norm(max(aseg(q) - 60, 1)), tipo), None), (sx((a[0] // n, a[1], a[2]), tipo), None)]
    resp = sx(r, tipo)
    us = SEX[tipo]
    if op == "×":
        crudo = tuple(x * n for x in a)
        pasos = [("multiplico cada unidad", sx(crudo, tipo, ceros=True), f"Multiplico cada parte por {n}: {sx(crudo, tipo, ceros=True)}."),
                 ("reagrupo", resp, f"Paso cada 60 {NOMSEX[us[2]][1]} a 1 {NOMSEX[us[1]][0]} y cada 60 {NOMSEX[us[1]][1]} a 1 {NOMSEX[us[0]][0]}: {resp}.")]
    else:
        q0, r0 = divmod(a[0], n)
        m_tot = r0 * 60 + a[1]
        q1, r1 = divmod(m_tot, n)
        s_tot = r1 * 60 + a[2]
        pasos = [(f"{a[0]} : {n}", f"{q0} y resto {r0}", f"Divido {NOMSEX[us[0]][1]}: {a[0]} : {n} = {q0} y sobran {r0}, que son {r0 * 60} {NOMSEX[us[1]][1]}."),
                 (f"{m_tot} : {n}", f"{q1} y resto {r1}", f"Sumo {r0 * 60} + {a[1]} = {m_tot} {NOMSEX[us[1]][1]}; {m_tot} : {n} = {q1} y sobran {r1}, que son {r1 * 60} {NOMSEX[us[2]][1]}."),
                 (f"{s_tot} : {n}", str(s_tot // n), f"Sumo {r1 * 60} + {a[2]} = {s_tot} {NOMSEX[us[2]][1]}; {s_tot} : {n} = {s_tot // n}. Resultado: {resp}.")]
    adulto = ("Al multiplicar se reagrupa de 60 en 60; al dividir, el resto de cada unidad se pasa a la inferior multiplicándolo por 60 "
              "y se suma antes de seguir dividiendo. Tirar los restos es el error típico.")
    return mk(enun, resp, "t4_sexag_multdiv", {"a": list(a), "n": n, "op": op, "tipo": tipo}, dist, pasos, adulto)


@generador("t4_decimal_sexag")
def gen_decimal_sexag(rng, d, tipo="tiempo", segundos=False):
    us = SEX[tipo]
    a = rng.randint(1, 9 if tipo == "tiempo" else 89)
    if d == 1:
        f = D(rng.choice(["0.5", "0.25", "0.75", "0.2", "0.1", "0.4", "0.6", "0.8"]))
    else:
        opts = [D(x) / 100 for x in range(5, 100, 5)] + [D(x) / 10 for x in range(1, 10)]
        if segundos and d == 3:
            opts = [D(x) / 100 for x in range(1, 100) if x % 5]
        f = rng.choice(opts)
    val = D(a) + f
    tot_s = int(f * 3600)
    mm, ss = divmod(tot_s, 60)
    compl = (a, mm, ss)
    unid = " h" if tipo == "tiempo" else "°"
    if rng.random() < 0.55:
        enun = f"Expresa {fx(val)}{unid} en {'horas y minutos' if tipo == 'tiempo' else 'grados, minutos y segundos' if ss else 'grados y minutos'}."
        resp = sx(compl, tipo)
        dec = format(f.normalize(), "f").split(".")[1]
        alt = int(dec) * 10 if len(dec) == 1 and int(dec) * 10 != mm else int(dec) + 10
        dist = [(sx((a, int(dec), 0), tipo) if int(dec) != mm else None, "decimales_como_min"),
                (sx((a, alt, 0), tipo) if alt < 60 else None, None),
                (sx((a, mm + 10 if mm < 50 else mm - 10, ss), tipo), None), (sx((a + 1, mm, ss), tipo), None)]
        pasos = [(f"{fx(f)} × 60", fx(f * 60), f"La parte entera son {a}{unid}. La parte decimal se multiplica por 60: {fx(f)} × 60 = {fx(f * 60)} {NOMSEX[us[1]][1]}."),
                 ("", resp, f"Resultado: {resp}.")]
    else:
        enun = f"Expresa {sx(compl, tipo)} en {'horas' if tipo == 'tiempo' else 'grados'} con decimales."
        resp = f"{fx(val)}{unid}"
        mal = D(a) + D(mm) / 100 if mm < 100 else None
        dist = [(f"{fx(mal)}{unid}" if mal is not None and mal != val else None, "min_entre_100"),
                (f"{fx(D(a) + D(mm) / 10)}{unid}" if D(mm) / 10 < 1 else None, None),
                (f"{fx(val + D('0.1'))}{unid}", None), (f"{fx(val - D('0.05'))}{unid}", None), (f"{fx(val + 1)}{unid}", None)]
        pasos = [(f"{mm} : 60" + (f" + {ss} : 3600" if ss else ""), fx(f), f"Paso los {NOMSEX[us[1]][1]} a {NOMSEX[us[0]][1]} dividiendo entre 60: {mm} : 60 = {fx(D(mm) / 60)}" + (f"; y los {ss} {NOMSEX[us[2]][1]} entre 3600" if ss else "") + "."),
                 ("", resp, f"Sumo la parte entera: {resp}.")]
    adulto = "La parte decimal es una fracción de hora o grado: 0,5 = media = 30 minutos; 0,25 = 15 minutos. No se lee como minutos (2,5 h ≠ 2 h 5 min) ni se divide entre 100."
    return mk(enun, resp, "t4_decimal_sexag", {"a": a, "f": str(f), "tipo": tipo}, dist, pasos, adulto)


# ---------------------------------------------------------------- días, meses, calendario

DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
DIAS_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
ORD = ["primero", "segundo", "tercero", "cuarto", "quinto", "sexto", "séptimo", "octavo", "noveno", "décimo", "undécimo", "duodécimo"]


@generador("t4_ciclico")
def gen_ciclico(rng, d, lista="dias", desplazamiento_max=2):
    L = DIAS if lista == "dias" else MESES
    n = len(L)
    if lista == "dias":
        frases = {-2: "¿qué día fue anteayer?", -1: "¿qué día fue ayer?", 1: "¿qué día será mañana?", 2: "¿qué día será pasado mañana?"}
        opciones = [-1, 1] if d == 1 else [-2, -1, 1, 2]
        i = rng.randrange(n)
        if d == 3:
            i = rng.choice([5, 6, 0, 1])  # cerca del cambio de semana
        k = rng.choice(opciones)
        enun = f"Si hoy es {L[i]}, {frases[k]}"
    else:
        k = rng.choice([1, -1] if d == 1 else [1, -1, 2, -2, 3, -3][:2 * desplazamiento_max])
        i = rng.randrange(n)
        if d == 3:
            i = rng.choice([9, 10, 11, 0, 1, 2])
        if abs(k) == 1:
            enun = f"¿Qué mes va {'justo después de' if k > 0 else 'justo antes de'} {L[i]}?"
        else:
            enun = f"¿Qué mes va {['', '', 'dos', 'tres'][abs(k)]} meses {'después' if k > 0 else 'antes'} de {L[i]}?"
    j = (i + k) % n
    resp = L[j]
    sgn = 1 if k > 0 else -1
    dist = [(L[(i - k) % n], "invierte"), (L[(i + k - sgn) % n] if abs(k) > 1 else None, "cuenta_partida"),
            ("no hay ninguno" if not (0 <= i + k < n) else None, "no_da_vuelta"), (L[(i + k + sgn) % n], None), (L[(i + 2 * k) % n], None)]
    pasos = [("contar", resp, f"Parto de {L[i]} y avanzo {abs(k)} {'hacia delante' if k > 0 else 'hacia atrás'} sin contar el de partida"
              + (f"; después de {L[-1]} vuelve a empezar {L[0]}" if not (0 <= i + k < n) and k > 0 else f"; antes de {L[0]} está {L[-1]}" if not (0 <= i + k < n) else "")
              + f": {resp}.")]
    adulto = ("Los días y los meses son cíclicos: después de " + L[-1] + " viene " + L[0] + ". Al contar no se incluye el punto de partida.")
    return mk(enun, resp, "t4_ciclico", {"i": i, "k": k, "lista": lista}, dist, pasos, adulto, genericos=[x for x in L if x not in (resp, L[i])][:4])


@generador("t4_calendario")
def gen_calendario(rng, d):
    if d == 1:
        m = rng.randrange(12)
        enun = f"¿Cuántos días tiene el mes de {MESES[m]}" + (" de 2025?" if m == 1 else "?")
        r = DIAS_MES[m]
        resp = f"{r} días"
        dist = [(f"{31 if r != 31 else 30} días", "mes_30_31"), (f"{29 if r != 29 else 28} días" if m == 1 else f"{28} días", None),
                (f"{30 if r == 31 else 31 if r == 28 else 29} días", None), ("30 días" if r != 30 else "29 días", None)]
        pasos = [("", resp, f"{MESES[m].capitalize()} tiene {r} días" + (" (2025 no es bisiesto)." if m == 1 else ". Truco: contar con los nudillos de la mano."))]
    elif d == 2:
        m = rng.randrange(12)
        a = rng.randint(1, 15)
        b = rng.randint(a + 3, DIAS_MES[m])
        r = b - a
        enun = f"¿Cuántos días hay desde el {a} hasta el {b} de {MESES[m]}?"
        resp = f"{r} días"
        dist = [(f"{r + 1} días", "incluye_inicio"), (f"{r - 1} días", None), (f"{a + b} días", None), (f"{r + 2} días", None)]
        pasos = [(f"{b} − {a}", str(r), f"Resto las fechas: {b} − {a} = {r} días.")]
    else:
        m = rng.randrange(11)
        dm = DIAS_MES[m]
        a = rng.randint(dm - 8, dm - 1)
        b = rng.randint(1, 10)
        r = dm - a + b
        anyo = " de 2025" if m == 1 else ""
        enun = f"¿Cuántos días hay desde el {a} de {MESES[m]} hasta el {b} de {MESES[m + 1]}{anyo}?"
        resp = f"{r} días"
        otro = 30 if dm == 31 else 31 if dm == 30 else 30
        dist = [(f"{otro - a + b} días", "mes_30_31"), (f"{r + 1} días", "incluye_inicio"), (f"{abs(b - a)} días", None), (f"{r - 1} días", None)]
        pasos = [(f"{dm} − {a}", str(dm - a), f"{MESES[m].capitalize()} tiene {dm} días: del {a} al {dm} hay {dm} − {a} = {dm - a} días."),
                 (f"{dm - a} + {b}", str(r), f"Del {dm} de {MESES[m]} al {b} de {MESES[m + 1]} hay {b} días más. Total: {dm - a} + {b} = {r} días.")]
    adulto = "Los días entre dos fechas se calculan restando (sin contar el día de salida). Cada mes tiene 30 o 31 días, salvo febrero (28 o 29)."
    return mk(enun, resp, "t4_calendario", {"d": d}, dist, pasos, adulto)


# ---------------------------------------------------------------- equivalencias de tiempo

@generador("t4_equiv_tiempo")
def gen_equiv_tiempo(rng, d, largas=False):
    if largas:
        uds = {"lustro": 5, "década": 10, "siglo": 100, "milenio": 1000}
        pl = {"lustro": "lustros", "década": "décadas", "siglo": "siglos", "milenio": "milenios"}
        if d == 1:
            un = rng.choice(["lustro", "década", "siglo"])
            n = rng.randint(2, 9)
            r = n * uds[un]
            enun = f"¿Cuántos años son {n} {pl[un]}?"
            otra = {"lustro": 10, "década": 5, "siglo": 10, "milenio": 100}[un]
            dist = [(f"{n * otra} años", "confunde_lustro_decada" if un in ("lustro", "década") else None), (f"{n} años", "suma_sin_convertir"),
                    (f"{n * uds[un] * 10} años", None), (f"{n + uds[un]} años", None)]
            pasos = [(f"{n} × {uds[un]}", str(r), f"Un {un} son {uds[un]} años: {n} × {uds[un]} = {r} años.")]
        elif d == 2:
            un = rng.choice(["lustro", "década", "siglo"])
            n = rng.randint(2, 9)
            r = n
            anos = n * uds[un]
            enun = f"¿{'Cuántas' if un == 'década' else 'Cuántos'} {pl[un]} son {fmt(anos)} años?"
            otra = {"lustro": 10, "década": 5, "siglo": 10}[un]
            dist = [(f"{fx(D(anos) / otra)} {pl[un]}", "confunde_lustro_decada" if un != "siglo" else None), (f"{fmt(anos)} {pl[un]}", None),
                    (f"{n * 10} {pl[un]}", None), (f"{n + 1} {pl[un]}", None)]
            resp_ = f"{n} {pl[un] if n > 1 else un}"
            pasos = [(f"{fmt(anos)} : {uds[un]}", str(n), f"Un {un} son {uds[un]} años: {fmt(anos)} : {uds[un]} = {n}.")]
            ej = mk(enun, resp_, "t4_equiv_tiempo", {"n": n, "un": un}, dist, pasos,
                    "Lustro = 5 años, década = 10, siglo = 100, milenio = 1000. Confundir lustro y década es el error más frecuente.")
            return ej
        else:
            u1, u2 = rng.sample(["milenio", "siglo", "década", "lustro"], 2)
            if uds[u1] < uds[u2]:
                u1, u2 = u2, u1
            a, b = rng.randint(1, 5), rng.randint(1, 9)
            r = a * uds[u1] + b * uds[u2]
            enun = f"¿Cuántos años son {a} {pl[u1] if a > 1 else u1} y {b} {pl[u2] if b > 1 else u2}?"
            sw = {"lustro": 10, "década": 5}
            dist = [(f"{a + b} años", "suma_sin_convertir"),
                    (f"{a * sw.get(u1, uds[u1]) + b * sw.get(u2, uds[u2])} años" if (u1 in sw or u2 in sw) else None, "confunde_lustro_decada"),
                    (f"{a * uds[u1] + b} años", None), (f"{r + uds[u2]} años", None), (f"{r - uds[u2]} años", None)]
            pasos = [(f"{a} × {uds[u1]} + {b} × {uds[u2]}", fmt(r), f"{a} × {uds[u1]} = {a * uds[u1]} años y {b} × {uds[u2]} = {b * uds[u2]} años. En total, {fmt(r)} años.")]
        resp = f"{fmt(r)} años"
        adulto = "Lustro = 5 años, década = 10, siglo = 100, milenio = 1000. Confundir lustro y década es el error más frecuente."
        return mk(enun, resp, "t4_equiv_tiempo", {"r": r}, dist, pasos, adulto)
    eq = [("semanas", "días", 7, 14), ("días", "horas", 24, 4), ("horas", "minutos", 60, 3), ("años", "meses", 12, 8)]
    if d >= 2:
        eq += [("cuartos de hora", "minutos", 15, 6), ("medias horas", "minutos", 30, 3)]
    a, b, f, mx = rng.choice(eq)
    n = rng.randint(1 if d > 1 else 2, mx)
    if d == 3 and a in ("semanas", "días", "horas"):
        extra_unidad = {"semanas": ("días", 1, 6), "días": ("horas", 1, 23), "horas": ("minutos", 5, 55)}[a]
    r = n * f
    sing = {"semanas": "semana", "días": "día", "horas": "hora", "años": "año", "cuartos de hora": "cuarto de hora", "medias horas": "media hora"}
    enun = f"¿{'Cuántas' if b == 'horas' else 'Cuántos'} {b} son {n} {a if n > 1 else sing[a]}?"
    if a in ("cuartos de hora", "medias horas") and n == 1:
        enun = f"¿Cuántos minutos son {'un cuarto de hora' if a == 'cuartos de hora' else 'media hora'}?"
    resp = f"{r} {b}"
    decimal = {"horas": 100, "días": 10, "semanas": 10, "años": 10, "cuartos de hora": 25, "medias horas": 50}[a]
    otras = [x for x in (7, 24, 60, 12, 30, 100) if x != f and x != decimal]
    dist = [(f"{n * decimal} {b}", "decimal"), (f"{n * rng.choice(otras)} {b}", "mezcla"), (f"{r + f} {b}", None), (f"{n + f} {b}", None)]
    pasos = [(f"{n} × {f}", str(r), f"1 {sing[a]} = {f} {b}. Entonces {n} × {f} = {r} {b}.")]
    adulto = "El tiempo no va de 10 en 10: 1 semana = 7 días, 1 día = 24 h, 1 h = 60 min, 1 año = 12 meses."
    return mk(enun, resp, "t4_equiv_tiempo", {"n": n, "f": f}, dist, pasos, adulto)


# ---------------------------------------------------------------- reloj de 24 horas

MIN_TXT = {0: "en punto", 15: "y cuarto", 30: "y media", 45: "menos cuarto"}


def _periodo(h):
    if h == 0:
        return "de la noche"
    if h < 6:
        return "de la madrugada"
    if h < 12:
        return "de la mañana"
    if h < 13:
        return "del mediodía"
    if h < 21:
        return "de la tarde"
    return "de la noche"


def _hora12(h):
    x = h % 12
    return 12 if x == 0 else x


def _decir(h, m):
    if m <= 30:
        hh = _hora12(h)
        art = "la" if hh == 1 else "las"
        num = "una" if hh == 1 else letras_h(hh)
        mt = "" if m == 0 else (" y cuarto" if m == 15 else " y media" if m == 30 else f" y {letras_h(m)}")
        return f"{art} {num}{mt} {_periodo(h)}"
    hh = _hora12(h + 1)
    art = "la" if hh == 1 else "las"
    num = "una" if hh == 1 else letras_h(hh)
    mt = " menos cuarto" if m == 45 else f" menos {letras_h(60 - m)}"
    return f"{art} {num}{mt} {_periodo(h)}"


def letras_h(n):
    from .nucleo import letras
    return letras(n)


@generador("t4_reloj24")
def gen_reloj24(rng, d):
    mins = {1: [0, 30], 2: [0, 15, 30, 45], 3: [0, 10, 15, 20, 25, 30, 35, 40, 45, 50]}[d]
    for _ in range(100):
        h = rng.choice(list(range(13, 21)) + [21, 22]) if d == 1 else rng.randint(0, 23)
        m = rng.choice(mins)
        if m > 30 and h in (11, 12, 20, 23, 5):
            continue  # evita ambigüedad de periodo con «menos»
        if d < 3 and h in (0, 12):
            continue
        if d == 3 and rng.random() < 0.3:
            h = rng.choice([0, 12])
            m = rng.choice([10, 20, 30, 15])
        break
    txt = _decir(h, m)
    hh = f"{h:02d}:{m:02d}"
    if rng.random() < 0.5:
        enun = f"¿Cómo se dice la hora que marca un reloj digital con {hh}?"
        resp = txt[0].upper() + txt[1:]
        cap = lambda s: s[0].upper() + s[1:]
        d10 = _decir((h - 10) % 24 if h >= 13 else h, m).rsplit(" ", 3)
        dist = [(cap(_decir(h - 10, m).replace(_periodo(h - 10), _periodo(h))) if 13 <= h <= 21 and m <= 30 else None, "resta_10")]
        if h in (0, 12):
            otro = "del mediodía" if h == 0 else "de la noche"
            dist.append((cap(txt.replace(_periodo(h), otro)), "confunde_12_00"))
        otros_p = [p for p in ("de la mañana", "de la tarde", "de la noche", "de la madrugada") if p != _periodo(h)]
        dist += [(cap(txt.replace(_periodo(h), rng.choice(otros_p))), None),
                 (cap(_decir((h + 1) % 24, m)) if (h + 1) % 24 not in (0, 12) else None, None),
                 (cap(_decir((h - 2) % 24, m)) if (h - 2) % 24 not in (0, 12) else None, None)]
    else:
        enun = f"Son {txt}. ¿Qué marca un reloj digital de 24 horas?"
        resp = hh
        h12 = _hora12(h)
        dist = [(f"{(h12 + 10) % 24:02d}:{m:02d}" if h >= 13 else None, "resta_10"),
                (f"{12 if h == 0 else 0:02d}:{m:02d}" if h in (0, 12) else None, "confunde_12_00"),
                (f"{h12:02d}:{m:02d}" if h12 != h else f"{(h + 12) % 24:02d}:{m:02d}", None),
                (f"{(h + 1) % 24:02d}:{m:02d}", None), (f"{h:02d}:{(m + 15) % 60:02d}", None), (f"{(h - 1) % 24:02d}:{m:02d}", None)]
    pasos = [("24 h → 12 h", txt, (f"Por la tarde y por la noche se resta 12: {h} − 12 = {h - 12}. " if h > 12 else "")
              + (f"Las 00:{m:02d} son las doce y pico de la noche (medianoche), y las 12:xx, del mediodía. " if h in (0, 12) else "")
              + f"{hh} = {txt}.")]
    adulto = "Para pasar del formato de 24 h al de 12 h se resta 12 a partir de las 13:00. Las 00:xx son medianoche y las 12:xx, mediodía."
    return mk(enun, resp, "t4_reloj24", {"h": h, "m": m}, dist, pasos, adulto)


# ---------------------------------------------------------------- duraciones y horas de inicio/fin

def _dur(mn):
    h, m = divmod(mn, 60)
    if h and m:
        return f"{h} h {m} min"
    if h:
        return f"{h} h"
    return f"{m} min"


@generador("t4_duracion")
def gen_duracion(rng, d, medias=False):
    for _ in range(200):
        if medias:
            h1 = rng.randint(7, 12 if d < 3 else 11)
            m1 = rng.choice([0, 30]) if d > 1 else 0
            dur = rng.choice(range(60, 330, 30)) if d > 1 else rng.choice(range(60, 300, 60))
        else:
            h1 = rng.randint(7, 18)
            m1 = rng.randint(0, 59) if d > 1 else rng.choice(range(0, 60, 5))
            dur = rng.randint(20, 300)
        ini = h1 * 60 + m1
        fin = ini + dur
        h2, m2 = divmod(fin, 60)
        if h2 >= 23 or dur % 30 and medias:
            continue
        if not medias and d >= 2 and m2 >= m1:
            continue  # que haya que «pedir» una hora
        if medias and d == 3 and h2 < 13:
            continue
        break
    en12 = medias and d == 3
    if en12:
        t1, t2 = _decir(h1, m1), _decir(h2, m2)
        enun = f"¿Cuánto tiempo pasa desde {t1} hasta {t2}?"
    else:
        enun = f"¿Cuánto tiempo pasa desde las {h1}:{m1:02d} hasta las {h2}:{m2:02d}?"
    resp = _dur(dur)
    base10 = (h2 * 100 + m2) - (h1 * 100 + m1)
    dist = [(f"{base10 // 100} h {base10 % 100} min" if base10 % 100 >= 60 else None, "resta_base10")]
    if not medias:
        dist.append((_dur((h2 - h1 - 1) * 60 + m2) if m1 > 0 and h2 - h1 - 1 >= 0 else None, "olvida_minutos"))
    if en12:
        h2b = _hora12(h2)
        mal = abs((h2b * 60 + m2) - (h1 * 60 + m1))
        dist.append((_dur(mal) if mal != dur else None, "no_24h"))
    dist += [(_dur(dur + 60), None), (_dur(dur - 30) if dur > 30 else None, None), (_dur(dur + 30), None), (_dur(dur - 10) if dur > 10 else None, None)]
    hasta = 60 - m1 if m1 else 0
    pasos = [("hasta la hora en punto", _dur(hasta) if hasta else "0 min", (f"De las {h1}:{m1:02d} a las {h1 + 1}:00 van {hasta} min. " if hasta else ""))
             , ("horas enteras", "", f"De las {h1 + (1 if hasta else 0)}:00 a las {h2}:00 van {h2 - h1 - (1 if hasta else 0)} h, y luego {m2} min más."),
             ("total", resp, f"En total: {resp}.")]
    pasos = [(o, r, t) for o, r, t in pasos if t]
    adulto = "Las horas no se restan como números decimales (una hora tiene 60 minutos). Lo más seguro es contar hacia delante: hasta la hora en punto, horas enteras y minutos finales."
    return mk(enun, resp, "t4_duracion", {"h1": h1, "m1": m1, "h2": h2, "m2": m2}, dist, pasos, adulto)


@generador("t4_hora_fin")
def gen_hora_fin(rng, d):
    sentido = rng.choice(["fin", "fin", "inicio"])
    for _ in range(200):
        h1, m1 = rng.randint(6, 23), rng.randint(0, 59) if d > 1 else rng.choice(range(0, 60, 5))
        dh, dm = rng.randint(0, 3), rng.randint(5, 55) if d > 1 else rng.choice(range(5, 60, 5))
        if dh == 0 and dm < 20:
            continue
        ini = h1 * 60 + m1
        fin = ini + dh * 60 + dm
        cruza = fin >= 24 * 60
        if d == 3 and not cruza or d < 3 and cruza:
            continue
        if m1 + dm < 60 and d > 1:
            continue
        break
    fin %= 24 * 60
    h2, m2 = divmod(fin, 60)
    dur = f"{dh} h {dm} min" if dh else f"{dm} min"
    if sentido == "fin":
        enun = f"Una película empieza a las {h1}:{m1:02d} y dura {dur}. ¿A qué hora termina?"
        resp = f"{h2}:{m2:02d}"
        dist = [(f"{h1 + dh}:{m1 + dm:02d}" if m1 + dm >= 60 else None, "no_convierte_60"),
                (f"{h2 + 24}:{m2:02d}" if cruza else None, "no_pasa_24"),
                (f"{(h2 + 1) % 24}:{m2:02d}", None), (f"{(h2 - 1) % 24}:{m2:02d}", None), (f"{h2}:{(m2 + 10) % 60:02d}", None)]
        pasos = [(f"{h1}:{m1:02d} + {dur}", "", f"Sumo las horas: {h1} + {dh} = {h1 + dh}. Sumo los minutos: {m1} + {dm} = {m1 + dm}."),
                 ("60 min = 1 h", resp, (f"Como {m1 + dm} minutos pasan de 60, son 1 hora y {m1 + dm - 60} minutos más. " if m1 + dm >= 60 else "")
                  + (f"Después de las 23:59 vienen las 0:00, así que termina a las {resp}." if cruza else f"Termina a las {resp}."))]
    else:
        enun = f"Un tren llega a las {h2}:{m2:02d} después de un viaje de {dur}. ¿A qué hora salió?"
        resp = f"{h1}:{m1:02d}"
        base = (h2 * 100 + m2) - (dh * 100 + dm)
        dist = [(f"{base // 100}:{base % 100:02d}" if base > 0 and base % 100 >= 60 else None, "no_convierte_60"),
                (f"{h1 - 24}:{m1:02d}" if h1 >= 24 else None, "no_pasa_24"),
                (f"{(h1 + 1) % 24}:{m1:02d}", None), (f"{(h1 - 1) % 24}:{m1:02d}", None), (f"{h1}:{(m1 + 10) % 60:02d}", None)]
        pasos = [(f"{h2}:{m2:02d} − {dur}", resp, f"Resto la duración a la hora de llegada, pidiendo 1 hora (60 minutos) si no llegan los minutos"
                  + (" y pasando por la medianoche si hace falta" if cruza else "") + f": salió a las {resp}.")]
    adulto = "Al sumar tiempos, cada 60 minutos forman 1 hora, y después de las 23:59 se vuelve a las 0:00."
    return mk(enun, resp, "t4_hora_fin", {"h1": h1, "m1": m1, "dh": dh, "dm": dm, "sentido": sentido}, dist, pasos, adulto)


# ---------------------------------------------------------------- dinero

def eur_c(cent):
    e, c = divmod(cent, 100)
    if e and c:
        return f"{e} € y {c} c"
    if e:
        return f"{e} €"
    return f"{c} c"


def eur_dec(cent):
    return f"{cent // 100},{cent % 100:02d} €"


PIEZA_TXT = {2000: ("billete", "billetes", "20 €"), 1000: ("billete", "billetes", "10 €"), 500: ("billete", "billetes", "5 €"),
             200: ("moneda", "monedas", "2 €"), 100: ("moneda", "monedas", "1 €"), 50: ("moneda", "monedas", "50 c"),
             20: ("moneda", "monedas", "20 c"), 10: ("moneda", "monedas", "10 c"), 5: ("moneda", "monedas", "5 c"), 2: ("moneda", "monedas", "2 c"),
             1: ("moneda", "monedas", "1 c")}
NUMS = ["", "un", "dos", "tres", "cuatro", "cinco", "seis"]


def _piezas_txt(cuenta):
    partes = []
    for v, k in sorted(cuenta.items(), key=lambda t: -t[0]):
        s, p, nom = PIEZA_TXT[v]
        art = ("un" if s == "billete" else "una") if k == 1 else NUMS[k]
        partes.append(f"{art} {s if k == 1 else p} de {nom}")
    return ", ".join(partes[:-1]) + " y " + partes[-1] if len(partes) > 1 else partes[0]


@generador("t4_contar_dinero")
def gen_contar_dinero(rng, d, centimos=False, max_euros=50):
    for _ in range(200):
        if centimos:
            vals = [1000, 500, 200, 100] + [50, 20, 10, 5, 2, 1]
            nt = 3 if d == 1 else 4
            elegidas = rng.sample([500, 200, 100, 1000], 1 if d == 1 else rng.randint(1, 2)) + rng.sample([50, 20, 10, 5], nt - 1)
        else:
            elegidas = rng.sample([2000, 1000, 500, 200, 100], 2 if d == 1 else 3 if d == 2 else 4)
        cuenta = {v: rng.randint(1, 2 if d == 1 else 3) for v in elegidas}
        tot = sum(v * k for v, k in cuenta.items())
        cc = sum(v * k for v, k in cuenta.items() if v < 100)
        if tot > max_euros * 100:
            continue
        if centimos and (d >= 2 and cc < 100 or cc == 0 or tot % 100 == 0):
            continue
        break
    enun = f"Tengo {_piezas_txt(cuenta)}. ¿Cuánto dinero tengo?"
    resp = eur_c(tot)
    npiezas = sum(cuenta.values())
    if centimos:
        euros = sum(v * k for v, k in cuenta.items() if v >= 100)
        dist = [(f"{euros // 100} € y {cc} c" if cc >= 100 else None, "no_convierte_100"),
                (f"{euros // 100 + sum(v * k for v, k in cuenta.items() if v < 100)} €", "suma_juntos"),
                (eur_c(tot + 10), None), (eur_c(tot - 10), None), (eur_c(tot + 100), None)]
    else:
        dist = [(f"{npiezas} €", "cuenta_piezas"), (eur_c(tot - 100 * cuenta[200]) if 200 in cuenta else None, "monedas2_como_1"),
                (eur_c(tot + 500), None), (eur_c(tot - 100), None), (eur_c(tot + 100), None)]
    pasos = [("sumar valores", resp, "Sumo el valor de cada pieza, no el número de piezas: "
              + " + ".join(f"{k} × {PIEZA_TXT[v][2]}" for v, k in sorted(cuenta.items(), key=lambda t: -t[0]))
              + (f". Los céntimos suman {cc} c" + (f", que son {cc // 100} € y {cc % 100} c" if cc >= 100 else "") if centimos else "")
              + f". Total: {resp}.")]
    adulto = "Se suma el valor de cada moneda o billete. Con céntimos, cada 100 céntimos forman 1 euro."
    return mk(enun, resp, "t4_contar_dinero", {"cuenta": {str(k): v for k, v in cuenta.items()}, "total_c": tot}, dist, pasos, adulto)


@generador("t4_equiv_dinero")
def gen_equiv_dinero(rng, d):
    for _ in range(100):
        if d == 1:
            pieza = rng.choice([50, 20, 10, 100, 200])
            total = rng.choice([100, 200, 500])
        elif d == 2:
            pieza = rng.choice([500, 1000, 200, 50, 20])
            total = rng.choice([1000, 2000, 5000, 200, 500])
        else:
            pieza = rng.choice([5, 10, 20, 50, 500, 1000, 2000])
            total = rng.choice([100, 200, 500, 5000, 1000])
        if pieza < total and total % pieza == 0 and total // pieza <= 50:
            break
    r = total // pieza
    s, p, nom = PIEZA_TXT[pieza]
    tot_txt = (f"{total // 100} euros" if total > 100 else "1 euro") if total >= 100 else f"{total} céntimos"
    enun = f"¿Cuántas {p} de {nom.replace(' c', ' céntimos')} hacen {tot_txt}?" if s == "moneda" else f"¿Cuántos {p} de {nom} hacen {tot_txt}?"
    resp = str(r)
    dist = [(str(total // 10 // pieza) if pieza < 100 and total // 10 % pieza == 0 and total // 10 // pieza > 0 else None, "euro_10c"),
            (str(r * 2), None), (str(r // 2) if r % 2 == 0 and r > 2 else str(r + 2), None), (str(r + 1), None), (str(total // 100) if total >= 100 and total // 100 != r else None, None)]
    pasos = [(f"{total} : {pieza}", str(r), ("1 € = 100 céntimos. " if pieza < 100 else "") + f"Paso todo a céntimos: {total} c : {pieza} c = {r}.")]
    adulto = "1 € = 100 céntimos. Para saber cuántas piezas equivalen a una cantidad se divide la cantidad entre el valor de cada pieza, en la misma unidad."
    return mk(enun, resp, "t4_equiv_dinero", {"pieza": pieza, "total": total}, dist, pasos, adulto, genericos=var_num(r))


@generador("t4_vuelta")
def gen_vuelta(rng, d):
    for _ in range(100):
        precio = rng.randint(100, 1900 if d < 3 else 4900)
        if d == 1:
            precio = precio // 10 * 10
        pagos = [x for x in (500, 1000, 2000, 5000, 10000) if x > precio]
        pago = pagos[0] if d < 3 else rng.choice(pagos[:2])
        if precio % 100:
            break
    r = pago - precio
    enun = f"{rng.choice(NOMBRES)} paga con {pago // 100} € algo que cuesta {eur_c(precio)}. ¿Cuánto le devuelven?"
    resp = eur_c(r)
    e_mal = pago // 100 - precio // 100
    dist = [(f"{e_mal} € y {precio % 100} c", "resta_sin_pedir"), (eur_c(precio), "da_precio"),
            (f"{e_mal} € y {100 - precio % 100} c", "olvida_euro"), (eur_c(r + 100), None), (eur_c(r + 10), None)]
    pasos = [(f"{eur_c(precio)} → {eur_c(precio + (100 - precio % 100))}", f"{100 - precio % 100} c", f"Cuento hacia delante: de {eur_c(precio)} a {eur_c(precio + (100 - precio % 100))} van {100 - precio % 100} c."),
             (f"→ {pago // 100} €", f"{(pago - precio - (100 - precio % 100)) // 100} €", f"De {eur_c(precio + (100 - precio % 100))} a {pago // 100} € van {(pago - precio - (100 - precio % 100)) // 100} €."),
             ("", resp, f"La vuelta es {resp}.")]
    adulto = "La vuelta es lo pagado menos el precio. Contar hacia delante desde el precio (como en las tiendas) evita el error de restar los céntimos sin pedir un euro."
    return mk(enun, resp, "t4_vuelta", {"precio": precio, "pago": pago}, dist, pasos, adulto)


@generador("t4_dinero_decimal")
def gen_dinero_decimal(rng, d):
    tipo = rng.choice(["ec_a_dec", "dec_a_c"] if d == 1 else ["ec_a_dec", "c_a_dec", "dec_a_c"] if d == 2 else ["comparar", "ec_a_dec", "comparar"])
    e = rng.randint(1, 30 if d < 3 else 500)
    c = rng.randint(1, 9) if (tipo == "ec_a_dec" and rng.random() < 0.6) else rng.randint(10, 99)
    cent = e * 100 + c
    if tipo == "ec_a_dec":
        enun = f"¿Cómo se escribe con coma {e} € y {c} céntimos?"
        resp = eur_dec(cent)
        dist = [(f"{e},{c} €" if c < 10 else f"{e},{c // 10} €", "olvida_cero" if c < 10 else None), (f"{e * 100 + c} €", None),
                (f"{e},{c:02d}0 €" if c % 10 else f"{e + 1},{c:02d} €", None), (f"{c},{e:02d} €" if e < 100 else None, None), (f"{e + 1},{c:02d} €", None)]
        pasos = [("", resp, f"Los euros van delante de la coma y los céntimos detrás, siempre con dos cifras: {c} c → {c:02d}. {resp}.")]
    elif tipo == "c_a_dec":
        enun = f"¿Cuántos euros son {cent} céntimos? Escríbelo con coma."
        resp = eur_dec(cent)
        dist = [(f"{fx(D(cent) / 10)} €", None), (f"{cent} €", None), (f"{e},{c % 10 if c % 10 else c // 10} €" if c >= 10 else f"{e},{c} €", None),
                (f"{fx(D(cent) / 1000)} €", None)]
        pasos = [(f"{cent} : 100", resp, f"100 céntimos = 1 €: {cent} c = {e} € y {c} c = {resp}.")]
    elif tipo == "dec_a_c":
        enun = f"¿Cuántos céntimos son {eur_dec(cent)}?"
        resp = f"{fmt(cent)} c"
        dist = [(f"{e + c} c", None), (f"{fmt(cent * 10)} c", None), (f"{fx(D(cent) / 10)} c", None), (f"{fmt(e * 10 + c)} c" if c < 10 else f"{fmt(e * 1000 + c)} c", None)]
        pasos = [(f"{eur_dec(cent)} × 100", str(cent), f"Cada euro son 100 céntimos: {e} € = {e * 100} c, más {c} c = {cent} c.")]
    else:
        e = rng.randint(1, 20)
        cs = rng.sample([5, 50, 15, 45, 9, 90, 25, 8, 80, 55], 4)
        precios = [e * 100 + x for x in cs]
        mayor = max(precios)
        enun = "¿Cuál es el precio más caro: " + ", ".join(eur_dec(p) for p in precios) + "?"
        resp = eur_dec(mayor)
        por_cifras = max(precios, key=lambda p: int(str(p % 100).rstrip("0") or 0) if p % 100 >= 10 else p % 100 * 1)
        dist = [(eur_dec(por_cifras) if por_cifras != mayor else None, "compara_cifras")] + [(eur_dec(p), None) for p in sorted(precios)]
        pasos = [("comparar céntimos", resp, f"Los euros son iguales ({e} €); comparo los céntimos con dos cifras: " + ", ".join(f"{p % 100:02d}" for p in precios) + f". El mayor es {resp}.")]
    adulto = "Los céntimos ocupan siempre dos cifras tras la coma: 7 € y 5 c = 7,05 € (no 7,5 €, que son 7 € y 50 c)."
    return mk(enun, resp, "t4_dinero_decimal", {"tipo": tipo, "cent": cent}, dist, pasos, adulto)


@generador("t4_precio_unidad")
def gen_precio_unidad(rng, d):
    tipo = rng.choice(["por_n", "entre_n"] if d < 3 else ["oferta", "oferta", "entre_n"])
    prod = rng.choice([("cuaderno", "cuadernos", "Un", "uno"), ("yogur", "yogures", "Un", "uno"), ("bolígrafo", "bolígrafos", "Un", "uno"),
                       ("lata de atún", "latas de atún", "Una", "una"), ("zumo", "zumos", "Un", "uno")])
    n = rng.randint(2, 9 if d > 1 else 5)
    pu = rng.randint(15, 299 if d > 1 else 150)
    if d == 1:
        pu = pu // 5 * 5
    tot = pu * n
    if tipo == "por_n":
        enun = f"{prod[2]} {prod[0]} cuesta {eur_dec(pu)}. ¿Cuánto cuestan {n} {prod[1]}?"
        resp = eur_dec(tot)
        dist = [(f"{fx(D(tot) / 10)} €", "coma_mal"), (f"{fx(D(tot) / 1000)} €", "coma_mal"), (eur_dec(pu + n * 100 if pu > 100 else pu + n), None),
                (eur_dec(tot + pu), None), (eur_dec(tot - pu), None)]
        pasos = [(f"{eur_dec(pu)} × {n}", resp, f"Multiplico el precio de uno por {n}: {fx(D(pu) / 100)} × {n} = {fx(D(tot) / 100)}. Pongo dos cifras de céntimos: {resp}.")]
    elif tipo == "entre_n":
        enun = f"{n} {prod[1]} cuestan {eur_dec(tot)} en total. ¿Cuánto cuesta cada {prod[3]}?"
        resp = eur_dec(pu)
        dist = [(f"{fx(D(pu) / 10)} €", "coma_mal"), (f"{fx(D(pu) * 10 / 100)} €", "coma_mal"), (eur_dec(tot - n), None), (eur_dec(pu + 10), None), (eur_dec(pu - 5) if pu > 5 else None, None)]
        pasos = [(f"{eur_dec(tot)} : {n}", resp, f"Reparto el total entre {n}: {fx(D(tot) / 100)} : {n} = {fx(D(pu) / 100)} €, es decir, {resp}.")]
    else:
        n = rng.choice([4, 6, 8, 10, 12])
        pu_pack = rng.randint(20, 90)
        suelto = pu_pack + rng.choice([-6, -4, -3, 3, 4, 6, 8])
        tot = pu_pack * n
        enun = f"Un pack de {n} {prod[1]} cuesta {eur_dec(tot)} y {prod[2].lower()} {prod[0]} {'suelta' if prod[3] == 'una' else 'suelto'} cuesta {eur_dec(suelto)}. ¿Qué sale más barato por unidad?"
        barato_pack = pu_pack < suelto
        resp = f"El pack ({eur_dec(pu_pack)} cada uno)" if barato_pack else f"El suelto ({eur_dec(suelto)} frente a {eur_dec(pu_pack)} en el pack)"
        dist = [(f"El suelto ({eur_dec(suelto)} es menos que {eur_dec(tot)})" if barato_pack else None, "compara_total"),
                (f"El suelto ({eur_dec(suelto)} frente a {eur_dec(pu_pack)} en el pack)" if barato_pack else f"El pack ({eur_dec(pu_pack)} cada uno)", None),
                ("Cuestan lo mismo por unidad", None), (f"El pack ({fx(D(pu_pack) / 10)} € cada uno)", "coma_mal")]
        pasos = [(f"{eur_dec(tot)} : {n}", eur_dec(pu_pack), f"Precio por unidad del pack: {eur_dec(tot)} : {n} = {eur_dec(pu_pack)}."),
                 ("comparar", resp, f"Comparo precios por unidad: {eur_dec(pu_pack)} (pack) y {eur_dec(suelto)} (suelto). Sale más barato {resp[0].lower() + resp[1:]}.")]
    adulto = "Para comparar ofertas hay que calcular el precio por unidad; comparar el precio total del pack con el de una unidad suelta es el error típico."
    return mk(enun, resp, "t4_precio_unidad", {"tipo": tipo, "n": n}, dist, pasos, adulto, genericos=var_num(D(pu) / 100, "€", pasos=(D("0.1"), D("-0.1"), 1)) if tipo != "oferta" else [])


# ---------------------------------------------------------------- el grado: recto, llano, completo

@generador("t4_grados_ref")
def gen_grados_ref(rng, d):
    casos1 = [("¿Cuántos grados mide un ángulo recto?", 90, "recto"), ("¿Cuántos grados mide un ángulo llano?", 180, "llano"),
              ("¿Cuántos grados mide un ángulo completo?", 360, "completo")]
    casos2 = [("¿Cuántos grados son dos ángulos rectos?", 180, "x2"), ("¿Cuántos grados son tres ángulos rectos?", 270, "x3"),
              ("¿Cuántos grados mide la mitad de un ángulo recto?", 45, "mitad_recto"), ("¿Cuántos grados mide la mitad de un ángulo llano?", 90, "mitad_llano"),
              ("¿Cuántos grados mide la mitad de un ángulo completo?", 180, "mitad_completo")]
    casos3 = [("¿Cuántos ángulos rectos caben en un ángulo completo?", 4, "rectos_completo"), ("¿Cuántos ángulos rectos caben en un ángulo llano?", 2, "rectos_llano"),
              ("¿Cuántos grados mide la cuarta parte de un ángulo completo?", 90, "cuarto_completo"), ("¿Cuántos grados mide la mitad de un ángulo recto?", 45, "mitad_recto"),
              ("¿Cuántos grados son tres ángulos rectos?", 270, "x3"), ("¿Cuántos grados le faltan a un ángulo llano para ser completo?", 180, "falta")]
    enun, r, clave = rng.choice({1: casos1, 2: casos2, 3: casos3}[d])
    g = "°" if clave not in ("rectos_completo", "rectos_llano") else ""
    resp = f"{r}{g}"
    recto_100 = {"recto": 100, "x2": 200, "x3": 300, "mitad_recto": 50, "rectos_completo": None, "rectos_llano": None, "cuarto_completo": None,
                 "mitad_llano": 90, "mitad_completo": 180, "llano": 200, "completo": 400, "falta": None}
    swap = {"llano": 360, "completo": 180, "mitad_llano": 180, "mitad_completo": 90, "rectos_llano": 4, "rectos_completo": 2, "cuarto_completo": 45, "falta": 360}
    dist = [(f"{swap[clave]}{g}" if clave in swap else None, "llano_completo"),
            (f"{recto_100[clave]}{g}" if recto_100.get(clave) and recto_100[clave] != r else None, "recto_100")]
    otros = [x for x in ([45, 90, 180, 270, 360] if g else [1, 2, 3, 4, 6]) if x != r]
    rng.shuffle(otros)
    dist += [(f"{x}{g}", None) for x in otros]
    pasos = [("referencias", resp, "Recto = 90°, llano = 180° (dos rectos), completo = 360° (cuatro rectos). " + f"Por tanto, la respuesta es {resp}.")]
    adulto = "Referencias: recto 90°, llano 180°, completo 360°. Los grados no van de 100 en 100."
    return mk(enun, resp, "t4_grados_ref", {"clave": clave}, dist, pasos, adulto)


# ---------------------------------------------------------------- orientación y cuadrículas

def _desc_mov(x, y):
    partes = []
    if x:
        partes.append(f"{abs(x)} a la {'derecha' if x > 0 else 'izquierda'}")
    if y:
        partes.append(f"{abs(y)} {'arriba' if y > 0 else 'abajo'}")
    if not partes:
        return "en la misma casilla de salida"
    return " y ".join(partes)


@generador("t4_recorrido")
def gen_recorrido(rng, d, movimientos_max=4):
    nm = {1: 2, 2: 3, 3: movimientos_max}[d]
    DIRS = {"derecha": (1, 0), "izquierda": (-1, 0), "arriba": (0, 1), "abajo": (0, -1)}
    for _ in range(100):
        movs = []
        for i in range(nm):
            dr = rng.choice([k for k in DIRS if not movs or k != movs[-1][0]])
            movs.append((dr, rng.randint(1, 5)))
        x = sum(DIRS[dr][0] * k for dr, k in movs)
        y = sum(DIRS[dr][1] * k for dr, k in movs)
        if (x, y) != (0, 0):
            break
    txt = ", ".join(f"{k} {'a la ' + dr if dr in ('derecha', 'izquierda') else dr}" for dr, k in movs)
    enun = f"Sales de una casilla de la cuadrícula y te mueves: {txt}. ¿Dónde acabas respecto a la casilla de salida?"
    resp = _desc_mov(x, y)
    xs = sum(DIRS[dr][0] * (k - 1) for dr, k in movs)
    ys = sum(DIRS[dr][1] * (k - 1) for dr, k in movs)
    vert = [i for i, (dr, k) in enumerate(movs) if dr in ("arriba", "abajo")]
    if vert:
        i = vert[0]
        dr, k = movs[i]
        xc = x + (k if dr == "arriba" else -k)
        yc = y - DIRS[dr][1] * k
    else:
        xc, yc = y, x
    dist = [(_desc_mov(xs, ys), "cuenta_salida"), (_desc_mov(xc, yc), "confunde_ejes"), (_desc_mov(-x, y), None), (_desc_mov(x, -y), None), (_desc_mov(y, x), None)]
    pasos = [("horizontal", str(x), "Sumo los pasos a la derecha y resto los de la izquierda: " + (f"{abs(x)} a la {'derecha' if x > 0 else 'izquierda'}." if x else "quedo en la misma columna.")),
             ("vertical", str(y), "Sumo los pasos hacia arriba y resto los de abajo: " + (f"{abs(y)} {'arriba' if y > 0 else 'abajo'}." if y else "quedo en la misma fila.")),
             ("", resp, f"Acabo {resp}.")]
    adulto = "Cada paso lleva a la casilla vecina: la casilla de salida no cuenta como paso. Conviene separar los movimientos horizontales de los verticales."
    return mk(enun, resp, "t4_recorrido", {"movs": movs}, dist, pasos, adulto)


LETRAS = "ABCDEFGHIJ"


@generador("t4_casillas")
def gen_casillas(rng, d):
    for _ in range(100):
        c, f = rng.randrange(10), rng.randint(1, 10)
        dx, dy = rng.randint(-4, 4), rng.randint(-4, 4)
        if d == 1:
            dx, dy = (rng.choice([-1, 1]) * rng.randint(1, 3), 0) if rng.random() < 0.5 else (0, rng.choice([-1, 1]) * rng.randint(1, 3))
        if dx == 0 and dy == 0 or not (0 <= c + dx < 10 and 1 <= f + dy <= 10) or (d > 1 and (dx == 0 or dy == 0)):
            continue
        if d > 1 and not (0 <= c - dx < 10 and 1 <= f - dy <= 10):
            continue
        break
    ini = f"{LETRAS[c]}{f}"
    fin = f"{LETRAS[c + dx]}{f + dy}"
    mv = []
    if dy:
        mv.append(f"{'subes' if dy > 0 else 'bajas'} {abs(dy)}")
    if dx:
        mv.append(f"vas {abs(dx)} a la {'derecha' if dx > 0 else 'izquierda'}")
    if d == 3 and rng.random() < 0.5:
        enun = f"¿Qué movimiento lleva de la casilla {ini} a la casilla {fin}?"
        resp = _desc_mov(dx, dy)
        dist = [(_desc_mov(-dx, dy), "letras_al_reves"), (_desc_mov(dy, dx), "invierte"), (_desc_mov(dx, -dy), None), (_desc_mov(-dx, -dy), None)]
    else:
        enun = f"Estás en la casilla {ini}, {' y '.join(mv)}. ¿En qué casilla acabas?"
        resp = fin
        cands = []
        if 0 <= c - dx < 10 and dx:
            cands.append((f"{LETRAS[c - dx]}{f + dy}", "letras_al_reves"))
        if 1 <= f + dy <= 10 and f + dy - 1 < 10 and 1 <= c + dx + 1 <= 10:
            cands.append((f"{LETRAS[f + dy - 1]}{c + dx + 1}", "invierte"))
        if 1 <= f - dy <= 10 and dy:
            cands.append((f"{LETRAS[c + dx]}{f - dy}", None))
        for ex, ey in ((1, 0), (0, 1), (-1, 0), (0, -1)):
            if 0 <= c + dx + ex < 10 and 1 <= f + dy + ey <= 10:
                cands.append((f"{LETRAS[c + dx + ex]}{f + dy + ey}", None))
        dist = cands
    pasos = [("columna", LETRAS[c + dx], f"La letra indica la columna: de {LETRAS[c]} " + (f"me muevo {abs(dx)} {'hacia la derecha (letras siguientes)' if dx > 0 else 'hacia la izquierda (letras anteriores)'} y llego a {LETRAS[c + dx]}." if dx else "no me muevo de columna.")),
             ("fila", str(f + dy), f"El número indica la fila: de {f} " + (f"{'subo' if dy > 0 else 'bajo'} {abs(dy)} y llego a {f + dy}." if dy else "no cambio de fila.")),
             ("", resp, f"Respuesta: {resp}.")]
    adulto = "En la cuadrícula primero se nombra la columna (letra) y luego la fila (número). A la derecha las letras avanzan (A, B, C…) y hacia arriba los números crecen."
    return mk(enun, resp, "t4_casillas", {"ini": ini, "dx": dx, "dy": dy}, dist, pasos, adulto)


ROSA = ["norte", "noreste", "este", "sureste", "sur", "suroeste", "oeste", "noroeste"]
GIRO = {"a tu derecha": 2, "a tu izquierda": -2, "media vuelta": 4}


def _eo(x):
    return {"este": "oeste", "oeste": "este", "noreste": "noroeste", "noroeste": "noreste", "sureste": "suroeste", "suroeste": "sureste"}.get(x, x)


@generador("t4_cardinales")
def gen_cardinales(rng, d):
    inicial = rng.choice([0, 2, 4, 6] if d < 3 else list(range(8)))
    ng = 1 if d == 1 else 2
    giros = [rng.choice(list(GIRO)) for _ in range(ng)]
    pos = inicial
    contra = inicial
    for g in giros:
        pos = (pos + GIRO[g]) % 8
        contra = (contra - GIRO[g]) % 8
    if d == 1 and rng.random() < 0.4:
        lado = rng.choice(["derecha", "izquierda"])
        enun = f"Si miras hacia el {ROSA[inicial]}, ¿qué punto cardinal tienes a tu {lado}?"
        pos = (inicial + (2 if lado == "derecha" else -2)) % 8
        contra = (inicial - (2 if lado == "derecha" else -2)) % 8
    else:
        enun = f"Miras hacia el {ROSA[inicial]} y giras " + " y luego ".join(("" if g == "media vuelta" else "") + g.replace("a tu", "a tu") for g in giros) + ". ¿Hacia dónde miras ahora?"
        enun = enun.replace("giras media vuelta", "das media vuelta").replace("luego media vuelta", "luego das media vuelta")
    resp = ROSA[pos]
    dist = [(_eo(resp) if _eo(resp) != resp else None, "este_oeste"), (ROSA[contra] if contra != pos else None, "gira_contrario"),
            (ROSA[(pos + 4) % 8], None), (ROSA[(pos + 2) % 8], None), (ROSA[(pos - 2) % 8], None), (ROSA[inicial] if inicial != pos else None, None)]
    pasos = [("rosa de los vientos", resp, "En el sentido de las agujas del reloj van: norte, este, sur y oeste (con noreste, sureste, suroeste y noroeste entre ellos). "
              "Girar a la derecha es avanzar un cuarto de vuelta en ese sentido; a la izquierda, al revés; media vuelta, al punto opuesto. "
              f"Termino mirando al {resp}.")]
    adulto = "Mirando al norte, el este queda a la derecha y el oeste a la izquierda. Dibujar la rosa de los vientos y girar sobre ella evita confundir este y oeste."
    return mk(enun, resp, "t4_cardinales", {"inicial": inicial, "giros": giros}, dist, pasos, adulto)


# ---------------------------------------------------------------- ángulos

@generador("t4_clasif_angulo")
def gen_clasif_angulo(rng, d):
    if d == 1:
        a = rng.choice([rng.randint(10, 80), rng.randint(100, 170), 90, 180])
    elif d == 2:
        a = rng.choice([89, 91, 179, rng.randint(81, 89), rng.randint(91, 99), rng.randint(171, 179), 90, 180])
    else:
        a = rng.choice([rng.randint(181, 359), 360, 0, rng.randint(181, 270), 179, 1])
    tipo = ("nulo" if a == 0 else "agudo" if a < 90 else "recto" if a == 90 else "obtuso" if a < 180 else "llano" if a == 180
            else "cóncavo" if a < 360 else "completo")
    enun = f"¿Cómo se llama un ángulo que mide {a}°?"
    resp = tipo
    swap = {"agudo": "obtuso", "obtuso": "agudo"}
    lim = {"recto": "agudo", "llano": "obtuso", "obtuso": "llano" if a > 170 else "recto", "agudo": "recto", "cóncavo": "llano" if a < 200 else "completo",
           "completo": "llano", "nulo": "agudo"}
    dist = [(swap.get(tipo), "agudo_obtuso"), (lim.get(tipo), "limites"), ("obtuso" if tipo in ("recto", "llano") else None, "limites")]
    otros = [x for x in ("agudo", "recto", "obtuso", "llano", "cóncavo") if x != tipo]
    rng.shuffle(otros)
    dist += [(x, None) for x in otros]
    pasos = [("comparar con 90° y 180°", resp, "Agudo: menos de 90°. Recto: 90°. Obtuso: entre 90° y 180°. Llano: 180°. Cóncavo: más de 180°. Completo: 360°. "
              f"Como mide {a}°, es {resp}.")]
    adulto = "Las referencias son el recto (90°) y el llano (180°); los ángulos justo en esos valores son recto y llano, no agudo ni obtuso."
    return mk(enun, resp, "t4_clasif_angulo", {"a": a}, dist, pasos, adulto)


@generador("t4_comp_sup")
def gen_comp_sup(rng, d):
    tipo = rng.choice(["complementario", "suplementario"])
    ref = 90 if tipo == "complementario" else 180
    a = rng.randint(5, ref - 5) if d > 1 else rng.choice(range(10, ref, 10))
    r = ref - a
    otro = 180 if ref == 90 else 90
    if d == 3 and rng.random() < 0.5:
        rel = "adyacentes" if ref == 180 else "complementarios"
        enun = f"Dos ángulos son {rel} y uno de ellos mide {a}°. ¿Cuánto mide el otro?"
    else:
        enun = f"¿Cuánto mide el {tipo} de un ángulo de {a}°?"
    resp = f"{r}°"
    dist = [(f"{otro - a}°" if otro - a > 0 else None, "confunde"), (f"{ref + a}°", "suma"), (f"{r + 10}°", None), (f"{r - 10}°" if r > 10 else None, None), (f"{a}°", None)]
    pasos = [(f"{ref} − {a}", str(r), f"{'Complementarios: suman 90°' if ref == 90 else 'Suplementarios (o adyacentes): suman 180°'}. {ref}° − {a}° = {r}°.")]
    adulto = "Complementarios suman 90° (un recto); suplementarios suman 180° (un llano). Se calcula restando, no sumando."
    return mk(enun, resp, "t4_comp_sup", {"a": a, "ref": ref}, dist, pasos, adulto)


@generador("t4_opuestos")
def gen_opuestos(rng, d):
    a = rng.randint(20, 160)
    while a == 90:
        a = rng.randint(20, 160)
    b = 180 - a
    tipo = rng.choice(["opuesto", "contiguo"]) if d == 1 else "tres" if d == 3 else rng.choice(["contiguo", "tres"])
    if tipo == "opuesto":
        enun = f"Dos rectas se cortan y uno de los ángulos que forman mide {a}°. ¿Cuánto mide su ángulo opuesto por el vértice?"
        resp = f"{a}°"
        dist = [(f"{b}°", None), (f"{90 - a}°" if a < 90 else f"{a - 90}°", "complementario"), (f"{360 - a}°", None), (f"{a * 2}°" if a * 2 < 360 else None, None)]
    elif tipo == "contiguo":
        enun = f"Dos rectas se cortan y uno de los ángulos que forman mide {a}°. ¿Cuánto mide cada uno de los ángulos contiguos a él?"
        resp = f"{b}°"
        dist = [(f"{a}°", "todos_iguales"), (f"{90 - a}°" if a < 90 else None, "complementario"), (f"{360 - a}°", None), (f"{b + 10}°", None), (f"{b - 10}°", None)]
    else:
        enun = f"Dos rectas se cortan y uno de los cuatro ángulos mide {a}°. ¿Cuánto miden los otros tres, en orden alrededor del vértice?"
        resp = f"{b}°, {a}° y {b}°"
        dist = [(f"{a}°, {a}° y {a}°", "todos_iguales"), (f"{abs(90 - a)}°, {a}° y {abs(90 - a)}°", "complementario"), (f"{a}°, {b}° y {a}°", None),
                (f"{b}°, {b}° y {b}°", None)]
    pasos = [("opuestos", f"{a}°", f"Los ángulos opuestos por el vértice son iguales: el opuesto al de {a}° también mide {a}°."),
             ("contiguos", f"{b}°", f"Dos ángulos contiguos forman un llano, así que suman 180°: 180° − {a}° = {b}°."),
             ("", resp, f"Respuesta: {resp}.")]
    adulto = "Dos rectas secantes forman dos parejas de ángulos iguales (opuestos por el vértice); cada par de contiguos suma 180°."
    return mk(enun, resp, "t4_opuestos", {"a": a, "tipo": tipo}, dist, pasos, adulto)


@generador("t4_inscrito")
def gen_inscrito(rng, d):
    tipo = rng.choice(["central_a_inscrito", "inscrito_a_central"] + (["semicircunferencia"] if d == 3 else []))
    if tipo == "central_a_inscrito":
        c = rng.randint(20, 170) * 2 if d > 1 else rng.choice(range(40, 360, 20))
        c = min(c, 340)
        r = c // 2
        enun = f"Un ángulo inscrito en una circunferencia abarca el mismo arco que un ángulo central de {c}°. ¿Cuánto mide el inscrito?"
        dist = [(f"{c * 2}°" if c * 2 <= 720 else None, "duplica"), (f"{c}°", "iguala"), (f"{180 - r}°" if 180 - r > 0 and 180 - r != r else None, None), (f"{r + 10}°", None)]
        pasos = [(f"{c} : 2", str(r), f"El inscrito mide la mitad del central que abarca el mismo arco: {c}° : 2 = {r}°.")]
    elif tipo == "inscrito_a_central":
        i = rng.randint(15, 85) if d > 1 else rng.choice(range(20, 90, 10))
        r = 2 * i
        enun = f"Un ángulo inscrito mide {i}°. ¿Cuánto mide el ángulo central que abarca el mismo arco?"
        dist = [(f"{fx(D(i) / 2)}°", "duplica"), (f"{i}°", "iguala"), (f"{180 - i}°", None), (f"{r + 10}°", None)]
        pasos = [(f"{i} × 2", str(r), f"El central mide el doble del inscrito que abarca el mismo arco: {i}° × 2 = {r}°.")]
    else:
        enun = "Un triángulo tiene un lado que es un diámetro de la circunferencia y el vértice opuesto sobre la circunferencia. ¿Cuánto mide el ángulo de ese vértice?"
        r = 90
        dist = [("180°", "iguala"), ("360°", "duplica"), ("45°", None), ("60°", None)]
        pasos = [("180 : 2", "90", "Ese ángulo es inscrito y abarca media circunferencia (central de 180°): mide 180° : 2 = 90°.")]
    resp = f"{r}°"
    adulto = "Ángulo inscrito = mitad del central que abarca el mismo arco. Un inscrito que abarca una semicircunferencia es recto."
    return mk(enun, resp, "t4_inscrito", {"tipo": tipo}, dist, pasos, adulto)


# ---------------------------------------------------------------- polígonos

NOMBRES_POL = {3: "triángulo", 4: "cuadrilátero", 5: "pentágono", 6: "hexágono", 7: "heptágono", 8: "octógono", 9: "eneágono",
               10: "decágono", 11: "endecágono", 12: "dodecágono"}
ADJ = {3: "triangular", 4: "cuadrangular", 5: "pentagonal", 6: "hexagonal", 7: "heptagonal", 8: "octogonal", 9: "eneagonal", 10: "decagonal"}


@generador("t4_nombres_pol")
def gen_nombres_pol(rng, d):
    pool = {1: [3, 4, 5, 6], 2: [5, 6, 7, 8, 10], 3: [7, 8, 9, 10, 11, 12]}[d]
    n = rng.choice(pool)
    if rng.random() < 0.5:
        enun = f"¿Cuántos lados tiene un {NOMBRES_POL[n]}?"
        resp = f"{n} lados"
        dist = [(f"{n + 1} lados", "hex_hept" if n in (6, 7) else None), (f"{n - 1} lados", "hex_hept" if n in (7, 8) else None),
                ("6 lados" if n == 5 else "8 lados" if n == 6 else None, "penta" if n == 5 else "hex_hept"), (f"{n + 2} lados", None)]
    else:
        enun = f"¿Cómo se llama un polígono de {n} lados?"
        resp = NOMBRES_POL[n]
        dist = [(NOMBRES_POL.get(n + 1), "hex_hept" if n in (6, 7) else None), (NOMBRES_POL.get(n - 1), "hex_hept" if n in (7, 8) else "penta" if n == 6 else None),
                ("hexágono" if n == 5 else None, "penta"), (NOMBRES_POL.get(n + 2), None), (NOMBRES_POL.get(n - 2), None)]
    pasos = [("prefijo", resp, f"El prefijo griego indica el número de lados: tri-3, cuadri-4, penta-5, hexa-6, hepta-7, octo-8, enea-9, deca-10, endeca-11, dodeca-12. Un {NOMBRES_POL[n]} tiene {n} lados.")]
    adulto = "Los nombres vienen de los números griegos: penta = 5, hexa = 6, hepta = 7, octo = 8. Relacionarlos con palabras conocidas (pentagrama, hexágono de la colmena, octópodo) ayuda."
    return mk(enun, resp, "t4_nombres_pol", {"n": n}, dist, pasos, adulto)


@generador("t4_angulos_pol")
def gen_angulos_pol(rng, d):
    tipo = rng.choice(["suma"] if d == 1 else ["suma", "interior"] if d == 2 else ["interior", "central", "interior"])
    if tipo == "suma":
        n = rng.randint(4, 12 if d == 1 else 20)
        r = 180 * (n - 2)
        nom = NOMBRES_POL.get(n, f"polígono de {n} lados")
        enun = f"¿Cuánto suman los ángulos interiores de un {nom}?"
        dist = [(f"{fmt(180 * n)}°", "180n"), (f"{fmt(360 * (n - 2))}°", None), (f"{fmt(180 * (n - 1))}°", None), (f"{fmt(r // n)}°" if r % n == 0 else None, None)]
        pasos = [(f"180 · ({n} − 2)", fmt(r), f"Desde un vértice se divide en {n} − 2 = {n - 2} triángulos, cada uno de 180°: 180 · {n - 2} = {fmt(r)}°.")]
    else:
        n = rng.choice([5, 6, 8, 9, 10, 12] if d == 2 else [5, 6, 8, 9, 10, 12, 15, 18, 20])
        suma = 180 * (n - 2)
        ai = suma // n
        ac = 360 // n
        nom = (NOMBRES_POL[n] + " regular") if n in NOMBRES_POL else f"polígono regular de {n} lados"
        if tipo == "interior":
            enun = f"¿Cuánto mide cada ángulo interior de un {nom}?"
            r = ai
            dist = [(f"{fmt(suma)}°", "suma_en_vez"), (f"{ac}°", "central"), (f"{fmt(180 * n)}°", "180n"), (f"{ai + 10}°", None), (f"{ai - 10}°", None)]
            pasos = [(f"180 · ({n} − 2)", fmt(suma), f"Suma de los ángulos interiores: 180° · ({n} − 2) = {fmt(suma)}°."),
                     (f"{fmt(suma)} : {n}", str(ai), f"Como es regular, los {n} ángulos son iguales: {fmt(suma)}° : {n} = {ai}°.")]
        else:
            enun = f"¿Cuánto mide el ángulo central de un {nom}?"
            r = ac
            dist = [(f"{ai}°", "central"), (f"{fmt(suma)}°", None), (f"{fx(D(180) / n)}°", None), (f"{ac * 2}°", None)]
            pasos = [(f"360 : {n}", str(ac), f"Los {n} ángulos centrales completan una vuelta: 360° : {n} = {ac}°.")]
    resp = f"{fmt(r)}°"
    adulto = "Suma de interiores = 180° · (n − 2). En un polígono regular, cada interior = suma : n y cada central = 360° : n (interior + central = 180°)."
    return mk(enun, resp, "t4_angulos_pol", {"tipo": tipo}, dist, pasos, adulto, genericos=var_num(r, "°", pasos=(10, -10, 20)))


@generador("t4_diagonales")
def gen_diagonales(rng, d):
    if d == 3 and rng.random() < 0.5:
        n = rng.randint(5, 12)
        D_ = n * (n - 3) // 2
        enun = f"Un polígono tiene {D_} diagonales en total. ¿Cuántos lados tiene?"
        resp = f"{n} lados"
        dist = [(f"{n + 1} lados", None), (f"{n - 1} lados", None), (f"{n + 3} lados", None), (f"{D_ // 2} lados" if D_ // 2 not in (n, n + 1, n - 1) else None, None)]
        pasos = [("probar", resp, f"Busco n con n · (n − 3) : 2 = {D_}: con n = {n}, {n} · {n - 3} : 2 = {D_}.")]
    else:
        n = rng.randint(4, 8 if d == 1 else 20)
        r = n * (n - 3) // 2
        nom = NOMBRES_POL.get(n, f"polígono de {n} lados")
        enun = f"¿Cuántas diagonales tiene un {nom}?"
        resp = str(r)
        dist = [(str(n * (n - 3)), "no_divide"), (str(n * (n - 2) // 2), "n_menos_2"), (str(n * (n - 1) // 2), "n_menos_2"), (str(n - 3), None), (str(r + n), None)]
        pasos = [(f"{n} · ({n} − 3)", str(n * (n - 3)), f"Desde cada vértice salen {n} − 3 = {n - 3} diagonales (no a sí mismo ni a sus dos vecinos): {n} · {n - 3} = {n * (n - 3)}."),
                 (f"{n * (n - 3)} : 2", str(r), f"Cada diagonal se ha contado dos veces (una desde cada extremo): {n * (n - 3)} : 2 = {r}.")]
    adulto = "Diagonales = n · (n − 3) / 2: de cada vértice salen n − 3 y cada una se cuenta dos veces."
    return mk(enun, resp, "t4_diagonales", {}, dist, pasos, adulto)


# ---------------------------------------------------------------- triángulos

@generador("t4_tri_lados")
def gen_tri_lados(rng, d):
    tipo = rng.choice(["equilátero", "isósceles", "escaleno"])
    a = rng.randint(3, 15)
    if tipo == "equilátero":
        ls = [a, a, a]
    elif tipo == "isósceles":
        b = rng.randint(max(1, a // 2), 2 * a - 1)
        while b == a:
            b = rng.randint(max(1, a // 2), 2 * a - 1)
        ls = [a, a, b]
        if d == 3:
            ls = [D(a), D(a), D(a) + D("0.1") * rng.choice([1, -1, 2])]
    else:
        ls = sorted(rng.sample(range(3, 20), 3))
        while ls[2] >= ls[0] + ls[1]:
            ls = sorted(rng.sample(range(3, 20), 3))
        if d == 3:
            ls = [D(a), D(a) + D("0.2"), D(a) + D("0.5")]
    rng.shuffle(ls)
    enun = f"Un triángulo tiene lados de {fx(ls[0])} cm, {fx(ls[1])} cm y {fx(ls[2])} cm. ¿Cómo es según sus lados?"
    resp = tipo
    casi = d == 3 and tipo != "equilátero"
    dist = [({"isósceles": "escaleno", "escaleno": "isósceles", "equilátero": None}[tipo], "iso_esc"), ("equilátero" if casi else None, "a_ojo"),
            ("rectángulo", None), ("equilátero" if tipo != "equilátero" else "isósceles", None), ("escaleno" if tipo == "equilátero" else None, None)]
    iguales = 3 if tipo == "equilátero" else 2 if tipo == "isósceles" else 0
    pasos = [("comparar lados", resp, f"Comparo las medidas exactas: {'los tres lados son iguales' if iguales == 3 else 'exactamente dos lados son iguales' if iguales == 2 else 'no hay dos lados iguales'}. Es {resp}.")]
    adulto = "Equilátero: 3 lados iguales; isósceles: exactamente 2; escaleno: ninguno. Hay que mirar las medidas, no la apariencia (7 y 7,1 no son iguales)."
    return mk(enun, resp, "t4_tri_lados", {"lados": [str(x) for x in ls]}, dist, pasos, adulto)


@generador("t4_tri_angulos")
def gen_tri_angulos(rng, d):
    tipo = rng.choice(["acutángulo", "rectángulo", "obtusángulo"])
    for _ in range(200):
        if tipo == "rectángulo":
            a = rng.randint(15, 75)
            angs = [90, a, 90 - a]
        elif tipo == "obtusángulo":
            o = rng.randint(95, 150)
            a = rng.randint(5, 180 - o - 5)
            angs = [o, a, 180 - o - a]
        else:
            a, b = rng.randint(35, 85), rng.randint(35, 85)
            angs = [a, b, 180 - a - b]
        if d == 3 and rng.random() < 0.5:
            # isósceles
            if tipo == "rectángulo":
                angs = [90, 45, 45]
            elif tipo == "obtusángulo":
                o = rng.choice(range(100, 160, 2))
                angs = [o, (180 - o) // 2, (180 - o) // 2]
            else:
                b = rng.choice([x for x in range(46, 89, 2) if x != 60])
                angs = [180 - 2 * b, b, b]
        if all(0 < x < 180 for x in angs) and (tipo != "acutángulo" or max(angs) < 90):
            break
    rng.shuffle(angs)
    lados = "equilátero" if len(set(angs)) == 1 else "isósceles" if len(set(angs)) == 2 else "escaleno"
    txt = f"{angs[0]}°, {angs[1]}° y {angs[2]}°"
    if d == 3:
        enun = f"Los ángulos de un triángulo miden {txt}. ¿Cómo es según sus ángulos y según sus lados?"
        resp = f"{tipo} {lados}"
        otros_t = [t for t in ("acutángulo", "rectángulo", "obtusángulo") if t != tipo]
        otro_l = "escaleno" if lados != "escaleno" else "isósceles"
        dist = [("acutángulo " + lados if tipo == "obtusángulo" else None, "por_menor"), (f"{tipo} {otro_l}", None),
                (f"{otros_t[0]} {lados}", None), (f"{otros_t[1]} {lados}", None), (f"{otros_t[0]} {otro_l}", None)]
    else:
        enun = f"Los ángulos de un triángulo miden {txt}. ¿Cómo es según sus ángulos?"
        resp = tipo
        dist = [("acutángulo" if tipo == "obtusángulo" else None, "por_menor"), (lados if lados != "escaleno" else "isósceles", "mezcla_criterios")] + \
               [(t, None) for t in ("acutángulo", "rectángulo", "obtusángulo") if t != tipo]
    pasos = [("mayor ángulo", f"{max(angs)}°", f"Miro el ángulo mayor: {max(angs)}°. " + ("Es recto, así que es rectángulo." if tipo == "rectángulo" else
                                                                                     "Es obtuso, así que es obtusángulo." if tipo == "obtusángulo" else "Es agudo, así que los tres son agudos: acutángulo.")
              + (f" Además tiene {'tres ángulos iguales' if lados == 'equilátero' else 'dos ángulos iguales (y por tanto dos lados iguales)' if lados == 'isósceles' else 'los tres ángulos distintos'}: {lados}." if d == 3 else ""))]
    adulto = "Basta mirar el ángulo mayor: si es recto, rectángulo; si es obtuso, obtusángulo; si es agudo, acutángulo. La clasificación por lados es otro criterio distinto."
    return mk(enun, resp, "t4_tri_angulos", {"angulos": angs}, dist, pasos, adulto)


@generador("t4_tercer_angulo")
def gen_tercer_angulo(rng, d):
    if d == 3 and rng.random() < 0.5:
        a, b = rng.randint(30, 90), rng.randint(30, 80)
        c = rng.choice([180 - a - b, 180 - a - b + rng.choice([-10, 10, 20])])
        if c <= 0:
            c = 180 - a - b + 20
        s = a + b + c
        enun = f"¿Pueden ser {a}°, {b}° y {c}° los tres ángulos de un triángulo?"
        ok = s == 180
        resp = f"Sí, porque suman 180°" if ok else f"No, porque suman {s}° y no 180°"
        dist = [("No, porque tendrían que sumar 360°" if ok else "Sí, porque suman menos de 360°", "usa_360"), ("No, porque ninguno es recto" if ok else f"Sí, porque suman {s}°", None),
                ("Sí, porque todos son menores de 180°", None), ("No, porque no hay ningún ángulo recto", None)]
        pasos = [(f"{a} + {b} + {c}", str(s), f"Sumo: {a}° + {b}° + {c}° = {s}°. Los ángulos de un triángulo tienen que sumar exactamente 180°.")]
        return mk(enun, resp, "t4_tercer_angulo", {"a": a, "b": b, "c": c}, dist, pasos,
                  "Los tres ángulos de cualquier triángulo suman 180°. Si no suman 180°, no forman un triángulo.")
    a = rng.choice([90, rng.randint(20, 100)]) if d > 1 else rng.choice(range(30, 100, 10))
    b = rng.randint(15, 170 - a) if d > 1 else rng.choice(range(20, 170 - a, 10))
    r = 180 - a - b
    enun = f"Dos ángulos de un triángulo miden {a}° y {b}°. ¿Cuánto mide el tercero?"
    resp = f"{r}°"
    dist = [(f"{360 - a - b}°", "usa_360"), (f"{180 - a}°", "resta_uno"), (f"{180 - b}°", "resta_uno"), (f"{a + b}°", None), (f"{r + 10}°", None)]
    pasos = [(f"180 − {a} − {b}", str(r), f"Los tres ángulos de un triángulo suman 180°: 180° − {a}° − {b}° = {r}°.")]
    adulto = "Triángulo: 180°; cuadrilátero: 360°. Hay que restar los dos ángulos conocidos."
    return mk(enun, resp, "t4_tercer_angulo", {"a": a, "b": b}, dist, pasos, adulto)


@generador("t4_desig_tri")
def gen_desig_tri(rng, d):
    caso = rng.choice(["si", "no", "igual"] if d > 1 else ["si", "no"])
    for _ in range(100):
        a, b = sorted(rng.sample(range(2, 15), 2))
        if caso == "si":
            c = rng.randint(b, a + b - 1)
        elif caso == "igual":
            c = a + b
        else:
            c = a + b + rng.randint(1, 8)
        if c >= b:
            break
    ls = [a, b, c]
    rng.shuffle(ls)
    enun = f"¿Se puede construir un triángulo con lados de {ls[0]} cm, {ls[1]} cm y {ls[2]} cm?"
    if caso == "si":
        resp = f"Sí, porque {c} es menor que {a} + {b} = {a + b}"
        dist = [(f"No, porque {c} es mayor que {a}" if c > a else None, None), (f"No, porque {a} + {b} no es igual a {c}", None),
                ("No, porque los tres lados son distintos" if len({a, b, c}) == 3 else "No, porque tiene dos lados iguales", None),
                (f"No, porque {c} es mayor que {b}" if c > b else None, None), (f"No, porque {a} + {b} + {c} es mayor que {c}", None)]
    else:
        resp = f"No, porque {c} no es menor que {a} + {b} = {a + b}"
        dist = [(f"Sí, porque {c} es igual a {a} + {b}" if caso == "igual" else None, "admite_igualdad"), (f"Sí, porque {a} es menor que {b} + {c} = {b + c}", "lado_menor"),
                (f"Sí, porque {b} es menor que {a} + {c} = {a + c}", "lado_menor"), (f"Sí, porque {a} + {b} + {c} es mayor que {c}", None)]
    pasos = [("lado mayor", str(c), f"Basta comprobar el lado mayor ({c} cm): tiene que ser menor que la suma de los otros dos, {a} + {b} = {a + b}."),
             ("", resp, f"{resp}.")]
    adulto = "Desigualdad triangular: el lado mayor debe ser estrictamente menor que la suma de los otros dos. Si es igual, los segmentos quedan tumbados y no hay triángulo."
    return mk(enun, resp, "t4_desig_tri", {"lados": [a, b, c]}, dist, pasos, adulto)


@generador("t4_isosceles")
def gen_isosceles(rng, d):
    tipo = rng.choice(["desigual", "base"] if d == 1 else ["desigual", "base", "equilatero", "exterior"] if d == 2 else ["exterior", "desigual", "base"])
    if tipo == "desigual":
        x = rng.choice(range(20, 160, 2))
        r = (180 - x) // 2
        enun = f"En un triángulo isósceles, el ángulo desigual mide {x}°. ¿Cuánto mide cada uno de los ángulos iguales?"
        dist = [(f"{180 - x}°", "no_divide"), (f"{180 - 2 * x}°" if 180 - 2 * x > 0 else None, "dato_base"), (f"{x}°", None), (f"{r + 10}°", None)]
        pasos = [(f"180 − {x}", str(180 - x), f"Los tres ángulos suman 180°: a los dos iguales les quedan 180° − {x}° = {180 - x}°."),
                 (f"{180 - x} : 2", str(r), f"Como son iguales, cada uno mide {180 - x}° : 2 = {r}°.")]
    elif tipo == "base":
        b = rng.randint(20, 85)
        r = 180 - 2 * b
        enun = f"En un triángulo isósceles, cada uno de los dos ángulos iguales mide {b}°. ¿Cuánto mide el ángulo desigual?"
        dist = [(f"{180 - b}°", "no_divide"), (f"{fx(D(180 - b) / 2)}°", "dato_base"), (f"{b}°", None), (f"{r + 10}°", None)]
        pasos = [(f"180 − 2 · {b}", str(r), f"Los dos ángulos iguales suman 2 · {b}° = {2 * b}°; el desigual es 180° − {2 * b}° = {r}°.")]
    elif tipo == "equilatero":
        enun = "¿Cuánto mide cada ángulo interior de un triángulo equilátero?" if rng.random() < 0.5 else "¿Cuánto mide cada ángulo exterior de un triángulo equilátero?"
        r = 60 if "interior" in enun else 120
        dist = [("180°", None), ("90°", None), (f"{180 - r}°", "exterior_supl"), ("45°", None)]
        pasos = [("180 : 3", "60", "Los tres ángulos son iguales y suman 180°: 180° : 3 = 60°." + (" El exterior es el suplementario: 180° − 60° = 120°." if r == 120 else ""))]
    else:
        a, b = rng.randint(25, 80), rng.randint(25, 80)
        r = a + b
        enun = f"Dos ángulos interiores de un triángulo miden {a}° y {b}°. ¿Cuánto mide el ángulo exterior del tercer vértice?"
        dist = [(f"{180 - a}°", "exterior_supl"), (f"{180 - a - b}°", None), (f"{360 - a - b}°", None), (f"{180 - b}°", "exterior_supl")]
        pasos = [(f"{a} + {b}", str(r), f"El ángulo exterior mide lo mismo que la suma de los dos interiores no contiguos: {a}° + {b}° = {r}°. (También: el interior es 180° − {r}° = {180 - r}° y su suplementario, {r}°.)")]
    resp = f"{r}°"
    adulto = "Isósceles: los dos ángulos de la base son iguales. Equilátero: tres de 60°. Ángulo exterior = suma de los dos interiores no contiguos."
    return mk(enun, resp, "t4_isosceles", {"tipo": tipo}, dist, pasos, adulto)


# ---------------------------------------------------------------- cuadriláteros

@generador("t4_paralelogramo")
def gen_paralelogramo(rng, d):
    tipo = rng.choice(["cuadrado", "rectángulo", "rombo", "romboide"])
    a = rng.randint(3, 12)
    b = rng.randint(3, 12)
    while b == a:
        b = rng.randint(3, 12)
    ang = rng.choice([x for x in range(40, 140, 5) if x != 90])
    if d == 3 and rng.random() < 0.5:
        desc = {"cuadrado": "tiene los cuatro lados iguales y los cuatro ángulos rectos",
                "rectángulo": "tiene los cuatro ángulos rectos pero no todos los lados iguales",
                "rombo": "tiene los cuatro lados iguales pero ningún ángulo recto",
                "romboide": "tiene los lados iguales dos a dos y ningún ángulo recto"}[tipo]
        enun = f"¿Qué paralelogramo {desc}?"
    else:
        lados = f"los cuatro lados de {a} cm" if tipo in ("cuadrado", "rombo") else f"dos lados de {a} cm y otros dos de {b} cm"
        angulo = "un ángulo de 90°" if tipo in ("cuadrado", "rectángulo") else f"un ángulo de {ang}°"
        enun = f"Un paralelogramo tiene {lados} y {angulo}. ¿Qué tipo de paralelogramo es?"
    resp = tipo
    dist = [({"rombo": "romboide", "romboide": "rombo"}.get(tipo), "rombo_romboide"), ("rombo" if tipo == "cuadrado" else None, "cuadrado_rombo")] + \
           [(t, None) for t in ("cuadrado", "rectángulo", "rombo", "romboide", "trapecio") if t != tipo]
    pasos = [("lados y ángulos", resp, "Con lados iguales y ángulos rectos, cuadrado; ángulos rectos y lados distintos, rectángulo; lados iguales sin ángulos rectos, rombo; "
              f"ni lados iguales ni ángulos rectos, romboide. Aquí: {resp}.")]
    adulto = "Dos preguntas bastan: ¿tiene los cuatro lados iguales? ¿tiene ángulos rectos? El cuadrado es a la vez rombo y rectángulo, pero se nombra como cuadrado."
    return mk(enun, resp, "t4_paralelogramo", {"tipo": tipo}, dist, pasos, adulto)


@generador("t4_cuadrilatero")
def gen_cuadrilatero(rng, d):
    if d == 1 or rng.random() < 0.5:
        for _ in range(100):
            a, b, c = rng.randint(50, 150), rng.randint(50, 150), rng.randint(50, 150)
            if d == 1:
                a, b, c = (rng.choice(range(60, 150, 10)) for _ in range(3))
            r = 360 - a - b - c
            if 20 < r < 180:
                break
        enun = f"Tres ángulos de un cuadrilátero miden {a}°, {b}° y {c}°. ¿Cuánto mide el cuarto?"
        resp = f"{r}°"
        dist = [(f"{180 - a - b - c}°" if 180 - a - b - c > 0 else "No se puede", "usa_180"), (f"{a + b + c}°", None), (f"{r + 10}°", None), (f"{abs(r - 20)}°", None)]
        pasos = [(f"360 − {a} − {b} − {c}", str(r), f"Los cuatro ángulos de un cuadrilátero suman 360°: 360° − {a}° − {b}° − {c}° = {r}°.")]
    else:
        x = rng.choice([v for v in range(40, 140) if v != 90])
        y = 180 - x
        fig = rng.choice(["romboide", "rombo"])
        enun = f"Un {fig} tiene un ángulo de {x}°. ¿Cuánto miden los otros tres, en orden?"
        resp = f"{y}°, {x}° y {y}°"
        dist = [(f"{x}°, {x}° y {x}°", "iguala_contiguos"), (f"{abs(90 - x)}°, {x}° y {abs(90 - x)}°", None), (f"{x}°, {y}° y {x}°", None), (f"{360 - x}°, {x}° y {360 - x}°", None)]
        pasos = [("opuestos", f"{x}°", f"En un paralelogramo los ángulos opuestos son iguales: el opuesto mide {x}°."),
                 ("contiguos", f"{y}°", f"Los contiguos suman 180°: 180° − {x}° = {y}°."), ("", resp, f"Respuesta: {resp}.")]
    adulto = "Los ángulos de cualquier cuadrilátero suman 360°. En un paralelogramo, opuestos iguales y contiguos suplementarios."
    return mk(enun, resp, "t4_cuadrilatero", {}, dist, pasos, adulto)


# ---------------------------------------------------------------- circunferencia

@generador("t4_radio_diam")
def gen_radio_diam(rng, d):
    v = D(rng.randint(2, 20)) if d == 1 else D(rng.randint(11, 199)) / 10 if d == 3 else D(rng.randint(2, 60))
    if rng.random() < 0.5:
        enun = f"Una circunferencia tiene {fx(v)} cm de radio. ¿Cuánto mide su diámetro?"
        r = v * 2
        dist = [(u(v / 2, "cm"), "operacion_invertida"), (u(v, "cm"), "iguala"), (u(v * 4, "cm"), None), (u(v + 2, "cm"), None)]
        pasos = [(f"{fx(v)} × 2", fx(r), f"El diámetro es el doble del radio: {fx(v)} × 2 = {fx(r)} cm.")]
    else:
        if d > 1 and ndec(v / 2) > 2:
            v = v + 1
        enun = f"Una circunferencia tiene {fx(v)} cm de diámetro. ¿Cuánto mide su radio?"
        r = v / 2
        dist = [(u(v * 2, "cm"), "operacion_invertida"), (u(v, "cm"), "iguala"), (u(v / 4, "cm"), None), (u(v - 2, "cm") if v > 2 else None, None)]
        pasos = [(f"{fx(v)} : 2", fx(r), f"El radio es la mitad del diámetro: {fx(v)} : 2 = {fx(r)} cm.")]
    resp = u(r, "cm")
    adulto = "El diámetro atraviesa la circunferencia pasando por el centro: mide dos radios (d = 2r)."
    return mk(enun, resp, "t4_radio_diam", {"v": str(v)}, dist, pasos, adulto, genericos=var_num(r, "cm", pasos=(1, -1, 3)))


@generador("t4_pi_estima")
def gen_pi_estima(rng, d):
    tipo = rng.choice(["diametro"] if d == 1 else ["diametro", "radio"] if d == 2 else ["radio", "inverso", "razon"])
    obj = rng.choice(["Una rueda", "Un aro", "Una tapa redonda", "Un plato"])
    if tipo == "diametro":
        dd = rng.choice(range(10, 90, 5))
        r = 3 * dd
        enun = f"{obj} tiene {dd} cm de diámetro. Usando π ≈ 3, ¿cuánto mide aproximadamente su borde?"
        dist = [(f"unos {2 * dd} cm", "doble"), (f"unos {3 * dd // 2} cm" if dd % 2 == 0 else f"unos {dd} cm", "radio_diametro"), (f"unos {dd} cm", None), (f"unos {4 * dd} cm", None)]
        pasos = [(f"3 × {dd}", str(r), f"La longitud de una circunferencia es algo más de 3 veces su diámetro (π ≈ 3,14): 3 × {dd} = {r} cm, un poco más en realidad.")]
        resp = f"unos {r} cm"
    elif tipo == "radio":
        rad = rng.choice(range(5, 50, 5))
        r = 6 * rad
        enun = f"{obj} tiene {rad} cm de radio. Usando π ≈ 3, ¿cuánto mide aproximadamente su borde?"
        dist = [(f"unos {3 * rad} cm", "radio_diametro"), (f"unos {4 * rad} cm", "doble"), (f"unos {9 * rad} cm", None), (f"unos {2 * rad} cm", None)]
        pasos = [(f"2 × {rad}", str(2 * rad), f"Primero el diámetro: 2 × {rad} = {2 * rad} cm."), (f"3 × {2 * rad}", str(r), f"El borde mide unas 3 veces el diámetro: 3 × {2 * rad} = {r} cm.")]
        resp = f"unos {r} cm"
    elif tipo == "inverso":
        dd = rng.choice(range(10, 60, 5))
        L = D(dd) * D("3.14")
        enun = f"Una circunferencia mide {fx(L)} cm de longitud. Usando π = 3,14, ¿cuánto mide su diámetro?"
        resp = f"{dd} cm"
        dist = [(f"{fx(L / 2)} cm", "doble"), (f"{fx(D(dd) / 2)} cm", "radio_diametro"), (f"{fx(L * D('3.14'), 2)} cm", None), (f"{dd + 5} cm", None)]
        pasos = [(f"{fx(L)} : 3,14", str(dd), f"La longitud es π veces el diámetro, así que divido: {fx(L)} : 3,14 = {dd} cm.")]
    else:
        enun = "Si divides la longitud de cualquier circunferencia entre su diámetro, ¿qué obtienes siempre?"
        resp = "π, algo más de 3 (≈ 3,14)"
        dist = [("2, porque el borde es el doble del diámetro", "doble"), ("Depende del tamaño de la circunferencia", None), ("π, algo más de 6 (≈ 6,28)", "radio_diametro"), ("Exactamente 3", None)]
        pasos = [("L : d", "π", "Para cualquier circunferencia, longitud : diámetro = π ≈ 3,14, algo más de 3.")]
    adulto = "π es la razón entre la longitud de la circunferencia y su diámetro (≈ 3,14). Para estimar basta multiplicar el diámetro por 3; si se da el radio, hay que doblarlo antes."
    return mk(enun, resp, "t4_pi_estima", {"tipo": tipo}, dist, pasos, adulto)


@generador("t4_pos_circ")
def gen_pos_circ(rng, d):
    if d == 1 or (d == 2 and rng.random() < 0.3):
        r = rng.randint(3, 12)
        caso = rng.choice(["exterior", "tangente", "secante"])
        dd = {"exterior": r + rng.randint(1, 6), "tangente": r, "secante": rng.randint(0, r - 1)}[caso]
        enun = f"Una circunferencia tiene {r} cm de radio y la distancia de su centro a una recta es {dd} cm. ¿Cuál es la posición de la recta?"
        resp = caso
        dist = [({"exterior": "secante", "secante": "exterior", "tangente": None}[caso], "invierte")] + [(x, None) for x in ("exterior", "tangente", "secante", "interior") if x != caso]
        pasos = [("comparar d y r", resp, f"Comparo la distancia ({dd}) con el radio ({r}): mayor → exterior; igual → tangente; menor → secante. Es {resp}.")]
    else:
        r1, r2 = sorted(rng.sample(range(2, 12), 2), reverse=True)
        caso = rng.choice(["exteriores", "tangentes exteriores", "secantes", "tangentes interiores", "interiores", "concéntricas"])
        s, df = r1 + r2, r1 - r2
        dd = {"exteriores": s + rng.randint(1, 5), "tangentes exteriores": s, "secantes": rng.randint(df + 1, s - 1),
              "tangentes interiores": df, "interiores": rng.randint(1, df - 1) if df > 1 else None, "concéntricas": 0}[caso]
        if dd is None:
            caso, dd = "secantes", rng.randint(df + 1, s - 1)
        enun = f"Dos circunferencias tienen radios de {r1} cm y {r2} cm, y la distancia entre sus centros es {dd} cm. ¿Cuál es su posición relativa?"
        resp = caso
        solo_suma = "secantes" if dd < s else "tangentes exteriores" if dd == s else "exteriores"
        inv = {"exteriores": "interiores", "interiores": "exteriores", "tangentes exteriores": "tangentes interiores", "tangentes interiores": "tangentes exteriores", "secantes": None, "concéntricas": None}[caso]
        dist = [(solo_suma if solo_suma != caso else None, "solo_suma"), (inv, "invierte")] + \
               [(x, None) for x in ("secantes", "exteriores", "interiores", "tangentes exteriores", "tangentes interiores") if x != caso]
        pasos = [("suma y diferencia", f"{s} y {df}", f"Suma de radios: {r1} + {r2} = {s}; diferencia: {r1} − {r2} = {df}."),
                 ("comparar", resp, f"Distancia {dd}: si es mayor que {s}, exteriores; igual a {s}, tangentes exteriores; entre {df} y {s}, secantes; igual a {df}, tangentes interiores; "
                  f"menor que {df}, interiores (0: concéntricas). Son {resp}.")]
    adulto = "Recta: se compara la distancia al centro con el radio. Dos circunferencias: se compara la distancia entre centros con la suma y con la diferencia de radios."
    return mk(enun, resp, "t4_pos_circ", {}, dist, pasos, adulto)


# ---------------------------------------------------------------- cuerpos

@generador("t4_nombre_cuerpo")
def gen_nombre_cuerpo(rng, d):
    n = rng.randint(3, 8 if d < 3 else 10)
    cuerpo = rng.choice(["prisma", "pirámide"])
    nombre = f"{cuerpo} {ADJ[n]}"
    otro = "pirámide" if cuerpo == "prisma" else "prisma"
    if d == 1:
        if cuerpo == "prisma":
            enun = f"Un cuerpo tiene dos bases iguales y paralelas con forma de {NOMBRES_POL[n]} y sus caras laterales son rectángulos. ¿Cómo se llama?"
        else:
            enun = f"Un cuerpo tiene una sola base con forma de {NOMBRES_POL[n]} y caras laterales triangulares que se juntan en un vértice. ¿Cómo se llama?"
        dist = [(f"{otro} {ADJ[n]}", None), ("pirámide triangular" if cuerpo == "pirámide" and n != 3 else None, "por_caras_laterales"),
                (f"{cuerpo} {(ADJ[n + 1] if n + 1 in ADJ else ADJ[n - 1])}", None), (f"{otro} {(ADJ[n + 1] if n + 1 in ADJ else ADJ[n - 1])}", None)]
        pasos = [("bases", nombre, f"{'Dos bases iguales y paralelas: es un prisma' if cuerpo == 'prisma' else 'Una base y caras triangulares con un vértice común: es una pirámide'}. Se nombra por el polígono de la base ({NOMBRES_POL[n]}): {nombre}.")]
    else:
        caras = n + 2 if cuerpo == "prisma" else n + 1
        enun = f"Un{'a' if cuerpo == 'pirámide' else ''} {cuerpo} tiene {caras} caras en total. ¿Cómo se llama?"
        mal = caras if cuerpo == "pirámide" else caras
        dist = [(f"{cuerpo} {ADJ[caras]}" if caras in ADJ else None, "cuenta_base"), ("pirámide triangular" if cuerpo == "pirámide" and n != 3 else None, "por_caras_laterales"),
                (f"{cuerpo} {ADJ[caras - 1]}" if cuerpo == "prisma" and caras - 1 in ADJ else None, "cuenta_base"), (f"{otro} {ADJ[n]}", None),
                (f"{cuerpo} {ADJ.get(n - 1, ADJ.get(n + 2))}", None)]
        pasos = [("caras", str(n), (f"Un prisma tiene 2 bases más tantas caras laterales como lados de la base: {caras} − 2 = {n}." if cuerpo == "prisma"
                                    else f"Una pirámide tiene 1 base más tantas caras laterales como lados de la base: {caras} − 1 = {n}.")
                  + f" La base es un {NOMBRES_POL[n]}: {nombre}.")]
    resp = nombre
    adulto = "Prismas y pirámides se nombran por el polígono de la base. Para contar lados de la base a partir de las caras hay que descontar las bases (2 en el prisma, 1 en la pirámide)."
    return mk(enun, resp, "t4_nombre_cuerpo", {"n": n, "cuerpo": cuerpo}, dist, pasos, adulto)


@generador("t4_euler")
def gen_euler(rng, d):
    tipo = rng.choice(["elemento"] if d == 1 else ["elemento", "todos"] if d == 2 else ["todos", "euler"])
    n = rng.randint(3, 10 if d == 1 else 20)
    cuerpo = rng.choice(["prisma", "pirámide"])
    C, A, V = (n + 2, 3 * n, 2 * n) if cuerpo == "prisma" else (n + 1, 2 * n, n + 1)
    Cm, Am, Vm = (n + 1, 2 * n, n + 1) if cuerpo == "prisma" else (n + 2, 3 * n, 2 * n)
    base = NOMBRES_POL.get(n, f"polígono de {n} lados")
    art = "Una" if cuerpo == "pirámide" else "Un"
    if tipo == "elemento":
        el = rng.choice(["caras", "aristas", "vértices"])
        val, mal = {"caras": (C, Cm), "aristas": (A, Am), "vértices": (V, Vm)}[el]
        enun = f"¿Cuántas {el} tiene {art.lower()} {cuerpo} cuya base es un {base}?" if el != "vértices" else f"¿Cuántos vértices tiene {art.lower()} {cuerpo} cuya base es un {base}?"
        resp = str(val)
        dist = [(str(mal), "formulas_otro_cuerpo"), (str(n), None), (str(val + 1), None), (str(val - 1), None), (str(val + 2), None)]
    elif tipo == "todos":
        enun = f"{art} {cuerpo} tiene como base un {base}. ¿Cuántas caras, aristas y vértices tiene?"
        resp = f"{C} caras, {A} aristas y {V} vértices"
        dist = [(f"{Cm} caras, {Am} aristas y {Vm} vértices", "formulas_otro_cuerpo"), (f"{C} caras, {V} aristas y {A} vértices", None),
                (f"{C - 1} caras, {A} aristas y {V} vértices", None), (f"{C} caras, {A + n} aristas y {V} vértices", None)]
    else:
        caras, vert = C, V
        enun = f"Un poliedro convexo tiene {caras} caras y {vert} vértices. ¿Cuántas aristas tiene?"
        resp = str(A)
        dist = [(str(vert + 2 - caras) if vert + 2 - caras > 0 else str(caras + 2 - vert), "euler_signo"), (str(caras + vert + 2), None), (str(caras + vert), None), (str(A + 1), None)]
    pasos = [("fórmulas", resp, (f"Prisma de base con {n} lados: {n} + 2 = {C} caras, 3 · {n} = {A} aristas y 2 · {n} = {V} vértices." if cuerpo == "prisma"
                                 else f"Pirámide de base con {n} lados: {n} + 1 = {C} caras, 2 · {n} = {A} aristas y {n} + 1 = {V} vértices.")
              + (f" Euler: C + V = A + 2 → A = {C} + {V} − 2 = {A}." if tipo == "euler" else f" Compruebo Euler: {C} + {V} = {A} + 2."))]
    adulto = "Prisma: n + 2 caras, 3n aristas, 2n vértices. Pirámide: n + 1 caras, 2n aristas, n + 1 vértices. En todo poliedro convexo, C + V = A + 2."
    return mk(enun, resp, "t4_euler", {"n": n, "cuerpo": cuerpo, "tipo": tipo}, dist, pasos, adulto)


# ---------------------------------------------------------------- simetría y movimientos

@generador("t4_ejes")
def gen_ejes(rng, d):
    figs = {1: [("un cuadrado", 4), ("un rectángulo que no es cuadrado", 2), ("un triángulo equilátero", 3), ("un círculo", None), ("un triángulo escaleno", 0)],
            2: [("un rombo que no es cuadrado", 2), ("un triángulo isósceles no equilátero", 1), ("un pentágono regular", 5), ("un hexágono regular", 6), ("un rectángulo que no es cuadrado", 2)],
            3: [("un octógono regular", 8), ("un romboide", 0), ("un trapecio isósceles", 1), ("un decágono regular", 10), ("un rombo que no es cuadrado", 2), ("un heptágono regular", 7)]}[d]
    fig, n = rng.choice(figs)
    enun = f"¿Cuántos ejes de simetría tiene {fig}?"
    txt = lambda k: "infinitos" if k is None else f"{k} {'eje' if k == 1 else 'ejes'}" if k else "ninguno"
    resp = txt(n)
    dist = []
    if "rectángulo" in fig or "rombo" in fig:
        dist.append((txt(4), "diagonales_rect"))
    if "regular" in fig and n and n % 2 == 0:
        dist.append((txt(n // 2), "mitad_lados"))
    if "regular" in fig:
        dist.append((txt(2 * n), None))
    dist += [(txt(k), None) for k in (1, 2, 4, 0, 3) if k != n]
    pasos = [("doblar", resp, f"Un eje de simetría divide la figura en dos mitades que coinciden al doblar. {fig[0].upper() + fig[1:]} tiene {resp}."
              + (" En un polígono regular hay tantos ejes como lados." if "regular" in fig else "")
              + (" Las diagonales del rectángulo no son ejes: al doblar por ellas las mitades no coinciden." if "rectángulo" in fig else ""))]
    adulto = "Polígono regular de n lados: n ejes. Rectángulo y rombo: 2. Cuadrado: 4. Isósceles: 1. Escaleno y romboide: ninguno. Círculo: infinitos."
    return mk(enun, resp, "t4_ejes", {"figura": fig}, dist, pasos, adulto)


def pt(x, y):
    f = lambda v: fx(v) if not isinstance(v, int) else (("−" + str(-v)) if v < 0 else str(v))
    return f"({f(x)}, {f(y)})"


@generador("t4_mov_coord")
def gen_mov_coord(rng, d):
    x, y = rng.randint(-9, 9), rng.randint(-9, 9)
    while x == 0 or y == 0 or abs(x) == abs(y):
        x, y = rng.randint(-9, 9), rng.randint(-9, 9)
    tipo = rng.choice(["traslacion", "eje_x", "eje_y"] if d < 3 else ["traslacion", "origen", "eje_y", "eje_x"])
    if tipo == "traslacion":
        a, b = rng.randint(-6, 6), rng.randint(-6, 6)
        while a == 0 or b == 0:
            a, b = rng.randint(-6, 6), rng.randint(-6, 6)
        enun = f"Traslada el punto {pt(x, y)} según el vector {pt(a, b)}. ¿Dónde queda?"
        r = (x + a, y + b)
        dist = [(pt(x - a, y - b), "resta_vector"), (pt(x + b, y + a), None), (pt(x + a, y - b), None), (pt(a, b), None)]
        pasos = [(f"({x} + {a}, {y} + {b})".replace("+ -", "− "), pt(*r), f"Sumo el vector a las coordenadas: x = {x} + ({a}) = {r[0]}, y = {y} + ({b}) = {r[1]}.")]
    else:
        nom = {"eje_x": "al eje de abscisas (eje X)", "eje_y": "al eje de ordenadas (eje Y)", "origen": "al origen de coordenadas"}[tipo]
        enun = f"¿Cuál es el simétrico del punto {pt(x, y)} respecto {nom}?"
        r = {"eje_x": (x, -y), "eje_y": (-x, y), "origen": (-x, -y)}[tipo]
        equivocada = {"eje_x": (-x, y), "eje_y": (x, -y), "origen": (-x, y)}[tipo]
        dist = [(pt(*equivocada), "coord_equivocada"), (pt(-x, -y) if tipo != "origen" else pt(x, -y), None), (pt(y, x), None), (pt(-y, -x), None)]
        regla = {"eje_x": "respecto al eje X se conserva la x y cambia de signo la y", "eje_y": "respecto al eje Y se conserva la y y cambia de signo la x",
                 "origen": "respecto al origen cambian de signo las dos coordenadas"}[tipo]
        pasos = [("regla", pt(*r), f"En la simetría {regla}: {pt(x, y)} → {pt(*r)}.")]
    resp = pt(*r)
    adulto = "Traslación de vector (a, b): (x + a, y + b). Simetría eje X: (x, −y); eje Y: (−x, y); origen: (−x, −y)."
    return mk(enun, resp, "t4_mov_coord", {"x": x, "y": y, "tipo": tipo}, dist, pasos, adulto)


@generador("t4_giros")
def gen_giros(rng, d):
    x, y = rng.randint(-8, 8), rng.randint(-8, 8)
    while x == 0 or y == 0 or abs(x) == abs(y):
        x, y = rng.randint(-8, 8), rng.randint(-8, 8)
    if d == 1:
        x, y = abs(x), abs(y)
    ang = rng.choice([90, 180] if d == 1 else [90, 270, 180] if d == 2 else [90, 270, "90h", "dos_simetrias"])
    if ang == 90:
        r, contra = (-y, x), (y, -x)
        txt = "90° en sentido antihorario"
    elif ang == 270:
        r, contra = (y, -x), (-y, x)
        txt = "270° en sentido antihorario"
    elif ang == "90h":
        r, contra = (y, -x), (-y, x)
        txt = "90° en sentido horario"
    elif ang == 180:
        r, contra = (-x, -y), None
        txt = "180°"
    else:
        r, contra = (-x, -y), None
    if ang == "dos_simetrias":
        enun = f"Al punto {pt(x, y)} le aplicas una simetría respecto al eje X y después otra respecto al eje Y. ¿Dónde queda?"
        dist = [(pt(x, -y), None), (pt(-x, y), None), (pt(y, x), "intercambia"), (pt(-y, x), None)]
        pasos = [("eje X", pt(x, -y), f"Simetría respecto al eje X: {pt(x, y)} → {pt(x, -y)}."), ("eje Y", pt(-x, -y), f"Simetría respecto al eje Y: {pt(x, -y)} → {pt(-x, -y)}. Equivale a un giro de 180° con centro el origen.")]
    else:
        enun = f"Gira el punto {pt(x, y)} {txt} con centro en el origen. ¿Dónde queda?"
        dist = [(pt(y, x), "intercambia"), (pt(*contra) if contra else pt(-y, x), "sentido" if contra else None), (pt(-x, y), None), (pt(x, -y), None), (pt(-y, -x), None)]
        regla = {90: "(x, y) → (−y, x)", 270: "(x, y) → (y, −x)", "90h": "(x, y) → (y, −x) (igual que 270° antihorario)", 180: "(x, y) → (−x, −y)"}[ang]
        pasos = [("regla", pt(*r), f"Giro de {txt}: {regla}. Así, {pt(x, y)} → {pt(*r)}.")]
    resp = pt(*r)
    adulto = "Con centro en el origen: 90° antihorario (x, y) → (−y, x); 180° (x, y) → (−x, −y); 270° antihorario (o 90° horario) (x, y) → (y, −x). Conviene comprobarlo dibujando."
    return mk(enun, resp, "t4_giros", {"x": x, "y": y, "ang": str(ang)}, dist, pasos, adulto)


# ---------------------------------------------------------------- coordenadas

@generador("t4_coord1")
def gen_coord1(rng, d):
    if d == 1:
        x, y = rng.randint(1, 9), rng.randint(1, 9)
        while x == y:
            y = rng.randint(1, 9)
        enun = f"Desde el origen (0, 0) avanzas {x} unidades hacia la derecha y {y} hacia arriba. ¿En qué punto estás?"
        resp = pt(x, y)
        dist = [(pt(y, x), "invierte"), (pt(x + 1, y + 1), "cuenta_desde_1"), (pt(x, y + 1), None), (pt(x - 1, y), None), (pt(x + y, 0), None)]
        pasos = [("(x, y)", resp, f"La primera coordenada es el desplazamiento horizontal ({x}) y la segunda el vertical ({y}): {resp}.")]
    else:
        for _ in range(100):
            x, y = rng.randint(0, 10), rng.randint(0, 10)
            dx, dy = rng.randint(-5, 5), rng.randint(-5, 5)
            if dx and dy and 0 <= x + dx <= 10 and 0 <= y + dy <= 10 and x != y:
                break
        mv = f"{abs(dx)} a la {'derecha' if dx > 0 else 'izquierda'} y {abs(dy)} hacia {'arriba' if dy > 0 else 'abajo'}"
        if d == 3 and rng.random() < 0.5:
            enun = f"¿Qué desplazamiento lleva del punto {pt(x, y)} al punto {pt(x + dx, y + dy)}?"
            resp = mv
            dist = [(f"{abs(dy)} a la {'derecha' if dy > 0 else 'izquierda'} y {abs(dx)} hacia {'arriba' if dx > 0 else 'abajo'}", "invierte"),
                    (f"{abs(dx)} a la {'izquierda' if dx > 0 else 'derecha'} y {abs(dy)} hacia {'abajo' if dy > 0 else 'arriba'}", None),
                    (f"{abs(dx)} a la {'derecha' if dx > 0 else 'izquierda'} y {abs(dy)} hacia {'abajo' if dy > 0 else 'arriba'}", None),
                    (f"{x + dx} a la derecha y {y + dy} hacia arriba", None)]
        else:
            enun = f"Desde el punto {pt(x, y)} te mueves {mv}. ¿A qué punto llegas?"
            resp = pt(x + dx, y + dy)
            dist = [(pt(y + dy, x + dx), "invierte"), (pt(x + dy, y + dx), None), (pt(x - dx, y - dy), None), (pt(x + dx, y - dy), None), (pt(x - dx, y + dy), None)]
        pasos = [("x", str(x + dx), f"La x cambia con los movimientos horizontales: {x} {'+' if dx > 0 else '−'} {abs(dx)} = {x + dx}."),
                 ("y", str(y + dy), f"La y cambia con los verticales: {y} {'+' if dy > 0 else '−'} {abs(dy)} = {y + dy}."), ("", resp, f"Respuesta: {resp}.")]
    adulto = "En (x, y), la primera coordenada es horizontal y la segunda vertical; se cuenta desde el 0 (el origen), no desde el 1."
    return mk(enun, resp, "t4_coord1", {}, dist, pasos, adulto)


CUAD = {1: "el primer cuadrante", 2: "el segundo cuadrante", 3: "el tercer cuadrante", 4: "el cuarto cuadrante"}


@generador("t4_cuadrantes")
def gen_cuadrantes(rng, d):
    if d == 3 and rng.random() < 0.6:
        v = rng.randint(1, 9) * rng.choice([1, -1])
        eje = rng.choice(["x", "y"])
        x, y = (v, 0) if eje == "x" else (0, v)
        resp = "sobre el eje de abscisas (eje X)" if eje == "x" else "sobre el eje de ordenadas (eje Y)"
        q = {(True, True): 1, (False, True): 2, (False, False): 3, (True, False): 4}
        mal = q[(v > 0, True)] if eje == "x" else q[(True, v > 0)]
        dist = [(CUAD[mal], "eje_en_cuadrante"), ("sobre el eje de ordenadas (eje Y)" if eje == "x" else "sobre el eje de abscisas (eje X)", None),
                (CUAD[(mal % 4) + 1], "eje_en_cuadrante"), ("en el origen", None)]
    else:
        x = rng.randint(1, 9) * rng.choice([1, -1])
        y = rng.randint(1, 9) * rng.choice([1, -1])
        if d >= 2 and rng.random() < 0.5:
            x = D(x) + D(rng.choice([5, -5])) / 10
        cu = {(True, True): 1, (False, True): 2, (False, False): 3, (True, False): 4}[(x > 0, y > 0)]
        resp = CUAD[cu]
        swap = {2: 4, 4: 2, 1: 3, 3: 1}[cu]
        dist = [(CUAD[swap], "numera_mal" if cu in (2, 4) else None)] + [(CUAD[k], None) for k in (1, 2, 3, 4) if k not in (cu, swap)] + [("sobre el eje de abscisas (eje X)", None)]
    enun = f"¿Dónde está el punto {pt(x, y)}?"
    pasos = [("signos", resp, "Miro los signos: (+, +) primer cuadrante; (−, +) segundo; (−, −) tercero; (+, −) cuarto. Si una coordenada es 0, el punto está sobre un eje. "
              f"El punto {pt(x, y)} está {resp.replace('el ', 'en el ', 1) if resp.startswith('el ') else resp}.")]
    adulto = "Los cuadrantes se numeran en sentido antihorario empezando por arriba a la derecha. Los puntos con alguna coordenada 0 están sobre los ejes, no en un cuadrante."
    resp_txt = ("en " + resp) if resp.startswith("el ") else resp
    dist = [(("en " + v) if v and v.startswith("el ") else v, k) for v, k in dist]
    return mk(enun, resp_txt, "t4_cuadrantes", {"x": str(x), "y": str(y)}, dist, pasos, adulto)


TERNAS = [(3, 4, 5), (6, 8, 10), (5, 12, 13), (8, 15, 17), (9, 12, 15), (7, 24, 25), (12, 16, 20), (20, 21, 29), (9, 40, 41), (12, 5, 13), (15, 20, 25), (10, 24, 26)]


@generador("t4_distancia")
def gen_distancia(rng, d):
    x1, y1 = rng.randint(-6, 6), rng.randint(-6, 6)
    if d < 3 and rng.random() < 0.7 or d == 1:
        hor = rng.random() < 0.5
        L = rng.randint(2, 10)
        if d > 1:
            x1 = rng.randint(-8, -1) if hor else x1
            y1 = rng.randint(-8, -1) if not hor else y1
            L = rng.randint(max(2, abs(x1 if hor else y1) + 1), 14)
        x2, y2 = (x1 + L, y1) if hor else (x1, y1 + L)
        r = L
        a1, a2 = (x1, x2) if hor else (y1, y2)
        dist = [(str(abs(abs(a2) - abs(a1))) if abs(abs(a2) - abs(a1)) != L else None, "signo_mal"), (str(abs(a1) + abs(a2)) if abs(a1) + abs(a2) != L else None, None),
                (str(L + 1), None), (str(L - 1), None), (str(L + 2), None)]
        pasos = [("restar", str(r), f"Los dos puntos están en la misma {'horizontal' if hor else 'vertical'}: resto las coordenadas que cambian, {a2} − ({a1}) = {r}.")]
    else:
        a, b, c = rng.choice(TERNAS[:8])
        if rng.random() < 0.5:
            a, b = b, a
        sx_, sy_ = rng.choice([1, -1]), rng.choice([1, -1])
        x2, y2 = x1 + sx_ * a, y1 + sy_ * b
        r = c
        dist = [(str(a + b), "sin_pitag"), (str(a * a + b * b), None), (str(abs(b - a)) if a != b else None, None), (str(c + 1), None)]
        pasos = [("diferencias", f"{a} y {b}", f"Diferencia horizontal: |{x2} − ({x1})| = {a}; vertical: |{y2} − ({y1})| = {b}."),
                 ("Pitágoras", str(c), f"Son los catetos de un triángulo rectángulo: d = √({a}² + {b}²) = √{a * a + b * b} = {c}.")]
    enun = f"¿Cuál es la distancia entre los puntos {pt(x1, y1)} y {pt(x2, y2)}?"
    resp = str(r)
    adulto = "En la misma horizontal o vertical, se restan las coordenadas (con su signo). En general, las diferencias son catetos y se aplica Pitágoras: sumarlas sin más es el error típico."
    return mk(enun, resp, "t4_distancia", {"p1": [x1, y1], "p2": [x2, y2]}, dist, pasos, adulto)


@generador("t4_poligono_coords")
def gen_poligono_coords(rng, d):
    fig = rng.choice(["rect_perim", "rect_area"] if d == 1 else ["rect_area", "triangulo", "rect_perim"] if d == 2 else ["triangulo", "trapecio", "rect_area"])
    x1, y1 = rng.randint(-3, 5), rng.randint(-3, 5)
    if fig.startswith("rect"):
        w, h = rng.randint(2, 9), rng.randint(2, 9)
        while w == h:
            h = rng.randint(2, 9)
        vs = [(x1, y1), (x1 + w, y1), (x1 + w, y1 + h), (x1, y1 + h)]
        if fig == "rect_perim":
            enun = f"Calcula el perímetro del rectángulo de vértices {', '.join(pt(*v) for v in vs)}."
            r = 2 * (w + h)
            dist = [(str(2 * (abs(x1 + w) + abs(y1 + h))) if 2 * (abs(x1 + w) + abs(y1 + h)) != r else None, "coordenada_longitud"), (str(w * h), None), (str(w + h), None), (str(r + 2), None)]
            pasos = [("lados", f"{w} y {h}", f"Base: {x1 + w} − ({x1}) = {w}; altura: {y1 + h} − ({y1}) = {h}."), ("2 · (b + h)", str(r), f"Perímetro = 2 · ({w} + {h}) = {r}.")]
        else:
            enun = f"Calcula el área del rectángulo de vértices {', '.join(pt(*v) for v in vs)}."
            r = w * h
            dist = [(str(abs(x1 + w) * abs(y1 + h)) if abs(x1 + w) * abs(y1 + h) != r else None, "coordenada_longitud"), (str(2 * (w + h)), None), (str(r // 2) if r % 2 == 0 else str(r + 1), "olvida_mitad_inv"), (str(r + w), None)]
            pasos = [("lados", f"{w} y {h}", f"Base: {x1 + w} − ({x1}) = {w}; altura: {y1 + h} − ({y1}) = {h}."), ("b · h", str(r), f"Área = {w} · {h} = {r}.")]
    elif fig == "triangulo":
        b = rng.choice(range(2, 13, 2))
        h = rng.randint(2, 9)
        xa = x1 + rng.randint(0, b)
        vs = [(x1, y1), (x1 + b, y1), (xa, y1 + h)]
        enun = f"Calcula el área del triángulo de vértices {', '.join(pt(*v) for v in vs)}."
        r = b * h // 2
        dist = [(str(b * h), "olvida_mitad"), (str(abs(x1 + b) * h // 2) if abs(x1 + b) * h % 2 == 0 and abs(x1 + b) != b else None, "coordenada_longitud"), (str(b + h), None), (str(r + h), None)]
        pasos = [("base", str(b), f"La base es horizontal: {x1 + b} − ({x1}) = {b}."), ("altura", str(h), f"La altura es la distancia vertical del tercer vértice a la base: {y1 + h} − ({y1}) = {h}."),
                 ("b · h : 2", str(r), f"Área = {b} · {h} : 2 = {r}.")]
    else:
        B, bb, h = rng.randint(6, 12), rng.randint(2, 5), rng.randint(2, 8)
        while (B + bb) * h % 2:
            h += 1
        off = rng.randint(0, B - bb)
        vs = [(x1, y1), (x1 + B, y1), (x1 + off + bb, y1 + h), (x1 + off, y1 + h)]
        enun = f"Calcula el área del trapecio de vértices {', '.join(pt(*v) for v in vs)}."
        r = (B + bb) * h // 2
        dist = [((B + bb) * h, "olvida_mitad"), (B * bb * h // 2 if B * bb * h % 2 == 0 else None, None), (B * h, None), (r + h, None)]
        dist = [(str(v) if v is not None else None, k) for v, k in dist]
        pasos = [("bases", f"{B} y {bb}", f"Bases horizontales: {B} y {bb}; altura: {h}."), ("(B + b) · h : 2", str(r), f"Área = ({B} + {bb}) · {h} : 2 = {r}.")]
    resp = str(r)
    adulto = "Con lados paralelos a los ejes, las longitudes se obtienen restando coordenadas; no se usa una coordenada suelta como longitud."
    return mk(enun, resp, "t4_poligono_coords", {"fig": fig, "vertices": [list(v) for v in vs]}, dist, pasos, adulto)


# ---------------------------------------------------------------- Pitágoras: reconocer y clasificar

@generador("t4_pitag_tipo")
def gen_pitag_tipo(rng, d, modo="rectangulo"):
    for _ in range(200):
        if modo == "rectangulo" or rng.random() < 0.34:
            if rng.random() < 0.5:
                a, b, c = rng.choice(TERNAS)
            else:
                a, b = rng.randint(3, 15), rng.randint(3, 15)
                c = rng.choice([int(math.isqrt(a * a + b * b)) + 1, int(math.isqrt(a * a + b * b))])
        else:
            a, b = rng.randint(3, 15), rng.randint(3, 15)
            c = rng.randint(max(a, b), a + b - 1)
        ls = sorted([a, b, c])
        if ls[2] < ls[0] + ls[1] and len(set(ls)) >= 2:
            break
    a, b, c = ls
    tipo = "rectángulo" if c * c == a * a + b * b else "obtusángulo" if c * c > a * a + b * b else "acutángulo"
    orden = [a, b, c]
    rng.shuffle(orden)
    enun = (f"¿Es rectángulo un triángulo de lados {orden[0]}, {orden[1]} y {orden[2]}?" if modo == "rectangulo"
            else f"Un triángulo tiene lados {orden[0]}, {orden[1]} y {orden[2]}. ¿Es acutángulo, rectángulo u obtusángulo?")
    comp = f"{c}² = {c * c} y {a}² + {b}² = {a * a + b * b}"
    if modo == "rectangulo":
        si = tipo == "rectángulo"
        resp = f"Sí, porque {c}² = {a}² + {b}²" if si else f"No, porque {c}² ≠ {a}² + {b}²"
        mal_nomayor = (a * a == b * b + c * c)
        dist = [(("No, porque " + f"{a} + {b} ≠ {c}") if si and a + b != c else None, "suma_sin_cuadrados"),
                (f"No, porque {a}² ≠ {b}² + {c}²" if si else None, "no_lado_mayor"),
                (f"Sí, porque {a} + {b} > {c}" if not si else None, "suma_sin_cuadrados"),
                (f"Sí, porque {c}² = {a}² + {b}²" if not si else f"No, porque {c}² > {a}² + {b}²", None),
                ("Solo si tiene dos lados iguales", None), (f"No, porque {c}² < {a}² + {b}²" if si else None, None)]
    else:
        resp = tipo
        inv = {"acutángulo": "obtusángulo", "obtusángulo": "acutángulo", "rectángulo": None}[tipo]
        a2 = a * a
        otro = "obtusángulo" if a2 > b * b + c * c else "rectángulo" if a2 == b * b + c * c else "acutángulo"
        dist = [(inv, "invierte"), (otro if otro != tipo else None, "no_lado_mayor")] + [(t, None) for t in ("acutángulo", "rectángulo", "obtusángulo", "isósceles") if t != tipo]
    pasos = [("lado mayor", str(c), f"El lado mayor es {c}: comparo su cuadrado con la suma de los cuadrados de los otros dos. {comp}."),
             ("", resp, "Si son iguales, es rectángulo; si el cuadrado del mayor es menor, acutángulo; si es mayor, obtusángulo. " + f"Respuesta: {resp}.")]
    adulto = "Se compara c² (c = lado mayor) con a² + b²: igual → rectángulo; menor → acutángulo; mayor → obtusángulo. Hay que elevar al cuadrado y usar el lado mayor."
    return mk(enun, resp, "t4_pitag_tipo", {"lados": [a, b, c]}, dist, pasos, adulto)


# ---------------------------------------------------------------- perímetros

PI = Decimal("3.14")


def _dec(rng, d, lo=2, hi=20):
    if d == 1:
        return D(rng.randint(lo, hi))
    if d == 2:
        return D(rng.randint(lo, hi)) if rng.random() < 0.5 else D(rng.randint(lo * 10, hi * 10)) / 10
    return D(rng.randint(lo * 10, hi * 10)) / 10


@generador("t4_perim_suma")
def gen_perim_suma(rng, d):
    n = rng.choice([3, 4] if d == 1 else [4, 5] if d == 2 else [5, 6])
    ls = [rng.randint(3, 20) for _ in range(n)]
    r = sum(ls)
    nom = NOMBRES_POL[n]
    enun = f"Un {nom} tiene lados de " + ", ".join(f"{x}" for x in ls[:-1]) + f" y {ls[-1]} cm. ¿Cuál es su perímetro?"
    resp = f"{r} cm"
    dist = [(f"{r - ls[-1]} cm", "olvida_lado"), (f"{r - ls[0]} cm", "olvida_lado"), (f"{ls[0] * ls[1]} cm", "multiplica"), (f"{r + 10} cm", None)]
    pasos = [(" + ".join(map(str, ls)), str(r), f"El perímetro es la suma de todos los lados ({n}): {' + '.join(map(str, ls))} = {r} cm.")]
    adulto = "Perímetro = longitud del borde = suma de todos los lados. Conviene tachar cada lado al sumarlo para no olvidar ninguno."
    return mk(enun, resp, "t4_perim_suma", {"lados": ls}, dist, pasos, adulto)


@generador("t4_perim_rect")
def gen_perim_rect(rng, d):
    fig = rng.choice(["cuadrado", "rectángulo", "rectángulo"])
    if d == 3 and fig == "rectángulo":
        a = D(rng.randint(12, 60)) / 10
        bcm = rng.randint(15, 95)
        b = D(bcm) / 100
        r = 2 * (a + b)
        enun = f"Un rectángulo mide {fx(a)} m de largo y {bcm} cm de ancho. ¿Cuál es su perímetro en metros?"
        resp = u(r, "m")
        dist = [(u(2 * a + 2 * bcm, "m"), "no_iguala"), (u(a + b, "m"), "suma_dos"), (u(a * b, "m"), "area"), (u(2 * a + b, "m"), None)]
        pasos = [(f"{bcm} cm = {fx(b)} m", fx(b), f"Primero igualo unidades: {bcm} cm = {fx(b)} m."),
                 (f"2 · {fx(a)} + 2 · {fx(b)}", fx(r), f"Perímetro = 2 · {fx(a)} + 2 · {fx(b)} = {resp}.")]
    elif fig == "cuadrado":
        a = _dec(rng, d, 2, 25)
        r = 4 * a
        enun = f"¿Cuál es el perímetro de un cuadrado de {fx(a)} cm de lado?"
        resp = u(r, "cm")
        dist = [(u(a * a, "cm"), "area"), (u(2 * a, "cm"), "suma_dos"), (u(a + 4, "cm"), None), (u(3 * a, "cm"), None)]
        pasos = [(f"4 · {fx(a)}", fx(r), f"El cuadrado tiene 4 lados iguales: 4 · {fx(a)} = {resp}.")]
    else:
        a, b = _dec(rng, d, 3, 25), _dec(rng, d, 2, 15)
        if a == b:
            a += 1
        r = 2 * (a + b)
        enun = f"Un rectángulo mide {fx(a)} cm de largo y {fx(b)} cm de ancho. ¿Cuál es su perímetro?"
        resp = u(r, "cm")
        dist = [(u(a + b, "cm"), "suma_dos"), (u(a * b, "cm"), "area"), (u(2 * a + b, "cm"), None), (u(r + 2, "cm"), None)]
        pasos = [(f"2 · {fx(a)} + 2 · {fx(b)}", fx(r), f"Hay dos lados de {fx(a)} y dos de {fx(b)}: 2 · {fx(a)} + 2 · {fx(b)} = {resp}.")]
    adulto = "Perímetro del rectángulo = 2 · largo + 2 · ancho; del cuadrado = 4 · lado. Si las medidas vienen en unidades distintas, primero hay que igualarlas."
    return mk(enun, resp, "t4_perim_rect", {"fig": fig}, dist, pasos, adulto)


@generador("t4_perim_regular")
def gen_perim_regular(rng, d):
    n = rng.choice([3, 4, 5, 6] if d == 1 else [5, 6, 7, 8] if d == 2 else [7, 8, 9, 10, 11, 12])
    a = _dec(rng, d, 2, 20)
    r = n * a
    nom = NOMBRES_POL[n] if n > 4 else ("triángulo equilátero" if n == 3 else "cuadrado")
    enun = f"¿Cuál es el perímetro de un {nom}{' regular' if n > 4 else ''} de {fx(a)} cm de lado?"
    resp = u(r, "cm")
    vecino = {5: 6, 6: 8, 7: 6, 8: 6, 9: 10, 10: 9, 11: 12, 12: 11, 3: 4, 4: 3}[n]
    dist = [(u(vecino * a, "cm"), "lados_mal"), (u(a + n, "cm"), "suma"), (u((n - 1) * a, "cm"), "lados_mal"), (u(a * a, "cm"), None)]
    pasos = [(f"{n} · {fx(a)}", fx(r), f"Un {NOMBRES_POL[n]} tiene {n} lados iguales: {n} · {fx(a)} = {resp}.")]
    adulto = "Perímetro de un polígono regular = número de lados · lado. Hay que saber cuántos lados indica el nombre."
    return mk(enun, resp, "t4_perim_regular", {"n": n, "a": str(a)}, dist, pasos, adulto)


@generador("t4_lado_perim")
def gen_lado_perim(rng, d):
    caso = rng.choice(["regular", "rectangulo"] if d < 3 else ["rectangulo", "faltante", "regular"])
    if caso == "regular":
        n = rng.choice([3, 4, 5, 6, 8])
        l = _dec(rng, d, 2, 15)
        P = n * l
        nom = NOMBRES_POL[n] + " regular" if n > 4 else ("triángulo equilátero" if n == 3 else "cuadrado")
        enun = f"Un {nom} tiene {fx(P)} cm de perímetro. ¿Cuánto mide cada lado?"
        resp = u(l, "cm")
        dist = [(u(P / 2, "cm"), None), (u(P - n, "cm"), None), (u(P / (n + 1), "cm", 2) if ndec(P / (n + 1)) <= 2 else None, None), (u(P / (n - 1), "cm") if ndec(P / (n - 1)) <= 2 else None, None), (u(l + 1, "cm"), None)]
        pasos = [(f"{fx(P)} : {n}", fx(l), f"Tiene {n} lados iguales: {fx(P)} : {n} = {resp}.")]
    elif caso == "rectangulo":
        a = rng.randint(4, 25)
        b = rng.randint(2, a - 1)
        P = 2 * (a + b)
        enun = f"Un rectángulo tiene {P} cm de perímetro y {a} cm de largo. ¿Cuánto mide de ancho?"
        resp = f"{b} cm"
        dist = [(f"{P - a} cm", "resta_un_largo"), (f"{P - 2 * a} cm", "no_divide"), (f"{P // 4} cm" if P // 4 != b else None, None), (f"{b + 1} cm", None)]
        pasos = [(f"{P} − 2 · {a}", str(P - 2 * a), f"Los dos largos suman 2 · {a} = {2 * a} cm; para los dos anchos quedan {P} − {2 * a} = {P - 2 * a} cm."),
                 (f"{P - 2 * a} : 2", str(b), f"Cada ancho mide {P - 2 * a} : 2 = {b} cm.")]
    else:
        n = rng.choice([4, 5, 6])
        ls = [rng.randint(3, 15) for _ in range(n)]
        P = sum(ls)
        nom = NOMBRES_POL[n]
        enun = f"Un {nom} tiene {P} cm de perímetro. {plural(n - 1, 'Un lado mide', 'Sus lados conocidos miden')} " + ", ".join(map(str, ls[:-2])) + f" y {ls[-2]} cm. ¿Cuánto mide el lado que falta?"
        resp = f"{ls[-1]} cm"
        dist = [(f"{P - ls[-2]} cm", "resta_un_largo"), (f"{P + sum(ls[:-1])} cm", None), (f"{sum(ls[:-1])} cm", None), (f"{ls[-1] + 2} cm", None)]
        pasos = [(" + ".join(map(str, ls[:-1])), str(sum(ls[:-1])), f"Sumo los lados conocidos: {' + '.join(map(str, ls[:-1]))} = {sum(ls[:-1])} cm."),
                 (f"{P} − {sum(ls[:-1])}", str(ls[-1]), f"El que falta es {P} − {sum(ls[:-1])} = {ls[-1]} cm.")]
    adulto = "Para hallar un lado a partir del perímetro se deshace la suma: en el rectángulo, P : 2 − largo (o (P − 2·largo) : 2)."
    return mk(enun, resp, "t4_lado_perim", {"caso": caso}, dist, pasos, adulto)


@generador("t4_long_circ")
def gen_long_circ(rng, d):
    tipo = rng.choice(["r", "d"] if d < 3 else ["r", "d", "inversa"])
    rad = D(rng.randint(1, 15)) if d == 1 else D(rng.randint(1, 30)) if d == 2 else _dec(rng, 2, 1, 20)
    L = 2 * PI * rad
    if tipo == "inversa":
        enun = f"Una circunferencia mide {fx(L)} cm. ¿Cuánto mide su radio? (usa π = 3,14)"
        resp = u(rad, "cm")
        dist = [(u(rad * 2, "cm"), "usa_d"), (u(L / PI, "cm"), "olvida_2"), (u(r2(L / 2)), None), (u(rad + 1, "cm"), None)]
        dist[2] = (u(r2(L / 2), "cm"), None)
        pasos = [(f"{fx(L)} : (2 · 3,14)", fx(rad), f"L = 2 · π · r, así que r = L : (2 · π) = {fx(L)} : 6,28 = {resp}.")]
    else:
        dato = f"{fx(rad)} cm de radio" if tipo == "r" else f"{fx(2 * rad)} cm de diámetro"
        enun = f"Calcula la longitud de una circunferencia de {dato} (usa π = 3,14)."
        resp = u(r2(L), "cm")
        dist = [(u(r2(2 * PI * 2 * rad), "cm"), "usa_d"), (u(r2(PI * rad * rad), "cm"), "area"), (u(r2(PI * rad), "cm"), "olvida_2"), (u(r2(L) + 1, "cm"), None)]
        pasos = [(f"2 · 3,14 · {fx(rad)}", fx(r2(L)), (f"El radio es la mitad del diámetro: {fx(rad)} cm. " if tipo == "d" else "") + f"L = 2 · π · r = 2 · 3,14 · {fx(rad)} = {fx(r2(L))} cm (o π · d).")]
    adulto = "L = 2 · π · r = π · d. Si se da el diámetro, no se multiplica además por 2. πr² es el área, no la longitud."
    return mk(enun, resp, "t4_long_circ", {"r": str(rad), "tipo": tipo}, dist, pasos, adulto, genericos=var_rel(r2(L), "cm"))


@generador("t4_arco")
def gen_arco(rng, d):
    n = rng.choice([90, 180, 60, 45, 30, 120] if d < 3 else [36, 40, 72, 150, 135, 270, 20, 100])
    rad = D(rng.randint(2, 20))
    L = r2(2 * PI * rad * n / 360)
    enun = f"Calcula la longitud de un arco de {n}° en una circunferencia de {fx(rad)} cm de radio (usa π = 3,14)."
    resp = u(L, "cm")
    dist = [(u(r2(2 * PI * rad * n / 180), "cm"), "divide_180"), (u(r2(rad * n / 360), "cm"), "fraccion_radio"), (u(r2(2 * PI * rad), "cm"), None), (u(r2(PI * rad * rad * n / 360), "cm"), None)]
    pasos = [(f"2 · 3,14 · {fx(rad)}", fx(r2(2 * PI * rad)), f"Longitud de la circunferencia entera: 2 · 3,14 · {fx(rad)} = {fx(r2(2 * PI * rad))} cm."),
             (f"· {n}/360", fx(L), f"El arco es la fracción {n}/360 de la circunferencia: {fx(r2(2 * PI * rad))} · {n} : 360 = {resp}.")]
    adulto = "Arco de n° = 2πr · n/360: la vuelta completa son 360°, no 180°."
    return mk(enun, resp, "t4_arco", {"n": n, "r": str(rad)}, dist, pasos, adulto, genericos=var_rel(L, "cm"))


# ---------------------------------------------------------------- áreas

@generador("t4_area_rect")
def gen_area_rect(rng, d):
    fig = rng.choice(["cuadrado", "rectángulo"])
    if d == 3 and fig == "rectángulo":
        a = D(rng.randint(12, 60)) / 10
        bcm = rng.choice(range(20, 100, 5))
        b = D(bcm) / 100
        r = a * b
        enun = f"Un rectángulo mide {fx(a)} m de largo y {bcm} cm de ancho. ¿Cuál es su área en m²?"
        resp = u(r, "m²")
        dist = [(u(a * bcm, "m²"), None), (u(2 * (a + b), "m²"), "perimetro"), (u(r, "m"), "unidad_lineal"), (u(r * 10, "m²"), None)]
        pasos = [(f"{bcm} cm = {fx(b)} m", fx(b), f"Igualo unidades: {bcm} cm = {fx(b)} m."), (f"{fx(a)} · {fx(b)}", fx(r), f"Área = largo · ancho = {fx(a)} · {fx(b)} = {resp}.")]
    elif fig == "cuadrado":
        a = _dec(rng, d, 2, 15)
        r = a * a
        enun = f"¿Cuál es el área de un cuadrado de {fx(a)} cm de lado?"
        resp = u(r, "cm²")
        dist = [(u(2 * a, "cm²"), "lado_por_2"), (u(4 * a, "cm²"), "perimetro"), (u(r, "cm"), "unidad_lineal"), (u(r + a, "cm²"), None)]
        pasos = [(f"{fx(a)} · {fx(a)}", fx(r), f"Área del cuadrado = lado · lado = {fx(a)} · {fx(a)} = {resp}.")]
    else:
        a, b = _dec(rng, d, 3, 20), _dec(rng, d, 2, 12)
        r = a * b
        enun = f"¿Cuál es el área de un rectángulo de {fx(a)} cm de base y {fx(b)} cm de altura?"
        resp = u(r, "cm²")
        dist = [(u(2 * (a + b), "cm²"), "perimetro"), (u(r, "cm"), "unidad_lineal"), (u(a + b, "cm²"), None), (u(r / 2, "cm²"), None)]
        pasos = [(f"{fx(a)} · {fx(b)}", fx(r), f"Área del rectángulo = base · altura = {fx(a)} · {fx(b)} = {resp}.")]
    adulto = "El área se mide en unidades cuadradas: rectángulo = base · altura; cuadrado = lado² (lado · lado, no lado · 2)."
    return mk(enun, resp, "t4_area_rect", {"fig": fig}, dist, pasos, adulto)


@generador("t4_area_tri")
def gen_area_tri(rng, d):
    for _ in range(100):
        b = D(rng.randint(2, 20))
        h = D(rng.randint(2, 15))
        if d == 2:
            b = _dec(rng, 2, 2, 20)
        if (b * h) % 2 == 0 or d > 1:
            break
    r = b * h / 2
    if d == 3:
        mitad = b / 2
        lado = r2(D(math.sqrt(float(mitad * mitad + h * h))), 1)
        if lado == h:
            lado += D("0.1")
        enun = f"Un triángulo isósceles tiene lados de {fx(lado)} cm, {fx(lado)} cm y {fx(b)} cm, y la altura sobre el lado de {fx(b)} cm mide {fx(h)} cm. ¿Cuál es su área?"
        dist = [(u(b * h, "cm²"), "no_divide"), (u(b * lado / 2, "cm²"), "lado_en_vez_altura"), (u(lado * h / 2, "cm²"), None), (u(b + h, "cm²"), None)]
    else:
        enun = f"Un triángulo tiene {fx(b)} cm de base y {fx(h)} cm de altura. ¿Cuál es su área?"
        dist = [(u(b * h, "cm²"), "no_divide"), (u(b + h, "cm²"), None), (u(r + b, "cm²"), None), (u(r / 2, "cm²"), None)]
    resp = u(r, "cm²")
    pasos = [(f"{fx(b)} · {fx(h)} : 2", fx(r), f"Área del triángulo = base · altura : 2 = {fx(b)} · {fx(h)} : 2 = {resp}" + (". Los otros lados no se usan: hace falta la altura." if d == 3 else "."))]
    adulto = "Área del triángulo = base · altura / 2, con la altura perpendicular a esa base. Los lados oblicuos no sirven como altura."
    return mk(enun, resp, "t4_area_tri", {"b": str(b), "h": str(h)}, dist, pasos, adulto)


@generador("t4_area_romb")
def gen_area_romb(rng, d):
    if rng.random() < 0.5:
        D1, D2 = rng.randint(4, 20), rng.randint(3, 16)
        while D1 == D2 or (D1 * D2) % 2:
            D1, D2 = rng.randint(4, 20), rng.randint(3, 16)
        r = D1 * D2 // 2
        enun = f"¿Cuál es el área de un rombo cuyas diagonales miden {D1} cm y {D2} cm?"
        resp = f"{r} cm²"
        dist = [(f"{D1 * D2} cm²", "no_divide"), (f"{D1 + D2} cm²", None), (f"{2 * (D1 + D2)} cm²", None), (f"{r // 2} cm²" if r % 2 == 0 else f"{r + 1} cm²", None)]
        pasos = [(f"{D1} · {D2} : 2", str(r), f"Área del rombo = diagonal mayor · diagonal menor : 2 = {D1} · {D2} : 2 = {r} cm².")]
    else:
        b, h = rng.randint(4, 20), rng.randint(2, 12)
        lado = h + rng.randint(1, 5)
        r = b * h
        enun = f"Un romboide tiene {b} cm de base, {lado} cm de lado oblicuo y {h} cm de altura. ¿Cuál es su área?"
        resp = f"{r} cm²"
        dist = [(f"{b * lado} cm²", "lados"), (f"{b * h // 2} cm²" if b * h % 2 == 0 else f"{b * h + b} cm²", None), (f"{2 * (b + lado)} cm²", None), (f"{b * lado * h} cm²", None)]
        pasos = [(f"{b} · {h}", str(r), f"Área del romboide = base · altura = {b} · {h} = {r} cm². El lado oblicuo no es la altura.")]
    adulto = "Romboide: base · altura (no base · lado). Rombo: D · d / 2 (es la mitad del rectángulo que forman sus diagonales)."
    return mk(enun, resp, "t4_area_romb", {}, dist, pasos, adulto)


@generador("t4_area_poli_reg")
def gen_area_poli_reg(rng, d):
    n = rng.choice([5, 6, 8] if d < 3 else [5, 6, 7, 8, 9, 10, 12])
    tabla = {5: Decimal("0.688"), 6: Decimal("0.866"), 7: Decimal("1.038"), 8: Decimal("1.207"), 9: Decimal("1.374"), 10: Decimal("1.539"), 12: Decimal("1.866")}
    l = D(rng.randint(2, 20))
    ap = r2(l * tabla[n], 1)
    P = n * l
    r = P * ap / 2
    nom = NOMBRES_POL[n]
    enun = f"Un {nom} regular tiene {fx(l)} cm de lado y {fx(ap)} cm de apotema. ¿Cuál es su área?"
    if d == 1:
        enun = f"Un {nom} regular tiene {fx(P)} cm de perímetro y {fx(ap)} cm de apotema. ¿Cuál es su área?"
    resp = u(r, "cm²")
    dist = [(u(l * ap / 2, "cm²"), "usa_lado"), (u(P * ap, "cm²"), "no_divide"), (u(l * l, "cm²"), None), (u(P * l / 2, "cm²"), None)]
    pasos = ([] if d == 1 else [(f"{n} · {fx(l)}", fx(P), f"Perímetro: {n} · {fx(l)} = {fx(P)} cm.")]) + \
            [(f"{fx(P)} · {fx(ap)} : 2", fx(r), f"Área = perímetro · apotema : 2 = {fx(P)} · {fx(ap)} : 2 = {resp}.")]
    adulto = "Área de un polígono regular = perímetro · apotema / 2 (son n triángulos de base el lado y altura la apotema)."
    return mk(enun, resp, "t4_area_poli_reg", {"n": n, "l": str(l), "ap": str(ap)}, dist, pasos, adulto)


@generador("t4_area_circ")
def gen_area_circ(rng, d):
    rad = D(rng.randint(1, 10 if d == 1 else 20))
    if d == 3:
        rad = _dec(rng, 3, 1, 12)
    usa_d = rng.random() < (0.3 if d == 1 else 0.5)
    A = r2(PI * rad * rad)
    dato = f"{fx(2 * rad)} cm de diámetro" if usa_d else f"{fx(rad)} cm de radio"
    enun = f"Calcula el área de un círculo de {dato} (usa π = 3,14)."
    resp = u(A, "cm²")
    dist = [(u(r2(PI * 4 * rad * rad), "cm²"), "usa_diametro") if usa_d else (None, None), (u(r2(PI * 2 * rad), "cm²"), "dos_r"), (u(r2(2 * PI * rad), "cm²"), "longitud"),
            (u(r2(PI * rad), "cm²"), None), (u(A + 1, "cm²"), None)]
    pasos = [(f"3,14 · {fx(rad)}²", fx(A), (f"El radio es la mitad del diámetro: {fx(rad)} cm. " if usa_d else "") + f"Área = π · r² = 3,14 · {fx(rad)} · {fx(rad)} = {resp}.")]
    adulto = "Área del círculo = π · r² (r² = r · r, no 2 · r). Si el dato es el diámetro, primero se halla el radio."
    return mk(enun, resp, "t4_area_circ", {"r": str(rad), "da_diametro": usa_d}, dist, pasos, adulto, genericos=var_rel(A, "cm²"))


@generador("t4_trapecio")
def gen_trapecio(rng, d):
    B = _dec(rng, d, 5, 20)
    b = _dec(rng, d, 2, 12)
    while b >= B:
        b = _dec(rng, d, 2, 12)
    h = _dec(rng, 1 if d < 3 else 2, 2, 12)
    r = (B + b) * h / 2
    enun = f"Un trapecio tiene bases de {fx(B)} cm y {fx(b)} cm y una altura de {fx(h)} cm. ¿Cuál es su área?"
    resp = u(r, "cm²")
    dist = [(u(B * b * h / 2, "cm²"), "multiplica_bases"), (u((B + b) * h, "cm²"), "no_divide"), (u(B * h, "cm²"), None), (u(r + h, "cm²"), None)]
    pasos = [(f"{fx(B)} + {fx(b)}", fx(B + b), f"Sumo las bases: {fx(B)} + {fx(b)} = {fx(B + b)} cm."), (f"{fx(B + b)} · {fx(h)} : 2", fx(r), f"Área = (B + b) · h : 2 = {fx(B + b)} · {fx(h)} : 2 = {resp}.")]
    adulto = "Área del trapecio = (base mayor + base menor) · altura / 2: es como un rectángulo con la base media."
    return mk(enun, resp, "t4_trapecio", {"B": str(B), "b": str(b), "h": str(h)}, dist, pasos, adulto)


@generador("t4_sector_corona")
def gen_sector_corona(rng, d):
    if rng.random() < 0.5:
        R = rng.randint(3, 12)
        rr_ = rng.randint(1, R - 1)
        A = r2(PI * (R * R - rr_ * rr_))
        enun = f"Calcula el área de una corona circular de radios {R} cm y {rr_} cm (usa π = 3,14)."
        resp = u(A, "cm²")
        dist = [(u(r2(PI * (R - rr_) ** 2), "cm²"), "diferencia_al_cuadrado"), (u(r2(PI * R * R), "cm²"), None), (u(r2(PI * (R * R + rr_ * rr_)), "cm²"), None), (u(r2(2 * PI * (R - rr_)), "cm²"), None)]
        pasos = [(f"{R}² − {rr_}²", str(R * R - rr_ * rr_), f"Corona = círculo grande − círculo pequeño: π · ({R}² − {rr_}²) = 3,14 · ({R * R} − {rr_ * rr_}) = 3,14 · {R * R - rr_ * rr_}."),
                 ("", fx(A), f"Resultado: {resp}.")]
    else:
        n = rng.choice([90, 60, 45, 120, 30, 180] if d < 3 else [72, 40, 150, 135, 36, 270])
        rad = rng.randint(2, 12)
        A = r2(PI * rad * rad * n / 360)
        enun = f"Calcula el área de un sector circular de {n}° y {rad} cm de radio (usa π = 3,14)."
        resp = u(A, "cm²")
        dist = [(u(r2(PI * rad * rad * n / 180), "cm²"), "divide_180"), (u(r2(PI * rad * rad), "cm²"), None), (u(r2(2 * PI * rad * n / 360), "cm²"), None), (u(r2(PI * rad * n / 360), "cm²"), None)]
        pasos = [(f"3,14 · {rad}²", fx(r2(PI * rad * rad)), f"Área del círculo entero: 3,14 · {rad}² = {fx(r2(PI * rad * rad))} cm²."),
                 (f"· {n}/360", fx(A), f"El sector es la fracción {n}/360: {fx(r2(PI * rad * rad))} · {n} : 360 = {resp}.")]
    adulto = "Sector = π r² · n/360. Corona = π (R² − r²), que no es lo mismo que π (R − r)²."
    return mk(enun, resp, "t4_sector_corona", {}, dist, pasos, adulto, genericos=var_rel(A, "cm²"))


@generador("t4_dim_area")
def gen_dim_area(rng, d):
    fig = rng.choice(["cuadrado", "rectangulo"] if d == 1 else ["cuadrado", "rectangulo", "triangulo"] if d == 2 else ["triangulo", "circulo", "cuadrado"])
    if fig == "cuadrado":
        l = rng.randint(3, 20)
        A = l * l
        enun = f"Un cuadrado tiene {A} cm² de área. ¿Cuánto mide su lado?"
        resp = f"{l} cm"
        dist = [(f"{fx(D(A) / 2)} cm", "cuadrado_divide"), (f"{fx(D(A) / 4)} cm", "cuadrado_divide"), (f"{l + 1} cm", None), (f"{l * 2} cm", None)]
        pasos = [(f"√{A}", str(l), f"Lado · lado = {A}: el lado es la raíz cuadrada, √{A} = {l} cm (porque {l} · {l} = {A}).")]
    elif fig == "rectangulo":
        b, h = rng.randint(3, 15), rng.randint(2, 12)
        A = b * h
        enun = f"Un rectángulo tiene {A} cm² de área y {b} cm de base. ¿Cuánto mide su altura?"
        resp = f"{h} cm"
        dist = [(f"{A - b} cm", None), (f"{fx(D(A) / b / 2)} cm", None), (f"{A * b} cm", None), (f"{h + 1} cm", None)]
        pasos = [(f"{A} : {b}", str(h), f"Área = base · altura, así que altura = área : base = {A} : {b} = {h} cm.")]
    elif fig == "triangulo":
        b = rng.randint(2, 16)
        h = rng.randint(2, 14)
        A = D(b * h) / 2
        enun = f"Un triángulo tiene {fx(A)} cm² de área y {b} cm de base. ¿Cuánto mide su altura?"
        resp = f"{h} cm"
        dist = [(u(A / b, "cm"), "olvida_mitad"), (u(A * b / 2, "cm"), None), (u(A - b, "cm") if A > b else None, None), (f"{h + 2} cm", None)]
        pasos = [(f"2 · {fx(A)} : {b}", str(h), f"Área = base · altura : 2, así que altura = 2 · área : base = 2 · {fx(A)} : {b} = {h} cm.")]
    else:
        rad = rng.randint(2, 15)
        A = PI * rad * rad
        enun = f"Un círculo tiene {fx(A)} cm² de área. ¿Cuánto mide su radio? (usa π = 3,14)"
        resp = f"{rad} cm"
        dist = [(u(r2(A / PI / 2), "cm"), "cuadrado_divide"), (u(rad * rad, "cm"), None), (u(r2(A / (2 * PI)), "cm"), None), (f"{rad * 2} cm", None)]
        pasos = [(f"{fx(A)} : 3,14", str(rad * rad), f"r² = área : π = {fx(A)} : 3,14 = {rad * rad}."), (f"√{rad * rad}", str(rad), f"r = √{rad * rad} = {rad} cm.")]
    adulto = "Para hallar una dimensión se deshace la fórmula: en el triángulo, h = 2A/b; en el cuadrado, lado = √A (no A/2 ni A/4)."
    return mk(enun, resp, "t4_dim_area", {"fig": fig}, dist, pasos, adulto)
