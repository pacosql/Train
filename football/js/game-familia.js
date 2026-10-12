// "La familia de operaciones": el triángulo del cuaderno con el total
// arriba (7) y las dos partes abajo (3 y 4), y a su lado las cuatro
// igualdades de la familia con casillas: 3 + 4 = □ · 4 + 3 = □ · 7 − 3 = □
// · 7 − □ = 3. Se rellenan de arriba abajo con el teclado. El 💡: "con 3,
// 4 y 7 se hacen dos sumas y dos restas: la resta deshace la suma".
import { randInt, saveScore } from "./utils.js";

// Niveles: 0 sumas hasta 10 · 1 hasta 20 · 2 familia de × y : (3, 4, 12) ·
// 3 sumas hasta 100. Cada línea tiene como mucho un hueco; de 2 a 4 líneas
// con hueco por ronda (más huecos al subir de nivel).
export function buildRound(level) {
  const mul = level === 2;
  let a, b;
  for (;;) {
    if (level === 0) { a = randInt(1, 9); b = randInt(1, 9); if (a + b > 10) continue; }
    else if (level === 1) { a = randInt(2, 18); b = randInt(2, 18); if (a + b > 20 || a + b <= 10) continue; }
    else if (mul) { a = randInt(2, 9); b = randInt(2, 9); }
    else { a = randInt(11, 89); b = randInt(11, 89); if (a + b > 100) continue; }
    if (a !== b) break;
  }
  const c = mul ? a * b : a + b;
  const [op, inv] = mul ? ["×", ":"] : ["+", "−"];
  // Cada línea: [x, op, y, z] con x op y = z.
  const lines = [[a, op, b, c], [b, op, a, c], [c, inv, a, b], [c, inv, b, a]];
  const count = Math.min(4, 2 + level);
  const blanked = new Set();
  while (blanked.size < count) blanked.add(randInt(0, 3));
  // El hueco en las sumas suele ser el resultado; en las restas, cualquiera.
  const rows = lines.map((l, i) => ({ nums: [l[0], l[2], l[3]], op: l[1], blank: blanked.has(i) ? (i < 2 && Math.random() < 0.6 ? 2 : randInt(0, 2)) : -1 }));
  const kind = mul ? ["multiplicaciones", "divisiones", "la división deshace la multiplicación"] : ["sumas", "restas", "la resta deshace la suma"];
  const hint = `Con ${a}, ${b} y ${c} se hacen dos ${kind[0]} y dos ${kind[1]}: ${lines.map((l) => `${l[0]} ${l[1]} ${l[2]} = ${l[3]}`).join(", ")}. ${kind[2][0].toUpperCase()}${kind[2].slice(1)}.`;
  return { a, b, c, mul, rows, hint };
}

export function mountFamiliaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, slots, typed, active, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body fa-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const onKey = (e) => {
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  };
  window.addEventListener("keydown", onKey);

  // El triángulo: total arriba (acento), partes abajo, el signo en medio.
  const triangle = (r) => `
    <svg class="fa-tri" viewBox="0 0 118 108" aria-hidden="true">
      <path d="M59 14 L108 94 L10 94 Z"/>
      <text class="fa-top" x="59" y="34">${r.c}</text>
      <text x="30" y="80">${r.a}</text><text x="88" y="80">${r.b}</text>
      <text class="fa-sign" x="59" y="68">${r.mul ? "×" : "+"}</text>
    </svg>`;

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 3)));
    slots = round.rows.flatMap((r, i) => (r.blank >= 0 ? [{ id: `${i}`, want: r.nums[r.blank] }] : []));
    typed = Object.fromEntries(slots.map((s) => [s.id, ""]));
    active = slots[0].id;
    busy = false;
    const cell = (r, i, pos) => (r.blank === pos
      ? `<button type="button" class="fa-slot" data-slot="${i}"></button>`
      : `<span class="fa-fix" data-fix>${r.nums[pos]}</span>`);
    body.innerHTML = `
      <p class="prompt fa-prompt">Completa la familia de ${round.a}, ${round.b} y ${round.c}</p>
      <div class="fa-cuaderno">
        <div class="fa-wrap">
          ${triangle(round)}
          <div class="fa-lines">${round.rows.map((r, i) =>
            `<div class="fa-row" data-row="${i}">${cell(r, i, 0)}<span class="fa-op">${r.op}</span>${cell(r, i, 1)}<span class="fa-op">=</span>${cell(r, i, 2)}</div>`).join("")}
          </div>
        </div>
      </div>
      <div class="keypad fa-keypad" data-keypad></div>
      <div class="feedback fa-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = b.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
      btn.dataset.key = key;
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

  // Cuando la casilla tiene tantas cifras como el número que falta, el
  // foco baja solo a la siguiente vacía (de arriba abajo, como en clase).
  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    const max = String(slots.find((s) => s.id === active).want).length;
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < max) {
      typed[active] += key;
      if (typed[active].length === max) {
        const next = slots.find((s) => typed[s.id] === "");
        if (next) active = next.id;
      }
    }
    paint();
  }

  function check() {
    const fb = body.querySelector("[data-feedback]");
    const empty = slots.find((s) => typed[s.id] === "");
    if (empty) {
      active = empty.id;
      paint();
      fb.textContent = "Faltan casillas por rellenar";
      fb.className = "feedback bad";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const id = b.dataset.slot;
      const want = slots.find((s) => s.id === id).want;
      const ok = Number(typed[id]) === want;
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[id]}</s>${want}`;
    });
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      fb.innerHTML = `✓ 💡 ${round.hint}`;
      fb.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      fb.innerHTML = `💡 ${round.hint} <button type="button" class="fa-next" data-next>Siguiente →</button>`;
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
    saveScore(client, "familia", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔺</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} familias completas de ${rounds}</p>
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
