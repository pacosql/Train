// "¿Es divisible?": un número grande y la pregunta "¿234 es divisible entre
// 3?" con dos botones SÍ / NO (verdadero/falso con tiempo, como "Semáforo").
// Una barra de 6 s se vacía despacio; si se agota cuenta como fallo. Tras
// responder, el 💡 aplica el criterio de divisibilidad con las cifras de ese
// número ("2 + 3 + 4 = 9, y 9 es múltiplo de 3 → sí"). Lleva racha.
import { randInt, pick, saveScore } from "./utils.js";

const LEVELS = [[2, 5, 10], [3], [9, 6], [4, 25], [11]];
const TIME = 6000;
const digitsOf = (n) => String(n).split("").map(Number);
const pad2 = (n) => String(n).padStart(2, "0");
const SI = (yes) => (yes ? "sí" : "no");

// El criterio del libro, dicho con las cifras del número de la ronda.
export function explain(n, d) {
  const yes = n % d === 0, ds = digitsOf(n), last = n % 10, last2 = n % 100;
  const sum = ds.reduce((a, b) => a + b, 0), sumStr = `${ds.join(" + ")} = ${sum}`;
  if (d === 2) return `Termina en ${last}, que es ${yes ? "par" : "impar"} → ${SI(yes)} es divisible entre 2`;
  if (d === 5) return yes ? `Termina en ${last} (en 0 o en 5) → sí es divisible entre 5` : `Termina en ${last}, no en 0 ni en 5 → no es divisible entre 5`;
  if (d === 10) return yes ? `Termina en 0 → sí es divisible entre 10` : `Termina en ${last}, no en 0 → no es divisible entre 10`;
  if (d === 3 || d === 9) return `Sumo las cifras: ${sumStr}, y ${sum} ${yes ? "es" : "no es"} múltiplo de ${d} → ${SI(yes)}`;
  if (d === 6) {
    if (last % 2) return `Termina en ${last}, es impar: no es divisible entre 2, así que tampoco entre 6 → no`;
    return `Es par y sumo las cifras: ${sumStr}, ${sum} ${yes ? "es múltiplo de 3 → divisible entre 2 y entre 3 → sí" : "no es múltiplo de 3 → no"}`;
  }
  if (d === 4) return `Miro las dos últimas cifras, ${pad2(last2)}: ${yes ? `4 × ${last2 / 4} = ${last2}, múltiplo de 4 → sí` : `4 × ${Math.floor(last2 / 4)} = ${last2 - (last2 % 4)} y sobra ${last2 % 4}, no es múltiplo de 4 → no`}`;
  if (d === 25) return `Miro las dos últimas cifras, ${pad2(last2)}: ${yes ? "es 00, 25, 50 o 75 → sí" : "no es 00, 25, 50 ni 75 → no"}`;
  // 11: suma alterna de cifras (lugares impares menos pares, desde la derecha)
  const rev = ds.slice().reverse(), odd = rev.filter((_, i) => i % 2 === 0), even = rev.filter((_, i) => i % 2 === 1);
  const A = odd.reduce((a, b) => a + b, 0), B = even.reduce((a, b) => a + b, 0), diff = Math.abs(A - B);
  return `Cifras en lugar impar (desde la derecha): ${odd.join(" + ")} = ${A}; en lugar par: ${even.join(" + ")} = ${B}; la diferencia es ${diff}, ${yes ? `${diff === 0 ? "0" : "múltiplo de 11"} → sí` : "no es 0 ni múltiplo de 11 → no"}`;
}

// Niveles: 0 entre 2, 5 y 10 · 1 entre 3 · 2 entre 9 y 6 · 3 entre 4 y 25 ·
// 4 entre 11. La mitad de las rondas son divisibles.
export function buildRound(level) {
  const L = Math.min(4, level);
  const d = pick(LEVELS[L]);
  const digits = L === 0 ? pick([2, 3]) : L === 1 ? 3 : pick([3, 4]);
  const lo = 10 ** (digits - 1), hi = 10 ** digits - 1;
  let n;
  if (Math.random() < 0.5) n = randInt(Math.ceil(lo / d), Math.floor(hi / d)) * d;
  else do n = randInt(lo, hi); while (n % d === 0);
  return { n, d, yes: n % d === 0, hint: explain(n, d), level: L };
}

export function mountDivisibleGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, streak, best, finished = false, pending = null, raf = null;
  let round, busy, t0;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body dv2-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.floor(hits / 2));
    busy = false;
    body.innerHTML = `
      <p class="prompt dv2-prompt">¿<b>${round.n}</b> es divisible entre <b>${round.d}</b>?</p>
      <div class="dv2-cuaderno">
        <div class="dv2-num">${round.n}</div>
        <div class="dv2-crit">÷ ${round.d}</div>
      </div>
      <div class="dv2-bar"><div class="dv2-bar-fill" data-bar></div></div>
      <div class="dv2-buttons">
        <button type="button" class="dv2-btn dv2-yes" data-yes>SÍ</button>
        <button type="button" class="dv2-btn dv2-no" data-no>NO</button>
      </div>
      <div class="dv2-streak" data-streak>${streak ? `🔥 Racha: ${streak}` : "&nbsp;"}</div>
      <div class="feedback dv2-feedback" data-feedback></div>
    `;
    body.querySelector("[data-yes]").addEventListener("click", () => answer(true));
    body.querySelector("[data-no]").addEventListener("click", () => answer(false));
    t0 = performance.now();
    tick();
  }

  // La barra se vacía en 6 s; al llegar a cero la ronda cuenta como fallo.
  function tick() {
    if (finished || busy) return;
    const left = Math.max(0, 1 - (performance.now() - t0) / TIME);
    const bar = body.querySelector("[data-bar]");
    if (bar) {
      bar.style.width = `${left * 100}%`;
      bar.classList.toggle("dv2-low", left < 0.3);
    }
    if (left <= 0) return answer(null);
    raf = requestAnimationFrame(tick);
  }

  function answer(said) {
    if (finished || busy) return;
    busy = true;
    cancelAnimationFrame(raf);
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const yesBtn = body.querySelector("[data-yes]"), noBtn = body.querySelector("[data-no]");
    yesBtn.disabled = noBtn.disabled = true;
    (round.yes ? yesBtn : noBtn).classList.add("good");
    if (said !== null && said !== round.yes) (said ? yesBtn : noBtn).classList.add("bad");
    if (said === round.yes) {
      score += 10;
      hits++;
      streak++;
      best = Math.max(best, streak);
      renderScore();
      body.querySelector("[data-streak]").textContent = `🔥 Racha: ${streak}`;
      feedback.textContent = `✓ ${round.yes ? "Sí" : "No"}. 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      streak = 0;
      renderLives();
      const head = said === null ? "⏱ Se acabó el tiempo. " : "";
      feedback.innerHTML = `${head}Era ${round.yes ? "SÍ" : "NO"}. 💡 ${round.hint} <button type="button" class="primary dv2-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad";
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  // Teclado físico: S / N (o flechas ← →).
  const onKey = (e) => {
    const k = e.key.toLowerCase();
    if (k === "s" || k === "arrowleft") answer(true);
    else if (k === "n" || k === "arrowright") answer(false);
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    cancelAnimationFrame(raf);
    if (userExited) return onExit();
    saveScore(client, "divisible", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔍</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} aciertos de ${rounds} · mejor racha 🔥 ${best}</p>
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
    streak = 0;
    best = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimeout(pending);
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey);
  };
}
