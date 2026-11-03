# Science · Unit 1: Living organisms

App de estudio para el examen de Science de 3.º de primaria (unidad *Living
organisms*): explica, pregunta y, si falla, vuelve a explicar con los dibujos
de la ficha del colegio y del libro. Juego infinito y adaptativo.

- **URL:** https://pacosql.github.io/Train/science/ — alumno en `/science/alumno/`, padre en `/science/padre/`
- **Tablas (Supabase compartido):** `science_learner`, `science_answer`, `science_event` — ver [`supabase/001_esquema.sql`](./supabase/001_esquema.sql)

## Qué hay

| | |
|---|---|
| Temas | 8: seres vivos e inertes, las 3 funciones vitales, células, célula vegetal, célula animal, vegetal contra animal, niveles de organización, los cinco reinos |
| Conceptos | 53, cada uno con su explicación en español para niños y las frases de la ficha/libro en inglés |
| Preguntas | ≈300 de 8 tipos: opciones, verdadero/falso, **poner el nombre en la caja del dibujo**, **escribir la palabra** con fichas de letras, **tocar la parte** en el dibujo, número del dibujo del libro, elegir el dibujo correcto, ordenar |
| Lecciones | una por tema (diapositivas con los dibujos, zoom y resaltado de cada parte, lectura en voz alta) |

## Cómo funciona

- `banco.js`: todo el contenido (temas, lecciones, conceptos y preguntas). Las
  palabras entre `[[…]]` se ven en azul, se tocan para oírlas en inglés y el
  botón «Léemelo» las lee con voz inglesa y el resto con voz española.
- `comun.js`: motor común. Un concepto pasa a «lo sabe» con 2 aciertos seguidos
  (3 en los de dibujos y en los de dos opciones; en las partes de la célula,
  además, tiene que haber escrito bien la palabra una vez); al fallar vuelve a «lo falla»,
  se explica y la misma idea vuelve 3 preguntas después con otra variante.
  «Jugar» introduce los temas en orden (con su lección la primera vez), mezcla
  repasos y nunca se acaba; cada 10 preguntas propone parar.
- Las células de la ficha llevan un **mapa de partes** (`img/cells/*-map.png`,
  valor del píxel ÷ 25 = parte) con el que se resalta cada parte y se sabe qué
  ha tocado la niña. Las cajas y los puntos de las líneas guía están en
  `banco.js` (`CELLS`).
- **Examen de prueba**: 14 preguntas repartidas por temas, sin corregir hasta
  el final, con nota y corrección; la nota queda en `science_event`.
- **Padre**: ¿está lista?, dominio por tema, lo que falla con sus respuestas
  equivocadas, últimos fallos, exámenes, días y minutos practicados.

## Imágenes

Los recortes de `img/` salen de dos fotos de la ficha del colegio y del PDF
escaneado del libro (págs. 6-19), enderezados y limpiados con los scripts de
`tools/` (rectificación de perspectiva con ajuste de bordes, curva de «tinta»,
segmentación de las partes de la célula). Los originales **no están en el
repo** porque es público: para regenerar, ponlos en `science/work/`
(ignorado por git) y ajusta las rutas de `tools/`. `tools/` no se publica.

Las respuestas de los ejercicios de *listening* del libro (sin audio) se han
deducido del texto: p. ej., «The nucleus is similar to the cell's heart» se
da como falsa (el núcleo es el centro de control, como el cerebro).
