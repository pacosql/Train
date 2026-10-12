// "mcm y mcd por factores": se dan las descomposiciones ya hechas, como en
// el libro (12 = 2² · 3 y 18 = 2 · 3²), y debajo las líneas del cuaderno
// "mcd = 2^□ · 3^□ = □" y "mcm = 2^□ · 3^□ = □". Los exponentes son
// casillas pequeñas en alto (una cifra: el foco pasa solo a la siguiente);
// el resultado es una casilla grande (✓ o Enter pasa a la siguiente). En
// el mcd, un primo que no es común lleva exponente 0 (no entra).
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n) => String(n).split("").map((d) => SUP[d]).join("");
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const MAXE = { 2: 3, 3: 3, 5: 2, 7: 1 };
// "2² · 3" a partir de { primo: exponente } (sin los de exponente 0).
export const show = (ps, ex) => ps.filter((p) => ex[p] > 0).map((p) => p + (ex[p] > 1 ? sup(ex[p]) : "")).join(" · ") || "1";
const value = (ps, ex) => ps.reduce((v, p) => v * p ** ex[p], 1);

// Niveles: 0 solo mcd · 1 solo mcm · 2 los dos · 3 con tres primos ·
// 4 con tres números.
export function buildRound(level) {
  const count = level === 4 ? 3 : 2;
  const want = { mcd: level !== 1, mcm: level !== 0 };
  let ps, nums, exps;
  for (;;) {
    ps = level === 3 ? shuffle([2, 3, 5, 7]).slice(0, 3) : level === 4 ? pick([[2, 3], [2, 3, 5], [2, 3, 7], [2, 5, 3]]) : pick([[2, 3], [2, 3], [2, 5], [3, 5]]);
    ps = ps.slice().sort((x, y) => x - y);
    exps = Array.from({ length: count }, () => Object.fromEntries(ps.map((p) => [p, randInt(0, MAXE[p])])));
    nums = exps.map((ex) => value(ps, ex));
    if (nums.some((n) => n < 4 || n > (count === 3 ? 150 : 200))) continue;
    if (new Set(nums).size < count) continue;
    // Si uno divide a otro, el mcd y el mcm salen "solos": se descarta.
    if (nums.some((a, i) => nums.some((b, j) => i !== j && b % a === 0))) continue;
    if (exps.some((ex) => ps.reduce((s, p) => s + ex[p], 0) < 2)) continue; // nada de primos sueltos
    if (ps.some((p) => exps.every((ex) => ex[p] === 0))) continue; // cada primo aparece en alguno
    // Sin factores comunes el mcd es 1 y no hay nada que buscar.
    if (want.mcd && ps.every((p) => exps.some((ex) => ex[p] === 0))) continue;
    break;
  }
  const mn = Object.fromEntries(ps.map((p) => [p, Math.min(...exps.map((ex) => ex[p]))]));
  const mx = Object.fromEntries(ps.map((p) => [p, Math.max(...exps.map((ex) => ex[p]))]));
  const mcd = value(ps, mn), mcm = value(ps, mx);
  const slots = [];
  ["mcd", "mcm"].forEach((k) => {
    if (!want[k]) return;
    const ex = k === "mcd" ? mn : mx;
    ps.forEach((p, i) => slots.push({ line: k, kind: "e", idx: i, want: String(ex[p]), max: 1 }));
    slots.push({ line: k, kind: "v", want: String(k === "mcd" ? mcd : mcm), max: 5 });
  });
  const out = ps.filter((p) => mn[p] === 0);
  const parts = [];
  const eq = (ex, v) => (show(ps, ex) === String(v) ? String(v) : `${show(ps, ex)} = ${fmt(v)}`);
  if (want.mcd) parts.push(`mcd: comunes con el menor exponente (${eq(mn, mcd)})${out.length ? `; el ${out.join(" y el ")} no ${out.length > 1 ? "son comunes" : "es común"} → exponente 0` : ""}`);
  if (want.mcm) parts.push(`mcm: comunes y no comunes con el mayor exponente (${eq(mx, mcm)})`);
  return { level, ps, nums, exps, mn, mx, mcd, mcm, want, slots, hint: parts.join("; ") };
}

export function mountMcmfactoresGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body mf2-body" data-body></div>
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

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    const { ps, nums, exps, slots, want } = round;
    const box = (i) => `<button type="button" class="mf2-slot${slots[i].kind === "e" ? " mf2-exp" : " mf2-val"}" data-slot="${i}"></button>`;
    const line = (k) =>
      `<div class="mf2-linea"><span class="mf2-name">${k}</span><span class="mf2-op">=</span>${ps
        .map((p, i) => `${i ? `<span class="mf2-op">·</span>` : ""}<span class="mf2-pow">${p}${box(slots.findIndex((s) => s.line === k && s.kind === "e" && s.idx === i))}</span>`)
        .join("")}<span class="mf2-op">=</span>${box(slots.findIndex((s) => s.line === k && s.kind === "v"))}</div>`;
    const de = nums.length === 2 ? `${nums[0]} y ${nums[1]}` : `${nums[0]}, ${nums[1]} y ${nums[2]}`;
    const what = want.mcd && want.mcm ? "el mcd y el mcm" : want.mcd ? "el mcd" : "el mcm";
    body.innerHTML = `
      <p class="prompt mf2-prompt">Calcula ${what} de ${de}</p>
      <div class="mf2-cuaderno">
        <div class="mf2-dados">${nums.map((n, j) => `<div><b>${n}</b> = ${show(ps, exps[j])}</div>`).join("")}</div>
        ${want.mcd ? line("mcd") : ""}
        ${want.mcm ? line("mcm") : ""}
        ${want.mcd ? `<div class="mf2-nota">exponente 0 = ese primo no entra</div>` : ""}
      </div>
      <div class="keypad mf2-keypad" data-keypad></div>
      <div class="feedback mf2-feedback" data-feedback></div>
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
      const k = +b.dataset.slot;
      if (!busy) b.textContent = typed[k];
      b.classList.toggle("active", !busy && k === active);
    });
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    if (key === "⌫") {
      if (typed[active] === "" && active > 0) active--;
      typed[active] = typed[active].slice(0, -1);
    } else if (typed[active].length < round.slots[active].max) {
      typed[active] += key;
      // Los exponentes son de una cifra: el foco pasa solo al siguiente hueco.
      if (typed[active].length === round.slots[active].max && active < typed.length - 1) active++;
    }
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    // ✓ con huecos: el foco va al siguiente hueco vacío (como un Enter).
    const n = typed.length;
    const next = Array.from({ length: n }, (_, j) => (active + j) % n).find((i) => typed[i] === "");
    if (next !== undefined) {
      const wasEmpty = typed[active] === "";
      active = next;
      paint();
      if (wasEmpty) {
        feedback.textContent = "Faltan casillas por rellenar";
        feedback.className = "feedback bad mf2-feedback";
      }
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot, s = round.slots[k];
      const ok = String(+typed[k]) === s.want;
      allOk = allOk && ok;
      b.classList.add(ok ? "good" : "bad");
      if (ok) b.textContent = typed[k];
      else b.innerHTML = `<s>${typed[k]}</s><i class="mf2-fix">${s.kind === "v" ? fmt(+s.want) : s.want}</i>`;
    });
    paint();
    const text = [round.want.mcd ? `mcd = ${fmt(round.mcd)}` : "", round.want.mcm ? `mcm = ${fmt(round.mcm)}` : ""].filter(Boolean).join(", ");
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${text}. 💡 ${round.hint}`;
      feedback.className = "feedback ok mf2-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Era ${text}. 💡 ${round.hint} <button type="button" class="mf2-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad mf2-feedback";
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
    saveScore(client, "mcmfactores", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧮</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cálculos bien hechos de ${rounds}</p>
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
