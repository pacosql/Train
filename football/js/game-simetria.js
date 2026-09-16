// "Simetría": toca la celda que completa la figura simétrica respecto al
// eje central. Razonamiento espacial/visual sobre una cuadrícula.
import { randInt, saveScore } from "./utils.js";

const COLS = 6; // eje de simetría vertical entre la columna 2 y 3
const ROWS = 4;

function buildRound() {
  // Antes se pintaban varias celdas SOLO en la mitad izquierda y se
  // pedía reflejar una cualquiera — con 4-6 celdas de origen había 4-6
  // huecos igual de plausibles a la derecha, pero el juego solo
  // aceptaba uno concreto: ambiguo de verdad, no solo percibido.
  // Ahora se construye la figura simétrica COMPLETA (cada celda con su
  // reflejo ya pintado) y se esconde una única celda al azar — así solo
  // hay un hueco posible en toda la cuadrícula.
  const count = randInt(3, 4);
  const leftCells = new Set();
  while (leftCells.size < count) {
    leftCells.add(`${randInt(0, 2)},${randInt(0, ROWS - 1)}`);
  }
  const full = new Set();
  Array.from(leftCells)
    .map((s) => s.split(",").map(Number))
    .forEach(([x, y]) => {
      full.add(`${x},${y}`);
      full.add(`${COLS - 1 - x},${y}`);
    });
  const fullList = Array.from(full).map((s) => s.split(",").map(Number));
  const missing = fullList[randInt(0, fullList.length - 1)];
  const shown = fullList.filter(([x, y]) => !(x === missing[0] && y === missing[1]));
  return { shown, missing };
}

export function mountSimetriaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;

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

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    round = buildRound();
    body.innerHTML = `
      <p class="prompt">Toca la celda que completa la simetría<small>El espejo está en el centro</small></p>
      <div class="sym-grid" data-grid></div>
      <div class="feedback" data-feedback></div>
    `;
    const grid = body.querySelector("[data-grid]");
    grid.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const cell = document.createElement("button");
        cell.className = "sym-cell";
        if (x === COLS / 2 - 1 || x === COLS / 2) cell.classList.add("sym-axis-edge");
        if (round.shown.some(([fx, fy]) => fx === x && fy === y)) cell.classList.add("filled");
        cell.addEventListener("click", () => tapCell(x, y, cell));
        grid.appendChild(cell);
      }
    }
  }

  function tapCell(x, y, el) {
    if (finished || el.classList.contains("filled")) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (x === round.missing[0] && y === round.missing[1]) {
      el.classList.add("correct");
      score += 10;
      renderScore();
      feedback.textContent = "¡Simétrico!";
      feedback.className = "feedback ok";
      body.querySelectorAll(".sym-cell").forEach((c) => (c.disabled = true));
      setTimeout(nextRound, 600);
    } else {
      lives--;
      renderLives();
      el.classList.add("wrong");
      setTimeout(() => el.classList.remove("wrong"), 300);
      feedback.textContent = "Esa celda no refleja bien la figura…";
      feedback.className = "feedback bad";
      if (lives <= 0) setTimeout(() => finish(false), 450);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "simetria", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🪞</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} toques</p>
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
  };
}
