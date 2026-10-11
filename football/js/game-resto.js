// "División con resto": 47 ÷ 5 con un dibujo de 47 puntos. Se escriben
// cociente y resto con el teclado (se toca la casilla a rellenar; empieza
// por el cociente). Al responder, los puntos se agrupan en filas de 5:
// tantas filas completas como el cociente y los que sobran aparte. El 💡
// dice la cuenta: "5 × 9 = 45, y sobran 2".
import { randInt, saveScore } from "./utils.js";

// Niveles: 0 divisor ≤ 5 y dividendo ≤ 30 · 1 tablas completas ·
// 2 dividendo hasta 100 · 3 igual pero a veces resto 0 · 4 divisor de dos
// cifras (sin dibujo).
export function buildRound(level) {
  let d, q, r;
  if (level === 0) {
    d = randInt(2, 5);
    q = randInt(2, Math.floor((31 - d) / d)); // así d·q + r ≤ 30
    r = randInt(1, d - 1);
  } else if (level === 1) {
    d = randInt(2, 9);
    q = randInt(2, 9);
    r = randInt(1, d - 1);
  } else if (level <= 3) {
    d = randInt(2, 9);
    q = randInt(3, Math.floor((101 - d) / d)); // así d·q + r ≤ 100
    r = level === 3 && Math.random() < 0.4 ? 0 : randInt(1, d - 1);
  } else {
    d = randInt(11, 20);
    q = randInt(2, 9);
    r = Math.random() < 0.3 ? 0 : randInt(1, d - 1);
  }
  const n = d * q + r;
  const hint =
    r === 0
      ? `${d} × ${q} = ${n} justo: resto 0, la división es exacta`
      : `${d} × ${q} = ${d * q}, y sobran ${r}. El resto siempre es menor que el divisor (${r} < ${d})`;
  return { n, d, q, r, hint, draw: level < 4 };
}

export function mountRestoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body rs-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 3)));
    typed = { q: "", r: "" };
    active = "q";
    busy = false;
    body.innerHTML = `
      <p class="prompt rs-prompt"><b>${round.n}</b> ÷ <b>${round.d}</b></p>
      <div class="rs-dots ${round.draw ? "" : "rs-hidden"}" data-dots>${"<i></i>".repeat(round.draw ? round.n : 0)}</div>
      <div class="rs-boxes">
        <label class="rs-box"><span>cociente</span><button type="button" class="rs-slot" data-slot="q"></button></label>
        <label class="rs-box"><span>resto</span><button type="button" class="rs-slot" data-slot="r"></button></label>
      </div>
      <div class="keypad rs-keypad" data-keypad></div>
      <div class="feedback rs-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = b.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      b.textContent = typed[b.dataset.slot];
      b.classList.toggle("active", b.dataset.slot === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < 2) typed[active] += key;
    paint();
  }

  // Al responder, los puntos se agrupan: q filas de d (una por cada
  // "vez que cabe" el divisor) y los r que sobran en una fila aparte.
  function group() {
    if (!round.draw) return;
    const dots = body.querySelector("[data-dots]");
    dots.style.setProperty("--rs-d", round.d);
    dots.classList.add("grouped");
    dots.innerHTML =
      `<span class="rs-group">${"<i></i>".repeat(round.d)}</span>`.repeat(round.q) +
      (round.r ? `<span class="rs-group rs-rest">${"<i></i>".repeat(round.r)}</span>` : "");
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    // Con "✓" y una casilla vacía, el foco salta a ella (como un Enter).
    const empty = ["q", "r"].find((k) => typed[k] === "");
    if (empty) {
      active = empty;
      paint();
      feedback.textContent = `Escribe el ${empty === "q" ? "cociente" : "resto"}`;
      feedback.className = "feedback bad";
      return;
    }
    busy = true;
    rounds++;
    const okQ = Number(typed.q) === round.q;
    const okR = Number(typed.r) === round.r;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = b.dataset.slot;
      const ok = k === "q" ? okQ : okR;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[k]}</s>${round[k]}`;
    });
    group();
    if (okQ && okR) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era cociente ${round.q} y resto ${round.r}. 💡 ${round.hint}`;
      feedback.className = "feedback bad";
      pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "resto", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>➗</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} divisiones bien de ${rounds}</p>
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
