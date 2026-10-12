// "Teorema de Tales": la figura del libro (dos rectas secantes cortadas por
// dos paralelas, el árbol y el palo con sus sombras, o dos triángulos
// semejantes) con los segmentos rotulados y uno "x"; debajo, la proporción
// escrita como en el cuaderno ("3/6 = 4/x → x = □") y se escribe x con el
// teclado (coma decimal incluida). El 💡 hace la cuenta en cruz con los
// números de la ronda. Niveles: razón 2 → razón 3 y 1,5 → árbol y sombra →
// triángulos semejantes (un lado) → razón de semejanza y perímetro.
import { randInt, pick, saveScore } from "./utils.js";

const fmt = (n) => {
  const [i, d] = String(Math.round(n * 100) / 100).split(".");
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (d ? `,${d}` : "");
};
const near = (a, b) => Math.abs(a - b) < 1e-9;
const isHalf = (v) => near(v * 2, Math.round(v * 2));
const it = (s) => `<i>${s}</i>`;
const frac = (n, d) => `<span class="tls-frac"><span>${n}</span><span>${d}</span></span>`;
const fx = (s) => (s === "x" ? it("x") : s); // x en cursiva
// Triángulos "de libro" (lados de menor a mayor, cumplen la desigualdad triangular)
const TRI = [[3, 4, 5], [4, 5, 6], [5, 6, 7], [2, 3, 4], [4, 6, 7], [3, 5, 7], [5, 7, 8], [6, 7, 9], [4, 7, 8]];

// Niveles: 0 rectas, razón 2 · 1 rectas, razón 3 o 1,5 · 2 árbol y sombra ·
// 3 triángulos semejantes (un lado) · 4 razón de semejanza y perímetro.
// Cada ronda: renglones con {k} = casilla k, respuestas, 💡 y datos del dibujo.
export function buildRound(level) {
  const L = Math.min(4, level);
  for (;;) {
    if (L <= 1) {
      const k = L === 0 ? 2 : pick([3, 1.5]);
      const a = randInt(2, 9), c = randInt(2, 12), b = a * k, d = c * k;
      if (!Number.isInteger(b) || !Number.isInteger(d) || a === c || b > 30 || d > 30) continue;
      const unk = pick(["c", "d"]), x = unk === "c" ? c : d;
      const p = [fmt(a), fmt(b), unk === "c" ? "x" : fmt(c), unk === "d" ? "x" : fmt(d)];
      const calc = unk === "d" ? `${p[2]} · ${p[1]} / ${p[0]}` : `${p[0]} · ${p[3]} / ${p[1]}`;
      return {
        kind: "rectas", seg: { a, b, c, d }, unk, ans: [x], key: `r${a},${b},${c},${d},${unk}`,
        prompt: "Las rectas rojas son paralelas: halla x",
        lines: [`${frac(p[0], p[1])} = ${frac(fx(p[2]), fx(p[3]))} → ${it("x")} = {0}`],
        hint: `Los segmentos son proporcionales: ${p[0]}/${p[1]} = ${p[2]}/${p[3]} → x = ${calc} = ${fmt(x)}`,
      };
    }
    if (L === 2) {
      const p = pick([1, 1.5, 2]), s1 = pick([0.5, 1, 1.5, 2, 2.5, 3]), s2 = randInt(3, 15), h = (p * s2) / s1;
      if (!isHalf(h) || h < 2 || h > 10 * p || h > 24 || near(h, s2)) continue;
      const q = [fmt(p), fmt(s1), fmt(s2)];
      return {
        kind: "arbol", p, s1, s2, h, ans: [h], key: `a${p},${s1},${s2}`,
        prompt: "¿Cuánto mide el árbol?",
        lines: [`${frac(q[0], q[1])} = ${frac(it("x"), q[2])} → ${it("x")} = {0} m`],
        hint: `Los rayos del sol son paralelos, así que altura y sombra son proporcionales: ${q[0]}/${q[1]} = x/${q[2]} → x = ${q[0]} · ${q[2]} / ${q[1]} = ${fmt(h)} m`,
      };
    }
    const t = pick(TRI), k = pick([2, 3, 1.5, 2.5]), i = randInt(0, 2);
    let j;
    do j = randInt(0, 2); while (j === i);
    const K = k * t[i], x = k * t[j];
    if (!Number.isInteger(K) || !isHalf(x)) continue;
    if (L === 3) {
      return {
        kind: "tri", t, k, i, j, ans: [x], key: `t${t},${k},${i},${j}`,
        prompt: "Triángulos semejantes: halla x",
        lines: [`${frac(K, t[i])} = ${frac(it("x"), t[j])} → ${it("x")} = {0}`],
        hint: `Triángulos semejantes: los lados son proporcionales: ${K}/${t[i]} = x/${t[j]} → x = ${t[j]} · ${K} / ${t[i]} = ${fmt(x)}`,
      };
    }
    const P = t[0] + t[1] + t[2];
    return {
      kind: "peri", t, k, i, ans: [k, k * P], key: `p${t},${k},${i}`,
      prompt: "Triángulos semejantes: razón y perímetro",
      lines: [`${it("k")} = ${frac(K, t[i])} = {0}`, `${it("P′")} = ${it("k")} · ${it("P")} = {1}`],
      hint: `Razón de semejanza k = ${K}/${t[i]} = ${fmt(k)}; los perímetros van en la misma razón: P = ${t.join(" + ")} = ${P} → P′ = ${fmt(k)} · ${P} = ${fmt(k * P)}`,
    };
  }
}

// ---------- dibujos ----------
const txt = (x, y, s, cls = "") => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls}">${s}</text>`;
const seg = (A, B, cls) => `<line class="${cls}" x1="${A[0].toFixed(1)}" y1="${A[1].toFixed(1)}" x2="${B[0].toFixed(1)}" y2="${B[1].toFixed(1)}"/>`;
const lab = (s) => (s === "x" ? `<tspan class="tls-it tls-unk">x</tspan>` : s);
// rótulo en el punto medio de AB, desplazado `off` píxeles en perpendicular
function sideLabel(A, B, s, off, extra = "") {
  const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, dx = B[0] - A[0], dy = B[1] - A[1], l = Math.hypot(dx, dy);
  return txt(mx + (-dy / l) * off, my + (dx / l) * off + 4, lab(s), `tls-lab ${extra}`);
}

function figRectas({ seg: s, unk }) {
  const O = [14, 98], r = s.a / (s.a + s.b), u1 = [Math.cos(-0.28), Math.sin(-0.28)], u2 = [Math.cos(0.26), Math.sin(0.26)];
  const at = (u, l) => [O[0] + u[0] * l, O[1] + u[1] * l];
  const A = at(u1, 262 * r), B = at(u1, 262), A2 = at(u2, 248 * r), B2 = at(u2, 248);
  const ext = (P, Q) => { const dx = Q[0] - P[0], dy = Q[1] - P[1], l = Math.hypot(dx, dy); return [[P[0] - (dx / l) * 14, P[1] - (dy / l) * 14], [Q[0] + (dx / l) * 14, Q[1] + (dy / l) * 14]]; };
  const [p1, q1] = ext(A, A2), [p2, q2] = ext(B, B2);
  const dot = (P) => `<circle class="tls-dot" cx="${P[0].toFixed(1)}" cy="${P[1].toFixed(1)}" r="3"/>`;
  return `<svg class="tls-fig" viewBox="0 0 300 186" role="img" aria-label="rectas secantes cortadas por paralelas">
    ${seg(O, at(u1, 280), "tls-ray")}${seg(O, at(u2, 266), "tls-ray")}${seg(p1, q1, "tls-par")}${seg(p2, q2, "tls-par")}
    ${[O, A, B, A2, B2].map(dot).join("")}
    ${txt(O[0] - 2, O[1] - 9, "O", "tls-pt")}
    ${sideLabel(O, A, fmt(s.a), -13)}${sideLabel(A, B, fmt(s.b), -13)}
    ${sideLabel(O, A2, unk === "c" ? "x" : fmt(s.c), 17)}${sideLabel(A2, B2, unk === "d" ? "x" : fmt(s.d), 17)}
  </svg>`;
}

function figArbol({ p, s1, s2, h }) {
  const G = 166, sc = Math.min(200 / (s1 + s2), 140 / h), x0 = 44, xt = x0 + s1 * sc + 48;
  const topS = [x0, G - p * sc], topT = [xt, G - h * sc], endS = [x0 + s1 * sc, G], endT = [xt + s2 * sc, G];
  // rayo de sol: desde la punta de la sombra, hacia arriba a la izquierda (paralelos)
  const ray = (top, end) => { const dx = top[0] - end[0], dy = top[1] - end[1], l = Math.hypot(dx, dy); return seg(end, [top[0] + (dx / l) * 18, top[1] + (dy / l) * 18], "tls-sun"); };
  const ry = Math.max(10, h * sc * 0.32), rx = Math.min(16, Math.max(9, ry * 0.6)), cx = xt - rx - 9;
  return `<svg class="tls-fig" viewBox="0 0 300 186" role="img" aria-label="árbol, palo y sus sombras">
    <circle class="tls-sol" cx="16" cy="16" r="9"/>
    ${seg([x0 - 4, G], [296, G], "tls-ground")}
    ${seg([x0, G], endS, "tls-shadow")}${seg([xt, G], endT, "tls-shadow")}
    ${ray(topS, endS)}${ray(topT, endT)}
    ${seg([x0, G], topS, "tls-palo")}
    ${seg([xt, G], [xt, topT[1] + ry], "tls-trunk")}<ellipse class="tls-crown" cx="${xt}" cy="${(topT[1] + ry).toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}"/>
    ${seg([cx, G], [cx, topT[1]], "tls-cota")}${seg([cx - 4, topT[1]], [cx + 4, topT[1]], "tls-cota")}${seg([cx - 4, G], [cx + 4, G], "tls-cota")}
    ${txt(cx - 5, (G + topT[1]) / 2 + 5, lab("x"), "tls-lab tls-end")}
    ${txt(x0 - 7, Math.min((G + topS[1]) / 2 + 5, G - 4), `${fmt(p)} m`, "tls-lab tls-end")}
    ${txt((x0 + endS[0]) / 2, G + 16, `${fmt(s1)} m`, "tls-lab")}${txt((xt + endT[0]) / 2, G + 16, `${fmt(s2)} m`, "tls-lab")}
  </svg>`;
}

function figTri({ kind, t, k, i, j }) {
  const [a, b, c] = t, px = (c * c + b * b - a * a) / (2 * c), py = Math.sqrt(b * b - px * px);
  const u = Math.min(250 / (c * (1 + k)), 122 / (py * k)), G = 160;
  const tri = (x0, s) => [[x0, G], [x0 + c * s, G], [x0 + px * s, G - py * s]]; // lado 0 = P1P2, 1 = P0P2, 2 = P0P1
  const S = tri(14, u), B = tri(14 + c * u + 22, u * k);
  const sides = (V) => [[V[1], V[2]], [V[0], V[2]], [V[0], V[1]]];
  const draw = (V, labels, cls) => {
    const cx = (V[0][0] + V[1][0] + V[2][0]) / 3, cy = (V[0][1] + V[1][1] + V[2][1]) / 3;
    return `<polygon class="tls-tri ${cls}" points="${V.map((v) => v.map((z) => z.toFixed(1)).join(",")).join(" ")}"/>` +
      sides(V).map(([P, Q], n) => {
        if (labels[n] === "") return "";
        // el rótulo va por fuera: hacia el lado contrario del centro
        const mx = (P[0] + Q[0]) / 2, my = (P[1] + Q[1]) / 2, l = Math.hypot(mx - cx, my - cy);
        return txt(mx + ((mx - cx) / l) * 13, my + ((my - cy) / l) * 13 + 5, lab(labels[n]), `tls-lab ${cls}-lab`);
      }).join("");
  };
  const big = ["", "", ""];
  big[i] = fmt(k * t[i]);
  if (kind === "tri") big[j] = "x";
  return `<svg class="tls-fig" viewBox="0 0 300 186" role="img" aria-label="dos triángulos semejantes">
    ${draw(S, t.map(fmt), "tls-small")}${draw(B, big, "tls-big")}
  </svg>`;
}

const figure = (r) => (r.kind === "rectas" ? figRectas(r) : r.kind === "arbol" ? figArbol(r) : figTri(r));

export function mountTalesGame(container, { client, onExit }) {
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
    <div class="game-body tls-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const fill = (s) => s.replace(/\{(\d+)\}/g, (_, k) => `<button type="button" class="tls-slot" data-slot="${k}"></button>`);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    goNext = null;
    const prev = round && round.key;
    do round = buildRound(Math.min(4, Math.floor(hits / 2)));
    while (round.key === prev); // nunca la misma ronda dos veces seguidas
    typed = round.ans.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt tls-prompt">${round.prompt}</p>
      <div class="tls-cuaderno">${figure(round)}${round.lines.map((l) => `<div class="tls-line">${fill(l)}</div>`).join("")}</div>
      <div class="keypad tls-keypad" data-keypad></div>
      <div class="feedback tls-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary tls-ok" : ""}`;
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

  function say(html, cls) {
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = html;
    fb.className = `feedback tls-feedback ${cls}`;
    return fb;
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return enter();
    const t = typed[active];
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (key === ",") { if (!t.includes(",")) typed[active] = (t || "0") + ","; }
    else if (t.length < 5) typed[active] = t === "0" ? key : t + key;
    paint();
  }

  // ✓ con la casilla llena pasa al siguiente hueco; con todo lleno, corrige.
  function enter() {
    const n = typed.length, val = (s) => s !== "" && !s.endsWith(",");
    const next = [...Array(n).keys()].map((i) => (active + 1 + i) % n).find((i) => !val(typed[i]));
    if (next === undefined && val(typed[active])) return check();
    if (!val(typed[active])) return say("Escribe un número en la casilla marcada", "bad");
    active = next;
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    const ok = round.ans.map((w, k) => near(Number(typed[k].replace(",", ".")), w));
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot;
      b.classList.remove("active");
      b.classList.add(ok[k] ? "good" : "bad");
      if (!ok[k]) b.innerHTML = `<s>${typed[k]}</s><em class="tls-fix">${fmt(round.ans[k])}</em>`;
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
      say(`💡 ${round.hint} <button type="button" class="tls-next" data-next>Siguiente →</button>`, "bad")
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
    saveScore(client, "tales", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📏</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} proporciones resueltas de ${rounds}</p>
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
