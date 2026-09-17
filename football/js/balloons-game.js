// Juego de mecánica propia: "Multiplicación de globos". Suben 4 globos con
// números; hay que pinchar el resultado correcto antes de que se escape.
// Mide la velocidad de respuesta del jugador (tiempo hasta acertar).
import { randInt, buildChoices, shuffle, saveScore } from "./utils.js";

const COLORS = ["#e5484d", "#f5a623", "#3ecf8e", "#2ea3c4", "#9b6bf0", "#f06ea1"];
const SLOTS = [6, 30, 54, 78]; // % desde la izquierda

export function mountBalloonsGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let totalMs = 0;
  let questionStart = 0;
  let roundActive = false;
  let finished = false;
  let balloonEls = [];
  let cleanupTimers = [];
  let sky, questionEl;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body style="padding:0;"></div>
  `;

  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const bodyEl = container.querySelector("[data-body]");

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function clearBalloons() {
    balloonEls.forEach((b) => b.el.remove());
    balloonEls = [];
    cleanupTimers.forEach((t) => clearTimeout(t));
    cleanupTimers = [];
  }

  function duration() {
    return Math.max(3200, 6200 - rounds * 180);
  }

  function endRound(won) {
    if (!roundActive) return;
    roundActive = false;
    const ms = Math.round(performance.now() - questionStart);
    totalMs += ms;
    rounds++;
    if (won) {
      score += 10;
      renderScore();
    } else {
      lives--;
      renderLives();
    }
    clearBalloons();
    if (lives <= 0) return setTimeout(() => finish(false), 300);
    setTimeout(nextRound, 500);
  }

  function nextRound() {
    if (finished) return;
    const a = randInt(2, 9);
    const b = randInt(2, 9);
    const correct = a * b;
    questionEl.textContent = `${a} × ${b} = ?`;
    const values = shuffle(buildChoices(correct, () => Math.max(1, correct + randInt(-8, 8))));
    const dur = duration();
    values.forEach((val, i) => {
      const el = document.createElement("div");
      el.className = "balloon";
      el.textContent = val;
      el.style.left = `${SLOTS[i] + randInt(-3, 3)}%`;
      el.style.background = COLORS[randInt(0, COLORS.length - 1)];
      el.style.animationDuration = `${dur}ms`;
      el.addEventListener("click", () => {
        if (!roundActive) return;
        if (val === correct) {
          el.classList.add("popped");
          endRound(true);
        } else {
          el.classList.add("popped");
          setTimeout(() => el.remove(), 250);
          balloonEls = balloonEls.filter((b) => b.el !== el);
          lives--;
          renderLives();
          if (lives <= 0) {
            roundActive = false;
            clearBalloons();
            setTimeout(() => finish(false), 300);
          }
        }
      });
      sky.appendChild(el);
      balloonEls.push({ el, isCorrect: val === correct });
      if (val === correct) {
        const t = setTimeout(() => endRound(false), dur + 50);
        cleanupTimers.push(t);
      }
    });
    questionStart = performance.now();
    roundActive = true;
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    roundActive = false;
    clearBalloons();
    if (userExited) {
      onExit();
      return;
    }
    const avgMs = rounds ? Math.round(totalMs / rounds) : 0;
    saveScore(client, "globos", { score, rounds, avgMs });
    bodyEl.innerHTML = `
      <div class="end-card">
        <div>🎈</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} rondas · ${avgMs} ms de media en acertar</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>
    `;
    bodyEl.querySelector("[data-retry]").addEventListener("click", () => start());
    bodyEl.querySelector("[data-menu]").addEventListener("click", () => onExit());
  }

  function start() {
    lives = startLives;
    score = 0;
    rounds = 0;
    totalMs = 0;
    finished = false;
    bodyEl.innerHTML = `
      <div class="balloon-sky" data-sky>
        <div class="balloon-question" data-question></div>
      </div>
    `;
    sky = bodyEl.querySelector("[data-sky]");
    questionEl = bodyEl.querySelector("[data-question]");
    renderLives();
    renderScore();
    nextRound();
  }

  start();

  return function cleanupGame() {
    finished = true;
    roundActive = false;
    clearBalloons();
  };
}
