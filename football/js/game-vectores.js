// "Carrera de vectores" (Racetrack, Martin Gardner, Scientific American 1973).
//
// Un circuito corto sobre cuadrícula y un coche que se mueve por turnos con
// inercia: el estado es la VELOCIDAD. Cada jugada repite la flecha anterior
// (el punto fantasma) y se puede cambiar como mucho 1 en cada eje, así que
// hay 9 destinos posibles (el fantasma y sus 8 vecinos). El segmento de
// cada jugada no puede pasar por la hierba (rozar un borde o una esquina
// sí vale). Gana quien cruza la meta en ≤ par jugadas sin salirse.
//
// El par sale de un BFS sobre (x, y, vx, vy): óptimo + 3, +2, +1 y al final
// el óptimo exacto. Chocar o pasarse del par cuesta una vida, se explica el
// porqué (qué flechas eran posibles) y se dibuja la ruta óptima; después se
// repite el mismo circuito.
import { randInt, pick, saveScore } from "./utils.js";

const ROAD = 1;
const GRASS = 0;
const FIN = 2;
const PAR_EXTRA = [3, 2, 1, 0];
const NS = "http://www.w3.org/2000/svg";

// ---------------------------------------------------------------------
// Circuitos: plantillas (L, S, horquilla) hechas de tramos rectangulares
// con anchos al azar; espejo horizontal al azar.
// ---------------------------------------------------------------------
function buildTrack(tpl) {
  const C = 13;
  let R;
  const rects = []; // [x0, x1, y0, y1, tipo]
  const w1 = randInt(2, 4);
  const w2 = randInt(2, 4);
  const w3 = randInt(2, 4);
  let start, finishLine;
  if (tpl === "L") {
    R = randInt(13, 15);
    rects.push([1, w1, 1, R - 2, ROAD]);
    rects.push([1, C - 1, 1, w2, ROAD]);
    rects.push([C - 3, C - 1, 1, w2, FIN]);
    start = [1 + Math.floor((w1 - 1) / 2), R - 2];
    finishLine = [C - 3.5, 0.5, C - 3.5, w2 + 0.5];
  } else if (tpl === "S") {
    R = randInt(15, 17);
    const m = randInt(5, 7);
    rects.push([1, w1, m, R - 2, ROAD]);
    rects.push([1, C - 2, m, m + w2 - 1, ROAD]);
    rects.push([C - 1 - w3, C - 2, 0, m + w2 - 1, ROAD]);
    rects.push([C - 1 - w3, C - 2, 0, 2, FIN]);
    start = [1 + Math.floor((w1 - 1) / 2), R - 2];
    finishLine = [C - 1.5 - w3, 2.5, C - 1.5, 2.5];
  } else {
    // horquilla: sube, gira 180° y baja hasta la meta
    R = randInt(13, 15);
    rects.push([1, w1, 1, R - 2, ROAD]);
    rects.push([1, C - 2, 1, w2, ROAD]);
    rects.push([C - 1 - w3, C - 2, 1, R - 1, ROAD]);
    rects.push([C - 1 - w3, C - 2, R - 3, R - 1, FIN]);
    start = [1 + Math.floor((w1 - 1) / 2), R - 2];
    finishLine = [C - 1.5 - w3, R - 3.5, C - 1.5, R - 3.5];
  }
  const cells = new Array(C * R).fill(GRASS);
  for (const [x0, x1, y0, y1, k] of rects)
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) cells[y * C + x] = k;
  const startLine = [start[0] - Math.floor((w1 - 1) / 2) - 0.5, R - 1.5, start[0] - Math.floor((w1 - 1) / 2) + w1 - 0.5, R - 1.5];
  const trk = { tpl, C, R, cells, start, finishLine, startLine, widths: [w1, w2, w3] };
  if (Math.random() < 0.5) mirror(trk);
  return trk;
}

function mirror(trk) {
  const { C, R } = trk;
  const cells = trk.cells.slice();
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) cells[y * C + x] = trk.cells[y * C + (C - 1 - x)];
  trk.cells = cells;
  const fx = (x) => C - 1 - x;
  trk.start = [fx(trk.start[0]), trk.start[1]];
  trk.finishLine = [fx(trk.finishLine[0]), trk.finishLine[1], fx(trk.finishLine[2]), trk.finishLine[3]];
  trk.startLine = [fx(trk.startLine[0]), trk.startLine[1], fx(trk.startLine[2]), trk.startLine[3]];
}

const cellAt = (trk, x, y) => (x < 0 || y < 0 || x >= trk.C || y >= trk.R ? GRASS : trk.cells[y * trk.C + x]);

// Recorre el segmento muestreándolo finamente (60 muestras por casilla del
// eje mayor). Un punto justo en un borde de casilla no cuenta (rozar vale);
// si no, cuenta la casilla en cuyo interior cae. Lo primero que se pisa
// decide: meta → "win", hierba → "crash".
export function segmentResult(trk, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const n = 60 * Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let i = 1; i <= n; i++) {
    const x = x0 + (dx * i) / n;
    const y = y0 + (dy * i) / n;
    const cx = Math.round(x);
    const cy = Math.round(y);
    if (Math.abs(x - cx) > 0.5 - 1e-7 || Math.abs(y - cy) > 0.5 - 1e-7) continue;
    const c = cellAt(trk, cx, cy);
    if (c === FIN) return { res: "win", x, y };
    if (c === GRASS) return { res: "crash", x, y };
  }
  return { res: "ok", x: x1, y: y1 };
}

// Los 9 destinos desde (x, y) con velocidad (vx, vy). Solo se ofrecen los
// que caen dentro del mapa; si no cae ninguno, la única jugada es repetir
// la flecha (el fantasma).
export function destinations(trk, x, y, vx, vy) {
  const out = [];
  for (let ay = -1; ay <= 1; ay++)
    for (let ax = -1; ax <= 1; ax++) {
      const nvx = vx + ax;
      const nvy = vy + ay;
      const nx = x + nvx;
      const ny = y + nvy;
      if (nx >= 0 && ny >= 0 && nx < trk.C && ny < trk.R) out.push({ x: nx, y: ny, vx: nvx, vy: nvy });
    }
  if (!out.length) out.push({ x: x + vx, y: y + vy, vx, vy, forced: true });
  return out;
}

// BFS sobre (x, y, vx, vy) desde un estado: devuelve el nº mínimo de
// jugadas hasta cruzar la meta y la ruta (lista de puntos), o null.
export function solve(trk, sx, sy, svx = 0, svy = 0) {
  const key = (x, y, vx, vy) => `${x},${y},${vx},${vy}`;
  const seen = new Map();
  const s0 = { x: sx, y: sy, vx: svx, vy: svy, prev: null };
  seen.set(key(sx, sy, svx, svy), s0);
  let layer = [s0];
  let depth = 0;
  const segCache = new Map();
  while (layer.length && depth < 60) {
    const next = [];
    for (const s of layer) {
      for (const d of destinations(trk, s.x, s.y, s.vx, s.vy)) {
        const ck = `${s.x},${s.y},${d.vx},${d.vy}`;
        let r = segCache.get(ck);
        if (!r) segCache.set(ck, (r = segmentResult(trk, s.x, s.y, d.x, d.y)));
        if (r.res === "crash") continue;
        if (r.res === "win") {
          const path = [[d.x, d.y]];
          for (let p = s; p; p = p.prev) path.unshift([p.x, p.y]);
          return { moves: depth + 1, path };
        }
        const k = key(d.x, d.y, d.vx, d.vy);
        if (seen.has(k)) continue;
        const ns = { x: d.x, y: d.y, vx: d.vx, vy: d.vy, prev: s };
        seen.set(k, ns);
        next.push(ns);
      }
    }
    layer = next;
    depth++;
  }
  return null;
}

export function buildVectoresRound() {
  for (let guard = 0; guard < 200; guard++) {
    const trk = buildTrack(pick(["L", "S", "U"]));
    const sol = solve(trk, trk.start[0], trk.start[1]);
    // Se descartan (raros) circuitos cuya ruta óptima necesita una jugada
    // forzada fuera del mapa: la ruta modelo debe poder tocarse entera.
    const inMap = sol && sol.path.every(([x, y]) => x >= 0 && y >= 0 && x < trk.C && y < trk.R);
    if (inMap && sol.moves >= 5 && sol.moves <= 14) return { trk, opt: sol.moves, optPath: sol.path };
  }
  return null; // no ocurre (verificado), pero el juego lo resolvería regenerando
}

// Vector en convención matemática (y hacia arriba) para los textos.
const num = (v) => (v < 0 ? `−${-v}` : String(v || 0));
const fmt = (vx, vy) => `(${num(vx)}, ${num(-vy)})`;

// ---------------------------------------------------------------------
export function mountVectoresGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let round = null;
  let par = 0;
  let car = null; // { x, y, vx, vy }
  let moves = 0;
  let trail = []; // posiciones visitadas
  let busy = false;
  let pending = null;
  let raf = 0;
  let svg = null;
  let dests = [];
  let hover = null;

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

  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };

  function nextRound() {
    round = buildVectoresRound();
    if (!round) return nextRound();
    par = round.opt + PAR_EXTRA[Math.min(level, PAR_EXTRA.length - 1)];
    startAttempt();
  }

  // Empieza (o repite) el intento sobre el circuito actual.
  function startAttempt() {
    clearTimeout(pending);
    cancelAnimationFrame(raf);
    const { trk } = round;
    car = { x: trk.start[0], y: trk.start[1], vx: 0, vy: 0 };
    moves = 0;
    trail = [[car.x, car.y]];
    busy = false;
    hover = null;
    body.innerHTML = `
      <p class="prompt vc-prompt">Llega a la meta 🏁 en ${par} jugadas o menos
        <small>Tu flecha se repite (punto hueco) y puedes cambiarla 1 como mucho en cada eje:
        toca o arrastra hasta uno de los 9 puntos. No pises la hierba.</small></p>
      <div class="vc-hud">
        <span>Jugadas <b data-moves>0</b> / par <b data-par>${par}</b></span>
        <span>Flecha <b data-vel>(0, 0)</b></span>
      </div>
      <div class="vc-wrap" data-wrap></div>
      <div class="feedback vc-feedback" data-feedback></div>
      <div class="vc-actions" data-actions></div>
    `;
    drawTrack();
    turn();
  }

  function drawTrack() {
    const { trk } = round;
    const wrap = body.querySelector("[data-wrap]");
    svg = el("svg", {
      class: "vc-svg",
      viewBox: `-0.5 -0.5 ${trk.C} ${trk.R}`,
      "data-cols": trk.C,
      "data-rows": trk.R,
      "data-start": trk.start.join(","),
      // Geometría legible: '#' hierba, '.' pista, 'F' meta (filas de arriba abajo).
      "data-track": Array.from({ length: trk.R }, (_, y) =>
        Array.from({ length: trk.C }, (_, x) => ".#F"[[1, 0, 2][cellAt(trk, x, y)]]).join("")
      ).join("/"),
      "data-rule": "segmento muestreado; borde o esquina no cuenta; primero meta→gana, hierba→choca",
    });
    wrap.appendChild(svg);
    const defs = el("defs", {}, svg);
    const pat = el("pattern", { id: "vc-check", width: 0.5, height: 0.5, patternUnits: "userSpaceOnUse" }, defs);
    el("rect", { width: 0.5, height: 0.5, class: "vc-check-a" }, pat);
    el("rect", { width: 0.25, height: 0.25, class: "vc-check-b" }, pat);
    el("rect", { x: 0.25, y: 0.25, width: 0.25, height: 0.25, class: "vc-check-b" }, pat);
    for (const [id, cls] of [["vc-ah", "vc-ah-me"], ["vc-ah-opt", "vc-ah-opt"], ["vc-ah-pre", "vc-ah-pre"]]) {
      const m = el("marker", { id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 5, markerHeight: 5, orient: "auto-start-reverse" }, defs);
      el("path", { d: "M0,0 L10,5 L0,10 z", class: cls }, m);
    }
    el("rect", { x: -0.5, y: -0.5, width: trk.C, height: trk.R, class: "vc-grass" }, svg);
    const g = el("g", {}, svg);
    for (let y = 0; y < trk.R; y++)
      for (let x = 0; x < trk.C; x++) {
        const c = cellAt(trk, x, y);
        if (c === GRASS) continue;
        el("rect", { x: x - 0.5, y: y - 0.5, width: 1, height: 1, class: c === FIN ? "vc-fin" : "vc-road" }, g);
        el("circle", { cx: x, cy: y, r: 0.06, class: "vc-dot" }, g);
      }
    const [a, b, c2, d] = trk.finishLine;
    el("line", { x1: a, y1: b, x2: c2, y2: d, class: "vc-finline" }, svg);
    const [s1, s2, s3, s4] = trk.startLine;
    el("line", { x1: s1, y1: s2, x2: s3, y2: s4, class: "vc-startline" }, svg);
    el("g", { class: "vc-opt", "data-opt": "" }, svg);
    el("g", { class: "vc-trail", "data-trail": "" }, svg);
    el("g", { "data-dests": "" }, svg);
    el("line", { class: "vc-preview", "data-preview": "", "marker-end": "url(#vc-ah-pre)", visibility: "hidden" }, svg);
    el("circle", { r: 0.34, class: "vc-car", "data-car": "" }, svg);
    el("circle", { r: 0.5, class: "vc-boom", "data-boom": "", visibility: "hidden" }, svg);
    bindPointer();
  }

  function setCar(x, y) {
    const c = svg.querySelector("[data-car]");
    c.setAttribute("cx", x);
    c.setAttribute("cy", y);
  }

  function drawTrail() {
    const g = svg.querySelector("[data-trail]");
    g.innerHTML = "";
    for (let i = 1; i < trail.length; i++) {
      const [x0, y0] = trail[i - 1];
      const [x1, y1] = trail[i];
      if (x0 === x1 && y0 === y1) continue; // jugada parada: sin flecha
      el("line", {
        x1: x0, y1: y0, x2: x1, y2: y1,
        class: i === trail.length - 1 ? "vc-arrow vc-last" : "vc-arrow",
        "marker-end": "url(#vc-ah)",
      }, g);
    }
  }

  function turn() {
    drawTrail();
    setCar(car.x, car.y);
    body.querySelector("[data-moves]").textContent = moves;
    body.querySelector("[data-vel]").textContent = fmt(car.vx, car.vy);
    const g = svg.querySelector("[data-dests]");
    g.innerHTML = "";
    dests = destinations(round.trk, car.x, car.y, car.vx, car.vy);
    const gx = car.x + car.vx;
    const gy = car.y + car.vy;
    el("circle", { cx: gx, cy: gy, r: 0.42, class: "vc-ghostpt", "data-ghost": "", "data-x": gx, "data-y": gy }, g);
    for (const d of dests)
      el("circle", { cx: d.x, cy: d.y, r: 0.22, class: "vc-dest", "data-dest": "", "data-x": d.x, "data-y": d.y }, g);
    if (dests[0].forced) {
      // Ningún destino dentro del mapa: solo cabe repetir la flecha.
      busy = true;
      const fb = body.querySelector("[data-feedback]");
      fb.textContent = "Vas tan rápido que los 9 destinos se salen del mapa…";
      fb.className = "feedback bad";
      pending = setTimeout(() => commit(dests[0]), 900);
    }
  }

  function toSvg(ev) {
    const pt = svg.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }

  function nearest(p) {
    let best = null;
    let bd = 0.75;
    for (const d of dests) {
      const dd = Math.hypot(d.x - p.x, d.y - p.y);
      if (dd < bd) {
        bd = dd;
        best = d;
      }
    }
    return best;
  }

  function showHover(d) {
    hover = d;
    const pre = svg.querySelector("[data-preview]");
    svg.querySelectorAll("[data-dest]").forEach((c) =>
      c.classList.toggle("vc-hot", !!d && +c.dataset.x === d.x && +c.dataset.y === d.y)
    );
    if (!d) return pre.setAttribute("visibility", "hidden");
    pre.setAttribute("x1", car.x);
    pre.setAttribute("y1", car.y);
    pre.setAttribute("x2", d.x);
    pre.setAttribute("y2", d.y);
    pre.setAttribute("visibility", "visible");
  }

  // Tocar un destino o arrastrar (desde donde sea) hasta uno y soltar.
  function bindPointer() {
    let down = false;
    svg.addEventListener("pointerdown", (e) => {
      if (busy || finished) return;
      e.preventDefault();
      down = true;
      svg.setPointerCapture(e.pointerId);
      showHover(nearest(toSvg(e)));
    });
    svg.addEventListener("pointermove", (e) => {
      if (!down || busy || finished) return;
      showHover(nearest(toSvg(e)));
    });
    const up = (e) => {
      if (!down) return;
      down = false;
      if (busy || finished) return;
      const d = e.type === "pointercancel" ? null : nearest(toSvg(e));
      showHover(null);
      if (d) commit(d);
    };
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", up);
  }

  function commit(d) {
    if (finished) return;
    busy = true;
    const prev = { ...car };
    const r = segmentResult(round.trk, car.x, car.y, d.x, d.y);
    moves++;
    trail.push([r.x, r.y]);
    animateTo(prev.x, prev.y, r.x, r.y, () => {
      car = { x: d.x, y: d.y, vx: d.vx, vy: d.vy };
      if (r.res === "crash") return fail("crash", prev, d, r);
      if (r.res === "win") return win();
      if (moves >= par) return fail("par", prev, d, r);
      busy = false;
      const fb = body.querySelector("[data-feedback]");
      fb.textContent = "";
      fb.className = "feedback vc-feedback";
      turn();
    });
  }

  function animateTo(x0, y0, x1, y1, done) {
    drawTrail();
    svg.querySelector("[data-dests]").innerHTML = "";
    const t0 = performance.now();
    const dur = 260;
    const step = (now) => {
      if (finished) return;
      const t = Math.min(1, (now - t0) / dur);
      const e = t * (2 - t);
      setCar(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e);
      if (t < 1) raf = requestAnimationFrame(step);
      else done();
    };
    raf = requestAnimationFrame(step);
  }

  function win() {
    rounds++;
    score += 10;
    level++;
    renderScore();
    body.querySelector("[data-moves]").textContent = moves;
    const fb = body.querySelector("[data-feedback]");
    fb.textContent = `🏁 ¡Meta! ${moves} jugadas con par ${par}` + (moves === round.opt ? " (¡la ruta óptima!)" : ` (el óptimo era ${round.opt}).`);
    fb.className = "feedback ok vc-feedback";
    pending = setTimeout(nextRound, 1500);
  }

  function fail(kind, prev, d, r) {
    rounds++;
    lives--;
    renderLives();
    body.querySelector("[data-moves]").textContent = moves;
    const fb = body.querySelector("[data-feedback]");
    let msg;
    if (kind === "crash") {
      const boom = svg.querySelector("[data-boom]");
      boom.setAttribute("cx", r.x);
      boom.setAttribute("cy", r.y);
      boom.setAttribute("visibility", "visible");
      // ¿Había alguna salida desde donde estabas? (las 9 flechas posibles)
      const opts = [];
      for (let ay = -1; ay <= 1; ay++)
        for (let ax = -1; ax <= 1; ax++) {
          const vx = prev.vx + ax;
          const vy = prev.vy + ay;
          const res = segmentResult(round.trk, prev.x, prev.y, prev.x + vx, prev.y + vy).res;
          const visible = dests.some((o) => o.vx === vx && o.vy === vy);
          if (res !== "crash" && visible) opts.push({ vx, vy });
        }
      const range = `de ${fmt(prev.vx - 1, prev.vy + 1)} a ${fmt(prev.vx + 1, prev.vy - 1)}`;
      if (!opts.length)
        msg = `💥 Tu flecha era ${fmt(prev.vx, prev.vy)}; como mucho cambias 1 en cada eje → la siguiente iba ${range} y todas salían. Había que frenar antes.`;
      else
        msg = `💥 Tu flecha era ${fmt(prev.vx, prev.vy)} y elegiste ${fmt(d.vx, d.vy)}: ese tramo pisa la hierba. Con ${fmt(opts[0].vx, opts[0].vy)} seguías en la pista.`;
    } else {
      msg = `⏱️ Has gastado las ${par} jugadas del par sin cruzar la meta. Ir más deprisa en las rectas y frenar justo antes de las curvas ahorra jugadas.`;
    }
    msg += ` La ruta verde lo hace en ${round.opt} jugadas.`;
    fb.textContent = msg;
    fb.className = "feedback bad vc-feedback";
    drawOptimal();
    const actions = body.querySelector("[data-actions]");
    actions.innerHTML = `<button class="primary" data-again>${lives > 0 ? "Repetir circuito" : "Ver resultado"}</button>`;
    actions.querySelector("[data-again]").addEventListener("click", () => (lives > 0 ? startAttempt() : finish(false)));
  }

  function drawOptimal() {
    const g = svg.querySelector("[data-opt]");
    g.innerHTML = "";
    const p = round.optPath;
    for (let i = 1; i < p.length; i++) {
      el("line", { x1: p[i - 1][0], y1: p[i - 1][1], x2: p[i][0], y2: p[i][1], class: "vc-optline", "marker-end": "url(#vc-ah-opt)" }, g);
      el("circle", { cx: p[i - 1][0], cy: p[i - 1][1], r: 0.13, class: "vc-optdot" }, g);
    }
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
    saveScore(client, "vectores", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🏎️</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} circuitos completados dentro del par</p>
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
