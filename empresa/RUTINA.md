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
- Tanda 65 (relleno hasta 150): cuentos para enseñar (Calila e Dimna, Sendebar, Barlaam), retablo de Maese Pedro, Gepeto, Sherezade, Zifar.

### 15/10 — Revisión de Paco de las tandas 59-65 (~17:24 UTC)
- 110 marcas: solo 👍 **TormesLabs**. 👎 todo lo demás: personajes y lugares literarios + Studios/Labs/Works (Patronio, Lucanor, Buscón, Rinconete, Amadís, Tirant, Macondo, Comala, Cronopio, Gepeto, Pinocho…) y Forward/Sprout + objeto (Lantern, Lamp, Marble, Lever, Domino…). **La vía «personaje literario + Studios» está agotada**: Lazarillo ⭐ y Tormes 👍 son el mismo libro, no un patrón general.
- Lectura: lo que queda vivo de esa vía es **río/lugar + Labs** (TormesLabs) y los comentarios de Paco que aún no se han explotado: material de escuela (paper, carbon, graphite, cartabón, escuadra), «papersword», trail(blazer), Quevedo/Góngora Studios (autor, no personaje), Atlanta/Murcia Studios.
- Tanda 66 (ríos de España y América + Labs; material/herramienta de dibujo; escritores + Studios; lugares bilingües): 48 cargados. Nalon/Parana/Castro/Cisneros vetados por cribar.
- Tanda 67 (material humilde + objeto épico, como PaperSword; Trail/Blaze + material de escuela): 19 cargados.
- Tanda 68 (palabras que se escriben igual en ES/EN + Labs/Studios; latín corto): 9 cargados — las palabras comunes (Decimal, Lateral, Mural, Tutor…) están todas cogidas.
- Tanda 69 (ríos, sierras y parajes de España y América + Labs, muchos del entorno del Tormes: Huebra, Yeltes, Alagón, Ledesma, Arapiles): 46 cargados (70 % libres).
- Cola: 169 pendientes. comprobar_com.py: 190/190 libres.

### 16/10 — Marcas de Paco (~08:00 UTC) y tanda 70
- 10 marcas: 👍 **PaperSable**; 👎 ríos/lugares + Labs (Henares, Jalón, Biobío, Arlanza, Pánuco), LulioLabs, PapiroLabs, TormesStudio, ChalkPlot. Primera señal: **río + Labs no repite el éxito de TormesLabs**.
- Lectura: gusta **material humilde + arma con palabra que se lee igual en ES/EN** (Paper + Sable; antes comentó «papersword»).
- Tanda 70: Paper + arma/objeto (Daga, Florete, Machete, Catapulta, Tizona, Yelmo…), material + Sable (Ink/Chalk/Wood/Cartón…) y Sable + X. 42 cargados (80 % libres).

### 16/10 — Marcas de Paco (~12:40 UTC) y tanda 71
- 201 marcas (toda la cola): 👍 **BrickChalk**, **BlazeQuery**, **ForwardLetter**, **SeveroStudios**; 👎 todo lo demás, incluida **toda la tanda 70 (Paper/material + arma: 0 de 42)**, ríos y parajes + Labs (0 de 45), palabras ES/EN + Labs y personajes + Studios. Esas vías quedan cerradas.
- Comentario ● «**introbay mola, busca parecidos tb**» (atendido con esta tanda). Patrón Introbay: palabra latina corta que se lee igual en ES/EN + sustantivo inglés de lugar corto (bay, cove, mesa, dock, path, yard), sin Studios.
- Tanda 71 (676 candidatos de 3 subagentes en paralelo): (a) tipo Introbay: Intro/Nova/Proto/Edu/Aula/Numo/Verbo… + bay/cove/mesa/yard/path (244 → 100 cargados); (b) parejas inglesas en la línea de BrickChalk/BlazeQuery/ForwardLetter: palabra de acción + objeto humilde de clase/escritura (Nib, Notch, Abacus, Primer, Tilde, Comma, Easel…); (c) cognomen latino sobrio como Severo (Probo, Firmo, Sereno, Prisco, Fausto…) + Studios/Works/Co y Severo-style + lugar (SeveroPath, SeveroBay). (b)+(c): 432 → 260 cargados. 13 vetados por cribar (canales de YouTube y apps parecidos).
- Cola: 360 pendientes.

### 16/10 — Marcas de Paco (~20:00 UTC) y tanda 72
- 140 marcas de la tanda 71: 👍 **ForwardChalk**, **LetterComet**; 👎 el resto marcado. Tipo Introbay (palabra latina + bay/cove/mesa/path/yard): 34 👎 de 60 marcados, 0 👍 → **no repite**. También 👎: puntuación/tipografía (Tilde, Serif, Italic), ritmos y aliteraciones, ábaco/regla/compás + verbo, paisaje + objeto humilde. Los cognomen + Works/Co casi sin marcar (92 pendientes).
- Lectura: lo que gusta sigue siendo **Forward + objeto básico de clase** (Chalk, Brick, Slate, Letter, Plot) y aparece **Letter + cielo** (Comet).
- Tanda 72 (134 candidatos): Forward + objeto de clase nuevo (Eraser, Primer, Abacus, Crayon, Globe, Alphabet…), Forward + palabras 💡, material + Forward, Letter + cielo/palabra viva, objeto de clase + Comet, palabra/número + cielo. 60 cargados; 66 .com ocupados; 3 vetados (LetterAurora, LetterMeteor, LetterLighthouse por apps).
- Cola: 280 pendientes.

### 16/10 — Marcas (~21:00 UTC) y tanda 73
- 20 marcas de la tanda 72: 👍 **ForwardComet**; 👎 objeto de clase + Comet (Slate, Brick, Plot, Number, Digit, Primer, Crayon, Abacus, Bead: 0/9), LetterForward, EaselForward, LetterChalk, LetterPlot, ForwardRuler. Lectura: el que tira es **Forward**; Comet solo funciona detrás de Forward (y de Letter).
- Tanda 73 (47 candidatos): Forward + cielo/luz (Meteor, Nebula, Vega, Sirius, Orion, Zenith, Halley, Polaris, Stardust, Firefly, Sunbeam…). 34 cargados, 12 .com ocupados. Cola: 294.

### 17/10 — Comprobación diaria del .com (00:01 UTC)
- comprobar_com.py: 323/323 libres (⭐, 👍 y pendientes). Cola: 294 pendientes, sin marcas nuevas desde la tanda 73.

### 17/10 — Marcas de Paco (~08:00 UTC) y tanda 74
- 220 marcas: 👍 **TulioPartners**, **ForwardPine**; 👎 casi todo lo demás. Forward + cielo/luz (0/18) y Forward + objeto de clase (0/18) quedan saturados. Cognomen + Studios/Works/Co: 1/56 (solo el de Partners). Palabra latina + lugar tipo Introbay: 0/19.
- Lectura: dos señales nuevas, **sufijo Partners** (encaja con la consultoría) y **Forward + árbol** (Pine).
- Tanda 74 (139 candidatos): Forward + árbol/planta (Cedar, Birch, Elm, Maple, Laurel, Juniper…), pieza ⭐ + árbol (QueryCedar, SlateElm, PlotCedar…), nombre propio corto + Partners (Severo, Rucio, Tormes, Lucio, Julio, Fabio, Octavio, Hugo, Bruno…) y variantes Group/Capital/Co. 92 cargados; ForwardCypress y ChalkPine vetados (canales de YouTube).
- Cola: 166 pendientes.

### 17/10 — Marcas de Paco (08:17–08:38 UTC) y tandas 75-76
- ~210 marcas: 👍 **ClaudioPartners**, **InterReef**; 👎 todo lo demás. Nombre propio + Partners: 2/60 (Tulio, Claudio; los dos son nombres romanos célebres en -io, el resto cae). Forward + árbol: 1/30 (solo Pine). Cognomen + Works/House/Studios: 0/10.
- Tanda 75: cruce sistemático de raíces ⭐/👍 (Forward, Query, Plot, Slate, Trail, Brick, Chalk, Letter, Comet, Blaze, Paper, Pine, Sable, Stroke) en los dos órdenes, más pieza ⭐ × árbol. 43 + 44 cargados; **los 43 primeros, 👎 todos** → cruzar raíces ya conocidas no funciona.
- Tanda 76 (eco de InterReef y del comentario «introbay»): Inter + costa/mar y naturaleza, prefijo latino + Reef, pieza ⭐ + Reef, nombre romano célebre o en -io + Partners, Intro/Proto/Nova/Alto + palabra 💡. 89 cargados (≈60 % .com ocupados).
- Cola: 133 pendientes.
- Tanda 77 (relleno, sin marcas nuevas): Intro + costa/naturaleza, Inter + costa, nombre romano en -io + Partners. 36 cargados; InterJetty vetado. Cola: 169.

### 17/10 — Marcas de Paco (~11:40 UTC) y tanda 78
- 169 marcas (toda la cola): 👍 **SupraReef**, **SupraTide**, **SupraBay**; 👎 todo lo demás. Supra + mar: 3/6 (caen Cove, Harbor, Shore). Inter/Intro/Alto/Proto + costa: 0/61. Cruces de raíces ⭐ y pieza × árbol: 0/41. Nombre en -io + Partners: 0 → vía cerrada.
- Comentario ● «**recursivequery** / **stonebase**» (atendido): los dos .com están ocupados, así que se exploran sus patrones.
- Tanda 78 (643 candidatos): Supra + palabra corta de mar/naturaleza; otros prefijos latinos cortos + mar (Ultra, Infra, Magna, Ora, Alba, Vera…); adjetivo técnico/matemático + Query (Modular, Ordinal, Kinetic…); Recursive + pieza ⭐; Stone + pieza estructural; material + Base/Core/Ground/Stack. 210 cargados, 377 .com ocupados (Stone + X y material + Base casi todos cogidos), 7 vetados.
- Cola: 210 pendientes.

### 18/10 — Comprobación diaria del .com (00:02 UTC)
- comprobar_com.py: 246/246 libres (⭐, 👍 y pendientes). Cola: 210 pendientes, sin marcas nuevas desde la tanda 78.

### 19/10 — Comprobación diaria del .com (00:02 UTC)
- comprobar_com.py: 245/246 libres; MatrixQuery (pendiente, tanda 78) se ha registrado y queda vetado. Cola: 209 pendientes, sin marcas nuevas desde la tanda 78.

### 19/10 — Marcas de Paco (~20:30 UTC), comentario ● «Atlantic» y tanda 79
- 209 marcas (toda la cola): ⭐ **SupraSpring**; 👎 todo lo demás. Supra + naturaleza: 1/41; prefijo latino + mar: 0/118; adjetivo técnico + Query y Recursive + pieza ⭐: 0/41; Stone/material + Base/Core/Stack: 0/10. Esas vías quedan cerradas.
- Comentario ● «**Atlantic**» (atendido). Tanda 79 en tres bloques: (a) Atlantic + cola, variantes (Atlantico, Transatlantic…), otro océano/mar bilingüe + cola, lugar mítico del Atlántico (Hesperia, Gades, Tartessos…), pieza que gusta + Spring: 194 → 49 cargados; (b) adjetivo/accidente geográfico bilingüe (Insular, Litoral, Meridional, Fluvial, Estival…) + cola: 156 → 53.
- Clasificación en directo de (a) y (b): 👍 **AtlanticoLabs**, **IberianStudios**; 👎 75, entre ellos todo Atlantic + pieza (Query, Plot, Comet, Chalk, Letter…) y océano + Forward/Spring/Tide.
- Lectura: gusta la **palabra geográfica con historia en forma española (Atlántico) o gentilicio inglés (Iberian) + Labs/Studios**, no Atlantic pegado a las piezas de los ⭐.
- (c) adjetivo geográfico en español + Labs/Studios/Works (Cantábrico, Mediterráneo, Ibérico, Hispano, Poniente, Antillas, Galaico…) y gentilicio/región en inglés + Studios/Labs (Iberian, Castilian, Basque, Andalusian, Asturian, Lusitania, Balearic…): 100 → 52 cargados.
- Cola: 77 pendientes.
- Tanda 80 (relleno hasta 150, sin marcas nuevas): pueblo o ciudad antigua de Hispania + Labs/Studios (Celtiberia, Baetica, Gallaecia, Carpetania, Hispalis, Corduba, Numantia…), la travesía atlántica (Carabela, Galeón, Indiano, Travesía, Magallanes, Estrecho) y gentilicio inglés de una región atlántica + Studios/Labs (Canarian, Madeiran, Hebridean, Acadian, Patagonian, Pampean…). 106 candidatos → 57 cargados, 29 .com ocupados, 7 vetados (canales y apps parecidos). Cola: 134.
- Relleno de la tanda 80 (21:02 UTC, sin marcas nuevas): lugar legendario o del Camino en la costa atlántica de Iberia (Hespérides, Afortunadas, Finisterre, Brigantia, Olisipo, Portucale…) y adjetivo inglés de lo ibérico (Moorish, Mozarab, Visigothic, Mudéjar, Manchego, Castellano…) + Labs/Studios. 43 → 33 cargados. Cola: 167.

### 20/10 — Comprobación diaria del .com (00:02 UTC)
- comprobar_com.py: 197/197 libres (⭐, 👍 y pendientes). Cola: 167 pendientes, sin marcas nuevas desde la tanda 79.

### 20/10 — Marcas de Paco (~05:00 UTC) y tanda 81
- 140 marcas, todas 👎: Atlántico/Iberian + Labs/Studios no repiten (adjetivo geográfico en español 0/30, gentilicios 0/36, Hispania antigua 0/30, travesía atlántica 0/10, costa legendaria 0/14, adjetivo ibérico 0/11). **La geografía queda cerrada**; AtlanticoLabs e IberianStudios son casos sueltos.
- Tanda 81, tres formas nuevas: (a) palabra inventada estilo Pixar desde piezas que gustan (Chalkar, Strokar, Supreef…): 58 → 3 cargados, casi todos los .com ocupados; (b) Ten/Diez/Deca/Tenth (Mates10) + pieza: muy buen ratio de .com libres; (c) palabra náutica española + Labs/Studios (Faro, Rumbo, Vela, Estela, Barlovento…): pocos libres. Relleno: número o palabra de mates bilingüe (Primo, Cubo, Sigma, Cifra, Prisma, Vector, Arco…) + Reef/Tide/Spring/Bay/Labs/Studios y animal del mar bilingüe + Labs/Studios. 261 candidatos → 88 cargados.
- Cola: 115 pendientes.
- Tanda 82 (05:32 UTC, relleno sin marcas nuevas): prefijo numérico o pieza de mates bilingüe (Hexa, Penta, Octo, Nano, Tetra, Mono, Duo, Radio, Gnomon, Nonio…) + Reef/Tide/Spring/Bay/Labs/Studios. 96 → 38 cargados.

### 20/10 — Marcas de Paco (~10:30 UTC) y tanda 83
- 153 marcas (toda la cola, tandas 80-82): 👍 **Strokar**, **BarloventoStudios**, **PentaSpring**; 👎 el resto. Ten/Diez/Deca + pieza: 0; número/mates + Reef/Tide/Bay/Labs: 1 (PentaSpring); náutica española + Labs: 0 salvo Barlovento + Studios; Hispania, costa legendaria y adjetivos ibéricos: 0.
- Lectura: tres pistas nuevas. **Strokar** = Stroke + -ar, suena a verbo español (trazar): palabra inglesa con infinitivo español. **Barlovento**: palabra marinera rotunda + Studios. **PentaSpring**: número + Spring (vuelve Spring, como ⭐ SupraSpring).
- Tanda 83: verbo spanglish (Sketchar, Doodlar, Brushar, Pixelar, Sparkar, Bloomar…), viento/mar/barco español + Studios (Sotavento, Tramontana, Alisio, Galerna, Pleamar, Atalaya, Bergantín, Goleta…) y número + Spring(s)/Penta + crecer (HeptaSpring, PentaBloom, PentaWell, SevenSprings…). 215 candidatos → 88 cargados, 100 .com ocupados, 9 vetados.
- Cola: 88 pendientes.
- Tanda 84 (10:47 UTC, sin marcas nuevas): tercera ronda de las tres líneas (verbos spanglish de dibujar/crear, marinería española + Studios, número/forma + crecer). 87 → 36 cargados.
- Tanda 85 (11:03 UTC, sin marcas nuevas): cuarta ronda de las tres líneas (verbos spanglish desde piezas ⭐/👍, marinería española + Studios, número + brotar/florecer). 58 → 29 cargados. Cola: ~153.

### 20/10 — Marcas de Paco (~13:30 UTC) y tanda 86
- 90 marcas, todas 👎 (Paco va a medias de las tandas 83-85): verbo spanglish 0/33, marinería española + Studios 0/42, número + Spring 0/17. **Los ecos de Strokar, BarloventoStudios y PentaSpring no repiten.** Igual que con Atlántico/Iberian: cada 👍 es suelto, no abre familia.
- Cambio de estrategia: **tanda de exploración amplia**, un nombre por idea, sin familias (animal + objeto con historia, mitología y científicos + pieza, inventores españoles, «X and Y» con piezas ⭐/👍, material de cole español, caminos e hitos). 172 candidatos → 27 cargados (108 .com ocupados: las palabras sueltas cortas están cogidas).
- Cola: 90 pendientes.
- Tanda 87 (13:47 UTC, sin marcas nuevas): exploración amplia 2, parejas de dos palabras con imagen (animal, sabio, instrumento antiguo, piedra, tela, sabor) + pieza, una por idea. 110 → 56 cargados (las parejas menos obvias dan ~50 % de .com libres).
- Tanda 88 (14:03 UTC, relleno): animal curioso + pieza de aprender (IbexInk, MeerkatMath…). 16 → 8 cargados. Cola: 154.

### 20/10 — Encargo directo de Paco (~14:10 UTC): 200 nombres con .com libre (tanda 89)
- Paco: «no encuentro el nombre. Quiero algo **profesional y fuerte** (consultoría y freelance) que también sea **estudio/lab que construye apps**; fácil de leer en inglés y en español, **que no suene español**. Buenos ejemplos: **Databricks, Introbay, Pixar**; me gusta **Atlantic Studios**. Primera app: **Ortografía 10** (spelling bee); al descargarla se verá el creador. Añade 200 nombres con el .com libre».
- Tanda 89: (a) palabra técnica/de oficio + objeto concreto (como Databricks): Lexicon, Syntax, Kernel, Schema, Glyph, Matrix… + Kiln, Keel, Anvil, Rail, Span, Bricks; (b) prefijo latino corto + lugar (como Introbay): Orto, Lexa, Prima, Alto, Aria, Vera, Nexa… + Shore, Landing, Reach, Crest, Cove; (c) nombre fuerte + Studios/Labs/Works/Partners (como Atlantic Studios): 156 de 160 con el .com ocupado; (d) ronda 2 con 84 raíces nuevas (técnicas, estrellas, piedras, latinas) × colas poco comunes (Lintel, Strand, Ledge, Spire, Jetty, Helm, Prow…), máx. 6 por raíz.
- ~1.000 candidatos → **377 cargados con .com libre**, 12 vetados. Lo que da .com libre: raíz con sentido + cola concreta poco usada; las palabras fuertes sueltas o con Studios están cogidas.
- La tanda 89 va la primera de la cola (orden por score, máx. 2 por raíz al principio). Cola total: 531 pendientes.
- cribar.py se cortó dos veces por timeout de red al guardar (guarda cada 10 nombres, así que no se pierde nada; basta relanzarlo).
- 16:02 UTC: Paco marcó 80 de la tanda 89: 78 👎 y 2 🙅 (RavenStrand, ArgentLintel), 0 👍. Caen sobre todo las colas Lintel, Strand, Span, Ledge, Anvil, Helm y Landing. **«Raíz + cola concreta poco común» no le convence**, aunque tenga el .com libre. Cola reordenada con afinidad.py; 451 pendientes, sin tanda nueva.

### 20/10 — Paco clasifica toda la cola (~16:15 UTC) y tanda 90
- 461 marcas (tandas 81-89 enteras): ⭐ **AlfonsoDecimo**, ⭐ **Strokar** (antes 👍); 👍 **VeleroStudios**, **TramontanaStudios**, **SeptaSpring**; 💚 SotaventoStudios; 👎 el resto, incluida casi toda la tanda 89 del encargo (raíz + cola concreta poco común: 0 👍 de ~370).
- Lectura: **AlfonsoDecimo** = Alfonso X el Sabio, y la X es un 10 (Mates10, Ortografía 10): historia española + saber + el número de sus apps. **Palabra marinera española + Studios** ya suma 4 aciertos (Barlovento, Velero, Tramontana, Sotavento): es la única línea que repite. **Número latino + Spring**: 2 (Penta, Septa).
- Tanda 90: (a) Alfonso X / el Sabio / Décimo / Alfonsine / Escuela de Traductores de Toledo / Cantigas / Siete Partidas; (b) rey español + ordinal (CarlosQuinto, FelipeSegundo, JaimePrimero…) y Décimo/Tenth + palabra de saber; (c) viento, barco, vela o maniobra española + Studios (Ábrego, Solano, Balandro, Trainera, Foque, Gavia, Bolina, Orza…); (d) ordinal latino + Spring (Octa, Nona, Prima, Septima, Octava…). 223 candidatos → 140 cargados, 13 vetados.
- Cola: 140 pendientes.
- Tanda 91 (16:33 UTC, relleno de marinería + Studios): 15 cargados.
- ~16:40 UTC: Paco clasifica la tanda 90 en directo: 👍 **SirocoStudios**; 👎 el resto (Alfonso X/Décimo y reyes + ordinal: 0; ordinal + Spring: 0 nuevos). **Viento o vela + Studios ya suma 5 aciertos**: Barlovento, Sotavento (💚), Tramontana, Velero, Siroco. Es la línea que repite, aunque otros vientos caen (Levante, Poniente, Ábrego, Solano…).
- Tanda 92: viento con nombre propio + Studios (Aquilón, Bora, Meltemi, Pampero, Zonda, Chinook, Mistral, Xaloc, Llebeig, Garbí…), viento + Labs/Works/Partners, barlovento/sotavento en inglés (Windward, Leeward, Tradewind…) + Studios, tiempo y regata en español (Ráfaga, Remolino, Torbellino, Ventisca, Regata, Veleta…) + Studios. 120 → 63 cargados. Cola: 63 (Paco va clasificando en directo).
- ~16:50 UTC: 👍 **SirocoPartners**, **TormentaStudios** (Paco sigue en directo; 80 marcas, el resto 👎). Tanda 93: Siroco/Tormenta + otras colas, tiempo fuerte en español + Studios/Partners (Borrasca, Temporal, Tromba, Centella, Rayo…), viento + Partners, fuerza de la naturaleza + Studios (Volcán, Glaciar, Avalancha, Torrente…), palabra de fuerza/fragua + Studios/Partners (Ímpetu, Temple, Fragua, Yunque…). 131 → 65 cargados.
- 17:02 UTC: tanda 93 entera 👎 (Siroco/Tormenta + otras colas, tiempo fuerte, fuerzas naturales, fragua: 0 nuevos). Aciertos acumulados de la línea viento/mar/tiempo: Barlovento, Sotavento, Tramontana, Velero, Siroco (+Partners), Tormenta ⭐ (6 de ~250).
- Tanda 94: se generaliza el **perfil sonoro** de los aciertos (palabra española de 3-4 sílabas, rotunda, que acaba en -a/-o y se lee bien en inglés) a otros campos: paisaje y costa (Atalaya, Pradera, Ensenada, Escollera…), fortaleza y casa (Baluarte, Torreón, Mirador…), viaje y crónica (Travesía, Odisea, Bitácora, Almanaque…), arte (Pincel, Lienzo, Boceto, Grabado…), luz (Alborada, Candela, Resplandor…), música (Clarín, Timbal, Vihuela…), oficios (Alfarero, Cantero, Orfebre…) y herramientas de dibujo (Cartabón, Escuadra, Plomada…) + Studios. 191 → 100 cargados. Cola: 80 (Paco sigue clasificando).
