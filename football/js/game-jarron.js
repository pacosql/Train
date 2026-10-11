// "Dibuja cómo se llena": inspirado en "Fill Me Up" (NRICH) y en
// "Water Line" (Desmos). Un grifo echa agua a ritmo constante en un
// jarrón de perfil hecho de 2-4 tramos (cilindros o troncos de cono).
// El jugador DIBUJA a mano alzada la altura del agua según el volumen
// echado (de izquierda a derecha, sin volver atrás; se puede borrar) y
// luego pulsa "Llenar": el jarrón se llena animado y la curva real se
// traza encima de la suya. Se acierta si en al menos 17 de 20 muestras
// su curva cae dentro de una banda del 8 % de la altura.
//
// LA MECÁNICA ES LA MATEMÁTICA: la pendiente de la curva es 1/área de la
// base. Tramo ancho → sube despacio (misma agua, más base) → línea
// tumbada; tramo estrecho → sube deprisa; si el jarrón se ensancha o se
// estrecha dentro de un tramo, la línea se curva. Cada tramo lleva
// escrito su volumen y las juntas están a alturas enteras, así que los
// codos caen en la cuadrícula: lo que hay que pensar es la FORMA.
//
// Al fallar se marca en la gráfica el tramo peor, se explica ("sube
// despacio: misma agua, más base") y, si el jarrón se curvaba ahí y tu
// línea era recta, se dice y se señala.
import { randInt, pick, clamp, saveScore } from "./utils.js";

const MUESTRAS = 20;
const BANDA = 0.08; // fracción de la altura total
const APROBADO = 17; // de 20 (85 %)
const DUR_LLENADO = 3200; // ms

export const NIVELES_JR = ["Dos cilindros", "Tres tramos", "Troncos de cono", "Jarrones mixtos"];

// ---------- Geometría del jarrón ----------

// Tramo con volumen V (L), altura h (cm) y razón q = radio arriba / radio
// abajo. El radio de abajo sale de V = π·h·(r0² + r0·r1 + r1²)/3.
function tramo(V, h, q) {
  const r0 = Math.sqrt((3 * V) / (Math.PI * h * (1 + q + q * q)));
  return { V, h, q, r0, r1: r0 * q };
}

// Altura (cm) que alcanza un volumen v (L) dentro de un tramo, analítica.
function alturaEnTramo(s, v) {
  if (s.q === 1) return v / (Math.PI * s.r0 * s.r0);
  const m = (s.r1 - s.r0) / s.h; // el radio varía linealmente con la altura
  const r = Math.cbrt(s.r0 ** 3 + (3 * m * v) / Math.PI);
  return (r - s.r0) / m;
}

// h(V) del jarrón completo.
export function alturaDeVolumen(jarron, V) {
  let z = 0;
  let acum = 0;
  for (const s of jarron.tramos) {
    if (V <= acum + s.V) return z + alturaEnTramo(s, clamp(V - acum, 0, s.V));
    acum += s.V;
    z += s.h;
  }
  return jarron.H;
}

// Las 20 muestras: volúmenes en el centro de cada vigésimo.
export function volumenesMuestra(Vtot) {
  return Array.from({ length: MUESTRAS }, (_, i) => ((i + 0.5) * Vtot) / MUESTRAS);
}

// Cuántas muestras de la curva f(V) caen en la banda (f puede dar null).
// "holgura" ensancha la banda: las respuestas equivocadas se prueban con
// una banda algo más ancha para que no haya casos que dependan de un pelo.
export function aciertos(jarron, f, holgura = 0) {
  let n = 0;
  for (const V of volumenesMuestra(jarron.Vtot)) {
    const u = f(V);
    if (u !== null && Math.abs(u - alturaDeVolumen(jarron, V)) <= (BANDA + holgura) * jarron.H) n++;
  }
  return n;
}

// Curva interpolando una lista de puntos [V, h] ordenada por V.
export function curvaPoligonal(puntos) {
  return (V) => {
    if (V < puntos[0][0] || V > puntos[puntos.length - 1][0]) return null;
    for (let i = 1; i < puntos.length; i++) {
      const [a, ha] = puntos[i - 1];
      const [b, hb] = puntos[i];
      if (V <= b) return b === a ? hb : ha + ((hb - ha) * (V - a)) / (b - a);
    }
    return puntos[puntos.length - 1][1];
  };
}

// Respuestas "de forma equivocada" que una ronda válida debe suspender.
function juntas(tramos) {
  const p = [[0, 0]];
  let V = 0;
  let z = 0;
  for (const s of tramos) {
    V += s.V;
    z += s.h;
    p.push([V, z]);
  }
  return p;
}

function montar(tramos) {
  const H = tramos.reduce((a, s) => a + s.h, 0);
  const Vtot = tramos.reduce((a, s) => a + s.V, 0);
  return { tramos, H, Vtot };
}

function jarronValido(j, nivel) {
  const { tramos, H, Vtot } = j;
  if (H < 6 || H > 12 || Vtot < 4 || Vtot > 12) return false;
  const radios = tramos.flatMap((s) => [s.r0, s.r1]);
  if (Math.max(...radios) / Math.min(...radios) > 5) return false;
  // Tramos vecinos con "base media" bien distinta (si no, no hay codo).
  for (let i = 1; i < tramos.length; i++) {
    const a = tramos[i - 1].V / tramos[i - 1].h;
    const b = tramos[i].V / tramos[i].h;
    if (Math.max(a, b) / Math.min(a, b) < 1.7) return false;
  }
  // La diagonal recta (llenado "uniforme") tiene que suspender.
  if (aciertos(j, (V) => (V / Vtot) * H, 0.01) >= APROBADO) return false;
  // El jarrón al revés (mismos tramos en orden inverso) tiene que suspender.
  const alReves = montar(tramos.slice().reverse().map((s) => tramo(s.V, s.h, 1 / s.q)));
  if (aciertos(j, (V) => alturaDeVolumen(alReves, V), 0.01) >= APROBADO) return false;
  // Con troncos de cono, unir las juntas con rectas tiene que suspender:
  // ahí lo que se juzga es ver que la línea se curva.
  if (nivel >= 2 && aciertos(j, curvaPoligonal(juntas(tramos)), 0.01) >= APROBADO) return false;
  return true;
}

// Se exporta para que la simulación pruebe exactamente lo que corre aquí.
export function buildJarron(nivel) {
  const nv = Math.min(nivel, 3);
  for (let intento = 0; intento < 5000; intento++) {
    const n = nv === 0 ? 2 : nv === 1 ? 3 : nv === 2 ? pick([2, 3]) : pick([3, 4]);
    const nConos = nv < 2 ? 0 : nv === 2 ? 1 : randInt(2, Math.min(n, 3));
    const conos = new Set();
    while (conos.size < nConos) conos.add(randInt(0, n - 1));
    const tramos = [];
    for (let i = 0; i < n; i++) {
      const cono = conos.has(i);
      const h = cono ? randInt(3, 6) : randInt(2, 5);
      const V = randInt(1, cono ? 6 : 5);
      tramos.push(tramo(V, h, cono ? pick([0.33, 0.4, 0.5, 2, 2.5, 3]) : 1));
    }
    const j = montar(tramos);
    if (jarronValido(j, nv)) return { ...j, nivel: nv };
  }
  // Red de seguridad (la simulación comprueba que nunca se usa).
  return { ...montar([tramo(4, 2, 1), tramo(1, 5, 1)]), nivel: 0, reserva: true };
}

// ---------- Juego ----------
const fmt = (v) => String(Math.round(v * 10) / 10).replace(".", ",");
// Geometría del SVG (unidades del viewBox).
const VCX = 54; // centro del jarrón
const RMAX = 44; // radio máximo dibujado
const GX0 = 128; // gráfica
const GX1 = 350;
const GY0 = 24;
const GY1 = 262;
let uid = 0;

export function mountJarronGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let wins = 0;
  let finished = false;
  let jarron = null;
  let trazo = []; // puntos [V, h] del jugador, crecientes en V
  let phase = "draw"; // draw | fill | done
  let raf = 0;
  let pending = 0;
  let el = {};
  const clipId = `jr-clip-${++uid}`;

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

  const gx = (V) => GX0 + (V / jarron.Vtot) * (GX1 - GX0);
  const gy = (z) => GY1 - (z / jarron.H) * (GY1 - GY0);
  const pts = (lista) => lista.map(([V, z]) => `${gx(V).toFixed(1)},${gy(z).toFixed(1)}`).join(" ");

  function svgJarron() {
    const { tramos, H, Vtot } = jarron;
    const k = RMAX / Math.max(...tramos.flatMap((s) => [s.r0, s.r1]));
    let s = "";
    // Cuadrícula: un litro y un centímetro por línea.
    for (let V = 0; V <= Vtot; V++) s += `<line class="jr-grid" x1="${gx(V)}" y1="${GY0}" x2="${gx(V)}" y2="${GY1}"/>`;
    for (let z = 0; z <= H; z++) s += `<line class="jr-grid" x1="${GX0}" y1="${gy(z)}" x2="${GX1}" y2="${gy(z)}"/>`;
    s += `<line class="jr-axis" x1="${GX0}" y1="${GY1}" x2="${GX1}" y2="${GY1}"/>`;
    s += `<line class="jr-axis" x1="${GX0}" y1="${GY0}" x2="${GX0}" y2="${GY1}"/>`;
    const pasoV = Vtot > 8 ? 2 : 1;
    for (let V = 0; V <= Vtot; V += pasoV) s += `<text class="jr-xlab" x="${gx(V)}" y="${GY1 + 13}" data-xv="${V}">${V}</text>`;
    if (Vtot % pasoV) s += `<text class="jr-xlab" x="${gx(Vtot)}" y="${GY1 + 13}" data-xv="${Vtot}">${Vtot}</text>`;
    for (let z = 0; z <= H; z++) s += `<text class="jr-ylab" x="${GX0 - 4}" y="${gy(z) + 3}" data-yz="${z}">${z}</text>`;
    s += `<text class="jr-unit" x="${GX1}" y="${GY1 + 30}" text-anchor="end">volumen echado (L)</text>`;
    s += `<text class="jr-unit" x="${GX0 - 4}" y="${GY0 - 10}" text-anchor="middle">altura (cm)</text>`;
    // Jarrón: un polígono por tramo, de abajo arriba.
    let z = 0;
    let polys = "";
    let guias = "";
    let etiquetas = "";
    tramos.forEach((t, i) => {
      const yb = gy(z);
      const yt = gy(z + t.h);
      const a = t.r0 * k;
      const b = t.r1 * k;
      const p = `${VCX - a},${yb} ${VCX + a},${yb} ${VCX + b},${yt} ${VCX - b},${yt}`;
      polys += `<polygon class="jr-seg" data-seg="${i}" points="${p}"/>`;
      guias += `<line class="jr-guide" x1="${VCX + b}" y1="${yt}" x2="${GX1}" y2="${yt}"/>`;
      etiquetas += `<text class="jr-vlab" x="${VCX}" y="${(yb + yt) / 2 + 4}" data-vseg="${i}">${t.V} L</text>`;
      z += t.h;
    });
    s += guias;
    s += `<defs><clipPath id="${clipId}">${polys.replace(/class="jr-seg" data-seg="\d+" /g, "")}</clipPath></defs>`;
    s += `<line class="jr-stream" data-stream x1="${VCX}" y1="${GY0 - 16}" x2="${VCX}" y2="${GY0 - 16}"/>`;
    s += `<rect class="jr-water" data-water clip-path="url(#${clipId})" x="${VCX - RMAX - 2}" y="${GY1}" width="${2 * RMAX + 4}" height="0"/>`;
    s += polys;
    s += `<line class="jr-axis" x1="${VCX - RMAX - 4}" y1="${GY1}" x2="${VCX + RMAX + 4}" y2="${GY1}"/>`;
    s += `<text class="jr-tap" x="${VCX + 6}" y="${GY0 - 8}">🚰</text>`;
    s += etiquetas;
    s += `<g data-band></g><g data-hl></g>`;
    s += `<polyline class="jr-user" data-user points="${pts([[0, 0]])}"/>`;
    s += `<polyline class="jr-real" data-real points=""/>`;
    s += `<g data-marks></g>`;
    s += `<circle class="jr-origin" cx="${gx(0)}" cy="${gy(0)}" r="3.5"/>`;
    s += `<rect class="jr-hit" data-hit x="${GX0 - 12}" y="${GY0 - 6}" width="${GX1 - GX0 + 22}" height="${GY1 - GY0 + 14}"/>`;
    return `<svg class="jr-svg" viewBox="0 0 360 300" data-svg aria-label="Jarrón y gráfica volumen-altura">${s}</svg>`;
  }

  function nextRound() {
    if (finished) return;
    jarron = buildJarron(Math.floor(wins / 2));
    trazo = [[0, 0]];
    phase = "draw";
    body.innerHTML = `
      <p class="prompt jr-prompt">¿Cómo sube el agua?
        <small>Nivel ${jarron.nivel + 1} · ${NIVELES_JR[jarron.nivel]} — el grifo echa siempre igual. Dibuja la altura del agua según los litros, de izquierda a derecha.</small></p>
      <div class="jr-wrap">${svgJarron()}</div>
      <div class="jr-actions" data-actions>
        <button class="secondary" data-clear>Borrar</button>
        <button class="primary" data-fill disabled>💧 Llenar</button>
      </div>
      <div class="feedback jr-feedback" data-feedback></div>
    `;
    el = {
      svg: body.querySelector("[data-svg]"),
      hit: body.querySelector("[data-hit]"),
      user: body.querySelector("[data-user]"),
      real: body.querySelector("[data-real]"),
      water: body.querySelector("[data-water]"),
      stream: body.querySelector("[data-stream]"),
      band: body.querySelector("[data-band]"),
      hl: body.querySelector("[data-hl]"),
      marks: body.querySelector("[data-marks]"),
      actions: body.querySelector("[data-actions]"),
      fill: body.querySelector("[data-fill]"),
      feedback: body.querySelector("[data-feedback]"),
    };
    el.feedback.textContent = "Empieza en el punto (0, 0) y llega hasta el borde derecho.";
    el.feedback.className = "feedback jr-feedback";
    body.querySelector("[data-clear]").addEventListener("click", borrar);
    el.fill.addEventListener("click", llenar);
    bindDibujo();
  }

  function borrar() {
    if (phase !== "draw") return;
    trazo = [[0, 0]];
    pintaTrazo();
  }

  function pintaTrazo() {
    el.user.setAttribute("points", pts(trazo));
    const ultimo = trazo[trazo.length - 1][0];
    el.fill.disabled = ultimo < 0.98 * jarron.Vtot;
  }

  function bindDibujo() {
    let pintando = false;
    const anadir = (e) => {
      const ctm = el.svg.getScreenCTM();
      if (!ctm) return;
      const p = el.svg.createSVGPoint();
      p.x = e.clientX;
      p.y = e.clientY;
      const q = p.matrixTransform(ctm.inverse());
      const V = clamp(((q.x - GX0) / (GX1 - GX0)) * jarron.Vtot, 0, jarron.Vtot);
      const z = clamp(((GY1 - q.y) / (GY1 - GY0)) * jarron.H, 0, jarron.H);
      // Solo hacia la derecha: hacia atrás en x no se dibuja.
      const ultimo = trazo[trazo.length - 1][0];
      if (V > ultimo + jarron.Vtot / 400) {
        trazo.push([V, z]);
        pintaTrazo();
      }
    };
    el.hit.addEventListener("pointerdown", (e) => {
      if (finished || phase !== "draw") return;
      e.preventDefault();
      pintando = true;
      try {
        el.hit.setPointerCapture(e.pointerId);
      } catch (_) {
        /* puntero sintético */
      }
      anadir(e);
    });
    el.hit.addEventListener("pointermove", (e) => {
      if (pintando && phase === "draw") anadir(e);
    });
    const soltar = () => (pintando = false);
    el.hit.addEventListener("pointerup", soltar);
    el.hit.addEventListener("pointercancel", soltar);
  }

  // Animación del llenado: agua subiendo y curva real trazándose encima.
  function llenar() {
    if (finished || phase !== "draw") return;
    phase = "fill";
    el.actions.innerHTML = "";
    el.feedback.textContent = "Llenando…";
    const t0 = performance.now();
    const paso = (now) => {
      if (finished) return;
      const f = Math.min((now - t0) / DUR_LLENADO, 1);
      const V = f * jarron.Vtot;
      const z = alturaDeVolumen(jarron, V);
      el.water.setAttribute("y", gy(z).toFixed(1));
      el.water.setAttribute("height", (GY1 - gy(z)).toFixed(1));
      el.stream.setAttribute("y2", f < 1 ? gy(z).toFixed(1) : String(GY0 - 16));
      const n = Math.max(1, Math.round(f * 160));
      const curva = [];
      for (let i = 0; i <= n; i++) {
        const v = (i / 160) * jarron.Vtot;
        curva.push([v, alturaDeVolumen(jarron, v)]);
      }
      el.real.setAttribute("points", pts(curva));
      if (f < 1) raf = requestAnimationFrame(paso);
      else evaluar();
    };
    raf = requestAnimationFrame(paso);
  }

  function evaluar() {
    phase = "done";
    rounds++;
    const { H, Vtot } = jarron;
    const curvaJugador = curvaPoligonal(trazo);
    // Banda tenue alrededor de la curva real.
    const arriba = [];
    const abajo = [];
    for (let i = 0; i <= 120; i++) {
      const V = (i / 120) * Vtot;
      const z = alturaDeVolumen(jarron, V);
      arriba.push([V, clamp(z + BANDA * H, 0, H)]);
      abajo.push([V, clamp(z - BANDA * H, 0, H)]);
    }
    el.band.innerHTML = `<polygon class="jr-band" points="${pts(arriba.concat(abajo.reverse()))}"/>`;
    // Las 20 muestras, en verde o rojo sobre tu curva.
    const fallosPorTramo = jarron.tramos.map(() => 0);
    let n = 0;
    el.marks.innerHTML = volumenesMuestra(Vtot)
      .map((V) => {
        const u = curvaJugador(V);
        const ok = u !== null && Math.abs(u - alturaDeVolumen(jarron, V)) <= BANDA * H;
        if (ok) n++;
        else fallosPorTramo[tramoDe(V)]++;
        return `<circle class="jr-mark ${ok ? "ok" : "bad"}" cx="${gx(V).toFixed(1)}" cy="${gy(u ?? 0).toFixed(1)}" r="3"/>`;
      })
      .join("");
    if (n >= APROBADO) {
      score += 10;
      wins++;
      renderScore();
      el.feedback.textContent = `¡Bien! ${n} de 20 puntos dentro de la banda.`;
      el.feedback.className = "feedback jr-feedback ok";
      pending = setTimeout(nextRound, 2000);
      return;
    }
    lives--;
    renderLives();
    const peor = fallosPorTramo.indexOf(Math.max(...fallosPorTramo));
    el.feedback.textContent = `✗ ${n} de 20 puntos dentro de la banda (hacen falta 17). ${explicar(peor, curvaJugador)}`;
    el.feedback.className = "feedback jr-feedback bad";
    el.actions.innerHTML = `<button class="primary" data-next>${lives > 0 ? "Otro jarrón" : "Ver resultado"}</button>`;
    el.actions.querySelector("[data-next]").addEventListener("click", () => (lives > 0 ? nextRound() : finish(false)));
  }

  function tramoDe(V) {
    let acum = 0;
    for (let i = 0; i < jarron.tramos.length; i++) {
      acum += jarron.tramos[i].V;
      if (V <= acum) return i;
    }
    return jarron.tramos.length - 1;
  }

  // Explica el tramo donde más falló y lo marca en la gráfica.
  function explicar(i, curvaJugador) {
    const { tramos } = jarron;
    const t = tramos[i];
    const Va = tramos.slice(0, i).reduce((a, s) => a + s.V, 0);
    const Vb = Va + t.V;
    const za = tramos.slice(0, i).reduce((a, s) => a + s.h, 0);
    const zb = za + t.h;
    const base = t.V / t.h;
    const otras = tramos.filter((_, j) => j !== i).map((s) => s.V / s.h);
    const ancho = base > otras.reduce((a, b) => a + b, 0) / otras.length;
    const subida = (curvaJugador(Vb) ?? 0) - (curvaJugador(Va) ?? 0);
    // ¿Tu trozo era recto? Se compara lo que se separa de su cuerda con lo
    // que se separa la curva real de la suya.
    let combaReal = 0;
    let combaTuya = 0;
    for (let k = 1; k < 10; k++) {
      const V = Va + (k / 10) * t.V;
      const cuerdaR = za + (k / 10) * t.h;
      combaReal = Math.max(combaReal, Math.abs(alturaDeVolumen(jarron, V) - cuerdaR));
      const ua = curvaJugador(Va) ?? 0;
      const ub = curvaJugador(Vb) ?? 0;
      combaTuya = Math.max(combaTuya, Math.abs((curvaJugador(V) ?? 0) - (ua + (k / 10) * (ub - ua))));
    }
    const recta = t.q !== 1 && combaTuya < 0.4 * combaReal;
    el.hl.innerHTML = `<rect class="jr-hl" x="${gx(Va)}" y="${GY0}" width="${gx(Vb) - gx(Va)}" height="${GY1 - GY0}"/>
      ${recta ? `<text class="jr-hl-lab" x="${(gx(Va) + gx(Vb)) / 2}" y="${GY0 + 12}">aquí curva</text>` : ""}`;
    let txt = `De ${Va} a ${Vb} L se llena el tramo de ${za} a ${zb} cm: `;
    if (t.q === 1) {
      txt += `${t.V} L lo suben ${t.h} cm. Es ${ancho ? "ancho" : "estrecho"}, así que ${
        ancho ? "sube despacio: misma agua, más base" : "sube deprisa: menos base, el agua trepa"
      } (línea recta ${ancho ? "tumbada" : "empinada"}). Tu curva ahí subía ${fmt(subida)} cm.`;
    } else if (t.q > 1) {
      txt += `el jarrón se ensancha hacia arriba, así que cada litro tiene más base que el anterior y sube menos: la línea real se curva y se va tumbando.`;
      txt += recta ? " Tu línea ahí era recta." : ` Tu curva ahí subía ${fmt(subida)} cm y tenían que ser ${t.h}.`;
    } else {
      txt += `el jarrón se estrecha hacia arriba, así que cada litro tiene menos base que el anterior y sube más: la línea real se curva y se va empinando.`;
      txt += recta ? " Tu línea ahí era recta." : ` Tu curva ahí subía ${fmt(subida)} cm y tenían que ser ${t.h}.`;
    }
    return txt;
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
    saveScore(client, "jarron", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>🏺</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} jarrones acertados</p>
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
