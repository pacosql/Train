// "Calendario": se trabaja sobre un mes real con los offsets de día de la
// semana correctos, no sobre una lista de números — así contar días y
// localizar "el tercer martes" se parece a leer un calendario de pared.
import { randInt, buildChoices, saveScore } from "./utils.js";

const YEAR = 2025;
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
// Semana que empieza en lunes (como en España), no en domingo.
const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"];
const ORDINALES = ["primer", "segundo", "tercer", "cuarto", "quinto"];

// Índice de día de semana con lunes = 0 (Date.getDay() usa domingo = 0).
function weekdayIndex(year, month, day) {
  return (new Date(year, month, day).getDay() + 6) % 7;
}

export function mountCalendarioGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let roundIndex = 0;
  let finished = false;
  let timers = [];
  let answerDay = 0;

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
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function gridHTML(month, days, offset, interactive, marks) {
    let cells = "";
    for (let i = 0; i < offset; i++) cells += `<div class="cal-cell cal-empty"></div>`;
    for (let d = 1; d <= days; d++) {
      const mark = marks.includes(d) ? " cal-mark" : "";
      cells += interactive
        ? `<button class="cal-cell cal-day${mark}" data-day="${d}">${d}</button>`
        : `<div class="cal-cell cal-day${mark}">${d}</div>`;
    }
    const head = DIAS_CORTOS.map((d, i) =>
      `<div class="cal-head${i > 4 ? " cal-weekend" : ""}">${d}</div>`).join("");
    return `
      <div class="cal-month">${MESES[month]} ${YEAR}</div>
      <div class="cal-grid" data-grid>${head}${cells}</div>
    `;
  }

  function nextRound() {
    const month = randInt(0, 11);
    const days = new Date(YEAR, month + 1, 0).getDate();
    const offset = weekdayIndex(YEAR, month, 1);
    const tapMode = roundIndex % 2 === 0;
    roundIndex++;

    if (tapMode) {
      const wd = randInt(0, 6);
      // Listamos los días reales de ese día de la semana: así el ordinal
      // que pedimos siempre existe (nunca "quinto viernes" si hay cuatro).
      const matches = [];
      for (let d = 1; d <= days; d++) if (weekdayIndex(YEAR, month, d) === wd) matches.push(d);
      const n = randInt(1, matches.length);
      answerDay = matches[n - 1];
      body.innerHTML = `
        <div class="cal-wrap">
          <p class="prompt cal-prompt">Toca el <b>${ORDINALES[n - 1]} ${DIAS[wd]}</b></p>
          ${gridHTML(month, days, offset, true, [])}
          <div class="feedback" data-feedback></div>
        </div>
      `;
      body.querySelector("[data-grid]").addEventListener("click", (e) => {
        const btn = e.target.closest("[data-day]");
        if (btn) answerTap(Number(btn.dataset.day), btn);
      });
    } else {
      const a = randInt(1, days - 6);
      const b = randInt(a + 3, Math.min(days, a + 18));
      const correct = b - a; // días que "faltan": diferencia, sin contar el día de salida
      body.innerHTML = `
        <div class="cal-wrap">
          <p class="prompt cal-prompt">¿Cuántos días faltan del <b>${a}</b> al <b>${b}</b>?</p>
          ${gridHTML(month, days, offset, false, [a, b])}
          <div class="choices cal-choices" data-choices></div>
          <div class="feedback" data-feedback></div>
        </div>
      `;
      const choicesEl = body.querySelector("[data-choices]");
      buildChoices(correct, () => randInt(Math.max(1, correct - 4), correct + 4)).forEach((v) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.textContent = v;
        btn.addEventListener("click", () => answerChoice(v, correct, btn, choicesEl));
        choicesEl.appendChild(btn);
      });
    }
  }

  function resolve(ok, msgOk, msgBad) {
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (ok) {
      score += 10;
      renderScore();
      feedback.textContent = msgOk;
      feedback.className = "feedback ok";
      later(nextRound, 750);
    } else {
      lives--;
      renderLives();
      feedback.textContent = msgBad;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 800);
      later(nextRound, 1200);
    }
  }

  function answerTap(day, btn) {
    if (finished) return;
    const grid = body.querySelector("[data-grid]");
    grid.querySelectorAll("[data-day]").forEach((b) => { b.disabled = true; });
    const ok = day === answerDay;
    btn.classList.add(ok ? "correct" : "wrong");
    if (!ok) grid.querySelector(`[data-day="${answerDay}"]`).classList.add("correct");
    resolve(ok, "¡Ese es!", `Era el día ${answerDay}`);
  }

  function answerChoice(v, correct, btn, choicesEl) {
    if (finished) return;
    choicesEl.querySelectorAll("button").forEach((b) => { b.disabled = true; });
    const ok = v === correct;
    btn.classList.add(ok ? "correct" : "wrong");
    if (!ok) {
      choicesEl.querySelectorAll("button").forEach((b) => {
        if (Number(b.textContent) === correct) b.classList.add("correct");
      });
    }
    resolve(ok, "¡Correcto!", `Eran ${correct} días`);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "calendario", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📅</div>
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
    clearTimers();
    lives = startLives;
    score = 0;
    rounds = 0;
    roundIndex = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimers();
  };
}
