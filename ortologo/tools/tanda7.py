"""Tanda 7: 100 variaciones del logotipo «Ortografía10» para el icono de la
app, Instagram y la web, a partir de los favoritos nº 1968, 2323, 2074, 1802
y 1019 (el nombre compuesto en bloque: «Orto» y «grafía» grandes y el 10 más
pequeño, cerca, abajo a la derecha…).

Cada propuesta combina una composición (LAYOUTS), una paleta, cómo se marca
la í (tilde roja, í entera roja o sin color) y una tipografía. El favicon es
la í sola con el mismo tratamiento.

    python3 ortologo/tools/tanda7.py > filas.json
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from marca import *
from marca import _font
from tanda1 import paleta, NOCHE_HEX, AMARILLO

ROJO = "#E8443A"
PALS = [("sobre amarillo", paleta(AMARILLO, NOCHE_HEX, NOCHE_HEX)), ("de noche", paleta(NOCHE_HEX, AMARILLO, AMARILLO)),
        ("negro editorial", paleta("#111111", AMARILLO, AMARILLO)), ("negro sobre amarillo", paleta(AMARILLO, "#111111", "#111111"))]
ACC = [("tilde roja", "tilde"), ("í entera en rojo", "i"), ("sin color", None)]
FONTS = [("poppins", 800, "Poppins"), ("poppins", 900, "Poppins Black"), ("montserrat", 900, "Montserrat"), ("rubik", 900, "Rubik"),
         ("leaguespartan", 900, "League Spartan"), ("archivoblack", 400, "Archivo Black"), ("outfit", 900, "Outfit"), ("lexend", 900, "Lexend")]


class Tipo:
    def __init__(self, fam, peso, acc):
        self.fam, self.peso, self.acc = fam, peso, acc
        tt = _font(peso, False, fam)[0]
        self.cap = tt["OS/2"].sCapHeight / 10   # altura de mayúscula con cuerpo 100

    def t(self, s, p="T", marca_i=True):
        kw = {}
        if marca_i and "í" in s and self.acc == "tilde": kw["tilde"] = ROJO
        if marca_i and "í" in s and self.acc == "i": kw["letras"] = {s.index("í"): ROJO}
        return txt(s, self.peso, papel=p, fam=self.fam, **kw)


def escala(g, s): return g.tr(0, 0, s)


def pila(lineas, gap, align="left", cap=70.9):
    """Apila líneas [(G, escala_de_cap)] por su altura de mayúscula (no por la tilde)."""
    W = max(g.w for g, _ in lineas)
    out, y = G(), 0
    for g, s in lineas:
        base = y + cap * s
        x = {"left": -g.bb[0], "right": W - g.bb[2], "center": (W - g.w) / 2 - g.bb[0]}[align]
        m = g.tr(x, base)
        out = out + m
        y = m.bb[3] + gap
    return out


def tras(g, h, hueco=6, dy=0):
    """h justo detrás de g, en su misma línea base (dy < 0 lo sube)."""
    return g + h.tr(g.bb[2] + hueco - h.bb[0], dy)


# ---------- composiciones ----------
def L_bandera(T):      # 1968: Orto y 10 pequeños, grafía grande, todo a la izquierda
    return pila([(escala(T.t("Orto"), .56), .56), (T.t("grafía"), 1), (escala(T.t("10"), .56), .56)], 7, cap=T.cap)
def L_1019(T):         # 1019: Orto arriba a la izquierda, grafía grande, 10 abajo a la derecha
    g = T.t("grafía")
    return pila([(escala(T.t("Orto"), .5), .5), (g, 1)], 6, cap=T.cap) + escala(T.t("10"), .5).tr(0, 0)._mover_derecha_abajo(g) if False else _l1019(T)
def _l1019(T):
    o, g, d = escala(T.t("Orto"), .5), T.t("grafía"), escala(T.t("10"), .5)
    top = pila([(o, .5), (g, 1)], 6, cap=T.cap)
    return top + d.tr(top.bb[2] - d.bb[2], top.bb[3] + 8 + T.cap * .5)
def L_cartel(T):       # 1802 / 2074: tres líneas iguales
    return pila([(T.t("Orto"), 1), (T.t("grafía"), 1), (T.t("10"), 1)], 6, cap=T.cap)
def L_dos_pisos(T):    # Orto y grafía grandes, el 10 pequeño abajo a la derecha
    o, g, d = T.t("Orto"), T.t("grafía"), escala(T.t("10"), .48)
    top = pila([(o, 1), (g, 1)], 6, cap=T.cap)
    return top + d.tr(top.bb[2] - d.bb[2], top.bb[3] + 7 + T.cap * .48)
def L_pegado(T):       # el 10 pequeño pegado a grafía, en su línea base
    o = T.t("Orto"); g = tras(T.t("grafía"), escala(T.t("10"), .46), 5)
    return pila([(o, 1), (g, 1)], 6, cap=T.cap)
def L_volado(T):       # el 10 pequeño voladito, a la altura de la tilde
    o = T.t("Orto"); g = tras(T.t("grafía"), escala(T.t("10"), .46), 5, -T.cap * .54)
    return pila([(o, 1), (g, 1)], 6, cap=T.cap)
def L_en_orto(T):      # el 10 pequeño en el hueco que deja Orto a la derecha
    o = tras(T.t("Orto"), escala(T.t("10"), .46), 8)
    return pila([(o, 1), (T.t("grafía"), 1)], 6, cap=T.cap)
def L_pastilla(T):     # Orto / grafía y el 10 en una pastilla abajo a la derecha
    top = pila([(T.t("Orto"), 1), (T.t("grafía"), 1)], 6, cap=T.cap)
    p = pastilla(escala(T.t("10", "F"), .42), px=7, py=6, rx=8)
    return top + p.tr(top.bb[2] - p.bb[2], top.bb[3] + 8 - p.bb[1])
def L_justificado(T):  # Orto estirado al ancho de grafía; 10 pequeño a la derecha
    g = T.t("grafía"); o = T.t("Orto"); s = g.w / o.w; o = escala(o, s)
    d = escala(T.t("10"), .46)
    top = pila([(o, s), (g, 1)], 6, cap=T.cap)
    return top + d.tr(top.bb[2] - d.bb[2], top.bb[3] + 7 + T.cap * .46)
def L_derecha(T):      # bandera a la derecha
    return pila([(escala(T.t("Orto"), .56), .56), (T.t("grafía"), 1), (escala(T.t("10"), .56), .56)], 7, "right", cap=T.cap)
def L_orto_grande(T):  # Orto grande, grafía algo menor, 10 pequeño pegado
    g = tras(escala(T.t("grafía"), .78), escala(T.t("10"), .4), 4)
    return pila([(T.t("Orto"), 1), (g, .78)], 5, cap=T.cap)
def L_una_linea(T):    # Ortografía en una línea con el 10 pequeño abajo
    return tras(T.t("Ortografía"), escala(T.t("10"), .42), 5)

LAYOUTS = [("Bandera izquierda", L_bandera), ("grafía en grande, Orto y 10 a los lados", _l1019), ("Cartel de tres líneas", L_cartel),
           ("Dos pisos y el 10 abajo a la derecha", L_dos_pisos), ("El 10 pequeño pegado a grafía", L_pegado),
           ("El 10 voladito junto a la tilde", L_volado), ("El 10 en el hueco de Orto", L_en_orto), ("El 10 en pastilla abajo a la derecha", L_pastilla),
           ("Orto estirado al ancho de grafía", L_justificado), ("Bandera derecha", L_derecha), ("Orto grande y grafía menor", L_orto_grande),
           ("En una línea con el 10 pequeño", L_una_linea)]
POR_LAYOUT = [9, 9, 8, 9, 9, 8, 8, 8, 8, 8, 8, 8]   # = 100


def filas():
    out, vistos = [], set()
    for li, ((nombre, fn), n) in enumerate(zip(LAYOUTS, POR_LAYOUT)):
        for j in range(n):
            pn, pal = PALS[(li + j) % 4]
            an, acc = ACC[(j + li // 2) % 3]
            fam, peso, fnom = FONTS[0] if j < 4 else FONTS[1 + (li + j) % (len(FONTS) - 1)]
            titulo = f"{nombre}, {pn}, {an}" + ("" if fam == "poppins" and peso == 800 else f" · {fnom}")
            if titulo in vistos: continue
            vistos.add(titulo)
            T = Tipo(fam, peso, acc)
            m = fn(T)
            tam = 0.8 if nombre.startswith("En una línea") else 0.74
            fav = T.t("í")
            row = {
                "titulo": titulo,
                "concepto": f"«Ortografía10» compuesto en bloque ({nombre.lower()}), en {fnom}, {pn}, con {an if acc else 'la í sin destacar'}. El favicon es la í sola con el mismo tratamiento.",
                "svg_marca": svg_marca(m, tam),
                "svg_favicon": svg_marca(fav, 0.6),
                "svg_wordmark": svg_palabra(T.t("Ortografía10")),
                "svg_pegatina": pegatina_tarjeta(m, T.t("Ortografía10"), pal, tam=0.62),
                "svg_hermano": None, "colores": pal,
                "etiquetas": ["logotipo", "Ortografía10", fnom, pn, an],
                "origen": "manual", "spec": {"tanda": 7, "layout": nombre, "fuente": fnom, "acento": acc},
            }
            out.append(row)
    return out


if __name__ == "__main__":
    f = filas(); json.dump(f, sys.stdout, ensure_ascii=False); print(len(f), file=sys.stderr)
