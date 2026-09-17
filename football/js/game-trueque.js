// "El trueque" (Ecuaciones) — resolver una ecuación lineal con una
// incógnita disfrazada de mercado: dos platillos con cestas de manzanas
// (cantidad desconocida x, la misma en toda la ronda) y sacos de trigo
// (cantidad conocida) deben quedar igualados en valor. El jugador debe
// averiguar cuántas monedas vale UNA cesta (1 saco = 1 moneda, así el
// resultado está en la misma unidad que un saco, sin inventar una
// conversión extra que solo añadiría ruido).
//
// La ecuación es cL·x + dL = cR·x + dR (cL/cR = cestas en cada plato,
// dL/dR = sacos en cada plato). Se genera al revés — sortear cL, cR, dL,
// dR dentro de sus rangos y comprobar que la x resultante es entera,
// positiva y única (cL ≠ cR) — y se verifica dos veces de forma
// independiente antes de aceptar la ronda (ver `tryTrueque`).
import { randInt, saveScore } from "./utils.js";

const MIN_X = 1;
const MAX_X = 20;
const MAX_DIGITS = 2; // ninguna x del generador pasa de 20

function tryTrueque() {
  const cL = randInt(1, 5);
  const cR = randInt(1, 5);
  if (cL === cR) return null; // mismas cestas en los dos platos: no hay solución única

  const dL = randInt(0, 15);
  const dR = randInt(0, 15);

  const denom = cL - cR;
  const numer = dR - dL;
  if (numer % denom !== 0) return null; // x no saldría entera
  const x = numer / denom;
  if (!Number.isInteger(x) || x < MIN_X || x > MAX_X) return null;

  // Segunda verificación, independiente de la fórmula de arriba: con esa x
  // los dos platos deben pesar/valer exactamente lo mismo.
  const totalL = cL * x + dL;
  const totalR = cR * x + dR;
  if (totalL !== totalR) return null;

  return { cL, dL, cR, dR, x, key: `${cL}|${dL}|${cR}|${dR}` };
}

// Ronda de reserva, fija y comprobada a mano, por si el sorteo no
// encuentra una combinación válida en el número de intentos permitido:
// 2 cestas + 3 sacos = 0 cestas + 11 sacos → x = 4 (2·4+3 = 11 = 0·4+11).
function fallbackTrueque() {
  return { cL: 2, dL: 3, cR: 0, dR: 11, x: 4, key: "reserva" };
}

export function generateTruequeRound(lastKey) {
  let round = null;
  let guard = 0;
  do {
    round = tryTrueque();
    guard++;
  } while ((!round || round.key === lastKey) && guard < 500);
  return round && round.key !== lastKey ? round : fallbackTrueque();
}

// Explica la solución paso a paso comparando cuánto "de más" tiene cada
// plato en cestas y en sacos: la diferencia de cestas debe valer, en
// sacos, la diferencia de sacos del otro lado.
function pasos(round) {
  const { cL, dL, cR, dR, x } = round;
  const cestaTxt = (n) => `${n} cesta${n === 1 ? "" : "s"}`;
  const sacoTxt = (n) => `${n} saco${n === 1 ? "" : "s"}`;
  const ladoTxt = (c, d) => [c ? cestaTxt(c) : "", d ? sacoTxt(d) : ""].filter(Boolean).join(" + ") || "0 sacos";

  const out = [`${ladoTxt(cL, dL)} = ${ladoTxt(cR, dR)}`];
  const k = Math.abs(cL - cR);
  const m = Math.abs(dR - dL);
  const ladoConMasCestas = cL > cR ? "izquierdo" : "derecho";
  out.push(`${k} ${k === 1 ? "cesta" : "cestas"} de más en el plato ${ladoConMasCestas} equivalen a ${m} sacos de diferencia`);
  out.push(`1 cesta = ${m} ÷ ${k} = ${x} sacos → una cesta vale ${x} monedas`);
  return out;
}

export function mountTruequeGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let round = null;
  let typed = "";
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

  function platoHTML(cestas, sacos) {
    let h = "";
    if (cestas > 0) h += `<div class="tq-item"><span class="tq-emoji">🧺</span><span class="tq-count">×${cestas}</span></div>`;
    if (sacos > 0) h += `<div class="tq-item"><span class="tq-emoji">🌾</span><span class="tq-count">×${sacos}</span></div>`;
    if (!cestas && !sacos) h = `<div class="tq-item tq-empty">vacío</div>`;
    return h;
  }

  function nextRound() {
    round = generateTruequeRound(round ? round.key : "");
    typed = "";
    locked = false;

    body.innerHTML = `
      <p class="prompt">¿Cuántas monedas vale una cesta de manzanas 🧺?
        <small>los dos platillos del mercado están igualados — 1 saco de trigo 🌾 vale 1 moneda</small>
      </p>
      <div class="tq-market">
        <div class="tq-plate" data-plate-l></div>
        <div class="tq-fulcrum">=</div>
        <div class="tq-plate" data-plate-r></div>
      </div>
      <div class="keypad-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
      <div class="tq-why" data-why></div>
    `;

    body.querySelector("[data-plate-l]").innerHTML = platoHTML(round.cL, round.dL);
    body.querySelector("[data-plate-r]").innerHTML = platoHTML(round.cR, round.dR);

    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key";
      btn.type = "button";
      btn.textContent = key;
      if (key === "⌫") {
        btn.setAttribute("data-backspace", "");
        btn.addEventListener("click", () => pressBackspace());
      } else if (key === "✓") {
        btn.setAttribute("data-submit", "");
        btn.addEventListener("click", () => submit());
      } else {
        btn.setAttribute("data-digit", key);
        btn.addEventListener("click", () => pressDigit(key));
      }
      pad.appendChild(btn);
    });

    renderDisplay();
  }

  function renderDisplay() {
    body.querySelector("[data-display]").textContent = typed ? `${typed} 🪙` : " ";
  }

  function pressDigit(d) {
    if (finished || locked) return;
    if (typed.length >= MAX_DIGITS) return;
    if (typed === "0") typed = d;
    else typed += d;
    renderDisplay();
  }

  function pressBackspace() {
    if (finished || locked) return;
    typed = typed.slice(0, -1);
    renderDisplay();
  }

  function submit() {
    if (finished || locked || typed === "") return;
    const guess = Number(typed);
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const why = body.querySelector("[data-why]");

    if (guess === round.x) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Trueque justo! Una cesta vale ${round.x} monedas`;
      feedback.className = "feedback ok";
      later(nextRound, 1200);
      return;
    }

    lives--;
    renderLives();
    feedback.textContent = `No cuadra la balanza — una cesta valía ${round.x} monedas`;
    feedback.className = "feedback bad";
    why.innerHTML = pasos(round).map((p, i) => `<span class="tq-why-line${i === 0 ? " tq-why-eq" : ""}">${p}</span>`).join("");
    why.classList.add("on");

    if (lives <= 0) return later(() => finish(false), 2200);
    later(nextRound, 2200);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "trueque", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🤝</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} trueques resueltos</p>
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
    round = null;
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
