// "Salta a la decena": la estrategia de la recta numérica vacía (bridging
// through ten) que se usa en Zearn/DreamBox/Singapore Math para sumar
// mentalmente. Para sumar a + b, primero se salta desde a hasta la
// siguiente decena, y luego se recorre el resto de b. Aquí se pregunta
// solo por el TAMAÑO de ese primer salto — la parte de la estrategia que
// hay que entender — no por el resultado final de la suma.
import { randInt, saveScore } from "./utils.js";

const MAX_DIGITS = 2; // el primer salto siempre está entre 1 y 9, pero el
// input admite hasta 2 cifras por si el jugador se equivoca al teclear.

// Genera una ronda pura, sin DOM.
export function generateSaltosRound() {
  let a;
  let b;
  let firstJump;
  do {
    do {
      a = randInt(11, 89);
    } while (a % 10 === 0);
    b = randInt(5, 60);
    firstJump = 10 - (a % 10);
  } while (!(b > firstJump));

  const landingAfterFirstJump = a + firstJump;
  const remainingJump = b - firstJump;
  const finalSum = a + b;

  return { a, b, firstJump, landingAfterFirstJump, remainingJump, finalSum };
}

export function mountSaltosGame(container, { client, onExit }) {
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

  function nextTen(n) {
    return n + (10 - (n % 10));
  }

  function nextRound() {
    round = generateSaltosRound();
    typed = "";
    locked = false;

    body.innerHTML = `
      <p class="slt-equation">${round.a} + ${round.b}</p>
      <div class="slt-line">
        <div class="slt-track"></div>
        <div class="slt-point" style="left: ${pointPercent(round.a)}%"></div>
        <span class="slt-point-label" style="left: ${pointPercent(round.a)}%">${round.a}</span>
      </div>
      <p class="prompt">
        Para sumar mentalmente, primero saltas desde ${round.a} hasta la
        siguiente decena (el ${nextTen(round.a)}).
        <small>¿Cuánto mide ese primer salto?</small>
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

  // Posición aproximada (en %) del punto `a` sobre la recta, solo para dar
  // contexto visual — la recta no lleva números ni marcas propias.
  function pointPercent(a) {
    return 15 + (a / 100) * 55; // deja siempre margen a ambos lados
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
    return (
      `El primer salto es de ${round.a} a ${round.landingAfterFirstJump}, así que mide ${round.firstJump}. ` +
      `Luego te quedan ${round.b}-${round.firstJump}=${round.remainingJump} para saltar: ` +
      `${round.landingAfterFirstJump}+${round.remainingJump}=${round.finalSum}. ` +
      `El resultado final es ${round.a}+${round.b}=${round.finalSum}.`
    );
  }

  function submit() {
    if (finished || locked || typed === "") return;
    const guess = Number(typed);
    locked = true;
    const feedback = body.querySelector("[data-feedback]");

    if (guess === round.firstJump) {
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
        later(() => finish(false), 2200);
      } else {
        later(nextRound, 2600);
      }
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "saltos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🦵</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} saltos resueltos</p>
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
