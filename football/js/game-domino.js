// "Dominó de fracciones": arriba la cadena de fichas con su extremo libre
// (p. ej. "1/2"); abajo, cuatro fichas en la mano con dos mitades cada una
// (fracción, dibujo de tarta, decimal o porcentaje). Se toca la ficha que
// tiene una mitad equivalente al extremo libre y se coloca en la cadena,
// girada para que esa mitad toque el extremo. Siempre encaja exactamente una.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
// Una mitad de ficha es { k: "frac" | "pie" | "dec" | "pct", n, d }: n/d es
// su valor exacto (en dec y pct d siempre divide a 1000 o a 100).
const same = (x, y) => x.n * y.d === y.n * x.d;
const simp = (h) => { const g = gcd(h.n, h.d); return { n: h.n / g, d: h.d / g }; };
const fmtNum = (x) => String(Math.round(x * 1000) / 1000).replace(".", ",");
export const decText = (h) => fmtNum(h.n / h.d);
export const pctText = (h) => `${fmtNum((100 * h.n) / h.d)} %`;
export const label = (h) => (h.k === "dec" ? decText(h) : h.k === "pct" ? pctText(h) : `${h.n}/${h.d}`);
const isDec = (v) => (1000 * v.n) % v.d === 0;
const isPct = (v) => (100 * v.n) % v.d === 0;

const PIE = [];
for (const d of [2, 3, 4, 5, 6, 8]) for (let n = 1; n < d; n++) PIE.push({ n, d });
const SIMPLE = (ds) => { const o = []; for (const d of ds) for (let n = 1; n < d; n++) if (gcd(n, d) === 1) o.push({ n, d }); return o; };
const DEC = SIMPLE([2, 4, 5, 10]).concat([{ n: 1, d: 20 }, { n: 3, d: 20 }, { n: 7, d: 20 }]);
// Por nivel: valores posibles del extremo libre, en qué forma puede estar
// escrito y en qué forma está la mitad que encaja.
const LEVELS = [
  { pool: PIE, open: ["frac"], match: () => ["pie"] },
  { pool: SIMPLE([2, 3, 4, 5, 6, 8, 10]), open: ["frac"], match: () => ["frac"] },
  { pool: DEC, open: ["frac", "dec"], match: (k) => [k === "dec" ? "frac" : "dec"] },
  { pool: DEC, open: ["frac", "dec", "pct"], match: (k) => (k === "pct" ? ["frac", "dec"] : ["pct"]) },
  { pool: SIMPLE([2, 3, 4, 5, 6, 8, 10]).concat(DEC.slice(-3)), open: ["frac", "dec", "pct", "pie"], match: (k) => ["frac", "dec", "pct", "pie"].filter((x) => x !== k || k === "frac") },
];
const fits = (v, k) => (k === "dec" ? isDec(v) : k === "pct" ? isPct(v) : k === "pie" ? simp(v).d <= 8 : true);
export const openOK = (h, lv) => LEVELS[lv].open.includes(h.k) && LEVELS[lv].pool.some((v) => same(v, h));

// Escribe el valor v en la forma k (la fracción, a veces amplificada).
function render(v, k, avoid) {
  const s = simp(v);
  if (k === "dec" || k === "pct") return { k, ...s };
  // La tarta de una fracción escrita se parte en tantos trozos como dice el denominador.
  if (k === "pie" && avoid && avoid.k === "frac" && avoid.d <= 8) return { k, n: avoid.n, d: avoid.d };
  const ks = [1, 2, 3, 4, 5].filter((m) => m * s.d <= (k === "pie" ? 8 : 30));
  for (const m of shuffle(ks)) {
    const h = { k, n: m * s.n, d: m * s.d };
    if (!avoid || label(h) !== label(avoid) || avoid.k !== k) return h;
  }
  return null;
}
// Mitades "casi" iguales al valor v: los errores típicos de la clase.
function nearMisses(o, k) {
  const { n: p, d: q } = simp(o), out = [];
  const add = (n, d) => n >= 1 && n < d && out.push({ k, n, d });
  if (k === "pie") [[o.n + 1, o.d], [o.n - 1, o.d], [o.n, o.d + 1], [o.n, o.d - 1], [o.d - o.n, o.d]].forEach(([n, d]) => d <= 10 && add(n, d));
  if (k === "frac") for (const m of [2, 3, 4]) [[p + m, q + m], [m * p, q + m], [m * p + 1, m * q], [m * p - 1, m * q], [m * p, m * q + 1], [q - p, q], [m * p, q]].forEach(([n, d]) => add(n, d));
  const digits = [`${p}${q}`, `${q}`, `${p}`, `0${p}`, `${q}${p}`].filter((t) => t.length <= 3);
  if (k === "dec") digits.forEach((t) => add(Number(t), 10 ** t.length));
  if (k === "pct") [`${p}${q}`, `${q}`, `${p}`, `${10 * p}`, `${q}${p}`].forEach((t) => Number(t) < 100 && add(Number(t), 100));
  if (k === "dec" || k === "pct") for (const x of [-10, -5, 5, 10]) add(Math.round((100 * p) / q) + x, 100);
  return out.map((h) => (k === "dec" || k === "pct" ? { k, ...simp(h) } : h)).filter((h) => !same(h, o) && fits(h, k));
}
// Una mitad cualquiera para el lado libre de una ficha, con valor distinto de o.
function freeHalf(o, lv, nextLv) {
  for (;;) {
    const v = pick(LEVELS[lv].pool), k = pick(LEVELS[lv].open);
    if (same(v, o) || !fits(v, k)) continue;
    const h = render(v, k);
    if (h && openOK(h, lv) && openOK(h, nextLv)) return h;
  }
}
export function randomOpen(lv) {
  return freeHalf({ n: 0, d: 1 }, lv, lv);
}

// Una ronda: el extremo libre `open` y 4 fichas; solo una tiene una mitad
// que vale lo mismo que el extremo. nextLv: el nivel que puede tener la
// ronda siguiente (el lado libre de la ficha buena debe servirle también).
export function buildRound(level, open = null, nextLv = level) {
  if (!open || !openOK(open, level)) open = randomOpen(level);
  for (;;) {
    const mk = pick(LEVELS[level].match(open.k).filter((k) => fits(open, k)));
    const good = render(open, mk, open);
    const near = shuffle(nearMisses(open, mk)).filter((h, i, a) => a.findIndex((x) => label(x) === label(h)) === i);
    if (!good || near.length < 3) continue;
    const tiles = [{ m: good, f: freeHalf(open, level, nextLv), ok: true }];
    for (const h of near.slice(0, 3)) tiles.push({ m: h, f: freeHalf(open, level, level), ok: false });
    const hand = shuffle(tiles).map((t) => (Math.random() < 0.5 ? { a: t.m, b: t.f, ...t } : { a: t.f, b: t.m, ...t }));
    if (hand.filter((t) => same(t.a, open) || same(t.b, open)).length !== 1) continue;
    return { level, open, hand, correct: hand.findIndex((t) => t.ok), hint: explain(open, good) };
  }
}

function explain(o, g) {
  if (o.k === "pie" || g.k === "pie") {
    const pie = o.k === "pie" ? o : g, other = o.k === "pie" ? g : o;
    return `${label(other)}: la tarta en ${pie.d} trozos iguales y ${pie.n} ${pie.n === 1 ? "pintado" : "pintados"}${other.k === "frac" ? "" : ` = ${pie.n}/${pie.d}`}`;
  }
  if (o.k === "frac" && g.k === "frac") {
    const [lo, hi] = o.n < g.n ? [o, g] : [g, o];
    if (hi.n % lo.n === 0 && hi.d === (lo.d * hi.n) / lo.n) {
      const m = hi.n / lo.n;
      return `${label(o)} = ${label(g)}: ${o === lo ? "×" : "÷"} ${m} arriba y abajo`;
    }
    const s = simp(o);
    return `${label(o)} = ${s.n}/${s.d} = ${label(g)}`;
  }
  const s = simp(o), forms = [];
  if (o.k === "frac" && (o.n !== s.n || o.d !== s.d)) forms.push(label(o));
  forms.push(`${s.n}/${s.d}`);
  if (100 % s.d === 0 && s.d !== 100) forms.push(`${(100 * s.n) / s.d}/100`);
  if (isDec(s)) forms.push(decText(s));
  if (isPct(s)) forms.push(pctText(s));
  return forms.join(" = ");
}

function halfHTML(h) {
  if (h.k === "frac") return `<span class="dn-fr"><span>${h.n}</span><span>${h.d}</span></span>`;
  if (h.k !== "pie") return `<span class="dn-txt">${label(h)}</span>`;
  const r = 19, c = 22;
  const pt = (i) => [c + r * Math.sin((2 * Math.PI * i) / h.d), c - r * Math.cos((2 * Math.PI * i) / h.d)].map((x) => x.toFixed(2)).join(" ");
  let s = "";
  for (let i = 0; i < h.d; i++) s += `<path class="${i < h.n ? "on" : ""}" d="M${c} ${c} L${pt(i)} A${r} ${r} 0 0 1 ${pt(i + 1)} Z"/>`;
  return `<svg class="dn-pie" viewBox="0 0 44 44">${s}</svg>`;
}
const tileHTML = (a, b, cls = "") => `<div class="dn-tile ${cls}"><div class="dn-half" data-h="a">${halfHTML(a)}</div><div class="dn-half" data-h="b">${halfHTML(b)}</div></div>`;

export function mountDominoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, chain, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body dn-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const levelFor = (h) => Math.min(4, Math.floor(h / 3));

  // La cadena: se ven las 3 últimas fichas; la mitad derecha de la última es el extremo libre.
  const chainHTML = () =>
    chain.slice(-3).map((t, i, arr) => tileHTML(t.l, t.r, `dn-h${i === arr.length - 1 ? " dn-last" : ""}${t.fresh ? " dn-new" : ""}`)).join("");

  function nextRound() {
    if (finished) return;
    busy = false;
    const lv = levelFor(hits);
    const open = chain.length ? chain[chain.length - 1].r : null;
    round = buildRound(lv, open, levelFor(hits + 1));
    if (!chain.length || round.open !== open) chain = [{ l: freeHalf(round.open, lv, lv), r: round.open }];
    chain.forEach((t) => (t.fresh = false));
    body.innerHTML = `
      <p class="prompt dn-prompt">¿Qué ficha encaja en la cadena?</p>
      <div class="dn-mesa"><div class="dn-chain" data-chain>${chainHTML()}</div></div>
      <div class="dn-hand-label">Tu mano</div>
      <div class="dn-hand">${round.hand.map((t, i) => `<button type="button" class="dn-pick" data-tile="${i}">${tileHTML(t.a, t.b, "dn-v")}</button>`).join("")}</div>
      <div class="feedback dn-feedback" data-feedback></div>
      <button type="button" class="secondary dn-next" data-next>Siguiente →</button>
    `;
    body.querySelectorAll("[data-tile]").forEach((b) => b.addEventListener("click", () => play(+b.dataset.tile)));
  }

  function play(i) {
    if (finished || busy) return;
    busy = true;
    rounds++;
    const t = round.hand[i], good = round.hand[round.correct];
    const ok = i === round.correct;
    const picks = body.querySelectorAll("[data-tile]");
    // La ficha buena se coloca girada: su mitad equivalente toca el extremo libre.
    const side = same(good.a, round.open) ? "a" : "b";
    picks[round.correct].classList.add("dn-ok");
    picks[round.correct].querySelector(`[data-h="${side}"]`).classList.add("dn-glow");
    if (ok) picks[round.correct].classList.add("dn-gone");
    chain.push({ l: good[side], r: good[side === "a" ? "b" : "a"], fresh: true });
    body.querySelector("[data-chain]").innerHTML = chainHTML();
    const fb = body.querySelector("[data-feedback]");
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      fb.textContent = `✓ 💡 ${round.hint}`;
      fb.className = "feedback dn-feedback ok";
      pending = setTimeout(nextRound, 1100);
    } else {
      picks[i].classList.add("dn-bad");
      lives--;
      renderLives();
      fb.textContent = `✗ ${t.m.k === "pie" ? "La tarta de " : ""}${label(t.m)} no vale lo mismo que ${label(round.open)}. 💡 ${round.hint}`;
      fb.className = "feedback dn-feedback bad";
      const nb = body.querySelector("[data-next]");
      nb.classList.add("show");
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      nb.onclick = go;
      pending = setTimeout(go, 2600);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "domino", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🁫</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} fichas bien colocadas de ${rounds}</p>
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
    chain = [];
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
