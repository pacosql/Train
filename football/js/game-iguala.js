// "Iguala el relleno": dos barras del mismo tamaño, una de referencia
// (fija, ya rellena hasta un nivel) y otra vacía que hay que rellenar
// arrastrando hasta que el ojo diga que las dos proporciones coinciden.
// Nada de números ni de "%" en pantalla durante la ronda — todo se
// resuelve por comparación visual de dos alturas en píxeles. El fallo sí
// puede revelar los porcentajes reales, para que enseñe algo.
import { randInt, clamp, saveScore } from "./utils.js";

// Objetivo: múltiplo de 5 entre 10 y 90 (nunca 0 ni 100, que serían
// triviales de adivinar a ojo: una barra vacía o llena del todo no
// exige estimar nada). randInt(2,18) da 2..18, *5 da 10..90 en pasos de 5.
export function generateIgualaRound() {
  const target = randInt(2, 18) * 5;
  return { target };
}

// Tolerancia de acierto: ±4 puntos porcentuales. Es una comparación
// puramente visual (sin marcas ni snap), así que no tiene sentido exigir
// precisión de píxel — 4 puntos es lo que separa a ojo un 45% de un 50%
// sin que sea tan ancho como para acertar por suerte.
const TOLERANCE_PP = 4;

export function mountIgualaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let timers = [];
  let target = 0;
  let value = 0;
  let barEl, fillEl;

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
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function nextRound() {
    target = generateIgualaRound().target;
    // Salida inicial de la barra interactiva lejos del objetivo, para que
    // haga falta arrastrar de verdad (nunca a menos de 25 puntos, ni por
    // debajo de 0 ni por encima de 100).
    do {
      value = randInt(0, 100);
    } while (Math.abs(value - target) < 25);

    body.innerHTML = `
      <div class="igl-wrap">
        <p class="prompt">Arrastra el relleno de la derecha hasta que sea igual de alto (en proporción) que el de la izquierda<small>a ojo — no hay números ni marcas</small></p>
        <div class="igl-bars">
          <div class="igl-col">
            <div class="igl-bar igl-bar--ref">
              <div class="igl-fill igl-fill--ref" data-reffill></div>
            </div>
          </div>
          <div class="igl-col">
            <div class="igl-bar igl-bar--drag" data-bar>
              <div class="igl-fill igl-fill--drag" data-fill></div>
            </div>
          </div>
        </div>
        <div class="feedback" data-feedback></div>
        <button class="primary" data-confirm style="margin-top:14px;">Confirmar</button>
      </div>
    `;
    barEl = body.querySelector("[data-bar]");
    fillEl = body.querySelector("[data-fill]");
    const reffillEl = body.querySelector("[data-reffill]");
    // La barra de referencia lleva un borde superior a modo de línea de
    // nivel (ver .igl-fill--ref en CSS), sin texto ni número alguno.
    reffillEl.style.height = `${target}%`;

    setLevel(value);
    body.querySelector("[data-confirm]").addEventListener("click", confirm);
    bindDrag();
  }

  function setLevel(v) {
    value = clamp(Math.round(v), 0, 100);
    fillEl.style.height = `${value}%`;
  }

  function bindDrag() {
    let dragging = false;
    function toValue(clientY) {
      const rect = barEl.getBoundingClientRect();
      // Abajo de la barra = 0%, arriba = 100%: hay que invertir el eje Y,
      // igual que en game-termometro.js. clamp() acota siempre a [0,100].
      const pct = clamp((rect.bottom - clientY) / rect.height, 0, 1) * 100;
      return pct;
    }
    function onDown(e) {
      dragging = true;
      setLevel(toValue(e.clientY));
      barEl.setPointerCapture(e.pointerId);
    }
    function onMove(e) {
      if (!dragging) return;
      setLevel(toValue(e.clientY));
    }
    function onUp() {
      dragging = false;
    }
    barEl.addEventListener("pointerdown", onDown);
    barEl.addEventListener("pointermove", onMove);
    barEl.addEventListener("pointerup", onUp);
    barEl.addEventListener("pointercancel", onUp);
  }

  function confirm() {
    if (finished) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const dif = Math.abs(value - target);
    if (dif <= TOLERANCE_PP) {
      score += 10;
      renderScore();
      feedback.textContent = "¡Misma proporción!";
      feedback.className = "feedback ok";
      later(nextRound, 700);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `La referencia estaba al ${target}% y tú llegaste al ${value}%`;
      feedback.className = "feedback bad";
      if (lives <= 0) return later(() => finish(false), 900);
      later(nextRound, 1300);
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "iguala", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎚️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} proporciones igualadas</p>
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
    clearTimers();
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
