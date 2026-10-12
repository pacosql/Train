// "Multiplicación por celosía" (método árabe): la rejilla del libro con
// el primer factor arriba (una cifra por columna) y el segundo a la
// derecha (una cifra por fila). Cada celda está partida por su diagonal:
// la decena del producto va arriba a la izquierda y la unidad abajo a la
// derecha. Después se suma por diagonales empezando por abajo a la
// derecha, con llevada, y las sumas se escriben fuera de la rejilla
// (abajo y a la izquierda). El resultado se lee bajando por la izquierda
// y siguiendo por abajo. El foco avanza solo: celdas fila a fila
// (decena → unidad) y luego diagonales de derecha a izquierda.
import { randInt, saveScore } from "./utils.js";

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// Bandas diagonales: la m tiene la decena de las celdas con i + j = m y la
// unidad de las celdas con i + j + 1 = m. La última (C+R−1) son unidades.
export function lattice(top, side) {
  const C = top.length, R = side.length;
  const cells = [];
  side.forEach((b, i) => top.forEach((a, j) => cells.push({ i, j, a, b, t: Math.floor((a * b) / 10), u: (a * b) % 10 })));
  const bands = [];
  let carry = 0;
  for (let m = C + R - 1; m >= 0; m--) {
    const terms = [];
    cells.forEach((c) => {
      if (c.i + c.j + 1 === m) terms.push(c.u);
      if (c.i + c.j === m) terms.push(c.t);
    });
    const sum = terms.reduce((s, v) => s + v, 0) + carry;
    bands[m] = { terms, carryIn: carry, sum, digit: sum % 10 };
    carry = Math.floor(sum / 10);
  }
  return { cells, bands };
}

// Niveles: 0 dos cifras × una · 1 dos × dos · 2 tres × dos (sin llevadas
// al sumar las diagonales) · 3 dos o tres × dos con alguna llevada.
export function buildRound(level) {
  const C = level === 0 ? 2 : level === 1 ? 2 : level === 2 ? 3 : randInt(2, 3);
  const R = level === 0 ? 1 : 2;
  let top, side, L;
  for (;;) {
    top = Array.from({ length: C }, () => randInt(1, 9));
    side = Array.from({ length: R }, () => randInt(1, 9));
    L = lattice(top, side);
    const carries = L.bands.some((b) => b.sum >= 10);
    if (carries !== (level === 3)) continue;
    if (L.cells.every((c) => c.t === 0)) continue; // sin ninguna decena no se ve el método
    break;
  }
  const A = +top.join(""), B = +side.join(""), P = A * B;
  // Casillas en el orden de clase.
  const slots = [];
  L.cells.forEach((c, k) => {
    slots.push({ kind: "t", cell: k, want: String(c.t), blank: c.t === 0 ? "0" : undefined });
    slots.push({ kind: "u", cell: k, want: String(c.u) });
  });
  for (let m = C + R - 1; m >= 0; m--) slots.push({ kind: "s", band: m, want: String(L.bands[m].digit), blank: m === 0 && L.bands[0].digit === 0 ? "0" : undefined });
  const ex = L.cells.find((c) => c.t > 0);
  const sums = [];
  for (let m = C + R - 1; m >= 0; m--) {
    const b = L.bands[m];
    const parts = b.terms.concat(b.carryIn ? [b.carryIn] : []);
    let s = parts.length > 1 ? `${parts.join(" + ")} = ${b.sum}` : `${b.sum}`;
    if (b.sum >= 10) s += ` → ${b.digit} y me llevo ${Math.floor(b.sum / 10)}`;
    sums.push(s);
  }
  const hint = `En cada celda multiplico cifra por cifra (${ex.a} × ${ex.b} = ${ex.a * ex.b}: ${ex.t} arriba, ${ex.u} abajo) y luego sumo por diagonales desde la derecha: ${sums.join("; ")}. Se lee bajando: ${fmt(A)} × ${fmt(B)} = ${fmt(P)}`;
  return { top, side, C, R, A, B, P, cells: L.cells, bands: L.bands, slots, hint };
}

export function mountCelosiaGame(container, { client, onExit }) {
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
    <div class="game-body cl-body" data-body></div>
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
    else if (e.key === "Enter") pressKey("✓");
  };

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    const { C, R, top, side, cells, slots } = round;
    // Geometría (en px): celdas de S, márgenes para las cifras de fuera.
    const S = C === 2 ? 66 : 60, Lm = 42, T = 34, Rm = 36, B = 42;
    const W = Lm + C * S + Rm, H = T + R * S + B;
    const X = (x) => Lm + x * S, Y = (y) => T + y * S;
    const lines = [];
    for (let k = 0; k <= C; k++) lines.push(`<line class="cl-grid" x1="${X(k)}" y1="${Y(0)}" x2="${X(k)}" y2="${Y(R)}"/>`);
    for (let k = 0; k <= R; k++) lines.push(`<line class="cl-grid" x1="${X(0)}" y1="${Y(k)}" x2="${X(C)}" y2="${Y(k)}"/>`);
    // Diagonales x + y = s, alargadas por fuera hacia abajo a la izquierda.
    for (let s = 1; s <= C + R - 1; s++) {
      const [x1, y1] = s <= C ? [s, 0] : [C, s - C];
      const [x2, y2] = s <= R ? [0, s] : [s - R, R];
      lines.push(`<line class="cl-diag" x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2 - 0.62)}" y2="${Y(y2 + 0.62)}"/>`);
    }
    const at = (x, y, html, cls = "") => `<div class="cl-at ${cls}" style="left:${X(x)}px;top:${Y(y)}px">${html}</div>`;
    const pieces = [];
    top.forEach((d, j) => pieces.push(at(j + 0.5, -0.3, d, "cl-fixed")));
    side.forEach((d, i) => pieces.push(at(C + 0.3, i + 0.5, d, "cl-fixed")));
    pieces.push(at(C + 0.3, -0.3, "×", "cl-times"));
    slots.forEach((s, k) => {
      const btn = `<button type="button" class="cl-cell cl-slot${s.kind === "s" ? " cl-sum" : ""}" data-slot="${k}"></button>`;
      if (s.kind !== "s") {
        const c = cells[s.cell], o = s.kind === "t" ? 0.29 : 0.71;
        pieces.push(at(c.j + o, c.i + o, btn));
      } else if (s.band >= R) pieces.push(at(s.band - R + 0.2, R + 0.36, btn));
      else pieces.push(at(-0.34, s.band + 0.8, btn));
    });
    body.innerHTML = `
      <p class="prompt cl-prompt">Multiplica por celosía: <b>${fmt(round.A)} × ${round.B}</b></p>
      <div class="cl-cuaderno">
        <div class="cl-rejilla" style="width:${W}px;height:${H}px">
          <svg class="cl-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${lines.join("")}</svg>
          ${pieces.join("")}
        </div>
        <div class="cl-lee" data-lee></div>
      </div>
      <div class="keypad cl-keypad" data-keypad></div>
      <div class="feedback cl-feedback" data-feedback></div>
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
    const cur = round.slots[active];
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot, s = round.slots[k];
      if (!busy) b.textContent = typed[k];
      b.classList.toggle("active", !busy && k === active);
      // Resalta la diagonal que se está sumando (o la celda que se rellena).
      const same = !busy && (cur.kind === "s" ? s.kind === "s" ? false : bandOf(s) === cur.band : s.kind !== "s" && s.cell === cur.cell);
      b.classList.toggle("cl-glow", same);
    });
  }
  const bandOf = (s) => { const c = round.cells[s.cell]; return c.i + c.j + (s.kind === "u" ? 1 : 0); };

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    if (key === "⌫") {
      if (typed[active] === "" && active > 0) active--;
      typed[active] = "";
    } else {
      typed[active] = key;
      if (active < typed.length - 1) active++;
    }
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const missing = typed.findIndex((t, i) => t === "" && round.slots[i].blank === undefined);
    if (missing >= 0) {
      active = missing;
      paint();
      feedback.textContent = "Faltan casillas por rellenar";
      feedback.className = "feedback bad cl-feedback";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot, s = round.slots[k];
      const ok = (typed[k] || s.blank) === s.want;
      allOk = allOk && ok;
      b.classList.add(ok ? "good" : "bad");
      if (ok) b.textContent = typed[k];
      else b.innerHTML = `<s>${typed[k]}</s><i class="cl-fix">${s.want}</i>`;
    });
    paint();
    body.querySelector("[data-lee]").textContent = `Se lee: ${fmt(round.P)}`;
    const text = `${fmt(round.A)} × ${fmt(round.B)} = ${fmt(round.P)}`;
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${text}. 💡 ${round.hint}`;
      feedback.className = "feedback ok cl-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Era ${text}. 💡 ${round.hint} <button type="button" class="cl-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad cl-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 3500);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "celosia", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔢</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} celosías bien hechas de ${rounds}</p>
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
