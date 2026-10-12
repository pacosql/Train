// "Elementos del círculo": una circunferencia con sus elementos dibujados
// sin nombre (centro, radio, diámetro, cuerda, arco, tangente, secante,
// sector y segmento circular) y "Toca el radio". Al tocar, el elemento se
// ilumina, se escribe su nombre y el 💡 lo define como en el libro. Desde
// el último nivel se alternan rondas de cálculo r ↔ d con casilla y
// teclado sobre papel cuadriculado.
import { randInt, pick, saveScore } from "./utils.js";

const W = 340, H = 260, CX = 170, CY = 130, R = 100;
const NAME = {
  centro: "el centro", radio: "el radio", diametro: "el diámetro", cuerda: "la cuerda", arco: "el arco",
  tangente: "la tangente", secante: "la secante", sector: "el sector circular", segmento: "el segmento circular",
};
const DEF = {
  centro: "El centro es el punto que está a la misma distancia de todos los puntos de la circunferencia",
  radio: "El radio va del centro a la circunferencia; mide la mitad del diámetro",
  diametro: "El diámetro une dos puntos de la circunferencia pasando por el centro; mide dos radios",
  cuerda: "La cuerda une dos puntos de la circunferencia sin pasar por el centro",
  arco: "El arco es un trozo de la circunferencia entre dos puntos",
  tangente: "La tangente toca la circunferencia en un solo punto, sin entrar",
  secante: "La secante corta la circunferencia en dos puntos y sigue por fuera",
  sector: "El sector circular es la parte del círculo entre dos radios y su arco (como un trozo de pizza)",
  segmento: "El segmento circular es la parte del círculo entre una cuerda y su arco",
};
// Disposición de cada nivel en ángulos "canónicos" (grados, 0 = derecha,
// sentido antihorario). Cada ronda gira y quizá refleja el conjunto; los
// huecos entre elementos (≥ 20°) mantienen separadas las zonas tocables.
const LAYOUTS = [
  { diametro: 20, radio: 110, centro: 0 },
  { diametro: 20, radio: 110, cuerda: [235, 315], arco: [130, 175], centro: 0 },
  { diametro: 160, radio: 95, tangente: 40, secante: [270, 310], cuerda: [190, 245], centro: 0 },
  { sector: [25, 100], segmento: [195, 275], tangente: 150, secante: [300, 345], centro: 0 },
];
const ASK = [
  ["radio", "diametro", "centro"],
  ["cuerda", "arco", "cuerda", "arco", "radio", "diametro"],
  ["tangente", "secante", "tangente", "secante", "cuerda", "diametro"],
  ["sector", "segmento", "sector", "segmento", "tangente", "secante"],
];
const r1 = (v) => Math.round(v * 10) / 10;
const pt = (deg, r = R) => [r1(CX + r * Math.cos((deg * Math.PI) / 180)), r1(CY - r * Math.sin((deg * Math.PI) / 180))];
const arcD = (a, b) => `${pt(a)} A ${R} ${R} 0 0 0 ${pt(b)}`;

// Geometría de cada elemento ya girado: líneas [p, q], arcos y zonas como path.
function shapeOf(kind, v, map) {
  const span = () => { let [a, b] = v.map(map); if (map(1) < map(0)) [a, b] = [b, a]; return [a, b]; };
  if (kind === "centro") return { type: "pt", p: [CX, CY], lab: [CX + 16, CY + 20] };
  if (kind === "radio") return { type: "line", p: [CX, CY], q: pt(map(v)), lab: pt(map(v) + 13, 58) };
  if (kind === "diametro") return { type: "line", p: pt(map(v)), q: pt(map(v) + 180), lab: pt(map(v) + 14, 64) };
  if (kind === "cuerda") { const [a, b] = span(); return { type: "line", p: pt(a), q: pt(b), lab: pt((a + b) / 2, R * Math.cos(((b - a) * Math.PI) / 360) - 16) }; }
  if (kind === "tangente") {
    const a = (map(v) * Math.PI) / 180, T = pt(map(v)), u = [Math.sin(a) * 62, Math.cos(a) * 62];
    return { type: "line", p: [r1(T[0] - u[0]), r1(T[1] - u[1])], q: [r1(T[0] + u[0]), r1(T[1] + u[1])], lab: pt(map(v), R + 18) };
  }
  if (kind === "secante") {
    const [a, b] = span(), A = pt(a), B = pt(b), L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const d = [((B[0] - A[0]) / L) * 38, ((B[1] - A[1]) / L) * 38];
    return { type: "line", p: [r1(A[0] - d[0]), r1(A[1] - d[1])], q: [r1(B[0] + d[0]), r1(B[1] + d[1])], lab: pt((a + b) / 2, R * Math.cos(((b - a) * Math.PI) / 360) - 16) };
  }
  const [a, b] = span();
  if (kind === "arco") return { type: "arc", d: `M ${arcD(a, b)}`, lab: pt((a + b) / 2, R + 18) };
  if (kind === "sector") return { type: "zone", d: `M ${CX},${CY} L ${arcD(a, b)} Z`, lab: pt((a + b) / 2, R * 0.62) };
  return { type: "zone", d: `M ${arcD(a, b)} Z`, lab: pt((a + b) / 2, R * 0.88) };
}

// Niveles: 0 radio/diámetro/centro · 1 cuerda y arco · 2 tangente y
// secante · 3 sector y segmento · 4 alterna cálculo r ↔ d y toques.
export function buildRound(level, roundNo = 0) {
  if (level >= 4 && roundNo % 2 === 0) {
    const toD = Math.random() < 0.5;
    const r = randInt(2, 25), d = 2 * r;
    return toD
      ? { kind: "calc", given: "r", value: r, answer: d, rot: randInt(0, 359), prompt: `El radio mide ${r} cm. ¿Y el diámetro?`, hint: `El diámetro son dos radios: ${r} + ${r} = ${d} cm` }
      : { kind: "calc", given: "d", value: d, answer: r, rot: randInt(0, 359), prompt: `El diámetro mide ${d} cm. ¿Y el radio?`, hint: `El radio es la mitad del diámetro: ${d} : 2 = ${r} cm` };
  }
  const li = level >= 4 ? randInt(1, 3) : level;
  const rot = randInt(0, 359), m = Math.random() < 0.5 ? 1 : -1;
  const map = (a) => rot + m * a;
  const shapes = Object.entries(LAYOUTS[li]).map(([k, v]) => ({ kind: k, ...shapeOf(k, v, map) }));
  const ask = pick(ASK[li]);
  return { kind: "tap", layout: li, shapes, ask, prompt: `Toca ${NAME[ask]}`, hint: DEF[ask] };
}

export function mountElementoscirculoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, busy, typed;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body el-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function figure(s, i) {
    const vis = s.type === "pt" ? `<circle class="el-dot" cx="${s.p[0]}" cy="${s.p[1]}" r="4.5"/>`
      : s.type === "line" ? `<line class="el-line" x1="${s.p[0]}" y1="${s.p[1]}" x2="${s.q[0]}" y2="${s.q[1]}"/>`
      : `<path class="${s.type === "arc" ? "el-line el-thick" : "el-zone"}" d="${s.d}"/>`;
    const hit = s.type === "pt" ? `<circle class="el-hitpt" cx="${s.p[0]}" cy="${s.p[1]}" r="17"/>`
      : s.type === "line" ? `<line class="el-hit" x1="${s.p[0]}" y1="${s.p[1]}" x2="${s.q[0]}" y2="${s.q[1]}"/>`
      : s.type === "arc" ? `<path class="el-hit" d="${s.d}"/>` : "";
    return `<g class="el-pick el-${s.type}" data-pick="${i}">${hit}${vis}</g>`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)), rounds);
    busy = false;
    typed = "";
    let svg;
    if (round.kind === "tap") {
      // Zonas debajo, luego la circunferencia, las líneas y el centro encima.
      const order = round.shapes.map((s, i) => [s, i]);
      const zones = order.filter(([s]) => s.type === "zone"), rest = order.filter(([s]) => s.type !== "zone");
      svg = `${zones.map(([s, i]) => figure(s, i)).join("")}<circle class="el-circ" cx="${CX}" cy="${CY}" r="${R}"/>${rest.map(([s, i]) => figure(s, i)).join("")}<g data-names></g>`;
    } else {
      // Cálculo: diámetro y un radio dibujados; el dato conocido escrito, el otro con "?".
      const a = round.rot, P = pt(a), Q = pt(a + 180), S = pt(a + 100);
      const lab = (p, t, cls) => `<text class="el-measure ${cls}" x="${p[0]}" y="${p[1]}">${t}</text>`;
      const dTxt = round.given === "d" ? `${round.value} cm` : "?", rTxt = round.given === "r" ? `${round.value} cm` : "?";
      svg = `<circle class="el-circ" cx="${CX}" cy="${CY}" r="${R}"/>
        <line class="el-line el-dline" x1="${P[0]}" y1="${P[1]}" x2="${Q[0]}" y2="${Q[1]}"/>
        <line class="el-line el-rline" x1="${CX}" y1="${CY}" x2="${S[0]}" y2="${S[1]}"/>
        <circle class="el-dot" cx="${CX}" cy="${CY}" r="4.5"/>
        ${lab(pt(a + 16, 55), `d = ${dTxt}`, round.given === "d" ? "" : "el-ask")}
        ${lab(pt(a + 112, 58), `r = ${rTxt}`, round.given === "r" ? "" : "el-ask")}`;
    }
    body.innerHTML = `
      <p class="prompt el-prompt">${round.prompt}</p>
      <svg class="el-svg" viewBox="0 0 ${W} ${H}" data-svg>${svg}</svg>
      ${round.kind === "calc" ? `<div class="el-cuaderno el-q">${round.given === "r" ? "d" : "r"} = <button type="button" class="el-slot active" data-slot></button> cm</div><div class="keypad el-keypad" data-keypad></div>` : ""}
      <div class="feedback el-feedback" data-feedback></div>
      <button type="button" class="secondary el-next" data-next hidden>Siguiente →</button>
    `;
    body.querySelector("[data-next]").addEventListener("click", advance);
    if (round.kind === "tap") {
      body.querySelectorAll("[data-pick]").forEach((g) => g.addEventListener("click", () => tap(+g.dataset.pick)));
    } else {
      const pad = body.querySelector("[data-keypad]");
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
        btn.textContent = key;
        btn.addEventListener("click", () => pressKey(key));
        pad.appendChild(btn);
      });
    }
  }

  // Nombre escrito junto al elemento (solo el tocado y el correcto).
  function name(i, cls) {
    const s = round.shapes[i];
    const label = NAME[s.kind].replace(/^(el|la) /, "").replace(" circular", "");
    body.querySelector("[data-names]").insertAdjacentHTML("beforeend", `<text class="el-name ${cls}" x="${s.lab[0]}" y="${s.lab[1] + 4}">${label}</text>`);
  }

  function tap(i) {
    if (finished || busy) return;
    const want = round.shapes.findIndex((s) => s.kind === round.ask);
    const pickEl = (k) => body.querySelector(`[data-pick="${k}"]`);
    pickEl(want).classList.add("good");
    name(want, "good");
    if (i === want) return resolve(true, `✓ 💡 ${round.hint}`);
    pickEl(i).classList.add("bad");
    name(i, "bad");
    resolve(false, `✗ Eso es ${NAME[round.shapes[i].kind]}. 💡 ${round.hint}`);
  }

  function pressKey(key) {
    if (finished || busy || round.kind !== "calc") return;
    if (key === "✓") return check();
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 3) typed += key;
    body.querySelector("[data-slot]").textContent = typed;
  }

  function check() {
    const slot = body.querySelector("[data-slot]");
    if (typed === "") {
      body.querySelector("[data-feedback]").textContent = "Escribe el número en la casilla";
      body.querySelector("[data-feedback]").className = "feedback el-feedback bad";
      return;
    }
    const ok = Number(typed) === round.answer;
    slot.classList.remove("active");
    slot.classList.add(ok ? "good" : "bad");
    if (!ok) slot.innerHTML = `<s>${typed}</s>`, slot.insertAdjacentHTML("afterend", `<span class="el-fix">${round.answer}</span>`);
    const ask = body.querySelector(".el-ask");
    if (ask) ask.textContent = ask.textContent.replace("?", `${round.answer} cm`);
    resolve(ok, ok ? `✓ 💡 ${round.hint}` : `✗ Era ${round.answer} cm. 💡 ${round.hint}`);
  }

  function resolve(ok, text) {
    busy = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = text;
    feedback.className = `feedback el-feedback ${ok ? "ok" : "bad"}`;
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
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
    if (finished || !round || round.kind !== "calc") return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  }
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "elementoscirculo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⭕</div>
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
