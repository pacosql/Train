// "La lupa decimal": una recta numérica con zoom. Tocas el trozo de recta
// donde cae el número y la lupa amplía ese trozo: de los enteros a las
// décimas y de las décimas a las centésimas.
// El gesto de ampliar ES el valor posicional: cada zoom parte el trozo
// anterior en 10, que es exactamente lo que significa la cifra siguiente.
import { randInt, saveScore } from "./utils.js";

// Número de 2 decimales. La centésima NUNCA es 0: si lo fuera, el número
// caería justo sobre una marca de décimas y habría DOS intervalos válidos.
export function makeLupaRound(streak, lastKey) {
  let guard = 0;
  let r = null;
  while (guard < 300 && !r) {
    guard++;
    const unit = randInt(2, 8);
    const base = Math.max(1, unit - randInt(1, 4)); // recta de enteros base..base+5
    const c1 = randInt(0, 9);
    const c2 = randInt(1, 9);
    if (streak < 1 && c1 === 0) continue; // los "3,07" solo cuando ya se pilló
    const key = `${unit},${c1}${c2}`;
    if (key === lastKey) continue;
    const levels = streak >= 2 ? ["units", "tenths", "hundredths"] : ["tenths", "hundredths"];
    r = { unit, base, c1, c2, cents: unit * 100 + c1 * 10 + c2, levels, key };
  }
  if (!r) {
    r = { unit: 3, base: 1, c1: 4, c2: 7, cents: 347, levels: ["tenths", "hundredths"], key: "3,47" };
  }
  return r;
}

// Todo en centésimas enteras: ninguna comparación de flotantes.
function fmt(cents) {
  const e = Math.floor(cents / 100);
  const d = cents % 100;
  return `${e},${d < 10 ? `0${d}` : d}`;
}
function fmtTenth(cents) {
  return `${Math.floor(cents / 100)},${Math.floor((cents % 100) / 10)}`;
}

export function mountLupaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let round = null;
  let levelIdx = 0;
  let lastKey = "";
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

  // Extremos (en centésimas) del trozo de recta que se ve en cada nivel.
  function bounds(level) {
    if (level === "units") return [round.base * 100, (round.base + 5) * 100];
    if (level === "tenths") return [round.unit * 100, round.unit * 100 + 100];
    const lo = round.unit * 100 + round.c1 * 10;
    return [lo, lo + 10];
  }
  function zoomTag(level) {
    if (level === "units") return "🔍 ×1 · enteros";
    if (level === "tenths") return "🔍 ×10 · décimas";
    return "🔍 ×100 · centésimas";
  }

  function nextRound() {
    round = makeLupaRound(streak, lastKey);
    lastKey = round.key;
    levelIdx = 0;
    locked = false;
    body.innerHTML = `
      <p class="prompt">Coloca <b>${fmt(round.cents)}</b><small>Toca el trozo de recta donde cae: la lupa lo amplía</small></p>
      <div class="lu-zoom" data-zoom></div>
      <div class="lu-stage" data-stage></div>
      <div class="lu-why" data-why></div>
      <div class="feedback" data-feedback></div>
    `;
    renderLevel();
  }

  function renderLevel() {
    const level = round.levels[levelIdx];
    const [lo, hi] = bounds(level);
    body.querySelector("[data-zoom]").textContent = zoomTag(level);
    const stage = body.querySelector("[data-stage]");
    if (level === "hundredths") {
      let marks = "";
      for (let j = 0; j <= 10; j++) {
        marks += `
          <button class="lu-mark" type="button" data-j="${j}" style="left:${j * 10}%">
            <span class="lu-mark-line"></span>
            <span class="lu-mark-num">${j === 10 ? "10" : j}</span>
          </button>`;
      }
      stage.innerHTML = `
        <div class="lu-frame lu-in">
          <div class="lu-rule">${marks}</div>
          <div class="lu-ends"><span>${fmt(lo)}</span><span>centésimas</span><span>${fmt(hi)}</span></div>
        </div>
      `;
      stage.querySelectorAll("[data-j]").forEach((btn) => {
        btn.addEventListener("click", () => choose(Number(btn.dataset.j)));
      });
      return;
    }
    const n = level === "units" ? 5 : 10;
    const stepCents = (hi - lo) / n;
    let regions = "";
    let ticks = "";
    for (let i = 0; i < n; i++) {
      regions += `<button class="lu-region" type="button" data-i="${i}"></button>`;
    }
    for (let i = 0; i <= n; i++) {
      const v = lo + i * stepCents;
      const label = level === "units" ? `${v / 100}` : fmtTenth(v);
      ticks += `<span class="lu-tick" style="left:${(i / n) * 100}%"><i>${label}</i></span>`;
    }
    stage.innerHTML = `
      <div class="lu-frame lu-in">
        <div class="lu-regions">${regions}</div>
        <div class="lu-axis">${ticks}</div>
      </div>
    `;
    stage.querySelectorAll("[data-i]").forEach((btn) => {
      btn.addEventListener("click", () => choose(Number(btn.dataset.i)));
    });
  }

  function correctIndex(level) {
    if (level === "units") return round.unit - round.base;
    if (level === "tenths") return round.c1;
    return round.c2;
  }

  function choose(i) {
    if (finished || locked) return;
    const level = round.levels[levelIdx];
    const good = correctIndex(level);
    if (i === good) {
      if (levelIdx < round.levels.length - 1) {
        // Acierto intermedio: la lupa amplía y se sigue.
        levelIdx++;
        renderLevel();
        return;
      }
      locked = true;
      rounds++;
      score += 10;
      streak++;
      renderScore();
      const feedback = body.querySelector("[data-feedback]");
      feedback.textContent = `¡${fmt(round.cents)} colocado!`;
      feedback.className = "feedback ok";
      markSolution(true, i);
      later(nextRound, 1000);
      return;
    }
    // Fallo: la recta se queda en este nivel y se marca dónde estaba.
    locked = true;
    rounds++;
    lives--;
    streak = 0;
    renderLives();
    markSolution(false, i);
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = why(level);
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 3200);
    later(nextRound, 3200);
  }

  function why(level) {
    const [lo, hi] = bounds(level);
    if (level === "units") {
      return `${fmt(round.cents)} está entre ${lo / 100} y ${hi / 100}: la parte entera es ${round.unit}`;
    }
    if (level === "tenths") {
      const a = round.unit * 100 + round.c1 * 10;
      return `${fmt(round.cents)} está entre ${fmtTenth(a)} y ${fmtTenth(a + 10)}: las décimas son ${round.c1}`;
    }
    return `${fmt(round.cents)} son ${round.c1} décimas y ${round.c2} centésimas`;
  }

  // Pinta el acierto/el fallo y clava el número en su sitio exacto.
  function markSolution(okChoice, chosen) {
    const level = round.levels[levelIdx];
    const [lo, hi] = bounds(level);
    const good = correctIndex(level);
    const stage = body.querySelector("[data-stage]");
    const frame = stage.querySelector(".lu-frame");
    const sel = level === "hundredths" ? "[data-j]" : "[data-i]";
    stage.querySelectorAll(sel).forEach((el, idx) => {
      if (idx === good) el.classList.add("lu-good");
      else if (idx === chosen && !okChoice) el.classList.add("lu-bad");
    });
    const pos = ((round.cents - lo) / (hi - lo)) * 100;
    const pin = document.createElement("span");
    pin.className = "lu-pin";
    pin.style.left = `${pos}%`;
    pin.innerHTML = `<i>${fmt(round.cents)}</i>`;
    frame.appendChild(pin);
    if (!okChoice) body.querySelector("[data-why]").textContent = why(level);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "lupa", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔍</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} números colocados</p>
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
    streak = 0;
    finished = false;
    lastKey = "";
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
