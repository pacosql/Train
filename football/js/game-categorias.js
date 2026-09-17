// "Elige tu categoría": inspirado en Yahtzee. Se muestran 5 dados ya
// tirados y una lista de categorías de puntuación; el jugador debe tocar
// la categoría que da MÁS puntos con esa tirada concreta. Las fórmulas
// de puntuación son un subconjunto simple y verificable de Yahtzee (no
// el juego completo), y se calculan de verdad para cada tirada — nunca
// se inventan ad hoc.
import { randInt, shuffle, saveScore } from "./utils.js";

// Caras de dado Unicode, índice 1-6 (el índice 0 no se usa).
const DICE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

// Cuenta cuántas veces sale cada valor 1-6 en la tirada.
// counts[v] = nº de dados con ese valor (counts[0] siempre 0, sin usar).
function countsOf(dice) {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  dice.forEach((d) => counts[d]++);
  return counts;
}

function sumaTotal(dice) {
  return dice.reduce((a, b) => a + b, 0);
}

// Trío: si hay 3+ dados iguales, puntúa la suma de los 5 dados; si no, 0.
function scoreTrio(dice) {
  const counts = countsOf(dice);
  const hayTrio = counts.some((c) => c >= 3);
  return hayTrio ? sumaTotal(dice) : 0;
}

// Full: exactamente un trío Y un par distinto (es decir, los dados se
// reparten en dos valores con multiplicidades 3 y 2) → 25 puntos fijos;
// si no, 0. (Un 5 iguales, o un 4+1, NO cuenta como full aquí.)
function scoreFull(dice) {
  const distintos = countsOf(dice).filter((c) => c > 0).sort((a, b) => a - b);
  const esFull = distintos.length === 2 && distintos[0] === 2 && distintos[1] === 3;
  return esFull ? 25 : 0;
}

// Escalera pequeña: 4 valores consecutivos distintos entre los 5 dados
// (1-2-3-4, 2-3-4-5 o 3-4-5-6) → 30 puntos fijos; si no, 0.
function scoreEscalera(dice) {
  const unicos = new Set(dice);
  const ventanas = [
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [3, 4, 5, 6],
  ];
  const hayEscalera = ventanas.some((v) => v.every((n) => unicos.has(n)));
  return hayEscalera ? 30 : 0;
}

// Pareja más alta: suma de la pareja de valor más alto que se repita
// (si hay varias parejas, o un trío/póker que también contenga una
// pareja, se usa la de mayor valor); si no hay ninguna pareja, 0.
function scoreParejaAlta(dice) {
  const counts = countsOf(dice);
  for (let v = 6; v >= 1; v--) {
    if (counts[v] >= 2) return v * 2;
  }
  return 0;
}

const CATEGORIES = [
  { id: "suma", label: "Suma total", desc: "Suma de los 5 dados", calc: sumaTotal },
  { id: "trio", label: "Trío", desc: "3+ dados iguales → suma de los 5", calc: scoreTrio },
  { id: "full", label: "Full", desc: "Trío + pareja distinta → 25 pts", calc: scoreFull },
  { id: "escalera", label: "Escalera pequeña", desc: "4 valores seguidos → 30 pts", calc: scoreEscalera },
  { id: "pareja_alta", label: "Pareja más alta", desc: "La pareja repetida de mayor valor", calc: scoreParejaAlta },
];

// Genera una ronda: tira 5 dados, elige 4 o 5 categorías a mostrar
// (todas menos una al azar, o las 5), y calcula la puntuación real de
// cada una para esa tirada. Se exporta aparte de mountCategoriasGame
// para poder testearla sin DOM (ver script de simulación).
export function generateCategoriasRound() {
  let dice;
  let categories;
  let maxScore;
  // Guarda: si TODAS las categorías mostradas puntúan 0 a la vez (ronda
  // sin ninguna opción real), se descarta la tirada y se prueba otra.
  do {
    dice = [randInt(1, 6), randInt(1, 6), randInt(1, 6), randInt(1, 6), randInt(1, 6)];

    const showAll = randInt(0, 1) === 1;
    let pool;
    if (showAll) {
      pool = CATEGORIES.slice();
    } else {
      const excludeIdx = randInt(0, CATEGORIES.length - 1);
      pool = CATEGORIES.filter((_, i) => i !== excludeIdx);
    }
    pool = shuffle(pool);

    categories = pool.map((cat) => ({ id: cat.id, label: cat.label, desc: cat.desc, score: cat.calc(dice) }));
    maxScore = Math.max(...categories.map((c) => c.score));
  } while (maxScore <= 0);

  const winnerIds = categories.filter((c) => c.score === maxScore).map((c) => c.id);
  return { dice, categories, maxScore, winnerIds };
}

export function mountCategoriasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita pulsar dos categorías mientras se resuelve la ronda
  let round = null;
  const timers = [];

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");

  function later(fn, ms) {
    timers.push(setTimeout(() => { if (!finished) fn(); }, ms));
  }

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    round = generateCategoriasRound();
    locked = false;

    body.innerHTML = `
      <div class="cat-dice-row" data-dice></div>
      <p class="prompt">¿Qué categoría da MÁS puntos con esta tirada?
        <small>Toca la categoría que puntúe más alto con estos 5 dados.</small>
      </p>
      <div class="cat-options" data-options></div>
      <div class="feedback" data-feedback></div>
    `;

    const diceEl = body.querySelector("[data-dice]");
    round.dice.forEach((v) => {
      const die = document.createElement("div");
      die.className = "cat-die";
      die.innerHTML = `<span class="cat-die-face">${DICE_FACES[v]}</span><span class="cat-die-num">${v}</span>`;
      diceEl.appendChild(die);
    });

    const optionsEl = body.querySelector("[data-options]");
    const buttons = round.categories.map((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn cat-option-btn";
      btn.innerHTML = `<span class="cat-option-label">${cat.label}</span><span class="cat-option-desc">${cat.desc}</span>`;
      btn.dataset.id = cat.id;
      optionsEl.appendChild(btn);
      return btn;
    });
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => selectCategory(btn, buttons));
    });
  }

  function selectCategory(btn, buttons) {
    if (finished || locked) return;
    locked = true;
    buttons.forEach((b) => { b.disabled = true; });

    const feedback = body.querySelector("[data-feedback]");
    const chosenId = btn.dataset.id;
    const isCorrect = round.winnerIds.includes(chosenId);
    const winnerLabels = round.categories
      .filter((c) => round.winnerIds.includes(c.id))
      .map((c) => c.label)
      .join(" / ");

    if (isCorrect) {
      btn.classList.add("correct");
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! "${btn.querySelector(".cat-option-label").textContent}" daba ${round.maxScore} puntos, la puntuación más alta de esta tirada.`;
      feedback.className = "feedback ok";
      later(nextRound, 1300);
      return;
    }

    btn.classList.add("wrong");
    buttons.forEach((b) => {
      if (round.winnerIds.includes(b.dataset.id)) b.classList.add("correct");
    });
    lives--;
    renderLives();
    feedback.textContent = `No era la mejor opción. La que más puntuaba era "${winnerLabels}" con ${round.maxScore} puntos.`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 1500);
    later(nextRound, 1900);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "categorias", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎲</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} tiradas bien elegidas</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>
    `;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives;
    score = 0;
    rounds = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
  };
}
