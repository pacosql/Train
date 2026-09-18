// "Regletas relativas": inspirado en las regletas Cuisenaire. Cada
// longitud entera de 1 a 10 tiene SIEMPRE el mismo color fijo (paleta
// clásica), pero el VALOR de una regleta depende de cuál se declare "la
// unidad" — la idea central del material. Cada ronda muestra la regleta
// larga (longitud U) marcada como "vale 1 entero" y una regleta corta
// (longitud L < U), y el jugador debe decir qué fracción de la unidad
// representa la corta.
//
// La ronda se genera "al revés" para que la fracción resultante sea
// siempre simple y sin ambigüedad: se elige primero un denominador d
// (2-6) y un numerador n (1..d-1) YA reducidos (mcd(n,d)===1), y luego
// U = d*k, L = n*k para un k pequeño (1 o 2) que mantenga U <= 10 (el
// rango real de las regletas). Como n/d ya está en su mínima expresión,
// L/U = (n*k)/(d*k) se simplifica siempre exactamente a n/d.
import { randInt, pick, shuffle, buildChoices, saveScore } from "./utils.js";

// Paleta clásica Cuisenaire: cada longitud (1-10) tiene un color fijo,
// nunca cambia con la ronda.
const ROD_COLORS = {
  1: { bg: "#ffffff", border: "#c7c7c7", text: "#2c2c2c" }, // blanco
  2: { bg: "#e0483e", border: "#b8362d", text: "#ffffff" }, // rojo
  3: { bg: "#9fe08a", border: "#6fbf5a", text: "#254a1a" }, // verde claro
  4: { bg: "#b48ad4", border: "#9068b0", text: "#ffffff" }, // morado/lila
  5: { bg: "#f4d13f", border: "#cdac1f", text: "#3a3000" }, // amarillo
  6: { bg: "#2f7d3c", border: "#1f5c29", text: "#ffffff" }, // verde oscuro
  7: { bg: "#2b2b2b", border: "#000000", text: "#ffffff" }, // negro
  8: { bg: "#8b5a2b", border: "#6a431d", text: "#ffffff" }, // marrón
  9: { bg: "#3f6fd1", border: "#2b4f9e", text: "#ffffff" }, // azul
  10: { bg: "#ef8b1e", border: "#c56f10", text: "#ffffff" }, // naranja
};

function mcd(a, b) {
  return b === 0 ? a : mcd(b, a % b);
}

function fracStr(n, d) {
  return `${n}/${d}`;
}

// Distractor: una fracción reducida distinta, generada perturbando el
// numerador, el denominador, o del todo al azar — así los distractores
// quedan cerca de la fracción correcta (plausibles) pero variados.
function makeDistractor(n, d) {
  const mode = randInt(0, 2);
  let n2, d2;
  if (mode === 0) {
    // mismo denominador, numerador vecino
    d2 = d;
    n2 = n + pick([-1, 1]);
    if (n2 < 1) n2 = 1;
    if (n2 >= d2) n2 = d2 - 1;
  } else if (mode === 1) {
    // denominador vecino, numerador al azar válido
    d2 = d + pick([-1, 1]);
    if (d2 < 2) d2 = 2;
    if (d2 > 6) d2 = 6;
    n2 = randInt(1, d2 - 1);
  } else {
    // fracción reducida totalmente al azar dentro del mismo rango de ronda
    d2 = randInt(2, 6);
    n2 = randInt(1, d2 - 1);
  }
  const g = mcd(n2, d2);
  n2 = n2 / g;
  d2 = d2 / g;
  return fracStr(n2, d2);
}

// Genera una ronda completa. Exportada aparte de mountRegletasGame para
// poder testearla sin DOM (ver script de simulación).
export function generateRegletasRound() {
  let d, n;
  do {
    d = randInt(2, 6);
    n = randInt(1, d - 1);
  } while (mcd(n, d) !== 1);

  const maxK = Math.floor(10 / d); // d*maxK <= 10 siempre (d entre 2 y 6 -> maxK >= 1)
  const kOptions = [];
  for (let kk = 1; kk <= Math.min(2, maxK); kk++) kOptions.push(kk);
  const k = pick(kOptions);

  const U = d * k;
  const L = n * k;
  const correct = fracStr(n, d);
  const choices = buildChoices(correct, () => makeDistractor(n, d), 4);

  return { n, d, k, U, L, correct, choices };
}

function rodHtml(round) {
  const { U, L, d, n } = round;
  const unitPx = 24; // px por unidad de longitud (máximo posible: 10*24 = 240px, cabe a 400px de ancho)
  const uColor = ROD_COLORS[U];
  const lColor = ROD_COLORS[L];
  const segWidth = unitPx * (U / d); // ancho de cada una de las d partes iguales en que se divide la unidad (= unitPx*k)
  const highlightWidth = segWidth * n; // las n partes que "caben" en la regleta corta

  const dividers = [];
  for (let i = 1; i < d; i++) {
    dividers.push(`<span class="rgl-rod-divider" style="left:${(segWidth * i).toFixed(2)}px;"></span>`);
  }

  return `
    <div class="rgl-rods">
      <div class="rgl-rod-row">
        <div class="rgl-rod-label">Regleta unidad — vale <strong>1 entero</strong> (mide ${U})</div>
        <div class="rgl-rod rgl-rod-unit" style="width:${(unitPx * U).toFixed(2)}px; background:${uColor.bg}; border-color:${uColor.border};">
          <span class="rgl-rod-highlight" style="width:${highlightWidth.toFixed(2)}px;"></span>
          ${dividers.join("")}
          <span class="rgl-rod-num" style="color:${uColor.text}">${U}</span>
        </div>
      </div>
      <div class="rgl-rod-row">
        <div class="rgl-rod-label">Regleta corta — mide ${L}</div>
        <div class="rgl-rod rgl-rod-short" style="width:${(unitPx * L).toFixed(2)}px; background:${lColor.bg}; border-color:${lColor.border};">
          <span class="rgl-rod-num" style="color:${lColor.text}">${L}</span>
        </div>
      </div>
    </div>
  `;
}

export function mountRegletasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita pulsar dos opciones mientras se resuelve la ronda
  let round = null;
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

  function nextRound() {
    round = generateRegletasRound();
    locked = false;

    body.innerHTML = `
      ${rodHtml(round)}
      <p class="prompt">¿Qué fracción de la unidad es la regleta corta?
        <small>La regleta larga de arriba es la unidad (vale 1 entero) — compárala con la corta.</small>
      </p>
      <div class="choices" data-choices></div>
      <div class="feedback" data-feedback></div>
    `;

    const choicesEl = body.querySelector("[data-choices]");
    const buttons = round.choices.map((value) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = value;
      btn.dataset.value = value;
      choicesEl.appendChild(btn);
      return btn;
    });
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => selectChoice(btn.dataset.value, btn, buttons));
    });
  }

  function selectChoice(value, btn, buttons) {
    if (finished || locked) return;
    locked = true;
    buttons.forEach((b) => { b.disabled = true; });

    const { n, d, U, L, correct } = round;
    const feedback = body.querySelector("[data-feedback]");
    const explanation = `la regleta corta mide ${L} y la unidad mide ${U}, así que ${L}/${U} = ${n}/${d}`;
    const isCorrect = value === correct;

    if (isCorrect) {
      btn.classList.add("correct");
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${explanation}.`;
      feedback.className = "feedback ok";
      later(nextRound, 1100);
      return;
    }

    btn.classList.add("wrong");
    buttons.forEach((b) => {
      if (b.dataset.value === correct) b.classList.add("correct");
    });
    lives--;
    renderLives();
    feedback.textContent = `No es correcto — ${explanation}.`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 1400);
    later(nextRound, 1800);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "regletas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🟧</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} regletas comparadas</p>
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
