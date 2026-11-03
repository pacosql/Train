import json, sys
from PIL import Image
PDF = "work/pdf/"
OUT = sys.argv[1]
# página del PDF → recortes en coordenadas de la vista previa (ancho ≈1000)
CROPS = {
 2: {"p7-baby": (91, 716, 243, 848), "p7-giraffe": (267, 716, 419, 848), "p7-dog-family": (441, 716, 592, 848),
     "p7-plant-light": (614, 716, 767, 848), "p7-mushrooms": (790, 716, 943, 848), "p7-kingdoms": (85, 195, 475, 572)},
 3: {"c-flamingo": (150, 575, 235, 735), "c-fox": (138, 752, 250, 860), "c-seal": (130, 875, 258, 962),
     "c-tree": (340, 572, 450, 732), "c-flower": (362, 742, 428, 852), "c-succulent": (348, 868, 440, 962),
     "c-wave": (535, 572, 678, 668), "c-sun": (528, 696, 672, 830), "c-volcano": (525, 848, 682, 968),
     "c-bicycle": (728, 570, 875, 688), "c-balloon": (748, 710, 866, 848), "c-trainers": (728, 880, 886, 965),
     "p8-diagram": (88, 312, 918, 1003)},
 4: {"p9-beach": (95, 165, 662, 688), "p9-seagull": (120, 450, 245, 690), "p9-dog-butterfly": (425, 470, 535, 580),
     "p9-cat-kittens": (540, 556, 648, 618), "p9-family": (198, 312, 338, 422)},
 5: {"p10-microscope": (90, 485, 347, 666), "p10-algae": (380, 485, 636, 666), "p10-bacteria": (668, 485, 925, 666),
     "p10-orangutan": (90, 830, 492, 1057), "p10-girl": (527, 830, 925, 1057)},
 6: {"p11-plant-cell": (128, 284, 478, 636), "p11-animal-cell": (558, 284, 908, 628)},
 7: {"lv-plant-cell": (130, 262, 290, 422), "lv-plant-tissue": (138, 450, 290, 602), "lv-plant-organ": (148, 622, 268, 778),
     "lv-plant-system": (150, 795, 280, 975), "lv-plant-organism": (168, 1000, 268, 1185),
     "lv-animal-cell": (726, 262, 860, 428), "lv-animal-tissue": (730, 465, 882, 612), "lv-animal-organ": (750, 648, 848, 798),
     "lv-animal-system": (694, 822, 905, 995), "lv-animal-organism": (694, 1010, 910, 1182)},
 8: {"p13-kingdoms": (80, 250, 920, 1005), "k-plants": (128, 448, 350, 538), "k-animals": (415, 440, 640, 550),
     "k-fungi": (715, 455, 905, 575), "k-monera": (655, 682, 852, 815), "k-protists": (262, 812, 468, 958)},
 10: {"p15-yeast": (96, 382, 290, 507), "p15-bread": (312, 382, 506, 507), "p15-test1": (118, 755, 380, 898),
      "p15-test2": (395, 755, 655, 898), "p15-test3": (668, 755, 930, 898)},
 11: {"p16-egg": (116, 276, 367, 460), "p16-hares": (390, 276, 642, 460), "p16-sheep": (665, 276, 920, 460),
      "p16-horse": (116, 482, 367, 666), "p16-seeds": (390, 482, 642, 666), "p16-talking": (665, 482, 918, 666)},
 12: {"p17-mushrooms": (688, 1005, 955, 1185)},
 13: {"p18-summary": (95, 185, 915, 790)},
 14: {"p19-elephants": (125, 246, 297, 379), "p19-petri": (125, 395, 297, 527), "p19-child": (125, 543, 297, 675),
      "p19-mushrooms": (318, 246, 492, 379), "p19-cactus": (318, 395, 492, 527), "p19-flowers": (318, 543, 492, 675)},
}
import numpy as np
from PIL import ImageFilter, ImageDraw
BADGE = ("p7-baby", "p7-giraffe", "p7-dog-family", "p7-plant-light", "p7-mushrooms", "p15-yeast", "p15-bread",
         "p16-", "p19-")

def unbadge(im, f):
    """Difumina la etiqueta redonda (a, b, c…) de la esquina superior izquierda."""
    cx, cy, r = 21 * f, 21 * f, 14.5 * f
    a = np.asarray(im).astype(np.float32)
    H, W = a.shape[:2]
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.hypot(xx - cx, yy - cy)
    ring = (d > r * 1.35) & (d < r * 2.1)
    med = np.median(a[ring], axis=0)
    b = a.copy()
    b[d <= r * 1.3] = med
    bi = Image.fromarray(b.astype(np.uint8)).filter(ImageFilter.GaussianBlur(r * 0.45))
    bb = np.asarray(bi).astype(np.float32)
    w = np.clip((r * 1.9 - d) / (r * 0.6), 0, 1)[..., None]
    return Image.fromarray((a * (1 - w) + bb * w).astype(np.uint8))

from scipy import ndimage as ndi

def dedash(im):
    """Borra rayitas de líneas punteadas pegadas a los bordes izquierdo/derecho."""
    a = np.asarray(im).astype(np.float32)
    g = a.mean(2)
    dark = g < 170
    lab, n = ndi.label(dark)
    H, W = g.shape
    out = a.copy()
    for i, sl in enumerate(ndi.find_objects(lab)):
        ys, xs = sl
        h, w = ys.stop - ys.start, xs.stop - xs.start
        if h < 0.05 * H and w < 0.2 * W and w > 1.6 * h and (xs.start < 0.25 * W or xs.stop > 0.75 * W):
            m = ndi.binary_dilation(lab == i + 1, iterations=3)
            out[m] = 255
    return Image.fromarray(out.astype(np.uint8))

info = {}
for page, items in CROPS.items():
    v = Image.open(PDF + f"view-{page:02d}.jpg")
    full = Image.open(PDF + "img-%03d.jpg" % ((page - 1) * 2 + 1)).convert("RGB")
    f = full.size[0] / v.size[0]
    for name, (x0, y0, x1, y1) in items.items():
        im = full.crop((int(x0 * f), int(y0 * f), int(x1 * f), int(y1 * f)))
        if name.startswith(BADGE):
            im = unbadge(im, f)
        if name.startswith("lv-"):
            im = dedash(im)
        big = name.startswith(("p8-diagram", "p9-beach", "p13-kingdoms", "p18-summary", "p11-", "p7-kingdoms"))
        maxw = 1100 if big else 520
        if im.width > maxw:
            im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
        im.save(f"{OUT}/{name}.jpg", quality=84, optimize=True, progressive=True)
        info[name] = im.size
print(json.dumps(info))
