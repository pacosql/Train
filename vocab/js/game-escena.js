// #13 🧥 Viste la escena — varias palabras relacionadas a la vez (gorro→
// cabeza, bufanda→cuello, guantes→manos…) en una sola pantalla: toca una
// prenda de la lista y luego toca dónde se pone. Refuerza el vocabulario
// en contexto de uso, no palabras sueltas.
import { SCENES } from "./data/scenes.js";
import { WORDS_BY_ID } from "./data/words.js";
import { renderPersonFigure } from "./person-figure.js";
import { shuffle, saveScore, escapeHtml } from "./utils.js";

export function mountGameEscena(container, { client, onExit }) {
  const id = "viste-la-escena";
  let sceneQueue = shuffle(SCENES);
  let sceneIndex = 0;
  let lives = 3;
  let score = 0;
  let rounds = 0;
  let hits = 0;
  let filled = {};
  let remaining = [];
  let selectedId = null;
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

  function loadScene() {
    const scene = sceneQueue[sceneIndex];
    filled = {};
    selectedId = null;
    remaining = shuffle(scene.anchors.map((a) => WORDS_BY_ID[a.wordId]));
    renderScene(scene);
  }

  function renderScene(scene) {
    body.innerHTML = `
      <p class="prompt">${escapeHtml(scene.title)}<small>${escapeHtml(scene.intro)}</small></p>
      ${renderPersonFigure(scene.anchors, filled)}
      <div class="scene-chips" data-chips></div>
      <div class="feedback" data-feedback></div>
    `;
    const chipsEl = body.querySelector("[data-chips]");
    remaining.forEach((word) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.dataset.wordId = word.id;
      chip.textContent = `${word.emoji} ${word.en}`;
      chip.addEventListener("click", () => selectChip(word.id, chip, chipsEl));
      chipsEl.appendChild(chip);
    });
    body.querySelectorAll("[data-anchor]").forEach((btn) => {
      btn.addEventListener("click", () => tryAnchor(btn.dataset.anchor, scene));
    });
  }

  function selectChip(wordId, chip, chipsEl) {
    if (finished) return;
    selectedId = selectedId === wordId ? null : wordId;
    chipsEl.querySelectorAll(".chip").forEach((c) => c.classList.toggle("picked", c.dataset.wordId === selectedId));
  }

  function tryAnchor(anchorId, scene) {
    if (finished || !selectedId) return;
    const anchor = scene.anchors.find((a) => a.id === anchorId);
    const feedback = body.querySelector("[data-feedback]");
    rounds++;
    if (anchor.wordId === selectedId) {
      hits++;
      score += 10;
      filled[anchorId] = WORDS_BY_ID[selectedId].emoji;
      remaining = remaining.filter((w) => w.id !== selectedId);
      selectedId = null;
      renderScore();
      if (remaining.length === 0) {
        feedback.textContent = "¡Bien! Escena completa";
        feedback.className = "feedback ok";
        setTimeout(() => nextScene(), 900);
        return;
      }
      renderScene(scene);
      const newFeedback = body.querySelector("[data-feedback]");
      newFeedback.textContent = "¡Bien!";
      newFeedback.className = "feedback ok";
    } else {
      lives--;
      renderLives();
      selectedId = null;
      feedback.textContent = `No — "${WORDS_BY_ID[anchor.wordId].en}" va en ${anchor.label}`;
      feedback.className = "feedback bad";
      body.querySelectorAll(".chip").forEach((c) => c.classList.remove("picked"));
      if (lives <= 0) {
        setTimeout(() => finish(false), 700);
        return;
      }
    }
  }

  function nextScene() {
    sceneIndex++;
    if (sceneIndex >= sceneQueue.length) {
      finish(false);
      return;
    }
    loadScene();
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
        <div>🧥</div>
        <div class="big-score">${score} pts</div>
        <p>${hits}/${rounds} prendas bien puestas</p>
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
    sceneQueue = shuffle(SCENES);
    sceneIndex = 0;
    lives = 3;
    score = 0;
    rounds = 0;
    hits = 0;
    finished = false;
    renderLives();
    renderScore();
    loadScene();
  }

  start();

  return function cleanup() {
    finished = true;
  };
}
