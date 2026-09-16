// "Plano cartesiano": toca la celda que corresponde a las coordenadas
// (x, y) pedidas. Introduce lectura de coordenadas con una cuadrícula
// tocable, distinto de arrastrar o elegir entre texto.
import { randInt, saveScore } from "./utils.js";

const SIZE = 6; // cuadrícula 6x6, coordenadas 0-5

export function mountCoordenadasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let targetX = 0, targetY = 0;

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
    targetX = randInt(0, SIZE - 1);
    targetY = randInt(0, SIZE - 1);
    body.innerHTML = `
      <p class="prompt">Toca el punto <b>(${targetX}, ${targetY})</b></p>
      <div class="coord-grid" data-grid></div>
      <div class="feedback" data-feedback></div>
    `;
    const grid = body.querySelector("[data-grid]");
    grid.style.gridTemplateColumns = `repeat(${SIZE}, 1fr)`;
    // fila 0 de y va abajo del todo (como un eje cartesiano real)
    for (let row = SIZE - 1; row >= 0; row--) {
      for (let col = 0; col < SIZE; col++) {
        const cell = document.createElement("button");
        cell.className = "coord-cell";
        cell.addEventListener("click", () => tapCell(col, row, cell));
        grid.appendChild(cell);
      }
    }
  }

  function tapCell(x, y, el) {
    if (finished || el.disabled) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (x === targetX && y === targetY) {
      el.classList.add("correct");
      score += 10;
      renderScore();
      feedback.textContent = "¡Ahí es!";
      feedback.className = "feedback ok";
      body.querySelectorAll(".coord-cell").forEach((c) => (c.disabled = true));
      setTimeout(nextRound, 550);
    } else {
      lives--;
      renderLives();
      el.classList.add("wrong");
      setTimeout(() => el.classList.remove("wrong"), 300);
      feedback.textContent = "Ahí no es…";
      feedback.className = "feedback bad";
      if (lives <= 0) setTimeout(() => finish(false), 400);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "coordenadas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🗺️</div>
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
