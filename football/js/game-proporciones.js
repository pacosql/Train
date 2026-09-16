// "Mezclas y proporciones": escalar una receta. La razón base se dibuja
// con iconos porque el salto mental (2 por cada 3) se ve antes contando
// dibujos que leyendo una fracción.
import { randInt, pick, buildChoices, saveScore } from "./utils.js";

const RECETAS = [
  { a: { e: "🍋", n: "limones" }, b: { e: "🍯", n: "cucharadas de miel" }, titulo: "limonada" },
  { a: { e: "🥛", n: "vasos de leche" }, b: { e: "🍫", n: "onzas de chocolate" }, titulo: "batido" },
  { a: { e: "🍓", n: "fresas" }, b: { e: "🍬", n: "terrones de azúcar" }, titulo: "mermelada" },
  { a: { e: "☕", n: "cafés" }, b: { e: "🥄", n: "cucharaditas" }, titulo: "café con leche" },
  { a: { e: "🍅", n: "tomates" }, b: { e: "🧄", n: "dientes de ajo" }, titulo: "salsa" },
  { a: { e: "🌾", n: "puñados de harina" }, b: { e: "🥚", n: "huevos" }, titulo: "bizcocho" },
  { a: { e: "🔵", n: "bolas azules" }, b: { e: "🔴", n: "bolas rojas" }, titulo: "collar" },
];

function gcd(x, y) {
  return y === 0 ? x : gcd(y, x % y);
}

export function mountProporcionesGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let timers = [];

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
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    const receta = pick(RECETAS);
    // Razón irreducible y con los dos lados distintos: si fuera 2:2 o 2:4
    // la respuesta "el mismo número" colaría por casualidad.
    let ra, rb;
    do {
      ra = randInt(1, 5);
      rb = randInt(1, 5);
    } while (ra === rb || gcd(ra, rb) !== 1);

    const k = randInt(2, 5); // siempre se escala hacia arriba, nunca k = 1
    const preguntaB = randInt(0, 1) === 0;
    const dado = preguntaB ? ra * k : rb * k;
    const correct = preguntaB ? rb * k : ra * k;
    const ingDado = preguntaB ? receta.a : receta.b;
    const ingPide = preguntaB ? receta.b : receta.a;

    const iconosA = receta.a.e.repeat(ra);
    const iconosB = receta.b.e.repeat(rb);

    body.innerHTML = `
      <div class="ratio-wrap">
        <p class="prompt ratio-prompt">Receta de ${receta.titulo}</p>
        <div class="ratio-base">
          <div class="ratio-row">
            <span class="ratio-label">por cada</span>
            <span class="ratio-num">${ra}</span>
            <span class="ratio-icons">${iconosA}</span>
          </div>
          <div class="ratio-row">
            <span class="ratio-label">hacen falta</span>
            <span class="ratio-num">${rb}</span>
            <span class="ratio-icons">${iconosB}</span>
          </div>
        </div>
        <p class="ratio-question">
          Si usas <b>${dado} ${ingDado.e}</b>, ¿cuántos <b>${ingPide.e}</b> necesitas?
          <small>${ingPide.n}</small>
        </p>
        <div class="choices ratio-choices" data-choices></div>
        <div class="feedback" data-feedback></div>
      </div>
    `;
    const choicesEl = body.querySelector("[data-choices]");
    buildChoices(correct, () => randInt(Math.max(1, correct - 4), correct + 5)).forEach((v) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = v;
      btn.addEventListener("click", () => answer(v, correct, btn, choicesEl));
      choicesEl.appendChild(btn);
    });
  }

  function answer(v, correct, btn, choicesEl) {
    if (finished) return;
    rounds++;
    choicesEl.querySelectorAll("button").forEach((b) => { b.disabled = true; });
    const feedback = body.querySelector("[data-feedback]");
    if (v === correct) {
      btn.classList.add("correct");
      score += 10;
      renderScore();
      feedback.textContent = "¡Proporción exacta!";
      feedback.className = "feedback ok";
      later(nextRound, 700);
    } else {
      btn.classList.add("wrong");
      choicesEl.querySelectorAll("button").forEach((b) => {
        if (Number(b.textContent) === correct) b.classList.add("correct");
      });
      lives--;
      renderLives();
      feedback.textContent = `Eran ${correct}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 800);
      later(nextRound, 1100);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "proporciones", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧪</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} rondas</p>
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
    clearTimers();
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
    clearTimers();
  };
}
