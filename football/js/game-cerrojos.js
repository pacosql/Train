// "Cerrojos de restos" — juego grande (por salas) sobre aritmética modular:
// un dial circular de m posiciones y llaves "+a". Pulsar la llave mueve la
// aguja a saltos; contar las vueltas ES calcular el resto. Con +4 en un dial
// de 12 la aguja solo pisa 0, 4, 8: la órbita son los múltiplos de mcd(a, m).
// Salas: 1) el dial (k·a mod m e inversa), 2) la llave que no entra (mcd),
// 3) la puerta de las cifras (criterios de divisibilidad, con el dial de 9 y
// el de 10), 4) la caja fuerte (restos combinados, teorema chino del resto).
// Progreso persistente (localStorage + football_progress).
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const ROUNDS = { 1: 3, 2: 3, 3: 3, 4: 3 };
const LEVEL_NAMES = { 1: "El dial", 2: "La llave que no entra", 3: "La puerta de las cifras", 4: "La caja fuerte" };
const STORAGE_KEY = "football_cerrojos_progress";
const PLAYER_KEY = "football_player_id";
export const DIALS = [7, 8, 9, 10, 11, 12];
export const LOCKS = [2, 3, 5, 9, 10];
export const CAJA_PARES = [[3, 4], [3, 5], [4, 5], [3, 7], [5, 6]];
const STEP_MS = 230;

// ---------------- aritmética pura ----------------

export function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; }
// Posiciones que pisa la aguja partiendo de 0 con saltos de +a en un dial de m (ordenadas).
export function orbit(a, m) { const seen = new Set(); let p = 0; while (!seen.has(p)) { seen.add(p); p = (p + a) % m; } return [...seen].sort((x, y) => x - y); }
// Mínimo k ≥ 1 con k·a ≡ t (mod m), o −1 si no existe.
export function minPushes(a, m, t) { let p = 0; for (let k = 1; k <= m; k++) { p = (p + a) % m; if (p === t) return k; } return -1; }
const listSpan = (arr) => arr.join(", ");

// Sala 1: "avance" (k pulsaciones de +a: ¿dónde queda?) e "inverso" (¿cuántas pulsaciones para llegar a t?, con mcd(a, m) = 1).
export function genDialRound(kind) {
  const m = pick(DIALS);
  if (kind === "avance") {
    const a = randInt(2, m - 1);
    const k = randInt(Math.max(2, Math.ceil(m / a)), 9); // siempre al menos una vuelta completa
    const total = k * a;
    return { kind, m, a, k, total, vueltas: Math.floor(total / m), answer: total % m };
  }
  const coprimos = []; for (let a = 2; a < m; a++) if (gcd(a, m) === 1) coprimos.push(a);
  const a = pick(coprimos);
  let t = randInt(1, m - 1); if (t === a) t = t === m - 1 ? 1 : t + 1; // que no baste con una pulsación
  const answer = minPushes(a, m, t);
  return { kind, m, a, t, answer, total: answer * a, vueltas: Math.floor((answer * a) / m) };
}

// Sala 2: dial m, cerradura en t ≠ 0, cuatro llaves; exactamente una llega (mcd(a, m) | t) y las otras tres no (mcd > 1).
export function genLlaveRound() {
  let guard = 0;
  while (guard++ < 5000) {
    const m = pick([8, 10, 12]); // con 9 solo bloquean +3 y +6: no salen tres llaves que no entren
    const t = randInt(1, m - 1);
    const reach = [], block = [];
    for (let a = 2; a < m; a++) (t % gcd(a, m) === 0 ? reach : block).push(a);
    const reachOk = reach.filter((a) => a !== t); // que la llave buena no llegue en una sola pulsación
    if (reachOk.length < 1 || block.length < 3) continue;
    const answer = pick(reachOk);
    const keys = shuffle([answer, ...shuffle(block).slice(0, 3)]);
    return { m, t, keys, answer, pushes: minPushes(answer, m, t) };
  }
  return { m: 12, t: 3, keys: [4, 5, 6, 8], answer: 5, pushes: 3 };
}

// Sala 3: número de 3-4 cifras; abren los candados {2, 3, 5, 9, 10} que lo dividen (entre 1 y 3 de ellos).
export function genCifrasRound() {
  let guard = 0;
  while (guard++ < 5000) {
    const n = randInt(100, 9999);
    const opens = LOCKS.filter((d) => n % d === 0);
    if (opens.length < 1 || opens.length > 3) continue;
    const digits = String(n).split("").map(Number);
    return { n, opens, digits, sum: digits.reduce((s, d) => s + d, 0), last: n % 10 };
  }
  return { n: 126, opens: [2, 3, 9], digits: [1, 2, 6], sum: 9, last: 6 };
}

// Sala 4: número secreto x en 1..m1·m2 dado por sus restos en dos diales coprimos (solución única, recalculada por fuerza bruta).
export function genCajaRound() {
  let guard = 0;
  while (guard++ < 5000) {
    const [m1, m2] = pick(CAJA_PARES);
    const M = m1 * m2;
    const x = randInt(1, M);
    const r1 = x % m1, r2 = x % m2;
    const sols = []; for (let c = 1; c <= M; c++) if (c % m1 === r1 && c % m2 === r2) sols.push(c);
    if (sols.length !== 1 || sols[0] !== x) continue;
    return { m1, m2, M, r1, r2, answer: x };
  }
  return { m1: 3, m2: 4, M: 12, r1: 2, r2: 3, answer: 11 };
}

// ---------------- dibujo del dial ----------------

export function dialSvg({ m, pos = 0, trail = [], lit = [], target = null, tap = false, size = 220 }) {
  const c = size / 2, rPos = c - 20, rNeedle = c - 40;
  const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / m;
  let out = `<circle cx="${c}" cy="${c}" r="${c - 3}" class="crj-ring" />`;
  for (let i = 0; i < m; i++) {
    const x = (c + rPos * Math.cos(ang(i))).toFixed(1), y = c + rPos * Math.sin(ang(i));
    const cls = ["crj-pos", trail.includes(i) ? "crj-pos-hit" : "", lit.includes(i) ? "crj-pos-orbit" : "", target === i ? "crj-pos-target" : "", tap ? "crj-tap" : ""].filter(Boolean).join(" ");
    out += `<g class="${cls}"${tap ? ` data-pos="${i}"` : ""}><circle cx="${x}" cy="${y.toFixed(1)}" r="${size > 180 ? 13 : 11}" /><text x="${x}" y="${(y + 4.5).toFixed(1)}">${i}</text></g>`;
  }
  const nx = (c + rNeedle * Math.cos(ang(pos))).toFixed(1), ny = (c + rNeedle * Math.sin(ang(pos))).toFixed(1);
  out += `<line x1="${c}" y1="${c}" x2="${nx}" y2="${ny}" class="crj-needle" /><circle cx="${c}" cy="${c}" r="5" class="crj-hub" />`;
  return `<svg class="crj-svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" data-dial data-m="${m}">${out}</svg>`;
}

// ---------------- progreso ----------------

const emptyProgress = () => ({ nivelMax: 0, fallosPorTipo: {}, partidas: 0, mejorTiempo: 0 });
function loadProgress() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? { ...emptyProgress(), ...JSON.parse(raw) } : emptyProgress(); }
  catch (_) { return emptyProgress(); }
}
function playerId() {
  try { let id = localStorage.getItem(PLAYER_KEY); if (!id) { id = `p_${Math.random().toString(36).slice(2, 10)}`; localStorage.setItem(PLAYER_KEY, id); } return id; }
  catch (_) { return "anon"; }
}
async function saveProgress(client, progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* sin almacenamiento */ }
  if (!client) return;
  try { await client.from("football_progress").upsert({ game: "cerrojos", player: playerId(), data: progress, updated_at: new Date().toISOString() }); } catch (_) { /* guinda */ }
}

// ---------------- juego ----------------

export function mountCerrojosGame(container, { client, onExit }) {
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
  let retoStart = 0;
  let retoHits = 0;
  let retoTime = 0;
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
  const badge = (t) => `<div class="crj-badge">${t}</div>`;
  const recordError = (tipo, explicacion) => errors.push({ tipo, explicacion });
  const setFormula = (t) => { const el = body.querySelector("[data-formula]"); if (el) el.innerHTML = t; };
  function loseLife(next, delay = 0) { lives--; renderLives(); if (lives <= 0) later(screenResults, 2800 + delay); else later(next, 2800 + delay); }
  function nextRound() {
    roundIdx++;
    if (roundIdx >= ROUNDS[level]) {
      levelReached = Math.max(levelReached, level);
      progress.nivelMax = Math.max(progress.nivelMax || 0, level);
      if (level === 4) { retoTime = Math.round((Date.now() - retoStart) / 1000); if (retoHits === ROUNDS[4] && (!progress.mejorTiempo || retoTime < progress.mejorTiempo)) progress.mejorTiempo = retoTime; }
      saveProgress(client, progress);
      roundIdx = 0;
      if (level >= 4) screenResults(); else screenMap();
      return;
    }
    startLevel(level);
  }
  function startLevel(l) { level = l; ({ 1: () => screenDial(), 2: () => screenLlave(), 3: () => screenCifras(), 4: () => screenCaja() })[l](); }
  function outcome(ok, tipo, expl, review, retry, delay = 0) {
    locked = true;
    if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : nextRound(); }, 2200 + delay); }
    else if (review) { feedback(`No: ${expl} Otra vez.`, false); later(() => { locked = false; retry(); }, 2800 + delay); }
    else { recordError(tipo, expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; nextRound(); }, delay); }
  }
  // Anima la aguja saltando +a en el dial [data-wrap]; deja rastro si se pide. Llama a done() al terminar.
  function animateNeedle({ m, a, steps, trail = true, lit = [], target = null, tap = false, done }) {
    let i = 0, pos = 0; const hits = [0];
    const draw = () => { const w = body.querySelector("[data-wrap]"); if (w) w.innerHTML = dialSvg({ m, pos, trail: trail ? hits : [], lit, target, tap }); };
    const tick = () => { i++; pos = (pos + a) % m; hits.push(pos); draw(); setFormula(`${i}×(+${a}) = ${i * a} = ${Math.floor((i * a) / m)} ${Math.floor((i * a) / m) === 1 ? "vuelta" : "vueltas"} + <b>${pos}</b>`); if (i < steps) later(tick, STEP_MS); else if (done) done(); };
    draw();
    if (steps > 0) later(tick, STEP_MS); else if (done) done();
    return steps * STEP_MS;
  }
  const wheelHtml = (n) => `<div class="crj-wheel">${Array.from({ length: n }, (_, i) => `<button type="button" class="choice-btn crj-num" data-num="${i + 1}">${i + 1}</button>`).join("")}</div>`;

  // ---- mapa ----
  function screenMap() {
    locked = false;
    const unlocked = Math.min((progress.nivelMax || 0) + 1, 4);
    const nodes = [1, 2, 3, 4].map((l) => { const done = l <= (progress.nivelMax || 0), open = l <= unlocked; return `<button type="button" class="crj-node ${done ? "crj-node-done" : ""}" data-level="${l}" ${open ? "" : "disabled"}><span class="crj-node-num">${done ? "✓" : l}</span><span class="crj-node-name">${LEVEL_NAMES[l]}</span></button>`; }).join("");
    body.innerHTML = `
      ${header("Cerrojos de restos", "Cada llave +a hace saltar la aguja del dial; contar vueltas es calcular el resto")}
      <div class="crj-map">${nodes}</div>
      <div class="crj-actions"><button type="button" class="secondary" data-tutorial>Cómo gira el dial (tutorial)</button></div>
      <p class="crj-progress">${progress.partidas ? `Partidas: ${progress.partidas}. Salas abiertas: ${progress.nivelMax || 0} de 4.${progress.mejorTiempo ? ` Mejor escape: ${progress.mejorTiempo} s.` : ""}` : "Primera vez: mira el tutorial y empieza por la sala 1."}</p>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-level]").forEach((b) => b.addEventListener("click", () => { roundIdx = 0; startLevel(Number(b.getAttribute("data-level"))); }));
    body.querySelector("[data-tutorial]").addEventListener("click", screenTutorial);
  }

  // ---- tutorial: dial de 12 con la llave +5 ----
  function screenTutorial() {
    const m = 12, a = 5, pushes = 3, ask = 5;
    let pos = 0, n = 0; const hits = [0];
    body.innerHTML = `
      ${badge("Tutorial · cómo gira el dial")}
      ${header(`Dial de <b>${m}</b> posiciones y una sola llave: <b>+${a}</b>`, `Pulsa la llave ${pushes} veces y mira dónde cae la aguja`)}
      <div class="crj-dial-wrap" data-wrap>${dialSvg({ m, pos, trail: hits })}</div>
      <div class="crj-formula" data-formula>0 pulsaciones: la aguja está en 0</div>
      <div class="crj-keys"><button type="button" class="choice-btn crj-key" data-push="${a}">+${a}</button></div>
      <div class="crj-actions" data-actions></div>
      <div class="feedback" data-feedback></div>`;
    body.querySelector("[data-push]").addEventListener("click", () => {
      if (locked || finished || n >= pushes) return;
      n++; pos = (pos + a) % m; hits.push(pos);
      body.querySelector("[data-wrap]").innerHTML = dialSvg({ m, pos, trail: hits });
      const v = Math.floor((n * a) / m);
      setFormula(`${n}×(+${a}) = ${n * a} = ${v ? `${v} ${v === 1 ? "vuelta" : "vueltas"} (${v * m}) + ` : ""}<b>${pos}</b>`);
      if (n < pushes) feedback(n * a < m ? `La aguja avanza ${a}: va por ${pos}.` : `${n * a} se pasa de ${m}: da ${v} vuelta y sobran ${pos}. Ese "sobrante" es el resto de ${n * a} entre ${m}.`, true);
      else {
        body.querySelector("[data-push]").disabled = true;
        feedback(`${n * a} = ${v}·${m} + ${pos}: cada vuelta completa son ${m} y lo que sobra es donde para la aguja.`, true);
        body.querySelector(".prompt").innerHTML = `¿Dónde caerá la aguja tras <b>${ask}</b> pulsaciones en total?<small>Toca la posición del dial. Pista: ${ask}×${a} = ${ask * a}, ¿cuántas vueltas de ${m} caben?</small>`;
        body.querySelector("[data-wrap]").innerHTML = dialSvg({ m, pos, trail: hits, tap: true });
        body.querySelectorAll("[data-pos]").forEach((g) => g.addEventListener("click", () => {
          if (locked || finished) return;
          const p = Number(g.getAttribute("data-pos"));
          if (p !== (ask * a) % m) { feedback(`En ${p} no: ${ask * a} = ${Math.floor((ask * a) / m)}·${m} + ${(ask * a) % m}. Quita las vueltas completas y mira lo que sobra.`, false); return; }
          locked = true;
          animateNeedle({ m, a, steps: ask, done: () => {
            award();
            feedback(`Eso es: ${ask * a} = ${Math.floor((ask * a) / m)} vueltas + ${(ask * a) % m}. Contar vueltas es dividir; lo que sobra es el resto.`, true);
            body.querySelector("[data-actions]").innerHTML = `<button type="button" class="primary" data-next>A la sala 1 →</button>`;
            body.querySelector("[data-next]").addEventListener("click", () => { locked = false; roundIdx = 0; startLevel(1); }, { once: true });
          } });
        }));
      }
    });
  }

  // ---- sala 1: el dial (avance e inversa) ----
  function screenDial(review = false, kindForced = null) {
    const kind = kindForced || (roundIdx % 2 === 0 ? "avance" : "inverso");
    const r = genDialRound(kind);
    const scaffold = !review && roundIdx === 0;
    const tipo = kind === "avance" ? "avanzar el dial" : "invertir el dial";
    const retry = () => screenDial(true, kind);
    if (kind === "avance") {
      body.innerHTML = `
        ${review ? badge("Repaso") : badge(`Sala 1 · ${LEVEL_NAMES[1]} · ${roundIdx + 1} de ${ROUNDS[1]}`)}
        ${header(`Dial de <b>${r.m}</b>. Pulsas <b>${r.k}</b> veces la llave <b>+${r.a}</b> desde el 0. ¿Dónde queda la aguja?`, `Toca la posición. ${scaffold ? "En esta primera ronda verás el rastro al responder." : "Sin rastro: cuenta las vueltas completas de " + r.m + "."}`)}
        <div class="crj-dial-wrap" data-wrap>${dialSvg({ m: r.m, pos: 0, tap: true })}</div>
        <div class="crj-formula" data-formula>${r.k}×(+${r.a}) = ${r.total}</div>
        <div class="feedback" data-feedback></div>`;
      body.querySelectorAll("[data-pos]").forEach((g) => g.addEventListener("click", () => {
        if (locked || finished) return;
        locked = true;
        const p = Number(g.getAttribute("data-pos")); const ok = p === r.answer;
        const expl = `pulsaste ${r.k}×(+${r.a}): ${r.total} = ${r.vueltas}·${r.m} + ${r.answer}, la aguja queda en ${r.answer}${ok ? "" : `, no en ${p}`}.`;
        if (scaffold) { const ms = animateNeedle({ m: r.m, a: r.a, steps: r.k, target: p }); outcome(ok, tipo, expl, review, retry, ms); }
        else { body.querySelector("[data-wrap]").innerHTML = dialSvg({ m: r.m, pos: r.answer, trail: [r.answer], target: p }); setFormula(`${r.k}×(+${r.a}) = ${r.total} = ${r.vueltas}·${r.m} + <b>${r.answer}</b>`); outcome(ok, tipo, expl, review, retry); }
      }));
      return;
    }
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Sala 1 · ${LEVEL_NAMES[1]} · ${roundIdx + 1} de ${ROUNDS[1]}`)}
      ${header(`Dial de <b>${r.m}</b>. La aguja está en 0 y la llave es <b>+${r.a}</b>. ¿Cuántas pulsaciones, como mínimo, para llegar a <b>${r.t}</b>?`, "Elige el número. Busca el múltiplo de la llave que, quitando vueltas completas, deja justo ese resto")}
      <div class="crj-dial-wrap" data-wrap>${dialSvg({ m: r.m, pos: 0, target: r.t })}</div>
      <div class="crj-formula" data-formula>¿k×(+${r.a}) = vueltas·${r.m} + ${r.t}?</div>
      ${wheelHtml(r.m)}
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-num]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      locked = true;
      const k = Number(btn.getAttribute("data-num")); const ok = k === r.answer;
      body.querySelectorAll("[data-num]").forEach((x) => (x.disabled = true)); btn.classList.add(ok ? "correct" : "wrong");
      const landed = (k * r.a) % r.m;
      const expl = `${r.answer}×(+${r.a}) = ${r.total} = ${r.vueltas}·${r.m} + ${r.t}: hacen falta ${r.answer} pulsaciones${ok ? "" : ` (con ${k}: ${k * r.a} = ${Math.floor((k * r.a) / r.m)}·${r.m} + ${landed}, la aguja cae en ${landed})`}.`;
      const ms = animateNeedle({ m: r.m, a: r.a, steps: scaffold ? r.answer : 0, target: r.t });
      if (!scaffold) { body.querySelector("[data-wrap]").innerHTML = dialSvg({ m: r.m, pos: r.t, trail: [r.t], target: r.t }); setFormula(`${r.answer}×(+${r.a}) = ${r.total} = ${r.vueltas}·${r.m} + <b>${r.t}</b>`); }
      outcome(ok, tipo, expl, review, retry, ms);
    }));
  }

  // ---- sala 2: la llave que no entra ----
  function screenLlave(review = false) {
    const r = genLlaveRound();
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Sala 2 · ${LEVEL_NAMES[2]} · ${roundIdx + 1} de ${ROUNDS[2]}`)}
      ${header(`Dial de <b>${r.m}</b>. La aguja está en 0 y la cerradura está en <b>${r.t}</b>. ¿Qué llave llega?`, "Solo una de las cuatro llaves pisa esa posición; las demás dan vueltas sin tocarla")}
      <div class="crj-dial-wrap" data-wrap>${dialSvg({ m: r.m, pos: 0, target: r.t })}</div>
      <div class="crj-formula" data-formula>Una llave +a solo pisa los múltiplos de mcd(a, ${r.m})</div>
      <div class="crj-keys">${r.keys.map((a) => `<button type="button" class="choice-btn crj-key" data-key="${a}">+${a}</button>`).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-key]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      locked = true;
      const a = Number(btn.getAttribute("data-key")); const ok = a === r.answer;
      body.querySelectorAll("[data-key]").forEach((x) => (x.disabled = true)); btn.classList.add(ok ? "correct" : "wrong");
      const g = gcd(a, r.m), orb = orbit(a, r.m);
      const expl = ok
        ? `mcd(${a}, ${r.m}) = ${g} y ${g} divide a ${r.t}: la llave +${a} llega en ${r.pushes} pulsaciones (${r.pushes}×${a} = ${r.pushes * a} = ${Math.floor((r.pushes * a) / r.m)}·${r.m} + ${r.t}).`
        : `la llave +${a} en el dial de ${r.m} solo pisa ${listSpan(orb)}: mcd(${a}, ${r.m}) = ${g} no divide a ${r.t}. La que llega es +${r.answer} (mcd(${r.answer}, ${r.m}) = ${gcd(r.answer, r.m)}).`;
      const ms = animateNeedle({ m: r.m, a, steps: ok ? r.pushes : r.m / g, lit: ok ? [] : orb, target: r.t });
      outcome(ok, "la llave que no entra", expl, review, () => screenLlave(true), ms);
    }));
  }

  // ---- sala 3: la puerta de las cifras ----
  function screenCifras(review = false) {
    const r = genCifrasRound();
    const scaffold = !review && roundIdx === 0;
    const selected = new Set();
    const parts = []; let acc = 0; r.digits.forEach((d) => { acc = (acc + d) % 9; parts.push(acc); });
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Sala 3 · ${LEVEL_NAMES[3]} · ${roundIdx + 1} de ${ROUNDS[3]}`)}
      ${header(`¿Qué candados abre el número <b>${r.n}</b>?`, "Marca exactamente los candados cuyo número divide al tuyo y pulsa Comprobar")}
      ${scaffold ? `<div class="crj-dials"><div class="crj-dial-box"><div class="crj-dial-label">Dial de 9: cada cifra avanza lo que vale (10 ≡ 1)</div><div data-wrap9>${dialSvg({ m: 9, pos: 0, trail: [0], size: 140 })}</div></div><div class="crj-dial-box"><div class="crj-dial-label">Dial de 10: solo cuenta la última cifra</div><div data-wrap10>${dialSvg({ m: 10, pos: r.last, trail: [r.last], size: 140 })}</div></div></div><div class="crj-formula" data-formula>Cifras: ${r.digits.join(" + ")} = ${r.sum}</div>` : ""}
      <div class="crj-locks">${LOCKS.map((d) => `<button type="button" class="choice-btn crj-lock" data-lock="${d}" aria-pressed="false">🔒 ${d}</button>`).join("")}</div>
      <div class="crj-actions"><button type="button" class="primary" data-check>Comprobar</button></div>
      <div class="feedback" data-feedback></div>`;
    if (scaffold) {
      let i = 0;
      const tick = () => { const w = body.querySelector("[data-wrap9]"); if (!w) return; w.innerHTML = dialSvg({ m: 9, pos: parts[i], trail: [0, ...parts.slice(0, i + 1)], size: 140 }); setFormula(`Dial de 9: ${r.digits.slice(0, i + 1).join(" + ")} = ${r.digits.slice(0, i + 1).reduce((s, d) => s + d, 0)} → aguja en <b>${parts[i]}</b>${i === r.digits.length - 1 ? ` · resto de ${r.n} entre 9 es ${r.n % 9}` : ""}`); i++; if (i < parts.length) later(tick, 650); };
      later(tick, 500);
    }
    body.querySelectorAll("[data-lock]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      const d = Number(btn.getAttribute("data-lock"));
      if (selected.has(d)) selected.delete(d); else selected.add(d);
      btn.classList.toggle("crj-lock-on", selected.has(d)); btn.setAttribute("aria-pressed", String(selected.has(d))); btn.textContent = `${selected.has(d) ? "🔓" : "🔒"} ${d}`;
    }));
    body.querySelector("[data-check]").addEventListener("click", () => {
      if (locked || finished) return;
      locked = true;
      const chosen = [...selected].sort((x, y) => x - y);
      const ok = chosen.length === r.opens.length && chosen.every((d, i) => d === r.opens[i]);
      body.querySelectorAll("[data-lock]").forEach((b) => { const d = Number(b.getAttribute("data-lock")); b.disabled = true; if (r.opens.includes(d)) b.classList.add(selected.has(d) ? "correct" : "wrong"); else if (selected.has(d)) b.classList.add("wrong"); });
      const reasons = [
        `${r.digits.join("+")} = ${r.sum} → ${r.sum % 9 === 0 ? "múltiplo de 9 (y de 3)" : r.sum % 3 === 0 ? "múltiplo de 3 pero no de 9" : "ni de 3 ni de 9"}`,
        `termina en ${r.last} → ${r.last % 2 === 0 ? "par" : "impar"}${r.last === 0 ? ", múltiplo de 5 y de 10" : r.last === 5 ? ", múltiplo de 5 pero no de 10" : ", ni de 5 ni de 10"}`,
      ];
      const expl = `${r.n} abre ${listSpan(r.opens)}: ${reasons.join("; ")}${ok ? "" : ` (marcaste ${chosen.length ? listSpan(chosen) : "ninguno"})`}.`;
      outcome(ok, "criterios de divisibilidad", expl, review, () => screenCifras(true));
    });
  }

  // ---- sala 4: la caja fuerte (reto sin vidas, cronómetro de escape) ----
  function screenCaja(review = false) {
    const r = genCajaRound();
    if (!review && roundIdx === 0) { retoStart = Date.now(); retoHits = 0; }
    const canTry = !review && roundIdx < 2;
    let tries = 3, typed = "";
    const dials = (p1, p2, t1, t2) => `<div class="crj-dials"><div class="crj-dial-box"><div class="crj-dial-label">Dial de ${r.m1}</div>${dialSvg({ m: r.m1, pos: p1, trail: t1, target: r.r1, size: 140 })}</div><div class="crj-dial-box"><div class="crj-dial-label">Dial de ${r.m2}</div>${dialSvg({ m: r.m2, pos: p2, trail: t2, target: r.r2, size: 140 })}</div></div>`;
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Reto · ${LEVEL_NAMES[4]} · ${roundIdx + 1} de ${ROUNDS[4]}`)}
      ${review ? "" : `<div class="crj-timer">⏱ <span data-timer>0</span> s de escape</div>`}
      ${header(`El número secreto está entre 1 y <b>${r.M}</b>. En el dial de <b>${r.m1}</b> cae en <b>${r.r1}</b> y en el dial de <b>${r.m2}</b> cae en <b>${r.r2}</b>. ¿Cuál es?`, canTry ? "Aquí no se pierden vidas. Puedes probar hasta 3 candidatos en los diales antes de abrir" : "Aquí no se pierden vidas. A ciegas: escribe el número y abre")}
      <div data-wrap>${dials(r.r1, r.r2, [], [])}</div>
      <div class="crj-display" data-display>_</div>
      <div class="crj-keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => `<button type="button" class="choice-btn crj-num" data-num="${d}">${d}</button>`).join("")}<button type="button" class="choice-btn crj-num crj-num-del" data-del>⌫</button></div>
      <div class="crj-actions">${canTry ? `<button type="button" class="secondary" data-try>Probar en los diales (<span data-tries>3</span>)</button>` : ""}<button type="button" class="primary" data-ok>Abrir</button></div>
      <div class="feedback" data-feedback></div>`;
    const show = () => { body.querySelector("[data-display]").textContent = typed || "_"; };
    body.querySelectorAll("[data-num]").forEach((b) => b.addEventListener("click", () => { if (locked || finished || typed.length >= 2) return; typed += b.getAttribute("data-num"); show(); }));
    body.querySelector("[data-del]").addEventListener("click", () => { if (locked || finished) return; typed = typed.slice(0, -1); show(); });
    if (!review) { const tick = () => { const t = body.querySelector("[data-timer]"); if (!t) return; t.textContent = String(Math.round((Date.now() - retoStart) / 1000)); later(tick, 1000); }; later(tick, 1000); }
    const tryBtn = body.querySelector("[data-try]");
    if (tryBtn) tryBtn.addEventListener("click", () => {
      if (locked || finished || tries <= 0) return;
      const v = Number(typed); if (!typed || v < 1 || v > r.M) { feedback(`Escribe un número entre 1 y ${r.M}.`, false); return; }
      tries--; body.querySelector("[data-tries]").textContent = String(tries); if (tries === 0) tryBtn.disabled = true;
      const p1 = v % r.m1, p2 = v % r.m2;
      body.querySelector("[data-wrap]").innerHTML = dials(p1, p2, [p1], [p2]);
      feedback(`${v}: en el dial de ${r.m1} cae en ${p1} ${p1 === r.r1 ? "✔" : `✘ (debía ser ${r.r1})`}; en el de ${r.m2} cae en ${p2} ${p2 === r.r2 ? "✔" : `✘ (debía ser ${r.r2})`}.`, p1 === r.r1 && p2 === r.r2);
    });
    body.querySelector("[data-ok]").addEventListener("click", () => {
      if (locked || finished) return;
      const v = Number(typed); if (!typed) { feedback("Escribe un número.", false); return; }
      locked = true;
      const ok = v === r.answer;
      body.querySelector("[data-wrap]").innerHTML = dials(r.answer % r.m1, r.answer % r.m2, [r.answer % r.m1], [r.answer % r.m2]);
      const expl = `${r.answer} = ${Math.floor(r.answer / r.m1)}·${r.m1} + ${r.r1} y ${r.answer} = ${Math.floor(r.answer / r.m2)}·${r.m2} + ${r.r2}; entre 1 y ${r.M} solo ${r.answer} cumple los dos restos${ok ? "" : ` (${v} cae en ${v % r.m1} y ${v % r.m2})`}.`;
      if (review) { outcome(ok, "la caja fuerte", expl, true, () => screenCaja(true)); return; }
      if (ok) { award(); retoHits++; feedback(`¡Abierta! ${expl}`, true); }
      else { recordError("la caja fuerte", `Dijiste ${v}; ${expl}`); feedback(`No: ${expl}`, false); }
      later(() => { locked = false; nextRound(); }, 3200);
    });
  }

  // ---- resultados y repaso ----
  function screenResults() {
    locked = false; // si se llegó aquí sin vidas, outcome() dejó locked = true y el repaso quedaría bloqueado
    const byType = {};
    errors.forEach((e) => { byType[e.tipo] = (byType[e.tipo] || 0) + 1; });
    progress = { nivelMax: Math.max(progress.nivelMax || 0, levelReached), fallosPorTipo: { ...(progress.fallosPorTipo || {}) }, partidas: (progress.partidas || 0) + 1, mejorTiempo: progress.mejorTiempo || 0 };
    Object.entries(byType).forEach(([t, v]) => { progress.fallosPorTipo[t] = (progress.fallosPorTipo[t] || 0) + v; });
    saveProgress(client, progress);
    const items = errors.length ? `<ul class="crj-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>` : `<p class="crj-progress">Sin fallos: abres cerrojos contando vueltas sin despeinarte.</p>`;
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos · salas ${Math.max(levelReached, progress.nivelMax || 0)} de 4${retoTime ? ` · escape en ${retoTime} s` : ""}`)}
      <div class="crj-learned">El resto de dividir es donde para la aguja tras quitar las vueltas completas. Una llave +a en un dial de m solo pisa los múltiplos de mcd(a, m): por eso +4 nunca abre el 6 en un dial de 12. Sumar cifras es girar el dial de 9 (10 ≡ 1), y dos diales coprimos fijan un único número hasta m1·m2.</div>
      ${items}
      <div class="crj-actions">${errors.length ? '<button type="button" class="primary" data-review>Repasar lo fallado</button>' : ""}<button type="button" class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }
  function nextReview() {
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    ({ "avanzar el dial": () => screenDial(true, "avance"), "invertir el dial": () => screenDial(true, "inverso"), "la llave que no entra": () => screenLlave(true), "criterios de divisibilidad": () => screenCifras(true), "la caja fuerte": () => screenCaja(true) }[tipo] || nextReview)();
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "cerrojos", { score, rounds });
    body.innerHTML = `
      <div class="end-card"><div>🔒</div><div class="big-score">${score} pts</div><p>${rounds} aciertos · salas ${Math.max(levelReached, progress.nivelMax || 0)} de 4</p>
        <div class="end-actions"><button class="primary" data-retry>Jugar otra vez</button><button class="secondary" data-menu>Volver al menú</button></div></div>`;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives; score = 0; rounds = 0; finished = false; locked = false;
    level = 0; roundIdx = 0; levelReached = 0; errors = []; reviewQueue = []; retoStart = 0; retoHits = 0; retoTime = 0;
    progress = loadProgress();
    renderLives(); renderScore();
    screenMap();
  }

  start();
  return () => { finished = true; timers.forEach(clearTimeout); };
}
