// "Fracciones equivalentes": arriba una barra dividida con a/b pintados;
// abajo otra barra con más (o menos) partes y el numerador en "?". Los
// botones − y + cambian el numerador y la barra de abajo se pinta en vivo;
// ✓ comprueba. Niveles: ×2 → ×3 → simplificar (la de abajo tiene MENOS
// partes) → sin barras (solo números y teclado). 4º-6º.
import { randInt, pick, saveScore } from "./utils.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
function coprimeNum(b) {
  let a = randInt(1, b - 1);
  while (gcd(a, b) !== 1) a = randInt(1, b - 1);
  return a;
}

// Nivel → ronda: se ve a/b, se pide ?/d, la respuesta es n.
export function buildRound(level) {
  if (level <= 1) {
    const k = level === 0 ? 2 : 3;
    const b = randInt(2, level === 0 ? 6 : 4);
    const a = coprimeNum(b);
    return { a, b, d: b * k, n: a * k, k, op: "×", bars: true };
  }
  if (level === 2) {
    const k = pick([2, 3]);
    const b = randInt(2, Math.floor(12 / k));
    const a = coprimeNum(b);
    return { a: a * k, b: b * k, d: b, n: a, k, op: "÷", bars: true };
  }
  const b = randInt(2, 10);
  const a = coprimeNum(b);
  const k = randInt(2, Math.min(5, Math.floor(40 / b)));
  return { a, b, d: b * k, n: a * k, k, op: "×", bars: false };
}

export function hintFor(r) {
  return r.op === "×"
    ? `${r.b} × ${r.k} = ${r.d}, así que ${r.a} × ${r.k} = ${r.n}: multiplicas arriba y abajo por lo mismo`
    : `${r.b} ÷ ${r.k} = ${r.d}, así que ${r.a} ÷ ${r.k} = ${r.n}: divides arriba y abajo por lo mismo`;
}

export function mountEquivalentesGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let hits = 0;
  let finished = false;
  let busy = false;
  let pending = null;
  let round = null;
  let n = 0; // numerador elegido con − / +
  let touched = false;
  let typed = "";

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body eq-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const frac = (num, den, attr = "") => `<span class="eq-frac"><b ${attr}>${num}</b><i></i><b>${den}</b></span>`;
  const cells = (d, on, cls = "on") =>
    Array.from({ length: d }, (_, i) => `<span class="eq-cell${i < on ? ` ${cls}` : ""}"></span>`).join("");

  function nextRound() {
    round = buildRound(Math.min(3, Math.floor(hits / 3)));
    n = 0;
    touched = false;
    typed = "";
    busy = false;
    if (!round.bars) return keypadRound();
    body.innerHTML = `
      <p class="prompt eq-prompt">Pinta la misma cantidad abajo</p>
      <div class="eq-row">${frac(round.a, round.b)}<div class="eq-bar" data-top>${cells(round.b, round.a)}</div></div>
      <div class="eq-eq">=</div>
      <div class="eq-row">${frac("?", round.d, "data-num")}<div class="eq-bar" data-bot>${cells(round.d, 0)}</div></div>
      <div class="eq-ctrl">
        <button type="button" class="eq-step" data-minus>−</button>
        <button type="button" class="primary eq-check" data-check>✓</button>
        <button type="button" class="eq-step" data-plus>+</button>
      </div>
      <div class="feedback" data-feedback></div>
    `;
    body.querySelector("[data-minus]").addEventListener("click", () => step(-1));
    body.querySelector("[data-plus]").addEventListener("click", () => step(1));
    body.querySelector("[data-check]").addEventListener("click", () => check(n));
  }

  function step(delta) {
    if (busy || finished) return;
    n = Math.max(0, Math.min(round.d, n + delta));
    touched = true;
    paintBottom(n, "on");
  }
  function paintBottom(count, cls) {
    body.querySelector("[data-num]").textContent = touched ? count : "?";
    body.querySelector("[data-bot]").innerHTML = cells(round.d, count, cls);
  }

  function keypadRound() {
    body.innerHTML = `
      <p class="prompt eq-prompt">Completa la fracción equivalente</p>
      <div class="eq-line">${frac(round.a, round.b)} = ${frac("?", round.d, "data-num")}</div>
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
    `;
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
  }
  function pressKey(key) {
    if (busy || finished) return;
    if (key === "✓") return typed !== "" && check(Number(typed));
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 3) typed += key;
    body.querySelector("[data-display]").textContent = typed || " ";
  }

  function check(value) {
    if (busy || finished) return;
    busy = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const numEl = body.querySelector("[data-num]");
    if (value === round.n) {
      score += 10;
      hits++;
      renderScore();
      numEl.textContent = round.n;
      feedback.innerHTML = `¡Bien! ${round.a}/${round.b} = ${round.n}/${round.d} <span class="eq-tip">💡 ${hintFor(round)}</span>`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
      return;
    }
    lives--;
    renderLives();
    // La respuesta correcta, en verde, sobre el propio dibujo (o la fracción).
    numEl.textContent = round.n;
    numEl.classList.add("eq-good");
    if (round.bars) {
      touched = true;
      paintBottom(round.n, "good");
    }
    feedback.innerHTML = `Era ${round.n}/${round.d}, no ${value}/${round.d} <span class="eq-tip">💡 ${hintFor(round)}</span>`;
    feedback.className = "feedback bad";
    if (lives <= 0) {
      pending = setTimeout(() => finish(false), 2200);
      return;
    }
    pending = setTimeout(nextRound, 2200);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "equivalentes", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🟰</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} fracciones equivalentes</p>
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
