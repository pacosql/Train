// "Repartos proporcionales": el enunciado del libro ("Reparte 120 € entre
// Ana y Luis proporcionalmente a 2 y 3") y debajo el esquema de clase con
// casillas: total de partes = 2 + 3 = □; cada parte = 120 : 5 = □ €;
// Ana = 2 · 24 = □ €… Lo ya escrito se copia solo en las líneas de abajo
// (como cuando arrastras el número en el cuaderno). Inverso: primero las
// partes con el mcm (6 : 2 = □). El 💡 repite la cuenta con la comprobación.
import { randInt, shuffle, saveScore } from "./utils.js";

const NAMES = ["Ana", "Luis", "Eva", "Pablo", "Marta", "Hugo", "Lucía", "Leo"];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
const list = (a) => (a.length === 2 ? `${a[0]} y ${a[1]}` : `${a.slice(0, -1).join(", ")} y ${a[a.length - 1]}`);
const row = (s) => `<div class="rt-row">${s}</div>`;
const echo = (k) => `{${k}}`; // se pinta con lo que se ha escrito en la casilla k

// Niveles: 0 dos personas · 1 tres · 2 cantidades grandes (miles) ·
// 3 inversamente proporcional (dos personas, con el mcm) ·
// 4 "¿cuánto le toca a…?" directo, de una vez.
export function buildRound(level) {
  const n = level === 0 || level === 3 ? 2 : 3;
  const who = shuffle(NAMES.slice()).slice(0, n);
  let k, u;
  for (;;) {
    k = who.map(() => randInt(level === 3 ? 2 : 1, level >= 2 ? 9 : 6));
    if (new Set(k).size < n) continue; // proporciones distintas
    if (level === 3) { const m = (k[0] * k[1]) / gcd(k[0], k[1]); if (m > 30 || k[0] % k[1] === 0 && k[0] / k[1] > 5) continue; }
    break;
  }
  u = level === 2 ? randInt(2, 30) * 10 : level === 3 ? randInt(2, 12) * 5 : randInt(2, level === 4 ? 60 : 30);
  if (level === 3) {
    const m = (k[0] * k[1]) / gcd(k[0], k[1]), p = k.map((x) => m / x), S = p[0] + p[1], T = u * S;
    return {
      level, who, k, parts: p, T, u, answers: [p[0], p[1], S, u, p[0] * u, p[1] * u], prompt: "Reparto inversamente proporcional",
      html: `<div class="rt-enun">Reparte <b>${fmt(T)} €</b> entre ${list(who)} de forma <b class="rt-inv">inversamente</b> proporcional a <b>${k[0]}</b> y <b>${k[1]}</b></div>` +
        row(`mcm(${k[0]}, ${k[1]}) = ${m} → ${who[0]}: ${m} : ${k[0]} = [0] &nbsp; ${who[1]}: ${m} : ${k[1]} = [1]`) +
        row(`total de partes = ${echo(0)} + ${echo(1)} = [2]`) + row(`cada parte = ${fmt(T)} : ${echo(2)} = [3] €`) +
        who.map((w, i) => row(`${w} = ${echo(i)} · ${echo(3)} = [${4 + i}] €`)).join(""),
      hint: `Inversamente: quien tiene menos recibe más. mcm(${k[0]}, ${k[1]}) = ${m} → partes ${m} : ${k[0]} = ${p[0]} y ${m} : ${k[1]} = ${p[1]}; ${p[0]} + ${p[1]} = ${S}; ${fmt(T)} : ${S} = ${fmt(u)} €; ${who.map((w, i) => `${w} ${p[i]} · ${fmt(u)} = ${fmt(p[i] * u)} €`).join(", ")}`,
    };
  }
  const S = k.reduce((a, b) => a + b, 0), T = u * S;
  const enun = `<div class="rt-enun">Reparte <b>${fmt(T)} €</b> entre ${list(who)} proporcionalmente a ${list(k.map((x) => `<b>${x}</b>`))}</div>`;
  const sumRow = row(`total de partes = ${k.join(" + ")} = [0]`);
  const base = `${k.join(" + ")} = ${S} partes; ${fmt(T)} : ${S} = ${fmt(u)} € cada parte`;
  if (level === 4) {
    const j = randInt(0, n - 1);
    return {
      level, who, k, T, u, j, answers: [S, k[j] * u], prompt: `¿Cuánto le toca a ${who[j]}?`,
      html: enun + sumRow + row(`${who[j]} = <span class="rt-frac"><span>${fmt(T)} · ${k[j]}</span><span>${echo(0)}</span></span> = [1] €`),
      hint: `${base}; a ${who[j]} le tocan ${k[j]} · ${fmt(u)} = ${fmt(k[j] * u)} €`,
    };
  }
  return {
    level, who, k, T, u, answers: [S, u, ...k.map((x) => x * u)], prompt: "Reparto directamente proporcional",
    html: enun + sumRow + row(`cada parte = ${fmt(T)} : ${echo(0)} = [1] €`) + who.map((w, i) => row(`${w} = ${k[i]} · ${echo(1)} = [${2 + i}] €`)).join(""),
    hint: `${base}; ${who.map((w, i) => `${w} ${k[i]} · ${fmt(u)} = ${fmt(k[i] * u)} €`).join(", ")} (${k.map((x) => fmt(x * u)).join(" + ")} = ${fmt(T)})`,
  };
}

export function mountRepartoGame(container, { client, onExit }) {
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
    <div class="game-body rt-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const valid = (t) => /^\d+$/.test(t);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.html;
    do round = buildRound(Math.min(4, Math.floor(hits / 3))); while (round.html === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt rt-prompt">${round.prompt}</p>
      <div class="rt-cuaderno">${round.html
        .replace(/\[(\d+)\]/g, (_, k) => `<button type="button" class="rt-slot" data-slot="${k}"></button>`)
        .replace(/\{(\d+)\}/g, (_, k) => `<span class="rt-echo" data-echo="${k}"></span>`)}</div>
      <div class="keypad rt-keypad" data-keypad></div>
      <div class="feedback rt-feedback" data-feedback></div>
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
      b.textContent = fmt(typed[+b.dataset.slot]);
      b.classList.toggle("active", +b.dataset.slot === active);
    });
    body.querySelectorAll("[data-echo]").forEach((e) => (e.textContent = typed[+e.dataset.echo] ? fmt(typed[+e.dataset.echo]) : "…"));
  }

  function pressKey(key) {
    if (finished || busy) return;
    const t = typed[active];
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (t.length < 6 && !(t === "0")) typed[active] = t + key;
    paint();
  }

  function check() {
    const feedback = body.querySelector("[data-feedback]");
    if (!typed.every(valid)) {
      // ✓ con la casilla llena: el foco salta a la siguiente vacía (en orden).
      if (valid(typed[active])) {
        active = typed.map((_, k) => (active + 1 + k) % typed.length).find((k) => !valid(typed[k]));
        return paint();
      }
      feedback.textContent = "Escribe un número en la casilla";
      feedback.className = "feedback bad rt-feedback";
      return;
    }
    busy = true;
    rounds++;
    let ok = true;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const i = +s.dataset.slot, good = Number(typed[i]) === round.answers[i];
      ok = ok && good;
      s.classList.remove("active");
      s.classList.add(good ? "good" : "bad");
      if (!good) s.innerHTML = `<s>${fmt(typed[i])}</s><span class="rt-want">${fmt(round.answers[i])}</span>`;
    });
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok rt-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.innerHTML = `💡 ${round.hint} <button type="button" class="rt-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad rt-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", () => { clearTimeout(pending); after(); });
      pending = setTimeout(after, 4000);
    }
  }

  // Teclado físico: cifras, ⌫, Enter y flechas.
  function onKey(e) {
    if (finished || !round) return;
    if (busy) {
      if (e.key === "Enter") body.querySelector("[data-next]")?.click();
      return;
    }
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "Backspace") pressKey("⌫");
    else if (e.key === "Enter") pressKey("✓");
    else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      active = (active + (e.key === "ArrowRight" ? 1 : typed.length - 1)) % typed.length;
      paint();
    } else return;
    e.preventDefault();
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    window.removeEventListener("keydown", onKey);
    if (userExited) return onExit();
    saveScore(client, "reparto", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🤝</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} repartos bien hechos de ${rounds}</p>
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
    round = null;
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
