// "Escalera de rachas": el acierto sube un peldaño y el fallo baja uno, así que
// lo que se premia es la racha seguida, no el acierto suelto. La escalera con
// el escalador es el marcador real; el ⭐ solo cuenta escaleras terminadas.
import { randInt, pick, buildChoices, clamp, saveScore } from "./utils.js";

const RUNGS = 8;
const STEP = 26; // px entre peldaños, también usado para colocar el escalador
const BASE = 12;

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
    a = randInt(2, 8 + level * 5);
    b = randInt(2, 8 + level * 3);
    correct = a + b;
  } else if (op === "-") {
    // Siempre a > b para que el resultado sea >= 1 y nunca salga un 0 soso.
    a = randInt(5, 10 + level * 5);
    b = randInt(1, a - 1);
    correct = a - b;
  } else if (op === "×") {
    a = randInt(2, level >= 4 ? 12 : 9);
    b = randInt(2, 9);
    correct = a * b;
  } else {
    // División construida al revés: siempre exacta y con divisor > 1.
    b = randInt(2, 9);
    correct = randInt(2, 9);
    a = b * correct;
  }
  return { text: `${a} ${op} ${b}`, correct };
}

export function mountEscaleraGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let level = 1;
  let pos = 0;
  let timer = null;
  let current = null;

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

  function later(fn, ms) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (!finished) fn();
    }, ms);
  }

  function renderLadder() {
    const rungs = Array.from({ length: RUNGS }, (_, i) => {
      const n = i + 1;
      return `<div class="esc-rung${pos >= n ? " done" : ""}" style="bottom:${BASE + n * STEP}px"><span>${n}</span></div>`;
    }).join("");
    return `
      <div class="esc-ladder" style="height:${BASE + RUNGS * STEP + 34}px">
        ${rungs}
        <div class="esc-climber" data-climber style="bottom:${BASE + pos * STEP}px">🧗</div>
      </div>
    `;
  }

  function movePos(next) {
    pos = clamp(next, 0, RUNGS);
    const climber = body.querySelector("[data-climber]");
    if (climber) climber.style.bottom = `${BASE + pos * STEP}px`;
    body.querySelectorAll(".esc-rung").forEach((el, i) => {
      el.classList.toggle("done", pos >= i + 1);
    });
  }

  function newLadder() {
    pos = 0;
    nextRound();
  }

  function nextRound() {
    current = buildQuestion(level);
    const correct = current.correct;
    // Bucle guardado: exigimos 4 opciones realmente distintas antes de pintar.
    let choices;
    do {
      choices = buildChoices(correct, () => distractor(correct), 4);
    } while (choices.length < 4);

    body.innerHTML = `
      <div class="esc-wrap">
        ${renderLadder()}
        <div class="esc-side">
          <p class="prompt esc-q">${current.text} = ?</p>
          <div class="choices" data-choices></div>
          <div class="feedback" data-feedback>Escalera ${level} · peldaño ${pos}/${RUNGS}</div>
        </div>
      </div>
    `;
    const choicesEl = body.querySelector("[data-choices]");
    choices.forEach((v) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = v;
      btn.addEventListener("click", () => answer(v === correct, btn));
      choicesEl.appendChild(btn);
    });
  }

  function answer(ok, btn) {
    if (finished || btn.disabled) return;
    const feedback = body.querySelector("[data-feedback]");
    body.querySelectorAll(".choice-btn").forEach((b) => (b.disabled = true));
    if (ok) {
      btn.classList.add("correct");
      movePos(pos + 1);
      if (pos >= RUNGS) {
        rounds++;
        score += 10;
        renderScore();
        level++;
        feedback.textContent = "¡Cima! Escalera nueva";
        feedback.className = "feedback ok";
        return later(newLadder, 900);
      }
      feedback.textContent = `¡Arriba! Peldaño ${pos}/${RUNGS}`;
      feedback.className = "feedback ok";
      later(nextRound, 600);
    } else {
      btn.classList.add("wrong");
      lives--;
      renderLives();
      movePos(pos - 1);
      feedback.textContent = `Fallo — bajas al peldaño ${pos}`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 700);
      later(nextRound, 800);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    if (timer) clearTimeout(timer);
    if (userExited) return onExit();
    saveScore(client, "escalera", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🪜</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} escaleras completas</p>
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
    if (timer) clearTimeout(timer);
    lives = startLives;
    score = 0;
    rounds = 0;
    level = 1;
    pos = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    if (timer) clearTimeout(timer);
  };
}
