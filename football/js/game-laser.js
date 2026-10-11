// "Reparte el láser" — inspirado en Refraction (Center for Game Science,
// Universidad de Washington). La fracción no se elige: se CONSTRUYE
// montando un circuito de luz.
//
// Rejilla 6×6 con una fuente láser de potencia 1 en un borde y una o
// varias naves que piden una fracción exacta. El jugador arrastra piezas
// de la bandeja al tablero:
//   · espejo (gira el rayo 90°; tocarlo lo cambia de "/" a "\"),
//   · divisor ÷2 (el rayo sale partido en dos ramas a los lados, ½ cada una),
//   · divisor ÷3 (sale al frente y a los dos lados, ⅓ cada una),
//   · combinador + (suma todo lo que le entra y lo saca por su flecha;
//     tocarlo gira la flecha).
// El rayo se recalcula en vivo con aritmética exacta de fracciones y se
// dibuja con grosor proporcional a su potencia. Una nave suma todo lo que
// le llega (por cualquier lado). Cuando todas reciben justo lo que piden
// (verdes) la ronda se gana sola. "Comprobar" con alguna mal o "Me rindo"
// cuestan una vida y enseñan qué división falta y una solución válida.
//
// Los niveles son plantillas hechas a mano (con su solución) que se
// giran/espejan al azar (8 simetrías). scratchpad/verify_laser.mjs
// comprueba con un buscador propio que cada nivel tiene solución.
import { randInt, saveScore } from "./utils.js";

const N = 6;
const CELL = 50;
const DR = [-1, 0, 1, 0]; // 0 N, 1 E, 2 S, 3 O
const DC = [0, 1, 0, -1];
// Espejo: o=0 "/" , o=1 "\" → dirección de salida según la de entrada.
const MIRROR = [
  [1, 0, 3, 2],
  [3, 2, 1, 0],
];
const LASER = "#ff2e63";

// ---------- Fracciones exactas [num, den] reducidas ----------
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
function fr(n, d = 1) {
  if (n === 0) return [0, 1];
  const g = gcd(n, d);
  return [n / g, d / g];
}
const fadd = (a, b) => fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const fsub = (a, b) => fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const fmul = (a, b) => fr(a[0] * b[0], a[1] * b[1]);
const feq = (a, b) => a[0] === b[0] && a[1] === b[1];
const fcmp = (a, b) => a[0] * b[1] - b[0] * a[1];
const VULGAR = {
  "1/2": "½", "1/3": "⅓", "2/3": "⅔", "1/4": "¼", "3/4": "¾", "1/5": "⅕", "1/6": "⅙",
  "5/6": "⅚", "1/8": "⅛", "3/8": "⅜", "5/8": "⅝", "7/8": "⅞", "1/9": "⅑", "1/10": "⅒",
};
export function fracText(f) {
  if (f[0] === 0) return "0";
  if (f[1] === 1) return String(f[0]);
  return VULGAR[`${f[0]}/${f[1]}`] || `${f[0]}/${f[1]}`;
}

// ---------- Plantillas (con su solución dibujada) ----------
// '.' vacío · '#' roca · '>' '<' '^' 'v' fuente y hacia dónde dispara ·
// 'x' 'y' 'z' naves · '/' '\' espejos · '2' '3' divisores ·
// 'U' 'R' 'D' 'L' combinador con la salida al N/E/S/O.
// `extra`: piezas de más en la bandeja (señuelos). Nivel 5: piezas justas.
const TEMPLATES = [
  // 0 · una nave de ½
  [
    { g: ["......", ">..2..", "......", "...x..", "......", "......"], t: { x: [1, 2] }, extra: { m: 1 } },
    { g: ["......", ".x..\\.", "......", "......", ">...2.", "......"], t: { x: [1, 2] }, extra: { m: 1 } },
    { g: ["......", "..x\\..", "......", "......", "...2.<", "......"], t: { x: [1, 2] }, extra: { m: 1 } },
  ],
  // 1 · dos naves de ¼
  [
    { g: ["......", "x.2...", "......", ">.2...", "......", "y.2..."], t: { x: [1, 4], y: [1, 4] }, extra: { m: 1 } },
    { g: [".v.x..", "......", ".2.2..", "......", ".y./..", "......"], t: { x: [1, 4], y: [1, 4] }, extra: { m: 1 } },
    { g: ["......", "....2<", "......", "......", "./..2x", ".y...."], t: { x: [1, 4], y: [1, 4] }, extra: { m: 1 } },
  ],
  // 2 · una nave de ⅙ (hay que encadenar ÷2 y ÷3)
  [
    { g: [">.3...", "......", "......", "..2.x.", "......", "......"], t: { x: [1, 6] }, extra: { m: 1 } },
    { g: ["......", "..x.3.", "......", "......", "..2./.", "..^..."], t: { x: [1, 6] }, extra: { m: 1 } },
    { g: ["......", ".x..2.", "....3<", "......", "......", "......"], t: { x: [1, 6] }, extra: { m: 1 } },
  ],
  // 3 · una nave de ⅓ y otra de ⅔ (la nave suma lo que le llega)
  [
    { g: ["..v...", "......", "x.3.\\.", "......", "..y./.", "......"], t: { x: [1, 3], y: [2, 3] }, extra: { m: 1, k: 1 } },
    { g: ["../..\\", ">.3..x", "......", "......", "..y...", "......"], t: { x: [2, 3], y: [1, 3] }, extra: { m: 1, k: 1 } },
    { g: ["......", "../.z.", "y.3..<", "..\\./.", "......", "......"], t: { y: [1, 3], z: [2, 3] }, extra: { m: 1, k: 1 } },
  ],
  // 4 · combinador obligatorio (naves con una sola entrada)
  [
    { g: ["#x#...", "......", ">2....", "......", ".3.\\.#", ".\\.R.y"], t: { x: [1, 2], y: [1, 3] }, extra: { m: 1 } },
    { g: ["..v...", "./2\\..", "......", ".2.D..", "......", "..#z#."], t: { z: [3, 4] }, extra: { m: 1 } },
    { g: ["......", "......", "#/.\\..", "xL.3.<", "#.....", "...y.."], t: { x: [2, 3], y: [1, 3] }, extra: { m: 1 } },
  ],
  // 5 · rocas y piezas justas
  [
    { g: ["../..x", "....#.", ">.2.#.", "#.....", "y.2.\\.", "#...z."], t: { x: [1, 2], y: [1, 4], z: [1, 4] }, extra: {} },
    { g: [".x.v..", ".....#", ".2.3\\.", "#.....", ".#.y/.", "..#..."], t: { x: [1, 6], y: [2, 3] }, extra: {} },
    { g: ["......", "x.2.\\.", ".....#", ">.2.Ry", "..\\./#", "......"], t: { x: [1, 4], y: [3, 4] }, extra: {} },
  ],
];
export const LASER_TIERS = TEMPLATES.length;

// Simetrías: sym 0..7 = (espejo izquierda-derecha si sym ≥ 4) y luego k
// giros de 90° en sentido horario.
function symCell(r, c, sym) {
  if (sym >= 4) c = N - 1 - c;
  for (let i = 0; i < sym % 4; i++) [r, c] = [c, N - 1 - r];
  return [r, c];
}
function symDir(d, sym) {
  if (sym >= 4) d = [0, 3, 2, 1][d];
  return (d + (sym % 4)) % 4;
}
function symMirror(o, sym) {
  // el espejo transformado es el que hace lo mismo con direcciones transformadas
  for (const o2 of [0, 1]) {
    if ([0, 1, 2, 3].every((d) => MIRROR[o2][symDir(d, sym)] === symDir(MIRROR[o][d], sym))) return o2;
  }
  return o;
}

// Genera el nivel de la plantilla `idx` del escalón `tier` con la simetría `sym`.
export function genLaserLevel(tier, idx = randInt(0, TEMPLATES[tier].length - 1), sym = randInt(0, 7)) {
  const tpl = TEMPLATES[tier][idx];
  const lv = { tier, idx, sym, source: null, rocks: [], ships: [], solution: [], inv: { m: 0, s2: 0, s3: 0, k: 0 } };
  const shipLetters = [];
  tpl.g.forEach((row, r0) => {
    [...row].forEach((ch, c0) => {
      const [r, c] = symCell(r0, c0, sym);
      if (ch === "#") lv.rocks.push({ r, c });
      else if (">v<^".includes(ch)) lv.source = { r, c, d: symDir({ "^": 0, ">": 1, v: 2, "<": 3 }[ch], sym) };
      else if ("xyz".includes(ch)) shipLetters.push({ ch, r, c });
      else if (ch === "/" || ch === "\\") lv.solution.push({ r, c, t: "m", o: symMirror(ch === "/" ? 0 : 1, sym) });
      else if (ch === "2") lv.solution.push({ r, c, t: "s2", o: 0 });
      else if (ch === "3") lv.solution.push({ r, c, t: "s3", o: 0 });
      else if ("URDL".includes(ch)) lv.solution.push({ r, c, t: "k", o: symDir("URDL".indexOf(ch), sym) });
    });
  });
  shipLetters.sort((a, b) => a.ch.localeCompare(b.ch));
  lv.ships = shipLetters.map((s, i) => ({ r: s.r, c: s.c, t: tpl.t[s.ch], name: "ABC"[i] }));
  for (const p of lv.solution) lv.inv[p.t]++;
  for (const [t, n] of Object.entries(tpl.extra)) lv.inv[t] += n;
  lv.key = `${tier}.${idx}.${sym}`;
  return lv;
}

// ---------- Simulación del circuito ----------
// pieces: Map "r,c" → { t: 'm'|'s2'|'s3'|'k', o }.
// Devuelve los tramos de rayo (con su potencia), lo que recibe cada nave,
// las piezas atascadas en un bucle y una expresión para cada nave.
export function simulateLaser(level, pieces) {
  const rocks = new Set(level.rocks.map((p) => `${p.r},${p.c}`));
  const shipAt = new Map(level.ships.map((s, i) => [`${s.r},${s.c}`, i]));
  const src = level.source;

  function trace(r, c, d) {
    const pts = [[r, c]];
    const seen = new Set();
    for (let guard = 0; guard < 200; guard++) {
      r += DR[d];
      c += DC[d];
      if (r < 0 || r >= N || c < 0 || c >= N) return { end: "off", pts, d };
      pts.push([r, c]);
      const k = `${r},${c}`;
      if (rocks.has(k) || (r === src.r && c === src.c)) return { end: "rock", pts, d };
      if (shipAt.has(k)) return { end: "ship", ship: shipAt.get(k), pts, d };
      const p = pieces.get(k);
      if (p && p.t === "m") {
        const st = `${k}:${d}`;
        if (seen.has(st)) return { end: "loop", pts, d };
        seen.add(st);
        d = MIRROR[p.o][d];
      } else if (p) return { end: "piece", key: k, pts, d };
    }
    return { end: "loop", pts, d };
  }

  // Salidas de una pieza según la dirección con la que entra el rayo:
  // [dirección, factor] (factor null = combinador, suma sin dividir).
  function outs(p, d) {
    if (p.t === "s2") return [[(d + 1) % 4, [1, 2]], [(d + 3) % 4, [1, 2]]];
    if (p.t === "s3") return [[d, [1, 3]], [(d + 1) % 4, [1, 3]], [(d + 3) % 4, [1, 3]]];
    if (p.t === "k") return d === (p.o + 2) % 4 ? [] : [[p.o, null]];
    return [];
  }

  const edges = []; // { from, dir, tr, val, terms }
  const nodes = new Map(); // clave → { ins: [edge], ports: Map(dir → edge) }
  nodes.set("src", { ins: [], ports: new Map() });
  const queue = [];
  function port(nodeKey, dir) {
    const node = nodes.get(nodeKey);
    if (node.ports.has(dir)) return node.ports.get(dir);
    const [r, c] = nodeKey === "src" ? [src.r, src.c] : nodeKey.split(",").map(Number);
    const e = { id: edges.length, from: nodeKey, dir, tr: trace(r, c, dir), val: [0, 1], terms: [] };
    edges.push(e);
    node.ports.set(dir, e);
    queue.push(e);
    return e;
  }
  port("src", src.d);
  while (queue.length) {
    const e = queue.shift();
    if (e.tr.end !== "piece") continue;
    const key = e.tr.key;
    if (!nodes.has(key)) nodes.set(key, { ins: [], ports: new Map() });
    const node = nodes.get(key);
    node.ins.push(e);
    for (const [od, f] of outs(pieces.get(key), e.tr.d)) port(key, od).terms.push({ e, f });
  }

  // Orden topológico (Kahn): una pieza se calcula cuando todas las que le
  // mandan luz están calculadas. Las que no llegan a calcularse están en
  // un bucle (o detrás de uno): su luz se pierde.
  const done = new Set();
  let progress = true;
  while (progress) {
    progress = false;
    for (const [key, node] of nodes) {
      if (done.has(key)) continue;
      if (!node.ins.every((e) => done.has(e.from))) continue;
      for (const e of node.ports.values()) {
        if (key === "src") e.val = [1, 1];
        else e.val = e.terms.reduce((acc, t) => fadd(acc, t.f ? fmul(t.e.val, t.f) : t.e.val), [0, 1]);
      }
      done.add(key);
      progress = true;
    }
  }
  const loopKeys = new Set([...nodes.keys()].filter((k) => !done.has(k)));
  for (const e of edges) if (!done.has(e.from)) e.val = [0, 1];

  const recv = level.ships.map(() => [0, 1]);
  const shipIns = level.ships.map(() => []);
  for (const e of edges) {
    if (e.tr.end === "ship" && e.val[0] > 0) {
      recv[e.tr.ship] = fadd(recv[e.tr.ship], e.val);
      shipIns[e.tr.ship].push(e);
    }
  }
  // Expresión de cómo se ha formado cada rayo: "1 ÷ 3 ÷ 2".
  const exprOf = (e, depth = 0) => {
    if (e.from === "src" || depth > 12) return "1";
    const inner = e.terms.filter((t) => t.e.val[0] > 0).map((t) => exprOf(t.e, depth + 1));
    const p = pieces.get(e.from);
    if (p.t === "k") return inner.join(" + ");
    const base = inner.length > 1 ? `(${inner.join(" + ")})` : inner[0];
    return `${base} ÷ ${p.t === "s2" ? 2 : 3}`;
  };
  const shipExpr = shipIns.map((ins) => ins.map((e) => exprOf(e)).join(" + "));
  const win = level.ships.every((s, i) => feq(recv[i], s.t));
  return { edges, recv, loopKeys, shipExpr, win };
}

export function solutionPieces(level) {
  return new Map(level.solution.map((p) => [`${p.r},${p.c}`, { t: p.t, o: p.o }]));
}

// ---------- Explicación de por qué una nave está mal ----------
function factor23(d) {
  let a = 0, b = 0;
  while (d % 2 === 0) { d /= 2; a++; }
  while (d % 3 === 0) { d /= 3; b++; }
  return d === 1 ? [a, b] : null;
}
const NUMW = ["", "un", "dos", "tres", "cuatro"];
function chainText(a, b) {
  return [...Array(b).fill("⅓"), ...Array(a).fill("½")].reverse().join(" de ");
}
function divisorDiff(n, k) {
  if (n === 0) return null;
  const many = Math.abs(n) > 1;
  return `te ${n > 0 ? "falta" : "sobra"}${many ? "n" : ""} ${NUMW[Math.abs(n)] || Math.abs(n)} divisor${many ? "es" : ""} en ${k}`;
}
const SUMS = { "2/3": "⅔ = ⅓ + ⅓", "3/4": "¾ = ½ + ¼", "1/3": "⅓ = ⅙ + ⅙", "1/2": "½ = ¼ + ¼" };

export function shipAdvice(recv, target, hasCombiner) {
  if (recv[0] === 0) {
    const f = factor23(target[1]);
    let recipe = "";
    if (target[0] === 1 && f && f[0] + f[1] >= 1) {
      const need = [f[0] ? `${NUMW[f[0]] || f[0]} divisor${f[0] > 1 ? "es" : ""} en 2` : "", f[1] ? `${NUMW[f[1]] || f[1]} divisor${f[1] > 1 ? "es" : ""} en 3` : ""].filter(Boolean).join(" y ");
      recipe = ` Para ${fracText(target)}${f[0] + f[1] >= 2 ? ` = ${chainText(f[0], f[1])}` : ""} el rayo tiene que pasar por ${need}.`;
    } else if (SUMS[`${target[0]}/${target[1]}`]) recipe = ` ${SUMS[`${target[0]}/${target[1]}`]}: le tienen que llegar dos rayos (por dos lados${hasCombiner ? " o juntos con el combinador" : ""}).`;
    return `no le llega ningún rayo: lleva la luz hasta ella con espejos.${recipe}`;
  }
  const parts = [];
  const diff = fsub(target, recv);
  parts.push(diff[0] > 0 ? `le falta ${fracText(diff)}` : `le sobra ${fracText([-diff[0], diff[1]])}`);
  const ft = factor23(target[1]);
  const fr2 = factor23(recv[1]);
  if (target[0] === 1 && recv[0] === 1 && ft && fr2) {
    const msgs = [divisorDiff(ft[0] - fr2[0], 2), divisorDiff(ft[1] - fr2[1], 3)].filter(Boolean);
    const chain = ft[0] + ft[1] >= 2 ? `${chainText(ft[0], ft[1])} = ${fracText(target)}: ` : "";
    if (msgs.length) parts.push(`${chain}${msgs.join(" y ")} en el camino del rayo`);
  }
  if (fcmp(recv, target) < 0 && (SUMS[`${target[0]}/${target[1]}`] || "").length) {
    const s = SUMS[`${target[0]}/${target[1]}`];
    if (target[0] > 1 || feq(fadd(recv, recv), target))
      parts.push(`${s}: júntale otro rayo (por otro lado de la nave${hasCombiner ? " o con el combinador" : ""})`);
  }
  return parts.join("; ") + ".";
}

// ---------- Dibujo ----------
const cx = (c) => c * CELL + CELL / 2;
function pieceSvg(t, o, x, y, extraCls = "") {
  // (x, y) = esquina superior izquierda de la casilla
  const m = 9;
  if (t === "m") {
    const [x1, y1, x2, y2] = o === 0 ? [x + m, y + CELL - m, x + CELL - m, y + m] : [x + m, y + m, x + CELL - m, y + CELL - m];
    return `<g class="lr-piece lr-mirror ${extraCls}" data-rot="${o === 0 ? "/" : "\\"}">
      <rect x="${x + 3}" y="${y + 3}" width="${CELL - 6}" height="${CELL - 6}" rx="8" class="lr-pbg"/>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="lr-mline"/>
      <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="lr-mshine"/></g>`;
  }
  if (t === "s2" || t === "s3") {
    return `<g class="lr-piece lr-${t} ${extraCls}">
      <rect x="${x + 7}" y="${y + 7}" width="${CELL - 14}" height="${CELL - 14}" rx="9" class="lr-sbox"/>
      <text x="${x + CELL / 2}" y="${y + CELL / 2 + 6}" class="lr-stext">÷${t === "s2" ? 2 : 3}</text></g>`;
  }
  // combinador: círculo "+" con flecha de salida
  const ccx = x + CELL / 2, ccy = y + CELL / 2;
  const ax = ccx + DC[o] * 19, ay = ccy + DR[o] * 19;
  const px = -DR[o] * 6, py = DC[o] * 6;
  const bx = ccx + DC[o] * 11, by = ccy + DR[o] * 11;
  return `<g class="lr-piece lr-k ${extraCls}" data-rot="${"NESO"[o]}">
    <polygon points="${ax},${ay} ${bx + px},${by + py} ${bx - px},${by - py}" class="lr-karrow"/>
    <circle cx="${ccx}" cy="${ccy}" r="13" class="lr-kbody"/>
    <text x="${ccx}" y="${ccy + 6}" class="lr-ktext">+</text></g>`;
}

const TRAY = [
  { t: "m", name: "Espejo" },
  { t: "s2", name: "Divisor ÷2" },
  { t: "s3", name: "Divisor ÷3" },
  { t: "k", name: "Combinador" },
];

export function mountLaserGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let lv = null;
  let pieces = new Map();
  let inv = null;
  let selected = null; // tipo elegido en la bandeja (tocar y luego tocar casilla)
  let busy = false; // ronda resuelta o fallada: tablero bloqueado
  let showSol = false;
  let lastKey = "";
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body lr-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  let svg, trayEl, feedback, reportEl, actionsEl;

  function nextRound() {
    const tier = level < LASER_TIERS ? level : randInt(2, LASER_TIERS - 1);
    // evita repetir el mismo nivel dos veces seguidas
    do lv = genLaserLevel(tier);
    while (lv.key === lastKey);
    lastKey = lv.key;
    pieces = new Map();
    inv = { ...lv.inv };
    selected = null;
    busy = false;
    showSol = false;
    const many = lv.ships.length > 1;
    body.innerHTML = `
      <p class="prompt lr-prompt">${many ? "Cada nave tiene que recibir" : "La nave tiene que recibir"} justo su fracción
        <small>Arrastra piezas al tablero · toca una pieza puesta para girarla · sácala del tablero para devolverla. Una nave suma todo lo que le llega.</small></p>
      <svg class="lr-board" data-board viewBox="-4 -4 ${N * CELL + 8} ${N * CELL + 8}" role="img" aria-label="Tablero del láser"></svg>
      <div class="lr-tray" data-tray></div>
      <div class="lr-actions" data-actions>
        <button type="button" class="secondary lr-small" data-clear>↺ Vaciar</button>
        <button type="button" class="secondary lr-small" data-giveup>Me rindo</button>
        <button type="button" class="primary lr-small" data-check>Comprobar</button>
      </div>
      <div class="feedback" data-feedback></div>
      <div class="lr-report" data-report></div>
    `;
    svg = body.querySelector("[data-board]");
    trayEl = body.querySelector("[data-tray]");
    feedback = body.querySelector("[data-feedback]");
    reportEl = body.querySelector("[data-report]");
    actionsEl = body.querySelector("[data-actions]");
    body.querySelector("[data-clear]").addEventListener("click", () => {
      if (busy || finished) return;
      for (const p of pieces.values()) inv[p.t]++;
      pieces.clear();
      refresh();
    });
    body.querySelector("[data-giveup]").addEventListener("click", () => fail(true));
    body.querySelector("[data-check]").addEventListener("click", check);
    bindBoard();
    refresh();
  }

  function cellAt(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / (N * CELL + 8);
    const x = (clientX - rect.left) / scale - 4;
    const y = (clientY - rect.top) / scale - 4;
    if (x < 0 || y < 0 || x >= N * CELL || y >= N * CELL) return null;
    return [Math.floor(y / CELL), Math.floor(x / CELL)];
  }
  function fixedAt(r, c) {
    if (lv.source.r === r && lv.source.c === c) return true;
    if (lv.rocks.some((p) => p.r === r && p.c === c)) return true;
    return lv.ships.some((s) => s.r === r && s.c === c);
  }
  const canPlace = (r, c) => !fixedAt(r, c) && !pieces.has(`${r},${c}`);

  function refresh() {
    const shown = showSol ? solutionPieces(lv) : pieces;
    const sim = simulateLaser(lv, shown);
    if (!busy && !showSol && sim.win) {
      busy = true;
      later(win, 650);
    }
    drawBoard(sim, shown);
    drawTray();
    return sim;
  }

  function drawBoard(sim, shown) {
    let h = "";
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        h += `<rect x="${c * CELL}" y="${r * CELL}" width="${CELL}" height="${CELL}" class="lr-cell" data-cell="${r},${c}"/>`;
    for (const p of lv.rocks) {
      const x = p.c * CELL, y = p.r * CELL;
      h += `<polygon class="lr-rock" data-rock="${p.r},${p.c}" points="${x + 9},${y + 38} ${x + 6},${y + 22} ${x + 17},${y + 9} ${x + 33},${y + 7} ${x + 44},${y + 20} ${x + 42},${y + 38} ${x + 28},${y + 44}"/>`;
    }
    // rayos: primero el halo, luego el núcleo, luego las etiquetas
    const lit = sim.edges.filter((e) => e.val[0] > 0);
    const pathPts = (e) => {
      const pts = e.tr.pts.map(([r, c]) => [cx(c), cx(r)]);
      if (e.tr.end === "off") {
        const [lx, ly] = pts[pts.length - 1];
        pts.push([lx + DC[e.tr.d] * (CELL / 2 + 2), ly + DR[e.tr.d] * (CELL / 2 + 2)]);
      }
      return pts;
    };
    const w = (v) => 1.6 + 9 * (v[0] / v[1]);
    for (const e of lit)
      h += `<polyline class="lr-glow" points="${pathPts(e).join(" ")}" style="stroke-width:${w(e.val) + 7}"/>`;
    for (const e of lit)
      h += `<polyline class="lr-beam" data-beam="${fracText(e.val)}" points="${pathPts(e).join(" ")}" style="stroke-width:${w(e.val)}"/>`;
    // fuente
    {
      const { r, c, d } = lv.source;
      const x = c * CELL, y = r * CELL;
      const tx = cx(c) + DC[d] * 22, ty = cx(r) + DR[d] * 22;
      const px = -DR[d] * 9, py = DC[d] * 9;
      const bx = cx(c) + DC[d] * 10, by = cx(r) + DR[d] * 10;
      h += `<g class="lr-source" data-source="${r},${c}" data-dir="${"NESO"[d]}">
        <polygon points="${tx},${ty} ${bx + px},${by + py} ${bx - px},${by - py}" class="lr-nozzle"/>
        <rect x="${x + 9}" y="${y + 9}" width="${CELL - 18}" height="${CELL - 18}" rx="7" class="lr-srcbox"/>
        <text x="${cx(c)}" y="${cx(r) + 6}" class="lr-srctext">1</text></g>`;
    }
    for (const [k, p] of shown) {
      const [r, c] = k.split(",").map(Number);
      h += `<g data-piece="${k}" data-type="${p.t}">${pieceSvg(p.t, p.o, c * CELL, r * CELL, sim.loopKeys.has(k) ? "lr-loop" : "")}</g>`;
    }
    // etiquetas de fracción sobre cada tramo (en la primera casilla tras la salida)
    for (const e of lit) {
      const pts = pathPts(e);
      const [a, b] = [pts[0], pts[1] || pts[0]];
      const lx = (a[0] + b[0]) / 2 + (e.tr.d % 2 === 0 ? 13 : 0);
      const ly = (a[1] + b[1]) / 2 + (e.tr.d % 2 === 1 ? -11 : 0);
      const txt = fracText(e.val);
      const tw = 8 + txt.length * 7;
      h += `<g class="lr-tag"><rect x="${lx - tw / 2}" y="${ly - 8}" width="${tw}" height="16" rx="5"/><text x="${lx}" y="${ly + 4.5}">${txt}</text></g>`;
    }
    // naves
    lv.ships.forEach((s, i) => {
      const got = sim.recv[i];
      const st = feq(got, s.t) ? "ok" : got[0] > 0 ? "bad" : "none";
      const x = s.c * CELL, y = s.r * CELL;
      h += `<g class="lr-ship lr-${st}" data-ship="${s.name}" data-at="${s.r},${s.c}" data-target="${s.t[0]}/${s.t[1]}" data-state="${st}">
        <path d="M${cx(s.c)} ${y + 4} L${x + CELL - 5} ${cx(s.r)} L${cx(s.c)} ${y + CELL - 4} L${x + 5} ${cx(s.r)} Z" class="lr-hull"/>
        <text x="${cx(s.c)}" y="${cx(s.r) + 6}" class="lr-want">${fracText(s.t)}</text>
        <text x="${x + 6}" y="${y + 12}" class="lr-name">${s.name}</text>
        ${got[0] > 0 && !feq(got, s.t) ? `<g class="lr-got"><rect x="${x + 22}" y="${y + 34}" width="${8 + fracText(got).length * 7}" height="14" rx="4"/><text x="${x + 26 + fracText(got).length * 3.5}" y="${y + 45}">${fracText(got)}</text></g>` : ""}
      </g>`;
    });
    svg.innerHTML = h;
    svg.classList.toggle("lr-locked", busy);
    svg.classList.toggle("lr-solution", showSol);
  }

  function drawTray() {
    trayEl.innerHTML = TRAY.filter((it) => lv.inv[it.t] > 0)
      .map(
        (it) => `<button type="button" class="lr-titem ${selected === it.t ? "lr-sel" : ""}" data-tray-type="${it.t}" ${inv[it.t] ? "" : "disabled"} aria-label="${it.name}">
          <svg viewBox="0 0 ${CELL} ${CELL}" class="lr-ticon">${pieceSvg(it.t, it.t === "k" ? 1 : 0, 0, 0)}</svg>
          <span class="lr-tname">${it.name}</span>
          <span class="lr-tcount" data-count>×${inv[it.t]}</span></button>`
      )
      .join("");
    trayEl.querySelectorAll("[data-tray-type]").forEach((b) => bindTrayItem(b));
  }

  // ---------- Gestos ----------
  function makeGhost(t, o) {
    const g = document.createElement("div");
    g.className = "lr-ghost";
    g.innerHTML = `<svg viewBox="0 0 ${CELL} ${CELL}">${pieceSvg(t, o, 0, 0)}</svg>`;
    document.body.appendChild(g);
    return g;
  }
  function highlight(cell) {
    svg.querySelectorAll(".lr-over").forEach((el) => el.classList.remove("lr-over"));
    if (cell && canPlace(cell[0], cell[1])) svg.querySelector(`[data-cell="${cell[0]},${cell[1]}"]`)?.classList.add("lr-over");
  }

  function bindTrayItem(btn) {
    const t = btn.dataset.trayType;
    btn.addEventListener("pointerdown", (e) => {
      if (busy || finished || !inv[t]) return;
      e.preventDefault();
      btn.setPointerCapture(e.pointerId);
      const sx = e.clientX, sy = e.clientY;
      let ghost = null;
      const o0 = t === "k" ? 1 : 0;
      const move = (ev) => {
        if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
        if (!ghost) ghost = makeGhost(t, o0);
        ghost.style.left = `${ev.clientX}px`;
        ghost.style.top = `${ev.clientY}px`;
        highlight(cellAt(ev.clientX, ev.clientY));
      };
      const up = (ev) => {
        btn.removeEventListener("pointermove", move);
        btn.removeEventListener("pointerup", up);
        btn.removeEventListener("pointercancel", up);
        if (!ghost) {
          // toque: elegir la pieza y luego tocar una casilla
          selected = selected === t ? null : t;
          drawTray();
          return;
        }
        ghost.remove();
        highlight(null);
        const cell = ev.type === "pointerup" ? cellAt(ev.clientX, ev.clientY) : null;
        if (cell && canPlace(cell[0], cell[1])) place(t, o0, cell[0], cell[1]);
      };
      btn.addEventListener("pointermove", move);
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointercancel", up);
    });
  }

  function place(t, o, r, c) {
    pieces.set(`${r},${c}`, { t, o });
    inv[t]--;
    if (!inv[t]) selected = null;
    refresh();
  }

  function bindBoard() {
    svg.addEventListener("pointerdown", (e) => {
      if (busy || finished) return;
      const cell = cellAt(e.clientX, e.clientY);
      if (!cell) return;
      const key = `${cell[0]},${cell[1]}`;
      const p = pieces.get(key);
      if (!p) {
        if (selected && canPlace(cell[0], cell[1])) place(selected, selected === "k" ? 1 : 0, cell[0], cell[1]);
        return;
      }
      e.preventDefault();
      svg.setPointerCapture(e.pointerId);
      const sx = e.clientX, sy = e.clientY;
      let ghost = null;
      const move = (ev) => {
        if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
        if (!ghost) {
          ghost = makeGhost(p.t, p.o);
          svg.querySelector(`[data-piece="${key}"]`)?.classList.add("lr-lifting");
        }
        ghost.style.left = `${ev.clientX}px`;
        ghost.style.top = `${ev.clientY}px`;
        highlight(cellAt(ev.clientX, ev.clientY));
      };
      const up = (ev) => {
        svg.removeEventListener("pointermove", move);
        svg.removeEventListener("pointerup", up);
        svg.removeEventListener("pointercancel", up);
        if (!ghost) {
          // toque: girar la pieza (espejo / ↔ \, combinador gira la flecha)
          if (p.t === "m") p.o = 1 - p.o;
          else if (p.t === "k") p.o = (p.o + 1) % 4;
          refresh();
          return;
        }
        ghost.remove();
        highlight(null);
        if (ev.type !== "pointerup") return refresh();
        const to = cellAt(ev.clientX, ev.clientY);
        if (!to) {
          // fuera del tablero: vuelve a la bandeja
          pieces.delete(key);
          inv[p.t]++;
        } else if (canPlace(to[0], to[1])) {
          pieces.delete(key);
          pieces.set(`${to[0]},${to[1]}`, p);
        }
        refresh();
      };
      svg.addEventListener("pointermove", move);
      svg.addEventListener("pointerup", up);
      svg.addEventListener("pointercancel", up);
    });
  }

  // ---------- Final de ronda ----------
  function win() {
    if (finished) return;
    rounds++;
    score += 10;
    level++;
    renderScore();
    const sim = simulateLaser(lv, pieces);
    feedback.className = "feedback ok";
    feedback.textContent = `¡Circuito perfecto! ${lv.ships.map((s, i) => `${s.name}: ${sim.shipExpr[i]} = ${fracText(s.t)}`).join(" · ")}`;
    later(nextRound, 1500);
  }

  function check() {
    if (busy || finished) return;
    const sim = simulateLaser(lv, pieces);
    if (sim.win) {
      busy = true;
      later(win, 50);
      return;
    }
    fail(false);
  }

  function fail(gaveUp) {
    if (busy || finished) return;
    busy = true;
    rounds++;
    lives--;
    renderLives();
    const sim = refresh();
    const hasK = lv.inv.k > 0;
    feedback.className = "feedback bad";
    feedback.textContent = gaveUp ? "Te has rendido: mira qué faltaba y una solución." : "✗ Aún hay naves que no reciben justo lo que piden.";
    const solSim = simulateLaser(lv, solutionPieces(lv));
    const lines = lv.ships.map((s, i) => {
      const got = sim.recv[i];
      const ok = feq(got, s.t);
      return `<li class="${ok ? "lr-li-ok" : "lr-li-bad"}" data-report-ship="${s.name}"><b>Nave ${s.name}</b>: recibe ${fracText(got)} · pide ${fracText(s.t)}${
        ok ? " ✓" : ` — ${shipAdvice(got, s.t, hasK)}`
      }</li>`;
    });
    const solLines = lv.ships.map((s, i) => `<li>Nave ${s.name}: ${solSim.shipExpr[i]} = ${fracText(solSim.recv[i])}</li>`);
    const loopNote = sim.loopKeys.size ? `<p class="lr-note">⚠ Hay luz que vuelve a una pieza por la que ya pasó: ese bucle se pierde.</p>` : "";
    reportEl.innerHTML = `
      <ul class="lr-list">${lines.join("")}</ul>${loopNote}
      <p class="lr-note"><b>Una solución:</b></p>
      <ul class="lr-list lr-sol" data-sol-lines>${solLines.join("")}</ul>
    `;
    actionsEl.innerHTML = `
      <button type="button" class="secondary lr-small" data-toggle-sol>👁 Ver solución</button>
      <button type="button" class="primary lr-small" data-next>${lives <= 0 ? "Ver resultado →" : "Siguiente →"}</button>`;
    const tog = actionsEl.querySelector("[data-toggle-sol]");
    tog.addEventListener("click", () => {
      showSol = !showSol;
      tog.textContent = showSol ? "↩ Ver mi montaje" : "👁 Ver solución";
      refresh();
    });
    actionsEl.querySelector("[data-next]").addEventListener("click", () => {
      if (finished) return;
      if (lives <= 0) finish(false);
      else nextRound();
    });
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    for (const id of timers) clearTimeout(id);
    timers.clear();
    document.querySelectorAll(".lr-ghost").forEach((g) => g.remove());
    if (userExited) return onExit();
    saveScore(client, "laser", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔦</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} circuitos montados de ${rounds}</p>
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
    level = 0;
    finished = false;
    lastKey = "";
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    for (const id of timers) clearTimeout(id);
    timers.clear();
    document.querySelectorAll(".lr-ghost").forEach((g) => g.remove());
  };
}
