// "La compra": gastar un presupuesto exacto en una tienda pequeña.
// Todo el cálculo va en céntimos enteros — con euros decimales el
// 0.1 + 0.2 del coma flotante haría fallar rondas correctas.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const ARTICULOS = [
  { emoji: "🍎", nombre: "manzana" },
  { emoji: "🍌", nombre: "plátano" },
  { emoji: "🥖", nombre: "barra" },
  { emoji: "🧀", nombre: "queso" },
  { emoji: "🥕", nombre: "zanahoria" },
  { emoji: "🍅", nombre: "tomate" },
  { emoji: "🥚", nombre: "huevos" },
  { emoji: "🍫", nombre: "chocolate" },
  { emoji: "🧃", nombre: "zumo" },
  { emoji: "🍪", nombre: "galletas" },
  { emoji: "🍐", nombre: "pera" },
  { emoji: "🥛", nombre: "leche" },
];

const PRECIOS = [15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 75, 80, 90, 100, 110, 120, 125, 140, 150];

function eur(cents) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export function mountCompraGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let timers = [];
  let tienda = [];
  let budget = 0;
  let cart = [];

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

  function total() {
    return cart.reduce((s, i) => s + i.precio, 0);
  }

  function nextRound() {
    const items = shuffle(ARTICULOS).slice(0, 6);
    const precios = shuffle(PRECIOS).slice(0, 6); // precios distintos: menos confusión al sumar
    tienda = items.map((it, i) => ({ ...it, precio: precios[i] }));

    // El presupuesto se construye sumando artículos reales de esta tienda,
    // así siempre existe una combinación exacta. Se descarta si coincide
    // con el precio de un artículo suelto (se ganaría de un solo toque).
    // El contador es un seguro: con precios muy baratos el rango tarda.
    let guard = 0;
    do {
      budget = 0;
      const n = randInt(2, 4);
      for (let i = 0; i < n; i++) budget += pick(tienda).precio;
      guard++;
    } while (
      guard < 400 &&
      (budget < (guard < 200 ? 100 : 60) || budget > 550 || tienda.some((t) => t.precio === budget))
    );

    cart = [];
    body.innerHTML = `
      <div class="shop-wrap">
        <p class="prompt shop-prompt">Tienes <b>${eur(budget)}</b><small>gástalos exactamente</small></p>
        <div class="shop-grid" data-shop></div>
        <div class="shop-cart">
          <div class="shop-cart-items" data-cart></div>
          <div class="shop-total" data-total></div>
        </div>
        <div class="feedback" data-feedback></div>
        <button class="secondary shop-reset" data-reset>↺ Vaciar cesta</button>
      </div>
    `;
    const shopEl = body.querySelector("[data-shop]");
    tienda.forEach((t) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn shop-item";
      btn.innerHTML = `<span class="shop-emoji">${t.emoji}</span><span class="shop-precio">${eur(t.precio)}</span>`;
      btn.addEventListener("click", () => addItem(t));
      shopEl.appendChild(btn);
    });
    body.querySelector("[data-reset]").addEventListener("click", () => {
      if (finished) return;
      cart = [];
      renderCart();
    });
    renderCart();
  }

  function renderCart() {
    const cartEl = body.querySelector("[data-cart]");
    const totalEl = body.querySelector("[data-total]");
    if (!cartEl || !totalEl) return;
    cartEl.innerHTML = cart.length
      ? cart.map((i) => `<span class="shop-chip">${i.emoji}</span>`).join("")
      : `<span class="shop-empty">cesta vacía</span>`;
    totalEl.innerHTML = `${eur(total())} <span class="shop-of">de ${eur(budget)}</span>`;
  }

  function addItem(t) {
    if (finished) return;
    cart.push(t);
    renderCart();
    const feedback = body.querySelector("[data-feedback]");
    const suma = total();
    if (suma === budget) {
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = "¡Justo! Compra pagada 🧾";
      feedback.className = "feedback ok";
      body.querySelectorAll(".shop-item").forEach((b) => { b.disabled = true; });
      later(nextRound, 800);
    } else if (suma > budget) {
      lives--;
      renderLives();
      feedback.textContent = "Te has pasado del presupuesto";
      feedback.className = "feedback bad";
      body.querySelectorAll(".shop-item").forEach((b) => { b.disabled = true; });
      if (lives <= 0) return later(() => finish(false), 800);
      later(() => {
        cart = [];
        renderCart();
        feedback.textContent = "";
        feedback.className = "feedback";
        body.querySelectorAll(".shop-item").forEach((b) => { b.disabled = false; });
      }, 850);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "compra", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🛒</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} compras exactas</p>
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
