// "Memoria matemática": voltea cartas para encontrar la pareja
// operación ↔ resultado. Mecánica de memoria/concentración clásica.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const SHAPES = [
  ["Triángulo", "3 lados"],
  ["Cuadrado", "4 lados"],
  ["Pentágono", "5 lados"],
  ["Hexágono", "6 lados"],
];

function buildPairs() {
  const pairs = [];
  const usedShapes = shuffle(SHAPES).slice(0, 2);
  usedShapes.forEach(([name, sides]) => pairs.push([name, sides]));
  while (pairs.length < 6) {
    const type = pick(["mult", "add"]);
    if (type === "mult") {
      const a = randInt(2, 9), b = randInt(2, 9);
      pairs.push([`${a} × ${b}`, String(a * b)]);
    } else {
      const a = randInt(5, 40), b = randInt(5, 40);
      pairs.push([`${a} + ${b}`, String(a + b)]);
    }
  }
  return pairs;
}

export function mountMemoriaGame(container, { client, onExit }) {
  let score = 0;
  let attempts = 0;
  let matchedPairs = 0;
  let finished = false;
  let flipped = [];
  let busy = false;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span data-progress>0/6 parejas</span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const progressEl = container.querySelector("[data-progress]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");

  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
    progressEl.textContent = `${matchedPairs}/6 parejas`;
  }

  function start() {
    score = 0;
    attempts = 0;
    matchedPairs = 0;
    finished = false;
    flipped = [];
    busy = false;
    const pairs = buildPairs();
    const cards = shuffle(
      pairs.flatMap(([a, b], pairId) => [
        { pairId, text: a },
        { pairId, text: b },
      ])
    );
    body.innerHTML = `<div class="memo-grid" data-grid></div>`;
    const grid = body.querySelector("[data-grid]");
    cards.forEach((card, idx) => {
      const el = document.createElement("button");
      el.className = "memo-card";
      el.dataset.idx = idx;
      el.innerHTML = `<span class="memo-back">?</span><span class="memo-front">${card.text}</span>`;
      el.addEventListener("click", () => flipCard(el, card));
      grid.appendChild(el);
    });
    renderScore();
  }

  function flipCard(el, card) {
    if (finished || busy || el.classList.contains("open") || el.classList.contains("matched")) return;
    el.classList.add("open");
    flipped.push({ el, card });
    if (flipped.length < 2) return;
    busy = true;
    attempts++;
    const [first, second] = flipped;
    if (first.card.pairId === second.card.pairId) {
      first.el.classList.add("matched");
      second.el.classList.add("matched");
      matchedPairs++;
      score += 10;
      renderScore();
      flipped = [];
      busy = false;
      if (matchedPairs >= 6) setTimeout(() => finish(false), 400);
    } else {
      setTimeout(() => {
        first.el.classList.remove("open");
        second.el.classList.remove("open");
        flipped = [];
        busy = false;
      }, 700);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "memoria", { score, rounds: attempts });
    body.innerHTML = `
      <div class="end-card">
        <div>🃏</div>
        <div class="big-score">${score} pts</div>
        <p>${attempts} intentos para las 6 parejas</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>
    `;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  start();
  return () => {
    finished = true;
  };
}
