# ✳️ Logos: identidad de Mates 10

Propuestas numeradas de logo para **Mates 10**. Cada tarjeta enseña lo
mismo que las pruebas previas: el número y el concepto, el icono en
cuadrado redondeado y en círculo, el favicon a 40 y 20 px y el wordmark
«Mates 10». El usuario marca 👎 No · 👍 Me gusta · 🔁 Otra (quiere otra
versión) · ⭐ Final, y puede **comentar escribiendo, dictando o grabando
audio**. Cada 5 minutos una rutina mantiene **50 diseños por decidir** y
usa los comentarios para crear versiones nuevas en unos minutos.

Estilo de partida: minimalista, tipo Anthropic (tipografía geométrica
gruesa, negro/blanco/crema, pocos elementos), a partir de las pruebas
6-10 del usuario (monograma M1 con el 1 inclinado, azul `#2F5FE8` de
acento).

URL: `https://pacosql.github.io/Train/logos/` (`#12` al final abre el nº 12).

Cada tarjeta tiene además **📐 Kit y guía de marca**: colores (se copian
al tocarlos), tipografía, vista en una pestaña del navegador, descargas
PNG (icono 512, apple-touch 180, círculo, favicon 32, wordmark) y SVG con
la tipografía incrustada, y tokens CSS. Es la base para la plantilla web,
el favicon y el documento de diseño cuando haya un ⭐ Final.

## Tablas (prefijo `logos_`)

### `logos_disenos`: un diseño por fila

| Columna | Notas |
|---|---|
| `numero` | serial, es el nº que ve el usuario. Nunca se reutiliza |
| `titulo`, `concepto` | título corto (qué es) y por qué, en una frase |
| `svg_marca` | monograma del icono (sin fondo: el fondo lo pone la app con `colores.icono_fondo`) |
| `svg_favicon` | opcional: versión simplificada para 16-32 px |
| `svg_wordmark` | el nombre «Mates 10» |
| `colores` | `{icono_fondo, icono_tinta, acento, wordmark}` |
| `spec` | la spec de `tools/generar.js` que lo generó (para derivar versiones) |
| `padre_id`, `version`, `revision_nota` | si es versión de otro: `revision_nota` empieza por «He tenido en cuenta: …» y la app la muestra en la tarjeta |
| `etiquetas`, `origen` | etiquetas libres; `origen`: `ejemplo` · `manual` · `rutina` |
| `decision`, `decidido_en` | `null` = por decidir · `gusta` · `no_gusta` · `definitivo` · `revisar` (el usuario pide otra versión) · `versionado` (la rutina ya hizo la versión nueva) · `retirado` (la rutina lo quitó de la cola porque un comentario lo dejó obsoleto) |

Convenciones del SVG (la app lo sanea y lo pinta en línea): `fill="currentColor"`
es la tinta, `class="acento"` / `class="acento-trazo"` el color de acento,
`class="fondo"` recorta con el fondo. El texto va en Poppins (alojada en
`fonts/`). `data-fit="marca"` / `data-fit="wordmark"` hace que la app mida
la tinta real y encaje el viewBox sola (`data-tam` = cuánto ocupa la marca
en el icono, 0,62 por defecto). Sin `<style>`, sin ids, sin imágenes.

### `logos_comentarios`: notas y audios del usuario

`diseno_id` (null = petición general), `tipo` (`texto` · `audio`), `texto`,
`audio_path`/`audio_mime`/`duracion_seg` (bucket público `logos-audios`),
`transcripcion` (la hace el navegador mientras graba, si puede), `estado`
(`pendiente` · `transcrito` · `procesado`), `procesado_en`.

### `logos_preferencias`: lo aprendido (una fila, `id = 'yo'`)

`gusta`, `no_gusta`, `explorando` (texto corto) y `actualizado_en`. La app
lo enseña arriba («🧠 Lo que he aprendido de tus gustos»).

### `logos_rutinas`: registro

`rutina` (`en-curso` al empezar, `hecho` al terminar), `resumen`,
`ejecutada_en`. La app muestra la última `hecho` al pie.

## Herramientas

- `tools/sb.sh GET|POST|PATCH <ruta> [fichero.json]`: REST de Supabase sin escribir la key.
- `tools/estado.sh`: ¿hay trabajo? (código 0 sí, 1 no).
- `tools/esperar.sh <fin ISO>`: espera (mirando cada minuto) hasta que haya trabajo o llegue la hora de fin.
- `tools/generar.js specs.json > filas.json`: specs → filas (formato documentado en el propio fichero).
- `tools/preview.js [filas.json]`: renderiza la app real en Chromium con esas filas añadidas y deja capturas en `/tmp/logos-preview/` (`sheet-N.png` = 12 tarjetas por hoja). **Mirarlas siempre antes de insertar.**
- `test/smoke.js`: prueba de humo (vota, deshace, exporta un PNG).

## Rutina «Logos: 50 por decidir» (vigila de continuo, sesión nueva cada hora)

Las rutinas no pueden dispararse más de una vez por hora, así que cada
sesión horaria se queda **55 minutos vigilando**: tras cada pasada lanza
`tools/esperar.sh <fin>` en segundo plano (comprueba `estado.sh` cada
minuto) y vuelve a trabajar en cuanto haya algo. El usuario ve respuesta a
sus votos y comentarios en 1-5 minutos.

1. `bash logos/tools/estado.sh`. Si sale con código 1 (ya hay 50 por
   decidir, no hay comentarios nuevos ni 🔁, o hay otra ejecución en
   curso): **terminar sin hacer nada más ni escribir nada**.
2. Insertar `{"rutina":"en-curso"}` en `logos_rutinas` (cerrojo).
3. Leer todo: `logos_disenos` (con `decision`, `titulo`, `concepto`,
   `spec`, `colores`), `logos_comentarios` sin procesar, `logos_preferencias`.
4. **Aprender**: comparar los 👍/⭐ con los 👎 (formas, color, peso,
   inclinación, tipo de idea) y reescribir `logos_preferencias`
   (`gusta`, `no_gusta`, `explorando`, `actualizado_en`). Los comentarios
   mandan sobre las deducciones.
5. **Comentarios y 🔁**: por cada comentario sobre un diseño X (o X en
   `revisar`) crear 2-3 versiones nuevas que hagan exactamente lo que
   pide, con `padre_id` = X, `version` = X.version + 1 y `revision_nota`
   «He tenido en cuenta: …». Si X estaba en `revisar` → `versionado`. Las
   peticiones generales (`diseno_id` null) orientan toda la tanda. Si un
   comentario deja obsoletos diseños de la cola (p. ej. «nada de
   terracota»), marcarlos `retirado`. Comentarios usados → `procesado`.
6. **Rellenar hasta 50 por decidir**: ~60 % explotar lo que gusta
   (variaciones de lo 👍/⭐: peso, proporción, inclinación, color,
   detalle), ~40 % explorar cosas nuevas y creativas (construcciones
   geométricas, espacio negativo, símbolos matemáticos, formas propias en
   SVG, otras relaciones M/1/0, otras paletas sobrias), sin repetir lo
   que tiene 👎 ni títulos ya existentes. Estilo base: minimalista tipo
   Anthropic. Cada diseño con título y concepto claros.
   **Si ya hay 50 o más** (`uno_mas` en `estado.sh`: la cola sigue llena y
   no se ha creado nada en 5 min), meter **uno más** igualmente, y que sea
   **original**: una idea nueva de verdad, no una variación de otro diseño
   (otro concepto, otra construcción, otra forma de juntar M, 1 y 0), que
   respete lo que ha gustado y evite lo descartado. Así siempre hay algo
   fresco aunque no se esté clasificando.
7. Generar con `tools/generar.js`, **mirar las hojas de
   `tools/preview.js`**, corregir o quitar lo que se vea mal (cortado,
   ilegible a 20 px, duplicado) e insertar con `sb.sh POST`.
8. Insertar `{"rutina":"hecho","resumen":"…"}` (una frase: cuántos
   nuevos, qué comentarios se usaron, qué se exploró).
