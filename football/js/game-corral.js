// __BUILD_ID__
// "Hueveras": división con resto. Cada ronda llegan N huevos (20-80) al
// corral y hay hueveras de 6 y de 12 para guardarlos. Como 12 = 2×6,
// cualquier combinación de hueveras de 6 y de 12 solo puede llenar un
// múltiplo de 6 huevos — así que el resto que queda suelto SIEMPRE es
// N % 6, sin importar cuántas hueveras de cada tamaño se usen (usar 1
// huevera de 12 o 2 de 6 deja exactamente el mismo resto). Por eso no
// tiene sentido pedir "cuántas hueveras de cada tamaño" (hay varias
// combinaciones válidas, ambiguo) y sí pedir el resto, que es único.
//
// Interacción: el jugador ve el corral con los N huevos sueltos y, ANTES
// de que se repartan, teclea en un teclado numérico (0-5, el resto con
// hueveras de 6/12 nunca puede ser mayor) cuántos cree que van a quedar
// sueltos. Al tocar un número se anima el reparto real (hueveras de 12
// primero, luego de 6, huevo a huevo) para que vea la respuesta correcta
// dibujada y compare con lo que dijo.
import { randInt, saveScore } from "./utils.js";

const MIN_N = 20;
const MAX_N = 80;

// Resto mínimo posible al guardar N huevos en hueveras de 6 y de 12.
// Es siempre N % 6 porque 12 = 2×6: toda huevera de 12 aporta un múltiplo
// de 6 al total guardado, así que la suma guardada con cualquier mezcla
// de hueveras de 6 y de 12 es siempre múltiplo de 6, y el resto respecto
// a N no puede bajar de N % 6. Además SIEMPRE es alcanzable usando solo
// hueveras de 6 (floor(N/6) de ellas), así que N % 6 es a la vez el
// mínimo posible y el que se obtiene con cualquier combinación.
export function restoHuevos(n) {
  return n % 6;
}

// Reparto "voraz" (hueveras de 12 primero) usado solo para la animación:
// cualquier otra combinación de 6/12 sería igual de válida y dejaría el
// mismo resto, pero hay que fijar una para dibujarla.
export function repartoHuevos(n) {
  const doce = Math.floor(n / 12);
  const trasDoce = n % 12;
  const seis = Math.floor(trasDoce / 6);
  const resto = trasDoce % 6;
  return { doce, seis, resto };
}

export function mountCorralGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // ronda ya respondida, esperando animación/feedback
  let n = 0;
  let lastN = -1;
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
    do {
      n = randInt(MIN_N, MAX_N);
    } while (n === lastN);
    lastN = n;
    locked = false;

    let eggs = "";
    for (let i = 0; i < n; i++) eggs += '<span class="cr-egg" data-egg>🥚</span>';
    let keys = "";
    for (let g = 0; g <= 5; g++) {
      keys += `<button type="button" class="choice-btn cr-key" data-guess="${g}">${g}</button>`;
    }

    body.innerHTML = `
      <p class="prompt">Habéis recogido <b>${n} huevos</b><small>Con hueveras de 6 y de 12, ¿cuántos van a quedar sueltos?</small></p>
      <div class="cr-round" data-round data-n="${n}">
        <div class="cr-nest" data-nest>${eggs}</div>
        <div class="cr-keypad-wrap">
          <p class="cr-keypad-label">Sueltos (0-5):</p>
          <div class="cr-keypad" data-keypad data-locked="false">${keys}</div>
        </div>
        <div class="cr-distribution" data-distribution></div>
        <div class="feedback" data-feedback></div>
      </div>
    `;

    const keypadEl = body.querySelector("[data-keypad]");
    keypadEl.querySelectorAll("[data-guess]").forEach((btn) => {
      btn.addEventListener("click", () => onGuess(Number(btn.dataset.guess), btn));
    });
  }

  function onGuess(value, btn) {
    if (finished || locked) return;
    locked = true;
    const keypadEl = body.querySelector("[data-keypad]");
    keypadEl.dataset.locked = "true";
    keypadEl.querySelectorAll("[data-guess]").forEach((b) => { b.disabled = true; });
    btn.classList.add("cr-key-chosen");

    const { doce, seis, resto } = repartoHuevos(n);
    renderDistribution(doce, seis, resto);

    const totalBoxes = doce + seis + 1; // +1 por la pila de sueltos
    later(() => judge(value, resto, doce, seis), totalBoxes * 90 + 550);
  }

  // Dibuja el reparto real, huevera a huevera, con una animación escalonada
  // (cada huevera aparece un poco después que la anterior) para que se vea
  // "N ÷ 6" ocurriendo, no solo el resultado final.
  function renderDistribution(doce, seis, resto) {
    const dist = body.querySelector("[data-distribution]");
    let idx = 0;
    let html = "";
    for (let i = 0; i < doce; i++) {
      let dots = "";
      for (let e = 0; e < 12; e++) dots += '<i class="cr-dot"></i>';
      html += `<div class="cr-huevera cr-huevera-12" data-huevera data-size="12" style="animation-delay:${idx * 90}ms">${dots}<span class="cr-huevera-tag">de 12</span></div>`;
      idx++;
    }
    for (let i = 0; i < seis; i++) {
      let dots = "";
      for (let e = 0; e < 6; e++) dots += '<i class="cr-dot"></i>';
      html += `<div class="cr-huevera cr-huevera-6" data-huevera data-size="6" style="animation-delay:${idx * 90}ms">${dots}<span class="cr-huevera-tag">de 6</span></div>`;
      idx++;
    }
    let restDots = "";
    for (let e = 0; e < resto; e++) restDots += '<i class="cr-dot cr-dot-rest"></i>';
    html += `<div class="cr-sueltos${resto === 0 ? " cr-sueltos-cero" : ""}" data-sueltos style="animation-delay:${idx * 90}ms">${restDots || "—"}<span class="cr-huevera-tag">sueltos</span></div>`;
    dist.innerHTML = html;
  }

  function judge(guess, resto, doce, seis) {
    if (finished) return;
    rounds++;
    const fb = body.querySelector("[data-feedback]");
    const cuenta = `${n} = ${doce} × 12 + ${seis} × 6 + ${resto}`;
    if (guess === resto) {
      score += 10;
      renderScore();
      fb.textContent = `¡Correcto! ${cuenta} — sobran ${resto}.`;
      fb.className = "feedback ok";
      later(nextRound, 1500);
      return;
    }
    lives--;
    renderLives();
    const cociente = Math.floor(n / 6);
    fb.textContent = `${n} huevos entre hueveras de 6 (y de 12, que es 2 hueveras de 6): ${n} ÷ 6 = ${cociente} con resto ${resto} — quedan ${resto} sueltos, no ${guess} como dijiste.`;
    fb.className = "feedback bad";
    if (lives <= 0) {
      later(() => finish(false), 1900);
    } else {
      later(nextRound, 1900);
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
    saveScore(client, "corral", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🐔</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} corrales repartidos</p>
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
    lastN = -1;
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
