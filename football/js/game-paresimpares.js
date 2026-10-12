// "Par o impar": un número grande con sus puntos (hasta 20, sin agrupar) y
// dos botones grandes PAR / IMPAR. Al responder, los puntos se emparejan
// con rayitas de dos en dos y, si es impar, uno se queda solo en rojo. En
// los niveles sin puntos el 💡 subraya la última cifra ("los pares acaban
// en 0, 2, 4, 6, 8"); el último nivel pide razonar sobre el número anterior.
import { randInt, saveScore } from "./utils.js";

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const REGLA = "Los pares acaban en 0, 2, 4, 6, 8";

// Niveles: 0 hasta 20 con puntos · 1 hasta 100 sin puntos (por la última
// cifra) · 2 hasta 1.000 · 3 "el número que va antes del N, ¿par o impar?".
export function buildRound(level) {
  let n, shown, before = false, dots = false;
  if (level === 0) { n = randInt(1, 20); dots = true; }
  else if (level === 1) n = randInt(10, 100);
  else if (level === 2) n = randInt(101, 1000);
  else { before = true; shown = randInt(2, 1000); n = shown - 1; }
  if (!before) shown = n;
  const par = n % 2 === 0;
  const last = n % 10;
  const que = par ? "par" : "impar";
  let hint;
  if (dots) hint = par ? `${n}: todos los puntos tienen pareja → par. ${REGLA}` : `${n}: un punto se queda solo → impar. ${REGLA}`;
  else if (before) hint = `Antes del ${fmt(shown)} va el ${fmt(n)}: acaba en ${last} → ${que} (par e impar se van alternando)`;
  else hint = `${fmt(n)} acaba en ${last} → ${que}. ${REGLA}`;
  return { n, shown, before, dots, par, answer: que, hint };
}

export function mountParesimparesGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body pi-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  // Teclado físico: P = par, I = impar.
  const onKey = (e) => {
    const k = e.key.toLowerCase();
    if (k === "p") answer("par");
    else if (k === "i") answer("impar");
  };
  window.addEventListener("keydown", onKey);

  // Puntos en filas de 10; cada pareja (2 seguidos) lleva una rayita que se
  // enseña al responder; si sobra uno, se marca con un círculo rojo.
  function dotsSvg(n) {
    const per = 10, cell = 30, r = 8, rows = Math.ceil(n / per);
    const W = per * cell, H = rows * cell;
    let out = "";
    for (let i = 0; i < n; i++) {
      const x = (i % per) * cell + cell / 2, y = Math.floor(i / per) * cell + cell / 2;
      const solo = i === n - 1 && n % 2 === 1;
      if (i % 2 === 0 && i + 1 < n) out += `<line class="pi-pair" x1="${x}" y1="${y}" x2="${x + cell}" y2="${y}"/>`;
      out += `<circle class="pi-dot${solo ? " solo" : ""}" cx="${x}" cy="${y}" r="${r}"/>`;
      if (solo) out += `<circle class="pi-alone" cx="${x}" cy="${y}" r="${r + 5}"/>`;
    }
    return `<svg class="pi-dots" data-dots viewBox="0 0 ${W} ${H}" style="max-width:${W}px">${out}</svg>`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 3)));
    busy = false;
    const numHtml = round.before
      ? `<small>el número que va antes del</small>${fmt(round.shown)}`
      : fmt(round.n);
    body.innerHTML = `
      <p class="prompt pi-prompt">${round.before ? "¿Es par o impar?" : "¿Par o impar?"}</p>
      <div class="pi-cuaderno">
        <div class="pi-num" data-num>${numHtml}</div>
        ${round.dots ? dotsSvg(round.n) : ""}
      </div>
      <div class="pi-opts">
        <button type="button" class="pi-opt" data-answer="par">PAR</button>
        <button type="button" class="pi-opt" data-answer="impar">IMPAR</button>
      </div>
      <div class="feedback pi-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-answer]").forEach((b) => b.addEventListener("click", () => answer(b.dataset.answer)));
  }

  function answer(given) {
    if (finished || busy || !round) return;
    busy = true;
    rounds++;
    const ok = given === round.answer;
    body.querySelectorAll("[data-answer]").forEach((b) => {
      b.disabled = true;
      if (b.dataset.answer === round.answer) b.classList.add("good");
      else if (b.dataset.answer === given) b.classList.add("bad");
    });
    // Se enseña el porqué: parejas de puntos, o la última cifra subrayada.
    const dots = body.querySelector("[data-dots]");
    if (dots) dots.classList.add("paired");
    else {
      const s = fmt(round.n);
      body.querySelector("[data-num]").innerHTML = `${round.before ? `<small>antes del ${fmt(round.shown)} va el</small>` : ""}${s.slice(0, -1)}<u class="pi-last">${s.slice(-1)}</u>`;
    }
    const fb = body.querySelector("[data-feedback]");
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      fb.innerHTML = `✓ ${round.answer.toUpperCase()}. 💡 ${round.hint}`;
      fb.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      fb.innerHTML = `Era ${round.answer.toUpperCase()}. 💡 ${round.hint} <button type="button" class="pi-next" data-next>Siguiente →</button>`;
      fb.className = "feedback bad";
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      fb.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "paresimpares", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔵🔵</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} números bien clasificados de ${rounds}</p>
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
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
  };
}
