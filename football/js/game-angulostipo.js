// "Agudo, recto, obtuso": seis ángulos dibujados (dos semirrectas con su
// arquito) y "Toca TODOS los obtusos". Se marcan/desmarcan al tocarlos y
// ✓ comprueba. Al responder se superpone en cada ángulo la esquina de un
// recto (cuadradito y líneas a trazos) para comparar, y se escribe cuánto
// mide. En el último nivel se cuentan con el teclado.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const CH = 96, MG = 12;
const PL = { agudo: "agudos", recto: "rectos", obtuso: "obtusos", llano: "llanos" };
const DEF = {
  agudo: "Agudo: más cerrado que un recto, mide menos de 90°",
  recto: "Recto: mide exactamente 90°, como la esquina de un folio",
  obtuso: "Obtuso: más abierto que un recto (90°) y menos que un llano (180°)",
  llano: "Llano: mide 180°, sus dos lados forman una línea recta",
};
const kindOf = (a) => (a < 90 ? "agudo" : a === 90 ? "recto" : a < 180 ? "obtuso" : "llano");
const r1 = (v) => Math.round(v * 10) / 10;
const dir = (deg) => [Math.cos((deg * Math.PI) / 180), -Math.sin((deg * Math.PI) / 180)];
const list = (xs) => xs.join(", ").replace(/, ([^,]+)$/, " y $1");

// Medida de un ángulo de la clase k; "near" lo acerca a 90° (hay que leerla).
function measure(k, near) {
  if (k === "recto") return 90;
  if (k === "llano") return 180;
  if (k === "agudo") return near ? randInt(80, 88) : 5 * randInt(4, 14);
  return near ? randInt(92, 100) : 5 * randInt(22, 32);
}

// Coloca el ángulo en la celda: lado 1 hacia "rot", lado 2 girado "a" grados
// en sentido antihorario; los lados se alargan todo lo que quepa (≤ 72).
function place(a, CW) {
  for (;;) {
    const rot = 5 * randInt(0, 71), d1 = dir(rot), d2 = dir(rot + a), mb = dir(rot + a / 2);
    const pts = [[0, 0], d1, d2, [mb[0] * 0.6, mb[1] * 0.6]];
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
    const L = Math.min(72, (CW - 2 * MG) / bw, (CH - 2 * MG) / Math.max(bh, 0.01));
    if (L < 42) continue;
    const V = [r1(CW / 2 - L * (Math.min(...xs) + bw / 2)), r1(CH / 2 - L * (Math.min(...ys) + bh / 2))];
    return { rot, V, L: r1(L), w: CW };
  }
}

// Niveles: 0 agudos/rectos/obtusos · 1 con llanos · 2 con la medida
// escrita (algunos casi rectos: hay que leerla) · 3 contar con el teclado.
export function buildRound(level) {
  // Más agudos y obtusos que rectos y llanos (si no, sobran esquinas iguales).
  const kinds = level === 0 ? ["agudo", "agudo", "obtuso", "obtuso", "recto"] : ["agudo", "agudo", "obtuso", "obtuso", "recto", "llano"];
  const askKinds = level === 2 ? ["agudo", "obtuso", "recto"] : [...new Set(kinds)];
  for (;;) {
    const ask = pick(askKinds);
    const angles = Array.from({ length: 6 }, () => {
      const k = pick(kinds), a = measure(k, level === 2 && Math.random() < 0.5);
      return { a, kind: kindOf(a), ...place(a, level === 3 ? 120 : 160) };
    });
    const n = angles.filter((x) => x.kind === ask).length;
    if (n < 1 || n > (level === 3 ? 5 : 4)) continue;
    const vals = angles.filter((x) => x.kind === ask).map((x) => `${x.a}°`);
    const hint = `${DEF[ask]}. Había ${n}${ask === "agudo" || ask === "obtuso" ? `: ${list(vals)}` : ""}.`;
    const prompt = level === 3 ? `¿Cuántos ángulos <b>${PL[ask]}</b> hay?` : `Toca TODOS los <b>${PL[ask]}</b>`;
    return { level, ask, angles, n, count: level === 3, written: level === 2, prompt, hint };
  }
}

function drawAngle(x, written) {
  const { V, L, rot, a } = x, d1 = dir(rot), d2 = dir(rot + a), mb = dir(rot + a / 2);
  const P = (d, r) => [r1(V[0] + d[0] * r), r1(V[1] + d[1] * r)];
  const A1 = P(d1, 18), A2 = P(d2, 18), T = P(mb, a < 45 ? 44 : a > 150 ? 28 : 34);
  // Esquina del recto sobre el lado 1 (se ve al corregir).
  const e = dir(rot + 90), C1 = P(d1, 0.75 * L), C2 = P(e, 0.75 * L), S1 = P(d1, 10), S2 = P(e, 10), S3 = [r1(S1[0] + e[0] * 10), r1(S1[1] + e[1] * 10)];
  return `<g class="at-recto"><path d="M ${C1} L ${V} L ${C2}"/><path d="M ${S1} L ${S3} L ${S2}"/></g>
    <path class="at-arc" d="M ${A1} A 18 18 0 ${a > 180 ? 1 : 0} 0 ${A2}"/>
    <line class="at-ray" x1="${V[0]}" y1="${V[1]}" x2="${P(d1, L)[0]}" y2="${P(d1, L)[1]}"/>
    <line class="at-ray" x1="${V[0]}" y1="${V[1]}" x2="${P(d2, L)[0]}" y2="${P(d2, L)[1]}"/>
    <circle class="at-vertex" cx="${V[0]}" cy="${V[1]}" r="3"/>
    <text class="at-val${written ? "" : " at-late"}" x="${T[0]}" y="${T[1] + 4}">${a}°</text>`;
}

export function mountAngulostipoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, picked, busy, typed;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body at-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 2)));
    picked = new Set();
    busy = false;
    typed = "";
    body.innerHTML = `
      <p class="prompt at-prompt">${round.prompt}</p>
      <div class="at-grid${round.count ? " at-small" : ""}">${round.angles.map((x, i) => `<button type="button" class="at-cell" data-cell="${i}"${round.count ? " disabled" : ""}><svg viewBox="0 0 ${x.w} ${CH}">${drawAngle(x, round.written)}</svg><span class="at-cap"></span></button>`).join("")}</div>
      ${round.count
        ? `<div class="at-cuaderno at-q">Hay <button type="button" class="at-slot active" data-slot></button> ${PL[round.ask]}</div><div class="keypad at-keypad" data-keypad></div>`
        : `<button type="button" class="primary at-check" data-check>✓ Comprobar</button>`}
      <div class="feedback at-feedback" data-feedback></div>
      <button type="button" class="secondary at-next" data-next hidden>Siguiente →</button>
    `;
    body.querySelector("[data-next]").addEventListener("click", advance);
    if (round.count) {
      const pad = body.querySelector("[data-keypad]");
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
        btn.textContent = key;
        btn.addEventListener("click", () => pressKey(key));
        pad.appendChild(btn);
      });
      return;
    }
    body.querySelectorAll("[data-cell]").forEach((b) => b.addEventListener("click", () => {
      if (busy) return;
      const i = +b.dataset.cell;
      picked.has(i) ? picked.delete(i) : picked.add(i);
      b.classList.toggle("on", picked.has(i));
    }));
    body.querySelector("[data-check]").addEventListener("click", check);
  }

  function pressKey(key) {
    if (finished || busy || !round.count) return;
    if (key === "✓") return check();
    typed = key === "⌫" ? "" : key; // una sola cifra: de 0 a 6
    body.querySelector("[data-slot]").textContent = typed;
  }

  // Corrección: esquina del recto y medida en todos; marcas verde/rojo.
  function reveal() {
    body.querySelector(".at-grid").classList.add("at-done");
    body.querySelectorAll("[data-cell]").forEach((b) => {
      const x = round.angles[+b.dataset.cell], on = picked.has(+b.dataset.cell), t = x.kind === round.ask;
      b.querySelector(".at-cap").textContent = x.kind;
      if (round.count) b.classList.add(t ? "good" : "plain");
      else if (t && !on) b.classList.add("miss");
      else if (!t && on) b.classList.add("bad");
      else if (t) b.classList.add("good");
    });
  }

  function check() {
    if (finished || busy) return;
    const feedback = body.querySelector("[data-feedback]");
    if (round.count ? typed === "" : picked.size === 0) {
      feedback.textContent = round.count ? "Escribe cuántos hay" : "Toca al menos un ángulo";
      feedback.className = "feedback at-feedback bad";
      return;
    }
    busy = true;
    rounds++;
    reveal();
    let ok, why = "";
    if (round.count) {
      ok = Number(typed) === round.n;
      const slot = body.querySelector("[data-slot]");
      slot.classList.remove("active");
      slot.classList.add(ok ? "good" : "bad");
      if (!ok) { slot.innerHTML = `<s>${typed}</s>`; slot.insertAdjacentHTML("afterend", `<span class="at-fix">${round.n}</span>`); }
    } else {
      const miss = round.angles.filter((x, i) => x.kind === round.ask && !picked.has(i)).length;
      const extra = round.angles.filter((x, i) => x.kind !== round.ask && picked.has(i)).length;
      ok = !miss && !extra;
      why = [miss && `falta${miss > 1 ? "n" : ""} ${miss}`, extra && `sobra${extra > 1 ? "n" : ""} ${extra}`].filter(Boolean).join(" y ");
      body.querySelector("[data-check]").disabled = true;
    }
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback at-feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `✗ ${why || `Era${round.n === 1 ? "" : "n"} ${round.n}`}. 💡 ${round.hint}`;
      feedback.className = "feedback at-feedback bad";
      body.querySelector("[data-next]").hidden = false;
      pending = setTimeout(advance, 2500);
    }
  }

  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
  }

  function onKey(e) {
    if (finished || !round || busy) return;
    if (round.count && /^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (round.count && e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") check();
  }
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "angulostipo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📐</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} aciertos de ${rounds}</p>
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
