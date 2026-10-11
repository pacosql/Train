// "Cuenta las monedas": toca monedas/billetes para alcanzar el importe
// exacto — aplicación real del dinero, mismo patrón "toca hasta cuadrar"
// que la balanza pero con denominaciones de céntimos/euros.
//
// v2 (petición de Paco): las monedas se dibujan como monedas de euro de
// verdad (2 € y 1 € bimetálicas, céntimos dorados, cada una con su
// tamaño) en vez de emojis que en el móvil salían como cuadritos; las que
// echas quedan a la vista en el monedero y tocando una la recuperas; y
// "Reiniciar" pasa a ser "Empezar de nuevo".
import { randInt, saveScore } from "./utils.js";

const COINS = [
  { value: 200, label: "2 €", kind: "c2e" },
  { value: 100, label: "1 €", kind: "c1e" },
  { value: 50, label: "50", kind: "cgold", size: 1 },
  { value: 20, label: "20", kind: "cgold", size: 0.9 },
  { value: 10, label: "10", kind: "cgold", size: 0.82 },
];
const coinHtml = (c, small) =>
  `<span class="coin ${c.kind}${small ? " small" : ""}" style="--s:${c.size || 1}"><span>${c.label}</span>${
    c.value < 100 ? "<i>cent</i>" : ""
  }</span>`;

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
  let purse = [];

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
    purse = [];
    body.innerHTML = `
      <p class="prompt">Junta <b>${formatCents(target)}</b></p>
      <div class="money-purse" data-purse></div>
      <div class="money-total" data-total>${formatCents(0)}</div>
      <div class="money-coins" data-coins></div>
      <div class="feedback" data-feedback></div>
      <button class="secondary" data-reset style="margin-top:10px;">↺ Empezar de nuevo</button>
    `;
    const coinsEl = body.querySelector("[data-coins]");
    COINS.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "coin-btn";
      btn.setAttribute("aria-label", c.value >= 100 ? `${c.value / 100} euros` : `${c.value} céntimos`);
      btn.innerHTML = coinHtml(c);
      btn.addEventListener("click", () => addCoin(c));
      coinsEl.appendChild(btn);
    });
    body.querySelector("[data-reset]").addEventListener("click", () => {
      current = 0;
      purse = [];
      paintPurse();
    });
    paintPurse();
  }

  // Monedero: las monedas echadas, a la vista; tocar una la devuelve.
  function paintPurse() {
    const el = body.querySelector("[data-purse]");
    el.innerHTML = purse.length
      ? purse.map((c, i) => `<button class="purse-coin" data-i="${i}">${coinHtml(c, true)}</button>`).join("")
      : `<span class="purse-empty">Toca las monedas para echarlas aquí</span>`;
    el.querySelectorAll("[data-i]").forEach((b) =>
      b.addEventListener("click", () => {
        if (finished) return;
        const c = purse.splice(Number(b.dataset.i), 1)[0];
        current -= c.value;
        paintPurse();
      })
    );
    body.querySelector("[data-total]").textContent = formatCents(current);
  }

  function addCoin(c) {
    if (finished) return;
    current += c.value;
    purse.push(c);
    paintPurse();
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
        purse = [];
        paintPurse();
      }, 900);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
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
