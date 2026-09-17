// "Amigos del 10" (number bonds): un diagrama de "enlace" muestra el
// total y un sumando — toca la burbuja con el sumando que falta.
// Distinto de "Parejas que suman" (ahí se buscan 2 entre 6 al tacto;
// aquí el enlace ya te da uno de los dos números).
import { randInt, buildChoices, shuffle, saveScore } from "./utils.js";

export function mountAmigos10Game(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let target = 10;
  let known = 0;
  let correct = 0;

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

  function nextRound() {
    target = [10, 10, 20, 100][randInt(0, 3)];
    known = randInt(1, target - 1);
    correct = target - known;
    body.innerHTML = `
      <div class="bond-diagram">
        <div class="bond-total">${target}</div>
        <div class="bond-lines">
          <div class="bond-line"></div>
          <div class="bond-line"></div>
        </div>
        <div class="bond-parts">
          <div class="bond-part">${known}</div>
          <div class="bond-part bond-missing">?</div>
        </div>
      </div>
      <p class="prompt">¿Qué número completa el enlace?</p>
      <div class="bubble-field" data-field></div>
      <div class="feedback" data-feedback></div>
    `;
    const field = body.querySelector("[data-field]");
    const options = buildChoices(correct, () => Math.max(0, correct + [-3, -2, -1, 1, 2, 3][randInt(0, 5)]), 5);
    shuffle(options).forEach((val) => {
      const el = document.createElement("button");
      el.className = "bubble-chip amigos-chip";
      el.textContent = val;
      el.addEventListener("click", () => tap(val, el));
      field.appendChild(el);
    });
  }

  function tap(val, el) {
    if (finished || el.disabled) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    body.querySelectorAll(".amigos-chip").forEach((c) => (c.disabled = true));
    if (val === correct) {
      el.classList.add("correct");
      score += 10;
      renderScore();
      body.querySelector(".bond-missing").textContent = correct;
      feedback.textContent = "¡Enlace completo!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 650);
    } else {
      el.classList.add("wrong");
      lives--;
      renderLives();
      feedback.textContent = `Era ${correct}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 650);
      setTimeout(nextRound, 950);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "amigos10", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔗</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} enlaces</p>
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
  };
}
