// "Escuela de cálculo mental" — juego grande (dojo con cinturones) sobre
// ESTRATEGIAS de cálculo mental, no sobre calcular más rápido a secas.
// Cada cinturón enseña una estrategia con un ejemplo que se manipula (el
// jugador parte, redondea o descompone y ve la cuenta reescribirse), la
// practica con el paso intermedio a la vista y luego a ciegas con cuenta
// atrás. El cinturón negro invierte el reto: primero hay que ELEGIR qué
// estrategia encaja (cada problema se genera para que encaje en una sola)
// y después resolver. Resultados con la cuenta de cada fallo y repaso;
// progreso (cinturón máximo, fallos por estrategia) en localStorage +
// football_progress. "saltos" (#151) cubre solo "saltar a la decena" en
// una ronda; aquí no se repite esa estrategia.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

export const BELTS = [
  { id: "dobles", nombre: "Blanco", color: "#e8e8ee", estrategia: "Dobles y casi dobles", frase: "Si los dos números casi son iguales, dobla uno y ajusta." },
  { id: "compensar", nombre: "Amarillo", color: "#f5c518", estrategia: "Compensar", frase: "Redondea a la decena, opera, y devuelve lo que prestaste." },
  { id: "descomponer", nombre: "Naranja", color: "#f5a623", estrategia: "Descomponer", frase: "Suma decenas con decenas y unidades con unidades." },
  { id: "mitades", nombre: "Verde", color: "#3fb950", estrategia: "Mitades y dobles", frase: "×5 es la mitad ×10; ×4 es doblar dos veces; ×25 es un cuarto ×100." },
  { id: "negro", nombre: "Negro", color: "#222", estrategia: "Elige la estrategia", frase: "Mira el problema y decide qué camino es más corto." },
];
const GUIDED_ROUNDS = 3;
const BLIND_ROUNDS = 2;
const BLIND_SECONDS = 15;
const BLACK_ROUNDS = 5;
const STORAGE_KEY = "football_calculista_progress";
const PLAYER_KEY = "football_player_id";

// ---------------- generadores puros (uno por estrategia) ----------------

export function genDobles() {
  // Ni a ni b acaban en 8 o 9: esos son territorio de "compensar" en el
  // cinturón negro, y la clasificación tiene que ser excluyente.
  let a, b, d;
  do {
    a = randInt(6, 48);
    d = pick([-2, -1, 1, 2]);
    b = a + d;
  } while ([8, 9].includes(a % 10) || [8, 9].includes(b % 10));
  return { estrategia: "dobles", op: "+", a, b, answer: a + b, pasos: [`Doble de ${a}: ${2 * a}`, `${d > 0 ? "+" : "−"} ${Math.abs(d)} → ${a + b}`] };
}

export function genCompensar() {
  if (randInt(0, 1) === 0) {
    const a = randInt(23, 78);
    const b = pick([18, 19, 28, 29, 38, 39, 48, 49]);
    const r = b % 10 === 9 ? 1 : 2;
    return { estrategia: "compensar", op: "+", a, b, answer: a + b, pasos: [`${a} + ${b + r} = ${a + b + r}`, `− ${r} → ${a + b}`] };
  }
  const b = pick([11, 12, 21, 22, 31, 32, 41, 42]);
  const a = randInt(b + 15, 99);
  const r = b % 10;
  return { estrategia: "compensar", op: "−", a, b, answer: a - b, pasos: [`${a} − ${b - r} = ${a - b + r}`, `− ${r} → ${a - b}`] };
}

export function genDescomponer() {
  let a, b;
  do {
    a = randInt(21, 79);
    b = randInt(21, 79);
  } while (Math.abs(a - b) <= 2 || [8, 9].includes(b % 10) || [8, 9].includes(a % 10) || a % 10 === 0 || b % 10 === 0);
  const ta = Math.floor(a / 10) * 10, tb = Math.floor(b / 10) * 10, ua = a % 10, ub = b % 10;
  return { estrategia: "descomponer", op: "+", a, b, answer: a + b, pasos: [`${ta} + ${tb} = ${ta + tb}`, `${ua} + ${ub} = ${ua + ub}`, `${ta + tb} + ${ua + ub} = ${a + b}`] };
}

export function genMitades() {
  const kind = pick(["x5", "x4", "x25"]);
  if (kind === "x5") {
    const n = randInt(6, 24) * 2;
    return { estrategia: "mitades", op: "×", a: n, b: 5, answer: n * 5, pasos: [`Mitad de ${n}: ${n / 2}`, `${n / 2} × 10 = ${n * 5}`] };
  }
  if (kind === "x4") {
    const n = randInt(13, 45);
    return { estrategia: "mitades", op: "×", a: n, b: 4, answer: n * 4, pasos: [`Doble de ${n}: ${2 * n}`, `Doble de ${2 * n}: ${4 * n}`] };
  }
  const n = randInt(2, 12) * 4;
  return { estrategia: "mitades", op: "×", a: n, b: 25, answer: n * 25, pasos: [`Cuarto de ${n}: ${n / 4}`, `${n / 4} × 100 = ${n * 25}`] };
}

const GENS = { dobles: genDobles, compensar: genCompensar, descomponer: genDescomponer, mitades: genMitades };

// Clasificación excluyente por construcción: cada problema del cinturón
// negro encaja en UNA sola estrategia (la sonda la recalcula desde cero).
export function classify(p) {
  if (p.op === "×") return "mitades";
  if (p.op === "−") return "compensar";
  if ([8, 9].includes(p.b % 10)) return "compensar";
  if (Math.abs(p.a - p.b) <= 2) return "dobles";
  return "descomponer";
}

export function genNegro() {
  let p;
  let guard = 0;
  do {
    p = GENS[pick(["dobles", "compensar", "descomponer", "mitades"])]();
    guard++;
  } while (classify(p) !== p.estrategia && guard < 200);
  return p;
}

export function fmtProblem(p) {
  return `${p.a} ${p.op} ${p.b}`;
}

// ---------------- ejemplos manipulables ----------------

function exampleFor(belt) {
  if (belt === "dobles") return { a: 7, b: 8, steps: ["7 + 8", "7 + 7 + 1", "14 + 1", "15"], boton: "Parte el 8 en 7 + 1", answer: 15 };
  if (belt === "compensar") return { a: 47, b: 38, steps: ["47 + 38", "47 + 40 − 2", "87 − 2", "85"], boton: "Redondea 38 a 40 (prestas 2)", answer: 85 };
  if (belt === "descomponer") return { a: 46, b: 37, steps: ["46 + 37", "(40 + 30) + (6 + 7)", "70 + 13", "83"], boton: "Separa decenas y unidades", answer: 83 };
  return { a: 16, b: 5, steps: ["16 × 5", "8 × 10", "80"], boton: "Mitad de 16, doble de 5", answer: 80 };
}

// ---------------- progreso ----------------

function loadProgress() {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : { cinturonMax: 0, fallosPorTipo: {}, partidas: 0 }; }
  catch (_) { return { cinturonMax: 0, fallosPorTipo: {}, partidas: 0 }; }
}
function playerId() {
  try { let id = localStorage.getItem(PLAYER_KEY); if (!id) { id = `p_${Math.random().toString(36).slice(2, 10)}`; localStorage.setItem(PLAYER_KEY, id); } return id; }
  catch (_) { return "anon"; }
}
async function saveProgress(client, progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (_) { /* sin almacenamiento */ }
  if (!client) return;
  try { await client.from("football_progress").upsert({ game: "calculista", player: playerId(), data: progress, updated_at: new Date().toISOString() }); } catch (_) { /* guinda */ }
}

function keypadHtml() {
  return `<div class="keypad-display" data-display>&nbsp;</div><div class="keypad" data-keypad></div>`;
}

// ---------------- juego ----------------

export function mountCalculistaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let beltIdx = 0;
  let phase = "ejemplo";
  let roundIdx = 0;
  let beltReached = 0;
  let errors = [];
  let reviewQueue = [];
  let progress = loadProgress();
  const timers = [];
  let countdown = null;

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
  const badge = (t) => `<div class="cmt-badge">${t}</div>`;
  const recordError = (tipo, explicacion) => errors.push({ tipo, explicacion });
  const stopCountdown = () => { if (countdown) { clearInterval(countdown); countdown = null; } };
  function loseLife(next) { lives--; renderLives(); if (lives <= 0) later(screenResults, 2600); else later(next, 2600); }
  const belt = () => BELTS[beltIdx];

  function bindKeypad(onSubmit, maxDigits = 4) {
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

  function pasosHtml(p) {
    return `<ol class="cmt-steps">${p.pasos.map((s) => `<li>${s}</li>`).join("")}</ol>`;
  }
  function explain(p) {
    return `${fmtProblem(p)} = ${p.answer} (${BELTS.find((b) => b.id === p.estrategia).estrategia.toLowerCase()}: ${p.pasos.join(" · ")}).`;
  }

  // ---- portada ----
  function screenBelts() {
    locked = false;
    const unlocked = Math.min((progress.cinturonMax || 0) + 1, BELTS.length);
    const cards = BELTS.map((b, i) => {
      const done = i < (progress.cinturonMax || 0), open = i < unlocked;
      return `<button type="button" class="cmt-belt ${done ? "cmt-belt-done" : ""}" data-belt="${i}" ${open ? "" : "disabled"}><span class="cmt-belt-band" style="background:${b.color}"></span><span class="cmt-belt-name">${b.nombre}</span><span class="cmt-belt-sub">${b.estrategia}</span></button>`;
    }).join("");
    body.innerHTML = `
      ${header("Escuela de cálculo mental", "Cada cinturón enseña una estrategia; el negro te pide elegirla")}
      <div class="cmt-belts">${cards}</div>
      <p class="cmt-progress">${progress.partidas ? `Partidas: ${progress.partidas}. Cinturones ganados: ${progress.cinturonMax || 0} de 5.` : "Primera clase: empieza por el cinturón blanco."}</p>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-belt]").forEach((b) => b.addEventListener("click", () => { beltIdx = Number(b.getAttribute("data-belt")); roundIdx = 0; phase = beltIdx === 4 ? "negro" : "ejemplo"; render(); }));
  }

  // ---- ejemplo manipulable ----
  function screenExample() {
    const ex = exampleFor(belt().id);
    let step = 0;
    body.innerHTML = `
      ${badge(`Cinturón ${belt().nombre} · ${belt().estrategia}`)}
      ${header(belt().frase, "Toca el botón para ver cómo se reescribe la cuenta, paso a paso")}
      <div class="cmt-example" data-example><div class="cmt-line cmt-line-current">${ex.steps[0]}</div></div>
      <div class="cmt-actions"><button type="button" class="primary" data-step>${ex.boton}</button></div>
      <div class="feedback" data-feedback></div>`;
    body.querySelector("[data-step]").addEventListener("click", () => {
      if (locked || finished) return;
      step++;
      const box = body.querySelector("[data-example]");
      box.innerHTML = ex.steps.slice(0, step + 1).map((s, i) => `<div class="cmt-line ${i === step ? "cmt-line-current" : ""}">${s}</div>`).join("");
      const btn = body.querySelector("[data-step]");
      if (step >= ex.steps.length - 1) {
        locked = true; award();
        feedback(`Así se hace: ${ex.steps.join(" → ")}. Ahora te toca a ti con los pasos a la vista.`, true);
        btn.textContent = "A practicar →"; btn.setAttribute("data-next", "");
        btn.addEventListener("click", () => { locked = false; phase = "guiada"; roundIdx = 0; render(); }, { once: true });
      } else btn.textContent = step === 1 ? "Sigue" : "Termina";
    });
  }

  // ---- rondas guiadas y a ciegas ----
  function screenRound(blind, review = false) {
    const p = GENS[belt().id]();
    body.innerHTML = `
      ${review ? badge("Repaso") : badge(`Cinturón ${belt().nombre} · ${blind ? `a ciegas ${roundIdx + 1} de ${BLIND_ROUNDS}` : `guiada ${roundIdx + 1} de ${GUIDED_ROUNDS}`}`)}
      ${header(`¿Cuánto es <b>${fmtProblem(p)}</b>?`, blind ? `Sin pasos y con ${BLIND_SECONDS} segundos: usa la estrategia de memoria` : belt().frase)}
      ${blind ? `<div class="cmt-timer"><div class="cmt-timer-bar" data-timer style="width:100%"></div></div>` : pasosHtml({ pasos: p.pasos.slice(0, -1).concat(["… = ?"]) })}
      ${keypadHtml()}
      <div class="feedback" data-feedback></div>`;
    const tipo = belt().estrategia;
    const finishRound = (ok, msg) => {
      locked = true; stopCountdown();
      if (ok) { award(); feedback(`¡Correcto! ${explain(p)}`, true); later(() => { locked = false; review ? nextReview() : nextRound(); }, 1800); }
      else if (review) { feedback(`No: ${explain(p)} Otra vez.`, false); later(() => { locked = false; screenRound(false, true); }, 2400); }
      else { recordError(tipo, explain(p)); feedback(`${msg} ${explain(p)}`, false); loseLife(() => { locked = false; nextRound(); }); }
    };
    bindKeypad((val) => finishRound(val === p.answer, "No es correcto."));
    if (blind) {
      const started = Date.now();
      countdown = setInterval(() => {
        if (finished || locked) { stopCountdown(); return; }
        const left = Math.max(0, BLIND_SECONDS * 1000 - (Date.now() - started));
        const bar = body.querySelector("[data-timer]");
        if (bar) bar.style.width = `${(left / (BLIND_SECONDS * 1000)) * 100}%`;
        if (left <= 0) finishRound(false, "Se acabó el tiempo.");
      }, 100);
    }
  }
  function nextRound() {
    roundIdx++;
    if (phase === "guiada" && roundIdx >= GUIDED_ROUNDS) { phase = "ciegas"; roundIdx = 0; }
    else if (phase === "ciegas" && roundIdx >= BLIND_ROUNDS) {
      beltReached = Math.max(beltReached, beltIdx + 1);
      progress.cinturonMax = Math.max(progress.cinturonMax || 0, beltIdx + 1);
      saveProgress(client, progress);
      roundIdx = 0;
      screenBelts();
      return;
    } else if (phase === "negro" && roundIdx >= BLACK_ROUNDS) {
      beltReached = 5;
      progress.cinturonMax = 5;
      screenResults();
      return;
    }
    render();
  }

  // ---- cinturón negro: elige la estrategia y resuelve ----
  function screenBlack() {
    const p = genNegro();
    let chosen = null;
    body.innerHTML = `
      ${badge(`Cinturón negro · ${roundIdx + 1} de ${BLACK_ROUNDS}`)}
      ${header(`<b>${fmtProblem(p)}</b> — ¿qué estrategia es la más corta aquí?`, "Primero elige la estrategia; luego resuelve")}
      <div class="cmt-strats">${BELTS.slice(0, 4).map((b) => `<button type="button" class="choice-btn cmt-strat" data-strat="${b.id}"><span class="cmt-belt-band" style="background:${b.color}"></span>${b.estrategia}</button>`).join("")}</div>
      <div class="cmt-keypad-wrap" data-kw hidden>${keypadHtml()}</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-strat]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished || chosen) return;
      chosen = btn.getAttribute("data-strat");
      const ok = chosen === p.estrategia;
      body.querySelectorAll("[data-strat]").forEach((x) => (x.disabled = true));
      btn.classList.add(ok ? "correct" : "wrong");
      if (ok) { award(); feedback(`Eso es: ${BELTS.find((b) => b.id === p.estrategia).estrategia.toLowerCase()}. Ahora resuélvelo.`, true); }
      else { recordError("elegir la estrategia", `${fmtProblem(p)}: encajaba ${BELTS.find((b) => b.id === p.estrategia).estrategia.toLowerCase()} (${p.pasos.join(" · ")}).`); feedback(`Aquí encajaba mejor ${BELTS.find((b) => b.id === p.estrategia).estrategia.toLowerCase()}. Resuélvelo igualmente.`, false); }
      body.querySelector("[data-kw]").hidden = false;
      bindKeypad((val) => {
        locked = true;
        if (val === p.answer) { award(); feedback(`¡Correcto! ${explain(p)}`, true); }
        else { recordError(BELTS.find((b) => b.id === p.estrategia).estrategia, explain(p)); feedback(`No es correcto. ${explain(p)}`, false); }
        later(() => { locked = false; nextRound(); }, 2200);
      });
    }));
  }

  // ---- resultados y repaso ----
  function screenResults() {
    locked = false; // si se llegó aquí sin vidas, outcome() dejó locked = true y el repaso quedaría bloqueado
    stopCountdown();
    const byType = {};
    errors.forEach((e) => { byType[e.tipo] = (byType[e.tipo] || 0) + 1; });
    progress = { cinturonMax: Math.max(progress.cinturonMax || 0, beltReached), fallosPorTipo: { ...(progress.fallosPorTipo || {}) }, partidas: (progress.partidas || 0) + 1 };
    Object.entries(byType).forEach(([t, v]) => { progress.fallosPorTipo[t] = (progress.fallosPorTipo[t] || 0) + v; });
    saveProgress(client, progress);
    const items = errors.length ? `<ul class="cmt-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>` : `<p class="cmt-progress">Sin fallos: las cuatro estrategias son tuyas.</p>`;
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos · cinturón ${Math.max(beltReached, progress.cinturonMax || 0)} de 5`)}
      <div class="cmt-learned">Cuatro caminos para no contar con los dedos: doblar y ajustar, redondear y compensar, descomponer en decenas y unidades, y jugar con mitades y dobles. El cinturón negro es saber cuál usar.</div>
      ${items}
      <div class="cmt-actions">${errors.length ? '<button type="button" class="primary" data-review>Repasar lo fallado</button>' : ""}<button type="button" class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }
  function nextReview() {
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    const idx = BELTS.findIndex((b) => b.estrategia === tipo);
    beltIdx = idx >= 0 && idx < 4 ? idx : 0;
    screenRound(false, true);
  }

  function render() {
    if (finished) return;
    locked = false;
    if (phase === "ejemplo") screenExample();
    else if (phase === "guiada") screenRound(false);
    else if (phase === "ciegas") screenRound(true);
    else if (phase === "negro") screenBlack();
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    stopCountdown();
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "calculista", { score, rounds });
    body.innerHTML = `
      <div class="end-card"><div>🥋</div><div class="big-score">${score} pts</div><p>${rounds} aciertos · cinturón ${Math.max(beltReached, progress.cinturonMax || 0)} de 5</p>
        <div class="end-actions"><button class="primary" data-retry>Jugar otra vez</button><button class="secondary" data-menu>Volver al menú</button></div></div>`;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives; score = 0; rounds = 0; finished = false; locked = false;
    beltIdx = 0; phase = "ejemplo"; roundIdx = 0; beltReached = 0; errors = []; reviewQueue = [];
    stopCountdown();
    progress = loadProgress();
    renderLives(); renderScore();
    screenBelts();
  }

  start();
  return () => { finished = true; stopCountdown(); timers.forEach(clearTimeout); };
}
