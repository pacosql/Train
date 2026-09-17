// "Nim de palillos" (Martin Gardner / juego de patio): hay N palillos,
// cada uno quita 1, 2 o 3 y PIERDE quien se lleva el último. La máquina
// juega la estrategia óptima, así que la única forma de ganarle es
// descubrir la regla de los restos: hay que dejarle siempre una posición
// trampa — 1, 5, 9, 13… es decir múltiplo de 4 más 1 — porque desde ahí,
// quite lo que quite (1, 2 o 3), tú puedes volver a dejarle otra.
// El N inicial nunca es de esos números, así que el jugador SIEMPRE
// arranca en posición ganadora: si pierde, ha sido por su jugada.
import { randInt, clamp, saveScore } from "./utils.js";

// Rango del montón según la racha: más palillos, más jugadas que cuadrar.
const RANGES = [[7, 11], [10, 15], [14, 19], [18, 23]];

export function levelForStreak(streak) {
  return clamp(Math.floor(streak / 2), 0, RANGES.length - 1);
}

// Las posiciones trampa: quien las recibe pierde si el rival no falla.
export function isTrap(n) {
  return n % 4 === 1;
}

// Jugada de la máquina: dejar al jugador en una posición trampa. Si ya
// está perdida (le han dejado una trampa a ella), quita 1 y espera fallo.
export function botMove(remaining) {
  const k = (remaining - 1) % 4;
  return k === 0 ? 1 : k;
}

// Montón inicial: nunca una posición trampa, así el jugador puede ganar.
export function makeNimRound(streak) {
  const level = levelForStreak(streak);
  const [lo, hi] = RANGES[level];
  let sticks = 0;
  let guard = 0;
  do {
    sticks = randInt(lo, hi);
  } while (isTrap(sticks) && guard++ < 50);
  if (isTrap(sticks)) sticks = lo + (isTrap(lo) ? 1 : 0); // salida fija válida
  return { level, sticks };
}

export function mountNimGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false; // mientras piensa la máquina o se resuelve la ronda
  let total = 0;
  let left = 0;
  let history = []; // [{who, before, take}] para explicar el fallo
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
    const round = makeNimRound(streak);
    total = round.sticks;
    left = total;
    history = [];
    locked = false;

    body.innerHTML = `
      <p class="prompt">Quedan <b data-left>${left}</b> palillos<small>Quita 1, 2 o 3 — pierde quien se lleve el último</small></p>
      <div class="nm-sticks" data-sticks></div>
      <div class="nm-turn" data-turn>Te toca</div>
      <div class="nm-pad" data-pad></div>
      <div class="feedback" data-feedback></div>
    `;
    const pad = body.querySelector("[data-pad]");
    [1, 2, 3].forEach((k) => {
      const btn = document.createElement("button");
      btn.className = "nm-take";
      btn.type = "button";
      btn.dataset.take = k;
      btn.innerHTML = `−${k}<small>palillo${k > 1 ? "s" : ""}</small>`;
      btn.addEventListener("click", () => playerTake(k));
      pad.appendChild(btn);
    });
    renderSticks();
    renderPad();
  }

  function say(text, kind) {
    const el = body.querySelector("[data-feedback]");
    if (!el) return;
    el.innerHTML = text;
    el.className = `feedback${kind ? ` ${kind}` : ""}`;
  }

  function renderSticks() {
    const el = body.querySelector("[data-sticks]");
    el.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const s = document.createElement("span");
      s.className = `nm-stick${i < total - left ? " gone" : ""}`;
      el.appendChild(s);
    }
    body.querySelector("[data-left]").textContent = left;
  }

  function renderPad(turn) {
    body.querySelectorAll(".nm-take").forEach((btn) => {
      const k = Number(btn.dataset.take);
      btn.disabled = locked || k > left;
    });
    const el = body.querySelector("[data-turn]");
    if (el) el.textContent = turn || (locked ? "…" : "Te toca");
  }

  function playerTake(k) {
    if (finished || locked || k > left) return;
    history.push({ who: "tu", before: left, take: k });
    left -= k;
    renderSticks();
    say("");

    if (left === 0) return lose(); // se ha llevado el último
    locked = true;
    renderPad("La máquina piensa…");
    later(botTurn, 750);
  }

  function botTurn() {
    const k = botMove(left);
    history.push({ who: "maquina", before: left, take: k });
    left -= k;
    renderSticks();
    if (left === 0) return win(k);
    locked = false;
    renderPad("Te toca");
    say(`La máquina quita ${k} y te deja ${left}`);
  }

  function win(lastTake) {
    locked = true;
    rounds++;
    streak++;
    score += 10;
    renderScore();
    renderPad("¡Ganas!");
    const traps = history
      .filter((m) => m.who === "tu")
      .map((m) => m.before - m.take)
      .filter((n) => n > 0);
    const took = lastTake === 1 ? "el último palillo" : `los últimos ${lastTake} palillos`;
    say(`La máquina se ha llevado ${took}. Le fuiste dejando ${traps.join(", ")} y se quedó sin salida`, "ok");
    later(nextRound, 2400);
  }

  // Al fallar se ve POR QUÉ: la recta con las posiciones trampa y la
  // primera jugada en la que se escapó la partida.
  function lose() {
    locked = true;
    rounds++;
    streak = 0;
    lives--;
    renderLives();
    renderPad("Pierdes");
    const slip = history.find((m) => m.who === "tu" && !isTrap(m.before - m.take));
    const line = [];
    for (let n = 1; n <= total; n++) {
      line.push(`<span class="nm-mark${isTrap(n) ? " trap" : ""}">${n}</span>`);
    }
    let why = "";
    if (slip) {
      const leftOver = slip.before - slip.take;
      const good = botMove(slip.before); // la jugada que sí dejaba una trampa
      why = leftOver === 0
        ? `Con ${slip.before} palillos te llevaste el último. Había que quitar ${good} y dejarle ${slip.before - good}.`
        : `Tenías ${slip.before}, quitaste ${slip.take} y le dejaste ${leftOver}. Había que quitar ${good} y dejarle ${slip.before - good}.`;
    }
    say(
      `Te has llevado el último palillo.<br>${why}<br>` +
        `<span class="nm-line">${line.join("")}</span>` +
        `Las trampas son 1, 5, 9, 13… (múltiplo de 4 más 1): déjale siempre una.`,
      "bad"
    );
    if (lives <= 0) return later(() => finish(false), 4200);
    later(nextRound, 4200);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "nim", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🥢</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} partidas jugadas</p>
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
