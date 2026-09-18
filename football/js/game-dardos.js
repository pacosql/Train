// "Cierra la partida": dardos 501. Con un marcador restante R, hay que
// elegir entre varias tiradas candidatas cuál deja el marcador
// EXACTAMENTE en 0. La resta sola no basta: si una tirada vale más que R
// te "pasas" (bust, regla real de los 501) y la tirada no cuenta, así que
// hay que aplicar también esa restricción, no solo comparar números.
import { randInt, pick, saveScore } from "./utils.js";

const MULT_LABEL = { 1: "Sencillo", 2: "Doble", 3: "Triple" };
const MIN_R = 10;
const MAX_R = 60;

function throwValue(mult, num) {
  return mult * num;
}

export function generateDardosRound() {
  let r;
  let options;
  do {
    const mult = pick([1, 2, 3]);
    const num = randInt(1, 20);
    const correct = { mult, num, value: throwValue(mult, num) };
    r = correct.value;
    if (r < MIN_R || r > MAX_R) continue;

    const values = new Set([r]);
    const opts = [correct];
    let guard = 0;
    while (opts.length < 4 && guard < 200) {
      guard++;
      const m = pick([1, 2, 3]);
      const n = randInt(1, 20);
      const v = throwValue(m, n);
      if (values.has(v)) continue;
      values.add(v);
      opts.push({ mult: m, num: n, value: v });
    }
    options = opts;
  } while (
    r < MIN_R || r > MAX_R ||
    !options || options.length < 4 ||
    !options.some((o) => o.value > r)
  );

  return { r, options: shuffleOptions(options) };
}

function shuffleOptions(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function optionLabel(o) {
  return `${MULT_LABEL[o.mult]} ${o.num}`;
}

export function mountDardosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let locked = false;
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

  function feedbackFor(option) {
    if (option.value === round.r) {
      return `¡Diana perfecta! ${optionLabel(option)} vale ${option.value}, exactamente lo que quedaba: ${round.r} − ${option.value} = 0.`;
    }
    if (option.value > round.r) {
      return `¡Te pasas! ${optionLabel(option)} vale ${option.value}, más que los ${round.r} que quedaban: eso es "bust", la tirada no cuenta.`;
    }
    return `Te quedas corto: ${optionLabel(option)} vale ${option.value}, y quedarían ${round.r - option.value} puntos por bajar, no acabas la partida.`;
  }

  function nextRound() {
    round = generateDardosRound();
    locked = false;

    body.innerHTML = `
      <p class="prompt">Te quedan <b>${round.r}</b> puntos para acabar la partida de 501<small>Elige la tirada que te deje EXACTAMENTE en 0 — si te pasas, la tirada no cuenta (bust)</small></p>
      <div class="dtb-options" data-options></div>
      <div class="feedback" data-feedback></div>
    `;

    const optionsEl = body.querySelector("[data-options]");
    round.options.forEach((option) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn dtb-option";
      btn.type = "button";
      btn.innerHTML = `<span class="dtb-label">${optionLabel(option)}</span><span class="dtb-value">${option.value} pts</span>`;
      btn.addEventListener("click", () => choose(option, btn));
      optionsEl.appendChild(btn);
    });
  }

  function choose(option, btn) {
    if (finished || locked) return;
    locked = true;
    const feedback = body.querySelector("[data-feedback]");
    const isCorrect = option.value === round.r;

    body.querySelectorAll(".dtb-option").forEach((b) => (b.disabled = true));
    btn.classList.add(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = feedbackFor(option);
      feedback.className = "feedback ok";
      later(nextRound, 1800);
    } else {
      lives--;
      renderLives();
      feedback.textContent = feedbackFor(option);
      feedback.className = "feedback bad";
      if (lives <= 0) {
        later(() => finish(false), 2600);
      } else {
        later(nextRound, 2600);
      }
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "dardos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎯</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} partidas cerradas</p>
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
