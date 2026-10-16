// Pruebas del motor de sílabas y tildes: node orto/tools/test_silabas.mjs
import { silabear, analizar, explicarTilde, variantesTilde } from "../js/silabas.js";
const casos = {
  camión: "ca-mión", árbol: "ár-bol", música: "mú-si-ca", país: "pa-ís", ciudad: "ciu-dad", guerra: "gue-rra",
  pingüino: "pin-güi-no", instrumento: "ins-tru-men-to", obstáculo: "obs-tá-cu-lo", caer: "ca-er", leer: "le-er",
  chiita: "chi-i-ta", guion: "guion", huir: "huir", buey: "buey", Paraguay: "Pa-ra-guay", ayer: "a-yer", rey: "rey",
  estoy: "es-toy", examen: "e-xa-men", carretera: "ca-rre-te-ra", llave: "lla-ve", quiero: "quie-ro", averigüéis: "a-ve-ri-güéis",
  atlas: "at-las", construir: "cons-truir", búho: "bú-ho", oído: "o-í-do", héroe: "hé-ro-e", aéreo: "a-é-re-o",
  continuo: "con-ti-nuo", continúo: "con-ti-nú-o", continuó: "con-ti-nuó", reloj: "re-loj", robots: "ro-bots",
  bíceps: "bí-ceps", "dígaselo": "dí-ga-se-lo", ahora: "a-ho-ra", jesuita: "je-sui-ta", Uruguay: "U-ru-guay",
};
let mal = 0;
for (const [w, esp] of Object.entries(casos)) {
  const s = silabear(w).join("-");
  if (s !== esp) { mal++; console.log("SILABAS", w, s, "≠", esp); }
}
const tipos = { camión: "aguda", reloj: "aguda", árbol: "llana", examen: "llana", música: "esdrújula", "dígaselo": "sobresdrújula",
  robots: "aguda", bíceps: "llana", estoy: "aguda", país: "aguda", oído: "llana", búho: "llana", guion: "monosílaba", continúo: "llana", continuo: "llana", continuó: "aguda", jesuita: "llana", construir: "aguda" };
for (const [w, t] of Object.entries(tipos)) { const a = analizar(w); if (a.tipo !== t) { mal++; console.log("TIPO", w, a.tipo, "≠", t); } if (!a.coherente) { mal++; console.log("INCOHERENTE", w, a); } }
for (const w of ["exámen", "relój", "guión", "fué", "jóven", "cámion", "volúmen", "dió", "tí"]) {
  const a = analizar(w); if (a.coherente ) { mal++; console.log("DEBERIA SER INCOHERENTE", w); }
}
for (const w of ["camión", "examen", "país", "reloj", "fue", "rápidamente", "tú", "música", "bíceps", "robots", "cómo"]) console.log(explicarTilde(w));
console.log(variantesTilde("camión"), variantesTilde("examen"), variantesTilde("guerra"));
console.log(mal ? `${mal} FALLOS` : "OK");
process.exit(mal ? 1 : 0);
