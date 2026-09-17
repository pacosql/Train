// "Mayor que" (futoshiki 4x4): cada fila y cada columna llevan 1, 2, 3 y 4
// sin repetir, y hay que respetar los signos < y > entre casillas vecinas.
// El puzle se genera desde un cuadrado latino al azar y se comprueba por
// FUERZA BRUTA que la solución es única: mientras haya más de una se añade
// una pista (desigualdad o número) y se vuelve a contar. Después se poda lo
// que no hace falta, sin perder nunca la unicidad.
// Al fallar se dice exactamente qué se incumple (la fila que repite, o los
// dos números que no respetan el signo).
import { randInt, shuffle, saveScore } from "./utils.js";

const N = 4;

// `givens` es a la vez cuántos números se dan al empezar y el suelo al que
// se poda: así un nivel fácil nunca acaba con la rejilla medio regalada.
export function fuLevelFor(streak) {
  if (streak >= 6) return { ineq: 5, givens: 0 };
  if (streak >= 4) return { ineq: 6, givens: 1 };
  if (streak >= 2) return { ineq: 6, givens: 2 };
  return { ineq: 7, givens: 3 };
}

// Cuadrado latino 4x4 al azar (backtracking con valores desordenados).
export function fuLatinSquare() {
  const g = new Array(N * N).fill(0);
  function rec(i) {
    if (i === N * N) return true;
    const r = Math.floor(i / N);
    const c = i % N;
    for (const v of shuffle([1, 2, 3, 4])) {
      let ok = true;
      for (let k = 0; k < c; k++) if (g[r * N + k] === v) { ok = false; break; }
      if (ok) for (let k = 0; k < r; k++) if (g[k * N + c] === v) { ok = false; break; }
      if (!ok) continue;
      g[i] = v;
      if (rec(i + 1)) return true;
      g[i] = 0;
    }
    return false;
  }
  rec(0);
  return g;
}

// Cuenta soluciones (hasta `limit`) de un futoshiki dado por pistas.
// `givens`: array de 16 con 0 = vacío. `ineqs`: lista de restricciones.
export function fuCountSolutions(givens, ineqs, limit = 2) {
  // Búsqueda rápida de la restricción que mira al vecino de arriba / izquierda.
  const left = new Array(N * N).fill(null); // compara (r,c-1) con (r,c)
  const up = new Array(N * N).fill(null); // compara (r-1,c) con (r,c)
  for (const q of ineqs) {
    if (q.type === "h") left[q.r * N + q.c + 1] = q.dir;
    else up[(q.r + 1) * N + q.c] = q.dir;
  }
  const g = givens.slice();
  let found = 0;

  function rec(i) {
    if (found >= limit) return;
    if (i === N * N) {
      found++;
      return;
    }
    const r = Math.floor(i / N);
    const c = i % N;
    const fixed = givens[i];
    for (let v = 1; v <= N; v++) {
      if (fixed && v !== fixed) continue;
      let ok = true;
      for (let k = 0; k < c; k++) if (g[r * N + k] === v) { ok = false; break; }
      if (ok) for (let k = 0; k < r; k++) if (g[k * N + c] === v) { ok = false; break; }
      if (!ok) continue;
      if (left[i]) {
        const a = g[i - 1];
        if (left[i] === "<" ? !(a < v) : !(a > v)) continue;
      }
      if (up[i]) {
        const a = g[i - N];
        if (up[i] === "<" ? !(a < v) : !(a > v)) continue;
      }
      g[i] = v;
      rec(i + 1);
      g[i] = 0;
      if (found >= limit) return;
    }
  }

  rec(0);
  return found;
}

// Puzle de reserva, comprobadamente único, por si se agotara la guarda.
const FU_FALLBACK = {
  solution: [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1],
  givens: [1, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1],
  ineqs: [
    { type: "h", r: 0, c: 0, dir: "<" },
    { type: "h", r: 0, c: 1, dir: "<" },
    { type: "h", r: 0, c: 2, dir: "<" },
    { type: "h", r: 3, c: 0, dir: ">" },
    { type: "h", r: 3, c: 1, dir: ">" },
    { type: "h", r: 3, c: 2, dir: ">" },
    { type: "v", r: 0, c: 0, dir: "<" },
    { type: "v", r: 2, c: 0, dir: "<" },
  ],
};

function allPairs() {
  const out = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N - 1; c++) out.push({ type: "h", r, c });
  for (let r = 0; r < N - 1; r++) for (let c = 0; c < N; c++) out.push({ type: "v", r, c });
  return out;
}

function dirFor(sol, p) {
  const a = sol[p.r * N + p.c];
  const b = p.type === "h" ? sol[p.r * N + p.c + 1] : sol[(p.r + 1) * N + p.c];
  return a < b ? "<" : ">";
}

// Genera una ronda con solución ÚNICA garantizada.
// Devuelve { solution, givens, ineqs, unique, attempts, fallback }.
export function fuGenerate(streak, maxAdds = 60) {
  const lv = fuLevelFor(streak);
  const sol = fuLatinSquare();
  const pool = shuffle(allPairs());
  let ineqs = pool.slice(0, lv.ineq).map((p) => ({ ...p, dir: dirFor(sol, p) }));
  let poolNext = lv.ineq;
  const cells = shuffle(Array.from({ length: N * N }, (_, i) => i));
  const givens = new Array(N * N).fill(0);
  for (let i = 0; i < lv.givens; i++) givens[cells[i]] = sol[cells[i]];
  let givenNext = lv.givens;

  // Mientras haya más de una solución, se añade una pista más.
  let adds = 0;
  while (adds < maxAdds && fuCountSolutions(givens, ineqs, 2) > 1) {
    adds++;
    if (poolNext < pool.length) {
      const p = pool[poolNext++];
      ineqs.push({ ...p, dir: dirFor(sol, p) });
    } else if (givenNext < cells.length) {
      const i = cells[givenNext++];
      givens[i] = sol[i];
    } else {
      break;
    }
  }
  if (fuCountSolutions(givens, ineqs, 2) !== 1) {
    return { ...FU_FALLBACK, givens: FU_FALLBACK.givens.slice(), ineqs: FU_FALLBACK.ineqs.map((q) => ({ ...q })), unique: true, attempts: adds, fallback: true };
  }

  // Poda: se quita todo lo que no haga falta (sin perder la unicidad).
  // Los números dados se podan hasta el suelo del nivel.
  for (const i of shuffle(Array.from({ length: N * N }, (_, k) => k))) {
    if (!givens[i]) continue;
    if (givens.filter((v) => v > 0).length <= lv.givens) break;
    const keep = givens[i];
    givens[i] = 0;
    if (fuCountSolutions(givens, ineqs, 2) !== 1) givens[i] = keep;
  }
  for (const q of shuffle(ineqs.slice())) {
    if (ineqs.length <= 3) break; // siempre al menos 3 signos: es el juego
    const rest = ineqs.filter((x) => x !== q);
    if (fuCountSolutions(givens, rest, 2) === 1) ineqs = rest;
  }

  return { solution: sol, givens, ineqs, unique: fuCountSolutions(givens, ineqs, 2) === 1, attempts: adds, fallback: false };
}

export function mountFutoshikiGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let puzzle = null;
  let grid = [];
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
    puzzle = fuGenerate(streak);
    grid = puzzle.givens.slice();
    locked = false;

    // Rejilla 7x7: casillas en las posiciones pares, signos en las impares.
    let cellsHtml = "";
    for (let gr = 0; gr < N * 2 - 1; gr++) {
      for (let gc = 0; gc < N * 2 - 1; gc++) {
        const evenR = gr % 2 === 0;
        const evenC = gc % 2 === 0;
        if (evenR && evenC) {
          const i = (gr / 2) * N + gc / 2;
          cellsHtml += `<button type="button" class="fu-cell" data-cell="${i}"></button>`;
        } else if (evenR && !evenC) {
          cellsHtml += `<span class="fu-sign fu-h" data-h="${(gr / 2) * N + (gc - 1) / 2}"></span>`;
        } else if (!evenR && evenC) {
          cellsHtml += `<span class="fu-sign fu-v" data-v="${((gr - 1) / 2) * N + gc / 2}"></span>`;
        } else {
          cellsHtml += `<span class="fu-gap"></span>`;
        }
      }
    }

    body.innerHTML = `
      <p class="prompt">1, 2, 3 y 4 en cada fila y columna<small>Respeta los signos: la boca abierta mira al número mayor</small></p>
      <div class="fu-grid" data-grid>${cellsHtml}</div>
      <div class="fu-tools">
        <button class="secondary fu-tool" data-clear>↺ Borrar</button>
        <button class="secondary fu-tool" data-give>🔎 Solución (−1 vida)</button>
      </div>
      <div class="feedback" data-feedback></div>
    `;

    for (const q of puzzle.ineqs) {
      const key = q.type === "h" ? `[data-h="${q.r * N + q.c}"]` : `[data-v="${q.r * N + q.c}"]`;
      const el = body.querySelector(key);
      if (el) {
        el.textContent = q.dir;
        el.classList.add("on");
      }
    }
    body.querySelectorAll("[data-cell]").forEach((btn) => {
      const i = Number(btn.dataset.cell);
      btn.addEventListener("click", () => cycle(i));
    });
    body.querySelector("[data-clear]").addEventListener("click", () => {
      if (finished || locked) return;
      grid = puzzle.givens.slice();
      renderGrid();
      say("", "");
    });
    body.querySelector("[data-give]").addEventListener("click", () => {
      if (finished || locked) return;
      loseRound("Solución al descubierto");
    });
    renderGrid();
    say("Toca una casilla para cambiar su número", "");
  }

  function renderGrid(badSet) {
    body.querySelectorAll("[data-cell]").forEach((btn) => {
      const i = Number(btn.dataset.cell);
      btn.textContent = grid[i] ? String(grid[i]) : "";
      btn.className = "fu-cell";
      if (puzzle.givens[i]) btn.classList.add("given");
      if (badSet && badSet.has(i)) btn.classList.add("bad");
    });
  }

  function cycle(i) {
    if (finished || locked) return;
    if (puzzle.givens[i]) return say("Ese número viene de regalo: no se toca", "");
    grid[i] = (grid[i] + 1) % (N + 1);
    renderGrid();
    if (grid.every((v) => v > 0)) check();
    else say("", "");
  }

  // Busca el primer incumplimiento y lo explica con nombres y números.
  function firstError() {
    for (let r = 0; r < N; r++) {
      for (let a = 0; a < N; a++) {
        for (let b = a + 1; b < N; b++) {
          if (grid[r * N + a] === grid[r * N + b]) {
            return { text: `La fila ${r + 1} repite el ${grid[r * N + a]}`, cells: [r * N + a, r * N + b] };
          }
        }
      }
    }
    for (let c = 0; c < N; c++) {
      for (let a = 0; a < N; a++) {
        for (let b = a + 1; b < N; b++) {
          if (grid[a * N + c] === grid[b * N + c]) {
            return { text: `La columna ${c + 1} repite el ${grid[a * N + c]}`, cells: [a * N + c, b * N + c] };
          }
        }
      }
    }
    for (const q of puzzle.ineqs) {
      const ia = q.r * N + q.c;
      const ib = q.type === "h" ? q.r * N + q.c + 1 : (q.r + 1) * N + q.c;
      const a = grid[ia];
      const b = grid[ib];
      const ok = q.dir === "<" ? a < b : a > b;
      if (!ok) {
        const where = q.type === "h" ? "el signo de esa fila" : "el signo de esa columna";
        return { text: `${a} ${q.dir} ${b} es falso: ${where} pide lo contrario`, cells: [ia, ib] };
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
      say("¡Todo cuadra! +10", "ok");
      return later(nextRound, 900);
    }
    locked = true;
    rounds++;
    streak = 0;
    lives--;
    renderLives();
    renderGrid(new Set(err.cells));
    say(`${err.text}. Mira la solución buena.`, "bad");
    later(() => {
      grid = puzzle.solution.slice();
      renderGrid();
      body.querySelectorAll("[data-cell]").forEach((btn) => btn.classList.add("reveal"));
    }, 1300);
    if (lives <= 0) return later(() => finish(false), 3000);
    later(nextRound, 3000);
  }

  function loseRound(reason) {
    locked = true;
    rounds++;
    streak = 0;
    lives--;
    renderLives();
    grid = puzzle.solution.slice();
    renderGrid();
    body.querySelectorAll("[data-cell]").forEach((btn) => btn.classList.add("reveal"));
    say(`${reason}: así se cumplían todos los signos.`, "bad");
    if (lives <= 0) return later(() => finish(false), 2400);
    later(nextRound, 2400);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "futoshiki", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚖️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} rejillas resueltas</p>
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
