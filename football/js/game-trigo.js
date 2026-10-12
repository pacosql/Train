// "Seno, coseno y tangente": un triángulo rectángulo dibujado con sus lados
// (ternas 3-4-5, 5-12-13, 8-15-17, 6-8-10, 9-12-15), el ángulo recto y el
// ángulo α marcados; debajo "sen α = □/□" con casillas apiladas que se
// rellenan con el teclado (vale cualquier fracción equivalente). Después,
// los ángulos notables sobre el cartabón (1, √3, 2) y la escuadra (1, 1,
// √2) con tecla "√", y por último "halla el cateto: x = 10 · sen 30° = □".
// El 💡: "SOH-CAH-TOA: seno = opuesto / hipotenusa = 3/5".
import { randInt, pick, saveScore } from "./utils.js";

const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10], [9, 12, 15]];
const FN = { sen: ["seno", "opuesto", "hipotenusa"], cos: ["coseno", "contiguo", "hipotenusa"], tan: ["tangente", "opuesto", "contiguo"] };
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
// Un lado: n (entero) o √n. Valor numérico y cómo se escribe.
const S = (n, r = false) => ({ n, r });
const val = (s) => (s.r ? Math.sqrt(s.n) : s.n);
const str = (s) => (s.r ? `√${s.n}` : `${s.n}`);
const SQ = '<svg class="tg-sym" viewBox="0 0 10 20" preserveAspectRatio="none" aria-hidden="true"><path d="M0 12 L2.5 10.5 L6 19 L10 1"/></svg>';
const rootH = (inner) => `<span class="tg-rad">${SQ}<span class="tg-ra">${inner}</span></span>`;
const html = (s) => (s.r ? rootH(s.n) : `${s.n}`);
const same = (a, b) => a.n === b.n && a.r === b.r;

// Niveles: 0 seno · 1 coseno · 2 tangente · 3 los tres mezclados ·
// 4 ángulos notables 30°/45°/60° · 5 halla el cateto con un notable.
export function buildRound(level) {
  const L = Math.min(5, level);
  const corner = pick(["L", "R"]), at = pick(["base", "top"]);
  if (L <= 3) {
    const [a, b, h] = pick(TRIPLES), [p, q] = Math.random() < 0.5 ? [a, b] : [b, a]; // p horizontal, q vertical
    const opp = at === "base" ? q : p, adj = at === "base" ? p : q;
    const fn = L <= 2 ? ["sen", "cos", "tan"][L] : pick(["sen", "cos", "tan"]);
    const [num, den] = fn === "sen" ? [opp, h] : fn === "cos" ? [adj, h] : [opp, adj];
    const g = gcd(num, den), refs = [[S(num), S(den)]];
    if (g > 1) refs.push([S(num / g), S(den / g)]);
    return {
      kind: "frac", fn, ang: "α", corner, at, p, q, labels: { p: S(p), q: S(q), h: S(h) }, target: num / den, refs,
      key: `${fn}${p},${q},${corner},${at}`, prompt: "Escribe la razón trigonométrica",
      hint: `SOH-CAH-TOA: ${FN[fn][0]} = ${FN[fn][1]} / ${FN[fn][2]} = ${num}/${den}${g > 1 ? ` = ${num / g}/${den / g}` : ""}`,
    };
  }
  const th = pick([30, 45, 60]);
  // cartabón: hipotenusa 2, catetos 1 (frente a 30°) y √3 (frente a 60°); escuadra: catetos 1, hipotenusa √2
  const opp = th === 60 ? S(3, true) : S(1), adj = th === 30 ? S(3, true) : S(1), hyp = th === 45 ? S(2, true) : S(2);
  const [lp, lq] = at === "base" ? [adj, opp] : [opp, adj];
  const tri = { corner, at, p: val(lp), q: val(lq), ang: `${th}°` };
  const who = th === 45 ? "En la escuadra (medio cuadrado de lado 1, diagonal √2)" : "En el cartabón (medio triángulo equilátero de lado 2)";
  if (L === 4) {
    const fn = pick(["sen", "cos", "tan"]);
    const [num, den] = fn === "sen" ? [opp, hyp] : fn === "cos" ? [adj, hyp] : [opp, adj];
    const refs = [[num, den]];
    // la forma sin raíz abajo (racionalizada) también es "la del libro"
    if (den.r) refs.push([S(den.n, true), S(den.n)]);
    if (!den.r && den.n === 1 && num.r) refs.push([num, S(1)]);
    const target = val(num) / val(den);
    const extra = target === 1 ? "1" : den.r ? `${str(refs[1][0])}/${str(refs[1][1])}` : den.n === 1 && num.r ? str(num) : "";
    return {
      kind: "frac", fn, ...tri, labels: { p: lp, q: lq, h: hyp }, target, refs, key: `n${fn}${th}${corner}${at}`,
      prompt: "Ángulos notables: lee el triángulo",
      hint: `${who}: ${fn} ${th}° = ${FN[fn][1]} / ${FN[fn][2]} = ${str(num)}/${str(den)}${extra ? ` = ${extra}` : ""}`,
    };
  }
  // nivel 5: halla el cateto x con un notable de valor racional
  const fn = th === 30 ? "sen" : th === 60 ? "cos" : "tan";
  const H = th === 45 ? randInt(2, 15) : 2 * randInt(2, 10), x = th === 45 ? H : H / 2;
  const blank = S(0);
  const labels = th === 45
    ? (at === "base" ? { p: S(H), q: S("x"), h: blank } : { p: S("x"), q: S(H), h: blank })
    : th === 30
      ? (at === "base" ? { p: blank, q: S("x"), h: S(H) } : { p: S("x"), q: blank, h: S(H) })
      : (at === "base" ? { p: S("x"), q: blank, h: S(H) } : { p: blank, q: S("x"), h: S(H) });
  const k = th === 45 ? "1" : "1/2";
  return {
    kind: "cateto", fn, ...tri, labels, ans: x, H, key: `c${th}${H}${corner}${at}`, prompt: "Halla el cateto x",
    hint: `${fn} ${th}° = ${k} (${FN[fn][1]} / ${FN[fn][2]}) → x = ${H} · ${k} = ${x}`,
  };
}

// ---------- dibujo del triángulo ----------
function figure(r) {
  const sc = Math.min(210 / r.p, 118 / r.q), w = r.p * sc, h = r.q * sc, x0 = (300 - w) / 2, yb = 146;
  const C = r.corner === "L" ? [x0, yb] : [x0 + w, yb];
  const Hd = r.corner === "L" ? [x0 + w, yb] : [x0, yb];
  const Vt = [C[0], yb - h];
  const A = r.at === "base" ? Hd : Vt;
  const P = [C, Hd, Vt].map((v) => v.map((z) => z.toFixed(1)).join(",")).join(" ");
  const cx = (C[0] + Hd[0] + Vt[0]) / 3, cy = (C[1] + Hd[1] + Vt[1]) / 3;
  const unit = (F, T) => { const dx = T[0] - F[0], dy = T[1] - F[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
  const t = (x, y, s, cls) => `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="${cls}">${s}</text>`;
  // ángulo recto
  const uh = unit(C, Hd), uv = unit(C, Vt), q = 12;
  const square = `<path class="tg-mark" d="M${C[0] + uh[0] * q} ${C[1]} L${C[0] + uh[0] * q} ${C[1] - q} L${C[0]} ${C[1] - q}"/>`;
  // arco del ángulo α
  const others = [C, Hd, Vt].filter((v) => v !== A), u1 = unit(A, others[0]), u2 = unit(A, others[1]), R = 24;
  const sweep = u1[0] * u2[1] - u1[1] * u2[0] > 0 ? 1 : 0;
  const arc = `<path class="tg-arc" d="M${(A[0] + u1[0] * R).toFixed(1)} ${(A[1] + u1[1] * R).toFixed(1)} A${R} ${R} 0 0 ${sweep} ${(A[0] + u2[0] * R).toFixed(1)} ${(A[1] + u2[1] * R).toFixed(1)}"/>`;
  const bis = unit([0, 0], [u1[0] + u2[0], u1[1] + u2[1]]), RL = r.ang === "α" ? 36 : 46;
  const angLab = t(A[0] + bis[0] * RL, A[1] + bis[1] * RL + 5, r.ang === "α" ? `<tspan class="tg-it">α</tspan>` : r.ang, "tg-ang");
  // rótulos de los lados, por fuera
  const side = (F, T, s) => {
    if (!s.r && s.n === 0) return "";
    const mx = (F[0] + T[0]) / 2, my = (F[1] + T[1]) / 2, l = Math.hypot(mx - cx, my - cy) || 1;
    const lab = s.n === "x" ? `<tspan class="tg-it tg-unk">x</tspan>` : s.r ? `√<tspan class="tg-ov">${s.n}</tspan>` : `${s.n}`;
    return t(mx + ((mx - cx) / l) * 15, my + ((my - cy) / l) * 15 + 5, lab, "tg-side");
  };
  return `<svg class="tg-fig" viewBox="0 0 300 170" role="img" aria-label="triángulo rectángulo">
    <polygon class="tg-tri" points="${P}"/>${square}${arc}${angLab}
    ${side(C, Hd, r.labels.p)}${side(C, Vt, r.labels.q)}${side(Hd, Vt, r.labels.h)}
  </svg>`;
}

export function mountTrigoGame(container, { client, onExit }) {
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
    <div class="game-body tg-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const slot = (k) => `<button type="button" class="tg-slot" data-slot="${k}"></button>`;

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    goNext = null;
    const prev = round && round.key;
    do round = buildRound(Math.min(5, Math.floor(hits / 2)));
    while (round.key === prev); // nunca la misma ronda dos veces seguidas
    const n = round.kind === "frac" ? 2 : 1;
    typed = Array.from({ length: n }, () => ({ d: "", r: false }));
    active = 0;
    busy = false;
    const ang = round.ang === "α" ? "<i>α</i>" : round.ang;
    const line = round.kind === "frac"
      ? `${round.fn} ${ang} = <span class="tg-frac"><span>${slot(0)}</span><span>${slot(1)}</span></span>`
      : `<i>x</i> = ${round.H} · ${round.fn} ${ang} = ${slot(0)}`;
    const notable = round.ang !== "α" && round.kind === "frac";
    body.innerHTML = `
      <p class="prompt tg-prompt">${round.prompt}</p>
      <div class="tg-cuaderno">${figure(round)}<div class="tg-line">${line}</div></div>
      <div class="keypad tg-keypad" data-keypad></div>
      ${notable ? `<button type="button" class="choice-btn keypad-sign tg-sqrt" data-sqrt>√ raíz en la casilla</button>` : ""}
      <div class="feedback tg-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    body.querySelector("[data-sqrt]")?.addEventListener("click", () => pressKey("√"));
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
      const s = typed[+b.dataset.slot];
      b.innerHTML = s.r ? rootH(s.d || "&nbsp;") : s.d;
      b.classList.toggle("active", +b.dataset.slot === active);
    });
  }

  function say(h, cls) {
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = h;
    fb.className = `feedback tg-feedback ${cls}`;
    return fb;
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return enter();
    const s = typed[active];
    if (key === "√") { if (body.querySelector("[data-sqrt]")) s.r = !s.r; }
    else if (key === "⌫") { if (s.d) s.d = s.d.slice(0, -1); else s.r = false; }
    else if (s.d.length < 3) s.d = s.d === "0" ? key : s.d + key;
    paint();
  }

  // ✓ con la casilla llena pasa a la siguiente (numerador → denominador).
  function enter() {
    const next = typed.map((_, i) => (active + 1 + i) % typed.length).find((i) => typed[i].d === "");
    if (next === undefined) return check();
    if (typed[active].d === "") return say("Escribe un número en la casilla marcada", "bad");
    active = next;
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    const v = typed.map((s) => (s.r ? Math.sqrt(+s.d) : +s.d));
    let ok, want;
    if (round.kind === "frac") {
      ok = v[1] > 0 && Math.abs(v[0] / v[1] - round.target) < 1e-9;
      // para corregir, la forma del libro que más se parezca a lo escrito
      const mine = typed.map((s) => S(+s.d, s.r));
      want = round.refs.reduce((best, ref) => (ref.filter((x, i) => same(x, mine[i])).length > best.filter((x, i) => same(x, mine[i])).length ? ref : best));
    } else {
      ok = v[0] === round.ans;
      want = [S(round.ans)];
    }
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot, s = typed[k], good = ok || same(S(+s.d, s.r), want[k]);
      b.classList.remove("active");
      b.classList.add(good ? "good" : "bad");
      if (!good) b.innerHTML = `<s>${s.r ? "√" : ""}${s.d}</s><em class="tg-fix">${html(want[k])}</em>`;
    });
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      say(`✓ 💡 ${round.hint}`, "ok");
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      goNext = () => { clearTimeout(pending); goNext = null; lives <= 0 ? finish(false) : nextRound(); };
      say(`💡 ${round.hint} <button type="button" class="tg-next" data-next>Siguiente →</button>`, "bad")
        .querySelector("[data-next]").addEventListener("click", goNext);
      pending = setTimeout(goNext, 4000);
    }
  }

  // Teclado físico: cifras, borrar, Enter y "r" (o "√") para la raíz.
  function onKey(e) {
    if (finished || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter" && goNext) return e.preventDefault(), goNext();
    const key = /^[0-9]$/.test(e.key) ? e.key : e.key === "Backspace" ? "⌫" : e.key === "Enter" ? "✓" : e.key === "r" || e.key === "√" ? "√" : null;
    if (key) { e.preventDefault(); pressKey(key); }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "trigo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📐</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} razones trigonométricas de ${rounds}</p>
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
