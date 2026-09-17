// "Dados": se tiran 2 (a veces 3) dados y hay que leer los puntos rápido, sin
// numerales — el subitizing es justo lo que se entrena aquí. La pregunta cambia
// entre suma y diferencia para que no se responda en piloto automático.
import { randInt, buildChoices, saveScore } from "./utils.js";

// Posiciones de puntos (rejilla 3x3, 1..9) de cada cara del dado.
const FACES = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

function dieHtml(face) {
  const pips = FACES[face].map((p) => `<i class="dado-pip p${p}"></i>`).join("");
  return `<div class="dado-die" data-face="${face}">${pips}</div>`;
}

function distractor(correct) {
  const d = randInt(1, 4);
  const v = correct + (Math.random() < 0.5 ? -d : d);
  return v < 0 ? correct + d : v;
}

// Tirada válida: en modo diferencia los dados nunca empatan, porque un 0 deja
// la respuesta sosa y arrastra los distractores hacia valores imposibles.
function buildRoll() {
  const three = Math.random() < 0.35;
  const mode = three || Math.random() < 0.5 ? "suma" : "resta";
  let dice;
  if (mode === "resta") {
    do {
      dice = [randInt(1, 6), randInt(1, 6)];
    } while (dice[0] === dice[1]);
    return { dice, mode, correct: Math.abs(dice[0] - dice[1]) };
  }
  dice = Array.from({ length: three ? 3 : 2 }, () => randInt(1, 6));
  return { dice, mode, correct: dice.reduce((a, b) => a + b, 0) };
}

export function mountDadosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let level = 1;
  let roll = null;
  let rollTimer = null;
  let settleTimer = null;
  let limitTimer = null;
  let nextTimer = null;

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

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function clearTimers() {
    if (rollTimer) clearInterval(rollTimer);
    if (settleTimer) clearTimeout(settleTimer);
    if (limitTimer) clearTimeout(limitTimer);
    if (nextTimer) clearTimeout(nextTimer);
    rollTimer = settleTimer = limitTimer = nextTimer = null;
  }

  function nextRound() {
    roll = buildRoll();
    const correct = roll.correct;
    // Repetimos hasta tener 4 opciones realmente distintas entre sí.
    let choices;
    do {
      choices = buildChoices(correct, () => distractor(correct), 4);
    } while (choices.length < 4);

    const limit = Math.max(3600, 6500 - level * 180);
    body.innerHTML = `
      <p class="prompt dado-q" data-q>Tirando…</p>
      <div class="dado-table rolling" data-table>
        ${roll.dice.map((d) => dieHtml(d)).join("")}
      </div>
      <div class="dado-bar"><i data-bar style="width:100%"></i></div>
      <div class="choices dado-choices" data-choices></div>
      <div class="feedback" data-feedback></div>
    `;
    const table = body.querySelector("[data-table]");
    const choicesEl = body.querySelector("[data-choices]");
    choices.forEach((v) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = v;
      btn.disabled = true; // no se responde mientras los dados ruedan
      btn.addEventListener("click", () => answer(v === correct, btn));
      choicesEl.appendChild(btn);
    });

    if (rollTimer) clearInterval(rollTimer);
    rollTimer = setInterval(() => {
      table.innerHTML = roll.dice.map(() => dieHtml(randInt(1, 6))).join("");
    }, 90);
    settleTimer = setTimeout(() => {
      if (finished) return;
      clearInterval(rollTimer);
      rollTimer = null;
      table.classList.remove("rolling");
      table.innerHTML = roll.dice.map((d) => dieHtml(d)).join("");
      body.querySelector("[data-q]").textContent =
        roll.mode === "suma" ? "¿Cuánto suman?" : "¿Cuál es la diferencia?";
      body.querySelectorAll(".choice-btn").forEach((b) => (b.disabled = false));
      const bar = body.querySelector("[data-bar]");
      bar.style.transition = `width ${limit}ms linear`;
      requestAnimationFrame(() => {
        bar.style.width = "0%";
      });
      limitTimer = setTimeout(() => timeout(), limit);
    }, 750);
  }

  function stopRound() {
    if (limitTimer) clearTimeout(limitTimer);
    limitTimer = null;
    body.querySelectorAll(".choice-btn").forEach((b) => (b.disabled = true));
  }

  function answer(ok, btn) {
    if (finished || btn.disabled) return;
    const feedback = body.querySelector("[data-feedback]");
    stopRound();
    if (ok) {
      rounds++;
      score += 10;
      renderScore();
      level++;
      btn.classList.add("correct");
      feedback.textContent = "¡Bien leído!";
      feedback.className = "feedback ok";
      nextTimer = setTimeout(() => {
        if (!finished) nextRound();
      }, 650);
    } else {
      lives--;
      renderLives();
      btn.classList.add("wrong");
      feedback.textContent = `Era ${roll.correct}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return (nextTimer = setTimeout(() => finish(false), 600));
      nextTimer = setTimeout(() => {
        if (!finished) nextRound();
      }, 900);
    }
  }

  function timeout() {
    if (finished) return;
    stopRound();
    lives--;
    renderLives();
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = `¡Tiempo! Era ${roll.correct}`;
    feedback.className = "feedback bad";
    if (lives <= 0) return (nextTimer = setTimeout(() => finish(false), 600));
    nextTimer = setTimeout(() => {
      if (!finished) nextRound();
    }, 900);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "dados", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎲</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} tiradas acertadas</p>
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
    level = 1;
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
