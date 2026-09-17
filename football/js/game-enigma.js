// "Máquina de cifrado" — inspirado en la sala de criptografía "Enigma
// Cafe" del MoMath (National Museum of Mathematics). Cifrado por
// desplazamiento (tipo César) sobre un alfabeto de 27 símbolos
// (A-Z + Ñ, en ese orden). Cada letra tiene una posición 1-27; el
// cifrado suma un desplazamiento k a esa posición y, si se pasa de 27,
// "da la vuelta" al principio (aritmética modular):
//   nuevaPos = ((pos - 1 + k) mod 27) + 1
// Descifrar es la misma operación con k negativo. En la mitad de las
// rondas se pide cifrar (letra original → cifrada) y en la otra mitad
// descifrar (letra cifrada → original), forzando con regularidad el
// caso interesante en el que el módulo "da la vuelta" de verdad.
import { randInt, pick, buildChoices, saveScore } from "./utils.js";

// Fuente única de verdad del alfabeto: 27 símbolos, la Ñ justo después
// de la N (orden español). Tanto cifrar como descifrar indexan siempre
// sobre este mismo array — nunca se duplica como literal suelto.
export const ALPHABET = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
const SIZE = ALPHABET.length; // 27

export function posOf(letter) {
  return ALPHABET.indexOf(letter) + 1; // posición 1-based
}

// Desplaza `letter` k posiciones dentro del alfabeto circular de 27
// símbolos. k puede ser negativo (descifrar = shiftLetter(cifrada, -k)).
// La misma función sirve para cifrar y descifrar: es el módulo el que
// se encarga de "dar la vuelta" en ambos sentidos.
export function shiftLetter(letter, k) {
  const pos = posOf(letter);
  const newPos = (((pos - 1 + k) % SIZE) + SIZE) % SIZE + 1;
  return ALPHABET[newPos - 1];
}

// Vecino plausible en el alfabeto (±1 o ±2), con su propio wraparound —
// simula el error típico de "no aplicar bien el módulo" o contar mal.
function neighborLetter(correctPos) {
  const offset = pick([-2, -1, 1, 2]);
  const p = (((correctPos - 1 + offset) % SIZE) + SIZE) % SIZE + 1;
  return ALPHABET[p - 1];
}

// Cuenta las rondas seguidas sin wraparound real para forzar que, como
// mucho cada 2-3 rondas, aparezca una en la que el módulo sí "dé la
// vuelta" — nunca se queda solo en sumas/restas triviales.
let sinceWrap = 0;

// Genera una ronda completa. Exportada aparte de mountEnigmaGame para
// poder testearla sin DOM (ver script de simulación).
export function generateEnigmaRound() {
  const direction = Math.random() < 0.5 ? "encrypt" : "decrypt";
  const k = randInt(2, 15);

  const forceWrap = sinceWrap >= 2 || Math.random() < 0.5;
  sinceWrap = forceWrap ? 0 : sinceWrap + 1;

  let promptPos;
  if (direction === "encrypt") {
    // Forzar wrap en cifrado: pos + k > 27  =>  pos >= 28 - k
    promptPos = forceWrap ? randInt(SIZE + 1 - k, SIZE) : randInt(1, SIZE);
  } else {
    // Forzar wrap en descifrado: pos - k < 1  =>  pos <= k
    promptPos = forceWrap ? randInt(1, k) : randInt(1, SIZE);
  }
  const promptLetter = ALPHABET[promptPos - 1];

  const signedK = direction === "encrypt" ? k : -k;
  const rawNewPos = promptPos + signedK; // sin normalizar, para explicar el módulo
  const wrapped = rawNewPos > SIZE || rawNewPos < 1;
  const correctLetter = shiftLetter(promptLetter, signedK);
  const correctPos = posOf(correctLetter);

  const choices = buildChoices(correctLetter, () => neighborLetter(correctPos), 4);

  return {
    direction,
    k,
    promptLetter,
    promptPos,
    correctLetter,
    correctPos,
    rawNewPos,
    wrapped,
    choices,
  };
}

function buildFeedback(round) {
  const { direction, k, promptLetter, promptPos, correctLetter, correctPos, rawNewPos, wrapped } = round;
  if (direction === "encrypt") {
    if (!wrapped) {
      return `${promptLetter} está en la posición ${promptPos}; ${promptPos}+${k}=${correctPos} → la ${correctLetter}`;
    }
    return `${promptLetter} está en la posición ${promptPos}; ${promptPos}+${k}=${rawNewPos}, y ${rawNewPos}-27=${correctPos} → la ${correctLetter}`;
  }
  if (!wrapped) {
    return `${promptLetter} está en la posición ${promptPos}; ${promptPos}-${k}=${correctPos} → la ${correctLetter}`;
  }
  return `${promptLetter} está en la posición ${promptPos}; ${promptPos}-${k}=${rawNewPos}, y ${rawNewPos}+27=${correctPos} → la ${correctLetter}`;
}

export function mountEnigmaGame(container, { client, onExit }) {
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
    round = generateEnigmaRound();
    locked = false;
    const { direction, k, promptLetter, promptPos } = round;
    const verb = direction === "encrypt" ? "Cifrar" : "Descifrar";
    const question =
      direction === "encrypt"
        ? `¿En qué letra se convierte la <strong>${promptLetter}</strong> al cifrarla con k=${k}?`
        : `La letra cifrada es <strong>${promptLetter}</strong>. ¿Qué letra ORIGINAL se cifró con k=${k}?`;

    body.innerHTML = `
      <div class="eng-card">
        <div class="eng-direction-label">${verb}</div>
        <div class="eng-letter-big">${promptLetter}</div>
        <div class="eng-pos-label">posición ${promptPos}</div>
        <div class="eng-shift-badge">Desplazamiento k = ${k}</div>
      </div>
      <p class="prompt">${question}
        <small>Alfabeto de 27 símbolos (A a la Z, y la Ñ). Si te pasas de la posición 27, vuelve a empezar por la 1.</small>
      </p>
      <div class="choices" data-choices></div>
      <div class="feedback" data-feedback></div>
    `;

    const choicesEl = body.querySelector("[data-choices]");
    const buttons = round.choices.map((letter) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = `${letter} (pos ${posOf(letter)})`;
      btn.dataset.letter = letter;
      choicesEl.appendChild(btn);
      return btn;
    });
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => selectChoice(btn.dataset.letter, btn, buttons));
    });
  }

  function selectChoice(letter, btn, buttons) {
    if (finished || locked) return;
    locked = true;
    buttons.forEach((b) => { b.disabled = true; });

    const feedback = body.querySelector("[data-feedback]");
    const correct = letter === round.correctLetter;
    const explanation = buildFeedback(round);

    if (correct) {
      btn.classList.add("correct");
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${explanation}.`;
      feedback.className = "feedback ok";
      later(nextRound, 1200);
      return;
    }

    btn.classList.add("wrong");
    buttons.forEach((b) => {
      if (b.dataset.letter === round.correctLetter) b.classList.add("correct");
    });
    lives--;
    renderLives();
    feedback.textContent = `No es correcto. ${explanation}.`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 1500);
    later(nextRound, 1900);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "enigma", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔐</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} mensajes descifrados</p>
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
