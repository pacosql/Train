// "La fila que cuadra": inspirado en el juego de mesa Sumoku (Blue Orange
// Games), donde las filas y columnas deben sumar un múltiplo de una
// "clave". Aquí, simplificado a una sola fila con un hueco: se muestran 4
// fichas fijas y hay que elegir, de un banco de 4 candidatas, la única que
// hace que la suma total sea múltiplo de la clave.
import { randInt, pick, saveScore } from "./utils.js";

// Construye la parte aleatoria de una ronda (fichas fijas + banco de
// candidatas) para una clave y unas fichas fijas ya decididas, intentando
// hasta 200 veces que el banco tenga EXACTAMENTE una candidata válida y
// las 4 sean distintas entre sí.
function buildCandidates(key, fixedSum) {
  let attempts = 0;
  while (attempts < 200) {
    attempts++;
    const candidates = [randInt(0, 9), randInt(0, 9), randInt(0, 9), randInt(0, 9)];
    if (new Set(candidates).size !== candidates.length) continue; // deben ser distintas
    const validIndices = [];
    candidates.forEach((c, i) => {
      if ((fixedSum + c) % key === 0) validIndices.push(i);
    });
    if (validIndices.length === 1) {
      return { candidates, correctIndex: validIndices[0] };
    }
  }
  return null;
}

// Ronda de emergencia por si, en un caso extremadamente improbable, ni
// siquiera 20 intentos de fichas fijas nuevas + 200 intentos de banco cada
// una lograran cuadrar: la partida nunca debe quedarse sin ronda.
// fixedSum = 4+6+2+3 = 15; con clave 4, el residuo objetivo es 1 (15%4=3,
// y 3+1=4), así que solo el 1 (de entre 1, 0, 2, 3) cumple: 15+1=16.
const FALLBACK = {
  key: 4,
  fixedTiles: [4, 6, 2, 3],
  candidates: [1, 0, 2, 3],
  correctIndex: 0,
};

export function generateSumafilaRound() {
  const key = pick([3, 4, 5]);
  for (let outer = 0; outer < 20; outer++) {
    const fixedTiles = [randInt(1, 9), randInt(1, 9), randInt(1, 9), randInt(1, 9)];
    const fixedSum = fixedTiles.reduce((a, b) => a + b, 0);
    const bank = buildCandidates(key, fixedSum);
    if (bank) {
      return { key, fixedTiles, candidates: bank.candidates, correctIndex: bank.correctIndex };
    }
  }
  return { ...FALLBACK };
}

export function mountSumafilaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let answered = false;
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
    if (finished) return;
    answered = false;
    round = generateSumafilaRound();
    body.innerHTML = `
      <p class="prompt">La fila que cuadra<small>Toca la ficha que completa la fila</small></p>
      <div class="smf-key-badge">Clave: ${round.key} — la suma total debe ser múltiplo de ${round.key}</div>
      <div class="smf-row" data-row></div>
      <div class="smf-candidates" data-candidates></div>
      <div class="feedback" data-feedback></div>
    `;
    const rowEl = body.querySelector("[data-row]");
    round.fixedTiles.forEach((val) => {
      const tile = document.createElement("div");
      tile.className = "smf-tile";
      tile.textContent = val;
      rowEl.appendChild(tile);
    });
    const hole = document.createElement("div");
    hole.className = "smf-tile smf-hole";
    hole.textContent = "?";
    hole.setAttribute("data-hole", "");
    rowEl.appendChild(hole);

    const candidatesEl = body.querySelector("[data-candidates]");
    round.candidates.forEach((val, i) => {
      const btn = document.createElement("button");
      btn.className = "smf-candidate";
      btn.textContent = val;
      btn.addEventListener("click", () => tapCandidate(i, btn, candidatesEl));
      candidatesEl.appendChild(btn);
    });
  }

  function tapCandidate(i, el, candidatesEl) {
    if (finished || answered) return;
    answered = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const hole = body.querySelector("[data-hole]");
    [...candidatesEl.children].forEach((c) => (c.disabled = true));
    const fixedSum = round.fixedTiles.reduce((a, b) => a + b, 0);
    const chosen = round.candidates[i];
    const total = fixedSum + chosen;
    const isCorrect = i === round.correctIndex && total % round.key === 0;
    const sumText = round.fixedTiles.join("+");
    if (isCorrect) {
      el.classList.add("correct");
      hole.textContent = chosen;
      hole.classList.add("correct");
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${sumText}+${chosen}=${total}, múltiplo de ${round.key}.`;
      feedback.className = "feedback ok";
      later(nextRound, 900);
    } else {
      el.classList.add("wrong");
      hole.textContent = chosen;
      hole.classList.add("wrong");
      const correctVal = round.candidates[round.correctIndex];
      const correctTotal = fixedSum + correctVal;
      candidatesEl.children[round.correctIndex].classList.add("correct");
      lives--;
      renderLives();
      feedback.textContent = `Elegiste ${chosen}: ${sumText}+${chosen}=${total}, no es múltiplo de ${round.key}. La correcta era ${correctVal}: ${sumText}+${correctVal}=${correctTotal}, sí es múltiplo de ${round.key}.`;
      feedback.className = "feedback bad";
      if (lives <= 0) later(() => finish(false), 1800);
      else later(nextRound, 1800);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "sumafila", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧮</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} filas completadas</p>
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
