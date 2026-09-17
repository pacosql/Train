// "Encierra el perímetro": inversión de #39 (Área y perímetro). Aquí se da
// un perímetro OBJETIVO y el jugador debe CONSTRUIR, tocando clavos de un
// geoplano 6×6 en orden, un polígono rectilíneo (lados solo horizontales o
// verticales) cuyo perímetro real coincida exactamente con el objetivo.
import { randInt, saveScore } from "./utils.js";

// Tamaño de la rejilla de clavos: coordenadas enteras 0..GRID_MAX en x e y
// (6×6 clavos).
const GRID_MAX = 5;

// Genera una ronda: un rectángulo a×b (lados enteros, 1..5) que SIEMPRE
// cabe en la rejilla 6×6 y cuyo perímetro 2·(a+b) es el objetivo. Es la
// solución "de fábrica" conocida, pero el jugador puede construir
// cualquier otro polígono rectilíneo con ese mismo perímetro.
export function generateGeoclavosRound() {
  const a = randInt(1, GRID_MAX);
  const b = randInt(1, GRID_MAX);
  const target = 2 * (a + b);
  return { a, b, target };
}

// Perímetro real de un polígono rectilíneo cerrado: suma de |dx|+|dy| de
// cada lado, incluyendo el lado de cierre (último vértice -> primero). Al
// exigir que cada lado sea horizontal o vertical, |dx|+|dy| es siempre la
// longitud real de ese lado (uno de los dos términos es 0).
function calcPerimeter(vertices) {
  let total = 0;
  for (let i = 0; i < vertices.length; i++) {
    const p = vertices[i];
    const q = vertices[(i + 1) % vertices.length];
    total += Math.abs(q.x - p.x) + Math.abs(q.y - p.y);
  }
  return total;
}

// ¿Es horizontal o vertical el lado p->q? (mismo x o mismo y, y no el
// mismo punto).
function isAxisAligned(p, q) {
  if (p.x === q.x && p.y === q.y) return false;
  return p.x === q.x || p.y === q.y;
}

export function mountGeoclavosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let finished = false;
  let locked = false; // evita tocar clavos mientras se muestra el resultado
  let ronda = null;
  let vertices = []; // vértices tocados en orden, {x, y} en coords de rejilla
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

  // --- geometría / dibujo del geoplano en SVG ---------------------------
  const PAD = 20;
  const STEP = 40;
  const SVG_SIZE = PAD * 2 + STEP * GRID_MAX;

  function toScreen(pt) {
    // y=0 abajo, y=GRID_MAX arriba, para que se vea como un plano normal.
    return { sx: PAD + pt.x * STEP, sy: PAD + (GRID_MAX - pt.y) * STEP };
  }

  let svgEl = null;
  let infoEl = null;
  let closeBtn = null;
  let undoBtn = null;

  function nextRound() {
    ronda = generateGeoclavosRound();
    vertices = [];
    locked = false;

    body.innerHTML = `
      <p class="prompt">Construye una figura con perímetro <b>${ronda.target}</b>
        <small>Toca los clavos en orden para trazar los lados (solo horizontales o verticales). Vuelve a tocar el primer clavo, o pulsa "Cerrar figura", cuando termines.</small>
      </p>
      <div class="gcv-board" data-board></div>
      <p class="gcv-info" data-info></p>
      <div class="gcv-actions">
        <button class="secondary" type="button" data-undo>↩️ Deshacer último clavo</button>
        <button class="primary" type="button" data-close>Cerrar figura y comprobar</button>
      </div>
      <div class="feedback" data-feedback></div>
    `;

    const boardEl = body.querySelector("[data-board]");
    infoEl = body.querySelector("[data-info]");
    closeBtn = body.querySelector("[data-close]");
    undoBtn = body.querySelector("[data-undo]");

    const svgNS = "http://www.w3.org/2000/svg";
    svgEl = document.createElementNS(svgNS, "svg");
    svgEl.setAttribute("viewBox", `0 0 ${SVG_SIZE} ${SVG_SIZE}`);
    svgEl.setAttribute("class", "gcv-svg");
    boardEl.appendChild(svgEl);

    for (let gx = 0; gx <= GRID_MAX; gx++) {
      for (let gy = 0; gy <= GRID_MAX; gy++) {
        const { sx, sy } = toScreen({ x: gx, y: gy });
        const hit = document.createElementNS(svgNS, "circle");
        hit.setAttribute("cx", sx);
        hit.setAttribute("cy", sy);
        hit.setAttribute("r", "13");
        hit.setAttribute("class", "gcv-hit");
        hit.addEventListener("click", () => tapNail(gx, gy));
        svgEl.appendChild(hit);
      }
    }

    undoBtn.addEventListener("click", undoNail);
    closeBtn.addEventListener("click", () => tryClose());

    renderFigure();
  }

  function renderFigure() {
    // Quita lados y clavos "pintados" previos, deja los clavos base intactos.
    svgEl.querySelectorAll(".gcv-side, .gcv-nail").forEach((el) => el.remove());
    const svgNS = "http://www.w3.org/2000/svg";

    for (let i = 0; i < vertices.length - 1; i++) {
      drawSide(vertices[i], vertices[i + 1], svgNS);
    }

    vertices.forEach((v, i) => {
      const { sx, sy } = toScreen(v);
      const dot = document.createElementNS(svgNS, "circle");
      dot.setAttribute("cx", sx);
      dot.setAttribute("cy", sy);
      dot.setAttribute("r", "7");
      dot.setAttribute("class", i === 0 ? "gcv-nail gcv-nail-first" : "gcv-nail");
      svgEl.appendChild(dot);
    });

    const partial = vertices.length >= 2 ? calcOpenLength(vertices) : 0;
    infoEl.textContent = `Clavos colocados: ${vertices.length} · Perímetro parcial: ${partial}`;
  }

  function drawSide(p, q, svgNS) {
    const a = toScreen(p);
    const b = toScreen(q);
    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", a.sx);
    line.setAttribute("y1", a.sy);
    line.setAttribute("x2", b.sx);
    line.setAttribute("y2", b.sy);
    line.setAttribute("class", "gcv-side");
    svgEl.appendChild(line);
  }

  // Longitud de la línea abierta (sin el lado de cierre) trazada hasta ahora.
  function calcOpenLength(vs) {
    let total = 0;
    for (let i = 0; i < vs.length - 1; i++) {
      total += Math.abs(vs[i + 1].x - vs[i].x) + Math.abs(vs[i + 1].y - vs[i].y);
    }
    return total;
  }

  function showFeedbackMsg(msg) {
    const fb = body.querySelector("[data-feedback]");
    if (fb) {
      fb.textContent = msg;
      fb.className = "feedback";
    }
  }

  function tapNail(gx, gy) {
    if (finished || locked) return;
    const last = vertices[vertices.length - 1];

    // Tocar el primer clavo de nuevo (con al menos 3 vértices) cierra la figura.
    if (vertices.length >= 3 && gx === vertices[0].x && gy === vertices[0].y) {
      tryClose();
      return;
    }

    if (last && last.x === gx && last.y === gy) return; // mismo clavo repetido: nada

    if (last && last.x !== gx && last.y !== gy) {
      showFeedbackMsg("Ese lado no es horizontal ni vertical: elige un clavo que comparta fila o columna con el último.");
      return;
    }

    vertices.push({ x: gx, y: gy });
    showFeedbackMsg("");
    renderFigure();
  }

  function undoNail() {
    if (finished || locked || vertices.length === 0) return;
    vertices.pop();
    showFeedbackMsg("");
    renderFigure();
  }

  function tryClose() {
    if (finished || locked) return;
    if (vertices.length < 3) {
      showFeedbackMsg("Necesitas al menos 3 clavos para cerrar una figura.");
      return;
    }
    const first = vertices[0];
    const last = vertices[vertices.length - 1];
    if (!isAxisAligned(last, first)) {
      showFeedbackMsg("El lado de cierre (del último clavo al primero) no es horizontal ni vertical. Ajusta la figura o deshaz el último clavo.");
      return;
    }
    evaluar();
  }

  function evaluar() {
    if (finished || locked) return;
    locked = true;
    const perim = calcPerimeter(vertices);
    const feedback = body.querySelector("[data-feedback]");
    rounds++;

    if (perim === ronda.target) {
      score += 10;
      renderScore();
      feedback.textContent = `¡Correcto! Tu figura cerró con un perímetro de ${perim}, igual al objetivo.`;
      feedback.className = "feedback ok";
      later(() => { locked = false; nextRound(); }, 1100);
      return;
    }

    lives--;
    renderLives();
    feedback.textContent = `Tu figura tiene un perímetro de ${perim}, pero el objetivo era ${ronda.target}. Por ejemplo, un rectángulo de ${ronda.a}×${ronda.b} clavos de lado consigue exactamente ${ronda.target}.`;
    feedback.className = "feedback bad";
    if (lives <= 0) return later(() => finish(false), 1700);
    later(() => { locked = false; nextRound(); }, 1900);
  }

  function finish(userExited) {
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "geoclavos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📐</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} figuras construidas</p>
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
