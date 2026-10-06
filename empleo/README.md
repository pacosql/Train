# 💼 Empleo

Buscador personal de ofertas en España con énfasis en **remoto** para un
perfil **Partner · Sales · Solution Architect · Evangelist/DevRel ·
CTO/dirección**. Categorías (`categoria`):

- `partner`: Partner Program / Management / Alliances / Channel / Ecosystem.
- `sales`: enterprise/strategic account executive o manager, BDM, GTM,
  country manager, solution specialist (ventas).
- `arquitecto`: Solutions Architect, Sales/Solutions/Customer Engineer,
  Presales, Technical Account Manager, Field CTO.
- `devrel`: Developer Relations, Developer Advocate, Evangelist.
- `direccion`: CTO, VP/Head/Director of Engineering, Data, AI…
- `ejecutivo`: Country Manager, General Manager, Managing Director,
  CEO/COO/CRO/CCO, VP/Head of Sales/GTM/EMEA/Iberia, Director Comercial…

Regla de selección:
- **⭐ Top AI** (`empleo_empresas.top`, ~75: Microsoft, Google, AWS,
  NVIDIA, OpenAI, Anthropic, Mistral…): **todas** las ofertas de las 5
  categorías en España (cualquier modalidad) + las remotas que admitan España.
- **Resto de Data & AI**: `partner`/`direccion`/`ejecutivo` en España (cualquier
  modalidad) + las 5 categorías si son remotas que admitan España.
- **Otras empresas**: solo `partner`/`direccion`/`ejecutivo` remotas que admitan España.

Cada oferta se marca 🔥 High, 👌 Medium, 🧊 Low, 👎 No, 🔁 revisar o ✅ aplicar (con una
nota: "el enlace no funciona", "confirmar si es remoto"…); la rutina lee
esas notas, lo comprueba y contesta en el campo `respuesta`.

URL: `https://pacosql.github.io/Train/empleo/`

## Tablas (Supabase, prefijo `empleo_`)

- `empleo_ofertas`: una fila por oferta. Campos clave: `empresa`,
  `puesto`, `categoria` (`partner|direccion`), `empresa_data_ai`,
  `ubicacion`, `modalidad` (`remoto|hibrido|presencial|desconocido`),
  `remoto_claro` (dice explícitamente remoto en España), `url` (enlace 1,
  única), `enlaces` (JSON `[{label,url}]`: enlace 1 = portal oficial si
  existe, luego LinkedIn/agregadores), `encontrado_en`, `verificada_en`,
  `fecha_publicacion`, `resumen`, `etiquetas`, `decision`
  (`pendiente|high|medium|low|no_gusta|revisar|aplicada`; `prioridad` guarda high/medium/low al aplicar), `nota` (del usuario),
  `respuesta` (de la rutina), `activa`.
- `empleo_empresas`: compañías vigiladas (`nombre`, `sector`, `data_ai`,
  `ats`, `ats_token`, `portal_url`). Es la fuente de verdad que
  lee `buscar.py`; `empleo/tools/empresas.json` es solo una copia de respaldo.
- `empleo_rutinas`: log de cada ejecución (`nuevas`, `nota`).

## Herramientas

- `python3 empleo/tools/buscar.py > /tmp/candidatas.json` — portales
  oficiales de las compañías de `empresas.json` (Greenhouse, Ashby,
  Lever, Workable, SmartRecruiters, Workday, Microsoft, AWS) + LinkedIn
  (España, ficha de cada oferta) + Remotive/Himalayas. Fusiona la misma
  oferta vista en varios sitios en varios `enlaces`. Tarda ~15 min.
- `python3 empleo/tools/guardar.py insertar /tmp/candidatas.json` —
  inserta solo las nuevas (dedupe por URL o empresa+puesto) y añade
  enlaces nuevos a las existentes.
- `python3 empleo/tools/guardar.py revalidar` — comprueba TODOS los enlaces
  de cada oferta activa con la API de su portal (Greenhouse, Ashby, Lever,
  Workday por referencia, SmartRecruiters, Microsoft, LinkedIn, Himalayas…):
  oficial cerrado → oferta desactivada (las aplicadas solo se etiquetan
  "oferta cerrada"); agregador cerrado → se quita ese enlace.
- `bash empleo/tools/sb.sh GET|POST|PATCH …` — REST genérico.

## Rutina diaria (1:00, hora de Madrid) — "dejarlo todo limpio para mañana"

Objetivo: que por la mañana la app solo muestre ofertas **vivas**, con todas
las **nuevas** del día cargadas, revisadas y con resumen, sueldo y tamaño.
Regla de oro: enlace 1 = la oferta real en el portal del empleador.

Ninguna orden de Bash puede durar más de 10 min: por eso la búsqueda va
por partes. Trabajar en `/tmp/r/` (crear la carpeta).

1. **Preparar**: `git pull` de `main`. Comprobar `$SUPABASE_ACCESS_TOKEN` y red.
2. **Revisar lo pedido**: leer
   `empleo_ofertas?decision=eq.revisar&select=id,empresa,puesto,url,enlaces,nota`.
   Para cada una, hacer lo que dice la nota (abrir enlaces, buscar la oferta
   en el portal oficial, confirmar modalidad…), corregir datos, escribir en
   `respuesta` qué se ha hecho (con fecha) y devolverla a su prioridad
   (`prioridad`, o `pendiente` si no tenía).
3. **Limpiar cerradas**: `python3 empleo/tools/guardar.py revalidar`
   (verifica cada enlace con la API de su portal; puede tardar ~8 min).
4. **Buscar** (cada orden < 10 min):
   - `SIN_LINKEDIN=1 python3 empleo/tools/buscar.py > /tmp/r/c_portales.json`
   - LinkedIn en 32 lotes, una orden por lote (~5 min cada uno):
     `SIN_PORTALES=1 SIN_REMOTIVE=1 SIN_HIMALAYAS=1 LINKEDIN_LOTE=<i>/32 python3 empleo/tools/buscar.py > /tmp/r/c_li_<i>.json`
     para i = 1…32. Si un lote falla por bloqueo de LinkedIn, esperar 1 min y
     reintentarlo una vez; si vuelve a fallar, seguir.
5. **Completar a mano** (WebSearch + curl) las compañías ⭐ con `ats: "web"`
   (Meta, Apple, AMD, Arm, IBM, SAP, Oracle, Dell…) y búsquedas generales de
   "remoto España" para los 6 perfiles; guardar en `/tmp/r/c_web.json` con el
   mismo formato (`enlaces`, `categoria`, `modalidad`…). Verificar cada enlace.
6. **Insertar**: revisar los JSON por encima (descartar HR, soporte,
   afiliados, SDR/junior, "envía tu CV", cofundadores sin sueldo tipo EWOR,
   ubicaciones incompatibles) y
   `python3 empleo/tools/guardar.py insertar /tmp/r/c_*.json`
   (deduplica, fusiona enlaces y rellena sueldo y empleados).
7. **Revisar las nuevas**: `python3 empleo/tools/guardar.py para_resumir /tmp/r/pr.json`.
   Para cada oferta (en paralelo con subagentes si son muchas, ~40 por agente):
   abrir el enlace y fijar `modalidad` real, `remoto_claro`, `activa`
   (false si cerrada o incompatible con España), `resumen` en español (1-2
   frases: rol + dónde/cómo) y `empleados` si falta. Guardar como
   `[{id, resumen, modalidad, remoto_claro, activa, empleados}]` y
   `python3 empleo/tools/guardar.py aplicar_resumenes /tmp/r/pr_out*.json`.
8. **Aplicar la regla**: `python3 empleo/tools/guardar.py limpiar_regla` y
   `python3 empleo/tools/sueldo.py rellenar`.
9. **Compañías nuevas** relevantes: upsert directo en `empleo_empresas`
   (con `ats`/`ats_token` si tiene API, `top`, `data_ai`, `empleados`).
10. **Registrar**: `POST empleo_rutinas` con `{"nuevas": N, "nota": "…"}`
    (nuevas por perfil, cerradas retiradas, revisiones atendidas, incidencias).
11. Solo si se cambia código: commit, merge a `main` y push (si el push
    falla, anotarlo en la nota y seguir).
