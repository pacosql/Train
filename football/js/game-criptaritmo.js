// "Descifra la suma": criptaritmo simplificado AB + C = DE donde A, B, C,
// D, E son 5 letras que representan 5 dígitos distintos (0-9). AB y DE son
// números de dos cifras, así que A y D no pueden ser 0. El jugador toca
// una letra para seleccionarla y luego un dígito del teclado para
// asignárselo; cada dígito solo puede usarse una vez.
//
// Nota de diseño (comprobada por fuerza bruta en el script de
// verificación): la estructura "AB + C = DE" tiene una simetría
// inevitable entre B y C, porque ambos suman con el mismo peso (1) en
// 10*A+B+C — intercambiar sus valores no cambia el resultado. Por eso
// TODA asignación válida tiene siempre una "gemela" que solo intercambia
// B y C y sigue siendo igual de válida (el conteo bruto nunca puede ser
// exactamente 1). Para poder hablar de "solución única" de verdad, la
// unicidad se comprueba de forma CANÓNICA: esa pareja B↔C cuenta como
// una sola solución. Con esa definición sí hay rondas con una única
// solución canónica, y son las que genera este módulo.
import { randInt, saveScore } from "./utils.js";

const LETTERS = ["A", "B", "C", "D", "E"];
const MAX_ATTEMPTS = 300;

// Valida la propiedad matemática directamente sobre los dígitos que dé el
// jugador (nunca comparar "es igual a la solución generada" — esa es la
// lección del bug de game-kenken.js: hay que comprobar la propiedad, no
// una igualdad exacta con un resultado guardado de antemano).
export function checkCriptaritmoAssignment(assignment) {
  if (!assignment) return false;
  const { A, B, C, D, E } = assignment;
  const vals = [A, B, C, D, E];
  if (vals.some((v) => !Number.isInteger(v) || v < 0 || v > 9)) return false;
  if (new Set(vals).size !== 5) return false;
  if (A === 0 || D === 0) return false;
  return 10 * A + B + C === 10 * D + E;
}

// Para un conjunto concreto de 5 valores distintos, cuenta cuántas
// SOLUCIONES CANÓNICAS distintas hay al repartirlos entre las posiciones
// (A,B,C,D,E): cada asignación válida y su gemela B↔C cuentan como una
// sola. Fuerza bruta sobre las 5! = 120 permutaciones de esos 5 valores
// (bucles anidados con backtracking, no una librería genérica).
function countCanonicalSolutions(values) {
  const n = values.length;
  const used = new Array(n).fill(false);
  const current = [];
  const canonical = new Set();
  function rec() {
    if (current.length === n) {
      const [a, b, c, d, e] = current;
      if (a !== 0 && d !== 0 && 10 * a + b + c === 10 * d + e) {
        const bc = b < c ? `${b}_${c}` : `${c}_${b}`;
        canonical.add(`${a}|${bc}|${d}|${e}`);
      }
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      current.push(values[i]);
      rec();
      current.pop();
      used[i] = false;
    }
  }
  rec();
  return canonical.size;
}

// Ronda de emergencia por si 300 intentos no bastaran (no debería darse:
// en la práctica, más de la mitad de los candidatos ya cumplen la
// unicidad canónica al primer intento). Verificada a mano: 49 + 1 = 50,
// con los 5 dígitos {4,9,1,5,0} todos distintos y solución canónica única.
const FALLBACK = { A: 4, B: 9, C: 1, D: 5, E: 0 };

// Genera A, B, C al azar (distintos entre sí, A≠0), calcula la suma
// AB+C y de ahí D y E; descarta y reintenta si la suma no tiene 2 cifras,
// si D es 0, si los 5 valores no son todos distintos, o si la ronda no
// tiene solución canónica única.
export function generateCriptaritmoRound() {
  let guard = 0;
  while (guard < MAX_ATTEMPTS) {
    guard++;
    let A, B, C;
    let inner = 0;
    do {
      A = randInt(1, 9);
      B = randInt(0, 9);
      C = randInt(0, 9);
      inner++;
    } while ((A === B || A === C || B === C) && inner < 300);
    if (A === B || A === C || B === C) continue;

    const suma = 10 * A + B + C;
    if (suma < 10 || suma > 99) continue;
    const D = Math.floor(suma / 10);
    const E = suma % 10;
    if (D === 0) continue;

    const values = [A, B, C, D, E];
    if (new Set(values).size !== 5) continue;
    if (countCanonicalSolutions(values) !== 1) continue;

    return { letters: LETTERS.slice(), solution: { A, B, C, D, E } };
  }
  return { letters: LETTERS.slice(), solution: { ...FALLBACK } };
}

export function mountCriptaritmoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let round = null;
  let assignment = {};
  let selectedLetter = null;
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
    round = generateCriptaritmoRound();
    assignment = {};
    selectedLetter = "A";
    locked = false;

    body.innerHTML = `
      <p class="prompt">Descifra la suma
        <small>Toca una letra y luego un dígito del teclado para asignárselo. Cada dígito solo se puede usar una vez.</small>
      </p>
      <div class="cry-equation" data-equation>
        <div class="cry-group">
          <button class="cry-letter-btn" type="button" data-letter="A">A</button>
          <button class="cry-letter-btn" type="button" data-letter="B">B</button>
        </div>
        <span class="cry-op">+</span>
        <div class="cry-group">
          <button class="cry-letter-btn" type="button" data-letter="C">C</button>
        </div>
        <span class="cry-op">=</span>
        <div class="cry-group">
          <button class="cry-letter-btn" type="button" data-letter="D">D</button>
          <button class="cry-letter-btn" type="button" data-letter="E">E</button>
        </div>
      </div>
      <div class="cry-digit-pad" data-pad></div>
      <button class="primary cry-check-btn" type="button" data-check disabled>Comprobar</button>
      <div class="feedback" data-feedback></div>
    `;

    body.querySelectorAll("[data-letter]").forEach((btn) => {
      btn.addEventListener("click", () => selectLetter(btn.dataset.letter));
    });
    body.querySelector("[data-check]").addEventListener("click", check);

    renderEquation();
    renderPad();
  }

  function renderEquation() {
    LETTERS.forEach((letter) => {
      const btn = body.querySelector(`[data-letter="${letter}"]`);
      if (!btn) return;
      const digit = assignment[letter];
      btn.textContent = digit !== undefined ? String(digit) : letter;
      btn.classList.toggle("filled", digit !== undefined);
      btn.classList.toggle("selected", selectedLetter === letter);
    });
  }

  function renderPad() {
    const pad = body.querySelector("[data-pad]");
    if (!pad) return;
    pad.innerHTML = "";
    const usedByOthers = new Set(
      LETTERS.filter((l) => l !== selectedLetter && assignment[l] !== undefined).map((l) => assignment[l])
    );
    for (let d = 0; d <= 9; d++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cry-digit-btn";
      btn.textContent = String(d);
      const disabled = selectedLetter === null || usedByOthers.has(d);
      btn.disabled = disabled;
      if (!disabled) btn.addEventListener("click", () => assignDigit(d));
      pad.appendChild(btn);
    }
  }

  function selectLetter(letter) {
    if (finished || locked) return;
    selectedLetter = letter;
    renderEquation();
    renderPad();
  }

  function assignDigit(d) {
    if (finished || locked || selectedLetter === null) return;
    assignment[selectedLetter] = d;
    const idx = LETTERS.indexOf(selectedLetter);
    const nextUnfilled =
      LETTERS.find((l, i) => i > idx && assignment[l] === undefined) ??
      LETTERS.find((l) => assignment[l] === undefined) ??
      null;
    selectedLetter = nextUnfilled;
    renderEquation();
    renderPad();
    updateCheckButton();
  }

  function updateCheckButton() {
    const btn = body.querySelector("[data-check]");
    if (!btn) return;
    const allFilled = LETTERS.every((l) => assignment[l] !== undefined);
    btn.disabled = !allFilled || locked;
  }

  function explainFailure(a, b, c, d, e) {
    if (a === 0) return "A no puede ser 0, porque AB debe tener dos cifras.";
    if (d === 0) return "D no puede ser 0, porque DE debe tener dos cifras.";
    const playerSum = 10 * a + b + c;
    const playerRight = 10 * d + e;
    return `${a}${b} + ${c} = ${playerSum}, pero escribiste que ${d}${e} vale ${playerRight}, y no coincide.`;
  }

  function check() {
    if (finished || locked) return;
    if (!LETTERS.every((l) => assignment[l] !== undefined)) return;
    locked = true;
    rounds++;
    updateCheckButton();
    const feedback = body.querySelector("[data-feedback]");
    const { A: a, B: b, C: c, D: d, E: e } = assignment;
    const ok = checkCriptaritmoAssignment({ A: a, B: b, C: c, D: d, E: e });

    if (ok) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${a}${b} + ${c} = ${d}${e}.`;
      feedback.className = "feedback ok";
      later(nextRound, 1400);
    } else {
      lives--;
      renderLives();
      const { A: sA, B: sB, C: sC, D: sD, E: sE } = round.solution;
      const reason = explainFailure(a, b, c, d, e);
      feedback.innerHTML =
        `No es correcto: ${reason}<br>` +
        `Una asignación correcta era A=${sA}, B=${sB}, C=${sC}, D=${sD}, E=${sE}: ` +
        `${sA}${sB} + ${sC} = ${sD}${sE}.`;
      feedback.className = "feedback bad";
      if (lives <= 0) later(() => finish(false), 2800);
      else later(nextRound, 2800);
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "criptaritmo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔢</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} sumas descifradas</p>
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
