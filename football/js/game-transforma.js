// "Taller de transformaciones" — juego grande (escape room de 5 salas)
// sobre traslación, giro de 90° y reflexión en una cuadrícula 7×7. En
// cada sala hay que llevar una figura hasta su silueta objetivo
// encadenando transformaciones con un presupuesto de movimientos; la
// sala final invierte el reto (decir QUÉ transformación única convierte
// la figura en la silueta). Si se agota el presupuesto se enseña la
// secuencia solución: el fallo enseña. Progreso (salas abiertas) en
// localStorage + football_progress.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

export const SIZE = 7;
// Figuras quirales (su espejo no coincide con ningún giro), para que giro y
// reflexión sean siempre transformaciones distinguibles.
const SHAPES = [
  [[0, 0], [0, 1], [0, 2], [1, 2]], // L
  [[1, 0], [1, 1], [1, 2], [0, 2]], // J
  [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]], // P
];
const ROOMS = {
  1: { nombre: "Traslación", moves: ["up", "down", "left", "right"], seqLen: 2 },
  2: { nombre: "Giro", moves: ["up", "down", "left", "right", "rot"], seqLen: 3 },
  3: { nombre: "Espejo", moves: ["rot", "ref", "left", "right"], seqLen: 3 },
  4: { nombre: "Mezcla", moves: ["up", "down", "left", "right", "rot", "ref"], seqLen: 4 },
};
const ROUNDS = { 1: 2, 2: 2, 3: 2, 4: 2, 5: 3 };
export const MOVE_LABEL = { up: "↑", down: "↓", left: "←", right: "→", rot: "↻ giro 90°", ref: "⇋ espejo" };
const STORAGE_KEY = "football_transforma_progress";
const PLAYER_KEY = "football_player_id";

// ---------------- geometría pura ----------------

export const key = (cells) => cells.map(([x, y]) => `${x},${y}`).sort().join("|");
export function applyMove(cells, move) {
  const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[move];
  let out;
  if (d) out = cells.map(([x, y]) => [x + d[0], y + d[1]]);
  else if (move === "rot") out = cells.map(([x, y]) => [SIZE - 1 - y, x]);
  else out = cells.map(([x, y]) => [SIZE - 1 - x, y]);
  if (out.some(([x, y]) => x < 0 || y < 0 || x >= SIZE || y >= SIZE)) return null;
  return out;
}
function placeShape() {
  const shape = pick(SHAPES);
  const w = Math.max(...shape.map(([x]) => x)) + 1;
  const h = Math.max(...shape.map(([, y]) => y)) + 1;
  const ox = randInt(0, SIZE - w);
  const oy = randInt(0, SIZE - h);
  return shape.map(([x, y]) => [x + ox, y + oy]);
}
function isTranslation(a, b) {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const sb = [...b].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const dx = sb[0][0] - sa[0][0], dy = sb[0][1] - sa[0][1];
  return sa.every(([x, y], i) => sb[i][0] === x + dx && sb[i][1] === y + dy);
}

export function genRoom(room) {
  const cfg = ROOMS[room];
  for (let guard = 0; guard < 500; guard++) {
    const start = placeShape();
    let cur = start;
    const seq = [];
    let tries = 0;
    while (seq.length < cfg.seqLen && tries < 50) {
      tries++;
      const m = pick(cfg.moves);
      const next = applyMove(cur, m);
      if (!next) continue;
      seq.push(m);
      cur = next;
    }
    if (seq.length !== cfg.seqLen || key(cur) === key(start)) continue;
    return { room, start, target: cur, seq, budget: cfg.seqLen + 1, allowed: cfg.moves };
  }
  const start = [[1, 1], [1, 2], [1, 3], [2, 3]];
  return { room, start, target: applyMove(start, "right"), seq: ["right"], budget: 2, allowed: cfg.moves };
}

const KINDS = ["translation", "rot", "ref"];
export const KIND_LABEL = { translation: "Traslación", rot: "Giro de 90°", ref: "Espejo" };
export function genIdentify() {
  for (let guard = 0; guard < 500; guard++) {
    const start = placeShape();
    const kind = pick(KINDS);
    let target;
    if (kind === "translation") {
      const m = pick(["up", "down", "left", "right"]);
      const steps = randInt(1, 3);
      target = start;
      for (let i = 0; i < steps; i++) { const n = applyMove(target, m); if (!n) { target = null; break; } target = n; }
    } else target = applyMove(start, kind);
    if (!target || key(target) === key(start)) continue;
    const truths = { translation: isTranslation(start, target), rot: key(applyMove(start, "rot") || []) === key(target), ref: key(applyMove(start, "ref") || []) === key(target) };
    const count = KINDS.filter((k) => truths[k]).length;
    if (count !== 1 || !truths[kind]) continue;
    return { start, target, kind };
  }
  const start = [[1, 1], [1, 2], [1, 3], [2, 3]];
  return { start, target: applyMove(start, "right"), kind: "translation" };
}

// ---------------- dibujo ----------------

function gridSvg(cells, target, { size = 34, idAttr = "" } = {}) {
  const W = SIZE * size + 2;
  let out = "";
  const tk = new Set(target.map(([x, y]) => `${x},${y}`));
  const ck = new Set(cells.map(([x, y]) => `${x},${y}`));
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const k = `${x},${y}`;
    const cls = ck.has(k) && tk.has(k) ? "trf-cell trf-both" : ck.has(k) ? "trf-cell trf-fig" : tk.has(k) ? "trf-cell trf-target" : "trf-cell";
    out += `<rect x="${x * size + 1}" y="${y * size + 1}" width="${size - 2}" height="${size - 2}" rx="4" class="${cls}" data-x="${x}" data-y="${y}" />`;
  }
  out += `<line x1="${W / 2}" y1="0" x2="${W / 2}" y2="${W}" class="trf-axis" />`;
  return `<svg class="trf-grid" viewBox="0 0 ${W} ${W}" width="${W}" height="${W}" ${idAttr}>${out}</svg>`;
}

// ---------------- progreso ----------------

function loadProgress() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : { salaMax: 0, fallosPorTipo: {}, partidas: 0 }; }
  catch (_) { return { salaMax: 0, fallosPorTipo: {}, partidas: 0 }; }
}
function playerId() {
  try { let id = localStorage.getItem(PLAYER_KEY); if (!id) { id = `p_${Math.random().toString(36).slice(2, 10)}`; localStorage.setItem(PLAYER_KEY, id); } return id; }
  catch (_) { return "anon"; }
}
async function saveProgress(client, progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* sin almacenamiento */ }
  if (!client) return;
  try { await client.from("football_progress").upsert({ game: "transforma", player: playerId(), data: progress, updated_at: new Date().toISOString() }); } catch (_) { /* guinda */ }
}

// ---------------- juego ----------------

export function mountTransformaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let room = 0;
  let roundIdx = 0;
  let salaReached = 0;
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
  const badge = (t) => `<div class="trf-badge">${t}</div>`;
  const recordError = (tipo, explicacion) => errors.push({ tipo, explicacion });
  function loseLife(next) { lives--; renderLives(); if (lives <= 0) later(screenResults, 2800); else later(next, 2800); }
  function nextRound() {
    roundIdx++;
    if (roundIdx >= ROUNDS[room]) {
      salaReached = Math.max(salaReached, room);
      progress.salaMax = Math.max(progress.salaMax || 0, room);
      saveProgress(client, progress);
      roundIdx = 0;
      if (room >= 5) screenResults(); else screenMap();
    } else startRoom(room);
  }
  function startRoom(r) { room = r; if (r === 5) screenIdentify(); else screenRoom(); }

  function screenMap() {
    locked = false;
    const unlocked = Math.min((progress.salaMax || 0) + 1, 5);
    const names = { 1: "Traslación", 2: "Giro", 3: "Espejo", 4: "Mezcla", 5: "¿Cuál fue?" };
    const nodes = [1, 2, 3, 4, 5].map((r) => {
      const done = r <= (progress.salaMax || 0), open = r <= unlocked;
      return `<button type="button" class="trf-door ${done ? "trf-door-done" : ""}" data-room="${r}" ${open ? "" : "disabled"}><span class="trf-door-num">${done ? "🔓" : open ? "🚪" : "🔒"}</span><span class="trf-door-name">Sala ${r}<br>${names[r]}</span></button>`;
    }).join("");
    body.innerHTML = `
      ${header("Taller de transformaciones", "Cinco salas cerradas: abre cada una llevando la figura hasta su silueta")}
      <div class="trf-map">${nodes}</div>
      <p class="trf-progress">${progress.partidas ? `Partidas: ${progress.partidas}. Salas abiertas: ${progress.salaMax || 0} de 5.` : "Primera partida: la sala 1 está abierta."}</p>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-room]").forEach((b) => b.addEventListener("click", () => { roundIdx = 0; startRoom(Number(b.getAttribute("data-room"))); }));
  }

  function screenRoom(review = false) {
    const r = genRoom(review ? 4 : room);
    let cur = r.start;
    let used = 0;
    const cfg = ROOMS[r.room];
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Sala ${room} · ${cfg.nombre} · reto ${roundIdx + 1} de ${ROUNDS[room]}`)}
      ${header("Lleva la figura hasta la silueta punteada", `Tienes ${r.budget} movimientos. El giro es de 90° en sentido horario alrededor del centro; el espejo es respecto a la línea vertical central`)}
      <div class="trf-wrap" data-wrap>${gridSvg(cur, r.target)}</div>
      <div class="trf-counter">Movimientos: <b data-used>0</b> de ${r.budget}</div>
      <div class="trf-moves">${r.allowed.map((m) => `<button type="button" class="choice-btn trf-move" data-move="${m}">${MOVE_LABEL[m]}</button>`).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    const draw = () => { body.querySelector("[data-wrap]").innerHTML = gridSvg(cur, r.target); body.querySelector("[data-used]").textContent = String(used); };
    const solutionText = `Una solución: ${r.seq.map((m) => MOVE_LABEL[m]).join(", ")}.`;
    body.querySelectorAll("[data-move]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      const next = applyMove(cur, btn.getAttribute("data-move"));
      if (!next) { feedback("Ese movimiento saca la figura de la cuadrícula.", false); return; }
      cur = next; used++; draw();
      if (key(cur) === key(r.target)) {
        locked = true; award();
        feedback(`¡Sala abierta en ${used} movimiento${used > 1 ? "s" : ""}! ${solutionText}`, true);
        later(() => { locked = false; review ? nextReview() : nextRound(); }, 2200);
      } else if (used >= r.budget) {
        locked = true;
        body.querySelector("[data-wrap]").innerHTML = gridSvg(r.target, r.target);
        if (review) { feedback(`Sin movimientos. ${solutionText} Otra vez.`, false); later(() => { locked = false; screenRoom(true); }, 2800); }
        else { recordError("encadenar transformaciones", `Sala ${room}: ${solutionText}`); feedback(`Sin movimientos. ${solutionText}`, false); loseLife(() => { locked = false; nextRound(); }); }
      } else feedback(`Quedan ${r.budget - used}.`, true);
    }));
  }

  function screenIdentify(review = false) {
    const r = genIdentify();
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Sala 5 · ¿Cuál fue? · ${roundIdx + 1} de ${ROUNDS[5]}`)}
      ${header("Una sola transformación convierte la figura en la silueta. ¿Cuál?", "Giro de 90° horario alrededor del centro, espejo respecto a la línea central, o traslación")}
      <div class="trf-wrap">${gridSvg(r.start, r.target, { size: 30 })}</div>
      <div class="trf-moves">${KINDS.map((k) => `<button type="button" class="choice-btn trf-kind" data-kind="${k}">${KIND_LABEL[k]}</button>`).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-kind]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      locked = true;
      const k = btn.getAttribute("data-kind");
      const ok = k === r.kind;
      body.querySelectorAll("[data-kind]").forEach((x) => (x.disabled = true));
      btn.classList.add(ok ? "correct" : "wrong");
      const why = r.kind === "translation" ? "la figura se desplaza sin girar ni voltearse" : r.kind === "rot" ? "la figura queda girada 90° (fíjate en hacia dónde apunta el 'pie')" : "la figura queda volteada como en un espejo: lo que estaba a la izquierda pasa a la derecha";
      if (ok) { award(); feedback(`¡Correcto! Es ${KIND_LABEL[r.kind].toLowerCase()}: ${why}.`, true); later(() => { locked = false; review ? nextReview() : nextRound(); }, 2200); }
      else if (review) { feedback(`No: es ${KIND_LABEL[r.kind].toLowerCase()}, ${why}.`, false); later(() => { locked = false; screenIdentify(true); }, 2600); }
      else { recordError("identificar la transformación", `Era ${KIND_LABEL[r.kind].toLowerCase()}: ${why}.`); feedback(`No es correcto. Es ${KIND_LABEL[r.kind].toLowerCase()}: ${why}.`, false); loseLife(() => { locked = false; nextRound(); }); }
    }));
  }

  function screenResults() {
    const byType = {};
    errors.forEach((e) => { byType[e.tipo] = (byType[e.tipo] || 0) + 1; });
    progress = { salaMax: Math.max(progress.salaMax || 0, salaReached), fallosPorTipo: { ...(progress.fallosPorTipo || {}) }, partidas: (progress.partidas || 0) + 1 };
    Object.entries(byType).forEach(([t, v]) => { progress.fallosPorTipo[t] = (progress.fallosPorTipo[t] || 0) + v; });
    saveProgress(client, progress);
    const items = errors.length ? `<ul class="trf-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>` : `<p class="trf-progress">Sin fallos: todas las salas abiertas a la primera.</p>`;
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos · salas abiertas ${Math.max(salaReached, progress.salaMax || 0)} de 5`)}
      <div class="trf-learned">Trasladar mueve sin cambiar la orientación; girar 90° cambia hacia dónde apunta la figura; el espejo la voltea (y ningún giro puede deshacer un espejo de una figura así). Encadenarlas es componer transformaciones.</div>
      ${items}
      <div class="trf-moves">${errors.length ? '<button type="button" class="primary" data-review>Repasar lo fallado</button>' : ""}<button type="button" class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }
  function nextReview() {
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    if (tipo === "identificar la transformación") screenIdentify(true); else screenRoom(true);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "transforma", { score, rounds });
    body.innerHTML = `
      <div class="end-card"><div>🗝️</div><div class="big-score">${score} pts</div><p>${rounds} aciertos · salas abiertas ${Math.max(salaReached, progress.salaMax || 0)} de 5</p>
        <div class="end-actions"><button class="primary" data-retry>Jugar otra vez</button><button class="secondary" data-menu>Volver al menú</button></div></div>`;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives; score = 0; rounds = 0; finished = false; locked = false;
    room = 0; roundIdx = 0; salaReached = 0; errors = []; reviewQueue = [];
    progress = loadProgress();
    renderLives(); renderScore();
    screenMap();
  }

  start();
  return () => { finished = true; timers.forEach(clearTimeout); };
}
