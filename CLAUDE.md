# Train — hosting de pruebas de concepto

Este repo aloja varias apps pequeñas (PWAs, sin build) desplegadas juntas
en GitHub Pages, compartiendo un único proyecto de Supabase. Cada app
vive en su propia carpeta y sigue las reglas de abajo para no chocar con
las demás. Lee también [`README.md`](./README.md) para el detalle
completo de la convención.

## Instrucción para cualquier chat que lea esto

El usuario NO va a pegar ninguna plantilla ni instrucciones detalladas.
En cuanto mencione, aunque sea de pasada y en una frase suelta, que
quiere montar/crear/probar una app o idea nueva en este hosting (p. ej.
"quiero hacer una app de tenis", o simplemente "tenis"), actúa tú solo,
de principio a fin, sin pedir confirmación para cada paso:

1. Deduce un nombre de carpeta corto en minúsculas a partir de lo que
   diga (p. ej. "tenis" → `tenis/`).
2. Sigue al pie de la letra la "Convención por app" de más abajo:
   carpeta, prefijo de tablas, prefijo de caché, botón en el índice,
   fila en el README.
3. Crea al menos una tabla mínima de prueba con el prefijo de la app y
   verifica leyendo/escribiendo en ella de verdad (no basta con que el
   código compile).
4. Antes de tocar Supabase, comprueba `$SUPABASE_ACCESS_TOKEN` (el hook
   de arranque ya te avisa si falta o si la red está bloqueada) — si
   falta, es lo único por lo que debes parar a preguntar.
5. Despliega fusionando tu rama en `main` y haciendo push (dispara el
   deploy solo) y comprueba que el sitio final funciona de verdad.
6. Termina dando la URL final ya funcionando — no una lista de próximos
   pasos.

La app "Weights" (`weights/`) es la referencia de cómo debe quedar el
resultado. Cópiale el patrón.

## Supabase compartido

- Project ref: `dzlhsdpgyxnjwudmrnul`
- URL: `https://dzlhsdpgyxnjwudmrnul.supabase.co`
- anon key (pública, protegida por RLS — segura de usar en el cliente):
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6bGhzZHBneXhuand1ZG1ybnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MzEzMjgsImV4cCI6MjEwNTAwNzMyOH0.B572twWEEJjnNr1SZDrUCHBG9VgIEo9RXyZXyszjhrM`

**Nunca** pongas el token de gestión de Supabase (`sbp_...`) en ningún
archivo de este repo. Vive únicamente como la variable de entorno
`SUPABASE_ACCESS_TOKEN` en la configuración del entorno de Claude Code
— si no está disponible (`echo $SUPABASE_ACCESS_TOKEN` vacío), pídeselo
al usuario en el chat en vez de intentar crear tablas sin él.

## Crear/alterar tablas (DDL)

La anon key nunca puede crear ni alterar tablas — solo leer/escribir
filas según RLS. Para DDL usa la Management API con
`$SUPABASE_ACCESS_TOKEN`:

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/dzlhsdpgyxnjwudmrnul/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "create table if not exists public.<app>_algo (...); alter table public.<app>_algo enable row level security; create policy \"allow anon read\" on public.<app>_algo for select to anon using (true); create policy \"allow anon insert\" on public.<app>_algo for insert to anon with check (true);"}'
```

Si la llamada falla por red (403 / `connect_rejected` del proxy), es la
política de red de ese entorno de Claude Code bloqueando
`api.supabase.com` — dile al usuario que la abra en la configuración del
entorno (no es un problema de permisos ni de la app).

## Convención por app (obligatoria)

Al crear una app nueva `<app>/`:

1. Carpeta propia: `<app>/index.html`, `manifest.json`, `sw.js`,
   `config.js`, `icons/`.
2. Prefijo de tablas en Supabase: **todas** sus tablas se llaman
   `<app>_algo` — nunca toques tablas con el prefijo de otra app.
3. Prefijo de caché en su `sw.js`: `CACHE_NAME` empieza por `<app>-`, y
   el cleanup de `activate` solo borra cachés con ese prefijo (el Cache
   Storage es compartido por todo el origen `github.io`, así que el
   service worker de una app nunca debe tocar la caché de otra).
4. URL resultante: `https://<usuario>.github.io/Train/<app>/`.
5. Añade siempre una tarjeta/botón a `<app>/` en el
   [`index.html`](./index.html) de la raíz y una fila en la tabla de
   apps del [`README.md`](./README.md).
6. Cada `index.html`/`sw.js` lleva un marcador `__BUILD_ID__` que el
   workflow de despliegue sustituye por el hash del commit — no lo
   quites, es lo que permite confirmar de un vistazo qué versión está
   sirviendo GitHub Pages.

## Apps existentes

| App | Carpeta | Prefijo Supabase |
|---|---|---|
| 🏋️ Weights | `weights/` | `weights_` |
| 🎬 Cartelera Cine | `cartelera/` | `cartelera_` |

(Actualiza esta tabla al añadir una app nueva.)

## Publicar

`main` es la rama de producción — GitHub Pages despliega
automáticamente en cada push a `main` (ver
[`.github/workflows/pages.yml`](./.github/workflows/pages.yml)). Cada
chat trabaja en su propia rama; cuando termine una tanda de trabajo,
fusiónala en `main` y haz push.
