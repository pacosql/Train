// #14 🎬 La cadena de la escena — una secuencia de pantallas de verdad
// (no una sola): cada pantalla pregunta por una prenda relacionada con la
// anterior (bufanda→cuello, luego gorro→cabeza…) y la figura se va
// vistiendo con cada acierto, para que el vocabulario se refuerce
// encadenado en un mismo contexto, no suelto.
import { SCENES } from "./data/scenes.js";
import { WORDS, WORDS_BY_ID, wordsByCategory } from "./data/words.js";
import { renderPersonFigure } from "./person-figure.js";
import { shuffle, pick, saveScore, escapeHtml } from "./utils.js";

function pickChoices(scene, anchor) {
  const correct = WORDS_BY_ID[anchor.wordId];
  const usedIds = new Set(scene.anchors.map((a) => a.wordId));
  const pool = wordsByCategory(correct.cat).filter((w) => w.id !== correct.id && w.en.toLowerCase() !== correct.en.toLowerCase());
  let distractors = shuffle(pool).slice(0, 3);
  if (distractors.length < 3) {
    const extra = shuffle(WORDS).filter((w) => w.id !== correct.id && !distractors.includes(w) && !usedIds.has(w.id));
    distractors = distractors.concat(extra).slice(0, 3);
  }
  return shuffle([correct, ...distractors]);
}

export function mountGameCadena(container, { client, onExit }) {
  const id = "cadena-escena";
  let scene = pick(SCENES);
  let steps = [];
  let stepIndex = 0;
  let filled = {};
  let lives = 3;
  let score = 0;
  let rounds = 0;
  let hits = 0;
  let answered = false;
  let finished = false;

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
  const body = container.querySelector("[data-body]");
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(3 - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function renderStep() {
    answered = false;
    const anchor = steps[stepIndex];
    const word = WORDS_BY_ID[anchor.wordId];
    const choices = pickChoices(scene, anchor);
    body.innerHTML = `
      <p class="prompt">Pantalla ${stepIndex + 1}/${steps.length} · ${escapeHtml(scene.title)}<small>¿Qué te pones en ${escapeHtml(anchor.label)}?</small></p>
      ${renderPersonFigure(scene.anchors, filled)}
      <div class="choices" data-choices></div>
      <div class="feedback" data-feedback></div>
    `;
    const choicesEl = body.querySelector("[data-choices]");
    choices.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = `${opt.emoji} ${opt.en}`;
      btn.addEventListener("click", () => answer(opt, word, anchor, btn, choicesEl));
      choicesEl.appendChild(btn);
    });
  }

  function answer(opt, correctWord, anchor, btn, choicesEl) {
    if (answered) return;
    answered = true;
    rounds++;
    const correct = opt.id === correctWord.id;
    [...choicesEl.children].forEach((c) => (c.disabled = true));
    const feedback = body.querySelector("[data-feedback]");
    filled[anchor.id] = correctWord.emoji;
    if (correct) {
      hits++;
      score += 10;
      btn.classList.add("correct");
      feedback.textContent = "¡Bien! Sigamos vistiendo la escena…";
      feedback.className = "feedback ok";
    } else {
      lives--;
      renderLives();
      btn.classList.add("wrong");
      [...choicesEl.children].find((c) => c.textContent.includes(correctWord.en))?.classList.add("correct");
      feedback.textContent = `Era "${correctWord.en}" (${correctWord.es})`;
      feedback.className = "feedback bad";
    }
    renderScore();
    setTimeout(() => {
      if (finished) return;
      if (lives <= 0) return finish(false);
      stepIndex++;
      if (stepIndex >= steps.length) return finish(false);
      renderStep();
    }, 1100);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    if (userExited) {
      onExit();
      return;
    }
    saveScore(client, id, { score, rounds, avgMs: null });
    body.innerHTML = `
      <div class="end-card">
        <div>🎬</div>
        <div class="big-score">${score} pts</div>
        <p>${hits}/${rounds} aciertos · escena: ${escapeHtml(scene.title)}</p>
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
    scene = pick(SCENES);
    steps = shuffle(scene.anchors);
    stepIndex = 0;
    filled = {};
    lives = 3;
    score = 0;
    rounds = 0;
    hits = 0;
    finished = false;
    renderLives();
    renderScore();
    renderStep();
  }

  start();

  return function cleanup() {
    finished = true;
  };
}
