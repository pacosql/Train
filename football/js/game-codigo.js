// "Rompe el código": Mastermind numérico de 3 cifras sin repetir. La
// gracia es el valor posicional — cada intento da pistas de sitio/cifra
// que hay que combinar con los intentos anteriores, así que el historial
// completo se queda siempre visible.
import { shuffle, saveScore } from "./utils.js";

const CODE_LEN = 3;
const MAX_ATTEMPTS = 6;

// Compara un intento contra el código secreto (arrays de dígitos únicos,
// sin repetición dentro de cada uno) y devuelve el pistaje estilo
// Mastermind: cifras en su sitio exacto y cifras que están pero
// descolocadas. Se exporta aparte para poder simularla en aislado.
export function compareGuess(secret, guess) {
  let exact = 0;
  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) exact++;
  }
  const secretSet = new Set(secret);
  let common = 0;
  for (const d of guess) {
    if (secretSet.has(d)) common++;
  }
  return { exact, misplaced: common - exact };
}

function randomCode() {
  return shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, CODE_LEN);
}

function hintText({ exact, misplaced }) {
  const sitio = exact === 1 ? "1 en su sitio" : `${exact} en su sitio`;
  const desc = misplaced === 1 ? "1 descolocada" : `${misplaced} descolocadas`;
  if (exact === 0 && misplaced === 0) return "Ninguna cifra coincide: prueba con otras tres";
  return `${sitio}, ${desc}`;
}

export function mountCodigoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let secret = [];
  let lastSecretKey = "";
  let attempts = [];
  let guess = [];
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

  let slotsEl, historyEl, keypadEl, feedbackEl, attemptsLeftEl;

  function nextRound() {
    // Nunca repetir el código de la ronda anterior, para que no haya
    // partidas seguidas idénticas por pura chiripa.
    do {
      secret = randomCode();
    } while (secret.join("") === lastSecretKey);
    lastSecretKey = secret.join("");
    attempts = [];
    guess = [];

    body.innerHTML = `
      <p class="prompt">Adivina el código de 3 cifras (0-9, sin repetir)<small>Tienes ${MAX_ATTEMPTS} intentos por ronda</small></p>
      <div class="cg-slots" data-slots></div>
      <div class="cg-attempts-left" data-attempts-left></div>
      <div class="cg-keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
      <div class="cg-history" data-history></div>
    `;
    slotsEl = body.querySelector("[data-slots]");
    historyEl = body.querySelector("[data-history]");
    keypadEl = body.querySelector("[data-keypad]");
    feedbackEl = body.querySelector("[data-feedback]");
    attemptsLeftEl = body.querySelector("[data-attempts-left]");

    buildKeypad();
    renderSlots();
    renderAttemptsLeft();
    renderHistory();
  }

  function buildKeypad() {
    keypadEl.innerHTML = "";
    const layout = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "Probar"];
    layout.forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      if (key === "⌫") {
        btn.className = "choice-btn cg-key cg-key-back";
        btn.textContent = key;
        btn.addEventListener("click", backspace);
      } else if (key === "Probar") {
        btn.className = "primary cg-key cg-key-submit";
        btn.textContent = "✓ Probar";
        btn.dataset.submit = "1";
        btn.addEventListener("click", submitGuess);
      } else {
        const digit = Number(key);
        btn.className = "choice-btn cg-key";
        btn.textContent = key;
        btn.dataset.digit = String(digit);
        btn.addEventListener("click", () => pressDigit(digit));
      }
      keypadEl.appendChild(btn);
    });
    updateKeypadState();
  }

  function updateKeypadState() {
    keypadEl.querySelectorAll("[data-digit]").forEach((btn) => {
      const digit = Number(btn.dataset.digit);
      btn.disabled = finished || guess.includes(digit) || guess.length >= CODE_LEN;
    });
    const submitBtn = keypadEl.querySelector("[data-submit]");
    if (submitBtn) submitBtn.disabled = finished || guess.length !== CODE_LEN;
  }

  function renderSlots() {
    slotsEl.innerHTML = "";
    for (let i = 0; i < CODE_LEN; i++) {
      const slot = document.createElement("span");
      slot.className = "cg-slot" + (guess[i] !== undefined ? " cg-slot-filled" : "");
      slot.textContent = guess[i] !== undefined ? String(guess[i]) : "?";
      slotsEl.appendChild(slot);
    }
  }

  function renderAttemptsLeft() {
    const left = MAX_ATTEMPTS - attempts.length;
    attemptsLeftEl.textContent = `Intento ${attempts.length + 1} de ${MAX_ATTEMPTS} (quedan ${left})`;
  }

  function renderHistory() {
    historyEl.innerHTML = "";
    attempts.forEach((a, idx) => {
      const row = document.createElement("div");
      row.className = "cg-attempt";
      row.innerHTML = `
        <span class="cg-attempt-num">${idx + 1}</span>
        <span class="cg-attempt-code">${a.guess.join(" ")}</span>
        <span class="cg-attempt-hint">${hintText(a)}</span>
      `;
      historyEl.appendChild(row);
    });
  }

  function pressDigit(digit) {
    if (finished || guess.length >= CODE_LEN || guess.includes(digit)) return;
    guess.push(digit);
    renderSlots();
    updateKeypadState();
  }

  function backspace() {
    if (finished || guess.length === 0) return;
    guess.pop();
    renderSlots();
    updateKeypadState();
  }

  function submitGuess() {
    if (finished || guess.length !== CODE_LEN) return;
    const result = compareGuess(secret, guess);
    attempts.push({ guess: [...guess], ...result });
    renderHistory();

    if (result.exact === CODE_LEN) {
      rounds++;
      score += 10;
      renderScore();
      feedbackEl.textContent = `¡Código roto en el intento ${attempts.length}! Las 3 cifras en su sitio.`;
      feedbackEl.className = "feedback ok";
      guess = [];
      renderSlots();
      updateKeypadState();
      later(nextRound, 1100);
      return;
    }

    if (attempts.length >= MAX_ATTEMPTS) {
      rounds++;
      lives--;
      renderLives();
      feedbackEl.textContent = `Se acabaron los ${MAX_ATTEMPTS} intentos. El código era ${secret.join("-")}.`;
      feedbackEl.className = "feedback bad";
      guess = [];
      renderSlots();
      updateKeypadState();
      if (lives <= 0) return later(() => finish(false), 1300);
      later(nextRound, 1600);
      return;
    }

    feedbackEl.textContent = hintText(result) + " — sigue intentando.";
    feedbackEl.className = "feedback bad";
    guess = [];
    renderSlots();
    renderAttemptsLeft();
    updateKeypadState();
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "codigo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔑</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} códigos jugados</p>
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
    lastSecretKey = "";
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
