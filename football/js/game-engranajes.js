// "Engranajes": dos ruedas dentadas con una marca pintada. Al rodar una,
// la otra gira al revés y las marcas sólo vuelven a coincidir arriba
// cuando han pasado m.c.m.(dientes) dientes por el punto de contacto.
// Rodar con el dedo ES calcular el mínimo común múltiplo: cada vuelta de
// la grande son B dientes y cada vuelta de la pequeña son S.
import { pick, angleFromCenter, saveScore } from "./utils.js";

const TOL = 14;          // grados de margen al parar la rueda
const TOL_EASY = 20;

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
function lcm(a, b) { return (a * b) / gcd(a, b); }

// Pares de dientes con m.c.m. manejable: nunca más de 4 vueltas de la
// grande ni más de 6 de la pequeña.
export const PAIRS = (() => {
  const out = [];
  for (let big = 8; big <= 24; big++) {
    for (let small = 6; small < big; small++) {
      const l = lcm(big, small);
      const turnsBig = l / big;
      const turnsSmall = l / small;
      if (turnsBig < 2 || turnsBig > 4) continue;   // si small divide a big sería 1 vuelta
      if (turnsSmall < 2 || turnsSmall > 6) continue;
      out.push({ big, small, lcm: l, turnsBig, turnsSmall });
    }
  }
  return out;
})();

const FALLBACK_PAIR = { big: 12, small: 8, lcm: 24, turnsBig: 2, turnsSmall: 3 };

// La dificultad sube con la racha: más vueltas y más dientes.
export function makeEngranajesRound(streak, index) {
  const tier = streak >= 5 ? 2 : (streak >= 2 ? 1 : 0);
  const limits = [
    { big: 16, turnsBig: 3, turnsSmall: 4 },
    { big: 20, turnsBig: 4, turnsSmall: 5 },
    { big: 24, turnsBig: 4, turnsSmall: 6 },
  ][tier];
  const pool = PAIRS.filter((p) => p.big <= limits.big
    && p.turnsBig <= limits.turnsBig && p.turnsSmall <= limits.turnsSmall);
  const pair = pool.length ? pick(pool) : FALLBACK_PAIR;
  // Se alternan las dos mecánicas: rodar y la inversión con teclado.
  const mode = index % 2 === 0 ? "roll" : "ask";
  return { ...pair, mode, tol: tier === 0 ? TOL_EASY : TOL };
}

export function multiplesHtml(pair) {
  const listOf = (n) => {
    const out = [];
    for (let k = n; k <= pair.lcm; k += n) out.push(k === pair.lcm ? `<b>${k}</b>` : String(k));
    return out.join(", ");
  };
  return `<div class="en-mul">
    <div><span>Grande (${pair.big})</span> ${listOf(pair.big)}</div>
    <div><span>Pequeña (${pair.small})</span> ${listOf(pair.small)}</div>
    <div class="en-mul-end">Se cruzan en <b>${pair.lcm}</b> dientes:
      ${pair.turnsBig} ${pair.turnsBig === 1 ? "vuelta" : "vueltas"} de la grande y
      ${pair.turnsSmall} de la pequeña</div>
  </div>`;
}

export function mountEngranajesGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let round = null;
  let total = 0;      // grados girados por la rueda grande (>= 0)
  let locked = false;
  let typed = "";
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

  function gearHtml(teeth, cls, extra) {
    // El diámetro crece con los dientes (y nunca baja de 70 px, que es lo
    // que hace falta para arrastrar con el pulgar).
    const d = Math.round(52 + teeth * 3.2);
    return `<div class="en-gear ${cls}" style="width:${d}px;height:${d}px" ${extra || ""}>
      <div class="en-gear-inner" data-inner="${cls}" style="--step:${(360 / teeth).toFixed(3)}deg">
        <span class="en-mark"></span>
      </div>
      <span class="en-teeth-label">${teeth}</span>
    </div>`;
  }

  function nextRound() {
    round = makeEngranajesRound(streak, rounds);
    total = 0;
    typed = "";
    locked = false;

    if (round.mode === "roll") {
      body.innerHTML = `
        <div class="en-wrap">
          <p class="prompt en-prompt">🔧 Rueda hasta que coincidan
            <small>Arrastra la rueda grande con el dedo. Para justo cuando las dos
            marcas vuelvan a apuntar arriba.</small></p>
          <div class="en-shop" data-shop>
            ${gearHtml(round.big, "en-big", 'data-drag')}
            ${gearHtml(round.small, "en-small")}
          </div>
          <div class="en-teeth" data-teeth></div>
          <div class="feedback" data-feedback></div>
          <button class="primary" data-stop>🛑 ¡Ya coinciden!</button>
          ${multiplesHtml(round).replace('class="en-mul"', 'class="en-mul en-hidden" data-mul')}
        </div>
      `;
      setupDrag();
      renderGears();
    } else {
      body.innerHTML = `
        <div class="en-wrap">
          <p class="prompt en-prompt">🔧 ¿Cuántas vueltas dará la pequeña?
            <small>Las dos marcas empiezan arriba. Ruedan juntas hasta que vuelvan
            a coincidir: ¿cuántas vueltas completas da la pequeña (${round.small} dientes)?</small></p>
          <div class="en-shop">
            ${gearHtml(round.big, "en-big")}
            ${gearHtml(round.small, "en-small")}
          </div>
          <div class="keypad-display" data-display>&nbsp;</div>
          <div class="keypad" data-keypad></div>
          <div class="feedback" data-feedback></div>
          ${multiplesHtml(round).replace('class="en-mul"', 'class="en-mul en-hidden" data-mul')}
        </div>
      `;
      const pad = body.querySelector("[data-keypad]");
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn keypad-key";
        btn.type = "button";
        btn.textContent = key;
        btn.addEventListener("click", () => pressKey(key));
        pad.appendChild(btn);
      });
    }
  }

  function renderGears() {
    const big = body.querySelector('[data-inner="en-big"]');
    const small = body.querySelector('[data-inner="en-small"]');
    if (!big || !small) return;
    big.style.transform = `rotate(${total}deg)`;
    small.style.transform = `rotate(${-total * round.big / round.small}deg)`;
    const teethEl = body.querySelector("[data-teeth]");
    if (teethEl) {
      const passed = Math.round((total / 360) * round.big);
      teethEl.innerHTML = `dientes engranados: <b>${passed}</b>`;
    }
  }

  function setupDrag() {
    const gear = body.querySelector("[data-drag]");
    if (!gear) return;
    let last = null;
    const angleAt = (ev) => {
      const r = gear.getBoundingClientRect();
      return angleFromCenter(r.left + r.width / 2, r.top + r.height / 2, ev.clientX, ev.clientY);
    };
    gear.addEventListener("pointerdown", (ev) => {
      if (finished || locked) return;
      last = angleAt(ev);
      gear.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });
    gear.addEventListener("pointermove", (ev) => {
      if (finished || locked || last === null) return;
      const now = angleAt(ev);
      let delta = now - last;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      last = now;
      total = Math.max(0, total + delta);
      renderGears();
    });
    const up = () => { last = null; };
    gear.addEventListener("pointerup", up);
    gear.addEventListener("pointercancel", up);
  }

  function pressKey(key) {
    if (finished || locked) return;
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (key === "✓") return submitAsk();
    else if (typed.length < 2) typed += key;
    body.querySelector("[data-display]").textContent = typed || " ";
  }

  function win(msg) {
    locked = true;
    rounds++;
    score += 10;
    streak++;
    renderScore();
    const feedback = body.querySelector("[data-feedback]");
    feedback.innerHTML = msg;
    feedback.className = "feedback ok";
    body.querySelector("[data-mul]").classList.remove("en-hidden");
    later(nextRound, 2400);
  }

  function lose(msg) {
    locked = true;
    rounds++;
    streak = 0;
    lives--;
    renderLives();
    const feedback = body.querySelector("[data-feedback]");
    feedback.innerHTML = msg;
    feedback.className = "feedback bad";
    // Al fallar se ven las dos listas de múltiplos y dónde se cruzan.
    body.querySelector("[data-mul]").classList.remove("en-hidden");
    if (lives <= 0) return later(() => finish(false), 3600);
    later(nextRound, 3600);
  }

  function stopRoll() {
    if (finished || locked) return;
    if (total < 40) {
      const feedback = body.querySelector("[data-feedback]");
      feedback.textContent = "Primero rueda la rueda grande con el dedo";
      feedback.className = "feedback";
      return;
    }
    const target = 360 * round.turnsBig;
    const err = total - target;
    const dec = (v) => v.toFixed(1).replace(".", ",");
    const turnsBig = dec(total / 360);
    const turnsSmall = dec((total * round.big / round.small) / 360);
    if (Math.abs(err) <= round.tol) {
      return win(`¡Coinciden! ${round.turnsBig} vueltas de la grande y
        ${round.turnsSmall} de la pequeña: ${round.lcm} dientes en las dos.`);
    }
    if (err < 0) {
      return lose(`Aún no: la grande iba por ${turnsBig} vueltas y la pequeña
        por ${turnsSmall}. Coinciden a las ${round.turnsBig} vueltas de la grande.`);
    }
    return lose(`Te has pasado: la primera coincidencia era a las ${round.turnsBig} vueltas
      de la grande (ibas por ${turnsBig}).`);
  }

  function submitAsk() {
    if (finished || locked || typed === "") return;
    const value = Number(typed);
    if (value === round.turnsSmall) {
      return win(`¡Sí! ${round.turnsSmall} vueltas de la pequeña × ${round.small} dientes =
        ${round.lcm} = ${round.turnsBig} × ${round.big}.`);
    }
    return lose(`Eran <b>${round.turnsSmall}</b> vueltas, no ${value}:
      ${round.turnsSmall} × ${round.small} = ${round.lcm} dientes.`);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "engranajes", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚙️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} engranajes sincronizados</p>
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

  body.addEventListener("click", (ev) => {
    if (ev.target.closest("[data-stop]")) stopRoll();
  });

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
  };
}
