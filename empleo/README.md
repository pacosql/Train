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

Regla de selección:
- **⭐ Top AI** (`empleo_empresas.top`, ~75: Microsoft, Google, AWS,
  NVIDIA, OpenAI, Anthropic, Mistral…): **todas** las ofertas de las 5
  categorías en España (cualquier modalidad) + las remotas que admitan España.
- **Resto de Data & AI**: `partner`/`direccion` en España (cualquier
  modalidad) + las 5 categorías si son remotas que admitan España.
- **Otras empresas**: solo `partner`/`direccion` remotas que admitan España.

Cada oferta se marca 👍 me gusta, 👎 no me gusta o 🔁 revisar (con una
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
  (`pendiente|gusta|no_gusta|revisar`), `nota` (del usuario),
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
- `python3 empleo/tools/guardar.py revalidar` — desactiva las activas
  cuyo enlace 1 ya no existe y pone `verificada_en` = hoy en las vivas.
- `bash empleo/tools/sb.sh GET|POST|PATCH …` — REST genérico.

## Rutina diaria (1:00, hora de Madrid)

Regla de oro: **enlace 1 = la oferta real en el portal del empleador**
siempre que exista; LinkedIn y agregadores como enlace 2, 3…

1. `git pull` de `main` y trabajar en una rama propia.
2. **Revisar lo que pidió el usuario**: leer
   `empleo_ofertas?decision=eq.revisar&select=id,empresa,puesto,url,enlaces,nota`.
   Para cada una, hacer lo que dice la nota (abrir enlaces, buscar la
   oferta en el portal oficial, confirmar modalidad…), corregir los datos
   (`enlaces`, `modalidad`, `activa`…), escribir en `respuesta` qué se ha
   hecho (1-2 frases, con fecha) y devolverla a `decision=pendiente`.
3. `python3 empleo/tools/guardar.py revalidar`.
4. `python3 empleo/tools/buscar.py > /tmp/candidatas.json`.
5. Completar a mano (WebSearch + curl) las compañías con `ats: "web"`
   en `empresas.json` (Google Cloud, SAP, Oracle, IBM, Mistral, Denodo,
   Nutanix, Cisco…) y búsquedas generales de "remoto España" para
   Partner/Alliances/Channel y CTO/Head of Engineering/Data/AI. Añadir
   lo encontrado al JSON de candidatas con sus `enlaces`.
6. Leer las candidatas y descartar las que no encajen (roles de HR,
   ingeniería individual, ventas junior/SDR, ubicación incompatible). Para las
   que quedan, escribir `resumen` (1-2 frases en español: rol +
   aclaraciones de ubicación/modalidad) y, si hace falta, corregir
   `modalidad`/`remoto_claro`. Tener en cuenta los 👍/👎 y notas previos.
7. `python3 empleo/tools/guardar.py insertar /tmp/candidatas.json`.
8. Si se descubren compañías nuevas relevantes (Data & AI, o que
   contratan en remoto en España), añadirlas **directamente a la tabla
   `empleo_empresas`** (upsert por `nombre`, con su `ats`/`ats_token` si
   tiene portal con API). `buscar.py` lee las compañías de esa tabla, así
   que no hace falta hacer push. Solo si se cambia código: commit, merge
   a `main` y push (si el push falla, anotarlo en la nota de la rutina).
9. Registrar la ejecución: `POST empleo_rutinas` con
   `{"nuevas": N, "nota": "…"}`.
