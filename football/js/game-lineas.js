// "Une con líneas": operaciones a la izquierda, resultados a la derecha.
// Se traza una línea real entre las dos tarjetas (SVG superpuesto) para
// que el emparejamiento quede visible de un vistazo.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const PAIRS = 4;

function buildPairs() {
  const pairs = [];
  const used = new Set();
  let guard = 0;
  while (pairs.length < PAIRS && guard < 300) {
    guard++;
    const sym = pick(["+", "−", "×"]);
    let a, b, r;
    if (sym === "+") {
      a = randInt(3, 30);
      b = randInt(3, 30);
      r = a + b;
    } else if (sym === "−") {
      a = randInt(10, 40);
      b = randInt(2, a - 1);
      r = a - b;
    } else {
      a = randInt(2, 9);
      b = randInt(2, 9);
      r = a * b;
    }
    // Dos operaciones con el mismo resultado harían que una tarjeta de
    // la derecha valiese para dos de la izquierda: ronda ambigua.
    if (used.has(r)) continue;
    used.add(r);
    pairs.push({ text: `${a} ${sym} ${b}`, result: r });
  }
  // Relleno determinista por si el azar no llegase a 4 resultados únicos.
  for (let n = 1; pairs.length < PAIRS; n++) {
    if (used.has(n)) continue;
    used.add(n);
    pairs.push({ text: `${n} + 0`, result: n });
  }
  return shuffle(pairs);
}

function buildRound() {
  const left = buildPairs();
  let right;
  let guard = 0;
  // Se evita que algún resultado caiga en su misma fila: así ninguna
  // pareja se resuelve "en horizontal" sin leer la operación.
  do {
    right = shuffle(left.map((p) => p.result));
    guard++;
  } while (right.some((r, i) => r === left[i].result) && guard < 60);
  return { left, right };
}

export function mountLineasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let selected = null;
  let matched = [];
  let remaining = 0;
  let board = null;
  let svg = null;

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

  const onResize = () => redrawLines();
  window.addEventListener("resize", onResize);

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function redrawLines() {
    if (finished || !svg || !board) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const bb = board.getBoundingClientRect();
    matched.forEach(({ a, b }) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", ra.right - bb.left);
      line.setAttribute("y1", ra.top + ra.height / 2 - bb.top);
      line.setAttribute("x2", rb.left - bb.left);
      line.setAttribute("y2", rb.top + rb.height / 2 - bb.top);
      line.setAttribute("class", "lin-line");
      svg.appendChild(line);
    });
  }

  function nextRound() {
    if (finished) return;
    round = buildRound();
    selected = null;
    matched = [];
    remaining = PAIRS;
    body.innerHTML = `
      <p class="prompt">Une cada operación con su resultado<small>Toca una operación y luego su resultado</small></p>
      <div class="lin-board" data-board>
        <svg class="lin-svg" data-svg></svg>
        <div class="lin-col" data-left></div>
        <div class="lin-col" data-right></div>
      </div>
      <div class="feedback" data-feedback></div>
    `;
    board = body.querySelector("[data-board]");
    svg = body.querySelector("[data-svg]");
    const leftEl = body.querySelector("[data-left]");
    const rightEl = body.querySelector("[data-right]");
    round.left.forEach((p) => {
      const btn = document.createElement("button");
      btn.className = "lin-card lin-left";
      btn.textContent = p.text;
      btn.addEventListener("click", () => pickLeft(p, btn));
      leftEl.appendChild(btn);
    });
    round.right.forEach((r) => {
      const btn = document.createElement("button");
      btn.className = "lin-card lin-right";
      btn.textContent = r;
      btn.addEventListener("click", () => pickRight(r, btn));
      rightEl.appendChild(btn);
    });
  }

  function pickLeft(pair, el) {
    if (finished || el.disabled) return;
    if (selected) selected.el.classList.remove("picked");
    selected = { pair, el };
    el.classList.add("picked");
  }

  function pickRight(value, el) {
    if (finished || el.disabled) return;
    const feedback = body.querySelector("[data-feedback]");
    if (!selected) {
      feedback.textContent = "Elige antes una operación";
      feedback.className = "feedback bad";
      return;
    }
    rounds++;
    if (value === selected.pair.result) {
      selected.el.classList.remove("picked");
      selected.el.classList.add("matched");
      el.classList.add("matched");
      selected.el.disabled = true;
      el.disabled = true;
      matched.push({ a: selected.el, b: el });
      redrawLines();
      selected = null;
      remaining--;
      feedback.textContent = "¡Pareja!";
      feedback.className = "feedback ok";
      if (remaining <= 0) {
        score += 10;
        renderScore();
        setTimeout(nextRound, 700);
      }
    } else {
      lives--;
      renderLives();
      el.classList.add("wrong");
      const bad = el;
      setTimeout(() => bad.classList.remove("wrong"), 350);
      feedback.textContent = "Ese no es el resultado…";
      feedback.className = "feedback bad";
      if (lives <= 0) setTimeout(() => finish(false), 450);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    window.removeEventListener("resize", onResize);
    if (userExited) return onExit();
    saveScore(client, "lineas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔗</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} uniones intentadas</p>
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
    window.addEventListener("resize", onResize);
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    window.removeEventListener("resize", onResize);
  };
}
