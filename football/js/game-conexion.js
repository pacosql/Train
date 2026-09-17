// "Conexión numérica": 6 números en pantalla; en secreto, 3 comparten una
// propiedad matemática A y los otros 3 una propiedad B (sin revelar cuáles
// son). El jugador toca los 3 números que crea que van juntos; los otros 3
// quedan como segundo grupo automáticamente. Inspirado en NYT Connections,
// pero con un único par de grupos de 3 para que quepa cómodo en móvil.
//
// La generación exige unicidad de verdad: se prueban por fuerza bruta las
// 10 particiones posibles de los 6 números en 2 grupos de 3 y se descarta
// la ronda si más de una partición resulta "doblemente coherente" bajo
// ALGUNA regla del catálogo completo (no solo las dos usadas para
// construirla) — así se evita que, por casualidad, otra propiedad (p. ej.
// "impares") agrupe los mismos números de una forma igual de defendible.
import { shuffle, saveScore } from "./utils.js";

const MIN_VAL = 2;
const MAX_VAL = 99;

function isPrime(n) {
  if (!Number.isInteger(n) || n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

// Catálogo FIJO de propiedades. La generación elige 2 de aquí para
// construir la ronda, pero la verificación de unicidad recorre SIEMPRE
// la lista completa contra las 10 particiones posibles.
const RULES = [
  { name: "múltiplos de 3", test: (n) => n % 3 === 0 },
  { name: "múltiplos de 5", test: (n) => n % 5 === 0 },
  { name: "múltiplos de 4", test: (n) => n % 4 === 0 },
  { name: "números primos", test: (n) => isPrime(n) },
  { name: "cuadrados perfectos", test: (n) => Number.isInteger(Math.sqrt(n)) },
  { name: "impares", test: (n) => n % 2 !== 0 },
  { name: "mayores que 50", test: (n) => n > 50 },
  { name: "menores que 20", test: (n) => n < 20 },
];

// Ronda de emergencia por si el generador no encontrara una combinación
// válida dentro del guard (verificada a mano: es la única partición
// doblemente coherente del catálogo completo).
const FALLBACK = {
  numbers: [21, 8, 63, 30, 27, 45],
  groupA: [21, 63, 27],
  groupB: [8, 30, 45],
  ruleAName: "múltiplos de 3",
  ruleBName: "múltiplos de 5",
};

function sampleGroup(passTest, failTest, exclude) {
  const candidates = [];
  for (let n = MIN_VAL; n <= MAX_VAL; n++) {
    if (exclude.has(n)) continue;
    if (passTest(n) && !failTest(n)) candidates.push(n);
  }
  if (candidates.length < 3) return null;
  return shuffle(candidates).slice(0, 3);
}

function isCoherent(values, rules) {
  return rules.some((r) => values.every(r.test));
}

// Prueba las 10 particiones posibles de 6 números en 2 grupos de 3
// (fijando que el índice 0 siempre cae en el primer grupo, así cada
// partición se cuenta una sola vez) y cuenta cuántas tienen AMBOS grupos
// "coherentes" (los 3 números cumplen alguna regla) bajo el catálogo
// completo.
function countDoublyCoherentPartitions(numbers, rules) {
  const rest = [1, 2, 3, 4, 5];
  let count = 0;
  for (let a = 0; a < rest.length; a++) {
    for (let b = a + 1; b < rest.length; b++) {
      const groupIdx = [0, rest[a], rest[b]];
      const groupA = groupIdx.map((i) => numbers[i]);
      const groupBIdx = [0, 1, 2, 3, 4, 5].filter((i) => !groupIdx.includes(i));
      const groupB = groupBIdx.map((i) => numbers[i]);
      if (isCoherent(groupA, rules) && isCoherent(groupB, rules)) count++;
    }
  }
  return count;
}

export function generateConexionRound() {
  let guard = 0;
  while (guard < 300) {
    guard++;
    const shuffledRules = shuffle(RULES);
    const ruleA = shuffledRules[0];
    const ruleB = shuffledRules[1];
    const groupA = sampleGroup(ruleA.test, ruleB.test, new Set());
    if (!groupA) continue;
    const groupB = sampleGroup(ruleB.test, ruleA.test, new Set(groupA));
    if (!groupB) continue;
    const numbers = shuffle([...groupA, ...groupB]);
    if (countDoublyCoherentPartitions(numbers, RULES) !== 1) continue;
    return { numbers, groupA, groupB, ruleAName: ruleA.name, ruleBName: ruleB.name };
  }
  return FALLBACK;
}

export function mountConexionGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let selected = [];
  let answered = false;
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
    answered = false;
    selected = [];
    round = generateConexionRound();
    body.innerHTML = `
      <p class="prompt">Seis números, dos propiedades secretas<small>Toca los 3 que crees que van juntos</small></p>
      <div class="cnx-grid" data-grid></div>
      <button class="primary cnx-check-btn" data-check disabled>Comprobar</button>
      <div class="feedback" data-feedback></div>
    `;
    const gridEl = body.querySelector("[data-grid]");
    round.numbers.forEach((val, i) => {
      const btn = document.createElement("button");
      btn.className = "cnx-number";
      btn.type = "button";
      btn.textContent = String(val);
      btn.dataset.value = String(val);
      btn.addEventListener("click", () => tapNumber(i));
      gridEl.appendChild(btn);
    });
    body.querySelector("[data-check]").addEventListener("click", checkAnswer);
    renderSelection();
  }

  function renderSelection() {
    const gridEl = body.querySelector("[data-grid]");
    [...gridEl.children].forEach((btn, i) => {
      btn.classList.toggle("cnx-number-selected", selected.includes(i));
    });
    body.querySelector("[data-check]").disabled = selected.length !== 3;
  }

  function tapNumber(i) {
    if (finished || answered) return;
    if (selected.includes(i)) {
      selected = selected.filter((x) => x !== i);
    } else if (selected.length < 3) {
      selected.push(i);
    }
    renderSelection();
  }

  function checkAnswer() {
    if (finished || answered || selected.length !== 3) return;
    answered = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const gridEl = body.querySelector("[data-grid]");
    const selectedValues = selected.map((i) => round.numbers[i]);
    const setA = new Set(round.groupA);
    const setB = new Set(round.groupB);
    const isCorrect =
      (selectedValues.length === setA.size && selectedValues.every((v) => setA.has(v))) ||
      (selectedValues.length === setB.size && selectedValues.every((v) => setB.has(v)));

    [...gridEl.children].forEach((btn) => {
      const val = Number(btn.dataset.value);
      btn.disabled = true;
      btn.classList.add(round.groupA.includes(val) ? "cnx-group-a" : "cnx-group-b");
    });
    body.querySelector("[data-check]").disabled = true;

    const groupsText = `Un grupo eran ${round.ruleAName}: ${round.groupA.join(", ")}. El otro grupo eran ${round.ruleBName}: ${round.groupB.join(", ")}.`;

    if (isCorrect) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${groupsText}`;
      feedback.className = "feedback ok";
      later(nextRound, 2000);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `No era ese grupo. ${groupsText}`;
      feedback.className = "feedback bad";
      if (lives <= 0) later(() => finish(false), 2200);
      else later(nextRound, 2600);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "conexion", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔗</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} conexiones intentadas</p>
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
