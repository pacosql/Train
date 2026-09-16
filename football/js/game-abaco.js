// "Ábaco": ábaco real de 3 varillas con 9 bolas cada una. Las bolas se
// deslizan de verdad al lado activo — es un manipulativo, no un contador:
// el niño ve la cantidad como posición física, no como un número escrito.
import { randInt, saveScore } from "./utils.js";

const ROWS = [
  { key: "c", label: "Centenas", value: 100 },
  { key: "d", label: "Decenas", value: 10 },
  { key: "u", label: "Unidades", value: 1 },
];

const BEADS = 9;
const BEAD = 22; // px — debe coincidir con el ancho de .pb-bead en pack-b.css
const STEP = 25;

export function mountAbacoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let target = 0;
  let lastTarget = -1;
  let counts = { c: 0, d: 0, u: 0 };
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

  function currentValue() {
    return counts.c * 100 + counts.d * 10 + counts.u;
  }

  function nextRound() {
    // Cualquier número de 3 cifras cabe en 9+9+9 bolas; solo evitamos
    // repetir el mismo objetivo dos rondas seguidas.
    do {
      target = randInt(102, 987);
    } while (target === lastTarget);
    lastTarget = target;
    counts = { c: 0, d: 0, u: 0 };
    locked = false;

    body.innerHTML = `
      <p class="prompt">Representa el <b>${target}</b><small>Toca las bolas para moverlas a la izquierda</small></p>
      <div class="pb-abaco" data-abaco></div>
      <div class="pb-abaco-readout">Marcas: <b data-readout>0</b></div>
      <div class="feedback" data-feedback></div>
      <div class="pb-actions">
        <button class="primary" data-confirm>Confirmar</button>
        <button class="secondary" data-reset>↺ Reiniciar</button>
      </div>
    `;

    const abaco = body.querySelector("[data-abaco]");
    ROWS.forEach((row) => {
      const wrap = document.createElement("div");
      wrap.className = "pb-row";
      // La etiqueta va encima: así la varilla ocupa todo el ancho y las
      // bolas tienen recorrido visible incluso en móviles estrechos.
      wrap.innerHTML = `
        <div class="pb-row-head">
          <span>${row.label}</span>
          <b data-digit="${row.key}">0</b>
        </div>
        <div class="pb-rod" data-rod="${row.key}"></div>
      `;
      const rod = wrap.querySelector(".pb-rod");
      for (let i = 0; i < BEADS; i++) {
        const bead = document.createElement("button");
        bead.className = "pb-bead off";
        bead.type = "button";
        bead.dataset.index = String(i);
        bead.setAttribute("aria-label", `Bola ${i + 1} de ${row.label}`);
        bead.addEventListener("click", () => tapBead(row.key, i));
        rod.appendChild(bead);
      }
      abaco.appendChild(wrap);
    });

    body.querySelector("[data-confirm]").addEventListener("click", check);
    body.querySelector("[data-reset]").addEventListener("click", () => {
      if (finished || locked) return;
      counts = { c: 0, d: 0, u: 0 };
      renderBeads();
    });
    renderBeads();
  }

  // Solo movemos las bolas ya creadas (no rehacemos el DOM) para que la
  // transición CSS de `left` se vea como un deslizamiento real.
  function renderBeads() {
    ROWS.forEach((row) => {
      const rod = body.querySelector(`[data-rod="${row.key}"]`);
      if (!rod) return;
      const n = counts[row.key];
      rod.querySelectorAll(".pb-bead").forEach((bead, i) => {
        const on = i < n;
        bead.classList.toggle("on", on);
        bead.classList.toggle("off", !on);
        bead.style.left = on
          ? `${i * STEP}px`
          : `calc(100% - ${BEAD}px - ${(BEADS - 1 - i) * STEP}px)`;
      });
      body.querySelector(`[data-digit="${row.key}"]`).textContent = String(n);
    });
    body.querySelector("[data-readout]").textContent = String(currentValue());
  }

  // Tocar la última bola activa la devuelve: así se puede corregir sin reiniciar.
  function tapBead(key, index) {
    if (finished || locked) return;
    counts[key] = counts[key] === index + 1 ? index : index + 1;
    renderBeads();
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = "";
    feedback.className = "feedback";
  }

  function check() {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (currentValue() === target) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Ábaco perfecto!";
      feedback.className = "feedback ok";
      later(nextRound, 750);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Ahí marcas ${currentValue()}, no ${target}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 700);
      later(() => {
        counts = { c: 0, d: 0, u: 0 };
        locked = false;
        renderBeads();
      }, 700);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "abaco", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧮</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} números representados</p>
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
