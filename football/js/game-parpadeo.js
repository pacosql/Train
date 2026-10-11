// "Las dos luces": una luz roja parpadea cada a segundos y una azul cada b.
// Acaban de parpadear a la vez: ¿en qué segundo vuelven a coincidir? Se
// toca el segundo en una línea de tiempo (casillas 1..T); al tocar se ven
// los parpadeos de cada luz (puntos de color) y se comprueba. Es el mcm.
// Niveles: pares pequeños (hasta 36) → hasta 60 → tres luces → sin línea
// de tiempo (solo teclado). 5º-1º ESO.
import { randInt, pick, saveScore } from "./utils.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm2 = (a, b) => (a * b) / gcd(a, b);
export const lcm = (arr) => arr.reduce(lcm2, 1);
const LIGHTS = ["Roja", "Azul", "Amarilla"];
const DOTS = ["🔴", "🔵", "🟡"];

// Nivel → { periods, T (largo de la línea, 0 = sin línea), answer }.
export function buildRound(level) {
  for (;;) {
    let periods, T, max;
    if (level === 0) { periods = [randInt(2, 9), randInt(2, 9)]; T = 36; max = 36; }
    else if (level === 1) { periods = [randInt(2, 12), randInt(2, 12)]; T = 60; max = 60; }
    else if (level === 2) { periods = [randInt(2, 10), randInt(2, 10), randInt(2, 10)]; T = 60; max = 60; }
    else { periods = [randInt(3, 12), randInt(3, 12)]; T = 0; max = 120; }
    if (new Set(periods).size !== periods.length) continue;
    const answer = lcm(periods);
    if (answer > max || answer < 6) continue;
    return { periods, T, answer };
  }
}

export function hintFor(r) {
  const lists = r.periods
    .map((p, i) => {
      const m = [];
      for (let k = p; k <= r.answer; k += p) m.push(k);
      return `${LIGHTS[i]}: ${m.join(", ")}…`;
    })
    .join(" · ");
  return `${lists} Coinciden en ${r.answer} = mcm(${r.periods.join(", ")})`;
}

export function mountParpadeoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let hits = 0;
  let finished = false;
  let busy = false;
  let pending = null;
  let round = null;
  let typed = "";

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body pp-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    round = buildRound(Math.min(3, Math.floor(hits / 3)));
    typed = "";
    busy = false;
    const legend = round.periods.map((p, i) => `<span class="pp-light pp-l${i}">${DOTS[i]} cada ${p} s</span>`).join("");
    const head = `
      <p class="prompt pp-prompt">¿En qué segundo vuelven a coincidir?
        <small>Las luces acaban de parpadear a la vez</small></p>
      <div class="pp-legend">${legend}</div>`;
    if (round.T === 0) {
      body.innerHTML = `${head}
        <div class="keypad-display pp-display" data-display>_ s</div>
        <div class="keypad pp-keypad" data-keypad></div>
        <div class="feedback" data-feedback></div>`;
      const pad = body.querySelector("[data-keypad]");
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
        const btn = document.createElement("button");
        btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
        btn.textContent = key;
        btn.addEventListener("click", () => pressKey(key));
        pad.appendChild(btn);
      });
      return;
    }
    const cells = Array.from(
      { length: round.T },
      (_, i) => `<button type="button" class="pp-cell" data-s="${i + 1}">${i + 1}<span class="pp-dots"></span></button>`,
    ).join("");
    body.innerHTML = `${head}
      <div class="pp-line" data-line>${cells}</div>
      <div class="feedback" data-feedback></div>`;
    body.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", () => check(Number(b.dataset.s))));
  }

  function pressKey(key) {
    if (busy || finished) return;
    if (key === "✓") return typed !== "" && check(Number(typed));
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 3) typed += key;
    body.querySelector("[data-display]").textContent = `${typed || "_"} s`;
  }

  // Al responder se enseñan los parpadeos de cada luz sobre la línea.
  function reveal(value) {
    body.querySelectorAll("[data-s]").forEach((b) => {
      const s = Number(b.dataset.s);
      b.querySelector(".pp-dots").innerHTML = round.periods
        .map((p, i) => (s % p === 0 ? `<i class="pp-dot pp-l${i}"></i>` : ""))
        .join("");
      if (s === round.answer) b.classList.add("good");
      else if (s === value) b.classList.add("bad");
      b.disabled = true;
    });
  }

  function check(value) {
    if (busy || finished) return;
    busy = true;
    rounds++;
    reveal(value);
    const feedback = body.querySelector("[data-feedback]");
    const tip = `<span class="pp-tip">💡 ${hintFor(round)}</span>`;
    if (value === round.answer) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `¡Bien! En el segundo ${round.answer} ${tip}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
      return;
    }
    lives--;
    renderLives();
    const bad = round.periods.find((p) => value % p !== 0);
    const why = bad ? `${value} no es múltiplo de ${bad}` : `ahí también coinciden, pero ya lo habían hecho antes`;
    feedback.innerHTML = `Era el segundo ${round.answer}, no el ${value} (${why}) ${tip}`;
    feedback.className = "feedback bad";
    pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "parpadeo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🚦</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} coincidencias encontradas</p>
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
    hits = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimeout(pending);
  };
}
