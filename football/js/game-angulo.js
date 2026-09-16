// "Ajusta el ángulo": arrastra la flecha hasta el ángulo objetivo sobre
// un transportador circular. Mecánica de arrastre rotacional.
import { pick, angleFromCenter, saveScore } from "./utils.js";

const TARGETS = [30, 45, 60, 90, 120, 135, 150, 180, 210, 240, 270, 315];

export function mountAnguloGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let target = 90;
  let deg = 0;
  let dialEl, needleEl;

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
    target = pick(TARGETS);
    deg = 0;
    body.innerHTML = `
      <p class="prompt">Coloca la flecha en <b>${target}°</b><small>0° arriba, gira en sentido horario</small></p>
      <div class="angle-dial" data-dial>
        <div class="angle-tick t0"></div><div class="angle-tick t90"></div>
        <div class="angle-tick t180"></div><div class="angle-tick t270"></div>
        <div class="angle-needle" data-needle></div>
        <div class="clock-center"></div>
      </div>
      <div class="feedback" data-feedback></div>
      <button class="primary" data-confirm style="margin-top:14px;">Confirmar</button>
    `;
    dialEl = body.querySelector("[data-dial]");
    needleEl = body.querySelector("[data-needle]");
    applyRotation();
    bindDrag();
    body.querySelector("[data-confirm]").addEventListener("click", confirm);
  }

  function applyRotation() {
    needleEl.style.transform = `translateX(-50%) rotate(${deg}deg)`;
  }

  function bindDrag() {
    let dragging = false;
    function move(clientX, clientY) {
      const rect = dialEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      deg = angleFromCenter(cx, cy, clientX, clientY);
      applyRotation();
    }
    needleEl.addEventListener("pointerdown", (e) => {
      dragging = true;
      needleEl.setPointerCapture(e.pointerId);
      move(e.clientX, e.clientY);
    });
    needleEl.addEventListener("pointermove", (e) => {
      if (dragging) move(e.clientX, e.clientY);
    });
    needleEl.addEventListener("pointerup", () => (dragging = false));
  }

  function confirm() {
    if (finished) return;
    rounds++;
    const snapped = Math.round(deg / 15) * 15;
    const feedback = body.querySelector("[data-feedback]");
    if (snapped === target || snapped === target + 360 || snapped % 360 === target) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Ángulo correcto!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 650);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Casi — eran ${target}°`;
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 650);
      setTimeout(nextRound, 950);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "angulo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📐</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} ángulos ajustados</p>
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
