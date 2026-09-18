// "Raciones de jarabe": división de fracciones como MEDIDA REPETIDA —
// cuántas raciones de tamaño 1/d (una fracción unitaria) caben en W
// litros enteros. Se representa con una recta numérica de marcas
// iguales (nunca una barra de dos tramos como "tiras", que reparte un
// total en una razón a:b — aquí el concepto es distinto: contar cuántas
// veces cabe una fracción unitaria en un entero).
// La ronda rota entre las dos direcciones de la misma división exacta
// W ÷ (1/d) = W·d: dado W, hallar cuántas raciones salen (N = W·d), o
// dadas las raciones ya servidas, hallar cuántos litros enteros son
// (W = N/d) — ambas derivadas del mismo par (W, d) para que la
// respuesta sea siempre un entero exacto, sin resto.
import { randInt, pick, saveScore } from "./utils.js";

const D_POOL = [2, 3, 4, 5, 6, 8, 10];
const W_POOL = [2, 3, 4, 5, 6, 7, 8, 9];

export function generateRacionesRound() {
  const d = pick(D_POOL);
  const w = pick(W_POOL);
  const n = w * d;
  const direction = pick(["forward", "reverse"]);
  const answer = direction === "forward" ? n : w;
  return { d, w, n, direction, answer };
}

const MAX_DIGITS = 2;

function numberLineSvg(round) {
  const { d, w, n, direction } = round;
  const PAD = 20;
  const UNIT = 34;
  const W = PAD * 2 + w * UNIT;
  const H = 90;
  const y = 50;

  // En "forward" se ven los litros enteros marcados (0, 1, 2…) para poder
  // multiplicar por d; en "reverse" NUNCA se marcan los enteros ni se
  // distinguen a simple vista (todas las marcas miden igual), porque el
  // límite entero final delataría la respuesta sin dividir — hay que
  // contar las n marcas de verdad y dividir entre d de cabeza.
  const showWholeMarks = direction === "forward";
  let ticks = "";
  for (let i = 0; i <= n; i++) {
    const x = PAD + (i / d) * UNIT;
    const isWhole = showWholeMarks && i % d === 0;
    ticks += `<line x1="${x}" y1="${isWhole ? y - 14 : y - 7}" x2="${x}" y2="${isWhole ? y + 14 : y + 7}" class="${isWhole ? "rac-tick-whole" : "rac-tick"}" />`;
    if (isWhole) {
      ticks += `<text x="${x}" y="${y + 30}" class="rac-num">${i / d}</text>`;
    }
  }
  ticks += `<line x1="${PAD}" y1="${y}" x2="${PAD + w * UNIT}" y2="${y}" class="rac-axis" />`;

  if (direction === "reverse") {
    // Se resalta el tramo ya "servido" (las n raciones), pero se oculta
    // la etiqueta del final entero: hay que deducirla.
    const endX = PAD + (n / d) * UNIT;
    ticks += `<rect x="${PAD}" y="${y - 6}" width="${endX - PAD}" height="12" class="rac-served" />`;
  }

  return `<svg class="rac-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${ticks}</svg>`;
}

export function mountRacionesGame(container, { client, onExit }) {
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

  function questionText(round) {
    if (round.direction === "forward") {
      return `Un bote tiene <b>${round.w}</b> litros de jarabe. Cada ración es <b>1/${round.d}</b> de litro. ¿Cuántas raciones completas salen?`;
    }
    return `Cada ración es <b>1/${round.d}</b> de litro. Ya se han servido <b>${round.n}</b> raciones (marcadas en la recta). ¿Cuántos litros enteros son?`;
  }

  function nextRound() {
    round = generateRacionesRound();
    typed = "";
    locked = false;

    const hint = round.direction === "forward"
      ? `Cada raya larga es 1 litro entero, dividido en trozos iguales de 1/${round.d}`
      : `Todas las rayas son del mismo tamaño (1/${round.d} de litro cada una): cuéntalas y divide entre ${round.d}`;
    body.innerHTML = `
      <p class="prompt">${questionText(round)}<small>${hint}</small></p>
      <div class="rac-wrap" data-wrap>${numberLineSvg(round)}</div>
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
    if (typed === "0") typed = d;
    else typed += d;
    renderDisplay();
  }

  function pressBackspace() {
    if (finished || locked) return;
    typed = typed.slice(0, -1);
    renderDisplay();
  }

  function explanation() {
    const { w, d, n, direction, answer } = round;
    if (direction === "forward") {
      return `Cada litro entero se parte en ${d} raciones, así que ${w} litros dan ${w} × ${d} = ${answer} raciones.`;
    }
    return `${n} raciones de 1/${d} son ${n} ÷ ${d} = ${answer} litros enteros.`;
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
    saveScore(client, "raciones", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>💊</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} raciones resueltas</p>
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
