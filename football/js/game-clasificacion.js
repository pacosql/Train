// "La clasificación": una racha de resultados de un equipo (victoria,
// empate, derrota) a lo largo de varios partidos, siguiendo el sistema
// de puntos habitual (V=3, E=1, D=0). El jugador debe calcular el total
// de puntos acumulados en la racha.
import { randInt, pick, saveScore } from "./utils.js";

const RESULT_ICON = { V: "✅", E: "🟨", D: "❌" };
const RESULT_WORD = { V: "victoria", E: "empate", D: "derrota" };
const RESULT_POINTS = { V: 3, E: 1, D: 0 };

const MAX_DIGITS = 2; // total máximo posible: 8 victorias * 3 = 24

export function generateClasificacionRound() {
  const numMatches = randInt(5, 8);
  const results = [];
  for (let i = 0; i < numMatches; i++) {
    results.push(pick(["V", "E", "D"]));
  }
  let points = 0;
  for (const r of results) points += RESULT_POINTS[r];
  return { results, points };
}

export function mountClasificacionGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let typed = "";
  let locked = false;
  const timers = [];

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

  function later(fn, ms) {
    timers.push(setTimeout(() => { if (!finished) fn(); }, ms));
  }

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function resultsHtml() {
    return round.results
      .map((r) => `<span class="cls-result-icon" title="${RESULT_WORD[r]}">${RESULT_ICON[r]}</span>`)
      .join("");
  }

  function nextRound() {
    round = generateClasificacionRound();
    typed = "";
    locked = false;

    body.innerHTML = `
      <p class="prompt">Este es el resultado de los últimos ${round.results.length} partidos de tu equipo:</p>
      <div class="cls-results" data-results>${resultsHtml()}</div>
      <p class="cls-rule">Victoria = 3 puntos · Empate = 1 punto · Derrota = 0 puntos</p>
      <p class="prompt">¿Cuántos puntos suma en total?</p>
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
    `;

    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key";
      btn.type = "button";
      btn.textContent = key;
      if (key === "⌫") {
        btn.setAttribute("data-backspace", "");
        btn.addEventListener("click", () => pressBackspace());
      } else if (key === "✓") {
        btn.setAttribute("data-submit", "");
        btn.addEventListener("click", () => submit());
      } else {
        btn.setAttribute("data-digit", key);
        btn.addEventListener("click", () => pressDigit(key));
      }
      pad.appendChild(btn);
    });

    renderDisplay();
  }

  function renderDisplay() {
    body.querySelector("[data-display]").textContent = typed || " ";
  }

  function pressDigit(d) {
    if (finished || locked) return;
    if (typed.length >= MAX_DIGITS) return;
    if (typed === "0") typed = d;
    else typed += d;
    renderDisplay();
  }

  function pressBackspace() {
    if (finished || locked) return;
    typed = typed.slice(0, -1);
    renderDisplay();
  }

  function explanation() {
    const wins = round.results.filter((r) => r === "V").length;
    const draws = round.results.filter((r) => r === "E").length;
    const losses = round.results.filter((r) => r === "D").length;
    const winPts = wins * 3;
    const drawPts = draws * 1;
    const lossPts = losses * 0;
    return (
      `${wins} victoria${wins === 1 ? "" : "s"} × 3 = ${winPts}, ` +
      `${draws} empate${draws === 1 ? "" : "s"} × 1 = ${drawPts}, ` +
      `${losses} derrota${losses === 1 ? "" : "s"} × 0 = ${lossPts}. ` +
      `Total: ${winPts} + ${drawPts} + ${lossPts} = ${round.points} puntos.`
    );
  }

  function submit() {
    if (finished || locked || typed === "") return;
    const guess = Number(typed);
    locked = true;
    const feedback = body.querySelector("[data-feedback]");

    if (guess === round.points) {
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${explanation()}`;
      feedback.className = "feedback ok";
      later(nextRound, 1800);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `No es correcto. ${explanation()}`;
      feedback.className = "feedback bad";
      if (lives <= 0) {
        later(() => finish(false), 1800);
      } else {
        later(nextRound, 2600);
      }
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "clasificacion", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚽</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} clasificaciones calculadas</p>
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
    timers.forEach(clearTimeout);
  };
}
