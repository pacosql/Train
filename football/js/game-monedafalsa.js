// "La moneda falsa" — el clásico problema de las pesadas (y la actividad
// "Gold Coin" de Mathigon/Polypad). Aquí no se calcula un peso: se DISEÑA
// EL EXPERIMENTO. Cada pesada tiene 3 resultados (baja la izquierda,
// equilibrio, baja la derecha), así que con P pesadas se distinguen como
// mucho 3^P casos, y solo llega quien reparte en tres montones parejos.
//
// Gesto: hay N monedas numeradas iguales y una es falsa. Se ARRASTRAN
// monedas a los platos de la balanza (o se tocan para ciclar
// fuera → izquierda → derecha → fuera) y se pulsa «Pesar»: la balanza se
// inclina o se queda equilibrada. Al final se señala la falsa.
//
// El ordenador es un ADVERSARIO: la falsa no está fijada de antemano. En
// cada pesada elige el resultado que más le conviene (uno que ya no se
// pueda resolver con las pesadas que quedan y, si no, el que deja más
// candidatas), siempre coherente con lo que ya se ha visto. Así con 8
// monedas y 2 pesadas el 4 contra 4 pierde y el 3-3-2 gana siempre.
//
// Niveles: 3 monedas/1 pesada → 9/2 → 8/2 → 27/3 → 12/3 con una falsa
// que puede pesar MÁS o MENOS (hay que decir también cuál de las dos).
import { randInt, pick, saveScore } from "./utils.js";

// ---------- Lógica pura ----------
// Hipótesis = { c: moneda, s: −1 (pesa menos) | +1 (pesa más) }.
// Resultado de una pesada: "izq" (baja la izquierda), "eq" o "der".
export function outcomeOf(h, place) {
  const p = place[h.c];
  if (p === "L") return h.s > 0 ? "izq" : "der";
  if (p === "R") return h.s > 0 ? "der" : "izq";
  return "eq";
}

// Resume las hipótesis por clases de moneda: u = puede pesar más o menos,
// h = solo más, l = solo menos (el resto son buenas seguro).
export function classesOf(hyps) {
  const m = new Map();
  for (const h of hyps) m.set(h.c, (m.get(h.c) || 0) | (h.s > 0 ? 2 : 1));
  let u = 0, hh = 0, l = 0;
  for (const v of m.values()) v === 3 ? u++ : v === 2 ? hh++ : l++;
  return { u, h: hh, l };
}

const memo = new Map();
// ¿Se puede identificar la falsa (y su sentido) con r pesadas desde este
// estado, juegue lo que juegue el adversario? N = monedas totales (las
// que no son sospechosas sirven de "buenas" para rellenar un plato).
export function canWin(u, h, l, N, r) {
  const H = 2 * u + h + l;
  if (H <= 1) return true;
  if (r <= 0 || H > 3 ** r) return false;
  const g = Math.min(N - u - h - l, 14);
  const key = `${u},${h},${l},${g},${r}`;
  if (memo.has(key)) return memo.get(key);
  const res = !!findMove(u, h, l, N, r, true);
  memo.set(key, res);
  return res;
}

// Busca una pesada (por clases) tras la cual todos los resultados sigan
// siendo resolubles; prefiere la más pareja. Devuelve null si no hay.
export function findMove(u, h, l, N, r, firstOnly = false) {
  const g = N - u - h - l;
  let best = null;
  for (let u1 = 0; u1 <= u; u1++)
    for (let u2 = 0; u1 + u2 <= u; u2++)
      for (let h1 = 0; h1 <= h; h1++)
        for (let h2 = 0; h1 + h2 <= h; h2++)
          for (let l1 = 0; l1 <= l; l1++)
            for (let l2 = 0; l1 + l2 <= l; l2++) {
              const n1 = u1 + h1 + l1, n2 = u2 + h2 + l2;
              if (n1 + n2 === 0) continue;
              const g1 = Math.max(0, n2 - n1), g2 = Math.max(0, n1 - n2);
              if (g1 + g2 > g) continue; // no hay buenas para igualar platos
              const outs = [
                [0, u1 + h1, u2 + l2],
                [u - u1 - u2, h - h1 - h2, l - l1 - l2],
                [0, u2 + h2, u1 + l1],
              ];
              if (!outs.every(([a, b, c]) => canWin(a, b, c, N, r - 1))) continue;
              const worst = Math.max(...outs.map(([a, b, c]) => 2 * a + b + c));
              if (!best || worst < best.worst || (worst === best.worst && g1 + g2 < best.g1 + best.g2))
                best = { u1, u2, h1, h2, l1, l2, g1, g2, worst };
              if (firstOnly) return best;
            }
  return best;
}

// El adversario: de los 3 resultados posibles (con alguna candidata)
// elige uno sin salida si lo hay; si no, el que deja más candidatas.
export function adversary(hyps, place, N, rAfter) {
  const groups = { izq: [], eq: [], der: [] };
  for (const h of hyps) groups[outcomeOf(h, place)].push(h);
  const opts = Object.entries(groups)
    .filter(([, g]) => g.length > 0)
    .map(([o, g]) => {
      const k = classesOf(g);
      return { o, g, dead: !canWin(k.u, k.h, k.l, N, rAfter) };
    });
  const top = (a, b) => (a.dead !== b.dead ? (a.dead ? -1 : 1) : b.g.length - a.g.length);
  opts.sort(top);
  const ties = opts.filter((x) => top(x, opts[0]) === 0);
  const ch = pick(ties);
  return { outcome: ch.o, hyps: ch.g, counts: { izq: groups.izq.length, eq: groups.eq.length, der: groups.der.length }, deadBy: Object.fromEntries(opts.map((x) => [x.o, x.dead])) };
}

export const LEVELS = [
  { n: 3, p: 1, both: false },
  { n: 9, p: 2, both: false },
  { n: 8, p: 2, both: false },
  { n: 27, p: 3, both: false },
  { n: 12, p: 3, both: true },
];
export function levelFor(level) {
  if (level < LEVELS.length) return LEVELS[level];
  const r = Math.random();
  if (r < 0.3) return { n: randInt(4, 9), p: 2, both: false };
  if (r < 0.6) return { n: randInt(10, 27), p: 3, both: false };
  if (r < 0.75) return { n: 3, p: 2, both: true };
  return { n: randInt(8, 12), p: 3, both: true };
}
export function initialHyps(cfg) {
  const hyps = [];
  for (let c = 0; c < cfg.n; c++) {
    hyps.push({ c, s: -1 });
    if (cfg.both) hyps.push({ c, s: 1 });
  }
  return hyps;
}

const OUT_TXT = { izq: "baja la izquierda", eq: "se equilibra", der: "baja la derecha" };
const plural = (k, a, b) => (k === 1 ? a : b);

export function mountMonedafalsaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let busy = false;
  let cfg = null;
  let hyps = [];
  let place = [];
  let used = 0;
  let log = [];
  let mode = "weigh"; // "weigh" | "answer"
  let selected = -1;
  let tilt = "eq";
  let timers = [];
  let ghost = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const q = (s) => body.querySelector(s);
  const later = (fn, ms) => timers.push(setTimeout(() => !finished && fn(), ms));

  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    cfg = levelFor(level);
    hyps = initialHyps(cfg);
    place = Array(cfg.n).fill("out");
    used = 0;
    log = [];
    mode = "weigh";
    selected = -1;
    tilt = "eq";
    busy = false;
    const task = cfg.both
      ? `${cfg.n} monedas; una es falsa y pesa <b>más o menos</b> (no se sabe). Encuéntrala y di si pesa más o menos.`
      : `${cfg.n} monedas; una es falsa y pesa <b>menos</b>.`;
    body.innerHTML = `
      <p class="prompt mf-prompt">¿Cuál es la moneda falsa?<small>${task} Tienes ${cfg.p} ${plural(cfg.p, "pesada", "pesadas")}.</small></p>
      <div class="mf-status" data-status></div>
      <div class="mf-scale" data-scale>
        <svg class="mf-svg" viewBox="0 0 330 210" aria-hidden="true">
          <path class="mf-stand" d="M165 40 L165 192 M120 198 L210 198 L196 190 L134 190 Z"></path>
          <g class="mf-beam" data-beam>
            <line class="mf-bar" x1="60" y1="40" x2="270" y2="40"></line>
          </g>
          <circle class="mf-pivot" cx="165" cy="40" r="7"></circle>
          <g class="mf-pan-g" data-pang="L">
            <path class="mf-string" d="M60 40 L10 150 M60 40 L110 150"></path>
            <path class="mf-dish" d="M4 150 L116 150 Q110 168 60 168 Q10 168 4 150 Z"></path>
          </g>
          <g class="mf-pan-g" data-pang="R">
            <path class="mf-string" d="M270 40 L220 150 M270 40 L320 150"></path>
            <path class="mf-dish" d="M214 150 L326 150 Q320 168 270 168 Q220 168 214 150 Z"></path>
          </g>
        </svg>
        <div class="mf-pile mf-pile-l" data-pile="L"></div>
        <div class="mf-pile mf-pile-r" data-pile="R"></div>
        <div class="mf-verdict" data-verdict></div>
      </div>
      <div class="mf-tray" data-tray></div>
      <div class="mf-actions" data-actions></div>
      <ol class="mf-log" data-log></ol>
      <div class="feedback mf-feedback" data-feedback></div>
      <div class="mf-why" data-why hidden></div>
      <button type="button" class="primary mf-next" data-next hidden>Siguiente →</button>
    `;
    q("[data-next]").addEventListener("click", () => nextRound());
    paint();
  }

  // ---------- Pintado ----------
  function coinHTML(c, small) {
    const k = coinState(c);
    const cls = ["mf-coin", small ? "mf-sm" : "", k.cand ? "" : "mf-dim", selected === c ? "mf-sel" : ""].join(" ");
    const tag = cfg.both && k.cand && k.tag ? `<span class="mf-tag">${k.tag}</span>` : "";
    return `<button type="button" class="${cls}" data-coin="${c}" data-cand="${k.cand ? 1 : 0}"${cfg.both && k.tag ? ` data-tag="${k.tag}"` : ""} aria-label="Moneda ${c + 1}">${c + 1}${tag}</button>`;
  }
  // ¿Sigue siendo sospechosa? y, si la falsa puede pesar más o menos,
  // la marca: "+" solo puede pesar más, "−" solo menos, "±" cualquiera.
  function coinState(c) {
    let hv = false, lt = false;
    for (const h of hyps) if (h.c === c) h.s > 0 ? (hv = true) : (lt = true);
    return { cand: hv || lt, tag: hv && lt ? "±" : hv ? "+" : lt ? "−" : "" };
  }

  function paint() {
    const cands = new Set(hyps.map((h) => h.c)).size;
    q("[data-status]").innerHTML =
      `<span>⚖️ Pesadas: <b data-used>${used}</b>/${cfg.p}</span>` +
      `<span>🔎 ${cfg.both ? `Casos posibles: <b data-left>${hyps.length}</b>` : `Sospechosas: <b data-left>${cands}</b>`}</span>`;
    for (const side of ["L", "R"]) {
      const coins = place.map((p, c) => (p === side ? c : -1)).filter((c) => c >= 0);
      q(`[data-pile="${side}"]`).innerHTML = coins.map((c) => coinHTML(c, true)).join("");
    }
    const out = place.map((p, c) => (p === "out" ? c : -1)).filter((c) => c >= 0);
    q("[data-tray]").innerHTML = out.map((c) => coinHTML(c, false)).join("") || `<span class="mf-empty">(todas en la balanza)</span>`;
    body.querySelectorAll("[data-coin]").forEach(bindCoin);
    applyTilt();
    paintActions();
    q("[data-log]").innerHTML = log
      .map(
        (w, i) =>
          `<li><b>${i + 1}ª</b> ${w.L.map((c) => c + 1).join(" ")} <span class="mf-vs">⚖</span> ${w.R.map((c) => c + 1).join(" ")} → <b>${OUT_TXT[w.outcome]}</b></li>`
      )
      .join("");
  }

  function paintActions() {
    const a = q("[data-actions]");
    if (busy) return;
    if (mode === "weigh") {
      a.innerHTML = `
        <button type="button" class="primary" data-weigh ${used >= cfg.p ? "disabled" : ""}>⚖️ Pesar</button>
        <button type="button" class="secondary" data-know>🎯 Ya sé cuál es</button>`;
      a.querySelector("[data-weigh]").addEventListener("click", weigh);
      a.querySelector("[data-know]").addEventListener("click", () => {
        if (busy || finished) return;
        mode = "answer";
        selected = -1;
        say("Toca la moneda falsa.", "");
        paint();
      });
    } else {
      const s = selected >= 0 ? selected + 1 : "…";
      const dis = selected < 0 ? "disabled" : "";
      a.innerHTML = cfg.both
        ? `<button type="button" class="primary" data-answer="1" ${dis}>Es la ${s} y pesa MÁS</button>
           <button type="button" class="primary" data-answer="-1" ${dis}>Es la ${s} y pesa MENOS</button>`
        : `<button type="button" class="primary" data-answer="-1" ${dis}>✅ Es la ${s}</button>`;
      if (used < cfg.p) a.insertAdjacentHTML("beforeend", `<button type="button" class="secondary" data-back>↩️ Seguir pesando</button>`);
      a.querySelectorAll("[data-answer]").forEach((b) => b.addEventListener("click", () => answer(Number(b.dataset.answer))));
      a.querySelector("[data-back]")?.addEventListener("click", () => {
        if (busy || finished) return;
        mode = "weigh";
        selected = -1;
        say("", "");
        paint();
      });
    }
  }

  function applyTilt() {
    const ang = tilt === "izq" ? -9 : tilt === "der" ? 9 : 0;
    const dy = 105 * Math.sin((Math.abs(ang) * Math.PI) / 180);
    const dL = tilt === "izq" ? dy : tilt === "der" ? -dy : 0;
    q("[data-beam]").style.transform = `rotate(${ang}deg)`;
    q('[data-pang="L"]').style.transform = `translateY(${dL}px)`;
    q('[data-pang="R"]').style.transform = `translateY(${-dL}px)`;
    const s = (q("[data-scale]").getBoundingClientRect().width || 330) / 330;
    q('[data-pile="L"]').style.setProperty("--mf-dy", `${dL * s}px`);
    q('[data-pile="R"]').style.setProperty("--mf-dy", `${-dL * s}px`);
    q("[data-scale]").dataset.tilt = tilt;
  }

  function say(text, kind) {
    const f = q("[data-feedback]");
    f.innerHTML = text;
    f.className = `feedback mf-feedback ${kind}`;
  }

  // ---------- Gestos: tocar o arrastrar monedas ----------
  function bindCoin(el) {
    const c = Number(el.dataset.coin);
    el.addEventListener("pointerdown", (e) => {
      if (busy || finished) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const sx = e.clientX, sy = e.clientY;
      let dragging = false;
      const move = (ev) => {
        if (!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 8) return;
        if (mode !== "weigh") return;
        if (!dragging) {
          dragging = true;
          ghost = document.createElement("div");
          ghost.className = "mf-ghost";
          ghost.textContent = c + 1;
          document.body.appendChild(ghost);
          el.classList.add("mf-lifting");
        }
        ghost.style.left = `${ev.clientX}px`;
        ghost.style.top = `${ev.clientY}px`;
        const t = dropTarget(ev);
        q("[data-scale]").dataset.over = t === "L" || t === "R" ? t : "";
      };
      const up = (ev) => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
        if (finished) return;
        if (!dragging) return tap(c);
        ghost?.remove();
        ghost = null;
        q("[data-scale]").dataset.over = "";
        const t = ev.type === "pointercancel" ? null : dropTarget(ev);
        if (t && t !== place[c]) setPlace(c, t);
        else paint();
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    });
  }
  function dropTarget(ev) {
    const inside = (r, m = 0) => ev.clientX >= r.left - m && ev.clientX <= r.right + m && ev.clientY >= r.top - m && ev.clientY <= r.bottom + m;
    const sr = q("[data-scale]").getBoundingClientRect();
    if (inside(sr)) return ev.clientX < sr.left + sr.width / 2 ? "L" : "R";
    if (inside(q("[data-tray]").getBoundingClientRect(), 16)) return "out";
    return null;
  }
  function tap(c) {
    if (mode === "answer") {
      selected = c;
      paint();
      return;
    }
    setPlace(c, place[c] === "out" ? "L" : place[c] === "L" ? "R" : "out");
  }
  function setPlace(c, where) {
    place[c] = where;
    tilt = "eq"; // al tocar los platos la balanza vuelve a estar quieta
    q("[data-verdict]").textContent = "";
    say("", "");
    paint();
  }

  // ---------- Pesar ----------
  function weigh() {
    if (busy || finished || used >= cfg.p) return;
    const nL = place.filter((p) => p === "L").length;
    const nR = place.filter((p) => p === "R").length;
    if (nL === 0 && nR === 0) return say("Pon monedas en los platos (arrástralas o tócalas).", "bad");
    if (nL !== nR)
      return say(`Así la balanza no dice nada útil: pon las mismas en cada plato (ahora ${nL} contra ${nR}). No se gasta pesada.`, "bad");
    busy = true;
    const before = classesOf(hyps);
    const rAfter = cfg.p - used - 1;
    const res = adversary(hyps, place, cfg.n, rAfter);
    log.push({
      L: place.map((p, c) => (p === "L" ? c : -1)).filter((c) => c >= 0),
      R: place.map((p, c) => (p === "R" ? c : -1)).filter((c) => c >= 0),
      outcome: res.outcome,
      counts: res.counts,
      deadBy: res.deadBy,
      before,
      hypsBefore: hyps.length,
      rAfter,
    });
    used++;
    // Si la balanza ya estaba inclinada, primero vuelve a nivel y luego
    // se inclina con el nuevo resultado (se ve que es otra pesada).
    const lag = tilt !== "eq" ? 400 : 0;
    tilt = "eq";
    say("", "");
    q("[data-verdict]").textContent = "";
    q("[data-actions]").innerHTML = "";
    applyTilt();
    later(() => {
      tilt = res.outcome;
      applyTilt();
    }, lag + 20);
    later(() => {
      hyps = res.hyps;
      q("[data-verdict]").textContent = res.outcome === "eq" ? "⚖️ ¡Equilibrio!" : res.outcome === "izq" ? "⬇️ Baja la izquierda" : "Baja la derecha ⬇️";
      busy = false;
      if (used >= cfg.p) {
        mode = "answer";
        selected = -1;
        say("Se acabaron las pesadas: toca la moneda falsa.", "");
      }
      paint();
    }, lag + 750);
  }

  // ---------- Responder ----------
  function answer(sign) {
    if (busy || finished || selected < 0) return;
    busy = true;
    rounds++;
    const c = selected;
    const sure = hyps.length === 1;
    const right = sure && hyps[0].c === c && (!cfg.both || hyps[0].s === sign);
    q("[data-actions]").innerHTML = "";
    if (right) {
      score += 10;
      level++;
      renderScore();
      markFake(c, true);
      say(`¡Sí! La falsa es la ${c + 1}${cfg.both ? ` y pesa ${sign > 0 ? "más" : "menos"}` : ""}. Las pesadas no dejaban otra. +10`, "ok");
      later(nextRound, 1500);
      return;
    }
    // El adversario elige una falsa coherente con todo lo pesado que NO
    // sea la respuesta dada (si existe).
    const others = hyps.filter((h) => !(h.c === c && (!cfg.both || h.s === sign)));
    const real = others.length ? pick(others.filter((h) => h.c !== c).length ? others.filter((h) => h.c !== c) : others) : hyps[0];
    lives--;
    renderLives();
    markFake(real.c, false);
    const realTxt = `la ${real.c + 1}${cfg.both ? ` (y pesa ${real.s > 0 ? "más" : "menos"})` : ""}`;
    if (sure) say(`✗ Las pesadas solo dejaban una posibilidad: ${realTxt}.`, "bad");
    else
      say(
        `✗ Aún no se podía saber: quedaban ${hyps.length} ${cfg.both ? "casos" : "sospechosas"} y la falsa resultó ser ${realTxt}.`,
        "bad"
      );
    const w = q("[data-why]");
    w.innerHTML = explain(sure);
    w.hidden = false;
    if (lives <= 0) later(() => finish(false), 2600);
    else q("[data-next]").hidden = false;
  }

  function markFake(c, ok) {
    selected = -1;
    paint();
    body.querySelectorAll(`[data-coin="${c}"]`).forEach((b) => b.classList.add(ok ? "mf-found" : "mf-real"));
  }

  // Árbol de la partida: cuántas candidatas dejaba cada resultado de cada
  // pesada, dónde dejó de llegar 3^(pesadas que quedan), y cómo repartir.
  function explain(sure) {
    const unit = cfg.both ? "casos" : "candidatas";
    const parts = [];
    let firstBad = -1;
    log.forEach((w, i) => {
      const dead = Object.values(w.deadBy).some(Boolean);
      if (dead && firstBad < 0) firstBad = i;
      parts.push(
        `<li class="${dead && firstBad === i ? "mf-badrow" : ""}"><b>${i + 1}ª pesada</b> (${w.L.length} contra ${w.R.length}, ${w.hypsBefore} ${unit}): ` +
          `si baja la izquierda → ${w.counts.izq} · si se equilibra → ${w.counts.eq} · si baja la derecha → ${w.counts.der}.</li>`
      );
    });
    let html = log.length ? `<ol class="mf-tree">${parts.join("")}</ol>` : "";
    if (firstBad >= 0) {
      const w = log[firstBad];
      const max = Math.max(w.counts.izq, w.counts.eq, w.counts.der);
      const cap = 3 ** w.rAfter;
      const capTxt =
        w.rAfter === 0
          ? "y no te quedaba ninguna pesada"
          : `y solo te ${plural(w.rAfter, "quedaba", "quedaban")} ${w.rAfter} ${plural(w.rAfter, "pesada", "pesadas")}, que ${plural(w.rAfter, "distingue", "distinguen")} como mucho ${w.rAfter > 1 ? `3${w.rAfter === 2 ? "²" : "³"} = ${cap}` : "3"}`;
      html +=
        max > cap
          ? `<p>En la ${firstBad + 1}ª pesada estuvo el fallo: un resultado dejaba ${max} ${unit} ${capTxt} → no llega.</p>`
          : `<p>En la ${firstBad + 1}ª pesada estuvo el fallo: algún resultado dejaba ${unit} que no se podían separar con lo que quedaba.</p>`;
      const k = w.before;
      const mv = findMove(k.u, k.h, k.l, cfg.n, w.rAfter + 1);
      if (mv) html += `<p><b>Mejor:</b> ${describeMove(mv, k)}</p>`;
    } else if (!sure) {
      html += `<p>Te ${plural(cfg.p - used, "quedaba", "quedaban")} ${cfg.p - used} ${plural(cfg.p - used, "pesada", "pesadas")}: había que seguir pesando antes de señalar.</p>`;
    }
    html += `<p class="mf-rule">📏 Regla: cada pesada tiene 3 resultados, así que con P pesadas se distinguen como mucho 3ᴾ ${cfg.both ? "casos (moneda + más/menos)" : "monedas"}: 3¹ = 3, 3² = 9, 3³ = 27.</p>`;
    return html;
  }

  function describeMove(mv, k) {
    if (!cfg.both) {
      const out = k.l - mv.l1 - mv.l2;
      const rest = mv.worst === 1 ? "queda como mucho 1" : `quedan como mucho ${mv.worst}`;
      if (mv.l1 === mv.l2) return `reparte ${mv.l1}-${mv.l2}-${out}: ${mv.l1} sospechosas en cada plato y ${out} fuera. Salga lo que salga, ${rest}.`;
      const pad = (k) => (k ? ` + ${k} ${plural(k, "buena", "buenas")}` : "");
      return `izquierda: ${mv.l1} sospechosas${pad(mv.g1)}; derecha: ${mv.l2}${pad(mv.g2)}; fuera: ${out}. Salga lo que salga, ${rest}.`;
    }
    const side = (u, h, l, g) =>
      [u && `${u} ±`, h && `${h} «+»`, l && `${l} «−»`, g && `${g} ${plural(g, "buena", "buenas")}`].filter(Boolean).join(", ") || "nada";
    return `izquierda: ${side(mv.u1, mv.h1, mv.l1, mv.g1)}; derecha: ${side(mv.u2, mv.h2, mv.l2, mv.g2)}. Salga lo que salga, queda${mv.worst === 1 ? " como mucho 1 caso" : `n como mucho ${mv.worst} casos`}.`;
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    timers = [];
    ghost?.remove();
    ghost = null;
    if (userExited) return onExit();
    saveScore(client, "monedafalsa", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🪙</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} monedas falsas cazadas</p>
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
    level = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
    timers = [];
    ghost?.remove();
    ghost = null;
    document.querySelectorAll(".mf-ghost").forEach((g) => g.remove());
  };
}
