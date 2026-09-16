// "Reparte la tarta": se arrastra el cuchillo alrededor de la tarta para
// cortar la fracción pedida. El corte salta de 1/24 en 1/24 (15°) para
// que todas las fracciones del juego sean alcanzables exactamente.
import { pick, clamp, angleFromCenter, saveScore } from "./utils.js";

const UNITS = 24; // porciones de referencia: 1/24 de vuelta = 15°
const STEP = 360 / UNITS;
const R = 78, C = 90;

// Solo fracciones cuyo denominador divide a 24: si no, el corte exacto
// no existiría con el salto de 1/24 y la ronda sería imposible.
const FRACS = [
  [1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 6], [5, 6],
  [1, 8], [3, 8], [5, 8], [7, 8], [1, 12], [5, 12], [7, 12],
];

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function fracLabel(units) {
  if (units === 0) return "0";
  if (units === UNITS) return "1";
  const g = gcd(units, UNITS);
  return `${units / g}/${UNITS / g}`;
}

function wedgePath(units) {
  if (units <= 0) return "M0,0";
  const sweep = units * STEP;
  const a0 = (-90 * Math.PI) / 180;
  const a1 = ((-90 + sweep) * Math.PI) / 180;
  const x0 = C + R * Math.cos(a0), y0 = C + R * Math.sin(a0);
  const x1 = C + R * Math.cos(a1), y1 = C + R * Math.sin(a1);
  const large = sweep > 180 ? 1 : 0;
  return `M${C},${C} L${x0},${y0} A${R},${R} 0 ${large} 1 ${x1},${y1} Z`;
}

function rimPoint(deg, len) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [C + len * Math.cos(rad), C + len * Math.sin(rad)];
}

function ticksSvg() {
  let out = "";
  for (let i = 0; i < UNITS; i++) {
    const [x1, y1] = rimPoint(i * STEP, R - 7);
    const [x2, y2] = rimPoint(i * STEP, R);
    out += `<line class="pe-tarta-tick" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  return out;
}

export function mountTarta2Game(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let answered = false;
  let targetUnits = 0;
  let frac = [1, 2];
  let units = 0;
  let wrapEl, wedgeEl, knifeEl, readoutEl;

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
    // Evita repetir la misma fracción dos rondas seguidas.
    const prev = targetUnits;
    let f, u, guard = 0;
    do {
      f = pick(FRACS);
      u = (f[0] * UNITS) / f[1];
      guard++;
    } while (u === prev && guard < 20);
    frac = f;
    targetUnits = u;
    units = 0;
    answered = false;

    body.innerHTML = `
      <p class="prompt">Corta <b>${frac[0]}/${frac[1]}</b> de la tarta<small>Arrastra el cuchillo alrededor de la tarta</small></p>
      <div class="pe-tarta-wrap" data-wrap>
        <svg class="pe-tarta-svg" viewBox="0 0 180 180">
          <circle class="pe-tarta-base" cx="${C}" cy="${C}" r="${R}"/>
          <path class="pe-tarta-slice" data-wedge d="M0,0"/>
          ${ticksSvg()}
          <line class="pe-tarta-knife pe-tarta-knife-fixed" x1="${C}" y1="${C}" x2="${C}" y2="${C - R}"/>
          <line class="pe-tarta-knife" data-knife x1="${C}" y1="${C}" x2="${C}" y2="${C - R}"/>
          <circle class="pe-tarta-hub" cx="${C}" cy="${C}" r="5"/>
        </svg>
      </div>
      <div class="pe-tarta-readout">Has cortado <b data-readout>0</b></div>
      <div class="feedback" data-feedback></div>
      <button class="primary" data-confirm style="margin-top:12px;">Confirmar</button>
    `;
    wrapEl = body.querySelector("[data-wrap]");
    wedgeEl = body.querySelector("[data-wedge]");
    knifeEl = body.querySelector("[data-knife]");
    readoutEl = body.querySelector("[data-readout]");
    draw();
    bindDrag();
    body.querySelector("[data-confirm]").addEventListener("click", confirm);
  }

  function draw() {
    wedgeEl.setAttribute("d", wedgePath(units));
    const [x, y] = rimPoint(units * STEP, R);
    knifeEl.setAttribute("x2", x);
    knifeEl.setAttribute("y2", y);
    readoutEl.textContent = fracLabel(units);
  }

  function bindDrag() {
    let dragging = false;
    function move(clientX, clientY) {
      const rect = wrapEl.getBoundingClientRect();
      const deg = angleFromCenter(rect.left + rect.width / 2, rect.top + rect.height / 2, clientX, clientY);
      // Se redondea al salto de 1/24 y se mantiene dentro de 0..23 para que
      // el cuchillo no dé la vuelta completa y "corte la tarta entera".
      units = clamp(Math.round(deg / STEP) % UNITS, 0, UNITS - 1);
      draw();
    }
    wrapEl.addEventListener("pointerdown", (e) => {
      if (answered) return;
      dragging = true;
      wrapEl.setPointerCapture(e.pointerId);
      move(e.clientX, e.clientY);
    });
    wrapEl.addEventListener("pointermove", (e) => {
      if (dragging && !answered) move(e.clientX, e.clientY);
    });
    wrapEl.addEventListener("pointerup", () => (dragging = false));
    wrapEl.addEventListener("pointercancel", () => (dragging = false));
  }

  function confirm() {
    if (finished || answered) return;
    answered = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (units === targetUnits) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Corte perfecto!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 750);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Has cortado ${fracLabel(units)}, no ${frac[0]}/${frac[1]}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 800);
      setTimeout(nextRound, 1100);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "tarta2", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🥧</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} cortes</p>
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
    targetUnits = 0;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
  };
}
