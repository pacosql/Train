# Secuencias de editoriales (Matemáticas LOMLOE)

Índices públicos de libros de Matemáticas LOMLOE (2022–2024) extraídos de webs oficiales de las editoriales.
Cada JSON: `{editorial, curso, proyecto, fuente_codigo, fuente_id, completo, unidades:[{n, titulo, secciones, trimestre, …}]}` más `url`, `url_pagina` y `nota`.
Cada fuente está archivada en `mates10_fuente` (código `ED-<EDITORIAL>-<CURSO>[-N]`, módulo 01) con original + texto extraído (proceso de `tools/archivar.py`).

`completo` = el documento oficial da la lista entera de unidades del curso; `parcial` = solo parte (o con huecos). Entre paréntesis, nº de unidades.

| Editorial | PRI1 | PRI2 | PRI3 | PRI4 | PRI5 | PRI6 | ESO1 | ESO2 | ESO3 | ESO4 | BAC1 | BAC2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SM | [completo](SM-PRI1.json) (9 u.) | [completo](SM-PRI2.json) (9 u.) | [completo](SM-PRI3.json) (24 u.) | [completo](SM-PRI4.json) (24 u.) | [completo](SM-PRI5.json) (24 u.) | [completo](SM-PRI6.json) (24 u.) | [completo](SM-ESO1.json) (12 u.) | [completo](SM-ESO2.json) (11 u.) | [completo](SM-ESO3.json) (11 u.) | [completo](SM-ESO4.json) (14 u.)<br>[completo](SM-ESO4-2.json) (11 u.) | [completo](SM-BAC1.json) (13 u.)<br>[completo](SM-BAC1-2.json) (14 u.)<br>[completo](SM-BAC1-3.json) (14 u.) | [completo](SM-BAC2.json) (14 u.)<br>[completo](SM-BAC2-2.json) (12 u.) |
| Santillana | [completo](SANTILLANA-PRI1.json) (10 u.) | [completo](SANTILLANA-PRI2.json) (9 u.) | [completo](SANTILLANA-PRI3.json) (12 u.) | [completo](SANTILLANA-PRI4.json) (12 u.) | [completo](SANTILLANA-PRI5.json) (12 u.) | [completo](SANTILLANA-PRI6.json) (12 u.) | [completo](SANTILLANA-ESO1.json) (12 u.) | [completo](SANTILLANA-ESO2.json) (12 u.) | [completo](SANTILLANA-ESO3.json) (12 u.) | [completo](SANTILLANA-ESO4.json) (13 u.)<br>[completo](SANTILLANA-ESO4-2.json) (12 u.) | [completo](SANTILLANA-BAC1.json) (14 u.)<br>[completo](SANTILLANA-BAC1-2.json) (11 u.)<br>[completo](SANTILLANA-BAC1-3.json) (10 u.) | [completo](SANTILLANA-BAC2.json) (14 u.)<br>[completo](SANTILLANA-BAC2-2.json) (12 u.) |
| Anaya | [completo](ANAYA-PRI1.json) (12 u.) | [completo](ANAYA-PRI2.json) (12 u.) | [completo](ANAYA-PRI3.json) (12 u.) | [completo](ANAYA-PRI4.json) (12 u.) | [completo](ANAYA-PRI5.json) (12 u.) | [completo](ANAYA-PRI6.json) (12 u.) | [completo](ANAYA-ESO1.json) (16 u.) | [completo](ANAYA-ESO2.json) (15 u.) | [completo](ANAYA-ESO3.json) (16 u.) | [completo](ANAYA-ESO4.json) (13 u.)<br>[completo](ANAYA-ESO4-2.json) (13 u.) | [completo](ANAYA-BAC1.json) (14 u.)<br>[completo](ANAYA-BAC1-2.json) (12 u.)<br>[completo](ANAYA-BAC1-3.json) (18 u.) | [completo](ANAYA-BAC2.json) (16 u.)<br>[completo](ANAYA-BAC2-2.json) (14 u.) |
| Edelvives | no encontrado | no encontrado | no encontrado | no encontrado | no encontrado | no encontrado | no encontrado | no encontrado | no encontrado | no encontrado | no encontrado | no encontrado |
| Edebé | [parcial](EDEBE-PRI1.json) (28 u.) | [parcial](EDEBE-PRI2.json) (28 u.) | [parcial](EDEBE-PRI3.json) (28 u.) | [parcial](EDEBE-PRI4.json) (28 u.) | [parcial](EDEBE-PRI5.json) (27 u.) | [parcial](EDEBE-PRI6.json) (28 u.) | [completo](EDEBE-ESO1.json) (13 u.) | [parcial](EDEBE-ESO2.json) (10 u.) | [completo](EDEBE-ESO3.json) (14 u.) | [parcial](EDEBE-ESO4.json) (12 u.)<br>[parcial](EDEBE-ESO4-2.json) (11 u.) | [completo (solo títulos)](EDEBE-BAC1.json) (14 u.)<br>[completo (solo títulos)](EDEBE-BAC1-2.json) (12 u.) | [completo (solo títulos)](EDEBE-BAC2.json) (15 u.)<br>[completo (solo títulos)](EDEBE-BAC2-2.json) (12 u.) |

## Variantes (-N)

- ESO4: sin sufijo = Matemáticas B; `-2` = Matemáticas A.
- BAC1: sin sufijo = Matemáticas I; `-2` = Aplicadas a CCSS I; `-3` = Matemáticas Generales (SM, Santillana, Anaya).
- BAC2: sin sufijo = Matemáticas II; `-2` = Aplicadas a CCSS II.

## Fuentes por editorial

| Editorial | Proyecto | Documento | Web oficial |
|---|---|---|---|
| SM | Revuela (ed. Comunidad de Madrid) | PRI1-2: índice del libro del alumno (muestra); PRI3-BAC2: programación de aula (zip de .docx, una por SA) | https://muestrasdigitales.grupo-sm.com/comunidad-de-madrid/ |
| Santillana | Construyendo Mundos (sello C. de Madrid) | PRI/ESO: «Programación de etapa» (PDF); BAC: índice del libro (flipbook) | https://edupack.santillana.es/ (santillana.es bloquea el acceso desde este entorno: 403 CloudFront) |
| Anaya | Operación Mundo (catálogo C. de Madrid) | Índice «¿Qué vamos a aprender?» / «Los saberes básicos del curso» de la muestra del libro (issuu oficial grupoanayasa), leído de las imágenes de página | https://www.hablamosdeeducacion.es/comunidad-de-madrid/proyectos-educativos/operacion-mundo/material-para-el-alumnado |
| Edebé | De Otra Manera (PRI, ESO2/4: ed. Andalucía; BAC: ed. Aragón) y Conecta De Otra Manera (ESO1/3, C. de Madrid) | Programación de aula (tabla de planificación de SA), concreción curricular de SA, índice del área (PDF) | https://edebeworld.com/buscador/ |
| Edelvives | FanFest (LOMLOE) | — | https://www.edelvives.com/es/proyectos-educativos/primaria/fanfest-primaria |

## Problemas y avisos

- **Edelvives: no encontrado.** La web oficial solo tiene fichas de tienda (ISBN) y catálogos; las muestras y programaciones de FanFest están tras login (Edelvives Digital Plus / Espacio docente). El catálogo `208463_FanFest_Primaria_2024.pdf` es de la edición mexicana (NEM), no sirve.
- **Ediciones autonómicas distintas:** SM y Santillana = Comunidad de Madrid; Anaya = catálogo Madrid (edición general/MEC); Edebé = Andalucía (PRI, ESO2, ESO4) y Aragón (BAC). No son comparables 1:1 entre sí.
- **Edebé PRI1-6:** la tabla de planificación salta las SA 10 y 20 en los seis cursos → `completo: false`. **Edebé ESO2/ESO4:** solo la lista de SA (y saberes de las SA de muestra); ESO4 A salta la SA 9. **Edebé BAC:** unidades completas pero sin epígrafes.
- **SM:** en 3.º-6.º y ESO/BAC la secuencia es la de la programación (bloques del libro y SA), no hay trimestres; `secciones` = «Descripción de los aprendizajes» de cada SA (incluye un objetivo actitudinal inicial, p. ej. «Prestar atención al profesor…»). ESO4 genérico no tiene zip; se usan Matemáticas A/B.
- **Santillana ESO1/ESO3:** la programación de etapa es de «Construyendo Mundos» (2022-23); en Edupack Madrid esos cursos ya aparecen como «Construyendo Nuevos Mundos» (2026), no usado.
- **Anaya:** el índice se transcribió visualmente de las imágenes oficiales (la capa de texto de issuu pierde letras); se archivan las páginas del índice como PDF + la capa de texto. Se omiten las columnas de cálculo mental / pensamiento computacional (primaria).
- `sistema_id`/`curso_id` de la fuente: se fijan con el sistema de la edición (ES-MD, ES-AN, ES-AR); Anaya/Santillana BAC son ediciones generales ofrecidas en Madrid.
- Trimestres: solo cuando el documento los marca (SM PRI1-2, Santillana PRI, Anaya PRI, Edebé ESO SA de muestra); en el resto `null`.
