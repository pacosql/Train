// "Simplifica": una fracción grande (12/18) y dos casillas, numerador y
// denominador, que se rellenan con el teclado (se toca la casilla; ✓ con
// el numerador puesto salta al denominador). Solo vale la fracción
// irreducible. Una barra pinta la fracción; al responder aparece debajo
// la barra de la simplificada, con la misma parte coloreada. El 💡:
// "Divido arriba y abajo entre 6 (el mayor divisor común): 12/18 = 2/3".
import { randInt, pick, saveScore } from "./utils.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// Niveles: 0 mcd 2 o 3 · 1 mcd hasta 5 · 2 números hasta 100 ·
// 3 igual, pero de vez en cuando la fracción ya es irreducible.
export function buildRound(level) {
  let a, b, k;
  for (;;) {
    if (level === 0) { b = randInt(2, 6); a = randInt(1, b - 1); k = pick([2, 3]); }
    else if (level === 1) { b = randInt(2, 9); a = randInt(1, b - 1); k = randInt(2, 5); }
    else { b = randInt(2, 12); a = randInt(1, b - 1); k = level === 3 && Math.random() < 0.3 ? 1 : randInt(2, Math.floor(100 / b)); }
    if (gcd(a, b) === 1 && k * b <= 100) break;
  }
  const n = a * k, d = b * k;
  const hint = k === 1
    ? `${n}/${d} no se puede simplificar: ${n} y ${d} no tienen divisores comunes (mcd 1)`
    : `Divido arriba y abajo entre ${k} (el mayor divisor común): ${n}/${d} = ${a}/${b}`;
  return { n, d, a, b, k, hint };
}

export function mountSimplificaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body sp-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  // Barra de fracción: d partes, n coloreadas (las marcas solo si caben).
  function bar(n, d, cls) {
    const W = 300, H = 26;
    const ticks = d <= 25 ? Array.from({ length: d - 1 }, (_, i) => `<line x1="${((i + 1) * W) / d}" y1="0" x2="${((i + 1) * W) / d}" y2="${H}"/>`).join("") : "";
    return `<svg class="sp-bar ${cls}" viewBox="0 0 ${W} ${H}"><rect class="sp-bg" width="${W}" height="${H}" rx="5"/><rect class="sp-fill" width="${(n * W) / d}" height="${H}" rx="5"/><g class="sp-ticks">${ticks}</g><rect class="sp-frame" width="${W}" height="${H}" rx="5"/></svg>`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 3)));
    typed = { a: "", b: "" };
    active = "a";
    busy = false;
    body.innerHTML = `
      <p class="prompt sp-prompt">Simplifica al máximo</p>
      <div class="sp-row">
        <div class="sp-frac"><span>${round.n}</span><span>${round.d}</span></div>
        <span class="sp-eq">=</span>
        <div class="sp-frac sp-answer">
          <button type="button" class="sp-slot" data-slot="a"></button>
          <button type="button" class="sp-slot" data-slot="b"></button>
        </div>
      </div>
      <div class="sp-bars">${bar(round.n, round.d, "")}<div data-bar2></div></div>
      <div class="keypad sp-keypad" data-keypad></div>
      <div class="feedback sp-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = b.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      b.textContent = typed[b.dataset.slot];
      b.classList.toggle("active", b.dataset.slot === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < 3) typed[active] += key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    // ✓ con una casilla vacía: el foco pasa a ella (como un Enter).
    const empty = ["a", "b"].find((k) => typed[k] === "");
    if (empty) {
      active = empty;
      paint();
      if (empty === "b" && typed.a !== "") return;
      feedback.textContent = "Escribe el numerador y el denominador";
      feedback.className = "feedback bad";
      return;
    }
    busy = true;
    rounds++;
    const a = Number(typed.a), b = Number(typed.b);
    const sameValue = b > 0 && a * round.d === round.n * b;
    const ok = a === round.a && b === round.b;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const k = s.dataset.slot;
      s.classList.remove("active");
      s.classList.add(ok ? "good" : "bad");
      if (!ok) s.innerHTML = `<s>${typed[k]}</s>${round[k]}`;
    });
    body.querySelector("[data-bar2]").innerHTML = bar(round.a, round.b, ok ? "good" : "bad");
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const why = sameValue ? `${a}/${b} vale lo mismo, pero aún se divide entre ${gcd(a, b)}. ` : "";
      feedback.textContent = `Era ${round.a}/${round.b}. ${why}💡 ${round.hint}`;
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
    saveScore(client, "simplifica", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🍰</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} fracciones simplificadas de ${rounds}</p>
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
