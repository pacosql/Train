// "Redondea": "Redondea 4.567 a las centenas: □" con una mini recta
// numérica entre las dos centenas vecinas (4.500 y 4.600), su punto medio
// (4.550) marcado y el número como un punto rojo. Se escribe el redondeo
// con el teclado (coma para los decimales). Al corregir, una flecha lleva
// el punto hasta el extremo más cercano. El 💡 mira la cifra siguiente:
// "Miro la cifra de las decenas (6 ≥ 5): subo a 4.600".
import { randInt, saveScore } from "./utils.js";

// Cada nivel: a qué se redondea, cuántos decimales tiene el número
// (dec) y el paso de redondeo en "unidades del número" (step).
const LEVELS = [
  { to: "las decenas", next: "las unidades", step: 10, dec: 0, min: 11, max: 999 },
  { to: "las centenas", next: "las decenas", step: 100, dec: 0, min: 101, max: 9999 },
  { to: "los millares", next: "las centenas", step: 1000, dec: 0, min: 1001, max: 99999 },
  { to: "las unidades", next: "las décimas", step: 10, dec: 1, min: 11, max: 999 }, // 1,1 … 99,9
  { to: "las unidades", next: "las décimas", step: 100, dec: 2, min: 101, max: 9999 }, // 3,47 → 3
  { to: "las décimas", next: "las centésimas", step: 10, dec: 2, min: 101, max: 9999 }, // 3,47 → 3,5
];
// Entero v con d decimales → texto español (punto de miles, coma decimal)
export function fmt(v, d) {
  const int = String(Math.floor(v / 10 ** d)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return d ? `${int},${String(v % 10 ** d).padStart(d, "0")}` : int;
}

// Niveles 0-5 según LEVELS. Todo se calcula con enteros (v = 347 y dec 2
// es 3,47) para no arrastrar errores de coma flotante.
export function buildRound(level) {
  const L = LEVELS[level];
  let v;
  do v = randInt(L.min, L.max);
  // ya redondo: no hay nada que hacer; con decimales, sin un 0 al final (3,40)
  while (v % L.step === 0 || (L.dec && v % 10 === 0));
  const lo = v - (v % L.step), hi = lo + L.step;
  const nextDigit = Math.floor((v % L.step) / (L.step / 10)); // la cifra que se mira
  const up = nextDigit >= 5;
  const r = up ? hi : lo;
  // Decimales del resultado: a las décimas se escribe 3,5 (también 4,0)
  const rdec = L.to === "las décimas" ? 1 : 0;
  const rv = r / 10 ** (L.dec - rdec); // r en unidades del resultado
  const shown = fmt(v, L.dec), answerText = fmt(rv, rdec);
  // Extremos con los decimales del resultado (45 y 46; 29,4 y 29,5) y el
  // punto medio con uno más (45,5; 29,45)
  const sc = 10 ** (L.dec - rdec), mid = (lo + hi) / 2;
  const midText = L.dec ? fmt(mid / (sc / 10), rdec + 1) : fmt(mid, 0);
  const hint = up
    ? `Miro la cifra de ${L.next} (${nextDigit} ≥ 5): subo a ${answerText}`
    : `Miro la cifra de ${L.next} (${nextDigit} < 5): me quedo en ${answerText}`;
  return { v, dec: L.dec, to: L.to, lo, hi, nextDigit, up, rv, rdec, shown, answer: rv / 10 ** rdec, answerText, loText: fmt(lo / sc, rdec), hiText: fmt(hi / sc, rdec), midText, hint };
}

export function mountRedondeaGame(container, { client, onExit }) {
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
    <div class="game-body rd-body" data-body></div>
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

  // Mini recta: extremos lo y hi, diez marcas, la del medio más larga y el
  // número como punto. Con done, flecha hasta el extremo más cercano.
  function line(done, ok) {
    const X0 = 34, X1 = 286, Y = 46;
    const x = (val) => X0 + ((val - round.lo) / (round.hi - round.lo)) * (X1 - X0);
    const ticks = Array.from({ length: 11 }, (_, i) => {
      const tx = X0 + (i * (X1 - X0)) / 10, h = i === 5 ? 12 : i % 10 === 0 ? 14 : 6;
      return `<line class="rd-tick${i === 5 ? " rd-mid" : ""}" x1="${tx}" y1="${Y - h}" x2="${tx}" y2="${Y + h}"/>`;
    }).join("");
    const px = x(round.v), tx = round.up ? X1 : X0;
    const arrow = done
      ? `<line class="rd-arrow ${ok ? "good" : "bad"}" x1="${px}" y1="${Y - 22}" x2="${tx + (round.up ? -4 : 4)}" y2="${Y - 22}" marker-end="url(#rd-head)"/>`
      : "";
    const end = (val, txt, isR) => `<text class="rd-end${done && isR ? " rd-win" : ""}" x="${x(val)}" y="${Y + 32}">${txt}</text>`;
    return `<svg class="rd-svg" viewBox="0 0 320 92" role="img" aria-label="Recta de ${round.loText} a ${round.hiText}">
      <defs><marker id="rd-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="rd-headp"/></marker></defs>
      <line class="rd-axis" x1="${X0}" y1="${Y}" x2="${X1}" y2="${Y}"/>${ticks}
      ${end(round.lo, round.loText, !round.up)}${end(round.hi, round.hiText, round.up)}
      <text class="rd-midt" x="${(X0 + X1) / 2}" y="${Y + 30}">${round.midText}</text>
      ${arrow}
      <circle class="rd-dot" cx="${px}" cy="${Y}" r="7"/>
      <text class="rd-num" x="${px}" y="${Y - 30}">${done ? "" : round.shown}</text>
    </svg>`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(5, Math.floor(hits / 2)));
    typed = "";
    busy = false;
    body.innerHTML = `
      <p class="prompt rd-prompt">Redondea a ${round.to}</p>
      <div class="rd-cuaderno">
        <div class="rd-line"><span>${round.shown}</span><span class="rd-op">≈</span><button type="button" class="rd-slot active" data-slot></button></div>
        <div data-recta>${line(false)}</div>
      </div>
      <div class="keypad rd-keypad" data-keypad></div>
      <div class="feedback rd-feedback" data-feedback></div>
    `;
    body.querySelector("[data-slot]").addEventListener("click", paint);
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

  // Lo escrito, con punto de miles en la parte entera
  const pretty = (s) => {
    const [i, d] = s.split(",");
    const int = i.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return d === undefined ? int : `${int},${d}`;
  };

  function paint() {
    const s = body.querySelector("[data-slot]");
    if (s && !busy) s.textContent = pretty(typed);
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (key === ",") { if (!typed.includes(",")) typed = (typed || "0") + ","; }
    else if (typed.length < 8) typed += key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    if (!typed || typed.endsWith(",")) {
      feedback.textContent = "Escribe el número redondeado";
      feedback.className = "feedback bad";
      return;
    }
    busy = true;
    rounds++;
    // Se compara en enteros: "3,5" con rdec 1 → 35; "4" o "4,0" valen igual
    const [i, d = ""] = typed.split(",");
    const scale = Math.max(d.length, round.rdec);
    const given = Number(i) * 10 ** scale + Number(d.padEnd(scale, "0") || 0);
    const ok = given === round.rv * 10 ** (scale - round.rdec);
    const slot = body.querySelector("[data-slot]");
    slot.classList.remove("active");
    slot.classList.add(ok ? "good" : "bad");
    if (!ok) slot.innerHTML = `<s>${pretty(typed)}</s><em>${round.answerText}</em>`;
    body.querySelector("[data-recta]").innerHTML = line(true, ok);
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.innerHTML = `💡 ${round.hint} <button type="button" class="primary rd-next" data-next>Siguiente →</button>`;
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
    saveScore(client, "redondea", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🎯</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} redondeos bien de ${rounds}</p>
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
