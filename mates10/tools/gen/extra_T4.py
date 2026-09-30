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
