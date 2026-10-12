"""Siembra empresa_palabras: palabras simples para la sección «💡 Palabras».
Paco marca las que le gustan; la rutina combina las elegidas (combinar.py).
Las que Paco ya dijo en comentarios que le gustan entran como me_gusta.

    python3 empresa/tools/palabras.py
"""
import json, os, re, urllib.request
AQUI = os.path.dirname(os.path.abspath(__file__))
K = re.search(r"eyJ[^\"']+", open(os.path.join(AQUI, "..", "config.js")).read()).group(0)
URL = "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1/empresa_palabras?on_conflict=palabra"
H = {"apikey": K, "Authorization": "Bearer " + K, "Content-Type": "application/json", "Prefer": "resolution=ignore-duplicates,return=minimal"}

YA_LE_GUSTAN = "Azul Blue Studio Stone Paper Trail Carbon Graphite Smoke Circle Over Lab Works Ink Tinta Sepia".split()
SUGERIDAS = """
Marea:tide|Tide:marea|Wave:ola|Harbor:puerto|Bay:bahía|Cove:cala|Reef:arrecife|Shore:orilla|Isle:isla|Coast:costa|Sail:vela|Anchor:ancla|Compass:brújula|North:norte|Polar:polar|Star:estrella|Comet:cometa|Moon:luna|Sun:sol|Orbit:órbita|Nova:estrella nueva|
Fox:zorro|Owl:búho|Wren:reyezuelo|Finch:pinzón|Lark:alondra|Kite:cometa (juguete)|Heron:garza|Otter:nutria|Lynx:lince|Hare:liebre|Robin:petirrojo|Raven:cuervo|Falcon:halcón|Bee:abeja|Hive:colmena|
Oak:roble|Pine:pino|Cedar:cedro|Maple:arce|Birch:abedul|Fern:helecho|Moss:musgo|Leaf:hoja|Seed:semilla|Root:raíz|Grove:arboleda|Orchard:huerto|Meadow:pradera|Field:campo|Ridge:cresta|Peak:cumbre|Summit:cumbre|Hill:colina|Valley:valle|Brook:arroyo|River:río|
Slate:pizarra|Chalk:tiza|Pencil:lápiz|Quill:pluma|Letter:letra|Word:palabra|Page:página|Book:libro|Note:nota|Draft:borrador|Sketch:boceto|Line:línea|Grid:cuadrícula|Square:escuadra|Arc:arco|Point:punto|Spark:chispa|Ember:brasa|Flame:llama|Light:luz|Lantern:farol|Beacon:faro|
Forge:forja|Mill:molino|Kiln:horno|Loom:telar|Anvil:yunque|Yard:taller|Bench:banco de trabajo|Craft:oficio|Maker:creador|Build:construir|Foundry:fundición|Workshop:taller|House:casa|Haven:refugio|Nest:nido|Gate:puerta|Bridge:puente|Tower:torre|Path:camino|Road:carretera|Way:camino|
Bright:brillante|Clever:listo|Bold:audaz|Brave:valiente|Swift:rápido|True:verdadero|Wild:salvaje|Little:pequeño|Tiny:diminuto|Big:grande|Good:bueno|Happy:feliz|Kind:amable|Wise:sabio|
Learn:aprender|Play:jugar|Think:pensar|Grow:crecer|Spell:deletrear|Count:contar|Read:leer|Write:escribir|Draw:dibujar|Mind:mente|Idea:idea|Lesson:lección|Class:clase|School:escuela|
Indigo:índigo|Cobalt:cobalto|Navy:azul marino|Sky:cielo|Teal:verde azulado|Amber:ámbar|Copper:cobre|Silver:plata|Gold:oro|Iron:hierro|Glass:cristal|Prism:prisma|Pixel:píxel|
Atlas:atlas|Delta:delta|Vector:vector|Orbit:órbita|Apex:cúspide|Echo:eco|Halo:halo|Zen:zen|Loop:bucle|Hello:hola|Hey:ey|Yes:sí|Go:ve|Up:arriba|Next:siguiente|First:primero|One:uno|Ten:diez|Hundred:cien
"""
filas = [{"palabra": p, "significado": "dijiste que te gusta", "origen": "comentario", "status": "me_gusta", "orden": None} for p in YA_LE_GUSTAN]
vistas = {p.lower() for p in YA_LE_GUSTAN}
for i, item in enumerate(x.strip() for x in SUGERIDAS.replace("\n", "").split("|") if x.strip()):
    p, s = item.split(":", 1)
    if p.lower() in vistas: continue  # la misma palabra dos veces rompe el insert
    vistas.add(p.lower())
    filas.append({"palabra": p, "significado": s, "origen": "claude", "status": "pendiente", "orden": i})
urllib.request.urlopen(urllib.request.Request(URL, data=json.dumps(filas).encode(), method="POST", headers=H))
print(len(filas), "palabras")
