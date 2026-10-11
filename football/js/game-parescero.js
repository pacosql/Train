// "Fichas que se anulan" — enteros con fichas de colores (Color Chips de
// NLVM, globos de Desmos/TI). Modelo de ANIQUILACIÓN, no de recta: una
// amarilla (+1) y una roja (−1) juntas forman un PAR CERO y desaparecen.
//
// Gestos:
//   · arrastrar una ficha sobre otra de signo contrario → explotan las dos;
//   · "+ par cero" mete una amarilla y una roja (no cambia el valor);
//   · RESTAR = arrastrar a la papelera las fichas que se quitan ("quita 5
//     rojas"); si no hay bastantes, primero hay que meter pares cero;
//   · SUMAR = arrastrar al tablero las fichas de la bandeja (o volcarlas).
// "Listo" comprueba que se ha hecho la operación, que no quedan pares por
// anular y que el valor es el correcto. Al fallar, el juego narra lo que
// tenía que pasar en el tablero y marca el error.
//
// Niveles: sumas sin cruzar el cero → signos distintos → restas que
// obligan a meter pares cero (2 − 5) → restar negativos (−2 − (−5)) →
// inversa ("deja +3 con exactamente 9 fichas") → fichas de álgebra
// (x amarilla alargada, −x roja) para simplificar "3x − 5 − x + 2".
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const COLS = 8;
const ROWS = 4;
const SLOTS = COLS * ROWS;
const MINUS = "−";
// p = +1 (amarilla) · n = −1 (roja) · x = +x (amarilla alargada) · nx = −x
const VAL = { p: 1, n: -1, x: 0, nx: 0 };
const OPP = { p: "n", n: "p", x: "nx", nx: "x" };

const sgn = (v) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
const signed = (v) => (v > 0 ? `+${v}` : v < 0 ? `${MINUS}${-v}` : "0");
const par = (v) => (v < 0 ? `(${MINUS}${-v})` : `${v}`);
const colorName = (k, n) => (k === "p" ? (n === 1 ? "amarilla" : "amarillas") : n === 1 ? "roja" : "rojas");
const chipsText = (k, n) => `${n} ${colorName(k, n)}`;

// Expresión algebraica px + q en texto: "2x − 3", "−x + 4", "5".
export function algText(p, q) {
  const xs = p === 0 ? "" : p === 1 ? "x" : p === -1 ? `${MINUS}x` : `${sgn(p)}x`;
  if (!xs) return sgn(q);
  if (q === 0) return xs;
  return `${xs} ${q > 0 ? "+" : MINUS} ${Math.abs(q)}`;
}

// ---------- Generador de rondas ----------
export function genParesceroRound(tier) {
  if (tier === 0) {
    // sumas sin cruzar el cero (mismo signo)
    const s = pick([1, -1]);
    const a = randInt(1, 6), b = randInt(1, Math.min(6, 10 - a));
    return { type: "add", a: s * a, b: s * b, result: s * (a + b), tier };
  }
  if (tier === 1) {
    // signos distintos
    const s = pick([1, -1]);
    let a, b;
    do {
      a = randInt(1, 7);
      b = randInt(1, 8);
    } while (a === b);
    return { type: "add", a: s * a, b: -s * b, result: s * a - s * b, tier };
  }
  if (tier === 2) {
    // restas de positivos que obligan a meter pares cero: 2 − 5
    const a = randInt(1, 4), b = randInt(a + 1, 8);
    return { type: "sub", a, b, result: a - b, tier };
  }
  if (tier === 3) {
    // restar negativos (y restar a un negativo)
    const kind = pick(["negneg", "negneg", "negpos", "posneg"]);
    let a, b;
    if (kind === "negneg") {
      do {
        a = -randInt(1, 6);
        b = -randInt(1, 7);
      } while (a === b);
    } else if (kind === "negpos") {
      a = -randInt(1, 6);
      b = randInt(1, 6);
    } else {
      a = randInt(1, 6);
      b = -randInt(1, 6);
    }
    return { type: "sub", a, b, result: a - b, tier };
  }
  if (tier === 4) {
    // inversa: deja el tablero en v usando exactamente n fichas
    const v = pick([1, -1]) * randInt(1, 5);
    const n = Math.abs(v) + 2 * randInt(1, 4);
    return { type: "make", v, n, yellow: (n + v) / 2, red: (n - v) / 2, tier };
  }
  // tier 5: fichas de álgebra "3x − 5 − x + 2"
  let a, b, c, d;
  do {
    a = pick([1, -1]) * randInt(1, 4);
    c = -Math.sign(a) * randInt(1, 3);
    b = pick([1, -1]) * randInt(1, 5);
    d = -Math.sign(b) * randInt(1, 5);
  } while (a + c === 0 && b + d === 0);
  const terms = shuffle([
    { k: "x", c: a },
    { k: "1", c: b },
    { k: "x", c: c },
    { k: "1", c: d },
  ]);
  // el primer término nunca empieza por x suelto con coeficiente 1 raro: da igual, se formatea bien
  return { type: "alg", terms, p: a + c, q: b + d, tier };
}

export function opText(r) {
  if (r.type === "add") return `${sgn(r.a)} + ${par(r.b)}`;
  if (r.type === "sub") return `${sgn(r.a)} ${MINUS} ${par(r.b)}`;
  if (r.type === "make") return `${signed(r.v)} con ${r.n} fichas`;
  return r.terms
    .map((t, i) => {
      const abs = Math.abs(t.c);
      const body = t.k === "x" ? (abs === 1 ? "x" : `${abs}x`) : `${abs}`;
      if (i === 0) return t.c < 0 ? `${MINUS}${body}` : body;
      return `${t.c < 0 ? MINUS : "+"} ${body}`;
    })
    .join(" ");
}

// Fichas con las que empieza el tablero.
export function initialChips(r) {
  if (r.type === "add" || r.type === "sub") return Array(Math.abs(r.a)).fill(r.a > 0 ? "p" : "n");
  if (r.type === "make") return [];
  const out = [];
  for (const t of r.terms) {
    const k = t.k === "x" ? (t.c > 0 ? "x" : "nx") : t.c > 0 ? "p" : "n";
    for (let i = 0; i < Math.abs(t.c); i++) out.push(k);
  }
  return out;
}
export function trayChips(r) {
  return r.type === "add" ? Array(Math.abs(r.b)).fill(r.b > 0 ? "p" : "n") : [];
}

// ---------- Corrección ----------
// st = { counts: {p,n,x,nx} en el tablero, trayLeft, removed: {p,n,x,nx} }
export function judgeParescero(r, st) {
  const c = st.counts;
  const errors = [];
  const value = c.p - c.n;
  if (r.type === "make") {
    const total = c.p + c.n;
    if (total !== r.n) errors.push("count");
    if (value !== r.v) errors.push("value");
    return { ok: errors.length === 0, errors, value };
  }
  if (r.type === "alg") {
    if (c.x && c.nx) errors.push("pairsx");
    if (c.p && c.n) errors.push("pairs");
    return { ok: errors.length === 0, errors, value };
  }
  if (r.type === "add" && st.trayLeft > 0) errors.push("tray");
  if (r.type === "sub") {
    const need = r.b > 0 ? "p" : "n";
    const other = OPP[need];
    if (st.removed[other] > 0) errors.push("wrongcolor");
    if (st.removed[need] < Math.abs(r.b)) errors.push("short");
    if (st.removed[need] > Math.abs(r.b)) errors.push("extra");
  }
  if (c.p && c.n) errors.push("pairs");
  if (value !== r.result) errors.push("value");
  return { ok: errors.length === 0, errors, value };
}

// ---------- Narración de lo que tenía que pasar ----------
export function narrate(r) {
  if (r.type === "add") {
    const ka = r.a > 0 ? "p" : "n", kb = r.b > 0 ? "p" : "n";
    const A = Math.abs(r.a), B = Math.abs(r.b);
    const res = r.result;
    const left = res === 0 ? "no queda nada → 0" : `quedan ${chipsText(res > 0 ? "p" : "n", Math.abs(res))} → ${signed(res)}`;
    if (ka === kb) return `Tenías ${chipsText(ka, A)} y añades ${chipsText(kb, B)}: no hay pares que anular, ${left}.`;
    const pairs = Math.min(A, B);
    return `Tenías ${chipsText(ka, A)} y añades ${chipsText(kb, B)}: se forman ${pairs} ${pairs === 1 ? "par cero que se anula" : "pares cero que se anulan"} y ${left}.`;
  }
  if (r.type === "sub") {
    const ka = r.a > 0 ? "p" : "n", kb = r.b > 0 ? "p" : "n";
    const A = Math.abs(r.a), B = Math.abs(r.b);
    const have = ka === kb ? A : 0;
    const res = r.result;
    const left = res === 0 ? "no queda nada → 0" : `quedan ${chipsText(res > 0 ? "p" : "n", Math.abs(res))} → ${signed(res)}`;
    const rule = `Restar ${sgn(r.b)} es lo mismo que sumar ${signed(-r.b)}.`;
    let s = `Tenías ${chipsText(ka, A)} y había que quitar ${chipsText(kb, B)}: `;
    if (have >= B) s += `las quitas y ${left}.`;
    else {
      const pairs = B - have;
      s += `${have === 0 ? `no hay ninguna ${colorName(kb, 1)}, así que ` : ""}metes ${pairs} ${pairs === 1 ? "par cero" : "pares cero"} (${chipsText("p", pairs)} y ${chipsText("n", pairs)}), quitas ${chipsText(kb, B)} y ${left}.`;
    }
    return `${s} ${rule}`;
  }
  if (r.type === "make") {
    const big = r.v > 0 ? "p" : "n", small = OPP[big];
    const nb = Math.max(r.yellow, r.red), ns = Math.min(r.yellow, r.red);
    return `Para tener ${signed(r.v)} con ${r.n} fichas: ${chipsText("p", r.yellow)} y ${chipsText("n", r.red)}. Las ${chipsText(small, ns)} se anulan con ${ns} ${colorName(big, ns)} (${ns} ${ns === 1 ? "par cero vale" : "pares cero valen"} 0) y sobran ${chipsText(big, nb - ns)} → ${signed(r.v)}. Truco: (${r.n} ${r.v > 0 ? "+" : MINUS} ${Math.abs(r.v)}) ÷ 2 = ${nb} ${colorName(big, nb)}.`;
  }
  // álgebra
  const xs = r.terms.filter((t) => t.k === "x"), us = r.terms.filter((t) => t.k === "1");
  const part = (ts, isX) => {
    const pos = ts.filter((t) => t.c > 0).reduce((s, t) => s + t.c, 0);
    const neg = -ts.filter((t) => t.c < 0).reduce((s, t) => s + t.c, 0);
    const name = (v) => (isX ? algText(v, 0) : sgn(v));
    const pairs = Math.min(pos, neg);
    const res = pos - neg;
    const unit = isX ? (pairs === 1 ? "pareja x/−x" : "parejas x/−x") : pairs === 1 ? "par cero" : "pares cero";
    return `${name(pos)} y ${name(-neg)}: se ${pairs === 1 ? "anula" : "anulan"} ${pairs} ${unit} y queda ${res === 0 ? "0" : name(res)}`;
  };
  return `${part(xs, true)}. ${part(us, false)}. Una x y un 1 no se anulan entre sí (son de distinto tipo). Resultado: ${algText(r.p, r.q)}.`;
}

export function mountParesceroGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let round = null;
  let slots = []; // tipo de ficha en cada hueco o null
  let tray = []; // fichas aún por sumar
  let removed = null; // fichas tiradas a la papelera, por tipo
  let log = null; // lo que ha hecho el jugador (para la narración)
  let busy = false;
  const timers = new Set();
  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body pz-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  let boardEl, fxEl, taskEl, dockEl, toolsEl, feedback, storyEl;
  const mini = (k) => `<i class="pz-mini pz-${k}"></i>`;

  function chipHtml(k, attrs = "") {
    const label = { p: "+", n: MINUS, x: "x", nx: `${MINUS}x` }[k];
    return `<div class="pz-chip pz-${k}" data-k="${k}" ${attrs}><span>${label}</span></div>`;
  }

  function nextRound() {
    const tier = level < 12 ? Math.floor(level / 2) : randInt(1, 5);
    round = genParesceroRound(tier);
    slots = Array(SLOTS).fill(null);
    initialChips(round).forEach((k, i) => (slots[i] = k));
    tray = trayChips(round);
    removed = { p: 0, n: 0, x: 0, nx: 0 };
    log = { pairs: 0, cancelled: 0, cancelledX: 0 };
    busy = false;
    const help = {
      add: "Arrastra las fichas de la bandeja al tablero (o vuélcalas). Una amarilla sobre una roja: ¡par cero!",
      sub: "Restar es QUITAR: arrastra a la papelera las fichas que pide. ¿No hay bastantes? Mete pares cero.",
      make: "Mete fichas con los botones y quítalas arrastrándolas a la papelera.",
      alg: "Arrastra x sobre −x y +1 sobre −1 para anularlas. Una x y un 1 no se anulan.",
    }[round.type];
    body.innerHTML = `
      <p class="prompt pz-prompt"><span class="pz-op" data-op>${round.type === "make" ? `Deja el tablero en <b>${signed(round.v)}</b> usando exactamente <b>${round.n}</b> fichas` : opText(round)}</span>
        <small>${help}</small></p>
      <div class="pz-task" data-task></div>
      <div class="pz-boardwrap">
        <div class="pz-board ${round.type === "alg" ? "pz-alg" : ""}" data-board></div>
        <div class="pz-fx" data-fx></div>
      </div>
      <div class="pz-dock" data-dock></div>
      <div class="pz-tools" data-tools></div>
      <div class="feedback" data-feedback></div>
      <div class="pz-story" data-story></div>
    `;
    boardEl = body.querySelector("[data-board]");
    fxEl = body.querySelector("[data-fx]");
    taskEl = body.querySelector("[data-task]");
    dockEl = body.querySelector("[data-dock]");
    toolsEl = body.querySelector("[data-tools]");
    feedback = body.querySelector("[data-feedback]");
    storyEl = body.querySelector("[data-story]");
    toolsEl.innerHTML = `
      ${round.type === "make" ? `<button type="button" class="secondary pz-btn" data-add="p">+ ${mini("p")}</button><button type="button" class="secondary pz-btn" data-add="n">+ ${mini("n")}</button>` : ""}
      ${round.type !== "alg" ? `<button type="button" class="secondary pz-btn" data-pair>+ par cero ${mini("p")}${mini("n")}</button>` : ""}
      <button type="button" class="primary pz-btn" data-done>Listo</button>`;
    toolsEl.querySelector("[data-pair]")?.addEventListener("click", addPair);
    toolsEl.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => addChip(b.dataset.add)));
    toolsEl.querySelector("[data-done]").addEventListener("click", done);
    paint();
  }

  const counts = () => {
    const c = { p: 0, n: 0, x: 0, nx: 0 };
    slots.forEach((k) => k && c[k]++);
    return c;
  };
  const freeSlot = () => slots.indexOf(null);
  const freeCount = () => slots.filter((k) => k === null).length;

  function paint(marks = {}) {
    boardEl.innerHTML = slots
      .map((k, i) => `<div class="pz-slot ${marks.slots?.has(i) ? "pz-errslot" : ""}" data-slot="${i}">${k ? chipHtml(k, `data-at="${i}"`) : ""}</div>`)
      .join("");
    // encargo
    const c = counts();
    if (round.type === "sub") {
      const need = round.b > 0 ? "p" : "n";
      const B = Math.abs(round.b);
      taskEl.innerHTML = `Quita ${B} ${mini(need)} <b>${colorName(need, B)}</b> · <span class="pz-count ${marks.task ? "pz-bad" : ""}" data-removed>${removed[need]}/${B}</span>`;
    } else if (round.type === "add") {
      taskEl.innerHTML = `Suma ${Math.abs(round.b)} ${mini(round.b > 0 ? "p" : "n")} ${colorName(round.b > 0 ? "p" : "n", Math.abs(round.b))} · <span class="pz-count ${marks.task ? "pz-bad" : ""}" data-trayleft>faltan ${tray.length}</span>`;
    } else if (round.type === "make") {
      taskEl.innerHTML = `Fichas en el tablero: <span class="pz-count ${marks.task ? "pz-bad" : ""}" data-total>${c.p + c.n}</span> de ${round.n}`;
    } else {
      taskEl.innerHTML = `Simplifica: anula todas las parejas`;
    }
    // bandeja o papelera
    if (round.type === "add") {
      dockEl.innerHTML = `
        <div class="pz-tray ${marks.task ? "pz-errbox" : ""}" data-tray>${tray.map((k, i) => chipHtml(k, `data-tray-i="${i}"`)).join("") || `<span class="pz-empty">bandeja vacía ✓</span>`}</div>
        ${tray.length ? `<button type="button" class="secondary pz-btn" data-dump>Volcar todo ⤵</button>` : ""}`;
      dockEl.querySelector("[data-dump]")?.addEventListener("click", dump);
    } else if (round.type === "sub" || round.type === "make") {
      const shown = Object.entries(removed)
        .filter(([, n]) => n)
        .map(([k, n]) => `${n}${mini(k)}`)
        .join(" ");
      dockEl.innerHTML = `<div class="pz-trash ${marks.trash ? "pz-errbox" : ""}" data-trash><span class="pz-bin">🗑</span><span>Papelera</span><span class="pz-binlist" data-binlist>${shown || "vacía"}</span></div>`;
    } else dockEl.innerHTML = "";
    const pairBtn = toolsEl.querySelector("[data-pair]");
    if (pairBtn) pairBtn.disabled = busy || freeCount() < 2;
    toolsEl.querySelectorAll("[data-add]").forEach((b) => (b.disabled = busy || freeCount() < 1));
    const doneBtn = toolsEl.querySelector("[data-done]");
    if (doneBtn) doneBtn.disabled = busy;
    if (!busy) {
      boardEl.querySelectorAll("[data-at]").forEach((el) => bindDrag(el, "board", Number(el.dataset.at)));
      dockEl.querySelectorAll("[data-tray-i]").forEach((el) => bindDrag(el, "tray", Number(el.dataset.trayI)));
    }
  }

  function addPair() {
    if (busy || finished || freeCount() < 2) return;
    slots[freeSlot()] = "p";
    slots[freeSlot()] = "n";
    log.pairs++;
    paint();
  }
  function addChip(k) {
    if (busy || finished || freeCount() < 1) return;
    slots[freeSlot()] = k;
    log[k] = (log[k] || 0) + 1;
    paint();
  }
  function dump() {
    if (busy || finished) return;
    while (tray.length && freeCount()) slots[freeSlot()] = tray.pop();
    paint();
  }

  // Efecto de explosión en la posición de un hueco.
  function boom(rect) {
    const host = fxEl.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "pz-boom";
    el.style.left = `${rect.left - host.left + rect.width / 2}px`;
    el.style.top = `${rect.top - host.top + rect.height / 2}px`;
    fxEl.appendChild(el);
    later(() => el.remove(), 520);
  }

  function say(text, cls = "") {
    feedback.textContent = text;
    feedback.className = `feedback ${cls}`;
  }

  function bindDrag(el, from, idx) {
    el.addEventListener("pointerdown", (e) => {
      if (busy || finished) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const k = from === "board" ? slots[idx] : tray[idx];
      const sx = e.clientX, sy = e.clientY;
      let ghost = null;
      const targetAt = (x, y) => {
        const trash = dockEl.querySelector("[data-trash]");
        if (trash && inside(trash, x, y, 6)) return { trash: true };
        for (const s of boardEl.querySelectorAll("[data-slot]")) if (inside(s, x, y, 0)) return { slot: Number(s.dataset.slot), el: s };
        if (inside(boardEl, x, y, 10)) return { board: true };
        return null;
      };
      const move = (ev) => {
        if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
        if (!ghost) {
          ghost = document.createElement("div");
          ghost.className = "pz-ghost";
          ghost.innerHTML = chipHtml(k);
          document.body.appendChild(ghost);
          el.classList.add("pz-lifting");
        }
        ghost.style.left = `${ev.clientX}px`;
        ghost.style.top = `${ev.clientY}px`;
        const t = targetAt(ev.clientX, ev.clientY);
        boardEl.querySelectorAll(".pz-over").forEach((s) => s.classList.remove("pz-over"));
        dockEl.querySelector("[data-trash]")?.classList.toggle("pz-over", !!t?.trash);
        if (t?.el) t.el.classList.add("pz-over");
      };
      const up = (ev) => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
        if (!ghost) return;
        ghost.remove();
        if (ev.type !== "pointerup") return paint();
        drop(from, idx, k, targetAt(ev.clientX, ev.clientY));
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    });
  }
  function inside(el, x, y, pad) {
    const r = el.getBoundingClientRect();
    return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
  }

  function drop(from, idx, k, t) {
    say("");
    const take = () => (from === "board" ? (slots[idx] = null) : tray.splice(idx, 1));
    if (!t) return paint();
    if (t.trash) {
      if (from !== "board") return paint();
      take();
      removed[k]++;
      return paint();
    }
    if (t.slot !== undefined && t.slot === idx && from === "board") return paint();
    const other = t.slot !== undefined ? slots[t.slot] : null;
    if (other && other === OPP[k]) {
      // ¡par cero! explotan las dos
      const rect = t.el.getBoundingClientRect();
      take();
      slots[t.slot] = null;
      if (k === "x" || k === "nx") log.cancelledX++;
      else log.cancelled++;
      paint();
      boom(rect);
      return;
    }
    if (other) {
      if ((k === "x" || k === "nx") !== (other === "x" || other === "nx")) {
        say(`Una ${k.includes("x") ? "x" : "unidad"} y ${other.includes("x") ? "una x" : "una unidad"} no forman par cero: son de distinto tipo.`, "bad");
      }
      if (from === "tray") {
        const f = freeSlot();
        if (f < 0) return paint();
        take();
        slots[f] = k;
      }
      return paint();
    }
    // hueco vacío o el tablero en general
    const dest = t.slot !== undefined ? t.slot : freeSlot();
    if (dest < 0) return paint();
    take();
    slots[dest] = k;
    paint();
  }

  // ---------- Comprobar ----------
  function done() {
    if (busy || finished) return;
    const c = counts();
    const res = judgeParescero(round, { counts: c, trayLeft: tray.length, removed });
    rounds++;
    busy = true;
    if (res.ok) {
      score += 10;
      level++;
      renderScore();
      paint();
      const big = round.type === "alg" ? algText(c.x - c.nx, c.p - c.n) : signed(res.value);
      say(round.type === "make" ? `¡Exacto! ${c.p + c.n} fichas que valen ${big}` : "¡Bien simplificado!", "ok");
      storyEl.innerHTML = `<div class="pz-big" data-big>${opText(round).replace(/ con .*/, "")} = <b>${big}</b></div>`;
      if (round.type === "make") storyEl.innerHTML = `<div class="pz-big" data-big>${c.p} ${mini("p")} ${MINUS} ${c.n} ${mini("n")} = <b>${big}</b></div>`;
      later(nextRound, 1700);
      return;
    }
    lives--;
    renderLives();
    // marca el error en el tablero
    const marks = { slots: new Set() };
    const e = res.errors;
    if (e.includes("pairs") || e.includes("pairsx")) {
      const pairsOf = (a, b) => {
        const ia = slots.map((k, i) => (k === a ? i : -1)).filter((i) => i >= 0);
        const ib = slots.map((k, i) => (k === b ? i : -1)).filter((i) => i >= 0);
        const m = Math.min(ia.length, ib.length);
        ia.slice(0, m).concat(ib.slice(0, m)).forEach((i) => marks.slots.add(i));
      };
      if (e.includes("pairs")) pairsOf("p", "n");
      if (e.includes("pairsx")) pairsOf("x", "nx");
    }
    if (e.includes("tray") || e.includes("short") || e.includes("extra") || e.includes("count")) marks.task = true;
    if (e.includes("wrongcolor") || e.includes("extra")) marks.trash = true;
    paint(marks);
    const why = [];
    const nPairs = Math.min(c.p, c.n), nPairsX = Math.min(c.x, c.nx);
    if (e.includes("tray")) why.push(`aún quedan ${tray.length} fichas en la bandeja por sumar`);
    if (e.includes("short")) {
      const need = round.b > 0 ? "p" : "n";
      why.push(`solo has quitado ${removed[need]} de las ${Math.abs(round.b)} ${colorName(need, 2)} que había que quitar`);
    }
    if (e.includes("extra")) {
      const need = round.b > 0 ? "p" : "n";
      why.push(`has quitado ${removed[need]} ${colorName(need, 2)} y eran ${Math.abs(round.b)}`);
    }
    if (e.includes("wrongcolor")) {
      const other = round.b > 0 ? "n" : "p";
      why.push(`has tirado ${chipsText(other, removed[other])} que no había que quitar`);
    }
    if (e.includes("pairs")) why.push(`quedan ${nPairs} ${nPairs === 1 ? "par cero" : "pares cero"} sin anular (amarilla + roja = 0)`);
    if (e.includes("pairsx")) why.push(`quedan ${nPairsX} ${nPairsX === 1 ? "pareja" : "parejas"} x/−x sin anular`);
    if (e.includes("count")) why.push(`hay ${c.p + c.n} fichas y tenían que ser ${round.n}`);
    if (e.includes("value")) {
      const want = round.type === "make" ? round.v : round.result;
      why.push(`el tablero vale ${signed(res.value)} (${chipsText("p", c.p)} y ${chipsText("n", c.n)}) y tenía que valer ${signed(want)}`);
    }
    say(`✗ ${why.join("; ")}.`, "bad");
    const you = [];
    if (log.pairs) you.push(`metiste ${log.pairs} ${log.pairs === 1 ? "par cero" : "pares cero"}`);
    if (log.p) you.push(`metiste ${chipsText("p", log.p)}`);
    if (log.n) you.push(`metiste ${chipsText("n", log.n)}`);
    const rm = ["p", "n"].filter((k) => removed[k]).map((k) => chipsText(k, removed[k]));
    if (rm.length) you.push(`quitaste ${rm.join(" y ")}`);
    if (log.cancelled) you.push(`anulaste ${log.cancelled} ${log.cancelled === 1 ? "par" : "pares"}`);
    if (log.cancelledX) you.push(`anulaste ${log.cancelledX} x/−x`);
    const right = round.type === "make" ? `${chipsText("p", round.yellow)} y ${chipsText("n", round.red)}` : round.type === "alg" ? algText(round.p, round.q) : signed(round.result);
    storyEl.innerHTML = `
      ${you.length ? `<p class="pz-you"><b>Tú:</b> ${you.join(", ")}.</p>` : ""}
      <p class="pz-narr" data-narr><b>Lo que tenía que pasar:</b> ${narrate(round)}</p>
      <div class="pz-big pz-bigbad" data-big>${round.type === "make" ? "Solución" : opText(round)} = <b>${right}</b></div>
      <button type="button" class="primary pz-btn" data-next>${lives <= 0 ? "Ver resultado →" : "Siguiente →"}</button>`;
    storyEl.querySelector("[data-next]").addEventListener("click", () => {
      if (finished) return;
      if (lives <= 0) finish(false);
      else nextRound();
    });
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    for (const id of timers) clearTimeout(id);
    timers.clear();
    document.querySelectorAll(".pz-ghost").forEach((g) => g.remove());
    if (userExited) return onExit();
    saveScore(client, "parescero", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🟡🔴</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} operaciones con fichas de ${rounds}</p>
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
    for (const id of timers) clearTimeout(id);
    timers.clear();
    document.querySelectorAll(".pz-ghost").forEach((g) => g.remove());
  };
}
