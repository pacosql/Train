// "El número escondido": una operación con un hueco en cualquier
// posición (□ + 7 = 15, 20 − □ = 8, □ × 3 = 21, 24 ÷ □ = 6) y teclado.
// Prepara el álgebra: el 💡 explica la operación inversa con la que se
// averigua el número escondido.
import { randInt, pick, saveScore } from "./utils.js";

// Nivel → operación y tamaño de los números. El hueco cae en cualquiera
// de las tres posiciones (a, b o resultado).
export function buildRound(stage) {
  let op, a, b;
  if (stage === 0) { op = "+"; a = randInt(1, 19); b = randInt(1, 20 - a); }
  else if (stage === 1) { op = "−"; a = randInt(2, 20); b = randInt(1, a - 1); }
  else if (stage === 2) {
    op = pick(["+", "−"]);
    if (op === "+") { a = randInt(5, 95); b = randInt(1, 100 - a); } else { a = randInt(10, 100); b = randInt(1, a - 1); }
  } else if (stage === 3) { op = "×"; a = randInt(2, 10); b = randInt(2, 10); }
  else if (stage === 4) { op = "÷"; b = randInt(2, 10); a = b * randInt(2, 10); }
  else {
    op = pick(["+", "−", "×", "÷"]);
    if (op === "+") { a = randInt(50, 950); b = randInt(1, 1000 - a); }
    else if (op === "−") { a = randInt(100, 1000); b = randInt(1, a - 1); }
    else if (op === "×") { a = randInt(3, 12); b = randInt(11, 80); }
    else { b = randInt(2, 12); a = b * randInt(3, 80); }
  }
  const c = op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : a / b;
  const hole = randInt(0, 2); // 0 = a, 1 = b, 2 = resultado
  const vals = [a, b, c];
  const answer = vals[hole];
  let hint;
  if (hole === 2) hint = `${op === "+" ? "Sumo" : op === "−" ? "Resto" : op === "×" ? "Multiplico" : "Divido"}: ${a} ${op} ${b} = ${c}`;
  else if (op === "+") hint = `Para saber qué sumé a ${vals[1 - hole]} para llegar a ${c}, resto: ${c} − ${vals[1 - hole]} = ${answer}`;
  else if (op === "−" && hole === 0) hint = `Si al quitar ${b} quedan ${c}, antes había más: sumo ${c} + ${b} = ${a}`;
  else if (op === "−") hint = `Para saber cuánto quité a ${a} para quedar en ${c}, resto: ${a} − ${c} = ${b}`;
  else if (op === "×") hint = `¿Qué número por ${vals[1 - hole]} da ${c}? Lo contrario de multiplicar es dividir: ${c} ÷ ${vals[1 - hole]} = ${answer}`;
  else if (hole === 0) hint = `Si al repartir entre ${b} salen ${c}, el total es lo contrario de dividir: ${c} × ${b} = ${a}`;
  else hint = `¿${a} entre cuánto da ${c}? Divido: ${a} ÷ ${c} = ${b}`;
  return { op, vals, hole, answer, hint };
}

export function mountHuecoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let busy = false;
  let round = null;
  let typed = "";
  let pending = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body hu-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const stage = () => Math.min(Math.floor(level / 3), 5);

  function nextRound() {
    round = buildRound(stage());
    typed = "";
    busy = false;
    const term = (i) =>
      i === round.hole
        ? `<span class="hu-hole" data-hole>?</span>`
        : `<span class="hu-num" data-term="${i}">${round.vals[i]}</span>`;
    body.innerHTML = `
      <p class="prompt hu-prompt">¿Qué número falta?</p>
      <div class="hu-eq" data-eq>${term(0)}<span class="hu-op" data-op>${round.op}</span>${term(1)}<span class="hu-op">=</span>${term(2)}</div>
      <div class="keypad hu-pad" data-keypad></div>
      <div class="feedback hu-feedback" data-feedback></div>
    `;
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key" + (key === "✓" ? " primary" : "");
      btn.textContent = key;
      btn.dataset.key = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return submit();
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 4) typed += key;
    // Lo escrito aparece dentro del propio hueco.
    const hole = body.querySelector("[data-hole]");
    hole.textContent = typed || "?";
    hole.classList.toggle("filled", typed !== "");
  }

  function submit() {
    if (typed === "") return;
    rounds++;
    busy = true;
    const value = Number(typed);
    const hole = body.querySelector("[data-hole]");
    const fb = body.querySelector("[data-feedback]");
    if (value === round.answer) {
      score += 10;
      level++;
      renderScore();
      hole.classList.add("good");
      fb.className = "feedback hu-feedback ok";
      fb.textContent = `¡Bien! 💡 ${round.hint}`;
      pending = setTimeout(nextRound, 900);
      return;
    }
    lives--;
    renderLives();
    // El hueco muestra la respuesta correcta en verde; lo escrito, tachado.
    hole.innerHTML = `<s class="hu-wrong">${value}</s> <span class="hu-good">${round.answer}</span>`;
    hole.classList.add("bad");
    fb.className = "feedback hu-feedback bad";
    fb.textContent = `Era ${round.answer}. 💡 ${round.hint}`;
    pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
  }

  const onKey = (e) => {
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
    saveScore(client, "hueco", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔍</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} números escondidos encontrados de ${rounds}</p>
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
    level = 0;
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
