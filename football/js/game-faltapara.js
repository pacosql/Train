// "¿Cuánto falta?": una barra de 0 a 100 (o a 10, 20, 1.000, 5 €) con la
// parte conocida pintada y la igualdad del cuaderno "37 + □ = 100". Se
// escribe lo que falta con el teclado y la barra se completa (verde si
// bien, rojo si mal). El 💡 cuenta por saltos como la profe: "de 37 a 40
// van 3, de 40 a 100 van 60: 3 + 60 = 63". En el último nivel es dinero,
// con la tecla de la coma: "¿cuánto falta para 5 €?" con 3,45 €.
import { randInt, pick, saveScore } from "./utils.js";

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const eur = (c) => (c % 100 === 0 ? `${c / 100} €` : `${Math.floor(c / 100)},${String(c % 100).padStart(2, "0")} €`);

// Niveles: 0 a 10 y a 20 · 1 a 100 con decenas (30 + □) · 2 a 100
// cualquiera · 3 a 1.000 (370 + □) · 4 dinero (3,45 € + □ = 5 €), en céntimos.
export function buildRound(level) {
  let T, a, money = false;
  if (level === 0) { T = pick([10, 20]); a = randInt(1, T - 1); }
  else if (level === 1) { T = 100; a = 10 * randInt(1, 9); }
  else if (level === 2) { T = 100; do a = randInt(1, 99); while (a % 10 === 0); }
  else if (level === 3) { T = 1000; do a = Math.random() < 0.7 ? 10 * randInt(1, 99) : randInt(1, 999); while (a % 100 === 0); }
  else { money = true; T = pick([2, 5, 10]) * 100; do a = 5 * randInt(1, T / 5 - 1); while (a % 100 === 0); }
  const b = T - a;
  const show = money ? eur : fmt;
  // Saltos: hasta la siguiente decena/centena (o el siguiente euro) y de ahí al total.
  const units = money ? [100] : [10, 100].filter((u) => u < T);
  const stops = [a];
  for (const u of units) { const nx = Math.ceil(stops[stops.length - 1] / u) * u; if (nx > stops[stops.length - 1] && nx < T) stops.push(nx); }
  stops.push(T);
  const segs = stops.slice(1).map((s, i) => ({ from: stops[i], to: s, d: s - stops[i] }));
  const hint = segs.length === 1
    ? `De ${show(a)} a ${show(T)} ${b === 1 ? "va" : "van"} ${show(b)}: ${show(a)} + ${show(b)} = ${show(T)}`
    : `${segs.map((s, i) => `${i ? "de" : "De"} ${show(s.from)} a ${show(s.to)} ${s.d === 1 || (money && s.d === 100) ? "va" : "van"} ${show(s.d)}`).join(", ")}: ${segs.map((s) => show(s.d)).join(" + ")} = ${show(b)}`;
  return { T, a, b, money, hint, stops };
}

// Lo tecleado → valor (céntimos si es dinero): "1,5" vale 1,50 €.
function parse(typed, money) {
  if (!money) return Number(typed);
  const [e, c = ""] = typed.split(",");
  return Number(e || 0) * 100 + Number((c + "00").slice(0, 2));
}

export function mountFaltaparaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body fp-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const onKey = (e) => {
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "," || e.key === ".") pressKey(",");
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  };
  window.addEventListener("keydown", onKey);

  // La barra: parte conocida pintada, la que falta a trazos con "?",
  // marcas cada décima parte (cada euro si es dinero) y etiquetas.
  function bar(r) {
    const W = 336, H = 88, x0 = 8, y0 = 24, h = 40, w = W - 16;
    const px = (v) => x0 + (v / r.T) * w;
    const show = r.money ? eur : fmt;
    const step = r.money ? 100 : r.T / 10;
    let ticks = "";
    for (let v = step; v < r.T; v += step) ticks += `<line class="fp-tick${v > r.a ? " fp-rail-tick" : ""}" x1="${px(v)}" y1="${y0 + 2}" x2="${px(v)}" y2="${y0 + h - 2}"/>`;
    return `<svg class="fp-bar" viewBox="0 0 ${W} ${H}">
      <rect class="fp-rail" x="${x0}" y="${y0}" width="${w}" height="${h}" rx="6"/>
      <rect class="fp-known" x="${x0}" y="${y0}" width="${px(r.a) - x0}" height="${h}" rx="6"/>
      <rect class="fp-miss" data-miss x="${px(r.a) + 1}" y="${y0 + 1}" width="${Math.max(2, px(r.T) - px(r.a) - 2)}" height="${h - 2}" rx="5"/>
      ${ticks}
      <text class="fp-in" x="${(x0 + px(r.a)) / 2}" y="${y0 + h / 2}">${px(r.a) - x0 > 40 ? show(r.a) : ""}</text>
      <text class="fp-q" data-q x="${(px(r.a) + px(r.T)) / 2}" y="${y0 + h / 2}">${px(r.T) - px(r.a) > 40 ? "?" : ""}</text>
      <text class="fp-start" x="${x0}" y="${y0 + h + 18}">0</text>
      <text class="fp-end" x="${px(r.T)}" y="${y0 + h + 18}">${show(r.T)}</text>
      ${px(r.a) > 50 && px(r.T) - px(r.a) > 50 ? `<text x="${px(r.a)}" y="${y0 - 7}">${show(r.a)}</text>` : ""}
    </svg>`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 3)));
    typed = "";
    busy = false;
    const show = round.money ? eur : fmt;
    body.innerHTML = `
      <p class="prompt fp-prompt">¿Cuánto falta para <b>${show(round.T)}</b>?</p>
      <div class="fp-cuaderno">
        ${bar(round)}
        <div class="fp-line">
          <span data-known>${show(round.a)}</span><span class="fp-op">+</span>
          <button type="button" class="fp-slot active" data-slot></button>${round.money ? "<span>€</span>" : ""}
          <span class="fp-op">=</span><span data-total>${show(round.T)}</span>
        </div>
      </div>
      <div class="keypad fp-keypad" data-keypad></div>
      <div class="feedback fp-feedback" data-feedback></div>
    `;
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary fp-check" : ""}`;
      btn.dataset.key = key;
      btn.textContent = key;
      if (key === ",") btn.disabled = !round.money; // la coma solo con dinero
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (key === ",") { if (round.money && !typed.includes(",")) typed += ","; }
    else if (typed.length < 5 && !(typed.includes(",") && typed.split(",")[1].length >= 2)) typed += key;
    body.querySelector("[data-slot]").textContent = typed;
  }

  function check() {
    const fb = body.querySelector("[data-feedback]");
    if (typed === "" || typed === ",") {
      fb.textContent = "Escribe lo que falta en la casilla";
      fb.className = "feedback bad";
      return;
    }
    busy = true;
    rounds++;
    const show = round.money ? eur : fmt;
    const ok = parse(typed, round.money) === round.b;
    const slot = body.querySelector("[data-slot]");
    slot.classList.remove("active");
    slot.classList.add(ok ? "good" : "bad");
    if (!ok) slot.innerHTML = `<s>${typed}</s><b class="fp-want">${round.money ? eur(round.b).replace(" €", "") : fmt(round.b)}</b>`;
    // La barra se completa con el trozo que faltaba.
    body.querySelector("[data-miss]").classList.add(ok ? "good" : "bad");
    const q = body.querySelector("[data-q]");
    q.textContent = q.textContent ? show(round.b) : "";
    q.setAttribute("class", "fp-in");
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      fb.innerHTML = `✓ ${show(round.a)} + ${show(round.b)} = ${show(round.T)}. 💡 ${round.hint}`;
      fb.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      fb.innerHTML = `Faltaban ${show(round.b)}. 💡 ${round.hint} <button type="button" class="fp-next" data-next>Siguiente →</button>`;
      fb.className = "feedback bad";
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      fb.querySelector("[data-next]").addEventListener("click", go);
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
    saveScore(client, "faltapara", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧩</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} huecos completados de ${rounds}</p>
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
