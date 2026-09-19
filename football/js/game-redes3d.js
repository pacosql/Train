// "Fábrica de cajas" — juego grande (por tramos) sobre desarrollos planos
// del cubo y vistas de cuerpos 3D. El jugador PLIEGA desarrollos: pega
// pegatinas para fabricar la caja de un pedido, averigua qué cara queda
// opuesta a cuál, distingue los hexaminós que cierran de los que no y, en
// el reto, lee las vistas (frente / derecha) de un montón de cubos.
//
// Modelo de plegado: la casilla base es la tapa (normal +z; en el papel
// x = este = derecha de la pantalla, y = norte = arriba de la pantalla).
// Al pasar de una casilla a su vecina se dobla la arista hacia abajo: la
// normal nueva es la dirección en la que se avanzaba y esa dirección pasa
// a ser −normal. Si dos casillas acaban con la misma normal, el desarrollo
// no cierra. Mirando el cubo desde el sureste y arriba se ven T (tapa),
// F (delante = sur) y R (derecha = este).
// Progreso persistente (localStorage + football_progress).
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const ROUNDS = { 1: 3, 2: 3, 3: 3, 4: 3 };
const LEVEL_NAMES = { 1: "El pedido", 2: "La cara opuesta", 3: "¿Cierra o no?", 4: "Vistas" };
const STORAGE_KEY = "football_redes3d_progress";
const PLAYER_KEY = "football_player_id";

// ---------------- pegatinas ----------------

export const STICKERS = [
  { id: "estrella", glyph: "⭐", nombre: "estrella", color: "#f5b400" },
  { id: "circulo", glyph: "●", nombre: "círculo", color: "#e5484d" },
  { id: "triangulo", glyph: "▲", nombre: "triángulo", color: "#16a34a" },
  { id: "cuadrado", glyph: "■", nombre: "cuadrado", color: "#2f6fd6" },
  { id: "corazon", glyph: "♥", nombre: "corazón", color: "#ec4899" },
  { id: "rombo", glyph: "◆", nombre: "rombo", color: "#8b5cf6" },
];
const stickerById = (id) => STICKERS.find((s) => s.id === id);
const glyphHtml = (s) => `<span class="cja-g" style="color:${s.color}">${s.glyph}</span>`;

// ---------------- geometría del plegado ----------------

export const V = { T: [0, 0, 1], Bo: [0, 0, -1], R: [1, 0, 0], L: [-1, 0, 0], F: [0, -1, 0], B: [0, 1, 0] };
export const OPPOSITE = { T: "Bo", Bo: "T", R: "L", L: "R", F: "B", B: "F" };
export const FACE_NAMES = { T: "arriba (tapa)", Bo: "abajo (base)", F: "delante", B: "detrás", L: "a la izquierda", R: "a la derecha" };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]; // este, oeste, sur (abajo en pantalla), norte
const neg = (v) => [-v[0], -v[1], -v[2]];
const keyOf = (v) => Object.keys(V).find((k) => V[k][0] === v[0] && V[k][1] === v[1] && V[k][2] === v[2]);
export const det = (a, b, c) => a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);

// Pliega un desarrollo (lista de casillas [x, y]) tomando cells[base] como
// tapa. Devuelve faces[i] (T/Bo/F/B/L/R por casilla) o faces = null si dos
// casillas chocan (collision = [i, j]); frames guarda la orientación y el
// padre de cada casilla en el recorrido (para explicar los caminos).
export function foldNet(cells, base = 0) {
  const idx = new Map(cells.map((c, i) => [c.join(","), i]));
  const frames = new Array(cells.length).fill(null);
  frames[base] = { n: [0, 0, 1], ex: [1, 0, 0], ey: [0, -1, 0], parent: -1, dir: null };
  const faces = new Array(cells.length).fill(null);
  faces[base] = "T";
  const seen = { T: base };
  const queue = [base];
  while (queue.length) {
    const i = queue.shift();
    const [x, y] = cells[i];
    const f = frames[i];
    for (const [dx, dy] of DIRS) {
      const j = idx.get(`${x + dx},${y + dy}`);
      if (j === undefined || frames[j]) continue;
      const n2 = dx === 1 ? f.ex : dx === -1 ? neg(f.ex) : dy === 1 ? f.ey : neg(f.ey);
      const ex2 = dx === 1 ? neg(f.n) : dx === -1 ? f.n : f.ex;
      const ey2 = dy === 1 ? neg(f.n) : dy === -1 ? f.n : f.ey;
      frames[j] = { n: n2, ex: ex2, ey: ey2, parent: i, dir: [dx, dy] };
      const k = keyOf(n2);
      if (seen[k] !== undefined) return { faces: null, collision: [seen[k], j], frames };
      seen[k] = j; faces[j] = k; queue.push(j);
    }
  }
  if (faces.some((f) => f === null)) return { faces: null, collision: null, frames };
  return { faces, collision: null, frames };
}

// ---- hexaminós ----
export function normalize(cells) {
  const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
}
const cellKey = (cells) => normalize(cells).map((c) => c.join(",")).join(";");
export function transforms(cells) {
  const out = [];
  let c = cells;
  for (let r = 0; r < 4; r++) { c = c.map(([x, y]) => [-y, x]); out.push(normalize(c)); out.push(normalize(c.map(([x, y]) => [-x, y]))); }
  return out;
}
export const canon = (cells) => transforms(cells).map(cellKey).sort()[0];
function enumerateHexominoes() {
  let cur = new Map([[cellKey([[0, 0]]), [[0, 0]]]]);
  for (let n = 1; n < 6; n++) {
    const next = new Map();
    for (const cells of cur.values()) {
      const set = new Set(cells.map((c) => c.join(",")));
      for (const [x, y] of cells) for (const [dx, dy] of DIRS) {
        if (set.has(`${x + dx},${y + dy}`)) continue;
        const grown = normalize([...cells, [x + dx, y + dy]]);
        const c = canon(grown);
        if (!next.has(c)) next.set(c, grown);
      }
    }
    cur = next;
  }
  return [...cur.values()];
}
export const HEXOMINOES = enumerateHexominoes(); // 35 hexaminós libres
export const NETS = HEXOMINOES.filter((h) => foldNet(h).faces); // los 11 desarrollos del cubo
export const NON_NETS = HEXOMINOES.filter((h) => !foldNet(h).faces); // los 24 que no cierran

const width = (cells) => Math.max(...cells.map((c) => c[0])) + 1;
const height = (cells) => Math.max(...cells.map((c) => c[1])) + 1;
export function hasLine(cells, n) {
  const set = new Set(cells.map((c) => c.join(",")));
  return cells.some(([x, y]) => Array.from({ length: n }, (_, k) => set.has(`${x + k},${y}`)).every(Boolean) || Array.from({ length: n }, (_, k) => set.has(`${x},${y + k}`)).every(Boolean));
}
export function has2x2(cells) {
  const set = new Set(cells.map((c) => c.join(",")));
  return cells.some(([x, y]) => set.has(`${x + 1},${y}`) && set.has(`${x},${y + 1}`) && set.has(`${x + 1},${y + 1}`));
}
// Orientación al azar, apaisada si se pide (para que quepa a 400 px).
function orient(cells, landscape = true) {
  const all = transforms(cells);
  const wide = landscape ? all.filter((t) => width(t) >= height(t)) : all;
  return pick(wide.length ? wide : all);
}

// Camino en el árbol del desarrollo desde la casilla i (base) hasta la j.
function pathDirs(frames, j) {
  const dirs = [];
  let k = j;
  while (frames[k] && frames[k].parent !== -1) { dirs.unshift(frames[k].dir); k = frames[k].parent; }
  return dirs;
}
// Cómo están colocadas en el desarrollo dos casillas que acaban opuestas.
export function oppositeRelation(cells, i, j) {
  const { frames } = foldNet(cells, i);
  const d = pathDirs(frames, j);
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];
  if (d.length === 2 && same(d[0], d[1])) return "recta";
  if (d.length === 3 && same(d[0], d[2]) && !same(d[0], d[1]) && !same(d[0], neg2(d[1]))) return "z";
  return "zigzag";
}
const neg2 = (d) => [-d[0], -d[1]];
const RELATION_TEXT = { recta: "en el desarrollo están en línea recta con una casilla en medio", z: "en el desarrollo forman un escalón en Z", zigzag: "en el desarrollo van en zigzag: una acaba arriba y la otra abajo" };

// ---------------- generadores ----------------

// Tramo 1: pedido = cubo con 3 pegatinas visibles (T, F, R); el jugador las
// pega en un desarrollo con una fila de 4 (los más reconocibles).
export function genPedidoRound() {
  const cells = orient(pick(NETS.filter((n) => hasLine(n, 4))));
  const [a, b, c] = shuffle(STICKERS).slice(0, 3);
  return { cells, order: { T: a, F: b, R: c } };
}
// Regla del tramo 1: las tres pegatinas deben caer en caras que se tocan
// en un mismo vértice y en el mismo orden de giro que el pedido, es decir,
// det(n_T, n_F, n_R) = +1. Es invariante al girar el cubo. det = 0 ⇒ hay un
// par de caras opuestas; det = −1 ⇒ imagen en espejo.
export function checkPedido(cells, placement) {
  const { faces } = foldNet(cells, 0);
  const fT = faces[placement.T], fF = faces[placement.F], fR = faces[placement.R];
  const d = det(V[fT], V[fF], V[fR]);
  if (d === 1) return { ok: true, kind: "ok", faces: { T: fT, F: fF, R: fR } };
  if (d === -1) return { ok: false, kind: "espejo", faces: { T: fT, F: fF, R: fR } };
  const pairs = [["T", "F"], ["T", "R"], ["F", "R"]];
  const pair = pairs.find(([p, q]) => OPPOSITE[faces[placement[p]]] === faces[placement[q]]);
  return { ok: false, kind: "opuestas", pair, faces: { T: fT, F: fF, R: fR } };
}
// Con la casilla `top` de tapa, gira el cubo alrededor de la vertical para
// que la pegatina `front` quede delante si es posible. Devuelve qué
// pegatina cae en cada cara (sticker por cara).
export function foldedFaces(cells, stickersByCell, top, front) {
  const { faces } = foldNet(cells, top);
  let normals = faces.map((f) => V[f]);
  for (let k = 0; k < 4; k++) {
    const fk = keyOf(normals[front]);
    if (front === undefined || fk === "F" || fk === "T" || fk === "Bo") break;
    normals = normals.map(([x, y, z]) => [-y, x, z]);
  }
  const out = {};
  normals.forEach((n, i) => { if (stickersByCell[i]) out[keyOf(n)] = stickersByCell[i]; });
  return out;
}

// Tramo 2: uno de los 11 desarrollos con 6 pegatinas; ¿cuál queda opuesta a X?
export function genOpuestaRound() {
  const cells = orient(pick(NETS));
  const syms = shuffle(STICKERS);
  const ask = randInt(0, 5);
  const { faces } = foldNet(cells, ask);
  const answer = faces.indexOf("Bo");
  return { cells, syms, ask, answer, relation: oppositeRelation(cells, ask, answer) };
}

// Tramo 3: 4 hexaminós; exactamente uno cierra (modo "si") o exactamente
// uno no cierra (modo "no").
const TREE_NON_NETS = NON_NETS.filter((h) => !has2x2(h));
export function genCierraRound() {
  const mode = pick(["si", "no"]);
  const pickN = (arr, n) => shuffle(arr).slice(0, n);
  const nonPool = Math.random() < 0.3 ? NON_NETS : TREE_NON_NETS;
  const nets = pickN(NETS, mode === "si" ? 1 : 3).map((c) => ({ cells: orient(c, false), closes: true }));
  const nons = pickN(nonPool, mode === "si" ? 3 : 1).map((c) => ({ cells: orient(c, false), closes: false }));
  const shapes = shuffle([...nets, ...nons]);
  const answer = shapes.findIndex((s) => s.closes === (mode === "si"));
  return { mode, shapes, answer };
}
export function whyNoClose(cells) {
  if (hasLine(cells, 5)) return "tiene cinco casillas en línea recta: la quinta cae sobre la primera";
  if (has2x2(cells)) return "tiene cuatro casillas en cuadrado: al plegarlas dos caen en el mismo sitio";
  return "al plegarlo dos casillas acaban sobre la misma cara (se solapan)";
}

// Reto: montón de 3-5 cubos sobre una base 3×3; vista desde el frente o
// desde la derecha. heights[y][x], y = 0 es la fila de delante (sur).
export function views(heights) {
  const frente = [0, 1, 2].map((x) => Math.max(...[0, 1, 2].map((y) => heights[y][x])));
  const derecha = [0, 1, 2].map((y) => Math.max(...heights[y]));
  const sumaFrente = [0, 1, 2].map((x) => [0, 1, 2].reduce((s, y) => s + heights[y][x], 0));
  const sumaDerecha = [0, 1, 2].map((y) => heights[y].reduce((s, v) => s + v, 0));
  return { frente, derecha, sumaFrente, sumaDerecha };
}
function topsVisible(h) {
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
    if (!h[y][x]) continue;
    for (let k = 1; k <= 2; k++) if (x + k <= 2 && y - k >= 0 && h[y - k][x + k] >= h[y][x] + k + 1) return false;
  }
  return true;
}
export function genVistasRound() {
  let guard = 0;
  while (guard++ < 10000) {
    const h = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const total = randInt(3, 5);
    let placed = 0, g2 = 0;
    while (placed < total && g2++ < 100) { const x = randInt(0, 2), y = randInt(0, 2); if (h[y][x] < 3) { h[y][x]++; placed++; } }
    if (placed < total || !topsVisible(h)) continue;
    const vw = views(h);
    const kind = pick(["frente", "derecha"]);
    const correct = vw[kind];
    const other = kind === "frente" ? vw.derecha : vw.frente;
    const suma = kind === "frente" ? vw.sumaFrente : vw.sumaDerecha;
    const same = (a, b) => a.join() === b.join();
    const options = [correct];
    const tryAdd = (o) => { if (o.every((v) => v >= 0 && v <= 3) && o.some((v) => v > 0) && !options.some((p) => same(p, o))) options.push(o); };
    for (const o of shuffle([other, correct.slice().reverse(), suma])) { if (options.length < 4) tryAdd(o); }
    let g3 = 0;
    while (options.length < 4 && g3++ < 200) { const o = correct.slice(); const i = randInt(0, 2); o[i] += pick([-1, 1]); tryAdd(o); }
    if (options.length < 4) continue;
    return { heights: h, kind, correct, options: shuffle(options), total };
  }
  return { heights: [[1, 0, 0], [0, 2, 0], [0, 0, 0]], kind: "frente", correct: [1, 2, 0], options: shuffle([[1, 2, 0], [2, 1, 0], [1, 1, 0], [0, 2, 1]]), total: 3 };
}

// ---------------- dibujo ----------------

// Pegatinas en el cuadrado unidad [0,1]²; se colocan con una matriz afín
// (así la misma forma sirve para el desarrollo y para las caras en isométrica).
function stickerShape(s) {
  const st = `fill="${s.color}" stroke="rgba(0,0,0,0.35)" stroke-width="1" vector-effect="non-scaling-stroke"`;
  switch (s.id) {
    case "estrella": { const pts = []; for (let k = 0; k < 10; k++) { const r = k % 2 ? 0.14 : 0.33, a = -Math.PI / 2 + (k * Math.PI) / 5; pts.push(`${(0.5 + r * Math.cos(a)).toFixed(3)},${(0.5 + r * Math.sin(a)).toFixed(3)}`); } return `<polygon points="${pts.join(" ")}" ${st} />`; }
    case "circulo": return `<circle cx="0.5" cy="0.5" r="0.3" ${st} />`;
    case "triangulo": return `<polygon points="0.5,0.18 0.82,0.8 0.18,0.8" ${st} />`;
    case "cuadrado": return `<rect x="0.22" y="0.22" width="0.56" height="0.56" ${st} />`;
    case "corazon": return `<path d="M0.5 0.82 C0.2 0.62 0.12 0.38 0.3 0.27 C0.4 0.21 0.5 0.28 0.5 0.4 C0.5 0.28 0.6 0.21 0.7 0.27 C0.88 0.38 0.8 0.62 0.5 0.82 Z" ${st} />`;
    default: return `<polygon points="0.5,0.16 0.84,0.5 0.5,0.84 0.16,0.5" ${st} />`;
  }
}
const stickerAt = (s, m, extra = "") => `<g transform="matrix(${m.map((v) => +v.toFixed(2)).join(" ")})" ${extra}>${stickerShape(s)}</g>`;

const CELL = 44, PAD = 6;
// Desarrollo plano. stickers: pegatina por índice de casilla; marks: clase
// extra por casilla; labels: texto por casilla.
function netSvg(cells, { stickers = {}, marks = {}, labels = {}, tappable = false, cell = CELL, cls = "" } = {}) {
  const w = width(cells) * cell + PAD * 2, h = height(cells) * cell + PAD * 2;
  const body = cells.map(([x, y], i) => {
    const px = PAD + x * cell, py = PAD + y * cell;
    const s = stickers[i];
    return `<g class="cja-cell ${tappable ? "cja-cell-tap" : ""} ${marks[i] || ""}" data-cell="${i}" data-cx="${x}" data-cy="${y}" ${s ? `data-sym="${s.id}"` : ""}>
      <rect x="${px}" y="${py}" width="${cell}" height="${cell}" rx="${cell * 0.12}" />
      ${s ? stickerAt(s, [cell * 0.72, 0, 0, cell * 0.72, px + cell * 0.14, py + cell * 0.14]) : ""}
      ${labels[i] ? `<text x="${px + cell / 2}" y="${py + cell * 0.62}" class="cja-label">${labels[i]}</text>` : ""}
    </g>`;
  }).join("");
  return `<svg class="cja-svg ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${body}</svg>`;
}

// Proyección isométrica: viewer al sureste y arriba. x = este, y = norte, z = arriba.
const iso = (W2, H2, CH) => (x, y, z) => [(x + y) * W2, (x - y) * H2 - z * CH];
// Cubo con hasta 3 pegatinas visibles (T, F, R). Las de las caras ocultas se listan aparte.
function cubeSvg(faces, { W2 = 34, H2 = 17, CH = 34, extra = "" } = {}) {
  const P = iso(W2, H2, CH);
  const pts = (arr) => arr.map((p) => P(...p).map((v) => v.toFixed(1)).join(",")).join(" ");
  const top = pts([[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]);
  const front = pts([[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]]);
  const right = pts([[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]]);
  const m = (o, u, v) => { const O = P(...o), U = P(...u), Vv = P(...v); return [U[0] - O[0], U[1] - O[1], Vv[0] - O[0], Vv[1] - O[1], O[0], O[1]]; };
  const inset = (mat) => { const [a, b, c, d, e, f] = mat; return [a * 0.7, b * 0.7, c * 0.7, d * 0.7, e + (a + c) * 0.15, f + (b + d) * 0.15]; };
  const mT = inset(m([0, 1, 1], [1, 1, 1], [0, 0, 1])), mF = inset(m([0, 0, 1], [1, 0, 1], [0, 0, 0])), mR = inset(m([1, 0, 1], [1, 1, 1], [1, 0, 0]));
  const minX = P(0, 0, 0)[0], maxX = P(1, 1, 0)[0], minY = P(0, 1, 1)[1], maxY = P(1, 0, 0)[1];
  const st = (f, mat) => (faces[f] ? stickerAt(faces[f], mat, `data-face="${f}" data-sym="${faces[f].id}"`) : "");
  return `<svg class="cja-svg cja-cube" viewBox="${minX - 3} ${minY - 3} ${maxX - minX + 6} ${maxY - minY + 6}" width="${maxX - minX + 6}" height="${maxY - minY + 6}" ${extra}>
    <polygon points="${top}" class="cja-face cja-face-t" /><polygon points="${front}" class="cja-face cja-face-f" /><polygon points="${right}" class="cja-face cja-face-r" />
    ${st("T", mT)}${st("F", mF)}${st("R", mR)}</svg>`;
}
const HIDDEN_ORDER = ["B", "L", "Bo"];
const hiddenChips = (faces) => HIDDEN_ORDER.filter((f) => faces[f]).map((f) => `<span class="cja-chip">${FACE_NAMES[f]}: ${glyphHtml(faces[f])}</span>`).join("");

// Montón de cubos sobre base 3×3 con el suelo dibujado (heights[y][x]).
function pileSvg(heights) {
  const W2 = 20, H2 = 10, CH = 20;
  const P = iso(W2, H2, CH);
  const pts = (arr) => arr.map((p) => P(...p).map((v) => v.toFixed(1)).join(",")).join(" ");
  let out = "";
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) out += `<polygon points="${pts([[x, y, 0], [x + 1, y, 0], [x + 1, y + 1, 0], [x, y + 1, 0]])}" class="cja-floor" />`;
  const cubes = [];
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) for (let z = 0; z < heights[y][x]; z++) cubes.push([x, y, z]);
  cubes.sort((a, b) => a[0] - a[1] + a[2] - (b[0] - b[1] + b[2]));
  for (const [x, y, z] of cubes) {
    out += `<polygon points="${pts([[x, y, z], [x + 1, y, z], [x + 1, y, z + 1], [x, y, z + 1]])}" class="cja-face cja-face-f" />`;
    out += `<polygon points="${pts([[x + 1, y, z], [x + 1, y + 1, z], [x + 1, y + 1, z + 1], [x + 1, y, z + 1]])}" class="cja-face cja-face-r" />`;
    out += `<polygon points="${pts([[x, y, z + 1], [x + 1, y, z + 1], [x + 1, y + 1, z + 1], [x, y + 1, z + 1]])}" class="cja-face cja-face-t" />`;
  }
  const fm = P(1.5, 0, 0), rm = P(3, 1.5, 0);
  out += `<text x="${fm[0] - 8}" y="${fm[1] + 16}" class="cja-side">frente ⬉</text><text x="${rm[0] + 8}" y="${rm[1] + 16}" class="cja-side cja-side-r">⬈ derecha</text>`;
  const minX = P(0, 0, 0)[0] - 40, maxX = P(3, 3, 0)[0] + 40, minY = P(0, 3, 3)[1] - 4, maxY = P(3, 0, 0)[1] + 24;
  return `<svg class="cja-svg" viewBox="${minX} ${minY} ${maxX - minX} ${maxY - minY}" width="${maxX - minX}" height="${maxY - minY}" data-pile data-heights="${heights.map((r) => r.join(",")).join(";")}">${out}</svg>`;
}
// Vista plana: 3 columnas de cuadraditos (alturas) sobre una línea de suelo.
function viewSvg(cols) {
  const S = 18, G = 3, w = 3 * S + 2 * G + 8, h = 3 * S + 10;
  let out = "";
  cols.forEach((n, i) => { for (let k = 0; k < n; k++) out += `<rect x="${4 + i * (S + G)}" y="${h - 6 - (k + 1) * S}" width="${S}" height="${S}" class="cja-view-cell" />`; });
  out += `<line x1="2" y1="${h - 5}" x2="${w - 2}" y2="${h - 5}" class="cja-view-base" />`;
  return `<svg class="cja-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${out}</svg>`;
}

// ---------------- progreso ----------------

function loadProgress() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : { nivelMax: 0, fallosPorTipo: {}, partidas: 0 }; }
  catch (_) { return { nivelMax: 0, fallosPorTipo: {}, partidas: 0 }; }
}
function playerId() {
  try { let id = localStorage.getItem(PLAYER_KEY); if (!id) { id = `p_${Math.random().toString(36).slice(2, 10)}`; localStorage.setItem(PLAYER_KEY, id); } return id; }
  catch (_) { return "anon"; }
}
async function saveProgress(client, progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* sin almacenamiento */ }
  if (!client) return;
  try { await client.from("football_progress").upsert({ game: "redes3d", player: playerId(), data: progress, updated_at: new Date().toISOString() }); } catch (_) { /* guinda */ }
}

// ---------------- juego ----------------

export function mountRedes3dGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let level = 0;
  let roundIdx = 0;
  let levelReached = 0;
  let errors = [];
  let reviewQueue = [];
  let progress = loadProgress();
  const timers = [];

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats"><span class="lives" data-lives></span><span class="score" data-score>⭐ 0</span></div>
    </div>
    <div class="game-body" data-body></div>`;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");

  const later = (fn, ms) => timers.push(setTimeout(() => { if (!finished) fn(); }, ms));
  const renderLives = () => { livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)); };
  const renderScore = () => { scoreEl.textContent = `⭐ ${score}`; };
  const award = () => { rounds++; score += 10; renderScore(); };
  const feedback = (t, ok) => { const el = body.querySelector("[data-feedback]"); if (el) { el.innerHTML = t; el.className = `feedback ${ok ? "ok" : "bad"}`; } };
  const header = (t, s) => `<p class="prompt">${t}${s ? `<small>${s}</small>` : ""}</p>`;
  const badge = (t) => `<div class="cja-badge">${t}</div>`;
  const recordError = (tipo, explicacion) => errors.push({ tipo, explicacion });
  function loseLife(next) { lives--; renderLives(); if (lives <= 0) later(screenResults, 3000); else later(next, 3000); }
  function nextRound() {
    roundIdx++;
    if (roundIdx >= ROUNDS[level]) {
      levelReached = Math.max(levelReached, level);
      progress.nivelMax = Math.max(progress.nivelMax || 0, level);
      saveProgress(client, progress);
      roundIdx = 0;
      if (level >= 4) screenResults(); else screenMap();
      return;
    }
    startLevel(level);
  }
  function startLevel(l) { level = l; ({ 1: screenPedido, 2: screenOpuesta, 3: screenCierra, 4: screenVistas })[l](); }
  function outcome(ok, tipo, expl, review, retry) {
    locked = true;
    if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : nextRound(); }, 2600); }
    else if (review) { feedback(`No: ${expl} Otra vez.`, false); later(() => { locked = false; retry(); }, 3000); }
    else { recordError(tipo, expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; nextRound(); }); }
  }

  // ---- mapa ----
  function screenMap() {
    locked = false;
    const unlocked = Math.min((progress.nivelMax || 0) + 1, 4);
    const nodes = [1, 2, 3, 4].map((l) => { const done = l <= (progress.nivelMax || 0), open = l <= unlocked; return `<button type="button" class="cja-node ${done ? "cja-node-done" : ""}" data-level="${l}" ${open ? "" : "disabled"}><span class="cja-node-num">${done ? "✓" : l === 4 ? "★" : l}</span><span class="cja-node-name">${l === 4 ? "Reto: " : ""}${LEVEL_NAMES[l]}</span></button>`; }).join("");
    body.innerHTML = `
      ${header("Fábrica de cajas", "Pliega desarrollos para fabricar cubos: qué caras se tocan, cuáles quedan opuestas y qué formas no cierran")}
      <div class="cja-map">${nodes}</div>
      <div class="cja-actions"><button type="button" class="secondary" data-tutorial>Plegar la cruz (tutorial)</button></div>
      <p class="cja-progress">${progress.partidas ? `Partidas: ${progress.partidas}. Tramos superados: ${progress.nivelMax || 0} de 4.` : "Primera vez: mira el tutorial y empieza por el tramo 1."}</p>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-level]").forEach((b) => b.addEventListener("click", () => { roundIdx = 0; startLevel(Number(b.getAttribute("data-level"))); }));
    body.querySelector("[data-tutorial]").addEventListener("click", screenTutorial);
  }

  // ---- tutorial: plegar la cruz ----
  function screenTutorial() {
    // Cruz: fila L T R Bo con B encima de la tapa y F debajo. La tapa (índice 1) ya está plegada.
    const cells = [[0, 1], [1, 1], [2, 1], [3, 1], [1, 0], [1, 2]];
    const syms = shuffle(STICKERS);
    const { faces } = foldNet(cells, 1);
    const folded = new Set([1]);
    const set = new Set(cells.map((c) => c.join(",")));
    const adjacentToFolded = (i) => DIRS.some(([dx, dy]) => { const k = `${cells[i][0] + dx},${cells[i][1] + dy}`; return set.has(k) && folded.has(cells.findIndex((c) => c.join(",") === k)); });
    const cubeFaces = () => { const out = {}; folded.forEach((i) => { out[faces[i]] = syms[i]; }); return out; };
    body.innerHTML = `
      ${badge("Tutorial · plegar la cruz")}
      ${header("La casilla marcada es la tapa. Toca las demás, una a una, para levantarlas", "Cada casilla se dobla por la arista que la une a una casilla ya plegada")}
      <div class="cja-wrap"><div data-net>${netSvg(cells, { stickers: syms, marks: { 1: "cja-cell-on" }, labels: { 1: "tapa" }, tappable: true })}</div><div class="cja-result" data-result>${cubeSvg(cubeFaces())}<div class="cja-chips" data-chips></div></div></div>
      <div class="cja-palette" data-palette></div>
      <div class="cja-actions" data-actions></div>
      <div class="feedback" data-feedback></div>`;
    const bind = () => body.querySelectorAll("[data-net] [data-cell]").forEach((g) => g.addEventListener("click", () => {
      if (locked || finished) return;
      const i = Number(g.getAttribute("data-cell"));
      if (folded.has(i)) return;
      if (!adjacentToFolded(i)) { feedback("Esa casilla no está pegada a ninguna ya plegada: empieza por las que tocan la tapa.", false); return; }
      folded.add(i);
      const marks = {}; folded.forEach((k) => { marks[k] = "cja-cell-on"; });
      body.querySelector("[data-net]").innerHTML = netSvg(cells, { stickers: syms, marks, labels: { 1: "tapa" }, tappable: true });
      bind();
      const cf = cubeFaces();
      body.querySelector("[data-result]").innerHTML = `${cubeSvg(cf)}<div class="cja-chips">${hiddenChips(cf)}</div>`;
      const f = faces[i];
      feedback(`${glyphHtml(syms[i])} se levanta y queda <b>${FACE_NAMES[f]}</b>${["B", "L", "Bo"].includes(f) ? " (no se ve desde aquí)" : ""}.`, true);
      if (folded.size === 6) askOpposite();
    }));
    bind();
    function askOpposite() {
      const ask = syms[1];
      const ansIdx = faces.indexOf("Bo");
      body.querySelector("[data-actions]").innerHTML = `<p class="cja-question">Caja cerrada. ¿Qué pegatina ha quedado <b>opuesta</b> a ${glyphHtml(ask)} (la tapa)?</p>`;
      body.querySelector("[data-palette]").innerHTML = syms.map((s, i) => (i === 1 ? "" : `<button type="button" class="choice-btn cja-stk" data-sticker="${s.id}">${glyphHtml(s)} ${s.nombre}</button>`)).join("");
      body.querySelectorAll("[data-sticker]").forEach((btn) => btn.addEventListener("click", () => {
        if (locked || finished) return;
        locked = true;
        const ok = btn.getAttribute("data-sticker") === syms[ansIdx].id;
        body.querySelectorAll("[data-sticker]").forEach((x) => (x.disabled = true));
        btn.classList.add(ok ? "correct" : "wrong");
        award();
        feedback(`${ok ? "¡Eso es!" : `No: es ${glyphHtml(syms[ansIdx])}.`} ${glyphHtml(ask)} está en la tapa y ${glyphHtml(syms[ansIdx])} en la base: en la cruz están en línea recta con una casilla en medio, y así es como quedan opuestas. Las casillas que se tocan en el desarrollo siguen tocándose en el cubo.`, ok);
        body.querySelector("[data-actions]").innerHTML = `<button type="button" class="primary" data-next>Al tramo 1 →</button>`;
        body.querySelector("[data-next]").addEventListener("click", () => { locked = false; roundIdx = 0; startLevel(1); }, { once: true });
      }));
    }
  }

  // ---- tramo 1: el pedido ----
  function screenPedido(review = false) {
    const r = genPedidoRound();
    const ids = ["T", "F", "R"].map((f) => r.order[f]);
    const placed = {}; // id de pegatina → índice de casilla
    let sel = ids[0].id;
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 1 · ${LEVEL_NAMES[1]} · ${roundIdx + 1} de ${ROUNDS[1]}`)}
      ${header("Pedido: fabrica esta caja", "Pega las 3 pegatinas en el desarrollo para que, al plegarlo, se vean juntas en una esquina igual que en el pedido (da igual cómo gires el cubo)")}
      <div class="cja-wrap"><div class="cja-order" data-order>${cubeSvg(r.order)}<div class="cja-caption">pedido</div></div><div class="cja-result" data-result></div></div>
      <div class="cja-wrap" data-net></div>
      <div class="cja-palette" data-palette></div>
      <div class="cja-actions"><button type="button" class="primary" data-fold disabled>Plegar</button></div>
      <p class="cja-hint">Pista: dos casillas en línea recta con una en medio acaban opuestas; dos casillas pegadas siguen pegadas en el cubo.</p>
      <div class="feedback" data-feedback></div>`;
    const redraw = () => {
      const stickers = {}; Object.entries(placed).forEach(([id, i]) => { stickers[i] = stickerById(id); });
      const marks = {}; if (placed[sel] !== undefined) marks[placed[sel]] = "cja-cell-sel";
      body.querySelector("[data-net]").innerHTML = netSvg(r.cells, { stickers, marks, tappable: true });
      body.querySelector("[data-palette]").innerHTML = ids.map((s) => `<button type="button" class="choice-btn cja-stk ${s.id === sel ? "cja-stk-sel" : ""} ${placed[s.id] !== undefined ? "cja-stk-done" : ""}" data-sticker="${s.id}">${glyphHtml(s)} ${s.nombre}</button>`).join("");
      body.querySelector("[data-fold]").disabled = Object.keys(placed).length < 3;
      body.querySelectorAll("[data-sticker]").forEach((btn) => btn.addEventListener("click", () => { if (locked || finished) return; sel = btn.getAttribute("data-sticker"); redraw(); }));
      body.querySelectorAll("[data-net] [data-cell]").forEach((g) => g.addEventListener("click", () => {
        if (locked || finished) return;
        const i = Number(g.getAttribute("data-cell"));
        const here = Object.keys(placed).find((id) => placed[id] === i);
        if (here) { delete placed[here]; sel = here; }
        else { placed[sel] = i; const next = ids.find((s) => placed[s.id] === undefined); if (next) sel = next.id; }
        redraw();
      }));
    };
    redraw();
    body.querySelector("[data-fold]").addEventListener("click", () => {
      if (locked || finished || Object.keys(placed).length < 3) return;
      const placement = { T: placed[ids[0].id], F: placed[ids[1].id], R: placed[ids[2].id] };
      const res = checkPedido(r.cells, placement);
      const byCell = {}; Object.entries(placed).forEach(([id, i]) => { byCell[i] = stickerById(id); });
      const shown = foldedFaces(r.cells, byCell, placement.T, placement.F);
      body.querySelector("[data-result]").innerHTML = `${cubeSvg(shown)}<div class="cja-caption">tu caja</div><div class="cja-chips">${hiddenChips(shown)}</div>`;
      const g = (f) => glyphHtml(r.order[f]);
      let expl;
      if (res.kind === "ok") expl = `con ${g("T")} de tapa, ${g("F")} queda delante y ${g("R")} a la derecha: las tres se tocan en la misma esquina y giran en el mismo orden que el pedido.`;
      else if (res.kind === "espejo") expl = `las tres pegatinas sí se juntan en una esquina, pero giran al revés: es la imagen en un espejo del pedido (con ${g("T")} de tapa, ${g("F")} y ${g("R")} salen intercambiadas). Cambia dos de ellas de sitio.`;
      else { const [p, q] = res.pair; expl = `así ${g(p)} y ${g(q)} quedan en caras opuestas (${RELATION_TEXT[oppositeRelation(r.cells, placement[p], placement[q])]}) y nunca se ven juntas.`; }
      outcome(res.ok, "colocar pegatinas", expl, review, () => screenPedido(true));
    });
  }

  // ---- tramo 2: la cara opuesta ----
  function screenOpuesta(review = false) {
    const r = genOpuestaRound();
    const ask = r.syms[r.ask];
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 2 · ${LEVEL_NAMES[2]} · ${roundIdx + 1} de ${ROUNDS[2]}`)}
      ${header(`¿Qué pegatina queda <b>opuesta</b> a <span data-ask="${ask.id}">${glyphHtml(ask)}</span> al plegar?`, "Toca esa casilla del desarrollo")}
      <div class="cja-wrap"><div data-net>${netSvg(r.cells, { stickers: r.syms, tappable: true })}</div><div class="cja-result" data-result></div></div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-net] [data-cell]").forEach((g) => g.addEventListener("click", () => {
      if (locked || finished) return;
      const i = Number(g.getAttribute("data-cell"));
      if (i === r.ask) { feedback("Esa es la propia pegatina: busca la que queda enfrente.", false); return; }
      const ok = i === r.answer;
      const marks = { [r.answer]: "cja-cell-on" }; if (!ok) marks[i] = "cja-cell-hit";
      body.querySelector("[data-net]").innerHTML = netSvg(r.cells, { stickers: r.syms, marks });
      const shown = foldedFaces(r.cells, r.syms, r.ask, undefined);
      body.querySelector("[data-result]").innerHTML = `${cubeSvg(shown)}<div class="cja-chips">${hiddenChips(shown)}</div>`;
      const expl = `con ${glyphHtml(ask)} de tapa, ${glyphHtml(r.syms[r.answer])} cae en la base: ${RELATION_TEXT[r.relation]}.${ok ? "" : ` ${glyphHtml(r.syms[i])} queda ${FACE_NAMES[foldNet(r.cells, r.ask).faces[i]]}, tocando a ${glyphHtml(ask)}.`}`;
      outcome(ok, "cara opuesta", expl, review, () => screenOpuesta(true));
    }));
  }

  // ---- tramo 3: ¿cierra o no? ----
  function screenCierra(review = false) {
    const r = genCierraRound();
    const si = r.mode === "si";
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 3 · ${LEVEL_NAMES[3]} · ${roundIdx + 1} de ${ROUNDS[3]}`)}
      ${header(si ? "Solo uno de estos cuatro <b>SÍ</b> cierra formando un cubo. Tócalo" : "Solo uno de estos cuatro <b>NO</b> cierra formando un cubo. Tócalo", "Imagina cada uno plegado: ¿caen sus 6 casillas en 6 caras distintas?")}
      <div class="cja-shapes">${r.shapes.map((s, i) => `<button type="button" class="choice-btn cja-shape" data-shape="${i}">${netSvg(s.cells, { cell: 17 })}</button>`).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-shape]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      const i = Number(btn.getAttribute("data-shape"));
      const ok = i === r.answer;
      body.querySelectorAll("[data-shape]").forEach((b, k) => {
        b.disabled = true;
        const s = r.shapes[k];
        const f = foldNet(s.cells);
        const marks = {};
        if (f.collision) { marks[f.collision[0]] = "cja-cell-hit"; marks[f.collision[1]] = "cja-cell-hit"; } else s.cells.forEach((_, c) => { marks[c] = "cja-cell-on"; });
        b.innerHTML = netSvg(s.cells, { cell: 17, marks });
        if (k === r.answer) b.classList.add("correct");
      });
      if (!ok) btn.classList.add("wrong");
      const chosen = r.shapes[i];
      const expl = ok
        ? (si ? `ese cierra: sus 6 casillas caen en 6 caras distintas; los otros tres se solapan (en rojo, las casillas que chocan).` : `ese no cierra: ${whyNoClose(chosen.cells)} (en rojo). Los otros tres son desarrollos del cubo.`)
        : (chosen.closes ? `el que tocaste sí cierra (sus 6 casillas caen en 6 caras distintas)${si ? "" : "; el que no cierra es el marcado: " + whyNoClose(r.shapes[r.answer].cells)}.` : `el que tocaste no cierra: ${whyNoClose(chosen.cells)} (en rojo)${si ? "; el que sí cierra es el marcado en verde" : ""}.`);
      outcome(ok, "cierra o no", expl, review, () => screenCierra(true));
    }));
  }

  // ---- reto: vistas ----
  function screenVistas(review = false) {
    const r = genVistasRound();
    const kindTxt = r.kind === "frente" ? "el FRENTE" : "la DERECHA";
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Reto · ${LEVEL_NAMES[4]} · ${roundIdx + 1} de ${ROUNDS[4]}`)}
      ${header(`¿Cómo se ve este montón desde <b>${kindTxt}</b>?`, `${review ? "" : "Aquí no se pierden vidas. "}Los cubos de detrás quedan tapados: en cada columna solo cuenta la altura máxima`)}
      <div class="cja-wrap">${pileSvg(r.heights)}</div>
      <div class="cja-views">${r.options.map((o) => `<button type="button" class="choice-btn cja-view" data-opt="${o.join(",")}">${viewSvg(o)}</button>`).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-opt]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      locked = true;
      const v = btn.getAttribute("data-opt");
      const ok = v === r.correct.join(",");
      body.querySelectorAll("[data-opt]").forEach((b) => { b.disabled = true; if (b.getAttribute("data-opt") === r.correct.join(",")) b.classList.add("correct"); });
      if (!ok) btn.classList.add("wrong");
      const vw = views(r.heights);
      const suma = r.kind === "frente" ? vw.sumaFrente : vw.sumaDerecha;
      const expl = `desde ${kindTxt.toLowerCase()} se ve, de izquierda a derecha, la altura máxima de cada fila de columnas: ${r.correct.join(", ")}${!ok && v === suma.join(",") ? " (sumaste los cubos de detrás, pero quedan tapados)" : ""}${!ok && v === r.correct.slice().reverse().join(",") ? " (lo elegiste al revés: desde ese lado la izquierda es la otra)" : ""}.`;
      if (review) outcome(ok, "vistas", expl, true, () => screenVistas(true));
      else {
        if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); } else { recordError("vistas", `Elegiste ${v.replace(/,/g, "-")}; ${expl}`); feedback(`No: ${expl}`, false); }
        later(() => { locked = false; nextRound(); }, 3000);
      }
    }));
  }

  // ---- resultados y repaso ----
  function screenResults() {
    const byType = {};
    errors.forEach((e) => { byType[e.tipo] = (byType[e.tipo] || 0) + 1; });
    progress = { nivelMax: Math.max(progress.nivelMax || 0, levelReached), fallosPorTipo: { ...(progress.fallosPorTipo || {}) }, partidas: (progress.partidas || 0) + 1 };
    Object.entries(byType).forEach(([t, v]) => { progress.fallosPorTipo[t] = (progress.fallosPorTipo[t] || 0) + v; });
    saveProgress(client, progress);
    const items = errors.length ? `<ul class="cja-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>` : `<p class="cja-progress">Sin fallos: pliegas cajas con los ojos cerrados.</p>`;
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos · tramos ${Math.max(levelReached, progress.nivelMax || 0)} de 4`)}
      <div class="cja-learned">Un desarrollo cierra si sus 6 casillas caen en 6 caras distintas: solo 11 de los 35 hexaminós lo consiguen. Dos casillas en línea recta con una en medio (o en escalón en Z) acaban opuestas y nunca se ven juntas; las que se tocan siguen tocándose. Y una vista (frente, derecha) solo enseña la altura máxima de cada fila: lo de detrás queda tapado.</div>
      ${items}
      <div class="cja-actions">${errors.length ? '<button type="button" class="primary" data-review>Repasar lo fallado</button>' : ""}<button type="button" class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }
  function nextReview() {
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    ({ "colocar pegatinas": () => screenPedido(true), "cara opuesta": () => screenOpuesta(true), "cierra o no": () => screenCierra(true), vistas: () => screenVistas(true) }[tipo] || nextReview)();
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "redes3d", { score, rounds });
    body.innerHTML = `
      <div class="end-card"><div>🎁</div><div class="big-score">${score} pts</div><p>${rounds} aciertos · tramos ${Math.max(levelReached, progress.nivelMax || 0)} de 4</p>
        <div class="end-actions"><button class="primary" data-retry>Jugar otra vez</button><button class="secondary" data-menu>Volver al menú</button></div></div>`;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives; score = 0; rounds = 0; finished = false; locked = false;
    level = 0; roundIdx = 0; levelReached = 0; errors = []; reviewQueue = [];
    progress = loadProgress();
    renderLives(); renderScore();
    screenMap();
  }

  start();
  return () => { finished = true; timers.forEach(clearTimeout); };
}
