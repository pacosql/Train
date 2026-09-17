// #6 "Equilibra la balanza" (Igualdad y pesos) — REHECHO.
// Antes: pesas de +1/+2/+5/+10 que se acumulaban hasta llegar a un peso
// objetivo — o sea el mismo juego que "Llena el vaso" con kg, y con el +1
// disponible no había nada que pensar. Además contaba una "ronda" por cada
// pesa tocada y dejaba setTimeout sin limpiar al salir al menú.
// Ahora es álgebra de verdad: hay sacos idénticos de peso desconocido y
// pesas conocidas en los platos, y el dedo mueve LA INCÓGNITA (cuánto pesa
// un saco). La balanza sólo dice qué lado pesa más, nunca los totales, así
// que hay que resolver k·x + a = m·x + b; y los ajustes están contados,
// para que tantear a lo loco no llegue.
import { randInt, pick, clamp, saveScore } from "./utils.js";

const MIN_X = 1;
const MAX_X = 18;  // recorrido del control
const MOVES = 8;   // ajustes por ronda: con ±1 y ±5 basta si se razona

export function balanzaLevelFor(streak) {
  return streak >= 5 ? 2 : streak >= 2 ? 1 : 0;
}

// Coste mínimo en ajustes de ±1/±5 para recorrer una distancia.
export function moveCost(d) {
  const dist = Math.abs(d);
  let best = dist;
  for (let q = 0; q <= Math.ceil(dist / 5); q++) {
    best = Math.min(best, q + Math.abs(dist - q * 5));
  }
  return best;
}

// Una ronda es la ecuación k·x + a = m·x + b, construida desde la solución
// para que x salga siempre entero y único (k > m, así k-m nunca es 0).
function tryBalanza(level) {
  let k = 0, m = 0, a = 0, b = 0, x = 0;
  if (level === 0) {
    // k sacos = b kg. k>=2 para que no sea leer el número del plato.
    k = randInt(2, 3);
    m = 0;
    a = 0;
    x = randInt(2, 9);
    b = k * x;
  } else if (level === 1) {
    // k sacos + a kg = b kg: hay que quitar las pesas antes de dividir.
    k = randInt(2, 4);
    m = 0;
    a = randInt(1, 9);
    x = randInt(2, 9);
    b = k * x + a;
  } else {
    // Sacos en LOS DOS platos: hay que quitar sacos de los dos lados.
    m = randInt(1, 2);
    const d = randInt(1, 2);
    k = m + d;
    x = randInt(2, 9);
    a = randInt(0, 6);
    b = a + d * x;
  }
  if (k <= m) return null;
  if (x < 2 || x > 9) return null;
  if (b <= 0 || b > 45 || a < 0 || a > 12) return null;
  if ((b - a) % (k - m) !== 0) return null;      // x tiene que ser entero
  if ((b - a) / (k - m) !== x) return null;      // y ser justo la solución
  if (k * x + a <= 0) return null;               // platos con peso positivo
  if (k + m > 6) return null;                    // caben dibujados

  // Arranque del control: nunca la solución, nunca pegado a ella, y siempre
  // alcanzable con los ajustes disponibles.
  const cands = [];
  for (let v = MIN_X; v <= MAX_X; v++) {
    if (Math.abs(v - x) >= 3 && moveCost(v - x) <= MOVES) cands.push(v);
  }
  if (!cands.length) return null;

  const flip = randInt(0, 1) === 1; // de qué lado están los sacos
  return {
    level, k, m, a, b, x,
    x0: pick(cands),
    flip,
    key: `${k}|${a}|${m}|${b}`,
  };
}

function fallbackBalanza(level) {
  return { level, k: 3, m: 0, a: 0, b: 12, x: 4, x0: 9, flip: false, key: "reserva" };
}

export function makeBalanzaRound(streak, lastKey) {
  const level = balanzaLevelFor(streak);
  let cand = null;
  let guard = 0;
  do {
    cand = tryBalanza(level);
    guard++;
  } while ((!cand || cand.key === lastKey) && guard < 300);
  return cand && cand.key !== lastKey ? cand : fallbackBalanza(level);
}

// Descompone unos kg en discos de pesas de verdad, para dibujarlos.
function discos(kg) {
  const out = [];
  let rest = kg;
  [10, 5, 2, 1].forEach((v) => {
    while (rest >= v) { out.push(v); rest -= v; }
  });
  return out;
}

export function mountBalanzaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let timers = [];
  let round = null;
  let value = 0;   // lo que el jugador cree que pesa un saco
  let movesLeft = MOVES;
  let locked = false;
  let beamEl, panLEl, panREl, tiltEl, valueEl, movesEl;

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
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  // Sacos y pesas de cada plato: `flip` sólo cambia de lado el dibujo.
  function ladoIzq() {
    return round.flip ? { sacos: round.m, kg: round.b } : { sacos: round.k, kg: round.a };
  }
  function ladoDer() {
    return round.flip ? { sacos: round.k, kg: round.a } : { sacos: round.m, kg: round.b };
  }

  function platoHTML(lado) {
    let h = "";
    for (let i = 0; i < lado.sacos; i++) h += `<span class="bz-saco">?</span>`;
    discos(lado.kg).forEach((v) => { h += `<span class="bz-pesa">${v}</span>`; });
    if (!h) h = `<span class="bz-vacio">vacío</span>`;
    return h;
  }

  function nextRound() {
    round = makeBalanzaRound(streak, round ? round.key : "");
    value = round.x0;
    movesLeft = MOVES;
    locked = false;

    body.innerHTML = `
      <div class="bz-wrap">
        <p class="prompt bz-prompt">¿Cuánto pesa <b>un saco</b>?<small>los sacos son todos iguales — la balanza está en equilibrio cuando aciertas</small></p>
        <div class="bz-scale">
          <div class="bz-beam" data-beam>
            <span class="bz-bar"></span>
            <div class="bz-hang bz-hang-l"><div class="bz-pan" data-pan-l></div></div>
            <div class="bz-hang bz-hang-r"><div class="bz-pan" data-pan-r></div></div>
          </div>
          <span class="bz-mast"></span>
          <span class="bz-base"></span>
        </div>
        <div class="bz-tilt" data-tilt></div>
        <div class="bz-dial">
          <button class="bz-step" data-adj="-5">−5</button>
          <button class="bz-step" data-adj="-1">−1</button>
          <div class="bz-value">1 saco =<b data-x>0</b>kg</div>
          <button class="bz-step" data-adj="1">+1</button>
          <button class="bz-step" data-adj="5">+5</button>
        </div>
        <div class="bz-moves">Ajustes que te quedan: <b data-moves>${MOVES}</b></div>
        <div class="feedback" data-feedback></div>
        <div class="bz-why" data-why></div>
        <button class="primary bz-confirm" data-confirm>¡Listo!</button>
      </div>
    `;

    beamEl = body.querySelector("[data-beam]");
    panLEl = body.querySelector("[data-pan-l]");
    panREl = body.querySelector("[data-pan-r]");
    tiltEl = body.querySelector("[data-tilt]");
    valueEl = body.querySelector("[data-x]");
    movesEl = body.querySelector("[data-moves]");

    panLEl.innerHTML = platoHTML(ladoIzq());
    panREl.innerHTML = platoHTML(ladoDer());

    body.querySelectorAll("[data-adj]").forEach((btn) => {
      btn.addEventListener("click", () => ajustar(Number(btn.dataset.adj)));
    });
    body.querySelector("[data-confirm]").addEventListener("click", confirmar);
    renderScale();
  }

  function pesoIzq(x) {
    const l = ladoIzq();
    return l.sacos * x + l.kg;
  }
  function pesoDer(x) {
    const d = ladoDer();
    return d.sacos * x + d.kg;
  }

  function renderScale() {
    const diff = pesoIzq(value) - pesoDer(value);
    // Izquierda más pesada = la izquierda baja = giro antihorario.
    const rot = -clamp(diff * 1.6, -14, 14);
    beamEl.style.transform = `rotate(${rot}deg)`;
    panLEl.style.transform = `rotate(${-rot}deg)`;
    panREl.style.transform = `rotate(${-rot}deg)`;
    valueEl.textContent = String(value);
    movesEl.textContent = String(movesLeft);
    // Sólo el lado que pesa más: los totales se revelan al confirmar, si no
    // esto sería igualar dos números en vez de resolver la ecuación.
    if (diff === 0) {
      tiltEl.textContent = "⚖️ en equilibrio";
      tiltEl.className = "bz-tilt bz-tilt-ok";
    } else {
      tiltEl.textContent = diff > 0 ? "⬅️ pesa más la izquierda" : "pesa más la derecha ➡️";
      tiltEl.className = "bz-tilt";
    }
    body.querySelectorAll("[data-adj]").forEach((btn) => {
      const n = Number(btn.dataset.adj);
      const dest = value + n;
      btn.disabled = locked || movesLeft <= 0 || dest < MIN_X || dest > MAX_X;
    });
  }

  function ajustar(n) {
    if (finished || locked || movesLeft <= 0) return;
    const dest = value + n;
    if (dest < MIN_X || dest > MAX_X) return;
    value = dest;
    movesLeft--;
    renderScale();
    if (movesLeft === 0) {
      const f = body.querySelector("[data-feedback]");
      f.textContent = "Se te han acabado los ajustes: pulsa ¡Listo!";
      f.className = "feedback";
    }
  }

  // Las líneas que explican la solución: los mismos pasos que se harían
  // con la balanza de verdad (quitar sacos iguales, quitar pesas, repartir).
  function pasos() {
    const l = ladoIzq();
    const d = ladoDer();
    const sacoTxt = (n) => `${n} saco${n === 1 ? "" : "s"}`;
    const lado = (o) => [o.sacos ? sacoTxt(o.sacos) : "", o.kg ? `${o.kg} kg` : ""].filter(Boolean).join(" + ") || "0";
    const out = [`${lado(l)} = ${lado(d)}`];
    const minSacos = Math.min(l.sacos, d.sacos);
    let li = { sacos: l.sacos, kg: l.kg };
    let de = { sacos: d.sacos, kg: d.kg };
    if (minSacos > 0) {
      li = { sacos: li.sacos - minSacos, kg: li.kg };
      de = { sacos: de.sacos - minSacos, kg: de.kg };
      out.push(`quito ${sacoTxt(minSacos)} de cada lado → ${lado(li)} = ${lado(de)}`);
    }
    const minKg = Math.min(li.kg, de.kg);
    if (minKg > 0) {
      li = { sacos: li.sacos, kg: li.kg - minKg };
      de = { sacos: de.sacos, kg: de.kg - minKg };
      out.push(`quito ${minKg} kg de cada lado → ${lado(li)} = ${lado(de)}`);
    }
    const sacos = Math.max(li.sacos, de.sacos);
    const kg = Math.max(li.kg, de.kg);
    if (sacos > 1) out.push(`${kg} entre ${sacos} → cada saco pesa ${round.x} kg`);
    else out.push(`cada saco pesa ${round.x} kg`);
    return out;
  }

  function confirmar() {
    if (finished || locked) return;
    locked = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const why = body.querySelector("[data-why]");
    renderScale(); // deja los botones bloqueados

    if (value === round.x) {
      streak++;
      score += 10;
      renderScore();
      feedback.textContent = `¡Equilibrada! Cada saco pesa ${round.x} kg — ${pesoIzq(round.x)} kg a cada lado`;
      feedback.className = "feedback ok";
      later(nextRound, 1000);
      return;
    }

    streak = 0;
    lives--;
    renderLives();
    const diff = pesoIzq(value) - pesoDer(value);
    feedback.textContent = `Con ${value} kg por saco quedan ${pesoIzq(value)} kg y ${pesoDer(value)} kg: `
      + `${diff > 0 ? "sobran" : "faltan"} ${Math.abs(diff)} kg`;
    feedback.className = "feedback bad";

    // Al fallar se ve la ecuación resuelta paso a paso...
    why.innerHTML = pasos().map((p, i) => `<span class="bz-why-line${i === 0 ? " bz-why-eq" : ""}">${p}</span>`).join("");
    why.classList.add("on");
    // ...y la balanza se pone sola en la solución, equilibrada.
    later(() => {
      value = round.x;
      renderScale();
    }, 900);

    if (lives <= 0) return later(() => finish(false), 2800);
    later(nextRound, 2800);
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "balanza", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚖️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} balanzas resueltas</p>
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
    clearTimers();
    lives = startLives;
    score = 0;
    rounds = 0;
    streak = 0;
    round = null;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimers();
  };
}
