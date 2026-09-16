// Motor genérico de "pregunta + 4 respuestas" que reutilizan la mayoría
// de los juegos de Math Games. Cada juego solo aporta generateQuestion().
import { saveScore } from "./utils.js";

export function mountQuizGame(container, opts) {
  const {
    id,
    title,
    emoji,
    mode, // "lives" | "timeAttack"
    lives: startLives = 3,
    timeLimit = 30,
    generateQuestion,
    client,
    onExit,
  } = opts;

  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let totalMs = 0;
  let timeLeft = timeLimit;
  let questionStart = 0;
  let answered = false;
  let finished = false;
  let timerHandle = null;
  let current = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        ${mode === "lives" ? `<span class="lives" data-lives></span>` : ""}
        ${mode === "timeAttack" ? `<span class="timer" data-timer></span>` : ""}
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body></div>
  `;

  const body = container.querySelector("[data-body]");
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const timerEl = container.querySelector("[data-timer]");
  const scoreEl = container.querySelector("[data-score]");

  function renderLives() {
    if (livesEl) livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }
  function renderTimer() {
    if (timerEl) timerEl.textContent = `⏱ ${timeLeft}s`;
  }

  function nextQuestion() {
    answered = false;
    current = generateQuestion();
    questionStart = performance.now();
    body.innerHTML = `
      <p class="prompt">${current.prompt}${current.sub ? `<small>${current.sub}</small>` : ""}</p>
      <div class="choices"></div>
      <div class="feedback" data-feedback></div>
    `;
    const choicesEl = body.querySelector(".choices");
    current.choices.forEach((choice, idx) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = choice;
      btn.addEventListener("click", () => answer(idx, btn, choicesEl));
      choicesEl.appendChild(btn);
    });
  }

  function answer(idx, btn, choicesEl) {
    if (answered) return;
    answered = true;
    const ms = Math.round(performance.now() - questionStart);
    totalMs += ms;
    rounds++;
    const correct = idx === current.correctIndex;
    const feedback = body.querySelector("[data-feedback]");
    [...choicesEl.children].forEach((c, i) => {
      c.disabled = true;
      if (i === current.correctIndex) c.classList.add("correct");
      else if (i === idx) c.classList.add("wrong");
    });
    if (correct) {
      score += 10;
      feedback.textContent = `¡Bien! (${ms} ms)`;
      feedback.className = "feedback ok";
      renderScore();
    } else {
      feedback.textContent = "No era esa…";
      feedback.className = "feedback bad";
      if (mode === "lives") {
        lives--;
        renderLives();
      }
    }
    setTimeout(() => {
      if (finished) return;
      if (mode === "lives" && lives <= 0) return finish(false);
      if (mode === "timeAttack" && timeLeft <= 0) return finish(false);
      nextQuestion();
    }, 650);
  }

  function tickTimer() {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) finish(false);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (timerHandle) clearInterval(timerHandle);
    if (userExited) {
      onExit();
      return;
    }
    const avgMs = rounds ? Math.round(totalMs / rounds) : 0;
    saveScore(client, id, { score, rounds, avgMs });
    body.innerHTML = `
      <div class="end-card">
        <div>${emoji}</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} preguntas · ${avgMs} ms de media por respuesta</p>
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
    lives = startLives;
    score = 0;
    rounds = 0;
    totalMs = 0;
    timeLeft = timeLimit;
    finished = false;
    renderLives();
    renderScore();
    renderTimer();
    if (mode === "timeAttack") {
      if (timerHandle) clearInterval(timerHandle);
      timerHandle = setInterval(tickTimer, 1000);
    }
    nextQuestion();
  }

  start();

  return function cleanup() {
    if (timerHandle) clearInterval(timerHandle);
  };
}
