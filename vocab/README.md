# Vocabulary 📚

PWA (sin build, HTML/CSS/JS puro) para aprender las **1000 primeras
palabras de inglés** de un alumno de 1º de ESO, al nivel que examina
Cambridge en sus exámenes de Young Learners (Starters/Movers/Flyers) y
A2 Key: no basta con reconocer la palabra, hay que demostrar que se
sabe **usar** en contexto. Sigue el mismo patrón que
[Math Games](../football) (`football/`): cada ejercicio se puede marcar
con 👍/👎/🔧 desde su propia pantalla, y el menú los organiza en cuatro
pestañas para llevar el control de qué mecánicas convencen.

Vive en `vocab/` y usa el prefijo `vocab_` en Supabase. Forma parte del
hosting multi-app de este repo — ver el [README de la raíz](../README.md).

## Catálogo de 25 juegos propuestos

Antes de construir nada se propusieron 25 mecánicas, agrupadas por lo
que examinan de verdad (reconocer el significado, producir la palabra,
usarla en contexto, relacionarla con otras, o repasarla). Esta primera
tanda construye 8 de las 25 — una de cada bloque — para poder empezar a
valorar cuanto antes; el resto se irá añadiendo en tandas sucesivas,
igual que Math Games creció de 20 a 96 ejercicios.

| # | Juego | Bloque | Estado |
|---|---|---|---|
| 1 | 🖼️ Elige la imagen | Reconocimiento | ✅ construido — `#1` |
| 2 | 📖 Elige la definición | Reconocimiento | pendiente |
| 3 | 🔊 Escucha y elige | Reconocimiento | pendiente |
| 4 | 🚫 La intrusa | Reconocimiento | ✅ construido — `#2` |
| 5 | 🗂️ Clasifica en cajones | Reconocimiento | pendiente |
| 6 | ✍️ Escribe la palabra | Producción | ✅ construido — `#3` |
| 7 | 🔤 Letras revueltas | Producción | pendiente |
| 8 | 🧩 Faltan letras | Producción | pendiente |
| 9 | 🔁 Traduce ES↔EN | Producción | ✅ construido — `#4` |
| 10 | 🎙️ Repite y compara | Producción | pendiente |
| 11 | 🧵 Completa la frase | Uso en contexto | ✅ construido — `#5` |
| 12 | 🔗 Palabras que van juntas | Uso en contexto | pendiente |
| 13 | 🧥 Viste la escena | Uso en contexto (multipantalla) | ✅ construido — `#6` |
| 14 | 🎬 La cadena de la escena | Uso en contexto (multipantalla) | ✅ construido — `#7` |
| 15 | 📰 Lee y responde | Uso en contexto | pendiente |
| 16 | ✅ Verdad o mentira | Uso en contexto | pendiente |
| 17 | 🧱 Construye la frase | Uso en contexto | pendiente |
| 18 | 🎭 Un significado, varios usos | Uso en contexto | pendiente |
| 19 | ↔️ Opuestos | Relaciones | pendiente |
| 20 | 🌗 Se parecen | Relaciones | pendiente |
| 21 | 🌳 Familia de palabras | Relaciones | pendiente |
| 22 | 🃏 Memoria bilingüe | Repaso | ✅ construido — `#8` |
| 23 | ⏱️ Contrarreloj mezclado | Repaso | pendiente |
| 24 | 🎯 Atrapa la categoría | Repaso | pendiente |
| 25 | 🖊️ Completa la mini-historia | Producción guiada | pendiente |

## Banco de palabras (primera tanda)

[`js/data/words.js`](./js/data/words.js) tiene **231 palabras** (nivel
A1-A2 Cambridge) repartidas en 15 categorías básicas (familia, cuerpo,
ropa, comida, animales, colores, números, colegio, casa, verbos de cada
día, adjetivos, tiempo atmosférico, trabajos, sitios en la ciudad,
tiempo/calendario) — cada una con traducción, emoji, y una frase de
ejemplo en inglés y en español. Es el punto de partida hacia las 1000;
crecerá en tandas sucesivas igual que los ejercicios.

[`js/data/scenes.js`](./js/data/scenes.js) define las "escenas" que usan
los juegos #6 y #7 (Viste la escena / La cadena de la escena): grupos de
palabras que se usan juntas de verdad (bufanda→cuello, gorro→cabeza,
guantes→manos…) sobre una figura de persona dibujada con CSS puro (sin
imágenes, [`js/person-figure.js`](./js/person-figure.js)).

## Valoración (🆕 / 👍 / 👎 / 🔧)

Igual que en Math Games: cada pantalla de juego tiene tres botones
("👎 No me gusta", "🔧 Revisar", "👍 Me gusta"). Se guarda en la tabla
`vocab_ratings` de Supabase (compartida entre dispositivos). "🔧
Revisar" significa "me gusta la idea pero algo falla o se puede
mejorar" — señal para volver a ese ejercicio y arreglarlo antes de
pasar a "👍 Me gusta".

## 1. Configura tus credenciales

Ya viene configurado en [`config.js`](./config.js) con el proyecto
compartido de este hosting.

## 2. Tablas de Supabase

```sql
create table vocab_scores (
  id bigint generated always as identity primary key,
  game text not null,
  score int not null,
  rounds int,
  avg_ms int,
  created_at timestamptz default now()
);
alter table vocab_scores enable row level security;
create policy "allow anon read" on vocab_scores for select to anon using (true);
create policy "allow anon insert" on vocab_scores for insert to anon with check (true);

create table vocab_ratings (
  game text primary key,
  rating text not null check (rating in ('like', 'dislike', 'review')),
  note text,
  updated_at timestamptz default now()
);
alter table vocab_ratings enable row level security;
create policy "allow anon read" on vocab_ratings for select to anon using (true);
create policy "allow anon insert" on vocab_ratings for insert to anon with check (true);
create policy "allow anon update" on vocab_ratings for update to anon using (true) with check (true);
create policy "allow anon delete" on vocab_ratings for delete to anon using (true);

create table vocab_meta (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
alter table vocab_meta enable row level security;
create policy "allow anon read" on vocab_meta for select to anon using (true);
```

## 3. Publica el sitio (GitHub Pages)

Esta app se despliega junto con el resto del hosting desde la raíz del
repo — ver el paso 3 del [README general](../README.md#3-publica-el-hosting-github-pages).
Una vez publicado, esta app queda en:

`https://<tu-usuario>.github.io/Train/vocab/`

## Qué hace la app

- Menú con los ejercicios numerados, organizados en pestañas
  🆕/👍/👎/🔧; cada uno abre en su propia pantalla (`#/game/<id>`), sin
  recargar la página.
- Motor de preguntas compartido (`js/quiz-engine.js`) para los ejercicios
  de "pregunta + opciones" o "escribe la respuesta" (`js/games-data.js`);
  los otros (`js/game-escena.js`, `js/game-cadena.js`,
  `js/game-memoria.js`) tienen cada uno su propia mecánica.
- Guarda cada partida en `vocab_scores` y muestra las últimas en el menú.
- Se puede usar sin conexión gracias a un Service Worker que cachea el
  "shell" de la app. Su caché usa el prefijo `vocab-shell-`.
- Al pie de página muestra un `build <hash>` para confirmar de un
  vistazo qué versión está sirviendo GitHub Pages.
