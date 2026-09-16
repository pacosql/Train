// "Recta numérica": arrastra el marcador hasta el número objetivo.
// Mecánica de arrastre continuo, no de elegir entre opciones.
import { randInt, clamp, saveScore } from "./utils.js";

const RANGE = 20;

export function mountRectaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let target = 0;
  let value = 0;
  let lineEl, markerEl, valueEl;

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
    target = randInt(1, RANGE - 1);
    value = randInt(0, RANGE);
    body.innerHTML = `
      <p class="prompt">Arrastra el punto hasta el <b>${target}</b></p>
      <div class="number-line" data-line>
        <div class="nl-track"></div>
        <div class="nl-marker" data-marker></div>
      </div>
      <div class="nl-value" data-value></div>
      <div class="feedback" data-feedback></div>
      <button class="primary" data-confirm style="margin-top:14px;">Confirmar</button>
    `;
    lineEl = body.querySelector("[data-line]");
    markerEl = body.querySelector("[data-marker]");
    valueEl = body.querySelector("[data-value]");
    setMarker(value);
    body.querySelector("[data-confirm]").addEventListener("click", confirm);
    bindDrag();
  }

  function setMarker(v) {
    value = clamp(Math.round(v), 0, RANGE);
    const pct = (value / RANGE) * 100;
    markerEl.style.left = `${pct}%`;
    valueEl.textContent = value;
  }

  function bindDrag() {
    let dragging = false;
    function toValue(clientX) {
      const rect = lineEl.getBoundingClientRect();
      const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
      return pct * RANGE;
    }
    function onDown(e) {
      dragging = true;
      setMarker(toValue(e.clientX));
      lineEl.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      if (!dragging) return;
      setMarker(toValue(e.clientX));
    }
    function onUp() {
      dragging = false;
    }
    lineEl.addEventListener("pointerdown", onDown);
    lineEl.addEventListener("pointermove", onMove);
    lineEl.addEventListener("pointerup", onUp);
  }

  function confirm() {
    if (finished) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (value === target) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Justo ahí!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 600);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Casi — era el ${target}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 600);
      setTimeout(nextRound, 900);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "recta", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📍</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} rondas</p>
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
