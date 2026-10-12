// "Interés simple": el enunciado ("1.000 € al 3 % durante 2 años") y la
// fórmula del libro I = C · r · t / 100 escrita como fracción, con casillas
// para sustituir (r y t) y para el resultado. Con meses se divide entre
// 1.200; luego el capital final C + I, despejar r o t y, al final, el
// interés compuesto a 2 años Cf = C · (1 + r/100)². El 💡 lo cuenta año a
// año: "Cada año gana el 3 % de 1.000 = 30 €; en 2 años, 60 €".
import { randInt, pick, saveScore } from "./utils.js";

// Números como en el libro: punto de miles y coma decimal (hasta 2 decimales).
function fmt(x) {
  const c = Math.round(x * 100), int = Math.floor(c / 100), dec = c % 100;
  const s = String(int).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return dec ? `${s},${String(dec).padStart(2, "0").replace(/0$/, "")}` : s;
}
const money = (x) => (Number.isInteger(Math.round(x * 100) / 100) ? fmt(x) : fmt(x).replace(/,(\d)$/, ",$10"));
const fr = (a, b) => `<span class="is-frac"><span>${a}</span><span>${b}</span></span>`;
const row = (s) => `<div class="is-row">${s}</div>`;
const I_ = "<i>I</i>", C_ = "<i>C</i>", R_ = "<i>r</i>", T_ = "<i>t</i>", CF = "<i>C</i><sub>f</sub>";
const yrs = (t) => `${t} año${t > 1 ? "s" : ""}`;

// Niveles: 0 años · 1 meses (entre 1.200) · 2 también el capital final ·
// 3 despejar r o t · 4 interés compuesto a 2 años.
export function buildRound(level) {
  let C, r, t;
  if (level === 4) {
    C = randInt(5, 50) * 100; r = randInt(1, 9);
    const f = (100 + r) / 100, Cf = (C * (100 + r) ** 2) / 10000, y1 = (C * (100 + r)) / 100;
    return {
      level, C, r, answers: [f, Cf], prompt: "Interés compuesto: ¿cuánto tendré?",
      html: `<div class="is-enun"><b>${fmt(C)} €</b> al <b>${r} %</b> de interés <b>compuesto</b> durante <b>2 años</b></div>` +
        row(`${CF} = ${C_} · (1 + ${fr(R_, "100")})<sup>2</sup>`) + row(`${CF} = ${fmt(C)} · [0]<sup>2</sup> = [1] €`),
      hint: `1 + ${r}/100 = ${fmt(f)}. Año 1: ${fmt(C)} · ${fmt(f)} = ${money(y1)} €; año 2: ${money(y1)} · ${fmt(f)} = ${money(Cf)} € (los intereses también ganan intereses)`,
    };
  }
  const months = level === 1 || (level >= 2 && Math.random() < 0.3);
  for (;;) {
    C = randInt(level >= 2 ? 3 : 1, level >= 2 ? 120 : 50) * 100;
    r = randInt(1, 9);
    t = months ? pick([1, 2, 3, 4, 6, 8, 9, 10]) : randInt(2, 6);
    if (!months || (C * r * t) % 1200 === 0) break;
  }
  const den = months ? 1200 : 100, I = (C * r * t) / den, perYear = (C * r) / 100;
  const tTxt = months ? `${t} ${t > 1 ? "meses" : "mes"}` : yrs(t);
  const enun = `<div class="is-enun"><b>${fmt(C)} €</b> al <b>${r} %</b> anual durante <b>${tTxt}</b></div>`;
  const law = row(`${I_} = ${fr(`${C_} · ${R_} · ${T_}`, fmt(den))}${months ? ' <small class="is-note">(<i>t</i> en meses)</small>' : ""}`);
  const why = months
    ? `En un año ganaría el ${r} % de ${fmt(C)} = ${fmt(perYear)} €; ${t} ${t > 1 ? "meses son" : "mes es"} ${t}/12 de año → ${fmt(perYear)} · ${t} : 12 = ${money(I)} €`
    : `Cada año gana el ${r} % de ${fmt(C)} = ${fmt(perYear)} €; en ${yrs(t)}, ${fmt(perYear)} · ${t} = ${fmt(I)} €`;
  if (level === 3) {
    // Despejar: se dan C, I y uno de r o t; se pide el otro.
    const askR = Math.random() < 0.5;
    const enun3 = `<div class="is-enun"><b>${fmt(C)} €</b> ${askR ? `durante <b>${tTxt}</b>` : `al <b>${r} %</b>`} han dado <b>${money(I)} €</b> de interés. ¿${askR ? "A qué %" : `Cuánto${months ? "s meses" : "s años"}`}?</div>`;
    const top = `100 · ${months ? "12 · " : ""}${I_}`, top2 = `100 · ${months ? "12 · " : ""}`;
    return {
      level, C, r, t, I, months, askR, answers: [askR ? t : r, askR ? r : t], prompt: askR ? "Despeja el rédito r" : "Despeja el tiempo t",
      html: enun3 + row(`${askR ? R_ : T_} = ${fr(top, `${C_} · ${askR ? T_ : R_}`)} = ${fr(`${top2}${money(I)}`, `${fmt(C)} · [0]`)} = [1]${askR ? " %" : ""}`),
      hint: `${why}. Al revés: ${askR ? R_ : T_} = ${top2}${money(I)} : (${fmt(C)} · ${askR ? t : r}) = ${askR ? `${r} %` : `${tTxt}`}`,
    };
  }
  const sub = row(`${I_} = ${fr(`${fmt(C)} · [0] · [1]`, fmt(den))} = [2] €`);
  if (level === 2) {
    return {
      level, C, r, t, I, months, answers: [r, t, I, C + I], prompt: "Interés y capital final",
      html: enun + law + sub + row(`${CF} = ${C_} + ${I_} = [3] €`),
      hint: `${why}; al final tiene ${fmt(C)} + ${money(I)} = ${money(C + I)} €`,
    };
  }
  return { level, C, r, t, I, months, answers: [r, t, I], prompt: "Calcula el interés simple", html: enun + law + sub, hint: why };
}

export function mountInteresGame(container, { client, onExit }) {
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
    <div class="game-body is-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const valid = (t) => /^\d+(,\d+)?$/.test(t);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.html;
    do round = buildRound(Math.min(4, Math.floor(hits / 3))); while (round.html === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt is-prompt">${round.prompt}</p>
      <div class="is-cuaderno">${round.html.replace(/\[(\d+)\]/g, (_, k) => `<button type="button" class="is-slot" data-slot="${k}"></button>`)}</div>
      <div class="keypad is-keypad" data-keypad></div>
      <div class="feedback is-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary is-ok" : ""}`;
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
    if (finished || busy) return;
    const t = typed[active];
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (key === ",") typed[active] = t.includes(",") ? t : (t || "0") + ",";
    else if (t.length < 8) typed[active] = t + key;
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
      feedback.className = "feedback bad is-feedback";
      return;
    }
    busy = true;
    rounds++;
    let ok = true;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const i = +s.dataset.slot, want = round.answers[i];
      // Se compara en céntimos: 1060,9 y 1060,90 valen igual.
      const good = Math.round(Number(typed[i].replace(",", ".")) * 100) === Math.round(want * 100);
      ok = ok && good;
      s.classList.remove("active");
      s.classList.add(good ? "good" : "bad");
      if (!good) s.innerHTML = `<s>${typed[i]}</s><span class="is-want">${fmt(want)}</span>`;
    });
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok is-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.innerHTML = `💡 ${round.hint} <button type="button" class="is-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad is-feedback";
      feedback.querySelector("[data-next]").addEventListener("click", () => { clearTimeout(pending); after(); });
      pending = setTimeout(after, 4000);
    }
  }

  // Teclado físico: cifras, coma (o punto), ⌫, Enter y flechas.
  function onKey(e) {
    if (finished || !round) return;
    if (busy) {
      if (e.key === "Enter") body.querySelector("[data-next]")?.click();
      return;
    }
    if (/^[0-9]$/.test(e.key)) pressKey(e.key);
    else if (e.key === "," || e.key === ".") pressKey(",");
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
    saveScore(client, "interes", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🏦</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cuentas del banco bien hechas de ${rounds}</p>
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
