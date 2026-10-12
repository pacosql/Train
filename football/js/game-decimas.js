// "Décimas, centésimas y milésimas": la tabla posicional decimal del libro
// (U , d c m) con el número colocado y, debajo, la línea del cuaderno con
// casillas: "2,35 = □ unidades, □ décimas y □ centésimas" (una cifra por
// casilla, el foco avanza solo) o "2,35 = □ + □ + □" (se escribe 2, 0,3 y
// 0,05 con la tecla coma; ✓ salta a la siguiente). Luego la inversa
// "7 décimas y 4 centésimas = □" (la tabla se rellena al corregir) y
// "¿cuántas centésimas hay en 2,35?". El 💡 sitúa la cifra respecto a la coma.
import { randInt, pick, saveScore } from "./utils.js";

const PLUR = ["unidades", "décimas", "centésimas", "milésimas"];
const SING = ["unidad", "décima", "centésima", "milésima"];
const PLACE = ["antes de la coma", "justo después de la coma", "en el segundo sitio después de la coma", "en el tercer sitio después de la coma"];
const name = (k, j) => `${k} ${k === 1 ? SING[j] : PLUR[j]}`;
// v entero con p decimales → texto español: (235, 2) → "2,35"
const fmtDec = (v, p) => (p ? `${Math.floor(v / 10 ** p)},${String(v % 10 ** p).padStart(p, "0")}` : String(v));
// Cifras [unidades, décimas, centésimas, milésimas] de v con p decimales
const digitsOf = (v, p) => Array.from({ length: p + 1 }, (_, j) => Math.floor(v / 10 ** (p - j)) % 10);
const parse = (s) => Number(s.replace(",", "."));
const same = (a, b) => Math.abs(a - b) < 1e-9;

// Niveles: 0 décimas · 1 centésimas · 2 milésimas (descomposición en
// "unidades, décimas…" o en suma) · 3 inversa "7 décimas y 4 centésimas = □"
// · 4 "¿cuántas centésimas hay en 2,35?".
export function buildRound(level) {
  const kind = level === 3 ? "inversa" : level === 4 ? "cuantas" : pick(["cuenta", "suma"]);
  const p = level <= 2 ? level + 1 : level === 3 ? pick([2, 3]) : pick([1, 2, 3]);
  let v, ds;
  for (;;) {
    v = randInt(1, 10 ** (p + 1) - 1); // unidades de 0 a 9
    ds = digitsOf(v, p);
    if (ds[p] === 0) continue; // la última cifra decimal no puede ser 0 (sería otro número)
    const nonZero = ds.filter((d) => d).length;
    if (kind === "suma" && nonZero < 2) continue; // hace falta algo que sumar
    if (kind === "inversa" && nonZero < 2) continue;
    break;
  }
  const text = fmtDec(v, p);
  // Un sumando por cifra no nula: 2 → "2", 3 décimas → "0,3", 5 centésimas → "0,05"
  const parts = ds.map((d, j) => ({ d, j, term: j ? `0,${"0".repeat(j - 1)}${d}` : String(d) })).filter((t) => t.d);
  const digitHint = (d, j) => (d ? `El ${d} está ${PLACE[j]}: ${j ? `son ${name(d, j)} = 0,${"0".repeat(j - 1)}${d}` : `son ${name(d, 0)}`}` : `En las ${PLUR[j]} hay un 0: 0 ${PLUR[j]}`);
  let slots, hint, shown = text;
  if (kind === "cuenta") {
    slots = ds.map((d, j) => ({ answer: d, label: PLUR[j], hint: digitHint(d, j) }));
    hint = digitHint(ds[1], 1);
  } else if (kind === "suma") {
    slots = parts.map((t) => ({ answer: parse(t.term), hint: digitHint(t.d, t.j) }));
    hint = `${text} = ${parts.map((t) => t.term).join(" + ")}: cada cifra vale según su sitio`;
  } else if (kind === "inversa") {
    const names = parts.map((t) => name(t.d, t.j));
    shown = names.length > 1 ? `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}` : names[0];
    const zero = ds.findIndex((d, j) => !d && j > 0);
    hint = zero !== -1 ? `No hay ${PLUR[zero]}: escribo un 0 en su sitio, ${PLACE[zero]}: ${text}` : `Las décimas van justo después de la coma${p === 3 ? ", luego las centésimas y las milésimas" : " y las centésimas en el segundo sitio"}: ${text}`;
    slots = [{ answer: v / 10 ** p, hint }];
  } else {
    const pieces = parts.map((t) => `${name(t.d, t.j)} (${t.d * 10 ** (p - t.j)})`);
    hint = `${text} son ${pieces.join(" + ")} = ${v} ${PLUR[p]}`;
    slots = [{ answer: v, hint }];
  }
  return { kind, v, p, ds, text, shown, slots, hint };
}

export function mountDecimasGame(container, { client, onExit }) {
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
    <div class="game-body de-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function onKeyDown(e) {
    const k = e.key === "Enter" ? "✓" : e.key === "Backspace" ? "⌫" : e.key === "." ? "," : e.key;
    if (!/^[0-9,]$/.test(k) && k !== "✓" && k !== "⌫") return;
    e.preventDefault();
    pressKey(k);
  }
  window.addEventListener("keydown", onKeyDown);

  // Tabla posicional: U , d c m — con las cifras o vacía (inversa)
  function table(ds) {
    const cell = (j) => `<td data-col="${j}">${ds ? ds[j] ?? "" : ""}</td>`;
    return `<table class="de-tabla"><tr><th>U</th><th class="de-coma">,</th><th>d</th><th>c</th><th>m</th></tr>
      <tr>${cell(0)}<td class="de-coma">,</td>${cell(1)}${cell(2)}${cell(3)}</tr></table>`;
  }

  function line() {
    const slot = (k, cls) => `<button type="button" class="de-slot ${cls}" data-slot="${k}"></button>`;
    const n = round.slots.length;
    if (round.kind === "cuenta")
      return `<span class="de-num">${round.text}</span><span class="de-op">=</span>${round.slots
        .map((s, k) => `<span class="de-term">${slot(k, "de-digit")} ${s.label}${k < n - 2 ? "," : k === n - 2 ? " y" : ""}</span>`).join("")}`;
    if (round.kind === "suma") return `<span class="de-num">${round.text}</span><span class="de-op">=</span>${round.slots.map((_, k) => (k ? '<span class="de-op">+</span>' : "") + slot(k, "de-wide")).join("")}`;
    if (round.kind === "inversa") return `<span class="de-num de-words">${round.shown}</span><span class="de-op">=</span>${slot(0, "de-wide")}`;
    return `<span class="de-num">${round.text}</span><span class="de-op">=</span>${slot(0, "de-wide")}<span class="de-words">${PLUR[round.p]}</span>`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    const prompt = round.kind === "cuenta" ? "Descompón el número decimal" : round.kind === "suma" ? "Descompón en suma" : round.kind === "inversa" ? "Escribe el número" : `¿Cuántas ${PLUR[round.p]} hay?`;
    body.innerHTML = `
      <p class="prompt de-prompt">${prompt}</p>
      <div class="de-cuaderno">${table(round.kind === "inversa" ? null : round.ds)}<div class="de-line">${line()}</div></div>
      <div class="keypad de-keypad" data-keypad></div>
      <div class="feedback de-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫", "✓"].forEach((key) => {
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
    body.querySelectorAll("[data-slot]").forEach((b, k) => {
      b.textContent = typed[k];
      b.classList.toggle("active", k === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    const digit = round.kind === "cuenta";
    if (key === "⌫") {
      if (typed[active] === "" && active > 0) active--;
      typed[active] = typed[active].slice(0, -1);
    } else if (digit) {
      if (key === ",") return;
      typed[active] = key; // una cifra por casilla, el foco avanza solo
      if (active < typed.length - 1) active++;
    } else if (key === ",") {
      if (!typed[active].includes(",") && typed[active].length < 6) typed[active] = (typed[active] || "0") + ",";
    } else if (typed[active].length < 6) typed[active] += key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const empty = typed.findIndex((t) => t === "" || t === "0,");
    if (empty !== -1) {
      const silent = typed[active] !== "" && typed[active] !== "0,";
      active = empty;
      paint();
      if (!silent) { feedback.textContent = "Faltan casillas por rellenar"; feedback.className = "feedback bad"; }
      return;
    }
    busy = true;
    rounds++;
    let firstBad = -1;
    body.querySelectorAll("[data-slot]").forEach((b, k) => {
      const want = round.slots[k].answer;
      const ok = same(parse(typed[k]), want);
      if (!ok && firstBad === -1) firstBad = k;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      const wantText = round.kind === "inversa" ? round.text : round.kind === "suma" ? String(want).replace(".", ",") : String(want);
      if (!ok) b.innerHTML = `<s>${typed[k]}</s><b>${wantText}</b>`;
    });
    // En la inversa la tabla se rellena al corregir, cifra a cifra
    if (round.kind === "inversa") body.querySelectorAll("[data-col]").forEach((td, j) => { td.textContent = round.ds[j] ?? ""; td.classList.add(firstBad === -1 ? "good" : "bad"); });
    if (firstBad === -1) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.innerHTML = `💡 ${round.slots[firstBad].hint} <button type="button" class="primary de-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad";
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "decimas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔟</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} decimales bien de ${rounds}</p>
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
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKeyDown);
  };
}
