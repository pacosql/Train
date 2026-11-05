# 🔤 Logo Orto: icono de Ortografía10

Propuestas numeradas de **icono de app** (App Store / Google Play), favicon y
wordmark para **Ortografía10** (ortografia10.com). Brief: blanco y negro,
colores sencillos, con la **Ñ**, nombre «Ortografía10» todo junto.

Misma mecánica que [`logos/`](../logos) (copiada y adaptada): 👎 / 👍 / 🔁 Otra / ⭐ Final,
comentarios por texto o voz, kit de marca con descargas PNG/SVG. Además:

- **🎨 Inspiración**: ~320 iconos de apps populares de la App Store (top España,
  top de pago, top EE. UU. y búsquedas de educación/idiomas/ortografía) para marcar 👍/👎.

URL: `https://pacosql.github.io/Train/logoorto/`

## Tablas (prefijo `logoorto_`)

`logoorto_disenos`, `logoorto_comentarios`, `logoorto_preferencias`,
`logoorto_rutinas` (mismas columnas que las de `logos/`, ver su README) y
`logoorto_inspiracion` (`app_id`, `nombre`, `desarrollador`, `categoria`,
`icono_url`, `tienda_url`, `fuente`, `orden`, `decision` gusta/no_gusta, `decidido_en`).
Bucket de audios: `logoorto-audios`.

## Herramientas

`tools/sb.sh`, `tools/estado.sh`, `tools/esperar.sh`, `tools/generar.js`,
`tools/preview.js` — idénticas en uso a las de `logos/tools` (ver allí).

## Rutina «Logo Orto: tandas de 35»

Sesión nueva cada hora que vigila ~55 min. Cada vez que hay trabajo
(menos de 35 por decidir, comentarios o 🔁) genera una tanda de **~35
variantes**: ~60 % derivadas de los 👍 (diseños e iconos de inspiración), ~25 %
evitando lo común de los 👎 y ~15 % al azar para explorar. Actualiza
`logoorto_preferencias` y registra en `logoorto_rutinas`.
