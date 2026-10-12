// "Despeja la fórmula": una fórmula de verdad (v = e/t, A = b·h/2,
// P = 2a + 2b…) escrita como en el libro, con fracciones de raya, y debajo
// la fórmula despejada con huecos. Se tocan (o se arrastran) las fichas
// v, e, t, 2π… a los huecos. En el último nivel, además, se sustituyen los
// datos y se escribe el resultado con el teclado (e = 60 · 2 = 120 km).
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const fr = (n, d) => `<span class="df-frac"><span>${n}</span><span>${d}</span></span>`;
// Las letras de las magnitudes, en cursiva (como en el libro)
// (solo en el texto, nunca dentro de las etiquetas HTML).
const it = (s) => s.replace(/(<[^>]*>)|([A-Za-z])/g, (m, tag, ch) => tag || `<i>${ch}</i>`);
const H = "□";

// Banco de fórmulas por nivel: dada, incógnita, plantilla con huecos,
// respuestas válidas (en el orden de los huecos), fichas de más y el 💡.
export const BANK = [
  [ // 0 · despejar lo que está dividido → producto
    { id: "vet", given: `v = ${fr("e", "t")}`, x: "e", tpl: `${H} · ${H}`, ans: [["v", "t"], ["t", "v"]], extra: ["2"], hint: "t está dividiendo: pasa al otro lado multiplicando → e = v · t" },
    { id: "dmv", given: `d = ${fr("m", "V")}`, x: "m", tpl: `${H} · ${H}`, ans: [["d", "V"], ["V", "d"]], extra: ["2"], hint: "V está dividiendo: pasa multiplicando → m = d · V" },
    { id: "ivr", given: `I = ${fr("V", "R")}`, x: "V", tpl: `${H} · ${H}`, ans: [["I", "R"], ["R", "I"]], extra: ["2"], hint: "R está dividiendo: pasa multiplicando → V = I · R" },
    { id: "pfs", given: `p = ${fr("F", "S")}`, x: "F", tpl: `${H} · ${H}`, ans: [["p", "S"], ["S", "p"]], extra: ["2"], hint: "S está dividiendo: pasa multiplicando → F = p · S" },
    { id: "pwt", given: `P = ${fr("W", "t")}`, x: "W", tpl: `${H} · ${H}`, ans: [["P", "t"], ["t", "P"]], extra: ["2"], hint: "t está dividiendo: pasa multiplicando → W = P · t" },
  ],
  [ // 1 · despejar un factor → cociente
    { id: "tev", given: "e = v · t", x: "t", tpl: fr(H, H), ans: [["e", "v"]], extra: ["2"], hint: "v está multiplicando: pasa al otro lado dividiendo → t = e / v" },
    { id: "afm", given: "F = m · a", x: "a", tpl: fr(H, H), ans: [["F", "m"]], extra: ["2"], hint: "m está multiplicando: pasa dividiendo → a = F / m" },
    { id: "hab", given: "A = b · h", x: "h", tpl: fr(H, H), ans: [["A", "b"]], extra: ["2"], hint: "b está multiplicando: pasa dividiendo → h = A / b" },
    { id: "rc", given: "C = 2πr", x: "r", tpl: fr(H, H), ans: [["C", "2π"]], extra: ["π", "2"], hint: "2π está multiplicando a r: pasa dividiendo → r = C / 2π" },
    { id: "dwf", given: "W = F · d", x: "d", tpl: fr(H, H), ans: [["W", "F"]], extra: ["2"], hint: "F está multiplicando: pasa dividiendo → d = W / F" },
    { id: "rvi", given: "V = I · R", x: "R", tpl: fr(H, H), ans: [["V", "I"]], extra: ["2"], hint: "I está multiplicando: pasa dividiendo → R = V / I" },
  ],
  [ // 2 · con una suma
    { id: "per", given: "P = 2a + 2b", x: "a", tpl: fr(`(${H} − ${H})`, H), ans: [["P", "2b", "2"]], extra: ["2a"], hint: "2b está sumando: pasa restando (2a = P − 2b); el 2 multiplica: pasa dividiendo → a = (P − 2b) / 2" },
    { id: "v0", given: "v = v₀ + a · t", x: "v₀", tpl: `${H} − ${H}`, ans: [["v", "a · t"]], extra: ["t"], hint: "a · t está sumando: pasa al otro lado restando → v₀ = v − a · t" },
    { id: "iva", given: "T = P + I", x: "P", tpl: `${H} − ${H}`, ans: [["T", "I"]], extra: ["2"], hint: "I está sumando: pasa restando → P = T − I" },
    { id: "rec", given: "y = mx + n", x: "n", tpl: `${H} − ${H}`, ans: [["y", "mx"]], extra: ["x"], hint: "mx está sumando: pasa restando → n = y − mx" },
    { id: "far", given: "F = 1,8 · C + 32", x: "C", tpl: fr(`(${H} − ${H})`, H), ans: [["F", "32", "1,8"]], extra: [], hint: "32 suma: pasa restando (1,8 · C = F − 32); 1,8 multiplica: pasa dividiendo → C = (F − 32) / 1,8" },
    { id: "tri", given: "P = a + b + c", x: "c", tpl: `${H} − ${H} − ${H}`, ans: [["P", "a", "b"], ["P", "b", "a"]], extra: [], hint: "a y b están sumando: pasan restando → c = P − a − b" },
  ],
  [ // 3 · dos pasos
    { id: "tri2", given: `A = ${fr("b · h", "2")}`, x: "h", tpl: fr(`2 · ${H}`, H), ans: [["A", "b"]], extra: ["2"], hint: "El 2 divide: pasa multiplicando (2 · A = b · h); b multiplica: pasa dividiendo → h = 2 · A / b" },
    { id: "tve", given: `v = ${fr("e", "t")}`, x: "t", tpl: fr(H, H), ans: [["e", "v"]], extra: ["2"], hint: "t divide: pasa multiplicando (v · t = e); v multiplica: pasa dividiendo → t = e / v" },
    { id: "acel", given: `a = ${fr("v − v₀", "t")}`, x: "v", tpl: `${H} + ${H} · ${H}`, ans: [["v₀", "a", "t"], ["v₀", "t", "a"]], extra: [], hint: "t divide: pasa multiplicando (a · t = v − v₀); v₀ resta: pasa sumando → v = v₀ + a · t" },
    { id: "epot", given: "E = m · g · h", x: "h", tpl: fr(H, `${H} · ${H}`), ans: [["E", "m", "g"], ["E", "g", "m"]], extra: [], hint: "m y g multiplican a h: pasan juntos dividiendo → h = E / (m · g)" },
    { id: "cil", given: "V = π · r² · h", x: "h", tpl: fr(H, `${H} · ${H}`), ans: [["V", "π", "r²"], ["V", "r²", "π"]], extra: ["r"], hint: "π y r² multiplican a h: pasan dividiendo → h = V / (π · r²)" },
    { id: "trap", given: `A = ${fr("(B + b) · h", "2")}`, x: "h", tpl: fr(`2 · ${H}`, `(${H} + ${H})`), ans: [["A", "B", "b"], ["A", "b", "B"]], extra: [], hint: "El 2 divide: pasa multiplicando (2 · A = (B + b) · h); (B + b) multiplica: pasa dividiendo → h = 2 · A / (B + b)" },
  ],
];
const pickOf = (lv, id) => BANK[lv].find((f) => f.id === id);

// Nivel 4: se despeja y luego se sustituyen los datos (resultado entero).
function withData() {
  const k = randInt(0, 5);
  if (k === 0) { const v = randInt(4, 12) * 10, t = randInt(2, 5); return { f: pickOf(0, "vet"), data: [["v", v, "km/h"], ["t", t, "h"]], sub: `${v} · ${t}`, val: v * t, unit: "km" }; }
  if (k === 1) { const v = pick([50, 60, 80, 90, 100, 120]), t = randInt(2, 5); return { f: pickOf(3, "tve"), data: [["e", v * t, "km"], ["v", v, "km/h"]], sub: `${v * t} / ${v}`, val: t, unit: "h" }; }
  if (k === 2) { const m = randInt(2, 10), a = randInt(2, 9); return { f: pickOf(1, "afm"), data: [["F", m * a, "N"], ["m", m, "kg"]], sub: `${m * a} / ${m}`, val: a, unit: "m/s²" }; }
  if (k === 3) { const b = randInt(2, 12), h = randInt(1, 6) * 2; return { f: pickOf(3, "tri2"), data: [["A", (b * h) / 2, "cm²"], ["b", b, "cm"]], sub: `2 · ${(b * h) / 2} / ${b}`, val: h, unit: "cm" }; }
  if (k === 4) { const i = randInt(2, 5), r = randInt(2, 10) * 5; return { f: pickOf(0, "ivr"), data: [["I", i, "A"], ["R", r, "Ω"]], sub: `${i} · ${r}`, val: i * r, unit: "V" }; }
  const d = randInt(2, 9), V = randInt(2, 10) * 5;
  return { f: pickOf(0, "dmv"), data: [["d", d, "g/cm³"], ["V", V, "cm³"]], sub: `${d} · ${V}`, val: d * V, unit: "g" };
}

// Niveles: 0 producto · 1 cociente · 2 con suma · 3 dos pasos · 4 sustituir números.
export function buildRound(level) {
  const extra = level === 4 ? withData() : { f: pick(BANK[level]) };
  const f = extra.f;
  const tiles = shuffle([...new Set([...f.ans[0], f.x, ...f.extra])]);
  const hint = extra.data ? `${f.hint}; ${f.x} = ${extra.sub} = ${extra.val} ${extra.unit}` : f.hint;
  return { ...extra, f, tiles, n: f.ans[0].length, hint };
}

export function mountDespejaformulaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, vals, active, busy, drag = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats"><span class="lives" data-lives></span><span class="score" data-score>⭐ 0</span></div>
    </div>
    <div class="game-body df-body" data-body></div>`;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)));
    const total = round.n + (round.data ? 1 : 0);
    vals = Array(total).fill("");
    active = 0;
    busy = false;
    let k = 0;
    const solved = it(round.f.tpl).replace(/□/g, () => `<button type="button" class="df-slot" data-slot="${k++}"></button>`);
    body.innerHTML = `
      <p class="prompt df-prompt">Despeja <b>${it(round.f.x)}</b></p>
      <div class="df-cuaderno">
        <div class="df-given">${it(round.f.given)}</div>
        ${round.data ? `<div class="df-data">${round.data.map(([n, v, u]) => `${it(n)} = ${v} ${u}`).join(" · ")}</div>` : ""}
        <div class="df-solved"><span class="df-arrow">→</span> ${it(round.f.x)} = ${solved}</div>
        ${round.data ? `<div class="df-solved">${it(round.f.x)} = <button type="button" class="df-slot df-num" data-slot="${round.n}"></button> ${round.unit}</div>` : ""}
      </div>
      <div class="df-tiles">${round.tiles.map((t) => `<button type="button" class="df-tile" data-tile="${t}">${it(t)}</button>`).join("")}</div>
      ${round.data ? `<div class="keypad df-keypad" data-keypad></div>` : `<div class="df-actions"><button type="button" class="choice-btn" data-key="⌫">⌫ Borrar</button><button type="button" class="choice-btn primary" data-key="✓">✓ Comprobar</button></div>`}
      <div class="feedback df-feedback" data-feedback></div>`;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    body.querySelectorAll("[data-tile]").forEach((b) => b.addEventListener("pointerdown", (e) => grab(e, b)));
    body.querySelectorAll("[data-key]").forEach((b) => b.addEventListener("click", () => pressKey(b.dataset.key)));
    const pad = body.querySelector("[data-keypad]");
    if (pad) ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
      btn.textContent = key;
      btn.addEventListener("click", () => pressKey(key));
      pad.appendChild(btn);
    });
    paint();
  }

  // Ficha: tocar = al hueco marcado; arrastrar = al hueco donde se suelte.
  function grab(e, tile) {
    if (busy || finished) return;
    e.preventDefault();
    tile.setPointerCapture(e.pointerId);
    drag = { tile, x: e.clientX, y: e.clientY, ghost: null };
    const move = (ev) => {
      if (!drag.ghost && Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) > 8) {
        drag.ghost = tile.cloneNode(true);
        drag.ghost.classList.add("df-ghost");
        body.appendChild(drag.ghost);
      }
      if (drag.ghost) Object.assign(drag.ghost.style, { left: `${ev.clientX}px`, top: `${ev.clientY}px` });
    };
    const up = (ev) => {
      tile.removeEventListener("pointermove", move);
      tile.removeEventListener("pointerup", up);
      tile.removeEventListener("pointercancel", up);
      const d = drag;
      drag = null;
      if (!d) return;
      if (d.ghost) {
        d.ghost.remove();
        const slot = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-slot]");
        if (slot && body.contains(slot) && !slot.classList.contains("df-num")) place(+slot.dataset.slot, tile.dataset.tile);
      } else if (ev.type === "pointerup") place(active, tile.dataset.tile);
    };
    tile.addEventListener("pointermove", move);
    tile.addEventListener("pointerup", up);
    tile.addEventListener("pointercancel", up);
  }

  function place(i, token) {
    if (busy || finished || i >= round.n) return;
    vals[i] = token;
    active = i;
    for (let k = 1; k <= vals.length; k++) if (vals[(i + k) % vals.length] === "") { active = (i + k) % vals.length; break; }
    say("", "");
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      b.innerHTML = it(vals[+b.dataset.slot]);
      b.classList.toggle("active", !busy && +b.dataset.slot === active);
    });
  }
  const say = (html, cls) => {
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = html;
    fb.className = `feedback df-feedback ${cls}`;
  };

  function pressKey(key) {
    if (finished) return;
    if (busy) return key === "✓" && body.querySelector("[data-next]")?.click();
    const isNum = active === round.n;
    if (key === "✓") {
      if (vals.every((v) => v !== "")) return check();
      active = vals.findIndex((v) => v === "");
      say("Faltan huecos por rellenar", "bad");
      return paint();
    }
    if (key === "⌫") vals[active] = isNum ? vals[active].slice(0, -1) : "";
    else if (isNum && vals[active].length < 4) vals[active] += key;
    say("", "");
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    // De las respuestas válidas, la que más se parece a lo puesto
    const best = round.f.ans.reduce((b, a) => (a.filter((t, i) => t === vals[i]).length > b.filter((t, i) => t === vals[i]).length ? a : b));
    const want = round.data ? [...best, String(round.val)] : best;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const i = +b.dataset.slot, ok = i === round.n ? Number(vals[i]) === round.val : vals[i] === want[i];
      allOk &&= ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${it(vals[i])}</s><b>${it(want[i])}</b>`;
    });
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      say(`✓ 💡 ${round.hint}`, "ok");
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      say(`✗ 💡 ${round.hint}<button class="primary df-next" data-next>${lives <= 0 ? "Ver resultado →" : "Siguiente →"}</button>`, "bad");
      body.querySelector("[data-next]").addEventListener("click", () => (lives <= 0 ? finish(false) : nextRound()));
    }
  }

  // Teclado físico: cifras (resultado), retroceso y Enter.
  const onKey = (e) => {
    if (finished) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else return;
    e.preventDefault();
  };
  window.addEventListener("keydown", onKey);

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "despejaformula", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🧪</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} fórmulas despejadas de ${rounds}</p>
        <div class="end-actions">
          <button class="primary" data-retry>Jugar otra vez</button>
          <button class="secondary" data-menu>Volver al menú</button>
        </div>
      </div>`;
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
    window.removeEventListener("keydown", onKey);
    drag?.ghost?.remove();
  };
}
