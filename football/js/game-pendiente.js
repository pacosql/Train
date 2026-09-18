// "La cuesta de la recta" — juego grande (simulación de montaña rusa por
// niveles) sobre funciones lineales y = m·x + n. La pendiente se vive como
// "sube m por cada 1 que avanzas" con una escalera dibujada sobre la
// recta; la ordenada n es donde la recta corta el eje vertical. Niveles:
// leer la pendiente → leer la ecuación → trazar la recta tocando dos
// puntos → hacer pasar la recta por dos aros ajustando m y n → reto: el
// punto de corte de dos rectas. Resultados con explicación y repaso;
// progreso persistente en localStorage + football_progress.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

export const R = 5; // rejilla de -R..R en los dos ejes
const M_POOL = [-3, -2, -1, 1, 2, 3];
const ROUNDS = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 };
const LEVEL_NAMES = { 1: "Lee la pendiente", 2: "Lee la ecuación", 3: "Traza la recta", 4: "Pasa por los aros", 5: "El corte" };
const STORAGE_KEY = "football_pendiente_progress";
const PLAYER_KEY = "football_player_id";

// ---------------- geometría pura ----------------

export function latticePoints(m, n) {
  const pts = [];
  for (let x = -R; x <= R; x++) { const y = m * x + n; if (y >= -R && y <= R) pts.push([x, y]); }
  return pts;
}
export function fmtEq(m, n) {
  const mx = m === 1 ? "x" : m === -1 ? "−x" : `${m < 0 ? "−" : ""}${Math.abs(m)}x`;
  const nn = n === 0 ? "" : n > 0 ? ` + ${n}` : ` − ${Math.abs(n)}`;
  return `y = ${mx}${nn}`;
}
function randLine() {
  let m, n;
  do { m = pick(M_POOL); n = randInt(-4, 4); } while (latticePoints(m, n).length < 3);
  return { m, n };
}

export function genSlopeRound() {
  const { m, n } = randLine();
  const options = shuffle([m, ...shuffle(M_POOL.filter((v) => v !== m)).slice(0, 3)]);
  return { m, n, options, answer: m };
}

export function genEquationRound() {
  const { m, n } = randLine();
  const cands = [[-m, n], [n === 0 ? m + 1 : n, m], [m, n + 1], [m, n - 1], [-m, -n]].filter(([a, b]) => a !== 0 && !(a === m && b === n) && Math.abs(a) <= 3 && Math.abs(b) <= 5);
  const seen = new Set([`${m},${n}`]);
  const distract = [];
  for (const [a, b] of shuffle(cands)) { const k = `${a},${b}`; if (!seen.has(k)) { seen.add(k); distract.push([a, b]); } if (distract.length === 3) break; }
  while (distract.length < 3) { const a = pick(M_POOL), b = randInt(-4, 4); const k = `${a},${b}`; if (!seen.has(k)) { seen.add(k); distract.push([a, b]); } }
  const options = shuffle([[m, n], ...distract]);
  return { m, n, options, answer: `${m},${n}` };
}

export function genDrawRound() {
  return randLine();
}

export function genRingsRound() {
  const { m, n } = randLine();
  const pts = shuffle(latticePoints(m, n));
  return { m, n, rings: [pts[0], pts[1]] };
}

export function genCrossRound() {
  let a, b, x, y;
  let guard = 0;
  do {
    a = randLine(); b = randLine();
    if (a.m === b.m) continue;
    const num = b.n - a.n, den = a.m - b.m;
    if (num % den !== 0) continue;
    x = num / den; y = a.m * x + a.n;
    guard++;
  } while ((a.m === b.m || !Number.isInteger(x) || Math.abs(x) > R || Math.abs(y) > R || (b.n - a.n) % (a.m - b.m) !== 0) && guard < 2000);
  return { a, b, x, y };
}

// ---------------- dibujo ----------------

const CELL = 28;
const PAD = 16;
const SIZE = CELL * 2 * R + PAD * 2;
const toPx = (v) => PAD + (v + R) * CELL;
const toPy = (v) => PAD + (R - v) * CELL;

function gridSvg({ lines = [], points = [], rings = [], marks = [], tappable = false, stairs = null } = {}) {
  let out = "";
  for (let i = -R; i <= R; i++) {
    out += `<line x1="${toPx(i)}" y1="${toPy(-R)}" x2="${toPx(i)}" y2="${toPy(R)}" class="pnd-grid ${i === 0 ? "pnd-axis" : ""}" /><line x1="${toPx(-R)}" y1="${toPy(i)}" x2="${toPx(R)}" y2="${toPy(i)}" class="pnd-grid ${i === 0 ? "pnd-axis" : ""}" />`;
    if (i !== 0) out += `<text x="${toPx(i)}" y="${toPy(0) + 12}" class="pnd-tick">${i}</text><text x="${toPx(0) - 6}" y="${toPy(i) + 4}" class="pnd-tick pnd-tick-y">${i}</text>`;
  }
  lines.forEach(({ m, n, cls = "" }, idx) => {
    const y1 = m * -R + n, y2 = m * R + n;
    out += `<line x1="${toPx(-R)}" y1="${toPy(y1)}" x2="${toPx(R)}" y2="${toPy(y2)}" class="pnd-line ${cls}" data-line="${idx}" data-m="${m}" data-n="${n}" />`;
  });
  if (stairs) {
    const { m, n, steps } = stairs;
    for (let s = 0; s < steps; s++) { const x0 = s, y0 = m * x0 + n, x1 = x0 + 1, y1 = m * x1 + n;
      out += `<path d="M ${toPx(x0)} ${toPy(y0)} H ${toPx(x1)} V ${toPy(y1)}" class="pnd-stair" /><text x="${toPx(x0) + CELL / 2}" y="${toPy(y0) + 12}" class="pnd-stair-label">avanza 1</text><text x="${toPx(x1) + 4}" y="${(toPy(y0) + toPy(y1)) / 2 + 4}" class="pnd-stair-label">${m > 0 ? "sube" : "baja"} ${Math.abs(m)}</text>`; }
  }
  rings.forEach(([x, y]) => { out += `<circle cx="${toPx(x)}" cy="${toPy(y)}" r="9" class="pnd-ring" data-ring="${x},${y}" />`; });
  marks.forEach(([x, y]) => { out += `<circle cx="${toPx(x)}" cy="${toPy(y)}" r="6" class="pnd-mark" />`; });
  if (tappable) for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) out += `<circle cx="${toPx(x)}" cy="${toPy(y)}" r="9" class="pnd-tap" data-x="${x}" data-y="${y}" />`;
  points.forEach(([x, y]) => { out += `<circle cx="${toPx(x)}" cy="${toPy(y)}" r="5" class="pnd-point" />`; });
  return `<svg class="pnd-svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}" data-grid data-r="${R}" data-cell="${CELL}" data-pad="${PAD}">${out}</svg>`;
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
  try { await client.from("football_progress").upsert({ game: "pendiente", player: playerId(), data: progress, updated_at: new Date().toISOString() }); } catch (_) { /* guinda */ }
}

// ---------------- juego ----------------

export function mountPendienteGame(container, { client, onExit }) {
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
  const feedback = (t, ok) => { const el = body.querySelector("[data-feedback]"); if (el) { el.textContent = t; el.className = `feedback ${ok ? "ok" : "bad"}`; } };
  const header = (t, s) => `<p class="prompt">${t}${s ? `<small>${s}</small>` : ""}</p>`;
  const badge = (t) => `<div class="pnd-badge">${t}</div>`;
  const recordError = (tipo, explicacion) => errors.push({ tipo, explicacion });
  function loseLife(next) { lives--; renderLives(); if (lives <= 0) later(screenResults, 2800); else later(next, 2800); }
  function nextRound() {
    roundIdx++;
    if (roundIdx >= ROUNDS[level]) {
      levelReached = Math.max(levelReached, level);
      progress.nivelMax = Math.max(progress.nivelMax || 0, level);
      saveProgress(client, progress);
      roundIdx = 0;
      if (level >= 5) screenResults(); else screenMap();
      return;
    }
    startLevel(level);
  }
  function startLevel(l) { level = l; ({ 1: screenSlope, 2: screenEquation, 3: screenDraw, 4: screenRings, 5: screenCross })[l](); }
  function outcome(ok, tipo, expl, review, retry) {
    locked = true;
    if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : nextRound(); }, 2000); }
    else if (review) { feedback(`No: ${expl} Otra vez.`, false); later(() => { locked = false; retry(); }, 2600); }
    else { recordError(tipo, expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; nextRound(); }); }
  }

  // ---- mapa ----
  function screenMap() {
    locked = false;
    const unlocked = Math.min((progress.nivelMax || 0) + 1, 5);
    const nodes = [1, 2, 3, 4, 5].map((l) => { const done = l <= (progress.nivelMax || 0), open = l <= unlocked; return `<button type="button" class="pnd-node ${done ? "pnd-node-done" : ""}" data-level="${l}" ${open ? "" : "disabled"}><span class="pnd-node-num">${done ? "✓" : l}</span><span class="pnd-node-name">${LEVEL_NAMES[l]}</span></button>`; }).join("");
    body.innerHTML = `
      ${header("La cuesta de la recta", "Una recta es una cuesta: sube m por cada 1 que avanza y arranca en n")}
      <div class="pnd-map">${nodes}</div>
      <div class="pnd-actions"><button type="button" class="secondary" data-tutorial>Ver la escalera (tutorial)</button></div>
      <p class="pnd-progress">${progress.partidas ? `Partidas: ${progress.partidas}. Tramos superados: ${progress.nivelMax || 0} de 5.` : "Primera vez: mira el tutorial y empieza por el tramo 1."}</p>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-level]").forEach((b) => b.addEventListener("click", () => { roundIdx = 0; startLevel(Number(b.getAttribute("data-level"))); }));
    body.querySelector("[data-tutorial]").addEventListener("click", screenTutorial);
  }

  // ---- tutorial: la escalera ----
  function screenTutorial() {
    const m = pick([1, 2, -1, -2]), n = pick([-1, 0, 1]);
    let steps = 0;
    body.innerHTML = `
      ${badge("Tutorial · la escalera de la pendiente")}
      ${header("Avanza 1 y mira cuánto sube (o baja) la recta", "Toca 'Avanza 1' tres veces; después escribe m y n")}
      <div class="pnd-wrap" data-wrap>${gridSvg({ lines: [{ m, n }], stairs: { m, n, steps: 0 } })}</div>
      <div class="pnd-actions"><button type="button" class="primary" data-step>Avanza 1</button></div>
      <div class="pnd-formula" data-formula>y = <b>?</b>·x + <b>?</b></div>
      <div class="feedback" data-feedback></div>`;
    body.querySelector("[data-step]").addEventListener("click", () => {
      if (locked || finished) return;
      steps = Math.min(3, steps + 1);
      body.querySelector("[data-wrap]").innerHTML = gridSvg({ lines: [{ m, n }], stairs: { m, n, steps } });
      if (steps === 3) {
        locked = true; award();
        body.querySelector("[data-formula]").innerHTML = `${fmtEq(m, n)} — cada paso ${m > 0 ? "sube" : "baja"} ${Math.abs(m)} (m = ${m}) y en x = 0 la recta vale ${n} (n = ${n})`;
        feedback("Eso es la pendiente: lo que sube por cada paso. Y n es la altura de salida en x = 0.", true);
        const btn = body.querySelector("[data-step]"); btn.textContent = "Al tramo 1 →"; btn.setAttribute("data-next", "");
        btn.addEventListener("click", () => { locked = false; roundIdx = 0; startLevel(1); }, { once: true });
      } else feedback(`Paso ${steps}: la recta ${m > 0 ? "sube" : "baja"} ${Math.abs(m)}.`, true);
    });
  }

  // ---- nivel 1: pendiente ----
  function screenSlope(review = false) {
    const r = genSlopeRound();
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 1 · ${LEVEL_NAMES[1]} · ${roundIdx + 1} de ${ROUNDS[1]}`)}
      ${header("¿Cuál es la pendiente m de esta recta?", "Avanza 1 en x y mira cuánto sube o baja")}
      <div class="pnd-wrap">${gridSvg({ lines: [{ m: r.m, n: r.n }], points: latticePoints(r.m, r.n) })}</div>
      <div class="pnd-options">${r.options.map((v) => `<button type="button" class="choice-btn pnd-opt" data-m="${v}">m = ${v}</button>`).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-m]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      const v = Number(btn.getAttribute("data-m")); const ok = v === r.m;
      body.querySelectorAll("[data-m]").forEach((x) => (x.disabled = true)); btn.classList.add(ok ? "correct" : "wrong");
      outcome(ok, "leer la pendiente", `por cada 1 que avanza, la recta ${r.m > 0 ? "sube" : "baja"} ${Math.abs(r.m)}: m = ${r.m} (${fmtEq(r.m, r.n)}).`, review, () => screenSlope(true));
    }));
  }

  // ---- nivel 2: ecuación ----
  function screenEquation(review = false) {
    const r = genEquationRound();
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 2 · ${LEVEL_NAMES[2]} · ${roundIdx + 1} de ${ROUNDS[2]}`)}
      ${header("¿Cuál es la ecuación de esta recta?", "m es la cuesta; n es donde corta el eje vertical (x = 0)")}
      <div class="pnd-wrap">${gridSvg({ lines: [{ m: r.m, n: r.n }], points: latticePoints(r.m, r.n) })}</div>
      <div class="pnd-options">${r.options.map(([a, b]) => `<button type="button" class="choice-btn pnd-opt" data-eq="${a},${b}">${fmtEq(a, b)}</button>`).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-eq]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      const ok = btn.getAttribute("data-eq") === r.answer;
      body.querySelectorAll("[data-eq]").forEach((x) => (x.disabled = true)); btn.classList.add(ok ? "correct" : "wrong");
      outcome(ok, "leer la ecuación", `${fmtEq(r.m, r.n)}: pendiente ${r.m} y corte con el eje vertical en ${r.n}.`, review, () => screenEquation(true));
    }));
  }

  // ---- nivel 3: traza la recta ----
  function screenDraw(review = false) {
    const r = genDrawRound();
    const chosen = [];
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 3 · ${LEVEL_NAMES[3]} · ${roundIdx + 1} de ${ROUNDS[3]}`)}
      ${header(`Traza <b>${fmtEq(r.m, r.n)}</b>: toca dos puntos por los que pase`, "Empieza por x = 0 (vale n) y avanza 1 subiendo m")}
      <div class="pnd-wrap" data-wrap>${gridSvg({ tappable: true })}</div>
      <div class="feedback" data-feedback></div>`;
    const bind = () => body.querySelectorAll("[data-x]").forEach((c) => c.addEventListener("click", () => {
      if (locked || finished) return;
      const x = Number(c.getAttribute("data-x")), y = Number(c.getAttribute("data-y"));
      if (chosen.some(([a, b]) => a === x && b === y)) return;
      chosen.push([x, y]);
      body.querySelector("[data-wrap]").innerHTML = gridSvg({ tappable: chosen.length < 2, marks: chosen, lines: chosen.length === 2 ? [{ m: r.m, n: r.n, cls: "pnd-line-soft" }] : [] });
      if (chosen.length < 2) { bind(); feedback("Uno. Ahora el segundo punto.", true); return; }
      const ok = chosen.every(([a, b]) => r.m * a + r.n === b);
      const bad = chosen.find(([a, b]) => r.m * a + r.n !== b);
      outcome(ok, "trazar la recta", ok ? `los dos puntos cumplen ${fmtEq(r.m, r.n)}.` : `el punto (${bad[0]}, ${bad[1]}) no está en la recta: con x = ${bad[0]} sale y = ${r.m * bad[0] + r.n}, no ${bad[1]}.`, review, () => screenDraw(true));
    }));
    bind();
  }

  // ---- nivel 4: pasa por los aros ----
  function screenRings(review = false) {
    const r = genRingsRound();
    let m = 1, n = 0;
    if (m === r.m && n === r.n) m = -1;
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 4 · ${LEVEL_NAMES[4]} · ${roundIdx + 1} de ${ROUNDS[4]}`)}
      ${header("Ajusta m y n para que la montaña rusa pase por los dos aros", "Cambia la cuesta (m) y la altura de salida (n) y comprueba")}
      <div class="pnd-wrap" data-wrap></div>
      <div class="pnd-steppers">
        <div class="pnd-stepper"><button type="button" class="choice-btn" data-adj="m-">−</button><span>m = <b data-m-val>${m}</b></span><button type="button" class="choice-btn" data-adj="m+">+</button></div>
        <div class="pnd-stepper"><button type="button" class="choice-btn" data-adj="n-">−</button><span>n = <b data-n-val>${n}</b></span><button type="button" class="choice-btn" data-adj="n+">+</button></div>
      </div>
      <div class="pnd-actions"><button type="button" class="primary" data-check>Lanzar</button></div>
      <div class="feedback" data-feedback></div>`;
    const draw = () => { body.querySelector("[data-wrap]").innerHTML = gridSvg({ lines: [{ m, n }], rings: r.rings }); body.querySelector("[data-m-val]").textContent = String(m); body.querySelector("[data-n-val]").textContent = String(n); };
    draw();
    body.querySelectorAll("[data-adj]").forEach((b) => b.addEventListener("click", () => {
      if (locked || finished) return;
      const a = b.getAttribute("data-adj");
      if (a === "m+") m = Math.min(5, m + 1); if (a === "m-") m = Math.max(-5, m - 1);
      if (a === "n+") n = Math.min(5, n + 1); if (a === "n-") n = Math.max(-5, n - 1);
      draw();
    }));
    body.querySelector("[data-check]").addEventListener("click", () => {
      if (locked || finished) return;
      const ok = r.rings.every(([x, y]) => m * x + n === y);
      const [p, q] = r.rings;
      outcome(ok, "pasar por los aros", `de (${p[0]}, ${p[1]}) a (${q[0]}, ${q[1]}) se avanza ${q[0] - p[0]} y se sube ${q[1] - p[1]}: m = ${r.m}; y con x = 0 la recta vale n = ${r.n} → ${fmtEq(r.m, r.n)}.`, review, () => screenRings(true));
    });
  }

  // ---- reto: el corte ----
  function screenCross() {
    const r = genCrossRound();
    body.innerHTML = `
      ${badge(`Reto · ${LEVEL_NAMES[5]} · ${roundIdx + 1} de ${ROUNDS[5]}`)}
      ${header(`¿Dónde se cruzan <b>${fmtEq(r.a.m, r.a.n)}</b> y <b>${fmtEq(r.b.m, r.b.n)}</b>?`, "Toca el punto de corte (aquí no se pierden vidas)")}
      <div class="pnd-wrap" data-wrap>${gridSvg({ lines: [{ m: r.a.m, n: r.a.n }, { m: r.b.m, n: r.b.n, cls: "pnd-line-b" }], tappable: true })}</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-x]").forEach((c) => c.addEventListener("click", () => {
      if (locked || finished) return;
      const x = Number(c.getAttribute("data-x")), y = Number(c.getAttribute("data-y"));
      const ok = x === r.x && y === r.y;
      locked = true;
      body.querySelector("[data-wrap]").innerHTML = gridSvg({ lines: [{ m: r.a.m, n: r.a.n }, { m: r.b.m, n: r.b.n, cls: "pnd-line-b" }], marks: [[r.x, r.y]] });
      const expl = `igualando ${r.a.m}x ${r.a.n >= 0 ? "+" : "−"} ${Math.abs(r.a.n)} = ${r.b.m}x ${r.b.n >= 0 ? "+" : "−"} ${Math.abs(r.b.n)} sale x = ${r.x}, y entonces y = ${r.y}: se cruzan en (${r.x}, ${r.y}).`;
      if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); } else { recordError("el corte", `Tocaste (${x}, ${y}); ${expl}`); feedback(`No: ${expl}`, false); }
      later(() => { locked = false; nextRound(); }, 2800);
    }));
  }

  // ---- resultados y repaso ----
  function screenResults() {
    const byType = {};
    errors.forEach((e) => { byType[e.tipo] = (byType[e.tipo] || 0) + 1; });
    progress = { nivelMax: Math.max(progress.nivelMax || 0, levelReached), fallosPorTipo: { ...(progress.fallosPorTipo || {}) }, partidas: (progress.partidas || 0) + 1 };
    Object.entries(byType).forEach(([t, v]) => { progress.fallosPorTipo[t] = (progress.fallosPorTipo[t] || 0) + v; });
    saveProgress(client, progress);
    const items = errors.length ? `<ul class="pnd-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>` : `<p class="pnd-progress">Sin fallos: lees, trazas y cruzas rectas sin despeinarte.</p>`;
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos · tramos ${Math.max(levelReached, progress.nivelMax || 0)} de 5`)}
      <div class="pnd-learned">y = m·x + n: m es la cuesta (lo que sube por cada 1 que avanza, negativa si baja) y n es la altura en x = 0. Dos puntos bastan para fijar una recta, y dos rectas se cruzan donde sus alturas coinciden.</div>
      ${items}
      <div class="pnd-actions">${errors.length ? '<button type="button" class="primary" data-review>Repasar lo fallado</button>' : ""}<button type="button" class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }
  function nextReview() {
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    ({ "leer la pendiente": () => screenSlope(true), "leer la ecuación": () => screenEquation(true), "trazar la recta": () => screenDraw(true), "pasar por los aros": () => screenRings(true) }[tipo] || nextReview)();
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "pendiente", { score, rounds });
    body.innerHTML = `
      <div class="end-card"><div>🎢</div><div class="big-score">${score} pts</div><p>${rounds} aciertos · tramos ${Math.max(levelReached, progress.nivelMax || 0)} de 5</p>
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
