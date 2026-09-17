// "Mezcla las probetas": dos disoluciones de distinta concentración y un
// matraz que hay que llenar con un volumen y una concentración exactos.
// Verter con el dedo ES hacer la media ponderada: el color del matraz sale
// entre los dos colores, más cerca del líquido del que se echa más.
import { randInt, clamp, saveScore } from "./utils.js";

const STEP = 10;   // la probeta solo vierte de 10 en 10 ml
const AVAIL = 100; // ml disponibles en cada probeta
const FLASK = 200; // capacidad dibujada del matraz

// Ronda con solución ÚNICA: fijamos volumen final V y concentración cT, así
// vA y vB salen de un sistema de dos ecuaciones (una sola solución posible),
// y exigimos que vA y vB caigan justo en las medidas disponibles.
export function makeProbetasRound(streak, lastKey) {
  let guard = 0;
  let r = null;
  while (guard < 400 && !r) {
    guard++;
    const cB = randInt(1, 4) * 10;       // la floja: 10..40 %
    const cA = cB + randInt(2, 5) * 10;  // la fuerte: al menos 20 puntos más
    if (cA > 90) continue;
    const V = randInt(4, 10) * 10;       // 40..100 ml de mezcla
    const steps = (cA - cB) / 5;
    const cT = cB + randInt(1, steps - 1) * 5; // estrictamente entre las dos
    const num = V * (cT - cB);
    const den = cA - cB;
    if (num % den !== 0) continue;             // todo en enteros: nada de comas
    const vA = num / den;
    const vB = V - vA;
    if (vA % STEP !== 0 || vB % STEP !== 0) continue;
    if (vA < STEP || vB < STEP) continue;      // las dos probetas se usan
    if (vA > AVAIL || vB > AVAIL) continue;
    const ratio = Math.max(vA, vB) / Math.min(vA, vB);
    if (streak < 2 && vA !== vB) continue;     // al principio: mitad y mitad
    if (streak < 4 && ratio > 2) continue;
    if (streak >= 4 && vA === vB) continue;    // con racha, nunca el caso fácil
    const key = `${cA}-${cB}-${cT}-${V}`;
    if (key === lastKey) continue;
    r = { cA, cB, cT, V, vA, vB, avail: AVAIL, step: STEP, key };
  }
  // Caso fijo válido si la guarda se agota.
  if (!r) r = { cA: 60, cB: 20, cT: 40, V: 60, vA: 30, vB: 30, avail: AVAIL, step: STEP, key: "60-20-40-60" };
  return r;
}

// Color de una concentración: más concentrado, más oscuro. El color de la
// mezcla es literalmente la media ponderada que hay que calcular.
function tint(conc) {
  return `hsl(195 72% ${88 - conc * 0.48}%)`;
}
function pct1(soluto, total) {
  if (total === 0) return "—";
  const t = Math.round((soluto * 1000) / total);
  let s = (t / 10).toFixed(1).replace(".", ",");
  if (s.endsWith(",0")) s = s.slice(0, -2);
  return `${s} %`;
}

export function mountProbetasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let round = null;
  let poured = { a: 0, b: 0 };
  let lastKey = "";
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

  function tubeHtml(side, conc) {
    return `
      <div class="pb2-tube-wrap">
        <div class="pb2-tube" data-tube="${side}">
          <div class="pb2-liquid" data-liquid="${side}" style="height:100%;background:${tint(conc)}"></div>
          <span class="pb2-grad" style="bottom:25%"></span>
          <span class="pb2-grad" style="bottom:50%"></span>
          <span class="pb2-grad" style="bottom:75%"></span>
        </div>
        <div class="pb2-tube-name">${side === "a" ? "A" : "B"} · <b>${conc} %</b></div>
        <div class="pb2-tube-read">vierte <b data-pour="${side}">0</b> ml</div>
      </div>
    `;
  }

  function nextRound() {
    round = makeProbetasRound(streak, lastKey);
    lastKey = round.key;
    poured = { a: 0, b: 0 };
    locked = false;

    body.innerHTML = `
      <p class="prompt">Prepara <b>${round.V} ml</b> al <b>${round.cT} %</b><small>Arrastra hacia abajo en cada probeta para verter</small></p>
      <div class="pb2-bench">
        ${tubeHtml("a", round.cA)}
        ${tubeHtml("b", round.cB)}
        <div class="pb2-flask-wrap">
          <div class="pb2-flask">
            <div class="pb2-mix" data-mix style="height:0%"></div>
            <span class="pb2-goal-line" style="bottom:${(round.V / FLASK) * 100}%"><i>${round.V} ml</i></span>
          </div>
          <div class="pb2-flask-read"><b data-total>0</b> / ${round.V} ml</div>
          <div class="pb2-target">
            <span class="pb2-swatch" style="background:${tint(round.cT)}"></span> ${round.cT} %
          </div>
        </div>
      </div>
      <div class="pb2-calc" data-calc></div>
      <div class="pb2-actions">
        <button class="primary" data-mixbtn>🧪 Mezclar</button>
        <button class="secondary" data-empty>↺ Vaciar</button>
      </div>
      <div class="feedback" data-feedback></div>
    `;

    ["a", "b"].forEach((side) => {
      bindPour(body.querySelector(`[data-tube="${side}"]`), side);
    });
    body.querySelector("[data-mixbtn]").addEventListener("click", check);
    body.querySelector("[data-empty]").addEventListener("click", () => {
      if (finished || locked) return;
      poured = { a: 0, b: 0 };
      paint();
      const feedback = body.querySelector("[data-feedback]");
      feedback.textContent = "";
      feedback.className = "feedback";
    });
    paint();
  }

  // Arrastrar de arriba abajo por la probeta: el dedo marca la superficie
  // del líquido que queda, y lo que baja es lo que se vierte.
  function bindPour(el, side) {
    let dragging = false;
    function value(ev) {
      const r = el.getBoundingClientRect();
      const frac = clamp((ev.clientY - r.top) / r.height, 0, 1);
      return Math.round((frac * round.avail) / STEP) * STEP;
    }
    el.addEventListener("pointerdown", (ev) => {
      if (finished || locked) return;
      dragging = true;
      if (el.setPointerCapture) el.setPointerCapture(ev.pointerId);
      poured[side] = value(ev);
      paint();
      ev.preventDefault();
    });
    el.addEventListener("pointermove", (ev) => {
      if (!dragging || finished || locked) return;
      poured[side] = value(ev);
      paint();
    });
    el.addEventListener("pointerup", () => { dragging = false; });
    el.addEventListener("pointercancel", () => { dragging = false; });
  }

  function soluto() {
    // ml de sustancia: v * c / 100, siempre entero (v y c son múltiplos de 10).
    return (poured.a * round.cA + poured.b * round.cB) / 100;
  }

  function paint() {
    const total = poured.a + poured.b;
    ["a", "b"].forEach((side) => {
      const rest = round.avail - poured[side];
      body.querySelector(`[data-liquid="${side}"]`).style.height = `${(rest / round.avail) * 100}%`;
      body.querySelector(`[data-pour="${side}"]`).textContent = poured[side];
    });
    const mix = body.querySelector("[data-mix]");
    mix.style.height = `${Math.min((total / FLASK) * 100, 100)}%`;
    // El color de la mezcla: la media ponderada, sin dar el número.
    mix.style.background = total === 0 ? "transparent" : tint((soluto() * 100) / total);
    body.querySelector("[data-total]").textContent = total;
  }

  function check() {
    if (finished || locked) return;
    const total = poured.a + poured.b;
    const feedback = body.querySelector("[data-feedback]");
    if (total !== round.V) {
      // Aviso sin castigo: el volumen se ve en el matraz.
      feedback.textContent = `El matraz debe tener justo ${round.V} ml (tienes ${total})`;
      feedback.className = "feedback bad";
      return;
    }
    locked = true;
    rounds++;
    // Comparación entera: nada de flotantes.
    const exact = poured.a * round.cA + poured.b * round.cB === round.cT * round.V;
    if (exact) {
      score += 10;
      streak++;
      renderScore();
      feedback.textContent = `¡Mezcla clavada al ${round.cT} %!`;
      feedback.className = "feedback ok";
      later(nextRound, 1000);
      return;
    }
    lives--;
    streak = 0;
    renderLives();
    showCalc();
    feedback.textContent = `Te ha salido al ${pct1(soluto(), total)}, no al ${round.cT} %`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 3400);
    later(nextRound, 3400);
  }

  // Al fallar se ve de dónde sale la media: cada probeta aporta su parte.
  function showCalc() {
    const sa = (poured.a * round.cA) / 100;
    const sb = (poured.b * round.cB) / 100;
    body.querySelector("[data-calc]").innerHTML = `
      <div class="pb2-calc-row">${poured.a} ml × ${round.cA} % = <b>${sa}</b> ml</div>
      <div class="pb2-calc-row">${poured.b} ml × ${round.cB} % = <b>${sb}</b> ml</div>
      <div class="pb2-calc-row pb2-calc-sum">${sa + sb} ml en ${poured.a + poured.b} ml = <b>${pct1(sa + sb, poured.a + poured.b)}</b></div>
      <div class="pb2-calc-row pb2-calc-good">Era ${round.vA} ml de A + ${round.vB} ml de B = ${round.cT} %</div>
    `;
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "probetas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧪</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} mezclas preparadas</p>
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
    lastKey = "";
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
