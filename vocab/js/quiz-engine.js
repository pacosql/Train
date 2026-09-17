// Motor genérico de preguntas que reutilizan la mayoría de los juegos de
// Vocabulary. Cada juego solo aporta generateQuestion(). Basado en
// football/js/quiz-engine.js, con un modo de entrada nuevo: "text" (para
// escribir la palabra en inglés/español con el teclado del dispositivo,
// en vez de reconocerla entre 4 opciones).
import { saveScore, normalizeAnswer } from "./utils.js";

export function mountQuizGame(container, opts) {
  const {
    id,
    title,
    emoji,
    mode, // "lives" | "timeAttack"
    lives: startLives = 3,
    timeLimit = 30,
    input = "choices", // "choices" | "text"
    inputPlaceholder = "Escribe aquí…",
    generateQuestion,
    client,
    onExit,
  } = opts;

  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let hits = 0;
  let streak = 0;
  let bestStreak = 0;
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
        <span class="streak" data-streak></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body></div>
  `;

  const body = container.querySelector("[data-body]");
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const timerEl = container.querySelector("[data-timer]");
  const streakEl = container.querySelector("[data-streak]");
  const scoreEl = container.querySelector("[data-score]");

  function renderLives() {
    if (livesEl) livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }
  function renderStreak() {
    streakEl.textContent = streak >= 2 ? `🔥 ${streak}` : "";
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
      ${
        input === "text"
          ? `<form class="text-answer" data-text-form autocomplete="off">
               <input type="text" class="text-input" data-text-input placeholder="${inputPlaceholder}" autocapitalize="off" autocorrect="off" spellcheck="false" />
               <button type="submit" class="primary text-submit">Comprobar</button>
             </form>`
          : `<div class="choices"></div>`
      }
      <div class="feedback" data-feedback></div>
    `;
    if (input === "text") {
      const form = body.querySelector("[data-text-form]");
      const inputEl = body.querySelector("[data-text-input]");
      inputEl.focus();
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (answered || !inputEl.value.trim()) return;
        const correct = current.accepts
          ? current.accepts.some((a) => normalizeAnswer(a) === normalizeAnswer(inputEl.value))
          : normalizeAnswer(inputEl.value) === normalizeAnswer(current.answer);
        resolve(correct, null, null, current.answer, inputEl);
      });
      return;
    }
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
    [...choicesEl.children].forEach((c, i) => {
      c.disabled = true;
      if (i === current.correctIndex) c.classList.add("correct");
      else if (i === idx) c.classList.add("wrong");
    });
    resolve(idx === current.correctIndex, btn, choicesEl, null);
  }

  function resolve(correct, btn, choicesEl, expected, inputEl) {
    if (answered) return;
    answered = true;
    if (inputEl) inputEl.disabled = true;
    const ms = Math.round(performance.now() - questionStart);
    totalMs += ms;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (correct) {
      hits++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);
      const bonus = streak >= 3 ? Math.min((streak - 2) * 2, 10) : 0;
      score += 10 + bonus;
      feedback.textContent = bonus ? `¡Bien! +${10 + bonus} (racha ×${streak})` : `¡Bien! (${ms} ms)`;
      feedback.className = "feedback ok";
      renderScore();
    } else {
      streak = 0;
      feedback.textContent = expected ? `Era "${expected}"` : "No era esa…";
      feedback.className = "feedback bad";
      if (mode === "lives") {
        lives--;
        renderLives();
      }
    }
    renderStreak();
    setTimeout(() => {
      if (finished) return;
      if (mode === "lives" && lives <= 0) return finish(false);
      if (mode === "timeAttack" && timeLeft <= 0) return finish(false);
      nextQuestion();
    }, 850);
  }

  function tickTimer() {
    timeLeft--;
    renderTimer();
    if (timeLeft <= 0) finish(false);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
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
        <p>${hits}/${rounds} aciertos · mejor racha ×${bestStreak} · ${avgMs} ms de media</p>
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
    hits = 0;
    streak = 0;
    bestStreak = 0;
    totalMs = 0;
    timeLeft = timeLimit;
    finished = false;
    renderLives();
    renderScore();
    renderStreak();
    renderTimer();
    if (mode === "timeAttack") {
      if (timerHandle) clearInterval(timerHandle);
      timerHandle = setInterval(tickTimer, 1000);
    }
    nextQuestion();
  }

  start();

  return function cleanup() {
    finished = true;
    if (timerHandle) clearInterval(timerHandle);
  };
}
