# Weights 🏋️

Tutor de entrenamiento para el gimnasio. PWA sin build (HTML/CSS/JS
puro), pensada para instalarse en el iPhone y usarse máquina a máquina
durante el entrenamiento. Forma parte del hosting multi-app de este
repo — ver el [README de la raíz](../README.md) para el panorama
general.

## Cómo funciona

1. **Start** → eliges la duración total del entrenamiento (60 / 90 /
   120 min, o una duración custom).
2. La app sugiere cuántos minutos de **elíptica/bicicleta** hacer de
   calentamiento (siempre el primer "ejercicio").
3. Tras el cardio, la app propone una **lista ordenada de ejercicios**.
   Tú miras qué máquina está libre en el gimnasio y eliges de esa lista.
4. Para el ejercicio elegido, la app te muestra el **último peso**
   usado y una recomendación (subir/mantener/bajar) basada en lo que
   marcaste la vez anterior.
5. Hilo de 3 series × 8 repeticiones — vas marcando cada serie hecha.
6. Al terminar las 3 series, marcas si la **próxima vez** quieres más,
   igual o menos peso — eso es lo que alimenta la recomendación de la
   próxima sesión.
7. Vuelves al paso 3 hasta que pulsas "Terminar entrenamiento".

## Historial

- Desde **inicio**, cada entrenamiento de la lista es navegable: al entrar
  ves qué hiciste ese día, en qué orden, con qué peso y qué marcaste para
  la próxima vez. Desde ahí puedes saltar a la ficha de cualquier máquina.
- La ficha de cada máquina (tanto en el catálogo como durante el
  entrenamiento) incluye una **gráfica de progreso** con los pesos que has
  ido usando a lo largo del tiempo — minutos en el caso del cardio. Es una
  sola serie, así que no lleva leyenda: solo se etiquetan el primer y el
  último punto, y tocando cualquier punto se ve su fecha exacta.

- Cada entrenamiento se puede **borrar** desde su propia pantalla. El
  FK de `weights_session_exercises` tiene `ON DELETE CASCADE`, así que
  al borrar la fila de `weights_sessions` desaparecen con ella los
  ejercicios de ese día (y dejan de contar en las gráficas).

## Añadir una máquina

Solo el **nombre** es obligatorio. El grupo muscular es opcional
(`muscle_group` es nullable) y el tipo de movimiento tiene un cuarto
valor, `otro`, que es el que se usa por defecto: la máquina aparece en
el grupo "Sin clasificar" del catálogo y se puede clasificar más tarde
desde su ficha, sin frenar el entrenamiento para rellenar formularios.

La columna `description` de `weights_exercises` guarda el texto de "cómo
entrenarlo" de cada máquina (colocación, ejecución, errores típicos y
esquema de series). Si está vacía, la app usa un texto genérico.

## Recomendación personal (1-5)

Cada máquina puede llevar una nota de 1 (evítalo) a 5 (adelante) para
la persona que usa la app, con un texto corto explicando el porqué —
por ejemplo por una lesión o por lo que le haya dicho su fisio. Vive en
`weights_exercises.recommendation` (+ `recommendation_note`) y se ve en
tres sitios:

- una tarjeta justo bajo la ilustración al entrar en la máquina (cinco
  puntos, una palabra — Evítalo / Mejor no / Con cuidado / Bien /
  Adelante —, la nota y un aviso de que es orientativo);
- una etiqueta compacta (`3/5`) en la lista de ejercicios y en el
  catálogo;
- la lista de ejercicios la usa en toda la escala (`rateExercise`):
  5 suma +30, 4 suma +15, 3 es neutro, 2 resta 35 y 1 resta 50 — una
  "adelante" gana a una "con cuidado" con la misma frescura, y una
  "evítalo" nunca sale con la estrella. La línea de motivo lo dice
  ("mejor no para tu espalda (2/5)", "ideal para tu espalda").

Se edita desde la ficha de la máquina (chips 1-5). Los detalles
médicos que motivan cada nota se quedan en la base de datos del
usuario, no en este repo.

## Ilustración de la máquina

Cada máquina lleva ahora un dibujo propio de línea (el mismo estilo de
los iconos, pero más grande y detallado), no una foto de catálogo de un
fabricante — esas tienen derechos y no se pueden incrustar aquí, se
haya visto en Technogym, Life Fitness o donde sea. En su lugar,
esquemas hechos a mano con el mismo lenguaje visual del resto de la
app: solo trazo, sin relleno, con la tinta suave del tipo de movimiento
de fondo (azul empuje, ámbar tirón, violeta cardio).

- **`MACHINE_ART`**: un dibujo por familia de máquina (asistida, remo/
  polea, pec-deck, press de pecho, prensa de pierna, extensora de
  pierna, banco+rack, zancada) — varias máquinas del catálogo comparten
  familia cuando son mecánicamente la misma cosa (Pectoral y Reverse
  Fly son las dos un "pec-deck", por ejemplo).
- **`weightStackArt()`**: un glifo compartido (polea + columna con
  muescas) que se repite en toda máquina de pin — así se aprende a
  reconocerlo de un vistazo en vez de tener que descifrar cada dibujo
  desde cero.
- Se ve en dos sitios: el icono de la lista de ejercicios/catálogo
  (`machineArtHtml()`) y una tarjeta grande al entrar en la máquina
  (`renderHeroArt()`, en `#cd-hero-art`/`#ex-hero-art`). El emoji
  personalizado de la ficha, si el usuario puso uno, gana siempre a la
  ilustración automática, en los dos sitios.
- Bicicleta y Andar no tienen dibujo propio en `MACHINE_ART`: su icono
  de categoría (bici/huellas) ya es exacto, así que no hacía falta
  redibujarlos.

## Cómo se usa la máquina (silueta + posición)

Inspirado en la placa de las máquinas de gimnasio reales (Life
Fitness/Technogym), que llevan un diagrama de qué músculo trabajan y un
pictograma de cómo se usan — sin copiar su ilustración, que tiene
derechos, con una versión propia:

- **Silueta corporal** (bajo "Sobre este grupo muscular"): una misma
  figura de bloques redondeados, en vista de frente y de espalda, con
  la región que trabaja esa máquina encendida en el color de su tipo
  (azul empuje, ámbar tirón) y con un halo de brillo. Frente y espalda
  son literalmente la misma silueta — la única diferencia es qué región
  se enciende y un detalle (ojos en la de frente, columna en la de
  espalda). Se calcula solo del texto de `muscle_group`
  (`bodyHighlights()`), así que funciona ya para las 13+ máquinas del
  catálogo sin tocarlas una a una, y para cualquiera que se añada
  después. El cardio no lleva silueta (no hay un músculo que destacar).
- **Posición y movimiento** (bajo "Cómo entrenarlo"): dos chips con
  icono — cómo te colocas (sentado / tumbado / de pie) y en qué plano
  se mueve el peso (horizontal / vertical). A diferencia de la silueta,
  esto sí está mapeado a mano por máquina en `POSITION_MOTION`, porque
  no hay forma fiable de deducirlo del nombre.

## Gráfica de progreso — detalles

- Con **0 o 1 registro** no se dibuja un sparkline: no hay tendencia que
  mostrar todavía. En su lugar, una cifra grande con la fecha ("42,5 kg
  · Primer registro · 17 sept") y una frase invitando a volver. Antes se
  intentaba dibujar un "gráfico" de un solo punto flotando en un hueco
  vacío, con la cabecera partiéndose en dos líneas y una leyenda que
  repetía el mismo dato dos veces — es lo que se veía mal en Remo.
- Con **2 o más registros**, el sparkline lleva una rejilla de tres
  líneas horizontales (no solo la base) y el punto más reciente lleva un
  halo — un vistazo rápido ya distingue "esto es lo de hoy".
- El título y la variación (cabecera de la tarjeta) nunca deben partirse
  en dos líneas por mucho texto que lleven ("sin cambios", "MINUTOS")
  — el título va abreviado ("Peso", "Minutos") y ambos llevan
  `white-space: nowrap`.

## Notas de la máquina

El campo de "notas" (grupo muscular aparte, esto es la anotación libre
tipo "asiento en posición 3") ocupa todo el ancho de la tarjeta y se
guarda solo al salir del campo (o al pulsar Intro) — no hay un botón
"Guardar" pequeño al lado compitiendo por sitio. Un "✓ Guardado" aparece
un instante debajo y se apaga solo. Si el texto no ha cambiado no
vuelve a llamar a Supabase.

## Iconos

Cada máquina lleva un pictograma para reconocerla sin leer el nombre.
Por defecto son cuatro icono de línea (Lucide, licencia ISC, incrustados
como SVG — sin llamada de red, funcionan offline): 🚴 para Bicicleta, 🚶
para Andar, un pulso cardíaco para el resto del cardio (Elíptica y
cualquier cardio futuro), y una mancuerna para todo lo demás. El color
sigue al tipo de movimiento (azul empuje, ámbar tirón), igual que la
franja de la izquierda de cada fila — así se agrupan de un vistazo sin
depender de un dibujo distinto por máquina.

La columna `weights_exercises.icon` sigue existiendo como override
manual: si alguien escribe su propio emoji en la ficha de una máquina,
ese emoji sustituye al pictograma automático solo para esa fila.

## Velocidad: nunca esperar a la red

Medido con 800 ms de latencia simulada a Supabase (lo normal en el wifi
de un gimnasio): guardar el feedback de un ejercicio pasó de 812 ms a
~6 ms de pantalla a pantalla, terminar sesión de 3,2 s a ~5 ms, y abrir
la app por segunda vez de 2,5 s a ~0,1 s. Tres piezas:

- **Bandeja de salida** (`state.outbox`): toda escritura (feedback,
  cardio, duración, cierre de sesión) se apunta en localStorage y la
  pantalla cambia al momento; `flushOutbox()` la envía por detrás, en
  orden, y reintenta sola (cada 20 s, al volver la red, al abrir la
  app). Los inserts llevan un `client_id` único con índice único en
  `weights_session_exercises`: si la respuesta se pierde pero el
  servidor ya lo tenía, el 23505 cuenta como enviado y no se duplica.
  Una píldora "N cambios por guardar" avisa mientras haya algo
  pendiente. Lo único que sigue esperando a la red es crear la sesión
  (hace falta su id), y el botón lo dice ("Un segundo…").
- **Copia local de datos** (`weights_data_cache_v1`): catálogo,
  historial y sesiones se guardan al cargar; la app arranca con eso al
  instante y refresca por detrás (`refreshData()`), repintando la
  pantalla si cambió algo.
- **Service worker stale-while-revalidate**: sirve el shell desde caché
  al instante y comprueba por detrás si `index.html` cambió; si sí,
  manda `new-version` a la página, que se recarga sola en inicio sin
  sesión o muestra "Hay una versión nueva · toca para actualizar" si
  estás en mitad de un entrenamiento.

Además, sin fuente externa (Google Fonts): fuente del sistema, una
petición menos en cada arranque y un look más limpio.

## Resiliencia de red

El wifi/datos del gimnasio corta a ratos. Toda escritura a Supabase
(guardar peso, feedback, cardio, notas, borrar un entrenamiento…) pasa
por `withRetry`: si el fallo es de red (`TypeError: Load failed`,
`Failed to fetch`…) reintenta sola hasta 3 veces con una espera corta
entre cada una, sin que el usuario vea nada. Solo si las tres fallan se
muestra un aviso — y en lenguaje llano ("sin conexión, inténtalo de
nuevo"), no el texto crudo del error. El estado no se pierde mientras
tanto: si aun así falla, la pantalla se queda como estaba (con el peso o
el feedback ya elegido) para poder pulsar "Guardar" otra vez.

## Cómo se ordena la lista de ejercicios

Primero se reparten en cestas, porque el orden dentro de cada una solo
tiene sentido comparado con sus iguales:

1. **Lo que tienes empezado** — el ejercicio o el cardio que has
   arrancado y aún no has terminado, arriba del todo para volver a él.
2. **Pendientes** — las máquinas de fuerza que no has hecho hoy. Esta
   es la lista de verdad, y la primera lleva la estrella.
3. **Cardio** — el cardio es el calentamiento o el remate, nunca "el
   siguiente ejercicio", así que baja siempre por debajo de la fuerza.
4. **Ya hecho hoy** — al final, por si quieres repetir algo.

Dentro de cada cesta se puntúa con tres señales:

- **Cuánto hace que no lo haces** (días de calendario, tope 21; "nunca
  lo has hecho" vale lo mismo que tres semanas). Es la señal base.
- **Músculos que ya has trabajado hoy** — resta. Se cuenta con las
  etiquetas de `MUSCLE_TAGS`, no con el texto literal, y el primer
  músculo que nombra la máquina pesa el doble que los de ayuda: así
  el "Tríceps" de *Pecho / Hombro / Tríceps* no bloquea media sala,
  pero el *Pectoral* después del *Press de Pecho* sí cae al fondo.
- **Alternar empuje y tirón** con el último ejercicio de fuerza que
  hiciste — pesa mucho si fue hoy (descanso entre máquinas) y la mitad
  si fue en el entrenamiento anterior. Si tienes una máquina **en
  marcha** (superserie), esa cuenta como "lo último", y sus músculos
  como ya trabajados hoy: lo siguiente se elige para ir bien con lo que
  estás haciendo ahora.

Cada fila enseña en una línea la razón de estar donde está ("descansas
del tirón de Remo", "hoy ya has trabajado pecho", "9 días sin
hacerlo"), en verde si empuja hacia arriba y en ámbar si la frena.

## Superseries (varias máquinas en marcha a la vez)

Se pueden tener varios ejercicios empezados a la vez. El estado guarda
`currentExerciseId` (la máquina que tienes en pantalla) y `active`, un
mapa `{ id: { startedAt, weight } }` con todas las abiertas:

- Una entrada **con** `startedAt` está en marcha: sigue en marcha
  aunque salgas a la lista o abras otra máquina, con su peso y su
  cronómetro intactos.
- Una entrada **sin** `startedAt` es solo la que estás mirando; se
  descarta al salir de ella sin pulsar Start.
- En la lista, las que están en marcha van arriba del todo bajo
  "⏱ En marcha · superserie de N", y el resto bajo "▶ Lo siguiente".
- En la pantalla de ejercicio, la fila "También en marcha" enseña las
  otras de la superserie con su cronómetro; tocándolas saltas a ellas.
- Al terminar una (feedback guardado) se quita de `active`; las demás
  siguen en marcha. Sobrevive a recargar la página.

`migrateState()` convierte el formato anterior (un solo ejercicio con
`currentExerciseStartedAt`/`currentWeightDraft`) a `active`, para no
perder un ejercicio a medias al actualizar la app.

## Misma máquina, varios ejercicios (estaciones)

La columna `station` de `weights_exercises` agrupa filas que son la misma
máquina física. Ahora mismo `asistida` une **Ascenso Asistido** (dominadas)
y **Descenso Asistido** (fondos): una sola pila de pesos para las dos.
Los compañeros de estación:

- van siempre **pegados** en la lista de ejercicios (el mejor puntuado
  arrastra a los demás justo detrás, dentro de su misma cesta);
- reciben un **empujón** para encadenarse: si acabas de hacer uno, el
  otro sube al primer puesto con la razón "misma máquina que…";
- **heredan el peso**: al entrar en uno, si el último uso de la máquina
  fue con su compañero, se propone ese mismo peso tal cual; y el peso de
  referencia que fijas en el catálogo se escribe en todos a la vez.

Para las máquinas asistidas (dominadas/fondos asistidos), la lógica de
peso está invertida: menos peso en la pila = más difícil (menos
ayuda), así que "más difícil la próxima vez" baja el número en vez de
subirlo.

## Esquema de datos (Supabase, prefijo `weights_`)

- `weights_exercises`: catálogo de máquinas/ejercicios (nombre, grupo
  muscular opcional, tipo de movimiento push/pull/cardio/otro, si es
  asistida, y el incremento de peso típico).
- `weights_sessions`: una fila por entrenamiento (duración planeada,
  minutos de cardio, inicio/fin).
- `weights_session_exercises`: una fila por ejercicio hecho dentro de
  una sesión (peso usado, series, repeticiones, y la preferencia
  "más/igual/menos" para la próxima vez).

Añadir una máquina nueva es una fila en `weights_exercises` — no hace
falta tocar el código de la app.

## Configuración

Igual que el resto de apps de este hosting: [`config.js`](./config.js)
tiene la URL y la anon key de Supabase (públicas, protegidas por RLS).
Ver el [README de la raíz](../README.md) para cómo desplegar y cómo
instalar la PWA en el iPhone.
