"""Carga en empresa_referencias las «🏛️ Otras marcas»: venture studios y
empresas paraguas reales que estuvieron en una situación parecida a la de
Paco (una matriz que firma varias apps o productos, a menudo con un nombre
distinto del de sus apps). Cada una con web, dominio (para el logo) y la
nota de Claude en las 6 medidas. Paco las clasifica en 👍 / 👎.

    SUPABASE_ACCESS_TOKEN=… python3 empresa/tools/marcas.py

Sustituye las filas sin decidir; las que Paco ya ha clasificado se conservan.
"""
import json, os, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from medidas import MEDIDAS as M, total

# (nombre, dominio, sector, tipo, por qué, [(nota, motivo)×6: corto facil memorable sugiere distintivo busqueda])
R = [
("Alphabet", "abc.xyz", "Matriz de Google · EE. UU.", "Palabra real abstracta",
 "La matriz paraguas por excelencia: se creó en 2015 para colgar de ella Google y el resto de proyectos. Un nombre que no dice nada concreto a propósito, para que quepa cualquier cosa, y con guiño (alpha-bet: apostar por lo mejor). El dominio abc.xyz demuestra que la matriz no necesita un .com bonito.",
 [(8,"8 letras, 3 sílabas"),(9,"Palabra conocida en todo el mundo"),(7,"El abecedario: letras, aprender"),(6,"Paraguas: cabe todo; guiño a la apuesta"),(4,"Palabra común; solo funciona por ser quien es"),(4,"Buscarlo da el abecedario")]),
("Bending Spoons", "bendingspoons.com", "Estudio de apps · Italia", "Frase visual",
 "Una de las empresas de apps más grandes de Europa (dueña de Remini, Splice o Evernote) y su nombre no dice «apps» en ningún sitio: es una imagen rara y simpática, doblar cucharas. Sale como desarrollador debajo de marcas que no se le parecen. Exactamente tu caso.",
 [(5,"13 letras, 4 sílabas"),(7,"Fácil en inglés, en español hay que traducirlo"),(9,"Imagen imposible de olvidar"),(5,"Ingenio, hacer lo imposible; no dice apps"),(9,"Nadie más se llama así"),(9,"Buscarlo lleva a ellos")]),
("Lesson Nine", "babbel.com", "Matriz legal de Babbel · Alemania", "Frase neutra",
 "La sociedad que firma Babbel se llama Lesson Nine GmbH: un nombre de matriz sobrio que nadie ve, mientras la marca de la app hace el trabajo. Sugiere educación (lección) sin atarse a un idioma.",
 [(7,"10 letras, 3 sílabas"),(8,"Se entiende en inglés y se lee bien en español"),(6,"«Lección nueve»: curioso"),(8,"Dice aprender sin atarse a una materia"),(7,"Frase común, pero rara como empresa"),(5,"Poco buscado: vive escondido")]),
("Monkimun", "lingokids.com", "Matriz de Lingokids · Madrid", "Inventada juguetona",
 "La empresa madrileña detrás de Lingokids empezó como Monkimun: mono + mundo, un nombre inventado, infantil y registrable. Ejemplo español de matriz con nombre distinto de su app estrella.",
 [(9,"8 letras, 3 sílabas"),(7,"Se escribe como suena, pero dudas con la n/m"),(7,"Un mono: imagen infantil"),(5,"Juego y niños, no dice aprender"),(9,"Inventado: único"),(8,"Buscarlo lleva a ellos")]),
("Toca Boca", "tocaboca.com", "Estudio de apps infantiles · Suecia", "Palabras juguetonas con rima",
 "Estudio sueco de apps para niños con nombre que suena a juego en español y en inglés: dos palabras que riman. Suena a jugar, no a empresa, y aun así es una compañía seria.",
 [(9,"8 letras, 4 sílabas"),(8,"Se dice solo"),(9,"La rima se queda"),(7,"Juego infantil"),(8,"Único en su sector"),(8,"Buscarlo lleva a ellos")]),
("Sago Mini", "sagomini.com", "Estudio de apps infantiles · Canadá", "Palabra + mini",
 "Apps para los más pequeños. «Mini» deja claro el público y «Sago» es una palabra rara y suave. Funciona como marca de juego, menos como matriz de varias cosas.",
 [(9,"8 letras, 4 sílabas"),(8,"Fácil"),(6,"Algo de imagen"),(6,"Mini = niños pequeños"),(8,"Raro y registrable"),(8,"Lleva a ellos")]),
("Tinybop", "tinybop.com", "Estudio de apps educativas · EE. UU.", "Fusión inventada",
 "Apps de ciencia y exploración para niños. Tiny + bop: pequeño y con ritmo. Una palabra inventada, corta, con sonido alegre: muy buen modelo para tu caso.",
 [(10,"7 letras, 2 sílabas"),(8,"Se escribe como suena en inglés; en español se lee bien"),(7,"Sonido alegre"),(6,"Pequeño y juego; no dice aprender"),(9,"Inventado"),(9,"Lleva a ellos")]),
("Duck Duck Moose", "duckduckmoose.com", "Estudio de apps educativas · EE. UU.", "Juego de palabras infantil",
 "Clásico de las apps educativas (luego comprado por Khan Academy). Parodia del juego «duck duck goose»: divertido pero largo y muy anglosajón.",
 [(5,"13 letras, 3 palabras"),(6,"En español no se capta el juego"),(8,"Imagen de animales"),(6,"Juego infantil"),(8,"Único"),(7,"Lleva a ellos")]),
("Originator", "originatorkids.com", "Estudio de apps educativas · EE. UU.", "Palabra real",
 "Los de Endless Alphabet. «El que origina»: suena a creador de productos, vale para cualquier app. Tuvieron que añadir «kids» al dominio.",
 [(7,"10 letras, 5 sílabas"),(8,"Se entiende en los dos idiomas"),(5,"Abstracto"),(7,"Crear, originar productos"),(5,"Palabra común"),(4,"Mucho ruido")]),
("Idealab", "idealab.com", "Primer startup studio · EE. UU. (1996)", "Compuesto descriptivo",
 "El abuelo de los venture studios. Idea + lab: dice exactamente lo que hace, y es tan antiguo que pudo quedarse el .com. Hoy un nombre así estaría cogido.",
 [(9,"7 letras, 4 sílabas"),(9,"Fácil en los dos idiomas"),(6,"Poca imagen"),(9,"Laboratorio de ideas: dice qué es"),(5,"Muy descriptivo"),(7,"Lleva a ellos por antigüedad")]),
("Betaworks", "betaworks.com", "Venture studio · Nueva York", "Compuesto técnico",
 "Beta (versión de pruebas) + works (taller): un taller donde todo está en beta. Muy de mundo tech, entendible en español.",
 [(8,"9 letras, 3 sílabas"),(8,"Fácil"),(6,"Algo de imagen"),(8,"Construir y probar productos"),(7,"Beta es común"),(7,"Lleva a ellos")]),
("Science Inc.", "science-inc.com", "Venture studio · Los Ángeles", "Palabra real enorme",
 "Llamarse «Ciencia» es audaz: suena a método y experimentos. Pero es tan genérico que tuvieron que usar un dominio con guion.",
 [(9,"7 letras"),(9,"Fácil"),(5,"Abstracto"),(7,"Método, experimentar"),(3,"Genérico"),(2,"Imposible de buscar")]),
("Expa", "expa.com", "Venture studio · San Francisco", "Palabra corta inventada",
 "El estudio de Garrett Camp (cofundador de Uber). Cuatro letras, sugiere expandir y experimentar. Corto, serio y vale para todo.",
 [(10,"4 letras, 2 sílabas"),(9,"Se dice igual en los dos idiomas"),(5,"Abstracto"),(7,"Expandir, explorar"),(7,"Corto y raro"),(6,"Compite con otras «expa»")]),
("Atomic", "atomic.vc", "Venture studio · EE. UU.", "Palabra real con fuerza",
 "Átomo: lo pequeño que lo construye todo, con energía. Dominio .vc porque el .com estaba cogido: otra pista de que la matriz no necesita el .com perfecto.",
 [(10,"6 letras, 3 sílabas"),(9,"Fácil"),(7,"Energía"),(6,"Construir desde lo pequeño"),(4,"Palabra muy usada"),(4,"Mucho ruido")]),
("Pioneer Square Labs", "psl.com", "Venture studio · Seattle", "Lugar + labs",
 "Toma el nombre de su barrio de Seattle. Largo, por eso todo el mundo dice PSL. Lugar + labs es un patrón muy de venture studio.",
 [(3,"17 letras, 3 palabras"),(7,"Fácil en inglés"),(6,"Pionero"),(7,"Pioneros que construyen"),(7,"Único por el lugar"),(6,"Lleva a ellos")]),
("High Alpha", "highalpha.com", "Venture studio · Indianápolis", "Término financiero",
 "Alpha es el rendimiento por encima del mercado: suena a ganar. Muy de inversores, frío para una app infantil.",
 [(8,"9 letras, 3 sílabas"),(8,"Fácil"),(5,"Abstracto"),(6,"Éxito, inversión"),(6,"Alpha muy usado"),(6,"Algo de ruido")]),
("Hexa", "hexa.com", "Venture studio · París (antes eFounders)", "Palabra corta griega",
 "eFounders se rebautizó Hexa: seis, el hexágono de la colmena, piezas que encajan. Corto, internacional, con .com de cuatro letras.",
 [(10,"4 letras, 2 sílabas"),(9,"Igual en los dos idiomas"),(7,"El hexágono, la colmena"),(7,"Piezas que encajan: varias empresas"),(6,"Corto y usado"),(6,"Algo de ruido")]),
("Rocket Internet", "rocket-internet.com", "Constructor de empresas · Berlín", "Imagen + sector",
 "Un cohete: velocidad y escalar. «Internet» ata a una época; es el ejemplo de lo que envejece mal.",
 [(5,"14 letras"),(8,"Fácil"),(8,"Cohete"),(7,"Crecer rápido"),(5,"Rocket muy usado"),(6,"Lleva a ellos")]),
("Founders Factory", "foundersfactory.com", "Venture studio · Londres", "Aliteración descriptiva",
 "Fábrica de fundadores: dice qué hace y la doble F se recuerda. Largo pero claro.",
 [(4,"15 letras, 2 palabras"),(8,"Fácil en inglés"),(7,"La aliteración ayuda"),(9,"Dice qué hace"),(5,"Descriptivo"),(7,"Lleva a ellos")]),
("Prehype", "prehype.com", "Venture studio · Nueva York", "Palabra inventada",
 "Antes del bombo: construir antes de que nadie hable de ti. Una palabra, ingeniosa, .com propio.",
 [(9,"7 letras, 2 sílabas"),(7,"En español la «hype» cuesta"),(6,"Ingenioso"),(7,"Empezar pronto"),(9,"Único"),(8,"Lleva a ellos")]),
("Wilbur Labs", "wilburlabs.com", "Venture studio · San Francisco", "Nombre propio + labs",
 "Nombre de persona (como un abuelo inventor) + labs: cálido y técnico a la vez. Patrón «nombre + labs» muy usado en estudios.",
 [(8,"10 letras, 3 sílabas"),(7,"Wilbur en español suena raro"),(7,"Una persona"),(6,"Labs: crear"),(8,"Único"),(7,"Lleva a ellos")]),
("Nuclio", "nuclio.com", "Venture builder · Barcelona", "Palabra modificada",
 "Núcleo convertido en marca: el centro del que salen varias empresas. Español, corto, internacional. Muy cerca de lo que buscas.",
 [(10,"6 letras, 3 sílabas"),(8,"Se lee bien en los dos idiomas"),(6,"Núcleo, centro"),(8,"La matriz de la que salen empresas"),(7,"Raro, pero parecido a «nucleo»"),(7,"Lleva a ellos")]),
("Bcombinator", "bcombinator.com", "Venture builder · Barcelona", "Juego con Y Combinator",
 "B de Barcelona + combinator, guiño a Y Combinator. Ingenioso para el sector; difícil de decir y deudor de otra marca.",
 [(6,"11 letras"),(6,"«Be-combinator» confunde"),(6,"El guiño se pilla"),(8,"Dice venture"),(4,"Copia un patrón famoso"),(6,"Se confunde con YC")]),
("Supercell", "supercell.com", "Estudio de juegos · Finlandia", "Palabra real científica",
 "La supercélula es la tormenta más potente; también evoca células pequeñas que forman algo grande (sus equipos son «células»). Corto, potente, internacional.",
 [(9,"9 letras, 3 sílabas"),(9,"Fácil"),(8,"Tormenta, energía"),(7,"Equipos pequeños, gran resultado"),(7,"Palabra real, poco usada en empresas"),(7,"Compite con la meteorología")]),
("Voodoo", "voodoo.io", "Estudio de juegos móviles · París", "Palabra real con misterio",
 "Desarrollador de juegos hipercasuales. Magia y atrevimiento; dominio .io. Para apps educativas sería polémico.",
 [(10,"6 letras"),(9,"Fácil"),(9,"Muy evocador"),(4,"Magia, no educación"),(5,"Puede molestar"),(5,"Ruido")]),
("Rovio", "rovio.com", "Estudio de juegos · Finlandia", "Palabra finlandesa",
 "Los de Angry Birds. En finés «rovio» es una hoguera. Para el resto del mundo es una palabra inventada, corta y alegre: perfecta para firmar apps.",
 [(10,"5 letras, 2 sílabas"),(9,"Se dice igual en todo el mundo"),(6,"Suena alegre"),(5,"No dice nada; lo da la historia"),(9,"Único"),(9,"Lleva a ellos")]),
("Blue Origin", "blueorigin.com", "Empresa espacial · EE. UU.", "Blue + palabra",
 "Ejemplo «Blue» que te gusta: el planeta azul como origen. Blue + una palabra con sentido (origen) da un nombre serio y evocador.",
 [(8,"10 letras"),(9,"Fácil"),(8,"El planeta azul"),(6,"Origen, empezar"),(7,"Blue es común"),(7,"Lleva a ellos")]),
("Bluesky", "bsky.app", "Red social · EE. UU.", "Blue + palabra fusionada",
 "Blue + sky en una palabra, y en inglés «blue sky thinking» es pensar sin límites. Muy bueno, pero el .com no era suyo: usan bsky.app.",
 [(10,"7 letras"),(9,"Fácil"),(8,"Cielo azul"),(6,"Pensar en grande"),(4,"Expresión común"),(4,"Mucho ruido")]),
("Blue Bottle", "bluebottlecoffee.com", "Cafeterías · EE. UU.", "Blue + objeto",
 "Blue + un objeto concreto (la botella) da imagen inmediata. Tuvieron que añadir «coffee» al dominio: el patrón Blue + objeto suele tener el .com cogido.",
 [(8,"10 letras"),(9,"Fácil"),(9,"Botella azul"),(3,"No dice café"),(6,"Blue + objeto, frecuente"),(6,"Necesita «coffee»")]),
("Blue Yonder", "blueyonder.com", "Software de logística · EE. UU.", "Expresión inglesa",
 "«Into the wild blue yonder»: hacia el horizonte azul. Evocador y con aire de viaje; en español no se entiende la expresión.",
 [(7,"10 letras"),(6,"En español «yonder» se pronuncia mal"),(7,"Horizonte"),(5,"Viaje, futuro"),(7,"Expresión con dueño claro"),(7,"Lleva a ellos")]),
]

def q(sql):
    r = urllib.request.Request("https://api.supabase.com/v1/projects/dzlhsdpgyxnjwudmrnul/database/query",
        data=json.dumps({"query": sql}).encode(), method="POST",
        headers={"Authorization": "Bearer " + os.environ["SUPABASE_ACCESS_TOKEN"], "Content-Type": "application/json", "User-Agent": "curl/8"})
    return json.load(urllib.request.urlopen(r, timeout=60))

def lit(v): return "null" if v is None else "'" + str(v).replace("'", "''") + "'"

q("alter table public.empresa_referencias add column if not exists web text, add column if not exists dominio text;"
  " delete from public.empresa_referencias where decision is null;")
filas = []
for i, (n, dom, sector, tipo, pq, ms) in enumerate(R, 1):
    med = {k: {"nota": a, "por_que": b} for k, (a, b) in zip(M, ms)}
    tot = total({k: a for k, (a, _) in zip(M, ms)})
    filas.append(f"({i},{lit(n)},{lit(sector)},{lit(tipo)},{lit(pq)},{lit(json.dumps(med, ensure_ascii=False))}::jsonb,{tot},{lit('https://' + dom)},{lit(dom)})")
q("insert into public.empresa_referencias (orden,nombre,sector,tipo,por_que,medidas,total,web,dominio) values " + ",".join(filas) +
  " on conflict (nombre) do update set orden=excluded.orden, sector=excluded.sector, tipo=excluded.tipo, por_que=excluded.por_que, medidas=excluded.medidas, total=excluded.total, web=excluded.web, dominio=excluded.dominio")
print(len(R), "marcas cargadas")
