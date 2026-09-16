# Weights 🏋️

Tutor de entrenamiento para el gimnasio. PWA sin build (HTML/CSS/JS
puro), pensada para instalarse en el iPhone y usarse máquina a máquina
durante el entrenamiento. Forma parte del hosting multi-app de este
repo — ver el [README de la raíz](../README.md) para el panorama
general.

## Cómo funciona

1. **Start** → eliges la duración total del entrenamiento (60 / 90 /
   120 min, o una duración custom).
2. La app sugiere cuántos minutos de **elíptica/bicicleta** hacer de
   calentamiento (siempre el primer "ejercicio").
3. Tras el cardio, la app propone una **lista ordenada de ejercicios**
   — prioriza los del grupo opuesto (empuje/tirón) al último que
   hiciste, para que descanses mejor entre máquinas. Tú miras qué
   máquina está libre en el gimnasio y eliges de esa lista.
4. Para el ejercicio elegido, la app te muestra el **último peso**
   usado y una recomendación (subir/mantener/bajar) basada en lo que
   marcaste la vez anterior.
5. Hilo de 3 series × 8 repeticiones — vas marcando cada serie hecha.
6. Al terminar las 3 series, marcas si la **próxima vez** quieres más,
   igual o menos peso — eso es lo que alimenta la recomendación de la
   próxima sesión.
7. Vuelves al paso 3 hasta que pulsas "Terminar entrenamiento".

Para las máquinas asistidas (dominadas/fondos asistidos), la lógica de
peso está invertida: menos peso en la pila = más difícil (menos
ayuda), así que "más difícil la próxima vez" baja el número en vez de
subirlo.

## Esquema de datos (Supabase, prefijo `weights_`)

- `weights_exercises`: catálogo de máquinas/ejercicios (nombre, grupo
  muscular, tipo de movimiento push/pull/cardio, si es asistida, y el
  incremento de peso típico).
- `weights_sessions`: una fila por entrenamiento (duración planeada,
  minutos de cardio, inicio/fin).
- `weights_session_exercises`: una fila por ejercicio hecho dentro de
  una sesión (peso usado, series, repeticiones, y la preferencia
  "más/igual/menos" para la próxima vez).

Añadir una máquina nueva es una fila en `weights_exercises` — no hace
falta tocar el código de la app.

## Configuración

Igual que el resto de apps de este hosting: [`config.js`](./config.js)
tiene la URL y la anon key de Supabase (públicas, protegidas por RLS).
Ver el [README de la raíz](../README.md) para cómo desplegar y cómo
instalar la PWA en el iPhone.
