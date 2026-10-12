// "Trucos de cálculo mental": una cuenta en la hoja (26 × 5 = □) con un
// pósit que dice el truco ("Truco del 5"). Al responder se escriben debajo
// los pasos del truco con los números de la ronda (26 × 10 = 260 → 260 ÷ 2
// = 130). Niveles: × 5 y + 99 → × 9 y × 11 → ÷ 5 y × 25 → doblar y mitad →
// mezcla sin pista.
import { randInt, pick, saveScore } from "./utils.js";

export const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const NAME = { x5: "Truco del 5", p99: "Truco del 99", x9: "Truco del 9", x11: "Truco del 11", d5: "Truco del ÷ 5", x25: "Truco del 25", dm: "Doblar y mitad" };
const BY_LEVEL = [["x5", "p99"], ["x9", "x11"], ["d5", "x25"], ["dm"], Object.keys(NAME)];

// Devuelve la cuenta, el resultado, los pasos (cada uno "a op b = c") y el 💡.
export function buildRound(level) {
  const type = pick(BY_LEVEL[Math.min(level, 4)]);
  let a, b, op, ans, steps, rule;
  if (type === "x5") {
    a = randInt(12, level >= 4 ? 198 : 98), b = 5, op = "×", ans = a * 5;
    steps = [`${fmt(a)} × 10 = ${fmt(a * 10)}`, `${fmt(a * 10)} ÷ 2 = ${fmt(ans)}`], rule = "× 5 = × 10 y la mitad";
  } else if (type === "p99") {
    a = randInt(25, 899), b = 99, op = "+", ans = a + 99;
    steps = [`${a} + 100 = ${fmt(a + 100)}`, `${fmt(a + 100)} − 1 = ${fmt(ans)}`], rule = "+ 99 = + 100 − 1";
  } else if (type === "x9") {
    a = randInt(12, 99), b = 9, op = "×", ans = a * 9;
    steps = [`${a} × 10 = ${a * 10}`, `${a * 10} − ${a} = ${ans}`], rule = "× 9 = × 10 − el número";
  } else if (type === "x11") {
    a = randInt(12, 99), b = 11, op = "×", ans = a * 11;
    const [d, u] = [Math.floor(a / 10), a % 10], s = d + u;
    steps = [`${d} + ${u} = ${s}`, s < 10 ? `${d} (${s}) ${u} → ${ans}` : `${d} (${s}) ${u}: me llevo 1 → ${ans}`];
    rule = `× 11 = la suma de las cifras en medio`;
  } else if (type === "d5") {
    a = 5 * randInt(3, level >= 4 ? 199 : 99), b = 5, op = "÷", ans = a / 5;
    steps = [`${fmt(a)} × 2 = ${fmt(a * 2)}`, `${fmt(a * 2)} ÷ 10 = ${ans}`], rule = "÷ 5 = × 2 y ÷ 10";
  } else if (type === "x25") {
    a = Math.random() < 0.7 ? 4 * randInt(1, 12) : randInt(5, 40), b = 25, op = "×", ans = a * 25;
    steps = [`${a} × 100 = ${fmt(a * 100)}`, `${fmt(a * 100)} ÷ 4 = ${fmt(ans)}`], rule = "× 25 = × 100 y ÷ 4";
  } else {
    // Doblar y mitad: la mitad del par y el doble del otro dan una cuenta redonda.
    b = pick([5, 15, 25, 35, 50]);
    const maxA = { 5: 98, 15: 30, 25: 40, 35: 20, 50: 48 }[b];
    a = 2 * randInt(3, maxA / 2), op = "×", ans = a * b;
    steps = [`${a} × ${b} = ${a / 2} × ${b * 2}`, `${a / 2} × ${b * 2} = ${fmt(ans)}`], rule = `la mitad de ${a} y el doble de ${b}`;
  }
  // En × se puede escribir primero cualquiera de los dos factores.
  const swap = op === "×" && Math.random() < 0.3;
  const text = swap ? `${b} ${op} ${fmt(a)}` : `${fmt(a)} ${op} ${b}`;
  const hint = type === "dm"
    ? `Doblar y mitad (${rule}): ${a} × ${b} = ${a / 2} × ${b * 2} = ${fmt(ans)}`
    : `${rule}: ${steps.join(" → ")}`;
  return { level, type, a, b, op, ans, text, steps, name: level >= 4 ? null : NAME[type], hint };
}

export function mountTrucosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body tk-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.floor(hits / 3));
    typed = "";
    busy = false;
    body.innerHTML = `
      <p class="prompt tk-prompt">Calcula de cabeza</p>
      <div class="tk-cuaderno">
        <div class="tk-postit${round.name ? "" : " tk-nohint"}" data-postit>${round.name ? `💡 ${round.name}` : "¿Qué truco usarías?"}</div>
        <div class="tk-op"><span data-op>${round.text}</span> = <button type="button" class="tk-slot active" data-slot></button></div>
        <div class="tk-steps" data-steps></div>
      </div>
      <div class="keypad tk-keypad" data-keypad></div>
      <div class="feedback tk-feedback" data-feedback></div>
      <button type="button" class="secondary tk-next" data-next>Siguiente →</button>
    `;
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

  const paint = () => (body.querySelector("[data-slot]").textContent = typed ? fmt(typed) : "");

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 5) typed = (typed + key).replace(/^0+(?=\d)/, "");
    paint();
  }

  function check() {
    const fb = body.querySelector("[data-feedback]");
    if (typed === "") {
      fb.textContent = "Escribe el resultado";
      fb.className = "feedback tk-feedback bad";
      return;
    }
    busy = true;
    rounds++;
    const ok = Number(typed) === round.ans;
    const slotEl = body.querySelector("[data-slot]");
    slotEl.classList.remove("active");
    slotEl.classList.add(ok ? "good" : "bad");
    if (!ok) slotEl.innerHTML = `<s>${fmt(typed)}</s>${fmt(round.ans)}`;
    // Los pasos del truco se escriben en la hoja, uno debajo de otro.
    body.querySelector("[data-postit]").textContent = `💡 ${NAME[round.type]}`;
    body.querySelector("[data-steps]").innerHTML = round.steps
      .map((st, i) => `<div class="tk-step" style="animation-delay:${i * 180}ms">${i ? "→ " : ""}${st}</div>`)
      .join("");
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      fb.textContent = `✓ 💡 ${round.hint}`;
      fb.className = "feedback tk-feedback ok";
      pending = setTimeout(nextRound, 1300);
    } else {
      lives--;
      renderLives();
      fb.textContent = `✗ Era ${fmt(round.ans)}. 💡 ${round.hint}`;
      fb.className = "feedback tk-feedback bad";
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
    saveScore(client, "trucos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🪄</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cuentas de cabeza bien de ${rounds}</p>
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
