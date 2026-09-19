# 🗂️ Contactos — clasificador de contactos

App para llevar notas sobre las personas de tu entorno (a mano o
dictadas por voz) y adjuntar archivos, y que **una rutina externa**
sintetice esas notas en un resumen corto y proponga **etiquetas**
(para qué usarías a ese contacto: amigo, trabajo, cliente, mentor,
familia…). El usuario también puede añadir o quitar etiquetas a mano
en cualquier momento.

Flujo: **＋ Nuevo contacto** → escribe o dicta notas sobre él/ella
(botón 🎤 usa el dictado por voz del navegador, Web Speech API) →
opcionalmente sube archivos → el contacto queda **"pendiente de
sintetizar"** hasta que la rutina genera `resumen` y `etiquetas`.

URL: `https://pacosql.github.io/Train/contactos/`

## Tablas (prefijo `contactos_`)

### `contactos_contactos` — una fila por persona

| Columna | Tipo | Notas |
|---|---|---|
| `nombre` | text | obligatorio |
| `resumen` | text | lo rellena la rutina de síntesis |
| `etiquetas` | text[] | lo rellena la rutina; el usuario también puede añadir/quitar a mano desde la app |
| `estado_sintesis` | text | `pendiente` (por defecto) · `procesado` — vuelve a `pendiente` automáticamente cada vez que hay una nota o archivo nuevo/editado |
| `archivado` | boolean | lo pone la app al archivar un contacto (no se borra nunca) |

### `contactos_notas` — notas de texto (escritas o dictadas) sobre cada contacto

| Columna | Tipo | Notas |
|---|---|---|
| `contacto_id` | uuid | referencia a `contactos_contactos.id` |
| `texto` | text | contenido de la nota |
| `origen` | text | `texto` · `voz` (dictada con Web Speech API, ya viene transcrita) |
| `borrado` | boolean | soft-delete: la app nunca hace `DELETE`, solo marca `borrado = true` y deja de mostrarla |

### `contactos_archivos` — archivos adjuntos a un contacto

| Columna | Tipo | Notas |
|---|---|---|
| `contacto_id` | uuid | referencia a `contactos_contactos.id` |
| `nombre_archivo` | text | nombre original del fichero |
| `path` | text | ruta dentro del bucket `contactos-archivos` (`<contacto_id>/<timestamp>-<nombre>`) |
| `mime`, `tamano_bytes` | text, bigint | |

Los archivos viven en el bucket público `contactos-archivos` (la anon
key puede subir y leer, no borrar). URL de descarga:
`https://dzlhsdpgyxnjwudmrnul.supabase.co/storage/v1/object/public/contactos-archivos/<path>`.

La anon key (en `config.js`) puede leer, insertar y actualizar gracias
a las políticas RLS; no puede borrar filas ni alterar tablas.

## Rutina de síntesis y etiquetado

Pensada para ejecutarse periódicamente (hay una Routine de Claude Code
programada para esto, ver más abajo), pero también se puede lanzar a
mano pidiéndoselo a un chat con acceso a este repo.

1. Leer `contactos_contactos` con `estado_sintesis=eq.pendiente`.
2. Para cada uno, leer sus notas no borradas
   (`contactos_notas?contacto_id=eq.<id>&borrado=eq.false&order=created_at`)
   y sus archivos (`contactos_archivos?contacto_id=eq.<id>`).
3. Si hay archivos de imagen o PDF, merece la pena descargarlos
   (la URL pública de arriba) y leerlos de verdad para que informen el
   resumen, no solo listar el nombre del fichero.
4. Escribir un `resumen` de 2-4 frases en español: quién es, de qué se
   conocen, qué se ha hablado, cualquier dato relevante.
5. Proponer de 2 a 6 `etiquetas` cortas en minúscula que respondan a
   "¿para qué usaría yo este contacto?" (p. ej. `amigo`, `trabajo`,
   `networking`, `cliente`, `proveedor`, `mentor`, `familia`,
   `inversor`, `contratación`...). **Fusionar** con las etiquetas que ya
   tuviera el contacto (no borrar las que el usuario haya puesto a
   mano), sin duplicados.
6. Hacer `PATCH` a `contactos_contactos` con `{"resumen": "...",
   "etiquetas": [...], "estado_sintesis": "procesado"}`.
7. Al terminar la pasada, insertar una fila en `contactos_rutinas`
   (`procesados`: nº de contactos actualizados, `resumen`: una frase)
   para dejar constancia de que la rutina sigue viva.

### `contactos_rutinas` — registro de ejecuciones de la rutina

`ejecutada_en` (timestamptz), `procesados` (int), `resumen` (text).

## Rutinas activas

- **Síntesis y etiquetado** (cada hora, sesión nueva): ejecuta los
  pasos de arriba sobre todos los contactos `pendiente` y registra la
  ejecución en `contactos_rutinas`, incluso si no había nada que
  procesar (`procesados: 0`).

```bash
# ejemplo de lectura de pendientes
curl -s "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1/contactos_contactos?estado_sintesis=eq.pendiente" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON"

# ejemplo de escritura del resultado
curl -s -X PATCH "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1/contactos_contactos?id=eq.<ID>" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"resumen":"...","etiquetas":["amigo","padel"],"estado_sintesis":"procesado"}'
```

Al abrir la app (o pulsar ↻) los contactos procesados muestran ya el
resumen y las etiquetas nuevas.
