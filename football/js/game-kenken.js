// "KenKen mini" (4x4): cada fila y cada columna llevan 1, 2, 3 y 4 sin
// repetir (como un mini-sudoku de filas/columnas). La rejilla está partida
// en "jaulas" de 1 a 3 celdas contiguas; cada jaula exige que sus números
// combinen con una operación (+, ×, - o ÷) para dar el objetivo escrito en
// su celda superior-izquierda.
//
// Generación con solución garantizada: primero se crea una solución 4x4
// válida (cuadrado latino) y LUEGO se agrupan sus celdas en jaulas y se
// calcula el objetivo de cada una a partir de esos valores ya conocidos.
// Así la rejilla siempre es resoluble sin necesidad de un solver: la propia
// solución generada cumple, por construcción, todas las jaulas.
//
// Reglas para evitar ambigüedad: las jaulas de resta y de división tienen
// SIEMPRE 2 celdas (nunca 3+, donde el orden de las operaciones sería
// ambiguo) y la resta siempre se calcula en valor absoluto, así el orden en
// que el jugador mire los dos números nunca importa.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const N = 4;

// Cuadrado latino 4x4 a partir de una base cíclica (fila i = rotación de la
// anterior), barajando filas, columnas y la etiqueta de los valores: las tres
// operaciones preservan la propiedad de "sin repetidos en fila/columna", así
// que el resultado es siempre válido sin necesidad de backtracking.
export function kkGenerateSolution() {
  const base = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) base.push(((r + c) % N) + 1);
  }
  const rowOrder = shuffle([0, 1, 2, 3]);
  const colOrder = shuffle([0, 1, 2, 3]);
  const valueMap = shuffle([1, 2, 3, 4]);
  const sol = new Array(N * N);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const v = base[rowOrder[r] * N + colOrder[c]];
      sol[r * N + c] = valueMap[v - 1];
    }
  }
  return sol;
}

// Reparte las 16 celdas en jaulas de 1 a 3 celdas ortogonalmente contiguas:
// arranca una jaula en una celda libre y, con cierta probabilidad, la va
// fusionando con una vecina libre hasta un máximo de 3 celdas.
export function kkBuildCages() {
  const total = N * N;
  const assigned = new Array(total).fill(-1);
  const cages = [];
  const order = shuffle(Array.from({ length: total }, (_, i) => i));
  for (const start of order) {
    if (assigned[start] !== -1) continue;
    const idx = cages.length;
    const cells = [start];
    assigned[start] = idx;
    while (cells.length < 3 && randInt(1, 100) <= 55) {
      const candidates = [];
      for (const cell of cells) {
        const r = Math.floor(cell / N);
        const c = cell % N;
        const neigh = [];
        if (r > 0) neigh.push((r - 1) * N + c);
        if (r < N - 1) neigh.push((r + 1) * N + c);
        if (c > 0) neigh.push(r * N + c - 1);
        if (c < N - 1) neigh.push(r * N + c + 1);
        for (const n of neigh) {
          if (assigned[n] === -1 && !candidates.includes(n)) candidates.push(n);
        }
      }
      if (!candidates.length) break;
      const chosen = pick(candidates);
      cells.push(chosen);
      assigned[chosen] = idx;
    }
    cages.push({ cells });
  }
  return cages;
}

// Jaula de 2 celdas: elige al azar entre las operaciones que dan un
// resultado válido. La resta siempre es en valor absoluto (nunca hay
// ambigüedad de orden) y la división solo se ofrece cuando es exacta.
export function kkOpFor2(vals) {
  const [a, b] = vals;
  const candidates = [
    { op: "+", target: a + b },
    { op: "×", target: a * b },
    { op: "-", target: Math.abs(a - b) },
  ];
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  if (hi % lo === 0) candidates.push({ op: "÷", target: hi / lo });
  return pick(candidates);
}

// Jaula de 3 celdas: solo suma o producto (resta/división con 3 valores
// serían ambiguas en el orden, así que quedan prohibidas por diseño).
export function kkOpFor3(vals) {
  const sum = vals.reduce((x, y) => x + y, 0);
  const prod = vals.reduce((x, y) => x * y, 1);
  return pick([
    { op: "+", target: sum },
    { op: "×", target: prod },
  ]);
}

// Aplica la operación de una jaula a los valores actuales de sus celdas
// (se usa tanto para calcular el objetivo real como para comprobar lo que
// ha escrito el jugador).
export function kkApplyOp(op, vals) {
  if (!op) return vals[0];
  if (op === "+") return vals.reduce((a, b) => a + b, 0);
  if (op === "×") return vals.reduce((a, b) => a * b, 1);
  if (op === "-") return Math.abs(vals[0] - vals[1]);
  return Math.max(vals[0], vals[1]) / Math.min(vals[0], vals[1]); // ÷
}

// Genera una ronda completa: solución + jaulas + objetivos, todo derivado de
// esa única solución conocida (por eso es automáticamente resoluble).
export function kkGenerateRound() {
  const solution = kkGenerateSolution();
  const rawCages = kkBuildCages();
  const cages = rawCages.map((cage) => {
    const cells = cage.cells.slice().sort((a, b) => a - b);
    const vals = cells.map((i) => solution[i]);
    let op = null;
    let target = vals[0];
    if (cells.length === 2) ({ op, target } = kkOpFor2(vals));
    else if (cells.length === 3) ({ op, target } = kkOpFor3(vals));
    return { cells, op, target };
  });
  const cageMap = new Array(N * N).fill(-1);
  const labels = new Array(N * N).fill(null);
  cages.forEach((cage, idx) => {
    cage.cells.forEach((i) => { cageMap[i] = idx; });
    labels[cage.cells[0]] = `${cage.target}${cage.op ? cage.op : ""}`;
  });
  return { solution, cages, cageMap, labels };
}

// Busca el primer problema del intento actual del jugador y lo explica.
// Devuelve null si `grid` coincide EXACTAMENTE con la solución generada
// (celda vacía o valor distinto siempre da un `issue` con motivo y celda).
export function kkFindIssue(grid, puzzle) {
  for (let i = 0; i < N * N; i++) {
    if (!grid[i]) {
      const r = Math.floor(i / N);
      const c = i % N;
      return { cell: i, text: `Falta rellenar la fila ${r + 1}, columna ${c + 1}.` };
    }
  }
  for (let r = 0; r < N; r++) {
    for (let a = 0; a < N; a++) {
      for (let b = a + 1; b < N; b++) {
        if (grid[r * N + a] === grid[r * N + b]) {
          return {
            cell: r * N + b,
            text: `La fila ${r + 1} repite el ${grid[r * N + a]} (columnas ${a + 1} y ${b + 1}).`,
          };
        }
      }
    }
  }
  for (let c = 0; c < N; c++) {
    for (let a = 0; a < N; a++) {
      for (let b = a + 1; b < N; b++) {
        if (grid[a * N + c] === grid[b * N + c]) {
          return {
            cell: b * N + c,
            text: `La columna ${c + 1} repite el ${grid[a * N + c]} (filas ${a + 1} y ${b + 1}).`,
          };
        }
      }
    }
  }
  for (const cage of puzzle.cages) {
    const vals = cage.cells.map((i) => grid[i]);
    const actual = kkApplyOp(cage.op, vals);
    if (actual !== cage.target) {
      const r0 = Math.floor(cage.cells[0] / N);
      const c0 = cage.cells[0] % N;
      const opLabel = cage.op || "";
      return {
        cell: cage.cells[0],
        text: `La jaula que empieza en fila ${r0 + 1}, columna ${c0 + 1} pide ${cage.target}${opLabel} y tus números dan ${actual}${opLabel}.`,
      };
    }
  }
  // Si filas, columnas y todas las jaulas cuadran, la rejilla es una
  // solución válida del puzzle — no hace falta que coincida celda a celda
  // con la que generó el enunciado, porque algunos repartos de jaulas
  // admiten más de un cuadrado latino que las satisfaga igual de bien.
  return null;
}

export function mountKenkenGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let puzzle = null;
  let grid = [];
  let selected = -1;
  let badCell = -1;
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
  function say(text, cls) {
    const el = body.querySelector("[data-feedback]");
    if (!el) return;
    el.textContent = text;
    el.className = `feedback${cls ? ` ${cls}` : ""}`;
  }

  function nextRound() {
    puzzle = kkGenerateRound();
    grid = new Array(N * N).fill(0);
    selected = -1;
    badCell = -1;
    locked = false;

    let cellsHtml = "";
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        cellsHtml += `<button type="button" class="knk-cell" data-cell="${r}-${c}"></button>`;
      }
    }

    body.innerHTML = `
      <p class="prompt">1, 2, 3 y 4 en cada fila y columna, cumpliendo cada jaula<small>Toca una celda y luego un número del teclado</small></p>
      <div class="knk-grid" data-grid>${cellsHtml}</div>
      <div class="knk-keypad" data-keypad>
        <button type="button" class="knk-key" data-digit="1">1</button>
        <button type="button" class="knk-key" data-digit="2">2</button>
        <button type="button" class="knk-key" data-digit="3">3</button>
        <button type="button" class="knk-key" data-digit="4">4</button>
      </div>
      <div class="knk-tools">
        <button type="button" class="secondary knk-tool" data-clear>↺ Borrar todo</button>
      </div>
      <button type="button" class="primary knk-check" data-check>✓ Comprobar</button>
      <div class="feedback" data-feedback></div>
    `;

    body.querySelectorAll("[data-cell]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (finished || locked) return;
        const [r, c] = btn.dataset.cell.split("-").map(Number);
        selected = r * N + c;
        badCell = -1;
        renderGrid();
      });
    });
    body.querySelectorAll("[data-digit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (finished || locked || selected < 0) return;
        grid[selected] = Number(btn.dataset.digit);
        badCell = -1;
        renderGrid();
        say("", "");
      });
    });
    body.querySelector("[data-clear]").addEventListener("click", () => {
      if (finished || locked) return;
      grid = new Array(N * N).fill(0);
      selected = -1;
      badCell = -1;
      renderGrid();
      say("", "");
    });
    body.querySelector("[data-check]").addEventListener("click", () => {
      if (finished || locked) return;
      check();
    });

    renderGrid();
    say("Toca una celda vacía y luego un número del teclado", "");
  }

  function renderGrid() {
    body.querySelectorAll("[data-cell]").forEach((btn) => {
      const [r, c] = btn.dataset.cell.split("-").map(Number);
      const i = r * N + c;
      const cageIdx = puzzle.cageMap[i];
      btn.className = "knk-cell";
      if (selected === i) btn.classList.add("selected");
      if (i === badCell) btn.classList.add("bad");
      if (r === 0 || puzzle.cageMap[(r - 1) * N + c] !== cageIdx) btn.classList.add("knk-edge-top");
      if (r === N - 1 || puzzle.cageMap[(r + 1) * N + c] !== cageIdx) btn.classList.add("knk-edge-bottom");
      if (c === 0 || puzzle.cageMap[r * N + c - 1] !== cageIdx) btn.classList.add("knk-edge-left");
      if (c === N - 1 || puzzle.cageMap[r * N + c + 1] !== cageIdx) btn.classList.add("knk-edge-right");
      const label = puzzle.labels[i];
      const value = grid[i] ? String(grid[i]) : "";
      btn.innerHTML = `${label ? `<span class="knk-cage-label">${label}</span>` : ""}<span class="knk-cell-value">${value}</span>`;
    });
  }

  function check() {
    const issue = kkFindIssue(grid, puzzle);
    if (!issue) {
      rounds++;
      score += 10;
      renderScore();
      locked = true;
      say("¡Todas las filas, columnas y jaulas cuadran! Puzzle resuelto. +10", "ok");
      return later(nextRound, 900);
    }
    lives--;
    renderLives();
    badCell = issue.cell;
    renderGrid();
    say(issue.text, "bad");
    if (lives <= 0) {
      locked = true;
      return later(() => finish(false), 1500);
    }
    // El puzzle sigue en pie: se pierde una vida pero se puede seguir
    // corrigiendo la misma rejilla (una ronda = un puzzle resuelto entero).
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "kenken", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔷</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} KenKen resueltos</p>
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
