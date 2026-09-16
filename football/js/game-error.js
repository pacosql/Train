// "Encuentra el error": un cálculo resuelto paso a paso con un único
// fallo. Cada paso arranca del resultado MOSTRADO del anterior (no del
// correcto), así el error no se propaga y solo hay un paso señalable.
import { randInt, pick, saveScore } from "./utils.js";

// Ronda de emergencia: si la generación aleatoria no cuajara, la partida
// nunca debe quedarse sin ronda que mostrar.
const FALLBACK = {
  faulty: 2,
  steps: [
    { from: 20, op: { sym: "+", n: 15 }, shown: 35 },
    { from: 35, op: { sym: "−", n: 8 }, shown: 27 },
    { from: 27, op: { sym: "×", n: 2 }, shown: 56 },
  ],
};

function applyOp(cur, op) {
  if (op.sym === "+") return cur + op.n;
  if (op.sym === "−") return cur - op.n;
  return cur * op.n;
}

function buildOp(cur) {
  // El × solo con valores pequeños para que la cadena no se dispare.
  const kinds = cur <= 40 ? ["+", "−", "×"] : ["+", "−"];
  const sym = pick(kinds);
  if (sym === "+") return { sym, n: randInt(5, 30) };
  if (sym === "−") return { sym, n: randInt(2, Math.min(cur - 1, 25)) };
  return { sym, n: pick([2, 3]) };
}

function tryBuild() {
  const count = randInt(3, 4);
  const faulty = randInt(0, count - 1);
  const steps = [];
  let cur = randInt(12, 40);
  for (let i = 0; i < count; i++) {
    if (cur < 6 || cur > 200) return null;
    const op = buildOp(cur);
    const real = applyOp(cur, op);
    if (real < 4 || real > 220) return null;
    let shown = real;
    if (i === faulty) {
      // Desvío pequeño (error creíble) pero nunca 0: si fuera 0 el paso
      // sería correcto y la ronda se quedaría sin error que buscar.
      const deltas = [];
      for (let d = -9; d <= 9; d++) {
        if (d !== 0 && real + d >= 4 && real + d <= 220) deltas.push(d);
      }
      if (!deltas.length) return null;
      shown = real + pick(deltas);
    }
    steps.push({ from: cur, op, shown });
    cur = shown;
  }
  return { steps, faulty };
}

function buildRound() {
  let round = null;
  let guard = 0;
  do {
    round = tryBuild();
    guard++;
  } while (!round && guard < 60);
  return round || FALLBACK;
}

export function mountErrorGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let answered = false;

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
    if (finished) return;
    answered = false;
    round = buildRound();
    body.innerHTML = `
      <p class="prompt">Uno de los pasos está mal<small>Toca el paso con el error</small></p>
      <div class="err-steps" data-steps></div>
      <div class="feedback" data-feedback></div>
    `;
    const stepsEl = body.querySelector("[data-steps]");
    round.steps.forEach((step, i) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn err-step";
      btn.innerHTML = `<span class="err-num">${i + 1}</span> ${step.from} ${step.op.sym} ${step.op.n} = <b>${step.shown}</b>`;
      btn.addEventListener("click", () => tapStep(i, btn, stepsEl));
      stepsEl.appendChild(btn);
    });
  }

  function tapStep(i, el, stepsEl) {
    if (finished || answered) return;
    answered = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    [...stepsEl.children].forEach((c) => (c.disabled = true));
    if (i === round.faulty) {
      el.classList.add("correct");
      score += 10;
      renderScore();
      feedback.textContent = "¡Ese era el fallo!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 700);
    } else {
      el.classList.add("wrong");
      stepsEl.children[round.faulty].classList.add("correct");
      lives--;
      renderLives();
      feedback.textContent = "Ese paso estaba bien…";
      feedback.className = "feedback bad";
      if (lives <= 0) setTimeout(() => finish(false), 800);
      else setTimeout(nextRound, 1000);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "error", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔎</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} cálculos revisados</p>
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
