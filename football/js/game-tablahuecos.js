// "La tabla con huecos": un trozo de la tabla de multiplicar (o de sumar)
// como tabla de doble entrada 4×4 del cuaderno (× | 3 4 5 6 / 7 | 21 28 35
// 42 …) con 3-4 celdas vacías que se tocan y se rellenan con el teclado.
// En los niveles altos falta además una cabecera y hay que deducir de qué
// fila (o columna) es a partir de una celda conocida. El 💡 nombra la fila
// y la columna de cada hueco con los números de la ronda.
import { randInt, shuffle, saveScore } from "./utils.js";

const sortedPick = (n, lo, hi) => shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, n).sort((a, b) => a - b);
const calc = (op, a, b) => (op === "+" ? a + b : a * b);

// Niveles: 0 tabla de sumar · 1 tablas del 2 al 5 · 2 tablas del 6 al 9 ·
// 3 cabecera oculta (deducir la fila o la columna) · 4 tablas del 11 y 12.
export function buildRound(level) {
  const op = level === 0 ? "+" : "×";
  for (;;) {
    let rowsH, colsH;
    if (level === 0) { rowsH = sortedPick(4, 1, 9); colsH = sortedPick(4, 1, 9); }
    else if (level === 1) { rowsH = sortedPick(4, 2, 5); colsH = sortedPick(4, 1, 10); }
    else if (level === 2) { rowsH = sortedPick(4, 6, 9); colsH = sortedPick(4, 2, 10); }
    else if (level === 3) { rowsH = sortedPick(4, 2, 9); colsH = sortedPick(4, 2, 10); }
    else { rowsH = sortedPick(4, 6, 12); colsH = sortedPick(4, 2, 12); if (!rowsH.some((v) => v > 10) && !colsH.some((v) => v > 10)) continue; }
    const cells = rowsH.map((r) => colsH.map((c) => calc(op, r, c)));
    const nHoles = level <= 1 ? 3 : 4;
    const holes = shuffle(Array.from({ length: 16 }, (_, i) => [Math.floor(i / 4), i % 4])).slice(0, nHoles).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    // Cabecera oculta: una fila o una columna sin rotular, con al menos una celda conocida.
    let hidden = null;
    if (level >= 3 && (level === 3 || Math.random() < 0.5)) {
      hidden = Math.random() < 0.5 ? { kind: "fila", i: randInt(0, 3) } : { kind: "columna", i: randInt(0, 3) };
      const knownIn = (hidden.kind === "fila" ? holes.filter((h) => h[0] === hidden.i) : holes.filter((h) => h[1] === hidden.i)).length;
      if (knownIn === 4) continue; // la fila/columna oculta necesita una celda a la vista
    }
    // Orden del foco: primero la cabecera oculta, luego las celdas en orden de lectura.
    const slots = [];
    const parts = [];
    if (hidden) {
      const value = hidden.kind === "fila" ? rowsH[hidden.i] : colsH[hidden.i];
      // Celda conocida de esa fila/columna para deducir la cabecera.
      const j = (hidden.kind === "fila" ? [0, 1, 2, 3].filter((c) => !holes.some((h) => h[0] === hidden.i && h[1] === c)) : [0, 1, 2, 3].filter((r) => !holes.some((h) => h[0] === r && h[1] === hidden.i)))[0];
      const cellV = hidden.kind === "fila" ? cells[hidden.i][j] : cells[j][hidden.i];
      const otherH = hidden.kind === "fila" ? colsH[j] : rowsH[j];
      slots.push({ kind: hidden.kind, i: hidden.i, value });
      const where = hidden.kind === "fila" ? `En esa fila, bajo el ${otherH}, hay un ${cellV}` : `En esa columna, en la fila del ${otherH}, hay un ${cellV}`;
      parts.push(`${where}: ${cellV} ${op === "+" ? "−" : "÷"} ${otherH} = ${value} → es la ${hidden.kind} del ${value}`);
    }
    for (const [r, c] of holes) {
      slots.push({ kind: "celda", r, c, value: cells[r][c] });
      parts.push(`Fila del ${rowsH[r]}, columna del ${colsH[c]}: ${rowsH[r]} ${op} ${colsH[c]} = ${cells[r][c]}`);
    }
    return { op, rowsH, colsH, cells, holes, hidden, slots, hint: parts.join("; ") };
  }
}

export function mountTablahuecosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy, fresh;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body th-body" data-body></div>
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
    fresh = false;
    const slotOf = (pred) => round.slots.findIndex(pred);
    const head = (kind, i, v) => {
      const s = slotOf((x) => x.kind === kind && x.i === i);
      return s === -1 ? `<span class="th-cell th-head">${v}</span>` : `<button type="button" class="th-cell th-head th-slot" data-slot="${s}"></button>`;
    };
    const cell = (r, c) => {
      const s = slotOf((x) => x.kind === "celda" && x.r === r && x.c === c);
      return s === -1 ? `<span class="th-cell th-num">${round.cells[r][c]}</span>` : `<button type="button" class="th-cell th-slot" data-slot="${s}"></button>`;
    };
    const grid = [`<span class="th-cell th-corner">${round.op}</span>`, ...round.colsH.map((v, c) => head("columna", c, v))];
    round.rowsH.forEach((v, r) => grid.push(head("fila", r, v), ...round.colsH.map((_, c) => cell(r, c))));
    body.innerHTML = `
      <p class="prompt th-prompt">${round.hidden ? `Completa la tabla: ¿qué ${round.hidden.kind} es?` : `Completa la tabla de ${round.op === "+" ? "sumar" : "multiplicar"}`}</p>
      <div class="th-cuaderno th-sheet"><div class="th-grid">${grid.join("")}</div></div>
      <div class="keypad th-keypad" data-keypad></div>
      <div class="feedback th-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), (fresh = true), paint())));
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
    if (key === "⌫") (typed[active] = typed[active].slice(0, -1)), (fresh = false);
    else if (fresh || typed[active].length < 3) {
      // Tras tocar una casilla (o saltar a ella) la primera cifra sustituye a lo escrito.
      typed[active] = (fresh ? "" : typed[active]) + key;
      fresh = false;
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
      if (!ok) b.innerHTML = `<s>${typed[i]}</s><b>${round.slots[i].value}</b>`;
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
      feedback.innerHTML = `💡 ${round.hint}${lives > 0 ? ' <button type="button" class="secondary th-next" data-next>Siguiente →</button>' : ""}`;
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
    saveScore(client, "tablahuecos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📋</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} tablas completas de ${rounds}</p>
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
