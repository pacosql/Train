// Orto — modelo del alumno: dominio por competencia (BKT), OrtoScore,
// equivalencia con un curso, estrellas y elección del siguiente ejercicio.
// Sin DOM: se prueba en Node (tools/test_modelo.mjs).

// ---------------------------------------------------------------- BKT
// Knowledge tracing bayesiano (Corbett y Anderson, 1995). p = probabilidad
// de que la competencia esté dominada. g (acertar sin saber) depende de la
// mecánica: 1/opciones en las de elegir, casi 0 en el dictado.
export const BKT = { pT: 0.12, pS: 0.08 };
export function actualizar(p, correcto, g = 0.25, peso = 1) {
  const s = BKT.pS;
  const post = correcto ? (p * (1 - s)) / (p * (1 - s) + (1 - p) * g) : (p * s) / (p * s + (1 - p) * (1 - g));
  // peso < 1 (p. ej. reintento tras ver la explicación) cuenta menos.
  const mezcla = p + (post - p) * peso;
  return Math.min(0.995, Math.max(0.005, mezcla + (1 - mezcla) * BKT.pT * (correcto ? peso : 0)));
}
export const GUESS = { elige: 0.3, letra: 0.4, tilde: 0.2, tonica: 0.3, clasifica: 0.25, silabas: 0.25, diptongo: 0.33, hueco: 0.3, frase: 0.3, caza: 0.15, dictado: 0.03, parejas: 0.15, semaforo: 0.5 };

// Estrellas (0-5) a partir del dominio.
export const estrellas = (p) => (p == null ? null : p < 0.15 ? 0 : p < 0.35 ? 1 : p < 0.55 ? 2 : p < 0.72 ? 3 : p < 0.88 ? 4 : 5);

// ---------------------------------------------------------------- OrtoScore
// Faltas esperadas por cada 100 palabras de prensa:
//   faltas = K · Σ occ_c · r_c · (1 − p_c)
// occ_c = apariciones de la competencia por 100 palabras de prensa española
// (corpus), r_c = probabilidad de fallo por aparición de quien no la domina.
// OrtoScore = 100 · e^(−faltas / 6): 0 faltas → 100, 1 → 85, 3 → 61, 6 → 37.
export const K = 1.5;
export const scoreDeFaltas = (f) => Math.round(100 * Math.exp(-f / 6));
export const faltasDeScore = (s) => -6 * Math.log(Math.max(1, s) / 100);

export function crearModelo(datos, pesos) {
  const comps = datos.competencias.map((c) => {
    const occ = pesos?.pesos?.[c.id] ?? c.occ;
    return { ...c, occ, w: occ * c.r };
  });
  const porId = Object.fromEntries(comps.map((c) => [c.id, c]));
  const cursos = datos.cursos;

  function faltas(dom) {
    let f = 0;
    for (const c of comps) f += c.w * (1 - (dom[c.id] ?? 0));
    return K * f;
  }
  // Perfil típico al acabar el curso n: lo de cursos anteriores, casi
  // dominado; lo del curso, a medias; lo posterior, lo que se pilla leyendo.
  function perfilCurso(n) {
    const d = {};
    for (const c of comps) d[c.id] = c.c < n ? (n >= 11 ? 0.95 : 0.92) : c.c === n ? 0.65 : Math.max(0.08, 0.5 - 0.1 * (c.c - n));
    return d;
  }
  const referencias = cursos.map((nombre, n) => (n === 0 ? null : { n, nombre, score: scoreDeFaltas(faltas(perfilCurso(n))) })).filter(Boolean);
  referencias.push({ n: 12, nombre: "Corrector profesional", score: scoreDeFaltas(faltas(Object.fromEntries(comps.map((c) => [c.id, 0.985])))) });

  function nivel(score) {
    let mejor = null;
    for (const r of referencias) if (score >= r.score) mejor = r;
    return mejor || { n: 0, nombre: "Antes de 1º de primaria", score: 0 };
  }
  function resumen(dom) {
    const f = faltas(dom);
    const score = scoreDeFaltas(f);
    return { faltas: Math.round(f * 10) / 10, score, nivel: nivel(score) };
  }
  // Cuánto subiría el OrtoScore si dominara del todo una competencia.
  function ganancia(dom, id) {
    const c = porId[id];
    const f = faltas(dom);
    return scoreDeFaltas(f - K * c.w * (1 - (dom[id] ?? 0))) - scoreDeFaltas(f);
  }
  return { comps, porId, cursos, referencias, faltas, resumen, nivel, ganancia, perfilCurso };
}

// ---------------------------------------------------------------- prueba de nivel
// Escalera por bloque: se empieza por la competencia de curso intermedio;
// acierto → una más difícil del bloque, fallo → una más fácil. Al acabar se
// propaga: lo más fácil que lo acertado, dominado; lo más difícil que lo
// fallado, poco probable.
export function planPrueba(modelo) {
  const bloques = {};
  for (const c of modelo.comps) if (c.r > 0) (bloques[c.b] ||= []).push(c);
  for (const l of Object.values(bloques)) l.sort((a, b) => a.c - b.c || b.w - a.w);
  // Búsqueda binaria: log2(n) + 1 preguntas por bloque (ACE, con 24, hace 6).
  return Object.entries(bloques).map(([b, lista]) => ({ b, lista, i: Math.floor((lista.length - 1) / 2), lo: 0, hi: lista.length - 1, n: 0, max: Math.min(lista.length, Math.ceil(Math.log2(lista.length)) + 1) }));
}
export function pasoPrueba(estado, correcto) {
  estado.n++;
  if (correcto) estado.lo = estado.i + 1; else estado.hi = estado.i - 1;
  if (estado.lo > estado.hi || estado.n >= estado.max) return false;
  estado.i = Math.floor((estado.lo + estado.hi + (correcto ? 1 : 0)) / 2);
  return true;
}
// Cierre: en cada bloque las competencias van de fácil a difícil y la
// búsqueda deja un intervalo: lo que está por debajo de "lo" se domina, lo
// que está por encima de "hi" no, y lo de en medio queda sin resolver. Lo
// preguntado manda sobre lo deducido.
export function cerrarPrueba(modelo, escaleras, resultados) {
  const dom = {};
  for (const e of escaleras) {
    const l = e.lista;
    const sinFallos = l.every((c) => (resultados[c.id] || []).every(Boolean));
    l.forEach((c, i) => {
      let p = i < e.lo ? (sinFallos ? 0.95 : 0.9) : i > e.hi ? 0.2 : 0.5;
      const r = resultados[c.id];
      if (r?.length) p = r.every(Boolean) ? Math.max(p, 0.9) : Math.min(p, 0.25);
      if (!r && c.c <= 2) p = Math.max(p, 0.85); // lo de 1º-2º, un adulto lo sabe
      dom[c.id] = p;
    });
  }
  for (const c of modelo.comps) if (dom[c.id] == null) dom[c.id] = c.c <= 3 ? 0.8 : 0.5;
  return dom;
}

// ---------------------------------------------------------------- tutor
// Elige la competencia del siguiente bloque de práctica. Prioridad:
//   1) repaso vencido de algo ya dominado (si toca),
//   2) la que más sube el OrtoScore entre las que tienen los prerrequisitos
//      al menos a medias y aún no están dominadas (zona de aprendizaje),
//   con un poco de azar para no repetir siempre lo mismo.
export function elegirCompetencia(modelo, estado, opciones = {}) {
  const { dom, ultimo = {}, evitar = [] } = estado;
  const ahora = opciones.ahora ?? Date.now();
  const DIA = 864e5;
  const cand = [];
  for (const c of modelo.comps) {
    if (evitar.includes(c.id) || c.r === 0 && !opciones.incluirBase) continue;
    if (opciones.disponibles && !opciones.disponibles.has(c.id)) continue;
    const p = dom[c.id] ?? 0.5;
    const preOk = c.pre.every((x) => (dom[x] ?? 0.5) >= 0.5);
    if (!preOk) continue;
    const g = modelo.ganancia(dom, c.id);
    let prio;
    if (p >= 0.9) {
      // Repaso espaciado: cuanto más dominado, más tarde.
      const dias = (ahora - (ultimo[c.id] ?? 0)) / DIA;
      const intervalo = p >= 0.97 ? 14 : 5;
      prio = dias > intervalo ? 0.4 + g * 0.2 : 0;
    } else {
      prio = (0.3 + g) * (p < 0.3 ? 0.8 : 1.2) * (1 + 0.6 * Math.random());
    }
    if (prio > 0) cand.push({ id: c.id, prio, p, g });
  }
  cand.sort((a, b) => b.prio - a.prio);
  if (cand.length) return cand[0].id;
  // Todo dominado o sin repaso pendiente: consolidar lo que más pesa en el
  // OrtoScore (o lo menos dominado), con algo de azar.
  const resto = modelo.comps.filter((c) => c.r > 0 && !evitar.includes(c.id) && (!opciones.disponibles || opciones.disponibles.has(c.id)))
    .map((c) => ({ id: c.id, prio: (modelo.ganancia(dom, c.id) + (1 - (dom[c.id] ?? 0.5))) * (0.5 + Math.random()) }))
    .sort((a, b) => b.prio - a.prio);
  return resto[0]?.id || null;
}

// Dificultad del ejercicio según el dominio y el termostato de la sesión
// (aciertos recientes entre 70 % y 90 %).
export function dificultadPara(p, recientes = []) {
  let d = p < 0.4 ? 1 : p < 0.75 ? 2 : 3;
  if (recientes.length >= 4) {
    const tasa = recientes.slice(-6).filter(Boolean).length / Math.min(6, recientes.length);
    if (tasa > 0.9) d = Math.min(3, d + 1);
    if (tasa < 0.7) d = Math.max(1, d - 1);
  }
  return d;
}

// Prerrequisito al que bajar tras fallar dos seguidas (el menos dominado).
export function prerrequisitoFlojo(modelo, dom, id) {
  const c = modelo.porId[id];
  if (!c) return null;
  const flojos = c.pre.filter((x) => (dom[x] ?? 0.5) < 0.75).sort((a, b) => (dom[a] ?? 0.5) - (dom[b] ?? 0.5));
  return flojos[0] || null;
}
