// "La escalera de unidades": la escalera del libro (km hm dam m dm cm mm)
// dibujada con sus siete escalones bajando a la derecha, "×10" al bajar y
// "÷10" al subir. Se marca el escalón de origen y el de destino, se escribe
// la respuesta en la casilla del cuaderno con el teclado y, al responder,
// una bolita recorre los escalones uno a uno. Niveles: longitud bajando →
// subiendo con decimales → masa y capacidad → superficie (×100) → volumen
// (×1.000) y 1 l = 1 dm³. 3º-6º.
import { randInt, pick, saveScore } from "./utils.js";

const MAGS = {
  longitud: ["km", "hm", "dam", "m", "dm", "cm", "mm"],
  masa: ["kg", "hg", "dag", "g", "dg", "cg", "mg"],
  capacidad: ["kl", "hl", "dal", "l", "dl", "cl", "ml"],
  superficie: ["km²", "hm²", "dam²", "m²", "dm²", "cm²", "mm²"],
  volumen: ["km³", "hm³", "dam³", "m³", "dm³", "cm³", "mm³"],
};
const POW = { longitud: 1, masa: 1, capacidad: 1, superficie: 2, volumen: 3 }; // ceros por escalón
const LITROS = { 4: "l", 5: "ml" }; // 1 dm³ = 1 l, 1 cm³ = 1 ml

const miles = (s) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
// Un decimal exacto como mantisa entera M con D cifras decimales (sin ceros sobrantes).
const norm = (M, D) => { while (D > 0 && M % 10 === 0) { M /= 10; D--; } return { M, D }; };
export function numStr(M, D) {
  const s = String(M).padStart(D + 1, "0");
  return miles(s.slice(0, s.length - D)) + (D ? "," + s.slice(s.length - D) : "");
}
// Lo escrito en la casilla ("2,5", "3.000") → número; NaN si no es un número.
export const parseNum = (t) => (/^\d*(,\d*)?$/.test(t.replace(/\./g, "")) && /\d/.test(t) ? Number(t.replace(/\./g, "").replace(",", ".")) : NaN);
const fmtTyped = (t) => { const [i, d] = t.split(","); return miles(i) + (t.includes(",") ? "," + (d || "") : ""); };

// Niveles: 0 longitud bajando · 1 longitud subiendo (decimales) · 2 masa y
// capacidad · 3 superficie (×100) · 4 volumen (×1.000) y litros.
export function buildRound(level) {
  for (;;) {
    const mag = level <= 1 ? "longitud" : level === 2 ? pick(["masa", "capacidad"]) : level === 3 ? "superficie" : "volumen";
    const p = POW[mag];
    const litros = level === 4 && Math.random() < 0.45;
    let from, to;
    if (litros) { from = randInt(3, 5); to = randInt(3, 5); if (from === 3 && to === 3) continue; }
    else {
      let k = randInt(1, p === 1 ? 3 : 2);
      if (level === 1 || (level >= 2 && Math.random() < 0.5)) k = -k;
      from = k > 0 ? randInt(0, 6 - k) : randInt(-k, 6);
      to = from + k;
    }
    const k = to - from, n = Math.abs(k);
    const g = norm(pick([randInt(1, 9), randInt(1, 9), randInt(10, 99), randInt(1, 9) * 10, randInt(1, 9) * 100, randInt(1, 19) * 50, randInt(101, 999)]), level >= 2 && Math.random() < 0.3 ? 1 : 0);
    const ans = k >= 0 ? norm(g.M * 10 ** (n * p), g.D) : norm(g.M, g.D + n * p);
    if (ans.D > 3 || ans.M > 999999 || String(g.M).length > 4) continue;
    if (level === 1 && ans.D === 0 && Math.random() < 0.7) continue; // en este nivel se practican los decimales
    const units = MAGS[mag];
    let fromLabel = units[from], toLabel = units[to];
    if (litros) {
      // Un lado se nombra en litros: el que sea dm³ o cm³ (si ambos, al azar).
      const side = LITROS[to] && (!LITROS[from] || Math.random() < 0.5) ? "to" : "from";
      if (side === "to") toLabel = LITROS[to]; else fromLabel = LITROS[from];
    }
    const a = numStr(g.M, g.D), b = numStr(ans.M, ans.D);
    const chain = Array.from({ length: n }, () => `${k > 0 ? "×" : "÷"} ${miles(String(10 ** p))}`).join(" ");
    const hint = n === 0
      ? `1 l = 1 dm³ (y 1 ml = 1 cm³): es la misma cantidad, ${a} ${fromLabel} = ${b} ${toLabel}`
      : `${litros ? "1 l = 1 dm³. " : ""}De ${fromLabel} a ${toLabel} ${k > 0 ? "bajo" : "subo"} ${n} escalón${n > 1 ? "es" : ""}: ${a} ${chain} = ${b}`;
    return { mag, units, p, from, to, k, litros, fromLabel, toLabel, given: a, ans: b, ansVal: ans.M / 10 ** ans.D, hint };
  }
}

// La escalera: 7 escalones de 50×20 bajando a la derecha, dibujada en SVG.
const W = 50, H = 20, X0 = 6, Y0 = 30;
const tx = (i) => X0 + i * W, ty = (i) => Y0 + i * H;
function stairsSvg(r) {
  let d = `M${tx(0)} ${ty(0)}`;
  for (let i = 0; i < 7; i++) d += ` H${tx(i + 1)} V${ty(i + 1)}`;
  d += ` H${tx(0)} Z`;
  const f = miles(String(10 ** r.p));
  const labels = r.units.map((u, i) => `<text class="eu-lab" x="${tx(i) + W / 2}" y="${ty(i) + 14}">${u}</text>${
    r.mag === "volumen" && LITROS[i] ? `<text class="eu-alias" x="${tx(i) + W / 2}" y="${ty(i) + 29}">= ${LITROS[i]}</text>` : ""}`).join("");
  const mark = (i, cls) => `<line class="eu-mark ${cls}" x1="${tx(i) + 2}" y1="${ty(i)}" x2="${tx(i + 1) - 2}" y2="${ty(i)}"/>`;
  return `<svg class="eu-stairs" viewBox="0 0 362 192" aria-label="escalera de unidades">
    <text class="eu-leg" x="${tx(7) - 2}" y="16" text-anchor="end">bajar ↘ ×${f}</text>
    <text class="eu-leg" x="${tx(0) + 2}" y="${ty(7) + 16}">subir ↖ ÷${f}</text>
    <path class="eu-steps" d="${d}"/>${labels}${mark(r.from, "from")}${mark(r.to, "to")}
    <text class="eu-hop" data-hop x="0" y="0"></text>
    <circle class="eu-ball" data-ball cx="${tx(r.from) + W / 2}" cy="${ty(r.from) - 9}" r="7"/>
  </svg>`;
}

export function mountEscalaunidadesGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null, timers = [];
  let round, typed, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body eu-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const clearTimers = () => { clearTimeout(pending); timers.forEach(clearTimeout); timers = []; };

  function nextRound() {
    if (finished) return;
    clearTimers();
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = "";
    busy = false;
    body.innerHTML = `
      <p class="prompt eu-prompt">Pasa de <b>${round.fromLabel}</b> a <b>${round.toLabel}</b></p>
      ${stairsSvg(round)}
      <div class="eu-cuaderno"><span class="eu-line">${round.given} ${round.fromLabel} = <button type="button" class="eu-box active" data-box></button> ${round.toLabel}</span></div>
      <div class="keypad eu-keypad" data-keypad></div>
      <div class="feedback eu-feedback" data-feedback></div>
    `;
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
  }

  function pressKey(key) {
    if (finished) return;
    if (busy) { if (key === "✓") body.querySelector("[data-next]")?.click(); return; }
    if (key === "✓") return check();
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (key === ",") { if (!typed.includes(",") && typed.length < 9) typed += typed ? "," : "0,"; }
    else if (typed.length < 9) typed += key;
    body.querySelector("[data-box]").textContent = fmtTyped(typed);
  }

  // La bolita baja (o sube) escalón a escalón enseñando ×10 / ÷10 en cada salto.
  function animate() {
    const ball = body.querySelector("[data-ball]"), hop = body.querySelector("[data-hop]");
    const s = Math.sign(round.k), f = miles(String(10 ** round.p));
    for (let j = 1; j <= Math.abs(round.k); j++) {
      timers.push(setTimeout(() => {
        const i = round.from + s * j;
        ball.setAttribute("cx", tx(i) + W / 2);
        ball.setAttribute("cy", ty(i) - 9);
        hop.setAttribute("x", tx(i) + W / 2);
        hop.setAttribute("y", ty(i) - 22);
        hop.textContent = `${s > 0 ? "×" : "÷"}${f}`;
      }, 230 * j));
    }
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const value = parseNum(typed);
    if (Number.isNaN(value)) {
      feedback.textContent = "Escribe la respuesta en la casilla";
      feedback.className = "feedback bad";
      return;
    }
    busy = true;
    rounds++;
    const box = body.querySelector("[data-box]");
    box.classList.remove("active");
    animate();
    if (Math.abs(value - round.ansVal) < 1e-9) {
      score += 10;
      hits++;
      renderScore();
      box.classList.add("good");
      feedback.textContent = `✓ ${round.ans} ${round.toLabel}. 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      box.classList.add("bad");
      box.innerHTML = `<s>${fmtTyped(typed)}</s>`;
      box.insertAdjacentHTML("afterend", ` <b class="eu-right">${round.ans}</b>`);
      feedback.innerHTML = `Era ${round.ans} ${round.toLabel}. 💡 ${round.hint}<button type="button" class="secondary eu-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad";
      const go = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  // Teclado físico: cifras, coma (o punto), Backspace y Enter.
  const onKey = (e) => {
    if (finished) return;
    const k = /^\d$/.test(e.key) ? e.key : e.key === "Backspace" ? "⌫" : e.key === "Enter" ? "✓" : e.key === "," || e.key === "." ? "," : null;
    if (k) { e.preventDefault(); pressKey(k); }
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "escalaunidades", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🪜</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cambios de unidad bien hechos de ${rounds}</p>
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
    clearTimers();
    window.removeEventListener("keydown", onKey);
  };
}
