// "Completa la tabla": tabla de proporcionalidad de 2 filas ("bolis" /
// "euros") con 3-4 columnas y UNA casilla vacía resaltada; se escribe con
// el teclado. El 💡 enseña la reducción a la unidad ("3 bolis → 6 €, así
// que 1 → 2 €, y 5 → 5 × 2 = 10 €"). El último nivel es proporcionalidad
// INVERSA, señalada claramente ("más obreros, menos días: el producto se
// mantiene").
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const DIRECT = [["bolis", "euros"], ["cuadernos", "euros"], ["horas", "km"], ["tartas", "huevos"], ["cm en el mapa", "km reales"],
  ["litros", "euros"], ["cajas", "botellas"], ["bolsas", "caramelos"], ["minutos", "litros"], ["entradas", "euros"]];
const INVERSE = [["obreros", "días"], ["grifos", "minutos"], ["km/h", "horas"], ["máquinas", "horas"]];
const PRODUCTS = [12, 24, 36, 48, 60, 72];
const dec = (n) => String(n).replace(".", ",");

// Nivel 0 k entera, hueco abajo · 1 hueco arriba (dividir) · 2 k decimal (1,5) · 3 inversa
export function buildRound(level) {
  const inverse = level >= 3;
  // Con constante decimal, solo contextos de magnitud continua (euros, km, litros).
  const [X, Y] = pick(inverse ? INVERSE : level >= 2 ? DIRECT.filter((c) => /euros|km|litros/.test(c[1])) : DIRECT);
  const cols = randInt(3, 4);
  let xs, ys, k;
  if (inverse) {
    k = pick(PRODUCTS);
    const divs = [];
    for (let d = 2; d <= k / 2; d++) if (k % d === 0) divs.push(d);
    xs = shuffle(divs).slice(0, cols).sort((a, b) => a - b);
    ys = xs.map((x) => k / x);
  } else {
    k = level >= 2 ? pick([1.5, 2.5, 0.5]) : randInt(2, 9);
    const pool = level >= 2 ? [2, 4, 6, 8, 10, 12, 14, 16] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    xs = shuffle(pool).slice(0, cols).sort((a, b) => a - b);
    ys = xs.map((x) => Math.round(x * k * 2) / 2);
  }
  const holeRow = level === 0 ? 1 : level === 1 ? 0 : randInt(0, 1);
  const holeCol = randInt(0, cols - 1);
  const answer = holeRow === 0 ? xs[holeCol] : ys[holeCol];
  // Columna de referencia para el 💡: la de menor x que no sea el hueco.
  const ref = holeCol === 0 ? 1 : 0;
  const rx = xs[ref], ry = ys[ref];
  let hint;
  if (inverse) {
    hint = `Inversa: más ${X}, menos ${Y}. El producto se mantiene: ${rx} × ${ry} = ${k} → ` +
      (holeRow === 1 ? `${xs[holeCol]} ${X}: ${k} ÷ ${xs[holeCol]} = ${answer} ${Y}` : `${ys[holeCol]} ${Y}: ${k} ÷ ${ys[holeCol]} = ${answer} ${X}`);
  } else {
    const unit = rx === 1 ? `1 → ${dec(ry)} ${Y}` : `${rx} ${X} → ${dec(ry)} ${Y}, así que 1 → ${dec(ry)} ÷ ${rx} = ${dec(k)} ${Y}`;
    hint = holeRow === 1
      ? `${unit}, y ${xs[holeCol]} → ${xs[holeCol]} × ${dec(k)} = ${dec(answer)} ${Y}`
      : `${unit}, y ${dec(ys[holeCol])} ${Y} → ${dec(ys[holeCol])} ÷ ${dec(k)} = ${answer} ${X}`;
  }
  return { inverse, X, Y, xs, ys, k, holeRow, holeCol, answer, hint };
}

export function mountTablaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives, score = 0, rounds = 0, ok = 0, finished = false;
  let round = null, typed = "", locked = false, pending = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats"><span class="lives" data-lives></span><span class="score" data-score>⭐ 0</span></div>
    </div>
    <div class="game-body tb-body" data-body></div>`;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const level = () => Math.min(3, Math.floor(ok / 2));

  function rowHtml(label, vals, rowIdx) {
    return `<tr><th>${label}</th>${vals.map((v, i) =>
      i === round.holeCol && rowIdx === round.holeRow
        ? `<td class="tb-hole" data-hole>?</td>`
        : `<td>${dec(v)}</td>`).join("")}</tr>`;
  }

  function nextRound() {
    round = buildRound(level());
    typed = "";
    locked = false;
    body.innerHTML = `
      <p class="prompt tb-prompt">Completa la casilla <span class="tb-q">?</span></p>
      <div class="tb-badge ${round.inverse ? "inv" : ""}" data-badge>${round.inverse ? "↕ INVERSA: más de una, menos de otra" : "↗ Proporcionalidad directa"}</div>
      <table class="tb-table" data-table>${rowHtml(round.X, round.xs, 0)}${rowHtml(round.Y, round.ys, 1)}</table>
      <div class="keypad-display tb-display" data-display>&nbsp;</div>
      <div class="keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>`;
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = key === "✓" ? "choice-btn keypad-key primary" : "choice-btn keypad-key";
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
  }

  function pressKey(key) {
    if (locked || finished) return;
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (key === "✓") { if (typed !== "") resolve(Number(typed) === round.answer); return; }
    else if (typed.length < 4) typed += key;
    body.querySelector("[data-display]").textContent = typed || " ";
    body.querySelector("[data-hole]").textContent = typed || "?";
  }

  function resolve(good) {
    locked = true;
    rounds++;
    const hole = body.querySelector("[data-hole]");
    hole.textContent = dec(round.answer);
    hole.classList.add(good ? "ok" : "fix");
    if (!good) body.querySelector("[data-display]").classList.add("tb-wrong");
    const fb = body.querySelector("[data-feedback]");
    fb.textContent = `💡 ${round.hint}`;
    fb.className = `feedback tb-hint ${good ? "ok" : "bad"}`;
    if (good) { score += 10; ok++; renderScore(); pending = setTimeout(nextRound, 900); return; }
    lives--;
    renderLives();
    pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero
    // "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "tabla", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📋</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} tablas</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>`;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    lives = startLives; score = 0; rounds = 0; ok = 0; finished = false;
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
