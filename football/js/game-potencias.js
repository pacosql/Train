// "Microscopio y telescopio" — juego grande multipantalla sobre potencias
// de 10 y notación científica, en formato de exploración por escalas (a la
// manera de "Powers of Ten" de los Eames y "Scale of the Universe"): de un
// virus (10⁻⁷ m) al Sol (10⁹ m) cada paso multiplica por 10.
//
// Pantallas (máquina de estados `screen`): portada → tutorial (slider de
// exponente hasta encontrar el virus) → nivel 1 (elegir la notación
// científica de un número escrito) → nivel 2 (montar el número con dos
// diales: mantisa y exponente) → nivel 3 (saltar de escala: restar o sumar
// exponentes con teclado) → reto (ordenar 4 objetos por tamaño sin ver los
// números) → resultados + repaso. Vidas solo en los niveles 1-3; +10 por
// acierto en todas las pantallas. El progreso (nivel máximo, fallos por
// tipo) se guarda en localStorage y en la tabla football_progress.
import { randInt, pick, shuffle, clamp, saveScore } from "./utils.js";

// Tabla de objetos reales con su tamaño redondeado a mantisa ENTERA (1-9)
// para que la notación científica sea única y sin dudas de redondeo. Cada
// objeto tiene un exponente distinto: así el orden por tamaño siempre es
// único aunque no se vean los números. Los de exponente > 7 (Júpiter, Sol)
// quedan fuera del slider del tutorial y de los diales del nivel 2.
export const OBJETOS = [
  { id: "virus", nombre: "un virus", emoji: "🦠", m: 1, e: -7 },
  { id: "bacteria", nombre: "una bacteria", emoji: "🧫", m: 2, e: -6 },
  { id: "globulo", nombre: "un glóbulo rojo", emoji: "🩸", m: 1, e: -5 },
  { id: "arena", nombre: "un grano de arena", emoji: "⏳", m: 5, e: -4 },
  { id: "hormiga", nombre: "una hormiga", emoji: "🐜", m: 5, e: -3 },
  { id: "moneda", nombre: "una moneda", emoji: "🪙", m: 2, e: -2 },
  { id: "gato", nombre: "un gato", emoji: "🐈", m: 5, e: -1 },
  { id: "persona", nombre: "una persona", emoji: "🧍", m: 2, e: 0 },
  { id: "autobus", nombre: "un autobús", emoji: "🚌", m: 1, e: 1 },
  { id: "campo", nombre: "un campo de fútbol", emoji: "🏟️", m: 1, e: 2 },
  { id: "everest", nombre: "el monte Everest (altura)", emoji: "🏔️", m: 9, e: 3 },
  { id: "ciudad", nombre: "una ciudad grande", emoji: "🏙️", m: 2, e: 4 },
  { id: "mallorca", nombre: "la isla de Mallorca", emoji: "🏝️", m: 1, e: 5 },
  { id: "espana", nombre: "España de punta a punta", emoji: "🗺️", m: 1, e: 6 },
  { id: "tierra", nombre: "la Tierra (diámetro)", emoji: "🌍", m: 1, e: 7 },
  { id: "jupiter", nombre: "Júpiter (diámetro)", emoji: "🪐", m: 1, e: 8 },
  { id: "sol", nombre: "el Sol (diámetro)", emoji: "☀️", m: 1, e: 9 },
];

const E_MIN = -7;
const E_MAX = 7;
const ROUNDS_PER_LEVEL = { 1: 3, 2: 3, 3: 3, reto: 3 };
const STORAGE_KEY = "football_potencias_progress";
const PLAYER_KEY = "football_player_id";
const TIPOS = {
  n1: "leer la notación científica",
  n2: "montar el número",
  n3: "saltar de escala",
  reto: "ordenar por tamaño",
};

// ---------------- formato ----------------

const SUPS = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };

export function sup(n) {
  return String(n).split("").map((c) => SUPS[c] ?? c).join("");
}

// Notación científica en texto: "5 × 10⁻³".
export function cientifica(m, e) {
  return `${m} × 10${sup(e)}`;
}

// Número escrito con todas sus cifras: 4 000 000 (grupos de tres con
// espacio fino) o 0,0003.
export function numeroTexto(m, e) {
  if (e >= 0) {
    const s = String(m) + "0".repeat(e);
    let out = "";
    for (let i = 0; i < s.length; i++) {
      const fromEnd = s.length - i;
      out += s[i];
      if (fromEnd > 1 && (fromEnd - 1) % 3 === 0) out += " ";
    }
    return out;
  }
  return `0,${"0".repeat(-e - 1)}${m}`;
}

function objById(id) {
  return OBJETOS.find((o) => o.id === id);
}

function objByExp(e) {
  return OBJETOS.find((o) => o.e === e);
}

// ---------------- generadores puros (verificados en verify_potencias.mjs) ----------------

// Nivel 1: número escrito → elegir su notación científica entre 4 opciones
// de valor distinto (exponente ±1 o con el signo cambiado).
export function genCientifica() {
  const m = randInt(1, 9);
  let e = randInt(E_MIN, E_MAX);
  if (e === 0) e = pick([-1, 1]);
  const options = shuffle([
    { m, e },
    { m, e: e + 1 },
    { m, e: e - 1 },
    { m, e: -e },
  ]);
  return { m, e, numero: numeroTexto(m, e), options };
}

// Nivel 2: objeto de la tabla con su tamaño en cifras → montar m × 10ⁿ con
// los diales (mantisa 1-9, exponente −7..7).
export function genMonta() {
  const objeto = pick(OBJETOS.filter((o) => o.e >= E_MIN && o.e <= E_MAX));
  return { objeto, numero: numeroTexto(objeto.m, objeto.e), m: objeto.m, e: objeto.e };
}

// Nivel 3: "escala" (pasos ×10 entre dos objetos: restar exponentes),
// "producto" (10ᵃ × 10ᵇ: sumar) o "cociente" (10ᵃ ÷ 10ᵇ: restar).
export function genSalto() {
  const kind = pick(["escala", "escala", "producto", "cociente"]);
  if (kind === "escala") {
    let a;
    let b;
    do {
      a = pick(OBJETOS);
      b = pick(OBJETOS);
    } while (a.e >= b.e);
    return { kind, from: a, to: b, answer: b.e - a.e };
  }
  if (kind === "producto") {
    const a = randInt(1, 7);
    const b = randInt(1, 7);
    return { kind, a, b, answer: a + b };
  }
  const b = randInt(1, 6);
  const a = randInt(b + 1, 9);
  return { kind, a, b, answer: a - b };
}

// Reto: 4 objetos con exponentes distintos, a ordenar de menor a mayor.
export function genOrdena() {
  let objetos;
  let guard = 0;
  do {
    objetos = shuffle(OBJETOS).slice(0, 4);
    guard++;
  } while (new Set(objetos.map((o) => o.e)).size < 4 && guard < 100);
  const orden = objetos.slice().sort((x, y) => x.e - y.e).map((o) => o.id);
  return { objetos, orden };
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
    await client.from("football_progress").upsert({ game: "potencias", player: playerId(), data: progress, updated_at: new Date().toISOString() });
  } catch (_) { /* el progreso remoto es una guinda */ }
}

// ---------------- juego ----------------

export function mountPotenciasGame(container, { client, onExit }) {
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
    return `<div class="pot-badge">Nivel ${level} · ronda ${roundInLevel + 1} de ${ROUNDS_PER_LEVEL[level]}</div>`;
  }
  function advanceLevel() {
    roundInLevel++;
    if (roundInLevel >= ROUNDS_PER_LEVEL[level]) {
      roundInLevel = 0;
      level++;
      levelReached = Math.max(levelReached, level - 1);
    }
    screen = level > 3 ? "reto" : `nivel${level}`;
    render();
  }
  function objetoLinea(o) {
    return `${o.emoji} ${o.nombre}: ≈ ${cientifica(o.m, o.e)} m`;
  }

  // ---- pantallas ----
  function renderPortada() {
    const cont = progress.nivelMax >= 1
      ? `<button class="primary pot-cta" data-continue>Continuar en el nivel ${Math.min(progress.nivelMax + 1, 3)}</button>`
      : "";
    const fallos = Object.entries(progress.fallosPorTipo || {}).filter(([, v]) => v > 0);
    body.innerHTML = `
      <div class="pot-cover">
        <div class="pot-cover-emoji">🔬🪐</div>
        ${header("Microscopio y telescopio", "De un virus al Sol, cada paso multiplica por 10. Aprende a escribir lo enorme y lo diminuto con potencias de 10.")}
        <p class="pot-progress">${progress.partidas ? `Has jugado ${progress.partidas} ${progress.partidas === 1 ? "vez" : "veces"}. Nivel máximo: ${progress.nivelMax}.` : "Primera partida: empezamos por el tutorial."}
        ${fallos.length ? `<br>Pendiente de repasar: ${fallos.map(([t, v]) => `${t} (${v})`).join(", ")}.` : ""}</p>
        <button class="primary pot-cta" data-start>Empezar desde el tutorial</button>
        ${cont}
      </div>`;
    body.querySelector("[data-start]").addEventListener("click", () => { screen = "tutorial"; render(); });
    const c = body.querySelector("[data-continue]");
    if (c) c.addEventListener("click", () => { level = Math.min(progress.nivelMax + 1, 3); roundInLevel = 0; screen = `nivel${level}`; render(); });
  }

  function renderTutorial() {
    let e = 0;
    let done = false;
    const ticks = [];
    for (let k = E_MIN; k <= E_MAX; k++) ticks.push(k);
    body.innerHTML = `
      <div class="pot-badge">Tutorial</div>
      ${header("Encuentra el virus con el microscopio", "Cada paso a la izquierda divide el tamaño entre 10; cada paso a la derecha lo multiplica por 10. El virus mide 10⁻⁷ m.")}
      <div class="pot-slider">
        <button type="button" class="choice-btn pot-slide" data-slide="-1">◀</button>
        <div class="pot-track" data-track>${ticks.map((k) => `<span class="pot-tick" data-tick="${k}"></span>`).join("")}</div>
        <button type="button" class="choice-btn pot-slide" data-slide="1">▶</button>
      </div>
      <div class="pot-scale" data-scale></div>
      <div class="pot-actions" data-actions></div>
      <div class="feedback" data-feedback></div>`;
    const draw = () => {
      const o = objByExp(e);
      body.querySelectorAll(".pot-tick").forEach((t) => t.classList.toggle("pot-tick-on", Number(t.getAttribute("data-tick")) === e));
      body.querySelector("[data-scale]").innerHTML = `
        <div class="pot-scale-emoji">${o.emoji}</div>
        <div class="pot-scale-name">${o.nombre}</div>
        <div class="pot-scale-exp" data-exp="${e}">10${sup(e)} m</div>
        <div class="pot-scale-num">≈ ${cientifica(o.m, o.e)} m = ${numeroTexto(o.m, o.e)} m</div>`;
    };
    body.querySelectorAll("[data-slide]").forEach((btn) => btn.addEventListener("click", () => {
      if (finished || done) return;
      const d = Number(btn.getAttribute("data-slide"));
      const next = clamp(e + d, E_MIN, E_MAX);
      if (next === e) return;
      e = next;
      draw();
      if (e === -7) {
        done = true;
        award();
        feedback("¡Ahí está el virus! De la persona (10⁰ m) al virus (10⁻⁷ m) has bajado 7 pasos: 7 veces ÷10, o sea 10 000 000 veces más pequeño. Eso es lo que dice el exponente.", true);
        body.querySelector("[data-actions]").innerHTML = `<button class="primary" data-next>Al nivel 1 →</button>`;
        body.querySelector("[data-next]").addEventListener("click", () => { level = 1; roundInLevel = 0; screen = "nivel1"; render(); });
      } else {
        feedback(d < 0 ? `÷10: ahora estás en 10${sup(e)} m.` : `×10: ahora estás en 10${sup(e)} m.`, true);
      }
    }));
    draw();
  }

  function renderNivel1(review = false) {
    const r = genCientifica();
    body.innerHTML = `
      ${review ? '<div class="pot-badge">Repaso</div>' : levelBadge()}
      ${header(`¿Cómo se escribe <b>${r.numero}</b> en notación científica?`, r.e > 0 ? "Cuenta los ceros que siguen a la primera cifra" : "Cuenta cuántos lugares hay que mover la coma")}
      <div class="pot-options" data-options></div>
      <div class="feedback" data-feedback></div>`;
    const opts = body.querySelector("[data-options]");
    r.options.forEach((o) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "choice-btn pot-opt";
      b.textContent = cientifica(o.m, o.e);
      b.setAttribute("data-opt", `${o.m},${o.e}`);
      b.addEventListener("click", () => {
        if (locked || finished) return;
        locked = true;
        body.querySelectorAll(".pot-opt").forEach((x) => (x.disabled = true));
        const ok = o.m === r.m && o.e === r.e;
        b.classList.add(ok ? "correct" : "wrong");
        const expl = r.e > 0
          ? `${r.numero} es ${r.m} seguido de ${r.e} ceros, así que ${r.numero} = ${cientifica(r.m, r.e)}.`
          : `En ${r.numero} la coma está ${-r.e} lugares a la izquierda del ${r.m}, así que ${r.numero} = ${cientifica(r.m, r.e)} (exponente negativo: número menor que 1).`;
        if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : advanceLevel(); }, 1800); }
        else if (review) { feedback(`No: ${expl} Inténtalo otra vez.`, false); later(() => { locked = false; renderNivel1(true); }, 2200); }
        else { recordError(TIPOS.n1, expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; advanceLevel(); }); }
      });
      opts.appendChild(b);
    });
  }

  function renderNivel2(review = false) {
    const r = genMonta();
    let m = 1;
    let e = r.e === 0 ? 1 : 0;
    body.innerHTML = `
      ${review ? '<div class="pot-badge">Repaso</div>' : levelBadge()}
      ${header(`${r.objeto.emoji} El tamaño de <b>${r.objeto.nombre}</b> es ≈ <b>${r.numero} m</b>`, "Monta ese número con los diales (mantisa × 10 elevado al exponente) y comprueba")}
      <div class="pot-dials">
        <div class="pot-dial">
          <span class="pot-dial-label">mantisa</span>
          <button type="button" class="choice-btn pot-dial-btn" data-adj="m+">+</button>
          <span class="pot-dial-val" data-m-val>1</span>
          <button type="button" class="choice-btn pot-dial-btn" data-adj="m-">−</button>
        </div>
        <span class="pot-dial-times">× 10</span>
        <div class="pot-dial pot-dial-exp">
          <span class="pot-dial-label">exponente</span>
          <button type="button" class="choice-btn pot-dial-btn" data-adj="e+">+</button>
          <span class="pot-dial-val" data-e-val>0</span>
          <button type="button" class="choice-btn pot-dial-btn" data-adj="e-">−</button>
        </div>
      </div>
      <div class="pot-built" data-built></div>
      <div class="pot-actions"><button class="primary" data-check>Comprobar</button></div>
      <div class="feedback" data-feedback></div>`;
    const draw = () => {
      body.querySelector("[data-m-val]").textContent = String(m);
      body.querySelector("[data-e-val]").textContent = String(e);
      body.querySelector("[data-built]").innerHTML = `<b>${cientifica(m, e)}</b> = ${numeroTexto(m, e)}`;
    };
    body.querySelectorAll("[data-adj]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      const k = btn.getAttribute("data-adj");
      if (k === "m+") m = clamp(m + 1, 1, 9);
      else if (k === "m-") m = clamp(m - 1, 1, 9);
      else if (k === "e+") e = clamp(e + 1, E_MIN, E_MAX);
      else if (k === "e-") e = clamp(e - 1, E_MIN, E_MAX);
      draw();
    }));
    draw();
    body.querySelector("[data-check]").addEventListener("click", () => {
      if (locked || finished) return;
      locked = true;
      const ok = m === r.m && e === r.e;
      const expl = `${r.numero} m = ${cientifica(r.m, r.e)} m${ok ? "" : `, y tú has montado ${cientifica(m, e)} = ${numeroTexto(m, e)}`}.`;
      if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : advanceLevel(); }, 1800); }
      else if (review) { feedback(`No: ${expl} Inténtalo otra vez.`, false); later(() => { locked = false; renderNivel2(true); }, 2400); }
      else { recordError(TIPOS.n2, expl); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; advanceLevel(); }); }
    });
  }

  function renderNivel3(review = false) {
    const r = genSalto();
    let typed = "";
    let title;
    let sub;
    let expl;
    if (r.kind === "escala") {
      title = `Del tamaño de ${r.from.emoji} ${r.from.nombre} (<b>10${sup(r.from.e)} m</b>) al de ${r.to.emoji} ${r.to.nombre} (<b>10${sup(r.to.e)} m</b>): ¿cuántos pasos ×10 hay?`;
      sub = "Restar los exponentes: escala grande menos escala pequeña";
      expl = `De 10${sup(r.from.e)} a 10${sup(r.to.e)} hay ${r.to.e} − (${r.from.e}) = ${r.answer} pasos ×10.`;
    } else if (r.kind === "producto") {
      title = `<b>10${sup(r.a)}</b> × <b>10${sup(r.b)}</b> = 10<sup>?</sup>`;
      sub = "Multiplicar potencias de 10 es sumar exponentes";
      expl = `10${sup(r.a)} × 10${sup(r.b)} = 10${sup(r.a + r.b)}: ${r.a} + ${r.b} = ${r.answer}.`;
    } else {
      title = `<b>10${sup(r.a)}</b> ÷ <b>10${sup(r.b)}</b> = 10<sup>?</sup>`;
      sub = "Dividir potencias de 10 es restar exponentes";
      expl = `10${sup(r.a)} ÷ 10${sup(r.b)} = 10${sup(r.a - r.b)}: ${r.a} − ${r.b} = ${r.answer}.`;
    }
    body.innerHTML = `
      ${review ? '<div class="pot-badge">Repaso</div>' : levelBadge()}
      ${header(title, sub)}
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>`;
    const pad = body.querySelector("[data-keypad]");
    const renderDisplay = () => { body.querySelector("[data-display]").textContent = typed || " "; };
    const submit = () => {
      if (finished || locked || typed === "") return;
      locked = true;
      const guess = Number(typed);
      const ok = guess === r.answer;
      body.querySelectorAll(".keypad-key").forEach((x) => (x.disabled = true));
      if (ok) { award(); feedback(`¡Correcto! ${expl}`, true); later(() => { locked = false; review ? nextReview() : advanceLevel(); }, 1800); }
      else if (review) { feedback(`No: ${expl} Inténtalo otra vez.`, false); later(() => { locked = false; renderNivel3(true); }, 2400); }
      else { recordError(TIPOS.n3, `${expl} (respondiste ${guess})`); feedback(`No es correcto. ${expl}`, false); loseLife(() => { locked = false; advanceLevel(); }); }
    };
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key";
      btn.type = "button";
      btn.textContent = key;
      if (key === "⌫") {
        btn.setAttribute("data-backspace", "");
        btn.addEventListener("click", () => { if (finished || locked) return; typed = typed.slice(0, -1); renderDisplay(); });
      } else if (key === "✓") {
        btn.setAttribute("data-submit", "");
        btn.addEventListener("click", submit);
      } else {
        btn.setAttribute("data-digit", key);
        btn.addEventListener("click", () => {
          if (finished || locked || typed.length >= 2) return;
          typed = typed === "0" ? key : typed + key;
          renderDisplay();
        });
      }
      pad.appendChild(btn);
    });
    renderDisplay();
  }

  function renderReto(review = false) {
    levelReached = Math.max(levelReached, 3);
    const r = genOrdena();
    let picked = [];
    body.innerHTML = `
      ${review ? '<div class="pot-badge">Repaso</div>' : `<div class="pot-badge">Reto · ronda ${roundInLevel + 1} de ${ROUNDS_PER_LEVEL.reto}</div>`}
      ${header("Ordena sin escala: toca los objetos de MENOR a MAYOR tamaño", "Sin ver los números: cada objeto vive en una potencia de 10 distinta, así que el orden es único. Aquí no se pierden vidas.")}
      <div class="pot-objs" data-objs>${r.objetos.map((o) => `<button type="button" class="choice-btn pot-obj" data-obj="${o.id}"><span class="pot-obj-emoji">${o.emoji}</span><span class="pot-obj-name">${o.nombre}</span><span class="pot-obj-num" data-order></span></button>`).join("")}</div>
      <div class="feedback" data-feedback></div>`;
    const solucion = `De menor a mayor: ${r.orden.map((id) => objetoLinea(objById(id))).join(" · ")}.`;
    body.querySelectorAll("[data-obj]").forEach((btn) => btn.addEventListener("click", () => {
      if (locked || finished) return;
      const id = btn.getAttribute("data-obj");
      if (picked.includes(id)) return;
      const expected = r.orden[picked.length];
      if (id !== expected) {
        locked = true;
        btn.classList.add("wrong");
        body.querySelectorAll("[data-obj]").forEach((x) => (x.disabled = true));
        const o = objById(id);
        const ex = objById(expected);
        const expl = `${o.nombre} mide ≈ ${cientifica(o.m, o.e)} m, pero ${ex.nombre} es más ${picked.length === 0 ? "pequeño" : "pequeño que él"} (≈ ${cientifica(ex.m, ex.e)} m). ${solucion}`;
        if (review) { feedback(`No: ${expl} Inténtalo otra vez.`, false); later(() => { locked = false; renderReto(true); }, 3000); }
        else { recordError(TIPOS.reto, expl); feedback(`No es ese. ${expl}`, false); later(() => { locked = false; nextReto(); }, 3200); }
        return;
      }
      picked.push(id);
      btn.classList.add("pot-picked");
      btn.querySelector("[data-order]").textContent = `${picked.length}º`;
      if (picked.length === 4) {
        locked = true;
        award();
        feedback(`¡Orden perfecto! ${solucion}`, true);
        later(() => { locked = false; review ? nextReview() : nextReto(); }, 3000);
      } else {
        feedback(`Bien: ${objById(id).nombre} es el ${picked.length}º más pequeño. Sigue.`, true);
      }
    }));
  }

  function nextReto() {
    roundInLevel++;
    if (roundInLevel >= ROUNDS_PER_LEVEL.reto) screen = "resultados";
    render();
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
      ? `<ul class="pot-errors">${errors.map((e) => `<li><b>${e.tipo}:</b> ${e.explicacion}</li>`).join("")}</ul>`
      : `<p class="pot-progress">Sin fallos: has viajado del virus al Sol sin perderte ni un exponente.</p>`;
    body.innerHTML = `
      ${header("Resultados", `${rounds} aciertos · nivel alcanzado ${levelReached} de 3`)}
      <div class="pot-learned">Lo que has practicado: cada paso de escala es ×10; un número grande es su primera cifra por 10 elevado al número de ceros; un número pequeño lleva exponente negativo (lugares de la coma); multiplicar potencias de 10 suma exponentes y dividir los resta.</div>
      ${items}
      <div class="pot-actions" data-actions>${errors.length ? '<button class="primary" data-review>Repasar lo fallado</button>' : ""}<button class="secondary" data-end>Terminar</button></div>`;
    const rv = body.querySelector("[data-review]");
    if (rv) rv.addEventListener("click", () => { reviewQueue = [...new Set(errors.map((e) => e.tipo))]; nextReview(); });
    body.querySelector("[data-end]").addEventListener("click", () => finish(false));
  }

  function nextReview() {
    const tipo = reviewQueue.shift();
    if (!tipo) { finish(false); return; }
    if (tipo === TIPOS.n1) renderNivel1(true);
    else if (tipo === TIPOS.n2) renderNivel2(true);
    else if (tipo === TIPOS.n3) renderNivel3(true);
    else if (tipo === TIPOS.reto) renderReto(true);
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
    else if (screen === "reto") renderReto();
    else if (screen === "resultados") renderResultados();
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "potencias", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🪐</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} aciertos · nivel ${levelReached} de 3</p>
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
