// "Corta a partes iguales" (inspirado en Slice It!, de Com2uS).
//
// Una figura sobre cuadrícula tenue y un encargo: "3 trozos iguales,
// 2 cortes". Deslizar el dedo en línea recta de lado a lado de la figura
// traza un corte (la recta se prolonga sola). Antes de cortar se puede
// afinar cada corte arrastrando sus tiradores (●, se mueven a media
// velocidad del dedo y se imantan a los nudos de media cuadrícula) o
// borrarlo. Con "¡Corta!" las piezas se separan y cada una enseña su
// área en cuadritos.
//
// LA CORRECCIÓN ES POR PROPIEDAD: se recortan los polígonos con
// semiplanos (Sutherland–Hodgman), se miden con la fórmula del cordón y
// se acepta si salen N piezas y todas miden total/N ±3 %. Nunca se
// compara con una solución guardada (la solución guardada solo se dibuja
// al fallar, para enseñar una forma buena de hacerlo).
import { randInt, pick, saveScore } from "./utils.js";

const TOL = 0.03; // ±3 % del área que toca a cada trozo
const MARGIN = 1.2; // margen alrededor de la figura (en cuadritos)
const SNAP_R = 0.2; // radio del imán a la media cuadrícula
const GAIN = 0.5; // los tiradores van a media velocidad del dedo
const EPS = 1e-9;
const LEVELS = ["bar2", "bar3", "bar4", "rect4", "L2", "tri3", "tripar"];

// ---------- Geometría ----------
const P = (x, y) => ({ x, y });
const sub = (a, b) => P(a.x - b.x, a.y - b.y);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Recta a partir de dos puntos: punto de paso y dirección unitaria.
function lineOf(cut) {
  const d = sub(cut.b, cut.a);
  const n = Math.hypot(d.x, d.y) || 1;
  return { p: cut.a, d: P(d.x / n, d.y / n) };
}
// Distancia con signo de un punto a la recta (positiva a un lado).
const sideOf = (L, q) => L.d.x * (q.y - L.p.y) - L.d.y * (q.x - L.p.x);
const along = (L, q) => L.d.x * (q.x - L.p.x) + L.d.y * (q.y - L.p.y);
const atT = (L, t) => P(L.p.x + L.d.x * t, L.p.y + L.d.y * t);

// Fórmula del cordón (área sin signo).
export function polyArea(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}
function centroid(poly) {
  let s = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const c = a.x * b.y - b.x * a.y;
    s += c;
    cx += (a.x + b.x) * c;
    cy += (a.y + b.y) * c;
  }
  if (Math.abs(s) < EPS) return poly[0];
  return P(cx / (3 * s), cy / (3 * s));
}
function isConvex(poly) {
  let sign = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const c = poly[(i + 2) % poly.length];
    const z = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (Math.abs(z) < EPS) continue;
    if (sign === 0) sign = Math.sign(z);
    else if (Math.sign(z) !== sign) return false;
  }
  return true;
}
// Dentro estricto (rayo horizontal), descartando puntos sobre el borde.
function insideStrict(poly, q, tol = 1e-7) {
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const ab = sub(b, a);
    const len2 = ab.x * ab.x + ab.y * ab.y;
    const t = Math.max(0, Math.min(1, ((q.x - a.x) * ab.x + (q.y - a.y) * ab.y) / len2));
    if (dist(q, P(a.x + ab.x * t, a.y + ab.y * t)) < tol) return false;
  }
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > q.y !== b.y > q.y && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
// Tramos [t0, t1] de la recta que quedan DENTRO del polígono.
export function chordsOf(poly, L) {
  const ts = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = sideOf(L, a);
    const sb = sideOf(L, b);
    if (Math.abs(sa) < EPS) ts.push(along(L, a));
    if ((sa > EPS && sb < -EPS) || (sa < -EPS && sb > EPS)) {
      const k = sa / (sa - sb);
      ts.push(along(L, P(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k)));
    }
  }
  ts.sort((u, v) => u - v);
  const uniq = ts.filter((t, i) => i === 0 || t - ts[i - 1] > 1e-7);
  const out = [];
  for (let i = 0; i + 1 < uniq.length; i++) {
    if (!insideStrict(poly, atT(L, (uniq[i] + uniq[i + 1]) / 2))) continue;
    const last = out[out.length - 1];
    if (last && Math.abs(last[1] - uniq[i]) < 1e-7) last[1] = uniq[i + 1];
    else out.push([uniq[i], uniq[i + 1]]);
  }
  return out;
}
// Recorte por semiplano (Sutherland–Hodgman): se queda con sgn·lado ≥ 0.
function clipHalf(poly, L, sgn) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = sgn * sideOf(L, a);
    const sb = sgn * sideOf(L, b);
    if (sa >= -EPS) out.push(a);
    if ((sa > EPS && sb < -EPS) || (sa < -EPS && sb > EPS)) {
      const k = sa / (sa - sb);
      out.push(P(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k));
    }
  }
  return out;
}

// Evalúa unos cortes sobre la ronda. Devuelve un rechazo (no cuesta vida)
// o las piezas con su área y si el reparto es correcto.
export function evaluateCortes(round, cuts) {
  for (let i = 0; i < cuts.length; i++) {
    const ch = chordsOf(round.poly, lineOf(cuts[i]));
    const len = ch.reduce((s, [a, b]) => s + b - a, 0);
    if (!ch.length || len < 0.3) return { reject: "cross", index: i };
  }
  let pieces = [round.poly];
  for (let i = 0; i < cuts.length; i++) {
    const L = lineOf(cuts[i]);
    const next = [];
    for (const pc of pieces) {
      const ch = chordsOf(pc, L);
      if (!ch.length) {
        next.push(pc);
        continue;
      }
      // Un corte recto parte un polígono convexo en 2 como mucho; en uno
      // no convexo (la L) podría sacar 3 trozos: eso no vale.
      if (ch.length > 1 && !isConvex(pc)) return { reject: "concave", index: i };
      const a = clipHalf(pc, L, 1);
      const b = clipHalf(pc, L, -1);
      if (a.length >= 3 && b.length >= 3 && polyArea(a) > 1e-6 && polyArea(b) > 1e-6) next.push(a, b);
      else next.push(pc);
    }
    pieces = next;
  }
  const target = round.total / round.n;
  const items = pieces.map((poly) => ({ poly, area: polyArea(poly), c: centroid(poly) }));
  items.sort((u, v) => (Math.abs(u.c.x - v.c.x) > 0.3 ? u.c.x - v.c.x : u.c.y - v.c.y));
  const ok = items.length === round.n && items.every((it) => Math.abs(it.area - target) <= TOL * target + 1e-9);
  return { pieces: items, ok, target };
}

// ---------- Generador de rondas ----------
function rect(x0, y0, x1, y1) {
  return [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)];
}
// Corte "de solución" entre dos puntos (solo para dibujarlo al fallar).
const sol = (a, b) => ({ a, b });

export function buildCortesRound(key) {
  if (key.startsWith("bar")) {
    const n = Number(key.slice(3));
    const lens = { 2: [6, 8, 10], 3: [6, 9, 12], 4: [8, 12] }[n];
    const L = pick(lens);
    const h = n === 4 && L === 8 ? 2 : pick([1, 2]);
    const solution = [];
    for (let k = 1; k < n; k++) solution.push(sol(P((k * L) / n, -0.6), P((k * L) / n, h + 0.6)));
    return { key, kind: "bar", n, k: n - 1, poly: rect(0, 0, L, h), W: L, H: h, total: L * h, solution, dims: [L, h] };
  }
  if (key === "rect4") {
    let W;
    let H;
    do {
      W = pick([6, 8, 10]);
      H = pick([4, 6]);
    } while (W === H);
    const solution = [sol(P(W / 2, -0.6), P(W / 2, H + 0.6)), sol(P(-0.6, H / 2), P(W + 0.6, H / 2))];
    return { key, kind: "rect", n: 4, k: 2, poly: rect(0, 0, W, H), W, H, total: W * H, solution, dims: [W, H] };
  }
  if (key === "L2") return buildL();
  if (key === "tri3") {
    const B = pick([6, 9]);
    const H = randInt(5, 7);
    const ax = randInt(1, B - 1);
    const flip = Math.random() < 0.5; // vértice abajo
    const ay = flip ? H : 0;
    const by = flip ? 0 : H;
    const poly = [P(ax, ay), P(B, by), P(0, by)];
    const solution = [sol(P(ax, ay), P(B / 3, by)), sol(P(ax, ay), P((2 * B) / 3, by))];
    return { key, kind: "tri3", n: 3, k: 2, poly, W: B, H, total: (B * H) / 2, solution, apex: P(ax, ay), baseY: by };
  }
  // tripar: triángulo en 2 con un corte paralelo a la base.
  const B = pick([8, 10]);
  const H = randInt(6, 8);
  const ax = randInt(2, B - 2);
  const flip = Math.random() < 0.5;
  const ay = flip ? H : 0;
  const by = flip ? 0 : H;
  const poly = [P(ax, ay), P(B, by), P(0, by)];
  const yCut = ay + (by - ay) / Math.SQRT2;
  const solution = [sol(P(-0.6, yCut), P(B + 0.6, yCut))];
  return {
    key,
    kind: "tripar",
    n: 2,
    k: 1,
    parallel: true,
    poly,
    W: B,
    H,
    total: (B * H) / 2,
    solution,
    apex: P(ax, ay),
    baseY: by,
  };
}

// La L: un rectángulo W×H sin una esquina. Se descompone en dos
// rectángulos de dos maneras; la recta que pasa por los dos centros de una
// descomposición la parte por la mitad. Se exige que esa recta corte la L
// en solo 2 trozos (un único tramo dentro).
function buildL() {
  for (;;) {
    const W = randInt(6, 9);
    const H = randInt(6, 9);
    const b = randInt(2, W - 3); // ancho del brazo vertical
    const a = randInt(2, H - 3); // alto del brazo horizontal
    let poly = [P(0, 0), P(b, 0), P(b, H - a), P(W, H - a), P(W, H), P(0, H)];
    let decs = [
      [rect(0, 0, b, H), rect(b, H - a, W, H)],
      [rect(0, 0, b, H - a), rect(0, H - a, W, H)],
    ];
    // Orientación al azar (espejos y trasposición).
    const fx = Math.random() < 0.5;
    const fy = Math.random() < 0.5;
    const tr = Math.random() < 0.5;
    const T = (q) => {
      let x = fx ? W - q.x : q.x;
      let y = fy ? H - q.y : q.y;
      return tr ? P(y, x) : P(x, y);
    };
    poly = poly.map(T);
    decs = decs.map((d) => d.map((r) => r.map(T)));
    const good = decs.filter(([r1, r2]) => {
      const c1 = centroid(r1);
      const c2 = centroid(r2);
      return chordsOf(poly, lineOf({ a: c1, b: c2 })).length === 1;
    });
    if (!good.length) continue;
    const dec = pick(good);
    const c1 = centroid(dec[0]);
    const c2 = centroid(dec[1]);
    const L = lineOf({ a: c1, b: c2 });
    const [t0, t1] = chordsOf(poly, L)[0];
    const solution = [sol(atT(L, t0 - 0.6), atT(L, t1 + 0.6))];
    return {
      key: "L2",
      kind: "L",
      n: 2,
      k: 1,
      poly,
      W: tr ? H : W,
      H: tr ? W : H,
      total: polyArea(poly),
      solution,
      dec,
      centers: [c1, c2],
    };
  }
}

// ---------- Textos ----------
const fmt = (x) => String(Math.round(x * 10) / 10).replace(".", ",");
function listY(arr) {
  return arr.length === 1 ? arr[0] : `${arr.slice(0, -1).join(", ")} y ${arr[arr.length - 1]}`;
}
function explain(round) {
  const t = fmt(round.total / round.n);
  if (round.kind === "bar") {
    const [L, h] = round.dims;
    return `La barra tiene ${L}×${h} = ${round.total} cuadritos; ${round.total} ÷ ${round.n} = ${t}: un corte cada ${fmt(L / round.n)} cuadritos.`;
  }
  if (round.kind === "rect") {
    const [W, H] = round.dims;
    return `${W}×${H} = ${round.total} cuadritos; ÷ 4 = ${t}. Dos cortes por el centro: las dos medianas (o las dos diagonales).`;
  }
  if (round.kind === "L")
    return "La L son dos rectángulos: la recta que pasa por sus dos centros (●) parte cada uno por la mitad.";
  if (round.kind === "tri3")
    return `Del vértice a la base partida en tercios: misma altura y bases iguales → ${t} cada trozo.`;
  return "A mitad de altura arriba queda solo 1/4 (mira los 4 triangulitos). Para la mitad, el corte va a 0,71 de la altura desde el vértice (1/√2).";
}

// ---------- Juego ----------
export function mountCortesGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let round = null;
  let cuts = []; // { a, b } en cuadritos
  let selected = -1;
  let badCut = -1;
  let phase = "edit"; // edit | done
  let result = null;
  let drag = null;
  let timers = [];
  let svg = null;

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
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => {
    timers.forEach(clearTimeout);
    timers = [];
  };

  function nextRound() {
    clearTimers();
    const key = level < LEVELS.length ? LEVELS[level] : pick(LEVELS.slice(1));
    round = buildCortesRound(key);
    cuts = [];
    selected = -1;
    badCut = -1;
    phase = "edit";
    result = null;
    const vb = [-MARGIN, -MARGIN, round.W + 2 * MARGIN, round.H + 2 * MARGIN];
    body.innerHTML = `
      <p class="prompt ct-prompt">${round.n} trozos iguales, ${round.k} corte${round.k > 1 ? "s" : ""}
        ${round.parallel ? "<span class=\"ct-extra\">con un corte paralelo a la base</span>" : ""}
        <small>Desliza de lado a lado para cortar · arrastra los ● para afinar</small></p>
      <svg class="ct-svg" data-svg viewBox="${vb.join(" ")}" data-vbw="${vb[2]}" role="img" aria-label="Figura para cortar"></svg>
      <div class="ct-bar">
        <span class="ct-count" data-count></span>
        <button type="button" class="secondary ct-btn" data-del>🗑️ Borrar corte</button>
        <button type="button" class="primary ct-btn" data-cut>✂️ ¡Corta!</button>
      </div>
      <div class="feedback" data-feedback></div>
      <p class="ct-why" data-why></p>
      <button type="button" class="primary ct-next" data-next hidden>Seguir →</button>
    `;
    svg = body.querySelector("[data-svg]");
    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);
    svg.addEventListener("pointercancel", onUp);
    body.querySelector("[data-del]").addEventListener("click", delCut);
    body.querySelector("[data-cut]").addEventListener("click", doCut);
    body.querySelector("[data-next]").addEventListener("click", () => {
      if (finished) return;
      if (lives <= 0) finish(false);
      else nextRound();
    });
    paint();
  }

  // ---------- Dibujo ----------
  const ptsAttr = (poly) => poly.map((q) => `${q.x.toFixed(3)},${q.y.toFixed(3)}`).join(" ");
  function gridSvg() {
    const x0 = Math.ceil(-MARGIN);
    const y0 = Math.ceil(-MARGIN);
    let s = "";
    for (let x = x0; x <= round.W + MARGIN; x++)
      s += `<line x1="${x}" y1="${-MARGIN}" x2="${x}" y2="${round.H + MARGIN}"/>`;
    for (let y = y0; y <= round.H + MARGIN; y++)
      s += `<line x1="${-MARGIN}" y1="${y}" x2="${round.W + MARGIN}" y2="${y}"/>`;
    return `<g class="ct-grid">${s}</g>`;
  }
  function fullLine(cut, cls) {
    const L = lineOf(cut);
    const a = atT(L, -60);
    const b = atT(L, 60);
    return `<line class="${cls}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
  }
  function chordSegs(cut, cls) {
    const L = lineOf(cut);
    return chordsOf(round.poly, L)
      .map(([t0, t1]) => {
        const a = atT(L, t0);
        const b = atT(L, t1);
        return `<line class="${cls}" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
      })
      .join("");
  }

  function paint(temp) {
    const fig = round.poly;
    const figC = centroid(fig);
    let s = "";
    if (phase === "edit" || !result) {
      s += `<polygon class="ct-fig" points="${ptsAttr(fig)}"/>`;
      s += gridSvg();
      s += `<polygon class="ct-edge" points="${ptsAttr(fig)}"/>`;
      cuts.forEach((c, i) => {
        s += fullLine(c, `ct-cut${i === selected ? " sel" : ""}${i === badCut ? " bad" : ""}`);
      });
      cuts.forEach((c, i) => {
        s += `<circle class="ct-handle${i === selected ? " sel" : ""}" cx="${c.a.x}" cy="${c.a.y}" r="0.28"/>`;
        s += `<circle class="ct-handle${i === selected ? " sel" : ""}" cx="${c.b.x}" cy="${c.b.y}" r="0.28"/>`;
      });
      if (temp) s += fullLine(temp, "ct-cut temp");
    } else {
      s += gridSvg();
      s += `<polygon class="ct-ghost" points="${ptsAttr(fig)}"/>`;
      result.pieces.forEach((pc, i) => {
        const v = sub(pc.c, figC);
        const n = Math.hypot(v.x, v.y);
        const off = n < 0.05 ? P(0, 0) : P((v.x / n) * 0.35, (v.y / n) * 0.35);
        const good = Math.abs(pc.area - result.target) <= TOL * result.target + 1e-9;
        s += `<g class="ct-piece" style="--dx:${off.x.toFixed(3)}px;--dy:${off.y.toFixed(3)}px">
          <polygon class="ct-pc ${good && result.ok ? "ok" : good ? "" : "bad"}" data-piece="${i}" data-area="${pc.area.toFixed(4)}" points="${ptsAttr(pc.poly)}"/>
          <text class="ct-area" x="${(pc.c.x + off.x).toFixed(3)}" y="${(pc.c.y + off.y).toFixed(3)}">${fmt(pc.area)}</text>
        </g>`;
      });
      if (!result.ok) s += solutionSvg();
    }
    svg.innerHTML = s;
    const cnt = body.querySelector("[data-count]");
    if (cnt) cnt.textContent = `Cortes: ${cuts.length}/${round.k}`;
    const del = body.querySelector("[data-del]");
    const cutBtn = body.querySelector("[data-cut]");
    if (del) del.disabled = phase !== "edit" || selected < 0;
    if (cutBtn) cutBtn.disabled = phase !== "edit" || cuts.length !== round.k;
  }

  // Lo que se dibuja al fallar: un corte bueno y el porqué.
  function solutionSvg() {
    let s = "";
    if (round.kind === "L") {
      round.dec.forEach((r) => (s += `<polygon class="ct-help" points="${ptsAttr(r)}"/>`));
      round.centers.forEach((c) => (s += `<circle class="ct-center" cx="${c.x}" cy="${c.y}" r="0.2"/>`));
    }
    if (round.kind === "tripar") {
      const [A, Bv, Cv] = round.poly;
      const m = (u, v) => P((u.x + v.x) / 2, (u.y + v.y) / 2);
      const mAB = m(A, Bv);
      const mAC = m(A, Cv);
      const mBC = m(Bv, Cv);
      s += `<polygon class="ct-quarter" points="${ptsAttr([A, mAB, mAC])}"/>`;
      s += `<polygon class="ct-help" points="${ptsAttr([mAB, mBC, mAC])}"/>`;
      const c = centroid([A, mAB, mAC]);
      s += `<text class="ct-qlabel" x="${c.x}" y="${c.y}">1/4</text>`;
    }
    round.solution.forEach((c) => (s += chordSegs(c, "ct-sol")));
    return `<g class="ct-solution">${s}</g>`;
  }

  // ---------- Gestos ----------
  function toUnits(e) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const r = pt.matrixTransform(svg.getScreenCTM().inverse());
    return P(r.x, r.y);
  }
  const unitsPerPx = () => Number(svg.dataset.vbw) / svg.getBoundingClientRect().width;
  function snap(q) {
    if (round.parallel) return q;
    const g = P(Math.round(q.x * 2) / 2, Math.round(q.y * 2) / 2);
    return dist(g, q) <= SNAP_R ? g : q;
  }
  const clampVB = (q) =>
    P(Math.max(-MARGIN, Math.min(round.W + MARGIN, q.x)), Math.max(-MARGIN, Math.min(round.H + MARGIN, q.y)));

  function onDown(e) {
    if (finished || phase !== "edit") return;
    e.preventDefault();
    svg.setPointerCapture(e.pointerId);
    const q = toUnits(e);
    const hitR = 24 * unitsPerPx();
    let best = null;
    cuts.forEach((c, i) =>
      ["a", "b"].forEach((end) => {
        const d = dist(c[end], q);
        if (d < hitR && (!best || d < best.d)) best = { i, end, d };
      })
    );
    if (best) {
      selected = best.i;
      const c = cuts[best.i];
      drag = { type: "handle", i: best.i, end: best.end, start: q, orig: { a: { ...c.a }, b: { ...c.b } } };
    } else {
      drag = { type: "swipe", start: q, cur: q };
    }
    badCut = -1;
    paint();
  }

  function onMove(e) {
    if (!drag || finished) return;
    const q = toUnits(e);
    if (drag.type === "swipe") {
      drag.cur = q;
      if (dist(drag.start, q) > 0.6) paint(makeSwipeCut(drag.start, q));
      return;
    }
    const c = cuts[drag.i];
    const dx = (q.x - drag.start.x) * GAIN;
    const dy = (q.y - drag.start.y) * GAIN;
    if (round.parallel) {
      // En este nivel el corte va siempre paralelo a la base: los dos
      // tiradores suben o bajan juntos.
      const y = Math.max(-MARGIN, Math.min(round.H + MARGIN, drag.orig.a.y + dy));
      c.a = P(drag.orig.a.x, y);
      c.b = P(drag.orig.b.x, y);
    } else {
      const other = drag.end === "a" ? c.b : c.a;
      const np = clampVB(snap(P(drag.orig[drag.end].x + dx, drag.orig[drag.end].y + dy)));
      if (dist(np, other) >= 0.8) c[drag.end] = np;
    }
    paint();
  }

  // El trazo del dedo convertido en corte (imantado, o paralelo a la base).
  function makeSwipeCut(a, b) {
    if (round.parallel) {
      const y = (a.y + b.y) / 2;
      return { a: P(-MARGIN * 0.6, y), b: P(round.W + MARGIN * 0.6, y) };
    }
    return { a: clampVB(snap(a)), b: clampVB(snap(b)) };
  }

  function onUp(e) {
    if (!drag || finished) return;
    const d = drag;
    drag = null;
    if (d.type === "handle") return paint();
    const fb = body.querySelector("[data-feedback]");
    if (dist(d.start, d.cur) <= 0.6) {
      // Toque: selecciona el corte más cercano.
      let best = -1;
      let bd = 0.5;
      cuts.forEach((c, i) => {
        const dd = Math.abs(sideOf(lineOf(c), d.cur));
        if (dd < bd) {
          bd = dd;
          best = i;
        }
      });
      selected = best;
      return paint();
    }
    // Un trazo vale si empieza y acaba fuera de la figura y la atraviesa.
    // (Se mira el trazo ya imantado; un extremo justo sobre el borde vale.)
    const raw = round.parallel ? { a: d.start, b: d.cur } : { a: snap(d.start), b: snap(d.cur) };
    const L = lineOf(raw);
    const len = dist(raw.a, raw.b);
    const crosses = chordsOf(round.poly, L).some(([t0, t1]) => t0 > -0.15 && t1 < len + 0.15 && t1 - t0 > 0.3);
    console.debug("DBG", JSON.stringify({ raw, s: d.start, c: d.cur, crosses, ch: chordsOf(round.poly, L), len }));
    if (!crosses || insideStrict(round.poly, raw.a, 0.06) || insideStrict(round.poly, raw.b, 0.06)) {
      fb.textContent = "Desliza de lado a lado: empieza y termina fuera de la figura.";
      fb.className = "feedback bad";
      return paint();
    }
    fb.textContent = "";
    fb.className = "feedback";
    const cut = makeSwipeCut(raw.a, raw.b);
    if (cuts.length < round.k) {
      cuts.push(cut);
      selected = cuts.length - 1;
    } else {
      // Con todos los cortes puestos, el trazo nuevo sustituye al elegido.
      const i = selected >= 0 ? selected : cuts.length - 1;
      cuts[i] = cut;
      selected = i;
    }
    paint();
  }

  function delCut() {
    if (finished || phase !== "edit" || selected < 0) return;
    cuts.splice(selected, 1);
    selected = cuts.length - 1;
    badCut = -1;
    paint();
  }

  function doCut() {
    if (finished || phase !== "edit" || cuts.length !== round.k) return;
    const fb = body.querySelector("[data-feedback]");
    const why = body.querySelector("[data-why]");
    const r = evaluateCortes(round, cuts);
    if (r.reject) {
      badCut = r.index;
      selected = r.index;
      fb.textContent =
        r.reject === "cross"
          ? "Ese corte no atraviesa la figura de lado a lado."
          : "Un corte recto solo puede partir la L en dos trozos, y ese la parte en tres.";
      fb.className = "feedback bad";
      return paint();
    }
    rounds++;
    phase = "done";
    result = r;
    paint();
    const parts = r.pieces.map((p) => fmt(p.area)).join(" | ");
    if (r.ok) {
      score += 10;
      level++;
      renderScore();
      fb.textContent = `¡Iguales! ${parts}`;
      fb.className = "feedback ok";
      later(nextRound, 1700);
      return;
    }
    lives--;
    renderLives();
    const tocan = listY(Array(round.n).fill(fmt(r.target)));
    const extra = r.pieces.length !== round.n ? `Salen ${r.pieces.length} trozos y tocaban ${round.n}: ` : "";
    fb.textContent = `✗ ${extra}${parts} — tocaban ${tocan}`;
    fb.className = "feedback bad";
    why.textContent = `${explain(round)} (En verde, un corte bueno.)`;
    const next = body.querySelector("[data-next]");
    next.hidden = false;
    next.textContent = lives <= 0 ? "Ver puntuación" : "Seguir →";
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimers();
    drag = null;
    if (userExited) return onExit();
    saveScore(client, "cortes", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>✂️</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} figuras repartidas a partes iguales</p>
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
    clearTimers();
    drag = null;
  };
}
