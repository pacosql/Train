// "Ángulos de un polígono": el polígono dibujado con las diagonales que
// salen de UN vértice (los triángulos sombreados) y la fórmula del libro
// con casillas: "Suma = (n − 2) · 180° = (□ − 2) · 180° = □ · 180° = □°".
// En el regular se sigue con "cada ángulo = □° ÷ □ = □°", y al final se
// pregunta al revés: "¿qué polígono regular tiene ángulos de 135°?" (por
// el ángulo exterior: 180 − 135 = 45 y 360 ÷ 45 = 8 lados).
// Cada casilla es un número entero: se toca, se escribe con el teclado y
// ✓ (o Enter) pasa a la siguiente; con todas llenas, ✓ corrige.
import { randInt, pick, saveScore } from "./utils.js";

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const NAMES = { 4: "cuadrilátero", 5: "pentágono", 6: "hexágono", 7: "heptágono", 8: "octógono", 9: "eneágono", 10: "decágono", 11: "endecágono", 12: "dodecágono" };
const nameOf = (n) => NAMES[n] || `polígono de ${n} lados`;
const W = 260, H = 172, CX = 130, CY = 88;

// Vértices: regular (en un círculo) o irregular pero convexo (en una
// elipse, con los ángulos algo movidos: siempre queda convexo).
function polygon(n, regular) {
  const step = (2 * Math.PI) / n;
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + step * i + (regular ? 0 : (Math.random() - 0.5) * 0.5 * step);
    const rx = regular ? 80 : 108, ry = regular ? 80 : 76;
    return [+(CX + rx * Math.cos(a)).toFixed(1), +(CY + ry * Math.sin(a)).toFixed(1)];
  });
}

// Niveles: 0 cuadrilátero y pentágono (suma) · 1 hexágono a decágono ·
// 2 ángulo del regular · 3 "¿qué polígono tiene ángulos de 135°?" · 4 mezcla.
export function buildRound(level) {
  let kind, n;
  if (level === 0) { kind = "suma"; n = pick([4, 5]); }
  else if (level === 1) { kind = "suma"; n = randInt(6, 10); }
  else if (level === 2) { kind = "regular"; n = pick([4, 5, 6, 8, 9, 10]); }
  else if (level === 3) { kind = "cual"; n = pick([5, 6, 8, 9, 10, 12]); }
  else { kind = pick(["suma", "regular", "cual"]); n = kind === "suma" ? randInt(7, 12) : pick([8, 9, 10, 12, 15, 18, 20]); }
  const tri = n - 2, sum = tri * 180, ang = sum / n, ext = 180 - ang;
  const S = (i) => ({ slot: i });
  let lines, want, prompt, hint;
  const parte = `Un ${nameOf(n)} se parte en ${tri} triángulos desde un vértice: ${tri} × 180 = ${fmt(sum)}°`;
  if (kind === "suma") {
    prompt = `¿Cuánto suman los ángulos de este ${nameOf(n)}?`;
    lines = [["Suma = (n − 2) · 180°"], ["= (", S(0), " − 2) · 180°"], ["= ", S(1), " · 180° = ", S(2), "°"]];
    want = [n, tri, sum];
    hint = parte;
  } else if (kind === "regular") {
    prompt = n > 12 ? `Polígono regular de ${n} lados: ¿cuánto mide cada ángulo?` : `¿Cuánto mide cada ángulo del ${nameOf(n)} regular?`;
    lines = [["Suma = (", S(0), " − 2) · 180° = ", S(1), "°"], ["Cada ángulo = ", S(2), "° ÷ ", S(3), " = ", S(4), "°"]];
    want = [n, sum, sum, n, ang];
    hint = `${parte}; en el regular los ${n} ángulos son iguales: ${fmt(sum)} ÷ ${n} = ${ang}°`;
  } else {
    prompt = `¿Qué polígono regular tiene ángulos de ${ang}°?`;
    lines = [[`Ángulo de fuera = 180° − ${ang}° = `, S(0), "°"], ["Lados = 360° ÷ ", S(1), "° = ", S(2)]];
    want = [ext, ext, n];
    hint = `A cada ángulo le faltan 180 − ${ang} = ${ext}° para ser llano, y los ángulos de fuera dan una vuelta entera: 360 ÷ ${ext} = ${n} lados (${nameOf(n)}). Prueba: (${n} − 2) · 180 = ${fmt(sum)} y ${fmt(sum)} ÷ ${n} = ${ang}°`;
  }
  const pts = polygon(n, kind !== "suma");
  return { kind, n, tri, sum, ang, ext, lines, want, prompt, hint, pts };
}

// SVG del polígono con los triángulos del abanico (numerados si `nums`).
function polySvg(pts, nums) {
  const P = (i) => pts[i].join(",");
  const tris = pts.slice(1, -1).map((_, k) => {
    const a = pts[0], b = pts[k + 1], c = pts[k + 2];
    const gx = (a[0] + b[0] + c[0]) / 3, gy = (a[1] + b[1] + c[1]) / 3;
    return `<polygon class="ai-t${k % 2}" points="${P(0)} ${P(k + 1)} ${P(k + 2)}"/>` + (nums ? `<text class="ai-tn" x="${gx}" y="${gy + 4}">${k + 1}</text>` : "");
  });
  const diags = pts.slice(2, -1).map((p) => `<line class="ai-diag" x1="${pts[0][0]}" y1="${pts[0][1]}" x2="${p[0]}" y2="${p[1]}"/>`);
  return `<svg class="ai-svg" viewBox="0 0 ${W} ${H}">${tris.join("")}${diags.join("")}<polygon class="ai-poly" points="${pts.map((p) => p.join(",")).join(" ")}"/><circle class="ai-v0" cx="${pts[0][0]}" cy="${pts[0][1]}" r="4.5"/></svg>`;
}

// SVG de un solo ángulo (para "¿qué polígono…?"): el de dentro con su
// medida y el de fuera (prolongando un lado) con un "?".
function angleSvg(ang) {
  const vx = 150, vy = 128, L = 100;
  const pt = (a, r) => [+(vx + r * Math.cos((a * Math.PI) / 180)).toFixed(1), +(vy - r * Math.sin((a * Math.PI) / 180)).toFixed(1)];
  const arc = (a1, a2, r) => `M${pt(a1, r)} A${r} ${r} 0 0 0 ${pt(a2, r)}`;
  const [ex, ey] = pt(ang, L), [ix, iy] = pt(ang / 2, 46), [qx, qy] = pt((ang + 180) / 2, 58);
  return `<svg class="ai-svg" viewBox="0 0 ${W} ${H}">
    <line class="ai-ext" x1="${vx}" y1="${vy}" x2="${vx - 125}" y2="${vy}"/>
    <path class="ai-arc" d="${arc(0, ang, 26)}"/><path class="ai-arc2" d="${arc(ang, 180, 38)}"/>
    <line class="ai-side" x1="${vx}" y1="${vy}" x2="${vx + L}" y2="${vy}"/><line class="ai-side" x1="${vx}" y1="${vy}" x2="${ex}" y2="${ey}"/>
    <text class="ai-al" x="${ix}" y="${iy + 5}">${ang}°</text><text class="ai-al ai-q" x="${qx}" y="${qy + 5}">?</text></svg>`;
}

export function mountAngulosinterioresGame(container, { client, onExit }) {
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
    <div class="game-body ai-body" data-body></div>
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
    else if (e.key === "Enter") { e.preventDefault(); pressKey("✓"); }
  };

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    typed = round.want.map(() => "");
    active = 0;
    busy = false;
    const line = (toks) => `<div class="ai-line">${toks.map((t) => (typeof t === "string" ? `<span>${t}</span>` : `<button type="button" class="ai-slot" data-slot="${t.slot}"></button>`)).join("")}</div>`;
    body.innerHTML = `
      <p class="prompt ai-prompt">${round.prompt}</p>
      <div class="ai-fig" data-fig>${round.kind === "cual" ? angleSvg(round.ang) : polySvg(round.pts, false)}</div>
      <div class="ai-cuaderno ai-formula">${round.lines.map(line).join("")}</div>
      <div class="keypad ai-keypad" data-keypad></div>
      <div class="feedback ai-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
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
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot;
      b.textContent = fmt(typed[k]);
      b.classList.toggle("active", k === active);
    });
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return advance();
    if (key === "⌫") {
      if (typed[active] === "" && active > 0) active--;
      else typed[active] = typed[active].slice(0, -1);
    } else if (typed[active].length < 4) typed[active] += key;
    paint();
  }

  // ✓: con la casilla escrita pasa al siguiente hueco; con todas, corrige.
  function advance() {
    const empty = typed.indexOf("");
    if (empty < 0) return check();
    if (typed[active] !== "") {
      const next = typed.findIndex((t, i) => i > active && t === "");
      active = next >= 0 ? next : empty;
      return paint();
    }
    active = empty;
    paint();
    const fb = body.querySelector("[data-feedback]");
    fb.textContent = "Faltan casillas por rellenar";
    fb.className = "feedback bad ai-feedback";
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot;
      const ok = Number(typed[k]) === round.want[k];
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${fmt(typed[k])}</s><i class="ai-fix">${fmt(round.want[k])}</i>`;
    });
    // Se dibuja (o se numera) la figura de verdad.
    const pts = round.kind === "cual" ? polygonOf(round.n) : round.pts;
    body.querySelector("[data-fig]").innerHTML = polySvg(pts, true);
    const r = round;
    const text = r.kind === "suma" ? `Suman ${fmt(r.sum)}°` : r.kind === "regular" ? `Cada ángulo mide ${r.ang}°` : `Es el ${nameOf(r.n)} regular (${r.n} lados)`;
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${text}. 💡 ${r.hint}`;
      feedback.className = "feedback ok ai-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `${text}. 💡 ${r.hint} <button type="button" class="ai-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad ai-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 3200);
    }
  }
  const polygonOf = (n) => polygon(n, true);

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "angulosinteriores", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📐</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} polígonos resueltos de ${rounds}</p>
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
