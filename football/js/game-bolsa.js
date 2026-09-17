// "Compra y vende": el jugador compró una acción el día 1 y ve su precio
// a lo largo de 6 días como una gráfica de línea. Debe arrastrar un
// marcador a lo largo del eje de días para elegir en qué día VENDER,
// maximizando la ganancia (precio del día elegido − precio de compra).
// El día y la ganancia que daría esa elección se ven en todo momento —
// el reto es la DECISIÓN de a qué día arrastrar, no adivinar a ciegas.
import { randInt, clamp, saveScore } from "./utils.js";

const W = 300;
const H = 250;
const PAD_L = 34;
const PAD_R = 16;
const PLOT_TOP = 30;
const PLOT_BOTTOM = 140; // fin de la zona de la gráfica (eje de precios)
const DAY_LABEL_Y = 160; // etiquetas "1".."6" bajo la gráfica
const HANDLE_Y = 206; // fila donde vive el marcador arrastrable
const PLOT_H = PLOT_BOTTOM - PLOT_TOP;

// Genera 6 precios (día 1 a día 6) con variación día a día realista,
// acotados a un rango razonable. Se descarta y regenera mientras el
// máximo beneficio posible (vendiendo un día 2-6) no sea estrictamente
// positivo, para que la ronda tenga sentido.
export function generateBolsaRound() {
  let prices = [];
  let maxProfit = -Infinity;
  let bestDays = [];
  let guard = 0;
  do {
    guard++;
    prices = [randInt(15, 55)];
    for (let i = 1; i < 6; i++) {
      prices.push(clamp(prices[i - 1] + randInt(-8, 8), 5, 80));
    }
    const buyPrice = prices[0];
    maxProfit = -Infinity;
    for (let i = 1; i <= 5; i++) {
      const profit = prices[i] - buyPrice;
      if (profit > maxProfit) maxProfit = profit;
    }
    bestDays = [];
    for (let i = 1; i <= 5; i++) {
      if (prices[i] - buyPrice === maxProfit) bestDays.push(i);
    }
  } while (maxProfit <= 0 && guard < 100);

  // Salvaguarda: si tras 100 intentos (extremadamente improbable) la
  // racha aleatoria seguiría sin dar una ganancia positiva, se fuerza un
  // día ganador para que la ronda nunca se sirva rota.
  if (maxProfit <= 0) {
    const buyPrice = prices[0];
    prices[1] = clamp(buyPrice + 1, 5, 80);
    if (prices[1] <= buyPrice) prices[1] = Math.min(80, buyPrice + 1);
    maxProfit = -Infinity;
    for (let i = 1; i <= 5; i++) {
      const profit = prices[i] - buyPrice;
      if (profit > maxProfit) maxProfit = profit;
    }
    bestDays = [];
    for (let i = 1; i <= 5; i++) {
      if (prices[i] - buyPrice === maxProfit) bestDays.push(i);
    }
  }

  return { prices, buyDay: 0, maxProfit, bestDays };
}

export function mountBolsaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let timers = [];
  let round = null;
  let selectedIndex = 1; // índice 1..5 (día 2..6)
  let svgEl = null;

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

  function xFor(i) {
    return PAD_L + (i * (W - PAD_L - PAD_R)) / 5;
  }
  function yFor(price) {
    const min = Math.min(...round.prices);
    const max = Math.max(...round.prices);
    const range = Math.max(1, max - min);
    const pad = Math.max(3, range * 0.15);
    const lo = min - pad;
    const hi = max + pad;
    return PLOT_TOP + PLOT_H - ((price - lo) / (hi - lo)) * PLOT_H;
  }

  function profitFor(i) {
    return round.prices[i] - round.prices[0];
  }

  function nextRound() {
    if (finished) return;
    locked = false;
    round = generateBolsaRound();
    // Salida inicial lejos de cualquier día ganador, para que arrastrar
    // sea de verdad una decisión y no un acierto de partida.
    const candidates = [1, 2, 3, 4, 5].filter((i) => !round.bestDays.includes(i));
    selectedIndex = candidates.length ? candidates[randInt(0, candidates.length - 1)] : 1;

    const buyPrice = round.prices[0];
    const linePoints = round.prices.map((p, i) => `${xFor(i)},${yFor(p)}`).join(" ");
    let priceLabels = "";
    round.prices.forEach((p, i) => {
      priceLabels += `<text class="bls-price" x="${xFor(i)}" y="${yFor(p) - 12}" text-anchor="middle">${p}€</text>`;
    });
    let dayLabels = "";
    for (let i = 0; i <= 5; i++) {
      dayLabels += `<text class="bls-daynum" x="${xFor(i)}" y="${DAY_LABEL_Y}" text-anchor="middle">${i + 1}</text>`;
    }

    body.innerHTML = `
      <div class="bls-wrap">
        <p class="prompt">Compraste esta acción el día 1 🛒<small>Arrastra el marcador hasta el día en que quieras vender y consigue el mayor beneficio posible</small></p>
        <svg class="bls-chart" data-svg viewBox="0 0 ${W} ${H}" role="img" aria-label="gráfica de precios de la acción">
          <line class="bls-buyline" x1="${PAD_L}" y1="${yFor(buyPrice)}" x2="${W - PAD_R}" y2="${yFor(buyPrice)}"/>
          <polyline class="bls-line" points="${linePoints}"/>
          ${round.prices.map((p, i) => `<circle class="bls-dot${i === 0 ? " bls-dot--buy" : ""}" cx="${xFor(i)}" cy="${yFor(p)}" r="5"/>`).join("")}
          <text class="bls-buytag" x="${xFor(0)}" y="${yFor(buyPrice) + 22}" text-anchor="middle">🛒 compra</text>
          ${priceLabels}
          ${dayLabels}
          <line class="bls-track" x1="${xFor(1)}" y1="${HANDLE_Y}" x2="${xFor(5)}" y2="${HANDLE_Y}"/>
          ${[1, 2, 3, 4, 5].map((i) => `<circle class="bls-tick" cx="${xFor(i)}" cy="${HANDLE_Y}" r="3"/>`).join("")}
          <line class="bls-vline" data-vline x1="${xFor(selectedIndex)}" y1="${PLOT_TOP - 4}" x2="${xFor(selectedIndex)}" y2="${HANDLE_Y}"/>
          <circle class="bls-hit" data-hit cx="${xFor(selectedIndex)}" cy="${HANDLE_Y}" r="22" fill="transparent"/>
          <circle class="bls-marker" data-marker cx="${xFor(selectedIndex)}" cy="${HANDLE_Y}" r="10"/>
        </svg>
        <div class="bls-info">
          <span class="bls-day-label" data-day-label></span>
          <span class="bls-profit-label" data-profit-label></span>
        </div>
        <button class="primary" data-confirm>Vender</button>
        <div class="feedback" data-feedback></div>
      </div>
    `;

    svgEl = body.querySelector("[data-svg]");
    updateInfo();
    bindDrag();
    body.querySelector("[data-confirm]").addEventListener("click", confirmSale);
  }

  function updateInfo() {
    const dayLabelEl = body.querySelector("[data-day-label]");
    const profitLabelEl = body.querySelector("[data-profit-label]");
    const profit = profitFor(selectedIndex);
    dayLabelEl.textContent = `Día ${selectedIndex + 1}`;
    profitLabelEl.textContent = `${profit >= 0 ? "+" : ""}${profit} €`;
    profitLabelEl.classList.toggle("bls-profit-label--pos", profit > 0);
    profitLabelEl.classList.toggle("bls-profit-label--neg", profit <= 0);
    const vline = svgEl.querySelector("[data-vline]");
    const hit = svgEl.querySelector("[data-hit]");
    const marker = svgEl.querySelector("[data-marker]");
    const x = xFor(selectedIndex);
    vline.setAttribute("x1", x);
    vline.setAttribute("x2", x);
    hit.setAttribute("cx", x);
    marker.setAttribute("cx", x);
  }

  function setIndex(i) {
    selectedIndex = clamp(Math.round(i), 1, 5);
    updateInfo();
  }

  function bindDrag() {
    let dragging = false;
    function toIndex(clientX) {
      const rect = svgEl.getBoundingClientRect();
      const scale = rect.width / W; // el viewBox mantiene la proporción
      const x1 = rect.left + xFor(1) * scale;
      const x5 = rect.left + xFor(5) * scale;
      const pct = clamp((clientX - x1) / (x5 - x1), 0, 1);
      return 1 + Math.round(pct * 4);
    }
    const hit = svgEl.querySelector("[data-hit]");
    function onDown(e) {
      if (finished || locked) return;
      dragging = true;
      setIndex(toIndex(e.clientX));
      hit.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      if (!dragging || finished || locked) return;
      setIndex(toIndex(e.clientX));
    }
    function onUp() {
      dragging = false;
    }
    hit.addEventListener("pointerdown", onDown);
    hit.addEventListener("pointermove", onMove);
    hit.addEventListener("pointerup", onUp);
    hit.addEventListener("pointercancel", onUp);
  }

  function confirmSale() {
    if (finished || locked) return;
    locked = true;
    rounds++;
    body.querySelector("[data-confirm]").disabled = true;
    const feedback = body.querySelector("[data-feedback]");
    const chosenProfit = profitFor(selectedIndex);
    const ok = round.bestDays.includes(selectedIndex);
    if (ok) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Vendiste en el mejor momento! Ganaste ${chosenProfit} €.`;
      feedback.className = "feedback ok";
      later(nextRound, 1300);
    } else {
      lives--;
      renderLives();
      const bestIndex = round.bestDays[0];
      feedback.textContent = `El mejor día era el ${bestIndex + 1}, con ${round.maxProfit} € de beneficio; tú elegiste el día ${selectedIndex + 1}, con ${chosenProfit >= 0 ? "solo " : ""}${chosenProfit} €.`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1800);
      later(nextRound, 1800);
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
    saveScore(client, "bolsa", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📉</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} ventas decididas</p>
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
    locked = false;
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
