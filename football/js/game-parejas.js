// "Parejas que suman": toca dos burbujas cuya suma sea el número objetivo.
// Mecánica de emparejar, no de elegir entre opciones.
import { randInt, shuffle, saveScore } from "./utils.js";

function buildRound() {
  const a = randInt(1, 16);
  const b = randInt(1, 16);
  const target = a + b;
  const values = [a, b];
  while (values.length < 6) values.push(randInt(1, 20));
  return { target, values: shuffle(values) };
}

export function mountParejasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let selected = [];

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
    selected = [];
    body.innerHTML = `
      <p class="prompt">Encuentra 2 burbujas que sumen <b>${round.target}</b></p>
      <div class="bubble-field" data-field></div>
      <div class="feedback" data-feedback></div>
    `;
    const field = body.querySelector("[data-field]");
    round.values.forEach((val, idx) => {
      const el = document.createElement("button");
      el.className = "bubble-chip";
      el.textContent = val;
      el.style.animationDelay = `${(idx % 4) * 0.3}s`;
      el.addEventListener("click", () => tapBubble(idx, el));
      field.appendChild(el);
    });
  }

  function tapBubble(idx, el) {
    if (finished || el.classList.contains("used")) return;
    if (selected.some((s) => s.idx === idx)) return;
    el.classList.add("picked");
    selected.push({ idx, el, val: round.values[idx] });
    if (selected.length < 2) return;

    rounds++;
    const [x, y] = selected;
    const feedback = body.querySelector("[data-feedback]");
    if (x.val + y.val === round.target) {
      x.el.classList.add("correct");
      y.el.classList.add("correct");
      score += 10;
      renderScore();
      feedback.textContent = "¡Pareja correcta!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 550);
    } else {
      x.el.classList.add("wrong");
      y.el.classList.add("wrong");
      lives--;
      renderLives();
      feedback.textContent = "Esa suma no es la buscada…";
      feedback.className = "feedback bad";
      setTimeout(() => {
        if (lives <= 0) return finish(false);
        x.el.classList.remove("picked", "wrong");
        y.el.classList.remove("picked", "wrong");
        selected = [];
      }, 550);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "parejas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🫧</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} intentos</p>
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
