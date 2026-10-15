"""Receta al azar para las pasadas sin marcas nuevas (petición de Paco, 14/10).

Si no hay nada que atender, la rutina no se queda esperando: hace una tanda
corta (15-20 nombres) siguiendo una receta elegida al azar, para que salgan
cosas nuevas. Mezcla una forma de crear, palabras al azar y uno de sus ⭐ como
ancla de gusto.

    python3 empresa/tools/azar.py          # imprime la receta de esta pasada
"""
import json, random, re, sys, urllib.request
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from cribar import sb_all

FORMAS = [
    "Dos palabras inglesas reales que juntas cuenten algo (como ForwardQuery: verbo/dirección + objeto)",
    # Quitada 14/10: «inglés + español» → Paco rechazó casi toda la tanda 36.
    "Metáfora de un oficio antiguo (imprenta, cartografía, carpintería) en una o dos palabras",
    "Nombre de lugar, río o accidente geográfico que suene bien en inglés y español",
    "Palabra corta inventada a partir de dos raíces latinas o griegas (como Lexix, Folon)",
    "Algo que se hace al aprender (preguntar, apuntar, subrayar, contar) convertido en marca",
    "Un objeto cotidiano de un escritorio o un taller + Labs/Works/Studio",
    "Una palabra que describa avanzar o descubrir + una palabra de los ⭐ de Paco",
    "Pareja inesperada: algo de la naturaleza + algo del pensamiento",
    "Una palabra inglesa con doble sentido (como Query, Trail, Forward)",
]

def main():
    rnd = random.Random()
    # Se lee el texto de palabras.py en vez de importarlo: importarlo vuelve a sembrar la tabla.
    src = open(__file__.rsplit("/", 1)[0] + "/palabras.py", encoding="utf8").read()
    sug = re.search(r'SUGERIDAS = """(.*?)"""', src, re.S).group(1)
    palabras = [x.split(":")[0].strip() for x in sug.replace("\n", "").split("|") if ":" in x]
    favs = [r["nombre"] for r in sb_all("empresa_ideas?select=nombre&status=eq.favorito")]
    pend = sb_all("empresa_ideas?select=id&status=eq.pendiente&score=gte.70&orden=lt.100000")
    print(f"Pendientes buenos sin revisar: {len(pend)}" + ("  → hay de sobra, NO hagas tanda al azar" if len(pend) >= 60 else ""))
    print("Forma:", rnd.choice(FORMAS))
    print("Palabras al azar:", ", ".join(rnd.sample(palabras, 4)))
    if favs: print("Ancla (un ⭐ de Paco):", rnd.choice(favs))

if __name__ == "__main__":
    main()
