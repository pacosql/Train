// "Laboratorio del azar" — juego grande multipantalla sobre probabilidad:
// de la fracción (sectores favorables / sectores totales) a la frecuencia
// observada al repetir el experimento, pasando por diseñar una ruleta a
// partir de una probabilidad dada, comparar sucesos de dispositivos
// distintos y cazar un dado trucado por sus frecuencias. Termina con un
// "casino" donde se apuesta por el suceso más probable y una pantalla de
// resultados que explica cada fallo y lo repasa antes de acabar.
//
// Pantallas (máquina de estados `screen`): portada → tutorial → nivel 1
// (fracción, con recuentos visibles) → nivel 2 (diseña la ruleta) →
// nivel 3 (¿qué es más probable?) → nivel 4 (dado trucado) → casino →
// resultados + repaso. Vidas solo en los niveles 1-4; +10 por acierto en
// todas las pantallas. El progreso (nivel máximo, fallos por tipo) se
// guarda en localStorage y en la tabla football_progress.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const COLORS = [
  { key: "rojo", hex: "#e5484d" },
  { key: "azul", hex: "#2ea3c4" },
  { key: "verde", hex: "#3fb950" },
  { key: "amarillo", hex: "#f5c518" },
];
const GREY = "#c9c9d6";
const ROUNDS_PER_LEVEL = { 1: 3, 2: 3, 3: 3, 4: 2, casino: 5 };
const MIN_GAP = 0.08;
const STORAGE_KEY = "football_azar_progress";
const PLAYER_KEY = "football_player_id";

// ---------------- generadores puros (verificados en verify_azar.mjs) ----------------

function colorOf(key) {
  return COLORS.find((c) => c.key === key);
}

function makeSectors(n, k, color) {
  const others = COLORS.filter((c) => c.key !== color).map((c) => c.key);
  const sectors = [];
  for (let i = 0; i < k; i++) sectors.push(color);
  for (let i = k; i < n; i++) sectors.push(others[(i - k) % others.length]);
  return shuffle(sectors);
}

export function genProbRound() {
  const n = randInt(5, 8);
  const k = randInt(1, n - 1);
  const color = pick(COLORS).key;
  const pool = [];
  for (let j = 1; j <= n - 1; j++) if (j !== k) pool.push(j);
  const options = shuffle([k, ...shuffle(pool).slice(0, 3)]);
  return { n, k, color, sectors: makeSectors(n, k, color), options };
}

export function genDesignRound() {
  const n = pick([6, 8]);
  const k = randInt(1, n - 1);
  const color = pick(COLORS).key;
  return { n, k, color };
}

function makeEvent(type) {
  if (type === "ruleta") {
    const n = randInt(4, 8);
    const k = randInt(1, n - 1);
    const color = pick(COLORS).key;
    return { type, num: k, den: n, p: k / n, color, sectors: makeSectors(n, k, color), texto: `Ruleta: que salga ${color} (${k} de ${n} sectores)` };
  }
  if (type === "dado") {
    const m = randInt(1, 5);
    return { type, num: m, den: 6, p: m / 6, m, texto: `Dado: sacar un número menor o igual que ${m}` };
  }
  const b = randInt(4, 10);
  const a = randInt(1, b - 1);
  const color = pick(COLORS).key;
  return { type: "bolsa", num: a, den: b, p: a / b, color, texto: `Bolsa: sacar una bola ${color} (${a} de ${b} bolas)` };
}

function wellSeparated(events) {
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      if (Math.abs(events[i].p - events[j].p) < MIN_GAP) return false;
    }
  }
  return true;
}

export function genCompareRound() {
  let events;
  let guard = 0;
  do {
    const types = shuffle(["ruleta", "dado", "bolsa"]).slice(0, 2);
    events = types.map(makeEvent);
    guard++;
  } while (!wellSeparated(events) && guard < 500);
  const answer = events[0].p > events[1].p ? 0 : 1;
  return { events, answer };
}

export function genCasinoRound() {
  let events;
  let guard = 0;
  do {
    events = shuffle(["ruleta", "dado", "bolsa"]).map(makeEvent);
    guard++;
  } while (!wellSeparated(events) && guard < 500);
  let answer = 0;
  events.forEach((e, i) => { if (e.p > events[answer].p) answer = i; });
  return { events, answer };
}

function fairCounts() {
  let counts;
  let guard = 0;
  do {
    counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 60; i++) counts[randInt(0, 5)]++;
    guard++;
  } while (counts.some((c) => c < 6 || c > 14) && guard < 2000);
  if (counts.some((c) => c < 6 || c > 14)) counts = [10, 9, 11, 10, 8, 12];
  return counts;
}

function riggedCounts() {
  const face = randInt(0, 5);
  const big = randInt(22, 30);
  const rest = 60 - big;
  const counts = [0, 0, 0, 0, 0, 0];
  const others = [0, 1, 2, 3, 4, 5].filter((f) => f !== face);
  const base = Math.floor(rest / 5);
  others.forEach((f) => (counts[f] = base));
  for (let i = 0; i < rest - base * 5; i++) counts[others[i]]++;
  counts[face] = big;
  return { counts, face };
}

export function genRiggedRound() {
  const fair = fairCounts();
  const rigged = riggedCounts();
  const riggedFirst = randInt(0, 1) === 1;
  const dice = riggedFirst ? [rigged.counts, fair] : [fair, rigged.counts];
  return { dice, answer: riggedFirst ? 0 : 1, face: rigged.face };
}

export function simulateSpins(sectors, times) {
  const counts = {};
  for (let i = 0; i < times; i++) {
    const c = pick(sectors);
    counts[c] = (counts[c] || 0) + 1;
  }
  return counts;
}

// ---------------- dibujo ----------------

function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sectorPath(cx, cy, r, a0, a1) {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z`;
}

function spinnerSvg(sectors, { size = 180, tappable = false, labels = null, marks = null } = {}) {
  const n = sectors.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  let out = "";
  sectors.forEach((key, i) => {
    const a0 = (360 / n) * i;
    const a1 = (360 / n) * (i + 1);
    const fill = key ? colorOf(key).hex : GREY;
    const marked = marks && marks[i] ? ' azr-sector-marked' : "";
    out += `<path d="${sectorPath(cx, cy, r, a0, a1)}" fill="${fill}" class="azr-sector${tappable ? " azr-sector-tap" : ""}${marked}" data-sector="${i}" data-color="${key || ""}" />`;
    if (labels && labels[i] != null) {
      const p = polar(cx, cy, r * 0.62, (a0 + a1) / 2);
      out += `<text x="${p.x.toFixed(1)}" y="${(p.y + 5).toFixed(1)}" class="azr-sector-label">${labels[i]}</text>`;
    }
  });
  out += `<polygon points="${cx - 7},4 ${cx + 7},4 ${cx},18" class="azr-pointer" />`;
  return `<svg class="azr-spinner" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" data-spinner>${out}</svg>`;
}

function diceBarsSvg(counts, idx) {
  const W = 190;
  const H = 120;
  const max = 30;
  let out = "";
  counts.forEach((c, i) => {
    const bh = Math.round((c / max) * 80);
    const x = 14 + i * 29;
    out += `<rect x="${x}" y="${100 - bh}" width="22" height="${bh}" class="azr-bar" />`;
    out += `<text x="${x + 11}" y="${96 - bh}" class="azr-bar-num">${c}</text>`;
    out += `<text x="${x + 11}" y="114" class="azr-bar-face">${i + 1}</text>`;
  });
  return `<svg class="azr-bars" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-dice="${idx}">${out}</svg>`;
}

function eventCard(ev, idx, extraClass = "") {
  let visual = "";
  if (ev.type === "ruleta") visual = spinnerSvg(ev.sectors, { size: 90 });
  else if (ev.type === "dado") visual = `<div class="azr-die">🎲 ≤ ${ev.m}</div>`;
  else {
    let balls = "";
    for (let i = 0; i < ev.den; i++) balls += `<span class="azr-ball" style="background:${i < ev.num ? colorOf(ev.color).hex : GREY}"></span>`;
    visual = `<div class="azr-bag">${balls}</div>`;
  }
  return `<button type="button" class="choice-btn azr-event ${extraClass}" data-event="${idx}">${visual}<span class="azr-event-text">${ev.texto}</span></button>`;
}

function pct(p) {
  return `${Math.round(p * 100)} %`;
}

// ---------------- progreso ----------------

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { nivelMax: 0, fallosPorTipo: {}, partidas: 0 };
  } catch (_) {
    return { nivelMax: 0, fallosPorTipo: {}, partidas: 0 };
  }
}

function playerId() {
  try {
    let id = localStorage.getItem(PLAYER_KEY);
    if (!id) {
      id = `p_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(PLAYER_KEY, id);
    }
    return id;
  } catch (_) {
    return "anon";
  }
}

async function saveProgress(client, progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* sin almacenamiento */ }
  if (!client) return;
  try {
    await client.from("football_progress").upsert({ game: "azar", player: playerId(), data: progress, updated_at: new Date().toISOString() });
  } catch (_) { /* el progreso remoto es una guinda */ }
}

// ---------------- juego ----------------

export function mountAzarGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let screen = "portada";
  let level = 1;
  let roundInLevel = 0;
  let levelReached = 0;
  let errors = [];
  let reviewQueue = [];
  let progress = loadProgress();
  const timers = [];

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

  function later(fn, ms) {
    timers.push(setTimeout(() => { if (!finished) fn(); }, ms));
  }
  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }
  function award() {
    rounds++;
    score += 10;
    renderScore();
  }
  function feedback(text, ok) {
    const el = body.querySelector("[data-feedback]");
    if (!el) return;
    el.textContent = text;
    el.className = `feedback ${ok ? "ok" : "bad"}`;
  }
  function recordError(tipo, explicacion) {
    errors.push({ tipo, explicacion });
  }
  function loseLife(next) {
    lives--;
    renderLives();
    if (lives <= 0) later(() => { screen = "resultados"; render(); }, 2600);
    else later(next, 2600);
  }
  function header(title, sub) {
    return `<p class="prompt">${title}${sub ? `<small>${sub}</small>` : ""}</p>`;
  }
  function levelBadge() {
    const total = ROUNDS_PER_LEVEL[level];
    return `<div class="azr-badge">Nivel ${level} · ronda ${roundInLevel + 1} de ${total}</div>`;
  }
  function advanceLevel() {
    roundInLevel++;
    if (roundInLevel >= ROUNDS_PER_LEVEL[level]) {
      roundInLevel = 0;
      level++;
      levelReached = Math.max(levelReached, level - 1);
    }
    screen = level > 4 ? "casino" : `nivel${level}`;
    render();
  }

  // ---- pantallas ----
  function renderPortada() {
    const cont = progress.nivelMax >= 1
      ? `<button class="primary azr-cta" data-continue>Continuar en el nivel ${Math.min(progress.nivelMax + 1, 4)}</button>`
      : "";
    const fallos = Object.entries(progress.fallosPorTipo || {}).filter(([, v]) => v > 0);
    body.innerHTML = `
      <div class="azr-cover">
        <div class="azr-cover-emoji">🧿</div>
        ${header("Laboratorio del azar", "Una ruleta, un dado, una bolsa de bolas. Aprende a leer la probabilidad, a diseñarla y a cazar la trampa.")}
        <p class="azr-progress">${progress.partidas ? `Has jugado ${progress.partidas} ${progress.partidas === 1 ? "vez" : "veces"}. Nivel máximo: ${progress.nivelMax}.` : "Primera partida: empezamos por el tutorial."}
        ${fallos.length ? `<br>Pendiente de repasar: ${fallos.map(([t, v]) => `${t} (${v})`).join(", ")}.` : ""}</p>
        <button class="primary azr-cta" data-start>Empezar desde el tutorial</button>
        ${cont}
      </div>`;
    body.querySelector("[data-start]").addEventListener("click", () => { screen = "tutorial"; render(); });
    const c = body.querySelector("[data-continue]");
    if (c) c.addEventListener("click", () => { level = Math.min(progress.nivelMax + 1, 4); roundInLevel = 0; screen = `nivel${level}`; render(); });
  }

  function renderTutorial() {
    const sectors = ["rojo", "azul", "rojo", "verde"];
    const marks = [false, false, false, false];
    let step = "A";
    body.innerHTML = `
      ${header("Tutorial: ¿qué probabilidad hay de que salga rojo?", "Toca TODOS los sectores rojos de la ruleta")}
      <div class="azr-wrap" data-wrap>${spinnerSvg(sectors, { tappable: true, marks })}</div>
      <div class="azr-formula" data-formula>P(rojo) = <b data-num>?</b> / <b>4</b></div>
      <div class="azr-actions" data-actions></div>
      <div class="azr-tally" data-tally></div>
      <div class="feedback" data-feedback></div>`;
    const redraw = () => { body.querySelector("[data-wrap]").innerHTML = spinnerSvg(sectors, { tappable: step === "A", marks }); bind(); };
    const bind = () => {
      body.querySelectorAll(".azr-sector-tap").forEach((el) => el.addEventListener("click", () => {
        if (step !== "A" || finished) return;
        const i = Number(el.getAttribute("data-sector"));
        if (sectors[i] !== "rojo") { feedback("Ese sector no es rojo: fíjate en el color.", false); return; }
        if (marks[i]) return;
        marks[i] = true;
        const found = marks.filter(Boolean).length;
        body.querySelector("[data-num]").textContent = String(found);
        feedback(`Llevas ${found} de 2 sectores rojos.`, true);
        redraw();
        if (found === 2) {
          step = "B";
          award();
          feedback("¡Eso es! 2 sectores rojos de 4: P(rojo) = 2/4 = 1/2. ¿Saldrá rojo la mitad de las veces? Compruébalo.", true);
          body.querySelector("[data-actions]").innerHTML = `<button class="primary" data-spin>Girar 20 veces</button>`;
          body.querySelector("[data-spin]").addEventListener("click", spin);
          redraw();
        }
      }));
    };
    const spin = () => {
      if (finished) return;
      const counts = simulateSpins(sectors, 20);
      const reds = counts.rojo || 0;
      body.querySelector("[data-tally]").innerHTML = `
        <div class="azr-tally-row"><span>Salió rojo</span><div class="azr-tally-bar"><div style="width:${reds * 5}%"></div></div><b>${reds} de 20 = ${Math.round((reds / 20) * 100)} %</b></div>
        <div class="azr-tally-row"><span>Probabilidad</span><div class="azr-tally-bar azr-tally-bar-ref"><div style="width:50%"></div></div><b>2/4 = 50 %</b></div>`;
      feedback(`Ha salido rojo ${reds} de 20 veces (${Math.round((reds / 20) * 100)} %). La frecuencia se ACERCA a la probabilidad (50 %) pero casi nunca es exacta: el azar no reparte a partes iguales en pocas tiradas.`, true);
      body.querySelector("[data-actions]").innerHTML = `<button class="secondary" data-spin>Girar otras 20</button> <button class="primary" data-next>Al nivel 1 →</button>`;
      body.querySelector("[data-spin]").addEventListener("click", spin);
      body.querySelector("[data-next]").addEventListener("click", () => { level = 1; roundInLevel = 0; screen = "nivel1"; render(); });
    };
    bind();
  }

  function renderNivel1(review = false) {
    const r = genProbRound();
    const labels = level === 1 && !review ? r.sectors.map((c) => (c === r.color ? "●" : "")) : null;
    body.innerHTML = `
      ${review ? '<div class="azr-badge">Repaso</div>' : levelBadge()}
      ${header(`¿Cuál es la probabilidad de que salga <b>${r.color}</b>?`, review ? "Cuenta los sectores del color y los sectores totales" : "Sectores favorables entre sectores totales")}
      <div class="azr-wrap">${spinnerSvg(r.sectors, { labels })}</div>
      <div class="azr-options" data-options></div>
      <div class="feedback" data-feedback></div>`;
    const opts = body.querySelector("[data-options]");
    r.options.forEach((j) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice-btn azr-frac";
      b.textContent = `${j}/${r.n}`;
      b.setAttribute("data-frac", String(j));
      b.addEventListener("click", () => {
        if (locked || finished) return;
        locked = true;
        body.querySelectorAll(".azr-frac").forEach((x) => (x.disabled = true));
        const ok = j === r.k;
        b.classList.add(ok ? "correct" : "wrong");
        const expl = `Hay ${r.k} sectores ${r.color} de ${r.n} en total: P = ${r.k}/${r.n} (${pct(r.k / r.n)}).`;
        if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : advanceLevel(); }, 1800); }
        else if (review) { feedback(`No: ${expl} Inténtalo otra vez.`, false); later(() => { locked = false; renderNivel1(true); }, 2200); }
        else { recordError("fracción de la ruleta", expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; advanceLevel(); }); }
      });
      opts.appendChild(b);
    });
  }

  function renderNivel2(review = false) {
    const r = genDesignRound();
    const sectors = Array(r.n).fill(null);
    body.innerHTML = `
      ${review ? '<div class="azr-badge">Repaso</div>' : levelBadge()}
      ${header(`Diseña una ruleta donde P(<b>${r.color}</b>) = <b>${r.k}/${r.n}</b>`, "Toca los sectores para pintarlos (vuelve a tocar para despintar) y comprueba")}
      <div class="azr-wrap" data-wrap></div>
      <div class="azr-formula">Pintados: <b data-painted>0</b> de ${r.n}</div>
      <div class="azr-actions"><button class="primary" data-check>Comprobar</button></div>
      <div class="feedback" data-feedback></div>`;
    const draw = () => {
      body.querySelector("[data-wrap]").innerHTML = spinnerSvg(sectors, { tappable: true });
      body.querySelectorAll(".azr-sector-tap").forEach((el) => el.addEventListener("click", () => {
        if (locked || finished) return;
        const i = Number(el.getAttribute("data-sector"));
        sectors[i] = sectors[i] ? null : r.color;
        body.querySelector("[data-painted]").textContent = String(sectors.filter(Boolean).length);
        draw();
      }));
    };
    draw();
    body.querySelector("[data-check]").addEventListener("click", () => {
      if (locked || finished) return;
      locked = true;
      const painted = sectors.filter(Boolean).length;
      const ok = painted === r.k;
      const expl = `Para P = ${r.k}/${r.n} hacen falta exactamente ${r.k} sectores ${r.color} de ${r.n}${ok ? "" : ` y has pintado ${painted}`}.`;
      if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : advanceLevel(); }, 1800); }
      else if (review) { feedback(`No: ${expl}`, false); later(() => { locked = false; renderNivel2(true); }, 2200); }
      else { recordError("diseñar la ruleta", expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; advanceLevel(); }); }
    });
  }

  function renderNivel3(review = false) {
    const r = genCompareRound();
    body.innerHTML = `
      ${review ? '<div class="azr-badge">Repaso</div>' : levelBadge()}
      ${header("¿Cuál de los dos sucesos es más probable?", "Convierte cada uno en una fracción y compáralas")}
      <div class="azr-events">${r.events.map((e, i) => eventCard(e, i)).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-event]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      locked = true;
      const i = Number(btn.getAttribute("data-event"));
      const ok = i === r.answer;
      body.querySelectorAll("[data-event]").forEach((x) => (x.disabled = true));
      btn.classList.add(ok ? "correct" : "wrong");
      const [a, b] = r.events;
      const expl = `${a.num}/${a.den} = ${pct(a.p)} frente a ${b.num}/${b.den} = ${pct(b.p)}: gana ${r.events[r.answer].texto.split(":")[0].toLowerCase()}.`;
      if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : advanceLevel(); }, 2000); }
      else if (review) { feedback(`No: ${expl}`, false); later(() => { locked = false; renderNivel3(true); }, 2400); }
      else { recordError("comparar sucesos", expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; advanceLevel(); }); }
    }));
  }

  function renderNivel4(review = false) {
    const r = genRiggedRound();
    body.innerHTML = `
      ${review ? '<div class="azr-badge">Repaso</div>' : levelBadge()}
      ${header("Dos dados, 60 tiradas cada uno. ¿Cuál está trucado?", "Con un dado justo cada cara debería salir unas 10 veces; toca el dado sospechoso")}
      <div class="azr-dice">
        <button type="button" class="choice-btn azr-die-card" data-die="0"><span>Dado A</span>${diceBarsSvg(r.dice[0], 0)}</button>
        <button type="button" class="choice-btn azr-die-card" data-die="1"><span>Dado B</span>${diceBarsSvg(r.dice[1], 1)}</button>
      </div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-die]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      locked = true;
      const i = Number(btn.getAttribute("data-die"));
      const ok = i === r.answer;
      body.querySelectorAll("[data-die]").forEach((x) => (x.disabled = true));
      btn.classList.add(ok ? "correct" : "wrong");
      const big = r.dice[r.answer][r.face];
      const expl = `El dado ${r.answer === 0 ? "A" : "B"} sacó el ${r.face + 1} ${big} veces de 60 (${pct(big / 60)}), muy lejos del 1/6 ≈ 17 % esperado; el otro reparte todas las caras entre 6 y 14.`;
      if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : advanceLevel(); }, 2200); }
      else if (review) { feedback(`No: ${expl}`, false); later(() => { locked = false; renderNivel4(true); }, 2600); }
      else { recordError("cazar el dado trucado", expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; advanceLevel(); }); }
    }));
  }

  function renderCasino() {
    levelReached = Math.max(levelReached, 4);
    const r = genCasinoRound();
    body.innerHTML = `
      <div class="azr-badge">El casino · apuesta ${roundInLevel + 1} de ${ROUNDS_PER_LEVEL.casino}</div>
      ${header("Apuesta por el suceso MÁS probable", "Aquí no se pierden vidas: gana quien elige bien, aunque el azar luego haga de las suyas")}
      <div class="azr-events azr-events-3">${r.events.map((e, i) => eventCard(e, i)).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-event]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      locked = true;
      const i = Number(btn.getAttribute("data-event"));
      const ok = i === r.answer;
      body.querySelectorAll("[data-event]").forEach((x) => (x.disabled = true));
      btn.classList.add(ok ? "correct" : "wrong");
      const happened = Math.random() < r.events[i].p;
      const list = r.events.map((e) => `${e.texto.split(":")[0]} ${pct(e.p)}`).join(" · ");
      const luck = happened ? "Y además el suceso ocurrió al jugarlo." : "Al jugarlo no ocurrió: hasta el más probable falla a veces, por eso se apuesta por probabilidad, no por corazonada.";
      if (ok) { award(); feedback(`¡Buena apuesta! ${list}. ${luck}`, true); }
      else { recordError("apostar en el casino", `${list}: el más probable era ${r.events[r.answer].texto.split(":")[0].toLowerCase()}.`); feedback(`Apuesta floja. ${list}. ${luck}`, false); }
      later(() => {
        locked = false;
        roundInLevel++;
        if (roundInLevel >= ROUNDS_PER_LEVEL.casino) { screen = "resultados"; }
        render();
      }, 2600);
    }));
  }

  function renderResultados() {
    const byType = {};
    errors.forEach((e) => { byType[e.tipo] = (byType[e.tipo] || 0) + 1; });
    progress = {
      nivelMax: Math.max(progress.nivelMax || 0, levelReached),
      fallosPorTipo: { ...(progress.fallosPorTipo || {}) },
      partidas: (progress.partidas || 0) + 1,
    };
    Object.entries(byType).forEach(([t, v]) => { progress.fallosPorTipo[t] = (progress.fallosPorTipo[t] || 0) + v; });
    saveProgress(client, progress);
    const items = errors.length
      ? `<ul class="azr-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>`
      : `<p class="azr-progress">Sin fallos: has leído, diseñado y comparado probabilidades sin tropezar.</p>`;
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos · nivel alcanzado ${levelReached} de 4`)}
      <div class="azr-learned">Lo que has practicado: probabilidad = favorables / totales; la frecuencia se acerca a la probabilidad al repetir; comparar sucesos pasando a la misma escala; detectar trampas por frecuencias anómalas.</div>
      ${items}
      <div class="azr-actions" data-actions>${errors.length ? '<button class="primary" data-review>Repasar lo fallado</button>' : ""}<button class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }

  function nextReview() {
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    if (tipo === "fracción de la ruleta") renderNivel1(true);
    else if (tipo === "diseñar la ruleta") renderNivel2(true);
    else if (tipo === "comparar sucesos") renderNivel3(true);
    else if (tipo === "cazar el dado trucado") renderNivel4(true);
    else nextReview();
  }

  function render() {
    if (finished) return;
    locked = false;
    if (screen === "portada") renderPortada();
    else if (screen === "tutorial") renderTutorial();
    else if (screen === "nivel1") renderNivel1();
    else if (screen === "nivel2") renderNivel2();
    else if (screen === "nivel3") renderNivel3();
    else if (screen === "nivel4") renderNivel4();
    else if (screen === "casino") renderCasino();
    else if (screen === "resultados") renderResultados();
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "azar", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧿</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} aciertos · nivel ${levelReached} de 4</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>`;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives;
    score = 0;
    rounds = 0;
    finished = false;
    locked = false;
    level = 1;
    roundInLevel = 0;
    levelReached = 0;
    errors = [];
    reviewQueue = [];
    progress = loadProgress();
    screen = "portada";
    renderLives();
    renderScore();
    render();
  }

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
  };
}
