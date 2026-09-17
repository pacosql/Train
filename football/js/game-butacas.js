// __BUILD_ID__
// "Sesión de cine": primer ejercicio de COMBINATORIA del catálogo (nadie
// más cuenta formas de ordenar o elegir todavía), así que la mecánica no
// se limita a pedir la fórmula de memoria — el objetivo es que el
// jugador entienda POR QUÉ se multiplica.
//
// Dos tipos de ronda, sorteados cada vez:
//   - "perm" (permutaciones): sentar a N amigos (2-4) en N butacas
//     seguidas. Respuesta: N! (N nunca pasa de 4, porque 4! = 24 ya es
//     grande para calcular de cabeza sin ayuda).
//   - "comb" (combinaciones): elegir 2 butacas de N en fila (3-6) para
//     que se sienten dos amigos, sin importar quién va en cuál.
//     Respuesta: C(N,2) = N·(N-1)/2.
//
// Se pide el TOTAL directamente con un teclado numérico (alternativa
// simple, más robusta que construir el conteo paso a paso), pero tanto
// si aciertas como si fallas el feedback SIEMPRE desglosa la cuenta
// multiplicativa paso a paso — así el fallo enseña el razonamiento, no
// solo da la fórmula.
import { randInt, pick, saveScore } from "./utils.js";

const FRIENDS = [
  { emoji: "🧑", name: "Ana" },
  { emoji: "🧔", name: "Bruno" },
  { emoji: "👩", name: "Carla" },
  { emoji: "👨", name: "Diego" },
  { emoji: "🧕", name: "Elena" },
  { emoji: "👱", name: "Fran" },
];

const ORDINAL_FEM = ["1ª", "2ª", "3ª", "4ª", "5ª", "6ª"];
const MAX_DIGITS = 2; // el mayor resultado posible es 4! = 24 (dos cifras)

// Elige `n` amigos distintos del banco, sin repetir, usando solo randInt
// (no se importa `shuffle` de utils.js: el contrato de este ejercicio
// solo permite randInt/pick/saveScore).
function sampleFriends(n) {
  const pool = FRIENDS.slice();
  const chosen = [];
  for (let i = 0; i < n; i++) {
    const idx = randInt(0, pool.length - 1);
    chosen.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return chosen;
}

function joinNames(friends) {
  const names = friends.map((f) => f.name);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

// Genera una ronda de butacas. Exportado aparte para poder testear la
// distribución y los rangos de N sin montar ningún DOM.
export function generateButacasRound() {
  const type = pick(["perm", "comb"]);
  if (type === "perm") {
    const n = randInt(2, 4);
    const friends = sampleFriends(n);
    const steps = [];
    for (let i = n; i >= 1; i--) steps.push(i);
    const answer = steps.reduce((acc, s) => acc * s, 1);
    return { type, n, friends, steps, answer };
  }
  const n = randInt(3, 6);
  const steps = [n, n - 1];
  const answer = (n * (n - 1)) / 2;
  return { type, n, steps, answer };
}

function breakdownText(round) {
  if (round.type === "perm") {
    const parts = round.steps.map((s, i) => `${s} opción${s === 1 ? "" : "es"} para la ${ORDINAL_FEM[i]} butaca`);
    return `${parts.join(" × ")} = ${round.answer}`;
  }
  const [a, b] = round.steps;
  return (
    `${a} opciones para la primera butaca elegida × ${b} para la segunda = ${a * b}, ` +
    `pero cada pareja de butacas se cuenta 2 veces (da igual cuál elijas antes) → ${a * b} ÷ 2 = ${round.answer}`
  );
}

function seatsRow(n, highlightAll) {
  let html = `<div class="but-seats">`;
  for (let i = 0; i < n; i++) {
    html += `<span class="but-seat${highlightAll ? " but-seat-empty" : ""}">🪑</span>`;
  }
  html += `</div>`;
  return html;
}

function friendsRow(friends) {
  return `<div class="but-friends">${friends
    .map((f) => `<span class="but-friend"><i class="but-friend-emoji">${f.emoji}</i>${f.name}</span>`)
    .join("")}</div>`;
}

export function mountButacasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false;
  let round = null;
  let typed = "";
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
    round = generateButacasRound();
    typed = "";
    locked = false;

    let promptText;
    let hintText;
    let sceneHtml;
    if (round.type === "perm") {
      promptText = `¿De cuántas formas distintas se pueden sentar estos ${round.n} amigos en una fila de ${round.n} butacas seguidas?`;
      hintText = `${joinNames(round.friends)} se sientan, cada uno en una butaca distinta`;
      sceneHtml = `${friendsRow(round.friends)}${seatsRow(round.n, true)}`;
    } else {
      promptText = `De estas ${round.n} butacas en fila, ¿de cuántas formas puedes elegir 2 para que se sienten dos amigos, sin importar quién se sienta en cuál?`;
      hintText = `Solo importa QUÉ dos butacas se eligen, no el orden en que se eligen`;
      sceneHtml = seatsRow(round.n, false);
    }

    body.innerHTML = `
      <p class="prompt">${promptText}<small>${hintText}</small></p>
      <div class="but-scene" data-scene>${sceneHtml}</div>
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
    `;

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

  function submit() {
    if (finished || locked || typed === "") return;
    const guess = Number(typed);
    const feedback = body.querySelector("[data-feedback]");
    locked = true;
    rounds++;

    if (guess === round.answer) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${breakdownText(round)}`;
      feedback.className = "feedback ok";
      later(nextRound, 1600);
      return;
    }

    lives--;
    renderLives();
    feedback.textContent = `${guess} no es correcto. ${breakdownText(round)}`;
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
    saveScore(client, "butacas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎬</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} sesiones organizadas</p>
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
