"""Ajuste de bordes y rectificación de recuadros de las fotos."""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi


def load_norm(path):
    """Gris normalizado: papel ~1, tinta ~0 (corrige sombras e iluminación)."""
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.float32) / 255.0
    g = 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]
    # Fondo: máximo local (borra trazos finos) + suavizado grande.
    bg = ndi.maximum_filter(g, size=25)
    bg = ndi.gaussian_filter(bg, 12)
    n = np.clip(g / np.maximum(bg, 1e-3), 0, 1)
    return n


def refine_edge(n, p0, p1, search=14, samples=24, lo=0.18, hi=0.82):
    """Recta del borde oscuro cerca del segmento p0-p1 (puntos (x, y))."""
    p0, p1 = np.array(p0, float), np.array(p1, float)
    d = p1 - p0
    L = np.hypot(*d)
    t = d / L
    nrm = np.array([-t[1], t[0]])
    pts = []
    for s in np.linspace(lo, hi, samples):
        c = p0 + d * s
        offs = np.arange(-search, search + 1, 0.5)
        xs = c[0] + nrm[0] * offs
        ys = c[1] + nrm[1] * offs
        v = ndi.map_coordinates(n, [ys, xs], order=1, mode="nearest")
        dark = np.clip(0.75 - v, 0, None)
        if dark.max() < 0.25:
            continue
        # el tramo oscuro más fuerte
        k = int(np.argmax(dark))
        win = slice(max(0, k - 8), k + 9)
        w = dark[win]
        o = (offs[win] * w).sum() / w.sum()
        pts.append(c + nrm * o)
    pts = np.array(pts)
    # Ajuste robusto: recta por PCA con 2 pasadas de rechazo de atípicos.
    keep = np.ones(len(pts), bool)
    for _ in range(3):
        q = pts[keep]
        m = q.mean(0)
        u, sv, vt = np.linalg.svd(q - m)
        dirv = vt[0]
        nn = np.array([-dirv[1], dirv[0]])
        r = (pts - m) @ nn
        keep = np.abs(r) < max(1.0, 2.5 * np.std(r[keep]))
    return m, dirv, float(np.std(r[keep])), int(keep.sum())


def intersect(l1, l2):
    (m1, d1), (m2, d2) = l1[:2], l2[:2]
    A = np.array([d1, -d2]).T
    s = np.linalg.solve(A, m2 - m1)
    return m1 + d1 * s[0]


def refine_quad(n, quad, **kw):
    """quad = [TL, TR, BR, BL] aproximados → esquinas virtuales ajustadas."""
    TL, TR, BR, BL = quad
    top = refine_edge(n, TL, TR, **kw)
    right = refine_edge(n, TR, BR, **kw)
    bottom = refine_edge(n, BR, BL, **kw)
    left = refine_edge(n, BL, TL, **kw)
    out = [intersect(left, top), intersect(top, right), intersect(right, bottom), intersect(bottom, left)]
    info = [(round(e[2], 2), e[3]) for e in (top, right, bottom, left)]
    return [tuple(map(float, p)) for p in out], info


def homography(src, dst):
    """Coeficientes PIL PERSPECTIVE: punto de salida (dst) → entrada (src)."""
    A, b = [], []
    for (X, Y), (x, y) in zip(src, dst):
        A.append([x, y, 1, 0, 0, 0, -X * x, -X * y]); b.append(X)
        A.append([0, 0, 0, x, y, 1, -Y * x, -Y * y]); b.append(Y)
    return np.linalg.solve(np.array(A, float), np.array(b, float))


def warp(n, quad, W, H, scale=2.0, margin=0.0):
    """Rectifica el cuadrilátero a un rectángulo W×H (unidades 'de foto') ×scale.
    margin: fracción extra alrededor (negativa recorta hacia dentro)."""
    mx, my = W * margin, H * margin
    dst = [(-mx, -my), (W + mx, -my), (W + mx, H + my), (-mx, H + my)]
    # dst en coordenadas de salida escaladas
    OW, OH = int(round((W + 2 * mx) * scale)), int(round((H + 2 * my) * scale))
    dsts = [((x + mx) * scale, (y + my) * scale) for x, y in dst]
    coeffs = homography(quad, dsts)
    img = Image.fromarray((np.clip(n, 0, 1) * 255).astype(np.uint8), "L")
    return img.transform((OW, OH), Image.PERSPECTIVE, tuple(coeffs), resample=Image.BICUBIC, fillcolor=255)


def ink(img, a=0.10, b=0.50, gamma=1.0):
    """Curva de tinta: papel → blanco puro, trazo → negro, bordes suaves."""
    v = np.asarray(img).astype(np.float32) / 255.0
    k = np.clip(((1 - v) - a) / (b - a), 0, 1) ** gamma
    return Image.fromarray(((1 - k) * 255).astype(np.uint8), "L")


def size_of(quad):
    TL, TR, BR, BL = map(np.array, quad)
    W = (np.hypot(*(TR - TL)) + np.hypot(*(BR - BL))) / 2
    H = (np.hypot(*(BL - TL)) + np.hypot(*(BR - TR))) / 2
    return W, H


def edge_candidates(n, p0, p1, search=16, samples=48, lo=0.12, hi=0.88, thr=0.30):
    """Todos los picos oscuros a lo largo de perpendiculares al segmento."""
    p0, p1 = np.array(p0, float), np.array(p1, float)
    d = p1 - p0
    L = np.hypot(*d)
    t = d / L
    nrm = np.array([-t[1], t[0]])
    offs = np.arange(-search, search + 0.01, 0.5)
    cands = []
    for i, s in enumerate(np.linspace(lo, hi, samples)):
        c = p0 + d * s
        v = ndi.map_coordinates(n, [c[1] + nrm[1] * offs, c[0] + nrm[0] * offs], order=1, mode="nearest")
        dark = np.clip(0.8 - v, 0, None)
        dark = ndi.gaussian_filter1d(dark, 1.0)
        for k in range(1, len(dark) - 1):
            if dark[k] >= thr and dark[k] >= dark[k - 1] and dark[k] > dark[k + 1]:
                win = slice(max(0, k - 5), k + 6)
                w = dark[win]
                o = (offs[win] * w).sum() / w.sum()
                cands.append((i, c + nrm * o, dark[k]))
    return cands, t


def ransac_edge(n, p0, p1, tol=1.2, iters=1500, prefer=None, **kw):
    """Recta con más apoyos. prefer='outer'|'inner' no se usa: el borde del
    recuadro es la línea larga y continua, la que más muestras cubre."""
    cands, t = edge_candidates(n, p0, p1, **kw)
    P = np.array([c[1] for c in cands])
    S = np.array([c[0] for c in cands])
    rng = np.random.default_rng(0)
    best = None
    for _ in range(iters):
        i, j = rng.choice(len(P), 2, replace=False)
        if S[i] == S[j]:
            continue
        d = P[j] - P[i]
        if np.hypot(*d) < 1e-6:
            continue
        d = d / np.hypot(*d)
        if abs(d @ t) < 0.97:  # casi paralela al borde esperado
            continue
        nn = np.array([-d[1], d[0]])
        r = np.abs((P - P[i]) @ nn)
        inl = r < tol
        # una muestra cuenta una vez
        cover = len(set(S[inl]))
        if best is None or cover > best[0]:
            best = (cover, inl)
    cover, inl = best
    q = P[inl]
    m = q.mean(0)
    _, _, vt = np.linalg.svd(q - m)
    dirv = vt[0]
    nn = np.array([-dirv[1], dirv[0]])
    res = (q - m) @ nn
    return m, dirv, float(np.std(res)), int(cover)


def refine_quad2(n, quad, **kw):
    TL, TR, BR, BL = quad
    top = ransac_edge(n, TL, TR, **kw)
    right = ransac_edge(n, TR, BR, **kw)
    bottom = ransac_edge(n, BR, BL, **kw)
    left = ransac_edge(n, BL, TL, **kw)
    out = [intersect(left, top), intersect(top, right), intersect(right, bottom), intersect(bottom, left)]
    info = [(round(e[2], 2), e[3]) for e in (top, right, bottom, left)]
    return [tuple(map(float, p)) for p in out], info
