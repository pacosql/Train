// "El ticket incompleto": un ticket de compra con un precio tapado; hay que
// deducirlo restando la suma de los precios visibles al total. Todo el
// cálculo interno se hace en céntimos (enteros) para no arrastrar errores
// de redondeo de coma flotante, y solo se formatea a "X,YY €" al mostrar.
import { randInt, shuffle, saveScore } from "./utils.js";

const ITEM_NAMES = [
  "Pan", "Leche", "Huevos", "Manzanas", "Café", "Arroz", "Pasta", "Aceite",
  "Yogur", "Queso", "Tomates", "Naranjas", "Azúcar", "Galletas", "Zumo",
];

const ITEM_EMOJI = {
  Pan: "🍞", Leche: "🥛", Huevos: "🥚", Manzanas: "🍎", Café: "☕",
  Arroz: "🍚", Pasta: "🍝", Aceite: "🫒", Yogur: "🥣", Queso: "🧀",
  Tomates: "🍅", Naranjas: "🍊", Azúcar: "🧂", Galletas: "🍪", Zumo: "🧃",
};

// Formatea céntimos (entero) como "X,YY €".
function formatCents(cents) {
  const euros = Math.floor(cents / 100);
  const rest = cents % 100;
  return `${euros},${String(rest).padStart(2, "0")} €`;
}

export function mountTicketGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let typed = "";
  let locked = false;
  const timers = [];

  // Estado de la ronda actual.
  let items = [];       // [{ name, cents }]
  let hiddenIndex = -1;
  let totalCents = 0;
  let visibleSumCents = 0;
  let hiddenCents = 0;

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

  // Convierte lo tecleado ("2,35" o "5") a céntimos enteros.
  // Devuelve null si no hay nada válido que interpretar.
  function typedToCents(text) {
    if (!text) return null;
    const [euroPart, centPart = ""] = text.split(",");
    if (euroPart === "" && centPart === "") return null;
    const euros = euroPart === "" ? 0 : Number(euroPart);
    let cents = 0;
    if (centPart !== "") {
      const twoDigits = (centPart + "00").slice(0, 2);
      cents = Number(twoDigits);
    }
    if (!Number.isFinite(euros) || !Number.isFinite(cents)) return null;
    return euros * 100 + cents;
  }

  function nextRound() {
    const n = randInt(3, 5);
    const names = shuffle(ITEM_NAMES).slice(0, n);
    items = names.map((name) => ({ name, cents: randInt(50, 1500) }));
    hiddenIndex = randInt(0, n - 1);
    totalCents = items.reduce((sum, it) => sum + it.cents, 0);
    hiddenCents = items[hiddenIndex].cents;
    visibleSumCents = totalCents - hiddenCents;

    typed = "";
    locked = false;

    const rowsHtml = items
      .map((it, i) => {
        const emoji = ITEM_EMOJI[it.name] || "🛒";
        const priceHtml = i === hiddenIndex
          ? `<span class="tk2-price tk2-price-hidden" data-hidden-price>???€</span>`
          : `<span class="tk2-price">${formatCents(it.cents)}</span>`;
        return `
          <li class="tk2-item">
            <span class="tk2-item-name">${emoji} ${it.name}</span>
            ${priceHtml}
          </li>
        `;
      })
      .join("");

    body.innerHTML = `
      <p class="prompt">🧾 ¿Cuánto costaba el artículo oculto?</p>
      <ul class="tk2-ticket" data-ticket>
        ${rowsHtml}
        <li class="tk2-total">
          <span class="tk2-item-name">TOTAL</span>
          <span class="tk2-price" data-total>${formatCents(totalCents)}</span>
        </li>
      </ul>
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <button class="choice-btn keypad-sign" data-submit>✓ Confirmar</button>
      <div class="feedback" data-feedback></div>
    `;

    const displayEl = body.querySelector("[data-display]");
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key";
      btn.type = "button";
      btn.textContent = key;
      if (key === ",") {
        btn.dataset.comma = "";
      } else if (key === "⌫") {
        btn.dataset.backspace = "";
      } else {
        btn.dataset.digit = key;
      }
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    body.querySelector("[data-submit]").addEventListener("click", submit);

    function updateDisplay() {
      displayEl.textContent = typed ? `${typed} €` : " ";
    }
    updateDisplay();

    function pressKey(key) {
      if (finished || locked) return;
      if (key === "⌫") {
        typed = typed.slice(0, -1);
      } else if (key === ",") {
        if (!typed.includes(",") && typed.length < 8) typed += ",";
      } else if (typed.length < 8) {
        typed += key;
      }
      updateDisplay();
    }
  }

  function submit() {
    if (finished || locked || typed === "") return;
    const value = typedToCents(typed);
    if (value === null) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (value === hiddenCents) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! El artículo oculto costaba ${formatCents(hiddenCents)}`;
      feedback.className = "feedback ok";
      const hiddenEl = body.querySelector("[data-hidden-price]");
      if (hiddenEl) {
        hiddenEl.textContent = formatCents(hiddenCents);
        hiddenEl.classList.remove("tk2-price-hidden");
      }
      later(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const detail = items
        .filter((_, i) => i !== hiddenIndex)
        .map((it) => formatCents(it.cents))
        .join(" + ");
      feedback.textContent =
        `Total ${formatCents(totalCents)} − (suma de los precios visibles: ${detail} = ${formatCents(visibleSumCents)}) ` +
        `= ${formatCents(hiddenCents)} era el precio oculto, no lo que escribiste`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1400);
      later(nextRound, 1600);
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
    saveScore(client, "ticket", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧾</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} tickets resueltos</p>
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
    timers.forEach(clearTimeout);
  };
}
