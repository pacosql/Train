// "Cuántos conjuntos": en vez de preguntar cuántas combinaciones salen,
// hay que CONSTRUIRLAS TODAS tocando una camiseta y un pantalón. Al
// terminar se enseña la rejilla 3×4 y se ve que el producto es la tabla:
// tantas filas por tantas columnas.
import { pick, shuffle, saveScore } from "./utils.js";

// Colores con nombre en femenino (camiseta) y masculino (pantalón).
const COLORS = [
  { f: "roja", m: "rojo", hex: "#e5484d" },
  { f: "azul", m: "azul", hex: "#3b82f6" },
  { f: "verde", m: "verde", hex: "#16a34a" },
  { f: "amarilla", m: "amarillo", hex: "#eab308" },
  { f: "morada", m: "morado", hex: "#8b5cf6" },
  { f: "naranja", m: "naranja", hex: "#f97316" },
  { f: "gris", m: "gris", hex: "#94a3b8" },
  { f: "rosa", m: "rosa", hex: "#ec4899" },
];

// La talla del escaparate sube con la racha, pero el producto se queda
// en 12 para que una ronda se resuelva en menos de un minuto.
const SIZES = [
  [[2, 3]],
  [[3, 3], [2, 4]],
  [[3, 4], [4, 3]],
];

export function makeConjuntosRound(streak) {
  const tier = streak >= 4 ? 2 : (streak >= 2 ? 1 : 0);
  let size = pick(SIZES[tier]);
  let guard = 0;
  // Guarda de calidad: nunca menos de 6 ni más de 12 combinaciones, y
  // siempre al menos 2 camisetas y 3 pantalones.
  while (guard++ < 50 && !(size[0] >= 2 && size[1] >= 3 && size[0] * size[1] >= 6 && size[0] * size[1] <= 12)) {
    size = pick(SIZES[tier]);
  }
  if (!(size[0] >= 2 && size[1] >= 3 && size[0] * size[1] >= 6 && size[0] * size[1] <= 12)) size = [3, 4];
  const colors = shuffle(COLORS);
  const tops = colors.slice(0, size[0]).map((c) => ({ ...c }));
  const bottoms = shuffle(COLORS).slice(0, size[1]).map((c) => ({ ...c }));
  const total = size[0] * size[1];
  const margin = streak >= 4 ? 1 : (streak >= 2 ? 2 : 3);
  return { tops, bottoms, total, budget: total + margin, margin };
}

export function mountConjuntosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let round = null;
  let done = new Set();   // "ti-bi" ya construidos
  let tries = 0;
  let selTop = -1;
  let selBottom = -1;
  let locked = false;
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
    round = makeConjuntosRound(streak);
    done = new Set();
    tries = 0;
    selTop = -1;
    selBottom = -1;
    locked = false;

    body.innerHTML = `
      <div class="cj-wrap">
        <p class="prompt cj-prompt">🧵 Monta <b>todos</b> los conjuntos distintos
          <small>Una camiseta + un pantalón. No repitas ninguno.</small></p>
        <div class="cj-rack" data-tops></div>
        <div class="cj-vs">+</div>
        <div class="cj-rack" data-bottoms></div>
        <div class="cj-board">
          <div class="cj-count" data-count></div>
          <div class="cj-tries" data-tries></div>
        </div>
        <div class="cj-made" data-made></div>
        <div class="feedback" data-feedback></div>
      </div>
    `;

    const topsEl = body.querySelector("[data-tops]");
    round.tops.forEach((c, i) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn cj-item";
      btn.type = "button";
      btn.innerHTML = `<span class="cj-swatch" style="background:${c.hex}">👕</span><small>${c.f}</small>`;
      btn.addEventListener("click", () => tapTop(i));
      topsEl.appendChild(btn);
    });
    const bottomsEl = body.querySelector("[data-bottoms]");
    round.bottoms.forEach((c, i) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn cj-item";
      btn.type = "button";
      btn.innerHTML = `<span class="cj-swatch" style="background:${c.hex}">👖</span><small>${c.m}</small>`;
      btn.addEventListener("click", () => tapBottom(i));
      bottomsEl.appendChild(btn);
    });
    renderState();
  }

  function renderState() {
    body.querySelector("[data-count]").innerHTML =
      `<b>${done.size}</b> de <b>${round.total}</b> conjuntos`;
    body.querySelector("[data-tries]").textContent =
      `Intentos: ${round.budget - tries}`;
    body.querySelectorAll("[data-tops] .cj-item").forEach((btn, i) => {
      btn.classList.toggle("cj-sel", selTop === i);
      btn.disabled = locked;
    });
    body.querySelectorAll("[data-bottoms] .cj-item").forEach((btn, i) => {
      btn.classList.toggle("cj-sel", selBottom === i);
      btn.disabled = locked;
    });
    const made = body.querySelector("[data-made]");
    made.innerHTML = Array.from(done).map((key) => {
      const [ti, bi] = key.split("-").map(Number);
      return `<span class="cj-chip">
        <i style="background:${round.tops[ti].hex}"></i><i style="background:${round.bottoms[bi].hex}"></i></span>`;
    }).join("");
  }

  function tapTop(i) {
    if (finished || locked) return;
    selTop = selTop === i ? -1 : i;
    renderState();
    tryPair();
  }
  function tapBottom(i) {
    if (finished || locked) return;
    selBottom = selBottom === i ? -1 : i;
    renderState();
    tryPair();
  }

  function tryPair() {
    if (selTop < 0 || selBottom < 0) return;
    const key = `${selTop}-${selBottom}`;
    const feedback = body.querySelector("[data-feedback]");
    tries++;
    if (done.has(key)) {
      // Repetir gasta un intento: por eso hay que llevar la cuenta.
      feedback.textContent = `Ese ya lo tenías: ${round.tops[selTop].f} con ${round.bottoms[selBottom].m}`;
      feedback.className = "feedback bad";
    } else {
      done.add(key);
      feedback.textContent = `${round.tops[selTop].f} + ${round.bottoms[selBottom].m} ✔`;
      feedback.className = "feedback ok";
    }
    selTop = -1;
    selBottom = -1;
    renderState();
    if (done.size === round.total) return win();
    if (tries >= round.budget) return lose();
  }

  // Al completarlas, la rejilla enseña que el total es filas × columnas.
  function gridHtml(showMissing) {
    let html = `<div class="cj-grid" style="grid-template-columns:28px repeat(${round.bottoms.length}, 1fr)">`;
    html += `<span class="cj-gh"></span>`;
    round.bottoms.forEach((c) => {
      html += `<span class="cj-gh"><i style="background:${c.hex}">👖</i></span>`;
    });
    round.tops.forEach((t, ti) => {
      html += `<span class="cj-gh"><i style="background:${t.hex}">👕</i></span>`;
      round.bottoms.forEach((b, bi) => {
        const hit = done.has(`${ti}-${bi}`);
        html += `<span class="cj-cell ${hit ? "ok" : (showMissing ? "miss" : "")}">
          <i style="background:${t.hex}"></i><i style="background:${b.hex}"></i>
          ${hit ? "" : (showMissing ? "<u>?</u>" : "")}</span>`;
      });
    });
    html += `</div>`;
    return html;
  }

  function win() {
    locked = true;
    rounds++;
    score += 10;
    streak++;
    renderScore();
    renderState();
    const feedback = body.querySelector("[data-feedback]");
    feedback.innerHTML = `¡Todos! ${round.tops.length} camisetas × ${round.bottoms.length} pantalones =
      <b>${round.total}</b> conjuntos`;
    feedback.className = "feedback ok";
    body.querySelector("[data-made]").innerHTML = gridHtml(false);
    later(nextRound, 2400);
  }

  function lose() {
    locked = true;
    rounds++;
    streak = 0;
    lives--;
    renderLives();
    renderState();
    // Al fallar se ve EXACTAMENTE qué conjuntos faltaban, en la rejilla.
    const missing = [];
    round.tops.forEach((t, ti) => round.bottoms.forEach((b, bi) => {
      if (!done.has(`${ti}-${bi}`)) missing.push(`${t.f} + ${b.m}`);
    }));
    const feedback = body.querySelector("[data-feedback]");
    feedback.innerHTML = `Sin intentos con ${done.size} de ${round.total}.
      Faltaban ${missing.length}: <b>${missing.join(", ")}</b>`;
    feedback.className = "feedback bad";
    body.querySelector("[data-made]").innerHTML = gridHtml(true);
    if (lives <= 0) return later(() => finish(false), 3000);
    later(nextRound, 3000);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "conjuntos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧵</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} escaparates montados</p>
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
