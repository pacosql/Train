"""Tanda 6: la O escrita a mano, con su rabito encima (como en la caligrafía
del cole), en muchas combinaciones: forma del rabito, grosor, color,
contenedor, con el 10, sobre pauta, en letras caligráficas…

    python3 ortologo/tools/tanda6.py > filas.json
"""
import json, sys, math, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from marca import *
from marca import _n
import tanda1 as t1
import tanda4 as t4
from tanda4 import cuadro, bloque, P, NOCHE_AM, SOL_AZUL, NEGRO_AM, ROJO
from tanda1 import paleta, NOCHE_HEX, AMARILLO, VERDE
t4.D.clear()
SOL_NEGRO = paleta(AMARILLO, "#111111", "#111111")
add = t4.add

RABITOS = {  # (trazo que sale de lo alto de la O, caja)
    "escolar": ("M0 -38q18 -1 32 -18", (0, -56, 32, -38)),
    "lazo": ("M0 -38c8 -30 46 -34 44 -10c-2 18 -28 16 -38 2", (0, -68, 45, -28)),
    "zurdo": ("M0 -38q-17 -4 -25 -22", (-25, -60, 0, -38)),
    "onda": ("M0 -38c13 -2 17 -15 29 -13s13 9 25 3", (0, -52, 54, -36)),
    "tieso": ("M2 -38q2 -12 12 -24", (2, -62, 14, -38)),
}
NOMBRE = {"escolar": "con rabito de cuaderno", "lazo": "con lacito", "zurdo": "con el rabito a la izquierda", "onda": "con rabito largo y ondulado", "tieso": "con rabito corto hacia arriba"}
GROSOR = {9: "fina", 15: "media", 21: "gruesa"}
def o_mano(rabito="escolar", g=15, p="A", pc=None, ovalo=False):
    """La O manuscrita: un anillo de trazo redondo y su rabito."""
    d, bb = RABITOS[rabito]
    cuerpo = trazo("M0 -38A29 38 0 1 0 0 38A29 38 0 1 0 0 -38", (-29, -38, 29, 38), g, p) if ovalo else circ(0, 0, 38, p, trazo=g)
    return cuerpo + trazo(d, bb, g * 0.92, pc or p)
def nombre_con_o(rabito="escolar", g=11, p="T"):
    """«Ortografía10» con la O inicial escrita a mano y el resto en Poppins."""
    o = o_mano(rabito, g * 38 / 35.45, p).tr(0, -35.45, 35.45 / (38 + g * 38 / 35.45 / 2))
    return fila(o, txt("rtografía10", 800, papel=p), hueco=5)
W = nombre_con_o

# 1. forma del rabito × grosor × tratamiento
k = 0
for rab in ("escolar", "lazo", "zurdo", "onda", "tieso"):
    for g in (9, 15, 21):
        if rab in ("onda", "tieso") and g == 9: continue
        trat = k % 3; k += 1
        base = f"O a mano {NOMBRE[rab]}, {GROSOR[g]}"
        por = "La O del cuaderno de caligrafía: un redondel y el rabito con el que enlaza con la letra siguiente. Hecha a mano, sin tipografía."
        if trat == 0: add(f"{base}, amarilla de noche", por, o_mano(rab, g), NOCHE_AM, 0.62, palabra=W(rab), etiquetas=["O", "a mano", rab])
        elif trat == 1: add(f"{base}, en el bloque amarillo", por, cuadro(o_mano(rab, g, "F"), 22, 26), NOCHE_AM, 0.64, palabra=W(rab), etiquetas=["O", "a mano", rab, "bloque"])
        else: add(f"{base}, a sangre sobre amarillo", por, o_mano(rab, g, "T"), SOL_AZUL, 0.62, peg="sello", palabra=W(rab), etiquetas=["O", "a mano", rab])
# 2. las tres principales, en todos los tratamientos que faltan y en negro
for rab, g in (("escolar", 15), ("lazo", 15), ("escolar", 21)):
    n = f"O a mano {NOMBRE[rab]}, {GROSOR[g]}"
    add(f"{n}, negro editorial", "La O manuscrita en amarillo sobre negro.", o_mano(rab, g), NEGRO_AM, 0.62, palabra=W(rab), etiquetas=["O", "a mano", "negro"])
    add(f"{n}, negra sobre amarillo", "Tinta negra sobre amarillo, como rotulador sobre cartulina.", o_mano(rab, g, "T"), SOL_NEGRO, 0.62, peg="sello", palabra=W(rab), etiquetas=["O", "a mano", "negro"])
    add(f"{n}, en círculo amarillo", "La O dentro de un círculo amarillo: redondo dentro de redondo.", circ(0, -4, 66, "A") + o_mano(rab, g, "F").tr(0, 0, 0.82), NOCHE_AM, 0.8, redondo=True, peg="sello", palabra=W(rab), etiquetas=["O", "a mano", "círculo"])
# 3. óvalo inclinado (letra cursiva)
for g, rab in ((11, "escolar"), (17, "lazo"), (17, "onda")):
    add(f"O cursiva inclinada {NOMBRE[rab]}, {'fina' if g < 14 else 'media'}", "Ovalada e inclinada, como la cursiva inglesa de los cuadernos de dos rayas.", o_mano(rab, g, "A", ovalo=True).rot(14, 0, 0), NOCHE_AM, 0.7, redondo=True, palabra=W(rab), etiquetas=["O", "cursiva"])
add("O cursiva inclinada, a sangre sobre amarillo", "La cursiva ovalada en azul noche sobre amarillo.", o_mano("escolar", 15, "T", ovalo=True).rot(14, 0, 0), SOL_AZUL, 0.7, redondo=True, peg="sello", palabra=W("escolar"), etiquetas=["O", "cursiva"])
# 4. el rabito de otro color: es lo que hace especial a esta O
for rab in ("escolar", "lazo", "onda"):
    add(f"O a mano {NOMBRE[rab]}, rabito en rojo", "Todo amarillo menos el rabito, en rojo de boli: el detalle manuscrito es la marca.", o_mano(rab, 15, "A", ROJO), NOCHE_AM, 0.62, palabra=W(rab), etiquetas=["O", "a mano", "rojo"])
add("O azul noche con rabito rojo, sobre amarillo", "Sobre amarillo, la O en azul noche y el rabito en rojo.", o_mano("escolar", 17, "T", ROJO), SOL_AZUL, 0.62, peg="sello", palabra=W("escolar"), etiquetas=["O", "a mano", "rojo"])
add("O a mano con rabito verde", "El rabito en verde de acierto.", o_mano("escolar", 15, "A", VERDE), NOCHE_AM, 0.62, palabra=W("escolar"), etiquetas=["O", "a mano", "verde"])
add("O en bloque amarillo con rabito rojo", "Dentro del bloque, la O en azul noche y solo el rabito en rojo.", cuadro(o_mano("lazo", 15, "F", ROJO), 22, 26), NOCHE_AM, 0.64, palabra=W("lazo"), etiquetas=["O", "bloque", "rojo"])
# 5. redondeada a mano de verdad: dos vueltas de boli
def garabato(g=9, p="A", vueltas=2):
    d, bb = t1._elipse_a_mano((-32, -32, 32, 32), 6)
    out = trazo(d, bb, g, p)
    if vueltas > 1:
        d2, bb2 = t1._elipse_a_mano((-29, -34, 35, 30), 6)
        out = out + trazo(d2, bb2, g * 0.8, p).rot(22, 0, 0)
    return out + trazo("M30 -34q12 -6 20 -20", (30, -54, 50, -34), g * 0.9, p)
add("O de dos vueltas de boli", "La O que sale cuando rodeas algo dos veces con el boli, con su rabito de salida.", garabato(), NOCHE_AM, 0.8, redondo=True, palabra=W("escolar", 9), etiquetas=["O", "garabato"])
add("O de una vuelta de rotulador", "Una sola vuelta, gruesa, que no llega a cerrar del todo: se nota la mano.", garabato(15, "A", 1), NOCHE_AM, 0.8, redondo=True, palabra=W("escolar"), etiquetas=["O", "garabato"])
add("O de dos vueltas, roja sobre amarillo", "El redondel del profe, en rojo sobre amarillo.", garabato(9, ROJO), SOL_AZUL, 0.8, redondo=True, peg="sello", palabra=W("escolar", 9), etiquetas=["O", "garabato", "rojo"])
# 6. sobre la pauta del cuaderno
def pauta(o, margen=False, p="A"):
    g = rect(-66, -46, 132, 2.6, 1, p).op(0.4) + rect(-66, 44, 132, 2.6, 1, p).op(0.4) + rect(-66, -1, 132, 1.6, 0.8, p).op(0.22)
    if margen: g = g + rect(-52, -66, 2.6, 132, 1, ROJO)
    return g + o
add("O sobre la pauta", "La O entre las dos rayas del cuaderno de caligrafía, tocando arriba y abajo como mandaba la profe.", pauta(o_mano("escolar", 13)), NOCHE_AM, 0.8, redondo=True, palabra=W("escolar"), etiquetas=["O", "pauta", "cuaderno"])
add("O sobre la pauta con margen rojo", "La pauta con su margen rojo: te gustó en los carteles de cuaderno.", pauta(o_mano("lazo", 13).tr(8, 0), True), NOCHE_AM, 0.8, redondo=True, palabra=W("lazo"), etiquetas=["O", "pauta", "margen"])
add("O sobre la pauta, en amarillo", "Hoja amarilla, rayas y O en azul noche.", pauta(o_mano("escolar", 13, "T"), True, "T"), SOL_AZUL, 0.8, redondo=True, palabra=W("escolar"), etiquetas=["O", "pauta"])
# 7. con la flecha que enseña el trazo
def con_flecha(p="A", pf=ROJO):
    f = trazo("M-26 -58q-22 8 -30 30", (-56, -58, -26, -28), 4, pf) + forma("M-62 -34L-50 -30L-58 -20Z", (-62, -34, -50, -20), pf)
    return o_mano("escolar", 14, p) + f + txt("1", 700, papel=pf).en(-22, -70, 8, 12)
add("O con la flecha del trazo", "Como en los cuadernos de caligrafía: la flechita y el 1 que te dicen por dónde empezar la letra.", con_flecha(), NOCHE_AM, 0.72, palabra=W("escolar"), etiquetas=["O", "caligrafía", "flecha"])
add("O con la flecha del trazo, sobre amarillo", "La lección de caligrafía sobre amarillo.", con_flecha("T"), SOL_AZUL, 0.72, peg="sello", palabra=W("escolar"), etiquetas=["O", "caligrafía", "flecha"])
# 8. con el 10
def escala_digito(o, g):  # la O a la altura de las cifras de Poppins
    s = 70.9 / (76 + g)
    return o.tr(0, -35.45, s)
for rab in ("escolar", "lazo"):
    add(f"O a mano {NOMBRE[rab]} + 10", "La O manuscrita y el 10 de imprenta: la mano y la nota.", fila(escala_digito(o_mano(rab, 15), 15), P("10"), hueco=7), NOCHE_AM, 0.8, palabra=W(rab), etiquetas=["O", "10", "a mano"])
add("O a mano + 10, en el bloque amarillo", "O10 dentro del bloque, con la O escrita a mano.", bloque(fila(escala_digito(o_mano("escolar", 15, "F"), 15), P("10", "F"), hueco=7), 16, 22), NOCHE_AM, 0.84, palabra=W("escolar"), etiquetas=["O", "10", "bloque"])
for rab in ("escolar", "lazo", "onda"):
    add(f"El 10 con el cero a mano ({NOMBRE[rab].replace('con ', '')})", "Un 10 cuyo cero es la O del cuaderno: la nota escrita por ti. Se lee 10 y se lee O.", fila(P("1"), escala_digito(o_mano(rab, 15), 15), hueco=9), NOCHE_AM, 0.72, palabra=W(rab), etiquetas=["O", "10", "doble lectura"])
add("El 10 con el cero a mano, a sangre sobre amarillo", "El 10 de cero manuscrito, en azul noche sobre amarillo.", fila(P("1", "T"), escala_digito(o_mano("escolar", 15, "T"), 15), hueco=9), SOL_AZUL, 0.72, peg="sello", palabra=W("escolar"), etiquetas=["O", "10"])
add("El 10 con el cero a mano y rabito rojo", "El uno y la O en amarillo; el rabito, en rojo.", fila(P("1"), escala_digito(o_mano("escolar", 15, "A", ROJO), 15), hueco=9), NOCHE_AM, 0.72, palabra=W("escolar"), etiquetas=["O", "10", "rojo"])
add("O a mano con el 10 dentro", "El 10 pequeño dentro de la O manuscrita.", o_mano("escolar", 13) + P("10").en(-19, -13, 38, 26), NOCHE_AM, 0.66, palabra=W("escolar"), etiquetas=["O", "10"])
# 9. doble lectura: la O con rabito es también una manzana para la profe
def manzana(p="A", hoja=VERDE):
    return circ(0, 0, 38, p, trazo=17) + trazo("M0 -38q2 -14 11 -22", (0, -60, 11, -38), 9, p) + forma("M11 -52c8 -12 22 -12 28 -9c-4 11 -17 17 -28 9Z", (11, -64, 39, -44), hoja)
add("O-manzana para la profe", "Con un rabito tieso y una hoja, la O es la manzana que se le lleva a la maestra.", manzana(), NOCHE_AM, 0.64, palabra=W("tieso"), etiquetas=["O", "manzana", "doble lectura", "divertido"])
add("O-manzana, a sangre sobre amarillo", "La manzana en azul noche sobre amarillo, con la hoja verde.", manzana("T"), SOL_AZUL, 0.64, peg="sello", palabra=W("tieso"), etiquetas=["O", "manzana"])
add("O-manzana roja", "La O en rojo manzana con su hoja verde, sobre azul noche.", manzana(ROJO), NOCHE_AM, 0.64, palabra=W("tieso"), etiquetas=["O", "manzana", "rojo"])
# 10. la O de letras caligráficas y manuscritas reales
LETRAS = [("permanentmarker", 400, "a rotulador"), ("rocksalt", 400, "garabateada"), ("lobster", 400, "de rótulo clásico"), ("dancingscript", 700, "caligráfica"),
          ("marckscript", 400, "de firma"), ("playball", 400, "deportiva")]
for i, (fam, peso, nom) in enumerate(LETRAS):
    t4.letra("O", fam, peso, (1, 2, 3)[i % 3], nom, f"La O mayúscula {nom}, con el arranque y el remate que le da la mano.")
for fam, peso, nom in (("dancingscript", 700, "caligráfica"), ("satisfy", 400, "de pincel"), ("lobster", 400, "de rótulo clásico")):
    t4.letra("o", fam, peso, 3 if fam != "satisfy" else 1, nom + ", minúscula", "La o minúscula ligada: redonda y con su rabito de enlace a la derecha.")
# 11. el cartel con la O a mano
def cartel_o(p="A", rab="escolar"):
    o = o_mano(rab, 13, p).tr(0, -35.45, 70.9 / 89)
    l1 = fila(o, txt("rto", 800, papel=p), hueco=5)
    out, y = G(), 0
    for l in (l1, txt("grafía", 800, papel=p), txt("10", 800, papel=p)):
        s = 100 / l.w; m = l.tr(-l.bb[0] * s, y - l.bb[1] * s, s); out = out + m; y = m.bb[3] + 7
    return out
add("Cartel con la O a mano", "El cartel Orto / grafía / 10 con la O inicial escrita a mano y el resto de imprenta.", cartel_o(), NOCHE_AM, 0.7, palabra=W("escolar"), etiquetas=["cartel", "O", "a mano"])
add("Cartel con la O a mano, sobre amarillo", "El mismo cartel en azul noche sobre amarillo.", cartel_o("T", "lazo"), SOL_AZUL, 0.7, palabra=W("lazo"), etiquetas=["cartel", "O", "a mano"])

if __name__ == "__main__":
    json.dump(t4.filas(), sys.stdout, ensure_ascii=False); print(len(t4.D), file=sys.stderr)
