"""Metodología de puntuación de nombres (la de «📐 Buen nombre»).
Seis medidas de 0 a 10; el total es la media ponderada × 10.
Distintivo pesa la mitad (heredado de Nombre Mates, decisión de Paco 29/9): importa, pero un nombre
claro y memorable con algún vecino sigue siendo un buen nombre.
"""
MEDIDAS = ["corto", "facil", "memorable", "sugiere", "distintivo", "busqueda"]
PESOS = {"corto": 1, "facil": 1, "memorable": 1, "sugiere": 1, "distintivo": 0.5, "busqueda": 1}

def total(notas):
    """notas: {medida: nota 0-10} → total 0-100."""
    return round(sum(PESOS[k] * notas[k] for k in MEDIDAS) / (10 * sum(PESOS.values())) * 100)
