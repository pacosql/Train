// "La cuadrícula del 100": una cuadrícula 10×10. Rondas alternas:
// (a) "Pinta el 35 %": se arrastra el dedo (o se toca casilla a casilla),
//     contador en vivo "35/100" y ✓;
// (b) la cuadrícula aparece pintada y se pide qué parte hay pintada con el
//     teclado, en el formato indicado (porcentaje / decimal / centésimas).
// Niveles: decenas enteras → cualquier número → decimales y fracciones →
// "pinta 1/4" y "pinta 0,6". 5º-1º ESO.
import { randInt, pick, saveScore } from "./utils.js";

const FRACS = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [1, 20], [1, 25], [1, 50]];
export const dec = (c) => `0,${String(c).padStart(2, "0")}`;

// Nivel y tipo ("paint" | "read") → ronda con la cantidad `count` (0-100).
export function buildRound(level, type) {
  const count = level === 0 ? randInt(1, 9) * 10 : randInt(1, 99);
  if (type === "paint") {
    if (level === 3) {
      if (Math.random() < 0.5) {
        const [p, q] = pick(FRACS);
        return { type, count: (100 * p) / q, fmt: "frac", ask: `${p}/${q}`, p, q };
      }
      const c = randInt(1, 9) * 10;
      return { type, count: c, fmt: "dec", ask: `0,${c / 10}` };
    }
    const fmt = level === 2 ? pick(["pct", "dec", "cent"]) : "pct";
    return { type, count, fmt, ask: fmt === "pct" ? `el ${count} %` : fmt === "dec" ? dec(count) : `${count}/100` };
  }
  const fmt = level <= 1 ? "pct" : pick(["pct", "dec", "cent"]);
  return { type, count, fmt };
}

export function hintFor(r) {
  const base = `${r.count} de 100 = ${r.count}/100 = ${dec(r.count)} = ${r.count} %`;
  return r.fmt === "frac" ? `${r.p}/${r.q} de 100 = 100 ÷ ${r.q} × ${r.p} = ${r.count} → ${base}` : base;
}
const FMT_LABEL = { pct: "como porcentaje", dec: "como decimal", cent: "en centésimas" };

export function mountCienGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let hits = 0;
  let finished = false;
  let busy = false;
  let pending = null;
  let round = null;
  let painted = [];
  let typed = "";

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body ci-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const gridHtml = (on, cls = "on") =>
    Array.from({ length: 100 }, (_, i) => `<span class="ci-cell${i < on ? ` ${cls}` : ""}" data-i="${i}"></span>`).join("");

  function nextRound() {
    const type = rounds % 2 === 0 ? "paint" : "read";
    round = buildRound(Math.min(3, Math.floor(hits / 3)), type);
    painted = Array(100).fill(false);
    typed = "";
    busy = false;
    if (type === "paint") {
      body.innerHTML = `
        <p class="prompt ci-prompt">Pinta ${round.ask}<small>Arrastra el dedo o toca casillas</small></p>
        <div class="ci-grid" data-grid>${gridHtml(0)}</div>
        <div class="ci-count"><b data-count>0</b>/100</div>
        <button type="button" class="primary ci-check" data-check>✓</button>
        <div class="feedback" data-feedback></div>
      `;
      bindPaint(body.querySelector("[data-grid]"));
      body.querySelector("[data-check]").addEventListener("click", () => check(painted.filter(Boolean).length));
      return;
    }
    body.innerHTML = `
      <p class="prompt ci-prompt">¿Qué parte está pintada?<small>Escríbelo ${FMT_LABEL[round.fmt]}</small></p>
      <div class="ci-grid ci-static" data-grid>${gridHtml(round.count)}</div>
      <div class="keypad-display ci-display" data-display></div>
      <div class="keypad ci-keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
    `;
    showTyped();
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
  }

  // Pintar arrastrando: la primera casilla decide si se pinta o se borra.
  function bindPaint(grid) {
    let mode = null;
    const apply = (x, y) => {
      const cell = document.elementFromPoint(x, y)?.closest?.(".ci-cell");
      if (!cell || !grid.contains(cell)) return;
      const i = Number(cell.dataset.i);
      if (mode === null) mode = !painted[i];
      painted[i] = mode;
      cell.classList.toggle("on", mode);
      body.querySelector("[data-count]").textContent = painted.filter(Boolean).length;
    };
    grid.addEventListener("pointerdown", (e) => {
      if (busy || finished) return;
      e.preventDefault();
      grid.setPointerCapture(e.pointerId);
      mode = null;
      apply(e.clientX, e.clientY);
    });
    grid.addEventListener("pointermove", (e) => {
      if (mode !== null && !busy && !finished) apply(e.clientX, e.clientY);
    });
    const stop = () => (mode = null);
    grid.addEventListener("pointerup", stop);
    grid.addEventListener("pointercancel", stop);
  }

  function showTyped() {
    const t = typed || "_";
    body.querySelector("[data-display]").textContent =
      round.fmt === "pct" ? `${t} %` : round.fmt === "dec" ? `0,${t}` : `${t}/100`;
  }
  function pressKey(key) {
    if (busy || finished) return;
    if (key === "✓") {
      if (typed === "") return;
      // Como decimal se escriben las cifras tras "0,": "35" → 0,35; "3" → 0,30.
      return check(round.fmt === "dec" ? Math.round(Number(`0.${typed}`) * 100) : Number(typed));
    }
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 2) typed += key;
    showTyped();
  }

  function check(value) {
    if (busy || finished) return;
    busy = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const tip = `<span class="ci-tip">💡 ${hintFor(round)}</span>`;
    if (value === round.count) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `¡Bien! ${tip}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
      return;
    }
    lives--;
    renderLives();
    // Lo correcto en verde sobre el propio dibujo.
    const grid = body.querySelector("[data-grid]");
    if (round.type === "paint") grid.innerHTML = gridHtml(round.count, "good");
    const label = round.fmt === "dec" ? dec(round.count) : round.fmt === "cent" ? `${round.count}/100` : `${round.count} %`;
    grid.insertAdjacentHTML("beforeend", `<div class="ci-reveal">${label}</div>`);
    feedback.innerHTML = `Era ${label}, no ${round.fmt === "dec" ? dec(value) : value} ${tip}`;
    feedback.className = "feedback bad";
    pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "cien", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>💯</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cuadrículas acertadas</p>
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
