// "Cuadrícula de caminos": recuento de caminos monótonos (solo derecha o
// solo abajo) en una rejilla, construido con la regla de Pascal: el número
// de caminos hasta una celda = caminos hasta la celda de la izquierda +
// caminos hasta la celda de arriba. Cada ronda muestra YA RELLENOS esos dos
// vecinos y solo pide la celda objetivo, así que el gesto real es aplicar
// la regla aditiva, no memorizar la fórmula combinatoria C(n,k). La fila 0
// y la columna 0 siempre valen 1 (un único camino posible bordeando la
// rejilla) y nunca son la celda objetivo, porque ahí no hay ninguna suma
// que hacer.
import { randInt, saveScore } from "./utils.js";

const GRID = 5; // puntos 0..4 en cada eje

function pathsTo(row, col) {
  const dp = Array.from({ length: row + 1 }, () => Array(col + 1).fill(0));
  dp[0][0] = 1;
  for (let r = 0; r <= row; r++) {
    for (let c = 0; c <= col; c++) {
      if (r === 0 && c === 0) continue;
      const fromLeft = c > 0 ? dp[r][c - 1] : 0;
      const fromTop = r > 0 ? dp[r - 1][c] : 0;
      dp[r][c] = fromLeft + fromTop;
    }
  }
  return dp[row][col];
}

export function generateCaminosRound() {
  const row = randInt(1, GRID - 1);
  const col = randInt(1, GRID - 1);
  const left = pathsTo(row, col - 1);
  const top = pathsTo(row - 1, col);
  return { row, col, left, top, answer: left + top };
}

function gridSvg(round) {
  const { row, col, left, top } = round;
  const CELL = 42;
  const PAD = 24;
  const W = PAD * 2 + (GRID - 1) * CELL;
  const H = PAD * 2 + (GRID - 1) * CELL;

  function pt(r, c) {
    return { x: PAD + c * CELL, y: PAD + r * CELL };
  }

  let lines = "";
  for (let r = 0; r < GRID; r++) {
    const a = pt(r, 0);
    const b = pt(r, GRID - 1);
    lines += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="cmg-gridline" />`;
  }
  for (let c = 0; c < GRID; c++) {
    const a = pt(0, c);
    const b = pt(GRID - 1, c);
    lines += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" class="cmg-gridline" />`;
  }

  const known = [];
  // Los bordes (fila 0 / columna 0) siempre valen 1.
  for (let c = 0; c < GRID; c++) known.push({ r: 0, c, v: 1 });
  for (let r = 1; r < GRID; r++) known.push({ r, c: 0, v: 1 });
  known.push({ r: row, c: col - 1, v: left });
  known.push({ r: row - 1, c: col, v: top });

  let dots = "";
  for (const { r, c, v } of known) {
    const { x, y } = pt(r, c);
    dots += `<circle cx="${x}" cy="${y}" r="15" class="cmg-cell cmg-cell-known" /><text x="${x}" y="${y + 5}" class="cmg-num">${v}</text>`;
  }
  const target = pt(row, col);
  dots += `<circle cx="${target.x}" cy="${target.y}" r="15" class="cmg-cell cmg-cell-target" /><text x="${target.x}" y="${target.y + 5}" class="cmg-num">?</text>`;
  const start = pt(0, 0);
  dots += `<circle cx="${start.x}" cy="${start.y}" r="6" class="cmg-start" />`;

  return `<svg class="cmg-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${lines}${dots}</svg>`;
}

const MAX_DIGITS = 2;

export function mountCaminosGame(container, { client, onExit }) {
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
    round = generateCaminosRound();
    typed = "";
    locked = false;

    body.innerHTML = `
      <p class="prompt">Cada número es la cantidad de caminos distintos desde el punto de partida (●) moviéndote solo hacia la derecha o hacia abajo<small>El valor de una celda es siempre la suma de su vecina de la izquierda más su vecina de arriba</small></p>
      <div class="cmg-wrap" data-wrap>${gridSvg(round)}</div>
      <p class="prompt">¿Cuántos caminos hay hasta la celda marcada con <b>?</b></p>
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
    const { left, top, answer } = round;
    return `La celda de la izquierda vale ${left} y la de arriba vale ${top}, así que ${left} + ${top} = ${answer}.`;
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
    saveScore(client, "caminos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧩</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} celdas resueltas</p>
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
