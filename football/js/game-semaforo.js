// "Verdadero o falso": igualdades a toda velocidad durante 30 segundos.
// Es contrarreloj, así que en la barra va un cronómetro en lugar de
// vidas: aquí el castigo por fallar es el tiempo perdido.
import { randInt, pick, saveScore } from "./utils.js";

const TIME_LIMIT = 30;

function buildStatement() {
  const sym = pick(["+", "−", "×"]);
  let a, b, real;
  if (sym === "+") {
    a = randInt(5, 49);
    b = randInt(5, 49);
    real = a + b;
  } else if (sym === "−") {
    a = randInt(20, 80);
    b = randInt(2, a - 1);
    real = a - b;
  } else {
    a = randInt(2, 12);
    b = randInt(2, 12);
    real = a * b;
  }
  // La mitad de las igualdades son ciertas; en las falsas el desvío
  // nunca puede ser 0, o el enunciado sería verdadero sin quererlo.
  const wantTrue = Math.random() < 0.5;
  let shown = real;
  if (!wantTrue) {
    const deltas = [];
    for (let d = -10; d <= 10; d++) {
      if (d !== 0 && real + d >= 0) deltas.push(d);
    }
    shown = real + pick(deltas);
  }
  return { text: `${a} ${sym} ${b} = ${shown}`, isTrue: shown === real };
}

export function mountSemaforoGame(container, { client, onExit }) {
  let score = 0;
  let rounds = 0;
  let totalMs = 0;
  let timeLeft = TIME_LIMIT;
  let questionStart = 0;
  let answered = false;
  let finished = false;
  let timerHandle = null;
  let current = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="timer" data-timer></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const timerEl = container.querySelector("[data-timer]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");

  function renderTimer() {
    timerEl.textContent = `⏱ ${Math.max(timeLeft, 0)}s`;
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    if (finished) return;
    answered = false;
    current = buildStatement();
    body.innerHTML = `
      <p class="prompt">¿Es correcto?<small>Responde lo más rápido que puedas</small></p>
      <div class="sem-eq" data-eq>${current.text}</div>
      <div class="sem-buttons">
        <button class="sem-btn sem-yes" data-yes>✅</button>
        <button class="sem-btn sem-no" data-no>❌</button>
      </div>
      <div class="feedback" data-feedback></div>
    `;
    questionStart = performance.now();
    body.querySelector("[data-yes]").addEventListener("click", () => answer(true));
    body.querySelector("[data-no]").addEventListener("click", () => answer(false));
  }

  function answer(said) {
    if (finished || answered) return;
    answered = true;
    const ms = Math.round(performance.now() - questionStart);
    totalMs += ms;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const eq = body.querySelector("[data-eq]");
    body.querySelectorAll(".sem-btn").forEach((b) => (b.disabled = true));
    if (said === current.isTrue) {
      score += 10;
      renderScore();
      eq.classList.add("ok");
      feedback.textContent = `¡Bien! (${ms} ms)`;
      feedback.className = "feedback ok";
    } else {
      eq.classList.add("bad");
      feedback.textContent = current.isTrue ? "Sí era correcto…" : "Estaba mal…";
      feedback.className = "feedback bad";
    }
    setTimeout(() => {
      if (finished) return;
      if (timeLeft <= 0) return finish(false);
      nextRound();
    }, 420);
  }

  function tick() {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) finish(false);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
    if (userExited) return onExit();
    const avgMs = rounds ? Math.round(totalMs / rounds) : 0;
    saveScore(client, "semaforo", { score, rounds, avgMs });
    body.innerHTML = `
      <div class="end-card">
        <div>🚦</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} respuestas · ${avgMs} ms de media</p>
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
    score = 0;
    rounds = 0;
    totalMs = 0;
    timeLeft = TIME_LIMIT;
    finished = false;
    renderTimer();
    renderScore();
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = setInterval(tick, 1000);
    nextRound();
  }

  start();
  return () => {
    finished = true;
    if (timerHandle) clearInterval(timerHandle);
    timerHandle = null;
  };
}
