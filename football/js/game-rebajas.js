// "Rebajas": la etiqueta trae el precio de antes y el de ahora, y hay que
// hallar el PORCENTAJE que le han quitado (la inversión del ejercicio de
// siempre). Se estira con el dedo una barra que vale el precio entero: la
// parte sombreada es a la vez el tanto por ciento y el dinero que te
// ahorras, así que el porcentaje se ve como longitud.
import { randInt, pick, clamp, saveScore } from "./utils.js";

// Paradas de la barra: de 5 en 5. La respuesta es siempre una de ellas.
const STOPS = [];
for (let s = 0; s <= 100; s += 5) STOPS.push(s);

const EASY = [10, 25, 50];
const MID = [5, 20, 30, 40, 75];
const HARD = [15, 60];

export function makeRebajasRound(streak, lastKey) {
  const pool = streak < 2 ? EASY : streak < 4 ? EASY.concat(MID) : EASY.concat(MID, HARD);
  let guard = 0;
  let r = null;
  while (guard < 500 && !r) {
    guard++;
    const d = pick(pool);
    const euros = randInt(streak < 2 ? 4 : 6, streak < 4 ? 60 : 120);
    const cents = pick(streak < 2 ? [0] : [0, 0, 0, 50, 20, 40, 60, 80]);
    const P = euros * 100 + cents;
    // El precio rebajado tiene que salir exacto en céntimos.
    if ((P * d) % 100 !== 0) continue;
    const saving = (P * d) / 100;
    const F = P - saving;
    if (F < 100) continue;
    // Unicidad: ninguna otra parada de la barra puede marcar ese ahorro
    // (y por tanto ese precio final), ni siquiera al redondear a céntimos.
    let dup = false;
    for (const s of STOPS) {
      if (s === d) continue;
      if (Math.round((P * s) / 100) === saving) { dup = true; break; }
    }
    if (dup) continue;
    const key = `${P}-${d}`;
    if (key === lastKey) continue;
    r = { P, d, F, saving, key };
  }
  if (!r) r = { P: 4000, d: 25, F: 3000, saving: 1000, key: "4000-25" };
  return r;
}

function eur(cents) {
  const c = Math.abs(cents);
  const e = Math.floor(c / 100);
  const r = c % 100;
  return `${cents < 0 ? "-" : ""}${e},${r < 10 ? `0${r}` : r} €`;
}

export function mountRebajasGame(container, { client, onExit }) {
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

  function nextRound() {
    round = makeRebajasRound(streak, lastKey);
    lastKey = round.key;
    chosen = 0;
    locked = false;

    body.innerHTML = `
      <p class="prompt">¿Qué descuento le han hecho?<small>Estira la barra hasta ahorrar lo justo</small></p>
      <div class="rb-tag">
        <span class="rb-old">${eur(round.P)}</span>
        <span class="rb-arrow">→</span>
        <span class="rb-new">${eur(round.F)}</span>
      </div>
      <div class="rb-barwrap">
        <div class="rb-scale">
          <span style="left:0%">0 %</span>
          <span style="left:25%">25</span>
          <span style="left:50%">50</span>
          <span style="left:75%">75</span>
          <span style="left:100%">100</span>
        </div>
        <div class="rb-bar" data-track>
          <div class="rb-shade" data-shade style="width:0%"></div>
          <span class="rb-handle" data-handle style="left:0%"></span>
        </div>
        <div class="rb-scale rb-scale-eur">
          <span style="left:0%">0 €</span>
          <span style="left:50%">${eur(Math.round(round.P / 2))}</span>
          <span style="left:100%">${eur(round.P)}</span>
        </div>
      </div>
      <div class="rb-read">
        <b data-pct>0 %</b>
        <span>te ahorras <b data-sav>0,00 €</b></span>
      </div>
      <button class="primary" data-check>🏷️ Poner la etiqueta</button>
      <div class="rb-calc" data-calc></div>
      <div class="feedback" data-feedback></div>
    `;

    const track = body.querySelector("[data-track]");
    let dragging = false;
    function stopAt(ev) {
      const rect = track.getBoundingClientRect();
      const frac = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
      // El dedo solo puede soltar en una parada de 5 en 5.
      return Math.round((frac * 100) / 5) * 5;
    }
    track.addEventListener("pointerdown", (ev) => {
      if (finished || locked) return;
      dragging = true;
      if (track.setPointerCapture) track.setPointerCapture(ev.pointerId);
      setChosen(stopAt(ev));
      ev.preventDefault();
    });
    track.addEventListener("pointermove", (ev) => {
      if (!dragging || finished || locked) return;
      setChosen(stopAt(ev));
    });
    track.addEventListener("pointerup", () => { dragging = false; });
    track.addEventListener("pointercancel", () => { dragging = false; });
    body.querySelector("[data-check]").addEventListener("click", check);
    setChosen(0);
  }

  function setChosen(pct) {
    chosen = clamp(pct, 0, 100);
    body.querySelector("[data-shade]").style.width = `${chosen}%`;
    body.querySelector("[data-handle]").style.left = `${chosen}%`;
    body.querySelector("[data-pct]").textContent = `${chosen} %`;
    body.querySelector("[data-sav]").textContent = eur(Math.round((round.P * chosen) / 100));
  }

  function check() {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (chosen === round.d) {
      score += 10;
      streak++;
      renderScore();
      feedback.textContent = `¡Sí! ${round.d} % de ${eur(round.P)} = ${eur(round.saving)}`;
      feedback.className = "feedback ok";
      later(nextRound, 1000);
      return;
    }
    lives--;
    streak = 0;
    renderLives();
    showCalc();
    feedback.textContent = `Era el ${round.d} %, no el ${chosen} %`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 3400);
    later(nextRound, 3400);
  }

  // Al fallar se ve la barra correcta encima de la del jugador y la resta
  // que había que hacer.
  function showCalc() {
    const mine = Math.round((round.P * chosen) / 100);
    const track = body.querySelector("[data-track]");
    body.querySelector("[data-shade]").classList.add("rb-shade-bad");
    const good = document.createElement("div");
    good.className = "rb-goodbar";
    good.style.width = `${round.d}%`;
    good.innerHTML = `<i>${round.d} %</i>`;
    track.appendChild(good);
    body.querySelector("[data-calc]").innerHTML = `
      <div class="rb-calc-row rb-calc-good">${round.d} % de ${eur(round.P)} = ${eur(round.saving)} → ${eur(round.P)} − ${eur(round.saving)} = <b>${eur(round.F)}</b></div>
      <div class="rb-calc-row">Tú marcaste ${chosen} % = ${eur(mine)} → quedaba en ${eur(round.P - mine)}</div>
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
    saveScore(client, "rebajas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🏷️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} etiquetas puestas</p>
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
