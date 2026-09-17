// "Reparte la paga": repartir una cantidad total entre 3 sobres según un
// porcentaje dado a cada uno. Se arrastra una barra vertical por sobre
// (pointer/touch) para asignar el importe; el acierto exige que los TRES
// importes coincidan exactamente con `total * pct/100`.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

// Ternas de porcentajes (siempre múltiplos de 5) que suman 100 entre sí.
// Combinadas con un TOTAL múltiplo de 20 (ver genRound), total*pct/100 es
// siempre un entero: pct/100 = (pct/5)/20, y total/20 ya es entero.
const PCT_POOLS = [
  [25, 50, 25],
  [50, 25, 25],
  [20, 30, 50],
  [10, 40, 50],
  [25, 25, 50],
  [40, 40, 20],
  [60, 20, 20],
  [10, 20, 70],
  [20, 20, 60],
  [30, 30, 40],
  [10, 30, 60],
  [15, 35, 50],
  [45, 35, 20],
  [55, 25, 20],
  [65, 20, 15],
  [5, 15, 80],
  [35, 35, 30],
  [10, 10, 80],
  [20, 40, 40],
  [30, 50, 20],
];

const CATEGORIAS = [
  "Ahorro", "Ocio", "Regalos", "Ropa", "Libros", "Viajes",
  "Comida", "Deporte", "Música", "Mascotas", "Tecnología", "Manualidades",
];

// Función PURA: reparte `total` según los tres porcentajes de `pcts`.
// Devuelve null si algún importe no sale entero o si no cuadra la suma,
// en vez de devolver un reparto inválido con el que jugar.
export function importes(total, pcts) {
  if (pcts.reduce((a, b) => a + b, 0) !== 100) return null;
  const amounts = pcts.map((p) => (total * p) / 100);
  if (amounts.some((a) => !Number.isInteger(a) || a <= 0)) return null;
  if (amounts.reduce((a, b) => a + b, 0) !== total) return null;
  return amounts;
}

// Genera una ronda válida: total múltiplo de 20 entre 20 y 200€, y una
// terna de porcentajes cuyos tres importes salgan enteros y positivos.
export function genRound() {
  let total = 0;
  let pcts = null;
  let amounts = null;
  let guard = 0;
  do {
    total = randInt(1, 10) * 20; // 20, 40, ... 200 (múltiplo de 4 y de 20)
    pcts = pick(PCT_POOLS);
    amounts = importes(total, pcts);
    guard++;
  } while (!amounts && guard < 500);
  if (!amounts) {
    // Red de seguridad teórica: con el pool de arriba nunca debería hacer
    // falta, pero así la ronda siempre es jugable.
    total = 80;
    pcts = [25, 50, 25];
    amounts = importes(total, pcts);
  }
  const nombres = shuffle(CATEGORIAS).slice(0, 3);
  const envelopes = pcts.map((pct, i) => ({
    name: nombres[i],
    pct,
    correct: amounts[i],
  }));
  return { total, envelopes };
}

export function mountSobresGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null; // { total, envelopes: [{name, pct, correct}] }
  let amounts = []; // importe puesto en cada sobre, en vivo
  let locked = false; // evita interacción mientras se resuelve la ronda
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
    round = genRound();
    amounts = round.envelopes.map(() => 0);
    locked = false;

    body.innerHTML = `
      <p class="prompt">Reparte <b>${round.total}€</b> en los 3 sobres según su porcentaje
        <small>Arrastra cada barra hasta el importe exacto</small></p>
      <div class="sv-summary">
        <span data-assigned>Asignado: 0€</span>
        <span data-remaining>Quedan: ${round.total}€</span>
      </div>
      <div class="sv-envelopes" data-envelopes></div>
      <div class="feedback" data-feedback></div>
      <button class="primary sv-confirm-btn" data-confirm>✅ Confirmar reparto</button>
    `;

    const envelopesEl = body.querySelector("[data-envelopes]");
    round.envelopes.forEach((env, idx) => {
      const el = document.createElement("div");
      el.className = "sv-envelope";
      el.dataset.envelope = String(idx);
      el.dataset.amount = "0";
      el.innerHTML = `
        <div class="sv-label">💌 ${env.name}<br><small>${env.pct}%</small></div>
        <div class="sv-track" data-track>
          <div class="sv-fill" data-fill style="height:0%"></div>
          <div class="sv-thumb" data-thumb style="bottom:0%"></div>
        </div>
        <div class="sv-amount" data-amountview>0€</div>
        <div class="sv-steppers">
          <button type="button" class="sv-step-btn" data-minus>−</button>
          <button type="button" class="sv-step-btn" data-plus>+</button>
        </div>
      `;
      envelopesEl.appendChild(el);
      wireEnvelope(el, idx);
    });

    body.querySelector("[data-confirm]").addEventListener("click", onConfirm);
    renderSummary();
  }

  // Engancha el arrastre (pointer/touch) de la barra vertical del sobre
  // `idx`, más los botones +/- para el ajuste fino al euro exacto.
  function wireEnvelope(el, idx) {
    const track = el.querySelector("[data-track]");
    let dragging = false;

    function valueFromEvent(e) {
      const rect = track.getBoundingClientRect();
      const ratio = clampRatio((rect.bottom - e.clientY) / rect.height);
      return Math.round(ratio * round.total);
    }
    function clampRatio(r) {
      return Math.max(0, Math.min(1, r));
    }

    track.addEventListener("pointerdown", (e) => {
      if (finished || locked) return;
      dragging = true;
      track.setPointerCapture(e.pointerId);
      setAmount(idx, valueFromEvent(e));
      e.preventDefault();
    });
    track.addEventListener("pointermove", (e) => {
      if (!dragging || finished || locked) return;
      setAmount(idx, valueFromEvent(e));
      e.preventDefault();
    });
    function stopDrag() { dragging = false; }
    track.addEventListener("pointerup", stopDrag);
    track.addEventListener("pointercancel", stopDrag);

    el.querySelector("[data-minus]").addEventListener("click", () => {
      if (finished || locked) return;
      setAmount(idx, amounts[idx] - 1);
    });
    el.querySelector("[data-plus]").addEventListener("click", () => {
      if (finished || locked) return;
      setAmount(idx, amounts[idx] + 1);
    });
  }

  function setAmount(idx, value) {
    const v = Math.max(0, Math.min(round.total, Math.round(value)));
    amounts[idx] = v;
    const el = body.querySelector(`[data-envelope="${idx}"]`);
    el.dataset.amount = String(v);
    const pct = round.total > 0 ? (v / round.total) * 100 : 0;
    el.querySelector("[data-fill]").style.height = `${pct}%`;
    el.querySelector("[data-thumb]").style.bottom = `${pct}%`;
    el.querySelector("[data-amountview]").textContent = `${v}€`;
    renderSummary();
  }

  function renderSummary() {
    const assigned = amounts.reduce((a, b) => a + b, 0);
    body.querySelector("[data-assigned]").textContent = `Asignado: ${assigned}€`;
    body.querySelector("[data-remaining]").textContent = `Quedan: ${round.total - assigned}€`;
  }

  function onConfirm() {
    if (finished || locked) return;
    const feedback = body.querySelector("[data-feedback]");
    const wrong = round.envelopes
      .map((env, i) => ({ env, i, puesto: amounts[i] }))
      .filter(({ env, puesto }) => puesto !== env.correct);

    if (wrong.length === 0) {
      locked = true;
      rounds++;
      score += 10;
      renderScore();
      const detalle = round.envelopes.map((e) => `${e.name} ${e.correct}€`).join(", ");
      feedback.textContent = `¡Reparto exacto! ${detalle}`;
      feedback.className = "feedback ok";
      later(nextRound, 900);
      return;
    }

    lives--;
    renderLives();
    feedback.textContent = wrong
      .map(({ env, puesto }) =>
        `El sobre de ${env.name} (${env.pct}%) debía llevar ${env.correct}€ (${round.total}€ × ${env.pct}%), llevaba ${puesto}€`
      )
      .join(" · ");
    feedback.className = "feedback bad";

    if (lives <= 0) {
      locked = true;
      later(() => finish(false), 1100);
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "sobres", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>💌</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} repartos exactos</p>
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
