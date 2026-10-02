# Series 📺

PWA (sin build) que te va presentando series disponibles en España
(Netflix, Prime Video, HBO Max, Disney+, Apple TV+, Movistar Plus+,
RTVE Play, Atresplayer) una a una, con cartel, por qué verla, tres
actores principales, duración (temporadas, episodios, horas) y si ya
está acabada o sigue en curso. Tú marcas **👍 Me gusta / 👎 No me gusta**.

- **Descubrir**: la siguiente serie sin valorar, con «Deshacer».
- **Me gustan / No**: tus listas; toca una para ver la ficha o cambiar
  de opinión.
- **Compartir**: el enlace `?ver=recomendadas` enseña a tus amigos solo
  las que te gustan, en modo lectura.
- **⭐ Cristóbal** (también `?ver=cristobal`): las series que recomienda
  Cristóbal Terrer Mota, director de [Seriemaniac](https://seriemaniac.com),
  puntuadas de 1 a 5 estrellas. Las de 5 llevan su sello con foto.
  Las estrellas salen de la nota 🧡 de su crítica cuando la hay y, si no,
  de su puesto en sus rankings (ver `tools/cristobal.json`). Sin votos.

URL: `https://<usuario>.github.io/Train/series/`

## Datos

Tabla `series_series` (ver [`tools/schema.sql`](./tools/schema.sql)).
La app (anon key) solo puede leer y cambiar las columnas `valoracion` /
`valorada_en`; las fichas solo se cargan con el token de gestión.

Para añadir series: edita [`tools/catalogo.json`](./tools/catalogo.json)
(título, plataformas, «por qué») y ejecuta

```bash
node series/tools/enriquecer.mjs > /tmp/series.json   # carátula, reparto, episodios… de TVmaze
node series/tools/cargar.mjs /tmp/series.json          # upsert sin tocar valoraciones
```

Para refrescar las recomendaciones de Cristóbal (nuevas críticas o
cambios en sus rankings): edita `tools/cristobal.json` y ejecuta
`node series/tools/cristobal.mjs` (tabla `series_cristobal`, solo lectura
desde la app).

La disponibilidad por plataforma es la de la fecha de carga y puede
cambiar; cada ficha enlaza a JustWatch España para comprobarla.
