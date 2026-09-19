// "El medidor del cuerpo" — juego grande (campaña de misiones) sobre
// estimación de medidas con un referente que se aprende, se usa y luego
// se retira. Misión 1: longitudes con el palmo (20 cm). Misión 2:
// capacidades con la botella (1 L). En cada misión, un tutorial en el
// que medir ES iterar la unidad (el jugador va poniendo palmos sobre el
// objeto hasta cubrirlo), cuatro rondas con tolerancia que se estrecha
// (25 → 10 %) y el referente dibujado a la misma escala solo en las dos
// primeras; el reto final mezcla las dos sin referente. El feedback
// SIEMPRE superpone las unidades con el recuento exacto: el fallo enseña.
// Progreso (misiones superadas, fallos) en localStorage + football_progress.
import { randInt, pick, saveScore } from "./utils.js";

export const MISSIONS = {
  longitud: { nombre: "Longitud", unidad: "palmo", plural: "palmos", valorUnidad: 20, medida: "cm", emoji: "🖐️", objetos: ["esta tabla", "esta cuerda", "este banco", "esta estantería", "este tubo", "esta alfombra"] },
  capacidad: { nombre: "Capacidad", unidad: "botella", plural: "botellas", valorUnidad: 1, medida: "L", emoji: "🧴", objetos: ["este cubo", "esta jarra", "esta garrafa", "este barreño", "este acuario", "esta olla"] },
};
export const TOLERANCES = [0.25, 0.2, 0.15, 0.1];
const RETO_TOL = 0.15;
const RETO_ROUNDS = 3;
const STORAGE_KEY = "football_medidor_progress";
const PLAYER_KEY = "football_player_id";

// ---------------- generadores puros ----------------

export function genTutorial(mission) {
  const k = randInt(3, 5);
  return { mission, k, value: k * MISSIONS[mission].valorUnidad };
}

export function genRound(mission, level, { showRef } = {}) {
  const value = mission === "longitud" ? randInt(6, 40) * 5 : randInt(2, 30);
  const tol = TOLERANCES[Math.max(0, Math.min(3, level))];
  return { mission, value, tol, showRef: showRef !== undefined ? showRef : level < 2, objeto: pick(MISSIONS[mission].objetos) };
}

// Comparación en enteros (porcentaje × valor) para que el borde exacto de la
// tolerancia (p. ej. 230 para 200 cm al 15 %) no dependa de la coma flotante.
export function accepts(value, estimate, tol) {
  return Math.abs(estimate - value) * 100 <= Math.round(tol * 100) * value;
}

export function unitsIn(mission, value) {
  const u = MISSIONS[mission].valorUnidad;
  return { whole: Math.floor(value / u), rest: value - Math.floor(value / u) * u };
}

// ---------------- dibujo ----------------

const PX_PER_CM = 1.6;

function lengthSvg(value, { units = 0, showRef = true, label = "" } = {}) {
  const W = 340;
  const H = showRef ? 96 : 64;
  const w = Math.round(value * PX_PER_CM);
  const x0 = (W - Math.max(w, 32)) / 2;
  let out = `<rect x="${x0}" y="14" width="${w}" height="26" rx="6" class="mdr-object" />`;
  if (label) out += `<text x="${W / 2}" y="31" class="mdr-object-label">${label}</text>`;
  for (let i = 0; i < units; i++) out += `<rect x="${x0 + i * 20 * PX_PER_CM}" y="12" width="${20 * PX_PER_CM - 1}" height="30" class="mdr-unit" />`;
  if (showRef) out += `<rect x="${x0}" y="62" width="${20 * PX_PER_CM}" height="14" rx="3" class="mdr-ref" /><text x="${x0 + 20 * PX_PER_CM + 6}" y="73" class="mdr-ref-label">🖐️ un palmo = 20 cm</text>`;
  return `<svg class="mdr-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-object="${value}">${out}</svg>`;
}

// Capacidad: el recipiente se dibuja con ÁREA proporcional a los litros, en
// celdas de 1 L (CELL × CELL px) dispuestas en hasta 6 columnas; así 2 L y
// 30 L se distinguen a simple vista (antes era una columna de 8 px por litro
// que a pocos litros quedaba como una raya). El referente es una celda de 1 L.
const CELL = 24;
function capacitySvg(value, { units = 0, showRef = true, label = "" } = {}) {
  const W = 340;
  const cols = Math.max(1, Math.min(6, Math.ceil(Math.sqrt(value))));
  const rows = value / cols;
  const w = cols * CELL, h = rows * CELL;
  const H = Math.max(120, Math.ceil(h) + 44);
  const x0 = showRef ? 120 : Math.round((W - w) / 2);
  const base = H - 24;
  let out = `<rect x="${x0}" y="${base - h}" width="${w}" height="${h}" rx="6" class="mdr-object" />`;
  for (let i = 0; i < units; i++) { const c = i % cols, r = Math.floor(i / cols); out += `<rect x="${x0 + c * CELL + 1}" y="${base - (r + 1) * CELL + 1}" width="${CELL - 2}" height="${CELL - 2}" class="mdr-unit" />`; }
  if (label) out += `<text x="${x0 + w / 2}" y="${base - h - 6}" class="mdr-object-label mdr-object-label-out">${label}</text>`;
  if (showRef) out += `<rect x="60" y="${base - CELL}" width="${CELL}" height="${CELL}" rx="3" class="mdr-ref" /><text x="72" y="${base + 16}" class="mdr-ref-label" text-anchor="middle">🧴 1 L</text>`;
  return `<svg class="mdr-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-object="${value}">${out}</svg>`;
}

function drawObject(mission, value, opts) {
  return mission === "longitud" ? lengthSvg(value, opts) : capacitySvg(value, opts);
}

function keypadHtml() {
  return `<div class="keypad-display" data-display>&nbsp;</div><div class="keypad" data-keypad></div>`;
}

// ---------------- progreso ----------------

function loadProgress() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : { misiones: {}, fallosPorTipo: {}, partidas: 0 }; }
  catch (_) { return { misiones: {}, fallosPorTipo: {}, partidas: 0 }; }
}
function playerId() {
  try { let id = localStorage.getItem(PLAYER_KEY); if (!id) { id = `p_${Math.random().toString(36).slice(2, 10)}`; localStorage.setItem(PLAYER_KEY, id); } return id; }
  catch (_) { return "anon"; }
}
async function saveProgress(client, progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* sin almacenamiento */ }
  if (!client) return;
  try { await client.from("football_progress").upsert({ game: "medidor", player: playerId(), data: progress, updated_at: new Date().toISOString() }); } catch (_) { /* guinda */ }
}

// ---------------- juego ----------------

export function mountMedidorGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let mission = null;
  let roundIdx = 0;
  let retoIdx = 0;
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
  const badge = (t) => `<div class="mdr-badge">${t}</div>`;
  const recordError = (tipo, explicacion) => errors.push({ tipo, explicacion });
  function loseLife(next) { lives--; renderLives(); if (lives <= 0) later(screenResults, 2600); else later(next, 2600); }

  function bindKeypad(onSubmit, maxDigits = 3) {
    let typed = "";
    const pad = body.querySelector("[data-keypad]");
    const display = body.querySelector("[data-display]");
    const render = () => { display.textContent = typed || " "; };
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key"; btn.type = "button"; btn.textContent = key;
      if (key === "⌫") { btn.setAttribute("data-backspace", ""); btn.addEventListener("click", () => { if (!locked) { typed = typed.slice(0, -1); render(); } }); }
      else if (key === "✓") { btn.setAttribute("data-submit", ""); btn.addEventListener("click", () => { if (!locked && typed !== "") onSubmit(Number(typed)); }); }
      else { btn.setAttribute("data-digit", key); btn.addEventListener("click", () => { if (!locked && typed.length < maxDigits) { typed = typed === "0" ? key : typed + key; render(); } }); }
      pad.appendChild(btn);
    });
    render();
  }

  function explainText(m, value, est) {
    const u = unitsIn(m, value);
    const M = MISSIONS[m];
    const dev = Math.round(((est - value) / value) * 100);
    const restTxt = u.rest ? ` y ${u.rest} ${M.medida} más` : "";
    return `Caben ${u.whole} ${M.plural}${restTxt}: ${u.whole} × ${M.valorUnidad} ${u.rest ? `+ ${u.rest} ` : ""}= ${value} ${M.medida}. Tú dijiste ${est} ${M.medida} (${dev >= 0 ? "+" : ""}${dev} %).`;
  }

  // ---- mapa ----
  function screenMap() {
    locked = false;
    const done = progress.misiones || {};
    const card = (key, open, extra) => `<button type="button" class="mdr-mission ${done[key] ? "mdr-mission-done" : ""}" data-mission="${key}" ${open ? "" : "disabled"}><span class="mdr-mission-emoji">${extra.emoji}</span><span class="mdr-mission-name">${extra.nombre}</span><span class="mdr-mission-sub">${extra.sub}</span></button>`;
    body.innerHTML = `
      ${header("El medidor del cuerpo", "Aprende un referente, mídelo con él y luego estima sin verlo")}
      <div class="mdr-map">
        ${card("longitud", true, { emoji: "🖐️", nombre: "Longitud", sub: "el palmo = 20 cm" })}
        ${card("capacidad", true, { emoji: "🧴", nombre: "Capacidad", sub: "la botella = 1 L" })}
        ${card("reto", done.longitud && done.capacidad, { emoji: "🎯", nombre: "Reto", sub: "sin referente" })}
      </div>
      <p class="mdr-progress">${progress.partidas ? `Partidas: ${progress.partidas}. Misiones superadas: ${Object.keys(done).filter((k) => done[k]).length} de 3.` : "Primera partida: empieza por la longitud."}</p>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-mission]").forEach((b) => b.addEventListener("click", () => {
      const key = b.getAttribute("data-mission");
      if (key === "reto") { retoIdx = 0; screenReto(); } else { mission = key; roundIdx = 0; screenTutorial(); }
    }));
  }

  // ---- tutorial: medir es iterar la unidad ----
  function screenTutorial() {
    const t = genTutorial(mission);
    const M = MISSIONS[mission];
    let placed = 0;
    body.innerHTML = `
      ${badge(`Misión ${M.nombre} · tutorial`)}
      ${header(`Mide ${pick(M.objetos)} con ${M.unidad === "palmo" ? "tu palmo" : "la botella"}`, `Toca "Poner ${M.unidad}" hasta cubrirlo entero y cuenta`)}
      <div class="mdr-wrap" data-wrap></div>
      <div class="mdr-formula">${M.plural} puestos: <b data-count>0</b></div>
      <div class="mdr-actions"><button type="button" class="primary" data-place>Poner ${M.unidad}</button></div>
      <div class="feedback" data-feedback></div>`;
    const draw = () => { body.querySelector("[data-wrap]").innerHTML = drawObject(mission, t.value, { units: placed, showRef: true }); };
    draw();
    body.querySelector("[data-place]").addEventListener("click", () => {
      if (locked || finished) return;
      if (placed >= t.k) return;
      placed++;
      body.querySelector("[data-count]").textContent = String(placed);
      draw();
      if (placed === t.k) {
        locked = true;
        award();
        feedback(`Cubierto con ${t.k} ${M.plural}: ${t.k} × ${M.valorUnidad} = ${t.value} ${M.medida}. Ahora estima sin contar uno a uno.`, true);
        body.querySelector("[data-actions], .mdr-actions").innerHTML = `<button type="button" class="primary" data-next>Primera ronda →</button>`;
        body.querySelector("[data-next]").addEventListener("click", () => { locked = false; screenRound(); });
      } else feedback(`${placed} de momento… sigue.`, true);
    });
  }

  // ---- rondas de misión ----
  function screenRound(review = false) {
    const r = genRound(mission, roundIdx, review ? { showRef: false } : {});
    const M = MISSIONS[mission];
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Misión ${M.nombre} · ronda ${roundIdx + 1} de 4 · margen ±${Math.round(r.tol * 100)} %`)}
      ${header(`¿Cuánto mide ${r.objeto}, en ${M.medida === "cm" ? "centímetros" : "litros"}?`, r.showRef ? `El referente está dibujado a la misma escala` : `Sin referente: usa el tamaño que recuerdas del ${M.unidad}`)}
      <div class="mdr-wrap" data-wrap>${drawObject(mission, r.value, { showRef: r.showRef, label: "?" })}</div>
      ${keypadHtml()}
      <div class="feedback" data-feedback></div>`;
    bindKeypad((est) => {
      locked = true;
      const ok = accepts(r.value, est, r.tol);
      const u = unitsIn(mission, r.value);
      body.querySelector("[data-wrap]").innerHTML = drawObject(mission, r.value, { units: u.whole, showRef: true, label: `${r.value} ${M.medida}` });
      const txt = explainText(mission, r.value, est);
      if (ok) { award(); feedback(`¡Dentro del margen! ${txt}`, true); later(() => { locked = false; review ? nextReview() : nextRound(); }, 2400); }
      else if (review) { feedback(`Fuera del margen. ${txt}`, false); later(() => { locked = false; screenRound(true); }, 2800); }
      else { recordError(`estimar ${M.nombre.toLowerCase()}`, txt); feedback(`Fuera del margen. ${txt}`, false); loseLife(() => { locked = false; nextRound(); }); }
    });
  }
  function nextRound() {
    roundIdx++;
    if (roundIdx >= 4) {
      progress.misiones = { ...(progress.misiones || {}), [mission]: true };
      saveProgress(client, progress);
      screenMap();
    } else screenRound();
  }

  // ---- reto sin referente ----
  function screenReto() {
    const m = retoIdx % 2 === 0 ? "longitud" : "capacidad";
    const r = genRound(m, 2, { showRef: false });
    r.tol = RETO_TOL;
    const M = MISSIONS[m];
    body.innerHTML = `
      ${badge(`Reto · ${retoIdx + 1} de ${RETO_ROUNDS} · sin referente · ±15 %`)}
      ${header(`¿Cuánto mide ${r.objeto}, en ${M.medida === "cm" ? "centímetros" : "litros"}?`, "Aquí no se pierden vidas, pero cada fallo va al repaso")}
      <div class="mdr-wrap" data-wrap>${drawObject(m, r.value, { showRef: false, label: "?" })}</div>
      ${keypadHtml()}
      <div class="feedback" data-feedback></div>`;
    bindKeypad((est) => {
      locked = true;
      const ok = accepts(r.value, est, r.tol);
      const u = unitsIn(m, r.value);
      body.querySelector("[data-wrap]").innerHTML = drawObject(m, r.value, { units: u.whole, showRef: true, label: `${r.value} ${M.medida}` });
      const txt = explainText(m, r.value, est);
      if (ok) { award(); feedback(`¡Dentro del margen! ${txt}`, true); } else { recordError(`estimar ${M.nombre.toLowerCase()}`, txt); feedback(`Fuera del margen. ${txt}`, false); }
      later(() => {
        locked = false;
        retoIdx++;
        if (retoIdx >= RETO_ROUNDS) { progress.misiones = { ...(progress.misiones || {}), reto: true }; screenResults(); } else screenReto();
      }, 2600);
    });
  }

  // ---- resultados y repaso ----
  function screenResults() {
    locked = false; // si se llegó aquí sin vidas, outcome() dejó locked = true y el repaso quedaría bloqueado
    const byType = {};
    errors.forEach((e) => { byType[e.tipo] = (byType[e.tipo] || 0) + 1; });
    progress = { misiones: progress.misiones || {}, fallosPorTipo: { ...(progress.fallosPorTipo || {}) }, partidas: (progress.partidas || 0) + 1 };
    Object.entries(byType).forEach(([t, v]) => { progress.fallosPorTipo[t] = (progress.fallosPorTipo[t] || 0) + v; });
    saveProgress(client, progress);
    const items = errors.length ? `<ul class="mdr-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>` : `<p class="mdr-progress">Sin fallos: tu palmo y tu botella ya están calibrados.</p>`;
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos`)}
      <div class="mdr-learned">Lo que has practicado: medir es contar cuántas veces cabe una unidad; con un referente que conoces bien (tu palmo, una botella) puedes estimar sin regla, y cuanto más lo usas más se estrecha tu margen.</div>
      ${items}
      <div class="mdr-actions">${errors.length ? '<button type="button" class="primary" data-review>Repasar lo fallado</button>' : ""}<button type="button" class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }
  function nextReview() {
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    mission = tipo.includes("capacidad") ? "capacidad" : "longitud";
    roundIdx = 1;
    screenRound(true);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "medidor", { score, rounds });
    const done = Object.keys(progress.misiones || {}).filter((k) => progress.misiones[k]).length;
    body.innerHTML = `
      <div class="end-card"><div>🖐️</div><div class="big-score">${score} pts</div><p>${rounds} aciertos · ${done} de 3 misiones superadas</p>
        <div class="end-actions"><button class="primary" data-retry>Jugar otra vez</button><button class="secondary" data-menu>Volver al menú</button></div></div>`;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives; score = 0; rounds = 0; finished = false; locked = false;
    mission = null; roundIdx = 0; retoIdx = 0; errors = []; reviewQueue = [];
    progress = loadProgress();
    renderLives(); renderScore();
    screenMap();
  }

  start();
  return () => { finished = true; timers.forEach(clearTimeout); };
}
