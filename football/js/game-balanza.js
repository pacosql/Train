// #6 "Predice la balanza" (Igualdad y pesos) — v5, REHECHO desde la raíz.
// v2-v4 eran variaciones de la MISMA mecánica: girar un dial (±1/±5) que
// fija x hasta que la balanza quedara nivelada, con un presupuesto de
// ajustes. Se marcó 🔧 cuatro veces: v3 ató el presupuesto al coste óptimo,
// v4 engordó la cuerda de los platos… y seguía sin convencer, porque el
// gesto de fondo era tantear un dial y mirar si la viga se movía. Además
// "quitar lo mismo de los dos lados" ya lo cubre a fondo #164 (ecuacion).
// v5 cambia el gesto: cada ronda son DOS pesadas con sacos idénticos de
// peso desconocido x y un juego de pesas. La pesada 1 (equilibrada) define
// x; la pesada 2 aparece BLOQUEADA con un candado y hay que PREDECIR qué
// hará (cae la izquierda / equilibrada / cae la derecha) antes de soltarla.
// Predecir obliga a razonar con la igualdad (sacar x y comparar los platos);
// no hay nada que tantear porque la balanza no se mueve hasta que decides.
// Nivel 4 (inversión): ninguna de las dos pesadas está equilibrada — son
// dos desigualdades observadas — y hay que elegir el único x candidato que
// cuadra con LAS DOS (cada distractor cuadra con una sola). Con una
// referencia equilibrada el nivel 4 sería trivial: ella sola fija x y la
// inclinación sobraría; por eso aquí la referencia también se inclina.
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const TILTS = ["left", "equal", "right"];
const MIN_X = 2;
const MAX_X = 9;

export function balanzaLevelFor(streak) {
  return streak >= 9 ? 4 : streak >= 5 ? 3 : streak >= 2 ? 2 : 1;
}

// Inclinación de un plato "kl sacos + al kg" contra "kr sacos + ar kg" si
// cada saco pesa x. Es LA función que el jugador reproduce de cabeza.
export function tiltOf(test, x) {
  const l = test.kl * x + test.al;
  const r = test.kr * x + test.ar;
  return l === r ? "equal" : l > r ? "left" : "right";
}

// La referencia se guarda como k sacos + a kg (izquierda) contra m sacos +
// b kg (derecha); en los niveles 1-3 está equilibrada y k > m, así que
// (k - m)·x = b - a tiene una única solución.
export function refTilt(ref, x) {
  return tiltOf({ kl: ref.k, al: ref.a, kr: ref.m, ar: ref.b }, x);
}

function makeRef(level, x) {
  if (level === 1) {
    const k = randInt(2, 4);
    return { k, a: 0, m: 0, b: k * x };
  }
  if (level === 2) {
    const k = randInt(2, 4);
    const a = randInt(1, 9);
    return { k, a, m: 0, b: k * x + a };
  }
  const m = randInt(1, 2);
  const d = randInt(1, 2);
  const a = randInt(0, 6);
  return { k: m + d, a, m, b: a + d * x };
}

function samePans(t, ref) {
  return (t.kl === ref.k && t.al === ref.a && t.kr === ref.m && t.ar === ref.b)
    || (t.kl === ref.m && t.al === ref.b && t.kr === ref.k && t.ar === ref.a);
}

// Una pesada "interesante": los sacos y las pesas tiran en sentidos
// opuestos (si un plato tuviera más sacos Y más pesas se vería a ojo), y el
// resultado depende de x dentro de 2..9 (si saliera lo mismo para todo x
// tampoco haría falta la referencia).
function needsX(test, answer) {
  for (let c = MIN_X; c <= MAX_X; c++) if (tiltOf(test, c) !== answer) return true;
  return false;
}

function sampleTest(level) {
  let kl, al, kr, ar;
  if (level === 1) {
    kl = randInt(1, 4); al = 0; kr = 0; ar = randInt(1, 9);
  } else if (level === 2) {
    kl = randInt(1, 4); al = randInt(0, 8); kr = 0; ar = randInt(al + 1, 9);
  } else if (level === 3) {
    kl = randInt(1, 4); kr = randInt(1, 4); al = randInt(0, 9); ar = randInt(0, 9);
  } else {
    kl = randInt(0, 4); kr = randInt(0, 4); al = randInt(0, 9); ar = randInt(0, 9);
  }
  if ((kl - kr) * (al - ar) >= 0) return null;
  if (kl + al === 0 || kr + ar === 0) return null;
  // Espejo al azar: que los sacos no estén siempre a la izquierda.
  return randInt(0, 1) ? { kl: kr, al: ar, kr: kl, ar: al } : { kl, al, kr, ar };
}

function makeTest(level, x, target, ref) {
  for (let i = 0; i < 200; i++) {
    const t = sampleTest(level);
    if (!t || samePans(t, ref)) continue;
    const answer = tiltOf(t, x);
    if (answer !== target || !needsX(t, answer)) continue;
    return t;
  }
  return null;
}

function keyOf(level, ref, test) {
  return `${level}|${ref.k},${ref.a},${ref.m},${ref.b}|${test.kl},${test.al},${test.kr},${test.ar}`;
}

export function makeBalanzaRound(streak, lastKey) {
  const level = balanzaLevelFor(streak);
  if (level === 4) return makePickXRound(lastKey);
  for (let guard = 0; guard < 300; guard++) {
    const x = randInt(MIN_X, MAX_X);
    const ref = makeRef(level, x);
    const target = pick(TILTS); // primero el resultado, luego la pesada: así salen ≈1/3 cada uno
    const test = makeTest(level, x, target, ref);
    if (!test) continue;
    const key = keyOf(level, ref, test);
    if (key === lastKey) continue;
    return { level, ref, x, test, answer: target, key };
  }
  return { level, ref: { k: 3, a: 0, m: 0, b: 12 }, x: 4, test: { kl: 2, al: 5, kr: 3, ar: 0 }, answer: "left", key: "reserva" };
}

// Nivel 4: dos pesadas observadas (referencia inclinada + pesada nueva) y
// tres candidatos de x; sólo el verdadero cuadra con las dos. Si la pesada
// nueva está inclinada, un distractor cuadra sólo con la referencia y el
// otro sólo con la pesada nueva (hacen falta las dos para descartarlos); si
// está equilibrada ella sola fija x, así que los dos distractores cuadran
// con la referencia y hay que resolver la pesada equilibrada de verdad.
export function makePickXRound(lastKey) {
  // Primero el resultado de la pesada nueva (≈1/3 cada uno) y el x; luego
  // se buscan pesadas que cuadren, y solo si no hay se cambia de x.
  const answer = pick(TILTS);
  for (let guard = 0; guard < 60; guard++) {
    const x = randInt(MIN_X, MAX_X);
    for (let tries = 0; tries < 60; tries++) {
      const r = sampleTest(4);
      if (!r) continue;
      const refTiltNow = tiltOf(r, x);
      if (refTiltNow === "equal" || !needsX(r, refTiltNow)) continue;
      const ref = { k: r.kl, a: r.al, m: r.kr, b: r.ar, tilt: refTiltNow };
      const test = makeTest(4, x, answer, ref);
      if (!test) continue;
      const fitsRef = (c) => refTilt(ref, c) === ref.tilt;
      const fitsTest = (c) => tiltOf(test, c) === answer;
      const onlyTest = [], onlyRef = [];
      for (let c = MIN_X; c <= MAX_X; c++) {
        if (c === x) continue;
        if (fitsTest(c) && !fitsRef(c)) onlyTest.push(c);
        if (fitsRef(c) && !fitsTest(c)) onlyRef.push(c);
      }
      let d1, d2;
      if (answer === "equal") {
        if (onlyRef.length < 2) continue;
        [d1, d2] = shuffle(onlyRef);
      } else {
        if (!onlyTest.length || !onlyRef.length) continue;
        d1 = pick(onlyTest);
        d2 = pick(onlyRef);
      }
      const key = keyOf(4, ref, test);
      if (key === lastKey) continue;
      return { level: 4, ref, x, test, answer, candidates: shuffle([x, d1, d2]), key };
    }
  }
  return {
    level: 4,
    ref: { k: 2, a: 1, m: 1, b: 9, tilt: "right" },
    x: 5,
    test: { kl: 3, al: 0, kr: 1, ar: 8 },
    answer: "left",
    candidates: shuffle([5, 8, 3]),
    key: "reserva4",
  };
}

// ---------------------------------------------------------------- dibujo
// Geometría del SVG (viewBox 0 0 360 184): pivote arriba en el centro, viga
// de semilongitud ARM, y de cada extremo cuelgan dos cuerdas en V hasta los
// bordes de la bandeja. Los sacos y las pesas se apilan DENTRO de la V, en
// filas de abajo arriba, con el ancho que deja la V a cada altura.
const PIVOT = { x: 180, y: 30 };
const ARM = 124;
const ROPE_H = 92;
const TRAY_HALF = 60;
const SACK = { w: 18, h: 24 };
const DISC = 14;
const GAP = 2;
const TILT_DEG = 8;
export const DROP = Math.round(Math.sin((TILT_DEG * Math.PI) / 180) * ARM); // 17

// Juego de pesas de 10, 5 y 1 kg: así 36 kg son 5 discos y caben dibujados.
export function discs(kg) {
  const out = [];
  let rest = kg;
  [10, 5, 1].forEach((v) => { while (rest >= v) { out.push(v); rest -= v; } });
  return out;
}

// Reparte sacos y pesas en filas dentro de la V; ok=false si no cabrían.
export function layoutPan(sacks, kg) {
  const items = [];
  for (let i = 0; i < sacks; i++) items.push({ kind: "sack", w: SACK.w, h: SACK.h });
  discs(kg).forEach((v) => items.push({ kind: "disc", w: DISC, h: DISC, v }));
  const rows = [];
  let y = 0;
  let i = 0;
  while (i < items.length) {
    const rowH = items[i].h; // los sacos van primero, así el más alto abre la fila
    const top = y + rowH;
    const avail = (2 * TRAY_HALF * (ROPE_H - top)) / ROPE_H - 6;
    if (avail < items[i].w) return { rows, ok: false };
    const row = [];
    let w = 0;
    while (i < items.length && (w === 0 ? items[i].w : w + GAP + items[i].w) <= avail) {
      w += (w ? GAP : 0) + items[i].w;
      row.push(items[i]);
      i++;
    }
    // Las filas de arriba se apoyan sobre los sacos de la fila de abajo (que
    // van a la izquierda) en vez de flotar centradas sobre discos más bajos;
    // si no caben así dentro de la V, se centran.
    const prev = rows[rows.length - 1];
    let x0 = -w / 2;
    if (prev && prev.items[0].kind === "sack") x0 = Math.min(Math.max(-prev.w / 2, -avail / 2), avail / 2 - w);
    rows.push({ y, h: rowH, items: row, w, x0 });
    y = top;
  }
  return { rows, ok: true };
}

function panSVG(side, sacks, kg) {
  const ex = side === "left" ? PIVOT.x - ARM : PIVOT.x + ARM;
  const lay = layoutPan(sacks, kg);
  let items = "";
  lay.rows.forEach((row) => {
    let x = row.x0;
    row.items.forEach((it) => {
      const bottom = ROPE_H - row.y;
      if (it.kind === "sack") {
        items += `<g class="bz-sack"><rect x="${x}" y="${bottom - it.h}" width="${it.w}" height="${it.h}" rx="4"/>`
          + `<rect class="bz-sack-tie" x="${x + it.w / 2 - 5}" y="${bottom - it.h - 1}" width="10" height="4" rx="2"/>`
          + `<text x="${x + it.w / 2}" y="${bottom - 8}">x</text></g>`;
      } else {
        const cx = x + it.w / 2;
        const cy = bottom - it.h / 2;
        items += `<g class="bz-disc bz-disc-${it.v}"><circle cx="${cx}" cy="${cy}" r="${it.w / 2}"/>`
          + `<text x="${cx}" y="${cy + 2.8}">${it.v}</text></g>`;
      }
      x += it.w + GAP;
    });
  });
  const cls = side === "left" ? "bz-pan-l" : "bz-pan-r";
  return `<g transform="translate(${ex} ${PIVOT.y})"><g class="bz-pan-g ${cls}" data-side="${side}" data-sacks="${sacks}" data-weights="${kg}">`
    + `<line class="bz-cord" x1="0" y1="0" x2="${-TRAY_HALF}" y2="${ROPE_H}"/>`
    + `<line class="bz-cord" x1="0" y1="0" x2="${TRAY_HALF}" y2="${ROPE_H}"/>`
    + `<circle class="bz-ring" cx="0" cy="0" r="4"/>`
    + `<rect class="bz-tray" x="${-TRAY_HALF - 3}" y="${ROPE_H}" width="${2 * TRAY_HALF + 6}" height="8" rx="4"/>`
    + items + `</g></g>`;
}

function scaleSVG(pans, locked) {
  return `<svg class="bz-svg" viewBox="0 0 360 184" aria-hidden="true">`
    + `<rect class="bz-stand-base" x="${PIVOT.x - 52}" y="170" width="104" height="10" rx="5"/>`
    + `<rect class="bz-stand-mast" x="${PIVOT.x - 5}" y="${PIVOT.y}" width="10" height="142" rx="3"/>`
    + panSVG("left", pans.kl, pans.al)
    + panSVG("right", pans.kr, pans.ar)
    + `<g class="bz-beam"><line x1="${PIVOT.x - ARM}" y1="${PIVOT.y}" x2="${PIVOT.x + ARM}" y2="${PIVOT.y}"/>`
    + `<circle class="bz-pivot" cx="${PIVOT.x}" cy="${PIVOT.y}" r="6"/></g>`
    + (locked ? `<g class="bz-lock"><path d="M${PIVOT.x - 6} 12 a6 6 0 0 1 12 0 v4"/><rect x="${PIVOT.x - 9}" y="14" width="18" height="12" rx="3"/></g>` : "")
    + `</svg>`;
}

const TILT_TXT = { left: "cae la izquierda", equal: "equilibrada", right: "cae la derecha" };
const TILT_ICON = { left: "⬅", equal: "⚖", right: "➡" };

function sacoTxt(n) { return `${n} saco${n === 1 ? "" : "s"}`; }
function panTxt(sacks, kg) {
  return [sacks ? sacoTxt(sacks) : "", kg ? `${kg} kg` : ""].filter(Boolean).join(" + ") || "nada";
}
function panCalc(sacks, kg, x) {
  const parts = [];
  if (sacks) parts.push(`${sacks}·${x}`);
  if (kg) parts.push(String(kg));
  return `${parts.join("+") || "0"} = ${sacks * x + kg} kg`;
}

// La cuenta que hace el jugador: sacar x de la referencia y pesar los platos.
function explainX(ref, x) {
  if (ref.m === 0 && ref.a === 0) return `x = ${ref.b} ÷ ${ref.k} = ${x}`;
  if (ref.m === 0) return `x = (${ref.b} − ${ref.a}) ÷ ${ref.k} = ${x}`;
  const d = ref.k - ref.m;
  return `quito ${sacoTxt(ref.m)} de cada lado: ${d}x + ${ref.a} = ${ref.b} → x = (${ref.b} − ${ref.a}) ÷ ${d} = ${x}`;
}
function explainTest(test, x, answer) {
  return `izquierda ${panCalc(test.kl, test.al, x)}, derecha ${panCalc(test.kr, test.ar, x)} → ${TILT_TXT[answer]}`;
}

export function mountBalanzaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let streak = 0;
  let finished = false;
  let timers = [];
  let round = null;
  let locked = false;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");

  function later(fn, ms) {
    timers.push(setTimeout(() => { if (!finished) fn(); }, ms));
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }
  function renderLives() {
    livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0));
  }
  function renderScore() {
    scoreEl.textContent = `⭐ ${score}`;
  }

  function figure(kind, pans, shown, caption) {
    const lockedFig = shown === "locked";
    const tilt = lockedFig ? "equal" : shown;
    return `<figure class="bz-fig bz-tilt-${tilt}${lockedFig ? " bz-locked" : ""}" data-${kind} data-shown="${shown}">`
      + `<figcaption class="bz-cap">${caption}</figcaption>${scaleSVG(pans, lockedFig)}</figure>`;
  }

  function nextRound() {
    round = makeBalanzaRound(streak, round ? round.key : "");
    locked = false;
    const refPans = { kl: round.ref.k, al: round.ref.a, kr: round.ref.m, ar: round.ref.b };
    const pick4 = round.level === 4;
    const refShown = pick4 ? round.ref.tilt : "equal";
    const prompt = pick4
      ? `¿Cuánto pesa <b>un saco</b>?<small>Ninguna de las dos pesadas está equilibrada y ninguna lo dice sola: solo un valor cuadra con las dos</small>`
      : `¿Qué hará la <b>pesada 2</b>?<small>Los sacos son todos iguales. La pesada 1 te dice cuánto pesa cada saco; decide antes de soltar el candado</small>`;
    const buttons = pick4
      ? `<div class="bz-xs">${round.candidates.map((c) => `<button class="bz-xbtn" data-x="${c}"><b>${c}</b><span>kg por saco</span></button>`).join("")}</div>`
      : `<div class="bz-preds">${TILTS.map((t) => `<button class="bz-pred bz-pred-${t}" data-tilt="${t}"><b>${TILT_ICON[t]}</b><span>${TILT_TXT[t]}</span></button>`).join("")}</div>`;

    body.innerHTML = `
      <div class="bz-wrap bz-level-${round.level}">
        <p class="prompt bz-prompt">${prompt}</p>
        ${figure("ref", refPans, refShown, `Pesada 1 · ${pick4 ? TILT_TXT[round.ref.tilt] : "en equilibrio"}`)}
        ${figure("test", round.test, pick4 ? round.answer : "locked", pick4 ? `Pesada 2 · ${TILT_TXT[round.answer]}` : "Pesada 2 · ¿qué pasará?")}
        ${buttons}
        <div class="feedback bz-feedback" data-feedback></div>
      </div>
    `;
    body.querySelectorAll("[data-tilt]").forEach((btn) => {
      btn.addEventListener("click", () => answerTilt(btn.dataset.tilt, btn));
    });
    body.querySelectorAll("[data-x]").forEach((btn) => {
      btn.addEventListener("click", () => answerX(Number(btn.dataset.x), btn));
    });
  }

  function disableButtons() {
    body.querySelectorAll("[data-tilt], [data-x]").forEach((b) => { b.disabled = true; });
  }

  function resolve(correct, btn, html) {
    locked = true;
    rounds++;
    disableButtons();
    const feedback = body.querySelector("[data-feedback]");
    feedback.innerHTML = html;
    feedback.className = `feedback bz-feedback ${correct ? "ok" : "bad"}`;
    if (correct) {
      btn.classList.add("bz-correct");
      streak++;
      score += 10;
      renderScore();
      later(nextRound, 1700);
      return;
    }
    btn.classList.add("bz-wrong");
    const good = body.querySelector(`[data-tilt="${round.answer}"], [data-x="${round.x}"]`);
    if (good) good.classList.add("bz-correct");
    streak = 0;
    lives--;
    renderLives();
    if (lives <= 0) return later(() => finish(false), 3000);
    later(nextRound, 3000);
  }

  // Niveles 1-3: al predecir se abre el candado y la balanza cae hacia
  // donde toca de verdad — la respuesta se ve, no se cuenta.
  function answerTilt(tilt, btn) {
    if (finished || locked) return;
    const fig = body.querySelector("[data-test]");
    fig.classList.remove("bz-locked", "bz-tilt-equal");
    fig.classList.add(`bz-tilt-${round.answer}`);
    fig.dataset.shown = round.answer;
    const cap = fig.querySelector(".bz-cap");
    if (cap) cap.textContent = `Pesada 2 · ${TILT_TXT[round.answer]}`;
    const cuenta = `${explainX(round.ref, round.x)}; ${explainTest(round.test, round.x, round.answer)}`;
    const ok = tilt === round.answer;
    resolve(ok, btn, `<b>${ok ? "¡Eso es!" : `No: ${TILT_TXT[round.answer]}.`}</b> ${cuenta}`);
  }

  // Nivel 4: cada candidato se comprueba contra las dos pesadas.
  function answerX(x, btn) {
    if (finished || locked) return;
    const ok = x === round.x;
    const t = round.test;
    const r = round.ref;
    const conX = (c) => `con x = ${c}: pesada 1 → ${r.k * c + r.a} kg y ${r.m * c + r.b} kg (${TILT_TXT[refTilt(r, c)]}${refTilt(r, c) === r.tilt ? " ✓" : " ✗"}), `
      + `pesada 2 → ${t.kl * c + t.al} kg y ${t.kr * c + t.ar} kg (${TILT_TXT[tiltOf(t, c)]}${tiltOf(t, c) === round.answer ? " ✓" : " ✗"})`;
    const html = ok
      ? `<b>¡Eso es!</b> ${conX(x)}`
      : `<b>No: cada saco pesa ${round.x} kg.</b> ${conX(x)}; ${conX(round.x)}`;
    resolve(ok, btn, html);
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimers();
    if (userExited) return onExit();
    saveScore(client, "balanza", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>⚖️</div>
        <div class="big-score">${score} pts</div>
        <p>${rounds} pesadas predichas</p>
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
    clearTimers();
    lives = startLives;
    score = 0;
    rounds = 0;
    streak = 0;
    round = null;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimers();
  };
}
