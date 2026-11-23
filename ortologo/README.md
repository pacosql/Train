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

En 👍 y ⭐, **📱 Verlos en un iPhone** enseña todos los favoritos como
iconos en la pantalla de inicio de un iPhone de 6,3″ (402 × 874 pt, 24 por
pantalla, fondo negro / de color / claro). El **A4** (300 ppp) lleva ese
iPhone **a tamaño real** (71,5 × 149,6 mm, iconos de 9,9 mm) con el icono
entre otras apps, y una regla de 3,5 cm para comprobar que se ha impreso
al 100 %. Desde la vista de iPhones, **⬇️ Descargar en A4 (PDF)** saca
todos los favoritos en hojas A4 con dos iPhones a tamaño real cada una (48
iconos por hoja, nombre a 12 pt) y debajo qué número es cada icono.
**🔖 Verlos como favicon** hace lo mismo a 16 px: todos juntos y cada
uno en una pestaña de navegador (clara u oscura) y en la barra de
marcadores, con su A4 a tamaño real (16 px = 4,2 mm).
**🏆 Ranking** (`ranking.html`): los favoritos ordenados por la
nota del examen, con el porqué de cada puesto.

**📖 Guía** (`guia.html`): qué es un logo y una imagen de marca, las 9
preguntas que tiene que aprobar un logo para toda la vida (con casillas),
los 12 arquetipos y cuál es Ortografía10 (Sabio con corazón de Héroe), los
favoritos del usuario «a examen» (grande, círculo, 16 px y a una tinta) y
cómo decidir.

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
  `svg_marca` y las pegatinas encogen solas la marca si las esquinas de su
  caja se saldrían del avatar redondo o rozarían el borde; aun así, en la
  hoja hay que **mirar el círculo y la pegatina**, no solo el icono cuadrado.
- `tools/tanda1.py`: la primera tanda; es la plantilla para las siguientes
  (paletas, palabras `w_*`, marcas `m_*`, `add(...)`, `filas()`).
- `tools/tanda4.py`: la í, la ñ y la Ñ en ~70 tipografías libres (OFL, de
  Fontsource, en `tools/fuentes/<familia>-<peso>.woff2`; se usan con
  `txt(..., peso, fam="<familia>")`) y construcciones de icono (un solo
  trazo, contorno, tecla, bocadillo, aro, rombo, ficha…).
- `tools/tanda5.py`: la tanda divertida (caras con signos, la í como
  personaje, pegatinas de cómic, nota adhesiva, sello). Ejemplo de formas
  libres: `poli`, `estrella`, `sonrisa`, `forma`, `trazo`.
- `tools/tanda6.py`: la O manuscrita con rabito en ~60 combinaciones.
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
6. No rellena la cola: de eso se ocupa la rutina «proceso creativo».
7. Escribir la tanda como un script de Python **fuera del repo** que
   importe `marca.py` y lo que haga falta de `tanda1.py`, generar las filas
   (`origen: "rutina"`), **mirar la hoja de `tools/hoja.js`**, corregir lo
   que se vea mal (cortado, ilegible a 20 px, duplicado) e insertar con
   `sb.sh POST ortologo_disenos`.
8. Insertar `{"rutina":"hecho","resumen":"…"}` (una frase).

## Rutina «Ortologo: proceso creativo» (una sesión cada hora)

Mantiene la cola **siempre llena (250 por decidir como mínimo)** y trae
ideas nuevas cada hora, haya o no feedback. No hay tope: no pasa nada si
se acumulan 1000 o 2000.

1. `pip install -q fonttools brotli uharfbuzz`. `bash tools/estado.sh`: si
   `en_curso` es true, esperar 3 minutos y volver a mirar (máx. 3 veces).
   Tamaño de la tanda: **N = 250 − por_decidir, con un mínimo de 30 y un
   máximo de 120** por sesión.
2. **Aprender**: leer todos los diseños con su decisión. Qué tienen en
   común los 👍/⭐ recientes (símbolo, tipografía, tratamiento, paleta) y
   qué tienen en común los 👎. Reescribir `ortologo_preferencias`.
3. **Investigar 10-15 minutos en la web** un filón distinto cada hora
   (mirar en `ortologo_rutinas` los ya usados): iconos de apps, identidades
   premiadas (Cannes Lions, D&AD, Laus, Brand New), museos de diseño,
   cabeceras y editoriales, cartelismo, señalética, marcas de una letra,
   logotipos con ñ o tilde… Es **inspiración, no copia**: se toma el
   recurso, nunca el logo, el nombre ni el dibujo de otra marca.
4. **Generar N propuestas** con un script de Python fuera del repo que
   importe `tools/marca.py` (plantillas: `tanda1.py`, `tanda4.py`; ~70
   tipografías en `tools/fuentes`):
   - **Como mucho un 25 % de variaciones** de lo que ya tiene 👍/⭐, y
     nunca la misma idea con otro color o en otro contenedor más de dos
     veces por tanda. El usuario se ha quejado de ver «lo mismo una y otra
     vez».
   - **Al menos un 50 % de ideas que no existan todavía**, con chispa:
     juegos visuales, caras y personajes hechos con signos, la letra
     convertida en objeto, pegatinas, guiños de cómic, palabras con ñ o
     con í… (`tanda5.py` es el ejemplo del tono). Cada tanda, **tres o
     cuatro familias de ideas distintas** y distintas de las de la tanda
     anterior (mirar los últimos resúmenes en `ortologo_rutinas`).
   - **El resto, del filón** investigado esa hora.
   Antes de dibujar, escribir la lista de ideas y **tachar las que ya
   existan** (comparar con los títulos de `ortologo_disenos`).
   En `concepto`, la idea en una frase (y «Inspirado en …» si viene del
   filón); `origen: "rutina"`; `spec: {"tanda":"creativo","fuente":"…"}`.
5. **Mirar todas las hojas de `tools/hoja.js`** (icono, círculo y
   pegatina) y tirar o corregir lo que se vea mal, cortado, ilegible a
   20 px o repetido.
6. Insertar `{"rutina":"en-curso"}`, las filas (`sb.sh POST`, en trozos de
   50) y `{"rutina":"hecho","resumen":"…"}` (cuántas, qué se ha aprendido,
   qué filón y qué ideas).

La rutina de feedback (la de arriba) ya **no rellena la cola**: solo
responde a comentarios y 🔁.

## El examen de las 9 preguntas y el ranking

> **Mates10 está fuera (23-nov-2026).** El usuario se ha olvidado del
> todo de Mates10 y de la «Serie 10»: nada de hermanos, ni de «da
> familia», ni de `svg_hermano` (la app ya no lo enseña). El examen pasó
> de 10 preguntas a **9**. **Si el encargo de una rutina habla todavía de
> diez notas o de un hermano para Mates10, manda este README.**

Cada diseño que el usuario marca con 👍 o ⭐ se **examina** con las 9
preguntas de la guía (`examen.js` tiene los enunciados y los textos
genéricos). El resultado va en `ortologo_disenos.examen`:

```json
{"p":[1,1,1,1,1,1,1,1,0.5], "t":8.5, "o":1,
 "v":"Veredicto en una o dos frases: qué tiene de bueno y cuál es su pero.",
 "n":{"9":"Nota propia para la pregunta 9 (sustituye a la genérica)"},
 "en":"2026-11-23T12:00:00Z"}
```

- `p`: **nueve** notas en orden (1 aprueba · 0.5 a medias · 0 suspende):
  1 se entiende en un segundo · 2 se dibuja de memoria · 3 se reconoce a
  16 px · 4 funciona a una tinta · 5 se distingue entre apps · 6 tiene que
  ver con la ortografía · 7 aguantará 20 años · 8 vale para todo (icono,
  círculo, pegatina, Reel) · 9 es tuyo (registrable, no se confunde).
- `t`: la suma (sobre 9). «Para toda la vida» = 7 o más y sin suspender
  ninguna de las cuatro primeras. `o`: orden de desempate dentro del
  ranking (menor = mejor; puede llevar decimales).
- Hay que **mirar el diseño** (hoja con icono, círculo, 20 px y a una
  tinta) antes de puntuar. Criterios que ya se han aplicado: una letra
  sola saca 0.5 en la 9 (difícil de registrar); la ñ saca 0.5 en la 6
  (habla de español más que de ortografía); un cartel de tres líneas saca
  0 en la 3; lo que depende del rojo o del verde saca 0.5 en la 4; una i
  dentro de un círculo se confunde con «información».
- Se ve en la tarjeta de cada diseño, en el pie del A4 y en
  `ranking.html` (🏆), que ordena por `t` y luego por `o` y enseña arriba
  `ortologo_preferencias.recomendacion` (un párrafo con la apuesta
  global; reescribirlo cuando cambien los primeros puestos).
- Lo mantiene la rutina de feedback: `estado.sh` devuelve `sin_examen` y
  sale con 0 mientras quede alguno por examinar.

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
- **La O escrita a mano, con su rabito** (la del cuaderno de caligrafía):
  la ha pedido expresamente «en muchísimas combinaciones». `tanda6.py`
  tiene las piezas (`o_mano`, cinco rabitos, grosores, pauta, el 10 con el
  cero a mano, la O-manzana). La O de imprenta sola sigue sin ayudar.
- **Los números de propuesta no se tocan**: nunca se borra ni se modifica
  un diseño existente. Un cambio es siempre una fila nueva (con `padre_id`
  y `revision_nota`); lo que sobra se marca `retirado`.

Reglas de marca que no se tocan: el nombre es **«Ortografía10»** junto, con
tilde en la í; la pegatina lleva `ortografia10.com`; el símbolo tiene que
funcionar igual en el icono de las tiendas, el avatar y la pegatina, y a
ser posible (Mates10 ya no cuenta: ver el aviso del examen). La rutina no toca el código de la
app ni hace commits: solo filas en las tablas `ortologo_`.
