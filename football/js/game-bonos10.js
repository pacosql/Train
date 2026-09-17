// "Bonos de agujeros": inspirado en las fichas Numicon. Cada número del 1
// al 10 tiene SIEMPRE la misma figura fija de agujeros/círculos — nunca se
// imprime ningún dígito. Hay que reconocer de un vistazo (subitizar) qué
// ficha objetivo se muestra y encontrar en el banco las dos fichas cuya
// suma de agujeros la iguala. A diferencia de "Parejas que suman" (que
// muestra burbujas con números YA IMPRESOS), aquí el número nunca se ve:
// todo el juego se juega sobre el patrón visual de puntos.
import { randInt, shuffle, saveScore } from "./utils.js";

// Rejilla fija de 2 columnas x 5 filas para representar cada valor 1-10.
// Regla (inspirada en las piezas Numicon): los pares forman un rectángulo
// completo de 2xN; los impares forman el rectángulo del siguiente par
// (2x(N+1)) al que le falta la esquina superior derecha. El resultado se
// centra verticalmente en la rejilla de 5 filas para que todas las fichas
// midan lo mismo. Es una función pura de "value" -> siempre las mismas
// posiciones para el mismo valor.
const GRID_ROWS = 5;
const GRID_COLS = 2;

export function numiconCells(value) {
  const odd = value % 2 === 1;
  const rows = odd ? (value + 1) / 2 : value / 2;
  const cells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (odd && r === 0 && c === 1) continue; // esquina que falta en los impares
      cells.push({ r, c });
    }
  }
  const pad = Math.floor((GRID_ROWS - rows) / 2);
  return cells.map(({ r, c }) => ({ r: r + pad, c }));
}

function buildTileEl(value, extraClass) {
  const tile = document.createElement("div");
  tile.className = "bn10-tile" + (extraClass ? ` ${extraClass}` : "");
  const on = new Set(numiconCells(value).map(({ r, c }) => `${r}-${c}`));
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const dot = document.createElement("span");
      dot.className = "bn10-dot" + (on.has(`${r}-${c}`) ? " on" : "");
      tile.appendChild(dot);
    }
  }
  return tile;
}

// Cuenta cuántos pares (i<j) del banco suman exactamente target. Se usa
// SOLO para construir la ronda (evitar señuelos ambiguos); el test de
// verificación hace su propia comprobación independiente.
function countPairsSummingTo(arr, target) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] + arr[j] === target) count++;
    }
  }
  return count;
}

// Genera una ronda: elige el objetivo T (4-10) y un par (a,b) distinto
// entre sí que sume T, y completa el banco con señuelos 1-9 comprobando
// por fuerza bruta que ningún otro par del banco final sume también T.
export function generateBonos10Round() {
  const target = randInt(4, 10);
  let a, b;
  do {
    a = randInt(1, 9);
    b = target - a;
  } while (b < 1 || b > 9 || b === a);

  let bank = [a, b];
  const bankSize = 2 + randInt(4, 6); // banco total de 6 a 8 fichas
  let guard = 0;
  while (bank.length < bankSize && guard < 2000) {
    guard++;
    const candidate = randInt(1, 9);
    const trial = bank.concat([candidate]);
    if (countPairsSummingTo(trial, target) !== 1) continue;
    bank = trial;
  }
  // Red de seguridad extremadamente improbable: si por mala suerte no se
  // completó el banco sin ambigüedad, se regenera la ronda entera.
  if (bank.length < bankSize) return generateBonos10Round();

  return { target, bank: shuffle(bank), a, b };
}

export function mountBonos10Game(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let round = null;
  let selected = new Set();
  let tileButtons = [];
  let confirmBtn = null;
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
    round = generateBonos10Round();
    selected = new Set();
    locked = false;

    body.innerHTML = `
      <p class="prompt">Busca 2 fichas del banco cuyos agujeros sumen los de la ficha objetivo
        <small>No hay números escritos: fíjate solo en el patrón. Toca dos fichas y confirma con "¡Listo!".</small>
      </p>
      <div class="bn10-target-wrap">
        <span class="bn10-target-label">Objetivo</span>
        <div class="bn10-tile-slot" data-target></div>
      </div>
      <div class="bn10-bank" data-bank></div>
      <div class="feedback" data-feedback></div>
      <button class="primary bn10-confirm-btn" type="button" data-done disabled>¡Listo!</button>
    `;

    const targetSlot = body.querySelector("[data-target]");
    targetSlot.appendChild(buildTileEl(round.target, "bn10-target"));

    const bankEl = body.querySelector("[data-bank]");
    tileButtons = [];
    round.bank.forEach((val, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn bn10-choice";
      btn.dataset.idx = String(idx);
      btn.appendChild(buildTileEl(val));
      btn.addEventListener("click", () => toggleTile(idx, btn));
      bankEl.appendChild(btn);
      tileButtons.push(btn);
    });

    confirmBtn = body.querySelector("[data-done]");
    confirmBtn.addEventListener("click", evaluar);
  }

  function toggleTile(idx, btn) {
    if (finished || locked) return;
    if (selected.has(idx)) {
      selected.delete(idx);
      btn.classList.remove("bn10-selected");
    } else {
      if (selected.size >= 2) return; // ya hay 2 fichas elegidas: destoca una primero
      selected.add(idx);
      btn.classList.add("bn10-selected");
    }
    confirmBtn.disabled = selected.size !== 2;
  }

  function evaluar() {
    if (finished || locked || selected.size !== 2) return;
    locked = true;
    confirmBtn.disabled = true;

    const idxs = Array.from(selected);
    const valores = idxs.map((i) => round.bank[i]);
    const suma = valores[0] + valores[1];
    const feedback = body.querySelector("[data-feedback]");
    rounds++;

    if (suma === round.target) {
      score += 10;
      renderScore();
      idxs.forEach((i) => tileButtons[i].classList.add("correct"));
      feedback.textContent = `¡Correcto! ${valores[0]} + ${valores[1]} = ${suma}, igual que el objetivo.`;
      feedback.className = "feedback ok";
      later(() => { locked = false; nextRound(); }, 900);
      return;
    }

    lives--;
    renderLives();
    idxs.forEach((i) => tileButtons[i].classList.add("wrong"));
    feedback.textContent = `La ficha objetivo tenía ${round.target} agujeros; elegiste ${valores[0]} y ${valores[1]}, que suman ${suma}, no ${round.target}.`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 1200);
    later(() => { locked = false; nextRound(); }, 1600);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "bonos10", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔵</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} bonos completados</p>
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
