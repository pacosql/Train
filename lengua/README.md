# 📝 Lengua — oposición de Lengua Castellana y Literatura (Murcia)

Test diario para preparar la oposición de **Profesorado de Secundaria,
Lengua Castellana y Literatura (590-004), Región de Murcia**.

- Portada: `https://pacosql.github.io/Train/lengua/`
- 🎓 Alumno: `/Train/lengua/alumno/` — 50 preguntas al día (A/B/C/D o «No
  lo sé»). Si falla, explicación y el botón «Siguiente» se bloquea 5 s
  para leerla; la fallada vuelve a salir 6 preguntas después. Pausa cada 10.
  «⚑» para avisar de un error en una pregunta.
- 👀 Padre: `/Train/lengua/padre/` — índice de preparación 0-10 y
  veredicto («Diagnóstico en curso», «Necesita base», «En camino», «Casi
  lista», «Lista para el examen») con lo que le falta, nivel por parte del
  examen y por área, constancia (14 días frente al objetivo), evolución,
  las que más falla, qué han hecho las rutinas y el objetivo diario.
- 🔍 Revisor: `/Train/lengua/revisor/` — todo el banco con aciertos y
  distractores elegidos; avisar o retirar preguntas; ver lo que hace la
  rutina nocturna.

## El examen y las áreas

En Murcia (criterios de la comisión de 2023): **desarrollo de un tema** y
**ejercicio práctico** = comentario de texto literario (se puntúa
identificar y justificar época y movimiento) + comentario lingüístico y
pragmático (todos los niveles de la lengua y uso didáctico). La
corrección resta 0,5 por falta de ortografía.

| Parte | Áreas |
|---|---|
| Comentario literario | `epoca`, `autor`, `generos`, `metrica`, `retorica` |
| Comentario lingüístico y pragmático | `morfologia`, `sintaxis`, `lexico`, `texto`, `aula` |
| Tema y corrección | `historia`, `norma` |

Cada pregunta tiene nivel 1 (básico), 2 (medio) o 3 (examen). Guía de
redacción: [`GUIA_PREGUNTAS.md`](./GUIA_PREGUNTAS.md). Banco inicial:
[`semilla/`](./semilla) (desde ahí manda la base de datos).

## Rutinas

- **Cada 5 minutos** (pg_cron en Supabase): recalcula el nivel por área y
  prepara las 60 siguientes preguntas de cada alumno.
- **Cada noche a las 00:00** (Routine de Claude): atiende avisos, mejora
  las explicaciones de lo que más falla y escribe preguntas nuevas.

Detalle en [`RUTINA.md`](./RUTINA.md).

## Tablas (`lengua_`)

`alumno`, `pregunta`, `respuesta`, `cola`, `nivel`, `reporte`,
`rutina_log`. Esquema en [`supabase/`](./supabase); herramientas de la
rutina en [`tools/db.py`](./tools/db.py).
