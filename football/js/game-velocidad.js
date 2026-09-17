// "¿Dónde se cruzan?": dos trenes salen a la vez desde los extremos de una
// vía y avanzan uno hacia el otro a velocidades distintas. Hay que tocar o
// arrastrar sobre la vía el punto exacto donde se cruzan y confirmar.
// Xcruce = D · Va / (Va + Vb), porque en el instante del cruce ambos llevan
// el mismo tiempo t = D / (Va + Vb) recorrido.
import { randInt, clamp, saveScore } from "./utils.js";

const D_MIN = 60;
const D_MAX = 300;
const V_MIN = 40;
const V_MAX = 140;
const TOL_RATIO = 0.03; // ±3% de D

function fmtKm(km) {
  const r = Math.round(km * 10) / 10;
  return Number.isInteger(r) ? `${r}` : r.toFixed(1).replace(".", ",");
}

function fmtH(h) {
  const r = Math.round(h * 100) / 100;
  return `${r.toFixed(2).replace(".", ",")}`;
}

export function mountVelocidadGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let D = 0;
  let Va = 0;
  let Vb = 0;
  let cruce = 0;
  let value = 0;
  let locked = false;
  let trackEl, markerEl, valueEl, feedbackEl;
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

  // Sortea D, Va y Vb de forma que el cruce quede dentro del 10%-90% de la
  // vía: así siempre hay un tramo de arrastre con margen real a los lados.
  function generateRound() {
    let d, va, vb, x;
    do {
      d = randInt(D_MIN, D_MAX);
      va = randInt(V_MIN, V_MAX);
      vb = randInt(V_MIN, V_MAX);
      x = (d * va) / (va + vb);
    } while (va === vb || x < d * 0.1 || x > d * 0.9);
    return { d, va, vb, x };
  }

  function nextRound() {
    const g = generateRound();
    D = g.d;
    Va = g.va;
    Vb = g.vb;
    cruce = g.x;
    value = D / 2;
    locked = false;

    body.innerHTML = `
      <p class="prompt vc-prompt">
        Una vía de <b>${D} km</b>. Dos trenes salen a la vez, uno hacia el otro:
        <br>🚂 izquierda a <b>${Va} km/h</b> — <b>${Vb} km/h</b> a 🚂 derecha.
        <br><small>Toca o arrastra la vía hasta el punto exacto donde se cruzan</small>
      </p>
      <div class="vc-zone">
        <div class="vc-endcap vc-endcap-left">🚂<br><span>${Va} km/h</span></div>
        <div class="vc-track" data-track>
          <div class="vc-rail"></div>
          <div class="vc-ticks">
            <span style="left:0%"><i>0</i></span>
            <span style="left:25%"></span>
            <span style="left:50%"><i>${fmtKm(D / 2)}</i></span>
            <span style="left:75%"></span>
            <span style="left:100%"><i>${D}</i></span>
          </div>
          <div class="vc-marker" data-marker>🚩</div>
        </div>
        <div class="vc-endcap vc-endcap-right">🚂<br><span>${Vb} km/h</span></div>
      </div>
      <div class="vc-value" data-value></div>
      <div class="feedback" data-feedback></div>
      <button class="primary" data-confirm style="margin-top:14px;">Confirmar cruce</button>
    `;

    trackEl = body.querySelector("[data-track]");
    markerEl = body.querySelector("[data-marker]");
    valueEl = body.querySelector("[data-value]");
    feedbackEl = body.querySelector("[data-feedback]");
    setMarker(value);
    body.querySelector("[data-confirm]").addEventListener("click", confirmGuess);
    bindDrag();
  }

  function setMarker(km) {
    value = clamp(km, 0, D);
    const pct = (value / D) * 100;
    markerEl.style.left = `${pct}%`;
    valueEl.textContent = `${fmtKm(value)} km desde la izquierda`;
  }

  function bindDrag() {
    let dragging = false;
    function toKm(clientX) {
      const rect = trackEl.getBoundingClientRect();
      const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
      return pct * D;
    }
    function onDown(e) {
      if (finished || locked) return;
      dragging = true;
      setMarker(toKm(e.clientX));
      trackEl.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      if (!dragging || finished || locked) return;
      setMarker(toKm(e.clientX));
    }
    function onUp() {
      dragging = false;
    }
    trackEl.addEventListener("pointerdown", onDown);
    trackEl.addEventListener("pointermove", onMove);
    trackEl.addEventListener("pointerup", onUp);
    trackEl.addEventListener("pointercancel", onUp);
  }

  function confirmGuess() {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const tol = D * TOL_RATIO;
    const t = D / (Va + Vb);
    if (Math.abs(value - cruce) <= tol) {
      score += 10;
      renderScore();
      feedbackEl.textContent = `¡Correcto! En t = D/(Va+Vb) = ${fmtH(t)} h ambos trenes se encuentran a ${fmtKm(cruce)} km del extremo izquierdo.`;
      feedbackEl.className = "feedback ok";
      later(nextRound, 1400);
    } else {
      lives--;
      renderLives();
      feedbackEl.textContent =
        `No era ahí. En t horas el tren de la izquierda recorre Va×t y el de la derecha Vb×t, y juntos cubren toda la vía ` +
        `(Va×t + Vb×t = D), así que t = D/(Va+Vb) = ${fmtH(t)} h, y el cruce está a Va×t = ${fmtKm(cruce)} km del extremo izquierdo.`;
      feedbackEl.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 2600);
      later(nextRound, 2600);
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "velocidad", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🚂</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} cruces calculados</p>
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
