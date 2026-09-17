// "El ángulo de las agujas": lee una hora escrita (en pasos de 15 minutos)
// y arrastra un único marcador giratorio hasta que el arco que dibuja mida
// EXACTAMENTE el ángulo que forman la aguja horaria y la minutera a esa
// hora. El marcador siempre parte de la posición de las 12 (arriba, 0°) y
// el jugador lo gira en sentido horario hasta cubrir la abertura pedida.
import { randInt, pick, angleFromCenter, saveScore } from "./utils.js";

const MINUTE_STEPS = [0, 15, 30, 45];
const TOLERANCE = 6; // grados de margen al confirmar

// --- Cálculo puro del ángulo objetivo (exportado para poder testearlo) ---
// hourAngle: grados que ha girado la aguja horaria desde las 12 (30°/hora
// + 0.5°/minuto). minuteAngle: grados que ha girado el minutero (6°/min).
// angle: el MENOR de los dos ángulos posibles entre ambas agujas (0-180°).
export function computeClockAngle(hour, minute) {
  const h = ((hour % 12) + 12) % 12;
  const hourAngle = h * 30 + minute * 0.5;
  const minuteAngle = minute * 6;
  const raw = Math.abs(hourAngle - minuteAngle);
  const angle = Math.min(raw, 360 - raw);
  return { hourAngle, minuteAngle, raw, angle };
}

// Formatea un número quitando decimales sobrantes (7.5 -> "7,5", 30 -> "30").
function fmt(n) {
  const r = Math.round(n * 10) / 10;
  return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace(".", ",");
}

function timeLabel(hour, minute) {
  const displayHour = hour === 0 ? 12 : hour;
  return `${displayHour}:${String(minute).padStart(2, "0")}`;
}

function explain({ hourAngle, minuteAngle, raw, angle }) {
  const base = `La hora avanza ${fmt(hourAngle)}° desde las 12, el minutero ${fmt(minuteAngle)}°`;
  if (Math.abs(raw - angle) < 0.01) {
    return `${base} — la diferencia es ${fmt(angle)}°`;
  }
  return `${base} — la resta directa da ${fmt(raw)}°, y el hueco corto es 360° − ${fmt(raw)}° = ${fmt(angle)}°`;
}

export function mountAgujasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let lastHour = -1;
  let lastMinute = -1;
  let round = null; // { hour, minute, hourAngle, minuteAngle, raw, angle }
  let deg = 0; // ángulo actual del marcador (0-360, 0 = arriba, horario)
  const timers = [];

  let clockEl, handleEl, arcEl, currentAngleEl;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body ag-body" data-body></div>
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

  // Sortea hora y minuto (pasos de 15'), evitando repetir la ronda anterior
  // y descartando el caso 12:00 (agujas superpuestas, ángulo 0°: no hay
  // arco que dibujar).
  function pickRound() {
    let hour, minute, data;
    do {
      hour = randInt(0, 11);
      minute = pick(MINUTE_STEPS);
      data = computeClockAngle(hour, minute);
    } while ((hour === lastHour && minute === lastMinute) || data.angle === 0);
    lastHour = hour;
    lastMinute = minute;
    return { hour, minute, ...data };
  }

  function buildTicks() {
    let html = "";
    for (let i = 1; i <= 12; i++) {
      const a = i * 30;
      html += `<div class="ag-number" style="transform:rotate(${a}deg) translateY(-108px) rotate(${-a}deg) translate(-50%,-50%)">${i}</div>`;
    }
    return html;
  }

  function nextRound() {
    round = pickRound();
    deg = 0;
    body.innerHTML = `
      <p class="prompt">A las <b>${timeLabel(round.hour, round.minute)}</b>, ¿qué ángulo forman las agujas?
        <small>Arrastra el marcador hasta cubrir esa abertura y confirma</small></p>
      <div class="ag-clock-wrap">
        <div class="ag-clock" data-clock>
          <div class="ag-face"></div>
          <div class="ag-arc-fill" data-arc></div>
          ${buildTicks()}
          <div class="ag-base-line"></div>
          <div class="ag-needle" data-handle><span class="ag-knob"></span></div>
          <div class="ag-center-dot"></div>
        </div>
      </div>
      <div class="ag-current-angle" data-current-angle>Tu ángulo: 0°</div>
      <div class="feedback" data-feedback></div>
      <button class="primary" data-confirm style="margin-top:12px;">Confirmar</button>
    `;
    clockEl = body.querySelector("[data-clock]");
    handleEl = body.querySelector("[data-handle]");
    arcEl = body.querySelector("[data-arc]");
    currentAngleEl = body.querySelector("[data-current-angle]");
    applyDeg();
    bindDrag();
    body.querySelector("[data-confirm]").addEventListener("click", confirmAngle);
  }

  function applyDeg() {
    handleEl.style.transform = `translateX(-50%) rotate(${deg}deg)`;
    arcEl.style.background = `conic-gradient(from 0deg, var(--ag-arc) 0deg ${deg}deg, transparent ${deg}deg 360deg)`;
    currentAngleEl.textContent = `Tu ángulo: ${Math.round(deg)}°`;
  }

  function bindDrag() {
    let dragging = false;
    function move(clientX, clientY) {
      const rect = clockEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      deg = angleFromCenter(cx, cy, clientX, clientY);
      applyDeg();
    }
    handleEl.addEventListener("pointerdown", (e) => {
      if (finished) return;
      dragging = true;
      handleEl.setPointerCapture(e.pointerId);
      move(e.clientX, e.clientY);
    });
    handleEl.addEventListener("pointermove", (e) => {
      if (dragging) move(e.clientX, e.clientY);
    });
    handleEl.addEventListener("pointerup", () => (dragging = false));
    handleEl.addEventListener("pointercancel", () => (dragging = false));
  }

  function confirmAngle() {
    if (finished) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const diff = Math.abs(deg - round.angle);
    if (diff <= TOLERANCE) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Ángulo correcto! ${explain(round)}`;
      feedback.className = "feedback ok";
      later(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = explain(round);
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1100);
      later(nextRound, 1300);
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
    saveScore(client, "agujas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🕰️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} ángulos de reloj medidos</p>
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
    lastHour = -1;
    lastMinute = -1;
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
