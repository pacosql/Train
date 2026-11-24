# ⚡ Power — ¿voy en verde?

App mínima para saber si Paco va bien hacia **perder 1 kg por semana**
(empezando el lunes 16/11/2026 con 104,4 kg, con 2.500 kcal fijas el
sábado y el domingo).

URL: `https://pacosql.github.io/Train/power/`

## Pantallas

- **🚦 Resumen** (gráfico con 3 líneas: objetivo, báscula y dónde deberías estar según lo apuntado): dos semáforos — *Peso* (media de las 3 últimas pesadas
  vs la línea de −1 kg/semana: verde ≤ +0,3 kg, ámbar ≤ +1 kg, rojo más)
  y *Calorías semana* (déficit acumulado de los días cerrados vs el que
  tocaba). Además: kcal que te quedan hoy, tabla de la semana, gráfico
  de peso y **lo que gastas en reposo** (basal Mifflin-St Jeor por día y
  por semana, y con vida diaria sin deporte).
- **🍽️ Comida**: elige el momento (se preselecciona por la hora) y toca
  comidas rápidas con kcal ya conocidas, o haz **fotos / dicta / escribe**
  y queda ⏳ pendiente hasta que la rutina lo calcula.
- **🎾 Ejercicio**: deporte + minutos (kcal por MET netos y tu peso), o
  **pantallazo de la pulsera** / texto → pendiente para la rutina.
- **⚖️ Peso**: número a mano o **foto de la báscula** (la rutina la lee).
- **⋯ Opinar** (arriba a la derecha): texto, dictado o capturas sobre qué
  te gusta y qué no; la rutina lo aplica a la app y responde ahí mismo.
- **⚙️ Ajustes**: peso y fecha de inicio, kg/semana, kcal de finde, sexo,
  edad, altura y nivel de actividad.

## Tabla de la semana y gasto real

- **Tabla de la semana** (‹ › para semanas anteriores): Reposo (gasto sin
  deporte), Ejercicio, Comido, Déficit (= reposo + ejercicio − comido),
  Plan (lo que toca comer ese día: L–V o finde) y vs plan
  (= plan + ejercicio − comido).
- **📏 Gasto real**: para los últimos 7, 14 y 31 días cerrados,
  gasto = (comido + kg bajados según la recta de tendencia de las
  pesadas × 7.700) / días; restando el ejercicio sale el reposo real.
  Avisa si hay menos de 14 días, si no cuadra con la fórmula o si hay
  días con menos de 800 kcal apuntadas.

## Cálculo

- Gasto diario = basal × factor de vida diaria (1,2 sedentaria).
- Déficit semanal = 7.700 kcal × kg/semana.
- Plan laborable = (gasto×7 − déficit − 2×kcal finde) / 5. El ejercicio
  apuntado se **suma** al presupuesto de ese día.

## Tablas (prefijo `power_`)

| Tabla | Para qué |
|---|---|
| `power_ajustes` | una fila (`id=1`) con objetivo y datos personales |
| `power_pesos` | `fecha`, `kg` (null si es foto pendiente), `foto`, `estado`, `detalle` |
| `power_comidas` | `fecha`, `momento`, `texto`, `origen` (rapida/texto/voz/foto), `fotos[]`, `kcal`, `detalle`, `estado` |
| `power_ejercicios` | `fecha`, `texto`, `minutos`, `fotos[]`, `kcal`, `detalle`, `estado` |
| `power_rutinas` | log de cada pasada de la rutina |
| `power_feedback` | sugerencias sobre la app: `texto`, `fotos[]`, `estado` (pendiente/hecho/no), `respuesta`, `atendido_en` |

`estado`: `pendiente` · `procesado`. Nada se borra: la app marca
`borrado = true`. Fotos en el bucket público `power-fotos`
(anon puede subir y leer). RLS: anon lee, inserta y actualiza.

## Rutina de calorías

Una tarea programada de Claude Code se ejecuta **cada hora** en sesión
nueva y sigue [`RUTINA.md`](./RUTINA.md): si hay registros pendientes,
mira las fotos y textos, calcula kcal (o lee el peso de la báscula) y
los escribe; si no hay nada, solo deja constancia en `power_rutinas`.
Usa la suscripción de Claude, no la API de pago.
