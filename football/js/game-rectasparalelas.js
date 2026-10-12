// "Paralelas, secantes y perpendiculares": cuatro recuadros con una pareja
// de rectas cada uno (a y b, c y d, e y f, g y h) y "Toca la pareja de
// rectas PERPENDICULARES". Al responder se dibujan las marcas del libro:
// cuadradito del ángulo recto, flechitas de paralelas o el punto de corte.
// Luego se cuentan parejas con el teclado y, al final, rectas casi
// paralelas con su ángulo con la horizontal escrito (hay que leerlo).
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const PW = 160, IN = 6, BASE = 112;
const NAMES = [["a", "b"], ["c", "d"], ["e", "f"], ["g", "h"]];
const PL = { paralelas: "PARALELAS", secantes: "SECANTES", perpendiculares: "PERPENDICULARES" };
const DEF = {
  paralelas: "Paralelas: nunca se cortan, van siempre a la misma distancia (como las vías del tren)",
  secantes: "Secantes: se cortan en un punto",
  perpendiculares: "Perpendiculares: se cortan formando cuatro ángulos rectos (90°), el cuadradito",
};
const r1 = (v) => Math.round(v * 10) / 10;
const dir = (deg) => [Math.cos((deg * Math.PI) / 180), -Math.sin((deg * Math.PI) / 180)];
const list = (xs) => xs.join(", ").replace(/, ([^,]+)$/, " y $1");

// Recorta la recta (punto P, ángulo t) al recuadro: devuelve sus dos extremos.
function clip(P, t, PH) {
  const d = dir(t), ts = [];
  if (Math.abs(d[0]) > 1e-9) [IN, PW - IN].forEach((x) => ts.push((x - P[0]) / d[0]));
  if (Math.abs(d[1]) > 1e-9) [IN, PH - IN].forEach((y) => ts.push((y - P[1]) / d[1]));
  const ok = ts.filter((k) => { const x = P[0] + k * d[0], y = P[1] + k * d[1]; return x >= IN - 1e-6 && x <= PW - IN + 1e-6 && y >= IN - 1e-6 && y <= PH - IN + 1e-6; });
  const lo = Math.min(...ok), hi = Math.max(...ok);
  return [[r1(P[0] + lo * d[0]), r1(P[1] + lo * d[1])], [r1(P[0] + hi * d[0]), r1(P[1] + hi * d[1])]];
}
function meet(p1, t1, p2, t2) {
  const d = dir(t1), e = dir(t2), den = d[0] * e[1] - d[1] * e[0];
  if (Math.abs(den) < 1e-9) return null;
  const k = ((p2[0] - p1[0]) * e[1] - (p2[1] - p1[1]) * e[0]) / den;
  return [p1[0] + k * d[0], p1[1] + k * d[1]];
}

// Una pareja de cada tipo. "casi": parecen paralelas pero difieren 3-6°.
// En el nivel de medidas las dos rectas cruzan la horizontal de abajo y
// se guarda el ángulo que forman con ella (de 35° a 145°).
function pair(type, measured, PH) {
  for (;;) {
    const C = [PW / 2 + randInt(-12, 12), PH / 2 + randInt(-10, 10)];
    let t1, t2, P1 = C, P2 = C;
    if (measured) {
      t1 = randInt(40, 140);
      t2 = type === "paralelas" ? t1 : t1 + pick([-1, 1]) * randInt(3, 6);
      const x1 = randInt(16, 56), x2 = x1 + randInt(46, 62);
      P1 = [x1, BASE]; P2 = [x2, BASE];
    } else if (type === "paralelas") {
      t1 = t2 = randInt(0, 179);
      const n = dir(t1 + 90), s = randInt(18, 26);
      P1 = [C[0] + n[0] * s, C[1] + n[1] * s]; P2 = [C[0] - n[0] * s, C[1] - n[1] * s];
    } else {
      t1 = Math.random() < 0.4 ? pick([0, 90, 45, 135]) : randInt(0, 179);
      t2 = t1 + (type === "perpendiculares" ? 90 : pick([-1, 1]) * randInt(30, 62));
    }
    const X = meet(P1, t1, P2, t2);
    const inside = X && X[0] > 18 && X[0] < PW - 18 && X[1] > 18 && X[1] < PH - 18;
    if (measured && type !== "paralelas" && (!X || (X[0] > -60 && X[0] < PW + 60 && X[1] > -60 && X[1] < PH + 60))) continue;
    if (!measured && type !== "paralelas" && !inside) continue;
    if (measured && [t1, t2].some((t) => { const l = clip(t === t1 ? P1 : P2, t, PH); return Math.min(l[0][1], l[1][1]) > 40; })) continue;
    const lines = [clip(P1, t1, PH), clip(P2, t2, PH)];
    const norm = (t) => ((t % 180) + 180) % 180;
    return { type: type === "casi" ? "secantes" : type, casi: type === "casi", t: [norm(t1), norm(t2)], lines, X: X && inside ? X.map(r1) : null, base: measured ? [P1, P2] : null, h: PH };
  }
}

// Niveles: 0 paralelas/secantes · 1 con perpendiculares · 2 contar parejas
// con el teclado · 3 casi paralelas con su ángulo escrito.
export function buildRound(level) {
  for (;;) {
    let types, ask;
    if (level === 0) { ask = pick(["paralelas", "secantes"]); const other = ask === "paralelas" ? "secantes" : "paralelas"; types = shuffle([ask, other, other, other]); }
    else if (level === 1) { ask = pick(["perpendiculares", "paralelas"]); types = shuffle([ask, ...Array.from({ length: 3 }, () => pick(["paralelas", "secantes", "perpendiculares"].filter((t) => t !== ask)))]); }
    else if (level === 2) { ask = pick(["paralelas", "perpendiculares"]); types = Array.from({ length: 4 }, () => pick(["paralelas", "secantes", "perpendiculares"])); }
    else { ask = "paralelas"; types = shuffle(["paralelas", "casi", "casi", "casi"]); }
    const pairs = types.map((t) => pair(t, level === 3, level === 2 ? 100 : 130)); // al contar, recuadros más bajos
    const hitIdx = pairs.map((p, i) => (p.type === ask ? i : -1)).filter((i) => i >= 0);
    if (level === 2 ? hitIdx.length === 0 && Math.random() < 0.7 : hitIdx.length !== 1) continue;
    const names = hitIdx.map((i) => (level === 2 ? `(${NAMES[i].join(", ")})` : NAMES[i].join(" y ")));
    let hint = level === 2 ? `${DEF[ask]}. Había ${hitIdx.length}${names.length ? `: ${list(names)}` : ""}.` : `${DEF[ask]}: ${names[0]}.`;
    if (level === 3) {
      const [i] = hitIdx, j = pairs.findIndex((p) => p.casi);
      hint = `${NAMES[i].join(" y ")} forman los dos ${pairs[i].t[0]}° con la horizontal: son paralelas. ${NAMES[j][0]} (${pairs[j].t[0]}°) y ${NAMES[j][1]} (${pairs[j].t[1]}°) parecen paralelas, pero se cortarían fuera del dibujo.`;
    }
    const prompt = level === 2 ? `¿Cuántas parejas de rectas <b>${PL[ask]}</b> hay?` : `Toca la pareja de rectas <b>${PL[ask]}</b>`;
    return { level, ask, pairs, answer: level === 2 ? hitIdx.length : hitIdx[0], count: level === 2, prompt, hint };
  }
}

function drawPair(p, k) {
  let out = "";
  if (p.base) {
    out += `<line class="rp-ref" x1="${IN}" y1="${BASE}" x2="${PW - IN}" y2="${BASE}"/>`;
    p.base.forEach((B, j) => {
      const t = p.t[j], A = [r1(B[0] + 13), BASE], E = [r1(B[0] + 13 * Math.cos((t * Math.PI) / 180)), r1(BASE - 13 * Math.sin((t * Math.PI) / 180))];
      const T = [r1(B[0] + 26 * Math.cos((t * Math.PI) / 360)), r1(BASE - 26 * Math.sin((t * Math.PI) / 360))];
      out += `<path class="rp-arc" d="M ${A} A 13 13 0 0 0 ${E}"/><text class="rp-deg" x="${T[0]}" y="${T[1] + 4}">${t}°</text>`;
    });
  }
  p.lines.forEach(([a, b], j) => {
    const top = a[1] < b[1] ? a : b, other = top === a ? b : a, L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const lab = [r1(top[0] + ((other[0] - top[0]) / L) * 12 + 9), r1(top[1] + ((other[1] - top[1]) / L) * 12 + 4)];
    out += `<line class="rp-line" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/><text class="rp-name" x="${lab[0]}" y="${lab[1]}">${NAMES[k][j]}</text>`;
  });
  // Marcas del libro (se ven al corregir).
  let mk = "";
  if (p.type === "paralelas" && !p.casi) p.lines.forEach(([a, b]) => {
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L], n = [-u[1], u[0]];
    mk += `<path d="M ${r1(m[0] - 7 * u[0] + 6 * n[0])} ${r1(m[1] - 7 * u[1] + 6 * n[1])} L ${r1(m[0])} ${r1(m[1])} L ${r1(m[0] - 7 * u[0] - 6 * n[0])} ${r1(m[1] - 7 * u[1] - 6 * n[1])}"/>`;
  });
  if (p.X && p.type === "perpendiculares") {
    const u = dir(p.t[0]), v = dir(p.t[1]), X = p.X, s = 11;
    mk += `<path d="M ${r1(X[0] + s * u[0])} ${r1(X[1] + s * u[1])} L ${r1(X[0] + s * u[0] + s * v[0])} ${r1(X[1] + s * u[1] + s * v[1])} L ${r1(X[0] + s * v[0])} ${r1(X[1] + s * v[1])}"/>`;
  }
  if (p.X && p.type === "secantes") mk += `<circle cx="${p.X[0]}" cy="${p.X[1]}" r="4.5"/>`;
  return out + `<g class="rp-marks">${mk}</g>`;
}

export function mountRectasparalelasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, busy, typed;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body rp-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 2)));
    busy = false;
    typed = "";
    body.innerHTML = `
      <p class="prompt rp-prompt">${round.prompt}</p>
      <div class="rp-grid${round.count ? " rp-small" : ""}">${round.pairs.map((p, i) => `<button type="button" class="rp-cell" data-cell="${i}"${round.count ? " disabled" : ""}><svg viewBox="0 0 ${PW} ${p.h}">${drawPair(p, i)}</svg><span class="rp-cap"></span></button>`).join("")}</div>
      ${round.count ? `<div class="rp-cuaderno rp-q">Hay <button type="button" class="rp-slot active" data-slot></button> parejas</div><div class="keypad rp-keypad" data-keypad></div>` : ""}
      <div class="feedback rp-feedback" data-feedback></div>
      <button type="button" class="secondary rp-next" data-next hidden>Siguiente →</button>
    `;
    body.querySelector("[data-next]").addEventListener("click", advance);
    body.querySelectorAll("[data-cell]").forEach((b) => b.addEventListener("click", () => tap(+b.dataset.cell)));
    if (round.count) {
      const pad = body.querySelector("[data-keypad]");
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
        btn.textContent = key;
        btn.addEventListener("click", () => pressKey(key));
        pad.appendChild(btn);
      });
    }
  }

  // Corrección: marcas del libro y nombre de cada pareja.
  function reveal() {
    body.querySelector(".rp-grid").classList.add("rp-done");
    body.querySelectorAll("[data-cell]").forEach((b) => {
      const p = round.pairs[+b.dataset.cell];
      b.querySelector(".rp-cap").textContent = p.casi ? "secantes (lejos)" : p.type;
      if (p.type === round.ask && !p.casi) b.classList.add("good");
    });
  }

  function tap(i) {
    if (finished || busy || round.count) return;
    reveal();
    const ok = i === round.answer, p = round.pairs[i];
    if (!ok) body.querySelector(`[data-cell="${i}"]`).classList.add("bad");
    resolve(ok, ok ? `✓ 💡 ${round.hint}` : `✗ ${NAMES[i].join(" y ")} son ${p.casi ? "secantes: se cortarían fuera del dibujo" : p.type}. 💡 ${round.hint}`);
  }

  function pressKey(key) {
    if (finished || busy || !round.count) return;
    if (key === "✓") {
      if (typed === "") {
        body.querySelector("[data-feedback]").textContent = "Escribe cuántas parejas hay";
        body.querySelector("[data-feedback]").className = "feedback rp-feedback bad";
        return;
      }
      reveal();
      const ok = Number(typed) === round.answer, slot = body.querySelector("[data-slot]");
      slot.classList.remove("active");
      slot.classList.add(ok ? "good" : "bad");
      if (!ok) { slot.innerHTML = `<s>${typed}</s>`; slot.insertAdjacentHTML("afterend", `<span class="rp-fix">${round.answer}</span>`); }
      return resolve(ok, ok ? `✓ 💡 ${round.hint}` : `✗ Era${round.answer === 1 ? "" : "n"} ${round.answer}. 💡 ${round.hint}`);
    }
    typed = key === "⌫" ? "" : key; // una sola cifra: de 0 a 4
    body.querySelector("[data-slot]").textContent = typed;
  }

  function resolve(ok, text) {
    busy = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = text;
    feedback.className = `feedback rp-feedback ${ok ? "ok" : "bad"}`;
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      body.querySelector("[data-next]").hidden = false;
      pending = setTimeout(advance, 2500);
    }
  }

  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
  }

  function onKey(e) {
    if (finished || !round || !round.count || busy) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  }
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "rectasparalelas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🛤️</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} aciertos de ${rounds}</p>
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
