// "Fracción de una cantidad": «Coge 3/4 de las 20 galletas». Se tocan
// galletas de la rejilla para marcarlas y ✓. Tras responder, la rejilla
// se reagrupa en 4 montones de 5 con 3 resaltados, y el 💡 cuenta:
// "20 ÷ 4 = 5 por parte; 3 partes = 15". En el último nivel el total
// solo se escribe ("2/3 de 90") y se contesta con el teclado.
import { randInt, pick, saveScore } from "./utils.js";

// Nivel → denominadores, numeradores y tamaño del total.
export function buildRound(stage) {
  let d, n, max;
  if (stage === 0) { d = pick([2, 4]); n = 1; max = 12; }
  else if (stage === 1) { d = pick([2, 3, 4, 5]); n = 1; max = 20; }
  else if (stage === 2) { d = pick([3, 4, 5]); n = randInt(2, d - 1); max = 24; }
  else if (stage === 3) { d = pick([3, 4, 5, 6, 8]); n = randInt(2, d - 1); max = 36; }
  else { d = pick([2, 3, 4, 5, 6, 8, 10]); n = randInt(1, d - 1); max = 100; }
  const per = randInt(2, Math.floor(max / d));
  const total = per * d;
  const answer = per * n;
  const hint = `${total} ÷ ${d} = ${per} por parte; ${n} parte${n > 1 ? "s" : ""} → ${n} × ${per} = ${answer}`;
  return { d, n, total, per, answer, hint, written: stage >= 4 };
}

export function mountGalletasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let busy = false;
  let round = null;
  let marked = [];
  let typed = "";
  let pending = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body ga-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const stage = () => Math.min(Math.floor(level / 3), 4);
  const frac = () => `<span class="ga-frac" data-frac="${round.n}/${round.d}"><b>${round.n}</b><i></i><b>${round.d}</b></span>`;

  function nextRound() {
    round = buildRound(stage());
    marked = Array(round.total).fill(false);
    typed = "";
    busy = false;
    if (round.written) {
      body.innerHTML = `
        <p class="prompt ga-prompt">${frac()} de <b data-total>${round.total}</b><small>Escribe cuánto es</small></p>
        <div class="keypad-display ga-display" data-display>&nbsp;</div>
        <div class="keypad ga-pad" data-keypad></div>
        <div class="feedback ga-feedback" data-feedback></div>
      `;
      const pad = body.querySelector("[data-keypad]");
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn keypad-key" + (key === "✓" ? " primary" : "");
        btn.textContent = key;
        btn.dataset.key = key;
        btn.addEventListener("click", () => pressKey(key));
        pad.appendChild(btn);
      });
      return;
    }
    body.innerHTML = `
      <p class="prompt ga-prompt">Coge ${frac()} de las <b data-total>${round.total}</b> galletas<small>Toca las galletas que coges</small></p>
      <div class="ga-grid" data-grid></div>
      <div class="ga-row"><span class="ga-count" data-count>0 marcadas</span><button type="button" class="primary ga-ok" data-ok>✓</button></div>
      <div class="feedback ga-feedback" data-feedback></div>
    `;
    const grid = body.querySelector("[data-grid]");
    grid.style.setProperty("--ga-cols", round.total <= 12 ? 4 : 6);
    marked.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ga-cookie";
      b.dataset.cookie = i;
      b.textContent = "🍪";
      b.addEventListener("click", () => {
        if (busy || finished) return;
        marked[i] = !marked[i];
        b.classList.toggle("on", marked[i]);
        const k = marked.filter(Boolean).length;
        body.querySelector("[data-count]").textContent = `${k} marcada${k === 1 ? "" : "s"}`;
      });
      grid.appendChild(b);
    });
    body.querySelector("[data-ok]").addEventListener("click", () => submit(marked.filter(Boolean).length));
  }

  function pressKey(key) {
    if (finished || busy || !round.written) return;
    if (key === "✓") return typed !== "" && submit(Number(typed));
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 3) typed += key;
    body.querySelector("[data-display]").textContent = typed || " ";
  }

  // Feedback visual: las galletas reagrupadas en d montones de `per`,
  // con los n primeros resaltados en verde.
  function showGroups() {
    const grid = body.querySelector("[data-grid]");
    if (!grid) return;
    grid.className = "ga-groups";
    grid.innerHTML = Array.from({ length: round.d }, (_, g) =>
      `<div class="ga-group ${g < round.n ? "hl" : ""}" data-group>${"<span>🍪</span>".repeat(round.per)}</div>`).join("");
  }

  function submit(value) {
    if (busy || finished) return;
    rounds++;
    busy = true;
    const fb = body.querySelector("[data-feedback]");
    const ok = value === round.answer;
    showGroups();
    if (ok) {
      score += 10;
      level++;
      renderScore();
      fb.className = "feedback ga-feedback ok";
      fb.textContent = `¡Bien! 💡 ${round.hint}`;
      pending = setTimeout(nextRound, 900);
      return;
    }
    lives--;
    renderLives();
    const disp = body.querySelector("[data-display]");
    if (disp) disp.innerHTML = `<s class="ga-wrong">${value}</s> <span class="ga-good">${round.answer}</span>`;
    fb.className = "feedback ga-feedback bad";
    fb.textContent = `${round.written ? "Has escrito" : "Has cogido"} ${value}, eran ${round.answer}. 💡 ${round.hint}`;
    pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
  }

  const onKey = (e) => {
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "galletas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🍪</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} fracciones bien cogidas de ${rounds}</p>
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
    window.removeEventListener("keydown", onKey);
  };
}
