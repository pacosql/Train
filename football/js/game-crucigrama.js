// "Crucigrama de cuentas": la cuadrícula 5×5 del cuaderno con tres cuentas
// en las filas (a + b = c) y tres en las columnas, las cuatro celdas negras
// y 3-5 casillas vacías sobre papel cuadriculado que se rellenan con el
// teclado. El 💡 enseña la fila (o columna) con la que se deduce cada hueco
// y comprueba la otra cuenta que pasa por él.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const calc = (op, a, b) => (op === "+" ? a + b : op === "−" ? a - b : a * b);
// Las nueve celdas numéricas en orden de lectura (fila, columna).
const NUM = [[0, 0], [0, 2], [0, 4], [2, 0], [2, 2], [2, 4], [4, 0], [4, 2], [4, 4]];
const idx = (r, c) => NUM.findIndex(([a, b]) => a === r && b === c);

// Las seis cuentas: las tres filas llevan la operación R y las tres
// columnas la C (la fila de abajo suma/resta los resultados de las
// columnas y la columna de la derecha los de las filas; la esquina cuadra
// por los dos lados: (a + b) − (c + d) = (a − c) + (b − d)).
function equations(R, C) {
  const eqs = [];
  for (let r = 0; r < 3; r++) eqs.push({ cells: [r * 3, r * 3 + 1, r * 3 + 2], op: R, dir: "fila" });
  for (let c = 0; c < 3; c++) eqs.push({ cells: [c, c + 3, c + 6], op: C, dir: "columna" });
  return eqs;
}

// Resuelve por propagación: una cuenta con un solo hueco lo determina.
// Devuelve, en orden de deducción, cada hueco con la cuenta que lo resuelve.
function solve(vals, holes, eqs) {
  const known = vals.map((_, i) => !holes.includes(i));
  const steps = [];
  for (let progress = true; progress; ) {
    progress = false;
    for (const eq of eqs) {
      const unknown = eq.cells.filter((i) => !known[i]);
      if (unknown.length !== 1) continue;
      known[unknown[0]] = true;
      steps.push({ cell: unknown[0], eq });
      progress = true;
    }
  }
  return steps.length === holes.length ? steps : null;
}

// Texto de una cuenta con el hueco marcado: "12 + □ = 20 → 8".
function eqText(vals, eq, cell) {
  const [p, q, r] = eq.cells;
  const t = (i) => (i === cell ? "□" : vals[i]);
  return `${t(p)} ${eq.op} ${t(q)} = ${t(r)} → ${vals[cell]}`;
}

// Niveles: 0 sumas y restas de una cifra · 1 dos cifras · 2 dos cifras con
// cuatro huecos · 3 con multiplicaciones · 4 dos cifras con cinco huecos.
export function buildRound(level) {
  const nHoles = level === 0 || level === 1 ? 3 : level === 4 ? 5 : level === 3 ? 3 : 4;
  for (;;) {
    const R = level === 3 ? "×" : pick(["+", "−"]);
    const C = level === 3 ? "×" : pick(["+", "−"]);
    const [lo, hi] = level === 0 ? [1, 9] : level === 3 ? [2, 6] : level === 1 ? [10, 60] : [10, 99];
    const a = randInt(lo, hi), b = randInt(lo, hi), c = randInt(lo, hi), d = randInt(lo, hi);
    const vals = [a, b, calc(R, a, b), c, d, calc(R, c, d), calc(C, a, c), calc(C, b, d), 0];
    vals[8] = calc(R, vals[6], vals[7]);
    if (vals.some((v) => v < 1 || v > 999)) continue; // sin negativos, sin ceros, sin cuatro cifras
    if (calc(C, vals[2], vals[5]) !== vals[8]) continue; // la esquina debe cuadrar por fila y por columna
    const eqs = equations(R, C);
    const holes = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, nHoles).sort((x, y) => x - y);
    const steps = solve(vals, holes, eqs);
    if (!steps) continue;
    // 💡: la primera deducción con su comprobación cruzada, y el resto en corto.
    const first = steps[0];
    const other = eqs.find((e) => e !== first.eq && e.cells.includes(first.cell));
    const [p, q, r] = other.cells;
    const parts = [
      `En la ${first.eq.dir}: ${eqText(vals, first.eq, first.cell)}; compruebo la ${other.dir}: ${vals[p]} ${other.op} ${vals[q]} = ${vals[r]} ✓`,
      ...steps.slice(1).map((s) => `${s.eq.dir}: ${eqText(vals, s.eq, s.cell)}`),
    ];
    // Los huecos se recorren en el orden en que se deducen.
    return { R, C, vals, holes: steps.map((s) => s.cell), hint: parts.join(" · ") };
  }
}

export function mountCrucigramaGame(container, { client, onExit }) {
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
    <div class="game-body cg-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const want = () => round.holes.map((i) => round.vals[i]);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.holes.map(() => "");
    active = 0;
    busy = false;
    fresh = false;
    const cell = (r, c) => {
      if (r % 2 === 0 && c % 2 === 0) {
        const n = idx(r, c), h = round.holes.indexOf(n);
        return h === -1
          ? `<span class="cg-cell cg-num">${round.vals[n]}</span>`
          : `<button type="button" class="cg-cell cg-slot" data-slot="${h}"></button>`;
      }
      if (r % 2 === 0) return `<span class="cg-cell cg-op">${c === 3 ? "=" : round.R}</span>`;
      if (c % 2 === 0) return `<span class="cg-cell cg-op${r === 3 ? " cg-veq" : ""}">${r === 3 ? "=" : round.C}</span>`;
      return `<span class="cg-cell cg-black"></span>`;
    };
    body.innerHTML = `
      <p class="prompt cg-prompt">Completa el crucigrama de cuentas</p>
      <div class="cg-cuaderno cg-sheet">
        <div class="cg-grid">${Array.from({ length: 25 }, (_, i) => cell(Math.floor(i / 5), i % 5)).join("")}</div>
      </div>
      <div class="keypad cg-keypad" data-keypad></div>
      <div class="feedback cg-feedback" data-feedback></div>
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
      if (typed[active].length >= String(want()[active]).length) {
        const e = nextEmpty();
        if (e !== -1) active = e;
      }
    }
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    const w = want();
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const i = +b.dataset.slot;
      const ok = Number(typed[i]) === w[i];
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[i]}</s><b>${w[i]}</b>`;
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
      feedback.innerHTML = `💡 ${round.hint}${lives > 0 ? ' <button type="button" class="secondary cg-next" data-next>Siguiente →</button>' : ""}`;
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
    saveScore(client, "crucigrama", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔢</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} crucigramas completos de ${rounds}</p>
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
