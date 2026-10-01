"""Carga en nombremates_referencias los 25 nombres de marca de referencia
(para calibrar con Paco qué es un buen nombre). Medidas 0-10:
corto, facil (decir y escribir), memorable (imagen y emoción), sugiere (dice
o insinúa qué hace), distintivo (registrable, sin choques ni polémica) y
busqueda (SEO: que te encuentren y que buscarlo lleve a ti).
Uso: SUPABASE_ACCESS_TOKEN=… python3 nombremates/tools/referencias.py
"""
import json, os, sys, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from medidas import total as total_ponderado

M = ["corto", "facil", "memorable", "sugiere", "distintivo", "busqueda"]
R = [
("Apple","Ordenadores y móviles","Palabra real sin relación con el producto",
 "Una palabra que conoce cualquier niño del mundo, con una imagen clarísima (la manzana), puesta a algo tan frío como un ordenador. Ese contraste la hizo cálida y fácil de recordar. Demuestra que un nombre no tiene que describir el producto si es muy corto y visual.",
 [(10,"5 letras, 2 sílabas"),(10,"Se dice y se escribe igual en todo el mundo"),(10,"Imagen inmediata: una manzana"),(2,"No dice nada de ordenadores"),(9,"Palabra común, pero única en su sector"),(5,"Compite con la fruta; necesitó muchísima marca")]),
("Google","Buscador","Palabra inventada a partir de una real",
 "Viene de «googol», el número 1 seguido de 100 ceros: la cantidad de información que querían ordenar. Suena divertido por la doble o y la repetición de sonidos. Es tan único que se ha convertido en verbo.",
 [(9,"6 letras, 2 sílabas"),(8,"Se escribe distinto a googol, pero como suena"),(9,"Sonido alegre y repetitivo, casi infantil"),(4,"Solo sugiere «muchísimo» si conoces el googol"),(10,"Único en el mundo, hoy es un verbo"),(7,"Buscarlo lleva a ellos, pero no dice «buscador»")]),
("Amazon","Tienda online","Palabra real evocadora",
 "El río más caudaloso del mundo para la tienda con el catálogo más grande del mundo. Empieza por A (salía primero en las listas) y la flecha del logo va de la A a la Z.",
 [(8,"6 letras, 3 sílabas"),(9,"Fácil en cualquier idioma"),(9,"Imagen de algo enorme y natural"),(6,"Evoca tamaño, no tienda"),(8,"Palabra común, pero única en comercio"),(5,"Compite con el río y la selva")]),
("Uber","Transporte con conductor","Palabra real extranjera",
 "«Über» es «por encima de» en alemán, como el «súper» español: promete algo mejor que el taxi. Cuatro letras, se pronuncia sola y se volvió verbo («pide un uber»).",
 [(10,"4 letras, 2 sílabas"),(9,"Se dice como se escribe"),(8,"Energía y rapidez al decirlo"),(4,"Sugiere premium, no dice coche"),(9,"Único en su sector"),(7,"Nadie más se llama así; no dice taxi")]),
("Spotify","Música en streaming","Palabra inventada a partir de dos reales",
 "Mezcla «spot» (localizar) e «identify» (identificar): encontrar la canción que quieres. Suena moderno, termina en «-ify» como un verbo y no se parece a nada.",
 [(7,"7 letras, 3 sílabas"),(8,"Anglicismo, pero fonético"),(8,"Sonido moderno y rítmico"),(4,"No dice música a la primera"),(10,"Inventado: registrable en todo el mundo"),(9,"Cualquier búsqueda lleva a ellos")]),
("Duolingo","Aprender idiomas","Compuesto de dos palabras reales",
 "«Dúo» (tú y la app, aprendiendo a dúo) + «lingo» (lengua, jerga). Dice qué hace, es alegre y rítmico, y funciona igual en todos los idiomas. Es el modelo más cercano a una app de mates para niños y adolescentes.",
 [(6,"8 letras, 4 sílabas"),(9,"Se dice y se escribe como suena"),(9,"Ritmo alegre y una mascota que sale sola"),(9,"«Lingo» = idiomas: dice qué hace"),(9,"Inventado a partir de palabras reales, registrable"),(9,"Buscar idiomas + app lleva a ellos")]),
("BlaBlaCar","Compartir coche en viajes","Compuesto descriptivo con humor",
 "«Bla bla» por lo que hablas en el viaje y «car» por el coche. Explica el servicio con una sonrisa, la repetición lo hace imposible de olvidar y además clasificaban a los conductores según lo habladores que eran.",
 [(6,"9 letras, 3 sílabas"),(9,"Se escribe tal cual suena"),(10,"Humor y repetición: se queda a la primera"),(8,"Coche y charla: dice el servicio"),(9,"Único, registrable"),(8,"Buscar compartir coche lleva a ellos")]),
("Airbnb","Alojamiento entre particulares","Compuesto con sigla",
 "Viene de «air bed and breakfast»: colchón hinchable y desayuno, como empezaron. Dice alojamiento sencillo entre personas, pero la sigla «bnb» cuesta de escribir al oírla.",
 [(6,"6 letras, pero 4 sílabas al decirlo"),(5,"«bnb» no se escribe como suena"),(7,"La historia del colchón ayuda a recordarlo"),(7,"«Bed and breakfast» dice alojamiento"),(9,"Único y registrable"),(8,"Muy buscado, pero se escribe con errores")]),
("Netflix","Películas y series en streaming","Compuesto de dos palabras reales",
 "«Net» (internet) + «flicks» (pelis en inglés coloquial): pelis por internet en siete letras. Corto, con sonido fuerte (la x) y que dice exactamente qué es.",
 [(9,"7 letras, 2 sílabas"),(9,"Fácil de decir y escribir"),(9,"Sonido potente, termina en x"),(8,"Internet + pelis: dice qué hace"),(9,"Único y registrable"),(9,"Buscarlo lleva a ellos")]),
("YouTube","Vídeos","Compuesto de dos palabras reales",
 "«You» (tú) + «tube» (la tele, en inglés coloquial): la tele la haces tú. Dos palabras de una sílaba que todo el mundo entiende, con un mensaje de participación.",
 [(8,"7 letras, 2 sílabas"),(9,"Se escribe como suena en inglés"),(9,"Imagen de pantalla hecha por ti"),(8,"Tú + tele: dice qué es"),(9,"Único y registrable"),(9,"Buscar vídeos lleva a ellos")]),
("WhatsApp","Mensajería","Juego de palabras",
 "Juega con «What's up?» («¿qué pasa?») y «app». Es el saludo más común en inglés convertido en nombre de app de mensajes. En España se castellanizó como «guasap», señal de que caló.",
 [(7,"8 letras, 2 sílabas"),(7,"Apóstrofo y h: se escribe con dudas"),(9,"Saludo conocido: se queda solo"),(8,"«¿Qué pasa?» + app: mensajes"),(9,"Único y registrable"),(9,"Buscarlo lleva a ellos")]),
("Instagram","Fotos y vídeos","Compuesto de dos palabras reales",
 "«Instant camera» (cámara instantánea) + «telegram» (mensaje): fotos al instante para compartir. Es largo, pero se entiende y suena a marca.",
 [(5,"9 letras, 4 sílabas"),(9,"Fácil de decir y escribir"),(8,"Imagen de foto instantánea"),(8,"Instantáneo + mensaje: dice qué hace"),(9,"Único y registrable"),(9,"Buscar fotos + app lleva a ellos")]),
("PayPal","Pagos online","Compuesto con aliteración",
 "«Pay» (pagar) + «pal» (colega): tu amigo para pagar. Las dos palabras empiezan por P y riman, así que se dice solo y transmite confianza en algo delicado como el dinero.",
 [(9,"6 letras, 2 sílabas"),(9,"Se dice y se escribe fácil"),(9,"Aliteración y rima: pegadizo"),(9,"Pagar: dice qué hace"),(8,"Único, aunque «pay» es genérico"),(8,"Buscar pagos online lleva a ellos")]),
("Canva","Diseño gráfico fácil","Palabra real recortada",
 "«Canvas» (lienzo) sin la s: el lienzo donde cualquiera diseña. Cinco letras, suave, y sugiere creatividad sin sonar técnico.",
 [(10,"5 letras, 2 sílabas"),(9,"Se dice como se escribe"),(7,"Imagen de lienzo, algo abstracta"),(7,"Lienzo: sugiere diseño"),(8,"Recortado, registrable"),(7,"Compite con «canvas»")]),
("Kahoot!","Juegos de preguntas en clase","Palabra inventada con exclamación",
 "Una exclamación inventada que suena a celebración, perfecta para un concurso en clase. Engancha a niños y adolescentes por igual, aunque al oírla nadie sabe cómo se escribe.",
 [(9,"6 letras, 2 sílabas"),(6,"¿K, h, doble o? Se escribe con dudas"),(8,"Suena a grito de alegría"),(3,"No dice qué hace"),(9,"Único y registrable"),(8,"Buscarlo lleva a ellos si lo escribes bien")]),
("Smartick","Mates para niños (España)","Compuesto de dos palabras reales",
 "«Smart» (listo) + «tick» (el ✓ de acierto): niños listos que aciertan. Es el competidor directo más conocido de una app de mates en España. Funciona, pero es un anglicismo que se escribe con dudas y no dice «mates».",
 [(8,"8 letras, 2 sílabas"),(7,"Anglicismo: se escribe con dudas"),(6,"Algo frío, sin imagen clara"),(6,"Listo + acierto; no dice mates"),(9,"Único y registrable"),(8,"Buscarlo lleva a ellos")]),
("Wallapop","Compraventa de segunda mano","Palabra inventada",
 "Inventado y alegre: suena a «pop», a algo que aparece de golpe. No dice qué hace, pero es tan pegadizo que en España «wallapop» ya es sinónimo de vender lo que no usas.",
 [(7,"8 letras, 3 sílabas"),(8,"Se dice como se escribe, con dudas en la ll"),(8,"Sonido alegre y rebotón"),(3,"No dice segunda mano"),(10,"Único y registrable"),(9,"Buscarlo lleva a ellos")]),
("Idealista","Pisos y casas","Palabra real española",
 "«Ideal» + «lista»: la lista de lo ideal, y también quien busca lo ideal. Palabra española que cualquiera escribe bien y que transmite «encuentra tu casa ideal».",
 [(7,"9 letras, 4 sílabas"),(10,"Español puro: nadie lo escribe mal"),(7,"Positivo, sin imagen fuerte"),(5,"«Ideal» sugiere buscar lo mejor; no dice casa"),(7,"Palabra común: registrable con logo"),(7,"Compite con la palabra «idealista»")]),
("Glovo","Reparto a domicilio","Palabra inventada",
 "Inventado, corto y redondo; suena a «globo», algo ligero que llega volando. No dice reparto, pero es tan corto y fácil que se aprende a la primera.",
 [(10,"5 letras, 2 sílabas"),(9,"Se dice como se escribe"),(8,"Suena a globo: ligero y alegre"),(3,"No dice reparto"),(9,"Único y registrable"),(8,"Buscarlo lleva a ellos")]),
("Booking.com","Reservas de hotel","Palabra genérica descriptiva",
 "«Booking» es «reserva» en inglés: dice exactamente qué hace y el dominio es la propia palabra. Es el caso de «Cerrajería Murcia»: ganas búsquedas y confianza, pero cuesta registrar la marca y distinguirse.",
 [(8,"7 letras, 2 sílabas"),(9,"Se dice y se escribe fácil"),(7,"Claro, pero sin emoción"),(10,"Dice exactamente qué hace"),(4,"Palabra genérica: difícil de proteger"),(10,"Quien busca reservar los encuentra")]),
("Nike","Ropa y calzado deportivo","Palabra real de la mitología",
 "Nike es la diosa griega de la victoria: el deporte es ganar. Cuatro letras, sonido fuerte y una historia detrás que da significado sin necesidad de explicarlo.",
 [(10,"4 letras, 2 sílabas"),(8,"En España se duda entre «naik» y «nike»"),(9,"Victoria: emoción pura"),(6,"Sugiere ganar, no dice deporte"),(10,"Único en su sector"),(7,"Compite con la diosa y otras Nike")]),
("Zara","Moda","Nombre propio",
 "Un nombre corto y sonoro de dos sílabas que se dice igual en cualquier idioma. No dice moda, pero es tan fácil que viajó por todo el mundo sin cambiar.",
 [(10,"4 letras, 2 sílabas"),(10,"Imposible escribirlo mal"),(8,"Sonoro, sin imagen clara"),(2,"No dice moda"),(7,"Es nombre de persona: más difícil de proteger"),(6,"Compite con el nombre propio")]),
("Red Bull","Bebida energética","Dos palabras reales con imagen",
 "Toro rojo: fuerza, energía y un poco de peligro, justo lo que promete la bebida. Dos palabras cortas con una imagen potentísima que el logo remata.",
 [(9,"7 letras, 2 sílabas"),(9,"Fácil en cualquier idioma"),(10,"Imagen potentísima: un toro rojo"),(7,"Sugiere energía"),(9,"Único en su sector"),(8,"Buscarlo lleva a ellos")]),
("Mercadona","Supermercado","Palabra real con sufijo",
 "«Mercado» + «-ona»: dice qué es y suena a nombre propio, cercano y español. Cualquiera lo escribe bien al oírlo y se recuerda solo.",
 [(6,"9 letras, 4 sílabas"),(10,"Español puro: se escribe como suena"),(8,"Familiar, suena a casa"),(9,"Mercado: dice qué es"),(8,"Con sufijo propio, registrable"),(8,"Buscar supermercado + zona lleva a ellos")]),
("Chupa Chups","Caramelos con palo","Descriptivo con humor y repetición",
 "Dice lo que haces con el caramelo (chupar) y lo repite con gracia. Es infantil a propósito, se recuerda a la primera y su logo lo diseñó Dalí.",
 [(7,"10 letras, 3 sílabas"),(10,"Se escribe como suena"),(10,"Repetición divertida: se queda"),(9,"Dice qué haces con él"),(9,"Único y registrable"),(8,"Buscarlo lleva a ellos")]),
]
filas = []
for i, (n, sector, tipo, pq, med) in enumerate(R, 1):
    medidas = {k: {"nota": s, "por_que": t} for k, (s, t) in zip(M, med)}
    total = total_ponderado({k: s for k, (s, _) in zip(M, med)})
    filas.append({"orden": i, "nombre": n, "sector": sector, "tipo": tipo, "por_que": pq, "medidas": medidas, "total": total})
sql = "insert into public.nombremates_referencias (orden,nombre,sector,tipo,por_que,medidas,total) select orden,nombre,sector,tipo,por_que,medidas,total from json_populate_recordset(null::public.nombremates_referencias, $J$" + json.dumps(filas, ensure_ascii=False) + "$J$) on conflict (nombre) do update set orden=excluded.orden, sector=excluded.sector, tipo=excluded.tipo, por_que=excluded.por_que, medidas=excluded.medidas, total=excluded.total;"
req = urllib.request.Request("https://api.supabase.com/v1/projects/dzlhsdpgyxnjwudmrnul/database/query",
    data=json.dumps({"query": sql}).encode(), method="POST",
    headers={"Authorization": "Bearer " + os.environ["SUPABASE_ACCESS_TOKEN"], "Content-Type": "application/json"})
print(urllib.request.urlopen(req, timeout=60).read().decode()[:200])
for f in sorted(filas, key=lambda f: -f["total"]): print(f["total"], f["nombre"])
