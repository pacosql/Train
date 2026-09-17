// "La valla del huerto": el perímetro de cuerda disponible es FIJO. El
// jugador arrastra un tirador que cambia el ancho del rectángulo; el alto
// se recalcula solo (alto = mitad del perímetro - ancho) para que el
// perímetro nunca cambie. Hay que encontrar el ancho que hace que el área
// coincida exactamente con el objetivo.
import { randInt, clamp, saveScore } from "./utils.js";

export function mountVallaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  const timers = [];

  let P = 0; // perímetro fijo de la ronda (m)
  let S = 0; // semiperímetro = ancho + alto (m)
  let target = 0; // área objetivo (m²)
  let currentWidth = 0; // ancho actual mientras se arrastra (m, entero)
  let lastP = -1;
  let lastArea = -1;
  let locked = false; // evita confirmar mientras se resuelve el feedback

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

  // Sortea perímetro par (12-24), un ancho objetivo entero w (1..S-1) y
  // deriva el área real A = w*(S-w) — así A siempre es alcanzable con un
  // ancho entero. Evita repetir la misma pareja perímetro/área seguida.
  function generateRound() {
    let p, s, w, area;
    do {
      p = randInt(6, 12) * 2; // par entre 12 y 24
      s = p / 2;
      w = randInt(1, s - 1);
      area = w * (s - w);
    } while (p === lastP && area === lastArea);
    lastP = p;
    lastArea = area;
    return { p, s, area, w };
  }

  function nextRound() {
    const { p, s, area, w } = generateRound();
    P = p;
    S = s;
    target = area;
    locked = false;

    // Punto de partida distinto de las dos anchuras correctas (w y S-w),
    // para que siempre haya que mover el tirador.
    let start = randInt(1, S - 1);
    let guard = 0;
    while ((start === w || start === S - w) && guard < 20) {
      start = randInt(1, S - 1);
      guard++;
    }
    currentWidth = start;

    body.innerHTML = `
      <p class="prompt">Tienes <b>${P} m</b> de valla (el perímetro no cambia) para un huerto de <b>${target} m²</b><small>Arrastra el tirador: al estirar un lado, el otro se encoge</small></p>
      <div class="vl-stage" data-stage>
        <div class="vl-rect" data-rect>
          <div class="vl-handle" data-handle role="slider" aria-label="Ancho del huerto"
               aria-valuemin="1" aria-valuemax="${S - 1}" aria-valuenow="${currentWidth}"></div>
        </div>
      </div>
      <div class="vl-readout">
        <span>Ancho: <b data-width>${currentWidth} m</b></span>
        <span>Alto: <b data-height>${S - currentWidth} m</b></span>
        <span>Área: <b data-area>${currentWidth * (S - currentWidth)} m²</b></span>
      </div>
      <button class="primary" data-confirm>Confirmar valla</button>
      <div class="feedback" data-feedback></div>
    `;

    const stage = body.querySelector("[data-stage]");
    const rect = body.querySelector("[data-rect]");
    const handle = body.querySelector("[data-handle]");
    const widthEl = body.querySelector("[data-width]");
    const heightEl = body.querySelector("[data-height]");
    const areaEl = body.querySelector("[data-area]");

    function applyVisual() {
      const stageRect = stage.getBoundingClientRect();
      const scale = stageRect.width / S; // px por metro (varía con S cada ronda)
      const h = S - currentWidth;
      rect.style.width = `${currentWidth * scale}px`;
      rect.style.height = `${h * scale}px`;
      widthEl.textContent = `${currentWidth} m`;
      heightEl.textContent = `${h} m`;
      areaEl.textContent = `${currentWidth * h} m²`;
      handle.setAttribute("aria-valuenow", String(currentWidth));
    }

    function widthFromPointer(clientX) {
      const stageRect = stage.getBoundingClientRect();
      const scale = stageRect.width / S;
      const pxFromLeft = clientX - stageRect.left;
      return clamp(Math.round(pxFromLeft / scale), 1, S - 1);
    }

    let dragging = false;
    handle.addEventListener("pointerdown", (e) => {
      if (finished || locked) return;
      dragging = true;
      handle.setPointerCapture(e.pointerId);
      const w2 = widthFromPointer(e.clientX);
      if (w2 !== currentWidth) {
        currentWidth = w2;
        applyVisual();
      }
    });
    handle.addEventListener("pointermove", (e) => {
      if (!dragging || finished || locked) return;
      const w2 = widthFromPointer(e.clientX);
      if (w2 !== currentWidth) {
        currentWidth = w2;
        applyVisual();
      }
    });
    handle.addEventListener("pointerup", () => (dragging = false));
    handle.addEventListener("pointercancel", () => (dragging = false));

    body.querySelector("[data-confirm]").addEventListener("click", onConfirm);

    applyVisual();
  }

  function onConfirm() {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const confirmBtn = body.querySelector("[data-confirm]");
    confirmBtn.disabled = true;
    const h = S - currentWidth;
    const area = currentWidth * h;
    if (area === target) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! ${currentWidth} m × ${h} m = ${area} m²`;
      feedback.className = "feedback ok";
      later(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Con ese ancho (${currentWidth} m) y perímetro fijo (${P} m), el alto tiene que ser ${h} m, así que el área es ${currentWidth}×${h} = ${area} m², no ${target} m²`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1500);
      later(nextRound, 1500);
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "valla", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🐑</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} vallas ajustadas</p>
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
    lastP = -1;
    lastArea = -1;
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
