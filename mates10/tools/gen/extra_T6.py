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


def sing(c):
    return c[:-1] if c.endswith("s") else c


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
    ctx = rng.choice(["notas (sobre 40) de un examen", "minutos que se tarda en llegar al instituto", "puntos conseguidos en un juego"])
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
