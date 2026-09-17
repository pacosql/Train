// "Golpe de vista": subitización — un flash breve de puntos y hay que
// adivinar cuántos había sin tiempo de contarlos uno a uno. El reto real
// está en el tiempo de exposición, que baja con la racha de aciertos.
import { randInt, saveScore } from "./utils.js";

const MIN_COUNT = 3;
const MAX_COUNT = 9;
const FLASH_START_MS = 700;
const FLASH_MIN_MS = 350;
const FLASH_STEP_MS = 100; // baja por cada 2 aciertos seguidos
const FLASH_AREA_W = 260;
const FLASH_AREA_H = 200;
const DOT_R = 16; // radio visual de cada punto
const MIN_GAP = 6; // separación mínima extra entre bordes de puntos
const PLACE_ATTEMPTS = 60; // intentos por punto antes de reducir el radio
const COLORS = ["#5b3ecc", "#2ea3c4", "#e5484d", "#16a34a", "#f5a623", "#c33ea6"];

// Coloca `count` puntos sin solape dentro de un área w×h, con radio `r` y
// separación mínima `minGap` entre bordes. Devuelve [{x,y}] (centros).
// Estrategia: intento aleatorio con guarda; si tras muchos intentos no cabe
// un punto, se reduce el radio efectivo un poco (rejilla de reserva
// implícita: al final siempre hay hueco porque el radio decrece).
export function placeDots(count, w = FLASH_AREA_W, h = FLASH_AREA_H, r = DOT_R, minGap = MIN_GAP) {
  const points = [];
  let radius = r;
  let guardShrink = 0;
  while (points.length < count && guardShrink < 20) {
    const needed = radius + minGap;
    let placedThisPoint = false;
    for (let attempt = 0; attempt < PLACE_ATTEMPTS; attempt++) {
      const x = radius + Math.random() * (w - radius * 2);
      const y = radius + Math.random() * (h - radius * 2);
      const minDist = radius * 2 + minGap;
      const overlaps = points.some((p) => {
        const dx = p.x - x;
        const dy = p.y - y;
        return Math.sqrt(dx * dx + dy * dy) < minDist;
      });
      if (!overlaps) {
        points.push({ x, y, r: radius });
        placedThisPoint = true;
        break;
      }
    }
    if (!placedThisPoint) {
      // No cupo con este radio: encoge un poco todos los futuros puntos
      // (rejilla de reserva de facto) y reintenta desde donde iba.
      radius = Math.max(6, radius - 1);
      guardShrink++;
      if (radius <= 6 && points.length < count) {
        // Último recurso: coloca en rejilla regular con el radio mínimo,
        // garantizando terminar aunque el área esté muy llena.
        const cols = Math.ceil(Math.sqrt(count));
        const cellW = w / cols;
        const cellH = h / Math.ceil(count / cols);
        points.length = 0;
        for (let i = 0; i < count; i++) {
          const cx = (i % cols) * cellW + cellW / 2;
          const cy = Math.floor(i / cols) * cellH + cellH / 2;
          points.push({ x: cx, y: cy, r: Math.min(6, cellW / 2 - 2, cellH / 2 - 2) });
        }
        return points;
      }
    }
  }
  return points;
}

export function mountGolpevistaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let streak = 0;
  let flashMs = FLASH_START_MS;
  let lastCount = -1;
  let currentCount = 0;
  let currentDots = [];
  let answered = false;
  const timers = [];

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

  // Pinta los puntos en posiciones pseudoaleatorias (para el flash) o
  // agrupados en filas iguales (para la revisión tras acertar/fallar).
  function renderDotsFlash(dots) {
    return dots.map((d) => `
      <span class="gv-dot" style="left:${d.x - d.r}px;top:${d.y - d.r}px;width:${d.r * 2}px;height:${d.r * 2}px;background:${pickColorFor(d)}"></span>
    `).join("");
  }

  function pickColorFor(d) {
    if (!d.color) d.color = COLORS[randInt(0, COLORS.length - 1)];
    return d.color;
  }

  function renderDotsGrouped(count) {
    // Filas de máximo 3 para que el conteo visual sea trivial.
    const perRow = 3;
    const rowsCount = Math.ceil(count / perRow);
    let html = '<div class="gv-grouped">';
    let remaining = count;
    for (let row = 0; row < rowsCount; row++) {
      const inRow = Math.min(perRow, remaining);
      html += '<div class="gv-row">';
      for (let i = 0; i < inRow; i++) {
        html += `<span class="gv-dot gv-dot-static" style="background:${COLORS[(row * perRow + i) % COLORS.length]}"></span>`;
      }
      html += "</div>";
      remaining -= inRow;
    }
    html += "</div>";
    return html;
  }

  function nextRound() {
    answered = false;
    do {
      currentCount = randInt(MIN_COUNT, MAX_COUNT);
    } while (currentCount === lastCount);
    lastCount = currentCount;
    currentDots = placeDots(currentCount, FLASH_AREA_W, FLASH_AREA_H, DOT_R, MIN_GAP);

    body.innerHTML = `
      <p class="prompt">¿Cuántos puntos verás?<small>Pulsa "¡Ya!" cuando estés listo — el flash es muy breve</small></p>
      <div class="gv-stage" data-stage>
        <button class="primary gv-ready-btn" data-ready type="button">¡Ya!</button>
      </div>
      <div class="feedback" data-feedback></div>
    `;
    body.querySelector("[data-ready]").addEventListener("click", startFlash);
  }

  function startFlash() {
    if (finished) return;
    const stage = body.querySelector("[data-stage]");
    stage.innerHTML = `<div class="gv-flash-area" data-flash-area>${renderDotsFlash(currentDots)}</div>`;
    later(() => showKeypad(), flashMs);
  }

  function showKeypad() {
    if (finished) return;
    const stage = body.querySelector("[data-stage]");
    if (!stage) return;
    stage.innerHTML = `
      <div class="gv-flash-area gv-empty" data-flash-area></div>
      <div class="gv-keypad" data-keypad></div>
    `;
    const keypad = stage.querySelector("[data-keypad]");
    for (let n = 0; n <= MAX_COUNT; n++) {
      const btn = document.createElement("button");
      btn.className = "choice-btn gv-key-btn";
      btn.type = "button";
      btn.textContent = String(n);
      btn.addEventListener("click", () => answer(n));
      keypad.appendChild(btn);
    }
  }

  function answer(n) {
    if (finished || answered) return;
    answered = true;
    rounds++;
    const stage = body.querySelector("[data-stage]");
    const feedback = body.querySelector("[data-feedback]");
    if (stage) {
      stage.querySelectorAll(".gv-key-btn").forEach((b) => (b.disabled = true));
    }
    if (n === currentCount) {
      score += 10;
      streak++;
      renderScore();
      if (streak % 2 === 0) {
        flashMs = Math.max(FLASH_MIN_MS, flashMs - FLASH_STEP_MS);
      }
      if (stage) stage.querySelector("[data-flash-area]").innerHTML = renderDotsGrouped(currentCount);
      feedback.textContent = `¡Correcto! Eran ${currentCount} — cuéntalos ahora con calma, sin prisa`;
      feedback.className = "feedback ok";
      later(nextRound, 1400);
    } else {
      streak = 0;
      flashMs = FLASH_START_MS;
      lives--;
      renderLives();
      if (stage) stage.querySelector("[data-flash-area]").innerHTML = renderDotsGrouped(currentCount);
      feedback.textContent = `Había ${currentCount} y respondiste ${n} — mira el grupo y compara`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1600);
      later(nextRound, 1600);
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "golpevista", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>👁️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} golpes de vista</p>
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
    finished = false;
    streak = 0;
    flashMs = FLASH_START_MS;
    lastCount = -1;
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
