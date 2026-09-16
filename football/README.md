# Math Games 🧠

PWA (sin build, HTML/CSS/JS puro) con **10 minijuegos de matemáticas**:
cálculo mental, geometría, álgebra, estadística, fracciones, conversión
de unidades y patrones numéricos. Nace como banco de pruebas rápido
para sacar ideas de mecánicas (tipo Duolingo Math, Synthesis o
DreamBox) de cara a otra app de matemáticas más grande.

Vive en `football/` y usa el prefijo `football_` en Supabase — nombres
heredados de un prototipo anterior de esta misma carpeta, se han
mantenido tal cual en vez de renombrar. Forma parte del hosting
multi-app de este repo — ver el [README de la raíz](../README.md).

## Los 10 juegos

| Juego | Tema | Mecánica |
|---|---|---|
| 🎈 Globos de multiplicar | Multiplicación | Pincha el globo con el resultado correcto antes de que se escape (mide velocidad de respuesta) |
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
resto termina a las 3 vidas. Todos guardan la puntuación final en
Supabase y el menú principal muestra las últimas partidas jugadas.

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

- Menú con los 10 juegos; cada uno abre en su propia pantalla
  (`#/game/<id>`), sin recargar la página.
- Motor de preguntas compartido (`js/quiz-engine.js`) para 9 de los 10
  juegos; el de globos (`js/balloons-game.js`) tiene su propia mecánica
  de animación.
- Guarda cada partida en `football_scores` y muestra las últimas en el
  menú.
- Se puede usar sin conexión gracias a un Service Worker que cachea el
  "shell" de la app (las llamadas a Supabase nunca se cachean). Su
  caché usa el prefijo `football-shell-`.
- Al pie de página muestra un `build <hash>` para confirmar de un
  vistazo qué versión está sirviendo GitHub Pages.
