// "Ordena los números": toca los chips en el orden correcto (ascendente
// o descendente). Mecánica de secuencia por toques, no de elegir opción.
import { randInt, shuffle, saveScore } from "./utils.js";

function buildRound(count) {
  const set = new Set();
  while (set.size < count) set.add(randInt(1, 60));
  const nums = Array.from(set);
  const asc = Math.random() < 0.5;
  const order = [...nums].sort((a, b) => (asc ? a - b : b - a));
  return { shown: shuffle(nums), order, asc };
}

export function mountOrdenGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let nextIdx = 0;
  let completed = 0; // rondas completadas de verdad — sube la dificultad

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
    const count = Math.min(4 + Math.floor(completed / 2), 8);
    round = buildRound(count);
    nextIdx = 0;
    body.innerHTML = `
      <p class="prompt">Toca los números de ${round.asc ? "menor a mayor" : "mayor a menor"}<small>Empieza por ${round.order[0]}</small></p>
      <div class="order-row" data-row></div>
      <div class="feedback" data-feedback></div>
    `;
    const row = body.querySelector("[data-row]");
    round.shown.forEach((val) => {
      const el = document.createElement("button");
      el.className = "choice-btn order-chip";
      el.textContent = val;
      el.addEventListener("click", () => tapChip(val, el));
      row.appendChild(el);
    });
  }

  function tapChip(val, el) {
    if (finished || el.disabled) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (val === round.order[nextIdx]) {
      el.disabled = true;
      el.classList.add("correct");
      nextIdx++;
      if (nextIdx >= round.order.length) {
        completed++;
        score += 10;
        renderScore();
        feedback.textContent = "¡Orden completo!";
        feedback.className = "feedback ok";
        setTimeout(nextRound, 600);
      } else {
        feedback.textContent = `Bien — ahora el ${round.order[nextIdx]}`;
        feedback.className = "feedback ok";
      }
    } else {
      lives--;
      renderLives();
      el.classList.add("wrong");
      feedback.textContent = "Ese no toca ahora…";
      feedback.className = "feedback bad";
      setTimeout(() => el.classList.remove("wrong"), 350);
      if (lives <= 0) setTimeout(() => finish(false), 400);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "orden", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📶</div>
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
    completed = 0;
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
