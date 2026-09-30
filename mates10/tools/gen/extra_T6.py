"""Generadores del grupo T6 (estadística y probabilidad calculables). Un generador por habilidad: t6_<habilidad>.

Cada generador acepta `tipo` (variante de pregunta; la spec la fija por dificultad con kw_por_dificultad) y usa `d`
para el tamaño de los datos. Las claves de error son descriptivas y la spec las enlaza con E01…E0n.
Los gráficos (pictogramas, barras, líneas, sectores, histogramas, cajas) se describen en texto dentro del enunciado.
"""
import math
import re
from collections import Counter
from fractions import Fraction as F
from itertools import combinations

from .nucleo import Ejercicio, generador, fmt, fdec, NOMBRES
from .fracdec import ff

# ---------------------------------------------------------------- utilidades


def gen6(nombre):
    """Como @generador, pero si `tipo` o `formato` llega como lista se elige uno al azar en cada ejercicio."""
    def deco(f):
        def envoltura(rng, d, **kw):
            kw = {k: (rng.choice(v) if isinstance(v, list) and k in ("tipo", "formato") else v) for k, v in kw.items()}
            return f(rng, d, **kw)
        envoltura.__doc__ = f.__doc__
        generador(nombre)(envoltura)
        return f
    return deco


def dec(x, nd=2):
    """Decimal con coma, redondeado a nd cifras, sin ceros sobrantes."""
    v = round(float(x), nd)
    if v == int(v):
        return fmt(int(v))
    return fdec(v)


def pc(x, nd=1):
    """Proporción → porcentaje con coma y ' %'."""
    return dec(float(x) * 100, nd) + " %"


def _valor(s):
    """Valor numérico de una opción (para no dar dos opciones con el mismo valor). None si no es numérica."""
    t = str(s).replace(" ", "").replace(" ", "").replace("−", "-").replace(",", ".").replace("≈", "")
    t = re.sub(r"(%|°|€|[a-záéíóúñ]+)$", "", t)
    try:
        if "/" in t:
            a, b = t.split("/")
            return F(int(a), int(b))
        return F(t)
    except (ValueError, ZeroDivisionError):
        return None


def hacer(enun, resp, op, par, dis, pasos, adulto, gen=(), datos=None, nino=None):
    """Construye el Ejercicio. dis: [(valor, clave)], pasos: [(operacion, resultado, texto)]."""
    par = dict(par)
    par["op"] = op
    rv = _valor(resp)
    d2 = []
    for v, k in dis:
        vs = v if isinstance(v, str) else fmt(v)
        if rv is not None and _valor(vs) == rv:
            continue
        d2.append((vs, k))
    gens = []
    for g in gen:
        gs = g if isinstance(g, str) else fmt(g)
        if rv is not None and _valor(gs) == rv:
            continue
        gens.append(gs)
    e = Ejercicio(enunciado=enun, respuesta=resp, parametros=par, distractores=d2, datos=datos)
    e.genericos = gens
    e.pasos = [{"paso": i + 1, "operacion": o, "resultado": r, "texto": t} for i, (o, r, t) in enumerate(pasos)]
    e.explicacion_nino = nino or " ".join(p["texto"] for p in e.pasos)
    e.explicacion_adulto = adulto
    return e


def lista(xs, y="y"):
    xs = [str(x) for x in xs]
    return xs[0] if len(xs) == 1 else ", ".join(xs[:-1]) + f" {y} " + xs[-1]


def cerca(v, rng, paso=1, n=4, minimo=0):
    c = [v + paso, v - paso, v + 2 * paso, v - 2 * paso, v + 3 * paso]
    rng.shuffle(c)
    return [x for x in c if x >= minimo][:n]


def Phi(z):
    """Valor de la tabla N(0,1) (z con 2 decimales, 4 decimales de probabilidad)."""
    z = round(z, 2)
    return round(0.5 * (1 + math.erf(z / math.sqrt(2))), 4)


def p4(x):
    return dec(x, 4)


CATEGORIAS = [
    ("frutas", [("🍎", "manzanas"), ("🍐", "peras"), ("🍌", "plátanos"), ("🍊", "naranjas"), ("🍓", "fresas")]),
    ("animales", [("🐶", "perros"), ("🐱", "gatos"), ("🐰", "conejos"), ("🐟", "peces"), ("🐦", "pájaros")]),
    ("juguetes", [("⚽", "balones"), ("🚗", "coches"), ("🎈", "globos"), ("🧸", "osos"), ("🪁", "cometas")]),
    ("flores", [("🌸", "flores rosas"), ("🌻", "girasoles"), ("🌷", "tulipanes"), ("🌹", "rosas"), ("🌼", "margaritas")]),
]
PARECIDOS = [(("🍊", "naranjas"), ("🍋", "limones")), (("🌹", "rosas"), ("🌷", "tulipanes")), (("🐱", "gatos"), ("🐯", "tigres"))]
MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "septiembre", "octubre", "noviembre", "diciembre"]
DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
DEPORTES = ["fútbol", "baloncesto", "natación", "tenis", "atletismo", "balonmano", "ciclismo", "voleibol"]
COLORES_F = ["rojas", "azules", "verdes", "amarillas", "negras", "blancas"]


FEMENINOS = {"manzanas", "peras", "naranjas", "fresas", "flores rosas", "rosas", "margaritas", "cometas", "entradas", "bolas"}


def fem(c):
    return c in FEMENINOS


SINGULAR = {"rojas": "roja", "azules": "azul", "verdes": "verde", "amarillas": "amarilla", "negras": "negra", "blancas": "blanca"}


def sing(c):
    return SINGULAR.get(c, c[:-1] if c.endswith("s") else c)


# ================================================================ DATOS

@gen6("t6_recuento")
def g_recuento(rng, d, tipo="cuantos"):
    """EST.DATOS.01. Claves: cuenta_dos_veces, se_salta, cuenta_todos, confunde_parecidos."""
    ncat = {1: 2, 2: 3, 3: 4}[d]
    tot_max = {1: 10, 2: 15, 3: 20}[d]
    _, cats = rng.choice(CATEGORIAS)
    cats = rng.sample(cats, ncat)
    par = None
    if d == 3 and rng.random() < 0.5:
        par = rng.choice(PARECIDOS)
        cats = [par[0], par[1]] + [c for c in cats if c[0] not in (par[0][0], par[1][0])][:ncat - 2]
    for _ in range(50):
        cuentas = [rng.randint(1, 6 if d > 1 else 5) for _ in cats]
        if sum(cuentas) <= tot_max and len(set(cuentas)) == len(cuentas):
            break
    else:
        return None
    objs = [c[0] for c, k in zip(cats, cuentas) for _ in range(k)]
    rng.shuffle(objs)
    filas = "\n".join(" ".join(objs[i:i + 6]) for i in range(0, len(objs), 6))
    i = 0 if par else rng.randrange(len(cats))
    if tipo == "mixto":
        tipo = "mas_menos" if rng.random() < 0.35 else "cuantos"
    if tipo == "mas_menos" and not par:
        mas = rng.random() < 0.5
        j = cuentas.index(max(cuentas) if mas else min(cuentas))
        otro = cuentas.index(min(cuentas) if mas else max(cuentas))
        pal = "más" if mas else "menos"
        dis = [(cats[otro][1], None)] + [(c[1], None) for k, c in enumerate(cats) if k not in (j, otro)]
        return hacer(f"Mira los dibujos:\n{filas}\n¿De qué hay {pal}?", cats[j][1], "recuento_mas", {"cuentas": cuentas},
                     dis, [("contar", str(cuentas[j]), " ".join(f"{c[1].capitalize()}: {k}." for c, k in zip(cats, cuentas))
                            + f" Hay {pal} {cats[j][1]} ({cuentas[j]}).")],
                     "Contar cada categoría por separado (tachando o con palotes) y comparar los números.",
                     gen=["hay los mismos de todos", "no se puede saber"])
    k = cuentas[i]
    dis = [(k + 1, "cuenta_dos_veces"), (k - 1 if k > 1 else k + 2, "se_salta"), (sum(cuentas), "cuenta_todos")]
    if par:
        dis.insert(2, (cuentas[0] + cuentas[1], "confunde_parecidos"))
    cu = "Cuántas" if fem(cats[i][1]) else "Cuántos"
    return hacer(f"Mira los dibujos:\n{filas}\n¿{cu} {cats[i][1]} ({cats[i][0]}) hay?", fmt(k), "recuento", {"cuentas": cuentas, "i": i}, dis,
                 [("contar", fmt(k), f"Busco solo {cats[i][1]} ({cats[i][0]}) y los voy tachando mientras cuento: hay {k}.")],
                 "Contar solo la categoría pedida, tachando cada objeto contado para no repetir ni saltar ninguno.",
                 gen=cerca(k, rng, minimo=1))


@gen6("t6_tabla_doble")
def g_tabla_doble(rng, d):
    """EST.DATOS.02. Claves: fila_de_al_lado, cambia_fila_columna, total_fila."""
    nf = {1: 2, 2: 3, 3: 4}[d]
    vmax = {1: 10, 2: 20, 3: 100}[d]
    if d < 3:
        ctx = rng.choice([("Libros leídos", "libros leyó", MESES, "en"), ("Goles marcados", "goles marcó", ["la 1.ª jornada", "la 2.ª jornada", "la 3.ª jornada", "la 4.ª jornada"], "en"),
                          ("Cromos conseguidos", "cromos consiguió", DIAS[:5], "el")])
    else:
        ctx = rng.choice([("Puntos en un videojuego", "puntos consiguió", ["la 1.ª partida", "la 2.ª partida", "la 3.ª partida", "la 4.ª partida"], "en"),
                          ("Páginas leídas", "páginas leyó", DIAS[:5], "el")])
    filas = rng.sample(NOMBRES, nf)
    cols = ctx[2][:nf] if ctx[2] is not MESES else MESES[rng.randint(0, len(MESES) - nf):][:nf]
    for _ in range(100):
        t = [[rng.randint(0, vmax) for _ in range(nf)] for _ in range(nf)]
        vals = [v for r in t for v in r]
        if len(set(vals)) == len(vals):
            break
    else:
        return None
    i, j = rng.randrange(nf), rng.randrange(nf)
    if i == j and nf > 1:
        j = (j + 1) % nf
    cab = "Nombre | " + " | ".join(c.replace("la ", "") for c in cols)
    cuerpo = "\n".join(f"{filas[r]} | " + " | ".join(str(v) for v in t[r]) for r in range(nf))
    cu = "Cuántas" if ctx[1].startswith("páginas") else "Cuántos"
    enun = f"{ctx[0]}:\n{cab}\n{cuerpo}\n¿{cu} {ctx[1]} {filas[i]} {ctx[3]} {cols[j]}?"
    ii = i + 1 if i + 1 < nf else i - 1
    dis = [(t[ii][j], "fila_de_al_lado"), (t[j][i], "cambia_fila_columna"), (sum(t[i]), "total_fila"), (t[i][(j + 1) % nf], None)]
    return hacer(enun, fmt(t[i][j]), "tabla_doble", {"tabla": t, "i": i, "j": j}, dis,
                 [("cruce", fmt(t[i][j]), f"Busco la fila de {filas[i]} y la columna de {cols[j]}; donde se cruzan pone {t[i][j]}.")],
                 "Tabla de doble entrada: el dato está en el cruce de la fila y la columna pedidas. Seguir la fila con un dedo y la columna con otro.",
                 gen=cerca(t[i][j], rng))


@gen6("t6_frec_abs")
def g_frec_abs(rng, d, tipo="frecuencia"):
    """EST.DATOS.03. Claves: valor_por_frecuencia, pierde_dato, olvida_cero."""
    if d == 1:
        vals = rng.sample(["rojo", "azul", "verde", "amarillo", "morado"], 3)
        n = rng.randint(10, 12)
        ctx = "Colores favoritos de la clase"
    else:
        vals = list(range(0, 5 if d == 2 else 6))
        n = rng.randint(15, 20) if d == 2 else rng.randint(20, 30)
        ctx = rng.choice(["Número de hermanos de cada alumno", "Número de mascotas de cada alumno", "Libros leídos este mes por cada alumno"])
    for _ in range(100):
        pesos = [rng.random() for _ in vals]
        if d == 3:
            pesos[rng.randrange(1, len(vals))] = 0
        datos = rng.choices(vals, weights=pesos, k=n)
        c = Counter(datos)
        if d < 3 and len(c) < len(vals):
            continue
        break
    txt = ", ".join(str(x) for x in datos)
    if tipo == "total":
        enun = f"{ctx}: {txt}.\nSi haces la tabla de frecuencias absolutas, ¿cuánto deben sumar todas las frecuencias?"
        return hacer(enun, fmt(n), "frec_total", {"datos": datos}, [(n - 1, "pierde_dato"), (n + 1, "pierde_dato"), (len(vals), None)],
                     [("contar datos", fmt(n), f"Las frecuencias cuentan cada dato una vez, así que suman el número total de datos: {n}.")],
                     "La suma de las frecuencias absolutas es el número total de datos N: sirve para comprobar la tabla.", gen=cerca(n, rng, 2))
    if d == 3:
        cero = [v for v in vals if c[v] == 0]
        v = cero[0] if cero and rng.random() < 0.4 else rng.choice([v for v in vals if c[v] > 0])
    else:
        v = rng.choice(vals)
    f = c[v]
    q = f"¿qué frecuencia absoluta tiene el valor {v}?" if d > 1 else f"¿qué frecuencia absoluta tiene el color {v}?"
    enun = f"{ctx}: {txt}.\nEn la tabla de frecuencias, {q}"
    dis = []
    if isinstance(v, int) and v != f:
        dis.append((v, "valor_por_frecuencia"))
    if f == 0:
        dis.append((1, "olvida_cero"))
    dis += [(f + 1, "pierde_dato"), (f - 1 if f > 0 else f + 2, "pierde_dato")]
    txt_paso = f"Cuento cuántas veces aparece el {v}: {f} veces." if f else f"El {v} no aparece ninguna vez: su frecuencia es 0 (la fila se escribe igual)."
    return hacer(enun, fmt(f), "frec_abs", {"datos": datos, "valor": v}, dis, [("contar", fmt(f), txt_paso)],
                 "Frecuencia absoluta = número de veces que aparece un valor. Tachar los datos al contarlos y comprobar que las frecuencias suman N.",
                 gen=cerca(f, rng))


@gen6("t6_frec_rel")
def g_frec_rel(rng, d, formato="fraccion"):
    """EST.DATOS.05. Claves: divide_al_reves, divide_entre_categorias, decimal_porcentaje."""
    N = rng.choice({1: [10, 20], 2: [20, 25, 40, 50], 3: [40, 50, 80, 100]}[d])
    k = rng.choice([3, 4])
    ctx = rng.choice([("Forma de ir al colegio", ["andando", "en coche", "en autobús", "en bici"]),
                      ("Deporte favorito", DEPORTES[:4]), ("Fruta preferida", ["manzana", "pera", "plátano", "naranja"])])
    for _ in range(100):
        cortes = sorted(rng.sample(range(1, N), k - 1))
        fs = [b - a for a, b in zip([0] + cortes, cortes + [N])]
        if min(fs) >= 1:
            break
    cats = ctx[1][:k]
    i = rng.randrange(k)
    f = fs[i]
    tabla = "\n".join(f"{c}: {x}" for c, x in zip(cats, fs))
    h = F(f, N)
    base = f"{ctx[0]} de {N} alumnos:\n{tabla}\n"
    if formato == "fraccion":
        enun = base + f"¿Qué fracción de los alumnos eligió «{cats[i]}»?"
        resp = f"{f}/{N}"
        dis = [(f"{N}/{f}", "divide_al_reves"), (f"{f}/{k}" if f % k else f"1/{k}", "divide_entre_categorias"), (f"{f}/{N - f}", None)]
        gen = [f"1/{f}", f"{f + 1}/{N}"]
    elif formato == "decimal":
        enun = base + f"¿Cuál es la frecuencia relativa de «{cats[i]}» escrita como número decimal?"
        resp = dec(h, 4)
        dis = [(dec(F(N, f), 2), "divide_al_reves"), (fmt(int(h * 100)) if h * 100 == int(h * 100) else dec(h * 100, 2), "decimal_porcentaje"),
               (dec(F(f, k), 2), "divide_entre_categorias")]
        gen = [dec(F(f + 1, N), 4), dec(F(f, N) * 10, 3)]
    else:
        enun = base + f"¿Qué porcentaje de los alumnos eligió «{cats[i]}»?"
        resp = pc(h, 2)
        dis = [(dec(h, 4) + " %", "decimal_porcentaje"), (pc(F(f, k), 1) if F(f, k) <= 1 else pc(F(1, k), 1), "divide_entre_categorias"),
               (dec(F(N, f), 2) + " %", "divide_al_reves"), (f"{f} %", None)]
        gen = [pc(F(f + 1, N), 2), pc(F(f, N) / 2, 2)]
    return hacer(enun, resp, "frec_rel", {"f": f, "N": N, "formato": formato}, dis,
                 [("f / N", f"{f}/{N}", f"La frecuencia relativa es la frecuencia entre el total: {f}/{N}."),
                  ("", resp, f"En decimal, {f} : {N} = {dec(h, 4)}; en porcentaje, {pc(h, 2)}.")],
                 "h = f/N (entre el total de datos, no entre el número de categorías). Todas las h suman 1, es decir, el 100 %.", gen=gen)


CTX_DISC = [("Nota del examen", 3, 10, "sacaron un {v} o menos", "sacaron al menos un {v}"),
            ("Número de hermanos", 0, 4, "tienen {v} hermanos o menos", "tienen al menos {v} hermanos"),
            ("Goles marcados en el partido del fin de semana", 0, 5, "marcaron {v} goles o menos", "marcaron al menos {v} goles"),
            ("Horas de deporte a la semana", 1, 7, "hacen {v} horas o menos", "hacen al menos {v} horas")]


def _tabla_discreta(rng, d, N):
    ctx = rng.choice(CTX_DISC)
    k = rng.randint(4, min(6, ctx[2] - ctx[1] + 1))
    lo = rng.randint(ctx[1], ctx[2] - k + 1)
    vals = list(range(lo, lo + k))
    for _ in range(200):
        cortes = sorted(rng.sample(range(1, N), k - 1))
        fs = [b - a for a, b in zip([0] + cortes, cortes + [N])]
        if min(fs) >= 1:
            return ctx, vals, fs
    return ctx, None, None


@gen6("t6_frec_acum")
def g_frec_acum(rng, d, tipo="como_mucho"):
    """EST.DATOS.08. Claves: acumula_al_reves, al_menos_como_mucho, relativa_como_absoluta."""
    N = rng.choice({1: [20, 25], 2: [30, 40, 50], 3: [40, 50, 80, 100, 200]}[d])
    ctx, vals, fs = _tabla_discreta(rng, d, N)
    if not vals:
        return None
    tabla = f"{ctx[0]} (x): " + "  ".join(str(v) for v in vals) + "\nFrecuencia (f): " + "  ".join(str(f) for f in fs)
    j = rng.randrange(1, len(vals) - 1)
    Fj = sum(fs[:j + 1])
    Fant = sum(fs[:j])
    arriba = sum(fs[j:])
    base = f"Se ha preguntado a {N} personas.\n{tabla}\n"
    if tipo == "como_mucho":
        enun = base + f"¿Cuántas personas {ctx[3].format(v=vals[j])}?"
        return hacer(enun, fmt(Fj), "frec_acum", {"vals": vals, "fs": fs, "j": j}, [(arriba, "acumula_al_reves"), (fs[j], None), (Fant, None)],
                     [("F", fmt(Fj), f"Acumulo desde el valor más pequeño: {' + '.join(map(str, fs[:j + 1]))} = {Fj}. Es F({vals[j]}).")],
                     "Frecuencia absoluta acumulada F(x): suma de las f de los valores menores o iguales que x, acumulando de menor a mayor.",
                     gen=cerca(Fj, rng))
    if tipo == "al_menos":
        enun = base + f"¿Cuántas personas {ctx[4].format(v=vals[j])}?"
        return hacer(enun, fmt(arriba), "frec_acum_sup", {"vals": vals, "fs": fs, "j": j}, [(Fj, "al_menos_como_mucho"), (N - Fj, None), (fs[j], None)],
                     [("N − F", fmt(arriba), f"«Al menos {vals[j]}» es {vals[j]} o más: N − F({vals[j - 1]}) = {N} − {Fant} = {arriba}.")],
                     "«Al menos x» = x o más = N − F(valor anterior). «Como mucho x» = F(x).", gen=cerca(arriba, rng))
    H = F(Fj, N)
    enun = base + f"¿Cuál es la frecuencia relativa acumulada H del valor {vals[j]}? (en decimal)"
    return hacer(enun, dec(H, 4), "frec_rel_acum", {"vals": vals, "fs": fs, "j": j},
                 [(Fj, "relativa_como_absoluta"), (dec(F(fs[j], N), 4), None), (dec(F(arriba, N), 4), "acumula_al_reves")],
                 [("F", fmt(Fj), f"F({vals[j]}) = {Fj}."), ("F/N", dec(H, 4), f"H = F/N = {Fj}/{N} = {dec(H, 4)}.")],
                 "H(x) = F(x)/N; siempre está entre 0 y 1 y la última vale 1.", gen=[dec(F(Fj + 1, N), 4), dec(F(Fant, N), 4)])


@gen6("t6_intervalos")
def g_intervalos(rng, d, tipo="marca"):
    """EST.DATOS.09. Claves: extremo_mal, marca_extremo, amplitud_mal."""
    if tipo == "marca":
        w = rng.choice([2, 4, 6, 10, 20]) if d == 1 else rng.choice([5, 3, 15, 0.1, 0.05])
        a = rng.randint(1, 30) * w if w >= 1 else round(rng.randint(28, 36) * w, 2)
        b = a + w
        m = (a + b) / 2
        s = lambda x: dec(x, 3)
        enun = f"¿Cuál es la marca de clase del intervalo [{s(a)}, {s(b)})?"
        return hacer(enun, s(m), "marca_clase", {"a": a, "b": b}, [(s(a), "marca_extremo"), (s(b), None), (s(w), "amplitud_mal")],
                     [("(a + b) / 2", s(m), f"La marca de clase es el punto medio: ({s(a)} + {s(b)}) : 2 = {s(m)}.")],
                     "Marca de clase = punto medio del intervalo; representa a todos los datos de la clase.", gen=[s(m + w), s(m - w)])
    if tipo == "clase":
        w = rng.choice([5, 10, 2])
        a0 = rng.randint(3, 15) * w
        k = rng.randint(4, 6)
        clases = [(a0 + i * w, a0 + (i + 1) * w) for i in range(k)]
        i = rng.randrange(1, k)
        x = clases[i][0]
        cl = lambda c: f"[{c[0]}, {c[1]})"
        enun = (f"Agrupamos unos datos en las clases {', '.join(cl(c) for c in clases)}.\n¿En qué clase se cuenta el dato {x}?")
        return hacer(enun, cl(clases[i]), "clase_dato", {"x": x}, [(cl(clases[i - 1]), "extremo_mal"), ("en las dos", "extremo_mal"),
                                                                   (cl(clases[i + 1]) if i + 1 < k else "en ninguna", None)],
                     [("[a, b)", cl(clases[i]), f"Con el convenio [a, b) el extremo izquierdo entra y el derecho no: {x} va en {cl(clases[i])}.")],
                     "Convenio [a, b): cada dato va en una sola clase; un dato que coincide con un extremo va a la clase que empieza en él.",
                     gen=["no se puede saber"])
    if tipo == "frecuencia":
        w = F(5, 100)
        a0 = F(rng.randint(28, 32) * 5, 100)
        k = 5
        lim = [a0 + i * w for i in range(k + 1)]
        c = rng.randrange(1, k - 1)
        a, b = lim[c], lim[c + 1]
        for _ in range(200):
            datos = [F(rng.randint(int(a0 * 100), int(lim[-1] * 100) - 1), 100) for _ in range(rng.randint(10, 14))]
            dentro = sum(1 for x in datos if a <= x < b)
            bord_b = sum(1 for x in datos if x == b)
            bord_a = sum(1 for x in datos if x == a)
            if bord_a + bord_b >= 1 and dentro >= 2:
                break
        else:
            return None
        s2 = lambda x: f"{float(x):.2f}".replace(".", ",")
        izq = sum(1 for x in datos if a < x <= b)
        ambos = sum(1 for x in datos if a <= x <= b)
        enun = (f"Alturas (en m) de un grupo: {'; '.join(s2(x) for x in datos)}.\nSe agrupan en clases de 5 cm: "
                + ", ".join(f"[{s2(lim[i])}; {s2(lim[i + 1])})" for i in range(k)) + f".\n¿Cuál es la frecuencia de la clase [{s2(a)}; {s2(b)})?")
        return hacer(enun, fmt(dentro), "frec_clase", {"a": str(a), "b": str(b)}, [(izq, "extremo_mal"), (ambos, "extremo_mal"), (dentro + 1, None), (dentro - 1, None)],
                     [("contar", fmt(dentro), f"Cuento los datos con {s2(a)} ≤ x < {s2(b)}: {dentro}. " +
                       (f"El dato {s2(b)} no entra: va a la clase siguiente. " if bord_b else "") + (f"El dato {s2(a)} sí entra. " if bord_a else ""))],
                     "Con el convenio [a, b), el extremo inferior pertenece a la clase y el superior no.", gen=cerca(dentro, rng))
    # amplitud
    k = rng.choice([4, 5, 6, 8])
    w = rng.choice([2, 3, 4, 5, 10])
    lo = rng.randint(2, 30) * (5 if d == 3 else 1)
    hi = lo + k * w
    enun = f"Los datos van de {lo} a {hi} y queremos {k} clases de igual amplitud que empiecen en {lo}. ¿Qué amplitud debe tener cada clase?"
    return hacer(enun, fmt(w), "amplitud", {"lo": lo, "hi": hi, "k": k}, [(k, "amplitud_mal"), (hi - lo, "amplitud_mal"), (w + 1, None)],
                 [("(máx − mín) / nº clases", fmt(w), f"Recorrido {hi} − {lo} = {hi - lo}; lo reparto en {k} clases: {hi - lo} : {k} = {w}.")],
                 "Amplitud = recorrido : número de clases (redondeando hacia arriba si no es exacta).", gen=cerca(w, rng, 1, minimo=1))


# ================================================================ GRÁFICOS

@gen6("t6_pictograma")
def g_pictograma(rng, d, tipo="cuantos"):
    """EST.GRAF.01. Claves: fila_de_al_lado, mas_por_menos."""
    nc = {1: rng.randint(2, 3) if tipo == "cuantos" else 3, 2: 4, 3: 5}[d]
    grupo, cats = rng.choice(CATEGORIAS)
    cats = rng.sample(cats, nc)
    for _ in range(100):
        vs = [rng.randint(1, 10) for _ in cats]
        if len(set(vs)) == nc:
            if tipo == "menos" and d == 3:
                s = sorted(vs)
                if s[1] - s[0] != 1:
                    continue
            break
    else:
        return None
    ctx = {"frutas": "Fruta favorita de la clase", "animales": "Animal favorito de la clase", "juguetes": "Juguete favorito de la clase",
           "flores": "Flor favorita de la clase"}[grupo]
    graf = "\n".join(f"{c[1].capitalize()}: {c[0] * v}" for c, v in zip(cats, vs))
    base = f"{ctx} (cada dibujo es 1 voto):\n{graf}\n"
    if tipo == "cuantos":
        i = rng.randrange(nc)
        ii = i + 1 if i + 1 < nc else i - 1
        return hacer(base + f"¿Cuántos votos tiene «{cats[i][1]}»?", fmt(vs[i]), "pictograma", {"vs": vs, "i": i},
                     [(vs[ii], "fila_de_al_lado"), (vs[i] + 1, None), (vs[i] - 1 if vs[i] > 1 else vs[i] + 2, None)],
                     [("contar", fmt(vs[i]), f"Cuento los dibujos de la fila de los {cats[i][1]}: {vs[i]}.")],
                     "En un pictograma de iconos de valor 1, el valor es el número de iconos de la fila.", gen=cerca(vs[i], rng, minimo=1))
    mas = tipo == "mas"
    j = vs.index(max(vs) if mas else min(vs))
    o = vs.index(min(vs) if mas else max(vs))
    pal = "más" if mas else "menos"
    return hacer(base + f"¿Qué tiene {pal} votos?", cats[j][1], "pictograma_cmp", {"vs": vs},
                 [(cats[o][1], "mas_por_menos")] + [(c[1], None) for k, c in enumerate(cats) if k not in (j, o)],
                 [("contar", fmt(vs[j]), " ".join(f"{c[1].capitalize()}: {v}." for c, v in zip(cats, vs)) + f" La que tiene {pal} es {cats[j][1]} ({vs[j]}).")],
                 "Contar los iconos de cada fila (no fiarse de la longitud) y comparar.", gen=["todos igual"])


@gen6("t6_picto_valor")
def g_picto_valor(rng, d):
    """EST.GRAF.04. Claves: ignora_leyenda, medio_vale_uno, medio_mal."""
    val = {1: 2, 2: rng.choice([5, 10]), 3: rng.choice([2, 10])}[d]
    medio = d == 3 or (d == 2 and val == 10 and rng.random() < 0.5)
    ico, cosa = rng.choice([("⚽", "niños"), ("📚", "libros"), ("🍎", "manzanas"), ("⭐", "puntos"), ("🎟️", "entradas")])
    dia = rng.choice(DIAS[:5])
    n = rng.randint(2, 6 if val < 10 else 9)
    v = n * val + (val // 2 if medio else 0)
    fila = ico * n + (" ½" + ico if medio else "")
    enun = (f"En un pictograma, cada {ico} vale {val} {cosa}" + (f" y medio {ico} (½{ico}) vale {val // 2}" if medio else "") +
            f".\nLa fila del {dia} es: {fila}\n¿{'Cuántas' if fem(cosa) else 'Cuántos'} {cosa} representa?")
    dis = [(n + (1 if medio else 0), "ignora_leyenda")]
    if medio:
        dis += [(n * val + 1, "medio_vale_uno"), (n * val, "medio_mal"), ((n + 1) * val, "medio_mal")]
    else:
        dis += [(n * val + val, None), (n + val, None), (n * val - val, None)]
    pas = f"{n} iconos × {val} = {n * val}" + (f", más medio icono ({val // 2}): {v}." if medio else ".")
    return hacer(enun, fmt(v), "picto_valor", {"n": n, "val": val, "medio": medio}, dis, [("n × valor", fmt(v), pas)],
                 "Mirar primero la leyenda: cada icono vale varias unidades; se multiplica (o se cuenta de n en n) y el medio icono vale la mitad.",
                 gen=cerca(v, rng, val))


@gen6("t6_barras_escala")
def g_barras_escala(rng, d):
    """EST.GRAF.05. Claves: cuenta_marcas, entre_mas_uno, marca_cercana."""
    s = {1: 2, 2: rng.choice([5, 10]), 3: rng.choice([2, 10])}[d]
    medio = d == 3
    m = rng.randint(2, min(9, 100 // s - 1))
    v = s * m + (s // 2 if medio else 0)
    cat = rng.choice(DEPORTES)
    esc = ", ".join(str(s * i) for i in range(4)) + "…"
    if medio:
        pos = f"acaba justo a mitad de camino entre la marca {m}.ª y la {m + 1}.ª (contando desde el 0, sin contarlo)"
    else:
        pos = f"acaba justo en la marca {m}.ª (contando desde el 0, sin contarlo)"
    enun = f"En un diagrama de barras, el eje de los votos está graduado de {s} en {s} ({esc}).\nLa barra de «{cat}» {pos}. ¿Cuántos votos tiene «{cat}»?"
    dis = [(m, "cuenta_marcas")]
    if medio:
        dis += [(s * m + 1, "entre_mas_uno"), (s * m, "marca_cercana"), (s * (m + 1), "marca_cercana")]
    else:
        dis += [(s * (m + 1), None), (s * (m - 1), None), (m + s, None)]
    pas = f"Cada marca vale {s}: la marca {m}.ª es {s} × {m} = {s * m}" + (f"; a mitad de camino hasta {s * (m + 1)} está {v}." if medio else ".")
    return hacer(enun, fmt(v), "barras_escala", {"s": s, "m": m, "medio": medio}, dis, [("escala × marcas", fmt(v), pas)],
                 "Leer la graduación del eje: cada marca vale la escala, no 1. Entre dos marcas, la mitad del salto.", gen=cerca(v, rng, s))


@gen6("t6_barras_dobles")
def g_barras_dobles(rng, d, tipo="bajo"):
    """EST.GRAF.06. Claves: confunde_series, compara_categorias, barra_mas_alta."""
    k = {1: 4, 2: 4, 3: rng.randint(5, 6)}[d]
    esc = {1: 1, 2: 2, 3: rng.choice([5, 10])}[d]
    ms = MESES[:k] if rng.random() < 0.5 else MESES[4:4 + k]
    for _ in range(300):
        a = [rng.randint(2, 12) * esc for _ in range(k)]
        b = [rng.randint(2, 12) * esc for _ in range(k)]
        dif = [abs(x - y) for x, y in zip(a, b)]
        if tipo == "bajo":
            baj = [i for i in range(k) if b[i] < a[i]]
            if len(baj) != 1 or len(set(dif)) != k:
                continue
            j = baj[0]
            peor = b.index(min(b))
            if peor == j:
                continue
        elif tipo == "diferencia":
            j = dif.index(max(dif))
            alto = max(range(k), key=lambda i: max(a[i], b[i]))
            if dif.count(max(dif)) > 1 or alto == j or max(a[alto], b[alto]) == max(max(a), max(b)) and [max(a[i], b[i]) for i in range(k)].count(max(a[alto], b[alto])) > 1:
                continue
        else:
            j = b.index(max(b))
            ja = a.index(max(a))
            if b.count(max(b)) > 1 or a.count(max(a)) > 1 or ja == j:
                continue
        break
    else:
        return None
    graf = "\n".join(f"{m}: azul {x}, naranja {y}" for m, x, y in zip(ms, a, b))
    base = f"Diagrama de barras dobles de libros prestados (barras azules = 2023, barras naranjas = 2024):\n{graf}\n"
    otros = [m for i, m in enumerate(ms) if i != j]
    if tipo == "bajo":
        return hacer(base + "¿En qué mes se prestaron menos libros en 2024 que en 2023?", ms[j], "barras_dobles", {"a": a, "b": b},
                     [(ms[peor], "compara_categorias")] + [(m, None) for m in otros],
                     [("comparar", ms[j], f"Comparo en cada mes la barra naranja con la azul: solo en {ms[j]} la naranja ({b[j]}) es más baja que la azul ({a[j]}).")],
                     "En barras dobles se compara dentro de cada categoría la barra de una serie con la de la otra, usando la leyenda.")
    if tipo == "diferencia":
        return hacer(base + "¿En qué mes hay más diferencia entre los dos años?", ms[j], "barras_dobles", {"a": a, "b": b},
                     [(ms[alto], "barra_mas_alta")] + [(m, None) for m in otros],
                     [("restar", fmt(dif[j]), "Diferencias: " + ", ".join(f"{m} {x}" for m, x in zip(ms, dif)) + f". La mayor es en {ms[j]}.")],
                     "La mayor diferencia no es la barra más alta: hay que restar las dos barras de cada mes.")
    return hacer(base + "¿En qué mes se prestaron más libros en 2024?", ms[j], "barras_dobles", {"a": a, "b": b},
                 [(ms[ja], "confunde_series")] + [(m, None) for m in otros],
                 [("leer serie", fmt(b[j]), f"2024 son las barras naranjas; la más alta es la de {ms[j]} ({b[j]}).")],
                 "Mirar la leyenda para saber qué color es cada serie antes de leer las barras.")


@gen6("t6_lineas")
def g_lineas(rng, d, tipo="valor"):
    """EST.GRAF.07. Claves: mas_alto_por_mayor_subida, eje_equivocado."""
    k = {1: 5, 2: 6, 3: 7}[d]
    for _ in range(300):
        t = [rng.randint(10, 24)]
        for _ in range(k - 1):
            t.append(max(2, min(35, t[-1] + rng.choice([-7, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 7]))))
        dif = [t[i + 1] - t[i] for i in range(k - 1)]
        if tipo == "valor" and len(set(t)) == k:
            break
        if tipo in ("maximo", "minimo") and t.count(max(t)) == 1 and t.count(min(t)) == 1:
            break
        if tipo in ("subida", "bajada"):
            ext = max(dif) if tipo == "subida" else min(dif)
            if dif.count(ext) != 1 or (ext <= 0 if tipo == "subida" else ext >= 0):
                continue
            i = dif.index(ext)
            im = t.index(max(t))
            if t.count(max(t)) == 1 and im != i + 1 and im > 0:
                break
    else:
        return None
    ds = DIAS[:k]
    graf = "  ".join(f"{dd} {x} °C" for dd, x in zip(ds, t))
    base = f"Un gráfico de líneas muestra la temperatura a mediodía durante una semana. Sus puntos son:\n{graf}\n"
    if tipo == "valor":
        i = rng.randrange(k)
        ii = i + 1 if i + 1 < k else i - 1
        return hacer(base + f"¿Qué temperatura hizo el {ds[i]}?", f"{t[i]} °C", "lineas_valor", {"t": t},
                     [(f"{t[ii]} °C", None), (f"{t[i] + 1} °C", None), (f"{t[i] - 1} °C", None)],
                     [("leer", f"{t[i]} °C", f"Busco el {ds[i]} en el eje horizontal y leo la altura del punto en el vertical: {t[i]} °C.")],
                     "Eje horizontal: el tiempo; eje vertical: la cantidad. Se localiza el día y se lee la altura del punto.",
                     gen=[f"{t[i] - 1} °C", f"{t[i] + 2} °C"])
    if tipo in ("maximo", "minimo"):
        v = max(t) if tipo == "maximo" else min(t)
        j = t.index(v)
        pal = "más calor" if tipo == "maximo" else "más frío"
        otro = t.index(min(t) if tipo == "maximo" else max(t))
        return hacer(base + f"¿Qué día hizo {pal}?", ds[j], "lineas_ext", {"t": t},
                     [(f"{v} °C", "eje_equivocado"), (ds[otro], None)] + [(dd, None) for n, dd in enumerate(ds) if n not in (j, otro)],
                     [("leer", ds[j], f"El punto {'más alto' if tipo == 'maximo' else 'más bajo'} de la línea es {v} °C, que corresponde al {ds[j]}.")],
                     "El máximo es el punto más alto de la línea; la respuesta es el día (eje horizontal), no la temperatura.")
    ext = max(dif) if tipo == "subida" else min(dif)
    i = dif.index(ext)
    par = lambda n: f"entre el {ds[n]} y el {ds[n + 1]}"
    pal = "subió" if tipo == "subida" else "bajó"
    im = t.index(max(t))
    otros = [n for n in range(k - 1) if n not in (i, im - 1)]
    rng.shuffle(otros)
    return hacer(base + f"¿Entre qué dos días seguidos {pal} más la temperatura?", par(i), "lineas_cambio", {"t": t},
                 [(par(im - 1), "mas_alto_por_mayor_subida")] + [(par(n), None) for n in otros],
                 [("restar", fmt(abs(ext)), "Cambios de un día al siguiente: " + ", ".join(f"{'+' if x > 0 else ''}{x}" for x in dif) + f". El que más {pal} es {par(i)} ({abs(ext)} °C).")],
                 "El mayor aumento se ve en el tramo más empinado, no en el punto más alto: hay que restar días seguidos.")


@gen6("t6_sectores")
def g_sectores(rng, d):
    """EST.GRAF.08. Claves: porcentaje_por_cantidad, sector_mal_estimado."""
    if d == 1:
        fr = rng.choice([[F(1, 2), F(1, 4), F(1, 4)], [F(1, 2), F(1, 2)], [F(1, 4), F(3, 4)], [F(1, 3), F(1, 3), F(1, 3)], [F(1, 2), F(1, 3), F(1, 6)]])
        N = rng.choice([12, 24, 36, 48, 60, 120])
        nom = {F(1, 2): "la mitad del círculo", F(1, 4): "un cuarto del círculo", F(3, 4): "tres cuartos del círculo",
               F(1, 3): "un tercio del círculo", F(1, 6): "un sexto del círculo"}
        desc = lambda f: nom[f]
    else:
        for _ in range(100):
            if d == 2:
                fr = [F(x, 100) for x in rng.choice([[50, 25, 15, 10], [40, 30, 20, 10], [50, 30, 20], [60, 25, 15], [25, 25, 50], [70, 20, 10]])]
                N = rng.choice([20, 40, 60, 80, 100, 200])
            else:
                cs = sorted(rng.sample(range(1, 20), 3))
                fr = [F(5 * (b - a), 100) for a, b in zip([0] + cs, cs + [20])]
                N = rng.choice([120, 160, 240, 300, 400, 500, 600, 800, 1000])
            if all((f * N).denominator == 1 for f in fr):
                break
        desc = lambda f: pc(f, 0)
    ops = rng.sample(["fútbol", "baloncesto", "natación", "tenis", "atletismo"] if rng.random() < 0.5 else
                     ["playa", "montaña", "pueblo", "ciudad", "campamento"], len(fr))
    i = rng.randrange(len(fr))
    f = fr[i]
    v = f * N
    graf = "\n".join(f"«{o}»: {desc(x)}" for o, x in zip(ops, fr))
    enun = f"En un diagrama de sectores con las respuestas de {N} personas:\n{graf}\n¿Cuántas personas eligieron «{ops[i]}»?"
    malo = {F(1, 4): F(1, 3), F(1, 3): F(1, 4), F(1, 2): F(1, 3), F(3, 4): F(2, 3), F(1, 6): F(1, 4)}.get(f, f + F(5, 100))
    dis = [(fmt(int(f * 100)) if d > 1 else fmt(int(round(f * 100))), "porcentaje_por_cantidad"), (fmt(int(malo * N)) if (malo * N).denominator == 1 else fmt(round(float(malo * N))), "sector_mal_estimado"),
           (fmt(int(N * (1 - f))), None), (fmt(int(v) + (10 if N > 100 else 2)), None)]
    txt = f"El sector de «{ops[i]}» es {desc(f)} del total: {ff(f) if d == 1 else pc(f, 0)} de {N} = {int(v)}."
    return hacer(enun, fmt(int(v)), "sectores", {"N": N, "f": str(f)}, dis, [("parte × total", fmt(int(v)), txt)],
                 "Cada sector es una fracción del total: cantidad = fracción (o porcentaje) × total de datos.",
                 gen=[fmt(int(v) + 1), fmt(int(v) * 2)])


@gen6("t6_angulo_sector")
def g_angulo_sector(rng, d):
    """EST.GRAF.09. Claves: cien_grados, absoluta_por_360, reparto_igual."""
    Ns = {1: [10, 12, 18, 20], 2: [24, 30, 36, 40, 45], 3: [60, 72, 90, 120, 180]}[d]
    for _ in range(200):
        N = rng.choice(Ns)
        k = rng.randint(3, 4)
        cs = sorted(rng.sample(range(1, N), k - 1))
        fs = [b - a for a, b in zip([0] + cs, cs + [N])]
        i = rng.randrange(k)
        ang = F(fs[i] * 360, N)
        if ang.denominator == 1 and ang != F(360, k) and min(fs) > 0:
            break
    else:
        return None
    ctx = rng.sample(DEPORTES, k)
    tabla = ", ".join(f"{c}: {x}" for c, x in zip(ctx, fs))
    enun = f"Encuesta a {N} alumnos sobre su deporte favorito: {tabla}.\n¿Cuántos grados mide el sector de «{ctx[i]}» en el diagrama de sectores?"
    pct_ = F(fs[i] * 100, N)
    dis = [(dec(pct_, 1) + "°", "cien_grados"), (fmt(fs[i] * 360) + "°", "absoluta_por_360"), (fmt(360 // k) + "°" if 360 % k == 0 else dec(F(360, k), 1) + "°", "reparto_igual")]
    return hacer(enun, fmt(int(ang)) + "°", "angulo_sector", {"f": fs[i], "N": N}, dis,
                 [("f/N · 360°", fmt(int(ang)) + "°", f"El sector ocupa la misma parte del círculo que los alumnos del total: {fs[i]}/{N} · 360° = {int(ang)}°.")],
                 "Ángulo del sector = frecuencia relativa × 360°. Los ángulos de todos los sectores suman 360°.",
                 gen=[fmt(int(ang) + 10) + "°", fmt(int(ang) * 2) + "°", fmt(abs(int(ang) - 10)) + "°"])


def _histo(rng, d):
    w = rng.choice([2, 5, 10])
    a0 = rng.randint(1, 5) * w
    k = rng.randint(4, 6)
    fs = [rng.randint(1, 12) for _ in range(k)]
    lims = [a0 + i * w for i in range(k + 1)]
    return w, lims, fs


@gen6("t6_histograma")
def g_histograma(rng, d, tipo="clase"):
    """EST.GRAF.10. Claves: barra_como_valor, extremo_mal, solo_una_clase."""
    for _ in range(100):
        w, lims, fs = _histo(rng, d)
        if len(set(fs)) >= len(fs) - 1:
            break
    k = len(fs)
    ctx, ud = rng.choice([("tiempo en una carrera", "minutos"), ("peso de unas mochilas", "kg"), ("edad de los socios de un club", "años")])
    graf = "\n".join(f"barra de {lims[i]} a {lims[i + 1]} {ud}: {fs[i]}" for i in range(k))
    base = f"Histograma del {ctx} (cada barra va desde su extremo izquierdo, incluido, hasta el derecho, sin incluir):\n{graf}\n"
    if tipo == "clase":
        i = rng.randrange(1, k)
        x = lims[i]
        enun = base + f"Un dato vale exactamente {x} {ud}. ¿Cuántos datos tiene la barra en la que está contado?"
        return hacer(enun, fmt(fs[i]), "histo_clase", {"fs": fs, "i": i}, [(fs[i - 1], "extremo_mal"), (fs[i - 1] + fs[i], None), (fs[i] + 1, None)],
                     [("[a, b)", fmt(fs[i]), f"{x} es el extremo izquierdo de la barra de {lims[i]} a {lims[i + 1]}, así que está en ella: altura {fs[i]}.")],
                     "Cada barra es un intervalo [a, b): el extremo izquierdo entra y el derecho pertenece a la barra siguiente.",
                     gen=cerca(fs[i], rng, minimo=1))
    if tipo == "tramo":
        n = 2 if d < 3 else rng.choice([2, 3])
        i = rng.randrange(0, k - n + 1)
        v = sum(fs[i:i + n])
        enun = base + f"¿Cuántos datos hay entre {lims[i]} y {lims[i + n]} {ud}?"
        return hacer(enun, fmt(v), "histo_tramo", {"fs": fs, "i": i, "n": n}, [(fs[i], "solo_una_clase"), (fs[i + n - 1], "solo_una_clase"),
                                                                             (v + (fs[i + n] if i + n < k else fs[i - 1]), None)],
                     [("sumar barras", fmt(v), f"Ese tramo ocupa {n} barras: {' + '.join(map(str, fs[i:i + n]))} = {v}.")],
                     "Un tramo más ancho que una clase se obtiene sumando las alturas de las barras que abarca.", gen=cerca(v, rng))
    i = rng.randrange(k)
    x = lims[i] + (w // 2 if w > 2 else 1)
    enun = base + f"¿Cuántos datos valen exactamente {x} {ud}?"
    return hacer(enun, "no se puede saber con el histograma", "histo_exacto", {"fs": fs, "i": i},
                 [(fmt(fs[i]), "barra_como_valor"), (fmt(fs[i] // 2 if fs[i] > 1 else fs[i] + 1), None), ("0", None)],
                 [("", "", f"La barra de {lims[i]} a {lims[i + 1]} cuenta {fs[i]} datos, pero no dice cuántos valen exactamente {x}: solo que están en ese intervalo.")],
                 "Una barra de un histograma no representa un valor, sino todos los datos de un intervalo.", gen=["1"])


@gen6("t6_poligono")
def g_poligono(rng, d, tipo="vertice"):
    """EST.GRAF.12. Claves: poligono_extremos, barras_separadas."""
    w = rng.choice([2, 4, 10, 20]) if d < 3 else rng.choice([5, 10, 3])
    a0 = rng.randint(2, 8) * w
    k = rng.randint(4, 6)
    fs = [rng.randint(2, 15) for _ in range(k)]
    lims = [a0 + i * w for i in range(k + 1)]
    mc = lambda i: F(lims[i] + lims[i + 1], 2)
    ctx = rng.choice(["Peso (kg)", "Altura (cm)", "Tiempo (min)", "Edad (años)"])
    tabla = "\n".join(f"[{lims[i]}, {lims[i + 1]}): {fs[i]}" for i in range(k))
    base = f"{ctx} agrupados en clases de igual amplitud, con su frecuencia:\n{tabla}\n"
    p = lambda x, y: f"({dec(x, 1)}, {y})"
    if tipo == "vertice":
        i = rng.randrange(k)
        enun = base + f"En el polígono de frecuencias, ¿qué punto corresponde a la clase [{lims[i]}, {lims[i + 1]})?"
        return hacer(enun, p(mc(i), fs[i]), "poligono_vertice", {"i": i}, [(p(lims[i], fs[i]), "poligono_extremos"), (p(lims[i + 1], fs[i]), None),
                                                                          (p(mc(i), fs[i] + 1), None), (p(mc(i), fs[i] + 2), None)],
                     [("(marca, f)", p(mc(i), fs[i]), f"El polígono une los puntos (marca de clase, frecuencia): la marca de [{lims[i]}, {lims[i + 1]}) es {dec(mc(i), 1)}, así que el punto es {p(mc(i), fs[i])}.")],
                     "El polígono de frecuencias une los puntos medios de los techos de las barras: (marca de clase, f).")
    if tipo == "cierre":
        ini = rng.random() < 0.5
        x = mc(0) - w if ini else mc(k - 1) + w
        enun = base + f"El polígono de frecuencias se cierra sobre el eje horizontal. ¿En qué punto se cierra por la {'izquierda' if ini else 'derecha'}?"
        return hacer(enun, p(x, 0), "poligono_cierre", {}, [(p(lims[0] if ini else lims[-1], 0), "poligono_extremos"),
                                                           (p(x, fs[0] if ini else fs[-1]), None), (p(0, 0), None)],
                     [("marca de la clase vecina", p(x, 0), f"Se añade una clase vacía {'antes' if ini else 'después'} y su marca, {dec(x, 1)}, con frecuencia 0: {p(x, 0)}.")],
                     "El polígono se cierra en las marcas de las clases vecinas (vacías) con frecuencia 0.")
    if tipo == "concentra":
        if fs.count(max(fs)) > 1:
            fs[fs.index(max(fs))] += 1
        j = fs.index(max(fs))
        tabla = "\n".join(f"[{lims[i]}, {lims[i + 1]}): {fs[i]}" for i in range(k))
        base = f"{ctx} agrupados en clases de igual amplitud, con su frecuencia:\n{tabla}\n"
        cl = lambda i: f"[{lims[i]}, {lims[i + 1]})"
        otras = [i for i in range(k) if i != j]
        rng.shuffle(otras)
        return hacer(base + "¿En qué clase está la barra más alta del histograma (donde se concentran más datos)?", cl(j), "histo_modal", {"fs": fs},
                     [(cl(i), None) for i in otras],
                     [("mayor f", cl(j), f"La barra más alta es la de mayor frecuencia: {cl(j)} con {fs[j]}.")],
                     "En un histograma de clases iguales, la altura de cada barra es la frecuencia de la clase.")
    enun = base + "Al dibujar el histograma de esta tabla, ¿cómo deben ir las barras?"
    return hacer(enun, "pegadas, una a continuación de otra", "histo_forma", {}, [("separadas por un hueco", "barras_separadas"),
                                                                                 ("con anchos distintos según la frecuencia", None),
                                                                                 ("en el orden de mayor a menor frecuencia", None)],
                 [("", "", "Las clases son intervalos seguidos ([a, b), [b, c)…), así que las barras van pegadas sin huecos y con la misma anchura.")],
                 "Histograma: barras contiguas (variable continua agrupada), de igual anchura si la amplitud es igual.")


@gen6("t6_caja")
def g_caja(rng, d, tipo="ric"):
    """EST.GRAF.14. Claves: raya_es_media, largo_mas_datos, ric_por_rango."""
    for _ in range(100):
        v = sorted(rng.sample(range(0, 41 if d > 1 else 21), 5))
        if min(b - a for a, b in zip(v, v[1:])) >= 2:
            break
    mn, q1, me, q3, mx = v
    ctx = rng.choice(["notas de un examen, sobre 40", "minutos que se tarda en llegar al instituto", "puntos conseguidos en un juego"])
    desc = f"El bigote izquierdo empieza en {mn}; la caja va de {q1} a {q3} con una raya dentro en {me}; el bigote derecho llega a {mx}."
    base = f"Diagrama de caja y bigotes ({ctx}). {desc}\n"
    if tipo == "ric":
        r = q3 - q1
        return hacer(base + "¿Cuál es el rango intercuartílico?", fmt(r), "caja_ric", {"v": v}, [(mx - mn, "ric_por_rango"), (me - q1, None), (q3 - me, None), (me, None)],
                     [("Q3 − Q1", fmt(r), f"Q1 = {q1} y Q3 = {q3} son los bordes de la caja: RIC = {q3} − {q1} = {r}.")],
                     "RIC = Q3 − Q1 (anchura de la caja, donde está el 50 % central). Rango = máx − mín.", gen=cerca(r, rng, 1, minimo=1))
    if tipo == "elemento":
        el = rng.choice([("la mediana", me), ("el primer cuartil Q1", q1), ("el tercer cuartil Q3", q3)])
        return hacer(base + f"¿Cuánto vale {el[0]}?", fmt(el[1]), "caja_elemento", {"v": v},
                     [(fmt(x), None) for x in v if x != el[1]],
                     [("leer", fmt(el[1]), f"Mínimo {mn}, Q1 {q1} (borde izquierdo de la caja), mediana {me} (raya interior), Q3 {q3} (borde derecho), máximo {mx}.")],
                     "Cinco números del diagrama: mínimo, Q1, mediana, Q3 y máximo.")
    if tipo == "raya":
        return hacer(base + "¿Qué medida representa la raya que hay dentro de la caja?", "la mediana", "caja_raya", {"v": v},
                     [("la media", "raya_es_media"), ("la moda", None), ("el rango", None)],
                     [("", "la mediana", f"La raya interior ({me}) marca la mediana: deja la mitad de los datos a cada lado.")],
                     "La caja se construye con cuartiles; la raya central es Q2 = mediana, no la media.")
    if tipo == "porcentaje":
        tramo = rng.choice([("entre " + str(q3) + " y " + str(mx) + " (el bigote derecho)", "25 %"), ("entre " + str(mn) + " y " + str(q1) + " (el bigote izquierdo)", "25 %"),
                            ("entre " + str(q1) + " y " + str(q3) + " (la caja)", "50 %"), ("entre " + str(mn) + " y " + str(me), "50 %")])
        largo = "más del 25 %" if tramo[1] == "25 %" else "más del 50 %"
        return hacer(base + f"¿Qué porcentaje aproximado de los datos está {tramo[0]}?", tramo[1], "caja_pct", {"v": v},
                     [(largo, "largo_mas_datos"), ("75 %" if tramo[1] != "75 %" else "100 %", None), ("50 %" if tramo[1] == "25 %" else "25 %", None)],
                     [("cuartos", tramo[1], "Los cuatro tramos (bigote, media caja, media caja, bigote) tienen cada uno alrededor del 25 % de los datos, aunque su longitud sea distinta.")],
                     "Cada tramo del diagrama de caja contiene un cuarto de los datos; un tramo más largo solo indica datos más dispersos.")
    # comparar dos grupos
    for _ in range(100):
        w1, w2 = rng.sample(range(3, 15), 2)
        me2 = me
        if abs(w1 - w2) >= 3:
            break
    b = [me - w2 // 2 - rng.randint(2, 5), me - w2 // 2, me, me + (w2 - w2 // 2), me + (w2 - w2 // 2) + rng.randint(2, 5)]
    a = [me - w1 // 2 - rng.randint(1, 3), me - w1 // 2, me, me + (w1 - w1 // 2), me + (w1 - w1 // 2) + rng.randint(1, 3)]
    if (a[4] - a[0] > b[4] - b[0]) == (w1 > w2):
        a[0] -= 0
    homog = "el grupo A" if w1 < w2 else "el grupo B"
    otro = "el grupo B" if w1 < w2 else "el grupo A"
    f5 = lambda x: f"mín {x[0]}, Q1 {x[1]}, Me {x[2]}, Q3 {x[3]}, máx {x[4]}"
    enun = (f"Diagramas de caja de las notas de dos grupos:\nGrupo A: {f5(a)}\nGrupo B: {f5(b)}\n"
            "¿Qué grupo tiene las notas centrales más parecidas entre sí (menos dispersas)?")
    return hacer(enun, homog, "caja_comparar", {"a": a, "b": b}, [(otro, None), ("los dos igual, porque tienen la misma mediana", None), ("no se puede saber", None)],
                 [("comparar RIC", homog, f"RIC de A = {a[3] - a[1]}, RIC de B = {b[3] - b[1]}. La caja más estrecha indica el 50 % central más agrupado: {homog}.")],
                 "Para comparar dispersión se mira la anchura de la caja (RIC); la misma mediana no implica la misma dispersión.")


# ================================================================ MEDIDAS

@gen6("t6_moda")
def g_moda(rng, d, tipo="lista"):
    """EST.MEDIDAS.01. Claves: frecuencia_por_valor, mayor_valor, una_sola_moda."""
    if tipo == "lista":
        for _ in range(200):
            n = rng.randint(7, 12)
            datos = [rng.randint(0, 5) for _ in range(n)]
            c = Counter(datos).most_common()
            if c[0][1] > c[1][1] and c[0][0] != max(datos) and c[0][1] != c[0][0] and c[0][1] != max(datos):
                break
        else:
            return None
        m, fm = c[0]
        ctx = rng.choice(["Número de hermanos de unos alumnos", "Goles marcados en varios partidos", "Número de mascotas de unos niños"])
        enun = f"{ctx}: {', '.join(map(str, datos))}.\n¿Cuál es la moda?"
        return hacer(enun, fmt(m), "moda", {"datos": datos}, [(fm, "frecuencia_por_valor"), (max(datos), "mayor_valor"), (sorted(datos)[n // 2], None)],
                     [("contar", fmt(m), "Cuento cuántas veces sale cada valor: " + ", ".join(f"el {v}, {k} veces" for v, k in sorted(Counter(datos).items())) + f". La moda es {m}.")],
                     "La moda es el valor (no la frecuencia) que más se repite.", gen=cerca(m, rng))
    colores = rng.sample(["rojo", "azul", "verde", "amarillo", "naranja", "morado"], rng.randint(4, 5))
    for _ in range(200):
        fs = [rng.randint(2, 12) for _ in colores]
        top = max(fs)
        n_top = fs.count(top)
        if (tipo == "tabla" and n_top == 1) or (tipo == "bimodal" and n_top == 2):
            break
    else:
        return None
    tabla = ", ".join(f"{c} {f}" for c, f in zip(colores, fs))
    enun = f"Color favorito (recuento de votos): {tabla}.\n¿Cuál es la moda?"
    modas = [c for c, f in zip(colores, fs) if f == top]
    otros = [c for c, f in zip(colores, fs) if f != top]
    if tipo == "tabla":
        return hacer(enun, modas[0], "moda_tabla", {"fs": fs}, [(fmt(top), "frecuencia_por_valor"), (otros[0], None), (otros[1], None)],
                     [("mayor frecuencia", modas[0], f"La frecuencia más alta es {top}, que corresponde a {modas[0]}: esa es la moda.")],
                     "La moda es el valor con mayor frecuencia; se responde con el valor (el color), no con el número de votos.")
    resp = f"{modas[0]} y {modas[1]}"
    return hacer(enun, resp, "moda_bimodal", {"fs": fs}, [(modas[0], "una_sola_moda"), (modas[1], "una_sola_moda"), (fmt(top), "frecuencia_por_valor")],
                 [("mayor frecuencia", resp, f"La frecuencia más alta es {top} y la tienen dos colores: {resp}. Hay dos modas.")],
                 "Si dos valores empatan con la frecuencia más alta, la distribución es bimodal: las dos son moda.")


@gen6("t6_media")
def g_media(rng, d):
    """EST.MEDIDAS.02 (op media). Claves: divide_mal, olvida_dividir, dato_central."""
    for _ in range(500):
        n = {1: rng.randint(2, 4), 2: rng.randint(4, 7), 3: rng.randint(4, 10)}[d]
        if d == 3 and rng.random() < 0.5:
            datos = [F(rng.randint(10, 99), 10) for _ in range(n)]
        else:
            datos = [F(rng.randint(0 if d > 1 else 1, 10 if d < 3 else 20)) for _ in range(n)]
        m = sum(datos) / n
        if d < 3 and m.denominator != 1:
            continue
        if (m * 10).denominator != 1:
            continue
        if d == 2 and 0 not in datos and rng.random() < 0.6:
            continue
        cen = datos[n // 2]
        if cen == m:
            continue
        break
    else:
        return None
    txt = "; ".join(dec(x, 1) for x in datos) if any(x.denominator != 1 for x in datos) else ", ".join(fmt(int(x)) for x in datos)
    ctx = rng.choice(["Notas de un alumno", "Puntos en varias partidas", "Litros de lluvia recogidos varios días", "Kilómetros recorridos cada día"])
    enun = f"{ctx}: {txt}.\nCalcula la media."
    nz = sum(1 for x in datos if x != 0)
    divm = (sum(datos) / nz) if 0 in datos and nz else sum(datos) / (n - 1 if n > 2 else n + 1)
    dis = [(dec(sum(datos), 1), "olvida_dividir"), (dec(divm, 2), "divide_mal"), (dec(cen, 1), "dato_central")]
    datos_json = [float(x) if x.denominator != 1 else int(x) for x in datos]
    entero = all(x.denominator == 1 for x in datos)
    return hacer(enun, dec(m, 2), "media" if entero else "media_decimales", {"datos": datos_json if entero else [dec(x, 1) for x in datos]}, dis,
                 [("sumar", dec(sum(datos), 1), f"Sumo todos los datos: {dec(sum(datos), 1)}."),
                  ("dividir", dec(m, 2), f"Divido entre el número de datos, que son {n}" + (" (el 0 también cuenta)" if 0 in datos else "") + f": {dec(sum(datos), 1)} : {n} = {dec(m, 2)}.")],
                 "Media = suma de los datos : número de datos (incluidos los ceros). Es el valor que tendría cada dato si se repartiera por igual.",
                 gen=[dec(m + 1, 2), dec(m - 1, 2), dec(m + F(1, 2), 2)])


@gen6("t6_rango")
def g_rango(rng, d):
    """EST.MEDIDAS.03. Claves: ultimo_menos_primero, maximo, negativos_mal."""
    for _ in range(300):
        n = {1: rng.randint(4, 6), 2: rng.randint(6, 9), 3: rng.randint(5, 8)}[d]
        if d == 3:
            datos = [rng.randint(-8, 15) for _ in range(n)]
            if min(datos) >= 0:
                continue
        elif d == 2 and rng.random() < 0.5:
            datos = [F(rng.randint(10, 60), 10) for _ in range(n)]
        else:
            datos = [rng.randint(1, 30) for _ in range(n)]
        r = max(datos) - min(datos)
        if datos[-1] - datos[0] == r or datos.index(max(datos)) == len(datos) - 1:
            continue
        break
    else:
        return None
    sfmt = lambda x: dec(x, 1) if isinstance(x, F) else fmt(x)
    ctx = "Temperaturas mínimas (°C) de varios días" if d == 3 else rng.choice(["Alturas de unas plantas (cm)", "Puntos obtenidos", "Minutos de lectura"])
    enun = f"{ctx}: {'; '.join(sfmt(x) for x in datos)}.\nCalcula el rango."
    dis = [(sfmt(abs(datos[-1] - datos[0])), "ultimo_menos_primero"), (sfmt(max(datos)), "maximo")]
    if d == 3:
        dis.insert(0, (sfmt(max(datos) + min(datos)) if max(datos) + min(datos) > 0 else sfmt(max(datos) - 1), "negativos_mal"))
    dis.append((sfmt(max(datos) + min(datos)), None))
    return hacer(enun, sfmt(r), "rango", {"datos": [str(x) for x in datos]}, dis,
                 [("máx − mín", sfmt(r), f"Mayor dato: {sfmt(max(datos))}. Menor dato: {sfmt(min(datos))}. Rango = {sfmt(max(datos))} − ({sfmt(min(datos))}) = {sfmt(r)}."
                   if min(datos) < 0 else f"Mayor dato: {sfmt(max(datos))}. Menor dato: {sfmt(min(datos))}. Rango = {sfmt(max(datos))} − {sfmt(min(datos))} = {sfmt(r)}.")],
                 "Rango = máximo − mínimo (buscándolos en toda la lista). Con negativos, restar un negativo es sumar su valor absoluto.",
                 gen=[sfmt(r + 1), sfmt(r - 1) if r > 1 else sfmt(r + 2)])


@gen6("t6_media_inversa")
def g_media_inversa(rng, d, tipo="falta"):
    """EST.MEDIDAS.04. Claves: promedia_medias, olvida_nuevo_n, no_detecta_imposible."""
    if tipo == "falta":
        for _ in range(300):
            n = rng.randint(3, 6)
            m = rng.randint(4, 9)
            conoc = [rng.randint(1, 10) for _ in range(n - 1)]
            x = m * n - sum(conoc)
            pm = F(sum(conoc), n - 1)
            e1 = 2 * m - pm
            if 0 <= x <= 10 and e1 != x and e1 >= 0:
                break
        else:
            return None
        enun = f"Las notas de {n} exámenes de {rng.choice(NOMBRES)} son {', '.join(map(str, conoc))} y una que falta. Su media es {m}. ¿Qué nota falta?"
        return hacer(enun, fmt(x), "media_falta", {"conoc": conoc, "m": m, "n": n},
                     [(dec(e1, 1), "promedia_medias"), (fmt(m * (n - 1) - sum(conoc)) if m * (n - 1) - sum(conoc) >= 0 else fmt(m), "olvida_nuevo_n"), (fmt(m), None)],
                     [("media × n", fmt(m * n), f"Si la media de {n} notas es {m}, entre todas suman {m} · {n} = {m * n}."),
                      ("restar", fmt(x), f"Las conocidas suman {sum(conoc)}. Falta {m * n} − {sum(conoc)} = {x}.")],
                     "Suma = media × número de datos. El dato que falta es la suma total menos la suma de los conocidos.", gen=cerca(x, rng))
    if tipo == "necesita":
        for _ in range(300):
            n = rng.randint(3, 6)
            m = rng.randint(4, 8)
            m2 = m + rng.randint(1, 2)
            x = m2 * (n + 1) - m * n
            e1 = 2 * m2 - m
            e2 = n * (m2 - m)
            posible = x <= 10
            if d == 3 and posible and rng.random() < 0.7:
                continue
            if d < 3 and not posible:
                continue
            if len({x, e1, e2}) == 3 and e2 > 0:
                break
        else:
            return None
        enun = (f"Tras {n} exámenes, la media de {rng.choice(NOMBRES)} es {m}. ¿Qué nota necesita en el siguiente examen para que su media sea {m2}?"
                + (" (Los exámenes se puntúan de 0 a 10.)" if d == 3 else ""))
        if posible:
            resp = fmt(x)
            dis = [(fmt(e1), "promedia_medias"), (fmt(e2), "olvida_nuevo_n"), (fmt(x + 1), None)]
        else:
            resp = f"es imposible: necesitaría un {x}"
            dis = [(fmt(x), "no_detecta_imposible"), (fmt(e1), "promedia_medias") if e1 <= 10 else ("un 10", None), (fmt(e2), "olvida_nuevo_n")]
        return hacer(enun, resp, "media_necesita", {"n": n, "m": m, "m2": m2}, dis,
                     [("suma actual", fmt(m * n), f"Ahora suma {m} · {n} = {m * n}."),
                      ("suma necesaria", fmt(m2 * (n + 1)), f"Con {n + 1} exámenes y media {m2} debe sumar {m2} · {n + 1} = {m2 * (n + 1)}."),
                      ("restar", fmt(x), f"Necesita {m2 * (n + 1)} − {m * n} = {x}" + ("." if posible else ", que es más de 10: es imposible."))],
                     "Trabajar con sumas (suma = media × n), recordando que al añadir un dato cambia n. Comprobar si el resultado es posible en el contexto.",
                     gen=[fmt(x - 1), fmt(m2)])
    for _ in range(300):
        n = rng.randint(3, 7)
        m = rng.randint(3, 12)
        nuevo = rng.randint(0, 25)
        m2 = F(m * n + nuevo, n + 1)
        if m2.denominator == 1 and nuevo != m:
            e1 = F(m + nuevo, 2)
            e2 = F(m * n + nuevo, n)
            if len({m2, e1, e2}) == 3:
                break
    else:
        return None
    enun = f"La media de {n} datos es {m}. Si se añade un dato más, que vale {nuevo}, ¿cuál es la nueva media?"
    return hacer(enun, fmt(int(m2)), "media_anadir", {"n": n, "m": m, "nuevo": nuevo}, [(dec(e1, 1), "promedia_medias"), (dec(e2, 2), "olvida_nuevo_n"), (fmt(m), None)],
                 [("suma", fmt(m * n), f"Suma de los {n} datos: {m} · {n} = {m * n}."),
                  ("nueva media", fmt(int(m2)), f"Nueva suma: {m * n} + {nuevo} = {m * n + nuevo}; entre {n + 1} datos: {int(m2)}.")],
                 "Al añadir un dato, la nueva media es (suma anterior + dato) : (n + 1); si el dato es mayor que la media, la media sube.",
                 gen=[fmt(int(m2) + 1), fmt(int(m2) - 1)])


@gen6("t6_mediana")
def g_mediana(rng, d):
    """EST.MEDIDAS.05 (op mediana si n impar, mediana_par si n par). Claves: sin_ordenar, un_central, media_o_moda."""
    for _ in range(500):
        n = {1: rng.choice([5, 7]), 2: rng.choice([6, 8]), 3: rng.choice([9, 10, 12, 14, 15])}[d]
        datos = [rng.randint(0, 20) for _ in range(n)]
        s = sorted(datos)
        if n % 2:
            me = F(s[n // 2])
            nc = F(datos[n // 2])
            uno = None
        else:
            me = F(s[n // 2 - 1] + s[n // 2], 2)
            nc = F(datos[n // 2 - 1] + datos[n // 2], 2)
            uno = s[n // 2 - 1]
            if d == 2 and me.denominator != 1:
                continue
            if s[n // 2 - 1] == s[n // 2]:
                continue
        media = F(sum(datos), n)
        if nc != me and media != me:
            break
    else:
        return None
    enun = f"Calcula la mediana de estos datos: {', '.join(map(str, datos))}."
    dis = [(dec(nc, 1), "sin_ordenar")]
    if uno is not None:
        dis.append((fmt(uno), "un_central"))
        dis.append((fmt(s[n // 2]), "un_central"))
    dis.append((dec(media, 2), "media_o_moda"))
    pas = [("ordenar", ", ".join(map(str, s)), f"Ordeno: {', '.join(map(str, s))}.")]
    if n % 2:
        pas.append(("central", dec(me, 1), f"Hay {n} datos (impar): el central es el {n // 2 + 1}.º, que vale {dec(me, 1)}."))
    else:
        pas.append(("media de los centrales", dec(me, 1), f"Hay {n} datos (par): los centrales son el {n // 2}.º y el {n // 2 + 1}.º ({s[n // 2 - 1]} y {s[n // 2]}); su media es {dec(me, 1)}."))
    return hacer(enun, dec(me, 1), "mediana" if n % 2 else "mediana_par", {"datos": datos}, dis, pas,
                 "Mediana: ordenar primero; si n es impar, el dato central; si n es par, la media de los dos centrales.",
                 gen=[dec(me + 1, 1), dec(me - 1, 1) if me >= 1 else dec(me + 2, 1)])


def _tabla_frec(rng, N, k=4, lo=0):
    for _ in range(300):
        cs = sorted(rng.sample(range(1, N), k - 1))
        fs = [b - a for a, b in zip([0] + cs, cs + [N])]
        if min(fs) >= 1 and fs.count(max(fs)) == 1:
            return list(range(lo, lo + k)), fs
    return None, None


@gen6("t6_centrales_tabla")
def g_centrales_tabla(rng, d, tipo="media"):
    """EST.MEDIDAS.06. Claves: sin_ponderar, media_frecuencias, mediana_frecuencias, moda_frecuencia."""
    for _ in range(300):
        N = rng.choice([20, 25, 30, 40, 50] if d < 3 else [40, 50, 80, 100, 200])
        k = rng.randint(4, 5)
        xs, fs = _tabla_frec(rng, N, k, rng.choice([0, 1]))
        if not xs:
            continue
        media = F(sum(x * f for x, f in zip(xs, fs)), N)
        if tipo == "media" and (media * 100).denominator != 1:
            continue
        Fa = [sum(fs[:i + 1]) for i in range(k)]
        pos = N / 2
        if tipo == "mediana":
            if pos in Fa:
                continue
            me = next(x for x, c in zip(xs, Fa) if c > pos)
            mf = sorted(fs)[k // 2] if k % 2 else F(sorted(fs)[k // 2 - 1] + sorted(fs)[k // 2], 2)
            if mf == me:
                continue
        break
    else:
        return None
    ctx = rng.choice(["Número de hermanos", "Número de libros leídos en verano", "Goles por partido", "Número de mascotas"])
    tabla = f"{ctx} (x): " + "  ".join(map(str, xs)) + "\nFrecuencia (f): " + "  ".join(map(str, fs))
    base = f"{tabla}\n"
    if tipo == "media":
        return hacer(base + "Calcula la media.", dec(media, 2), "media_tabla", {"xs": xs, "fs": fs},
                     [(dec(F(sum(xs), k), 2), "sin_ponderar"), (dec(F(N, k), 2), "media_frecuencias"), (dec(sum(x * f for x, f in zip(xs, fs)), 0), None)],
                     [("Σ x·f", fmt(sum(x * f for x, f in zip(xs, fs))), "Multiplico cada valor por su frecuencia y sumo: " + " + ".join(f"{x}·{f}" for x, f in zip(xs, fs)) + f" = {sum(x * f for x, f in zip(xs, fs))}."),
                      ("÷ N", dec(media, 2), f"Divido entre N = {N}: media = {dec(media, 2)}.")],
                     "Media con tabla: Σ xi·fi / N, ponderando cada valor por su frecuencia.", gen=[dec(media + F(1, 2), 2), dec(media + 1, 2)])
    if tipo == "mediana":
        Fa = [sum(fs[:i + 1]) for i in range(k)]
        return hacer(base + "¿Cuál es la mediana?", fmt(me), "mediana_tabla", {"xs": xs, "fs": fs},
                     [(dec(mf, 1), "mediana_frecuencias"), (fmt(xs[fs.index(max(fs))]) if xs[fs.index(max(fs))] != me else fmt(me + 1), None), (fmt(xs[k // 2]) if xs[k // 2] != me else fmt(me - 1 if me > 0 else me + 2), None)],
                     [("acumuladas", " ".join(map(str, Fa)), f"Frecuencias acumuladas: {', '.join(map(str, Fa))}. N/2 = {dec(pos, 1)}."),
                      ("primera F > N/2", fmt(me), f"La primera acumulada que supera {dec(pos, 1)} es la del valor {me}: la mediana es {me}.")],
                     "Mediana con tabla: la primera frecuencia acumulada que supera N/2 (si coincide exactamente, media con el valor siguiente).",
                     gen=[fmt(me + 2)])
    mo = xs[fs.index(max(fs))]
    return hacer(base + "¿Cuál es la moda?", fmt(mo), "moda_tabla", {"xs": xs, "fs": fs},
                 [(fmt(max(fs)), "moda_frecuencia"), (fmt(xs[-1]) if xs[-1] != mo else fmt(xs[0]), None), (fmt(xs[k // 2]) if xs[k // 2] != mo else fmt(xs[1]), None)],
                 [("mayor f", fmt(mo), f"La frecuencia más alta es {max(fs)}, que corresponde al valor {mo}.")],
                 "Moda: el valor con mayor frecuencia (se responde el valor, no la frecuencia).", gen=cerca(mo, rng))


@gen6("t6_cuartiles")
def g_cuartiles(rng, d, tipo="lista"):
    """EST.MEDIDAS.08. Claves: sin_ordenar, posicion_por_valor, percentil_como_nota."""
    if tipo == "percentil":
        p = rng.choice([25, 50, 75, 80, 90, 95])
        cosa = rng.choice([("altura", "mide", f"que mide {p} cm"), ("peso", "pesa", f"que pesa {p} kg"), ("nota en una prueba", "saca", f"que ha acertado el {p} % de las preguntas")])
        enun = f"{rng.choice(NOMBRES)} está en el percentil {p} de {cosa[0]} entre los chicos y chicas de su edad. ¿Qué significa?"
        resp = f"que el {p} % de su edad {cosa[1]} lo mismo o menos"
        return hacer(enun, resp, "percentil_sentido", {"p": p},
                     [(cosa[2], "percentil_como_nota"), (f"que el {p} % de su edad {cosa[1]} más", None), (f"que ocupa el puesto {p} de la lista", "posicion_por_valor")],
                     [("", resp, f"El percentil {p} es el valor que deja por debajo (o igual) al {p} % de los datos.")],
                     "Percentil k: valor que deja el k % de los datos por debajo o igual. No es una nota ni un porcentaje de aciertos.")
    for _ in range(300):
        N = {1: rng.choice([8, 12, 16]), 2: rng.choice([10, 11, 13, 14, 15]), 3: rng.choice([20, 24, 30, 40])}[d] if tipo == "tabla" else rng.choice([8, 10, 11, 12, 13, 15, 16])
        q = rng.choice([1, 3])
        if tipo == "tabla":
            xs, fs = _tabla_frec(rng, N, rng.randint(4, 6), rng.choice([0, 1, 4]))
            if not xs:
                continue
            datos = [x for x, f in zip(xs, fs) for _ in range(f)]
        else:
            datos = [rng.randint(1, 30) for _ in range(N)]
        s = sorted(datos)
        pos = F(q * N, 4)
        if pos.denominator == 1:
            val = F(s[int(pos) - 1] + s[int(pos)], 2)
        else:
            val = F(s[math.ceil(pos) - 1])
        nosort = datos[math.ceil(pos) - 1]
        pos_txt = math.ceil(pos)
        if val != pos_txt and (tipo == "tabla" or (val != nosort and len(set(datos)) > N // 2)):
            break
    else:
        return None
    Q = f"Q{q}"
    if tipo == "tabla":
        Fa = [sum(fs[:i + 1]) for i in range(len(fs))]
        enun = "Valor (x): " + "  ".join(map(str, xs)) + "\nFrecuencia (f): " + "  ".join(map(str, fs)) + f"\nCalcula el cuartil {Q}."
        dis = [(fmt(pos_txt), "posicion_por_valor"), (fmt(xs[fs.index(max(fs))]) if xs[fs.index(max(fs))] != val else fmt(val + 1), None),
               (fmt(s[min(N - 1, math.ceil(pos))]) if s[min(N - 1, math.ceil(pos))] != val else fmt(val - 1), None)]
        pas = [("posición", dec(pos, 2), f"{q}·N/4 = {q}·{N}/4 = {dec(pos, 2)}. Acumuladas: {', '.join(map(str, Fa))}."),
               ("leer", dec(val, 1), f"El primer valor cuya F supera (o alcanza) {dec(pos, 2)} da {Q} = {dec(val, 1)}.")]
    else:
        enun = f"Datos: {', '.join(map(str, datos))}.\nCalcula el cuartil {Q} (posición {q}·N/4; si sale exacta, media de ese dato y el siguiente)."
        dis = [(dec(nosort, 1), "sin_ordenar"), (fmt(pos_txt), "posicion_por_valor"), (fmt(s[math.ceil(pos)]) if s[math.ceil(pos)] != val else fmt(val + 1), None)]
        pas = [("ordenar", ", ".join(map(str, s)), f"Ordeno los datos: {', '.join(map(str, s))}."),
               ("posición", dec(pos, 2), f"{q}·N/4 = {q}·{N}/4 = {dec(pos, 2)}" + (f": es exacta, tomo la media de los datos {int(pos)}.º y {int(pos) + 1}.º." if pos.denominator == 1 else f": tomo el dato {math.ceil(pos)}.º.")),
               ("valor", dec(val, 1), f"{Q} = {dec(val, 1)}.")]
    return hacer(enun, dec(val, 1), "cuartil", {"datos": datos, "q": q}, dis, pas,
                 "Cuartiles: ordenar, calcular la posición k·N/4 y leer el valor que ocupa esa posición (no la posición).", gen=[dec(val + 2, 1), dec(val + 3, 1)])


@gen6("t6_agrupados")
def g_agrupados(rng, d, tipo="media"):
    """EST.MEDIDAS.09. Claves: extremo_por_marca, modal_central, divide_clases."""
    for _ in range(300):
        w = rng.choice([2, 4, 10, 20])
        a0 = rng.randint(1, 10) * w
        k = 5
        N = rng.choice([20, 25, 40, 50, 80, 100])
        xs, fs = _tabla_frec(rng, N, k, 0)
        if not xs:
            continue
        lims = [a0 + i * w for i in range(k + 1)]
        ms = [F(lims[i] + lims[i + 1], 2) for i in range(k)]
        media = sum(m * f for m, f in zip(ms, fs)) / N
        j = fs.index(max(fs))
        if tipo == "media" and (media * 100).denominator != 1:
            continue
        if tipo == "modal" and j == k // 2:
            continue
        Fa = [sum(fs[:i + 1]) for i in range(k)]
        cm = next(i for i, c in enumerate(Fa) if c >= F(N, 2))
        if tipo == "mediana" and (cm == j or Fa[cm] == F(N, 2)) and rng.random() < 0.7:
            continue
        break
    else:
        return None
    ctx = rng.choice(["Alturas (cm)", "Pesos (kg)", "Tiempos (s)", "Edades (años)"])
    cl = lambda i: f"[{lims[i]}, {lims[i + 1]})"
    tabla = "\n".join(f"{cl(i)}: {fs[i]}" for i in range(k))
    base = f"{ctx} de {N} personas, agrupadas:\n{tabla}\n"
    if tipo == "media":
        sm = sum(m * f for m, f in zip(ms, fs))
        return hacer(base + "Calcula la media usando las marcas de clase.", dec(media, 2), "media_agrupada", {"lims": lims, "fs": fs},
                     [(dec(F(sum(l * f for l, f in zip(lims, fs)), N), 2), "extremo_por_marca"), (dec(sm / k, 2), "divide_clases"), (dec(sum(ms) / k, 2), None)],
                     [("marcas", ", ".join(dec(m, 1) for m in ms), "Marcas de clase (puntos medios): " + ", ".join(dec(m, 1) for m in ms) + "."),
                      ("Σ c·f / N", dec(media, 2), f"Σ c·f = {dec(sm, 1)}; entre N = {N}: media = {dec(media, 2)}.")],
                     "Con datos agrupados cada clase se representa por su marca: media = Σ ci·fi / N.", gen=[dec(media + w, 2), dec(media - w, 2)])
    if tipo == "modal":
        return hacer(base + "¿Cuál es la clase modal?", cl(j), "clase_modal", {"fs": fs},
                     [(cl(k // 2), "modal_central")] + [(cl(i), None) for i in range(k) if i not in (j, k // 2)][:2],
                     [("mayor f", cl(j), f"La clase con mayor frecuencia ({fs[j]}) es {cl(j)}.")],
                     "Clase modal: la de mayor frecuencia (con amplitudes iguales), no la que está en el centro de la tabla.")
    Fa = [sum(fs[:i + 1]) for i in range(k)]
    otras = [i for i in range(k) if i not in (cm, j)]
    rng.shuffle(otras)
    return hacer(base + "¿En qué clase está la mediana?", cl(cm), "clase_mediana", {"fs": fs},
                 [(cl(j), None)] + [(cl(i), None) for i in otras],
                 [("acumuladas", ", ".join(map(str, Fa)), f"Frecuencias acumuladas: {', '.join(map(str, Fa))}. N/2 = {dec(F(N, 2), 1)}."),
                  ("primera ≥ N/2", cl(cm), f"La primera acumulada que llega a {dec(F(N, 2), 1)} es la de {cl(cm)}: es la clase mediana.")],
                 "Clase mediana: la primera cuya frecuencia acumulada alcanza N/2.")


def _datos_var(rng, d, sd_entera):
    for _ in range(3000):
        n = rng.randint(4, 6) if d == 1 else rng.randint(5, 8)
        datos = [rng.randint(1, 15) for _ in range(n)]
        m = F(sum(datos), n)
        if m.denominator != 1:
            continue
        var = F(sum((x - m) ** 2 for x in datos), n)
        if var.denominator != 1 or var == 0:
            continue
        r = math.isqrt(int(var))
        if sd_entera and r * r != var:
            continue
        if len(set(datos)) < 3:
            continue
        return datos, m, var
    return None, None, None


@gen6("t6_varianza")
def g_varianza(rng, d, tipo="varianza"):
    """EST.MEDIDAS.10. Claves: sin_cuadrado, varianza_por_desviacion, sin_restar_media2, sin_ponderar."""
    if tipo == "tabla":
        for _ in range(3000):
            xs = sorted(rng.sample(range(0, 11), 3))
            fs = [rng.randint(1, 6) for _ in xs]
            N = sum(fs)
            m = F(sum(x * f for x, f in zip(xs, fs)), N)
            var = F(sum(f * (x - m) ** 2 for x, f in zip(xs, fs)), N)
            r = math.isqrt(int(var)) if var.denominator == 1 else 0
            if m.denominator == 1 and var.denominator == 1 and r * r == var and var > 0:
                break
        else:
            return None
        sp = F(sum((x - m) ** 2 for x in xs), len(xs))
        enun = "Valor (x): " + "  ".join(map(str, xs)) + "\nFrecuencia (f): " + "  ".join(map(str, fs)) + "\nCalcula la desviación típica."
        sx2 = F(sum(f * x * x for x, f in zip(xs, fs)), N)
        return hacer(enun, fmt(r), "desviacion_tabla", {"xs": xs, "fs": fs}, [(fmt(int(var)), "varianza_por_desviacion"), (dec(sp, 2), "sin_ponderar"),
                                                                            (dec(math.sqrt(sx2), 2), "sin_restar_media2")],
                     [("media", fmt(m), f"Media = Σx·f/N = {sum(x * f for x, f in zip(xs, fs))}/{N} = {m}."),
                      ("varianza", fmt(int(var)), f"Varianza = Σf·(x − x̄)²/N = {int(var)}."),
                      ("raíz", fmt(r), f"Desviación típica = √{int(var)} = {r}.")],
                     "σ² = Σ fi(xi − x̄)²/N (ponderando por la frecuencia); σ = √σ².", gen=[fmt(r + 1), fmt(r + 2)])
    datos, m, var = _datos_var(rng, d, tipo == "desviacion")
    if not datos:
        return None
    n = len(datos)
    sx2 = F(sum(x * x for x in datos), n)
    desv = " + ".join(f"({x} − {m})²" for x in datos)
    pasos = [("media", fmt(m), f"Media = {sum(datos)}/{n} = {m}."),
             ("varianza", fmt(int(var)), f"Varianza = [{desv}] / {n} = {int(var)}.")]
    base = f"Datos: {', '.join(map(str, datos))}.\n"
    if tipo == "varianza":
        return hacer(base + "Calcula la varianza.", fmt(int(var)), "varianza", {"datos": datos},
                     [("0", "sin_cuadrado"), (dec(sx2, 2), "sin_restar_media2"), (dec(math.sqrt(var), 2), None), (dec(F(sum(abs(x - m) for x in datos), n), 2), None)],
                     pasos, "Varianza: media de los cuadrados de las desviaciones respecto a la media (o Σx²/N − x̄²).", gen=[fmt(int(var) + 1), fmt(int(var) * 2)])
    r = math.isqrt(int(var))
    return hacer(base + "Calcula la desviación típica.", fmt(r), "desviacion", {"datos": datos},
                 [(fmt(int(var)), "varianza_por_desviacion"), ("0", "sin_cuadrado"), (dec(math.sqrt(sx2), 2), "sin_restar_media2")],
                 pasos + [("raíz", fmt(r), f"Desviación típica = √{int(var)} = {r}.")],
                 "σ es la raíz cuadrada de la varianza; mide cuánto se separan los datos de la media, en las mismas unidades.", gen=[fmt(r + 1), fmt(r + 2)])


@gen6("t6_cv")
def g_cv(rng, d, tipo="calcular"):
    """EST.MEDIDAS.12. Claves: compara_sigma, divide_al_reves, usa_varianza."""
    if tipo == "calcular":
        for _ in range(300):
            m = rng.choice([4, 5, 8, 10, 12, 16, 20, 25, 40, 50, 60, 80]) if d == 1 else rng.randint(10, 90)
            s = rng.randint(1, max(2, m // 3))
            cv = F(s, m)
            if d == 1 and (cv * 100).denominator != 1:
                continue
            if s * s != m and s != m:
                break
        ctx = rng.choice([("Precio de un producto en varias tiendas", "€"), ("Peso de unas cajas", "kg"), ("Tiempo de espera en una consulta", "min")])
        enun = f"{ctx[0]}: media {m} {ctx[1]}, desviación típica {s} {ctx[1]}. Calcula el coeficiente de variación (en %)" + (", redondeado a las décimas." if d > 1 else ".")
        resp = pc(cv, 1 if d > 1 else 0)
        return hacer(enun, resp, "cv", {"m": m, "s": s}, [(pc(F(m, s), 1), "divide_al_reves"), (pc(F(s * s, m), 1), "usa_varianza"), (pc(F(s, 100), 1), None)],
                     [("σ / x̄", dec(cv, 4), f"CV = σ / x̄ = {s} / {m} = {dec(cv, 4)}"), ("× 100", resp, f"En porcentaje: {resp}.")],
                     "CV = σ/x̄: dispersión relativa a la media, sin unidades; sirve para comparar grupos con medias o unidades distintas.",
                     gen=[pc(cv * 2, 1), pc(cv / 2, 1)])
    g = rng.choice([("recién nacidos", "kg", (2.8, 3.6), (0.12, 0.2), "adultos", "kg", (60, 80), (0.07, 0.11), "Peso"),
                    ("becarios", "€", (600, 900), (0.1, 0.2), "directivos", "€", (4000, 6000), (0.04, 0.08), "Sueldo mensual"),
                    ("corredores de 100 m", "s", (12, 15), (0.08, 0.12), "corredores de maratón", "min", (180, 240), (0.03, 0.06), "Tiempo")])
    m1 = round(rng.uniform(*g[2]), 1 if g[2][1] < 50 else -1)
    s1 = round(m1 * rng.uniform(*g[3]), 2 if m1 < 10 else 1 if m1 < 100 else 0)
    m2 = round(rng.uniform(*g[6]), 0 if g[6][1] < 1000 else -2)
    s2 = round(m2 * rng.uniform(*g[7]), 0)
    cv1, cv2 = s1 / m1, s2 / m2
    if cv1 <= cv2 + 0.02 or s1 <= 0:
        return None
    grupos = (g[0], g[4])
    enun = (f"{g[8]} de {g[0]}: media {dec(m1, 2)} {g[1]}, σ = {dec(s1, 2)} {g[1]}.\n{g[8]} de {g[4]}: media {fmt(int(m2))} {g[5]}, σ = {fmt(int(s2))} {g[5]}.\n"
            "¿Qué grupo es relativamente más disperso?")
    resp = f"los {grupos[0]}, porque su CV es mayor"
    return hacer(enun, resp, "cv_comparar", {"m1": m1, "s1": s1, "m2": m2, "s2": s2},
                 [(f"los {grupos[1]}, porque su σ es mayor", "compara_sigma"), ("los dos por igual, porque las σ son proporcionales", None),
                  (f"los {grupos[1]}, porque su media es mayor", None)],
                 [("CV", pc(cv1, 1), f"CV de {grupos[0]} = {dec(s1, 2)}/{dec(m1, 2)} = {pc(cv1, 1)}; CV de {grupos[1]} = {fmt(int(s2))}/{fmt(int(m2))} = {pc(cv2, 1)}. Mayor CV, más dispersión relativa.")],
                 "Con medias o unidades distintas no se comparan las σ directamente, sino el coeficiente de variación σ/x̄.")


# ================================================================ AZAR Y PROBABILIDAD

def _bolsa_txt(cs):
    partes = [f"{n} {'bola' if n == 1 else 'bolas'} {sing(c) if n == 1 else c}" for c, n in cs if n]
    return lista(partes)


@gen6("t6_suceso_tipo")
def g_suceso_tipo(rng, d):
    """EST.AZAR.02. Claves: probable_es_seguro, poco_probable_imposible."""
    disp = rng.choice(["bolsa", "dado", "ruleta", "moneda"] if d > 1 else ["bolsa", "dado"])
    clave_seg = clave_imp = None
    if disp == "bolsa":
        cols = rng.sample(COLORES_F, 3)
        caso = rng.choice(["seguro", "posible_mucho", "posible_poco", "imposible"])
        if caso == "seguro":
            cs = [(cols[0], rng.randint(2, 8))]
            suc = f"sacar una bola {sing(cols[0])}"
        elif caso == "imposible":
            cs = [(cols[0], rng.randint(1, 6)), (cols[1], rng.randint(1, 6))]
            suc = f"sacar una bola {sing(cols[2])}"
        else:
            a, b = rng.randint(4, 9), 1
            cs = [(cols[0], a), (cols[1], b)]
            suc = f"sacar una bola {sing(cols[0])}" if caso == "posible_mucho" else f"sacar una bola {sing(cols[1])}"
            clave_seg = "probable_es_seguro" if caso == "posible_mucho" else None
            clave_imp = "poco_probable_imposible" if caso == "posible_poco" else None
        situ = f"En una bolsa hay {_bolsa_txt(cs)}. Se saca una bola sin mirar."
    elif disp == "dado":
        k = rng.randint(1, 6)
        opciones = [("sacar un número menor que 7", "seguro"), ("sacar un número del 1 al 6", "seguro"), (f"sacar un {k}", "posible"),
                    ("sacar un 7", "imposible"), ("sacar un 0", "imposible"), ("sacar un número par", "posible"), ("sacar un número mayor que 6", "imposible"),
                    ("sacar un número menor que 6", "posible_mucho"), ("sacar un número mayor que 1", "posible_mucho")]
        suc, caso = rng.choice(opciones)
        if caso == "posible_mucho":
            clave_seg = "probable_es_seguro"
        if suc == f"sacar un {k}":
            clave_imp = "poco_probable_imposible"
        situ = "Se lanza un dado normal de seis caras."
    elif disp == "ruleta":
        cols = rng.sample(["roja", "azul", "verde", "amarilla"], 3)
        n = rng.choice([4, 6, 8])
        a = rng.randint(1, n)
        if a == n:
            situ = f"Una ruleta tiene {n} sectores iguales, todos de color {cols[0]}."
            suc, caso = rng.choice([(f"que salga {cols[0]}", "seguro"), (f"que salga {cols[1]}", "imposible")])
        else:
            situ = f"Una ruleta tiene {n} sectores iguales: {a} de color {cols[0]} y {n - a} de color {cols[1]}."
            suc, caso = rng.choice([(f"que salga {cols[0]}", "posible"), (f"que salga {cols[2]}", "imposible"), (f"que salga {cols[1]}", "posible")])
            if caso == "posible":
                mayor = a if cols[0] in suc else n - a
                if mayor * 2 > n:
                    clave_seg = "probable_es_seguro"
                elif mayor == 1:
                    clave_imp = "poco_probable_imposible"
    else:
        situ = "Se lanza una moneda al aire."
        suc, caso = rng.choice([("que salga cara o cruz", "seguro"), ("que salga cara", "posible"), ("que salga cruz", "posible"), ("que salga un 5", "imposible")])
    caso_r = "posible" if caso.startswith("posible") else caso
    enun = f"{situ} ¿Cómo es el suceso «{suc}»?"
    dis = []
    for c in ("seguro", "posible", "imposible"):
        if c == caso_r:
            continue
        k = clave_seg if c == "seguro" else clave_imp if c == "imposible" else None
        dis.append((c, k))
    expl = {"seguro": "Ocurre siempre, salga lo que salga: es seguro.", "imposible": "No puede ocurrir nunca: es imposible.",
            "posible": "Puede ocurrir y puede no ocurrir: es posible (aunque sea muy probable o poco probable, no es seguro ni imposible)."}[caso_r]
    return hacer(enun, caso_r, "suceso_tipo", {"caso": caso_r}, dis, [("", caso_r, expl)],
                 "Seguro: ocurre siempre; imposible: nunca; posible: a veces. «Muy probable» sigue siendo posible, y «poco probable» no es imposible.",
                 gen=["no se puede saber"], datos={"opciones_fijas": True})


@gen6("t6_comparar_azar")
def g_comparar_azar(rng, d, tipo="mismo"):
    """EST.AZAR.03. Claves: solo_favorables, todo_igual."""
    c1, c2 = rng.sample(COLORES_F, 2)
    if tipo == "mismo":
        a, b = rng.randint(1, 9), rng.randint(1, 9)
        if rng.random() < 0.2:
            b = a
        enun = f"En una bolsa hay {_bolsa_txt([(c1, a), (c2, b)])}. Si sacas una sin mirar, ¿qué es más probable?"
        opts = [f"sacar una bola {sing(c1)}", f"sacar una bola {sing(c2)}", "las dos cosas son igual de probables"]
        resp = opts[0] if a > b else opts[1] if b > a else opts[2]
        dis = [(o, "todo_igual" if o == opts[2] else None) for o in opts if o != resp]
        return hacer(enun, resp, "azar_cmp", {"a": a, "b": b}, dis,
                     [("comparar", resp, f"Hay {a} {c1} y {b} {c2}. " + ("Cuantas más bolas de un color, más fácil es que salga." if a != b else "Hay las mismas de cada color: es igual de probable."))],
                     "En un mismo experimento, es más probable el suceso con más casos favorables.", gen=["no se puede saber, es cuestión de suerte"],
                     datos={"opciones_fijas": True})
    igual = rng.choice(["fav", "desf"])
    x = rng.randint(2, 6)
    y1, y2 = rng.sample(range(1, 9), 2)
    if igual == "fav":
        A, B = [(c1, x), (c2, y1)], [(c1, x), (c2, y2)]
        mejor = "la bolsa A" if y1 < y2 else "la bolsa B"
        razon = f"En las dos hay {x} {c1}, pero en {mejor} hay menos bolas {c2} que estorben."
    else:
        A, B = [(c1, y1), (c2, x)], [(c1, y2), (c2, x)]
        mejor = "la bolsa A" if y1 > y2 else "la bolsa B"
        razon = f"En las dos hay {x} {c2}, pero en {mejor} hay más bolas {c1}."
    enun = f"Bolsa A: {_bolsa_txt(A)}. Bolsa B: {_bolsa_txt(B)}.\n¿En qué bolsa es más fácil sacar una bola {sing(c1)}?"
    otra = "la bolsa B" if mejor == "la bolsa A" else "la bolsa A"
    dis = [("en las dos igual", "solo_favorables" if igual == "fav" else "todo_igual"), (otra, None), ("no se puede saber, es cuestión de suerte", "todo_igual")]
    return hacer(enun, mejor, "azar_cmp_bolsas", {"A": A, "B": B}, dis, [("comparar", mejor, razon)],
                 "Si los casos favorables son iguales, gana la bolsa con menos desfavorables; si los desfavorables son iguales, la que tiene más favorables.",
                 datos={"opciones_fijas": True})


ESCALA = ["imposible", "poco probable", "igual de probable que no", "muy probable", "seguro"]
RECTA = ["en el 0", "entre 0 y 1/2", "en 1/2", "entre 1/2 y 1", "en el 1"]


@gen6("t6_escala")
def g_escala(rng, d, tipo="verbal"):
    """EST.AZAR.04. Claves: igual_por_posible, escala_invertida, poco_imposible."""
    n = rng.choice([4, 6, 8, 10])
    col, otro = rng.sample(["verde", "rojo", "azul", "amarillo", "blanco"], 2)
    a = rng.randint(0, n)
    if rng.random() < 0.3:
        a = rng.choice([0, n, n // 2])
    situ = (f"Una ruleta tiene {n} sectores iguales: {a} de color {col} y {n - a} de color {otro}." if 0 < a < n else
            f"Una ruleta tiene {n} sectores iguales, todos de color {col if a == n else otro}.")
    i = 0 if a == 0 else 4 if a == n else 2 if 2 * a == n else 1 if 2 * a < n else 3
    if tipo == "verbal":
        enun = f"{situ} ¿Cómo es que salga {col}?"
        resp = ESCALA[i]
        dis = []
        if i == 1:
            dis.append(("imposible", "poco_imposible"))
        if i in (1, 3):
            dis.append(("igual de probable que no", "igual_por_posible"))
        dis += [(e, None) for e in ESCALA if e != resp and e not in [x for x, _ in dis]]
        dis = dis[:3]
        return hacer(enun, resp, "escala_verbal", {"a": a, "n": n}, dis,
                     [("comparar con la mitad", resp, f"Salen {a} sectores de {n}; " + ["ninguno: imposible.", "menos de la mitad: poco probable.", "justo la mitad: igual de probable que no.",
                                                                                      "más de la mitad: muy probable.", "todos: seguro."][i])],
                     "Escala: imposible (0) – poco probable – igual (1/2) – muy probable – seguro (1). Se compara lo favorable con la mitad del total.",
                     datos={"opciones_fijas": True})
    enun = f"{situ} En una recta de probabilidad del 0 al 1, ¿dónde situarías «que salga {col}»?"
    resp = RECTA[i]
    dis = [(RECTA[4 - i], "escala_invertida")] if i != 2 else []
    if i == 1:
        dis.append((RECTA[0], "poco_imposible"))
    dis += [(r, None) for r in RECTA if r != resp and r not in [x for x, _ in dis]]
    return hacer(enun, resp, "escala_recta", {"a": a, "n": n}, dis[:3],
                 [("", resp, "0 es imposible, 1/2 igual de probable que no y 1 seguro. " + ["Ningún sector: en el 0.", "Menos de la mitad de sectores: entre 0 y 1/2.",
                                                                                            "La mitad de sectores: en 1/2.", "Más de la mitad: entre 1/2 y 1.", "Todos los sectores: en el 1."][i])],
                 "En la recta de probabilidad, lo imposible está en 0 y lo seguro en 1; cuanto más probable, más a la derecha.", datos={"opciones_fijas": True})


BARAJA = {"un oro": (10, "oros"), "una copa": (10, "copas"), "una figura (sota, caballo o rey)": (12, "figuras"), "un as": (4, "ases"), "un rey": (4, "reyes"),
          "un número menor que 4 (as, 2 o 3)": (12, "cartas menores que 4")}


@gen6("t6_laplace")
def g_laplace(rng, d, tipo="simple"):
    """EST.PROB.01 (op laplace). Claves: favorables_entre_desfavorables, solo_favorables."""
    if tipo == "comparar":
        for _ in range(200):
            a1, t1 = rng.randint(2, 8), rng.randint(4, 12)
            a2, t2 = rng.randint(2, 10), rng.randint(4, 15)
            if a1 < t1 and a2 < t2 and a2 > a1 and F(a1, t1) > F(a2, t2) and F(a1, t1) != F(a2, t2):
                break
        else:
            return None
        c1, c2 = rng.sample(COLORES_F, 2)
        A, B = ("A", a1, t1), ("B", a2, t2)
        if rng.random() < 0.5:
            A, B = ("A", a2, t2), ("B", a1, t1)
        mejor = A if F(A[1], A[2]) > F(B[1], B[2]) else B
        peor = B if mejor is A else A
        enun = (f"Bolsa A: {A[1]} bolas {c1} y {A[2] - A[1]} {c2}. Bolsa B: {B[1]} bolas {c1} y {B[2] - B[1]} {c2}.\n"
                f"¿En qué bolsa es más probable sacar una bola {sing(c1)}?")
        resp = f"en la bolsa {mejor[0]} ({mejor[1]}/{mejor[2]} frente a {peor[1]}/{peor[2]})"
        return hacer(enun, resp, "laplace_comparar", {"A": list(A[1:]), "B": list(B[1:])},
                     [(f"en la bolsa {peor[0]}, porque tiene más bolas {c1}", "solo_favorables"), ("en las dos igual", None),
                      (f"en la bolsa {peor[0]} ({peor[1]}/{peor[2] - peor[1]} frente a {mejor[1]}/{mejor[2] - mejor[1]})", "favorables_entre_desfavorables")],
                     [("Laplace", resp, f"P en A = {A[1]}/{A[2]} ≈ {dec(F(A[1], A[2]), 2)}; P en B = {B[1]}/{B[2]} ≈ {dec(F(B[1], B[2]), 2)}. Es mayor en la bolsa {mejor[0]}.")],
                     "Para comparar bolsas con totales distintos hay que comparar las fracciones favorables/posibles, no solo los favorables.",
                     datos={"opciones_fijas": True})
    exp = rng.choice(["bolsa", "dado", "ruleta"] if d == 1 else ["bolsa", "ruleta", "baraja", "dado"])
    if exp == "bolsa":
        cs = rng.sample(COLORES_F, 3)
        ns = [rng.randint(1, 8), rng.randint(1, 8), rng.randint(0, 6) if d > 1 else 0]
        fav, tot = ns[0], sum(ns)
        situ = f"En una bolsa hay {_bolsa_txt(list(zip(cs, ns)))}."
        q = f"sacar una bola {sing(cs[0])}"
    elif exp == "dado":
        suc = rng.choice([("un número par", 3), ("un múltiplo de 3", 2), ("un número mayor que 4", 2), ("un número menor que 3", 2), ("un 5", 1), ("un número primo", 3)])
        situ, q, fav, tot = "Se lanza un dado de seis caras.", f"sacar {suc[0]}", suc[1], 6
    elif exp == "ruleta":
        n = rng.choice([8, 10, 12, 20])
        k = rng.choice([2, 3, 4, 5])
        fav = n // k
        situ, q, tot = f"Una ruleta tiene {n} sectores iguales numerados del 1 al {n}.", f"que salga un múltiplo de {k}", n
    else:
        nom, (fav, _) = rng.choice(list(BARAJA.items()))
        situ, q, tot = "Se saca una carta de una baraja española de 40 cartas.", f"sacar {nom}", 40
    if fav == 0 or fav == tot:
        return None
    enun = f"{situ} ¿Qué probabilidad hay de {q}?"
    p = F(fav, tot)
    return hacer(enun, ff(p), "laplace", {"fav": fav, "tot": tot},
                 [(ff(F(fav, tot - fav)), "favorables_entre_desfavorables"), (ff(F(1, tot)), None), (ff(F(tot - fav, tot)), None), (f"{fav}", None)],
                 [("favorables / posibles", ff(p), f"Casos favorables: {fav}. Casos posibles: {tot}. P = {fav}/{tot}" + (f" = {ff(p)}." if ff(p) != f"{fav}/{tot}" else "."))],
                 "Regla de Laplace (resultados igual de probables): P = casos favorables / casos posibles.", gen=[ff(F(fav + 1, tot)), ff(F(fav, tot + 1))])


@gen6("t6_espacio")
def g_espacio(rng, d, tipo="suceso"):
    """EST.PROB.02. Claves: solo_favorables, olvida_resultado, imposible_mal."""
    conj = lambda xs: "{" + ", ".join(map(str, xs)) + "}"
    if tipo == "suceso":
        n = rng.choice([6, 8, 9, 10, 12, 15])
        exp = "Se lanza un dado de seis caras." if n == 6 else f"Se gira una ruleta con los números del 1 al {n}."
        k = rng.randint(2, n - 2)
        suc = rng.choice([("sacar par", lambda x: x % 2 == 0), ("sacar impar", lambda x: x % 2 == 1), ("sacar múltiplo de 3", lambda x: x % 3 == 0),
                          (f"sacar un número mayor que {k}", lambda x: x > k), (f"sacar un número menor que {k}", lambda x: x < k),
                          ("sacar un número primo", lambda x: x in (2, 3, 5, 7, 11, 13)), ("sacar múltiplo de 4", lambda x: x % 4 == 0)])
        xs = [x for x in range(1, n + 1) if suc[1](x)]
        if not xs or len(xs) == n:
            return None
        falta = xs[:-1] if len(xs) > 1 else xs + [xs[0] + 1]
        otro = [x for x in range(1, n + 1) if not suc[1](x)]
        return hacer(f"{exp} Escribe el suceso A = «{suc[0]}» como conjunto.", conj(xs), "suceso_conjunto", {"n": n},
                     [(conj(falta), "olvida_resultado"), (conj(otro), None), (conj(range(1, n + 1)), None)],
                     [("elegir resultados", conj(xs), f"De los resultados 1 a {n}, cumplen «{suc[0]}»: {conj(xs)}.")],
                     "Un suceso es el conjunto de resultados del espacio muestral que lo cumplen.")
    if tipo == "espacio":
        exp = rng.choice(["monedas", "ruleta", "moneda_dado", "ruleta"] if d > 1 else ["ruleta"])
        if exp == "monedas":
            E = ["CC", "CX", "XC", "XX"]
            return hacer("Se lanzan dos monedas (C = cara, X = cruz). ¿Cuál es el espacio muestral?", conj(E), "espacio", {},
                         [(conj(["CC", "CX", "XX"]), "olvida_resultado"), (conj(["C", "X"]), None), (conj(["CC", "XX"]), None)],
                         [("árbol", conj(E), "Primera moneda C o X; para cada una, la segunda C o X: CC, CX, XC y XX (CX y XC son distintos).")],
                         "Espacio muestral: todos los resultados posibles; con un árbol no se olvida ninguno.")
        if exp == "moneda_dado":
            k = rng.choice([3, 4, 5, 6])
            E = [f"{m}{i}" for m in "CX" for i in range(1, k + 1)]
            return hacer(f"Se lanza una moneda (C o X) y se gira una ruleta con los números del 1 al {k}. ¿Cuál es el espacio muestral?", conj(E), "espacio", {"k": k},
                         [(conj(E[:k] + E[k:-1]), "olvida_resultado"), (conj(["C", "X"] + list(range(1, k + 1))), None), (conj(E[:k]), None)],
                         [("árbol", conj(E), f"Para cada cara de la moneda hay {k} números: {2 * k} resultados.")],
                         "Espacio muestral de un experimento compuesto: todas las parejas posibles.")
        n = rng.randint(5, 12)
        k = rng.choice([2, 3, 4])
        A = [x for x in range(1, n + 1) if x % k == 0]
        return hacer(f"Se gira una ruleta con los números del 1 al {n}. Nos interesa el suceso A = «múltiplo de {k}». ¿Cuál es el espacio muestral E?",
                     conj(range(1, n + 1)), "espacio", {"n": n},
                     [(conj(A), "solo_favorables"), (conj(range(1, n)), "olvida_resultado"), (conj(range(0, n + 1)), None)],
                     [("todos los resultados", conj(range(1, n + 1)), f"E contiene todos los resultados posibles del experimento, no solo los de A: del 1 al {n}.")],
                     "El espacio muestral son todos los resultados posibles; el suceso es una parte de él.")
    n = rng.choice([6, 8, 9, 10, 12])
    exp = "Se lanza un dado de seis caras." if n == 6 else f"Se gira una ruleta con los números del 1 al {n}."
    if rng.random() < 0.6:
        m = n + rng.randint(1, 5)
        return hacer(f"{exp} ¿Cómo se escribe el suceso «sacar un {m}»?", "∅ (suceso imposible)", "imposible_conjunto", {"n": n},
                     [(conj([m]), "imposible_mal"), ("{0}", "imposible_mal"), (conj(range(1, n + 1)), None)],
                     [("", "∅", f"Ningún resultado del 1 al {n} es {m}: el suceso no tiene elementos, es el conjunto vacío ∅ (imposible).")],
                     "Suceso imposible = conjunto vacío ∅; suceso seguro = el espacio muestral completo E.")
    return hacer(f"{exp} ¿Cómo se escribe el suceso «sacar un número menor que {n + 1}»?", f"{conj(range(1, n + 1))} = E (suceso seguro)", "seguro_conjunto", {"n": n},
                 [("∅ (suceso imposible)", None), (conj(range(1, n)), "olvida_resultado"), (conj([n + 1]), "imposible_mal")],
                 [("", "E", f"Todos los resultados del 1 al {n} son menores que {n + 1}: es el espacio muestral completo, el suceso seguro.")],
                 "Suceso seguro = E (todos los resultados); suceso imposible = ∅.")


@gen6("t6_contrario")
def g_contrario(rng, d, tipo="describir"):
    """EST.PROB.03. Claves: otro_suceso, olvida_frontera, inverso."""
    if tipo == "describir":
        n = rng.choice([6, 8, 10])
        exp = "Se lanza un dado de seis caras." if n == 6 else f"Se gira una ruleta con los números del 1 al {n}."
        k = rng.randint(2, n - 2)
        tip = rng.choice(["mayor", "menor", "par"])
        if tip == "mayor":
            suc, resp = f"sacar un número mayor que {k}", f"sacar un número menor o igual que {k}"
            dis = [(f"sacar un número menor que {k}", "olvida_frontera"), (f"sacar un {k + 1}", "otro_suceso"), (f"sacar un número mayor que {k + 1}", None)]
        elif tip == "menor":
            suc, resp = f"sacar un número menor que {k}", f"sacar un número mayor o igual que {k}"
            dis = [(f"sacar un número mayor que {k}", "olvida_frontera"), (f"sacar un {k - 1}", "otro_suceso"), (f"sacar un número menor que {k - 1}", None)]
        else:
            suc, resp = "sacar un número par", "sacar un número impar"
            dis = [("sacar un 1", "otro_suceso"), ("sacar un múltiplo de 3", "otro_suceso"), ("sacar un número par mayor que 2", None)]
        return hacer(f"{exp} ¿Cuál es el suceso contrario de «{suc}»?", resp, "contrario", {"n": n, "k": k}, dis,
                     [("", resp, f"El contrario de A ocurre exactamente cuando A no ocurre: todos los demás resultados. Contrario de «{suc}»: «{resp}».")],
                     "El contrario de A contiene todos los resultados que no están en A; ojo con el valor frontera (mayor que 4 ↔ menor o igual que 4).")
    if tipo == "fraccion":
        den = rng.randint(3, 12)
        num = rng.randint(1, den - 1)
        p = F(num, den)
        ctx = rng.choice(["llueva mañana", "gane el equipo local", "salga premio en una rifa", "el autobús llegue tarde"])
        enun = f"La probabilidad de que {ctx} es {ff(p)}. ¿Cuál es la probabilidad de que no {ctx.replace('llueva', 'llueva') }?"
        r = 1 - p
        return hacer(enun, ff(r), "contrario_p", {"p": str(p)}, [(ff(1 / p), "inverso"), (ff(p), None), (ff(F(1, p.denominator)), None)],
                     [("1 − p", ff(r), f"P(no A) = 1 − P(A) = 1 − {ff(p)} = {ff(r)}.")],
                     "P(A) + P(contrario de A) = 1, así que P(no A) = 1 − P(A).", gen=[ff(F(num + 1, den + 1)), ff(F(den - num, den + 1))])
    # al menos: contar lo contrario
    exp = rng.choice(["dado", "decimal"])
    if exp == "decimal":
        p = F(rng.randint(5, 95), 100)
        ctx = rng.choice(["un tren llegue puntual", "un aparato funcione un año sin averías", "un alumno apruebe el examen"])
        enun = f"La probabilidad de que {ctx} es {dec(p, 2)}. ¿Cuál es la probabilidad del suceso contrario?"
        r = 1 - p
        return hacer(enun, dec(r, 2), "contrario_p", {"p": str(p)}, [(dec(1 / p, 2), "inverso"), (dec(p, 2), None), (dec(r + F(1, 10), 2) if r < F(9, 10) else dec(r - F(1, 10), 2), None)],
                     [("1 − p", dec(r, 2), f"P(contrario) = 1 − {dec(p, 2)} = {dec(r, 2)}.")], "P(no A) = 1 − P(A).")
    k = rng.randint(2, 5)
    enun = f"Se lanza un dado de seis caras. ¿Qué probabilidad hay de NO sacar un número mayor que {k}? (Piensa en el contrario.)"
    r = F(k, 6)
    return hacer(enun, ff(r), "contrario_p", {"k": k}, [(ff(F(6 - k, 6)), None), (ff(F(6, 6 - k)), "inverso"), (ff(F(k - 1, 6)), "olvida_frontera")],
                 [("contrario", ff(F(6 - k, 6)), f"P(mayor que {k}) = {6 - k}/6."), ("1 − p", ff(r), f"P(no) = 1 − {6 - k}/6 = {k}/6 = {ff(r)}.")],
                 "P(no A) = 1 − P(A); «no mayor que k» es «menor o igual que k».")


@gen6("t6_frecuencial")
def g_frecuencial(rng, d, tipo="estimar"):
    """EST.PROB.04. Claves: uno_entre_n, pocos_ensayos_exacto, divide_al_reves."""
    if tipo == "estimar":
        n = rng.choice([100, 200, 250, 400, 500, 1000] if d > 1 else [100, 200, 50])
        obj = rng.choice([("una chincheta", "caiga con la punta hacia arriba", 2), ("un vaso de plástico", "caiga de pie", 3), ("un dado trucado", "salga un 6", 6)])
        for _ in range(100):
            k = rng.randint(int(n * 0.15), int(n * 0.8))
            if (F(k, n) * 100).denominator == 1 and F(k, n) != F(1, obj[2]):
                break
        enun = f"Se ha lanzado {obj[0]} {n} veces y en {k} de ellas ha ocurrido que {obj[1]}. ¿Qué probabilidad estimas para ese suceso?"
        p = F(k, n)
        return hacer(enun, dec(p, 2), "frecuencial", {"k": k, "n": n}, [(dec(F(1, obj[2]), 2), "uno_entre_n"), (dec(F(n, k), 2), "divide_al_reves"), (dec(F(k, n - k), 2), None)],
                     [("f/N", dec(p, 2), f"Frecuencia relativa = {k}/{n} = {dec(p, 2)}. Con muchos lanzamientos es una buena estimación de la probabilidad.")],
                     "Si los resultados no son equiprobables, la probabilidad se estima con la frecuencia relativa de muchos ensayos.", gen=[dec(p + F(1, 10), 2)])
    if tipo == "laplace_si":
        ok = rng.choice(["sacar un 3 con un dado normal", "que salga cara en una moneda normal", "sacar una bola roja de una bolsa con bolas iguales de varios colores",
                         "que salga el 7 en una ruleta de 10 sectores iguales"])
        malos = [("que una chincheta caiga con la punta hacia arriba", "uno_entre_n"), ("que un dado trucado saque un 6", None),
                 ("que salga rojo en una ruleta con un sector rojo de media rueda y dos sectores pequeños", "uno_entre_n"),
                 ("que un vaso de plástico caiga de pie", "uno_entre_n"), ("que mañana llueva", None)]
        rng.shuffle(malos)
        return hacer("¿En cuál de estas situaciones se puede calcular la probabilidad con la regla de Laplace?", ok, "laplace_si", {}, malos[:3],
                     [("", ok, "Laplace solo vale si todos los resultados son igual de probables; en las otras hay resultados más probables que otros y hay que experimentar.")],
                     "Regla de Laplace: solo con resultados equiprobables. Si no, probabilidad frecuencial (experimentar muchas veces).")
    n = rng.choice([10, 12, 20])
    k = rng.randint(n // 2 + 1, n - 1)
    enun = f"Lanzamos una chincheta {n} veces y cae de punta hacia arriba {k} veces. ¿Qué podemos decir de la probabilidad de ese suceso?"
    resp = f"que es aproximadamente {dec(F(k, n), 2)}, pero con tan pocos lanzamientos la estimación es poco fiable"
    return hacer(enun, resp, "pocos_ensayos", {"k": k, "n": n},
                 [(f"que es exactamente {dec(F(k, n), 2)}", "pocos_ensayos_exacto"), ("que es 1/2, porque hay dos posiciones", "uno_entre_n"),
                  (f"que es {dec(F(n, k), 2)}", "divide_al_reves")],
                 [("", resp, "La frecuencia relativa se acerca a la probabilidad cuando el número de ensayos es grande; con pocos solo da una idea.")],
                 "Ley de los grandes números: la estimación frecuencial mejora al aumentar el número de ensayos.")


@gen6("t6_union")
def g_union(rng, d, tipo="union"):
    """EST.PROB.05. Claves: sin_restar_interseccion, y_por_o, incompatibles_multiplica."""
    if d == 3:
        for _ in range(100):
            pa, pb = F(rng.randint(2, 7), 10), F(rng.randint(2, 7), 10)
            pi = F(rng.randint(1, 5), 20)
            if pi < min(pa, pb) and pa + pb - pi <= 1 and pa * pb != pi:
                break
        u = pa + pb - pi
        enun = f"P(A) = {dec(pa, 2)}, P(B) = {dec(pb, 2)} y P(A ∩ B) = {dec(pi, 2)}. Calcula P(A ∪ B)."
        return hacer(enun, dec(u, 2), "union", {"pa": str(pa), "pb": str(pb), "pi": str(pi)},
                     [(dec(pa + pb, 2), "sin_restar_interseccion"), (dec(pi, 2), "y_por_o"), (dec(pa * pb, 2), "incompatibles_multiplica")],
                     [("P(A)+P(B)−P(A∩B)", dec(u, 2), f"P(A ∪ B) = {dec(pa, 2)} + {dec(pb, 2)} − {dec(pi, 2)} = {dec(u, 2)}.")],
                     "P(A ∪ B) = P(A) + P(B) − P(A ∩ B): la intersección se ha contado dos veces.", gen=[dec(u + F(1, 10), 2)])
    if d == 1 or rng.random() < 0.4:
        n = rng.choice([6, 8, 9, 10, 12, 15, 20])
        exp = "Se lanza un dado de seis caras." if n == 6 else f"Se gira una ruleta con los números del 1 al {n}."
        k = rng.choice([3, 4, 5])
        m = rng.randint(2, n - 2)
        evs = [("sacar par", {x for x in range(1, n + 1) if x % 2 == 0}), ("sacar impar", {x for x in range(1, n + 1) if x % 2}),
               (f"sacar múltiplo de {k}", {x for x in range(1, n + 1) if x % k == 0}), (f"sacar más de {m}", {x for x in range(m + 1, n + 1)}),
               (f"sacar menos de {m}", set(range(1, m)))]
        (nA, A), (nB, B) = rng.sample(evs, 2)
        if not A or not B:
            return None
        tot = n
    else:
        exp = "Se saca una carta de una baraja española de 40 cartas (4 palos de 10: as, 2 a 7, sota, caballo y rey)."
        cartas = [(p, v) for p in ["oros", "copas", "espadas", "bastos"] for v in range(1, 11)]
        evs = [(f"sacar {p}", {c for c in cartas if c[0] == p}) for p in ["oros", "copas", "espadas", "bastos"]]
        evs2 = [("sacar figura (sota, caballo o rey)", {c for c in cartas if c[1] >= 8}), ("sacar as", {c for c in cartas if c[1] == 1}),
                ("sacar una carta menor que 4", {c for c in cartas if c[1] <= 3}), ("sacar rey", {c for c in cartas if c[1] == 10}),
                ("sacar un 2, 4 o 6", {c for c in cartas if c[1] in (2, 4, 6)}), ("sacar sota o caballo", {c for c in cartas if c[1] in (8, 9)})]
        nA, A = rng.choice(evs)
        nB, B = rng.choice(evs2)
        tot = 40
    I = A & B
    U = A | B
    if tipo == "interseccion":
        enun = f"{exp} ¿Qué probabilidad hay de «{nA}» y a la vez «{nB}»?"
        return hacer(enun, ff(F(len(I), tot)), "interseccion", {"nA": len(A), "nB": len(B), "nI": len(I), "tot": tot},
                     [(ff(F(len(U), tot)), "y_por_o"), (ff(F(len(A), tot) * F(len(B), tot)), "incompatibles_multiplica"), (ff(F(len(A) + len(B), tot)), None)],
                     [("contar A ∩ B", ff(F(len(I), tot)), f"Resultados que cumplen las dos cosas: {len(I)}. P(A ∩ B) = {len(I)}/{tot}.")],
                     "A ∩ B: se cumplen A y B a la vez; A ∪ B: se cumple al menos uno de los dos.", gen=[ff(F(len(I) + 1, tot))])
    enun = f"{exp} ¿Qué probabilidad hay de «{nA}» o «{nB}»?"
    return hacer(enun, ff(F(len(U), tot)), "union", {"nA": len(A), "nB": len(B), "nI": len(I), "tot": tot},
                 [(ff(F(len(A) + len(B), tot)), "sin_restar_interseccion"), (ff(F(len(I), tot)), "y_por_o"), (ff(F(len(A), tot) * F(len(B), tot)), "incompatibles_multiplica")],
                 [("P(A) + P(B) − P(A∩B)", ff(F(len(U), tot)), f"P(A ∪ B) = {len(A)}/{tot} + {len(B)}/{tot} − {len(I)}/{tot} = {len(U)}/{tot}" + (f" = {ff(F(len(U), tot))}." if ff(F(len(U), tot)) != f"{len(U)}/{tot}" else "."))],
                 "P(A ∪ B) = P(A) + P(B) − P(A ∩ B); si A y B son incompatibles, P(A ∩ B) = 0.", gen=[ff(F(len(U) + 1, tot))])


@gen6("t6_compuesto")
def g_compuesto(rng, d, tipo="moneda_dado"):
    """EST.PROB.06. Claves: suma_en_rama, olvida_ramas, no_equiprobables."""
    if tipo == "moneda_dado":
        k = rng.randint(1, 6)
        cara = rng.choice(["cara", "cruz"])
        suc = rng.choice([(f"un {k}", 1), ("un número par", 3), ("un número mayor que 4", 2), ("un múltiplo de 3", 2)])
        p = F(1, 2) * F(suc[1], 6)
        enun = f"Se lanza una moneda y un dado. ¿Qué probabilidad hay de sacar {cara} y {suc[0]}?"
        return hacer(enun, ff(p), "compuesto", {"p": str(p)}, [(ff(F(1, 2) + F(suc[1], 6)), "suma_en_rama"), (ff(F(suc[1], 8)), "no_equiprobables"), (ff(F(1, 2)), None)],
                     [("producto en la rama", ff(p), f"P({cara}) = 1/2; P({suc[0]}) = {ff(F(suc[1], 6))}. Son independientes: 1/2 · {ff(F(suc[1], 6))} = {ff(p)}.")],
                     "En un árbol de etapas independientes se multiplica a lo largo de la rama.", gen=[ff(F(suc[1], 12) + F(1, 12)), ff(F(1, 6))])
    if tipo == "dos_dados":
        s = rng.choice([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
        fav = sum(1 for i in range(1, 7) for j in range(1, 7) if i + j == s)
        p = F(fav, 36)
        enun = f"Se lanzan dos dados y se suman los puntos. ¿Qué probabilidad hay de que la suma sea {s}?"
        return hacer(enun, ff(p), "dos_dados", {"s": s}, [(ff(F(1, 11)), "no_equiprobables"), (ff(F(fav, 36) / 2) if fav > 1 else ff(F(2, 36)), "olvida_ramas"), (ff(F(fav, 12)), None)],
                     [("tabla 6 × 6", ff(p), f"Hay 36 resultados igual de probables. Suman {s}: {fav}. P = {fav}/36 = {ff(p)}.")],
                     "Con dos dados hay 36 parejas equiprobables; las 11 sumas posibles no son igual de probables.", gen=[ff(F(1, 6)), ff(F(1, 36))])
    if tipo == "monedas":
        n = 3
        k = rng.choice([1, 2])
        cara = rng.choice(["caras", "cruces"])
        fav = math.comb(n, k)
        p = F(fav, 2 ** n)
        enun = f"Se lanzan tres monedas. ¿Qué probabilidad hay de obtener exactamente {k} {cara if k > 1 else cara[:-1] if cara == 'caras' else 'cruz'}?"
        return hacer(enun, ff(p), "monedas", {"k": k}, [(ff(F(1, 8)), "olvida_ramas"), (ff(F(1, 4)), "no_equiprobables"), (ff(F(1, 2) + F(1, 2) + F(1, 2)) if False else ff(F(1, 2)), None)],
                     [("árbol", ff(p), f"Hay 8 ramas igual de probables (1/2 · 1/2 · 1/2 = 1/8 cada una). Con exactamente {k}: {fav} ramas. P = {fav}/8 = {ff(p)}.")],
                     "Se multiplica a lo largo de cada rama y se suman las ramas que dan el suceso.", gen=[ff(F(1, 3)), ff(F(5, 8))])
    c1, c2 = rng.sample(COLORES_F, 2)
    a, b = rng.randint(1, 6), rng.randint(1, 6)
    t = a + b
    bolsa = f"En una bolsa hay {a} bolas {c1} y {b} {c2}. Se saca una bola, se mira y se devuelve; después se saca otra."
    if tipo == "reemplazo_igual":
        p = F(a, t) ** 2
        return hacer(f"{bolsa} ¿Qué probabilidad hay de que las dos sean {c1}?", ff(p), "reemplazo", {"a": a, "b": b},
                     [(ff(F(2 * a, t)) if 2 * a < t else ff(F(a, t)), "suma_en_rama"), (ff(F(a, t)), None), (ff(F(a * (a - 1), t * (t - 1))) if a > 1 else ff(F(1, t * t)), None)],
                     [("producto", ff(p), f"Con devolución la bolsa no cambia: {a}/{t} · {a}/{t} = {ff(p)}.")],
                     "Con reemplazamiento las extracciones son independientes: se multiplican las probabilidades.",
                     gen=[ff(F(a, 2 * t)), ff(F(a, t * t)), ff(F(a + 1, t + 1) ** 2), ff(F(b, t) ** 2)])
    p = 2 * F(a, t) * F(b, t)
    return hacer(f"{bolsa} ¿Qué probabilidad hay de sacar una de cada color?", ff(p), "reemplazo", {"a": a, "b": b},
                 [(ff(F(a * b, t * t)), "olvida_ramas"), (ff(F(a, t) + F(b, t)) if F(a, t) + F(b, t) < 1 else ff(F(a + b, 2 * t) + F(1, 10)), "suma_en_rama"), (ff(F(1, 2)), None)],
                 [("dos ramas", ff(p), f"{c1} y luego {c2}: {a}/{t} · {b}/{t}; {c2} y luego {c1}: {b}/{t} · {a}/{t}. Sumo las dos ramas: {ff(p)}.")],
                 "Cada rama se multiplica; las ramas que dan el mismo suceso se suman.", gen=[ff(F(a * b, t * t) + F(1, t * t))])


@gen6("t6_sin_reemplazo")
def g_sin_reemplazo(rng, d, tipo="dos_iguales"):
    """EST.PROB.07. Claves: no_actualiza, actualiza_solo_total, olvida_orden."""
    c1, c2 = rng.sample(COLORES_F, 2)
    a, b = rng.randint(2, 7), rng.randint(2, 7)
    t = a + b
    bolsa = f"En una bolsa hay {a} bolas {c1} y {b} {c2}. Se sacan"
    if tipo == "dos_iguales":
        p = F(a * (a - 1), t * (t - 1))
        return hacer(f"{bolsa} dos bolas sin devolver la primera. ¿Qué probabilidad hay de que las dos sean {c1}?", ff(p), "sin_reemplazo", {"a": a, "b": b},
                     [(ff(F(a, t) ** 2), "no_actualiza"), (ff(F(a * a, t * (t - 1))), "actualiza_solo_total"), (ff(F(a - 1, t - 1)), None)],
                     [("1.ª", f"{a}/{t}", f"Primera {sing(c1)}: {a}/{t}."), ("2.ª", f"{a - 1}/{t - 1}", f"Queda una {sing(c1)} menos y una bola menos: {a - 1}/{t - 1}."),
                      ("producto", ff(p), f"{a}/{t} · {a - 1}/{t - 1} = {ff(p)}.")],
                     "Sin devolución, la segunda extracción depende de la primera: se actualizan el color y el total.", gen=[ff(F(a, t))])
    if tipo == "una_de_cada":
        p = F(2 * a * b, t * (t - 1))
        return hacer(f"{bolsa} dos bolas sin devolver la primera. ¿Qué probabilidad hay de sacar una de cada color?", ff(p), "sin_reemplazo", {"a": a, "b": b},
                     [(ff(F(a * b, t * (t - 1))), "olvida_orden"), (ff(2 * F(a, t) * F(b, t)), "no_actualiza"), (ff(F(a * b, t * t)), None)],
                     [("rama 1", ff(F(a * b, t * (t - 1))), f"{c1} y luego {c2}: {a}/{t} · {b}/{t - 1}."), ("rama 2", ff(F(a * b, t * (t - 1))), f"{c2} y luego {c1}: {b}/{t} · {a}/{t - 1}."),
                      ("sumar", ff(p), f"Sumo las dos ramas: {ff(p)}.")],
                     "Hay dos órdenes posibles (A-B y B-A); cada rama se multiplica actualizando la bolsa y luego se suman.", gen=[ff(F(1, 2))])
    if a < 3:
        a = 3
        t = a + b
        bolsa = f"En una bolsa hay {a} bolas {c1} y {b} {c2}. Se sacan"
    p = F(a * (a - 1) * (a - 2), t * (t - 1) * (t - 2))
    return hacer(f"{bolsa} tres bolas, una tras otra, sin devolverlas. ¿Qué probabilidad hay de que las tres sean {c1}?", ff(p), "sin_reemplazo3", {"a": a, "b": b},
                 [(ff(F(a, t) ** 3), "no_actualiza"), (ff(F(a ** 3, t * (t - 1) * (t - 2))), "actualiza_solo_total"), (ff(F(a - 2, t - 2)), None)],
                 [("producto", ff(p), f"{a}/{t} · {a - 1}/{t - 1} · {a - 2}/{t - 2} = {ff(p)}.")],
                 "En cada extracción sin devolución quedan una bola menos de ese color y una menos en total.", gen=[ff(F(a, t))])


def _tabla_cont(rng, d):
    filas = ["chicas", "chicos"]
    cols = rng.sample(["fútbol", "baloncesto", "natación", "tenis"], 2 if d < 3 else 3)
    t = [[rng.randint(5, 60) for _ in cols] for _ in filas]
    return filas, cols, t


@gen6("t6_prob_tabla")
def g_prob_tabla(rng, d, tipo="celda"):
    """EST.PROB.08. Claves: divide_total, divide_fila, interseccion_por_union."""
    for _ in range(100):
        filas, cols, t = _tabla_cont(rng, d)
        N = sum(map(sum, t))
        fr = [sum(r) for r in t]
        cc = [sum(t[i][j] for i in range(2)) for j in range(len(cols))]
        if len({N, *fr, *cc}) == 1 + 2 + len(cols):
            break
    tabla = "Deporte | " + " | ".join(cols) + " | total\n" + "\n".join(f"{filas[i]} | " + " | ".join(map(str, t[i])) + f" | {fr[i]}" for i in range(2)) + \
        "\ntotal | " + " | ".join(map(str, cc)) + f" | {N}"
    i, j = rng.randrange(2), rng.randrange(len(cols))
    base = f"Deporte favorito de {N} alumnos:\n{tabla}\nSe elige un alumno al azar.\n"
    c = t[i][j]
    if tipo == "celda":
        return hacer(base + f"¿Qué probabilidad hay de que sea {filas[i][:-1]} y prefiera {cols[j]}?", ff(F(c, N)), "tabla_celda", {"c": c, "N": N},
                     [(ff(F(c, fr[i])), "divide_fila"), (ff(F(c, cc[j])), None), (ff(F(fr[i] + cc[j] - c, N)), None)],
                     [("celda / total", ff(F(c, N)), f"Casos favorables: la casilla {filas[i]}–{cols[j]} = {c}. Posibles: {N}. P = {c}/{N}" + (f" = {ff(F(c, N))}." if ff(F(c, N)) != f"{c}/{N}" else "."))],
                     "En una tabla de contingencia, P(A y B) = casilla / total general.")
    if tipo == "restringida":
        enun = base.replace("Se elige un alumno al azar.\n", "") + f"Entre los alumnos que prefieren {cols[j]} se elige uno al azar. ¿Qué probabilidad hay de que sea {filas[i][:-1]}?"
        return hacer(enun, ff(F(c, cc[j])), "tabla_restringida", {"c": c, "col": cc[j]},
                     [(ff(F(c, N)), "divide_total"), (ff(F(c, fr[i])), "divide_fila"), (ff(F(cc[j], N)), None)],
                     [("casilla / total de columna", ff(F(c, cc[j])), f"Ahora solo cuentan los de {cols[j]}: {cc[j]}. De ellos, {c} son {filas[i]}. P = {c}/{cc[j]}.")],
                     "«De entre los que…» restringe los casos posibles a esa fila o columna.")
    u = fr[i] + cc[j] - c
    enun = base + f"¿Qué probabilidad hay de que sea {filas[i][:-1]} o prefiera {cols[j]}?"
    return hacer(enun, ff(F(u, N)), "tabla_union", {"u": u, "N": N},
                 [(ff(F(c, N)), "interseccion_por_union"), (ff(F(fr[i] + cc[j], N)) if fr[i] + cc[j] < N else ff(F(fr[i], N)), None), (ff(F(c, fr[i])), "divide_fila")],
                 [("fila + columna − casilla", ff(F(u, N)), f"{fr[i]} + {cc[j]} − {c} = {u} alumnos cumplen al menos una. P = {u}/{N}.")],
                 "«A o B» incluye a los que cumplen al menos una condición: fila + columna − casilla común.")


def _pares_prob(rng, indep=None):
    """P(A), P(B), P(A∩B) con 2 decimales como mucho (P(A∩B)/P(B) exacto a 2 decimales)."""
    for _ in range(2000):
        pa = F(rng.randint(2, 18), 20)
        pb = F(rng.choice([2, 3, 4, 5, 6, 8]), 10) if rng.random() < 0.8 else F(rng.choice([1, 3]), 4)
        if indep is True:
            pi = pa * pb
            if (pi * 100).denominator != 1:
                continue
        else:
            pi = F(rng.randint(2, 60), 100)
            if indep is False and pi == pa * pb:
                continue
        if not (0 < pi < min(pa, pb)) or pa + pb - pi > 1:
            continue
        if ((pi / pb) * 100).denominator != 1:
            continue
        return pa, pb, pi
    return None


@gen6("t6_condicionada")
def g_condicionada(rng, d, tipo="formula"):
    """EST.PROB.10. Claves: invierte_condicion, interseccion_por_condicionada, multiplica_sin_independencia."""
    if tipo == "tabla":
        filas = ["usa gafas", "no usa gafas"]
        cols = ["practica deporte", "no practica deporte"]
        t = [[rng.randint(5, 60) for _ in range(2)] for _ in range(2)]
        N = sum(map(sum, t))
        i, j = rng.randrange(2), rng.randrange(2)
        fr, cc = sum(t[i]), t[0][j] + t[1][j]
        tabla = " | " + " | ".join(cols) + "\n" + "\n".join(f"{filas[r]} | " + " | ".join(map(str, t[r])) for r in range(2))
        A, B = filas[i], cols[j]
        enun = f"Datos de {N} personas:\n{tabla}\nSe elige una persona al azar. A = «{A}», B = «{B}». Calcula P(A | B)."
        r = F(t[i][j], cc)
        return hacer(enun, ff(r), "condicionada_tabla", {"t": t, "i": i, "j": j},
                     [(ff(F(t[i][j], fr)), "invierte_condicion"), (ff(F(t[i][j], N)), "interseccion_por_condicionada"), (ff(F(fr, N)), "multiplica_sin_independencia")],
                     [("P(A∩B)/P(B)", ff(r), f"Solo cuentan los que cumplen B ({B}): {cc}. De ellos cumplen A: {t[i][j]}. P(A | B) = {t[i][j]}/{cc}" + (f" = {ff(r)}." if ff(r) != f"{t[i][j]}/{cc}" else "."))],
                     "P(A | B) = P(A ∩ B)/P(B): se restringe el espacio a los casos de B.", gen=[ff(F(cc, N))])
    got = _pares_prob(rng, indep=False)
    if not got:
        return None
    pa, pb, pi = got
    if tipo == "producto":
        pab = pi / pb
        enun = f"P(B) = {dec(pb, 2)} y P(A | B) = {dec(pab, 2)}. Calcula P(A ∩ B)."
        return hacer(enun, dec(pi, 4), "producto_cond", {"pb": str(pb), "pab": str(pab)},
                     [(dec(pab / pb, 4) if pab / pb <= 1 else dec(pab + pb, 2), "invierte_condicion"), (dec(pab, 2), "interseccion_por_condicionada"), (dec(pb + pab - pb * pab, 4), None)],
                     [("P(B)·P(A|B)", dec(pi, 4), f"Regla del producto: P(A ∩ B) = P(B) · P(A | B) = {dec(pb, 2)} · {dec(pab, 2)} = {dec(pi, 4)}.")],
                     "Regla del producto: P(A ∩ B) = P(B)·P(A | B).", gen=[dec(pi + F(1, 20), 4)])
    pu = pa + pb - pi
    enun = f"P(A) = {dec(pa, 2)}, P(B) = {dec(pb, 2)} y P(A ∪ B) = {dec(pu, 2)}. Calcula P(A | B)."
    r = pi / pb
    return hacer(enun, dec(r, 2), "condicionada", {"pa": str(pa), "pb": str(pb), "pu": str(pu)},
                 [(dec(pi / pa, 3), "invierte_condicion"), (dec(pi, 2), "interseccion_por_condicionada"), (dec(pa * pb / pb, 2), "multiplica_sin_independencia")],
                 [("P(A∩B)", dec(pi, 2), f"P(A ∩ B) = P(A) + P(B) − P(A ∪ B) = {dec(pa, 2)} + {dec(pb, 2)} − {dec(pu, 2)} = {dec(pi, 2)}."),
                  ("÷ P(B)", dec(r, 2), f"P(A | B) = P(A ∩ B)/P(B) = {dec(pi, 2)}/{dec(pb, 2)} = {dec(r, 2)}.")],
                 "P(A | B) = P(A ∩ B)/P(B); no confundir con P(B | A) = P(A ∩ B)/P(A).", gen=[dec(r + F(1, 10), 2), dec(pu, 2)])


@gen6("t6_independencia")
def g_independencia(rng, d, tipo="decidir"):
    """EST.PROB.11. Claves: incompatibles_independientes, comprueba_union, intuicion."""
    if tipo == "decidir":
        ind = rng.random() < 0.5
        got = _pares_prob(rng, indep=ind)
        if not got:
            return None
        pa, pb, pi = got
        pu = pa + pb - pi
        enun = f"P(A) = {dec(pa, 2)}, P(B) = {dec(pb, 2)} y P(A ∪ B) = {dec(pu, 2)}. ¿Son A y B independientes?"
        prod = pa * pb
        if ind:
            resp = f"sí, porque P(A ∩ B) = {dec(pi, 4)} = P(A)·P(B)"
            dis = [(f"no, porque P(A ∪ B) ≠ P(A)·P(B)", "comprueba_union"), ("no, porque pueden ocurrir a la vez", "incompatibles_independientes"),
                   (f"no, porque P(A ∩ B) = {dec(pi, 4)} ≠ P(A) + P(B)", None)]
        else:
            resp = f"no, porque P(A ∩ B) = {dec(pi, 4)} y P(A)·P(B) = {dec(prod, 4)}"
            dis = [(f"sí, porque P(A ∪ B) = {dec(pu, 2)} es menor que 1", "comprueba_union"), ("sí, porque no tienen nada que ver", "intuicion"),
                   (f"sí, porque P(A ∩ B) = {dec(pi, 4)} no es 0", "incompatibles_independientes")]
        return hacer(enun, resp, "independencia", {"pa": str(pa), "pb": str(pb), "pu": str(pu)}, dis,
                     [("P(A∩B)", dec(pi, 4), f"P(A ∩ B) = {dec(pa, 2)} + {dec(pb, 2)} − {dec(pu, 2)} = {dec(pi, 4)}."),
                      ("comparar", dec(prod, 4), f"P(A)·P(B) = {dec(pa, 2)} · {dec(pb, 2)} = {dec(prod, 4)}. " + ("Coinciden: independientes." if ind else "No coinciden: dependientes."))],
                     "A y B son independientes si P(A ∩ B) = P(A)·P(B). Incompatibles (P(A ∩ B) = 0) no es lo mismo que independientes.")
    pa = F(rng.randint(1, 9), 10)
    pb = F(rng.randint(1, 9), 10)
    pi = pa * pb
    if tipo == "interseccion":
        enun = f"A y B son independientes, con P(A) = {dec(pa, 2)} y P(B) = {dec(pb, 2)}. Calcula P(A ∩ B)."
        return hacer(enun, dec(pi, 4), "indep_inter", {"pa": str(pa), "pb": str(pb)},
                     [("0", "incompatibles_independientes"), (dec(pa + pb, 2) if pa + pb <= 1 else dec(pa + pb - pi, 4), None), (dec(min(pa, pb), 2), None)],
                     [("P(A)·P(B)", dec(pi, 4), f"Por ser independientes: P(A ∩ B) = {dec(pa, 2)} · {dec(pb, 2)} = {dec(pi, 4)}.")],
                     "Si A y B son independientes, P(A ∩ B) = P(A)·P(B). Solo si son incompatibles es P(A ∩ B) = 0.", gen=[dec(pi / 2, 4)])
    pu = pa + pb - pi
    enun = f"A y B son independientes, con P(A) = {dec(pa, 2)} y P(B) = {dec(pb, 2)}. Calcula P(A ∪ B)."
    return hacer(enun, dec(pu, 4), "indep_union", {"pa": str(pa), "pb": str(pb)},
                 [(dec(pa + pb, 2), "incompatibles_independientes"), (dec(pi, 4), None), (dec(pa * pb + pb, 4) if pa * pb + pb != pu else dec(pu + F(1, 10), 4), None)],
                 [("P(A∩B)", dec(pi, 4), f"Independientes: P(A ∩ B) = {dec(pa, 2)} · {dec(pb, 2)} = {dec(pi, 4)}."),
                  ("unión", dec(pu, 4), f"P(A ∪ B) = {dec(pa, 2)} + {dec(pb, 2)} − {dec(pi, 4)} = {dec(pu, 4)}.")],
                 "Con independencia, P(A ∩ B) = P(A)·P(B), y luego P(A ∪ B) = P(A) + P(B) − P(A ∩ B).", gen=[dec(pu + F(1, 20), 4)])


# ================================================================ COMBINATORIA

@gen6("t6_recuento_sistematico")
def g_recuento_sist(rng, d, tipo="cifras"):
    """EST.COMB.01. Claves: olvida_casos, repetidos_no_permitidos, orden_duplicado, suma_opciones."""
    if tipo == "cifras":
        k = rng.randint(3, 4) if d < 3 else rng.randint(3, 5)
        digs = sorted(rng.sample(range(1, 10), k))
        rep = d > 1 and rng.random() < 0.35
        r = k * k if rep else k * (k - 1)
        enun = f"¿Cuántos números de dos cifras {'(pueden repetirse)' if rep else 'distintas'} se pueden formar con las cifras {lista(digs)}?"
        ejemplo = [f"{a}{b}" for a in digs for b in digs if rep or a != b]
        dis = [(k * (k - 1) if rep else k * k, None if rep else "repetidos_no_permitidos"), (r - 1, "olvida_casos"), (k * (k - 1) // 2, "orden_duplicado"), (2 * k, "suma_opciones")]
        return hacer(enun, fmt(r), "recuento_cifras", {"digs": digs, "rep": rep}, dis,
                     [("lista ordenada", fmt(r), "Los escribo en orden, empezando por cada cifra: " + ", ".join(ejemplo[:8]) + ("…" if len(ejemplo) > 8 else "") + f" En total {r}.")],
                     "Contar con una lista ordenada (o un árbol) para no olvidar ni repetir casos; 12 y 21 son números distintos.", gen=cerca(r, rng, 2, minimo=1))
    if tipo == "parejas":
        n = rng.randint(3, 5) if d == 1 else rng.randint(4, 8)
        nombres = rng.sample(NOMBRES, n)
        r = n * (n - 1) // 2
        enun = f"{lista(nombres)} quieren jugar partidas por parejas. ¿Cuántas parejas distintas se pueden formar?"
        return hacer(enun, fmt(r), "parejas", {"n": n}, [(n * (n - 1), "orden_duplicado"), (r - 1, "olvida_casos"), (n * n, "repetidos_no_permitidos"), (2 * n, None)],
                     [("lista", fmt(r), f"{nombres[0]} puede ir con {n - 1}; el siguiente con {n - 2} más (sin repetir la pareja anterior)… {' + '.join(str(x) for x in range(n - 1, 0, -1))} = {r}.")],
                     "En una pareja no importa el orden (Ana-Luis = Luis-Ana); se cuenta con una lista ordenada.", gen=cerca(r, rng, 1, minimo=1))
    # tres cifras distintas
    k = rng.randint(3, 4)
    digs = sorted(rng.sample(range(1, 10), k))
    r = k * (k - 1) * (k - 2)
    enun = f"¿Cuántos números de tres cifras distintas se pueden formar con las cifras {lista(digs)}?"
    return hacer(enun, fmt(r), "recuento_cifras3", {"digs": digs}, [(k ** 3, "repetidos_no_permitidos"), (r - 2, "olvida_casos"), (3 * k, "suma_opciones"), (r // 6 if r >= 6 else r + 1, "orden_duplicado")],
                 [("árbol", fmt(r), f"Primera cifra: {k} opciones; segunda: {k - 1}; tercera: {k - 2}. En el árbol salen {k} · {k - 1} · {k - 2} = {r} números.")],
                 "Un árbol ordenado muestra todos los casos; sin repetir cifras, cada nivel tiene una opción menos.", gen=cerca(r, rng, 1, minimo=1))


@gen6("t6_multiplicativo")
def g_multiplicativo(rng, d):
    """EST.COMB.02. Claves: suma_en_vez, arbol_incompleto."""
    k = {1: 2, 2: 3, 3: rng.choice([3, 4])}[d]
    ctx = rng.choice([("menú", ["primeros", "segundos", "postres", "bebidas"], "menús distintos"),
                      ("ropa", ["camisetas", "pantalones", "pares de zapatillas", "gorras"], "conjuntos distintos"),
                      ("viaje", ["caminos de A a B", "caminos de B a C", "caminos de C a D", "caminos de D a E"], "rutas distintas de principio a fin")])
    ns = [rng.randint(2, 6) for _ in range(k)]
    r = math.prod(ns)
    if ctx[0] == "menú":
        enun = f"Un restaurante ofrece un menú con " + lista([f"{n} {c}" for n, c in zip(ns, ctx[1])]) + f". Si se elige uno de cada, ¿cuántos {ctx[2]} hay?"
    elif ctx[0] == "ropa":
        enun = f"{rng.choice(NOMBRES)} tiene " + lista([f"{n} {c}" for n, c in zip(ns, ctx[1])]) + f". Si se pone una prenda de cada tipo, ¿cuántos {ctx[2]} puede formar?"
    else:
        enun = "Hay " + lista([f"{n} {c}" for n, c in zip(ns, ctx[1])]) + f". ¿Cuántas {ctx[2]} hay?"
    parcial = math.prod(ns[:-1])
    return hacer(enun, fmt(r), "multiplicativo", {"ns": ns}, [(sum(ns), "suma_en_vez"), (parcial if parcial != r else r - ns[0], "arbol_incompleto"), (r + ns[-1], None)],
                 [("árbol", fmt(r), f"Cada elección se combina con todas las siguientes: {' · '.join(map(str, ns))} = {r}.")],
                 "Principio multiplicativo: si una elección tiene n1 opciones, otra n2…, el total es n1·n2·…", gen=cerca(r, rng, 2))


@gen6("t6_vr")
def g_vr(rng, d):
    """EST.COMB.03. Claves: k_a_la_n, n_por_k, sin_repeticion."""
    ctx = rng.choice(["digitos", "letras", "quiniela", "banderas"] if d > 1 else ["digitos", "banderas", "letras"])
    if ctx == "digitos":
        n = 10 if d > 1 else rng.choice([2, 3, 4, 5])
        k = rng.randint(2, 4) if d < 3 else rng.randint(4, 6)
        cjto = "los dígitos del 0 al 9" if n == 10 else f"las cifras {lista(range(1, n + 1))}"
        enun = f"¿Cuántas claves de {k} cifras se pueden formar con {cjto}, pudiendo repetir cifras?"
    elif ctx == "letras":
        n = rng.randint(3, 6)
        k = rng.randint(3, 5)
        letras_ = "ABCDEFG"[:n]
        enun = f"¿Cuántos códigos de {k} letras se pueden formar con las letras {lista(letras_)}, si las letras se pueden repetir?"
    elif ctx == "quiniela":
        n = 3
        k = rng.randint(4, 14) if d == 3 else rng.randint(3, 6)
        enun = f"En una quiniela de {k} partidos, cada uno se rellena con 1, X o 2. ¿Cuántas quinielas distintas se pueden rellenar?"
    else:
        n = rng.randint(2, 5)
        k = rng.randint(2, 4)
        enun = f"Queremos pintar una bandera de {k} franjas con {n} colores disponibles; dos franjas pueden ser del mismo color. ¿Cuántas banderas distintas hay?"
    if n == k:
        k += 1
        return g_vr(rng, d)
    r = n ** k
    return hacer(enun, fmt(r), "vr", {"n": n, "k": k}, [(fmt(k ** n), "k_a_la_n"), (fmt(n * k), "n_por_k"), (fmt(math.perm(n, k)), "sin_repeticion") if k <= n else (fmt(n ** (k - 1)), None)],
                 [("VR(n,k) = n^k", fmt(r), f"Cada una de las {k} posiciones puede ser cualquiera de las {n} opciones: {' · '.join([str(n)] * k)} = {n}^{k} = {fmt(r)}.")],
                 "Variaciones con repetición: importa el orden y se puede repetir, VR(n,k) = n^k (n opciones en cada una de las k posiciones).",
                 gen=[fmt(r + n), fmt(n ** (k + 1))])


@gen6("t6_variaciones")
def g_variaciones(rng, d, tipo="variaciones"):
    """EST.COMB.04. Claves: con_repeticion, divide_k_factorial."""
    if tipo == "factorial":
        n = rng.randint(4, 8)
        r = math.factorial(n)
        return hacer(f"Calcula {n}!", fmt(r), "factorial", {"n": n}, [(fmt(n * (n - 1)), None), (fmt(sum(range(1, n + 1))), None), (fmt(n ** n), "con_repeticion"), (fmt(math.factorial(n - 1)), None)],
                     [("n!", fmt(r), f"{n}! = {' · '.join(str(x) for x in range(n, 0, -1))} = {fmt(r)}.")],
                     "n! = n·(n − 1)·…·2·1: número de formas de ordenar n elementos distintos.")
    if tipo == "permutaciones":
        n = rng.randint(3, 7)
        cosa = rng.choice([("personas", "sentarse en una fila de", "sillas"), ("libros distintos", "colocarse en una estantería con", "huecos"),
                           ("corredores", "ocupar las calles de una pista con", "calles")])
        enun = f"¿De cuántas formas pueden {n} {cosa[0]} {cosa[1]} {n} {cosa[2]}?"
        r = math.factorial(n)
        return hacer(enun, fmt(r), "permutaciones", {"n": n}, [(fmt(n ** n), "con_repeticion"), (fmt(n * (n - 1)), None), (fmt(math.factorial(n - 1)), None)],
                     [("P(n) = n!", fmt(r), f"Primera posición {n} opciones, segunda {n - 1}… {n}! = {fmt(r)}.")],
                     "Permutaciones: ordenar n elementos distintos, P(n) = n!.", gen=[fmt(r * 2)])
    n = rng.randint(5, 10)
    k = rng.randint(2, 4)
    ctx = rng.choice([f"En una carrera con {n} corredores, ¿de cuántas formas se pueden repartir " + {2: "el oro y la plata", 3: "el oro, la plata y el bronce", 4: "los cuatro primeros puestos"}[k] + "?",
                      f"En un club de {n} socios hay que elegir " + {2: "presidente y secretario", 3: "presidente, secretario y tesorero", 4: "presidente, vicepresidente, secretario y tesorero"}[k] + ". ¿De cuántas formas se puede hacer?"])
    r = math.perm(n, k)
    return hacer(ctx, fmt(r), "variaciones", {"n": n, "k": k},
                 [(fmt(n ** k), "con_repeticion"), (fmt(math.factorial(n) // math.factorial(k)), "divide_k_factorial"), (fmt(math.comb(n, k)), None)],
                 [("V(n,k)", fmt(r), f"Importa el orden y no se repite: {' · '.join(str(n - i) for i in range(k))} = {fmt(r)}, es decir, {n}!/{n - k}!.")],
                 "Variaciones sin repetición: V(n,k) = n!/(n − k)! = n·(n − 1)·…(k factores).", gen=[fmt(n * k), fmt(r + n)])


@gen6("t6_combinaciones")
def g_combinaciones(rng, d, tipo="contexto"):
    """EST.COMB.05. Claves: no_divide_k, divide_mal."""
    if tipo == "numero":
        n = rng.randint(5, 12)
        k = rng.randint(2, n - 2)
        if d == 3 and k < n / 2:
            k = n - k
        r = math.comb(n, k)
        V = math.perm(n, k)
        return hacer(f"Calcula el número combinatorio C({n}, {k}).", fmt(r), "combinatorio", {"n": n, "k": k},
                     [(fmt(V), "no_divide_k"), (fmt(V // k) if V % k == 0 else fmt(math.factorial(n) // math.factorial(n - k) // 2), "divide_mal"), (fmt(n * k), None)],
                     [("n!/(k!(n−k)!)", fmt(r), f"C({n}, {k}) = {n}!/({k}!·{n - k}!) = {fmt(r)}" + (f" (igual que C({n}, {n - k}))." if k > n / 2 else "."))],
                     "C(n,k) = n!/(k!(n − k)!) y C(n,k) = C(n, n − k).", gen=[fmt(r + n)])
    n = rng.randint(5, 12)
    k = rng.randint(2, 4)
    ctx = rng.choice([f"Hay que elegir {k} delegados entre {n} alumnos (todos con el mismo cargo). ¿De cuántas formas?",
                      f"{rng.choice(NOMBRES)} tiene {n} amigos y puede invitar a {k} al cine. ¿Cuántos grupos distintos de invitados puede formar?",
                      f"De {n} sabores de helado se eligen {k} distintos para una copa (el orden no importa). ¿Cuántas copas distintas hay?"])
    r = math.comb(n, k)
    V = math.perm(n, k)
    return hacer(ctx, fmt(r), "combinaciones", {"n": n, "k": k},
                 [(fmt(V), "no_divide_k"), (fmt(V // k) if V % k == 0 else fmt(V // 2), "divide_mal"), (fmt(n ** k), None)],
                 [("C(n,k)", fmt(r), f"No importa el orden: C({n}, {k}) = {fmt(V)} : {k}! = {fmt(r)}.")],
                 "Combinaciones: grupos sin orden ni repetición, C(n,k) = V(n,k)/k!.", gen=[fmt(r + k)])


PALABRAS = ["CASA", "PAPA", "SALSA", "CARRO", "PERRO", "PATATA", "BANANA", "TOMATE", "TETERA", "CACAO", "COCO", "ALA", "OSO", "MAMA", "PELOTA", "CARACOL", "ARENA"]


@gen6("t6_perm_rep")
def g_perm_rep(rng, d, tipo="anagrama"):
    """EST.COMB.07. Claves: no_divide_repeticiones, resta_en_vez."""
    if tipo == "anagrama":
        for _ in range(50):
            w = rng.choice(PALABRAS)
            c = Counter(w)
            reps = [v for v in c.values() if v > 1]
            if reps and (d > 1 or len(w) <= 5):
                break
        n = len(w)
        den = math.prod(math.factorial(v) for v in reps)
        r = math.factorial(n) // den
        den_txt = "·".join(f"{v}!" for v in reps)
        resta = math.factorial(n) - sum(math.factorial(v) for v in reps)
        return hacer(f"¿Cuántas ordenaciones distintas (anagramas, tengan o no sentido) tienen las letras de la palabra {w}?", fmt(r), "perm_rep", {"w": w},
                     [(fmt(math.factorial(n)), "no_divide_repeticiones"), (fmt(resta), "resta_en_vez"), (fmt(math.factorial(n) // max(reps)), None)],
                     [("n!/(a!·b!…)", fmt(r), f"{n} letras, con repeticiones " + ", ".join(f"{l} {v} veces" for l, v in c.items() if v > 1) + f": {n}!/({den_txt}) = {fmt(r)}.")],
                     "Permutaciones con repetición: n!/(a!·b!·…), dividiendo por las ordenaciones de las letras iguales.",
                     gen=[fmt(r * 2), fmt(r + n), fmt(math.factorial(n - 1)), fmt(r * 3)])
    if tipo == "bolas":
        a, b = rng.randint(2, 5), rng.randint(2, 4)
        c1, c2 = rng.sample(COLORES_F, 2)
        n = a + b
        r = math.comb(n, a)
        return hacer(f"Se colocan en fila {a} bolas {c1} iguales y {b} bolas {c2} iguales. ¿Cuántas filas distintas se pueden formar?", fmt(r), "perm_rep_bolas", {"a": a, "b": b},
                     [(fmt(math.factorial(n)), "no_divide_repeticiones"), (fmt(math.factorial(n) - math.factorial(a) - math.factorial(b)), "resta_en_vez"), (fmt(a * b), None)],
                     [("n!/(a!·b!)", fmt(r), f"{n}!/({a}!·{b}!) = {fmt(r)}.")],
                     "Objetos iguales entre sí: se divide n! por las ordenaciones de cada grupo de iguales.", gen=[fmt(r + 1)])
    n = rng.randint(4, 7)
    nombres = rng.sample(NOMBRES, 2)
    r = 2 * math.factorial(n - 1)
    return hacer(f"{n} amigos, entre ellos {nombres[0]} y {nombres[1]}, se sientan en fila. ¿De cuántas formas pueden sentarse si {nombres[0]} y {nombres[1]} quieren estar juntos?",
                 fmt(r), "restriccion_juntos", {"n": n},
                 [(fmt(math.factorial(n - 1)), None), (fmt(math.factorial(n)), None), (fmt(math.factorial(n) - 2), "resta_en_vez")],
                 [("bloque", fmt(math.factorial(n - 1)), f"Los dos juntos forman un bloque: se ordenan {n - 1} elementos, {n - 1}! = {fmt(math.factorial(n - 1))}."),
                  ("× 2", fmt(r), f"Dentro del bloque pueden ir de 2 formas: 2 · {fmt(math.factorial(n - 1))} = {fmt(r)}.")],
                 "Restricción «juntos»: se trata el grupo como un bloque y se multiplica por sus ordenaciones internas.")


# ================================================================ BIDIMENSIONAL

@gen6("t6_marginal")
def g_marginal(rng, d, tipo="marginal"):
    """EST.BIDIM.01. Claves: marginal_por_casilla, porcentaje_mal."""
    filas = ["chicas", "chicos"]
    cols = rng.sample(["fútbol", "baloncesto", "natación", "tenis", "atletismo"], 3)
    for _ in range(200):
        t = [[rng.randint(4, 40) for _ in cols] for _ in filas]
        fr = [sum(r) for r in t]
        cc = [t[0][j] + t[1][j] for j in range(3)]
        N = sum(fr)
        i, j = rng.randrange(2), rng.randrange(3)
        if tipo != "porcentaje" or (F(t[i][j] * 100, fr[i]).denominator == 1 and F(t[i][j] * 100, N) != F(t[i][j] * 100, fr[i])):
            break
    else:
        return None
    tabla = "Sexo \\ deporte | " + " | ".join(cols) + "\n" + "\n".join(f"{filas[r]} | " + " | ".join(map(str, t[r])) for r in range(2))
    base = f"Encuesta sobre el deporte favorito:\n{tabla}\n"
    if tipo == "marginal":
        return hacer(base + f"¿Cuál es la frecuencia marginal de «{cols[j]}»?", fmt(cc[j]), "marginal", {"t": t, "j": j},
                     [(t[i][j], "marginal_por_casilla"), (fr[i], None), (N, None)],
                     [("total de columna", fmt(cc[j]), f"La marginal de «{cols[j]}» es el total de su columna: {t[0][j]} + {t[1][j]} = {cc[j]}.")],
                     "Distribución marginal: totales de fila o de columna (una variable sola, sin mirar la otra).", gen=cerca(cc[j], rng))
    if tipo == "fila":
        return hacer(base + f"¿Cuál es la frecuencia marginal de las {filas[i]}?" if i == 0 else base + f"¿Cuál es la frecuencia marginal de los {filas[i]}?",
                     fmt(fr[i]), "marginal", {"t": t, "i": i},
                     [(t[i][j], "marginal_por_casilla"), (cc[j], None), (N, None)],
                     [("total de fila", fmt(fr[i]), f"Sumo la fila: {' + '.join(map(str, t[i]))} = {fr[i]}.")],
                     "Marginal de una fila: suma de sus casillas.", gen=cerca(fr[i], rng))
    p = F(t[i][j] * 100, fr[i])
    enun = base + f"¿Qué porcentaje de {'las' if i == 0 else 'los'} {filas[i]} prefiere {cols[j]}?"
    return hacer(enun, dec(p, 1) + " %", "porcentaje_fila", {"t": t, "i": i, "j": j},
                 [(dec(F(t[i][j] * 100, N), 1) + " %", "porcentaje_mal"), (dec(F(t[i][j] * 100, cc[j]), 1) + " %", None), (dec(F(fr[i] * 100, N), 1) + " %", None)],
                 [("casilla / total de fila", dec(p, 1) + " %", f"De {fr[i]} {filas[i]}, {t[i][j]} prefieren {cols[j]}: {t[i][j]}/{fr[i]} = {dec(p, 1)} %.")],
                 "Un porcentaje por filas se calcula sobre el total de esa fila, no sobre el total general.")


@gen6("t6_regresion_uso")
def g_regresion_uso(rng, d, tipo="prediccion"):
    """EST.BIDIM.03. Claves: extrapola, sustituye_mal."""
    a = F(rng.randint(3, 30), 2) / 5 if rng.random() < 0.5 else F(rng.randint(1, 8))
    b = rng.randint(5, 50)
    lo, hi = rng.randint(1, 3), rng.randint(8, 12)
    ctx = rng.choice([("horas de estudio", "nota (sobre 100)", "h"), ("temperatura (°C)", "helados vendidos", "°C"), ("años de antigüedad", "sueldo (cientos de €)", "años")])
    recta = f"ŷ = {'' if a == 1 else dec(a, 2)}x + {b}"
    base = (f"Se han tomado datos de dos variables: x = {ctx[0]} (entre {lo} y {hi}) e y = {ctx[1]}. "
            f"La calculadora da la recta de regresión {recta} (r = {dec(rng.uniform(0.8, 0.97), 2)}).\n")
    if tipo == "prediccion":
        x0 = rng.randint(lo, hi)
        y0 = a * x0 + b
        return hacer(base + f"¿Qué valor de y se estima para x = {x0}?", dec(y0, 2), "regresion_pred", {"a": str(a), "b": b, "x": x0},
                     [(dec((x0 - b) / a, 2), "sustituye_mal") if (x0 - b) / a > 0 else (dec(a + b, 2), None), (dec(a * x0, 2), None), (dec(b + x0, 2), None)],
                     [("sustituir", dec(y0, 2), f"Sustituyo x = {x0} en la recta: {dec(a, 2)} · {x0} + {b} = {dec(y0, 2)}.")],
                     "Para estimar y se sustituye el valor de x en ŷ = ax + b (sin despejar x).", gen=[dec(y0 + 1, 2)])
    if tipo == "pendiente":
        resp = f"por cada unidad más de x, y aumenta en promedio {dec(a, 2)}"
        return hacer(base + f"¿Qué significa la pendiente {dec(a, 2)}?", resp, "regresion_pend", {"a": str(a)},
                     [(f"que y vale {dec(a, 2)} cuando x = 0", None), (f"que por cada unidad más de y, x aumenta {dec(a, 2)}", "sustituye_mal"),
                      (f"que la correlación es {dec(a, 2)}", None)],
                     [("", resp, f"La pendiente es el cambio medio de y por cada unidad que aumenta x; {b} es el valor estimado para x = 0.")],
                     "Pendiente de la recta de regresión: variación media de y por unidad de x.")
    x0 = hi * rng.randint(3, 5)
    y0 = a * x0 + b
    resp = f"no es fiable: x = {x0} está muy fuera de los datos ({lo} a {hi})"
    return hacer(base + f"¿Es fiable usar la recta para estimar y cuando x = {x0}?", resp, "regresion_extrap", {"x": x0},
                 [(f"sí, se estima y = {dec(y0, 2)}", "extrapola"), ("sí, porque r es alto", "extrapola"), ("no, porque la pendiente es positiva", None)],
                 [("", resp, "Aunque r sea alto, la recta solo describe bien la relación dentro del rango de datos observados; fuera (extrapolación) puede fallar.")],
                 "Las predicciones son fiables si r está cerca de ±1 y se interpola dentro del rango de los datos, no al extrapolar lejos.")


def _datos_biv(rng):
    for _ in range(2000):
        n = rng.choice([4, 5])
        xs = rng.sample(range(1, 11), n)
        ys = [rng.randint(1, 12) for _ in range(n)]
        if sum(xs) % n or sum(ys) % n:
            continue
        mx, my = sum(xs) // n, sum(ys) // n
        sxy = F(sum(x * y for x, y in zip(xs, ys)), n) - mx * my
        if sxy != 0 and (sxy * 100).denominator == 1 and F(sum(x * y for x, y in zip(xs, ys)), n) != sxy:
            return xs, ys, mx, my, sxy
    return None


@gen6("t6_correlacion")
def g_correlacion(rng, d, tipo="r"):
    """EST.BIDIM.04. Claves: olvida_medias, divide_varianzas, causalidad."""
    if tipo == "covarianza":
        got = _datos_biv(rng)
        if not got:
            return None
        xs, ys, mx, my, sxy = got
        n = len(xs)
        sp = F(sum(x * y for x, y in zip(xs, ys)), n)
        enun = f"Datos (x, y): " + ", ".join(f"({x}, {y})" for x, y in zip(xs, ys)) + ".\nCalcula la covarianza σxy."
        return hacer(enun, dec(sxy, 2), "covarianza", {"xs": xs, "ys": ys}, [(dec(sp, 2), "olvida_medias"), (dec(sxy * n / (n - 1), 2), None), (dec(-sxy, 2), None)],
                     [("medias", f"{mx}, {my}", f"x̄ = {mx}, ȳ = {my}."), ("Σxy/N", dec(sp, 2), f"Σxy/N = {sum(x * y for x, y in zip(xs, ys))}/{n} = {dec(sp, 2)}."),
                      ("− x̄ȳ", dec(sxy, 2), f"σxy = {dec(sp, 2)} − {mx}·{my} = {dec(sxy, 2)}.")],
                     "σxy = Σxiyi/N − x̄·ȳ; su signo indica si la relación es creciente o decreciente.", gen=[dec(sxy + 1, 2)])
    if tipo == "r":
        for _ in range(200):
            sx, sy = rng.randint(2, 9), rng.randint(2, 9)
            r = F(rng.choice([-9, -8, -7, -6, -5, -4, -3, 3, 4, 5, 6, 7, 8, 9]), 10)
            sxy = r * sx * sy
            if (sxy * 10).denominator == 1 and sxy.denominator == 1:
                break
        enun = f"σxy = {dec(sxy, 2)}, σx = {sx} y σy = {sy}. Calcula el coeficiente de correlación r."
        return hacer(enun, dec(r, 2), "r", {"sxy": str(sxy), "sx": sx, "sy": sy},
                     [(dec(sxy / (sx * sx * sy * sy), 4), "divide_varianzas"), (dec(sxy / (sx + sy), 2), None), (dec(-r, 2), None)],
                     [("σxy/(σx·σy)", dec(r, 2), f"r = {dec(sxy, 2)} / ({sx} · {sy}) = {dec(r, 2)}.")],
                     "r = σxy/(σx·σy), siempre entre −1 y 1.", gen=[dec(r / 2, 2)])
    r = rng.choice([F(9, 10), F(-9, 10), F(85, 100), F(-8, 10), F(2, 10), F(-15, 100)])
    ctx = rng.choice([("el número de bomberos que acuden a un incendio", "los daños causados"), ("las ventas de helados", "los ahogamientos en playas"),
                      ("las horas de estudio", "la nota"), ("la altura", "el peso")])
    fuerza = "fuerte" if abs(r) >= F(7, 10) else "débil"
    signo = "positiva" if r > 0 else "negativa"
    resp = f"relación lineal {fuerza} y {signo}, lo que no prueba que una cause la otra"
    return hacer(f"Entre {ctx[0]} y {ctx[1]} se obtiene r = {dec(r, 2)}. ¿Qué se puede concluir?", resp, "r_interpretar", {"r": str(r)},
                 [(f"que {ctx[0]} causa {ctx[1]}", "causalidad"), (f"relación lineal {'débil' if fuerza == 'fuerte' else 'fuerte'} y {signo}", None),
                  (f"relación lineal {fuerza} y {'negativa' if signo == 'positiva' else 'positiva'}", None)],
                 [("", resp, f"|r| = {dec(abs(r), 2)} indica relación {fuerza}; el signo, que es {signo}. La correlación no implica causalidad (puede haber una tercera variable).")],
                 "El signo de r da el sentido y |r| la fuerza de la relación lineal; correlación no es causalidad.")


@gen6("t6_recta_regresion")
def g_recta_regresion(rng, d, tipo="estimar"):
    """EST.BIDIM.05. Claves: usa_recta_yx_para_x, pendiente_r."""
    for _ in range(500):
        mx, my = rng.randint(2, 20), rng.randint(10, 80)
        vx, vy = rng.choice([4, 8, 9, 16, 25]), rng.choice([16, 25, 36, 64, 100])
        sxy = rng.choice([-1, 1]) * rng.randint(2, 20)
        r = F(sxy) / F(math.isqrt(vx) * math.isqrt(vy))
        if abs(r) >= 1 or abs(r) < F(3, 10):
            continue
        byx, bxy = F(sxy, vx), F(sxy, vy)
        if (byx * 100).denominator == 1 and (bxy * 100).denominator == 1:
            break
    else:
        return None
    datos = f"x̄ = {mx}, ȳ = {my}, σx² = {vx}, σy² = {vy}, σxy = {fmt(sxy)}."
    if tipo == "pendiente":
        return hacer(f"{datos}\n¿Cuál es la pendiente de la recta de regresión de y sobre x?", dec(byx, 2), "pendiente_reg", {"sxy": sxy, "vx": vx},
                     [(dec(r, 4), "pendiente_r"), (dec(bxy, 2), "usa_recta_yx_para_x"), (dec(F(sxy, math.isqrt(vx)), 2), None)],
                     [("σxy/σx²", dec(byx, 2), f"Pendiente = σxy/σx² = {sxy}/{vx} = {dec(byx, 2)}.")],
                     "Recta de y sobre x: y − ȳ = (σxy/σx²)(x − x̄). La pendiente no es r.", gen=[dec(byx * 2, 2)])
    if tipo == "estimar":
        x0 = mx + rng.choice([-3, -2, -1, 1, 2, 3])
        y0 = my + byx * (x0 - mx)
        return hacer(f"{datos}\nUsa la recta de regresión de y sobre x para estimar y cuando x = {x0}.", dec(y0, 2), "estimar_reg", {"x": x0},
                     [(dec(my + r * (x0 - mx), 2), "pendiente_r"), (dec(my + bxy * (x0 - mx), 2), None), (dec(my + byx * x0, 2), None)],
                     [("pendiente", dec(byx, 2), f"b = σxy/σx² = {sxy}/{vx} = {dec(byx, 2)}."),
                      ("sustituir", dec(y0, 2), f"ŷ = {my} + {dec(byx, 2)}·({x0} − {mx}) = {dec(y0, 2)}.")],
                     "ŷ = ȳ + (σxy/σx²)(x − x̄).", gen=[dec(y0 + 1, 2)])
    if tipo == "r2":
        R2 = r * r
        return hacer(f"{datos}\nCalcula el coeficiente de determinación R².", dec(R2, 4), "R2", {"sxy": sxy, "vx": vx, "vy": vy},
                     [(dec(r, 4), None), (dec(F(sxy * sxy, vx * vx * vy * vy), 4) if vx * vy > 1 else "1", None), (dec(abs(r) * 2, 4) if abs(r) * 2 < 1 else dec(1 - R2, 4), None)],
                     [("r", dec(r, 4), f"r = σxy/(σx·σy) = {sxy}/({math.isqrt(vx)}·{math.isqrt(vy)}) = {dec(r, 4)}."), ("r²", dec(R2, 4), f"R² = r² = {dec(R2, 4)}.")],
                     "R² = r² indica la proporción de variabilidad de y explicada por la recta.", gen=[dec(R2 / 2, 4)])
    y0 = my + rng.choice([-6, -4, -2, 2, 4, 6])
    x_bien = mx + bxy * (y0 - my)
    x_mal = mx + (y0 - my) / byx
    if x_bien == x_mal:
        return None
    return hacer(f"{datos}\nEstima x cuando y = {y0} (usa la recta adecuada).", dec(x_bien, 2), "estimar_x", {"y": y0},
                 [(dec(x_mal, 2), "usa_recta_yx_para_x"), (dec(mx + r * (y0 - my), 2), "pendiente_r"), (dec(mx + bxy * y0, 2), None)],
                 [("recta x sobre y", dec(bxy, 2), f"Para estimar x se usa la recta de x sobre y: pendiente σxy/σy² = {sxy}/{vy} = {dec(bxy, 2)}."),
                  ("sustituir", dec(x_bien, 2), f"x̂ = {mx} + {dec(bxy, 2)}·({y0} − {my}) = {dec(x_bien, 2)}.")],
                 "Para estimar x se usa la recta de regresión de x sobre y, no se despeja x de la de y sobre x.", gen=[dec(x_bien + 1, 2)])


@gen6("t6_condicionadas_dep")
def g_condicionadas_dep(rng, d, tipo="porcentaje"):
    """EST.BIDIM.06. Claves: compara_absolutas, dependencia_causalidad."""
    ctx = rng.choice([("desayunan", "no desayunan", "aprueba", "aprueban"), ("hacen deporte", "no hacen deporte", "duerme más de 8 horas", "duermen más de 8 horas"),
                      ("leen a diario", "no leen a diario", "saca notable o más", "sacan notable o más")])
    if tipo == "porcentaje":
        for _ in range(300):
            n1, n2 = rng.randint(20, 200), rng.randint(20, 200)
            a1, a2 = rng.randint(5, n1 - 5), rng.randint(5, n2 - 5)
            if F(a1 * 100, n1).denominator == 1 and F(a2 * 100, n2).denominator == 1:
                break
        else:
            return None
        g = rng.choice([0, 1])
        a, n = (a1, n1) if g == 0 else (a2, n2)
        enun = (f"Alumnos que {ctx[0]}: {n1}, de los que {a1} {ctx[3]} y {n1 - a1} no.\nAlumnos que {ctx[1]}: {n2}, de los que {a2} {ctx[3]} y {n2 - a2} no.\n"
                f"¿Qué porcentaje de los que {ctx[g]} {ctx[2]}?")
        p = F(a * 100, n)
        return hacer(enun, pc(F(a, n), 1), "condicionada_pct", {"a": a, "n": n}, [(pc(F(a, n1 + n2), 1), "compara_absolutas"), (pc(F(a, a1 + a2), 1), None), (pc(F(n - a, n), 1), None)],
                     [("a / total del grupo", pc(F(a, n), 1), f"Distribución condicionada: {a} de {n} = {dec(p, 1)} %.")],
                     "Una distribución condicionada se calcula sobre el total del grupo (fila o columna), no sobre el total general.")
    dep = rng.random() < 0.5
    for _ in range(300):
        n1, n2 = rng.randint(60, 300), rng.randint(15, 60)
        p1 = F(rng.randint(3, 8), 10) if dep else F(rng.randint(3, 8), 10)
        p2 = p1 if not dep else p1 - F(rng.randint(2, 3), 10)
        a1, a2 = p1 * n1, p2 * n2
        if a1.denominator == 1 and a2.denominator == 1 and a2 > 0 and n1 > 2 * n2:
            break
    else:
        return None
    a1, a2 = int(a1), int(a2)
    enun = (f"Alumnos que {ctx[0]}: {n1}, de los que {a1} {ctx[3]}.\nAlumnos que {ctx[1]}: {n2}, de los que {a2} {ctx[3]}.\n"
            "¿Hay dependencia entre las dos variables?")
    if dep:
        resp = f"sí: el porcentaje cambia ({pc(p1, 0)} frente a {pc(p2, 0)}), aunque eso no prueba que una cause la otra"
        dis = [("sí, y demuestra que una variable es la causa de la otra", "dependencia_causalidad"), ("no, porque son grupos de distinto tamaño", None),
               (f"sí, porque {a1} es mucho más que {a2}", "compara_absolutas")]
    else:
        resp = f"no: el porcentaje es el mismo en los dos grupos ({pc(p1, 0)})"
        dis = [(f"sí, porque {a1} es mucho más que {a2}", "compara_absolutas"), ("sí, y demuestra que una variable es la causa de la otra", "dependencia_causalidad"),
               ("no se puede saber sin más datos", None)]
    return hacer(enun, resp, "dependencia", {"n1": n1, "a1": a1, "n2": n2, "a2": a2}, dis,
                 [("condicionadas", pc(p1, 0), f"Porcentajes condicionados: {a1}/{n1} = {pc(p1, 0)} y {a2}/{n2} = {pc(p2, 0)}. " +
                   ("Son distintos: hay dependencia estadística (no necesariamente causal)." if dep else "Son iguales: no hay dependencia."))],
                 "Se comparan las distribuciones condicionadas (porcentajes), no las frecuencias absolutas; dependencia no implica causalidad.")


# ================================================================ DISTRIBUCIONES

@gen6("t6_va_discreta")
def g_va_discreta(rng, d, tipo="media"):
    """EST.DISTR.01. Claves: media_sin_ponderar, no_suma_uno."""
    for _ in range(500):
        k = rng.randint(3, 5)
        xs = sorted(rng.sample(range(-5, 11) if tipo == "juego" else range(0, 8), k))
        cs = sorted(rng.sample(range(1, 20), k - 1))
        ps = [F(b - a, 20) for a, b in zip([0] + cs, cs + [20])]
        mu = sum(x * p for x, p in zip(xs, ps))
        if tipo == "juego" and (mu == 0 or min(xs) >= 0):
            continue
        if F(sum(xs), k) != mu:
            break
    else:
        return None
    tabla = "x: " + "  ".join(fmt(x) for x in xs) + "\nP(X = x): " + "  ".join(dec(p, 2) for p in ps)
    if tipo == "falta":
        j = rng.randrange(k)
        tabla = "x: " + "  ".join(fmt(x) for x in xs) + "\nP(X = x): " + "  ".join("?" if i == j else dec(p, 2) for i, p in enumerate(ps))
        otros = 1 - ps[j]
        return hacer(f"Función de probabilidad de una variable aleatoria X:\n{tabla}\n¿Qué valor falta?", dec(ps[j], 2), "va_falta", {"ps": [str(p) for p in ps], "j": j},
                     [(dec(ps[j] + F(1, 10), 2), "no_suma_uno"), (dec(otros, 2), None), (dec(F(1, k), 2), None)],
                     [("1 − suma", dec(ps[j], 2), f"Las probabilidades suman 1: 1 − {dec(otros, 2)} = {dec(ps[j], 2)}.")],
                     "En una función de probabilidad, Σ pi = 1.", gen=[dec(ps[j] + F(1, 20), 2)])
    if tipo == "sigma":
        var = sum(x * x * p for x, p in zip(xs, ps)) - mu * mu
        sg = math.sqrt(var)
        return hacer(f"Función de probabilidad de X:\n{tabla}\nCalcula la desviación típica σ (redondea a las centésimas).", dec(sg, 2), "va_sigma", {"xs": xs, "ps": [str(p) for p in ps]},
                     [(dec(var, 2), None), (dec(math.sqrt(sum(x * x * p for x, p in zip(xs, ps))), 2), None), (dec(math.sqrt(F(sum((x - F(sum(xs), k)) ** 2 for x in xs), k)), 2), "media_sin_ponderar")],
                     [("μ", dec(mu, 2), f"μ = Σ x·p = {dec(mu, 2)}."), ("σ²", dec(var, 4), f"σ² = Σ x²·p − μ² = {dec(var, 4)}."), ("σ", dec(sg, 2), f"σ = √{dec(var, 4)} ≈ {dec(sg, 2)}.")],
                     "σ² = Σ xi²·pi − μ²; σ = √σ².", gen=[dec(sg + F(1, 2), 2)])
    if tipo == "juego":
        enun = f"En un juego, X es la ganancia en euros (negativa si se pierde):\n{tabla}\n¿Cuál es la ganancia esperada y conviene jugar?"
        resp = f"μ = {dec(mu, 2)} €; {'sí conviene' if mu > 0 else 'no conviene'}"
        mal = F(sum(xs), k)
        return hacer(enun, resp, "va_juego", {"xs": xs, "ps": [str(p) for p in ps]},
                     [(f"μ = {dec(mal, 2)} €; {'sí conviene' if mal > 0 else 'no conviene'}", "media_sin_ponderar"), (f"μ = {dec(mu, 2)} €; {'no conviene' if mu > 0 else 'sí conviene'}", None),
                      (f"μ = {dec(-mu, 2)} €; {'sí conviene' if -mu > 0 else 'no conviene'}", None)],
                     [("Σ x·p", dec(mu, 2), "μ = " + " + ".join(f"({fmt(x)})·{dec(p, 2)}" for x, p in zip(xs, ps)) + f" = {dec(mu, 2)} €. " + ("Positiva: a la larga se gana." if mu > 0 else "Negativa: a la larga se pierde."))],
                     "La esperanza μ = Σ xi·pi es la ganancia media a la larga; un juego es justo si μ = 0.")
    return hacer(f"Función de probabilidad de X:\n{tabla}\nCalcula la media (esperanza) μ.", dec(mu, 2), "va_media", {"xs": xs, "ps": [str(p) for p in ps]},
                 [(dec(F(sum(xs), k), 2), "media_sin_ponderar"), (dec(sum(xs), 2), None), (dec(mu + 1, 2), None)],
                 [("Σ x·p", dec(mu, 2), "μ = " + " + ".join(f"{x}·{dec(p, 2)}" for x, p in zip(xs, ps)) + f" = {dec(mu, 2)}.")],
                 "Esperanza de una variable discreta: μ = Σ xi·pi (media ponderada por las probabilidades).", gen=[dec(mu - F(1, 2), 2)])


PBIN = [F(1, 10), F(1, 5), F(1, 4), F(3, 10), F(2, 5), F(1, 2), F(3, 5), F(7, 10), F(4, 5)]


def _pbin(n, p, k):
    return math.comb(n, k) * float(p) ** k * float(1 - p) ** (n - k)


@gen6("t6_binomial")
def g_binomial(rng, d, tipo="calculo"):
    """EST.DISTR.02. Claves: olvida_combinatorio, exponentes_cambiados, sin_independencia."""
    if tipo == "identificar":
        ok = rng.choice(["Se lanza un dado 8 veces y X = número de seises.", "Un examen tipo test de 10 preguntas con 4 opciones se contesta al azar; X = número de aciertos.",
                         "Se sacan 5 bolas, devolviendo cada una, de una urna con 3 rojas y 7 azules; X = número de rojas.",
                         "El 5 % de las piezas de una fábrica sale defectuoso; se revisan 20 piezas y X = número de defectuosas."])
        malos = [("Se sacan 3 bolas sin devolverlas de una urna con 4 rojas y 3 azules; X = número de rojas.", "sin_independencia"),
                 ("Se lanza un dado hasta que sale un 6; X = número de lanzamientos.", None), ("X = estatura en cm de un alumno elegido al azar.", None),
                 ("Se reparten 5 cartas de una baraja de 40 sin devolución; X = número de oros.", "sin_independencia")]
        rng.shuffle(malos)
        return hacer("¿Cuál de estas variables sigue una distribución binomial?", ok, "binomial_id", {}, malos[:3],
                     [("", ok, "Binomial: número fijo de pruebas independientes, cada una con dos resultados (éxito/fracaso) y la misma probabilidad de éxito.")],
                     "Sin reemplazamiento la probabilidad cambia de una extracción a otra: no es binomial.")
    n = rng.randint(3, 6) if d == 1 else rng.randint(5, 12)
    p = rng.choice(PBIN)
    k = rng.randint(1, n - 1)
    r = _pbin(n, p, k)
    if tipo == "contexto":
        ctx = rng.choice([(f"Un examen tipo test tiene {n} preguntas con 4 opciones y se contesta al azar.", F(1, 4), "acertar exactamente {k}"),
                          (f"Un jugador encesta el {pc(p, 0)} de sus tiros libres y lanza {n}.", p, "encestar exactamente {k}"),
                          (f"Se lanza una moneda {n} veces.", F(1, 2), "obtener exactamente {k} caras")])
        p = ctx[1]
        r = _pbin(n, p, k)
        enun = f"{ctx[0]} ¿Qué probabilidad hay de {ctx[2].format(k=k)}? (4 decimales)"
    else:
        enun = f"X ~ B({n}; {dec(p, 2)}). Calcula P(X = {k}) (4 decimales)."
    sin_c = float(p) ** k * float(1 - p) ** (n - k)
    camb = math.comb(n, k) * float(p) ** (n - k) * float(1 - p) ** k
    return hacer(enun, p4(r), "binomial", {"n": n, "p": str(p), "k": k}, [(p4(sin_c), "olvida_combinatorio"), (p4(camb), "exponentes_cambiados"), (p4(math.comb(n, k) * float(p) ** k), None)],
                 [("C(n,k)·p^k·q^(n−k)", p4(r), f"P(X = {k}) = C({n},{k})·{dec(p, 2)}^{k}·{dec(1 - p, 2)}^{n - k} = {math.comb(n, k)}·{p4(float(p) ** k)}·{p4(float(1 - p) ** (n - k))} ≈ {p4(r)}.")],
                 "Binomial B(n,p): P(X = k) = C(n,k)·p^k·q^(n−k), con q = 1 − p.", gen=[p4(r / 2), p4(min(1, r * 1.5))])


@gen6("t6_binomial_acum")
def g_binomial_acum(rng, d, tipo="parametros"):
    """EST.DISTR.03. Claves: al_menos_uno_mal, frontera_mal, sigma_npq."""
    n = rng.randint(5, 20)
    p = rng.choice(PBIN)
    q = 1 - p
    if tipo == "parametros":
        mu, var = n * p, n * p * q
        return hacer(f"X ~ B({n}; {dec(p, 2)}). Calcula la desviación típica σ (2 decimales).", dec(math.sqrt(var), 2), "binomial_sigma", {"n": n, "p": str(p)},
                     [(dec(var, 2), "sigma_npq"), (dec(mu, 2), None), (dec(math.sqrt(mu), 2), None)],
                     [("μ = np", dec(mu, 2), f"μ = {n}·{dec(p, 2)} = {dec(mu, 2)}."), ("σ = √(npq)", dec(math.sqrt(var), 2), f"σ = √({n}·{dec(p, 2)}·{dec(q, 2)}) = √{dec(var, 4)} ≈ {dec(math.sqrt(var), 2)}.")],
                     "En B(n,p): μ = np y σ = √(npq).", gen=[dec(math.sqrt(var) + 1, 2)])
    if tipo == "al_menos_uno":
        r = 1 - float(q) ** n
        return hacer(f"X ~ B({n}; {dec(p, 2)}). Calcula P(X ≥ 1) (4 decimales).", p4(r), "binomial_almenos1", {"n": n, "p": str(p)},
                     [(p4(1 - _pbin(n, p, 1)), "al_menos_uno_mal"), (p4(float(q) ** n), None), (p4(1 - float(p) ** n), None)],
                     [("contrario", p4(float(q) ** n), f"El contrario de «al menos 1» es «ninguno»: P(X = 0) = {dec(q, 2)}^{n} ≈ {p4(float(q) ** n)}."),
                      ("1 − P(X=0)", p4(r), f"P(X ≥ 1) = 1 − {p4(float(q) ** n)} = {p4(r)}.")],
                     "P(X ≥ 1) = 1 − P(X = 0) = 1 − qⁿ.")
    n = rng.randint(5, 10)
    k = rng.randint(1, 3)
    acum = lambda m: sum(_pbin(n, p, i) for i in range(m + 1))
    r = 1 - acum(k)
    return hacer(f"X ~ B({n}; {dec(p, 2)}). Calcula P(X > {k}) (4 decimales).", p4(r), "binomial_mayor", {"n": n, "p": str(p), "k": k},
                 [(p4(1 - acum(k - 1)), "frontera_mal"), (p4(1 - acum(k + 1)), "frontera_mal"), (p4(acum(k)), None)],
                 [("P(X ≤ k)", p4(acum(k)), "P(X ≤ " + str(k) + ") = " + " + ".join(f"P(X={i})" for i in range(k + 1)) + f" ≈ {p4(acum(k))}."),
                  ("1 − P(X ≤ k)", p4(r), f"P(X > {k}) = 1 − {p4(acum(k))} = {p4(r)}.")],
                 f"P(X > k) = 1 − P(X ≤ k): «mayor que k» no incluye k.")


@gen6("t6_normal_tabla")
def g_normal_tabla(rng, d, tipo="menor"):
    """EST.DISTR.04. Claves: mayor_leida_directa, negativo_mal."""
    a = round(rng.randint(10, 250) / 100, 2)
    A = Phi(a)
    fa = lambda x: dec(x, 2)
    if tipo == "menor":
        return hacer(f"Z ~ N(0, 1). Calcula P(Z ≤ {fa(a)}).", p4(A), "normal_menor", {"a": a}, [(p4(1 - A), None), (p4(A - 0.5), None), (p4(Phi(a + 0.1)), None)],
                     [("tabla", p4(A), f"Se lee directamente en la tabla: P(Z ≤ {fa(a)}) = {p4(A)}.")],
                     "La tabla de N(0,1) da P(Z ≤ a) para a ≥ 0.")
    if tipo == "mayor":
        return hacer(f"Z ~ N(0, 1). Calcula P(Z ≥ {fa(a)}).", p4(1 - A), "normal_mayor", {"a": a}, [(p4(A), "mayor_leida_directa"), (p4(A - 0.5), None), (p4(1 - Phi(a + 0.1)), None)],
                     [("1 − tabla", p4(1 - A), f"P(Z ≥ {fa(a)}) = 1 − P(Z ≤ {fa(a)}) = 1 − {p4(A)} = {p4(1 - A)}.")],
                     "P(Z ≥ a) = 1 − P(Z ≤ a).")
    if tipo == "negativo":
        if rng.random() < 0.5:
            return hacer(f"Z ~ N(0, 1). Calcula P(Z ≤ −{fa(a)}).", p4(1 - A), "normal_neg", {"a": -a}, [(p4(A), "negativo_mal"), (p4(0.5 - A / 2), None), (p4(A - 0.5), None)],
                         [("simetría", p4(1 - A), f"Por simetría, P(Z ≤ −{fa(a)}) = P(Z ≥ {fa(a)}) = 1 − {p4(A)} = {p4(1 - A)}.")],
                         "Simetría de la normal: P(Z ≤ −a) = 1 − P(Z ≤ a).")
        return hacer(f"Z ~ N(0, 1). Calcula P(Z ≥ −{fa(a)}).", p4(A), "normal_neg", {"a": -a}, [(p4(1 - A), "negativo_mal"), (p4(A - 0.5), None), (p4(0.5 + A / 2), None)],
                     [("simetría", p4(A), f"P(Z ≥ −{fa(a)}) = P(Z ≤ {fa(a)}) = {p4(A)}.")],
                     "Simetría: P(Z ≥ −a) = P(Z ≤ a).")
    if tipo == "intervalo":
        b = round(rng.randint(10, 250) / 100, 2)
        B = Phi(b)
        r = B - (1 - A)
        return hacer(f"Z ~ N(0, 1). Calcula P(−{fa(a)} ≤ Z ≤ {fa(b)}).", p4(r), "normal_intervalo", {"a": -a, "b": b},
                     [(p4(abs(B - A)), "negativo_mal"), (p4(B + A - 0.5) if B + A - 0.5 < 1 else p4(B), None), (p4(B - A / 2), None)],
                     [("P(Z ≤ b)", p4(B), f"P(Z ≤ {fa(b)}) = {p4(B)}."), ("P(Z ≤ −a)", p4(1 - A), f"P(Z ≤ −{fa(a)}) = 1 − {p4(A)} = {p4(1 - A)}."),
                      ("restar", p4(r), f"P = {p4(B)} − {p4(1 - A)} = {p4(r)}.")],
                     "P(a ≤ Z ≤ b) = P(Z ≤ b) − P(Z ≤ a), usando la simetría para los negativos.")
    return hacer(f"Z ~ N(0, 1). Halla el valor k tal que P(Z ≤ k) = {p4(A)}.", fa(a), "normal_inversa", {"p": A}, [(p4(A), None), (fa(-a), "negativo_mal"), (fa(a + 0.1), None)],
                 [("tabla al revés", fa(a), f"Busco {p4(A)} dentro de la tabla: corresponde a k = {fa(a)}.")],
                 "Problema inverso: se busca la probabilidad dentro de la tabla y se lee el valor de z.")


@gen6("t6_tipificar")
def g_tipificar(rng, d, tipo="z"):
    """EST.DISTR.05. Claves: divide_varianza, no_resta_media, prob_como_z."""
    ctx = rng.choice([("La estatura de un grupo", 170, 8, "cm"), ("Las notas de un examen", 6, 1.5, "puntos"), ("El tiempo de un trayecto", 40, 5, "min"),
                      ("El peso de unas manzanas", 180, 20, "g")])
    mu, sg = ctx[1], ctx[2]
    for _ in range(100):
        z = round(rng.choice([-1, 1]) * rng.randint(10, 220) / 100, 2)
        x = mu + z * sg
        if abs(x * 10 - round(x * 10)) < 1e-9:
            x = round(x, 1)
            break
    base = f"{ctx[0]} sigue una N({dec(mu, 2)}; {dec(sg, 2)}) (en {ctx[3]}).\n"
    if tipo == "z":
        return hacer(base + f"¿Qué valor z corresponde a x = {dec(x, 2)}?", dec(z, 2), "tipificar", {"mu": mu, "sg": sg, "x": x},
                     [(dec((x - mu) / sg ** 2, 2), "divide_varianza"), (dec(x / sg, 2), "no_resta_media"), (dec(-z, 2), None)],
                     [("(x − μ)/σ", dec(z, 2), f"z = ({dec(x, 2)} − {dec(mu, 2)}) / {dec(sg, 2)} = {dec(z, 2)}.")],
                     "Tipificar: Z = (X − μ)/σ.", gen=[dec(z + 0.5, 2)])
    if tipo == "prob":
        mayor = rng.random() < 0.5
        P = Phi(z) if not mayor else 1 - Phi(z)
        z1 = round((x - mu) / sg ** 2, 2)
        z2 = round(x / sg, 2)
        f_ = (lambda t: 1 - Phi(t)) if mayor else Phi
        return hacer(base + f"Calcula P(X {'>' if mayor else '<'} {dec(x, 2)}).", p4(P), "normal_prob", {"mu": mu, "sg": sg, "x": x},
                     [(p4(f_(z1)), "divide_varianza"), (p4(f_(z2)) if abs(z2) < 4 else p4(1 - P), "no_resta_media" if abs(z2) < 4 else None), (p4(1 - P), None)],
                     [("tipificar", dec(z, 2), f"z = ({dec(x, 2)} − {dec(mu, 2)}) / {dec(sg, 2)} = {dec(z, 2)}."),
                      ("tabla", p4(P), f"P(Z {'>' if mayor else '<'} {dec(z, 2)}) = {p4(P)}.")],
                     "Se tipifica y se usa la tabla de N(0,1), con 1 − … y simetría cuando haga falta.")
    top = rng.choice([(10, 1.28), (5, 1.645), (20, 0.84), (25, 0.67), (1, 2.33)])
    v = mu + top[1] * sg
    return hacer(base + f"¿Qué valor mínimo hay que superar para estar en el {top[0]} % superior?", dec(v, 2), "normal_inversa_x", {"mu": mu, "sg": sg, "p": top[0]},
                 [(dec(mu + (1 - top[0] / 100) * sg, 2), "prob_como_z"), (dec(mu + top[1] * sg ** 2, 2), "divide_varianza"), (dec(mu - top[1] * sg, 2), None)],
                 [("z de la tabla", dec(top[1], 3), f"Hay que dejar por debajo el {100 - top[0]} %: P(Z ≤ z) = {dec(1 - top[0] / 100, 2)} → z ≈ {dec(top[1], 3)}."),
                  ("destipificar", dec(v, 2), f"x = μ + z·σ = {dec(mu, 2)} + {dec(top[1], 3)}·{dec(sg, 2)} = {dec(v, 2)}.")],
                 "Problema inverso: se busca z en la tabla y se deshace la tipificación, x = μ + z·σ.")


@gen6("t6_aprox_normal")
def g_aprox_normal(rng, d, tipo="parametros"):
    """EST.DISTR.06. Claves: sin_correccion, correccion_al_reves, sigma_npq."""
    for _ in range(100):
        n = rng.choice([50, 60, 80, 100, 120, 150, 200, 300])
        p = rng.choice([F(1, 5), F(1, 4), F(3, 10), F(2, 5), F(1, 2), F(3, 5)])
        mu, var = n * p, n * p * (1 - p)
        if mu >= 5 and n * (1 - p) >= 5 and mu.denominator == 1:
            break
    sg = round(math.sqrt(var), 2)
    if tipo == "parametros":
        resp = f"N({dec(mu, 2)}; {dec(sg, 2)})"
        return hacer(f"X ~ B({n}; {dec(p, 2)}). ¿Por qué normal se puede aproximar?", resp, "aprox_param", {"n": n, "p": str(p)},
                     [(f"N({dec(mu, 2)}; {dec(var, 2)})", "sigma_npq"), (f"N({dec(mu, 2)}; {dec(math.sqrt(mu), 2)})", None), (f"N({n}; {dec(p, 2)})", None)],
                     [("np, nq ≥ 5", dec(mu, 2), f"np = {dec(mu, 2)} ≥ 5 y nq = {dec(n * (1 - p), 2)} ≥ 5: se puede aproximar."),
                      ("σ = √(npq)", dec(sg, 2), f"μ = {dec(mu, 2)}, σ = √{dec(var, 2)} ≈ {dec(sg, 2)}.")],
                     "Si np ≥ 5 y nq ≥ 5, B(n,p) ≈ N(np, √(npq)).")
    k = int(mu) + rng.choice([-8, -6, -5, -4, -3, 3, 4, 5, 6, 8])
    if tipo == "menor":
        zc, zs, zr = (k + 0.5 - float(mu)) / sg, (k - float(mu)) / sg, (k - 0.5 - float(mu)) / sg
        P = Phi(zc)
        return hacer(f"X ~ B({n}; {dec(p, 2)}). Aproximando por la normal, calcula P(X ≤ {k}).", p4(P), "aprox_menor", {"n": n, "p": str(p), "k": k},
                     [(p4(Phi(zs)), "sin_correccion"), (p4(Phi(zr)), "correccion_al_reves"), (p4(Phi((k + 0.5 - float(mu)) / float(var))), "sigma_npq")],
                     [("N(μ, σ)", f"N({dec(mu, 2)}; {dec(sg, 2)})", f"μ = {dec(mu, 2)}, σ ≈ {dec(sg, 2)}."),
                      ("corrección", f"{dec(k + 0.5, 2)}", f"Corrección de continuidad: P(X ≤ {k}) ≈ P(X' ≤ {dec(k + 0.5, 2)})."),
                      ("tipificar", p4(P), f"z = ({dec(k + 0.5, 2)} − {dec(mu, 2)})/{dec(sg, 2)} ≈ {dec(round(zc, 2), 2)} → P ≈ {p4(P)}.")],
                     "Aproximación normal de la binomial con corrección de continuidad: P(X ≤ k) ≈ P(Y ≤ k + 0,5).")
    zc, zs, zr = (k - 0.5 - float(mu)) / sg, (k - float(mu)) / sg, (k + 0.5 - float(mu)) / sg
    P = 1 - Phi(zc)
    return hacer(f"X ~ B({n}; {dec(p, 2)}). Aproximando por la normal, calcula P(X ≥ {k}).", p4(P), "aprox_mayor", {"n": n, "p": str(p), "k": k},
                 [(p4(1 - Phi(zs)), "sin_correccion"), (p4(1 - Phi(zr)), "correccion_al_reves"), (p4(1 - Phi((k - 0.5 - float(mu)) / float(var))), "sigma_npq")],
                 [("N(μ, σ)", f"N({dec(mu, 2)}; {dec(sg, 2)})", f"μ = {dec(mu, 2)}, σ ≈ {dec(sg, 2)}."),
                  ("corrección", f"{dec(k - 0.5, 2)}", f"P(X ≥ {k}) ≈ P(X' ≥ {dec(k - 0.5, 2)})."),
                  ("tipificar", p4(P), f"z = ({dec(k - 0.5, 2)} − {dec(mu, 2)})/{dec(sg, 2)} ≈ {dec(round(zc, 2), 2)} → P ≈ {p4(P)}.")],
                 "Corrección de continuidad: P(X ≥ k) ≈ P(Y ≥ k − 0,5).")


# ================================================================ INFERENCIA

ZC = {90: 1.645, 95: 1.96, 99: 2.575}


@gen6("t6_muestreo")
def g_muestreo(rng, d, tipo="estratificado"):
    """EST.INFER.02. Claves: reparto_igual, sistematico_por_simple."""
    if tipo == "tipo":
        casos = [("Se numeran los 800 alumnos y se sortean 40 números con un programa.", "aleatorio simple"),
                 ("De la lista de 600 socios se elige uno al azar entre los 10 primeros y luego uno de cada 10.", "sistemático"),
                 ("Se toma de cada curso un número de alumnos proporcional a su tamaño, elegidos al azar.", "estratificado"),
                 ("Se sortean 3 de las 20 aulas del centro y se encuesta a todos los alumnos de esas aulas.", "por conglomerados")]
        desc, resp = rng.choice(casos)
        tipos = ["aleatorio simple", "sistemático", "estratificado", "por conglomerados"]
        dis = [(t, "sistematico_por_simple" if (resp == "sistemático" and t == "aleatorio simple") else None) for t in tipos if t != resp]
        return hacer(f"¿Qué tipo de muestreo es? «{desc}»", resp, "muestreo_tipo", {}, dis,
                     [("", resp, {"aleatorio simple": "Todos tienen la misma probabilidad y se eligen por sorteo directo.", "sistemático": "Se elige un arranque al azar y luego a intervalos fijos.",
                                  "estratificado": "Se divide la población en grupos (estratos) y se toma de cada uno una parte proporcional.",
                                  "por conglomerados": "Se sortean grupos enteros y se estudia a todos sus miembros."}[resp])],
                     "Simple: sorteo directo; sistemático: 1 de cada k; estratificado: por grupos proporcionales; conglomerados: grupos enteros.",
                     datos={"opciones_fijas": True})
    for _ in range(300):
        k = 3 if d < 3 else 4
        n = rng.choice([30, 40, 50, 60, 80, 100, 120])
        tams = [rng.randint(5, 40) * 10 for _ in range(k)]
        N = sum(tams)
        parts = [F(n * t, N) for t in tams]
        if all(p.denominator == 1 for p in parts) and len(set(tams)) == k:
            break
    else:
        return None
    parts = [int(p) for p in parts]
    nombres = ["1.º", "2.º", "3.º", "4.º"][:k]
    enun = (f"Un instituto tiene " + lista([f"{t} alumnos en {c}" for t, c in zip(tams, nombres)]) + f". Se quiere una muestra estratificada proporcional de {n} alumnos. ")
    if tipo == "estratificado":
        resp = lista(parts)
        return hacer(enun + "¿Cuántos se eligen de cada curso?", resp, "estratificado", {"tams": tams, "n": n},
                     [(lista([n // k] * k) if n % k == 0 else lista([round(n / k)] * k), "reparto_igual"), (lista(list(reversed(parts))), None),
                      (lista([p + (1 if i == 0 else -1 if i == 1 else 0) for i, p in enumerate(parts)]), None)],
                     [("n·Ni/N", resp, f"Total N = {N}. Cada curso aporta n·Ni/N: " + ", ".join(f"{n}·{t}/{N} = {p}" for t, p in zip(tams, parts)) + ".")],
                     "Afijación proporcional: ni = n·Ni/N, cada estrato en la misma proporción que en la población.")
    i = rng.randrange(k)
    return hacer(enun + f"¿Cuántos alumnos de {nombres[i]} habrá en la muestra?", fmt(parts[i]), "estratificado_uno", {"tams": tams, "n": n, "i": i},
                 [(dec(F(n, k), 1), "reparto_igual"), (fmt(tams[i] // 10), None), (fmt(parts[i] + 2), None)],
                 [("n·Ni/N", fmt(parts[i]), f"{n} · {tams[i]} / {N} = {parts[i]}.")],
                 "Afijación proporcional: ni = n·Ni/N.", gen=[fmt(parts[i] + 1)])


@gen6("t6_estimacion")
def g_estimacion(rng, d, tipo="proporcion"):
    """EST.INFER.03. Claves: parametro_estadistico, divide_n."""
    if tipo == "proporcion":
        n = rng.choice([100, 200, 250, 400, 500, 800, 1000])
        k = rng.randint(n // 10, n * 9 // 10)
        if (F(k, n) * 1000).denominator != 1:
            k = k // 2 * 2
        ctx = rng.choice(["votarían al partido A", "usan el transporte público", "han leído un libro este mes", "practican deporte a diario"])
        return hacer(f"En una muestra aleatoria de {n} personas, {k} {ctx}. ¿Cuál es la estimación puntual de la proporción en la población?", dec(F(k, n), 4), "p_gorro", {"k": k, "n": n},
                     [(dec(F(n, k), 4), None), (dec(F(k, n - k), 4), None), (f"{k}", None)],
                     [("k/n", dec(F(k, n), 4), f"p̂ = {k}/{n} = {dec(F(k, n), 4)}.")],
                     "La proporción muestral p̂ = k/n estima la proporción poblacional p.", gen=[dec(F(k, n) + F(1, 100), 4)])
    if tipo == "concepto":
        v = dec(F(rng.randint(20, 80), 100), 2)
        resp = f"una estimación de la proporción de la población, calculada en la muestra (estadístico)"
        return hacer(f"En una encuesta a una muestra de votantes, la proporción que votaría a A es {v}. ¿Qué es {v}?", resp, "estimador_concepto", {},
                     [(f"la proporción exacta de toda la población (parámetro)", "parametro_estadistico"), (f"la probabilidad de que la población vote a A con seguridad", None),
                      (f"el error de la encuesta", None)],
                     [("", resp, "Un estadístico se calcula en la muestra y varía de una muestra a otra; el parámetro (de la población) es fijo y desconocido.")],
                     "Parámetro: valor de la población (μ, p, σ). Estadístico: valor de la muestra (x̄, p̂, s) que lo estima.")
    for _ in range(500):
        n = rng.randint(4, 6)
        datos = [rng.randint(2, 20) for _ in range(n)]
        m = F(sum(datos), n)
        ss = sum((x - m) ** 2 for x in datos)
        if m.denominator == 1 and ss > 0:
            break
    s = math.sqrt(ss / (n - 1))
    sg = math.sqrt(ss / n)
    return hacer(f"Muestra: {', '.join(map(str, datos))}. Estima la desviación típica de la población con la cuasidesviación típica s (2 decimales).", dec(s, 2), "cuasidesviacion",
                 {"datos": datos}, [(dec(sg, 2), "divide_n"), (dec(ss / (n - 1), 2), None), (dec(m, 2), None)],
                 [("media", fmt(m), f"x̄ = {m}."), ("Σ(x − x̄)²", dec(ss, 2), f"Σ(x − x̄)² = {dec(ss, 2)}."), ("÷ (n − 1) y raíz", dec(s, 2), f"s = √({dec(ss, 2)}/{n - 1}) ≈ {dec(s, 2)}.")],
                 "El estimador de σ es la cuasidesviación s, que divide entre n − 1.", gen=[dec(s + 1, 2)])


@gen6("t6_media_muestral")
def g_media_muestral(rng, d, tipo="error_tipico"):
    """EST.INFER.04. Claves: usa_sigma, divide_n."""
    mu = rng.choice([50, 100, 170, 250, 500, 1000])
    sg = rng.choice([5, 8, 10, 12, 15, 20, 30, 40, 60, 100])
    n = rng.choice([16, 25, 36, 49, 64, 100, 144])
    se = F(sg, math.isqrt(n))
    base = f"Una población sigue N({mu}; {sg}). Se toman muestras de tamaño {n}.\n"
    if tipo == "error_tipico":
        return hacer(base + "¿Cuál es la desviación típica de la media muestral x̄?", dec(se, 4), "error_tipico", {"sg": sg, "n": n},
                     [(fmt(sg), "usa_sigma"), (dec(F(sg, n), 4), "divide_n"), (dec(sg * math.sqrt(n), 2), None)],
                     [("σ/√n", dec(se, 4), f"x̄ ~ N({mu}; σ/√n) con σ/√n = {sg}/√{n} = {sg}/{math.isqrt(n)} = {dec(se, 4)}.")],
                     "Teorema central del límite: x̄ ~ N(μ, σ/√n).")
    for _ in range(100):
        z = round(rng.choice([-1, 1]) * rng.randint(20, 250) / 100, 2)
        a = mu + z * float(se)
        if abs(a * 100 - round(a * 100)) < 1e-6:
            a = round(a, 2)
            break
    mayor = rng.random() < 0.5
    f_ = (lambda t: 1 - Phi(t)) if mayor else Phi
    P = f_(z)
    return hacer(base + f"Calcula P(x̄ {'>' if mayor else '<'} {dec(a, 2)}).", p4(P), "media_muestral_p", {"mu": mu, "sg": sg, "n": n, "a": a},
                 [(p4(f_((a - mu) / sg)), "usa_sigma"), (p4(f_((a - mu) / (sg / n))), "divide_n"), (p4(1 - P), None)],
                 [("σ/√n", dec(se, 4), f"x̄ ~ N({mu}; {dec(se, 4)})."), ("tipificar", dec(z, 2), f"z = ({dec(a, 2)} − {mu}) / {dec(se, 4)} = {dec(z, 2)}."),
                  ("tabla", p4(P), f"P ≈ {p4(P)}.")],
                 "Para probabilidades sobre x̄ se tipifica con σ/√n, no con σ.")


@gen6("t6_prop_muestral")
def g_prop_muestral(rng, d, tipo="sigma"):
    """EST.INFER.05. Claves: sin_dividir_n, mezcla_recuentos."""
    p = rng.choice([F(1, 5), F(1, 4), F(3, 10), F(2, 5), F(1, 2), F(3, 5), F(7, 10)])
    n = rng.choice([100, 150, 200, 300, 400, 500, 600])
    s = math.sqrt(float(p * (1 - p)) / n)
    base = f"En una población, la proporción de personas con cierta característica es p = {dec(p, 2)}. Se toman muestras de {n} personas.\n"
    if tipo == "sigma":
        return hacer(base + "¿Cuál es la desviación típica de la proporción muestral p̂? (4 decimales)", p4(s), "sigma_p", {"p": str(p), "n": n},
                     [(p4(math.sqrt(float(p * (1 - p)))), "sin_dividir_n"), (p4(float(p * (1 - p)) / n), None), (p4(math.sqrt(n * float(p * (1 - p)))), "mezcla_recuentos")],
                     [("√(pq/n)", p4(s), f"σ = √({dec(p, 2)}·{dec(1 - p, 2)}/{n}) ≈ {p4(s)}.")],
                     "Para n grande, p̂ ~ N(p, √(p(1 − p)/n)).")
    a = round(float(p) + rng.choice([-1, 1]) * rng.randint(2, 8) / 100, 2)
    z = round((a - float(p)) / s, 2)
    mayor = rng.random() < 0.5
    f_ = (lambda t: 1 - Phi(t)) if mayor else Phi
    P = f_(z)
    z_mal = (a - float(p)) / math.sqrt(float(p * (1 - p)))
    return hacer(base + f"Calcula P(p̂ {'>' if mayor else '<'} {dec(a, 2)}).", p4(P), "prop_muestral_p", {"p": str(p), "n": n, "a": a},
                 [(p4(f_(z_mal)), "sin_dividir_n"), (p4(1 - P), None), (p4(f_(z / 2)), None)],
                 [("σ", p4(s), f"σ = √({dec(p, 2)}·{dec(1 - p, 2)}/{n}) ≈ {p4(s)}."), ("tipificar", dec(z, 2), f"z = ({dec(a, 2)} − {dec(p, 2)}) / {p4(s)} ≈ {dec(z, 2)}."),
                  ("tabla", p4(P), f"P ≈ {p4(P)}.")],
                 "Se tipifica p̂ con √(pq/n).")


def _ic(c, s):
    return f"({c[0]}; {c[1]})".replace("(", "(").replace("; ", "; ") if s is None else s


@gen6("t6_ic_media")
def g_ic_media(rng, d, tipo="intervalo"):
    """EST.INFER.06. Claves: critico_mal, interpretacion_probabilistica, confianza_estrecha."""
    if tipo == "critico":
        nv = rng.choice([90, 95, 99])
        otros = {90: [("1,96", None), ("0,9", None), ("1,28", "critico_mal")], 95: [("1,645", "critico_mal"), ("0,95", None), ("2,575", None)],
                 99: [("1,96", "critico_mal"), ("0,99", None), ("2,33", "critico_mal")]}[nv]
        return hacer(f"¿Qué valor crítico z_α/2 se usa para un intervalo de confianza del {nv} %?", dec(ZC[nv], 3), "critico", {"nivel": nv}, otros,
                     [("tabla", dec(ZC[nv], 3), f"Nivel {nv} %: α = {dec(1 - nv / 100, 2)}, α/2 = {dec((1 - nv / 100) / 2, 3)}; P(Z ≤ z) = {dec(1 - (1 - nv / 100) / 2, 3)} → z ≈ {dec(ZC[nv], 3)}.")],
                     "Valores críticos habituales: 1,645 (90 %), 1,96 (95 %), 2,575 (99 %).")
    if tipo == "concepto":
        if rng.random() < 0.5:
            return hacer("Si con los mismos datos se pasa de un nivel de confianza del 95 % al 99 %, el intervalo para la media…", "se hace más ancho", "ic_nivel", {},
                         [("se hace más estrecho", "confianza_estrecha"), ("no cambia", None), ("se desplaza hacia la derecha", None)],
                         [("", "más ancho", "Más confianza exige un valor crítico mayor (2,575 frente a 1,96): el margen de error crece.")],
                         "A más confianza, intervalo más ancho; a mayor n, intervalo más estrecho.")
        return hacer("Un intervalo de confianza del 95 % para μ es (70,04; 73,96). ¿Cuál es la interpretación correcta?",
                     "el 95 % de los intervalos construidos así contendrían a μ", "ic_interp", {},
                     [("hay un 95 % de probabilidad de que μ esté en (70,04; 73,96)", "interpretacion_probabilistica"), ("el 95 % de los datos está entre 70,04 y 73,96", None),
                      ("μ vale exactamente 72", None)],
                     [("", "", "μ es un número fijo: está o no está en ese intervalo concreto. El 95 % se refiere al método: 95 de cada 100 intervalos así construidos contienen a μ.")],
                     "La confianza es una propiedad del procedimiento, no una probabilidad sobre un intervalo ya calculado.")
    nv = rng.choice([90, 95, 99])
    xb = rng.randint(20, 200)
    sg = rng.choice([4, 5, 6, 8, 10, 12, 15, 20])
    n = rng.choice([25, 36, 49, 64, 100, 144, 225])
    E = ZC[nv] * sg / math.sqrt(n)
    iv = lambda e: f"({dec(xb - e, 2)}; {dec(xb + e, 2)})"
    otro = 1.645 if nv != 90 else 1.96
    return hacer(f"En una muestra de {n} datos, x̄ = {xb}. Se sabe que σ = {sg}. Calcula el intervalo de confianza para μ al {nv} %.", iv(E), "ic_media", {"xb": xb, "sg": sg, "n": n, "nivel": nv},
                 [(iv(otro * sg / math.sqrt(n)), "critico_mal"), (iv(ZC[nv] * sg), None), (iv(ZC[nv] * sg / n), None)],
                 [("z", dec(ZC[nv], 3), f"Al {nv} %, z_α/2 = {dec(ZC[nv], 3)}."), ("error", dec(E, 2), f"E = {dec(ZC[nv], 3)} · {sg}/√{n} = {dec(E, 2)}."),
                  ("intervalo", iv(E), f"x̄ ± E = {xb} ± {dec(E, 2)} = {iv(E)}.")],
                 "IC para μ con σ conocida: x̄ ± z_α/2·σ/√n.")


@gen6("t6_ic_prop")
def g_ic_prop(rng, d, tipo="margen"):
    """EST.INFER.07. Claves: sin_dividir_n, porcentaje_por_proporcion."""
    n = rng.choice([100, 200, 400, 500, 625, 800, 1000])
    k = rng.randint(n // 5, n * 4 // 5)
    ph = F(k, n)
    if (ph * 100).denominator != 1:
        ph = F(round(ph * 100), 100)
        k = int(ph * n)
    nv = rng.choice([90, 95, 99])
    z = ZC[nv]
    E = z * math.sqrt(float(ph * (1 - ph)) / n)
    base = f"En una muestra de {n} personas, la proporción que responde «sí» es p̂ = {dec(ph, 2)}.\n"
    if tipo == "margen":
        return hacer(base + f"Calcula el margen de error del intervalo al {nv} % (4 decimales).", p4(E), "ic_prop_E", {"ph": str(ph), "n": n, "nivel": nv},
                     [(p4(z * math.sqrt(float(ph * (1 - ph)))), "sin_dividir_n"), (dec(z * math.sqrt(float(ph * 100) * float((1 - ph) * 100) / n), 4), "porcentaje_por_proporcion"),
                      (p4(z * float(ph * (1 - ph)) / n), None)],
                     [("z", dec(z, 3), f"z_α/2 = {dec(z, 3)}."), ("E", p4(E), f"E = {dec(z, 3)}·√({dec(ph, 2)}·{dec(1 - ph, 2)}/{n}) ≈ {p4(E)}.")],
                     "IC para una proporción: p̂ ± z_α/2·√(p̂(1 − p̂)/n), con p̂ como proporción (no porcentaje).")
    lo, hi = float(ph) - E, float(ph) + E
    if tipo == "intervalo":
        iv = f"({dec(lo, 4)}; {dec(hi, 4)})"
        Em = z * math.sqrt(float(ph * (1 - ph)))
        return hacer(base + f"Calcula el intervalo de confianza al {nv} % para la proporción (4 decimales).", iv, "ic_prop", {"ph": str(ph), "n": n, "nivel": nv},
                     [(f"({dec(max(0, float(ph) - Em), 4)}; {dec(min(1, float(ph) + Em), 4)})", "sin_dividir_n"), (f"({dec(float(ph) - E / 2, 4)}; {dec(float(ph) + E / 2, 4)})", None),
                      (f"({dec(float(ph) - E * 2, 4)}; {dec(float(ph) + E * 2, 4)})", None)],
                     [("E", p4(E), f"E = {dec(z, 3)}·√({dec(ph, 2)}·{dec(1 - ph, 2)}/{n}) ≈ {p4(E)}."), ("p̂ ± E", iv, f"{dec(ph, 2)} ± {p4(E)} = {iv}.")],
                     "IC para p: p̂ ± z_α/2·√(p̂(1 − p̂)/n).")
    dentro = rng.random() < 0.5
    v = round(rng.uniform(lo + 0.002, hi - 0.002), 2) if dentro else round(hi + rng.uniform(0.01, 0.05), 2)
    if lo < v < hi:
        resp = f"sí, porque {dec(v, 2)} está dentro del intervalo ({dec(lo, 4)}; {dec(hi, 4)})"
        dis = [(f"no, porque {dec(v, 2)} es distinto de {dec(ph, 2)}", None), ("no se puede saber sin conocer p", None), (f"no, porque el margen es {p4(E)}", None)]
    else:
        resp = f"no, porque {dec(v, 2)} queda fuera del intervalo ({dec(lo, 4)}; {dec(hi, 4)})"
        dis = [(f"sí, porque {dec(v, 2)} está cerca de {dec(ph, 2)}", None), ("no se puede saber sin conocer p", None),
               (f"sí, porque el intervalo sin dividir entre n lo contiene", "sin_dividir_n")]
    return hacer(base + f"Al {nv} % de confianza, ¿es compatible con estos datos que la proporción real sea {dec(v, 2)}?", resp, "ic_prop_compat", {"ph": str(ph), "n": n, "v": v}, dis,
                 [("intervalo", f"({dec(lo, 4)}; {dec(hi, 4)})", f"E ≈ {p4(E)}; intervalo ({dec(lo, 4)}; {dec(hi, 4)}). Se mira si {dec(v, 2)} cae dentro.")],
                 "Un valor de p es compatible con los datos (a ese nivel) si está dentro del intervalo de confianza.")


@gen6("t6_tamano_muestra")
def g_tamano_muestra(rng, d, tipo="n_media"):
    """EST.INFER.08. Claves: redondea_abajo, olvida_cuadrado."""
    nv = rng.choice([90, 95, 99])
    z = ZC[nv]
    if tipo == "error":
        sg = rng.choice([4, 5, 6, 8, 10, 12, 15, 20])
        n = rng.choice([16, 25, 36, 49, 64, 100])
        E = z * sg / math.sqrt(n)
        return hacer(f"σ = {sg}, n = {n}, confianza del {nv} %. ¿Cuál es el error máximo admisible E? (2 decimales)", dec(E, 2), "error_max", {"sg": sg, "n": n, "nivel": nv},
                     [(dec(z * sg / n, 2), None), (dec(z * sg, 2), None), (dec((1.645 if nv != 90 else 1.96) * sg / math.sqrt(n), 2), None)],
                     [("z·σ/√n", dec(E, 2), f"E = {dec(z, 3)} · {sg}/√{n} = {dec(E, 2)}.")],
                     "Error máximo: E = z_α/2·σ/√n.")
    if tipo == "n_media":
        for _ in range(100):
            sg = rng.choice([5, 8, 10, 12, 15, 20, 25, 30])
            E = rng.choice([1, 2, 3, 4, 5])
            val = (z * sg / E) ** 2
            if abs(val - round(val)) > 0.05 and val > 5:
                break
        n = math.ceil(val)
        return hacer(f"Se quiere estimar μ con σ = {sg}, un error menor que {E} y confianza del {nv} %. ¿Cuál es el tamaño mínimo de la muestra?", fmt(n), "n_media",
                     {"sg": sg, "E": E, "nivel": nv},
                     [(fmt(math.floor(val)), "redondea_abajo"), (fmt(math.ceil(z * sg / E)), "olvida_cuadrado"), (fmt(math.ceil((1.645 if nv != 90 else 1.96) * sg / E) ** 2), None)],
                     [("despejar", dec(val, 2), f"n ≥ (z·σ/E)² = ({dec(z, 3)}·{sg}/{E})² = {dec(val, 2)}."), ("redondear arriba", fmt(n), f"n = {n} (siempre hacia arriba).")],
                     "n ≥ (z_α/2·σ/E)², redondeando siempre hacia arriba.", gen=[fmt(n + 1), fmt(n * 2)])
    for _ in range(100):
        E = rng.choice([0.01, 0.02, 0.03, 0.04, 0.05])
        ph = rng.choice([0.5, 0.3, 0.4, 0.2, 0.35])
        val = z * z * ph * (1 - ph) / E ** 2
        if abs(val - round(val)) > 0.05:
            break
    n = math.ceil(val)
    return hacer(f"Se quiere estimar una proporción con un error máximo de {dec(E, 2)} y confianza del {nv} %, suponiendo p = {dec(ph, 2)}. ¿Cuál es el tamaño mínimo de la muestra?",
                 fmt(n), "n_prop", {"E": E, "p": ph, "nivel": nv},
                 [(fmt(math.floor(val)), "redondea_abajo"), (fmt(math.ceil(z * math.sqrt(ph * (1 - ph)) / E)), "olvida_cuadrado"), (fmt(math.ceil(z * ph * (1 - ph) / E ** 2)), None)],
                 [("despejar", dec(val, 2), f"n ≥ z²·p(1 − p)/E² = {dec(z, 3)}²·{dec(ph, 2)}·{dec(1 - ph, 2)}/{dec(E, 2)}² = {dec(val, 2)}."), ("redondear arriba", fmt(n), f"n = {fmt(n)}.")],
                 "Para proporciones: n ≥ z²·p(1 − p)/E² (p = 0,5 si no se conoce), redondeando hacia arriba.", gen=[fmt(n + 1)])
