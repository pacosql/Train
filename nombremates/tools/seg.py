"""Trocea un nombre pegado en palabras españolas: matesdediez -> mates de diez."""
import json, re, unicodedata, functools
def norm(s):
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]", " ", s)
# Diccionario español (636k formas) del paquete npm an-array-of-spanish-words.
# Se descarga la primera vez a una caché fuera del repo (pesa ~10 MB).
import os, subprocess, tempfile
def _diccionario():
    cache = os.path.join(tempfile.gettempdir(), "nombremates-dic.json")
    if not os.path.exists(cache):
        d = tempfile.mkdtemp()
        subprocess.run("npm pack an-array-of-spanish-words --silent && tar -xzf an-array-of-spanish-words-*.tgz package/index.json", shell=True, cwd=d, check=True, stdout=subprocess.DEVNULL)
        os.replace(os.path.join(d, "package", "index.json"), cache)
    return json.load(open(cache))
_W = {norm(w).strip() for w in _diccionario()}
EXTRA = "mates mate kids app pi saurio sauri nauta landia tron tic bum pum zas yupi chupi chachi chuli guay mola molan cole peque peques profe super mega max top pro go fun pop plus dino robo geo calcu numi cifri sumi ok ole hala tachan pispas zipizape tiquitaca tictac pimpam pim pam crack tangram sudoku".split()
_W |= set(EXTRA)
SHORT_OK = {"a","y","e","o","de","la","el","al","en","mi","tu","un","me","te","se","yo","su","lo","le","pi","ya","ni","si","oh","no","es","da","va","ve","ha","he","ok","mil","dos","uno","una","las","los","del","con","por","sin","mas","mis","tus","sus","que","hay","ven","dar","ser"}
@functools.lru_cache(None)
def _best(s):
    if not s: return (0, ())
    best = None
    for i in range(1, min(len(s), 20) + 1):
        w = s[:i]
        if w.isdigit():
            j = i
            while j < len(s) and s[j].isdigit(): j += 1
            if j != i: continue
            cost = 1
        elif w in _W and (len(w) >= 3 or w in SHORT_OK):
            cost = 1 + (0.6 if len(w) <= 3 and w not in SHORT_OK else 0)
        elif i == 1: cost = 3  # letra suelta desconocida
        else: continue
        r = _best(s[i:]); c = cost + r[0]
        if best is None or c < best[0]: best = (c, (w,) + r[1])
    return best
def segment(name):
    s = norm(name).replace(" ", "")
    parts = re.findall(r"\d+|[a-z]+", s)
    out = []
    for p in parts: out += list(_best(p)[1]) if not p.isdigit() else [p]
    return out
if __name__ == "__main__":
    for n in "Matesdediez Mellevouna Sumasaurio Numeronauta Pulpocho Cantatablas Ochotumbado Tachan10 Pruebadelnueve Cuentasdelavieja Hipopotamates Bocamayor Rumboal10 Eresel10 Matriculademates Profesor10demates Piensaunnumero Matessinllorar Sumagica Cocodrilomates".split():
        print(n, segment(n))
