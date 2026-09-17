// "Reparte en cajas": antes se repartía a partes iguales y el reparto
// siempre salía exacto, así que bastaba con ir dando una galleta a cada
// caja sin dividir nada. Ahora el protagonista es EL RESTO: el jugador
// elige el tamaño de caja y las galletas se colocan en filas de ese tamaño,
// así que la caja incompleta se ve. Hay que encontrar TODOS los tamaños con
// los que no sobra ninguna — los divisores.
import { randInt, saveScore } from "./utils.js";

const OPTIONS = 8; // tamaños de caja que se ofrecen en cada ronda
const MAX_ROWS = 8; // filas que caben en pantalla: limita el tamaño mínimo

// Rangos de galletas por nivel: el número crece con la racha, así que los
// divisores dejan de ser los de las tablas fáciles.
const LEVELS = [
  { min: 10, max: 24 },
  { min: 14, max: 32 },
  { min: 20, max: 40 },
  { min: 26, max: 48 },
];

export function levelFor(streak) {
  return LEVELS[Math.min(Math.floor(streak / 2), LEVELS.length - 1)];
}

// Genera la ronda. La respuesta (el conjunto de divisores dentro del rango
// ofrecido) es única por construcción; lo que hay que garantizar es que haya
// entre 2 y 4 tamaños exactos (ni regalado ni barrer todos), que queden
// tamaños con resto de sobra y que las filas quepan en pantalla.
export function makeRound(level, lastTotal) {
  let total = 0;
  let sizes = [];
  let exact = [];
  let guard = 0;
  do {
    guard++;
    total = randInt(level.min, level.max);
    // El tamaño más pequeño se elige para que ni el reparto más largo pase
    // de MAX_ROWS filas. El desplazamiento suelta la ventana de tamaños:
    // el mismo número de galletas puede salir con divisores distintos a la
    // vista, así que las rondas no se repiten aunque el total coincida.
    const lo = Math.max(2, Math.ceil(total / MAX_ROWS)) + randInt(0, 2);
    sizes = [];
    for (let s = lo; s < lo + OPTIONS; s++) sizes.push(s);
    exact = sizes.filter((s) => total % s === 0);
  } while ((exact.length < 2 || exact.length > 4 || total === lastTotal
    || sizes[sizes.length - 1] >= total) && guard < 600);
  return { total, sizes, exact, guard };
}

export function mountReparteGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false; // no se toca mientras se resuelve un tamaño
  let level = LEVELS[0];
  let round = null;
  let found = [];
  let lastTotal = -1;
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
    if (finished) return;
    level = levelFor(streak);
    round = makeRound(level, lastTotal);
    lastTotal = round.total;
    found = [];
    locked = false;

    body.innerHTML = `
      <p class="prompt">${round.total} galletas<small>Toca los tamaños de caja con los que NO sobra ninguna. Hay ${round.exact.length}.</small></p>
      <div class="rp-tray" data-tray></div>
      <div class="rp-progress" data-progress></div>
      <div class="rp-sizes" data-sizes></div>
      <div class="feedback" data-feedback></div>
    `;
    const sizesEl = body.querySelector("[data-sizes]");
    round.sizes.forEach((s) => {
      const btn = document.createElement("button");
      btn.className = "rp-size";
      btn.type = "button";
      btn.dataset.size = String(s);
      btn.innerHTML = `<b>${s}</b><span class="rp-size-note" data-note="${s}">por caja</span>`;
      btn.addEventListener("click", () => trySize(s, btn));
      sizesEl.appendChild(btn);
    });
    renderTray(null);
    renderProgress();
  }

  function renderProgress() {
    body.querySelector("[data-progress]").textContent =
      `Encontradas ${found.length} de ${round.exact.length}`;
  }

  // El reparto dibujado: cada fila es una caja llena de `size` galletas y lo
  // que no completa una caja se queda aparte. El resto se VE.
  function renderTray(size, bad) {
    const tray = body.querySelector("[data-tray]");
    if (!size) {
      let dots = "";
      for (let i = 0; i < round.total; i++) dots += '<i class="rp-dot"></i>';
      tray.innerHTML = `
        <div class="rp-loose">${dots}</div>
        <div class="rp-caption">${round.total} galletas sueltas — elige un tamaño de caja</div>
      `;
      return;
    }
    const full = Math.floor(round.total / size);
    const rest = round.total % size;
    let html = "";
    for (let r = 0; r < full; r++) {
      let dots = "";
      for (let i = 0; i < size; i++) dots += '<i class="rp-dot"></i>';
      html += `<div class="rp-box">${dots}</div>`;
    }
    if (rest > 0) {
      let dots = "";
      for (let i = 0; i < rest; i++) dots += '<i class="rp-dot rp-dot-rest"></i>';
      html += `<div class="rp-box rp-box-rest">${dots}<span class="rp-rest-tag">sobran ${rest}</span></div>`;
    }
    const caption = rest === 0
      ? `${round.total} = ${full} × ${size} · ${full} cajas llenas, no sobra ninguna`
      : `${round.total} = ${full} × ${size} + ${rest} · la última caja se queda a medias`;
    tray.innerHTML = `
      <div class="rp-stack${bad ? " rp-stack-bad" : ""}">${html}</div>
      <div class="rp-caption${rest === 0 ? " ok" : bad ? " bad" : ""}">${caption}</div>
    `;
  }

  function trySize(size, btn) {
    if (finished || locked || btn.disabled) return;
    const fb = body.querySelector("[data-feedback]");
    const rest = round.total % size;
    const full = Math.floor(round.total / size);
    btn.disabled = true;
    const note = btn.querySelector(`[data-note="${size}"]`);
    if (rest === 0) {
      found.push(size);
      btn.classList.add("ok");
      note.textContent = `${full} cajas`;
      renderTray(size, false);
      renderProgress();
      if (found.length === round.exact.length) {
        // Ronda completa: +10, siempre 10.
        locked = true;
        rounds++;
        streak++;
        score += 10;
        renderScore();
        fb.textContent = `¡Los ${round.exact.length}! ${round.total} se parte exacto en ${round.exact.join(", ")}`;
        fb.className = "feedback ok";
        return later(nextRound, 1400);
      }
      fb.textContent = `Exacto: ${full} cajas de ${size}`;
      fb.className = "feedback ok";
      return;
    }
    // Fallo: el reparto se queda dibujado con la caja a medias, que es el
    // porqué — y el botón guarda el resto para no olvidarlo.
    lives--;
    streak = 0;
    renderLives();
    btn.classList.add("no");
    note.textContent = `sobran ${rest}`;
    renderTray(size, true);
    fb.textContent = `De ${size} en ${size} sobran ${rest}: ${round.total} = ${size} × ${full} + ${rest}`;
    fb.className = "feedback bad";
    if (lives <= 0) {
      locked = true;
      later(() => finish(false), 1800);
    }
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "reparte", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🍪</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} repartos resueltos</p>
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
    streak = 0;
    finished = false;
    lastTotal = -1;
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
