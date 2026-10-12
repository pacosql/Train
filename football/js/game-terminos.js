// "Los nombres de las cuentas": una cuenta escrita como en el cuaderno
// (suma y resta en columna, multiplicación en línea, división en su caja
// española, fracción con su raya) y una orden: "Toca el sustraendo". Se
// toca el número. Al responder aparecen los nombres de todos los términos
// y el 💡: "En la resta: minuendo − sustraendo = diferencia: 52 − 17 = 35".
// Al final la caja va completa (restos parciales y cifras bajadas) y se
// pide por lo que significa: "Toca el resultado de la división".
import { randInt, pick, saveScore } from "./utils.js";

const ROLES = {
  suma: ["sumando", "sumando", "suma"],
  resta: ["minuendo", "sustraendo", "diferencia"],
  mult: ["factor", "factor", "producto"],
  div: ["dividendo", "divisor", "cociente", "resto"],
  frac: ["numerador", "denominador"],
};
// Órdenes por el nombre del término…
const BYNAME = { sumando: "Toca un sumando", suma: "Toca la suma (el total)", minuendo: "Toca el minuendo", sustraendo: "Toca el sustraendo", diferencia: "Toca la diferencia", factor: "Toca un factor", producto: "Toca el producto", dividendo: "Toca el dividendo", divisor: "Toca el divisor", cociente: "Toca el cociente", resto: "Toca el resto", numerador: "Toca el numerador", denominador: "Toca el denominador" };
// …y por lo que significa (último nivel).
const BYMEANING = { suma: "Toca el resultado de la suma", diferencia: "Toca el resultado de la resta", sustraendo: "Toca el número que se quita", producto: "Toca el resultado de la multiplicación", cociente: "Toca el resultado de la división", resto: "Toca lo que sobra en la división", dividendo: "Toca el número que se reparte", divisor: "Toca entre cuántos se reparte", denominador: "Toca en cuántas partes se parte", numerador: "Toca cuántas partes se cogen" };

// Pasos de la división española (como en "La caja de dividir").
export function divide(digits, d) {
  let end = 0, val = digits[0];
  while (val < d) val = val * 10 + digits[++end];
  const steps = [];
  for (;;) {
    const q = Math.floor(val / d), rem = val - q * d;
    steps.push({ end, q, rem });
    if (end === digits.length - 1) return steps;
    val = rem * 10 + digits[++end];
  }
}

const distinct = (arr) => new Set(arr).size === arr.length;

function makeOp(op, full) {
  for (;;) {
    let nums, rows = null;
    if (op === "suma") { const a = randInt(12, 89), b = randInt(12, 89); nums = [a, b, a + b]; }
    else if (op === "resta") { const a = randInt(31, 99), b = randInt(11, a - 11); nums = [a, b, a - b]; }
    else if (op === "mult") { const a = randInt(2, 9), b = randInt(2, 9); nums = [a, b, a * b]; }
    else if (op === "frac") { const b = randInt(3, 12); nums = [randInt(1, b - 1), b]; }
    else if (!full) { const d = randInt(2, 9), q = randInt(2, 9), r = randInt(1, d - 1); nums = [d * q + r, d, q, r]; }
    else {
      const d = randInt(2, 9), D = randInt(100, 999), digits = String(D).split("").map(Number);
      const st = divide(digits, d);
      if (st.length < 2 || st[st.length - 1].rem === 0) continue;
      nums = [D, d, +st.map((s) => s.q).join(""), st[st.length - 1].rem];
      // Filas bajo el dividendo: resto parcial + cifra bajada; la última, el resto.
      rows = st.map((s, k) => (k < st.length - 1 ? { txt: String(s.rem) + digits[s.end + 1], endCol: s.end + 1 } : { txt: String(s.rem), endCol: s.end }));
    }
    if (op !== "mult" && op !== "frac" && !distinct(nums)) continue;
    if (op === "mult" && nums[0] === nums[1]) continue;
    if (op === "div" && nums[0] < 10) continue;
    return { op, nums, rows };
  }
}

// Niveles: 0 suma y resta · 1 multiplicación · 2 división en la caja ·
// 3 fracción (y repaso) · 4 caja completa y órdenes por el significado.
export function buildRound(level) {
  let op, full = false, meaning = false;
  if (level === 0) op = pick(["suma", "resta"]);
  else if (level === 1) op = Math.random() < 0.7 ? "mult" : pick(["suma", "resta"]);
  else if (level === 2) op = "div";
  else if (level === 3) op = Math.random() < 0.6 ? "frac" : pick(["suma", "resta", "mult", "div"]);
  else { op = Math.random() < 0.6 ? "div" : pick(["suma", "resta", "mult", "frac"]); full = op === "div"; meaning = Math.random() < 0.6; }
  const { nums, rows } = makeOp(op, full);
  const roles = ROLES[op];
  let ask = pick([...new Set(roles)]);
  if (meaning) ask = pick([...new Set(roles)].filter((r) => BYMEANING[r]));
  const prompt = meaning ? BYMEANING[ask] : BYNAME[ask];
  const [a, b, c, r] = nums;
  const name = ask === "sumando" || ask === "factor" ? `Los ${ask === "factor" ? "factores" : "sumandos"} son ${a} y ${b}` : `${ask[0].toUpperCase() + ask.slice(1)}: ${nums[roles.indexOf(ask)]}`;
  const rule = {
    suma: `En la suma: sumando + sumando = suma (o total): ${a} + ${b} = ${c}`,
    resta: `En la resta: minuendo − sustraendo = diferencia: ${a} − ${b} = ${c}`,
    mult: `En la multiplicación: factor × factor = producto: ${a} × ${b} = ${c}`,
    div: `En la división: dividendo : divisor = cociente y lo que sobra es el resto: ${a} : ${b} = ${c} y ${r === 1 ? "sobra" : "sobran"} ${r} (${b} × ${c} + ${r} = ${a})`,
    frac: `El denominador (abajo) dice en cuántas partes iguales se parte; el numerador (arriba), cuántas se cogen: ${a}/${b}`,
  }[op];
  return { op, full, nums, rows, roles, ask, prompt, hint: `${name}. ${rule}` };
}

export function mountTerminosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body tm-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  // Un número que se puede tocar, con su nombre (oculto hasta responder).
  const term = (txt, role, extra = "") => `<span class="tm-term${extra}"><button type="button" class="tm-num" data-role="${role}">${txt}</button><small class="tm-lab">${role}</small></span>`;

  function drawOp() {
    const { op, nums, rows, roles } = round;
    if (op === "suma" || op === "resta") {
      const sign = op === "suma" ? "+" : "−";
      return `<div class="tm-cuaderno tm-col">
        <div class="tm-crow"><span class="tm-sign"></span>${term(nums[0], roles[0], " tm-side")}</div>
        <div class="tm-crow tm-under"><span class="tm-sign">${sign}</span>${term(nums[1], roles[1], " tm-side")}</div>
        <div class="tm-crow"><span class="tm-sign"></span>${term(nums[2], roles[2], " tm-side")}</div></div>`;
    }
    if (op === "mult") return `<div class="tm-cuaderno tm-lin">${term(nums[0], roles[0])}<span>×</span>${term(nums[1], roles[1])}<span>=</span>${term(nums[2], roles[2])}</div>`;
    if (op === "frac") {
      const [a, b] = nums, w = 240;
      const cells = Array.from({ length: b }, (_, i) => `<rect class="${i < a ? "tm-on" : "tm-off"}" x="${(i * w) / b}" y="0" width="${w / b}" height="26"/>`).join("");
      return `<div class="tm-cuaderno tm-fracbox"><div class="tm-frac">${term(a, roles[0], " tm-side")}${term(b, roles[1], " tm-side")}</div>
        <svg class="tm-bar" viewBox="-2 -2 ${w + 4} 30">${cells}</svg></div>`;
    }
    // División en la caja: dividendo y, debajo, las filas (o solo el resto).
    const [D, d, q, r] = nums, n = String(D).length;
    const below = rows || [{ txt: String(r), endCol: n - 1 }];
    const left = below.map((w, k) => {
      const pad = `padding-left:${w.endCol - w.txt.length + 1}ch`;
      return `<div class="tm-drow" style="${pad}">${k === below.length - 1 ? term(w.txt, "resto", " tm-low") : `<button type="button" class="tm-num tm-part" data-role="parcial">${w.txt}</button>`}</div>`;
    }).join("");
    return `<div class="tm-cuaderno tm-caja">
      <div class="tm-left"><div class="tm-drow">${term(D, "dividendo", " tm-top tm-l")}</div>${left}</div>
      <div class="tm-right"><div class="tm-dv">${term(d, "divisor", " tm-top tm-r")}</div><div class="tm-cc">${term(q, "cociente", " tm-low")}</div></div></div>`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    busy = false;
    body.innerHTML = `
      <p class="prompt tm-prompt">${round.prompt}</p>
      <div class="tm-stage" data-stage>${drawOp()}</div>
      <div class="feedback tm-feedback" data-feedback></div>
    `;
    body.querySelectorAll(".tm-num").forEach((b) => b.addEventListener("click", () => answer(b)));
  }

  function answer(btn) {
    if (finished || busy) return;
    busy = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    const ok = btn.dataset.role === round.ask;
    btn.classList.add(ok ? "good" : "bad");
    body.querySelectorAll(`.tm-num[data-role="${round.ask}"]`).forEach((b) => b !== btn && !ok && b.classList.add("tm-want"));
    body.querySelector("[data-stage]").classList.add("tm-show");
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok tm-feedback";
      pending = setTimeout(nextRound, 1100);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Ese es ${btn.dataset.role === "parcial" ? "un resto parcial" : `el ${btn.dataset.role}`}. 💡 ${round.hint} <button type="button" class="tm-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad tm-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 3000);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "terminos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🏷️</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} términos acertados de ${rounds}</p>
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
  };
}
