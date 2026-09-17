// "Construye el número": toca columnas de centenas/decenas/unidades para
// construir visualmente el número objetivo (valor posicional).
import { randInt, saveScore } from "./utils.js";

const COLUMNS = [
  { key: "c", label: "Centenas", value: 100 },
  { key: "d", label: "Decenas", value: 10 },
  { key: "u", label: "Unidades", value: 1 },
];

export function mountBloquesGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let target = 0;
  let counts = { c: 0, d: 0, u: 0 };

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
    target = randInt(101, 899);
    counts = { c: 0, d: 0, u: 0 };
    body.innerHTML = `
      <p class="prompt">Construye el <b>${target}</b><small>Toca cada columna para añadir un bloque</small></p>
      <div class="blocks-readout" data-readout>0</div>
      <div class="blocks-cols" data-cols></div>
      <div class="feedback" data-feedback></div>
      <button class="secondary" data-reset style="margin-top:10px;">↺ Reiniciar</button>
    `;
    const colsEl = body.querySelector("[data-cols]");
    COLUMNS.forEach((col) => {
      const wrap = document.createElement("div");
      wrap.className = "blocks-col";
      wrap.innerHTML = `
        <div class="blocks-stack" data-stack="${col.key}"></div>
        <button class="choice-btn" data-add="${col.key}">+1 ${col.label}</button>
      `;
      colsEl.appendChild(wrap);
    });
    colsEl.querySelectorAll("[data-add]").forEach((btn) => {
      btn.addEventListener("click", () => addBlock(btn.dataset.add));
    });
    body.querySelector("[data-reset]").addEventListener("click", () => {
      counts = { c: 0, d: 0, u: 0 };
      renderBlocks();
    });
    renderBlocks();
  }

  function renderBlocks() {
    COLUMNS.forEach((col) => {
      const stack = body.querySelector(`[data-stack="${col.key}"]`);
      stack.innerHTML = "";
      for (let i = 0; i < counts[col.key]; i++) {
        const b = document.createElement("div");
        b.className = `block-unit block-${col.key}`;
        stack.appendChild(b);
      }
    });
    body.querySelector("[data-readout]").textContent = String(currentValue());
  }

  function addBlock(key) {
    if (finished || counts[key] >= 9) return;
    counts[key]++;
    renderBlocks();
    const feedback = body.querySelector("[data-feedback]");
    const value = currentValue();
    if (value === target) {
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = "¡Número construido!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 650);
    } else if (value > target) {
      rounds++;
      lives--;
      renderLives();
      feedback.textContent = "Te has pasado del número";
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 500);
      setTimeout(() => {
        counts = { c: 0, d: 0, u: 0 };
        renderBlocks();
      }, 500);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "bloques", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧱</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} números completados o fallados</p>
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
  };
}
