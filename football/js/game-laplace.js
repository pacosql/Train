// "Regla de Laplace": se dibuja la bolsa con sus bolas, los seis lados del
// dado o la baraja española (40 cartas: oros, copas, espadas y bastos, del
// 1 al 7 más sota, caballo y rey) y debajo la regla del libro
// "P(A) = casos favorables / casos posibles" con casillas □/□. Vale la
// fracción sin simplificar o simplificada. Al corregir se rodean los casos
// favorables y el 💡 los cuenta: "Favorables: 3 rojas; posibles: 8 → 3/8".
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const M = "−";
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const fmt = (x) => String(Math.round(x * 1000) / 1000).replace(".", ",");
const fr = (a, b) => `<span class="lp-frac"><span>${a}</span><span>${b}</span></span>`;
// "3/8" y, si se puede, "= 3/8 simplificada".
const fracTxt = (f, p) => { const g = gcd(f, p); return g > 1 ? `${f}/${p} = ${f / g}/${p / g}` : `${f}/${p}`; };

const COLORS = { roja: "#e53935", azul: "#1e88e5", verde: "#43a047", amarilla: "#fbc02d" };
const SUITS = [["Oros", "#c99a06"], ["Copas", "#d32f2f"], ["Espadas", "#1e63c9"], ["Bastos", "#2e7d32"]];
const CARD = ["1", "2", "3", "4", "5", "6", "7", "S", "C", "R"]; // sota 10, caballo 11, rey 12
const DIE = [
  ["par", (v) => v % 2 === 0, "2, 4 y 6"], ["impar", (v) => v % 2 === 1, "1, 3 y 5"],
  ["mayor que 4", (v) => v > 4, "5 y 6"], ["menor que 3", (v) => v < 3, "1 y 2"],
  ["múltiplo de 3", (v) => v % 3 === 0, "3 y 6"], ["un 5", (v) => v === 5, "solo el 5"],
  ["primo", (v) => [2, 3, 5].includes(v), "2, 3 y 5"], ["mayor que 2", (v) => v > 2, "3, 4, 5 y 6"],
];
const DECK = [
  ["oros", (s) => s === 0, "las cartas de oros"], ["copas", (s) => s === 1, "las cartas de copas"],
  ["espadas", (s) => s === 2, "las cartas de espadas"], ["bastos", (s) => s === 3, "las cartas de bastos"],
  ["figura", (s, i) => i >= 7, "las figuras: sota, caballo y rey de cada palo"], ["as", (s, i) => i === 0, "los ases"],
  ["rey", (s, i) => i === 9, "los reyes"], ["sota", (s, i) => i === 7, "las sotas"],
  ["as de copas", (s, i) => s === 1 && i === 0, "una sola carta"], ["rey de oros", (s, i) => s === 0 && i === 9, "una sola carta"],
  ["figura de espadas", (s, i) => s === 2 && i >= 7, "sota, caballo y rey de espadas"], ["un 7", (s, i) => i === 6, "los sietes"],
  ["menor que 4", (s, i) => i <= 2, "el 1, el 2 y el 3 de cada palo"], ["oros o copas", (s) => s <= 1, "oros y copas"],
];

// Bolsa: T bolas repartidas entre k colores (todas al menos 1).
function bag(T, k) {
  const names = shuffle(Object.keys(COLORS)).slice(0, k);
  const cnt = names.map(() => 1);
  for (let i = k; i < T; i++) cnt[randInt(0, k - 1)]++;
  const balls = shuffle(names.flatMap((c, i) => Array(cnt[i]).fill(c)));
  const ask = randInt(0, k - 1);
  return { kind: "bolsa", items: balls, label: names[ask], F: cnt[ask], P: T,
    why: `Favorables: ${cnt[ask]} ${cnt[ask] > 1 ? (names[ask] === "azul" ? "azules" : names[ask] + "s") : names[ask]}; posibles: ${T} bolas` };
}
function die() {
  const [label, f, list] = pick(DIE);
  const F = [1, 2, 3, 4, 5, 6].filter(f).length;
  return { kind: "dado", label, F, P: 6, test: f, why: `Favorables: ${list} (${F} cara${F > 1 ? "s" : ""}); posibles: 6 caras` };
}
function deck() {
  const [label, f, list] = pick(DECK);
  let F = 0;
  for (let s = 0; s < 4; s++) for (let i = 0; i < 10; i++) if (f(s, i)) F++;
  return { kind: "baraja", label, F, P: 40, test: f, why: `Favorables: ${list} (${F}); posibles: 40 cartas` };
}

// Niveles: 0 bolsa · 1 dado · 2 baraja · 3 suceso contrario P(no A) ·
// 4 la probabilidad también en % (solo las que dan ≤ 1 decimal).
export function buildRound(level) {
  let e;
  if (level === 0) e = bag(randInt(4, 12), randInt(2, 3));
  else if (level === 1) e = die();
  else if (level === 2) e = deck();
  else if (level === 3) e = pick([() => bag(randInt(5, 15), randInt(2, 4)), die, deck])();
  else do e = pick([() => bag(pick([4, 5, 8, 10, 16, 20]), randInt(2, 4)), die, deck])(); while ((1000 * e.F) % e.P !== 0);
  const { F, P, label } = e;
  const P_ = `<i>P</i>`;
  const law = `<div class="lp-row lp-law">${P_}(<i>A</i>) = ${fr("casos favorables", "casos posibles")}</div>`;
  let html, answers, hint = `${e.why} → ${fracTxt(F, P)}`;
  if (level === 3) {
    html = law + `<div class="lp-row">${P_}(no ${label}) = 1 ${M} ${P_}(${label})</div><div class="lp-row">= 1 ${M} ${fr("[0]", "[1]")} = ${fr("[2]", "[3]")}</div>`;
    answers = [F, P, P - F, P];
    hint += `; ${P_}(no ${label}) = 1 ${M} ${F}/${P} = ${fracTxt(P - F, P)}`;
  } else if (level === 4) {
    html = law + `<div class="lp-row">${P_}(${label}) = ${fr("[0]", "[1]")} = [2] %</div>`;
    answers = [F, P, (100 * F) / P];
    hint += `; ${F} : ${P} = ${fmt(F / P)} → ${fmt((100 * F) / P)} %`;
  } else {
    html = law + `<div class="lp-row">${P_}(${label}) = ${fr("[0]", "[1]")}</div>`;
    answers = [F, P];
  }
  return { ...e, level, html, answers, hint, prompt: e.kind === "bolsa" ? "Sacas una bola sin mirar" : e.kind === "dado" ? "Tiras un dado" : "Sacas una carta de la baraja" };
}

// Corrección: cada pareja □/□ vale si es equivalente a la buena.
function grade(r, v) {
  const eq = (i, f) => v[i + 1] > 0 && v[i] * r.P === f * v[i + 1];
  const g = Array(r.answers.length).fill(false);
  g[0] = g[1] = eq(0, r.F);
  if (r.level === 3) g[2] = g[3] = eq(2, r.P - r.F);
  if (r.level === 4) g[2] = Math.abs(v[2] - r.answers[2]) < 1e-9;
  return g;
}
export { grade };

// Dibujo de la bolsa, el dado o la baraja; fav = rodear los favorables.
function picture(r, fav) {
  const mark = (on) => (fav && on ? " lp-fav" : "");
  if (r.kind === "bolsa") {
    const n = r.items.length, cols = Math.ceil(Math.sqrt(n * 1.6)), rows = Math.ceil(n / cols);
    const w = cols * 30 + 36, h = rows * 30 + 36, x0 = (300 - w) / 2;
    const balls = r.items.map((c, i) =>
      `<circle class="lp-ball${mark(c === r.label)}" cx="${x0 + 33 + (i % cols) * 30}" cy="${52 + Math.floor(i / cols) * 30}" r="12" fill="${COLORS[c]}"/>`).join("");
    // Saco: cuerpo redondeado y cuello atado con un cordel en el centro.
    return `<svg class="lp-pic" viewBox="0 0 300 ${h + 20}"><path class="lp-bag" d="M128 24 Q${x0 + 6} 24 ${x0} 56 L${x0} ${h} Q${x0} ${h + 16} ${x0 + 24} ${h + 16} L${x0 + w - 24} ${h + 16} Q${x0 + w} ${h + 16} ${x0 + w} ${h} L${x0 + w} 56 Q${x0 + w - 6} 24 172 24 L162 14 L170 4 L130 4 L138 14 Z"/><path class="lp-tie" d="M136 15 L164 15 M150 15 q-14 -10 -18 2 M150 15 q14 -10 18 2"/>${balls}</svg>`;
  }
  if (r.kind === "dado") {
    const PIPS = { 1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]], 5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]] };
    return `<svg class="lp-pic" viewBox="0 0 300 60">${[1, 2, 3, 4, 5, 6].map((v, i) => `<g transform="translate(${6 + i * 49} 6)"><rect class="lp-die${mark(r.test(v))}" width="44" height="44" rx="8"/>${PIPS[v].map(([a, b]) => `<circle class="lp-pip" cx="${10 + a * 12}" cy="${10 + b * 12}" r="4.2"/>`).join("")}</g>`).join("")}</svg>`;
  }
  let g = "";
  SUITS.forEach(([name, col], s) => {
    g += `<text class="lp-suit" x="2" y="${s * 40 + 27}" fill="${col}">${name}</text>`;
    CARD.forEach((c, i) => {
      g += `<g transform="translate(${64 + i * 23.5} ${s * 40 + 4})"><rect class="lp-card${mark(r.test(s, i))}" width="21" height="34" rx="3" stroke="${col}"/><text class="lp-cardtxt" x="10.5" y="23" fill="${col}">${c}</text></g>`;
    });
  });
  return `<svg class="lp-pic" viewBox="0 0 300 164">${g}</svg><div class="lp-legend">S = sota · C = caballo · R = rey</div>`;
}

export function mountLaplaceGame(container, { client, onExit }) {
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
    <div class="game-body lp-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const valid = (t) => /^\d+(,\d+)?$/.test(t);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.html + round.label;
    do round = buildRound(Math.min(4, Math.floor(hits / 3))); while (round.html + round.label === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt lp-prompt">${round.prompt}</p>
      <div class="lp-cuaderno">
        <div data-pic>${picture(round, false)}</div>
        ${round.html.replace(/\[(\d+)\]/g, (_, k) => `<button type="button" class="lp-slot" data-slot="${k}"></button>`)}
      </div>
      <div class="keypad lp-keypad" data-keypad></div>
      <div class="feedback lp-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary lp-ok" : ""}`;
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

  function pressKey(key) {
    if (finished || busy) return;
    const t = typed[active];
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (key === ",") typed[active] = t.includes(",") ? t : (t || "0") + ",";
    else if (t.length < 5) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    if (!typed.every(valid)) {
      // ✓ con la casilla llena: el foco salta a la siguiente vacía (en orden).
      if (valid(typed[active])) {
        active = typed.map((_, k) => (active + 1 + k) % typed.length).find((k) => !valid(typed[k]));
        return paint();
      }
      feedback.textContent = "Escribe un número en la casilla";
      feedback.className = "feedback bad lp-feedback";
      return;
    }
    busy = true;
    rounds++;
    const g = grade(round, typed.map((t) => Number(t.replace(",", "."))));
    const ok = g.every(Boolean);
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const i = +s.dataset.slot;
      s.classList.remove("active");
      s.classList.add(g[i] ? "good" : "bad");
      if (!g[i]) s.innerHTML = `<s>${typed[i]}</s><span class="lp-want">${fmt(round.answers[i])}</span>`;
    });
    body.querySelector("[data-pic]").innerHTML = picture(round, true);
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok lp-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.innerHTML = `💡 ${round.hint} <button type="button" class="lp-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad lp-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", () => { clearTimeout(pending); after(); });
      pending = setTimeout(after, 4000);
    }
  }

  // Teclado físico: cifras, coma (o punto), ⌫, Enter y flechas.
  function onKey(e) {
    if (finished || !round) return;
    if (busy) {
      if (e.key === "Enter") body.querySelector("[data-next]")?.click();
      return;
    }
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "," || e.key === ".") pressKey(",");
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
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
    saveScore(client, "laplace", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎲</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} probabilidades bien calculadas de ${rounds}</p>
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
