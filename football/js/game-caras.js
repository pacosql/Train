// "Caras, aristas y vértices": se dibuja un cuerpo geométrico en SVG (con
// las aristas ocultas punteadas) y se pregunta UNA cosa: cuántas caras,
// aristas o vértices tiene; se responde con el teclado. El 💡 numera y
// hace parpadear en el dibujo lo que había que contar y dice la regla
// ("prisma de base hexagonal: 6 + 2 = 8 caras"). El nivel alto es Euler:
// dadas dos cantidades, calcular la tercera (C + V = A + 2).
import { pick, saveScore } from "./utils.js";

// Poliedros: puntos ya proyectados; en `e` y `f` van primero los
// elementos visibles (ve, vf = cuántos) y después los ocultos.
const hexa = (cy) => [0, 1, 2, 3, 4, 5].map((k) => [100 + 60 * Math.cos((k * Math.PI) / 3), cy + 16 * Math.sin((k * Math.PI) / 3)]);
const box = (name, base, v) => ({
  name, kind: "prisma", n: 4, base, v, ve: 9, vf: 3,
  e: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [1, 5], [2, 6], [4, 5], [5, 6], [3, 7], [7, 4], [7, 6]],
  f: [[0, 1, 2, 3], [0, 1, 5, 4], [1, 2, 6, 5], [4, 5, 6, 7], [0, 3, 7, 4], [3, 2, 6, 7]],
});
export const SOLIDS = {
  cubo: box("cubo", "cuadrada", [[50, 55], [130, 55], [130, 135], [50, 135], [90, 25], [170, 25], [170, 105], [90, 105]]),
  ortoedro: box("ortoedro", "rectangular", [[30, 75], [140, 75], [140, 135], [30, 135], [65, 45], [175, 45], [175, 105], [65, 105]]),
  prismaT: {
    name: "prisma triangular", kind: "prisma", n: 3, base: "triangular", ve: 6, vf: 2,
    v: [[55, 140], [150, 145], [110, 115], [55, 60], [150, 65], [110, 35]],
    e: [[0, 1], [0, 3], [1, 4], [3, 4], [4, 5], [5, 3], [0, 2], [1, 2], [2, 5]],
    f: [[3, 4, 5], [0, 1, 4, 3], [0, 1, 2], [0, 2, 5, 3], [1, 2, 5, 4]],
  },
  prismaH: {
    name: "prisma hexagonal", kind: "prisma", n: 6, base: "hexagonal", ve: 13, vf: 4,
    v: [...hexa(130), ...hexa(50)],
    e: [[0, 1], [1, 2], [2, 3], [0, 6], [1, 7], [2, 8], [3, 9], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 6], [3, 4], [4, 5], [5, 0], [4, 10], [5, 11]],
    f: [[6, 7, 8, 9, 10, 11], [0, 1, 7, 6], [1, 2, 8, 7], [2, 3, 9, 8], [0, 1, 2, 3, 4, 5], [3, 4, 10, 9], [4, 5, 11, 10], [5, 0, 6, 11]],
  },
  piramideC: {
    name: "pirámide cuadrada", kind: "pirámide", n: 4, base: "cuadrada", ve: 5, vf: 2,
    v: [[40, 135], [135, 145], [165, 110], [70, 100], [100, 30]],
    e: [[0, 1], [1, 2], [4, 0], [4, 1], [4, 2], [2, 3], [3, 0], [4, 3]],
    f: [[4, 0, 1], [4, 1, 2], [4, 2, 3], [4, 3, 0], [0, 1, 2, 3]],
  },
  piramideT: {
    name: "pirámide triangular", kind: "pirámide", n: 3, base: "triangular", ve: 5, vf: 2,
    v: [[35, 135], [125, 150], [165, 105], [90, 30]],
    e: [[0, 1], [1, 2], [3, 0], [3, 1], [3, 2], [2, 0]],
    f: [[3, 0, 1], [3, 1, 2], [3, 2, 0], [0, 1, 2]],
  },
  // Cuerpos redondos: dibujo fijo; solo se preguntan caras PLANAS y vértices.
  cilindro: {
    name: "cilindro", kind: "redondo", C: 2, V: 0,
    svg: `<ellipse class="ca-face" cx="100" cy="130" rx="55" ry="16" data-lx="100" data-ly="130"/><ellipse class="ca-face" cx="100" cy="45" rx="55" ry="16" data-lx="100" data-ly="45"/>
      <path class="ca-edge hid" d="M45 130 A55 16 0 0 1 155 130"/><path class="ca-edge" d="M45 130 A55 16 0 0 0 155 130"/><path class="ca-edge" d="M45 45 v85 M155 45 v85"/><ellipse class="ca-edge" cx="100" cy="45" rx="55" ry="16" fill="none"/>`,
    text: "El cilindro tiene 2 caras planas (las bases) y una superficie curva; tiene 0 vértices",
  },
  cono: {
    name: "cono", kind: "redondo", C: 1, V: 1,
    svg: `<ellipse class="ca-face" cx="100" cy="135" rx="60" ry="16" data-lx="100" data-ly="135"/><path class="ca-edge hid" d="M40 135 A60 16 0 0 1 160 135"/><path class="ca-edge" d="M40 135 A60 16 0 0 0 160 135"/><path class="ca-edge" d="M40 135 L100 25 L160 135"/><circle class="ca-vert" cx="100" cy="25" r="3.5" data-lx="100" data-ly="18"/>`,
    text: "El cono tiene 1 cara plana (la base), una superficie curva y 1 vértice (la punta)",
  },
  esfera: {
    name: "esfera", kind: "redondo", C: 0, V: 0,
    svg: `<circle class="ca-edge" cx="100" cy="90" r="65" fill="none"/><path class="ca-edge hid" d="M35 90 A65 18 0 0 1 165 90"/><path class="ca-edge" d="M35 90 A65 18 0 0 0 165 90"/>`,
    text: "La esfera es toda superficie curva: 0 caras planas, 0 aristas y 0 vértices",
  },
};
const POLY = ["cubo", "ortoedro", "prismaT", "prismaH", "piramideC", "piramideT"];
const LEVELS = [["cubo", "piramideC", "ortoedro"], ["prismaT", "prismaH", "cubo", "ortoedro"], ["piramideC", "piramideT", "cilindro", "cono", "esfera"]];
const QTY = { C: ["face", "caras"], A: ["edge", "aristas"], V: ["vert", "vértices"] };

function counts(s) {
  if (s.kind === "redondo") return { C: s.C, A: 0, V: s.V };
  return { C: s.f.length, A: s.e.length, V: s.v.length };
}
function rule(s, ask) {
  const n = s.n;
  if (s.kind === "redondo") return s.text;
  const head = `${s.name[0].toUpperCase()}${s.name.slice(1)} (base ${s.base}): `;
  if (s.kind === "prisma")
    return head + { C: `${n} caras laterales + 2 bases = ${n + 2} caras`, A: `${n} aristas arriba + ${n} abajo + ${n} verticales = ${3 * n}`, V: `${n} vértices arriba + ${n} abajo = ${2 * n}` }[ask];
  return head + { C: `${n} triángulos + 1 base = ${n + 1} caras`, A: `${n} aristas en la base + ${n} que suben a la punta = ${2 * n}`, V: `${n} vértices en la base + 1 en la punta = ${n + 1}` }[ask];
}

// Niveles: 0 cubo y pirámide · 1 prismas · 2 pirámides y cuerpos redondos ·
// 3 Euler (dos datos de un poliedro, se calcula el tercero).
export function buildRound(level) {
  if (level >= 3) {
    const id = pick(POLY);
    const c = counts(SOLIDS[id]);
    const ask = pick(["C", "A", "V"]);
    const [g1, g2] = ["C", "A", "V"].filter((k) => k !== ask);
    const formula = { C: `C = A + 2 − V = ${c.A} + 2 − ${c.V} = ${c.C}`, V: `V = A + 2 − C = ${c.A} + 2 − ${c.C} = ${c.V}`, A: `A = C + V − 2 = ${c.C} + ${c.V} − 2 = ${c.A}` }[ask];
    return {
      id, ask, answer: c[ask], euler: true, given: { [g1]: c[g1], [g2]: c[g2] },
      prompt: `Un poliedro tiene ${c[g1]} ${QTY[g1][1]} y ${c[g2]} ${QTY[g2][1]}. ¿Cuántos ${QTY[ask][1]}?`,
      hint: `Fórmula de Euler: C + V = A + 2 → ${formula}`,
    };
  }
  const id = pick(LEVELS[level]);
  const s = SOLIDS[id];
  const ask = s.kind === "redondo" ? pick(["C", "V"]) : pick(["C", "A", "V"]);
  return {
    id, ask, answer: counts(s)[ask], euler: false,
    prompt: ask === "V" ? "¿Cuántos vértices tiene?" : `¿Cuántas ${ask === "C" && s.kind === "redondo" ? "caras planas" : QTY[ask][1]} tiene?`,
    hint: rule(s, ask),
  };
}

export function drawSolid(s) {
  if (s.svg) return s.svg;
  const pt = (i) => s.v[i].join(",");
  const cen = (idx) => idx.reduce((a, i) => [a[0] + s.v[i][0] / idx.length, a[1] + s.v[i][1] / idx.length], [0, 0]);
  const visibleV = new Set(s.e.slice(0, s.ve).flat());
  return (
    s.f.map((idx, k) => `<polygon class="ca-face ${k >= s.vf ? "hid" : ""}" points="${idx.map(pt).join(" ")}" data-lx="${cen(idx)[0]}" data-ly="${cen(idx)[1]}"/>`).join("") +
    s.e.map(([a, b], k) => `<line class="ca-edge ${k >= s.ve ? "hid" : ""}" x1="${s.v[a][0]}" y1="${s.v[a][1]}" x2="${s.v[b][0]}" y2="${s.v[b][1]}" data-lx="${(s.v[a][0] + s.v[b][0]) / 2}" data-ly="${(s.v[a][1] + s.v[b][1]) / 2}"/>`).join("") +
    s.v.map(([x, y], k) => `<circle class="ca-vert ${visibleV.has(k) ? "" : "hid"}" cx="${x}" cy="${y}" r="3.5" data-lx="${x}" data-ly="${y - 8}"/>`).join("")
  );
}

export function mountCarasGame(container, { client, onExit }) {
  const startLives = 3;
  const COLORS = ["var(--accent)", "var(--accent-2)", "var(--good)", "#b7791f", "var(--danger)", "#d946ef"];
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body ca-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 3)));
    typed = "";
    busy = false;
    const s = SOLIDS[round.id];
    const figure = round.euler
      ? `<div class="ca-euler">${["C", "V", "A"].map((k) => `<span class="${k === round.ask ? "ask" : ""}"><b>${k}</b>${k in round.given ? round.given[k] : "?"}</span>`).join("")}</div>`
      : `<svg class="ca-svg" viewBox="0 0 200 170" data-svg>${drawSolid(s)}</svg><div class="ca-name">${s.name}</div>`;
    body.innerHTML = `
      <p class="prompt ca-prompt">${round.prompt}</p>
      <div class="ca-figure">${figure}</div>
      <div class="keypad-display ca-display" data-display>&nbsp;</div>
      <div class="keypad ca-keypad" data-keypad></div>
      <div class="feedback ca-feedback" data-feedback></div>
    `;
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

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    typed = key === "⌫" ? typed.slice(0, -1) : (typed + key).slice(0, 2);
    body.querySelector("[data-display]").textContent = typed || " ";
  }

  // 💡 visual: numera y hace parpadear en el dibujo lo que había que contar.
  function reveal() {
    const svg = body.querySelector("[data-svg]");
    if (!svg) return;
    svg.querySelectorAll(`.ca-${QTY[round.ask][0]}`).forEach((el, i) => {
      el.classList.add("hl");
      el.style.setProperty("--ca-c", COLORS[i % COLORS.length]);
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("class", "ca-lab");
      t.setAttribute("x", el.dataset.lx);
      t.setAttribute("y", el.dataset.ly);
      t.textContent = i + 1;
      svg.appendChild(t);
    });
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    if (typed === "") return;
    busy = true;
    rounds++;
    const display = body.querySelector("[data-display]");
    reveal();
    if (Number(typed) === round.answer) {
      score += 10;
      hits++;
      renderScore();
      display.classList.add("good");
      feedback.textContent = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      display.classList.add("bad");
      display.innerHTML = `<s>${typed}</s> ${round.answer}`;
      feedback.textContent = `Era ${round.answer}. 💡 ${round.hint}`;
      feedback.className = "feedback bad";
      pending = setTimeout(() => (lives <= 0 ? finish(false) : nextRound()), 2200);
    }
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "caras", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧊</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cuerpos bien contados de ${rounds}</p>
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
