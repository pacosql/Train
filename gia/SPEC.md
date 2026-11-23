# Thomas GIA: especificación para una app de práctica

Documento de contexto para Claude Code. Recoge todo lo que se ha podido averiguar sobre el formato del Thomas GIA (también llamado Thomas Aptitude) a 23 nov 2026, a partir de los cuadernillos oficiales, informes de ejemplo de Thomas, la web de Canonical, guías de preparación y relatos de candidatos.

**Objetivo de la app:** que Paco practique las cinco tareas en español, con ratón, contra reloj, y vea su puntuación ajustada y su ritmo. Hace el test real el 24 nov 2026, así que importa más la fidelidad del formato y de la puntuación que el acabado.

## 0. Avisos

- **No existen preguntas reales publicadas.** Ningún foro ni guía recoge ítems literales fiables, y no hacen falta: cuatro de las cinco tareas se generan por regla. Solo la de palabras necesita un banco propio.
- La app es una herramienta de práctica **no oficial**. No debe usar la marca ni el diseño de Thomas ni decir que reproduce el test real.
- Cada dato lleva una etiqueta de fiabilidad:
  - **[Thomas]** cuadernillos oficiales 2021 y 2025 (idénticos en contenido) o web de Thomas.
  - **[Informe]** deducido de informes de ejemplo emitidos por Thomas.
  - **[Canonical]** correo del reclutador o FAQ de candidatos de Canonical.
  - **[Guía]** sitios de preparación comerciales. Se contradicen entre sí; tratar como orientativo.
  - **[Candidato]** relato en primera persona (blog, Glassdoor).
  - **[Supuesto]** decisión de diseño razonable donde no hay dato. Hacerla configurable.

## 1. Estructura de la sesión

| Dato | Valor | Fuente |
|---|---|---|
| Tareas | 5, en orden fijo: Razonamiento, Velocidad perceptiva, Velocidad y precisión numérica, Significado de palabras, Visualización espacial | [Thomas] |
| Antes de cada tarea | Pantalla de instrucciones con demostración + **8 ítems de práctica** que no puntúan | [Thomas] |
| Duración de cada tarea | Entre 2 y 5 minutos de reloj | [Thomas] |
| Duración total | 30-45 min con instrucciones (el correo de Canonical dice 40-45) | [Thomas] [Canonical] |
| Número de preguntas | **No hay número fijo.** La tarea sirve ítems hasta que se acaba el tiempo | [Informe] [Guía] |
| Generación | Ítems generados por algoritmo, no adaptativos (la dificultad no cambia según aciertos) | [Guía] |
| Entrada | Solo clics de ratón. Sin teclado | [Thomas] |
| Dispositivo | Ordenador. Puede pedir el tamaño de pantalla al empezar. Se recomienda ratón físico | [Thomas] |
| Volver atrás / revisar | No hay botón de atrás ni pantalla de revisión | [Guía] |
| Idiomas | Disponible en muchos idiomas (26+). Canonical pide hacerlo en lengua materna | [Canonical] |
| Reloj visible, barra de progreso, feedback por ítem | **Desconocido** | — |

**Duración por tarea.** Thomas no la publica. La cifra más repetida en guías es **5 / 2 / 2 / 3 / 2 minutos** (14 min en total), y encaja con el número de ítems completados que muestran los informes de Thomas (ver sección 4). Otras guías dan cifras distintas. Una candidata menciona «2:40» en la tarea espacial sin aclarar si era el límite. **Usar 5/2/2/3/2 como valor por defecto y dejarlo configurable.** [Guía] [Supuesto]

**Decisiones por defecto para lo desconocido** [Supuesto]:
- En las tareas cronometradas, sin feedback de acierto/fallo por ítem (sí en los 8 de práctica).
- Reloj visible opcional (interruptor). Entrenar también con el reloj oculto.
- Al terminar el tiempo, corta aunque haya un ítem en pantalla; ese ítem no cuenta.

## 2. Las cinco tareas

### 2.1 Razonamiento

**Pantalla** [Thomas]:
1. Una frase que compara a dos personas, y debajo dos botones **vacíos**. Texto: «Click the screen when ready to continue». El candidato puede mirarla el tiempo que quiera (el reloj corre).
2. Al hacer clic, la frase **desaparece** y aparece una pregunta con los dos nombres en los botones. Clic en un nombre y pasa al siguiente ítem.

**Ejemplos oficiales (en inglés)** [Thomas]:

| Frase | Pregunta | Respuesta | Botones (izq / dcha) |
|---|---|---|---|
| Tom is heavier than Fred. | Who is heavier? | Tom | Tom / Fred |
| John is brighter than Pete. | Who is duller? | Pete | John / Pete |
| Wendy is not as strong as Rachel. | Who is weaker? | Wendy | Rachel / Wendy |
| Bob is not as happy as Paul. | Who is sadder? | Bob | Bob / Paul |

Observaciones:
- El orden de los botones **no siempre** coincide con el de la frase (tercer ejemplo). Aleatorizarlo.
- Tres niveles de dificultad: mismo adjetivo; adjetivo contrario; frase negada + adjetivo contrario.
- Pares de adjetivos vistos: heavier/lighter, stronger/weaker, brighter/duller, happy/sadder [Thomas]; taller/shorter, older [Guía].
- Opciones: 2. Penalización por fallo: 1 punto.

**Versión española: redacción exacta desconocida.** No hay cuadernillo en español accesible. Plantillas equivalentes [Supuesto]:

```
A es más X que B.          -> más X = A
A es menos X que B.        -> más X = B
A no es tan X como B.      -> más X = B
Preguntas: ¿Quién es más X?  ¿Quién es más Y (contrario)?  ¿Quién es menos X?
```

Pares sugeridos (con concordancia de género según los nombres): alto/bajo, pesado/ligero, fuerte/débil, rápido/lento, contento/triste, joven/viejo, rico/pobre, listo/torpe. Usar nombres cortos y de género claro; ambos del mismo género en cada ítem para evitar ruido de concordancia.

**Generación:** elegir 2 nombres, 1 par de adjetivos, 1 plantilla de frase, 1 tipo de pregunta, orden de botones aleatorio. Registrar el tipo (plantilla × pregunta) para analizar los fallos por patrón.

### 2.2 Velocidad perceptiva

**Pantalla** [Thomas]: cuatro columnas; en cada una, una letra arriba y otra abajo. Una fila va en mayúsculas y la otra en minúsculas (cualquiera de las dos puede ir arriba). Debajo, cinco botones: **0 1 2 3 4**. Hay que pulsar cuántas columnas contienen la misma letra, ignorando mayúsculas/minúsculas.

**Ejemplos oficiales** [Thomas]:

```
E Q D K        f d m h        b q t h        f d m h
e y d k  -> 3  F D R H  -> 3  K N J R  -> 0  Q D R H  -> 2
```

- Los no coincidentes oficiales no siempre son letras parecidas (b/K, t/J). Las guías dicen que también aparecen parejas confundibles (b/d, p/q, n/h, v/y) [Guía]. Una candidata señala Q y O como especialmente difíciles [Candidato].
- Opciones: 5. Penalización por fallo: 0,25.

**Generación** [Supuesto]: sortear cuántas coinciden (0-4, todas las respuestas posibles); para las que no coinciden, mezclar letra al azar y letra confundible (p. ej. 50/50). Confundibles: b/d/p/q, i/l/j, m/n, u/v, h/n, c/e/o, O/Q, v/y, f/t. Tipografía sans serif en negrita, columnas bien separadas.

### 2.3 Velocidad y precisión numérica

**Pantalla** [Thomas]: tres números en tres botones en fila. Hay que localizar el mayor y el menor y pulsar el que esté **más lejos** del número restante.

**Ejemplos oficiales** [Thomas]: `4 2 8 -> 8` · `12 3 5 -> 12` · `10 7 5 -> 10` · `11 13 16 -> 16`

**Ejemplos de guías** [Guía]: `14 9 11 -> 14` · `23 31 25 -> 31` · `18 12 13 -> 18` · `40 46 31 -> 31` · `13 7 19 -> ` (empate en el original citado; no usar)

- Los números salen desordenados; el intermedio nunca es correcto (pero es pulsable).
- Rango visto: de 2 a 46. Opciones: 3. Penalización: 0,5.

**Generación** [Supuesto]: menor entre 1 y 40; dos huecos distintos entre 1 y 12; **sin empates**; barajar el orden. Variar la diferencia entre huecos: cuando difieren en 1 (p. ej. huecos 5 y 6) el ítem es más difícil.

### 2.4 Significado de palabras

**Pantalla** [Thomas]: tres palabras en tres botones en fila. Dos están relacionadas; hay que pulsar la que sobra.

**Ejemplos oficiales** [Thomas]: `halt · cold · stop -> cold` (sinónimos) · `up · down · street -> street` (contrarios) · `below · under · letter -> letter` (sinónimos)

**Ejemplos de guías** [Guía]: `expand · contract · paper` · `damp · chair · wet` · `early · glove · late` · `quick · fast · table` · `heavy · apple · light` · `desolate · bright · bridge`

- Relaciones: sinónimos y contrarios. El cuadernillo dice «relacionadas de alguna manera», así que la misma categoría también es posible.
- La palabra que sobra suele ser de un campo totalmente distinto. Opciones: 3. Penalización: 0,5.
- Es la única tarea que no se puede generar por regla: necesita banco. En el test real el vocabulario puede subir de nivel [Guía].

**Banco semilla en español** (la última palabra de cada línea es la que sobra):

```
parar, detener | frío            rápido, veloz | mesa             alegre, contento | piedra
empezar, terminar | ventana      perro, gato | martillo           grande, enorme | verde
comprar, vender | nube           escaso, abundante | puntual      frágil, quebradizo | sincero
océano, mar | colina             lento, veloz | amargo            hablar, charlar | saltar
cima, cumbre | orilla            ancho, estrecho | dulce          médico, enfermero | ladrillo
susurrar, gritar | pintar        valiente, cobarde | redondo      iniciar, comenzar | romper
violín, guitarra | zapato        aceptar, rechazar | dibujar      roble, pino | tornillo
recordar, olvidar | lavar        húmedo, mojado | caro            lunes, jueves | abril
triste, apenado | lejano         entrada, salida | cuchara        antiguo, viejo | ligero
tenedor, cuchillo | almohada     premio, castigo | puente         ágil, torpe | salado
oír, escuchar | empujar          río, arroyo | montaña            construir, derribar | leer
bondad, maldad | anchura         auténtico, genuino | húmedo      vacío, lleno | suave
```

**Para ampliar el banco:** generar al menos 300 tríos en español de España, en tres niveles: (1) palabras comunes con distractor de otro campo; (2) vocabulario culto (p. ej. efímero/fugaz, locuaz/parlanchín, exiguo/escaso, diáfano/claro); (3) distractor del mismo campo semántico que una de las dos (más difícil). Mezclar sinónimos y contrarios a partes iguales. Evitar palabras polisémicas que hagan defendible otra respuesta. Barajar la posición de la palabra que sobra.

### 2.5 Visualización espacial

**Pantalla** [Thomas]: dos tarjetas blancas lado a lado. En cada una, un símbolo arriba y otro abajo. Debajo, tres botones: **0 1 2**. Hay que pulsar en cuántas tarjetas el símbolo de abajo es el **mismo** que el de arriba (se puede girar hasta coincidir). Si es su imagen en espejo, no coincide.

- Símbolo: la letra **R** y su imagen en espejo, ambas giradas [Thomas]. Una guía menciona otras letras (F, G, J) [Guía]; el resto de fuentes y los cuadernillos solo muestran R. Usar R por defecto.
- Giros vistos en los cuadernillos: múltiplos de 90° (0, 90, 180, 270) [Thomas].
- Se compara solo dentro de cada tarjeta, en vertical.
- Opciones: 3. Penalización: 0,5.

**Generación:** para cada símbolo, giro en {0, 90, 180, 270} y bandera de espejo. La tarjeta coincide si las dos banderas de espejo son iguales (normal-normal o espejo-espejo). Dibujar con una transformación (`rotate` + `scaleX(-1)`), no con el carácter Я. Evitar que los dos símbolos de una tarjeta tengan el mismo giro.

## 3. Puntuación

**Puntuación ajustada por tarea** [Informe]:

```
ajustada = aciertos - fallos / (opciones - 1)
```

| Tarea | Opciones | Resta por fallo |
|---|---|---|
| Razonamiento | 2 | 1 |
| Velocidad perceptiva | 5 | 0,25 |
| Numérica | 3 | 0,5 |
| Palabras | 3 | 0,5 |
| Espacial | 3 | 0,5 |

Esta fórmula reproduce la «Adjusted Score» impresa en los informes de Thomas (comprobado: 42 hechas y 37 bien en perceptiva da 35,75; 18 hechas y 14 bien en espacial da 12). Las preguntas sin contestar no restan.

**Informe real** [Informe] [Canonical]: por tarea muestra preguntas completadas, respuestas correctas, puntuación ajustada y percentil frente a un grupo normativo. El percentil global es una combinación **ponderada** de las cinco; los pesos no son públicos. Bandas: Bajo 4-15 · Por debajo de la media 16-34 · Media 35-65 · Por encima de la media 66-85 · Alto 86-96. El grupo normativo de Canonical: unas 16.000 personas de 18 a 73 años, renovado cada cinco años.

**Canonical** [Canonical]: no publica nota de corte. Dice que el test es un factor «razonablemente significativo» y su responsable de selección habla de candidatos «por encima de la media».

## 4. Datos de calibración

Cuatro informes de ejemplo de Thomas. Formato: hechas / bien → ajustada → percentil.

| Tarea | A: UK 2018 (baremo UK 2017) | B: España 2012 (baremo 2011) | C: 2014 (baremo 2011) | D: 2010 (baremo sin indicar) |
|---|---|---|---|---|
| Razonamiento | 53 / 52 → 51 → **93** | 48 / 46 → 44 → **76** | 38 / 38 → 38 → **44** | 48 / 46 → 44 → **88** |
| Perceptiva | 54 / 42 → 39 → **24** | 42 / 37 → 35,75 → **12** | 56 / 46 → 43,5 → **54** | 42 / 37 → 35,75 → **15** |
| Numérica | 17 / 16 → 15,5 → **57** | 12 / 12 → 12 → **34** | 19 / 19 → 19 → **85** | 12 / 12 → 12 → **47** |
| Palabras | 40 / 39 → 38,5 → **99** | 34 / 34 → 34 → **84** | 37 / 37 → 37 → **96** | 39 / 39 → 39 → **96** |
| Espacial | 14 / 13 → 12,5 → **73** | 13 / 10 → 8,5 → **43** | 18 / 14 → 12 → **71** | 12 / 10 → 9 → **26** |
| Global | **83** | **49** | **80** | **65** |

Lectura:
- **Total de ítems por sesión:** entre unos 150 y 180.
- **Ritmo** (con relojes 5/2/2/3/2): razonamiento ~6 s por ítem; perceptiva ~2,2 s; numérica ~6-7 s; palabras ~4,5 s; espacial ~7-8 s.
- **Perceptiva:** casi todos completan un número parecido; el percentil lo deciden los fallos (54 hechas con 12 fallos = 24; 56 hechas con 10 fallos = 54).
- **Razonamiento:** manda el volumen (38 perfectas = 44; 53 con un fallo = 93).
- **Espacial:** manda la precisión (18 hechas con 4 fallos puntúa menos que 14 con 1).

**Objetivos orientativos para «por encima de la media» (percentil 66+)**, interpolando estos puntos. Son estimaciones gruesas, con baremos antiguos:

| Tarea | Ajustada objetivo | En la práctica |
|---|---|---|
| Razonamiento | 44+ | ~46 hechas con 1 fallo como mucho |
| Perceptiva | 46+ | ~50 hechas con 4 fallos como mucho |
| Numérica | 16+ | ~17 hechas sin fallos |
| Palabras | 32+ | ~33 hechas con 1 fallo |
| Espacial | 12+ | ~13 hechas con 1 fallo |

**Percentil en la app:** mostrar la ajustada como dato principal y, si se quiere, un percentil **estimado** por interpolación lineal sobre estos puntos, siempre rotulado como aproximación.

## 5. Requisitos de la app

1. **Modo simulacro:** las cinco tareas en orden, cada una con instrucciones, 8 ítems de práctica sin reloj y con feedback, y luego la parte cronometrada. Duraciones por defecto 5/2/2/3/2 min, configurables.
2. **Modo entrenamiento por tarea:** una sola tarea, con duración elegible.
3. **Idioma:** español en todo (frases, preguntas, palabras, instrucciones).
4. **Solo ratón.** Botones grandes y en posición fija en todos los ítems, para que el recorrido del cursor sea constante. Sin atajos de teclado. Pensada para escritorio.
5. **Sin volver atrás.** Cada clic pasa al siguiente ítem sin demora ni animación.
6. **Razonamiento en dos pasos:** frase con botones vacíos → clic en cualquier punto → pregunta con nombres. La frase no se puede volver a ver.
7. **Resultados por tarea:** hechas, bien, mal, ajustada, segundos medios por ítem y comparación con los objetivos de la sección 4.
8. **Análisis de fallos:** en razonamiento, por tipo de frase y de pregunta; en perceptiva, por parejas confundidas; en numérica, por diferencia entre huecos; en espacial, por combinación de giros; en palabras, lista de tríos fallados.
9. **Historial** local de sesiones para ver la evolución.
10. **Ítems sin fin:** el generador no debe agotarse dentro del tiempo; no repetir ítems dentro de una sesión.

## 6. Lo que cuentan los candidatos

- Proceso de Canonical: written interview → GIA → entrevistas. El GIA se describe como un filtro real, anterior a hablar con nadie [Candidato].
- La tarea espacial es la que más gente cita como difícil; hay quien fue descartado tras el GIA y lo atribuye a ella [Candidato].
- Una candidata que practicó una semana pasó de no terminar la tarea espacial a hacerla sin fallos. Sus observaciones: le fue mejor a media mañana; cambiarse a una habitación silenciosa mejoró sus resultados; comer justo antes los empeoró; su error más frecuente era pulsar demasiado rápido; en razonamiento memorizaba un solo nombre [Candidato].
- Otro candidato: «no es muy difícil, pero conviene mirar antes el formato de las preguntas» [Candidato].

## 7. Lo que sigue sin saberse

- Redacción exacta de la versión española (razonamiento y palabras).
- Duración exacta de cada tarea y si el reloj se ve.
- Si hay feedback por ítem o barra de progreso en la parte cronometrada.
- Rango completo de números, conjunto de letras y si hay giros distintos de 90°.
- Nivel del vocabulario en español.
- Pesos de cada tarea en el percentil global y nota de corte de Canonical.

## 8. Fuentes

Oficiales:
- Cuadernillo GIA 2025: https://thomas.co/sites/default/files/2025-03/GIA%20Example%20Booklet_2025.pdf
- Cuadernillo Aptitude 2021: https://www.thomas.co/sites/default/files/2021-07/Aptitude%20Example%20Booklet_2021%20V1.pdf
- Informe A (UK 2018): https://www.thomas.co/sites/default/files/2019-09/GIA-Sample-Report-2018.pdf
- Informe B (España): https://www.thomas.co/sites/default/files/thomas-files/2022-07/GIA-ES.pdf
- Informe C (2014): https://jansen.com.ua/wp-content/uploads/2023/08/gia_en.pdf
- Informe D (2010): https://www.aaronwallis.co.uk/Thomas-International-GIA-Example.pdf
- Caso de estudio Canonical: https://www.thomas.co/case-study/canonical
- FAQ de candidatos de Canonical: https://canonical.com/careers/application/faq

No oficiales:
- https://www.jobtestprep.co.uk/thomas-international-gia
- https://www.jobtestprep.co.uk/free-thomas-gia-practice
- https://cogniprep.app/games/thomas
- https://pigment.is/blogs/blogs/thomas-aptitude-test
- https://iqmetrics.org/news/what-is-a-good-thomas-gia-score-percentiles-and-the-iq-question/
- https://medium.com/@by.anna1990/how-to-pass-thomas-international-gia-test-8cc03d21da2
- Reseñas de entrevistas de Canonical en Glassdoor

Referencia de código abierto: https://github.com/steciuk/general-intelligence-assessment (licencia MIT, Astro + React, demo en https://gia.steciuk.dev). Su autor la hizo para preparar este mismo test y avisa de que no tiene las preguntas reales.
