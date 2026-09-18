// "Sudoku asesino mini" (4x4): un sudoku de verdad en miniatura — cada
// fila, cada columna Y cada una de las 4 cajas de 2x2 llevan 1, 2, 3 y 4
// sin repetir — pero SIN pistas de partida. En su lugar, las 16 celdas
// están repartidas en "jaulas" contiguas (2 a 4 celdas) que solo dan la
// SUMA de sus celdas (nunca un operador, y nunca repiten dígito dentro de
// la misma jaula, como en el Killer Sudoku real). Todo se deduce
// combinando esas sumas con las reglas de sudoku.
//
// Generación con solución garantizada y ÚNICA: primero se enumeran TODAS
// las rejillas 4x4 válidas de sudoku (son exactamente 288, calculadas una
// sola vez al cargar el módulo). Para una ronda se elige una de esas 288
// al azar, se reparten sus celdas en jaulas y se calculan las sumas reales
// a partir de esa solución. Como puede haber más de una rejilla de las 288
// que cumpla esas mismas sumas (jaulas ambiguas), cada partición en jaulas
// se verifica a fuerza bruta contra las 288 antes de aceptarla: solo se
// sirve al jugador una ronda cuya única rejilla compatible con las sumas
// dadas sea exactamente la solución generada.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const N = 4;
const TOTAL = N * N;

function boxOf(r, c) {
  return Math.floor(r / 2) * 2 + Math.floor(c / 2);
}

// Enumera por backtracking TODAS las rejillas 4x4 válidas de sudoku (filas,
// columnas y las 4 cajas de 2x2 con 1-4 sin repetir). Da exactamente 288.
export function enumerateAllGrids() {
  const grids = [];
  const grid = new Array(TOTAL).fill(0);

  function usedInRow(r, v) {
    for (let c = 0; c < N; c++) if (grid[r * N + c] === v) return true;
    return false;
  }
  function usedInCol(c, v) {
    for (let r = 0; r < N; r++) if (grid[r * N + c] === v) return true;
    return false;
  }
  function usedInBox(r, c, v) {
    const br = Math.floor(r / 2) * 2;
    const bc = Math.floor(c / 2) * 2;
    for (let rr = br; rr < br + 2; rr++) {
      for (let cc = bc; cc < bc + 2; cc++) {
        if (grid[rr * N + cc] === v) return true;
      }
    }
    return false;
  }
  function backtrack(pos) {
    if (pos === TOTAL) {
      grids.push(grid.slice());
      return;
    }
    const r = Math.floor(pos / N);
    const c = pos % N;
    for (let v = 1; v <= N; v++) {
      if (usedInRow(r, v) || usedInCol(c, v) || usedInBox(r, c, v)) continue;
      grid[pos] = v;
      backtrack(pos + 1);
      grid[pos] = 0;
    }
  }
  backtrack(0);
  return grids;
}

// Se calcula una sola vez al cargar el módulo (288 rejillas de 16 celdas es
// barato) y se reutiliza tanto para elegir soluciones como para verificar
// la unicidad de cada partición en jaulas.
export const ALL_GRIDS = enumerateAllGrids();

// Reparte las 16 celdas en jaulas de 2 a 4 celdas ortogonalmente contiguas
// (mismo estilo de "expansión aleatoria desde una celda semilla" que
// kkBuildCages() en game-kenken.js, pero forzando un mínimo de 2 celdas por
// jaula en vez de operar por operador). Devuelve null si alguna jaula
// queda de tamaño 1 sin poder fusionarse (rarísimo con 16 celdas): el
// llamador simplemente lo vuelve a intentar.
function buildCages() {
  const assigned = new Array(TOTAL).fill(-1);
  const cages = [];
  const order = shuffle(Array.from({ length: TOTAL }, (_, i) => i));

  function freeNeighbors(cells) {
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
    return candidates;
  }

  for (const start of order) {
    if (assigned[start] !== -1) continue;
    const idx = cages.length;
    const cells = [start];
    assigned[start] = idx;
    while (cells.length < 4) {
      const candidates = freeNeighbors(cells);
      if (!candidates.length) break;
      // Forzamos al menos 2 celdas por jaula; a partir de ahí seguimos
      // creciendo con probabilidad decreciente hasta el máximo de 4.
      if (cells.length >= 2 && randInt(1, 100) > 60) break;
      const chosen = pick(candidates);
      cells.push(chosen);
      assigned[chosen] = idx;
    }
    cages.push({ cells });
  }

  // Arregla jaulas que se quedaron con una sola celda (posible si todas
  // sus vecinas ya estaban asignadas): las fusiona con una jaula vecina
  // que tenga hueco (tamaño < 4).
  for (let idx = 0; idx < cages.length; idx++) {
    if (cages[idx].cells.length !== 1) continue;
    const cell = cages[idx].cells[0];
    const r = Math.floor(cell / N);
    const c = cell % N;
    const neigh = [];
    if (r > 0) neigh.push((r - 1) * N + c);
    if (r < N - 1) neigh.push((r + 1) * N + c);
    if (c > 0) neigh.push(r * N + c - 1);
    if (c < N - 1) neigh.push(r * N + c + 1);
    let mergedInto = -1;
    for (const n of neigh) {
      const otherIdx = assigned[n];
      if (otherIdx !== idx && cages[otherIdx].cells.length < 4) {
        mergedInto = otherIdx;
        break;
      }
    }
    if (mergedInto === -1) return null;
    cages[mergedInto].cells.push(cell);
    assigned[cell] = mergedInto;
    cages[idx].cells = [];
  }

  const result = cages.filter((cage) => cage.cells.length > 0);
  if (!result.every((cage) => cage.cells.length >= 2 && cage.cells.length <= 4)) return null;
  return result;
}

// Cuenta cuántas de las 288 rejillas posibles satisfacen TODAS las sumas de
// jaula dadas (agrupando sus valores por las mismas celdas de cada jaula).
// Se corta en cuanto encuentra una segunda coincidencia: solo nos importa
// si el resultado es exactamente 1.
function countGridsMatchingCages(cages) {
  let count = 0;
  for (const g of ALL_GRIDS) {
    let ok = true;
    for (const cage of cages) {
      let sum = 0;
      for (const i of cage.cells) sum += g[i];
      if (sum !== cage.target) {
        ok = false;
        break;
      }
    }
    if (ok) {
      count++;
      if (count > 1) return count;
    }
  }
  return count;
}

// Comprueba que ninguna jaula tenga dos celdas con el mismo dígito en la
// solución elegida — condición del Killer Sudoku real que la partición en
// jaulas debe respetar (una jaula solo puede sumar bien con dígitos
// repetidos si esos dígitos caen en filas/columnas/cajas distintas, cosa
// que el sudoku de base no impide por sí solo).
function cagesHaveNoInternalRepeat(cages, solution) {
  return cages.every((cage) => {
    const vals = cage.cells.map((i) => solution[i]);
    return new Set(vals).size === vals.length;
  });
}

// Genera una ronda: elige una solución de las 288, la parte en jaulas y
// verifica a fuerza bruta que esas sumas de jaula solo la cumplen ella
// (nunca otra de las 288). Si no, prueba otra partición con la misma
// solución (hasta 100 veces) y, si sigue sin salir, cambia de solución
// (hasta 30 veces en total).
export function generateAsesinoRound() {
  const maxSolutionAttempts = 30;
  const maxCageAttempts = 100;
  for (let s = 0; s < maxSolutionAttempts; s++) {
    const solution = pick(ALL_GRIDS);
    for (let a = 0; a < maxCageAttempts; a++) {
      let rawCages = null;
      for (let buildTry = 0; buildTry < 20 && !rawCages; buildTry++) {
        rawCages = buildCages();
      }
      if (!rawCages) continue;
      // Una jaula con dos celdas del mismo dígito en la solución elegida
      // rompería la regla de "no repetir dentro de la jaula" que exige
      // asnFindIssue — esa ronda sería irresoluble aunque las sumas
      // encajen, así que se descarta ANTES de comprobar unicidad.
      if (!cagesHaveNoInternalRepeat(rawCages, solution)) continue;
      const cages = rawCages.map((cage) => {
        const cells = cage.cells.slice().sort((x, y) => x - y);
        const target = cells.reduce((sum, i) => sum + solution[i], 0);
        return { cells, target };
      });
      if (countGridsMatchingCages(cages) !== 1) continue;
      const cageMap = new Array(TOTAL).fill(-1);
      const labels = new Array(TOTAL).fill(null);
      cages.forEach((cage, idx) => {
        cage.cells.forEach((i) => { cageMap[i] = idx; });
        labels[cage.cells[0]] = String(cage.target);
      });
      return { solution, cages, cageMap, labels };
    }
  }
  // No debería llegar aquí nunca con un sudoku 4x4 (las sumas de jaula
  // fijan la rejilla casi siempre en el primer o segundo intento), pero por
  // robustez reintentamos desde cero antes que servir una ronda ambigua.
  return generateAsesinoRound();
}

// Busca el primer problema del intento actual del jugador y lo explica.
// No compara con `solution` celda a celda: comprueba directamente las
// propiedades de un sudoku asesino válido (filas, columnas, cajas y sumas
// de jaula sin repetidos), que por la verificación de unicidad de
// generateAsesinoRound() solo puede cumplir la solución generada.
export function asnFindIssue(grid, puzzle) {
  for (let i = 0; i < TOTAL; i++) {
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
  for (let box = 0; box < 4; box++) {
    const br = Math.floor(box / 2) * 2;
    const bc = (box % 2) * 2;
    const cells = [br * N + bc, br * N + bc + 1, (br + 1) * N + bc, (br + 1) * N + bc + 1];
    for (let a = 0; a < cells.length; a++) {
      for (let b = a + 1; b < cells.length; b++) {
        if (grid[cells[a]] === grid[cells[b]]) {
          return {
            cell: cells[b],
            text: `La caja que empieza en fila ${br + 1}, columna ${bc + 1} repite el ${grid[cells[a]]}.`,
          };
        }
      }
    }
  }
  for (const cage of puzzle.cages) {
    const vals = cage.cells.map((i) => grid[i]);
    const r0 = Math.floor(cage.cells[0] / N);
    const c0 = cage.cells[0] % N;
    const seen = new Set();
    for (const v of vals) {
      if (seen.has(v)) {
        return {
          cell: cage.cells[0],
          text: `La jaula que empieza en fila ${r0 + 1}, columna ${c0 + 1} no puede repetir el ${v}.`,
        };
      }
      seen.add(v);
    }
    const sum = vals.reduce((x, y) => x + y, 0);
    if (sum !== cage.target) {
      return {
        cell: cage.cells[0],
        text: `La jaula que empieza en fila ${r0 + 1}, columna ${c0 + 1} pide sumar ${cage.target} y tus números dan ${sum}.`,
      };
    }
  }
  return null;
}

export function mountAsesinoGame(container, { client, onExit }) {
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
    puzzle = generateAsesinoRound();
    grid = new Array(TOTAL).fill(0);
    selected = -1;
    badCell = -1;
    locked = false;

    let cellsHtml = "";
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        cellsHtml += `<button type="button" class="asn-cell" data-cell="${r}-${c}"></button>`;
      }
    }

    body.innerHTML = `
      <p class="prompt">Sudoku 4×4 sin pistas: solo las sumas de cada jaula<small>Toca una celda y luego un número del teclado</small></p>
      <div class="asn-grid" data-grid>${cellsHtml}</div>
      <div class="asn-keypad" data-keypad>
        <button type="button" class="asn-key" data-digit="1">1</button>
        <button type="button" class="asn-key" data-digit="2">2</button>
        <button type="button" class="asn-key" data-digit="3">3</button>
        <button type="button" class="asn-key" data-digit="4">4</button>
      </div>
      <div class="asn-tools">
        <button type="button" class="secondary asn-tool" data-clear>↺ Borrar todo</button>
      </div>
      <button type="button" class="primary asn-check" data-check>✓ Comprobar</button>
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
      grid = new Array(TOTAL).fill(0);
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
      btn.className = `asn-cell asn-cage-c${cageIdx % 6}`;
      if (selected === i) btn.classList.add("selected");
      if (i === badCell) btn.classList.add("bad");
      if (r === 0 || puzzle.cageMap[(r - 1) * N + c] !== cageIdx) btn.classList.add("asn-edge-top");
      if (r === N - 1 || puzzle.cageMap[(r + 1) * N + c] !== cageIdx) btn.classList.add("asn-edge-bottom");
      if (c === 0 || puzzle.cageMap[r * N + c - 1] !== cageIdx) btn.classList.add("asn-edge-left");
      if (c === N - 1 || puzzle.cageMap[r * N + c + 1] !== cageIdx) btn.classList.add("asn-edge-right");
      // Bordes gruesos extra que marcan las 4 cajas 2x2 del sudoku, además
      // de las jaulas (dos rejillas de división superpuestas, como en un
      // sudoku real con jaulas de killer sudoku).
      if (r === 2) btn.classList.add("asn-box-top");
      if (c === 2) btn.classList.add("asn-box-left");
      const label = puzzle.labels[i];
      const value = grid[i] ? String(grid[i]) : "";
      btn.innerHTML = `${label ? `<span class="asn-cage-label">${label}</span>` : ""}<span class="asn-cell-value">${value}</span>`;
    });
  }

  function check() {
    const issue = asnFindIssue(grid, puzzle);
    if (!issue) {
      rounds++;
      score += 10;
      renderScore();
      locked = true;
      say("¡Filas, columnas, cajas y jaulas cuadran! Sudoku resuelto. +10", "ok");
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
    saveScore(client, "asesino", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔪</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} sudokus asesinos resueltos</p>
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
