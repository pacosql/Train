// "Zoom decimal" — juego grande (por tramos) sobre números decimales en la
// recta: valor posicional, orden y densidad. La recta muestra siempre 10
// tramos; tocar un tramo lo AMPLÍA (una unidad se abre en décimas, una
// décima en centésimas) y en el nivel de precisión del objetivo se toca la
// marca exacta. Inspirado en Motion Math Zoom, adaptado a un solo pulgar
// (toque + botón Alejar en vez de pinch). Progreso persistente
// (localStorage + football_progress).
import { randInt, pick, shuffle, saveScore } from "./utils.js";

// Todos los valores internos van en CENTÉSIMAS (enteros 0..1000): 370 = 3,70.
const ROUNDS = { 1: 3, 2: 3, 3: 3, 4: 3 };
const LEVEL_NAMES = { 1: "Coloca", 2: "Sin etiquetas", 3: "Entre dos", 4: "Lee la marca", 5: "Contrarreloj" };
const RETO_SECONDS = 45;
const STORAGE_KEY = "football_zoomdec_progress";
const PLAYER_KEY = "football_player_id";

// ---------------- aritmética pura ----------------

export function fmtDec(v, decimals) {
  const neg = v < 0 ? "−" : "";
  const a = Math.abs(v);
  const ent = Math.floor(a / 100);
  const cent = a % 100;
  if (decimals === 0) return `${neg}${ent}`;
  const frac = decimals === 1 ? String(Math.round(cent / 10)) : String(cent).padStart(2, "0");
  return `${neg}${ent},${frac}`;
}
// Muestra 1 decimal si el valor es exacto en décimas y 2 si tiene centésimas.
export const fmtAuto = (v) => fmtDec(v, v % 10 === 0 ? 1 : 2);
// Vista "padre" al alejar: de centésimas a décimas, de décimas a unidades.
export function zoomOut(view) {
  if (view.step >= 100) return view;
  const step = view.step * 10;
  return { lo: Math.floor(view.lo / (step * 10)) * step * 10, step };
}
export const ZOOM0 = { lo: 0, step: 100 };

// Tramo 1 y 2 (y reto): un número con 1 o 2 decimales, nunca "redondo".
export function genColocarRound(decimals) {
  const unit = randInt(0, 9), tenth = decimals === 1 ? randInt(1, 9) : randInt(0, 9), hund = decimals === 2 ? randInt(1, 9) : 0;
  const v = unit * 100 + tenth * 10 + hund;
  return { v, decimals, unit, tenth, hund };
}
// Tramo 3: dos décimas consecutivas a = x,d y b = x,(d+1); vale cualquier centésima estrictamente entre ellas.
export function genEntreRound() {
  const x = randInt(0, 9), d = randInt(0, 8);
  const a = x * 100 + d * 10;
  return { a, b: a + 10 };
}
// Tramo 4: una marca dibujada; 4 opciones con los errores clásicos de lectura.
export function genLeeRound(decimals) {
  let guard = 0;
  while (guard++ < 500) {
    const r = genColocarRound(decimals);
    const { v, unit, tenth, hund } = r;
    const cands = decimals === 1
      ? [unit * 100 + tenth, unit * 100 + (10 - tenth) * 10, v + 10, v - 10, (unit + 1) * 100 + tenth * 10]
      : [unit * 100 + hund * 10 + tenth, v + 1, v - 1, unit * 100 + tenth * 10, v + 10];
    const options = [v];
    for (const c of cands) { if (options.length === 4) break; if (c > 0 && c <= 1000 && !options.includes(c)) options.push(c); }
    if (options.length < 4) continue;
    return { ...r, options: shuffle(options), answer: v };
  }
  const r = genColocarRound(decimals);
  return { ...r, options: shuffle([r.v, r.v + 10, r.v + 20, r.v + 30]), answer: r.v };
}

// ---------------- dibujo de la recta ----------------

const W = 340, H = 84, PAD = 22;
const xOf = (k) => PAD + (k * (W - 2 * PAD)) / 10;
const labelFor = (val, step) => (step === 100 ? fmtDec(val, 0) : step === 10 ? fmtDec(val, 1) : fmtDec(val, 2));

// labels: "all" | "ends" · tapIntervals: los tramos se pueden tocar (acercar) · tapTicks: las marcas se pueden tocar (colocar)
export function lineSvg(view, { labels = "all", tapIntervals = false, tapTicks = false, marker = null, band = null } = {}) {
  const { lo, step } = view;
  let out = "";
  if (band) { const [k0, k1] = band; out += `<rect x="${xOf(k0)}" y="30" width="${xOf(k1) - xOf(k0)}" height="20" class="zdc-band" />`; }
  out += `<line x1="${xOf(0)}" y1="40" x2="${xOf(10)}" y2="40" class="zdc-line" />`;
  for (let k = 0; k <= 10; k++) {
    const big = k === 0 || k === 10 || k === 5;
    out += `<line x1="${xOf(k)}" y1="${big ? 28 : 33}" x2="${xOf(k)}" y2="${big ? 52 : 47}" class="zdc-tick ${big ? "zdc-tick-big" : ""}" />`;
    if (labels === "all" || (labels === "ends" && (k === 0 || k === 10))) out += `<text x="${xOf(k)}" y="70" class="zdc-label ${step === 1 ? "zdc-label-sm" : ""}">${labelFor(lo + k * step, step)}</text>`;
  }
  if (tapIntervals) for (let k = 0; k < 10; k++) out += `<rect x="${xOf(k)}" y="10" width="${xOf(k + 1) - xOf(k)}" height="60" class="zdc-int" data-int="${k}" />`;
  if (tapTicks) for (let k = 0; k <= 10; k++) out += `<circle cx="${xOf(k)}" cy="40" r="12" class="zdc-tap" data-tick="${k}" />`;
  if (marker !== null && marker >= lo && marker <= lo + 10 * step) {
    const x = PAD + ((marker - lo) / (10 * step)) * (W - 2 * PAD);
    out += `<polygon points="${x},30 ${x - 7},16 ${x + 7},16" class="zdc-marker" />`;
  }
  return `<svg class="zdc-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-line data-lo="${lo}" data-step="${step}">${out}</svg>`;
}

// ---------------- progreso ----------------

function loadProgress() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : { nivelMax: 0, fallosPorTipo: {}, partidas: 0, record: 0 }; }
  catch (_) { return { nivelMax: 0, fallosPorTipo: {}, partidas: 0, record: 0 }; }
}
function playerId() {
  try { let id = localStorage.getItem(PLAYER_KEY); if (!id) { id = `p_${Math.random().toString(36).slice(2, 10)}`; localStorage.setItem(PLAYER_KEY, id); } return id; }
  catch (_) { return "anon"; }
}
async function saveProgress(client, progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* sin almacenamiento */ }
  if (!client) return;
  try { await client.from("football_progress").upsert({ game: "zoomdec", player: playerId(), data: progress, updated_at: new Date().toISOString() }); } catch (_) { /* guinda */ }
}

// ---------------- juego ----------------

export function mountZoomdecGame(container, { client, onExit }) {
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
  let retoHits = 0;
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
  const badge = (t) => `<div class="zdc-badge">${t}</div>`;
  const recordError = (tipo, explicacion) => errors.push({ tipo, explicacion });
  function loseLife(next) { lives--; renderLives(); if (lives <= 0) later(screenResults, 2800); else later(next, 2800); }
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
  function startLevel(l) { level = l; ({ 1: () => screenColoca(1), 2: () => screenColoca(2), 3: () => screenEntre(), 4: () => screenLee(), 5: screenReto })[l](); }
  function outcome(ok, tipo, expl, review, retry) {
    locked = true;
    if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : nextRound(); }, 2200); }
    else if (review) { feedback(`No: ${expl} Otra vez.`, false); later(() => { locked = false; retry(); }, 2800); }
    else { recordError(tipo, expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; nextRound(); }); }
  }
  const viewText = (view) => `de ${labelFor(view.lo, view.step)} a ${labelFor(view.lo + 10 * view.step, view.step)}`;

  // ---- mapa ----
  function screenMap() {
    locked = false;
    const unlocked = Math.min((progress.nivelMax || 0) + 1, 5);
    const nodes = [1, 2, 3, 4, 5].map((l) => { const done = l <= (progress.nivelMax || 0), open = l <= unlocked; return `<button type="button" class="zdc-node ${done ? "zdc-node-done" : ""}" data-level="${l}" ${open ? "" : "disabled"}><span class="zdc-node-num">${done ? "✓" : l}</span><span class="zdc-node-name">${LEVEL_NAMES[l]}</span></button>`; }).join("");
    body.innerHTML = `
      ${header("Zoom decimal", "Toca un tramo de la recta para ampliarlo: una unidad se abre en décimas y una décima en centésimas")}
      <div class="zdc-map">${nodes}</div>
      <div class="zdc-actions"><button type="button" class="secondary" data-tutorial>Cómo se amplía (tutorial)</button></div>
      <p class="zdc-progress">${progress.partidas ? `Partidas: ${progress.partidas}. Tramos superados: ${progress.nivelMax || 0} de 5.${progress.record ? ` Récord contrarreloj: ${progress.record}.` : ""}` : "Primera vez: mira el tutorial y empieza por el tramo 1."}</p>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-level]").forEach((b) => b.addEventListener("click", () => { roundIdx = 0; startLevel(Number(b.getAttribute("data-level"))); }));
    body.querySelector("[data-tutorial]").addEventListener("click", screenTutorial);
  }

  // ---- tutorial: colocar 3,7 ----
  function screenTutorial() {
    const target = 370;
    let view = ZOOM0;
    body.innerHTML = `
      ${badge("Tutorial · ampliar la recta")}
      ${header("Vamos a colocar <b data-target>3,7</b>", "3,7 está entre 3 y 4: toca ese tramo para ampliarlo")}
      <div class="zdc-wrap" data-wrap></div>
      <div class="zdc-actions" data-actions></div>
      <div class="zdc-formula" data-formula>3,7 = 3 unidades + 7 décimas</div>
      <div class="feedback" data-feedback></div>`;
    const draw = () => {
      body.querySelector("[data-wrap]").innerHTML = lineSvg(view, { labels: "all", tapIntervals: view.step === 100, tapTicks: view.step === 10 });
      body.querySelectorAll("[data-int]").forEach((r) => r.addEventListener("click", () => {
        if (locked || finished) return;
        const k = Number(r.getAttribute("data-int"));
        if (k === 3) { view = { lo: 300, step: 10 }; feedback("Ampliado: ahora la recta va de 3 a 4 y cada marca es una décima. Toca la marca 3,7.", true); draw(); }
        else feedback(`Ese tramo va de ${k} a ${k + 1}. 3,7 empieza por 3, así que está entre 3 y 4.`, false);
      }));
      body.querySelectorAll("[data-tick]").forEach((c) => c.addEventListener("click", () => {
        if (locked || finished) return;
        const k = Number(c.getAttribute("data-tick"));
        if (k === 7) {
          locked = true; award();
          body.querySelector("[data-wrap]").innerHTML = lineSvg(view, { labels: "all", marker: target });
          feedback("Eso es: 3,7 son 3 unidades y 7 décimas, la séptima marca después del 3.", true);
          body.querySelector("[data-actions]").innerHTML = `<button type="button" class="primary" data-next>Al tramo 1 →</button>`;
          body.querySelector("[data-next]").addEventListener("click", () => { locked = false; roundIdx = 0; startLevel(1); }, { once: true });
        } else feedback(`Esa marca es ${fmtDec(300 + k * 10, 1)}: cuenta 7 décimas desde el 3.`, false);
      }));
    };
    draw();
  }

  // ---- tramo 1 y 2: colocar (con marcas / sin etiquetas) ----
  function screenColoca(decimals, review = false) {
    const r = genColocarRound(decimals);
    const finalStep = decimals === 1 ? 10 : 1;
    const labels = decimals === 1 ? "all" : "ends";
    const tipo = decimals === 1 ? "colocar con marcas" : "colocar sin etiquetas";
    let view = ZOOM0;
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo ${level} · ${LEVEL_NAMES[level]} · ${roundIdx + 1} de ${ROUNDS[level]}`)}
      ${header(`Coloca <b data-target>${fmtDec(r.v, decimals)}</b> en la recta`, decimals === 1 ? "Toca el tramo donde está y, cuando se amplíe, la marca exacta" : "Amplía dos veces (unidad → décima) y toca la centésima; solo se etiquetan los extremos")}
      <div class="zdc-wrap" data-wrap></div>
      <div class="zdc-actions"><button type="button" class="secondary" data-out disabled>Alejar</button></div>
      <div class="feedback" data-feedback></div>`;
    const draw = () => {
      const atFinal = view.step === finalStep;
      body.querySelector("[data-wrap]").innerHTML = lineSvg(view, { labels: view.step === 100 ? "all" : labels, tapIntervals: !atFinal, tapTicks: atFinal });
      body.querySelector("[data-out]").disabled = view.step === 100;
      body.querySelectorAll("[data-int]").forEach((el) => el.addEventListener("click", () => {
        if (locked || finished) return;
        const k = Number(el.getAttribute("data-int"));
        const lo = view.lo + k * view.step, hi = lo + view.step;
        if (r.v > lo && r.v < hi) { view = { lo, step: view.step / 10 }; draw(); feedback(`Ampliado: ${viewText(view)}.`, true); return; }
        const kk = Math.floor((r.v - view.lo) / view.step);
        outcome(false, tipo, `tocaste el tramo ${viewText({ lo, step: view.step / 10 })}, pero ${fmtDec(r.v, decimals)} está entre ${labelFor(view.lo + kk * view.step, view.step)} y ${labelFor(view.lo + (kk + 1) * view.step, view.step)}.`, review, () => screenColoca(decimals, true));
      }));
      body.querySelectorAll("[data-tick]").forEach((el) => el.addEventListener("click", () => {
        if (locked || finished) return;
        const k = Number(el.getAttribute("data-tick"));
        const val = view.lo + k * view.step;
        const ok = val === r.v;
        const kk = (r.v - view.lo) / view.step;
        body.querySelector("[data-wrap]").innerHTML = lineSvg(view, { labels: "all", marker: r.v });
        outcome(ok, tipo, ok ? `${fmtDec(r.v, decimals)} es la marca ${kk} después de ${labelFor(view.lo, view.step)}.` : `tocaste ${fmtDec(val, decimals)}; ${fmtDec(r.v, decimals)} es la marca ${kk} después de ${labelFor(view.lo, view.step)}, no la ${k}.`, review, () => screenColoca(decimals, true));
      }));
    };
    body.querySelector("[data-out]").addEventListener("click", () => { if (locked || finished) return; view = zoomOut(view); draw(); });
    draw();
  }

  // ---- tramo 3: entre dos ----
  function screenEntre(review = false) {
    const r = genEntreRound();
    let view = ZOOM0;
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 3 · ${LEVEL_NAMES[3]} · ${roundIdx + 1} de ${ROUNDS[3]}`)}
      ${header(`Coloca un número que esté entre <b data-a>${fmtDec(r.a, 1)}</b> y <b data-b>${fmtDec(r.b, 1)}</b>`, "Parecen pegados, pero entre dos décimas seguidas hay sitio: amplía hasta las centésimas")}
      <div class="zdc-wrap" data-wrap></div>
      <div class="zdc-actions"><button type="button" class="secondary" data-out disabled>Alejar</button></div>
      <div class="feedback" data-feedback></div>`;
    const draw = () => {
      const atFinal = view.step === 1;
      body.querySelector("[data-wrap]").innerHTML = lineSvg(view, { labels: view.step === 1 ? "ends" : "all", tapIntervals: !atFinal, tapTicks: atFinal });
      body.querySelector("[data-out]").disabled = view.step === 100;
      body.querySelectorAll("[data-int]").forEach((el) => el.addEventListener("click", () => {
        if (locked || finished) return;
        const k = Number(el.getAttribute("data-int"));
        const lo = view.lo + k * view.step, hi = lo + view.step;
        if (r.a >= lo && r.b <= hi) { view = { lo, step: view.step / 10 }; draw(); feedback(`Ampliado: ${viewText(view)}.`, true); return; }
        outcome(false, "entre dos", `tocaste el tramo ${viewText({ lo, step: view.step / 10 })}; entre ${fmtDec(r.a, 1)} y ${fmtDec(r.b, 1)} solo se llega ampliando el tramo que los contiene (${labelFor(Math.floor(r.a / (view.step)) * view.step, view.step)} a ${labelFor(Math.floor(r.a / view.step) * view.step + view.step, view.step)}).`, review, () => screenEntre(true));
      }));
      body.querySelectorAll("[data-tick]").forEach((el) => el.addEventListener("click", () => {
        if (locked || finished) return;
        const k = Number(el.getAttribute("data-tick"));
        const val = view.lo + k;
        const ok = k > 0 && k < 10;
        body.querySelector("[data-wrap]").innerHTML = lineSvg(view, { labels: "all", marker: val });
        outcome(ok, "entre dos", ok ? `${fmtDec(val, 2)} está entre ${fmtDec(r.a, 1)} y ${fmtDec(r.b, 1)}: entre dos decimales siempre caben infinitos más.` : `${fmtDec(val, 2)} es el propio ${fmtDec(val, 1)}, un extremo; valía cualquiera de las nueve marcas de en medio (${fmtDec(r.a + 1, 2)} … ${fmtDec(r.a + 9, 2)}).`, review, () => screenEntre(true));
      }));
    };
    body.querySelector("[data-out]").addEventListener("click", () => { if (locked || finished) return; view = zoomOut(view); draw(); });
    draw();
  }

  // ---- tramo 4: lee la marca ----
  function screenLee(review = false) {
    const decimals = pick([1, 2]);
    const r = genLeeRound(decimals);
    const view = decimals === 1 ? { lo: r.unit * 100, step: 10 } : { lo: r.unit * 100 + r.tenth * 10, step: 1 };
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 4 · ${LEVEL_NAMES[4]} · ${roundIdx + 1} de ${ROUNDS[4]}`)}
      ${header("¿Qué número señala la flecha?", `La recta va ${viewText(view)}: cuenta las marcas desde el extremo izquierdo`)}
      <div class="zdc-wrap" data-wrap>${lineSvg(view, { labels: "ends", marker: r.v })}</div>
      <div class="zdc-options">${r.options.map((v) => `<button type="button" class="choice-btn zdc-opt" data-opt="${v}">${fmtAuto(v)}</button>`).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-opt]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      const v = Number(btn.getAttribute("data-opt")); const ok = v === r.v;
      body.querySelectorAll("[data-opt]").forEach((x) => (x.disabled = true)); btn.classList.add(ok ? "correct" : "wrong");
      const k = (r.v - view.lo) / view.step;
      outcome(ok, "leer la marca", `la flecha está ${k} marcas después de ${labelFor(view.lo, view.step)} y cada marca vale ${view.step === 10 ? "una décima" : "una centésima"}: ${fmtDec(r.v, decimals)}${!ok ? ` (${fmtAuto(v)} sería ${v === r.unit * 100 + r.tenth ? "7 centésimas donde había 7 décimas" : "otra marca"})` : ""}.`, review, () => screenLee(true));
    }));
  }

  // ---- reto: contrarreloj ----
  function screenReto() {
    let left = RETO_SECONDS;
    let over = false;
    retoHits = 0;
    body.innerHTML = `
      ${badge(`Reto · ${LEVEL_NAMES[5]}`)}
      ${header("Coloca todos los que puedas en 45 segundos", "Aquí no se pierden vidas: tramo, marca, siguiente")}
      <div class="zdc-timer"><span data-timer>${left}</span> s · aciertos: <b data-hits>0</b></div>
      <p class="zdc-target">Coloca <b data-target></b></p>
      <div class="zdc-wrap" data-wrap></div>
      <div class="feedback" data-feedback></div>`;
    const tick = () => { if (over) return; left--; const t = body.querySelector("[data-timer]"); if (t) t.textContent = String(left); if (left <= 0) endReto(); else later(tick, 1000); };
    later(tick, 1000);
    const endReto = () => {
      over = true; locked = true; levelReached = 5;
      progress.nivelMax = Math.max(progress.nivelMax || 0, 5); progress.record = Math.max(progress.record || 0, retoHits);
      saveProgress(client, progress);
      feedback(`¡Tiempo! ${retoHits} colocados.`, true);
      later(screenResults, 1800);
    };
    const round = () => {
      if (over) return;
      const r = genColocarRound(1);
      let view = ZOOM0;
      body.querySelector("[data-target]").textContent = fmtDec(r.v, 1);
      const draw = () => {
        const atFinal = view.step === 10;
        body.querySelector("[data-wrap]").innerHTML = lineSvg(view, { labels: "all", tapIntervals: !atFinal, tapTicks: atFinal });
        body.querySelectorAll("[data-int]").forEach((el) => el.addEventListener("click", () => {
          if (locked || finished || over) return;
          const k = Number(el.getAttribute("data-int"));
          if (k === r.unit) { view = { lo: k * 100, step: 10 }; draw(); }
          else { feedback(`${fmtDec(r.v, 1)} está entre ${r.unit} y ${r.unit + 1}, no entre ${k} y ${k + 1}.`, false); recordError("contrarreloj", `${fmtDec(r.v, 1)}: tocaste el tramo de ${k} a ${k + 1}; está entre ${r.unit} y ${r.unit + 1}.`); later(round, 900); locked = true; later(() => { locked = false; }, 900); }
        }));
        body.querySelectorAll("[data-tick]").forEach((el) => el.addEventListener("click", () => {
          if (locked || finished || over) return;
          const k = Number(el.getAttribute("data-tick"));
          locked = true;
          if (k === r.tenth) { award(); retoHits++; body.querySelector("[data-hits]").textContent = String(retoHits); feedback(`${fmtDec(r.v, 1)} ✔`, true); }
          else { feedback(`Esa es ${fmtDec(r.unit * 100 + k * 10, 1)}; ${fmtDec(r.v, 1)} es la marca ${r.tenth}.`, false); recordError("contrarreloj", `${fmtDec(r.v, 1)}: tocaste ${fmtDec(r.unit * 100 + k * 10, 1)}.`); }
          later(() => { locked = false; round(); }, 700);
        }));
      };
      draw();
    };
    locked = false;
    round();
  }

  // ---- resultados y repaso ----
  function screenResults() {
    locked = false; // si se llegó aquí sin vidas, outcome() dejó locked = true y el repaso quedaría bloqueado
    const byType = {};
    errors.forEach((e) => { byType[e.tipo] = (byType[e.tipo] || 0) + 1; });
    progress = { nivelMax: Math.max(progress.nivelMax || 0, levelReached), fallosPorTipo: { ...(progress.fallosPorTipo || {}) }, partidas: (progress.partidas || 0) + 1, record: progress.record || 0 };
    Object.entries(byType).forEach(([t, v]) => { progress.fallosPorTipo[t] = (progress.fallosPorTipo[t] || 0) + v; });
    saveProgress(client, progress);
    const items = errors.length ? `<ul class="zdc-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>` : `<p class="zdc-progress">Sin fallos: colocas, lees y encajas decimales con precisión.</p>`;
    const reviewable = errors.some((e) => e.tipo !== "contrarreloj");
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos · tramos ${Math.max(levelReached, progress.nivelMax || 0)} de 5`)}
      <div class="zdc-learned">Cada cifra decimal es un zoom: la primera divide la unidad en 10 décimas, la segunda cada décima en 10 centésimas. Por eso 3,7 y 3,07 no son lo mismo, 0,3 es mayor que 0,25, y entre 2,6 y 2,7 caben infinitos números.</div>
      ${items}
      <div class="zdc-actions">${reviewable ? '<button type="button" class="primary" data-review>Repasar lo fallado</button>' : ""}<button type="button" class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo).filter((t) => t !== "contrarreloj"))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }
  function nextReview() {
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    ({ "colocar con marcas": () => screenColoca(1, true), "colocar sin etiquetas": () => screenColoca(2, true), "entre dos": () => screenEntre(true), "leer la marca": () => screenLee(true) }[tipo] || nextReview)();
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "zoomdec", { score, rounds });
    body.innerHTML = `
      <div class="end-card"><div>🔎</div><div class="big-score">${score} pts</div><p>${rounds} aciertos · tramos ${Math.max(levelReached, progress.nivelMax || 0)} de 5</p>
        <div class="end-actions"><button class="primary" data-retry>Jugar otra vez</button><button class="secondary" data-menu>Volver al menú</button></div></div>`;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives; score = 0; rounds = 0; finished = false; locked = false;
    level = 0; roundIdx = 0; levelReached = 0; errors = []; reviewQueue = []; retoHits = 0;
    progress = loadProgress();
    renderLives(); renderScore();
    screenMap();
  }

  start();
  return () => { finished = true; timers.forEach(clearTimeout); };
}
