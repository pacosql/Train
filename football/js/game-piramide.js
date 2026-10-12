// "Pirámide de sumas": la pirámide de ladrillos del cuaderno (3-4 pisos).
// Cada ladrillo es la suma (o el producto) de los dos de debajo; faltan
// algunos ladrillos (casillas sobre papel cuadriculado) y se rellenan con
// el teclado. El foco va en el orden en que se deducen en clase: primero
// los que salen sumando hacia arriba, luego los que salen restando hacia
// abajo. El 💡 enseña cada cuenta con los números de la ronda.
import { randInt, saveScore } from "./utils.js";

const fmt = (n) => (n >= 1000 ? `${Math.floor(n / 1000)}.${String(n % 1000).padStart(3, "0")}` : String(n));

// Pirámide completa a partir de la base: rows[0] es la base, el último piso es la cima.
function buildRows(base, op) {
  const rows = [base];
  while (rows[rows.length - 1].length > 1) {
    const p = rows[rows.length - 1];
    rows.push(p.slice(1).map((v, i) => (op === "×" ? p[i] * v : p[i] + v)));
  }
  return rows;
}

// Resuelve por propagación tríada a tríada (arriba, abajo-izq, abajo-der):
// si en una tríada solo falta un ladrillo, se deduce. Devuelve el orden de
// deducción o null si algún hueco no se puede deducir (ronda ambigua).
function solveOrder(rows, holes) {
  const known = rows.map((r, ri) => r.map((_, ci) => !holes.some(([hr, hc]) => hr === ri && hc === ci)));
  const order = [];
  for (let progress = true; progress; ) {
    progress = false;
    for (let ri = 1; ri < rows.length; ri++)
      for (let ci = 0; ci < rows[ri].length; ci++) {
        const trio = [[ri, ci], [ri - 1, ci], [ri - 1, ci + 1]];
        const unknown = trio.filter(([r, c]) => !known[r][c]);
        if (unknown.length !== 1) continue;
        known[unknown[0][0]][unknown[0][1]] = true;
        order.push({ r: unknown[0][0], c: unknown[0][1], trio });
        progress = true;
      }
  }
  return order.length === holes.length ? order : null;
}

// Niveles: 0 tres pisos (base dada) · 1 cuatro pisos · 2 huecos en la base
// (restar) · 3 pirámide de productos · 4 sumas hasta 1.000 · 5 cuatro pisos
// con huecos en la base y números hasta 1.000.
export function buildRound(level) {
  const op = level === 3 ? "×" : "+";
  const floors = level === 1 || level >= 4 ? 4 : 3;
  const [lo, hi] = level === 3 ? [1, 5] : level === 4 ? [20, 120] : level === 5 ? [50, 125] : level === 2 ? [2, 12] : [1, 9];
  const nHoles = level === 0 ? 3 : level === 5 ? 5 : level === 1 || level === 4 ? 4 : 3;
  for (;;) {
    const base = Array.from({ length: floors }, () => randInt(lo, hi));
    const rows = buildRows(base, op);
    const all = rows.flatMap((r, ri) => r.map((_, ci) => [ri, ci]));
    const upper = all.filter(([ri]) => ri > 0);
    const pool = level <= 1 ? upper : all;
    // Elegimos huecos al azar; en los niveles de "restar" exigimos al menos uno en la base.
    const holes = [];
    const bag = pool.slice();
    while (holes.length < nHoles && bag.length) holes.push(bag.splice(randInt(0, bag.length - 1), 1)[0]);
    if (level >= 2 && !holes.some(([ri]) => ri === 0)) continue;
    if (holes.length !== nHoles) continue;
    const order = solveOrder(rows, holes);
    if (!order) continue;
    const ups = [], downs = [];
    for (const { r, c, trio } of order) {
      const [[tr, tc], [lr, lc], [rr, rc]] = trio;
      const top = rows[tr][tc], left = rows[lr][lc], right = rows[rr][rc];
      if (r === tr) ups.push(`${fmt(left)} ${op} ${fmt(right)} = ${fmt(top)}`);
      else downs.push(`${fmt(top)} ${op === "×" ? "÷" : "−"} ${fmt(c === lc && r === lr ? right : left)} = ${fmt(rows[r][c])}`);
    }
    const upTxt = op === "×" ? "El ladrillo de arriba es el producto de los dos de abajo" : "El ladrillo de arriba es la suma de los dos de abajo";
    const downTxt = op === "×" ? "hacia abajo divido" : "hacia abajo resto";
    const hint = [ups.length ? `${upTxt}: ${ups.join(", ")}` : "", downs.length ? `${ups.length ? downTxt : downTxt[0].toUpperCase() + downTxt.slice(1)}: ${downs.join(", ")}` : ""]
      .filter(Boolean).join("; ");
    const slots = order.map(({ r, c }) => ({ r, c, value: rows[r][c] }));
    return { op, rows, slots, hint, floors };
  }
}

export function mountPiramideGame(container, { client, onExit }) {
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
    <div class="game-body py-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const slotIndex = (r, c) => round.slots.findIndex((s) => s.r === r && s.c === c);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(5, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    const brick = (ri, ci) => {
      const i = slotIndex(ri, ci);
      return i === -1
        ? `<span class="py-brick py-fixed">${fmt(round.rows[ri][ci])}</span>`
        : `<button type="button" class="py-brick py-slot" data-slot="${i}"></button>`;
    };
    const pisos = round.rows.map((r, ri) => `<div class="py-row">${r.map((_, ci) => brick(ri, ci)).join("")}</div>`).reverse();
    body.innerHTML = `
      <p class="prompt py-prompt">Cada ladrillo es ${round.op === "×" ? "el producto" : "la suma"} de los dos de debajo</p>
      <div class="py-cuaderno py-sheet">${pisos.join("")}</div>
      <div class="keypad py-keypad" data-keypad></div>
      <div class="feedback py-feedback" data-feedback></div>
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
      b.textContent = typed[i];
      b.classList.toggle("active", i === active);
    });
  }

  // Primer hueco vacío después del activo (en círculo), o -1 si está todo escrito.
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
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < 4) {
      typed[active] += key;
      // Con la casilla completa el foco salta solo al siguiente hueco.
      if (typed[active].length >= String(round.slots[active].value).length) {
        const e = nextEmpty();
        if (e !== -1) active = e;
      }
    }
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const i = +b.dataset.slot;
      const ok = Number(typed[i]) === round.slots[i].value;
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[i]}</s>${fmt(round.slots[i].value)}`;
    });
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
      feedback.innerHTML = `💡 ${round.hint}${lives > 0 ? ' <button type="button" class="secondary py-next" data-next>Siguiente →</button>' : ""}`;
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
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "piramide", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧱</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} pirámides completas de ${rounds}</p>
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
