// "Termómetro": arrastrar el nivel en una escala vertical que cruza el
// cero. Eje Y invertido respecto a la recta numérica (arriba = más), que
// es justo lo que cuesta interiorizar con los grados bajo cero.
import { randInt, clamp, saveScore } from "./utils.js";

const MIN = -20;
const MAX = 40;
const SPAN = MAX - MIN;
const TICKS = [40, 30, 20, 10, 0, -10, -20];

function grados(v) {
  return `${v} °C`;
}

export function mountTermometroGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let timers = [];
  let target = 0;
  let value = 0;
  let tubeEl, fillEl, levelEl, valueEl;

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
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    // La salida nunca coincide ni queda pegada al objetivo: siempre hay
    // que arrastrar de verdad. La mitad de las rondas son bajo cero, que
    // es la parte que de verdad se quiere practicar.
    do {
      target = randInt(0, 1) === 0 ? randInt(MIN, -1) : randInt(0, MAX);
      value = randInt(MIN, MAX);
    } while (Math.abs(target - value) < 8);

    const inicial = value;
    body.innerHTML = `
      <div class="therm-wrap">
        <p class="prompt therm-prompt">Arrastra hasta <b>${grados(target)}</b><small>toca o arrastra dentro del tubo</small></p>
        <div class="therm-col">
          <div class="therm-ticks" data-ticks></div>
          <div class="therm-tube" data-tube>
            <div class="therm-fill" data-fill></div>
            <div class="therm-level" data-level></div>
          </div>
          <div class="therm-bulb"></div>
        </div>
        <div class="therm-value" data-value></div>
        <div class="feedback" data-feedback></div>
        <button class="primary therm-confirm" data-confirm>Confirmar</button>
      </div>
    `;
    tubeEl = body.querySelector("[data-tube]");
    fillEl = body.querySelector("[data-fill]");
    levelEl = body.querySelector("[data-level]");
    valueEl = body.querySelector("[data-value]");

    const ticksEl = body.querySelector("[data-ticks]");
    ticksEl.innerHTML = TICKS.map((t) => {
      const pct = ((t - MIN) / SPAN) * 100;
      return `<span class="therm-tick${t === 0 ? " therm-zero" : ""}" style="bottom:${pct}%">${t}</span>`;
    }).join("");

    setLevel(inicial);
    body.querySelector("[data-confirm]").addEventListener("click", confirm);
    bindDrag();
  }

  function setLevel(v) {
    value = clamp(Math.round(v), MIN, MAX); // sólo grados enteros
    const pct = ((value - MIN) / SPAN) * 100;
    fillEl.style.height = `${pct}%`;
    fillEl.classList.toggle("therm-cold", value < 0);
    levelEl.style.bottom = `${pct}%`;
    valueEl.textContent = grados(value);
    valueEl.classList.toggle("therm-neg", value < 0);
  }

  function bindDrag() {
    let dragging = false;
    function toValue(clientY) {
      const rect = tubeEl.getBoundingClientRect();
      // Abajo del tubo = MIN, arriba = MAX: hay que invertir el eje Y.
      const pct = clamp((rect.bottom - clientY) / rect.height, 0, 1);
      return MIN + pct * SPAN;
    }
    function onDown(e) {
      dragging = true;
      setLevel(toValue(e.clientY));
      tubeEl.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      if (!dragging) return;
      setLevel(toValue(e.clientY));
    }
    function onUp() {
      dragging = false;
    }
    tubeEl.addEventListener("pointerdown", onDown);
    tubeEl.addEventListener("pointermove", onMove);
    tubeEl.addEventListener("pointerup", onUp);
    tubeEl.addEventListener("pointercancel", onUp);
  }

  function confirm() {
    if (finished) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (value === target) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Temperatura exacta!";
      feedback.className = "feedback ok";
      later(nextRound, 700);
    } else {
      lives--;
      renderLives();
      const dif = Math.abs(value - target);
      feedback.textContent = `Te has quedado a ${dif} grado${dif === 1 ? "" : "s"} — era ${grados(target)}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 800);
      later(nextRound, 1100);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "termometro", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🌡️</div>
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
    clearTimers();
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
    clearTimers();
  };
}
