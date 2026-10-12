// "Lee y escribe fracciones": como en el libro de 3.º-5.º. Dos tipos de
// ronda alternos: (A) la fracción escrita con letras ("tres quintos") y
// casillas apiladas □/□ que se rellenan con el teclado; (B) la fracción
// dibujada (3/5 y su barra) y dos columnas de fichas, una con el
// numerador leído ("tres") y otra con el denominador ("quintos"): se toca
// una de cada columna y ✓. En el último nivel salen impropias y números
// mixtos ("un entero y dos tercios" → □ □/□).
import { randInt, shuffle, saveScore } from "./utils.js";

const CARD = ["cero", "un", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece",
  "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve", "veinte"];
const ORD = { 2: "medio", 3: "tercio", 4: "cuarto", 5: "quinto", 6: "sexto", 7: "séptimo", 8: "octavo", 9: "noveno", 10: "décimo" };
const plain = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
// Nombre del denominador: medio, tercio… décimo; del 11 en adelante, -avo (onceavo, dieciseisavo).
export const denName = (d, plural) => (d <= 10 ? ORD[d] : plain(CARD[d]) + "avo") + (plural ? "s" : "");
export function fracName(n, d) { return `${CARD[n]} ${denName(d, n !== 1)}`; }
export function mixedName(w, n, d) { return `${CARD[w]} ${w === 1 ? "entero" : "enteros"} y ${fracName(n, d)}`; }

// Niveles: 0 denominadores 2-5 · 1 hasta 10 · 2 de 11 a 20 (-avos) ·
// 3 impropias (7/5) y números mixtos (2 y 3/4). kind: "A" escribir, "B" leer.
export function buildRound(level, turn = 0) {
  const kind = turn % 2 ? "B" : "A";
  let w = 0, n, d;
  if (level === 0) d = randInt(2, 5);
  else if (level === 1) d = Math.random() < 0.7 ? randInt(6, 10) : randInt(2, 5);
  else if (level === 2) d = randInt(11, 20);
  else d = randInt(2, 10);
  if (level < 3) n = randInt(1, d - 1);
  else if (kind === "A" && turn % 4 === 2) { w = randInt(1, 3); n = randInt(1, d - 1); }
  else do n = randInt(d + 1, Math.min(20, 2 * d + 3)); while (n % d === 0);
  const text = w ? mixedName(w, n, d) : fracName(n, d);
  let hint = w
    ? `El entero se lee aparte y luego la fracción: ${w} y ${n}/${d} = "${text}"`
    : `El numerador se lee como número (${CARD[n]}) y el denominador como ordinal (${denName(d, n !== 1)}): ${n}/${d} = ${text}`;
  if (d === 2 || d === 3) hint += `. Ojo: el 2 son "medios" y el 3 "tercios"`;
  else if (d >= 11) hint += `. Del 11 en adelante se añade -avos: ${d} → ${denName(d, true)}`;
  if (n === 1 && !w) hint += `. Con un 1 arriba, en singular`;
  if (!w && n > d) hint += `. Es impropia: ${n} partes de ${d}, más de un entero`;
  const r = { kind, w, n, d, text, hint };
  if (kind === "B") {
    const pl = n !== 1;
    const nums = new Set([CARD[n]]);
    for (const x of [d, n + 1, n - 1, n + 2, n - 2, n + 3, n - 3]) if (nums.size < 4 && x >= 1 && x <= 20) nums.add(CARD[x]);
    const dens = new Set([denName(d, pl)]);
    const cands = [n >= 2 && n !== d ? n : 0, d + 1, d - 1, d + 2, d - 2, d + 3, d - 3].filter((x) => x >= 2 && x <= 20);
    if (!pl) dens.add(denName(d, true));
    for (const x of cands) if (dens.size < 4) dens.add(denName(x, pl));
    r.numChips = shuffle([...nums]);
    r.denChips = shuffle([...dens]);
  } else {
    const nLen = level >= 2 ? 2 : 1, dLen = level >= 1 ? 2 : 1;
    r.slots = (w ? [{ k: "w", want: w, len: 1 }] : []).concat([{ k: "n", want: n, len: nLen }, { k: "d", want: d, len: dLen }]);
  }
  return r;
}

export function mountLeefraccionesGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy, turn = 0, pickN, pickD;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body lf-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  // Barras de la fracción: un entero por barra, d partes, n pintadas en total.
  function bars(w, n, d) {
    const total = w * d + n, count = Math.ceil(total / d), W = 280, H = count > 2 ? 16 : 22;
    let out = "";
    for (let b = 0; b < count; b++) {
      const fill = Math.min(d, total - b * d);
      const ticks = Array.from({ length: d - 1 }, (_, i) => `<line x1="${((i + 1) * W) / d}" y1="0" x2="${((i + 1) * W) / d}" y2="${H}"/>`).join("");
      out += `<svg class="lf-bar" viewBox="0 0 ${W} ${H}"><rect class="lf-bg" width="${W}" height="${H}" rx="4"/><rect class="lf-fill" width="${(fill * W) / d}" height="${H}" rx="4"/><g class="lf-ticks">${ticks}</g><rect class="lf-frame" width="${W}" height="${H}" rx="4"/></svg>`;
    }
    return `<div class="lf-bars">${out}</div>`;
  }
  const fracHTML = (w, n, d) => `${w ? `<span class="lf-whole">${w}</span>` : ""}<span class="lf-frac"><span>${n}</span><span>${d}</span></span>`;

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.text;
    do round = buildRound(Math.min(3, Math.floor(hits / 3)), turn); while (round.text === last);
    turn++;
    busy = false;
    pickN = pickD = null;
    if (round.kind === "A") {
      typed = Object.fromEntries(round.slots.map((s) => [s.k, ""]));
      active = round.slots[0].k;
      const slot = (k) => `<button type="button" class="lf-slot" data-slot="${k}" aria-label="${k}"></button>`;
      body.innerHTML = `
        <p class="prompt lf-prompt">Escribe la fracción con números</p>
        <div class="lf-cuaderno">
          <div class="lf-words">${round.text}</div>
          <div class="lf-row">${round.w ? `<span class="lf-wslot">${slot("w")}</span>` : ""}<span class="lf-frac lf-fslots">${slot("n")}${slot("d")}</span></div>
          <div data-draw></div>
        </div>
        <div class="keypad lf-keypad" data-keypad></div>
        <div class="feedback lf-feedback" data-feedback></div>`;
      body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = b.dataset.slot), paint())));
      const pad = body.querySelector("[data-keypad]");
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"].forEach((key) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `choice-btn keypad-key${key === "✓" ? " primary" : ""}`;
        btn.textContent = key;
        btn.addEventListener("click", () => pressKey(key));
        pad.appendChild(btn);
      });
    } else {
      const col = (list, k) => list.map((t) => `<button type="button" class="lf-chip" data-${k}="${t}">${t}</button>`).join("");
      body.innerHTML = `
        <p class="prompt lf-prompt">¿Cómo se lee? Toca una ficha de cada columna</p>
        <div class="lf-cuaderno">
          <div class="lf-row lf-big">${fracHTML(0, round.n, round.d)}</div>
          ${bars(0, round.n, round.d)}
          <div class="lf-cols">
            <div class="lf-col"><small>numerador</small>${col(round.numChips, "num")}</div>
            <div class="lf-col"><small>denominador</small>${col(round.denChips, "den")}</div>
          </div>
        </div>
        <button type="button" class="primary lf-ok" data-ok>✓ Comprobar</button>
        <div class="feedback lf-feedback" data-feedback></div>`;
      body.querySelectorAll("[data-num]").forEach((b) => b.addEventListener("click", () => !busy && ((pickN = b.dataset.num), paint())));
      body.querySelectorAll("[data-den]").forEach((b) => b.addEventListener("click", () => !busy && ((pickD = b.dataset.den), paint())));
      body.querySelector("[data-ok]").addEventListener("click", check);
    }
    paint();
  }

  function paint() {
    if (round.kind === "A") {
      body.querySelectorAll("[data-slot]").forEach((b) => {
        b.textContent = typed[b.dataset.slot];
        b.classList.toggle("active", b.dataset.slot === active);
      });
    } else {
      body.querySelectorAll("[data-num]").forEach((b) => b.classList.toggle("picked", b.dataset.num === pickN));
      body.querySelectorAll("[data-den]").forEach((b) => b.classList.toggle("picked", b.dataset.den === pickD));
    }
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (round.kind !== "A") return;
    const s = round.slots.find((x) => x.k === active);
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < s.len) {
      typed[active] += key;
      // casilla llena: el foco salta solo a la siguiente (entero → numerador → denominador)
      const nextEmpty = round.slots.find((x) => typed[x.k] === "");
      if (typed[active].length === s.len && nextEmpty) active = nextEmpty.k;
    }
    paint();
  }

  function check() {
    if (finished || busy) return;
    const feedback = body.querySelector("[data-feedback]");
    let ok;
    if (round.kind === "A") {
      const empty = round.slots.find((s) => typed[s.k] === "");
      if (empty) {
        // ✓ con una casilla vacía: el foco pasa a ella (como un Enter)
        const wasFirst = typed[active] === "";
        active = empty.k;
        paint();
        if (wasFirst) { feedback.textContent = "Rellena todas las casillas"; feedback.className = "feedback bad"; }
        return;
      }
      ok = true;
      body.querySelectorAll("[data-slot]").forEach((b) => {
        const s = round.slots.find((x) => x.k === b.dataset.slot);
        const good = Number(typed[s.k]) === s.want;
        ok = ok && good;
        b.classList.remove("active");
        b.classList.add(good ? "good" : "bad");
        if (!good) b.innerHTML = `<s>${typed[s.k]}</s><em>${s.want}</em>`;
      });
      body.querySelector("[data-draw]").innerHTML = bars(round.w, round.n, round.d);
    } else {
      if (!pickN || !pickD) { feedback.textContent = "Elige una ficha de cada columna"; feedback.className = "feedback bad"; return; }
      const [wn, wd] = [CARD[round.n], denName(round.d, round.n !== 1)];
      ok = pickN === wn && pickD === wd;
      body.querySelectorAll("[data-num]").forEach((b) => b.classList.add(b.dataset.num === wn ? "good" : b.dataset.num === pickN ? "bad" : "dim"));
      body.querySelectorAll("[data-den]").forEach((b) => b.classList.add(b.dataset.den === wd ? "good" : b.dataset.den === pickD ? "bad" : "dim"));
    }
    busy = true;
    rounds++;
    const shown = round.w ? `${round.w} ${round.n}/${round.d}` : `${round.n}/${round.d}`;
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.textContent = `✓ ${shown} = ${round.text}. 💡 ${round.hint}`;
      feedback.className = "feedback ok";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      feedback.textContent = `Era ${shown} = ${round.text}. 💡 ${round.hint}`;
      feedback.className = "feedback bad";
      const nxt = document.createElement("button");
      nxt.type = "button";
      nxt.className = "secondary lf-next";
      nxt.textContent = "Siguiente →";
      nxt.addEventListener("click", advance);
      body.querySelector("[data-keypad], [data-ok]").replaceWith(nxt);
      pending = setTimeout(advance, 2500);
    }
  }

  // Tras un fallo: fin si no quedan vidas; si no, otra ronda.
  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
  }

  // Teclado físico: cifras, retroceso y Enter, igual que el de pantalla.
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
    // Con el end-card en pantalla, "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "leefracciones", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📖</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} fracciones bien leídas o escritas de ${rounds}</p>
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
    turn = 0;
    round = null;
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
