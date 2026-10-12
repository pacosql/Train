// "Error absoluto y relativo" (4.º ESO): valor real y medida, y las
// cuentas del libro con casillas: Eₐ = |medida − real| = □, Eᵣ = Eₐ / real
// = □ y en % = □ %. Luego redondeos (3,14 frente a π = 3,1416) y, al final,
// dos medidas: se calculan sus errores relativos y se toca la mejor.
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
// Número con coma decimal (hasta 4 decimales) y punto de miles
export function fmt(x) {
  const [i, d] = String(Math.round(Math.abs(x) * 10000) / 10000).split(".");
  return (x < 0 ? M : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (d ? "," + d : "");
}
const UNITS = ["m", "kg", "s", "L", "cm", "g"];
const CONST = [["π", 31416], ["√2", 14142], ["√3", 17321], ["e", 27183], ["√5", 22361], ["√7", 26458]];

// Una medición "de libro": Eᵣ con 4 decimales como mucho (en %, 2 como mucho).
export function measure(maxPct = 20) {
  for (;;) {
    const R = pick([2, 4, 5, 8, 10, 20, 25, 40, 50, 80, 100, 125, 200, 250, 400, 500]);
    const eaC = pick([5, 10, 20, 25, 30, 40, 50, 100, 150, 200, 250, 300, 500]); // centésimas
    const er4 = (100 * eaC) / R; // Eᵣ en diezmilésimas
    if (!Number.isInteger(er4) || er4 < 10 || er4 > maxPct * 100) continue;
    const up = Math.random() < 0.5 || eaC >= 100 * R;
    const m = (R * 100 + (up ? eaC : -eaC)) / 100;
    return { R, m, ea: eaC / 100, er: er4 / 10000, pct: er4 / 100, u: pick(UNITS) };
  }
}
const why = (s) => `Eₐ = |${fmt(s.m)} − ${fmt(s.R)}| = ${fmt(s.ea)}; Eᵣ = ${fmt(s.ea)} / ${fmt(s.R)} = ${fmt(s.er)} = ${fmt(s.pct)} %`;

// Niveles: 0 absoluto · 1 relativo (decimal) · 2 en % · 3 redondeos ·
// 4 ¿qué medida es mejor? (menor error relativo, se toca).
export function buildRound(level) {
  if (level <= 2) {
    const s = measure();
    const slots = [{ id: "ea", want: s.ea }];
    if (level >= 1) slots.push({ id: "er", want: s.er });
    if (level >= 2) slots.push({ id: "pct", want: s.pct });
    const hint = [`Error absoluto: la diferencia, |${fmt(s.m)} − ${fmt(s.R)}| = ${fmt(s.ea)} ${s.u}`];
    if (level >= 1) hint.push(`relativo: cuánto representa respecto al real, ${fmt(s.ea)} / ${fmt(s.R)} = ${fmt(s.er)}${level >= 2 ? ` = ${fmt(s.pct)} %` : ""}`);
    return { kind: "med", level, s, slots, hint: hint.join("; ") };
  }
  if (level === 3) {
    let name, real, dec;
    do {
      [name, real] = Math.random() < 0.5 ? pick(CONST) : [null, randInt(10001, 99999)];
      dec = pick([1, 2]);
    } while (real % 10 === 0 || real % 10 ** (4 - dec) === 0 || real % 10 ** (4 - dec) === 5 * 10 ** (3 - dec));
    const p = 10 ** (4 - dec), ap = Math.round(real / p) * p; // en diezmilésimas
    const next = Math.floor(real / 10 ** (3 - dec)) % 10;
    const where = dec === 1 ? "décimas" : "centésimas";
    return {
      kind: "red", name, real: real / 10000, ap: ap / 10000, ea: Math.abs(ap - real) / 10000, where,
      slots: [{ id: "ap", want: ap / 10000 }, { id: "ea", want: Math.abs(ap - real) / 10000 }],
      hint: `Redondeo a las ${where}: miro la cifra siguiente (${next} ${next >= 5 ? "≥ 5, subo" : "< 5, se queda"}) → ${fmt(ap / 10000)}; Eₐ = |${fmt(ap / 10000)} − ${fmt(real / 10000)}| = ${fmt(Math.abs(ap - real) / 10000)}`,
    };
  }
  let a, b;
  do { a = measure(10); b = measure(10); }
  while (a.pct === b.pct || Math.max(a.pct, b.pct) < 1.5 * Math.min(a.pct, b.pct) || (Math.random() < 0.7 && (a.ea - b.ea) * (a.pct - b.pct) >= 0));
  const best = a.pct < b.pct ? "A" : "B";
  const trap = (a.ea - b.ea) * (a.pct - b.pct) < 0 ? " (aunque su error absoluto sea mayor)" : "";
  return {
    kind: "cmp", a, b, best, slots: [{ id: "A", want: a.pct }, { id: "B", want: b.pct }],
    hint: `A: ${why(a)}. B: ${why(b)}. Es mejor la ${best}: menor error relativo${trap}`,
  };
}

export function mountErroresGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, vals, active, phase, said;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats"><span class="lives" data-lives></span><span class="score" data-score>⭐ 0</span></div>
    </div>
    <div class="game-body er-body" data-body></div>`;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const slot = (i) => `<button type="button" class="er-slot" data-slot="${i}"></button>`;
  const fr = (n, d) => `<span class="er-frac"><span>${n}</span><span>${d}</span></span>`;
  const EA = `<span class="er-e">E<sub>a</sub></span>`, ER = `<span class="er-e">E<sub>r</sub></span>`;

  // La hoja de cada tipo de ronda
  function sheet() {
    const r = round;
    if (r.kind === "med") {
      const s = r.s;
      return `<div class="er-data"><span>Valor real: <b>${fmt(s.R)} ${s.u}</b></span><span>Medida: <b>${fmt(s.m)} ${s.u}</b></span></div>
        <div class="er-line">${EA} = |${fmt(s.m)} − ${fmt(s.R)}| = ${slot(0)} ${s.u}</div>
        ${r.level >= 1 ? `<div class="er-line">${ER} = ${fr(EA, "valor real")} = ${fr(EA, fmt(s.R))} = ${slot(1)}</div>` : ""}
        ${r.level >= 2 ? `<div class="er-line">${ER} en % = ${slot(2)} %</div>` : ""}`;
    }
    if (r.kind === "red") {
      return `<div class="er-data"><span>Valor real: <b>${r.name ? `${r.name} = ` : ""}${fmt(r.real)}</b></span></div>
        <div class="er-line">Redondeo a las ${r.where}: ${slot(0)}</div>
        <div class="er-line">${EA} = |aproximación − real| = ${slot(1)}</div>`;
    }
    const card = (k, s) => `<div class="er-card" data-card="${k}"><b>${k}</b> real ${fmt(s.R)} ${s.u} · medida ${fmt(s.m)} ${s.u}
        <div class="er-line">${ER} = ${slot(k === "A" ? 0 : 1)} %</div></div>`;
    return card("A", r.a) + card("B", r.b);
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    vals = round.slots.map(() => "");
    active = 0;
    phase = "fill";
    said = null;
    const prompt = round.kind === "med" ? (round.level ? "Calcula los errores" : "Calcula el error absoluto")
      : round.kind === "red" ? "Redondea y calcula el error" : "¿Qué medida es mejor?";
    body.innerHTML = `
      <p class="prompt er-prompt">${prompt}</p>
      <div class="er-cuaderno">${sheet()}</div>
      <div class="keypad er-keypad" data-keypad></div>
      <button type="button" class="choice-btn keypad-sign er-comma" data-comma>, coma decimal</button>
      <div class="feedback er-feedback" data-feedback></div>`;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => phase === "fill" && ((active = +b.dataset.slot), paint())));
    body.querySelectorAll("[data-card]").forEach((c) => c.addEventListener("click", () => {
      if (phase !== "ask") return;
      said = c.dataset.card;
      c.classList.add("er-said");
      check();
    }));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    body.querySelector("[data-comma]").addEventListener("click", () => pressKey(","));
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      b.textContent = vals[+b.dataset.slot];
      b.classList.toggle("active", phase === "fill" && +b.dataset.slot === active);
    });
  }
  const filled = (v) => /\d/.test(v);
  const say = (html, cls) => {
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = html;
    fb.className = `feedback er-feedback ${cls}`;
  };

  function pressKey(key) {
    if (finished) return;
    if (phase === "done") return key === "✓" && body.querySelector("[data-next]")?.click();
    if (phase !== "fill") return;
    const v = vals[active];
    if (key === "✓") {
      if (vals.every(filled)) {
        if (round.kind !== "cmp") return check();
        phase = "ask";
        body.querySelector(".er-cuaderno").classList.add("er-asking");
        paint();
        return say("Toca la medida mejor (A o B)", "");
      }
      if (!filled(v)) return say("Escribe un número en la casilla marcada", "bad");
      for (let k = 1; k <= vals.length; k++) if (!filled(vals[(active + k) % vals.length])) { active = (active + k) % vals.length; break; }
    } else if (key === "⌫") vals[active] = v.slice(0, -1);
    else if (key === ",") { if (!v.includes(",")) vals[active] = (v || "0") + ","; }
    else if (v.length < 7) vals[active] = v + key;
    say("", "");
    paint();
  }

  function check() {
    phase = "done";
    rounds++;
    let allOk = true;
    round.slots.forEach((s, i) => {
      const b = body.querySelector(`[data-slot="${i}"]`);
      const ok = Math.abs(Number(vals[i].replace(",", ".")) - s.want) < 1e-9;
      allOk &&= ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${vals[i]}</s><b>${fmt(s.want)}</b>`;
    });
    if (round.kind === "cmp") {
      body.querySelectorAll("[data-card]").forEach((c) => c.dataset.card === round.best ? c.classList.add("er-best") : c.dataset.card === said && c.classList.add("er-worse"));
      allOk &&= said === round.best;
    }
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      say(`✓ 💡 ${round.hint}`, "ok");
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      say(`✗ 💡 ${round.hint}<button class="primary er-next" data-next>${lives <= 0 ? "Ver resultado →" : "Siguiente →"}</button>`, "bad");
      body.querySelector("[data-next]").addEventListener("click", () => (lives <= 0 ? finish(false) : nextRound()));
    }
  }

  // Teclado físico: cifras, coma (o punto), retroceso y Enter.
  const onKey = (e) => {
    if (finished) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "," || e.key === ".") pressKey(",");
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
    saveScore(client, "errores", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📏</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cálculos de error bien hechos de ${rounds}</p>
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
