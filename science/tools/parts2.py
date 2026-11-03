"""Mapa de partes de las células de la ficha (pared, membrana, núcleo, vacuola(s),
cloroplastos, mitocondrias). Selección de regiones por centroide + tamaño."""
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

def load(src):
    a = 1 - np.asarray(Image.open(src).convert("L")).astype(np.float32) / 255
    ink = a > 0.45
    lab, n = ndi.label(~ndi.binary_dilation(ink, iterations=2))
    return a, ink, lab, n

def region_stats(lab, n):
    idx = np.arange(1, n + 1)
    ones = np.ones_like(lab)
    area = ndi.sum(ones, lab, idx)
    com = np.array(ndi.center_of_mass(ones, lab, idx))
    return idx, area, com

def pick(lab, stats, cx, cy, R, amin, amax):
    idx, area, com = stats
    d = np.hypot(com[:, 1] - cx, com[:, 0] - cy)
    ok = (d < R) & (area >= amin) & (area <= amax)
    if not ok.any():
        raise SystemExit(f"nada cerca de {(cx, cy)}")
    j = np.argmax(np.where(ok, area, -1))
    return int(idx[j])

def build(cfg):
    a, ink, lab, n = load(cfg["src"])
    stats = region_stats(lab, n)
    outs = cfg["out"] if isinstance(cfg["out"][0], list) else [cfg["out"]]
    oids = sorted({int(lab[y, x]) for x, y in outs} - {0})
    o = oids[0]
    O = np.isin(lab, oids)
    notO = ~O
    for x0, y0, x1, y1 in cfg["exclude"]:
        notO[y0:y1, x0:x1] = False
    op = ndi.binary_opening(notO, structure=ndi.generate_binary_structure(2, 1), iterations=7)
    cl, m = ndi.label(op)
    cell = ndi.binary_fill_holes(cl == 1 + int(np.argmax(ndi.sum(op, cl, range(1, m + 1)))))
    D = ndi.distance_transform_edt(~O)
    idx, area, com = stats
    minD = ndi.minimum(D, lab, idx)
    incell = ndi.mean(cell, lab, idx)
    band = [int(r) for r, md, ic in zip(idx, minD, incell) if r not in oids and ic > 0.6 and md < cfg["band_max"]]
    gap = [int(r) for r, md, ic in zip(idx, minD, incell) if r not in oids and ic > 0.6 and cfg["band_max"] <= md < cfg["gap_max"]]
    B, G = np.isin(lab, band), np.isin(lab, gap)
    inner = cell & ~B & ~G & ~ndi.binary_dilation(O, iterations=2)
    inner_regions = np.isin(lab, [int(r) for r, ic in zip(idx, incell) if r not in oids and ic > 0.6 and r not in band and r not in gap])
    interior = ndi.binary_fill_holes(inner_regions | (ink & ndi.binary_dilation(inner_regions, iterations=4))) & cell
    near = lambda mm, k=7: ndi.binary_dilation(mm, iterations=k)
    parts = {}
    outer_line = ink & near(O) & near(B)
    if cfg["kind"] == "plant":
        wall_inner = ink & near(B) & near(G | interior) & ~near(O)
        parts["wall"] = (B | outer_line | wall_inner) & ~interior
        memb = ink & near(interior) & near(G | B) & ~interior
        parts["membrane"] = ndi.binary_dilation(memb, iterations=1) & ~B & ~interior
    else:
        parts["membrane"] = (B | G | outer_line | (ink & near(B | G) & near(interior))) & ~interior | (ink & near(O) & cell)
    for name, specs in cfg["organelles"].items():
        m = np.zeros_like(ink)
        for cx, cy, R, amin, amax in specs:
            r = pick(lab, stats, cx, cy, R, amin, amax)
            R = np.pad(lab == r, 12)
            R = ndi.binary_fill_holes(ndi.binary_closing(R, iterations=8))[12:-12, 12:-12]
            m |= ndi.binary_dilation(R, iterations=4)
        parts[name] = m & cell
    if cfg.get("circles"):
        # bolitas sueltas: regiones casi circulares, pequeñas, en el citoplasma
        c = cfg["circles"]
        m = np.zeros_like(ink)
        taken = np.zeros_like(ink)
        for k2 in parts:
            if k2 not in ("membrane", "wall"):
                taken |= parts[k2]
        for r, ar, (cy, cx) in zip(idx, area, com):
            if not (c["amin"] <= ar <= c["amax"]) or r in oids:
                continue
            R = lab == r
            f = ndi.binary_fill_holes(R)
            if not cell[int(cy), int(cx)] or (taken & f).any():
                continue
            ys, xs = np.nonzero(f)
            h, w = np.ptp(ys) + 1, np.ptp(xs) + 1
            if not (0.75 < h / w < 1.33):
                continue
            fill_ratio = f.sum() / (np.pi * h * w / 4)
            if fill_ratio < 0.85:
                continue
            # anillo cerrado a su alrededor (línea del círculo): el contorno debe ser tinta
            ring = ndi.binary_dilation(f, iterations=6) & ~f
            if ink[ring].mean() < 0.35:
                continue
            m |= ndi.binary_dilation(f, iterations=4)
        parts[c["name"]] = (parts.get(c["name"], np.zeros_like(ink)) | m) & cell
    return a, ink, cell, parts

PAL = {"wall": (196, 120, 50), "membrane": (240, 80, 160), "chloroplast": (60, 170, 60), "nucleus": (140, 90, 220),
       "vacuole": (60, 150, 230), "mitochondria": (240, 170, 40), "vesicle": (120, 200, 220)}

if __name__ == "__main__":
    cfgs = json.load(open(sys.argv[1]))
    for k in sys.argv[2:]:
        cfg = cfgs[k]
        a, ink, cell, parts = build(cfg)
        rgb = np.stack([1 - a] * 3, -1) * 255
        for name in cfg["order"]:
            m = parts[name] if name in ("membrane", "wall") else parts[name] & ~ink
            rgb[m] = rgb[m] * 0.3 + np.array(PAL[name]) * 0.7
        Image.fromarray(rgb.astype(np.uint8)).save(f"out/parts_{k}.png")
        np.savez_compressed(f"out/parts_{k}.npz", **parts)
        print(k, {n2: int(parts[n2].sum()) for n2 in cfg["order"]})
