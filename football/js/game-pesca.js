// "Pesca de números": peces cruzando el estanque en HORIZONTAL (el juego de
// globos ya usa el movimiento vertical, así que aquí el eje es el otro) y hay
// que tocar el que lleva el resultado antes de que se escape por el borde.
import { randInt, pick, shuffle, buildChoices, saveScore } from "./utils.js";

const LANES = [6, 28, 50, 72]; // % desde arriba: 4 carriles sin solaparse
const COLORS = ["#e5484d", "#f5a623", "#3ecf8e", "#2ea3c4", "#9b6bf0", "#f06ea1"];

// Distractor siempre distinto del correcto y nunca negativo: evita que el Set
// de buildChoices se quede corto y que aparezcan resultados imposibles.
function distractor(correct) {
  const d = randInt(1, Math.max(4, Math.round(correct * 0.3) + 3));
  const v = correct + (Math.random() < 0.5 ? -d : d);
  return v < 0 ? correct + d : v;
}

function buildOperation(level) {
  const ops = level < 2 ? ["+", "-"] : ["+", "-", "×"];
  const op = pick(ops);
  let a, b, correct;
  if (op === "×") {
    a = randInt(2, level < 4 ? 9 : 12);
    b = randInt(2, 9);
    correct = a * b;
  } else if (op === "+") {
    a = randInt(2, 10 + level * 4);
    b = randInt(2, 10 + level * 2);
    correct = a + b;
  } else {
    // Resta con resultado >= 1: un 0 haría colapsar los distractores bajos.
    a = randInt(6, 12 + level * 4);
    b = randInt(1, a - 1);
    correct = a - b;
  }
  return { text: `${a} ${op} ${b} = ?`, correct };
}

export function mountPescaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let level = 1;
  let roundToken = 0;
  let roundTimer = null;
  let pond, feedback;

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

  function scheduleRound(ms) {
    if (roundTimer) clearTimeout(roundTimer);
    roundTimer = setTimeout(() => {
      if (!finished) nextRound();
    }, ms);
  }

  function nextRound() {
    const token = ++roundToken;
    const { text, correct } = buildOperation(level);
    // 4 valores garantizados distintos: si el Set se quedara corto, se repite.
    let values;
    do {
      values = buildChoices(correct, () => distractor(correct), 4);
    } while (values.length < 4);

    body.innerHTML = `
      <p class="prompt pesca-op">${text}</p>
      <div class="pesca-pond" data-pond></div>
      <div class="feedback" data-feedback>Toca el pez con el resultado</div>
    `;
    pond = body.querySelector("[data-pond]");
    feedback = body.querySelector("[data-feedback]");
    feedback.className = "feedback";

    const lanes = shuffle(LANES);
    const dur = Math.max(4200, 7200 - level * 350);
    values.forEach((v, i) => {
      const toRight = Math.random() < 0.5;
      const fish = document.createElement("button");
      fish.className = `pesca-fish ${toRight ? "to-right" : "to-left"}`;
      fish.style.top = `${lanes[i]}%`;
      fish.style.background = COLORS[randInt(0, COLORS.length - 1)];
      fish.style.animationDuration = `${dur}ms`;
      fish.style.animationDelay = `${i * 260}ms`;
      fish.innerHTML = `<span class="pesca-num">${v}</span>`;
      fish.addEventListener("click", () => tapFish(token, v === correct, fish));
      fish.addEventListener("animationend", () => {
        fish.remove();
        // Solo importa que escape el pez bueno: los demás pueden irse.
        if (v === correct && !finished && token === roundToken) escaped(token);
      });
      pond.appendChild(fish);
    });
  }

  function tapFish(token, ok, fish) {
    if (finished || token !== roundToken || fish.dataset.done) return;
    fish.dataset.done = "1";
    if (ok) {
      roundToken++; // cierra la ronda: los peces restantes ya no cuentan
      rounds++;
      score += 10;
      renderScore();
      level++;
      fish.classList.add("caught");
      feedback.textContent = "¡Pescado!";
      feedback.className = "feedback ok";
      pond.querySelectorAll(".pesca-fish").forEach((f) => (f.style.animationPlayState = "paused"));
      scheduleRound(750);
    } else {
      lives--;
      renderLives();
      fish.classList.add("missed");
      feedback.textContent = "Ese no era…";
      feedback.className = "feedback bad";
      if (lives <= 0) {
        roundToken++;
        setTimeout(() => finish(false), 450);
      }
    }
  }

  function escaped(token) {
    if (finished || token !== roundToken) return;
    roundToken++;
    lives--;
    renderLives();
    feedback.textContent = "¡Se ha escapado!";
    feedback.className = "feedback bad";
    if (lives <= 0) return setTimeout(() => finish(false), 450);
    scheduleRound(750);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (roundTimer) clearTimeout(roundTimer);
    if (userExited) return onExit();
    saveScore(client, "pesca", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🐟</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} peces pescados</p>
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
    if (roundTimer) clearTimeout(roundTimer);
    lives = startLives;
    score = 0;
    rounds = 0;
    level = 1;
    roundToken++;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    if (roundTimer) clearTimeout(roundTimer);
  };
}
