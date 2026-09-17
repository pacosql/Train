// "Pentominós": encajar 4-6 piezas poliominó en un rectángulo sin huecos ni
// solapes. El puzle se genera AL REVÉS (se trocea un rectángulo real en
// piezas conexas), así la solución existe SIEMPRE, y además se cuenta por
// fuerza bruta cuántos teselados admite el juego de piezas: solo se acepta
// la ronda si hay exactamente uno, para que no haya ambigüedad.
// Al fallar se señala el hueco que ya no puede rellenarse (es la idea de
// área y divisibilidad, no un castigo a ciegas).
import { randInt, shuffle, saveScore } from "./utils.js";

// Niveles: rectángulo + cuántas piezas y de qué tamaño (área = count * size).
export const PT_LEVELS = [
  { cols: 4, rows: 4, count: 4, size: 4 },
  { cols: 4, rows: 5, count: 5, size: 4 },
  { cols: 5, rows: 5, count: 5, size: 5 },
  { cols: 5, rows: 6, count: 6, size: 5 },
];

export function ptLevelFor(streak) {
  if (streak >= 6) return PT_LEVELS[3];
  if (streak >= 4) return PT_LEVELS[2];
  if (streak >= 2) return PT_LEVELS[1];
  return PT_LEVELS[0];
}

function at(cols, r, c) {
  return r * cols + c;
}

// ---------- geometría de piezas ----------
export function ptNormalize(cells) {
  let minR = Infinity;
  let minC = Infinity;
  for (const [r, c] of cells) {
    if (r < minR) minR = r;
    if (c < minC) minC = c;
  }
  return cells
    .map(([r, c]) => [r - minR, c - minC])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

// Giro de 90º a la derecha.
export function ptRotate(cells) {
  let maxR = 0;
  for (const [r] of cells) if (r > maxR) maxR = r;
  return ptNormalize(cells.map(([r, c]) => [c, maxR - r]));
}

export function ptKey(cells) {
  return cells.map((c) => c.join(",")).join(" ");
}

export function ptRotations(cells) {
  const out = [];
  const seen = new Set();
  let cur = ptNormalize(cells);
  for (let i = 0; i < 4; i++) {
    const k = ptKey(cur);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(cur);
    }
    cur = ptRotate(cur);
  }
  return out;
}

function freeNeighbors(grid, cols, rows, i) {
  const r = Math.floor(i / cols);
  const c = i % cols;
  const out = [];
  if (r > 0 && grid[at(cols, r - 1, c)] === -1) out.push(at(cols, r - 1, c));
  if (r < rows - 1 && grid[at(cols, r + 1, c)] === -1) out.push(at(cols, r + 1, c));
  if (c > 0 && grid[at(cols, r, c - 1)] === -1) out.push(at(cols, r, c - 1));
  if (c < cols - 1 && grid[at(cols, r, c + 1)] === -1) out.push(at(cols, r, c + 1));
  return out;
}

// Trocea el rectángulo en `count` piezas conexas de `size` celdas.
// Devuelve un array celda -> índice de pieza, o null si el crecimiento
// aleatorio se atascó (entonces el llamante reintenta).
export function ptChop(cols, rows, count, size) {
  const grid = new Array(cols * rows).fill(-1);
  for (let p = 0; p < count; p++) {
    const empties = [];
    for (let i = 0; i < grid.length; i++) if (grid[i] === -1) empties.push(i);
    if (empties.length < size) return null;
    // Se empieza por la celda vacía más "encerrada": así no quedan huecos
    // sueltos de 1 o 2 celdas imposibles de cubrir.
    let start = -1;
    let bestN = 99;
    for (const i of shuffle(empties)) {
      const n = freeNeighbors(grid, cols, rows, i).length;
      if (n < bestN) {
        bestN = n;
        start = i;
      }
    }
    grid[start] = p;
    let placed = 1;
    const frontier = freeNeighbors(grid, cols, rows, start);
    while (placed < size) {
      // Se limpia la frontera de celdas ya ocupadas.
      let pickIdx = -1;
      while (frontier.length) {
        const j = randInt(0, frontier.length - 1);
        const cell = frontier[j];
        frontier.splice(j, 1);
        if (grid[cell] === -1) {
          pickIdx = cell;
          break;
        }
      }
      if (pickIdx === -1) return null;
      grid[pickIdx] = p;
      placed++;
      for (const n of freeNeighbors(grid, cols, rows, pickIdx)) frontier.push(n);
    }
  }
  for (const v of grid) if (v === -1) return null;
  return grid;
}

// Cuenta teselados del hueco libre con las piezas dadas (hasta `limit`).
// `covered` es un array de booleanos por celda; `shapes` las piezas que
// quedan (se prueban todos sus giros). Piezas de la misma forma se tratan
// como una sola en cada nodo, así el recuento mide ambigüedad real.
export function ptCountCovers(cols, rows, covered, shapes, limit = 2) {
  const occ = covered.slice();
  const rots = shapes.map((s) => ptRotations(s));
  const keys = shapes.map((s) => ptKey(ptNormalize(s)));
  const used = new Array(shapes.length).fill(false);
  let found = 0;

  function firstFree() {
    for (let i = 0; i < occ.length; i++) if (!occ[i]) return i;
    return -1;
  }

  function rec(left) {
    if (found >= limit) return;
    const f = firstFree();
    if (f === -1) {
      if (left === 0) found++;
      return;
    }
    if (left === 0) return;
    const fr = Math.floor(f / cols);
    const fc = f % cols;
    const tried = new Set();
    for (let p = 0; p < shapes.length; p++) {
      if (used[p] || tried.has(keys[p])) continue;
      tried.add(keys[p]);
      for (const rot of rots[p]) {
        for (const [ar, ac] of rot) {
          const dr = fr - ar;
          const dc = fc - ac;
          let ok = true;
          for (const [r, c] of rot) {
            const rr = r + dr;
            const cc = c + dc;
            if (rr < 0 || rr >= rows || cc < 0 || cc >= cols || occ[at(cols, rr, cc)]) {
              ok = false;
              break;
            }
          }
          if (!ok) continue;
          for (const [r, c] of rot) occ[at(cols, r + dr, c + dc)] = true;
          used[p] = true;
          rec(left - 1);
          used[p] = false;
          for (const [r, c] of rot) occ[at(cols, r + dr, c + dc)] = false;
          if (found >= limit) return;
        }
      }
    }
  }

  rec(shapes.length);
  return found;
}

// Puzle de reserva (troceado real de un 4x4 en cuatro tetrominós) por si
// el generador aleatorio agotara la guarda: nunca se devuelve nada roto.
const PT_FALLBACK = {
  cols: 4,
  rows: 4,
  size: 4,
  solution: [0, 0, 1, 1, 0, 2, 2, 1, 0, 2, 3, 1, 2, 3, 3, 3],
};

function piecesFromGrid(grid, cols, count) {
  const cells = [];
  for (let p = 0; p < count; p++) cells.push([]);
  for (let i = 0; i < grid.length; i++) {
    cells[grid[i]].push([Math.floor(i / cols), i % cols]);
  }
  return cells.map((cs) => ptNormalize(cs));
}

// Genera una ronda válida: troceado real + teselado ÚNICO + variedad de
// formas. Devuelve { cols, rows, size, shapes, solution, attempts, fallback }.
export function ptGenerate(streak, maxTries = 400) {
  const lv = ptLevelFor(streak);
  let attempts = 0;
  let relaxed = null;
  while (attempts < maxTries) {
    attempts++;
    const grid = ptChop(lv.cols, lv.rows, lv.count, lv.size);
    if (!grid) continue;
    const shapes = piecesFromGrid(grid, lv.cols, lv.count);
    if (shapes.some((s) => s.length !== lv.size)) continue;
    // Al menos 3 formas distintas (salvo rotación) para que no sea trivial.
    const distinct = new Set();
    for (const s of shapes) {
      const rs = ptRotations(s).map(ptKey).sort();
      distinct.add(rs[0]);
    }
    if (distinct.size < 3) continue;
    const empty = new Array(lv.cols * lv.rows).fill(false);
    const covers = ptCountCovers(lv.cols, lv.rows, empty, shapes, 2);
    if (covers === 1) {
      return { cols: lv.cols, rows: lv.rows, size: lv.size, shapes, solution: grid, attempts, fallback: false };
    }
    if (covers >= 1 && !relaxed) {
      relaxed = { cols: lv.cols, rows: lv.rows, size: lv.size, shapes, solution: grid, attempts, fallback: false };
    }
  }
  // Guarda agotada: primero un troceado válido aunque admita más de un
  // teselado (sigue siendo resoluble y cualquier relleno completo vale),
  // y como último recurso el puzle fijo.
  if (relaxed) return { ...relaxed, attempts, fallback: false };
  const shapes = piecesFromGrid(PT_FALLBACK.solution, PT_FALLBACK.cols, 4);
  return { ...PT_FALLBACK, shapes, attempts, fallback: true };
}

export function mountPentominosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let strikes = 0;
  let puzzle = null;
  let pieces = [];
  let owner = [];
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
  function feedbackEl() {
    return body.querySelector("[data-feedback]");
  }
  function say(text, cls) {
    const el = feedbackEl();
    if (!el) return;
    el.textContent = text;
    el.className = `feedback${cls ? ` ${cls}` : ""}`;
  }

  function nextRound() {
    puzzle = ptGenerate(streak);
    owner = new Array(puzzle.cols * puzzle.rows).fill(-1);
    pieces = puzzle.shapes.map((shape, id) => ({
      id,
      shape,
      rots: ptRotations(shape),
      rotIdx: 0,
      placed: null,
    }));
    selected = -1;
    strikes = 0;
    locked = false;

    body.innerHTML = `
      <p class="prompt">Rellena el rectángulo<small>${puzzle.shapes.length} piezas de ${puzzle.size} casillas: ni huecos ni piezas encima de otras</small></p>
      <div class="pt-board" data-board style="--pt-cols:${puzzle.cols};--pt-rows:${puzzle.rows}"></div>
      <div class="pt-tools">
        <button class="secondary pt-rot" data-rot>🔄 Girar</button>
        <button class="secondary pt-give" data-give>🔎 Ver solución (−1 vida)</button>
      </div>
      <div class="pt-tray" data-tray></div>
      <div class="feedback" data-feedback></div>
    `;
    const board = body.querySelector("[data-board]");
    for (let r = 0; r < puzzle.rows; r++) {
      for (let c = 0; c < puzzle.cols; c++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "pt-cell";
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);
        cell.addEventListener("click", () => tapCell(r, c));
        board.appendChild(cell);
      }
    }
    body.querySelector("[data-rot]").addEventListener("click", rotateSelected);
    body.querySelector("[data-give]").addEventListener("click", () => {
      if (finished || locked) return;
      loseRound("Solución al descubierto: mira cómo encajan las piezas");
    });
    renderTray();
    renderBoard();
    say("Toca una pieza y luego el tablero", "");
  }

  function renderTray() {
    const tray = body.querySelector("[data-tray]");
    tray.innerHTML = "";
    pieces.forEach((p) => {
      if (p.placed) return;
      const rot = p.rots[p.rotIdx];
      let w = 0;
      let h = 0;
      for (const [r, c] of rot) {
        if (r + 1 > h) h = r + 1;
        if (c + 1 > w) w = c + 1;
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `pt-piece pt-c${p.id}${selected === p.id ? " sel" : ""}`;
      btn.style.setProperty("--pw", String(w));
      btn.style.setProperty("--ph", String(h));
      const set = new Set(rot.map((x) => x.join(",")));
      let html = "";
      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          const on = set.has(`${r},${c}`);
          const anchor = rot[0][0] === r && rot[0][1] === c;
          html += `<i class="${on ? "on" : ""}${anchor ? " anchor" : ""}"></i>`;
        }
      }
      btn.innerHTML = html;
      btn.addEventListener("click", () => {
        if (finished || locked) return;
        selected = selected === p.id ? -1 : p.id;
        renderTray();
        say(selected === -1 ? "" : "Ahora toca el tablero (el punto marca dónde cae)", "");
      });
      tray.appendChild(btn);
    });
    if (!tray.children.length) tray.innerHTML = `<span class="pt-tray-empty">¡No quedan piezas!</span>`;
  }

  function renderBoard(orphan) {
    const board = body.querySelector("[data-board]");
    if (!board) return;
    Array.from(board.children).forEach((cell) => {
      const r = Number(cell.dataset.r);
      const c = Number(cell.dataset.c);
      const o = owner[at(puzzle.cols, r, c)];
      cell.className = "pt-cell" + (o >= 0 ? ` full pt-c${o}` : "");
      if (orphan && orphan.has(at(puzzle.cols, r, c))) cell.classList.add("orphan");
    });
  }

  function rotateSelected() {
    if (finished || locked) return;
    if (selected === -1) return say("Elige primero una pieza de abajo", "bad");
    const p = pieces[selected];
    p.rotIdx = (p.rotIdx + 1) % p.rots.length;
    renderTray();
    if (p.rots.length === 1) say("Esta pieza es igual girada (tiene simetría)", "");
  }

  // Todas las colocaciones válidas de la pieza (en su giro actual) que
  // cubren la celda tocada.
  function placementsCovering(p, r, c) {
    const rot = p.rots[p.rotIdx];
    const out = [];
    for (const [ar, ac] of rot) {
      const dr = r - ar;
      const dc = c - ac;
      let outside = false;
      let overlap = false;
      for (const [rr, cc] of rot) {
        const br = rr + dr;
        const bc = cc + dc;
        if (br < 0 || br >= puzzle.rows || bc < 0 || bc >= puzzle.cols) {
          outside = true;
          break;
        }
        if (owner[at(puzzle.cols, br, bc)] !== -1) overlap = true;
      }
      if (outside || overlap) continue;
      out.push({ dr, dc, anchor: ar === rot[0][0] && ac === rot[0][1] });
    }
    return out;
  }

  function tapCell(r, c) {
    if (finished || locked) return;
    const o = owner[at(puzzle.cols, r, c)];
    if (o !== -1) {
      // Tocar una pieza colocada la devuelve a la bandeja.
      const p = pieces[o];
      for (const [rr, cc] of p.rots[p.placed.rotIdx]) {
        owner[at(puzzle.cols, rr + p.placed.dr, cc + p.placed.dc)] = -1;
      }
      p.rotIdx = p.placed.rotIdx;
      p.placed = null;
      selected = p.id;
      renderTray();
      renderBoard();
      return say("Pieza retirada", "");
    }
    if (selected === -1) return say("Elige primero una pieza de abajo", "bad");
    const p = pieces[selected];
    const opts = placementsCovering(p, r, c);
    if (!opts.length) {
      return say("Ahí no cabe: se saldría del rectángulo o pisaría otra pieza", "bad");
    }
    const chosen = opts.find((o2) => o2.anchor) || opts[0];
    for (const [rr, cc] of p.rots[p.rotIdx]) {
      owner[at(puzzle.cols, rr + chosen.dr, cc + chosen.dc)] = p.id;
    }
    p.placed = { dr: chosen.dr, dc: chosen.dc, rotIdx: p.rotIdx };
    selected = -1;
    renderTray();
    renderBoard();

    const left = pieces.filter((x) => !x.placed);
    if (!left.length) return win();

    // ¿Se puede aún rellenar el resto con lo que queda? Si no, es un error
    // de razonamiento (área/encaje) y hay que explicarlo.
    const covered = owner.map((v) => v !== -1);
    const can = ptCountCovers(puzzle.cols, puzzle.rows, covered, left.map((x) => x.shape), 1);
    if (can === 0) return deadEnd(p);
    say(`Bien, quedan ${left.length} pieza${left.length === 1 ? "" : "s"}`, "ok");
  }

  // Componentes conexas de huecos: sirve para señalar el hueco culpable.
  function freeComponents() {
    const seen = new Array(owner.length).fill(false);
    const comps = [];
    for (let i = 0; i < owner.length; i++) {
      if (owner[i] !== -1 || seen[i]) continue;
      const stack = [i];
      const comp = [];
      seen[i] = true;
      while (stack.length) {
        const cur = stack.pop();
        comp.push(cur);
        const r = Math.floor(cur / puzzle.cols);
        const c = cur % puzzle.cols;
        const nb = [];
        if (r > 0) nb.push(at(puzzle.cols, r - 1, c));
        if (r < puzzle.rows - 1) nb.push(at(puzzle.cols, r + 1, c));
        if (c > 0) nb.push(at(puzzle.cols, r, c - 1));
        if (c < puzzle.cols - 1) nb.push(at(puzzle.cols, r, c + 1));
        for (const n of nb) {
          if (!seen[n] && owner[n] === -1) {
            seen[n] = true;
            stack.push(n);
          }
        }
      }
      comps.push(comp);
    }
    return comps;
  }

  function deadEnd(p) {
    const comps = freeComponents();
    let guilty = comps.find((c) => c.length % puzzle.size !== 0);
    let reason;
    if (guilty) {
      reason = `Ese hueco tiene ${guilty.length} casillas y tus piezas son de ${puzzle.size}: no hay manera`;
    } else {
      guilty = comps.slice().sort((a, b) => a.length - b.length)[0] || [];
      reason = "Con esa pieza ahí, el resto del tablero ya no se puede rellenar";
    }
    const orphan = new Set(guilty);
    strikes++;
    if (strikes >= 3) {
      renderBoard(orphan);
      return loseRound(reason);
    }
    renderBoard(orphan);
    say(`${reason} (fallo ${strikes} de 3)`, "bad");
    locked = true;
    later(() => {
      for (const [rr, cc] of p.rots[p.placed.rotIdx]) {
        owner[at(puzzle.cols, rr + p.placed.dr, cc + p.placed.dc)] = -1;
      }
      p.rotIdx = p.placed.rotIdx;
      p.placed = null;
      locked = false;
      renderTray();
      renderBoard();
      say("Te he devuelto la pieza: prueba otro encaje", "");
    }, 1500);
  }

  function showSolution() {
    const board = body.querySelector("[data-board]");
    if (!board) return;
    Array.from(board.children).forEach((cell) => {
      const r = Number(cell.dataset.r);
      const c = Number(cell.dataset.c);
      const p = puzzle.solution[at(puzzle.cols, r, c)];
      cell.className = `pt-cell full pt-c${p} reveal`;
    });
  }

  function win() {
    locked = true;
    rounds++;
    streak++;
    score += 10;
    renderScore();
    say("¡Encajado sin huecos! +10", "ok");
    later(nextRound, 900);
  }

  function loseRound(reason) {
    locked = true;
    rounds++;
    streak = 0;
    lives--;
    renderLives();
    showSolution();
    say(`${reason}. Así era la solución.`, "bad");
    if (lives <= 0) return later(() => finish(false), 2400);
    later(nextRound, 2400);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "pentominos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧩</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} rectángulos trabajados</p>
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
