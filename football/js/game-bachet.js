// "Pesas de Bachet": problema clásico de Bachet de Méziriac (popularizado
// por Martin Gardner). Con 4 pesas de masas 1, 3, 9 y 27, y una balanza de
// dos platos donde las pesas se pueden poner en CUALQUIER plato (incluido
// el mismo plato que el objeto a pesar), se puede pesar cualquier entero
// de 1 a 40 colocando cada pesa en el plato izquierdo (resta, va con el
// objeto), en el derecho (suma, contrarresta desde el otro lado) o sin
// usarla. Esto es exactamente la representación en TERNARIO EQUILIBRADO
// (dígitos -1, 0, 1 en base 3), única para cada entero: no hace falta
// ningún truco para garantizar la unicidad, es un hecho matemático.
import { randInt, saveScore } from "./utils.js";

const WEIGHTS = [1, 3, 9, 27];

// Dígito por pesa (mismo orden que WEIGHTS) en ternario equilibrado:
// -1 = plato izquierdo, 0 = sin usar, 1 = plato derecho.
export function balancedTernaryDigits(n) {
  const digits = [];
  let rem = n;
  for (let i = 0; i < 4; i++) {
    let r = rem % 3;
    if (r === 2) r = -1;
    else if (r === -2) r = 1;
    if (r === -1) rem += 1;
    else if (r === 1) rem -= 1;
    digits.push(r);
    rem = rem / 3;
  }
  return digits;
}

export function generateBachetRound() {
  const target = randInt(1, 40);
  const digits = balancedTernaryDigits(target);
  return { target, digits };
}

// -1 (izquierdo) → 1 (derecho) → 0 (sin usar) → -1 ...
// El ciclo de toques empieza en "sin usar" (estado inicial 0) y avanza a
// derecho, luego a izquierdo, cerrando el círculo de vuelta a sin usar.
function nextState(state) {
  if (state === 0) return 1;
  if (state === 1) return -1;
  return 0;
}

function zoneLabel(state) {
  if (state === -1) return "Plato izquierdo (resta)";
  if (state === 1) return "Plato derecho (suma)";
  return "Sin usar";
}

function zoneClass(state) {
  if (state === -1) return "bch-weight-left";
  if (state === 1) return "bch-weight-right";
  return "bch-weight-unused";
}

function explainSolution(target, digits) {
  const parts = digits.map((d, i) => {
    const w = WEIGHTS[i];
    if (d === 1) return `${w} al plato derecho`;
    if (d === -1) return `${w} al plato izquierdo`;
    return `${w} sin usar`;
  });
  const terms = digits
    .map((d, i) => ({ d, w: WEIGHTS[i] }))
    .filter((x) => x.d !== 0)
    .map((x, idx) => {
      const sign = x.d === 1 ? "+" : "-";
      return idx === 0 ? `${sign === "-" ? "-" : ""}${x.w}` : ` ${sign} ${x.w}`;
    })
    .join("");
  return `${parts.join(", ")} → ${terms || "0"} = ${target}`;
}

export function mountBachetGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let states = null; // estado actual de cada pesa: -1, 0, 1
  let answered = false;
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

  function currentResult() {
    return states.reduce((acc, s, i) => acc + s * WEIGHTS[i], 0);
  }

  function renderResult() {
    const resultEl = body.querySelector("[data-result]");
    if (!resultEl) return;
    const val = currentResult();
    resultEl.textContent = `Resultado parcial: ${val >= 0 ? "+" : ""}${val}`;
  }

  function renderWeights() {
    const wrapEl = body.querySelector("[data-weights]");
    if (!wrapEl) return;
    [...wrapEl.children].forEach((btn, i) => {
      const s = states[i];
      btn.className = `bch-weight ${zoneClass(s)}`;
      btn.querySelector(".bch-weight-zone").textContent = zoneLabel(s);
    });
  }

  function nextRound() {
    if (finished) return;
    answered = false;
    round = generateBachetRound();
    states = [0, 0, 0, 0];
    body.innerHTML = `
      <p class="prompt">Pesa exactamente <span class="bch-target">${round.target}</span><small>Toca cada pesa para moverla entre los platos hasta que el resultado coincida</small></p>
      <div class="bch-zones-legend">
        <span class="bch-zone-tag bch-zone-tag-left">⟵ Plato izquierdo (resta)</span>
        <span class="bch-zone-tag bch-zone-tag-unused">Sin usar</span>
        <span class="bch-zone-tag bch-zone-tag-right">Plato derecho (suma) ⟶</span>
      </div>
      <div class="bch-weights" data-weights></div>
      <div class="bch-result" data-result></div>
      <button class="primary bch-check-btn" data-check>Comprobar</button>
      <div class="feedback" data-feedback></div>
    `;
    const wrapEl = body.querySelector("[data-weights]");
    WEIGHTS.forEach((w, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.addEventListener("click", () => tapWeight(i));
      btn.innerHTML = `<span class="bch-weight-value">${w}</span><span class="bch-weight-zone"></span>`;
      wrapEl.appendChild(btn);
    });
    renderWeights();
    renderResult();
    body.querySelector("[data-check]").addEventListener("click", checkAnswer);
  }

  function tapWeight(i) {
    if (finished || answered) return;
    states[i] = nextState(states[i]);
    renderWeights();
    renderResult();
  }

  function checkAnswer() {
    if (finished || answered) return;
    answered = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const wrapEl = body.querySelector("[data-weights]");
    [...wrapEl.children].forEach((c) => (c.disabled = true));
    body.querySelector("[data-check]").disabled = true;
    const ok = currentResult() === round.target;
    if (ok) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${explainSolution(round.target, round.digits)}.`;
      feedback.className = "feedback ok";
      later(nextRound, 1400);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `No es correcto. La solución era: ${explainSolution(round.target, round.digits)}.`;
      feedback.className = "feedback bad";
      if (lives <= 0) later(() => finish(false), 2200);
      else later(nextRound, 2200);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "bachet", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚖️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} pesadas resueltas</p>
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
