// "Las jarras": el clásico puzzle de trasvases (Gardner / Die Hard 3).
// Dos jarras de capacidades A y B litros enteros; hay que dejar
// exactamente C litros en cualquiera de las dos usando solo seis
// movimientos (llenar/vaciar cada jarra, o verter una en la otra).
import { randInt, saveScore } from "./utils.js";

const MAX_MOVES = 12; // movimientos permitidos por ronda antes de fallar

// Máximo común divisor — no está en utils.js, hace falta aquí para saber
// qué objetivos C son alcanzables con dos jarras de capacidad A y B.
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    [a, b] = [b, a % b];
  }
  return a;
}

// Genera una ronda válida: A y B enteros distintos entre 2 y 9, y C
// alcanzable (múltiplo de mcd(A,B)), 0 < C < max(A,B) para que nunca
// baste con un solo "llenar", y C distinto de A y de B.
function generateRound(lastKey) {
  let A = 2;
  let B = 3;
  let C = 1;
  let guard = 0;
  let key = "";
  do {
    A = randInt(2, 9);
    B = randInt(2, 9);
    const g = gcd(A, B);
    const top = Math.max(A, B);
    C = randInt(1, Math.max(top - 1, 1));
    key = `${A},${B},${C}`;
    guard++;
  } while (
    guard < 500 &&
    (A === B || C % gcd(A, B) !== 0 || C === A || C === B || key === lastKey)
  );
  if (A === B || C % gcd(A, B) !== 0 || C === A || C === B) {
    // Red de seguridad: combinación garantizada válida si el sorteo
    // no encontró ninguna en 500 intentos (no debería ocurrir nunca).
    A = 5;
    B = 3;
    C = 2;
    key = `${A},${B},${C}`;
  }
  return { A, B, C, key };
}

// Búsqueda en anchura sobre el espacio de estados (a, b), 0 <= a <= A,
// 0 <= b <= B: como mucho (A+1)*(B+1) estados, de sobra para BFS.
// Devuelve la secuencia de movimientos (en español) que lleva de (0,0)
// a un estado con a===C o b===C, o null si no hay camino (no debería
// pasar nunca porque solo generamos rondas alcanzables).
function solve(A, B, C) {
  const key = (a, b) => `${a},${b}`;
  const start = { a: 0, b: 0, path: [] };
  const visited = new Set([key(0, 0)]);
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const { a, b, path } = queue[head++];
    if (a === C || b === C) return path;
    const abVertida = Math.min(a, B - b);
    const baVertida = Math.min(b, A - a);
    const next = [
      ["Llenar jarra A", A, b],
      ["Llenar jarra B", a, B],
      ["Vaciar jarra A", 0, b],
      ["Vaciar jarra B", a, 0],
      ["Verter A → B", a - abVertida, b + abVertida],
      ["Verter B → A", a + baVertida, b - baVertida],
    ];
    for (const [label, na, nb] of next) {
      const k = key(na, nb);
      if (!visited.has(k)) {
        visited.add(k);
        queue.push({ a: na, b: nb, path: [...path, label] });
      }
    }
  }
  return null;
}

// Exports adicionales solo para poder simular/testear generateRound y
// solve de forma aislada (BFS y sorteo de rondas) sin montar el DOM.
export { gcd, generateRound, solve };

export function mountJarrasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita mover mientras se resuelve la ronda
  let A = 5;
  let B = 3;
  let C = 2;
  let lastKey = "";
  let a = 0; // litros actuales en la jarra A
  let b = 0; // litros actuales en la jarra B
  let moves = 0;
  const timers = [];

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body jr-root" data-body></div>
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
    const round = generateRound(lastKey);
    A = round.A;
    B = round.B;
    C = round.C;
    lastKey = round.key;
    a = 0;
    b = 0;
    moves = 0;
    locked = false;

    body.innerHTML = `
      <p class="prompt">Consigue exactamente <b>${C} L</b> en cualquiera de las dos jarras
        <small>Jarra A: ${A} L de capacidad · Jarra B: ${B} L de capacidad</small>
      </p>
      <div class="jr-jarras">
        <div class="jr-jarra-wrap">
          <div class="jr-jarra"><div class="jr-liquid" data-liquid-a style="height:0%"></div></div>
          <div class="jr-label">A: <span data-amount-a>0</span> / ${A} L</div>
        </div>
        <div class="jr-jarra-wrap">
          <div class="jr-jarra"><div class="jr-liquid" data-liquid-b style="height:0%"></div></div>
          <div class="jr-label">B: <span data-amount-b>0</span> / ${B} L</div>
        </div>
      </div>
      <div class="jr-moves">Movimientos: <span data-moves>0</span> / ${MAX_MOVES}</div>
      <div class="feedback" data-feedback></div>
      <div class="jr-actions">
        <button class="choice-btn jr-btn" data-action="fillA" type="button">🚰 Llenar jarra A</button>
        <button class="choice-btn jr-btn" data-action="fillB" type="button">🚰 Llenar jarra B</button>
        <button class="choice-btn jr-btn" data-action="emptyA" type="button">🕳️ Vaciar jarra A</button>
        <button class="choice-btn jr-btn" data-action="emptyB" type="button">🕳️ Vaciar jarra B</button>
        <button class="choice-btn jr-btn" data-action="pourAB" type="button">➡️ Verter A → B</button>
        <button class="choice-btn jr-btn" data-action="pourBA" type="button">⬅️ Verter B → A</button>
      </div>
    `;

    body.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => doMove(btn.dataset.action));
    });
    renderJarras();
  }

  function renderJarras() {
    body.querySelector("[data-liquid-a]").style.height = `${(a / A) * 100}%`;
    body.querySelector("[data-liquid-b]").style.height = `${(b / B) * 100}%`;
    body.querySelector("[data-amount-a]").textContent = a;
    body.querySelector("[data-amount-b]").textContent = b;
    const movesEl = body.querySelector("[data-moves]");
    if (movesEl) movesEl.textContent = moves;
  }

  function applyMove(action) {
    switch (action) {
      case "fillA": return { a: A, b };
      case "fillB": return { a, b: B };
      case "emptyA": return { a: 0, b };
      case "emptyB": return { a, b: 0 };
      case "pourAB": {
        const t = Math.min(a, B - b);
        return { a: a - t, b: b + t };
      }
      case "pourBA": {
        const t = Math.min(b, A - a);
        return { a: a + t, b: b - t };
      }
      default: return { a, b };
    }
  }

  function doMove(action) {
    if (finished || locked) return;
    const next = applyMove(action);
    a = next.a;
    b = next.b;
    moves++;
    renderJarras();
    const feedback = body.querySelector("[data-feedback]");

    if (a === C || b === C) {
      locked = true;
      rounds++;
      score += 10;
      renderScore();
      const jarra = a === C ? "A" : "B";
      feedback.textContent = `¡Exacto! Has dejado ${C} L en la jarra ${jarra} usando ${moves} movimientos.`;
      feedback.className = "feedback ok";
      later(nextRound, 1100);
      return;
    }

    if (moves >= MAX_MOVES) {
      locked = true;
      lives--;
      renderLives();
      const path = solve(A, B, C);
      const pasos = path && path.length
        ? path.map((p, i) => `${i + 1}. ${p}`).join(" · ")
        : "vaciar ambas jarras y empezar de nuevo";
      feedback.textContent = `Se acabaron los movimientos sin llegar a ${C} L. Una solución posible desde cero era: ${pasos}. Nueva ronda con otras jarras.`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 2400);
      later(nextRound, 2400);
      return;
    }

    feedback.textContent = `Jarra A: ${a} L · Jarra B: ${b} L — objetivo ${C} L`;
    feedback.className = "feedback";
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "jarras", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🫙</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} rondas resueltas</p>
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
    lastKey = "";
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
