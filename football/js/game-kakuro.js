// "Kakuro" mini (rejilla 4x4 con pocas casillas blancas): cada bloque de
// casillas seguidas debe sumar el número de su pista, sin repetir dígitos
// dentro del bloque. Se genera al revés: se rellena la rejilla con dígitos
// legales al azar y las pistas son las sumas reales, así la solución existe
// siempre. Luego se cuentan las soluciones por FUERZA BRUTA y se destapa un
// dígito cada vez hasta que la solución es ÚNICA (y se poda lo que sobra).
// Al fallar se señala el bloque que no cuadra, con su suma real.
import { shuffle, saveScore } from "./utils.js";

// Patrones de rejilla: '.' casilla blanca, '#' negra. Todos los bloques
// tienen 2 casillas o más, tanto en filas como en columnas.
export const KK_PATTERNS = [
  { name: "S", rows: ["..##", "...#", "#...", "##.."], reveal: 2 },
  { name: "A", rows: ["..##", "....", "#...", "##.."], reveal: 2 },
  { name: "B", rows: ["#..#", "....", "....", "#..#"], reveal: 1 },
  { name: "C", rows: ["...#", "....", "#...", "#..."], reveal: 0 },
];

export function kkLevelFor(streak) {
  if (streak >= 6) return KK_PATTERNS[3];
  if (streak >= 4) return KK_PATTERNS[2];
  if (streak >= 2) return KK_PATTERNS[1];
  return KK_PATTERNS[0];
}

const SIZE = 4;

// Analiza un patrón: casillas blancas en orden de lectura y bloques
// (horizontales y verticales) de longitud >= 2.
export function kkLayout(pattern) {
  const white = [];
  const idxOf = new Array(SIZE * SIZE).fill(-1);
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (pattern.rows[r][c] === ".") {
        idxOf[r * SIZE + c] = white.length;
        white.push({ r, c, h: -1, v: -1 });
      }
    }
  }
  const runs = [];
  function closeRun(type, run) {
    if (run.length < 2) return;
    const first = white[run[0]];
    runs.push({ type, r: first.r, c: first.c, cells: run.slice() });
  }
  for (let r = 0; r < SIZE; r++) {
    let run = [];
    for (let c = 0; c <= SIZE; c++) {
      if (c < SIZE && pattern.rows[r][c] === ".") run.push(idxOf[r * SIZE + c]);
      else {
        closeRun("h", run);
        run = [];
      }
    }
  }
  for (let c = 0; c < SIZE; c++) {
    let run = [];
    for (let r = 0; r <= SIZE; r++) {
      if (r < SIZE && pattern.rows[r][c] === ".") run.push(idxOf[r * SIZE + c]);
      else {
        closeRun("v", run);
        run = [];
      }
    }
  }
  runs.forEach((run, i) => {
    for (const w of run.cells) {
      if (run.type === "h") white[w].h = i;
      else white[w].v = i;
    }
  });
  return { white, runs, idxOf };
}

function bitsMissing(mask) {
  const out = [];
  for (let d = 1; d <= 9; d++) if (!(mask & (1 << d))) out.push(d);
  return out;
}
function minSum(mask, k) {
  const free = bitsMissing(mask);
  let s = 0;
  for (let i = 0; i < k; i++) s += free[i] ?? 99;
  return s;
}
function maxSum(mask, k) {
  const free = bitsMissing(mask);
  let s = 0;
  for (let i = 0; i < k; i++) s += free[free.length - 1 - i] ?? -99;
  return s;
}

// Cuenta soluciones (hasta `limit`) de la rejilla dada por las sumas de los
// bloques y los dígitos ya destapados. `givens` es un array por casilla
// blanca con 0 = tapada.
export function kkCountSolutions(layout, sums, givens, limit = 2) {
  const { white, runs } = layout;
  const st = runs.map(() => ({ count: 0, sum: 0, mask: 0 }));
  let found = 0;

  function fits(ri) {
    const run = runs[ri];
    const s = st[ri];
    const left = run.cells.length - s.count;
    if (left === 0) return s.sum === sums[ri];
    return s.sum + minSum(s.mask, left) <= sums[ri] && s.sum + maxSum(s.mask, left) >= sums[ri];
  }

  function rec(p) {
    if (found >= limit) return;
    if (p === white.length) {
      found++;
      return;
    }
    const w = white[p];
    const fixed = givens[p];
    for (let d = 1; d <= 9; d++) {
      if (fixed && d !== fixed) continue;
      if (w.h >= 0 && st[w.h].mask & (1 << d)) continue;
      if (w.v >= 0 && st[w.v].mask & (1 << d)) continue;
      const touched = [];
      if (w.h >= 0) touched.push(w.h);
      if (w.v >= 0) touched.push(w.v);
      for (const ri of touched) {
        st[ri].count++;
        st[ri].sum += d;
        st[ri].mask |= 1 << d;
      }
      let ok = true;
      for (const ri of touched) if (!fits(ri)) { ok = false; break; }
      if (ok) rec(p + 1);
      for (const ri of touched) {
        st[ri].count--;
        st[ri].sum -= d;
        st[ri].mask &= ~(1 << d);
      }
      if (found >= limit) return;
    }
  }

  rec(0);
  return found;
}

// Rellena la rejilla con dígitos 1-9 legales (sin repetir en cada bloque).
function kkFill(layout) {
  const { white } = layout;
  const vals = new Array(white.length).fill(0);
  const masks = layout.runs.map(() => 0);
  function rec(p) {
    if (p === white.length) return true;
    const w = white[p];
    for (const d of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (w.h >= 0 && masks[w.h] & (1 << d)) continue;
      if (w.v >= 0 && masks[w.v] & (1 << d)) continue;
      vals[p] = d;
      if (w.h >= 0) masks[w.h] |= 1 << d;
      if (w.v >= 0) masks[w.v] |= 1 << d;
      if (rec(p + 1)) return true;
      if (w.h >= 0) masks[w.h] &= ~(1 << d);
      if (w.v >= 0) masks[w.v] &= ~(1 << d);
      vals[p] = 0;
    }
    return false;
  }
  return rec(0) ? vals : null;
}

// Genera una ronda con solución ÚNICA.
// Devuelve { pattern, layout, sums, solution, givens, unique, attempts, fallback }.
export function kkGenerate(streak, maxTries = 30) {
  const pattern = kkLevelFor(streak);
  const layout = kkLayout(pattern);
  let attempts = 0;
  while (attempts < maxTries) {
    attempts++;
    const solution = kkFill(layout);
    if (!solution) continue;
    const sums = layout.runs.map((run) => run.cells.reduce((a, i) => a + solution[i], 0));
    const order = shuffle(Array.from({ length: layout.white.length }, (_, i) => i));
    const givens = new Array(layout.white.length).fill(0);
    let next = 0;
    for (; next < pattern.reveal; next++) givens[order[next]] = solution[order[next]];
    // Se destapa un dígito más mientras haya más de una solución.
    while (kkCountSolutions(layout, sums, givens, 2) > 1 && next < order.length) {
      givens[order[next]] = solution[order[next]];
      next++;
    }
    if (kkCountSolutions(layout, sums, givens, 2) !== 1) continue;
    // Poda hasta el suelo del nivel: lo que no hace falta, fuera.
    for (const i of shuffle(Array.from({ length: layout.white.length }, (_, k) => k))) {
      if (!givens[i]) continue;
      if (givens.filter((v) => v > 0).length <= pattern.reveal) break;
      const keep = givens[i];
      givens[i] = 0;
      if (kkCountSolutions(layout, sums, givens, 2) !== 1) givens[i] = keep;
    }
    return { pattern, layout, sums, solution, givens, unique: true, attempts, fallback: false };
  }
  // Guarda agotada: se destapa todo menos una casilla del patrón fácil,
  // que siempre tiene solución única (nunca se devuelve un puzle roto).
  const p0 = KK_PATTERNS[0];
  const l0 = kkLayout(p0);
  const sol = kkFill(l0) || l0.white.map((_, i) => (i % 9) + 1);
  const sums = l0.runs.map((run) => run.cells.reduce((a, i) => a + sol[i], 0));
  const givens = sol.slice();
  givens[0] = 0;
  return { pattern: p0, layout: l0, sums, solution: sol, givens, unique: true, attempts, fallback: true };
}

export function mountKakuroGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let puzzle = null;
  let vals = [];
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
    puzzle = kkGenerate(streak);
    vals = puzzle.givens.slice();
    selected = -1;
    locked = false;

    // La rejilla que se ve es una casilla más ancha y alta: el borde guarda
    // las pistas de los bloques que empiezan en la fila/columna 0.
    const D = SIZE + 1;
    const across = new Map(); // celda de pista -> suma horizontal
    const down = new Map(); // celda de pista -> suma vertical
    puzzle.layout.runs.forEach((run, i) => {
      if (run.type === "h") across.set(run.r + 1 + "," + run.c, puzzle.sums[i]);
      else down.set(run.r + "," + (run.c + 1), puzzle.sums[i]);
    });

    let html = "";
    for (let dr = 0; dr < D; dr++) {
      for (let dc = 0; dc < D; dc++) {
        const r = dr - 1;
        const c = dc - 1;
        const isWhite = r >= 0 && c >= 0 && puzzle.pattern.rows[r][c] === ".";
        if (isWhite) {
          const w = puzzle.layout.idxOf[r * SIZE + c];
          html += `<button type="button" class="kk-cell" data-cell="${w}"></button>`;
        } else {
          const a = across.get(dr + "," + dc);
          const d = down.get(dr + "," + dc);
          if (a || d) {
            html += `<span class="kk-clue"><i class="kk-a">${a || ""}</i><i class="kk-d">${d || ""}</i></span>`;
          } else {
            html += `<span class="kk-block"></span>`;
          }
        }
      }
    }

    let pad = "";
    for (let d = 1; d <= 9; d++) pad += `<button type="button" class="kk-key" data-key="${d}">${d}</button>`;
    pad += `<button type="button" class="kk-key kk-del" data-key="0">✕</button>`;

    body.innerHTML = `
      <p class="prompt">Que cada bloque sume su pista<small>Dígitos 1-9 sin repetir en el bloque. En las casillas grises: el número de arriba es la suma de las casillas de su derecha; el de abajo, de las que bajan</small></p>
      <div class="kk-grid" data-grid style="--kk-d:${D}">${html}</div>
      <div class="kk-pad" data-pad>${pad}</div>
      <div class="kk-tools">
        <button class="secondary kk-tool" data-clear>↺ Borrar</button>
        <button class="secondary kk-tool" data-give>🔎 Solución (−1 vida)</button>
      </div>
      <button class="primary kk-check" data-check disabled>✓ Comprobar</button>
      <div class="feedback" data-feedback></div>
    `;

    body.querySelectorAll("[data-cell]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (finished || locked) return;
        const w = Number(btn.dataset.cell);
        if (puzzle.givens[w]) return say("Ese dígito viene de regalo", "");
        selected = selected === w ? -1 : w;
        renderGrid();
      });
    });
    body.querySelectorAll("[data-key]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (finished || locked) return;
        if (selected === -1) return say("Toca antes una casilla blanca", "bad");
        vals[selected] = Number(btn.dataset.key);
        const next = nextEmpty(selected);
        selected = vals[selected] === 0 ? selected : next;
        renderGrid();
        say(vals.some((v) => v === 0) ? "" : "Rejilla llena: dale a Comprobar", "");
      });
    });
    body.querySelector("[data-clear]").addEventListener("click", () => {
      if (finished || locked) return;
      vals = puzzle.givens.slice();
      selected = -1;
      renderGrid();
      say("", "");
    });
    body.querySelector("[data-give]").addEventListener("click", () => {
      if (finished || locked) return;
      loseRound("Solución al descubierto");
    });
    body.querySelector("[data-check]").addEventListener("click", () => {
      if (finished || locked) return;
      if (vals.some((v) => v === 0)) return say("Aún quedan casillas vacías", "bad");
      check();
    });
    renderGrid();
    say("Toca una casilla y luego un dígito", "");
  }

  function nextEmpty(from) {
    for (let k = 1; k <= vals.length; k++) {
      const i = (from + k) % vals.length;
      if (!puzzle.givens[i] && !vals[i]) return i;
    }
    return -1;
  }

  function renderGrid(badSet) {
    body.querySelectorAll("[data-cell]").forEach((btn) => {
      const w = Number(btn.dataset.cell);
      btn.textContent = vals[w] ? String(vals[w]) : "";
      btn.className = "kk-cell";
      if (puzzle.givens[w]) btn.classList.add("given");
      if (selected === w) btn.classList.add("sel");
      if (badSet && badSet.has(w)) btn.classList.add("bad");
    });
    // Se comprueba cuando el jugador quiera, con la rejilla llena.
    const chk = body.querySelector("[data-check]");
    if (chk) chk.disabled = vals.some((v) => v === 0);
  }

  // Primer bloque que no cuadra, con el porqué concreto.
  function firstError() {
    const { runs } = puzzle.layout;
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      const nums = run.cells.map((w) => vals[w]);
      const dup = nums.find((n, k) => nums.indexOf(n) !== k);
      const dirTxt = run.type === "h" ? `→ de la fila ${run.r + 1}` : `↓ de la columna ${run.c + 1}`;
      if (dup !== undefined) {
        return { text: `El bloque ${dirTxt} repite el ${dup}`, cells: run.cells };
      }
      const total = nums.reduce((a, b) => a + b, 0);
      if (total !== puzzle.sums[i]) {
        return {
          text: `El bloque ${dirTxt} debe sumar ${puzzle.sums[i]} y suma ${total} (${nums.join("+")})`,
          cells: run.cells,
        };
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
      say("¡Todos los bloques cuadran! +10", "ok");
      return later(nextRound, 900);
    }
    locked = true;
    rounds++;
    streak = 0;
    lives--;
    renderLives();
    selected = -1;
    renderGrid(new Set(err.cells));
    say(`${err.text}. Mira la solución buena.`, "bad");
    later(() => {
      vals = puzzle.solution.slice();
      renderGrid();
      body.querySelectorAll("[data-cell]").forEach((btn) => btn.classList.add("reveal"));
    }, 1600);
    if (lives <= 0) return later(() => finish(false), 3400);
    later(nextRound, 3400);
  }

  function loseRound(reason) {
    locked = true;
    rounds++;
    streak = 0;
    lives--;
    renderLives();
    selected = -1;
    vals = puzzle.solution.slice();
    renderGrid();
    body.querySelectorAll("[data-cell]").forEach((btn) => btn.classList.add("reveal"));
    say(`${reason}: así sumaba cada bloque.`, "bad");
    if (lives <= 0) return later(() => finish(false), 2400);
    later(nextRound, 2400);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "kakuro", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>➕</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} kakuros resueltos</p>
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
