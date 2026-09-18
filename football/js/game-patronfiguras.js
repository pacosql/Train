// "El patrón que crece": patrón visual de fichas que crece de forma
// LINEAL paso a paso (inspirado en la rutina de aula "Visual Patterns" de
// Fawn Nguyen / Kent Haines). Se dibujan los pasos 1, 2 y 3 con fichas
// que el jugador puede contar, y se pregunta cuántas fichas tendría un
// paso LEJANO (entre 5 y 8) que NO se dibuja — así hay que deducir la
// regla de crecimiento (cuántas fichas se añaden en cada paso) en vez de
// simplemente seguir dibujando a mano.
import { randInt, saveScore } from "./utils.js";

const MAX_DIGITS = 2; // respuesta máxima posible: 5 + 4*7 = 33

// Genera una ronda: el paso 1 tiene `a` fichas, cada paso siguiente añade
// `b` fichas más, y se pregunta por un paso lejano (5 a 8) que no se
// dibuja, para forzar a deducir la regla en vez de contar a mano.
export function generatePatronfigurasRound() {
  const a = randInt(1, 5);
  const b = randInt(1, 4);
  const targetStep = randInt(5, 8);
  const count = (n) => a + b * (n - 1);
  const answer = count(targetStep);

  return {
    a,
    b,
    targetStep,
    answer,
    step1: count(1),
    step2: count(2),
    step3: count(3),
  };
}

export function mountPatronfigurasGame(container, { client, onExit }) {
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

  function tilesHtml(count) {
    let html = "";
    for (let i = 0; i < count; i++) html += `<div class="pfg-tile"></div>`;
    return html;
  }

  function stepHtml(label, count) {
    return `
      <div class="pfg-step">
        <div class="pfg-step-label">${label}</div>
        <div class="pfg-tiles">${tilesHtml(count)}</div>
      </div>
    `;
  }

  function nextRound() {
    round = generatePatronfigurasRound();
    typed = "";
    locked = false;

    body.innerHTML = `
      <p class="prompt">Este patrón de fichas crece paso a paso. Aquí tienes los 3 primeros pasos:</p>
      <div class="pfg-steps">
        ${stepHtml("Paso 1", round.step1)}
        ${stepHtml("Paso 2", round.step2)}
        ${stepHtml("Paso 3", round.step3)}
      </div>
      <p class="prompt">¿Cuántas fichas tendría el <b>paso ${round.targetStep}</b>? <small>(no está dibujado, ¡hay que deducirlo!)</small></p>
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
    return (
      `El paso 1 tiene ${round.a} ficha${round.a === 1 ? "" : "s"} y cada paso siguiente añade ` +
      `${round.b} más, así que el paso ${round.targetStep} tiene ` +
      `${round.a} + ${round.b}×${round.targetStep - 1} = ${round.answer} fichas.`
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
    saveScore(client, "patronfiguras", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🌱</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} patrones deducidos</p>
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
