// "Clasifica los números": toca un número y luego la cesta donde
// pertenece. Mecánica de selección + clasificación en dos pasos.
import { randInt, shuffle, saveScore } from "./utils.js";

const SMALL_PRIMES = new Set([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]);

const RULES = [
  { labels: ["Par", "Impar"], test: (n) => n % 2 === 0 },
  { labels: ["Múltiplo de 3", "No múltiplo de 3"], test: (n) => n % 3 === 0 },
  { labels: ["Mayor que 20", "20 o menos"], test: (n) => n > 20 },
  { labels: ["Primo", "No primo"], test: (n) => SMALL_PRIMES.has(n) },
];

function buildRound() {
  const rule = RULES[randInt(0, RULES.length - 1)];
  // 6 números que garanticen al menos 2 de cada cesta (si no, alguna
  // cesta se queda vacía y la ronda se vuelve trivial/rara).
  let nums;
  let guard = 0;
  do {
    nums = Array.from({ length: 6 }, () => randInt(1, 48));
    guard++;
  } while (
    (nums.filter((n) => rule.test(n)).length < 2 || nums.filter((n) => !rule.test(n)).length < 2) &&
    guard < 40
  );
  return { rule, nums: shuffle(nums) };
}

export function mountClasificaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let selected = null;
  let remaining = 0;

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
    selected = null;
    remaining = round.nums.length;
    body.innerHTML = `
      <p class="prompt">Clasifica cada número<small>Toca un número y luego su cesta</small></p>
      <div class="sort-chips" data-chips></div>
      <div class="sort-baskets" data-baskets></div>
      <div class="feedback" data-feedback></div>
    `;
    const chipsEl = body.querySelector("[data-chips]");
    round.nums.forEach((n) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn sort-chip";
      btn.textContent = n;
      btn.addEventListener("click", () => pickChip(n, btn));
      chipsEl.appendChild(btn);
    });
    const basketsEl = body.querySelector("[data-baskets]");
    round.rule.labels.forEach((label) => {
      const btn = document.createElement("button");
      btn.className = "secondary sort-basket";
      btn.textContent = label;
      btn.addEventListener("click", () => dropIntoBasket(label));
      basketsEl.appendChild(btn);
    });
  }

  function pickChip(n, el) {
    if (finished || el.disabled) return;
    if (selected) selected.el.classList.remove("picked");
    selected = { n, el };
    el.classList.add("picked");
  }

  function dropIntoBasket(label) {
    if (finished || !selected) return;
    rounds++;
    const correctLabel = round.rule.test(selected.n) ? round.rule.labels[0] : round.rule.labels[1];
    const feedback = body.querySelector("[data-feedback]");
    if (label === correctLabel) {
      selected.el.disabled = true;
      selected.el.classList.add("correct");
      selected.el.classList.remove("picked");
      remaining--;
      selected = null;
      feedback.textContent = "¡Bien clasificado!";
      feedback.className = "feedback ok";
      if (remaining <= 0) {
        score += 10;
        renderScore();
        setTimeout(nextRound, 650);
      }
    } else {
      lives--;
      renderLives();
      selected.el.classList.add("wrong");
      setTimeout(() => selected && selected.el.classList.remove("wrong"), 350);
      feedback.textContent = "Esa cesta no es…";
      feedback.className = "feedback bad";
      if (lives <= 0) setTimeout(() => finish(false), 400);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "clasifica", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧺</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} números clasificados</p>
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
