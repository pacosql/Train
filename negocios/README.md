# 📈 Negocios — evaluador de ideas de negocio

Fichas de ideas de negocio evaluadas para el perfil del usuario. La app
muestra una ficha cada vez, ordenadas por puntuación, y el usuario la
etiqueta: **👍 Me gusta**, **👎 No me gusta** o **⭐ Definitivo** (todo se
puede deshacer o cambiar después). En cada ficha puede además **escribir
notas o grabar audios** que quedan guardados como pendientes para que una
rutina los transcriba y procese. Está pensada para que una rutina externa
vaya **insertando fichas nuevas** en Supabase y aparezcan aquí sin tocar
código.

URL: `https://pacosql.github.io/Train/negocios/`

## Tablas (prefijo `negocios_`)

### `negocios_perfil` — una fila (`id = 'yo'`) con el perfil del usuario

`descripcion`, `ubicacion`, `capital_disponible_eur`, `fortalezas text[]`,
`intereses text[]`, `criterios`. La rutina que genera fichas debe leerla
primero para evaluar `encaje_perfil` y `encaje_nota` contra ese perfil.

### `negocios_ideas` — una fila por ficha

| Columna | Tipo | Notas |
|---|---|---|
| `nombre`, `resumen`, `descripcion` | text | obligatorias. `resumen` = una frase; `descripcion` = qué sería el negocio |
| `modelo` | text | `B2C` · `B2B` · `B2B2C` · `B2G` |
| `tipo` | text | `innovador` · `tradicional` · `hibrido` |
| `sector` | text | obligatoria |
| `mercado`, `competencia`, `modelo_ingresos` | text | |
| `ticket_medio_eur` | numeric | ingreso medio por cliente y **año** |
| `inversion_min_eur`, `inversion_max_eur` | integer | inversión inicial |
| `cac_eur`, `cac_nota` | numeric, text | coste de adquisición de un cliente |
| `meses_hasta_ingresos` | integer | |
| `exito`, `exito_nota` | 1-10, text | probabilidad de éxito |
| `durabilidad`, `durabilidad_nota` | 1-10, text | si aguanta bien con el tiempo |
| `impacto_ia`, `impacto_ia_nota` | text | `palanca` · `neutral` · `amenaza` |
| `encaje_perfil`, `encaje_nota` | 1-10, text | encaje con el perfil de `negocios_perfil` |
| `fortalezas`, `riesgos` | text[] | listas cortas |
| `primer_paso` | text | cómo validarla barato |
| `venta` | text | `desasistida` (el cliente compra solo) · `asistida` (hace falta un comercial) · `mixta`. **Criterio clave del usuario: prefiere desasistida** |
| `efecto_red` | text | `individual` (un cliente ya obtiene todo el valor) · `red` (necesita masa crítica, p. ej. un ladder de tenis) |
| `ltv_eur` | numeric | valor de vida del cliente (ingresos totales esperados por cliente) |
| `payback_meses` | integer | meses hasta recuperar la inversión inicial |
| `uso_ia` | 1-10 | cuánto se apoya el negocio (producto y operación) en IA |
| `viralidad` | 1-10 | cuánto trae cada cliente a otros clientes (boca a boca, compartir, referidos) |
| `revision_nota`, `revisado_en`, `version` | text, timestamptz, int | los rellena la rutina «revisión» al incorporar comentarios del usuario: `revision_nota` empieza por "He tenido en cuenta: " y la app lo muestra arriba de la ficha; `version` sube en cada revisión |
| `etiquetas` | text[] | etiquetas libres cortas en minúsculas (`b2c`, `suscripción`, `self-service`…) |
| `fuente` | text | `manual` por defecto; la rutina debe poner p. ej. `rutina` |
| `decision`, `decidido_en` | | los rellena la app: `gusta` · `no_gusta` · `definitivo` |

La **puntuación 0-100** es la «probabilidad de éxito para el usuario»
según su propia definición, y la calcula la app (no se guarda). Cada
factor va de 0 a 10:

| Factor | Cómo se obtiene | Peso |
|---|---|---|
| Compra desasistida | `venta`: desasistida 10 · mixta 5 · asistida 1 | ×2 |
| Cliente individual | `efecto_red`: individual 10 · red 2 | ×1,5 |
| Poca inversión | `10 − 4·log10(inversion_max_eur / 10000)`, acotado 0-10 (10 k€ → 10, 40 k€ → 7,6, 100 k€ → 6, 400 k€ → 3,6) | ×2 |
| LTV frente a CAC | `5·log10(ltv_eur / cac_eur) + 2,5`, acotado (ratio 1 → 2,5; 3 → 4,9; 10 → 7,5; 30 → 10) | ×2 |
| Viralidad | `viralidad` | ×1 |
| Éxito de mercado | `exito` (estimación del analista) | ×1,5 |

`encaje_perfil`, `durabilidad`, `uso_ia` e `impacto_ia` se muestran pero no
puntúan. Veredictos: ≥ 75 alta probabilidad · 60-74 buena con reservas ·
45-59 floja · < 45 descartable.

### `negocios_comentarios` — notas y audios del usuario sobre cada ficha

| Columna | Tipo | Notas |
|---|---|---|
| `idea_id` | uuid | referencia a `negocios_ideas.id` |
| `tipo` | text | `texto` · `audio` |
| `texto` | text | la nota, si `tipo = 'texto'` |
| `audio_path`, `audio_mime`, `duracion_seg` | text, text, int | si `tipo = 'audio'`: ruta dentro del bucket `negocios-audios` (`<idea_id>/<fecha>.webm` o `.m4a` en iPhone) |
| `estado` | text | `pendiente` (por defecto) · `transcrito` · `procesado` |
| `transcripcion` | text | la rellena la rutina de transcripción |
| `procesado_en` | timestamptz | |

Los audios viven en el bucket público `negocios-audios` (la anon key puede
subir y leer, no borrar). URL de descarga:
`https://dzlhsdpgyxnjwudmrnul.supabase.co/storage/v1/object/public/negocios-audios/<audio_path>`.

### `negocios_rutinas` — registro de ejecuciones de las rutinas

`ejecutada_en`, `rutina` (`ideas` · `mejora-app` · `transcripcion`…),
`resumen` (una o dos frases), `idea_id` (si aplica), `commit` (si aplica).
Cada rutina inserta una fila al terminar; así se ve que siguen vivas.

## Rutinas activas

- **`ideas`** (cada hora, sesión nueva): lee el perfil y los criterios
  (`negocios_perfil`), las fichas existentes y los comentarios del usuario,
  investiga y genera al menos una idea nueva bien evaluada, la inserta con
  `fuente = 'rutina'` y registra la ejecución.
- **`revision`** (cada hora, sesión nueva): lee los comentarios pendientes
  (texto, o audio con transcripción), modifica la ficha o crea ideas nuevas
  a partir de ellos, escribe `revision_nota` («He tenido en cuenta: …»),
  sube `version`, devuelve la ficha a Pendientes (`decision = null`) y marca
  los comentarios como `procesado`. Los audios sin transcripción se quedan
  en `pendiente`: la app intenta transcribir con el reconocimiento de voz
  del navegador mientras se graba, y además ofrece «Dictar» (voz a texto en
  el propio móvil) para que la nota llegue como texto.
- **`mejora-app`** (cada 2 horas durante 2 días): implementa la siguiente
  mejora de [`ROADMAP.md`](./ROADMAP.md), la prueba con
  `node negocios/test/smoke.js`, la fusiona en `main` y registra la
  ejecución.

## Transcripción de audios

En el entorno de Claude Code en la nube no se pueden descargar modelos de
transcripción (la red bloquea Hugging Face), así que la transcripción la
hace el navegador: al grabar, la app arranca en paralelo el reconocimiento
de voz (`SpeechRecognition`, es-ES) y guarda lo reconocido en
`transcripcion` con `estado = 'transcrito'`; si el sistema no lo permite
(algunos iPhone), el audio queda `pendiente` y el usuario puede usar
«Dictar». Una rutina externa con acceso a un modelo de voz podría rellenar
`transcripcion` de los audios pendientes descargándolos por la URL pública
y hacer `PATCH` `{"transcripcion": "...", "estado": "transcrito"}`.

## Insertar una ficha desde una rutina

La anon key (en `config.js`) puede leer, insertar y actualizar gracias a
las políticas RLS; no puede borrar ni alterar tablas.

```bash
curl -s -X POST "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1/negocios_ideas" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"fuente":"rutina","nombre":"...","resumen":"...","descripcion":"...",
       "modelo":"B2C","tipo":"hibrido","sector":"...",
       "venta":"desasistida","efecto_red":"individual",
       "exito":6,"durabilidad":7,"impacto_ia":"palanca","encaje_perfil":8,"uso_ia":8,"viralidad":6,
       "inversion_min_eur":20000,"inversion_max_eur":50000,"cac_eur":30,
       "ticket_medio_eur":90,"ltv_eur":150,"meses_hasta_ingresos":3,"payback_meses":12,
       "mercado":"...","competencia":"...","modelo_ingresos":"...","cac_nota":"...",
       "exito_nota":"...","durabilidad_nota":"...","impacto_ia_nota":"...","encaje_nota":"...",
       "etiquetas":["b2c","suscripción"],
       "fortalezas":["..."],"riesgos":["..."],"primer_paso":"..."}'
```

Al abrir la app (o pulsar ↻) la ficha aparece en **Pendientes**.
