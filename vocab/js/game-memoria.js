// #22 🃏 Memoria bilingüe — voltea cartas para emparejar el emoji de una
// palabra con su texto en inglés. Repaso y consolidación, no aprendizaje
// nuevo: por eso mezcla palabras de varias categorías a la vez.
import { WORDS } from "./data/words.js";
import { shuffle, saveScore } from "./utils.js";

const PAIRS = 6;

export function mountGameMemoria(container, { client, onExit }) {
  const id = "memoria-bilingue";
  let cards = [];
  let flipped = [];
  let matched = 0;
  let fails = 0;
  let score = 0;
  let busy = false;
  let finished = false;
  let startedAt = 0;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="streak" data-fails></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body></div>
  `;
  const body = container.querySelector("[data-body]");
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const failsEl = container.querySelector("[data-fails]");
  const scoreEl = container.querySelector("[data-score]");

  function renderFails() {
    failsEl.textContent = fails > 0 ? `❌ ${fails}` : "";
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function buildCards() {
    const chosen = shuffle(WORDS).slice(0, PAIRS);
    const raw = chosen.flatMap((w) => [
      { wordId: w.id, type: "emoji", content: w.emoji },
      { wordId: w.id, type: "text", content: w.en },
    ]);
    return shuffle(raw).map((c, i) => ({ ...c, index: i, open: false, matched: false }));
  }

  function renderGrid() {
    body.innerHTML = `
      <p class="prompt">Empareja el emoji con su palabra<small>${matched}/${PAIRS} parejas encontradas</small></p>
      <div class="memo-grid" data-grid></div>
    `;
    const grid = body.querySelector("[data-grid]");
    cards.forEach((card) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `memo-card${card.open ? " open" : ""}${card.matched ? " matched" : ""}`;
      el.innerHTML = `<span class="memo-back">🃏</span><span class="memo-front">${card.content}</span>`;
      el.addEventListener("click", () => flip(card.index));
      grid.appendChild(el);
    });
  }

  function flip(index) {
    if (finished || busy) return;
    const card = cards[index];
    if (card.open || card.matched) return;
    card.open = true;
    flipped.push(index);
    renderGrid();
    if (flipped.length < 2) return;
    busy = true;
    const [a, b] = flipped;
    const isMatch = cards[a].wordId === cards[b].wordId;
    setTimeout(() => {
      if (isMatch) {
        cards[a].matched = true;
        cards[b].matched = true;
        matched++;
        score += 15;
        renderScore();
      } else {
        cards[a].open = false;
        cards[b].open = false;
        fails++;
        renderFails();
      }
      flipped = [];
      busy = false;
      if (matched === PAIRS) return finish(false);
      renderGrid();
    }, 700);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    if (userExited) {
      onExit();
      return;
    }
    const seconds = Math.round((performance.now() - startedAt) / 1000);
    saveScore(client, id, { score, rounds: PAIRS, avgMs: null });
    body.innerHTML = `
      <div class="end-card">
        <div>🃏</div>
        <div class="big-score">${score} pts</div>
        <p>${PAIRS} parejas en ${seconds}s · ${fails} fallos</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>
    `;
    container.querySelector("[data-retry]").addEventListener("click", () => start());
    container.querySelector("[data-menu]").addEventListener("click", () => onExit());
  }

  function start() {
    cards = buildCards();
    flipped = [];
    matched = 0;
    fails = 0;
    score = 0;
    busy = false;
    finished = false;
    startedAt = performance.now();
    renderFails();
    renderScore();
    renderGrid();
  }

  start();

  return function cleanup() {
    finished = true;
  };
}
