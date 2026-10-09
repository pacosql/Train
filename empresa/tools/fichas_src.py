"""Fuente de las fichas a mano (6 medidas) de Nombre Empresa → fichas.json.

Criterio: nombre de una SL paraguas que sale como desarrollador de apps
educativas (Mates10, vocabulario, ortografía) en App Store / Google Play y
en facturas de consultoría a clientes de EE. UU. Corto, se dice y se
escribe bien en español E inglés, neutro (no ata a una asignatura), serio en
una factura y amable en una ficha de app infantil, .com libre y sin
competencia parecida. Formato: (nombre, tipo, por qué, [(nota, motivo)×6])
en el orden corto, facil, memorable, sugiere, distintivo, busqueda.

    python3 empresa/tools/fichas_src.py && python3 empresa/tools/fichas.py
"""
import json, os
F = [
("TizaLab", "Objeto del cole + lab",
 "Mi favorito. La tiza es el símbolo más universal de enseñar, y «Lab» le da aire de empresa que fabrica producto. 7 letras, 2+1 sílabas, se dice igual en inglés («teeza lab») y queda serio en una factura: «TizaLab S.L.». No ata a mates: vale para vocabulario, ortografía o lo que venga.",
 [(9,"7 letras, 3 sílabas"),(8,"Se escribe como suena; en inglés se lee «teeza» sin problema"),(8,"Imagen clara: tiza en la pizarra"),(9,"Enseñar + laboratorio de apps, sin atarse a una asignatura"),(9,"Nada parecido en tiendas ni YouTube; tizalab.com libre"),(8,"Palabra rara en inglés: buscarlo lleva a ti")]),
("Tizazul", "Fusión: tiza + azul (tu «azul»)",
 "Une tu idea del azul con la tiza del cole en una sola palabra inventada: 7 letras, única en el mundo. Suena a estudio pequeño y cuidado. Pega: en inglés hay que deletrearla una vez («tiza-azul»), y la doble lectura tiza/azul se pierde fuera de España.",
 [(9,"7 letras, 3 sílabas"),(6,"Al oírla dudan si es «tizazul» o «tiza azul»; en inglés hay que deletrearla"),(8,"Imagen bonita: tiza azul en la pizarra"),(7,"Sugiere cole y creatividad"),(10,"Inventada: registrable y sin nadie parecido"),(9,"Buscarla solo te encuentra a ti")]),
("PeonzaStudio", "Juguete clásico + studio",
 "La peonza es juego, equilibrio y algo que gira solo cuando le das el impulso justo: buena metáfora de aprender. Studio la hace sonar a creadora de apps. Se pronuncia bien en inglés («pe-on-za»).",
 [(6,"12 letras, 4+2 sílabas"),(8,"Se escribe como suena en los dos idiomas"),(8,"Imagen clara: una peonza girando"),(7,"Juego y aprendizaje; no ata a una materia"),(9,"Sin competencia parecida"),(8,"Peonza + studio solo te encuentra a ti")]),
("AlmendroStudio", "Árbol + studio",
 "El almendro es el primer árbol que florece, aún en invierno: la idea de empezar pronto a aprender. Cálido, mediterráneo y con historia que contar. En inglés se dice sin problema, aunque es largo.",
 [(5,"14 letras, 5 sílabas"),(8,"Fácil en español; en inglés se lee bien"),(8,"Imagen de almendro en flor"),(7,"Crecer, primeras etapas: encaja con educación"),(9,"Sin competencia parecida"),(7,"«Almendro» tiene muchos resultados de jardinería")]),
("PupitreLabs", "Objeto del cole + labs",
 "El pupitre es el sitio del alumno: dice educación sin decir asignatura. «Labs» le da empresa de producto. En inglés «pupitre» es extraño de pronunciar, pero en una factura se lee como nombre propio.",
 [(7,"11 letras, 4 sílabas"),(6,"En español perfecto; en inglés cuesta pronunciarlo"),(7,"Imagen del pupitre de madera"),(9,"Dice cole y alumno, vale para todas las apps"),(9,"Sin desarrolladores ni canales parecidos (Pupitre a secas sí: canal de 1.880 subs)"),(7,"Hay webs educativas con «pupitre»")]),
("CometaWorks", "Juego/cielo + works",
 "«Cometa» es juguete (la cometa que vuela) y astro (el cometa): ilusión y velocidad. Works lo hace taller. En inglés suena como «comet»: lo entienden.",
 [(7,"11 letras, 4 sílabas"),(8,"Fácil en los dos idiomas"),(8,"Imagen de cometa en el cielo"),(6,"Ilusión y altura; no dice educación"),(7,"Hay muchas empresas «Cometa» en España (ojo al Registro Mercantil)"),(6,"Búsqueda muy disputada")]),
("TurquesaLab", "Color + lab (como «azul studio»)",
 "La versión más cercana a tu «azul studio» que está libre: un color luminoso y alegre + lab. Bonito en un logo, pero un color dice poco de lo que haces.",
 [(7,"11 letras, 4 sílabas"),(7,"En inglés se escribe «turquoise»: habrá quien lo escriba mal"),(7,"Color claro y alegre"),(4,"No sugiere educación"),(9,"Sin competencia parecida"),(7,"Se confunde con búsquedas de color")]),
("TinteroStudio", "Objeto de escribir + studio",
 "El tintero de la escuela antigua: escribir bien, ortografía, vocabulario. Encaja muy bien con tus próximas apps de lengua; con mates, algo menos.",
 [(6,"13 letras, 5 sílabas"),(8,"Fácil en español, legible en inglés"),(7,"Imagen del tintero y la pluma"),(7,"Escribir, aprender; más lengua que mates"),(9,"Sin competencia parecida"),(8,"Buscarlo lleva a ti")]),
("AtalayaLab", "Lugar + lab",
 "Atalaya: la torre desde la que se ve lejos. Suena serio y con perspectiva, bueno para consultoría. Menos cálido para una app infantil.",
 [(8,"10 letras, 5 sílabas cortas"),(8,"Se lee bien en inglés"),(7,"Imagen de torre de vigía"),(5,"Visión, perspectiva; no dice educación"),(7,"«Atalaya» es nombre común de empresas en España"),(6,"Muchos resultados con «Atalaya»")]),
("CerezaStudio", "Fruta/color + studio",
 "Cereza es alegre, roja y fácil de dibujar en un logo; con Studio suena a estudio de apps amable. No sugiere educación.",
 [(7,"12 letras, 5 sílabas"),(7,"En inglés la z/c confunde un poco"),(8,"Imagen de cereza: logo hecho"),(4,"No dice nada de aprender"),(8,"Hay una app «CerezaApp» (vetado Cereza Apps), Studio está libre"),(6,"Compite con la fruta")]),
("CanicaStudio", "Juego de recreo + studio",
 "La canica del recreo: juego, colores y un pequeño mundo dentro. Amable y con nostalgia para padres.",
 [(7,"12 letras, 5 sílabas"),(8,"Fácil en los dos idiomas"),(8,"Imagen de una canica de cristal"),(6,"Juego y cole, aunque no dice aprender"),(9,"Sin competencia parecida"),(7,"Compite con el juguete")]),
("AzafranStudio", "Especia/color + studio",
 "Azafrán: color, España y algo valioso. Exótico y elegante fuera de España. Pega: tilde perdida y la z/f en inglés.",
 [(6,"13 letras, 5 sílabas"),(6,"Sin tilde en el dominio; en inglés cuesta"),(8,"Color y olor muy reconocibles"),(4,"No dice educación"),(9,"Sin competencia parecida"),(7,"Compite con la especia")]),
("ChispaLabs", "Idea + labs",
 "La chispa de entender algo. Corto y con energía. En inglés se lee «chispa» bien. Muchas empresas españolas usan «chispa»: miraría el Registro Mercantil.",
 [(8,"10 letras, 3 sílabas"),(8,"Fácil en los dos idiomas"),(8,"La chispa de la idea"),(7,"Ingenio, aprender"),(6,"«Chispa» es muy usada en nombres de empresa"),(6,"Búsqueda muy disputada")]),
("RecreoLabs", "Cole + labs",
 "Recreo: aprender jugando. Muy claro en España, sin sentido fuera; en facturas a EE. UU. solo es un nombre.",
 [(8,"10 letras, 4 sílabas"),(8,"Fácil"),(7,"Patio del cole"),(8,"Juego y cole: encaja con apps educativas"),(8,"Sin competencia parecida"),(6,"«Recreo» tiene mucho ruido")]),
("CuadernoStudio", "Material escolar + studio",
 "El cuaderno es donde se practica: mates, vocabulario, ortografía. Muy claro, pero largo y algo genérico.",
 [(5,"14 letras, 5 sílabas"),(7,"En inglés «cuaderno» se pronuncia regular"),(6,"Imagen de cuaderno, poco singular"),(9,"Practicar, cole, todas las materias"),(7,"Palabra común"),(6,"Mucho ruido de papelería")]),
("RayuelaLabs", "Juego de patio + labs",
 "Rayuela: el juego de saltar casillas y la novela de Cortázar. Culto y bonito, pero en inglés es difícil («ll» y «y»).",
 [(7,"11 letras, 5 sílabas"),(5,"En inglés no saben pronunciarlo"),(8,"Juego de patio y literatura"),(7,"Juego y aprendizaje por niveles"),(8,"Sin competencia parecida"),(6,"Compite con la novela")]),
("Estuchelab", "Material escolar + lab",
 "El estuche guarda todos los útiles: la metáfora del paraguas que guarda varias apps. Bonito concepto; en inglés «estuche» es difícil.",
 [(8,"10 letras, 4 sílabas"),(5,"La «ch» y la «e» final confunden en inglés"),(7,"Imagen del estuche del cole"),(9,"Paraguas de apps escolares: justo lo que es"),(9,"Sin competencia parecida"),(7,"Buscarlo lleva a ti")]),
("Mochilalab", "Material escolar + lab",
 "Mochila: lo que llevas al cole con todo dentro. Igual que estuche, metáfora de paraguas; más fácil de decir.",
 [(8,"10 letras, 4 sílabas"),(7,"En inglés se lee «mo-chi-la» sin mucho problema"),(7,"Imagen de mochila"),(8,"Cole, todas las asignaturas"),(9,"Sin competencia parecida"),(6,"Ruido de tiendas de mochilas")]),
("MarfilLab", "Color + lab",
 "Marfil: sobrio y elegante, más para consultoría que para apps infantiles.",
 [(8,"9 letras, 3 sílabas"),(8,"Fácil"),(6,"Color sobrio"),(3,"No dice nada de lo que haces"),(9,"Sin competencia parecida"),(7,"Ruido de decoración")]),
("GrullaLabs", "Papiroflexia + labs",
 "La grulla de papel: paciencia y deseo cumplido. Bonita historia, difícil en inglés por la «ll».",
 [(8,"10 letras, 3 sílabas"),(5,"En inglés se pronuncia mal"),(8,"Grulla de papel: imagen preciosa"),(5,"Paciencia, pero no dice educación"),(9,"Sin competencia parecida"),(7,"Buscarlo lleva a ti")]),
("AbejaLab", "Animal + lab",
 "Abeja: aplicada y trabajadora; guiño a los «spelling bee» de ortografía en EE. UU. Pega: la «j» en inglés.",
 [(9,"8 letras, 4 sílabas"),(6,"La «j» la pronuncian mal en inglés"),(8,"Imagen de abeja: logo fácil"),(7,"Trabajo y ortografía (spelling bee)"),(8,"Sin competencia parecida"),(6,"Ruido de apicultura")]),
("Tizahq", "Objeto del cole + hq",
 "Variante de TizaLab con «HQ» (cuartel general): más de matriz, pero «hq» al oído no se entiende.",
 [(9,"6 letras"),(5,"«hache-cu» al oído confunde"),(7,"Tiza"),(7,"Cuartel general de las apps"),(9,"Sin competencia"),(8,"Buscarlo lleva a ti")]),
("Didactalab", "Didáctica + lab",
 "Dice exactamente lo que es (laboratorio didáctico), pero suena a material escolar y a academia: poco distintivo.",
 [(8,"10 letras, 4 sílabas"),(8,"Fácil, se entiende también en inglés (didactic)"),(5,"Poco imagen"),(9,"Dice educación sin rodeos"),(5,"Muy descriptivo: hay mucho «didact-»"),(5,"Mucho ruido")]),
("PajaritaStudio", "Papiroflexia + studio",
 "La pajarita de papel, símbolo del cole español (y de Unamuno). Entrañable, pero largo y raro en inglés (y «pajarita» también es corbata).",
 [(5,"14 letras, 6 sílabas"),(6,"En inglés difícil"),(8,"Pajarita de papel"),(6,"Cole y creatividad"),(9,"Sin competencia parecida"),(6,"Ruido de la corbata pajarita")]),
("Studiolaboratorio", "Tu «studiolab» en largo",
 "Lo único libre de la familia de tu «studiolab» (studiolab.com y labstudio están ocupados). Demasiado largo para ser nombre de desarrollador.",
 [(2,"17 letras"),(6,"Se entiende pero cansa"),(4,"Sin imagen"),(6,"Estudio y laboratorio"),(6,"Descriptivo"),(5,"Genérico")]),
]
M = ["corto", "facil", "memorable", "sugiere", "distintivo", "busqueda"]
out = [{"nombre": n, "tipo": t, "por_que": p, "medidas": {k: list(v) for k, v in zip(M, ms)}} for n, t, p, ms in F]
json.dump(out, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "fichas.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(out), "fichas")
