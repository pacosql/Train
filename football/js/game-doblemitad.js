// "Doble y mitad": el número se ve con sus puntitos agrupados de dos en
// dos (dos filas, como fichas de dominó) y debajo la frase del cuaderno
// "El doble de 14 es □" o "La mitad de 28 es □". Se escribe con el
// teclado y, al responder, los puntos se duplican (aparece una segunda
// copia) o se partan por la mitad con una raya. 💡 "Doble = sumarlo dos
// veces: 14 + 14 = 28" / "Mitad = repartir en 2 partes iguales: 28 → 14 y 14".
import { randInt, saveScore } from "./utils.js";

// Niveles: 0 hasta 10 (puntos) · 1 hasta 20 (puntos) · 2 hasta 50 (solo el
// número) · 3 hasta 100 y dobles/mitades de decenas (70 → 140, 180 → 90).
export function buildRound(level) {
  const kind = Math.random() < 0.5 ? "doble" : "mitad";
  let base; // el número pequeño: lo que se dobla, o el resultado de la mitad
  if (level === 0) base = randInt(1, 10);
  else if (level === 1) base = randInt(6, 20);
  else if (level === 2) base = randInt(11, 50);
  else base = Math.random() < 0.5 ? randInt(2, 10) * 10 : randInt(26, 100);
  const shown = kind === "doble" ? base : base * 2;
  const answer = kind === "doble" ? base * 2 : base;
  const dots = level <= 1; // a partir del nivel 2 solo se ve el número
  const hint = kind === "doble"
    ? `Doble = sumarlo dos veces: ${base} + ${base} = ${base * 2}`
    : `Mitad = repartir en 2 partes iguales: ${base * 2} → ${base} y ${base}`;
  return { kind, shown, answer, dots, hint };
}

export function mountDoblemitadGame(container, { client, onExit }) {
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
    <div class="game-body dm-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  // Bloque de n puntos en dos filas (columnas de dos = "de dos en dos").
  const block = (n, cls = "") =>
    `<div class="dm-block ${cls}" style="--dm-c:${Math.ceil(n / 2)}">${"<i></i>".repeat(n)}</div>`;

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    round = buildRound(Math.min(3, Math.floor(hits / 3)));
    typed = "";
    busy = false;
    const art = round.dots ? block(round.shown) : `<div class="dm-nodots">${round.shown}</div>`;
    body.innerHTML = `
      <p class="prompt dm-prompt">${round.kind === "doble" ? "Doble" : "Mitad"}</p>
      <div class="dm-cuaderno">
        <div class="dm-dots" data-dots>${art}</div>
        <div class="dm-line">
          <span>${round.kind === "doble" ? "El doble de" : "La mitad de"} <b data-shown>${round.shown}</b> es</span>
          <button type="button" class="dm-slot active" data-slot></button>
        </div>
      </div>
      <div class="keypad dm-keypad" data-keypad></div>
      <div class="feedback dm-feedback" data-feedback></div>
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
  }

  const paint = () => (body.querySelector("[data-slot]").textContent = typed);

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 3) typed += key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    if (typed === "") {
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
    if (!ok) slot.innerHTML = `<s>${typed}</s><em>${round.answer}</em>`;
    // Los puntos enseñan la operación: el doble añade una copia igual; la
    // mitad parte las dos filas con una raya (cada fila es una mitad).
    const dots = body.querySelector("[data-dots]");
    if (round.dots) {
      if (round.kind === "doble") dots.insertAdjacentHTML("beforeend", block(round.shown, "dm-copy"));
      else dots.firstElementChild.classList.add("dm-split");
    }
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${round.answer}. 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era ${round.answer}. 💡 ${round.hint}`;
      feedback.className = "feedback bad";
      const nxt = document.createElement("button");
      nxt.type = "button";
      nxt.className = "secondary dm-next";
      nxt.textContent = "Siguiente →";
      nxt.addEventListener("click", advance);
      body.querySelector("[data-keypad]").replaceWith(nxt);
      pending = setTimeout(advance, 2500);
    }
  }

  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
  }

  // Teclado físico: cifras, retroceso y Enter.
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
    saveScore(client, "doblemitad", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔁</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} dobles y mitades bien de ${rounds}</p>
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
