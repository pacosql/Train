// "Dictado de números": el número aparece escrito EN LETRAS («tres mil
// cuarenta») y hay que escribirlo con cifras en el teclado. Enseña a
// leer y escribir números (el error típico «tres mil cuarenta» → 300040)
// y, en el último nivel, decimales sencillos con la tecla «,».
import { randInt, saveScore } from "./utils.js";

const UNI = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce",
  "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte", "veintiuno",
  "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const DEC = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CEN = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos",
  "ochocientos", "novecientos"];

function hasta99(n) {
  if (n < 30) return UNI[n];
  const u = n % 10;
  return DEC[Math.floor(n / 10)] + (u ? ` y ${UNI[u]}` : "");
}
function hasta999(n) {
  if (n === 100) return "cien";
  const c = Math.floor(n / 100);
  const r = n % 100;
  return (c ? CEN[c] + (r ? " " : "") : "") + (r ? hasta99(r) : "");
}
// Número entero (0 … 1.000.000) en letras, en español correcto.
export function enLetras(n) {
  if (n === 0) return "cero";
  if (n === 1000000) return "un millón";
  const miles = Math.floor(n / 1000);
  const resto = n % 1000;
  const partes = [];
  if (miles === 1) partes.push("mil");
  // Delante de «mil» el uno se apocopa: veintiún mil, treinta y un mil.
  else if (miles > 1) partes.push(hasta999(miles).replace(/veintiuno$/, "veintiún").replace(/uno$/, "un") + " mil");
  if (resto) partes.push(hasta999(resto));
  return partes.join(" ");
}
// 3040 → "3.040" (puntos de miles, como en clase).
export function fmt(n) {
  return String(n).replace(/\B(?=(\d{3})+$)/g, ".");
}
// 💡 descompone el número con los mismos bloques que las palabras:
// «tres mil cuarenta» → "3 mil + 40 = 3.040".
export function hintFor(n) {
  const parts = [];
  if (n >= 1000000) parts.push("1 millón");
  const miles = Math.floor((n % 1000000) / 1000);
  if (miles) parts.push(`${miles} mil`);
  const r = n % 1000;
  if (r >= 100) parts.push(String(Math.floor(r / 100) * 100));
  const d = r % 100;
  if (d >= 10) parts.push(String(Math.floor(d / 10) * 10));
  if (d % 10) parts.push(String(d % 10));
  if (parts.length === 1) return `«${enLetras(n)}» se escribe ${fmt(n)} (${String(n).length} cifra${n > 9 ? "s" : ""})`;
  return `${parts.join(" + ")} = ${fmt(n)}`;
}

// Nivel → rango. Los números suben y en el último nivel llegan los decimales.
export function buildRound(stage) {
  if (stage >= 5) {
    const ent = randInt(0, 99);
    const dec = randInt(1, 9);
    return {
      value: ent + dec / 10, decimal: true, answer: `${ent},${dec}`,
      text: `${enLetras(ent)} coma ${enLetras(dec)}`,
      hint: `${ent} enteros y ${dec} décima${dec > 1 ? "s" : ""}: la coma separa → ${ent},${dec}`,
    };
  }
  let n;
  if (stage === 0) n = randInt(1, 100);
  else if (stage === 1) n = randInt(101, 1000);
  else if (stage === 2) n = randInt(1, 9) * 1000 + (Math.random() < 0.6 ? randInt(1, 99) : randInt(1, 9) * 100 + randInt(1, 9));
  else if (stage === 3) n = randInt(1001, 100000);
  else n = Math.random() < 0.08 ? 1000000 : randInt(100001, 999999);
  return { value: n, decimal: false, answer: fmt(n), text: enLetras(n), hint: hintFor(n) };
}

export function mountDictadoGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let busy = false;
  let round = null;
  let typed = "";
  let pending = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body dc-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const stage = () => Math.min(Math.floor(level / 3), 5);

  function nextRound() {
    round = buildRound(stage());
    typed = "";
    busy = false;
    body.innerHTML = `
      <p class="prompt dc-words" data-words>${round.text}</p>
      <div class="keypad-display dc-display" data-display>&nbsp;</div>
      <div class="keypad dc-pad" data-keypad></div>
      <div class="feedback dc-feedback" data-feedback></div>
    `;
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn keypad-key" + (key === "✓" ? " primary dc-ok" : "");
      btn.textContent = key;
      btn.dataset.key = key;
      if (key === "," && !round.decimal) btn.disabled = true; // la coma solo cuenta con decimales
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return submit();
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (key === ",") {
      if (!round.decimal || typed.includes(",")) return;
      typed = (typed || "0") + ",";
    } else if (typed.replace(",", "").length < 7) typed += key;
    showTyped();
  }
  // Mientras se escribe se ven los puntos de miles: 3040 → 3.040.
  function showTyped() {
    const [ent, dec] = typed.split(",");
    const txt = fmt(ent) + (typed.includes(",") ? `,${dec}` : "");
    body.querySelector("[data-display]").textContent = txt || " ";
  }

  function submit() {
    if (typed === "" || typed.endsWith(",")) return;
    rounds++;
    busy = true;
    const value = Number(typed.replace(",", "."));
    const ok = Math.abs(value - round.value) < 1e-9;
    const fb = body.querySelector("[data-feedback]");
    if (ok) {
      score += 10;
      level++;
      renderScore();
      fb.className = "feedback dc-feedback ok";
      fb.textContent = `¡Bien! 💡 ${round.hint}`;
      pending = setTimeout(nextRound, 900);
      return;
    }
    lives--;
    renderLives();
    const disp = body.querySelector("[data-display]");
    disp.innerHTML = `<s class="dc-wrong">${disp.textContent}</s> <span class="dc-good">${round.answer}</span>`;
    fb.className = "feedback dc-feedback bad";
    fb.textContent = `Era ${round.answer}. 💡 ${round.hint}`;
    pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
  }

  const onKey = (e) => {
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else if (e.key === "," || e.key === ".") pressKey(",");
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "dictado", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔢</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} números bien escritos de ${rounds}</p>
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
    level = 0;
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
