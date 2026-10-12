// "La media": los datos como tarjetas (4 - 8 - 6), sus columnas en un
// gráfico pequeño y la fórmula escrita como en clase en papel
// cuadriculado: media = (4 + 8 + 6)/3 = □/3 = □. Se rellena la suma y
// luego el resultado (con coma si hace falta). Al responder, una raya
// horizontal marca el nivel de la media sobre las columnas. La inversa:
// "¿qué nota necesito en el 4.º examen para tener media 7?" → 7 × 4 = □,
// llevo 6 + 8 + 5 = □, me falta □.
import { randInt, pick, saveScore } from "./utils.js";

const CTX = [
  { t: "Notas de Lucía", min: 2, max: 10 },
  { t: "Goles en cada partido", min: 0, max: 7 },
  { t: "Libros leídos cada mes", min: 0, max: 9 },
  { t: "Horas de deporte por semana", min: 1, max: 12 },
];
// S/n con una cifra decimal como mucho, con coma: 26/4 → "6,5"
export const meanStr = (S, n) => (S % n === 0 ? String(S / n) : `${Math.floor(S / n)},${((S * 10) / n) % 10}`);
const cent = (t) => (/^\d*,?\d*$/.test(t) && /\d/.test(t) ? Math.round(Number(t.replace(",", ".")) * 100) : NaN);

// Niveles: 0 tres datos, media entera · 1 cuatro o cinco datos · 2 media
// con un decimal · 3 la nota que falta para una media (inversa) ·
// 4 mezcla de 1-3.
export function buildRound(level) {
  if (level >= 4) level = pick([1, 2, 3]);
  if (level === 3) {
    let known, N, t, S, x;
    do {
      known = Array.from({ length: randInt(3, 4) }, () => randInt(3, 10));
      N = known.length + 1;
      t = randInt(5, 8);
      S = known.reduce((s, v) => s + v, 0);
      x = t * N - S;
    } while (x < 1 || x > 10);
    const slots = [{ id: "T", want: String(t * N) }, { id: "S", want: String(S) }, { id: "x", want: String(x) }];
    const hint = `Para tener media ${t} en ${N} exámenes necesito ${t} × ${N} = ${t * N} puntos; llevo ${known.join(" + ")} = ${S}; me faltan ${t * N} − ${S} = ${x}`;
    return { inv: true, ctx: CTX[0], data: known, N, t, S, x, slots, mean: String(t), hint };
  }
  const ctx = pick(CTX);
  let data, S, n;
  for (;;) {
    n = level === 0 ? 3 : level === 1 ? randInt(4, 5) : pick([4, 5]);
    data = Array.from({ length: n }, () => randInt(ctx.min, ctx.max));
    S = data.reduce((s, v) => s + v, 0);
    if (data.every((v) => v === data[0])) continue;
    if (level <= 1 && S % n === 0) break;
    if (level === 2 && (n === 5 ? S % 5 !== 0 : S % 4 === 2)) break;
  }
  const mean = meanStr(S, n);
  const slots = [{ id: "S", want: String(S) }, { id: "m", want: mean }];
  const hint = `Sumo todo y divido entre cuántos hay: ${data.join(" + ")} = ${S}; ${S} : ${n} = ${mean}`;
  return { inv: false, ctx, data, N: n, S, slots, mean, hint };
}

export function mountMediaGame(container, { client, onExit }) {
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
    <div class="game-body me-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const onKey = (e) => {
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === "," || e.key === ".") pressKey(",");
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  };
  const slot = (id) => `<button type="button" class="me-slot" data-slot="${round.slots.findIndex((s) => s.id === id)}"></button>`;
  const frac = (a, b) => `<span class="me-frac"><span>${a}</span><span>${b}</span></span>`;

  // Columnas de los datos; con `line` se dibuja la raya de la media.
  function chart(line) {
    const vals = round.inv && line ? [...round.data, round.x] : round.data;
    const top = Math.max(...vals, round.inv ? round.t : 0) + 1, W = 250, H = 112, bw = Math.min(40, W / vals.length - 12);
    const y = (v) => H - 14 - ((H - 26) * v) / top;
    const cols = vals.map((v, i) => {
      const x = (W / vals.length) * (i + 0.5) - bw / 2;
      return `<rect class="me-col${round.inv && i === round.data.length ? " me-new" : ""}" x="${x}" y="${y(v)}" width="${bw}" height="${H - 14 - y(v)}" rx="3"/><text class="me-val" x="${x + bw / 2}" y="${y(v) - 3}">${v}</text>`;
    });
    const m = line ? cent(round.mean) / 100 : 0;
    const mean = line ? `<line class="me-line" x1="0" x2="${W}" y1="${y(m)}" y2="${y(m)}"/><text class="me-mlabel" x="${W + 4}" y="${y(m) + 4}">media ${round.mean}</text>` : "";
    return `<svg class="me-chart" viewBox="-33 -4 ${W + 99} ${H + 4}"><line class="me-axis" x1="0" x2="${W}" y1="${H - 14}" y2="${H - 14}"/>${cols.join("")}${mean}</svg>`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    const { data, N } = round;
    const cards = data.map((v) => `<span class="me-card">${v}</span>`).join(`<span class="me-dash">-</span>`) + (round.inv ? `<span class="me-dash">-</span><span class="me-card me-q">?</span>` : "");
    const sheet = round.inv
      ? `<div class="me-line1">${frac(`${data.join(" + ")} + ?`, N)}<span class="me-eq">= ${round.t}</span></div>
         <div class="me-step"><span>Total:</span> ${round.t} × ${N} = ${slot("T")}</div>
         <div class="me-step"><span>Llevo:</span> ${data.join(" + ")} = ${slot("S")}</div>
         <div class="me-step"><span>Me falta:</span> ${slot("x")}</div>`
      : `<div class="me-line1"><i>media</i> <span class="me-eq">=</span> ${frac(`${data.join(" + ")}`, N)}</div>
         <div class="me-line1"><span class="me-eq">=</span> ${frac(slot("S"), N)} <span class="me-eq">=</span> ${slot("m")}</div>`;
    body.innerHTML = `
      <p class="prompt me-prompt">${round.inv ? `¿Qué nota necesita Lucía en el ${N}.º examen para tener media ${round.t}?` : `${round.ctx.t}: calcula la media`}</p>
      <div class="me-cards">${cards}</div>
      <div data-chart>${chart(false)}</div>
      <div class="me-sheet me-cuaderno">${sheet}</div>
      <div class="keypad me-keypad" data-keypad></div>
      <div class="feedback me-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((s) => s.addEventListener("click", () => !busy && ((active = +s.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary me-ok" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const k = +s.dataset.slot;
      if (!busy) s.textContent = typed[k];
      s.classList.toggle("active", !busy && k === active);
    });
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    const t = typed[active];
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (key === ",") { if (round.slots[active].id === "m" && !t.includes(",")) typed[active] = (t || "0") + ","; }
    else if (t.length < 4) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const missing = typed.indexOf("");
    if (missing >= 0) {
      const silent = typed[active] !== "";
      active = missing;
      paint();
      if (!silent) {
        feedback.textContent = "Faltan casillas por rellenar";
        feedback.className = "feedback bad me-feedback";
      }
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((el) => {
      const k = +el.dataset.slot, want = round.slots[k].want;
      const ok = cent(typed[k]) === cent(want);
      allOk = allOk && ok;
      el.classList.add(ok ? "good" : "bad");
      el.innerHTML = ok ? typed[k] : `<s>${typed[k]}</s><i class="me-fix">${want}</i>`;
    });
    paint();
    body.querySelector("[data-chart]").innerHTML = chart(true);
    if (round.inv) body.querySelector(".me-q").textContent = round.x;
    const text = round.inv ? `Necesita un ${round.x}` : `Era ${round.S} : ${round.N} = ${round.mean}`;
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok me-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `${text}. 💡 ${round.hint} <button type="button" class="me-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad me-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 3000);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "media", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚖️</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} medias bien calculadas de ${rounds}</p>
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
