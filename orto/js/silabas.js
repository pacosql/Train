// Orto — motor de sílabas y tildes del español (RAE, Ortografía 2010).
//
// Se usa en el navegador (explicaciones y ejercicios de sílaba tónica,
// clasificar y "pon la tilde") y en Node (tools/generar.mjs y los tests),
// así que no depende del DOM.
//
// Idea: a partir de la palabra BIEN escrita se sabe siempre dónde está la
// sílaba fuerte (si tiene tilde, ahí; si no, la regla general la delata),
// y de ahí sale todo lo demás: tipo de palabra, si debe llevar tilde y por
// qué. Lo que la regla general no cubre (hiatos, diacríticas, -mente) se
// detecta aparte.

const TILDE = { a: "á", e: "é", i: "í", o: "ó", u: "ú" };
const SIN = { á: "a", é: "e", í: "i", ó: "o", ú: "u", ü: "u" };
const FUERTES = new Set(["a", "e", "o", "á", "é", "ó", "í", "ú"]);
const DEBILES = new Set(["i", "u", "ü", "y"]);
const VOCALES = new Set([..."aeiouáéíóúü"]);
const INSEPARABLES = new Set(["pl", "pr", "bl", "br", "fl", "fr", "cl", "cr", "gl", "gr", "tr", "dr", "kl", "kr"]);

export const quitarTildes = (w) => w.replace(/[áéíóú]/g, (c) => SIN[c]).replace(/[ÁÉÍÓÚ]/g, (c) => SIN[c.toLowerCase()].toUpperCase());
export const tieneTilde = (w) => /[áéíóúÁÉÍÓÚ]/.test(w);
const esVocal = (c) => VOCALES.has(c);

// Unidades: cada vocal y cada consonante (ch, ll, rr, qu+e/i y gu+e/i
// cuentan como una sola consonante). La "y" es vocal al final de palabra
// (rey, hoy) o entre vocal y consonante.
function unidades(palabra) {
  const w = palabra.toLowerCase();
  const out = [];
  for (let i = 0; i < w.length; i++) {
    const c = w[i], n = w[i + 1], n2 = w[i + 2];
    const orig = palabra.slice(i, i + 1);
    if ((c === "c" && n === "h") || (c === "l" && n === "l") || (c === "r" && n === "r")) {
      out.push({ v: false, s: palabra.slice(i, i + 2), i }); i++; continue;
    }
    if ((c === "q" || c === "g") && n === "u" && n2 && "eiéí".includes(n2)) {
      out.push({ v: false, s: palabra.slice(i, i + 2), i }); i++; continue;
    }
    if (c === "y") {
      const prevV = i > 0 && esVocal(w[i - 1]);
      const finalOcons = i === w.length - 1 || !esVocal(n || "");
      if (w.length === 1 || (prevV && finalOcons)) { out.push({ v: true, s: orig, l: "y", i }); continue; }
      out.push({ v: false, s: orig, i }); continue;
    }
    if (esVocal(c)) out.push({ v: true, s: orig, l: c, i });
    else out.push({ v: false, s: orig, i });
  }
  return out;
}

// ¿Hay frontera de sílaba entre dos vocales seguidas?
function hiato(a, b) {
  if (FUERTES.has(a) && FUERTES.has(b)) return true;           // a-e, o-í, í-a…
  if ((a === "i" && b === "i") || (a === "u" && b === "u")) return true; // chi-i-ta
  return false;                                                 // diptongo
}

// Devuelve las sílabas como trozos del texto original.
export function silabear(palabra) {
  const u = unidades(palabra);
  if (!u.some((x) => x.v)) return [palabra];
  // Grupos vocálicos (núcleos) separando hiatos.
  const nucleos = []; // [inicio, fin] índices en u (inclusive)
  for (let k = 0; k < u.length; k++) {
    if (!u[k].v) continue;
    if (k > 0 && u[k - 1].v && !hiato(u[k - 1].l, u[k].l)) nucleos[nucleos.length - 1][1] = k;
    else nucleos.push([k, k]);
  }
  // Cortes: índice de unidad donde empieza cada sílaba (salvo la primera).
  const cortes = [];
  for (let n = 1; n < nucleos.length; n++) {
    const fin = nucleos[n - 1][1], ini = nucleos[n][0];
    const cons = u.slice(fin + 1, ini);
    const k = cons.length;
    let corte;
    if (k === 0) corte = ini;
    else if (k === 1) corte = ini - 1;
    else if (k === 2) corte = INSEPARABLES.has((cons[0].s + cons[1].s).toLowerCase()) ? ini - 2 : ini - 1;
    else if (k === 3) corte = INSEPARABLES.has((cons[1].s + cons[2].s).toLowerCase()) ? ini - 2 : ini - 1;
    else corte = ini - 2;
    cortes.push(corte);
  }
  const sil = [];
  let desde = 0;
  for (const c of cortes) { sil.push(u.slice(desde, c).map((x) => x.s).join("")); desde = c; }
  sil.push(u.slice(desde).map((x) => x.s).join(""));
  return sil;
}

const TIPOS = ["aguda", "llana", "esdrújula", "sobresdrújula"];

// Termina en vocal, n o s (y la s no va tras otra consonante: "robots").
function terminaEnVocalNS(w) {
  const l = w.toLowerCase();
  const u = l[l.length - 1], p = l[l.length - 2] || "";
  if ("aeiouáéíóú".includes(u)) return true;
  if (u === "n") return true;
  if (u === "s") return !p || esVocal(p);
  return false;
}

// Monosílabos con tilde diacrítica (se explican aparte: dependen del uso).
export const DIACRITICOS = {
  "tú": "tú (pronombre) ≠ tu (posesivo)", "él": "él (pronombre) ≠ el (artículo)",
  "mí": "mí (pronombre) ≠ mi (posesivo o nota musical)", "sí": "sí (afirmación o pronombre) ≠ si (condición)",
  "sé": "sé (de saber o ser) ≠ se (pronombre)", "té": "té (bebida) ≠ te (pronombre)",
  "dé": "dé (de dar) ≠ de (preposición)", "más": "más (cantidad) ≠ mas (= pero)",
  "qué": "qué (pregunta o exclamación) ≠ que", "quién": "quién (pregunta) ≠ quien",
  "cuál": "cuál (pregunta) ≠ cual", "cuán": "cuán (exclamación) ≠ cuan",
  "aún": "aún (= todavía) ≠ aun (= incluso)",
};
const INTERROGATIVOS = new Set(["qué", "quién", "quiénes", "cuál", "cuáles", "cómo", "dónde", "cuándo", "cuánto", "cuánta", "cuántos", "cuántas", "adónde", "cuán"]);

// Análisis completo de una palabra bien escrita.
export function analizar(palabra) {
  const w = palabra;
  const sil = silabear(w);
  const n = sil.length;
  let tonica = -1;
  sil.forEach((s, i) => { if (tieneTilde(s)) tonica = i; });
  const conTilde = tonica >= 0;
  if (!conTilde) tonica = n === 1 ? 0 : terminaEnVocalNS(w) ? n - 2 : n - 1;
  const pos = n - 1 - tonica; // 0 = última
  const tipo = n === 1 ? "monosílaba" : TIPOS[Math.min(pos, 3)];
  // Hiato con vocal cerrada tónica: país, oído, búho (la h no impide el hiato).
  const lw = w.toLowerCase();
  const lo = lw;
  let hiatoTonico = false;
  const m = lw.match(/[aeoáéó]h?[íú]|[íú]h?[aeoáéó]/);
  if (m) hiatoTonico = true;
  // Regla general.
  let pide;
  if (n === 1) pide = false;
  else if (tipo === "aguda") pide = terminaEnVocalNS(w);
  else if (tipo === "llana") pide = !terminaEnVocalNS(w);
  else pide = true;
  const mente = /mente$/.test(lo) && n > 3;
  const diacritica = n === 1 && conTilde && !!DIACRITICOS[lo];
  const interrogativo = INTERROGATIVOS.has(lo);
  const requiere = pide || hiatoTonico || diacritica || interrogativo;
  return {
    palabra: w, silabas: sil, tonica, tipo, conTilde, pide, hiato: hiatoTonico, diacritica, interrogativo,
    mente, coherente: conTilde === requiere || mente,
  };
}

const ORD = ["última", "penúltima", "antepenúltima", "anterior a la antepenúltima"];
export const marcarTonica = (a) => a.silabas.map((s, i) => (i === a.tonica ? s.toUpperCase() : s)).join("-");

// Explicación en lenguaje llano de por qué lleva (o no) tilde.
export function explicarTilde(palabra) {
  const a = analizar(palabra);
  const sep = marcarTonica(a);
  const fin = palabra.slice(-1).toLowerCase();
  const finTxt = "aeiouáéíóú".includes(fin) ? "vocal" : fin === "y" ? "y (cuenta como consonante)" : `«${fin}»`;
  const lleva = a.conTilde ? "lleva tilde" : "no lleva tilde";
  if (a.mente) {
    const base = palabra.slice(0, -5);
    return `${palabra}: los adverbios en -mente conservan la tilde del adjetivo del que vienen («${base}» ${tieneTilde(base) ? "lleva" : "no lleva"} tilde), así que ${lleva}.`;
  }
  if (a.silabas.length === 1) {
    if (a.diacritica) return `${palabra}: es monosílaba y en general no llevaría tilde, pero lleva tilde diacrítica para distinguirla: ${DIACRITICOS[palabra.toLowerCase()] || "distingue dos palabras que se escriben igual"}.`;
    return `${palabra}: tiene una sola sílaba. Los monosílabos no llevan tilde (fue, dio, vio, fe, pie, ti, guion), salvo la diacrítica (tú/tu, él/el, sé/se…).`;
  }
  if (a.interrogativo) return `${palabra}: es un interrogativo o exclamativo; en preguntas y exclamaciones (también indirectas: «no sé ${palabra.toLowerCase()}…») lleva tilde.`;
  if (a.hiato && a.conTilde && !a.pide) {
    return `${sep}: la sílaba fuerte tiene una vocal cerrada (i, u) junto a una abierta (a, e, o) y van en sílabas distintas: es un hiato. En ese caso la i o la u llevan tilde SIEMPRE, aunque la regla general no lo pida (país, río, oído, búho).`;
  }
  const base = `${sep}: la sílaba fuerte es ${a.silabas[a.tonica].toUpperCase()}, la ${ORD[Math.min(a.silabas.length - 1 - a.tonica, 3)]}, así que es ${a.tipo}.`;
  if (a.tipo === "aguda") return `${base} Las agudas llevan tilde si terminan en vocal, n o s. «${palabra}» termina en ${finTxt} → ${lleva}.${/[^aeiouáéíóú]s$/i.test(palabra) ? " (Si la s va detrás de otra consonante, como en «robots», no cuenta.)" : ""}`;
  if (a.tipo === "llana") return `${base} Las llanas llevan tilde si NO terminan en vocal, n o s. «${palabra}» termina en ${finTxt} → ${lleva}.${/[^aeiouáéíóú]s$/i.test(palabra) ? " (Si la s va detrás de otra consonante, como en «bíceps» o «cómics», sí lleva.)" : ""}`;
  return `${base} Las esdrújulas y sobresdrújulas llevan tilde siempre.`;
}

// Escritura con la tilde en la vocal número k (índice en la palabra).
export function tildarEn(w, k) {
  const c = w[k];
  const low = c.toLowerCase();
  if (!TILDE[low]) return null;
  const t = TILDE[low];
  return w.slice(0, k) + (c === low ? t : t.toUpperCase()) + w.slice(k + 1);
}

// Posiciones de vocales "tildables" de una palabra sin tildes.
export function vocalesTildables(w) {
  const out = [];
  for (let k = 0; k < w.length; k++) if ("aeiouAEIOU".includes(w[k])) {
    // la u muda de que/qui/gue/gui no es tildable
    const p = w[k - 1]?.toLowerCase(), nx = w[k + 1]?.toLowerCase();
    if (w[k].toLowerCase() === "u" && (p === "q" || p === "g") && nx && "eiéí".includes(nx)) continue;
    out.push(k);
  }
  return out;
}

// Variantes mal escritas (por tilde) de una palabra bien escrita: sin la
// tilde, con la tilde en otra vocal o con una tilde que sobra.
export function variantesTilde(palabra) {
  const base = quitarTildes(palabra);
  const out = new Set();
  if (base !== palabra) out.add(base);
  for (const k of vocalesTildables(base)) {
    const v = tildarEn(base, k);
    if (v && v !== palabra) out.add(v);
  }
  return [...out];
}

// Para el ejercicio "pon la tilde": índice de la vocal con tilde en la
// palabra correcta (o -1 si no lleva).
export function indiceTilde(palabra) {
  for (let k = 0; k < palabra.length; k++) if ("áéíóúÁÉÍÓÚ".includes(palabra[k])) return k;
  return -1;
}

// Diptongo, triptongo o hiato de una pareja de vocales seguidas (para el
// ejercicio de reconocerlos). Devuelve una lista de {grupo, clase}.
export function gruposVocalicos(palabra) {
  const sil = silabear(palabra);
  const out = [];
  // Dentro de una sílaba: diptongo/triptongo.
  sil.forEach((s) => {
    const m = s.toLowerCase().match(/[aeiouáéíóúü]{2,}|[aeiouáéíóú]y$/);
    if (m) out.push({ grupo: m[0], clase: m[0].length >= 3 ? "triptongo" : "diptongo" });
  });
  // Entre sílabas: hiato.
  for (let i = 0; i + 1 < sil.length; i++) {
    const a = sil[i].toLowerCase(), b = sil[i + 1].toLowerCase();
    if (/[aeiouáéíóú]$/.test(a) && /^[aeiouáéíóú]/.test(b)) out.push({ grupo: a.slice(-1) + b[0], clase: "hiato" });
  }
  return out;
}
