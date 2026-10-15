# Rutina «Nombre Empresa» (cada 15 minutos)

Objetivo: que Paco nunca se quede sin nombres buenos que revisar en
<https://pacosql.github.io/Train/empresa/> y que cada tanda aprenda de lo
que ha marcado. Todo desde la raíz del repo `Train`.

## Pasos

1. **Cerrojo**: `pgrep -f "[c]ribar.py"`. Si hay una criba en marcha, no
   arranques otra: termina (como mucho, ejecuta `notas.py`).
2. `python3 empresa/tools/contexto.py --atender` y léelo entero:
   - **Comentarios generales «●»** (sin atender) = órdenes directas, la
     prioridad máxima. Cada uno cambia el gusto de la tanda siguiente.
   - **Pesos, no vetos** (regla de Paco, 12/10). Cada estilo (familia,
     sufijo, tipo de palabra) tiene un peso que decide cuántos candidatos
     de ese estilo entran en la tanda:
     - **👍 / ⭐** suben el peso: genera parecidos (misma idea, mismo
       sonido, mismo tipo de palabra), no copias. ⭐ cuenta doble.
     - **👎** baja el peso un poco: ese estilo sale menos, pero sigue
       saliendo.
     - **🙅 Nada de esto** lo baja mucho: solo alguno de vez en cuando.
     - **Acumulan**: cada 👎/🙅 más sobre el mismo estilo lo baja otra vez
       (dos 🙅 → casi nunca; tres → solo como rareza muy de tarde en tarde).
       Un 👍 posterior lo vuelve a subir.
     - Generaliza el estilo: 🙅 a «OcreApps» pesa sobre «todo lo que acaba
       en Apps», no solo sobre ese nombre.
   - **🏛️ Otras marcas** que ha marcado 👍/👎 (venture studios reales):
     úsalas como inspiración (tipo de nombre, sonido, longitud) y súbele el
     peso a los estilos de las 👍. Para añadir más marcas: `tools/marcas.py`.
   - **💡 Palabras** que ha elegido (tabla `empresa_palabras`, status
     me_gusta; contexto.py las lista): son sus piezas favoritas. En cada
     tanda, `python3 empresa/tools/combinar.py <fichero>` genera las
     combinaciones (A+B y A+B+Studio); añádelas al fichero de candidatos,
     las recién elegidas primero. Si quedan < 20 palabras pendientes por
     proponer, añade ~50 palabras simples nuevas en inglés (status
     pendiente, origen claude) en la línea de las que elige.
3. ¿Hace falta tanda? Sí si hay comentarios nuevos, palabras 💡 nuevas, o 👍/⭐/🙅 nuevos
   desde la última ejecución, o quedan **< 200 pendientes con score ≥ 70**.
   **Si no hay nada que atender, no te quedes esperando (Paco, 14/10)**:
   haz una **tanda al azar** corta (15-20 nombres) para que salgan cosas
   nuevas. `python3 empresa/tools/azar.py` da la receta de esta pasada
   (una forma de crear, 4 palabras al azar y uno de sus ⭐ como ancla):
   sigue esa receta, sin repetir raíces ya probadas, criba sin `--primero`
   y puntúa. Solo te saltas la tanda si azar.py dice que ya hay ≥ 60
   pendientes buenos sin revisar (entonces registra con `log.py` y termina).
   Después de cualquier tanda: `python3 empresa/tools/comprobar_com.py`.
4. **Cómo generar (regla del 13/10, «estamos atrapados»)**: nada de
   productos cartesianos (Azul × 150 palabras, raíz × 12 finales): cansan
   y se llevan 👎 en bloque. Cada nombre se piensa uno a uno y tiene una
   historia que se pueda contar en una línea (como Pixar = pixel + -ar).
   Como mucho 6 nombres por raíz y por tanda (contando variantes
   Studios/Labs/Works). Antes de escribir, mira los 👍/⭐ de las últimas
   horas y `afinidad.py --ver` (qué piezas gustan ahora) y cruza lo que
   gusta en ideas nuevas, no en variaciones de la misma palabra.
   **Genera** `empresa/tools/out/candidatos.txt` (con Write) con líneas
   `Nombre|por qué|c f m s d b` bajo cabeceras `# familia: …`, donde las
   seis notas 0-10 son tu opinión honesta: corto, fácil (en español Y en
   inglés), memorable, sugiere (estudio que crea productos educativos y
   negocios, sin atarse a una asignatura ni decir «consultoría»),
   distintivo, búsqueda. ~300 candidatos: dos de cada tres caen por .com
   ocupado. Las familias que funcionan primero; prueba 2-3 nuevas.
5. `python3 empresa/tools/cribar.py empresa/tools/out/candidatos.txt --tanda <N> --modelo <tu modelo>`
   (N = tanda máxima + 1, la imprime contexto.py). Tarda ~1 s por nombre
   (App Store va despacio a propósito).
6. `python3 empresa/tools/notas.py empresa/tools/out/candidatos.txt`:
   ranking de todo (6 medidas y score) y al final `afinidad.py`, que
   ordena la cola por lo que Paco ha marcado últimamente (rasgos: cabeza,
   cola, palabras; ⭐ +3, 👍 +1.5, 👎 −0.3, 🙅 −1.2; lo reciente pesa más),
   sin repetir raíz seguida y con 1 de cada 4 huecos para explorar
   cabezas nuevas. Ejecuta `afinidad.py` también en las pasadas sin tanda
   si ha marcado algo nuevo: así la cola aprende cada 15 minutos.
7. Resumen de una línea: cuántos cargados, vetados, familias nuevas, y qué
   has aprendido de sus marcas. No hace falta desplegar.

## Lo que ya sabemos de Paco (actualiza esta lista)

- Busca el nombre de una **SL paraguas** (venture studio): desarrollador
  de Mates10 y de apps de vocabulario/ortografía en App Store y Google
  Play, y nombre en facturas de consultoría a EE. UU.
- Tiene que **entenderse sobre todo en inglés** (y sonar bien en español) y tener sentido.
- Le gusta **«Blue»** (p. ej. «Blue Studio»); propuso «azul studio» y
  «studiolab».
- Lo que termina en **«Apps»**: 🙅 (12/10, «eso no me interesa»): peso
  muy bajo, como mucho alguno suelto.
- 👎 a los 30 primeros de la tanda 1: objeto del cole + lab (TizaLab,
  PupitreLabs, Estuchelab…), juguetes (Peonza, Canica), colores + lab.
  Peso bajado, no a cero.

- 👍 (12/10): MiradorWorks, AlmendroLab, TinteroLabs, TinteroWorks,
  AstilleroLabs → **palabra española con historia (lugar, oficio, objeto
  antiguo) + Labs/Works** es la familia que funciona. Explórala a fondo.
- Comentarios (12/10): le gustan las palabras inglesas **smoke, stone,
  circle, over**; **nombres de ciudad que suenen bien** («Atlanta
  Studio»); **Blue Works / Blue Studio / Blue Labs** (cogidos: busca
  variantes con sentido).
- 👎 casi todo lo de las tandas 2-3: Azul + palabra inglesa, palabra
  bilingüe + Foundry/House, inventadas tipo Teselena/Brotova, imagen curiosa
  tipo Owlandkite. Peso bajo.
- 👍 (12/10 tarde): EscuadraLab(s), CartabonLab(s) → **instrumentos de
  dibujo técnico + Lab** gustan. Comentarios: le gusta **«paper»**
  («Paperstudio»); quiere la versión **en inglés** de escuadra/cartabón
  (set square, T-square, triangle, protractor, compass, blueprint).
- 👎 masivo a la tanda 5 (palabra española con historia de navegación,
  oficios, arquitectura, árboles + Labs/Works): no basta con «palabra
  española antigua»; lo que gusta es más concreto (tintero, escuadra,
  cartabón: útiles de escribir/dibujar/medir).
- Comentarios (12/10, 17 h): le gustan **CarbonStudio**, **GraphiteStudio**
  (grafito en inglés) y **TrailStudio**; insiste en que sea **compatible en
  inglés y en español**. 👍 nuevos: GrafitoLabs, TipografiaLab,
  AstilleroLab. Dirección: materiales de dibujar/escribir (carbón,
  grafito, tinta, papel) y caminos (trail), una palabra legible en los dos
  idiomas + Studio/Lab/Labs/Works.
- 👍 (12/10, 18 h): **CarbonPaperStudio**, **TintaWorks**: material de
  escribir (papel carbón, tinta) + Studio/Works. Tanda 9 explora imprenta y
  escritura en inglés, materiales de escribir/pintar en español y tipos de
  papel + Studio.
- 👍 (12/10, 19 h): SepiaGrid, TintaNorth, TrailStroke, LapiceroLabs →
  material + dirección/trazo funciona. Comentarios: **«Papersword» me
  gusta**; **trail como en «trailblazers»**. Tanda 10: objeto de
  papel/tinta (Paperfox, Inkblade), estilo trailblazer (Inkblazer,
  Trailsmith) y material + dirección/trazo.
- 👍 (12/10, 20 h): **Tinta + palabra inglesa corta** es lo que más gusta
  (TintaGrid, TintaPoint, TintaForge, TintaNorth, TintaArc), también
  SepiaSquare/Grid/Fold, GrafitoTrail, Inkblazer, CaligrafiaStudio,
  EstilograficaLab, SketchPaperStudio. Patrón: **material de escribir en
  español + sustantivo inglés de 4-5 letras**. Tanda 11 lo explora a fondo.
- **Giro (12/10 noche)**: «me gusta mucho **Studio**, me gusta mucho
  **Azul**, pero quiero que sea **principalmente entendible en inglés**;
  me gusta **Stone** (Stone Studio); como **Pixar** (Toy Story y Pixar):
  un nombre chulo». → Las mezclas español+inglés (TintaGrid…) bajan de
  peso. Prioridad: nombre propio corto que funcione en inglés + Studio,
  con Azul o Stone como guiño (Azulfox, Azulkite, Inkstone Studios,
  Stonewren Studio). Azul + palabra inglesa corta suele tener el .com
  libre incluso sin «Studio».
- ⭐ **Azulnorth** (12/10, 21 h): primer definitivo. 🙅 en bloque a
  material español + palabra inglesa (TrazoTower, PapelCove, TintaPlot…):
  esa familia queda casi a cero. **Azul + palabra inglesa** es la línea
  buena. Comentario: «Quevedo Studios o Góngora Studios, busca algo
  original» → figuras con nombre propio (escritores, científicos) +
  Studios.
- 👍 (12/10, 22 h): **Azulnova**, **QuevedoStudios**, **GaudiStudios**.
  Dos líneas vivas: Azul + astro/cielo (Azulnorth ⭐, Azulnova) y figura
  española con nombre propio + Studios (Quevedo, Gaudí). Ojo: la criba
  veta por error nombres que contienen una marca corta (GongoraStudio ⊃
  «ORA STUDIO»); si Paco pidió el nombre, rescátalo.
- 👍 desde el buscador (12/10, 23 h): **Pacostudios**, **Tizastudios** →
  palabra corta (4-5 letras) + **Studios** en plural. Tanda 15 lo explora
  (palabra española corta / inglesa corta + studios, y variantes con
  «Paco»).
- ⭐ **Tintastudios** (segundo definitivo) y 👍 Brujulastudios, PacoNorth,
  ZorrillaLabs. Palabra española de escribir/dibujar/navegar + studios es
  la línea fuerte junto con Azul + astro. Las de 4-5 letras + studios
  suelen tener el .com cogido: prueba también palabras de 6-9 letras.
- ⭐ (12/10, 23:30): **TrailEast, Tintazulstudio, Azulnorth, Tintastudios,
  TintaNorth, TintaForge, TizaWave**. «Tinta» es SU palabra: Tinta + palabra
  inglesa vuelve a subir aunque antes hubo 🙅 a otras mezclas (Trazo, Papel,
  Pluma + inglés siguen bajas). Cabezas buenas: Tinta, Tiza, Trail, Azul.
- 🙅 (12/10, 23:50) a **206 de Tinta/Tiza + palabra inglesa** (tanda 19:
  TintaKey, TintaOwl, TizaCrane…): esa familia está saturada; ya tiene sus
  ⭐ (TintaNorth, TintaForge, TizaWave). Peso casi a cero. Siguen vivas
  Trail + inglés (👍 TrailBrick) y Azul + inglés. Tanda 20 prueba
  inventadas estilo Pixar + Studios.
- (13/10, 5 h) Tanda 20: 👎 a casi todo (Azul + animal/árbol/objeto,
  inventadas Pixar), pero 👍 **AzulClay**, **AzulRock** (Azul + tierra o
  piedra, en la línea de Stone) y **FabenStudios** (inventada desde
  «fábula»). Tanda 21: Azul + tierra/piedra/taller, tierra + Studios,
  Cobalt/Indigo + taller, e inventadas desde palabras de contar historias.
- (13/10, 12 h) «Me cuesta seleccionar, estamos atrapados, sorpréndeme;
  como Pixar». 46 👍/⭐ de ~3.250 decididos (1,4 %). Lo que gusta es
  concreto: palabra con historia (tintero, astillero, brújula, Quevedo)
  o cabeza corta + norte/este/ola/forja/piedra. Tanda 22 «Sorpresa», a
  mano: estilo Pixar (Pizar = pizarra + -ar, Lapix = lápiz + pixel,
  Fablar), piedras y pigmentos azules (Lapis, Lazuli, Ultramar), lo que
  guía el camino (Cairn, Lodestone, Hito, Astrolab, Bitácora), el taller
  (Crisol, Fragua, Telar), doble sentido (Tales = Tales de Mileto +
  tales/cuentos) y figuras + Studios. Las inventadas en serie y las
  pegadas en minúscula (Pathfinderover) pasan a la reserva.
- (13/10, 16:40) De la Sorpresa: 👍 solo **BrixelStudios** (brick +
  pixel + Studios); 👎 a todo Cabeza + North/East/Labs/Works/Forge
  (LapisNorth, CairnEast, PizarLabs, CrisolLabs…). Conclusión: lo que
  gusta es **UNA palabra con carácter + Studios** (Faben, Brixel, Tinta,
  Tiza, Trail, Ensayo, Brújula, Paco, Quevedo, Gaudí + studios), como
  Pixar Animation Studios. Tanda 23: palabras inventadas tipo Brixel
  (objeto concreto + pixel/bit/-ix/-en) + Studios.
- (13/10, 17 h) ⭐ **AzulTin** y 👍 FabenLabs tras repasar 240 nombres
  (incluida la reserva). Azul + material corto en inglés (Tin, Rock, Clay)
  es su línea más fiable: ya van 641 Azul probados, así que solo los
  monosílabos concretos que falten. Tanda 24: Azul/Trail/Faben + material;
  tanda 25: palabra real con carácter + Studios (Apunte, Acertijo, Renglón).
- (13/10, 21 h) 👎 a las 30 de las tandas 23-26 (palabra real + Studios
  como Ovillo/Cincel/Apunte, inventadas -ix, AzulPin/AzulCog, Faben +
  material). Línea agotada. Lo único vivo: Brixel y Faben (+ Labs /
  Studios) y Azul + material muy concreto (Tin, Rock, Clay). Tanda 27
  pequeña: Brixel/Faben + colas de ⭐. Con un acierto de ~1 %, mejor
  tandas cortas y muy dirigidas que volumen.
- (13/10, 21:15) 👍 **CarpetaStudios** y **TintixStudios**: material de
  clase en español + Studios vuelve a puntuar (Tiza, Tinta, Carpeta).
  Tanda 28: más material escolar + Studios, variantes Tintix/Carpeta.
- (13/10, 21:30) 110 👎 seguidos, ni un 👍: el material escolar + Studios
  (Grapa, Chincheta, Plastilina…) no repite el acierto de Carpeta.
  Tanda 29 (exploración): signos de ortografía y mates + Studios.
- (13/10, 21:45) 240 marcas más (casi toda la reserva), 1 👍: **Datastudios**.
  Tanda 30: palabra inglesa corta + studios; 39 de 43 con .com ocupado,
  solo 4 cargados. Palabra común + studios.com está casi agotado.
- Paco revisa ~150 nombres por hora (hoy, hasta ~240): cada tanda debe cargar **≥ 300** y la
  rutina debe lanzar tanda en cuanto queden < 100 pendientes buenos.
- La cola nunca debe quedarse vacía: `cribar.py` carga cada 10 aprobados.

## Programación

- 4 Routines horarias persistentes desfasadas 15 min (sobreviven a los
  reinicios de sesión): :01 `trig_01LXYDWWauTB3cTbvKTZUvtf`, :16
  `trig_012SRHxP3ow9Bo1oPUMWG4EJ`, :31 `trig_01SMMWDZj1oQyPXrzq5VmhVZ` y la
  de respaldo :46 `trig_015wh7PUgjQgeKx92jVMeqLY`. El cron de sesión
  (CronCreate) es opcional: muere con cada reinicio.
- Umbral: tanda en cuanto queden < 200 pendientes buenos; ~600 candidatos.

## Qué NO hacer

- No cambies el estado de nada que Paco haya decidido.
- No consultes TMview/OEPM/RMC en bucle.
- No despliegues ni toques `main` desde la rutina.

### 14/10 — Tanda 31: ForwardQuery (sugerencia de Paco en el chat)
- Paco propuso ForwardQuery / ForwardQueryStudios. Se cargaron con `--primero` (orden negativo, delante de todo) junto a variaciones: QueryForward, ForwardQueryLabs, FwdQuery, QueryAhead, AheadQuery, ForwardAsk, ForwardQuiz, OnwardQuery, ForthQuery (11 con .com libre; 9 ocupados: NextQuery, AskForward, ForwardQuest, QuestForward, QueryNorth, ForwardTrail, QueryTrail, QueryStudio, ForwardWonder).
- `notas.py` reescribe `orden` al puntuar: tras puntuar, volver a fijar el orden negativo para que sigan primero.
- Línea nueva a vigilar: dos palabras inglesas reales con sentido de «preguntar» + «avanzar».

### 14/10 — Tanda 32: Query/Forward + palabras tuyas, y Lexix/Folon
- Marcas de Paco (11:33–11:36 UTC): 👍 Querystudios, FolonStudios, LexixStudios; ~75 👎 en la reserva (inventadas + Studios tipo Mythan, Numlo, Grimmix…). Comentarios ● «forward» y «forwardquery» → ya atendidos con la tanda 31.
- 22 candidatos, solo 5 con .com libre: QueryPaper, QueryOak, ForwardOak (buenos) y LexonStudios, FolioxStudios (reserva). Ocupados: QueryLabs/Works/Stone, BlueQuery, Querious, Queryon, Querly, ForwardStone/Paper/Circle/Studio, BlueForward, LexaStudios, FolixStudios, NumixStudios, LexumStudios, DataQuery, LexiData.
- Aprendizaje: casi todo Query/Forward + palabra corta está cogido; lo que queda libre lleva palabras menos obvias (Paper, Oak).
- La tanda 31 (ForwardQuery…) sigue delante con orden negativo hasta que Paco la revise.

### 14/10 — Tanda 33: Trail + palabra de una sílaba (sin resultados)
- Paco reordenó ⭐ a las 12:00: ⭐ TrailBrick; TizaWave y AzulTin bajan a 👍; AzulClay a 👎. Trail sube, Azul/Tiza bajan.
- 16 Trail+X (West, North, Forge, Block, Beam, Step, Mark, Post, Mill, Yard, Tile, Craft, Forward, Key, Bolt, Loom): 11 ya estaban comprobados con .com ocupado, 4 ocupados ahora y TrailTile vetado (canal «Tile On Trail»). 0 cargados.
- Conclusión: Trail + palabra inglesa corta está agotado (≈125 probados, 4 gustan). No insistir; si Paco quiere más Trail, probar Trail como sufijo o fundido (p. ej. Brickstrail) solo si lo pide.

### 14/10 — Regla de Paco: nada sin .com
- «No voy a comprar nada que no tenga el .com.» Ningún nombre con el .com ocupado puede estar en ⭐, 👍 ni en la cola.
- Nuevo `tools/comprobar_com.py`: vuelve a comprobar el .com (RDAP Verisign) de ⭐, 👍 y pendientes y pasa a `vetado` los ocupados, con el estado que tenían en el motivo.
- **Ejecutarlo en cada pasada con tanda** (después de notas.py) y, como mínimo, una vez al día aunque no haya tanda.
- Primera pasada (14/10, 58 nombres): 53 libres y 5 ocupados, que se vetaron: ⭐ Trailstudios y 👍 Bluestudios, Pacostudios, Datastudios, Azulstudios (venían de sugerencias o del buscador, sin .com libre).
- Paco revisó toda la cola a las ~12:05 (0 pendientes). De la tanda 31 le gustaron ForwardQuery, ForwardQueryStudios, QueryForward, ForwardQueryLabs y FwdQuery.

### 14/10 — Tanda 34: ForwardQuery con otras colas
- Paco revisó la cola entera (~12:05): ⭐ ForwardQuery, ForwardQueryLabs, FwdQuery, QueryForward, Querystudios, PacoNorth, TrailBrick; 👍 ForwardQueryStudios; 👎 ~130 (inventadas + Studios de la tanda 21, QueryAhead/AheadQuery/ForwardAsk/ForwardQuiz/OnwardQuery/ForthQuery, QueryPaper/QueryOak/ForwardOak).
- Lectura: le gusta **ForwardQuery exactamente**, no los sinónimos (Ahead, Onward, Forth) ni Query/Forward con otra palabra. Está convergiendo.
- Tanda 34 (`--primero`): 12 cargados con .com libre — ForwardQueryWorks, ForwardQueryStudio, ForwardQueryLab, ForwardQueryHQ, ForwardQueryCo, ForwardQueryApps, ForwardQueries, FwdQueryLabs, FwdQueryStudios, QueryForwardLabs, QueryForwardStudios, ForwardQueryNorth. Ocupados: FwdQ, FQStudios.
- Siguiente paso útil si sigue convergiendo: comprobación a fondo de ForwardQuery (marcas USPTO/EUIPO/OEPM, empresas, redes sociales) en vez de más volumen.

### 14/10 — Nada de pasadas vacías
- Paco: «si hay algo que hacer, hazlo; si no, ponte a hacer algo; una iteración más de forma random para que salgan cosas nuevas».
- Las pasadas sin marcas hacen ahora una tanda al azar (paso 3, `tools/azar.py`). Por qué 4 rutinas: cada Routine puede ir como mucho cada hora, así que 4 desfasadas (:01, :16, :31, :46) dan una pasada cada 15 minutos.
- Tanda 35 (primera al azar: dos palabras inglesas; Flame, Line, Atlas, Happy; ancla Tintazulstudio): 18 candidatos, 16 con .com ocupado. Cargados LanternQuery y ChalkForward. Las parejas de dos palabras inglesas comunes casi siempre están cogidas: en las tandas al azar, meter al menos la mitad con una palabra menos obvia (Lantern, Chalk) o con una española.

### 14/10 — Nuevo estado 💚 «Me gusta, descartado» (`me_gusta_descartado`)
- Paco: nombres que le gustan pero ya ha revisado y no van a ser el nombre de la empresa. Sección propia en la app, debajo de 👍 Me gusta, con botón 💚 en ⭐ y 👍.
- Para aprender gustos cuenta como positivo suave (afinidad.py: +1, entre 👍 +1.5 y 👎 −0.3): el estilo le gusta. No es candidato: comprobar_com.py no lo revisa y no se vuelve a proponer.

### 14/10 — Tanda 36 (al azar: inglés + español)
- Marcas 12:10–12:30: de la tanda 34, 👍 ForwardQueryLab/Apps/Works/Studio/North, ForwardQueries, QueryForwardLabs/Studios, FwdQueryStudios; 👎 ForwardQueryCo, ForwardQueryHQ, FwdQueryLabs. Bajan de ⭐ a 👍: Azulnorth, PacoNorth, Tintazulstudio. ⭐ ahora: ForwardQuery, ForwardQueryLabs, FwdQuery, QueryForward, Querystudios, TrailBrick, TrailEast…
- Receta azar.py: inglés + español (Bold, Leaf, Orbit, Kiln; ancla TrailEast). 18 candidatos, **13 con .com libre** (mucho mejor que dos palabras inglesas): HojaWorks, LeafCuaderno, BoldBrujula, HornoLab, RumboForward, FaroQuery, QueryFaro, OrillaWorks, BrujulaQuery, NorteQuery, PizarraForward, TizaQuery, LuzForward.
- Aprendizaje: mezclar una palabra española da .com libres con facilidad; buena vía para las tandas al azar.

### 14/10 — Tanda 37
- Tanda 36 (inglés + español) rechazada casi entera: 12 👎. Solo 👍 ChalkForward (de la 35). **Corrige el aprendizaje de la 36**: que haya .com libre no significa que guste; las mezclas con español no le convencen. Prefiere dos palabras inglesas.
- Tanda 37: material escolar en inglés + Forward/Query (siguiendo ChalkForward) y palabras inglesas de doble sentido. 16 candidatos, 8 con .com libre: SlateForward, QuillForward, PencilForward, ChalkQuery, SlateQuery, CrayonForward, RulerForward, CobaltSlate.

### 14/10 — Tanda 38
- Limpieza de Paco (12:46–13:00): ~20 👍 antiguos a 👎 (Azul*, Tinta*, Grafito*, Sepia*, Inkblazer, Carbonblazer, BrixelStudios, TizaWave, LapiceroLabs, CartabonLabs…). Se queda 👍 GrafitoTrail. De la tanda 37: 👍 SlateQuery, SlateForward; el resto 👎.
- Lectura: el gusto se estrecha a **dos palabras inglesas sobrias: Slate/Trail/Query/Forward**. Material escolar «infantil» (Crayon, Ruler, Pencil, Quill) no.
- Tanda 38: Slate + dirección/pregunta y receta al azar (Vector, Leaf, Bench, Iron). 6 con .com libre: SlateAhead, SlateEast, SlateAsk, ForwardSlate, IronQuery, LeafQuery.

### 14/10 — Tanda 39
- Paco ya usa 💚 (28 nombres pasados a «me gusta, descartado»: Tinta*, Faben*, Lexix/Folon, Quevedo/Gaudí, parte de las variantes de ForwardQuery…). Shortlist ⭐ (13): ForwardQuery, ForwardQueryStudios, ForwardQueryStudio, QueryForward, ForwardQueryLabs, FwdQuery, ForwardQueries, QueryForwardStudios, Querystudios, SlateForward, TrailEast, TrailStroke, TrailBrick. 👍: ForwardSlate, LeafQuery, SlateQuery, Tintazulstudios, CarpetaStudios, PacoNorth, TintixStudios, SketchPaperStudio.
- De la 38: 👍 ForwardSlate, LeafQuery; 👎 SlateAhead/Ask/East, IronQuery.
- Tanda 39: trazo/gesto de escribir (ancla TrailStroke) + azar (objeto de escritorio + Works/Labs). 4 con .com libre: QueryStroke, StrokeQuery, HiveSlate, CoveQuery. PolarSlate vetado (canal Polar Skate Co.).
- Tanda 40 (al azar, sin marcas nuevas; receta: avanzar/descubrir + palabra de los ⭐): 10 con .com libre — StrideQuery, StrideSlate, VoyageQuery, QueryVoyage, UnfoldQuery, QueryEast, EastQuery, QueryBrick, ClimbQuery, SlateStride.
- Tanda 41 (al azar, sin marcas nuevas; receta: naturaleza + pensamiento): 9 con .com libre — PineQuery, WrenQuery, IndigoQuery, PineThought, WrenThink, RiverQuery, OakQuery, QueryRiver, CedarQuery. Cola: 23 pendientes.
- Tanda 42 (al azar, sin marcas nuevas; receta: lugar/río que suene en los dos idiomas): 6 con .com libre — SierraQuery, AndesQuery, CaminoQuery, TahoeQuery, AtlantaQuery, AtlantaForward. Cola: 29 pendientes.
- Tanda 43 (al azar, sin marcas nuevas; receta: palabra inglesa con doble sentido): 6 con .com libre — PlotQuery, FigureQuery, BoundQuery, BraveQuery, SlatePlot, TrailFigure. Cola: 35 pendientes.
- Tanda 44 (al azar, sin marcas nuevas; receta: oficio antiguo): 7 con .com libre — TypesetQuery, MapmakerQuery, JoineryQuery, TrailJoinery, QuarryQuery, MasonQuery, TrailMason. Cola: 42 pendientes. Si azar.py repite la forma de la tanda anterior, se vuelve a sortear.
- Tanda 45 (al azar, sin marcas nuevas; receta: objeto de escritorio + Studios/Labs/Works): 4 con .com libre — FolioQuery, LampQuery, NotebookForward, EaselQuery. Cola: 46 pendientes.
- Tanda 46 (al azar, sin marcas nuevas; avanzar/descubrir + palabra de los ⭐): 7 con .com libre — SeedQuery, SproutQuery, FrontierQuery, PioneerQuery, AscentQuery, SlateSeed, DawnQuery. Cola: 53 pendientes (cerca del tope de 60).
- Tanda 47 (al azar, sin marcas nuevas; dos palabras inglesas dirección + objeto): 9 con .com libre — UpwardQuery, OnwardSlate, OutwardQuery, SkywardQuery, HomewardQuery, RiverForward, HeronQuery, ForwardHeron, AheadSlate. Cola: 62 pendientes → **tope alcanzado**; no más tandas al azar hasta que Paco revise.
- azar.py: quitada la receta «inglés + español» (rechazada en la tanda 36).
- Tanda 48 (al azar, sin marcas nuevas; algo que se hace al aprender): 5 con .com libre — UnderlineQuery, TallyQuery, TallyForward, MarginQuery, SketchQuery. Cola: 60 pendientes buenos → tope; las próximas pasadas solo registran hasta que Paco revise.

### 15/10 — Tanda 49 (dirigida: revisión de Paco de los 67)
- Paco revisó la cola entera (~04:50 UTC). 👍 (11): QueryBrick, SproutQuery, StrokeQuery, StrideQuery, QueryStroke, PlotQuery, FigureQuery, IndigoQuery, FrontierQuery, SierraQuery, AtlantaForward. 🙅 3 (UnfoldQuery, TallyForward, CoveQuery). 👎 el resto.
- Lectura: **palabra inglesa con fuerza + Query** (doble sentido de mates: Plot/Figure; avanzar: Stride/Sprout/Frontier; construir: Brick; color: Indigo; lugar bilingüe: Sierra). Ya no gustan: Slate + X (todo 👎), Trail + X, «-ward» (Upward, Onward, Skyward…), naturaleza común (Pine, Oak, Cedar, River, Wren, Heron) ni detalles de escribir (Margin, Underline, Typeset, Folio).
- Tanda 49: 35 candidatos en esas cinco vías; 18 con .com libre (7 buenos, 11 en reserva): VertexQuery, MesaQuery, QueryPlot, FactorQuery, RatioQuery, BeamQuery, TangentQuery, QueryStride, AxisQuery, QueryFigure, KeystoneQuery, MortarQuery, SaffronQuery, MedianQuery, CanyonQuery, CrimsonQuery, OchreQuery, VermilionQuery. Sin cargar (17, .com ocupado): PrimeQuery, ScaleQuery, SummitQuery, LeapQuery, SurgeQuery, KindleQuery, BloomQuery, VentureQuery, QuerySprout, ArchQuery, TimberQuery, BrickForward, AmberQuery, DeltaQuery, SierraForward, MesaForward, DeltaForward. Las palabras comunes de una sílaba + Query ya están cogidas: mejor palabras menos obvias (Vertex, Mortar, Ochre).
- comprobar_com.py: 50/50 libres.
- Tanda 50 (al azar, sin marcas nuevas; receta: oficio antiguo, palabras Yes/Bay/Wave/Compass). Como esa forma sacó −7 en la 44, se adaptó a lo que gusta ahora: herramienta con lado de mates + Query. 17 candidatos, 11 con .com libre — SextantQuery, QuadrantQuery, MeridianQuery, AnvilQuery, QueryMeridian, QueryAnvil, KilnQuery, PlumbQuery, CaliperQuery, LatheQuery, BayQuery. Compass*, Wave, Ledger, *Forward: ocupados. comprobar_com.py: 61/61 libres.
- Tanda 51 (al azar, sin marcas nuevas; receta: lugar que suene en los dos idiomas, como 👍 SierraQuery/AtlantaForward). 17 candidatos, 15 con .com libre; 14 cargados — SonoraQuery, QuerySonora, PampaQuery, SonoraForward, PampaForward, QuerySierra, LagunaQuery, ArroyoQuery, SavannaQuery, TundraQuery, NevadaQuery, MontanaQuery, AlamedaQuery, HillQuery. PatagoniaQuery vetado a mano (marca de ropa). Los nombres de lugar dan .com libre con facilidad. comprobar_com.py: 76/76 libres.

### 15/10 — Revisión de Paco de las tandas 49-51 (~05:40 UTC)
- 47 👎 y solo 👍 QueryPlot (más AtlantaForward y SierraQuery, que vuelve a marcar). Las tandas 49-51 (mates/construir/color/herramienta/lugar + Query) no le dicen nada: **la vía «palabra + Query» está agotada**. Lo que queda en 👍 con Query delante: QueryPlot, QueryStroke, QueryBrick.
- Tanda 52 (receta azar.py: palabra inglesa de doble sentido; Ten, Think, Bee, Pixel): Query delante + sustantivo corto de doble sentido. 18 candidatos, 7 con .com libre — QueryLever, QueryTen, QueryPivot, QueryPixel, QueryDraft, QueryRule, QueryTally. comprobar_com.py: 40/40 libres.
- Si esta tanda también cae, dejar de producir volumen en la vía Query y proponer a Paco el paso siguiente que ya estaba apuntado: comprobación a fondo de ForwardQuery (marcas USPTO/EUIPO/OEPM, empresas, redes).
- Tanda 53 (al azar, sin marcas nuevas). azar.py sacó otra vez «oficio antiguo» (rechazada en la 44 y la 50): se volvió a sortear y se eligió «dos palabras que cuentan algo» (la forma de ForwardQuery). 15 candidatos, 4 con .com libre — HarborQuery, QueryOnward, QuerySwift, ForwardAnswer (7 ocupados, 4 ya existían). Las parejas obvias (NextQuery, OpenQuery, AskForward, QueryLeap…) están cogidas. comprobar_com.py: 44/44 libres.
- Regla nueva: si azar.py saca una forma que Paco ha rechazado en bloque dos veces, se vuelve a sortear.

### 15/10 — Paco consolida la shortlist (~06:10 UTC)
- Tandas 52 y 53 rechazadas enteras (11 👎). 👍 vaciado: 15 pasan a 💚 (QueryStroke, StrokeQuery, QueryBrick, StrideQuery, FigureQuery, IndigoQuery, SierraQuery, AtlantaForward, FrontierQuery, LeafQuery, SlateQuery, QuerySwift, PacoNorth, Tintazulstudios, SketchPaperStudio); 👎 TintixStudios, CarpetaStudios.
- **⭐ (17)**: ForwardQuery, ForwardQueries, ForwardQueryStudios, ForwardQueryStudio, ForwardQueryLabs, QueryForward, QueryForwardStudios, FwdQuery, Querystudios, QueryPlot, PlotQuery, SproutQuery, ForwardSlate, SlateForward, TrailStroke, TrailBrick, TrailEast.
- ~~Lectura: ya no busca más nombres~~ **ERROR (Paco, 06:4x): «¿por qué no hay más nombres? quiero clasificar más».** Paco quiere SIEMPRE nombres para clasificar. **Regla (Paco, 07:35): «ten siempre 150 listos».** En cada pasada, si hay < 150 pendientes, genera y criba tandas hasta volver a ~150 (con ~1/3 de .com libres, eso son ~3 candidatos por hueco), aunque no haya marcas.

### 15/10 — Primera comprobación de la shortlist (búsqueda web, no es búsqueda oficial de marcas)
- **ForwardQuery / Forward Query**: no aparece ninguna empresa, app ni marca con ese nombre. Ojo: «Forward» suelto está muy usado en estudios y marketing (marca FORWARD STUDIO de Forward Studio LLC, 2023, consultoría de marketing; Forward Labs, estudio de marketing en Toronto; Forward Partners, VC en Reino Unido). Eso pesa contra **ForwardQueryStudio(s)/Labs**: se acercan a «Forward Studio»/«Forward Labs». ForwardQuery a secas sale limpio.
- **QueryPlot / PlotQuery**: nada con ese nombre. Lo más cercano es Plotly (visualización de datos) y Plot Technologies; distinto, pero suena a herramienta de gráficos.
- **SproutQuery**: nada.
- Pendiente: búsqueda oficial en USPTO (TESS), EUIPO y OEPM; handles en X/Instagram/LinkedIn; Registro Mercantil / Delaware.
- Segunda comprobación web (06:31 UTC), resto de ⭐:
  - **Querystudios**: nada con ese nombre. Parecidos lejanos: QUERY (consultora de investigación de mercados, Bangladés), Qu Studios (estudio de foto/cine, Bristol).
  - **TrailStroke / TrailBrick / TrailEast**: nada. TrailEast se confunde con «Eastern Trail» (ruta de Maine) y senderos «East Trail».
  - **ForwardSlate / SlateForward**: nada, pero **ForwardSlate suena casi igual que «forward slash»** (la barra /; hay una empresa Forwardslash). Pega en voz alta. Slate también es una revista conocida (Slate).
  - **QueryForward / FwdQuery**: nada como marca, pero **«query forwarding» es jerga de DNS** y «fwd» de reenvío de puertos/correo: suenan a herramienta de redes.
  - Resumen hasta ahora: ningún ⭐ tiene un choque directo; los más limpios para registrar son ForwardQuery, QueryPlot/PlotQuery, SproutQuery, TrailStroke y TrailBrick.
- Tanda 54 (tras «quiero clasificar más»): 58 candidatos sobre los ⭐ (Forward + pensar, Query + crecer, Plot/gráfica, Trail, Slate); 22 cargados. Paco los clasificó al momento: 👍 ForwardPlot; 👎 casi todo (Forward + palabra de mates/acertijo, Query + plantas, Slope/Curve). TrailQuery 👍 → 👎.
- Tanda 55: dos piezas de los ⭐ juntas (como ForwardPlot) + «plot a course» + Forward + pieza de dibujo. 45 candidatos, 13 cargados: ForwardAngle, StrokeTrail, PlotTrail, SproutSlate, PlotStroke, StrokePlot, QueryCourse, PlotBrick, ForwardBrick, PlotEast, ForwardChart, ForwardGraph, QueryEastward.

### 15/10 — Nueva medida «Se escribe ES/EN» (`escritura`) y nombres tipo estudio (Paco, ~07:00 UTC)
- Paco: «que se escriba bien en español e inglés: Query cuesta escribirlo en español; Hello o Atlanta son muy familiares. Ponlo como métrica y recalcúlalo». 7.ª medida en `tools/medidas.py` (peso 1), con reglas fijas: resta por qu, w, k, y como vocal, th/sh/ph/gh/ck/tion, vocales inglesas (ee, oo, ea, ou, ai…), e final muda, consonantes dobles, j, gue/gui, ñ y tildes; Studio(s)/Lab(s)/Works no cuentan. Atlanta, Hello, Pixar, Sierra = 10; Query = 5; ForwardQuery = 4. `notas.py` la pone sola a cada nombre nuevo; `tools/escritura.py` la recalcula para todos (3.506 nombres). La app la enseña en el bloque de medidas.
- Efecto en ⭐: los de Query bajan 3-6 puntos (ForwardQuery 73 → 68); ForwardPlot sube (70 → 72).
- Paco pide nombres como los de venture studios, estudios de animación, estudios de apps y fondos (sin «Apps»): Pixar, Laika, DreamWorks, Illumination, Ghibli; Atomic, Idealab, Expa, High Alpha, Betaworks; Toca Boca, Rovio, Supercell; Sequoia, Accel, Benchmark, Index. Patrón: una palabra propia, con historia y fácil (lugar, animal o personaje, árbol, palabra latina) + Studios/Labs/Works.
- Tanda 57 (65 candidatos) y 58 (55): las palabras comunes + Studios están casi todas cogidas (75 .com ocupados). Cargados 15: RucioStudios, BaltoStudios, AltoDelta, LaredoStudios, BabiecaStudios, TabulaStudios, ManatiStudios, SanchoStudios, CalculaStudios, TeruelStudios, MarengoStudios, SoriaStudios, AmarilloStudios, SacramentoStudios, HachikoStudios. Vetados PlateroStudios y PlanetaStudios (canales de YouTube grandes).
- Lo que da .com libre: nombres propios menos obvios (personajes del Quijote, caballos y perros con historia, ciudades pequeñas) + Studios.
- Clasificación en directo (06:45-07:05): de las tandas 54-58, 👍 RucioStudios, ForwardBrick (y ForwardPlot); 👎 casi todo lo demás (Plot + X, X + Plot, ciudades + Studios, Balto/Babieca/Marengo, AltoDelta, Tabula/Calcula).
- Tanda 59 (cola < 20): personajes del Quijote y de la literatura española + Studios/Labs (como Rucio) y Forward + sustantivo concreto (como ForwardBrick). 36 candidatos, 21 cargados: ClavilenoLabs/Studios, TizonaLabs/Studios, LazarilloLabs/Studios, RocinanteWorks, AldonzaStudios, CopitoStudios, BucefaloStudios, FelicetteStudios, MontesinosStudios, SansonStudios, NanukStudios, StrelkaStudios, ForwardKiln, ForwardBeam, ForwardPillar, ForwardMason, ForwardTimber, ForwardTile. Cola: 38.
- Clasificación en directo (07:05-07:40): ⭐ **LazarilloStudios** y ForwardPlot; TrailEast → 💚; 👎 el resto de la 59 (Clavileño, Tizona, Rocinante, Bucéfalo, Forward + madera/piedra/pilar…).
- **Regla nueva: ~150 pendientes siempre** (ver arriba). Para llegar rápido se reparte la lluvia de ideas entre 3 subagentes en paralelo (familias distintas; se les pasa la lista de nombres existentes para no repetir) y se criba todo junto.
- Tanda 60: palabras de los ⭐ + studios/labs (como Querystudios) y dos ⭐ + studios; 14 cargados. Tanda 61: personajes de la literatura española (como ⭐ Lazarillo, 👍 Rucio): 22 cargados (Patronio, Lucanor, Tormes, Buscón, Cortadillo, Rinconete, Urdemalas, Maritornes…). Tanda 62: 380 candidatos de los subagentes (verbos de VC/estudios de animación/apps infantiles, lugares bilingües, Forward + objeto nuevo, palabra única con historia).
- Tanda 62 (380 de los subagentes): solo 59 cargados (265 .com ocupados: las parejas de palabras comunes están cogidas). Tanda 63 (personajes de la literatura en español, mitología, ciencia): 21 cargados; MortadeloStudios vetado a mano (marca registrada). Tanda 64 (pícaros y caballerías, literatura juvenil, lugares literarios): 26 cargados. **Lo que más .com libres da: personajes y lugares literarios + Studios/Labs/Works (60-75 %)**; parejas inglesas comunes ~15 %. Cola: 141.
