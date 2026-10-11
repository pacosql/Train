// "Puntos y cajas" (La Pipopipette, Édouard Lucas, 1889) contra la
// máquina. Estrategia de cadenas de Berlekamp ("The Dots and Boxes Game").
//
// Juego por turnos: se toca entre dos puntos para trazar un lado; quien
// cierra una caja la pinta con su color y VUELVE A JUGAR. Cada partida es
// una ronda: ganarla = +10, empatar = 0 (sin perder vida), perderla =
// −1 vida. Al ganar, la máquina sube de nivel:
//   1 · cierra caja si puede; si no, traza un lado "seguro" (que no deje
//       una caja con 3 lados); si no hay, uno al azar.
//   2 · además, cuando ya hay que regalar, abre la cadena más corta.
//   3 · además, hace el "doble trato" (todas menos dos) al final de una
//       cadena larga cuando le conviene quedarse con el control, y elige
//       qué cadena abrir con el recuento exacto de cadenas y bucles.
// Al perder se enseña una repetición que marca la jugada clave (la que
// regaló más cajas seguidas) y se explican las cadenas y el doble trato.
import { saveScore } from "./utils.js";

// ---------- Tablero ----------
// Cajas R×C. Lados horizontales h(i, j): del punto (i, j) al (i, j+1),
// i = 0..R, j = 0..C−1. Lados verticales v(i, j): del punto (i, j) al
// (i+1, j), i = 0..R−1, j = 0..C. Caja b = i·C + j.
export function makeBoard(R, C) {
  const edges = [];
  const nH = (R + 1) * C;
  const hId = (i, j) => i * C + j;
  const vId = (i, j) => nH + i * (C + 1) + j;
  for (let i = 0; i <= R; i++)
    for (let j = 0; j < C; j++) {
      const boxes = [];
      if (i > 0) boxes.push((i - 1) * C + j);
      if (i < R) boxes.push(i * C + j);
      edges.push({ k: "h", i, j, p: [i, j], q: [i, j + 1], boxes });
    }
  for (let i = 0; i < R; i++)
    for (let j = 0; j <= C; j++) {
      const boxes = [];
      if (j > 0) boxes.push(i * C + j - 1);
      if (j < C) boxes.push(i * C + j);
      edges.push({ k: "v", i, j, p: [i, j], q: [i + 1, j], boxes });
    }
  const boxEdges = [];
  for (let i = 0; i < R; i++)
    for (let j = 0; j < C; j++) boxEdges.push([hId(i, j), hId(i + 1, j), vId(i, j), vId(i, j + 1)]);
  return { R, C, E: edges.length, B: R * C, edges, boxEdges };
}

export const sidesOf = (bd, d, b) => bd.boxEdges[b].reduce((s, e) => s + (d[e] ? 1 : 0), 0);
export const freeEdges = (bd, d) => {
  const out = [];
  for (let e = 0; e < bd.E; e++) if (!d[e]) out.push(e);
  return out;
};
// Cuántas cajas cerraría trazar e ahora mismo.
export const completes = (bd, d, e) => bd.edges[e].boxes.reduce((s, b) => s + (sidesOf(bd, d, b) === 3 ? 1 : 0), 0);
// Seguro: no cierra nada y no deja ninguna caja con 3 lados.
export const isSafe = (bd, d, e) => !d[e] && bd.edges[e].boxes.every((b) => sidesOf(bd, d, b) <= 1);
const otherBox = (bd, e, b) => {
  const bs = bd.edges[e].boxes;
  return bs.length === 2 ? (bs[0] === b ? bs[1] : bs[0]) : -1; // −1 = borde ("suelo")
};
const missing = (bd, d, b) => bd.boxEdges[b].filter((e) => !d[e]);

// Traza e para `who`; apunta las cajas que se cierran. Devuelve cuántas.
export function applyEdge(bd, d, owner, e, who) {
  if (d[e]) throw new Error("lado ya trazado");
  d[e] = who;
  let got = 0;
  for (const b of bd.edges[e].boxes)
    if (sidesOf(bd, d, b) === 4) {
      owner[b] = who;
      got++;
    }
  return got;
}

// Coge con avidez todo lo que se pueda cerrar. Devuelve el tablero
// resultante y cuántas cajas se cerraron.
export function greedyTakeAll(bd, d0) {
  const d = d0.slice();
  let count = 0;
  for (;;) {
    let found = -1;
    for (let e = 0; e < bd.E && found < 0; e++) if (!d[e] && completes(bd, d, e) > 0) found = e;
    if (found < 0) return { d, count };
    count += completes(bd, d, found);
    d[found] = 1;
  }
}

// Cajas que regala trazar e (el rival se las lleva todas seguidas).
export function giveaway(bd, d, e) {
  const d2 = d.slice();
  d2[e] = 1;
  return greedyTakeAll(bd, d2).count;
}

// ---------- Final de partida: cadenas y bucles ----------
// Cuando no quedan lados seguros ni cajas por cerrar, las cajas abiertas
// forman cadenas (acaban en el borde) y bucles (cerrados). Si alguna caja
// abierta tiene menos de 2 lados, la posición no es "limpia" y devolvemos
// null (la máquina usa entonces la regla del nivel 2).
export function components(bd, d) {
  const sides = [];
  for (let b = 0; b < bd.B; b++) sides.push(sidesOf(bd, d, b));
  for (let b = 0; b < bd.B; b++) if (sides[b] < 2 || sides[b] === 3) return null;
  const parent = Array.from({ length: bd.B }, (_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (let e = 0; e < bd.E; e++) {
    if (d[e]) continue;
    const bs = bd.edges[e].boxes;
    if (bs.length === 2) parent[find(bs[0])] = find(bs[1]);
  }
  const map = new Map();
  for (let b = 0; b < bd.B; b++) {
    if (sides[b] === 4) continue;
    const r = find(b);
    if (!map.has(r)) map.set(r, { boxes: [], ground: [], inner: [] });
    map.get(r).boxes.push(b);
  }
  for (let e = 0; e < bd.E; e++) {
    if (d[e]) continue;
    const bs = bd.edges[e].boxes;
    const comp = map.get(find(bs[0]));
    if (bs.length === 1) comp.ground.push(e);
    else comp.inner.push(e);
  }
  return [...map.values()].map((c) => ({ ...c, type: c.ground.length ? "c" : "l", len: c.boxes.length }));
}

// Valor de un final "simple" (Berlekamp): f(S) = lo mejor que saca, en
// neto, quien RECIBE la componente que abre el que está obligado a mover.
// Al recibir una cadena de L puede cogerla entera (L − f(resto), y luego
// le toca abrir a él) o, si L ≥ 3, quedarse todas menos 2 y regalar esas
// 2 para que el otro siga obligado a abrir (L − 4 + f(resto)). En un
// bucle el "doble trato" deja 4 (L − 8 + f(resto)). El que abre escoge
// la componente que menos le da al otro. (Las cadenas de 2 se abren por
// el medio, así no admiten doble trato.)
const fMemo = new Map();
export function fval(tokens) {
  if (!tokens.length) return 0;
  const key = tokens.slice().sort().join(",");
  if (fMemo.has(key)) return fMemo.get(key);
  let best = Infinity;
  const seen = new Set();
  tokens.forEach((t, i) => {
    if (seen.has(t)) return;
    seen.add(t);
    const rest = tokens.filter((_, k) => k !== i);
    best = Math.min(best, receiverValue(t, fval(rest)));
  });
  fMemo.set(key, best);
  return best;
}
function receiverValue(tok, fr) {
  const L = Number(tok.slice(1));
  if (tok[0] === "l") return Math.max(L - fr, L - 8 + fr);
  return Math.max(L - fr, L >= 3 ? L - 4 + fr : -Infinity);
}
const tokenOf = (c) => `${c.type}${String(c.len).padStart(2, "0")}`;

// ---------- Máquina ----------
const pickR = (arr, rnd) => arr[Math.floor(rnd() * arr.length)];

export function aiMove(bd, d, level, rnd = Math.random) {
  const free = freeEdges(bd, d);
  const caps = free.filter((e) => completes(bd, d, e) > 0);
  if (caps.length) return level >= 3 ? l3Capture(bd, d, rnd) : pickR(caps, rnd);
  const safe = free.filter((e) => isSafe(bd, d, e));
  if (safe.length) return pickR(safe, rnd);
  if (level === 1) return pickR(free, rnd);
  if (level >= 3) {
    const e = l3Open(bd, d);
    if (e !== null) return e;
  }
  return cheapestGift(bd, d, free, rnd);
}

// Nivel 2: regalar lo menos posible (abrir la cadena más corta).
function cheapestGift(bd, d, free, rnd) {
  let best = Infinity;
  let cands = [];
  for (const e of free) {
    const g = giveaway(bd, d, e);
    if (g < best) {
      best = g;
      cands = [e];
    } else if (g === best) cands.push(e);
  }
  return pickR(cands, rnd);
}

// Nivel 3 cerrando cajas: coge todo lo que no sea el final de una cadena;
// al llegar a las 2 últimas (o 4 en un bucle) decide si hace doble trato.
function l3Capture(bd, d, rnd) {
  const sides = [];
  for (let b = 0; b < bd.B; b++) sides.push(sidesOf(bd, d, b));
  const others = [];
  const patterns = [];
  for (let b = 0; b < bd.B; b++) {
    if (sides[b] !== 3) continue;
    const e = missing(bd, d, b)[0];
    const n = otherBox(bd, e, b);
    if (n < 0 || sides[n] !== 2) {
      others.push(e);
      continue;
    }
    const e2 = missing(bd, d, n).find((x) => x !== e);
    const m = otherBox(bd, e2, n);
    if (m < 0 || sides[m] <= 1) {
      patterns.push({ gift: 2, take: e, decline: e2 });
      continue;
    }
    if (sides[m] === 2) {
      const e3 = missing(bd, d, m).find((x) => x !== e2);
      const q = otherBox(bd, e3, m);
      if (q >= 0 && sides[q] === 3) {
        if (!patterns.some((p) => p.decline === e2)) patterns.push({ gift: 4, take: e, decline: e2 });
        continue;
      }
    }
    others.push(e);
  }
  if (others.length) return pickR(others, rnd);
  const p = patterns[0];
  if (patterns.length > 1) return p.take;
  const after = greedyTakeAll(bd, d).d;
  const free = freeEdges(bd, after);
  if (!free.length || free.some((e) => isSafe(bd, after, e))) return p.take;
  const comps = components(bd, after);
  if (!comps) return p.take;
  const fr = fval(comps.map(tokenOf));
  // Cogerlas: +gift y luego me toca abrir (−fr). Regalarlas: −gift y el
  // otro tiene que abrir (+fr). Conviene si fr > gift.
  return fr > p.gift ? p.decline : p.take;
}

// Nivel 3 obligado a abrir: la componente que menos le da al rival.
function l3Open(bd, d) {
  const comps = components(bd, d);
  if (!comps || !comps.length) return null;
  const toks = comps.map(tokenOf);
  let best = null;
  comps.forEach((c, i) => {
    const fr = fval(toks.filter((_, k) => k !== i));
    const v = receiverValue(toks[i], fr);
    if (!best || v < best.v || (v === best.v && c.len < best.c.len)) best = { v, c };
  });
  const c = best.c;
  if (c.type === "c" && c.len === 2 && c.inner.length) return c.inner[0]; // por el medio
  if (c.type === "c") return c.ground[0];
  return c.inner[0];
}

// ---------- Solución exacta (solo 3×3: 24 lados caben en un entero) ----------
// valor(posición) = lo mejor que saca, en neto, quien mueve hasta el final.
export function solveExact(bd, d) {
  const memo = new Map();
  const free0 = freeEdges(bd, d);
  let mask0 = 0;
  for (let e = 0; e < bd.E; e++) if (d[e]) mask0 |= 1 << e;
  const full = bd.E >= 31 ? -1 : (1 << bd.E) - 1;
  const sidesM = (mask, b) => {
    let s = 0;
    for (const e of bd.boxEdges[b]) s += (mask >>> e) & 1;
    return s;
  };
  const gotM = (mask, e) => {
    let g = 0;
    for (const b of bd.edges[e].boxes) if (sidesM(mask, b) === 3) g++;
    return g;
  };
  function val(mask) {
    if (mask === full) return 0;
    const hit = memo.get(mask);
    if (hit !== undefined) return hit;
    let best = -Infinity;
    for (const e of free0) {
      if ((mask >>> e) & 1) continue;
      const g = gotM(mask, e);
      const m2 = mask | (1 << e);
      const v = g > 0 ? g + val(m2) : -val(m2);
      if (v > best) best = v;
    }
    memo.set(mask, best);
    return best;
  }
  const moves = free0.map((e) => {
    const g = gotM(mask0, e);
    const m2 = mask0 | (1 << e);
    return { e, got: g, v: g > 0 ? g + val(m2) : -val(m2) };
  });
  return { val: moves.length ? Math.max(...moves.map((m) => m.v)) : 0, moves };
}

// Mejor jugada exacta (a igualdad, prefiere cerrar caja: queda más natural).
export function exactMove(bd, d, rnd = Math.random) {
  const { val, moves } = solveExact(bd, d);
  const best = moves.filter((m) => m.v === val);
  const caps = best.filter((m) => m.got > 0);
  return pickR(caps.length ? caps : best, rnd).e;
}

// ---------- Finales preparados ("¿qué lado juegas para ganar?") ----------
// Se juega una partida 3×3 entre máquinas hasta un final limpio y se
// reparten las cajas ya cerradas para que el marcador quede de forma que
// la jugada "obvia" pierda y la buena gane (con la máquina jugando
// perfecto). Dos tipos:
//   A · la máquina acaba de abrir una cadena larga: ¿coges todo o haces
//       doble trato?
//   B · te toca abrir: ¿qué cadena regalas?
// La respuesta es JUGAR: el final se juega hasta el último lado.
export function genPuzzle(rnd = Math.random) {
  for (let tries = 0; tries < 3000; tries++) {
    const bd = makeBoard(3, 3);
    const d = new Uint8Array(bd.E);
    const own = new Int8Array(bd.B);
    let who = 1;
    let stopAt = null;
    // Partida N2 contra N2 hasta un final limpio con trozos ya cerrados.
    while (freeEdges(bd, d).length) {
      const comps = components(bd, d);
      const done = own.reduce((s, o) => s + (o ? 1 : 0), 0);
      const rem = bd.B - done;
      if (comps && comps.length >= 2 && done >= 2 && rem >= 5 && rnd() < 0.7) {
        stopAt = comps;
        break;
      }
      const e = aiMove(bd, d, 2, rnd);
      const got = applyEdge(bd, d, own, e, who);
      if (!got) who = 3 - who;
    }
    if (!stopAt) continue;
    const longs = stopAt.filter((c) => c.len >= 3);
    const type = longs.length && rnd() < 0.55 ? "A" : "B";
    // Los lados ya trazados se reparten de color al azar (es decorado).
    for (let e = 0; e < bd.E; e++) if (d[e]) d[e] = rnd() < 0.5 ? 1 : 2;
    let opened = -1;
    if (type === "A") {
      // La máquina abre una cadena/bucle largo por un extremo.
      const c = longs[Math.floor(rnd() * longs.length)];
      opened = c.type === "c" ? c.ground[0] : c.inner[0];
      d[opened] = 2;
    }
    const sol = solveExact(bd, d);
    const done = own.reduce((s, o) => s + (o ? 1 : 0), 0);
    // Jugada tentadora: A = cogerlo todo y luego abrir lo mejor posible;
    // B = abrir la cadena más corta (lo que haría el nivel 2).
    let vt;
    if (type === "A") {
      const g = greedyTakeAll(bd, d);
      vt = g.count + solveExact(bd, g.d).val;
    } else {
      const free = freeEdges(bd, d);
      const minG = Math.min(...free.map((e) => giveaway(bd, d, e)));
      const shortest = free.filter((e) => giveaway(bd, d, e) === minG);
      // TODAS las aperturas de la más corta tienen que perder.
      vt = Math.max(...sol.moves.filter((m) => shortest.includes(m.e)).map((m) => m.v));
    }
    // δ = (mis cajas − las de la máquina) ya cerradas. Ganar ⇔ δ + v > 0.
    let delta = -sol.val + 1;
    if ((delta + done) % 2 !== 0) delta++;
    if (Math.abs(delta) > done || !(delta + vt < 0)) continue;
    const winners = sol.moves.filter((m) => delta + m.v > 0).length;
    if (winners === sol.moves.length) continue;
    // Reparte las cajas cerradas: (done + δ)/2 para el jugador.
    const mine = (done + delta) / 2;
    const closed = [];
    for (let b = 0; b < bd.B; b++) if (own[b]) closed.push(b);
    const shuffled = closed.map((b) => [rnd(), b]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
    shuffled.forEach((b, i) => (own[b] = i < mine ? 1 : 2));
    return { bd, d, own, type, opened, delta, best: sol.val, vt, winners, total: sol.moves.length };
  }
  return null;
}

// La línea buena del jugador para su primer turno (lados en orden).
export function bestLine(bd, d0) {
  const d = d0.slice();
  const line = [];
  for (;;) {
    if (!freeEdges(bd, d).length) return line;
    const capsAvail = freeEdges(bd, d).some((x) => completes(bd, d, x) > 0);
    const e = exactMove(bd, d, () => 0);
    const g = completes(bd, d, e);
    d[e] = 1;
    line.push({ e, got: g, declined: capsAvail && g === 0 });
    if (!g) return line;
  }
}

// ---------- Niveles de la partida ----------
export const MATCHES = [
  { R: 3, C: 3, ai: 1 },
  { R: 3, C: 3, ai: 2 },
  { R: 3, C: 3, ai: 3 },
  { R: 4, C: 4, ai: 2 },
  { R: 4, C: 4, ai: 3 },
];

// Jugada clave de una partida perdida: el lado del jugador tras el cual
// la máquina encadenó más cajas seguidas.
export function keyMove(history) {
  let best = null;
  for (let k = 0; k < history.length; k++) {
    const h = history[k];
    if (h.who !== 1 || h.got > 0) continue;
    let run = 0;
    let t = k + 1;
    const boxes = [];
    while (t < history.length && history[t].who === 2) {
      run += history[t].got;
      boxes.push(...history[t].boxes);
      t++;
    }
    if (!best || run >= best.run) best = { k, run, boxes };
  }
  return best;
}

// ---------- Juego ----------
const SP = 100; // separación entre puntos (unidades SVG)
const MG = 26;
const dot = (i, j) => [MG + j * SP, MG + i * SP];

export function mountPuntoscajasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let bd = null;
  let d = null; // lados: 0 libre, 1 jugador, 2 máquina
  let owner = null;
  let turn = 1;
  let over = false;
  let history = [];
  let cfg = null;
  let preview = -1;
  let puzzle = null; // final preparado en curso (o null)
  let puzzleNext = false; // tras ganar una partida toca un final preparado
  let startD = null; // posición inicial (para la repetición)
  let startOwn = null;
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };
  const clearTimers = () => {
    timers.forEach(clearTimeout);
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
    <div class="game-body pc-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");

  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const count = (who) => owner.reduce((s, o) => s + (o === who ? 1 : 0), 0);

  function boardSVG(dd, own, opts = {}) {
    const W = 2 * MG + bd.C * SP;
    const H = 2 * MG + bd.R * SP;
    let s = "";
    for (let b = 0; b < bd.B; b++) {
      if (!own[b]) continue;
      const i = Math.floor(b / bd.C);
      const j = b % bd.C;
      const [x, y] = dot(i, j);
      const mark = opts.mark && opts.mark.includes(b) ? " pc-marked" : "";
      s += `<rect class="pc-box pc-o${own[b]}${mark}" x="${x + 6}" y="${y + 6}" width="${SP - 12}" height="${SP - 12}" rx="8"/>`;
      s += `<text class="pc-boxlab pc-t${own[b]}" x="${x + SP / 2}" y="${y + SP / 2 + 11}" text-anchor="middle">${own[b] === 1 ? "TÚ" : "🤖"}</text>`;
    }
    bd.edges.forEach((ed, e) => {
      const [x1, y1] = dot(...ed.p);
      const [x2, y2] = dot(...ed.q);
      if (!dd[e]) {
        if (opts.live) s += `<line class="pc-free" data-e="${e}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
        return;
      }
      const extra = (opts.last === e ? " pc-last" : "") + (opts.key === e ? " pc-key" : "");
      s += `<line class="pc-e pc-w${dd[e]}${extra}" data-e="${e}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    });
    if (opts.live && preview >= 0 && !dd[preview]) {
      const ed = bd.edges[preview];
      const [x1, y1] = dot(...ed.p);
      const [x2, y2] = dot(...ed.q);
      s += `<line class="pc-prev" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
    }
    for (let i = 0; i <= bd.R; i++)
      for (let j = 0; j <= bd.C; j++) {
        const [x, y] = dot(i, j);
        s += `<circle class="pc-dot" cx="${x}" cy="${y}" r="7"/>`;
      }
    return `<svg class="pc-board ${opts.cls || ""}" viewBox="0 0 ${W} ${H}" ${opts.live ? 'data-board' : ""}>${s}</svg>`;
  }

  function nextRound() {
    puzzle = puzzleNext ? genPuzzle() : null;
    puzzleNext = false;
    if (puzzle) {
      cfg = { R: 3, C: 3, ai: "exacta" };
      bd = puzzle.bd;
      d = puzzle.d.slice();
      owner = puzzle.own.slice();
    } else {
      cfg = MATCHES[Math.min(level, MATCHES.length - 1)];
      bd = makeBoard(cfg.R, cfg.C);
      d = new Uint8Array(bd.E);
      owner = new Int8Array(bd.B);
    }
    startD = d.slice();
    startOwn = owner.slice();
    turn = 1;
    over = false;
    history = [];
    preview = -1;
    const head = puzzle
      ? `🧩 Final preparado
        <small>Vas ${count(1)}–${count(2)} · te toca · la máquina juega perfecto</small>`
      : `Puntos y cajas
        <small>Partida ${rounds + 1} · ${cfg.R}×${cfg.C} cajas · máquina nivel ${cfg.ai}</small>`;
    const help = !puzzle
      ? "Toca entre dos puntos para trazar un lado. Si cierras una caja, es tuya y vuelves a jugar."
      : puzzle.type === "A"
      ? "La máquina acaba de abrir una cadena (lado brillante). ¿Qué haces? Juega hasta el final para GANAR."
      : "No quedan lados seguros: algo tendrás que regalar. ¿Qué lado trazas? Juega hasta el final para GANAR.";
    body.innerHTML = `
      <p class="prompt pc-prompt">${head}</p>
      <div class="pc-scoreboard">
        <span class="pc-side pc-me">Tú <b data-me>0</b></span>
        <span class="pc-turn" data-turn></span>
        <span class="pc-side pc-ai"><b data-ai>0</b> Máquina</span>
      </div>
      <div class="pc-boardwrap" data-wrap></div>
      <p class="pc-help" data-help>${help}</p>
      <div class="feedback pc-feedback" data-feedback></div>
      <div class="pc-after" data-after></div>
    `;
    paint();
    bindBoard();
  }

  function paint() {
    const last = history.length ? history[history.length - 1].e : puzzle ? puzzle.opened : -1;
    body.querySelector("[data-wrap]").innerHTML = boardSVG(d, owner, { live: !over, last });
    body.querySelector("[data-me]").textContent = count(1);
    body.querySelector("[data-ai]").textContent = count(2);
    const t = body.querySelector("[data-turn]");
    t.textContent = over ? "Fin" : turn === 1 ? "Tu turno" : "Juega la máquina…";
    t.className = `pc-turn ${over ? "" : turn === 1 ? "pc-tme" : "pc-tai"}`;
  }

  // Gesto: el lado libre más cercano al dedo (zonas táctiles grandes).
  function nearestEdge(svg, ev) {
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return -1;
    const p = pt.matrixTransform(ctm.inverse());
    let best = -1;
    let bestD = SP * 0.42;
    bd.edges.forEach((ed, e) => {
      if (d[e]) return;
      const [x1, y1] = dot(...ed.p);
      const [x2, y2] = dot(...ed.q);
      const dx = x2 - x1;
      const dy = y2 - y1;
      const t = Math.max(0, Math.min(1, ((p.x - x1) * dx + (p.y - y1) * dy) / (dx * dx + dy * dy)));
      const dist = Math.hypot(p.x - (x1 + t * dx), p.y - (y1 + t * dy));
      if (dist < bestD) {
        bestD = dist;
        best = e;
      }
    });
    return best;
  }

  function bindBoard() {
    const wrap = body.querySelector("[data-wrap]");
    let active = false;
    wrap.addEventListener("pointerdown", (ev) => {
      if (finished || over || turn !== 1) return;
      const svg = wrap.querySelector("svg");
      if (!svg) return;
      ev.preventDefault();
      active = true;
      try {
        wrap.setPointerCapture(ev.pointerId);
      } catch (_) {
        /* sin captura no pasa nada */
      }
      preview = nearestEdge(svg, ev);
      paint();
    });
    wrap.addEventListener("pointermove", (ev) => {
      if (!active) return;
      const svg = wrap.querySelector("svg");
      const e = nearestEdge(svg, ev);
      if (e !== preview) {
        preview = e;
        paint();
      }
    });
    const end = (ev, commit) => {
      if (!active) return;
      active = false;
      const svg = wrap.querySelector("svg");
      const e = commit && svg ? nearestEdge(svg, ev) : -1;
      preview = -1;
      if (e >= 0 && !finished && !over && turn === 1) play(e, 1);
      else paint();
    };
    wrap.addEventListener("pointerup", (ev) => end(ev, true));
    wrap.addEventListener("pointercancel", (ev) => end(ev, false));
  }

  function play(e, who) {
    if (d[e]) return;
    const hadCaps = freeEdges(bd, d).some((x) => completes(bd, d, x) > 0);
    const before = owner.slice();
    const got = applyEdge(bd, d, owner, e, who);
    const boxes = [];
    for (let b = 0; b < bd.B; b++) if (owner[b] && !before[b]) boxes.push(b);
    history.push({ e, who, got, boxes, declined: who === 2 && hadCaps && got === 0 });
    if (got === 0) turn = 3 - who;
    const fb = body.querySelector("[data-feedback]");
    if (got > 0 && who === 1) {
      fb.textContent = `¡Caja${got > 1 ? "s" : ""}! Vuelves a jugar.`;
      fb.className = "feedback ok pc-feedback";
    } else if (who === 1) fb.textContent = "";
    if (who === 2 && history[history.length - 1].declined) {
      fb.textContent = "La máquina te deja 2 cajas a propósito… ¿por qué será?";
      fb.className = "feedback pc-feedback";
    }
    paint();
    if (freeEdges(bd, d).length === 0) {
      over = true;
      paint();
      later(endMatch, 700);
      return;
    }
    if (turn === 2) later(machineMove, got > 0 ? 380 : 560);
  }

  function machineMove() {
    if (finished || over || turn !== 2) return;
    play(puzzle ? exactMove(bd, d) : aiMove(bd, d, cfg.ai), 2);
  }

  function endMatch() {
    if (finished) return;
    rounds++;
    const me = count(1);
    const ai = count(2);
    const fb = body.querySelector("[data-feedback]");
    const help = body.querySelector("[data-help]");
    help.textContent = "";
    const after = body.querySelector("[data-after]");
    let lost = false;
    if (me > ai) {
      score += 10;
      renderScore();
      fb.textContent = puzzle ? `¡Final resuelto! Ganaste ${me}–${ai}. +10` : `¡Ganaste ${me}–${ai}! +10`;
      fb.className = "feedback ok pc-feedback";
      if (!puzzle) {
        level++;
        puzzleNext = true;
      }
    } else if (me === ai) {
      fb.textContent = `Empate ${me}–${ai}. Ni ganas ni pierdes vida.`;
      fb.className = "feedback pc-feedback";
    } else {
      lost = true;
      lives--;
      renderLives();
      fb.textContent = `Perdiste ${me}–${ai}.`;
      fb.className = "feedback bad pc-feedback";
    }
    const last = lives <= 0;
    const nextLabel = last ? "Ver resultado" : "Siguiente partida →";
    after.innerHTML =
      (lost && puzzle ? puzzleSolutionHTML() : "") +
      (lost ? replayHTML() : "") +
      `<button type="button" class="primary pc-next" data-next>${nextLabel}</button>`;
    if (lost) bindReplay();
    after.querySelector("[data-next]").addEventListener("click", () => {
      if (finished) return;
      if (last) finish(false);
      else nextRound();
    });
    after.scrollIntoView?.({ block: "nearest" });
  }

  // Final preparado perdido: la línea buena desde la posición inicial.
  function puzzleSolutionHTML() {
    const line = bestLine(bd, startD);
    const svgD = startD.slice();
    line.forEach((m) => (svgD[m.e] = 3)); // 3 = lado de la solución (verde)
    const caps0 = freeEdges(bd, startD).some((e) => completes(bd, startD, e) > 0);
    const lastM = line[line.length - 1];
    let why;
    if (lastM && lastM.declined) {
      const taken = line.length - 1;
      why = `Había que hacer <b>doble trato</b>: ${
        taken ? `coger ${taken === 1 ? "esa caja" : `esas ${taken} cajas`} y ` : ""
      }NO cerrar las 2 últimas, sino trazar el lado del fondo (verde). La máquina se lleva 2, pero luego TIENE que abrirte la siguiente cadena.`;
    } else if (caps0) {
      why = `Aquí convenía cogerlo todo y después abrir por el último lado verde: lo que quedaba no compensaba el doble trato.`;
    } else {
      const g = giveaway(bd, startD, line[0].e);
      why = `Había que abrir por el lado verde (regala ${g} caja${g === 1 ? "" : "s"}). Fíjate en qué cadenas quedan y quién tendrá que abrir las largas.`;
    }
    return `
      <div class="pc-replay pc-solution">
        <div class="pc-rtitle">La buena era…</div>
        ${boardSVG(svgD, startOwn, { cls: "pc-mini" })}
        <div class="pc-rcap">${why}</div>
      </div>`;
  }

  // ---------- Repetición de la partida perdida ----------
  let replay = null;
  function replayHTML() {
    const km = keyMove(history);
    const dbl = history.findIndex((h) => h.declined);
    replay = { km, step: km ? km.k + 1 : history.length, dbl };
    let idea = `<p class="pc-idea"><b>La idea:</b> al final todo son <b>cadenas</b> de cajas. Quien está obligado a abrir una se la regala entera al otro. Abre siempre la <b>más corta</b> y guarda las largas. Si te regalan una cadena larga y aún quedan otras, usa el <b>doble trato</b>: cógela toda <b>menos las 2 últimas</b> y regálalas trazando el lado del fondo; así el otro tendrá que abrirte la siguiente.</p>`;
    if (dbl >= 0)
      idea += `<p class="pc-idea">En la jugada ${dbl + 1} la máquina te hizo un doble trato: te dejó 2 cajas para que fueras tú quien abriera la cadena siguiente.</p>`;
    return `
      <div class="pc-replay">
        <div class="pc-rtitle">Repetición</div>
        <div class="pc-rboard" data-rboard></div>
        <div class="pc-rcap" data-rcap></div>
        <div class="pc-rctl">
          <button type="button" class="secondary" data-rprev aria-label="Jugada anterior">◀</button>
          <input type="range" min="1" max="${history.length}" value="${replay.step}" data-rrange aria-label="Jugada">
          <button type="button" class="secondary" data-rnext aria-label="Jugada siguiente">▶</button>
        </div>
        ${idea}
      </div>`;
  }
  function paintReplay() {
    const k = replay.step; // estado tras k jugadas
    const dd = startD.slice();
    const own = startOwn.slice();
    for (let t = 0; t < k; t++) applyEdge(bd, dd, own, history[t].e, history[t].who);
    const km = replay.km;
    const isKey = km && k === km.k + 1;
    const h = history[k - 1];
    const ownShow = isKey ? own.slice() : own;
    if (isKey) for (const b of km.boxes) ownShow[b] = 2; // se ven las cajas que vinieron después
    body.querySelector("[data-rboard]").innerHTML = boardSVG(dd, ownShow, {
      last: h.e,
      key: isKey ? h.e : -1,
      mark: isKey ? km.boxes : null,
      cls: "pc-mini",
    });
    let cap = `Jugada ${k} de ${history.length}: ${h.who === 1 ? "tú trazas" : "la máquina traza"} un lado`;
    if (h.got) cap += ` y cierra ${h.got} caja${h.got > 1 ? "s" : ""} (vuelve a jugar)`;
    cap += ".";
    if (h.declined) cap += " <b>Doble trato:</b> deja 2 cajas a propósito.";
    if (isKey)
      cap =
        km.run >= 3
          ? `<b>Jugada clave (${k}):</b> aquí abriste una cadena de ${km.run} → ${km.run} cajas seguidas para la máquina (rayadas).`
          : `<b>Jugada clave (${k}):</b> tras este lado la máquina se llevó ${km.run} caja${km.run === 1 ? "" : "s"} seguida${km.run === 1 ? "" : "s"}.`;
    const capEl = body.querySelector("[data-rcap]");
    capEl.innerHTML = cap;
    capEl.classList.toggle("key", !!isKey);
    body.querySelector("[data-rrange]").value = String(k);
  }
  function bindReplay() {
    const rng = body.querySelector("[data-rrange]");
    rng.addEventListener("input", () => {
      replay.step = Number(rng.value);
      paintReplay();
    });
    body.querySelector("[data-rprev]").addEventListener("click", () => {
      replay.step = Math.max(1, replay.step - 1);
      paintReplay();
    });
    body.querySelector("[data-rnext]").addEventListener("click", () => {
      replay.step = Math.min(history.length, replay.step + 1);
      paintReplay();
    });
    paintReplay();
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "puntoscajas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔲</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} partidas ganadas de ${rounds}</p>
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
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimers();
  };
}
