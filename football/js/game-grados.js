// "¿Cuántos grados?": se dibuja un ángulo (dos semirrectas y su arco) y se
// escribe la estimación con el teclado; vale si está dentro del margen
// (±10°, luego ±5°). Al responder se superpone un transportador y se ve
// el valor exacto. Aquí se LEE/ESTIMA un ángulo dado (en "Ajusta el
// ángulo" se coloca la aguja). Niveles: 45/90/135/180 → múltiplos de 10 →
// múltiplos de 5 (±5) → cóncavos (> 180). 5º-1º ESO.
import { randInt, pick, saveScore } from "./utils.js";

// Nivel → { deg, tol }. El 0° no se dibuja (las dos semirrectas coinciden).
export function buildRound(level) {
  if (level === 0) return { deg: pick([45, 90, 135, 180]), tol: 10 };
  if (level === 1) return { deg: randInt(2, 17) * 10, tol: 10 };
  if (level === 2) return { deg: randInt(3, 35) * 5, tol: 5 };
  return { deg: randInt(38, 68) * 5, tol: 10 }; // 190..340: la banda ±10 no llega a 360
}

// Referencias que un niño conoce: recto (90), llano (180), mitad de recto (45).
export function hintFor(deg) {
  if (deg === 90) return "Es un ángulo recto: justo 90°";
  if (deg === 180) return "Es un ángulo llano (una línea recta): 180°";
  if (deg === 45) return "Es justo la mitad de un recto (90°): 45°";
  if (deg < 45) return `Es menos que la mitad de un recto (45°): ${deg}°`;
  if (deg < 90) return `Es más que la mitad de un recto (45°) y menos que un recto (90°): ${deg}°`;
  if (deg < 180) return `Es más abierto que un recto (90°) y menos que llano (180°): ${deg}°`;
  if (deg === 270) return "Son tres rectos: 90 + 90 + 90 = 270°";
  return `Es cóncavo: más que un llano (180°). Le faltan ${360 - deg}° para la vuelta completa: 360 − ${360 - deg} = ${deg}°`;
}

const V = { x: 150, y: 128 }; // vértice en el SVG
const pt = (deg, r) => ({ x: V.x + r * Math.cos((deg * Math.PI) / 180), y: V.y - r * Math.sin((deg * Math.PI) / 180) });

function angleSvg(deg) {
  const a = pt(0, 118);
  const b = pt(deg, 118);
  const r = 36;
  const p0 = pt(0, r);
  const p1 = pt(deg, r);
  const arc = `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${deg > 180 ? 1 : 0} 0 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  const lab = pt(deg / 2, deg > 180 ? 64 : 58);
  return `
    <svg class="gr-svg" viewBox="0 0 300 250" data-svg>
      <g class="gr-prot" data-prot hidden></g>
      <path class="gr-arc" d="${arc}" />
      <line class="gr-ray" x1="${V.x}" y1="${V.y}" x2="${a.x}" y2="${a.y}" />
      <line class="gr-ray" x1="${V.x}" y1="${V.y}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}" />
      <circle class="gr-vertex" cx="${V.x}" cy="${V.y}" r="4" />
      <text class="gr-label" x="${lab.x.toFixed(1)}" y="${lab.y.toFixed(1)}" data-label hidden></text>
    </svg>`;
}

// Transportador: marcas cada 10° (grandes cada 30°) con sus números.
function protractorSvg(full) {
  const n = full ? 36 : 18;
  let s = "";
  for (let i = 0; i <= n; i++) {
    const d = i * 10;
    const o = pt(d, 112);
    const inn = pt(d, d % 30 === 0 ? 98 : 104);
    s += `<line x1="${o.x.toFixed(1)}" y1="${o.y.toFixed(1)}" x2="${inn.x.toFixed(1)}" y2="${inn.y.toFixed(1)}" />`;
    if (d % 30 === 0 && d < 360) {
      const t = pt(d, 88);
      s += `<text x="${t.x.toFixed(1)}" y="${(t.y + 3).toFixed(1)}">${d}</text>`;
    }
  }
  const e = pt(full ? 359.99 : 180, 112);
  return `<path d="M ${pt(0, 112).x} ${pt(0, 112).y} A 112 112 0 ${full ? 1 : 0} 0 ${e.x.toFixed(2)} ${e.y.toFixed(2)}" />${s}`;
}

export function mountGradosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let hits = 0;
  let finished = false;
  let busy = false;
  let pending = null;
  let round = null;
  let typed = "";

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body gr-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    round = buildRound(Math.min(3, Math.floor(hits / 3)));
    typed = "";
    busy = false;
    body.innerHTML = `
      <p class="prompt gr-prompt">¿Cuántos grados mide?<small>Estima: vale si te acercas a ±${round.tol}°</small></p>
      ${angleSvg(round.deg)}
      <div class="keypad-display gr-display" data-display>_°</div>
      <div class="keypad gr-keypad" data-keypad></div>
      <div class="feedback" data-feedback></div>
    `;
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
  }

  function pressKey(key) {
    if (busy || finished) return;
    if (key === "✓") return typed !== "" && check(Number(typed));
    if (key === "⌫") typed = typed.slice(0, -1);
    else if (typed.length < 3) typed += key;
    body.querySelector("[data-display]").textContent = `${typed || "_"}°`;
  }

  function check(value) {
    if (busy || finished) return;
    busy = true;
    rounds++;
    const ok = Math.abs(value - round.deg) <= round.tol;
    // Se superpone el transportador y se ve el valor exacto.
    const prot = body.querySelector("[data-prot]");
    prot.innerHTML = protractorSvg(round.deg > 180);
    prot.removeAttribute("hidden");
    const label = body.querySelector("[data-label]");
    label.textContent = `${round.deg}°`;
    label.removeAttribute("hidden");
    label.classList.toggle("good", !ok);
    const feedback = body.querySelector("[data-feedback]");
    const tip = `<span class="gr-tip">💡 ${hintFor(round.deg)}</span>`;
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `¡Bien! Has dicho ${value}° y mide ${round.deg}° ${tip}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
      return;
    }
    lives--;
    renderLives();
    feedback.innerHTML = `Era ${round.deg}°, has dicho ${value}° ${tip}`;
    feedback.className = "feedback bad";
    pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "grados", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📐</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} ángulos bien estimados</p>
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
