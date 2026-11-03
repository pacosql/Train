import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
OUTDIR = sys.argv[1]
PID = {"wall": 1, "membrane": 2, "vacuole": 3, "nucleus": 4, "chloroplast": 5, "mitochondria": 6, "vesicle": 7}
CFG = {
 "plant": {
  "title": [240, 0, 1060, 148],
  "boxes": {"wall": [1065, 128, 1312, 200], "membrane": [1068, 238, 1332, 318], "vacuole": [10, 368, 265, 452],
            "chloroplast": [1110, 392, 1330, 467], "nucleus": [1120, 630, 1328, 714]},
  "dots": {"wall": [996, 190], "membrane": [982, 272], "vacuole": [388, 475], "chloroplast": [1018, 453], "nucleus": [880, 632]},
  "order": ["wall", "membrane", "vacuole", "nucleus", "chloroplast", "mitochondria", "vesicle"],
 },
 "animal": {
  "title": [190, 0, 1240, 200],
  "boxes": {"membrane": [1043, 228, 1412, 320], "nucleus": [1170, 450, 1410, 545], "vacuole": [20, 906, 272, 1000]},
  "dots": {"membrane": [968, 296], "nucleus": [793, 636], "vacuole": [436, 890], "vacuole2": [533, 946]},
  "order": ["membrane", "nucleus", "vacuole", "mitochondria"],
 },
}
meta = {}
for k, c in CFG.items():
    a = 1 - np.asarray(Image.open(f"out/cell_{k}.png").convert("L")).astype(np.float32) / 255
    H, W = a.shape
    ink = a > 0.45
    parts = np.load(f"out/parts_{k}.npz")
    # cajas exactas: componente de tinta más grande dentro de la caja aproximada
    lab_ink, _ = ndi.label(ink)
    boxes = {}
    erase = np.zeros_like(ink)
    for name, (x0, y0, x1, y1) in c["boxes"].items():
        sub = lab_ink[max(0, y0 - 10):y1 + 10, max(0, x0 - 10):x1 + 10]
        ids, cnt = np.unique(sub[sub > 0], return_counts=True)
        comp = ids[np.argmax(cnt)]
        ys, xs = np.nonzero(lab_ink == comp)
        # limitar a la zona de la caja (por si el componente incluye la línea guía)
        sel = (xs >= x0 - 12) & (xs <= x1 + 12) & (ys >= y0 - 12) & (ys <= y1 + 12)
        bx0, bx1, by0, by1 = xs[sel].min(), xs[sel].max(), ys[sel].min(), ys[sel].max()
        boxes[name] = [int(bx0), int(by0), int(bx1), int(by1)]
        erase[by0 - 2:by1 + 3, bx0 - 2:bx1 + 3] = True
    tx0, ty0, tx1, ty1 = c["title"]
    # título: franja superior entera (píldora, letras y hojas)
    erase[ty0:ty1, max(0, tx0 - 80):min(W, tx1 + 80)] = True
    # marco del recuadro de la ficha: componentes de tinta que tocan el borde
    edge_ids = set(np.unique(np.concatenate([lab_ink[:4].ravel(), lab_ink[-4:].ravel(), lab_ink[:, :4].ravel(), lab_ink[:, -4:].ravel()]))) - {0}
    for e in edge_ids:
        erase |= ndi.binary_dilation(lab_ink == e, iterations=2)
    # quitar restos de esquinas (fuera de la célula y lejos de las líneas guía) — mancha suelta
    erase = ndi.binary_dilation(erase, iterations=3)
    keep_a = np.where(erase, 0, a)
    # componentes diminutas sueltas fuera de la célula → fuera (motas del papel)
    cell = np.load(f"out/{k}_cell.npy") if False else None
    lab2, n2 = ndi.label(keep_a > 0.3)
    sizes = ndi.sum(np.ones_like(lab2), lab2, range(1, n2 + 1))
    for i, s in enumerate(sizes):
        if s < 40:
            keep_a[lab2 == i + 1] = 0
    # puntos de las líneas guía: centro de la región blanca pequeña cerca
    labw, _ = ndi.label(~ndi.binary_dilation(ink, iterations=1))
    dots = {}
    for name, (x, y) in c["dots"].items():
        best = None
        for dy in range(-22, 23, 2):
            for dx in range(-22, 23, 2):
                r = labw[y + dy, x + dx]
                if r == 0:
                    continue
                m = labw == r
                s = m.sum()
                if 15 <= s <= 900:
                    cy, cx = ndi.center_of_mass(m)
                    d = np.hypot(cx - x, cy - y)
                    if best is None or d < best[0]:
                        best = (d, cx, cy, s)
        dots[name] = [round(best[1], 1), round(best[2], 1)] if best else [x, y]
        print(k, name, "dot", dots[name], "area", best[3] if best else None)
    # recorte: caja de todo lo que queda + cajas
    ys, xs = np.nonzero(keep_a > 0.3)
    allx = np.concatenate([xs, [b[0] for b in boxes.values()], [b[2] for b in boxes.values()]])
    ally = np.concatenate([ys, [b[1] for b in boxes.values()], [b[3] for b in boxes.values()]])
    cx0, cx1 = max(0, allx.min() - 6), min(W, allx.max() + 7)
    cy0, cy1 = max(0, ally.min() - 6), min(H, ally.max() + 7)
    keep_a = keep_a[cy0:cy1, cx0:cx1]
    cw, ch = cx1 - cx0, cy1 - cy0
    img = Image.fromarray(((1 - np.clip(keep_a, 0, 1)) * 255).astype(np.uint8), "L")
    # mapa de partes (prioridad: lo último pisa)
    pm = np.zeros((H, W), np.uint8)
    for name in c["order"]:
        pm[parts[name]] = PID[name]
    pm = pm[cy0:cy1, cx0:cx1]
    Image.fromarray((pm * 25).astype(np.uint8), "L").save(f"{OUTDIR}/cell-{k}-map.png", optimize=True)
    img.save(f"{OUTDIR}/cell-{k}.png", optimize=True)
    norm = lambda x, y: [round((x - cx0) / cw, 4), round((y - cy0) / ch, 4)]
    info = {"w": int(cw), "h": int(ch),
            "boxes": {n: norm(b[0], b[1]) + [round((b[2] - b[0]) / cw, 4), round((b[3] - b[1]) / ch, 4)] for n, b in boxes.items()},
            "dots": {n: norm(*d) for n, d in dots.items()}, "parts": {}}
    for name in c["order"]:
        m = pm == PID[name]
        if not m.any():
            continue
        ys2, xs2 = np.nonzero(m)
        info["parts"][name] = {"id": PID[name], "bbox": [round(xs2.min() / cw, 4), round(ys2.min() / ch, 4), round(xs2.max() / cw, 4), round(ys2.max() / ch, 4)],
                               "c": [round(xs2.mean() / cw, 4), round(ys2.mean() / ch, 4)]}
    meta[k] = info
    print(k, "crop", (cx0, cy0, cx1, cy1), "size", (cw, ch))
json.dump(meta, open(f"{OUTDIR}/cells.json", "w"), indent=1)
