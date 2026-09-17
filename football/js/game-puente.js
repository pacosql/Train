// "El puente": al puente le falta un tramo. Parte del hueco ya está tapada
// por un tablón y hay que tocar la pieza que completa EXACTAMENTE lo que
// queda (complemento a N hecho longitud, estilo ST Math).
// RESTRICCIÓN DE DISEÑO: en la zona de juego no hay ni una palabra ni una
// cifra — el porqué del error se ve en la animación, no se lee.
import { clamp, pick, randInt, shuffle, saveScore } from "./utils.js";

const CELL = 26; // px de cada cuadradito (misma medida en hueco y piezas)
const DECK = 42; // px de plataforma a cada lado

// Nivel 0: piezas con cuadraditos marcados. Nivel 1: piezas lisas.
// Nivel 2: además se difuminan las divisiones del hueco.
const LEVELS = [
  { pieces: 3, maxR: 3, maxA: 2, divided: true, fadedGap: false },
  { pieces: 4, maxR: 4, maxA: 4, divided: false, fadedGap: false },
  { pieces: 5, maxR: 5, maxA: 5, divided: false, fadedGap: true },
];

// Genera la ronda: hueco total = tapado + lo que falta, y un banco de
// piezas de longitudes DISTINTAS con una única que encaja.
export function makePuenteRound(level) {
  const cfg = LEVELS[clamp(level, 0, LEVELS.length - 1)];
  let round = null;
  let guard = 0;
  do {
    guard++;
    const r = randInt(1, cfg.maxR);
    const a = randInt(1, cfg.maxA);
    const total = a + r;
    if (total > 8) continue;
    const others = [];
    for (let L = 1; L <= 5; L++) if (L !== r) others.push(L);
    const pieces = shuffle(others).slice(0, cfg.pieces - 1).concat([r]);
    const candidate = { a, r, total, pieces: shuffle(pieces), cfg };
    // Una sola pieza puede encajar y todas las longitudes son distintas.
    const fits = candidate.pieces.filter((L) => L === r).length;
    const unique = new Set(candidate.pieces).size === candidate.pieces.length;
    if (fits === 1 && unique && candidate.pieces.length === cfg.pieces) round = candidate;
  } while (!round && guard < 200);
  // Guarda agotada: caso fijo válido.
  return round || { a: 2, r: 3, total: 5, pieces: shuffle([3, 1, 5, 2, 4].slice(0, cfg.pieces)), cfg };
}

export function mountPuenteGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  const timers = [];

  let round = null;
  let locked = true;

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
    round = makePuenteRound(Math.floor(streak / 3));
    locked = false;
    const { a, r, total, cfg } = round;
    const gapW = total * CELL;
    const sceneW = DECK * 2 + gapW;

    let gapCells = "";
    for (let i = 0; i < total; i++) {
      const filled = i < a;
      gapCells += `<div class="pu-cell ${filled ? "is-plank" : "is-hole"}${cfg.fadedGap && !filled ? " is-faded" : ""}"></div>`;
    }

    body.innerHTML = `
      <div class="pu-hint">🐧 ➜ 🚩</div>
      <div class="pu-scene" data-scene style="width:${sceneW}px;height:150px;">
        <div class="pu-sky"></div>
        <div class="pu-deck" style="left:0;width:${DECK}px;"></div>
        <div class="pu-deck" style="left:${DECK + gapW}px;width:${DECK}px;"></div>
        <div class="pu-flag" style="left:${DECK + gapW + DECK / 2 - 9}px;">🚩</div>
        <div class="pu-gap" data-gap style="left:${DECK}px;width:${gapW}px;">${gapCells}</div>
        <div class="pu-piece pu-placed" data-placed></div>
        <div class="pu-peng" data-peng>🐧</div>
      </div>
      <div class="pu-bank" data-bank></div>
      <div class="feedback" data-feedback></div>
    `;

    const bank = body.querySelector("[data-bank]");
    round.pieces.forEach((L) => {
      const btn = document.createElement("button");
      btn.className = "pu-bank-btn";
      btn.type = "button";
      btn.innerHTML = `<span class="pu-piece ${cfg.divided ? "is-divided" : ""}" style="width:${L * CELL}px"></span>`;
      btn.addEventListener("click", () => choose(L, btn));
      bank.appendChild(btn);
    });
    const peng = body.querySelector("[data-peng]");
    peng.style.left = "6px";
  }

  function choose(L, btn) {
    if (finished || locked) return;
    locked = true;
    const { a, r, total, cfg } = round;
    body.querySelectorAll(".pu-bank-btn").forEach((b) => { b.disabled = true; });
    btn.classList.add("is-taken");

    // La pieza se coloca SIEMPRE: la consecuencia del error se ve.
    const placed = body.querySelector("[data-placed]");
    placed.className = `pu-piece pu-placed is-drop ${cfg.divided ? "is-divided" : ""}`;
    placed.style.left = `${DECK + a * CELL}px`;
    placed.style.width = `${L * CELL}px`;
    const cells = body.querySelectorAll(".pu-cell");
    const feedback = body.querySelector("[data-feedback]");
    const peng = body.querySelector("[data-peng]");

    if (L === r) {
      for (let i = a; i < total; i++) cells[i].classList.add("is-plank", "is-fixed");
      later(() => { peng.style.left = `${DECK * 1.5 + total * CELL - 12}px`; }, 380);
      later(() => {
        peng.classList.add("is-happy");
        feedback.textContent = "✓";
        feedback.className = "feedback ok";
        rounds++;
        streak++;
        score += 10;
        renderScore();
      }, 1100);
      return later(nextRound, 1900);
    }

    // Se ha fallado: la animación enseña el porqué (se cae o cojea).
    rounds++;
    streak = 0;
    lives--;
    renderLives();
    if (L < r) {
      // Corta: quedan huecos y el pingüino se cae por ellos.
      for (let i = a; i < a + L; i++) cells[i].classList.add("is-plank", "is-fixed");
      for (let i = a + L; i < total; i++) cells[i].classList.add("is-miss");
      later(() => { peng.style.left = `${DECK + (a + L) * CELL - 4}px`; }, 380);
      later(() => peng.classList.add("is-fall"), 1050);
    } else {
      // Larga: la pieza sobresale, se vence y el pingüino resbala.
      for (let i = a; i < total; i++) cells[i].classList.add("is-plank", "is-fixed");
      placed.classList.add("is-over");
      placed.style.setProperty("--pu-over", `${(L - r) * CELL}px`);
      later(() => { peng.style.left = `${DECK + a * CELL + 6}px`; }, 380);
      later(() => {
        placed.classList.add("is-tilt");
        peng.classList.add("is-slip");
      }, 1050);
    }
    feedback.textContent = "✗";
    feedback.className = "feedback bad";
    later(() => {
      if (lives <= 0) return finish(false);
      nextRound();
    }, 2300);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "puente", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🐧</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} puentes</p>
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
    streak = 0;
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
