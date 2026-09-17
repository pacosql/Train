// "La misma cantidad": dos barras del MISMO largo partidas en distinto
// número de trozos. Arriba está marcada 2/3; abajo hay que llevar la marca
// hasta el mismo punto de una barra partida en 6.
// La equivalencia no se calcula: se ve como la misma longitud, y el dedo
// solo puede soltar la marca en una división, así que mover la marca ES
// elegir el numerador.
import { randInt, clamp, saveScore } from "./utils.js";

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

// Elige una fracción n1/d1 irreducible y un segundo denominador
// d2 = d1 * m (múltiplo, así la fracción es representable exacta en las dos
// barras y la solución es UNA sola división: la n1*m).
export function makeBarras2Round(streak, lastKey) {
  const maxD1 = streak < 2 ? 3 : streak < 4 ? 4 : streak < 6 ? 5 : 6;
  const maxM = streak < 2 ? 2 : streak < 5 ? 3 : 4;
  let d1 = 3;
  let m = 2;
  let n1 = 2;
  let d2 = 6;
  let key = "2/3>6";
  let guard = 0;
  let ok = false;
  while (guard < 300 && !ok) {
    guard++;
    d1 = randInt(2, maxD1);
    m = randInt(2, maxM);
    d2 = d1 * m;
    n1 = randInt(1, d1 - 1);
    key = `${n1}/${d1}>${d2}`;
    ok = d2 <= 12 && gcd(n1, d1) === 1 && key !== lastKey;
  }
  if (!ok) {
    // Caso fijo válido (nunca una ronda rota).
    d1 = 3; m = 2; d2 = 6; n1 = 2; key = "2/3>6";
  }
  return { d1, n1, m, d2, n2: n1 * m, key };
}

export function mountBarras2Game(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let round = null;
  let chosen = 0;
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

  // Ticks (divisiones) de una barra partida en d trozos.
  function ticks(d) {
    let html = "";
    for (let i = 1; i < d; i++) {
      html += `<span class="ba-tick" style="left:${(i / d) * 100}%"></span>`;
    }
    return html;
  }

  function nextRound() {
    round = makeBarras2Round(streak, lastKey);
    lastKey = round.key;
    chosen = 0;
    locked = false;

    body.innerHTML = `
      <p class="prompt">¿Dónde cae <b>${round.n1}/${round.d1}</b> en la barra de <b>${round.d2}</b> trozos?<small>Arrastra la marca hasta la misma cantidad</small></p>
      <div class="ba-stack">
        <div class="ba-lane">
          <div class="ba-label">Modelo · <b>${round.n1}/${round.d1}</b></div>
          <div class="ba-bar">
            <div class="ba-fill ba-fill-model" style="width:${(round.n1 / round.d1) * 100}%"></div>
            ${ticks(round.d1)}
            <span class="ba-goal" style="left:${(round.n1 / round.d1) * 100}%"></span>
          </div>
        </div>
        <div class="ba-lane">
          <div class="ba-label">Tu barra · <b data-read>0/${round.d2}</b></div>
          <div class="ba-bar ba-bar-play" data-track>
            <div class="ba-fill ba-fill-play" data-fill style="width:0%"></div>
            ${ticks(round.d2)}
            <span class="ba-handle" data-handle style="left:0%"></span>
          </div>
        </div>
      </div>
      <div class="ba-over" data-over></div>
      <button class="primary ba-check" data-check>Comprobar</button>
      <div class="feedback" data-feedback></div>
    `;

    const track = body.querySelector("[data-track]");
    bindDrag(track, (frac) => {
      if (finished || locked) return;
      // Solo se puede soltar en una división: el dedo elige un numerador.
      setChosen(Math.round(frac * round.d2));
    });
    body.querySelector("[data-check]").addEventListener("click", check);
    setChosen(0);
  }

  // Arrastrar/tocar a lo largo de un elemento → fracción horizontal 0..1.
  function bindDrag(el, onMove) {
    let dragging = false;
    function frac(ev) {
      const r = el.getBoundingClientRect();
      return clamp((ev.clientX - r.left) / r.width, 0, 1);
    }
    el.addEventListener("pointerdown", (ev) => {
      dragging = true;
      if (el.setPointerCapture) el.setPointerCapture(ev.pointerId);
      onMove(frac(ev));
      ev.preventDefault();
    });
    el.addEventListener("pointermove", (ev) => { if (dragging) onMove(frac(ev)); });
    el.addEventListener("pointerup", () => { dragging = false; });
    el.addEventListener("pointercancel", () => { dragging = false; });
  }

  function setChosen(k) {
    chosen = clamp(k, 0, round.d2);
    const pct = (chosen / round.d2) * 100;
    body.querySelector("[data-fill]").style.width = `${pct}%`;
    body.querySelector("[data-handle]").style.left = `${pct}%`;
    body.querySelector("[data-read]").textContent = `${chosen}/${round.d2}`;
  }

  function check() {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (chosen === round.n2) {
      score += 10;
      streak++;
      renderScore();
      feedback.textContent = `¡Igual de largas! ${round.n1}/${round.d1} = ${round.n2}/${round.d2}`;
      feedback.className = "feedback ok";
      later(nextRound, 1000);
      return;
    }
    lives--;
    streak = 0;
    renderLives();
    showOverlap();
    const diff = Math.abs(chosen - round.n2);
    const sobra = chosen > round.n2;
    feedback.innerHTML = `${round.n1}/${round.d1} = <b>${round.n2}/${round.d2}</b> — te ${sobra ? "sobran" : "faltan"} ${diff}/${round.d2}`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 2800);
    later(nextRound, 2800);
  }

  // Superpone las dos barras para que el desfase se vea como longitud.
  function showOverlap() {
    const a = (round.n2 / round.d2) * 100;
    const b = (chosen / round.d2) * 100;
    const from = Math.min(a, b);
    const to = Math.max(a, b);
    body.querySelector("[data-over]").innerHTML = `
      <div class="ba-over-title">Superpuestas:</div>
      <div class="ba-over-lane">
        <div class="ba-over-fill ba-over-a" style="width:${a}%"></div>
        <div class="ba-over-name">${round.n1}/${round.d1}</div>
      </div>
      <div class="ba-over-lane">
        <div class="ba-over-fill ba-over-b" style="width:${b}%"></div>
        <div class="ba-over-gap" style="left:${from}%;width:${to - from}%"></div>
        <div class="ba-over-name">${chosen}/${round.d2}</div>
      </div>
    `;
    body.querySelector("[data-handle]").classList.add("ba-handle-bad");
    const goal = document.createElement("span");
    goal.className = "ba-handle ba-handle-good";
    goal.style.left = `${a}%`;
    body.querySelector("[data-track]").appendChild(goal);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "barras2", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📏</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} barras medidas</p>
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
