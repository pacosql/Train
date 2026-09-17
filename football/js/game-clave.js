// __BUILD_ID__
// "La clave secreta": criptaritmo tipo AB + CD = EFG (inspirado en el
// clásico SEND+MORE=MONEY de Martin Gardner). Cada letra distinta es una
// cifra del 0 al 9; letras distintas son SIEMPRE cifras distintas y
// ninguna cifra inicial puede ser 0.
//
// La ronda se genera al revés: se sortean dos números de 2 cifras cuya
// suma tiene 3 cifras, y se pone una letra a cada dígito distinto que
// aparece — así la asignación queda garantizada por construcción. Luego
// se comprueba por FUERZA BRUTA (todas las asignaciones dígito<->letra
// posibles, con poda de ceros iniciales) que esa es la ÚNICA solución;
// si hay más de una, se descarta la ronda y se sortea otra.
import { randInt, saveScore } from "./utils.js";

const ALPHABET = "ABCDEF";
const MAX_LETTERS = 6;

// Construye el patrón de letras para la suma x + y (=s), asignando una
// letra a cada dígito distinto en el orden en que aparece leyendo
// "decenas de x, unidades de x, decenas de y, unidades de y, centenas de
// s, decenas de s, unidades de s".
function buildPattern(x, y) {
  const s = x + y;
  const seq = [
    Math.floor(x / 10), x % 10,
    Math.floor(y / 10), y % 10,
    Math.floor(s / 100), Math.floor(s / 10) % 10, s % 10,
  ];
  const digitToLetter = new Map();
  for (const d of seq) {
    if (!digitToLetter.has(d)) digitToLetter.set(d, ALPHABET[digitToLetter.size]);
  }
  const L = (d) => digitToLetter.get(d);
  const word1 = [L(seq[0]), L(seq[1])];
  const word2 = [L(seq[2]), L(seq[3])];
  const word3 = [L(seq[4]), L(seq[5]), L(seq[6])];
  const letters = Array.from(digitToLetter.values());
  const solution = {};
  for (const [d, l] of digitToLetter) solution[l] = d;
  return { x, y, s, letters, word1, word2, word3, solution };
}

function wordValue(word, assign) {
  return word.reduce((acc, l) => acc * 10 + assign[l], 0);
}

// Cuenta soluciones válidas (hasta `limit`) del patrón, probando por
// fuerza bruta todas las asignaciones dígito<->letra con poda temprana
// de ceros iniciales. Con <= 6 letras son como mucho 10x9x8x7x6x5 =
// 151200 hojas, rápido de recorrer.
export function claveCountSolutions(pattern, limit = 2) {
  const { letters, word1, word2, word3 } = pattern;
  const leading = new Set([word1[0], word2[0], word3[0]]);
  const used = new Array(10).fill(false);
  const assign = {};
  let count = 0;
  function rec(i) {
    if (count >= limit) return;
    if (i === letters.length) {
      if (wordValue(word1, assign) + wordValue(word2, assign) === wordValue(word3, assign)) count++;
      return;
    }
    const letter = letters[i];
    for (let d = 0; d <= 9; d++) {
      if (used[d]) continue;
      if (d === 0 && leading.has(letter)) continue;
      used[d] = true;
      assign[letter] = d;
      rec(i + 1);
      used[d] = false;
      delete assign[letter];
      if (count >= limit) return;
    }
  }
  rec(0);
  return count;
}

// Genera una ronda con solución única garantizada. Devuelve además
// `stats` con lo que costó encontrarla, útil para depurar/validar.
export function generateClaveRound(maxTries = 4000) {
  const stats = { tried: 0, rejectedShort: 0, rejectedTooManyLetters: 0, rejectedNotUnique: 0 };
  for (; stats.tried < maxTries; stats.tried++) {
    const x = randInt(10, 99);
    const y = randInt(10, 99);
    if (x + y < 100) { stats.rejectedShort++; continue; }
    const pattern = buildPattern(x, y);
    if (pattern.letters.length > MAX_LETTERS) { stats.rejectedTooManyLetters++; continue; }
    if (claveCountSolutions(pattern, 2) !== 1) { stats.rejectedNotUnique++; continue; }
    return { ...pattern, stats };
  }
  // Guarda agotada (extremadamente improbable): recorre todos los pares
  // ordenadamente hasta encontrar uno válido — siempre existe alguno.
  for (let x = 10; x <= 99; x++) {
    for (let y = 10; y <= 99; y++) {
      if (x + y < 100) continue;
      const pattern = buildPattern(x, y);
      if (pattern.letters.length > MAX_LETTERS) continue;
      if (claveCountSolutions(pattern, 2) !== 1) continue;
      return { ...pattern, stats, fallback: true };
    }
  }
  throw new Error("clave: no se encontró ninguna ronda válida");
}

export function mountClaveGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let round = null;
  let assignment = {};
  let selected = null;
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
  function say(text, cls) {
    const el = body.querySelector("[data-feedback]");
    if (!el) return;
    el.textContent = text;
    el.className = `feedback${cls ? ` ${cls}` : ""}`;
  }

  function tile(letter) {
    return `<span class="cv-tile" data-tile-letter="${letter}"><b class="cv-tile-letter-label">${letter}</b><i class="cv-tile-val">?</i></span>`;
  }
  function renderWord(word) {
    return word.map(tile).join("");
  }

  function nextRound() {
    round = generateClaveRound();
    assignment = {};
    selected = round.letters[0];
    locked = false;

    let letterButtons = "";
    round.letters.forEach((l) => {
      letterButtons += `<button type="button" class="cv-letter-btn" data-letter="${l}">${l}<i class="cv-letter-val" data-letter-val="${l}">?</i></button>`;
    });
    let digitButtons = "";
    for (let d = 0; d <= 9; d++) {
      digitButtons += `<button type="button" class="cv-digit-btn" data-digit="${d}">${d}</button>`;
    }

    body.innerHTML = `
      <p class="prompt">Cada letra es una cifra del 0 al 9<small>Letras iguales son la misma cifra; letras distintas, cifras distintas. Ninguna cifra inicial puede ser 0</small></p>
      <div class="cv-equation" data-equation>
        <div class="cv-eq-row">
          ${renderWord(round.word1)}
          <span class="cv-op">+</span>
          ${renderWord(round.word2)}
          <span class="cv-op">=</span>
          ${renderWord(round.word3)}
        </div>
      </div>
      <div class="cv-keyboard" data-keyboard>${letterButtons}</div>
      <div class="cv-digits" data-digits>${digitButtons}</div>
      <div class="cv-tools">
        <button class="secondary cv-tool" data-clear>↺ Borrar</button>
      </div>
      <button class="primary cv-check" data-check>✓ Comprobar</button>
      <div class="feedback" data-feedback></div>
    `;

    body.querySelectorAll("[data-letter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (finished || locked) return;
        const l = btn.dataset.letter;
        selected = selected === l ? null : l;
        renderAll();
      });
    });
    body.querySelectorAll("[data-digit]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (finished || locked) return;
        if (!selected) return say("Toca antes una letra del teclado", "bad");
        assignment[selected] = Number(btn.dataset.digit);
        const next = round.letters.find((l) => assignment[l] === undefined);
        selected = next ?? null;
        renderAll();
        say("", "");
      });
    });
    body.querySelector("[data-clear]").addEventListener("click", () => {
      if (finished || locked) return;
      assignment = {};
      selected = round.letters[0];
      renderAll();
      say("", "");
    });
    body.querySelector("[data-check]").addEventListener("click", () => {
      if (finished || locked) return;
      check();
    });
    renderAll();
    say("Toca una letra y luego un dígito para asignarle su cifra", "");
  }

  function renderAll() {
    round.letters.forEach((l) => {
      const val = assignment[l] === undefined ? "?" : String(assignment[l]);
      body.querySelectorAll(`[data-tile-letter="${l}"] .cv-tile-val`).forEach((el) => { el.textContent = val; });
      const keyVal = body.querySelector(`[data-letter-val="${l}"]`);
      if (keyVal) keyVal.textContent = val;
    });
    body.querySelectorAll("[data-letter]").forEach((btn) => {
      const l = btn.dataset.letter;
      btn.classList.toggle("sel", selected === l);
      btn.classList.toggle("filled", assignment[l] !== undefined);
    });
  }

  // Primer letra repetida con el mismo dígito, si la hay.
  function findDuplicate(letters) {
    const byDigit = new Map();
    for (const l of letters) {
      const d = assignment[l];
      if (byDigit.has(d)) return [byDigit.get(d), l];
      byDigit.set(d, l);
    }
    return null;
  }

  function check() {
    const { letters, word1, word2, word3 } = round;
    const missing = letters.filter((l) => assignment[l] === undefined);
    if (missing.length) {
      return say(`Aún faltan letras por asignar: ${missing.join(", ")}`, "bad");
    }
    const dup = findDuplicate(letters);
    if (dup) {
      return loseRound(`${dup[0]} y ${dup[1]} tienen el mismo dígito (${assignment[dup[0]]}): letras distintas deben ser cifras distintas`);
    }
    const leading = [word1[0], word2[0], word3[0]].filter((l, i, arr) => arr.indexOf(l) === i);
    const zeroLetter = leading.find((l) => assignment[l] === 0);
    if (zeroLetter) {
      return loseRound(`${zeroLetter} no puede valer 0: ningún número puede empezar por 0`);
    }
    const v1 = wordValue(word1, assignment);
    const v2 = wordValue(word2, assignment);
    const v3 = wordValue(word3, assignment);
    if (v1 + v2 !== v3) {
      return loseRound(`Con esos valores ${word1.join("")}=${v1} y ${word2.join("")}=${v2} suman ${v1 + v2}, pero ${word3.join("")}=${v3}: no cuadra`);
    }
    locked = true;
    rounds++;
    score += 10;
    renderScore();
    say(`¡Correcto! ${word1.join("")}(${v1}) + ${word2.join("")}(${v2}) = ${word3.join("")}(${v3})`, "ok");
    later(nextRound, 1400);
  }

  function loseRound(reason) {
    locked = true;
    rounds++;
    lives--;
    renderLives();
    // Se enseña la solución correcta unos instantes antes de la siguiente ronda.
    assignment = { ...round.solution };
    selected = null;
    renderAll();
    say(`${reason}. Así era: ${round.word1.join("")}=${wordValue(round.word1, round.solution)}, ${round.word2.join("")}=${wordValue(round.word2, round.solution)}, ${round.word3.join("")}=${wordValue(round.word3, round.solution)}`, "bad");
    if (lives <= 0) return later(() => finish(false), 2200);
    later(nextRound, 2200);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "clave", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔐</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} claves descifradas</p>
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
