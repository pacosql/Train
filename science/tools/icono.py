"""Iconos de Science: célula vegetal sobre verde (192, 512 y apple-touch)."""
import sys
from PIL import Image, ImageDraw
out = sys.argv[1]
S = 1024
im = Image.new("RGB", (S, S), "#2e9a6a")
d = ImageDraw.Draw(im)
cx, cy = S / 2, S / 2 + 10
import math
hexa = [(cx + 360 * math.cos(math.radians(a)), cy + 300 * math.sin(math.radians(a))) for a in range(0, 360, 60)]
d.polygon(hexa, fill="#cdeccf", outline="#1d3b2c", width=34)
inner = [(cx + 300 * math.cos(math.radians(a)), cy + 245 * math.sin(math.radians(a))) for a in range(0, 360, 60)]
d.polygon(inner, fill="#fbf7ef", outline="#1d3b2c", width=14)
d.ellipse([cx - 230, cy - 150, cx - 20, cy + 120], fill="#9cc9f5", outline="#1d3b2c", width=14)
d.ellipse([cx + 40, cy - 30, cx + 220, cy + 150], fill="#b79cf0", outline="#1d3b2c", width=16)
d.ellipse([cx + 105, cy + 35, cx + 155, cy + 85], fill="#7a52d6", outline="#1d3b2c", width=10)
for (x, y, w, h) in [(cx - 10, cy - 200, 120, 64), (cx + 120, cy - 150, 110, 60), (cx - 150, cy + 135, 120, 62)]:
    d.ellipse([x, y, x + w, y + h], fill="#4fb36b", outline="#1d3b2c", width=10)
for size, name in [(512, "icon-512.png"), (192, "icon-192.png"), (180, "apple-touch-icon.png")]:
    im.resize((size, size), Image.LANCZOS).save(f"{out}/{name}", optimize=True)
