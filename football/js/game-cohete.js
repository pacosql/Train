// "Cohete exponencial": alcanzar una órbita objetivo ajustando BASE y
// EXPONENTE por separado. El objetivo siempre es una potencia exacta
// dentro de los rangos permitidos (se construye así a propósito), así
// que combinacionesValidas() nunca puede salir vacía para un objetivo
// generado por nextRound().
import { randInt, clamp, saveScore } from "./utils.js";

const BASE_MIN = 2;
const BASE_MAX = 9;
const EXP_MIN = 2;
const EXP_MAX = 6;
const TARGET_MAX = 9 ** 4; // 6561 — tope razonable para no pedir órbitas absurdas

// Fuerza bruta sobre los rangos permitidos: devuelve TODAS las parejas
// (base, exponente) que dan exactamente `objetivo`. Como mucho son
// (BASE_MAX-BASE_MIN+1) * (EXP_MAX-EXP_MIN+1) = 8*5 = 40 combinaciones a probar.
export function combinacionesValidas(objetivo, baseMin = BASE_MIN, baseMax = BASE_MAX, expMin = EXP_MIN, expMax = EXP_MAX) {
  const combos = [];
  for (let b = baseMin; b <= baseMax; b++) {
    for (let e = expMin; e <= expMax; e++) {
      if (b ** e === objetivo) combos.push([b, e]);
    }
  }
  return combos;
}

export function mountCoheteGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let target = 0;
  let lastTarget = -1;
  let base = BASE_MIN;
  let exp = EXP_MIN;
  let locked = false; // evita lanzar mientras se resuelve el intento
  const timers = [];

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body ck-body" data-body></div>
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

  // Genera un objetivo que ES una potencia exacta dentro de los rangos
  // permitidos (se sortea base/exp y se calcula target = base^exp), así
  // que siempre hay al menos una combinación válida por construcción.
  function nextRound() {
    do {
      base = randInt(BASE_MIN, BASE_MAX);
      exp = randInt(EXP_MIN, EXP_MAX);
      target = base ** exp;
    } while (target > TARGET_MAX || target === lastTarget);
    lastTarget = target;
    locked = false;
    // El jugador empieza siempre desde los valores mínimos, no desde la
    // combinación que generó el objetivo (sería regalarle la respuesta).
    base = BASE_MIN;
    exp = EXP_MIN;

    body.innerHTML = `
      <p class="prompt">Alcanza la órbita a <b>${target}</b><small>Ajusta base y exponente: empuje = base<sup>exp</sup></small></p>
      <div class="ck-orbit-zone">
        <div class="ck-track" data-track>
          <div class="ck-target-line" data-target-line><i>Objetivo · ${target}</i></div>
          <div class="ck-rocket" data-rocket>🚀</div>
        </div>
        <div class="ck-readout" data-thrust></div>
      </div>
      <div class="ck-controls">
        <div class="ck-stepper">
          <span class="ck-stepper-label">Base</span>
          <div class="ck-stepper-row">
            <button class="ck-step-btn" type="button" data-base-minus>−</button>
            <span class="ck-stepper-value" data-base-value></span>
            <button class="ck-step-btn" type="button" data-base-plus>+</button>
          </div>
        </div>
        <div class="ck-stepper">
          <span class="ck-stepper-label">Exponente</span>
          <div class="ck-stepper-row">
            <button class="ck-step-btn" type="button" data-exp-minus>−</button>
            <span class="ck-stepper-value" data-exp-value></span>
            <button class="ck-step-btn" type="button" data-exp-plus>+</button>
          </div>
        </div>
      </div>
      <button class="primary ck-launch-btn" type="button" data-launch>🚀 Lanzar</button>
      <div class="feedback" data-feedback></div>
    `;

    body.querySelector("[data-base-minus]").addEventListener("click", () => step("base", -1));
    body.querySelector("[data-base-plus]").addEventListener("click", () => step("base", 1));
    body.querySelector("[data-exp-minus]").addEventListener("click", () => step("exp", -1));
    body.querySelector("[data-exp-plus]").addEventListener("click", () => step("exp", 1));
    body.querySelector("[data-launch]").addEventListener("click", launch);

    renderControls();
  }

  function step(which, delta) {
    if (finished || locked) return;
    if (which === "base") base = clamp(base + delta, BASE_MIN, BASE_MAX);
    else exp = clamp(exp + delta, EXP_MIN, EXP_MAX);
    renderControls();
  }

  // Escala visual: la altura del cohete es el empuje actual recortado
  // (clamped) a target*1.3 y convertido a porcentaje sobre ese tope. Las
  // potencias crecen demasiado rápido para una escala lineal sin recorte
  // — con el clamp, cualquier empuje igual o mayor al 130% del objetivo
  // se ve "a tope de pantalla" en vez de desbordar el layout.
  function renderControls() {
    const empuje = base ** exp;
    const escalaMax = target * 1.3;
    const alturaVisual = Math.min(empuje, escalaMax);
    const pct = clamp((alturaVisual / escalaMax) * 100, 0, 100);
    const pctObjetivo = clamp((target / escalaMax) * 100, 0, 100);

    body.querySelector("[data-base-value]").textContent = base;
    body.querySelector("[data-exp-value]").textContent = exp;
    body.querySelector("[data-rocket]").style.bottom = `${pct}%`;
    body.querySelector("[data-target-line]").style.bottom = `${pctObjetivo}%`;
    body.querySelector("[data-thrust]").innerHTML = `Empuje actual: <b>${base}<sup>${exp}</sup> = ${empuje}</b>`;
  }

  function launch() {
    if (finished || locked) return;
    const empuje = base ** exp;
    const feedback = body.querySelector("[data-feedback]");
    if (empuje === target) {
      locked = true;
      rounds++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Órbita alcanzada! ${base}^${exp} = ${target}, justo el objetivo.`;
      feedback.className = "feedback ok";
      later(nextRound, 900);
    } else {
      rounds++;
      lives--;
      renderLives();
      const combos = combinacionesValidas(target).filter(([b, e]) => !(b === base && e === exp));
      const ejemplos = (combos.length ? combos : combinacionesValidas(target))
        .slice(0, 2)
        .map(([b, e]) => `${b}^${e}=${target}`)
        .join(" o ");
      const comparativa = empuje < target ? "se quedó corto" : "se pasó";
      feedback.textContent = `Tu cohete llegó a ${base}^${exp}=${empuje}, ${comparativa} respecto a ${target}. Podías haber probado ${ejemplos}.`;
      feedback.className = "feedback bad";
      if (lives <= 0) {
        locked = true;
        later(() => finish(false), 1200);
      } else {
        locked = true;
        later(() => {
          locked = false;
          feedback.textContent = "";
          feedback.className = "feedback";
        }, 1200);
      }
    }
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "cohete", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🚀</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} lanzamientos</p>
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
    lastTarget = -1;
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
