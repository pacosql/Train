// Valida el banco completo de Orto: node orto/tools/validar.mjs
// Esquema de cada tipo, respuesta correcta que existe, distractores de
// palabras que NO existen, competencias con ejercicios y motor coherente.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { existe } from "./diccionario.mjs";
import { analizar } from "../js/silabas.js";
const D = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "datos");
const comp = JSON.parse(fs.readFileSync(path.join(D, "competencias.json")));
const ids = new Set(comp.competencias.map((c) => c.id));
const err = [], avisos = [];
const cuenta = {};
const palabras = JSON.parse(fs.readFileSync(path.join(D, "palabras.json")));
for (const it of palabras) {
  cuenta[it.c] = (cuenta[it.c] || 0) + 1;
  if (!ids.has(it.c)) err.push(`palabra ${it.w}: competencia ${it.c}`);
  if (!existe(it.w)) err.push(`palabra ${it.w}: no existe`);
  for (const a of it.alts) if (existe(a)) err.push(`palabra ${it.w}: distractor ${a} existe`);
  if (it.g) { const [i, j] = it.g; if (it.w.slice(i, j) !== it.op[0]) err.push(`palabra ${it.w}: hueco ${it.g} ≠ ${it.op[0]}`); }
  if (it.c.startsWith("ACE.") && !analizar(it.w).coherente) err.push(`palabra ${it.w}: motor incoherente`);
}
const PAL = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/g;
for (const f of fs.readdirSync(path.join(D, "manual"))) {
  const lista = JSON.parse(fs.readFileSync(path.join(D, "manual", f)));
  lista.forEach((it, k) => {
    const id = `${f}#${k}`;
    cuenta[it.c] = (cuenta[it.c] || 0) + 1;
    if (!ids.has(it.c)) err.push(`${id}: competencia ${it.c}`);
    if (![1, 2, 3].includes(it.d)) err.push(`${id}: d`);
    if (["hueco", "elige", "frase"].includes(it.t)) {
      if (!Array.isArray(it.o) || it.o.length < 2 || it.o.length > 4) err.push(`${id}: opciones`);
      if (!(it.a >= 0 && it.a < it.o.length)) err.push(`${id}: a fuera de rango`);
      if (new Set(it.o).size !== it.o.length) err.push(`${id}: opciones repetidas`);
      if (it.w && it.w !== it.o[it.a]) err.push(`${id}: w ≠ o[a]`);
    }
    if (it.t === "hueco" && it.q.split("___").length !== 2) err.push(`${id}: hueco sin ___ único`);
    if (it.t === "caza") {
      if (it.mal) {
        const n = it.mal.includes(" ") ? it.q.split(it.mal).length - 1 : [...it.q.matchAll(PAL)].filter((m) => m[0] === it.mal).length;
        if (n !== 1) err.push(`${id}: «${it.mal}» aparece ${n} veces`);
        if (!it.bien) err.push(`${id}: falta bien`);
      }
    }
    if (it.t === "parejas" && !(it.pares?.length >= 3)) err.push(`${id}: pares`);
    if (!["hueco", "elige", "frase", "caza", "parejas"].includes(it.t)) err.push(`${id}: tipo ${it.t}`);
    if (it.t !== "parejas" && !it.x && it.fuente !== "prensa") avisos.push(`${id}: sin explicación`);
  });
}
const BASE = ["ACE.SILABAS", "ACE.TONICA", "ACE.CLASIFICA", "ACE.DIPTONGO"];
for (const c of comp.competencias) if (!cuenta[c.id] && !BASE.includes(c.id)) err.push(`competencia sin ejercicios: ${c.id}`);
const total = Object.values(cuenta).reduce((a, b) => a + b, 0);
console.log(`${total} ejercicios en ${Object.keys(cuenta).length} competencias (+${BASE.length} generadas al momento)`);
console.log(Object.entries(cuenta).sort().map(([k, v]) => `${k} ${v}`).join(" · "));
if (avisos.length) console.log(`${avisos.length} avisos, p. ej.:`, avisos.slice(0, 5));
if (err.length) { console.log(`${err.length} ERRORES:`); console.log(err.slice(0, 40).join("\n")); process.exit(1); }
console.log("OK");
