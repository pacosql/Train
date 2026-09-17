// "Criba de primos": la criba de Eratóstenes convertida en gesto. El
// juego pide tachar los múltiplos de 2, luego los de 3, los de 5 y los
// de 7 — y cuando no queda ninguno por tachar, lo que sobra en la
// rejilla SON los primos. Aquí el algoritmo es la mecánica: no se
// pregunta "¿es 39 primo?", se ejecuta la criba con el dedo.
import { clamp, saveScore } from "./utils.js";

// Hasta dónde llega la rejilla según la racha. El tope es 50: son 34
// números compuestos, o sea 34 toques, que es lo que cabe en un minuto
// de juego (con 60 se irían a 42 y la ronda se hace larga).
const LIMITS = [24, 32, 40, 50];
const BASES = [2, 3, 5, 7];

export function levelForStreak(streak) {
  return clamp(Math.floor(streak / 2), 0, LIMITS.length - 1);
}

// Prepara la criba completa: para cada base, los números que hay que
// tachar en esa fase (los múltiplos que aún siguen en pie) y, al final,
// los primos que quedan.
export function makeCribaRound(streak) {
  const level = levelForStreak(streak);
  const limit = LIMITS[level];
  const crossed = new Set();
  const phases = [];
  for (const p of BASES) {
    if (p * p > limit) break;
    const targets = [];
    for (let n = p * 2; n <= limit; n += p) if (!crossed.has(n)) targets.push(n);
    targets.forEach((n) => crossed.add(n));
    phases.push({ base: p, targets });
  }
  const primes = [];
  for (let n = 2; n <= limit; n++) if (!crossed.has(n)) primes.push(n);
  return { level, limit, phases, primes };
}

export function mountCribaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let round = null;
  let phase = 0;
  let crossed = new Set(); // números ya tachados en esta ronda
  let left = new Set(); // los que faltan por tachar en la fase actual
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

  function nextRound() {
    round = makeCribaRound(streak);
    phase = 0;
    crossed = new Set();
    left = new Set(round.phases[0].targets);
    locked = false;

    body.innerHTML = `
      <p class="prompt" data-prompt></p>
      <div class="cb-steps" data-steps></div>
      <div class="cb-grid" data-grid></div>
      <div class="feedback" data-feedback></div>
    `;
    buildGrid();
    renderPrompt();
    renderSteps();
  }

  function say(text, kind) {
    const el = body.querySelector("[data-feedback]");
    if (!el) return;
    el.innerHTML = text;
    el.className = `feedback${kind ? ` ${kind}` : ""}`;
  }

  function buildGrid() {
    const grid = body.querySelector("[data-grid]");
    grid.innerHTML = "";
    for (let n = 2; n <= round.limit; n++) {
      const btn = document.createElement("button");
      btn.className = "cb-cell";
      btn.type = "button";
      btn.textContent = n;
      btn.dataset.n = n;
      btn.addEventListener("click", () => tap(n, btn));
      grid.appendChild(btn);
    }
    paintGrid();
  }

  function paintGrid() {
    const base = round.phases[phase] ? round.phases[phase].base : 0;
    body.querySelectorAll(".cb-cell").forEach((btn) => {
      const n = Number(btn.dataset.n);
      btn.classList.toggle("crossed", crossed.has(n));
      btn.classList.toggle("base", n === base);
      btn.disabled = locked || crossed.has(n);
    });
  }

  function renderPrompt() {
    const p = round.phases[phase];
    body.querySelector("[data-prompt]").innerHTML =
      `Tacha los múltiplos de <b>${p.base}</b><small>Faltan ${left.size} — el ${p.base} se queda</small>`;
  }

  function renderSteps() {
    body.querySelector("[data-steps]").innerHTML = round.phases
      .map((p, i) => `<span class="cb-step${i === phase ? " on" : ""}${i < phase ? " done" : ""}">${p.base}</span>`)
      .join("");
  }

  function tap(n, btn) {
    if (finished || locked) return;
    const p = round.phases[phase];

    if (n === p.base) {
      // El trampantojo clásico: la base no se tacha, es primo.
      say(`El ${p.base} se queda: es primo. Tacha solo sus múltiplos`, "bad");
      btn.classList.add("shake");
      later(() => btn.classList.remove("shake"), 500);
      return;
    }

    if (!left.has(n)) {
      // Al fallar se ve POR QUÉ: la división con su resto.
      const q = Math.floor(n / p.base);
      const r = n % p.base;
      lives--;
      streak = 0;
      renderLives();
      say(`${n} no es múltiplo de ${p.base}: ${n} = ${p.base} × ${q} + ${r}`, "bad");
      btn.classList.add("wrong");
      later(() => btn.classList.remove("wrong"), 700);
      if (lives <= 0) {
        locked = true;
        rounds++;
        paintGrid();
        return later(() => finish(false), 1400);
      }
      return;
    }

    crossed.add(n);
    left.delete(n);
    paintGrid();
    if (left.size > 0) {
      renderPrompt();
      say(`${n} = ${p.base} × ${n / p.base}`, "ok");
      return;
    }

    // Fase terminada: o pasamos a la siguiente base o ya están los primos.
    phase++;
    if (phase < round.phases.length) {
      left = new Set(round.phases[phase].targets);
      renderPrompt();
      renderSteps();
      paintGrid();
      say(`¡Fuera todos los múltiplos de ${p.base}! Ahora los de ${round.phases[phase].base}`, "ok");
      return;
    }
    win();
  }

  function win() {
    locked = true;
    rounds++;
    streak++;
    score += 10;
    renderScore();
    phase = round.phases.length - 1;
    paintGrid();
    body.querySelectorAll(".cb-cell").forEach((btn) => {
      btn.classList.remove("wrong", "shake"); // que ningún rojo tape los primos
      if (!crossed.has(Number(btn.dataset.n))) btn.classList.add("prime");
    });
    body.querySelector("[data-prompt]").innerHTML =
      `Lo que queda son los primos<small>Hasta ${round.limit} no hay más</small>`;
    say(`Primos hasta ${round.limit}: <b>${round.primes.join(", ")}</b>`, "ok");
    later(nextRound, 3000);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "criba", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🕸️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} cribas jugadas</p>
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
