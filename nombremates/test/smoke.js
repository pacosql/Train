// Prueba de humo de Nombre Mates en Chromium (Playwright) contra el
// Supabase real, SOLO LECTURA: las escrituras se interceptan (route.js) y
// se comprueba qué se habría enviado, así nunca altera las decisiones del
// usuario. Uso, desde la raíz del repo:
//
//   node nombremates/test/smoke.js
//
// Playwright está instalado globalmente en el entorno de Claude Code.
const fs = require("fs"), path = require("path"), http = require("http"), os = require("os");
const root = path.resolve(__dirname, "..", "..");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "nombremates-smoke-"));

function playwright() {
  try { return require("playwright"); } catch {}
  return require("/opt/node22/lib/node_modules/playwright");
}
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  const ct = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css" }[path.extname(f)] || "application/octet-stream";
  res.writeHead(200, { "content-type": ct }); fs.createReadStream(f).pipe(res);
}).listen(0);
const ok = (cond, msg) => { if (!cond) throw new Error(msg); };

(async () => {
  const port = server.address().port;
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  const escrituras = [];
  await require("./route.js")(page, dir, escrituras);
  // SpeechRecognition falso: window.__oir(texto) simula una frase final.
  await page.addInitScript(() => {
    class FakeRec {
      constructor() { window.__rec = this; }
      start() { this.arrancado = true; }
      stop() { this.arrancado = false; this.onend && this.onend(); }
    }
    window.SpeechRecognition = FakeRec;
    window.__oir = (t) => window.__rec.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: t }], { isFinal: true })] });
  });
  await page.goto(`http://localhost:${port}/nombremates/`, { waitUntil: "networkidle" });

  // Al entrar se elige el modo
  await page.waitForSelector("#elige-modo:not([hidden])");
  ok(await page.locator("#zona-revision").isHidden(), "la revisión no debe verse antes de elegir modo");
  const cola = parseInt(await page.textContent("#cola-count"), 10);
  console.log("por decidir:", cola);
  ok(await page.locator("#error-banner").isHidden(), "banner de error visible");

  // --- De 10 en 10 ---
  await page.click('.btn-modo[data-modo="lote"]');
  await page.waitForSelector(".lote-fila");
  const filas = page.locator(".lote-fila");
  const n = await filas.count();
  ok(n === Math.min(10, cola), `se esperaban ${Math.min(10, cola)} filas y hay ${n}`);
  ok((await page.textContent("#btn-siguiente")).includes(`No me gustan los ${n}`), "botón inicial debe ser «No me gustan los N»");
  await filas.nth(2).locator(".lote-nombre").click();           // toco un nombre…
  await filas.nth(2).locator(".grande-like").click();           // …y le doy a me gusta
  ok((await page.textContent("#btn-siguiente")).includes("Guardar 1"), "el botón debe indicar 1 marcado");
  await filas.nth(2).locator(".grande-like").click();           // desmarcar
  ok((await page.textContent("#btn-siguiente")).includes(`No me gustan los ${n}`), "al desmarcar vuelve a «No me gustan»");
  await filas.nth(2).locator(".grande-like").click();
  await filas.nth(5).locator(".marca-star").click();
  const ids = [];
  await page.click("#btn-siguiente");
  await page.waitForTimeout(1500);
  const patches = escrituras.filter((e) => e.method === "PATCH");
  const cuerpo = (st) => patches.find((p) => JSON.parse(p.body).status === st);
  ok(cuerpo("me_gusta") && cuerpo("favorito") && cuerpo("no_me_gusta"), "faltan PATCH de me_gusta / favorito / no_me_gusta");
  const noIds = cuerpo("no_me_gusta").url.match(/in\.\(([^)]*)\)/)[1].split(",");
  ok(noIds.length === n - 2, `se esperaban ${n - 2} descartes y hay ${noIds.length}`);
  console.log(`lote OK: 1 👍, 1 ⭐, ${noIds.length} 👎 (no enviados, solo lectura)`);

  // --- Numeración y que los 10 quepan en un iPhone (390x844) ---
  await page.waitForTimeout(800);
  const nums = await filas.locator(".lote-num").allTextContents();
  ok(nums.join(",") === Array.from({ length: n }, (_, i) => String(i + 1)).join(","), `numeración 1..${n} incorrecta: ${nums}`);
  const caja = await page.locator("#btn-siguiente").boundingBox();
  ok(caja && caja.y + caja.height <= 844, `el lote no cabe en pantalla: botón termina en ${caja && caja.y + caja.height}`);
  console.log(`caben los ${n} en pantalla (botón termina en ${Math.round(caja.y + caja.height)}px)`);

  // --- Modo conversación ---
  escrituras.length = 0;
  await page.click("#btn-conversacion");
  ok((await page.getAttribute("#btn-conversacion", "aria-pressed")) === "true", "el modo conversación no se ha activado");
  await page.evaluate(() => window.__oir("la 1 y la 3"));
  await page.waitForTimeout(200);
  ok((await page.textContent("#btn-siguiente")).includes("Guardar 2"), "por voz: deberían estar marcados 2");
  await page.evaluate(() => window.__oir("definitiva la 5"));
  await page.waitForTimeout(200);
  ok((await filas.nth(4).getAttribute("class")).includes("star"), "por voz: la 5 debería ser ⭐");
  await page.evaluate(() => window.__oir("quita la 3"));
  await page.waitForTimeout(200);
  ok((await page.textContent("#btn-siguiente")).includes("Guardar 2"), "por voz: tras quitar la 3 deben quedar 2");
  await page.evaluate(() => window.__oir("siguiente"));
  await page.waitForTimeout(1500);
  const pv = escrituras.filter((e) => e.method === "PATCH");
  const cv = (st) => pv.find((p) => JSON.parse(p.body).status === st);
  ok(cv("me_gusta") && cv("favorito") && cv("no_me_gusta"), "por voz: faltan PATCH");
  ok(cv("no_me_gusta").url.match(/in\.\(([^)]*)\)/)[1].split(",").length === n - 2, "por voz: deberían descartarse N-2");
  ok((await page.getAttribute("#btn-conversacion", "aria-pressed")) === "true", "el modo conversación debe seguir activo tras «siguiente»");
  // «ninguna, siguiente» descarta los 10; «parar» cierra el modo
  escrituras.length = 0;
  await page.evaluate(() => window.__oir("ninguna siguiente"));
  await page.waitForTimeout(1500);
  const todos = escrituras.filter((e) => e.method === "PATCH");
  ok(todos.length === 1 && JSON.parse(todos[0].body).status === "no_me_gusta", "«ninguna, siguiente» debe mandar un solo PATCH no_me_gusta");
  await page.evaluate(() => window.__oir("parar"));
  await page.waitForTimeout(600);
  ok((await page.getAttribute("#btn-conversacion", "aria-pressed")) === "false", "«parar» debe cerrar el modo");
  console.log("modo conversación OK (voz simulada, nada enviado)");

  // --- Cambiar a 1 en 1 ---
  escrituras.length = 0;
  await page.click("#btn-cambiar-modo");
  await page.click('.btn-modo[data-modo="uno"]');
  await page.waitForSelector(".swipe-card .name-text");
  const nombre = (await page.textContent(".swipe-card .name-text")).trim();
  await page.fill(".swipe-card .nota-input", "prueba");
  await page.click(".swipe-card .btn-like");
  await page.waitForTimeout(1500);
  const p1 = escrituras.find((e) => e.method === "PATCH");
  ok(p1 && JSON.parse(p1.body).status === "me_gusta" && JSON.parse(p1.body).nota === "prueba", "1 en 1: PATCH me_gusta con nota");
  console.log("1 en 1 OK:", nombre);

  await page.screenshot({ path: path.join(dir, "nombremates.png"), fullPage: true });
  console.log("captura:", path.join(dir, "nombremates.png"));
  if (errors.length) throw new Error(errors.join("\n"));
  await browser.close(); server.close();
  console.log("OK");
})().catch((e) => { console.error("FALLO:", e.message); process.exit(1); });
