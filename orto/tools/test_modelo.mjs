// Pruebas del modelo (BKT, OrtoScore, escala, prueba de nivel, tutor):
//   node orto/tools/test_modelo.mjs
import fs from "fs";
import * as M from "../js/modelo.js";
const datos = JSON.parse(fs.readFileSync(new URL("../datos/competencias.json", import.meta.url)));
const pesos = JSON.parse(fs.readFileSync(new URL("../datos/pesos.json", import.meta.url)));
const m = M.crearModelo(datos, pesos);
let mal = 0;
const ok = (c, msg) => { if (!c) { mal++; console.log("FALLO:", msg); } };
// BKT: acertar sube, fallar baja, siempre en (0, 1).
for (const p of [0.05, 0.3, 0.5, 0.8, 0.97]) {
  ok(M.actualizar(p, true) > p, `acierto sube desde ${p}`);
  ok(M.actualizar(p, false) < p, `fallo baja desde ${p}`);
  ok(M.actualizar(p, true, 0.03) > M.actualizar(p, true, 0.5), `acertar un dictado pesa más que un sí/no (${p})`);
}
// Puntuación: 0 faltas → 100, 3 → 61, monótona.
ok(M.scoreDeFaltas(0) === 100 && M.scoreDeFaltas(3) === 61, "anclas de la escala");
// Escala creciente por curso y anclas pedidas (3 faltas ≈ 60; 80 ≈ 2º ESO).
const refs = m.referencias.map((r) => r.score);
ok(refs.every((s, i) => !i || s >= refs[i - 1]), "escala creciente " + refs);
ok(m.nivel(80).nombre === "2º ESO", "80 ≈ 2º ESO (sale " + m.nivel(80).nombre + ")");
// Prueba de nivel: todo bien → ≥ 88; todo mal → ≤ 40.
for (const [todo, cond] of [[true, (s) => s >= 88], [false, (s) => s <= 40]]) {
  const esc = M.planPrueba(m); const res = {};
  for (const e of esc) { let sigue = true; while (sigue) { const c = e.lista[e.i]; (res[c.id] ||= []).push(todo); sigue = M.pasoPrueba(e, todo); } }
  const s = m.resumen(M.cerrarPrueba(m, esc, res)).score;
  ok(cond(s), `prueba ${todo ? "perfecta" : "fallada"} → ${s}`);
}
// El tutor siempre propone algo, también con todo dominado.
const todo = Object.fromEntries(m.comps.map((c) => [c.id, 0.99]));
ok(M.elegirCompetencia(m, { dom: todo, ultimo: {} }) != null, "tutor con todo dominado");
ok(M.elegirCompetencia(m, { dom: {}, ultimo: {} }) != null, "tutor sin datos");
// Prerrequisitos válidos y sin ciclos.
const visit = (id, pila = []) => { ok(!pila.includes(id), "ciclo en " + id); for (const p of m.porId[id].pre) visit(p, [...pila, id]); };
m.comps.forEach((c) => visit(c.id));
console.log(mal ? `${mal} FALLOS` : "OK — escala: " + m.referencias.map((r) => `${r.nombre} ${r.score}`).join(", "));
process.exit(mal ? 1 : 0);
