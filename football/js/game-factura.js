// "La factura por tramos": una factura de agua o de luz cobra un precio
// distinto según tramos de consumo (tarifa progresiva, como las reales).
// El jugador debe calcular el importe TOTAL sumando lo que corresponde a
// cada tramo — el error típico a evitar es multiplicar todo el consumo
// por la tarifa más alta (o por la más baja).
import { randInt, pick, saveScore } from "./utils.js";

const MAX_DIGITS = 5;

const TIPOS = [
  { tipo: "agua", emoji: "💧", nombre: "Factura del agua", unidad: "m³" },
  { tipo: "luz", emoji: "⚡", nombre: "Factura de la luz", unidad: "kWh" },
];

// Calcula el importe total sumando, tramo a tramo, las unidades de
// consumo que caen dentro de ese tramo multiplicadas por su tarifa.
// `tramos` es una lista de { desde, hasta, tarifa } con `hasta: null`
// para el último tramo (sin techo).
export function calcularImporte(tramos, consumo) {
  let total = 0;
  for (const t of tramos) {
    const techo = t.hasta === null ? Infinity : t.hasta;
    const unidadesEnTramo = Math.max(0, Math.min(consumo, techo) - t.desde);
    total += unidadesEnTramo * t.tarifa;
  }
  return total;
}

export function generateFacturaRound() {
  const { tipo, emoji, nombre, unidad } = pick(TIPOS);
  const numTramos = pick([2, 3]);

  // Tarifas estrictamente crecientes tramo a tramo.
  const tarifas = [];
  let tarifaPrev = randInt(1, 3);
  tarifas.push(tarifaPrev);
  for (let i = 1; i < numTramos; i++) {
    tarifaPrev = tarifaPrev + randInt(1, 3);
    tarifas.push(tarifaPrev);
  }

  // Anchuras de tramo (el último tramo no tiene techo, así que solo
  // necesitamos anchura para los numTramos - 1 primeros).
  const tramos = [];
  let desde = 0;
  for (let i = 0; i < numTramos; i++) {
    if (i < numTramos - 1) {
      const ancho = randInt(5, 15);
      const hasta = desde + ancho;
      tramos.push({ desde, hasta, tarifa: tarifas[i] });
      desde = hasta;
    } else {
      tramos.push({ desde, hasta: null, tarifa: tarifas[i] });
    }
  }

  const ultimoBreakpoint = desde; // desde acumulado = último breakpoint finito
  const consumoMax = Math.max(ultimoBreakpoint + 1, Math.round(ultimoBreakpoint * 1.5));
  const consumo = randInt(1, consumoMax);

  const importeCorrecto = calcularImporte(tramos, consumo);

  return { tipo, emoji, nombre, unidad, tramos, consumo, importeCorrecto };
}

export function mountFacturaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let typed = "";
  let locked = false;
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

  function tramoLabel(t) {
    if (t.hasta === null) {
      return `Más de ${t.desde} ${round.unidad}: ${t.tarifa}€/${round.unidad}`;
    }
    return `De ${t.desde} a ${t.hasta} ${round.unidad}: ${t.tarifa}€/${round.unidad}`;
  }

  function tramosHtml() {
    return round.tramos
      .map((t) => `<div class="fac-tramo">${tramoLabel(t)}</div>`)
      .join("");
  }

  function nextRound() {
    round = generateFacturaRound();
    typed = "";
    locked = false;

    body.innerHTML = `
      <p class="fac-titulo">${round.emoji} <b>${round.nombre}</b></p>
      <div class="fac-tabla">${tramosHtml()}</div>
      <p class="fac-consumo">Este mes gastaste <b>${round.consumo} ${round.unidad}</b></p>
      <p class="prompt">¿Cuánto suma la factura en total?</p>
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
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

    renderDisplay();
  }

  function renderDisplay() {
    body.querySelector("[data-display]").textContent = typed ? `${typed}€` : " ";
  }

  function pressDigit(d) {
    if (finished || locked) return;
    if (typed.length >= MAX_DIGITS) return;
    if (typed === "0") typed = d;
    else typed += d;
    renderDisplay();
  }

  function pressBackspace() {
    if (finished || locked) return;
    typed = typed.slice(0, -1);
    renderDisplay();
  }

  function desglose() {
    const partes = round.tramos.map((t, i) => {
      const techo = t.hasta === null ? Infinity : t.hasta;
      const unidadesEnTramo = Math.max(0, Math.min(round.consumo, techo) - t.desde);
      const subtotal = unidadesEnTramo * t.tarifa;
      return `Tramo ${i + 1}: ${unidadesEnTramo}×${t.tarifa}€=${subtotal}€`;
    });
    return `${partes.join(" · ")} · Total: ${round.importeCorrecto}€`;
  }

  function submit() {
    if (finished || locked || typed === "") return;
    const guess = Number(typed);
    locked = true;
    const feedback = body.querySelector("[data-feedback]");

    if (guess === round.importeCorrecto) {
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${desglose()}`;
      feedback.className = "feedback ok";
      later(nextRound, 1800);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `No es correcto. ${desglose()}`;
      feedback.className = "feedback bad";
      if (lives <= 0) {
        later(() => finish(false), 2200);
      } else {
        later(nextRound, 2600);
      }
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "factura", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧾</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} facturas calculadas</p>
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
