// "Tragaperras de operaciones": la máquina saca dos números y un resultado, y
// hay que acertar qué operador cierra la igualdad. Lo delicado es que solo un
// operador puede valer: 2 ? 2 = 4 valdría para + y para ×, y eso no puede salir.
import { randInt, pick, saveScore } from "./utils.js";

const OPS = ["+", "−", "×", "÷"];

function applyOp(op, a, b) {
  if (op === "+") return a + b;
  if (op === "−") return a - b;
  if (op === "×") return a * b;
  return b !== 0 && a % b === 0 ? a / b : null; // división solo si es exacta
}

// Genera a, b, resultado y el operador, repitiendo hasta que SOLO uno de los
// cuatro operadores dé ese resultado (empates descartados, nunca ambiguo).
function buildSpin(level) {
  let a, b, result, op;
  let guard = 0;
  do {
    op = pick(level < 3 ? ["+", "−", "×"] : OPS);
    if (op === "+") {
      a = randInt(2, 12 + level * 3);
      b = randInt(2, 9 + level);
    } else if (op === "−") {
      a = randInt(8, 20 + level * 3);
      b = randInt(2, a - 2);
    } else if (op === "×") {
      a = randInt(2, level < 4 ? 9 : 12);
      b = randInt(2, 9);
    } else {
      b = randInt(2, 9);
      const q = randInt(2, 9);
      a = b * q;
    }
    result = applyOp(op, a, b);
    guard++;
  } while (guard < 300 && (result === null || result < 0 || OPS.filter((o) => applyOp(o, a, b) === result).length !== 1));

  // Red de seguridad por si el bucle agotara el guard: 7 × 6 es único (13, 1, 42, —).
  if (result === null || OPS.filter((o) => applyOp(o, a, b) === result).length !== 1) {
    a = 7; b = 6; op = "×"; result = 42;
  }
  return { a, b, result, op };
}

export function mountTragaperrasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let level = 1;
  let spin = null;
  let spinTimer = null;
  let spinStop = null;
  let roundTimer = null;

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

  function clearTimers() {
    if (spinTimer) clearInterval(spinTimer);
    if (spinStop) clearTimeout(spinStop);
    if (roundTimer) clearTimeout(roundTimer);
    spinTimer = spinStop = roundTimer = null;
  }

  function nextRound() {
    spin = buildSpin(level);
    body.innerHTML = `
      <p class="prompt slot-title">¿Qué operación encaja?</p>
      <div class="slot-machine spinning" data-machine>
        <div class="slot-reel" data-a>?</div>
        <div class="slot-reel slot-op" data-op>?</div>
        <div class="slot-reel" data-b>?</div>
        <div class="slot-eq">=</div>
        <div class="slot-reel slot-result" data-res>?</div>
      </div>
      <div class="choices slot-ops" data-choices></div>
      <div class="feedback" data-feedback>Girando…</div>
    `;
    const machine = body.querySelector("[data-machine]");
    const aEl = body.querySelector("[data-a]");
    const bEl = body.querySelector("[data-b]");
    const resEl = body.querySelector("[data-res]");
    const choicesEl = body.querySelector("[data-choices]");

    OPS.forEach((o) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn slot-op-btn";
      btn.textContent = o;
      btn.disabled = true; // bloqueados mientras gira, para no acertar de rebote
      btn.addEventListener("click", () => answer(o, btn));
      choicesEl.appendChild(btn);
    });

    // Giro: números al azar hasta que la máquina "para" en los reales.
    if (spinTimer) clearInterval(spinTimer);
    spinTimer = setInterval(() => {
      aEl.textContent = randInt(1, 30);
      bEl.textContent = randInt(1, 30);
      resEl.textContent = randInt(1, 60);
    }, 70);
    spinStop = setTimeout(() => {
      if (finished) return;
      clearInterval(spinTimer);
      spinTimer = null;
      machine.classList.remove("spinning");
      aEl.textContent = spin.a;
      bEl.textContent = spin.b;
      resEl.textContent = spin.result;
      const fb = body.querySelector("[data-feedback]");
      fb.textContent = "Elige el operador";
      fb.className = "feedback";
      body.querySelectorAll(".slot-op-btn").forEach((b) => (b.disabled = false));
    }, 800);
  }

  function answer(op, btn) {
    if (finished || btn.disabled) return;
    const feedback = body.querySelector("[data-feedback]");
    if (op === spin.op) {
      rounds++;
      score += 10;
      renderScore();
      level++;
      btn.classList.add("correct");
      body.querySelector("[data-op]").textContent = op;
      body.querySelectorAll(".slot-op-btn").forEach((b) => (b.disabled = true));
      feedback.textContent = "¡Premio!";
      feedback.className = "feedback ok";
      if (roundTimer) clearTimeout(roundTimer);
      roundTimer = setTimeout(() => {
        if (!finished) nextRound();
      }, 800);
    } else {
      lives--;
      renderLives();
      btn.classList.add("wrong");
      btn.disabled = true;
      feedback.textContent = "Así no cuadra…";
      feedback.className = "feedback bad";
      if (lives <= 0) setTimeout(() => finish(false), 450);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "tragaperras", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎰</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} premios</p>
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
    clearTimers();
    lives = startLives;
    score = 0;
    rounds = 0;
    level = 1;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimers();
  };
}
