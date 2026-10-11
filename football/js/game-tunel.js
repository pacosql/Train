// "¿Cuándo sale del túnel?": un tren entra en un túnel opaco (y al otro
// lado hay niebla, así que no se le ve asomar). Se sabe su velocidad, la
// longitud del túnel y hay un reloj que hace "tic" cada pulso. El jugador
// pulsa "¡Sale!" en el instante en que cree que el tren asoma (o, en el
// nivel del tren largo, cuando ya ha salido ENTERO). El tiempo es la
// respuesta: t = distancia ÷ velocidad. Acierta si pulsa a ±0,4 s.
//
// Fuente: mecánica de los juegos de ritmo + "predice y revela" (los tres
// actos de Dan Meyer), sobre el problema clásico del tren y el túnel.
//
// Niveles (sube uno cada dos aciertos):
//   0 · 1 casilla por pulso (t = longitud del túnel).
//   1 · 2 o 3 casillas por pulso.
//   2 · unidades reales en m/s con tiempo acelerado (cada tic = 10 s).
//   3 · igual pero en km/h (hay que pasar a m/s: ÷ 3,6).
//   4 · tren largo: "¿cuándo ha salido entero?" → túnel + tren.
//   5 · mezcla de tren largo y cambio de velocidad dentro del túnel.
//
// Al fallar (o si no se pulsa a tiempo) el túnel y la niebla se vuelven
// transparentes en el instante del toque y se explica la cuenta.
import { randInt, pick, saveScore } from "./utils.js";

const PREROLL = 2; // pulsos que se ve al tren acercarse antes de entrar
const TOL_MS = 400; // margen de acierto
const VB_W = 340; // ancho del viewBox
const PAD_X = 8;

const fmt = (x) => {
  const r = Math.round(x * 100) / 100;
  return String(r).replace(".", ",");
};
const plural = (n, s, p) => `${fmt(n)} ${Math.abs(n) === 1 ? s : p}`;

// Genera una ronda del nivel `tier`. Todas las distancias están en la
// "unidad base" (casillas, o metros en los niveles de unidades reales) y
// las velocidades en unidades base POR PULSO, de modo que el instante
// correcto t (en pulsos desde que la nariz entra) siempre es entero.
export function genTunelRound(tier) {
  let t = tier;
  if (tier >= 5) t = pick([4, 5, 5]); // 5 = cambio de velocidad
  const r = {
    tier,
    kind: "cells", // cells | ms | kmh | long | change
    question: "nose", // nose | tail
    unit: "casillas",
    v1: 1, // unidades base por pulso
    v2: null, // tras el cambio (solo "change")
    X: null, // casilla del cambio (solo "change")
    L: 0,
    trainLen: 2,
    carLen: 1,
    markStep: 1,
    secPerPulse: null, // segundos simulados por tic (unidades reales)
    vShown: null, // velocidad tal como se enseña (m/s o km/h)
    pulseMs: 1000,
    D: 0, // distancia que tiene que recorrer la nariz
    tPulses: 0,
  };
  if (t === 0) {
    r.v1 = 1;
    r.tPulses = randInt(3, 10);
    r.L = r.tPulses;
  } else if (t === 1) {
    r.v1 = pick([2, 3]);
    r.tPulses = randInt(3, r.v1 === 2 ? 10 : 8);
    r.L = r.v1 * r.tPulses;
  } else if (t === 2 || t === 3) {
    // Metros; cada tic son 10 s. v·t·10 m debe ser múltiplo de 100 m
    // (las marcas del túnel van de 100 en 100 m) y no pasar de 2400 m.
    r.kind = t === 2 ? "ms" : "kmh";
    r.unit = "m";
    r.secPerPulse = 10;
    r.markStep = 100;
    r.trainLen = 200;
    r.carLen = 50;
    const vms = pick([10, 15, 20, 25, 30]);
    const opts = [];
    for (let n = 3; n <= 10; n++) if ((vms * n) % 10 === 0 && vms * 10 * n <= 2400) opts.push(n);
    r.tPulses = pick(opts);
    r.v1 = vms * 10;
    r.L = r.v1 * r.tPulses;
    r.vShown = t === 2 ? vms : Math.round(vms * 3.6);
  } else if (t === 4) {
    r.kind = "long";
    r.question = "tail";
    r.pulseMs = 900;
    // D = túnel + tren = v·t, con túnel entre 3 y 24 casillas.
    for (;;) {
      r.v1 = pick([1, 2, 3]);
      r.trainLen = randInt(2, 5);
      r.tPulses = randInt(3, 10);
      r.L = r.v1 * r.tPulses - r.trainLen;
      if (r.L >= 3 && r.L <= 24) break;
    }
  } else {
    r.kind = "change";
    r.pulseMs = 900;
    for (;;) {
      r.v1 = pick([2, 3, 4]);
      r.v2 = pick([1, 2, 3]);
      if (r.v2 === r.v1) continue;
      const a = randInt(1, 6);
      const b = randInt(1, 6);
      r.X = r.v1 * a;
      r.L = r.X + r.v2 * b;
      r.tPulses = a + b;
      if (r.tPulses >= 3 && r.tPulses <= 10 && r.L >= 6 && r.L <= 24) break;
    }
  }
  r.D = r.question === "tail" ? r.L + r.trainLen : r.L;
  return r;
}

// Posición de la nariz (unidades base; 0 = boca de entrada) a los `tau`
// pulsos desde que arranca el movimiento.
export function noseAt(r, tau) {
  const n = -PREROLL * r.v1 + r.v1 * tau;
  if (r.kind !== "change" || n <= r.X) return n;
  const tc = PREROLL + r.X / r.v1;
  return r.X + r.v2 * (tau - tc);
}

// Marco del dibujo: de dónde a dónde va el mundo visible.
export function sceneFrame(r) {
  const vLast = r.kind === "change" ? r.v2 : r.v1;
  const xmin = -(PREROLL * r.v1 + r.trainLen + r.markStep * 0.6);
  const xmax = r.L + Math.max(r.trainLen + r.markStep, 2 * vLast);
  const scale = (VB_W - 2 * PAD_X) / (xmax - xmin);
  return { xmin, xmax, scale };
}

export function mountTunelGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let round = null;
  let lastKey = "";
  let phase = "idle"; // idle | moving | done
  let t0 = 0;
  let lastPulse = null;
  let raf = 0;
  const timers = new Set();
  let audio = null;
  let els = {};
  let frame = null;

  const later = (fn, ms) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };
  const clearAll = () => {
    timers.forEach((id) => clearTimeout(id));
    timers.clear();
    cancelAnimationFrame(raf);
    raf = 0;
  };

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

  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  // Sonido de "tic" con WebAudio (si el navegador lo permite).
  function tick(strong) {
    try {
      if (!audio) return;
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.frequency.value = strong ? 1320 : 880;
      g.gain.setValueAtTime(0.0001, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.07);
      o.connect(g).connect(audio.destination);
      o.start();
      o.stop(audio.currentTime + 0.08);
    } catch (_) {
      // Sin sonido no pasa nada: el tic también es visual.
    }
  }
  function ensureAudio() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!audio && AC) audio = new AC();
      if (audio && audio.state === "suspended") audio.resume();
    } catch (_) {
      audio = null;
    }
  }

  const sx = (x) => PAD_X + (x - frame.xmin) * frame.scale;

  // Texto de la velocidad y del túnel según el nivel.
  function speedText(r) {
    if (r.kind === "ms") return `${r.vShown} m/s`;
    if (r.kind === "kmh") return `${r.vShown} km/h`;
    return `${plural(r.v1, "casilla", "casillas")} por pulso`;
  }
  const lenText = (r) => (r.unit === "m" ? `${r.L} m` : plural(r.L, "casilla", "casillas"));

  function buildSvg(r) {
    const yTrack = 112;
    const tunTop = 62;
    const x0 = sx(0);
    const x1 = sx(r.L);
    const parts = [];
    // Vía con traviesas en cada casilla (o cada 100 m).
    parts.push(`<line class="tn-rail" x1="0" y1="${yTrack}" x2="${VB_W}" y2="${yTrack}"/>`);
    const first = Math.ceil(frame.xmin / r.markStep) * r.markStep;
    for (let x = first; x <= frame.xmax; x += r.markStep) {
      parts.push(`<line class="tn-sleeper" x1="${sx(x)}" y1="${yTrack}" x2="${sx(x)}" y2="${yTrack + 5}"/>`);
    }
    // Tren: vagones dibujados hacia atrás desde la nariz (x local 0).
    const cars = [];
    const nCars = Math.round(r.trainLen / r.carLen);
    const cw = r.carLen * frame.scale;
    for (let i = 0; i < nCars; i++) {
      const left = -(i + 1) * cw + 0.8;
      const w = Math.max(cw - 1.6, 2);
      const cls = i === 0 ? "tn-car tn-engine" : "tn-car";
      cars.push(`<rect class="${cls}" x="${left}" y="${yTrack - 19}" width="${w}" height="17" rx="${Math.min(4, w / 3)}"/>`);
      if (w > 9) cars.push(`<rect class="tn-win" x="${left + w * 0.2}" y="${yTrack - 16}" width="${w * 0.6}" height="5" rx="1.5"/>`);
    }
    parts.push(`<g class="tn-train" data-train>${cars.join("")}</g>`);
    // Zona recorrida (se rellena al revelar) y túnel opaco.
    parts.push(`<rect class="tn-trail" data-trail x="${x0}" y="${tunTop}" width="0" height="${yTrack - tunTop}"/>`);
    const hill = `M${x0 - 6},${yTrack} L${x0 - 6},${tunTop} Q${(x0 + x1) / 2},${tunTop - 30} ${x1 + 6},${tunTop} L${x1 + 6},${yTrack} Z`;
    parts.push(`<path class="tn-hill" data-hill d="${hill}"/>`);
    parts.push(`<rect class="tn-mouth" x="${x0 - 2}" y="${yTrack - 24}" width="4" height="24" rx="2"/>`);
    parts.push(`<rect class="tn-mouth" x="${x1 - 2}" y="${yTrack - 24}" width="4" height="24" rx="2"/>`);
    // Niebla tras la salida: así no se ve asomar al tren.
    parts.push(`<rect class="tn-fog" data-fog x="${x1 + 2}" y="${tunTop - 18}" width="${VB_W - x1}" height="${yTrack - tunTop + 26}" rx="8"/>`);
    parts.push(`<text class="tn-fog-txt" x="${(x1 + VB_W) / 2 + 1}" y="${tunTop + 18}">niebla</text>`);
    // Marcas de casillas (o de 100 m) sobre el túnel.
    const marks = [];
    for (let x = 0; x <= r.L + 1e-9; x += r.markStep) {
      marks.push(`<line class="tn-mark" x1="${sx(x)}" y1="${tunTop - 2}" x2="${sx(x)}" y2="${tunTop + 6}"/>`);
    }
    parts.push(`<line class="tn-mark-base" x1="${x0}" y1="${tunTop + 2}" x2="${x1}" y2="${tunTop + 2}"/>`);
    parts.push(marks.join(""));
    parts.push(`<text class="tn-len" x="${(x0 + x1) / 2}" y="${tunTop - 22}">${lenText(r)}</text>`);
    parts.push(`<text class="tn-port" x="${x0}" y="${yTrack + 18}">entrada</text>`);
    parts.push(`<text class="tn-port" x="${x1}" y="${yTrack + 18}">salida</text>`);
    if (r.kind === "change") {
      const xc = sx(r.X);
      parts.push(`<line class="tn-sign" x1="${xc}" y1="${tunTop - 2}" x2="${xc}" y2="${yTrack}"/>`);
      parts.push(`<text class="tn-sign-txt" x="${xc}" y="${yTrack + 30}">⚠ ${r.X}</text>`);
    }
    // Marca de la nariz (o de la cola) al revelar.
    parts.push(`<g class="tn-pin" data-pin style="display:none"><line x1="0" y1="${tunTop - 6}" x2="0" y2="${yTrack}"/><path d="M-5,${tunTop - 14} L5,${tunTop - 14} L0,${tunTop - 6} Z"/></g>`);
    return `<svg class="tn-svg" viewBox="0 0 ${VB_W} 150" role="img" aria-label="Tren y túnel">${parts.join("")}</svg>`;
  }

  function nextRound() {
    clearAll();
    let r;
    let guard = 0;
    do {
      r = genTunelRound(Math.min(5, Math.floor(level / 2)));
      guard++;
    } while (`${r.kind}-${r.v1}-${r.L}-${r.trainLen}-${r.X}` === lastKey && guard < 20);
    lastKey = `${r.kind}-${r.v1}-${r.L}-${r.trainLen}-${r.X}`;
    round = r;
    frame = sceneFrame(r);
    phase = "idle";
    lastPulse = null;
    const ask =
      r.question === "tail"
        ? `Pulsa cuando haya salido <b>entero</b><small>la cola también tiene que salir del túnel</small>`
        : `Pulsa cuando el tren <b>asome</b><small>la nariz llega a la salida; al otro lado hay niebla</small>`;
    const chips = [`<span class="tn-chip" data-speed>🚆 ${speedText(r)}</span>`, `<span class="tn-chip" data-len>🚇 Túnel: ${lenText(r)}</span>`];
    if (r.question === "tail")
      chips.push(`<span class="tn-chip" data-trainlen>🚃 Tren: ${plural(r.trainLen, "casilla", "casillas")}</span>`);
    if (r.kind === "change")
      chips.push(
        `<span class="tn-chip tn-chip-warn" data-change>⚠ Al llegar a la casilla ${r.X} pasa a ${plural(r.v2, "casilla", "casillas")} por pulso</span>`
      );
    const clockLbl = r.secPerPulse ? `⏩ tiempo acelerado: cada tic son ${r.secPerPulse} s` : "cada tic = 1 pulso";
    body.innerHTML = `
      <p class="prompt tn-prompt">${ask}</p>
      <div class="tn-chips">${chips.join("")}</div>
      <div class="tn-scene" data-scene data-state="idle">${buildSvg(r)}</div>
      <div class="tn-clock" data-clock data-pulse-ms="${r.pulseMs}" data-preroll="${PREROLL}">
        <span class="tn-clock-num" data-clock-num>Entra en ${PREROLL}</span>
        <span class="tn-clock-lbl">${clockLbl}</span>
      </div>
      <button type="button" class="primary tn-go" data-go>▶ Arrancar</button>
      <button type="button" class="secondary tn-next" data-next hidden>Seguir →</button>
      <div class="feedback tn-feedback" data-feedback></div>
    `;
    els = {
      scene: body.querySelector("[data-scene]"),
      train: body.querySelector("[data-train]"),
      trail: body.querySelector("[data-trail]"),
      pin: body.querySelector("[data-pin]"),
      clock: body.querySelector("[data-clock]"),
      num: body.querySelector("[data-clock-num]"),
      go: body.querySelector("[data-go]"),
      next: body.querySelector("[data-next]"),
      feedback: body.querySelector("[data-feedback]"),
    };
    placeTrain(0);
    // pointerdown (no click) para que el instante del toque sea exacto.
    els.go.addEventListener("pointerdown", onGo);
    els.go.addEventListener("click", (e) => {
      // Teclado (Enter/Espacio): click sin pointerdown previo.
      if (e.detail === 0) onGo(e);
    });
    els.next.addEventListener("click", () => {
      if (!finished) nextRound();
    });
  }

  function placeTrain(tau) {
    els.train.setAttribute("transform", `translate(${sx(noseAt(round, tau))},0)`);
  }

  function onGo(e) {
    if (finished) return;
    if (e && e.preventDefault) e.preventDefault();
    if (phase === "idle") return startMoving();
    if (phase === "moving") return judge(performance.now() - t0);
  }

  function startMoving() {
    ensureAudio();
    phase = "moving";
    t0 = performance.now();
    els.scene.dataset.state = "moving";
    els.scene.classList.add("tn-running");
    els.go.textContent = "¡Sale!";
    els.go.classList.add("tn-go-hot");
    const r = round;
    const trueMs = (PREROLL + r.tPulses) * r.pulseMs;
    // Si no pulsa: se revela cuando el tren ya ha salido del todo.
    const tailOutTau = tauForNose(r, r.L + r.trainLen);
    const deadline = Math.max(tailOutTau * r.pulseMs, trueMs + r.pulseMs) + 150;
    const loop = () => {
      if (finished || phase !== "moving") return;
      const el = performance.now() - t0;
      if (el >= deadline) return judge(null);
      const tau = el / r.pulseMs;
      placeTrain(tau);
      const p = Math.floor(tau);
      if (p !== lastPulse) {
        lastPulse = p;
        const inside = p - PREROLL;
        els.num.textContent = inside < 0 ? `Entra en ${-inside}` : r.secPerPulse ? `${inside * r.secPerPulse} s` : `${inside}`;
        els.clock.classList.remove("tn-beat");
        void els.clock.offsetWidth; // reinicia la animación del tic
        els.clock.classList.add("tn-beat");
        tick(inside === 0);
      }
      raf = requestAnimationFrame(loop);
    };
    lastPulse = 0;
    tick(false);
    els.clock.classList.add("tn-beat");
    raf = requestAnimationFrame(loop);
  }

  // Pulsos (desde que arranca) que tarda la nariz en llegar a `pos`.
  function tauForNose(r, pos) {
    if (r.kind !== "change" || pos <= r.X) return PREROLL + pos / r.v1;
    return PREROLL + r.X / r.v1 + (pos - r.X) / r.v2;
  }

  // Corrige el toque (elapsedMs = null si no ha pulsado).
  function judge(elapsedMs) {
    if (phase !== "moving") return;
    phase = "done";
    cancelAnimationFrame(raf);
    rounds++;
    const r = round;
    const trueMs = (PREROLL + r.tPulses) * r.pulseMs;
    const deadlineReveal = elapsedMs === null;
    const tapMs = elapsedMs;
    const tau = deadlineReveal ? Math.max(tauForNose(r, r.L + r.trainLen), PREROLL + r.tPulses + 1) : elapsedMs / r.pulseMs;
    placeTrain(tau);
    els.go.disabled = true;
    els.go.classList.remove("tn-go-hot");
    els.scene.dataset.state = "revealed";
    els.scene.classList.remove("tn-running");
    els.scene.classList.add("tn-glass");
    // El tren pasa por encima del túnel (ya de cristal) para verlo bien.
    const svg = els.train.ownerSVGElement;
    svg.appendChild(els.train);
    svg.appendChild(els.pin);
    // Lo recorrido dentro del túnel, sombreado; y la marca de la nariz.
    const nose = noseAt(r, tau);
    const inT = Math.max(0, Math.min(nose, r.L));
    els.trail.setAttribute("width", `${inT * frame.scale}`);
    const pinX = r.question === "tail" ? nose - r.trainLen : nose;
    els.pin.style.display = "";
    els.pin.setAttribute("transform", `translate(${sx(pinX)},0)`);
    const ok = !deadlineReveal && Math.abs(tapMs - trueMs) <= TOL_MS;
    const fb = els.feedback;
    if (ok) {
      score += 10;
      level++;
      renderScore();
      els.scene.dataset.result = "ok";
      els.pin.classList.add("ok");
      fb.className = "feedback tn-feedback ok";
      fb.textContent = `¡Justo! ${solution(r)}`;
      later(nextRound, 1900);
      return;
    }
    lives--;
    renderLives();
    els.scene.dataset.result = "bad";
    els.pin.classList.add("bad");
    fb.className = "feedback tn-feedback bad";
    fb.textContent = explain(r, deadlineReveal ? null : tau - PREROLL);
    if (lives <= 0) {
      later(() => finish(false), 3200);
      return;
    }
    els.go.hidden = true;
    els.next.hidden = false;
  }

  // Cómo se calcula el instante correcto.
  function solution(r) {
    const u = r.unit === "m" ? "m" : "casillas";
    if (r.kind === "ms")
      return `Asoma a los ${r.tPulses * 10} s: ${r.L} m ÷ ${r.vShown} m/s.`;
    if (r.kind === "kmh")
      return `${r.vShown} km/h = ${r.v1 / 10} m/s (÷ 3,6); ${r.L} m ÷ ${r.v1 / 10} m/s = ${r.tPulses * 10} s.`;
    if (r.kind === "long")
      return `Para salir entero recorre túnel + tren = ${r.L} + ${r.trainLen} = ${r.D} ${u}; ${r.D} ÷ ${r.v1} = ${r.tPulses} pulsos.`;
    if (r.kind === "change") {
      const a = r.X / r.v1;
      const b = (r.L - r.X) / r.v2;
      return `${r.X} casillas a ${r.v1} = ${plural(a, "pulso", "pulsos")}; luego ${r.L - r.X} a ${r.v2} = ${plural(b, "pulso", "pulsos")} → asoma en el pulso ${r.tPulses}.`;
    }
    return `Asoma en el pulso ${r.tPulses}: ${r.L} ÷ ${r.v1} = ${r.tPulses}.`;
  }

  // Explicación del fallo: dónde iba al pulsar y cuánto faltaba/sobraba.
  function explain(r, tauIn) {
    if (tauIn === null) return `No pulsaste a tiempo. ${solution(r)}`;
    // Se redondea el instante del toque a medio pulso para que la cuenta
    // salga limpia (el dibujo sí muestra la posición exacta).
    let q = Math.round(tauIn * 2) / 2;
    if (Math.abs(tauIn - Math.round(tauIn)) < 0.25) q = Math.round(tauIn);
    const approx = Math.abs(q - tauIn) > 0.06 ? "≈" : "";
    if (q <= 0) return `¡Pulsaste antes de que entrase! ${solution(r)}`;
    const d = noseAt(r, PREROLL + q);
    const metric = r.unit === "m";
    const u = metric ? "m" : "casillas";
    const vNow = r.kind === "change" && d > r.X ? r.v2 : r.v1;
    const when = metric ? `a los ${approx}${fmt(q * 10)} s` : `en el pulso ${approx}${fmt(q)}`;
    if (r.kind === "ms" || r.kind === "kmh") {
      const vms = r.v1 / 10;
      const conv = r.kind === "kmh" ? `${r.vShown} km/h = ${vms} m/s (÷ 3,6). ` : "";
      if (d < r.D)
        return `${conv}Pulsaste ${when}: llevaba ${fmt(d)} de ${r.D} m; faltaban ${fmt(r.D - d)} m a ${vms} m/s → ${fmt((r.D - d) / vms)} s más. Asomaba a los ${r.tPulses * 10} s (${r.L} ÷ ${vms}).`;
      return `${conv}Pulsaste ${when}: ya llevaba ${fmt(d)} de ${r.D} m; ${fmt(d - r.D)} m de más a ${vms} m/s → ${fmt((d - r.D) / vms)} s tarde. Asomaba a los ${r.tPulses * 10} s (${r.L} ÷ ${vms}).`;
    }
    const per = `a ${vNow} por pulso`;
    const ans =
      r.question === "tail"
        ? `Salía entero en el pulso ${r.tPulses} (${r.D} ÷ ${r.v1}).`
        : `Asomaba en el pulso ${r.tPulses} (${r.L} ÷ ${r.v1}).`;
    if (r.kind === "change") {
      const where = d < r.D ? `llevaba ${fmt(d)} de ${r.D} casillas` : `ya llevaba ${fmt(d)} de ${r.D} casillas`;
      return `Pulsaste ${when}: ${where}. ${solution(r)}`;
    }
    if (r.question === "tail") {
      const need = `para salir entero tiene que avanzar túnel + tren = ${r.L} + ${r.trainLen} = ${r.D}`;
      if (d < r.D)
        return `Pulsaste ${when}: había avanzado ${fmt(d)} casillas y ${need}; faltaban ${fmt(r.D - d)} ${per} → ${plural((r.D - d) / vNow, "pulso", "pulsos")} más. ${ans}`;
      return `Pulsaste ${when}: había avanzado ${fmt(d)} casillas y ${need}; ${fmt(d - r.D)} de más ${per} → ${plural((d - r.D) / vNow, "pulso", "pulsos")} tarde. ${ans}`;
    }
    if (d < r.D)
      return `Pulsaste ${when}: llevaba ${fmt(d)} de ${r.D} ${u}; faltaban ${fmt(r.D - d)} ${per} → ${plural((r.D - d) / vNow, "pulso", "pulsos")} más. ${ans}`;
    return `Pulsaste ${when}: ya llevaba ${fmt(d)} de ${r.D} ${u}; ${fmt(d - r.D)} de más ${per} → ${plural((d - r.D) / vNow, "pulso", "pulsos")} tarde. ${ans}`;
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearAll();
    if (userExited) return onExit();
    saveScore(client, "tunel", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🚇</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} trenes cazados a la salida</p>
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
    clearAll();
    lives = startLives;
    score = 0;
    rounds = 0;
    level = 0;
    finished = false;
    lastKey = "";
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearAll();
    try {
      if (audio) audio.close();
    } catch (_) {
      // nada
    }
    audio = null;
  };
}
