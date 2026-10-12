// "La máquina de operar": la máquina del libro con la regla a la vista
// ("× 3 y luego + 1"). Entra un número por la izquierda y sale por la
// derecha; debajo, la tabla del cuaderno con tres filas "4 → □" (y a veces
// el paso intermedio o la entrada "□ → 13", que se deshace al revés). Se
// tocan las casillas y se escriben con el teclado; el foco va fila a fila
// de izquierda a derecha. El 💡 enseña los pasos con los números de la ronda.
import { randInt, pick, saveScore } from "./utils.js";

const apply = (s, x) => (s.op === "+" ? x + s.k : s.op === "−" ? x - s.k : s.op === "×" ? x * s.k : x / s.k);
const undo = (s, y) => (s.op === "+" ? y - s.k : s.op === "−" ? y + s.k : s.op === "×" ? y / s.k : y * s.k);
const INV = { "+": "−", "−": "+", "×": "÷", "÷": "×" };

function randomStep(kind) {
  if (kind === "+") return { op: "+", k: randInt(1, 9) };
  if (kind === "−") return { op: "−", k: randInt(1, 9) };
  return { op: "×", k: randInt(2, 9) };
}

// Niveles: 0 una operación · 1 dos operaciones (con el paso intermedio) ·
// 2 entrada desconocida (deshacer) · 3 tres pasos · 4 tres pasos con entrada
// desconocida.
export function buildRound(level) {
  for (;;) {
    const nSteps = level === 0 ? 1 : level <= 2 ? 2 : 3;
    const steps = [];
    for (let i = 0; i < nSteps; i++) {
      let s = randomStep(pick(["+", "−", "×"]));
      if (i > 0 && s.op === "×" && steps[i - 1].op === "×") s = randomStep(pick(["+", "−"])); // dos × seguidas no se ven en el libro
      steps.push(s);
    }
    if (nSteps > 1 && !steps.some((s) => s.op === "×")) continue; // con dos pasos, uno es ×
    const ins = [];
    while (ins.length < 3) { const v = randInt(1, 12); if (!ins.includes(v)) ins.push(v); }
    const rows = ins.map((x) => {
      const vals = [x];
      for (const s of steps) vals.push(apply(s, vals[vals.length - 1]));
      return vals;
    });
    if (rows.some((r) => r.some((v) => v < 0 || v > 200 || !Number.isInteger(v)))) continue;
    // Casillas: por fila, qué posición falta (0 = entrada, última = salida, otras = paso intermedio).
    const showMid = level === 1;
    const slots = [];
    const parts = [];
    rows.forEach((vals, r) => {
      const last = vals.length - 1;
      let missing;
      if (level === 0 || level === 3) missing = [last];
      else if (level === 1) missing = r === 0 ? [1, last] : [last];
      else if (level === 2) missing = r === 0 ? [last] : [0];
      else missing = r === 2 ? [0] : [last];
      for (const pos of missing) slots.push({ r, pos, value: vals[pos] });
      if (missing.includes(0)) {
        const back = steps.map((s, i) => `${vals[i + 1]} ${INV[s.op]} ${s.k} = ${vals[i]}`).reverse();
        parts.push(`□ → ${vals[last]}: deshago al revés, ${back.join(", ")}`);
      } else parts.push(steps.map((s, i) => `${vals[i]} ${s.op} ${s.k} = ${vals[i + 1]}`).join(", "));
    });
    const rule = steps.map((s) => `${s.op} ${s.k}`).join(" y luego ");
    return { steps, rows, slots, showMid, rule, hint: parts.join(" · ") };
  }
}

export function mountMaquinaGame(container, { client, onExit }) {
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
    <div class="game-body mq-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    const last = round.steps.length;
    const cell = (r, pos) => {
      const s = round.slots.findIndex((x) => x.r === r && x.pos === pos);
      return s === -1 ? `<span class="mq-cell mq-num">${round.rows[r][pos]}</span>` : `<button type="button" class="mq-cell mq-slot" data-slot="${s}"></button>`;
    };
    const row = (r) => {
      const mid = round.showMid ? `<span class="mq-arrow">→</span>${cell(r, 1)}` : "";
      return `<div class="mq-row">${cell(r, 0)}${mid}<span class="mq-arrow">→</span>${cell(r, last)}</div>`;
    };
    body.innerHTML = `
      <p class="prompt mq-prompt">La máquina hace <b>${round.rule}</b></p>
      <div class="mq-machine">
        <span class="mq-port mq-in">entra</span>
        <div class="mq-box">${round.steps.map((s) => `<span class="mq-chip">${s.op} ${s.k}</span>`).join('<span class="mq-arrow">→</span>')}</div>
        <span class="mq-port mq-out">sale</span>
      </div>
      <div class="mq-cuaderno mq-sheet">
        <div class="mq-row mq-labels"><span>entra</span>${round.showMid ? "<span></span><span>paso</span>" : ""}<span></span><span>sale</span></div>
        ${[0, 1, 2].map(row).join("")}
      </div>
      <div class="keypad mq-keypad" data-keypad></div>
      <div class="feedback mq-feedback" data-feedback></div>
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
      const i = +b.dataset.slot;
      b.textContent = typed[i];
      b.classList.toggle("active", i === active);
    });
  }

  function nextEmpty() {
    for (let k = 1; k <= typed.length; k++) if (typed[(active + k) % typed.length] === "") return (active + k) % typed.length;
    return -1;
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") {
      const e = typed[active] === "" ? active : nextEmpty();
      if (e === -1) return check();
      active = e;
      paint();
      const fb = body.querySelector("[data-feedback]");
      fb.textContent = "Faltan casillas por rellenar";
      fb.className = "feedback bad";
      return;
    }
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < 3) {
      typed[active] += key;
      if (typed[active].length >= String(round.slots[active].value).length) {
        const e = nextEmpty();
        if (e !== -1) active = e;
      }
    }
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const i = +b.dataset.slot;
      const ok = Number(typed[i]) === round.slots[i].value;
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[i]}</s>${round.slots[i].value}`;
    });
    const feedback = body.querySelector("[data-feedback]");
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.innerHTML = `💡 ${round.hint}${lives > 0 ? ' <button type="button" class="secondary mq-next" data-next>Siguiente →</button>' : ""}`;
      feedback.className = "feedback bad";
      feedback.querySelector("[data-next]")?.addEventListener("click", () => (clearTimeout(pending), nextRound()));
      pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2500);
    }
  }

  const onKey = (e) => {
    if (finished) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "maquina", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚙️</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} máquinas completas de ${rounds}</p>
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
