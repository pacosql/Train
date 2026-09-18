// "Fusiona como en 2048": una fila de 4 casillas con algunas fichas de
// valor potencia de 2 y huecos. Al deslizar hacia la izquierda los
// huecos desaparecen (las fichas se juntan) y, si dos fichas iguales
// quedan entonces adyacentes, se fusionan UNA vez sumando su valor (se
// duplica). El reto real no es la suma en sí, sino darse cuenta de que
// dos fichas separadas por un hueco SÍ acaban juntas al deslizar.
//
// Generación con solución garantizada: se elige un valor V que se
// fusionará consigo mismo (resultado 2V) y, opcionalmente, una tercera
// ficha "extra" cuyo valor se exige SIEMPRE menor que 2V y distinto de V
// — así la ficha fusionada es siempre, sin ambigüedad, la más grande que
// queda, y la pregunta obliga a simular de verdad la fusión (no basta con
// mirar qué ficha ya es la más grande antes de deslizar).
import { randInt, pick, saveScore } from "./utils.js";

const SIZE = 4;
const MAX_DIGITS = 2; // el valor más alto posible es 16

const V_POOL = [2, 4, 8];
const EXTRA_POOL = [2, 4, 8, 16];

export function generateFusionaRound() {
  const v = pick(V_POOL);
  const merged = v * 2;
  const extraPool = EXTRA_POOL.filter((x) => x < merged && x !== v);
  const hasExtra = extraPool.length > 0 && randInt(0, 1) === 1;
  const extra = hasExtra ? pick(extraPool) : null;

  // Plantillas de 4 casillas (0 = hueco) que siempre dejan al menos un
  // hueco ENTRE las dos V, para que el deslizamiento sea de verdad
  // necesario (si ya estuvieran juntas, no habría nada que "cerrar").
  let cells;
  if (!hasExtra) {
    const templates = [
      [v, 0, v, 0],
      [v, 0, 0, v],
      [0, v, 0, v],
    ];
    cells = pick(templates);
  } else {
    const templates = [
      [extra, v, 0, v],
      [v, 0, v, extra],
    ];
    cells = pick(templates);
  }

  return { cells, v, merged, extra };
}

function slideAndMerge(cells) {
  const compact = cells.filter((x) => x !== 0);
  const result = [];
  let i = 0;
  while (i < compact.length) {
    if (i + 1 < compact.length && compact[i] === compact[i + 1]) {
      result.push(compact[i] * 2);
      i += 2;
    } else {
      result.push(compact[i]);
      i += 1;
    }
  }
  return result;
}

export function mountFusionaGame(container, { client, onExit }) {
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

  function rowHtml(cells) {
    return cells
      .map((v) => `<div class="fsn-cell${v ? " fsn-cell-filled" : ""}">${v || ""}</div>`)
      .join("");
  }

  function nextRound() {
    round = generateFusionaRound();
    typed = "";
    locked = false;

    body.innerHTML = `
      <p class="prompt">Vas a deslizar esta fila hacia la izquierda<small>Los huecos se cierran; si dos fichas iguales quedan entonces juntas, se fusionan sumando su valor</small></p>
      <div class="fsn-row" data-row>${rowHtml(round.cells)}</div>
      <p class="prompt">¿Cuál es el valor más grande que queda en la fila después de deslizar y fusionar?</p>
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
    const finalRow = slideAndMerge(round.cells);
    const maxVal = Math.max(...finalRow);
    return (
      `Al deslizar, los huecos desaparecen y queda: ${finalRow.join(" · ")}. ` +
      `Las dos fichas de ${round.v} quedaban juntas tras cerrar el hueco, así que se fusionan en ${round.merged}. ` +
      `El valor más grande que queda es ${maxVal}.`
    );
  }

  function submit() {
    if (finished || locked || typed === "") return;
    const guess = Number(typed);
    locked = true;
    const feedback = body.querySelector("[data-feedback]");
    const finalRow = slideAndMerge(round.cells);
    const answer = Math.max(...finalRow);

    if (guess === answer) {
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
    saveScore(client, "fusiona", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎮</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} fusiones resueltas</p>
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
