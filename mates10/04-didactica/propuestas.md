# Propuestas: técnicas de aprendizaje y adaptatividad que el documento no tiene

Complementa a `tecnicas.json`. Cada propuesta cita el `codigo` de la fuente archivada en `mates10_fuente`
(texto en `mates10/fuentes/text/<id>/texto.txt`). Lo que es criterio nuestro y no sale de la fuente va marcado
**(criterio)**. Coste: **bajo** = SQL o reglas sobre tablas que ya existen; **medio** = contenido nuevo o una
mecánica nueva; **alto** = modelo que hay que entrenar o mucho contenido.

## Resumen: las cinco más prometedoras

| # | Propuesta | Por qué | Coste |
|---|---|---|---|
| 1 | Elo alumno–ejercicio + ejercicio a la dificultad justa (`ELO`, `DIFICULTAD_OBJETIVO`) | Calibra la dificultad de miles de ejercicios generados sin pilotarlos; probado en aritmética infantil (Math Garden) | bajo |
| 2 | FSRS-5 por habilidad (`FSRS`) | Calendario de repaso con fórmulas publicadas y parámetros por defecto; sustituye al "1, 4, 10, 25, 60" del apéndice | bajo |
| 3 | Pistas escalonadas y corrección por pasos (`PISTA_ESCALONADA`, `TUTOR_POR_PASOS`) | Las ayudas paso a paso casi igualan a un tutor humano (VanLehn); ASSISTments mejora más a los flojos | medio |
| 4 | Frontera aprendible y prueba de nivel por espacios de conocimiento (`FRONTERA_APRENDIBLE`, `KST`, `CAT_IRT`) | Usa el grafo de prerrequisitos que ya existe para decidir qué es nuevo y acortar la prueba de nivel | bajo |
| 5 | Fluidez con tiempo en hechos ya dominados (`FLUIDEZ_CRONOMETRADA`, `PUNTUACION_VELOCIDAD`) | La automatización de hechos es el cuello de botella de primaria; Kumon, Math Garden y la guía IES coinciden | bajo |

---

## A. Modelos del alumno y calendario (tipo `algoritmo_tutor`)

### A1. Elo alumno–ejercicio (Math Garden / Rekentuin)
- **Qué es.** Cada alumno tiene una habilidad θ y cada ejercicio una dificultad d. P(acierto) = 1/(1+e^−(θ−d)); tras
  cada intento θ sube y d baja en K·(resultado − P). Con k opciones, P = 1/k + (1−1/k)·logística. K decreciente con el
  número de respuestas: U(n) = a/(1+b·n), a = 1, b = 0,05.
- **Evidencia.** Math Garden lo usa para aritmética infantil y calibra ítems sobre la marcha (Klinkenberg et al. 2011,
  solo resumen archivado); Pelánek (2016) lo revisa: es sencillo, se actualiza en línea y, en sus datos, con unas 10
  respuestas por alumno ya da estimaciones razonables.
- **Fuente.** `ART-PELANEK-2016-ELO`, `ART-KLINKENBERG-2011`, `ART-PELANEK-2017-OVERVIEW`.
- **Encaje.** Dos columnas: `ejercicio.dificultad_elo`, `alumno_habilidad.theta` (o por familia). Resuelve un
  problema que el documento no trata: la dificultad de los ejercicios generados por plantilla. Alimenta
  `DIFICULTAD_OBJETIVO` (elegir el ejercicio con P ≈ 0,8) y la prueba de nivel.
- **Coste.** Bajo (una función SQL por intento).

### A2. FSRS-5 en lugar de intervalos fijos
- **Qué es.** Modelo de memoria con dificultad D, estabilidad S y recuperabilidad R = (1 + 19/81·t/S)^−0,5. Se repasa
  cuando R cae a la retención objetivo (0,9). Fórmulas completas y los 19 parámetros por defecto en
  `tecnicas.json → parametros_tutor.fsrs` (verificados contra la wiki oficial y el código de py-fsrs).
- **Evidencia.** Base empírica del espaciado: Cepeda et al. 2006 (317 experimentos) y 2008 (hueco óptimo proporcional al
  plazo). FSRS viene del modelo DHP de MaiMemo (Ye et al., KDD 2022) y es el algoritmo alternativo de Anki desde 23.10;
  Anki usa 0,9 como retención por defecto porque por encima la carga de repasos se dispara.
- **Fuente.** `DOC-FSRS-ALGORITHM`, `DOC-PYFSRS-SCHEDULER`, `DOC-FSRS4ANKI-README`, `DOC-ANKI-DECK-OPTIONS`, `ART-CEPEDA-2006`, `ART-CEPEDA-2008`.
- **Encaje.** `alumno_habilidad` ya tiene `estabilidad_dias` y `proximo_repaso`; falta `dificultad_fsrs` y la fecha del
  último repaso. Mapeo de resultado a nota 1–4 **(criterio)**: fallo = 1; acierto con pista, dudando o lento = 2;
  acierto normal = 3; acierto rápido escribiendo = 4. FSRS se diseñó para tarjetas; aplicarlo a una habilidad entera es
  **(criterio)** y hay que validarlo con la métrica de olvido a 7 y 30 días que ya prevé el módulo 04.
- **Coste.** Bajo (≈ 40 líneas de SQL). Reoptimizar los w con datos propios: medio (py-fsrs trae optimizador).

### A3. SM-2 como línea base
- **Qué es.** Intervalos 1, 6 y luego × EF (inicial 2,5, mínimo 1,3); EF' = EF + (0,1 − (5−q)(0,08 + (5−q)·0,02)); si q < 3
  se reinicia. **Fuente.** `DOC-SM2-WOZNIAK-1990`, `DOC-ANKI-FAQ-ALGORITMO`.
- **Encaje.** Solo para comparar con FSRS en el "replay" fuera de línea del módulo 05. **Coste.** Bajo.

### A4. Half-Life Regression (Duolingo)
- **Qué es.** p = 2^(−Δ/h), h = 2^(Θ·x); x son rasgos (√(1+aciertos), √(1+fallos), rasgos del ítem) y Θ se aprende de los
  datos. **Evidencia.** Menor error que Leitner y Pimsleur y +12 % de enganche diario en una prueba operativa de
  Duolingo (Settles y Meeder 2016); un trabajo de 2026 lo revisa por explicable. **Fuente.** `ART-SETTLES-MEEDER-2016`,
  `BLOG-DUOLINGO-HOWWELEARN`, `ART-HLR-REVISITED-2026`.
- **Encaje.** Cuando haya decenas de miles de intentos: permite que la mecánica, la familia o el método influyan en el
  olvido (FSRS no usa rasgos). **Coste.** Medio (entrenamiento fuera de línea).

### A5. Performance Factors Analysis como alternativa a BKT para hechos
- **Qué es.** P(acierto) = logística(β + γ·aciertos + δ·fallos). **Evidencia.** Pelánek (2017): para memoria y fluidez,
  donde el conocimiento cambia poco a poco, encajan mejor los modelos logísticos; BKT (saltar de "no sabe" a "sabe")
  encaja con comprensión de grano fino. **Fuente.** `ART-PELANEK-2017-OVERVIEW`.
- **Encaje.** El documento usa BKT para todo; propuesta: BKT en razonamiento y procedimientos, Elo/PFA en hechos.
  **Coste.** Bajo.

### A6. BKT con valores iniciales y ajuste
- Ya está en el documento (apéndice A). Aquí se añaden valores concretos (p(L0) 0,1; p(T) 0,15; p(G) 0,05 escribiendo y
  1/k con opciones; p(S) 0,1) **(criterio, apoyado en los ajustes y simulaciones de pyBKT)** y la ecuación de Corbett y
  Anderson, que usaban 0,95 como umbral de dominio (el documento dice 0,85). **Fuente.** `ART-CORBETT-ANDERSON-1994`,
  `ART-PYBKT-2021`. Reajuste mensual por familia con pyBKT. **Coste.** Bajo.

### A7. Espacios de conocimiento (ALEKS) y test adaptativo
- **Qué es.** El estado del alumno es un conjunto de habilidades dominadas coherente con los prerrequisitos; se resume en
  "frontera interior" (lo último aprendido) y "frontera exterior" (lo que está preparado para aprender). Un test adaptativo
  elige cada pregunta para que sea la más informativa y para cuando la estimación es precisa.
- **Evidencia/fuente.** `ART-FALMAGNE-2015-KST`, `DOC-ALEKS-KST`, `WEB-ALEKS-KST`, `WEB-WIKI-CAT` (confianza media).
- **Encaje.** La búsqueda binaria de la prueba de nivel ya es un CAT simplificado; con el grafo `habilidad_prerrequisito`
  se puede inferir: si acierta un nivel, se dan por probables sus prerrequisitos; si falla, se descartan sus dependientes.
  La frontera exterior es la lista de candidatas de la regla 4 (Avance) y una forma muy clara de enseñar al padre
  "lo que ya puede aprender". **Coste.** Bajo.

### A8. Deep Knowledge Tracing (no ahora)
- Red recurrente que predice mejor con muchos datos pero no es interpretable (`ART-PIECH-2015-DKT`). Solo para
  evaluación fuera de línea cuando haya > 100 000 intentos **(criterio)**. **Coste.** Alto.

## B. Técnicas de práctica nuevas (tipo `tecnica_practica`)

### B1. Pistas escalonadas y andamiaje (ASSISTments)
- **Qué es.** Tras un fallo: pista general → pista específica → paso resuelto, o partir el problema en subpreguntas.
- **Evidencia.** Ensayo aleatorizado con 2 850 alumnos de 7.º: g = 0,18 en prueba estandarizada, más en alumnos con bajo
  nivel previo (Roschelle et al. 2016). VanLehn (2011): tutores con ayuda por pasos d ≈ 0,76 frente a 0,31 de los que solo
  corrigen la respuesta; humano 0,79. **Fuente.** `ART-ROSCHELLE-2016-ASSISTMENTS`, `ART-VANLEHN-2011-SLIDES` (transparencias
  del autor; el artículo no se pudo descargar).
- **Encaje.** Nuevo campo `plantilla.pistas` (lista ordenada) y registro de `intento.uso_pista` (ya previsto en el módulo
  05). Un acierto con pista cuenta como nota 2 en FSRS. **Coste.** Medio (hay que escribir pistas por plantilla).

### B2. Fluidez con tiempo objetivo (Kumon + Math Garden + IES)
- **Qué es.** Para hechos ya acertados, práctica con tiempo de referencia hasta que salen rápido; puntuación "high speed,
  high stakes" S = (2·correcto − 1)·(a·d_lim − a·t) cuando el cronómetro es visible.
- **Evidencia.** La guía IES de intervención recomienda unos 10 minutos por sesión de recuperación fluida de hechos;
  Kumon usa un tiempo estándar por hoja para decidir si se repite; Math Garden puntúa así el tiempo. **Fuente.**
  `GUIA-IES-RTI-MATH-2009`, `BLOG-KUMON-SCT`, `ART-PELANEK-2016-ELO`.
- **Encaje.** Solo con `p_dominio ≥ 0,85` y nunca en habilidades en `introduce` (el documento ya prohíbe cronómetro ahí).
  **Coste.** Bajo.

### B3. Producir antes que elegir
- **Evidencia.** Efecto test (Roediger y Karpicke 2006), también en niños de 10 años con independencia de su comprensión
  lectora (Karpicke et al. 2016); efecto de generación (Bjork y Bjork 2011). **Fuente.** `ART-ROEDIGER-KARPICKE-2006`,
  `ART-KARPICKE-2016-NINOS`, `ART-BJORK-2011`. **Encaje.** Regla de selección de mecánica: teclado por defecto; opciones solo
  al principio o si el alumno está adivinando. **Coste.** Bajo.

### B4. Autoexplicación ("¿por qué?")
- **Evidencia.** En niños de 8–11 años la autoexplicación mejoró el aprendizaje y la transferencia (Rittle-Johnson 2006);
  utilidad moderada según Dunlosky et al. (2013); recomendación 7 de la guía IES (preguntas profundas). El trabajo clásico de
  Chi (1994) no se pudo descargar. **Fuente.** `ART-RITTLE-JOHNSON-2006`, `ART-DUNLOSKY-2013`, `GUIA-IES-PASHLER-2007`.
- **Encaje.** Mecánica de opción múltiple "¿qué regla has usado?" cada 3–6 aciertos en razonamiento, procedimientos y
  problemas **(criterio)**. **Coste.** Medio (justificaciones por plantilla).

### B5. Ejemplo resuelto con desvanecimiento hacia atrás
- El documento tiene EJEMPLO_RESUELTO; lo nuevo es el desvanecimiento (ocultar primero el último paso, luego los dos
  últimos…) y retirarlo cuando el alumno ya sabe (efecto de inversión por pericia). **Fuente.** `ART-ATKINSON-2000`,
  `ART-REISSLEIN-ATKINSON-2006`, `GUIA-IES-PASHLER-2007` (recomendación 2). **Coste.** Medio.

### B6. Repaso de mis errores (Duolingo)
- Lo fallado en los últimos 7 días vuelve con otros números al principio de una sesión posterior. Duolingo tiene una
  práctica específica de "Errores". **Fuente.** `BLOG-DUOLINGO-PRACTICEHUB`. Ventana y número **(criterio)**. **Coste.** Bajo.

### B7. Confirmar el dominio en mezcla (Khan Academy)
- Solo se marca "dominada" si además de superar el umbral acierta otro día en una sesión mixta. Khan pone el aprendizaje
  para el dominio en el centro y exige demostrarlo en evaluaciones que mezclan habilidades. **Fuente.** `WEB-EDSURGE-KHAN-2020`,
  `BLOG-KHAN-MASTERY`, `ART-ROHRER-TAYLOR-2007`. La página de ayuda de Khan con los niveles Familiar/Proficient/Mastered
  bloquea la descarga (403) y no se usa. **Coste.** Bajo.

### B8. Empezar por debajo (Kumon) y pregunta previa (IES)
- Al entrar en una familia, 1 nivel por debajo del situado hasta 3 aciertos (`WEB-KUMON-ES-METODO`). Antes de explicar algo
  nuevo, un intento sin ayuda que no cuenta para el modelo (`GUIA-IES-PASHLER-2007`, recomendación 5a). **Coste.** Bajo.

### B9. Fracaso productivo (Kapur), solo secundaria
- **Qué es.** Problema rico antes de la instrucción, para conceptos. **Evidencia.** Metaanálisis de Sinha y Kapur (2021;
  > 12 000 participantes, 166 comparaciones): mejor comprensión y transferencia sin perder fluidez procedimental,
  mayores efectos desde secundaria y solo con diseño fiel. **Fuente.** `ART-KAPUR-UNH` (resumen del propio Kapur
  publicado por la UNH; confianza media), `WEB-KAPUR-HOME`. **Encaje.** Solo razonamiento y problemas, ≥ 12 años.
  **Coste.** Alto (problemas ricos bien diseñados, difícil de automatizar).

## C. Principios (tipo `principio`)

- **Regla del 85 %.** Wilson et al. (2019) demuestran que en aprendizaje por gradiente la tasa de error óptima es ≈ 15,87 %
  (≈ 85 % de acierto). Da base al termostato 80–85 % del documento, pero no está medido con niños: ajustar con datos.
  `ART-WILSON-2019-85`.
- **Dificultades deseables.** Espaciar, intercalar, generar y examinarse empeoran el rendimiento inmediato y mejoran la
  retención (`ART-BJORK-2011`). Consecuencia: medir aprendizaje con repasos diferidos, no con el acierto en la sesión, y
  explicárselo al padre.
- **Feedback sobre la tarea, no sobre la persona.** Efecto medio 0,79, pero el elogio personal apenas ayuda
  (`ART-HATTIE-TIMPERLEY-2007`); feedback elaborado y sin comparar con otros (`ART-SHUTE-2008`). Afecta a los textos de
  refuerzo del módulo 06: "has llevado bien la decena", no "¡qué listo!".
- **Tutor por pasos.** Ver B1 (`ART-VANLEHN-2011-SLIDES`, `ART-KOEDINGER-1997`: +15 % en pruebas estandarizadas en
  institutos de Pittsburgh).
- **Dominio, con cautela.** Bloom: +1 sigma mastery learning, +2 sigma tutoría (`ART-BLOOM-1984`); Slavin (1987) no
  encuentra efecto en pruebas estandarizadas en la versión grupal (`ART-SLAVIN-1987`). Medirlo con la métrica "llega
  preparado a clase" del módulo 05.
- **Varias estrategias conviven** (olas superpuestas de Siegler, vía `ART-CAVIOLA-2018-ESTRATEGIAS`): no penalizar
  estrategias correctas distintas de la del método (ABN/tradicional); registrar cuál usa.
- **Intercalado en primaria.** Mezclar tipos de resta aumentó el uso de atajos de cálculo (`ART-NEMETH-2019-INTERCALADO`).
- **Espaciado proporcional al plazo** (`ART-CEPEDA-2008`): en modo examen, planificar repasos hacia atrás desde la fecha
  (hueco ≈ 20 % de los días que faltan) **(criterio sobre el dato de Cepeda)**.

## D. Qué tomar de cada producto

| Producto | Qué tomar | Qué no | Fuente |
|---|---|---|---|
| **Duolingo** | Modelo de olvido con rasgos (HLR) cuando haya datos; modelo conjunto alumno–ejercicio (Birdbrain; parecido a Elo, **criterio**) para elegir ejercicios a la dificultad justa; práctica de "Errores"; sesiones cortas; decidir cambios del tutor con pruebas A/B midiendo aprendizaje y enganche a la vez | Mecánicas de presión (vidas, rachas agresivas) sin evidencia de aprendizaje | `ART-SETTLES-MEEDER-2016`, `BLOG-DUOLINGO-BIRDBRAIN`, `BLOG-DUOLINGO-HOWWELEARN`, `BLOG-DUOLINGO-PRACTICEHUB`, `BLOG-DUOLINGO-SPACED` |
| **Khan Academy** | Dominio como núcleo; confirmar el dominio en evaluaciones mixtas y dejar que baje si se falla después; mapa de habilidades visible | Niveles/puntos concretos: su página de ayuda no se pudo archivar | `WEB-EDSURGE-KHAN-2020`, `BLOG-KHAN-MASTERY` |
| **ALEKS** | Frontera exterior ("preparado para aprender") para elegir lo nuevo y para el informe al padre; evaluación inicial y reevaluaciones periódicas apoyadas en el grafo de prerrequisitos | Construir a mano todos los estados: basta con el grafo de prerrequisitos | `DOC-ALEKS-KST`, `WEB-ALEKS-KST`, `ART-FALMAGNE-2015-KST` |
| **Smartick** | 2–3 sesiones iniciales de nivel; sesión diaria de 15 minutos generada para cada niño; informe diario | Nada técnico es público: no copiar supuestos | `WEB-SMARTICK-HOME` |
| **Math Garden (Rekentuin)** | Elo alumno–ejercicio con calibración sobre la marcha; puntuación de velocidad cuando el tiempo es visible; incertidumbre que crece con los días sin practicar | El texto completo no se pudo archivar; fórmulas tomadas de Pelánek | `ART-KLINKENBERG-2011`, `ART-PELANEK-2016-ELO` |
| **Kumon** | Empezar en un nivel cómodo; pasos muy pequeños; tiempo estándar para decidir si repetir; práctica diaria; orientador que da pistas en vez de soluciones | Repetición de hojas enteras idénticas (el intercalado y el espaciado lo hacen mejor) | `WEB-KUMON-ES-METODO`, `BLOG-KUMON-SCT`, `DOC-KUMON-BROCHURE` |
| **Anki** | FSRS con retención objetivo 0,9 (por defecto de Anki); SM-2 como alternativa simple; reoptimizar parámetros con el historial | Que el alumno se autocalifique (Again/Hard/Good/Easy): en Mates10 la nota sale del acierto, el tiempo y el uso de pista | `DOC-ANKI-DECK-OPTIONS`, `DOC-ANKI-FAQ-ALGORITMO`, `DOC-FSRS-ALGORITHM`, `DOC-SM2-WOZNIAK-1990` |

## E. Fuentes buscadas que no se han podido usar

- Página de ayuda de Khan Academy sobre niveles de dominio (403 desde este entorno).
- Klinkenberg et al. 2011, texto completo (solo resumen en UvA-DARE; archivado con confianza media).
- VanLehn 2011, artículo (se usan sus transparencias de ICCE 2011).
- Chi et al. 1994 y 1989 (sin copia descargable; la ficha de ASU no tenía resumen y se retiró).
- Rohrer 2012 (Educational Psychology Review) y el metaanálisis de Bertsch et al. 2007 sobre el efecto de generación.
- Sinha y Kapur 2021 y Kapur 2008/2014 originales (se usa el resumen del propio Kapur).
- Siegler (olas superpuestas) original; se usa un estudio que aplica su modelo (Caviola et al. 2018).
- Burns (repaso incremental de hechos, 1 desconocido por 7–9 conocidos): no se encontró copia descargable; sería una buena
  técnica para tablas si aparece la fuente.
- Corbett y Anderson 1994 y Bloom 1984 son PDF escaneados sin texto: se leyeron en imagen las páginas citadas (anotado
  en `notas` de la fuente, confianza media).
