// Prueba de humo de Nombre Autor en Chromium (Playwright) contra el Supabase
// real, SOLO LECTURA: las escrituras se interceptan (route.js) y se comprueba
// qué se habría enviado. Uso, desde la raíz del repo:
//
//   node autor/test/smoke.js [carpeta-capturas]
const fs = require("fs"), path = require("path"), http = require("http"), os = require("os");
const root = path.resolve(__dirname, "..", "..");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "autor-smoke-"));
const capturas = process.argv[2];

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
  const page = await (await browser.newContext({ viewport: { width: 390, height: 780 } })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/favicon|fonts/.test(m.text())) errors.push("console: " + m.text()); });
  const escrituras = [];
  await require("./route.js")(page, dir, escrituras);
  await page.goto(`http://localhost:${port}/autor/`);
  await page.waitForFunction(() => /^\d+$/.test(document.getElementById("cola-count").textContent));
  const quedan = Number(await page.textContent("#cola-count"));
  ok(quedan > 0, "cola vacía");

  // De 1 en 1: nombre, dominio, ficha y relación con la ortografía.
  await page.click('[data-modo="uno"]');
  await page.waitForSelector(".swipe-card .name-text");
  const nombre = await page.textContent(".swipe-card .name-text");
  const dom = await page.textContent(".swipe-card .dominio");
  ok(/\.com libre/.test(dom), "sin dominio: " + dom);
  ok((await page.textContent(".swipe-card .porque")).length > 20, "sin ficha");
  ok(/Ortografía:/.test(await page.textContent(".swipe-card .orto")), "sin ortografía");
  if (capturas) await page.screenshot({ path: path.join(capturas, "autor-uno.png"), fullPage: false });
  await page.click(".swipe-card .btn-like");
  await page.waitForFunction(() => true);
  await page.waitForTimeout(800);
  ok(escrituras.some((e) => e.method === "PATCH" && /"status":"me_gusta"/.test(e.body)), "el 👍 no mandó PATCH");

  // De 10 en 10.
  await page.click("#btn-cambiar-modo");
  await page.click('[data-modo="lote"]');
  await page.waitForSelector("#lote-area .lote-fila");
  const filas = await page.$$eval("#lote-area .lote-fila .name-text", (els) => els.map((e) => e.textContent));
  ok(filas.length === 10, "el lote no tiene 10: " + filas.length);
  ok((await page.textContent("#lote-area .lote-sub")).length > 3, "sin subtítulo en el lote");
  if (capturas) await page.screenshot({ path: path.join(capturas, "autor-lote.png"), fullPage: false });
  await page.click("#lote-area .lote-fila:nth-child(2) .marca-star");
  await page.click("#btn-siguiente");
  await page.waitForTimeout(1000);
  ok(escrituras.some((e) => /"status":"favorito"/.test(e.body)), "⭐ no guardado");
  ok(escrituras.some((e) => /"status":"no_me_gusta"/.test(e.body)), "resto no descartado");

  // Buscador.
  await page.click("#btn-atras-lote");
  await page.click("#btn-buscar");
  await page.fill("#input-buscar", "dulcinea");
  await page.click('#form-buscar button[type="submit"]');
  await page.waitForSelector("#resultado-buscar .res-caja");
  const res = await page.textContent("#resultado-buscar");
  ok(/Dulcinea/.test(res), "buscador no encuentra Dulcinea: " + res.slice(0, 200));
  if (capturas) await page.screenshot({ path: path.join(capturas, "autor-buscar.png"), fullPage: false });

  ok(errors.length === 0, "errores: " + errors.join(" | "));
  console.log(`OK · ${quedan} por decidir · primero: ${nombre} (${dom}) · lote: ${filas.join(", ")} · ${escrituras.length} escrituras interceptadas`);
  await browser.close(); server.close();
})().catch((e) => { console.error("FALLO:", e.message); process.exit(1); });
