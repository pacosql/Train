// "Equilibra la balanza": toca pesas para igualar el peso objetivo.
// La barra se inclina en tiempo real — feedback visual, no botones A/B/C/D.
import { randInt, saveScore } from "./utils.js";

const WEIGHTS = [1, 2, 5, 10];

export function mountBalanzaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let target = 0;
  let current = 0;

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
    target = randInt(6, 35);
    current = 0;
    body.innerHTML = `
      <p class="prompt">Iguala <b>${target} kg</b> en el lado derecho</p>
      <div class="scale-wrap">
        <div class="scale-beam" data-beam>
          <div class="scale-pan left"><span>${target} kg</span></div>
          <div class="scale-pan right"><span data-current>0 kg</span></div>
        </div>
        <div class="scale-pivot"></div>
      </div>
      <div class="weight-btns" data-weights></div>
      <div class="feedback" data-feedback></div>
      <button class="secondary" data-reset style="margin-top:8px;">↺ Reiniciar</button>
    `;
    const weightsEl = body.querySelector("[data-weights]");
    WEIGHTS.forEach((w) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn weight-btn";
      btn.textContent = `+${w}`;
      btn.addEventListener("click", () => addWeight(w));
      weightsEl.appendChild(btn);
    });
    body.querySelector("[data-reset]").addEventListener("click", () => {
      current = 0;
      updateBeam();
    });
    updateBeam();
  }

  function updateBeam() {
    const beam = body.querySelector("[data-beam]");
    const currentEl = body.querySelector("[data-current]");
    currentEl.textContent = `${current} kg`;
    const diff = Math.max(-18, Math.min(18, current - target));
    beam.style.transform = `rotate(${diff}deg)`;
  }

  function addWeight(w) {
    if (finished) return;
    current += w;
    updateBeam();
    const feedback = body.querySelector("[data-feedback]");
    rounds++;
    if (current === target) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Equilibrada!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 600);
    } else if (current > target) {
      lives--;
      renderLives();
      feedback.textContent = "Te has pasado — vuelve a intentarlo";
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 500);
      setTimeout(() => {
        current = 0;
        updateBeam();
      }, 500);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "balanza", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚖️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} pesas añadidas</p>
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
