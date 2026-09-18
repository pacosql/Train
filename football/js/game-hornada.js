// "La hornada con un fallo": una fila de bandejas de pan sigue un patrón
// (aritmético, geométrico o cíclico) salvo UNA bandeja que rompe la
// secuencia. El jugador debe señalar la bandeja que no encaja (no
// completar el patrón, sino detectar cuál de las ya mostradas está mal).
//
// La secuencia CORRECTA se genera entera primero y solo después se
// estropea una única posición (nunca la primera ni la última, para que
// el patrón se pueda inferir por ambos lados). El valor erróneo se elige
// siempre distinto del valor correcto que sustituye y de todos los demás
// valores ya mostrados en la fila, para que no haya ambigüedad sobre cuál
// bandeja es la fallona.
import { randInt, pick, saveScore } from "./utils.js";

const MIN_VAL = 1;
const MAX_VAL = 220;

// Ronda de emergencia por si la generación aleatoria no cuajara tras
// varios intentos: la partida nunca debe quedarse sin ronda que mostrar.
const FALLBACK = {
  type: "arith",
  values: [3, 8, 13, 18, 23, 28],
  displayed: [3, 8, 13, 20, 23, 28],
  faultyIndex: 3,
  correctValue: 18,
  phrase: "el patrón suma 5 cada vez",
};

function inRange(n) {
  return Number.isInteger(n) && n >= MIN_VAL && n <= MAX_VAL;
}

function buildArithmetic() {
  const length = randInt(6, 7);
  const step = randInt(2, 12) * pick([1, -1]);
  const start = randInt(1, 200);
  const values = [];
  for (let i = 0; i < length; i++) values.push(start + step * i);
  if (!values.every(inRange)) return null;
  const abs = Math.abs(step);
  const phrase = step > 0 ? `el patrón suma ${abs} cada vez` : `el patrón resta ${abs} cada vez`;
  return { type: "arith", values, phrase };
}

function buildGeometric() {
  const length = randInt(6, 7);
  const ratio = pick([2, 3]);
  const start = randInt(1, 6);
  const values = [];
  for (let i = 0; i < length; i++) values.push(start * ratio ** i);
  if (!values.every(inRange)) return null;
  const phrase = `el patrón multiplica por ${ratio} cada vez`;
  return { type: "geom", values, phrase };
}

function buildCyclic() {
  const length = randInt(6, 7);
  const cycleLen = pick([2, 3]);
  // El ciclo debe repetirse al menos 2 veces completas para que no haya
  // duda de cuál es el patrón (con longitud 6-7 y ciclo de 2-3 se cumple
  // siempre, pero lo comprobamos igualmente por seguridad).
  if (length < 2 * cycleLen) return null;
  const cycle = [];
  const used = new Set();
  for (let i = 0; i < cycleLen; i++) {
    let v;
    let guard = 0;
    do {
      v = randInt(1, 60);
      guard++;
    } while (used.has(v) && guard < 30);
    used.add(v);
    cycle.push(v);
  }
  // Evita un ciclo degenerado con todos los valores iguales (rompería la
  // idea de "patrón" y crearía ambigüedad con una secuencia constante).
  if (new Set(cycle).size < 2) return null;
  const values = [];
  for (let i = 0; i < length; i++) values.push(cycle[i % cycleLen]);
  if (!values.every(inRange)) return null;
  const phrase = `el patrón repite el ciclo ${cycle.join(", ")}`;
  return { type: "cyclic", values, phrase };
}

function buildBase() {
  const builder = pick([buildArithmetic, buildGeometric, buildCyclic]);
  return builder();
}

function corrupt(base) {
  const { values } = base;
  const length = values.length;
  // Nunca la primera ni la última bandeja, así el patrón se puede
  // reconstruir por ambos lados con las posiciones correctas restantes.
  const faultyIndex = randInt(1, length - 2);
  const correctValue = values[faultyIndex];
  const allValues = new Set(values);
  const candidates = [];
  for (let d = -60; d <= 60; d++) {
    if (d === 0) continue;
    const candidate = correctValue + d;
    if (!inRange(candidate)) continue;
    if (allValues.has(candidate)) continue; // no debe coincidir con NINGÚN valor ya mostrado
    // "Claramente distinto": evitamos desvíos minúsculos que puedan
    // confundirse con un simple redondeo del valor correcto.
    if (Math.abs(d) < 3) continue;
    candidates.push(candidate);
  }
  if (!candidates.length) return null;
  const wrongValue = pick(candidates);
  const displayed = values.slice();
  displayed[faultyIndex] = wrongValue;
  return { ...base, displayed, faultyIndex, correctValue, wrongValue };
}

export function generateHornadaRound() {
  let guard = 0;
  while (guard < 80) {
    guard++;
    const base = buildBase();
    if (!base) continue;
    const round = corrupt(base);
    if (round) return round;
  }
  return FALLBACK;
}

function ordinalTray(n) {
  return `${n}ª`;
}

export function mountHornadaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
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

  function nextRound() {
    if (finished) return;
    answered = false;
    round = generateHornadaRound();
    body.innerHTML = `
      <p class="prompt">Una bandeja no encaja en la hornada<small>Toca la bandeja que rompe el patrón</small></p>
      <div class="hnd-trays" data-trays></div>
      <div class="feedback" data-feedback></div>
    `;
    const traysEl = body.querySelector("[data-trays]");
    round.displayed.forEach((val, i) => {
      const btn = document.createElement("button");
      btn.className = "hnd-tray";
      btn.innerHTML = `<span class="hnd-emoji">🥐</span><span class="hnd-num">${val}</span>`;
      btn.addEventListener("click", () => tapTray(i, btn, traysEl));
      traysEl.appendChild(btn);
    });
  }

  function tapTray(i, el, traysEl) {
    if (finished || answered) return;
    answered = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    [...traysEl.children].forEach((c) => (c.disabled = true));
    if (i === round.faultyIndex) {
      el.classList.add("correct");
      score += 10;
      renderScore();
      feedback.textContent = `¡Esa es la bandeja que no encaja! ${round.phrase}.`;
      feedback.className = "feedback ok";
      later(nextRound, 900);
    } else {
      el.classList.add("wrong");
      traysEl.children[round.faultyIndex].classList.add("correct");
      lives--;
      renderLives();
      const correctSeq = round.values.join(",");
      feedback.textContent = `${round.phrase}: ${correctSeq} — la ${ordinalTray(round.faultyIndex + 1)} bandeja debería ser ${round.correctValue}, no ${round.wrongValue}.`;
      feedback.className = "feedback bad";
      if (lives <= 0) later(() => finish(false), 1400);
      else later(nextRound, 1600);
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
    saveScore(client, "hornada", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🥐</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} hornadas revisadas</p>
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
