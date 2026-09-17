// "Trío": inspirado en el juego de mesa Set. Se reparten 9 cartas en una
// cuadrícula 3×3; cada carta tiene 3 atributos (cantidad, forma, color)
// con 3 valores posibles cada uno. Un trío válido exige que, atributo a
// atributo, las tres cartas coincidan TODAS o difieran TODAS — nunca
// "dos iguales y una distinta".
import { randInt, saveScore } from "./utils.js";

const SHAPE_SYMS = ["●", "■", "▲"];
const SHAPE_NAMES = ["círculo", "cuadrado", "triángulo"];
const COLOR_NAMES = ["rojo", "azul", "morado"];
const COUNT_NAMES = ["1", "2", "3"];

// Tablero de reserva con trío garantizado (las 3 primeras cartas varían
// los tres atributos a la vez), por si la guarda de generación se agota.
const FALLBACK_BOARD = [
  { count: 0, shape: 0, color: 0 },
  { count: 1, shape: 1, color: 1 },
  { count: 2, shape: 2, color: 2 },
  { count: 0, shape: 0, color: 1 },
  { count: 0, shape: 1, color: 2 },
  { count: 1, shape: 0, color: 2 },
  { count: 1, shape: 2, color: 0 },
  { count: 2, shape: 0, color: 0 },
  { count: 2, shape: 1, color: 0 },
];

function randomCard() {
  return { count: randInt(0, 2), shape: randInt(0, 2), color: randInt(0, 2) };
}

// ¿Los 3 valores de un atributo son todos iguales o todos distintos?
function attrOk(vals) {
  const set = new Set(vals);
  return set.size === 1 || set.size === 3;
}

export function isValidTrio(a, b, c) {
  return (
    attrOk([a.count, b.count, c.count]) &&
    attrOk([a.shape, b.shape, c.shape]) &&
    attrOk([a.color, b.color, c.color])
  );
}

// Recorre las C(9,3)=84 combinaciones posibles buscando al menos un trío.
export function hasTrio(cards) {
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      for (let k = j + 1; k < cards.length; k++) {
        if (isValidTrio(cards[i], cards[j], cards[k])) return true;
      }
    }
  }
  return false;
}

// Reparte 9 cartas al azar (pueden repetirse, como en el Set real) y
// regenera mientras no exista ningún trío en el tablero. Guarda de
// seguridad: si tras muchos intentos no aparece ninguno, usa un tablero
// de reserva fijo con un trío garantizado.
export function dealBoard() {
  let cards;
  let guard = 0;
  do {
    cards = Array.from({ length: 9 }, randomCard);
    guard++;
  } while (!hasTrio(cards) && guard < 500);
  if (!hasTrio(cards)) cards = FALLBACK_BOARD.map((c) => ({ ...c }));
  return cards;
}

function attrPhrase(label, names, vals) {
  const set = new Set(vals);
  if (set.size === 1) return `${label} igual (${names[vals[0]]})`;
  return `${label} distinta (${vals.map((v) => names[v]).join(", ")})`;
}

function attrFailPhrase(label, names, vals) {
  return `${label} ni igual ni distinta (${vals.map((v) => names[v]).join(", ")})`;
}

function cardHtml(card) {
  const figs = SHAPE_SYMS[card.shape].repeat(card.count + 1);
  return `<span class="tr-figs" style="color:var(--tr-color-${card.color})">${figs}</span>`;
}

export function mountTrioGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let cards = [];
  let selected = [];
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
    cards = dealBoard();
    selected = [];
    locked = false;

    body.innerHTML = `
      <p class="prompt">🎴 Toca 3 cartas que formen un <b>trío</b>
        <small>En cada atributo: las tres iguales o las tres distintas</small></p>
      <div class="tr-board" data-board></div>
      <div class="feedback" data-feedback></div>
    `;

    const boardEl = body.querySelector("[data-board]");
    cards.forEach((card, i) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn tr-card";
      btn.type = "button";
      btn.innerHTML = cardHtml(card);
      btn.addEventListener("click", () => tapCard(i));
      boardEl.appendChild(btn);
    });
    renderBoard();
  }

  function renderBoard(failIdx) {
    const btns = body.querySelectorAll("[data-board] .tr-card");
    btns.forEach((btn, i) => {
      btn.classList.toggle("tr-selected", selected.includes(i));
      btn.classList.toggle("tr-fail", !!failIdx && failIdx.includes(i));
      btn.disabled = locked;
    });
  }

  function tapCard(i) {
    if (finished || locked) return;
    const pos = selected.indexOf(i);
    if (pos >= 0) {
      selected.splice(pos, 1);
      renderBoard();
      return;
    }
    if (selected.length >= 3) return;
    selected.push(i);
    renderBoard();
    if (selected.length === 3) evaluate();
  }

  function evaluate() {
    const [ia, ib, ic] = selected;
    const trio = [cards[ia], cards[ib], cards[ic]];
    const feedback = body.querySelector("[data-feedback]");
    const attrs = [
      { label: "Cantidad", names: COUNT_NAMES, vals: trio.map((c) => c.count) },
      { label: "Forma", names: SHAPE_NAMES, vals: trio.map((c) => c.shape) },
      { label: "Color", names: COLOR_NAMES, vals: trio.map((c) => c.color) },
    ].map((a) => ({ ...a, ok: attrOk(a.vals) }));

    locked = true;
    if (attrs.every((a) => a.ok)) {
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Trío válido! ${attrs.map((a) => attrPhrase(a.label, a.names, a.vals)).join(" · ")}`;
      feedback.className = "feedback ok";
      renderBoard();
      later(nextRound, 1400);
    } else {
      lives--;
      renderLives();
      const fails = attrs.filter((a) => !a.ok);
      feedback.textContent = `No es trío: ${fails.map((a) => attrFailPhrase(a.label, a.names, a.vals)).join(" · ")}`;
      feedback.className = "feedback bad";
      renderBoard(selected);
      if (lives <= 0) return later(() => finish(false), 1600);
      later(() => {
        selected = [];
        locked = false;
        feedback.textContent = "";
        feedback.className = "feedback";
        renderBoard();
      }, 1600);
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "trio", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎴</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} tríos encontrados</p>
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
