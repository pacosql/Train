// "Teclado numérico": escribe la respuesta con un teclado en pantalla en
// vez de elegir entre opciones — pone a prueba el cálculo, no el
// reconocimiento visual de la respuesta correcta.
import { randInt, pick, saveScore } from "./utils.js";

export function mountTecladoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let correct = 0;
  let typed = "";
  let displayEl;

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
    const op = pick(["+", "-", "×"]);
    let a, b;
    if (op === "+") { a = randInt(4, 70); b = randInt(4, 70); return { text: `${a} + ${b}`, correct: a + b }; }
    if (op === "-") { a = randInt(20, 90); b = randInt(4, a); return { text: `${a} - ${b}`, correct: a - b }; }
    a = randInt(2, 12); b = randInt(2, 12);
    return { text: `${a} × ${b}`, correct: a * b };
  }

  function nextRound() {
    const expr = buildExpression();
    correct = expr.correct;
    typed = "";
    body.innerHTML = `
      <p class="prompt">${expr.text} = ?</p>
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
    `;
    displayEl = body.querySelector("[data-display]");
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key";
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
  }

  function pressKey(key) {
    if (finished) return;
    if (key === "⌫") {
      typed = typed.slice(0, -1);
    } else if (key === "✓") {
      return submit();
    } else if (typed.length < 6) {
      typed += key;
    }
    displayEl.textContent = typed || " ";
  }

  function submit() {
    if (finished || typed === "") return;
    rounds++;
    const value = Number(typed);
    const feedback = body.querySelector("[data-feedback]");
    if (value === correct) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Correcto!";
      feedback.className = "feedback ok";
      setTimeout(nextRound, 600);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era ${correct}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return setTimeout(() => finish(false), 700);
      setTimeout(nextRound, 900);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    if (userExited) return onExit();
    saveScore(client, "teclado", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⌨️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} respuestas escritas</p>
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
