// "Clasifica triángulos": seis triángulos dibujados como en el libro
// (rayitas en los lados iguales, cuadradito en el ángulo recto) y "Toca
// TODOS los isósceles". Cada triángulo se marca/desmarca al tocarlo y ✓
// comprueba. Al responder, cada uno lleva debajo su nombre. En el último
// nivel no hay marcas: se clasifican leyendo las medidas escritas.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const CW = 160, CH = 100;
const SIDE = { isosceles: "isósceles", equilatero: "equiláteros", escaleno: "escalenos" };
const ANG = { rectangulo: "rectángulos", acutangulo: "acutángulos", obtusangulo: "obtusángulos" };
const ONE = { isosceles: "isósceles", equilatero: "equilátero", escaleno: "escaleno", rectangulo: "rectángulo", acutangulo: "acutángulo", obtusangulo: "obtusángulo" };
const DEF = {
  isosceles: "Isósceles: dos lados iguales (las dos rayitas) y uno distinto",
  equilatero: "Equilátero: los tres lados iguales (rayita en los tres)",
  escaleno: "Escaleno: los tres lados distintos (sin rayitas)",
  rectangulo: "Rectángulo: tiene un ángulo recto, de 90° (el cuadradito)",
  acutangulo: "Acutángulo: sus tres ángulos son agudos, menores de 90°",
  obtusangulo: "Obtusángulo: tiene un ángulo obtuso, mayor de 90°",
};
const r1 = (v) => Math.round(v * 10) / 10;
const odd = (lo, hi, skipLo, skipHi) => { for (;;) { const v = randInt(lo, hi); if (v < skipLo || v > skipHi) return v; } };

// Ángulos (enteros) de un triángulo de cada clase; "near" acerca un ángulo a 90°.
function anglesOf(s, a, near) {
  for (;;) {
    let t;
    if (s === "equilatero") t = [60, 60, 60];
    else if (s === "isosceles") {
      const apex = a === "rectangulo" ? 90 : a === "obtusangulo" ? 2 * randInt(50, 70) : 2 * odd(15, 40, 26, 34);
      t = [apex, (180 - apex) / 2, (180 - apex) / 2];
    } else if (a === "rectangulo") { const x = odd(25, 65, 39, 51); t = [90, x, 90 - x]; }
    else if (a === "obtusangulo") { const c = near ? randInt(92, 96) : randInt(105, 140), x = randInt(15, 180 - c - 15); t = [c, x, 180 - c - x]; }
    else { const c = near ? randInt(84, 88) : randInt(40, 80), x = randInt(40, 82); t = [c, x, 180 - c - x]; }
    const [p, q, r] = t, kindA = Math.max(p, q, r) === 90 ? "rectangulo" : Math.max(p, q, r) > 90 ? "obtusangulo" : "acutangulo";
    const distinct = Math.min(Math.abs(p - q), Math.abs(q - r), Math.abs(p - r)) >= 10;
    if (Math.min(p, q, r) >= 15 && kindA === a && (s !== "escaleno" || distinct)) return shuffle(t);
  }
}
// Lados enteros (cm) para el nivel de medidas: la clase por lados manda.
function lensOf(s) {
  for (;;) {
    const a = randInt(3, 9), b = randInt(3, 9), c = randInt(3, 9);
    const t = s === "equilatero" ? [a, a, a] : s === "isosceles" ? [a, a, b] : [a, b, c];
    const [x, y, z] = t.slice().sort((m, n) => m - n);
    const eqs = (t[0] === t[1]) + (t[1] === t[2]) + (t[0] === t[2]);
    if (x + y > z + 1 && (s === "equilatero" ? eqs === 3 : s === "isosceles" ? eqs === 1 : eqs === 0)) return shuffle(t);
  }
}

// Vértices a partir de los ángulos (o de los lados), girados y encajados en la celda.
function place(ang, lens, mg) {
  let P;
  if (lens) {
    const [a, b, c] = lens, x = (b * b + c * c - a * a) / (2 * c); // a opuesto a P0, b a P1, c a P2
    P = [[0, 0], [c, 0], [x, -Math.sqrt(b * b - x * x)]];
  } else {
    const [A, B] = ang.map((d) => (d * Math.PI) / 180), t = Math.sin(B) / Math.sin(A + B);
    P = [[0, 0], [1, 0], [t * Math.cos(A), -t * Math.sin(A)]];
  }
  const rot = (randInt(0, 359) * Math.PI) / 180;
  P = P.map(([x, y]) => [x * Math.cos(rot) - y * Math.sin(rot), x * Math.sin(rot) + y * Math.cos(rot)]);
  const xs = P.map((p) => p[0]), ys = P.map((p) => p[1]);
  const s = Math.min((CW - 2 * mg) / (Math.max(...xs) - Math.min(...xs)), (CH - 2 * mg) / (Math.max(...ys) - Math.min(...ys)));
  const ox = (CW - s * (Math.max(...xs) - Math.min(...xs))) / 2 - s * Math.min(...xs), oy = (CH - s * (Math.max(...ys) - Math.min(...ys))) / 2 - s * Math.min(...ys);
  return P.map(([x, y]) => [r1(ox + s * x), r1(oy + s * y)]);
}

// Niveles: 0 por lados · 1 por ángulos · 2 las dos cosas a la vez ·
// 3 sin marcas, leyendo las medidas (lados en cm o ángulos en grados).
export function buildRound(level, roundNo = 0) {
  const mode = level === 0 ? "s" : level === 1 ? "a" : level === 2 ? "sa" : roundNo % 2 ? "a" : "s";
  for (;;) {
    let ask, tris;
    const anyA = (s) => (s === "equilatero" ? "acutangulo" : pick(Object.keys(ANG)));
    if (mode === "s") {
      ask = { s: pick(Object.keys(SIDE)) };
      const pool = ask.s === "isosceles" ? ["isosceles", "escaleno"] : Object.keys(SIDE);
      tris = Array.from({ length: 6 }, () => { const s = pick(pool); return { s, a: anyA(s) }; });
    } else if (mode === "a") {
      ask = { a: pick(Object.keys(ANG)) };
      tris = Array.from({ length: 6 }, () => { const a = pick(Object.keys(ANG)); return { s: a === "acutangulo" && Math.random() < 0.2 ? "equilatero" : pick(["isosceles", "escaleno"]), a }; });
    } else {
      // Mezcla: sin equiláteros, con señuelos que cumplen solo una de las dos cosas.
      ask = { s: pick(["isosceles", "escaleno"]), a: pick(Object.keys(ANG)) };
      const other = (k, v) => pick(Object.keys(k === "s" ? { isosceles: 1, escaleno: 1 } : ANG).filter((x) => x !== v));
      tris = [
        ...Array.from({ length: randInt(1, 3) }, () => ({ ...ask })),
        { s: ask.s, a: other("a", ask.a) }, { s: other("s", ask.s), a: ask.a },
      ];
      while (tris.length < 6) tris.push({ s: pick(["isosceles", "escaleno"]), a: pick(Object.keys(ANG)) });
      tris = shuffle(tris);
    }
    const hit = (t) => (!ask.s || t.s === ask.s) && (!ask.a || t.a === ask.a);
    const n = tris.filter(hit).length;
    if (n < 1 || n > 4) continue;
    const L3 = level >= 3;
    tris = tris.map((t) => {
      const lens = L3 && mode === "s" ? lensOf(t.s) : null;
      const ang = lens ? null : anglesOf(t.s, t.a, L3 && mode === "a" && Math.random() < 0.5);
      const P = place(ang, lens, L3 ? 24 : 12);
      const key = lens || ang; // lado i opuesto al vértice i; iguales si su ángulo/medida opuesta lo es
      const eq = [0, 1, 2].filter((i) => [0, 1, 2].some((j) => j !== i && key[j] === key[i]));
      // Con lados escritos, la clase por ángulos sale de los lados (z² frente a x² + y²).
      const [x, y, z] = lens ? lens.slice().sort((m, k) => m - k) : [];
      const a = lens ? (z * z === x * x + y * y ? "rectangulo" : z * z > x * x + y * y ? "obtusangulo" : "acutangulo") : t.a;
      return { ...t, a, ang, lens, P, eq, right: ang ? ang.indexOf(90) : -1, target: hit(t) };
    });
    const ex = tris.find((t) => t.target);
    const word = ask.s && ask.a ? `${ANG[ask.a]} ${SIDE[ask.s].startsWith("i") ? "e" : "y"} ${SIDE[ask.s]}` : SIDE[ask.s] || ANG[ask.a];
    let hint = [ask.a, ask.s].filter(Boolean).map((k) => DEF[k]).join(". ");
    if (L3) hint += ex.lens ? `, como el de ${ex.lens.slice().sort((x, y) => x - y).join(", ").replace(/, (\d+)$/, " y $1")} cm` : `, como el de ${ex.ang.slice().sort((x, y) => x - y).map((d) => d + "°").join(", ").replace(/, ([^,]+)$/, " y $1")}`;
    hint += `. Había ${n}.`;
    return { level, mode, ask, tris, n, prompt: `Toca TODOS los <b>${word}</b>`, hint, marks: !L3 };
  }
}

function drawTri(t, marks) {
  const P = t.P, c = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3];
  let out = `<polygon class="ct-tri" points="${P.map((p) => p.join(",")).join(" ")}"/>`;
  const side = (i) => [P[(i + 1) % 3], P[(i + 2) % 3]];
  if (marks) {
    t.eq.forEach((i) => { // rayita en el centro del lado
      const [a, b] = side(i), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L];
      out += `<line class="ct-mark" x1="${r1(m[0] - 6 * n[0])}" y1="${r1(m[1] - 6 * n[1])}" x2="${r1(m[0] + 6 * n[0])}" y2="${r1(m[1] + 6 * n[1])}"/>`;
    });
    if (t.right >= 0) {
      const v = P[t.right], u = (q) => { const L = Math.hypot(q[0] - v[0], q[1] - v[1]); return [((q[0] - v[0]) / L) * 10, ((q[1] - v[1]) / L) * 10]; };
      const a = u(P[(t.right + 1) % 3]), b = u(P[(t.right + 2) % 3]);
      out += `<path class="ct-mark" d="M ${r1(v[0] + a[0])} ${r1(v[1] + a[1])} L ${r1(v[0] + a[0] + b[0])} ${r1(v[1] + a[1] + b[1])} L ${r1(v[0] + b[0])} ${r1(v[1] + b[1])}"/>`;
    }
  } else if (t.lens) {
    t.lens.forEach((l, i) => {
      const [a, b] = side(i), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = Math.hypot(m[0] - c[0], m[1] - c[1]);
      out += `<text class="ct-meas" x="${r1(m[0] + ((m[0] - c[0]) / d) * 11)}" y="${r1(m[1] + ((m[1] - c[1]) / d) * 11 + 4)}">${l} cm</text>`;
    });
  } else {
    t.ang.forEach((g, i) => {
      const v = P[i], d = Math.hypot(c[0] - v[0], c[1] - v[1]), k = Math.min(g < 45 ? 30 : 21, d * 0.75);
      out += `<text class="ct-meas" x="${r1(v[0] + ((c[0] - v[0]) / d) * k)}" y="${r1(v[1] + ((c[1] - v[1]) / d) * k + 4)}">${g}°</text>`;
    });
  }
  return out;
}

export function mountClasificatriangulosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, picked, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body ct-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 2)), rounds);
    picked = new Set();
    busy = false;
    body.innerHTML = `
      <p class="prompt ct-prompt">${round.prompt}</p>
      <div class="ct-grid">${round.tris.map((t, i) => `<button type="button" class="ct-cell" data-cell="${i}"><svg viewBox="0 0 ${CW} ${CH}">${drawTri(t, round.marks)}</svg><span class="ct-cap"></span></button>`).join("")}</div>
      <button type="button" class="primary ct-check" data-check>✓ Comprobar</button>
      <div class="feedback ct-feedback" data-feedback></div>
      <button type="button" class="secondary ct-next" data-next hidden>Siguiente →</button>
    `;
    body.querySelectorAll("[data-cell]").forEach((b) => b.addEventListener("click", () => {
      if (busy) return;
      const i = +b.dataset.cell;
      picked.has(i) ? picked.delete(i) : picked.add(i);
      b.classList.toggle("on", picked.has(i));
    }));
    body.querySelector("[data-check]").addEventListener("click", check);
    body.querySelector("[data-next]").addEventListener("click", advance);
  }

  function check() {
    if (finished || busy) return;
    const feedback = body.querySelector("[data-feedback]");
    if (picked.size === 0) {
      feedback.textContent = "Toca al menos un triángulo";
      feedback.className = "feedback ct-feedback bad";
      return;
    }
    busy = true;
    rounds++;
    let miss = 0, extra = 0;
    // Al corregir: cada triángulo lleva su nombre; los que faltan, en verde
    // a rayas; los que sobran, en rojo.
    body.querySelectorAll("[data-cell]").forEach((b) => {
      const t = round.tris[+b.dataset.cell], on = picked.has(+b.dataset.cell);
      b.querySelector(".ct-cap").textContent = `${ONE[t.s]} · ${ONE[t.a]}`;
      if (t.target && !on) { b.classList.add("miss"); miss++; }
      else if (!t.target && on) { b.classList.add("bad"); extra++; }
      else if (t.target) b.classList.add("good");
    });
    body.querySelector("[data-check]").disabled = true;
    if (!miss && !extra) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ct-feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const parts = [];
      if (miss) parts.push(`falta${miss > 1 ? "n" : ""} ${miss}`);
      if (extra) parts.push(`sobra${extra > 1 ? "n" : ""} ${extra}`);
      feedback.textContent = `✗ ${parts.join(" y ")}. 💡 ${round.hint}`;
      feedback.className = "feedback ct-feedback bad";
      body.querySelector("[data-next]").hidden = false;
      pending = setTimeout(advance, 2500);
    }
  }

  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
  }

  const onKey = (e) => { if (e.key === "Enter" && !finished && round && !busy) check(); };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "clasificatriangulos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔺</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} clasificaciones exactas de ${rounds}</p>
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
    round = null;
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
