// "Tabla de frecuencias": una lista de 12-20 datos (puntos de colores,
// caras de dado, número de hermanos, notas) y la tabla del libro:
// Dato | Recuento | Frecuencia absoluta | (Frecuencia relativa).
// Tocar un dato lo tacha y pone su palito en el recuento (||||/ de cinco
// en cinco), como se hace en clase; al tocar una casilla de una fila, los
// datos de ese valor parpadean para contarlos. Se escriben las
// frecuencias y el total con el teclado.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const COLORS = [["rojo", "rojos", "#e5484d"], ["azul", "azules", "#3b82f6"], ["verde", "verdes", "#16a34a"], ["amarillo", "amarillos", "#eab308"], ["morado", "morados", "#9333ea"]];
const TYPES = {
  color: { t: "Color favorito de la clase", vals: (k) => COLORS.slice(0, k).map((c) => c[0]), los: (i) => `los ${COLORS[i][1]}` },
  dado: { t: "Tiradas de un dado", vals: () => [1, 2, 3, 4, 5, 6], los: (i) => `los ${i + 1}` },
  hermanos: { t: "Número de hermanos", vals: (k) => Array.from({ length: k }, (_, i) => i), los: (i) => `los de ${i} hermano${i === 1 ? "" : "s"}` },
  notas: { t: "Notas del examen", vals: (k) => Array.from({ length: k }, (_, i) => 5 + i), los: (i) => `los ${5 + i}` },
};
const dec2 = (h) => (h === 100 ? "1" : `0,${String(h).padStart(2, "0").replace(/0$/, "")}`); // h centésimas
const cent = (t) => (/^\d*,?\d*$/.test(t) && /\d/.test(t) ? Math.round(Number(t.replace(",", ".")) * 100) : NaN);

// Niveles: 0 tres colores, absoluta · 1 cuatro a seis valores · 2 relativa
// en fracción · 3 relativa en decimal y en % (20 datos) · 4 absoluta y
// moda · 5 mezcla de 2-4.
export function buildRound(level) {
  if (level >= 5) level = pick([2, 3, 4]);
  const type = level === 0 ? "color" : pick(level === 1 || level === 4 ? ["dado", "hermanos", "notas", ...(level === 1 ? ["color"] : [])] : ["color", "hermanos", "notas"]);
  const k = type === "dado" ? 6 : level === 1 || level === 4 ? randInt(4, 5) : 3;
  const N = level === 3 ? 20 : level === 0 ? randInt(12, 15) : randInt(Math.max(12, k * 2), 20);
  let counts;
  do {
    counts = Array(k).fill(1);
    for (let i = k; i < N; i++) counts[randInt(0, k - 1)]++;
  } while (Math.max(...counts) > 10 || (level === 4 && counts.filter((c) => c === Math.max(...counts)).length > 1));
  const values = TYPES[type].vals(k);
  const data = shuffle(counts.flatMap((c, i) => Array(c).fill(i)));
  const slots = counts.map((c, i) => ({ id: `a${i}`, row: i, want: String(c) }));
  slots.push({ id: "N", row: -1, want: String(N) });
  if (level === 2) counts.forEach((c, i) => slots.push({ id: `fn${i}`, row: i, want: String(c) }, { id: `fd${i}`, row: i, want: String(N) }));
  if (level === 3) {
    counts.forEach((c, i) => slots.push({ id: `d${i}`, row: i, want: dec2(c * 5) }));
    counts.forEach((c, i) => slots.push({ id: `p${i}`, row: i, want: String(c * 5) }));
  }
  const mode = counts.indexOf(Math.max(...counts));
  if (level === 4) slots.push({ id: "moda", row: mode, want: String(values[mode]) });
  // 💡 por fila (la de la primera casilla mal, o la primera fila)
  const rowHint = counts.map((c, i) => {
    let h = `Cuento ${TYPES[type].los(i)}: hay ${c} de ${N}`;
    if (level === 2) h += `; relativa = ${c}/${N}`;
    if (level === 3) h += `; relativa = ${c}/${N} = ${c} : ${N} = ${dec2(c * 5)} = ${c * 5} %`;
    return h;
  });
  let tail = `. Total: ${counts.join(" + ")} = ${N}`;
  if (level === 4) tail += `. La moda es el dato que más se repite: el ${values[mode]} (${counts[mode]} veces)`;
  return { level, type, k, N, counts, values, data, slots, mode, rowHint, tail, title: TYPES[type].t };
}

export function mountFrecuenciasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy, crossed;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body fq-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const onKey = (e) => {
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === "," || e.key === ".") pressKey(",");
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  };
  const slot = (id) => `<button type="button" class="fq-slot" data-slot="${round.slots.findIndex((s) => s.id === id)}"></button>`;
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const die = (v) => `<svg class="fq-die" viewBox="0 0 24 24"><rect x="1" y="1" width="22" height="22" rx="5"/>${PIPS[v].map((p) => `<circle cx="${6 + (p % 3) * 6}" cy="${6 + Math.floor(p / 3) * 6}" r="2.2"/>`).join("")}</svg>`;
  // Cómo se dibuja el dato i (color, dado o número).
  const face = (i) => (round.type === "color" ? `<span class="fq-dot" style="background:${COLORS[i][2]}"></span>` : round.type === "dado" ? die(i + 1) : `<b>${round.values[i]}</b>`);
  // Palitos del recuento: grupos de cinco (cuatro y uno cruzado).
  function tally(c) {
    let s = "", x = 2;
    for (let g = 0; g < c; g += 5) {
      const n = Math.min(5, c - g);
      for (let j = 0; j < Math.min(n, 4); j++) s += `<line x1="${x + j * 4}" y1="2" x2="${x + j * 4}" y2="16"/>`;
      if (n === 5) s += `<line x1="${x - 2}" y1="14" x2="${x + 14}" y2="4"/>`;
      x += 21;
    }
    return `<svg class="fq-tally" viewBox="0 0 ${Math.max(20, x)} 18" width="${Math.max(20, x)}">${s}</svg>`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(5, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    crossed = round.data.map(() => false);
    active = 0;
    busy = false;
    const { level, counts } = round;
    const heads = ["Dato", "Recuento", "Frec. absoluta"].concat(level === 2 ? ["Frec. relativa"] : level === 3 ? ["Frec. relativa", "%"] : []);
    const rows = counts.map((_, i) => {
      const extra = level === 2 ? `<td><span class="fq-frac">${slot(`fn${i}`)}${slot(`fd${i}`)}</span></td>` : level === 3 ? `<td>${slot(`d${i}`)}</td><td>${slot(`p${i}`)}</td>` : "";
      return `<tr data-row="${i}"><td class="fq-val">${face(i)}${round.type === "color" ? `<small>${round.values[i]}</small>` : ""}</td><td data-tally="${i}"></td><td>${slot(`a${i}`)}</td>${extra}</tr>`;
    });
    const tot = level === 2 || level === 3 ? `<td>1</td>${level === 3 ? "<td>100</td>" : ""}` : "";
    body.innerHTML = `
      <p class="prompt fq-prompt">${round.title}: completa la tabla</p>
      <div class="fq-data">${round.data.map((v, j) => `<button type="button" class="fq-item" data-item="${j}" data-v="${v}">${face(v)}</button>`).join("")}</div>
      <div class="fq-sheet fq-cuaderno">
        <table class="fq-table fq-l${level}">
          <thead><tr>${heads.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>${rows.join("")}<tr class="fq-total"><td>Total</td><td></td><td>${slot("N")}</td>${tot}</tr></tbody>
        </table>
        ${level === 4 ? `<div class="fq-moda">Moda = ${slot("moda")}</div>` : ""}
      </div>
      <div class="keypad fq-keypad" data-keypad></div>
      <div class="feedback fq-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((s) => s.addEventListener("click", () => !busy && ((active = +s.dataset.slot), paint())));
    body.querySelectorAll("[data-item]").forEach((b) => b.addEventListener("click", () => !busy && ((crossed[+b.dataset.item] = !crossed[+b.dataset.item]), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary fq-ok" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const k = +s.dataset.slot;
      if (!busy) s.textContent = typed[k];
      s.classList.toggle("active", !busy && k === active);
    });
    const row = busy || round.slots[active].id === "moda" ? -1 : round.slots[active].row;
    body.querySelectorAll("[data-item]").forEach((b) => {
      b.classList.toggle("fq-x", busy || crossed[+b.dataset.item]);
      b.classList.toggle("fq-blink", +b.dataset.v === row);
    });
    round.counts.forEach((c, i) => {
      const n = busy ? c : round.data.filter((v, j) => v === i && crossed[j]).length;
      body.querySelector(`[data-tally="${i}"]`).innerHTML = n ? tally(n) : "";
    });
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    const t = typed[active];
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (key === ",") { if (/^d\d/.test(round.slots[active].id) && !t.includes(",")) typed[active] = (t || "0") + ","; }
    else if (t.length < 4) typed[active] = t + key;
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
        feedback.className = "feedback bad fq-feedback";
      }
      return;
    }
    busy = true;
    rounds++;
    const { slots, N } = round;
    // Cada casilla se compara por su valor; la fracción vale si es equivalente.
    const ok = slots.map((s, i) => {
      if (s.id.startsWith("fn") || s.id.startsWith("fd")) {
        const j = s.id.startsWith("fn") ? i : i - 1, n = Number(typed[j]), d = Number(typed[j + 1]);
        return d > 0 && n * N === round.counts[s.row] * d;
      }
      return cent(typed[i]) === cent(s.want);
    });
    const allOk = ok.every(Boolean);
    body.querySelectorAll("[data-slot]").forEach((el) => {
      const k = +el.dataset.slot;
      el.classList.add(ok[k] ? "good" : "bad");
      el.innerHTML = ok[k] ? typed[k] : `<s>${typed[k]}</s><i class="fq-fix">${slots[k].want}</i>`;
    });
    paint();
    const bad = ok.indexOf(false);
    const r = bad >= 0 && slots[bad].row >= 0 && slots[bad].id !== "moda" ? slots[bad].row : 0;
    const hint = `💡 ${round.rowHint[r]}${round.tail}`;
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${hint}`;
      feedback.className = "feedback ok fq-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Revisa lo rojo. ${hint} <button type="button" class="fq-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad fq-feedback";
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
    saveScore(client, "frecuencias", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📋</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} tablas completas de ${rounds}</p>
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
