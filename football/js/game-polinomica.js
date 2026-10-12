// "Descomposición polinómica": la línea del cuaderno "3.482 = 3.000 + 400 +
// 80 + 2" escrita sobre papel cuadriculado, con una casilla por sumando que
// se rellena con el teclado (✓ o Enter salta a la siguiente, de izquierda a
// derecha como se escribe). En el nivel alto se escribe "3 × 1.000 + 4 × 100
// + 8 × 10 + 2 × 1" (una cifra por casilla, el foco avanza solo) y al final
// la inversa desordenada "50 + 6.000 + 3 = □". El 💡 dice en qué posición
// está la cifra y cuánto vale.
import { randInt, shuffle, saveScore } from "./utils.js";

const NAMES = ["unidades", "decenas", "centenas", "unidades de millar", "decenas de millar"];
// 3482 → "3.482" (punto de miles español)
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
// Cifras de menor a mayor: 3482 → [2, 8, 4, 3]
const digitsOf = (n) => String(n).split("").map(Number).reverse();

// Niveles: 0 dos o tres cifras · 1 cuatro cifras sin ceros · 2 con algún
// cero (6.053) · 3 forma "× potencias de 10" · 4 inversa con los sumandos
// desordenados (hasta cinco cifras).
export function buildRound(level) {
  let n, ds;
  for (;;) {
    n = level === 0 ? randInt(21, 999) : randInt(1001, level === 4 ? 99999 : 9999);
    ds = digitsOf(n);
    const zeros = ds.filter((d) => d === 0).length;
    if (ds.length - zeros < 2) continue; // 3.000 = 3.000 no enseña nada
    if (level === 1 && zeros) continue;
    if (level === 2 && !zeros) continue;
    if (level === 4 && ds.length - zeros < 3) continue; // hace falta algo que desordenar
    break;
  }
  const kind = level === 3 ? "factores" : level === 4 ? "inversa" : "suma";
  // Sumandos de mayor a menor, sin los ceros: [{d, i, v}]
  const terms = ds.map((d, i) => ({ d, i, v: d * 10 ** i })).filter((t) => t.d).reverse();
  const valueHint = (t) => `El ${t.d} está en las ${NAMES[t.i]}: vale ${t.d} × ${fmt(10 ** t.i)} = ${fmt(t.v)}`;
  const ordered = terms.map((t) => fmt(t.v)).join(" + ");
  const zero = ds.map((d, i) => ({ d, i })).find((t) => !t.d);
  let slots, shown, hint;
  if (kind === "suma") {
    shown = fmt(n);
    slots = terms.map((t) => ({ answer: t.v, hint: valueHint(t) }));
    hint = zero ? `El 0 de las ${NAMES[zero.i]} no vale nada: ese sumando no se escribe. ${fmt(n)} = ${ordered}` : valueHint(terms[1]);
  } else if (kind === "factores") {
    shown = fmt(n);
    // Todas las posiciones, también las que valen 0: el 0 guarda el sitio
    slots = ds.map((d, i) => ({ d, i })).reverse().map(({ d, i }) => ({
      answer: d, mult: fmt(10 ** i),
      hint: d ? valueHint({ d, i, v: d * 10 ** i }) : `En las ${NAMES[i]} no hay nada: 0 × ${fmt(10 ** i)} = 0, pero el 0 guarda el sitio`,
    }));
    hint = `Cada cifra por lo que vale su sitio: ${terms.map((t) => `${t.d} × ${fmt(10 ** t.i)}`).join(" + ")} = ${fmt(n)}`;
  } else {
    shown = shuffle(terms.map((t) => fmt(t.v))).join(" + ");
    hint = `Ordeno de mayor a menor: ${ordered}` + (zero ? `; no hay ${NAMES[zero.i]}, así que pongo un 0 en su sitio: ${fmt(n)}` : ` = ${fmt(n)}`);
    slots = [{ answer: n, hint }];
  }
  return { kind, n, terms, shown, slots, hint };
}

export function mountPolinomicaGame(container, { client, onExit }) {
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
    <div class="game-body pn-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  // Teclado físico: cifras, Retroceso y Enter hacen lo mismo que el teclado en pantalla.
  function onKeyDown(e) {
    const k = e.key === "Enter" ? "✓" : e.key === "Backspace" ? "⌫" : e.key;
    if (!/^[0-9]$/.test(k) && k !== "✓" && k !== "⌫") return;
    e.preventDefault();
    pressKey(k);
  }
  window.addEventListener("keydown", onKeyDown);

  function line() {
    const slot = (k, cls) => `<button type="button" class="pn-slot ${cls}" data-slot="${k}"></button>`;
    const plus = (k) => (k ? '<span class="pn-op">+</span>' : "");
    const head = `<span class="pn-num">${round.shown}</span><span class="pn-op">=</span>`;
    if (round.kind === "suma") return head + round.slots.map((_, k) => plus(k) + slot(k, "pn-wide")).join("");
    if (round.kind === "factores") return head + round.slots.map((s, k) => `${plus(k)}<span class="pn-term">${slot(k, "pn-digit")}<span class="pn-x">× ${s.mult}</span></span>`).join("");
    return head + slot(0, "pn-wide");
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    const prompt = round.kind === "suma" ? "Descompón el número" : round.kind === "factores" ? "Descompón con potencias de 10" : "¿Qué número es?";
    body.innerHTML = `
      <p class="prompt pn-prompt">${prompt}</p>
      <div class="pn-cuaderno"><div class="pn-line">${line()}</div></div>
      <div class="keypad pn-keypad" data-keypad></div>
      <div class="feedback pn-feedback" data-feedback></div>
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
    body.querySelectorAll("[data-slot]").forEach((b, k) => {
      b.textContent = typed[k] ? fmt(typed[k]) : "";
      b.classList.toggle("active", k === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") {
      if (typed[active] === "" && active > 0) active--;
      typed[active] = typed[active].slice(0, -1);
    } else if (round.kind === "factores") {
      // Una cifra por casilla: el foco avanza solo hacia la derecha
      typed[active] = key;
      if (active < typed.length - 1) active++;
    } else if (typed[active].length < 5) typed[active] += key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const empty = typed.findIndex((t) => t === "");
    if (empty !== -1) {
      // ✓ con la casilla actual escrita: salta al siguiente hueco (como un Enter)
      const silent = typed[active] !== "";
      active = empty;
      paint();
      if (!silent) { feedback.textContent = "Faltan casillas por rellenar"; feedback.className = "feedback bad"; }
      return;
    }
    busy = true;
    rounds++;
    let firstBad = -1;
    body.querySelectorAll("[data-slot]").forEach((b, k) => {
      const ok = Number(typed[k]) === round.slots[k].answer;
      if (!ok && firstBad === -1) firstBad = k;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${fmt(typed[k])}</s><b>${fmt(round.slots[k].answer)}</b>`;
    });
    if (firstBad === -1) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.innerHTML = `💡 ${round.slots[firstBad].hint} <button type="button" class="primary pn-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad";
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.querySelector("[data-next]").addEventListener("click", go);
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
    saveScore(client, "polinomica", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔢</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} descomposiciones bien de ${rounds}</p>
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
    window.removeEventListener("keydown", onKeyDown);
  };
}
