"""Piezas para dibujar logos de Ortografía10 como SVG de trazados.

Todo el texto se convierte en trazados (Poppins, alojada en ../fonts), así
el logo se ve igual en cualquier sitio y se puede exportar sin tipografías.
El encaje (centrado, escala) se calcula aquí, no en el navegador.

Requiere: pip install fonttools brotli uharfbuzz

Colores: cada pieza lleva un «papel» en vez de un color fijo, y la app lo
pinta con los colores de la fila (columna `colores`):
  "T" tinta · "A" acento · "F" fondo (recorta) · o un hex fijo ("#FE5F5E").
"""
import io, math, os
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import DecomposingRecordingPen, RecordingPen
import uharfbuzz as hb

FONTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts")
CAP, XH = 70.9, 56.1  # altura de mayúsculas y de la x con cuerpo 100
_fonts = {}


def _font(peso, it, fam="poppins"):
    """fam: "poppins" (../fonts) o "playfair" (./fuentes, serif editorial)."""
    k = (peso, it, fam)
    if k not in _fonts:
        base = FONTS if fam == "poppins" else os.path.join(os.path.dirname(os.path.abspath(__file__)), "fuentes")
        tt = TTFont(os.path.join(base, f"{fam}-{peso}{'i' if it else ''}.woff2"))
        tt.flavor = None
        buf = io.BytesIO(); tt.save(buf)
        _fonts[k] = (tt, tt.getGlyphSet(), hb.Font(hb.Face(buf.getvalue())))
    return _fonts[k]


def _n(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def _attr(papel, trazo=None):
    """Atributos de color de una pieza, con marcadores que resuelve render()."""
    if trazo:
        base = f'stroke-width="{_n(trazo)}" stroke-linecap="round" stroke-linejoin="round" '
        return base + ({"T": "§sT§", "A": "§sA§", "F": "§sF§"}.get(papel) or f'fill="none" stroke="{papel}"')
    return {"T": "§T§", "A": "§A§", "F": "§F§"}.get(papel) or f'fill="{papel}"'


class G:
    """Grupo de piezas SVG con su caja (x0, y0, x1, y1)."""

    def __init__(self, els="", bb=None):
        self.els, self.bb = els, bb

    def __add__(self, o):
        if o.bb is None: return G(self.els, self.bb)
        if self.bb is None: return G(o.els, o.bb)
        a, b = self.bb, o.bb
        return G(self.els + o.els, (min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])))

    w = property(lambda s: s.bb[2] - s.bb[0])
    h = property(lambda s: s.bb[3] - s.bb[1])
    cx = property(lambda s: (s.bb[0] + s.bb[2]) / 2)
    cy = property(lambda s: (s.bb[1] + s.bb[3]) / 2)

    def tr(self, dx=0, dy=0, s=1):
        x0, y0, x1, y1 = self.bb
        t = f"translate({_n(dx)} {_n(dy)})" + (f" scale({_n(s)})" if s != 1 else "")
        return G(f'<g transform="{t}">{self.els}</g>', (x0 * s + dx, y0 * s + dy, x1 * s + dx, y1 * s + dy))

    def rot(self, grados, cx=None, cy=None):
        """Gira alrededor del centro (la caja pasa a ser la del círculo que lo contiene)."""
        cx = self.cx if cx is None else cx; cy = self.cy if cy is None else cy
        r = math.hypot(self.w, self.h) / 2
        return G(f'<g transform="rotate({_n(grados)} {_n(cx)} {_n(cy)})">{self.els}</g>', (cx - r, cy - r, cx + r, cy + r))

    def op(self, o):
        return G(f'<g opacity="{o}">{self.els}</g>', self.bb)

    def caja(self, bb):
        """Fuerza la caja (para encajar por algo distinto de la tinta real)."""
        return G(self.els, bb)

    def en(self, x, y, w, h, ax=0.5, ay=0.5):
        """Escala y coloca el grupo dentro de la caja x,y,w,h."""
        s = min(w / self.w, h / self.h)
        return self.tr(x + (w - self.w * s) * ax - self.bb[0] * s, y + (h - self.h * s) * ay - self.bb[1] * s, s)


def _contornos(rec):
    out, cur = [], []
    for op, args in rec.value:
        cur.append((op, args))
        if op in ("closePath", "endPath"):
            out.append(cur); cur = []
    return out


def _dibuja(contornos, t):
    sp = SVGPathPen(None, ntos=_n); bp = BoundsPen(None)
    for pen in (sp, bp):
        tp = TransformPen(pen, t)
        for c in contornos:
            for op, args in c: getattr(tp, op)(*args)
    return sp.getCommands(), bp.bounds


def txt(s, peso=800, it=False, papel="T", tilde=None, punto=None, size=100, tracking=0, trazo=None, fam="poppins"):
    """Texto en Poppins convertido a trazados. Línea base en y=0, empieza en x=0.

    tilde: papel distinto para las tildes/virgulillas (á é í ó ú ñ).
    punto: papel distinto para el punto de la i / j.
    trazo: si se da, solo contorno de ese grosor (en unidades del lienzo).
    """
    tt, gs, hbf = _font(peso, it, fam)
    capH, xH = tt["OS/2"].sCapHeight, tt["OS/2"].sxHeight
    buf = hb.Buffer(); buf.add_str(s); buf.guess_segment_properties()
    hb.shape(hbf, buf, {"kern": True, "liga": False, "lnum": True})
    k = size / 1000
    x = 0
    base, marcas, puntos = [], [], []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        ch = s[info.cluster]
        rec = DecomposingRecordingPen(gs); gs[tt.getGlyphName(info.codepoint)].draw(rec)
        t = (k, 0, 0, -k, (x + pos.x_offset) * k, 0)
        for c in _contornos(rec):
            bp = BoundsPen(None); r = RecordingPen(); r.value = c; r.replay(bp)
            if not bp.bounds: continue
            ymin = bp.bounds[1]
            alto = capH if ch.isupper() else xH
            if tilde and ch in "áéíóúñÁÉÍÓÚÑ" and ymin > alto * 0.98: marcas.append((c, t))
            elif punto and ch in "ij" and ymin > xH * 0.98: puntos.append((c, t))
            else: base.append((c, t))
        x += pos.x_advance + tracking * 1000
    g = G()
    for grupo, p in ((base, papel), (marcas, tilde), (puntos, punto)):
        if not grupo: continue
        ds, bbs = zip(*[_dibuja([c], t) for c, t in grupo])
        bb = (min(b[0] for b in bbs), min(b[1] for b in bbs), max(b[2] for b in bbs), max(b[3] for b in bbs))
        g = g + G(f'<path d="{"".join(ds)}" {_attr(p, trazo)}/>', bb)
    return g


def tilde_sola(letra="ó", peso=800, papel="A", size=100, fam="poppins"):
    """Solo la tilde de una letra (sin la letra)."""
    tt, gs, _ = _font(peso, False, fam)
    rec = DecomposingRecordingPen(gs); gs[tt.getBestCmap()[ord(letra)]].draw(rec)
    k = size / 1000
    alto = tt["OS/2"].sCapHeight if letra.isupper() else tt["OS/2"].sxHeight
    cs = []
    for c in _contornos(rec):
        bp = BoundsPen(None); r = RecordingPen(); r.value = c; r.replay(bp)
        if bp.bounds and bp.bounds[1] > alto * 0.98: cs.append(c)
    d, bb = _dibuja(cs, (k, 0, 0, -k, 0, 0))
    return G(f'<path d="{d}" {_attr(papel)}/>', bb)


def rect(x, y, w, h, rx=0, papel="A", trazo=None):
    return G(f'<rect x="{_n(x)}" y="{_n(y)}" width="{_n(w)}" height="{_n(h)}" rx="{_n(rx)}" {_attr(papel, trazo)}/>',
             (x - (trazo or 0) / 2, y - (trazo or 0) / 2, x + w + (trazo or 0) / 2, y + h + (trazo or 0) / 2))


def circ(cx, cy, r, papel="A", trazo=None):
    e = r + (trazo or 0) / 2
    return G(f'<circle cx="{_n(cx)}" cy="{_n(cy)}" r="{_n(r)}" {_attr(papel, trazo)}/>', (cx - e, cy - e, cx + e, cy + e))


def trazo(d, bb, grosor, papel="A"):
    """Trazo libre (línea con puntas redondas). bb = caja del trazo sin grosor."""
    e = grosor / 2
    return G(f'<path d="{d}" {_attr(papel, grosor)}/>', (bb[0] - e, bb[1] - e, bb[2] + e, bb[3] + e))


def forma(d, bb, papel="A"):
    return G(f'<path d="{d}" {_attr(papel)}/>', bb)


def fila(*gs, hueco=0):
    """Pone los grupos uno detrás de otro (misma línea base)."""
    out, x = G(), None
    for g in gs:
        if g.bb is None: continue
        if x is None: out, x = g, g.bb[2]
        else:
            m = g.tr(x + hueco - g.bb[0]); out = out + m; x = m.bb[2]
    return out


def pastilla(g, px=14, py=12, rx=14, papel="A"):
    """Rectángulo redondeado detrás de un grupo."""
    x0, y0, x1, y1 = g.bb
    return rect(x0 - px, y0 - py, (x1 - x0) + 2 * px, (y1 - y0) + 2 * py, rx, papel) + g


def arco(s, R, cx, cy, size=20, peso=700, papel="T", abajo=False, tracking=0.06):
    """Texto siguiendo un círculo de radio R (arriba, o abajo si abajo=True)."""
    tt, gs, hbf = _font(peso, False)
    buf = hb.Buffer(); buf.add_str(s); buf.guess_segment_properties(); hb.shape(hbf, buf, {"kern": True})
    k = size / 1000
    adv = [(p.x_advance / 1000 + tracking) * size for p in buf.glyph_positions]
    total, x, els = sum(adv), 0, ""
    for info, a in zip(buf.glyph_infos, adv):
        rec = DecomposingRecordingPen(gs); gs[tt.getGlyphName(info.codepoint)].draw(rec)
        d, bb = _dibuja(_contornos(rec), (k, 0, 0, -k, 0, 0))
        ang = math.degrees((x + a / 2 - total / 2) / R)
        x += a
        if not bb: continue
        ga = a - tracking * size
        t = (f"translate({_n(cx)} {_n(cy)}) rotate({_n(-ang)}) translate({_n(-ga / 2)} {_n(R + CAP * size / 100)})" if abajo
             else f"translate({_n(cx)} {_n(cy)}) rotate({_n(ang)}) translate({_n(-ga / 2)} {_n(-R)})")
        els += f'<path transform="{t}" d="{d}" {_attr(papel)}/>'
    e = R + size
    return G(els, (cx - e, cy - e, cx + e, cy + e))


# ---------- salida ----------
def render(g, tinta=None, acento=None, fondo=None):
    """Resuelve los papeles. Sin colores → clases que pinta la app."""
    s = g.els
    if tinta is None:
        rep = {"§T§": 'fill="currentColor"', "§A§": 'class="acento"', "§F§": 'class="fondo"',
               "§sT§": 'fill="none" stroke="currentColor"', "§sA§": 'fill="none" class="acento-trazo"', "§sF§": 'fill="none" class="fondo-trazo"'}
    else:
        rep = {"§T§": f'fill="{tinta}"', "§A§": f'fill="{acento}"', "§F§": f'fill="{fondo}"',
               "§sT§": f'fill="none" stroke="{tinta}"', "§sA§": f'fill="none" stroke="{acento}"', "§sF§": f'fill="none" stroke="{fondo}"'}
    for k, v in rep.items(): s = s.replace(k, v)
    return s


def _dentro(g, cx, cy, lado, radio, redondo=False):
    """Centra g en (cx, cy) dentro de un cuadrado de `lado`, y lo encoge lo
    necesario para que las esquinas de su caja no pasen de `radio`: así nada
    se sale del avatar redondo ni roza el borde del icono o de la pegatina."""
    m = g.en(cx - lado / 2, cy - lado / 2, lado, lado)
    r = max(m.w, m.h) / 2 if redondo else math.hypot(m.w, m.h) / 2
    if r > radio:
        lado *= radio / r
        m = g.en(cx - lado / 2, cy - lado / 2, lado, lado)
    return m


def svg_marca(g, tam=0.62, dy=0, redondo=False):
    """Marca centrada en un lienzo 100×100 ocupando `tam` del lado."""
    m = _dentro(g, 50, 50 + dy, 100 * tam, 45, redondo)  # redondo=True si la marca es un círculo
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">{render(m)}</svg>'


def svg_lienzo(g):
    """Marca que ya viene colocada en el lienzo 100×100 (a sangre)."""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">{render(g)}</svg>'


def svg_palabra(g):
    x0, y0, x1, y1 = g.bb
    p = (y1 - y0) * 0.06
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{_n(x0 - p)} {_n(y0 - p)} {_n(x1 - x0 + 2 * p)} {_n(y1 - y0 + 2 * p)}">{render(g)}</svg>'


URL = "ortografia10.com"


def pegatina_tarjeta(marca, palabra, c, tam=0.62, url=URL):
    """Pegatina rectangular troquelada: marca, nombre y la web."""
    f, t, a = c["icono_fondo"], c["icono_tinta"], c["acento"]
    cuerpo = rect(0, 0, 300, 372, 46, "#FFFFFF") + rect(12, 12, 276, 348, 36, f)
    # la marca cabe siempre en el hueco de arriba (sin tocar el borde ni el nombre)
    m = _dentro(marca, 150, 128, min(200 * tam / 0.62, 228), 142)
    if m.h > 184: m = marca.en(36, 36, 228, 184)
    p = palabra.en(40, 252, 220, 44)
    u = txt(url, 600, papel="T").en(60, 316, 180, 17).op(0.75)
    els = render(cuerpo + m + p + u, t, a, f)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 372">{els}</svg>'


def pegatina_sello(marca, c, nombre="ORTOGRAFÍA10", tam=0.62, url=URL):
    """Pegatina redonda: la marca en el centro, el nombre arriba y la web abajo."""
    f, t, a = c["icono_fondo"], c["icono_tinta"], c["acento"]
    els = render(circ(150, 150, 150, "#FFFFFF") + circ(150, 150, 138, f))
    m = _dentro(marca, 150, 150, min(128 * tam / 0.62, 150), 80)  # sin pisar el texto del aro
    arriba = arco(nombre, 104, 150, 150, 21, 800, "T")
    abajo = arco(url, 104, 150, 150, 17.5, 600, "A", abajo=True)
    puntos = circ(150 - 117, 150, 3.2, "A") + circ(150 + 117, 150, 3.2, "A")
    els += render(m + arriba + abajo + puntos, t, a, f)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">{els}</svg>'
