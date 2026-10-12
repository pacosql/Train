// "Forma el número": 3-5 tarjetas con cifras y un encargo (el MAYOR
// posible, el MENOR, el más cercano a N, el mayor PAR, el menor IMPAR).
// Tocar una tarjeta la coloca en el primer hueco libre; tocar un hueco la
// devuelve; ✓ comprueba. Enseña valor posicional: la cifra grande va en
// el lugar de mayor valor.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+$)/g, ".");
const LUGAR = ["unidades", "decenas", "centenas", "unidades de millar", "decenas de millar"];

// Todos los números válidos (sin 0 delante) que se forman con esas cifras.
function todos(digits) {
  const out = new Set();
  const rec = (rest, acc) => {
    if (!rest.length) return out.add(Number(acc.join("")));
    rest.forEach((d, i) => (acc.length || d !== 0) && rec(rest.filter((_, j) => j !== i), [...acc, d]));
  };
  rec(digits, []);
  return [...out];
}

// Nivel → cuántas cifras y qué encargo. Devuelve también la solución y el 💡.
export function buildRound(stage) {
  for (;;) {
    const count = stage === 0 || stage === 3 ? 3 : 4;
    const digits = [];
    while (digits.length < count) {
      const d = randInt(stage >= 4 ? 0 : 1, 9);
      if (!digits.includes(d)) digits.push(d);
    }
    if (stage >= 4 && !digits.includes(0)) digits[randInt(0, count - 1)] = 0;
    const kind = stage === 2 ? pick(["maxEven", "minOdd"]) : stage === 3 ? "near" : pick(["max", "min"]);
    const target = kind === "near" ? randInt(2, 8) * 100 : 0;
    const nums = todos(digits);
    let cands = nums;
    if (kind === "maxEven") cands = nums.filter((n) => n % 2 === 0);
    if (kind === "minOdd") cands = nums.filter((n) => n % 2 === 1);
    if (!cands.length) continue;
    let answer;
    if (kind === "near") {
      const best = Math.min(...nums.map((n) => Math.abs(n - target)));
      const tied = nums.filter((n) => Math.abs(n - target) === best);
      if (tied.length !== 1) continue; // dos igual de cerca: repetimos la ronda
      answer = tied[0];
    } else answer = kind.startsWith("max") ? Math.max(...cands) : Math.min(...cands);
    const asc = [...digits].sort((a, b) => a - b);
    const desc = [...asc].reverse();
    const top = LUGAR[count - 1];
    const prompt =
      kind === "max" ? "el número <b>MAYOR</b> posible" : kind === "min" ? "el número <b>MENOR</b> posible" :
      kind === "near" ? `el número <b>más cercano a ${target}</b>` :
      kind === "maxEven" ? "el <b>MAYOR</b> número <b>PAR</b>" : "el <b>MENOR</b> número <b>IMPAR</b>";
    let hint;
    if (kind === "max") hint = `La cifra más grande va en el lugar de mayor valor: ${desc[0]} en las ${top} (${desc.join(" > ")}) → ${fmt(answer)}`;
    else if (kind === "min" && asc[0] === 0) hint = `El 0 no puede ir delante: primero la menor distinta de 0 (${asc[1]}), luego el 0 y el resto de menor a mayor → ${fmt(answer)}`;
    else if (kind === "min") hint = `La cifra más pequeña va en el lugar de mayor valor: ${asc[0]} en las ${top} (${asc.join(" < ")}) → ${fmt(answer)}`;
    else if (kind === "near") hint = `${fmt(answer)} está a ${Math.abs(answer - target)} de ${target}; empieza por la centena que más se acerca y ajusta el resto`;
    else if (kind === "maxEven") hint = `Par = acaba en 0, 2, 4, 6 u 8: la par más pequeña (${answer % 10}) al final y las demás de mayor a menor → ${fmt(answer)}`;
    else hint = `Impar = acaba en 1, 3, 5, 7 o 9: la impar más grande (${answer % 10}) al final y las demás de menor a mayor → ${fmt(answer)}`;
    return { digits: shuffle(digits), kind, target, answer, prompt, hint };
  }
}

export function mountMayornumeroGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let busy = false;
  let round = null;
  let slots = []; // índice de tarjeta en cada hueco o null
  let pending = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body mn-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const stage = () => Math.min(Math.floor(level / 3), 4);

  function nextRound() {
    round = buildRound(stage());
    slots = round.digits.map(() => null);
    busy = false;
    body.innerHTML = `
      <p class="prompt mn-prompt">Forma ${round.prompt}<small>Toca las cifras en orden</small></p>
      <div class="mn-slots" data-slots></div>
      <div class="mn-cards" data-cards></div>
      <button type="button" class="primary mn-ok" data-ok>✓</button>
      <div class="feedback mn-feedback" data-feedback></div>
    `;
    body.querySelector("[data-ok]").addEventListener("click", check);
    paint();
  }

  function paint() {
    const slotsEl = body.querySelector("[data-slots]");
    slotsEl.innerHTML = slots
      .map((c, i) => `<button type="button" class="mn-slot ${c === null ? "empty" : ""}" data-slot="${i}">${c === null ? "" : round.digits[c]}</button>`)
      .join("");
    const cardsEl = body.querySelector("[data-cards]");
    cardsEl.innerHTML = round.digits
      .map((d, i) => `<button type="button" class="mn-card ${slots.includes(i) ? "used" : ""}" data-card="${i}" ${slots.includes(i) ? "disabled" : ""}>${d}</button>`)
      .join("");
    slotsEl.querySelectorAll("[data-slot]").forEach((b) =>
      b.addEventListener("click", () => {
        if (busy || finished) return;
        slots[Number(b.dataset.slot)] = null; // devolver la tarjeta
        paint();
      }),
    );
    cardsEl.querySelectorAll("[data-card]").forEach((b) =>
      b.addEventListener("click", () => {
        if (busy || finished) return;
        const idx = slots.indexOf(null);
        if (idx >= 0) slots[idx] = Number(b.dataset.card);
        paint();
      }),
    );
    body.querySelector("[data-ok]").disabled = slots.includes(null);
  }

  function check() {
    if (busy || finished || slots.includes(null)) return;
    rounds++;
    busy = true;
    const digits = slots.map((c) => round.digits[c]);
    const value = Number(digits.join(""));
    const fb = body.querySelector("[data-feedback]");
    if (digits[0] !== 0 && value === round.answer) {
      score += 10;
      level++;
      renderScore();
      body.querySelectorAll(".mn-slot").forEach((s) => s.classList.add("good"));
      fb.className = "feedback mn-feedback ok";
      fb.textContent = `¡Bien! 💡 ${round.hint}`;
      pending = setTimeout(nextRound, 900);
      return;
    }
    lives--;
    renderLives();
    body.querySelectorAll(".mn-slot").forEach((s) => s.classList.add("bad"));
    // La respuesta correcta, en verde, debajo de la del jugador.
    const ans = document.createElement("div");
    ans.className = "mn-slots mn-answer";
    ans.dataset.answer = "";
    ans.innerHTML = String(round.answer).split("").map((d) => `<span class="mn-slot good">${d}</span>`).join("");
    body.querySelector("[data-slots]").after(ans);
    fb.className = "feedback mn-feedback bad";
    fb.textContent = (digits[0] === 0 ? "Un número no puede empezar por 0. " : `${fmt(value)} no es. `) + `💡 ${round.hint}`;
    pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "mayornumero", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🃏</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} números bien formados de ${rounds}</p>
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
  };
}
