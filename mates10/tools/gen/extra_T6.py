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
