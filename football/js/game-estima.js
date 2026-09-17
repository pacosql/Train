// "Estima el resultado": arrastra un marcador para dar una aproximación,
// no el valor exacto — se acepta un margen de tolerancia.
import { randInt, pick, clamp, saveScore } from "./utils.js";

export function mountEstimaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let correct = 0;
  let rangeMin = 0, rangeMax = 100;
  let value = 0;
  let lineEl, markerEl, valueEl;

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

  function buildExpression() {
    const type = pick(["add", "mult"]);
    if (type === "add") {
      const a = randInt(20, 80), b = randInt(15, 70);
      return { text: `${a} + ${b}`, correct: a + b };
    }
    const a = randInt(11, 29), b = randInt(4, 12);
    return { text: `${a} × ${b}`, correct: a * b };
  }

  function nextRound() {
    const expr = buildExpression();
    correct = expr.correct;
    const margin = Math.max(15, Math.round(correct * 0.45));
    rangeMin = Math.max(0, correct - margin);
    rangeMax = correct + margin;
    value = rangeMin;
    body.innerHTML = `
      <p class="prompt">${expr.text} ≈ ?<small>No hace falta el valor exacto, solo acércate</small></p>
      <div class="number-line" data-line>
        <div class="nl-track"></div>
        <div class="nl-marker" data-marker></div>
      </div>
      <div class="nl-value" data-value></div>
      <div class="feedback" data-feedback></div>
      <button class="primary" data-confirm style="margin-top:14px;">Confirmar</button>
    `;
    lineEl = body.querySelector("[data-line]");
    markerEl = body.querySelector("[data-marker]");
    valueEl = body.querySelector("[data-value]");
    setMarker((rangeMin + rangeMax) / 2);
    body.querySelector("[data-confirm]").addEventListener("click", confirm);
    bindDrag();
  }

  function setMarker(v) {
    value = clamp(Math.round(v), rangeMin, rangeMax);
    const pct = ((value - rangeMin) / (rangeMax - rangeMin)) * 100;
    markerEl.style.left = `${pct}%`;
    valueEl.textContent = `≈ ${value}`;
  }

  function bindDrag() {
    let dragging = false;
    function toValue(clientX) {
      const rect = lineEl.getBoundingClientRect();
      const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
      return rangeMin + pct * (rangeMax - rangeMin);
    }
    lineEl.addEventListener("pointerdown", (e) => {
      dragging = true;
      setMarker(toValue(e.clientX));
      lineEl.setPointerCapture(e.pointerId);
    });
    lineEl.addEventListener("pointermove", (e) => {
      if (dragging) setMarker(toValue(e.clientX));
    });
    lineEl.addEventListener("pointerup", () => (dragging = false));
  }

  function confirm() {
    if (finished) return;
    rounds++;
    const tolerance = Math.max(8, Math.round(correct * 0.12));
    const diff = Math.abs(value - correct);
    const feedback = body.querySelector("[data-feedback]");
    if (diff <= tolerance) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Buena estimación! (exacto: ${correct})`;
      feedback.className = "feedback ok";
      setTimeout(nextRound, 750);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Un poco lejos — el resultado real era ${correct}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 750);
      setTimeout(nextRound, 1000);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "estima", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎚️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} estimaciones</p>
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
