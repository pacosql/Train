// "Dobla la tela": encontrar el eje de simetría real de un estampado.
// Se genera una tela cuadriculada cuyo estampado es simétrico respecto a
// UN eje concreto (una línea entre dos columnas o entre dos filas). El
// jugador prueba distintas líneas de doblez candidatas hasta encontrar la
// que hace que el estampado case consigo mismo; al acertar, la tela se
// "cierra" con una pequeña animación y al fallar se señala una celda
// concreta que no encaja con su reflejo.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const N = 6; // rejilla par: todo eje cae entre dos celdas, nunca sobre una
const COLORS = [1, 2, 3, 4];
const COLOR_NAMES = { 0: "lisa (sin estampado)", 1: "rojo", 2: "azul", 3: "dorado", 4: "verde" };
const PAINT_CHANCE = 0.42; // probabilidad de que una celda "origen" lleve estampado

// ---------- Lógica pura (testeada aparte con Node, ver informe) ----------

function allAxes(n) {
  const axes = [];
  for (let k = 0; k < n - 1; k++) axes.push({ type: "v", k });
  for (let k = 0; k < n - 1; k++) axes.push({ type: "h", k });
  return axes;
}

function sameAxis(a, b) {
  return a.type === b.type && a.k === b.k;
}

// Coordenada reflejada de (r,c) respecto a `axis`. Si el reflejo cae fuera
// de la rejilla, esa celda no tiene pareja (el doblez no llega a cubrirla).
function mirror(r, c, axis, n) {
  if (axis.type === "v") {
    const c2 = 2 * axis.k + 1 - c;
    return c2 >= 0 && c2 < n ? { r2: r, c2 } : null;
  }
  const r2 = 2 * axis.k + 1 - r;
  return r2 >= 0 && r2 < n ? { r2, c2: c } : null;
}

// Genera un patrón simétrico de verdad respecto a `axis`: cada celda con
// pareja dentro de la rejilla se pinta una vez y se copia a su reflejo;
// las celdas sin pareja (fuera del alcance de ese doblez) se pintan libres.
function buildPattern(axis, n) {
  const grid = Array.from({ length: n }, () => Array(n).fill(0));
  const visited = Array.from({ length: n }, () => Array(n).fill(false));
  const randomCell = () => (Math.random() < PAINT_CHANCE ? pick(COLORS) : 0);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (visited[r][c]) continue;
      const value = randomCell();
      grid[r][c] = value;
      visited[r][c] = true;
      const m = mirror(r, c, axis, n);
      if (m) {
        grid[m.r2][m.c2] = value;
        visited[m.r2][m.c2] = true;
      }
    }
  }
  return grid;
}

// Primera celda (si existe) que no coincide con su reflejo respecto a `axis`.
function findMismatch(pattern, axis, n) {
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const m = mirror(r, c, axis, n);
      if (!m) continue;
      if (pattern[r][c] !== pattern[m.r2][m.c2]) {
        return { r, c, r2: m.r2, c2: m.c2 };
      }
    }
  }
  return null;
}

// ¿Es `axis` un eje de simetría real para este patrón? (exportada para
// poder simularla desde Node sin montar el juego completo).
export function esEjeValido(pattern, axis, n = N) {
  return findMismatch(pattern, axis, n) === null;
}

function pickCandidates(real, all, count) {
  const others = shuffle(all.filter((a) => !sameAxis(a, real)));
  return shuffle([real, ...others.slice(0, count - 1)]);
}

// Genera una ronda completa: patrón + eje real + opciones candidatas,
// garantizando que SOLO una de las opciones ofrecidas es válida (si el
// patrón resulta simétrico por accidente respecto a otra candidata
// también, se regenera entero).
export function generateRound(n = N) {
  const all = allAxes(n);
  let axisReal;
  let pattern;
  let candidates;
  let validCount;
  do {
    axisReal = pick(all);
    pattern = buildPattern(axisReal, n);
    const count = randInt(3, 4);
    candidates = pickCandidates(axisReal, all, count);
    validCount = candidates.filter((a) => esEjeValido(pattern, a, n)).length;
  } while (validCount !== 1);
  return { pattern, axisReal, candidates };
}

function describeMismatch(pattern, mismatch) {
  if (!mismatch) return "Por ahí no: ese doblez no hace que el estampado case.";
  const a = COLOR_NAMES[pattern[mismatch.r][mismatch.c]];
  const b = COLOR_NAMES[pattern[mismatch.r2][mismatch.c2]];
  return (
    `Por ahí no: al doblar, la celda (fila ${mismatch.r + 1}, col ${mismatch.c + 1}) — ${a} — ` +
    `caería sobre (fila ${mismatch.r2 + 1}, col ${mismatch.c2 + 1}) — ${b} — y no coinciden.`
  );
}

// ---------- Montaje del juego ----------

export function mountTelaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let pattern = null;
  let axisReal = null;
  let candidates = [];
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
    const round = generateRound(N);
    pattern = round.pattern;
    axisReal = round.axisReal;
    candidates = round.candidates;
    locked = false;
    renderRound();
  }

  function renderRound() {
    body.innerHTML = `
      <p class="prompt">Dobla la tela por el eje correcto<small>El estampado debe casar consigo mismo</small></p>
      <div class="tl-wrap" data-tela>
        <div class="tl-grid" data-grid style="--tl-n:${N}"></div>
        <div class="tl-axes" data-axes></div>
      </div>
      <div class="feedback" data-feedback></div>
    `;

    const gridEl = body.querySelector("[data-grid]");
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cell = document.createElement("div");
        const v = pattern[r][c];
        cell.className = `tl-cell${v ? ` tl-c${v}` : ""}`;
        cell.dataset.tlCell = `${r}-${c}`;
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);
        gridEl.appendChild(cell);
      }
    }

    const axesEl = body.querySelector("[data-axes]");
    candidates.forEach((axis, i) => {
      const pct = ((axis.k + 1) / N) * 100;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `tl-axis-btn tl-axis-${axis.type}`;
      btn.style[axis.type === "v" ? "left" : "top"] = `${pct}%`;
      btn.dataset.axisType = axis.type;
      btn.dataset.axisK = String(axis.k);
      btn.dataset.axisIndex = String(i);
      btn.setAttribute(
        "aria-label",
        axis.type === "v"
          ? `Doblez vertical entre columna ${axis.k + 1} y ${axis.k + 2}`
          : `Doblez horizontal entre fila ${axis.k + 1} y ${axis.k + 2}`
      );
      btn.innerHTML = '<span class="tl-axis-line"></span>';
      btn.addEventListener("click", () => chooseAxis(axis, btn));
      axesEl.appendChild(btn);
    });
  }

  function animateFold(axis) {
    const gridEl = body.querySelector("[data-grid]");
    if (!gridEl) return;
    const pct = ((axis.k + 1) / N) * 100;
    gridEl.style.transformOrigin = axis.type === "v" ? `${pct}% 50%` : `50% ${pct}%`;
    gridEl.classList.add(axis.type === "v" ? "tl-fold-v" : "tl-fold-h");
  }

  function chooseAxis(axis, btnEl) {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const axesEl = body.querySelector("[data-axes]");
    axesEl.querySelectorAll(".tl-axis-btn").forEach((b) => { b.disabled = true; });

    if (esEjeValido(pattern, axis, N)) {
      score += 10;
      renderScore();
      btnEl.classList.add("tl-axis-correct");
      animateFold(axis);
      feedback.textContent = "¡Doblez perfecto! El estampado casa consigo mismo.";
      feedback.className = "feedback ok";
      later(nextRound, 1100);
    } else {
      lives--;
      renderLives();
      btnEl.classList.add("tl-axis-wrong");
      const mismatch = findMismatch(pattern, axis, N);
      feedback.textContent = describeMismatch(pattern, mismatch);
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1600);
      later(nextRound, 1600);
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
    saveScore(client, "tela", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧣</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} dobleces intentados</p>
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
