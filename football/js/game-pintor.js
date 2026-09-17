// "El pintor": una pared irregular (rectángulos pegados) que hay que
// cubrir comprando los botes JUSTOS. Primero se mide el área (contando
// cuadritos de 1 m² o multiplicando los rectángulos) y luego se reparte
// en botes. El generador comprueba que existe UNA sola combinación de
// botes que da el área exacta.
import { randInt, shuffle, saveScore } from "./utils.js";

const YIELDS = [2, 3, 4, 5, 6, 8, 10, 12];

// Cuenta las combinaciones de botes (respetando el stock) que suman
// exactamente `area`. Devuelve también la única solución si hay una.
export function countCanSolutions(yields, stocks, area) {
  let count = 0;
  let sol = null;
  const rec = (i, left, used) => {
    if (count > 1) return;
    if (left === 0) { count++; if (count === 1) sol = used.slice(); return; }
    if (i >= yields.length || left < 0) return;
    for (let n = 0; n <= stocks[i]; n++) {
      if (n * yields[i] > left) break;
      used.push(n);
      rec(i + 1, left - n * yields[i], used);
      used.pop();
      if (count > 1) return;
    }
  };
  rec(0, area, []);
  return { count, sol };
}

// Pared: 2 o 3 rectángulos pegados (forma de L o de escalera).
function makeWall(rectCount, bigger) {
  const w0 = randInt(2, bigger ? 5 : 4);
  const h0 = randInt(2, bigger ? 4 : 3);
  const w1 = randInt(1, 3);
  const h1 = randInt(1, h0 - 1);
  const rects = [
    { x: 0, y: 0, w: w0, h: h0 },
    { x: w0, y: 0, w: w1, h: h1 },
  ];
  if (rectCount === 3) {
    const w2 = randInt(1, w0);
    const h2 = randInt(1, 2);
    rects.push({ x: 0, y: h0, w: w2, h: h2 });
  }
  const bw = Math.max(...rects.map((r) => r.x + r.w));
  const bh = Math.max(...rects.map((r) => r.y + r.h));
  const area = rects.reduce((a, r) => a + r.w * r.h, 0);
  if (bw > 8 || bh > 6) return null;
  return { rects, bw, bh, area };
}

const FALLBACK = {
  rects: [{ x: 0, y: 0, w: 4, h: 3 }, { x: 4, y: 0, w: 2, h: 2 }],
  bw: 6, bh: 3, area: 16,
  yields: [10, 4, 2], stocks: [1, 2, 2], sol: [1, 1, 1],
};

export function makePintorRound(streak) {
  const rectCount = streak >= 3 ? 3 : 2;
  const minArea = streak >= 6 ? 18 : 12;
  const maxArea = streak >= 3 ? 40 : 26;
  let guard = 0;
  while (guard++ < 300) {
    const wall = makeWall(rectCount, streak >= 6);
    if (!wall) continue;
    if (wall.area < minArea || wall.area > maxArea) continue;
    // Botes: 3 rendimientos distintos con stock limitado.
    for (let inner = 0; inner < 150; inner++) {
      const yields = shuffle(YIELDS).slice(0, 3).sort((a, b) => b - a);
      const stocks = yields.map(() => randInt(1, 3));
      const stored = yields.reduce((a, y, i) => a + y * stocks[i], 0);
      if (stored < wall.area + 3) continue;           // tiene que haber sobra
      const { count, sol } = countCanSolutions(yields, stocks, wall.area);
      if (count !== 1) continue;
      const cans = sol.reduce((a, b) => a + b, 0);
      if (cans < 2 || cans > 6) continue;             // ni trivial ni infinito
      if (cans === stocks.reduce((a, b) => a + b, 0)) continue; // no vale "cógelo todo"
      return { ...wall, yields, stocks, sol };
    }
  }
  return { ...FALLBACK };
}

export function mountPintorGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let round = null;
  let cart = [];      // botes cogidos de cada tipo
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
  function chosenArea() {
    return cart.reduce((a, n, i) => a + n * round.yields[i], 0);
  }

  function nextRound() {
    round = makePintorRound(streak);
    cart = round.yields.map(() => 0);
    locked = false;
    const cell = Math.max(18, Math.floor(Math.min(36, 320 / round.bw, 200 / round.bh)));

    body.innerHTML = `
      <div class="pn-wrap">
        <p class="prompt pn-prompt">🎨 Compra la pintura justa
          <small>Cada cuadrito de la pared es 1 m². Ni te pases ni te quedes corto.</small></p>
        <div class="pn-wall" data-wall style="width:${round.bw * cell}px;height:${round.bh * cell}px"></div>
        <div class="pn-cans" data-cans></div>
        <div class="pn-cart">
          <span class="pn-cart-items" data-cartitems></span>
          <b class="pn-cart-total" data-total>0 m²</b>
        </div>
        <div class="feedback" data-feedback></div>
        <div class="pn-actions">
          <button class="secondary" data-reset>↺ Devolver</button>
          <button class="primary" data-go>Pintar</button>
        </div>
      </div>
    `;

    const wall = body.querySelector("[data-wall]");
    wall.innerHTML = round.rects.map((r, i) => `
      <div class="pn-rect" data-rect="${i}" style="left:${r.x * cell}px;top:${r.y * cell}px;
        width:${r.w * cell}px;height:${r.h * cell}px;background-size:${cell}px ${cell}px"></div>`).join("");

    const cansEl = body.querySelector("[data-cans]");
    round.yields.forEach((y, i) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn pn-can";
      btn.type = "button";
      btn.dataset.can = String(i);
      btn.innerHTML = `<span class="pn-bucket">🪣</span><b>${y} m²</b><small data-stock></small>`;
      btn.addEventListener("click", () => takeCan(i));
      cansEl.appendChild(btn);
    });
    renderCart();
  }

  function renderCart() {
    round.yields.forEach((y, i) => {
      const btn = body.querySelector(`[data-can="${i}"]`);
      btn.querySelector("[data-stock]").textContent = `quedan ${round.stocks[i] - cart[i]}`;
      btn.disabled = locked || cart[i] >= round.stocks[i];
    });
    const items = [];
    cart.forEach((n, i) => {
      for (let k = 0; k < n; k++) {
        items.push(`<button class="pn-chip" data-drop="${i}" type="button">🪣 ${round.yields[i]}</button>`);
      }
    });
    const itemsEl = body.querySelector("[data-cartitems]");
    itemsEl.innerHTML = items.length ? items.join("") : `<i class="pn-empty">sin botes</i>`;
    body.querySelector("[data-total]").textContent = `${chosenArea()} m²`;
  }

  function takeCan(i) {
    if (finished || locked || cart[i] >= round.stocks[i]) return;
    cart[i]++;
    renderCart();
  }
  function dropCan(i) {
    if (finished || locked || cart[i] <= 0) return;
    cart[i]--;
    renderCart();
  }

  function check() {
    if (finished || locked) return;
    const total = chosenArea();
    if (total === 0) return;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    if (total === round.area) {
      locked = true;
      score += 10;
      streak++;
      renderScore();
      renderCart();
      feedback.innerHTML = `¡Justo! La pared medía <b>${round.area} m²</b>`;
      feedback.className = "feedback ok";
      showDecomposition(true);
      return later(nextRound, 1800);
    }
    locked = true;
    streak = 0;
    lives--;
    renderLives();
    renderCart();
    const diff = total - round.area;
    // Al fallar, la pared se descompone en sus rectángulos con el área de
    // cada uno y la suma, y se dice la combinación de botes que cuadraba.
    const parts = round.rects.map((r) => `${r.w}×${r.h}=${r.w * r.h}`).join(" + ");
    const solText = round.sol
      .map((n, i) => (n ? `${n} bote${n > 1 ? "s" : ""} de ${round.yields[i]} m²` : null))
      .filter(Boolean).join(" + ");
    feedback.innerHTML = `La pared era ${parts} = <b>${round.area} m²</b>.
      Con ${total} m² te ${diff > 0 ? `sobraban <b>${diff}</b>` : `faltaban <b>${-diff}</b>`} m².
      Salía con ${solText}.`;
    feedback.className = "feedback bad";
    showDecomposition(true);
    if (lives <= 0) return later(() => finish(false), 3400);
    later(nextRound, 3400);
  }

  function showDecomposition(split) {
    round.rects.forEach((r, i) => {
      const el = body.querySelector(`[data-rect="${i}"]`);
      if (!el) return;
      el.classList.add("pn-split");
      if (split) el.innerHTML = `<span>${r.w}×${r.h}<br>${r.w * r.h} m²</span>`;
    });
  }

  function finish(userExited) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    if (userExited) return onExit();
    saveScore(client, "pintor", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎨</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} paredes pintadas</p>
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
    if (finished) return;
    const drop = ev.target.closest("[data-drop]");
    if (drop) return dropCan(Number(drop.dataset.drop));
    if (ev.target.closest("[data-reset]")) {
      if (locked) return;
      cart = round.yields.map(() => 0);
      return renderCart();
    }
    if (ev.target.closest("[data-go]")) check();
  });

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
  };
}
