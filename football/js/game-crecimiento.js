// "Lineal contra exponencial": dos secuencias arrancan a la vez, una
// LINEAL (🐢, va sumando siempre lo mismo) y otra EXPONENCIAL (🐇, va
// multiplicando siempre por lo mismo). La lineal arranca por delante,
// pero la exponencial siempre acaba adelantándola — el jugador debe
// calcular en qué paso ocurre ese cruce por primera vez.
//
// La secuencia exponencial se simula paso a paso (nunca con logaritmos)
// para no arriesgar desvíos por redondeo al hallar el paso de cruce.
import { randInt, saveScore } from "./utils.js";

const MAX_DIGITS = 2; // crossStep siempre cae en [2, 9], pero dejamos margen

// Primer paso n >= 1 tal que E(n) > L(n), simulando paso a paso. Devuelve
// null si no se encuentra dentro del límite de seguridad (no debería
// ocurrir nunca con r >= 2, pero evita bucles infinitos).
function computeCrossStep(L0, d, E0, r) {
  for (let n = 1; n <= 30; n++) {
    const L = L0 + d * n;
    const E = E0 * Math.pow(r, n);
    if (E > L) return n;
  }
  return null;
}

export function generateCrecimientoRound() {
  let L0, d, E0, r, crossStep;
  let attempt = 0;
  do {
    attempt++;
    L0 = randInt(20, 60);
    d = randInt(2, 8);
    E0 = randInt(1, 5);
    r = randInt(2, 3);
    crossStep = L0 > E0 ? computeCrossStep(L0, d, E0, r) : null;
  } while ((crossStep === null || crossStep < 2 || crossStep > 9) && attempt < 200);

  if (crossStep === null || crossStep < 2 || crossStep > 9) {
    // Ronda de reserva verificada a mano (por si 200 intentos no bastaran):
    // L(n) = 30 + 5n  ·  E(n) = 2 * 2^n
    // n=0: L=30  E=2   n=1: L=35  E=4   n=2: L=40  E=8
    // n=3: L=45  E=16  n=4: L=50  E=32  n=5: L=55  E=64 -> 64 > 55
    // Primer paso con E > L: n = 5 (dentro de [2, 9]).
    return { L0: 30, d: 5, E0: 2, r: 2, crossStep: 5 };
  }
  return { L0, d, E0, r, crossStep };
}

function fullTable(round) {
  const rows = [];
  for (let n = 0; n <= round.crossStep; n++) {
    const L = round.L0 + round.d * n;
    const E = round.E0 * Math.pow(round.r, n);
    const mark = n === round.crossStep ? " ← aquí adelanta" : "";
    rows.push(`Paso ${n}: ${L} vs ${E}${mark}`);
  }
  return rows.join(" · ");
}

export function mountCrecimientoGame(container, { client, onExit }) {
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

  function nextRound() {
    if (finished) return;
    round = generateCrecimientoRound();
    typed = "";
    locked = false;

    const { L0, d, E0, r } = round;
    const L1 = L0 + d;
    const E1 = E0 * r;
    const L2 = L0 + d * 2;
    const E2 = E0 * r * r;

    body.innerHTML = `
      <div class="crc-rules">
        <div class="crc-rule-card crc-rule-linear">
          <span class="crc-emoji">🐢</span>
          <div class="crc-rule-text">Lineal: empieza en <b>${L0}</b> y suma <b>${d}</b> cada paso.</div>
        </div>
        <div class="crc-rule-card crc-rule-exp">
          <span class="crc-emoji">🐇</span>
          <div class="crc-rule-text">Exponencial: empieza en <b>${E0}</b> y se multiplica por <b>${r}</b> cada paso.</div>
        </div>
      </div>
      <div class="crc-example">
        <div class="crc-example-row">Paso 0: 🐢 ${L0} — 🐇 ${E0}</div>
        <div class="crc-example-row">Paso 1: 🐢 ${L1} — 🐇 ${E1}</div>
        <div class="crc-example-row">Paso 2: 🐢 ${L2} — 🐇 ${E2}</div>
      </div>
      <p class="prompt">Sigue calculando: ¿en qué paso 🐇 adelanta a 🐢 por primera vez?</p>
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
    body.querySelector("[data-display]").textContent = typed || " ";
  }

  function pressDigit(dig) {
    if (finished || locked) return;
    if (typed.length >= MAX_DIGITS) return;
    if (typed === "0") typed = dig;
    else typed += dig;
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
    locked = true;
    const feedback = body.querySelector("[data-feedback]");

    if (guess === round.crossStep) {
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! En el paso ${round.crossStep} 🐇 (${round.E0 * Math.pow(round.r, round.crossStep)}) supera a 🐢 (${round.L0 + round.d * round.crossStep}).`;
      feedback.className = "feedback ok";
      later(nextRound, 1900);
    } else {
      lives--;
      renderLives();
      feedback.innerHTML = `No es correcto. El cruce ocurre en el paso <b>${round.crossStep}</b>:<br>${fullTable(round)}`;
      feedback.className = "feedback bad";
      if (lives <= 0) {
        later(() => finish(false), 2600);
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
    saveScore(client, "crecimiento", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🐢</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} cruces calculados</p>
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
