// "De km/h a m/s": el cambio de unidades con la cadena de factores del
// libro, 72 km/h · (1.000 m / 1 km) · (1 h / 3.600 s) = □ m/s, con
// fracciones de raya. En los niveles bajos también hay casillas en el
// 1.000 y el 3.600; al corregir, las unidades que se van se tachan.
import { randInt, pick, saveScore } from "./utils.js";

const M = "−";
export function fmt(x) {
  const [i, d] = String(Math.round(Math.abs(x) * 10000) / 10000).split(".");
  return (x < 0 ? M : "") + i.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + (d ? "," + d : "");
}
// Factores de conversión: [numerador, unidad, denominador, unidad]
const F = {
  kmm: [1000, "m", 1, "km"], mkm: [1, "km", 1000, "m"],
  hs: [1, "h", 3600, "s"], sh: [3600, "s", 1, "h"],
  mcm: [100, "cm", 1, "m"], cmm: [1, "m", 100, "cm"],
  hmin: [1, "h", 60, "min"], mins: [1, "min", 60, "s"],
};

// Niveles: 0 km/h → m/s (múltiplos de 3,6, casillas en 1.000 y 3.600) ·
// 1 la inversa m/s → km/h · 2 con decimales (solo resultado) · 3 otras unidades.
export function buildRound(level) {
  let v, from, to, fs, hint;
  const dir = level === 0 ? 0 : level === 1 ? 1 : level === 2 ? randInt(0, 1) : 2;
  if (dir === 0) {
    v = level === 0 ? 18 * randInt(1, 10) : pick([9, 27, 45, 63, 81, 99, 117, 135]);
    [from, to, fs] = [["km", "h"], ["m", "s"], [F.kmm, F.hs]];
    hint = `km/h → m/s: 1 km = 1.000 m y 1 h = 3.600 s, así que se divide entre 3,6 (${fmt(v)} ÷ 3,6 = ${fmt(v / 3.6)})`;
  } else if (dir === 1) {
    v = level === 1 ? 5 * randInt(1, 10) : Math.random() < 0.5 ? pick([2.5, 7.5, 12.5, 17.5, 22.5]) : pick([3, 4, 6, 7, 8, 9, 11, 12, 13, 14]);
    [from, to, fs] = [["m", "s"], ["km", "h"], [F.mkm, F.sh]];
    hint = `m/s → km/h: se multiplica por 3,6 (${fmt(v)} · 3,6 = ${fmt(Math.round(v * 36) / 10)})`;
  } else {
    const k = randInt(0, 4);
    if (k === 0) { v = pick([2, 3, 4, 5, 1.5, 2.5, 0.8]); [from, to, fs] = [["m", "s"], ["cm", "s"], [F.mcm]]; hint = `1 m = 100 cm: ${fmt(v)} · 100 = ${fmt(v * 100)} cm/s`; }
    else if (k === 1) { v = pick([50, 150, 250, 300, 75, 120]); [from, to, fs] = [["cm", "s"], ["m", "s"], [F.cmm]]; hint = `100 cm = 1 m: ${fmt(v)} ÷ 100 = ${fmt(v / 100)} m/s`; }
    else if (k === 2) { v = pick([60, 90, 120, 150, 180, 240]); [from, to, fs] = [["km", "h"], ["km", "min"], [F.hmin]]; hint = `1 h = 60 min: ${fmt(v)} ÷ 60 = ${fmt(v / 60)} km/min`; }
    else if (k === 3) { v = pick([0.6, 1.2, 1.8, 3]); [from, to, fs] = [["km", "min"], ["m", "s"], [F.kmm, F.mins]]; hint = `1 km = 1.000 m y 1 min = 60 s: ${fmt(v)} · 1.000 ÷ 60 = ${fmt((v * 1000) / 60)} m/s`; }
    else { v = pick([6, 12, 30, 60, 90]); [from, to, fs] = [["km", "h"], ["m", "min"], [F.kmm, F.hmin]]; hint = `1 km = 1.000 m y 1 h = 60 min: ${fmt(v)} · 1.000 ÷ 60 = ${fmt((v * 1000) / 60)} m/min`; }
  }
  const want = Math.round(fs.reduce((x, f) => (x * f[0]) / f[2], v) * 10000) / 10000;
  // Casillas: en los niveles bajos, el número grande de cada factor; siempre, el resultado.
  const slots = [];
  if (level <= 1) fs.forEach((f, i) => slots.push({ f: i, part: f[0] === 1 ? 2 : 0, want: Math.max(f[0], f[2]) }));
  slots.push({ f: -1, want });
  return { v, from, to, fs, want, slots, hint };
}

export function mountKmhmsGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, vals, active, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats"><span class="lives" data-lives></span><span class="score" data-score>⭐ 0</span></div>
    </div>
    <div class="game-body km-body" data-body></div>`;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  // Unidad que se tacha al final (aparece arriba y abajo en la cadena)
  const unit = (u, gone) => `<span class="km-u${gone ? " km-gone" : ""}">${u}</span>`;

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(3, Math.floor(hits / 2)));
    vals = round.slots.map(() => "");
    active = 0;
    busy = false;
    const { v, from, to, fs } = round;
    const tops = [from[0], ...fs.map((f) => f[1])], bots = [from[1], ...fs.map((f) => f[3])];
    const gone = (u, top) => (top ? bots : tops).includes(u);
    const slotAt = (fi, part) => round.slots.findIndex((s) => s.f === fi && s.part === part);
    const num = (fi, part, n) => {
      const j = slotAt(fi, part);
      return j >= 0 ? `<button type="button" class="km-slot" data-slot="${j}"></button>` : fmt(n);
    };
    const chain = fs.map((f, i) => `<span class="km-dot">·</span><span class="km-frac"><span>${num(i, 0, f[0])} ${unit(f[1], gone(f[1], true))}</span><span>${num(i, 2, f[2])} ${unit(f[3], gone(f[3], false))}</span></span>`).join("");
    const last = round.slots.length - 1;
    body.innerHTML = `
      <p class="prompt km-prompt">${fmt(v)} ${from.join("/")} = ¿? ${to.join("/")}</p>
      <div class="km-cuaderno" data-sheet>
        <div class="km-chain"><span class="km-start">${fmt(v)} ${unit(from[0], gone(from[0], true))}/${unit(from[1], gone(from[1], false))}</span>${chain}</div>
        <div class="km-res">= <button type="button" class="km-slot km-big" data-slot="${last}"></button> ${to.join("/")}</div>
      </div>
      <div class="keypad km-keypad" data-keypad></div>
      <button type="button" class="choice-btn keypad-sign km-comma" data-comma>, coma decimal</button>
      <div class="feedback km-feedback" data-feedback></div>`;
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
    body.querySelector("[data-comma]").addEventListener("click", () => pressKey(","));
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      b.textContent = vals[+b.dataset.slot];
      b.classList.toggle("active", !busy && +b.dataset.slot === active);
    });
  }
  const filled = (v) => /\d/.test(v);
  const say = (html, cls) => {
    const fb = body.querySelector("[data-feedback]");
    fb.innerHTML = html;
    fb.className = `feedback km-feedback ${cls}`;
  };

  function pressKey(key) {
    if (finished) return;
    if (busy) return key === "✓" && body.querySelector("[data-next]")?.click();
    const v = vals[active];
    if (key === "✓") {
      if (vals.every(filled)) return check();
      if (!filled(v)) return say("Escribe un número en la casilla marcada", "bad");
      for (let k = 1; k <= vals.length; k++) if (!filled(vals[(active + k) % vals.length])) { active = (active + k) % vals.length; break; }
    } else if (key === "⌫") vals[active] = v.slice(0, -1);
    else if (key === ",") { if (!v.includes(",")) vals[active] = (v || "0") + ","; }
    else if (v.length < 7) vals[active] = v + key;
    say("", "");
    paint();
  }

  function check() {
    busy = true;
    rounds++;
    let allOk = true;
    round.slots.forEach((s, i) => {
      const b = body.querySelector(`[data-slot="${i}"]`);
      const ok = Math.abs(Number(vals[i].replace(",", ".")) - s.want) < 1e-9;
      allOk &&= ok;
      b.classList.remove("active");
      b.classList.add(ok ? "good" : "bad");
      if (!ok) b.innerHTML = `<s>${vals[i]}</s><b>${fmt(s.want)}</b>`;
    });
    body.querySelector("[data-sheet]").classList.add("km-done"); // se tachan las unidades
    if (allOk) {
      score += 10;
      hits++;
      renderScore();
      say(`✓ 💡 ${round.hint}`, "ok");
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      say(`✗ 💡 ${round.hint}<button class="primary km-next" data-next>${lives <= 0 ? "Ver resultado →" : "Siguiente →"}</button>`, "bad");
      body.querySelector("[data-next]").addEventListener("click", () => (lives <= 0 ? finish(false) : nextRound()));
    }
  }

  // Teclado físico: cifras, coma (o punto), retroceso y Enter.
  const onKey = (e) => {
    if (finished) return;
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "," || e.key === ".") pressKey(",");
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
    saveScore(client, "kmhms", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🚗</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cambios de unidades bien hechos de ${rounds}</p>
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
  };
}
