// "Skyline de rascacielos": el núcleo matemático real del puzzle
// Skyscrapers/Torres (Nikoli), aislado en una sola ronda — contar cuántos
// edificios se VEN desde un extremo de una fila de alturas distintas. Un
// edificio se ve si es más alto que TODOS los anteriores en esa dirección
// (nunca se cuentan "máximos por prefijo" en el resto del catálogo). El
// dibujo del skyline ES la cuenta: no hace falta ningún paso intermedio,
// solo mirar qué barras destacan por encima de todo lo anterior.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const N_POOL = [4, 5, 6];

export function visibleCount(heights, fromLeft) {
  const seq = fromLeft ? heights : heights.slice().reverse();
  let max = 0;
  let count = 0;
  for (const h of seq) {
    if (h > max) {
      count++;
      max = h;
    }
  }
  return count;
}

export function generateRascacielosRound() {
  const n = pick(N_POOL);
  const heights = shuffle(Array.from({ length: n }, (_, i) => i + 1));
  const fromLeft = randInt(0, 1) === 1;
  const answer = visibleCount(heights, fromLeft);
  return { heights, fromLeft, answer };
}

const MAX_DIGITS = 1;

function skylineSvg(round) {
  const { heights, fromLeft } = round;
  const n = heights.length;
  const BAR_W = 40;
  const GAP = 10;
  const MAXH = 130;
  const PAD = 16;
  const W = PAD * 2 + n * BAR_W + (n - 1) * GAP;
  const H = MAXH + 40;
  const unit = MAXH / n;

  let bars = "";
  heights.forEach((h, i) => {
    const x = PAD + i * (BAR_W + GAP);
    const barH = h * unit;
    const y = MAXH - barH + 20;
    bars += `<rect x="${x}" y="${y}" width="${BAR_W}" height="${barH}" class="rsc-bar" />`;
  });

  const arrow = fromLeft
    ? `<text x="${PAD}" y="14" class="rsc-arrow">👁️ →</text>`
    : `<text x="${W - PAD}" y="14" class="rsc-arrow" text-anchor="end">← 👁️</text>`;

  return `<svg class="rsc-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${arrow}${bars}</svg>`;
}

export function mountRascacielosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let typed = "";
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

  function nextRound() {
    round = generateRascacielosRound();
    typed = "";
    locked = false;

    const dir = round.fromLeft ? "izquierda" : "derecha";
    body.innerHTML = `
      <p class="prompt">Un edificio se ve si es más alto que TODOS los anteriores<small>Mira el skyline desde la ${dir} (el ojo 👁️ marca por dónde miras)</small></p>
      <div class="rsc-wrap" data-wrap>${skylineSvg(round)}</div>
      <p class="prompt">¿Cuántos rascacielos se ven desde la ${dir}?</p>
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
    `;

    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key";
      btn.type = "button";
      btn.textContent = key;
      if (key === "⌫") {
        btn.setAttribute("data-backspace", "");
        btn.addEventListener("click", () => pressBackspace());
      } else if (key === "✓") {
        btn.setAttribute("data-submit", "");
        btn.addEventListener("click", () => submit());
      } else {
        btn.setAttribute("data-digit", key);
        btn.addEventListener("click", () => pressDigit(key));
      }
      pad.appendChild(btn);
    });

    renderDisplay();
  }

  function renderDisplay() {
    body.querySelector("[data-display]").textContent = typed || " ";
  }

  function pressDigit(d) {
    if (finished || locked) return;
    if (typed.length >= MAX_DIGITS) return;
    typed += d;
    renderDisplay();
  }

  function pressBackspace() {
    if (finished || locked) return;
    typed = typed.slice(0, -1);
    renderDisplay();
  }

  function explanation() {
    const { heights, fromLeft, answer } = round;
    const seq = fromLeft ? heights : heights.slice().reverse();
    const visibles = [];
    let max = 0;
    for (const h of seq) {
      if (h > max) {
        visibles.push(h);
        max = h;
      }
    }
    return `El orden visto es ${seq.join(", ")}. Se ve cada edificio que supera al más alto visto hasta entonces: ${visibles.join(" > ")} → ${answer} visibles.`;
  }

  function submit() {
    if (finished || locked || typed === "") return;
    const guess = Number(typed);
    locked = true;
    const feedback = body.querySelector("[data-feedback]");

    if (guess === round.answer) {
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${explanation()}`;
      feedback.className = "feedback ok";
      later(nextRound, 1800);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `No es correcto. ${explanation()}`;
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
    saveScore(client, "rascacielos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🏙️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} skylines resueltos</p>
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
