// "Apila cajas": rellenar el volumen exacto de un almacén eligiendo el
// subconjunto correcto de cajas candidatas. La ronda se genera al revés
// (se fija primero la solución y se suman sus volúmenes reales para
// obtener el objetivo) y se verifica por fuerza bruta, probando todos los
// subconjuntos posibles de las cajas mostradas, que existe EXACTAMENTE un
// subconjunto no vacío cuya suma da el objetivo — así nunca hay ambigüedad
// entre varias combinaciones válidas.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const DIM_MIN = 2;
const DIM_MAX = 8;
const TARGET_MAX = 800;
const MAX_GEN_ATTEMPTS = 20000;

// Cuenta cuántos subconjuntos no vacíos de `vols` suman exactamente
// `target`, probando todas las combinaciones (como mucho 2^6 = 64 con el
// número de cajas que maneja este juego, trivial de recorrer entero).
function countMatchingSubsets(vols, target) {
  const n = vols.length;
  let count = 0;
  for (let mask = 1; mask < (1 << n); mask++) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) sum += vols[i];
    }
    if (sum === target) count++;
  }
  return count;
}

// Genera una ronda: entre 4 y 6 cajas con dimensiones enteras (2-8 cm por
// lado), de las cuales entre 2 y 4 forman la solución elegida al azar (su
// suma de volúmenes fija el objetivo del almacén) y el resto son señuelos.
// Se descarta y regenera cualquier combinación en la que exista más de un
// subconjunto — o ninguno aparte del generado, lo cual no puede pasar—
// cuya suma dé el objetivo exacto, garantizando solución única.
export function generateAlmacenRound(lastTarget = -1) {
  for (let attempt = 0; attempt < MAX_GEN_ATTEMPTS; attempt++) {
    const totalBoxes = randInt(4, 6);
    const validSolCounts = [];
    for (let k = 2; k <= 4; k++) {
      const decoyCount = totalBoxes - k;
      if (decoyCount >= 2 && decoyCount <= 4) validSolCounts.push(k);
    }
    if (validSolCounts.length === 0) continue;
    const solCount = pick(validSolCounts);

    const boxes = [];
    for (let i = 0; i < totalBoxes; i++) {
      const l = randInt(DIM_MIN, DIM_MAX);
      const w = randInt(DIM_MIN, DIM_MAX);
      const h = randInt(DIM_MIN, DIM_MAX);
      boxes.push({ l, w, h, vol: l * w * h });
    }

    const order = shuffle(boxes.map((_, i) => i));
    const solIndices = order.slice(0, solCount);
    const target = solIndices.reduce((sum, i) => sum + boxes[i].vol, 0);
    if (target <= 0 || target > TARGET_MAX || target === lastTarget) continue;

    const volumes = boxes.map((b) => b.vol);
    if (countMatchingSubsets(volumes, target) !== 1) continue;

    return { target, boxes: shuffle(boxes), unit: "cm³" };
  }
  // No debería llegar nunca aquí con los parámetros de arriba (el espacio
  // de combinaciones es enorme frente a 20000 intentos), pero si pasara
  // preferimos avisar con claridad antes que servir una ronda ambigua.
  throw new Error("No se pudo generar una ronda de almacén válida");
}

export function mountAlmacenGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita tocar cajas mientras se resuelve la ronda
  let lastTarget = -1;
  let round = null;
  let selected = new Set(); // índices de cajas seleccionadas en esta ronda
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

  function nextRound() {
    round = generateAlmacenRound(lastTarget);
    lastTarget = round.target;
    selected = new Set();
    locked = false;

    body.innerHTML = `
      <p class="prompt">Rellena el almacén con exactamente <b>${round.target} cm³</b>
        <small>Toca las cajas que sumen justo ese volumen — ni de más ni de menos. Vuelve a tocarlas para soltarlas.</small>
      </p>
      <div class="alm-warehouse" data-warehouse>
        <span class="alm-warehouse-emoji">🏬</span>
        <span class="alm-target">${round.target} cm³</span>
      </div>
      <div class="alm-boxes" data-boxes></div>
      <div class="feedback" data-feedback></div>
      <button class="primary alm-done-btn" type="button" data-done>¡Listo!</button>
    `;

    const boxesEl = body.querySelector("[data-boxes]");
    round.boxes.forEach((box, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn alm-box";
      btn.dataset.box = String(idx);
      btn.innerHTML = `
        <span class="alm-box-emoji">📦</span>
        <span class="alm-box-dims">${box.l}×${box.w}×${box.h}</span>
        <span class="alm-box-unit">cm</span>
      `;
      btn.addEventListener("click", () => toggleBox(idx, btn));
      boxesEl.appendChild(btn);
    });
    body.querySelector("[data-done]").addEventListener("click", evaluar);
  }

  function toggleBox(idx, btn) {
    if (finished || locked) return;
    if (selected.has(idx)) {
      selected.delete(idx);
      btn.classList.remove("alm-selected");
    } else {
      selected.add(idx);
      btn.classList.add("alm-selected");
    }
  }

  function evaluar() {
    if (finished || locked) return;
    locked = true;
    const { target, boxes } = round;
    const chosen = Array.from(selected).map((i) => boxes[i]);
    const total = chosen.reduce((sum, b) => sum + b.vol, 0);
    const feedback = body.querySelector("[data-feedback]");

    // Se acepta cualquier subconjunto de cajas tocadas cuya suma dé el
    // objetivo exacto — no se compara con "la solución" generada, sino
    // por el total sumado (por construcción hay una única combinación
    // posible, así que cualquier acierto real es necesariamente esa).
    if (chosen.length > 0 && total === target) {
      rounds++;
      score += 10;
      renderScore();
      const desglose = chosen.map((b) => `${b.l}×${b.w}×${b.h}`).join(" + ");
      feedback.textContent = `¡Correcto! ${desglose} = ${total} cm³. El almacén queda lleno.`;
      feedback.className = "feedback ok";
      later(() => { locked = false; nextRound(); }, 1000);
      return;
    }

    rounds++;
    lives--;
    renderLives();
    let mensaje;
    if (chosen.length === 0) {
      mensaje = `No has metido ninguna caja: el almacén necesitaba ${target} cm³.`;
    } else {
      const desglose = chosen.map((b) => `${b.l}×${b.w}×${b.h}`).join(" + ");
      const diff = target - total;
      const comparacion = diff > 0 ? `te faltan ${diff} cm³` : `te sobran ${-diff} cm³`;
      mensaje = `${desglose} = ${total} cm³, pero el almacén necesita ${target} cm³ (${comparacion}).`;
    }
    feedback.textContent = mensaje;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 1300);
    later(() => { locked = false; nextRound(); }, 1700);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "almacen", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🏬</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} almacenes llenados</p>
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
    lives = startLives;
    score = 0;
    rounds = 0;
    finished = false;
    lastTarget = -1;
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
