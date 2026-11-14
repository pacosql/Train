"""Primera tanda de propuestas de Ortografía10.

    python3 ortologo/tools/tanda1.py > /tmp/filas.json
    node ortologo/tools/hoja.js /tmp/filas.json      # mirarlas antes de insertar
    bash ortologo/tools/sb.sh POST ortologo_disenos /tmp/filas.json

Sirve de plantilla para las tandas siguientes: cada propuesta es una marca
(el símbolo del icono), una palabra («Ortografía10», siempre junto y con
tilde en la í), una paleta y, si se puede, el hermano Mates10.
"""
import json, math, sys
from marca import *
from marca import _n

ROJO, VERDE, AMARILLO, NOCHE_HEX, CREMA = "#FE5F5E", "#3FD480", "#FECB3B", "#141839", "#F6F2EA"


def paleta(fondo, tinta, acento):
    return {"icono_fondo": fondo, "icono_tinta": tinta, "acento": acento, "wordmark": tinta, "wordmark_fondo": fondo, "error": ROJO, "acierto": VERDE}


NOCHE = paleta(NOCHE_HEX, CREMA, AMARILLO)        # la del vídeo
NOCHE_VERDE = paleta(NOCHE_HEX, CREMA, VERDE)
PAPEL = paleta(CREMA, NOCHE_HEX, AMARILLO)
PAPEL_ROJO = paleta(CREMA, NOCHE_HEX, "#E8443A")  # boli rojo
SOL = paleta(AMARILLO, NOCHE_HEX, "#FFFFFF")
TINTA = paleta("#111111", "#FFFFFF", AMARILLO)    # negro editorial
DIARIO = paleta("#FFFFFF", "#111111", "#E8443A")  # blanco y negro con boli rojo
DIARIO_BN = paleta("#FFFFFF", "#111111", "#111111")
ROJIGUALDA = paleta("#E8443A", "#FFFFFF", AMARILLO)


# ---------- palabras (siempre «Ortografía10» junto) ----------
def w_color(peso=800, fam="poppins"):
    return fila(txt("Ortografía", peso, tilde="A", fam=fam), txt("10", peso, papel="A", fam=fam), hueco=5)

def w_video():
    return fila(txt("Ortografía", 800, tilde="A"), pastilla(txt("10", 800, papel="F"), px=11, py=11, rx=13), hueco=17)

def w_mono(peso=800, fam="poppins"):
    return txt("Ortografía10", peso, tilde="A", fam=fam)

def w_pesos():
    return fila(txt("Ortografía", 500, tilde="A"), txt("10", 900), hueco=5)

def w_min():
    return fila(txt("ortografía", 800, tilde="A"), txt("10", 800, papel="A"), hueco=5)

def w_serif(italica=False):
    return fila(txt("Ortografía", 900, it=italica, tilde="A", fam="playfair"), txt("10", 900, fam="playfair"), hueco=6)


# ---------- marcas ----------
def m_pastilla10():
    return pastilla(txt("10", 800, papel="F"), px=17, py=17, rx=20)

def m_letra_pastilla(L="O", tilde="A"):
    letra = txt(L, 800, tilde=tilde)
    b = pastilla(txt("10", 800, papel="F", size=36), px=7, py=7, rx=9)
    b = b.tr(letra.bb[2] - b.bb[2] + 20, 14 - b.bb[3])
    borde = rect(b.bb[0] - 5, b.bb[1] - 5, b.w + 10, b.h + 10, 13, "F")
    return letra + borde + b

def m_l10(L="O", peso=800, fam="poppins", tilde="A"):
    return fila(txt(L, peso, fam=fam, tilde=tilde), txt("10", peso, papel="A", fam=fam), hueco=5)

def m_letra(L="Ó", peso=800, fam="poppins", it=False):
    return txt(L, peso, it=it, tilde="A", punto="A", fam=fam)

def m_10_tilde(papel10="T", papel_tilde="A", fam="poppins", peso=800):
    uno, cero = txt("1", peso, papel=papel10, fam=fam), txt("0", peso, papel=papel10, fam=fam)
    cero = cero.tr(uno.bb[2] + 6 - cero.bb[0])
    t = tilde_sola("Ó", peso, papel_tilde, fam=fam)
    t = t.tr(cero.cx - t.cx + 3, cero.bb[1] - 7 - t.bb[3])
    return uno + cero + t

def m_tilde():
    return tilde_sola("Ó", 800, "A")

def _elipse_a_mano(bb, margen=14):
    x0, y0, x1, y1 = bb[0] - margen, bb[1] - margen, bb[2] + margen, bb[3] + margen
    X = lambda u: x0 + (x1 - x0) * u / 100
    Y = lambda v: y0 + (y1 - y0) * v / 100
    pts = [(9, 56), (3, 22, 38, 3, 68, 7), (100, 11, 106, 58, 84, 80), (60, 102, 13, 97, 8, 60), (5, 40, 16, 22, 33, 13)]
    d = f"M{_n(X(pts[0][0]))} {_n(Y(pts[0][1]))}" + "".join(
        "C" + " ".join(f"{_n(X(p[i]))} {_n(Y(p[i + 1]))}" for i in (0, 2, 4)) for p in pts[1:])
    return d, (x0, y0, x1 + (x1 - x0) * 0.03, y1)

def m_nota(papel_circulo="A"):
    diez = txt("10", 800)
    d, bb = _elipse_a_mano(diez.bb, 17)
    return diez + trazo(d, bb, 6.5, papel_circulo)

def m_check(L="O"):
    letra = txt(L, 800)
    x, y = letra.cx - 6, letra.bb[1] - 16
    return letra + trazo(f"M{_n(x)} {_n(y)}l11 11l25 -30", (x, y - 19, x + 36, y + 11), 10.5, VERDE)

def m_onda():
    diez = txt("10", 800)
    x0, x1, y = diez.bb[0], diez.bb[2], 22
    mid = (x0 + x1) / 2 - 4
    n = 3; paso = (mid - x0) / n
    d = f"M{_n(x0)} {y}" + "".join(f"q{_n(paso / 4)} -8 {_n(paso / 2)} 0t{_n(paso / 2)} 0" for _ in range(n))
    return diez + trazo(d, (x0, y - 5, mid, y + 5), 7, ROJO) + trazo(f"M{_n(mid + 12)} {y}H{_n(x1)}", (mid + 12, y, x1, y), 7, VERDE)

def m_exclam():
    return fila(txt("¡", 800, papel="A").tr(0, -14), txt("10", 800), txt("!", 800, papel="A"), hueco=7)

def m_comillas():
    return fila(txt("«", 800, papel="A"), txt("10", 800), txt("»", 800, papel="A"), hueco=6)

def m_anillo(dentro="10", tilde=True):
    """Una O dibujada como anillo con el 10 dentro (y la tilde encima)."""
    g = circ(0, 0, 46, "T", trazo=17)
    g = g + txt(dentro, 800, papel="A").en(-23, -17, 46, 34)
    if tilde:
        t = tilde_sola("Ó", 800, "A", size=150)
        g = g + t.tr(6 - t.cx, -63 - t.bb[3])
    return g

def m_cursor(L="O"):
    letra = txt(L, 800)
    return letra + rect(letra.bb[2] + 9, -84, 9.5, 98, 2, "A")

def m_pastilla_tilde():
    p = pastilla(txt("10", 800, papel="F"), px=17, py=17, rx=20)
    t = tilde_sola("Ó", 800, "T", size=120)
    return p + t.tr(p.bb[2] - 52 - t.cx, p.bb[1] - 7 - t.bb[3])

def m_tachado():
    """Como en el ejercicio: la palabra mal, tachada en rojo; la buena, en verde."""
    mal = txt("o", 800).op(0.55)
    raya = trazo(f"M{_n(mal.bb[0] - 6)} -27H{_n(mal.bb[2] + 6)}", (mal.bb[0] - 6, -27, mal.bb[2] + 6, -27), 8, ROJO)
    bien = txt("ó", 800, papel=VERDE)
    return (mal + raya) + bien.tr(mal.bb[2] + 14 - bien.bb[0])

def m_resaltado(L="ó"):
    """La letra del fallo resaltada en amarillo, como «camión» en el vídeo."""
    letra = txt(L, 800, papel="F")
    return rect(letra.bb[0] - 14, -98, letra.w + 28, 110, 12, "A") + letra


D = []
def add(titulo, concepto, marca, palabra, pal, tam=0.62, peg="tarjeta", hermano=None, fav=None, etiquetas=(), tam_h=None):
    D.append(dict(titulo=titulo, concepto=concepto, marca=marca, palabra=palabra, pal=pal, tam=tam, peg=peg, hermano=hermano, fav=fav, etiquetas=list(etiquetas), tam_h=tam_h or tam))


add("El del vídeo: pastilla amarilla con el 10",
    "Punto de partida: lo que ya sale en los Reels. El 10 en su pastilla amarilla sobre azul noche; la tilde de la í en amarillo.",
    m_pastilla10(), w_video(), NOCHE, tam=0.6, etiquetas=["video", "10", "pastilla"])
add("O10: la letra y la nota",
    "La O en crema y el 10 en amarillo, pegados. Es el sistema de la «Serie 10»: cambia la letra y tienes M10 para Mates10.",
    m_l10("O", tilde=None), w_color(), NOCHE, tam=0.74, hermano=m_l10("M"), etiquetas=["o10", "serie"])
add("Ó con la tilde amarilla",
    "Una sola letra: la O de Ortografía con la tilde en amarillo. La tilde es «lo que hay que poner bien». Se lee a 16 px.",
    m_letra("Ó"), w_color(), NOCHE, tam=0.56, peg="sello", etiquetas=["o", "tilde"])
add("Ó con el 10 en la esquina",
    "La Ó grande y el 10 como una pastilla de notificación. Para Mates10, la misma pastilla sobre una M.",
    m_letra_pastilla("Ó"), w_video(), NOCHE, tam=0.64, hermano=m_letra_pastilla("M"), etiquetas=["o", "pastilla", "serie"])
add("El 10 lleva tilde",
    "Un 10 al que se le ha puesto tilde: el cero pasa a leerse también como la Ó de Ortografía. Nota y letra en un solo dibujo.",
    m_10_tilde(), w_color(), NOCHE, tam=0.62, peg="sello", etiquetas=["10", "tilde"])
add("O-anillo con el 10 dentro",
    "La O es un anillo, dentro va el 10 y encima la tilde. Funciona como sello, pegatina redonda o imán de coche.",
    m_anillo(), w_color(), NOCHE, tam=0.74, peg="sello", fav=m_anillo("1", True), etiquetas=["o", "anillo", "10"])
add("Solo la tilde",
    "Lo mínimo: una tilde amarilla. Muy de marca grande, pero necesita ir siempre al lado del nombre hasta que se conozca.",
    m_tilde(), w_color(), NOCHE, tam=0.42, etiquetas=["tilde", "minimo"])
add("Pastilla del 10 con tilde",
    "La pastilla del vídeo, con una tilde que asoma por encima: distingue Ortografía10 de Mates10 sin cambiar el símbolo de la serie.",
    m_pastilla_tilde(), w_video(), NOCHE, tam=0.62, etiquetas=["pastilla", "tilde", "serie"])
add("El 10 del profe, en boli rojo",
    "Un 10 rodeado a mano con boli rojo, como la nota en un examen. Papel crema, tinta azul noche: suena a corrección sin ser infantil.",
    m_nota(), w_mono(), PAPEL_ROJO, tam=0.74, etiquetas=["nota", "boli", "error"])
add("El 10 del profe, de noche",
    "La misma nota rodeada a mano, sobre el azul noche de los Reels y en amarillo.",
    m_nota(), w_color(), NOCHE, tam=0.74, peg="sello", etiquetas=["nota", "boli"])
add("O con visto bueno",
    "La tilde de la Ó se convierte en un ✓ verde: has acertado. Usa el verde de «¡Correcta!» del ejercicio.",
    m_check("O"), w_mono(), NOCHE_VERDE, tam=0.62, etiquetas=["check", "acierto"])
add("Del error al acierto",
    "Bajo el 10, el subrayado ondulado rojo del corrector se endereza y se vuelve verde: de fallo a regla aprendida.",
    m_onda(), w_mono(), NOCHE, tam=0.66, etiquetas=["corrector", "error", "acierto"])
add("o tachada, ó correcta",
    "El mecanismo del ejercicio en dos letras: la «o» mal tachada en rojo y la «ó» buena en verde.",
    m_tachado(), w_mono(), NOCHE, tam=0.66, etiquetas=["error", "acierto", "tachado"])
add("La letra resaltada",
    "La «ó» dentro del resaltado amarillo, igual que «camión» cuando el vídeo dice «¡Aquí está!».",
    m_resaltado("ó"), w_video(), NOCHE, tam=0.52, etiquetas=["resaltado", "video"])
add("¡10!",
    "Los signos de apertura y cierre, solo del español, en amarillo alrededor del 10.",
    m_exclam(), w_color(), NOCHE, tam=0.72, peg="sello", etiquetas=["signos", "10", "español"])
add("«10» entre comillas españolas",
    "Las comillas angulares que casi nadie sabe teclear: guiño para quien se toma en serio escribir bien.",
    m_comillas(), w_color(), NOCHE, tam=0.76, etiquetas=["comillas", "10"])
add("ñ con la virgulilla amarilla",
    "La letra más española. No está en el nombre, así que dice «español» más que «Ortografía10»; la dejo para comparar.",
    m_letra("ñ"), w_color(), NOCHE, tam=0.5, etiquetas=["ñ", "español"])
add("O con cursor",
    "La O y el cursor de escribir parpadeando en amarillo. Sirve además de animación de entrada en los Reels.",
    m_cursor("O"), w_color(), NOCHE, tam=0.6, hermano=m_cursor("M"), etiquetas=["cursor", "escribir"])
add("í: la tilde que no puede faltar",
    "La í de Ortografía, con su tilde amarilla. Estrecha y alta: muy reconocible, pero rellena poco el icono.",
    m_letra("í"), w_color(), NOCHE, tam=0.6, etiquetas=["i", "tilde"])
add("10 con tilde, fondo amarillo",
    "El mismo «10 con tilde» sobre el amarillo de la marca: se ve de lejos en una pegatina o un imán de coche.",
    m_10_tilde("T", "A"), w_mono(), SOL, tam=0.62, peg="sello", etiquetas=["10", "tilde", "amarillo"])
add("Pastilla del 10, sobre papel",
    "La versión clara del vídeo: pastilla amarilla sobre crema, tinta azul noche. Para web y documentos.",
    m_pastilla10(), w_video(), PAPEL, tam=0.6, etiquetas=["claro", "pastilla"])
add("Negro editorial: Ó serif",
    "Estilo cabecera de periódico: una Ó con serifa, blanca sobre negro, y solo la tilde en amarillo.",
    m_letra("Ó", 900, "playfair"), w_serif(), TINTA, tam=0.6, etiquetas=["serif", "negro", "editorial"])
add("Negro editorial: O10 serif",
    "O10 en serifa de periódico, blanco y negro, con el 10 en amarillo como único color.",
    m_l10("O", 900, "playfair", tilde=None), w_serif(), TINTA, tam=0.76, hermano=m_l10("M", 900, "playfair"), etiquetas=["serif", "negro", "o10"])
add("Diario: 10 con tilde en boli rojo",
    "Todo en negro sobre blanco, tipo periódico, y la tilde en rojo de corrección: el único toque de color es justo lo que enseña la app.",
    m_10_tilde("T", "A", "playfair", 900), w_serif(), DIARIO, tam=0.6, etiquetas=["serif", "blanco", "boli"])
add("Diario: el 10 rodeado a boli",
    "Serifa negra de periódico y el círculo a mano en rojo: una portada corregida por un profesor.",
    txt("10", 900, fam="playfair") + trazo(*_elipse_a_mano(txt("10", 900, fam="playfair").bb, 16), 5.5, "A"), w_serif(True), DIARIO, tam=0.76, peg="sello", etiquetas=["serif", "nota", "boli"])
add("Negro sin serifa: O10",
    "La versión más sobria: O10 en Poppins, blanco sobre negro, el 10 en amarillo.",
    m_l10("O", 800, tilde=None), w_color(), TINTA, tam=0.74, hermano=m_l10("M"), etiquetas=["negro", "o10"])
add("Rojo y amarillo",
    "Producto para España, dicho con los colores: fondo rojo, Ó blanca y tilde amarilla. Muy visible en una pegatina; quizá demasiado bandera.",
    m_letra("Ó"), w_color(), ROJIGUALDA, tam=0.56, peg="sello", etiquetas=["rojo", "español"])
add("ó10 en minúscula",
    "Todo en minúscula y de un trazo: «ó10». Más cercano y de app; la tilde y el 10 en amarillo.",
    fila(txt("ó", 800, tilde="A"), txt("10", 800, papel="A"), hueco=5), w_min(), NOCHE, tam=0.76, etiquetas=["minuscula", "o10"])


def filas():
    out = []
    for d in D:
        c = d["pal"]
        lado = 100 * d["tam"]
        marca_col = d["marca"]
        row = {
            "titulo": d["titulo"], "concepto": d["concepto"],
            "svg_marca": svg_marca(d["marca"], d["tam"]),
            "svg_favicon": svg_marca(d["fav"], min(0.8, d["tam"] + 0.1)) if d["fav"] else None,
            "svg_wordmark": svg_palabra(d["palabra"]),
            "svg_pegatina": pegatina_sello(marca_col, c, tam=d["tam"]) if d["peg"] == "sello" else pegatina_tarjeta(marca_col, d["palabra"], c, tam=d["tam"]),
            "svg_hermano": svg_marca(d["hermano"], d["tam_h"]) if d["hermano"] else None,
            "colores": c, "etiquetas": d["etiquetas"], "origen": "manual",
            "spec": {"tanda": 1, "pegatina": d["peg"]},
        }
        out.append(row)
    return out


if __name__ == "__main__":
    json.dump(filas(), sys.stdout, ensure_ascii=False)
