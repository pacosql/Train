// "Hundir la flota" en solitario: un tablero 6×6 con los barcos ocupados
// contados por fila y por columna. No se adivina a ciegas — se DEDUCE.
// El generador comprueba por fuerza bruta que con esos contadores (más
// las pistas destapadas) la solución es ÚNICA; si no lo es, destapa una
// casilla más y vuelve a comprobar.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const N = 6;

// Máscaras de columnas con exactamente k barcos, cacheadas.
const COMBO_CACHE = {};
function combosOf(k) {
  if (COMBO_CACHE[k]) return COMBO_CACHE[k];
  const out = [];
  for (let mask = 0; mask < (1 << N); mask++) {
    let bits = 0;
    for (let c = 0; c < N; c++) if (mask & (1 << c)) bits++;
    if (bits === k) out.push(mask);
  }
  COMBO_CACHE[k] = out;
  return out;
}

// Busca hasta `limit` tableros compatibles con los contadores y las
// pistas destapadas. Devuelve cada solución como 6 máscaras de fila.
export function solveFlota(rowCounts, colCounts, revealed, limit = 2) {
  const force = new Array(N).fill(0);
  const ban = new Array(N).fill(0);
  revealed.forEach((v, key) => {
    const r = Math.floor(key / N);
    const c = key % N;
    if (v) force[r] |= 1 << c; else ban[r] |= 1 << c;
  });
  const sols = [];
  const colRem = colCounts.slice();
  const rowsAfter = new Array(N + 1).fill(0);
  for (let r = N - 1; r >= 0; r--) rowsAfter[r] = rowsAfter[r + 1] + rowCounts[r];

  const rec = (r, acc) => {
    if (sols.length >= limit) return;
    let sumCol = 0;
    for (let c = 0; c < N; c++) sumCol += colRem[c];
    if (sumCol !== rowsAfter[r]) return;
    if (r === N) { sols.push(acc.slice()); return; }
    const rowsLeft = N - r;
    for (const mask of combosOf(rowCounts[r])) {
      if (mask & ban[r]) continue;
      if ((mask & force[r]) !== force[r]) continue;
      let ok = true;
      for (let c = 0; c < N; c++) {
        if (mask & (1 << c)) {
          if (colRem[c] === 0) { ok = false; break; }
        } else if (colRem[c] > rowsLeft - 1) { ok = false; break; }
      }
      if (!ok) continue;
      for (let c = 0; c < N; c++) if (mask & (1 << c)) colRem[c]--;
      acc.push(mask);
      rec(r + 1, acc);
      acc.pop();
      for (let c = 0; c < N; c++) if (mask & (1 << c)) colRem[c]++;
      if (sols.length >= limit) return;
    }
  };
  rec(0, []);
  return sols;
}

// Coloca los barcos rectos, sin tocarse ni en diagonal (aire de flota real).
function placeFleet(sizes) {
  const grid = [];
  for (let r = 0; r < N; r++) grid.push(new Array(N).fill(0));
  const free = (r, c) => {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr;
      const cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
      if (grid[rr][cc]) return false;
    }
    return true;
  };
  for (const size of sizes) {
    let placed = false;
    for (let guard = 0; guard < 300 && !placed; guard++) {
      const horiz = randInt(0, 1) === 1;
      const r = randInt(0, horiz ? N - 1 : N - size);
      const c = randInt(0, horiz ? N - size : N - 1);
      let ok = true;
      for (let i = 0; i < size && ok; i++) {
        ok = free(r + (horiz ? 0 : i), c + (horiz ? i : 0));
      }
      if (!ok) continue;
      for (let i = 0; i < size; i++) grid[r + (horiz ? 0 : i)][c + (horiz ? i : 0)] = 1;
      placed = true;
    }
    if (!placed) return null;
  }
  return grid;
}

function countsOf(grid) {
  const rowCounts = grid.map((row) => row.reduce((a, b) => a + b, 0));
  const colCounts = [];
  for (let c = 0; c < N; c++) {
    let s = 0;
    for (let r = 0; r < N; r++) s += grid[r][c];
    colCounts.push(s);
  }
  return { rowCounts, colCounts };
}

function masksOf(grid) {
  return grid.map((row) => row.reduce((m, v, c) => (v ? m | (1 << c) : m), 0));
}

// Destapa casillas hasta que la solución sea única. Devuelve null si hace
// falta destapar más de `maxReveals` (ese reparto se descarta y se prueba
// otra flota) o si en 40 pasos no lo consigue.
function makeUnique(grid, rowCounts, colCounts, revealed, randomPick, maxReveals) {
  const truth = masksOf(grid);
  for (let step = 0; step < 40; step++) {
    if (revealed.size > maxReveals) return null;   // tablero demasiado regalado
    const sols = solveFlota(rowCounts, colCounts, revealed, 2);
    if (sols.length === 0) return null;
    if (sols.length === 1) return revealed;
    const diffs = [];
    for (let r = 0; r < N; r++) {
      const d = sols[0][r] ^ sols[1][r];
      for (let c = 0; c < N; c++) if (d & (1 << c)) diffs.push(r * N + c);
    }
    if (!diffs.length) return null;
    const key = randomPick ? pick(diffs) : diffs[0];
    revealed.set(key, (truth[Math.floor(key / N)] >> (key % N)) & 1);
  }
  return null;
}

const FLEETS = [
  [3, 2, 2],
  [4, 3, 2],
  [4, 3, 2, 2],
];

export function makeFlotaRound(streak) {
  const tier = streak >= 5 ? 2 : (streak >= 2 ? 1 : 0);
  const sizes = FLEETS[tier];
  const freebies = tier === 0 ? 2 : (tier === 1 ? 1 : 0);
  const maxReveals = freebies + 4;
  let guard = 0;
  while (guard++ < 400) {
    const grid = placeFleet(sizes);
    if (!grid) continue;
    const { rowCounts, colCounts } = countsOf(grid);
    const revealed = new Map();
    // Regalo inicial en rachas bajas: alguna casilla de barco ya puesta.
    const shipCells = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (grid[r][c]) shipCells.push(r * N + c);
    shuffle(shipCells).slice(0, freebies).forEach((key) => revealed.set(key, 1));
    const done = makeUnique(grid, rowCounts, colCounts, revealed, true, maxReveals);
    if (done) return { grid, rowCounts, colCounts, revealed: done, sizes };
  }
  // Caso fijo válido: se destapan casillas de forma determinista hasta que
  // sea único, así nunca se devuelve una ronda rota.
  const grid = [
    [1, 1, 1, 0, 0, 1],
    [0, 0, 0, 0, 0, 0],
    [1, 0, 1, 1, 0, 0],
    [1, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0],
    [1, 1, 0, 1, 1, 0],
  ];
  const { rowCounts, colCounts } = countsOf(grid);
  const revealed = makeUnique(grid, rowCounts, colCounts, new Map(), false, 36) || new Map();
  return { grid, rowCounts, colCounts, revealed, sizes };
}

export function mountFlotaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let round = null;
  let marks = [];     // 0 = sin marcar, 1 = barco, 2 = agua
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
    round = makeFlotaRound(streak);
    marks = [];
    for (let r = 0; r < N; r++) marks.push(new Array(N).fill(0));
    round.revealed.forEach((v, key) => {
      marks[Math.floor(key / N)][key % N] = v ? 1 : 2;
    });
    locked = false;

    const fleetText = round.sizes.map((s) => "▪".repeat(s)).join(" ");
    body.innerHTML = `
      <div class="fl-wrap">
        <p class="prompt fl-prompt">⚓ ¿Dónde está la flota?
          <small>Los números dicen cuántas casillas de barco hay en cada fila y
          columna. Toca para cambiar: barco → agua → vacío. Flota: ${fleetText}</small></p>
        <div class="fl-grid" data-grid></div>
        <div class="feedback" data-feedback></div>
        <button class="primary fl-go" data-go>Comprobar</button>
      </div>
    `;
    buildGrid();
    renderGrid();
  }

  function buildGrid() {
    const g = body.querySelector("[data-grid]");
    g.innerHTML = "";
    g.appendChild(cell("fl-corner", ""));
    for (let c = 0; c < N; c++) g.appendChild(cell("fl-head fl-col", String(round.colCounts[c]), `col-${c}`));
    for (let r = 0; r < N; r++) {
      g.appendChild(cell("fl-head fl-row", String(round.rowCounts[r]), `row-${r}`));
      for (let c = 0; c < N; c++) {
        const btn = document.createElement("button");
        btn.className = "fl-cell";
        btn.type = "button";
        btn.dataset.cell = `${r}-${c}`;
        if (round.revealed.has(r * N + c)) btn.classList.add("fl-fixed");
        btn.addEventListener("click", () => tap(r, c));
        g.appendChild(btn);
      }
    }
  }

  function cell(cls, text, key) {
    const el = document.createElement("span");
    el.className = cls;
    el.textContent = text;
    if (key) el.dataset.key = key;
    return el;
  }

  function tap(r, c) {
    if (finished || locked) return;
    if (round.revealed.has(r * N + c)) return; // las pistas no se tocan
    marks[r][c] = (marks[r][c] + 1) % 3;
    renderGrid();
  }

  function renderGrid() {
    const g = body.querySelector("[data-grid]");
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const btn = g.querySelector(`[data-cell="${r}-${c}"]`);
        btn.classList.toggle("fl-ship", marks[r][c] === 1);
        btn.classList.toggle("fl-water", marks[r][c] === 2);
        btn.textContent = marks[r][c] === 1 ? "🚢" : (marks[r][c] === 2 ? "·" : "");
      }
    }
    // Contadores en verde cuando la fila/columna cuadra: el tablero
    // confirma la deducción paso a paso.
    for (let r = 0; r < N; r++) {
      const n = marks[r].filter((v) => v === 1).length;
      const el = g.querySelector(`[data-key="row-${r}"]`);
      el.classList.toggle("fl-done", n === round.rowCounts[r]);
      el.classList.toggle("fl-over", n > round.rowCounts[r]);
    }
    for (let c = 0; c < N; c++) {
      let n = 0;
      for (let r = 0; r < N; r++) if (marks[r][c] === 1) n++;
      const el = g.querySelector(`[data-key="col-${c}"]`);
      el.classList.toggle("fl-done", n === round.colCounts[c]);
      el.classList.toggle("fl-over", n > round.colCounts[c]);
    }
  }

  function check() {
    if (finished || locked) return;
    let missing = 0;
    let wrong = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (round.grid[r][c] === 1 && marks[r][c] !== 1) missing++;
      if (round.grid[r][c] === 0 && marks[r][c] === 1) wrong++;
    }
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (missing === 0 && wrong === 0) {
      locked = true;
      score += 10;
      streak++;
      renderScore();
      feedback.textContent = "¡Flota hundida! Todos los contadores cuadran";
      feedback.className = "feedback ok";
      return later(nextRound, 1200);
    }
    locked = true;
    streak = 0;
    lives--;
    renderLives();
    // Al fallar se ve la solución: en verde los barcos que faltaban y en
    // rojo las casillas marcadas donde sólo había agua.
    const g = body.querySelector("[data-grid]");
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const btn = g.querySelector(`[data-cell="${r}-${c}"]`);
      if (round.grid[r][c] === 1 && marks[r][c] !== 1) {
        btn.classList.add("fl-sol");
        btn.textContent = "🚢";
      } else if (round.grid[r][c] === 0 && marks[r][c] === 1) {
        btn.classList.add("fl-bad");
        btn.textContent = "✖";
      }
    }
    const parts = [];
    if (missing) parts.push(missing === 1 ? "te faltaba <b>1</b> casilla" : `te faltaban <b>${missing}</b> casillas`);
    if (wrong) parts.push(wrong === 1 ? "te sobraba <b>1</b>" : `te sobraban <b>${wrong}</b>`);
    feedback.innerHTML = `Así estaba la flota: ${parts.join(" y ")}.`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 3000);
    later(nextRound, 3000);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "flota", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚓</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} tableros resueltos</p>
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

  body.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-go]")) check();
  });

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
  };
}
