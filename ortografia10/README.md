# 🔟 Ortografía 10 — aprender ortografía jugando

PWA en blanco y negro con el logotipo elegido en [`ortologo/`](../ortologo)
(familia «Ortografía10» en bloque y alineado a la izquierda, como el nº 1968).

- **URL:** https://pacosql.github.io/Train/ortografia10/
- **Prefijo Supabase:** `ortografia10_` · **caché:** `ortografia10-*`

## Dos lados

- **Jugar**: rondas de 10 ejercicios de tipos variados. Los tipos con 👍
  salen el triple y los 👎 no salen. Cada respuesta enseña la regla
  (competencia de Orto, con su truco) y deja votar ese tipo ahí mismo.
- **Ejercicios** (antes «Valorar»; el id interno sigue siendo `valorar`): los 60 tipos con descripción, ejemplo, de dónde sale la
  idea, ▶ Probar (3 seguidos de ese tipo) y 👍/👎 con el total de todos los
  dispositivos. Tras un 👍 se eligen de 1 a 5 ★ (un 👍 empieza en 3 ★);
  al jugar, cuantas más estrellas, más sale (1★ ×1,5 … 5★ ×6). En
  `ortografia10_votos.valor`: 1-5 = ★, -1 = 👎, 0 = voto quitado.

- **Fichas**: índice de ~120 fichas: una por competencia de Orto (regla,
  palabras que la cumplen, excepciones, errores típicos y truco) y las
  palabras que se confunden (homófonos con ejemplos y «¿las dos valen?»).
  Buscador y filtro por bloque.

- **Nota**: una nota de 0 a 10 (2 decimales) por categoría de ortografía
  (acentuación, tilde diacrítica, porque/por qué, b/v, h, g/j, ll/y, otras
  letras, mayúsculas, puntuación, juntas o separadas, homófonos y las que más
  se escriben mal) y una nota global. Cada respuesta de Jugar cuenta en la
  categoría de su competencia (o la fija del tipo); nota = 10 × aciertos /
  respuestas sobre las últimas 40; con menos de 5 es provisional. Código en
  `nota.js`.

- **Ideas**: 28 ideas en 4 categorías (lanzamiento, viralidad, marketing y
  contenido, retos y juegos) con ranking de potencial 1-10 para antes del
  lanzamiento (`cat`, `pt`, `por` en `ideas.js`; estimación a ojo).
  Cada una se abre con sus pasos y maquetas de pantalla de móvil hechas con
  HTML/CSS (datos inventados), y se vota con 👍/👎 y ★ como los tipos; se guardan en `ortografia10_votos` con
  `tipo = "idea:<id>"`. Ya hechas: imagen de resultado para historias
  (canvas 1080×1920 en blanco y negro, con palabra trampa) y enlace de reto
  `?reto=8/10&t=<índice de palabra>&b=<1 si la trampa está bien>`.

En Valorar cada tipo lleva «🔥 viral» y «🔁 adictivo» de 1 a 3: es una
estimación a ojo (`VA` en `app.js`), no un dato medido.

XP (capa tipo Duolingo): 10 por acierto en Jugar, ×2 desde 3 seguidas y ×3 desde 6; en `localStorage` (`o10.xp`) con el total por semana, que sale en la portada. Objetivo diario elegible (`o10.objetivo`) y protector de racha: +1 🛡️ cada 7 días seguidos (máx. 2), se gasta solo si un día no juegas (`o10.protector`, `o10.protegidos`).

## Tipos de ejercicio

| id | Tipo | Idea de |
|---|---|---|
| `caza` | 🎯 Caza la falta (frase real; o «No hay ninguna falta») | Projet Voltaire |
| `porque` | 💡 ¿Por qué se escribe así? (elige la regla) | Projet Voltaire |
| `bienmal` | ✅ ¿Bien o mal? | Instagram (encuesta) |
| `elige` | 🅰️ ¿Cómo se escribe? A/B/C | Instagram (quiz) |
| `intruso` | 🕵️ El intruso (4 palabras, 1 mal) | Instagram |
| `cuantas` | 🔢 ¿Cuántas faltas hay? (0-3) | Instagram |
| `cartel` | 🪧 El cartel con falta | Instagram (carteles reales) |
| `hueco` | 🕳️ Rellena el hueco (homófonos, diacríticas) | Instagram + Orto |
| `refran` | 📜 El refrán roto (20 refranes hechos a mano) | Orto Redes |
| `reloj` | ⏱️ Contrarreloj 20 s | Orto (semáforo) |
| `letra` | 🔤 Falta la letra | Orto |
| `tilde` | ´ Pon la tilde | Orto |
| `dictado` | 🎧 Dictado (voz del navegador) | Orto |
| `junto` | 🔗 ¿Junto o separado? | Orto |
| `tonica` | 🔊 La sílaba fuerte | Orto |
| `clase` | 🏷️ Aguda, llana o esdrújula | Orto |
| `puntua` | ❗ Comas y puntos | Orto |
| `mayus` | 🔠 Mayúsculas | Orto |
| `parejas` | 🃏 Une las parejas | Orto |
| `dosvalen` | ⚖️ ¿Las dos valen? (A, B o las dos) | Ortografix (Instagram / Threads) |
| `anagrama` | 🔀 Anagrama | juego de palabras |
| `ahorcado` | 🪢 Palabra oculta (ahorcado con tildes) | juego de palabras |
| `vocales` | 🫥 Sin vocales | juego de palabras |
| `diptongo` | 🔗 ¿Diptongo, hiato o triptongo? | clasificaciones |
| `separa` | ✂️ Separa en sílabas | clasificaciones |
| `teoria` | 🎓 Teoría de la tilde (20 preguntas) | clasificaciones |
| `ortodle` | 🟩 Ortodle (Wordle con pista de regla; á ≠ a) | Wordle |
| `intercambia` | 🔄 Intercambia letras (cambios limitados) | Waffle |
| `superviv` | ❤️ Supervivencia (3 vidas, cada vez más rápido, récord) | arcade |
| `lluvia` | 🌧️ Lluvia de palabras (revienta las mal escritas) | arcade |
| `construye` | 🧱 Construye la palabra por sílabas (con sílaba trampa) | construcción |
| `conexiones` | 🧩 Conexiones (4 grupos de 4 por regla) | Connections del NYT |
| `sopa` | 🔎 Sopa de letras (buscas la forma correcta) | pasatiempo |
| `caja` | 🔐 La caja fuerte (4 cierres, 60 s) | escape room de Projet Voltaire |
| `duo` | 🦉 Escribe lo que oyes (banco de fichas con trampas) | Duolingo |
| `rosco` | ⭕ El rosco (A-Z, pasapalabra, 150 s, récord) | Pasapalabra |
| `panal` | 🐝 El panal (7 letras, la del centro obligatoria) | Spelling Bee del NYT |
| `memoria` | 🃏 Memoria de parejas (bien ↔ con falta) | juego de memoria |
| `desliza` | 👆 Desliza la tarjeta hacia la letra buena (25 s) | gesto de Tinder |
| `carrera` | 🏁 Carrera contra el Profe Tilde | duelo |
| `raya` | #️⃣ Tres en raya (aciertas para poner tu ✗) | juego de mesa |
| `diario` | 📅 Reto del día (Ortodle igual para todos, racha de días) | Wordle |
| `corrige` | ✏️ Corrígela tú (escribir sin opciones) | nuevo |
| `autocor` | 📱 El autocorrector (¿aceptas o ignoras su cambio?) | Nuevo (tanda 3) |
| `coma` | 🦸 La coma que salva vidas (qué frase dice lo que quieres decir) | Nuevo (tanda 3) |
| `jefe` | 👾 El jefe final (2-3 faltas = vida del jefe; 3 corazones) | Nuevo (tanda 3) |
| `escalera` | 🪜 La escalera (8 peldaños, plantarse, seguro y 50:50) | Nuevo (tanda 3) |
| `cestas` | 🧺 Las tres cestas (arcade aguda/llana/esdrújula) | Nuevo (tanda 3) |
| `diana` | 🎯 Tiro al acento (arcade de sílaba fuerte) | Nuevo (tanda 3) |
| `hayfalta` | 🔍 ¿Hay falta o no? (WhatsApp, correo o cartel; «Está bien») | Projet Voltaire |
| `anclaje` | ⚓ Repaso de tu regla floja (regla + 3 seguidas) | Projet Voltaire |
| `rapido` | ⚡ Rápido y difícil (15 s, puntos por velocidad y dificultad) | Merriam-Webster |
| `falsas` | ❌ Falsas tildes (tacha guión, dió, exámen…) | Ortografix |
| `truco` | 🪄 El truco (truco de la competencia + 5 frases) | Ortografix |
| `bandera` | 🚩 Bandera roja (mensaje de cita o jefe: ¿huye o quédate?) | Ortografix |
| `tildemsj` | 💌 Una tilde cambia el mensaje (hacia/hacía, sino/si no…) | Ortografix |
| `clasifica` | ↔️ Clasifica deslizando (-ción/-sión, b/v, con o sin tilde; arcade) | Apps de ortografía |
| `repaso` | 🔁 Repaso de tus fallos (palabras falladas hace ≥2 días; `o10.fallos`) | Repetición espaciada |
| `mismo` | 🟰 ¿Es lo mismo? (dos frases: ¿mismo sentido o no?; se comparte como post) | Ortografix |
| `razon` | 💬 ¿Quién tiene razón? (discusión de grupo) | Nuevo (tanda 3) |

En Jugar se cuenta la racha de aciertos seguidos (🔥 desde 3). Supervivencia y
Lluvia guardan récord en el móvil (`o10.rec.*`).

## Material

`datos.json` sale de `orto/datos` con `python3 ortografia10/tools/datos.py`:
4.000 palabras con sus faltas típicas, la lista completa de ~5.800 palabras para el Panal (`W`), 1.500 frases de prensa, 1.300
ejercicios hechos a mano (hueco, elige, caza, frase, parejas) y las 86
competencias con regla y truco. `silabas.js` es una copia del motor de
sílabas de Orto.

## Tablas

`tablas.sql`: `ortografia10_votos` (`tipo`, `valor` 1/-1/0, `dispositivo`)
y `ortografia10_respuestas` (`tipo`, `acierto`, `dispositivo`, `categoria`, `comp`). La app
guarda todo en `localStorage` y lo sube en cola: si la tabla no existe o no
hay red, lo reintenta al abrir.
