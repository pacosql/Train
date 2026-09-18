// __BUILD_ID__
// "Esquiva a tiempo": un obstáculo se acerca a una distancia y velocidad
// dadas; el jugador tiene que cruzar su propia distancia a su propia
// velocidad. Hay que decidir con UN SOLO TOQUE si da tiempo a cruzar
// antes de que llegue el obstáculo, o si hay que esperar. La decisión es
// la comparación matemática de dos tiempos (tiempo = distancia/velocidad),
// no un adorno visual.
//
// Tanto el tiempo disponible como el tiempo necesario para cruzar se
// generan PRIMERO como enteros, y la distancia correspondiente se deriva
// multiplicando por la velocidad — así ambas divisiones dan siempre un
// resultado exacto, sin decimales que dependan de una división inexacta.
import { randInt, saveScore } from "./utils.js";

export function generateEsquivaRound() {
  const obstacleSpeed = randInt(2, 10);
  const timeAvailable = randInt(3, 12);
  const distance = obstacleSpeed * timeAvailable;

  const playerSpeed = randInt(1, 5);
  let timeNeeded, crossingDistance;
  do {
    timeNeeded = randInt(2, 12);
    crossingDistance = playerSpeed * timeNeeded;
  } while (timeAvailable === timeNeeded);

  const answer = timeAvailable > timeNeeded ? "cruza" : "espera";

  return {
    distance,
    obstacleSpeed,
    crossingDistance,
    playerSpeed,
    timeAvailable,
    timeNeeded,
    answer,
  };
}

function explain(round) {
  const cmp = round.timeNeeded < round.timeAvailable ? "<" : ">";
  const verdict = round.answer === "cruza" ? "SÍ te daba tiempo: la respuesta correcta era Cruzar." : "NO te daba tiempo: la respuesta correcta era Esperar.";
  return (
    `El obstáculo tarda ${round.distance}÷${round.obstacleSpeed}=${round.timeAvailable} s en llegar. ` +
    `Tú tardas ${round.crossingDistance}÷${round.playerSpeed}=${round.timeNeeded} s en cruzar. ` +
    `Como ${round.timeNeeded} ${cmp} ${round.timeAvailable}, ${verdict}`
  );
}

export function mountEsquivaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita doble toque mientras se resuelve la ronda
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

  let round = null;

  function nextRound() {
    locked = false;
    round = generateEsquivaRound();

    body.innerHTML = `
      <p class="prompt">🏃 Esquiva a tiempo<small>¿Te da tiempo a cruzar antes de que llegue?</small></p>
      <div class="esq-scenario">
        <div class="esq-row esq-row-obstacle">
          <span class="esq-emoji">🚧</span>
          <span class="esq-text">El obstáculo está a <strong>${round.distance} m</strong> y se acerca a <strong>${round.obstacleSpeed} m/s</strong>.</span>
        </div>
        <div class="esq-row esq-row-player">
          <span class="esq-emoji">🏃</span>
          <span class="esq-text">Tú tienes que recorrer <strong>${round.crossingDistance} m</strong> y te mueves a <strong>${round.playerSpeed} m/s</strong>.</span>
        </div>
      </div>
      <div class="choices esq-options">
        <button class="choice-btn esq-choice-btn" type="button" data-choice="cruza">🏃 Cruzar</button>
        <button class="choice-btn esq-choice-btn" type="button" data-choice="espera">✋ Esperar</button>
      </div>
      <div class="feedback" data-feedback></div>
    `;
    const buttons = Array.from(body.querySelectorAll("[data-choice]"));
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => choose(btn.dataset.choice, buttons));
    });
  }

  function choose(picked, buttons) {
    if (finished || locked) return;
    locked = true;
    rounds++;
    buttons.forEach((b) => { b.disabled = true; });
    const feedback = body.querySelector("[data-feedback]");
    const correctBtn = buttons.find((b) => b.dataset.choice === round.answer);
    correctBtn.classList.add("correct");
    const text = explain(round);

    if (picked === round.answer) {
      score += 10;
      renderScore();
      feedback.textContent = text;
      feedback.className = "feedback ok";
      later(nextRound, 2600);
    } else {
      const wrongBtn = buttons.find((b) => b.dataset.choice === picked);
      wrongBtn.classList.add("wrong");
      lives--;
      renderLives();
      feedback.textContent = text;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 2600);
      later(nextRound, 2600);
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
    saveScore(client, "esquiva", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🏃</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} obstáculos esquivados</p>
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
