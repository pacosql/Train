# Math Games 🧠

PWA (sin build, HTML/CSS/JS puro) con **20 minijuegos de matemáticas**:
cálculo mental, geometría, álgebra, estadística, fracciones, conversión
de unidades, patrones numéricos, tiempo y más. Nace como banco de
pruebas rápido para sacar ideas de mecánicas (tipo Duolingo Math,
Synthesis o DreamBox) de cara a otra app de matemáticas más grande.
Cada juego se puede marcar con 👍 / 👎 desde su propia pantalla, y el
menú los organiza en tres pestañas — 🆕 Nuevos, 👍 Me gusta, 👎 No me
gusta — para llevar el control de qué mecánicas convencen.

Vive en `football/` y usa el prefijo `football_` en Supabase — nombres
heredados de un prototipo anterior de esta misma carpeta, se han
mantenido tal cual en vez de renombrar. Forma parte del hosting
multi-app de este repo — ver el [README de la raíz](../README.md).

## Los 10 juegos "creativos" (mecánica propia, sin opciones A/B/C/D)

| Juego | Tema | Mecánica |
|---|---|---|
| 🎈 Globos de multiplicar | Multiplicación | Pincha el globo con el resultado correcto antes de que se escape (mide velocidad de respuesta) |
| 🫧 Parejas que suman | Cálculo mental | Toca 2 burbujas cuya suma sea el número objetivo |
| 📶 Ordena los números | Orden numérico | Toca los chips en el orden correcto (según la instrucción) |
| 📍 Recta numérica | Sentido numérico | Arrastra un marcador hasta el punto exacto de la recta |
| 🕐 Pon en hora el reloj | Tiempo | Arrastra las agujas de un reloj analógico hasta la hora pedida |
| 🏋️ Equilibra la balanza | Igualdad y pesos | Toca pesas para igualar el peso objetivo; la barra se inclina en vivo |
| 🃏 Memoria matemática | Memoria y cálculo | Voltea cartas para encontrar la pareja operación ↔ resultado |
| 🎯 Atrapa los múltiplos | Múltiplos y reglas | Flujo continuo de números — toca solo los que cumplen la regla vigente |
| 🧱 Construye el número | Valor posicional | Toca columnas de centenas/decenas/unidades hasta formar el número |
| 📐 Ajusta el ángulo | Geometría | Arrastra una flecha sobre un transportador hasta el ángulo pedido |
| ✏️ Une los puntos | Conteo salteado | Toca los puntos en orden (de 2 en 2, de 5 en 5…) y traza el camino |

## Los 10 juegos de "pregunta + 4 opciones" (motor de quiz compartido)

| Juego | Tema | Mecánica |
|---|---|---|
| ⚖️ Mayor o menor | Comparación | Contrarreloj (30s), compara dos números |
| 🧮 Cálculo veloz | Cálculo mental | Contrarreloj (30s), suma/resta/multiplicación |
| 🔺 Formas | Geometría | Nombre y número de lados de una figura |
| 🧩 Encuentra la x | Álgebra | Resuelve una ecuación lineal sencilla |
| 📊 Media y moda | Estadística | Calcula media, mediana o moda de una lista |
| 📏 Distancias | Medidas | Convierte entre mm/cm/m/km |
| 🐘 Pesos | Medidas | Convierte entre g/kg/t |
| 🍕 La tarta | Fracciones | Identifica la fracción sombreada de un círculo |
| 🔢 Secuencias | Patrones | Encuentra el siguiente número de la serie |

Los juegos "contrarreloj" (⚖️ y 🧮) terminan a los 30 segundos; el
resto termina a las 3 vidas o, en 🃏 y 🎯, cuando se completan todas
las parejas. Todos guardan la puntuación final en Supabase y el menú
principal muestra las últimas partidas jugadas.

## Valoración (👍 / 👎 / 🆕)

Cada pantalla de juego tiene, debajo del propio juego, dos botones fijos
"👎 No me gusta" / "👍 Me gusta". Al pulsar uno, el juego pasa a esa
categoría en el menú (pulsar el mismo botón otra vez lo devuelve a
"Nuevo"). El menú principal tiene tres pestañas —🆕 Nuevos, 👍 Me
gusta, 👎 No me gusta— que filtran la cuadrícula de juegos según su
valoración. Esto se guarda en `localStorage` del navegador (es una
preferencia personal de exploración, no vive en Supabase ni se
comparte entre dispositivos).

## 1. Configura tus credenciales

Ya viene configurado en [`config.js`](./config.js) con el proyecto
compartido de este hosting. Si quieres apuntar a otro proyecto:

```js
window.FOOTBALL_CONFIG = {
  url: "https://TU-PROYECTO.supabase.co",
  anonKey: "TU-ANON-KEY",
  tablePrefix: "football_",
};
```

## 2. Tabla de puntuaciones

```sql
create table football_scores (
  id bigint generated always as identity primary key,
  game text not null,
  score int not null,
  rounds int,
  avg_ms int,
  created_at timestamptz default now()
);

alter table football_scores enable row level security;

create policy "allow anon read" on football_scores
  for select to anon using (true);

create policy "allow anon insert" on football_scores
  for insert to anon with check (true);
```

## 3. Publica el sitio (GitHub Pages)

Esta app se despliega junto con el resto del hosting desde la raíz del
repo — ver el paso 3 del [README general](../README.md#3-publica-el-hosting-github-pages).
Una vez publicado, esta app queda en:

`https://<tu-usuario>.github.io/Train/football/`

## Qué hace la app

- Menú con los 20 juegos, organizados en pestañas 🆕/👍/👎; cada juego
  abre en su propia pantalla (`#/game/<id>`), sin recargar la página.
- Motor de preguntas compartido (`js/quiz-engine.js`) para los 9 juegos
  de "pregunta + 4 opciones"; los otros 11 (`js/game-*.js` y
  `js/balloons-game.js`) tienen cada uno su propia mecánica de
  interacción (arrastrar, tocar en orden, emparejar, construir…).
- Guarda cada partida en `football_scores` y muestra las últimas en el
  menú.
- Se puede usar sin conexión gracias a un Service Worker que cachea el
  "shell" de la app (las llamadas a Supabase nunca se cachean). Su
  caché usa el prefijo `football-shell-`.
- Al pie de página muestra un `build <hash>` para confirmar de un
  vistazo qué versión está sirviendo GitHub Pages.
