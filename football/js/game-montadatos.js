// "Monta los datos": problema INVERSO de estadística. En vez de calcular la
// media o la mediana de una lista dada, el jugador CONSTRUYE un conjunto de
// datos sobre un diagrama de puntos (recta 0-10) que cumpla unas tarjetas de
// condición ("media 5", "mediana 4", "rango 6", "moda 3"…). Hay muchas
// soluciones: se corrige por propiedad, con la media en fracción exacta.
//
// Gesto: tocar encima de un valor apila un punto en esa columna; arrastrar
// un punto lo lleva a otra columna; arrastrarlo fuera del diagrama lo quita.
// Nivel especial: "mueve solo 1 punto para que la media suba 1 sin que la
// mediana se mueva" partiendo de un conjunto dado.
//
// Generación: se construye un conjunto aleatorio válido y de él se derivan
// las condiciones, así que siempre existe solución (y se enseña al fallar).
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const VMAX = 10;
const X0 = 24; // x de la columna 0 en el SVG
const DX = 31.2; // separación entre columnas (0…10 → 24…336)
const W = 360;
const R = 10.5; // radio de los puntos
const DY = 23; // separación vertical entre puntos apilados
const TOP = 24; // margen superior (para ver el punto que se arrastra)

// ---------- aritmética exacta ----------
const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
};
// n/d con coma decimal; si no es exacta con 2 decimales, "≈".
export function fmtFrac(n, d) {
  if (d < 0) (n = -n), (d = -d);
  const g = gcd(n, d);
  n /= g;
  d /= g;
  if (d === 1) return String(n);
  const x = n / d;
  const s = x.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return (Math.abs(Number(s) - x) < 1e-12 ? "" : "≈") + s.replace(".", ",");
}
const ord = (k) => `${k}.º`;

// Estadísticos de una lista de valores enteros 0-10.
export function statsOf(vals) {
  const s = vals.slice().sort((a, b) => a - b);
  const N = s.length;
  if (!N) return null;
  const sum = s.reduce((a, b) => a + b, 0);
  const med2 = N % 2 ? 2 * s[(N - 1) / 2] : s[N / 2 - 1] + s[N / 2]; // el doble de la mediana
  const counts = Array(VMAX + 1).fill(0);
  s.forEach((v) => counts[v]++);
  const top = Math.max(...counts);
  const modes = [];
  counts.forEach((c, v) => c === top && modes.push(v));
  return { s, N, sum, med2, min: s[0], max: s[N - 1], counts, top, modes };
}
const toVals = (counts) => counts.flatMap((c, v) => Array(c).fill(v));

// ---------- niveles ----------
function levelCfg(level) {
  if (level <= 1) return { type: "build", N: [5], conds: [["mean"]], live: true };
  if (level <= 3) return { type: "build", N: [5, 7], conds: [["mean", "median"]], live: true };
  if (level <= 5)
    return { type: "build", N: [5, 7], conds: [["mean", "median", "range"], ["mean", "median", "min"]], live: true };
  if (level === 6) return { type: "shift", N: [5], dirs: [1], live: true };
  if (level <= 8)
    return { type: "build", N: [6, 7, 8], conds: [["mean", "median", "mode"], ["mean", "mode", "range"]], live: true };
  if (level === 9) return { type: "shift", N: [5, 6], dirs: [1, -1], live: true };
  // Nivel alto: los valores actuales solo se ven al comprobar.
  if (level % 4 === 1) return { type: "shift", N: [5, 6, 7], dirs: [1, -1], live: false, half: true };
  return { type: "build", N: [5, 6, 7, 8, 9], conds: "random", live: false, half: true };
}

function randomVals(N, lo, hi) {
  return Array.from({ length: N }, () => randInt(lo, hi));
}

// Ronda: { type, N, conds, solution, start?, dir?, live }
export function buildMontadatosRound(level) {
  const cfg = levelCfg(level);
  for (let guard = 0; guard < 20000; guard++) {
    const N = pick(cfg.N);
    if (cfg.type === "shift") {
      const dir = pick(cfg.dirs);
      const vals = randomVals(N, randInt(0, 2), randInt(8, 10));
      const st = statsOf(vals);
      if (fmtFrac(st.sum, N).startsWith("≈")) continue; // media de partida "limpia"
      if (st.max - st.min < 3) continue;
      if (st.med2 % 2 && !cfg.half) continue; // mediana entera en niveles bajos
      // Todas las soluciones: mover UN punto de v a v ± N (la suma cambia en N)
      // sin que cambie la mediana.
      const sols = [];
      for (let v = 0; v <= VMAX; v++) {
        if (!st.counts[v]) continue;
        const w = v + dir * N;
        if (w < 0 || w > VMAX) continue;
        const nv = st.s.slice();
        nv[nv.indexOf(v)] = w;
        if (statsOf(nv).med2 === st.med2) sols.push(nv.sort((a, b) => a - b));
      }
      if (!sols.length) continue;
      return {
        type: "shift",
        N,
        dir,
        live: cfg.live,
        start: st.s,
        conds: [
          { k: "moved" },
          { k: "meanTo", n: st.sum + dir * N, d: N, from: st.sum },
          { k: "medianKeep", m2: st.med2 },
        ],
        solution: pick(sols),
        nSolutions: sols.length,
      };
    }
    const kinds =
      cfg.conds === "random"
        ? ["mean", ...shuffle(["median", "mode", "range", "min", "max"]).slice(0, randInt(2, 3))]
        : pick(cfg.conds);
    const lo = randInt(0, 3);
    const hi = randInt(Math.max(lo + 5, 7), VMAX);
    let vals = randomVals(N, lo, hi);
    if (kinds.includes("mode")) {
      const m = randInt(lo, hi);
      const times = randInt(2, Math.min(3, N - 2));
      vals = shuffle([...Array(times).fill(m), ...randomVals(N - times, lo, hi)]);
    }
    const st = statsOf(vals);
    if (st.max - st.min < 3) continue;
    const g = gcd(st.sum, N);
    const md = N / g;
    if (md !== 1 && !(cfg.half && md === 2)) continue;
    if (st.sum < 1.5 * N || st.sum > 8.5 * N) continue;
    if (kinds.includes("median") && st.med2 % 2 && !cfg.half) continue;
    if (kinds.includes("mode") && !(st.top >= 2 && st.modes.length === 1)) continue;
    const conds = kinds.map((k) => {
      if (k === "mean") return { k, n: st.sum / g, d: md };
      if (k === "median") return { k, m2: st.med2 };
      if (k === "mode") return { k, t: st.modes[0] };
      if (k === "range") return { k, t: st.max - st.min };
      if (k === "min") return { k, t: st.min };
      return { k: "max", t: st.max };
    });
    return { type: "build", N, live: cfg.live, conds, solution: st.s };
  }
  throw new Error("montadatos: no se pudo generar ronda");
}

// ---------- evaluación de una condición ----------
// Devuelve { ok, now } — now es el valor actual en texto.
export function evalCond(c, st, round) {
  if (!st) return { ok: false, now: "—" };
  switch (c.k) {
    case "mean":
    case "meanTo":
      return { ok: st.sum * c.d === c.n * st.N, now: fmtFrac(st.sum, st.N) };
    case "median":
    case "medianKeep":
      return { ok: st.med2 === c.m2, now: fmtFrac(st.med2, 2) };
    case "range":
      return { ok: st.max - st.min === c.t, now: String(st.max - st.min) };
    case "min":
      return { ok: st.min === c.t, now: String(st.min) };
    case "max":
      return { ok: st.max === c.t, now: String(st.max) };
    case "mode": {
      const uniq = st.top >= 2 && st.modes.length === 1;
      return { ok: uniq && st.modes[0] === c.t, now: st.top < 2 ? "ninguna" : uniq ? String(st.modes[0]) : "empate" };
    }
    case "moved": {
      const sc = statsOf(round.start).counts;
      const kept = sc.reduce((a, c2, v) => a + Math.min(c2, st.counts[v]), 0);
      const moved = round.N - kept;
      return { ok: moved === 1 && st.N === round.N, now: String(moved) };
    }
  }
  return { ok: false, now: "?" };
}

function condLabel(c, round) {
  switch (c.k) {
    case "mean":
      return ["Media", fmtFrac(c.n, c.d)];
    case "median":
      return ["Mediana", fmtFrac(c.m2, 2)];
    case "range":
      return ["Rango", String(c.t)];
    case "min":
      return ["Valor más pequeño", String(c.t)];
    case "max":
      return ["Valor más grande", String(c.t)];
    case "mode":
      return ["Moda", String(c.t)];
    case "moved":
      return ["Puntos movidos", "1"];
    case "meanTo":
      return ["Media", `${fmtFrac(c.from, round.N)} → ${fmtFrac(c.n, c.d)}`];
    case "medianKeep":
      return ["Mediana", `sigue en ${fmtFrac(c.m2, 2)}`];
  }
  return ["?", "?"];
}

// Explicación concreta de por qué una tarjeta está en rojo.
function explain(c, st, round) {
  const N = round.N;
  const list = st.s.join(" ");
  switch (c.k) {
    case "mean":
    case "meanTo": {
      const need = (c.n * N) / c.d; // suma necesaria (siempre entera)
      const diff = need - st.sum;
      const head =
        c.k === "mean"
          ? `Media ${fmtFrac(c.n, c.d)} con ${N} puntos → la suma tiene que ser ${N} × ${fmtFrac(c.n, c.d)} = ${need}`
          : `La media tenía que ${round.dir > 0 ? "subir" : "bajar"} 1: con ${N} puntos la suma ${
              round.dir > 0 ? "sube" : "baja"
            } ${N}, de ${c.from} a ${need}`;
      const tail =
        c.k === "meanTo" ? ` Moviendo un solo punto, tiene que ${round.dir > 0 ? "avanzar" : "retroceder"} ${N} columnas.` : "";
      return `${head}; la tuya suma ${st.sum}: te ${diff > 0 ? "faltan" : "sobran"} ${Math.abs(diff)}.${tail}`;
    }
    case "median":
    case "medianKeep": {
      const want = fmtFrac(c.m2, 2);
      const verb = c.k === "median" ? "tenía que ser" : "tenía que seguir en";
      if (N % 2) {
        const k = (N + 1) / 2;
        return `La mediana es el ${ord(k)} de ${N} ordenados (${list}): el tuyo es ${st.s[k - 1]}; ${verb} ${want}.`;
      }
      const k = N / 2;
      return `Con ${N} puntos la mediana es la media del ${ord(k)} y el ${ord(k + 1)} ordenados (${list}): los tuyos son ${
        st.s[k - 1]
      } y ${st.s[k]} → ${fmtFrac(st.med2, 2)}; ${verb} ${want}.`;
    }
    case "range":
      return `Rango = mayor − menor: el tuyo es ${st.max} − ${st.min} = ${st.max - st.min}; tenía que ser ${c.t}.`;
    case "min":
      return `Tu valor más pequeño es ${st.min}; tenía que ser ${c.t} (¿hay algún punto en el ${c.t}?).`;
    case "max":
      return `Tu valor más grande es ${st.max}; tenía que ser ${c.t}.`;
    case "mode":
      if (st.top < 2)
        return `No se repite ningún valor, así que no hay moda: el ${c.t} tiene que repetirse más que ningún otro.`;
      if (st.modes.length > 1)
        return `Hay empate: ${st.modes.join(", ")} salen ${st.top} veces cada uno. La moda tiene que ser solo el ${c.t}, que se repita más que los demás.`;
      return `La moda es el valor que más se repite: el tuyo es ${st.modes[0]} (${st.top} veces); tenía que ser ${c.t}.`;
    case "moved": {
      const moved = evalCond(c, st, round).now;
      return moved === "0" ? "No has movido ningún punto." : `Has cambiado ${moved} puntos de sitio: solo se puede mover 1.`;
    }
  }
  return "";
}

// ---------- dibujo del diagrama de puntos ----------
const colX = (v) => X0 + v * DX;
function plotSVG(counts, { rows, start = null, cls = "", fulcrum = null, attrs = "" }) {
  const axis = TOP + rows * DY;
  const H = axis + 38;
  let s = `<svg class="md-plot ${cls}" viewBox="0 0 ${W} ${H}" ${attrs}>`;
  for (let v = 0; v <= VMAX; v++)
    s += `<rect class="md-col" data-col="${v}" x="${colX(v) - DX / 2 + 1}" y="2" width="${DX - 2}" height="${
      axis - 2
    }" rx="7"/>`;
  s += `<line class="md-axis" x1="${X0 - DX / 2}" y1="${axis}" x2="${colX(VMAX) + DX / 2}" y2="${axis}"/>`;
  for (let v = 0; v <= VMAX; v++)
    s += `<line class="md-tick" x1="${colX(v)}" y1="${axis}" x2="${colX(v)}" y2="${axis + 6}"/><text class="md-lab" x="${colX(
      v
    )}" y="${axis + 19}">${v}</text>`;
  if (start) {
    const sc = statsOf(start).counts;
    sc.forEach((c, v) => {
      for (let i = 0; i < c; i++) s += `<circle class="md-start" cx="${colX(v)}" cy="${axis - 13 - i * DY}" r="${R}"/>`;
    });
  }
  counts.forEach((c, v) => {
    for (let i = 0; i < c; i++)
      s += `<circle class="md-dot" data-v="${v}" cx="${colX(v)}" cy="${axis - 13 - i * DY}" r="${R}"/>`;
  });
  if (fulcrum !== null) {
    const fx = X0 + fulcrum * DX;
    s += `<path class="md-fulcrum" d="M${fx} ${axis + 23} l-7 11 h14 z"/><text class="md-flab" x="${
      fx + (fulcrum > 8.5 ? -12 : 12)
    }" y="${axis + 33}" text-anchor="${fulcrum > 8.5 ? "end" : "start"}">media</text>`;
  }
  s += `<circle class="md-drag" data-drag r="${R + 1}" cx="-50" cy="-50"/>`;
  return s + "</svg>";
}

export function mountMontadatosGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let round = null;
  let counts = [];
  let busy = false;
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
    <div class="game-body md-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");

  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const total = () => counts.reduce((a, b) => a + b, 0);

  function nextRound() {
    if (finished) return;
    body.classList.add("md-body");
    round = buildMontadatosRound(level);
    counts = Array(VMAX + 1).fill(0);
    if (round.start) round.start.forEach((v) => counts[v]++);
    busy = false;
    const shift = round.type === "shift";
    const title = shift
      ? `Mueve <b>solo 1 punto</b> para que la media <b>${round.dir > 0 ? "suba" : "baje"} 1</b> sin que la mediana se mueva`
      : `Monta <b>${round.N} puntos</b> que cumplan:`;
    const help = shift
      ? "Arrastra un punto a otra columna · los círculos huecos marcan dónde estaban"
      : "Toca encima de un número para apilar un punto · arrástralo para moverlo · sácalo fuera para quitarlo";
    body.innerHTML = `
      <p class="prompt md-prompt">${title}<small>${help}</small></p>
      <div class="md-cards" data-cards></div>
      <div class="md-count" data-count></div>
      <div class="md-stage" data-stage></div>
      <div class="md-actions">
        <button type="button" class="secondary" data-reset>${shift ? "↺ Como estaba" : "⌫ Vaciar"}</button>
        <button type="button" class="primary" data-check>Comprobar</button>
      </div>
      <div class="feedback" data-feedback></div>
      <div class="md-why" data-why></div>
    `;
    body.querySelector("[data-reset]").addEventListener("click", () => {
      if (busy || finished) return;
      counts = Array(VMAX + 1).fill(0);
      if (round.start) round.start.forEach((v) => counts[v]++);
      setFeedback("", "");
      paint();
    });
    body.querySelector("[data-check]").addEventListener("click", check);
    paint();
  }

  function setFeedback(text, cls) {
    const f = body.querySelector("[data-feedback]");
    if (!f) return;
    f.textContent = text;
    f.className = `feedback ${cls}`;
  }

  // Pinta tarjetas, contador y diagrama. results: array de {ok} tras comprobar.
  function paint(results) {
    const st = statsOf(toVals(counts));
    const showNow = round.live || results;
    body.querySelector("[data-cards]").innerHTML = round.conds
      .map((c, i) => {
        const [name, target] = condLabel(c, round);
        const ev = evalCond(c, st, round);
        const state = results ? (results[i] ? "md-ok" : "md-bad") : round.live && ev.ok ? "md-live-ok" : "";
        return `<div class="md-card ${state}" data-cond="${c.k}">
          <span class="md-c-name">${name}</span>
          <b class="md-c-target">${target}</b>
          <span class="md-c-now">${showNow ? `ahora: <b data-now>${ev.now}</b>` : "ahora: ?"}</span>
        </div>`;
      })
      .join("");
    const n = total();
    const countEl = body.querySelector("[data-count]");
    countEl.innerHTML = `<b>${n}</b> de <b>${round.N}</b> puntos`;
    countEl.classList.toggle("md-full", n === round.N);
    const stage = body.querySelector("[data-stage]");
    const fulcrum = st && (round.live || results) ? st.sum / st.N : null;
    stage.innerHTML = plotSVG(counts, {
      rows: round.N,
      start: round.start,
      fulcrum,
      attrs: 'data-svg aria-label="diagrama de puntos"',
    });
    body.querySelector("[data-check]").disabled = busy || n !== round.N;
    bindPlot(stage.querySelector("[data-svg]"));
  }

  // ---------- gesto sobre el diagrama ----------
  function bindPlot(svg) {
    const axis = TOP + round.N * DY;
    const toSvg = (e) => {
      const m = svg.getScreenCTM();
      if (!m) return { x: -1, y: -1 };
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      return { x: p.x, y: p.y };
    };
    const colAt = (p) => {
      const v = Math.round((p.x - X0) / DX);
      if (v < 0 || v > VMAX || Math.abs(p.x - colX(v)) > DX / 2) return -1;
      return v;
    };
    const inside = (p) => p.x >= X0 - DX / 2 && p.x <= colX(VMAX) + DX / 2 && p.y >= -6 && p.y <= axis + 26;
    const drag = svg.querySelector("[data-drag]");
    let g = null; // gesto en curso

    svg.addEventListener("pointerdown", (e) => {
      if (busy || finished || g) return;
      e.preventDefault();
      const p = toSvg(e);
      const v = colAt(p);
      if (v < 0 || p.y > axis + 26) return;
      // ¿Ha cogido un punto? (cualquier punto de la pila de esa columna)
      const stackTop = axis - 13 - (counts[v] - 1) * DY - R - 6;
      const onDot = counts[v] > 0 && p.y >= stackTop && p.y <= axis + 4;
      g = { id: e.pointerId, sx: e.clientX, sy: e.clientY, v, onDot, dragging: false };
      try {
        svg.setPointerCapture(e.pointerId);
      } catch (_) {}
    });
    svg.addEventListener("pointermove", (e) => {
      if (!g || e.pointerId !== g.id) return;
      if (!g.dragging) {
        if (!g.onDot || Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 8) return;
        g.dragging = true;
        // El punto de arriba de la columna se "levanta".
        const dots = [...svg.querySelectorAll(`.md-dot[data-v="${g.v}"]`)];
        const topDot = dots[dots.length - 1];
        if (topDot) topDot.classList.add("md-lifted");
      }
      const p = toSvg(e);
      drag.setAttribute("cx", p.x);
      drag.setAttribute("cy", p.y);
      const out = !inside(p);
      drag.classList.toggle("md-out", out);
      const c = out ? -1 : colAt(p);
      svg.querySelectorAll(".md-col").forEach((r) => r.classList.toggle("md-over", Number(r.dataset.col) === c));
    });
    const end = (e) => {
      if (!g || e.pointerId !== g.id) return;
      const gg = g;
      g = null;
      if (busy || finished) return;
      if (!gg.dragging) {
        // Toque: apila un punto en esa columna.
        if (total() >= round.N) {
          setFeedback(`Ya tienes ${round.N} de ${round.N} puntos: arrastra uno fuera para quitarlo.`, "bad");
          return;
        }
        counts[gg.v]++;
        setFeedback("", "");
        return paint();
      }
      const p = toSvg(e);
      counts[gg.v]--;
      if (e.type !== "pointercancel" && inside(p)) {
        const c = colAt(p);
        counts[c >= 0 ? c : gg.v]++;
      }
      setFeedback("", "");
      paint();
    };
    svg.addEventListener("pointerup", end);
    svg.addEventListener("pointercancel", end);
  }

  // ---------- corrección ----------
  function check() {
    if (busy || finished || total() !== round.N) return;
    busy = true;
    rounds++;
    const st = statsOf(toVals(counts));
    const results = round.conds.map((c) => evalCond(c, st, round).ok);
    paint(results);
    if (results.every(Boolean)) {
      score += 10;
      level++;
      renderScore();
      setFeedback(`¡Todas verdes! ${st.s.join(" · ")}`, "ok");
      later(nextRound, 1500);
      return;
    }
    lives--;
    renderLives();
    const bad = round.conds.filter((c, i) => !results[i]);
    setFeedback(`✗ ${bad.length === 1 ? "Una tarjeta está en rojo" : `${bad.length} tarjetas en rojo`}`, "bad");
    const sol = statsOf(round.solution);
    const why = body.querySelector("[data-why]");
    why.innerHTML = `
      <ul class="md-reasons">${bad.map((c) => `<li>${explain(c, st, round)}</li>`).join("")}</ul>
      <div class="md-sol-title">Una solución válida: <b>${round.solution.join(" · ")}</b></div>
      ${plotSVG(sol.counts, { rows: sol.top, start: round.start, cls: "md-mini", fulcrum: sol.sum / sol.N })}
      <button type="button" class="primary md-next" data-next>${lives <= 0 ? "Ver resultado" : "Siguiente ▶"}</button>
    `;
    why.querySelector("[data-next]").addEventListener("click", () => {
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
    body.classList.remove("md-body"); // el end-card va centrado, como en el resto
    saveScore(client, "montadatos", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📊</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} conjuntos de datos montados</p>
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
  };
}
