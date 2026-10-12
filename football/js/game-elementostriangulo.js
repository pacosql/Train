// "Elementos del triángulo": un triángulo ABC dibujado como en el libro
// (cuadradito de 90°, rayitas de mitades iguales, arquitos de ángulos
// iguales) y "Toca la altura". Según el nivel se tocan vértices y lados,
// rectas notables (altura, mediana, bisectriz, mediatriz, cada una de un
// color), hipotenusa y catetos, o el punto donde se cortan tres rectas
// notables (ortocentro, baricentro, incentro, circuncentro).
import { randInt, pick, shuffle, saveScore } from "./utils.js";

const W = 340, H = 320;
const COLORS = ["#f76707", "#339af0", "#e64980", "#ae3ec9"];
const add = (a, b, k = 1) => [a[0] + k * b[0], a[1] + k * b[1]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const len = (a) => Math.hypot(a[0], a[1]);
const unit = (a) => [a[0] / len(a), a[1] / len(a)];
const dist = (a, b) => len(sub(a, b));
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const r1 = (p) => p.map((v) => Math.round(v * 10) / 10);
const foot = (p, a, b) => { const d = sub(b, a), t = ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2); return add(a, d, t); };
function segDist(p, a, b) { const d = sub(b, a), t = Math.max(0, Math.min(1, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] ** 2 + d[1] ** 2))); return dist(p, add(a, d, t)); }
function cross(p1, p2, q1, q2) { const d = sub(p2, p1), e = sub(q2, q1), den = d[0] * e[1] - d[1] * e[0], t = ((q1[0] - p1[0]) * e[1] - (q1[1] - p1[1]) * e[0]) / den; return add(p1, d, t); }

// Triángulo con ángulos dados (grados), girado, quizá reflejado y encajado.
function triangle(angles) {
  const [a, b] = angles.map((x) => (x * Math.PI) / 180);
  const P = [[0, 0], [1, 0]];
  const t = Math.sin(b) / Math.sin(a + b);
  P.push([t * Math.cos(a), -t * Math.sin(a)]);
  const rot = (randInt(-18, 18) * Math.PI) / 180, m = Math.random() < 0.5 ? 1 : -1;
  const Q = P.map(([x, y]) => [m * (x * Math.cos(rot) - y * Math.sin(rot)), x * Math.sin(rot) + y * Math.cos(rot)]);
  const xs = Q.map((p) => p[0]), ys = Q.map((p) => p[1]);
  const s = Math.min((W - 76) / (Math.max(...xs) - Math.min(...xs)), (H - 64) / (Math.max(...ys) - Math.min(...ys)));
  const ox = (W - s * (Math.max(...xs) - Math.min(...xs))) / 2 - s * Math.min(...xs), oy = (H - s * (Math.max(...ys) - Math.min(...ys))) / 2 - s * Math.min(...ys);
  return shuffle(Q.map(([x, y]) => r1([ox + s * x, oy + s * y])));
}
const acuteAngles = () => { for (;;) { const a = randInt(46, 80), b = randInt(46, 80), c = 180 - a - b; if (c >= 46 && c <= 80 && Math.min(Math.abs(a - b), Math.abs(b - c), Math.abs(a - c)) >= 5) return [a, b, c]; } };

// Recta notable que sale del vértice i (o mediatriz del lado opuesto a i).
function notable(kind, V, i) {
  const l = notableRaw(kind, V, i);
  return { ...l, p: r1(l.p), q: r1(l.q), m: l.m && r1(l.m) };
}
function notableRaw(kind, V, i) {
  const v = V[i], b = V[(i + 1) % 3], c = V[(i + 2) % 3], M = mid(b, c);
  if (kind === "altura") return { p: v, q: foot(v, b, c) };
  if (kind === "mediana") return { p: v, q: M };
  if (kind === "bisectriz") return { p: v, q: add(b, sub(c, b), dist(v, b) / (dist(v, b) + dist(v, c))) };
  const n = unit(sub(v, foot(v, b, c))); // perpendicular hacia dentro
  const ends = [[v, b], [v, c]].map(([x, y]) => cross(M, add(M, n), x, y)).filter((p) => (p[0] - M[0]) * n[0] + (p[1] - M[1]) * n[1] > 1);
  const far = ends.sort((x, y) => dist(x, M) - dist(y, M))[0];
  return { p: add(M, n, -18), q: add(far, n, 18), m: M };
}
const POINT = { altura: ["las tres alturas", "el ortocentro"], mediana: ["las tres medianas", "el baricentro"], bisectriz: ["las tres bisectrices", "el incentro"], mediatriz: ["las tres mediatrices", "el circuncentro"] };
const LINE_DEF = {
  altura: (X) => `La altura sale de un vértice (aquí ${X}) y llega perpendicular al lado opuesto: el cuadradito de 90°`,
  mediana: (X) => `La mediana va de un vértice (aquí ${X}) al punto medio del lado opuesto: las rayitas marcan dos mitades iguales`,
  bisectriz: (X) => `La bisectriz parte el ángulo ${X} en dos ángulos iguales (los dos arquitos)`,
  mediatriz: (X, S) => `La mediatriz es la perpendicular al lado ${S} por su punto medio (cuadradito y rayitas)`,
};

// Niveles: 0 vértices y lados · 1 altura/mediana · 2 + bisectriz y
// mediatriz · 3 hipotenusa y catetos · 4 punto donde se cortan tres rectas.
export function buildRound(level, roundNo = 0) {
  const names = ["A", "B", "C"];
  const type = level === 0 ? "vl" : level <= 2 ? (roundNo % 3 === 2 ? "vl" : "rectas")
    : level === 3 ? (roundNo % 2 ? "recto" : "rectas") : roundNo % 2 ? "puntos" : pick(["rectas", "recto", "vl"]);
  const wantKind = pick(Object.keys(POINT)); // fijado fuera del bucle: todos por igual
  for (;;) {
    const x = randInt(30, 60);
    const V = triangle(type === "recto" ? shuffle([90, x, 90 - x]) : acuteAngles());
    const side = (i) => names[(i + 1) % 3] + names[(i + 2) % 3];
    const sides = [0, 1, 2].map((i) => ({ type: "line", p: V[(i + 1) % 3], q: V[(i + 2) % 3], label: `el lado ${side(i)}` }));
    const verts = [0, 1, 2].map((i) => ({ type: "pt", p: V[i], label: `el vértice ${names[i]}` }));
    const base = { V, names };
    if (type === "vl") {
      const i = randInt(0, 2), q = randInt(0, 2);
      const picks = [...sides, ...verts];
      if (q === 0) return { ...base, type, picks, answer: [3 + i], prompt: `Toca el vértice <b>${names[i]}</b>`, hint: `Los vértices son las esquinas, donde se juntan dos lados: este es el ${names[i]}` };
      if (q === 1) return { ...base, type, picks, answer: [i], prompt: `Toca el lado <b>${side(i)}</b>`, hint: `El lado ${side(i)} es el segmento que une los vértices ${side(i)[0]} y ${side(i)[1]}` };
      return { ...base, type, picks, answer: [i], prompt: `Toca el lado opuesto al vértice <b>${names[i]}</b>`, hint: `El lado opuesto a ${names[i]} es el que no lo toca: el lado ${side(i)}` };
    }
    if (type === "recto") {
      const cosAt = (i) => { const u = unit(sub(V[(i + 1) % 3], V[i])), w = unit(sub(V[(i + 2) % 3], V[i])); return Math.abs(u[0] * w[0] + u[1] * w[1]); };
      const r = [0, 1, 2].sort((a, b) => cosAt(a) - cosAt(b))[0];
      const picks = [...sides, ...verts], cat = [(r + 1) % 3, (r + 2) % 3];
      const q = pick(["hip", "hip", "cat", "vert"]);
      const hint = `El ángulo recto (cuadradito) está en ${names[r]}: sus dos lados, ${side(cat[0])} y ${side(cat[1])}, son los catetos; el lado opuesto, ${side(r)}, es la hipotenusa (el más largo)`;
      const prompt = q === "hip" ? "Toca la <b>hipotenusa</b>" : q === "cat" ? "Toca un <b>cateto</b>" : "Toca el vértice del <b>ángulo recto</b>";
      return { ...base, type, right: r, picks, answer: q === "hip" ? [r] : q === "cat" ? cat : [3 + r], prompt, hint };
    }
    const col = shuffle(COLORS);
    if (type === "puntos") {
      // Dos familias de tres rectas; se pide el punto donde se corta una
      // (elegida primero, para que salgan todas por igual) y la otra
      // familia se elige entre las que se cortan lejos (≥ 44 px).
      const all = Object.keys(POINT).map((k) => { const ls = [0, 1, 2].map((i) => ({ ...notable(k, V, i), kind: k, from: i })); return { kind: k, lines: ls, pt: cross(ls[0].p, ls[0].q, ls[1].p, ls[1].q) }; });
      const want = all.find((f) => f.kind === wantKind), mates = all.filter((f) => f !== want && dist(f.pt, want.pt) >= 44);
      if (!mates.length) continue;
      const fam = shuffle([want, pick(mates)]).map((f, k) => ({ kind: f.kind, color: col[k], lines: f.lines, pt: f.pt }));
      const kinds = fam.map((f) => f.kind), pts = fam.map((f) => f.pt), a = fam.findIndex((f) => f.kind === want.kind);
      return { ...base, type, fam, pts: pts.map(r1), answer: a, prompt: `Toca el punto donde se cortan <b>${POINT[kinds[a]][0]}</b>`, hint: `${POINT[kinds[a]][0][0].toUpperCase()}${POINT[kinds[a]][0].slice(1)} se cortan en un punto: ${POINT[kinds[a]][1]}` };
    }
    const kinds = level === 1 ? ["altura", "mediana"] : ["altura", "mediana", "bisectriz", "mediatriz"];
    const from = shuffle([0, 1, 2]);
    const lines = kinds.map((k, j) => ({ ...notable(k, V, k === "mediatriz" ? from[0] : from[j]), kind: k, from: k === "mediatriz" ? from[0] : from[j], color: col[j], type: "line" }));
    // Ninguna recta puede ir casi pegada a otra: o se cruzan con ≥ 12° o,
    // si son paralelas (altura y mediatriz del mismo lado), a ≥ 30 px.
    let close = false;
    lines.forEach((a, x) => lines.forEach((b, y) => {
      if (x >= y) return;
      const u = unit(sub(a.q, a.p)), w = unit(sub(b.q, b.p));
      if (Math.abs(u[0] * w[1] - u[1] * w[0]) < Math.sin(Math.PI / 15) && segDist(a.p, b.p, b.q) < 30 && segDist(a.q, b.p, b.q) < 30) close = true;
    }));
    const al = lines.find((l) => l.kind === "altura"), mt = lines.find((l) => l.kind === "mediatriz");
    if (close || (al && mt && dist(al.q, mt.m) < 30)) continue;
    const ask = pick(kinds);
    const L = lines.find((l) => l.kind === ask);
    return { ...base, type, picks: lines.map((l) => ({ ...l, label: `la ${l.kind}` })), answer: [kinds.indexOf(ask)], prompt: `Toca la <b>${ask}</b>`, hint: LINE_DEF[ask](names[L.from], side(L.from)) };
  }
}

// Marcas del libro: cuadradito, rayitas y arquitos.
function square(F, u, v, s = 12) { const a = add(F, u, s), b = add(add(F, u, s), v, s), c = add(F, v, s); return `<path class="et-mark" d="M ${r1(a)} L ${r1(b)} L ${r1(c)}"/>`; }
function tick(P, dir, n = 1) { const nn = [-dir[1], dir[0]]; return Array.from({ length: n }, (_, k) => { const c = add(P, dir, (k - (n - 1) / 2) * 5); return `<line class="et-mark" x1="${r1(add(c, nn, -7))[0]}" y1="${r1(add(c, nn, -7))[1]}" x2="${r1(add(c, nn, 7))[0]}" y2="${r1(add(c, nn, 7))[1]}"/>`; }).join(""); }
function arc(V, d1, d2, r) { const a = add(V, d1, r), b = add(V, d2, r), sw = d1[0] * d2[1] - d1[1] * d2[0] > 0 ? 1 : 0; return `<path class="et-mark" d="M ${r1(a)} A ${r} ${r} 0 0 ${sw} ${r1(b)}"/>`; }
function marks(l, V) {
  const v = V[l.from], b = V[(l.from + 1) % 3], c = V[(l.from + 2) % 3], u = unit(sub(c, b));
  if (l.kind === "altura") return square(l.q, u, unit(sub(v, l.q)));
  if (l.kind === "mediana") return tick(mid(b, l.q), u) + tick(mid(l.q, c), u);
  if (l.kind === "mediatriz") return square(l.m, u, unit(sub(l.q, l.m))) + tick(mid(b, l.m), u, 2) + tick(mid(l.m, c), u, 2);
  const d1 = unit(sub(b, v)), d2 = unit(sub(c, v)), db = unit(sub(l.q, v));
  return arc(v, d1, db, 22) + arc(v, db, d2, 22) + arc(v, d1, db, 26) + arc(v, db, d2, 26);
}

export function mountElementostrianguloGame(container, { client, onExit }) {
  const startLives = 3;
  let lives, score, rounds, hits, finished = false, pending = null;
  let round, busy;

  container.innerHTML = `
    <div class="game-topbar">
      <button class="back-btn" data-exit>← Menú</button>
      <div class="game-stats">
        <span class="lives" data-lives></span>
        <span class="score" data-score>⭐ 0</span>
      </div>
    </div>
    <div class="game-body et-body" data-body></div>
  `;
  container.querySelector("[data-exit]").addEventListener("click", () => finish(true));
  const livesEl = container.querySelector("[data-lives]");
  const scoreEl = container.querySelector("[data-score]");
  const body = container.querySelector("[data-body]");
  const renderLives = () => (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);
  const ln = (l, cls, style = "") => `<line class="${cls}" x1="${l.p[0]}" y1="${l.p[1]}" x2="${l.q[0]}" y2="${l.q[1]}"${style}/>`;

  function nextRound() {
    if (finished) return;
    round = buildRound(Math.min(4, Math.floor(hits / 2)), rounds);
    busy = false;
    const { V, names } = round, G = [(V[0][0] + V[1][0] + V[2][0]) / 3, (V[0][1] + V[1][1] + V[2][1]) / 3];
    const labels = V.map((p, i) => { const q = r1(add(p, unit(sub(p, G)), 18)); return `<text class="et-vname" x="${q[0]}" y="${q[1] + 6}">${names[i]}</text>`; }).join("");
    let art = `<polygon class="et-tri" points="${V.map((p) => r1(p).join(",")).join(" ")}"/>`;
    if (round.type === "recto") {
      const r = round.right, v = V[r];
      art += square(v, unit(sub(V[(r + 1) % 3], v)), unit(sub(V[(r + 2) % 3], v)), 14);
    }
    if (round.type === "puntos") {
      round.fam.forEach((f) => (art += `<g class="et-fam" style="--et-c:${f.color}">${f.lines.map((l) => ln(l, "et-nline") + marks(l, V)).join("")}</g>`));
    } else {
      art += round.picks.map((s, i) => {
        const style = s.color ? ` style="--et-c:${s.color}"` : "";
        if (s.type === "pt") return `<g class="et-pick" data-pick="${i}"><circle class="et-hitpt" cx="${s.p[0]}" cy="${s.p[1]}" r="18"/><circle class="et-vertex" cx="${s.p[0]}" cy="${s.p[1]}" r="4.5"/></g>`;
        return `<g class="et-pick" data-pick="${i}"${style}>${ln(s, "et-hit")}${ln(s, s.color ? "et-nline" : "et-side")}${s.kind ? marks(s, V) : ""}</g>`;
      }).join("");
    }
    body.innerHTML = `
      <p class="prompt et-prompt">${round.prompt}</p>
      <svg class="et-svg${round.type === "puntos" ? " et-free" : ""}" viewBox="0 0 ${W} ${H}" data-svg>${art}${labels}<g data-names></g></svg>
      <div class="feedback et-feedback" data-feedback></div>
      <button type="button" class="secondary et-next" data-next hidden>Siguiente →</button>
    `;
    body.querySelector("[data-next]").addEventListener("click", advance);
    body.querySelectorAll("[data-pick]").forEach((g) => g.addEventListener("click", () => tap(+g.dataset.pick)));
    const svg = body.querySelector("[data-svg]");
    if (round.type === "puntos") svg.addEventListener("pointerdown", (e) => {
      const m = svg.getScreenCTM().inverse();
      tapPoint([e.clientX * m.a + e.clientY * m.c + m.e, e.clientX * m.b + e.clientY * m.d + m.f]);
    });
  }

  function name(p, text, cls) {
    body.querySelector("[data-names]").insertAdjacentHTML("beforeend", `<text class="et-name ${cls}" x="${r1(p)[0]}" y="${r1(p)[1]}">${text}</text>`);
  }
  const anchor = (s) => (s.type === "pt" ? add(s.p, [0, -14]) : add(s.p, sub(s.q, s.p), 0.55));

  function tap(i) {
    if (finished || busy) return;
    const ok = round.answer.includes(i);
    round.answer.forEach((k) => body.querySelector(`[data-pick="${k}"]`).classList.add("good"));
    if (ok) return resolve(true, `✓ 💡 ${round.hint}`);
    body.querySelector(`[data-pick="${i}"]`).classList.add("bad");
    const s = round.picks[i];
    name(anchor(s), s.label.replace(/^(el|la) /, ""), "bad");
    round.answer.forEach((k) => name(anchor(round.picks[k]), round.picks[k].label.replace(/^(el|la) /, ""), "good"));
    resolve(false, `✗ Eso es ${s.label}. 💡 ${round.hint}`);
  }

  function tapPoint(p) {
    if (finished || busy) return;
    const want = round.pts[round.answer], other = round.pts[1 - round.answer];
    const ok = dist(p, want) <= 26 && dist(p, want) < dist(p, other);
    const dot = (q, cls, r = 6) => body.querySelector("[data-names]").insertAdjacentHTML("beforeend", `<circle class="et-dotmark ${cls}" cx="${r1(q)[0]}" cy="${r1(q)[1]}" r="${r}"/>`);
    dot(want, "good", 8);
    name(add(want, [0, -14]), POINT[round.fam[round.answer].kind][1].replace("el ", ""), "good");
    if (ok) return resolve(true, `✓ 💡 ${round.hint}`);
    dot(p, "bad");
    resolve(false, `✗ Ahí no se cortan ${POINT[round.fam[round.answer].kind][0]}. 💡 ${round.hint}`);
  }

  function resolve(ok, text) {
    busy = true;
    rounds++;
    const feedback = body.querySelector("[data-feedback]");
    feedback.textContent = text;
    feedback.className = `feedback et-feedback ${ok ? "ok" : "bad"}`;
    if (ok) {
      score += 10;
      hits++;
      renderScore();
      pending = setTimeout(nextRound, 900);
    } else {
      lives--;
      renderLives();
      body.querySelector("[data-next]").hidden = false;
      pending = setTimeout(advance, 2500);
    }
  }

  function advance() {
    if (finished) return;
    clearTimeout(pending);
    lives <= 0 ? finish(false) : nextRound();
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" tiene que seguir llevando al menú.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    clearTimeout(pending);
    if (userExited) return onExit();
    saveScore(client, "elementostriangulo", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📐</div>
        <div class="big-score">${score} pts</div>
        <p>${hits} aciertos de ${rounds}</p>
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
    finished = false;
    renderLives();
    renderScore();
    nextRound();
  }

  start();
  return () => {
    finished = true;
    clearTimeout(pending);
  };
}
