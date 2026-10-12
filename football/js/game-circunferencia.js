// "Longitud de la circunferencia": un círculo con el radio (o el
// diámetro) rotulado y la fórmula del libro escrita debajo,
// "L = 2 · π · r" y luego "L = 2 · 3,14 · □ = □": se sustituye el dato
// y se calcula (π = 3,14). Tocar una casilla la enfoca; ✓ con la casilla
// llena salta a la siguiente, con todo lleno corrige. Niveles: radio →
// diámetro (r = d/2) → área (A = π · r²) → al revés (r = L / 6,28) → mezcla.
import { randInt, pick, saveScore } from "./utils.js";

// Número a la española: coma decimal y punto de miles.
export const fmt = (n) => {
  const [i, d] = Math.abs(Math.round(n * 100) / 100).toFixed(2).split(".");
  const dd = d.replace(/0+$/, "");
  return (n < 0 ? "−" : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (dd ? "," + dd : "");
};
const near = (a, b) => Math.abs(a - b) < 1e-6;
const frac = (n, d) => `<span class="cc-frac"><span>${n}</span><span>${d}</span></span>`;
const v = (s) => `<i>${s}</i>`;
const PI = "π";
const sv = (s) => `<tspan class="cc-it">${s}</tspan>`; // cursiva dentro del SVG

// Niveles: 0 radio · 1 diámetro · 2 área · 3 al revés · 4 mezcla.
export function buildRound(level) {
  const kind = level === 4 ? pick([0, 1, 2, 3]) : level;
  const u = pick(["cm", "cm", "m"]);
  const r = randInt(2, kind === 2 ? 12 : 20);
  const L = (628 * r) / 100, A = (314 * r * r) / 100;
  let lines, slots, hint, fig, prompt, answer;
  if (kind === 0) {
    prompt = "Calcula la longitud de la circunferencia";
    lines = [`${v("L")} = 2 · ${PI} · ${v("r")}`, `${v("L")} = 2 · 3,14 · {0} = {1} ${u}`];
    slots = [r, L];
    hint = `L = 2 · 3,14 · ${r} = ${fmt(L)} ${u}`;
    fig = { show: "r", label: `${sv("r")} = ${r} ${u}` };
    answer = `L = ${fmt(L)} ${u}`;
  } else if (kind === 1) {
    prompt = "Calcula la longitud de la circunferencia";
    lines = [`${v("r")} = ${frac(v("d"), 2)} = ${frac(2 * r, 2)} = {0} ${u}`, `${v("L")} = 2 · ${PI} · ${v("r")} = 2 · 3,14 · {=0} = {1} ${u}`];
    slots = [r, L];
    hint = `El radio es la mitad del diámetro: r = ${2 * r} : 2 = ${r} ${u}; L = 2 · 3,14 · ${r} = ${fmt(L)} ${u}`;
    fig = { show: "d", label: `${sv("d")} = ${2 * r} ${u}` };
    answer = `r = ${r} ${u}, L = ${fmt(L)} ${u}`;
  } else if (kind === 2) {
    prompt = "Calcula el área del círculo";
    lines = [`${v("A")} = ${PI} · ${v("r")}²`, `${v("A")} = 3,14 · {0}² = {1} ${u}²`];
    slots = [r, A];
    hint = `A = 3,14 · ${r}² = 3,14 · ${r * r} = ${fmt(A)} ${u}²`;
    fig = { show: "r", fill: true, label: `${sv("r")} = ${r} ${u}` };
    answer = `A = ${fmt(A)} ${u}²`;
  } else {
    prompt = "La circunferencia mide L. ¿Cuál es el radio?";
    lines = [`${v("L")} = 2 · ${PI} · ${v("r")} → ${v("r")} = ${frac(v("L"), `2 · ${PI}`)}`, `${v("r")} = ${frac("{0}", "6,28")} = {1} ${u}`];
    slots = [L, r];
    hint = `r = ${fmt(L)} : 6,28 = ${r} ${u} (porque 2 · 3,14 = 6,28)`;
    fig = { show: "L", label: `${sv("L")} = ${fmt(L)} ${u}` };
    answer = `r = ${r} ${u}`;
  }
  return { kind, r, u, L, A, lines, slots, hint, fig, prompt, answer };
}

// El círculo del libro: centro, radio o diámetro rotulado; en "al revés"
// se remarca la circunferencia y el radio es la incógnita.
function figure(f) {
  const R = 58;
  const seg = f.show === "d" ? `<line class="cc-seg" x1="${120 - R}" y1="70" x2="${120 + R}" y2="70"/>`
    : `<line class="cc-seg${f.show === "L" ? " cc-dash" : ""}" x1="120" y1="70" x2="${120 + R}" y2="70"/>`;
  const lab = f.show === "L"
    ? `<text class="cc-lab cc-big" x="120" y="146">${f.label}</text><text class="cc-lab" x="${120 + R / 2}" y="62">${sv("r")} = ?</text>`
    : `<text class="cc-lab" x="${f.show === "d" ? 120 : 120 + R / 2}" y="62">${f.label}</text>`;
  return `<svg class="cc-fig" viewBox="0 0 240 150" role="img" aria-label="círculo">
    <circle class="cc-circle${f.fill ? " cc-fill" : ""}${f.show === "L" ? " cc-thick" : ""}" cx="120" cy="70" r="${R}"/>
    ${seg}<circle class="cc-centre" cx="120" cy="70" r="3"/>${lab}
  </svg>`;
}

export function mountCircunferenciaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy, goNext = null;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body cc-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  // {k} = casilla k; {=k} = copia de lo escrito en la casilla k.
  const fill = (s) => s
    .replace(/\{(\d+)\}/g, (_, k) => `<button type="button" class="cc-slot" data-slot="${k}"></button>`)
    .replace(/\{=(\d+)\}/g, (_, k) => `<span class="cc-mirror" data-mirror="${k}"></span>`);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    goNext = null;
    const prev = round && JSON.stringify(round);
    do round = buildRound(Math.min(4, Math.floor(hits / 2)));
    while (JSON.stringify(round) === prev); // nunca la misma ronda dos veces seguidas
    typed = round.slots.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt cc-prompt">${round.prompt}</p>
      <div class="cc-cuaderno">
        ${figure(round.fig)}
        ${round.lines.map((l) => `<div class="cc-line">${fill(l)}</div>`).join("")}
      </div>
      <div class="keypad cc-keypad" data-keypad></div>
      <div class="feedback cc-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "⌫", "4", "5", "6", ",", "7", "8", "9", "0", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary cc-ok" : ""}`;
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
    body.querySelectorAll("[data-mirror]").forEach((m) => (m.textContent = typed[+m.dataset.mirror] || "□"));
  }

  function say(html, cls) {
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = html;
    fb.className = `feedback cc-feedback ${cls}`;
    return fb;
  }

  function pressKey(key) {
    if (finished || busy || !round) return;
    if (key === "✓") return enter();
    const t = typed[active];
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (key === ",") { if (!t.includes(",")) typed[active] = (t || "0") + ","; }
    else if (t.length < 7) typed[active] = t === "0" ? key : t + key;
    paint();
  }

  // ✓ con la casilla llena pasa al siguiente hueco; con todo lleno, corrige.
  function enter() {
    const n = typed.length;
    const next = [...Array(n).keys()].map((i) => (active + 1 + i) % n).find((i) => typed[i] === "");
    if (next === undefined) return check();
    if (typed[active] === "") return say("Escribe un número en la casilla marcada", "bad");
    active = next;
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    let allOk = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const k = +b.dataset.slot, want = round.slots[k];
      const ok = near(Number(typed[k].replace(",", ".")), want);
      allOk = allOk && ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${typed[k]}</s><em class="cc-fix">${fmt(want)}</em>`;
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
      goNext = () => { clearTimeout(pending); goNext = null; lives <= 0 ? finish(false) : nextRound(); };
      say(`Era ${round.answer}. 💡 ${round.hint} <button type="button" class="cc-next" data-next>Siguiente →</button>`, "bad")
        .querySelector("[data-next]").addEventListener("click", goNext);
      pending = setTimeout(goNext, 4000);
    }
  }

  // Teclado físico: cifras, coma (o punto), borrar, Enter.
  function onKey(e) {
    if (finished || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Enter" && goNext) return e.preventDefault(), goNext();
    const key = /^[0-9]$/.test(e.key) ? e.key : e.key === "," || e.key === "." ? "," : e.key === "Backspace" ? "⌫" : e.key === "Enter" ? "✓" : null;
    if (key) { e.preventDefault(); pressKey(key); }
  }

  function finish(userExited) {
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "circunferencia", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⭕</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} circunferencias bien calculadas de ${rounds}</p>
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
