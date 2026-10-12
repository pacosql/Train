// "Fracción generatriz": el decimal escrito como en el libro (el periodo con
// su arco, y debajo cómo se lee: 0,1666…) y "= □/□" con casillas apiladas
// para numerador y denominador. Vale cualquier fracción equivalente; el 💡
// enseña la regla (exacto, periódico puro o mixto) con los números de la
// ronda y la fracción irreducible: "(16 − 1)/90 = 15/90 = 1/6".
// Niveles: exactos → puros de una cifra → puros de dos cifras → mixtos →
// mixtos con dos cifras de anteperiodo o de periodo.
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const digits = (k) => Array.from({ length: k }, () => randInt(0, 9)).join("");

// Niveles: 0 exactos · 1 puros de 1 cifra · 2 puros de 2 cifras ·
// 3 mixtos (1 + 1 cifras) · 4 mixtos con 2 cifras de anteperiodo o de periodo.
export function buildRound(level) {
  const L = Math.min(4, level);
  for (;;) {
    const E = String(L >= 3 ? randInt(0, 1) : pick([0, 0, 0, 1, 2]));
    let A = "", P = "", D = "";
    if (L === 0) { D = digits(randInt(1, 3)); if (D.endsWith("0")) continue; }
    else if (L === 1) P = String(randInt(1, 8));
    else if (L === 2) { P = digits(2); if (P[0] === P[1]) continue; }
    else {
      [A, P] = L === 3 || Math.random() < 0.5 ? [digits(L === 3 ? 1 : 2), String(randInt(1, 8))] : [digits(1), digits(2)];
      // periodo de verdad (no "33" ni "99" ni "00") y el anteperiodo no puede acabar como el periodo
      if (/^(\d)\1$/.test(P) || /^9+$|^0+$/.test(P) || A.at(-1) === P.at(-1)) continue;
    }
    let N, Dn, hint, type;
    if (L === 0) {
      N = Number(E + D); Dn = 10 ** D.length; type = "exacto";
      hint = `Decimal exacto: el número sin la coma entre un 1 con tantos ceros como decimales: ${N}/${Dn}`;
    } else {
      const all = Number(E + A + P), head = Number(E + A);
      N = all - head; Dn = Number("9".repeat(P.length) + "0".repeat(A.length));
      type = A ? "mixto" : "puro";
      const top = head ? `(${all} ${M} ${head})` : `${all}`;
      hint = A
        ? `Periódico mixto: (todo sin la coma ${M} lo que no se repite) entre tantos 9 como cifras tiene el periodo y tantos 0 como el anteperiodo: ${top}/${Dn} = ${N}/${Dn}`
        : head
          ? `Periódico puro: (todo sin la coma ${M} la parte entera) entre tantos 9 como cifras tiene el periodo: ${top}/${Dn} = ${N}/${Dn}`
          : `Periódico puro: el periodo entre tantos 9 como cifras tiene: ${N}/${Dn}`;
    }
    const g = gcd(N, Dn), n = N / g, d = Dn / g;
    if (g > 1) hint += ` = ${n}/${d}`;
    if (g === 1) hint += " (ya es irreducible)";
    const reps = P.repeat(P.length === 1 ? 3 : 2); // 0,333… · 0,1666… · 0,4545…
    return { E, A, P, D, N, Dn, n, d, type, hint, key: `${E},${A},${P},${D}`, read: P ? `${E},${A}${reps}…` : "" };
  }
}

export function mountGeneratrizGame(container, { client, onExit }) {
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
    <div class="game-body ge-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    goNext = null;
    const prev = round && round.key;
    do round = buildRound(Math.min(4, Math.floor(hits / 2)));
    while (round.key === prev); // nunca la misma ronda dos veces seguidas
    typed = ["", ""];
    active = 0;
    busy = false;
    const r = round;
    // el periodo lleva su arco encima, como en el libro
    const dec = `<span class="ge-dec"><span class="ge-head">${r.E},${r.A}${r.D}</span>${r.P ? `<span class="ge-per">${r.P}</span>` : ""}</span>`;
    body.innerHTML = `
      <p class="prompt ge-prompt">Escribe la fracción generatriz</p>
      <div class="ge-cuaderno">
        <div class="ge-type">${r.P ? `Se lee <b>${r.read}</b>` : "Decimal exacto"}</div>
        <div class="ge-line">${dec}<span class="ge-eq">=</span><span class="ge-frac">
          <button type="button" class="ge-slot" data-slot="0"></button><button type="button" class="ge-slot" data-slot="1"></button>
        </span></div>
      </div>
      <div class="keypad ge-keypad" data-keypad></div>
      <div class="feedback ge-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
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
      b.textContent = typed[+b.dataset.slot];
      b.classList.toggle("active", +b.dataset.slot === active);
    });
  }

  function say(h, cls) {
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = h;
    fb.className = `feedback ge-feedback ${cls}`;
    return fb;
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return enter();
    const t = typed[active];
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.length < 4) typed[active] = t === "0" ? key : t + key;
    paint();
  }

  // ✓ con el numerador puesto salta al denominador; con los dos, corrige.
  function enter() {
    const next = [1, 0].map((i) => (active + i) % 2).find((i) => typed[i] === "");
    if (next === undefined) return check();
    if (typed[active] === "") return say("Escribe un número en la casilla marcada", "bad");
    active = next;
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    const [a, b] = typed.map(Number), r = round;
    const ok = b > 0 && a * r.Dn === r.N * b;
    // para corregir: la fracción del libro o la irreducible, la que más se parezca
    const refs = [[r.N, r.Dn], [r.n, r.d]];
    const want = refs.reduce((best, ref) => (ref.filter((x, i) => x === [a, b][i]).length > best.filter((x, i) => x === [a, b][i]).length ? ref : best), refs[1]);
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const k = +s.dataset.slot, good = ok || [a, b][k] === want[k];
      s.classList.remove("active");
      s.classList.add(good ? "good" : "bad");
      if (!good) s.innerHTML = `<s>${typed[k]}</s><em class="ge-fix">${want[k]}</em>`;
    });
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      const other = a !== r.n ? ` Tu ${a}/${b} vale lo mismo.` : "";
      say(`✓ 💡 ${r.hint}.${other}`, "ok");
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      goNext = () => { clearTimeout(pending); goNext = null; lives <= 0 ? finish(false) : nextRound(); };
      say(`💡 ${r.hint}. <button type="button" class="ge-next" data-next>Siguiente →</button>`, "bad")
        .querySelector("[data-next]").addEventListener("click", goNext);
      pending = setTimeout(goNext, 4000);
    }
  }

  // Teclado físico: cifras, borrar, Enter.
  function onKey(e) {
    if (finished || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter" && goNext) return e.preventDefault(), goNext();
    const key = /^[0-9]$/.test(e.key) ? e.key : e.key === "Backspace" ? "⌫" : e.key === "Enter" ? "✓" : null;
    if (key) { e.preventDefault(); pressKey(key); }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "generatriz", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔁</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} fracciones generatrices de ${rounds}</p>
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
