// "Vistazo relámpago": subitizing — un patrón de puntos aparece en
// posiciones aleatorias durante un tiempo MUY breve y desaparece del
// todo. Hay que reconocer cuántos había "de un vistazo", sin tiempo de
// contarlos uno a uno. La dificultad real está en el tiempo de
// exposición (baja con la racha de aciertos), no en la cantidad de
// puntos, que siempre es aleatoria entre 3 y 9.
import { randInt, clamp, saveScore } from "./utils.js";

const MIN_COUNT = 3;
const MAX_COUNT = 9;

const EXPOSURE_START_MS = 900;
const EXPOSURE_MIN_MS = 500;
const EXPOSURE_STEP_MS = 50; // se resta uno por cada acierto en racha

const AREA_W = 260;
const AREA_H = 200;
const DOT_R = 16; // radio visual de cada punto
const MIN_GAP = 6; // separación mínima extra entre bordes de puntos
const RANDOM_ATTEMPTS_PER_DOT = 400; // reintentos aleatorios antes de rendirse
const RANDOM_OUTER_RETRIES = 30; // reintentos completos de la ronda entera

const COLORS = ["#5b3ecc", "#2ea3c4", "#e5484d", "#16a34a", "#f5a623", "#c33ea6"];

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Intenta colocar `count` puntos sin solape (distancia mínima entre
// centros = 2r + minGap) mediante muestreo aleatorio con reintentos.
// Devuelve null si no lo consigue en el presupuesto de intentos dado.
function tryRandomPlacement(count, w, h, r, minGap) {
  const minDist = 2 * r + minGap;
  const points = [];
  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let attempt = 0; attempt < RANDOM_ATTEMPTS_PER_DOT; attempt++) {
      const candidate = {
        x: r + Math.random() * (w - 2 * r),
        y: r + Math.random() * (h - 2 * r),
      };
      if (points.every((p) => dist(p, candidate) >= minDist)) {
        points.push(candidate);
        placed = true;
        break;
      }
    }
    if (!placed) return null;
  }
  return points;
}

// Reparto de emergencia, matemáticamente garantizado: los puntos sobre
// un círculo centrado en el área, con separación angular igual. La
// cuerda entre dos puntos adyacentes de un polígono regular de `count`
// lados y radio Rc mide 2*Rc*sin(pi/count); despejando Rc para que esa
// cuerda sea >= minDist garantiza la distancia mínima entre CUALQUIER
// par (los adyacentes son los más próximos en un polígono regular).
// Con count entre 3 y 9 y las medidas de AREA_W/AREA_H/DOT_R/MIN_GAP de
// este juego, Rc siempre cabe de sobra dentro del área — así que este
// fallback nunca hace falta en la práctica, pero deja la función total.
function circlePlacement(count, w, h, r, minGap) {
  const minDist = 2 * r + minGap;
  const rc = minDist / (2 * Math.sin(Math.PI / count));
  const cx = w / 2;
  const cy = h / 2;
  const points = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count;
    points.push({ x: cx + rc * Math.cos(angle), y: cy + rc * Math.sin(angle) });
  }
  return points;
}

// Coloca `count` puntos sin solape dentro de un área w×h. Sin DOM: se
// puede importar y probar directamente desde Node.
export function placeDots(count, w = AREA_W, h = AREA_H, r = DOT_R, minGap = MIN_GAP) {
  for (let outer = 0; outer < RANDOM_OUTER_RETRIES; outer++) {
    const points = tryRandomPlacement(count, w, h, r, minGap);
    if (points) return points;
  }
  return circlePlacement(count, w, h, r, minGap);
}

// Genera una ronda completa (cantidad + posiciones) sin tocar el DOM,
// para poder simularla en Node miles de veces.
export function generateFlashRound() {
  const count = randInt(MIN_COUNT, MAX_COUNT);
  const dots = placeDots(count, AREA_W, AREA_H, DOT_R, MIN_GAP);
  return { count, dots, r: DOT_R, minGap: MIN_GAP };
}

// Tiempo de exposición según la racha de aciertos CONSECUTIVOS previa a
// la ronda (0 tras fallar o al empezar): 900ms, baja 50ms por acierto
// en racha, nunca por debajo de 500ms ni por encima de 900ms.
export function computeExposureMs(streak) {
  return clamp(EXPOSURE_START_MS - streak * EXPOSURE_STEP_MS, EXPOSURE_MIN_MS, EXPOSURE_START_MS);
}

export function mountFlashGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let streak = 0;
  let exposureMs = EXPOSURE_START_MS;
  let round = null;
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

  function dotsHtml(dots) {
    return dots
      .map(
        (d, i) => `
      <span class="fls-dot" style="left:${(d.x - DOT_R).toFixed(1)}px;top:${(d.y - DOT_R).toFixed(1)}px;width:${DOT_R * 2}px;height:${DOT_R * 2}px;background:${COLORS[i % COLORS.length]}"></span>
    `
      )
      .join("");
  }

  function nextRound() {
    answered = false;
    round = generateFlashRound();

    body.innerHTML = `
      <p class="prompt">¿Cuántos puntos verás?<small>Pulsa "¡Ya!" cuando estés listo — desaparecen muy rápido</small></p>
      <div class="fls-stage" data-stage>
        <button class="primary fls-ready-btn" data-ready type="button">¡Ya!</button>
      </div>
      <div class="feedback" data-feedback></div>
    `;
    body.querySelector("[data-ready]").addEventListener("click", startFlash);
  }

  function startFlash() {
    if (finished) return;
    const stage = body.querySelector("[data-stage]");
    if (!stage) return;
    stage.innerHTML = `<div class="fls-area" data-area>${dotsHtml(round.dots)}</div>`;
    later(showKeypad, exposureMs);
  }

  function showKeypad() {
    if (finished) return;
    const stage = body.querySelector("[data-stage]");
    if (!stage) return;
    stage.innerHTML = `
      <div class="fls-area fls-empty" data-area></div>
      <div class="fls-keypad" data-keypad></div>
    `;
    const keypad = stage.querySelector("[data-keypad]");
    for (let n = 0; n <= MAX_COUNT; n++) {
      const btn = document.createElement("button");
      btn.className = "choice-btn fls-key";
      btn.type = "button";
      btn.setAttribute("data-digit", String(n));
      btn.textContent = String(n);
      btn.addEventListener("click", () => answer(n));
      keypad.appendChild(btn);
    }
  }

  function answer(n) {
    if (finished || answered) return;
    answered = true;
    const stage = body.querySelector("[data-stage]");
    const feedback = body.querySelector("[data-feedback]");
    if (stage) stage.querySelectorAll("[data-digit]").forEach((b) => (b.disabled = true));

    if (n === round.count) {
      rounds++;
      score += 10;
      streak++;
      exposureMs = computeExposureMs(streak);
      renderScore();
      feedback.textContent = `¡Correcto! Eran ${round.count} puntos.`;
      feedback.className = "feedback ok";
      later(nextRound, 1100);
    } else {
      streak = 0;
      exposureMs = computeExposureMs(streak);
      lives--;
      renderLives();
      feedback.textContent = `Había ${round.count} y respondiste ${n} — mira con calma y cuéntalos:`;
      feedback.className = "feedback bad";
      showReview();
    }
  }

  // Tras fallar: reaparecen los MISMOS puntos, en las mismas posiciones,
  // pero sin límite de tiempo, para poder contarlos con calma y entender
  // el fallo. El avance a la siguiente ronda solo ocurre al pulsar
  // "Continuar" — nunca por un temporizador, para no repetir la prisa.
  function showReview() {
    const stage = body.querySelector("[data-stage]");
    if (!stage) return;
    stage.innerHTML = `
      <div class="fls-area" data-area>${dotsHtml(round.dots)}</div>
      <button class="secondary fls-continue-btn" data-continue type="button">Continuar</button>
    `;
    stage.querySelector("[data-continue]").addEventListener("click", () => {
      if (lives <= 0) finish(false);
      else nextRound();
    });
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "flash", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚡</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} vistazos acertados</p>
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
    exposureMs = EXPOSURE_START_MS;
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
