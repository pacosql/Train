// "Mueve una cerilla": puzles clásicos de cerillas.
//
// Una igualdad FALSA hecha con cerillas (dígitos de 7 segmentos y los
// signos + − × =). Se toca una cerilla para cogerla (se levanta), y se
// toca un hueco libre (se ven tenues mientras se sostiene una) para
// soltarla; también se puede arrastrar. Al completar los movimientos
// pedidos (1, luego 2) se LEE lo que hay dibujado y se evalúa: si es una
// igualdad verdadera y bien formada, +10. Vale CUALQUIER solución: no se
// compara con una guardada, se corrige evaluando.
//
// Generación: se parte de una igualdad verdadera, se le aplican 1 (o 2)
// movimientos que dejen glifos válidos y una igualdad falsa, y se
// enumeran por fuerza bruta (célula a célula) todas las soluciones del
// estado resultante, para asegurar que hay al menos una y para enseñar
// una al fallar. En los de 2 movimientos se exige además que no haya
// ninguna solución de 1 movimiento.
import { randInt, pick, saveScore } from "./utils.js";

// ---------- Glifos ----------
const D_SEGS = ["a", "b", "c", "d", "e", "f", "g"];
const DIGITS = ["abcdef", "bc", "abdeg", "abcdg", "bcfg", "acdfg", "acdefg", "abc", "abcdefg", "abcdfg"];
const maskOf = (segs, list) => list.split("").reduce((m, s) => m | (1 << segs.indexOf(s)), 0);
const DIGIT_MASK = DIGITS.map((s) => maskOf(D_SEGS, s));
const MASK_DIGIT = new Map(DIGIT_MASK.map((m, d) => [m, d]));
const O_SEGS = ["h", "v", "x1", "x2"]; // − es h; + es h+v; × es x1+x2
const OPS = { 1: "−", 3: "+", 12: "×" };
const E_SEGS = ["u", "l"]; // = son las dos rayas
const popcnt = (m) => {
  let c = 0;
  while (m) {
    c += m & 1;
    m >>= 1;
  }
  return c;
};

// Posiciones de cada tipo de celda (las de × solo en el nivel con ×).
export function segsOf(cell, mult) {
  if (cell.t === "d") return D_SEGS;
  if (cell.t === "o") return mult ? O_SEGS : O_SEGS.slice(0, 2);
  return E_SEGS;
}
// Glifos válidos de cada celda (máscaras).
function validMasks(cell, mult) {
  if (cell.t === "d") return DIGIT_MASK;
  if (cell.t === "o") return mult ? [1, 3, 12] : [1, 3];
  return [3];
}

// Lee la igualdad: glifos, validez y verdad.
export function readEquation(cells, masks) {
  const glyphs = cells.map((c, i) => {
    const m = masks[i];
    if (c.t === "d") return MASK_DIGIT.has(m) ? String(MASK_DIGIT.get(m)) : null;
    if (c.t === "o") return OPS[m] || null;
    return m === 3 ? "=" : null;
  });
  const bad = [];
  let reason = "";
  glyphs.forEach((g, i) => {
    if (g === null) {
      bad.push(i);
      if (!reason)
        reason =
          cells[i].t === "d"
            ? "esa forma no es ningún dígito"
            : cells[i].t === "o"
            ? "ese signo no es ni +, ni −, ni ×"
            : "sin sus dos rayas no hay =";
    }
  });
  const nums = [];
  let cur = [];
  let op = null;
  cells.forEach((c, i) => {
    if (c.t === "d") cur.push(i);
    else {
      nums.push(cur);
      cur = [];
      if (c.t === "o") op = glyphs[i];
    }
  });
  nums.push(cur);
  if (!bad.length) {
    for (const n of nums) {
      if (n.length > 1 && glyphs[n[0]] === "0") {
        bad.push(n[0]);
        reason = "un número no puede empezar por 0";
      }
    }
  }
  const text = glyphs.map((g) => g ?? "?").join("").replace(/([+−×=])/g, " $1 ");
  if (bad.length) return { valid: false, bad, reason, text, glyphs };
  const [A, B, C] = nums.map((n) => Number(n.map((i) => glyphs[i]).join("")));
  const lhs = op === "+" ? A + B : op === "−" ? A - B : A * B;
  return { valid: true, bad, A, B, C, op, lhs, truth: lhs === C, text, glyphs };
}

// Todas las configuraciones de glifos VÁLIDOS a distancia exacta d
// (d cerillas quitadas de un sitio y d puestas en otro).
export function enumAtDistance(cells, start, d, mult) {
  const out = [];
  const cur = new Array(cells.length);
  const opts = cells.map((c, i) =>
    validMasks(c, mult)
      .map((G) => ({ G, r: popcnt(start[i] & ~G), a: popcnt(G & ~start[i]) }))
      .filter((o) => o.r <= d && o.a <= d)
  );
  (function rec(i, R, A) {
    if (R > d || A > d) return;
    if (i === cells.length) {
      if (R === d && A === d) out.push(cur.slice());
      return;
    }
    for (const o of opts[i]) {
      cur[i] = o.G;
      rec(i + 1, R + o.r, A + o.a);
    }
  })(0, 0, 0);
  return out;
}

// ---------- Niveles ----------
const LEVELS = [
  { ops: ["+"], dig: [1, 1, 1], k: 1, keepOp: true },
  { ops: ["+", "−"], dig: [1, 1, 1], k: 1, flipOp: true },
  { ops: ["+", "−"], dig: [2, 2, 2], k: 1 },
  { ops: ["+", "−"], dig: [1, 1, 0], k: 2 },
  { ops: ["×"], dig: [1, 1, 0], k: 1, mult: true },
];
export const CERILLAS_LEVELS = LEVELS.length;

function trueEquation(L) {
  for (;;) {
    const op = pick(L.ops);
    const rng = (n) => (n === 2 ? randInt(10, 99) : randInt(op === "×" ? 2 : 1, 9));
    const A = rng(L.dig[0]);
    const B = rng(L.dig[1]);
    const C = op === "+" ? A + B : op === "−" ? A - B : A * B;
    if (C < 0) continue;
    if (L.dig[2] === 1 && C > 9) continue;
    if (L.dig[2] === 2 && (C < 10 || C > 99)) continue;
    if (L.dig[2] === 0 && C > 99) continue;
    return { A, B, C, op };
  }
}
function layoutOf({ A, B, C }) {
  const cells = [];
  const pushNum = (n) => String(n).split("").forEach(() => cells.push({ t: "d" }));
  pushNum(A);
  cells.push({ t: "o" });
  pushNum(B);
  cells.push({ t: "e" });
  pushNum(C);
  return cells;
}
function masksOf(eq, cells) {
  const s = `${eq.A}${eq.op}${eq.B}=${eq.C}`;
  return s.split("").map((ch, i) =>
    cells[i].t === "d" ? DIGIT_MASK[Number(ch)] : cells[i].t === "o" ? Number(Object.keys(OPS).find((k) => OPS[k] === ch)) : 3
  );
}

export function buildCerillasRound(levelIdx) {
  const L = LEVELS[levelIdx];
  const mult = !!L.mult;
  for (let tries = 0; tries < 400; tries++) {
    const eq = trueEquation(L);
    const cells = layoutOf(eq);
    const src = masksOf(eq, cells);
    const opIdx = cells.findIndex((c) => c.t === "o");
    let cands = enumAtDistance(cells, src, L.k, mult).filter((m) => {
      const r = readEquation(cells, m);
      return r.valid && !r.truth;
    });
    if (L.keepOp) cands = cands.filter((m) => m[opIdx] === src[opIdx]);
    if (L.flipOp) cands = cands.filter((m) => m[opIdx] !== src[opIdx]);
    if (!cands.length) continue;
    const start = pick(cands);
    if (L.k === 2) {
      const one = enumAtDistance(cells, start, 1, mult).some((m) => readEquation(cells, m).truth);
      if (one) continue;
    }
    const sols = enumAtDistance(cells, start, L.k, mult).filter((m) => {
      const r = readEquation(cells, m);
      return r.valid && r.truth;
    });
    if (!sols.length) continue;
    return { level: levelIdx, k: L.k, mult, cells, start, sols, source: src };
  }
  throw new Error("cerillas: no se pudo generar ronda");
}

// Mapa de transformaciones entre dígitos (mover dentro, quitar, poner).
export function digitMap() {
  return DIGIT_MASK.map((m, d) => {
    const move = [];
    const minus = [];
    const plus = [];
    DIGIT_MASK.forEach((n, e) => {
      if (e === d) return;
      const r = popcnt(m & ~n);
      const a = popcnt(n & ~m);
      if (r === 1 && a === 1) move.push(e);
      if (r === 1 && a === 0) minus.push(e);
      if (r === 0 && a === 1) plus.push(e);
    });
    return { d, move, minus, plus };
  });
}

// ---------- Dibujo ----------
const DW = 36; // ancho de un dígito
const SW = 30; // ancho de un signo
const GAP = 16;
const PADX = 12;
const H = 68;
const PADY = 12;
// Centro, ángulo y largo de cada posición dentro de su celda.
const GEO = {
  a: [18, 0, 0, 26],
  b: [36, 17, 90, 26],
  c: [36, 51, 90, 26],
  d: [18, 68, 0, 26],
  e: [0, 51, 90, 26],
  f: [0, 17, 90, 26],
  g: [18, 34, 0, 26],
  h: [15, 34, 0, 24],
  v: [15, 34, 90, 24],
  x1: [15, 34, 45, 32],
  x2: [15, 34, -45, 32],
  u: [15, 26, 0, 24],
  l: [15, 42, 0, 24],
};
function cellXs(cells) {
  let x = PADX;
  return cells.map((c) => {
    const x0 = x;
    x += (c.t === "d" ? DW : SW) + GAP;
    return x0;
  });
}
function widthOf(cells) {
  return cells.reduce((s, c) => s + (c.t === "d" ? DW : SW) + GAP, 0) - GAP + 2 * PADX;
}
// Todas las posiciones con sus extremos en coordenadas del SVG.
function positionsOf(cells, mult) {
  const xs = cellXs(cells);
  const out = [];
  cells.forEach((c, ci) => {
    segsOf(c, mult).forEach((s, si) => {
      const [cx, cy, ang, len] = GEO[s];
      const rad = (ang * Math.PI) / 180;
      const dx = (Math.cos(rad) * len) / 2;
      const dy = (Math.sin(rad) * len) / 2;
      const X = xs[ci] + cx;
      const Y = PADY + cy;
      out.push({ ci, si, seg: s, key: `${ci}:${si}`, x1: X - dx, y1: Y - dy, x2: X + dx, y2: Y + dy });
    });
  });
  return out;
}
function matchSvg(p, extra = "") {
  return `<g class="cr-match ${extra}">
      <line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" class="cr-stick"/>
      <circle cx="${p.x2}" cy="${p.y2}" r="4.3" class="cr-head"/>
    </g>`;
}
// SVG estático (para la solución): las cerillas que llegan en verde, los
// huecos que quedan vacíos en rojo punteado.
function staticSvg(cells, mult, masks, from) {
  const W = widthOf(cells);
  const pos = positionsOf(cells, mult);
  const on = (m, p) => (m[p.ci] >> p.si) & 1;
  return `<svg class="cr-svg cr-mini" viewBox="0 0 ${W} ${H + 2 * PADY}" role="img">
    ${pos
      .map((p) => {
        if (on(masks, p)) return matchSvg(p, from && !on(from, p) ? "cr-add" : "");
        if (from && on(from, p)) return `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" class="cr-rem"/>`;
        return "";
      })
      .join("")}
  </svg>`;
}
function distSeg(px, py, p) {
  const vx = p.x2 - p.x1;
  const vy = p.y2 - p.y1;
  const t = Math.max(0, Math.min(1, ((px - p.x1) * vx + (py - p.y1) * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - (p.x1 + t * vx), py - (p.y1 + t * vy));
}

// ---------- Juego ----------
export function mountCerillasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let totalFails = 0;
  let finished = false;
  let round = null;
  let masks = []; // estado actual
  let history = []; // [{from, to}] claves "ci:si"
  let held = null; // clave de la cerilla cogida
  let busy = false;
  let roundFails = 0;
  let pos = [];
  let drag = null;
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
    return t;
  };
  const clearTimers = () => {
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
  };

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body cr-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const $ = (s) => body.querySelector(s);
  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  const isOn = (key) => {
    const [ci, si] = key.split(":").map(Number);
    return ((masks[ci] >> si) & 1) === 1;
  };
  const setOn = (key, v) => {
    const [ci, si] = key.split(":").map(Number);
    masks[ci] = v ? masks[ci] | (1 << si) : masks[ci] & ~(1 << si);
  };

  function nextRound() {
    if (finished) return;
    const li = level < LEVELS.length ? level : randInt(1, LEVELS.length - 1);
    round = buildCerillasRound(li);
    masks = round.start.slice();
    history = [];
    held = null;
    busy = false;
    roundFails = 0;
    pos = positionsOf(round.cells, round.mult);
    const k = round.k;
    body.innerHTML = `
      <p class="prompt cr-prompt">Mueve <b>${k}</b> ${k === 1 ? "cerilla" : "cerillas"} para que sea verdad
        <small>Toca una cerilla para cogerla y toca un hueco para soltarla (o arrástrala).</small></p>
      <div class="cr-stage" data-stage></div>
      <div class="cr-status">
        <span class="cr-moves" data-moves></span>
        <span class="cr-read" data-read></span>
      </div>
      <div class="cr-actions">
        <button type="button" class="secondary cr-undo" data-undo>↶ Deshacer</button>
      </div>
      <div class="feedback" data-feedback></div>
      <div class="cr-after" data-after></div>
    `;
    $("[data-undo]").addEventListener("click", undo);
    paint();
  }

  function paint() {
    const r = round;
    const W = widthOf(r.cells);
    const xs = cellXs(r.cells);
    const read = readEquation(r.cells, masks);
    const badSet = new Set(read.bad);
    $("[data-stage]").innerHTML = `
      <svg class="cr-svg ${held ? "cr-holding" : ""}" data-svg viewBox="0 0 ${W} ${H + 2 * PADY}" role="img" aria-label="Igualdad con cerillas">
        ${r.cells
          .map((c, i) =>
            badSet.has(i)
              ? `<rect class="cr-badcell" x="${xs[i] - 6}" y="${PADY - 8}" width="${(c.t === "d" ? DW : SW) + 12}" height="${H + 16}" rx="6"/>`
              : ""
          )
          .join("")}
        ${pos
          .map(
            (p) => `<g class="cr-pos ${isOn(p.key) ? "on" : ""} ${held === p.key ? "held" : ""}" data-pos="${p.key}" data-cell="${p.ci}" data-seg="${p.seg}" data-type="${r.cells[p.ci].t}">
              <line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" class="cr-slot"/>
              ${matchSvg(p)}
            </g>`
          )
          .join("")}
        <g class="cr-float" data-float></g>
      </svg>`;
    const svg = $("[data-svg]");
    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);
    svg.addEventListener("pointercancel", () => {
      drag = null;
      paint();
    });
    $("[data-moves]").textContent = `Movimientos: ${history.length} / ${r.k}`;
    $("[data-read]").textContent = read.text;
    $("[data-undo]").disabled = busy || history.length === 0;
  }

  function svgPoint(e) {
    const svg = $("[data-svg]");
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const inv = m.inverse();
    return { x: inv.a * e.clientX + inv.c * e.clientY + inv.e, y: inv.b * e.clientX + inv.d * e.clientY + inv.f };
  }
  // Posición más cercana al dedo (por distancia al segmento). En el
  // centro de un "+" se cruzan dos cerillas: gana la vertical (quitarla
  // es lo habitual, + → −); la horizontal se coge tocando su brazo. La
  // cerilla que se sostiene tiene preferencia para poder devolverla.
  function nearest(pt, filter, maxD = 13) {
    let best = null;
    let bd = maxD;
    for (const p of pos) {
      if (!filter(p)) continue;
      const d = distSeg(pt.x, pt.y, p) + (p.seg === "h" ? 1.5 : 0) - (p.key === held ? 3 : 0);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }

  function onDown(e) {
    if (busy || finished) return;
    const pt = svgPoint(e);
    if (held) {
      // Primero huecos libres (o la propia cerilla); si no, otra cerilla.
      const p = nearest(pt, (q) => !isOn(q.key) || q.key === held);
      if (p && p.key === held) {
        held = null; // soltar en su sitio: no cuenta
        return paint();
      }
      if (p) return doMove(held, p.key);
      const o = nearest(pt, (q) => isOn(q.key));
      if (!o) {
        held = null;
        return paint();
      }
      held = o.key; // cambiar de cerilla
    } else {
      const p = nearest(pt, (q) => isOn(q.key));
      if (!p) return;
      held = p.key;
    }
    drag = { x: e.clientX, y: e.clientY, moving: false };
    refreshHold();
    try {
      $("[data-svg]").setPointerCapture(e.pointerId);
    } catch (_) {}
  }
  // Marca la cerilla cogida sin redibujar (para no perder la captura del puntero).
  function refreshHold() {
    const svg = $("[data-svg]");
    svg.classList.toggle("cr-holding", !!held);
    svg.querySelectorAll(".cr-pos").forEach((g) => g.classList.toggle("held", g.dataset.pos === held));
  }
  function onMove(e) {
    if (!drag || !held) return;
    if (!drag.moving && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
    drag.moving = true;
    const pt = svgPoint(e);
    const p = pos.find((q) => q.key === held);
    const f = $("[data-float]");
    const ox = (p.x1 + p.x2) / 2;
    const oy = (p.y1 + p.y2) / 2;
    f.innerHTML = matchSvg(p, "cr-flying");
    f.setAttribute("transform", `translate(${pt.x - ox} ${pt.y - oy})`);
    $("[data-svg]").classList.add("cr-dragging");
  }
  function onUp(e) {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.moving || !held) return;
    const pt = svgPoint(e);
    const p = nearest(pt, (q) => !isOn(q.key), 18);
    if (p) doMove(held, p.key);
    else {
      held = null;
      paint();
    }
  }

  function doMove(from, to) {
    setOn(from, false);
    setOn(to, true);
    history.push({ from, to });
    held = null;
    paint();
    if (history.length >= round.k) {
      busy = true;
      paint();
      later(evaluate, 350);
    }
  }

  function undo() {
    if (busy || finished || !history.length) return;
    const m = history.pop();
    setOn(m.to, false);
    setOn(m.from, true);
    held = null;
    say("");
    paint();
  }

  function say(t, cls = "") {
    const fb = $("[data-feedback]");
    fb.textContent = t;
    fb.className = `feedback ${cls}`;
  }

  function evaluate() {
    if (finished) return;
    rounds++;
    const r = readEquation(round.cells, masks);
    if (r.valid && r.truth) {
      score += 10;
      level++;
      renderScore();
      $("[data-svg]").classList.add("cr-win");
      say(`¡Verdad! ${r.text}`, "ok");
      later(nextRound, 1400);
      return;
    }
    lives--;
    totalFails++;
    roundFails++;
    renderLives();
    $("[data-svg]").classList.add("cr-lose");
    if (r.valid) say(`✗ ${r.A} ${r.op} ${r.B} = ${r.lhs}, y ${r.lhs} ≠ ${r.C}`, "bad");
    else say(`✗ No es una igualdad válida: ${r.reason}.`, "bad");
    const after = $("[data-after]");
    if (lives <= 0) {
      showSolution();
      later(() => finish(false), 3200);
      return;
    }
    if (roundFails >= 2) {
      showSolution(true);
      return;
    }
    after.innerHTML = `
      <div class="cr-btns">
        <button type="button" class="primary" data-retry-round>↶ Reintentar</button>
        <button type="button" class="secondary" data-show>Ver solución</button>
      </div>`;
    after.querySelector("[data-retry-round]").addEventListener("click", () => {
      while (history.length) {
        const m = history.pop();
        setOn(m.to, false);
        setOn(m.from, true);
      }
      busy = false;
      after.innerHTML = "";
      say("");
      paint();
    });
    after.querySelector("[data-show]").addEventListener("click", () => showSolution(true));
  }

  function showSolution(withNext) {
    const r = round;
    // Preferimos la igualdad de la que salió el puzle; si no, cualquiera.
    const sol = r.sols.find((m) => m.every((v, i) => v === r.source[i])) || r.sols[0];
    const txt = readEquation(r.cells, sol).text;
    const map =
      totalFails >= 2
        ? `<div class="cr-map" data-map>
            <div class="cr-map-title">Mapa de cerillas</div>
            <div class="cr-map-grid">
              <span class="cr-mh">dígito</span><span class="cr-mh">mover 1 dentro</span><span class="cr-mh">quitar 1</span><span class="cr-mh">poner 1</span>
              ${digitMap()
                .map(
                  (t) =>
                    `<b>${t.d}</b><span>${t.move.length ? "↔ " + t.move.join(", ") : "—"}</span><span>${
                      t.minus.length ? "→ " + t.minus.join(", ") : "—"
                    }</span><span>${t.plus.length ? "→ " + t.plus.join(", ") : "—"}</span>`
                )
                .join("")}
            </div>
            <div class="cr-map-note">Signos: + quitando 1 → − · − poniendo 1 → + ${r.mult ? "· + ↔ × moviendo 2" : ""}</div>
          </div>`
        : "";
    $("[data-after]").innerHTML = `
      <div class="cr-sol" data-sol>
        <p>Una solución: <b>${txt}</b> <small>(en verde las que llegan, en rojo de dónde salen)</small></p>
        ${staticSvg(r.cells, r.mult, sol, r.start)}
      </div>
      ${map}
      ${withNext ? `<button type="button" class="secondary cr-next" data-next>Siguiente →</button>` : ""}`;
    const nb = $("[data-next]");
    if (nb) nb.addEventListener("click", nextRound);
    busy = true;
    $("[data-undo]").disabled = true;
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimers();
    drag = null;
    if (userExited) return onExit();
    saveScore(client, "cerillas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔥</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} igualdades arregladas</p>
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
    clearTimers();
    lives = startLives;
    score = 0;
    rounds = 0;
    level = 0;
    totalFails = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimers();
    drag = null;
  };
}
