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
