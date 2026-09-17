// "Tiro con rebote": billar con una sola banda (la superior). El lanzador y
// el objetivo están sobre pedestales de ALTURA DISTINTA (nunca la misma),
// así que el punto de rebote no es nunca el punto medio a ojo: hay que
// comparar de verdad cuánto le queda a cada uno hasta la banda. Se calcula
// con el truco del espejo: reflejar el objetivo al otro lado de la banda y
// trazar la recta hasta el lanzador, lo que equivale a exigir ángulo de
// incidencia = ángulo de reflexión (ver `puntoRebote`).
//
// (Aviso de la vuelta de revisión: la primera versión ponía lanzador y
// objetivo a la MISMA altura, con lo que el rebote caía siempre en el
// punto medio exacto sin que hiciera falta calcular nada — el mando
// encarnaba "toca el centro a ojo", no una proporción. Con alturas
// distintas el punto sí depende de verdad de la proporción entre las dos
// distancias a la banda.)
import { randInt, clamp, saveScore } from "./utils.js";

const SW = 100; // ancho de la mesa, en unidades == % del ancho real dibujado
const SH = 62; // alto del dibujo, en las mismas unidades
const EDGE_MARGIN = 10; // el lanzador/objetivo no pueden nacer pegados al borde
const MIN_GAP = 18; // separación mínima entre lanzador y objetivo
const WALL_MARGIN = 6; // el rebote correcto no puede caer pegado al borde de la banda
const PLAT_MIN = 4; // altura mínima del pedestal (lanzador/objetivo) sobre la base
const PLAT_MAX = 18; // altura máxima del pedestal
const MIN_PLAT_GAP = 4; // diferencia mínima entre las dos alturas, para que la proporción no sea casi 1:1
const WALL_ABOVE_MARGIN = 8; // la banda siempre queda al menos esto por encima del pedestal más alto
const H_MAX = 46; // altura máxima de la banda sobre la base
const TOLERANCE = 3; // tolerancia: ±3% del ancho de la mesa

// Punto de la banda donde el ángulo de incidencia = ángulo de reflexión,
// con el lanzador a altura hA y el objetivo a altura hB (pueden ser
// distintas) y la banda a altura H por encima de la base.
//
// Truco del espejo: reflejamos el objetivo (Xd, hB) al otro lado de la
// banda -> (Xd, 2H - hB). La recta entre el lanzador (Xo, hA) y ese
// reflejo cruza la altura de la banda (y = H) en la fracción de su
// recorrido vertical:
//   dA = H - hA   (lo que le queda al lanzador hasta la banda)
//   dB = H - hB   (lo que le queda al objetivo hasta la banda)
//   t = dA / (dA + dB)
//   Xr = Xo + (Xd - Xo) * t
//
// Con dA = dB (mismas alturas) esto colapsa a t=1/2 (punto medio) — por
// eso ahora se exige hA != hB: así el rebote depende de verdad de la
// proporción entre dA y dB, no es un punto medio a ojo.
export function puntoRebote(Xo, Xd, H, hA, hB) {
  const dA = H - hA;
  const dB = H - hB;
  const t = dA / (dA + dB);
  return Xo + (Xd - Xo) * t;
}

// Sortea una ronda válida: descarta con do/while las combinaciones cuyo
// punto de rebote se saldría de los límites jugables de la banda, o cuyas
// dos alturas de pedestal queden demasiado parecidas.
function generarRonda() {
  let Xo, Xd, H, hA, hB, Xr;
  do {
    Xo = randInt(EDGE_MARGIN, SW - EDGE_MARGIN);
    do {
      Xd = randInt(EDGE_MARGIN, SW - EDGE_MARGIN);
    } while (Math.abs(Xd - Xo) < MIN_GAP);
    do {
      hA = randInt(PLAT_MIN, PLAT_MAX);
      hB = randInt(PLAT_MIN, PLAT_MAX);
    } while (Math.abs(hA - hB) < MIN_PLAT_GAP);
    H = randInt(Math.max(hA, hB) + WALL_ABOVE_MARGIN, H_MAX);
    Xr = puntoRebote(Xo, Xd, H, hA, hB);
  } while (Xr < WALL_MARGIN || Xr > SW - WALL_MARGIN);
  return { Xo, Xd, H, hA, hB, Xr };
}

export function mountReboteGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let Xo = 0, Xd = 0, H = 0, hA = 0, hB = 0, Xr = 0;
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
    ({ Xo, Xd, H, hA, hB, Xr } = generarRonda());
    selX = null;
    dragging = false;
    locked = false;
    const wallY = SH - H;
    const wallTopPct = (wallY / SH) * 100;
    const yO = SH - hA;
    const yD = SH - hB;

    body.innerHTML = `
      <p class="prompt">Toca y arrastra en la banda superior hasta el punto exacto de rebote
        <small>🎱 lanzador a ${hA} de altura (le quedan ${H - hA} hasta la banda) · 🥅 portería a ${hB} de altura (le quedan ${H - hB} hasta la banda)</small>
      </p>
      <div class="rbt-table" data-table>
        <svg class="rbt-svg" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="none">
          <line class="rbt-base" x1="0" y1="${SH}" x2="${SW}" y2="${SH}"></line>
          <line class="rbt-wallline" x1="0" y1="${wallY}" x2="${SW}" y2="${wallY}"></line>
          <line class="rbt-pedestal" x1="${Xo}" y1="${SH}" x2="${Xo}" y2="${yO}"></line>
          <line class="rbt-pedestal" x1="${Xd}" y1="${SH}" x2="${Xd}" y2="${yD}"></line>
          <g data-lines></g>
          <circle class="rbt-dot rbt-dot-origin" cx="${Xo}" cy="${yO}" r="2.6"></circle>
          <circle class="rbt-dot rbt-dot-target" cx="${Xd}" cy="${yD}" r="2.6"></circle>
          <circle class="rbt-marker" data-marker cx="${Xo}" cy="${wallY}" r="3" style="display:none"></circle>
        </svg>
        <div class="rbt-wall" data-wall style="top:${wallTopPct}%;"></div>
        <span class="rbt-emoji" style="left:${Xo}%;bottom:${(hA / SH) * 100}%;">🎱</span>
        <span class="rbt-emoji" style="left:${Xd}%;bottom:${(hB / SH) * 100}%;">🥅</span>
      </div>
      <div class="feedback" data-feedback></div>
      <button class="primary" data-confirm disabled>Confirmar rebote</button>
    `;

    bindDrag();
    body.querySelector("[data-confirm]").addEventListener("click", onConfirm);
  }

  function svgEl() {
    return body.querySelector(".rbt-svg");
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
      <line class="rbt-line rbt-line-preview" x1="${Xo}" y1="${SH - hA}" x2="${selX}" y2="${wallY}"></line>
      <line class="rbt-line rbt-line-preview" x1="${selX}" y1="${wallY}" x2="${Xd}" y2="${SH - hB}"></line>
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
      <line class="rbt-line ${ok ? "rbt-line-ok" : "rbt-line-bad"}" x1="${Xo}" y1="${SH - hA}" x2="${selX}" y2="${wallY}"></line>
      <line class="rbt-line ${ok ? "rbt-line-ok" : "rbt-line-bad"}" x1="${selX}" y1="${wallY}" x2="${Xd}" y2="${SH - hB}"></line>
    `;
    if (!ok) {
      linesHtml += `
        <line class="rbt-line rbt-line-correct" x1="${Xo}" y1="${SH - hA}" x2="${Xr}" y2="${wallY}"></line>
        <line class="rbt-line rbt-line-correct" x1="${Xr}" y1="${wallY}" x2="${Xd}" y2="${SH - hB}"></line>
        <circle class="rbt-dot rbt-dot-correct" cx="${Xr}" cy="${wallY}" r="3"></circle>
      `;
    }
    linesG().innerHTML = linesHtml;

    const dA = H - hA;
    const dB = H - hB;
    const izq = Math.abs(Xr - Xo).toFixed(1);
    const der = Math.abs(Xd - Xr).toFixed(1);

    if (ok) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Rebote perfecto! Al lanzador le quedan ${dA} hasta la banda y a la portería ${dB}: el rebote reparte la distancia horizontal en esa misma proporción (${dA}:${dB}), por eso cae en X=${Xr.toFixed(1)} — ${izq} de un lado, ${der} del otro.`;
      feedback.className = "feedback ok";
      later(nextRound, 1300);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `No era ahí (tocaste X=${selX.toFixed(1)}). Al lanzador le quedan ${dA} hasta la banda y a la portería ${dB}: el rebote correcto reparte la distancia horizontal en la proporción ${dA}:${dB}, así que cae en X=${Xr.toFixed(1)} (${izq} de un lado, ${der} del otro) — no en el punto medio.`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 1700);
      later(nextRound, 1900);
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
