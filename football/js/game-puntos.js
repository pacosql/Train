// "Une los puntos": toca los números en orden (conteo de 1 en 1, de 2 en
// 2, de 5 en 5…) y traza el camino. Mecánica de secuencia espacial.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const CELLS = [
  [12, 15], [30, 12], [50, 10], [70, 14], [88, 20],
  [18, 45], [45, 40], [68, 44], [85, 50],
  [15, 75], [38, 80], [60, 78], [82, 82],
];

function buildRound() {
  const step = pick([1, 2, 3, 5, 10]);
  // Antes el conteo salteado (step > 1) siempre arrancaba justo en el
  // propio "step" (2,2,2…/10,10,10…) — nada de variedad entre partidas.
  // Arranca en un múltiplo aleatorio pequeño en su lugar.
  const start = step === 1 ? randInt(1, 5) : step * randInt(1, step >= 10 ? 2 : 3);
  const count = 8;
  const values = Array.from({ length: count }, (_, i) => start + i * step);
  const cells = shuffle(CELLS).slice(0, count);
  return { values, points: values.map((v, i) => ({ v, x: cells[i][0], y: cells[i][1] })) };
}

export function mountPuntosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let nextIdx = 0;
  let pathPts = [];

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body style="padding:0;"></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const bodyEl = container.querySelector("[data-body]");

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    round = buildRound();
    nextIdx = 0;
    pathPts = [];
    bodyEl.innerHTML = `
      <p class="balloon-question" style="position:static; margin:14px 0 4px;">Toca en orden: empieza por ${round.values[0]} y suma de ${round.values[1] - round.values[0]} en ${round.values[1] - round.values[0]}</p>
      <div class="dots-field" data-field>
        <svg class="dots-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline data-poly points="" /></svg>
      </div>
      <div class="feedback" data-feedback></div>
    `;
    const field = bodyEl.querySelector("[data-field]");
    round.points.forEach((p, idx) => {
      const dot = document.createElement("button");
      dot.className = "dot-point";
      dot.style.left = `${p.x}%`;
      dot.style.top = `${p.y}%`;
      dot.textContent = p.v;
      dot.addEventListener("click", () => tapDot(idx, dot));
      field.appendChild(dot);
    });
  }

  function tapDot(idx, dot) {
    if (finished || dot.classList.contains("used")) return;
    rounds++;
    const feedback = bodyEl.querySelector("[data-feedback]");
    if (round.points[idx].v === round.values[nextIdx]) {
      dot.classList.add("used");
      pathPts.push(`${round.points[idx].x},${round.points[idx].y}`);
      bodyEl.querySelector("[data-poly]").setAttribute("points", pathPts.join(" "));
      nextIdx++;
      if (nextIdx >= round.values.length) {
        score += 10;
        renderScore();
        feedback.textContent = "¡Camino completo!";
        feedback.className = "feedback ok";
        setTimeout(nextRound, 700);
      }
    } else {
      lives--;
      renderLives();
      dot.classList.add("wrong");
      setTimeout(() => dot.classList.remove("wrong"), 350);
      feedback.textContent = `Toca el ${round.values[nextIdx]} primero`;
      feedback.className = "feedback bad";
      if (lives <= 0) setTimeout(() => finish(false), 400);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "puntos", { score, rounds });
    bodyEl.innerHTML = `
      <div class="end-card">
        <div>✏️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} toques</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>
    `;
    bodyEl.querySelector("[data-retry]").addEventListener("click", start);
    bodyEl.querySelector("[data-menu]").addEventListener("click", onExit);
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
