// "Suma de fracciones circulares": el jugador ve dos fracciones de
// denominador DISTINTO representadas como porciones coloreadas de dos
// tartas pequeñas (p. ej. 1/4 y 1/6) y debe tocar, sobre una tercera
// tarta de referencia ya dividida en el mínimo común múltiplo de ambos
// denominadores (aquí 12), el número exacto de porciones que representa
// la suma de las dos fracciones convertidas a ese denominador común
// (1/4 = 3/12, 1/6 = 2/12, suma = 5/12 → debe colorear 5 porciones).
import { randInt, pick, saveScore } from "./utils.js";

const DENOMS = [2, 3, 4, 6, 8, 12];

// Ronda de emergencia por si la generación aleatoria no cuajara tras
// varios intentos: la partida nunca debe quedarse sin ronda que mostrar.
// Es además el ejemplo exacto usado en el enunciado del ejercicio.
const FALLBACK = {
  fracA: { num: 1, den: 4 },
  fracB: { num: 1, den: 6 },
  lcd: 12,
  convA: 3,
  convB: 2,
  sumNumerator: 5,
};

function mcd(a, b) {
  let x = a;
  let y = b;
  while (y) {
    [x, y] = [y, x % y];
  }
  return x;
}

function mcm(a, b) {
  return (a * b) / mcd(a, b);
}

export function generateSumafracRound() {
  let guard = 0;
  while (guard < 200) {
    guard++;
    let denomA;
    let denomB;
    let pairGuard = 0;
    do {
      denomA = pick(DENOMS);
      denomB = pick(DENOMS);
      pairGuard++;
    } while ((denomA === denomB || mcm(denomA, denomB) > 12) && pairGuard < 100);
    if (denomA === denomB || mcm(denomA, denomB) > 12) continue;

    const lcd = mcm(denomA, denomB);
    const numA = randInt(1, denomA - 1);
    const numB = randInt(1, denomB - 1);
    const convA = numA * (lcd / denomA);
    const convB = numB * (lcd / denomB);
    const sumNumerator = convA + convB;
    if (sumNumerator > lcd) continue;

    return {
      fracA: { num: numA, den: denomA },
      fracB: { num: numB, den: denomB },
      lcd,
      convA,
      convB,
      sumNumerator,
    };
  }
  return FALLBACK;
}

// --- dibujo de las tartas como SVG (sectores calculados con trigonometría
// básica: 0° arriba, avanzando en sentido horario, igual que las agujas
// de un reloj) ---
function polarPoint(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sliceCommand(cx, cy, r, startDeg, endDeg) {
  const start = polarPoint(cx, cy, r, startDeg);
  const end = polarPoint(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)} Z`;
}

function buildPieSvg(n, size, { filledCount = 0, interactive = false } = {}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3;
  const step = 360 / n;
  let paths = "";
  for (let i = 0; i < n; i++) {
    const d = sliceCommand(cx, cy, r, i * step, (i + 1) * step);
    const filled = i < filledCount;
    const attrs = interactive ? ` data-index="${i}" tabindex="0" role="button" aria-label="Porción ${i + 1}"` : "";
    paths += `<path class="sfr-slice${filled ? " sfr-slice-filled" : ""}" d="${d}"${attrs}></path>`;
  }
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${paths}</svg>`;
}

function explainSumafrac(round, playerCount) {
  const { fracA, fracB, convA, convB, lcd, sumNumerator } = round;
  return `${fracA.num}/${fracA.den} = ${convA}/${lcd} y ${fracB.num}/${fracB.den} = ${convB}/${lcd}, así que la suma es ${convA}/${lcd} + ${convB}/${lcd} = ${sumNumerator}/${lcd}. Coloreaste ${playerCount} porciones, pero eran ${sumNumerator}.`;
}

export function mountSumafracGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let answered = false;
  let colored = null;
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

  function updateCount() {
    body.querySelector("[data-count]").textContent = `Porciones coloreadas: ${colored.size}`;
  }

  function nextRound() {
    if (finished) return;
    answered = false;
    colored = new Set();
    round = generateSumafracRound();
    body.innerHTML = `
      <p class="prompt">Suma las dos fracciones<small>Toca porciones de la tarta grande hasta representar la suma y pulsa Comprobar</small></p>
      <div class="sfr-operands">
        <div class="sfr-operand">
          <div class="sfr-pie sfr-pie-small" data-pie-a></div>
          <div class="sfr-frac-label">${round.fracA.num}/${round.fracA.den}</div>
        </div>
        <div class="sfr-plus">+</div>
        <div class="sfr-operand">
          <div class="sfr-pie sfr-pie-small" data-pie-b></div>
          <div class="sfr-frac-label">${round.fracB.num}/${round.fracB.den}</div>
        </div>
      </div>
      <div class="sfr-ref-wrap">
        <div class="sfr-pie sfr-pie-ref" data-pie-ref></div>
        <div class="sfr-ref-count" data-count>Porciones coloreadas: 0</div>
      </div>
      <button class="primary sfr-check-btn" data-check>Comprobar</button>
      <div class="feedback" data-feedback></div>
    `;
    body.querySelector("[data-pie-a]").innerHTML = buildPieSvg(round.fracA.den, 84, { filledCount: round.fracA.num });
    body.querySelector("[data-pie-b]").innerHTML = buildPieSvg(round.fracB.den, 84, { filledCount: round.fracB.num });
    const refWrap = body.querySelector("[data-pie-ref]");
    refWrap.innerHTML = buildPieSvg(round.lcd, 220, { filledCount: 0, interactive: true });
    refWrap.querySelectorAll("[data-index]").forEach((el) => {
      const idx = Number(el.dataset.index);
      el.addEventListener("click", () => toggleSlice(idx, el));
    });
    body.querySelector("[data-check]").addEventListener("click", checkAnswer);
  }

  function toggleSlice(idx, el) {
    if (finished || answered) return;
    if (colored.has(idx)) {
      colored.delete(idx);
      el.classList.remove("sfr-slice-filled");
    } else {
      colored.add(idx);
      el.classList.add("sfr-slice-filled");
    }
    updateCount();
  }

  function checkAnswer() {
    if (finished || answered) return;
    answered = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const refWrap = body.querySelector("[data-pie-ref]");
    const slices = [...refWrap.querySelectorAll("[data-index]")];
    slices.forEach((el) => el.classList.add("sfr-slice-disabled"));
    body.querySelector("[data-check]").disabled = true;
    const playerCount = colored.size;
    if (playerCount === round.sumNumerator) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${round.fracA.num}/${round.fracA.den} + ${round.fracB.num}/${round.fracB.den} = ${round.convA}/${round.lcd} + ${round.convB}/${round.lcd} = ${round.sumNumerator}/${round.lcd}.`;
      feedback.className = "feedback ok";
      later(nextRound, 1600);
    } else {
      lives--;
      renderLives();
      slices.forEach((el, i) => {
        el.classList.remove("sfr-slice-filled");
        if (i < round.sumNumerator) el.classList.add("sfr-slice-correct");
      });
      feedback.textContent = explainSumafrac(round, playerCount);
      feedback.className = "feedback bad";
      if (lives <= 0) later(() => finish(false), 2800);
      else later(nextRound, 2800);
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
    saveScore(client, "sumafrac", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🥧</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} sumas de fracciones resueltas</p>
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
