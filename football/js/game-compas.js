// "Regla y compás" (inspirado en Euclidea / Pythagorea).
//
// Construcción EXACTA con las dos herramientas de Euclides: la regla
// ("Recta": toca dos puntos → recta infinita) y el compás ("Compás": toca
// el centro y luego un punto por el que pasa → circunferencia). Solo se
// pueden tocar puntos que ya existen (imán de ~22 px) y cada corte
// recta-recta, recta-circunferencia o circunferencia-circunferencia crea
// automáticamente un punto nuevo tocable.
//
// Es lo contrario de "Ojo de geómetra": aquí no hay margen a ojo. El
// objeto pedido (recta, punto o vértices) tiene que estar en la
// construcción, comprobado analíticamente con tolerancia 1e-6 relativa.
// Cada recta o circunferencia gasta 1 movimiento de un presupuesto: el
// óptimo conocido + 2 la primera vez que sale cada encargo, +1 la segunda
// y el óptimo exacto después.
//
// Al fallar (presupuesto agotado o "Me rindo"): si el jugador tenía algo
// que "casi" coincidía, se hace la PRUEBA DEL ARRASTRE (se mueve un punto
// dado y se recalcula su construcción: lo que coincidía a ojo se separa);
// después se dibuja paso a paso en verde la construcción óptima y se
// explica por qué funciona.
import { pick, saveScore } from "./utils.js";

const W = 360; // lado del lienzo en unidades SVG
const TOL = 1e-6 * W; // tolerancia de la corrección: 1e-6 relativa al lienzo
const MAG = 22; // imán en píxeles de pantalla
const EDGE = 14; // margen para que un punto se considere tocable

// ---------- Vectores ----------
const P = (x, y) => ({ x, y });
const add = (a, b) => P(a.x + b.x, a.y + b.y);
const sub = (a, b) => P(a.x - b.x, a.y - b.y);
const mul = (a, k) => P(a.x * k, a.y * k);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a, b) => P((a.x + b.x) / 2, (a.y + b.y) / 2);
const unit = (a) => mul(a, 1 / Math.hypot(a.x, a.y));
const perp = (a) => P(-a.y, a.x);
const dir = (t) => P(Math.cos(t), Math.sin(t));
const rot = (v, t) => P(v.x * Math.cos(t) - v.y * Math.sin(t), v.x * Math.sin(t) + v.y * Math.cos(t));
const rnd = (a, b) => a + Math.random() * (b - a);
const S3 = Math.sqrt(3);
const onCanvas = (q, m = EDGE) => q.x >= m && q.x <= W - m && q.y >= m && q.y <= W - m;
const center = (spread = 35) => P(W / 2 + rnd(-spread, spread), W / 2 + rnd(-spread, spread));

// ---------- Motor geométrico ----------
// Una construcción es { pts, objs }. Cada punto guarda su receta (dato
// "given" o corte de los objetos a y b) y cada objeto la suya (tipo y los
// dos puntos que lo definen), para poder recalcularlo todo si se mueven
// los puntos dados (prueba del arrastre).
export function geomOf(kind, p, q) {
  if (kind === "L") {
    const d = unit(sub(q, p));
    return { kind, x: p.x, y: p.y, dx: d.x, dy: d.y };
  }
  return { kind, x: p.x, y: p.y, r: dist(p, q) };
}

const TAN = 1e-9 * W; // holgura para considerar tangencias
export function intersect(a, b) {
  if (a.kind === "L" && b.kind === "L") {
    const den = a.dx * b.dy - a.dy * b.dx;
    if (Math.abs(den) < 1e-12) return [];
    const t = ((b.x - a.x) * b.dy - (b.y - a.y) * b.dx) / den;
    return [P(a.x + t * a.dx, a.y + t * a.dy)];
  }
  if (a.kind === "C" && b.kind === "L") [a, b] = [b, a];
  if (a.kind === "L") {
    // a recta, b circunferencia: pie de la perpendicular desde el centro.
    const t = (b.x - a.x) * a.dx + (b.y - a.y) * a.dy;
    const f = P(a.x + t * a.dx, a.y + t * a.dy);
    const h = Math.hypot(b.x - f.x, b.y - f.y);
    if (h > b.r + TAN) return [];
    if (h >= b.r - TAN) return [f];
    const s = Math.sqrt(b.r * b.r - h * h);
    return [P(f.x + s * a.dx, f.y + s * a.dy), P(f.x - s * a.dx, f.y - s * a.dy)];
  }
  // Dos circunferencias.
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  if (d < 1e-12) return [];
  if (d > a.r + b.r + TAN || d < Math.abs(a.r - b.r) - TAN) return [];
  const ux = (b.x - a.x) / d;
  const uy = (b.y - a.y) / d;
  const m = (a.r * a.r - b.r * b.r + d * d) / (2 * d);
  const base = P(a.x + m * ux, a.y + m * uy);
  if (Math.abs(d - a.r - b.r) <= TAN || Math.abs(d - Math.abs(a.r - b.r)) <= TAN) return [base];
  const h = Math.sqrt(Math.max(0, a.r * a.r - m * m));
  return [P(base.x - h * uy, base.y + h * ux), P(base.x + h * uy, base.y - h * ux)];
}

function sameObj(a, b) {
  if (a.kind !== b.kind) return false;
  if (a.kind === "L") {
    if (Math.abs(a.dx * b.dy - a.dy * b.dx) > 1e-9) return false;
    return Math.abs((a.x - b.x) * b.dy - (a.y - b.y) * b.dx) < TOL;
  }
  return Math.hypot(a.x - b.x, a.y - b.y) < TOL && Math.abs(a.r - b.r) < TOL;
}

export function newGeo() {
  return { pts: [], objs: [] };
}
function addPt(g, q, def) {
  for (let i = 0; i < g.pts.length; i++) if (dist(g.pts[i], q) < TOL) return i;
  g.pts.push({ x: q.x, y: q.y, def });
  return g.pts.length - 1;
}
// Añade el objeto (tipo + índices de sus dos puntos) y crea los cortes
// con todo lo anterior. Devuelve -1 si ya existía.
export function addObj(g, kind, ia, ib, extra = {}) {
  if (ia === ib) return -1;
  const o = { ...geomOf(kind, g.pts[ia], g.pts[ib]), a: ia, b: ib, ...extra };
  if (g.objs.some((x) => sameObj(x, o))) return -1;
  const j = g.objs.length;
  g.objs.push(o);
  for (let i = 0; i < j; i++) for (const q of intersect(g.objs[i], o)) addPt(g, q, { a: i, b: j });
  return j;
}
export function findPt(g, q, tol = TOL) {
  let best = -1;
  let bd = tol;
  g.pts.forEach((p, i) => {
    const d = dist(p, q);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
}
const cloneGeo = (g) => ({ pts: g.pts.map((p) => ({ ...p })), objs: g.objs.map((o) => ({ ...o })) });

// Distancia de un punto a una recta del motor.
const distToLine = (q, o) => Math.abs((q.x - o.x) * o.dy - (q.y - o.y) * o.dx);
// ¿Hay en la construcción una recta que pase por p y q?
export function hasLine(g, p, q) {
  return g.objs.some((o) => o.kind === "L" && distToLine(p, o) < TOL && distToLine(q, o) < TOL);
}
export function hasPt(g, q) {
  return findPt(g, q) >= 0;
}

// ---------- Encargos ----------
// Cada encargo: puntos dados (names), objetos dados (gobjs), generador de
// posiciones, solución óptima (pasos con las coordenadas de los puntos que
// se tocan), objetivo (alternativas válidas: rectas y/o puntos), dibujo
// del objetivo y explicación.
const C = (c, p, say) => ({ kind: "C", p: c, q: p, say });
const L = (p, q, say) => ({ kind: "L", p, q, say });

function genPair(dmin, dmax) {
  const c = center(30);
  const u = dir(rnd(0, 2 * Math.PI));
  const d = rnd(dmin, dmax);
  return { A: add(c, mul(u, -d / 2)), B: add(c, mul(u, d / 2)) };
}
// Cúspide del triángulo equilátero sobre AB por el lado s (±1).
function apex(A, B, s) {
  const n = unit(perp(sub(B, A)));
  return add(mid(A, B), mul(n, (s * dist(A, B) * S3) / 2));
}
// Recta r con dos puntos marcados M, N y un punto P fuera de ella.
function genLineAndPoint(hmin, hmax) {
  const c = center(25);
  const u = dir(rnd(0, Math.PI));
  const n = perp(u);
  const M = add(c, mul(u, -rnd(45, 85)));
  const N = add(c, mul(u, rnd(45, 85)));
  const Pp = add(add(c, mul(u, rnd(-50, 50))), mul(n, pick([-1, 1]) * rnd(hmin, hmax)));
  return { M, N, P: Pp };
}
// T: punto de la circunferencia de centro B (radio AB) girado 30° desde A
// hacia el lado s del cuadrado.
function cuadT(A, B, s) {
  const n = unit(perp(sub(B, A)));
  const cands = [Math.PI / 6, -Math.PI / 6].map((t) => add(B, rot(sub(A, B), t)));
  return cands.find((q) => (q.x - A.x) * n.x * s + (q.y - A.y) * n.y * s > 0);
}
const reflect = (q, a, b) => {
  const u = unit(sub(b, a));
  const t = (q.x - a.x) * u.x + (q.y - a.y) * u.y;
  const f = add(a, mul(u, t));
  return sub(mul(f, 2), q);
};
const foot = (q, a, b) => {
  const u = unit(sub(b, a));
  return add(a, mul(u, (q.x - a.x) * u.x + (q.y - a.y) * u.y));
};

export const TASKS = [
  {
    id: "medi",
    title: "Traza la mediatriz de AB",
    sub: "la recta de los puntos que están igual de lejos de A que de B",
    opt: 3,
    names: ["A", "B"],
    gobjs: [],
    gen: () => ({ gv: genPair(90, 140), s: 1 }),
    solve: ({ A, B }) => [
      C(A, B, "Compás: centro A, pasando por B"),
      C(B, A, "Compás: centro B, pasando por A"),
      L(apex(A, B, 1), apex(A, B, -1), "Recta por los dos cortes"),
    ],
    target: ({ A, B }) => [{ lines: [[mid(A, B), add(mid(A, B), perp(sub(B, A)))]], pts: [] }],
    show: ({ A, B }) => [{ line: [mid(A, B), add(mid(A, B), perp(sub(B, A)))] }],
    why:
      "Dos circunferencias de radio AB centradas en A y en B se cortan en dos puntos que están a la misma distancia de A y de B. La recta que los une es la mediatriz.",
  },
  {
    id: "equi",
    title: "Construye un triángulo equilátero sobre AB",
    sub: "traza los dos lados que faltan (por cualquiera de los dos lados de AB)",
    opt: 4,
    names: ["A", "B"],
    gobjs: [],
    gen: () => ({ gv: genPair(100, 150), s: pick([-1, 1]) }),
    solve: ({ A, B }, s) => [
      C(A, B, "Compás: centro A, pasando por B"),
      C(B, A, "Compás: centro B, pasando por A"),
      L(A, apex(A, B, s), "Recta de A al corte"),
      L(B, apex(A, B, s), "Recta de B al corte"),
    ],
    target: ({ A, B }) =>
      [1, -1].map((s) => ({ lines: [[A, apex(A, B, s)], [B, apex(A, B, s)]], pts: [] })),
    show: ({ A, B }, s) => [{ poly: [A, B, apex(A, B, s)] }],
    why:
      "La circunferencia de centro A y radio AB reúne los puntos a distancia AB de A; la de centro B, los que están a distancia AB de B. Donde se cortan hay un punto a distancia AB de los dos: los tres lados miden igual (Euclides, Libro I, proposición 1).",
  },
  {
    id: "medio",
    title: "Marca el punto medio de AB",
    sub: "tiene que aparecer como corte de tu construcción",
    opt: 3,
    names: ["A", "B"],
    gobjs: [["L", "A", "B"]],
    gen: () => ({ gv: genPair(90, 140), s: 1 }),
    solve: ({ A, B }) => [
      C(A, B, "Compás: centro A, pasando por B"),
      C(B, A, "Compás: centro B, pasando por A"),
      L(apex(A, B, 1), apex(A, B, -1), "Recta por los dos cortes: corta AB en el punto medio"),
    ],
    target: ({ A, B }) => [{ lines: [], pts: [mid(A, B)] }],
    show: ({ A, B }) => [{ ring: mid(A, B) }],
    why:
      "Las circunferencias de centro A y de centro B con radio AB se cortan en dos puntos equidistantes de A y de B. La recta que los une (la mediatriz) corta al segmento AB justo en su punto medio.",
  },
  {
    id: "perp1",
    title: "Traza la perpendicular a r que pasa por P",
    sub: "M y N son dos puntos de la recta r",
    opt: 3,
    names: ["M", "N", "P"],
    gobjs: [["L", "M", "N"]],
    gen: () => ({ gv: genLineAndPoint(45, 100), s: 1 }),
    solve: ({ M, N, P: Q }) => [
      C(M, Q, "Compás: centro M, pasando por P"),
      C(N, Q, "Compás: centro N, pasando por P"),
      L(Q, reflect(Q, M, N), "Recta de P al otro corte (P')"),
    ],
    target: ({ M, N, P: Q }) => [{ lines: [[Q, add(Q, perp(sub(N, M)))]], pts: [] }],
    show: ({ M, N, P: Q }) => [{ line: [Q, add(Q, perp(sub(N, M)))] }],
    why:
      "Las circunferencias de centro M y de centro N que pasan por P vuelven a cortarse en P', el simétrico de P respecto de r (M y N están igual de lejos de P que de P'). Por eso r es la mediatriz de PP' y la recta PP' es perpendicular a r.",
  },
  {
    id: "hexa",
    title: "Marca los 6 vértices del hexágono regular inscrito",
    sub: "A es uno de ellos; O es el centro",
    opt: 3,
    names: ["O", "A"],
    gobjs: [["C", "O", "A"]],
    gen: () => {
      const O = center(20);
      return { gv: { O, A: add(O, mul(dir(rnd(0, 2 * Math.PI)), rnd(75, 105))) }, s: 1 };
    },
    solve: ({ O, A }) => [
      C(A, O, "Compás: centro A, pasando por O (marca 2 vértices)"),
      L(A, O, "Recta AO (marca el vértice opuesto D)"),
      C(add(O, sub(O, A)), O, "Compás: centro D, pasando por O (marca los 2 que faltan)"),
    ],
    target: ({ O, A }) => [{ lines: [], pts: [0, 1, 2, 3, 4, 5].map((k) => add(O, rot(sub(A, O), (k * Math.PI) / 3))) }],
    show: ({ O, A }) => [{ poly: [0, 1, 2, 3, 4, 5].map((k) => add(O, rot(sub(A, O), (k * Math.PI) / 3))) }],
    why:
      "En un hexágono regular inscrito el lado mide lo mismo que el radio. La circunferencia de centro A y radio OA marca los dos vértices vecinos de A; la recta AO marca el opuesto D, y la circunferencia de centro D y radio OD marca los dos vecinos de D.",
  },
  {
    id: "perp2",
    title: "Traza la perpendicular a r en el punto P",
    sub: "P y Q están sobre la recta r",
    opt: 4,
    names: ["P", "Q"],
    gobjs: [["L", "P", "Q"]],
    gen: () => {
      const Pp = center(25);
      return { gv: { P: Pp, Q: add(Pp, mul(dir(rnd(0, 2 * Math.PI)), rnd(45, 62))) }, s: 1 };
    },
    solve: ({ P: Pp, Q }) => {
      const Q2 = sub(mul(Pp, 2), Q);
      return [
        C(Pp, Q, "Compás: centro P, pasando por Q (marca Q' al otro lado)"),
        C(Q, Q2, "Compás: centro Q, pasando por Q'"),
        C(Q2, Q, "Compás: centro Q', pasando por Q"),
        L(apex(Q, Q2, 1), apex(Q, Q2, -1), "Recta por los dos cortes (pasa por P)"),
      ];
    },
    target: ({ P: Pp, Q }) => [{ lines: [[Pp, add(Pp, perp(sub(Q, Pp)))]], pts: [] }],
    show: ({ P: Pp, Q }) => [{ line: [Pp, add(Pp, perp(sub(Q, Pp)))] }],
    why:
      "La circunferencia de centro P que pasa por Q corta r en Q', así que P es el punto medio de QQ'. La mediatriz de QQ' (dos circunferencias de radio QQ') pasa por ese punto medio, P, y es perpendicular a r.",
  },
  {
    id: "bise",
    title: "Traza la bisectriz del ángulo AVB",
    sub: "la recta que lo parte en dos ángulos iguales",
    opt: 4,
    names: ["V", "A", "B"],
    gobjs: [
      ["L", "V", "A"],
      ["L", "V", "B"],
    ],
    gen: () => {
      const phi = rnd(0, 2 * Math.PI);
      const half = rnd(22, 62) * (Math.PI / 180);
      const V = sub(P(W / 2, W / 2), mul(dir(phi), rnd(50, 90)));
      const a = rnd(70, 115);
      let b = rnd(70, 125);
      if (Math.abs(b - a) < 18) b = a + (b > a ? 18 : -18);
      return { gv: { V, A: add(V, mul(dir(phi + half), a)), B: add(V, mul(dir(phi - half), b)) }, s: 1 };
    },
    solve: ({ V, A, B }) => {
      const A2 = add(V, mul(unit(sub(B, V)), dist(V, A)));
      return [
        C(V, A, "Compás: centro V, pasando por A (marca A' en el otro lado, VA' = VA)"),
        C(A, V, "Compás: centro A, pasando por V"),
        C(A2, V, "Compás: centro A', pasando por V"),
        L(V, add(A, sub(A2, V)), "Recta de V al corte W"),
      ];
    },
    target: ({ V, A, B }) => [{ lines: [[V, add(V, add(unit(sub(A, V)), unit(sub(B, V))))]], pts: [] }],
    show: ({ V, A, B }) => [{ ray: [V, add(V, add(unit(sub(A, V)), unit(sub(B, V))))] }],
    why:
      "La circunferencia de centro V por A marca A' en el otro lado, con VA' = VA. Las circunferencias de ese mismo radio centradas en A y en A' se cortan en W, y VAWA' es un rombo: su diagonal VW parte el ángulo por la mitad.",
  },
  {
    id: "para",
    title: "Traza la paralela a r que pasa por P",
    sub: "M y N son dos puntos de la recta r",
    opt: 4,
    names: ["M", "N", "P"],
    gobjs: [["L", "M", "N"]],
    gen: () => ({ gv: genLineAndPoint(45, 90), s: pick([-1, 1]) }),
    solve: ({ M, N, P: Q }, s) => {
      const u = mul(unit(sub(N, M)), s * dist(M, Q));
      const R = add(M, u);
      return [
        C(M, Q, "Compás: centro M, pasando por P (marca R en r, MR = MP)"),
        C(Q, M, "Compás: centro P, pasando por M"),
        C(R, M, "Compás: centro R, pasando por M"),
        L(Q, add(Q, u), "Recta de P al corte P'"),
      ];
    },
    target: ({ M, N, P: Q }) => [{ lines: [[Q, add(Q, sub(N, M))]], pts: [] }],
    show: ({ M, N, P: Q }) => [{ line: [Q, add(Q, sub(N, M))] }],
    why:
      "La circunferencia de centro M por P corta r en R, con MR = MP. Las circunferencias de ese mismo radio centradas en P y en R se cortan en P': MPP'R es un rombo, y en un rombo los lados opuestos son paralelos, así que PP' es paralela a MR, que es r.",
  },
  {
    id: "cuad",
    title: "Marca los dos vértices que faltan del cuadrado de lado AB",
    sub: "por cualquiera de los dos lados de AB",
    opt: 5,
    names: ["A", "B"],
    gobjs: [],
    gen: () => ({ gv: genPair(70, 98), s: pick([-1, 1]) }),
    solve: ({ A, B }, s) => {
      const X = apex(A, B, -s); // cúspide del lado contrario al cuadrado
      const Y = apex(A, B, s); // cúspide del lado del cuadrado
      const X2 = sub(mul(A, 2), X); // opuesto de X en la circunferencia de A
      const T = cuadT(A, B, s);
      return [
        C(A, B, "Compás: centro A, pasando por B"),
        C(B, A, "Compás: centro B, pasando por A (cortes X e Y)"),
        L(A, X, "Recta AX: marca X', el opuesto de X en la circunferencia de A"),
        L(B, X2, "Recta BX': baja 30° desde BA y marca T en la circunferencia de B"),
        C(Y, T, "Compás: centro Y, pasando por T: corta en D y en C"),
      ];
    },
    target: ({ A, B }) =>
      [1, -1].map((s) => {
        const n = mul(unit(perp(sub(B, A))), s * dist(A, B));
        return { lines: [], pts: [add(A, n), add(B, n)] };
      }),
    show: ({ A, B }, s) => {
      const n = mul(unit(perp(sub(B, A))), s * dist(A, B));
      return [{ poly: [A, B, add(B, n), add(A, n)] }];
    },
    why:
      "X' (el opuesto de X en la circunferencia de A) forma con A y B un triángulo isósceles con 120° en A, así que la recta BX' baja 30° desde BA y marca T en la circunferencia de B. Sobre las circunferencias de A y de B (las dos de radio AB), los vértices que faltan D y C están a 30° de Y, igual que T: las cuerdas YT, YD e YC son iguales, y la circunferencia de centro Y por T pasa justo por D y por C.",
  },
];

// Construcción con solo los datos de la ronda.
export function buildGiven(task, gv) {
  const g = newGeo();
  const idx = {};
  for (const n of task.names) idx[n] = addPt(g, gv[n], { given: n });
  for (const [k, a, b] of task.gobjs) addObj(g, k, idx[a], idx[b], { given: true });
  return g;
}
// Aplica un paso (tocando los puntos de esas coordenadas). -1 si no puede.
export function applyStep(g, st, extra = {}) {
  const a = findPt(g, st.p);
  const b = findPt(g, st.q);
  if (a < 0 || b < 0) return -2;
  return addObj(g, st.kind, a, b, extra);
}
// ¿Se cumple el encargo? Basta una alternativa con todas sus rectas y puntos.
export function checkTask(task, g, gv) {
  return task.target(gv).some((alt) => alt.lines.every(([p, q]) => hasLine(g, p, q)) && alt.pts.every((q) => hasPt(g, q)));
}
// Mejor progreso parcial (para explicar qué faltaba).
function progress(task, g, gv) {
  let best = { got: 0, of: 1 };
  for (const alt of task.target(gv)) {
    const of = alt.lines.length + alt.pts.length;
    const got = alt.lines.filter(([p, q]) => hasLine(g, p, q)).length + alt.pts.filter((q) => hasPt(g, q)).length;
    if (got / of > best.got / best.of) best = { got, of };
  }
  return best;
}

// Genera una ronda válida: la solución óptima se aplica de verdad en el
// motor, todos sus puntos caen dentro del lienzo, separados de cualquier
// otro punto, y el corrector la acepta.
export function makeRound(task) {
  let last = null;
  for (let tries = 0; tries < 400; tries++) {
    const { gv, s } = task.gen();
    last = { gv, s };
    if (roundOk(task, gv, s)) return { gv, s };
  }
  return last;
}
export function roundOk(task, gv, s) {
  const g = buildGiven(task, gv);
  const steps = task.solve(gv, s);
  const keys = task.names.map((n) => gv[n]);
  for (const st of steps) {
    if (applyStep(g, st) < 0) return false;
    keys.push(st.p, st.q);
  }
  if (!checkTask(task, g, gv)) return false;
  for (const alt of task.target(gv).slice(0, 1)) for (const q of alt.pts) keys.push(q);
  // Puntos clave tocables y bien separados de los demás puntos visibles.
  for (const k of keys) {
    if (!onCanvas(k, EDGE + 4)) return false;
    for (const p of g.pts) {
      const d = dist(p, k);
      if (d > TOL && d < 20) return false;
    }
  }
  // Las etiquetas de los datos no deben quedar pegadas.
  for (let i = 0; i < task.names.length; i++)
    for (let j = i + 1; j < task.names.length; j++) if (dist(gv[task.names[i]], gv[task.names[j]]) < 40) return false;
  return true;
}

// Recalcula la construcción con los puntos dados movidos, siguiendo cada
// corte por continuidad (se elige el corte más cercano a donde estaba).
function recompute(g, gvNew, prevPos) {
  const pos = g.pts.map((p) => (p.def.given ? gvNew[p.def.given] : null));
  const objs = [];
  for (let j = 0; j < g.objs.length; j++) {
    const o = g.objs[j];
    const pa = pos[o.a];
    const pb = pos[o.b];
    if (!pa || !pb || dist(pa, pb) < 1e-9) return null;
    objs[j] = { ...geomOf(o.kind, pa, pb), player: o.player, given: o.given };
    g.pts.forEach((p, i) => {
      if (p.def.given || p.def.b !== j) return;
      const cands = intersect(objs[p.def.a], objs[j]);
      if (!cands.length) return;
      const ref = prevPos[i];
      pos[i] = cands.reduce((m, c) => (dist(c, ref) < dist(m, ref) ? c : m));
    });
  }
  return { pos, objs };
}

// ---------- SVG ----------
const f = (n) => n.toFixed(2);
// Trozo de la recta infinita (punto o, dirección d) dentro del lienzo.
function clip(o, d, m = -4) {
  let t0 = -Infinity;
  let t1 = Infinity;
  for (const [p, v] of [
    [o.x, d.x],
    [o.y, d.y],
  ]) {
    if (Math.abs(v) < 1e-12) {
      if (p < m || p > W - m) return null;
      continue;
    }
    const a = (m - p) / v;
    const b = (W - m - p) / v;
    t0 = Math.max(t0, Math.min(a, b));
    t1 = Math.min(t1, Math.max(a, b));
  }
  if (t0 > t1) return null;
  return [add(o, mul(d, t0)), add(o, mul(d, t1))];
}
const segSvg = (a, b, cls) => `<line class="${cls}" x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}"/>`;
function objSvg(o, cls) {
  if (o.kind === "C") return `<circle class="${cls}" cx="${f(o.x)}" cy="${f(o.y)}" r="${f(o.r)}"/>`;
  const c = clip(P(o.x, o.y), P(o.dx, o.dy));
  return c ? segSvg(c[0], c[1], cls) : "";
}
function shapeSvg(sh, cls) {
  if (sh.line) {
    const c = clip(sh.line[0], unit(sub(sh.line[1], sh.line[0])));
    return c ? segSvg(c[0], c[1], cls) : "";
  }
  if (sh.ray) {
    const c = clip(sh.ray[0], unit(sub(sh.ray[1], sh.ray[0])));
    return c ? segSvg(sh.ray[0], c[1], cls) : "";
  }
  if (sh.ring) return `<circle class="${cls} cp-ring" cx="${f(sh.ring.x)}" cy="${f(sh.ring.y)}" r="9"/>`;
  if (sh.poly) return `<polygon class="${cls}" points="${sh.poly.map((q) => `${f(q.x)},${f(q.y)}`).join(" ")}"/>`;
  return "";
}

export function mountCompasGame(container, { client, onExit }) {
  const startLives = 3;
  let lives = startLives;
  let score = 0;
  let rounds = 0;
  let level = 0;
  let finished = false;
  let task = null;
  let round = null; // { gv, s }
  let g = null; // construcción del jugador
  let history = [];
  let budget = 0;
  let moves = 0;
  let tool = "C";
  let sel = -1; // primer punto elegido
  let dragging = false;
  let hover = null;
  let busy = false;
  const timers = new Set();
  const later = (fn, ms) => {
    const t = setTimeout(() => {
      timers.delete(t);
      if (!finished) fn();
    }, ms);
    timers.add(t);
    return t;
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
  let svg, gTarget, gObjs, gSol, gDrag, gPts, gPrev, feedbackEl, movesEl, stepsEl, hintEl;

  const renderLives = () =>
    (livesEl.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(startLives - Math.max(lives, 0)));
  const renderScore = () => (scoreEl.textContent = `⭐ ${score}`);

  function nextRound() {
    const ti = level % TASKS.length;
    const pass = Math.floor(level / TASKS.length);
    task = TASKS[ti];
    budget = task.opt + Math.max(0, 2 - pass);
    round = makeRound(task);
    g = buildGiven(task, round.gv);
    history = [];
    moves = 0;
    sel = -1;
    dragging = false;
    hover = null;
    busy = false;
    body.innerHTML = `
      <p class="prompt cp-prompt">${task.title}<small>${task.sub}</small></p>
      <div class="cp-meta"><span data-moves></span><span class="cp-exact">corrección exacta: a ojo no vale</span></div>
      <svg class="cp-svg" data-svg viewBox="0 0 ${W} ${W}" role="img" aria-label="Lienzo de construcción">
        <g data-target></g><g data-objs></g><g data-sol></g><g data-drag></g><g data-prev></g><g data-pts></g>
      </svg>
      <div class="cp-tools">
        <button type="button" class="cp-tool" data-tool="L">📏 Recta</button>
        <button type="button" class="cp-tool" data-tool="C">🧭 Compás</button>
        <button type="button" class="cp-tool cp-small" data-undo>↶ Deshacer</button>
        <button type="button" class="cp-tool cp-small" data-giveup>🏳️ Me rindo</button>
      </div>
      <p class="cp-hint" data-hint></p>
      <div class="feedback" data-feedback></div>
      <ol class="cp-steps" data-steps></ol>
      <button type="button" class="primary cp-next" data-next hidden>Seguir →</button>
    `;
    svg = body.querySelector("[data-svg]");
    gTarget = svg.querySelector("[data-target]");
    gObjs = svg.querySelector("[data-objs]");
    gSol = svg.querySelector("[data-sol]");
    gDrag = svg.querySelector("[data-drag]");
    gPrev = svg.querySelector("[data-prev]");
    gPts = svg.querySelector("[data-pts]");
    feedbackEl = body.querySelector("[data-feedback]");
    movesEl = body.querySelector("[data-moves]");
    stepsEl = body.querySelector("[data-steps]");
    hintEl = body.querySelector("[data-hint]");
    body.querySelectorAll("[data-tool]").forEach((b) =>
      b.addEventListener("click", () => {
        if (busy) return;
        tool = b.dataset.tool;
        sel = -1;
        paint();
      })
    );
    body.querySelector("[data-undo]").addEventListener("click", undo);
    body.querySelector("[data-giveup]").addEventListener("click", () => {
      if (!busy && !finished) fail(true);
    });
    bindPointer();
    gTarget.innerHTML = task.show(round.gv, round.s).map((sh) => shapeSvg(sh, "cp-target")).join("");
    paint();
  }

  // ----- Dibujo de la construcción del jugador -----
  function paint() {
    const gv = round.gv;
    let html = "";
    // Ángulo marcado (bisectriz): rayos con la parte de atrás tenue.
    for (const o of g.objs) {
      if (o.kind === "L" && o.given && task.id === "bise") {
        const end = g.pts[o.b];
        const c = clip(gv.V, unit(sub(end, gv.V)));
        const back = clip(gv.V, unit(sub(gv.V, end)));
        html += (back ? segSvg(gv.V, back[1], "cp-gline cp-back") : "") + (c ? segSvg(gv.V, c[1], "cp-gline") : "");
      } else html += objSvg(o, o.given ? (o.kind === "C" ? "cp-gcirc" : "cp-gline") : o.kind === "C" ? "cp-circ" : "cp-line");
    }
    if (task.gobjs.some(([k]) => k === "L") && task.id !== "bise") {
      // Nombre de la recta dada.
      const o = g.objs.find((x) => x.given && x.kind === "L");
      const c = clip(P(o.x, o.y), P(o.dx, o.dy), 12);
      if (c) html += `<text class="cp-rname" x="${f(c[1].x)}" y="${f(c[1].y - 6)}">r</text>`;
    }
    gObjs.innerHTML = html;
    let pts = "";
    g.pts.forEach((p, i) => {
      if (!onCanvas(p, 2)) return;
      const given = !!p.def.given;
      pts += `<circle class="cp-pt${given ? " cp-pt-given" : ""}${i === sel ? " cp-pt-sel" : ""}" data-i="${i}" cx="${f(p.x)}" cy="${f(p.y)}" r="${given ? 5.5 : 4}"/>`;
      if (given) {
        const away = labelDir(p);
        pts += `<text class="cp-lbl" x="${f(p.x + away.x * 15)}" y="${f(p.y + away.y * 15 + 5)}">${p.def.given}</text>`;
      }
    });
    gPts.innerHTML = pts;
    paintPreview();
    movesEl.innerHTML = `Movimientos <b>${moves}/${budget}</b> · óptimo ${task.opt}`;
    body.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === tool));
    hintEl.textContent =
      sel >= 0
        ? tool === "L"
          ? "Ahora toca el segundo punto de la recta."
          : "Ahora toca un punto por el que pase la circunferencia."
        : tool === "L"
          ? "Recta: toca dos puntos (o arrastra de uno a otro)."
          : "Compás: toca el centro y luego un punto por el que pase.";
  }
  // Etiqueta hacia fuera del centro del lienzo (y lejos de las rectas dadas).
  function labelDir(p) {
    const v = sub(p, P(W / 2, W / 2));
    let d = Math.hypot(v.x, v.y) < 1 ? P(0, -1) : unit(v);
    const lineObj = g.objs.find((o) => o.given && o.kind === "L" && distToLine(p, o) < 1);
    if (lineObj && task.id !== "bise") {
      const n = P(-lineObj.dy, lineObj.dx);
      d = n.x * d.x + n.y * d.y >= 0 ? n : mul(n, -1);
    }
    if (task.id === "bise" && p.def.given === "V") d = unit(sub(round.gv.V, mid(round.gv.A, round.gv.B)));
    return d;
  }
  function paintPreview() {
    if (sel < 0 || !hover) return (gPrev.innerHTML = "");
    const a = g.pts[sel];
    if (dist(a, hover) < 1) return (gPrev.innerHTML = "");
    gPrev.innerHTML = objSvg(geomOf(tool, a, hover), "cp-preview");
  }

  // ----- Gestos: tocar o arrastrar entre puntos -----
  function toSvg(e) {
    const m = svg.getScreenCTM();
    const q = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { q: P(q.x, q.y), scale: m.a };
  }
  function nearest(e) {
    const { q, scale } = toSvg(e);
    let best = -1;
    let bd = MAG / scale;
    g.pts.forEach((p, i) => {
      if (!onCanvas(p, 2)) return;
      const d = dist(p, q);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return { i: best, q };
  }
  function bindPointer() {
    svg.addEventListener("pointerdown", (e) => {
      if (busy || finished) return;
      e.preventDefault();
      const { i } = nearest(e);
      if (i < 0) {
        hintEl.textContent = "Solo puedes usar puntos que ya existen (los cortes aparecen solos).";
        return;
      }
      if (sel < 0) {
        sel = i;
        dragging = true;
        hover = g.pts[i];
        svg.setPointerCapture(e.pointerId);
        paint();
      } else if (i === sel) {
        sel = -1;
        paint();
      } else {
        const a = sel;
        sel = -1;
        make(a, i);
      }
    });
    svg.addEventListener("pointermove", (e) => {
      if (sel < 0 || busy) return;
      const { i, q } = nearest(e);
      hover = i >= 0 ? g.pts[i] : q;
      paintPreview();
    });
    const up = (e) => {
      if (!dragging) return;
      dragging = false;
      if (sel < 0 || busy) return;
      const { i } = nearest(e);
      if (i >= 0 && i !== sel) {
        const a = sel;
        sel = -1;
        make(a, i);
      }
    };
    svg.addEventListener("pointerup", up);
    svg.addEventListener("pointercancel", () => (dragging = false));
    svg.addEventListener("pointerleave", () => {
      if (!dragging) {
        hover = null;
        paintPreview();
      }
    });
  }

  function make(a, b) {
    const snap = cloneGeo(g);
    const j = addObj(g, tool, a, b, { player: true });
    hover = null;
    if (j < 0) {
      paint();
      hintEl.textContent = tool === "L" ? "Esa recta ya está trazada." : "Esa circunferencia ya está trazada.";
      return;
    }
    history.push(snap);
    moves++;
    feedbackEl.textContent = "";
    feedbackEl.className = "feedback";
    paint();
    if (checkTask(task, g, round.gv)) return win();
    if (moves >= budget) fail(false);
  }
  function undo() {
    if (busy || finished || !history.length) return;
    g = history.pop();
    moves--;
    sel = -1;
    paint();
  }

  function setButtonsDisabled(dis) {
    body.querySelectorAll(".cp-tool").forEach((b) => (b.disabled = dis));
  }

  function win() {
    busy = true;
    rounds++;
    score += 10;
    level++;
    renderScore();
    setButtonsDisabled(true);
    gTarget.innerHTML = task.show(round.gv, round.s).map((sh) => shapeSvg(sh, "cp-done")).join("");
    feedbackEl.textContent =
      moves <= task.opt ? `¡Construido en ${moves}! Es el óptimo.` : `¡Construido en ${moves}! (se puede en ${task.opt})`;
    feedbackEl.className = "feedback ok";
    later(nextRound, 1500);
  }

  // Busca algo del jugador que "casi" coincida con el objetivo.
  function nearMiss(gg, objs, pos, gv) {
    let best = null;
    task.target(gv).forEach((alt, ai) => {
      alt.lines.forEach(([p, q], li) => {
        const seg = clip(p, unit(sub(q, p)));
        if (!seg) return;
        objs.forEach((o, j) => {
          if (!o || !o.player || o.kind !== "L") return;
          const d = Math.max(distToLine(seg[0], o), distToLine(seg[1], o));
          if (!best || d < best.d) best = { d, kind: "L", j, ai, li };
        });
      });
      alt.pts.forEach((q, qi) =>
        pos.forEach((p, i) => {
          if (!p || gg.pts[i].def.given) return;
          const d = dist(p, q);
          if (!best || d < best.d) best = { d, kind: "P", i, ai, qi };
        })
      );
    });
    return best;
  }

  function fail(gaveUp) {
    busy = true;
    rounds++;
    lives--;
    renderLives();
    setButtonsDisabled(true);
    sel = -1;
    hover = null;
    paint();
    const pr = progress(task, g, round.gv);
    let msg = gaveUp ? "Te rindes." : `Se acabaron los ${budget} movimientos.`;
    if (pr.of > 1 && pr.got > 0) msg += ` Tenías ${pr.got} de ${pr.of}.`;
    const pos0 = g.pts.map((p) => P(p.x, p.y));
    const nm = nearMiss(g, g.objs, pos0, round.gv);
    if (nm && nm.d > TOL && nm.d < 10) {
      feedbackEl.textContent = `${msg} Lo tuyo parece bueno a ojo (está a ${nm.d.toFixed(1).replace(".", ",")} px), pero no es exacto. Prueba del arrastre: movemos ${task.names[0]}…`;
      feedbackEl.className = "feedback bad";
      dragTest(nm, () => showSolution("", true));
    } else {
      feedbackEl.className = "feedback bad";
      showSolution(msg);
    }
  }

  // Prueba del arrastre: se desplaza el primer punto dado ~30 unidades en
  // pasitos; la construcción del jugador se recalcula por continuidad y el
  // objetivo también. Lo que solo coincidía a ojo se separa.
  function dragTest(nm, done) {
    const name = task.names[0];
    const gv0 = round.gv;
    const away = dir(Math.random() * 2 * Math.PI);
    let prev = g.pts.map((p) => P(p.x, p.y));
    const FR = 22;
    gObjs.classList.add("cp-dim");
    gPts.classList.add("cp-dim");
    let k = 0;
    let lastD = nm.d;
    const step = () => {
      k++;
      const gv = { ...gv0, [name]: add(gv0[name], mul(away, (30 * k) / FR)) };
      const r = recompute(g, gv, prev);
      if (!r) return end();
      prev = r.pos.map((p, i) => p || prev[i]);
      let html = task.show(gv, round.s).map((sh) => shapeSvg(sh, "cp-target cp-target-strong")).join("");
      r.objs.forEach((o) => {
        if (o && (o.given || o.player)) html += objSvg(o, o.given ? "cp-gline" : "cp-ghost");
      });
      let d;
      if (nm.kind === "L") {
        html += objSvg(r.objs[nm.j], "cp-miss");
        const [tp, tq] = task.target(gv)[nm.ai].lines[nm.li];
        const seg = clip(tp, unit(sub(tq, tp)));
        d = seg ? Math.max(distToLine(seg[0], r.objs[nm.j]), distToLine(seg[1], r.objs[nm.j])) : lastD;
      } else {
        const p = r.pos[nm.i];
        const tq = task.target(gv)[nm.ai].pts[nm.qi];
        if (p) html += `<circle class="cp-miss-pt" cx="${f(p.x)}" cy="${f(p.y)}" r="5"/>`;
        d = p ? dist(p, tq) : lastD;
      }
      for (const n of task.names) html += `<circle class="cp-pt cp-pt-given" cx="${f(gv[n].x)}" cy="${f(gv[n].y)}" r="5.5"/>`;
      gDrag.innerHTML = html;
      lastD = d;
      if (k < FR) later(step, 45);
      else end();
    };
    const end = () => {
      feedbackEl.textContent = `Prueba del arrastre: al mover ${name} un poco, lo tuyo se separa del objetivo (de ${nm.d
        .toFixed(1)
        .replace(".", ",")} a ${lastD.toFixed(1).replace(".", ",")} px). Coincidía solo a ojo; una construcción exacta sigue funcionando muevas lo que muevas.`;
      later(() => {
        gDrag.innerHTML = "";
        gObjs.classList.remove("cp-dim");
        gPts.classList.remove("cp-dim");
        done(true);
      }, 2200);
    };
    later(step, 500);
  }

  // Construcción óptima, paso a paso en verde, con la explicación.
  function showSolution(msg, afterDrag) {
    const keep = afterDrag ? feedbackEl.textContent + " " : "";
    feedbackEl.innerHTML = `${keep}${msg ? msg + " " : ""}Así se hace en ${task.opt}: <span class="cp-why">${task.why}</span>`;
    feedbackEl.className = "feedback bad";
    gObjs.classList.add("cp-dim");
    const g2 = buildGiven(task, round.gv);
    const steps = task.solve(round.gv, round.s);
    stepsEl.innerHTML = "";
    let html = "";
    steps.forEach((st, k) => {
      later(() => {
        applyStep(g2, st);
        const o = g2.objs[g2.objs.length - 1];
        html += objSvg(o, "cp-sol");
        for (const q of [st.p, st.q]) html += `<circle class="cp-sol-pt" cx="${f(q.x)}" cy="${f(q.y)}" r="4.5"/>`;
        // Numerito del paso, sobre el propio objeto.
        const at = o.kind === "C" ? add(P(o.x, o.y), mul(dir(-Math.PI / 4 - k * 0.5), o.r)) : mid(st.p, st.q);
        if (onCanvas(at, 8)) html += `<g class="cp-num"><circle cx="${f(at.x)}" cy="${f(at.y)}" r="8"/><text x="${f(at.x)}" y="${f(at.y + 3.5)}">${k + 1}</text></g>`;
        gSol.innerHTML = html;
        stepsEl.insertAdjacentHTML("beforeend", `<li>${st.say}</li>`);
        if (k === steps.length - 1) {
          gTarget.innerHTML = task.show(round.gv, round.s).map((sh) => shapeSvg(sh, "cp-done")).join("");
          const next = body.querySelector("[data-next]");
          next.hidden = false;
          next.textContent = lives > 0 ? "Otra construcción →" : "Ver puntuación";
          next.addEventListener("click", () => (lives > 0 ? nextRound() : finish(false)));
        }
      }, 700 + k * 850);
    });
  }

  function finish(userExited) {
    // Con el end-card en pantalla la partida ya está terminada, pero el
    // botón "← Menú" de la barra tiene que seguir llevando al menú: la
    // guarda solo debe frenar los remates automáticos, no la salida.
    if (finished) return userExited ? onExit() : undefined;
    finished = true;
    timers.forEach(clearTimeout);
    timers.clear();
    if (userExited) return onExit();
    saveScore(client, "compas", { score, rounds });
    body.innerHTML = `
      <div class="end-card">
        <div>📐</div>
        <div class="big-score">${score} pts</div>
        <p>${score / 10} construcciones exactas</p>
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
    tool = "C";
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
