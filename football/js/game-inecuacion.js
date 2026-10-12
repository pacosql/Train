// "Inecuaciones": la inecuación escrita como en el libro ("2x + 1 > 7") y
// debajo se resuelve en línea igual que una ecuación: "2x > □" → "x □ □".
// Los números se escriben con el teclado; el signo del resultado se toca
// entre cuatro fichas (<, ≤, >, ≥). Una mini recta pinta la solución
// mientras se escribe (punto hueco o lleno). El 💡 repite los pasos y
// avisa cuando al dividir entre un negativo la desigualdad cambia de sentido.
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const X = "<i>x</i>";
const SIGNS = ["<", "≤", ">", "≥"];
const FLIP = { "<": ">", ">": "<", "≤": "≥", "≥": "≤" };
const H = (t) => String(t).replace(/</g, "&lt;").replace(/>/g, "&gt;");
const neg = (n) => String(n).replace("-", M);
const nz = (a, b) => { let v; do v = randInt(a, b); while (v === 0); return v; };
const ax = (a) => (a === 1 ? X : a === -1 ? `${M}${X}` : `${neg(a)}${X}`);
// a·x + b, a veces escrito "b − 3x" como en el libro.
const expr = (a, b, swap) => (b === 0 ? ax(a) : swap ? `${b} ${M} ${ax(-a)}` : `${ax(a)} ${b < 0 ? M : "+"} ${Math.abs(b)}`);
const move = (b) => (b > 0 ? `Paso el ${b} restando` : `Paso el ${-b} sumando`);
const dot = (n, inc) => (inc ? `punto lleno en el ${neg(n)} porque también vale` : `punto hueco en el ${neg(n)} porque no vale`);

// Una desigualdad simple a·x + b (s) c con solución x (s') t entera.
function single(level) {
  const a = level === 0 ? 1 : level === 1 ? randInt(2, 6) : level === 2 ? (Math.random() < 0.65 ? -randInt(2, 6) : randInt(2, 6)) : nz(-6, 6);
  const t = level <= 1 ? randInt(1, 9) : nz(-7, 9);
  const b = level === 0 ? nz(-9, 9) : nz(-12, 12);
  const s = level >= 3 ? pick(SIGNS) : pick(["<", ">"]);
  const c = a * t + b;
  const fs = a < 0 ? FLIP[s] : s; // sentido final
  const swap = a < 0 && b > 0 && Math.random() < 0.4;
  const rows = [`<div class="in-eq">${expr(a, b, swap)} ${H(s)} ${neg(c)}</div>`];
  const answers = [], kinds = [];
  const slot = (v, k) => { answers.push(v); kinds.push(k); return `[${answers.length - 1}]`; };
  if (a !== 1) rows.push(`<div class="in-row">${ax(a)} ${H(s)} ${slot(a * t, "n")}</div>`);
  rows.push(`<div class="in-row">${X} ${slot(fs, "s")} ${slot(t, "n")}</div>`);
  const steps = [`${move(b)}: ${ax(a)} ${H(s)} ${neg(c)} ${b > 0 ? M : "+"} ${Math.abs(b)} = ${neg(a * t)}`];
  if (a > 1) steps.push(`Divido entre ${a}, que es positivo: el sentido no cambia → ${X} ${H(fs)} ${neg(t)}`);
  if (a < 0) steps.push(`Divido entre ${neg(a)}: al dividir entre un número negativo, la desigualdad cambia de sentido → ${X} ${H(fs)} ${neg(t)}`);
  if (a === 1) steps[0] = `${move(b)}: ${X} ${H(s)} ${neg(c)} ${b > 0 ? M : "+"} ${Math.abs(b)} → ${X} ${H(s)} ${neg(t)}`;
  const inc = fs === "≤" || fs === "≥";
  steps.push(`En la recta, ${dot(t, inc)}`);
  const sol = fs === ">" || fs === "≥" ? { lo: t, loIn: inc, hi: null } : { lo: null, hi: t, hiIn: inc };
  return { a, b, c, s, kind: "simple", rows, answers, kinds, sol, hint: steps.join("<br>") };
}

// Doble: L (s1) a·x + b (s2) R → l (s1) x (s2) r, con a > 0.
function double() {
  const a = pick([1, 1, 2, 3]), b = nz(-6, 6);
  const l = randInt(-6, 3), r = randInt(l + 2, 8);
  const s1 = pick(["<", "≤"]), s2 = pick(["<", "≤"]);
  const L = a * l + b, R = a * r + b;
  const answers = [], kinds = [];
  const slot = (v, k) => { answers.push(v); kinds.push(k); return `[${answers.length - 1}]`; };
  const rows = [`<div class="in-eq">${neg(L)} ${H(s1)} ${expr(a, b)} ${H(s2)} ${neg(R)}</div>`];
  if (a > 1) rows.push(`<div class="in-row">${slot(a * l, "n")} ${H(s1)} ${ax(a)} ${H(s2)} ${slot(a * r, "n")}</div>`);
  rows.push(`<div class="in-row">${slot(l, "n")} ${slot(s1, "s")} ${X} ${slot(s2, "s")} ${slot(r, "n")}</div>`);
  const op = b > 0 ? `Resto ${b}` : `Sumo ${-b}`;
  const steps = [`${op} en los tres miembros: ${neg(L)} ${b > 0 ? M : "+"} ${Math.abs(b)} ${H(s1)} ${ax(a)} ${H(s2)} ${neg(R)} ${b > 0 ? M : "+"} ${Math.abs(b)}${a > 1 ? ` → ${neg(a * l)} ${H(s1)} ${ax(a)} ${H(s2)} ${neg(a * r)}` : ""}`];
  if (a > 1) steps.push(`Divido los tres entre ${a}, que es positivo: el sentido no cambia`);
  steps.push(`${neg(l)} ${H(s1)} ${X} ${H(s2)} ${neg(r)}: ${dot(l, s1 === "≤")} y ${dot(r, s2 === "≤")}`);
  const sol = { lo: l, loIn: s1 === "≤", hi: r, hiIn: s2 === "≤" };
  return { a, b, kind: "doble", rows, answers, kinds, sol, hint: steps.join("<br>") };
}

// Niveles: 0 x + a > b · 1 ax + b < c (a > 0) · 2 con a negativo (cambia
// el sentido) · 3 también ≤ y ≥ (punto lleno) · 4 dobles "1 < x + 2 < 5".
export function buildRound(level) {
  return level >= 4 && Math.random() < 0.6 ? double() : single(Math.min(level, 3));
}

export function mountInecuacionGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats"><span class="lives" data-lives></span><span class="score" data-score>⭐ 0</span></div>
    </div>
    <div class="game-body in-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const filled = (v) => v !== "" && v !== "-";

  // Mini recta fija de −10 a 10 (no chiva la solución) con lo pintado
  // encima: rayo con flecha o segmento, extremos huecos o llenos y su número.
  function recta(sols) {
    const W = 330, px = (v) => 15 + ((Math.max(-10.6, Math.min(10.6, v)) + 10) * (W - 30)) / 20;
    let g = `<line class="in-axis" x1="2" y1="30" x2="${W - 2}" y2="30"/>`;
    for (let v = -10; v <= 10; v++) g += `<line class="in-tick" x1="${px(v)}" y1="${v % 5 ? 27 : 25}" x2="${px(v)}" y2="${v % 5 ? 33 : 35}"/>${v % 2 ? "" : `<text x="${px(v)}" y="48">${neg(v)}</text>`}`;
    sols.forEach(({ sol, cls, dy }) => {
      const y = 30 + dy, x1 = sol.lo === null ? 2 : px(sol.lo), x2 = sol.hi === null ? W - 2 : px(sol.hi);
      g += `<g class="${cls}"><line class="in-seg" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`;
      [[sol.lo, sol.loIn, x1, 1], [sol.hi, sol.hiIn, x2, -1]].forEach(([v, inc, xx, dir]) => {
        if (v === null) g += `<path class="in-arrow" d="M${xx + 8 * dir} ${y - 5} L${xx} ${y} L${xx + 8 * dir} ${y + 5}"/>`;
        else g += `<circle class="${inc ? "in-full" : "in-hollow"}" cx="${xx}" cy="${y}" r="5.5"/><text class="in-end" x="${xx}" y="${y - 9}">${neg(v)}</text>`;
      });
      g += "</g>";
    });
    return `<svg class="in-recta" viewBox="0 0 ${W} 52">${g}</svg>`;
  }

  // La solución que se lee en la última fila de casillas (si está completa).
  function typedSol() {
    const fin = round.kinds.map((k, i) => i).slice(round.kind === "doble" ? -4 : -2);
    const v = fin.map((i) => typed[i]);
    if (!v.every(filled)) return null;
    if (round.kind === "doble") {
      if (![v[1], v[2]].every((s) => s === "<" || s === "≤") || Number(v[0]) >= Number(v[3])) return null;
      return { lo: Number(v[0]), loIn: v[1] === "≤", hi: Number(v[3]), hiIn: v[2] === "≤" };
    }
    const n = Number(v[1]), inc = v[0] === "≤" || v[0] === "≥";
    return v[0] === ">" || v[0] === "≥" ? { lo: n, loIn: inc, hi: null } : { lo: null, hi: n, hiIn: inc };
  }

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.rows[0];
    do round = buildRound(Math.min(4, Math.floor(hits / 2))); while (round.rows[0] === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt in-prompt">Resuelve la inecuación</p>
      <div class="in-cuaderno">
        ${round.rows.join("").replace(/\[(\d+)\]/g, (_, k) => `<button type="button" class="in-slot${round.kinds[k] === "s" ? " in-sslot" : ""}" data-slot="${k}"></button>`)}
        <div data-recta></div>
      </div>
      <div class="in-chips">${SIGNS.map((s) => `<button type="button" class="in-chip" data-chip="${H(s)}">${H(s)}</button>`).join("")}</div>
      <div class="keypad in-keypad" data-keypad></div>
      <button type="button" class="choice-btn keypad-sign in-sign" data-sign>${M} cambiar signo</button>
      <div class="feedback in-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    body.querySelectorAll("[data-chip]").forEach((b) => b.addEventListener("click", () => pressKey(b.dataset.chip)));
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
      b.textContent = neg(typed[+b.dataset.slot]);
      b.classList.toggle("active", +b.dataset.slot === active);
    });
    const ts = typedSol();
    body.querySelector("[data-recta]").innerHTML = recta(ts ? [{ sol: ts, cls: "in-mine", dy: 0 }] : []);
  }

  // Siguiente casilla (en orden de lectura) del tipo pedido, desde la activa.
  const nextOf = (kind, from, emptyOnly) => {
    const n = typed.length;
    for (let d = 1; d <= n; d++) {
      const i = (from + d) % n;
      if (round.kinds[i] === kind && (!emptyOnly || typed[i] === "")) return i;
    }
    return -1;
  };

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (SIGNS.includes(key)) {
      const i = round.kinds[active] === "s" ? active : nextOf("s", active, true) >= 0 ? nextOf("s", active, true) : nextOf("s", active, false);
      typed[i] = key;
      const nx = typed.findIndex((t, k) => t === "" && k > i);
      active = nx >= 0 ? nx : i;
      return paint();
    }
    // Una cifra con una ficha de signo enfocada va a la casilla de número siguiente.
    if (round.kinds[active] === "s") {
      if (key === "⌫") { typed[active] = ""; return paint(); }
      active = nextOf("n", active, false);
    }
    const t = typed[active];
    if (key === "±") typed[active] = t.startsWith("-") ? t.slice(1) : "-" + t;
    else if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.replace("-", "").length < 3) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    if (!typed.every(filled)) {
      const wasFilled = filled(typed[active]);
      const i = typed.findIndex((t, k) => !filled(t) && k > active);
      active = i >= 0 ? i : typed.findIndex((t) => !filled(t));
      paint();
      if (wasFilled) return; // ✓ como Enter: pasa al siguiente hueco
      feedback.textContent = round.kinds[active] === "s" ? "Toca el signo: <, ≤, > o ≥" : "Escribe un número en la casilla";
      feedback.className = "feedback bad in-feedback";
      return;
    }
    busy = true;
    rounds++;
    let ok = true;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const i = +s.dataset.slot, want = round.answers[i];
      const good = round.kinds[i] === "s" ? typed[i] === want : Number(typed[i]) === want;
      ok = ok && good;
      s.classList.remove("active");
      s.classList.add(good ? "good" : "bad");
      if (!good) s.innerHTML = `<s>${H(neg(typed[i]))}</s><span class="in-want">${H(neg(want))}</span>`;
    });
    const ts = typedSol();
    body.querySelector("[data-recta]").innerHTML = recta(ok ? [{ sol: round.sol, cls: "in-ok", dy: 0 }] : [...(ts ? [{ sol: ts, cls: "in-ko", dy: -8 }] : []), { sol: round.sol, cls: "in-ok", dy: ts ? 4 : 0 }]);
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok in-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.innerHTML = `💡 ${round.hint} <button type="button" class="in-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad in-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", () => { clearTimeout(pending); after(); });
      pending = setTimeout(after, 3500);
    }
  }

  // Teclado físico: cifras, ⌫, Enter, "-" para el signo, < y > (con "="
  // detrás se convierten en ≤ / ≥) y flechas.
  function onKey(e) {
    if (finished || !round) return;
    if (busy) {
      if (e.key === "Enter") body.querySelector("[data-next]")?.click();
      return;
    }
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else if (e.key === "-") pressKey("±");
    else if (e.key === "<" || e.key === ">") pressKey(e.key);
    else if (e.key === "=") {
      const i = round.kinds[active] === "s" ? active : typed.findLastIndex((t, k) => round.kinds[k] === "s" && k < active && (t === "<" || t === ">"));
      if (i >= 0 && (typed[i] === "<" || typed[i] === ">")) typed[i] = typed[i] === "<" ? "≤" : "≥";
      paint();
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      active = (active + (e.key === "ArrowRight" ? 1 : typed.length - 1)) % typed.length;
      paint();
    } else return;
    e.preventDefault();
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "inecuacion", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚖️</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} inecuaciones resueltas de ${rounds}</p>
        <div class="end-actions"><button class="primary" data-retry>Jugar otra vez</button><button class="secondary" data-menu>Volver al menú</button></div>
      </div>
    `;
    body.querySelector("[data-retry]").addEventListener("click", start);
    body.querySelector("[data-menu]").addEventListener("click", onExit);
  }

  function start() {
    [lives, score, rounds, hits, round, finished] = [startLives, 0, 0, 0, null, false];
    window.removeEventListener("keydown", onKey);
    window.addEventListener("keydown", onKey);
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
