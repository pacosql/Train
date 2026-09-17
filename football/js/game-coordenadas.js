// "Plano cartesiano" — REHECHO dos veces.
// v2: ya no se toca la celda que te dictan (eso era un test con decorado).
// Ahora se ven tres vértices seguidos A-B-C de un rectángulo o de un
// paralelogramo y hay que CERRAR la figura colocando D: la x y la y hay que
// deducirlas de los puntos que ya están, no leerlas del enunciado. El plano
// tiene los cuatro cuadrantes.
// v3 (marcado 🔧 otra vez, verificado jugándolo de verdad — calculando D con
// D = A + C − B en las 4 dificultades, sin encontrar rondas degeneradas ni
// fallos): el nivel más difícil (oblicuo, sin coordenadas escritas) seguía
// teniendo SIEMPRE un lado en escuadra (horizontal o vertical), así que
// siempre había una "pata gratis" de la que copiar una coordenada sin sumar
// ningún vector. Ahora ese nivel (`bothOblique`) tiene los DOS lados
// inclinados: no hay atajo, hay que sumar el vector (dx, dy) completo.
import { randInt, pick, saveScore } from "./utils.js";

const R = 4; // el plano va de -4 a 4 en los dos ejes

// oblique: el segundo lado va inclinado (paralelogramo) en vez de en escuadra
// show: si se escriben las coordenadas de A, B y C al lado de cada punto
// bothOblique: ningún lado queda en escuadra — los dos hay que sumarlos
// como vector completo (dx, dy), no solo "copiar" una de las coordenadas
const LEVELS = [
  { oblique: false, show: true, maxSide: 3 },
  { oblique: false, show: false, maxSide: 4 },
  { oblique: true, show: true, maxSide: 3 },
  { oblique: true, show: false, maxSide: 3, bothOblique: true },
];

export function levelFor(streak) {
  return LEVELS[Math.min(Math.floor(streak / 2), LEVELS.length - 1)];
}

// Genera la ronda: B es el vértice del medio, A = B+u, C = B+v y el único
// punto que cierra el camino A-B-C es D = B+u+v. Con u y v no paralelos la
// solución es única, y los cuatro vértices tienen que caber en el plano.
export function makeRound(level, lastKey) {
  let u = { x: 1, y: 0 };
  let v = { x: 0, y: 1 };
  let A = null;
  let B = null;
  let C = null;
  let D = null;
  let key = "";
  let guard = 0;
  do {
    guard++;
    const s1 = pick([-1, 1]);
    const s2 = pick([-1, 1]);
    const vertFirst = randInt(0, 1) === 1;
    if (level.bothOblique) {
      // Los DOS lados inclinados: no hay ninguna pata en escuadra de la que
      // "copiar" una coordenada gratis, así que hay que sumar el vector
      // completo (dx, dy) de B→A y repetirlo desde C.
      u = { x: s1 * randInt(1, level.maxSide), y: pick([-2, -1, 1, 2]) };
      v = { x: s2 * pick([1, 2]), y: pick([-2, -1, 1, 2]) };
    } else if (level.oblique) {
      // Un lado recto y el otro inclinado: el rectángulo ya no vale, hay que
      // repetir el desplazamiento de B→A partiendo de C.
      u = vertFirst
        ? { x: 0, y: s1 * randInt(2, level.maxSide) }
        : { x: s1 * randInt(2, level.maxSide), y: 0 };
      // El lado inclinado nunca es recto (x e y distintas de 0), así que
      // nunca queda paralelo al primero.
      v = { x: s2 * pick([1, 2]), y: pick([-2, -1, 1, 2]) };
    } else {
      // Rectángulo en escuadra: un lado horizontal y otro vertical.
      const a = s1 * randInt(1, level.maxSide);
      const b = s2 * randInt(1, level.maxSide);
      u = vertFirst ? { x: 0, y: a } : { x: a, y: 0 };
      v = vertFirst ? { x: b, y: 0 } : { x: 0, y: b };
    }
    // u y v paralelos darían una figura degenerada (los cuatro puntos en
    // línea y D indistinguible): se descarta.
    if (u.x * v.y - u.y * v.x === 0) { B = null; continue; }
    // B se coloca donde quepan los cuatro vértices, sin tirar dardos.
    const offX = [0, u.x, v.x, u.x + v.x];
    const offY = [0, u.y, v.y, u.y + v.y];
    const loX = -R - Math.min.apply(null, offX);
    const hiX = R - Math.max.apply(null, offX);
    const loY = -R - Math.min.apply(null, offY);
    const hiY = R - Math.max.apply(null, offY);
    if (loX > hiX || loY > hiY) { B = null; continue; }
    B = { x: randInt(loX, hiX), y: randInt(loY, hiY) };
    A = { x: B.x + u.x, y: B.y + u.y };
    C = { x: B.x + v.x, y: B.y + v.y };
    D = { x: B.x + u.x + v.x, y: B.y + u.y + v.y };
    key = `${A.x},${A.y}|${B.x},${B.y}|${C.x},${C.y}`;
  } while ((!B || key === lastKey) && guard < 400);
  return { A, B, C, D, u, v, key, guard, square: !level.oblique };
}

const VIEW = 320;
const CENTER = VIEW / 2;
const UNIT = 35;
const sx = (x) => CENTER + x * UNIT;
const sy = (y) => CENTER - y * UNIT;

export function mountCoordenadasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let locked = false;
  let level = LEVELS[0];
  let round = null;
  let guess = null; // punto provisional que el jugador ha tocado
  let reveal = false;
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
    if (finished) return;
    level = levelFor(streak);
    round = makeRound(level, lastKey);
    lastKey = round.key;
    guess = null;
    reveal = false;
    locked = false;

    const figura = round.square ? "rectángulo" : "paralelogramo";
    body.innerHTML = `
      <p class="prompt">¿Dónde va <b>D</b>?<small>A, B y C son tres vértices seguidos de un ${figura}: toca el punto que cierra la figura</small></p>
      <div class="cd-wrap" data-wrap></div>
      <div class="cd-readout" data-readout>Toca un punto del plano</div>
      <div class="feedback" data-feedback></div>
      <button class="primary cd-confirm" data-confirm disabled style="margin-top:10px;">✓ Confirmar D</button>
    `;
    body.querySelector("[data-confirm]").addEventListener("click", check);
    renderPlane();
  }

  function pointSvg(p, letter, cls) {
    const label = level.show || reveal ? `<text class="cd-lbl-pt" x="${sx(p.x) + 9}" y="${sy(p.y) - 8}">${letter} (${p.x}, ${p.y})</text>`
      : `<text class="cd-lbl-pt" x="${sx(p.x) + 9}" y="${sy(p.y) - 8}">${letter}</text>`;
    return `<circle class="cd-pt ${cls}" cx="${sx(p.x)}" cy="${sy(p.y)}" r="6"/>${label}`;
  }

  function renderPlane() {
    const { A, B, C, D } = round;
    let g = "";
    // Cuadrícula y ejes
    for (let i = -R; i <= R; i++) {
      g += `<line class="cd-grid" x1="${sx(i)}" y1="${sy(-R)}" x2="${sx(i)}" y2="${sy(R)}"/>`;
      g += `<line class="cd-grid" x1="${sx(-R)}" y1="${sy(i)}" x2="${sx(R)}" y2="${sy(i)}"/>`;
    }
    g += `<line class="cd-axis" x1="${sx(-R)}" y1="${CENTER}" x2="${sx(R)}" y2="${CENTER}"/>`;
    g += `<line class="cd-axis" x1="${CENTER}" y1="${sy(-R)}" x2="${CENTER}" y2="${sy(R)}"/>`;
    for (let i = -R; i <= R; i++) {
      if (i === 0) continue;
      g += `<text class="cd-tick" x="${sx(i)}" y="${CENTER + 13}">${i}</text>`;
      g += `<text class="cd-tick cd-tick-y" x="${CENTER - 6}" y="${sy(i) + 4}">${i}</text>`;
    }
    g += `<text class="cd-tick" x="${CENTER - 7}" y="${CENTER + 13}">0</text>`;

    // Camino A-B-C: lo que hay que cerrar
    g += `<polyline class="cd-seg" points="${sx(A.x)},${sy(A.y)} ${sx(B.x)},${sy(B.y)} ${sx(C.x)},${sy(C.y)}"/>`;

    if (reveal) {
      // Figura terminada: los dos lados que faltaban, a rayas
      g += `<polyline class="cd-seg cd-seg-ghost" points="${sx(C.x)},${sy(C.y)} ${sx(D.x)},${sy(D.y)} ${sx(A.x)},${sy(A.y)}"/>`;
    }

    // Puntos tocables (los 81 nudos de la cuadrícula)
    if (!reveal) {
      for (let x = -R; x <= R; x++) {
        for (let y = -R; y <= R; y++) {
          g += `<circle class="cd-hit" data-xy="${x},${y}" cx="${sx(x)}" cy="${sy(y)}" r="16"/>`;
        }
      }
    }

    g += pointSvg(A, "A", "");
    g += pointSvg(B, "B", "cd-pt-corner");
    g += pointSvg(C, "C", "");
    if (guess && !(reveal && guess.x === D.x && guess.y === D.y)) {
      const cls = reveal ? "cd-pt-bad" : "cd-pt-guess";
      g += `<circle class="cd-pt ${cls}" cx="${sx(guess.x)}" cy="${sy(guess.y)}" r="7"/>`;
      if (reveal) g += `<text class="cd-lbl-pt cd-lbl-bad" x="${sx(guess.x) + 9}" y="${sy(guess.y) + 16}">tú</text>`;
    }
    if (reveal) g += pointSvg(D, "D", "cd-pt-good");

    body.querySelector("[data-wrap]").innerHTML = `
      <svg class="cd-svg" viewBox="0 0 ${VIEW} ${VIEW}" aria-hidden="true">${g}</svg>
    `;
    if (!reveal) {
      body.querySelectorAll("[data-xy]").forEach((c) => {
        c.addEventListener("click", () => {
          if (finished || locked) return;
          const [x, y] = c.dataset.xy.split(",").map(Number);
          guess = { x, y };
          body.querySelector("[data-readout]").innerHTML = `D = <b>(${x}, ${y})</b>`;
          body.querySelector("[data-confirm]").disabled = false;
          renderPlane();
        });
      });
    }
  }

  // El porqué: se dibuja la figura cerrada y se dice de dónde salen la x y
  // la y de D, no solo que estaba mal.
  function explain() {
    const { A, B, C, D } = round;
    if (round.square) {
      if (A.y === B.y) {
        return `D = (${D.x}, ${D.y}): toma la x de A (${A.x}) y la y de C (${C.y}).`;
      }
      return `D = (${D.x}, ${D.y}): toma la x de C (${C.x}) y la y de A (${A.y}).`;
    }
    const dx = A.x - B.x;
    const dy = A.y - B.y;
    const mx = dx === 0 ? "" : `${Math.abs(dx)} ${dx > 0 ? "a la derecha" : "a la izquierda"}`;
    const my = dy === 0 ? "" : `${Math.abs(dy)} ${dy > 0 ? "arriba" : "abajo"}`;
    const mov = [mx, my].filter(Boolean).join(" y ");
    return `De B a A te mueves ${mov}; desde C hay que moverse igual, así que D = (${D.x}, ${D.y}).`;
  }

  function check() {
    if (finished || locked || !guess) return;
    locked = true;
    const fb = body.querySelector("[data-feedback]");
    const { D } = round;
    if (guess.x === D.x && guess.y === D.y) {
      rounds++;
      streak++;
      score += 10; // +10 por ronda, siempre 10
      renderScore();
      reveal = true;
      renderPlane();
      fb.textContent = `¡Figura cerrada! D = (${D.x}, ${D.y})`;
      fb.className = "feedback ok";
      return later(nextRound, 1100);
    }
    lives--;
    streak = 0;
    renderLives();
    reveal = true;
    renderPlane();
    fb.textContent = explain();
    fb.className = "feedback bad";
    body.querySelector("[data-readout]").innerHTML = `Tú dijiste (${guess.x}, ${guess.y})`;
    body.querySelector("[data-confirm]").disabled = true;
    if (lives <= 0) return later(() => finish(false), 2400);
    later(nextRound, 2600);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "coordenadas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🗺️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} figuras cerradas</p>
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
