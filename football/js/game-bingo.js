// "Bingo de las tablas": un cartón de bingo 3×3 con nueve resultados. Del
// bombo sale una bola con una cuenta (7 × 8) y hay unos segundos para tocar
// en el cartón la casilla con el resultado, o "No está" si no aparece. La
// primera línea (3 en raya) vale +10 y el cartón lleno (¡bingo!) +10 más;
// fallar o dejar pasar la bola quita una vida. Cada bingo sube de nivel:
// tablas 2-5 → tablas 6-9 → sumas y restas → divisiones exactas → mezcla.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

// Las 8 formas de hacer 3 en raya en el cartón (filas, columnas, diagonales)
export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const NAMES = ["Tablas del 2 al 5", "Tablas del 6 al 9", "Sumas y restas", "Divisiones exactas", "Mezcla"];
const KINDS = [["x25"], ["x69"], ["pm"], ["div"], ["x", "pm", "div"]];
const SECONDS = [5, 5, 7, 7, 7];

// Todas las cuentas de un tipo cuyo resultado es exactamente v.
function opsFor(v, kind) {
  const out = [];
  if (kind[0] === "x") {
    const [lo, hi] = kind === "x25" ? [2, 5] : kind === "x69" ? [6, 9] : [2, 9];
    for (let a = lo; a <= hi; a++)
      for (let b = 2; b <= 10; b++)
        if (a * b === v) {
          const [p, q] = Math.random() < 0.5 ? [a, b] : [b, a];
          out.push({ t: `${p} × ${q}`, h: `${p} × ${q} = ${v}` });
        }
  }
  if (kind === "pm" && v >= 10 && v <= 97) {
    let a = randInt(3, v - 3);
    if (a % 10 === 0 && v % 10 === 0) a = randInt(3, v - 3); // mejor que no sean dos decenas
    out.push({ t: `${a} + ${v - a}`, h: `${a} + ${v - a} = ${v}` });
    const m = randInt(v + 3, 100);
    out.push({ t: `${m} − ${m - v}`, h: `${m} − ${m - v} = ${v}` });
  }
  if (kind === "div" && v >= 2 && v <= 12) {
    const d = randInt(2, 9);
    out.push({ t: `${v * d} ÷ ${d}`, h: `${v * d} ÷ ${d} = ${v}, porque ${d} × ${v} = ${v * d}` });
  }
  return out;
}
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const POOL = {};
for (const k of ["x25", "x69", "x", "pm", "div"]) POOL[k] = range(2, 100).filter((v) => opsFor(v, k).length);

// Un cartón con su lista de bolas: salen los 9 números del cartón (cada uno
// una vez) mezclados con 3-4 bolas cuyo resultado NO está en el cartón.
export function buildRound(level) {
  const kinds = KINDS[level];
  const chosen = new Set();
  for (const k of kinds) {
    const want = 9 / kinds.length;
    let c = 0;
    for (const v of shuffle([...POOL[k]])) if (c < want && !chosen.has(v)) chosen.add(v), c++;
  }
  // Como en los cartones de verdad: los números crecen por columnas.
  const sorted = [...chosen].sort((a, b) => a - b);
  const cells = Array(9);
  sorted.forEach((v, i) => (cells[(i % 3) * 3 + Math.floor(i / 3)] = v));
  const outside = [...new Set(kinds.flatMap((k) => POOL[k]))].filter((v) => !chosen.has(v));
  const used = new Set();
  const ball = (v) => {
    for (let t = 0; t < 40; t++) {
      const op = pick(opsFor(v, pick(kinds.filter((k) => POOL[k].includes(v)))));
      if (used.has(op.t)) continue;
      used.add(op.t);
      const cell = cells.indexOf(v);
      return { text: op.t, value: v, cell, hint: `${op.h} → ${cell >= 0 ? "¡está en tu cartón!" : "no está en el cartón"}` };
    }
    return null; // ya salieron todas las cuentas posibles de ese número
  };
  const balls = shuffle([...sorted]).map(ball);
  const decoys = randInt(3, 4);
  for (let i = 0; i < decoys; ) {
    const b = ball(pick(outside));
    if (b) balls.splice(randInt(1, balls.length - 1), 0, b), i++;
  }
  return { level, name: NAMES[level], seconds: SECONDS[level], cells, balls };
}

export function mountBingoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, bingos, finished = false, pending = null, timer = null;
  let card, marked, lineDone, idx, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body bg-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const $ = (s) => body.querySelector(s);

  function newCard() {
    if (finished) return;
    card = buildRound(Math.min(4, bingos));
    marked = new Set();
    lineDone = false;
    idx = 0;
    body.innerHTML = `
      <p class="prompt bg-prompt">¿Está la bola en tu cartón?</p>
      <div class="bg-top">
        <div class="bg-ball" data-ball>
          <svg class="bg-ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="bg-ring-bg" cx="60" cy="60" r="56"/><circle class="bg-ring-fg" data-ring cx="60" cy="60" r="56"/></svg>
          <span class="bg-op" data-op></span>
        </div>
        <div class="bg-side"><div class="bg-count" data-count></div><div class="bg-past" data-past></div></div>
      </div>
      <div class="bg-carton">
        <div class="bg-head"><b>BINGO</b><span>${card.name}</span></div>
        <div class="bg-grid">${card.cells.map((v, i) => `<button type="button" class="bg-cell" data-cell="${i}">${v}</button>`).join("")}</div>
        <div class="bg-stamp" data-stamp></div>
      </div>
      <button type="button" class="bg-none" data-none>✋ No está</button>
      <div class="feedback bg-feedback" data-feedback></div>
      <button type="button" class="secondary bg-next" data-next>Siguiente →</button>
    `;
    body.querySelectorAll("[data-cell]").forEach((b) => b.addEventListener("click", () => !marked.has(+b.dataset.cell) && answer(+b.dataset.cell)));
    $("[data-none]").addEventListener("click", () => answer("none"));
    showBall();
  }

  function showBall() {
    if (finished) return;
    busy = false;
    const ball = card.balls[idx];
    $("[data-op]").textContent = ball.text;
    $("[data-count]").textContent = `Bola ${idx + 1}${lineDone ? " · Línea ✓" : ""}`;
    const ballEl = $("[data-ball]"), ring = $("[data-ring]");
    // Se reinician las animaciones de la bola y del anillo de tiempo.
    ballEl.classList.remove("bg-roll");
    ring.style.animation = "none";
    void ballEl.offsetWidth;
    ballEl.classList.add("bg-roll");
    ring.style.animation = `bg-tick ${card.seconds}s linear forwards`;
    body.querySelectorAll(".bg-wrong, .bg-right").forEach((e) => e.classList.remove("bg-wrong", "bg-right"));
    $("[data-feedback]").textContent = "";
    $("[data-feedback]").className = "feedback bg-feedback";
    $("[data-next]").classList.remove("show");
    timer = setTimeout(() => answer(null), card.seconds * 1000);
  }

  function stamp(text) {
    const s = $("[data-stamp]");
    s.textContent = text;
    s.classList.remove("show");
    void s.offsetWidth;
    s.classList.add("show");
  }

  // choice: índice de casilla, "none" (botón No está) o null (se acabó el tiempo)
  function answer(choice) {
    if (finished || busy) return;
    busy = true;
    clearTimeout(timer);
    $("[data-ring]").style.animationPlayState = "paused";
    rounds++;
    const ball = card.balls[idx];
    const cells = body.querySelectorAll("[data-cell]");
    const none = $("[data-none]");
    const ok = choice !== null && (ball.cell >= 0 ? choice === ball.cell : choice === "none");
    // El número cantado se marca siempre con su ficha (si se falla, con la
    // ficha de corrección), para que el cartón pueda seguir completándose.
    if (ball.cell >= 0) {
      marked.add(ball.cell);
      cells[ball.cell].classList.add("marked");
      if (!ok) cells[ball.cell].classList.add("bg-missed");
    }
    if (ok) hits++;
    else {
      if (typeof choice === "number") cells[choice].classList.add("bg-wrong");
      if (choice === "none") none.classList.add("bg-wrong");
      (ball.cell >= 0 ? cells[ball.cell] : none).classList.add("bg-right");
      lives--;
      renderLives();
    }
    $("[data-past]").insertAdjacentHTML("afterbegin", `<span class="bg-mini${ok ? "" : " bad"}">${ball.value}</span>`);
    const fb = $("[data-feedback]");
    fb.textContent = `${ok ? "✓" : choice === null ? "⏰ ¡Se acabó el tiempo!" : "✗"} 💡 ${ball.hint}`;
    fb.className = `feedback bg-feedback ${ok ? "ok" : "bad"}`;
    if (!lineDone) {
      const line = LINES.find((l) => l.every((c) => marked.has(c)));
      if (line) {
        lineDone = true;
        score += 10;
        line.forEach((c) => cells[c].classList.add("bg-line"));
        stamp("¡LÍNEA! +10");
      }
    }
    const bingo = marked.size === 9;
    if (bingo) {
      score += 10;
      bingos++;
      stamp("¡BINGO! +10");
    }
    renderScore();
    idx++;
    const next = () => {
      if (finished) return;
      clearTimeout(pending);
      lives <= 0 ? finish(false) : bingo ? newCard() : showBall();
    };
    if (ok) pending = setTimeout(next, bingo ? 1800 : 950);
    else {
      pending = setTimeout(next, 2500);
      const nb = $("[data-next]");
      nb.classList.add("show");
      nb.onclick = next;
    }
  }

  // Teclado físico: la tecla N = "No está".
  const onKey = (e) => {
    if (finished || !card) return;
    if (e.key === "n" || e.key === "N") answer("none");
    else return;
    e.preventDefault();
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    clearTimeout(timer);
    if (userExited) return onExit();
    saveScore(client, "bingo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎱</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} bolas acertadas de ${rounds} · ${bingos} ${bingos === 1 ? "bingo" : "bingos"}</p>
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
    hits = 0;
    bingos = 0;
    finished = false;
    renderLives();
    renderScore();
    newCard();
  }

  start();
  return () => {
    finished = true;
    clearTimeout(pending);
    clearTimeout(timer);
    window.removeEventListener("keydown", onKey);
  };
}
