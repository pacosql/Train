// "Conversión deslizante": arrastra un marcador sobre una regla de
// destino hasta que coincida con la conversión exacta de la cantidad de
// origen mostrada. Pares de unidades ligados por potencias de 10
// (mm-cm, cm-m, m-km, g-kg, mL-L) para que la conversión sea siempre
// exacta. La cantidad de destino se elige SIEMPRE como una de las
// marcas discretas de su regla (nunca un valor intermedio), así el
// snap del arrastre (por índice de marca, no por píxel) nunca es
// ambiguo.
import { randInt, pick, clamp, saveScore } from "./utils.js";

// Cada par: unidad pequeña / unidad grande y el factor tal que
// 1 <big> = factor <small>.
const PAIRS = [
  { small: "mm", big: "cm", factor: 10 },
  { small: "cm", big: "m", factor: 100 },
  { small: "m", big: "km", factor: 1000 },
  { small: "g", big: "kg", factor: 1000 },
  { small: "mL", big: "L", factor: 1000 },
];

// Nombres completos en español para el enunciado (las reglas usan el
// símbolo abreviado, que es lo que se ve en clase).
const UNIT_NAMES = {
  mm: "milímetros",
  cm: "centímetros",
  m: "metros",
  km: "kilómetros",
  g: "gramos",
  kg: "kilogramos",
  mL: "mililitros",
  L: "litros",
};

// Configuración de nº de marcas por dirección de conversión. En la
// dirección "hacia la unidad grande" la regla de destino tiene paso
// 0.5 (o 1 para mm-cm, que ya trabaja con números pequeños) para que
// aparezcan valores con decimales tipo 3,5 m. En la dirección
// contraria ("hacia la unidad pequeña") el origen es siempre un entero
// de la unidad grande y el destino cae siempre en un múltiplo exacto
// del factor.
const DIR_CONFIG = {
  "mm-cm": { toBigN: 10, toBigStep: 1, toSmallN: 10 },
  "cm-m": { toBigN: 8, toBigStep: 0.5, toSmallN: 4 },
  "m-km": { toBigN: 8, toBigStep: 0.5, toSmallN: 4 },
  "g-kg": { toBigN: 8, toBigStep: 0.5, toSmallN: 4 },
  "mL-L": { toBigN: 8, toBigStep: 0.5, toSmallN: 4 },
};

function pairKey(pair) {
  return `${pair.small}-${pair.big}`;
}

// Evita el polvo de coma flotante de i * 0.5 (que en realidad ya es
// exacto en binario, pero así queda documentada la intención: nunca
// comparamos floats "a pelo").
function roundDust(v) {
  return Math.round(v * 1000) / 1000;
}

// Genera una ronda: qué cantidad se muestra, en qué unidad hay que
// darla, y las marcas discretas (en la unidad de origen y en la de
// destino) de las dos reglas — alineadas por índice, así el mismo
// índice `i` en ambas reglas siempre representa la misma cantidad
// física. `idx` es el índice objetivo, y por construcción
// toMarks[idx] === toValue siempre, sin margen de error.
export function generateConversionRound() {
  const pair = pick(PAIRS);
  const cfg = DIR_CONFIG[pairKey(pair)];
  const toBig = randInt(0, 1) === 0;

  let N, fromUnit, toUnit, fromStep, toStep;
  if (toBig) {
    // Origen en unidad pequeña, destino en unidad grande (ej. cm -> m).
    N = cfg.toBigN;
    toStep = cfg.toBigStep;
    fromStep = cfg.toBigStep * pair.factor; // entero, siempre exacto
    fromUnit = pair.small;
    toUnit = pair.big;
  } else {
    // Origen en unidad grande (siempre entero), destino en pequeña.
    N = cfg.toSmallN;
    fromStep = 1;
    toStep = pair.factor;
    fromUnit = pair.big;
    toUnit = pair.small;
  }

  const idx = randInt(1, N); // nunca 0: siempre hay que arrastrar de verdad
  const fromMarks = Array.from({ length: N + 1 }, (_, i) => roundDust(i * fromStep));
  const toMarks = Array.from({ length: N + 1 }, (_, i) => roundDust(i * toStep));
  const fromValue = fromMarks[idx];
  const toValue = toMarks[idx];

  return {
    pair,
    factor: pair.factor,
    toBig,
    N,
    idx,
    fromUnit,
    toUnit,
    fromValue,
    toValue,
    fromMarks,
    marks: toMarks, // alias pedido por el contrato: marcas de la regla de destino
    toMarks,
  };
}

function fmtNum(v) {
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(1).replace(".", ",");
}
function fmtQty(v, unit) {
  return `${fmtNum(v)} ${unit}`;
}

export function mountConversionGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let timers = [];

  let round = null;
  let curIdx = 0; // índice actual del marcador de destino mientras se arrastra
  let dragging = false;
  let locked = false; // evita doble evaluación tras soltar, hasta la ronda siguiente
  let toRulerEl, toMarkerEl, readoutEl;

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

  function ticksHtml(marks) {
    const N = marks.length - 1;
    return marks
      .map((v, i) => {
        const pct = (i / N) * 100;
        return `<div class="cnv-tick" style="left:${pct}%"><span class="cnv-tick-line"></span><span class="cnv-tick-label">${fmtNum(v)}</span></div>`;
      })
      .join("");
  }

  function nextRound() {
    locked = false;
    dragging = false;
    round = generateConversionRound();

    // El marcador de destino arranca en un índice distinto del correcto,
    // para obligar a arrastrar de verdad.
    let startIdx = 0;
    if (startIdx === round.idx) startIdx = round.N;
    curIdx = startIdx;

    body.innerHTML = `
      <p class="prompt">Convierte <b>${fmtQty(round.fromValue, round.fromUnit)}</b> a ${UNIT_NAMES[round.toUnit]}
        <small>Arrastra el marcador 🔘 hasta la marca correcta</small>
      </p>
      <div class="cnv-wrap">
        <div class="cnv-ruler-group">
          <div class="cnv-ruler-label">${round.fromUnit}</div>
          <div class="cnv-ruler cnv-ruler-from">
            <div class="cnv-track"></div>
            ${ticksHtml(round.fromMarks)}
            <div class="cnv-marker cnv-marker-from" style="left:${(round.idx / round.N) * 100}%">📍</div>
          </div>
        </div>
        <div class="cnv-ruler-group">
          <div class="cnv-ruler-label">${round.toUnit}</div>
          <div class="cnv-ruler cnv-ruler-to" data-to-ruler>
            <div class="cnv-track"></div>
            ${ticksHtml(round.toMarks)}
            <div class="cnv-marker cnv-marker-to" data-to-marker style="left:${(curIdx / round.N) * 100}%">🔘</div>
          </div>
        </div>
      </div>
      <div class="cnv-readout" data-readout></div>
      <div class="feedback" data-feedback></div>
    `;
    toRulerEl = body.querySelector("[data-to-ruler]");
    toMarkerEl = body.querySelector("[data-to-marker]");
    readoutEl = body.querySelector("[data-readout]");
    updateReadout();
    bindDrag();
  }

  function updateReadout() {
    readoutEl.textContent = `Marcador en: ${fmtQty(round.toMarks[curIdx], round.toUnit)}`;
  }

  function setMarkerIdx(i) {
    curIdx = clamp(Math.round(i), 0, round.N);
    toMarkerEl.style.left = `${(curIdx / round.N) * 100}%`;
    updateReadout();
  }

  function idxFromClientX(clientX) {
    const rect = toRulerEl.getBoundingClientRect();
    const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
    return pct * round.N;
  }

  // Arrastre con Pointer Events (mouse y touch por igual). Usamos
  // setPointerCapture sobre la propia regla, igual que game-recta.js y
  // game-termometro.js: así los listeners se quedan en el elemento
  // (que se destruye entero en cada nextRound() al reescribir
  // body.innerHTML) y nunca hace falta engancharlos a document/window
  // ni desengancharlos aparte — se van con el DOM de la ronda.
  function bindDrag() {
    function onDown(e) {
      if (locked) return;
      dragging = true;
      setMarkerIdx(idxFromClientX(e.clientX));
      toRulerEl.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      if (!dragging || locked) return;
      setMarkerIdx(idxFromClientX(e.clientX));
    }
    function onUp(e) {
      if (!dragging || locked) return;
      dragging = false;
      setMarkerIdx(idxFromClientX(e.clientX));
      evaluate();
    }
    function onCancel() {
      dragging = false;
    }
    toRulerEl.addEventListener("pointerdown", onDown);
    toRulerEl.addEventListener("pointermove", onMove);
    toRulerEl.addEventListener("pointerup", onUp);
    toRulerEl.addEventListener("pointercancel", onCancel);
  }

  function evaluate() {
    if (finished || locked) return;
    locked = true;
    const feedback = body.querySelector("[data-feedback]");
    if (curIdx === round.idx) {
      score += 10;
      rounds++; // "rounds" cuenta conversiones ACERTADAS (así lo pinta el end-card)
      renderScore();
      feedback.textContent = "¡Conversión exacta!";
      feedback.className = "feedback ok";
      later(nextRound, 700);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Esa marca no es correcta — ${fmtQty(round.fromValue, round.fromUnit)} = ${fmtQty(round.toValue, round.toUnit)}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 900);
      later(nextRound, 1200);
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "conversion", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔁</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} conversiones acertadas</p>
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
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
  };
}
