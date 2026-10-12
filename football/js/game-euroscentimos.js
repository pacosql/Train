// "Euros y céntimos": monedas y billetes dibujados con CSS y, en el
// cuaderno, "3 € y 45 cent = □,□□ €" (casillas con la coma fija) o al
// revés "2,05 € = □ € y □ cent". En el sentido "€ y cent → decimal" el
// dinero se ve desde el principio; en el otro aparece al responder. El
// foco va de izquierda a derecha, como se escribe un número. Niveles:
// euros enteros y 50 cent → cualquier céntimo → menos de 10 cent (2,05:
// cuidado con el 0) → sumas de dos cantidades (1,20 € + 0,85 €). 2º-4º.
import { randInt, pick, saveScore } from "./utils.js";

// Lo que hay en el monedero: billetes, monedas de euro y de céntimos.
const PIECES = [
  { v: 2000, cls: "bill b20", t: "20 €" }, { v: 1000, cls: "bill b10", t: "10 €" }, { v: 500, cls: "bill b5", t: "5 €" },
  { v: 200, cls: "coin c2e", t: "2 €" }, { v: 100, cls: "coin c1e", t: "1 €" },
  { v: 50, cls: "coin gold", t: "50", s: 1 }, { v: 20, cls: "coin gold", t: "20", s: 0.92 }, { v: 10, cls: "coin gold", t: "10", s: 0.84 },
  { v: 5, cls: "coin copper", t: "5", s: 0.88 }, { v: 2, cls: "coin copper", t: "2", s: 0.8 }, { v: 1, cls: "coin copper", t: "1", s: 0.72 },
];
const euros = (c) => `${Math.floor(c / 100)},${String(c % 100).padStart(2, "0")} €`;
const eyc = (c) => (c < 100 ? `${c} cent` : c % 100 ? `${Math.floor(c / 100)} € y ${c % 100} cent` : `${c / 100} €`);
function moneyHtml(c) {
  let out = "";
  for (const p of PIECES) for (; c >= p.v; c -= p.v)
    out += `<span class="ec-${p.cls.split(" ").join(" ec-")}" style="--s:${p.s || 1}"><b>${p.t}</b>${p.v < 100 ? "<i>cent</i>" : ""}</span>`;
  return out;
}

// dir "ed": € y cent → decimal (□,□□ €); "de": decimal → □ € y □ cent; "suma": a + b = □,□□ €.
export function buildRound(level) {
  const lv = Math.min(3, Math.max(0, level));
  if (lv === 3) {
    let a, b;
    do { a = randInt(0, 4) * 100 + randInt(1, 19) * 5; b = randInt(0, 3) * 100 + randInt(1, 19) * 5; } while ((a % 100) + (b % 100) < 100 && Math.random() < 0.6);
    const c = a + b;
    const hint = `${euros(a)} son ${a} cent y ${euros(b)} son ${b} cent: ${a} + ${b} = ${c} cent = ${euros(c)}`;
    return { lv, dir: "suma", a, b, c, hint, answer: euros(c), boxes: decBoxes(c) };
  }
  const E = randInt(lv === 2 ? 0 : 1, 9);
  const C = lv === 0 ? pick([0, 50, 50]) : lv === 1 ? randInt(11, 99) : pick([randInt(1, 9), randInt(1, 9), randInt(1, 9) * 10]);
  if (E === 0 && C === 0) return buildRound(level);
  const c = E * 100 + C, cs = String(C).padStart(2, "0");
  const dir = Math.random() < 0.5 ? "ed" : "de";
  let hint;
  if (dir === "ed") hint = C === 0 ? `${E} € justos: sin céntimos, después de la coma va 00 → ${euros(c)}`
    : `1 € = 100 cent, así que ${C} cent son 0,${cs} €${C < 10 ? " (cuidado con el 0)" : ""}: ${euros(c)}`;
  else hint = `Antes de la coma, los euros (${E} €); las dos cifras de después, los céntimos: ${cs} → ${C} cent${C < 10 ? " (el 0 dice que no hay décimas)" : ""}`;
  const boxes = dir === "ed" ? decBoxes(c) : [{ unit: "€", ans: E, len: String(E).length }, { unit: "cent", ans: C, len: 2 }];
  return { lv, dir, c, E, C, hint, answer: dir === "ed" ? euros(c) : `${E} € y ${C} cent`, boxes };
}
// Casillas del decimal: los euros, la coma fija y una casilla por cifra (décimas, centésimas).
function decBoxes(c) {
  const E = Math.floor(c / 100);
  return [{ unit: "e", ans: E, len: String(E).length }, { unit: "d", ans: Math.floor(c / 10) % 10, len: 1, max: 1 }, { unit: "c", ans: c % 10, len: 1, max: 1 }];
}

export function mountEuroscentimosGame(container, { client, onExit }) {
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
    <div class="game-body ec-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const box = (i, cls = "") => `<button type="button" class="ec-box${cls}" data-box="${i}"></button>`;

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    // Nunca dos rondas iguales seguidas.
    const prev = round?.hint;
    for (let t = 0; t < 20 && (!t || round.hint === prev); t++) round = buildRound(Math.min(3, Math.floor(hits / 2)));
    typed = round.boxes.map(() => "");
    active = 0;
    busy = false;
    const dec = `<span class="ec-dec">${box(0, " wide")}<span class="ec-comma">,</span>${box(1)}${box(2)} <span class="ec-unit">€</span></span>`;
    const r = round;
    const line = r.dir === "ed" ? `<span>${eyc(r.c)} =</span> ${dec}`
      : r.dir === "suma" ? `<span>${euros(r.a)} + ${euros(r.b)} =</span> ${dec}`
      : `<span>${euros(r.c)} =</span> ${box(0)} <span class="ec-unit">€ y</span> ${box(1, " wide")} <span class="ec-unit">cent</span>`;
    const money = r.dir === "ed" ? moneyHtml(r.c)
      : r.dir === "suma" ? `<span class="ec-pile">${moneyHtml(r.a)}</span><b class="ec-plus">+</b><span class="ec-pile">${moneyHtml(r.b)}</span>`
      : `<span class="ec-hidden">💰 ¿cuánto dinero es?</span>`;
    body.innerHTML = `
      <p class="prompt ec-prompt">${r.dir === "de" ? "Sepáralo en euros y céntimos" : r.dir === "suma" ? "¿Cuánto es en total?" : "Escríbelo con coma"}</p>
      <div class="ec-money" data-money>${money}</div>
      <div class="ec-cuaderno"><span class="ec-line">${line}</span></div>
      <div class="keypad ec-keypad" data-keypad></div>
      <div class="feedback ec-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-box]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.box), paint())));
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
    body.querySelectorAll("[data-box]").forEach((b, i) => {
      b.textContent = typed[i];
      b.classList.toggle("active", i === active);
    });
  }

  function pressKey(key) {
    if (finished) return;
    if (busy) { if (key === "✓") body.querySelector("[data-next]")?.click(); return; }
    if (key === "✓") return check();
    if (key === "⌫") {
      if (typed[active] === "" && active > 0) active--;
      typed[active] = typed[active].slice(0, -1);
    } else if (typed[active].length < (round.boxes[active].max || 2)) {
      typed[active] += key;
      // Casilla con sus cifras → el foco salta a la siguiente, de izquierda a derecha.
      if (typed[active].length >= round.boxes[active].len && active < typed.length - 1) active++;
    }
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const empty = typed.findIndex((t) => t === "");
    if (empty !== -1) {
      active = empty;
      paint();
      feedback.textContent = "Rellena todas las casillas (también los ceros)";
      feedback.className = "feedback bad ec-feedback";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-box]").forEach((b, i) => {
      const want = round.boxes[i];
      // Los céntimos sueltos ("5" o "05") valen igual; en el decimal cada cifra va en su casilla.
      const ok = Number(typed[i]) === want.ans;
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[i]}</s><b class="ec-right">${want.ans}</b>`;
    });
    if (round.dir === "de") body.querySelector("[data-money]").innerHTML = moneyHtml(round.c);
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${round.answer}. 💡 ${round.hint}`;
      feedback.className = "feedback ok ec-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.innerHTML = `Era ${round.answer}. 💡 ${round.hint}<button type="button" class="secondary ec-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad ec-feedback";
      const go = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  // Teclado físico: cifras, Backspace y Enter.
  const onKey = (e) => {
    if (finished) return;
    const k = /^\d$/.test(e.key) ? e.key : e.key === "Backspace" ? "⌫" : e.key === "Enter" ? "✓" : null;
    if (k) { e.preventDefault(); pressKey(k); }
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "euroscentimos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>💶</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cantidades bien escritas de ${rounds}</p>
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
