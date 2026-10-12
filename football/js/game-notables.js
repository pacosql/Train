// "Identidades notables": la igualdad escrita como en el libro con casillas
// donde faltan números: "(x + 3)² = x² + □x + □", "(x − 4)² = x² − □x + □",
// "(x + 2)(x − 2) = x² − □" y al revés, "x² + 6x + 9 = (x + □)²". Se toca
// una casilla y se escribe; ✓ pasa a la siguiente y, con todas llenas,
// corrige. El 💡 recita la regla con los números de la ronda: "Cuadrado del
// primero, más el doble del primero por el segundo, más el cuadrado del
// segundo: x² + 2 · 3 · x + 3² = x² + 6x + 9".
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const X = "<i>x</i>";
const sq = (s) => `${s}<sup>2</sup>`;
const bx = (b) => (b === 1 ? X : `${b}${X}`); // 1x se escribe x
const RULE_SUM = "Cuadrado del primero, más el doble del primero por el segundo, más el cuadrado del segundo";
const RULE_DIF = "Cuadrado del primero, menos el doble del primero por el segundo, más el cuadrado del segundo";
const RULE_SXD = "Suma por diferencia es diferencia de cuadrados";

// kind: "sum" (a+b)², "dif" (a−b)², "sxd" (a+b)(a−b); rev = al revés
// (factorizar). b es el coeficiente de x (1 salvo en el último nivel).
function make(kind, rev, a, b) {
  const s = kind === "dif" ? M : "+";
  const first = bx(b), b2 = b * b, a2 = a * a, d = 2 * a * b;
  const lhsSq = kind === "sxd" ? `(${first} + ${a})(${first} ${M} ${a})` : `${sq(`(${first} ${s} ${a})`)}`;
  const firstSq = b === 1 ? sq(X) : `${sq(`(${first})`)}`;
  const devText = kind === "sxd" ? `${b2 === 1 ? "" : b2}${sq(X)} ${M} ${a2}` : `${b2 === 1 ? "" : b2}${sq(X)} ${s} ${d}${X} + ${a2}`;
  let text, answers, hint;
  if (!rev) {
    const lead = b === 1 ? sq(X) : `[0]${sq(X)}`;
    const o = b === 1 ? 0 : 1;
    text = kind === "sxd" ? `${lhsSq} = ${lead} ${M} [${o}]` : `${lhsSq} = ${lead} ${s} [${o}]${X} + [${o + 1}]`;
    answers = kind === "sxd" ? [b2, a2] : [b2, d, a2];
    if (b === 1) answers.shift();
    hint = kind === "sxd"
      ? `${RULE_SXD}: ${firstSq} ${M} ${sq(a)} = ${devText}`
      : `${kind === "sum" ? RULE_SUM : RULE_DIF}: ${firstSq} ${s} 2 · ${b === 1 ? "" : `${b}${X} · `}${a}${b === 1 ? ` · ${X}` : ""} + ${sq(a)} = ${devText}`;
  } else {
    text = kind === "sxd" ? `${devText} = (${X} + [0])(${X} ${M} [1])` : `${devText} = ${sq(`(${X} ${s} [0])`)}`;
    answers = kind === "sxd" ? [a, a] : [a];
    hint = kind === "sxd"
      ? `Es una diferencia de cuadrados: ${a2} = ${sq(a)} → (${X} + ${a})(${X} ${M} ${a})`
      : `Es un cuadrado perfecto: ${a2} = ${sq(a)} y ${d}${X} = 2 · ${a} · ${X} → ${sq(`(${X} ${s} ${a})`)}`;
  }
  return { kind, rev, a, b, text, answers, hint };
}

// Niveles: 0 (x + a)² · 1 (x − a)² · 2 suma por diferencia · 3 al revés
// (factorizar) · 4 con coeficiente, (2x + 1)². Cada nivel repasa a veces
// los anteriores.
export function buildRound(level) {
  const kinds = ["sum", "dif", "sxd"];
  if (level <= 2) {
    const kind = Math.random() < 0.65 || level === 0 ? kinds[level] : pick(kinds.slice(0, level));
    return { level, ...make(kind, false, randInt(1, level === 0 ? 9 : 10), 1) };
  }
  if (level === 3) return { level, ...make(pick(kinds), Math.random() < 0.75, randInt(1, 10), 1) };
  return { level, ...make(pick(kinds), false, randInt(1, 7), randInt(2, 5)) };
}

export function mountNotablesGame(container, { client, onExit }) {
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
    <div class="game-body no-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const NAMES = { sum: "Cuadrado de una suma", dif: "Cuadrado de una diferencia", sxd: "Suma por diferencia" };

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.text;
    do round = buildRound(Math.min(4, Math.floor(hits / 3))); while (round.text === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt no-prompt">${round.rev ? "Escríbelo como identidad notable" : "Desarrolla la identidad notable"}</p>
      <div class="no-cuaderno">
        <div class="no-name">${NAMES[round.kind]}</div>
        <div class="no-expr">${round.text.replace(/\[(\d+)\]/g, (_, k) => `<button type="button" class="no-slot" data-slot="${k}"></button>`)}</div>
      </div>
      <div class="keypad no-keypad" data-keypad></div>
      <div class="feedback no-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
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
      b.textContent = typed[+b.dataset.slot];
      b.classList.toggle("active", +b.dataset.slot === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < 3) typed[active] += key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    // ✓ con casillas vacías: el foco pasa a la siguiente que falte (en orden).
    if (typed.some((t) => t === "")) {
      if (typed[active] !== "") {
        active = typed.map((_, k) => (active + 1 + k) % typed.length).find((k) => typed[k] === "");
        return paint();
      }
      feedback.textContent = "Escribe un número en la casilla";
      feedback.className = "feedback bad no-feedback";
      return;
    }
    busy = true;
    rounds++;
    let ok = true;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const i = +s.dataset.slot, good = Number(typed[i]) === round.answers[i];
      ok = ok && good;
      s.classList.remove("active");
      s.classList.add(good ? "good" : "bad");
      if (!good) s.innerHTML = `<s>${typed[i]}</s><span class="no-want">${round.answers[i]}</span>`;
    });
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok no-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.innerHTML = `💡 ${round.hint} <button type="button" class="no-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad no-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", () => { clearTimeout(pending); after(); });
      pending = setTimeout(after, 2500);
    }
  }

  // Teclado físico: cifras, ⌫, Enter y flechas.
  function onKey(e) {
    if (finished || !round) return;
    if (busy) {
      if (e.key === "Enter") body.querySelector("[data-next]")?.click();
      return;
    }
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      active = (active + (e.key === "ArrowRight" ? 1 : typed.length - 1)) % typed.length;
      paint();
    } else return;
    e.preventDefault();
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "notables", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>✨</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} identidades notables bien de ${rounds}</p>
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
    round = null;
    finished = false;
    window.removeEventListener("keydown", onKey);
    window.addEventListener("keydown", onKey);
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
  };
}
