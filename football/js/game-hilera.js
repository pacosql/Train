// "La hilera que sube": regla al estilo Qwixx — en una fila los números
// solo se pueden marcar en orden ESTRICTAMENTE CRECIENTE (nunca uno menor
// o igual que el último ya marcado), y marcar el N-ésimo número de la fila
// vale exactamente N puntos. El jugador ve la fila ya marcada y un número
// candidato, y debe decir cuántos puntos daría marcarlo ahí (0 si no se
// puede).
import { randInt, saveScore } from "./utils.js";

const MAX_DIGITS = 2; // respuestas 0-99 (en la práctica siempre 0-5)

// Genera una fila de `markedCount` números YA marcados, en orden
// estrictamente creciente, entre 1 y 11: empieza pequeño y añade
// randInt(1,3) cada vez, así con hasta 4 marcados nunca se sale de rango
// (peor caso: 2, 5, 8, 11).
function buildMarked(markedCount) {
  const marked = [];
  if (markedCount > 0) {
    let last = randInt(1, 2);
    marked.push(last);
    for (let i = 1; i < markedCount; i++) {
      last += randInt(1, 3);
      marked.push(last);
    }
  }
  return marked;
}

export function generateHileraRound() {
  const markedCount = randInt(0, 4);
  const marked = buildMarked(markedCount);
  const lastMarked = marked.length ? marked[marked.length - 1] : null;

  // Si no hay marcados, cualquier candidato es válido por definición.
  const wantValid = marked.length === 0 ? true : Math.random() < 0.5;

  let candidate;
  if (wantValid) {
    candidate = lastMarked === null ? randInt(1, 12) : lastMarked + randInt(1, 3);
  } else {
    // Solo posible si hay al menos un marcado: candidato <= último marcado.
    candidate = randInt(1, lastMarked);
  }

  const answer = (marked.length === 0 || candidate > lastMarked) ? marked.length + 1 : 0;

  return { marked, candidate, answer };
}

const ORDINALS = { 1: "1er", 2: "2º", 3: "3er", 4: "4º", 5: "5º" };
function ordinal(n) {
  return ORDINALS[n] || `${n}º`;
}

export function mountHileraGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let typed = "";
  let locked = false;
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

  function rowHtml() {
    if (round.marked.length === 0) {
      return `<span class="hil-empty">Fila vacía — todavía no hay nada marcado</span>`;
    }
    return round.marked
      .map((v) => `<div class="hil-bubble"><span class="hil-num">${v}</span></div>`)
      .join(`<div class="hil-arrow">→</div>`);
  }

  function nextRound() {
    round = generateHileraRound();
    typed = "";
    locked = false;

    body.innerHTML = `
      <p class="prompt">La hilera que sube<small>En una fila solo se marca en orden creciente</small></p>
      <div class="hil-row" data-row>${rowHtml()}</div>
      <p class="hil-question">
        Te sale un <span class="hil-candidate">${round.candidate}</span> —
        ¿cuántos puntos te daría marcarlo aquí?
        <small>(escribe 0 si no se puede)</small>
      </p>
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
    `;

    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key";
      btn.type = "button";
      btn.textContent = key;
      if (key === "⌫") {
        btn.setAttribute("data-backspace", "");
        btn.addEventListener("click", () => pressBackspace());
      } else if (key === "✓") {
        btn.setAttribute("data-submit", "");
        btn.addEventListener("click", () => submit());
      } else {
        btn.setAttribute("data-digit", key);
        btn.addEventListener("click", () => pressDigit(key));
      }
      pad.appendChild(btn);
    });

    renderDisplay();
  }

  function renderDisplay() {
    body.querySelector("[data-display]").textContent = typed || " ";
  }

  function pressDigit(d) {
    if (finished || locked) return;
    if (typed.length >= MAX_DIGITS) return;
    if (typed === "0") typed = d;
    else typed += d;
    renderDisplay();
  }

  function pressBackspace() {
    if (finished || locked) return;
    typed = typed.slice(0, -1);
    renderDisplay();
  }

  function explanation() {
    const { marked, candidate, answer } = round;
    if (marked.length === 0) {
      return (
        `La fila estaba vacía, así que cualquier número se puede marcar: ` +
        `${candidate} sería el ${ordinal(answer)} número de la fila, ${answer} punto${answer === 1 ? "" : "s"}.`
      );
    }
    const lastMarked = marked[marked.length - 1];
    if (answer === 0) {
      return (
        `El último marcado es el ${lastMarked}. Como ${candidate} no es mayor que ${lastMarked}, ` +
        `NO se puede marcar: la respuesta correcta era 0.`
      );
    }
    return (
      `El último marcado es el ${lastMarked}. Como ${candidate} es mayor, se puede marcar y sería ` +
      `el ${ordinal(answer)} número de la fila: ${answer} puntos.`
    );
  }

  function submit() {
    if (finished || locked || typed === "") return;
    const guess = Number(typed);
    locked = true;
    const feedback = body.querySelector("[data-feedback]");

    if (guess === round.answer) {
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${explanation()}`;
      feedback.className = "feedback ok";
      later(nextRound, 1800);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `No es correcto. ${explanation()}`;
      feedback.className = "feedback bad";
      if (lives <= 0) {
        later(() => finish(false), 1800);
      } else {
        later(nextRound, 2400);
      }
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "hilera", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🪜</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} filas resueltas</p>
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
