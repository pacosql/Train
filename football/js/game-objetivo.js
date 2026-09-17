// "Da en el número": inspirado en NYT Digits. Se muestra un objetivo y una
// bolsa de 4-5 números de partida; el jugador combina de dos en dos con
// +, −, ×, ÷ (tocando número → operación → número) hasta que algún número
// disponible coincida EXACTAMENTE con el objetivo. Cada número de la bolsa
// se puede usar como mucho una vez, pero cada resultado se convierte en un
// número nuevo disponible para seguir combinando. Nunca se permiten
// resultados fraccionarios (división solo si es exacta) ni negativos (resta
// solo si el resultado es >= 0).
//
// La ronda se genera AL REVÉS: se parte de 4-5 números pequeños (1-20) y se
// construye un árbol de 2-3 operaciones válidas entre ellos; el objetivo es
// el resultado final de ese árbol, así siempre existe al menos una solución
// real (la que se generó y se guarda para poder mostrarla si el jugador se
// rinde). Puede haber otros caminos válidos hasta el objetivo: cualquiera
// de ellos cuenta como acierto, no solo el generado.
import { randInt, shuffle, saveScore } from "./utils.js";

const OPS = ["+", "-", "*", "/"];
const OP_SYMBOL = { "+": "+", "-": "−", "*": "×", "/": "÷" };
const MAX_INTERMEDIATE = 999;
const MAX_GEN_ATTEMPTS = 3000;

// Aplica una operación a (a, b) EN ESE ORDEN, devolviendo el resultado
// entero si es válido según las reglas del juego, o null si no lo es:
// - resta: solo si a >= b (nunca negativos)
// - división: solo si b !== 0 y a es múltiplo exacto de b (nunca fracciones)
// - suma y multiplicación: siempre válidas
export function applyOp(a, b, op) {
  if (op === "+") return a + b;
  if (op === "-") return a >= b ? a - b : null;
  if (op === "*") return a * b;
  if (op === "/") return b !== 0 && a % b === 0 ? a / b : null;
  return null;
}

function opSymbol(op) {
  return OP_SYMBOL[op] || op;
}

// Genera una ronda: entre 4 y 5 números de partida (1-20) y un árbol de 2-3
// operaciones válidas entre ellos (cada número de partida usado como mucho
// una vez), cuyo último resultado se fija como objetivo. Se descarta y
// reintenta cualquier árbol que no encuentre una operación válida en algún
// paso, o cuyo objetivo final quede fuera de 1-999 o coincida ya con un
// número de la bolsa (sería un acierto trivial e inmediato).
export function generateObjetivoRound() {
  for (let attempt = 0; attempt < MAX_GEN_ATTEMPTS; attempt++) {
    const baseCount = randInt(4, 5);
    const numOps = randInt(2, 3);
    const bag = [];
    for (let i = 0; i < baseCount; i++) bag.push(randInt(1, 20));

    // Cada "ficha" del pool lleva su valor actual y el conjunto de índices
    // de la bolsa original que ya se han consumido para llegar a él, para
    // poder garantizar que ningún número de partida se reutiliza.
    let pool = bag.map((value, i) => ({ value, bases: new Set([i]) }));
    const steps = [];
    let genOk = true;

    for (let step = 0; step < numOps; step++) {
      const order = shuffle(pool.map((_, i) => i));
      let merged = false;
      for (let ii = 0; ii < order.length && !merged; ii++) {
        for (let jj = 0; jj < order.length && !merged; jj++) {
          if (ii === jj) continue;
          const i = order[ii];
          const j = order[jj];
          const tokA = pool[i];
          const tokB = pool[j];
          const opsToTry = shuffle(OPS.slice());
          for (const op of opsToTry) {
            const result = applyOp(tokA.value, tokB.value, op);
            // Además de las reglas del juego (sin fracciones/negativos),
            // exigimos un resultado positivo y acotado para que la ronda
            // sea jugable (nada de ceros ni números gigantes de paso).
            if (result === null || result <= 0 || result > MAX_INTERMEDIATE) continue;
            steps.push({ a: tokA.value, b: tokB.value, op, result });
            const newBases = new Set([...tokA.bases, ...tokB.bases]);
            pool = pool.filter((_, idx) => idx !== i && idx !== j);
            pool.push({ value: result, bases: newBases });
            merged = true;
            break;
          }
        }
      }
      if (!merged) { genOk = false; break; }
    }

    if (!genOk) continue;
    const target = steps[steps.length - 1].result;
    if (target < 1 || target > MAX_INTERMEDIATE) continue;
    if (bag.includes(target)) continue; // acierto trivial e inmediato: descartar

    return { bag, target, solution: steps };
  }
  throw new Error("No se pudo generar una ronda de objetivo válida");
}

export function mountObjetivoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita jugar mientras se resuelve/transiciona la ronda
  let round = null;
  let tokens = []; // números disponibles ahora mismo: { id, value }
  let nextTokenId = 0;
  let selectedFirstId = null;
  let selectedOp = null;
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

  let numbersEl = null;
  let opButtons = [];
  let feedbackEl = null;

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
    round = generateObjetivoRound();
    tokens = round.bag.map((value, i) => ({ id: i, value }));
    nextTokenId = round.bag.length;
    selectedFirstId = null;
    selectedOp = null;
    locked = false;

    body.innerHTML = `
      <p class="prompt">Consigue el número <b>${round.target}</b>
        <small>Toca un número, luego una operación, luego otro número distinto. Cada número de partida solo se puede usar una vez.</small>
      </p>
      <div class="obj-target" data-target>🎯 ${round.target}</div>
      <div class="obj-numbers" data-numbers></div>
      <div class="obj-ops" data-ops>
        <button type="button" class="obj-op-btn" data-op="+">+</button>
        <button type="button" class="obj-op-btn" data-op="-">−</button>
        <button type="button" class="obj-op-btn" data-op="*">×</button>
        <button type="button" class="obj-op-btn" data-op="/">÷</button>
      </div>
      <div class="feedback" data-feedback></div>
      <button class="secondary obj-giveup-btn" type="button" data-giveup>¡Me rindo!</button>
    `;

    numbersEl = body.querySelector("[data-numbers]");
    opButtons = Array.from(body.querySelectorAll("[data-op]"));
    feedbackEl = body.querySelector("[data-feedback]");
    opButtons.forEach((btn) => btn.addEventListener("click", () => onOpClick(btn.dataset.op)));
    body.querySelector("[data-giveup]").addEventListener("click", giveUp);

    renderTokens();
    renderOps();
  }

  function renderTokens() {
    numbersEl.innerHTML = "";
    tokens.forEach((tok) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn obj-num";
      if (tok.id === selectedFirstId) btn.classList.add("obj-selected");
      btn.textContent = String(tok.value);
      btn.addEventListener("click", () => onNumberClick(tok.id));
      numbersEl.appendChild(btn);
    });
  }

  function renderOps() {
    opButtons.forEach((btn) => {
      btn.disabled = selectedFirstId === null;
      btn.classList.toggle("obj-selected", btn.dataset.op === selectedOp);
    });
  }

  function onNumberClick(id) {
    if (finished || locked) return;
    if (selectedFirstId === null) {
      selectedFirstId = id;
      selectedOp = null;
      renderTokens();
      renderOps();
      return;
    }
    if (id === selectedFirstId) {
      // volver a tocar el mismo número: deselecciona
      selectedFirstId = null;
      selectedOp = null;
      renderTokens();
      renderOps();
      return;
    }
    if (selectedOp === null) {
      // aún no hay operación elegida: este toque cambia el primer número
      selectedFirstId = id;
      renderTokens();
      renderOps();
      return;
    }
    combine(selectedFirstId, id, selectedOp);
  }

  function onOpClick(op) {
    if (finished || locked || selectedFirstId === null) return;
    selectedOp = op;
    renderOps();
  }

  function combine(firstId, secondId, op) {
    const firstTok = tokens.find((t) => t.id === firstId);
    const secondTok = tokens.find((t) => t.id === secondId);
    const result = applyOp(firstTok.value, secondTok.value, op);

    if (result === null) {
      feedbackEl.textContent = `${firstTok.value} ${opSymbol(op)} ${secondTok.value} no es válido (nunca puede dar negativo ni fracción). Prueba en otro orden o con otros números.`;
      feedbackEl.className = "feedback bad";
      selectedFirstId = null;
      selectedOp = null;
      renderTokens();
      renderOps();
      return;
    }

    tokens = tokens.filter((t) => t.id !== firstId && t.id !== secondId);
    const newTok = { id: nextTokenId++, value: result };
    tokens.push(newTok);
    selectedFirstId = null;
    selectedOp = null;
    renderOps();

    if (result === round.target) {
      locked = true;
      rounds++;
      score += 10;
      renderScore();
      renderTokens();
      feedbackEl.textContent = `${firstTok.value} ${opSymbol(op)} ${secondTok.value} = ${result}. ¡Objetivo conseguido!`;
      feedbackEl.className = "feedback ok";
      later(() => { locked = false; nextRound(); }, 1300);
      return;
    }

    renderTokens();
    feedbackEl.textContent = `${firstTok.value} ${opSymbol(op)} ${secondTok.value} = ${result}. Sigue combinando.`;
    feedbackEl.className = "feedback ok";
  }

  function solutionText() {
    return round.solution
      .map((s) => `${s.a} ${opSymbol(s.op)} ${s.b} = ${s.result}`)
      .join("  →  ");
  }

  function giveUp() {
    if (finished || locked) return;
    locked = true;
    rounds++;
    lives--;
    renderLives();
    feedbackEl.textContent = `Te rindes. Una solución posible para llegar a ${round.target}: ${solutionText()}.`;
    feedbackEl.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 2200);
    later(() => { locked = false; nextRound(); }, 2800);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "objetivo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎯</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} objetivos alcanzados</p>
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
