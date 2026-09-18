// "Nonograma mini": rejilla 4x4 con pistas de fila/columna (longitudes de
// tramos rellenos, como un nonograma clásico pero en miniatura). El
// jugador alterna celdas llenas/vacías hasta que el patrón coincide
// exactamente con la solución oculta.
//
// En una línea de solo 4 celdas nunca hay más de dos tramos rellenos
// separados por al menos un hueco, así que la pista es simplemente la
// lista de longitudes de esos tramos en orden (p. ej. [2,1]).
//
// La generación exige solución ÚNICA: se prueba una rejilla aleatoria y,
// por fuerza bruta sobre las 2^16 rejillas posibles, se cuenta cuántas
// producen exactamente las mismas pistas de fila+columna. Solo se acepta
// si el conteo es 1.
import { randInt, saveScore } from "./utils.js";

const SIZE = 4;
const CELLS = SIZE * SIZE;

// Rejilla de reserva con solución garantizada única (verificada por
// fuerza bruta exhaustiva sobre las 65536 rejillas posibles en el script
// de verificación: exactamente 1 rejilla produce estas pistas).
// fila-mayor, 1 = llena.
const FALLBACK_GRID = [
  1, 1, 0, 1,
  0, 0, 1, 0,
  1, 0, 0, 1,
  0, 1, 1, 0,
];

// Dado un array de 4 booleanos/0-1, devuelve la lista de longitudes de
// sus tramos rellenos en orden, p. ej. [true,true,false,true] -> [2,1].
export function cluesFromLine(cells) {
  const clues = [];
  let run = 0;
  for (const c of cells) {
    if (c) {
      run++;
    } else if (run > 0) {
      clues.push(run);
      run = 0;
    }
  }
  if (run > 0) clues.push(run);
  return clues;
}

function rowOf(grid, r) {
  return grid.slice(r * SIZE, r * SIZE + SIZE);
}

function colOf(grid, c) {
  const col = [];
  for (let r = 0; r < SIZE; r++) col.push(grid[r * SIZE + c]);
  return col;
}

function cluesOf(grid) {
  const rowClues = [];
  for (let r = 0; r < SIZE; r++) rowClues.push(cluesFromLine(rowOf(grid, r)));
  const colClues = [];
  for (let c = 0; c < SIZE; c++) colClues.push(cluesFromLine(colOf(grid, c)));
  return { rowClues, colClues };
}

function sameClueSet(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false;
    for (let j = 0; j < a[i].length; j++) {
      if (a[i][j] !== b[i][j]) return false;
    }
  }
  return true;
}

// Cuenta por fuerza bruta cuántas de las 2^16 rejillas posibles producen
// exactamente rowClues+colClues. Se corta pronto en cuanto se supera 1
// (solo nos interesa si es "exactamente una").
function countSolutions(rowClues, colClues, cap = 2) {
  let count = 0;
  for (let mask = 0; mask < 1 << CELLS; mask++) {
    const grid = new Array(CELLS);
    for (let i = 0; i < CELLS; i++) grid[i] = (mask >> i) & 1;
    const { rowClues: rc, colClues: cc } = cluesOf(grid);
    if (sameClueSet(rc, rowClues) && sameClueSet(cc, colClues)) {
      count++;
      if (count >= cap) return count;
    }
  }
  return count;
}

function randomGrid() {
  const grid = new Array(CELLS);
  for (let i = 0; i < CELLS; i++) grid[i] = Math.random() < 0.5 ? 1 : 0;
  return grid;
}

function isTrivial(grid) {
  const sum = grid.reduce((a, b) => a + b, 0);
  return sum === 0 || sum === CELLS;
}

export function generateNonogramaRound() {
  let guard = 0;
  let grid = null;
  do {
    guard++;
    const candidate = randomGrid();
    if (isTrivial(candidate)) continue;
    const { rowClues, colClues } = cluesOf(candidate);
    if (countSolutions(rowClues, colClues, 2) === 1) {
      grid = candidate;
      break;
    }
  } while (guard < 200);

  if (!grid) grid = FALLBACK_GRID.slice();

  const { rowClues, colClues } = cluesOf(grid);
  return {
    solution: grid.map((v) => !!v),
    rowClues,
    colClues,
  };
}

function clueText(clue) {
  return clue.length ? clue.join(" ") : "—";
}

export function mountNonogramaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let current = null; // array de 16 booleanos, estado actual del jugador
  let checking = false;
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
    checking = false;
    round = generateNonogramaRound();
    current = new Array(CELLS).fill(false);

    body.innerHTML = `
      <p class="prompt">Rellena la rejilla según las pistas<small>Toca las celdas para marcarlas/desmarcarlas</small></p>
      <div class="non-board">
        <div class="non-corner"></div>
        <div class="non-col-clues" data-col-clues></div>
        <div class="non-row-clues" data-row-clues></div>
        <div class="non-grid" data-grid></div>
      </div>
      <button class="primary" data-check>Comprobar</button>
      <div class="feedback" data-feedback></div>
    `;

    const colCluesEl = body.querySelector("[data-col-clues]");
    round.colClues.forEach((clue) => {
      const div = document.createElement("div");
      div.className = "non-clue-col";
      div.textContent = clueText(clue);
      colCluesEl.appendChild(div);
    });

    const rowCluesEl = body.querySelector("[data-row-clues]");
    round.rowClues.forEach((clue) => {
      const div = document.createElement("div");
      div.className = "non-clue-row";
      div.textContent = clueText(clue);
      rowCluesEl.appendChild(div);
    });

    const gridEl = body.querySelector("[data-grid]");
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "non-cell";
        btn.setAttribute("data-cell", `${r}-${c}`);
        btn.addEventListener("click", () => toggleCell(r, c, btn));
        gridEl.appendChild(btn);
      }
    }

    body.querySelector("[data-check]").addEventListener("click", checkAnswer);
  }

  function toggleCell(r, c, btn) {
    if (finished || checking) return;
    const idx = r * SIZE + c;
    current[idx] = !current[idx];
    btn.classList.toggle("non-cell-filled", current[idx]);
    btn.classList.remove("non-cell-wrong");
  }

  function checkAnswer() {
    if (finished || checking) return;
    const feedback = body.querySelector("[data-feedback]");
    const gridEl = body.querySelector("[data-grid]");
    let allMatch = true;
    const cellButtons = [...gridEl.children];
    cellButtons.forEach((btn, idx) => {
      const wrong = current[idx] !== round.solution[idx];
      btn.classList.toggle("non-cell-wrong", wrong);
      if (wrong) allMatch = false;
    });

    if (allMatch) {
      checking = true;
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = "¡Nonograma resuelto!";
      feedback.className = "feedback ok";
      cellButtons.forEach((btn) => (btn.disabled = true));
      body.querySelector("[data-check]").disabled = true;
      later(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = "Casi. Corrige las celdas marcadas en rojo y vuelve a comprobar.";
      feedback.className = "feedback bad";
      if (lives <= 0) {
        checking = true;
        cellButtons.forEach((btn) => (btn.disabled = true));
        body.querySelector("[data-check]").disabled = true;
        later(() => finish(false), 1400);
      }
      // si quedan vidas, se deja la ronda activa para que siga corrigiendo
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "nonograma", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>▢</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} nonogramas resueltos</p>
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
