"""Combina las palabras que Paco ha marcado en «💡 Palabras» y escribe un
fichero de candidatos para cribar.py (formato Nombre|por qué|notas).

    python3 empresa/tools/combinar.py [salida.txt] [--max 400]

- A+B (Azulfox) y A+B+Studio (AzulfoxStudio) con todas las parejas.
- Las palabras recién elegidas van primero (más peso a lo último que marcó).
- Las notas son una base (corto según longitud); ajusta a mano si quieres.
"""
import itertools, json, os, re, sys, urllib.request
AQUI = os.path.dirname(os.path.abspath(__file__))
K = re.search(r"eyJ[^\"']+", open(os.path.join(AQUI, "..", "config.js")).read()).group(0)
URL = "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1/empresa_palabras?status=eq.me_gusta&select=palabra&order=decidido_at.desc.nullslast"
H = {"apikey": K, "Authorization": "Bearer " + K}
SUFIJOS = {"studio", "lab", "labs", "works"}

def c_of(n):
    l = len(n); return 10 if l <= 6 else 9 if l <= 8 else 8 if l <= 10 else 6 if l <= 12 else 5 if l <= 14 else 3

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    salida = args[0] if args else os.path.join(AQUI, "out", "candidatos.txt")
    mx = int(sys.argv[sys.argv.index("--max") + 1]) if "--max" in sys.argv else 400
    pal = [r["palabra"].strip().replace(" ", "") for r in json.load(urllib.request.urlopen(urllib.request.Request(URL, headers=H)))]
    pal = [p[:1].upper() + p[1:].lower() for p in pal if p]
    base = [p for p in pal if p.lower() not in SUFIJOS]
    sufs = [p for p in pal if p.lower() in SUFIJOS] or ["Studio"]
    out, vistos = ["# familia: 💡 Combinación de tus palabras"], set()
    for a, b in itertools.permutations(base, 2):
        for n in (a + b.lower(), a + b.lower() + sufs[0]):
            if n.lower() in vistos or len(n) > 18: continue
            vistos.add(n.lower())
            out.append(f"{n}|{a} + {b}: dos palabras que elegiste en 💡 Palabras|{c_of(n)} 8 7 8 8 8")
            if len(out) > mx: break
        if len(out) > mx: break
    open(salida, "w", encoding="utf8").write("\n".join(out) + "\n")
    print(f"{len(out) - 1} combinaciones de {len(base)} palabras → {salida}")

if __name__ == "__main__":
    main()
