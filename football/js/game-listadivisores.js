// "Todos los divisores": "Divisores de 18: □ □ □ □ □ □" con tantas casillas
// como divisores, sobre papel cuadriculado; se rellenan en orden creciente
// con el teclado (el foco avanza solo). Al responder, las parejas de
// divisores se unen con arcos por encima (1–18, 2–9, 3–6), como se hace en la
// pizarra. Niveles con primos (dos casillas) y "¿cuántos divisores tiene 36?".
import { randInt, pick, saveScore } from "./utils.js";

const isPrime = (n) => { for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return n > 1; };
const divisorsOf = (n) => { const r = []; for (let i = 1; i <= n; i++) if (n % i === 0) r.push(i); return r; };
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];

// Niveles: 0 n ≤ 12 · 1 n ≤ 30 · 2 n ≤ 50 · 3 primos (dos casillas) ·
// 4 "¿cuántos divisores tiene n?" (una casilla).
export function buildRound(level) {
  const L = Math.min(4, level);
  let n;
  if (L === 0) n = pick([4, 6, 8, 9, 10, 12]);
  else if (L === 3) n = pick(PRIMES);
  else do n = randInt(L === 1 ? 13 : L === 2 ? 31 : 12, L === 1 ? 30 : L === 2 ? 50 : 60); while (isPrime(n));
  const divs = divisorsOf(n);
  const pairs = divs.slice(0, Math.ceil(divs.length / 2)).map((d) => [d, n / d]);
  const pairText = pairs.map(([a, b]) => (a === b ? `${a} y ${a}` : `${a} y ${b}`)).join(", ");
  const kind = L === 3 ? "primo" : L === 4 ? "cuantos" : "lista";
  let hint;
  if (kind === "primo") hint = `${n} solo se puede dividir exactamente entre 1 y entre ${n}: es un número primo (2 divisores)`;
  else if (kind === "cuantos") hint = `Apunto las parejas: ${pairText} → ${divs.join(", ")}: ${divs.length} divisores`;
  else hint = `Voy probando: ${n} ÷ 1, ÷ 2, ÷ 3… y apunto las parejas que dan división exacta: ${pairText}. Total: ${divs.length} divisores`;
  return { n, divs, pairs, kind, ans: kind === "cuantos" ? [divs.length] : divs, level: L, hint,
    prompt: kind === "cuantos" ? `¿Cuántos divisores tiene <b>${n}</b>?` : `Divisores de <b>${n}</b>` };
}

export function mountListadivisoresGame(container, { client, onExit }) {
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
    <div class="game-body ld-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const slots = () => body.querySelectorAll("[data-slot]");
  const row = (cells, cls) => `<div class="ld-row${cells.length > 8 ? " ld-many" : ""}" style="--ld-n:${cells.length}">${cells.join("")}</div>`;

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.floor(hits / 2));
    typed = round.ans.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt ld-prompt">${round.prompt}</p>
      <div class="ld-cuaderno" data-sheet>
        <svg class="ld-arcs" data-arcs></svg>
        ${row(round.ans.map((_, i) => `<button type="button" class="ld-cell ld-slot" data-slot="${i}"></button>`))}
      </div>
      <div class="keypad ld-keypad" data-keypad></div>
      <div class="feedback ld-feedback" data-feedback></div>
    `;
    slots().forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
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
    slots().forEach((b, i) => {
      b.textContent = typed[i];
      b.classList.toggle("active", i === active);
    });
  }

  // Cada casilla admite hasta dos cifras; con dos el foco salta a la
  // siguiente vacía. ✓ salta si quedan huecos y corrige cuando no.
  function pressKey(key) {
    if (finished || busy) return;
    const empty = typed.map((t, i) => (t === "" ? i : -1)).filter((i) => i >= 0);
    if (key === "✓") {
      if (!empty.length) return check();
      if (typed[active] === "") {
        const fb = body.querySelector("[data-feedback]");
        fb.textContent = "Escribe un número en la casilla marcada";
        fb.className = "feedback bad";
      } else active = empty[0];
    } else if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else {
      typed[active] = typed[active] === "0" ? key : (typed[active] + key).slice(0, 2);
      const rest = empty.filter((i) => i !== active);
      if (typed[active].length === 2 && rest.length) active = rest[0];
    }
    paint();
  }

  // Une con arcos las parejas de divisores (d, n ÷ d) sobre la fila de
  // casillas que contiene la lista completa; el cuadrado perfecto se marca
  // con un punto (6 × 6).
  function drawArcs(rowEl) {
    const svg = body.querySelector("[data-arcs]"), sheet = body.querySelector("[data-sheet]");
    const cells = rowEl.querySelectorAll(".ld-cell"), s = sheet.getBoundingClientRect();
    const H = svg.getBoundingClientRect().height, xs = [...cells].map((c) => { const r = c.getBoundingClientRect(); return r.left + r.width / 2 - s.left; });
    svg.setAttribute("viewBox", `0 0 ${s.width} ${H}`);
    svg.innerHTML = round.pairs.map(([a, b], i) => {
      const x1 = xs[round.divs.indexOf(a)], x2 = xs[round.divs.indexOf(b)], cls = `ld-arc${i % 2 ? " ld-arc-alt" : ""}`;
      if (a === b) return `<circle class="${cls}" cx="${x1}" cy="${H - 9}" r="5"/>`;
      const ry = Math.min(H - 6, 10 + (x2 - x1) / 4);
      return `<path class="${cls}" d="M ${x1} ${H - 2} A ${(x2 - x1) / 2} ${ry} 0 0 1 ${x2} ${H - 2}"/>`;
    }).join("");
  }

  function check() {
    busy = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    let ok = true;
    slots().forEach((b, i) => {
      b.classList.remove("active");
      const good = Number(typed[i]) === round.ans[i];
      ok = ok && good;
      b.classList.add(good ? "good" : "bad");
      if (!good) b.innerHTML = `<s>${typed[i]}</s>${round.ans[i]}`;
    });
    let listRow = body.querySelector(".ld-row");
    if (round.kind === "cuantos") {
      // Se revela la lista completa debajo de la casilla, con sus parejas.
      body.querySelector("[data-sheet]").insertAdjacentHTML("beforeend", row(round.divs.map((d) => `<span class="ld-cell ld-fixed">${d}</span>`)));
      listRow = body.querySelector(".ld-row:last-child");
    }
    drawArcs(listRow);
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
      feedback.innerHTML = `${round.ans.length > 1 ? "Eran" : "Era"} ${round.ans.join(", ")}. 💡 ${round.hint} <button type="button" class="primary ld-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad";
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  // Teclado físico: cifras, retroceso e Intro.
  const onKey = (e) => {
    if (finished || busy) return;
    if (/^\d$/.test(e.key)) pressKey(e.key);
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
    saveScore(client, "listadivisores", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔗</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} listas de divisores completas de ${rounds}</p>
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
