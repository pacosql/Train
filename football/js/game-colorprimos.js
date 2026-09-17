// "Fábrica de colores primos": inspirado en el sistema de colores de
// Prime Climb (Math for Love) — cada primo pequeño tiene un color fijo
// (2=naranja, 3=verde, 5=azul, 7=morado) y los primos grandes (≥11) van
// en rojo mostrando su valor exacto. Un número se representa como la
// colección de chips de su descomposición en factores primos y el
// jugador debe tocar exactamente los chips cuyo producto dé el objetivo.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const SMALL_PRIMES = [2, 3, 5, 7];
const LARGE_PRIME_POOL = [11, 13, 17, 19, 23, 29, 31, 37, 41];

function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function isComposite(n) {
  return n > 1 && !isPrime(n);
}

// Factorización prima de n en orden creciente (con repetición). Existe y
// es única por el teorema fundamental de la aritmética.
function primeFactorize(n) {
  const allPrimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59];
  const factors = [];
  let m = n;
  for (const p of allPrimes) {
    while (m % p === 0) {
      factors.push(p);
      m = m / p;
    }
    if (m === 1) break;
  }
  return factors;
}

function colorForPrime(p) {
  if (p === 2) return { name: "orange", emoji: "🟠" };
  if (p === 3) return { name: "green", emoji: "🟢" };
  if (p === 5) return { name: "blue", emoji: "🔵" };
  if (p === 7) return { name: "purple", emoji: "🟣" };
  return { name: "red", emoji: "🔴" };
}

// Texto del chip: los 4 primos pequeños se identifican solo por su
// color (icono), los primos grandes (≥11) muestran también su valor
// exacto porque a partir de ahí ya no hay un color por primo.
function chipLabel(p) {
  const c = colorForPrime(p);
  return c.name === "red" ? `${c.emoji}${p}` : c.emoji;
}

// Genera una ronda: número objetivo N (compuesto, 4-60), su
// factorización prima y un banco de 6-8 chips que siempre contiene los
// chips necesarios para formar N más 2-4 chips de sobra (señuelos).
// Los señuelos son o bien copias extra de un color ya necesario o bien
// primos "ajenos" a la factorización de N: por unicidad de la
// factorización prima, ningún subconjunto que incluya un primo ajeno a
// N puede multiplicar exactamente a N, así que nunca crean una solución
// alternativa falsa.
export function generateColorprimosRound(lastN = -1) {
  let n;
  do {
    n = randInt(4, 60);
  } while (!isComposite(n) || n === lastN);

  const factors = primeFactorize(n);
  const largePrimeUsed = factors.find((p) => p >= 11) || null;

  let chipId = 0;
  const required = factors.map((p) => ({
    id: chipId++,
    prime: p,
    ...colorForPrime(p),
  }));

  // Cuántos chips de sobra añadir, intentando que el banco final tenga
  // entre 6 y 8 chips en total.
  let decoyCount = randInt(2, 3);
  let total = required.length + decoyCount;
  if (total < 6) decoyCount += 6 - total;
  total = required.length + decoyCount;
  if (total > 8) decoyCount = Math.max(0, 8 - required.length);

  let largePrimeAssigned = !!largePrimeUsed;
  const decoys = [];
  for (let i = 0; i < decoyCount; i++) {
    if (!largePrimeAssigned && Math.random() < 0.35) {
      const lp = pick(LARGE_PRIME_POOL);
      decoys.push({ id: chipId++, prime: lp, ...colorForPrime(lp) });
      largePrimeAssigned = true;
    } else {
      const p = pick(SMALL_PRIMES);
      decoys.push({ id: chipId++, prime: p, ...colorForPrime(p) });
    }
  }

  const chips = shuffle(required.concat(decoys));
  return { n, factors, chips };
}

export function mountColorprimosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let lastN = -1;
  let round = null;
  let selected = new Set(); // ids de chips tocados en esta ronda
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

  function currentProduct() {
    return round.chips
      .filter((c) => selected.has(c.id))
      .reduce((acc, c) => acc * c.prime, 1);
  }

  function updateProduct() {
    const productEl = body.querySelector("[data-product]");
    if (productEl) productEl.textContent = `Producto seleccionado: ${currentProduct()}`;
  }

  function nextRound() {
    round = generateColorprimosRound(lastN);
    lastN = round.n;
    selected = new Set();
    locked = false;

    body.innerHTML = `
      <p class="prompt">Fabrica el número <b>${round.n}</b>
        <small>Toca los chips cuyo producto de primos dé exactamente ${round.n}. Sobran algunos.</small>
      </p>
      <div class="cp-legend">
        <span class="cp-legend-item">🟠 = 2</span>
        <span class="cp-legend-item">🟢 = 3</span>
        <span class="cp-legend-item">🔵 = 5</span>
        <span class="cp-legend-item">🟣 = 7</span>
        <span class="cp-legend-item">🔴 = primo grande (se ve el número)</span>
      </div>
      <div class="cp-bank" data-bank></div>
      <p class="cp-product" data-product>Producto seleccionado: 1</p>
      <div class="feedback" data-feedback></div>
      <button class="primary" type="button" data-done>¡Listo!</button>
    `;

    const bankEl = body.querySelector("[data-bank]");
    round.chips.forEach((chip) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn cp-chip cp-${chip.name}`;
      btn.dataset.id = String(chip.id);
      btn.textContent = chipLabel(chip.prime);
      btn.addEventListener("click", () => toggleChip(chip.id, btn));
      bankEl.appendChild(btn);
    });
    body.querySelector("[data-done]").addEventListener("click", evaluar);
  }

  function toggleChip(id, btn) {
    if (finished || locked) return;
    if (selected.has(id)) {
      selected.delete(id);
      btn.classList.remove("cp-selected");
    } else {
      selected.add(id);
      btn.classList.add("cp-selected");
    }
    updateProduct();
  }

  function evaluar() {
    if (finished || locked) return;
    locked = true;
    const { n, factors } = round;
    const product = currentProduct();
    const feedback = body.querySelector("[data-feedback]");
    const factorizacion = `${n} = ${factors.join(" × ")}`;

    if (selected.size > 0 && product === n) {
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${factorizacion}.`;
      feedback.className = "feedback ok";
      later(() => { locked = false; nextRound(); }, 900);
      return;
    }

    rounds++;
    lives--;
    renderLives();
    feedback.textContent = `Tu selección da ${product}, no ${n}. La factorización correcta es ${factorizacion}.`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 1400);
    later(() => { locked = false; nextRound(); }, 1800);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "colorprimos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎨</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} números factorizados</p>
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
    lastN = -1;
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
