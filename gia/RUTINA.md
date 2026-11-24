# Rutina horaria del Entrenador GIA

Esta es la tarea programada que se ejecuta **cada hora** en una sesión nueva
de Claude Code. Su trabajo: mirar cómo va Francisco con la app
(`gia/`, https://pacosql.github.io/Train/gia/), prepararle el siguiente
entrenamiento, decirle si ya está listo para el examen Thomas GIA de
Canonical y, si hace falta, mejorar la app. Todo en **español**.

Referencia del formato del test y de la calibración: `gia/SPEC.md`
(especificación con fuentes: duraciones 5/2/2/3/2 min, fórmula de la
puntuación ajustada, 4 informes de ejemplo y objetivos por tarea). Ya no hay
fecha de examen fija: Francisco se examinará cuando tú le digas que está listo.

Reglas duras:
- Solo tocas la carpeta `gia/` y las tablas `gia_*`. Nunca otras apps ni tablas.
- **Nunca borres** filas de `gia_sesiones` (es el historial del usuario).
- Nunca escribas el token `sbp_...` en ningún archivo.
- Si no hay nada nuevo, termina rápido y sin tocar nada (ver paso 2).

## 1. Preparación

1. El repo debe estar en `/home/user/Train` (si no está, añádelo con
   `add_repo` `pacosql/train` y clónalo). `git fetch origin main && git checkout main && git pull`.
2. Comprueba `$SUPABASE_ACCESS_TOKEN`. Las consultas se hacen así:

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/dzlhsdpgyxnjwudmrnul/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"query": "select ..."}'
```

## 2. ¿Hay algo nuevo?

- Lee el último plan: `select * from gia_plan order by created_at desc limit 1`.
- Cuenta sesiones posteriores: `select count(*) from gia_sesiones where created_at > '<created_at del plan>'`.
- **Si hay 0 sesiones nuevas** y el último plan tiene menos de 24 h: no hagas
  nada más. Responde solo «Sin práctica nueva desde <fecha>; el veredicto sigue
  igual: <veredicto>.» y termina.
- Si hay 0 sesiones nuevas pero el último plan tiene más de 24 h, puedes
  dedicar la hora al paso 5 (mejorar la app), sin crear plan nuevo salvo que
  quieras recordarle que practique (en `veredicto`).

## 3. Análisis

Lee las sesiones (`select id, created_at, modo, tarea, simulacro_id, duracion_s, usado_s,
intentadas, correctas, fallos, neta, neta_norm, percentil, ms_medio, detalle from gia_sesiones
order by created_at`). `detalle` es una lista de preguntas `{s: subtipo, ok, ms, q, r, c}`.

**Modo principal: «▶ Jugar»** (`modo = 'jugar'`). Francisco juega a ratos
sueltos a lo largo del día: bloques de 5–10 preguntas de una tarea que elige la
app (las más flojas pesan más). Cada bloque es una fila con `duracion_s = 0` y
`usado_s` = suma de los tiempos de respuesta. Un bloque suelto es ruidoso: para
estimar, **junta las filas recientes de cada tarea hasta cubrir su duración de
referencia** (como hace la app en `estadoTarea`): neta total / segundos totales ×
duración de referencia → percentil con las curvas de `TAREAS`. La primera vez
que juega cada tipo la app le explica el método mental tras la primera pregunta.

Calcula, ignorando `modo = 'aprendizaje'` para los percentiles:
- Por tarea (razonamiento, perceptiva, numerica, palabras, espacial): percentil
  medio de las 3 últimas sesiones, precisión (correctas / intentadas), ritmo
  (intentadas por minuto), ms medio y tendencia frente a las 3 anteriores.
- Simulacros completos: agrupa por `simulacro_id` (5 tareas). Percentil global
  = media de los 5.
- Puntos débiles: tasa de fallo por `subtipo` en las últimas ~10 sesiones de
  cada tarea (mínimo 4 preguntas por subtipo). Mira también qué preguntas
  concretas falla (`q`, `r`, `c`), p. ej. palabras que confunde.
- Días distintos con práctica y minutos totales.

Subtipos: razonamiento `mas|menos|notan` + `-mismo|-contrario` + opcional
`-qmenos`; numérica `mayor|menor` + `-d1|-d2|-d3` (diferencia entre huecos; d1 es
lo más difícil); palabras `sin|ant|fam`; perceptiva `n0..n4`; espacial `n0..n2`
(+ `-ee` si hay pareja espejo-espejo). Además cada pregunta guarda `x` con el
detalle: perceptiva = parejas no coincidentes (`b/d,q/o`), numérica = huecos,
espacial = tipo arriba-abajo y giro relativo por tarjeta, palabras = nivel (1
común, 2 culto, 3 intrusa del mismo campo).

La **puntuación ajustada** (`neta`) = aciertos − fallos/(opciones−1) y
`neta_norm` es esa cifra escalada a la duración de referencia (5/2/2/3/2 min).
Objetivos «por encima de la media» (percentil 66+), de SPEC.md §4:
razonamiento ≥ 44, perceptiva ≥ 46, numérica ≥ 16, palabras ≥ 32, espacial ≥ 12.

## 4. Plan y veredicto (inserta UNA fila en `gia_plan`)

Columnas: `listo` (bool), `nivel` (`empezando` | `progresando` | `casi` | `listo`),
`veredicto` (1–2 frases para la portada), `mensaje` (2–5 párrafos separados por
línea en blanco: qué ha mejorado, qué falla, qué hacer en la próxima sesión,
y que los percentiles son estimaciones) y `plan` (jsonb):

```json
{
  "orden": ["espacial", "numerica", "razonamiento"],
  "duraciones": {"espacial": 120, "numerica": 120, "razonamiento": 300},
  "foco": {"razonamiento": {"notan-contrario": 3, "menos-contrario": 2}},
  "params": {"numerica": {"rango": [1, 60]}, "perceptiva": {"confusables": 0.7}},
  "feedback": false,
  "nota": "Espacial y numérica primero: es donde más sube tu percentil"
}
```

- `jugar.pesos`: multiplicador por tarea para el modo Jugar (p. ej.
  `{"espacial": 2.5, "palabras": 0.5}`); es lo que más usa, así que ajústalo
  siempre según los puntos débiles.
- `orden`: 2–4 tareas, las más flojas primero (si todo va parejo, las 5 = un simulacro sin ejemplos).
- `foco[tarea][subtipo]` = peso relativo (1 por defecto; 2–4 para lo que falla).
  Se aplica también por prefijo (`"notan": 3` cubre `notan-*`).
- `params`: numérica `rango` del número menor (por defecto [1,40]) y `maxHueco` (por defecto 12),
  perceptiva `confusables` (0–1, por defecto 0.5), razonamiento `qMenos` (0–1, por defecto 0.25).
- `feedback`: `true` solo si la precisión de alguna tarea del plan es < 85 % (para aprender); si no, `false` (como el examen).

**Criterio de «listo»** (`listo = true`, `nivel = 'listo'`), todos a la vez:
1. Al menos 3 simulacros completos, en al menos 2 días distintos. Mientras
   juegue solo en modo Jugar, el veredicto se basa en las estimaciones agrupadas;
   cuando esas estimaciones ya cumplan los puntos 2–4, pídele en el `veredicto`
   que haga simulacros completos para confirmarlo (no puede ser «listo» sin ellos:
   el examen exige aguantar 5 min seguidos por tarea).
2. Los 2 últimos simulacros con percentil global estimado ≥ 70.
3. Ninguna tarea por debajo de 50 en esos 2 simulacros, y al menos 4 de las 5
   tareas con `neta_norm` ≥ su objetivo (44 / 46 / 16 / 32 / 12) en el último.
4. Precisión en el último simulacro ≥ 90 % en razonamiento y ≥ 85 % en el resto.

`casi`: último simulacro ≥ 60 y falla como mucho uno de los puntos 2–4.
`progresando`: hay práctica y mejora; `empezando`: pocos datos o percentiles < 35.
Cuando pase a `listo`, el `veredicto` debe decirlo claramente («Ya puedes
hacer el test»), recordar dormir bien, hacerlo en español con ratón, y
calentar 10 minutos antes con un entrenamiento rápido. Si el rendimiento cae
después, puede volver a `casi`.

## 5. Mejorar la app (opcional, cuando los datos lo pidan)

Ideas, por orden de prioridad:
- **Banco de palabras**: si falla en palabras o lleva > 150 preguntas de palabras
  vistas, inserta 20–40 tríos nuevos en `gia_palabras` (`a`, `b`, `intruso`,
  `relacion` = sin|ant|fam, `nivel` = 1|2|3; ver SPEC.md §2.4: la meta es
  más de 300 tríos activos, mitad sinónimos y mitad contrarios). Deben ser inequívocos: la intrusa sin relación con
  ninguna de las otras dos, sin antónimos «trampa». Desactiva (`activo=false`)
  tríos que resulten ambiguos al revisar sus fallos. Esto no necesita deploy.
- **Calibración**: si hay muchos datos, ajusta con prudencia las curvas
  `curva` o duraciones de `TAREAS` en `gia/index.html` (documenta por qué en el commit).
- **Mejoras de código** pequeñas y seguras (bugs, nuevas variantes de pregunta
  realistas, mejores explicaciones). Cualquier cambio de código:
  1. Rama `claude/gia-rutina-<fecha>`; mantén el marcador `__BUILD_ID__`.
  2. Prueba con Playwright (Chromium preinstalado; `python3 -m http.server` en la
     raíz del repo y abrir `/gia/`): carga sin errores de consola, juega una ronda
     corta de cada tarea modificada. Las filas de prueba que guardes en
     `gia_sesiones` llevan `version = '__BUILD_ID__'`: bórralas solo a ellas
     (`delete ... where version = '__BUILD_ID__'`).
  3. Fusiona en `main`, haz push (despliega solo) y comprueba que
     https://pacosql.github.io/Train/gia/ sirve el build nuevo.
  4. Anota el cambio en `gia/BITACORA.md` (fecha + una línea).

## 6. Respuesta final

Un mensaje corto en español (se le notifica al móvil): el veredicto, el
percentil global estimado, lo que debe entrenar en la próxima sesión y, si lo
hubo, qué has mejorado de la app. Sin listas de próximos pasos para ti.
