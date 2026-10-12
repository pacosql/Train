// "Fórmulas de área": la figura dibujada con sus medidas (b, h, l, D, d,
// B, a) y debajo la fórmula del libro en dos renglones, primero con letras
// y luego sustituida con casillas: "A = (b · h)/2" → "A = (□ · □)/2 = □".
// Se rellenan los datos y el resultado con el teclado (tocar una casilla
// la enfoca; ✓ con la casilla llena salta a la siguiente). Niveles:
// cuadrado y rectángulo → triángulo y paralelogramo → rombo y trapecio →
// polígono regular con apotema → perímetro y área juntos.
import { randInt, pick, saveScore } from "./utils.js";

const near = (a, b) => Math.abs(a - b) < 1e-6;
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const frac = (n, d) => `<span class="af-frac"><span>${n}</span><span>${d}</span></span>`;
const v = (s) => `<i>${s}</i>`;
const TRIPLES = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [9, 12, 15], [12, 9, 15]];
const POLY = { 5: "Pentágono", 6: "Hexágono", 8: "Octógono" };

// Polígono regular con apotema casi entera (como en los problemas del libro).
function regular() {
  for (;;) {
    const n = pick([5, 6, 8]), l = randInt(2, 16), ap = l / (2 * Math.tan(Math.PI / n)), a = Math.round(ap);
    if (a >= 2 && Math.abs(ap - a) <= 0.15 && (n * l * a) % 2 === 0) return { n, l, a, P: n * l };
  }
}

// Niveles: 0 cuadrado/rectángulo · 1 triángulo/paralelogramo · 2 rombo/
// trapecio · 3 polígono regular · 4 perímetro y área juntos.
// Cada ronda: figura, renglones con {k} = casilla k y {=k} = copia de la k,
// valores de las casillas y grupos que pueden ir en cualquier orden (b · h = h · b).
export function buildRound(level) {
  const shape = pick([["cuadrado", "rectangulo"], ["triangulo", "paralelogramo"], ["rombo", "trapecio"], ["poligono"], ["cuadrado", "rectangulo", "poligono"]][level]);
  const both = level === 4, cm2 = "cm²";
  let d, lines, slots, groups = [], hint, name;
  if (shape === "cuadrado") {
    const l = randInt(2, 15); d = { l }; name = "Cuadrado";
    lines = both ? [`${v("P")} = 4 · ${v("l")} = 4 · {0} = {1} cm`, `${v("A")} = ${v("l")}² = {=0}² = {2} ${cm2}`] : [`${v("A")} = ${v("l")}²`, `${v("A")} = {0}² = {1} ${cm2}`];
    slots = both ? [l, 4 * l, l * l] : [l, l * l];
    hint = `${both ? `P = 4 · ${l} = ${4 * l} cm; ` : ""}lado por lado: A = ${l}² = ${l} · ${l} = ${l * l} cm²`;
  } else if (shape === "rectangulo") {
    let b, h;
    do { b = randInt(3, 20); h = randInt(2, 14); } while (b <= h);
    d = { b, h }; name = "Rectángulo";
    lines = both
      ? [`${v("P")} = 2 · ${v("b")} + 2 · ${v("h")}`, `${v("P")} = 2 · {0} + 2 · {1} = {2} cm`, `${v("A")} = ${v("b")} · ${v("h")} = {=0} · {=1} = {3} ${cm2}`]
      : [`${v("A")} = ${v("b")} · ${v("h")}`, `${v("A")} = {0} · {1} = {2} ${cm2}`];
    slots = both ? [b, h, 2 * b + 2 * h, b * h] : [b, h, b * h];
    groups = [[0, 1]];
    hint = `${both ? `P = 2 · ${b} + 2 · ${h} = ${2 * b + 2 * h} cm; ` : ""}base por altura: A = ${b} · ${h} = ${b * h} cm²`;
  } else if (shape === "triangulo" || shape === "rombo") {
    let b, h;
    do { b = randInt(3, 20); h = randInt(2, 14); } while ((b * h) % 2 || (shape === "rombo" && b <= h));
    const [p, q] = shape === "rombo" ? ["D", "d"] : ["b", "h"];
    d = { [p]: b, [q]: h }; name = shape === "rombo" ? "Rombo" : "Triángulo";
    lines = [`${v("A")} = ${frac(`${v(p)} · ${v(q)}`, 2)}`, `${v("A")} = ${frac("{0} · {1}", 2)} = {2} ${cm2}`];
    slots = [b, h, (b * h) / 2];
    groups = [[0, 1]];
    hint = `${shape === "rombo" ? "Diagonal mayor por diagonal menor" : "Base por altura"} entre 2: A = ${b} · ${h} : 2 = ${fmt(b * h)} : 2 = ${fmt((b * h) / 2)} cm²`;
  } else if (shape === "paralelogramo") {
    const [h, off, c] = pick(TRIPLES), b = randInt(Math.max(6, off + 2), 20);
    d = { b, h, c, off }; name = "Paralelogramo";
    lines = [`${v("A")} = ${v("b")} · ${v("h")}`, `${v("A")} = {0} · {1} = {2} ${cm2}`];
    slots = [b, h, b * h];
    groups = [[0, 1]];
    hint = `Base por altura (la altura, no el lado inclinado de ${c}): A = ${b} · ${h} = ${b * h} cm²`;
  } else if (shape === "trapecio") {
    let B, b, h;
    do { B = randInt(5, 20); b = randInt(2, B - 2); h = randInt(2, 12); } while (((B + b) * h) % 2);
    d = { B, b, h }; name = "Trapecio";
    lines = [`${v("A")} = ${frac(`(${v("B")} + ${v("b")}) · ${v("h")}`, 2)}`, `${v("A")} = ${frac("({0} + {1}) · {2}", 2)} = {3} ${cm2}`];
    slots = [B, b, h, ((B + b) * h) / 2];
    groups = [[0, 1]];
    hint = `(B + b) · h : 2 = (${B} + ${b}) · ${h} : 2 = ${B + b} · ${h} : 2 = ${fmt((B + b) * h)} : 2 = ${fmt(((B + b) * h) / 2)} cm²`;
  } else {
    const { n, l, a, P } = regular();
    d = { n, l, a }; name = `${POLY[n]} regular`;
    const A = (P * a) / 2;
    lines = both
      ? [`${v("P")} = ${n} · ${v("l")} = ${n} · {0} = {1} cm`, `${v("A")} = ${frac(`${v("P")} · ${v("a")}`, 2)} = ${frac("{=1} · {2}", 2)} = {3} ${cm2}`]
      : [`${v("A")} = ${frac(`${v("P")} · ${v("a")}`, 2)}`, `${v("A")} = ${frac("{0} · {1}", 2)} = {2} ${cm2}`];
    slots = both ? [l, P, a, A] : [P, a, A];
    hint = `P = ${n} · ${l} = ${P} cm; A = P · a : 2 = ${P} · ${a} : 2 = ${fmt(P * a)} : 2 = ${fmt(A)} cm²`;
  }
  return { shape, d, lines, slots, groups, hint, prompt: `${name}: ${both ? "perímetro y área" : "calcula el área"}` };
}

// La figura con sus medidas rotuladas (a escala aproximada, centrada).
function figure(r) {
  const { shape, d } = r, W = 280, H = 136, cx = 128, cy = 60;
  const t = (x, y, s, cls = "af-lab") => `<text x="${x}" y="${y}" class="${cls}">${s}</text>`;
  const poly = (pts, cls = "af-shape") => `<polygon class="${cls}" points="${pts.map((p) => p.join(",")).join(" ")}"/>`;
  const dash = (x1, y1, x2, y2) => `<line class="af-dash" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  let g = "";
  if (shape === "poligono") {
    const R = 52, ang = (i) => Math.PI / 2 + Math.PI / d.n + (2 * Math.PI * i) / d.n;
    const pts = Array.from({ length: d.n }, (_, i) => [cx + R * Math.cos(ang(i)), cy + R * Math.sin(ang(i))].map((z) => +z.toFixed(1)));
    const ap = R * Math.cos(Math.PI / d.n);
    g = poly(pts) + dash(cx, cy, cx, cy + ap) + `<circle class="af-dot" cx="${cx}" cy="${cy}" r="2.5"/>` +
      t(cx + 8, cy + ap / 2 + 4, `${v("a")} = ${d.a}`, "af-lab af-start") + t(cx, cy + ap + 18, `${v("l")} = ${d.l} cm`);
  } else {
    // ancho y alto en píxeles, proporcionados pero legibles
    const [bw, bh] = shape === "rombo" ? [d.D, d.d] : shape === "trapecio" ? [d.B, d.h] : shape === "cuadrado" ? [d.l, d.l] : [d.b, d.h];
    const k = Math.min(170 / bw, 92 / bh), w = Math.max(70, bw * k), h = Math.max(40, bh * k);
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2 + 4, y1 = cy + h / 2 + 4;
    if (shape === "cuadrado" || shape === "rectangulo") {
      g = poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) + t(cx, y1 + 18, `${v(shape === "cuadrado" ? "l" : "b")} = ${d.l || d.b} cm`) +
        (shape === "rectangulo" ? t(x1 + 8, cy + 8, `${v("h")} = ${d.h}`, "af-lab af-start") : "");
    } else if (shape === "triangulo") {
      const ax = x0 + w * 0.3;
      g = poly([[x0, y1], [x1, y1], [ax, y0]]) + dash(ax, y0, ax, y1) + `<path class="af-dash" d="M${ax} ${y1 - 8} h8 v8"/>` +
        t(cx, y1 + 18, `${v("b")} = ${d.b} cm`) + t(ax - 6, cy + 8, `${v("h")} = ${d.h}`, "af-lab af-end");
    } else if (shape === "paralelogramo") {
      const o = Math.min(w * 0.35, (d.off / d.b) * w + 14);
      g = poly([[x0, y1], [x1 - o, y1], [x1, y0], [x0 + o, y0]]) + dash(x0 + o, y0, x0 + o, y1) +
        t(cx - o / 2, y1 + 18, `${v("b")} = ${d.b} cm`) + t(x0 + o + 6, cy + 8, `${v("h")} = ${d.h}`, "af-lab af-start") +
        t(x1 - o / 2 + 8, cy + 8, `${d.c}`, "af-lab af-start af-muted");
    } else if (shape === "rombo") {
      g = poly([[x0, cy + 4], [cx, y0], [x1, cy + 4], [cx, y1]]) + dash(x0, cy + 4, x1, cy + 4) + dash(cx, y0, cx, y1) +
        t(x0 + w * 0.25, cy, `${v("D")} = ${d.D}`) + t(cx + 6, y1 - 6, `${v("d")} = ${d.d}`, "af-lab af-start");
    } else {
      const tw = Math.max(36, (d.b / d.B) * w);
      g = poly([[x0, y1], [x1, y1], [cx + tw / 2, y0], [cx - tw / 2, y0]]) + dash(cx - tw / 2, y0, cx - tw / 2, y1) +
        t(cx, y1 + 18, `${v("B")} = ${d.B} cm`) + t(cx, y0 - 7, `${v("b")} = ${d.b}`) + t(cx - tw / 2 + 6, cy + 8, `${v("h")} = ${d.h}`, "af-lab af-start");
    }
  }
  return `<svg class="af-fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="figura">${g}</svg>`;
}

export function mountAreaformulaGame(container, { client, onExit }) {
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
    <div class="game-body af-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const fill = (s) => s
    .replace(/\{(\d+)\}/g, (_, k) => `<button type="button" class="af-slot" data-slot="${k}"></button>`)
    .replace(/\{=(\d+)\}/g, (_, k) => `<span class="af-mirror" data-mirror="${k}"></span>`);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    goNext = null;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt af-prompt">${round.prompt}</p>
      <div class="af-cuaderno">${figure(round)}${round.lines.map((l) => `<div class="af-line">${fill(l)}</div>`).join("")}</div>
      <div class="keypad af-keypad" data-keypad></div>
      <div class="feedback af-feedback" data-feedback></div>
    `;
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
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      b.textContent = typed[+b.dataset.slot];
      b.classList.toggle("active", +b.dataset.slot === active);
    });
    body.querySelectorAll("[data-mirror]").forEach((m) => (m.textContent = typed[+m.dataset.mirror] || "□"));
  }

  function say(html, cls) {
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = html;
    fb.className = `feedback af-feedback ${cls}`;
    return fb;
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return enter();
    const t = typed[active];
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.length < 5) typed[active] = t === "0" ? key : t + key;
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
    const val = typed.map(Number);
    const ok = round.slots.map((w, k) => near(val[k], w));
    // b · h = h · b: si el grupo coincide en cualquier orden, vale.
    for (const g of round.groups) {
      const a = g.map((k) => val[k]).sort((x, y) => x - y), b = g.map((k) => round.slots[k]).sort((x, y) => x - y);
      if (a.every((x, i) => near(x, b[i]))) g.forEach((k) => (ok[k] = true));
    }
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot;
      b.classList.remove("active");
      b.classList.add(ok[k] ? "good" : "bad");
      if (!ok[k]) b.innerHTML = `<s>${typed[k]}</s><em class="af-fix">${round.slots[k]}</em>`;
    });
    if (ok.every(Boolean)) {
      score += 10;
      hits++;
      renderScore();
      say(`✓ 💡 ${round.hint}`, "ok");
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      goNext = () => { clearTimeout(pending); goNext = null; lives <= 0 ? finish(false) : nextRound(); };
      say(`💡 ${round.hint} <button type="button" class="af-next" data-next>Siguiente →</button>`, "bad")
        .querySelector("[data-next]").addEventListener("click", goNext);
      pending = setTimeout(goNext, 4000);
    }
  }

  // Teclado físico: cifras, borrar, Enter.
  function onKey(e) {
    if (finished || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter" && goNext) return e.preventDefault(), goNext();
    const key = /^[0-9]$/.test(e.key) ? e.key : e.key === "Backspace" ? "⌫" : e.key === "Enter" ? "✓" : null;
    if (key) { e.preventDefault(); pressKey(key); }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "areaformula", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📐</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} áreas bien calculadas de ${rounds}</p>
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
