// "Tabla de valores": la función escrita (y = 2x + 1) y la tabla del libro
// en horizontal, x | −2 | −1 | 0 | 1 | 2 con casillas en la fila de la y
// (en el último nivel, dada la y se halla la x). Se rellena de izquierda a
// derecha; al corregir, los puntos se dibujan en unos ejes pequeños y se
// unen: sale una recta o una parábola.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const M = "−";
const sg = (n) => (n < 0 ? M + Math.abs(n) : String(n));
const par = (n) => (n < 0 ? `(${sg(n)})` : String(n));
// "2x", "−x", "x²"…, coeficiente delante como en el libro
const coef = (a, X) => (a === 1 ? "" : a === -1 ? M : sg(a)) + X;
const tail = (b) => (b === 0 ? "" : b > 0 ? ` + ${b}` : ` ${M} ${-b}`);

export function formula(f, X = "x") {
  return f.kind === "lin" ? `y = ${coef(f.a, X)}${tail(f.b)}` : `y = ${coef(f.a, X + "²")}${tail(f.b)}`;
}
export const evalF = (f, x) => (f.kind === "lin" ? f.a * x + f.b : f.a * x * x + f.b);

// La cuenta de una columna, dicha como la profe.
function explain(f, x, y, inverse) {
  if (inverse) {
    let t = `y = ${sg(y)}: ${coef(f.a, "x")}${tail(f.b)} = ${sg(y)}`;
    if (f.b !== 0) t += ` → ${coef(f.a, "x")} = ${sg(y)} ${f.b > 0 ? M : "+"} ${Math.abs(f.b)} = ${sg(y - f.b)}`;
    if (f.a === -1 || (f.a === 1 && f.b === 0)) t += ` → x = ${sg(x)}`;
    else if (f.a !== 1) t += ` → x = ${sg(y - f.b)} : ${par(f.a)} = ${sg(x)}`;
    return t;
  }
  if (f.kind === "lin") {
    const prod = f.a === 1 ? par(x) : f.a === -1 ? `${M}${par(x)}` : `${sg(f.a)} · ${par(x)}`;
    const mid = f.b && Math.abs(f.a) !== 1 ? `${sg(f.a * x)}${tail(f.b)} = ` : "";
    return `x = ${sg(x)}: y = ${prod}${tail(f.b)} = ${mid}${sg(y)}`;
  }
  const sq = `${par(x)}²`, mid = f.a === 1 ? sq : f.a === -1 ? `${M}${sq}` : `${f.a} · ${sq}`;
  return `x = ${sg(x)}: y = ${mid}${tail(f.b)} = ${f.b ? sg(f.a * x * x) + tail(f.b) + " = " : ""}${sg(y)}${x < 0 ? " (un negativo al cuadrado da positivo)" : ""}`;
}

// Niveles: 0 y = ax · 1 y = ax + b · 2 con negativos · 3 parábola y = ax² + b ·
// 4 dada la y, hallar la x (en dos columnas) en una recta.
export function buildRound(level) {
  let f;
  if (level === 0) f = { kind: "lin", a: randInt(2, 5), b: 0 };
  else if (level === 1) f = { kind: "lin", a: randInt(1, 4), b: randInt(1, 6) };
  else if (level === 3) f = { kind: "par", a: pick([1, 1, -1, 2]), b: randInt(-4, 4) };
  else {
    do f = { kind: "lin", a: pick([-4, -3, -2, -1, 1, 2, 3, 4]), b: randInt(-6, 6) };
    while (f.b === 0 || (f.a > 0 && f.b > 0) || (level === 4 && Math.abs(f.a) > 3));
  }
  const inverse = level === 4;
  const xs = inverse ? shuffle([-3, -2, -1, 0, 1, 2, 3]).slice(0, 5).sort((p, q) => p - q) : [-2, -1, 0, 1, 2];
  const hideX = inverse ? shuffle([0, 1, 2, 3, 4]).slice(0, 2) : [];
  const cols = xs.map((x, i) => ({ x, y: evalF(f, x), ask: hideX.includes(i) ? "x" : "y" }));
  const show = cols.find((c) => c.ask === "x") || cols.find((c) => c.x < 0);
  return { f, inverse, cols, hint: explain(f, show.x, show.y, show.ask === "x") };
}

export function mountTablavaloresGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, vals, active, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats"><span class="lives" data-lives></span><span class="score" data-score>⭐ 0</span></div>
    </div>
    <div class="game-body tv-body" data-body></div>`;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  // Ejes pequeños con los puntos (y, si ya se ha corregido, la gráfica).
  function axes(cols, typed) {
    const W = 230, H = 150, xs = cols.map((c) => c.x);
    const ys = cols.map((c) => c.y).concat(0);
    const x0 = Math.min(...xs) - 0.6, x1 = Math.max(...xs) + 0.6;
    const y0 = Math.min(...ys) - 1, y1 = Math.max(...ys) + 1;
    const X = (x) => ((x - x0) / (x1 - x0)) * W, Y = (y) => H - ((y - y0) / (y1 - y0)) * H;
    const step = y1 - y0 > 24 ? 5 : y1 - y0 > 12 ? 2 : 1;
    let g = "";
    for (let x = Math.ceil(x0); x <= x1; x++) g += `<line class="tv-tick" x1="${X(x)}" y1="${Y(0) - 3}" x2="${X(x)}" y2="${Y(0) + 3}"/>${x ? `<text x="${X(x)}" y="${Y(0) + 13}">${sg(x)}</text>` : ""}`;
    for (let y = Math.ceil(y0 / step) * step; y <= y1; y += step) if (y) g += `<line class="tv-tick" x1="${X(0) - 3}" y1="${Y(y)}" x2="${X(0) + 3}" y2="${Y(y)}"/><text x="${X(0) - 6}" y="${Y(y) + 3}" text-anchor="end">${sg(y)}</text>`;
    const pts = [];
    for (let k = 0; k <= 60; k++) { const x = x0 + ((x1 - x0) * k) / 60; pts.push(`${X(x).toFixed(1)},${Y(evalF(round.f, x)).toFixed(1)}`); }
    const dots = cols.map((c, i) => {
      const bad = typed[i] !== null && typed[i] !== (c.ask === "x" ? c.x : c.y);
      const [tx, ty] = c.ask === "x" ? [typed[i], c.y] : [c.x, typed[i]];
      const wrong = bad && tx >= x0 && tx <= x1 && ty >= y0 && ty <= y1 ? `<circle class="tv-wrong" cx="${X(tx)}" cy="${Y(ty)}" r="5"/>` : "";
      return `${wrong}<circle class="tv-dot" cx="${X(c.x)}" cy="${Y(c.y)}" r="4.5"/>`;
    }).join("");
    return `<svg class="tv-axes" viewBox="-8 -6 ${W + 16} ${H + 12}">
      <line class="tv-axis" x1="0" y1="${Y(0)}" x2="${W}" y2="${Y(0)}"/><line class="tv-axis" x1="${X(0)}" y1="0" x2="${X(0)}" y2="${H}"/>
      <text class="tv-name" x="${W}" y="${Y(0) - 5}" text-anchor="end">x</text><text class="tv-name" x="${X(0) + 6}" y="8">y</text>
      ${g}<clipPath id="tv-clip"><rect x="0" y="0" width="${W}" height="${H}"/></clipPath>
      <polyline class="tv-graph" clip-path="url(#tv-clip)" points="${pts.join(" ")}"/>${dots}</svg>`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    vals = round.cols.map(() => "");
    active = 0;
    busy = false;
    const cell = (c, i, k) => (c.ask === k ? `<button type="button" class="tv-slot" data-slot="${i}"></button>` : sg(c[k]));
    body.innerHTML = `
      <p class="prompt tv-prompt">${round.inverse ? "Completa la tabla (x e y)" : "Completa la tabla de valores"}</p>
      <div class="tv-cuaderno">
        <div class="tv-formula">${formula(round.f, "<i>x</i>").replace(/^y/, "<i>y</i>")}</div>
        <table class="tv-table">
          <tr><th><i>x</i></th>${round.cols.map((c, i) => `<td>${cell(c, i, "x")}</td>`).join("")}</tr>
          <tr><th><i>y</i></th>${round.cols.map((c, i) => `<td>${cell(c, i, "y")}</td>`).join("")}</tr>
        </table>
        <div class="tv-plot" data-plot><svg class="tv-axes tv-empty" viewBox="0 0 246 162"><line class="tv-axis" x1="0" y1="81" x2="246" y2="81"/><line class="tv-axis" x1="123" y1="0" x2="123" y2="162"/></svg></div>
      </div>
      <div class="keypad tv-keypad" data-keypad></div>
      <button type="button" class="choice-btn keypad-sign tv-sign" data-sign>${M} cambiar signo</button>
      <div class="feedback tv-feedback" data-feedback></div>`;
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
    body.querySelector("[data-sign]").addEventListener("click", () => pressKey("±"));
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      b.textContent = vals[+b.dataset.slot].replace("-", M);
      b.classList.toggle("active", !busy && +b.dataset.slot === active);
    });
  }
  const filled = (v) => /\d/.test(v);
  const say = (html, cls) => {
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = html;
    fb.className = `feedback tv-feedback ${cls}`;
  };

  function pressKey(key) {
    if (finished) return;
    if (busy) return key === "✓" && body.querySelector("[data-next]")?.click();
    const v = vals[active];
    if (key === "✓") {
      if (vals.every(filled)) return check();
      if (!filled(v)) return say("Escribe un número en la casilla marcada", "bad");
      for (let k = 1; k <= vals.length; k++) if (!filled(vals[(active + k) % vals.length])) { active = (active + k) % vals.length; break; }
    } else if (key === "⌫") vals[active] = v === "-" ? "" : v.slice(0, -1);
    else if (key === "±") vals[active] = v.startsWith("-") ? v.slice(1) : "-" + v;
    else if (v.replace("-", "").length < 3) vals[active] = v + key;
    say("", "");
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    const typed = vals.map(Number);
    let allOk = true, firstBad = -1;
    round.cols.forEach((c, i) => {
      const want = c[c.ask], b = body.querySelector(`[data-slot="${i}"]`), ok = typed[i] === want;
      allOk &&= ok;
      if (!ok && firstBad < 0) firstBad = i;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${vals[i].replace("-", M)}</s><b>${sg(want)}</b>`;
    });
    body.querySelector("[data-plot]").innerHTML = axes(round.cols, typed);
    const shape = round.f.kind === "lin" ? "los puntos están en una recta" : "los puntos forman una parábola";
    // Si hay un fallo, el 💡 explica justo esa columna.
    const c = firstBad >= 0 ? round.cols[firstBad] : null;
    const hint = c ? explain(round.f, c.x, c.y, c.ask === "x") : round.hint;
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      say(`✓ 💡 ${hint}; ${shape}`, "ok");
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      say(`✗ 💡 ${hint}<button class="primary tv-next" data-next>${lives <= 0 ? "Ver resultado →" : "Siguiente →"}</button>`, "bad");
      body.querySelector("[data-next]").addEventListener("click", () => (lives <= 0 ? finish(false) : nextRound()));
    }
  }

  // Teclado físico: cifras, retroceso, Enter, "-" para el signo.
  const onKey = (e) => {
    if (finished) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else if (e.key === "-") pressKey("±");
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
    saveScore(client, "tablavalores", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📈</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} tablas completas de ${rounds}</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>`;
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
