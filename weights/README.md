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
3. Tras el cardio, la app propone una **lista ordenada de ejercicios**.
   Tú miras qué máquina está libre en el gimnasio y eliges de esa lista.
4. Para el ejercicio elegido, la app te muestra el **último peso**
   usado y una recomendación (subir/mantener/bajar) basada en lo que
   marcaste la vez anterior.
5. Hilo de 3 series × 8 repeticiones — vas marcando cada serie hecha.
6. Al terminar las 3 series, marcas si la **próxima vez** quieres más,
   igual o menos peso — eso es lo que alimenta la recomendación de la
   próxima sesión.
7. Vuelves al paso 3 hasta que pulsas "Terminar entrenamiento".

## Historial

- Desde **inicio**, cada entrenamiento de la lista es navegable: al entrar
  ves qué hiciste ese día, en qué orden, con qué peso y qué marcaste para
  la próxima vez. Desde ahí puedes saltar a la ficha de cualquier máquina.
- La ficha de cada máquina (tanto en el catálogo como durante el
  entrenamiento) incluye una **gráfica de progreso** con los pesos que has
  ido usando a lo largo del tiempo — minutos en el caso del cardio. Es una
  sola serie, así que no lleva leyenda: solo se etiquetan el primer y el
  último punto, y tocando cualquier punto se ve su fecha exacta.

- Cada entrenamiento se puede **borrar** desde su propia pantalla. El
  FK de `weights_session_exercises` tiene `ON DELETE CASCADE`, así que
  al borrar la fila de `weights_sessions` desaparecen con ella los
  ejercicios de ese día (y dejan de contar en las gráficas).

## Añadir una máquina

Solo el **nombre** es obligatorio. El grupo muscular es opcional
(`muscle_group` es nullable) y el tipo de movimiento tiene un cuarto
valor, `otro`, que es el que se usa por defecto: la máquina aparece en
el grupo "Sin clasificar" del catálogo y se puede clasificar más tarde
desde su ficha, sin frenar el entrenamiento para rellenar formularios.

La columna `description` de `weights_exercises` guarda el texto de "cómo
entrenarlo" de cada máquina (colocación, ejecución, errores típicos y
esquema de series). Si está vacía, la app usa un texto genérico.

## Cómo se ordena la lista de ejercicios

Primero se reparten en cestas, porque el orden dentro de cada una solo
tiene sentido comparado con sus iguales:

1. **Lo que tienes empezado** — el ejercicio o el cardio que has
   arrancado y aún no has terminado, arriba del todo para volver a él.
2. **Pendientes** — las máquinas de fuerza que no has hecho hoy. Esta
   es la lista de verdad, y la primera lleva la estrella.
3. **Cardio** — el cardio es el calentamiento o el remate, nunca "el
   siguiente ejercicio", así que baja siempre por debajo de la fuerza.
4. **Ya hecho hoy** — al final, por si quieres repetir algo.

Dentro de cada cesta se puntúa con tres señales:

- **Cuánto hace que no lo haces** (días de calendario, tope 21; "nunca
  lo has hecho" vale lo mismo que tres semanas). Es la señal base.
- **Músculos que ya has trabajado hoy** — resta. Se cuenta con las
  etiquetas de `MUSCLE_TAGS`, no con el texto literal, y el primer
  músculo que nombra la máquina pesa el doble que los de ayuda: así
  el "Tríceps" de *Pecho / Hombro / Tríceps* no bloquea media sala,
  pero el *Pectoral* después del *Press de Pecho* sí cae al fondo.
- **Alternar empuje y tirón** con el último ejercicio de fuerza que
  hiciste — pesa mucho si fue hoy (descanso entre máquinas) y la mitad
  si fue en el entrenamiento anterior.

Cada fila enseña en una línea la razón de estar donde está ("descansas
del tirón de Remo", "hoy ya has trabajado pecho", "9 días sin
hacerlo"), en verde si empuja hacia arriba y en ámbar si la frena.

Para las máquinas asistidas (dominadas/fondos asistidos), la lógica de
peso está invertida: menos peso en la pila = más difícil (menos
ayuda), así que "más difícil la próxima vez" baja el número en vez de
subirlo.

## Esquema de datos (Supabase, prefijo `weights_`)

- `weights_exercises`: catálogo de máquinas/ejercicios (nombre, grupo
  muscular opcional, tipo de movimiento push/pull/cardio/otro, si es
  asistida, y el incremento de peso típico).
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
