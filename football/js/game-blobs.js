// "Blobs de suma": un racimo de fichas numéricas (1-15) del que hay que
// tocar VARIAS (2 o más) cuya suma sea EXACTAMENTE el objetivo mostrado.
// Sobran fichas a propósito — la gracia es elegir con cuidado, no sumar
// todo el grupo. Inspirado en "Sum Blobs" de Beast Academy.
import { randInt, shuffle, saveScore } from "./utils.js";

const MIN_VAL = 1;
const MAX_VAL = 15;

// Todas las sumas posibles de todos los subconjuntos NO VACÍOS de `fichas`,
// por fuerza bruta (como mucho 8 fichas = 255 subconjuntos). Función pura,
// sin dependencias del DOM, para poder testearla aparte.
export function sumasPosibles(fichas) {
  const sums = new Set();
  const n = fichas.length;
  for (let mask = 1; mask < (1 << n); mask++) {
    let s = 0;
    for (let i = 0; i < n; i++) {
      if (mask & (1 << i)) s += fichas[i];
    }
    sums.add(s);
  }
  return sums;
}

// Decide cuántas fichas "solución" (3-5) y cuántas de relleno (2-4) lleva
// la ronda, de forma que el total quede entre 6 y 8 fichas.
function elegirRecuento() {
  let numSolucion;
  let numRelleno;
  let total;
  do {
    total = randInt(6, 8);
    numSolucion = randInt(3, 5);
    numRelleno = total - numSolucion;
  } while (numRelleno < 2 || numRelleno > 4);
  return { numSolucion, numRelleno };
}

// Construye una ronda: primero un subconjunto "solución" de 3-5 fichas que
// suman exactamente el objetivo, luego se añaden 2-4 fichas de relleno
// (distractores). Se verifica con `sumasPosibles` que el objetivo sea
// alcanzable de verdad y que no sea trivial (que no baste con sumar TODAS
// las fichas); si algo falla, se regenera entera.
export function generarRonda() {
  let fichas;
  let target;
  do {
    const { numSolucion, numRelleno } = elegirRecuento();
    const solucion = Array.from({ length: numSolucion }, () => randInt(MIN_VAL, MAX_VAL));
    target = solucion.reduce((a, b) => a + b, 0);
    const relleno = Array.from({ length: numRelleno }, () => randInt(MIN_VAL, MAX_VAL));
    fichas = shuffle(solucion.concat(relleno));
    const totalTodas = fichas.reduce((a, b) => a + b, 0);
    if (totalTodas === target) continue; // que no valga con tocarlas todas
    if (!sumasPosibles(fichas).has(target)) continue; // red de seguridad
    break;
  } while (true);
  return { fichas, target };
}

export function mountBlobsGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let fichas = [];
  let target = 0;
  let selected = new Set(); // índices de fichas tocadas en la ronda actual
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

  function setFeedback(text, kind) {
    const feedback = body.querySelector("[data-feedback]");
    if (!feedback) return;
    feedback.textContent = text;
    feedback.className = kind ? `feedback ${kind}` : "feedback";
  }

  function sumaSeleccionada() {
    let s = 0;
    selected.forEach((idx) => { s += fichas[idx]; });
    return s;
  }

  function updateSumbar() {
    const sumbar = body.querySelector("[data-sumbar]");
    if (sumbar) sumbar.textContent = `Suma seleccionada: ${sumaSeleccionada()}`;
  }

  function updateCheckBtn() {
    const checkBtn = body.querySelector("[data-check]");
    if (checkBtn) checkBtn.disabled = selected.size < 2 || locked;
  }

  function nextRound() {
    const ronda = generarRonda();
    fichas = ronda.fichas;
    target = ronda.target;
    selected = new Set();
    locked = false;

    body.innerHTML = `
      <p class="prompt">Selecciona fichas que sumen exactamente <b>${target}</b><small>Hay fichas de sobra: no hace falta usarlas todas</small></p>
      <div class="bl-cluster" data-cluster></div>
      <div class="bl-sumbar" data-sumbar>Suma seleccionada: 0</div>
      <div class="feedback" data-feedback></div>
      <button class="primary bl-check-btn" type="button" data-check disabled>Comprobar</button>
    `;

    const clusterEl = body.querySelector("[data-cluster]");
    fichas.forEach((num, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bl-tile";
      btn.dataset.num = String(num);
      btn.dataset.idx = String(idx);
      // Jitter suave para que el grupo se sienta como un racimo, no una tabla.
      const dy = Math.round(Math.random() * 14 - 7);
      const rot = Math.round(Math.random() * 10 - 5);
      btn.style.transform = `translateY(${dy}px) rotate(${rot}deg)`;
      btn.textContent = String(num);
      btn.addEventListener("click", () => toggleTile(idx, btn));
      clusterEl.appendChild(btn);
    });

    body.querySelector("[data-check]").addEventListener("click", comprobar);
    updateSumbar();
    updateCheckBtn();
  }

  function toggleTile(idx, btn) {
    if (finished || locked) return;
    if (selected.has(idx)) {
      selected.delete(idx);
      btn.classList.remove("bl-selected");
    } else {
      selected.add(idx);
      btn.classList.add("bl-selected");
    }
    updateSumbar();
    updateCheckBtn();
  }

  function comprobar() {
    if (finished || locked || selected.size < 2) return;
    const suma = sumaSeleccionada();
    if (suma === target) {
      locked = true;
      rounds++;
      score += 10;
      renderScore();
      setFeedback(`¡Exacto! Esas fichas suman ${target}.`, "ok");
      updateCheckBtn();
      later(nextRound, 900);
    } else {
      locked = true;
      lives--;
      renderLives();
      const diff = Math.abs(target - suma);
      const detalle = suma < target ? `te faltan ${diff}` : `te sobran ${diff}`;
      setFeedback(`Con esas fichas sumaste ${suma}, y el objetivo era ${target} (${detalle}).`, "bad");
      updateCheckBtn();
      if (lives <= 0) {
        later(() => finish(false), 900);
      } else {
        later(() => {
          // Se mantiene el mismo grupo de fichas: se puede reintentar.
          selected = new Set();
          locked = false;
          body.querySelectorAll(".bl-tile").forEach((el) => el.classList.remove("bl-selected"));
          updateSumbar();
          updateCheckBtn();
          setFeedback("", "");
        }, 900);
      }
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "blobs", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🫐</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} grupos resueltos</p>
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
