// "Reparte en cajas": repartir N galletas entre K cajas a partes iguales.
// La división se toca con el dedo (una galleta por toque) en vez de
// calcularse: el reparto equitativo se entiende antes que el algoritmo.
import { randInt, saveScore } from "./utils.js";

export function mountReparteGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let boxes = [];
  let total = 0;
  let perBox = 0;
  let lastKey = "";
  let locked = false; // evita tocar mientras se resuelve la ronda
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

  function placed() {
    return boxes.reduce((a, b) => a + b, 0);
  }

  function nextRound() {
    // N se construye como K·perBox, así el reparto exacto SIEMPRE existe.
    // Los límites evitan cajas que no caben en pantalla y repartos triviales.
    let k = 0;
    let key = "";
    do {
      k = randInt(2, 4);
      perBox = randInt(2, 5);
      total = k * perBox;
      key = `${k}-${perBox}`;
    } while (total > 16 || key === lastKey);
    lastKey = key;
    boxes = new Array(k).fill(0);
    locked = false;

    body.innerHTML = `
      <p class="prompt">Reparte <b>${total}</b> galletas en <b>${k}</b> cajas<small>Todas las cajas deben tener lo mismo y no puede sobrar ninguna</small></p>
      <div class="pb-pool">Quedan: <span class="pb-pool-dots" data-pool></span></div>
      <div class="pb-boxes" data-boxes></div>
      <div class="feedback" data-feedback></div>
      <button class="secondary" data-reset style="margin-top:10px;">↺ Reiniciar</button>
    `;

    const boxesEl = body.querySelector("[data-boxes]");
    boxes.forEach((_, i) => {
      const wrap = document.createElement("div");
      wrap.className = "pb-box-wrap";
      wrap.innerHTML = `
        <button class="pb-box" data-box="${i}" type="button">
          <span class="pb-box-cookies" data-cookies="${i}"></span>
        </button>
        <button class="pb-box-minus" data-minus="${i}" type="button">−</button>
      `;
      boxesEl.appendChild(wrap);
    });
    boxesEl.querySelectorAll("[data-box]").forEach((btn) => {
      btn.addEventListener("click", () => addCookie(Number(btn.dataset.box)));
    });
    boxesEl.querySelectorAll("[data-minus]").forEach((btn) => {
      btn.addEventListener("click", () => removeCookie(Number(btn.dataset.minus)));
    });
    body.querySelector("[data-reset]").addEventListener("click", () => {
      if (finished || locked) return;
      boxes = boxes.map(() => 0);
      clearFeedback();
      renderBoxes();
    });
    renderBoxes();
  }

  function renderBoxes() {
    boxes.forEach((n, i) => {
      const slot = body.querySelector(`[data-cookies="${i}"]`);
      slot.innerHTML = "";
      for (let j = 0; j < n; j++) {
        const c = document.createElement("i");
        c.className = "pb-cookie";
        slot.appendChild(c);
      }
    });
    const pool = body.querySelector("[data-pool]");
    pool.innerHTML = "";
    const left = total - placed();
    for (let j = 0; j < left; j++) {
      const c = document.createElement("i");
      c.className = "pb-cookie";
      pool.appendChild(c);
    }
    if (left === 0) pool.innerHTML = '<span class="pb-pool-empty">ninguna</span>';
  }

  function clearFeedback() {
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = "";
    feedback.className = "feedback";
  }

  function addCookie(i) {
    if (finished || locked || placed() >= total) return;
    boxes[i]++;
    clearFeedback();
    renderBoxes();
    // Al colocar la última galleta el reparto ya se puede juzgar: bloqueamos
    // para que un toque durante la pausa no altere lo que se va a evaluar.
    if (placed() === total) {
      locked = true;
      later(check, 350);
    }
  }

  function removeCookie(i) {
    if (finished || locked || boxes[i] === 0) return;
    boxes[i]--;
    clearFeedback();
    renderBoxes();
  }

  function check() {
    if (finished || placed() !== total) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const equal = boxes.every((n) => n === boxes[0]);
    if (equal) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Bien! ${perBox} galletas en cada caja`;
      feedback.className = "feedback ok";
      later(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `No todas tienen lo mismo: tocaban ${perBox} en cada caja`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 900);
      later(() => {
        boxes = boxes.map(() => 0);
        locked = false;
        clearFeedback();
        renderBoxes();
      }, 900);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "reparte", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🍪</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} repartos hechos</p>
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
    lastKey = "";
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
