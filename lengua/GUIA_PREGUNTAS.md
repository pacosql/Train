# Guía para escribir preguntas de Lengua (oposición Secundaria, Murcia)

La usan quien escribe el banco inicial (`semilla/`) y la rutina de cada
noche. Léela entera antes de escribir una sola pregunta.

## Para qué es

Carmen prepara la oposición de **Profesorado de Secundaria, Lengua
Castellana y Literatura (590-004), Región de Murcia**. En Murcia la prueba
única tiene:

- **Desarrollo de un tema** del temario (2 h): conocimiento profundo,
  rigor conceptual, bibliografía.
- **Ejercicio práctico** (2 h): **Ejercicio 1, comentario de texto
  literario** (se puntúa expresamente "identificación y justificación de
  la época histórica y de la corriente o movimiento literario", técnicas
  del comentario, conceptos de lingüística, historia y teoría literaria) y
  **Ejercicio 2, comentario lingüístico y pragmático** (análisis en todos
  los niveles de la lengua: fónico, morfológico, sintáctico,
  léxico-semántico, textual-pragmático; adecuación, coherencia, cohesión;
  y en algunas cuestiones, su uso didáctico en el aula).
- **Corrección lingüística**: cada falta de ortografía resta 0,5 puntos
  (tres tildes = una falta; también puntuación, concordancia, preposiciones,
  marcadores), hasta 3 puntos por ejercicio.

Las preguntas son un entrenamiento rápido tipo test para que reconozca al
vuelo lo que luego tiene que desarrollar por escrito.

## Formato (JSON)

Un array de objetos:

```json
{
  "id": "metrica-014",
  "area": "metrica",
  "nivel": 2,
  "q": "¿Qué estrofa es: 4 versos, 7a 11B 7a 11B?",
  "txt": null,
  "o": ["Serventesio", "Cuarteto", "Lira", "Redondilla"],
  "a": 0,
  "why": "Mezcla de heptasílabos y endecasílabos con rima cruzada ABAB... "
}
```

- `id`: `<area>-<nnn>` (3 cifras). Nunca se reutiliza ni se renumera.
- `nivel`: 1 = básico (lo que domina un graduado), 2 = medio (lo que
  exige el tribunal), 3 = fino (matices de la NGLE, autores y obras menos
  obvios, distinciones sutiles).
- `q`: **corta** (máx. ~100 caracteres). Directa, sin "¿Cuál de las
  siguientes opciones…". Se tiene que leer en 3 segundos.
- `txt`: fragmento opcional (máx. ~180 caracteres) para reconocer, analizar
  o localizar algo. **Solo citas que conozcas literalmente con total
  seguridad** (las famosas). Si dudas de la letra exacta, no cites: describe
  rasgos o inventa una frase de ejemplo propia (marca nada; una oración de
  ejemplo inventada vale para sintaxis/morfología/pragmática).
- `o`: exactamente 4 opciones, cortas (ideal ≤ 6 palabras), del mismo tipo
  y longitud parecida, sin "todas las anteriores"/"ninguna". Los
  distractores deben ser **plausibles**: errores típicos de opositor
  (confundir CRV con CC, silva con lira, Garcilaso con Boscán,
  Generación del 98 con Modernismo, deixis con anáfora…).
- `a`: índice (0–3) de la correcta. La app baraja las opciones.
- `why`: explicación de 1–2 frases (máx. ~240 caracteres) que **enseña**:
  por qué es la correcta y, si ayuda, por qué el distractor más tentador no
  lo es. Debe servir para no volver a fallarla.

## Rigor

- Una sola respuesta defendible. Si hay debate entre gramáticas, usa la
  terminología de la **NGLE (RAE-ASALE 2009)** y la **Ortografía de 2010**,
  y no preguntes lo discutible.
- Fechas, autores, obras y atribuciones verificables. Ante la duda, no la
  escribas.
- Ortografía impecable en todo (es un examen que penaliza las faltas).
- Nada de copiar preguntas de academias o libros: redacción propia.

## Áreas

| área | qué cubre |
|---|---|
| `epoca` | Reconocer época y movimiento por un fragmento o por rasgos (medieval, Renacimiento, Barroco, Ilustración, Romanticismo, Realismo/Naturalismo, Modernismo, 98, Novecentismo, Vanguardias, 27, posguerra, novela social, experimental, actual). |
| `autor` | Autores y obras: quién escribió qué, obra por argumento/personaje/verso famoso, generaciones y grupos, fechas clave. |
| `metrica` | Cómputo silábico (sinalefa, diéresis, sinéresis, final aguda/esdrújula), rima, estrofas y poemas estróficos, versos de arte mayor/menor, verso libre. |
| `retorica` | Figuras retóricas y tropos (metáfora pura/impura, sinestesia, hipérbaton, zeugma, quiasmo, anáfora, polisíndeton, metonimia, sinécdoque, paradoja, oxímoron, antítesis…). |
| `generos` | Géneros y subgéneros, narratología (narrador, focalización, tiempo, estructura), teatro, ensayo, técnicas del comentario literario. |
| `morfologia` | Categorías, formación de palabras (derivación, composición, parasíntesis), morfemas, perífrasis, valores de *se*, *que*, *como*, *lo*. |
| `sintaxis` | Funciones (CD, CI, CRV, atributo, CPred, CAg, CC), oraciones simples y compuestas, subordinadas (sustantivas, de relativo, adverbiales), impersonales, pasivas reflejas. |
| `lexico` | Léxico-semántica: polisemia, homonimia, sinonimia, antonimia, hiperonimia, campo semántico, connotación, cultismo/patrimonial/semicultismo, préstamos, neologismos, eufemismo, cambio semántico. |
| `texto` | Lingüística textual y pragmática: adecuación, coherencia, cohesión (deixis, anáfora/catáfora, elipsis, marcadores), modalización, funciones del lenguaje, tipologías y géneros textuales, actos de habla, Grice, cortesía, polifonía, tema/rema. |
| `norma` | Ortografía y norma (tildes, diacríticas, puntuación, mayúsculas, dequeísmo, leísmo/laísmo, concordancias, *haber* impersonal, gerundio). |
| `historia` | Historia de la lengua y variedades: del latín al castellano, evolución fonética, Nebrija, RAE, dialectos (murciano, andaluz, canario), español de América, bilingüismo, registros. |
| `aula` | Didáctica: el comentario de texto en el aula, LOMLOE (competencias específicas, saberes básicos, situaciones de aprendizaje, criterios de evaluación), atención a la diversidad, lectura y plan lector. Solo datos seguros (no inventes números de decretos). |
