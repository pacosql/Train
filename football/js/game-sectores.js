// "Gráfico de sectores": la tabla del libro (Categoría | % | Grados) y el
// círculo del gráfico al lado. Se escriben los grados de cada fila
// (360 · 25 / 100 = 90°) y cada sector se va dibujando con el ángulo que
// se escribe, empezando arriba y en el sentido de las agujas del reloj;
// si los grados están mal, el círculo no cierra. Variante con frecuencias
// (5 de 20) y la inversa: se ve el sector con sus grados y se pide el %.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const THEMES = [
  ["Deporte favorito", ["Fútbol", "Baloncesto", "Natación", "Tenis"]],
  ["Mascotas de la clase", ["Perro", "Gato", "Pez", "Pájaro"]],
  ["Fruta favorita", ["Manzana", "Plátano", "Naranja", "Fresa"]],
  ["Cómo vienen al cole", ["Andando", "Autobús", "Coche", "Bici"]],
];
const NICE = { 50: "la mitad", 25: "la cuarta parte", 75: "las tres cuartas partes", 10: "la décima parte", 20: "la quinta parte" };
export const fmtDeg = (t) => (t % 10 === 0 ? String(t / 10) : `${Math.floor(t / 10)},${t % 10}`); // t en décimas de grado
const tenths = (s) => (/^\d*,?\d*$/.test(s) && /\d/.test(s) ? Math.round(Number(s.replace(",", ".")) * 10) : NaN);

// Reparte `total` en k partes, cada una múltiplo de `step` y ≥ min.
function parts(k, total, step, min) {
  let p;
  do {
    p = Array(k).fill(min);
    for (let left = total - k * min; left > 0; left -= step) p[randInt(0, k - 1)] += step;
  } while (new Set(p).size === 1 && k > 2);
  return p;
}

// Niveles: 0 50/25/10 % y parecidos · 1 cualquier % múltiplo de 5 ·
// 2 a partir de frecuencias (5 de 20) · 3 inversa: grados → % ·
// 4 cualquier % entero (grados con decimales) · 5 mezcla de 1-4.
export function buildRound(level) {
  if (level >= 5) level = pick([1, 2, 3, 4]);
  const [title, cats] = pick(THEMES);
  const k = level === 0 ? 3 : randInt(3, 4);
  let pct = null, freq = null, N = 100;
  if (level === 0) pct = shuffle(pick([[50, 25, 25], [50, 40, 10], [50, 30, 20], [40, 40, 20], [25, 25, 50], [60, 30, 10], [40, 30, 30], [50, 25, 25], [20, 30, 50]]));
  else if (level === 2) { N = pick([10, 12, 15, 18, 20, 24, 30, 36]); freq = parts(k, N, 1, 1); }
  else pct = level === 4 ? parts(k, 100, 1, 4) : parts(k, 100, 5, 5);
  // Grados en décimas: 360 · p / 100 = 36 · p décimas; con frecuencias 3600 · f / N.
  const deg = freq ? freq.map((f) => (3600 * f) / N) : pct.map((p) => 36 * p);
  const inv = level === 3;
  const slots = deg.map((t, i) => ({ id: `s${i}`, row: i, want: inv ? String(pct[i]) : fmtDeg(t) }));
  const rowHint = deg.map((t, i) => {
    const a = fmtDeg(t), p = pct && pct[i], nice = NICE[p] ? ` (${NICE[p]} del círculo)` : "";
    if (inv) return `${a}° de 360°: 100 · ${a} / 360 = ${p} %${nice}`;
    if (freq) return `Son ${N} datos y el círculo tiene 360°: cada dato vale 360 : ${N} = ${360 / N}°; ${freq[i]} datos → ${freq[i]} · ${360 / N} = ${a}°`;
    return `El círculo entero son 360°: ${p} % → 360 · ${p} / 100 = ${a}°${nice}`;
  });
  const list = deg.map((t, i) => (inv ? `${fmtDeg(t)}° → ${pct[i]} %` : freq ? `${freq[i]} → ${fmtDeg(t)}°` : `${pct[i]} % → ${fmtDeg(t)}°`)).join("; ");
  const tail = `. Todos: ${list}. Suman ${inv ? "100 %" : "360°"} ✓`;
  return { level, inv, title, cats: cats.slice(0, k), k, pct, freq, N, deg, slots, rowHint, tail };
}

export function mountSectoresGame(container, { client, onExit }) {
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
    <div class="game-body sc-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const onKey = (e) => {
    if (/^\d$/.test(e.key)) pressKey(e.key);
    else if (e.key === "," || e.key === ".") pressKey(",");
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
  };
  const slot = (i) => `<button type="button" class="sc-slot" data-slot="${i}"></button>`;

  // Círculo con los sectores: angles en grados (null = aún sin dibujar).
  function pie(angles, labels) {
    const R = 66, C = 72;
    const pt = (a, r = R) => [C + r * Math.sin((a * Math.PI) / 180), C - r * Math.cos((a * Math.PI) / 180)];
    let from = 0, out = "";
    angles.forEach((a, i) => {
      if (a == null || !(a > 0)) return;
      const to = Math.min(360, from + a);
      if (to <= from) return;
      const [x1, y1] = pt(from), [x2, y2] = pt(to);
      out += to - from >= 359.99
        ? `<circle class="sc-c${i}" cx="${C}" cy="${C}" r="${R}"/>`
        : `<path class="sc-c${i}" d="M${C},${C} L${x1.toFixed(2)},${y1.toFixed(2)} A${R},${R} 0 ${to - from > 180 ? 1 : 0} 1 ${x2.toFixed(2)},${y2.toFixed(2)} Z"/>`;
      if (labels) {
        const [lx, ly] = pt((from + to) / 2, R * 0.62);
        out += `<text class="sc-lab" x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}">${fmtDeg(round.deg[i])}°</text>`;
      }
      from = to;
    });
    return `<svg class="sc-pie" viewBox="0 0 144 144"><circle class="sc-rim" cx="${C}" cy="${C}" r="${R}"/>${out}<line class="sc-zero" x1="${C}" y1="${C}" x2="${C}" y2="${C - R - 4}"/></svg>`;
  }

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(5, Math.floor(hits / 2)));
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    const { inv, freq, N, cats } = round;
    const head = inv ? ["Grados", "%"] : [freq ? "Frecuencia" : "%", "Grados"];
    const given = (i) => (inv ? `${fmtDeg(round.deg[i])}°` : freq ? freq[i] : `${round.pct[i]} %`);
    const rows = cats.map((c, i) => `<tr><td class="sc-cat"><span class="sc-sw sc-c${i}"></span>${c}</td><td>${given(i)}</td><td>${slot(i)}${inv ? " %" : "°"}</td></tr>`);
    body.innerHTML = `
      <p class="prompt sc-prompt">${round.title}: ${inv ? "¿qué % es cada sector?" : "¿cuántos grados mide cada sector?"}</p>
      <div class="sc-wrap sc-cuaderno">
        <table class="sc-table">
          <thead><tr><th></th>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>${rows.join("")}<tr class="sc-total"><td>Total</td><td>${inv ? "360°" : freq ? N : "100 %"}</td><td>${inv ? "100 %" : "360°"}</td></tr></tbody>
        </table>
        <div data-pie></div>
      </div>
      <div class="keypad sc-keypad" data-keypad></div>
      <div class="feedback sc-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((s) => s.addEventListener("click", () => !busy && ((active = +s.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary sc-ok" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const k = +s.dataset.slot;
      if (!busy) s.textContent = typed[k];
      s.classList.toggle("active", !busy && k === active);
    });
    // Directa: los sectores se dibujan con los grados escritos (en orden).
    const real = round.deg.map((t) => t / 10);
    const angles = busy || round.inv ? real : typed.map((t) => tenths(t) / 10);
    body.querySelector("[data-pie]").innerHTML = pie(angles, busy || round.inv);
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return check();
    const t = typed[active];
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (key === ",") { if (!t.includes(",")) typed[active] = (t || "0") + ","; }
    else if (t.length < 5) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    const missing = typed.indexOf("");
    if (missing >= 0) {
      const silent = typed[active] !== "";
      active = missing;
      paint();
      if (!silent) {
        feedback.textContent = "Faltan casillas por rellenar";
        feedback.className = "feedback bad sc-feedback";
      }
      return;
    }
    busy = true;
    rounds++;
    const ok = round.slots.map((s, i) => tenths(typed[i]) === tenths(s.want));
    const allOk = ok.every(Boolean);
    body.querySelectorAll("[data-slot]").forEach((el) => {
      const k = +el.dataset.slot;
      el.classList.add(ok[k] ? "good" : "bad");
      el.innerHTML = ok[k] ? typed[k] : `<s>${typed[k]}</s><i class="sc-fix">${round.slots[k].want}</i>`;
    });
    paint();
    const bad = ok.indexOf(false);
    const hint = `💡 ${round.rowHint[Math.max(0, bad)]}${round.tail}`;
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${hint}`;
      feedback.className = "feedback ok sc-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Revisa lo rojo. ${hint} <button type="button" class="sc-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad sc-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", go);
      pending = setTimeout(go, 3500);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "sectores", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🥧</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} gráficos completos de ${rounds}</p>
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
