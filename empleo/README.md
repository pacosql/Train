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

Cada oferta se marca 🔥 High, 👌 Medium, 🧊 Low, 👎 No, 🔁 revisar, 🎯 aplicar (para aplicar hoy) o ✅ aplicado (con una
nota: "el enlace no funciona", "confirmar si es remoto"…); la rutina lee
esas notas, lo comprueba y contesta en el campo `respuesta`.

En la pestaña ✅ Aplicadas, el botón **⬇️ Descargar Excel de aplicadas** genera un
`.xlsx` (ExcelJS, en el navegador): hoja `Aplicadas` (tabla filtrable: fecha, mes,
empresa, posición, estado abierta/cerrada, modalidad, remoto claro…) y hoja
`Resumen` con desplegables (mes, modalidad, remoto claro, estado) y recuentos.

URL: `https://pacosql.github.io/Train/empleo/`

## Dos interfaces

- `index.html`: la clásica (tarjetas, filtros, compañías, no activas). Arriba
  tiene un enlace a la nueva.
- `tabla.html`: tabla rápida. Una fila por oferta (empresa, oferta, sueldo,
  remoto, "ya aplicaste hace N días") en grupos Pendientes / 🎯 Aplicar /
  🔍 En detalle / ✅ Aplicados / High-Medium-Low / 👎 Descartadas, remoto
  primero (Aplicados: por fecha, incluidas las ya cerradas). Se marcan
  muchas filas (🎯 Aplicar, 🔍 Detalle, ✅ Aplicado, ✕ Descartar) y se
  guardan todas de golpe con **Guardar**; entonces se redistribuyen.

## Qué aprende la rutina de tus decisiones

- Aprende de lo que **aplicas** (🎯 Aplicar, 🔍 En detalle, ✅ Aplicado): la
  exploración da mucho más peso a las búsquedas que trajeron esas ofertas
  (`empleo_ofertas.consulta`) y a los títulos que se parecen a esos puestos.
- **Descartar no penaliza nada**: a menudo se descarta porque ya se aplicó a
  esa empresa o porque se va a aplicar a otra oferta suya.

## Tablas (Supabase, prefijo `empleo_`)

- `empleo_ofertas`: una fila por oferta. Campos clave: `empresa`,
  `puesto`, `categoria` (`partner|direccion`), `empresa_data_ai`,
  `ubicacion`, `modalidad` (`remoto|hibrido|presencial|desconocido`),
  `remoto_claro` (dice explícitamente remoto en España), `url` (enlace 1,
  única), `enlaces` (JSON `[{label,url}]`: enlace 1 = portal oficial si
  existe, luego LinkedIn/agregadores), `encontrado_en`, `verificada_en`,
  `fecha_publicacion`, `resumen`, `etiquetas`, `decision`
  (`pendiente|aplicar|aplicar_detalle|high|medium|low|no_gusta|revisar|aplicada`; `aplicar` = "me pongo a aplicar hoy"; `aplicar_detalle` = "aplicar con calma y cuidado"; `prioridad` guarda high/medium/low al aplicar), `nota` (del usuario),
  `respuesta` (de la rutina), `activa`.
- `empleo_empresas`: compañías vigiladas (`nombre`, `sector`, `data_ai`,
  `ats`, `ats_token`, `portal_url`). Es la fuente de verdad que
  lee `buscar.py`; `empleo/tools/empresas.json` es solo una copia de respaldo.
- `empleo_rutinas`: log de cada ejecución (`nuevas`, `nota`).
- `empleo_candidaturas`: candidaturas por empresa cuando no se sabe a qué
  oferta exacta (p. ej. leídas de los correos "Thank you for applying"):
  `empresa`, `fecha`, `puesto` (opcional), `fuente`. Las dos interfaces las
  juntan con las ofertas aplicadas para el aviso "✋ ya aplicaste hace N días".
- `empleo_busquedas`: rendimiento de cada búsqueda (`consulta`, `ubicacion`, `candidatas`, `nuevas`); la exploración aleatoria lo usa para no repetir y para insistir en lo que funciona.
- `empleo_ofertas.encaje` (`completo` | `parcial`) y `encaje_motivo`: las parciales solo entran tras 2 h de rutina y para completar 35.

## Herramientas

- `python3 empleo/tools/buscar.py > /tmp/candidatas.json` — portales
  oficiales de las compañías de `empresas.json` (Greenhouse, Ashby,
  Lever, Workable, SmartRecruiters, Workday, Microsoft, AWS) + portales sin ATS
  estándar (`portales_web.py`: Oracle, IBM, SAP, Capgemini, Nutanix, ServiceNow…)
  + bolsas de remoto (Remotive, Himalayas, RemoteOK, We Work Remotely, Working
  Nomads, Jobicy, Arbeitnow, Hacker News) + LinkedIn
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

1. **Preparar**: `mkdir -p /tmp/r && date +%s > /tmp/r/inicio` (marca el
   inicio: de ahí cuentan las 2 h y las 35 nuevas). `git pull` de `main`.
   Comprobar `$SUPABASE_ACCESS_TOKEN` y red.
2. **Revisar lo pedido**: leer
   `empleo_ofertas?decision=eq.revisar&select=id,empresa,puesto,url,enlaces,nota`.
   Para cada una, hacer lo que dice la nota (abrir enlaces, buscar la oferta
   en el portal oficial, confirmar modalidad…), corregir datos, escribir en
   `respuesta` qué se ha hecho (con fecha) y devolverla a su prioridad
   (`prioridad`, o `pendiente` si no tenía).
3. **Limpiar cerradas**: `python3 empleo/tools/guardar.py revalidar`
   (verifica cada enlace con la API de su portal; puede tardar ~8 min).
4. **Buscar** (cada orden < 10 min):
   - `SIN_LINKEDIN=1 python3 empleo/tools/buscar.py > /tmp/r/c_portales.json` (incluye portales web y todas las bolsas; ~5 min)
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
   **Fiabilidad** (`confianza` 1-5 + `confianza_nota`) de cada empresa nueva
   y de las ofertas sin ella: 5 gran empresa conocida · 4 consolidada y
   verificable · 3 startup/pyme real con web y LinkedIn · 2 presencia mínima,
   agencia que no nombra al cliente, "Stealth", venture builder genérico ·
   1 PELIGROSA (sin presencia verificable o señales de estafa). Guardarla en
   `empleo_empresas` y en las ofertas de esa empresa; `insertar` la copia a
   las ofertas nuevas de empresas ya puntuadas.
   **Actividad** de cada empresa nueva (y de ofertas sin ella): `actividad`
   = etiqueta corta en español ("Ciberseguridad", "IA farmacéutica"…) y
   `actividad2` = qué hace exactamente (≤70 car.). Guardar en
   `empleo_empresas` y en sus ofertas; `insertar` la copia a las nuevas.
10. **Objetivo: 35 nuevas vivas por rutina** (obligatorio). Mirar
    `python3 empleo/tools/guardar.py cuenta` → `{minutos, nuevas, completas,
    parciales, faltan, parciales_permitidas}`. Mientras `faltan > 0`, repetir
    rondas de **exploración**, cada una con formas de buscar distintas:
    - `EXPLORAR=1 python3 empleo/tools/buscar.py > /tmp/r/c_exp_<n>.json`
      (~14 búsquedas de LinkedIn elegidas al azar: sinónimos de los perfiles ×
      ciudades/zonas × filtros; evita las ya probadas en 14 días y repite más
      las que rindieron, según `empleo_busquedas`).
    - Al menos una vía nueva a mano por ronda, elegida al azar: compañías que
      no están en `empleo_empresas` (rondas de financiación recientes, rankings
      de startups de IA, partners de Microsoft/AWS/Google/NVIDIA/Databricks/
      Snowflake en España), Welcome to the Jungle, Indeed/InfoJobs/Glassdoor
      vía WebSearch, Tecnoempleo, portales de empleo de consultoras (Accenture,
      Deloitte, NTT Data, Capgemini…), búsquedas en inglés y en español,
      títulos poco habituales. Anotar en la nota qué vías se probaron.
    - Cada ronda: `insertar` + pasos 7–8 sobre las nuevas, y volver a `cuenta`.
    **Encaje parcial** (ofertas que casi cumplen: perfil correcto fuera de la
    regla de empresa, o puesto afín como Business Development, Customer
    Success Director o TAM; siempre en España o remoto que admita España):
    **solo cuando `parciales_permitidas` sea true (2 h de rutina)** y solo
    para completar las 35. Se buscan con
    `ENCAJE_PARCIAL=1 EXPLORAR=1 python3 empleo/tools/buscar.py > /tmp/r/c_par_<n>.json`
    (o a mano con `"encaje": "parcial", "encaje_motivo": "…"`); `insertar`
    las rechaza antes de las 2 h y no deja pasar más de las que faltan. En la
    app salen marcadas 🧩 con el motivo. Parar al llegar a 35, o a las 4 h
    de rutina si no hay más (y explicarlo en la nota).
11. **Registrar**: `POST empleo_rutinas` con `{"nuevas": N, "nota": "…"}`
    (nuevas por perfil, completas/parciales, vías exploradas, cerradas
    retiradas, revisiones atendidas, incidencias).
12. Solo si se cambia código: commit, merge a `main` y push (si el push
    falla, anotarlo en la nota y seguir).
