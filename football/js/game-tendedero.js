// "El tendedero" (Clothesline Math, Chris Shore).
//
// Una cuerda sin escala: solo dos pinzas fijas con valores (no siempre 0
// y 1). Debajo, 3-4 tarjetas que hay que tender en la cuerda arrastrándolas
// (en cualquier orden y recolocándolas cuantas veces se quiera): cada
// tarjeta cuelga de una pinza justo donde se suelta. La escala la definen
// las propias tarjetas: entre las dos pinzas fijas hay un número exacto de
// "saltos" iguales y cada tarjeta cae en uno de esos saltos.
//
// Botón "Tender": vale si cada tarjeta está a ±4 % (de la longitud de la
// cuerda) de su sitio proporcional y todas en el orden correcto. Al fallar
// aparecen las marcas de la subdivisión común, cada tarjeta salta a su
// sitio real y se ve cuánto se desviaba.
import { randInt, pick, shuffle, clamp, saveScore } from "./utils.js";

// Margen de la cuerda: las posiciones exactas viven en [M, 1 − M].
const M = 0.05;
const TOL = 0.04; // tolerancia: ±4 % de la cuerda
const MIN_SEP = 0.08; // separación mínima entre posiciones exactas
const MIN_REF_SEP = 0.25; // las dos pinzas fijas, bien separadas

const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};

// Posición (fracción de la cuerda) del índice i de la subdivisión de N saltos.
export const posOf = (i, N) => M + ((1 - 2 * M) * i) / N;

// Valor u·s como fracción irreducible [num, den] (s = p/q).
function valueOf(u, p, q) {
  const n = u * p;
  const g = gcd(n, q);
  return [n / g, q / g];
}

const MINUS = "−";

// Etiqueta en texto plano (ASCII, para data-label) y en HTML (para ver).
function labelOf(u, p, q, mode) {
  const [n, d] = valueOf(u, p, q);
  if (d === 1) return { text: String(n), html: n < 0 ? MINUS + -n : String(n) };
  if (mode === "dec") {
    // q = 100 y p ∈ {10, 20, 25, 50}: como mucho dos decimales.
    const cents = u * p;
    const sign = cents < 0 ? "-" : "";
    const abs = Math.abs(cents);
    let frac = String(abs % 100).padStart(2, "0").replace(/0$/, "");
    const txt = `${sign}${Math.floor(abs / 100)},${frac}`;
    return { text: txt, html: txt.replace("-", MINUS) };
  }
  const sign = n < 0 ? MINUS : "";
  return {
    text: `${n}/${d}`,
    html: `${sign}<span class="td-frac"><span>${Math.abs(n)}</span><span>${d}</span></span>`,
  };
}

const UNIT_NAMES = {
  2: ["medio", "medios"],
  3: ["tercio", "tercios"],
  4: ["cuarto", "cuartos"],
  5: ["quinto", "quintos"],
  6: ["sexto", "sextos"],
  7: ["séptimo", "séptimos"],
  8: ["octavo", "octavos"],
  9: ["noveno", "novenos"],
  10: ["décimo", "décimos"],
  12: ["doceavo", "doceavos"],
  14: ["catorceavo", "catorceavos"],
  15: ["quinceavo", "quinceavos"],
  16: ["dieciseisavo", "dieciseisavos"],
  18: ["dieciochoavo", "dieciochoavos"],
  20: ["veinteavo", "veinteavos"],
  21: ["veintiunavo", "veintiunavos"],
  24: ["veinticuatroavo", "veinticuatroavos"],
};

// ---------------------------------------------------------------------
// Generador. Cada tipo fija la subdivisión común (salto s = p/q), la pinza
// A = a·s, la pinza B = (a + k)·s, el número total de saltos N ≤ 24 de la
// cuerda y el índice iA de la pinza A. Las tarjetas son otros índices.
// ---------------------------------------------------------------------
function kindFor(level) {
  if (level < 2) return "int10";
  if (level < 4) return "intRef";
  if (level < 6) return "frac01";
  if (level < 8) return "fracRare";
  return pick(["dec", "neg", "fracRare", "dec", "neg"]);
}

function params(kind) {
  if (kind === "int10") {
    const N = randInt(10, 12);
    return { mode: "int", p: 1, q: 1, a: 0, k: 10, N, iA: randInt(0, N - 10), uMin: 1, uMax: 9 };
  }
  if (kind === "intRef") {
    const p = pick([1, 2, 5, 10]);
    const a = p === 1 ? randInt(3, 15) : randInt(1, 9);
    const k = randInt(3, 8);
    const N = Math.min(24, k + randInt(0, 4));
    return { mode: "int", p, q: 1, a, k, N, iA: randInt(0, N - k), uMin: 1 };
  }
  if (kind === "frac01") {
    const D = pick([3, 4, 5, 6, 8, 10, 12]);
    const N = Math.min(24, D + randInt(0, Math.ceil(D / 3)));
    return { mode: "frac", p: 1, q: D, a: 0, k: D, N, iA: 0, uMin: 1, minFrac: 2 };
  }
  if (kind === "fracRare") {
    const [bn, bd] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [3, 2], [4, 3], [5, 4], [5, 3], [5, 6]]);
    const ms = [1, 2, 3, 4].filter((m) => bd * m <= 24 && bn * m <= 20);
    const m = pick(ms.length > 1 ? ms.slice(1) : ms); // mejor con subdivisión
    const D = bd * m;
    const k = bn * m;
    const N = Math.min(24, k + randInt(0, Math.ceil(k / 2)));
    return { mode: "frac", p: 1, q: D, a: 0, k, N, iA: 0, uMin: 1, minFrac: 2 };
  }
  if (kind === "dec") {
    const p = pick([10, 20, 25, 50]);
    const k = randInt(3, 10);
    const a = randInt(-k, 6);
    const N = Math.min(24, k + randInt(1, 5));
    return { mode: "dec", p, q: 100, a, k, N, iA: randInt(0, N - k), minFrac: 2 };
  }
  // "neg": enteros con negativos
  const p = pick([1, 2, 5, 10]);
  const k = randInt(3, 10);
  const N = Math.min(24, k + randInt(1, 5));
  return { mode: "int", p, q: 1, a: randInt(-8, -1), k, N, iA: randInt(0, N - k), needNeg: true };
}

function tryBuild(kind, nCards) {
  const P = params(kind);
  const { p, q, a, k, N, iA, mode } = P;
  const iB = iA + k;
  if (N > 24 || iB > N) return null;
  const step = (1 - 2 * M) / N;
  if (k * step < MIN_REF_SEP) return null;
  const dmin = Math.ceil((MIN_SEP - 1e-9) / step);
  const uOf = (i) => a + i - iA;
  const cand = [];
  for (let i = 0; i <= N; i++) {
    if (Math.abs(i - iA) < dmin || Math.abs(i - iB) < dmin) continue;
    const u = uOf(i);
    if (P.uMin !== undefined && u < P.uMin) continue;
    if (P.uMax !== undefined && u > P.uMax) continue;
    cand.push(i);
  }
  const chosen = [];
  for (const i of shuffle(cand)) {
    if (chosen.every((j) => Math.abs(i - j) >= dmin)) chosen.push(i);
    if (chosen.length === nCards) break;
  }
  if (chosen.length < nCards) return null;
  const cards = chosen.map((i, depth) => {
    const u = uOf(i);
    return { i, u, t: posOf(i, N), depth, ...labelOf(u, p, q, mode) };
  });
  if (P.minFrac && cards.filter((c) => valueOf(c.u, p, q)[1] !== 1).length < P.minFrac) return null;
  if (P.needNeg && !cards.some((c) => c.u < 0)) return null;
  const refs = [iA, iB].map((i) => ({ i, u: uOf(i), t: posOf(i, N), ...labelOf(uOf(i), p, q, mode) }));
  const sLabel = labelOf(1, p, q, mode);
  return { kind, mode, p, q, a, k, N, iA, iB, refs, cards, sLabel };
}

export function buildTendederoRound(level) {
  const kind = kindFor(level);
  const nCards = level >= 8 ? 4 : 3 + (level % 2);
  for (let guard = 0; guard < 500; guard++) {
    const r = tryBuild(kind, nCards);
    if (r) return r;
  }
  // Red de seguridad (no debería ocurrir): ronda fija y válida.
  return tryBuildFixed();
}

function tryBuildFixed() {
  const N = 10;
  const mk = (u, depth) => ({ i: u, u, t: posOf(u, N), depth, ...labelOf(u, 1, 1, "int") });
  return {
    kind: "int10", mode: "int", p: 1, q: 1, a: 0, k: 10, N, iA: 0, iB: 10,
    refs: [mk(0), mk(10)], cards: [mk(3, 0), mk(5, 1), mk(8, 2)], sLabel: labelOf(1, 1, 1, "int"),
  };
}

// Comprobación: cada tarjeta a ±TOL de su sitio y en el orden correcto.
export function checkPlacement(cards, placed) {
  const within = cards.map((c, j) => Math.abs(placed[j] - c.t) <= TOL + 1e-9);
  const byPlaced = cards.map((_, j) => j).sort((x, y) => placed[x] - placed[y]);
  const byTrue = cards.map((_, j) => j).sort((x, y) => cards[x].t - cards[y].t);
  const ordered = byPlaced.every((j, n) => j === byTrue[n]);
  return { within, ordered, ok: ordered && within.every(Boolean) };
}

// ---------------------------------------------------------------------
export function mountTendederoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let round = null;
  let placed = []; // posición (0..1) de cada tarjeta en la cuerda, o null
  let busy = false;
  let pending = null;
  let ghost = null;

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
  const pct = (t) => `${(t * 100).toFixed(3)}%`;

  function nextRound() {
    round = buildTendederoRound(level);
    placed = round.cards.map(() => null);
    busy = false;
    const n = round.cards.length;
    body.innerHTML = `
      <p class="prompt td-prompt">Tiende cada tarjeta en su sitio
        <small>Arrástralas a la cuerda. Las dos pinzas fijas marcan la escala.</small></p>
      <div class="td-stage" data-stage style="--td-rows:${n}">
        <div class="td-line" data-line>
          <div class="td-rope"></div>
          <div class="td-ticks" data-ticks></div>
          ${round.refs
            .map(
              (r) => `<div class="td-ref" data-ref data-label="${r.text}" style="left:${pct(r.t)}">
                <span class="td-ref-tag">${r.html}</span><span class="td-pin td-pin-fixed"></span></div>`
            )
            .join("")}
          <div class="td-hangs" data-hangs></div>
          <div class="td-guide" data-guide hidden></div>
        </div>
      </div>
      <div class="td-tray" data-tray></div>
      <div class="feedback" data-feedback></div>
      <button class="primary td-go" data-go disabled>Tender</button>
    `;
    body.querySelector("[data-go]").addEventListener("click", onGo);
    paint();
  }

  function cardHtml(c, j, extra = "") {
    return `<div class="td-card ${extra}" data-card="${j}" data-label="${c.text}">${c.html}</div>`;
  }

  function paint() {
    const hangs = body.querySelector("[data-hangs]");
    const tray = body.querySelector("[data-tray]");
    hangs.innerHTML = round.cards
      .map((c, j) =>
        placed[j] === null
          ? ""
          : `<div class="td-hang" data-hang="${j}" style="left:${pct(placed[j])};--td-depth:${c.depth}">
              <span class="td-pin"></span><span class="td-string"></span>${cardHtml(c, j)}</div>`
      )
      .join("");
    const order = round.trayOrder || (round.trayOrder = shuffle(round.cards.map((_, j) => j)));
    tray.innerHTML = order.map((j) => (placed[j] === null ? cardHtml(round.cards[j], j) : "")).join("");
    if (!tray.innerHTML) tray.innerHTML = `<span class="td-tray-empty">Todas tendidas · puedes recolocarlas</span>`;
    body.querySelectorAll("[data-card]").forEach(bindDrag);
    body.querySelector("[data-go]").disabled = placed.some((v) => v === null);
  }

  // Arrastre de una tarjeta (de la bandeja o ya colgada) con captura del
  // puntero. Al soltar sobre la zona de la cuerda queda colgada en esa x;
  // si se suelta fuera, vuelve a la bandeja.
  function bindDrag(el) {
    const j = Number(el.dataset.card);
    el.addEventListener("pointerdown", (e) => {
      if (busy || finished) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const lineEl = body.querySelector("[data-line]");
      const stageEl = body.querySelector("[data-stage]");
      const guide = body.querySelector("[data-guide]");
      const src = el.closest("[data-hang]") || el;
      src.classList.add("td-lifting");
      // Desfase entre el dedo y el centro de la tarjeta (= la pinza): así
      // tocar una tarjeta colgada sin moverla no la desplaza.
      const er = el.getBoundingClientRect();
      const dx = e.clientX - (er.left + er.width / 2);
      ghost = document.createElement("div");
      ghost.className = "td-card td-ghost";
      ghost.innerHTML = round.cards[j].html;
      document.body.appendChild(ghost);
      const where = (ev) => {
        const lr = lineEl.getBoundingClientRect();
        const sr = stageEl.getBoundingClientRect();
        const inStage = ev.clientY >= sr.top - 20 && ev.clientY <= sr.bottom && ev.clientX >= sr.left - 30 && ev.clientX <= sr.right + 30;
        return { inStage, t: clamp((ev.clientX - dx - lr.left) / lr.width, 0, 1) };
      };
      const move = (ev) => {
        if (!ghost) return;
        ghost.style.left = `${ev.clientX - dx}px`;
        ghost.style.top = `${ev.clientY}px`;
        const w = where(ev);
        guide.hidden = !w.inStage;
        guide.style.left = pct(w.t);
      };
      const up = (ev) => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
        if (ghost) ghost.remove();
        ghost = null;
        guide.hidden = true;
        if (finished || busy) return;
        const w = ev.type === "pointercancel" ? { inStage: false } : where(ev);
        placed[j] = w.inStage ? w.t : null;
        paint();
      };
      move(e);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    });
  }

  function unitPhrase(n) {
    const { mode, p, q } = round;
    const one = Math.abs(n) === 1;
    if (mode === "frac" && p === 1 && UNIT_NAMES[q]) return `${Math.abs(n)} ${UNIT_NAMES[q][one ? 0 : 1]}`;
    return `${Math.abs(n)} ${one ? "salto" : "saltos"} de ${round.sLabel.text}`;
  }
  const plain = (txt) => txt.replace(/^-/, MINUS);

  function onGo() {
    if (busy || finished || placed.some((v) => v === null)) return;
    busy = true;
    rounds++;
    const res = checkPlacement(round.cards, placed);
    const feedback = body.querySelector("[data-feedback]");
    const go = body.querySelector("[data-go]");
    if (res.ok) {
      score += 10;
      level++;
      renderScore();
      body.querySelectorAll("[data-hang]").forEach((h) => h.classList.add("td-ok"));
      feedback.textContent = `¡Bien tendido! Cada salto vale ${plain(round.sLabel.text)}.`;
      feedback.className = "feedback ok";
      go.disabled = true;
      pending = setTimeout(nextRound, 1300);
      return;
    }
    lives--;
    renderLives();
    showSolution(res);
    const [A] = round.refs;
    const B = round.refs[1];
    const head = `✗ Entre ${plain(A.text)} y ${plain(B.text)} hay ${unitPhrase(round.k)} (las marcas grises).`;
    const parts = [];
    round.cards.forEach((c, j) => {
      if (res.within[j] && res.ordered) return;
      const n = c.u - round.a;
      const eq = round.mode === "frac" && c.text !== `${c.u}/${round.q}` ? ` = ${c.u}/${round.q}` : "";
      parts.push(`${plain(c.text)}${eq} → ${unitPhrase(n)} ${n >= 0 ? "desde" : "antes de"} ${plain(A.text)}`);
    });
    const tail = res.ordered
      ? "Las etiquetas dicen cuánto te desviaste."
      : "El orden tampoco era el correcto; las etiquetas dicen cuánto te desviaste.";
    feedback.textContent = `${head} ${parts.join(" · ")}. ${tail}`;
    feedback.className = "feedback bad";
    go.textContent = lives > 0 ? "Seguir" : "Ver resultado";
    go.disabled = false;
    go.replaceWith(go.cloneNode(true));
    body.querySelector("[data-go]").addEventListener("click", () => (lives > 0 ? nextRound() : finish(false)));
  }

  // Dibuja las marcas de la subdivisión y lleva cada tarjeta a su sitio,
  // dejando la pinza fantasma donde estaba y la desviación en %.
  function showSolution(res) {
    const ticks = body.querySelector("[data-ticks]");
    let html = "";
    for (let i = 0; i <= round.N; i++) {
      const isRef = i === round.iA || i === round.iB;
      html += `<span class="td-tick ${isRef ? "td-tick-ref" : ""}" style="left:${pct(posOf(i, round.N))}"></span>`;
    }
    round.cards.forEach((c, j) => {
      const a = Math.min(placed[j], c.t);
      const b = Math.max(placed[j], c.t);
      html += `<span class="td-ghostpin ${res.within[j] ? "td-near" : ""}" style="left:${pct(placed[j])}"></span>`;
      html += `<span class="td-dev ${res.within[j] ? "td-near" : ""}" style="left:${pct(a)};width:${pct(b - a)}"></span>`;
    });
    ticks.innerHTML = html;
    body.querySelectorAll("[data-hang]").forEach((h) => {
      const j = Number(h.dataset.hang);
      const c = round.cards[j];
      const dev = Math.round((placed[j] - c.t) * 100);
      h.classList.add(res.within[j] ? "td-ok" : "td-bad");
      // La etiqueta de desviación va al lado de la tarjeta (a la izquierda
      // si la tarjeta queda muy a la derecha), en su misma franja de altura.
      h.querySelector(".td-card").insertAdjacentHTML(
        "beforeend",
        `<span class="td-badge ${c.t > 0.72 ? "td-badge-left" : ""}">${
          res.within[j] ? "✓" : (dev > 0 ? "+" : MINUS) + Math.abs(dev) + " %"
        }</span>`
      );
      // forzamos el estilo inicial para que la transición se vea
      void h.offsetWidth;
      h.classList.add("td-moving");
      h.style.left = pct(c.t);
    });
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (ghost) ghost.remove();
    ghost = null;
    if (userExited) return onExit();
    saveScore(client, "tendedero", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧷</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} tendederos bien tendidos</p>
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
    clearTimeout(pending);
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
    clearTimeout(pending);
    if (ghost) ghost.remove();
    ghost = null;
    document.querySelectorAll(".td-ghost").forEach((g) => g.remove());
  };
}
