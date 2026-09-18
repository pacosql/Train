// "De la balanza a la ecuación" — juego grande (campaña con mapa) sobre
// ecuaciones de primer grado. El núcleo es UNA idea: lo que se hace a un
// lado se hace al otro. Nivel 1 la muestra con una balanza de sacos (x) y
// pesas; nivel 2 retira el dibujo y deja solo los símbolos con los mismos
// botones; nivel 3 invierte el papel (juzgar si un paso ajeno es válido);
// nivel 4 pide despejar x de un golpe; el reto final son tres ecuaciones
// a ciegas que se comprueban al final. Resultados con explicación por
// fallo y repaso. Progreso (nivel máximo) en localStorage + football_progress.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const ROUNDS = { 1: 3, 2: 3, 3: 4, 4: 3, 5: 3 };
const LEVEL_NAMES = { 1: "Balanza", 2: "Símbolos", 3: "Paso falso", 4: "Despeja", 5: "A ciegas" };
const STORAGE_KEY = "football_ecuacion_progress";
const PLAYER_KEY = "football_player_id";

// ---------------- generadores puros ----------------

// a·x + c = b·x + d con a > b, solución entera x ∈ [1, 9].
export function genBalanceEq({ allowZeroB = true } = {}) {
  let eq;
  do {
    const x = randInt(1, 9);
    const a = randInt(2, 4);
    const b = allowZeroB ? randInt(0, Math.min(2, a - 1)) : randInt(1, Math.min(2, a - 1));
    const c = randInt(0, 6);
    const d = (a - b) * x + c;
    eq = { a, b, c, d, x };
  } while (eq.d > 20);
  return eq;
}

function term(coef, constant) {
  const parts = [];
  if (coef === 1) parts.push("x");
  else if (coef > 1) parts.push(`${coef}x`);
  if (constant > 0) parts.push(String(constant));
  return parts.length ? parts.join(" + ") : "0";
}

export function fmtEq(eq) {
  return `${term(eq.a, eq.c)} = ${term(eq.b, eq.d)}`;
}

// Paso propuesto sobre una ecuación: válido (misma operación en los dos
// lados) o falso (uno de los tres errores clásicos). Devuelve la ecuación
// de partida, la de llegada, si es válido y por qué.
export function genFalseStep() {
  const eq = genBalanceEq({ allowZeroB: false });
  const kind = pick(["restar_sacos", "restar_pesas", "solo_un_lado_pesas", "solo_un_lado_sacos", "sumar_en_vez_de_restar"]);
  if (kind === "restar_sacos") {
    return { eq, next: { a: eq.a - eq.b, b: 0, c: eq.c, d: eq.d }, valid: true, why: `Se quitan ${eq.b === 1 ? "x" : eq.b + "x"} de los DOS lados: la igualdad se mantiene.` };
  }
  if (kind === "restar_pesas") {
    const m = Math.min(eq.c, eq.d);
    if (m === 0) return genFalseStep();
    return { eq, next: { a: eq.a, b: eq.b, c: eq.c - m, d: eq.d - m }, valid: true, why: `Se resta ${m} en los DOS lados: la igualdad se mantiene.` };
  }
  if (kind === "solo_un_lado_pesas") {
    if (eq.c === 0) return genFalseStep();
    return { eq, next: { a: eq.a, b: eq.b, c: 0, d: eq.d }, valid: false, why: `Se ha quitado ${eq.c} solo del lado izquierdo; el derecho sigue con ${eq.d}. Lo que se quita a un lado hay que quitarlo al otro.` };
  }
  if (kind === "solo_un_lado_sacos") {
    return { eq, next: { a: eq.a - eq.b, b: eq.b, c: eq.c, d: eq.d }, valid: false, why: `Se han quitado ${eq.b === 1 ? "x" : eq.b + "x"} solo del lado izquierdo; el derecho sigue con ${eq.b === 1 ? "x" : eq.b + "x"}.` };
  }
  const m = Math.min(eq.c, eq.d);
  if (m === 0) return genFalseStep();
  return { eq, next: { a: eq.a, b: eq.b, c: eq.c - m, d: eq.d + m }, valid: false, why: `A la izquierda se resta ${m} pero a la derecha se SUMA ${m}: la balanza se desequilibra.` };
}

// ---------------- dibujo ----------------

function balanceSvg(eq) {
  const W = 300;
  const H = 150;
  const sacks = (n, x0) => Array.from({ length: n }, (_, i) => `<rect x="${x0 + (i % 4) * 22}" y="${62 - Math.floor(i / 4) * 20}" width="18" height="16" rx="4" class="ecu-sack" /><text x="${x0 + (i % 4) * 22 + 9}" y="${74 - Math.floor(i / 4) * 20}" class="ecu-sack-x">x</text>`).join("");
  const weights = (n, x0) => Array.from({ length: n }, (_, i) => `<circle cx="${x0 + (i % 5) * 16 + 8}" cy="${72 - Math.floor(i / 5) * 16}" r="7" class="ecu-weight" />`).join("");
  return `<svg class="ecu-balance" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <line x1="150" y1="20" x2="150" y2="130" class="ecu-post" /><line x1="30" y1="20" x2="270" y2="20" class="ecu-beam" />
    <line x1="30" y1="20" x2="30" y2="84" class="ecu-rope" /><line x1="270" y1="20" x2="270" y2="84" class="ecu-rope" />
    <rect x="0" y="84" width="130" height="6" rx="3" class="ecu-pan" /><rect x="170" y="84" width="130" height="6" rx="3" class="ecu-pan" />
    ${sacks(eq.a, 4)}${weights(eq.c, 4 + Math.min(eq.a, 4) * 22)}
    ${sacks(eq.b, 174)}${weights(eq.d, 174 + Math.min(eq.b, 4) * 22)}
    <text x="65" y="110" class="ecu-side-label">${term(eq.a, eq.c)}</text><text x="235" y="110" class="ecu-side-label">${term(eq.b, eq.d)}</text>
  </svg>`;
}

function keypadHtml() {
  return `<div class="keypad-display" data-display>&nbsp;</div><div class="keypad" data-keypad></div>`;
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
  try { await client.from("football_progress").upsert({ game: "ecuacion", player: playerId(), data: progress, updated_at: new Date().toISOString() }); } catch (_) { /* guinda */ }
}

// ---------------- juego ----------------

export function mountEcuacionGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let level = 0;
  let roundInLevel = 0;
  let levelReached = 0;
  let errors = [];
  let reviewQueue = [];
  let blind = [];
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
  const feedback = (text, ok) => { const el = body.querySelector("[data-feedback]"); if (el) { el.textContent = text; el.className = `feedback ${ok ? "ok" : "bad"}`; } };
  const header = (t, s) => `<p class="prompt">${t}${s ? `<small>${s}</small>` : ""}</p>`;
  const badge = (txt) => `<div class="ecu-badge">${txt}</div>`;
  const recordError = (tipo, explicacion) => errors.push({ tipo, explicacion });
  function loseLife(next) {
    lives--; renderLives();
    if (lives <= 0) later(() => { screenResults(); }, 2600); else later(next, 2600);
  }
  function nextRound() {
    roundInLevel++;
    if (roundInLevel >= ROUNDS[level]) {
      levelReached = Math.max(levelReached, level);
      progress.nivelMax = Math.max(progress.nivelMax || 0, level);
      saveProgress(client, progress);
      roundInLevel = 0;
      if (level >= 5) screenResults(); else screenMap();
      return;
    }
    startLevel(level);
  }
  function startLevel(l) {
    level = l;
    if (l === 1) screenBalance(false);
    else if (l === 2) screenBalance(true);
    else if (l === 3) screenFalseStep();
    else if (l === 4) screenSolve();
    else screenBlind();
  }

  function bindKeypad(onSubmit, maxDigits = 1) {
    let typed = "";
    const pad = body.querySelector("[data-keypad]");
    const display = body.querySelector("[data-display]");
    const render = () => { display.textContent = typed || " "; };
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key"; btn.type = "button"; btn.textContent = key;
      if (key === "⌫") { btn.setAttribute("data-backspace", ""); btn.addEventListener("click", () => { if (!locked) { typed = typed.slice(0, -1); render(); } }); }
      else if (key === "✓") { btn.setAttribute("data-submit", ""); btn.addEventListener("click", () => { if (!locked && typed !== "") onSubmit(Number(typed)); }); }
      else { btn.setAttribute("data-digit", key); btn.addEventListener("click", () => { if (!locked && typed.length < maxDigits) { typed += key; render(); } }); }
      pad.appendChild(btn);
    });
    render();
  }

  // ---- mapa ----
  function screenMap() {
    locked = false;
    const unlocked = Math.min((progress.nivelMax || 0) + 1, 5);
    const nodes = [1, 2, 3, 4, 5].map((l) => {
      const done = l <= (progress.nivelMax || 0);
      const open = l <= unlocked;
      return `<button type="button" class="ecu-node ${done ? "ecu-node-done" : ""} ${open ? "" : "ecu-node-locked"}" data-level="${l}" ${open ? "" : "disabled"}><span class="ecu-node-num">${done ? "✓" : l}</span><span class="ecu-node-name">${LEVEL_NAMES[l]}</span></button>`;
    }).join('<span class="ecu-path"></span>');
    body.innerHTML = `
      ${header("De la balanza a la ecuación", "Lo que se hace a un lado se hace al otro. Elige una etapa del mapa")}
      <div class="ecu-map">${nodes}</div>
      <p class="ecu-progress">${progress.partidas ? `Partidas: ${progress.partidas}. Etapa máxima superada: ${progress.nivelMax || 0} de 5.` : "Primera partida: empieza por la balanza."}</p>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-level]").forEach((b) => b.addEventListener("click", () => { roundInLevel = 0; startLevel(Number(b.getAttribute("data-level"))); }));
  }

  // ---- niveles 1 y 2: quitar lo mismo de los dos lados ----
  function screenBalance(symbolsOnly, review = false) {
    const eq = genBalanceEq();
    const cur = { a: eq.a, b: eq.b, c: eq.c, d: eq.d };
    let history = [fmtEq(cur)];
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Etapa ${level} · ${LEVEL_NAMES[level]} · ${roundInLevel + 1} de ${ROUNDS[level]}`)}
      ${header(symbolsOnly ? "Despeja x con las mismas operaciones, ahora sin dibujo" : "Deja los sacos solos en un plato: quita lo mismo de los dos lados", "Cada saco pesa x kilos; cada pesa, 1 kilo")}
      <div class="ecu-stage" data-stage></div>
      <div class="ecu-eq" data-eq></div>
      <div class="ecu-ops">
        <button type="button" class="choice-btn ecu-op" data-op="saco">− 1 saco a cada lado</button>
        <button type="button" class="choice-btn ecu-op" data-op="pesa">− 1 pesa a cada lado</button>
        <button type="button" class="choice-btn ecu-op primary" data-op="repartir">Repartir: ¿cuánto pesa un saco?</button>
      </div>
      <div class="ecu-keypad" data-keypadwrap hidden>${keypadHtml()}</div>
      <div class="feedback" data-feedback></div>`;
    const draw = () => {
      body.querySelector("[data-stage]").innerHTML = symbolsOnly ? "" : balanceSvg(cur);
      body.querySelector("[data-eq]").innerHTML = history.map((h, i) => `<div class="ecu-eq-line ${i === history.length - 1 ? "ecu-eq-current" : ""}">${h}</div>`).join("");
    };
    draw();
    const explain = () => `Quitando ${eq.b === 0 ? "nada" : (eq.b === 1 ? "x" : eq.b + "x")} y ${Math.min(eq.c, eq.d)} de los dos lados queda ${eq.a - eq.b}x = ${eq.d - Math.min(eq.c, eq.d) - (eq.c - Math.min(eq.c, eq.d))}, así que x = ${eq.x}.`;
    body.querySelectorAll("[data-op]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      const op = btn.getAttribute("data-op");
      if (op === "saco") {
        if (cur.a >= 1 && cur.b >= 1) { cur.a--; cur.b--; history.push(fmtEq(cur)); draw(); feedback("Un saco menos en cada plato: sigue en equilibrio.", true); }
        else feedback("Solo puedes quitar un saco si hay sacos en LOS DOS platos.", false);
        return;
      }
      if (op === "pesa") {
        if (cur.c >= 1 && cur.d >= 1) { cur.c--; cur.d--; history.push(fmtEq(cur)); draw(); feedback("Una pesa menos en cada plato: sigue en equilibrio.", true); }
        else feedback("Solo puedes quitar una pesa si hay pesas en LOS DOS platos.", false);
        return;
      }
      const ready = (cur.b === 0 && cur.c === 0 && cur.a > 0) || (cur.a === 0 && cur.d === 0 && cur.b > 0);
      if (!ready) { feedback("Todavía no: para repartir, un plato debe tener SOLO sacos y el otro SOLO pesas.", false); return; }
      const k = cur.b === 0 ? cur.a : cur.b;
      const m = cur.b === 0 ? cur.d : cur.c;
      body.querySelector("[data-keypadwrap]").hidden = false;
      body.querySelectorAll("[data-op]").forEach((x) => (x.disabled = true));
      feedback(`${k} saco${k > 1 ? "s" : ""} pesan ${m} kilos. ¿Cuánto pesa un saco?`, true);
      bindKeypad((val) => {
        locked = true;
        const ok = val === eq.x;
        if (ok) { award(); feedback(`¡Correcto! ${m} ÷ ${k} = ${eq.x}: x = ${eq.x}.`, true); later(() => { locked = false; review ? nextReview() : nextRound(); }, 1800); }
        else if (review) { feedback(`No: ${m} ÷ ${k} = ${eq.x}. Otra vez.`, false); later(() => { locked = false; screenBalance(symbolsOnly, true); }, 2200); }
        else { recordError(symbolsOnly ? "despejar con símbolos" : "despejar en la balanza", explain()); feedback(`No es correcto. ${m} ÷ ${k} = ${eq.x}.`, false); loseLife(() => { locked = false; nextRound(); }); }
      });
    }));
  }

  // ---- nivel 3: ¿es válido este paso? ----
  function screenFalseStep(review = false) {
    const r = genFalseStep();
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Etapa 3 · ${LEVEL_NAMES[3]} · ${roundInLevel + 1} de ${ROUNDS[3]}`)}
      ${header("Alguien ha dado este paso. ¿Es válido?", "Un paso es válido si hace LO MISMO en los dos lados")}
      <div class="ecu-eq"><div class="ecu-eq-line">${fmtEq(r.eq)}</div><div class="ecu-arrow">↓</div><div class="ecu-eq-line ecu-eq-current">${fmtEq(r.next)}</div></div>
      <div class="ecu-ops"><button type="button" class="choice-btn ecu-judge" data-judge="1">✔ Válido</button><button type="button" class="choice-btn ecu-judge" data-judge="0">✘ Falso</button></div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-judge]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      locked = true;
      const said = btn.getAttribute("data-judge") === "1";
      const ok = said === r.valid;
      body.querySelectorAll("[data-judge]").forEach((x) => (x.disabled = true));
      btn.classList.add(ok ? "correct" : "wrong");
      if (ok) { award(); feedback(`¡Correcto! ${r.why}`, true); later(() => { locked = false; review ? nextReview() : nextRound(); }, 2000); }
      else if (review) { feedback(`No: ${r.why}`, false); later(() => { locked = false; screenFalseStep(true); }, 2400); }
      else { recordError("juzgar un paso", r.why); feedback(`No es correcto. ${r.why}`, false); loseLife(() => { locked = false; nextRound(); }); }
    }));
  }

  // ---- nivel 4: despeja de un golpe ----
  function screenSolve(review = false) {
    const eq = genBalanceEq();
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Etapa 4 · ${LEVEL_NAMES[4]} · ${roundInLevel + 1} de ${ROUNDS[4]}`)}
      ${header(`¿Cuánto vale x?`, "Quita lo mismo de los dos lados mentalmente y reparte")}
      <div class="ecu-eq"><div class="ecu-eq-line ecu-eq-current ecu-eq-big">${fmtEq(eq)}</div></div>
      ${keypadHtml()}
      <div class="feedback" data-feedback></div>`;
    const expl = `${eq.a}x + ${eq.c} = ${eq.b}x + ${eq.d} → ${eq.a - eq.b}x = ${eq.d - eq.c} → x = ${eq.x}.`;
    bindKeypad((val) => {
      locked = true;
      const ok = val === eq.x;
      if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : nextRound(); }, 1800); }
      else if (review) { feedback(`No: ${expl}`, false); later(() => { locked = false; screenSolve(true); }, 2200); }
      else { recordError("despejar de un golpe", expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; nextRound(); }); }
    });
  }

  // ---- reto: tres ecuaciones a ciegas ----
  function screenBlind() {
    if (roundInLevel === 0) blind = [];
    const eq = genBalanceEq();
    body.innerHTML = `
      ${badge(`Reto a ciegas · ecuación ${roundInLevel + 1} de 3`)}
      ${header("Escribe x. No sabrás si aciertas hasta el final", "Tres ecuaciones seguidas; se comprueban todas juntas")}
      <div class="ecu-eq"><div class="ecu-eq-line ecu-eq-current ecu-eq-big">${fmtEq(eq)}</div></div>
      ${keypadHtml()}
      <div class="feedback" data-feedback></div>`;
    bindKeypad((val) => {
      locked = true;
      blind.push({ eq, val });
      feedback("Anotado.", true);
      later(() => {
        locked = false;
        roundInLevel++;
        if (roundInLevel >= 3) {
          blind.forEach(({ eq: e, val: v }) => {
            if (v === e.x) award();
            else recordError("reto a ciegas", `${fmtEq(e)}: ${e.a - e.b}x = ${e.d - e.c} → x = ${e.x}, no ${v}.`);
          });
          levelReached = Math.max(levelReached, 5);
          progress.nivelMax = Math.max(progress.nivelMax || 0, 5);
          roundInLevel = 0;
          screenResults();
        } else screenBlind();
      }, 700);
    });
  }

  // ---- resultados y repaso ----
  function screenResults() {
    const byType = {};
    errors.forEach((e) => { byType[e.tipo] = (byType[e.tipo] || 0) + 1; });
    progress = { nivelMax: Math.max(progress.nivelMax || 0, levelReached), fallosPorTipo: { ...(progress.fallosPorTipo || {}) }, partidas: (progress.partidas || 0) + 1 };
    Object.entries(byType).forEach(([t, v]) => { progress.fallosPorTipo[t] = (progress.fallosPorTipo[t] || 0) + v; });
    saveProgress(client, progress);
    const items = errors.length ? `<ul class="ecu-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>` : `<p class="ecu-progress">Sin fallos: has mantenido la balanza en equilibrio en cada paso.</p>`;
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos · etapa máxima ${Math.max(levelReached, progress.nivelMax || 0)} de 5`)}
      <div class="ecu-learned">La idea de todo el juego: una ecuación es una balanza; cualquier cosa que hagas a un lado tienes que hacerla al otro, y cuando un lado solo tiene x, repartes.</div>
      ${items}
      <div class="ecu-ops">${errors.length ? '<button type="button" class="primary" data-review>Repasar lo fallado</button>' : ""}<button type="button" class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }
  function nextReview() {
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    if (tipo === "despejar en la balanza") screenBalance(false, true);
    else if (tipo === "despejar con símbolos") screenBalance(true, true);
    else if (tipo === "juzgar un paso") screenFalseStep(true);
    else screenSolve(true);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "ecuacion", { score, rounds });
    body.innerHTML = `
      <div class="end-card"><div>🪝</div><div class="big-score">${score} pts</div><p>${rounds} aciertos · etapa ${Math.max(levelReached, progress.nivelMax || 0)} de 5</p>
        <div class="end-actions"><button class="primary" data-retry>Jugar otra vez</button><button class="secondary" data-menu>Volver al menú</button></div></div>`;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives; score = 0; rounds = 0; finished = false; locked = false;
    level = 0; roundInLevel = 0; levelReached = 0; errors = []; reviewQueue = []; blind = [];
    progress = loadProgress();
    renderLives(); renderScore();
    screenMap();
  }

  start();
  return () => { finished = true; timers.forEach(clearTimeout); };
}
