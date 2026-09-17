// "Cuadrado mágico" 3x3: completar el cuadrado para que las tres filas, las
// tres columnas y las dos diagonales sumen lo mismo. Se parte de un cuadrado
// mágico de verdad (el de Lo Shu, en una de sus 8 orientaciones, con los
// números estirados en progresión aritmética), se tapan celdas y se
// comprueba por FUERZA BRUTA — probando todas las formas de repartir las
// fichas del banco en los huecos — que solo hay UNA manera de completarlo.
// Al fallar se dice qué línea no suma y cuánto suma de más o de menos.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

// Cuadrado de Lo Shu: el único cuadrado mágico 3x3 con 1..9 salvo giros y
// reflejos, así que basta con sus 8 orientaciones.
const LO_SHU = [2, 7, 6, 9, 5, 1, 4, 3, 8];

function rot90(g) {
  const out = new Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out[c * 3 + (2 - r)] = g[r * 3 + c];
  return out;
}
function mirror(g) {
  const out = new Array(9);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out[r * 3 + (2 - c)] = g[r * 3 + c];
  return out;
}

export function mgOrientations() {
  const out = [];
  let g = LO_SHU.slice();
  for (let i = 0; i < 4; i++) {
    out.push(g.slice());
    out.push(mirror(g));
    g = rot90(g);
  }
  return out;
}

export function mgLevelFor(streak) {
  if (streak >= 8) return { holes: 6, aMax: 9, ds: [2, 3] };
  if (streak >= 6) return { holes: 5, aMax: 9, ds: [2, 3] };
  if (streak >= 4) return { holes: 4, aMax: 8, ds: [2] };
  if (streak >= 2) return { holes: 4, aMax: 6, ds: [1] };
  return { holes: 3, aMax: 1, ds: [1] };
}

// Las 8 líneas que tienen que sumar igual.
export const MG_LINES = [
  { name: "la fila 1", cells: [0, 1, 2] },
  { name: "la fila 2", cells: [3, 4, 5] },
  { name: "la fila 3", cells: [6, 7, 8] },
  { name: "la columna 1", cells: [0, 3, 6] },
  { name: "la columna 2", cells: [1, 4, 7] },
  { name: "la columna 3", cells: [2, 5, 8] },
  { name: "la diagonal ↘", cells: [0, 4, 8] },
  { name: "la diagonal ↙", cells: [2, 4, 6] },
];

// Cuenta de cuántas formas distintas se pueden repartir las fichas del banco
// en los huecos cumpliendo las 8 sumas (se corta en `limit`).
export function mgCountSolutions(grid, holes, bank, target, limit = 2) {
  const g = grid.slice();
  const used = new Array(bank.length).fill(false);
  let found = 0;

  function lineOk(cells) {
    let sum = 0;
    for (const i of cells) {
      if (!g[i]) return true; // línea incompleta: aún no se puede juzgar
      sum += g[i];
    }
    return sum === target;
  }

  function rec(k) {
    if (found >= limit) return;
    if (k === holes.length) {
      found++;
      return;
    }
    const tried = new Set();
    for (let b = 0; b < bank.length; b++) {
      if (used[b] || tried.has(bank[b])) continue;
      tried.add(bank[b]); // fichas repetidas no cuentan como reparto distinto
      used[b] = true;
      g[holes[k]] = bank[b];
      let ok = true;
      for (const line of MG_LINES) {
        if (!line.cells.includes(holes[k])) continue;
        if (!lineOk(line.cells)) {
          ok = false;
          break;
        }
      }
      if (ok) rec(k + 1);
      g[holes[k]] = 0;
      used[b] = false;
      if (found >= limit) return;
    }
  }

  rec(0);
  return found;
}

// Genera una ronda con solución ÚNICA.
// Devuelve { solution, grid, holes, bank, target, unique, attempts, fallback }.
export function mgGenerate(streak, maxTries = 120) {
  const lv = mgLevelFor(streak);
  let attempts = 0;
  for (let holes = lv.holes; holes >= 2; holes--) {
    // Cada número de huecos tiene su propio presupuesto de intentos; si con
    // 5 huecos no se consigue unicidad, se prueba con 4, con 3...
    for (let t = 0; t < maxTries; t++) {
      attempts++;
      const base = pick(mgOrientations());
      const a = randInt(1, lv.aMax);
      const d = pick(lv.ds);
      const solution = base.map((v) => a + d * (v - 1));
      const target = 3 * a + 12 * d;
      const holeCells = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, holes).sort((x, y) => x - y);
      const grid = solution.slice();
      for (const i of holeCells) grid[i] = 0;
      const bank = shuffle(holeCells.map((i) => solution[i]));
      if (mgCountSolutions(grid, holeCells, bank, target, 2) === 1) {
        return { solution, grid, holes: holeCells, bank, target, unique: true, attempts, fallback: false };
      }
    }
  }
  const solution = LO_SHU.slice();
  const holeCells = [0, 4, 8];
  const grid = solution.slice();
  for (const i of holeCells) grid[i] = 0;
  return {
    solution,
    grid,
    holes: holeCells,
    bank: shuffle(holeCells.map((i) => solution[i])),
    target: 15,
    unique: true,
    attempts,
    fallback: true,
  };
}

export function mountMagicoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let puzzle = null;
  let grid = [];
  let bank = [];
  let selected = -1;
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
    puzzle = mgGenerate(streak);
    grid = puzzle.grid.slice();
    // Cada ficha del banco lleva su propio hueco: null = ya colocada.
    bank = puzzle.bank.map((v) => ({ v, at: null }));
    selected = -1;
    locked = false;

    let cells = "";
    for (let i = 0; i < 9; i++) {
      const hole = puzzle.holes.includes(i);
      cells += `<button type="button" class="mg-cell${hole ? " hole" : " given"}" data-cell="${i}"></button>`;
    }

    body.innerHTML = `
      <p class="prompt">Cada línea suma ${puzzle.target}<small>Filas, columnas y las dos diagonales: coloca las fichas que faltan</small></p>
      <div class="mg-grid" data-grid>${cells}</div>
      <div class="mg-bank" data-bank></div>
      <div class="mg-tools">
        <button class="secondary mg-tool" data-clear>↺ Vaciar huecos</button>
        <button class="secondary mg-tool" data-give>🔎 Solución (−1 vida)</button>
      </div>
      <button class="primary mg-check" data-check disabled>✓ Comprobar</button>
      <div class="feedback" data-feedback></div>
    `;

    body.querySelectorAll("[data-cell]").forEach((btn) => {
      btn.addEventListener("click", () => tapCell(Number(btn.dataset.cell)));
    });
    body.querySelector("[data-clear]").addEventListener("click", () => {
      if (finished || locked) return;
      grid = puzzle.grid.slice();
      bank.forEach((t) => (t.at = null));
      selected = -1;
      render();
      say("", "");
    });
    body.querySelector("[data-give]").addEventListener("click", () => {
      if (finished || locked) return;
      loseRound("Solución al descubierto");
    });
    body.querySelector("[data-check]").addEventListener("click", () => {
      if (finished || locked) return;
      if (puzzle.holes.some((h) => !grid[h])) return say("Aún quedan huecos sin ficha", "bad");
      check();
    });
    render();
    say("Toca una ficha y luego un hueco", "");
  }

  function render(badCells) {
    body.querySelectorAll("[data-cell]").forEach((btn) => {
      const i = Number(btn.dataset.cell);
      const hole = puzzle.holes.includes(i);
      btn.textContent = grid[i] ? String(grid[i]) : "";
      btn.className = `mg-cell${hole ? " hole" : " given"}`;
      if (hole && grid[i]) btn.classList.add("filled");
      if (badCells && badCells.has(i)) btn.classList.add("bad");
    });
    const bankEl = body.querySelector("[data-bank]");
    bankEl.innerHTML = "";
    bank.forEach((t, k) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `mg-tile${t.at !== null ? " used" : ""}${selected === k ? " sel" : ""}`;
      btn.textContent = String(t.v);
      btn.disabled = t.at !== null;
      btn.addEventListener("click", () => {
        if (finished || locked || t.at !== null) return;
        selected = selected === k ? -1 : k;
        render();
      });
      bankEl.appendChild(btn);
    });
    // Se comprueba cuando el jugador quiera, con todos los huecos llenos.
    const chk = body.querySelector("[data-check]");
    if (chk) chk.disabled = puzzle.holes.some((h) => !grid[h]);
  }

  function tapCell(i) {
    if (finished || locked) return;
    if (!puzzle.holes.includes(i)) return say("Ese número ya estaba puesto", "");
    // Hueco ocupado: la ficha vuelve al banco.
    const here = bank.find((t) => t.at === i);
    if (here) {
      here.at = null;
      grid[i] = 0;
      selected = -1;
      render();
      return say("Ficha devuelta al banco", "");
    }
    if (selected === -1) return say("Elige primero una ficha del banco", "bad");
    bank[selected].at = i;
    grid[i] = bank[selected].v;
    selected = -1;
    render();
    say(puzzle.holes.some((h) => !grid[h]) ? "" : "Todo colocado: dale a Comprobar", "");
  }

  // Primera línea que no suma lo que debe, con la diferencia exacta.
  function firstError() {
    for (const line of MG_LINES) {
      const sum = line.cells.reduce((a, i) => a + grid[i], 0);
      if (sum !== puzzle.target) {
        const diff = sum - puzzle.target;
        const how = diff > 0 ? `${diff} de más` : `${-diff} de menos`;
        const name = line.name.charAt(0).toUpperCase() + line.name.slice(1);
        return { text: `${name} suma ${sum} y debe sumar ${puzzle.target}: ${how}`, cells: line.cells };
      }
    }
    return null;
  }

  function check() {
    const err = firstError();
    if (!err) {
      locked = true;
      rounds++;
      streak++;
      score += 10;
      renderScore();
      say("¡Cuadrado mágico! +10", "ok");
      return later(nextRound, 900);
    }
    locked = true;
    rounds++;
    streak = 0;
    lives--;
    renderLives();
    render(new Set(err.cells));
    say(`${err.text}. Mira la colocación buena.`, "bad");
    later(() => {
      grid = puzzle.solution.slice();
      bank.forEach((t, k) => (t.at = puzzle.holes[k]));
      render();
      body.querySelectorAll("[data-cell]").forEach((btn) => btn.classList.add("reveal"));
    }, 1600);
    if (lives <= 0) return later(() => finish(false), 3200);
    later(nextRound, 3200);
  }

  function loseRound(reason) {
    locked = true;
    rounds++;
    streak = 0;
    lives--;
    renderLives();
    grid = puzzle.solution.slice();
    bank.forEach((t, k) => (t.at = puzzle.holes[k]));
    render();
    body.querySelectorAll("[data-cell]").forEach((btn) => btn.classList.add("reveal"));
    say(`${reason}: así sumaban todas las líneas ${puzzle.target}.`, "bad");
    if (lives <= 0) return later(() => finish(false), 2400);
    later(nextRound, 2400);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "magico", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔮</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} cuadrados completados</p>
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
    streak = 0;
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
