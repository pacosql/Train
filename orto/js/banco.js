// Orto — banco de ejercicios: carga los datos, elige el ejercicio de cada
// competencia, sintetiza los de sílabas/tónica/clasificar/diptongo con el
// motor y redacta las explicaciones de los de palabras.
import { analizar, explicarTilde, silabear, quitarTildes, gruposVocalicos, marcarTonica, tieneTilde } from "./silabas.js";

const MANUAL = ["acentuacion", "homofonos", "puntuacion", "adultos", "pares_minimos"];
const rnd = (n) => Math.floor(Math.random() * n);
export const azar = (l) => l[rnd(l.length)];
export const barajar = (l) => { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Sobresdrújulas: casi no salen en prensa, así que van a mano.
const SOBRES = ["dígamelo", "cómetelo", "explícaselo", "llévatelo", "cuéntaselo", "devuélvemelo", "entrégaselo", "tráigamelo", "recuérdaselo", "dibújamelo", "pregúntaselo", "cómpratelo", "léeselo", "escríbeselo", "repíteselo", "guárdamelo"];
// Palabras con separación silábica discutible (prefijos, h intercalada, tl).
const SILABA_DUDOSA = /^(sub|des|in|en|bien|mal|trans|inter|super|ab|ob)[aeiouáéíóúh]|[^c]h|tl/;

export async function cargarBanco(base = "datos/") {
  const get = (f) => fetch(base + f).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const [comp, pesos, palabras, frases, ...manuales] = await Promise.all([
    get("competencias.json"), get("pesos.json"), get("palabras.json"), get("frases.json"),
    ...MANUAL.map((m) => get(`manual/${m}.json`)),
  ]);
  const porComp = new Map();
  const add = (it) => { if (!porComp.has(it.c)) porComp.set(it.c, []); porComp.get(it.c).push(it); };
  for (const it of palabras || []) { it.k = "palabra"; add(it); }
  manuales.forEach((lista, f) => (lista || []).forEach((it, i) => { it.k = "manual"; it.id ||= `${MANUAL[f].slice(0, 3)}${i}`; add(it); }));
  // Índice palabra → ítems (para meter faltas en textos de prensa).
  const porPalabra = new Map();
  for (const it of palabras || []) { if (!porPalabra.has(it.w)) porPalabra.set(it.w, []); porPalabra.get(it.w).push(it); }
  // Reserva de palabras para los ejercicios de base (sílabas, tónica…).
  const reservaAcento = (palabras || []).filter((it) => it.c.startsWith("ACE.") && !it.c.includes("MENTE") && it.w.length <= 12 && it.w.length >= 3);
  return new Banco(comp, pesos, porComp, porPalabra, frases || [], reservaAcento);
}

const BASE = { "ACE.SILABAS": "silabas", "ACE.TONICA": "tonica", "ACE.CLASIFICA": "clasifica", "ACE.DIPTONGO": "diptongo" };

class Banco {
  constructor(comp, pesos, porComp, porPalabra, frases, reservaAcento) {
    Object.assign(this, { comp, pesos, porComp, porPalabra, frases, reservaAcento });
    this.compPorId = Object.fromEntries(comp.competencias.map((c) => [c.id, c]));
    this.recientes = [];
    this.tts = typeof speechSynthesis !== "undefined";
  }
  disponibles() {
    const s = new Set([...this.porComp.keys()].filter((k) => this.porComp.get(k).length));
    for (const k of Object.keys(BASE)) s.add(k);
    return s;
  }
  total() { let n = 0; for (const l of this.porComp.values()) n += l.length; return n; }

  // Ejercicio de la competencia c con dificultad cercana a d.
  // modo: "prueba" evita dictados largos y parejas.
  elegir(c, d = 2, modo = "practica") {
    if (BASE[c]) return this.sintetico(c, d);
    const lista = (this.porComp.get(c) || []).filter((it) => !(modo === "prueba" && it.t === "parejas"));
    if (!lista.length) return null;
    const noRec = lista.filter((it) => !this.recientes.includes(it.id));
    const pool = noRec.length ? noRec : lista;
    const cerca = pool.filter((it) => Math.abs((it.d || 2) - d) <= 0);
    const it = azar(cerca.length >= 3 ? cerca : pool);
    this.recientes.push(it.id); if (this.recientes.length > 60) this.recientes.shift();
    return { ...it, t: it.t || this.mecanica(it, modo) };
  }

  // Mecánica para un ítem de palabra.
  mecanica(it, modo) {
    const c = this.compPorId[it.c];
    const ops = (c?.m || ["elige"]).filter((m) => {
      if (m === "caza") return it.s?.length && modo !== "prueba";
      if (m === "dictado") return this.tts && modo !== "prueba" && it.w.length >= 4;
      if (m === "letra") return !!it.g && it.op;
      if (m === "tilde") return !it.g;
      return ["elige", "letra", "tilde", "dictado", "caza"].includes(m);
    });
    // Elegir, letra y tilde más a menudo; dictado y caza de vez en cuando.
    const peso = { elige: 3, letra: 3, tilde: 4, dictado: 1.2, caza: 1.5 };
    const tot = ops.reduce((a, m) => a + (peso[m] || 1), 0);
    let x = Math.random() * tot;
    for (const m of ops) { x -= peso[m] || 1; if (x <= 0) return m; }
    return ops[0] || "elige";
  }

  // Ejercicios de base generados con el motor de sílabas.
  sintetico(c, d) {
    const R = this.reservaAcento;
    const corta = d === 1 ? (w) => w.length <= 7 : d === 2 ? (w) => w.length <= 10 : () => true;
    if (c === "ACE.SILABAS") {
      for (let k = 0; k < 50; k++) {
        const w = azar(R).w;
        if (SILABA_DUDOSA.test(w) || !corta(w)) continue;
        const sil = silabear(w);
        if (sil.length < 2) continue;
        return { id: "s:" + w, c, t: "silabas", w, sil, d };
      }
    }
    if (c === "ACE.TONICA") {
      for (let k = 0; k < 50; k++) {
        const w = azar(R).w;
        if (!corta(w)) continue;
        const a = analizar(w);
        if (a.silabas.length < 2) continue;
        return { id: "t:" + w, c, t: "tonica", w, sil: a.silabas, ton: a.tonica, d };
      }
    }
    if (c === "ACE.CLASIFICA") {
      const tipo = azar(["aguda", "llana", "esdrújula", "aguda", "llana", "esdrújula", "sobresdrújula"]);
      if (tipo === "sobresdrújula") { const w = azar(SOBRES); return { id: "k:" + w, c, t: "clasifica", w, tipo, d }; }
      for (let k = 0; k < 80; k++) {
        const w = azar(R).w;
        const a = analizar(w);
        if (a.tipo === tipo && corta(w)) return { id: "k:" + w, c, t: "clasifica", w, tipo, d };
      }
    }
    if (c === "ACE.DIPTONGO") {
      for (let k = 0; k < 80; k++) {
        const w = azar(R).w;
        const gs = gruposVocalicos(w);
        if (!gs.length) continue;
        const g = azar(gs);
        if (g.clase === "triptongo" && Math.random() < 0.5) continue;
        return { id: "d:" + w + g.grupo, c, t: "diptongo", w, grupo: g.grupo, clase: g.clase, d };
      }
    }
    return null;
  }

  // ---------------------------------------------------------------- explicaciones
  // Texto de por qué la palabra correcta se escribe así.
  explicar(it) {
    if (it.x) return it.x;
    const c = this.compPorId[it.c];
    if (it.t === "silabas") return `Se separa ${it.sil.join("-")}. ${c.lec.regla.split(". ")[1] || ""}`.trim();
    if (it.t === "tonica") return `${marcarTonica(analizar(it.w))}: la que suena fuerte es ${it.sil[it.ton].toUpperCase()}. ${tieneTilde(it.w) ? "Además, la tilde te lo chiva." : "Llámala como si estuviera lejos y alárgala."}`;
    if (it.t === "clasifica") { const a = analizar(it.w); return `${marcarTonica(a)}: la sílaba fuerte es la ${["última", "penúltima", "antepenúltima", "anterior a la antepenúltima"][Math.min(3, a.silabas.length - 1 - a.tonica)]}, así que es ${a.tipo}.`; }
    if (it.t === "diptongo") return explicarGrupo(it);
    if (it.c.startsWith("ACE.")) return explicarTilde(it.w);
    return this.explicarLetra(it, c);
  }
  explicarLetra(it, c) {
    const [i, j] = it.g || [0, 0];
    const letra = it.op?.[0];
    const que = letra === "" ? "sin h" : `con ${letra}`;
    const regla = (c.lec.regla.match(/[^.]+\./) || [c.lec.regla])[0];
    let txt;
    if (c.id.endsWith("MEMORIA")) {
      const fam = this.familia(it);
      txt = `«${it.w}» se escribe ${que} y no hay regla que lo explique: hay que recordarla.${fam.length ? ` Te ayuda su familia: ${fam.map((f) => `«${f}»`).join(", ")}.` : ""}`;
    } else {
      txt = `«${it.w}» se escribe ${que}. ${regla}`;
      if (c.lec.exc?.length) txt += ` (Ojo: ${c.lec.exc[0].replace(/\.$/, "")}.)`;
    }
    return txt;
  }
  // Palabras de la misma familia (empiezan igual y tienen la misma letra).
  familia(it) {
    const [i, j] = it.g || [0, 0];
    const raiz = it.w.slice(0, Math.max(j + 1, 4));
    const out = [];
    for (const l of this.porComp.values()) for (const x of l) {
      if (x.k === "palabra" && x.w !== it.w && x.w.startsWith(raiz) && x.w.slice(i, j) === it.w.slice(i, j) && !out.includes(x.w)) out.push(x.w);
      if (out.length >= 3) return out;
    }
    return out;
  }

  // ---------------------------------------------------------------- textos de prensa
  // Frase de prensa con la palabra del ítem (para "caza la falta").
  frase(it) { return it.s?.length ? this.frases[azar(it.s)] : null; }
  // Párrafo de ~100 palabras con n faltas sacadas de las competencias que
  // se piden (las más flojas del usuario).
  parrafo(n, compsPreferidas = []) {
    const pref = new Set(compsPreferidas);
    for (let intento = 0; intento < 30; intento++) {
      const frases = [];
      let palabras = 0;
      while (palabras < 95) { const f = azar(this.frases); if (!frases.includes(f)) { frases.push(f); palabras += f.split(/\s+/).length; } }
      const tokens = [];
      frases.forEach((f, i) => { if (i) tokens.push(" "); f.split(/(\s+)/).forEach((t) => tokens.push(t)); });
      // candidatos: tokens que son palabra de un ítem
      const cands = [];
      tokens.forEach((t, k) => {
        const m = t.match(/^([¿¡"«(]*)([a-záéíóúüñ]+)([^a-záéíóúüñ]*)$/);
        if (!m) return;
        const its = this.porPalabra.get(m[2]);
        if (!its) return;
        const it = its.find((x) => pref.has(x.c)) || its[0];
        cands.push({ k, it, pre: m[1], post: m[3], pref: pref.has(it.c) });
      });
      if (cands.length < n + 2) continue;
      const orden = barajar(cands).sort((a, b) => b.pref - a.pref);
      const elegidos = [];
      for (const cnd of orden) { if (elegidos.length >= n) break; if (elegidos.some((e) => Math.abs(e.k - cnd.k) < 6)) continue; elegidos.push(cnd); }
      if (elegidos.length < n) continue;
      const faltas = elegidos.map((e) => ({ ...e, mal: azar(e.it.alts) }));
      return { tokens, faltas, palabras };
    }
    return null;
  }
}

function explicarGrupo(it) {
  const s = silabear(it.w).join("-");
  if (it.clase === "hiato") return `${s}: «${it.grupo}» va en sílabas distintas, es un hiato (dos vocales abiertas, o una cerrada con tilde).`;
  if (it.clase === "triptongo") return `${s}: «${it.grupo}» son tres vocales en la misma sílaba: triptongo.`;
  return `${s}: «${it.grupo}» va en la misma sílaba: es un diptongo (hay una i o u sin tilde).`;
}

export { quitarTildes };
