// #50 "Mide de verdad" (Medidas) — v3.
// v1 era un test de opciones con una regla de adorno. v2 pedía "estirar el
// lápiz hasta que mida N cm": la idea matemática (medir es RESTAR
// posiciones cuando la regla no empieza en 0) era buena, pero la
// situación era absurda — los lápices no se estiran — y el dibujo era una
// barra amarilla que "parece un lápiz" sin serlo. v3 da la vuelta a la
// escena para que sea físicamente coherente: el OBJETO es rígido y está
// quieto (una llave, una cuchara, un tornillo, una pila… o un lápiz de
// verdad, con punta) y lo que se mueve es la REGLA, que se arrastra por
// debajo para medirlo, como en la vida real. La respuesta se teclea.
//   Nivel 1: la regla llega alineada (0 en el principio): basta leer el final.
//   Nivel 2: la regla llega desplazada: o la alineas al 0 con el gesto, o
//            restas las dos lecturas (acaba en 9, empieza en 3 → 6 cm).
//   Nivel 3: regla rota sin 0 (empieza en 3) y numerada de 5 en 5: hay que
//            restar sí o sí.
//   Nivel 4: inversión — "si su principio está en la marca 5, ¿en qué marca
//            acaba?": medir y sumar (o colocar la regla ahí y leer).
import { randInt, pick, clamp, saveScore } from "./utils.js";

// Geometría de la escena (unidades del viewBox del SVG). El SVG se escala
// al ancho disponible: objeto, regla y guías comparten estas coordenadas.
export const PX_PER_CM = 18;
export const SCENE_CM = 20;
const VIEW_W = SCENE_CM * PX_PER_CM; // 360
const VIEW_H = 140;
const OBJ_CY = 34; // centro vertical del objeto
const RULER_Y = 78; // borde superior de la regla
const RULER_H = 50;

export const OBJECTS = [
  { id: "llave", name: "llave", article: "la" },
  { id: "cuchara", name: "cuchara", article: "la" },
  { id: "tornillo", name: "tornillo", article: "el" },
  { id: "pila", name: "pila AA", article: "la" },
  { id: "clip", name: "clip", article: "el" },
  { id: "tiza", name: "tiza", article: "la" },
  { id: "cepillo", name: "cepillo de dientes", article: "el" },
  { id: "lapiz", name: "lápiz", article: "el" },
];

// Cada nivel fija la regla (marcas de first a last, rótulos cada
// labelEvery) y de dónde a dónde puede caer la lectura del PRINCIPIO del
// objeto (minStart..). En el nivel 1 el principio lee 0; a partir del 2
// nunca, para que medir no sea leer un solo número.
export const LEVELS = [
  { first: 0, last: 12, labelEvery: 1, broken: false, minLen: 2, maxLen: 9, minStart: 0, maxStart: 0, mode: "mide" },
  { first: 0, last: 12, labelEvery: 1, broken: false, minLen: 2, maxLen: 9, minStart: 1, maxStart: 99, mode: "mide" },
  { first: 3, last: 15, labelEvery: 5, broken: true, minLen: 3, maxLen: 12, minStart: 3, maxStart: 99, mode: "mide" },
  { first: 0, last: 15, labelEvery: 1, broken: false, minLen: 2, maxLen: 10, minStart: 1, maxStart: 99, mode: "desde" },
];

export function reglaLevelFor(streak) {
  return streak >= 8 ? 3 : streak >= 5 ? 2 : streak >= 2 ? 1 : 0;
}

// Límites del arrastre: la regla siempre cubre el objeto entero, así que
// las dos lecturas existen y son enteras (r es la posición del "0" de la
// regla en cm de escena, aunque en la regla rota ese 0 no esté dibujado).
export function rulerRange(round) {
  return {
    min: round.a + round.length - round.ruler.last,
    max: round.a - round.ruler.first,
  };
}

function tryRound(lv) {
  const length = randInt(lv.minLen, lv.maxLen);
  const maxStart = Math.min(lv.maxStart, lv.last - length);
  if (maxStart < lv.minStart) return null;
  const start = randInt(lv.minStart, maxStart); // lectura del principio
  // El objeto se coloca cerca del centro de la escena (±2 cm), siempre
  // entero dentro de ella.
  const center = Math.round((SCENE_CM - length) / 2);
  const a = clamp(center + randInt(-2, 2), 1, SCENE_CM - 1 - length);
  const r = a - start;

  let fromMark = 0;
  let answer = length;
  if (lv.mode === "desde") {
    // Marca pedida distinta de la actual y con sitio para el objeto.
    const cands = [];
    for (let m = 1; m <= lv.last - length; m++) if (m !== start) cands.push(m);
    if (!cands.length) return null;
    fromMark = pick(cands);
    answer = fromMark + length;
  }

  const object = pick(OBJECTS);
  return {
    mode: lv.mode,
    object,
    length,
    a,
    r,
    start,
    end: start + length,
    fromMark,
    answer,
    ruler: { first: lv.first, last: lv.last, labelEvery: lv.labelEvery, broken: lv.broken },
    key: `${lv.mode}|${object.id}|${length}|${start}|${fromMark}`,
  };
}

export function makeReglaRound(streak, lastKey) {
  const lv = LEVELS[reglaLevelFor(streak)];
  let cand = null;
  let guard = 0;
  do {
    cand = tryRound(lv);
    guard++;
  } while ((!cand || cand.key === lastKey) && guard < 300);
  // La simulación dice que nunca hacen falta 300 intentos; por si acaso,
  // devuelve el último candidato válido aunque repita clave.
  return cand || tryRound(lv);
}

// ---------- siluetas: cada una ocupa EXACTAMENTE de x0 a x1 ----------
function svgKey(x0, x1, cy) {
  const R = 9;
  return `
    <circle cx="${x0 + R}" cy="${cy}" r="${R}" class="rg-obj-metal" />
    <circle cx="${x0 + R}" cy="${cy}" r="3.5" class="rg-obj-hole" />
    <rect x="${x0 + 2 * R - 2}" y="${cy - 3.5}" width="${x1 - (x0 + 2 * R - 2)}" height="7" class="rg-obj-metal" />
    <rect x="${x1 - 13}" y="${cy + 2}" width="4" height="7" class="rg-obj-metal" />
    <rect x="${x1 - 6}" y="${cy + 2}" width="4" height="9" class="rg-obj-metal" />`;
}
function svgSpoon(x0, x1, cy) {
  const w = x1 - x0;
  const bw = Math.min(30, w * 0.4);
  return `
    <ellipse cx="${x0 + bw / 2}" cy="${cy}" rx="${bw / 2}" ry="10" class="rg-obj-metal" />
    <ellipse cx="${x0 + bw / 2 - 2}" cy="${cy - 2}" rx="${bw / 2 - 5}" ry="5" class="rg-obj-shine" />
    <rect x="${x0 + bw - 3}" y="${cy - 2.5}" width="${x1 - (x0 + bw - 3)}" height="5" rx="2.5" class="rg-obj-metal" />`;
}
function svgScrew(x0, x1, cy) {
  let threads = "";
  for (let x = x0 + 10; x < x1 - 9; x += 4) {
    threads += `<line x1="${x}" y1="${cy - 4}" x2="${x + 2.5}" y2="${cy + 4}" class="rg-obj-line" />`;
  }
  return `
    <rect x="${x0}" y="${cy - 9}" width="7" height="18" rx="2" class="rg-obj-metal" />
    <line x1="${x0 + 3.5}" y1="${cy - 6}" x2="${x0 + 3.5}" y2="${cy + 6}" class="rg-obj-line" />
    <rect x="${x0 + 7}" y="${cy - 4}" width="${x1 - 8 - (x0 + 7)}" height="8" class="rg-obj-metal" />
    ${threads}
    <polygon points="${x1 - 8},${cy - 4} ${x1},${cy} ${x1 - 8},${cy + 4}" class="rg-obj-metal" />`;
}
function svgBattery(x0, x1, cy) {
  const w = x1 - x0;
  return `
    <rect x="${x0}" y="${cy - 9}" width="${w - 3}" height="18" rx="2" class="rg-obj-metal" />
    <rect x="${x0}" y="${cy - 9}" width="${(w - 3) * 0.32}" height="18" rx="2" class="rg-obj-band" />
    <rect x="${x1 - 3}" y="${cy - 3}" width="3" height="6" class="rg-obj-metal" />
    ${w >= 50 ? `<text x="${x0 + (w - 3) * 0.66}" y="${cy + 3.5}" class="rg-obj-text">AA</text>` : ""}`;
}
function svgClip(x0, x1, cy) {
  // Trazo de 3: se entra 1.5 por cada lado para que la tinta acabe justo
  // en x0 y x1.
  const l = x0 + 1.5;
  const r = x1 - 1.5;
  const d = `M ${l + 9} ${cy + 9} A 9 9 0 0 1 ${l + 9} ${cy - 9} H ${r - 9} A 9 9 0 0 1 ${r - 9} ${cy + 9} `
    + `H ${l + 15} A 5 5 0 0 1 ${l + 15} ${cy - 1} H ${r - 14} A 4 4 0 0 1 ${r - 14} ${cy + 7} H ${l + 22}`;
  return `<path d="${d}" class="rg-obj-wire" />`;
}
function svgChalk(x0, x1, cy) {
  return `
    <rect x="${x0 + 0.75}" y="${cy - 6}" width="${x1 - x0 - 1.5}" height="12" rx="2" class="rg-obj-chalk" />
    <ellipse cx="${x0 + 3}" cy="${cy}" rx="2.2" ry="5.2" class="rg-obj-chalk-end" />`;
}
function svgToothbrush(x0, x1, cy) {
  let bristles = "";
  for (let x = x1 - 14; x <= x1 - 2; x += 3) {
    bristles += `<line x1="${x}" y1="${cy - 10}" x2="${x}" y2="${cy - 1}" class="rg-obj-bristle" />`;
  }
  return `
    <rect x="${x0}" y="${cy - 3}" width="${x1 - 16 - x0 + 4}" height="6" rx="3" class="rg-obj-handle" />
    <rect x="${x1 - 16}" y="${cy - 1}" width="16" height="5" rx="2" class="rg-obj-handle-dark" />
    ${bristles}`;
}
function svgPencil(x0, x1, cy) {
  return `
    <rect x="${x0}" y="${cy - 5}" width="6" height="10" rx="2" class="rg-obj-eraser" />
    <rect x="${x0 + 6}" y="${cy - 5}" width="5" height="10" class="rg-obj-metal" />
    <rect x="${x0 + 11}" y="${cy - 5}" width="${x1 - 12 - (x0 + 11)}" height="10" class="rg-obj-wood-paint" />
    <line x1="${x0 + 11}" y1="${cy - 1.5}" x2="${x1 - 12}" y2="${cy - 1.5}" class="rg-obj-pencil-line" />
    <polygon points="${x1 - 12},${cy - 5} ${x1 - 3},${cy - 1.5} ${x1 - 3},${cy + 1.5} ${x1 - 12},${cy + 5}" class="rg-obj-wood" />
    <polygon points="${x1 - 3},${cy - 1.5} ${x1},${cy} ${x1 - 3},${cy + 1.5}" class="rg-obj-graphite" />`;
}
const SILHOUETTES = {
  llave: svgKey,
  cuchara: svgSpoon,
  tornillo: svgScrew,
  pila: svgBattery,
  clip: svgClip,
  tiza: svgChalk,
  cepillo: svgToothbrush,
  lapiz: svgPencil,
};

export function objectSvg(round) {
  const x0 = round.a * PX_PER_CM;
  const x1 = (round.a + round.length) * PX_PER_CM;
  const draw = SILHOUETTES[round.object.id];
  return `<g class="rg-object" data-object data-start-px="${x0}" data-end-px="${x1}">`
    + draw(x0, x1, OBJ_CY)
    + `<text x="${(x0 + x1) / 2}" y="${OBJ_CY + 26}" class="rg-obj-name">${round.object.name}</text>`
    + `</g>`
    // Guías verticales desde los extremos del objeto hasta la regla: en
    // la vida real se mira en perpendicular para leer la marca.
    + `<line x1="${x0}" y1="${OBJ_CY + 12}" x2="${x0}" y2="${RULER_Y}" class="rg-guide" />`
    + `<line x1="${x1}" y1="${OBJ_CY + 12}" x2="${x1}" y2="${RULER_Y}" class="rg-guide" />`;
}

// La regla se dibuja en coordenadas locales donde su "0" está en x=0; el
// <g> se traslada r·PX_PER_CM. La rota empieza con un borde dentado justo
// antes de su primera marca.
export function rulerSvg(ruler) {
  const { first, last, labelEvery, broken } = ruler;
  const xL = first * PX_PER_CM - (broken ? 5 : 7);
  const xR = last * PX_PER_CM + 7;
  const y0 = RULER_Y;
  const y1 = RULER_Y + RULER_H;
  let body;
  if (broken) {
    const zig = [];
    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const y = y0 + (RULER_H * i) / steps;
      zig.push(`${xL + (i % 2 ? 4 : 0)},${y}`);
    }
    body = `<polygon points="${zig.join(" ")} ${xR},${y1} ${xR},${y0}" class="rg-rule-body" />`;
  } else {
    body = `<rect x="${xL}" y="${y0}" width="${xR - xL}" height="${RULER_H}" rx="4" class="rg-rule-body" />`;
  }
  let ticks = "";
  for (let k = first; k <= last; k++) {
    const x = k * PX_PER_CM;
    ticks += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y0 + 15}" class="rg-rule-tick rg-rule-tick-cm" />`;
    if (k % labelEvery === 0) {
      ticks += `<text x="${x}" y="${y0 + 29}" class="rg-rule-num">${k}</text>`;
    }
    if (k < last) {
      ticks += `<line x1="${x + PX_PER_CM / 2}" y1="${y0}" x2="${x + PX_PER_CM / 2}" y2="${y0 + 9}" class="rg-rule-tick" />`;
      ticks += `<line x1="${x + PX_PER_CM / 4}" y1="${y0}" x2="${x + PX_PER_CM / 4}" y2="${y0 + 5}" class="rg-rule-tick rg-rule-tick-mm" />`
        + `<line x1="${x + (3 * PX_PER_CM) / 4}" y1="${y0}" x2="${x + (3 * PX_PER_CM) / 4}" y2="${y0 + 5}" class="rg-rule-tick rg-rule-tick-mm" />`;
    }
  }
  const unit = `<text x="${xR - 10}" y="${y1 - 8}" class="rg-rule-unit">cm</text>`;
  const grip = `<text x="${((first + last) / 2) * PX_PER_CM}" y="${y1 - 7}" class="rg-rule-grip">↔</text>`;
  return body + ticks + unit + grip;
}

export function mountReglaGame(container, { client, onExit }) {
  const startLives = 3;
  const MAX_DIGITS = 2;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let timers = [];
  let round = null;
  let r = 0; // posición actual (cm de escena) del 0 de la regla
  let typed = "";
  let locked = false;
  let sceneEl, svgEl, rulerEl;

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
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }
  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function promptFor() {
    const { object, ruler, mode, fromMark } = round;
    const lvl = reglaLevelFor(streak);
    if (mode === "desde") {
      return {
        title: `Si el principio ${object.article === "el" ? "del" : "de la"} <b>${object.name}</b> está en la marca <b>${fromMark}</b>, ¿en qué marca acaba?`,
        hint: "mide cuánto es y súmalo — o coloca la regla ahí y lee",
      };
    }
    const hints = [
      "el 0 de la regla está en el principio: lee dónde acaba",
      "la regla no empieza en el 0: alinéala arrastrando, o resta las dos marcas",
      `esta regla está rota (empieza en el ${ruler.first}) y sólo tiene números de 5 en 5: resta el principio al final`,
    ];
    return {
      title: `¿Cuántos cm mide ${object.article === "el" ? "el" : "la"} <b>${object.name}</b>?`,
      hint: hints[Math.min(lvl, 2)],
    };
  }

  function nextRound() {
    round = makeReglaRound(streak, round ? round.key : "");
    r = round.r;
    typed = "";
    locked = false;
    const { title, hint } = promptFor();

    body.innerHTML = `
      <div class="rg-wrap" data-mode="${round.mode}" data-from-mark="${round.fromMark}">
        <p class="prompt rg-prompt">${title}<small>${hint}</small></p>
        <div class="rg-scene" data-scene>
          <svg class="rg-svg" viewBox="0 0 ${VIEW_W} ${VIEW_H}" data-svg>
            ${objectSvg(round)}
            <g class="rg-ruler" data-ruler data-px-per-cm="${PX_PER_CM}"
               data-ruler-first-cm="${round.ruler.first}" data-ruler-last-cm="${round.ruler.last}">
              ${rulerSvg(round.ruler)}
            </g>
            <g class="rg-reveal" data-reveal></g>
          </svg>
        </div>
        <div class="rg-drag-hint">↔ arrastra la regla para colocarla donde quieras</div>
        <div class="keypad-display" data-display>&nbsp;</div>
        <div class="keypad" data-keypad></div>
        <div class="feedback" data-feedback></div>
      </div>
    `;
    sceneEl = body.querySelector("[data-scene]");
    svgEl = body.querySelector("[data-svg]");
    rulerEl = body.querySelector("[data-ruler]");

    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key";
      btn.type = "button";
      btn.textContent = key;
      if (key === "⌫") {
        btn.setAttribute("data-backspace", "");
        btn.addEventListener("click", pressBackspace);
      } else if (key === "✓") {
        btn.setAttribute("data-submit", "");
        btn.addEventListener("click", submit);
      } else {
        btn.setAttribute("data-digit", key);
        btn.addEventListener("click", () => pressDigit(key));
      }
      pad.appendChild(btn);
    });

    bindDrag();
    renderRuler();
    renderDisplay();
  }

  function renderRuler() {
    const px = r * PX_PER_CM;
    rulerEl.setAttribute("transform", `translate(${px} 0)`);
    rulerEl.setAttribute("data-ruler-offset-px", String(px));
  }

  function setRuler(cm) {
    const { min, max } = rulerRange(round);
    r = clamp(Math.round(cm), min, max);
    renderRuler();
  }

  function bindDrag() {
    let dragging = false;
    let startX = 0;
    let startR = 0;
    function scale() {
      return svgEl.getBoundingClientRect().width / VIEW_W;
    }
    function onDown(e) {
      if (finished || locked) return;
      dragging = true;
      startX = e.clientX;
      startR = r;
      sceneEl.classList.add("rg-dragging");
      try { sceneEl.setPointerCapture(e.pointerId); } catch (_) {}
    }
    function onMove(e) {
      if (!dragging || finished || locked) return;
      setRuler(startR + (e.clientX - startX) / scale() / PX_PER_CM);
    }
    function onUp() {
      dragging = false;
      sceneEl.classList.remove("rg-dragging");
    }
    sceneEl.addEventListener("pointerdown", onDown);
    sceneEl.addEventListener("pointermove", onMove);
    sceneEl.addEventListener("pointerup", onUp);
    sceneEl.addEventListener("pointercancel", onUp);
  }

  function renderDisplay() {
    body.querySelector("[data-display]").textContent = typed || " ";
  }
  function pressDigit(d) {
    if (finished || locked) return;
    if (typed.length >= MAX_DIGITS) return;
    typed = typed === "0" ? d : typed + d;
    renderDisplay();
  }
  function pressBackspace() {
    if (finished || locked) return;
    typed = typed.slice(0, -1);
    renderDisplay();
  }

  // Lecturas ACTUALES (donde el jugador ha dejado la regla): la explicación
  // usa esas, que son las que tiene delante.
  function readings() {
    return { s: round.a - r, e: round.a + round.length - r };
  }

  function explanation() {
    const { s, e } = readings();
    const L = round.length;
    const resta = s === 0
      ? `el 0 está en el principio y acaba en el ${e}: mide ${L} cm`
      : `empieza en el ${s} y acaba en el ${e}: ${e} − ${s} = ${L} cm`;
    if (round.mode === "desde") {
      return `${resta}. Con el principio en el ${round.fromMark} acabaría en el ${round.fromMark} + ${L} = ${round.answer}`;
    }
    return resta;
  }

  // Al resolver se rotulan sobre la regla las dos lecturas que había que
  // leer, para que la resta se VEA sobre el dibujo.
  function reveal(good) {
    const { s, e } = readings();
    const x0 = round.a * PX_PER_CM;
    const x1 = (round.a + round.length) * PX_PER_CM;
    const cls = good ? "rg-reveal-good" : "rg-reveal-bad";
    body.querySelector("[data-reveal]").innerHTML = `
      <rect x="${x0}" y="${RULER_Y - 3}" width="${x1 - x0}" height="3" class="${cls}" />
      <text x="${x0}" y="${RULER_Y - 7}" class="rg-reveal-num ${cls}">${s}</text>
      <text x="${x1}" y="${RULER_Y - 7}" class="rg-reveal-num ${cls}">${e}</text>
    `;
  }

  function submit() {
    if (finished || locked || typed === "") return;
    const guess = Number(typed);
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");

    if (guess === round.answer) {
      streak++;
      score += 10;
      renderScore();
      reveal(true);
      feedback.textContent = `¡Exacto! ${explanation()}`;
      feedback.className = "feedback ok";
      later(nextRound, 1500);
      return;
    }

    streak = 0;
    lives--;
    renderLives();
    reveal(false);
    feedback.textContent = `No: ${explanation()}`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 2800);
    later(nextRound, 2800);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "regla", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📏</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} objetos medidos</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>
    `;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    clearTimers();
    lives = startLives;
    score = 0;
    rounds = 0;
    streak = 0;
    round = null;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimers();
  };
}
