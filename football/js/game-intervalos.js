// "Intervalos": una mini recta de −6 a 6 y la escritura del intervalo como
// en el libro, "[ □ , □ )". Dos sentidos: (a) la recta viene pintada
// (extremos ○ o ●) y se escriben los números con el teclado y se tocan los
// corchetes para abrirlos o cerrarlos; (b) viene escrito "(−2, 3]" y se
// construye en la recta tocando los dos extremos (tocar un extremo lo
// llena o lo vacía). Después llegan las semirrectas ([2, +∞)) y el paso de
// desigualdad a intervalo. 💡 "Corchete = el extremo entra (punto lleno);
// paréntesis = no entra".
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const X = "<i>x</i>";
const neg = (n) => String(n).replace("-", M);
const H = (t) => String(t).replace(/</g, "&lt;").replace(/>/g, "&gt;");
const MIN = -6, MAX = 6;
// Escritura del libro: "(−2, 3]", "[2, +∞)".
export const write = (iv) => `${iv.loIn ? "[" : "("}${iv.lo === null ? `${M}∞` : neg(iv.lo)}, ${iv.hi === null ? "+∞" : neg(iv.hi)}${iv.hiIn ? "]" : ")"}`;
// La misma idea como desigualdad: "−1 < x ≤ 4", "x ≥ 2".
const ineq = (iv) =>
  iv.lo !== null && iv.hi !== null ? `${neg(iv.lo)} ${iv.loIn ? "≤" : "<"} ${X} ${iv.hiIn ? "≤" : "<"} ${neg(iv.hi)}`
    : iv.lo !== null ? `${X} ${iv.loIn ? "≥" : ">"} ${neg(iv.lo)}` : `${X} ${iv.hiIn ? "≤" : "<"} ${neg(iv.hi)}`;
const said = (v, inc, sym) => `el ${neg(v)} ${inc ? "sí" : "no"} entra (${sym ? `${sym}, ` : ""}${inc ? "●" : "○"})`;

// Niveles: 0 cerrados · 1 cerrados o abiertos · 2 mixtos · 3 semirrectas ·
// 4 de desigualdad a intervalo. En 0-2 se alterna leer la recta / dibujar.
export function buildRound(level) {
  const lo = randInt(-5, 2), hi = randInt(lo + 2, 5);
  let iv, mode;
  if (level <= 2) {
    mode = Math.random() < 0.5 ? "leer" : "dibujar";
    let a, b;
    if (level === 0) a = b = true;
    else if (level === 1) a = b = Math.random() < 0.4;
    else do { a = Math.random() < 0.5; b = Math.random() < 0.5; } while (a === b && Math.random() < 0.6);
    iv = { lo, loIn: a, hi, hiIn: b };
  } else {
    mode = level === 3 ? "leer" : "desig";
    const v = randInt(-4, 4), inc = Math.random() < 0.5;
    if (level === 4 && Math.random() < 0.4) iv = { lo, loIn: Math.random() < 0.5, hi, hiIn: Math.random() < 0.5 };
    else iv = Math.random() < 0.5 ? { lo: v, loIn: inc, hi: null, hiIn: false } : { lo: null, loIn: false, hi: v, hiIn: inc };
  }
  const parts = [];
  const d = mode === "desig", ray = iv.hi === null;
  if (iv.lo !== null) parts.push(said(iv.lo, iv.loIn, d && (ray ? (iv.loIn ? "≥" : ">") : iv.loIn ? "≤" : "<")));
  if (iv.hi !== null) parts.push(said(iv.hi, iv.hiIn, d && (iv.hiIn ? "≤" : "<")));
  const inf = iv.lo === null || iv.hi === null ? ". El infinito no es un número y nunca entra: siempre paréntesis" : "";
  const hint = `Corchete = el extremo entra (punto lleno); paréntesis = no entra (punto hueco). ${d ? `En ${ineq(iv)}, ` : "Aquí "}${parts.join(" y ")}${inf} → ${write(iv)}`;
  return { level, mode, iv, text: write(iv), ineq: ineq(iv), hint: H(hint).replace(/&lt;(\/?i)&gt;/g, "<$1>") };
}

export function mountIntervalosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, ends, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body iv-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const filled = (v) => v !== "" && v !== "-";
  const W = 340, px = (v) => 20 + ((v - MIN) * (W - 40)) / (MAX - MIN);

  // La recta con lo pintado: [{ iv, cls, dy }]; un extremo suelto (al
  // dibujar) es un iv con lo === hi.
  function recta(list) {
    let g = `<line class="iv-axis" x1="4" y1="34" x2="${W - 4}" y2="34"/>`;
    for (let v = MIN; v <= MAX; v++) g += `<line class="iv-tick" x1="${px(v)}" y1="28" x2="${px(v)}" y2="40"/><text x="${px(v)}" y="58">${neg(v)}</text>`;
    list.forEach(({ iv, cls, dy }) => {
      const y = 34 + dy, x1 = iv.lo === null ? 4 : px(iv.lo), x2 = iv.hi === null ? W - 4 : px(iv.hi);
      g += `<g class="${cls}"><line class="iv-seg" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>`;
      [[iv.lo, iv.loIn, x1, 1], [iv.hi, iv.hiIn, x2, -1]].forEach(([v, inc, xx, dir], k) => {
        if (v === null) g += `<path class="iv-arrow" d="M${xx + 9 * dir} ${y - 6} L${xx} ${y} L${xx + 9 * dir} ${y + 6}"/>`;
        else if (k === 0 || iv.lo !== iv.hi) g += `<circle class="${inc ? "iv-full" : "iv-hollow"}" cx="${xx}" cy="${y}" r="7"/>`;
      });
      g += "</g>";
    });
    return `<svg class="iv-recta${round.mode === "dibujar" && !busy ? " iv-touch" : ""}" viewBox="0 0 ${W} 64" data-svg>${g}</svg>`;
  }

  // Lo que ha dibujado el jugador, como intervalo (o null si no hay nada).
  function drawn() {
    if (!ends.length) return null;
    const [a, b = a] = [...ends].sort((p, q) => p.v - q.v);
    return { lo: a.v, loIn: a.inc, hi: b.v, hiIn: b.inc };
  }

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.text;
    do round = buildRound(Math.min(4, Math.floor(hits / 2))); while (round.text === last);
    typed = { lo: "", hi: "", lb: "", rb: "" };
    active = round.iv.lo === null ? "hi" : "lo";
    ends = [];
    busy = false;
    const { iv, mode } = round;
    const num = (k) => (iv[k] === null ? `<span class="iv-inf">${k === "lo" ? `${M}∞` : "+∞"}</span>` : `<button type="button" class="iv-slot" data-slot="${k}"></button>`);
    const writeRow = `<div class="iv-write"><button type="button" class="iv-br" data-br="lb"></button>${num("lo")}<span class="iv-comma">,</span>${num("hi")}<button type="button" class="iv-br" data-br="rb"></button></div>`;
    const prompt = { leer: "Escribe el intervalo pintado", dibujar: "Dibuja el intervalo en la recta", desig: "Escríbelo como intervalo" }[mode];
    body.innerHTML = `
      <p class="prompt iv-prompt">${prompt}</p>
      <div class="iv-cuaderno">
        ${mode === "dibujar" ? `<div class="iv-given">${round.text}</div>` : mode === "desig" ? `<div class="iv-given">${H(round.ineq).replace(/&lt;(\/?i)&gt;/g, "<$1>")}</div>` : ""}
        <div data-recta></div>
        ${mode === "dibujar" ? `<p class="iv-help">Toca los dos extremos; toca un extremo para llenarlo ● o vaciarlo ○</p>` : writeRow}
      </div>
      ${mode === "dibujar" ? `<button type="button" class="primary iv-check" data-ok>✓ Comprobar</button>` : `<div class="keypad iv-keypad" data-keypad></div>
      <button type="button" class="choice-btn keypad-sign iv-sign" data-sign>${M} cambiar signo</button>`}
      <div class="feedback iv-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = b.dataset.slot), paint())));
    // Los corchetes se abren y se cierran tocándolos: vacío → [ → ( → [ …
    body.querySelectorAll("[data-br]").forEach((b) =>
      b.addEventListener("click", () => {
        if (busy || finished) return;
        const k = b.dataset.br, [c, o] = k === "lb" ? ["[", "("] : ["]", ")"];
        typed[k] = typed[k] === c ? o : c;
        paint();
      })
    );
    const pad = body.querySelector("[data-keypad]");
    if (pad) {
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
        btn.textContent = key;
        btn.addEventListener("click", () => pressKey(key));
        pad.appendChild(btn);
      });
      body.querySelector("[data-sign]").addEventListener("click", () => pressKey("±"));
    }
    body.querySelector("[data-ok]")?.addEventListener("click", () => pressKey("✓"));
    paint();
  }

  // Tocar la recta (modo dibujar): el punto más cercano de −6 a 6.
  function onTap(e) {
    if (busy || finished) return;
    const r = e.currentTarget.getBoundingClientRect();
    const v = Math.round(MIN + (((e.clientX - r.left) * (W / r.width) - 20) * (MAX - MIN)) / (W - 40));
    if (v < MIN || v > MAX) return;
    const hit = ends.find((p) => p.v === v);
    if (hit) hit.inc = !hit.inc;
    else if (ends.length < 2) ends.push({ v, inc: false });
    else ends.sort((p, q) => Math.abs(p.v - v) - Math.abs(q.v - v))[0].v = v; // mueve el extremo más cercano
    paint();
  }

  function paint() {
    const d = round.mode === "dibujar" ? drawn() : null;
    const list = round.mode === "leer" ? [{ iv: round.iv, cls: "iv-given-line", dy: 0 }] : d ? [{ iv: d, cls: "iv-mine", dy: 0 }] : [];
    body.querySelector("[data-recta]").innerHTML = recta(list);
    if (round.mode === "dibujar") body.querySelector("[data-svg]").addEventListener("pointerdown", onTap);
    body.querySelectorAll("[data-slot]").forEach((b) => {
      b.textContent = neg(typed[b.dataset.slot]);
      b.classList.toggle("active", b.dataset.slot === active);
    });
    body.querySelectorAll("[data-br]").forEach((b) => (b.textContent = typed[b.dataset.br]));
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (round.mode === "dibujar") return;
    const t = typed[active];
    if (key === "±") typed[active] = t.startsWith("-") ? t.slice(1) : "-" + t;
    else if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.replace("-", "").length < 2) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const { iv } = round;
    const nums = ["lo", "hi"].filter((k) => iv[k] !== null);
    if (round.mode === "dibujar" && ends.length < 2) {
      feedback.textContent = "Toca los dos extremos en la recta";
      feedback.className = "feedback bad iv-feedback";
      return;
    }
    if (round.mode !== "dibujar" && !nums.every((k) => filled(typed[k]))) {
      if (filled(typed[active])) { active = nums.find((k) => !filled(typed[k])); return paint(); }
      feedback.textContent = "Escribe el número en la casilla";
      feedback.className = "feedback bad iv-feedback";
      return;
    }
    if (round.mode !== "dibujar" && (!typed.lb || !typed.rb)) {
      feedback.textContent = "Toca los corchetes para elegir [ o (";
      feedback.className = "feedback bad iv-feedback";
      return;
    }
    busy = true;
    rounds++;
    let ok = true, mine = null;
    if (round.mode === "dibujar") {
      mine = drawn();
      ok = ["lo", "hi", "loIn", "hiIn"].every((k) => mine[k] === iv[k]);
    } else {
      const want = { lo: iv.lo, hi: iv.hi, lb: iv.loIn ? "[" : "(", rb: iv.hiIn ? "]" : ")" };
      body.querySelectorAll("[data-slot],[data-br]").forEach((s) => {
        const k = s.dataset.slot || s.dataset.br;
        const good = s.dataset.slot ? Number(typed[k]) === want[k] : typed[k] === want[k];
        ok = ok && good;
        s.classList.remove("active");
        s.classList.add(good ? "good" : "bad");
        if (!good) s.innerHTML = `<s>${neg(typed[k])}</s><span class="iv-want">${neg(want[k])}</span>`;
      });
    }
    // La recta acaba con la solución en verde (y lo dibujado, en rojo, si estaba mal).
    const list = mine && !ok ? [{ iv: mine, cls: "iv-ko", dy: -9 }, { iv, cls: "iv-ok", dy: 5 }] : [{ iv, cls: "iv-ok", dy: 0 }];
    body.querySelector("[data-recta]").innerHTML = recta(list);
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok iv-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      const why = mine ? `Has dibujado ${write(mine)}. ` : "";
      feedback.innerHTML = `${why}💡 ${round.hint} <button type="button" class="iv-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad iv-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", () => { clearTimeout(pending); after(); });
      pending = setTimeout(after, 3500);
    }
  }

  // Teclado físico: cifras, ⌫, Enter, "-" para el signo, [ ( ] ) y flechas.
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
    else if ("[(".includes(e.key) && round.mode !== "dibujar") { typed.lb = e.key; paint(); }
    else if ("])".includes(e.key) && round.mode !== "dibujar") { typed.rb = e.key; paint(); }
    else if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && round.iv.lo !== null && round.iv.hi !== null) { active = active === "lo" ? "hi" : "lo"; paint(); }
    else return;
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
    saveScore(client, "intervalos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📏</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} intervalos bien de ${rounds}</p>
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
    round = null;
    finished = false;
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
