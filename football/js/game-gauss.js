// "La suma de Gauss": 1 + 2 + 3 + … + 20 = □ escrito en la hoja. Al
// responder se dibujan las parejas como hizo Gauss de niño (1 + 20, 2 + 19…)
// con arcos que suman siempre lo mismo. Niveles: hasta 10 → hasta 100 → la
// fórmula n · (n + 1) / 2 con casillas → pares o impares (2 + 4 + … + 20)
// → desde un número hasta otro (15 + 16 + … + 40).
import { randInt, pick, saveScore } from "./utils.js";

// Punto de los miles como en el cuaderno: 5050 → 5.050
export const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export function buildRound(level) {
  if (level >= 5) level = randInt(1, 4);
  let f = 1, s = 1, m;
  if (level === 0) m = randInt(5, 10);
  else if (level === 1) m = Math.random() < 0.6 ? 10 * randInt(2, 10) : randInt(12, 99);
  else if (level === 2) m = randInt(11, 99);
  else if (level === 3) (s = 2), (f = pick([1, 2])), (m = randInt(5, 15));
  else (f = randInt(5, 30)), (m = randInt(9, 41));
  const last = f + (m - 1) * s, pair = f + last, total = (m * pair) / 2;
  const terms = m <= 10 ? Array.from({ length: m }, (_, i) => f + i * s) : [f, f + s, f + 2 * s, "…", last];
  let hint;
  if (level === 2) {
    hint = `${m} · ${m + 1} / 2 = ${fmt(m * (m + 1))} / 2 = ${fmt(total)} (la mitad porque cada pareja sale dos veces)`;
  } else {
    const how = level >= 3 ? `Del ${f} al ${last}${s === 2 ? " de 2 en 2" : ""} hay ${m} números → ` : "";
    const p = Math.floor(m / 2);
    hint = m % 2 === 0
      ? `${how}${p} parejas que suman ${pair}: ${p} × ${pair} = ${fmt(total)}`
      : `${how}${p} parejas que suman ${pair} y sobra el ${pair / 2} del medio: ${p} × ${pair} + ${pair / 2} = ${fmt(total)}`;
  }
  return { level, f, s, m, last, pair, total, terms, ans: level === 2 ? [m, m + 1, total] : [total], hint };
}

// Fila de números con los arcos de las parejas (se dibujan al responder).
function pairsSVG(r, drawn) {
  const show = r.m <= 10 ? Array.from({ length: r.m }, (_, i) => r.f + i * r.s) : [0, 1, 2, 3].map((i) => r.f + i * r.s).concat(["…"], [3, 2, 1, 0].map((i) => r.last - i * r.s));
  const S = show.length, W = 340, x = (i) => 18 + (i * (W - 36)) / (S - 1), y = 104;
  const P = r.m <= 10 ? Math.floor(r.m / 2) : 4;
  let arcs = "";
  if (drawn)
    for (let i = 0; i < P; i++) {
      const a = x(i), b = x(S - 1 - i), h = 14 + 13 * (P - 1 - i), mid = (a + b) / 2;
      arcs += `<path class="ga2-arc" style="animation-delay:${i * 140}ms" d="M${a} ${y - 14} Q${mid} ${y - 14 - 2 * h} ${b} ${y - 14}"/>`;
      arcs += `<text class="ga2-alab" style="animation-delay:${i * 140 + 250}ms" x="${mid}" y="${y - 17 - h}">${r.pair}</text>`;
    }
  const chips = show.map((v, i) => {
    const middle = drawn && r.m <= 10 && r.m % 2 === 1 && i === (S - 1) / 2;
    return v === "…" ? `<text class="ga2-dots" x="${x(i)}" y="${y + 4}">…</text>`
      : `<circle class="ga2-chip${middle ? " ga2-mid" : ""}" cx="${x(i)}" cy="${y}" r="13"/><text class="ga2-num" x="${x(i)}" y="${y + 4}">${v}</text>`;
  }).join("");
  return `<svg class="ga2-svg" viewBox="0 0 ${W} 122" aria-hidden="true">${arcs}${chips}</svg>`;
}

export function mountGaussGame(container, { client, onExit }) {
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
    <div class="game-body ga2-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const slot = (i) => `<button type="button" class="ga2-slot" data-slot="${i}"></button>`;

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.floor(hits / 2));
    typed = round.ans.map(() => "");
    active = 0;
    busy = false;
    const expr = round.terms.map((t) => (t === "…" ? "…" : fmt(t))).join(" + ");
    const formula = round.level === 2
      ? `<div class="ga2-tpl"><i>n</i> · (<i>n</i> + 1) / 2</div><div class="ga2-line">= ${slot(0)} · ${slot(1)} / 2 = ${slot(2)}</div>`
      : "";
    body.innerHTML = `
      <p class="prompt ga2-prompt">Suma como Gauss</p>
      <div class="ga2-cuaderno">
        <div class="ga2-line ga2-expr" data-expr>${expr} =${round.level === 2 ? "" : ` ${slot(0)}`}</div>
        ${formula}
        <div class="ga2-pairs" data-pairs>${pairsSVG(round, false)}</div>
      </div>
      <div class="keypad ga2-keypad" data-keypad></div>
      <div class="feedback ga2-feedback" data-feedback></div>
      <button type="button" class="secondary ga2-next" data-next>Siguiente →</button>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
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
      const i = +b.dataset.slot;
      b.textContent = typed[i] ? fmt(typed[i]) : "";
      b.classList.toggle("active", i === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < 5) typed[active] = (typed[active] + key).replace(/^0+(?=\d)/, "");
    paint();
  }

  function check() {
    const fb = body.querySelector("[data-feedback]");
    // ✓ con casillas vacías: el foco pasa a la siguiente (de izquierda a derecha).
    if (typed.some((x) => x === "")) {
      const after = typed.findIndex((x, i) => x === "" && i > active);
      active = after >= 0 ? after : typed.indexOf("");
      paint();
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const i = +b.dataset.slot, want = round.ans[i];
      const ok = Number(typed[i]) === want;
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${fmt(typed[i])}</s>${fmt(want)}`;
    });
    body.querySelector("[data-pairs]").innerHTML = pairsSVG(round, true);
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      fb.textContent = `✓ 💡 ${round.hint}`;
      fb.className = "feedback ga2-feedback ok";
      pending = setTimeout(nextRound, 1500);
    } else {
      lives--;
      renderLives();
      fb.textContent = `✗ 💡 ${round.hint}`;
      fb.className = "feedback ga2-feedback bad";
      const nb = body.querySelector("[data-next]");
      nb.classList.add("show");
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      nb.onclick = go;
      pending = setTimeout(go, 3000);
    }
  }

  // Teclado físico: cifras, retroceso y Enter hacen lo mismo que el teclado en pantalla.
  const onKey = (e) => {
    if (finished) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
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
    if (userExited) return onExit();
    saveScore(client, "gauss", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧮</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} sumas de Gauss bien de ${rounds}</p>
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
