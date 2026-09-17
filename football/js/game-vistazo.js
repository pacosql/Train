// "¿Cuál es más grande?": comparar el tamaño de 3 ángulos A OJO, sin
// transportador ni ningún grado a la vista. Solo al fallar se revela una
// comparación visual (los 3 ángulos superpuestos desde el mismo
// vértice) — nunca un número.
import { randInt, saveScore } from "./utils.js";

const MIN_DEG = 15;
const MAX_DEG = 165;
const MIN_GAP = 12;
const LETTERS = ["A", "B", "C"];
const COLORS = ["var(--accent)", "var(--accent-2)", "#f5a623"];

// Genera los 3 valores de ángulo (en grados) de una ronda: siempre en
// [15,165], siempre distintos entre sí, y con al menos 12° de diferencia
// entre cada par de valores consecutivos una vez ordenados. Sin DOM: se
// puede importar y probar directamente desde Node.
export function generateVistazoRound() {
  for (let guard = 0; guard < 1000; guard++) {
    const angles = [
      randInt(MIN_DEG, MAX_DEG),
      randInt(MIN_DEG, MAX_DEG),
      randInt(MIN_DEG, MAX_DEG),
    ];
    const sorted = [...angles].sort((a, b) => a - b);
    if (sorted[1] - sorted[0] >= MIN_GAP && sorted[2] - sorted[1] >= MIN_GAP) {
      return angles;
    }
  }
  // Fallback teóricamente inalcanzable (la probabilidad de fallo tras
  // 1000 intentos es astronómicamente pequeña), pero deja la función
  // total por si acaso: valores fijos que sí cumplen las reglas.
  return [30, 60, 100];
}

function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

// Muestrea puntos entre dos ángulos (en el mismo radio) para dibujar el
// pequeño arco de apertura sin depender de los flags del comando SVG "A".
function arcPoints(cx, cy, r, a1, a2, steps = 16) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = a1 + ((a2 - a1) * i) / steps;
    const p = polar(cx, cy, r, t);
    pts.push(`${p.x.toFixed(2)},${p.y.toFixed(2)}`);
  }
  return pts.join(" ");
}

// Dibuja un ángulo aislado: dos semirrectas del mismo radio (82px sobre
// un viewBox de 200) que salen de un vértice común, rotadas al azar en
// conjunto para que la orientación no delate el tamaño.
function angleSvg(value, rotation, color) {
  const cx = 100, cy = 100, R = 82;
  const p1 = polar(cx, cy, R, rotation);
  const p2 = polar(cx, cy, R, rotation + value);
  const arc = arcPoints(cx, cy, 28, rotation, rotation + value);
  return `
    <svg viewBox="0 0 200 200" class="vst-svg" aria-hidden="true">
      <polyline points="${arc}" class="vst-arc" style="stroke:${color}" fill="none"></polyline>
      <line x1="${cx}" y1="${cy}" x2="${p1.x.toFixed(2)}" y2="${p1.y.toFixed(2)}" style="stroke:${color}"></line>
      <line x1="${cx}" y1="${cy}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}" style="stroke:${color}"></line>
      <circle cx="${cx}" cy="${cy}" r="4" style="fill:${color}"></circle>
    </svg>
  `;
}

// Al fallar: los 3 ángulos superpuestos desde el mismo vértice, con una
// semirrecta común compartida (0°) y sin rotación relativa entre ellos,
// para que el tamaño real se vea de un vistazo. Cada uno con su color.
function overlaySvg(slots) {
  const cx = 100, cy = 100, R = 82;
  const base = polar(cx, cy, R, 0);
  const parts = slots
    .map((s, i) => {
      const p2 = polar(cx, cy, R, s.value);
      const arc = arcPoints(cx, cy, 22 + i * 12, 0, s.value);
      return `
        <polyline points="${arc}" class="vst-arc" style="stroke:${s.color}" fill="none"></polyline>
        <line x1="${cx}" y1="${cy}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}" style="stroke:${s.color}"></line>
      `;
    })
    .join("");
  return `
    <svg viewBox="0 0 200 200" class="vst-svg vst-overlay-svg" aria-hidden="true">
      <line x1="${cx}" y1="${cy}" x2="${base.x.toFixed(2)}" y2="${base.y.toFixed(2)}" class="vst-base-ray"></line>
      ${parts}
      <circle cx="${cx}" cy="${cy}" r="4" fill="var(--text)"></circle>
    </svg>
  `;
}

export function mountVistazoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let timers = [];
  let slots = [];
  let tapped = [];
  let locked = false;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");

  function later(fn, ms) {
    timers.push(setTimeout(() => { if (!finished) fn(); }, ms));
  }

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    const angles = generateVistazoRound();
    slots = angles.map((value, i) => ({
      idx: i,
      letter: LETTERS[i],
      value,
      rotation: randInt(0, 359),
      color: COLORS[i],
    }));
    tapped = [];
    locked = false;

    body.innerHTML = `
      <p class="prompt">Toca los 3 ángulos <b>de menor a mayor</b>
        <small>1º el más pequeño · 2º el mediano · 3º el más grande — a ojo, sin medir</small>
      </p>
      <div class="vst-row" data-row>
        ${slots
          .map(
            (s) => `
          <button class="vst-slot" data-slot="${s.idx}" style="--vst-c:${s.color}">
            ${angleSvg(s.value, s.rotation, s.color)}
            <span class="vst-badge" data-badge></span>
            <span class="vst-label">${s.letter}</span>
          </button>
        `
          )
          .join("")}
      </div>
      <div class="feedback" data-feedback></div>
      <div class="vst-overlay" data-overlay hidden></div>
    `;

    body.querySelectorAll("[data-slot]").forEach((btn) => {
      btn.addEventListener("click", () => onTap(Number(btn.dataset.slot), btn));
    });
  }

  function onTap(slotIdx, btn) {
    if (finished || locked) return;
    if (tapped.includes(slotIdx)) return;
    tapped.push(slotIdx);
    btn.classList.add("vst-tapped");
    const badge = btn.querySelector("[data-badge]");
    badge.textContent = String(tapped.length);
    badge.classList.add("vst-show");
    if (tapped.length === slots.length) {
      locked = true;
      evaluate();
    }
  }

  function evaluate() {
    rounds++;
    const row = body.querySelector("[data-row]");
    if (row) row.classList.add("vst-locked");
    const correctOrder = slots
      .slice()
      .sort((a, b) => a.value - b.value)
      .map((s) => s.idx);
    const isCorrect = tapped.every((v, i) => v === correctOrder[i]);
    const feedback = body.querySelector("[data-feedback]");
    if (isCorrect) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Bien visto! Ese era el orden de menor a mayor.";
      feedback.className = "feedback ok";
      later(nextRound, 1100);
    } else {
      lives--;
      renderLives();
      const orderLetters = correctOrder.map((i) => slots[i].letter).join(", ");
      feedback.textContent = `De menor a mayor eran: ${orderLetters}`;
      feedback.className = "feedback bad";
      showOverlay();
      if (lives <= 0) return later(() => finish(false), 2400);
      later(nextRound, 2400);
    }
  }

  function showOverlay() {
    const overlay = body.querySelector("[data-overlay]");
    if (!overlay) return;
    overlay.hidden = false;
    overlay.innerHTML = `
      <p class="vst-overlay-title">Mismo vértice, para comparar el tamaño real:</p>
      ${overlaySvg(slots)}
      <div class="vst-legend">
        ${slots.map((s) => `<span class="vst-legend-item" style="color:${s.color}">● ${s.letter}</span>`).join("")}
      </div>
    `;
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "vistazo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>👀</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} tríos ordenados</p>
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
    timers = [];
    lives = startLives;
    score = 0;
    rounds = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
  };
}
