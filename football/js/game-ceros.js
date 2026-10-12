// "Por 10, 100 y 1.000": la línea del cuaderno "47 × 100 = □" o
// "3.500 ÷ 10 = □" con números naturales, sobre papel cuadriculado. Se
// toca la casilla y se escribe el resultado con el teclado (✓ o Enter).
// Al corregir aparece debajo la cuenta "hecha": los ceros que se añaden
// (al multiplicar) o se quitan (al dividir) resaltados en verde. En el
// nivel alto también "23 × □ = 23.000": ¿por cuánto he multiplicado?
import { randInt, pick, saveScore } from "./utils.js";

// 3500 → "3.500" (punto de miles español)
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const ZEROS = ["", "un cero", "dos ceros", "tres ceros"];
// Cuántos ceros tiene la potencia: 1000 → 3
const zerosOf = (p) => String(p).length - 1;

// Niveles: 0 × 10 · 1 × 100 y × 1.000 · 2 ÷ 10, ÷ 100 y ÷ 1.000 (exactas)
// · 3 mezcla, a veces con el número que falta ("23 × □ = 23.000").
export function buildRound(level) {
  const op = level <= 1 ? "×" : level === 2 ? "÷" : pick(["×", "÷"]);
  const p = level === 0 ? 10 : level === 1 ? pick([100, 1000]) : pick([10, 100, 1000]);
  const k = zerosOf(p);
  // a = el número "pequeño" (sin los ceros de la potencia); grande = a · p
  let a;
  do a = randInt(2, p === 1000 ? 99 : 999);
  while (a % 10 === 0 && Math.random() < 0.6); // alguno acabado en 0, pero pocos
  const big = a * p;
  const missing = level === 3 && Math.random() < 0.5;
  let left, right, answer, hint;
  if (op === "×") {
    left = fmt(a); right = missing ? fmt(big) : null; answer = missing ? p : big;
    hint = missing
      ? `De ${fmt(a)} a ${fmt(big)} se han añadido ${ZEROS[k]}: he multiplicado por ${fmt(p)}`
      : `Multiplicar por ${fmt(p)} es añadir ${ZEROS[k]}: ${fmt(a)} × ${fmt(p)} = ${fmt(big)}`;
  } else {
    left = fmt(big); right = missing ? fmt(a) : null; answer = missing ? p : a;
    hint = missing
      ? `De ${fmt(big)} a ${fmt(a)} se han quitado ${ZEROS[k]}: he dividido entre ${fmt(p)}`
      : `Dividir entre ${fmt(p)} es quitar ${ZEROS[k]}: ${fmt(big)} ÷ ${fmt(p)} = ${fmt(a)}`;
  }
  return { op, p, k, a, big, missing, left, right, answer, hint };
}

export function mountCerosGame(container, { client, onExit }) {
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
    <div class="game-body ce-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  // Teclado físico: cifras, Retroceso y Enter hacen lo mismo que el de pantalla.
  function onKeyDown(e) {
    const k = e.key === "Enter" ? "✓" : e.key === "Backspace" ? "⌫" : e.key;
    if (!/^[0-9]$/.test(k) && k !== "✓" && k !== "⌫") return;
    e.preventDefault();
    pressKey(k);
  }
  window.addEventListener("keydown", onKeyDown);

  // Número con sus últimos k ceros envueltos en una clase (añadidos o quitados)
  function marked(n, k, cls) {
    const s = fmt(n);
    let i = s.length, left = k;
    while (left > 0) { i--; if (s[i] !== ".") left--; }
    return `${s.slice(0, i)}<span class="${cls}">${s.slice(i)}</span>`;
  }

  // La cuenta resuelta, con los ceros resaltados
  function worked() {
    const { op, p, k, a, big } = round;
    return op === "×"
      ? `${fmt(a)} × ${fmt(p)} = ${marked(big, k, "ce-add")}`
      : `${marked(big, k, "ce-del")} ÷ ${fmt(p)} = ${fmt(a)}`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 3)));
    typed = "";
    busy = false;
    const slot = `<button type="button" class="ce-slot active" data-slot></button>`;
    const line = round.missing
      ? `<span>${round.left}</span><span class="ce-op">${round.op}</span>${slot}<span class="ce-op">=</span><span>${round.right}</span>`
      : `<span>${round.left}</span><span class="ce-op">${round.op}</span><span>${fmt(round.p)}</span><span class="ce-op">=</span>${slot}`;
    const prompt = round.missing ? (round.op === "×" ? "¿Por cuánto he multiplicado?" : "¿Entre cuánto he dividido?") : round.op === "×" ? "Multiplica" : "Divide";
    body.innerHTML = `
      <p class="prompt ce-prompt">${prompt}</p>
      <div class="ce-cuaderno">
        <div class="ce-line">${line}</div>
        <div class="ce-worked" data-worked></div>
      </div>
      <div class="keypad ce-keypad" data-keypad></div>
      <div class="feedback ce-feedback" data-feedback></div>
    `;
    // Una sola casilla: tocarla la deja enfocada (ya lo está)
    body.querySelector("[data-slot]").addEventListener("click", paint);
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
    const s = body.querySelector("[data-slot]");
    if (s && !busy) s.textContent = typed ? fmt(typed) : "";
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 7 && !(typed === "" && key === "0")) typed += key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    if (!typed) {
      feedback.textContent = "Escribe el número en la casilla";
      feedback.className = "feedback bad";
      return;
    }
    busy = true;
    rounds++;
    const ok = Number(typed) === round.answer;
    const slot = body.querySelector("[data-slot]");
    slot.classList.remove("active");
    slot.classList.add(ok ? "good" : "bad");
    if (!ok) slot.innerHTML = `<s>${fmt(typed)}</s><em>${fmt(round.answer)}</em>`;
    body.querySelector("[data-worked]").innerHTML = worked();
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
      feedback.innerHTML = `💡 ${round.hint} <button type="button" class="primary ce-next" data-next>Siguiente →</button>`;
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
    saveScore(client, "ceros", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>0️⃣</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cuentas bien de ${rounds}</p>
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
