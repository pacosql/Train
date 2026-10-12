// "Decimales en columna": una suma o resta de decimales escrita en vertical
// como en el cuaderno, con las comas alineadas en su columna (la coma es
// una celda estrecha fija). Los huecos a la derecha de un número con menos
// decimales se ven como un "0" gris (3,5 → 3,50). Las casillas del
// resultado se rellenan de derecha a izquierda y su coma ya está puesta.
// Arriba, una fila de llevadas que es un bloc de notas. El 💡 narra la
// cuenta columna a columna con los números de la ronda.
import { randInt, saveScore } from "./utils.js";

const dig = (n, i) => Math.floor(n / 10 ** i) % 10;
const len = (n) => String(n).length;
// v en unidades de 10^-D → "3,50"
const fmtD = (v, D) => `${Math.floor(v / 10 ** D)},${String(v % 10 ** D).padStart(D, "0")}`;

// Un decimal al azar con `dec` cifras decimales (la última no es 0) y parte
// entera entre lo y hi; devuelve su valor en centésimas.
function rnd(dec, lo, hi) {
  const raw = randInt(lo * 10 ** dec, (hi + 1) * 10 ** dec - 1);
  return raw % 10 === 0 ? rnd(dec, lo, hi) : raw * 10 ** (2 - dec);
}

// Niveles: 0 décimas sin llevar · 1 centésimas con llevada · 2 restas ·
// 3 distinto número de decimales · 4 tres sumandos.
export function buildRound(level) {
  let op, decs, vals;
  for (;;) {
    op = level === 2 || (level === 3 && Math.random() < 0.5) ? "−" : "+";
    if (level === 0) decs = [1, 1];
    else if (level === 1) decs = [2, 2];
    else if (level === 2) decs = Math.random() < 0.5 ? [1, 1] : [2, 2];
    else if (level === 3) decs = Math.random() < 0.5 ? [1, 2] : [2, 1];
    else decs = [randInt(1, 2), randInt(1, 2), randInt(1, 2)];
    vals = decs.map((d) => rnd(d, level === 0 ? 1 : 0, level <= 1 ? 9 : 49));
    if (op === "−") {
      if (vals[0] <= vals[1]) continue;
    }
    if (decs.every((d) => d === decs[0]) && level >= 3) continue;
    const D = Math.max(...decs);
    const sc = vals.map((v) => v / 10 ** (2 - D)); // valores en la unidad más pequeña
    const carry = op === "+" && Array.from({ length: 6 }, (_, i) => sc.reduce((t, v) => t + dig(v, i), 0) >= 10).some(Boolean);
    if (level === 0 && carry) continue;
    if (level === 1 && !carry) continue;
    break;
  }
  const D = Math.max(...decs);
  const sc = vals.map((v) => v / 10 ** (2 - D));
  const result = op === "+" ? sc.reduce((t, v) => t + v, 0) : sc[0] - sc[1];
  const wInt = Math.max(...[...sc, result].map((v) => len(Math.floor(v / 10 ** D))));
  const w = wInt + D;
  // Narración de derecha a izquierda.
  const said = [];
  const intLens = sc.map((v) => len(Math.floor(v / 10 ** D)));
  let carryIn = 0;
  for (let i = 0; i < w; i++) {
    const present = intLens.map((L) => i < D + L); // ¿tiene cifra en esta columna?
    const lastCol = !intLens.some((L) => i + 1 < D + L);
    if (op === "+") {
      const ds = sc.filter((_, k) => present[k]).map((v) => dig(v, i));
      const s = ds.reduce((t, x) => t + x, 0) + carryIn;
      const expr = [...ds, ...(carryIn ? [carryIn] : [])].join(" + ");
      said.push(s >= 10 && !lastCol ? `${expr} = ${s}: escribo ${s % 10} y me llevo ${Math.floor(s / 10)}` : `${expr} = ${s}`);
      carryIn = Math.floor(s / 10);
      if (lastCol) break;
    } else {
      if (!present[0]) break;
      const t = dig(sc[0], i) - carryIn;
      const tShow = carryIn ? `(${dig(sc[0], i)} − 1)` : `${t}`;
      const b = present[1] ? dig(sc[1], i) : null;
      if (b === null) said.push(`queda ${t}`), (carryIn = 0);
      else if (t >= b) said.push(`${tShow} − ${b} = ${t - b}`), (carryIn = 0);
      else said.push(`${tShow} − ${b} no se puede: pido 1 → ${10 + t} − ${b} = ${10 + t - b}`), (carryIn = 1);
    }
  }
  const text = `${sc.map((v) => fmtD(v, D)).join(` ${op} `)} = ${fmtD(result, D)}`;
  const hint = `Alineo las comas; ${sc.map((v) => fmtD(v, D)).join(` ${op} `)}: ${said.join(", ")} → ${fmtD(result, D)}`;
  return { op, decs, D, sc, result, wInt, w, text, hint };
}

export function mountDecimalescolumnaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, carries, active, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body dl-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const onKey = (e) => {
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  };

  // Columnas de izquierda a derecha: c = 0..w-1; la coma va entre wInt-1 y wInt.
  const withComma = (cells, comma) => [...cells.slice(0, round.wInt), comma, ...cells.slice(round.wInt)];

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    const { w, wInt, D } = round;
    typed = Array(w).fill("");
    carries = Array(w).fill("");
    active = w - 1;
    busy = false;
    const numRow = (v, k) => {
      const intLen = len(Math.floor(v / 10 ** D));
      const cells = Array.from({ length: w }, (_, c) => {
        const i = w - 1 - c; // posición (0 = la cifra más a la derecha)
        if (i >= D && i - D >= intLen) return `<span class="dl-cell"></span>`;
        const ghost = i < D - round.decs[k]; // cero que no estaba escrito
        return `<span class="dl-cell dl-fixed${ghost ? " dl-ghost" : ""}">${dig(v, i)}</span>`;
      });
      const sign = k === round.sc.length - 1 ? round.op : "";
      return `<div class="dl-row"><span class="dl-sign">${sign}</span>${withComma(cells, `<span class="dl-comma">,</span>`).join("")}</div>`;
    };
    body.innerHTML = `
      <p class="prompt dl-prompt">${round.op === "+" ? "Suma" : "Resta"} con las comas en columna</p>
      <div class="dl-sheet dl-cuaderno" style="--dl-i:${wInt};--dl-d:${D}">
        <div class="dl-row dl-carries"><span class="dl-sign"></span>${withComma(
          carries.map((_, c) => `<button type="button" class="dl-carry" data-carry="${c}" title="llevada"></button>`),
          `<span class="dl-comma"></span>`
        ).join("")}</div>
        ${round.sc.map(numRow).join("")}
        <div class="dl-row dl-result"><span class="dl-sign"></span>${withComma(
          typed.map((_, c) => `<button type="button" class="dl-cell dl-slot" data-res="${c}"></button>`),
          `<span class="dl-comma dl-comma-res">,</span>`
        ).join("")}</div>
      </div>
      <div class="keypad dl-keypad" data-keypad></div>
      <div class="feedback dl-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-res]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.res), paint())));
    // Bloc de notas de llevadas: tocar alterna vacío → 1 → 2.
    body.querySelectorAll("[data-carry]").forEach((b) =>
      b.addEventListener("click", () => {
        if (busy) return;
        const c = +b.dataset.carry;
        carries[c] = carries[c] === "" ? "1" : carries[c] === "1" ? "2" : "";
        paint();
      })
    );
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
    body.querySelectorAll("[data-res]").forEach((b, i) => {
      if (!busy) b.textContent = typed[i];
      b.classList.toggle("active", !busy && i === active);
    });
    body.querySelectorAll("[data-carry]").forEach((b, i) => (b.textContent = carries[i]));
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    if (key === "⌫") {
      if (typed[active] === "" && active < round.w - 1) active++;
      typed[active] = "";
    } else {
      typed[active] = key;
      if (active > 0) active--;
    }
    paint();
  }

  // Cifra esperada en la columna c ("" si es un 0 a la izquierda, que no se escribe).
  const want = (c) => {
    const i = round.w - 1 - c;
    const d = dig(round.result, i);
    return i > round.D && Math.floor(round.result / 10 ** i) === 0 ? "" : String(d);
  };

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const units = round.wInt - 1;
    const first = typed.findIndex((t) => t !== "");
    // Solo se pueden dejar vacías casillas a la izquierda de las unidades.
    if (first === -1 || first > units || typed.slice(first).some((t) => t === "")) {
      active = typed.lastIndexOf("");
      paint();
      feedback.textContent = "Faltan casillas por rellenar";
      feedback.className = "feedback bad dl-feedback";
      return;
    }
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-res]").forEach((b, c) => {
      const ok = (typed[c] || "0") === (want(c) || "0");
      allOk = allOk && ok;
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[c] || "·"}</s><i class="dl-fix">${want(c) || "0"}</i>`;
    });
    paint();
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${round.text}. 💡 ${round.hint}`;
      feedback.className = "feedback ok dl-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Era ${round.text}. 💡 ${round.hint} <button type="button" class="dl-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad dl-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 2500);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "decimalescolumna", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🔢</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cuentas con decimales bien de ${rounds}</p>
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
