import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
OUT = sys.argv[1]
BOX = {
 "c_animals": {"flamingo": (70, 90, 295, 338), "fox": (30, 285, 330, 490), "seal": (18, 492, 350, 676)},
 "c_plants": {"tree": (58, 95, 370, 348), "flower": (128, 348, 297, 524), "succulent": (68, 518, 355, 695)},
 "c_natural": {"wave": (16, 92, 362, 292), "sun": (56, 292, 308, 500), "volcano": (16, 486, 362, 715)},
 "c_artificial": {"bicycle": (10, 100, 356, 328), "balloon": (86, 318, 362, 582), "trainers": (15, 522, 358, 708)},
 "v_nutrition": {"dog-eats": (20, 312, 310, 600), "rabbit-drinks": (300, 305, 600, 600), "plant-sun": (10, 630, 335, 1005), "fish": (298, 718, 600, 1012)},
 "v_interaction": {"dog-butterfly": (14, 325, 342, 640), "sunflower-sun": (272, 326, 580, 655, "left"), "cat": (15, 732, 262, 1075), "chameleon": (215, 740, 580, 1060)},
 "v_reproduction": {"dog-puppies": (12, 318, 326, 615), "hen-chicks": (318, 312, 649, 615), "turtle": (15, 690, 315, 1020), "sunflower-seeds": (305, 698, 649, 1020)},
}
SRC = "work/out/col_{}.png"
res = {}
for col, items in BOX.items():
    im = np.asarray(Image.open(SRC.format(col)).convert("L")).astype(np.float32) / 255
    H, W = im.shape
    for name, box in items.items():
        x0, y0, x1, y1 = box[:4]
        sides = box[4] if len(box) > 4 else "top,bottom,left,right"
        x0, y0, x1, y1 = max(0, x0), max(0, y0), min(W, x1), min(H, y1)
        a = 1 - im[y0:y1, x0:x1].copy()
        # líneas rectas del marco de la columna pegadas a los bordes del recorte
        h_, w_ = a.shape
        for band in (slice(0, 16), slice(w_ - 16, w_)):
            cols = (a[:, band] > 0.3).mean(0)
            for j, f in zip(range(band.start, band.stop), cols):
                if f > 0.45:
                    a[:, max(0, j - 2):j + 3] = 0
        for band in (slice(0, 16), slice(h_ - 16, h_)):
            rows = (a[band, :] > 0.3).mean(1)
            for j, f in zip(range(band.start, band.stop), rows):
                if f > 0.45:
                    a[max(0, j - 2):j + 3, :] = 0
        m = a > 0.3
        g = ndi.binary_dilation(m, iterations=3)
        lab, n = ndi.label(g)
        if n == 0:
            continue
        sizes = ndi.sum(np.ones_like(lab), lab, range(1, n + 1))
        big = 1 + int(np.argmax(sizes))
        edges = {"top": lab[0], "bottom": lab[-1], "left": lab[:, 0], "right": lab[:, -1]}
        border = set(np.unique(np.concatenate([edges[k] for k in sides.split(",")]))) - {0}
        keep = np.zeros_like(m)
        for i in range(1, n + 1):
            if i == big or (i not in border):
                keep |= lab == i
        keep = ndi.binary_dilation(keep, iterations=2)
        a = np.where(keep, a, 0)
        ys, xs = np.nonzero(a > 0.3)
        cx0, cx1, cy0, cy1 = max(0, xs.min() - 8), min(a.shape[1], xs.max() + 9), max(0, ys.min() - 8), min(a.shape[0], ys.max() + 9)
        a = a[cy0:cy1, cx0:cx1]
        out = Image.fromarray(((1 - a) * 255).astype(np.uint8), "L")
        out.save(f"{OUT}/{name}.png", optimize=True)
        res[name] = out.size
print(json.dumps(res))
