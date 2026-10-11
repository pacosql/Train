// "Toca los divisores": "Toca TODOS los divisores de 12" sobre una rejilla
// 1…N (N ≤ 36; para números mayores, 1…20 más el propio número). Cada
// número se marca/desmarca al tocarlo y ✓ comprueba que el conjunto sea
// exacto. En el nivel alto se alternan rondas de múltiplos ("Toca los
// MÚLTIPLOS de 7 hasta 50") sobre una rejilla 1…50 más pequeña. El 💡
// enseña las parejas 12 = 1×12 = 2×6 = 3×4 (o "es primo", o la tabla).
import { randInt, pick, saveScore } from "./utils.js";

const divisors = (n) => Array.from({ length: n }, (_, i) => i + 1).filter((k) => n % k === 0);
const isPrime = (n) => n > 1 && divisors(n).length === 2;
const COMPOSITE = Array.from({ length: 35 }, (_, i) => i + 2).filter((n) => !isPrime(n));
const PRIMES = Array.from({ length: 46 }, (_, i) => i + 2).filter(isPrime);

// Niveles: 0 números ≤ 12 · 1 ≤ 24 · 2 ≤ 36 · 3 primos · 4 alterna
// divisores (cualquier número) y múltiplos hasta 50.
export function buildRound(level, roundNo = 0) {
  if (level === 4 && roundNo % 2 === 1) {
    const k = randInt(2, 9);
    const answer = Array.from({ length: Math.floor(50 / k) }, (_, i) => k * (i + 1));
    return {
      kind: "multiplos", n: k, answer, cells: Array.from({ length: 50 }, (_, i) => i + 1), small: true,
      prompt: `Toca los <b>múltiplos</b> de <b>${k}</b> hasta 50`,
      hint: `Múltiplos de ${k}: la tabla del ${k} → ${answer.join(", ")}`,
    };
  }
  const n = level === 3 ? pick(PRIMES) : level === 4 ? pick([...COMPOSITE, ...PRIMES]) : pick(COMPOSITE.filter((c) => c <= 12 * (level + 1)));
  const answer = divisors(n);
  const cells = n <= 36 ? Array.from({ length: n }, (_, i) => i + 1) : [...Array.from({ length: 20 }, (_, i) => i + 1), n];
  const pairs = answer.filter((a) => a * a <= n).map((a) => `${a}×${n / a}`);
  const hint = isPrime(n)
    ? `${n} solo se divide entre 1 y ${n}: es primo`
    : `${n} = ${pairs.join(" = ")}: los divisores van en parejas`;
  return { kind: "divisores", n, answer, cells, small: false, prompt: `Toca <b>todos</b> los divisores de <b>${n}</b>`, hint };
}

export function mountDivisoresGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, picked, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body dv-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 3)), rounds);
    picked = new Set();
    busy = false;
    body.innerHTML = `
      <p class="prompt dv-prompt">${round.prompt}</p>
      <div class="dv-grid ${round.small ? "dv-small" : ""}" data-grid>${round.cells
        .map((c) => `<button type="button" class="dv-cell" data-cell="${c}">${c}</button>`)
        .join("")}</div>
      <button type="button" class="primary dv-check" data-check>✓ Comprobar</button>
      <div class="feedback dv-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-cell]").forEach((b) =>
      b.addEventListener("click", () => {
        if (busy) return;
        const v = +b.dataset.cell;
        picked.has(v) ? picked.delete(v) : picked.add(v);
        b.classList.toggle("on", picked.has(v));
      })
    );
    body.querySelector("[data-check]").addEventListener("click", check);
  }

  function check() {
    if (finished || busy) return;
    const feedback = body.querySelector("[data-feedback]");
    if (picked.size === 0) {
      feedback.textContent = "Toca al menos un número";
      feedback.className = "feedback bad";
      return;
    }
    busy = true;
    rounds++;
    const want = new Set(round.answer);
    let missing = 0, extra = 0;
    // Al fallar: los que faltan en verde, los sobrantes en rojo.
    body.querySelectorAll("[data-cell]").forEach((b) => {
      const v = +b.dataset.cell;
      if (want.has(v) && !picked.has(v)) { b.classList.add("miss"); missing++; }
      else if (!want.has(v) && picked.has(v)) { b.classList.add("extra"); extra++; }
      else if (want.has(v)) b.classList.add("good");
    });
    body.querySelector("[data-check]").disabled = true;
    if (!missing && !extra) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const parts = [];
      if (missing) parts.push(`falta${missing > 1 ? "n" : ""} ${missing}`);
      if (extra) parts.push(`sobra${extra > 1 ? "n" : ""} ${extra}`);
      feedback.textContent = `✗ ${parts.join(" y ")}. 💡 ${round.hint}`;
      feedback.className = "feedback bad";
      pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "divisores", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔢</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} conjuntos exactos de ${rounds}</p>
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
  };
}
