// "Bola de nieve" — juego grande (por tramos) sobre crecimiento
// exponencial frente a lineal: sucesiones geométricas, interés compuesto,
// porcentajes encadenados y "¿cuántos años hacen falta?". La idea que se
// repite en todas las pantallas: multiplicar cada vez por lo mismo hace una
// bola que crece despacio al principio y luego se dispara; sumar cada vez
// lo mismo es una recta. Progreso persistente (localStorage + football_progress).
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const ROUNDS = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 };
const LEVEL_NAMES = { 1: "Dobla", 2: "La hucha", 3: "Rebajas encadenadas", 4: "Lineal contra bola", 5: "¿Cuántos años?" };
const STORAGE_KEY = "football_bola_progress";
const PLAYER_KEY = "football_player_id";
const MAX_MONTH = 8;

// ---------------- aritmética pura ----------------

export const fmtNum = (v) => Number(v.toFixed(2)).toLocaleString("es-ES", { maximumFractionDigits: 2 });
export const fmtEur = (v) => `${fmtNum(v)} €`;
const near = (a, b) => Math.abs(a - b) < 1e-9;
export function powGrow(c, p, n) { let v = c; for (let i = 0; i < n; i++) v = v * (100 + p) / 100; return Math.round(v * 1e6) / 1e6; }
function options4(answer, cands, filler) {
  const out = [answer];
  for (const c of cands) { if (out.length === 4) break; if (Number.isFinite(c) && c > 0 && !out.some((o) => near(o, c))) out.push(c); }
  let guard = 0;
  while (out.length < 4 && guard++ < 500) { const c = filler(); if (Number.isFinite(c) && c > 0 && !out.some((o) => near(o, c))) out.push(c); }
  return shuffle(out);
}

// Tramo 1: sucesión geométrica a1·r^(n−1). Se dan tres términos y se pide el 4º o el 5º.
export function genDoblaRound() {
  const a1 = pick([1, 2, 3, 5]), r = pick([2, 3]), n = pick([4, 5]);
  const term = (k) => a1 * r ** (k - 1);
  const shown = [term(1), term(2), term(3)];
  const answer = term(n);
  const linear = term(3) + (term(3) - term(2)) * (n - 3); // seguir sumando la última diferencia
  const cands = [linear, term(n + 1), term(n - 1), answer + term(1), answer * 2];
  const options = options4(answer, cands, () => answer + randInt(1, 9) * r);
  return { a1, r, n, shown, answer, options, linear };
}

// Tramo 2: capital múltiplo de 100 al p % durante 1 o 2 años (compuesto).
export function genHuchaRound() {
  const c = randInt(1, 10) * 100, p = pick([10, 20, 50]), years = pick([1, 2]);
  const answer = powGrow(c, p, years);
  const simple = c + c * p / 100 * years; // interés simple (coincide si years = 1)
  const cands = years === 2 ? [simple, powGrow(c, p, 3), c + p * years, c * p / 100 * years] : [c + p, c * p / 100, powGrow(c, p, 2), c + c * 2 * p / 100];
  const options = options4(answer, cands, () => answer + randInt(1, 6) * 10);
  return { c, p, years, answer, options, simple, chain: [c, ...Array.from({ length: years }, (_, i) => powGrow(c, p, i + 1))] };
}

// Tramo 3: precio múltiplo de 100 con dos porcentajes encadenados.
const REBAJAS_PARES = [[-20, 20], [20, -20], [-10, 10], [10, -10], [-50, 50], [50, -50], [-20, -10], [-10, -20], [-50, -20], [20, 10], [10, 20], [-20, 50], [50, -20]];
export function genRebajasRound() {
  const price = randInt(1, 9) * 100, [p1, p2] = pick(REBAJAS_PARES);
  const after1 = price * (100 + p1) / 100;
  const answer = Math.round(after1 * (100 + p2)) / 100;
  const naive = price * (100 + p1 + p2) / 100; // sumar los porcentajes
  const cands = [naive, after1, price * (100 + p2) / 100, price * (100 + p1) / 100 * (100 + p1) / 100];
  const options = options4(answer, cands, () => answer + randInt(1, 8) * 5);
  return { price, p1, p2, after1, answer, options, naive, factor: Math.round((100 + p1) * (100 + p2)) / 10000 };
}

// Tramo 4: plan lineal a0 + d·n contra bola b0·r^n. ¿En qué mes adelanta la bola?
export function genLinealRound() {
  let guard = 0;
  while (guard++ < 5000) {
    const a0 = pick([50, 100, 200, 300]), d = pick([10, 20, 50, 100]), b0 = pick([1, 2, 5, 10]), r = pick([2, 3]);
    const A = (n) => a0 + d * n, B = (n) => b0 * r ** n;
    if (B(0) >= A(0)) continue;
    let k = -1;
    for (let n = 1; n <= MAX_MONTH; n++) { if (B(n) === A(n)) { k = -1; break; } if (B(n) > A(n)) { k = n; break; } }
    if (k < 2) continue;
    return { a0, d, b0, r, k, rows: Array.from({ length: MAX_MONTH + 1 }, (_, n) => [n, A(n), B(n)]) };
  }
  return { a0: 100, d: 50, b0: 10, r: 2, k: 6, rows: Array.from({ length: MAX_MONTH + 1 }, (_, n) => [n, 100 + 50 * n, 10 * 2 ** n]) };
}

// Reto: capital al p % anual, ¿cuántos años hasta llegar al menos a k veces el capital?
export function genRetoRound() {
  const c = randInt(1, 10) * 100, p = pick([10, 20, 50]), k = pick([2, 3, 4]);
  const target = c * k;
  const chain = [c];
  let n = 0;
  while (chain[n] < target - 1e-9 && n < 40) { n++; chain.push(powGrow(c, p, n)); }
  const linearYears = Math.ceil((target - c) / (c * p / 100));
  const options = options4(n, [linearYears, n - 1, n + 1, n + 2, n - 2], () => n + randInt(1, 4) * 2);
  return { c, p, k, target, answer: n, chain, options, linearYears };
}

// ---------------- dibujo ----------------

function ballsSvg(values) {
  const max = Math.max(...values);
  const W = 320, H = 110, rMin = 4;
  const step = W / values.length;
  const rMax = Math.min(44, step / 2 - 2);
  const dense = values.length > 8;
  let out = "";
  values.forEach((v, i) => {
    const rad = rMin + (rMax - rMin) * Math.sqrt(v / max);
    const label = !dense || i === 0 || i === values.length - 1 || i % 3 === 0;
    out += `<circle cx="${step * (i + 0.5)}" cy="${H - 14 - rad}" r="${rad}" class="bln-ball" />${label ? `<text x="${step * (i + 0.5)}" y="${H - 2}" class="bln-ball-label ${dense ? "bln-ball-label-sm" : ""}">${v}</text>` : ""}`;
  });
  return `<svg class="bln-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${out}</svg>`;
}

function barsSvg(rows, upto, k) {
  const W = 320, H = 170, PADL = 8, PADB = 22, PADT = 8;
  const max = Math.max(...rows.slice(0, upto + 1).flatMap(([, a, b]) => [a, b]), 1);
  const gw = (W - PADL * 2) / rows.length, bw = gw * 0.36;
  const hy = (v) => (H - PADB - PADT) * v / max;
  let out = `<line x1="${PADL}" y1="${H - PADB}" x2="${W - PADL}" y2="${H - PADB}" class="bln-axis" />`;
  rows.forEach(([n, a, b]) => {
    const x = PADL + gw * n;
    out += `<text x="${x + gw / 2}" y="${H - 6}" class="bln-tick ${n === k ? "bln-tick-k" : ""}">${n}</text>`;
    if (n > upto) return;
    out += `<rect x="${x + gw / 2 - bw - 1}" y="${H - PADB - hy(a)}" width="${bw}" height="${hy(a)}" class="bln-bar-a" data-bar-a="${n}" />`;
    out += `<rect x="${x + gw / 2 + 1}" y="${H - PADB - hy(b)}" width="${bw}" height="${hy(b)}" class="bln-bar-b" data-bar-b="${n}" />`;
  });
  return `<svg class="bln-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-bars data-upto="${upto}">${out}</svg>`;
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
  try { await client.from("football_progress").upsert({ game: "bola", player: playerId(), data: progress, updated_at: new Date().toISOString() }); } catch (_) { /* guinda */ }
}

// ---------------- juego ----------------

export function mountBolaGame(container, { client, onExit }) {
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
  const badge = (t) => `<div class="bln-badge">${t}</div>`;
  const optionsHtml = (opts, fmt) => `<div class="bln-options">${opts.map((v) => `<button type="button" class="choice-btn bln-opt" data-opt="${v}">${fmt(v)}</button>`).join("")}</div>`;
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
  function startLevel(l) { level = l; ({ 1: screenDobla, 2: screenHucha, 3: screenRebajas, 4: screenLineal, 5: screenReto })[l](); }
  function outcome(ok, tipo, expl, review, retry) {
    locked = true;
    if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : nextRound(); }, 2200); }
    else if (review) { feedback(`No: ${expl} Otra vez.`, false); later(() => { locked = false; retry(); }, 2800); }
    else { recordError(tipo, expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; nextRound(); }); }
  }
  function bindOptions(check) {
    body.querySelectorAll("[data-opt]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      const v = Number(btn.getAttribute("data-opt"));
      body.querySelectorAll("[data-opt]").forEach((x) => (x.disabled = true));
      const ok = check(v);
      btn.classList.add(ok ? "correct" : "wrong");
    }));
  }

  // ---- mapa ----
  function screenMap() {
    locked = false;
    const unlocked = Math.min((progress.nivelMax || 0) + 1, 5);
    const nodes = [1, 2, 3, 4, 5].map((l) => { const done = l <= (progress.nivelMax || 0), open = l <= unlocked; return `<button type="button" class="bln-node ${done ? "bln-node-done" : ""}" data-level="${l}" ${open ? "" : "disabled"}><span class="bln-node-num">${done ? "✓" : l}</span><span class="bln-node-name">${LEVEL_NAMES[l]}</span></button>`; }).join("");
    body.innerHTML = `
      ${header("Bola de nieve", "Sumar siempre lo mismo hace una recta; multiplicar siempre por lo mismo hace una bola que se dispara")}
      <div class="bln-map">${nodes}</div>
      <div class="bln-actions"><button type="button" class="secondary" data-tutorial>El arroz del tablero (tutorial)</button></div>
      <p class="bln-progress">${progress.partidas ? `Partidas: ${progress.partidas}. Tramos superados: ${progress.nivelMax || 0} de 5.` : "Primera vez: mira el tutorial y empieza por el tramo 1."}</p>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-level]").forEach((b) => b.addEventListener("click", () => { roundIdx = 0; startLevel(Number(b.getAttribute("data-level"))); }));
    body.querySelector("[data-tutorial]").addEventListener("click", screenTutorial);
  }

  // ---- tutorial: el arroz del tablero ----
  function screenTutorial() {
    let casilla = 1;
    const grains = (k) => 2 ** (k - 1);
    const board = () => `<div class="bln-board">${Array.from({ length: 8 }, (_, i) => `<div class="bln-cell ${i + 1 <= casilla ? "bln-cell-on" : ""}"><span class="bln-cell-num">${i + 1}</span><span class="bln-cell-val">${i + 1 <= casilla ? grains(i + 1) : ""}</span></div>`).join("")}</div>`;
    body.innerHTML = `
      ${badge("Tutorial · el arroz del tablero")}
      ${header("Un grano en la primera casilla y el doble en cada casilla siguiente", "Toca 'Siguiente casilla' hasta llenar la fila de 8")}
      <div data-board>${board()}</div>
      <div class="bln-actions"><button type="button" class="primary" data-step>Siguiente casilla</button></div>
      <div class="bln-formula" data-formula>casilla 1 → 1 grano</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelector("[data-step]").addEventListener("click", () => {
      if (locked || finished || casilla >= 8) return;
      casilla = Math.min(8, casilla + 1);
      body.querySelector("[data-board]").innerHTML = board();
      body.querySelector("[data-formula]").innerHTML = `casilla ${casilla} → 2<sup>${casilla - 1}</sup> = <b>${grains(casilla)}</b> granos${casilla > 2 ? ` (sumando de 1 en 1 irías por ${casilla})` : ""}`;
      if (casilla === 8) {
        locked = true; award();
        feedback("Ocho casillas y ya van 128 granos; en la 64 serían 9 trillones. Multiplicar por 2 cada vez es la bola de nieve: arranca despacio y luego no hay quien la pare.", true);
        const btn = body.querySelector("[data-step]"); btn.textContent = "Al tramo 1 →"; btn.setAttribute("data-next", "");
        btn.addEventListener("click", () => { locked = false; roundIdx = 0; startLevel(1); }, { once: true });
      } else feedback(`Casilla ${casilla}: el doble de ${grains(casilla - 1)} son ${grains(casilla)}.`, true);
    });
  }

  // ---- tramo 1: dobla ----
  function screenDobla(review = false) {
    const r = genDoblaRound();
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 1 · ${LEVEL_NAMES[1]} · ${roundIdx + 1} de ${ROUNDS[1]}`)}
      ${header(`Cada bola es la anterior multiplicada por lo mismo. ¿Cuánto vale la bola <b>${r.n}</b>?`, "Mira por cuánto se multiplica de una a la siguiente")}
      <div class="bln-wrap" data-seq="${r.shown.join(",")}" data-n="${r.n}">${ballsSvg(r.shown)}</div>
      ${optionsHtml(r.options, (v) => fmtNum(v))}
      <div class="feedback" data-feedback></div>`;
    bindOptions((v) => {
      const ok = near(v, r.answer);
      const expl = `de ${r.shown[0]} a ${r.shown[1]} y de ${r.shown[1]} a ${r.shown[2]} se multiplica por ${r.r}; la bola ${r.n} es ${r.a1}·${r.r}^${r.n - 1} = ${fmtNum(r.answer)}${near(v, r.linear) && !ok ? ` (${fmtNum(r.linear)} sería seguir sumando ${r.shown[2] - r.shown[1]}, y eso es una recta, no una bola)` : ""}.`;
      outcome(ok, "sucesión geométrica", expl, review, () => screenDobla(true));
      return ok;
    });
  }

  // ---- tramo 2: la hucha ----
  function screenHucha(review = false) {
    const r = genHuchaRound();
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 2 · ${LEVEL_NAMES[2]} · ${roundIdx + 1} de ${ROUNDS[2]}`)}
      ${header(`Metes <b>${fmtEur(r.c)}</b> en una hucha que crece un <b>${r.p} %</b> cada año. ¿Cuánto hay al cabo de <b>${r.years} ${r.years === 1 ? "año" : "años"}</b>?`, "Cada año se multiplica lo que hay (también lo que creció el año anterior)")}
      <div class="bln-wrap" data-c="${r.c}" data-p="${r.p}" data-years="${r.years}">${ballsSvg(r.chain)}</div>
      ${optionsHtml(r.options, fmtEur)}
      <div class="feedback" data-feedback></div>`;
    bindOptions((v) => {
      const ok = near(v, r.answer);
      const expl = `cada año se multiplica por ${fmtNum((100 + r.p) / 100)}: ${r.chain.map(fmtNum).join(" → ")} €${r.years === 2 && near(v, r.simple) && !ok ? ` (${fmtEur(r.simple)} sería sumar el ${r.p} % del capital inicial dos veces; el segundo año también crece lo crecido)` : ""}.`;
      outcome(ok, "interés compuesto", expl, review, () => screenHucha(true));
      return ok;
    });
  }

  // ---- tramo 3: rebajas encadenadas ----
  function screenRebajas(review = false) {
    const r = genRebajasRound();
    const verb = (p) => (p > 0 ? `sube un ${p} %` : `baja un ${-p} %`);
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 3 · ${LEVEL_NAMES[3]} · ${roundIdx + 1} de ${ROUNDS[3]}`)}
      ${header(`Un abrigo de <b>${fmtEur(r.price)}</b> primero <b>${verb(r.p1)}</b> y después <b>${verb(r.p2)}</b>. ¿Precio final?`, "El segundo porcentaje se aplica sobre el precio ya cambiado, no sobre el original")}
      <div class="bln-chain" data-price="${r.price}" data-p1="${r.p1}" data-p2="${r.p2}"><span class="bln-chip">${fmtEur(r.price)}</span><span class="bln-arrow">×${fmtNum((100 + r.p1) / 100)}</span><span class="bln-chip">?</span><span class="bln-arrow">×${fmtNum((100 + r.p2) / 100)}</span><span class="bln-chip">?</span></div>
      ${optionsHtml(r.options, fmtEur)}
      <div class="feedback" data-feedback></div>`;
    bindOptions((v) => {
      const ok = near(v, r.answer);
      const expl = `${fmtNum(r.price)} × ${fmtNum((100 + r.p1) / 100)} = ${fmtNum(r.after1)}, y ${fmtNum(r.after1)} × ${fmtNum((100 + r.p2) / 100)} = ${fmtEur(r.answer)}; en total se multiplica por ${fmtNum(r.factor)}${near(v, r.naive) && !ok ? ` (sumar ${r.p1 > 0 ? "+" : ""}${r.p1} y ${r.p2 > 0 ? "+" : ""}${r.p2} da ${fmtEur(r.naive)}, pero los porcentajes encadenados se multiplican, no se suman)` : ""}.`;
      outcome(ok, "porcentajes encadenados", expl, review, () => screenRebajas(true));
      return ok;
    });
  }

  // ---- tramo 4: lineal contra bola ----
  function screenLineal(review = false) {
    const r = genLinealRound();
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Tramo 4 · ${LEVEL_NAMES[4]} · ${roundIdx + 1} de ${ROUNDS[4]}`)}
      ${header(`Plan <b>A</b>: ${r.a0} y cada mes <b>+${r.d}</b>. Plan <b>B</b>: ${r.b0} y cada mes <b>×${r.r}</b>. ¿En qué mes adelanta B a A por primera vez?`, "Predice primero; luego verás crecer las barras mes a mes")}
      <div class="bln-wrap" data-wrap data-a0="${r.a0}" data-d="${r.d}" data-b0="${r.b0}" data-r="${r.r}">${barsSvg(r.rows, 0, -1)}</div>
      <div class="bln-legend"><span class="bln-key bln-key-a">A (recta)</span><span class="bln-key bln-key-b">B (bola)</span></div>
      <div class="bln-months">${Array.from({ length: MAX_MONTH - 1 }, (_, i) => i + 2).map((m) => `<button type="button" class="choice-btn bln-month" data-month="${m}">${m}</button>`).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-month]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      locked = true;
      const m = Number(btn.getAttribute("data-month")); const ok = m === r.k;
      body.querySelectorAll("[data-month]").forEach((x) => (x.disabled = true)); btn.classList.add(ok ? "correct" : "wrong");
      let upto = 0;
      const tick = () => { upto++; body.querySelector("[data-wrap]").innerHTML = barsSvg(r.rows, upto, r.k); if (upto < r.k) later(tick, 260); else reveal(); };
      const reveal = () => {
        const [, aPrev, bPrev] = r.rows[r.k - 1], [, aK, bK] = r.rows[r.k];
        const expl = `en el mes ${r.k - 1} A = ${aPrev} y B = ${bPrev} (B aún detrás); en el mes ${r.k} A = ${aK} y B = ${bK}: la bola adelanta en el mes ${r.k}.`;
        locked = false;
        outcome(ok, "lineal contra exponencial", expl, review, () => screenLineal(true));
      };
      later(tick, 260);
    }));
  }

  // ---- reto: ¿cuántos años? ----
  function screenReto() {
    const r = genRetoRound();
    body.innerHTML = `
      ${badge(`Reto · ${LEVEL_NAMES[5]} · ${roundIdx + 1} de ${ROUNDS[5]}`)}
      ${header(`Tienes <b>${fmtEur(r.c)}</b> al <b>${r.p} %</b> anual. ¿Cuántos años hacen falta para llegar al menos a <b>${fmtEur(r.target)}</b> (${({ 2: "el doble", 3: "el triple", 4: "cuatro veces más" })[r.k]})?`, "Aquí no se pierden vidas: ve multiplicando año a año")}
      <div class="bln-wrap" data-wrap data-c="${r.c}" data-p="${r.p}" data-k="${r.k}"></div>
      ${optionsHtml(r.options, (v) => `${v} ${v === 1 ? "año" : "años"}`)}
      <div class="feedback" data-feedback></div>`;
    bindOptions((v) => {
      const ok = v === r.answer;
      locked = true;
      body.querySelector("[data-wrap]").innerHTML = ballsSvg(r.chain.map((x) => Math.round(x)));
      const expl = `${r.chain.map(fmtNum).join(" → ")}: hacen falta ${r.answer} años (a interés simple, sumando ${fmtNum(r.c * r.p / 100)} cada año, serían ${r.linearYears}).`;
      if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); } else { recordError("cuántos años", `Dijiste ${v}; ${expl}`); feedback(`No: ${expl}`, false); }
      later(() => { locked = false; nextRound(); }, 3200);
      return ok;
    });
  }

  // ---- resultados y repaso ----
  function screenResults() {
    const byType = {};
    errors.forEach((e) => { byType[e.tipo] = (byType[e.tipo] || 0) + 1; });
    progress = { nivelMax: Math.max(progress.nivelMax || 0, levelReached), fallosPorTipo: { ...(progress.fallosPorTipo || {}) }, partidas: (progress.partidas || 0) + 1 };
    Object.entries(byType).forEach(([t, v]) => { progress.fallosPorTipo[t] = (progress.fallosPorTipo[t] || 0) + v; });
    saveProgress(client, progress);
    const items = errors.length ? `<ul class="bln-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>` : `<p class="bln-progress">Sin fallos: distingues la recta de la bola sin pestañear.</p>`;
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos · tramos ${Math.max(levelReached, progress.nivelMax || 0)} de 5`)}
      <div class="bln-learned">Sumar siempre lo mismo es lineal (una recta). Multiplicar siempre por lo mismo es exponencial: cada paso se calcula sobre lo que ya hay, por eso el interés se acumula, un +20 % y un −20 % dejan un 0,96 y la bola acaba adelantando a cualquier recta.</div>
      ${items}
      <div class="bln-actions">${errors.length ? '<button type="button" class="primary" data-review>Repasar lo fallado</button>' : ""}<button type="button" class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }
  function nextReview() {
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    ({ "sucesión geométrica": () => screenDobla(true), "interés compuesto": () => screenHucha(true), "porcentajes encadenados": () => screenRebajas(true), "lineal contra exponencial": () => screenLineal(true) }[tipo] || nextReview)();
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "bola", { score, rounds });
    body.innerHTML = `
      <div class="end-card"><div>❄️</div><div class="big-score">${score} pts</div><p>${rounds} aciertos · tramos ${Math.max(levelReached, progress.nivelMax || 0)} de 5</p>
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
