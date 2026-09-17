// "Sin pasarse de precio": adivina el precio EXACTO de un producto en
// máximo 6 intentos, al estilo "El Precio Justo". Tras cada puja el juego
// solo dice si el precio real es más alto o más bajo (nunca "te has
// pasado"), y el jugador debe usar el historial acumulado para converger
// mediante búsqueda binaria hasta dar con el número exacto.
import { randInt, saveScore } from "./utils.js";

// Banco de productos. `real` es el precio real, fijo y documentado (nunca
// aleatorio) para que la partida sea siempre justa y reproducible. `min`/
// `max` acotan el rango de precios posibles para ese producto: con 6
// intentos, una búsqueda binaria perfecta cubre como mucho 2^6 = 64 valores
// distintos, así que cada rango se deja en 50 valores (max - min = 49) para
// que 6 intentos basten con margen incluso sin bisección perfecta.
const PRODUCTS = [
  { emoji: "🚲", name: "Bicicleta", real: 300, min: 275, max: 324 },
  { emoji: "📱", name: "Móvil", real: 250, min: 225, max: 274 },
  { emoji: "🎧", name: "Auriculares", real: 40, min: 15, max: 64 },
  { emoji: "🧸", name: "Peluche", real: 15, min: 0, max: 49 },
  { emoji: "👟", name: "Zapatillas", real: 70, min: 45, max: 94 },
  { emoji: "🎮", name: "Videojuego", real: 60, min: 35, max: 84 },
  { emoji: "📷", name: "Cámara", real: 180, min: 155, max: 204 },
  { emoji: "⌚", name: "Reloj", real: 90, min: 65, max: 114 },
  { emoji: "🎸", name: "Guitarra", real: 220, min: 195, max: 244 },
  { emoji: "🛴", name: "Patinete", real: 150, min: 125, max: 174 },
  { emoji: "🧴", name: "Perfume", real: 55, min: 30, max: 79 },
  { emoji: "🎒", name: "Mochila", real: 45, min: 20, max: 69 },
  { emoji: "🖨️", name: "Impresora", real: 120, min: 95, max: 144 },
  { emoji: "🪑", name: "Silla de oficina", real: 160, min: 135, max: 184 },
  { emoji: "📺", name: "Televisor", real: 400, min: 375, max: 424 },
  { emoji: "🍳", name: "Sartén", real: 25, min: 0, max: 49 },
  { emoji: "🧳", name: "Maleta", real: 85, min: 60, max: 109 },
  { emoji: "🚁", name: "Dron", real: 130, min: 105, max: 154 },
  { emoji: "🎹", name: "Teclado musical", real: 200, min: 175, max: 224 },
  { emoji: "🛹", name: "Skate", real: 65, min: 40, max: 89 },
];

const MAX_ATTEMPTS = 6;
const MAX_DIGITS = 3; // ningún precio del banco pasa de 999 €

export function mountPujaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let product = null;
  let lastIndex = -1;
  let attempts = 0;
  let history = [];
  let typed = "";
  let locked = false; // evita pujar mientras se resuelve la ronda
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

  function pickProduct() {
    if (PRODUCTS.length === 1) return PRODUCTS[0];
    let idx;
    do {
      idx = randInt(0, PRODUCTS.length - 1);
    } while (idx === lastIndex);
    lastIndex = idx;
    return PRODUCTS[idx];
  }

  function nextRound() {
    product = pickProduct();
    attempts = 0;
    history = [];
    typed = "";
    locked = false;

    body.innerHTML = `
      <div class="pj-product">
        <div class="pj-product-emoji">${product.emoji}</div>
        <div class="pj-product-name">${product.name}</div>
      </div>
      <p class="prompt">¿Cuánto cuesta?<small>Puja un precio exacto en euros — te diremos si el real es más alto o más bajo</small></p>
      <div class="pj-attempts" data-attempts></div>
      <div class="pj-hint" data-hint></div>
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
      <div class="pj-history" data-history></div>
    `;

    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key";
      btn.type = "button";
      btn.textContent = key;
      if (key === "⌫") {
        btn.setAttribute("data-backspace", "");
        btn.addEventListener("click", () => pressBackspace());
      } else if (key === "✓") {
        btn.setAttribute("data-submit", "");
        btn.addEventListener("click", () => submit());
      } else {
        btn.setAttribute("data-digit", key);
        btn.addEventListener("click", () => pressDigit(key));
      }
      pad.appendChild(btn);
    });

    renderAttempts();
    renderDisplay();
    renderHistory();
  }

  function renderAttempts() {
    body.querySelector("[data-attempts]").textContent =
      `Intento ${Math.min(attempts + 1, MAX_ATTEMPTS)} de ${MAX_ATTEMPTS}`;
  }

  function renderDisplay() {
    body.querySelector("[data-display]").textContent = typed ? `${typed} €` : " ";
  }

  function renderHint(direction) {
    const hintEl = body.querySelector("[data-hint]");
    if (direction === "high") {
      hintEl.textContent = "🔼 Más alto";
      hintEl.className = "pj-hint pj-hint-high";
    } else if (direction === "low") {
      hintEl.textContent = "🔽 Más bajo";
      hintEl.className = "pj-hint pj-hint-low";
    } else {
      hintEl.textContent = "";
      hintEl.className = "pj-hint";
    }
  }

  function renderHistory() {
    const historyEl = body.querySelector("[data-history]");
    if (!historyEl) return;
    historyEl.innerHTML = history
      .map((h) => {
        const badgeClass = h.direction === "high" ? "pj-high" : "pj-low";
        const badgeText = h.direction === "high" ? "🔼 Más alto" : "🔽 Más bajo";
        return `
          <div class="pj-history-item">
            <span class="pj-history-guess">${h.guess} €</span>
            <span class="pj-history-badge ${badgeClass}">${badgeText}</span>
          </div>
        `;
      })
      .join("");
  }

  function pressDigit(d) {
    if (finished || locked) return;
    if (typed.length >= MAX_DIGITS) return;
    // Evita que el primer dígito sea un 0 (nadie puja "0€ de entrada"
    // salvo que sea el único dígito escrito).
    if (typed === "0") typed = d;
    else typed += d;
    renderDisplay();
  }

  function pressBackspace() {
    if (finished || locked) return;
    typed = typed.slice(0, -1);
    renderDisplay();
  }

  function submit() {
    if (finished || locked || typed === "") return;
    const guess = Number(typed);
    attempts++;
    const feedback = body.querySelector("[data-feedback]");

    if (guess === product.real) {
      locked = true;
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Exacto! El ${product.name.toLowerCase()} costaba justo ${product.real} €`;
      feedback.className = "feedback ok";
      renderHint(null);
      later(nextRound, 1200);
      return;
    }

    const direction = guess < product.real ? "high" : "low";
    history.push({ guess, direction });
    typed = "";
    renderDisplay();

    if (attempts >= MAX_ATTEMPTS) {
      locked = true;
      lives--;
      renderLives();
      feedback.textContent = `Se acabaron los intentos — el precio real era ${product.real} €`;
      feedback.className = "feedback bad";
      renderHint(null);
      renderHistory();
      if (lives <= 0) return later(() => finish(false), 1100);
      later(nextRound, 1400);
      return;
    }

    feedback.textContent =
      direction === "high"
        ? `Más alto — el precio real es mayor que tu puja`
        : `Más bajo — el precio real es menor que tu puja`;
    feedback.className = "feedback";
    renderHint(direction);
    renderHistory();
    renderAttempts();
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "puja", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>💵</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} precios acertados</p>
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
    lastIndex = -1;
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
