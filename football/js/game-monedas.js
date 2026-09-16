// "Cuenta las monedas": toca monedas/billetes para alcanzar el importe
// exacto — aplicación real del dinero, mismo patrón "toca hasta cuadrar"
// que la balanza pero con denominaciones de céntimos/euros.
import { randInt, saveScore } from "./utils.js";

const COINS = [
  { value: 200, label: "2€", emoji: "🪙" },
  { value: 100, label: "1€", emoji: "🪙" },
  { value: 50, label: "50c", emoji: "🟤" },
  { value: 20, label: "20c", emoji: "🟤" },
  { value: 10, label: "10c", emoji: "🟤" },
];

function formatCents(c) {
  return `${(c / 100).toFixed(2)} €`;
}

export function mountMonedasGame(container, { client, onExit }) {
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
    // Múltiplo de 10 céntimos siempre alcanzable con las monedas disponibles.
    target = randInt(3, 30) * 10;
    current = 0;
    body.innerHTML = `
      <p class="prompt">Junta <b>${formatCents(target)}</b></p>
      <div class="money-total" data-total>${formatCents(0)}</div>
      <div class="money-coins" data-coins></div>
      <div class="feedback" data-feedback></div>
      <button class="secondary" data-reset style="margin-top:10px;">↺ Reiniciar</button>
    `;
    const coinsEl = body.querySelector("[data-coins]");
    COINS.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn coin-btn";
      btn.innerHTML = `${c.emoji}<br>${c.label}`;
      btn.addEventListener("click", () => addCoin(c.value));
      coinsEl.appendChild(btn);
    });
    body.querySelector("[data-reset]").addEventListener("click", () => {
      current = 0;
      body.querySelector("[data-total]").textContent = formatCents(current);
    });
  }

  function addCoin(v) {
    if (finished) return;
    current += v;
    body.querySelector("[data-total]").textContent = formatCents(current);
    const feedback = body.querySelector("[data-feedback]");
    rounds++;
    if (current === target) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Justo!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 650);
    } else if (current > target) {
      lives--;
      renderLives();
      feedback.textContent = "Te has pasado — vuelve a intentarlo";
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 550);
      setTimeout(() => {
        current = 0;
        body.querySelector("[data-total]").textContent = formatCents(current);
      }, 550);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "monedas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>💰</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} monedas usadas</p>
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
