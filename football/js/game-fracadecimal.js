// "De fracción a decimal": 3/4 = □,□□ con la división 3 : 4 hecha en la
// caja pequeña de al lado, como en el libro: 3 no cabe → 0 y coma; se
// añade un 0 al dividendo (30), 30 : 4 = 7 y resto 2; se añade otro 0
// (20), 20 : 4 = 5 y resto 0. Se rellenan en ese orden las cifras del
// cociente y los restos; la línea de arriba copia el cociente. En las
// periódicas se toca el arco ⌒ de las cifras que se repiten. La inversa
// "0,75 = □/100 = □/□" pide la fracción decimal y luego la simplificada.
import { randInt, pick, saveScore } from "./utils.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// División larga n : d (n < d) añadiendo ceros. Para cuando el resto es 0
// o cuando un resto ya salió antes (desde ahí se repite todo).
export function longDiv(n, d) {
  let r = n % d;
  const decs = [], rems = [r];
  let period = null;
  while (r !== 0) {
    const q = Math.floor((r * 10) / d);
    r = r * 10 - q * d;
    decs.push(q);
    const j = rems.indexOf(r);
    rems.push(r);
    if (j >= 0) { period = [j, decs.length]; break; } // decimales j..len-1
  }
  return { q0: Math.floor(n / d), decs, rems, period };
}

// "0,75" o, si es periódico, "0,1666…" (el periodo escrito tres veces).
const decStr = (decs, period) => {
  const per = period ? decs.slice(period[0]).join("") : "";
  return `0,${decs.join("")}${per ? per + per + "…" : ""}`;
};

// Niveles: 0 fracciones decimales (3/10, 7/100) · 1 denominador 2, 4, 5 ·
// 2 denominador 8, 20, 25 · 3 inversa con simplificación · 4 periódicas
// (con alguna exacta para que haya que decidir) · 5 mezcla de 1-4.
export function buildRound(level) {
  if (level >= 5) level = pick([1, 2, 3, 4]);
  if (level === 3) {
    let p, den;
    do {
      den = pick([10, 100, 100]);
      p = randInt(1, den - 1);
    } while (p % 10 === 0 || (gcd(p, den) === 1 && Math.random() < 0.8));
    const g = gcd(p, den);
    const dec = den === 10 ? `0,${p}` : `0,${String(p).padStart(2, "0")}`;
    const slots = [{ id: "n1", want: String(p) }, { id: "n2", want: String(p / g) }, { id: "d2", want: String(den / g) }];
    const hint = `${dec} son ${p} ${den === 10 ? "décimas" : "centésimas"}: ${p}/${den}; ` +
      (g === 1 ? `${p} y ${den} no tienen divisores comunes, ya es irreducible` : `divido arriba y abajo entre ${g}: ${p / g}/${den / g}`);
    return { kind: "inv", dec, p, den, a: p / g, b: den / g, slots, arcs: false, hint };
  }
  let n, d;
  do {
    d = level === 0 ? pick([10, 100]) : level === 1 ? pick([2, 4, 5]) : level === 2 ? pick([8, 20, 25]) :
      Math.random() < 0.75 ? pick([3, 6, 9, 11, 12, 15]) : pick([4, 5, 8, 20]);
    n = randInt(1, d - 1);
  } while (gcd(n, d) !== 1 && !(level === 0 && n % 10 !== 0));
  const L = longDiv(n, d);
  const K = L.decs.length, ln = String(n).length;
  // Casillas en el orden de clase: 0 del cociente, y en cada paso la cifra
  // del cociente y el resto (cifra a cifra, alineado bajo el último 0).
  const slots = [{ id: "q0", want: String(L.q0), q: 0 }];
  for (let k = 1; k <= K; k++) {
    slots.push({ id: `q${k}`, want: String(L.decs[k - 1]), q: k });
    String(L.rems[k]).split("").forEach((ch, j, a) => slots.push({ id: `r${k}.${j}`, want: ch, row: k, col: ln + k - a.length + j }));
  }
  const steps = L.decs.map((q, i) => `${L.rems[i] * 10} : ${d} = ${q} resto ${L.rems[i + 1]}`);
  let hint = `${n} : ${d}: ${n} no cabe, pongo 0 y coma, y añado un 0: ${steps.join("; ")}`;
  if (L.period) {
    const per = L.decs.slice(L.period[0]).join("");
    hint += `. El resto ${L.rems[K]} ya salió: el ${per} se repite siempre → 0,${L.decs.join("")}${per}${per}… se escribe 0,${L.decs.join("")} con el arco sobre el ${per}`;
  } else hint += ` → 0,${L.decs.join("")}`;
  return { kind: "dir", n, d, ln, K, rems: L.rems, decs: L.decs, period: L.period, slots, arcs: level === 4, hint, text: decStr(L.decs, L.period) };
}

export function mountFracadecimalGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, arcs, active, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body fd-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const onKey = (e) => {
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  };
  const slotBtn = (i, cls = "") => `<button type="button" class="fd-slot ${cls}" data-slot="${i}"></button>`;
  const idx = (id) => round.slots.findIndex((s) => s.id === id);
  const frac = (a, b) => `<span class="fd-frac"><span>${a}</span><span>${b}</span></span>`;

  function dirHTML() {
    const { n, d, ln, K, rems, slots } = round;
    const cols = ln + K;
    const grid = Array.from({ length: K + 1 }, () => Array.from({ length: cols }, () => `<span class="fd-cell"></span>`));
    String(n).split("").forEach((ch, c) => (grid[0][c] = `<span class="fd-cell">${ch}</span>`));
    grid[0][ln] = `<span class="fd-cell fd-added" data-z="0">0</span>`;
    slots.forEach((s, i) => s.row && (grid[s.row][s.col] = slotBtn(i)));
    for (let k = 1; k < K; k++) if (rems[k]) grid[k][ln + k] = `<span class="fd-cell fd-added" data-z="${k}">0</span>`;
    const top = `${frac(n, d)}<span class="fd-eq">=</span><span class="fd-mirror"><span class="fd-m" data-m="0"></span><span class="fd-comma">,</span>${round.decs
      .map((_, i) => `<span class="fd-mwrap">${round.arcs ? `<button type="button" class="fd-arc" data-arc="${i}">⌒</button>` : ""}<span class="fd-m" data-m="${i + 1}"></span></span>`)
      .join("")}</span>`;
    return `
      <p class="prompt fd-prompt">${round.arcs ? "Pasa a decimal (⌒ marca lo que se repite)" : "Pasa la fracción a decimal"}</p>
      <div class="fd-top">${top}</div>
      <div class="fd-caja fd-cuaderno" style="--fd-n:${cols};--fd-m:${Math.max(String(d).length, K + 1)}">
        <div class="fd-left">${grid.map((r) => `<div class="fd-row">${r.join("")}</div>`).join("")}</div>
        <div class="fd-right">
          <div class="fd-divisor">${String(d).split("").map((v) => `<span class="fd-cell">${v}</span>`).join("")}</div>
          <div class="fd-cociente">${slotBtn(0, "fd-q fd-qc")}${slots.filter((s) => s.q > 0).map((s) => slotBtn(idx(s.id), "fd-q")).join("")}</div>
        </div>
      </div>`;
  }

  function invHTML() {
    return `
      <p class="prompt fd-prompt">Pasa el decimal a fracción y simplifica</p>
      <div class="fd-inv fd-cuaderno">
        <span class="fd-big">${round.dec}</span><span class="fd-eq">=</span>
        <span class="fd-frac">${slotBtn(0, "fd-wide")}<span>${round.den}</span></span><span class="fd-eq">=</span>
        <span class="fd-frac">${slotBtn(1, "fd-wide")}${slotBtn(2, "fd-wide")}</span>
      </div>`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(5, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    arcs = round.decs ? round.decs.map(() => false) : [];
    active = 0;
    busy = false;
    body.innerHTML = `${round.kind === "dir" ? dirHTML() : invHTML()}
      <div class="keypad fd-keypad" data-keypad></div>
      <div class="feedback fd-feedback" data-feedback></div>`;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    body.querySelectorAll("[data-arc]").forEach((b) => b.addEventListener("click", () => !busy && ((arcs[+b.dataset.arc] = !arcs[+b.dataset.arc]), paint())));
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
      const k = +b.dataset.slot;
      if (!busy) b.textContent = typed[k];
      b.classList.toggle("active", !busy && k === active);
    });
    if (round.kind !== "dir") return;
    round.slots.forEach((s, i) => s.q !== undefined && (body.querySelector(`[data-m="${s.q}"]`).textContent = busy ? s.want : typed[i] || "□"));
    body.querySelectorAll("[data-arc]").forEach((b) => b.classList.toggle("on", arcs[+b.dataset.arc]));
    // El 0 que se añade aparece cuando ya está escrito lo anterior.
    body.querySelectorAll("[data-z]").forEach((z) => {
      const k = +z.dataset.z;
      const done = busy || round.slots.every((s, i) => (k === 0 ? s.id !== "q0" : s.row !== k) || typed[i] !== "");
      z.classList.toggle("fd-show", done);
    });
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    const multi = round.kind === "inv";
    if (key === "⌫") {
      if (!multi && typed[active] === "" && active > 0) active--;
      typed[active] = typed[active].slice(0, -1);
    } else if (multi) {
      if (typed[active].length < 3) typed[active] += key;
    } else {
      typed[active] = key;
      if (active < typed.length - 1) active++;
    }
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const missing = typed.indexOf("");
    if (missing >= 0) {
      const silent = typed[active] !== "";
      active = missing;
      paint();
      if (!silent) {
        feedback.textContent = "Faltan casillas por rellenar";
        feedback.className = "feedback bad fd-feedback";
      }
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot;
      const want = round.slots[k].want;
      const ok = typed[k].replace(/^0+(?=\d)/, "") === want;
      allOk = allOk && ok;
      b.classList.add(ok ? "good" : "bad");
      b.innerHTML = ok ? want : `<s>${typed[k]}</s><i class="fd-fix">${want}</i>`;
    });
    if (round.arcs) {
      body.querySelectorAll("[data-arc]").forEach((b) => {
        const i = +b.dataset.arc, want = !!round.period && i >= round.period[0];
        const ok = arcs[i] === want;
        allOk = allOk && ok;
        b.classList.toggle("on", want);
        if (!ok) b.classList.add(want ? "fd-missed" : "fd-wrong");
      });
    }
    paint();
    const text = round.kind === "dir" ? `${round.n}/${round.d} = ${round.text}` : `${round.dec} = ${round.p}/${round.den} = ${round.a}/${round.b}`;
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${text}. 💡 ${round.hint}`;
      feedback.className = "feedback ok fd-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Era ${text}. 💡 ${round.hint} <button type="button" class="fd-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad fd-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 3500);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "fracadecimal", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔢</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} fracciones pasadas a decimal de ${rounds}</p>
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
