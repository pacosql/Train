// "Pon en hora el reloj": arrastra las agujas para marcar la hora
// objetivo. Mecánica de arrastre rotacional sobre una esfera analógica.
import { randInt, pick, angleFromCenter, saveScore } from "./utils.js";

const MINUTE_MARKS = [0, 90, 180, 270]; // :00 :15 :30 :45

export function mountRelojGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let targetHour = 3;
  let targetMinute = 0;
  let hourDeg = 0;
  let minuteDeg = 0;
  let faceEl, hourHand, minuteHand;

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
    targetHour = randInt(1, 12);
    targetMinute = pick([0, 15, 30, 45]);
    hourDeg = randInt(0, 359);
    minuteDeg = randInt(0, 359);
    body.innerHTML = `
      <p class="prompt">Marca las <b>${targetHour}:${String(targetMinute).padStart(2, "0")}</b><small>Arrastra las agujas del reloj</small></p>
      <div class="clock-face" data-face>
        <span class="clock-num n12">12</span><span class="clock-num n3">3</span>
        <span class="clock-num n6">6</span><span class="clock-num n9">9</span>
        <div class="clock-hand hour" data-hour></div>
        <div class="clock-hand minute" data-minute></div>
        <div class="clock-center"></div>
      </div>
      <div class="feedback" data-feedback></div>
      <button class="primary" data-confirm style="margin-top:14px;">Confirmar</button>
    `;
    faceEl = body.querySelector("[data-face]");
    hourHand = body.querySelector("[data-hour]");
    minuteHand = body.querySelector("[data-minute]");
    applyRotation();
    bindDrag(hourHand, (deg) => (hourDeg = deg));
    bindDrag(minuteHand, (deg) => (minuteDeg = deg));
    body.querySelector("[data-confirm]").addEventListener("click", confirm);
  }

  function applyRotation() {
    hourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
    minuteHand.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
  }

  function bindDrag(handEl, setDeg) {
    let dragging = false;
    function move(clientX, clientY) {
      const rect = faceEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const deg = angleFromCenter(cx, cy, clientX, clientY);
      setDeg(deg);
      applyRotation();
    }
    handEl.addEventListener("pointerdown", (e) => {
      dragging = true;
      handEl.setPointerCapture(e.pointerId);
      move(e.clientX, e.clientY);
    });
    handEl.addEventListener("pointermove", (e) => {
      if (dragging) move(e.clientX, e.clientY);
    });
    handEl.addEventListener("pointerup", () => (dragging = false));
  }

  function nearestMark(deg, marks) {
    return marks.reduce((best, m) => {
      const d1 = Math.min(Math.abs(deg - m), 360 - Math.abs(deg - m));
      const d0 = Math.min(Math.abs(deg - best), 360 - Math.abs(deg - best));
      return d1 < d0 ? m : best;
    }, marks[0]);
  }

  function confirm() {
    if (finished) return;
    rounds++;
    const snappedMinuteDeg = nearestMark(minuteDeg, MINUTE_MARKS);
    const minuteOk = snappedMinuteDeg === (targetMinute / 60) * 360;
    const targetHourDeg = ((targetHour % 12) + targetMinute / 60) * 30;
    const diff = Math.min(Math.abs(hourDeg - targetHourDeg), 360 - Math.abs(hourDeg - targetHourDeg));
    const hourOk = diff <= 12;
    const feedback = body.querySelector("[data-feedback]");
    if (minuteOk && hourOk) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Hora correcta!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 700);
    } else {
      lives--;
      renderLives();
      feedback.textContent = "Esa no es la hora pedida…";
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 700);
      setTimeout(nextRound, 1000);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "reloj", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🕐</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} horas marcadas</p>
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
