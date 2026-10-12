// "La rueda de operaciones": la rueda del cuaderno. En el centro la
// operación ("× 7", "+ 25", "− 9", "÷ 4"), un anillo interior con 8
// números y el anillo exterior con casillas; cada número del anillo pasa
// por el centro y sale fuera. Se tocan las casillas y se escriben con el
// teclado; el foco avanza en sentido horario. En el último nivel el
// centro está oculto y hay que deducir la operación (signo tocando, número
// con el teclado). El 💡 enseña cada paso con los números de la ronda.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const SIGNS = ["+", "−", "×", "÷"];
const fmt = (n) => String(Math.round(n * 10) / 10).replace(".", ",");
const apply = (op, a, k) => Math.round((op === "+" ? a + k : op === "−" ? a - k : op === "×" ? a * k : a / k) * 10) / 10;
const distinct = (n, lo, hi) => shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, n);

// Niveles: 0 sumas y restas hasta 20 · 1 tablas de multiplicar · 2 divisiones
// exactas · 3 decimales (× 10, + 0,5) · 4 centro oculto: ¿qué hace la rueda?
export function buildRound(level) {
  let op, k, inner;
  const kind = level === 4 ? randInt(0, 2) : level;
  if (kind === 0) {
    op = pick(["+", "−"]);
    k = randInt(2, 9);
    inner = op === "+" ? distinct(8, 1, 20 - k) : distinct(8, k + 1, 20); // sin resultados 0
  } else if (kind === 1) {
    op = "×";
    k = randInt(2, 9);
    inner = distinct(8, 1, 10);
  } else if (kind === 2) {
    op = "÷";
    k = randInt(2, 9);
    inner = distinct(8, 1, 10).map((m) => m * k);
  } else if (Math.random() < 0.5) {
    op = "×";
    k = 10;
    inner = distinct(8, 1, 99).map((m) => m / 10); // 2,5 → 25
  } else {
    op = "+";
    k = 0.5;
    inner = distinct(8, 1, 19);
  }
  const outer = inner.map((a) => apply(op, a, k));
  // Huecos: 4 casillas del anillo exterior (en orden horario) o el centro.
  const holes = level === 4 ? [] : shuffle([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 4).sort((a, b) => a - b);
  const verb = { "+": `todos suben ${fmt(k)}`, "−": `todos bajan ${fmt(k)}`, "×": `todos se multiplican por ${fmt(k)}`, "÷": `todos se dividen entre ${fmt(k)}` }[op];
  const hint =
    level === 4
      ? `De ${fmt(inner[0])} sale ${fmt(outer[0])} y de ${fmt(inner[1])} sale ${fmt(outer[1])}: ${verb} → ${op} ${fmt(k)}`
      : `Cada número del anillo pasa por el centro: ${holes.map((i) => `${fmt(inner[i])} ${op} ${fmt(k)} = ${fmt(outer[i])}`).join(", ")}`;
  return { op, k, inner, outer, holes, hidden: level === 4, hint };
}

export function mountRuedaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy, fresh, sign;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body ru-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  // Valores esperados de cada casilla, en el orden del foco.
  const expected = () => (round.hidden ? [round.k] : round.holes.map((i) => round.outer[i]));

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = expected().map(() => "");
    active = 0;
    busy = false;
    fresh = false;
    sign = "+";
    // Posiciones en la rueda: 8 radios en sentido horario empezando arriba.
    const pos = (i, r) => {
      const a = (-90 + 45 * i) * (Math.PI / 180);
      return `style="left:${150 + r * Math.cos(a)}px;top:${150 + r * Math.sin(a)}px"`;
    };
    const outerCell = (i) => {
      const h = round.holes.indexOf(i);
      return h === -1
        ? `<span class="ru-cell ru-outer ru-fixed" ${pos(i, 120)}>${fmt(round.outer[i])}</span>`
        : `<button type="button" class="ru-cell ru-outer ru-slot" data-slot="${h}" ${pos(i, 120)}></button>`;
    };
    const center = round.hidden
      ? `<button type="button" class="ru-sign" data-sign>${sign}</button><button type="button" class="ru-cell ru-slot ru-center-slot" data-slot="0"></button>`
      : `<span class="ru-op">${round.op} ${fmt(round.k)}</span>`;
    body.innerHTML = `
      <p class="prompt ru-prompt">${round.hidden ? "¿Qué operación hace la rueda?" : "Pasa cada número por el centro"}</p>
      <div class="ru-cuaderno ru-sheet">
        <div class="ru-wheel">
          <div class="ru-ring ru-ring-out"></div>
          <div class="ru-ring ru-ring-in"></div>
          <div class="ru-center">${center}</div>
          ${round.inner.map((v, i) => `<span class="ru-cell ru-inner" ${pos(i, 76)}>${fmt(v)}</span>`).join("")}
          ${round.inner.map((_, i) => outerCell(i)).join("")}
        </div>
      </div>
      <div class="keypad ru-keypad" data-keypad></div>
      <div class="feedback ru-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), (fresh = true), paint())));
    // El signo del centro se elige tocando: + → − → × → ÷.
    body.querySelector("[data-sign]")?.addEventListener("click", (e) => {
      if (busy) return;
      sign = SIGNS[(SIGNS.indexOf(sign) + 1) % 4];
      e.currentTarget.textContent = sign;
    });
    const pad = body.querySelector("[data-keypad]");
    // La coma solo aparece en el nivel de decimales.
    round.dec = (round.op === "×" && round.k === 10) || round.k === 0.5;
    const keys = round.dec ? ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫", "✓"] : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"];
    keys.forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}${keys.length === 13 && key === "✓" ? " ru-wide" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const i = +b.dataset.slot;
      b.textContent = typed[i];
      b.classList.toggle("active", i === active);
    });
  }

  function nextEmpty() {
    for (let k = 1; k <= typed.length; k++) if (typed[(active + k) % typed.length] === "") return (active + k) % typed.length;
    return -1;
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") {
      const e = typed[active] === "" ? active : nextEmpty();
      if (e === -1) return check();
      active = e;
      paint();
      const fb = body.querySelector("[data-feedback]");
      fb.textContent = "Faltan casillas por rellenar";
      fb.className = "feedback bad";
      return;
    }
    if (key === "⌫") (typed[active] = typed[active].slice(0, -1)), (fresh = false);
    else if (key === "," ? !fresh && !typed[active].includes(",") && typed[active] !== "" : fresh || typed[active].length < 4) {
      // Tras tocar una casilla (o saltar a ella) la primera cifra sustituye a lo escrito.
      typed[active] = (fresh ? "" : typed[active]) + key;
      fresh = false;
      if (typed[active].length >= fmt(expected()[active]).length) {
        const e = nextEmpty();
        if (e !== -1) active = e;
      }
    }
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    const want = expected();
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const i = +b.dataset.slot;
      const ok = Math.abs(Number(typed[i].replace(",", ".")) - want[i]) < 1e-9;
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[i]}</s><b>${fmt(want[i])}</b>`;
    });
    const signBtn = body.querySelector("[data-sign]");
    if (signBtn) {
      const ok = sign === round.op;
      allOk = allOk && ok;
      signBtn.classList.add(ok ? "good" : "bad");
      if (!ok) signBtn.innerHTML = `<s>${sign}</s><b>${round.op}</b>`;
    }
    const feedback = body.querySelector("[data-feedback]");
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.innerHTML = `💡 ${round.hint}${lives > 0 ? ' <button type="button" class="secondary ru-next" data-next>Siguiente →</button>' : ""}`;
      feedback.className = "feedback bad";
      feedback.querySelector("[data-next]")?.addEventListener("click", () => (clearTimeout(pending), nextRound()));
      pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2500);
    }
  }

  const onKey = (e) => {
    if (finished) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else if ((e.key === "," || e.key === ".") && round.dec) pressKey(",");
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "rueda", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎡</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} ruedas completas de ${rounds}</p>
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
