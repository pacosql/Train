// "Regla de tres": el planteamiento como en el libro, con las dos
// columnas de magnitudes, la raya bajo las cabeceras y la x en cursiva
// ("3 bolis → 6 € / 5 bolis → x €"), la cruz dibujada y debajo
// x = (5 × 6) / 3 = □ / 3 = □. Se rellena primero el producto (numerador)
// y luego el resultado con el teclado (tocar la casilla la enfoca; ✓ con
// la casilla llena salta a la siguiente). Niveles: directa entera →
// directa con decimales → porcentajes (100 → 80 / 15 → x) → inversa
// (multiplico en línea: x = 4 × 6 / 8) → mezcla.
import { randInt, pick, saveScore } from "./utils.js";

// Número a la española: coma decimal y punto de miles.
export const fmt = (n) => {
  const [i, d] = Math.abs(Math.round(n * 100) / 100).toFixed(2).split(".");
  const dd = d.replace(/0+$/, "");
  return (n < 0 ? "−" : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (dd ? "," + dd : "");
};
const near = (a, b) => Math.abs(a - b) < 1e-6;
const frac = (n, d) => `<span class="r3-frac"><span>${n}</span><span>${d}</span></span>`;
const X = `<i class="r3-x">x</i>`;

// Contextos: cabeceras de las columnas, unidad del resultado, rango del
// dato b, si admite decimales y el enunciado corto.
const DIRECTA = [
  { A: "Bolis", B: "€", u: "€", dec: true, b: [2, 12], q: (a, b, c) => `${a} bolis cuestan ${b} €. ¿Y ${c} bolis?` },
  { A: "Kilos", B: "€", u: "€", dec: true, b: [2, 15], q: (a, b, c) => `${a} kg de peras: ${b} €. ¿Y ${c} kg?` },
  { A: "Horas", B: "km", u: "km", dec: true, b: [60, 320], q: (a, b, c) => `Un tren: ${b} km en ${a} h. ¿Y en ${c} h?` },
  { A: "Litros", B: "€", u: "€", dec: true, b: [2, 20], q: (a, b, c) => `${a} l de aceite: ${b} €. ¿Y ${c} l?` },
  { A: "Personas", B: "Huevos", u: "huevos", dec: false, b: [2, 12], q: (a, b, c) => `${a} personas, ${b} huevos. ¿Y ${c} personas?` },
  { A: "Cajas", B: "Lápices", u: "lápices", dec: false, b: [6, 48], q: (a, b, c) => `${a} cajas traen ${b} lápices. ¿Y ${c} cajas?` },
];
const INVERSA = [
  { A: "Obreros", B: "Días", u: "días", q: (a, b, c) => `${a} obreros tardan ${b} días. ¿Y ${c} obreros?` },
  { A: "Grifos", B: "Horas", u: "h", q: (a, b, c) => `${a} grifos llenan la piscina en ${b} h. ¿Y ${c}?` },
  { A: "km/h", B: "Horas", u: "h", v: true, q: (a, b, c) => `A ${a} km/h tardo ${b} h. ¿Y a ${c} km/h?` },
  { A: "Personas", B: "Días", u: "días", q: (a, b, c) => `Comida: ${a} personas, ${b} días. ¿Y ${c} personas?` },
];

// Niveles: 0 directa entera · 1 directa con decimales · 2 porcentaje ·
// 3 inversa · 4 mezcla. Filas del planteamiento: a → b / c → x.
export function buildRound(level) {
  const kind = level === 4 ? pick([0, 1, 2, 3]) : level;
  let ctx, a, b, c, P, x, den;
  for (;;) {
    if (kind === 2) {
      ctx = { A: "%", B: "Cantidad", u: "" };
      a = 100; b = randInt(2, 50) * 10 + pick([0, 0, 5]); c = pick([5, 10, 12, 15, 20, 25, 30, 40, 60, 75]);
    } else if (kind === 3) {
      ctx = pick(INVERSA);
      if (ctx.v) { a = randInt(4, 12) * 10; c = randInt(4, 12) * 10; b = randInt(2, 9); }
      else { a = randInt(2, 12); c = randInt(2, 12); b = randInt(2, 30); }
    } else {
      ctx = pick(kind === 1 ? DIRECTA.filter((t) => t.dec) : DIRECTA);
      a = randInt(2, ctx.A === "Horas" ? 6 : 9); c = randInt(2, 12); b = randInt(...ctx.b);
    }
    if (a === c || a === b) continue;
    P = kind === 3 ? a * b : c * b; // producto en cruz (o en línea si es inversa)
    den = kind === 3 ? c : a;
    x = P / den;
    if (P > 9999 || x < (kind === 3 ? 2 : 1) || near(x, b)) continue;
    const exact = P % den === 0, cents = (P * 100) % den === 0;
    if (kind === 1 ? !exact && cents : kind === 2 ? (P * 10) % den === 0 : exact) break;
  }
  const inv = kind === 3;
  const low = (s) => s.toLowerCase();
  const badge = kind === 2 ? "Directa: tanto por ciento (de cada 100)"
    : inv ? `Inversa: a más ${low(ctx.A)}, menos ${low(ctx.B)}` : `Directa: a más ${low(ctx.A)}, más ${low(ctx.B)}`;
  const prompt = kind === 2 ? `¿Cuánto es el ${c} % de ${fmt(b)}?` : ctx.q(a, b, c);
  const prod = inv ? `${fmt(a)} × ${fmt(b)}` : `${fmt(c)} × ${fmt(b)}`;
  const hint = kind === 2
    ? `El ${c} % de ${fmt(b)}: multiplico en cruz y divido entre 100: ${c} × ${fmt(b)} = ${fmt(P)}, ${fmt(P)} ÷ 100 = ${fmt(x)}`
    : inv
      ? `Inversa: multiplico en línea y divido por el que queda: ${fmt(a)} × ${fmt(b)} = ${fmt(P)}, ${fmt(P)} ÷ ${fmt(c)} = ${fmt(x)} ${ctx.u}`
      : `Directa: multiplico en cruz y divido por el que queda: ${fmt(c)} × ${fmt(b)} = ${fmt(P)}, ${fmt(P)} ÷ ${fmt(a)} = ${fmt(x)} ${ctx.u}`;
  return {
    kind, inv, a, b, c, P, x, den, ctx, badge, prompt, hint: hint.trim(),
    line: `${X} = ${frac(prod, fmt(den))} = ${frac("{0}", fmt(den))} = {1}${ctx.u ? ` <span class="r3-u">${ctx.u}</span>` : ""}`,
    slots: [P, x],
  };
}

// El planteamiento: cabeceras, raya, dos filas con flechas y la cruz
// (directa) o el óvalo de la fila que se multiplica (inversa); el número
// por el que se divide va rodeado.
function plant(r) {
  const L = 72, R = 192, y1 = 64, y2 = 100;
  const t = (x, y, s, cls = "") => `<text x="${x}" y="${y}" class="${cls}">${s}</text>`;
  const mark = r.inv
    ? `<rect class="r3-mul" x="${L - 34}" y="${y1 - 19}" width="${R - L + 68}" height="28" rx="14"/>`
    : `<line class="r3-mul" x1="${L + 18}" y1="${y2 - 8}" x2="${R - 18}" y2="${y1 - 4}"/>`;
  const dv = r.inv ? [L, y2] : [L, y1];
  return `<svg class="r3-plant" viewBox="0 0 264 112" role="img" aria-label="planteamiento">
    ${t(L, 22, r.ctx.A, "r3-head")}${t(R, 22, r.ctx.B, "r3-head")}
    <line class="r3-raya" x1="22" y1="32" x2="242" y2="32"/>
    ${mark}<circle class="r3-div" cx="${dv[0]}" cy="${dv[1] - 7}" r="${String(r.inv ? r.c : r.a).length > 2 ? 23 : 17}"/>
    ${t(L, y1, fmt(r.a), "r3-num")}${t(132, y1, "→", "r3-arrow")}${t(R, y1, fmt(r.b), "r3-num")}
    ${t(L, y2, fmt(r.c), "r3-num")}${t(132, y2, "→", "r3-arrow")}${t(R, y2, "x", "r3-num r3-x")}
  </svg>`;
}

export function mountReglatresGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy, goNext = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body r3-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const fill = (s) => s.replace(/\{(\d+)\}/g, (_, k) => `<button type="button" class="r3-slot" data-slot="${k}"></button>`);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    goNext = null;
    const prev = round && JSON.stringify(round);
    do round = buildRound(Math.min(4, Math.floor(hits / 2)));
    while (JSON.stringify(round) === prev); // nunca la misma ronda dos veces seguidas
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt r3-prompt">${round.prompt}</p>
      <div class="r3-cuaderno">
        <div class="r3-badge${round.inv ? " r3-inv" : ""}">${round.badge}</div>
        ${plant(round)}
        <div class="r3-line">${fill(round.line)}</div>
      </div>
      <div class="keypad r3-keypad" data-keypad></div>
      <div class="feedback r3-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "⌫", "4", "5", "6", ",", "7", "8", "9", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary r3-ok" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      b.textContent = typed[+b.dataset.slot];
      b.classList.toggle("active", +b.dataset.slot === active);
    });
  }

  function say(text, cls) {
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = text;
    fb.className = `feedback r3-feedback ${cls}`;
    return fb;
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return enter();
    const t = typed[active];
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (key === ",") { if (!t.includes(",")) typed[active] = (t || "0") + ","; }
    else if (t.length < 7) typed[active] = t === "0" ? key : t + key;
    paint();
  }

  // ✓ con la casilla llena pasa al siguiente hueco; con todo lleno, corrige.
  function enter() {
    const n = typed.length;
    const next = [...Array(n).keys()].map((i) => (active + 1 + i) % n).find((i) => typed[i] === "");
    if (next === undefined) return check();
    if (typed[active] === "") return say("Escribe un número en la casilla marcada", "bad");
    active = next;
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot, want = round.slots[k];
      const ok = near(Number(typed[k].replace(",", ".")), want);
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[k]}</s><em class="r3-fix">${fmt(want)}</em>`;
    });
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      say(`✓ 💡 ${round.hint}`, "ok");
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      goNext = () => { clearTimeout(pending); goNext = null; lives <= 0 ? finish(false) : nextRound(); };
      say(`<i>x</i> = ${fmt(round.x)}${round.ctx.u ? " " + round.ctx.u : ""}. 💡 ${round.hint} <button type="button" class="r3-next" data-next>Siguiente →</button>`, "bad")
        .querySelector("[data-next]").addEventListener("click", goNext);
      pending = setTimeout(goNext, 4000);
    }
  }

  // Teclado físico: cifras, coma (o punto), borrar, Enter.
  function onKey(e) {
    if (finished || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter" && goNext) return e.preventDefault(), goNext();
    const key = /^[0-9]$/.test(e.key) ? e.key : e.key === "," || e.key === "." ? "," : e.key === "Backspace" ? "⌫" : e.key === "Enter" ? "✓" : null;
    if (key) { e.preventDefault(); pressKey(key); }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "reglatres", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚖️</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} reglas de tres bien resueltas de ${rounds}</p>
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
