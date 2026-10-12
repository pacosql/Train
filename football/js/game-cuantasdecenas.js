// "¿Cuántas decenas hay?": el número escrito en la tabla posicional del
// cuaderno (UM | C | D | U) y la pregunta "¿Cuántas decenas hay en 340?"
// con una casilla que se rellena con el teclado. Al responder se tapa la
// cifra de las unidades (rayada en rojo) y quedan en verde las que forman
// la respuesta: 340 → 34 decenas. Alterna centenas e "¿cuántas unidades
// son 7 decenas?" (la tabla se completa con ceros).
import { randInt, pick, saveScore } from "./utils.js";

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const HEADS = ["U", "D", "C", "UM"];
const NAME = { D: ["decenas", 1, "la cifra de las unidades"], C: ["centenas", 2, "las dos últimas cifras (D y U)"] };

// Niveles: 0 decenas en 10-99 · 1 decenas en 100-999 · 2 centenas en
// 1.000-9.999 · 3 mezcla: decenas/centenas hasta 9.999 y la inversa
// "¿cuántas unidades son 7 decenas / 3 centenas?".
export function buildRound(level) {
  let kind = "count", unit = "D", n;
  if (level === 0) n = randInt(10, 99);
  else if (level === 1) n = randInt(100, 999);
  else if (level === 2) { unit = "C"; n = randInt(1000, 9999); }
  else if (Math.random() < 0.35) { kind = "inverse"; unit = pick(["D", "C"]); n = randInt(2, unit === "D" ? 99 : 49); }
  else { unit = pick(["D", "C"]); n = randInt(unit === "D" ? 100 : 1000, 9999); }
  const [name, k, tapa] = NAME[unit];
  const pow = 10 ** k;
  let answer, hint, digits, cols;
  if (kind === "count") {
    answer = Math.floor(n / pow);
    const rest = n % pow;
    digits = String(n);
    cols = digits.length;
    hint = `${fmt(n)} = ${answer} ${name} (${answer} × ${pow})${rest ? ` y ${rest} ${rest === 1 ? "unidad suelta" : "unidades sueltas"}` : ""}: tapo ${tapa} y queda ${answer}`;
  } else {
    answer = n * pow;
    digits = String(n) + "·".repeat(k); // los ceros se rellenan al responder
    cols = digits.length;
    hint = `${n} ${name} = ${n} × ${pow} = ${fmt(answer)} unidades: pongo ${k === 1 ? "un 0" : "dos ceros"} a la derecha del ${n}`;
  }
  return { kind, unit, n, k, answer, hint, digits, cols };
}

export function mountCuantasdecenasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body cd-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const onKey = (e) => {
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  };
  window.addEventListener("keydown", onKey);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 3)));
    typed = "";
    busy = false;
    const heads = HEADS.slice(0, round.cols).reverse();
    const question = round.kind === "count"
      ? `¿Cuántas <b>${NAME[round.unit][0]}</b> hay en <b>${fmt(round.n)}</b>?`
      : `¿Cuántas <b>unidades</b> son <b>${round.n} ${NAME[round.unit][0]}</b>?`;
    body.innerHTML = `
      <p class="prompt cd-prompt">${question}</p>
      <div class="cd-cuaderno">
        <div class="cd-table" style="grid-template-columns:repeat(${round.cols},56px)">
          ${heads.map((h) => `<div class="cd-head">${h}</div>`).join("")}
          ${round.digits.split("").map((d, i) => `<div class="cd-cell${d === "·" ? " cd-dim" : ""}" data-cell="${i}">${d}</div>`).join("")}
        </div>
        <div class="cd-line">
          <span>${round.kind === "count" ? fmt(round.n) : `${round.n} ${NAME[round.unit][0]}`} =</span>
          <button type="button" class="cd-slot active" data-slot></button>
          <span>${round.kind === "count" ? NAME[round.unit][0] : "unidades"}</span>
        </div>
      </div>
      <div class="keypad cd-keypad" data-keypad></div>
      <div class="feedback cd-feedback" data-feedback></div>
    `;
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
      btn.dataset.key = key;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 5) typed += key;
    body.querySelector("[data-slot]").textContent = typed;
  }

  function check() {
    const fb = body.querySelector("[data-feedback]");
    if (typed === "") {
      fb.textContent = "Escribe el número en la casilla";
      fb.className = "feedback bad";
      return;
    }
    busy = true;
    rounds++;
    const ok = Number(typed) === round.answer;
    const slot = body.querySelector("[data-slot]");
    slot.classList.remove("active");
    slot.classList.add(ok ? "good" : "bad");
    if (!ok) slot.innerHTML = `<s>${typed}</s>${round.answer}`;
    // La tabla enseña el truco: se tapan las cifras de la derecha (contar)
    // o se rellenan con ceros (inversa).
    body.querySelectorAll("[data-cell]").forEach((c, i) => {
      const fromRight = round.cols - 1 - i;
      if (round.kind === "count") c.classList.add(fromRight < round.k ? "cd-cover" : "cd-keep");
      else if (fromRight < round.k) { c.textContent = "0"; c.classList.remove("cd-dim"); c.classList.add("cd-keep"); }
    });
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      fb.innerHTML = `✓ ${fmt(round.answer)}. 💡 ${round.hint}`;
      fb.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      fb.innerHTML = `Era ${fmt(round.answer)}. 💡 ${round.hint} <button type="button" class="cd-next" data-next>Siguiente →</button>`;
      fb.className = "feedback bad";
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      fb.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "cuantasdecenas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔟</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} preguntas bien de ${rounds}</p>
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
    window.removeEventListener("keydown", onKey);
  };
}
