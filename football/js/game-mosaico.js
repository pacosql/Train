// "Escalera de mosaicos": inspirado en las líneas de patrón del juego de
// mesa Azul. Hay una escalera de 5 filas (tamaños 1,2,3,4,5) y una bolsa
// con cantidades limitadas de 3 a 5 colores de ficha. Cada fila solo se
// puede completar con UN color (nunca mezclado) y cada color solo puede
// usarse en UNA fila de toda la escalera (no se reparte entre varias).
//
// En vez de dejar que el jugador arrastre fichas libremente —que abriría
// la puerta a "¿por qué esta asignación y no otra?"—, la ronda se plantea
// como una pregunta de OPTIMIZACIÓN con una única respuesta numérica:
// "con estos colores, ¿cuántas filas completas puedes rellenar como
// máximo en total?". El generador calcula ese máximo real por fuerza
// bruta (probando, para cada fila, usar cada color aún libre que le
// alcance o dejarla vacía) y ese entero —no una asignación concreta— es
// la respuesta correcta: no hay ambigüedad posible porque "el máximo" es
// único aunque existan varias formas de lograrlo.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

export const ROW_SIZES = [1, 2, 3, 4, 5];

const COLOR_DEFS = [
  { name: "azul", emoji: "🟦" },
  { name: "amarillo", emoji: "🟨" },
  { name: "rojo", emoji: "🟥" },
  { name: "verde", emoji: "🟩" },
  { name: "morado", emoji: "🟪" },
];

// Cuántos colores trae la bolsa en cada ronda: sobre todo 3, a veces 4 y
// raramente los 5 (con 5 colores es la única forma de que el máximo real
// pueda llegar a completar la escalera entera).
const COLOR_COUNT_POOL = [3, 3, 3, 3, 4, 4, 4, 5];

// Fuerza bruta: para cada fila (en orden) prueba dejarla vacía o
// asignarle cualquier color todavía libre cuya cantidad alcance su
// tamaño. Con 5 filas y como mucho 5 colores el árbol tiene unas pocas
// decenas de nodos como mucho, así que no hace falta poda. Devuelve el
// máximo real de filas completables y UNA asignación óptima concreta
// (solo para explicar la respuesta al jugador; el número es lo que se
// evalúa).
function bestAssignment(counts) {
  const n = counts.length;
  const used = new Array(n).fill(false);
  let best = { filled: 0, assign: [] };

  function rec(rowIdx, filled, assign) {
    if (filled > best.filled) best = { filled, assign: assign.slice() };
    if (rowIdx === ROW_SIZES.length) return;
    const size = ROW_SIZES[rowIdx];
    // Opción 1: dejar esta fila vacía.
    rec(rowIdx + 1, filled, assign);
    // Opción 2: asignarle cualquier color libre que le alcance.
    for (let i = 0; i < n; i++) {
      if (!used[i] && counts[i] >= size) {
        used[i] = true;
        assign.push({ size, colorIdx: i });
        rec(rowIdx + 1, filled + 1, assign);
        assign.pop();
        used[i] = false;
      }
    }
  }

  rec(0, 0, []);
  return best;
}

// Genera una ronda: colores + cantidades en la bolsa y el máximo real de
// filas completables (con una asignación óptima de ejemplo para poder
// explicar el resultado). Se descartan rondas triviales: la respuesta
// nunca es 0 (con cantidades >=1 el máximo es siempre >=1, porque
// cualquier color con al menos 1 ficha llena la fila de tamaño 1) y se
// limita a que "vaciar la bolsa entera" (usar todos los colores de la
// ronda) no salga en más de ~1 de cada 5 rondas, para que lo típico sea
// tener que decidir cuántas filas —y no simplemente "todas"— caben.
// Con cantidades uniformes hasta 6, "caben todas" resulta ser el caso
// más común (los tamaños de fila más pequeños se llenan con muy poca
// ficha), así que además de rechazar ese caso casi siempre se acota el
// rango de cantidades algo por debajo del tamaño de fila más grande
// posible para esa bolsa.
export function generateMosaicoRound() {
  let colors, counts, result;
  let guard = 0;
  do {
    guard++;
    const numColors = pick(COLOR_COUNT_POOL);
    colors = shuffle(COLOR_DEFS).slice(0, numColors);
    // Tope de cantidad algo por debajo de "una ficha para cada fila que
    // haría falta para vaciar todo": mantiene rondas variadas sin dejar
    // de permitir ocasionalmente cantidades grandes.
    const maxQty = Math.min(6, numColors + 1);
    counts = colors.map(() => randInt(1, maxQty));
    result = bestAssignment(counts);
  } while (
    guard < 300 &&
    (result.filled === 0 || (result.filled === colors.length && Math.random() > 0.05))
  );

  const bag = colors.map((c, i) => ({ ...c, count: counts[i] }));
  return { bag, answer: result.filled, assign: result.assign };
}

function explainRound(round) {
  if (round.answer === 0) {
    return "Con estas fichas no se puede completar ninguna fila.";
  }
  const parts = round.assign
    .slice()
    .sort((a, b) => b.size - a.size)
    .map((a) => {
      const c = round.bag[a.colorIdx];
      return `con ${c.count} ${c.emoji} llenas la fila de ${a.size}`;
    });
  const word = round.answer === 1 ? "fila" : "filas";
  return `Reparto óptimo: ${parts.join(", ")} → total: ${round.answer} ${word}.`;
}

function ladderHtml() {
  return ROW_SIZES.map(
    (size) => `
      <div class="mos-row">
        <span class="mos-row-label">${size}</span>
        <div class="mos-row-cells">${'<span class="mos-cell"></span>'.repeat(size)}</div>
      </div>
    `
  ).join("");
}

function bagHtml(bag) {
  return bag
    .map(
      (c) => `
        <div class="mos-chip">
          <span class="mos-chip-emoji">${c.emoji}</span>
          <span class="mos-chip-count">×${c.count}</span>
        </div>
      `
    )
    .join("");
}

export function mountMosaicoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
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
    round = generateMosaicoRound();
    locked = false;

    body.innerHTML = `
      <p class="prompt">🀄 ¿Cuántas filas puedes completar como máximo?
        <small>Cada fila de tamaño N necesita N fichas del MISMO color. Cada color de la bolsa solo se puede usar en UNA fila.</small>
      </p>
      <div class="mos-ladder" data-ladder>${ladderHtml()}</div>
      <div class="mos-bag" data-bag>${bagHtml(round.bag)}</div>
      <div class="choices mos-choices" data-choices></div>
      <div class="feedback" data-feedback></div>
    `;

    const choicesEl = body.querySelector("[data-choices]");
    for (let v = 0; v <= round.bag.length; v++) {
      const btn = document.createElement("button");
      btn.className = "choice-btn mos-choice";
      btn.type = "button";
      btn.textContent = String(v);
      btn.setAttribute("data-value", String(v));
      btn.addEventListener("click", () => submit(v));
      choicesEl.appendChild(btn);
    }
  }

  function submit(guess) {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const explanation = explainRound(round);
    const correct = guess === round.answer;

    body.querySelectorAll("[data-choices] .mos-choice").forEach((btn) => {
      btn.disabled = true;
      const v = Number(btn.getAttribute("data-value"));
      if (v === round.answer) btn.classList.add("correct");
      else if (v === guess) btn.classList.add("wrong");
    });

    if (correct) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${explanation}`;
      feedback.className = "feedback ok";
      later(nextRound, 1600);
      return;
    }

    lives--;
    renderLives();
    feedback.textContent = `Casi — lo máximo eran ${round.answer}. ${explanation}`;
    feedback.className = "feedback bad";
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
    saveScore(client, "mosaico", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🀄</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} escaleras resueltas</p>
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
