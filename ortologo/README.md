# 🅾️ Ortologo: la marca de Ortografía10

App para **elegir el logo de Ortografía10** (la app de ortografía de los
Reels de «busca el error», hermana de Mates10 dentro de la «Serie 10»).
Enseña las propuestas **de una en una** con una barra fija (← Atrás · 👎 ·
🔁 · 👍 · ⭐ · Siguiente →): al decidir pasa sola a la siguiente y con Atrás
se vuelve a ver lo ya decidido. Con el móvil apaisado o en pantalla ancha
todo el diseño cabe en una pantalla sin scroll (comentar y el kit quedan
debajo); en teclado, ← → y N / O / G / F. El botón **▦** cambia cualquier
pestaña a cuadrícula: solo los iconos, todos de un vistazo, con 👎 / 👍
debajo de cada uno para votar ahí mismo. Cada
propuesta se ve como:

- icono de **App Store / Google Play**, avatar redondo (LinkedIn,
  Instagram, YouTube) y favicon a 40 y 20 px;
- el nombre **«Ortografía10»** (siempre junto, con tilde en la í);
- **pegatina / imán de coche** con `ortografia10.com`;
- un fotograma de **Reel** con el ejercicio del camión;
- el **hermano Mates10** cuando el símbolo es un sistema de serie.

**⬇️ Descargar A4** genera un PDF de una página con todo eso (más la
paleta) para imprimirlo. «📐 Kit y guía de marca» da los PNG/SVG sueltos
(icono 1024 a sangre para las tiendas, avatar, favicon, pegatina vectorial)
y los tokens CSS.

URL: `https://pacosql.github.io/Train/ortologo/` (`#12` abre el nº 12).

Punto de partida: el vídeo `ortografia10_camion.mp4` (Poppins ExtraBold
crema sobre azul noche `#141839`, tilde y pastilla del «10» en amarillo
`#FECB3B`, rojo de error `#FE5F5E`, verde de acierto `#3FD480`).

## Tablas (prefijo `ortologo_`)

Las mismas que [`logos/`](../logos/README.md), más dos columnas en
`ortologo_disenos`:

| Columna | Notas |
|---|---|
| `numero`, `titulo`, `concepto` | nº que ve el usuario, título y por qué |
| `svg_marca` | símbolo del icono, `viewBox="0 0 100 100"`, sin fondo |
| `svg_favicon` | opcional: versión simplificada para 16-32 px |
| `svg_wordmark` | «Ortografía10» |
| `svg_pegatina` | pegatina completa, con colores ya resueltos |
| `svg_hermano` | opcional: el mismo símbolo para Mates10 |
| `colores` | `{icono_fondo, icono_tinta, acento, wordmark, wordmark_fondo, error, acierto}` |
| `padre_id`, `version`, `revision_nota` | si es versión de otro (`revision_nota` empieza por «He tenido en cuenta: …») |
| `decision`, `decidido_en` | `null` por decidir · `gusta` · `no_gusta` · `definitivo` · `revisar` · `versionado` · `retirado` |

`ortologo_comentarios` (texto o audio con transcripción; bucket público
`ortologo-audios`), `ortologo_preferencias` (una fila `id='yo'`: `gusta`,
`no_gusta`, `explorando`) y `ortologo_rutinas` (`en-curso` / `hecho` +
`resumen`).

Convenciones del SVG (la app lo sanea y lo pinta en línea):
`fill="currentColor"` es la tinta, `class="acento"` / `acento-trazo` el
acento, `class="fondo"` / `fondo-trazo` recorta con el fondo; colores fijos
(rojo de error, verde de acierto) van como hex. **Todo son trazados**: nada
de `<text>`, `<style>`, ids ni imágenes.

## Herramientas

Requisitos: `pip install fonttools brotli uharfbuzz`.

- `tools/marca.py`: piezas para dibujar (texto de Poppins o Playfair
  convertido a trazados con la tilde separable, pastillas, anillos, trazos,
  texto en arco) y plantillas de pegatina (`pegatina_tarjeta`,
  `pegatina_sello`).
- `tools/tanda1.py`: la primera tanda; es la plantilla para las siguientes
  (paletas, palabras `w_*`, marcas `m_*`, `add(...)`, `filas()`).
- `tools/hoja.js filas.json [salida.png]`: hoja de contacto para **mirar
  los diseños antes de insertarlos**.
- `tools/sb.sh GET|POST|PATCH <ruta> [fichero.json]`: REST de Supabase.
- `tools/estado.sh`: ¿hay trabajo? (código 0 sí, 1 no) ·
  `tools/esperar.sh <fin ISO>`: espera hasta que lo haya.
- `tools/preview.js [filas.json]`: la app real en Chromium con capturas.
- `test/smoke.js`: prueba de humo.

## Rutina «Ortologo: feedback y propuestas» (sesión nueva cada hora, vigila de continuo)

Las rutinas no pueden dispararse más de una vez por hora, así que cada
sesión se queda **55 minutos vigilando**: tras cada pasada lanza
`bash ortologo/tools/esperar.sh <fin>` en segundo plano y vuelve a trabajar
en cuanto haya algo. Así el usuario ve respuesta en 1-5 minutos.

1. `pip install -q fonttools brotli uharfbuzz` y
   `bash ortologo/tools/estado.sh`. Si sale con código 1: esperar con
   `esperar.sh`; si se acaba el tiempo, terminar sin escribir nada.
2. Insertar `{"rutina":"en-curso"}` en `ortologo_rutinas` (cerrojo).
3. Leer `ortologo_disenos` (decision, titulo, concepto, colores,
   etiquetas), `ortologo_comentarios` sin procesar y `ortologo_preferencias`.
4. **Aprender**: comparar 👍/⭐ con 👎 y reescribir `ortologo_preferencias`
   (los comentarios mandan sobre las deducciones).
5. **Comentarios y 🔁**: por cada comentario sobre un diseño X (o X en
   `revisar`), 2-3 versiones nuevas que hagan exactamente lo que pide, con
   `padre_id`, `version + 1` y `revision_nota` «He tenido en cuenta: …».
   X en `revisar` → `versionado`. Peticiones generales (`diseno_id` null)
   orientan la tanda. Lo que un comentario deje obsoleto → `retirado`.
   Comentarios usados → `estado: procesado`, `procesado_en`.
6. **Rellenar hasta 30 por decidir**: ~60 % variaciones de lo que gusta,
   ~40 % ideas nuevas. **Si ya hay 30 o más por decidir y no hay
   comentarios ni 🔁, no se añade nada** (la cola no debe crecer sola).
7. Escribir la tanda como un script de Python **fuera del repo** que
   importe `marca.py` y lo que haga falta de `tanda1.py`, generar las filas
   (`origen: "rutina"`), **mirar la hoja de `tools/hoja.js`**, corregir lo
   que se vea mal (cortado, ilegible a 20 px, duplicado) e insertar con
   `sb.sh POST ortologo_disenos`.
8. Insertar `{"rutina":"hecho","resumen":"…"}` (una frase).

Lo que ha dicho el usuario (manda sobre cualquier deducción):

- **La tilde solo va en la í** de Ortografía. Nada de tilde sobre la O, la
  ó ni el 10.
- **No le gusta el blanco / crema** en letras y símbolos: amarillo y azul
  noche (o negro). Le gusta el 10 en su bloque amarillo (nº 1), la í
  (nº 19) y la ñ (nº 17).
- **Finalistas: la í con tilde y la ñ** (ortografía + español). Le gustan
  también las comillas españolas « » y los signos que solo tiene el
  español. **El 10 y la O no dicen nada**: no hacer símbolos basados solo
  en ellos (el 10 sigue en el nombre «Ortografía10»).
- **Los números de propuesta no se tocan**: nunca se borra ni se modifica
  un diseño existente. Un cambio es siempre una fila nueva (con `padre_id`
  y `revision_nota`); lo que sobra se marca `retirado`.

Reglas de marca que no se tocan: el nombre es **«Ortografía10»** junto, con
tilde en la í; la pegatina lleva `ortografia10.com`; el símbolo tiene que
funcionar igual en el icono de las tiendas, el avatar y la pegatina, y a
ser posible dar un hermano para Mates10. La rutina no toca el código de la
app ni hace commits: solo filas en las tablas `ortologo_`.
