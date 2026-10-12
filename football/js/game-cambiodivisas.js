// "Cambio de moneda": el cambio del día ("1 € = 1,10 $") y la tabla de
// proporcionalidad de dos filas del libro (€ | $) con la casilla que falta.
// De euros a la otra moneda se multiplica; al revés, se divide. En el
// último nivel, dos pasos: "Pago con 20 $ algo que vale 15 €: ¿cuánto me
// devuelven?". Se escribe con el teclado (con coma decimal). El 💡:
// "Multiplico por 1,10: 50 · 1,10 = 55 $".
import { randInt, pick, saveScore } from "./utils.js";

// Todo se calcula en céntimos para que no haya errores de redondeo.
const CUR = [
  { sym: "$", name: "dólares", rc: 110 },
  { sym: "£", name: "libras", rc: 85 },
  { sym: "¥", name: "yenes", rc: 16000 },
  { sym: "CHF", name: "francos suizos", rc: 95 },
];
// Céntimos → texto con punto de miles y coma decimal ("40,70", "4.000").
function money(c) {
  const s = String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return c % 100 ? `${s},${String(c % 100).padStart(2, "0")}` : s;
}
const row = (s) => `<div class="cv-row">${s}</div>`;
// Tabla de proporcionalidad de dos filas, con la flecha "· 1,10" del libro.
const table = (cur, e, f) =>
  `<div class="cv-wrap"><table class="cv-tabla"><tr><th>€</th><td>1</td><td>${e}</td></tr><tr><th>${cur.sym}</th><td>${money(cur.rc)}</td><td>${f}</td></tr></table><span class="cv-arrow">↓<br>· ${money(cur.rc)}</span></div>`;

// Niveles: 0 € → otra moneda, resultado entero · 1 con decimales ·
// 2 al revés (dividir) · 3 dos pasos: ¿cuánto me devuelven?
export function buildRound(level) {
  const cur = pick(CUR), R = money(cur.rc), yen = cur.sym === "¥";
  const rate = row(`1 € = ${R} ${cur.sym}`);
  if (level <= 1) {
    let ec;
    if (level === 0) ec = 100 * (yen ? randInt(1, 60) : cur.sym === "$" ? randInt(1, 20) * 10 : randInt(1, 20) * 20);
    else do ec = yen ? 100 * randInt(2, 60) + 50 : 100 * randInt(2, 99); while (!yen && (ec * cur.rc) % 10000 === 0); // con yenes los céntimos están en los euros
    const fc = (ec * cur.rc) / 100;
    return {
      level, cur, ec, answers: [fc], prompt: `De euros a ${cur.name}`,
      html: rate + table(cur, money(ec), "[0]"),
      hint: `Es proporcional: multiplico por ${R} → ${money(ec)} · ${R} = ${money(fc)} ${cur.sym}`,
    };
  }
  if (level === 2) {
    const ec = 100 * (yen ? randInt(1, 60) : randInt(2, 200)), fc = (ec * cur.rc) / 100;
    return {
      level, cur, fc, answers: [ec], prompt: `De ${cur.name} a euros`,
      html: rate + table(cur, "[0]", money(fc)),
      hint: `Ahora al revés: divido entre ${R} → ${money(fc)} : ${R} = ${money(ec)} € (comprueba: ${money(ec)} · ${R} = ${money(fc)})`,
    };
  }
  const ec = 100 * randInt(yen ? 3 : 4, yen ? 40 : 60), fc = (ec * cur.rc) / 100;
  const step = yen ? 100000 : pick([1000, 2000, 5000]); // billetes de 1.000 ¥ o de 10, 20, 50
  const pay = (Math.floor(fc / step) + 1) * step, back = pay - fc;
  return {
    level, cur, ec, pay, answers: [fc, back], prompt: "¿Cuánto me devuelven?",
    html: `<div class="cv-enun">Pago con <b>${money(pay)} ${cur.sym}</b> algo que vale <b>${money(ec)} €</b></div>` + rate +
      table(cur, money(ec), "[0]") + row(`me devuelven = ${money(pay)} − {0} = [1] ${cur.sym}`),
    hint: `Primero paso el precio: ${money(ec)} · ${R} = ${money(fc)} ${cur.sym}; me devuelven ${money(pay)} − ${money(fc)} = ${money(back)} ${cur.sym}`,
  };
}

export function mountCambiodivisasGame(container, { client, onExit }) {
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
    <div class="game-body cv-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const valid = (t) => /^\d+(,\d+)?$/.test(t);
  const cents = (t) => Math.round(Number(t.replace(",", ".")) * 100);

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.html;
    do round = buildRound(Math.min(3, Math.floor(hits / 3))); while (round.html === last);
    typed = round.answers.map(() => "");
    active = 0;
    busy = false;
    body.innerHTML = `
      <p class="prompt cv-prompt">${round.prompt}</p>
      <div class="cv-cuaderno">${round.html
        .replace(/\[(\d+)\]/g, (_, k) => `<button type="button" class="cv-slot" data-slot="${k}"></button>`)
        .replace(/\{(\d+)\}/g, (_, k) => `<span class="cv-echo" data-echo="${k}"></span>`)}</div>
      <div class="keypad cv-keypad" data-keypad></div>
      <div class="feedback cv-feedback" data-feedback></div>
    `;
    body.querySelectorAll("[data-slot]").forEach((b) => b.addEventListener("click", () => !busy && ((active = +b.dataset.slot), paint())));
    const pad = body.querySelector("[data-keypad]");
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0", "⌫", "✓"].forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `choice-btn keypad-key${key === "✓" ? " primary cv-ok" : ""}`;
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
    body.querySelectorAll("[data-echo]").forEach((e) => (e.textContent = typed[+e.dataset.echo] || "…"));
  }

  function pressKey(key) {
    if (finished || busy) return;
    const t = typed[active];
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = t.slice(0, -1);
    else if (key === ",") typed[active] = t.includes(",") ? t : (t || "0") + ",";
    else if (t.length < 8 && !/,\d\d$/.test(t)) typed[active] = t + key;
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
      feedback.className = "feedback bad cv-feedback";
      return;
    }
    busy = true;
    rounds++;
    let ok = true;
    body.querySelectorAll("[data-slot]").forEach((s) => {
      const i = +s.dataset.slot, good = cents(typed[i]) === round.answers[i];
      ok = ok && good;
      s.classList.remove("active");
      s.classList.add(good ? "good" : "bad");
      if (!good) s.innerHTML = `<s>${typed[i]}</s><span class="cv-want">${money(round.answers[i])}</span>`;
    });
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      feedback.innerHTML = `✓ 💡 ${round.hint}`;
      feedback.className = "feedback ok cv-feedback";
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      const after = () => (lives <= 0 ? finish(false) : nextRound());
      feedback.innerHTML = `💡 ${round.hint} <button type="button" class="cv-next" data-next>Siguiente →</button>`;
      feedback.className = "feedback bad cv-feedback";
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
    saveScore(client, "cambiodivisas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>💱</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} cambios bien hechos de ${rounds}</p>
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
