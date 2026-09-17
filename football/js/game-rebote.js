// "Tiro con rebote": billar con una sola banda (la superior). El lanzador y
// el objetivo están siempre a la misma altura (la base), así que el punto
// de rebote se calcula con el truco del espejo: reflejar el objetivo al
// otro lado de la banda y trazar la recta hasta el lanzador. Eso equivale
// a exigir ángulo de incidencia = ángulo de reflexión, aquí resuelto con
// una proporción de triángulos (ver `puntoRebote`).
import { randInt, clamp, saveScore } from "./utils.js";

const SW = 100; // ancho de la mesa, en unidades == % del ancho real dibujado
const SH = 62; // alto del dibujo, en las mismas unidades
const EDGE_MARGIN = 10; // el lanzador/objetivo no pueden nacer pegados al borde
const MIN_GAP = 18; // separación mínima entre lanzador y objetivo
const WALL_MARGIN = 6; // el rebote correcto no puede caer pegado al borde de la banda
const H_MIN = 24; // altura mínima de la banda sobre la base
const H_MAX = 46; // altura máxima de la banda sobre la base
const TOLERANCE = 3; // tolerancia: ±3% del ancho de la mesa

// Punto de la banda donde el ángulo de incidencia = ángulo de reflexión.
//
// Truco del espejo: reflejamos el objetivo (Xd, 0) al otro lado de la
// banda, es decir lo subimos de altura 0 a altura 2H -> (Xd, 2H). La recta
// entre el lanzador (Xo, 0) y ese reflejo cruza la altura de la banda
// (y = H) en la fracción de su recorrido vertical t = H / (2H) = 1/2:
//   Xr = Xo + (Xd - Xo) * t
//
// Por qué esa t da el punto correcto: el lanzador y el objetivo comparten
// la misma altura (0) y la banda es una única línea horizontal a altura H,
// así que los dos triángulos rectángulos "rebote→lanzador" y
// "rebote→objetivo" tienen el MISMO cateto vertical (H). Ángulo de
// incidencia = ángulo de reflexión respecto a la normal (vertical) exige
// que esos dos ángulos sean iguales; con el mismo cateto vertical, la
// única forma de que los ángulos coincidan es que los catetos horizontales
// también coincidan. Por eso el rebote siempre cae en el punto medio entre
// Xo y Xd, sea cual sea H (la altura de la banda solo cambia lo empinada
// que se ve la trayectoria, no la posición horizontal del rebote).
export function puntoRebote(Xo, Xd, H) {
  const t = H / (2 * H);
  return Xo + (Xd - Xo) * t;
}

// Sortea una ronda válida: descarta con do/while las combinaciones cuyo
// punto de rebote se saldría de los límites jugables de la banda.
function generarRonda() {
  let Xo, Xd, H, Xr;
  do {
    Xo = randInt(EDGE_MARGIN, SW - EDGE_MARGIN);
    do {
      Xd = randInt(EDGE_MARGIN, SW - EDGE_MARGIN);
    } while (Math.abs(Xd - Xo) < MIN_GAP);
    H = randInt(H_MIN, H_MAX);
    Xr = puntoRebote(Xo, Xd, H);
  } while (Xr < WALL_MARGIN || Xr > SW - WALL_MARGIN);
  return { Xo, Xd, H, Xr };
}

export function mountReboteGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let Xo = 0, Xd = 0, H = 0, Xr = 0;
  let selX = null;
  let dragging = false;
  let locked = false; // evita seguir arrastrando/confirmar mientras se resuelve la ronda
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

  function nextRound() {
    ({ Xo, Xd, H, Xr } = generarRonda());
    selX = null;
    dragging = false;
    locked = false;
    const wallY = SH - H;
    const wallTopPct = (wallY / SH) * 100;

    body.innerHTML = `
      <p class="prompt">Toca y arrastra en la banda superior hasta el punto exacto de rebote
        <small>🎱 lanzador en X=${Xo} · 🥅 portería en X=${Xd} · banda a H=${H}</small>
      </p>
      <div class="rb-table" data-table>
        <svg class="rb-svg" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="none">
          <line class="rb-base" x1="0" y1="${SH}" x2="${SW}" y2="${SH}"></line>
          <line class="rb-wallline" x1="0" y1="${wallY}" x2="${SW}" y2="${wallY}"></line>
          <g data-lines></g>
          <circle class="rb-dot rb-dot-origin" cx="${Xo}" cy="${SH}" r="2.6"></circle>
          <circle class="rb-dot rb-dot-target" cx="${Xd}" cy="${SH}" r="2.6"></circle>
          <circle class="rb-marker" data-marker cx="${Xo}" cy="${wallY}" r="3" style="display:none"></circle>
        </svg>
        <div class="rb-wall" data-wall style="top:${wallTopPct}%;"></div>
        <span class="rb-emoji" style="left:${Xo}%;">🎱</span>
        <span class="rb-emoji" style="left:${Xd}%;">🥅</span>
      </div>
      <div class="feedback" data-feedback></div>
      <button class="primary" data-confirm disabled>Confirmar rebote</button>
    `;

    bindDrag();
    body.querySelector("[data-confirm]").addEventListener("click", onConfirm);
  }

  function svgEl() {
    return body.querySelector(".rb-svg");
  }
  function linesG() {
    return body.querySelector("[data-lines]");
  }
  function markerEl() {
    return body.querySelector("[data-marker]");
  }

  function setSelX(x) {
    selX = clamp(x, WALL_MARGIN, SW - WALL_MARGIN);
    const wallY = SH - H;
    const marker = markerEl();
    marker.setAttribute("cx", String(selX));
    marker.style.display = "block";
    linesG().innerHTML = `
      <line class="rb-line rb-line-preview" x1="${Xo}" y1="${SH}" x2="${selX}" y2="${wallY}"></line>
      <line class="rb-line rb-line-preview" x1="${selX}" y1="${wallY}" x2="${Xd}" y2="${SH}"></line>
    `;
    body.querySelector("[data-confirm]").disabled = false;
  }

  function bindDrag() {
    const wallEl = body.querySelector("[data-wall]");
    function xFromEvent(clientX) {
      const rect = svgEl().getBoundingClientRect();
      const frac = (clientX - rect.left) / rect.width;
      return frac * SW;
    }
    wallEl.addEventListener("pointerdown", (e) => {
      if (finished || locked) return;
      dragging = true;
      wallEl.setPointerCapture(e.pointerId);
      setSelX(xFromEvent(e.clientX));
    });
    wallEl.addEventListener("pointermove", (e) => {
      if (dragging && !finished && !locked) setSelX(xFromEvent(e.clientX));
    });
    wallEl.addEventListener("pointerup", () => { dragging = false; });
    wallEl.addEventListener("pointercancel", () => { dragging = false; });
  }

  function onConfirm() {
    if (finished || locked || selX === null) return;
    locked = true;
    rounds++;
    const wallY = SH - H;
    const feedback = body.querySelector("[data-feedback]");
    const confirmBtn = body.querySelector("[data-confirm]");
    confirmBtn.disabled = true;

    const dist = Math.abs(selX - Xr);
    const ok = dist <= TOLERANCE;

    let linesHtml = `
      <line class="rb-line ${ok ? "rb-line-ok" : "rb-line-bad"}" x1="${Xo}" y1="${SH}" x2="${selX}" y2="${wallY}"></line>
      <line class="rb-line ${ok ? "rb-line-ok" : "rb-line-bad"}" x1="${selX}" y1="${wallY}" x2="${Xd}" y2="${SH}"></line>
    `;
    if (!ok) {
      linesHtml += `
        <line class="rb-line rb-line-correct" x1="${Xo}" y1="${SH}" x2="${Xr}" y2="${wallY}"></line>
        <line class="rb-line rb-line-correct" x1="${Xr}" y1="${wallY}" x2="${Xd}" y2="${SH}"></line>
        <circle class="rb-dot rb-dot-correct" cx="${Xr}" cy="${wallY}" r="3"></circle>
      `;
    }
    linesG().innerHTML = linesHtml;

    const izq = Math.abs(Xr - Xo).toFixed(1);
    const der = Math.abs(Xd - Xr).toFixed(1);

    if (ok) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Rebote perfecto! En X=${Xr.toFixed(1)} los dos tramos bajan la misma altura H=${H}, así que sus catetos horizontales coinciden: ${izq} = ${der}.`;
      feedback.className = "feedback ok";
      later(nextRound, 1100);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `No era ahí (tocaste X=${selX.toFixed(1)}). El rebote correcto estaba en X=${Xr.toFixed(1)}, a mitad de camino entre el lanzador (${Xo}) y la portería (${Xd}): con H=${H} en los dos tramos, los catetos horizontales deben ser iguales (${izq} = ${der}).`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1500);
      later(nextRound, 1700);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "rebote", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎱</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} tiros con rebote</p>
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
