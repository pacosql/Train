// "Construye la torre": copiar, doblar o superar en 3 una torre modelo.
// Comparar dos alturas lado a lado hace visible la relación (doble, +3)
// mucho antes de que el niño sepa escribirla como operación.
import { randInt, pick, saveScore } from "./utils.js";

const RULES = [
  { id: "igual", text: "igual de alta", apply: (n) => n },
  { id: "doble", text: "el doble de alta", apply: (n) => n * 2 },
  { id: "mas3", text: "3 bloques más alta", apply: (n) => n + 3 },
];

const MAX_STACK = 14; // tope físico: por encima la torre no cabe en pantalla

export function mountTorreGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let model = 0;
  let target = 0;
  let built = 0;
  let lastKey = "";
  let locked = false; // evita tocar mientras se resuelve la ronda
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
    // El modelo empieza en 2 para que "el doble" nunca coincida con "igual",
    // y el objetivo se limita a lo que cabe apilado en el vaso de la derecha.
    let rule = null;
    let key = "";
    do {
      model = randInt(2, 6);
      rule = pick(RULES);
      target = rule.apply(model);
      key = `${model}-${rule.id}`;
    } while (target < 2 || target > 12 || key === lastKey);
    lastKey = key;
    built = 0;
    locked = false;

    body.innerHTML = `
      <p class="prompt">Haz una torre <b>${rule.text}</b><small>Toca la zona de la derecha para poner bloques</small></p>
      <div class="pb-towers">
        <div class="pb-tower-side">
          <div class="pb-tower pb-tower-model" data-model></div>
          <span class="pb-tower-name">Modelo (${model})</span>
        </div>
        <div class="pb-tower-side">
          <button class="pb-tower pb-tower-mine" data-mine type="button"></button>
          <span class="pb-tower-name">Tu torre: <b data-count>0</b></span>
        </div>
      </div>
      <div class="feedback" data-feedback></div>
      <div class="pb-actions">
        <button class="primary" data-confirm>Confirmar</button>
        <button class="secondary" data-undo>− Quitar</button>
        <button class="secondary" data-reset>↺</button>
      </div>
    `;

    const modelEl = body.querySelector("[data-model]");
    for (let i = 0; i < model; i++) {
      const b = document.createElement("div");
      b.className = "pb-brick pb-brick-model";
      modelEl.appendChild(b);
    }
    body.querySelector("[data-mine]").addEventListener("click", addBrick);
    body.querySelector("[data-confirm]").addEventListener("click", check);
    body.querySelector("[data-undo]").addEventListener("click", () => {
      if (finished || locked || built === 0) return;
      built--;
      renderMine();
    });
    body.querySelector("[data-reset]").addEventListener("click", () => {
      if (finished || locked) return;
      built = 0;
      renderMine();
    });
    renderMine();
  }

  function renderMine() {
    const mine = body.querySelector("[data-mine]");
    mine.innerHTML = "";
    for (let i = 0; i < built; i++) {
      const b = document.createElement("div");
      b.className = "pb-brick pb-brick-mine";
      mine.appendChild(b);
    }
    body.querySelector("[data-count]").textContent = String(built);
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = "";
    feedback.className = "feedback";
  }

  function addBrick() {
    if (finished || locked || built >= MAX_STACK) return;
    built++;
    renderMine();
  }

  function check() {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (built === target) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Torre perfecta!";
      feedback.className = "feedback ok";
      later(nextRound, 800);
    } else {
      lives--;
      renderLives();
      feedback.textContent = built > target ? `Te sobran ${built - target} bloques` : `Te faltan ${target - built} bloques`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 800);
      later(() => {
        built = 0;
        locked = false;
        renderMine();
      }, 800);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "torre", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🏗️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} torres construidas</p>
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
