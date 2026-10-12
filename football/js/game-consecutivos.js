// "Números consecutivos": el problema de la ecuación de primer grado tal
// cual sale en el libro ("Tres números consecutivos suman 24. ¿Cuáles
// son?") con las casillas de los números en orden y, debajo de cada una,
// lo que representa (x, x + 1, x + 2), como cuando se plantea en clase.
// Se escriben con el teclado (el foco avanza de izquierda a derecha). El 💡
// plantea y resuelve: "x + (x + 1) + (x + 2) = 24 → 3x + 3 = 24 → x = 7".
import { randInt, pick, saveScore } from "./utils.js";

const X = "<i>x</i>";
const half = `<span class="cs-frac"><span>${X}</span><span>2</span></span>`;
// Un término k·x + c (k = 0,5 es "su mitad").
const term = ({ k, c }) => (k === 0.5 ? half : `${k === 1 ? "" : k}${X}${c ? ` + ${c}` : ""}`);
const inEq = (t, i) => (i && t.c ? `(${term(t)})` : term(t));
const list = (v) => (v.length === 2 ? `${v[0]} y ${v[1]}` : `${v[0]}, ${v[1]} y ${v[2]}`);

const KINDS = {
  dos: { text: "Dos números consecutivos", t: [{ k: 1, c: 0 }, { k: 1, c: 1 }] },
  tres: { text: "Tres números consecutivos", t: [{ k: 1, c: 0 }, { k: 1, c: 1 }, { k: 1, c: 2 }] },
  pares2: { text: "Dos números pares consecutivos", t: [{ k: 1, c: 0 }, { k: 1, c: 2 }], par: 0 },
  impares2: { text: "Dos números impares consecutivos", t: [{ k: 1, c: 0 }, { k: 1, c: 2 }], par: 1 },
  pares3: { text: "Tres números pares consecutivos", t: [{ k: 1, c: 0 }, { k: 1, c: 2 }, { k: 1, c: 4 }], par: 0 },
  impares3: { text: "Tres números impares consecutivos", t: [{ k: 1, c: 0 }, { k: 1, c: 2 }, { k: 1, c: 4 }], par: 1 },
  doble: { text: "Un número y su doble", t: [{ k: 1, c: 0 }, { k: 2, c: 0 }], names: ["el número", "su doble"] },
  triple: { text: "Un número y su triple", t: [{ k: 1, c: 0 }, { k: 3, c: 0 }], names: ["el número", "su triple"] },
  mitad: { text: "Un número y su mitad", t: [{ k: 1, c: 0 }, { k: 0.5, c: 0 }], names: ["el número", "su mitad"] },
};
const LEVELS = [["dos"], ["tres", "tres", "dos"], ["pares2", "impares2", "pares3", "impares3"], ["doble", "triple"], ["mitad", "mitad", "tres", "impares3", "triple"]];

// Niveles: 0 dos consecutivos · 1 tres · 2 pares/impares consecutivos ·
// 3 un número y su doble/triple · 4 un número y su mitad (y repaso).
export function buildRound(level) {
  const kind = pick(LEVELS[Math.min(level, 4)]), K = KINDS[kind];
  let x = randInt(level <= 1 ? 4 : 6, level <= 1 ? 40 : 60);
  if (K.par !== undefined && x % 2 !== K.par) x++;
  if (kind === "mitad") x = 2 * randInt(3, 30);
  if (kind === "doble" || kind === "triple") x = randInt(3, 30);
  const vals = K.t.map(({ k, c }) => k * x + c);
  const S = vals.reduce((s, v) => s + v, 0);
  const sk = K.t.reduce((s, t) => s + t.k, 0), sc = K.t.reduce((s, t) => s + t.c, 0);
  const plan = `${K.t.map(inEq).join(" + ")} = ${S}`;
  let steps;
  if (kind === "mitad") steps = `${plan} → multiplico todo por 2: 2${X} + ${X} = ${2 * S} → 3${X} = ${2 * S} → ${X} = ${x}`;
  else steps = `${plan} → ${sc ? `${sk}${X} + ${sc} = ${S} → ` : ""}${sk}${X} = ${S - sc} → ${X} = ${x}`;
  const who = K.names ? "al número" : "al primero";
  const pre = K.par === 0 ? "Los pares van de 2 en 2. " : K.par === 1 ? "Los impares van de 2 en 2. " : "";
  const hint = `${pre}Llamo ${X} ${who}: ${steps}. Son ${list(vals)} (${vals.join(" + ")} = ${S} ✓)`;
  return { level, kind, text: `${K.text} suman ${S}. ${K.names ? "¿Cuáles son?" : "¿Cuáles son?"}`, t: K.t, names: K.names || null, x, S, answers: vals, hint };
}

export function mountConsecutivosGame(container, { client, onExit }) {
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
    <div class="game-body cs-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.text;
    do round = buildRound(Math.min(4, Math.floor(hits / 2))); while (round.text === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    const n = round.answers.length;
    body.innerHTML = `
      <p class="prompt cs-prompt">Plantea y resuelve</p>
      <div class="cs-cuaderno">
        <p class="cs-text">${round.text}</p>
        <div class="cs-row" style="--cs-n:${n}">
          ${round.t.map((t, i) => `<div class="cs-col">${round.names ? `<span class="cs-name">${round.names[i]}</span>` : ""}<button type="button" class="cs-slot" data-slot="${i}"></button><span class="cs-lab">${term(t)}</span></div>`).join("")}
        </div>
      </div>
      <div class="keypad cs-keypad" data-keypad></div>
      <div class="feedback cs-feedback" data-feedback></div>
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
    const t = typed[active];
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.length < 3) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    if (!typed.every((t) => t !== "")) {
      // ✓ con la casilla escrita pasa a la siguiente vacía (de izquierda a derecha).
      if (typed[active] !== "") { active = typed.findIndex((t) => t === ""); return paint(); }
      feedback.textContent = "Escribe un número en cada casilla";
      feedback.className = "feedback bad cs-feedback";
      return;
    }
    busy = true;
    rounds++;
    let ok = true;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const i = +s.dataset.slot, want = round.answers[i];
      const good = Number(typed[i]) === want;
      ok = ok && good;
      s.classList.remove("active");
      s.classList.add(good ? "good" : "bad");
      if (!good) s.innerHTML = `<s>${typed[i]}</s><span class="cs-want">${want}</span>`;
    });
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok cs-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      // ¿Qué condición falla: la suma o la relación entre ellos?
      const v = typed.map(Number), sum = v.reduce((s, a) => s + a, 0);
      const rel = round.t.every(({ k, c }, i) => v[i] === k * v[0] + c);
      const why = sum === round.S && !rel ? `Suman ${round.S}, pero no cumplen ${round.names ? "la relación" : "lo de consecutivos"}. ` : rel && sum !== round.S ? `Cumplen la relación, pero suman ${sum}, no ${round.S}. ` : "";
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.innerHTML = `${why}💡 ${round.hint} <button type="button" class="cs-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad cs-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", () => { clearTimeout(pending); after(); });
      pending = setTimeout(after, 3500);
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
    saveScore(client, "consecutivos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔢</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} problemas resueltos de ${rounds}</p>
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
