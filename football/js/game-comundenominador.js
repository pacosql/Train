// "Común denominador": reducir a común denominador como en el libro de
// 5.º-1.º ESO. Se ven 3/4 y 5/6; primero se escribe el m.c.m. de los
// denominadores (la casilla de arriba) y ese número baja solo a los
// denominadores nuevos; luego los numeradores □/12 y □/12. Al corregir
// aparece debajo de cada una "12 ÷ 4 = 3, 3 × 3 = 9". En rondas alternas,
// tras reducir bien, "¿Cuál es mayor?": se toca una de las dos.
import { randInt, shuffle, saveScore } from "./utils.js";

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const lcm = (a, b) => (a * b) / gcd(a, b);
const num = (d) => { let n; do n = randInt(1, d - 1); while (gcd(n, d) !== 1); return n; };

// Niveles: 0 un denominador múltiplo del otro · 1 primos entre sí (mcm = producto) ·
// 2 mcm de verdad (4 y 6 → 12) · 3 tres fracciones.
export function buildRound(level, turn = 0) {
  let dens;
  for (;;) {
    if (level === 0) { const a = randInt(2, 6); dens = [a, a * randInt(2, 3)]; }
    else if (level === 1) dens = [randInt(2, 9), randInt(2, 9)];
    else if (level === 2) dens = [randInt(4, 12), randInt(4, 12)];
    else dens = [randInt(2, 12), randInt(2, 12), randInt(2, 12)];
    const m = dens.reduce(lcm);
    if (new Set(dens).size !== dens.length || dens.includes(m) !== (level === 0) || m > 60) continue;
    const [a, b] = dens;
    if (level === 1 && gcd(a, b) !== 1) continue;
    if (level === 2 && (gcd(a, b) === 1 || m === a * b)) continue;
    if (level === 3 && dens.some((x) => x === m)) continue;
    break;
  }
  dens = shuffle(dens);
  const m = dens.reduce(lcm);
  const fr = dens.map((d) => { const n = num(d); return { n, d, f: m / d, N: (n * m) / d }; });
  const compare = fr.length === 2 && turn % 2 === 1 && fr[0].N !== fr[1].N;
  const why = level === 0 ? `${m} es múltiplo de ${dens.find((x) => x !== m)}, así que el m.c.m. es ${m}`
    : level === 1 ? `${dens[0]} y ${dens[1]} no tienen divisores comunes: m.c.m. = ${dens[0]} × ${dens[1]} = ${m}`
    : `m.c.m.(${dens.join(", ")}) = ${m}`;
  const steps = fr.map(({ n, d, f, N }) => `${n}/${d} = ${N}/${m} porque ${d} × ${f} = ${m} y ${n} × ${f} = ${N}`).join("; ");
  const slots = [{ k: "m", want: m }].concat(fr.map((x, i) => ({ k: `n${i}`, want: x.N })));
  return { level, dens, m, fr, compare, slots, hint: `${why}. ${steps}` };
}

export function mountComundenominadorGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, typed, active, busy, phase, turn = 0;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body cdn-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const frac = (a, b) => `<span class="cdn-frac"><span>${a}</span><span>${b}</span></span>`;
  const slot = (k) => `<button type="button" class="cdn-slot" data-slot="${k}" aria-label="${k}"></button>`;

  function nextRound() {
    if (finished) return;
    clearTimeout(pending);
    const last = round && round.fr.map((x) => `${x.n}/${x.d}`).join();
    do round = buildRound(Math.min(3, Math.floor(hits / 3)), turn); while (round.fr.map((x) => `${x.n}/${x.d}`).join() === last);
    turn++;
    typed = Object.fromEntries(round.slots.map((s) => [s.k, ""]));
    active = "m";
    busy = false;
    phase = "reduce";
    const { fr, dens } = round;
    body.innerHTML = `
      <p class="prompt cdn-prompt" data-prompt>Reduce a común denominador</p>
      <div class="cdn-cuaderno">
        <div class="cdn-row">${fr.map((x) => frac(x.n, x.d)).join(`<span class="cdn-sep">,</span>`)}</div>
        <div class="cdn-mcm">m.c.m.(${dens.join(", ")}) = ${slot("m")}</div>
        <div class="cdn-row">${fr.map((x, i) => `<div class="cdn-col" data-col="${i}"><span class="cdn-frac">${slot(`n${i}`)}<span class="cdn-den" data-den></span></span><small class="cdn-step" data-step></small></div>`).join(`<span class="cdn-sep">,</span>`)}</div>
      </div>
      <div class="keypad cdn-keypad" data-keypad></div>
      <div class="feedback cdn-feedback" data-feedback></div>`;
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
    paint();
  }

  function paint() {
    body.querySelectorAll("[data-slot]").forEach((b) => {
      if (!b.classList.contains("good") && !b.classList.contains("bad")) b.textContent = typed[b.dataset.slot];
      b.classList.toggle("active", !busy && b.dataset.slot === active);
    });
    // el m.c.m. escrito baja solo a los denominadores nuevos
    body.querySelectorAll("[data-den]").forEach((s) => (s.textContent = typed.m || " "));
  }

  function pressKey(key) {
    if (finished || busy) return;
    if (key === "✓") return check();
    if (key === "⌫") typed[active] = typed[active].slice(0, -1);
    else if (typed[active].length < 2) {
      typed[active] += key;
      const nextEmpty = round.slots.find((x) => typed[x.k] === "");
      if (typed[active].length === 2 && nextEmpty) active = nextEmpty.k;
    }
    paint();
  }

  function check() {
    if (finished || busy) return;
    const feedback = body.querySelector("[data-feedback]");
    const empty = round.slots.find((s) => typed[s.k] === "");
    if (empty) {
      const wasEmpty = typed[active] === "";
      active = empty.k;
      paint();
      if (wasEmpty) { feedback.textContent = "Primero el m.c.m. y luego los numeradores"; feedback.className = "feedback bad"; }
      return;
    }
    busy = true;
    let ok = true;
    body.querySelectorAll("[data-slot]").forEach((b) => {
      const s = round.slots.find((x) => x.k === b.dataset.slot);
      const good = Number(typed[s.k]) === s.want;
      ok = ok && good;
      b.classList.remove("active");
      b.classList.add(good ? "good" : "bad");
      if (!good) b.innerHTML = `<s>${typed[s.k]}</s><em>${s.want}</em>`;
    });
    body.querySelectorAll("[data-den]").forEach((s) => (s.textContent = round.m));
    body.querySelectorAll("[data-step]").forEach((s, i) => {
      const { n, d, f, N } = round.fr[i];
      s.innerHTML = `${round.m} ÷ ${d} = ${f}<br>${n} × ${f} = ${N}`;
    });
    if (!ok) return fail(`Era ${round.fr.map((x) => `${x.N}/${round.m}`).join(" y ")}. 💡 ${round.hint}`);
    if (!round.compare) return win(`✓ 💡 ${round.hint}`);
    // Segunda parte: con el mismo denominador ya se ve cuál es mayor.
    phase = "compare";
    body.querySelector("[data-prompt]").textContent = "¿Cuál es mayor? Toca la fracción";
    feedback.textContent = `✓ ${round.fr.map((x) => `${x.n}/${x.d} = ${x.N}/${round.m}`).join(" y ")}`;
    feedback.className = "feedback ok";
    const pad = body.querySelector("[data-keypad]");
    pad.className = "cdn-pick";
    pad.innerHTML = round.fr.map((x, i) => `<button type="button" class="choice-btn cdn-big" data-pick="${i}">${frac(x.n, x.d)}</button>`).join("");
    pad.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => choose(+b.dataset.pick)));
  }

  function choose(i) {
    if (finished || phase !== "compare") return;
    phase = "done";
    const [a, b] = round.fr, big = a.N > b.N ? 0 : 1, B = round.fr[big], S = round.fr[1 - big];
    body.querySelectorAll("[data-pick]").forEach((el) => {
      if (+el.dataset.pick === big) el.classList.add("correct");
      else if (+el.dataset.pick === i) el.classList.add("wrong");
    });
    const hint = `💡 Con el mismo denominador gana el numerador mayor: ${B.N}/${round.m} > ${S.N}/${round.m}, así que ${B.n}/${B.d} > ${S.n}/${S.d}`;
    i === big ? win(`✓ ${hint}`) : fail(hint);
  }

  function win(text) {
    const feedback = body.querySelector("[data-feedback]");
    rounds++;
    score += 10;
    hits++;
    renderScore();
    feedback.textContent = text;
    feedback.className = "feedback ok";
    pending = setTimeout(nextRound, 900);
  }

  function fail(text) {
    const feedback = body.querySelector("[data-feedback]");
    rounds++;
    lives--;
    renderLives();
    feedback.textContent = text;
    feedback.className = "feedback bad";
    const nxt = document.createElement("button");
    nxt.type = "button";
    nxt.className = "secondary cdn-next";
    nxt.textContent = "Siguiente →";
    nxt.addEventListener("click", advance);
    const holder = body.querySelector("[data-keypad]");
    holder.className === "cdn-pick" ? holder.after(nxt) : holder.replaceWith(nxt);
    pending = setTimeout(advance, 2500);
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
    saveScore(client, "comundenominador", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🟰</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} reducciones bien de ${rounds}</p>
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
