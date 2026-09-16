// Motor genérico de preguntas que reutilizan la mayoría de los juegos de
// Math Games. Cada juego solo aporta generateQuestion().
//
// v2: además de elegir entre opciones, un juego puede pedir `input:
// "keypad"` y entonces la respuesta se escribe con un teclado numérico
// (recordar el resultado, no reconocerlo entre cuatro botones). También
// lleva racha con bonus y contador de rondas, para que el progreso
// dentro de una partida se note y no sean preguntas sueltas sin hilo.
import { saveScore } from "./utils.js";

export function mountQuizGame(container, opts) {
  const {
    id,
    title,
    emoji,
    mode, // "lives" | "timeAttack"
    lives: startLives = 3,
    timeLimit = 30,
    input = "choices", // "choices" | "keypad"
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
  let typed = "";

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
    // La racha solo aparece cuando hay algo que presumir, para no meter
    // ruido en la barra desde la primera pregunta.
    streakEl.textContent = streak >= 2 ? `🔥 ${streak}` : "";
  }
  function renderTimer() {
    if (timerEl) timerEl.textContent = `⏱ ${timeLeft}s`;
  }

  function nextQuestion() {
    answered = false;
    typed = "";
    current = generateQuestion();
    questionStart = performance.now();
    body.innerHTML = `
      <p class="prompt">${current.prompt}${current.sub ? `<small>${current.sub}</small>` : ""}</p>
      ${input === "keypad"
        ? `<div class="keypad-display" data-display>&nbsp;</div><div class="keypad" data-keypad></div>`
        : `<div class="choices"></div>`}
      <div class="feedback" data-feedback></div>
    `;
    if (input === "keypad") {
      const pad = body.querySelector("[data-keypad]");
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn keypad-key";
        btn.textContent = key;
        btn.addEventListener("click", () => pressKey(key));
        pad.appendChild(btn);
      });
      if (current.allowNegative) {
        // Botón aparte y a lo ancho: meterlo en la rejilla de 12 la
        // descuadraría (13 teclas en 3 columnas).
        const sign = document.createElement("button");
        sign.className = "choice-btn keypad-sign";
        sign.textContent = "± cambiar signo";
        sign.addEventListener("click", () => pressKey("±"));
        body.querySelector("[data-keypad]").after(sign);
      }
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

  function pressKey(key) {
    if (finished || answered) return;
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (key === "±") typed = typed.startsWith("-") ? typed.slice(1) : `-${typed}`;
    else if (key === "✓") return submitTyped();
    else if (typed.replace("-", "").length < 6) typed += key;
    body.querySelector("[data-display]").textContent = typed || " ";
  }

  function submitTyped() {
    if (typed === "" || typed === "-") return;
    const expected = String(current.choices[current.correctIndex]);
    resolve(typed === expected, null, null, expected);
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

  function resolve(correct, btn, choicesEl, expected) {
    if (answered) return;
    answered = true;
    const ms = Math.round(performance.now() - questionStart);
    totalMs += ms;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (correct) {
      hits++;
      streak++;
      bestStreak = Math.max(bestStreak, streak);
      // Bonus de racha: +2 por cada acierto seguido a partir del tercero,
      // hasta +10, para premiar mantener el hilo sin desbalancear nada.
      const bonus = streak >= 3 ? Math.min((streak - 2) * 2, 10) : 0;
      score += 10 + bonus;
      feedback.textContent = bonus ? `¡Bien! +${10 + bonus} (racha ×${streak})` : `¡Bien! (${ms} ms)`;
      feedback.className = "feedback ok";
      renderScore();
    } else {
      streak = 0;
      feedback.textContent = expected ? `Era ${expected}` : "No era esa…";
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
