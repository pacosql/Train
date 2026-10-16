// Genera el banco de ejercicios de palabras de Orto a partir de prensa
// española real (corpus Leipzig, ver tools/corpus.py) y del diccionario.
//
//   python3 orto/tools/corpus.py /tmp/orto-corpus
//   node orto/tools/generar.mjs /tmp/orto-corpus
//
// Cada palabra del corpus (en minúscula, que exista en el diccionario) se
// clasifica en la competencia cuya regla la explica. El distractor cambia
// SOLO la letra o la tilde de esa regla y tiene que NO existir en el
// diccionario: si existe (tuvo/tubo, término/terminó) es un homófono y se
// trabaja en frases, no aquí.
//
// Salida: datos/palabras.json (ítems), datos/frases.json (frases de prensa
// para "caza la falta") y datos/pesos.json (apariciones por cada 100
// palabras de prensa de cada competencia, para el OrtoScore).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { existe } from "./diccionario.mjs";
import { analizar, quitarTildes, tieneTilde, silabear, tildarEn, indiceTilde } from "../js/silabas.js";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const DATOS = path.join(AQUI, "..", "datos");
const CORPUS = process.argv[2] || "/tmp/orto-corpus";
const { total, freq } = JSON.parse(fs.readFileSync(path.join(CORPUS, "es_freq.json")));
const frasesCorpus = JSON.parse(fs.readFileSync(path.join(CORPUS, "es_sentences.json")));
const porMillon = (c) => (c * 1e6) / total;

// Palabras malsonantes o delicadas que no queremos en ejercicios.
const VETO = new Set(["puta", "puto", "putas", "mierda", "joder", "cojones", "polla", "coño", "violación", "violaciones", "violada", "violador", "violadores", "violar", "violó", "cadáver", "cadáveres", "asesinato", "asesinada", "asesinado", "suicidio", "yihadista", "yihadistas", "nazi", "nazis", "pene", "vagina", "sexo", "sexual", "sexuales", "abuso", "abusos", "agresión", "agresiones", "maltrato", "terrorista", "terroristas", "drogas", "cocaína", "heroína", "heroínas", "pornografía", "porno"]);

// ---------------------------------------------------------------- utilidades
const W = new Map(); // palabra -> apariciones (solo minúsculas)
for (const [w, c] of freq) if (w === w.toLowerCase() && w.length >= 2) W.set(w, c);
const cacheExiste = new Map();
const ex = (w) => { if (!cacheExiste.has(w)) cacheExiste.set(w, existe(w)); return cacheExiste.get(w); };
const dificultad = (pm) => (pm >= 60 ? 1 : pm >= 6 ? 2 : 3);
const swap = (w, i, len, rep) => w.slice(0, i) + rep + w.slice(i + len);

// Ítems: {c, w, g:[ini,fin], op:[correcta, …malas], alts:[palabras mal], d, f}
const items = [];
const vistos = new Set();
const ocurr = {}; // competencia -> apariciones en el corpus
function anota(c, n) { ocurr[c] = (ocurr[c] || 0) + n; }
function item(c, w, cnt, g, op, alts) {
  const k = c + "|" + w;
  anota(c, cnt);
  if (vistos.has(k) || VETO.has(w)) return;
  alts = [...new Set(alts)].filter((a) => a !== w && !ex(a));
  if (!alts.length) return;
  vistos.add(k);
  const f = Math.round(porMillon(cnt) * 10) / 10;
  items.push({ c, w, g, op, alts, d: dificultad(f), f });
}

// Formas de verbos: terminaciones habituales para reconocer conjugaciones.
const FIN_IR = ["ir", "o", "es", "e", "imos", "ís", "en", "í", "iste", "ió", "isteis", "ieron", "ía", "ías", "íamos", "ían", "iré", "irá", "irán", "iremos", "iría", "irían", "a", "as", "amos", "an", "iera", "ieras", "ieran", "iéramos", "iese", "iendo", "ido", "ida", "idos", "idas", "irse", "irlo", "irla", "irle", "iéndose"];
const esForma = (w, raiz, fines) => w.startsWith(raiz) && fines.includes(w.slice(raiz.length));
const VERBOS_BIR = ["escrib", "describ", "inscrib", "suscrib", "transcrib", "prescrib", "recib", "percib", "concib", "prohib", "prohíb", "exhib", "cohib", "contribu", "distribu", "atribu", "retribu", "sub"];
const FIN_UIR = ["ir", "ye", "yes", "yen", "yo", "yó", "yeron", "ía", "ían", "ido", "ida", "idos", "imos", "yendo", "ya", "yan", "yera", "yeran", "irá", "irán", "iría", "ción", "ciones"];
function esBir(w, i) {
  return VERBOS_BIR.some((r) => r.endsWith("u") ? esForma(w, r, FIN_UIR) && i === r.length - 2 : esForma(w, r, FIN_IR) && i === r.length - 1);
}
const VERBOS_GER = ["cog", "recog", "escog", "acog", "encog", "proteg", "eleg", "elig", "dirig", "exig", "correg", "corrig", "surg", "fing", "aflig", "inflig", "emerg", "sumerg", "reg", "rig", "urg", "fing", "converg", "diverg", "infring", "restring"];
const FIN_GER = ["er", "ir", "e", "es", "en", "emos", "imos", "ió", "ieron", "ía", "ían", "ido", "ida", "idos", "idas", "iendo", "ería", "erá", "irá", "irán", "erán", "iera", "ieran", "ería", "erse", "irse", "erlo", "irlo", "erla", "irla"];
const ADJ_V = /(ivo|iva|ivos|ivas)$/;
const ADJ_V_LISTA = new Set(["nuevo", "nueva", "nuevos", "nuevas", "grave", "graves", "suave", "suaves", "breve", "breves", "leve", "leves", "octavo", "octava", "octavos", "bravo", "brava", "bravos", "esclavo", "esclava", "esclavos", "longevo", "longeva", "onceavo", "doceavo", "decimoctavo", "eslavo", "eslava", "eslavos", "cóncavo", "cóncava", "nuevamente", "gravemente", "suavemente", "brevemente", "levemente"]);
const PREF_B = ["bicicl", "biling", "bimestr", "bisabuel", "bisniet", "bienest", "bienven", "bienhech", "benefic", "benéfic", "benévol", "benefact", "biolog", "biólog", "biograf", "biógraf", "bioquím", "bibliotec", "bibliogr", "bilateral", "bipartid", "bicampe", "bianual", "bimotor", "bisemanal", "bisílab", "biodivers", "biocombust", "biomasa", "bioétic", "biométric", "biotecnol", "bisectriz", "bicéfal", "bienal", "binomio"];
const PREF_V = ["vicepres", "vicesecret", "vicerrect", "viceconsej", "vicealcald", "vicedecan", "viceministr", "villancic", "villano", "villan", "herbívor", "carnívor", "omnívor", "insectívor", "frugívor", "triunvir", "decenvir"];
const VERB_V = /^(tuv|estuv|anduv|mantuv|obtuv|contuv|retuv|detuv|sostuv|entretuv|abstuv|desanduv)/;
const IR_V = new Set(["voy", "vas", "vamos", "vaya", "vayas", "vayan", "vayamos", "ve", "id"]);

function bv(w, cnt) {
  // m antes de b/p
  for (let i = 0; i < w.length - 1; i++) {
    if (w[i] === "m" && (w[i + 1] === "b" || w[i + 1] === "p")) { item("BV.MB", w, cnt, [i, i + 1], ["m", "n"], [swap(w, i, 1, "n")]); break; }
  }
  for (let i = 0; i < w.length; i++) {
    const ch = w[i];
    if (ch !== "b" && ch !== "v") continue;
    const otra = ch === "b" ? "v" : "b";
    const alt = swap(w, i, 1, otra);
    const sig = w[i + 1] || "", ant = w[i - 1] || "";
    let c = null;
    if (ch === "b") {
      if (sig === "l" || sig === "r") c = "BV.BL_BR";
      else if (/(aba|abas|ábamos|abais|aban)$/.test(w) && i === w.lastIndexOf("ab") + 1 && (ex(w.replace(/(aba|abas|ábamos|abais|aban)$/, "ar")) || /^(iba|ibas|íbamos|ibais|iban)$/.test(w))) c = "BV.ABA";
      else if (/^(iba|ibas|íbamos|ibais|iban)$/.test(w)) c = "BV.ABA";
      else if (/(bilidad|bilidades|bundo|bunda|bundos|bundas)$/.test(w) && i === w.search(/b(ilidad|undo|unda)/)) c = "BV.BILIDAD";
      else if (i === 0 && /^(bu|bur|bus)/.test(w)) c = "BV.BU";
      else if (i === 0 && PREF_B.some((p) => w.startsWith(p))) c = "BV.PREF_B";
      else if (esBir(w, i)) c = "BV.BIR";
      else if (sig && !"aeiouáéíóúlr".includes(sig) || i === w.length - 1) c = "BV.B_CONS";
      else c = "BV.MEMORIA";
    } else {
      if (ant === "n" || ant === "d" || (ant === "b" && i > 0)) c = "BV.V_NDB";
      else if ((ADJ_V.test(w) && i === w.search(/iv(o|a|os|as)$/) + 1) || (ADJ_V_LISTA.has(w) && i === w.lastIndexOf("v"))) c = "BV.ADJ_V";
      else if (VERB_V.test(w) && i === w.search(/v/)) c = "BV.VERBOS_V";
      else if (IR_V.has(w)) c = "BV.VERBOS_V";
      else if (PREF_V.some((p) => w.startsWith(p)) && i === w.search(/v/)) c = "BV.PREF_V";
      else c = "BV.MEMORIA";
    }
    item(c, w, cnt, [i, i + 1], [ch, otra], [alt]);
  }
}

const H_HIEHUE = /^h(ie|ue|ui)/;
const H_HUM = /^(hum[aeiouáéíóú]|horm|horr|hosp|holg)/;
const H_GRIEGO = /^(hidr|hiper|hipo|hipó|hemi|hexa|hepta|hept|homo|homó|homeo|hetero|helio|hemo|hemat|hecto|holo|hagio|hiper|hidro)/;
const H_VERBOS = /^(har[íáée]|hab[eéií]|hab[ií]a|hub|ha$|han$|has$|hemos$|he$|hay$|hac|hag|hic|hiz|hech|hab[lé]|habl|hall|habit|hel)/;
const NO_VERBO_H = new Set(["hacia", "hacienda", "haciendas", "hacha", "hachas", "hall", "hallazgo", "hallazgos", "habilidad", "habilidades", "hábil", "habitual", "habitualmente", "habituales", "habichuela", "habano", "habanos", "hábito", "hábitos", "helado", "helados", "helicóptero", "helicópteros", "hélice", "hecatombe", "hectárea", "hectáreas", "hachís"]);
const SIN_H = ["echar", "echo", "echa", "echas", "echan", "echó", "echaba", "echaban", "echado", "echada", "echamos", "echaron", "echaría", "eche", "echen", "iba", "iban", "umbral", "orfanato", "óseo", "ósea", "óvulo", "oval", "ovalado", "ermita", "ermitaño", "ojear", "ola", "olas", "ahora"];
function h(w, cnt) {
  if (w[0] === "h") {
    const alt = w.slice(1);
    let c = H_HIEHUE.test(w) ? "H.HIE_HUE" : H_HUM.test(w) ? "H.HUM_HORR" : H_GRIEGO.test(w) ? "H.GRIEGO" : H_VERBOS.test(w) && !NO_VERBO_H.has(w) ? "H.VERBOS" : "H.MEMORIA";
    item(c, w, cnt, [0, 1], ["h", ""], [alt]);
  }
  for (let i = 1; i < w.length; i++) {
    if (w[i] === "h" && w[i - 1] !== "c" && w[i - 1] !== "s") item("H.INTERMEDIA", w, cnt, [i, i + 1], ["h", ""], [swap(w, i, 1, "")]);
  }
  if (SIN_H.includes(w) && !w.startsWith("ah")) item("H.MEMORIA", w, cnt, [0, 0], ["", "h"], ["h" + w]);
}

function gj(w, cnt) {
  for (let i = 0; i < w.length - 1; i++) {
    const ch = w[i], sig = w[i + 1];
    if (ch === "g" && "üu".includes(sig) && "eiéí".includes(w[i + 2] || "")) {
      if (sig === "ü") item("GJ.GUE", w, cnt, [i + 1, i + 2], ["ü", "u"], [swap(w, i + 1, 1, "u")]);
      else item("GJ.GUE", w, cnt, [i, i + 2], ["gu", "g"], [swap(w, i, 2, "g")]);
      continue;
    }
    if ((ch !== "g" && ch !== "j") || !"eiéí".includes(sig)) continue;
    const otra = ch === "g" ? "j" : "g";
    let c;
    if (ch === "g" && (/(gen|genes|gente|gentes|gencia|gencias|gía|gías|gio|gios|gia|gias|gión|giones|gional|gionales|gioso|giosa|giosos|giosas)$/.test(w) || /^(geo|gest|legi)/.test(w))) c = "GJ.GEN_GIA";
    else if (VERBOS_GER.some((r) => esForma(w, r, FIN_GER) && i === r.length - 1)) c = "GJ.VERBOS_GER";
    else if (ch === "j" && /(aje|ajes|eje|ejes|jero|jera|jeros|jeras|jería|jerías)$/.test(w) && i === w.search(/j(e|ero|era|eros|eras|ería|erías)?s?$/)) c = "GJ.AJE_JERO";
    else if (ch === "j" && /^(dij|traj|contraj|atraj|distraj|retraj|conduj|produj|traduj|reduj|deduj|induj|introduj|reproduj|seduj)(e|o|imos|iste|isteis|eron|era|eras|eran|ese|esen|éramos|ésemos)$/.test(w)) c = "GJ.J_VERBOS";
    else c = "GJ.MEMORIA";
    item(c, w, cnt, [i, i + 1], [ch, otra], [swap(w, i, 1, otra)]);
  }
}

const Y_VERBOS = /^(oy[eóe]|oyeron|oyendo|oyera|cay|recay|decay|ley[óe]|leyeron|leyendo|leyera|crey|haya|hayan|hayas|hayamos|yendo|huy|construy|destruy|reconstruy|incluy|concluy|excluy|influy|contribuy|distribuy|atribuy|sustituy|constituy|instituy|restituy|disminuy|obstruy|fluy|poseyó|poseyeron|proveyó)/;
function lly(w, cnt) {
  for (let i = 0; i < w.length - 1; i++) {
    if (w[i] === "l" && w[i + 1] === "l") {
      const c = /ill(o|a|os|as)$/.test(w) && w.lastIndexOf("ll") === i ? "LLY.ILLO" : "LLY.MEMORIA";
      item(c, w, cnt, [i, i + 2], ["ll", "y"], [swap(w, i, 2, "y")]);
      i++;
    } else if (w[i] === "y" && "aeiouáéíóú".includes(w[i + 1])) {
      const c = Y_VERBOS.test(w) && !/^(ley|leyes|cuy|suy|tuy|muy)/.test(w.slice(0, 4)) ? "LLY.Y_VERBOS" : "LLY.MEMORIA";
      item(c, w, cnt, [i, i + 1], ["y", "ll"], [swap(w, i, 1, "ll")]);
    }
  }
  if (/[aeou]y$/.test(w) && w.length >= 3) item("LLY.Y_FINAL", w, cnt, [w.length - 1, w.length], ["y", "i"], [w.slice(0, -1) + "i"]);
}

const TRAMPAS_S = ["espontáneo", "espontánea", "espontáneos", "espontáneamente", "esplendor", "espléndido", "espléndida", "estrategia", "estrategias", "estratégico", "estratégica", "estricto", "estricta", "estrictamente", "espectáculo", "espectáculos", "espectador", "espectadores", "esparcir", "estrangular", "estrafalario", "estructura", "estructuras", "escéptico", "escéptica", "esplanada", "espiar", "estirpe", "estupendo", "esquema", "escaso", "escasez", "espacio", "especial", "especialmente", "estímulo", "estimular", "esfuerzo", "estricto"];
function otras(w, cnt) {
  // LET.Z_C: ce/ci con z; za/zo/zu con s (seseo)
  for (let i = 0; i < w.length - 1; i++) {
    if (w[i] === "c" && "eiéí".includes(w[i + 1]) && w[i - 1] !== "c" && w[i - 1] !== "s" && w[i - 1] !== "x") item("LET.Z_C", w, cnt, [i, i + 1], ["c", "z"], [swap(w, i, 1, "z")]);
    if (w[i] === "z" && "aouáóú".includes(w[i + 1])) item("LET.Z_C", w, cnt, [i, i + 1], ["z", "s"], [swap(w, i, 1, "s")]);
  }
  // Plural en -ces de singular en -z; pretérito -cé de verbos -zar
  if (w.endsWith("ces") && ex(w.slice(0, -3) + "z")) item("LET.PLURAL_Z", w, cnt, [w.length - 3, w.length - 2], ["c", "z"], [w.slice(0, -3) + "zes"]);
  if (w.endsWith("cé") && ex(w.slice(0, -2) + "zar")) item("LET.PLURAL_Z", w, cnt, [w.length - 2, w.length - 1], ["c", "z"], [w.slice(0, -2) + "zé"]);
  // d / z final
  if (w.length >= 4 && w.endsWith("d")) item("LET.D_Z", w, cnt, [w.length - 1, w.length], ["d", "z"], [w.slice(0, -1) + "z"]);
  if (w.length >= 3 && w.endsWith("z")) item("LET.D_Z", w, cnt, [w.length - 1, w.length], ["z", "d"], [w.slice(0, -1) + "d"]);
  // -cción / -ción / -sión / -xión
  let m;
  if ((m = w.match(/cci(ón|ones)$/))) { const i = m.index; item("LET.CCION", w, cnt, [i, i + 2], ["cc", "c", "x"], [swap(w, i, 2, "c"), swap(w, i, 2, "x")]); }
  else if ((m = w.match(/([aeiouáéíóún])ci(ón|ones)$/))) { const i = m.index + 1; item("LET.CCION", w, cnt, [i, i + 1], ["c", "cc", "s"], [swap(w, i, 1, "cc"), swap(w, i, 1, "s")]); }
  else if ((m = w.match(/si(ón|ones)$/))) { const i = m.index; item("LET.CCION", w, cnt, [i, i + 1], ["s", "c", "x"], [swap(w, i, 1, "c"), swap(w, i, 1, "x")]); }
  else if ((m = w.match(/xi(ón|ones)$/))) { const i = m.index; item("LET.CCION", w, cnt, [i, i + 1], ["x", "cc", "c"], [swap(w, i, 1, "cc"), swap(w, i, 1, "c")]); }
  // x / s
  if (/^ex/.test(w) && w.length >= 5) item("LET.X", w, cnt, [1, 2], ["x", "s"], [swap(w, 1, 1, "s")]);
  if (TRAMPAS_S.includes(w)) item("LET.X", w, cnt, [1, 2], ["s", "x"], [swap(w, 1, 1, "x")]);
  // sc
  if ((m = w.match(/sc[eiéí]/))) item("LET.SC", w, cnt, [m.index, m.index + 2], ["sc", "c", "s"], [swap(w, m.index, 2, "c"), swap(w, m.index, 2, "s")]);
  // r / rr
  if ((m = w.match(/[nls]r/))) item("LET.R_RR", w, cnt, [m.index + 1, m.index + 2], ["r", "rr"], [swap(w, m.index + 1, 1, "rr")]);
  if ((m = w.match(/[aeiouáéíóú]rr[aeiouáéíóú]/))) item("LET.R_RR", w, cnt, [m.index + 1, m.index + 3], ["rr", "r"], [swap(w, m.index + 1, 2, "r")]);
  // c / qu
  if ((m = w.match(/qu[eiéí]/))) item("LET.C_QU", w, cnt, [m.index, m.index + 2], ["qu", "c", "k"], [swap(w, m.index, 2, "c"), swap(w, m.index, 2, "k")]);
}

const MONO_TRAMPA = { fue: "fué", fui: "fuí", dio: "dió", vio: "vió", ti: "tí", fe: "fé", pie: "pié", vi: "ví", di: "dí", guion: "guión", truhan: "truhán", hui: "huí", fie: "fié", da: "dá", va: "vá", ve: "vé", ni: "ní", pues: "pués", bien: "bién" };

// Distractores de tilde ordenados por lo plausibles que son: quitar la
// tilde, ponerla en la otra vocal de la misma sílaba (camíon) o en la
// sílaba de al lado; si no lleva, ponérsela a la tónica (exámen).
function distractoresTilde(w, a) {
  const base = quitarTildes(w);
  const silV = [];
  let pos = 0;
  for (const s of a.silabas) {
    const vs = [];
    for (let k = 0; k < s.length; k++) if ("aeiouáéíóú".includes(s[k].toLowerCase())) {
      const p = s[k - 1], n = s[k + 1];
      if (s[k] === "u" && (p === "q" || p === "g") && n && "eiéí".includes(n)) continue;
      vs.push(pos + k);
    }
    silV.push(vs); pos += s.length;
  }
  const fuerte = (vs) => vs.find((k) => "aeoáéó".includes(base[k])) ?? vs[vs.length - 1];
  const out = [];
  if (a.conTilde) {
    out.push(base);
    const kt = indiceTilde(w);
    for (const k of silV[a.tonica]) if (k !== kt) out.push(tildarEn(base, k));
  } else out.push(tildarEn(base, fuerte(silV[a.tonica])));
  for (const d of [-1, 1]) if (silV[a.tonica + d]?.length) out.push(tildarEn(base, fuerte(silV[a.tonica + d])));
  return [...new Set(out.filter(Boolean))].filter((v) => v !== w && !ex(v)).slice(0, 3);
}
function acentos(w, cnt) {
  if (w.length < 2 && !["ti"].includes(w)) return;
  if (MONO_TRAMPA[w]) { item("ACE.MONOSILABOS", w, cnt, null, null, [MONO_TRAMPA[w]]); return; }
  const a = analizar(w);
  if (!a.coherente || a.interrogativo || a.diacritica || a.silabas.length === 1) return;
  // Si quitar la tilde da otra palabra (esta/está, término/terminó) es un
  // par mínimo: va en frases, no aquí.
  if (a.conTilde && ex(quitarTildes(w))) return;
  const variantes = distractoresTilde(w, a);
  if (!variantes.length) return;
  const fin = w.slice(-1);
  let c;
  if (a.mente) { if (tieneTilde(w)) c = "ACE.MENTE"; else if (cnt > 2) c = "ACE.MENTE"; else return; }
  else if (a.conTilde) {
    if (a.hiato && !a.pide) c = "ACE.HIATO";
    else if (a.tipo === "aguda") c = /[ns]$/.test(w) ? "ACE.AGUDA_NS" : "ACE.AGUDA_VOCAL";
    else if (a.tipo === "llana") c = "ACE.LLANA_CON";
    else c = "ACE.ESDRUJULA";
    // Diptongo en la sílaba tónica: también vale para "dónde va la tilde en un diptongo".
    const ton = a.silabas[a.tonica].toLowerCase();
    if (/[aeoáéó][iu]|[iu][aeoáéó]|iú|uí/.test(ton) && !a.hiato) item("ACE.DIPT_TILDE", w, cnt, null, null, variantes);
  } else {
    if (a.tipo === "aguda" && !/[aeiouns]$/.test(fin) && w.length >= 4) c = "ACE.AGUDA_SIN";
    // Llanas en -n o -s que no son formas verbales ni plurales (examen, joven, crisis)
    else if (a.tipo === "llana" && /(en|on|in|un|is|us)$/.test(w) && !ex(w.slice(0, -1)) && !/(aron|ieron|eron|aban|ían|ran|sen|ren|ais|eis)$/.test(w) && w.length >= 4) c = "ACE.LLANA_SIN";
    else return;
  }
  item(c, w, cnt, null, null, variantes);
}

// ---------------------------------------------------------------- recorrido
for (const [w, cnt] of W) {
  if (!/^[a-záéíóúüñ]+$/.test(w) || !ex(w)) continue;
  if (cnt < 2 && w.length > 12) continue;
  acentos(w, cnt);
  bv(w, cnt);
  h(w, cnt);
  gj(w, cnt);
  lly(w, cnt);
  otras(w, cnt);
}

// ---------------------------------------------------------------- frases
// Frases de prensa (8-24 palabras, sin comillas raras ni cifras sueltas)
// indexadas por palabra, para "caza la falta" con la palabra del ítem.
const frases = [];
const idxFrase = new Map();
const PALABRA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;
for (const s of frasesCorpus) {
  const t = s.t.trim();
  const n = (t.match(PALABRA) || []).length;
  if (n < 8 || n > 24) continue;
  if (/["«»“”|@#\[\]{}<>\/\\]|https?:|\d{3,}|\(|\)/.test(t)) continue;
  if (!/^[A-ZÁÉÍÓÚÑ¿¡]/.test(t) || !/[.!?]$/.test(t)) continue;
  if ([...t.matchAll(PALABRA)].some((m) => VETO.has(m[0].toLowerCase()))) continue;
  frases.push(t);
}
const FR = new Map();
frases.forEach((t, k) => { for (const m of t.matchAll(PALABRA)) { const p = m[0]; if (p === p.toLowerCase()) { if (!FR.has(p)) FR.set(p, []); FR.get(p).push(k); } } });

// ---------------------------------------------------------------- pares mínimos
// término / termino / terminó, está / esta, llegué / llegue: frase real de
// prensa con hueco; las opciones son las formas que existen.
const PAR_MIN = [];
const usadosPM = new Map();
for (const [w, cnt] of W) {
  if (!/^[a-záéíóúñ]+$/.test(w) || w.length < 4 || !ex(w)) continue;
  const base = quitarTildes(w);
  const formas = new Set([base]);
  for (let k = 0; k < base.length; k++) { const v = tildarEn(base, k); if (v) formas.add(v); }
  const validas = [...formas].filter((f) => ex(f) && analizar(f).coherente && (W.get(f) || 0) >= 3);
  if (validas.length < 2 || !validas.includes(w)) continue;
  // Que sea un caso de verbo: alguna forma aguda en -ó/-é o esdrújula/llana con verbo.
  if (!validas.some((f) => /[óé]$/.test(f)) && !(validas.includes("está") || validas.includes("esté"))) continue;
  const clave = base;
  if ((usadosPM.get(clave) || 0) >= 3) continue;
  const ks = (FR.get(w) || []).filter((k) => (frases[k].match(PALABRA) || []).length <= 22);
  if (!ks.length) continue;
  usadosPM.set(clave, (usadosPM.get(clave) || 0) + 1);
  const t = frases[ks[0]];
  const m = new RegExp(`(^|[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ])${w}(?![A-Za-zÁÉÍÓÚÜÑáéíóúüñ])`).exec(t);
  if (!m) continue;
  const q = t.slice(0, m.index + m[1].length) + "___" + t.slice(m.index + m[1].length + w.length);
  const o = validas.sort();
  PAR_MIN.push({ c: "ACE.VERBOS", t: "hueco", d: dificultad(porMillon(cnt)), q, o, a: o.indexOf(w), w, fuente: "prensa" });
  anota("ACE.VERBOS", cnt);
}
PAR_MIN.sort((a, b) => b.o.length - a.o.length || a.d - b.d);

// Límite por competencia: las más frecuentes y una muestra de las raras.
const porComp = {};
for (const it of items) (porComp[it.c] ||= []).push(it);
const MAX = { "BV.MEMORIA": 400, "H.MEMORIA": 250, "GJ.MEMORIA": 250, "LLY.MEMORIA": 250, "LET.Z_C": 250, "ACE.ESDRUJULA": 350, "ACE.AGUDA_NS": 300, "ACE.AGUDA_VOCAL": 300, "ACE.LLANA_CON": 250, "ACE.AGUDA_SIN": 250, "ACE.LLANA_SIN": 250, "ACE.HIATO": 250 };
const finales = [];
const usadas = new Set();
for (const [c, lista] of Object.entries(porComp)) {
  lista.sort((a, b) => b.f - a.f);
  const max = MAX[c] || 160;
  const top = lista.slice(0, Math.ceil(max * 0.7));
  const resto = lista.slice(top.length);
  const paso = Math.max(1, Math.floor(resto.length / Math.max(1, max - top.length)));
  const sel = top.concat(resto.filter((_, i) => i % paso === 0).slice(0, max - top.length));
  for (const it of sel) {
    const fs_ = (FR.get(it.w) || []).slice(0, 3);
    if (fs_.length) { it.s = fs_; fs_.forEach((k) => usadas.add(k)); }
    finales.push(it);
  }
}
// Reindexar frases usadas.
const mapa = new Map();
const frasesOut = [];
for (const k of [...usadas].sort((a, b) => a - b)) { mapa.set(k, frasesOut.length); frasesOut.push(frases[k]); }
for (const it of finales) if (it.s) it.s = it.s.map((k) => mapa.get(k));
finales.forEach((it, i) => (it.id = "p" + i));

// Pesos: apariciones por 100 palabras de prensa.
const pesos = {};
for (const [c, n] of Object.entries(ocurr)) pesos[c] = Math.round((n * 100 / total) * 1000) / 1000;

fs.writeFileSync(path.join(DATOS, "palabras.json"), JSON.stringify(finales));
fs.writeFileSync(path.join(DATOS, "frases.json"), JSON.stringify(frasesOut));
const pm = PAR_MIN.slice(0, 220).map((x, i) => ({ id: "v" + i, ...x }));
fs.writeFileSync(path.join(DATOS, "manual", "pares_minimos.json"), JSON.stringify(pm, null, 0));
console.log("pares mínimos", PAR_MIN.length);
fs.writeFileSync(path.join(DATOS, "pesos.json"), JSON.stringify({ fuente: "Leipzig Corpora Collection spa_news_2023_100K (medios de España), CC BY 4.0", palabras: total, pesos }, null, 1));
const resumen = Object.entries(porComp).map(([c, l]) => `${c}: ${l.length} → ${finales.filter((x) => x.c === c).length} (occ ${pesos[c]})`).sort();
console.log(resumen.join("\n"));
console.log("ítems", finales.length, "frases", frasesOut.length);
