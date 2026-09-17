// "Shikaku": partir la cuadrícula en rectángulos de modo que cada uno
// contenga exactamente un número y ese número sea su área. Se dibuja
// arrastrando el dedo, y mientras se arrastra se lee "3 × 2 = 6": la
// multiplicación ES el gesto, no una cuenta aparte.
// El puzle se genera AL REVÉS (se trocea la cuadrícula en rectángulos reales
// y se pone el área en una casilla de cada uno) y se comprueba por FUERZA
// BRUTA que la partición es ÚNICA; si no, se recoloca los números o se
// vuelve a trocear.
// Al fallar se dice qué número se ha quedado sin sitio.
import { randInt, saveScore } from "./utils.js";

// `minRects`/`maxRects` mantienen la ronda por debajo del minuto: son los
// rectángulos que habrá que dibujar con el dedo.
export function skLevelFor(streak) {
  if (streak >= 6) return { n: 6, maxArea: 12, minRects: 5, maxRects: 8 };
  if (streak >= 4) return { n: 6, maxArea: 8, minRects: 5, maxRects: 8 };
  if (streak >= 2) return { n: 5, maxArea: 9, minRects: 4, maxRects: 7 };
  return { n: 5, maxArea: 6, minRects: 4, maxRects: 7 };
}

// Trocea la cuadrícula en rectángulos. Se empieza siempre por la casilla
// libre de arriba-izquierda, así el troceado cubre todo sin dejar huecos.
export function skChop(n, maxArea) {
  const owner = new Array(n * n).fill(-1);
  const rects = [];
  for (let i = 0; i < n * n; i++) {
    if (owner[i] !== -1) continue;
    const r = Math.floor(i / n);
    const c = i % n;
    const opts = [];
    let limW = n - c;
    for (let h = 1; r + h <= n; h++) {
      let free = 0;
      while (c + free < n && owner[(r + h - 1) * n + c + free] === -1) free++;
      limW = Math.min(limW, free);
      if (limW === 0) break;
      for (let w = 1; w <= limW; w++) {
        const area = w * h;
        if (area > maxArea) continue;
        opts.push({ w, h, area });
      }
    }
    if (!opts.length) return null;
    // Se prefieren rectángulos de área >= 2 (los 1x1 regalan la respuesta) y,
    // entre ellos, los grandes: así salen pocas piezas y la ronda es corta.
    const good = opts.filter((o) => o.area >= 2);
    const pool = good.length ? good : opts;
    let total = 0;
    for (const o of pool) total += o.area * o.area;
    let dart = randInt(1, total);
    let chosen = pool[pool.length - 1];
    for (const o of pool) {
      dart -= o.area * o.area;
      if (dart <= 0) {
        chosen = o;
        break;
      }
    }
    const id = rects.length;
    for (let dr = 0; dr < chosen.h; dr++) {
      for (let dc = 0; dc < chosen.w; dc++) owner[(r + dr) * n + c + dc] = id;
    }
    rects.push({ r0: r, c0: c, r1: r + chosen.h - 1, c1: c + chosen.w - 1, area: chosen.area });
  }
  return { owner, rects };
}

// Cuenta particiones válidas (hasta `limit`). `covered` marca lo ya resuelto.
// Clave: la casilla libre de arriba-izquierda es forzosamente la esquina
// superior izquierda de su rectángulo, así que solo hay que probar anchos y
// altos desde ahí.
export function skCountSolutions(n, clues, covered, limit = 2) {
  // Sumas acumuladas para contar números dentro de un rectángulo en O(1).
  const pc = new Array((n + 1) * (n + 1)).fill(0);
  const pv = new Array((n + 1) * (n + 1)).fill(0);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const v = clues[r * n + c];
      pc[(r + 1) * (n + 1) + c + 1] = pc[r * (n + 1) + c + 1] + pc[(r + 1) * (n + 1) + c] - pc[r * (n + 1) + c] + (v ? 1 : 0);
      pv[(r + 1) * (n + 1) + c + 1] = pv[r * (n + 1) + c + 1] + pv[(r + 1) * (n + 1) + c] - pv[r * (n + 1) + c] + v;
    }
  }
  function box(p, r0, c0, r1, c1) {
    return p[(r1 + 1) * (n + 1) + c1 + 1] - p[r0 * (n + 1) + c1 + 1] - p[(r1 + 1) * (n + 1) + c0] + p[r0 * (n + 1) + c0];
  }
  const occ = covered.slice();
  let found = 0;

  function rec() {
    if (found >= limit) return;
    let f = -1;
    for (let i = 0; i < occ.length; i++) if (!occ[i]) { f = i; break; }
    if (f === -1) {
      found++;
      return;
    }
    const r = Math.floor(f / n);
    const c = f % n;
    let limW = n - c;
    for (let h = 1; r + h <= n; h++) {
      let free = 0;
      while (c + free < n && !occ[(r + h - 1) * n + c + free]) free++;
      limW = Math.min(limW, free);
      if (limW === 0) break;
      for (let w = 1; w <= limW; w++) {
        const area = w * h;
        const r1 = r + h - 1;
        const c1 = c + w - 1;
        if (box(pc, r, c, r1, c1) !== 1) continue;
        if (box(pv, r, c, r1, c1) !== area) continue;
        for (let dr = r; dr <= r1; dr++) for (let dc = c; dc <= c1; dc++) occ[dr * n + dc] = true;
        rec();
        for (let dr = r; dr <= r1; dr++) for (let dc = c; dc <= c1; dc++) occ[dr * n + dc] = false;
        if (found >= limit) return;
      }
    }
  }

  rec();
  return found;
}

// Puzle de reserva: troceado real de un 5x5 con partición única comprobada
// (5 filas de 1x5 no valdría, así que se usa un reparto mixto).
const SK_FALLBACK = {
  n: 5,
  rects: [
    { r0: 0, c0: 0, r1: 1, c1: 1, area: 4 },
    { r0: 0, c0: 2, r1: 0, c1: 4, area: 3 },
    { r0: 1, c0: 2, r1: 2, c1: 3, area: 4 },
    { r0: 1, c0: 4, r1: 3, c1: 4, area: 3 },
    { r0: 2, c0: 0, r1: 4, c1: 1, area: 6 },
    { r0: 3, c0: 2, r1: 4, c1: 3, area: 4 },
    { r0: 4, c0: 4, r1: 4, c1: 4, area: 1 },
  ],
};

function placeClues(n, rects) {
  const clues = new Array(n * n).fill(0);
  for (const rc of rects) {
    const cells = [];
    for (let r = rc.r0; r <= rc.r1; r++) for (let c = rc.c0; c <= rc.c1; c++) cells.push(r * n + c);
    clues[cells[randInt(0, cells.length - 1)]] = rc.area;
  }
  return clues;
}

// Genera una ronda con partición ÚNICA.
// Devuelve { n, rects, clues, unique, attempts, fallback }.
export function skGenerate(streak, maxTries = 120) {
  const lv = skLevelFor(streak);
  const n = lv.n;
  const empty = new Array(n * n).fill(false);
  let attempts = 0;
  while (attempts < maxTries) {
    attempts++;
    const chop = skChop(n, lv.maxArea);
    if (!chop) continue;
    // Nada de troceados degenerados: número de rectángulos dentro del rango
    // del nivel y como mucho un 1x1 (si no, el puzle se resuelve mirando).
    if (chop.rects.length < lv.minRects || chop.rects.length > lv.maxRects) continue;
    if (chop.rects.filter((r) => r.area === 1).length > 1) continue;
    // Con el mismo troceado se prueban varias colocaciones del número.
    for (let k = 0; k < 10; k++) {
      const clues = placeClues(n, chop.rects);
      if (skCountSolutions(n, clues, empty, 2) === 1) {
        return { n, rects: chop.rects, clues, unique: true, attempts, fallback: false };
      }
    }
  }
  const clues = placeClues(n, SK_FALLBACK.rects);
  // El reparto de reserva se comprueba igual; si la colocación al azar no
  // fuera única se recoloca hasta que lo sea, y en último caso se ponen los
  // números en la esquina de cada rectángulo (partición única garantizada).
  const empty5 = new Array(25).fill(false);
  for (let k = 0; k < 60; k++) {
    const c2 = placeClues(5, SK_FALLBACK.rects);
    if (skCountSolutions(5, c2, empty5, 2) === 1) {
      return { n: 5, rects: SK_FALLBACK.rects, clues: c2, unique: true, attempts, fallback: true };
    }
  }
  return { n: 5, rects: SK_FALLBACK.rects, clues, unique: false, attempts, fallback: true };
}

export function mountShikakuGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let strikes = 0;
  let puzzle = null;
  let owner = [];
  let placed = [];
  let dragStart = null;
  let dragNow = null;
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
  function live(text) {
    const el = body.querySelector("[data-live]");
    if (el) el.textContent = text;
  }

  function nextRound() {
    puzzle = skGenerate(streak);
    const n = puzzle.n;
    owner = new Array(n * n).fill(-1);
    placed = [];
    strikes = 0;
    dragStart = null;
    dragNow = null;
    locked = false;

    let html = "";
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const v = puzzle.clues[r * n + c];
        html += `<div class="sk-cell" data-i="${r * n + c}">${v ? `<b>${v}</b>` : ""}</div>`;
      }
    }

    body.innerHTML = `
      <p class="prompt">Un rectángulo por número<small>Arrastra el dedo: el número dice cuántas casillas tiene su rectángulo</small></p>
      <div class="sk-grid" data-grid style="--sk-n:${n}">${html}</div>
      <div class="sk-live" data-live>&nbsp;</div>
      <div class="sk-tools">
        <button class="secondary sk-tool" data-clear>↺ Empezar de nuevo</button>
        <button class="secondary sk-tool" data-give>🔎 Solución (−1 vida)</button>
      </div>
      <div class="feedback" data-feedback></div>
    `;

    bindDrag();
    body.querySelector("[data-clear]").addEventListener("click", () => {
      if (finished || locked) return;
      owner = new Array(n * n).fill(-1);
      placed = [];
      renderGrid();
      say("", "");
      live(" ");
    });
    body.querySelector("[data-give]").addEventListener("click", () => {
      if (finished || locked) return;
      loseRound("Solución al descubierto");
    });
    renderGrid();
    say("Arrastra para dibujar el primer rectángulo", "");
  }

  function cellFrom(clientX, clientY) {
    const grid = body.querySelector("[data-grid]");
    const rect = grid.getBoundingClientRect();
    const n = puzzle.n;
    let c = Math.floor(((clientX - rect.left) / rect.width) * n);
    let r = Math.floor(((clientY - rect.top) / rect.height) * n);
    c = Math.max(0, Math.min(n - 1, c));
    r = Math.max(0, Math.min(n - 1, r));
    return { r, c };
  }

  function bindDrag() {
    const grid = body.querySelector("[data-grid]");
    grid.addEventListener("pointerdown", (e) => {
      if (finished || locked) return;
      e.preventDefault();
      dragStart = cellFrom(e.clientX, e.clientY);
      dragNow = dragStart;
      grid.setPointerCapture(e.pointerId);
      renderGrid();
      showLive();
    });
    grid.addEventListener("pointermove", (e) => {
      if (!dragStart || finished || locked) return;
      const cell = cellFrom(e.clientX, e.clientY);
      if (cell.r === dragNow.r && cell.c === dragNow.c) return;
      dragNow = cell;
      renderGrid();
      showLive();
    });
    grid.addEventListener("pointerup", () => {
      if (!dragStart || finished || locked) return;
      const a = dragStart;
      const b = dragNow;
      dragStart = null;
      dragNow = null;
      commit(a, b);
    });
    grid.addEventListener("pointercancel", () => {
      dragStart = null;
      dragNow = null;
      renderGrid();
      live(" ");
    });
  }

  function box(a, b) {
    return {
      r0: Math.min(a.r, b.r),
      c0: Math.min(a.c, b.c),
      r1: Math.max(a.r, b.r),
      c1: Math.max(a.c, b.c),
    };
  }

  function showLive() {
    const bx = box(dragStart, dragNow);
    const w = bx.c1 - bx.c0 + 1;
    const h = bx.r1 - bx.r0 + 1;
    live(`${w} × ${h} = ${w * h}`);
  }

  function cluesIn(bx) {
    const out = [];
    for (let r = bx.r0; r <= bx.r1; r++) {
      for (let c = bx.c0; c <= bx.c1; c++) {
        const v = puzzle.clues[r * puzzle.n + c];
        if (v) out.push({ v, i: r * puzzle.n + c });
      }
    }
    return out;
  }

  function commit(a, b) {
    const n = puzzle.n;
    const bx = box(a, b);
    const w = bx.c1 - bx.c0 + 1;
    const h = bx.r1 - bx.r0 + 1;
    const area = w * h;

    // Un toque sobre un rectángulo ya hecho lo borra.
    if (area === 1 && owner[bx.r0 * n + bx.c0] !== -1) {
      const id = owner[bx.r0 * n + bx.c0];
      for (let i = 0; i < owner.length; i++) if (owner[i] === id) owner[i] = -1;
      placed[id] = null;
      renderGrid();
      live(" ");
      return say("Rectángulo borrado", "");
    }

    for (let r = bx.r0; r <= bx.r1; r++) {
      for (let c = bx.c0; c <= bx.c1; c++) {
        if (owner[r * n + c] !== -1) {
          renderGrid();
          live(" ");
          return say("Se pisa con otro rectángulo ya dibujado", "bad");
        }
      }
    }
    const inside = cluesIn(bx);
    if (inside.length === 0) {
      renderGrid();
      live(" ");
      return say("Ese rectángulo no lleva ningún número dentro", "bad");
    }
    if (inside.length > 1) {
      renderGrid();
      live(" ");
      return say(`Ahí caben ${inside.length} números (${inside.map((x) => x.v).join(" y ")}) y solo puede llevar uno`, "bad");
    }
    if (inside[0].v !== area) {
      renderGrid();
      live(" ");
      return say(`Has dibujado ${w} × ${h} = ${area}, pero ese número es ${inside[0].v}`, "bad");
    }

    const id = placed.length;
    placed.push({ ...bx, area, clue: inside[0].i });
    for (let r = bx.r0; r <= bx.r1; r++) {
      for (let c = bx.c0; c <= bx.c1; c++) owner[r * n + c] = id;
    }
    renderGrid();
    live(" ");

    if (owner.every((v) => v !== -1)) return win();

    // ¿Sigue habiendo reparto posible para el resto? Si no, el error está
    // en el rectángulo que se acaba de dibujar.
    const covered = owner.map((v) => v !== -1);
    if (skCountSolutions(n, puzzle.clues, covered, 1) === 0) return deadEnd(id);
    const left = puzzle.clues.filter((v, i) => v && owner[i] === -1).length;
    say(`¡Vale! Quedan ${left} número${left === 1 ? "" : "s"}`, "ok");
  }

  // Busca el número que se ha quedado sin ningún rectángulo posible.
  function homelessClue() {
    const n = puzzle.n;
    for (let i = 0; i < puzzle.clues.length; i++) {
      const v = puzzle.clues[i];
      if (!v || owner[i] !== -1) continue;
      const cr = Math.floor(i / n);
      const cc = i % n;
      let any = false;
      for (let r0 = 0; r0 <= cr && !any; r0++) {
        for (let c0 = 0; c0 <= cc && !any; c0++) {
          for (let r1 = cr; r1 < n && !any; r1++) {
            for (let c1 = cc; c1 < n && !any; c1++) {
              const bx = { r0, c0, r1, c1 };
              if ((r1 - r0 + 1) * (c1 - c0 + 1) !== v) continue;
              let ok = true;
              for (let r = r0; r <= r1 && ok; r++) {
                for (let c = c0; c <= c1 && ok; c++) if (owner[r * n + c] !== -1) ok = false;
              }
              if (ok && cluesIn(bx).length === 1) any = true;
            }
          }
        }
      }
      if (!any) return { v, i };
    }
    return null;
  }

  function deadEnd(id) {
    const homeless = homelessClue();
    const reason = homeless
      ? `El ${homeless.v} se queda sin sitio: ya no cabe ningún rectángulo de ${homeless.v} casillas a su alrededor`
      : "Con ese rectángulo, el resto de números ya no se puede repartir";
    strikes++;
    renderGrid(homeless ? homeless.i : null);
    if (strikes >= 3) return loseRound(reason, homeless ? homeless.i : null);
    say(`${reason} (fallo ${strikes} de 3)`, "bad");
    locked = true;
    later(() => {
      for (let i = 0; i < owner.length; i++) if (owner[i] === id) owner[i] = -1;
      placed[id] = null;
      locked = false;
      renderGrid();
      say("Te he borrado ese rectángulo: prueba otro reparto", "");
    }, 1700);
  }

  function renderGrid(guiltyIdx) {
    const n = puzzle.n;
    const grid = body.querySelector("[data-grid]");
    if (!grid) return;
    const prev = dragStart && dragNow ? box(dragStart, dragNow) : null;
    Array.from(grid.children).forEach((cell) => {
      const i = Number(cell.dataset.i);
      const r = Math.floor(i / n);
      const c = i % n;
      const o = owner[i];
      let cls = "sk-cell";
      if (o !== -1) {
        cls += ` own sk-c${o % 6}`;
        if (r === 0 || owner[(r - 1) * n + c] !== o) cls += " et";
        if (r === n - 1 || owner[(r + 1) * n + c] !== o) cls += " eb";
        if (c === 0 || owner[r * n + c - 1] !== o) cls += " el";
        if (c === n - 1 || owner[r * n + c + 1] !== o) cls += " er";
      }
      if (prev && r >= prev.r0 && r <= prev.r1 && c >= prev.c0 && c <= prev.c1) cls += " prev";
      if (guiltyIdx === i) cls += " guilty";
      cell.className = cls;
    });
  }

  function showSolution() {
    const n = puzzle.n;
    owner = new Array(n * n).fill(-1);
    puzzle.rects.forEach((rc, id) => {
      for (let r = rc.r0; r <= rc.r1; r++) {
        for (let c = rc.c0; c <= rc.c1; c++) owner[r * n + c] = id;
      }
    });
    renderGrid();
    body.querySelectorAll(".sk-cell").forEach((el) => el.classList.add("reveal"));
  }

  function win() {
    locked = true;
    rounds++;
    streak++;
    score += 10;
    renderScore();
    say("¡Cuadrícula repartida! +10", "ok");
    later(nextRound, 900);
  }

  function loseRound(reason, guiltyIdx) {
    locked = true;
    rounds++;
    streak = 0;
    lives--;
    renderLives();
    say(`${reason}. Así era el reparto bueno.`, "bad");
    // Primero parpadea el número que se quedó sin sitio y luego se pinta el
    // reparto bueno: si se pintara de golpe no se vería el fallo.
    if (guiltyIdx !== null && guiltyIdx !== undefined) {
      renderGrid(guiltyIdx);
      later(showSolution, 1400);
    } else {
      showSolution();
    }
    const wait = guiltyIdx !== null && guiltyIdx !== undefined ? 3600 : 2600;
    if (lives <= 0) return later(() => finish(false), wait);
    later(nextRound, wait);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "shikaku", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>▭</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} cuadrículas repartidas</p>
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
