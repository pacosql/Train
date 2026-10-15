"""Metodología de puntuación de nombres (la de «📐 Buen nombre»).
Siete medidas de 0 a 10; el total es la media ponderada × 10.
Distintivo pesa la mitad (heredado de Nombre Mates, decisión de Paco 29/9): importa, pero un nombre
claro y memorable con algún vecino sigue siendo un buen nombre.
«escritura» (Paco, 15/10): se escribe bien en español Y en inglés. Query cuesta escribirlo a un
hispanohablante; Atlanta o Hello no. La calcula escritura() con reglas fijas, no a ojo.
"""
import re, unicodedata

MEDIDAS = ["corto", "facil", "memorable", "sugiere", "distintivo", "busqueda", "escritura"]
PESOS = {"corto": 1, "facil": 1, "memorable": 1, "sugiere": 1, "distintivo": 0.5, "busqueda": 1, "escritura": 1}

def total(notas):
    """notas: {medida: nota 0-10} → total 0-100 (solo con las medidas que haya)."""
    ks = [k for k in MEDIDAS if k in notas]
    return round(sum(PESOS[k] * notas[k] for k in ks) / (10 * sum(PESOS[k] for k in ks)) * 100)

# Colas de marca tan conocidas que no cuentan como dificultad.
COLAS = {"studio", "studios", "lab", "labs", "works"}
# (patrón, castigo, explicación) sobre cada palabra en minúsculas.
REGLAS = [
    (r"qu", 3.5, "«qu» (en español se lee «k»: Query → «keri»)"),
    (r"w", 1.5, "«w»"),
    (r"(?<!c)k", 1.0, "«k»"),
    (r"(?<=.)y", 1.5, "«y» como vocal"),
    (r"th|sh|ph|gh|ck|tion", 1.5, "grupo inglés (th, sh, ph, gh, ck, tion)"),
    (r"ee|oo|ea|ou|oa|ow|aw|ew|ey|ai|ay", 1.5, "vocales que en inglés suenan distinto (ee, oo, ea, ou, ai…)"),
    (r"[aeiou][bcdfgklmnpstvz]e$", 2.0, "«e» final muda en inglés (como Slate, Stroke)"),
    (r"ss|tt|pp|ff|mm|nn|dd|bb|gg|zz", 1.0, "consonante doble"),
    (r"j", 1.0, "«j» (suena distinto en cada idioma)"),
    (r"gue|gui|güe|güi", 1.0, "«gue/gui»"),
    (r"ñ", 3.0, "«ñ» (no existe en inglés)"),
    (r"[áéíóú]", 2.0, "tilde (en inglés se pierde)"),
]

def palabras(nombre):
    trozos = re.findall(r"[A-ZÁÉÍÓÚÑ]?[a-záéíóúñü]+|[A-ZÁÉÍÓÚÑ]+(?![a-z])", nombre) or [nombre]
    return [t.lower() for t in trozos]

def escritura(nombre):
    """→ (nota 0-10, por qué). 10 = se escribe como suena en los dos idiomas."""
    nota, fallos = 10.0, []
    for p in palabras(nombre):
        if p in COLAS: continue
        for pat, castigo, txt in REGLAS:
            n = len(re.findall(pat, p))
            if n:
                nota -= castigo * n
                fallos.append(f"{txt} en «{p}»")
    nota = max(0, round(nota))
    return nota, ("se escribe como suena en español y en inglés" if not fallos else "; ".join(fallos))
