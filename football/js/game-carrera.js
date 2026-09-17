// "Carrera de cálculo": la CPU avanza sola con un reloj, así que aquí no basta
// con acertar, hay que acertar antes. Cada carrera ganada acelera a la CPU para
// que la presión suba sin cambiar las operaciones de golpe.
import { randInt, pick, buildChoices, saveScore } from "./utils.js";

const SEGMENTS = 8;

function distractor(correct) {
  const d = randInt(1, Math.max(4, Math.round(correct * 0.3) + 3));
  const v = correct + (Math.random() < 0.5 ? -d : d);
  return v < 0 ? correct + d : v;
}

function buildQuestion(level) {
  const ops = level <= 1 ? ["+", "-"] : level === 2 ? ["+", "-", "×"] : ["+", "-", "×", "÷"];
  const op = pick(ops);
  let a, b, correct;
  if (op === "+") {
    a = randInt(2, 9 + level * 4);
    b = randInt(2, 9 + level * 2);
    correct = a + b;
  } else if (op === "-") {
    // b < a siempre: resultados negativos o 0 no encajan en esta carrera.
    a = randInt(5, 12 + level * 4);
    b = randInt(1, a - 1);
    correct = a - b;
  } else if (op === "×") {
    a = randInt(2, level >= 4 ? 12 : 9);
    b = randInt(2, 9);
    correct = a * b;
  } else {
    // Se construye desde el cociente: división exacta garantizada.
    b = randInt(2, 9);
    correct = randInt(2, 9);
    a = b * correct;
  }
  return { text: `${a} ${op} ${b} = ?`, correct };
}

export function mountCarreraGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let race = 1;
  let me = 0;
  let cpu = 0;
  let cpuTimer = null;
  let timer = null;
  let raceOver = false;

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

  function clearTimers() {
    if (cpuTimer) clearInterval(cpuTimer);
    if (timer) clearTimeout(timer);
    cpuTimer = timer = null;
  }

  function later(fn, ms) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (!finished) fn();
    }, ms);
  }

  function renderTrack() {
    const marks = Array.from({ length: SEGMENTS + 1 }, (_, i) => `<i style="left:${(i / SEGMENTS) * 100}%"></i>`).join("");
    return `
      <div class="carrera-track">
        <div class="carrera-lane">
          ${marks}
          <div class="carrera-token me" data-me>🏃</div>
        </div>
        <div class="carrera-lane">
          ${marks}
          <div class="carrera-token cpu" data-cpu>🤖</div>
        </div>
        <div class="carrera-goal">🏁</div>
      </div>
    `;
  }

  function placeTokens() {
    const meEl = body.querySelector("[data-me]");
    const cpuEl = body.querySelector("[data-cpu]");
    if (meEl) meEl.style.left = `${(me / SEGMENTS) * 100}%`;
    if (cpuEl) cpuEl.style.left = `${(cpu / SEGMENTS) * 100}%`;
  }

  function newRace() {
    me = 0;
    cpu = 0;
    raceOver = false;
    body.innerHTML = `
      <p class="carrera-head">Carrera ${race} · ¡gana a la máquina!</p>
      ${renderTrack()}
      <p class="prompt carrera-q" data-q></p>
      <div class="choices" data-choices></div>
      <div class="feedback" data-feedback></div>
    `;
    placeTokens();
    if (cpuTimer) clearInterval(cpuTimer);
    const step = Math.max(1100, 2700 - race * 180);
    cpuTimer = setInterval(cpuMove, step);
    nextQuestion();
  }

  function cpuMove() {
    if (finished || raceOver) return;
    cpu++;
    placeTokens();
    if (cpu >= SEGMENTS) loseRace();
  }

  function nextQuestion() {
    if (finished || raceOver) return;
    const q = buildQuestion(race);
    const correct = q.correct;
    // Sin este bucle una tanda de distractores repetidos dejaría menos de 4.
    let choices;
    do {
      choices = buildChoices(correct, () => distractor(correct), 4);
    } while (choices.length < 4);

    body.querySelector("[data-q]").textContent = q.text;
    const choicesEl = body.querySelector("[data-choices]");
    choicesEl.innerHTML = "";
    choices.forEach((v) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = v;
      btn.addEventListener("click", () => answer(v === correct, btn));
      choicesEl.appendChild(btn);
    });
  }

  function answer(ok, btn) {
    if (finished || raceOver || btn.disabled) return;
    const feedback = body.querySelector("[data-feedback]");
    if (ok) {
      me++;
      placeTokens();
      feedback.textContent = "¡Avanzas!";
      feedback.className = "feedback ok";
      if (me >= SEGMENTS) return winRace();
      nextQuestion();
    } else {
      btn.classList.add("wrong");
      btn.disabled = true;
      feedback.textContent = "No… la máquina se acerca";
      feedback.className = "feedback bad";
    }
  }

  function winRace() {
    raceOver = true;
    if (cpuTimer) clearInterval(cpuTimer);
    cpuTimer = null;
    rounds++;
    score += 10;
    renderScore();
    race++;
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = "🏆 ¡Ganada! La máquina acelera";
    feedback.className = "feedback ok";
    body.querySelectorAll(".choice-btn").forEach((b) => (b.disabled = true));
    later(newRace, 1100);
  }

  function loseRace() {
    raceOver = true;
    if (cpuTimer) clearInterval(cpuTimer);
    cpuTimer = null;
    lives--;
    renderLives();
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = "La máquina ha llegado antes…";
    feedback.className = "feedback bad";
    body.querySelectorAll(".choice-btn").forEach((b) => (b.disabled = true));
    if (lives <= 0) return later(() => finish(false), 900);
    later(newRace, 1100);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    raceOver = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "carrera", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🏁</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} carreras ganadas</p>
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
    clearTimers();
    lives = startLives;
    score = 0;
    rounds = 0;
    race = 1;
    finished = false;
    renderLives();
    renderScore();
    newRace();
  }

  start();
  return () => {
    finished = true;
    raceOver = true;
    clearTimers();
  };
}
