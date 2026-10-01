# Mates10

Banco de contenidos de matemáticas para España (1º de primaria a 2º de bachillerato), tutor adaptativo y tres aplicaciones web para móvil — alumno, padre y revisor — más un explorador de datos.

- **URL:** https://pacosql.github.io/Train/mates10/
- **Excel** (todas las tablas + tablas dinámicas): https://pacosql.github.io/Train/mates10/excel/mates10.xlsx
- **Decisiones tomadas sin preguntar, deuda y preguntas abiertas:** [`DECISIONES.md`](./DECISIONES.md)

## Qué hay (30 sep 2026)

| | cifra |
|---|---|
| Sistemas educativos | 19 (17 comunidades + Ceuta y Melilla), 228 cursos |
| Decretos y órdenes archivados | los 3 reales decretos + primaria, ESO y bachillerato de las 19 (texto extraído; originales en bucket privado) |
| Habilidades (taxonomía) | 792, con 2128 errores típicos y 1568 prerrequisitos |
| Mapa curricular | 14 984 filas de sistema (con 832 contradicciones entre decreto y referencia registradas) + capa editorial de SM, Santillana, Anaya y Edebé |
| Colegios | 636 centros de la Región de Murcia (Registro Estatal de Centros) |
| Métodos / técnicas / enganche | 183 métodos (tradicional, ABN, Singapur, genérico), 43 técnicas y algoritmos, 26 mecanismos de enganche (9 retirados por riesgo con menores) |
| Ejercicios | 29 779 validados (por código y por IA) para las 792 habilidades, 4 opciones y distractores ligados a errores típicos; 2000 publicados provisionalmente (5 por habilidad de primaria) a la espera del revisor |
| Fuentes | ≈ 240, todas archivadas con hash |

## Las aplicaciones

- **Alumno** (`alumno/`): elegir nombre o crear uno nuevo → prueba de nivel (sin datos obligatorios; botón 🔊 para leer en voz alta) → sesiones cortas con OPCIONES, explicación por pasos y reintento, terminan en acierto → progreso por área y tema.
- **Padre** (`padre/`): elegir alumno → informe (dominio por área con evolución, "va por el nivel X de Y", errores que repite, repasos, lo que viene en clase, frase de la semana), ficha editable (curso, comunidad, colegio, editorial, método, mes del temario, duración de sesión) y objetivo (examen o próxima lección).
- **Revisor** (`revisor/`): cola filtrable, ficha con respuesta, distractores y su error, explicación por método, habilidad y frontera; aprobar, rechazar con motivo, editar; plantillas con 20 instancias (aprobar = revisión heredada); habilidades; estadísticas.
- **Explorar** (`explorar/`): cualquier tabla, relaciones navegables, filtros, CSV y tabla dinámica.

## Cómo funciona por dentro

- **Base de datos:** Supabase compartido del hosting Train; todo con prefijo `mates10_`. Esquema en `supabase/migrations/001_esquema.sql`.
- **Frontera** (qué puede ver un alumno): `002_frontera.sql` — colegio > editorial > comunidad; lo introducido este mes solo con dificultad 1.
- **Tutor:** `003_tutor.sql` — BKT para el dominio, FSRS-4.5 para el repaso, cascada del módulo 05 (repaso → preparación → práctica → avance), técnicas (MISMO_ERROR, CONMUTATIVA, VECINO, BAJAR_PRERREQUISITO, SUBIR_DIFICULTAD…), termostato 70–90 %, fin en acierto, prueba de nivel por búsqueda binaria en cada familia, informe al padre y revisión.
- **Ejercicios:** generadores por código en `tools/gen/` (lo calculable) y la skill `.claude/skills/mates10-generar-ejercicios` (problemas y geometría), ambos pasando por el validador en cascada `tools/validador.py` (esquema → recálculo → copia contra el archivo de fuentes → duplicados → frontera).

## Arrancar / regenerar

Requiere `SUPABASE_ACCESS_TOKEN` en el entorno (nunca en el repo).

```bash
# esquema, frontera, tutor, estadísticas
for f in mates10/supabase/migrations/*.sql; do python3 mates10/tools/db.py -f $f; done
python3 mates10/tools/seed_base.py                 # bloques, sistemas, cursos, mecánicas
python3 mates10/tools/cargar_taxonomia.py          # 01-contenido/taxonomia/T*.json
python3 mates10/tools/cargar_didactica.py metodos tecnicas mecanismos asignaciones
python3 mates10/tools/cargar_mapa.py               # sistema + ajustes + editoriales
python3 mates10/tools/cargar_colegios.py ES-MC     # cualquier comunidad: ES-XX
python3 mates10/tools/generar.py --todas --n 40    # ejercicios por código (specs en 02-ejercicios/specs)
python3 mates10/tools/cargar_ejercicios_ia.py mates10/02-ejercicios/ia/*.json
python3 mates10/tools/gen_esquema.py               # relaciones para Explorar
python3 mates10/tools/excel.py                     # excel/mates10.xlsx
```

## Qué no está hecho (todavía)

- **Revisión humana**: ningún ejercicio está revisado; los publicados son provisionales (5 por habilidad de primaria). Con el revisor aprobando plantillas, se publican en bloque.
- ESO y bachillerato tienen ejercicios validados pero **sin publicar** (no se muestran hasta revisarlos).
- Algunas respuestas redondeadas (trigonometría, Bayes, redondeos por contexto) no las recalcula el validador; conviene revisarlas.
- Solo la mecánica OPCIONES; el resto del catálogo está especificado, no construido.
- Colegios solo de Murcia (un comando por comunidad).
- Sin datos de Kumon, Rubio ni fotos de libros (Paco los aportará).

## Deuda conocida

- **Sin autenticación**: cualquiera con la URL puede leer y escribir datos (RLS permisiva). Ver DECISIONES.
- La anon key puede subir ficheros al bucket privado de fuentes (no leerlos).
- Parámetros del tutor (BKT, FSRS, umbrales) con valores de la literatura, sin calibrar con datos reales.
