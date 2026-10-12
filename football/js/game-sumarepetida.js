// "Suma repetida y multiplicación": grupos iguales dibujados (3 cestas con
// 4 manzanas) y la línea del cuaderno "4 + 4 + 4 = □ × □ = □", que se
// rellena casilla a casilla de izquierda a derecha con el teclado. En la
// inversa se da el producto "3 × 4 = □ + □ + □ = □". El 💡 lee la cuenta
// como la profe: "3 veces 4 es 3 × 4 = 12".
import { randInt, pick, saveScore } from "./utils.js";

const SETS = [["cestas", "manzanas", "🍎"], ["cajas", "huevos", "🥚"], ["platos", "galletas", "🍪"], ["jarrones", "flores", "🌷"], ["bolsas", "caramelos", "🍬"], ["ramas", "pájaros", "🐦"], ["peceras", "peces", "🐟"]];

// Niveles: 0 hasta 3 grupos (de 2 a 5) · 1 hasta 5 grupos (de 2 a 9) ·
// 2 la inversa, del producto a la suma · 3 sin dibujo, en los dos sentidos.
export function buildRound(level) {
  const g = randInt(2, level === 0 ? 3 : 5), k = randInt(2, level === 0 ? 5 : 9);
  const dir = level === 2 ? "prod" : level === 3 ? pick(["sum", "prod"]) : "sum";
  const set = pick(SETS);
  const total = g * k;
  const addends = Array(g).fill(k).join(" + ");
  // Casillas en el orden en que se rellenan; "want" es lo que debe ir.
  const slots = dir === "sum"
    ? [{ id: "f1", want: g }, { id: "f2", want: k }, { id: "p", want: total }]
    : [...Array.from({ length: g }, (_, i) => ({ id: `a${i}`, want: k })), { id: "p", want: total }];
  const hint = dir === "sum"
    ? `${g} ${set[0]} con ${k} ${set[1]}: ${addends} = ${total}, y "${g} veces ${k}" se escribe ${g} × ${k} = ${total}`
    : `${g} × ${k} es "${g} veces ${k}": ${addends} = ${total}`;
  return { g, k, dir, draw: level < 3, set, total, slots, hint };
}

export function mountSumarepetidaGame(container, { client, onExit }) {
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
    <div class="game-body sr-body" data-body></div>
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

  const slot = (id) => `<button type="button" class="sr-slot" data-slot="${id}"></button>`;

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 3)));
    typed = Object.fromEntries(round.slots.map((s) => [s.id, ""]));
    active = round.slots[0].id;
    busy = false;
    const groups = round.draw
      ? `<div class="sr-groups${round.g === 5 ? " sr-five" : ""}">${Array.from({ length: round.g }, () =>
          `<div class="sr-group" data-group>${`<span class="sr-item">${round.set[2]}</span>`.repeat(round.k)}</div>`).join("")}</div>`
      : "";
    const line = round.dir === "sum"
      ? `${Array.from({ length: round.g }, () => `<span data-num>${round.k}</span>`).join('<span class="sr-op">+</span>')}
         <span class="sr-op">=</span>${slot("f1")}<span class="sr-op">×</span>${slot("f2")}<span class="sr-op">=</span>${slot("p")}`
      : `<span data-num>${round.g}</span><span class="sr-op">×</span><span data-num>${round.k}</span><span class="sr-op">=</span>
         ${Array.from({ length: round.g }, (_, i) => slot(`a${i}`)).join('<span class="sr-op">+</span>')}<span class="sr-op">=</span>${slot("p")}`;
    body.innerHTML = `
      <p class="prompt sr-prompt">${round.dir === "sum" ? "Suma repetida → multiplicación" : "Multiplicación → suma repetida"}</p>
      <div class="sr-cuaderno">
        ${groups}
        <div class="sr-line" data-line="${round.dir}">${line}</div>
      </div>
      <div class="keypad sr-keypad" data-keypad></div>
      <div class="feedback sr-feedback" data-feedback></div>
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

  // Los factores y sumandos son de una cifra; el producto, de dos: al
  // completar la casilla el foco salta solo a la siguiente vacía.
  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    const max = active === "p" ? 2 : 1;
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < max) {
      typed[active] += key;
      if (typed[active].length === max) {
        const next = round.slots.find((s) => typed[s.id] === "");
        if (next) active = next.id;
      }
    }
    paint();
  }

  function check() {
    const fb = body.querySelector("[data-feedback]");
    const empty = round.slots.find((s) => typed[s.id] === "");
    if (empty) {
      active = empty.id;
      paint();
      fb.textContent = "Faltan casillas por rellenar";
      fb.className = "feedback bad";
      return;
    }
    busy = true;
    rounds++;
    const v = (id) => Number(typed[id]);
    // Los dos factores valen en cualquier orden (3 × 4 o 4 × 3).
    const swapped = round.dir === "sum" && v("f1") === round.k && v("f2") === round.g && round.g !== round.k;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const id = b.dataset.slot;
      const want = round.slots.find((s) => s.id === id).want;
      const ok = swapped && id !== "p" ? true : v(id) === want;
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[id]}</s>${want}`;
    });
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      fb.innerHTML = `✓ ${round.g} × ${round.k} = ${round.total}. 💡 ${round.hint}`;
      fb.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      fb.innerHTML = `Era ${round.g} × ${round.k} = ${round.total}. 💡 ${round.hint} <button type="button" class="sr-next" data-next>Siguiente →</button>`;
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
    saveScore(client, "sumarepetida", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🍎🍎🍎</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} líneas completadas de ${rounds}</p>
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
