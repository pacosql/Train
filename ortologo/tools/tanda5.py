"""Tanda 5, la divertida: caras hechas con signos (ü, ;), el 10 que guiña),
la í como personaje u objeto (levanta la mano, lápiz, rayo, corona…),
pegatinas (estrella, explosión de cómic, nota adhesiva, sello) y palabras.
Sirve de ejemplo de cómo dibujar formas libres con marca.py.

    python3 ortologo/tools/tanda5.py > filas.json
"""
import json, sys, math
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from marca import *
from marca import _n
import tanda4 as t4
from tanda4 import cuadro, bloque, disco, P, NOCHE_AM, SOL_AZUL, NEGRO_AM, ROJO, OSC
from tanda1 import paleta, NOCHE_HEX, AMARILLO, VERDE
t4.D.clear()
VERDE_AZUL = paleta(VERDE, NOCHE_HEX, NOCHE_HEX)
CORAL_AM = paleta("#FF5A4E", NOCHE_HEX, AMARILLO)
add = t4.add
def poli(pts, papel="A"):
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return forma("M" + "L".join(f"{_n(x)} {_n(y)}" for x, y in pts) + "Z", (min(xs), min(ys), max(xs), max(ys)), papel)
def estrella(R, r, n=5, papel="A", giro=-90):
    return poli([((R if k % 2 == 0 else r) * math.cos(math.radians(giro + k * 180 / n)), (R if k % 2 == 0 else r) * math.sin(math.radians(giro + k * 180 / n))) for k in range(2 * n)], papel)
def sonrisa(w=56, y=0, papel="F", g=11, h=24):
    return trazo(f"M{_n(-w/2)} {y}q{_n(w/2)} {h} {w} 0", (-w / 2, y, w / 2, y + h / 2), g, papel)
def palo(p="A", alto=56, ancho=24):
    return rect(-ancho / 2, -alto, ancho, alto, 3, p)
def tilde_i(p="A"):
    t = tilde_sola("í", 800, p)
    return t.tr(-t.cx + 5, -62 - t.bb[3])
FR = lambda ch, p="A": txt(ch, 700, papel=p, fam="fredoka")

# --- caras hechas con signos ---
add("ü: la letra que sonríe", "La u con diéresis es una cara: dos ojos y una sonrisa. Un signo de ortografía (pingüino, vergüenza) que además cae simpático.", cuadro(FR("ü", "F"), 24, 26), NOCHE_AM, 0.62, etiquetas=["cara", "ü", "divertido"])
add("ü sonriente en círculo amarillo", "La misma ü dentro de un círculo amarillo: ya es un emoticono, pero hecho con una letra de verdad.", circ(0, 0, 60, "A") + FR("ü", "F").en(-30, -34, 60, 62), NOCHE_AM, 0.78, redondo=True, peg="sello", etiquetas=["cara", "ü", "divertido"])
add("ü a sangre sobre amarillo", "Todo el icono amarillo y la ü sonriendo en azul noche.", FR("ü", "T"), SOL_AZUL, 0.56, peg="sello", etiquetas=["cara", "ü"])
def guino(signos, p="F"):
    return circ(0, 0, 60, "A") + P(signos, p).en(-30, -28, 60, 56).rot(90, 0, 0)
add("Guiño de signos: ;)", "Un punto y coma y un paréntesis, girados: la cara que guiña el ojo está hecha de signos de puntuación.", guino(";)"), NOCHE_AM, 0.78, redondo=True, peg="sello", etiquetas=["cara", "signos", "divertido"])
add("Sonrisa de signos: :)", "Dos puntos y un paréntesis. La ortografía también sonríe.", guino(":)"), NOCHE_AM, 0.78, redondo=True, peg="sello", etiquetas=["cara", "signos"])
add("Guiño de signos, negro editorial", "El guiño ;) en amarillo sobre negro.", guino(";)"), NEGRO_AM, 0.78, redondo=True, peg="sello", etiquetas=["cara", "signos", "negro"])
def diez_cara(p="F", fondo=True):
    ojos = fila(P("1", p), P("0", p), hueco=20)
    ojos = ojos.en(-34, -40, 68, 44)
    g = ojos + sonrisa(60, 18, p, 11, 26)
    return (circ(0, 0, 64, "A") + g) if fondo else g
add("El 10 que guiña", "El 1 es el ojo cerrado, el 0 el ojo abierto, y debajo una sonrisa: el 10 por fin dice algo.", diez_cara(), NOCHE_AM, 0.78, redondo=True, peg="sello", etiquetas=["cara", "10", "divertido"])
add("El 10 que guiña, a sangre sobre amarillo", "La cara del 10 con todo el icono amarillo.", diez_cara("T", False), SOL_AZUL, 0.62, etiquetas=["cara", "10"])
def cara_ene(p="F"):
    v = tilde_sola("ñ", 800, p, size=150); v = v.tr(-v.cx, -32 - v.cy)
    return circ(0, 0, 62, "A") + v + circ(-20, -6, 8, p) + circ(20, -6, 8, p) + sonrisa(52, 18, p, 10, 24)
add("Cara de ñ", "La virgulilla hace de ceja sobre dos ojos y una sonrisa: la ñ convertida en personaje.", cara_ene(), NOCHE_AM, 0.78, redondo=True, peg="sello", etiquetas=["cara", "ñ", "divertido"])
def bloque_cara(pelo):
    g = rect(-52, -46, 104, 98, 24, "A") + circ(-20, -4, 8.5, "F") + circ(20, -4, 8.5, "F") + sonrisa(46, 20, "F", 10, 22)
    return g + pelo
tupe = tilde_sola("í", 800, "A", size=150); tupe = tupe.tr(8 - tupe.cx, -52 - tupe.bb[3])
virg = tilde_sola("ñ", 800, "A", size=190); virg = virg.tr(-virg.cx, -54 - virg.bb[3])
add("Tildi: el bloque con tilde", "El bloque amarillo del nº 1 con ojos, sonrisa y una tilde por flequillo. Una mascota mínima que puede vivir en los Reels.", bloque_cara(tupe), NOCHE_AM, 0.66, etiquetas=["mascota", "tilde", "divertido"])
add("Eñe: el bloque con virgulilla", "La misma mascota con la virgulilla de la ñ en lo alto.", bloque_cara(virg), NOCHE_AM, 0.66, etiquetas=["mascota", "ñ", "divertido"])

# --- la í como personaje u objeto ---
def alumno(p="A"):
    return rect(-12, -50, 24, 62, 12, p) + circ(0, -68, 13, p) + trazo("M14 -40L36 -66", (14, -66, 36, -40), 13, p)
add("La í que levanta la mano", "Una í con cabeza, cuerpo y la tilde como brazo en alto: «¡yo me la sé!».", alumno(), NOCHE_AM, 0.64, etiquetas=["personaje", "í", "divertido"])
add("La í que levanta la mano, en el bloque", "El mismo personaje en azul noche dentro del bloque amarillo.", cuadro(alumno("F"), 24, 26), NOCHE_AM, 0.62, etiquetas=["personaje", "í", "bloque"])
add("La í que levanta la mano, sobre verde", "Sobre el verde de «¡Correcta!»: acertar también es un color.", alumno("T"), VERDE_AZUL, 0.64, peg="sello", etiquetas=["personaje", "í", "verde"])
def lapiz():
    return (rect(-13, -50, 26, 40, 0, "A") + rect(-13, -62, 26, 12, 5, ROJO) + rect(-13, -52, 26, 4, 0, OSC)
            + poli([(-13, -10), (13, -10), (0, 16)], "#F2C879") + poli([(-5, 6), (5, 6), (0, 16)], "A") + tilde_i("A").tr(0, -8))
add("í-lápiz", "El palo de la í es un lápiz con su goma y su punta; la tilde sigue en su sitio.", lapiz(), NOCHE_AM, 0.68, etiquetas=["objeto", "í", "lápiz", "divertido"])
rayo = poli([(10, -104), (-12, -76), (1, -76), (-8, -60), (20, -86), (6, -86), (16, -104)], "A")
add("í con rayo", "La tilde es un rayo: una regla en un minuto, rápido y con energía.", palo() + rayo, NOCHE_AM, 0.66, etiquetas=["í", "rayo", "divertido"])
add("í con rayo rojo, sobre amarillo", "El rayo en rojo sobre el amarillo de la marca.", palo("T") + poli([(10, -104), (-12, -76), (1, -76), (-8, -60), (20, -86), (6, -86), (16, -104)], ROJO), SOL_AZUL, 0.66, peg="sello", etiquetas=["í", "rayo"])
corona = poli([(-19, -62), (-19, -86), (-9, -74), (0, -90), (9, -74), (19, -86), (19, -62)], "A")
add("í con corona", "La tilde convertida en corona: la reina de las reglas.", palo() + corona, NOCHE_AM, 0.62, etiquetas=["í", "corona", "divertido"])
avion = poli([(-8, -64), (34, -88), (12, -58), (6, -68)], "A")
add("í con avión de papel", "La tilde es un avión de papel que sale volando: el recreo de la ortografía.", palo() + avion, NOCHE_AM, 0.64, etiquetas=["í", "avión", "divertido"])
check = trazo("M-12 -72l11 11l26 -30", (-12, -91, 25, -61), 11, VERDE)
add("í con visto bueno", "La tilde es un ✓ verde: letra bien puesta, respuesta correcta.", palo() + check, NOCHE_AM, 0.64, etiquetas=["í", "check", "acierto"])
cor = forma("M0 -62C-22 -78 -18 -98 -4 -94C0 -93 0 -90 0 -88C0 -90 0 -93 4 -94C18 -98 22 -78 0 -62Z", (-20, -96, 20, -62), ROJO)
add("í con corazón", "Un corazón donde iba la tilde: para quien disfruta escribiendo bien.", palo() + cor.tr(4, 0), NOCHE_AM, 0.62, etiquetas=["í", "corazón", "divertido"])
est = estrella(17, 7.5).tr(6, -80)
add("í con estrella", "La tilde es la estrella que ponía la profe en el cuaderno.", palo() + est, NOCHE_AM, 0.64, etiquetas=["í", "estrella", "divertido"])
add("í haciendo el pino: í¡", "La í y el signo de exclamación de apertura son casi la misma letra del revés. Dos signos solo nuestros, jugando.", fila(P("í"), P("¡").tr(0, 6), hueco=12), NOCHE_AM, 0.6, etiquetas=["í", "signos", "juego"])

# --- pegatinas: estrella, explosión de cómic, nota adhesiva, sello ---
add("Estrella de la profe con í", "La estrella dorada del cuaderno, con la í dentro.", estrella(66, 31) + P("í", "F").en(-10, -22, 20, 38), NOCHE_AM, 0.82, redondo=True, peg="sello", etiquetas=["estrella", "í", "pegatina"])
add("Explosión de cómic con ñ", "Un «¡ZAS!» de tebeo con la ñ dentro: pegatina con ruido.", estrella(64, 49, 13) + P("ñ", "F").en(-26, -28, 52, 54), NOCHE_AM, 0.84, redondo=True, peg="sello", etiquetas=["cómic", "ñ", "pegatina", "divertido"])
add("Explosión de cómic con í, sobre coral", "La explosión amarilla sobre fondo coral: la más ruidosa de todas.", estrella(64, 49, 13) + P("í", "F").en(-12, -30, 24, 58), CORAL_AM, 0.84, redondo=True, peg="sello", etiquetas=["cómic", "í", "coral"])
def nota_adhesiva(ch, fam="caveat", peso=700):
    g = poli([(-52, -52), (52, -52), (52, 26), (26, 52), (-52, 52)], "A") + poli([(52, 26), (26, 52), (26, 26)], OSC)
    return (g + txt(ch, peso, papel="F", fam=fam).en(-30, -36, 60, 66)).rot(-6, 0, 0)
add("Nota adhesiva con ñ", "Un pósit amarillo con la ñ escrita a mano y la esquina doblada: la regla del día pegada en la pantalla.", nota_adhesiva("ñ"), NOCHE_AM, 0.84, redondo=True, etiquetas=["nota", "ñ", "a mano", "divertido"])
add("Nota adhesiva con í a rotulador", "El pósit con la í a rotulador gordo.", nota_adhesiva("í", "permanentmarker", 400), NOCHE_AM, 0.84, redondo=True, etiquetas=["nota", "í", "a mano"])
def sello(ch):
    g = circ(0, 0, 60, ROJO, trazo=5) + circ(0, 0, 40, ROJO, trazo=2) + arco("BIEN ESCRITO", 47, 0, 0, 10.5, 800, ROJO) + arco("ORTOGRAFÍA10", 47, 0, 0, 9.5, 700, ROJO, abajo=True) + P(ch, ROJO).en(-22, -24, 44, 46)
    return g.rot(-12, 0, 0)
add("Sello de la profe: «Bien escrito»", "Un sello de tinta roja, algo torcido, como el que te ponían en el cuaderno.", sello("ñ"), SOL_AZUL, 0.86, redondo=True, etiquetas=["sello", "ñ", "rojo", "divertido"])
def vale():
    return rect(-60, -36, 120, 72, 12, "A") + circ(-60, 0, 11, "F") + circ(60, 0, 11, "F") + txt("vale", 700, papel="F", fam="fredoka").en(-34, -26, 30, 16, 0, 0) + P("10", "F").en(-34, -10, 68, 38)
add("Vale por un 10", "Un cupón recortable: «vale por un 10». El 10 como premio, no como número.", vale(), NOCHE_AM, 0.78, etiquetas=["cupón", "10", "divertido"])

# --- palabras y letras con chispa ---
add("ñam", "«ñam»: tres letras, una ñ y ganas de comerse las faltas.", txt("ñam", 400, papel="A", fam="titanone"), NOCHE_AM, 0.74, etiquetas=["palabra", "ñ", "divertido"])
add("ñam en el bloque amarillo", "«ñam» en azul noche dentro del bloque.", bloque(txt("ñam", 400, papel="F", fam="titanone"), 16, 22), NOCHE_AM, 0.8, etiquetas=["palabra", "ñ", "bloque"])
def gaviotas(p="A"):
    n = txt("ñ", 900, papel=p, fam="rubik")
    v = tilde_sola("ñ", 900, p, fam="rubik")
    return n + v.tr(46, -26).op(0.6) + v.tr(86, -50, 0.7).op(0.35)
add("La virgulilla echa a volar", "La onda de la ñ se repite y se aleja como gaviotas: una ñ con paisaje.", gaviotas(), NOCHE_AM, 0.7, etiquetas=["ñ", "juego", "divertido"])
add("ñ de plastilina sobre verde", "La ñ más blandita sobre el verde de acierto.", txt("ñ", 800, papel="T", fam="sniglet"), VERDE_AZUL, 0.56, peg="sello", etiquetas=["ñ", "verde", "divertido"])
add("í de cómic sobre coral", "Mayúscula de tebeo sobre coral: imposible no verla.", txt("Í", 400, papel="A", fam="luckiestguy"), CORAL_AM, 0.6, peg="sello", etiquetas=["í", "coral", "cómic"])
json.dump(t4.filas(), sys.stdout, ensure_ascii=False); print(len(t4.D), file=sys.stderr)
