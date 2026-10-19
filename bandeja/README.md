# Bandeja 📥

PWA (sin build): un chat contigo mismo entre tus dispositivos. Escribes,
pegas o adjuntas algo (texto, enlaces, fotos, vídeos, PDFs…) en el
iPhone y aparece en el Mac, el PC o el iPad, y al revés. Toca cualquier
mensaje para clasificarlo (⚽ Deportes, 📖 Leer luego, 💼 Trabajo,
💡 Ideas, 🛒 Compras o una categoría nueva), copiarlo, abrirlo,
compartirlo o borrarlo; arriba se filtra por categoría.

- **Una sola persona, muchos dispositivos**: al crearla se genera una
  clave secreta que va en el enlace (`#k=…`). Botón **🔗 Enlace** →
  QR / copiar para abrirla en otro dispositivo. Quien tenga el enlace
  está dentro.
- **Pegar**: botón 📋, o pegar una imagen/archivo directamente
  (Cmd/Ctrl+V), o arrastrar archivos encima en el ordenador. Enter
  envía en el ordenador (Mayús+Enter, salto de línea).
- **Sincronía**: sondeo cada 3 s mientras la app está visible.
- Adjuntos de hasta 50 MB.

URL: `https://<usuario>.github.io/Train/bandeja/`

## Datos

Ver [`tools/schema.sql`](./tools/schema.sql).

- Tabla `bandeja_items` con RLS activado y **sin** políticas para anon:
  solo se accede por las funciones `bandeja_list`, `bandeja_post`,
  `bandeja_set_category` y `bandeja_delete`, que exigen la clave de la
  sala.
- Bucket de Storage `bandeja` (lectura pública por URL, sin listado):
  los archivos van en `<clave>/<id>/<nombre>`, así que sin la clave no
  se pueden adivinar. Anon solo puede subir.
