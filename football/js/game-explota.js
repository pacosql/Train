// "Máquina de explosiones" (Exploding Dots, de James Tanton).
//
// Una fila de cajas (de derecha a izquierda) y una regla grande arriba,
// p. ej. "1 ← 2": cuando una caja tiene 2 puntos, esos 2 EXPLOTAN y dejan
// 1 punto en la caja de su izquierda. Aquí la regla no se representa: se
// EJECUTA a mano.
//  - Tocar una caja con suficientes puntos → ¡pum!: los b puntos se juntan
//    y sale 1 (o a) en la caja de la izquierda.
//  - Arrastrar un punto a la caja de la derecha (o mantenerlo pulsado) lo
//    DESEXPLOTA: vuelve a ser b puntos en la caja de la derecha.
//  - Antipuntos (○): un punto y un antipunto en la misma caja hacen ¡pop!
//    y desaparecen los dos (tocar la caja). Así se resta y se "pide
//    prestado" desexplotando.
// Cada ronda acaba en "Listo": si aún quedaba algo por explotar (o por
// hacer pop) esa caja parpadea y se pierde vida; si no, se comprueba el
// número tecleado (el código en base b, cuántos puntos había, el
// resultado de la suma/resta…). Al fallar aparece el valor de cada caja
// (1, 2, 4, 8… / 1, 3, 9… / 1, 3/2, 9/4… en la máquina rara 2←3) y la
// cuenta que da el número.
import { randInt, saveScore } from "./utils.js";

const CAP = 30; // máximo de puntos que caben a la vista en una caja

// Etapas en orden; a partir de la última se mezclan las de la 3 en adelante.
const STAGES = [
  { kind: "code", a: 1, b: 2, boxes: 5, nMin: 5, nMax: 15 },
  { kind: "count", a: 1, b: 2, boxes: 5, nMin: 6, nMax: 15 },
  { kind: "rev", a: 1, b: 2, boxes: 4, nMin: 5, nMax: 15 },
  { kind: "code", a: 1, b: 3, boxes: 4, nMin: 10, nMax: 26 },
  { kind: "rev", a: 1, b: 3, boxes: 4, nMin: 10, nMax: 26 },
  { kind: "sum", a: 1, b: 10, boxes: 3, digits: 2 },
  { kind: "sum", a: 1, b: 10, boxes: 4, digits: 3 },
  { kind: "sub", a: 1, b: 10, boxes: 2, digits: 2 },
  { kind: "sub", a: 1, b: 10, boxes: 3, digits: 3 },
  { kind: "code", a: 2, b: 3, boxes: 5, nMin: 5, nMax: 15 },
];
export const EXPLOTA_STAGES = STAGES.length;

// ---------- Aritmética de la máquina ----------
const gcd = (x, y) => (y ? gcd(y, x % y) : x);
// Valor de un punto de la caja i en la máquina a←b: (b/a)^i.
export function boxValue(a, b, i) {
  const num = b ** i;
  const den = a ** i;
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}
const fmtVal = (v) => (v.den === 1 ? `${v.num}` : `${v.num}/${v.den}`);

// Explota sin parar (en cualquier orden el resultado es el mismo) y
// devuelve los dígitos, caja 0 = la de la derecha.
export function stableDigits(a, b, n, N) {
  const c = new Array(n).fill(0);
  c[0] = N;
  let moved = true;
  while (moved) {
    moved = false;
    for (let i = 0; i < n - 1; i++) {
      while (c[i] >= b) {
        c[i] -= b;
        c[i + 1] += a;
        moved = true;
      }
    }
  }
  return c;
}
const codeOf = (digits) => {
  const s = digits.slice().reverse().join("").replace(/^0+/, "");
  return s || "0";
};
const digitsOf = (x, n) => Array.from({ length: n }, (_, i) => Math.floor(x / 10 ** i) % 10);

// ---------- Generador de rondas ----------
let uid = 0;
const mk = (k, t = 0) => ({ id: ++uid, k, t }); // k: "d" punto, "x" antipunto; t: color

export function buildExplotaRound(stageIdx) {
  const st = STAGES[stageIdx];
  const { a, b, boxes: n } = st;
  const cells = Array.from({ length: n }, () => []);
  const r = { ...st, n, cells, stage: stageIdx };
  if (st.kind === "code" || st.kind === "count") {
    const N = randInt(st.nMin, st.nMax);
    for (let i = 0; i < N; i++) cells[0].push(mk("d"));
    const dig = stableDigits(a, b, n, N);
    r.N = N;
    r.digits = dig;
    r.needStable = true;
    if (st.kind === "code") {
      r.answer = codeOf(dig);
      r.isCode = true;
      r.prompt = `Mete <b>${N}</b> puntos y explota`;
      r.sub = "Toca una caja para explotar. Cuando ya no se pueda, escribe el código que queda.";
      r.label = `Código de ${N}`;
    } else {
      r.answer = String(N);
      r.prompt = "¿Cuántos puntos hay?";
      r.sub = "Explota hasta que no se pueda más y calcula cuántos había con el código.";
      r.label = "Había";
    }
  } else if (st.kind === "rev") {
    const N = randInt(st.nMin, st.nMax);
    const dig = stableDigits(a, b, n, N);
    dig.forEach((c, i) => {
      for (let j = 0; j < c; j++) cells[i].push(mk("d"));
    });
    r.N = N;
    r.digits = dig;
    r.code = codeOf(dig);
    r.answer = String(N);
    r.needStable = false;
    r.prompt = `El código <b>${r.code}</b>: ¿cuántos puntos son?`;
    r.sub = "Arrastra un punto a la caja de su derecha (o mantenlo pulsado) para desexplotarlo.";
    r.label = `${r.code} son`;
  } else if (st.kind === "sum") {
    let A, B;
    do {
      const lo = 10 ** (st.digits - 1);
      const hi = 10 ** st.digits - 1;
      A = randInt(lo, hi);
      B = randInt(lo, hi);
    } while (carries(A, B) < (st.digits === 3 ? 2 : 1));
    digitsOf(A, n).forEach((c, i) => {
      for (let j = 0; j < c; j++) cells[i].push(mk("d", 1));
    });
    digitsOf(B, n).forEach((c, i) => {
      for (let j = 0; j < c; j++) cells[i].push(mk("d", 2));
    });
    r.A = A;
    r.B = B;
    r.N = A + B;
    r.digits = digitsOf(A + B, n);
    r.answer = String(A + B);
    r.needStable = true;
    r.prompt = `<span class="ex-c1">${A}</span> + <span class="ex-c2">${B}</span>`;
    r.sub = "Explota cada caja con 10 o más (¡son las llevadas!) y escribe el resultado.";
    r.label = `${A} + ${B}`;
  } else {
    // Resta con antipuntos: el minuendo son puntos y el sustraendo antipuntos.
    let A, B;
    do {
      const lo = 10 ** (st.digits - 1);
      const hi = 10 ** st.digits - 1;
      A = randInt(lo + 2 * lo, hi);
      if (st.digits === 3 && Math.random() < 0.3) A = Math.floor(A / 100) * 100 + randInt(0, 9); // decena 0: préstamo doble
      B = randInt(lo, A - 1);
    } while (borrows(A, B) < 1 || A - B < 2);
    digitsOf(A, n).forEach((c, i) => {
      for (let j = 0; j < c; j++) cells[i].push(mk("d"));
    });
    digitsOf(B, n).forEach((c, i) => {
      for (let j = 0; j < c; j++) cells[i].push(mk("x"));
    });
    r.A = A;
    r.B = B;
    r.N = A - B;
    r.digits = digitsOf(A - B, n);
    r.answer = String(A - B);
    r.needStable = true;
    r.prompt = `${A} − ${B}`;
    r.sub = "● son los puntos de " + A + " y ○ los antipuntos de " + B + ". Toca para hacer ¡pop! y desexplota para pedir prestado.";
    r.label = `${A} − ${B}`;
  }
  return r;
}
export function carries(A, B) {
  let c = 0;
  let k = 0;
  while (A || B) {
    const s = (A % 10) + (B % 10) + c;
    c = s >= 10 ? 1 : 0;
    k += c;
    A = Math.floor(A / 10);
    B = Math.floor(B / 10);
  }
  return k;
}
export function borrows(A, B) {
  let br = 0;
  let k = 0;
  while (A || B) {
    const d = (A % 10) - (B % 10) - br;
    br = d < 0 ? 1 : 0;
    k += br;
    A = Math.floor(A / 10);
    B = Math.floor(B / 10);
  }
  return k;
}

// Qué impide dar la máquina por terminada (o null si está lista).
// cnt: [{d, x}] por caja (0 = derecha).
export function stableIssue(r, cnt) {
  for (let i = 0; i < r.n; i++) {
    if (cnt[i].d > 0 && cnt[i].x > 0) return { i, msg: "En esa caja aún hay puntos y antipuntos que pueden hacer ¡pop!" };
  }
  for (let i = 0; i < r.n; i++) {
    if (cnt[i].d >= r.b || cnt[i].x >= r.b) {
      return {
        i,
        msg:
          i === r.n - 1
            ? `Esa caja tiene ${r.b} o más y no tiene caja a su izquierda: desexplota.`
            : `¡Esa caja aún podía explotar! Tiene ${Math.max(cnt[i].d, cnt[i].x)} y explota con ${r.b}.`,
      };
    }
  }
  for (let i = 0; i < r.n; i++) {
    if (cnt[i].x > 0) return { i, msg: "Quedan antipuntos: desexplota un punto de su izquierda para pedir prestado." };
  }
  return null;
}

// ---------- Juego ----------
export function mountExplotaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let round = null;
  let typed = "";
  let locked = false; // ronda resuelta (esperando la siguiente)
  let anim = null; // animación en curso { commit, timer }
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
    return t;
  };
  const rafs = new Set();
  const clearTimers = () => {
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    rafs.forEach((r) => cancelAnimationFrame(r));
    rafs.clear();
  };

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body ex-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  const $ = (s) => body.querySelector(s);
  const boxEl = (i) => body.querySelector(`[data-box="${i}"]`);
  const counts = () =>
    round.cells.map((c) => ({ d: c.filter((p) => p.k === "d").length, x: c.filter((p) => p.k === "x").length }));

  function stageForLevel() {
    if (level < STAGES.length) return level;
    return randInt(3, STAGES.length - 1);
  }

  function nextRound() {
    if (finished) return;
    round = buildExplotaRound(stageForLevel());
    typed = "";
    locked = false;
    anim = null;
    const r = round;
    const anti = r.kind === "sub";
    const boxesHtml = Array.from({ length: r.n }, (_, k) => r.n - 1 - k)
      .map(
        (i) => `
        <div class="ex-col">
          <div class="ex-box" data-box="${i}"><div class="ex-dots" data-dots></div></div>
          <div class="ex-val" data-val="${i}"></div>
        </div>`
      )
      .join("");
    body.innerHTML = `
      <p class="prompt ex-prompt">${r.prompt}<small>${r.sub}</small></p>
      <div class="ex-rule" data-rule>
        <span class="ex-rule-big"><b data-rule-a>${r.a}</b> ← <b data-rule-b>${r.b}</b></span>
        <span class="ex-rule-txt">${r.b} puntos de una caja explotan y dan ${r.a} en la de su izquierda${
      anti ? " · ● y ○ juntos: ¡pop!" : ""
    }</span>
      </div>
      <div class="ex-row" data-row style="--ex-n:${r.n}">${boxesHtml}</div>
      <div class="ex-answer">
        <span class="ex-label">${r.label} =</span>
        <span class="ex-typed" data-typed></span>
      </div>
      <div class="ex-keys" data-keys>
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => `<button type="button" class="ex-key" data-key="${d}">${d}</button>`).join("")}
        <button type="button" class="ex-key ex-del" data-key="del" aria-label="Borrar">⌫</button>
      </div>
      <button type="button" class="primary ex-done" data-done>Listo</button>
      <div class="feedback" data-feedback></div>
      <div class="ex-why" data-why></div>
    `;
    body.querySelectorAll("[data-key]").forEach((k) =>
      k.addEventListener("click", () => {
        if (locked || finished) return;
        const v = k.dataset.key;
        if (v === "del") typed = typed.slice(0, -1);
        else if (typed.length < 5) typed += v;
        paintTyped();
      })
    );
    $("[data-done]").addEventListener("click", onDone);
    for (let i = 0; i < r.n; i++) bindBox(boxEl(i), i);
    paintTyped();
    paint();
  }

  function paintTyped() {
    const el = $("[data-typed]");
    el.textContent = typed || "?";
    el.classList.toggle("empty", !typed);
  }

  // Pinta los puntos de cada caja: en filas de b (o de 5 en la de 10) para
  // que se vea a simple vista si una caja puede explotar.
  function paint(newIds = new Set()) {
    const r = round;
    const per = r.b <= 3 ? r.b : 5;
    for (let i = 0; i < r.n; i++) {
      const el = boxEl(i);
      const list = [...r.cells[i].filter((p) => p.k === "d"), ...r.cells[i].filter((p) => p.k === "x")];
      const dots = el.querySelector("[data-dots]");
      dots.style.setProperty("--ex-per", per);
      dots.innerHTML = list
        .map(
          (p) =>
            `<span class="ex-dot ${p.k === "x" ? "ex-anti" : ""} ex-t${p.t} ${newIds.has(p.id) ? "ex-new" : ""}" data-id="${p.id}"></span>`
        )
        .join("");
    }
  }

  function say(text, cls = "") {
    const fb = $("[data-feedback]");
    fb.textContent = text;
    fb.className = `feedback ${cls}`;
  }

  // ---- Gestos sobre una caja: tocar = explotar/pop; arrastrar a la
  // derecha o mantener pulsado = desexplotar ----
  function bindBox(el, i) {
    let st = null;
    el.addEventListener("pointerdown", (e) => {
      if (locked || finished) return;
      e.preventDefault();
      try {
        el.setPointerCapture(e.pointerId);
      } catch (_) {}
      st = { x: e.clientX, y: e.clientY, drag: false, done: false, ghost: null };
      st.hold = later(() => {
        if (!st || st.drag) return;
        st.done = true;
        unexplode(i);
      }, 550);
    });
    el.addEventListener("pointermove", (e) => {
      if (!st || st.done) return;
      if (!st.drag && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 12) {
        st.drag = true;
        clearTimeout(st.hold);
        timers.delete(st.hold);
        const c = round.cells[i];
        const kind = c.some((p) => p.k === "d") ? "d" : "x";
        if (!c.length) return;
        st.ghost = document.createElement("div");
        st.ghost.className = `ex-ghost ${kind === "x" ? "ex-anti" : ""}`;
        document.body.appendChild(st.ghost);
      }
      if (st.drag && st.ghost) {
        st.ghost.style.left = `${e.clientX}px`;
        st.ghost.style.top = `${e.clientY}px`;
        const tgt = i > 0 ? boxEl(i - 1) : null;
        if (tgt) tgt.classList.toggle("ex-over", inside(tgt, e));
      }
    });
    const end = (e, cancel) => {
      if (!st) return;
      clearTimeout(st.hold);
      timers.delete(st.hold);
      const s = st;
      st = null;
      if (s.ghost) s.ghost.remove();
      body.querySelectorAll(".ex-over").forEach((b) => b.classList.remove("ex-over"));
      if (cancel || s.done || locked || finished) return;
      if (s.drag) {
        const tgt = i > 0 ? boxEl(i - 1) : null;
        if (tgt && inside(tgt, e)) unexplode(i);
        else if (s.ghost) say("Para desexplotar, suelta el punto en la caja de su DERECHA.");
      } else tap(i);
    };
    el.addEventListener("pointerup", (e) => end(e, false));
    el.addEventListener("pointercancel", (e) => end(e, true));
  }
  function inside(el, e) {
    const q = el.getBoundingClientRect();
    return e.clientX >= q.left - 8 && e.clientX <= q.right + 8 && e.clientY >= q.top - 20 && e.clientY <= q.bottom + 20;
  }

  // Termina al instante la animación pendiente (para poder tocar rápido).
  function flush() {
    if (anim) {
      const a = anim;
      anim = null;
      clearTimeout(a.timer);
      timers.delete(a.timer);
      a.commit();
    }
  }

  function burst(i, text) {
    const el = boxEl(i);
    const b = document.createElement("span");
    b.className = "ex-burst";
    b.textContent = text;
    el.appendChild(b);
    later(() => b.remove(), 650);
  }
  function flyDot(from, to, kind) {
    const row = $("[data-row]");
    const rr = row.getBoundingClientRect();
    const fa = boxEl(from).getBoundingClientRect();
    const ta = boxEl(to).getBoundingClientRect();
    const f = document.createElement("span");
    f.className = `ex-fly ${kind === "x" ? "ex-anti" : ""}`;
    f.style.left = `${fa.left - rr.left + fa.width / 2}px`;
    f.style.top = `${fa.top - rr.top + fa.height / 2}px`;
    row.appendChild(f);
    const raf = requestAnimationFrame(() => {
      rafs.delete(raf);
      f.style.transform = `translate(${ta.left - fa.left}px, ${ta.top - fa.top}px)`;
    });
    rafs.add(raf);
    later(() => f.remove(), 420);
  }

  function tap(i) {
    flush();
    const r = round;
    const c = r.cells[i];
    const d = c.filter((p) => p.k === "d");
    const x = c.filter((p) => p.k === "x");
    if (d.length && x.length) {
      // ¡pop!: cada punto se aniquila con un antipunto.
      const m = Math.min(d.length, x.length);
      const gone = new Set([...d.slice(-m), ...x.slice(-m)].map((p) => p.id));
      gone.forEach((id) => boxEl(i).querySelector(`[data-id="${id}"]`)?.classList.add("ex-pop"));
      burst(i, m > 1 ? `¡pop! ×${m}` : "¡pop!");
      say(`${m} ${m > 1 ? "parejas" : "pareja"} ● ○ ${m > 1 ? "se anulan" : "se anula"}.`);
      startAnim(() => {
        r.cells[i] = c.filter((p) => !gone.has(p.id));
        paint();
      }, 300);
      return;
    }
    const kind = d.length >= r.b ? "d" : x.length >= r.b ? "x" : null;
    if (!kind) {
      const have = c.length;
      boxEl(i).classList.remove("ex-shake");
      void boxEl(i).offsetWidth;
      boxEl(i).classList.add("ex-shake");
      say(have ? `Con ${have} no explota: hacen falta ${r.b}.` : "Esa caja está vacía.");
      return;
    }
    if (i === r.n - 1) {
      say("No hay caja a su izquierda: esa no puede explotar.");
      return;
    }
    const pool = kind === "d" ? d : x;
    const gone = new Set(pool.slice(-r.b).map((p) => p.id));
    gone.forEach((id) => boxEl(i).querySelector(`[data-id="${id}"]`)?.classList.add("ex-gather"));
    burst(i, "¡pum!");
    flyDot(i, i + 1, kind);
    say("");
    startAnim(() => {
      r.cells[i] = c.filter((p) => !gone.has(p.id));
      const born = Array.from({ length: r.a }, () => mk(kind));
      r.cells[i + 1].push(...born);
      paint(new Set(born.map((p) => p.id)));
    }, 300);
  }

  function unexplode(i) {
    flush();
    const r = round;
    if (i === 0) {
      say("La caja de la derecha del todo no puede desexplotar: no hay nada a su derecha.");
      return;
    }
    const c = r.cells[i];
    const d = c.filter((p) => p.k === "d");
    const x = c.filter((p) => p.k === "x");
    const kind = d.length >= r.a ? "d" : x.length >= r.a ? "x" : null;
    if (!kind) {
      say(r.a > 1 ? `Para desexplotar hacen falta ${r.a} puntos en la caja.` : "Esa caja está vacía.");
      return;
    }
    if (r.cells[i - 1].length + r.b > CAP) {
      say("¡En esa caja ya no caben más puntos! Prueba otra cosa.");
      return;
    }
    const pool = kind === "d" ? d : x;
    const gone = new Set(pool.slice(-r.a).map((p) => p.id));
    gone.forEach((id) => boxEl(i).querySelector(`[data-id="${id}"]`)?.classList.add("ex-gather"));
    flyDot(i, i - 1, kind);
    say(`1 ${kind === "x" ? "antipunto" : "punto"} de ahí = ${r.b} ${kind === "x" ? "antipuntos" : "puntos"} a su derecha.`);
    startAnim(() => {
      r.cells[i] = c.filter((p) => !gone.has(p.id));
      const born = Array.from({ length: r.b }, () => mk(kind));
      r.cells[i - 1].push(...born);
      paint(new Set(born.map((p) => p.id)));
    }, 320);
  }

  function startAnim(commit, ms) {
    anim = { commit };
    anim.timer = later(() => {
      if (!anim) return;
      const a = anim;
      anim = null;
      a.commit();
    }, ms);
  }

  // Debajo de cada caja, su valor; y la cuenta que da el número.
  function showValues() {
    const r = round;
    for (let i = 0; i < r.n; i++) {
      const v = $(`[data-val="${i}"]`);
      v.textContent = fmtVal(boxValue(r.a, r.b, i));
      v.classList.add("on");
    }
  }
  function explain() {
    const r = round;
    const dig = r.digits;
    let top = r.n - 1;
    while (top > 0 && dig[top] === 0) top--;
    const terms = [];
    for (let i = top; i >= 0; i--) terms.push(`${dig[i]}·${fmtVal(boxValue(r.a, r.b, i))}`);
    const sum = terms.join(" + ");
    const code = codeOf(dig);
    if (r.kind === "code") return `${r.N} en la máquina ${r.a}←${r.b} da el código ${code}, porque ${sum} = ${r.N}.`;
    if (r.kind === "count") return `Quedó el código ${code}: ${sum} = ${r.N} puntos.`;
    if (r.kind === "rev") return `${code} en la máquina ${r.a}←${r.b} = ${sum} = ${r.N}.`;
    if (r.kind === "sum") return `${r.A} + ${r.B} = ${r.N}: tras las llevadas quedan ${sum}.`;
    return `${r.A} − ${r.B} = ${r.N}: tras pedir prestado quedan ${sum}.`;
  }

  function loseLife() {
    lives--;
    renderLives();
    if (lives <= 0) {
      locked = true;
      later(() => finish(false), 2600);
      return true;
    }
    return false;
  }

  function onDone() {
    if (locked || finished) return;
    flush();
    const r = round;
    if (r.needStable) {
      const iss = stableIssue(r, counts());
      if (iss) {
        const el = boxEl(iss.i);
        el.classList.remove("ex-blink");
        void el.offsetWidth;
        el.classList.add("ex-blink");
        later(() => el.classList.remove("ex-blink"), 1800);
        say(`✗ ${iss.msg}`, "bad");
        rounds++;
        loseLife();
        return;
      }
    }
    if (!typed) {
      say("Escribe tu respuesta con las teclas y pulsa Listo.");
      return;
    }
    rounds++;
    locked = true;
    const ok = r.isCode ? typed.replace(/^0+/, "") === r.answer : Number(typed) === Number(r.answer);
    showValues();
    $("[data-typed]").classList.add(ok ? "ok" : "bad");
    if (ok) {
      score += 10;
      level++;
      renderScore();
      say(`¡Correcto! ${r.label} = ${r.answer}`, "ok");
      $("[data-why]").textContent = explain();
      later(nextRound, 2000);
      return;
    }
    say(`✗ Era ${r.answer}, no ${typed}.`, "bad");
    $("[data-why]").textContent = explain();
    if (loseLife()) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "secondary ex-next";
    btn.textContent = "Siguiente →";
    btn.setAttribute("data-next", "");
    btn.addEventListener("click", nextRound);
    $("[data-why]").after(btn);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimers();
    anim = null;
    document.querySelectorAll(".ex-ghost").forEach((g) => g.remove());
    if (userExited) return onExit();
    saveScore(client, "explota", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>💥</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} máquinas resueltas</p>
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
    clearTimers();
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
    clearTimers();
    anim = null;
    document.querySelectorAll(".ex-ghost").forEach((g) => g.remove());
  };
}
