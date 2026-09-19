// "Al ras" — juego grande (por tramos) sobre SUMAR fracciones con distinto
// denominador: los vasitos de medida (1/2, 1/3, 1/4, 1/6, 1/12, 1/8) se
// vierten en una probeta graduada y la suma se ve como altura; el ras (= 1)
// es la marca de arriba. Duelo contra una máquina que a veces anuncia mal su
// total (suma numeradores y denominadores, o se queda con el denominador
// mayor) y hay que cazarla. Inspirado en Fraction Formula. Todo en unidades
// de 1/24. Progreso persistente (localStorage + football_progress).
import { randInt, pick, shuffle, saveScore } from "./utils.js";

export const U = 24; // el ras = 24 unidades
const ROUNDS = { 1: 3, 2: 3, 3: 3, 4: 3 };
const DUEL_ROUNDS = 5;
const LEVEL_NAMES = { 1: "Llena al ras", 2: "La máquina vierte", 3: "¿Vierto o me planto?", 4: "¿Qué vasito cayó?", 5: "Duelo" };
const STORAGE_KEY = "football_alras_progress";
const PLAYER_KEY = "football_player_id";

// ---------------- fracciones (todo en 24-avos) ----------------

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
export const CUPS_BASIC = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 6], [5, 6], [1, 12], [5, 12], [7, 12]];
export const CUPS_EXT = [...CUPS_BASIC, [1, 8], [3, 8], [5, 8], [7, 8]];
export const val = ([n, d]) => (n * U) / d; // unidades de 1/24
export const fr = ([n, d]) => `${n}/${d}`;
export function reduce(n, d) { const g = gcd(n, d) || 1; return [n / g, d / g]; }
export const fromVal = (v) => reduce(v, U); // 24-avos → fracción irreducible
export const fmtVal = (v) => (v === U ? "1" : v % U === 0 ? String(v / U) : fr(fromVal(v)));
const sumVals = (cups) => cups.reduce((s, c) => s + val(c), 0);
const sameCup = (a, b) => val(a) === val(b);
function pickCups(pool, k) {
  const out = [];
  let guard = 0;
  while (out.length < k && guard++ < 200) { const c = pick(pool); if (!out.some((o) => sameCup(o, c))) out.push(c); }
  return out;
}
function subsets(n) { const out = []; for (let m = 1; m < 1 << n; m++) out.push([...Array(n).keys()].filter((i) => m & (1 << i))); return out; }

// Tramo 1: 4 vasitos; exactamente un subconjunto (de 2 o más) suma el ras.
export function genLlenar() {
  for (let guard = 0; guard < 5000; guard++) {
    const cups = pickCups(CUPS_BASIC, 4);
    if (cups.length < 4) continue;
    const good = subsets(4).filter((s) => s.reduce((a, i) => a + val(cups[i]), 0) === U);
    if (good.length !== 1 || good[0].length < 2) continue;
    return { cups, answer: good[0] };
  }
  return { cups: [[1, 2], [1, 3], [1, 6], [3, 4]], answer: [0, 1, 2] };
}

// Errores típicos al sumar a/b + c/d.
export function wrongSums([a, b], [c, d]) {
  return [
    { tipo: "numeradores y denominadores", n: a + c, d: b + d },
    { tipo: "denominador mayor", n: a + c, d: Math.max(b, d) },
    { tipo: "cruzado", n: a * b + c * d, d: b * d },
  ];
}
// Tramo 2: la máquina vierte dos vasitos y anuncia el total; la mitad de las veces se equivoca.
export function genMaquina() {
  for (let guard = 0; guard < 5000; guard++) {
    const [c1, c2] = pickCups(CUPS_BASIC, 2);
    if (!c2) continue;
    const trueVal = val(c1) + val(c2);
    if (trueVal > U) continue; // la marca verdadera tiene que existir en la probeta (≤ ras)
    const isError = Math.random() < 0.5;
    if (!isError) return { c1, c2, isError, announce: fromVal(trueVal), trueVal, tipo: null };
    const cands = wrongSums(c1, c2).filter((w) => w.n > 0 && w.n / w.d < 2 && Math.abs(w.n / w.d - trueVal / U) > 1e-9);
    if (!cands.length) continue;
    const w = pick(cands);
    return { c1, c2, isError, announce: reduce(w.n, w.d), trueVal, tipo: w.tipo };
  }
  return { c1: [1, 2], c2: [1, 3], isError: true, announce: [2, 5], trueVal: 20, tipo: "numeradores y denominadores" };
}

// Tramo 3: llevas f, te ofrecen v: verter solo si f + v ≤ 1. Mitad de rondas cabe, mitad no.
export function genPlantar(wantFit) {
  const fit = wantFit === undefined ? Math.random() < 0.5 : wantFit;
  for (let guard = 0; guard < 5000; guard++) {
    const fc = pick(CUPS_EXT), v = pick(CUPS_EXT);
    const f = val(fc);
    if (f < 4 || f > 20 || val(v) < 3) continue;
    if ((f + val(v) <= U) !== fit) continue;
    if (f + val(v) === U && Math.random() < 0.5) continue; // que "justo al ras" no domine
    return { f, fFrac: fromVal(f), v, fit };
  }
  return { f: 12, fFrac: [1, 2], v: [1, 4], fit: true };
}

// Tramo 4: la probeta pasa de f a g; ¿qué vasito cayó? 4 opciones distintas.
export function genCayo() {
  for (let guard = 0; guard < 5000; guard++) {
    const fc = pick(CUPS_BASIC), c = pick(CUPS_EXT);
    const f = val(fc), g = f + val(c);
    if (g > U || f < 2) continue;
    const pool = CUPS_EXT.filter((x) => !sameCup(x, c));
    const opts = [c, ...pickCups(pool, 3)];
    if (opts.length < 4) continue;
    return { f, g, cup: c, options: shuffle(opts) };
  }
  return { f: 12, g: 20, cup: [1, 3], options: shuffle([[1, 3], [1, 4], [1, 2], [1, 6]]) };
}

// Mano de duelo: 3 vasitos con un ÚNICO subconjunto óptimo (máximo ≤ 1, no vacío).
export function genHand() {
  for (let guard = 0; guard < 5000; guard++) {
    const cups = pickCups(CUPS_EXT, 3);
    if (cups.length < 3) continue;
    const scored = subsets(3).map((s) => ({ s, v: s.reduce((a, i) => a + val(cups[i]), 0) })).filter((x) => x.v <= U);
    if (!scored.length) continue;
    const best = Math.max(...scored.map((x) => x.v));
    const bests = scored.filter((x) => x.v === best);
    if (bests.length !== 1) continue;
    return { cups, best: bests[0].s, bestVal: best };
  }
  return { cups: [[1, 2], [1, 4], [1, 3]], best: [0, 1], bestVal: 18 };
}
// Duelo: 5 rondas; en exactamente 2 la máquina anuncia mal su total (con 2+ vasitos vertidos).
export function genDuelo() {
  for (let guard = 0; guard < 5000; guard++) {
    const rounds = [];
    for (let i = 0; i < DUEL_ROUNDS; i++) rounds.push({ player: genHand(), machine: genHand(), isError: false, announce: null, tipo: null });
    const cand = rounds.map((r, i) => i).filter((i) => rounds[i].machine.best.length >= 2);
    if (cand.length < 2) continue;
    let ok = true;
    for (const i of shuffle(cand).slice(0, 2)) {
      const m = rounds[i].machine;
      const poured = m.best.map((k) => m.cups[k]);
      const first = wrongSums(poured[0], poured[1]);
      const rest = poured.slice(2).reduce((s, c) => s + val(c), 0);
      const ws = first.map((w) => ({ tipo: w.tipo, v: (w.n * U) / w.d + rest, n: w.n, d: w.d })).filter((w) => Number.isInteger(w.v) && w.v > 0 && w.v !== m.bestVal && w.v < 2 * U);
      if (!ws.length) { ok = false; break; }
      const w = pick(ws);
      rounds[i].isError = true; rounds[i].announce = fromVal(w.v); rounds[i].tipo = w.tipo;
    }
    if (!ok) continue;
    rounds.forEach((r) => { if (!r.isError) r.announce = fromVal(r.machine.bestVal); });
    return { rounds };
  }
  return { rounds: [] };
}

// ---------------- dibujo ----------------

const PW = 150, PH = 230, TUBE_X = 30, TUBE_W = 44, TOP = 24, BOTTOM = 208;
const yOf = (v) => BOTTOM - ((BOTTOM - TOP) * v) / U;
// marks: 0 (lisa, solo el ras) | 12 | 24 · fill en 24-avos · tap: marcas tocables · ghost: relleno previo (para "antes → después")
export function probetaSvg({ fill = 0, marks = 12, tap = false, ghost = null, label = "" } = {}) {
  let out = `<rect x="${TUBE_X}" y="${TOP - 10}" width="${TUBE_W}" height="${BOTTOM - TOP + 14}" rx="8" class="alr-tube" />`;
  const shown = Math.min(fill, U);
  if (ghost !== null) out += `<rect x="${TUBE_X + 2}" y="${yOf(ghost)}" width="${TUBE_W - 4}" height="${BOTTOM - yOf(ghost)}" class="alr-ghost" />`;
  // Con "ghost" (antes → después) la parte añadida se pinta oscura encima de la clara, no tapándola.
  const base = ghost !== null ? ghost : 0;
  if (shown > base) out += `<rect x="${TUBE_X + 2}" y="${yOf(shown)}" width="${TUBE_W - 4}" height="${yOf(base) - yOf(shown)}" class="alr-liquid" />`;
  if (fill > U) out += `<path d="M ${TUBE_X - 6} ${TOP - 12} q 10 -14 22 -4 t 22 -2 t 22 6" class="alr-spill" /><text x="${TUBE_X + TUBE_W + 8}" y="${TOP - 2}" class="alr-spill-label">¡se desborda!</text>`;
  out += `<line x1="${TUBE_X - 8}" y1="${yOf(U)}" x2="${TUBE_X + TUBE_W + 8}" y2="${yOf(U)}" class="alr-ras" /><text x="${TUBE_X + TUBE_W + 12}" y="${yOf(U) + 4}" class="alr-ras-label">ras = 1</text>`;
  if (marks) {
    const step = U / marks;
    for (let k = 1; k <= marks; k++) { const v = k * step; const big = marks === 24 ? k % 2 === 0 : true; out += `<line x1="${TUBE_X}" y1="${yOf(v)}" x2="${TUBE_X + (big ? 12 : 7)}" y2="${yOf(v)}" class="alr-mark" />`; if (tap) out += `<rect x="${TUBE_X - 14}" y="${yOf(v) - (BOTTOM - TOP) / marks / 2}" width="${TUBE_W + 28}" height="${(BOTTOM - TOP) / marks}" class="alr-tap" data-mark="${k}" />`; }
  }
  if (label) out += `<text x="${TUBE_X + TUBE_W / 2}" y="${BOTTOM + 18}" class="alr-plabel">${label}</text>`;
  return `<svg class="alr-svg" viewBox="0 0 ${PW} ${PH}" width="${PW}" height="${PH}" data-probeta data-marks="${marks}">${out}</svg>`;
}
const cupBtn = (c, i, hint) => `<button type="button" class="choice-btn alr-cup" data-cup="${i}"><span class="alr-cup-frac">${fr(c)}</span>${hint ? `<span class="alr-cup-hint">= ${hint} marcas</span>` : ""}</button>`;

// ---------------- progreso ----------------

function loadProgress() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : { nivelMax: 0, fallosPorTipo: {}, partidas: 0, duelos: 0 }; }
  catch (_) { return { nivelMax: 0, fallosPorTipo: {}, partidas: 0, duelos: 0 }; }
}
function playerId() {
  try { let id = localStorage.getItem(PLAYER_KEY); if (!id) { id = `p_${Math.random().toString(36).slice(2, 10)}`; localStorage.setItem(PLAYER_KEY, id); } return id; }
  catch (_) { return "anon"; }
}
async function saveProgress(client, progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* sin almacenamiento */ }
  if (!client) return;
  try { await client.from("football_progress").upsert({ game: "alras", player: playerId(), data: progress, updated_at: new Date().toISOString() }); } catch (_) { /* guinda */ }
}

// ---------------- juego ----------------

export function mountAlrasGame(container, { client, onExit }) {
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
  const badge = (t) => `<div class="alr-badge">${t}</div>`;
  const recordError = (tipo, explicacion) => errors.push({ tipo, explicacion });
  const marksOf = (v, marks) => (v * marks) / U;
  // Explica la suma en doceavos si todos los vasitos caben en 12 marcas; si no, en 24-avos.
  const sumText = (cups) => { const den = cups.every((c) => val(c) % 2 === 0) ? 12 : 24; const k = (c) => (val(c) * den) / U; const tot = sumVals(cups); return `${cups.map(fr).join(" + ")} = ${cups.map((c) => `${k(c)}/${den}`).join(" + ")} = ${(tot * den) / U}/${den}${tot % U === 0 ? ` = ${tot / U}` : ` = ${fmtVal(tot)}`}`; };
  function loseLife(next) { lives--; renderLives(); if (lives <= 0) later(screenResults, 3000); else later(next, 3000); }
  function nextRound() {
    roundIdx++;
    if (roundIdx >= ROUNDS[level]) {
      levelReached = Math.max(levelReached, level);
      progress.nivelMax = Math.max(progress.nivelMax || 0, level);
      saveProgress(client, progress);
      roundIdx = 0;
      screenMap();
      return;
    }
    startLevel(level);
  }
  function startLevel(l) { level = l; ({ 1: () => screenLlenar(), 2: () => screenMaquina(), 3: () => screenPlantar(), 4: () => screenCayo(), 5: screenDuelo })[l](); }
  function outcome(ok, tipo, expl, review, retry) {
    locked = true;
    if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : nextRound(); }, 2600); }
    else if (review) { feedback(`No: ${expl} Otra vez.`, false); later(() => { locked = false; retry(); }, 3000); }
    else { recordError(tipo, expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; nextRound(); }); }
  }

  // ---- mapa ----
  function screenMap() {
    locked = false;
    const unlocked = Math.min((progress.nivelMax || 0) + 1, 5);
    const nodes = [1, 2, 3, 4, 5].map((l) => { const done = l <= (progress.nivelMax || 0), open = l <= unlocked; return `<button type="button" class="alr-node ${done ? "alr-node-done" : ""}" data-level="${l}" ${open ? "" : "disabled"}><span class="alr-node-num">${done ? "✓" : l}</span><span class="alr-node-name">${LEVEL_NAMES[l]}</span></button>`; }).join("");
    body.innerHTML = `
      ${header("Al ras", "Vierte vasitos de 1/2, 1/3, 1/4… en la probeta y llega al ras (= 1) sin desbordar")}
      <div class="alr-map">${nodes}</div>
      <div class="alr-actions"><button type="button" class="secondary" data-tutorial>Cómo se vierte (tutorial)</button></div>
      <p class="alr-progress">${progress.partidas ? `Partidas: ${progress.partidas}. Tramos superados: ${progress.nivelMax || 0} de 5.${progress.duelos ? ` Duelos ganados: ${progress.duelos}.` : ""}` : "Primera vez: mira el tutorial y empieza por el tramo 1."}</p>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-level]").forEach((b) => b.addEventListener("click", () => { roundIdx = 0; startLevel(Number(b.getAttribute("data-level"))); }));
    body.querySelector("[data-tutorial]").addEventListener("click", screenTutorial);
  }

  // ---- tutorial: verter 1/2 y 1/3, y ver qué falta ----
  function screenTutorial() {
    const steps = [[1, 2], [1, 3]];
    let fill = 0, k = 0;
    body.innerHTML = `
      ${badge("Tutorial · la probeta")}
      ${header("Vierte el vasito de <b>1/2</b> y mira hasta qué marca sube", "La probeta tiene 12 marcas; el ras es la de arriba")}
      <div class="alr-stage"><div data-wrap>${probetaSvg({ fill, marks: 12 })}</div><div class="alr-cups" data-cups>${cupBtn(steps[0], 0)}</div></div>
      <div class="alr-formula" data-formula>0/12</div>
      <div class="feedback" data-feedback></div>`;
    const bind = () => body.querySelectorAll("[data-cup]").forEach((b) => b.addEventListener("click", () => {
      if (locked || finished) return;
      if (k < 2) {
        fill += val(steps[k]); k++;
        body.querySelector("[data-wrap]").innerHTML = probetaSvg({ fill, marks: 12 });
        body.querySelector("[data-formula]").textContent = `${steps.slice(0, k).map(fr).join(" + ")} = ${marksOf(fill, 12)}/12`;
        if (k === 1) { feedback("1/2 son 6 marcas de 12. Ahora vierte 1/3.", true); body.querySelector("[data-cups]").innerHTML = cupBtn(steps[1], 1); bind(); }
        else { feedback("1/3 son 4 marcas: 6 + 4 = 10 de 12. ¿Qué vasito llena justo hasta el ras?", true); body.querySelector("[data-cups]").innerHTML = [[1, 6], [1, 4], [1, 3]].map((c, i) => cupBtn(c, `f${i}`)).join(""); bind(); }
        return;
      }
      const c = [[1, 6], [1, 4], [1, 3]][Number(b.getAttribute("data-cup").slice(1))];
      if (fill + val(c) === U) {
        locked = true; award();
        body.querySelector("[data-wrap]").innerHTML = probetaSvg({ fill: U, marks: 12 });
        body.querySelector("[data-formula]").textContent = "1/2 + 1/3 + 1/6 = 6/12 + 4/12 + 2/12 = 12/12 = 1";
        feedback("Al ras: 1/6 son las 2 marcas que faltaban. Sumar fracciones es contar marcas de la misma probeta.", true);
        body.querySelector("[data-cups]").innerHTML = `<button type="button" class="primary" data-next>Al tramo 1 →</button>`;
        body.querySelector("[data-next]").addEventListener("click", () => { locked = false; roundIdx = 0; startLevel(1); }, { once: true });
      } else feedback(`${fr(c)} son ${marksOf(val(c), 12)} marcas y solo faltan 2: ${fill + val(c) > U ? "se desbordaría" : "no llega"}.`, false);
    }));
    bind();
  }

  // ---- tramo 1: llena al ras ----
  function screenLlenar(review = false) {
    const r = genLlenar();
    const hints = !review && roundIdx < 2;
    const chosen = new Set();
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 1 · ${LEVEL_NAMES[1]} · ${roundIdx + 1} de ${ROUNDS[1]}`)}
      ${header("Elige los vasitos que juntos llenan la probeta justo al ras", hints ? "Cada vasito dice cuántas marcas de 12 son; tienen que sumar 12" : "Sin ayuda: piensa cada vasito en doceavos")}
      <div class="alr-stage"><div data-wrap>${probetaSvg({ fill: 0, marks: 12 })}</div><div class="alr-cups" data-cups>${r.cups.map((c, i) => cupBtn(c, i, hints ? marksOf(val(c), 12) : "")).join("")}</div></div>
      <div class="alr-actions"><button type="button" class="primary" data-pour disabled>Verter</button></div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-cup]").forEach((b) => b.addEventListener("click", () => {
      if (locked || finished) return;
      const i = Number(b.getAttribute("data-cup"));
      if (chosen.has(i)) chosen.delete(i); else chosen.add(i);
      b.classList.toggle("alr-cup-on", chosen.has(i));
      body.querySelector("[data-pour]").disabled = chosen.size === 0;
    }));
    body.querySelector("[data-pour]").addEventListener("click", () => {
      if (locked || finished || !chosen.size) return;
      const sel = [...chosen].sort();
      const cups = sel.map((i) => r.cups[i]);
      const total = sumVals(cups);
      body.querySelector("[data-wrap]").innerHTML = probetaSvg({ fill: total, marks: 12 });
      const ok = total === U;
      const good = r.answer.map((i) => r.cups[i]);
      outcome(ok, "llenar al ras", ok ? `${sumText(cups)}.` : `${sumText(cups)}: ${total > U ? "se desborda" : "no llega al ras"}. Llenaban justo ${good.map(fr).join(" + ")} (${good.map((c) => `${marksOf(val(c), 12)}`).join(" + ")} = 12 marcas).`, review, () => screenLlenar(true));
    });
  }

  // ---- tramo 2: la máquina vierte ----
  function screenMaquina(review = false) {
    const r = genMaquina();
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 2 · ${LEVEL_NAMES[2]} · ${roundIdx + 1} de ${ROUNDS[2]}`)}
      ${header(`La máquina vierte <b>${fr(r.c1)}</b> y <b>${fr(r.c2)}</b> y anuncia: «en total, <b data-announce>${fr(r.announce)}</b>»`, "¿Es verdad? Si es un error, después tocarás la marca correcta")}
      <div class="alr-stage"><div data-wrap>${probetaSvg({ fill: 0, marks: 12 })}</div><div class="alr-cups"><div class="alr-machine">🤖</div></div></div>
      <div class="alr-actions"><button type="button" class="choice-btn alr-judge" data-ok>Vale</button><button type="button" class="choice-btn alr-judge" data-err>¡Error!</button></div>
      <div class="feedback" data-feedback></div>`;
    const expl = () => `${sumText([r.c1, r.c2])}${r.isError ? ` — la máquina ${r.tipo === "numeradores y denominadores" ? "sumó arriba y abajo por separado" : r.tipo === "denominador mayor" ? "sumó los numeradores y se quedó con el denominador mayor" : "cruzó mal los productos"} y dijo ${fr(r.announce)}` : ""}.`;
    body.querySelector("[data-ok]").addEventListener("click", () => {
      if (locked || finished) return;
      body.querySelector("[data-wrap]").innerHTML = probetaSvg({ fill: r.trueVal, marks: 12 });
      outcome(!r.isError, "cazar el error de la máquina", expl(), review, () => screenMaquina(true));
    });
    body.querySelector("[data-err]").addEventListener("click", () => {
      if (locked || finished) return;
      if (!r.isError) { body.querySelector("[data-wrap]").innerHTML = probetaSvg({ fill: r.trueVal, marks: 12 }); outcome(false, "cazar el error de la máquina", `la máquina tenía razón: ${expl()}`, review, () => screenMaquina(true)); return; }
      locked = true;
      feedback("Bien visto. Ahora toca en la probeta la marca a la que llega de verdad.", true);
      body.querySelector("[data-wrap]").innerHTML = probetaSvg({ fill: 0, marks: 12, tap: true });
      body.querySelectorAll(".alr-judge").forEach((x) => (x.disabled = true));
      locked = false;
      body.querySelectorAll("[data-mark]").forEach((m) => m.addEventListener("click", () => {
        if (locked || finished) return;
        const k = Number(m.getAttribute("data-mark"));
        const ok = k === marksOf(r.trueVal, 12);
        body.querySelector("[data-wrap]").innerHTML = probetaSvg({ fill: r.trueVal, marks: 12 });
        outcome(ok, "cazar el error de la máquina", ok ? expl() : `tocaste la marca ${k}; ${expl()} Son ${marksOf(r.trueVal, 12)} marcas.`, review, () => screenMaquina(true));
      }));
    });
  }

  // ---- tramo 3: vierto o me planto (probeta lisa) ----
  function screenPlantar(review = false) {
    const r = genPlantar(review ? undefined : roundIdx % 2 === 0); // alterna "cabe" / "no cabe"
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 3 · ${LEVEL_NAMES[3]} · ${roundIdx + 1} de ${ROUNDS[3]}`)}
      ${header(`Llevas <b data-f>${fr(r.fFrac)}</b> y te ofrecen un vasito de <b data-v>${fr(r.v)}</b>. ¿Cabe sin desbordar?`, "Probeta sin marcas: compara el vasito con lo que falta hasta el ras")}
      <div class="alr-stage"><div data-wrap>${probetaSvg({ fill: r.f, marks: 0 })}</div><div class="alr-cups">${cupBtn(r.v, 0)}</div></div>
      <div class="alr-actions"><button type="button" class="choice-btn alr-judge" data-pour>Verter</button><button type="button" class="choice-btn alr-judge" data-hold>Me planto</button></div>
      <div class="feedback" data-feedback></div>`;
    const falta = U - r.f;
    const expl = `falta ${fmtVal(falta)} (${falta}/24) y el vasito es ${fr(r.v)} (${val(r.v)}/24): ${r.fit ? "cabe" : "se desbordaría"}${r.f + val(r.v) === U ? ", justo al ras" : ""}.`;
    const answer = (pour) => {
      if (locked || finished) return;
      body.querySelector("[data-wrap]").innerHTML = probetaSvg({ fill: pour ? r.f + val(r.v) : r.f, marks: 12 });
      outcome(pour === r.fit, "verter o plantarse", expl, review, () => screenPlantar(true));
    };
    body.querySelector("[data-pour]").addEventListener("click", () => answer(true));
    body.querySelector("[data-hold]").addEventListener("click", () => answer(false));
  }

  // ---- tramo 4: qué vasito cayó ----
  function screenCayo(review = false) {
    const r = genCayo();
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 4 · ${LEVEL_NAMES[4]} · ${roundIdx + 1} de ${ROUNDS[4]}`)}
      ${header("La probeta ha subido de la zona clara a la oscura. ¿Qué vasito cayó?", "Cuenta las marcas de 24 que ha subido")}
      <div class="alr-stage"><div data-wrap>${probetaSvg({ fill: r.g, ghost: r.f, marks: 24 })}</div><div class="alr-cups">${r.options.map((c, i) => cupBtn(c, i)).join("")}</div></div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-cup]").forEach((b) => b.addEventListener("click", () => {
      if (locked || finished) return;
      const c = r.options[Number(b.getAttribute("data-cup"))];
      const ok = sameCup(c, r.cup);
      body.querySelectorAll("[data-cup]").forEach((x) => (x.disabled = true)); b.classList.add(ok ? "correct" : "wrong");
      outcome(ok, "qué vasito cayó", `de ${fmtVal(r.f)} a ${fmtVal(r.g)} hay ${r.g - r.f}/24 = ${fr(r.cup)}${!ok ? ` (${fr(c)} serían ${val(c)}/24)` : ""}.`, review, () => screenCayo(true));
    }));
  }

  // ---- reto: duelo al mejor de 5 ----
  function screenDuelo() {
    const d = genDuelo();
    let idx = 0, wins = 0;
    const play = () => {
      if (idx >= d.rounds.length) {
        levelReached = 5; progress.nivelMax = Math.max(progress.nivelMax || 0, 5); if (wins >= 3) progress.duelos = (progress.duelos || 0) + 1;
        saveProgress(client, progress); screenResults(); return;
      }
      const r = d.rounds[idx];
      const chosen = new Set();
      body.innerHTML = `
        ${badge(`Reto · ${LEVEL_NAMES[5]} · ronda ${idx + 1} de ${DUEL_ROUNDS} · ganadas ${wins}`)}
        ${header("Vierte los vasitos que te dejen lo más cerca del ras sin pasarte", "Aquí no se pierden vidas. Después, comprueba lo que anuncia la máquina")}
        <div class="alr-stage"><div data-wrap>${probetaSvg({ fill: 0, marks: 24, label: "tú" })}</div><div class="alr-cups" data-cups>${r.player.cups.map((c, i) => cupBtn(c, i)).join("")}</div></div>
        <div class="alr-actions" data-actions><button type="button" class="primary" data-pour disabled>Verter</button></div>
        <div class="feedback" data-feedback></div>`;
      body.querySelectorAll("[data-cup]").forEach((b) => b.addEventListener("click", () => {
        if (locked || finished) return;
        const i = Number(b.getAttribute("data-cup"));
        if (chosen.has(i)) chosen.delete(i); else chosen.add(i);
        b.classList.toggle("alr-cup-on", chosen.has(i));
        body.querySelector("[data-pour]").disabled = chosen.size === 0;
      }));
      body.querySelector("[data-pour]").addEventListener("click", () => {
        if (locked || finished || !chosen.size) return;
        locked = true;
        const cups = [...chosen].sort().map((i) => r.player.cups[i]);
        const mine = sumVals(cups);
        const optimal = mine === r.player.bestVal;
        body.querySelector("[data-wrap]").innerHTML = probetaSvg({ fill: mine, marks: 24, label: "tú" });
        if (optimal) { award(); feedback(`${sumText(cups)}: es lo máximo posible sin desbordar.`, true); }
        else { const best = r.player.best.map((k) => r.player.cups[k]); recordError("duelo", `vertiste ${cups.map(fr).join(" + ")} = ${fmtVal(mine)}${mine > U ? " (desborda)" : ""}; lo mejor era ${best.map(fr).join(" + ")} = ${fmtVal(r.player.bestVal)}.`); feedback(`${sumText(cups)}${mine > U ? ": se desborda" : ""}. Lo mejor era ${best.map(fr).join(" + ")} = ${fmtVal(r.player.bestVal)}.`, false); }
        later(() => { locked = false; judge(mine <= U ? mine : 0); }, 2600);
      });
      const judge = (mine) => {
        const m = r.machine;
        const poured = m.best.map((k) => m.cups[k]);
        body.innerHTML = `
          ${badge(`Reto · ${LEVEL_NAMES[5]} · ronda ${idx + 1} de ${DUEL_ROUNDS} · ganadas ${wins}`)}
          ${header(`La máquina vierte <b>${poured.map(fr).join("</b>, <b>")}</b> y anuncia: «<b data-announce>${fr(r.announce)}</b>»`, "¿Vale o es un error? Cazar un error suma")}
          <div class="alr-stage"><div>${probetaSvg({ fill: mine, marks: 24, label: "tú" })}</div><div class="alr-cups"><div class="alr-machine">🤖</div></div></div>
          <div class="alr-actions"><button type="button" class="choice-btn alr-judge" data-ok>Vale</button><button type="button" class="choice-btn alr-judge" data-err>¡Error!</button></div>
          <div class="feedback" data-feedback></div>`;
        const resolve = (saidError) => {
          if (locked || finished) return;
          locked = true;
          const ok = saidError === r.isError;
          const win = mine >= m.bestVal && mine <= U;
          if (win) wins++;
          const txt = `${sumText(poured)}${r.isError ? ` — anunció ${fr(r.announce)}: ${r.tipo === "numeradores y denominadores" ? "sumó arriba y abajo por separado" : r.tipo === "denominador mayor" ? "se quedó con el denominador mayor" : "cruzó mal los productos"}` : ""}. Tú ${fmtVal(mine)} contra ${fmtVal(m.bestVal)}: ${win ? "ganas la ronda" : "gana la máquina"}.`;
          if (ok) { award(); feedback(`¡Correcto! ${txt}`, true); } else { recordError("duelo", `dijiste ${saidError ? "error" : "vale"}; ${txt}`); feedback(`No: ${txt}`, false); }
          later(() => { locked = false; idx++; play(); }, 3200);
        };
        body.querySelector("[data-ok]").addEventListener("click", () => resolve(false));
        body.querySelector("[data-err]").addEventListener("click", () => resolve(true));
      };
    };
    locked = false;
    play();
  }

  // ---- resultados y repaso ----
  function screenResults() {
    locked = false; // si se llegó aquí sin vidas, outcome() dejó locked = true y el repaso quedaría bloqueado
    const byType = {};
    errors.forEach((e) => { byType[e.tipo] = (byType[e.tipo] || 0) + 1; });
    progress = { nivelMax: Math.max(progress.nivelMax || 0, levelReached), fallosPorTipo: { ...(progress.fallosPorTipo || {}) }, partidas: (progress.partidas || 0) + 1, duelos: progress.duelos || 0 };
    Object.entries(byType).forEach(([t, v]) => { progress.fallosPorTipo[t] = (progress.fallosPorTipo[t] || 0) + v; });
    saveProgress(client, progress);
    const items = errors.length ? `<ul class="alr-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>` : `<p class="alr-progress">Sin fallos: sumas fracciones como quien cuenta marcas.</p>`;
    const reviewable = errors.some((e) => e.tipo !== "duelo");
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos · tramos ${Math.max(levelReached, progress.nivelMax || 0)} de 5`)}
      <div class="alr-learned">Para sumar fracciones hay que medirlas con la misma marca: 1/2 + 1/3 no es 2/5, es 6/12 + 4/12 = 10/12. Y la que cabe es la menor o igual que lo que falta hasta el ras.</div>
      ${items}
      <div class="alr-actions">${reviewable ? '<button type="button" class="primary" data-review>Repasar lo fallado</button>' : ""}<button type="button" class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo).filter((t) => t !== "duelo"))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }
  function nextReview() {
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    ({ "llenar al ras": () => screenLlenar(true), "cazar el error de la máquina": () => screenMaquina(true), "verter o plantarse": () => screenPlantar(true), "qué vasito cayó": () => screenCayo(true) }[tipo] || nextReview)();
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "alras", { score, rounds });
    body.innerHTML = `
      <div class="end-card"><div>🥤</div><div class="big-score">${score} pts</div><p>${rounds} aciertos · tramos ${Math.max(levelReached, progress.nivelMax || 0)} de 5</p>
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
