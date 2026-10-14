// Prueba de extremo a extremo con Playwright: crea un usuario de prueba,
// hace la prueba de nivel respondiendo al azar, una sesión de práctica,
// abre competencias, juegos, palabras difíciles y escala.
//   node orto/tools/e2e.mjs http://localhost:8765/orto/ [nombre]
import { chromium } from "playwright";
const URL = process.argv[2] || "http://localhost:8765/orto/";
const NOMBRE = process.argv[3] || "__e2e";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" }).catch(() => chromium.launch());
const page = await b.newPage({ viewport: { width: 390, height: 844 } });
const errores = [];
page.on("pageerror", (e) => errores.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errores.push("console: " + m.text()); });
await page.goto(URL + (URL.includes("?") ? "&" : "?") + "debug");
await page.waitForSelector("#nombre");
await page.fill("#nombre", NOMBRE); await page.fill("#edad", "45");
await page.click("#crear");
await page.waitForSelector("#ir"); await page.click("#ir");
const vistos = {};
const vistosShot = new Set();
// Responde lo que haya en pantalla (al azar, a veces bien a propósito).
async function responder() {
  const t = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    if (q(".vocal:not([disabled])")) return "tilde";
    if (q(".pz:not([disabled])")) return "parejas";
    if (q(".tok:not([disabled])")) return "caza";
    if (q(".sil:not([disabled])")) return "tonica";
    if (q("#resp:not([disabled])")) return "dictado";
    if (q(".op:not([disabled])")) return "op";
    return null;
  });
  if (!t) return false;
  vistos[t] = (vistos[t] || 0) + 1;
  const pill = await page.$eval(".pill", (e) => e.textContent).catch(() => "");
  const clave = t + (t === "op" ? "-" + (await page.$eval(".ej", (e) => (e.querySelector(".frase") ? "hueco" : e.querySelector(".hueco") ? "letra" : e.querySelector(".ops.vertical") ? "frase" : "elige"))) : "");
  if (!vistosShot.has(clave) && process.env.SHOTS) { vistosShot.add(clave); await page.screenshot({ path: `${process.env.SHOTS}/m-${clave}.png` }); }
  const ACIERTO = parseFloat(process.env.ACIERTO || "-1");
  if (ACIERTO >= 0 && t !== "parejas") {
    const sol = await page.evaluate(() => { const x = document.querySelector("[data-sol]"); return x ? x.dataset.sol : null; });
    const bien = Math.random() < ACIERTO;
    if (sol != null) {
      if (t === "op") { const ops = await page.$$(".ops[data-sol] .op"); const k = bien ? +sol : (+sol + 1) % ops.length; await ops[k].click(); return true; }
      if (t === "tilde") { if (bien) { +sol === -1 ? await page.click("#sin") : await page.click(`.vocal[data-k="${sol}"]`); } else { +sol === -1 ? await (await page.$$(".vocal"))[0].click() : await page.click("#sin"); } return true; }
      if (t === "caza") { if (bien) { +sol === -1 ? await page.click("#nada") : await page.click(`.tok[data-i="${sol}"]`); } else { +sol === -1 ? await (await page.$$(".tok"))[0].click() : await page.click("#nada"); } return true; }
      if (t === "dictado") { await page.fill("#resp", bien ? sol : sol + "x"); await page.press("#resp", "Enter"); return true; }
      if (t === "tonica") { const s2 = await page.$$(".sil"); await s2[bien ? +sol : (+sol + 1) % s2.length].click(); return true; }
    }
  }
  if (t === "op") { const ops = await page.$$(".op:not([disabled])"); await ops[Math.floor(Math.random() * ops.length)].click(); }
  else if (t === "tilde") { const v = await page.$$(".vocal"); Math.random() < 0.3 ? await page.click("#sin") : await v[Math.floor(Math.random() * v.length)].click(); }
  else if (t === "caza") { Math.random() < 0.3 ? await page.click("#nada") : await (await page.$$(".tok"))[0].click(); }
  else if (t === "tonica") { await (await page.$$(".sil"))[0].click(); }
  else if (t === "dictado") { await page.fill("#resp", "prueva"); await page.press("#resp", "Enter"); }
  else if (t === "parejas") {
    for (let k = 0; k < 6; k++) {
      const z = await page.$(".pz:not([disabled])"); if (!z) break; await z.click();
      for (const d of await page.$$(".pd:not([disabled])")) { await d.click(); if (await z.isDisabled()) break; await z.click(); }
    }
  }
  if (process.env.SHOTS && !vistosShot.has("fb-" + t)) { await page.waitForTimeout(150); if (await page.$(".fb.ko")) { vistosShot.add("fb-" + t); await page.screenshot({ path: `${process.env.SHOTS}/fb-${t}.png`, fullPage: true }); } }
  return true;
}
async function paso() {
  for (const s of ["#sig", "#vale"]) { if (await page.$(s)) { await page.click(s, { timeout: 2000 }).catch(() => {}); return true; } }
  return responder();
}
// Prueba de nivel
for (let i = 0; i < 900 && !(await page.$("#ya")); i++) { await paso(); await page.waitForTimeout(120); }
if (!(await page.$("#ya"))) { console.log("ATASCADO:", (await page.textContent("#app")).slice(0, 400), errores); await page.screenshot({ path: process.env.SHOTS + "/atasco.png" }); process.exit(1); }
const res = await page.textContent(".score-card");
console.log("Resultado prueba:", res.replace(/\s+/g, " ").trim());
await page.screenshot({ path: process.env.SHOTS + "/1-resultado.png", fullPage: true });
// Práctica
await page.click("#ya");
for (let i = 0; i < 300 && !(await page.$("#otra")); i++) { if (!(await paso())) await page.waitForTimeout(150); else await page.waitForTimeout(60); }
console.log("Fin sesión:", (await page.textContent("#app")).replace(/\s+/g, " ").slice(0, 200));
await page.screenshot({ path: process.env.SHOTS + "/2-fin-sesion.png", fullPage: true });
await page.click("#casa");
await page.screenshot({ path: process.env.SHOTS + "/3-casa.png", fullPage: true });
await page.click("#comp"); await page.waitForSelector("details.bloque");
await page.screenshot({ path: process.env.SHOTS + "/4-competencias.png", fullPage: true });
await page.click('tr[data-id="ACE.AGUDA_NS"]'); await page.waitForSelector("#prac");
await page.screenshot({ path: process.env.SHOTS + "/5-ficha.png", fullPage: true });
await page.click("#vol"); await page.click("#casa");
await page.click("#juegos"); await page.click("#j1"); await page.waitForSelector("#txt");
await page.screenshot({ path: process.env.SHOTS + "/6-corrector.png", fullPage: true });
const tks = await page.$$(".tk"); for (const k of [3, 10, 20]) if (tks[k]) await tks[k].click();
await page.click("#fin"); await page.waitForSelector("#otro");
await page.screenshot({ path: process.env.SHOTS + "/7-corrector-fin.png", fullPage: true });
await page.click("#vol"); await page.click("#j4");
for (let i = 0; i < 20 && !(await page.$("#j1")); i++) { await paso(); await page.waitForTimeout(100); }
await page.click("#casa"); await page.click("#dificiles"); await page.waitForSelector(".tabs");
await page.click('.tab[data-t="t3"]');
await page.screenshot({ path: process.env.SHOTS + "/8-dificiles.png", fullPage: true });
await page.click("#casa"); await page.click("#escala"); await page.waitForSelector("table.escala");
await page.screenshot({ path: process.env.SHOTS + "/9-escala.png", fullPage: true });
console.log("mecánicas vistas:", vistos);
console.log(errores.length ? "ERRORES:\n" + errores.join("\n") : "sin errores de consola");
await b.close();
process.exit(errores.length ? 1 : 0);
