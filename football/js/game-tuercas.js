// "Pares de tuercas": empareja cada tuerca con un tornillo cuya suma sea
// PAR. La suma de dos números es par solo si ambos son pares o ambos son
// impares — el juego obliga a fijarse en la paridad, no en el valor
// exacto. No siempre se pueden emparejar las 8 piezas: el reto real es
// detectar cuál es el número MÁXIMO de parejas válidas posible y
// conseguirlo, aceptando que a veces sobra alguna tuerca o tornillo.
import { randInt, saveScore } from "./utils.js";

// Cuenta cuántas parejas de suma par se pueden formar como máximo entre
// dos grupos de 4 números. Un par solo puede sumar par con otro par, y un
// impar solo con otro impar, así que el máximo es sencillamente la suma
// de los mínimos de cada categoría entre ambos lados. Función pura: solo
// depende de los valores, no toca el DOM ni el estado del juego.
export function maxEmparejamientos(tuercas, tornillos) {
  const paresT = tuercas.filter((v) => v % 2 === 0).length;
  const paresB = tornillos.filter((v) => v % 2 === 0).length;
  const imparesT = tuercas.length - paresT;
  const imparesB = tornillos.length - paresB;
  return Math.min(paresT, paresB) + Math.min(imparesT, imparesB);
}

// Construye un ejemplo de emparejamiento que sí alcanza el máximo, para
// mostrarlo como pista cuando el jugador se queda corto. Agrupa primero
// los pares entre sí y luego los impares entre sí (misma idea que
// maxEmparejamientos, pero devolviendo las parejas en vez del conteo).
function ejemploOptimo(nuts, bolts) {
  const paresN = nuts.filter((n) => n.value % 2 === 0);
  const imparesN = nuts.filter((n) => n.value % 2 !== 0);
  const paresB = bolts.filter((b) => b.value % 2 === 0);
  const imparesB = bolts.filter((b) => b.value % 2 !== 0);
  const pares = [];
  const nPares = Math.min(paresN.length, paresB.length);
  for (let i = 0; i < nPares; i++) pares.push(`${paresN[i].value}+${paresB[i].value}`);
  const nImpares = Math.min(imparesN.length, imparesB.length);
  for (let i = 0; i < nImpares; i++) pares.push(`${imparesN[i].value}+${imparesB[i].value}`);
  return pares.join(", ");
}

// Genera 4 tuercas y 4 tornillos con una mezcla de pares e impares que no
// sea trivial: se evita que el máximo sea 0 (nada se puede emparejar) o 4
// (se empareja todo sin pensar), para que siempre haya que decidir cuáles
// sí y cuáles no.
function buildRound() {
  let nutVals = [];
  let boltVals = [];
  let max = 0;
  let guard = 0;
  do {
    nutVals = Array.from({ length: 4 }, () => randInt(1, 20));
    boltVals = Array.from({ length: 4 }, () => randInt(1, 20));
    max = maxEmparejamientos(nutVals, boltVals);
    guard++;
  } while ((max === 0 || max === 4) && guard < 50);
  return {
    nuts: nutVals.map((value, idx) => ({ idx, value, el: null })),
    bolts: boltVals.map((value, idx) => ({ idx, value, el: null })),
    max,
  };
}

export function mountTuercasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita tocar piezas mientras se resuelve el remate
  let nuts = [];
  let bolts = [];
  let max = 0;
  let madeCount = 0;
  const matchedNuts = new Set();
  const matchedBolts = new Set();
  let pending = null; // { type: 'nut' | 'bolt', idx }
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
    const round = buildRound();
    nuts = round.nuts;
    bolts = round.bolts;
    max = round.max;
    madeCount = 0;
    matchedNuts.clear();
    matchedBolts.clear();
    pending = null;
    locked = false;

    body.innerHTML = `
      <p class="prompt">Empareja <b>${max}</b> ${max === 1 ? "pareja" : "parejas"} de suma par<small>Toca una tuerca y un tornillo: si su suma es par, se emparejan</small></p>
      <div class="tu-board">
        <div class="tu-col">
          <h3 class="tu-col-title">🔩 Tuercas</h3>
          <div class="tu-list" data-nuts></div>
        </div>
        <div class="tu-col">
          <h3 class="tu-col-title">🔧 Tornillos</h3>
          <div class="tu-list" data-bolts></div>
        </div>
      </div>
      <div class="feedback" data-feedback></div>
      <div class="tu-actions">
        <span class="tu-progress" data-progress>0 de ${max} parejas hechas</span>
        <button class="primary" data-done>Listo ✅</button>
      </div>
    `;

    const nutsEl = body.querySelector("[data-nuts]");
    nuts.forEach((n) => {
      const btn = document.createElement("button");
      btn.className = "tu-piece tu-nut";
      btn.type = "button";
      btn.dataset.nut = String(n.idx);
      btn.dataset.value = String(n.value);
      btn.innerHTML = `🔩<span class="tu-num">${n.value}</span>`;
      btn.addEventListener("click", () => tapPiece("nut", n.idx));
      n.el = btn;
      nutsEl.appendChild(btn);
    });
    const boltsEl = body.querySelector("[data-bolts]");
    bolts.forEach((b) => {
      const btn = document.createElement("button");
      btn.className = "tu-piece tu-bolt";
      btn.type = "button";
      btn.dataset.bolt = String(b.idx);
      btn.dataset.value = String(b.value);
      btn.innerHTML = `🔧<span class="tu-num">${b.value}</span>`;
      btn.addEventListener("click", () => tapPiece("bolt", b.idx));
      b.el = btn;
      boltsEl.appendChild(btn);
    });

    body.querySelector("[data-done]").addEventListener("click", onDone);
  }

  function updateSelectionUI() {
    [...nuts, ...bolts].forEach((p) => p.el.classList.remove("tu-selected"));
    if (pending) {
      const group = pending.type === "nut" ? nuts : bolts;
      group[pending.idx].el.classList.add("tu-selected");
    }
  }

  function updateProgress() {
    body.querySelector("[data-progress]").textContent = `${madeCount} de ${max} parejas hechas`;
  }

  function tapPiece(type, idx) {
    if (finished || locked) return;
    const isMatched = type === "nut" ? matchedNuts.has(idx) : matchedBolts.has(idx);
    if (isMatched) return;

    if (!pending) {
      pending = { type, idx };
      updateSelectionUI();
      return;
    }
    if (pending.type === type) {
      // Tocar otra pieza del mismo lado cambia la selección; tocar la
      // misma la deselecciona.
      pending = pending.idx === idx ? null : { type, idx };
      updateSelectionUI();
      return;
    }

    // Ya hay una tuerca y un tornillo seleccionados: se evalúa la pareja.
    const nutIdx = type === "nut" ? idx : pending.idx;
    const boltIdx = type === "bolt" ? idx : pending.idx;
    pending = null;
    attemptMatch(nutIdx, boltIdx);
  }

  function attemptMatch(nutIdx, boltIdx) {
    const nut = nuts[nutIdx];
    const bolt = bolts[boltIdx];
    const sum = nut.value + bolt.value;
    const feedback = body.querySelector("[data-feedback]");
    if (sum % 2 === 0) {
      matchedNuts.add(nutIdx);
      matchedBolts.add(boltIdx);
      madeCount++;
      nut.el.classList.add("tu-matched");
      bolt.el.classList.add("tu-matched");
      updateProgress();
      feedback.textContent = `${nut.value} + ${bolt.value} = ${sum}, es par: ¡pareja válida!`;
      feedback.className = "feedback ok";
    } else {
      feedback.textContent = `${nut.value} + ${bolt.value} = ${sum}, es impar (uno es par y el otro impar): no vale`;
      feedback.className = "feedback bad";
      nut.el.classList.add("tu-rejected");
      bolt.el.classList.add("tu-rejected");
      later(() => {
        nut.el.classList.remove("tu-rejected");
        bolt.el.classList.remove("tu-rejected");
      }, 450);
    }
    updateSelectionUI();
  }

  function onDone() {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (madeCount === max) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Perfecto! Había ${max} ${max === 1 ? "pareja posible" : "parejas posibles"} de suma par y las hiciste todas.`;
      feedback.className = "feedback ok";
      later(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const ejemplo = ejemploOptimo(nuts, bolts);
      feedback.textContent = `Se podían hacer ${max} parejas (hiciste ${madeCount}). Ejemplo para llegar al máximo: ${ejemplo}. Pista: junta los pares entre sí y los impares entre sí.`;
      feedback.className = "feedback bad";
      if (lives <= 0) {
        later(() => finish(false), 1700);
      } else {
        later(nextRound, 1700);
      }
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
    saveScore(client, "tuercas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔩</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} rondas de emparejar</p>
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
