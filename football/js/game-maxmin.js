// "Panel de vuelos": con un puñado de dígitos sueltos hay que construir el
// mayor o el menor número posible (según toque cada ronda) colocándolos en
// las casillas de un panel de número de vuelo, usando cada dígito dado
// exactamente una vez. El orden en que el jugador TOCA los dígitos del
// banco es el orden en que van cayendo en las casillas, de izquierda a
// derecha — a diferencia de la pesca de divisores, aquí el orden importa.
import { randInt, pick, saveScore } from "./utils.js";

// Objetivo correcto para unos dígitos dados y un target "max"/"min",
// devuelto como array de dígitos (el orden en que deberían colocarse).
//
// - "max": siempre ordenar de mayor a menor.
// - "min": ordenar de menor a mayor, EXCEPTO que si el primer dígito
//   (el de más peso) quedaría en 0 habiendo algún dígito no-cero
//   disponible, un número no puede empezar por 0 — así que en ese caso
//   el hueco inicial se lo lleva el menor dígito NO-CERO, y el resto
//   (incluidos los ceros) va detrás, de menor a mayor.
function computeGoal(digits, target) {
  const sorted = digits.slice().sort((a, b) => a - b);
  if (target === "max") return sorted.slice().reverse();

  // target === "min"
  if (sorted[0] !== 0) return sorted; // no hay problema de cero inicial
  const firstNonZeroIdx = sorted.findIndex((d) => d !== 0);
  if (firstNonZeroIdx === -1) return sorted; // todo ceros (no debería darse)
  const firstDigit = sorted[firstNonZeroIdx];
  const rest = sorted.slice(0, firstNonZeroIdx).concat(sorted.slice(firstNonZeroIdx + 1));
  return [firstDigit, ...rest];
}

// Genera una ronda: entre 4 y 6 dígitos (0-9, con posibles repetidos),
// un objetivo "max" o "min" sorteado, y el número-objetivo correcto ya
// calculado de forma independiente con la regla de arriba.
//
// Se garantiza que hay al menos 2 dígitos distintos (si no, "mayor" y
// "menor" serían el mismo número y la ronda no tendría gracia). Además,
// cuando toca "min", la mitad de las veces (aprox.) se fuerza que el
// banco contenga al menos un 0, para entrenar de verdad el caso especial
// del cero inicial mezclado con rondas normales que no lo necesitan.
export function generateMaxminRound() {
  const slots = randInt(4, 6);
  const target = pick(["max", "min"]);

  let digits;
  do {
    digits = Array.from({ length: slots }, () => randInt(0, 9));
  } while (new Set(digits).size < 2);

  if (target === "min" && !digits.includes(0) && Math.random() < 0.5) {
    digits[randInt(0, slots - 1)] = 0;
  }

  const goal = computeGoal(digits, target);
  return { digits, target, goal, slots };
}

export function mountMaxminGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita tocar el banco mientras se resuelve/transiciona
  let ronda = null;
  // Índices (dentro de ronda.digits) de las fichas del banco ya colocadas
  // en el panel, EN EL ORDEN en que el jugador las tocó. Su longitud es
  // el número de casillas ya llenas.
  let placedIdx = [];
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

  function nextRound() {
    ronda = generateMaxminRound();
    placedIdx = [];
    locked = false;

    const targetLabel = ronda.target === "max" ? "MAYOR" : "MENOR";
    body.innerHTML = `
      <p class="prompt">Forma el <b>${targetLabel}</b> número posible
        <small>Toca los dígitos del banco en el orden en que quieras colocarlos en el panel de vuelo. Usa todos, uno por casilla.</small>
      </p>
      <div class="mxm-panel" data-panel></div>
      <div class="mxm-bank" data-bank></div>
      <div class="feedback" data-feedback></div>
      <button class="secondary mxm-reset-btn" type="button" data-reset>↺ Empezar de nuevo</button>
    `;

    body.querySelector("[data-reset]").addEventListener("click", resetPlacement);
    renderPanel();
    renderBank();
  }

  function renderPanel() {
    const panelEl = body.querySelector("[data-panel]");
    if (!panelEl) return;
    panelEl.innerHTML = "";
    for (let i = 0; i < ronda.slots; i++) {
      const slot = document.createElement("div");
      const idx = placedIdx[i];
      const filled = idx !== undefined;
      slot.className = "mxm-slot" + (filled ? " mxm-slot-filled" : "");
      slot.textContent = filled ? String(ronda.digits[idx]) : "";
      panelEl.appendChild(slot);
    }
  }

  function renderBank() {
    const bankEl = body.querySelector("[data-bank]");
    if (!bankEl) return;
    bankEl.innerHTML = "";
    const usedSet = new Set(placedIdx);
    ronda.digits.forEach((digit, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn mxm-digit";
      btn.textContent = String(digit);
      if (usedSet.has(idx)) {
        btn.disabled = true;
        btn.classList.add("mxm-digit-used");
      } else {
        btn.addEventListener("click", () => placeDigit(idx));
      }
      bankEl.appendChild(btn);
    });
  }

  function placeDigit(idx) {
    if (finished || locked) return;
    if (placedIdx.includes(idx)) return;
    if (placedIdx.length >= ronda.slots) return;
    placedIdx.push(idx);
    renderPanel();
    renderBank();
    if (placedIdx.length === ronda.slots) evaluar();
  }

  function resetPlacement() {
    if (finished || locked) return;
    placedIdx = [];
    renderPanel();
    renderBank();
  }

  function evaluar() {
    if (finished || locked) return;
    locked = true;
    const { digits, target, goal } = ronda;
    const playerStr = placedIdx.map((idx) => digits[idx]).join("");
    const goalStr = goal.join("");
    const feedback = body.querySelector("[data-feedback]");
    rounds++;

    if (playerStr === goalStr) {
      score += 10;
      renderScore();
      const etiqueta = target === "max" ? "mayor" : "menor";
      feedback.textContent = `¡Correcto! ${goalStr} es el ${etiqueta} número posible con esos dígitos.`;
      feedback.className = "feedback ok";
      later(() => nextRound(), 1100);
      return;
    }

    lives--;
    renderLives();
    const sorted = digits.slice().sort((a, b) => a - b);
    const zeroRuleApplied = target === "min" && sorted[0] === 0 && goal[0] !== 0;
    let mensaje = `El número correcto era ${goalStr}.`;
    if (target === "max") {
      mensaje += " Para el mayor número, coloca los dígitos de mayor a menor.";
    } else if (zeroRuleApplied) {
      mensaje += ` El menor no puede empezar por 0, así que el primer hueco lleva el menor dígito distinto de cero (${goal[0]}), y el resto va detrás de menor a mayor.`;
    } else {
      mensaje += " Para el menor número, coloca los dígitos de menor a mayor.";
    }
    feedback.textContent = mensaje;
    feedback.className = "feedback bad";

    if (lives <= 0) return later(() => finish(false), 1500);
    later(() => nextRound(), 2000);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "maxmin", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>✈️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} paneles completados</p>
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
