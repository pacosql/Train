// "El tercer ángulo": una figura dibujada con proporciones reales, con unos
// ángulos rotulados y uno con "?". Se escribe el que falta en el teclado.
// Niveles: triángulo (múltiplos de 10) → múltiplos de 5 → cuadrilátero
// (360°) → isósceles con un solo ángulo dado → ángulos en una recta y
// opuestos por el vértice.
import { randInt, pick, saveScore } from "./utils.js";

const W = 320;
const H = 190;
const DEG = Math.PI / 180;

// Reparte `total` en `n` ángulos múltiplos de `step`, cada uno en [lo, hi].
function splitAngles(total, n, step, lo, hi) {
  for (;;) {
    const a = [];
    for (let i = 0; i < n - 1; i++) a.push(randInt(lo / step, hi / step) * step);
    const last = total - a.reduce((s, v) => s + v, 0);
    if (last >= lo && last <= hi && last % step === 0) return [...a, last];
  }
}

// Vértices (y hacia abajo) de un polígono con esos ángulos interiores, en
// orden. Triángulo: ley de los senos. Cuadrilátero: las direcciones de los
// lados las fijan los ángulos; se resuelven dos longitudes para cerrarlo.
export function polygonFromAngles(angs) {
  if (angs.length === 3) {
    const [a, b, c] = angs.map((v) => v * DEG);
    const ac = Math.sin(b) / Math.sin(c);
    return [[0, 0], [1, 0], [ac * Math.cos(a), -ac * Math.sin(a)]];
  }
  const dirs = [0, 180 - angs[1], 360 - angs[1] - angs[2], 180 + angs[0]].map((d) => [Math.cos(d * DEG), -Math.sin(d * DEG)]);
  for (let t = 0; t < 60; t++) {
    const s2 = 0.5 + Math.random();
    const w = [-(dirs[0][0] + s2 * dirs[1][0]), -(dirs[0][1] + s2 * dirs[1][1])];
    const [u3, u4] = [dirs[2], dirs[3]];
    const det = u3[0] * u4[1] - u3[1] * u4[0];
    if (Math.abs(det) < 1e-6) continue;
    const s3 = (w[0] * u4[1] - w[1] * u4[0]) / det;
    const s4 = (u3[0] * w[1] - u3[1] * w[0]) / det;
    if (s3 < 0.5 || s4 < 0.5 || s3 > 2 || s4 > 2) continue;
    const C = [1 + s2 * dirs[1][0], s2 * dirs[1][1]];
    return [[0, 0], [1, 0], C, [C[0] + s3 * dirs[2][0], C[1] + s3 * dirs[2][1]]];
  }
  return null;
}

// Escala y centra los puntos en el lienzo.
function fit(pts, pad) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const s = Math.min((W - 2 * pad) / (x1 - x0 || 1), (H - 2 * pad) / (y1 - y0 || 1));
  return pts.map(([x, y]) => [(W - s * (x1 - x0)) / 2 + s * (x - x0), (H - s * (y1 - y0)) / 2 + s * (y - y0)]);
}

// Ronda: { kind, scene: { polys, lines, angles:[{v,p,q,label}], ticks }, answer, hint }
export function buildRound(level) {
  if (level <= 2) {
    const quad = level === 2;
    const step = level === 0 ? 10 : 5;
    let angs, pts;
    do {
      angs = quad ? splitAngles(360, 4, step, 50, 150) : splitAngles(180, 3, step, 20, 120);
      pts = polygonFromAngles(angs);
    } while (!pts);
    const P = fit(pts, 36);
    const qi = randInt(0, angs.length - 1);
    const angles = P.map((v, i) => ({ v, p: P[(i + P.length - 1) % P.length], q: P[(i + 1) % P.length], label: i === qi ? "?" : `${angs[i]}°`, deg: angs[i] }));
    const given = angs.filter((_, i) => i !== qi);
    const hint = quad
      ? `Los cuatro ángulos de un cuadrilátero suman 360°: 360 − ${given.join(" − ")} = ${angs[qi]}`
      : `Los tres ángulos de un triángulo suman 180°: 180 − ${given.join(" − ")} = ${angs[qi]}`;
    return { kind: quad ? "cuadrilatero" : "triangulo", scene: { polys: [P], lines: [], angles, ticks: [] }, answer: angs[qi], hint };
  }
  if (level === 3) {
    // Isósceles: A y B en la base (iguales), C el vértice.
    const apex = randInt(2, 12) * 10, base = (180 - apex) / 2;
    const P = fit(polygonFromAngles([base, base, apex]), 36);
    const askApex = Math.random() < 0.5;
    const shownBase = randInt(0, 1); // qué ángulo de la base lleva rótulo (o "?")
    const labels = [null, null, null];
    labels[2] = askApex ? "?" : `${apex}°`;
    labels[shownBase] = askApex ? `${base}°` : "?";
    const degs = [base, base, apex];
    const angles = P.map((v, i) => ({ v, p: P[(i + 2) % 3], q: P[(i + 1) % 3], label: labels[i], deg: degs[i] })).filter((a) => a.label);
    const hint = askApex
      ? `Los dos ángulos de la base son iguales (lados marcados): 180 − ${base} − ${base} = ${apex}`
      : `Los dos ángulos de la base son iguales (lados marcados): (180 − ${apex}) ÷ 2 = ${base}`;
    return { kind: "isosceles", scene: { polys: [P], lines: [], angles, ticks: [[P[0], P[2]], [P[1], P[2]]] }, answer: askApex ? apex : base, hint };
  }
  // Nivel 4: ángulos sobre una recta u opuestos por el vértice.
  const O = [160, 100];
  const ray = (deg, len) => [O[0] + len * Math.cos(deg * DEG), O[1] - len * Math.sin(deg * DEG)];
  if (Math.random() < 0.5) {
    const t = randInt(4, 32) * 5; // 20..160
    const [E, Wp, R] = [ray(0, 135), ray(180, 135), ray(t, 110)];
    const givenRight = Math.random() < 0.5;
    const angles = [
      { v: O, p: E, q: R, label: givenRight ? `${t}°` : "?", deg: t },
      { v: O, p: R, q: Wp, label: givenRight ? "?" : `${180 - t}°`, deg: 180 - t },
    ];
    const given = givenRight ? t : 180 - t;
    return { kind: "recta", scene: { polys: [], lines: [[Wp, E], [O, R]], angles, ticks: [] }, answer: 180 - given, hint: `Los ángulos sobre una recta suman 180°: 180 − ${given} = ${180 - given}` };
  }
  const t = pick([30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150]);
  const ends = [ray(0, 135), ray(t, 125), ray(180, 135), ray(t + 180, 125)];
  const degs = [t, 180 - t, t, 180 - t];
  const gi = randInt(0, 3), qi = (gi + 2) % 4; // el "?" es el opuesto al dado
  const angles = ends.map((e, i) => ({ v: O, p: e, q: ends[(i + 1) % 4], label: i === gi ? `${degs[i]}°` : i === qi ? "?" : null, deg: degs[i] })).filter((a) => a.label);
  return { kind: "opuestos", scene: { polys: [], lines: [[ends[0], ends[2]], [ends[1], ends[3]]], angles, ticks: [] }, answer: degs[gi], hint: `Los ángulos opuestos por el vértice son iguales: ? = ${degs[gi]}°` };
}

function renderScene(scene) {
  const f = (n) => n.toFixed(1);
  let s = `<svg class="ta-fig" viewBox="0 0 ${W} ${H}" data-fig>`;
  scene.polys.forEach((P) => (s += `<polygon class="ta-shape" points="${P.map((p) => `${f(p[0])},${f(p[1])}`).join(" ")}"/>`));
  scene.lines.forEach(([a, b]) => (s += `<line class="ta-line" x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}"/>`));
  scene.ticks.forEach(([a, b]) => {
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) / 6;
    const n = [-(b[1] - a[1]) / d, (b[0] - a[0]) / d];
    s += `<line class="ta-tick" x1="${f(m[0] - n[0])}" y1="${f(m[1] - n[1])}" x2="${f(m[0] + n[0])}" y2="${f(m[1] + n[1])}"/>`;
  });
  scene.angles.forEach((a, i) => {
    const u = (p) => {
      const d = Math.hypot(p[0] - a.v[0], p[1] - a.v[1]);
      return [(p[0] - a.v[0]) / d, (p[1] - a.v[1]) / d];
    };
    const [up, uq] = [u(a.p), u(a.q)];
    const r = 16 + (i % 2) * 6;
    const sweep = up[0] * uq[1] - up[1] * uq[0] > 0 ? 1 : 0; // el arco va por dentro del ángulo
    const isQ = a.label === "?";
    s += `<path class="ta-arc${isQ ? " q" : ""}" d="M${f(a.v[0] + up[0] * r)},${f(a.v[1] + up[1] * r)} A${r},${r} 0 0 ${sweep} ${f(a.v[0] + uq[0] * r)},${f(a.v[1] + uq[1] * r)}"/>`;
    // Rótulo sobre la bisectriz, más lejos cuanto más cerrado el ángulo.
    const bl = Math.hypot(up[0] + uq[0], up[1] + uq[1]) || 1;
    const dist = (a.deg < 35 ? 50 : a.deg < 60 ? 38 : 30) / bl;
    s += `<text class="ta-lab${isQ ? " q" : ""}" ${isQ ? "data-q" : ""} x="${f(a.v[0] + (up[0] + uq[0]) * dist)}" y="${f(a.v[1] + (up[1] + uq[1]) * dist)}">${a.label}</text>`;
  });
  return s + "</svg>";
}

export function mountTerceranguloGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives, score = 0, rounds = 0, hits = 0, finished = false, busy = false;
  let round = null, typed = "", pending = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body ta-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const [livesEl, scoreEl, body] = ["[data-lives]", "[data-score]", "[data-body]"].map((sel) => container.querySelector(sel));
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    round = buildRound(Math.min(4, Math.floor(hits / 3)));
    typed = "";
    busy = false;
    body.innerHTML = `
      <p class="prompt ta-prompt">¿Cuánto mide el ángulo <b>?</b></p>
      ${renderScene(round.scene)}
      <div class="keypad-display ta-display" data-display>&nbsp;</div>
      <div class="keypad ta-pad" data-keypad></div>
      <div class="feedback ta-fb" data-feedback></div>
    `;
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key" + (key === "✓" ? " primary" : "");
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (key === "✓") return submit();
    else if (typed.length < 3) typed += key;
    body.querySelector("[data-display]").textContent = typed ? `${typed}°` : " ";
  }

  function submit() {
    if (finished || busy || typed === "") return;
    busy = true;
    rounds++;
    const value = Number(typed);
    const ok = value === round.answer;
    const [fb, disp, q] = ["[data-feedback]", "[data-display]", "[data-q]"].map((sel) => body.querySelector(sel));
    // La respuesta correcta aparece en verde en el propio dibujo (bien o mal).
    q.textContent = `${round.answer}°`;
    q.classList.add("good");
    disp.classList.add(ok ? "ok" : "bad");
    fb.textContent = `💡 ${round.hint}`;
    fb.className = `feedback ta-fb ${ok ? "ok" : "bad"}`;
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      disp.textContent = `${typed}° ✗ → ${round.answer}°`;
      if (lives <= 0) return (pending = setTimeout(() => finish(false), 2200));
      pending = setTimeout(nextRound, 2200);
    }
  }

  function onKey(e) {
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  }
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla "← Menú" debe seguir funcionando.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "tercerangulo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📐</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} ángulos calculados</p>
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
    [lives, score, rounds, hits, finished] = [startLives, 0, 0, 0, false];
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
