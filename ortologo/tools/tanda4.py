"""Tanda 4: la í, la ñ y la Ñ en unas 70 tipografías libres (./fuentes) y
construcciones de icono (un solo trazo, tecla, bocadillo, aro, rombo…).

    python3 ortologo/tools/tanda4.py > filas.json
"""
import json, sys, math
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from marca import *
from marca import _n
from tanda1 import paleta, NOCHE_HEX, AMARILLO
NOCHE_AM = paleta(NOCHE_HEX, AMARILLO, AMARILLO)
SOL_AZUL = paleta(AMARILLO, NOCHE_HEX, NOCHE_HEX)
NEGRO_AM = paleta("#111111", AMARILLO, AMARILLO)
SOL_NEGRO = paleta(AMARILLO, "#111111", "#111111")
PAPEL_NEGRO = paleta("#FFFFFF", "#111111", "#111111")
ROJO = "#E8443A"
D = []

def cuadro(g, margen=20, rx=22, papel="A"):
    lado = max(g.w, g.h) + 2 * margen
    return rect(g.cx - lado / 2, g.cy - lado / 2, lado, lado, rx, papel) + g
def bloque(g, margen=18, rx=20):
    return rect(g.bb[0] - margen, g.bb[1] - margen, g.w + 2 * margen, g.h + 2 * margen, rx, "A") + g
def disco(g, aire=1.5):
    r = math.hypot(g.w, g.h) / 2 * aire * 0.78
    return circ(g.cx, g.cy, r, "A") + g

def add(titulo, concepto, marca, pal, tam=0.56, peg="tarjeta", palabra=None, redondo=False, etiquetas=()):
    D.append(dict(titulo=titulo, concepto=concepto, marca=marca, pal=pal, tam=tam, peg=peg, palabra=palabra or txt("Ortografía10", 800), redondo=redondo, etiquetas=list(etiquetas)))

# ---------- A. la forma de la letra: la misma í / ñ en muchas tipografías ----------
TRAT = {1: "amarilla, de noche", 2: "en el bloque amarillo", 3: "a sangre sobre amarillo", 4: "en círculo amarillo"}
def letra(ch, fam, peso, trat, nombre, porque, pal=None, tags=()):
    L = lambda p: txt(ch, peso, papel=p, fam=fam)
    # el nombre va en la misma letra, salvo donde el «10» no se leería bien
    w = None if fam in ("fascinate", "marckscript", "sedgwickavedisplay", "majormonodisplay", "monoton", "rocksalt") else txt("Ortografía10", peso, fam=fam)
    alto = len(ch) == 1 and ch in "íÍ"
    if trat == 1: m, pl, tam, red = L("A"), pal or NOCHE_AM, (0.6 if alto else 0.54), False
    elif trat == 2: m, pl, tam, red = cuadro(L("F"), 22 if not alto else 20), pal or NOCHE_AM, 0.6, False
    elif trat == 3: m, pl, tam, red = L("T"), pal or SOL_AZUL, (0.6 if alto else 0.56), False
    else: m, pl, tam, red = disco(L("F")), pal or NOCHE_AM, 0.74, True
    if len(ch) > 1 and trat == 2: m = bloque(L("F"), 18, 20); tam = 0.64
    if len(ch) > 1 and trat in (1, 3): tam = 0.62
    add(f"{ch} {nombre}, {TRAT[trat]}", porque, m, pl, tam, peg="sello" if trat in (3, 4) else "tarjeta", palabra=w, redondo=red,
        etiquetas=[ch, fam, "tipografia", *tags])

F = [  # (familia, peso, nombre, por qué, [(letra, tratamiento), ...])
 ("fredoka", 700, "redonda y amable", "Letra redondeada, de app de idiomas: cercana y nada escolar.", [("ñ", 3), ("í", 2), ("íñ", 1)]),
 ("nunito", 900, "redonda", "Terminaciones redondas, muy legible en pequeño.", [("ñ", 2), ("í", 3)]),
 ("baloo2", 800, "blandita", "Formas blandas y generosas; simpática sin ser infantil.", [("ñ", 1), ("í", 4)]),
 ("titanone", 400, "gordita", "Muy gruesa y redonda: se lee a cualquier tamaño.", [("ñ", 3), ("Ñ", 2)]),
 ("lilitaone", 400, "de rótulo amable", "Rótulo grueso con un punto de dibujo animado.", [("ñ", 2), ("í", 1)]),
 ("chango", 400, "ultragruesa", "Casi una mancha: la virgulilla y la letra se funden en una silueta.", [("ñ", 3)]),
 ("sniglet", 800, "de plastilina", "Formas de burbuja; la más juguetona de todas.", [("ñ", 2)]),
 ("rubik", 900, "de esquinas suaves", "Geométrica con las esquinas redondeadas: moderna y sólida.", [("ñ", 2), ("í", 3), ("Ñ", 1)]),
 ("delagothicone", 400, "maciza", "Bloque negro y compacto, con mucha presencia.", [("ñ", 1)]),
 ("unbounded", 900, "ancha y futurista", "Muy ancha, de marca tecnológica; la virgulilla se vuelve una visera.", [("ñ", 3), ("í", 2), ("Ñ", 1)]),
 ("syne", 800, "extraancha", "La más ancha: la ñ casi es un puente con su onda encima.", [("ñ", 1), ("Ñ", 3)]),
 ("archivoblack", 400, "de titular", "Negra de titular, neutra y contundente.", [("ñ", 2), ("í", 1)]),
 ("anton", 400, "condensada de cartel", "Alta y estrecha, como un titular de portada deportiva.", [("ñ", 3), ("Ñ", 2), ("íñ", 1)]),
 ("bebasneue", 400, "de cartel de cine", "Solo mayúsculas, estrecha: la Ñ como un rótulo.", [("Ñ", 1), ("Ñ", 3)]),
 ("oswald", 700, "estrecha", "Condensada y seria, de prensa.", [("ñ", 2)]),
 ("barlowcondensed", 800, "de señal", "Recuerda a la rotulación de carreteras y matrículas.", [("íñ", 2), ("ñ", 1)]),
 ("leaguespartan", 900, "geométrica pura", "Círculos y rectas, muy compacta.", [("ñ", 1), ("í", 3)]),
 ("montserrat", 900, "urbana", "La geométrica de los rótulos de ciudad.", [("ñ", 3)]),
 ("jost", 900, "Bauhaus", "Construida con regla y compás; la ñ más cuadrada.", [("ñ", 2), ("í", 1)]),
 ("lexend", 900, "de lectura fácil", "Diseñada para leer mejor: formas muy abiertas.", [("ñ", 3)]),
 ("spacegrotesk", 700, "técnica", "Grotesca con detalles raros; aire de producto digital.", [("ñ", 1)]),
 ("spacemono", 700, "de terminal", "Monoespaciada: cada letra ocupa lo mismo, como en código.", [("ñ", 2), ("í", 3)]),
 ("courierprime", 700, "de máquina de escribir", "La letra de escribir a máquina: ortografía de toda la vida.", [("ñ", 1), ("í", 2), ("Ñ", 3)]),
 ("specialelite", 400, "de máquina gastada", "Máquina de escribir con la tinta irregular.", [("ñ", 3)]),
 ("robotoslab", 900, "con remate cuadrado", "Egipcia moderna: remates rectos y firmes.", [("ñ", 2)]),
 ("zillaslab", 700, "egipcia", "Remates cuadrados con carácter de prensa.", [("ñ", 1)]),
 ("alfaslabone", 400, "de cartel antiguo", "Egipcia muy gruesa, de cartel de feria.", [("ñ", 3), ("í", 2)]),
 ("ultra", 400, "del Oeste", "Remates enormes, de cartel de «Se busca».", [("ñ", 1)]),
 ("playfair", 900, "de periódico", "Serifa de cabecera, con mucho contraste.", [("ñ", 3), ("í", 2)]),
 ("abrilfatface", 400, "de revista", "Didona gruesa, de portada de revista.", [("ñ", 2), ("í", 1), ("Ñ", 3)]),
 ("dmserifdisplay", 400, "elegante", "Serifa fina y elegante, con remates en gota.", [("ñ", 1)]),
 ("bodonimoda", 900, "de moda", "Bodoni: gruesos y finos extremos, como una cabecera de moda.", [("ñ", 3), ("Ñ", 1)]),
 ("fraunces", 900, "con serifa blanda", "Serifa «blandita», cálida y con personalidad.", [("ñ", 2), ("í", 3), ("íñ", 1)]),
 ("gloock", 400, "de libro", "Serifa de contraste alto, muy literaria.", [("ñ", 1)]),
 ("youngserif", 400, "de editorial", "Serifa robusta de editorial independiente.", [("ñ", 2), ("í", 1)]),
 ("rozhaone", 400, "de contraste extremo", "Trazos gruesísimos y finísimos.", [("ñ", 3)]),
 ("yesevaone", 400, "clásica", "Serifa con curvas femeninas, muy clásica.", [("í", 2), ("ñ", 1)]),
 ("cormorantgaramond", 700, "de Siglo de Oro", "Garamond: la letra de los libros clásicos.", [("Ñ", 2), ("ñ", 3)]),
 ("instrumentserif", 400, "fina", "Serifa estrecha y fina, de revista actual.", [("ñ", 1)]),
 ("librebaskerville", 700, "de novela", "La letra de una novela bien editada.", [("ñ", 3)]),
 ("merriweather", 900, "de lectura", "Serifa negra pensada para pantalla.", [("ñ", 2)]),
 ("caveat", 700, "a mano", "Escrita a boli, rápida: como una nota en el margen.", [("ñ", 1), ("í", 3)]),
 ("permanentmarker", 400, "a rotulador", "Rotulador grueso: la corrección del profe.", [("ñ", 3), ("í", 1), ("Ñ", 2)]),
 ("kalam", 700, "de cuaderno", "Letra de cuaderno, a mano pero ordenada.", [("ñ", 2)]),
 ("gochihand", 400, "de pizarra", "Trazo de tiza o rotulador de pizarra.", [("ñ", 1), ("Ñ", 3)]),
 ("rocksalt", 400, "garabateada", "Garabato enérgico, muy personal.", [("ñ", 3)]),
 ("patrickhand", 400, "de apuntes", "Letra de apuntes limpia.", [("í", 2)]),
 ("pacifico", 400, "caligráfica de rótulo", "Caligrafía de rótulo veraniego.", [("ñ", 2), ("Ñ", 1)]),
 ("lobster", 400, "de rótulo clásico", "Cursiva gruesa de rótulo de bar.", [("ñ", 3), ("í", 1)]),
 ("shrikhand", 400, "cursiva gorda", "Cursiva muy gruesa, con mucho ritmo.", [("ñ", 1), ("Ñ", 3)]),
 ("dancingscript", 700, "caligráfica", "Caligrafía ligada, de invitación.", [("ñ", 3)]),
 ("marckscript", 400, "de firma", "Como una firma rápida.", [("Ñ", 1)]),
 ("playball", 400, "de camiseta de béisbol", "Cursiva deportiva.", [("Ñ", 2)]),
 ("sedgwickavedisplay", 400, "de grafiti", "Rotulador de grafiti: callejera.", [("ñ", 3), ("Ñ", 1)]),
 ("pressstart2p", 400, "de videojuego", "Píxeles de máquina recreativa: «nivel superado».", [("ñ", 2), ("í", 3)]),
 ("silkscreen", 700, "pixelada", "Píxel limpio, de interfaz retro.", [("Ñ", 1)]),
 ("vt323", 400, "de ordenador antiguo", "Monitor de fósforo de los ochenta.", [("ñ", 3)]),
 ("bungee", 400, "de rótulo luminoso", "Hecha para rótulos verticales de ciudad.", [("Ñ", 2)]),
 ("monoton", 400, "de neón", "Tubos de neón: muy llamativa en grande.", [("Ñ", 1)]),
 ("fascinate", 400, "art déco", "Cortes art déco, de cartel de los años veinte.", [("ñ", 3)]),
 ("majormonodisplay", 400, "experimental", "Mitad línea, mitad bloque: la más rara.", [("Ñ", 1)]),
 ("righteous", 400, "retrofuturista", "Curvas de los años setenta.", [("ñ", 2)]),
 ("paytoneone", 400, "de etiqueta", "Redonda y gruesa, de envase.", [("ñ", 1), ("í", 3)]),
 ("bowlbyone", 400, "de imprenta", "Tipo de madera, de cartel impreso.", [("ñ", 3)]),
 ("luckiestguy", 400, "de cómic", "Mayúsculas de onomatopeya de cómic.", [("Ñ", 2)]),
 ("concertone", 400, "de cartel de concierto", "Redondeada y compacta.", [("ñ", 1)]),
 ("comfortaa", 700, "de línea redonda", "Una sola línea redonda, ligera.", [("ñ", 2), ("í", 1)]),
 ("quicksand", 700, "ligera", "Fina y redonda: la más suave.", [("í", 1), ("ñ", 3)]),
 ("varelaround", 400, "sencilla", "Redonda y sin pretensiones.", [("ñ", 3)]),
 ("rubikmonoone", 400, "de sello", "Mayúsculas cuadradas y macizas.", [("Ñ", 3)]),
 ("unifrakturcook", 700, "gótica de cabecera", "Letra gótica, como la cabecera de un periódico centenario.", [("Ñ", 1), ("ñ", 3)]),
]
for fam, peso, nombre, porque, usos in F:
    for ch, trat in usos:
        pal = None
        if fam == "unifrakturcook": pal = NEGRO_AM if trat == 1 else SOL_NEGRO
        letra(ch, fam, peso, trat, nombre, porque, pal)
# la gótica todo en negro sobre blanco, tipo The New York Times
add("Ñ gótica de cabecera, negro sobre blanco", "Todo en negro sobre papel blanco, como la cabecera de The New York Times, pero con la Ñ.",
    txt("Ñ", 700, fam="unifrakturcook"), PAPEL_NEGRO, 0.56, palabra=txt("Ortografía10", 700, fam="unifrakturcook"), etiquetas=["Ñ", "gotica", "blanco y negro"])

# ---------- B. construcciones e ideas de icono (Poppins) ----------
P = lambda ch, p="A", peso=800: txt(ch, peso, papel=p)
OSC = "#D9A419"  # amarillo oscuro para volúmenes
def monolinea(papel="A", g=15):
    """ñ dibujada con un solo trazo redondo: palo, arco y onda."""
    arco = trazo("M0 0V-52M0 -30a23 23 0 0 1 46 0V0", (0, -53, 46, 0), g, papel)
    onda = trazo("M4 -82q10 -12 20 -3t20 -3", (4, -88, 44, -78), g * 0.8, papel)
    return arco + onda
def i_monolinea(papel="A", g=15):
    return trazo("M0 0V-52", (0, -52, 0, 0), g, papel) + trazo("M-2 -76l15 -13", (-2, -89, 13, -76), g * 0.85, papel)
add("ñ de un solo trazo", "Dibujada con una línea redonda: palo, arco y onda. Icono más que letra; funciona a 16 px.", monolinea(), NOCHE_AM, 0.58, etiquetas=["ñ", "trazo"])
add("ñ de un solo trazo, en el bloque amarillo", "La ñ de línea, en azul noche sobre el bloque amarillo.", cuadro(monolinea("F"), 24, 26), NOCHE_AM, 0.62, etiquetas=["ñ", "trazo", "bloque"])
add("ñ de un solo trazo, a sangre sobre amarillo", "La ñ de línea con todo el icono amarillo.", monolinea("T"), SOL_AZUL, 0.58, peg="sello", etiquetas=["ñ", "trazo"])
add("í de un solo trazo", "Un palo y una tilde, los dos con las puntas redondas. Lo mínimo que sigue siendo una í.", i_monolinea(), NOCHE_AM, 0.6, etiquetas=["í", "trazo"])
add("í de un solo trazo, en el bloque amarillo", "La í de línea en azul noche dentro del bloque.", cuadro(i_monolinea("F"), 24, 26), NOCHE_AM, 0.62, etiquetas=["í", "trazo", "bloque"])
add("íñ de un solo trazo", "Las dos finalistas dibujadas con la misma línea.", i_monolinea().tr(-34, 0) + monolinea(), NOCHE_AM, 0.62, etiquetas=["íñ", "trazo"])
add("ñ en contorno", "Solo el perfil de la letra, en línea amarilla: más ligera, tipo marca de moda.", txt("ñ", 800, papel="A", trazo=5), NOCHE_AM, 0.54, etiquetas=["ñ", "contorno"])
add("í en contorno", "El perfil de la í en línea amarilla.", txt("í", 800, papel="A", trazo=5), NOCHE_AM, 0.6, etiquetas=["í", "contorno"])
add("Ñ en contorno sobre amarillo", "La Ñ mayúscula en línea azul noche sobre amarillo.", txt("Ñ", 800, papel="T", trazo=5), SOL_AZUL, 0.56, peg="sello", etiquetas=["Ñ", "contorno"])
def tecla3d(ch):
    g = P(ch, "F"); lado = 118
    base = rect(-lado / 2, -lado / 2 + 12, lado, lado, 24, OSC)
    return base + rect(-lado / 2, -lado / 2, lado, lado, 24, "A") + g.en(-30, -34, 60, 62)
add("Tecla ñ con relieve", "La tecla que solo tiene el teclado español, con su canto: dan ganas de pulsarla.", tecla3d("ñ"), NOCHE_AM, 0.6, etiquetas=["ñ", "tecla"])
add("Tecla í con relieve", "La misma tecla, con la í acentuada.", tecla3d("í"), NOCHE_AM, 0.6, etiquetas=["í", "tecla"])
def bocadillo(ch):
    g = P(ch, "F")
    caja = rect(-62, -56, 124, 104, 26, "A")
    cola = forma("M-34 44L-46 76L-6 46Z", (-46, 44, -6, 76), "A")
    return caja + cola + g.en(-30, -40, 60, 68)
add("ñ en un bocadillo", "La ñ dentro de un bocadillo de chat: «así se dice, así se escribe». Estilo app de idiomas.", bocadillo("ñ"), NOCHE_AM, 0.64, etiquetas=["ñ", "bocadillo"])
add("í en un bocadillo", "La í acentuada en un bocadillo de chat.", bocadillo("í"), NOCHE_AM, 0.64, etiquetas=["í", "bocadillo"])
def aviso(ch):
    b = cuadro(P(ch, "F"), 22, 24)
    return b + circ(b.bb[2] - 4, b.bb[1] + 4, 17, "F") + circ(b.bb[2] - 4, b.bb[1] + 4, 12, ROJO)
add("ñ con aviso rojo", "El bloque con un punto rojo de notificación: «tienes una falta por corregir». El rojo solo aparece ahí.", aviso("ñ"), NOCHE_AM, 0.6, etiquetas=["ñ", "aviso", "error"])
add("í con aviso rojo", "La í en su bloque con el punto rojo de notificación.", aviso("í"), NOCHE_AM, 0.6, etiquetas=["í", "aviso", "error"])
def caja_sombra(ch, tinta="A", fondo="F"):
    g = P(ch, tinta); lado = 112
    return rect(-lado / 2 + 12, -lado / 2 + 12, lado, lado, 8, tinta) + rect(-lado / 2, -lado / 2, lado, lado, 8, fondo) + rect(-lado / 2, -lado / 2, lado, lado, 8, tinta, trazo=7) + g.en(-28, -32, 56, 60)
add("ñ en caja con sombra", "Caja de línea con sombra desplazada, tipo bloc de notas: sobria y de herramienta seria.", caja_sombra("ñ"), NOCHE_AM, 0.62, etiquetas=["ñ", "caja"])
add("Ñ en caja con sombra, sobre amarillo", "La misma caja en azul noche sobre amarillo.", caja_sombra("Ñ", "T", "F"), SOL_AZUL, 0.62, etiquetas=["Ñ", "caja"])
add("í en caja con sombra, negro editorial", "La caja con sombra en amarillo sobre negro.", caja_sombra("í"), NEGRO_AM, 0.62, etiquetas=["í", "caja", "negro"])
def elemento(ch):
    lado = 124
    g = rect(-lado / 2, -lado / 2, lado, lado, 10, "A", trazo=7)
    return g + P(ch).en(-30, -26, 60, 58) + P("10", "A", 700).en(-50, -52, 22, 16, 0, 0) + txt("ortografía", 600, papel="A").en(-48, 42, 96, 11)
add("Ñ, elemento 10", "Como una casilla de la tabla periódica: símbolo Ñ, número 10. Aquí el 10 sí significa algo.", elemento("Ñ"), NOCHE_AM, 0.66, etiquetas=["Ñ", "tabla", "10"])
def ficha(ch):
    b = cuadro(P(ch, "F"), 26, 16)
    p = P("10", "F", 700).en(b.bb[2] - 30, b.bb[3] - 24, 22, 15, 1, 1)
    return b + p
add("Ficha de la ñ, 10 puntos", "Ficha de juego de palabras: la ñ vale 10 puntos. El 10 pasa a ser la puntuación.", ficha("ñ"), NOCHE_AM, 0.6, etiquetas=["ñ", "ficha", "10"])
add("Ficha de la í, 10 puntos", "La í acentuada como ficha de 10 puntos.", ficha("í"), NOCHE_AM, 0.6, etiquetas=["í", "ficha", "10"])
def subrayada(ch, p="A"):
    g = P(ch, p)
    return g + rect(g.bb[0] - 10, 14, g.w + 20, 13, 6.5, p)
add("ñ subrayada", "La ñ con una barra debajo, como la barra de progreso de los Reels.", subrayada("ñ"), NOCHE_AM, 0.56, etiquetas=["ñ", "barra"])
add("í subrayada, sobre amarillo", "La í con su barra, en azul noche sobre amarillo.", subrayada("í", "T"), SOL_AZUL, 0.62, peg="sello", etiquetas=["í", "barra"])
def eco(ch):
    g = P(ch)
    return g.tr(-36, 0).op(0.25) + g.tr(-18, 0).op(0.5) + g
add("ñ con la virgulilla en rojo, sobre amarillo", "Azul noche sobre amarillo y solo la virgulilla en rojo de boli: el signo es lo que se corrige.", txt("ñ", 800, papel="T", tilde=ROJO), SOL_AZUL, 0.56, peg="sello", etiquetas=["ñ", "rojo"])
add("í con la tilde en rojo, sobre amarillo", "La í en azul noche y la tilde en rojo de boli.", txt("í", 800, papel="T", tilde=ROJO), SOL_AZUL, 0.6, peg="sello", etiquetas=["í", "rojo"])
add("ñ amarilla con la virgulilla en rojo", "De noche: letra amarilla, virgulilla en rojo.", txt("ñ", 800, papel="A", tilde=ROJO), NOCHE_AM, 0.54, etiquetas=["ñ", "rojo"])
def aro(ch, doble=False):
    g = circ(0, 0, 56, "A", trazo=9) + P(ch).en(-28, -32, 56, 60)
    return g + circ(0, 0, 43, "A", trazo=2.5) if doble else g
add("ñ dentro de un aro", "Un aro amarillo y la ñ dentro: sello, moneda, medalla.", aro("ñ"), NOCHE_AM, 0.78, redondo=True, peg="sello", etiquetas=["ñ", "aro"])
add("í dentro de un aro doble", "Dos aros, como un matasellos, con la í.", aro("í", True), NOCHE_AM, 0.78, redondo=True, peg="sello", etiquetas=["í", "aro"])
def rombo(ch):
    return rect(-50, -50, 100, 100, 14, "A").rot(45) + P(ch, "F").en(-26, -30, 52, 56)
add("ñ en un rombo", "El bloque girado 45°: como una señal de aviso, pero amable.", rombo("ñ"), NOCHE_AM, 0.84, redondo=True, etiquetas=["ñ", "rombo"])
add("í en un rombo", "La í en el rombo amarillo.", rombo("í"), NOCHE_AM, 0.84, redondo=True, etiquetas=["í", "rombo"])
for a, c, t in (("[", "]", "entre corchetes"), ("(", ")", "entre paréntesis"), ("/", "/", "entre barras, como en fonética")):
    add(f"ñ {t}", f"La ñ {t}: notación de diccionario y de lingüista, sin adornos.", fila(P(a), P("ñ"), P(c), hueco=8), NOCHE_AM, 0.72, etiquetas=["ñ", "signos"])
add("[í] a sangre sobre amarillo", "La í entre corchetes, en azul noche sobre amarillo.", fila(P("[", "T"), P("í", "T"), P("]", "T"), hueco=8), SOL_AZUL, 0.66, peg="sello", etiquetas=["í", "signos"])
add("ñ. con punto final", "La ñ y un punto: «y punto». Rotundo, como una marca de moda.", fila(P("ñ"), P("."), hueco=6), NOCHE_AM, 0.6, etiquetas=["ñ", "punto"])
add("í. con punto final, sobre amarillo", "La í y su punto final.", fila(P("í", "T"), P(".", "T"), hueco=6), SOL_AZUL, 0.6, etiquetas=["í", "punto"])
def esquina(ch, pal_t):
    g = P(ch, pal_t)
    return G("", (0, 0, 100, 100)) + g.en(30, 22, 62, 72, 1, 1)
add("ñ · í en una pastilla", "Las dos finalistas separadas por un punto, dentro de una pastilla amarilla.", bloque(fila(P("ñ", "F"), P("·", "F"), P("í", "F"), hueco=8), 16, 34), NOCHE_AM, 0.8, etiquetas=["íñ", "pastilla"])
add("Ññ: mayúscula y minúscula", "Como en los cuadernos de caligrafía: la letra grande y la pequeña.", fila(P("Ñ"), P("ñ"), hueco=6), NOCHE_AM, 0.72, etiquetas=["Ñ", "ñ", "caligrafia"])
add("Íí: mayúscula y minúscula, sobre amarillo", "La pareja de caligrafía con la í acentuada.", fila(P("Í", "T"), P("í", "T"), hueco=8), SOL_AZUL, 0.6, peg="sello", etiquetas=["í", "caligrafia"])
# ía (final de Ortografía), en otras letras
for fam, peso, nom in (("fredoka", 700, "redonda"), ("anton", 400, "de cartel"), ("abrilfatface", 400, "de revista"), ("permanentmarker", 400, "a rotulador")):
    add(f"ía {nom}, a sangre sobre amarillo", "El final de Ortografía, que es donde va la tilde, en otra letra.", txt("ía", peso, papel="T", fam=fam), SOL_AZUL, 0.6, peg="sello",
        palabra=txt("Ortografía10", peso, fam=fam), etiquetas=["ía", fam])
# dudas clásicas (te gustó «¿Con b o con v?»)
def duda(a, b, p="A", sep="/"):
    return fila(P(a, p), P(sep, p, 500).op(0.55), P(b, p), hueco=6)
add("b/v", "La duda más famosa de la ortografía, en tres signos.", duda("b", "v"), NOCHE_AM, 0.72, etiquetas=["duda", "bv"])
add("b/v en el bloque amarillo", "b/v en azul noche dentro del bloque.", bloque(duda("b", "v", "F"), 18, 20), NOCHE_AM, 0.76, etiquetas=["duda", "bv", "bloque"])
add("g/j a sangre sobre amarillo", "Otra duda de siempre: ¿con g o con j?", duda("g", "j", "T"), SOL_AZUL, 0.66, peg="sello", etiquetas=["duda", "gj"])
add("ll/y", "¿Con ll o con y? La duda del yeísmo.", duda("ll", "y"), NOCHE_AM, 0.72, etiquetas=["duda", "lly"])
add("h muda, en contorno", "La h que no suena: dibujada solo con su contorno, casi invisible.", txt("h", 800, papel="A", trazo=5), NOCHE_AM, 0.56, etiquetas=["duda", "h"])
add("¿b/v? en el bloque amarillo", "La duda, con sus signos de interrogación.", bloque(fila(P("¿", "F").tr(0, -14), duda("b", "v", "F"), P("?", "F"), hueco=6), 16, 20), NOCHE_AM, 0.84, etiquetas=["duda", "bv", "signos"])
# cartel (te gustó «Orto / grafía / 10»)
def cartel(fam, peso, p="A"):
    ls = [txt(s, peso, papel=p, fam=fam) for s in ("Orto", "grafía", "10")]
    out, y = G(), 0
    for l in ls:
        m = l.en(0, y, 100, 60, 0, 0); m = l.tr(-l.bb[0] * (100 / l.w), y - l.bb[1] * (100 / l.w), 100 / l.w); out = out + m; y = m.bb[3] + 7
    return out
add("Cartel condensado: Orto / grafía / 10", "El nombre en tres líneas justificadas, con letra de cartel estrecha.", cartel("anton", 400), NOCHE_AM, 0.66, palabra=txt("Ortografía10", 400, fam="anton"), etiquetas=["cartel", "anton"])
add("Cartel condensado, a sangre sobre amarillo", "El cartel en azul noche sobre amarillo.", cartel("anton", 400, "T"), SOL_AZUL, 0.66, palabra=txt("Ortografía10", 400, fam="anton"), etiquetas=["cartel", "anton"])
add("Cartel redondo: Orto / grafía / 10", "El mismo cartel con letra redonda y amable.", cartel("fredoka", 700), NOCHE_AM, 0.66, palabra=txt("Ortografía10", 700, fam="fredoka"), etiquetas=["cartel", "fredoka"])
add("Cartel de revista, negro editorial", "El cartel con letra de portada de revista, amarillo sobre negro.", cartel("abrilfatface", 400), NEGRO_AM, 0.66, palabra=txt("Ortografía10", 400, fam="abrilfatface"), etiquetas=["cartel", "revista", "negro"])

def filas():
    out = []
    for d in D:
        c, m = d["pal"], d["marca"]
        full = d["tam"] >= 1.0
        row = {"titulo": d["titulo"], "concepto": d["concepto"],
               "svg_marca": svg_lienzo(m) if full else svg_marca(m, d["tam"], redondo=d["redondo"]),
               "svg_favicon": None, "svg_wordmark": svg_palabra(d["palabra"]),
               "svg_pegatina": pegatina_sello(m, c, tam=min(d["tam"], 0.7)) if d["peg"] == "sello" else pegatina_tarjeta(m, d["palabra"], c, tam=min(d["tam"], 0.7)),
               "svg_hermano": None, "colores": c, "etiquetas": d["etiquetas"], "origen": "manual", "spec": {"tanda": 4}}
        out.append(row)
    return out
if __name__ == "__main__":
    json.dump(filas(), sys.stdout, ensure_ascii=False); print(len(D), file=sys.stderr)
