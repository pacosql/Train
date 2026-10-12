// "Tablas de doble entrada": la tabla del libro (deportes × cursos,
// helados × días, mascotas × clases) con sus números y una pregunta:
// leer una casilla, sumar una fila o columna, restar dos casillas, el
// total de la tabla o, al final, la casilla que falta sabiendo el total.
// Se escribe la respuesta en la casilla con el teclado; al responder se
// iluminan la fila y la columna que había que mirar y el 💡 lo cuenta:
// "Fila 'fútbol', columna '3.º': 8".
import { randInt, pick, shuffle, saveScore } from "./utils.js";

// Cada contexto: filas (emoji + nombre), columnas y cómo se pregunta.
const CTX = [
  {
    corner: "Deporte", across: "Curso", unit: "alumnos",
    rows: [["⚽", "fútbol", "juegan al fútbol"], ["🏀", "baloncesto", "juegan al baloncesto"], ["🎾", "tenis", "juegan al tenis"], ["🏊", "natación", "hacen natación"]],
    cols: ["2.º", "3.º", "4.º"],
    cell: (r, c) => `¿Cuántos de ${c} ${r[2]}?`,
    rowTot: (r) => `¿Cuántos ${r[2]} en total?`,
    colTot: (c) => `¿Cuántos alumnos de ${c} hay en total?`,
    diffCol: (c, r1, r2) => `En ${c}, ¿cuántos más hay en ${r1[1]} que en ${r2[1]}?`,
    diffRow: (r, c1, c2) => `En ${r[1]}, ¿cuántos más hay de ${c1} que de ${c2}?`,
    all: "¿Cuántos alumnos hay en toda la tabla?",
  },
  {
    corner: "Helado", across: "Día", unit: "helados",
    rows: [["🍓", "fresa"], ["🍫", "chocolate"], ["🍋", "limón"], ["🍦", "vainilla"]],
    cols: ["lunes", "martes", "miércoles"],
    cell: (r, c) => `¿Cuántos helados de ${r[1]} se vendieron el ${c}?`,
    rowTot: (r) => `¿Cuántos helados de ${r[1]} se vendieron en total?`,
    colTot: (c) => `¿Cuántos helados se vendieron el ${c}?`,
    diffCol: (c, r1, r2) => `El ${c}, ¿cuántos helados más de ${r1[1]} que de ${r2[1]}?`,
    diffRow: (r, c1, c2) => `De ${r[1]}, ¿cuántos más el ${c1} que el ${c2}?`,
    all: "¿Cuántos helados se vendieron en los tres días?",
  },
  {
    corner: "Mascota", across: "Clase", unit: "mascotas",
    rows: [["🐶", "perros"], ["🐱", "gatos"], ["🐟", "peces"], ["🐹", "hámsteres"]],
    cols: ["4.º A", "4.º B", "4.º C"],
    cell: (r, c) => `¿Cuántos ${r[1]} tienen los de ${c}?`,
    rowTot: (r) => `¿Cuántos ${r[1]} hay entre las tres clases?`,
    colTot: (c) => `¿Cuántas mascotas tienen los de ${c}?`,
    diffCol: (c, r1, r2) => `En ${c}, ¿cuántos ${r1[1]} más que ${r2[1]} hay?`,
    diffRow: (r, c1, c2) => `¿Cuántos ${r[1]} más hay en ${c1} que en ${c2}?`,
    all: "¿Cuántas mascotas hay en toda la tabla?",
  },
];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// Niveles: 0 leer una casilla · 1 total de una fila o columna ·
// 2 diferencia entre dos casillas · 3 total de la tabla · 4 la que falta.
export function buildRound(level) {
  const ctx = pick(CTX);
  const nR = level === 3 ? 3 : pick([3, 4]);
  const rows = shuffle(ctx.rows).slice(0, nR), cols = ctx.cols;
  const hi = [12, 15, 20, 9, 15][level];
  const r = randInt(0, nR - 1), c = randInt(0, cols.length - 1);
  let grid;
  // Para restar hace falta que la fila y la columna tengan números distintos.
  do grid = rows.map(() => cols.map(() => randInt(1, hi)));
  while (new Set(grid[r]).size < 2 || new Set(grid.map((g) => g[c])).size < 2);
  const R = (i) => rows[i][1], sumRow = (i) => grid[i].reduce((t, v) => t + v, 0);
  let q, want, hint, lit = { rows: [], cols: [], cells: [] }, missing = null;
  if (level === 0) {
    q = ctx.cell(rows[r], cols[c]); want = grid[r][c];
    hint = `Fila "${R(r)}", columna "${cols[c]}": ${want}`;
    lit = { rows: [r], cols: [c], cells: [[r, c]] };
  } else if (level === 1 && Math.random() < 0.5) {
    q = ctx.rowTot(rows[r]); want = sumRow(r);
    hint = `Sumo la fila "${R(r)}": ${grid[r].join(" + ")} = ${want}`;
    lit.rows = [r];
  } else if (level === 1) {
    const col = grid.map((g) => g[c]);
    q = ctx.colTot(cols[c]); want = col.reduce((t, v) => t + v, 0);
    hint = `Sumo la columna "${cols[c]}": ${col.join(" + ")} = ${want}`;
    lit.cols = [c];
  } else if (level === 2) {
    // Dos casillas distintas de la misma columna (o fila); la mayor primero.
    let a, b;
    const byCol = Math.random() < 0.5;
    do {
      a = byCol ? [randInt(0, nR - 1), c] : [r, randInt(0, cols.length - 1)];
      b = byCol ? [randInt(0, nR - 1), c] : [r, randInt(0, cols.length - 1)];
    } while ((a[0] === b[0] && a[1] === b[1]) || grid[a[0]][a[1]] === grid[b[0]][b[1]]);
    if (grid[a[0]][a[1]] < grid[b[0]][b[1]]) [a, b] = [b, a];
    const va = grid[a[0]][a[1]], vb = grid[b[0]][b[1]];
    q = byCol ? ctx.diffCol(cols[c], rows[a[0]], rows[b[0]]) : ctx.diffRow(rows[r], cols[a[1]], cols[b[1]]);
    want = va - vb;
    hint = byCol ? `Columna "${cols[c]}": ${R(a[0])} ${va} y ${R(b[0])} ${vb}; ${va} − ${vb} = ${want}` : `Fila "${R(r)}": ${cols[a[1]]} ${va} y ${cols[b[1]]} ${vb}; ${va} − ${vb} = ${want}`;
    lit = { rows: byCol ? [] : [r], cols: byCol ? [c] : [], cells: [a, b] };
  } else if (level === 3) {
    q = ctx.all; want = grid.flat().reduce((t, v) => t + v, 0);
    hint = `Sumo fila a fila: ${grid.map((g) => `(${g.join(" + ")})`).join(" + ")} = ${grid.map((_, i) => sumRow(i)).join(" + ")} = ${want}`;
    lit = { rows: grid.map((_, i) => i), cols: [], cells: [] };
  } else {
    q = "Falta un número en la tabla: ¿cuál es?"; want = grid[r][c]; missing = [r, c];
    const others = grid[r].filter((_, j) => j !== c);
    hint = `Fila "${R(r)}": el total es ${sumRow(r)}, así que falta ${sumRow(r)} − ${others.join(" − ")} = ${want}`;
    lit = { rows: [r], cols: [], cells: [[r, c]] };
  }
  return { ctx, rows, cols, grid, q, want, hint, lit, missing, total: level === 4 };
}

export function mountDobleentradaGame(container, { client, onExit }) {
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
    <div class="game-body db-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const onKey = (e) => {
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") { e.preventDefault(); pressKey("✓"); }
  };

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = "";
    busy = false;
    const { ctx, rows, cols, grid, missing, total } = round;
    const slot = `<button type="button" class="db-slot active" data-slot></button>`;
    const head = `<tr><th class="db-corner"><span>${ctx.across} →</span><span>${ctx.corner} ↓</span></th>${cols.map((c) => `<th>${c}</th>`).join("")}${total ? `<th class="db-tot">Total</th>` : ""}</tr>`;
    const trs = rows.map((r, i) => `<tr><th>${r[0]} ${cap(r[1])}</th>${grid[i]
      .map((v, j) => `<td data-r="${i}" data-c="${j}">${missing && missing[0] === i && missing[1] === j ? slot : v}</td>`)
      .join("")}${total ? `<td class="db-tot">${grid[i].reduce((t, v) => t + v, 0)}</td>` : ""}</tr>`);
    body.innerHTML = `
      <p class="prompt db-prompt">${round.q}</p>
      <table class="db-table">${head}${trs.join("")}</table>
      ${missing ? "" : `<div class="db-cuaderno db-ans">Respuesta: ${slot} <span>${ctx.unit}</span></div>`}
      <div class="keypad db-keypad" data-keypad></div>
      <div class="feedback db-feedback" data-feedback></div>
    `;
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    const slotEl = body.querySelector("[data-slot]");
    if (key === "✓") {
      if (typed !== "") return check();
      const fb = body.querySelector("[data-feedback]");
      fb.textContent = "Escribe el número en la casilla";
      fb.className = "feedback bad db-feedback";
      return;
    }
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 3) typed += key;
    slotEl.textContent = typed;
  }

  // Ilumina lo que había que mirar: filas, columnas y casillas clave.
  function light() {
    const { lit } = round;
    body.querySelectorAll("td[data-r]").forEach((td) => {
      const i = +td.dataset.r, j = +td.dataset.c;
      td.classList.toggle("db-hrow", lit.rows.includes(i));
      td.classList.toggle("db-hcol", lit.cols.includes(j));
      td.classList.toggle("db-hit", lit.cells.some(([a, b]) => a === i && b === j));
    });
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const slotEl = body.querySelector("[data-slot]");
    busy = true;
    rounds++;
    const ok = Number(typed) === round.want;
    slotEl.classList.remove("active");
    slotEl.classList.add(ok ? "good" : "bad");
    if (!ok) slotEl.innerHTML = `<s>${typed}</s><i class="db-fix">${round.want}</i>`;
    light();
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok db-feedback";
      pending = setTimeout(nextRound, 1100);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Era ${round.want}. 💡 ${round.hint} <button type="button" class="db-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad db-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 3000);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "dobleentrada", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📊</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} preguntas bien contestadas de ${rounds}</p>
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
