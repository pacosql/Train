// "Desenreda la red" — Planarity / Untangle (John Tantalo, a partir de una
// idea de Mary Radcliffe). Topología: lo que importa son las CONEXIONES,
// no la forma del dibujo.
//
// Hay una red de puntos unidos por gomas y muchas gomas se cruzan. Se
// ARRASTRAN los puntos (no las líneas) hasta que ninguna goma cruce a
// otra; las que se cruzan se pintan en rojo en vivo y un contador dice
// cuántos cruces quedan. Al llegar a 0 cruces la ronda se gana sola.
//
// Generación garantizada resoluble (método de Tantalo): n rectas en
// posición general; los vértices son sus intersecciones (n·(n−1)/2) y las
// aristas los tramos consecutivos de cada recta (n·(n−2)). Ese dibujo de
// partida ya no tiene cruces (dos tramos de rectas distintas solo se
// tocan en su intersección, que es un vértice), así que la red ES plana;
// luego se barajan los puntos en un círculo. 4 rectas → 6 puntos,
// 5 → 10, 6 → 15.
//
// Nivel "¿se puede?": a veces sale K5, K3,3 o el grafo de Petersen, que
// NO se pueden desenredar, y a veces un señuelo plano que se les parece
// (prisma, octaedro, K5 menos una goma, cubo…). Hay un botón «No se
// puede»; acertarlo en un imposible da +10 y la cuenta de Euler
// (V − E + F = 2 y cada región rodeada por ≥ g gomas → g·F ≤ 2·E);
// pulsarlo en uno resoluble cuesta una vida y se anima la solución.
import { randInt, shuffle, saveScore } from "./utils.js";

const LO = 8; // margen del área de juego (unidades del viewBox 0..100)
const HI = 92;
const HIT = 8; // radio táctil en unidades (≈ 26 px a 330 px de ancho)

// ---------- Geometría ----------
function orient(a, b, c) {
  const v = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  return Math.abs(v) < 1e-9 ? 0 : v > 0 ? 1 : -1;
}
function onSeg(a, b, p) {
  return (
    Math.min(a.x, b.x) - 1e-9 <= p.x && p.x <= Math.max(a.x, b.x) + 1e-9 &&
    Math.min(a.y, b.y) - 1e-9 <= p.y && p.y <= Math.max(a.y, b.y) + 1e-9
  );
}
// ¿Se tocan los segmentos a-b y c-d (sin extremos comunes)? Tocar cuenta
// como cruce: un punto apoyado encima de una goma ajena también la "cruza".
export function segmentsCross(a, b, c, d) {
  const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b);
  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSeg(a, b, c)) return true;
  if (o2 === 0 && onSeg(a, b, d)) return true;
  if (o3 === 0 && onSeg(c, d, a)) return true;
  if (o4 === 0 && onSeg(c, d, b)) return true;
  return false;
}
// Dos gomas que comparten el punto s solo "se cruzan" si van superpuestas.
function adjacentOverlap(s, b, d) {
  if (orient(s, b, d) !== 0) return false;
  return (onSeg(s, b, d) && Math.hypot(d.x - s.x, d.y - s.y) > 1e-9) || (onSeg(s, d, b) && Math.hypot(b.x - s.x, b.y - s.y) > 1e-9);
}
// Devuelve { count, bad: Set de índices de aristas implicadas en algún cruce }.
export function crossings(pos, edges) {
  let count = 0;
  const bad = new Set();
  for (let i = 0; i < edges.length; i++) {
    for (let j = i + 1; j < edges.length; j++) {
      const [a, b] = edges[i];
      const [c, d] = edges[j];
      let hit;
      if (a === c) hit = adjacentOverlap(pos[a], pos[b], pos[d]);
      else if (a === d) hit = adjacentOverlap(pos[a], pos[b], pos[c]);
      else if (b === c) hit = adjacentOverlap(pos[b], pos[a], pos[d]);
      else if (b === d) hit = adjacentOverlap(pos[b], pos[a], pos[c]);
      else hit = segmentsCross(pos[a], pos[b], pos[c], pos[d]);
      if (hit) {
        count++;
        bad.add(i);
        bad.add(j);
      }
    }
  }
  return { count, bad };
}

// Lleva las posiciones al cuadrado [LO+3, HI−3] (transformación afín por
// ejes: conserva rectas e intersecciones, así que un dibujo plano sigue
// siéndolo).
function fitBox(pts) {
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const a = LO + 3, b = HI - 3;
  return pts.map((p) => ({ x: a + ((p.x - x0) / (x1 - x0 || 1)) * (b - a), y: a + ((p.y - y0) / (y1 - y0 || 1)) * (b - a) }));
}
function distPointSeg(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
// Dibujo "legible": puntos separados y ningún punto pegado a una goma ajena.
export function drawingQuality(pos, edges) {
  let minV = Infinity, minE = Infinity;
  for (let i = 0; i < pos.length; i++)
    for (let j = i + 1; j < pos.length; j++) minV = Math.min(minV, Math.hypot(pos[i].x - pos[j].x, pos[i].y - pos[j].y));
  for (let v = 0; v < pos.length; v++)
    for (const [a, b] of edges) if (a !== v && b !== v) minE = Math.min(minE, distPointSeg(pos[v], pos[a], pos[b]));
  return { minV, minE };
}

// ¿Alguna goma que toca el punto v cruza a otra? (para mover v sin
// estropear un dibujo plano).
function touchesCross(pos, edges, inc, v) {
  for (const i of inc[v]) {
    const [a, b] = edges[i];
    for (let j = 0; j < edges.length; j++) {
      if (j === i) continue;
      const [c, d] = edges[j];
      let hit;
      if (a === c) hit = adjacentOverlap(pos[a], pos[b], pos[d]);
      else if (a === d) hit = adjacentOverlap(pos[a], pos[b], pos[c]);
      else if (b === c) hit = adjacentOverlap(pos[b], pos[a], pos[d]);
      else if (b === d) hit = adjacentOverlap(pos[b], pos[a], pos[c]);
      else hit = segmentsCross(pos[a], pos[b], pos[c], pos[d]);
      if (hit) return true;
    }
  }
  return false;
}

// Relajación por fuerzas que solo acepta pasos que mantienen 0 cruces:
// los puntos se repelen entre sí y de las gomas ajenas, las gomas tiran
// un poco y las paredes empujan hacia dentro.
export function relax(start, edges, iters = 160) {
  const n = start.length;
  const p = start.map((c) => ({ ...c }));
  const inc = Array.from({ length: n }, () => []);
  const adj = Array.from({ length: n }, () => []);
  edges.forEach(([a, b], i) => { inc[a].push(i); inc[b].push(i); adj[a].push(b); adj[b].push(a); });
  const a0 = LO + 3, b0 = HI - 3;
  for (let it = 0; it < iters; it++) {
    const temp = 4 * (1 - it / iters) + 0.4;
    for (let v = 0; v < n; v++) {
      let fx = 0, fy = 0;
      for (let u = 0; u < n; u++) {
        if (u === v) continue;
        const dx = p[v].x - p[u].x, dy = p[v].y - p[u].y;
        const d2 = Math.max(dx * dx + dy * dy, 1);
        const d = Math.sqrt(d2);
        fx += (dx / d) * (300 / d2);
        fy += (dy / d) * (300 / d2);
      }
      for (const u of adj[v]) {
        fx += (p[u].x - p[v].x) * 0.01;
        fy += (p[u].y - p[v].y) * 0.01;
      }
      for (const [a, b] of edges) {
        if (a === v || b === v) continue;
        const ex = p[b].x - p[a].x, ey = p[b].y - p[a].y;
        const t = Math.max(0, Math.min(1, ((p[v].x - p[a].x) * ex + (p[v].y - p[a].y) * ey) / (ex * ex + ey * ey || 1)));
        const qx = p[v].x - (p[a].x + t * ex), qy = p[v].y - (p[a].y + t * ey);
        const d = Math.hypot(qx, qy);
        if (d < 12 && d > 1e-6) {
          fx += (qx / d) * (12 - d) * 0.25;
          fy += (qy / d) * (12 - d) * 0.25;
        }
      }
      fx += Math.max(0, a0 + 6 - p[v].x) * 0.3 - Math.max(0, p[v].x - (b0 - 6)) * 0.3;
      fy += Math.max(0, a0 + 6 - p[v].y) * 0.3 - Math.max(0, p[v].y - (b0 - 6)) * 0.3;
      const f = Math.hypot(fx, fy);
      if (f < 1e-6) continue;
      const step = Math.min(temp, f);
      const old = p[v];
      p[v] = { x: Math.max(a0, Math.min(b0, old.x + (fx / f) * step)), y: Math.max(a0, Math.min(b0, old.y + (fy / f) * step)) };
      if (touchesCross(p, edges, inc, v)) p[v] = old;
    }
  }
  return p;
}

// ---------- Generador de Tantalo ----------
export function tantaloGraph(nLines) {
  for (let tries = 0; tries < 2000; tries++) {
    const base = Math.random() * Math.PI;
    const order = shuffle([...Array(nLines).keys()]);
    const lines = order.map((k) => {
      const ang = base + ((k + (Math.random() - 0.5) * 0.5) * Math.PI) / nLines;
      const off = (Math.random() - 0.5) * 30;
      const d = { x: Math.cos(ang), y: Math.sin(ang) };
      return { p: { x: 50 - d.y * off, y: 50 + d.x * off }, d, hits: [] };
    });
    const pts = [];
    let ok = true;
    for (let i = 0; i < nLines && ok; i++)
      for (let j = i + 1; j < nLines; j++) {
        const L = lines[i], M = lines[j];
        const den = L.d.x * M.d.y - L.d.y * M.d.x;
        if (Math.abs(den) < 0.15) { ok = false; break; } // casi paralelas
        const wx = M.p.x - L.p.x, wy = M.p.y - L.p.y;
        const t = (wx * M.d.y - wy * M.d.x) / den;
        const s = (wx * L.d.y - wy * L.d.x) / den;
        const id = pts.length;
        pts.push({ x: L.p.x + t * L.d.x, y: L.p.y + t * L.d.y });
        L.hits.push({ t, id });
        M.hits.push({ t: s, id });
      }
    if (!ok) continue;
    const edges = [];
    for (const L of lines) {
      L.hits.sort((u, v) => u.t - v.t);
      for (let k = 0; k + 1 < L.hits.length; k++) edges.push([L.hits[k].id, L.hits[k + 1].id]);
    }
    const raw = fitBox(pts);
    if (crossings(raw, edges).count !== 0) continue; // por seguridad numérica
    // Las intersecciones salen apelotonadas: se esponja el dibujo sin
    // crear ningún cruce para que la solución animada se lea bien.
    const sol = relax(raw, edges);
    const q = drawingQuality(sol, edges);
    if (q.minV < 9 || q.minE < 3) continue;
    if (crossings(sol, edges).count !== 0) continue;
    return { sol, edges, name: null };
  }
  throw new Error("tantalo: sin dibujo legible");
}

// ---------- Grafos de "¿se puede?" ----------
// Las coordenadas son un dibujo plano (señuelos) o un dibujo cualquiera
// (imposibles: no existe ninguno sin cruces).
const ring = (n, r, rot = -Math.PI / 2, cx = 50, cy = 50) =>
  Array.from({ length: n }, (_, k) => ({ x: cx + r * Math.cos(rot + (2 * Math.PI * k) / n), y: cy + r * Math.sin(rot + (2 * Math.PI * k) / n) }));
const cyc = (ids) => ids.map((v, k) => [v, ids[(k + 1) % ids.length]]);

export const SPECIAL = {
  k5: () => ({
    name: "K5", plain: "5 puntos unidos todos con todos",
    possible: false,
    sol: ring(5, 40),
    edges: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4], [2, 3], [2, 4], [3, 4]],
  }),
  k33: () => ({
    name: "K3,3", plain: "3 casas unidas cada una a 3 pozos",
    possible: false,
    groups: [0, 0, 0, 1, 1, 1],
    sol: [{ x: 15, y: 20 }, { x: 50, y: 20 }, { x: 85, y: 20 }, { x: 15, y: 80 }, { x: 50, y: 80 }, { x: 85, y: 80 }],
    edges: [[0, 3], [0, 4], [0, 5], [1, 3], [1, 4], [1, 5], [2, 3], [2, 4], [2, 5]],
  }),
  petersen: () => ({
    name: "el grafo de Petersen", plain: "10 puntos y 15 gomas sin ningún ciclo de menos de 5",
    possible: false,
    sol: [...ring(5, 42), ...ring(5, 20)],
    edges: [...cyc([0, 1, 2, 3, 4]), [0, 5], [1, 6], [2, 7], [3, 8], [4, 9], [5, 7], [7, 9], [9, 6], [6, 8], [8, 5]],
  }),
  prism: () => ({
    name: "un prisma", possible: true,
    sol: [{ x: 50, y: 8 }, { x: 92, y: 86 }, { x: 8, y: 86 }, { x: 50, y: 42 }, { x: 64, y: 66 }, { x: 36, y: 66 }],
    edges: [...cyc([0, 1, 2]), ...cyc([3, 4, 5]), [0, 3], [1, 4], [2, 5]],
  }),
  octa: () => ({
    name: "un octaedro", possible: true,
    sol: [{ x: 50, y: 8 }, { x: 92, y: 88 }, { x: 8, y: 88 }, { x: 50, y: 70 }, { x: 35, y: 44 }, { x: 65, y: 44 }],
    edges: [...cyc([0, 1, 2]), ...cyc([3, 4, 5]), [0, 4], [0, 5], [1, 3], [1, 5], [2, 3], [2, 4]],
  }),
  k5e: () => ({
    name: "K5 con una goma menos", possible: true,
    sol: [{ x: 10, y: 90 }, { x: 90, y: 90 }, { x: 50, y: 52 }, { x: 50, y: 8 }, { x: 46, y: 77 }],
    edges: [[0, 1], [0, 2], [1, 2], [0, 3], [1, 3], [2, 3], [0, 4], [1, 4], [2, 4]],
  }),
  wheel: () => ({
    name: "una rueda", possible: true,
    sol: [{ x: 50, y: 50 }, ...ring(5, 40)],
    edges: [...cyc([1, 2, 3, 4, 5]), [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
  }),
  k33e: () => ({
    name: "K3,3 con una goma menos", possible: true,
    groups: [0, 0, 0, 1, 1, 1],
    // a0 a1 a2 | b0 b1 b2; falta a2-b2.
    sol: [{ x: 22, y: 22 }, { x: 78, y: 78 }, { x: 46, y: 52 }, { x: 78, y: 22 }, { x: 22, y: 78 }, { x: 94, y: 6 }],
    edges: [[0, 3], [0, 4], [0, 5], [1, 3], [1, 4], [1, 5], [2, 3], [2, 4]],
  }),
  cube: () => ({
    name: "un cubo", possible: true,
    sol: [{ x: 10, y: 10 }, { x: 90, y: 10 }, { x: 90, y: 90 }, { x: 10, y: 90 }, { x: 34, y: 34 }, { x: 66, y: 34 }, { x: 66, y: 66 }, { x: 34, y: 66 }],
    edges: [...cyc([0, 1, 2, 3]), ...cyc([4, 5, 6, 7]), [0, 4], [1, 5], [2, 6], [3, 7]],
  }),
};
const IMPOSSIBLE = ["k5", "k33", "k5", "k33", "petersen"];
const DECOYS = ["prism", "octa", "k5e", "wheel", "k33e", "cube", "t4", "t5"];

// Ciclo más corto (cintura) por BFS desde cada vértice.
export function girth(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
  let best = Infinity;
  for (let s = 0; s < n; s++) {
    const dist = Array(n).fill(-1), par = Array(n).fill(-1);
    dist[s] = 0;
    const q = [s];
    for (let h = 0; h < q.length; h++) {
      const u = q[h];
      for (const w of adj[u]) {
        if (dist[w] < 0) { dist[w] = dist[u] + 1; par[w] = u; q.push(w); }
        else if (par[u] !== w) best = Math.min(best, dist[u] + dist[w] + 1);
      }
    }
  }
  return best;
}

// Baraja los puntos en un círculo con suficientes cruces.
export function scramble(n, edges, minCross) {
  const slots = ring(n, 40, Math.random() * 2 * Math.PI);
  let best = null;
  for (let t = 0; t < 400; t++) {
    const perm = shuffle(slots);
    const c = crossings(perm, edges).count;
    if (!best || c > best.c) best = { perm, c };
    if (c >= minCross) return perm;
  }
  return best.perm;
}

// Ronda según el nivel (sube al ganar).
export function buildRound(level) {
  let g, limit = 0, ask = false;
  if (level <= 2) g = tantaloGraph(level + 4);
  else if (level === 3) { g = tantaloGraph(5); limit = 10; }
  else {
    ask = true;
    const key = Math.random() < 0.5 ? IMPOSSIBLE[randInt(0, IMPOSSIBLE.length - 1)] : DECOYS[randInt(0, DECOYS.length - 1)];
    if (key === "t4" || key === "t5") g = { ...tantaloGraph(key === "t4" ? 4 : 5), possible: true };
    else {
      g = SPECIAL[key]();
      g.sol = fitBox(g.sol);
    }
  }
  if (g.possible === undefined) g.possible = true;
  const n = g.sol.length;
  const minCross = Math.max(2, Math.round(g.edges.length / 4));
  return { ...g, n, limit, ask, start: scramble(n, g.edges, minCross) };
}

// Cuenta de Euler para la explicación: F = 2 − V + E regiones, cada una
// rodeada por ≥ g gomas y cada goma separa 2 regiones → g·F ≤ 2·E.
export function eulerText(r) {
  const V = r.n, E = r.edges.length, F = 2 - V + E, g = girth(V, r.edges);
  const need = g * F, have = 2 * E;
  const ring = g === 3 ? "3 (un triángulo)" : g === 4 ? "4 (aquí no hay triángulos)" : `${g} (el ciclo más corto tiene ${g})`;
  return { V, E, F, g, need, have, text: `V = ${V}, E = ${E} → F = 2 − ${V} + ${E} = ${F} regiones. Cada región la rodean al menos ${ring} gomas y cada goma toca 2 regiones: ${g}·${F} = ${need} ${need > have ? ">" : "≤"} 2·${E} = ${have}.` };
}

export function mountDesenredaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let busy = false;
  let round = null;
  let pos = [];
  let moves = 0;
  let pending = null;
  let raf = 0;
  let drag = null;

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

  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const q = (s) => body.querySelector(s);

  function nextRound() {
    round = buildRound(level);
    pos = round.start.map((p) => ({ ...p }));
    moves = 0;
    busy = false;
    const hint = round.ask
      ? "Ojo: algunas redes NO se pueden desenredar. Si es imposible, pulsa «No se puede»."
      : round.limit
        ? `Como mucho ${round.limit} movimientos: piensa antes de mover.`
        : "Arrastra los puntos hasta que ninguna goma se cruce";
    body.innerHTML = `
      <p class="prompt dr-prompt">${round.ask ? "¿Se puede desenredar?" : "Desenreda la red"}<small>${hint}</small></p>
      <div class="dr-status"><span class="dr-cross" data-cross></span><span class="dr-moves" data-moves></span></div>
      <svg class="dr-board" data-board viewBox="0 0 100 100" role="img" aria-label="Red de puntos y gomas">
        <rect class="dr-bg" x="1" y="1" width="98" height="98" rx="4"></rect>
        <g data-edges>${round.edges.map(([a, b], i) => `<line class="dr-edge" data-e="${i}" data-a="${a}" data-b="${b}"></line>`).join("")}</g>
        <g data-verts>${pos.map((_, i) => `<g class="dr-v" data-v="${i}"><circle class="dr-hit" r="${HIT}"></circle><circle class="dr-dot" r="4.2"></circle></g>`).join("")}</g>
      </svg>
      <div class="dr-actions">
        <button type="button" class="secondary dr-give" data-give>🏳️ Me rindo</button>
        ${round.ask ? `<button type="button" class="primary dr-no" data-no>🚫 No se puede</button>` : ""}
      </div>
      <div class="feedback dr-feedback" data-feedback></div>
      <div class="dr-why" data-why hidden></div>
      <button type="button" class="primary dr-next" data-next hidden>Siguiente →</button>
    `;
    q("[data-give]").addEventListener("click", giveUp);
    if (round.ask) q("[data-no]").addEventListener("click", sayImpossible);
    q("[data-next]").addEventListener("click", () => {
      if (!finished) nextRound();
    });
    bindDrag();
    paint();
  }

  // Pinta posiciones y cruces (sin rehacer el SVG: va en vivo al arrastrar).
  function paint() {
    const { count, bad } = crossings(pos, round.edges);
    body.querySelectorAll(".dr-edge").forEach((l) => {
      const a = pos[+l.dataset.a], b = pos[+l.dataset.b];
      l.setAttribute("x1", a.x.toFixed(2));
      l.setAttribute("y1", a.y.toFixed(2));
      l.setAttribute("x2", b.x.toFixed(2));
      l.setAttribute("y2", b.y.toFixed(2));
      l.classList.toggle("dr-bad", bad.has(+l.dataset.e));
    });
    body.querySelectorAll(".dr-v").forEach((g) => {
      const p = pos[+g.dataset.v];
      g.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
    });
    const cr = q("[data-cross]");
    cr.textContent = `✂️ Cruces: ${count}`;
    cr.classList.toggle("dr-zero", count === 0);
    q("[data-moves]").textContent = round.limit ? `Movimientos: ${moves}/${round.limit}` : `Movimientos: ${moves}`;
    return count;
  }

  function toBoard(ev) {
    const r = q("[data-board]").getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * 100, y: ((ev.clientY - r.top) / r.height) * 100 };
  }

  function bindDrag() {
    const svg = q("[data-board]");
    svg.addEventListener("pointerdown", (e) => {
      if (busy || finished) return;
      const p = toBoard(e);
      let best = -1, bd = HIT + 1;
      pos.forEach((v, i) => {
        const d = Math.hypot(v.x - p.x, v.y - p.y);
        if (d < bd) { bd = d; best = i; }
      });
      if (best < 0) return;
      e.preventDefault();
      svg.setPointerCapture(e.pointerId);
      drag = { id: best, pid: e.pointerId, dx: pos[best].x - p.x, dy: pos[best].y - p.y, from: { ...pos[best] } };
      svg.querySelector(`[data-v="${best}"]`).classList.add("dr-lift");
    });
    svg.addEventListener("pointermove", (e) => {
      if (!drag || e.pointerId !== drag.pid || busy) return;
      const p = toBoard(e);
      pos[drag.id] = { x: Math.max(LO - 3, Math.min(HI + 3, p.x + drag.dx)), y: Math.max(LO - 3, Math.min(HI + 3, p.y + drag.dy)) };
      paint();
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.pid) return;
      const d = drag;
      drag = null;
      svg.querySelector(`[data-v="${d.id}"]`)?.classList.remove("dr-lift");
      if (busy || finished) return;
      if (Math.hypot(pos[d.id].x - d.from.x, pos[d.id].y - d.from.y) > 0.8) moves++;
      const c = paint();
      afterMove(c);
    };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
  }

  function afterMove(c) {
    if (c === 0) return win("¡Desenredada! Ninguna goma se cruza.");
    if (round.limit && moves >= round.limit) {
      fail(`✗ Se acabaron los ${round.limit} movimientos y quedan ${c} cruces. Así queda sin cruces (cada punto se mueve una sola vez):`);
    }
  }

  function setFeedback(text, ok) {
    const f = q("[data-feedback]");
    f.textContent = text;
    f.className = `feedback dr-feedback ${ok ? "ok" : "bad"}`;
  }
  function showWhy(html) {
    const w = q("[data-why]");
    w.innerHTML = html;
    w.hidden = false;
  }
  function lockButtons() {
    body.querySelectorAll("[data-give],[data-no]").forEach((b) => (b.disabled = true));
  }

  function win(msg) {
    busy = true;
    rounds++;
    score += 10;
    level++;
    renderScore();
    lockButtons();
    q("[data-board]").classList.add("dr-solved");
    setFeedback(`${msg} +10`, true);
    pending = setTimeout(() => !finished && nextRound(), 1300);
  }

  // Pierde una vida; si la red era resoluble, anima su dibujo sin cruces.
  function fail(msg, why) {
    busy = true;
    rounds++;
    lives--;
    renderLives();
    lockButtons();
    setFeedback(msg, false);
    if (why) showWhy(why);
    const after = () => {
      if (finished) return;
      if (lives <= 0) pending = setTimeout(() => finish(false), 1600);
      else q("[data-next]").hidden = false;
    };
    if (round.possible) animateTo(round.sol, after);
    else after();
  }

  function animateTo(target, done) {
    const from = pos.map((p) => ({ ...p }));
    const t0 = performance.now();
    const dur = 1100;
    const step = (now) => {
      if (finished) return;
      const t = Math.min(1, (now - t0) / dur);
      const k = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      pos = from.map((p, i) => ({ x: p.x + (target[i].x - p.x) * k, y: p.y + (target[i].y - p.y) * k }));
      paint();
      if (t < 1) raf = requestAnimationFrame(step);
      else {
        raf = 0;
        q("[data-board]").classList.add("dr-shown");
        done();
      }
    };
    raf = requestAnimationFrame(step);
  }

  function colorGroups() {
    if (!round.groups) return;
    body.querySelectorAll(".dr-v").forEach((g) => g.classList.add(round.groups[+g.dataset.v] ? "dr-g1" : "dr-g0"));
  }

  function giveUp() {
    if (busy || finished) return;
    if (round.possible) {
      fail("✗ Te rindes. Mira: se podía dejar así, sin ningún cruce.");
    } else {
      colorGroups();
      const e = eulerText(round);
      fail(
        `✗ Esta red era ${round.name} y no se puede desenredar: había que pulsar «No se puede».`,
        `<b>¿Por qué?</b> Si se pudiera, V − E + F = 2. ${e.text} Imposible: siempre quedará al menos un cruce.`
      );
    }
  }

  function sayImpossible() {
    if (busy || finished) return;
    const e = eulerText(round);
    if (!round.possible) {
      busy = true;
      rounds++;
      score += 10;
      level++;
      renderScore();
      lockButtons();
      colorGroups();
      q("[data-board]").classList.add("dr-proof");
      setFeedback(`¡Bien visto! Es ${round.name} (${round.plain}): no se puede. +10`, true);
      showWhy(`<b>La cuenta de Euler:</b> si se pudiera, V − E + F = 2. ${e.text} Contradicción: siempre queda al menos un cruce.`);
      q("[data-next]").hidden = false;
      return;
    }
    fail(
      "✗ Sí se podía: mira cómo queda sin cruces.",
      `<b>Euler no lo prohíbe:</b> ${e.text} Que una red tenga muchas gomas no basta; hay que hacer la cuenta.`
    );
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    cancelAnimationFrame(raf);
    drag = null;
    if (userExited) return onExit();
    saveScore(client, "desenreda", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🕸️</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} redes resueltas</p>
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
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimeout(pending);
    cancelAnimationFrame(raf);
    drag = null;
  };
}
