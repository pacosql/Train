// "Bombillas binarias": el tablero ya no es un traductor de números, es un
// CONTADOR. El juego nunca dice en qué número hay que dejarlo: pide avanzar
// (o retroceder) de uno en uno, así que hay que descubrir el ACARREO — los
// unos de la derecha se apagan y se enciende el interruptor siguiente.
import { randInt, pick, saveScore } from "./utils.js";

const ALL_PLACES = [32, 16, 8, 4, 2, 1];

// bits: interruptores en juego | steps: pasos seguidos de la ronda
// minFlips: algún paso tiene que mover al menos tantos interruptores, o sea
// que la ronda siempre lleva un acarreo de verdad (nunca sale "toca el 1").
// down: a partir de aquí también puede pedir restar (el acarreo al revés).
const LEVELS = [
  { bits: 5, steps: 2, minFlips: 2, down: false },
  { bits: 5, steps: 3, minFlips: 3, down: true },
  { bits: 6, steps: 3, minFlips: 3, down: true },
  { bits: 6, steps: 4, minFlips: 4, down: true },
];

export function levelFor(streak) {
  return LEVELS[Math.min(Math.floor(streak / 2), LEVELS.length - 1)];
}

// Interruptores que cambian al sumar 1: todos los unos de la derecha se
// apagan y se enciende el primer cero (el acarreo).
function flipsUp(v) {
  let n = 1;
  while (v % 2 === 1) { n++; v = (v - 1) / 2; }
  return n;
}
// Al restar 1 pasa lo simétrico: los ceros de la derecha se encienden y se
// apaga el primer uno.
function flipsDown(v) {
  let n = 1;
  while (v > 0 && v % 2 === 0) { n++; v /= 2; }
  return n;
}

function bitsOf(v, bits) {
  const places = ALL_PLACES.slice(ALL_PLACES.length - bits);
  return places.map((p) => Math.floor(v / p) % 2);
}

// Genera la ronda. Toda combinación de interruptores vale un número distinto,
// así que el estado correcto de cada paso es único; lo que hay que garantizar
// es que el camino entero cabe en los interruptores (sin pasar de 0 ni del
// máximo) y que lleva acarreo.
export function makeRound(level, lastStart) {
  const max = Math.pow(2, level.bits) - 1;
  const dirs = level.down ? [1, -1] : [1];
  let dir = 1;
  let start = 1;
  let path = [];
  let need = 0;
  let guard = 0;
  do {
    guard++;
    dir = pick(dirs);
    // Sumando: cabe hasta max. Restando: el contador nunca baja de 1.
    start = dir > 0 ? randInt(1, max - level.steps) : randInt(level.steps + 1, max);
    path = [];
    for (let i = 0; i < level.steps; i++) path.push(start + dir * i);
    need = path.reduce((m, v) => Math.max(m, dir > 0 ? flipsUp(v) : flipsDown(v)), 0);
  } while ((need < level.minFlips || start === lastStart) && guard < 400);
  return { dir, start, path, end: start + dir * level.steps, maxFlips: need, guard };
}

function bulbSvg() {
  return `
    <svg class="bn-svg" viewBox="0 0 40 52" aria-hidden="true">
      <path class="bn-glass" d="M20,4 a13,13 0 0 1 8.4,23 c-1.6,1.4 -2.4,2.8 -2.6,4.4 h-11.6 c-0.2,-1.6 -1,-3 -2.6,-4.4 A13,13 0 0 1 20,4 Z"/>
      <path class="bn-fil" d="M15,24 l3,-6 l2,4 l2,-4 l3,6"/>
      <rect class="bn-cap" x="13.5" y="34" width="13" height="4" rx="1.5"/>
      <rect class="bn-cap" x="13.5" y="40" width="13" height="4" rx="1.5"/>
    </svg>`;
}

export function mountBinarioGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false; // no se toca mientras se resuelve el paso
  let level = LEVELS[0];
  let places = [];
  let round = null;
  let stepIndex = 0;
  let cur = 0;
  let flips = 0;
  let lastStart = -1;
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

  function stepStart() {
    return round.path[stepIndex];
  }
  function stepGoal() {
    return round.path[stepIndex] + round.dir;
  }

  function nextRound() {
    if (finished) return;
    level = levelFor(streak);
    round = makeRound(level, lastStart);
    lastStart = round.start;
    places = ALL_PLACES.slice(ALL_PLACES.length - level.bits);
    stepIndex = 0;
    cur = round.start;
    flips = 0;
    locked = false;

    const verb = round.dir > 0 ? "Suma 1" : "Resta 1";
    body.innerHTML = `
      <p class="prompt">${verb} en el contador<small>${round.path.length} veces seguidas: mueve los interruptores en cada paso</small></p>
      <div class="bn-steps" data-steps></div>
      <div class="bn-board" data-board></div>
      <div class="bn-readout">El contador marca <b data-readout>${round.start}</b></div>
      <div class="feedback" data-feedback></div>
      <div class="bn-why" data-why hidden></div>
      <div class="bn-actions">
        <button class="primary" data-confirm>✓ Ya está</button>
        <button class="secondary" data-undo>↺ Deshacer</button>
      </div>
    `;
    const board = body.querySelector("[data-board]");
    places.forEach((p, i) => {
      const btn = document.createElement("button");
      btn.className = "bn-switch";
      btn.type = "button";
      btn.dataset.idx = String(i);
      btn.innerHTML = `${bulbSvg()}<span class="bn-place">${p}</span>`;
      btn.addEventListener("click", () => toggle(i));
      board.appendChild(btn);
    });
    body.querySelector("[data-confirm]").addEventListener("click", confirmStep);
    body.querySelector("[data-undo]").addEventListener("click", undo);
    renderSteps();
    renderBoard();
  }

  function renderSteps() {
    const el = body.querySelector("[data-steps]");
    el.innerHTML = "";
    round.path.forEach((_, i) => {
      const chip = document.createElement("span");
      chip.className = "bn-step" + (i < stepIndex ? " done" : i === stepIndex ? " now" : "");
      chip.textContent = round.dir > 0 ? "+1" : "−1";
      el.appendChild(chip);
    });
  }

  function renderBoard() {
    const on = bitsOf(cur, level.bits);
    body.querySelectorAll(".bn-switch").forEach((btn, i) => {
      btn.classList.toggle("on", on[i] === 1);
    });
    body.querySelector("[data-readout]").textContent = cur;
  }

  function clearFeedback() {
    const fb = body.querySelector("[data-feedback]");
    fb.textContent = "";
    fb.className = "feedback";
  }

  function toggle(i) {
    if (finished || locked) return;
    const on = bitsOf(cur, level.bits);
    cur += on[i] === 1 ? -places[i] : places[i];
    flips++;
    clearFeedback();
    renderBoard();
  }

  function undo() {
    if (finished || locked) return;
    cur = stepStart();
    flips = 0;
    clearFeedback();
    renderBoard();
  }

  // Panel del porqué: las dos filas de interruptores, con los que tenían que
  // cambiar marcados, para que se VEA el acarreo en vez de solo leer un número.
  function renderWhy(from, to) {
    const a = bitsOf(from, level.bits);
    const b = bitsOf(to, level.bits);
    const offs = [];
    const ons = [];
    places.forEach((p, i) => {
      if (a[i] === 1 && b[i] === 0) offs.push(p);
      if (a[i] === 0 && b[i] === 1) ons.push(p);
    });
    const row = (vals, other) => vals.map((bit, i) => {
      const changed = bit !== other[i];
      return `<i class="bn-bit${bit ? " up" : ""}${changed ? " chg" : ""}">${bit}</i>`;
    }).join("");
    const sign = round.dir > 0 ? "+" : "−";
    const parts = [];
    if (offs.length) parts.push(`se apaga${offs.length > 1 ? "n" : ""} ${offs.join(", ")}`);
    if (ons.length) parts.push(`se enciende${ons.length > 1 ? "n" : ""} ${ons.join(", ")}`);
    const tail = round.dir > 0 && offs.length
      ? ` — los unos de la derecha se agotan y llevas una al sitio siguiente.`
      : round.dir < 0 && ons.length
        ? ` — no hay nada que quitar a la derecha, así que pides prestado al sitio siguiente.`
        : "";
    const why = body.querySelector("[data-why]");
    why.hidden = false;
    why.innerHTML = `
      <div class="bn-why-head">${from} ${sign} 1 = ${to}</div>
      <div class="bn-why-places">${places.map((p) => `<i>${p}</i>`).join("")}</div>
      <div class="bn-why-row">${row(a, b)}</div>
      <div class="bn-why-arrow">↓</div>
      <div class="bn-why-row">${row(b, a)}</div>
      <p class="bn-why-text">Cambian ${offs.length + ons.length} interruptores: ${parts.join(" y ")}${tail}</p>
    `;
  }

  function confirmStep() {
    if (finished || locked) return;
    const goal = stepGoal();
    const fb = body.querySelector("[data-feedback]");
    if (cur === goal) {
      const used = flips;
      stepIndex++;
      if (stepIndex >= round.path.length) {
        // Ronda completa: +10, siempre 10.
        locked = true;
        rounds++;
        streak++;
        score += 10;
        renderScore();
        renderSteps();
        fb.textContent = `¡Contador en ${cur}! Cadena completa`;
        fb.className = "feedback ok";
        return later(nextRound, 900);
      }
      flips = 0;
      renderSteps();
      fb.textContent = `Bien: ${goal - round.dir} ${round.dir > 0 ? "+" : "−"} 1 = ${goal} con ${used} cambio${used > 1 ? "s" : ""}`;
      fb.className = "feedback ok";
      return;
    }
    // Fallo: se explica el paso con los interruptores antes de seguir.
    locked = true;
    lives--;
    streak = 0;
    renderLives();
    fb.textContent = `Has dejado ${cur} y tocaba ${goal}`;
    fb.className = "feedback bad";
    cur = stepStart();
    renderBoard();
    renderWhy(stepStart(), goal);
    if (lives <= 0) return later(() => finish(false), 2400);
    later(nextRound, 2600);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "binario", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>💡</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} cadenas contadas en binario</p>
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
    streak = 0;
    finished = false;
    lastStart = -1;
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
