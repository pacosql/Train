// "Camina la gráfica": versión de pulgar del clásico "Graph Matching" /
// "Match Me" de Vernier y TI (el alumno camina delante de un sensor de
// movimiento intentando reproducir una gráfica distancia-tiempo) y de
// las "Graphing Stories" de Dan Meyer.
//
// Arriba hay un camino de 0 a 10 m con un muñeco; abajo, la gráfica
// objetivo (posición frente a tiempo) con una banda tenue de ±0,6 m.
// Tras una cuenta 3-2-1 un cursor barre el tiempo (8-12 s) y el jugador
// arrastra al muñeco: su posición se dibuja en vivo encima de la
// gráfica. Se acierta si al menos el 75 % del tiempo va dentro de la
// banda. LA MECÁNICA ES LA MATEMÁTICA: la pendiente es la velocidad, un
// tramo plano es estar quieto y bajar es volver hacia el sensor.
//
// Al fallar se colorean en rojo los trozos de tu línea fuera de la banda,
// se marca el tramo peor y se explica con la cuenta: "Aquí sube 4 m en
// 2 s = 2 m/s; tu línea es más tumbada: ibas a 1 m/s".
import { randInt, pick, clamp, saveScore } from "./utils.js";

const LARGO = 10; // largo del camino (m)
const BANDA = 0.6; // media anchura de la banda (m)
const APROBADO = 0.75; // fracción del tiempo dentro de la banda
const VMAX = 2; // m/s: lo que el pulgar puede seguir con calma
const N_EVAL = 200; // instantes en los que se mide la banda
const CUENTA = 3; // segundos de cuenta atrás

export const NIVELES_CG = ["Escalones", "Rampas", "Paradas y vueltas", "Mezcla"];

// ---------- Generación de gráficas ----------

// Duraciones válidas para una velocidad: Δx = v·Δt tiene que ser entero.
function duraciones(v) {
  const a = Math.abs(v);
  if (a === 0) return [1, 2, 3];
  if (a === 0.5) return [2, 4];
  if (a === 1.5) return [2];
  if (a === 2) return [1, 2];
  return [2, 3, 4]; // 1 m/s
}

// Posición objetivo en el instante t (interpolación lineal entre vértices).
export function posObjetivo(pts, t) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    const [t1, x1] = pts[i];
    if (t <= t1) {
      const [t0, x0] = pts[i - 1];
      return x0 + ((x1 - x0) * (t - t0)) / (t1 - t0);
    }
  }
  return pts[pts.length - 1][1];
}

// Fracción de los instantes de evaluación en que f(t) cae en la banda.
function fraccionEnBanda(pts, T, f) {
  let dentro = 0;
  for (let k = 0; k < N_EVAL; k++) {
    const t = ((k + 0.5) * T) / N_EVAL;
    if (Math.abs(f(t) - posObjetivo(pts, t)) <= BANDA) dentro++;
  }
  return dentro / N_EVAL;
}

// Añade un tramo de velocidad v; devuelve false si se sale del camino.
function tramo(pts, v, dt) {
  const [t, x] = pts[pts.length - 1];
  const nx = x + v * dt;
  if (nx < 0 || nx > LARGO) return false;
  pts.push([t + dt, nx]);
  return true;
}

function genEscalones() {
  // Quieto, "salto" rápido (2 m/s), quieto… como "ponte en 3 y salta a 7".
  const pts = [[0, randInt(1, 9)]];
  tramo(pts, 0, randInt(2, 3));
  const saltos = pick([1, 2, 2]);
  for (let s = 0; s < saltos; s++) {
    const x = pts[pts.length - 1][1];
    const opciones = [-4, -3, -2, 2, 3, 4].filter((d) => x + d >= 0 && x + d <= LARGO);
    const d = pick(opciones);
    // A 2 m/s: 2 m en 1 s, 4 m en 2 s; 3 m necesita 1,5 s → se hace a 1,5 m/s en 2 s.
    if (Math.abs(d) === 3) tramo(pts, Math.sign(d) * 1.5, 2);
    else tramo(pts, Math.sign(d) * 2, Math.abs(d) / 2);
    tramo(pts, 0, randInt(2, 3));
  }
  return pts;
}

function genRampas() {
  // Velocidad constante, siempre en el mismo sentido; a veces dos
  // velocidades distintas seguidas o una pausa al principio/final.
  const sentido = pick([1, -1]);
  const pts = [[0, sentido > 0 ? randInt(0, 3) : randInt(7, 10)]];
  if (Math.random() < 0.5) tramo(pts, 0, randInt(1, 2));
  const vs = Math.random() < 0.55 ? [pick([0.5, 1, 1.5])] : [pick([0.5, 1]), pick([1.5, 2])];
  if (vs.length === 2 && Math.random() < 0.5) vs.reverse();
  for (const v of vs) if (!tramo(pts, sentido * v, pick(duraciones(v)))) return null;
  if (Math.random() < 0.5) tramo(pts, 0, randInt(1, 2));
  return pts;
}

function genVueltas() {
  // Ir, pararse y volver (a otra velocidad).
  const sentido = pick([1, -1]);
  const pts = [[0, sentido > 0 ? randInt(0, 4) : randInt(6, 10)]];
  if (Math.random() < 0.4) tramo(pts, 0, 1);
  const v1 = pick([1, 1.5, 2]);
  if (!tramo(pts, sentido * v1, pick(duraciones(v1)))) return null;
  tramo(pts, 0, randInt(1, 3));
  const v2 = pick([0.5, 1, 1.5, 2].filter((v) => v !== v1));
  if (!tramo(pts, -sentido * v2, pick(duraciones(v2)))) return null;
  if (Math.random() < 0.6) tramo(pts, 0, randInt(1, 2));
  return pts;
}

function genMezcla() {
  // 4-6 tramos libres: quieto, rampas a varias velocidades, vueltas.
  const pts = [[0, randInt(0, 10)]];
  const n = randInt(4, 6);
  let prev = null;
  for (let i = 0; i < n; i++) {
    const v = pick([0, 0.5, 1, 1.5, 2, -0.5, -1, -1.5, -2].filter((w) => w !== prev));
    if (!tramo(pts, v, pick(duraciones(v)))) return null;
    prev = v;
  }
  return pts;
}

// Rasgos que pide cada nivel (también los comprueba la simulación).
function rasgos(pts) {
  const vs = [];
  for (let i = 1; i < pts.length; i++) vs.push((pts[i][1] - pts[i - 1][1]) / (pts[i][0] - pts[i - 1][0]));
  const mov = vs.filter((v) => v !== 0);
  const signos = new Set(mov.map(Math.sign));
  return {
    vs,
    paradas: vs.filter((v) => v === 0).length,
    vuelta: signos.size === 2,
    distintas: new Set(vs).size,
    soloSaltos: mov.every((v) => Math.abs(v) >= 1.5),
  };
}

function rondaValida(pts, nivel) {
  const T = pts[pts.length - 1][0];
  if (T < 8 || T > 12) return false;
  for (let i = 1; i < pts.length; i++) {
    const dt = pts[i][0] - pts[i - 1][0];
    if (dt <= 0 || Math.abs(pts[i][1] - pts[i - 1][1]) > VMAX * dt) return false;
  }
  if (pts.some(([, x]) => x < 0 || x > LARGO)) return false;
  const r = rasgos(pts);
  if (nivel === 0 && !(r.soloSaltos && r.paradas >= 2 && r.vs.length >= 3)) return false;
  if (nivel === 1 && (r.vuelta || !r.vs.some((v) => v !== 0 && Math.abs(v) <= 1))) return false;
  if (nivel === 2 && !(r.vuelta && r.paradas >= 1)) return false;
  if (nivel >= 3 && !(r.distintas >= 4 && (r.vuelta || r.paradas >= 1))) return false;
  // Quedarse quieto en cualquier sitio NUNCA puede bastar: ninguna franja
  // de 1,2 m (la banda) puede contener más del 60 % de los instantes.
  const xs = [];
  for (let k = 0; k < N_EVAL; k++) xs.push(posObjetivo(pts, ((k + 0.5) * T) / N_EVAL));
  xs.sort((a, b) => a - b);
  for (let i = 0, j = 0; i < xs.length; i++) {
    while (j < xs.length && xs[j] - xs[i] <= 2 * BANDA + 1e-9) j++;
    if ((j - i) / N_EVAL > 0.6) return false;
  }
  return true;
}

// Se exporta para que la simulación pruebe exactamente lo que corre aquí.
export function buildCaminaRound(nivel) {
  const gen = [genEscalones, genRampas, genVueltas, genMezcla][Math.min(nivel, 3)];
  for (let intento = 0; intento < 2000; intento++) {
    const pts = gen();
    if (!pts) continue;
    // Si se queda corta de tiempo, se alarga la última parada (o se añade).
    let T = pts[pts.length - 1][0];
    if (T < 8) tramo(pts, 0, 8 - T + randInt(0, 2));
    T = pts[pts.length - 1][0];
    // Dos tramos seguidos con la misma velocidad son uno solo.
    for (let i = pts.length - 2; i > 0; i--) {
      const v1 = (pts[i][1] - pts[i - 1][1]) / (pts[i][0] - pts[i - 1][0]);
      const v2 = (pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]);
      if (v1 === v2) pts.splice(i, 1);
    }
    if (rondaValida(pts, nivel)) return { pts, T, nivel: Math.min(nivel, 3) };
  }
  // Red de seguridad (la simulación comprueba que nunca se usa).
  return { pts: [[0, 3], [3, 3], [5, 7], [9, 7]], T: 9, nivel: 0, reserva: true };
}

// ---------- Utilidades de texto ----------
const fmt = (v) => String(Math.round(v * 10) / 10).replace(".", ",");
const fmtV = (v) => `${fmt(Math.abs(v))} m/s`;

// ---------- Juego ----------
// Geometría de los SVG (unidades del viewBox).
const PX0 = 30; // camino: x del 0 m
const PX1 = 318; // camino: x del 10 m
const PY = 60; // camino: altura de la línea
const GX0 = 34; // gráfica: eje de tiempos
const GX1 = 330;
const GY0 = 14; // gráfica: 10 m
const GY1 = 196; // gráfica: 0 m

export function mountCaminagraficaGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let wins = 0;
  let finished = false;
  let round = null;
  let pos = 5; // posición del muñeco (m)
  let mira = -1; // -1 mira al sensor (izquierda), 1 a la derecha
  let phase = "idle"; // idle | countdown | run | done
  let raf = 0;
  let pending = 0;
  let t0 = 0;
  let samples = [];
  let dragging = false;
  let el = {};

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

  const tx = (t) => GX0 + (t / round.T) * (GX1 - GX0);
  const ty = (x) => GY1 - (x / LARGO) * (GY1 - GY0);
  const px = (x) => PX0 + (x / LARGO) * (PX1 - PX0);

  function caminoSVG() {
    let s = `<line class="cg-road" x1="${PX0}" y1="${PY}" x2="${PX1}" y2="${PY}"/>`;
    for (let m = 0; m <= LARGO; m++) {
      s += `<line class="cg-axis" x1="${px(m)}" y1="${PY - 4}" x2="${px(m)}" y2="${PY + 4}"/>`;
      s += `<text class="cg-plab" x="${px(m)}" y="${PY + 17}" data-pm="${m}">${m}</text>`;
    }
    s += `<text class="cg-sensor" x="13" y="${PY + 5}">📡</text>`;
    s += `<text class="cg-unit" x="${PX1 + 9}" y="${PY + 17}">m</text>`;
    s += `<circle class="cg-dot" data-dot cx="${px(pos)}" cy="${PY}" r="5"/>`;
    s += `<g data-walker><text class="cg-walker" x="0" y="${PY - 8}">🚶</text></g>`;
    return `<svg class="cg-svg" viewBox="0 0 340 84" data-path-svg aria-label="Camino de 0 a 10 metros">${s}</svg>`;
  }

  function graficaSVG() {
    const { pts, T } = round;
    let s = "";
    for (let t = 0; t <= T; t++)
      s += `<line class="cg-grid" x1="${tx(t)}" y1="${GY0}" x2="${tx(t)}" y2="${GY1}"/>`;
    for (let m = 0; m <= LARGO; m++)
      s += `<line class="cg-grid" x1="${GX0}" y1="${ty(m)}" x2="${GX1}" y2="${ty(m)}"/>`;
    s += `<line class="cg-axis" x1="${GX0}" y1="${GY1}" x2="${GX1}" y2="${GY1}"/>`;
    s += `<line class="cg-axis" x1="${GX0}" y1="${GY0}" x2="${GX0}" y2="${GY1}"/>`;
    for (let m = 0; m <= LARGO; m += 2)
      s += `<text class="cg-ylab" x="${GX0 - 5}" y="${ty(m) + 3.5}" data-ym="${m}">${m}</text>`;
    for (let t = 0; t <= T; t += 2)
      s += `<text class="cg-xlab" x="${tx(t)}" y="${GY1 + 13}" data-ts="${t}">${t}</text>`;
    if (T % 2) s += `<text class="cg-xlab" x="${tx(T)}" y="${GY1 + 13}" data-ts="${T}">${T}</text>`;
    s += `<text class="cg-unit" x="${GX0 - 5}" y="${GY0 - 4}" text-anchor="end">m</text>`;
    s += `<text class="cg-unit" x="${GX1}" y="${GY1 + 26}" text-anchor="end">tiempo (s)</text>`;
    // Banda tenue de ±0,6 m (muestreada fina para respetar el recorte 0-10).
    const arriba = [];
    const abajo = [];
    for (let i = 0; i <= T * 10; i++) {
      const t = i / 10;
      const x = posObjetivo(pts, t);
      arriba.push(`${tx(t).toFixed(1)},${ty(clamp(x + BANDA, 0, LARGO)).toFixed(1)}`);
      abajo.push(`${tx(t).toFixed(1)},${ty(clamp(x - BANDA, 0, LARGO)).toFixed(1)}`);
    }
    s += `<polygon class="cg-band" points="${arriba.concat(abajo.reverse()).join(" ")}"/>`;
    s += `<g data-hl></g>`;
    s += `<polyline class="cg-target" data-target points="${pts.map(([t, x]) => `${tx(t)},${ty(x)}`).join(" ")}"/>`;
    s += `<g data-trace><polyline class="cg-user" points=""/></g>`;
    s += `<line class="cg-cursor" data-cursor x1="${GX0}" y1="${GY0}" x2="${GX0}" y2="${GY1}"/>`;
    s += `<text class="cg-count" data-count x="${(GX0 + GX1) / 2}" y="${(GY0 + GY1) / 2 + 18}"></text>`;
    return `<svg class="cg-svg" viewBox="0 0 340 226" data-graph-svg aria-label="Gráfica posición-tiempo">${s}</svg>`;
  }

  function nextRound() {
    if (finished) return;
    const nivel = Math.min(Math.floor(wins / 2), 3);
    round = buildCaminaRound(nivel);
    phase = "idle";
    samples = [];
    pos = 5;
    body.innerHTML = `
      <p class="prompt cg-prompt">Camina la gráfica
        <small>Nivel ${round.nivel + 1} · ${NIVELES_CG[round.nivel]} — arrastra al muñeco para que tu línea vaya dentro de la banda</small></p>
      <div class="cg-track" data-track>${caminoSVG()}</div>
      <div class="cg-status" data-status></div>
      <div class="cg-graph">${graficaSVG()}</div>
      <div class="cg-actions" data-actions>
        <button class="primary" data-start>▶ Empezar</button>
      </div>
      <div class="feedback cg-feedback" data-feedback></div>
    `;
    el = {
      track: body.querySelector("[data-track]"),
      pathSvg: body.querySelector("[data-path-svg]"),
      walker: body.querySelector("[data-walker]"),
      dot: body.querySelector("[data-dot]"),
      status: body.querySelector("[data-status]"),
      cursor: body.querySelector("[data-cursor]"),
      count: body.querySelector("[data-count]"),
      trace: body.querySelector("[data-trace]"),
      user: body.querySelector(".cg-user"),
      hl: body.querySelector("[data-hl]"),
      actions: body.querySelector("[data-actions]"),
      feedback: body.querySelector("[data-feedback]"),
    };
    el.feedback.textContent = `Empieza en ${fmt(round.pts[0][1])} m: colócate durante la cuenta atrás.`;
    el.feedback.className = "feedback cg-feedback";
    body.querySelector("[data-start]").addEventListener("click", empezar);
    bindTrack();
    pintaMuneco(0);
  }

  function pintaMuneco(t) {
    // El emoji 🚶 mira a la izquierda; si va hacia el 10 se le da la vuelta.
    el.walker.setAttribute("transform", `translate(${px(pos).toFixed(1)},0) scale(${mira < 0 ? 1 : -1},1)`);
    el.dot.setAttribute("cx", px(pos).toFixed(1));
    el.status.textContent = `t = ${fmt(t)} s · posición = ${fmt(pos)} m`;
  }

  function bindTrack() {
    const mover = (clientX) => {
      const ctm = el.pathSvg.getScreenCTM();
      if (!ctm) return;
      const p = el.pathSvg.createSVGPoint();
      p.x = clientX;
      p.y = 0;
      const sx = p.matrixTransform(ctm.inverse()).x;
      const nuevo = clamp(((sx - PX0) / (PX1 - PX0)) * LARGO, 0, LARGO);
      if (Math.abs(nuevo - pos) > 0.03) mira = nuevo > pos ? 1 : -1;
      pos = nuevo;
      if (phase !== "run") pintaMuneco(0);
    };
    el.track.addEventListener("pointerdown", (e) => {
      if (finished || phase === "done") return;
      e.preventDefault();
      dragging = true;
      try {
        el.track.setPointerCapture(e.pointerId);
      } catch (_) {
        /* puntero sintético: no pasa nada */
      }
      mover(e.clientX);
    });
    el.track.addEventListener("pointermove", (e) => {
      if (dragging && phase !== "done") mover(e.clientX);
    });
    const soltar = () => (dragging = false);
    el.track.addEventListener("pointerup", soltar);
    el.track.addEventListener("pointercancel", soltar);
  }

  function empezar() {
    if (finished || phase !== "idle") return;
    phase = "countdown";
    el.actions.innerHTML = "";
    el.feedback.textContent = `Ponte en ${fmt(round.pts[0][1])} m…`;
    t0 = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    if (finished) return;
    const s = (now - t0) / 1000;
    if (phase === "countdown") {
      if (s < CUENTA) {
        el.count.textContent = String(Math.ceil(CUENTA - s));
      } else {
        phase = "run";
        t0 = now;
        samples = [[0, pos]];
        el.count.textContent = "¡Ya!";
        el.feedback.textContent = "";
      }
      raf = requestAnimationFrame(tick);
      return;
    }
    if (phase !== "run") return;
    const t = Math.min(s, round.T);
    if (s > 0.6) el.count.textContent = "";
    samples.push([t, pos]);
    el.cursor.setAttribute("x1", tx(t).toFixed(1));
    el.cursor.setAttribute("x2", tx(t).toFixed(1));
    el.user.setAttribute("points", samples.map(([a, b]) => `${tx(a).toFixed(1)},${ty(b).toFixed(1)}`).join(" "));
    pintaMuneco(t);
    if (s >= round.T) {
      phase = "done";
      dragging = false;
      evaluar();
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  // Posición del jugador en t (interpolando entre fotogramas).
  function posJugador(t) {
    let lo = 0;
    let hi = samples.length - 1;
    if (t <= samples[0][0]) return samples[0][1];
    if (t >= samples[hi][0]) return samples[hi][1];
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (samples[mid][0] <= t) lo = mid;
      else hi = mid;
    }
    const [a, xa] = samples[lo];
    const [b, xb] = samples[hi];
    return b === a ? xb : xa + ((xb - xa) * (t - a)) / (b - a);
  }

  function evaluar() {
    rounds++;
    const { pts, T } = round;
    const frac = fraccionEnBanda(pts, T, posJugador);
    const pct = Math.round(frac * 100);
    colorearTraza();
    if (frac >= APROBADO) {
      score += 10;
      wins++;
      renderScore();
      el.feedback.textContent = `¡Bien! Dentro de la banda el ${pct} % del tiempo.`;
      el.feedback.className = "feedback cg-feedback ok";
      pending = setTimeout(nextRound, 1900);
      return;
    }
    lives--;
    renderLives();
    el.feedback.textContent = `✗ Dentro de la banda el ${pct} % del tiempo (hace falta 75 %). ${explicar()}`;
    el.feedback.className = "feedback cg-feedback bad";
    el.actions.innerHTML = `<button class="primary" data-next>${lives > 0 ? "Otra gráfica" : "Ver resultado"}</button>`;
    el.actions.querySelector("[data-next]").addEventListener("click", () => (lives > 0 ? nextRound() : finish(false)));
  }

  // Tu línea, en verde donde ibas dentro de la banda y en rojo fuera.
  function colorearTraza() {
    const { pts } = round;
    const trozos = [];
    let actual = null;
    for (const [t, x] of samples) {
      const ok = Math.abs(x - posObjetivo(pts, t)) <= BANDA;
      const p = `${tx(t).toFixed(1)},${ty(x).toFixed(1)}`;
      if (!actual || actual.ok !== ok) {
        const prev = actual ? actual.p[actual.p.length - 1] : null;
        actual = { ok, p: prev ? [prev] : [] };
        trozos.push(actual);
      }
      actual.p.push(p);
    }
    el.trace.innerHTML = trozos
      .map((z) => `<polyline class="cg-user ${z.ok ? "ok" : "bad"}" points="${z.p.join(" ")}"/>`)
      .join("");
  }

  // Busca el tramo de la gráfica donde peor fue y lo explica con la cuenta.
  function explicar() {
    const { pts, T } = round;
    let peor = null;
    for (let i = 1; i < pts.length; i++) {
      const [ta, xa] = pts[i - 1];
      const [tb, xb] = pts[i];
      let n = 0;
      let dentro = 0;
      for (let k = 0; k < N_EVAL; k++) {
        const t = ((k + 0.5) * T) / N_EVAL;
        if (t < ta || t > tb) continue;
        n++;
        if (Math.abs(posJugador(t) - posObjetivo(pts, t)) <= BANDA) dentro++;
      }
      const frac = n ? dentro / n : 1;
      if (!peor || frac < peor.frac - 1e-9 || (Math.abs(frac - peor.frac) < 1e-9 && tb - ta > peor.tb - peor.ta))
        peor = { ta, tb, xa, xb, frac };
    }
    const { ta, tb, xa, xb } = peor;
    const dt = tb - ta;
    const s = (xb - xa) / dt;
    const ua = posJugador(ta);
    const ub = posJugador(tb);
    const v = (ub - ua) / dt;
    // Se resalta el tramo en la gráfica.
    el.hl.innerHTML = `<rect class="cg-hl" x="${tx(ta)}" y="${GY0}" width="${tx(tb) - tx(ta)}" height="${GY1 - GY0}"/>
      <polyline class="cg-target-hl" points="${tx(ta)},${ty(xa)} ${tx(tb)},${ty(xb)}"/>`;
    let que;
    if (s === 0) que = `Entre ${ta} y ${tb} s te quedas quieto en ${xa} m (línea plana)`;
    else if (s > 0) que = `Entre ${ta} y ${tb} s sube ${xb - xa} m en ${dt} s = ${fmtV(s)} (te alejas del sensor)`;
    else que = `Entre ${ta} y ${tb} s baja ${xa - xb} m en ${dt} s = ${fmtV(s)} (vuelves hacia el sensor)`;
    let tu;
    const medio = (ta + tb) / 2;
    if (s === 0) {
      if (Math.abs(v) >= 0.25) tu = `tu línea está inclinada: te movías a ${fmtV(v)}`;
      else tu = `tú estabas quieto, pero en ${fmt((ua + ub) / 2)} m`;
    } else if (Math.abs(v) < 0.25) tu = "tu línea es plana: estabas parado";
    else if (Math.sign(v) !== Math.sign(s))
      tu = `tu línea va al revés: tú ${v > 0 ? "te alejabas" : "volvías"} a ${fmtV(v)}`;
    else if (Math.abs(v) < Math.abs(s) - 0.3) tu = `tu línea es más tumbada: ibas a ${fmtV(v)}`;
    else if (Math.abs(v) > Math.abs(s) + 0.3) tu = `tu línea es más empinada: ibas a ${fmtV(v)}`;
    else
      tu = `la inclinación era buena (${fmtV(v)}), pero ibas desplazado: a los ${fmt(medio)} s estabas en ${fmt(
        posJugador(medio)
      )} m y tocaba ${fmt(posObjetivo(pts, medio))} m`;
    return `${que}; ${tu}.`;
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    cancelAnimationFrame(raf);
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "caminagrafica", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🚶</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} gráficas caminadas</p>
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
    cancelAnimationFrame(raf);
    clearTimeout(pending);
    lives = startLives;
    score = 0;
    rounds = 0;
    wins = 0;
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    cancelAnimationFrame(raf);
    clearTimeout(pending);
  };
}
