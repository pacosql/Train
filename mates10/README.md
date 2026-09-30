# Mates10

Banco de contenidos de matemáticas para España (1º de primaria a 2º de bachillerato), tutor adaptativo y tres aplicaciones web para móvil (alumno, padre, revisor), más un explorador de datos.

- URL: https://pacosql.github.io/Train/mates10/
- Documento de referencia: `fuentes/raw/<id>/` (fuente `MATES10-DOC-UNIFICADO-1.1`) · decisiones: [`DECISIONES.md`](./DECISIONES.md)

## Estructura

| carpeta | qué hay |
|---|---|
| `alumno/`, `padre/`, `revisor/`, `explorar/` | Las aplicaciones (HTML + JS sin build) |
| `supabase/migrations/` | Esquema SQL, frontera y tutor (se aplican con `tools/db.py -f`) |
| `tools/` | Scripts de carga, minado, generación y validación (Python) |
| `fuentes/raw`, `fuentes/text` | Archivo interno de fuentes (no se publica en Pages) |
| `01-contenido/` … `08-apps/` | Datos minados y notas de cada módulo |
| `excel/` | El Excel con todas las tablas y las tablas dinámicas |

## Arrancar

Requiere `SUPABASE_ACCESS_TOKEN` en el entorno (nunca en el repo).

```bash
python3 mates10/tools/db.py -f mates10/supabase/migrations/001_esquema.sql
python3 mates10/tools/db.py -f mates10/supabase/migrations/002_frontera.sql
python3 mates10/tools/seed_base.py
python3 mates10/tools/gen_esquema.py
```

(Se completa en la fase 7.)
