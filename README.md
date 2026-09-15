# Train — hosting de pruebas de concepto

Este repo es un **hosting compartido** para pequeñas apps de prueba de
concepto, todas desplegadas juntas en GitHub Pages y, cuando lo
necesitan, compartiendo un mismo proyecto de Supabase.

## Convención

Cada app vive en su propia carpeta en la raíz del repo y sigue estas
reglas para no interferir con las demás:

- **Carpeta propia**: `<app>/index.html`, `<app>/manifest.json`,
  `<app>/sw.js`, `<app>/config.js`, `<app>/icons/`.
- **URL propia**: `https://<usuario>.github.io/Train/<app>/`.
- **Prefijo propio en Supabase**: todas las tablas de la app se llaman
  `<app>_algo` (p. ej. `weights_hello`, `weights_entries`), aunque
  compartan proyecto de Supabase con otras apps de este repo.
- **Caché propia**: el `CACHE_NAME` de cada `sw.js` empieza por
  `<app>-`, y su limpieza en `activate` solo borra cachés con ese
  prefijo — así el service worker de una app nunca borra la caché de
  otra (el Cache Storage es compartido por todo el origen
  `github.io`).
- **Build id**: cada `index.html`/`sw.js` lleva un marcador
  `__BUILD_ID__` que el workflow de despliegue sustituye por el hash
  corto del commit, visible al pie de página — sirve para confirmar
  de un vistazo qué versión estás viendo.

## Apps

| App | Carpeta | URL | Prefijo Supabase |
|---|---|---|---|
| 🏋️ Weights | [`weights/`](./weights) | `/Train/weights/` | `weights_` |
| ⚽ Football | [`football/`](./football) | `/Train/football/` | `football_` |
| 🎾 Pistas | [`pistas/`](./pistas) | `/Train/pistas/` | `pistas_` |
| 🎬 Cartelera Cine | [`cartelera/`](./cartelera) | `/Train/cartelera/` | `cartelera_` |

## Añadir una app nueva

1. Crea `<app>/` con su propio `index.html`, `manifest.json`, `sw.js`,
   `config.js` e `icons/` (puedes copiar la estructura de `weights/`
   como plantilla).
2. Usa un `CACHE_NAME` con prefijo `<app>-` en su `sw.js`.
3. Prefija todas sus tablas de Supabase con `<app>_`.
4. Añade siempre una entrada a la tabla de arriba **y** una tarjeta
   (botón) en el [`index.html`](./index.html) de la raíz que enlace a
   `<app>/` — todas las apps deben quedar accesibles desde el índice.

## 3. Publica el hosting (GitHub Pages)

1. En GitHub: **Settings → Pages → Build and deployment → Source**, elige
   **GitHub Actions** (solo hay que hacerlo una vez para todo el repo).
2. El workflow [`.github/workflows/pages.yml`](./.github/workflows/pages.yml)
   despliega automáticamente en cada push a `main`, y sella cada
   `index.html`/`sw.js` de cada app con el hash del commit.
3. Para probarlo ahora mismo sin esperar al merge: pestaña **Actions** →
   *Deploy static site to Pages* → **Run workflow**, eligiendo la rama.
4. Cuando termine, la raíz queda en `https://<tu-usuario>.github.io/Train/`
   con enlaces a cada app.
