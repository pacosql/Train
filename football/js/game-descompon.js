// "Unidades, decenas y centenas": la tabla posicional del cuaderno
// (UM | C | D | U) con el número dentro y, debajo, la línea a rellenar:
// "347 = □ C + □ D + □ U", "347 = □ + □ + □" (300 + 40 + 7) o "□ centenas,
// □ decenas y □ unidades". Alterna la inversa "4 C + 0 D + 7 U = □" (la
// tabla sale vacía y se rellena al corregir). Se toca una casilla, se
// escribe con el teclado y el foco avanza de izquierda a derecha, como se
// lee el número. 💡 "El 4 está en las centenas y vale 400".
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const SHORT = ["UM", "C", "D", "U"]; // de mayor a menor orden
const LONG = ["unidades de millar", "centenas", "decenas", "unidades"];
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const join = (parts) => (parts.length > 1 ? parts.slice(0, -1).join(", ") + " y " + parts[parts.length - 1] : parts[0]);

// Niveles: 0 D y U · 1 C D U sin ceros · 2 con ceros (407, 350) · 3 UM (3.482) ·
// 4 inversa desordenada y sin los ceros ("7 U + 3 C = □" → 307).
export function buildRound(level) {
  let n;
  if (level === 0) n = randInt(10, 99);
  else if (level === 1) do n = randInt(111, 999); while (/0/.test(String(n)));
  else if (level === 2) do n = randInt(101, 999); while (!/0/.test(String(n).slice(1)));
  else if (level === 3) n = randInt(1000, 9999);
  // nivel 4: a menudo con ceros, pero siempre con al menos dos cifras distintas de 0 (que haya algo que ordenar)
  else do n = randInt(101, 9999); while ((!/0/.test(String(n).slice(1)) && Math.random() < 0.6) || String(n).replace(/0/g, "").length < 2);
  const digits = String(n).split("").map(Number); // de mayor a menor orden
  const k = digits.length;
  const places = SHORT.slice(4 - k), words = LONG.slice(4 - k);
  const values = digits.map((d, i) => d * 10 ** (k - 1 - i));
  const form = level === 4 ? (Math.random() < 0.7 ? "E" : pick(["A", "B", "C"])) : pick(["A", "B", "C", "D"]);
  // Términos "4 C" de la inversa: en la desordenada se barajan y se quitan los ceros.
  let terms = digits.map((d, i) => ({ d, i }));
  if (form === "E") terms = shuffle(terms.filter((t) => t.d !== 0));
  let slots, hint;
  if (form === "A" || form === "C") slots = digits.map((d, i) => ({ want: d, place: i, kind: "digit" }));
  else if (form === "B") slots = values.map((v, i) => ({ want: v, place: i, kind: "value" }));
  else slots = [{ want: n, kind: "number" }];
  if (form === "E") {
    const expl = digits.map((d, i) => (d ? `${d} ${places[i]} = ${fmt(values[i])}` : `no hay ${words[i]} (0)`));
    hint = `Ordeno de mayor a menor: ${join(expl)} → ${fmt(n)}`;
  } else if (form === "D") {
    hint = `${join(digits.map((d, i) => `${d} ${places[i]} son ${fmt(values[i])}`))}: ${values.map(fmt).join(" + ")} = ${fmt(n)}`;
  } else {
    const expl = digits.map((d, i) => (i === 0 ? `El ${d} está en las ${words[i]} y vale ${fmt(values[i])}` : `el ${d} en las ${words[i]} vale ${fmt(values[i])}`));
    hint = `${join(expl)}: ${values.map(fmt).join(" + ")} = ${fmt(n)}`;
  }
  return { n, digits, places, words, values, form, terms, slots, hint };
}

export function mountDescomponGame(container, { client, onExit }) {
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
    <div class="game-body dp-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  const slotBtn = (i, cls = "") => `<button type="button" class="dp-slot ${cls}" data-slot="${i}"></button>`;
  // La línea del cuaderno según la forma de la ronda.
  function line() {
    const { form, places, words, terms, slots } = round;
    const num = `<span class="dp-num" data-num>${fmt(round.n)}</span>`;
    if (form === "A") return `${num} <span>=</span> ${slots.map((s, i) => `${slotBtn(i)} <span class="dp-u">${places[i]}</span>${i < slots.length - 1 ? " <span>+</span>" : ""}`).join(" ")}`;
    if (form === "B") return `${num} <span>=</span> ${slots.map((s, i) => `${slotBtn(i, ["dp-xwide", "dp-wide", "dp-wide", ""][4 - slots.length + i])}${i < slots.length - 1 ? " <span>+</span>" : ""}`).join(" ")}`;
    // cada casilla va pegada a su palabra (y a su coma) para que la frase no se parta mal
    if (form === "C") return slots.map((s, i) => `<span class="dp-grp">${slotBtn(i)} <span class="dp-u">${words[i]}${i < slots.length - 2 ? "," : ""}</span>${i === slots.length - 2 ? ' <span class="dp-u">y</span>' : ""}</span>`).join(" ");
    return `${terms.map((t) => `<span class="dp-num">${t.d}</span> <span class="dp-u">${places[t.i]}</span>`).join(" <span>+</span> ")} <span>=</span> ${slotBtn(0, "dp-xwide")}`;
  }

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    // nunca dos rondas seguidas iguales
    const last = round && round.n;
    do round = buildRound(Math.min(4, Math.floor(hits / 3))); while (round.n === last);
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    const inverse = round.form === "D" || round.form === "E";
    const k = round.digits.length;
    body.innerHTML = `
      <p class="prompt dp-prompt">${inverse ? "¿Qué número es?" : round.form === "B" ? "Descompón el número" : "¿Cuántas hay de cada?"}</p>
      <div class="dp-cuaderno">
        <div class="dp-table" style="grid-template-columns: repeat(${k}, 54px)">
          ${round.places.map((p) => `<span class="dp-h">${p}</span>`).join("")}
          ${round.digits.map((d, i) => `<span class="dp-d${inverse ? " dp-empty" : ""}${i === 0 ? " dp-first" : ""}" data-d="${i}">${inverse ? "·" : d}</span>`).join("")}
        </div>
        <div class="dp-eq">${line()}</div>
      </div>
      <div class="keypad dp-keypad" data-keypad></div>
      <div class="feedback dp-feedback" data-feedback></div>
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
      const t = typed[+b.dataset.slot];
      b.textContent = t === "" ? "" : fmt(Number(t));
      b.classList.toggle("active", +b.dataset.slot === active);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    const max = round.slots[active].kind === "digit" ? 1 : 4;
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < max) {
      typed[active] += key;
      // Casillas de una cifra: el foco pasa solo a la siguiente (de izquierda a derecha).
      if (max === 1 && active < typed.length - 1) active++;
    }
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const empty = typed.findIndex((t) => t === "");
    if (empty !== -1) {
      // ✓ con casillas vacías: el foco salta a la primera vacía (como un Enter).
      const silent = active !== empty && typed[active] !== "";
      active = empty;
      paint();
      if (silent) return;
      feedback.textContent = "Rellena todas las casillas";
      feedback.className = "feedback bad";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const i = +b.dataset.slot, want = round.slots[i].want;
      const ok = Number(typed[i]) === want;
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${fmt(Number(typed[i]))}</s><em>${fmt(want)}</em>`;
    });
    // En la inversa la tabla se rellena con las cifras correctas al corregir.
    body.querySelectorAll("[data-d]").forEach((c) => {
      c.textContent = round.digits[+c.dataset.d];
      c.classList.remove("dp-empty");
      c.classList.add("good");
    });
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era ${round.slots.map((s) => fmt(s.want)).join(", ")}. 💡 ${round.hint}`;
      feedback.className = "feedback bad";
      const nxt = document.createElement("button");
      nxt.type = "button";
      nxt.className = "secondary dp-next";
      nxt.textContent = "Siguiente →";
      nxt.addEventListener("click", advance);
      body.querySelector("[data-keypad]").replaceWith(nxt);
      pending = setTimeout(advance, 2500);
    }
  }

  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
  }

  // Teclado físico: cifras, retroceso y Enter.
  const onKey = (e) => {
    if (finished) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else return;
    e.preventDefault();
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "descompon", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧮</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} descomposiciones bien de ${rounds}</p>
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
    window.removeEventListener("keydown", onKey);
  };
}
