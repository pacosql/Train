"""Carga base: bloques, sistemas educativos de España, cursos y catálogo de mecánicas.

Idempotente (upsert por código). Fuentes: LOMLOE/LOE (estructura de etapas y
edades), ISO 3166-2:ES (códigos) y el documento unificado (bloques, mecánicas).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from db import q, lit, arr  # noqa: E402


def fid(codigo):
    return q(f"select id from mates10_fuente where codigo={lit(codigo)}")[0]["id"]


DOC = fid("MATES10-DOC-UNIFICADO-1.1")
LOE = fid("BOE-LOE-2006")
ISO = fid("WIKI-ISO-3166-2-ES")

BLOQUES = [
    ("NUM", "numeración", "Números: leer, escribir, comparar", "numerico", 1),
    ("OPER", "operaciones", "Cuentas: sumar, restar, multiplicar, dividir", "numerico", 2),
    ("MED", "medida", "Medidas: longitud, peso, tiempo, dinero", "medida", 3),
    ("GEO", "geometría", "Formas, figuras y espacio", "espacial", 4),
    ("ALG", "álgebra", "Letras y ecuaciones", "algebraico", 5),
    ("FUN", "funciones", "Gráficas y funciones", "algebraico", 6),
    ("EST", "estadística y probabilidad", "Datos, gráficos y azar", "estocastico", 7),
    ("ANA", "análisis", "Límites, derivadas e integrales", "algebraico", 8),
    ("PROB", "problemas", "Problemas de enunciado", "transversal", 9),
]

# (código ISO, nombre, idioma de los nombres de curso)
SISTEMAS = [
    ("ES-AN", "Andalucía", "es"), ("ES-AR", "Aragón", "es"), ("ES-AS", "Principado de Asturias", "es"),
    ("ES-IB", "Illes Balears", "ca"), ("ES-CN", "Canarias", "es"), ("ES-CB", "Cantabria", "es"),
    ("ES-CL", "Castilla y León", "es"), ("ES-CM", "Castilla-La Mancha", "es"), ("ES-CT", "Cataluña", "ca"),
    ("ES-VC", "Comunitat Valenciana", "ca"), ("ES-EX", "Extremadura", "es"), ("ES-GA", "Galicia", "gl"),
    ("ES-MD", "Comunidad de Madrid", "es"), ("ES-MC", "Región de Murcia", "es"),
    ("ES-NC", "Comunidad Foral de Navarra", "es"), ("ES-PV", "País Vasco", "eu"), ("ES-RI", "La Rioja", "es"),
    ("ES-CE", "Ceuta", "es"), ("ES-ML", "Melilla", "es"),
]

CURSOS = [  # código, orden, edad, etapa, n
    ("PRI1", 1, 6, "primaria", 1), ("PRI2", 2, 7, "primaria", 2), ("PRI3", 3, 8, "primaria", 3),
    ("PRI4", 4, 9, "primaria", 4), ("PRI5", 5, 10, "primaria", 5), ("PRI6", 6, 11, "primaria", 6),
    ("ESO1", 7, 12, "secundaria", 1), ("ESO2", 8, 13, "secundaria", 2), ("ESO3", 9, 14, "secundaria", 3),
    ("ESO4", 10, 15, "secundaria", 4), ("BAC1", 11, 16, "bachillerato", 1), ("BAC2", 12, 17, "bachillerato", 2),
]


def nombre_local(lang, etapa, n):
    if lang == "es":
        return {"primaria": f"{n}º de Primaria", "secundaria": f"{n}º de ESO", "bachillerato": f"{n}º de Bachillerato"}[etapa]
    if lang == "ca":
        o = {1: "1r", 2: "2n", 3: "3r", 4: "4t", 5: "5è", 6: "6è"}[n]
        return {"primaria": f"{o} de Primària", "secundaria": f"{o} d'ESO", "bachillerato": f"{o} de Batxillerat"}[etapa]
    if lang == "gl":
        return {"primaria": f"{n}º de Educación Primaria", "secundaria": f"{n}º de ESO", "bachillerato": f"{n}º de Bacharelato"}[etapa]
    if lang == "eu":
        return {"primaria": f"Lehen Hezkuntzako {n}. maila", "secundaria": f"DBHko {n}. maila", "bachillerato": f"Batxilergoko {n}. maila"}[etapa]


# Catálogo de mecánicas del módulo 03. Solo OPCIONES está construida en esta entrega.
MECANICAS = [
    ("OPCIONES", "Opciones", "generica", "Cuatro opciones, una correcta; el niño toca la que cree buena. Sin tiempo.",
     ["opcion_multiple", "numerico", "verdadero_falso"], "sin_tiempo", "una", "reconocimiento", 5, 20, "baja",
     "al_fallar", ["texto_corto", "pasos_destapables", "ejemplo_resuelto"], True, "en_app"),
    ("GLOBOS", "Globos", "generica", "Las opciones suben en globos y hay que explotar la correcta antes de que se escape.",
     ["opcion_multiple", "numerico"], "con_tiempo", "una", "fluidez", 6, 60, "media", "al_terminar", ["texto_corto"], True, "idea"),
    ("TECLADO", "Teclado", "generica", "El niño escribe la respuesta con un teclado numérico.",
     ["numerico", "texto_corto"], "sin_tiempo", "una", "produccion", 6, 25, "media", "al_fallar",
     ["texto_corto", "pasos_destapables", "animacion_sobre_ejercicio"], True, "idea"),
    ("EMPAREJAR", "Emparejar", "generica", "Unir parejas (operación ↔ resultado).",
     ["emparejar", "opcion_multiple"], "sin_tiempo", "varias", "reconocimiento", 6, 45, "media", "al_terminar", ["texto_corto"], True, "idea"),
    ("RECTA", "Recta numérica", "generica", "Situar un número arrastrando sobre una recta.",
     ["recta_numerica"], "sin_tiempo", "una", "produccion", 6, 25, "media", "al_fallar", ["animacion_sobre_ejercicio"], True, "idea"),
    ("ORDENAR", "Ordenar", "generica", "Arrastrar elementos al orden correcto.",
     ["ordenar"], "sin_tiempo", "ordenar", "produccion", 6, 40, "media", "al_fallar", ["texto_corto"], True, "idea"),
    ("TARJETAS", "Tarjetas", "generica", "Tarjeta verdadero/falso que se desliza a un lado u otro.",
     ["verdadero_falso"], "ritmo_creciente", "una", "fluidez", 7, 10, "baja", "al_terminar", ["texto_corto"], True, "idea"),
    ("PAPEL", "Papel", "generica", "Hoja imprimible con ejercicios y solucionario.",
     ["numerico", "opcion_multiple", "verdadero_falso", "ordenar", "recta_numerica", "emparejar", "texto_corto", "abierto"],
     "sin_tiempo", "una", "produccion", 6, 600, "media", "al_terminar", ["ejemplo_resuelto"], False, "idea"),
    ("REPARTO", "Reparto", "especifica", "Repartir objetos en grupos iguales: representa la división.",
     ["reparto"], "sin_tiempo", "una", "produccion", 6, 40, "media", "nunca", [], True, "idea"),
    ("BALANZA", "Balanza", "especifica", "Equilibrar una balanza: representa la ecuación.",
     ["balanza"], "sin_tiempo", "una", "produccion", 10, 60, "alta", "nunca", [], True, "idea"),
    ("BLOQUES", "Bloques base 10", "especifica", "Bloques de unidades, decenas y centenas: representa la llevada.",
     ["numerico"], "sin_tiempo", "una", "produccion", 6, 60, "media", "nunca", ["animacion_sobre_ejercicio"], True, "idea"),
    ("PIZZA", "Pizza", "especifica", "Porciones de pizza: representa fracciones.",
     ["numerico", "opcion_multiple"], "sin_tiempo", "una", "produccion", 8, 40, "media", "nunca", ["animacion_sobre_ejercicio"], True, "idea"),
]


def main():
    vals = ",".join(f"({lit(c)},{lit(n)},{lit(p)},{lit(s)},{o})" for c, n, p, s, o in BLOQUES)
    q(f"""insert into mates10_bloque (codigo,nombre,nombre_padres,sentido_lomloe,orden) values {vals}
          on conflict (codigo) do update set nombre=excluded.nombre, nombre_padres=excluded.nombre_padres,
          sentido_lomloe=excluded.sentido_lomloe, orden=excluded.orden""")

    vals = ",".join(f"({lit(c)},'ES',{lit(n)},{lit(n)},'es-ES',{lit(ISO)})" for c, n, _ in SISTEMAS)
    q(f"""insert into mates10_sistema_educativo (codigo,pais,region,nombre,idioma,fuente_id) values {vals}
          on conflict (codigo) do update set nombre=excluded.nombre, region=excluded.region, fuente_id=excluded.fuente_id""")

    rows = []
    for c, _, lang in SISTEMAS:
        for cc, orden, edad, etapa, n in CURSOS:
            rows.append(f"((select id from mates10_sistema_educativo where codigo={lit(c)}),{lit(cc)},"
                        f"{lit(nombre_local(lang, etapa, n))},{orden},{edad},{lit(etapa)},{lit(LOE)})")
    q(f"""insert into mates10_curso (sistema_id,codigo,nombre_local,orden,edad_tipica,etapa,fuente_id) values {",".join(rows)}
          on conflict (sistema_id,codigo) do update set nombre_local=excluded.nombre_local, orden=excluded.orden,
          edad_tipica=excluded.edad_tipica, etapa=excluded.etapa, fuente_id=excluded.fuente_id""")

    rows = []
    for (cod, nom, tipo, desc, fmts, tiempo, resp, mide, edad, dur, carga, mom, forma, rein, est) in MECANICAS:
        rows.append(f"({lit(cod)},{lit(nom)},{lit(tipo)},{lit(desc)},{arr(fmts)},{lit(tiempo)},{lit(resp)},{lit(mide)},"
                    f"{edad},{dur},{lit(carga)},{lit(mom)},{arr(forma)},{lit(rein)},{lit(DOC)},{lit(est)})")
    q(f"""insert into mates10_mecanica (codigo,nombre,tipo,descripcion,formatos_admitidos,tiempo,respuestas_correctas,mide,
          edad_minima,duracion_tipica_seg,carga_cognitiva,momento_explicacion,forma_explicacion,reintento,fuente_id,estado)
          values {",".join(rows)} on conflict (codigo) do update set descripcion=excluded.descripcion,
          formatos_admitidos=excluded.formatos_admitidos, estado=excluded.estado""")

    q("insert into mates10_revisor (nombre) values ('Paco') on conflict do nothing")
    print(q("""select (select count(*) from mates10_bloque) bloques, (select count(*) from mates10_sistema_educativo) sistemas,
               (select count(*) from mates10_curso) cursos, (select count(*) from mates10_mecanica) mecanicas"""))


if __name__ == "__main__":
    main()
