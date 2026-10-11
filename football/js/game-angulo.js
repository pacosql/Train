// "Ajusta el ángulo": arrastra la flecha hasta el ángulo objetivo sobre
// un transportador circular. Mecánica de arrastre rotacional.
//
// v2 (petición de Paco): la flecha gira a saltos de 45° (no en continuo)
// y solo se piden múltiplos de 45: 45, 90, 135… — nada de 120 o 210, que
// "quedan en el medio de nada". Al fallar se dibuja la flecha correcta.
import { pick, angleFromCenter, saveScore } from "./utils.js";

const STEP = 45;
const TARGETS = [45, 90, 135, 180, 225, 270, 315];

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
        ${[0, 45, 90, 135, 180, 225, 270, 315]
          .map((a) => `<div class="angle-tick${a % 90 ? " minor" : ""}" style="transform:translateX(-50%) rotate(${a}deg)"></div>`)
          .join("")}
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
      deg = (Math.round(angleFromCenter(cx, cy, clientX, clientY) / STEP) * STEP) % 360;
      applyRotation();
    }
    // Se arrastra desde cualquier punto de la esfera (la flecha sola, de
    // 8 px, era difícil de coger con el pulgar).
    dialEl.addEventListener("pointerdown", (e) => {
      dragging = true;
      dialEl.setPointerCapture(e.pointerId);
      move(e.clientX, e.clientY);
    });
    dialEl.addEventListener("pointermove", (e) => {
      if (dragging) move(e.clientX, e.clientY);
    });
    dialEl.addEventListener("pointerup", () => (dragging = false));
  }

  function confirm() {
    if (finished) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    body.querySelector("[data-confirm]").disabled = true;
    if (deg === target) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Ángulo correcto!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 650);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Has puesto ${deg}° y eran ${target}° (la flecha verde)`;
      feedback.className = "feedback bad";
      const ghost = document.createElement("div");
      ghost.className = "angle-needle ghost";
      ghost.style.transform = `translateX(-50%) rotate(${target}deg)`;
      dialEl.insertBefore(ghost, needleEl);
      if (lives <= 0) return setTimeout(() => finish(false), 650);
      setTimeout(nextRound, 1600);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
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
