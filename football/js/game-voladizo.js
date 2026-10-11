// "La torre que sobresale": de 1 a 4 bloques iguales apilados (uno por
// piso) junto al borde de una mesa. Se arrastra cada bloque en horizontal
// (con imán a 1/24 de bloque) y al pulsar "Soltar" la gravedad decide:
// de arriba abajo, el centro de masas de los bloques que hay encima de
// cada uno tiene que caer DENTRO de él (y el de toda la torre, sobre la
// mesa). Borde exacto = aguanta. Se gana si aguanta y el bloque de arriba
// sobresale del borde de la mesa al menos lo que marca la banderita.
//
// Fuente: el problema del apilamiento de bloques y la serie armónica
// (Paterson y Zwick, "Maximum overhang"). Con bloques de 24 unidades, el
// máximo de una pila de un bloque por piso es la pila armónica: cada
// bloque sobresale del de abajo 12, 6, 4, 3 veinticuatroavos (1/2, 1/4,
// 1/6, 1/8) contando desde arriba → 12, 18, 22, 25.
//
// Todo se calcula en 24avos con enteros: el borde de la mesa es x = 0,
// cada bloque ocupa [c − 12, c + 12] siendo c su centro.
import { randInt, pick, clamp, saveScore } from "./utils.js";

const HALF = 12; // medio bloque en 24avos
export const VD_MAX = [0, 12, 18, 22, 25]; // máximo voladizo con n bloques
const C_MIN = -50;
const C_MAX = 32;
// Dibujo
const VB_W = 340;
const VB_H = 250;
const U = 3; // px de viewBox por 24avo
const X0 = 196; // borde de la mesa
const TY = 172; // tablero de la mesa
const BH = 28; // alto de un bloque

// Nivel → número de bloques y objetivo (siempre ≤ máximo; = máximo al final).
export function genVoladizoRound(level) {
  let n;
  let target;
  if (level <= 0) [n, target] = [1, 12];
  else if (level === 1) [n, target] = [2, pick([14, 15, 16])];
  else if (level === 2) [n, target] = [2, 18];
  else if (level === 3) [n, target] = [3, pick([19, 20])];
  else if (level === 4) [n, target] = [3, 22];
  else if (level === 5) [n, target] = [4, pick([22, 23])];
  else if (level === 6) [n, target] = [4, 24];
  else [n, target] = [4, 25];
  // Arranque: torre recogida sobre la mesa (estable y sin sobresalir).
  const start = [];
  for (let i = 0; i < n; i++) start.push(randInt(-20, -13));
  return { n, target, start };
}

// Comprueba la torre de arriba abajo. Devuelve { ok: true } o el primer
// fallo: j = índice del apoyo (−1 = la mesa), m = bloques encima, sum =
// suma de sus centros (centro de masas = sum / m), lo y hi = apoyo.
export function vdCheck(c) {
  const n = c.length;
  for (let j = n - 2; j >= -1; j--) {
    let sum = 0;
    for (let k = j + 1; k < n; k++) sum += c[k];
    const m = n - 1 - j;
    const lo = j >= 0 ? c[j] - HALF : -Infinity;
    const hi = j >= 0 ? c[j] + HALF : 0;
    if (sum > hi * m || sum < lo * m) return { ok: false, j, m, sum, lo, hi, side: sum > hi * m ? 1 : -1 };
  }
  return { ok: true };
}

// Pila armónica (solución de referencia que se dibuja al fallar).
function harmonic(n) {
  const c = new Array(n);
  let edge = 0; // borde derecho del bloque de debajo (la mesa: 0)
  for (let i = 0; i < n; i++) {
    const k = n - i; // posición contando desde arriba
    edge += HALF / k;
    c[i] = edge - HALF;
  }
  return c;
}

const fracTxt = (x) => {
  if (x === 0) return "0";
  const g = (a, b) => (b ? g(b, a % b) : a);
  const d = g(Math.abs(x), 24);
  const s = `${x / d}/${24 / d}`;
  return s.replace("-", "−");
};
const num = (x) => String(x).replace("-", "−");

export function mountVoladizoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let round = null;
  let c = [];
  let busy = false;
  const timers = new Set();
  let els = {};

  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };
  const clearAll = () => {
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
  };

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

  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  const px = (u) => X0 + u * U;
  const blockY = (i) => TY - BH * (i + 1);

  function staticSvg(r) {
    const p = [];
    // Suelo, mesa y patas.
    p.push(`<line class="vd-floor" x1="0" y1="${VB_H - 4}" x2="${VB_W}" y2="${VB_H - 4}"/>`);
    p.push(`<rect class="vd-table" x="-4" y="${TY}" width="${X0 + 4}" height="12" rx="2"/>`);
    p.push(`<rect class="vd-leg" x="${X0 - 22}" y="${TY + 12}" width="10" height="${VB_H - TY - 16}"/>`);
    p.push(`<rect class="vd-leg" x="20" y="${TY + 12}" width="10" height="${VB_H - TY - 16}"/>`);
    // Regla desde el borde: marcas cada 3/24 y etiquetas en cuartos.
    const ry = TY + 22;
    p.push(`<line class="vd-ruler" x1="${px(0)}" y1="${ry}" x2="${px(30)}" y2="${ry}"/>`);
    const labels = { 0: "0", 6: "¼", 12: "½", 18: "¾", 24: "1" };
    for (let u = 0; u <= 30; u += 3) {
      const big = u % 6 === 0;
      p.push(`<line class="vd-ruler" x1="${px(u)}" y1="${ry - (big ? 6 : 3)}" x2="${px(u)}" y2="${ry}"/>`);
      if (labels[u] !== undefined) p.push(`<text class="vd-ruler-txt" x="${px(u)}" y="${ry + 12}">${labels[u]}</text>`);
    }
    p.push(`<line class="vd-edge" x1="${px(0)}" y1="${TY}" x2="${px(0)}" y2="${TY - 4 * BH - 14}"/>`);
    // Banderita del objetivo.
    const fx = px(r.target);
    const fy = TY - r.n * BH - 30;
    p.push(`<line class="vd-flag-line" x1="${fx}" y1="${fy}" x2="${fx}" y2="${TY + 14}"/>`);
    p.push(`<path class="vd-flag" d="M${fx},${fy} L${fx + 16},${fy + 6} L${fx},${fy + 12} Z"/>`);
    p.push(`<text class="vd-flag-txt" x="${fx}" y="${fy - 4}">${fracTxt(r.target)}</text>`);
    return p.join("");
  }

  function blocksSvg() {
    return c
      .map(
        (ci, i) => `<g class="vd-block" data-block="${i}" data-center="${ci}">
          <rect class="vd-brect" x="${px(ci - HALF)}" y="${blockY(i)}" width="${2 * HALF * U}" height="${BH - 1}" rx="3"/>
          <circle class="vd-bdot" cx="${px(ci)}" cy="${blockY(i) + BH / 2}" r="2.4"/>
        </g>`
      )
      .join("");
  }

  function nextRound() {
    clearAll();
    round = genVoladizoRound(level);
    c = round.start.slice();
    busy = false;
    body.innerHTML = `
      <p class="prompt vd-prompt">Haz que el bloque de arriba sobresalga <b>${fracTxt(round.target)}</b> de bloque
        <small>Arrastra los bloques a izquierda o derecha y pulsa Soltar: la gravedad decide</small></p>
      <div class="vd-scene" data-scene data-n="${round.n}" data-target="${round.target}">
        <svg class="vd-svg" data-svg viewBox="0 0 ${VB_W} ${VB_H}" role="img" aria-label="Bloques sobre una mesa">
          <g data-static>${staticSvg(round)}</g>
          <g data-ghost></g>
          <g data-blocks>${blocksSvg()}</g>
          <g data-fx></g>
        </svg>
      </div>
      <div class="vd-readout" data-readout></div>
      <div class="vd-actions">
        <button type="button" class="primary" data-drop>Soltar</button>
        <button type="button" class="secondary" data-next hidden>Seguir →</button>
      </div>
      <div class="feedback vd-feedback" data-feedback></div>
    `;
    els = {
      svg: body.querySelector("[data-svg]"),
      blocks: body.querySelector("[data-blocks]"),
      ghost: body.querySelector("[data-ghost]"),
      fx: body.querySelector("[data-fx]"),
      readout: body.querySelector("[data-readout]"),
      drop: body.querySelector("[data-drop]"),
      next: body.querySelector("[data-next]"),
      feedback: body.querySelector("[data-feedback]"),
    };
    els.drop.addEventListener("click", drop);
    els.next.addEventListener("click", () => {
      if (!finished) nextRound();
    });
    bindBlocks();
    renderReadout();
  }

  function renderReadout() {
    const over = c[c.length - 1] + HALF;
    els.readout.innerHTML =
      over > 0
        ? `El de arriba sobresale <b data-over="${over}">${over}/24</b> · objetivo ${round.target}/24`
        : `El de arriba aún no sobresale <b data-over="${over}">(${num(over)}/24)</b> · objetivo ${round.target}/24`;
  }

  function moveBlock(i, ci) {
    c[i] = ci;
    const g = els.blocks.querySelector(`[data-block="${i}"]`);
    g.dataset.center = ci;
    g.querySelector("rect").setAttribute("x", px(ci - HALF));
    g.querySelector("circle").setAttribute("cx", px(ci));
    renderReadout();
  }

  // Arrastre horizontal con imán a 1/24 de bloque.
  function bindBlocks() {
    els.blocks.querySelectorAll("[data-block]").forEach((g) => {
      const i = Number(g.dataset.block);
      let drag = null;
      g.addEventListener("pointerdown", (e) => {
        if (busy || finished) return;
        e.preventDefault();
        const box = els.svg.getBoundingClientRect();
        drag = { id: e.pointerId, x: e.clientX, c0: c[i], unitPx: (box.width / VB_W) * U };
        try {
          g.setPointerCapture(e.pointerId);
        } catch (_) {
          // sin captura también funciona mientras el dedo siga encima
        }
        g.classList.add("vd-grab");
      });
      g.addEventListener("pointermove", (e) => {
        if (!drag || e.pointerId !== drag.id || busy) return;
        const ci = clamp(drag.c0 + Math.round((e.clientX - drag.x) / drag.unitPx), C_MIN, C_MAX);
        if (ci !== c[i]) moveBlock(i, ci);
      });
      const end = (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        drag = null;
        g.classList.remove("vd-grab");
      };
      g.addEventListener("pointerup", end);
      g.addEventListener("pointercancel", end);
    });
  }

  function drawGhost() {
    const h = harmonic(round.n);
    els.ghost.innerHTML = h
      .map((ci, i) => `<rect class="vd-ghost" x="${px(ci - HALF)}" y="${blockY(i)}" width="${2 * HALF * U}" height="${BH - 1}" rx="3"/>`)
      .join("");
  }

  function drop() {
    if (busy || finished) return;
    busy = true;
    rounds++;
    els.drop.disabled = true;
    els.svg.classList.add("vd-locked");
    const res = vdCheck(c);
    const over = c[c.length - 1] + HALF;
    const fb = els.feedback;
    if (res.ok && over >= round.target) {
      score += 10;
      level++;
      renderScore();
      els.blocks.classList.add("vd-settle");
      body.querySelector("[data-scene]").dataset.result = "ok";
      fb.className = "feedback vd-feedback ok";
      fb.textContent = `¡Aguanta! Sobresale ${over}/24 (objetivo ${round.target}/24)${over >= 24 ? ": ¡más de un bloque entero fuera de la mesa!" : "."}`;
      later(nextRound, 1500);
      return;
    }
    lives--;
    renderLives();
    body.querySelector("[data-scene]").dataset.result = "bad";
    fb.className = "feedback vd-feedback bad";
    const tip = "Pista (línea azul): de arriba abajo, cada bloque sobresale ½, ¼, ⅙, ⅛ del de debajo.";
    if (res.ok) {
      els.blocks.classList.add("vd-settle");
      fb.textContent =
        over > 0
          ? `Aguanta, pero sobresale ${over}/24 y había que llegar a ${round.target}/24. ${tip}`
          : `Aguanta, pero el de arriba ni llega al borde (${num(over)}/24) y había que sobresalir ${round.target}/24. ${tip}`;
    } else {
      fb.textContent = `${explainFall(res)} ${tip}`;
      topple(res);
    }
    drawGhost();
    if (lives <= 0) {
      later(() => finish(false), 3400);
      return;
    }
    later(() => {
      if (finished) return;
      els.drop.hidden = true;
      els.next.hidden = false;
    }, 900);
  }

  function explainFall(res) {
    const above = c.slice(res.j + 1);
    const comTxt =
      res.sum % res.m === 0 ? num(res.sum / res.m) : `${num(res.sum)} ÷ ${res.m} ≈ ${num(Math.round((res.sum / res.m) * 10) / 10).replace(".", ",")}`;
    const who = res.m === 1 ? "Centro del de arriba" : res.m === n() ? `Centro de los ${res.m} bloques` : `Centro de los ${res.m} de arriba`;
    const how = res.m === 1 ? `= ${comTxt}` : `= media de sus centros = (${above.map(num).join(" + ")}) ÷ ${res.m} = ${comTxt}`;
    let sup;
    if (res.j < 0) sup = `la mesa acaba en 0 → toda la torre vuelca`;
    else if (res.side > 0) sup = `tu bloque de apoyo acaba antes, en ${num(res.hi)} → vuelca`;
    else sup = `tu bloque de apoyo empieza después, en ${num(res.lo)} → vuelca`;
    return `${who} (en 24avos desde el borde) ${how}; ${sup}.`;
  }
  const n = () => c.length;

  // Dibuja el centro de masas (punto rojo) con su plomada y hace caer el
  // trozo que vuelca girando sobre la arista del apoyo.
  function topple(res) {
    const yTopSupport = res.j >= 0 ? blockY(res.j) : TY;
    const ys = [];
    for (let k = res.j + 1; k < c.length; k++) ys.push(blockY(k) + BH / 2);
    const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
    const cx = px(res.sum / res.m);
    const lo = res.j >= 0 ? px(res.lo) : 0;
    const hi = px(res.hi);
    // Contorno de dónde estaba el trozo, apoyo en verde y la plomada.
    let out = "";
    for (let k = res.j + 1; k < c.length; k++)
      out += `<rect class="vd-was" x="${px(c[k] - HALF)}" y="${blockY(k)}" width="${2 * HALF * U}" height="${BH - 1}" rx="3"/>`;
    out += `<line class="vd-support" x1="${lo}" y1="${yTopSupport}" x2="${hi}" y2="${yTopSupport}"/>`;
    out += `<line class="vd-plumb" x1="${cx}" y1="${cy}" x2="${cx}" y2="${yTopSupport + 34}"/>`;
    out += `<path class="vd-bob" d="M${cx - 4},${yTopSupport + 32} L${cx + 4},${yTopSupport + 32} L${cx},${yTopSupport + 40} Z"/>`;
    out += `<circle class="vd-com" data-com cx="${cx}" cy="${cy}" r="5"/>`;
    els.fx.innerHTML = out;
    // El trozo que cae, agrupado y girando sobre la arista.
    const piece = document.createElementNS("http://www.w3.org/2000/svg", "g");
    piece.setAttribute("class", `vd-piece ${res.side > 0 ? "vd-fall-r" : "vd-fall-l"}`);
    piece.style.transformOrigin = `${res.side > 0 ? hi : lo}px ${yTopSupport}px`;
    for (let k = res.j + 1; k < c.length; k++) piece.appendChild(els.blocks.querySelector(`[data-block="${k}"]`));
    els.blocks.appendChild(piece);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearAll();
    if (userExited) return onExit();
    saveScore(client, "voladizo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🪵</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} torres que aguantan</p>
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
    clearAll();
    lives = startLives;
    score = 0;
    rounds = 0;
    level = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearAll();
  };
}
