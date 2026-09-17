// "La oca numérica": inspirado en el juego de mesa de la oca. Cada ronda
// genera un mini-tablero de 30 casillas propio, con 2-3 casillas "oca"
// (saltan a la siguiente oca de la lista) y una casilla "puente" (salta
// directamente a un destino fijo). El jugador ve su posición actual y el
// resultado de tirar un dado, y debe calcular en qué casilla termina
// tras aplicar la regla de la casilla especial, si cae en una.
//
// Las reglas se aplican como MÁXIMO una vez por tirada: si el destino de
// una oca o de un puente cayera a su vez en otra casilla especial, esa
// combinación se descarta y se genera otra, para que el resultado sea
// siempre inequívoco con un solo paso de razonamiento.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const BOARD_SIZE = 30;
const MAX_DIGITS = 2; // las casillas van de 1 a 30

// Ronda de emergencia por si la generación aleatoria no cuajara tras
// muchos intentos: la partida nunca debe quedarse sin ronda que mostrar.
const FALLBACK = {
  board: { ocas: [10, 20], puente: { desde: 15, hasta: 25 } },
  desde: 5,
  dado: 3,
  posIntermedia: 8,
  destinoFinal: 8,
  tipoCasilla: "normal",
};

function rangeArray(min, max) {
  const arr = [];
  for (let i = min; i <= max; i++) arr.push(i);
  return arr;
}

// Tablero fresco: 2-3 casillas oca y 1 casilla puente (con su destino),
// todas distintas entre sí y lejos de los extremos del tablero.
function buildBoard() {
  const ocaCount = pick([2, 3]);
  const pool = shuffle(rangeArray(4, BOARD_SIZE - 3));
  const ocas = pool.slice(0, ocaCount).sort((a, b) => a - b);
  const puente = { desde: pool[ocaCount], hasta: pool[ocaCount + 1] };
  return { ocas, puente };
}

function isSpecial(board, pos) {
  return board.ocas.includes(pos) || pos === board.puente.desde;
}

// Función pura: dado un tablero y una tirada, calcula el destino final
// aplicando la regla de la casilla intermedia UNA sola vez.
export function resolveOcaMove(board, desde, dado) {
  const posIntermedia = desde + dado;
  let tipoCasilla = "normal";
  let destinoFinal = posIntermedia;

  if (board.ocas.includes(posIntermedia)) {
    tipoCasilla = "oca";
    const nextOca = board.ocas.find((p) => p > posIntermedia);
    destinoFinal = nextOca !== undefined ? nextOca : posIntermedia;
  } else if (posIntermedia === board.puente.desde) {
    tipoCasilla = "puente";
    destinoFinal = board.puente.hasta;
  }

  return { posIntermedia, destinoFinal, tipoCasilla };
}

export function generateOcaRound() {
  let guard = 0;
  while (guard < 500) {
    guard++;
    const board = buildBoard();

    // desde 1-24 y dado 1-6 garantizan por rango que posIntermedia nunca
    // pase de 30, pero se comprueba igualmente con un do/while guardado.
    let desde, dado, posIntermedia;
    let posGuard = 0;
    do {
      desde = randInt(1, 24);
      dado = randInt(1, 6);
      posIntermedia = desde + dado;
      posGuard++;
    } while (posIntermedia > BOARD_SIZE && posGuard < 50);
    if (posIntermedia > BOARD_SIZE) continue;

    const { destinoFinal, tipoCasilla } = resolveOcaMove(board, desde, dado);

    // El destino final nunca puede ser a su vez una casilla especial: eso
    // evitaría encadenar un segundo salto y dejaría el resultado ambiguo.
    if (isSpecial(board, destinoFinal)) continue;

    return { board, desde, dado, posIntermedia, destinoFinal, tipoCasilla };
  }
  return FALLBACK;
}

function explanation(round) {
  const { desde, dado, posIntermedia, destinoFinal, tipoCasilla } = round;
  const base = `Estabas en la ${desde}, tiras un ${dado} → caes en la ${posIntermedia}.`;
  if (tipoCasilla === "oca") {
    return `${base} La ${posIntermedia} es una casilla OCA → saltas a la siguiente oca, la ${destinoFinal}. Terminas en la ${destinoFinal}.`;
  }
  if (tipoCasilla === "puente") {
    return `${base} La ${posIntermedia} es un PUENTE → saltas directamente a la ${destinoFinal}. Terminas en la ${destinoFinal}.`;
  }
  return `${base} Esa casilla no tiene ninguna regla especial, así que terminas en la ${destinoFinal}.`;
}

export function mountOcaGame(container, { client, onExit }) {
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

  function squareClasses(n) {
    const classes = ["oca-square"];
    if (round.board.ocas.includes(n)) classes.push("oca-square-oca");
    if (n === round.board.puente.desde) classes.push("oca-square-bridge");
    if (n === round.desde) classes.push("oca-square-current");
    return classes.join(" ");
  }

  function squareIcon(n) {
    if (round.board.ocas.includes(n)) return "🦆";
    if (n === round.board.puente.desde) return "🌉";
    return "";
  }

  function renderBoard() {
    const boardEl = body.querySelector("[data-board]");
    boardEl.innerHTML = "";
    for (let n = 1; n <= BOARD_SIZE; n++) {
      const cell = document.createElement("div");
      cell.className = squareClasses(n);
      cell.setAttribute("data-square", String(n));
      const icon = squareIcon(n);
      cell.innerHTML = `${icon ? `<span class="oca-square-icon">${icon}</span>` : ""}<span class="oca-square-num">${n}</span>`;
      boardEl.appendChild(cell);
    }
  }

  function nextRound() {
    round = generateOcaRound();
    typed = "";
    locked = false;

    body.innerHTML = `
      <p class="oca-pos-line">📍 Estás en la casilla <b>${round.desde}</b></p>
      <div class="oca-dado">🎲 Tiras un <span class="oca-dado-num">${round.dado}</span></div>
      <div class="oca-board" data-board></div>
      <div class="oca-legend">
        <span class="oca-legend-item">🦆 Oca → salta a la siguiente oca</span>
        <span class="oca-legend-item">🌉 Puente: ${round.board.puente.desde} → ${round.board.puente.hasta}</span>
      </div>
      <p class="prompt">¿En qué casilla terminas?</p>
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
    `;

    renderBoard();

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

  function pressDigit(d) {
    if (finished || locked) return;
    if (typed.length >= MAX_DIGITS) return;
    if (typed === "0") typed = d;
    else typed += d;
    renderDisplay();
  }

  function pressBackspace() {
    if (finished || locked) return;
    typed = typed.slice(0, -1);
    renderDisplay();
  }

  function markPath() {
    const boardEl = body.querySelector("[data-board]");
    const interEl = boardEl.querySelector(`[data-square="${round.posIntermedia}"]`);
    const finalEl = boardEl.querySelector(`[data-square="${round.destinoFinal}"]`);
    if (interEl) interEl.classList.add("oca-square-inter");
    if (finalEl) finalEl.classList.add("oca-square-final");
  }

  function submit() {
    if (finished || locked || typed === "") return;
    const guess = Number(typed);
    locked = true;
    const feedback = body.querySelector("[data-feedback]");
    markPath();

    if (guess === round.destinoFinal) {
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${explanation(round)}`;
      feedback.className = "feedback ok";
      later(nextRound, 2000);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `No es correcto. ${explanation(round)}`;
      feedback.className = "feedback bad";
      if (lives <= 0) {
        later(() => finish(false), 2400);
      } else {
        later(nextRound, 2400);
      }
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "oca", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🦆</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} tiradas resueltas</p>
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
