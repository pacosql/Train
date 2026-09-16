// "Compara fracciones": dos barras rellenas hasta distintas fracciones —
// toca mayor/menor/igual. Comparación visual, no numérica como en el
// resto de juegos de fracciones/comparación.
import { randInt, shuffle, saveScore } from "./utils.js";

function randFraction() {
  const den = randInt(2, 10);
  const num = randInt(1, den - 1);
  return { num, den, value: num / den };
}
function barHtml(frac) {
  const pct = Math.round(frac.value * 100);
  return `
    <div class="frac-bar-wrap">
      <div class="frac-bar"><div class="frac-bar-fill" style="width:${pct}%"></div></div>
      <div class="frac-bar-label">${frac.num}/${frac.den}</div>
    </div>
  `;
}

export function mountBarrasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;

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
    const a = randFraction();
    let b = randFraction();
    // Si por azar dan el mismo valor, cuenta como "Igual" (caso válido y
    // buscado a veces), pero evita que sean literalmente la misma barra
    // repetida sin querer con demasiada frecuencia: se deja tal cual, es
    // una respuesta legítima del juego.
    const symbol = Math.abs(a.value - b.value) < 1e-9 ? "=" : a.value > b.value ? ">" : "<";
    const labels = { ">": "A es mayor", "<": "B es mayor", "=": "Son iguales" };
    const choices = shuffle([labels[">"], labels["<"], labels["="]]);
    body.innerHTML = `
      <p class="prompt">¿Qué fracción es mayor?</p>
      <div class="frac-compare">
        <div>A${barHtml(a)}</div>
        <div>B${barHtml(b)}</div>
      </div>
      <div class="choices" data-choices></div>
      <div class="feedback" data-feedback></div>
    `;
    const choicesEl = body.querySelector("[data-choices]");
    choices.forEach((label) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = label;
      btn.addEventListener("click", () => answer(label, labels[symbol], btn, choicesEl));
      choicesEl.appendChild(btn);
    });
  }

  function answer(label, correctLabel, btn, choicesEl) {
    if (finished) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    [...choicesEl.children].forEach((c) => (c.disabled = true));
    if (label === correctLabel) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Correcto!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 650);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era: ${correctLabel}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 650);
      setTimeout(nextRound, 950);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "barras", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🍫</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} comparaciones</p>
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
