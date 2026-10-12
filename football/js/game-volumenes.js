// "Volumen de cuerpos": el cuerpo dibujado en perspectiva isométrica con
// sus medidas (aristas ocultas a trazos, como en el libro) y la fórmula
// en dos renglones, primero con letras y luego sustituida con casillas:
// "V = l · a · h" → "V = □ · □ · □ = □ cm³". Tocar una casilla la enfoca;
// ✓ con la casilla llena salta a la siguiente; con todo lleno corrige.
// Niveles: ortoedro y cubo → prisma (base triángulo o rectángulo) →
// cilindro (π = 3,14) → pirámide y cono (/ 3) → capacidad (1 dm³ = 1 l) → mezcla.
import { randInt, pick, saveScore } from "./utils.js";

// Número a la española: coma decimal y punto de miles.
export const fmt = (n) => {
  const [i, d] = Math.abs(Math.round(n * 100) / 100).toFixed(2).split(".");
  const dd = d.replace(/0+$/, "");
  return (n < 0 ? "−" : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (dd ? "," + dd : "");
};
const near = (a, b) => Math.abs(a - b) < 1e-6;
const frac = (n, d) => `<span class="vo-frac"><span>${n}</span><span>${d}</span></span>`;
const v = (s) => `<i>${s}</i>`;
const sv = (s) => `<tspan class="vo-it">${s}</tspan>`; // cursiva dentro del SVG
const AB = `${v("A")}<sub>base</sub>`;
const pi = (k) => (314 * k) / 100; // 3,14 · k sin errores de coma flotante

// Niveles: 0 ortoedro/cubo · 1 prisma · 2 cilindro · 3 pirámide/cono ·
// 4 capacidad · 5 mezcla. {k} = casilla k; {=k} = copia de la casilla k.
export function buildRound(level) {
  const kind = level === 5 ? randInt(0, 4) : level;
  const body = pick([["ortoedro", "cubo"], ["prisma3", "prisma4"], ["cilindro"], ["piramide", "cono"], ["capacidad"]][kind]);
  const cm3 = "cm³";
  let d, lines, slots, groups = [], hint, name;
  if (body === "ortoedro" || body === "capacidad") {
    const l = randInt(3, 12), a = randInt(2, 8), h = randInt(2, 10), V = l * a * h, u = body === "capacidad" ? "dm" : "cm";
    d = { l, a, h, u }; name = body === "capacidad" ? "Pecera: ¿cuántos litros caben?" : "Ortoedro: calcula el volumen";
    lines = [`${v("V")} = ${v("l")} · ${v("a")} · ${v("h")}`, `${v("V")} = {0} · {1} · {2} = {3} ${u}³`];
    slots = [l, a, h, V];
    groups = [[0, 1, 2]];
    hint = `Largo por ancho por alto: V = ${l} · ${a} · ${h} = ${fmt(V)} ${u}³`;
    if (body === "capacidad") {
      lines.push(`{=3} dm³ = {4} litros <small class="vo-note">(1 dm³ = 1 l)</small>`);
      slots.push(V);
      hint += ` y como 1 dm³ = 1 l, caben ${fmt(V)} litros`;
    }
  } else if (body === "cubo") {
    const a = randInt(2, 12);
    d = { a }; name = "Cubo: calcula el volumen";
    lines = [`${v("V")} = ${v("a")}³`, `${v("V")} = {0}³ = {1} ${cm3}`];
    slots = [a, a ** 3];
    hint = `Arista al cubo: V = ${a}³ = ${a} · ${a} · ${a} = ${fmt(a ** 3)} cm³`;
  } else if (body === "prisma3" || body === "prisma4") {
    const tri = body === "prisma3";
    let b, t;
    do { b = randInt(2, 10); t = randInt(2, 8); } while (tri && (b * t) % 2);
    const h = randInt(3, 15), Ab = tri ? (b * t) / 2 : b * t, V = Ab * h;
    d = { b, t, h, tri }; name = `Prisma ${tri ? "triangular" : "rectangular"}: volumen`;
    lines = [`${AB} = ${tri ? frac(`${b} · ${t}`, 2) : `${b} · ${t}`} = {0} cm²`, `${v("V")} = ${AB} · ${v("h")} = {=0} · {1} = {2} ${cm3}`];
    slots = [Ab, h, V];
    hint = `Área de la base por la altura: base = ${b} · ${t}${tri ? " : 2" : ""} = ${Ab} cm²; V = ${Ab} · ${h} = ${fmt(V)} cm³`;
  } else if (body === "cilindro") {
    const r = randInt(1, 10), h = randInt(2, 20), V = pi(r * r * h);
    d = { r, h }; name = "Cilindro: calcula el volumen";
    lines = [`${v("V")} = π · ${v("r")}² · ${v("h")}`, `${v("V")} = 3,14 · {0}² · {1} = {2} ${cm3}`];
    slots = [r, h, V];
    hint = `Área de la base por la altura: V = 3,14 · ${r}² · ${h} = 3,14 · ${r * r} · ${h} = ${fmt(V)} cm³`;
  } else {
    const cone = body === "cono";
    let r, h;
    do { r = randInt(cone ? 1 : 2, cone ? 9 : 12); h = randInt(2, 18); } while ((r * r * h) % 3);
    const k = (r * r * h) / 3, V = cone ? pi(k) : k;
    d = { r, h }; name = `${cone ? "Cono" : "Pirámide de base cuadrada"}: volumen`;
    lines = cone
      ? [`${v("V")} = ${frac(`π · ${v("r")}² · ${v("h")}`, 3)}`, `${v("V")} = ${frac("3,14 · {0}² · {1}", 3)} = {2} ${cm3}`]
      : [`${v("V")} = ${frac(`${AB} · ${v("h")}`, 3)} = ${frac(`${v("l")}² · ${v("h")}`, 3)}`, `${v("V")} = ${frac("{0}² · {1}", 3)} = {2} ${cm3}`];
    slots = [r, h, V];
    hint = cone
      ? `Un tercio del cilindro: 3,14 · ${r}² · ${h} = ${fmt(pi(r * r * h))}; ${fmt(pi(r * r * h))} : 3 = ${fmt(V)} cm³`
      : `Un tercio del prisma: ${r}² · ${h} = ${r * r} · ${h} = ${fmt(r * r * h)}; ${fmt(r * r * h)} : 3 = ${fmt(V)} cm³`;
  }
  return { kind, body, d, lines, slots, groups, hint, prompt: name };
}

// Dibujo en isométrica (x hacia la derecha-abajo, y hacia la izquierda-abajo, z arriba).
function figure(r) {
  const { body, d } = r, W = 280, H = 150, cx = 140, cy = 75;
  const t = (x, y, s, cls = "") => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="vo-lab ${cls}">${s}</text>`;
  const pts = (p) => p.map((q) => q.map((z) => z.toFixed(1)).join(",")).join(" ");
  const face = (p, cls = "vo-face") => `<polygon class="${cls}" points="${pts(p)}"/>`;
  const dash = (a, b) => `<line class="vo-dash" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`;
  let g = "";
  if (body === "cilindro" || body === "cono") {
    const R = 52, hh = Math.max(50, Math.min(110, (d.h / d.r) * R * 0.9)), ry = R * 0.32;
    const yb = cy + hh / 2 + 4, yt = yb - hh;
    const arc = (y, front) => `<path class="${front ? "vo-edge" : "vo-dash"}" d="M${cx - R} ${y} A${R} ${ry} 0 0 ${front ? 0 : 1} ${cx + R} ${y}"/>`;
    if (body === "cilindro") {
      g = face([[cx - R, yt], [cx - R, yb], [cx + R, yb], [cx + R, yt]], "vo-face vo-noline") + `<path class="vo-face" d="M${cx - R} ${yb} A${R} ${ry} 0 0 0 ${cx + R} ${yb}"/>` +
        `<line class="vo-edge" x1="${cx - R}" y1="${yt}" x2="${cx - R}" y2="${yb}"/><line class="vo-edge" x1="${cx + R}" y1="${yt}" x2="${cx + R}" y2="${yb}"/>` +
        arc(yb, true) + arc(yb, false) + `<ellipse class="vo-top" cx="${cx}" cy="${yt}" rx="${R}" ry="${ry}"/>` +
        `<line class="vo-edge" x1="${cx}" y1="${yt}" x2="${cx + R}" y2="${yt}"/>` + t(cx + R / 2, yt - 6, `${sv("r")} = ${d.r}`) + t(cx + R + 6, cy + 8, `${sv("h")} = ${d.h}`, "vo-start");
    } else {
      g = `<path class="vo-face" d="M${cx - R} ${yb} L${cx} ${yt} L${cx + R} ${yb} A${R} ${ry} 0 0 1 ${cx - R} ${yb} Z"/>` + arc(yb, false) +
        dash([cx, yt], [cx, yb]) + `<line class="vo-edge" x1="${cx}" y1="${yb}" x2="${cx + R}" y2="${yb}"/>` +
        t(cx + R / 2, yb + ry + 14, `${sv("r")} = ${d.r}`) + t(cx - 6, cy + 8, `${sv("h")} = ${d.h}`, "vo-end");
    }
  } else {
    // dimensiones del dibujo (x, y, z) proporcionadas pero legibles
    const real = body === "cubo" ? [d.a, d.a, d.a] : body === "piramide" ? [d.r, d.r, d.h] : body.startsWith("prisma") ? [d.h, d.b, d.t] : [d.l, d.a, d.h];
    const m = Math.max(...real), [X, Y, Z] = real.map((q) => Math.max(q, m * 0.4));
    const s = Math.min(230 / ((X + Y) * 0.866), 128 / ((X + Y) * 0.5 + Z));
    const ox = cx - ((X - Y) * 0.866 * s) / 2, oy = cy - ((X + Y) * 0.5 * s - Z * s) / 2;
    const P = (x, y, z) => [ox + (x - y) * 0.866 * s, oy + (x + y) * 0.5 * s - z * s];
    const mid = (a, b, dx, dy) => [(a[0] + b[0]) / 2 + dx, (a[1] + b[1]) / 2 + dy];
    const O = P(0, 0, 0);
    if (body === "piramide") {
      const top = P(X / 2, Y / 2, Z), b1 = P(X, 0, 0), b2 = P(X, Y, 0), b3 = P(0, Y, 0);
      g = face([b3, b2, top]) + face([b2, b1, top]) + dash(O, b1) + dash(O, b3) + dash(O, top) + dash(top, P(X / 2, Y / 2, 0)) +
        t(...mid(b2, b1, 10, 14), `${sv("l")} = ${d.r}`, "vo-start") + t(...mid(top, P(X / 2, Y / 2, 0), -6, 0), `${sv("h")} = ${d.h}`, "vo-end");
    } else if (body === "prisma3") {
      const a1 = P(X, 0, 0), a2 = P(X, Y, 0), a3 = P(X, 0, Z), c2 = P(0, Y, 0), c3 = P(0, 0, Z);
      g = face([c2, a2, a3, c3]) + face([a1, a2, a3]) + dash(O, a1) + dash(O, c2) + dash(O, c3) +
        t(...mid(a1, a2, 8, 14), `${d.b}`, "vo-start") + t(...mid(a1, a3, 6, 4), `${d.t}`, "vo-start") + t(...mid(c2, a2, -8, 16), `${sv("h")} = ${d.h}`, "vo-end");
    } else {
      const a1 = P(X, 0, 0), a2 = P(X, Y, 0), c2 = P(0, Y, 0), up = (q) => [q[0], q[1] - Z * s];
      g = face([up(O), up(a1), up(a2), up(c2)], "vo-face vo-topf") + face([c2, a2, up(a2), up(c2)]) + face([a2, a1, up(a1), up(a2)]) +
        dash(O, a1) + dash(O, c2) + dash(O, up(O));
      const lab = body === "cubo" ? [`${sv("a")} = ${d.a}`, "", ""] : body === "prisma4" ? [`${sv("h")} = ${d.h}`, `${d.b}`, `${d.t}`] : [`${sv("l")} = ${d.l}`, `${sv("a")} = ${d.a}`, `${sv("h")} = ${d.h}`];
      g += t(...mid(c2, a2, -8, 16), lab[0], "vo-end") + t(...mid(a2, a1, 8, 16), lab[1], "vo-start") + t(...mid(a1, up(a1), 6, 4), lab[2], "vo-start");
    }
  }
  g += t(W - 4, H - 4, `medidas en ${d.u || "cm"}`, "vo-end vo-unit");
  return `<svg class="vo-fig" viewBox="0 0 ${W} ${H}" role="img" aria-label="cuerpo geométrico">${g}</svg>`;
}

export function mountVolumenesGame(container, { client, onExit }) {
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
    <div class="game-body vo-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const fill = (s) => s
    .replace(/\{(\d+)\}/g, (_, k) => `<button type="button" class="vo-slot" data-slot="${k}"></button>`)
    .replace(/\{=(\d+)\}/g, (_, k) => `<span class="vo-mirror" data-mirror="${k}"></span>`);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    goNext = null;
    round = buildRound(Math.min(5, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt vo-prompt">${round.prompt}</p>
      <div class="vo-cuaderno">${figure(round)}${round.lines.map((l) => `<div class="vo-line">${fill(l)}</div>`).join("")}</div>
      <div class="keypad vo-keypad" data-keypad></div>
      <div class="feedback vo-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary vo-ok" : ""}`;
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
    fb.className = `feedback vo-feedback ${cls}`;
    return fb;
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return enter();
    const t = typed[active];
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (key === ",") { if (!t.includes(",")) typed[active] = (t || "0") + ","; }
    else if (t.length < 8) typed[active] = t === "0" ? key : t + key;
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
    const val = typed.map((s) => Number(s.replace(",", ".")));
    const ok = round.slots.map((w, k) => near(val[k], w));
    // l · a · h en cualquier orden también vale.
    for (const g of round.groups) {
      const a = g.map((k) => val[k]).sort((x, y) => x - y), b = g.map((k) => round.slots[k]).sort((x, y) => x - y);
      if (a.every((x, i) => near(x, b[i]))) g.forEach((k) => (ok[k] = true));
    }
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot;
      b.classList.remove("active");
      b.classList.add(ok[k] ? "good" : "bad");
      if (!ok[k]) b.innerHTML = `<s>${typed[k]}</s><em class="vo-fix">${fmt(round.slots[k])}</em>`;
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
      say(`💡 ${round.hint} <button type="button" class="vo-next" data-next>Siguiente →</button>`, "bad")
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
    saveScore(client, "volumenes", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧊</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} volúmenes bien calculados de ${rounds}</p>
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
