// #50 "Mide con la regla" (Medidas) — REHECHO.
// Antes: se leía la longitud y se tocaba un número de la regla, o sea un
// test de opciones con dibujo de regla al lado (y encima se respondía una
// LONGITUD tocando una escala de POSICIONES).
// Ahora: un extremo del objeto está clavado en una marca que casi nunca es
// el 0 y hay que arrastrar el otro hasta que el objeto MIDA lo pedido. El
// número que se ve es la posición; el que se pide es la longitud, así que
// medir vuelve a ser sumar o restar. El gesto de estirar/recortar ES la
// medida.
import { randInt, pick, clamp, saveScore } from "./utils.js";

const PAD = 14; // px de margen interior: el 0 y el último cm no se salen

// La dificultad sube con la racha: más recorrido, arranque desplazado
// obligatorio, las dos direcciones de arrastre y, al final, una regla de
// 15 cm en la que sólo están numeradas las marcas de 5 en 5.
const LEVELS = [
  { cm: 12, labelEvery: 1, minLen: 2, maxLen: 5, minAnchor: 0, maxAnchor: 4, modes: ["estira"] },
  { cm: 12, labelEvery: 1, minLen: 2, maxLen: 7, minAnchor: 1, maxAnchor: 7, modes: ["estira", "corta"] },
  { cm: 15, labelEvery: 5, minLen: 3, maxLen: 9, minAnchor: 1, maxAnchor: 9, modes: ["estira", "corta"] },
];

export function reglaLevelFor(streak) {
  return streak >= 5 ? 2 : streak >= 2 ? 1 : 0;
}

// Intenta una ronda. Devuelve null si el azar da una configuración no
// jugable (no cabe en la regla, o no existe un arranque suficientemente
// lejos de la solución) — entonces hay que regenerar.
function tryRound(lv) {
  const mode = pick(lv.modes);
  const length = randInt(lv.minLen, lv.maxLen);
  let anchor = 0;
  let target = 0;
  if (mode === "estira") {
    // Extremo fijo a la izquierda: se estira hacia la derecha.
    const maxA = Math.min(lv.maxAnchor, lv.cm - length);
    if (maxA < lv.minAnchor) return null;
    anchor = randInt(lv.minAnchor, maxA);
    target = anchor + length;
  } else {
    // Extremo fijo a la derecha: se recorta moviendo el principio. El
    // mínimo length+2 deja hueco para un arranque distinto de la solución
    // y evita que la cinta tenga que empezar en el 0 (sería leer, no restar).
    const minA = length + 2;
    if (minA > lv.cm) return null;
    anchor = randInt(minA, lv.cm);
    target = anchor - length;
    if (target < 1) return null;
  }
  if (target < 0 || target > lv.cm) return null;

  // Arranque: longitud inicial distinta y a 2 cm o más de la pedida, con el
  // extremo libre dentro de la regla. Así nunca se resuelve sin arrastrar.
  const maxStart = mode === "estira" ? lv.cm - anchor : anchor;
  const cands = [];
  for (let l = 1; l <= maxStart; l++) {
    if (Math.abs(l - length) >= 2) cands.push(l);
  }
  if (!cands.length) return null;

  return {
    cm: lv.cm,
    labelEvery: lv.labelEvery,
    mode,
    anchor,
    length,
    target,
    startLength: pick(cands),
    key: `${mode}|${anchor}|${length}`,
  };
}

// Reserva determinista y válida en las tres reglas: sólo se usaría si el
// azar fallara 300 veces seguidas (la simulación dice que no pasa nunca).
function fallbackRound(lv) {
  return {
    cm: lv.cm,
    labelEvery: lv.labelEvery,
    mode: "estira",
    anchor: 2,
    length: 3,
    target: 5,
    startLength: 6,
    key: "reserva",
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
  return cand && cand.key !== lastKey ? cand : fallbackRound(lv);
}

export function mountReglaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let timers = [];
  let round = null;
  let freeMark = 0; // posición (cm) del extremo que se arrastra
  let locked = false;
  let stageEl, pencilEl, handleEl, cursorEl, posEl;

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

  // Misma proyección para regla, objeto y bandas: la posición dibujada de
  // un cm es siempre la misma, sea cual sea el ancho de la pantalla.
  function posAt(cm) {
    return `calc(${PAD}px + (100% - ${PAD * 2}px) * ${cm / round.cm})`;
  }
  function widthOf(len) {
    return `calc((100% - ${PAD * 2}px) * ${len / round.cm})`;
  }

  function nextRound() {
    round = makeReglaRound(streak, round ? round.key : "");
    freeMark = round.mode === "estira" ? round.anchor + round.startLength : round.anchor - round.startLength;
    locked = false;

    const estira = round.mode === "estira";
    const titulo = estira
      ? `Estira el lápiz hasta que mida <b>${round.length} cm</b>`
      : `Recorta la cinta hasta que mida <b>${round.length} cm</b>`;
    const pista = estira
      ? `está clavado en el <b>${round.anchor}</b> — arrastra la punta y suelta en la marca justa`
      : `su final está fijo en el <b>${round.anchor}</b> — arrastra el principio hasta la marca justa`;

    body.innerHTML = `
      <div class="rg-wrap">
        <p class="prompt rg-prompt">${titulo}<small>${pista}</small></p>
        <div class="rg-stage" data-stage>
          <div class="rg-lane">
            <div class="rg-piece${estira ? " rg-pencil" : " rg-tape"}" data-piece></div>
            <span class="rg-handle" data-handle></span>
          </div>
          <div class="rg-ruler" data-ruler></div>
        </div>
        <div class="rg-readout">${estira ? "acaba en el" : "empieza en el"} <b data-pos>—</b></div>
        <div class="feedback" data-feedback></div>
        <div class="rg-why" data-why></div>
        <button class="primary rg-confirm" data-confirm>Confirmar</button>
      </div>
    `;

    stageEl = body.querySelector("[data-stage]");
    pencilEl = body.querySelector("[data-piece]");
    handleEl = body.querySelector("[data-handle]");
    posEl = body.querySelector("[data-pos]");

    const ruler = body.querySelector("[data-ruler]");
    let marks = "";
    for (let i = 0; i <= round.cm; i++) {
      const rotulada = i % round.labelEvery === 0;
      marks += `<span class="rg-tick${rotulada ? " rg-tick-big" : ""}" style="left:${posAt(i)}">`
        + `<i class="rg-tick-line"></i>${rotulada ? `<b class="rg-tick-num">${i}</b>` : ""}</span>`;
    }
    // El cursor va dentro de la regla para compartir su origen exacto.
    ruler.innerHTML = `<span class="rg-band" data-band></span>`
      + `<span class="rg-band rg-band-good" data-good></span>`
      + marks
      + `<span class="rg-cursor" data-cursor></span>`;
    cursorEl = body.querySelector("[data-cursor]");

    body.querySelector("[data-confirm]").addEventListener("click", confirmar);
    bindDrag();
    renderPiece();
  }

  function renderPiece() {
    const a = Math.min(round.anchor, freeMark);
    const b = Math.max(round.anchor, freeMark);
    pencilEl.style.left = posAt(a);
    pencilEl.style.width = widthOf(b - a);
    pencilEl.classList.toggle("rg-flip", round.mode === "corta");
    handleEl.style.left = posAt(freeMark);
    cursorEl.style.left = posAt(freeMark);
    posEl.textContent = String(freeMark);
    // La banda gris repite bajo la regla el tramo que ocupa el objeto: la
    // longitud se ve como un trozo de regla, no como un número.
    const band = body.querySelector("[data-band]");
    band.style.left = posAt(a);
    band.style.width = widthOf(b - a);
    band.classList.add("on");
  }

  function setFree(cm) {
    // El objeto nunca puede desaparecer ni cruzar su extremo fijo: siempre
    // mide al menos 1 cm y cae sobre marcas enteras.
    const min = round.mode === "estira" ? round.anchor + 1 : 0;
    const max = round.mode === "estira" ? round.cm : round.anchor - 1;
    freeMark = clamp(Math.round(cm), min, max);
    renderPiece();
  }

  function bindDrag() {
    let dragging = false;
    function toCm(clientX) {
      const rect = stageEl.getBoundingClientRect();
      const util = rect.width - PAD * 2;
      const pct = clamp((clientX - rect.left - PAD) / util, 0, 1);
      return pct * round.cm;
    }
    function onDown(e) {
      if (finished || locked) return;
      dragging = true;
      setFree(toCm(e.clientX));
      try { stageEl.setPointerCapture(e.pointerId); } catch (_) {}
    }
    function onMove(e) {
      if (!dragging || finished || locked) return;
      setFree(toCm(e.clientX));
    }
    function onUp() { dragging = false; }
    stageEl.addEventListener("pointerdown", onDown);
    stageEl.addEventListener("pointermove", onMove);
    stageEl.addEventListener("pointerup", onUp);
    stageEl.addEventListener("pointercancel", onUp);
  }

  function confirmar() {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const why = body.querySelector("[data-why]");
    const mide = Math.abs(freeMark - round.anchor);

    if (mide === round.length) {
      streak++;
      score += 10;
      renderScore();
      const a = Math.min(round.anchor, freeMark);
      const b = Math.max(round.anchor, freeMark);
      feedback.textContent = `¡Exacto! De ${a} a ${b} hay ${round.length} cm`;
      feedback.className = "feedback ok";
      later(nextRound, 950);
      return;
    }

    streak = 0;
    lives--;
    renderLives();
    feedback.textContent = `Te ha quedado de ${Math.min(round.anchor, freeMark)} a ${Math.max(round.anchor, freeMark)}`;
    feedback.className = "feedback bad";

    // Al fallar se ve POR QUÉ: la resta que ha hecho su trozo, y el tramo
    // correcto pintado en verde encima de la regla con su operación.
    const a = Math.min(round.anchor, freeMark);
    const b = Math.max(round.anchor, freeMark);
    const cuenta = round.mode === "estira"
      ? `${round.anchor} + ${round.length} = ${round.target}, había que acabar en el ${round.target}`
      : `${round.anchor} − ${round.length} = ${round.target}, había que empezar en el ${round.target}`;
    why.innerHTML = `
      <span class="rg-why-bad">Tu trozo: de ${a} a ${b} → ${b} − ${a} = ${mide} cm</span>
      <span class="rg-why-good">Pedía ${round.length} cm: ${cuenta}</span>
    `;
    why.classList.add("on");
    const good = body.querySelector("[data-good]");
    const ga = Math.min(round.anchor, round.target);
    const gb = Math.max(round.anchor, round.target);
    good.style.left = posAt(ga);
    good.style.width = widthOf(gb - ga);
    good.classList.add("on");
    cursorEl.classList.add("wrong");
    // Y además el objeto se mueve solo a su sitio: se ve el tramo bueno.
    later(() => {
      freeMark = round.target;
      renderPiece();
      cursorEl.classList.remove("wrong");
      cursorEl.classList.add("right");
    }, 700);

    if (lives <= 0) return later(() => finish(false), 2300);
    later(nextRound, 2300);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "regla", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📏</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} medidas construidas</p>
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
