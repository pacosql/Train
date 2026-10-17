"""Carga en nombreortografia_referencias las «🏛️ Otras marcas»: apps, webs y
marcas reales de ortografía, idiomas, escritura y preparación de exámenes
(EBAU, oposiciones): cómo resolvieron el nombre. Cada una con web, dominio
(para el logo) y la nota de Claude en las 6 medidas. Paco las clasifica en
👍 / 👎.

    SUPABASE_ACCESS_TOKEN=… python3 nombreortografia/tools/marcas.py

Sustituye las filas sin decidir; las que Paco ya ha clasificado se conservan.
"""
import json, os, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from medidas import MEDIDAS as M, total

# (nombre, dominio, sector, tipo, por qué, [(nota, motivo)×6: corto facil memorable sugiere distintivo busqueda])
R = [
("Duolingo", "duolingo.com", "App de idiomas · EE. UU.", "Fusión inventada",
 "Dúo + lingo: dice «lenguas» sin describir nada aburrido, y el búho verde hizo el resto. Prueba de que un nombre corto inventado con raíz reconocible puede comerse una categoría entera.",
 [(8,"8 letras, 4 sílabas"),(9,"Se dice igual en español e inglés"),(8,"Suena alegre; el búho ayuda"),(8,"«Lingo» = idioma"),(9,"Inventado: único"),(10,"Buscarlo lleva solo a ellos")]),
("Grammarly", "grammarly.com", "Corrector de escritura · EE. UU.", "Palabra + sufijo",
 "Grammar + -ly: dice exactamente lo que hace (gramática) con un sufijo que lo convierte en marca. Es el equivalente inglés más cercano a lo que buscas: escribir sin errores.",
 [(8,"9 letras, 3 sílabas"),(7,"En español se pronuncia raro"),(7,"Simpático, ligero"),(10,"Gramática: clarísimo"),(7,"Raíz común, sufijo lo hace suyo"),(9,"Lleva a ellos")]),
("LanguageTool", "languagetool.org", "Corrector multilingüe · Alemania", "Descriptivo",
 "Idioma + herramienta. Descriptivo puro: se entiende al instante pero no se recuerda ni emociona. Lo que pasa si llamas a la app «Ortografía Práctica».",
 [(5,"12 letras, 4 sílabas"),(8,"Palabras conocidas"),(4,"Ninguna imagen"),(9,"Dice qué hace"),(4,"Genérico"),(6,"Compite con la búsqueda genérica")]),
("Fundéu", "fundeu.es", "Fundación del Español Urgente · España", "Acrónimo",
 "La referencia en dudas del español. Acrónimo que se ha convertido en palabra: corto y único, pero solo lo entiende quien ya lo conoce. Tiene autoridad: lo que querría ser una app de ortografía seria.",
 [(10,"6 letras, 2 sílabas"),(6,"La tilde y la «u» final despistan"),(6,"Suena a institución"),(5,"No dice ortografía"),(9,"Único"),(9,"Lleva a ellos")]),
("WordReference", "wordreference.com", "Diccionarios y foros · EE. UU.", "Compuesto descriptivo",
 "Palabra + referencia: dice que es el sitio al que vas a consultar. Largo, pero se convirtió en verbo entre estudiantes («míralo en el WordReference»).",
 [(4,"13 letras, 5 sílabas"),(7,"En español se dice «uordreférens»"),(6,"Útil, no emocionante"),(9,"Consulta de palabras"),(6,"Palabras comunes, combinación única"),(9,"Lleva a ellos")]),
("OpositaTest", "opositatest.com", "Tests de oposiciones · España", "Verbo + palabra inglesa",
 "Directo al público de oposiciones: «oposita» + «test». Se entiende al momento en España y deja claro el formato (practicar con tests). Mismo público que tu app.",
 [(7,"11 letras, 5 sílabas"),(9,"Se escribe como suena"),(6,"Práctico, sin imagen"),(10,"Oposiciones + tests: exacto"),(6,"Descriptivo; fácil de imitar"),(8,"Lleva a ellos")]),
("Elevate", "elevateapp.com", "Entrenamiento de escritura y cálculo · EE. UU.", "Verbo aspiracional",
 "Una app de entrenar lengua y mates que se llama «elevar»: promete el resultado (mejorar), no la materia. Verbo real, por eso tuvieron que añadir «app» al dominio.",
 [(9,"7 letras, 3 sílabas"),(8,"Igual en los dos idiomas"),(6,"Subir de nivel"),(6,"Promete mejorar, no dice qué"),(4,"Palabra común"),(5,"Hay que añadir «app»")]),
("Lumosity", "lumosity.com", "Entrenamiento mental · EE. UU.", "Palabra inventada evocadora",
 "Lumen (luz) + -osity: suena a «luminosidad» sin serlo. Inventado pero con raíz que se intuye: idea de mente que se ilumina.",
 [(8,"8 letras, 4 sílabas"),(7,"En español se duda la pronunciación"),(7,"Luz, claridad"),(6,"Mente brillante"),(9,"Inventado"),(9,"Lleva a ellos")]),
("Memrise", "memrise.com", "App de idiomas · Reino Unido", "Fusión de dos palabras",
 "Memory + rise: memorizar y subir. Corto, se intuye y es suyo. Buen modelo para algo como «cero faltas»: fundir dos ideas en una palabra.",
 [(9,"7 letras, 2 sílabas"),(7,"En español «memrais» cuesta"),(7,"Memoria que crece"),(8,"Memorizar"),(9,"Único"),(9,"Lleva a ellos")]),
("Hemingway", "hemingwayapp.com", "Editor de estilo · EE. UU.", "Nombre propio de escritor",
 "Un editor que te hace escribir claro y se llama como el escritor de frases cortas. El nombre propio da prestigio y guiño, pero el .com no se puede tener.",
 [(7,"9 letras, 3 sílabas"),(6,"Se escribe mal a menudo"),(9,"Imagen clarísima"),(7,"Escribir bien, para quien lo pilla"),(5,"Es un apellido famoso"),(5,"Buscarlo da el escritor")]),
("Rubio", "rubio.net", "Cuadernos de ejercicios · España", "Apellido del fundador",
 "Los Cuadernos Rubio: generaciones de españoles practicaron caligrafía, cuentas y ortografía con ellos. Un apellido que pasó a significar «cuadernillo para practicar». La marca española de ejercicios por excelencia.",
 [(10,"5 letras, 2 sílabas"),(9,"Fácil"),(9,"Todo el mundo los recuerda"),(6,"Por historia, no por la palabra"),(5,"Palabra común"),(6,"Hay que añadir «cuadernos»")]),
("Anki", "ankiweb.net", "Tarjetas de memoria · Japón/Australia", "Palabra extranjera corta",
 "«Anki» es «memorizar» en japonés. Cuatro letras con significado oculto: corto, raro y adoptado por todos los opositores y estudiantes de medicina.",
 [(10,"4 letras, 2 sílabas"),(9,"Fácil"),(6,"Corto, sin imagen para un hispano"),(6,"Significa memorizar, si lo sabes"),(8,"Raro en español e inglés"),(7,"Comparte con otras cosas")]),
("Kahoot!", "kahoot.com", "Juegos de preguntas en clase · Noruega", "Expresión juguetona",
 "Viene de «in cahoots» (compinchados). Suena a grito de juego, con exclamación incluida. Todos los alumnos de la EBAU lo conocen de clase.",
 [(9,"6 letras, 2 sílabas"),(7,"La k y la h despistan"),(9,"Suena a fiesta"),(5,"Juego, no dice qué"),(9,"Único"),(9,"Lleva a ellos")]),
("Testeando", "testeando.es", "Tests educativos · España", "Verbo en gerundio",
 "Web española de tests por asignaturas. El gerundio da acción: estás practicando ahora. Descriptivo y amable, pero genérico.",
 [(8,"9 letras, 4 sílabas"),(9,"Se escribe como suena"),(5,"Sin imagen"),(8,"Practicar con tests"),(4,"Palabra común"),(5,"Se mezcla con la búsqueda genérica")]),
]

def q(sql):
    r = urllib.request.Request("https://api.supabase.com/v1/projects/dzlhsdpgyxnjwudmrnul/database/query",
        data=json.dumps({"query": sql}).encode(), method="POST",
        headers={"Authorization": "Bearer " + os.environ["SUPABASE_ACCESS_TOKEN"], "Content-Type": "application/json", "User-Agent": "curl/8"})
    return json.load(urllib.request.urlopen(r, timeout=60))

def lit(v): return "null" if v is None else "'" + str(v).replace("'", "''") + "'"

q("alter table public.nombreortografia_referencias add column if not exists web text, add column if not exists dominio text;"
  " delete from public.nombreortografia_referencias where decision is null;")
filas = []
for i, (n, dom, sector, tipo, pq, ms) in enumerate(R, 1):
    med = {k: {"nota": a, "por_que": b} for k, (a, b) in zip(M, ms)}
    tot = total({k: a for k, (a, _) in zip(M, ms)})
    filas.append(f"({i},{lit(n)},{lit(sector)},{lit(tipo)},{lit(pq)},{lit(json.dumps(med, ensure_ascii=False))}::jsonb,{tot},{lit('https://' + dom)},{lit(dom)})")
q("insert into public.nombreortografia_referencias (orden,nombre,sector,tipo,por_que,medidas,total,web,dominio) values " + ",".join(filas) +
  " on conflict (nombre) do update set orden=excluded.orden, sector=excluded.sector, tipo=excluded.tipo, por_que=excluded.por_que, medidas=excluded.medidas, total=excluded.total, web=excluded.web, dominio=excluded.dominio")
print(len(R), "marcas cargadas")
