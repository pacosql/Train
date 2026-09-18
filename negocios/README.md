# 📈 Negocios — evaluador de ideas de negocio

Fichas de ideas de negocio evaluadas para el perfil del usuario. La app
muestra una ficha cada vez, ordenadas por puntuación, y el usuario decide:
**👍 Me gusta**, **👎 No me gusta** o **🗑️ Descartar** (todo se puede
deshacer o cambiar después). Está pensada para que una rutina externa vaya
**insertando fichas nuevas** en Supabase y aparezcan aquí sin tocar código.

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
| `fuente` | text | `manual` por defecto; la rutina debe poner p. ej. `rutina` |
| `decision`, `decidido_en`, `notas_usuario` | | los rellena la app: `gusta` · `no_gusta` · `descartar` |

La **puntuación 0-100** la calcula la app a partir de los campos (no se
guarda): éxito ×2,5 + encaje ×2,5 + durabilidad ×1,5 + economía unitaria
(ticket/CAC) ×1,5 + IA (palanca 10 / neutral 6 / amenaza 2) ×1 +
inversión (menos es mejor) ×1.

## Insertar una ficha desde una rutina

La anon key (en `config.js`) puede leer, insertar y actualizar gracias a
las políticas RLS; no puede borrar ni alterar tablas.

```bash
curl -s -X POST "https://dzlhsdpgyxnjwudmrnul.supabase.co/rest/v1/negocios_ideas" \
  -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d '{"fuente":"rutina","nombre":"...","resumen":"...","descripcion":"...",
       "modelo":"B2B","tipo":"tradicional","sector":"...",
       "exito":6,"durabilidad":7,"impacto_ia":"palanca","encaje_perfil":8,
       "inversion_min_eur":20000,"inversion_max_eur":50000,"cac_eur":800,
       "ticket_medio_eur":12000,"meses_hasta_ingresos":3,
       "fortalezas":["..."],"riesgos":["..."],"primer_paso":"..."}'
```

Al abrir la app (o pulsar ↻) la ficha aparece en **Pendientes**.
