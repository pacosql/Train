// "Área y perímetro": toca las celdas de una cuadrícula hasta cubrir el
// área objetivo (cuenta de cuadrados), o toca el número correcto de
// lados del contorno para el perímetro. Alterna entre ambos modos.
import { randInt, pick, saveScore } from "./utils.js";

export function mountAreaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let mode = "area"; // "area" | "perimetro"
  let w = 0, h = 0;
  let target = 0;
  let filledCount = 0;

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

  function nextRound() {
    mode = pick(["area", "area", "perimetro"]);
    w = randInt(3, 6);
    h = randInt(3, 5);
    filledCount = 0;
    if (mode === "area") {
      target = w * h;
      body.innerHTML = `
        <p class="prompt">Toca <b>${target}</b> cuadrados de la cuadrícula (el área)<small>${filledCount}/${target}</small></p>
        <div class="coord-grid" data-grid></div>
        <div class="feedback" data-feedback></div>
      `;
    } else {
      target = 2 * (w + h);
      body.innerHTML = `
        <p class="prompt">Este rectángulo mide ${w} × ${h}<small>¿Cuál es su perímetro?</small></p>
        <div class="choices" data-choices></div>
        <div class="feedback" data-feedback></div>
      `;
    }
    const grid = body.querySelector("[data-grid]");
    if (grid) {
      grid.style.gridTemplateColumns = `repeat(${w}, 1fr)`;
      for (let i = 0; i < w * h; i++) {
        const cell = document.createElement("button");
        cell.className = "coord-cell area-cell";
        cell.addEventListener("click", () => tapCell(cell));
        grid.appendChild(cell);
      }
    }
    const choicesEl = body.querySelector("[data-choices]");
    if (choicesEl) {
      const options = new Set([target]);
      while (options.size < 4) options.add(Math.max(2, target + [-4, -2, 2, 4, 6][randInt(0, 4)]));
      [...options]
        .sort(() => Math.random() - 0.5)
        .forEach((val) => {
          const btn = document.createElement("button");
          btn.className = "choice-btn";
          btn.textContent = val;
          btn.addEventListener("click", () => answerPerimeter(val, btn));
          choicesEl.appendChild(btn);
        });
    }
  }

  function tapCell(el) {
    if (finished || el.classList.contains("filled")) return;
    el.classList.add("filled");
    filledCount++;
    const prompt = body.querySelector(".prompt small");
    if (prompt) prompt.textContent = `${filledCount}/${target}`;
    if (filledCount === target) {
      rounds++;
      score += 10;
      renderScore();
      const feedback = body.querySelector("[data-feedback]");
      feedback.textContent = "¡Área completa!";
      feedback.className = "feedback ok";
      body.querySelectorAll(".area-cell").forEach((c) => (c.disabled = true));
      setTimeout(nextRound, 600);
    } else if (filledCount > target) {
      // no debería pasar (se desactivan al llegar al target), guarda por si acaso
      rounds++;
      lives--;
      renderLives();
      if (lives <= 0) finish(false);
    }
  }

  function answerPerimeter(val, btn) {
    if (finished) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    [...body.querySelectorAll(".choice-btn")].forEach((c) => (c.disabled = true));
    if (val === target) {
      btn.classList.add("correct");
      score += 10;
      renderScore();
      feedback.textContent = "¡Correcto!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 650);
    } else {
      btn.classList.add("wrong");
      lives--;
      renderLives();
      feedback.textContent = `Era ${target}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 650);
      setTimeout(nextRound, 950);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "area", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔲</div>
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
