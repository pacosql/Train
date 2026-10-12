// "Ojo de geómetra" (inspirado en The Eyeballing Game, de Matthias Wandel).
//
// Construir a ojo en el plano, sin números: punto medio, cuarto vértice
// de un paralelogramo, centro de una circunferencia, pie de la
// perpendicular, simétrico respecto a una recta, punto de la bisectriz,
// baricentro y punto que parte un segmento en razón 2:3. Se arrastra un
// punto que va ~40 px por encima del dedo (para que la yema no lo tape) y
// se confirma. Se puntúa el error relativo al tamaño de la figura: vale
// si es ≤ umbral (6 % al principio; con la racha baja hasta 2 %).
//
// Al confirmar se dibuja la construcción de verdad (arcos de compás,
// medianas, mediatrices…), el punto exacto y el tuyo, y a cuánto estabas.
// Todas las figuras salen al azar con tamaños y ángulos mínimos y el punto
// exacto se calcula analíticamente.
import { pick, clamp, saveScore } from "./utils.js";

const SIZE = 340; // lado del lienzo (unidades SVG ≈ px a 400 px de ancho)
const LIFT = 40; // el punto va 40 px por encima del dedo
const ORDER = ["medio", "paralelo", "centro", "pie", "simetrico", "bisectriz", "baricentro", "razon"];
const DEG = Math.PI / 180;

// ---------- Geometría ----------
const P = (x, y) => ({ x, y });
const add = (a, b) => P(a.x + b.x, a.y + b.y);
const sub = (a, b) => P(a.x - b.x, a.y - b.y);
const mul = (a, k) => P(a.x * k, a.y * k);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => P((a.x + b.x) / 2, (a.y + b.y) / 2);
const dir = (ang) => P(Math.cos(ang), Math.sin(ang));
const rnd = (a, b) => a + Math.random() * (b - a);
const inBox = (q, m) => q.x >= m && q.x <= SIZE - m && q.y >= m && q.y <= SIZE - m;
const randPt = (m) => P(rnd(m, SIZE - m), rnd(m, SIZE - m));
// Ángulo (en grados) del vértice B en el triángulo ABC.
function angleAt(a, b, c) {
  const u = sub(a, b);
  const v = sub(c, b);
  const cos = (u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y));
  return Math.acos(clamp(cos, -1, 1)) / DEG;
}

// ---------- Trozos de SVG ----------
const f = (n) => n.toFixed(1);
const seg = (a, b, cls = "oj-seg") => `<line class="${cls}" x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}"/>`;
const dot = (q, cls = "oj-dot", r = 4) => `<circle class="${cls}" cx="${f(q.x)}" cy="${f(q.y)}" r="${r}"/>`;
const label = (q, t, away) => {
  const v = away ? sub(q, away) : P(0, -1);
  const n = Math.hypot(v.x, v.y) || 1;
  const o = add(q, mul(v, 15 / n));
  return `<text class="oj-lbl" x="${f(o.x)}" y="${f(o.y)}">${t}</text>`;
};
// Arco de circunferencia de centro c y radio r entre los ángulos a0 < a1.
function arc(c, r, a0, a1, cls = "oj-arc") {
  const p0 = add(c, mul(dir(a0), r));
  const p1 = add(c, mul(dir(a1), r));
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `<path class="${cls}" d="M${f(p0.x)} ${f(p0.y)} A${f(r)} ${f(r)} 0 ${large} 1 ${f(p1.x)} ${f(p1.y)}"/>`;
}
// Arquito de compás alrededor del punto q (visto desde el centro c).
function arcAround(c, q, spread = 12 * DEG, cls = "oj-arc") {
  const a = Math.atan2(q.y - c.y, q.x - c.x);
  return arc(c, dist(c, q), a - spread, a + spread, cls);
}
// Recta "infinita" (el SVG la recorta) que pasa por q con dirección u.
const longLine = (q, u, cls) => seg(add(q, mul(u, -600)), add(q, mul(u, 600)), cls);
function rightAngle(at, u, n) {
  const s = 9;
  const a = add(at, mul(u, s));
  const b = add(a, mul(n, s));
  const c = add(at, mul(n, s));
  return `<path class="oj-help" d="M${f(a.x)} ${f(a.y)} L${f(b.x)} ${f(b.y)} L${f(c.x)} ${f(c.y)}"/>`;
}

// ---------- Generadores (cada uno devuelve la figura, el punto exacto,
// el tamaño de referencia y la construcción que se enseña después) ----------
const GEN = {
  medio() {
    for (;;) {
      const A = randPt(30);
      const len = rnd(160, 280);
      const B = add(A, mul(dir(rnd(0, 2 * Math.PI)), len));
      if (!inBox(B, 30)) continue;
      const M = mid(A, B);
      const u = mul(sub(B, A), 1 / len);
      const n = P(-u.y, u.x);
      const r = 0.62 * len;
      const h = Math.sqrt(r * r - (len / 2) ** 2);
      const X1 = add(M, mul(n, h));
      const X2 = add(M, mul(n, -h));
      return {
        kind: "medio",
        prompt: "Marca el punto medio del segmento",
        given: { A, B },
        figure: seg(A, B) + dot(A) + dot(B),
        answer: M,
        size: len,
        build:
          arcAround(A, X1) + arcAround(A, X2) + arcAround(B, X1) + arcAround(B, X2) +
          longLine(M, n, "oj-help") + dot(X1, "oj-mark", 3) + dot(X2, "oj-mark", 3),
        why: "Dos arcos de compás iguales desde cada extremo se cortan en dos puntos; la recta que los une corta el segmento justo en su mitad.",
      };
    }
  },
  paralelo() {
    for (;;) {
      const B = randPt(60);
      const a1 = rnd(0, 2 * Math.PI);
      const a2 = a1 + rnd(50, 130) * DEG * (Math.random() < 0.5 ? 1 : -1);
      const A = add(B, mul(dir(a1), rnd(120, 190)));
      const C = add(B, mul(dir(a2), rnd(120, 190)));
      const D = sub(add(A, C), B);
      if (![A, C].every((q) => inBox(q, 25)) || !inBox(D, 30)) continue;
      const O = mid(A, C);
      return {
        kind: "paralelo",
        prompt: "Marca el cuarto vértice D del paralelogramo ABCD",
        given: { A, B, C },
        figure: seg(A, B) + seg(B, C) + dot(A) + dot(B) + dot(C) + label(A, "A", O) + label(B, "B", O) + label(C, "C", O),
        answer: D,
        size: Math.max(dist(A, C), dist(B, D)),
        build: seg(A, D, "oj-help") + seg(C, D, "oj-help") + seg(A, C, "oj-faint") + seg(B, D, "oj-faint") + dot(O, "oj-mark", 3),
        why: "Los lados opuestos son paralelos e iguales (AD como BC, CD como AB), y las diagonales se cortan en su punto medio.",
      };
    }
  },
  centro() {
    for (;;) {
      const r = rnd(70, 140);
      const O = P(rnd(r + 15, SIZE - r - 15), rnd(r + 15, SIZE - r - 15));
      const u = rnd(0, 2 * Math.PI);
      const v = u + rnd(110, 200) * DEG;
      const p1 = rnd(100, 150) * DEG;
      const p2 = rnd(100, 150) * DEG;
      // Las dos mediatrices deben cruzarse con un ángulo claro (≥ 50°).
      let gap = Math.abs((u + p1 / 2 - (v + p2 / 2)) / DEG) % 180;
      gap = Math.min(gap, 180 - gap);
      if (gap < 50) continue;
      const C1 = [add(O, mul(dir(u), r)), add(O, mul(dir(u + p1), r))];
      const C2 = [add(O, mul(dir(v), r)), add(O, mul(dir(v + p2), r))];
      const bis = (c) => {
        const m = mid(c[0], c[1]);
        const w = sub(O, m);
        const n = Math.hypot(w.x, w.y);
        const e = add(O, mul(w, (0.45 * r) / n));
        return seg(m, e, "oj-help") + dot(m, "oj-mark", 3) + rightAngle(m, mul(sub(c[1], c[0]), 1 / dist(c[0], c[1])), mul(w, 1 / n));
      };
      return {
        kind: "centro",
        prompt: "Marca el centro de la circunferencia",
        given: { O, r },
        figure: `<circle class="oj-seg oj-circle" cx="${f(O.x)}" cy="${f(O.y)}" r="${f(r)}"/>`,
        answer: O,
        size: 2 * r,
        build: seg(C1[0], C1[1], "oj-chord") + seg(C2[0], C2[1], "oj-chord") + bis(C1) + bis(C2),
        why: "La mediatriz de cualquier cuerda pasa por el centro: dos mediatrices se cortan justo en él.",
      };
    }
  },
  pie() {
    for (;;) {
      const F = randPt(60);
      const u = dir(rnd(0, Math.PI));
      const n = P(-u.y, u.x);
      const d = rnd(110, 170) * (Math.random() < 0.5 ? 1 : -1);
      const Pp = add(F, mul(n, d));
      if (!inBox(Pp, 25)) continue;
      const rho = 1.35 * Math.abs(d);
      const s = Math.sqrt(rho * rho - d * d);
      const X1 = add(F, mul(u, s));
      const X2 = add(F, mul(u, -s));
      return {
        kind: "pie",
        prompt: "Marca el pie de la perpendicular desde P a la recta",
        sub: "el punto de la recta donde P forma ángulo recto",
        given: { F, u, P: Pp },
        figure: longLine(F, u, "oj-seg") + dot(Pp) + label(Pp, "P", F),
        answer: F,
        size: Math.abs(d),
        build:
          arcAround(Pp, X1, 10 * DEG) + arcAround(Pp, X2, 10 * DEG) + dot(X1, "oj-mark", 3) + dot(X2, "oj-mark", 3) +
          seg(Pp, F, "oj-help") + rightAngle(F, u, mul(n, Math.sign(d))),
        why: "Un arco con centro en P corta la recta en dos puntos: el pie está justo en medio, y ahí PF forma ángulo recto con la recta.",
      };
    }
  },
  simetrico() {
    for (;;) {
      const F = randPt(70);
      const u = dir(rnd(0, Math.PI));
      const n = P(-u.y, u.x);
      const d = rnd(55, 100) * (Math.random() < 0.5 ? 1 : -1);
      const Pp = add(F, mul(n, d));
      const Q = add(F, mul(n, -d));
      if (!inBox(Pp, 25) || !inBox(Q, 25)) continue;
      const a = Math.atan2(n.y, n.x);
      return {
        kind: "simetrico",
        prompt: "Marca el simétrico de P respecto a la recta",
        given: { F, u, P: Pp },
        figure: longLine(F, u, "oj-seg oj-mirror") + dot(Pp) + label(Pp, "P", F),
        answer: Q,
        size: 2 * Math.abs(d),
        build:
          seg(add(Pp, mul(n, Math.sign(d) * 14)), add(Q, mul(n, -Math.sign(d) * 14)), "oj-help") +
          rightAngle(F, u, mul(n, Math.sign(d))) + arc(F, Math.abs(d), a - 0.25, a + 0.25) + arc(F, Math.abs(d), a + Math.PI - 0.25, a + Math.PI + 0.25),
        why: "El simétrico está en la perpendicular que pasa por P, al otro lado de la recta y a la misma distancia (el compás con centro en la recta lo marca).",
      };
    }
  },
  bisectriz() {
    for (;;) {
      const V = randPt(30);
      const R = rnd(170, 230);
      const a1 = rnd(0, 2 * Math.PI);
      const span = rnd(40, 140) * DEG;
      const a2 = a1 + span;
      const E1 = add(V, mul(dir(a1), R));
      const E2 = add(V, mul(dir(a2), R));
      if (!inBox(E1, 15) || !inBox(E2, 15)) continue;
      const bisA = a1 + span / 2;
      const rho = 0.7 * R;
      const T = add(V, mul(dir(bisA), rho));
      if (!inBox(T, 25)) continue;
      const k = 0.35 * R;
      const X1 = add(V, mul(dir(a1), k));
      const X2 = add(V, mul(dir(a2), k));
      const c = dist(X1, X2);
      const r2 = Math.max(0.9 * c, 0.6 * k);
      const Y = add(mid(X1, X2), mul(dir(bisA), Math.sqrt(r2 * r2 - (c / 2) ** 2)));
      return {
        kind: "bisectriz",
        prompt: "Marca dónde la bisectriz del ángulo corta el arco",
        sub: "la bisectriz parte el ángulo en dos iguales",
        given: { V, a1, a2, R, rho },
        figure: seg(V, E1) + seg(V, E2) + dot(V) + arc(V, rho, a1, a2, "oj-guide"),
        answer: T,
        size: R,
        build:
          arc(V, k, a1, a2) + dot(X1, "oj-mark", 3) + dot(X2, "oj-mark", 3) + arcAround(X1, Y, 9 * DEG) + arcAround(X2, Y, 9 * DEG) +
          seg(V, add(V, mul(dir(bisA), R)), "oj-help"),
        why: "Compás desde el vértice; desde los dos cortes, dos arcos iguales: su cruce y el vértice marcan la bisectriz.",
      };
    }
  },
  baricentro() {
    for (;;) {
      const A = randPt(25);
      const B = randPt(25);
      const C = randPt(25);
      const sides = [dist(A, B), dist(B, C), dist(C, A)];
      if (Math.min(...sides) < 120) continue;
      if (Math.min(angleAt(B, A, C), angleAt(A, B, C), angleAt(A, C, B)) < 25) continue;
      const G = P((A.x + B.x + C.x) / 3, (A.y + B.y + C.y) / 3);
      const ms = [mid(B, C), mid(C, A), mid(A, B)];
      return {
        kind: "baricentro",
        prompt: "Marca el baricentro del triángulo",
        sub: "el punto de equilibrio: donde se cruzan las medianas",
        given: { A, B, C },
        figure: `<polygon class="oj-seg oj-tri" points="${[A, B, C].map((q) => `${f(q.x)},${f(q.y)}`).join(" ")}"/>`,
        answer: G,
        size: Math.max(...sides),
        build: seg(A, ms[0], "oj-help") + seg(B, ms[1], "oj-help") + seg(C, ms[2], "oj-help") + ms.map((m) => dot(m, "oj-mark", 3)).join(""),
        why: "Las tres medianas (de cada vértice al punto medio del lado opuesto) se cruzan en el baricentro, a 2/3 de cada vértice.",
      };
    }
  },
  razon() {
    for (;;) {
      const A = randPt(30);
      const len = rnd(200, 290);
      const B = add(A, mul(dir(rnd(0, 2 * Math.PI)), len));
      if (!inBox(B, 30)) continue;
      const T = add(A, mul(sub(B, A), 0.4));
      const u = mul(sub(B, A), 1 / len);
      const n = P(-u.y, u.x);
      let ticks = "";
      for (let i = 1; i < 5; i++) {
        const q = add(A, mul(sub(B, A), i / 5));
        ticks += seg(add(q, mul(n, 7)), add(q, mul(n, -7)), "oj-tick");
      }
      const l2 = add(add(A, mul(sub(B, A), 0.2)), mul(n, 16));
      const l3 = add(add(A, mul(sub(B, A), 0.7)), mul(n, 16));
      return {
        kind: "razon",
        prompt: "Marca P en AB de modo que AP : PB = 2 : 3",
        given: { A, B },
        figure: seg(A, B) + dot(A) + dot(B) + label(A, "A", B) + label(B, "B", A),
        answer: T,
        size: len,
        build:
          ticks + seg(A, T, "oj-part2") + seg(T, B, "oj-part3") +
          `<text class="oj-lbl small" x="${f(l2.x)}" y="${f(l2.y)}">2</text><text class="oj-lbl small" x="${f(l3.x)}" y="${f(l3.y)}">3</text>`,
        why: "Parte AB en 5 trozos iguales (2 + 3): P deja 2 trozos del lado de A y 3 del lado de B.",
      };
    }
  },
};
export function buildOjoTask(kind) {
  return GEN[kind]();
}
export const OJO_ORDER = ORDER;
// Umbral: 6 % al empezar; cada acierto seguido lo baja medio punto, hasta 2 %.
export const ojoThreshold = (streak) => Math.max(0.02, 0.06 - 0.005 * streak);

const pct = (x) => `${String(Math.round(x * 1000) / 10).replace(".", ",")} %`;

// ---------- Juego ----------
export function mountOjoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let task = null;
  let user = null;
  let done = false;
  let dragging = false;
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
    const kind = rounds < ORDER.length ? ORDER[rounds] : pick(ORDER);
    task = buildOjoTask(kind);
    user = null;
    done = false;
    dragging = false;
    const thr = ojoThreshold(streak);
    body.innerHTML = `
      <p class="prompt oj-prompt">${task.prompt}
        <small>${task.sub ? `${task.sub} · ` : ""}a ojo, sin medir · vale si fallas ≤ ${pct(thr)}</small></p>
      <svg class="oj-svg" data-svg viewBox="0 0 ${SIZE} ${SIZE}" data-kind="${task.kind}" role="img" aria-label="Figura">
        <g data-fig>${task.figure}</g><g data-over></g><g data-user></g>
      </svg>
      <p class="oj-tip" data-tip>Arrastra: el punto va un poco por encima del dedo</p>
      <button type="button" class="primary oj-btn" data-ok disabled>Confirmar</button>
      <div class="feedback" data-feedback></div>
      <p class="oj-why" data-why></p>
      <button type="button" class="secondary oj-next" data-next hidden>Seguir →</button>
    `;
    svg = body.querySelector("[data-svg]");
    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);
    svg.addEventListener("pointercancel", onUp);
    body.querySelector("[data-ok]").addEventListener("click", confirm);
    body.querySelector("[data-next]").addEventListener("click", () => {
      if (finished) return;
      if (lives <= 0) finish(false);
      else nextRound();
    });
  }

  function toUnits(x, y) {
    const pt = svg.createSVGPoint();
    pt.x = x;
    pt.y = y;
    const r = pt.matrixTransform(svg.getScreenCTM().inverse());
    return P(r.x, r.y);
  }
  function paintUser(finger) {
    const g = body.querySelector("[data-user]");
    if (!user) return (g.innerHTML = "");
    let s = "";
    if (finger) s += seg(finger, user, "oj-stalk") + dot(finger, "oj-finger", 16);
    s += `<circle class="oj-ring" cx="${f(user.x)}" cy="${f(user.y)}" r="11"/>` + dot(user, "oj-user", 4);
    g.innerHTML = s;
  }
  function place(e) {
    const finger = toUnits(e.clientX, e.clientY);
    const q = toUnits(e.clientX, e.clientY - LIFT);
    user = P(clamp(q.x, 0, SIZE), clamp(q.y, 0, SIZE));
    paintUser(finger);
  }
  function onDown(e) {
    if (finished || done) return;
    e.preventDefault();
    svg.setPointerCapture(e.pointerId);
    dragging = true;
    place(e);
  }
  function onMove(e) {
    if (!dragging || finished || done) return;
    place(e);
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    paintUser(null);
    const ok = body.querySelector("[data-ok]");
    if (ok && user) ok.disabled = false;
  }

  function confirm() {
    if (finished || done || !user) return;
    done = true;
    rounds++;
    const thr = ojoThreshold(streak);
    const err = dist(user, task.answer);
    const rel = err / task.size;
    const px = Math.round(err * (svg.getBoundingClientRect().width / SIZE));
    const good = rel <= thr + 1e-12;
    const A = task.answer;
    body.querySelector("[data-over]").innerHTML =
      `<g class="oj-build">${task.build}</g>` +
      seg(user, A, "oj-err") +
      `<circle class="oj-good-ring" cx="${f(A.x)}" cy="${f(A.y)}" r="${f(Math.max(3, thr * task.size))}"/>` +
      dot(A, "oj-good", 5);
    body.querySelector("[data-ok]").disabled = true;
    body.querySelector("[data-tip]").textContent = "Verde: el punto exacto y la zona que valía · morado: el tuyo";
    const fb = body.querySelector("[data-feedback]");
    const why = body.querySelector("[data-why]");
    why.textContent = task.why;
    const next = body.querySelector("[data-next]");
    next.hidden = false;
    if (good) {
      score += 10;
      streak++;
      renderScore();
      fb.textContent = `¡Ojo fino! a ${px} px / ${pct(rel)}`;
      fb.className = "feedback ok";
      later(nextRound, 2600);
      return;
    }
    streak = 0;
    lives--;
    renderLives();
    fb.textContent = `✗ a ${px} px / ${pct(rel)} — valía hasta ${pct(thr)}`;
    fb.className = "feedback bad";
    next.textContent = lives <= 0 ? "Ver puntuación" : "Seguir →";
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimers();
    dragging = false;
    if (userExited) return onExit();
    saveScore(client, "ojo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧐</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} construcciones a ojo · ${rounds} intentos</p>
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
    clearTimers();
    dragging = false;
  };
}
