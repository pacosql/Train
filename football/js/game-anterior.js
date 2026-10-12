// "Anterior y posterior": como en el cuaderno de 1.º, [ □ ] 59 [ □ ] con
// el número grande en el centro. Se rellena primero la casilla de la
// izquierda (el anterior) y luego la de la derecha (el posterior) con el
// teclado; ✓ con la primera casilla puesta salta a la segunda, ✓ con las
// dos puestas corrige. El 💡 lo dice como la profe: "Antes del 59 va el
// 58 (uno menos) y después el 60 (uno más)".
import { randInt, saveScore } from "./utils.js";

// Punto de miles como en España: 1000 → "1.000"
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

// Niveles: 0 hasta 20 · 1 hasta 100 (a menudo acaba en 9 o en 0: 39→40, 99→100) ·
// 2 hasta 1.000 · 3 decenas de 10 en 10 (340 → 330 / 350).
export function buildRound(level) {
  let n, step = 1;
  if (level === 0) n = randInt(1, 19);
  else if (level === 1) {
    n = randInt(1, 99);
    // La mitad de las veces forzamos el cambio de decena, que es lo que cuesta.
    if (Math.random() < 0.5) n = Math.min(99, Math.floor(n / 10) * 10 + (Math.random() < 0.5 ? 9 : 0)) || 10;
  } else if (level === 2) {
    n = randInt(1, 999);
    if (Math.random() < 0.4) n = Math.min(999, Math.floor(n / 10) * 10 + (Math.random() < 0.5 ? 9 : 0)) || 100;
  } else {
    step = 10;
    n = randInt(2, 99) * 10;
  }
  const prev = n - step, next = n + step;
  const word = step === 1 ? "uno" : "diez";
  const hint = `Antes del ${fmt(n)} va el ${fmt(prev)} (${word} menos) y después el ${fmt(next)} (${word} más)`;
  return { n, step, prev, next, hint };
}

export function mountAnteriorGame(container, { client, onExit }) {
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
    <div class="game-body an-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    // nunca dos rondas seguidas iguales
    const last = round && round.n;
    do round = buildRound(Math.min(3, Math.floor(hits / 3))); while (round.n === last);
    typed = { prev: "", next: "" };
    active = "prev";
    busy = false;
    body.innerHTML = `
      <p class="prompt an-prompt">${round.step === 1 ? "Escribe el anterior y el posterior" : "El anterior y el posterior, de 10 en 10"}</p>
      <div class="an-cuaderno">
        <div class="an-row">
          <button type="button" class="an-slot" data-slot="prev" aria-label="anterior"></button>
          <span class="an-center" data-center>${fmt(round.n)}</span>
          <button type="button" class="an-slot" data-slot="next" aria-label="posterior"></button>
        </div>
        <div class="an-arrows"><span>anterior</span><span>posterior</span></div>
      </div>
      <div class="keypad an-keypad" data-keypad></div>
      <div class="feedback an-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = b.dataset.slot), paint())));
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
      b.textContent = typed[b.dataset.slot] === "" ? "" : fmt(Number(typed[b.dataset.slot]));
      b.classList.toggle("active", b.dataset.slot === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < 4) typed[active] += key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    // ✓ con una casilla vacía: el foco pasa a ella (como un Enter en clase).
    const empty = ["prev", "next"].find((k) => typed[k] === "");
    if (empty) {
      active = empty;
      paint();
      if (empty === "next" && typed.prev !== "") return;
      feedback.textContent = "Escribe primero el anterior (la casilla de la izquierda)";
      feedback.className = "feedback bad";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const k = s.dataset.slot;
      const ok = Number(typed[k]) === round[k];
      allOk = allOk && ok;
      s.classList.remove("active");
      s.classList.add(ok ? "good" : "bad");
      if (!ok) s.innerHTML = `<s>${fmt(Number(typed[k]))}</s><em>${fmt(round[k])}</em>`;
    });
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${fmt(round.prev)} · ${fmt(round.n)} · ${fmt(round.next)}. 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era ${fmt(round.prev)} y ${fmt(round.next)}. 💡 ${round.hint}`;
      feedback.className = "feedback bad";
      const nxt = document.createElement("button");
      nxt.type = "button";
      nxt.className = "secondary an-next";
      nxt.textContent = "Siguiente →";
      nxt.addEventListener("click", advance);
      body.querySelector("[data-keypad]").replaceWith(nxt);
      pending = setTimeout(advance, 2500);
    }
  }

  // Tras un fallo: se acaba la partida si no quedan vidas, si no, otra ronda.
  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
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
    saveScore(client, "anterior", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔢</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} parejas bien de ${rounds}</p>
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
