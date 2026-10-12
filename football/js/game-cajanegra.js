// "La caja negra": una máquina con una regla oculta. El jugador DECIDE qué
// experimentos hacer: teclea una entrada en un teclado propio, la mete en
// la máquina y apunta lo que sale. Tiene pocas pruebas (4, 3 o 2). Cuando
// cree saberlo pulsa "Ya lo sé" y la máquina le pide PREDECIR la salida de
// 3 entradas nuevas (una grande). Las 3 bien = +10; alguna mal = vida.
//
// Al fallar se enseña la tabla real junto a lo predicho, la regla escrita,
// un consejo de experimento y, comparando de verdad las reglas candidatas
// del nivel, si con sus pruebas había más de una regla posible.
import { randInt, pick, saveScore } from "./utils.js";

// ---------- reglas ----------
const fmtN = (n) => (n < 0 ? `−${-n}` : `${n}`);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const SIG_XS = range(-20, 130);

function mk(fam, f, txt, words) {
  const r = { fam, f, txt, words };
  r.sig = SIG_XS.map((x) => f(x)).join(",");
  return r;
}
function linTxt(a, b) {
  if (a === -1 && b > 0) return `${b} − x`;
  const ap = a === 1 ? "x" : a === -1 ? "−x" : `${fmtN(a)}·x`;
  return b === 0 ? ap : `${ap} ${b > 0 ? "+" : "−"} ${Math.abs(b)}`;
}
function linWords(a, b) {
  const head = a === -1 ? "le cambia el signo" : `lo multiplica por ${fmtN(a)}`;
  return b > 0 ? `${head} y suma ${b}` : b < 0 ? `${head} y resta ${-b}` : head;
}
const digsum = (x) => String(x).split("").reduce((s, d) => s + Number(d), 0);
const reverse = (x) => Number(String(x).split("").reverse().join(""));

const rAdd = (b) => mk("add", (x) => x + b, `x + ${b}`, `le suma ${b}`);
const rMul = (a) => mk("mul", (x) => a * x, `${a}·x`, `lo multiplica por ${a}`);
const rLin = (a, b, fam = "lin") => mk(fam, (x) => a * x + b, linTxt(a, b), linWords(a, b));
const rSq = (c) =>
  mk("sq", (x) => x * x + c, c ? `x·x + ${c}` : "x·x", c ? `lo multiplica por sí mismo y suma ${c}` : "lo multiplica por sí mismo");
const rSqm = () => mk("sqm", (x) => x * x - x, "x·x − x", "lo multiplica por sí mismo y le resta el propio número");
// Las reglas de cifras solo aceptan números ≥ 0 (devuelven null).
const rMod = (n) => mk("mod", (x) => (x < 0 ? null : x % n), `resto de x ÷ ${n}`, `da el resto de dividirlo entre ${n}`);
const rDig = () => mk("digsum", (x) => (x < 0 ? null : digsum(x)), "suma de cifras", "suma sus cifras");
const rRev = () => mk("rev", (x) => (x < 0 ? null : reverse(x)), "cifras al revés", "le da la vuelta a sus cifras");

const FAM = {
  add: () => range(1, 15).map(rAdd),
  mul: () => range(2, 10).map(rMul),
  lin: () => range(2, 9).flatMap((a) => range(1, 9).map((b) => rLin(a, b))),
  linN: () => [-3, -2, -1, 2, 3, 4, 5, 6].flatMap((a) => range(-10, 10).map((b) => rLin(a, b, "linN"))),
  sq: () => range(0, 9).map(rSq),
  sqm: () => [rSqm()],
  mod: () => range(2, 9).map(rMod),
  digsum: () => [rDig()],
  rev: () => [rRev()],
};
const CIFRAS = new Set(["mod", "digsum", "rev"]);

// Niveles: familias de reglas, pruebas disponibles y si hay tecla "−".
export const LEVELS = [
  { tries: 4, minus: false, fams: ["add"] },
  { tries: 3, minus: false, fams: ["mul"] },
  { tries: 3, minus: false, fams: ["lin"] },
  { tries: 3, minus: false, fams: ["sq", "sq", "sqm"] },
  { tries: 3, minus: false, fams: ["mod", "digsum", "rev"] },
  { tries: 2, minus: true, fams: ["linN"] },
  { tries: 3, minus: true, fams: ["add", "mul", "lin", "linN", "sq", "sqm", "mod", "digsum", "rev"] },
];
export const levelIdx = (level) => Math.min(Math.floor(level / 2), LEVELS.length - 1);

// Reglas candidatas de un nivel (sin repetidas: dos reglas con la misma
// tabla de valores cuentan como una).
const candCache = new Map();
export function candidates(li) {
  if (!candCache.has(li)) {
    const seen = new Set();
    const out = [];
    for (const f of new Set(LEVELS[li].fams))
      for (const r of FAM[f]())
        if (!seen.has(r.sig)) {
          seen.add(r.sig);
          out.push(r);
        }
    candCache.set(li, out);
  }
  return candCache.get(li);
}

export function pickRule(li) {
  const fam = pick(LEVELS[li].fams);
  let pool = FAM[fam]();
  // En el nivel de rectas con negativos, que sea de verdad "nueva".
  if (fam === "linN") pool = pool.filter((r) => /−/.test(r.txt));
  return pick(pool);
}

// Tres entradas para predecir: nuevas (no en la tabla), una grande, y tales
// que ninguna otra regla candidata del nivel acierte las tres.
export function predictInputs(rule, used, li) {
  const cands = candidates(li);
  const twoDig = () => {
    let x;
    do x = randInt(12, 98);
    while (x % 10 === 0 || x % 11 === 0);
    return x;
  };
  const threeDig = () => {
    let x;
    do x = randInt(102, 987);
    while (x % 10 === 0 || String(x)[0] === String(x)[2]);
    return x;
  };
  const big = (opts) => opts.find((x) => !used.has(x)) ?? randInt(30, 99);
  let xs = null;
  for (let t = 0; t < 600; t++) {
    if (CIFRAS.has(rule.fam)) xs = [twoDig(), twoDig(), threeDig()];
    else if (rule.fam === "sq" || rule.fam === "sqm") xs = [randInt(2, 9), randInt(2, 9), big(pick([[100, 20, 10], [20, 100, 10], [10, 20, 100]]))];
    else if (rule.fam === "linN") xs = [-randInt(1, 9), randInt(2, 12), big([100, 50, 20])];
    else xs = [randInt(0, 12), randInt(2, 12), big(pick([[100, 50, 20], [50, 100, 20]]))];
    if (new Set(xs).size < 3 || xs.some((x) => used.has(x))) continue;
    if (xs.some((x) => rule.f(x) === null)) continue;
    if (t < 500 && cands.some((c) => c.sig !== rule.sig && xs.every((x) => c.f(x) === rule.f(x)))) continue;
    return xs;
  }
  return xs;
}

// Consejo de experimento según la familia.
function tipFor(rule) {
  switch (rule.fam) {
    case "add":
      return "Probar con 0 te da de golpe lo que suma: lo que sale es la b.";
    case "mul":
      return "Probar con 1 te da de golpe el número por el que multiplica.";
    case "lin":
    case "linN":
      return "Probar con 0 te da la b de golpe; probar con 1 y 2 te da cuánto sube cada vez (la a).";
    case "sq":
    case "sqm":
      return "Prueba 0, 1, 2 y 3 y mira cuánto sube cada vez: si no sube siempre lo mismo no es una recta, hay un x·x escondido.";
    case "mod":
      return "Si con números grandes sale siempre algo pequeño, busca el patrón: si 5, 10 y 15 dan 0, es el resto entre 5.";
    case "digsum":
      return "Prueba con 23 y con 32: si dan lo mismo, la máquina mira las cifras sin importarle el orden.";
    case "rev":
      return "Prueba con un número de dos cifras distintas, como 12: si sale 21, le da la vuelta.";
  }
  return "";
}

// Análisis de ambigüedad: compara de verdad las reglas del nivel con la
// tabla de pruebas del jugador.
export function ambiguity(rule, table, li, preds, predXs) {
  const cands = candidates(li);
  const fits = (c) => table.every((r) => c.f(r.x) === r.y);
  const consistent = cands.filter(fits);
  const tableTxt = table.map((r) => `${fmtN(r.x)} → ${r.y === null ? "✖" : fmtN(r.y)}`).join(", ");
  // ¿La respuesta del jugador corresponde a alguna regla del nivel?
  const asIf = cands.find((c) => c.sig !== rule.sig && predXs.every((x, i) => c.f(x) === preds[i]));
  const others = consistent.filter((c) => c.sig !== rule.sig);
  if (others.length) {
    const other = asIf && fits(asIf) ? asIf : others[0];
    const usedX = new Set(table.map((r) => r.x));
    const tryXs = [...range(0, 12), ...(LEVELS[li].minus ? range(-5, -1) : []), ...range(13, 120)];
    const x = tryXs.find((v) => !usedX.has(v) && other.f(v) !== rule.f(v));
    const lead =
      asIf && other === asIf ? `Has contestado como si fuera ${other.txt}, que también encajaba con tus pruebas. ` : "";
    const n = others.length + 1;
    return `${lead}Con tus pruebas (${tableTxt}) valían ${n === 2 ? "dos reglas" : `${n} reglas`}, por ejemplo ${
      rule.txt
    } y ${other.txt}. No coinciden en ${fmtN(x)}: ${rule.txt} da ${fmtN(rule.f(x))} y ${other.txt} da ${
      other.f(x) === null ? "✖" : fmtN(other.f(x))
    }. Una prueba con ${fmtN(x)} lo habría aclarado.`;
  }
  if (asIf) {
    const bad = table.find((r) => asIf.f(r.x) !== r.y);
    return `Lo que has contestado sería ${asIf.txt}, pero esa regla no cumple tu prueba ${fmtN(bad.x)} → ${
      bad.y === null ? "✖" : fmtN(bad.y)
    } (daría ${asIf.f(bad.x) === null ? "✖" : fmtN(asIf.f(bad.x))}).`;
  }
  return `Con tus pruebas (${tableTxt}) solo encajaba una regla de este nivel: ya tenías pistas suficientes, revisa la cuenta.`;
}

// ---------- máquina SVG ----------
function machineSVG() {
  return `<svg class="cn-machine" viewBox="0 0 180 200" data-machine aria-label="máquina">
    <polygon class="cn-funnel" points="52,14 128,14 104,46 76,46"/>
    <rect class="cn-box" x="14" y="46" width="152" height="104" rx="16"/>
    <g transform="translate(40 74)"><circle class="cn-gear" r="13"/><circle class="cn-hub" r="4"/></g>
    <g transform="translate(140 74)"><circle class="cn-gear cn-gear2" r="13"/><circle class="cn-hub" r="4"/></g>
    <text class="cn-label" data-label x="90" y="112">?</text>
    <rect class="cn-chute" x="70" y="150" width="40" height="12" rx="3"/>
    <g transform="translate(90 18)"><g class="cn-tok cn-tok-in" data-tokin>
      <rect x="-30" y="-14" width="60" height="26" rx="8"/><text y="5" data-tokin-t></text></g></g>
    <g transform="translate(90 181)"><g class="cn-tok cn-tok-out" data-tokout>
      <rect x="-36" y="-14" width="72" height="26" rx="8"/><text y="5" data-tokout-t></text></g></g>
  </svg>`;
}

export function mountCajanegraGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let li = 0;
  let rule = null;
  let table = [];
  let triesLeft = 0;
  let mode = "probe"; // probe | predict | done
  let cur = "";
  let animating = false;
  let predXs = [];
  let preds = ["", "", ""];
  let sel = 0;
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body cn-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const $ = (s) => body.querySelector(s);

  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const accepted = () => table.filter((r) => r.y !== null).length;

  function setFeedback(text, cls) {
    const f = $("[data-feedback]");
    if (!f) return;
    f.textContent = text;
    f.className = `feedback ${cls}`;
  }

  function nextRound() {
    if (finished) return;
    body.classList.add("cn-body");
    li = levelIdx(level);
    rule = pickRule(li);
    table = [];
    triesLeft = LEVELS[li].tries;
    mode = "probe";
    cur = "";
    animating = false;
    preds = ["", "", ""];
    sel = 0;
    body.innerHTML = `
      <p class="prompt cn-prompt">¿Qué hace la máquina?<small>Mete números, mira lo que sale y descubre la regla</small></p>
      <div class="cn-top">
        ${machineSVG()}
        <div class="cn-table" data-table></div>
      </div>
      <div class="cn-tries" data-tries></div>
      <div class="cn-panel" data-panel></div>
      <div class="cn-keypad" data-keypad></div>
      <div class="cn-actions"><button type="button" class="secondary" data-know>Ya lo sé</button></div>
      <div class="feedback" data-feedback></div>
      <div class="cn-why" data-why></div>
    `;
    $("[data-know]").addEventListener("click", () => {
      if (mode === "probe" && !animating && accepted() > 0 && !finished) enterPredict();
      else if (mode === "predict") checkPreds();
    });
    renderKeypad();
    paintAll();
  }

  function renderKeypad() {
    const minus = LEVELS[li].minus;
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", minus ? "−" : "", "0", "⌫"];
    $("[data-keypad]").innerHTML = keys
      .map((k) =>
        k
          ? `<button type="button" class="cn-key${k === "⌫" ? " cn-key-del" : ""}" data-key="${k}">${k}</button>`
          : `<span class="cn-key-gap"></span>`
      )
      .join("");
    $("[data-keypad]")
      .querySelectorAll("[data-key]")
      .forEach((b) => b.addEventListener("click", () => press(b.dataset.key)));
  }

  // Edita una cadena numérica con una tecla.
  function edit(s, k, maxDigits) {
    if (k === "⌫") return s.slice(0, -1);
    if (k === "−") return s.startsWith("-") ? s.slice(1) : "-" + s;
    const digits = s.replace("-", "");
    if (digits.length >= maxDigits) return s;
    if (digits === "0") return s.replace(/0$/, k); // sin ceros a la izquierda
    return s + k;
  }

  function press(k) {
    if (finished || animating || mode === "done") return;
    if (k === "−" && !LEVELS[li].minus) return;
    if (mode === "probe") {
      cur = edit(cur, k, 3);
      setFeedback("", "");
    } else if (mode === "predict") {
      preds[sel] = edit(preds[sel], k, 6);
    }
    paintPanel();
  }

  function onKey(e) {
    if (finished || !body.querySelector("[data-keypad]")) return;
    if (/^[0-9]$/.test(e.key)) press(e.key);
    else if (e.key === "Backspace") press("⌫");
    else if (e.key === "-") press("−");
    else if (e.key === "Enter") {
      if (mode === "probe") feed();
      else if (mode === "predict") checkPreds();
    } else return;
    e.preventDefault();
  }
  window.addEventListener("keydown", onKey);

  function paintAll() {
    paintTable();
    paintTries();
    paintPanel();
  }

  function paintTable() {
    const rows = table
      .map(
        (r) =>
          `<div class="cn-row${r.y === null ? " cn-rej" : ""}"><span>${fmtN(r.x)}</span><b>${
            r.y === null ? "✖" : fmtN(r.y)
          }</b></div>`
      )
      .join("");
    $("[data-table]").innerHTML = `<div class="cn-row cn-head"><span>entra</span><b>sale</b></div>${
      rows || `<div class="cn-empty">Aún no has metido nada</div>`
    }`;
  }

  function paintTries() {
    const max = LEVELS[li].tries;
    const used = max - triesLeft;
    $("[data-tries]").innerHTML = `Pruebas: ${"●".repeat(used)}${"○".repeat(triesLeft)} <small>(${triesLeft} ${
      triesLeft === 1 ? "queda" : "quedan"
    })</small>`;
  }

  function paintPanel() {
    const panel = $("[data-panel]");
    const know = $("[data-know]");
    if (mode === "probe") {
      panel.innerHTML = `<div class="cn-feedrow">
          <div class="cn-display" data-display>${cur ? cur.replace("-", "−") : "<i>?</i>"}</div>
          <button type="button" class="primary cn-feed" data-feed>Meter ▶</button>
        </div>`;
      const fb = panel.querySelector("[data-feed]");
      fb.disabled = animating || triesLeft <= 0 || cur === "" || cur === "-";
      fb.addEventListener("click", feed);
      know.textContent = "Ya lo sé";
      know.className = "secondary";
      know.disabled = animating || accepted() === 0;
    } else if (mode === "predict") {
      panel.innerHTML = `<div class="cn-predtitle">Ahora tú eres la máquina: ¿qué sale?</div>
        <div class="cn-preds">${predXs
          .map(
            (x, i) => `<button type="button" class="cn-pred${i === sel ? " cn-sel" : ""}" data-pred="${i}">
              <span class="cn-px">${fmtN(x)}</span><span class="cn-arrow">→</span>
              <b class="cn-py" data-py>${preds[i] ? preds[i].replace("-", "−") : "?"}</b></button>`
          )
          .join("")}</div>`;
      panel.querySelectorAll("[data-pred]").forEach((b) =>
        b.addEventListener("click", () => {
          if (mode !== "predict") return;
          sel = Number(b.dataset.pred);
          paintPanel();
        })
      );
      know.textContent = "Comprobar";
      know.className = "primary";
      know.disabled = preds.some((p) => p === "" || p === "-");
    }
  }

  // Mete la entrada en la máquina, con animación.
  function feed() {
    if (finished || animating || mode !== "probe" || triesLeft <= 0) return;
    if (cur === "" || cur === "-") return;
    const x = Number(cur);
    const prev = table.find((r) => r.x === x);
    if (prev) {
      setFeedback(`Ya la probaste: ${fmtN(x)} → ${prev.y === null ? "✖" : fmtN(prev.y)}. Prueba otra.`, "bad");
      return;
    }
    const y = rule.f(x);
    animating = true;
    cur = "";
    setFeedback("", "");
    const svg = $("[data-machine]");
    const tokIn = svg.querySelector("[data-tokin]");
    const tokOut = svg.querySelector("[data-tokout]");
    svg.querySelector("[data-tokin-t]").textContent = fmtN(x);
    svg.querySelector("[data-tokout-t]").textContent = y === null ? "✖" : fmtN(y);
    tokOut.classList.remove("cn-pop", "cn-spit");
    tokIn.classList.remove("cn-drop");
    void svg.getBoundingClientRect();
    tokIn.classList.add("cn-drop");
    svg.classList.add("cn-working");
    paintPanel();
    later(() => {
      svg.classList.remove("cn-working");
      tokOut.classList.add(y === null ? "cn-spit" : "cn-pop");
    }, 700);
    later(() => {
      table.push({ x, y });
      if (y === null) setFeedback("La máquina escupe los negativos: esa no gasta prueba.", "bad");
      else triesLeft--;
      animating = false;
      paintAll();
      const last = $("[data-table]").lastElementChild;
      if (last) last.classList.add("cn-new");
      if (triesLeft <= 0) {
        setFeedback("¡Sin pruebas! Ahora a predecir.", "ok");
        animating = true;
        paintPanel();
        later(() => {
          animating = false;
          enterPredict();
        }, 900);
      }
    }, 1200);
  }

  function enterPredict() {
    if (finished || mode !== "probe") return;
    mode = "predict";
    predXs = predictInputs(rule, new Set(table.map((r) => r.x)), li);
    preds = ["", "", ""];
    sel = 0;
    setFeedback("", "");
    $("[data-tries]").innerHTML = `Has usado <b>${LEVELS[li].tries - triesLeft}</b> de ${LEVELS[li].tries} pruebas`;
    paintPanel();
  }

  function checkPreds() {
    if (finished || mode !== "predict" || preds.some((p) => p === "" || p === "-")) return;
    mode = "done";
    rounds++;
    const vals = preds.map(Number);
    const truth = predXs.map((x) => rule.f(x));
    const ok = truth.map((t, i) => t === vals[i]);
    const label = $("[data-label]");
    label.textContent = rule.txt;
    label.classList.add("cn-revealed");
    $("[data-know]").disabled = true;
    $("[data-keypad]").classList.add("cn-off");
    // Marca cada predicción.
    $("[data-panel]")
      .querySelectorAll("[data-pred]")
      .forEach((b, i) => {
        b.classList.remove("cn-sel");
        b.classList.add(ok[i] ? "cn-good" : "cn-bad");
        b.disabled = true;
      });
    if (ok.every(Boolean)) {
      score += 10;
      level++;
      renderScore();
      const used = LEVELS[li].tries - triesLeft;
      const spare = LEVELS[li].tries - used;
      setFeedback(`¡Las 3 bien! La regla era ${rule.txt}: ${rule.words}.`, "ok");
      if (spare > 0)
        $("[data-why]").innerHTML = `<div class="cn-bonus">🔍 ¡Detective! Con ${used === 1 ? "una sola prueba" : `solo ${used} pruebas`} de ${
          LEVELS[li].tries
        }</div>`;
      later(nextRound, spare > 0 ? 2300 : 1900);
      return;
    }
    lives--;
    renderLives();
    setFeedback(`✗ ${ok.filter((v) => !v).length === 1 ? "Una predicción falla" : "Fallan predicciones"}`, "bad");
    const rows = predXs
      .map(
        (x, i) =>
          `<tr class="${ok[i] ? "cn-tr-ok" : "cn-tr-bad"}"><td>${fmtN(x)}</td><td>${fmtN(vals[i])} ${
            ok[i] ? "✓" : "✗"
          }</td><td><b>${fmtN(truth[i])}</b></td></tr>`
      )
      .join("");
    $("[data-why]").innerHTML = `
      <table class="cn-cmp"><thead><tr><th>entra</th><th>tú</th><th>máquina</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="cn-rule">La regla era <b>${rule.txt}</b>: ${rule.words}.</p>
      <p class="cn-amb">${ambiguity(rule, table, li, vals, predXs)}</p>
      <p class="cn-tip">💡 ${tipFor(rule)}</p>
      <button type="button" class="primary cn-next" data-next>${lives <= 0 ? "Ver resultado" : "Siguiente ▶"}</button>
    `;
    $("[data-next]").addEventListener("click", () => {
      if (finished) return;
      if (lives <= 0) finish(false);
      else nextRound();
    });
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    timers.clear();
    if (userExited) return onExit();
    body.classList.remove("cn-body"); // el end-card va centrado, como en el resto
    saveScore(client, "cajanegra", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⬛</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} reglas descubiertas</p>
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
    level = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    timers.forEach(clearTimeout);
    timers.clear();
    window.removeEventListener("keydown", onKey);
  };
}
