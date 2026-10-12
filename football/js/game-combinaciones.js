// "¿De cuántas formas?": el principio de multiplicar con su diagrama de
// árbol, como en el libro. Se ven las prendas dibujadas en colores ("3
// camisetas y 2 pantalones") o los amigos que se sientan, y la cuenta con
// casillas "□ × □ = □". Al responder, el árbol se dibuja rama a rama
// (si es enorme, se abre solo la primera rama y las demás llevan su
// número). 💡 "Por cada camiseta hay 2 pantalones: 3 × 2 = 6".
import { randInt, pick, saveScore } from "./utils.js";

const COLORS = ["#e5484d", "#3b82f6", "#16a34a", "#eab308", "#8b5cf6"];
const GARMENTS = [
  { one: "camiseta", many: "camisetas", d: "M12 6 L3 12 L8 20 L12 17 L12 36 L28 36 L28 17 L32 20 L37 12 L28 6 Q20 12 12 6 Z" },
  { one: "pantalón", many: "pantalones", d: "M9 4 L31 4 L33 37 L23 37 L20 15 L17 37 L7 37 Z" },
  { one: "gorra", many: "gorras", d: "M5 27 Q5 9 20 9 Q33 9 33 25 L39 25 L39 30 L5 30 Z" },
];
const FRIENDS = ["Ana", "Bruno", "Carla", "Dani", "Eva"];
const ORD = ["1.ª", "2.ª", "3.ª", "4.ª", "5.ª"];
const prod = (a) => a.reduce((t, v) => t * v, 1);

// Niveles: 0 2 × 2 · 1 dos prendas hasta 4 × 3 · 2 tres prendas ·
// 3 ordenar 3 (amigos en fila, números con 3 cifras) o podio · 4 4! y 5!.
export function buildRound(level) {
  let kind, sizes, ctx = null;
  if (level === 0) { kind = "ropa"; sizes = [2, 2]; }
  else if (level === 1) { kind = "ropa"; sizes = pick([[3, 2], [2, 3], [3, 3], [4, 2], [2, 4], [4, 3]]); }
  else if (level === 2) { kind = "ropa"; do sizes = [randInt(2, 3), randInt(2, 3), randInt(2, 3)]; while (prod(sizes) > 18); }
  else if (level === 3) {
    kind = "perm"; ctx = pick(["sillas", "cifras", "podio"]);
    sizes = ctx === "podio" ? (pick([4, 5]) === 4 ? [4, 3] : [5, 4]) : [3, 2, 1];
  } else if (Math.random() < 0.3) { kind = "ropa"; sizes = pick([[4, 3, 2], [3, 3, 2], [4, 2, 2]]); }
  else {
    kind = "perm"; ctx = pick(["sillas", "cifras", "podio"]);
    const n = ctx === "podio" ? 5 : pick([4, 5]);
    sizes = ctx === "podio" ? [5, 4, 3] : Array.from({ length: n }, (_, i) => n - i);
  }
  const total = prod(sizes), times = sizes.join(" × ");
  let prompt, unit, items, hint;
  if (kind === "ropa") {
    const g = sizes.map((s, i) => `${s} ${s === 1 ? GARMENTS[i].one : GARMENTS[i].many}`);
    prompt = `${g.slice(0, -1).join(", ")} y ${g[g.length - 1]}: ¿cuántos conjuntos distintos?`;
    unit = "conjuntos";
    items = sizes.map((s, i) => Array.from({ length: s }, (_, j) => ({ g: i, c: j })));
    hint = sizes.length === 2
      ? `Por cada ${GARMENTS[0].one} hay ${sizes[1]} ${GARMENTS[1].many}: ${times} = ${total}`
      : `Por cada ${GARMENTS[0].one} hay ${sizes[1]} ${GARMENTS[1].many} (${sizes[0]} × ${sizes[1]} = ${sizes[0] * sizes[1]}) y cada uno de esos va con ${sizes[2]} ${GARMENTS[2].many}: ${sizes[0] * sizes[1]} × ${sizes[2]} = ${total}`;
  } else {
    const n = sizes[0], k = sizes.length;
    const labels = ctx === "cifras" ? Array.from({ length: n }, (_, i) => String(i + 1)) : FRIENDS.slice(0, n);
    items = [labels.map((l) => ({ l }))];
    unit = ctx === "cifras" ? "números" : "formas";
    const fact = k === n && n >= 4 ? ` (${n}! = ${total})` : "";
    if (ctx === "sillas") {
      prompt = `¿De cuántas formas se pueden sentar ${n} amigos en ${n} sillas en fila?`;
      hint = `Para la 1.ª silla hay ${n} amigos, para la 2.ª quedan ${n - 1}${n > 2 ? `… y para la última solo 1` : ""}: ${times} = ${total}${fact}`;
    } else if (ctx === "cifras") {
      prompt = `¿Cuántos números distintos se escriben con las cifras ${labels.join(", ")} sin repetir ninguna?`;
      hint = `Para la 1.ª cifra hay ${n} opciones, para la 2.ª quedan ${n - 1}… y para la última solo 1: ${times} = ${total}${fact}`;
    } else {
      const med = k === 2 ? "el oro y la plata" : "el oro, la plata y el bronce";
      prompt = `Corren ${n} amigos: ¿de cuántas formas se pueden repartir ${med}?`;
      hint = `Para el oro hay ${n} corredores; para la plata quedan ${n - 1}${k === 3 ? ` y para el bronce ${n - 2}` : ""}: ${times} = ${total}`;
    }
  }
  return { kind, ctx, sizes, total, prompt, unit, items, hint };
}

// Dibujo de una prenda (o de un amigo/cifra en un círculo) centrado en x, y.
function glyph(r, depth, idx, x, y, s) {
  if (r.kind === "ropa") return `<g transform="translate(${x - s / 2} ${y - s / 2}) scale(${s / 40})"><path class="cb-g" d="${GARMENTS[depth].d}" fill="${COLORS[idx]}"/></g>`;
  return `<circle class="cb-p" cx="${x}" cy="${y}" r="${s / 2}" fill="${COLORS[idx % 5]}"/><text class="cb-pt" x="${x}" y="${y + s * 0.2}" font-size="${s * 0.58}">${r.items[0][idx].l[0]}</text>`;
}

// Árbol: se abre entero si tiene ≤ 18 hojas; si no, solo la primera rama.
export function buildTree(sizes) {
  const under = (d) => prod(sizes.slice(d));
  let slots = 0;
  const build = (d, path) => {
    const node = { d, path, kids: [] };
    if (d === sizes.length) return Object.assign(node, { slot: slots++ });
    const full = under(d) <= 18;
    for (let i = 0; i < sizes[d]; i++)
      node.kids.push(full || i === 0 ? build(d + 1, [...path, i]) : { d: d + 1, path: [...path, i], kids: [], slot: slots++, collapsed: under(d + 1) });
    return node;
  };
  const root = build(0, []);
  return { root, slots };
}

function treeSvg(r, show) {
  const { root, slots } = buildTree(r.sizes);
  const W = 360, L = r.sizes.length, gap = Math.min(44, 150 / L), H = 18 + L * gap + 22;
  const xs = (slot) => 14 + (slot * (W - 28)) / Math.max(slots - 1, 1);
  const out = [];
  const place = (n) => {
    n.kids.forEach(place);
    n.x = n.kids.length ? n.kids.reduce((t, k) => t + k.x, 0) / n.kids.length : xs(n.slot);
    n.y = 12 + n.d * gap;
  };
  place(root);
  // Para los amigos/cifras, el índice que se dibuja es el de quien queda.
  const who = (path) => {
    const left = r.items[0].map((_, i) => i), got = [];
    path.forEach((p) => got.push(left.splice(p, 1)[0]));
    return got[got.length - 1];
  };
  const draw = (n) => {
    const st = `style="animation-delay:${(n.d * 0.22).toFixed(2)}s"`;
    n.kids.forEach((k) => {
      out.push(`<line class="cb-edge cb-in" ${st} x1="${n.x}" y1="${n.y}" x2="${k.x}" y2="${k.y}"/>`);
      draw(k);
    });
    if (n.d === 0) out.push(`<circle class="cb-root" cx="${n.x}" cy="${n.y}" r="5"/>`);
    else {
      const s = n.d === L ? Math.min(18, (W - 28) / Math.max(slots - 1, 1) - 2) : 20;
      const idx = r.kind === "ropa" ? n.path[n.d - 1] : who(n.path);
      out.push(`<g class="cb-in" ${st}>${glyph(r, n.d - 1, idx, n.x, n.y, s)}${n.collapsed ? `<text class="cb-more" x="${n.x}" y="${n.y + 24}">…${n.collapsed}</text>` : ""}</g>`);
    }
  };
  if (show) draw(root);
  else out.push(`<circle class="cb-root" cx="${W / 2}" cy="12" r="5"/>`);
  return `<svg class="cb-tree" viewBox="0 0 ${W} ${H}">${out.join("")}</svg>`;
}

export function mountCombinacionesGame(container, { client, onExit }) {
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
    <div class="game-body cb-body" data-body></div>
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
    const k = round.sizes.length;
    typed = Array(k + 1).fill("");
    active = 0;
    busy = false;
    const group = (g, gi) => `<div class="cb-group">${g.map((it, i) => `<svg class="cb-item" viewBox="0 0 40 40">${round.kind === "ropa" ? glyph(round, gi, it.c, 20, 20, 36) : glyph(round, 0, i, 20, 20, 34)}</svg>`).join("")}</div>`;
    const slot = (i) => `<button type="button" class="cb-slot" data-slot="${i}"></button>`;
    body.innerHTML = `
      <p class="prompt cb-prompt">${round.prompt}</p>
      <div class="cb-items">${round.items.map(group).join("")}</div>
      <div class="cb-cuaderno cb-formula">${round.sizes.map((_, i) => slot(i)).join("<span>×</span>")}<span>=</span>${slot(k)}<span class="cb-unit">${round.unit}</span></div>
      <div class="cb-treebox" data-tree>${treeSvg(round, false)}</div>
      <div class="keypad cb-keypad" data-keypad></div>
      <div class="feedback cb-feedback" data-feedback></div>
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
      b.textContent = typed[+b.dataset.slot];
      b.classList.toggle("active", +b.dataset.slot === active);
    });
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") {
      const empty = typed.indexOf("");
      if (empty < 0) return check();
      const next = typed.findIndex((t, i) => i > active && t === "");
      if (typed[active] !== "") { active = next >= 0 ? next : empty; return paint(); }
      active = empty;
      paint();
      const fb = body.querySelector("[data-feedback]");
      fb.textContent = "Faltan casillas por rellenar";
      fb.className = "feedback bad cb-feedback";
      return;
    }
    if (key === "⌫") {
      if (typed[active] === "" && active > 0) active--;
      else typed[active] = typed[active].slice(0, -1);
    } else if (typed[active].length < 3) {
      typed[active] += key;
      // Los factores son de una cifra: el foco pasa solo al siguiente.
      if (active < round.sizes.length) active++;
    }
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    busy = true;
    rounds++;
    const k = round.sizes.length;
    const got = typed.slice(0, k).map(Number);
    // Los factores valen en cualquier orden (3 × 2 = 2 × 3).
    const sameFactors = [...got].sort().join() === [...round.sizes].sort().join();
    const want = [...round.sizes, round.total];
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const i = +b.dataset.slot;
      const ok = i < k ? sameFactors || got[i] === want[i] : Number(typed[i]) === round.total;
      const good = i < k ? sameFactors : ok;
      allOk = allOk && good;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[i]}</s><i class="cb-fix">${want[i]}</i>`;
    });
    body.querySelector("[data-tree]").innerHTML = treeSvg(round, true);
    const text = `${round.sizes.join(" × ")} = ${round.total} ${round.unit}`;
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${text}. 💡 ${round.hint}`;
      feedback.className = "feedback ok cb-feedback";
      pending = setTimeout(nextRound, 1400);
    } else {
      lives--;
      renderLives();
      const go = () => { clearTimeout(pending); lives <= 0 ? finish(false) : nextRound(); };
      feedback.innerHTML = `Son ${text}. 💡 ${round.hint} <button type="button" class="cb-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad cb-feedback";
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
    saveScore(client, "combinaciones", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🌳</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} recuentos bien hechos de ${rounds}</p>
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
