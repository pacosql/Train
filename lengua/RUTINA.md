# Rutinas de Lengua

Hay dos, con trabajos distintos:

| | Cada 5 minutos | Cada noche (00:00, Madrid) |
|---|---|---|
| Dónde corre | Dentro de Supabase (`pg_cron`, job `lengua_preparar`) | Routine de Claude Code `trig_01MMy9KN7bkk5UuP456E8Wvt` (sesión nueva cada noche) |
| Qué hace | **Elige** las siguientes 60 preguntas de cada alumno según su nivel | **Mejora el banco**: corrige, reescribe explicaciones, escribe preguntas nuevas |
| Código | [`supabase/002_preparar.sql`](./supabase/002_preparar.sql) | Este fichero + [`tools/db.py`](./tools/db.py) |

## Rutina de 5 minutos (automática, no hay que hacer nada)

`lengua_preparar_todos()` recorre los alumnos activos y para cada uno:

1. Recalcula su nivel por área (`lengua_nivel`) con sus 15 últimas
   respuestas de cada área: acierto suavizado → dificultad que le toca
   (`nivel_obj`: < 55 % → básico, < 80 % → medio, si no → examen) y dominio
   (aciertos ponderados por dificultad).
2. Rehace su cola (`lengua_cola`, 60 preguntas): repaso de lo fallado hace
   > 2 h, refuerzo de lo que falló y luego acertó (> 3 días), y nuevas
   repartidas por área según lo floja que está, a su dificultad.

La app llama a la misma función (RPC) si al entrar no hay cola, y si
Supabase no contesta elige en el propio navegador: nunca se queda sin
preguntas.

## Rutina nocturna (Claude)

Objetivo: que cada día las preguntas y las explicaciones sean mejores y que
siempre haya preguntas nuevas del nivel y las áreas que Carmen necesita.
Puede durar 1-2 h: mejor pocas y perfectas que muchas y flojas.

Todo desde la raíz del repo `Train`, con `$SUPABASE_ACCESS_TOKEN` (nunca
lo escribas en un fichero).

1. **Contexto**: `python3 lengua/tools/db.py contexto > /tmp/lengua_ctx.json`
   y léelo entero: banco por área/nivel, nivel de cada alumno por área,
   preguntas sin ver por área y nivel, avisos pendientes, las más
   falladas con el distractor más elegido, las lentas y las últimas
   rutinas. Lee también [`GUIA_PREGUNTAS.md`](./GUIA_PREGUNTAS.md) entera.
2. **Avisos (prioridad máxima)**: para cada aviso pendiente de alumno o
   revisor, decide con criterio:
   - si tiene razón → corrige la pregunta (mismo `id`, se recarga con
     `cargar` y sube de versión) o retírala (`db.py retirar <id> "<motivo>"`);
   - si no → explica por qué en la respuesta.
   Cierra cada uno: `db.py reporte <id> atendido|descartado "<qué hiciste>"`
   (el revisor ve esa respuesta en su pantalla).
   - **Los avisos de «May (experta)» mandan** (página `/lengua/may/`: May,
     María Luisa, es experta y revisa a ciegas). Si dice que la correcta es
     otra, que no está clara o la ha quitado, dale la razón salvo error
     evidente: corrige la pregunta (y vuelve a activarla con `cargar`) o
     déjala retirada si no tiene arreglo. Si la descartas, explica por qué
     con argumentos (gramática, fuente), porque ella lo leerá.
3. **Mejorar lo que falla**: en las preguntas con ≥ 50 % de fallo mira el
   distractor que más eligen (`distractores`, índice en el orden original
   de `o`). Si la pregunta es ambigua o el enunciado confunde, reescríbela.
   Si es correcta pero difícil, mejora el `why` para que explique justo
   esa confusión ("no es X porque…"). Las que se fallan casi siempre a
   nivel 1 quizá sean de nivel 2-3: ajusta `nivel`.
4. **Preguntas nuevas** (mínimo 60 por noche, hasta ~150):
   - reparte según la necesidad: más en las áreas con menor dominio y en
     los niveles en los que quedan pocas sin ver (`sin_ver_por_area_y_nivel`:
     que nunca queden menos de 20 sin ver en el nivel que toca de cada
     área);
   - crea **variantes** de los conceptos que falla (mismo concepto, otro
     ejemplo), no copias;
   - cada noche, además, 10-15 de un tipo nuevo para ir ampliando
     (fragmentos para reconocer época y autor, análisis de un verso,
     marcadores de un texto periodístico, preguntas sobre temas del
     temario aún poco cubiertos…);
   - ids con `db.py siguiente_id <area>` (y seguidos a partir de ahí).
   Escríbelas en `/tmp/lengua_noche.json` siguiendo la guía.
5. **Verificación independiente**: antes de cargar, lanza un subagente que
   revise el fichero sin ver tu razonamiento (¿una sola respuesta
   correcta?, ¿datos y citas exactos?, ¿ortografía impecable?, ¿corta y
   clara?) y quita o corrige lo que señale. Luego
   `python3 lengua/tools/db.py validar /tmp/lengua_noche.json` y
   `python3 lengua/tools/db.py cargar /tmp/lengua_noche.json --origen noche-AAAA-MM-DD`.
6. **Prepara ya**: `python3 lengua/tools/db.py preparar` (rehace las colas con
   lo nuevo).
7. **Registro**: `python3 lengua/tools/db.py log "<una frase: avisos atendidos, preguntas corregidas, nuevas por área, qué ves del nivel>" datos.json`
   (datos.json opcional con el detalle). El padre y el revisor ven esta
   frase.
8. Si aprendes algo útil para próximas noches (qué tipo de pregunta falla
   más, qué funciona), añádelo abajo en «Lo aprendido», haz commit y push
   a `main`. Si no cambias nada del repo, no hagas commit.

## Lo aprendido (actualízalo)

- Banco inicial: 432 preguntas (36 por área, 12 por nivel), noviembre de 2026.
- El tribunal de Murcia puntúa expresamente "identificación y justificación
  de la época y el movimiento" en el comentario literario: `epoca` y
  `autor` son prioritarias.
- La corrección resta 0,5 por falta (3 tildes = 1 falta): `norma` siempre
  presente aunque vaya bien.
