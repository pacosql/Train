// "La sombra": medida indirecta con triángulos semejantes (estilo
// Exploratorium). Un poste de altura conocida proyecta una sombra
// conocida; el árbol proyecta otra sombra conocida pero su altura es la
// incógnita. El jugador arrastra un tirador que hace crecer/encoger el
// árbol dibujado hasta que su altura cumpla la proporción
// H_arbol / S_arbol = H_palo / S_palo.
import { randInt, clamp, saveScore } from "./utils.js";

// Escala vertical (alturas) y horizontal (sombras) del dibujo. Se dejan
// algo por encima de los rangos de sorteo para que nunca se corte nada.
const SCENE_MAX_M = 34; // metros que caben en la altura visible del escenario
const STAGE_PX = 200; // alto en px del escenario (debe coincidir con el CSS)
const HEIGHT_SCALE = STAGE_PX / SCENE_MAX_M; // px por metro (alturas)

const SHADOW_MAX_M = 22; // metros que caben en el ancho de las barras de sombra
const SHADOW_MAX_PX = 120; // ancho máximo en px de una barra de sombra
const SHADOW_SCALE = SHADOW_MAX_PX / SHADOW_MAX_M; // px por metro (sombras)

function formatM(v) {
  let s = v.toFixed(1);
  if (s.endsWith(".0")) s = s.slice(0, -2);
  return s.replace(".", ",");
}

export function mountSombraGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  const timers = [];

  let hPalo = 2;
  let sPalo = 4;
  let sArbol = 12;
  let correct = 6;
  let lastCorrect = -1;
  let heightM = 1;

  let stageEl, treeEl, handleEl, heightEl;

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
    // Se sortean poste y sombras de forma que la altura real del árbol
    // salga EXACTA (sin decimales): se exige que S_arbol · H_palo sea
    // múltiplo de S_palo. Se descarta también la proporción trivial 1:1
    // (H_palo === S_palo) y los resultados fuera de un rango razonable.
    let guard = 0;
    do {
      hPalo = randInt(1, 3);
      sPalo = randInt(1, 5);
      sArbol = randInt(8, 20);
      guard++;
    } while (
      guard < 500 &&
      (hPalo === sPalo ||
        (sArbol * hPalo) % sPalo !== 0 ||
        (sArbol * hPalo) / sPalo < 3 ||
        (sArbol * hPalo) / sPalo > 30 ||
        (sArbol * hPalo) / sPalo === lastCorrect)
    );
    correct = (sArbol * hPalo) / sPalo;
    lastCorrect = correct;

    // Punto de partida del tirador: siempre lejos del valor correcto para
    // que haya que arrastrar de verdad.
    const dir = Math.random() < 0.5 ? -1 : 1;
    heightM = clamp(correct + dir * randInt(4, 9), 1, SCENE_MAX_M - 1);

    const poleHeightPx = hPalo * HEIGHT_SCALE;
    const poleShadowPx = sPalo * SHADOW_SCALE;
    const treeShadowPx = sArbol * SHADOW_SCALE;

    body.innerHTML = `
      <p class="prompt sb-prompt">Ajusta la altura del árbol<small>arrastra el tirador 🌳 hasta que la altura sea la correcta</small></p>
      <div class="sb-data">
        <div class="sb-fact">🚧 El poste mide <b>${hPalo} m</b> y su sombra mide <b>${sPalo} m</b></div>
        <div class="sb-fact">🌳 La sombra del árbol mide <b>${sArbol} m</b></div>
      </div>
      <div class="sb-scene">
        <div class="sb-col">
          <div class="sb-stage" data-pole-stage>
            <div class="sb-pole" style="height:${poleHeightPx}px"></div>
          </div>
          <div class="sb-ground"></div>
          <div class="sb-shadow-row"><div class="sb-shadow sb-shadow-pole" style="width:${poleShadowPx}px"></div></div>
          <div class="sb-col-label">Poste</div>
        </div>
        <div class="sb-col">
          <div class="sb-stage" data-stage>
            <div class="sb-tree" data-tree></div>
            <div class="sb-trunk"></div>
            <div class="sb-handle" data-handle title="Arrastra para ajustar la altura">↕</div>
          </div>
          <div class="sb-ground"></div>
          <div class="sb-shadow-row"><div class="sb-shadow sb-shadow-tree" style="width:${treeShadowPx}px"></div></div>
          <div class="sb-col-label">Árbol</div>
        </div>
      </div>
      <div class="sb-readout">Altura del árbol: <b data-height>0 m</b></div>
      <div class="feedback" data-feedback></div>
      <button class="primary" data-confirm>Confirmar</button>
    `;

    stageEl = body.querySelector("[data-stage]");
    treeEl = body.querySelector("[data-tree]");
    handleEl = body.querySelector("[data-handle]");
    heightEl = body.querySelector("[data-height]");

    setHeight(heightM);
    bindDrag();
    body.querySelector("[data-confirm]").addEventListener("click", confirmGuess);
  }

  function setHeight(m) {
    heightM = clamp(Math.round(m * 10) / 10, 0.5, SCENE_MAX_M);
    const px = heightM * HEIGHT_SCALE;
    treeEl.style.height = `${px}px`;
    handleEl.style.bottom = `${px}px`;
    heightEl.textContent = `${formatM(heightM)} m`;
    heightEl.dataset.height = String(heightM);
  }

  function bindDrag() {
    let dragging = false;
    function toMeters(clientY) {
      const rect = stageEl.getBoundingClientRect();
      const px = clamp(rect.bottom - clientY, 0, STAGE_PX);
      return px / HEIGHT_SCALE;
    }
    function onDown(e) {
      if (finished) return;
      dragging = true;
      handleEl.setPointerCapture(e.pointerId);
      setHeight(toMeters(e.clientY));
      e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      setHeight(toMeters(e.clientY));
    }
    function onUp() {
      dragging = false;
    }
    handleEl.addEventListener("pointerdown", onDown);
    handleEl.addEventListener("pointermove", onMove);
    handleEl.addEventListener("pointerup", onUp);
    handleEl.addEventListener("pointercancel", onUp);
  }

  function confirmGuess() {
    if (finished) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const tol = Math.max(0.3, correct * 0.05);
    const diff = Math.abs(heightM - correct);
    if (diff <= tol) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! El árbol mide ${formatM(correct)} m: ${sArbol} × (${hPalo}/${sPalo}) = ${formatM(correct)} m`;
      feedback.className = "feedback ok";
      later(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Esa altura no cuadra (has puesto ${formatM(heightM)} m). El poste mide ${hPalo} m y su sombra ${sPalo} m (proporción ${hPalo}/${sPalo}); la sombra del árbol mide ${sArbol} m, así que su altura real es ${sArbol} × (${hPalo}/${sPalo}) = ${formatM(correct)} m`;
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
    saveScore(client, "sombra", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🕶️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} sombras medidas</p>
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
    lastCorrect = -1;
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
