// "La abeja programadora" (🐝): programar una secuencia entera y luego
// ejecutarla, sin ver el resultado paso a paso (la tortuga de Logo de
// Papert y la Bee-Bot).
//
// Pantalla: la figura objetivo en gris sobre una cuadrícula y una tira de
// programa vacía. Los bloques se TOCAN para añadirlos a la tira (y se
// tocan en la tira para quitarlos): "avanza 1", "gira ↻ N°" (el ángulo se
// elige con ‹ ›) y "repite ×N" con un hueco dentro: lo que se añada
// mientras el repite está abierto entra dentro, y un botón lo cierra.
// "▶" hace que la abeja dibuje animada.
//
// Corrección geométrica: lo dibujado y la figura se comparan como
// CONJUNTO DE SEGMENTOS (se agrupan por recta y se funden los tramos
// solapados), con tolerancia de coma flotante. Cualquier programa que
// dibuje la figura vale.
//
// Niveles: orientación y contar pasos (L, ∩, cuadrado, rectángulo,
// escalera) → polígonos regulares con límite de bloques que obliga a usar
// el bucle (triángulo = girar 120°, no 60°) → estrellas {5/2} (girar 144°,
// 2 vueltas) y {8/3} (135°, 3 vueltas).
//
// Al fallar: queda el rastro, se marca en rojo lo que sobra y con rayas lo
// que falta, el hueco donde no cierra y la cuenta del giro acumulado:
// "Has girado 6 × 50° = 300°; para cerrar hace falta 360°".
import { randInt, pick, clamp, saveScore } from "./utils.js";

const U = 40; // unidades SVG por paso de la abeja
const ANGLES = [30, 36, 45, 60, 72, 90, 108, 120, 135, 144, 150, 180, 270];
const TOL = 1e-6;
const POLY_NAMES = { 3: "triángulo", 4: "cuadrado", 5: "pentágono", 6: "hexágono", 8: "octógono" };

// ---------- Programas ----------
const FD = () => ({ t: "fd" });
const RT = (a) => ({ t: "rt", a });
const REP = (n, body) => ({ t: "rep", n, body });
const fds = (k) => Array.from({ length: k }, FD);

// Expande los "repite" en una lista plana de órdenes.
export function flatten(prog) {
  const out = [];
  for (const it of prog) {
    if (it.t === "rep") for (let i = 0; i < it.n; i++) out.push(...flatten(it.body));
    else out.push(it);
  }
  return out;
}
export function countBlocks(prog) {
  return prog.reduce((s, it) => s + (it.t === "rep" ? 1 + countBlocks(it.body) : 1), 0);
}

// Ejecuta órdenes planas desde (0,0) con rumbo h0 (0 = arriba, sentido
// horario, y hacia abajo en pantalla). Devuelve segmentos y giro total.
export function runOps(ops, h0) {
  let x = 0;
  let y = 0;
  let h = h0;
  let turn = 0;
  const turns = [];
  const segs = [];
  const poses = [{ x, y, h }];
  for (const op of ops) {
    if (op.t === "fd") {
      const r = (h * Math.PI) / 180;
      const nx = x + Math.sin(r);
      const ny = y - Math.cos(r);
      segs.push([x, y, nx, ny]);
      x = nx;
      y = ny;
    } else {
      h += op.a;
      turn += op.a;
      turns.push(op.a);
    }
    poses.push({ x, y, h });
  }
  return { segs, x, y, h, turn, turns, poses };
}

// Agrupa segmentos por recta (dirección sin sentido + desplazamiento) y
// funde los intervalos solapados o contiguos.
function lineGroups(segs) {
  const groups = [];
  for (const [x1, y1, x2, y2] of segs) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    const L = Math.hypot(dx, dy);
    if (L < TOL) continue;
    dx /= L;
    dy /= L;
    if (dx < -1e-9 || (Math.abs(dx) <= 1e-9 && dy < 0)) {
      dx = -dx;
      dy = -dy;
    }
    const off = x1 * dy - y1 * dx;
    const t1 = x1 * dx + y1 * dy;
    const t2 = x2 * dx + y2 * dy;
    let g = groups.find((q) => Math.abs(q.dx - dx) < TOL && Math.abs(q.dy - dy) < TOL && Math.abs(q.off - off) < TOL);
    if (!g) groups.push((g = { dx, dy, off, iv: [] }));
    g.iv.push([Math.min(t1, t2), Math.max(t1, t2)]);
  }
  for (const g of groups) {
    g.iv.sort((a, b) => a[0] - b[0]);
    const m = [];
    for (const iv of g.iv) {
      const last = m[m.length - 1];
      if (last && iv[0] <= last[1] + TOL) last[1] = Math.max(last[1], iv[1]);
      else m.push(iv.slice());
    }
    g.iv = m;
  }
  return groups;
}
function sameGroup(a, b) {
  return Math.abs(a.dx - b.dx) < TOL && Math.abs(a.dy - b.dy) < TOL && Math.abs(a.off - b.off) < TOL;
}
export function sameFigure(segsA, segsB) {
  const A = lineGroups(segsA);
  const B = lineGroups(segsB);
  if (A.length !== B.length) return false;
  return A.every((ga) => {
    const gb = B.find((q) => sameGroup(ga, q));
    if (!gb || gb.iv.length !== ga.iv.length) return false;
    return ga.iv.every((iv, i) => Math.abs(iv[0] - gb.iv[i][0]) < TOL && Math.abs(iv[1] - gb.iv[i][1]) < TOL);
  });
}
// ¿Está el segmento s entero dentro del dibujo agrupado G?
function covered(s, G) {
  const [g] = lineGroups([s]);
  if (!g) return true;
  const h = G.find((q) => sameGroup(g, q));
  if (!h) return false;
  const [a, b] = g.iv[0];
  return h.iv.some(([p, q]) => p <= a + TOL && q >= b - TOL);
}

// ---------- Niveles ----------
// Cada nivel lleva un programa de referencia (solo para generar la
// figura: la corrección compara dibujos, no programas).
export function buildLevel(level) {
  if (level < 3) {
    const h0 = pick([0, 90]);
    let kind;
    let ref;
    let closed = false;
    let left = false;
    if (level === 0) {
      const a = randInt(2, 3);
      const b = randInt(1, 3);
      if (Math.random() < 0.5) {
        kind = "L";
        left = Math.random() < 0.5;
        ref = [...fds(a), RT(left ? 270 : 90), ...fds(b)];
      } else {
        kind = "U";
        ref = [...fds(a), RT(90), ...fds(b), RT(90), ...fds(a)];
      }
    } else if (level === 1) {
      const a = randInt(1, 3);
      let b = randInt(1, 3);
      if (a * b > 6) b = 1;
      kind = a === b ? "cuadrado" : "rectángulo";
      ref = [...fds(a), RT(90), ...fds(b), RT(90), ...fds(a), RT(90), ...fds(b)];
      closed = true;
    } else {
      const k = randInt(2, 3);
      kind = "escalera";
      left = true;
      ref = [];
      for (let i = 0; i < k; i++) ref.push(FD(), RT(90), FD(), ...(i < k - 1 ? [RT(270)] : []));
    }
    return { tier: 0, kind, ref, h0, closed, left, limit: 16, laps: closed ? 1 : 0 };
  }
  const poly = (n, s) => ({
    tier: 1,
    kind: "poly",
    n,
    s,
    ext: 360 / n,
    ref: [REP(n, [...fds(s), RT(360 / n)])],
    h0: 0,
    closed: true,
    laps: 1,
    limit: s + 3,
  });
  const star = (n, k, s) => ({
    tier: 2,
    kind: "star",
    n,
    k,
    s,
    ext: (360 * k) / n,
    ref: [REP(n, [...fds(s), RT((360 * k) / n)])],
    h0: 0,
    closed: true,
    laps: k,
    limit: s + 3,
  });
  if (level < 7) {
    const n = level === 3 ? 3 : pick([3, 4, 5, 6, 8]);
    return poly(n, n <= 6 ? pick([1, 2]) : 1);
  }
  const r = Math.random();
  if (r < 0.6) return star(5, 2, pick([2, 3]));
  if (r < 0.85) return star(8, 3, 2);
  const n = pick([5, 6, 8]);
  return { ...poly(n, n <= 6 ? 2 : 1), tier: 2 };
}

function figureName(lv) {
  if (lv.kind === "poly") return lv.n === 4 ? "un cuadrado" : `un ${POLY_NAMES[lv.n]} regular`;
  if (lv.kind === "star") return `la estrella {${lv.n}/${lv.k}}`;
  if (lv.kind === "L") return "la L";
  if (lv.kind === "U") return "el arco";
  if (lv.kind === "escalera") return "la escalera";
  return `el ${lv.kind}`;
}

// ---------- Juego ----------

export function mountProgramaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let pending = null;
  let raf = 0;
  let lv = null; // nivel actual
  let target = null; // { segs, groups, steps }
  let prog = [];
  let openRep = null; // el "repite" abierto (sus bloques entran dentro)
  let angIdx = ANGLES.indexOf(90);
  let repN = 4;
  let running = false;
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
  const $ = (s) => body.querySelector(s);
  const fmt = (v) => (Math.abs(v - Math.round(v)) < 1e-9 ? String(Math.round(v)) : v.toFixed(1));

  function nextRound() {
    lv = buildLevel(level);
    const run = runOps(flatten(lv.ref), lv.h0);
    target = { segs: run.segs, groups: lineGroups(run.segs), steps: run.segs.length };
    prog = [];
    openRep = null;
    running = false;
    const sub =
      lv.tier === 0
        ? `La abeja mira hacia la flecha y solo gira a la derecha ↻`
        : `Máximo ${lv.limit} bloques: usa «repite»`;
    body.innerHTML = `
      <p class="prompt pg-prompt">Programa a la abeja: dibuja ${figureName(lv)}<small>${sub}</small></p>
      <div class="pg-wrap">
        <svg class="pg-svg" data-svg>
          <g data-grid></g><g data-target></g><g data-trail></g><g data-marks></g><g data-bee></g>
        </svg>
      </div>
      <div class="pg-turn" data-turn>↻ giro acumulado: 0°</div>
      <div class="pg-strip" data-strip></div>
      <div class="pg-count" data-count></div>
      <div class="pg-palette">
        <button type="button" class="pg-blk pg-fd" data-add="fd">avanza 1</button>
        <div class="pg-blk pg-rt">
          <button type="button" class="pg-arr" data-ang="-1" aria-label="menos grados">‹</button>
          <button type="button" class="pg-main" data-add="rt">gira ↻ <b data-angv></b></button>
          <button type="button" class="pg-arr" data-ang="1" aria-label="más grados">›</button>
        </div>
        <div class="pg-blk pg-rp">
          <button type="button" class="pg-arr" data-rn="-1" aria-label="menos veces">‹</button>
          <button type="button" class="pg-main" data-add="rep">repite ×<b data-repv></b></button>
          <button type="button" class="pg-arr" data-rn="1" aria-label="más veces">›</button>
        </div>
        <button type="button" class="pg-blk pg-close" data-close>cerrar repite ⟧</button>
      </div>
      <div class="pg-actions">
        <button type="button" class="primary pg-run" data-run>▶ Ejecutar</button>
        <button type="button" class="secondary" data-clear>Borrar todo</button>
      </div>
      <div class="feedback" data-feedback></div>
    `;
    svg = $("[data-svg]");
    drawStatic(null);
    drawBee({ x: 0, y: 0, h: lv.h0 });
    bindUi();
    renderProgram();
  }

  // Cuadrícula + figura gris. extra = segmentos que también deben verse.
  function drawStatic(extra) {
    const all = [...target.segs, ...(extra || [])];
    let x0 = 0, y0 = 0, x1 = 0, y1 = 0;
    for (const [a, b, c, d] of all) {
      x0 = Math.min(x0, a, c);
      x1 = Math.max(x1, a, c);
      y0 = Math.min(y0, b, d);
      y1 = Math.max(y1, b, d);
    }
    // Margen y tamaño mínimo para que no salga diminuto.
    const minSpan = 4;
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const w = Math.max(x1 - x0, minSpan) + 1.6;
    const h = Math.max(y1 - y0, minSpan * 0.75) + 1.6;
    const vx = (cx - w / 2) * U;
    const vy = (cy - h / 2) * U;
    svg.setAttribute("viewBox", `${vx} ${vy} ${w * U} ${h * U}`);
    const gx0 = Math.floor(cx - w / 2);
    const gx1 = Math.ceil(cx + w / 2);
    const gy0 = Math.floor(cy - h / 2);
    const gy1 = Math.ceil(cy + h / 2);
    let grid = "";
    for (let i = gx0; i <= gx1; i++) grid += `<line class="pg-grid" x1="${i * U}" y1="${gy0 * U}" x2="${i * U}" y2="${gy1 * U}"></line>`;
    for (let j = gy0; j <= gy1; j++) grid += `<line class="pg-grid" x1="${gx0 * U}" y1="${j * U}" x2="${gx1 * U}" y2="${j * U}"></line>`;
    svg.querySelector("[data-grid]").innerHTML = grid;
    svg.querySelector("[data-target]").innerHTML =
      target.segs
        .map(([a, b, c, d]) => `<line class="pg-target" x1="${a * U}" y1="${b * U}" x2="${c * U}" y2="${d * U}"></line>`)
        .join("") +
      // Salida: punto y flecha fija con el rumbo inicial (la abeja puede
      // quedarse en otro sitio tras un fallo).
      `<circle class="pg-origin" cx="0" cy="0" r="${U * 0.14}"></circle>
      <g class="pg-start" transform="rotate(${lv.h0})"><path d="M0 ${-U * 0.66} L${U * 0.22} ${-U * 0.32} L${-U * 0.22} ${-U * 0.32} Z"></path></g>`;
  }

  function drawBee({ x, y, h }) {
    svg.querySelector("[data-bee]").innerHTML = `
      <g class="pg-bee" data-beepos="${fmt(x)},${fmt(y)},${fmt(((h % 360) + 360) % 360)}" transform="translate(${x * U} ${y * U})">
        <g transform="rotate(${h})"><path class="pg-arrow" d="M0 ${-U * 0.62} L${U * 0.2} ${-U * 0.3} L${-U * 0.2} ${-U * 0.3} Z"></path></g>
        <text class="pg-beeface" x="0" y="${U * 0.13}">🐝</text>
      </g>`;
  }

  function addBlock(kind) {
    if (running || finished) return;
    if (countBlocks(prog) >= lv.limit) return;
    let blk;
    if (kind === "fd") blk = FD();
    else if (kind === "rt") blk = RT(ANGLES[angIdx]);
    else {
      if (openRep) return; // un repite dentro de otro no
      blk = REP(repN, []);
    }
    if (openRep) openRep.body.push(blk);
    else prog.push(blk);
    if (blk.t === "rep") openRep = blk;
    clearFeedback();
    renderProgram();
  }

  function removeAt(path) {
    if (running || finished) return;
    const [i, j] = path;
    if (j === undefined) {
      const it = prog[i];
      if (it === openRep) openRep = null;
      prog.splice(i, 1);
    } else {
      prog[i].body.splice(j, 1);
    }
    clearFeedback();
    renderProgram();
  }

  function clearFeedback() {
    const fb = $("[data-feedback]");
    if (fb && fb.classList.contains("bad")) {
      fb.textContent = "";
      fb.className = "feedback";
    }
  }

  function blockHtml(it, path) {
    const p = `data-del="${path.join(",")}"`;
    if (it.t === "fd") return `<button type="button" class="pg-chip pg-fd" ${p}>avanza 1</button>`;
    if (it.t === "rt") return `<button type="button" class="pg-chip pg-rt" ${p}>gira ↻ ${it.a}°</button>`;
    const inner = it.body.map((b, j) => blockHtml(b, [path[0], j])).join("");
    const open = it === openRep;
    return `<div class="pg-loop${open ? " open" : ""}">
      <button type="button" class="pg-chip pg-rp" ${p}>repite ×${it.n}</button>
      <div class="pg-hole">${inner}${open ? `<span class="pg-caret">＋ aquí</span>` : inner ? "" : `<span class="pg-empty">vacío</span>`}</div>
    </div>`;
  }

  function renderProgram() {
    const strip = $("[data-strip]");
    strip.innerHTML = prog.length
      ? prog.map((it, i) => blockHtml(it, [i])).join("")
      : `<span class="pg-placeholder">Tu programa: toca los bloques de abajo</span>`;
    strip.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => removeAt(b.dataset.del.split(",").map(Number)))
    );
    const n = countBlocks(prog);
    const full = n >= lv.limit;
    $("[data-count]").textContent = `${n} / ${lv.limit} bloques${full ? " — ¡lleno!" : ""}`;
    $("[data-count]").classList.toggle("full", full);
    $("[data-angv]").textContent = `${ANGLES[angIdx]}°`;
    $("[data-repv]").textContent = repN;
    body.querySelectorAll("[data-add]").forEach((b) => {
      b.disabled = running || full || (b.dataset.add === "rep" && !!openRep);
    });
    body.querySelectorAll("[data-ang],[data-rn]").forEach((b) => (b.disabled = running));
    $("[data-close]").disabled = running || !openRep;
    $("[data-run]").disabled = running || n === 0;
    $("[data-clear]").disabled = running || n === 0;
  }

  function bindUi() {
    body.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => addBlock(b.dataset.add)));
    body.querySelectorAll("[data-ang]").forEach((b) =>
      b.addEventListener("click", () => {
        angIdx = (angIdx + Number(b.dataset.ang) + ANGLES.length) % ANGLES.length;
        renderProgram();
      })
    );
    body.querySelectorAll("[data-rn]").forEach((b) =>
      b.addEventListener("click", () => {
        repN = clamp(repN + Number(b.dataset.rn), 2, 10);
        renderProgram();
      })
    );
    $("[data-close]").addEventListener("click", () => {
      openRep = null;
      renderProgram();
    });
    $("[data-clear]").addEventListener("click", () => {
      if (running) return;
      prog = [];
      openRep = null;
      clearFeedback();
      renderProgram();
    });
    $("[data-run]").addEventListener("click", execute);
  }

  // ▶: se calcula todo el recorrido, se ajusta la vista y se anima.
  function execute() {
    if (running || finished || !prog.length) return;
    openRep = null;
    running = true;
    renderProgram();
    const fb = $("[data-feedback]");
    fb.textContent = "";
    fb.className = "feedback";
    const ops = flatten(prog);
    const res = runOps(ops, lv.h0);
    drawStatic(res.segs);
    svg.querySelector("[data-trail]").innerHTML = "";
    svg.querySelector("[data-marks]").innerHTML = "";
    const turnEl = $("[data-turn]");
    if (!ops.length) return judge(res); // p. ej. solo un «repite» vacío
    const per = clamp(2600 / Math.max(ops.length, 1), 70, 320);
    let i = 0;
    let t0 = performance.now();
    let turnSoFar = 0;
    const trail = svg.querySelector("[data-trail]");
    let curLine = null;
    const step = (now) => {
      if (finished) return;
      const op = ops[i];
      const a = res.poses[i];
      const k = Math.min(1, (now - t0) / per);
      if (op.t === "fd") {
        if (!curLine) {
          curLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
          curLine.setAttribute("class", "pg-trail");
          curLine.setAttribute("x1", a.x * U);
          curLine.setAttribute("y1", a.y * U);
          trail.appendChild(curLine);
        }
        const b = res.poses[i + 1];
        const x = a.x + (b.x - a.x) * k;
        const y = a.y + (b.y - a.y) * k;
        curLine.setAttribute("x2", x * U);
        curLine.setAttribute("y2", y * U);
        drawBee({ x, y, h: a.h });
      } else {
        drawBee({ x: a.x, y: a.y, h: a.h + op.a * k });
        turnEl.textContent = `↻ giro acumulado: ${fmt(turnSoFar + op.a * k)}°`;
      }
      if (k >= 1) {
        if (op.t === "rt") turnSoFar += op.a;
        curLine = null;
        i++;
        t0 = now;
        if (i >= ops.length) {
          raf = 0;
          drawBee(res.poses[res.poses.length - 1]);
          turnEl.textContent = `↻ giro acumulado: ${fmt(res.turn)}°`;
          return judge(res);
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function judge(res) {
    rounds++;
    const fb = $("[data-feedback]");
    if (sameFigure(res.segs, target.segs)) {
      score += 10;
      level++;
      renderScore();
      const full = lv.closed && Math.abs(res.turn - 360 * lv.laps) < 1e-9;
      fb.textContent = `¡Figura exacta! ${full ? `Giro total ${fmt(res.turn)}° = ${lv.laps} ${lv.laps === 1 ? "vuelta" : "vueltas"}.` : ""}`;
      fb.className = "feedback ok";
      pending = setTimeout(nextRound, 1500);
      return;
    }
    lives--;
    renderLives();
    // Marcas: lo que sobra en rojo, lo que falta a rayas, y el hueco.
    const mine = lineGroups(res.segs);
    let marks = "";
    for (const s of res.segs)
      if (!covered(s, target.groups))
        marks += `<line class="pg-extra" x1="${s[0] * U}" y1="${s[1] * U}" x2="${s[2] * U}" y2="${s[3] * U}"></line>`;
    for (const s of target.segs)
      if (!covered(s, mine))
        marks += `<line class="pg-missing" x1="${s[0] * U}" y1="${s[1] * U}" x2="${s[2] * U}" y2="${s[3] * U}"></line>`;
    const open = Math.hypot(res.x, res.y) > 1e-6;
    if (lv.closed && open) {
      // Etiqueta "hueco" desplazada en perpendicular para no taparla la abeja.
      const len = Math.hypot(res.x, res.y);
      const lx = (res.x / 2 + (res.y / len) * 0.45) * U;
      const ly = (res.y / 2 - (res.x / len) * 0.45) * U;
      marks += `<line class="pg-gap" x1="${res.x * U}" y1="${res.y * U}" x2="0" y2="0"></line>
        <text class="pg-gaplbl" x="${lx}" y="${ly + 4}">hueco</text>`;
    }
    svg.querySelector("[data-marks]").innerHTML = marks;

    const need = 360 * lv.laps;
    const n = res.turns.length;
    const same = n > 0 && res.turns.every((a) => a === res.turns[0]);
    const turnTxt = !n
      ? "No has girado nada (0°)"
      : same
      ? `Has girado ${n} × ${res.turns[0]}° = ${fmt(res.turn)}°`
      : n <= 6
      ? `Has girado ${res.turns.join("° + ")}° = ${fmt(res.turn)}°`
      : `Has girado en total ${fmt(res.turn)}°`;
    let why;
    if (lv.closed && open) {
      why = `${turnTxt}; para cerrar hace falta ${need}° (${
        lv.laps > 1 ? `${lv.laps} vueltas enteras` : "una vuelta entera"
      }, contando la última esquina). ${explain()}`;
    } else {
      const steps = res.segs.length;
      why =
        steps !== target.steps
          ? `La figura tiene ${target.steps} pasos y tu abeja avanzó ${steps}. Cuenta los pasos de cada tramo.`
          : `Has dado los ${steps} pasos, pero no en el sitio: revisa dónde y cuánto gira. ${turnTxt}.`;
      if (lv.left) why += " Para torcer a la izquierda, gira ↻ 270° (tres cuartos de vuelta).";
      else if (lv.closed) why += ` ${explain()}`;
    }
    fb.textContent = `✗ ${why} En rojo lo que sobra; a rayas lo que falta.`;
    fb.className = "feedback bad";
    if (lives <= 0) {
      pending = setTimeout(() => finish(false), 3200);
      return;
    }
    running = false;
    renderProgram();
  }

  // La cuenta que explica el giro correcto de cada esquina.
  function explain() {
    if (lv.kind === "poly") {
      return `Un ${POLY_NAMES[lv.n]} regular da 1 vuelta en ${lv.n} esquinas: 360° ÷ ${lv.n} = ${fmt(lv.ext)}° en cada una (el ángulo de fuera${
        lv.n === 3 ? ": dentro tiene 60°, pero se gira 120°" : ""
      }).`;
    }
    if (lv.kind === "star") {
      return `La estrella {${lv.n}/${lv.k}} da ${lv.k} vueltas en ${lv.n} puntas: ${360 * lv.k}° ÷ ${lv.n} = ${fmt(lv.ext)}° en cada una.`;
    }
    return `Un ${lv.kind} se cierra con 4 esquinas de 90°: 4 × 90° = 360°.`;
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    cancelAnimationFrame(raf);
    if (userExited) return onExit();
    saveScore(client, "programa", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🐝</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} ${score === 10 ? "figura programada" : "figuras programadas"}</p>
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
    clearTimeout(pending);
    cancelAnimationFrame(raf);
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
  };
}
