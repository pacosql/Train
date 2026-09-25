// Prueba de humo de Nombre Mates en Chromium (Playwright) contra el
// Supabase real. Uso, desde la raíz del repo:
//
//   node nombremates/test/smoke.js
//
// En el entorno de Claude Code en la nube el navegador no verifica la CA
// del proxy para *.supabase.co, así que las llamadas a Supabase se
// encaminan por curl (route.js). Playwright está instalado globalmente.
//
// Marca el primer nombre del lote como 👍 con comentario y el segundo como
// ⭐, pasa al siguiente lote (el resto queda descartado), comprueba las
// listas y deshace el lote, dejando los datos como estaban.
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

let guardado = false; // si la prueba falla tras guardar un lote, se deshace igualmente
let paginaGlobal = null;
(async () => {
  const port = server.address().port;
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  await require("./route.js")(page, dir);
  paginaGlobal = page;
  await page.goto(`http://localhost:${port}/nombremates/`, { waitUntil: "networkidle" });
  await page.waitForSelector(".lote-fila, #lote-area .empty", { timeout: 20000 });
  const cola = () => page.textContent("#cola-count").then((x) => parseInt(x, 10));
  const antes = await cola();
  console.log("por decidir:", antes);
  if (!(await page.locator("#error-banner").isHidden())) throw new Error("banner de error visible");

  if (antes > 0) {
    const filas = page.locator(".lote-fila");
    const n = await filas.count();
    if (n !== Math.min(10, antes)) throw new Error(`se esperaban ${Math.min(10, antes)} filas y hay ${n}`);
    const nombreLike = (await filas.nth(0).locator(".name-text").textContent()).trim();
    const nombreStar = (await filas.nth(1).locator(".name-text").textContent()).trim();
    await filas.nth(0).locator(".marca-like").click();
    await filas.nth(0).locator(".lote-nombre").click();
    await filas.nth(0).locator(".nota-input").fill("prueba automática");
    await filas.nth(1).locator(".marca-star").click();
    await page.click("#btn-siguiente");
    guardado = true;
    await page.waitForFunction((b) => parseInt(document.querySelector("#cola-count").textContent, 10) === b, antes - n);
    if (!(await page.locator("#lista-me-gusta .name-text", { hasText: nombreLike }).count())) throw new Error(`${nombreLike} no está en Me gusta`);
    if (!(await page.locator("#lista-definitivos .name-text", { hasText: nombreStar }).count())) throw new Error(`${nombreStar} no está en Definitivos`);
    const desc = await page.textContent("#count-descartados");
    console.log("lote guardado:", nombreLike, "👍,", nombreStar, "⭐, descartados", desc);
    await page.click("#btn-deshacer");
    await page.waitForFunction((b) => parseInt(document.querySelector("#cola-count").textContent, 10) === b, antes);
    guardado = false;
    const vuelve = (await page.locator(".lote-fila .name-text").first().textContent()).trim();
    if (vuelve !== nombreLike) throw new Error(`tras deshacer se esperaba ${nombreLike} y sale ${vuelve}`);
    console.log("deshacer lote OK");
  }
  await page.screenshot({ path: path.join(dir, "nombremates.png"), fullPage: true });
  console.log("captura:", path.join(dir, "nombremates.png"));
  if (errors.length) throw new Error(errors.join("\n"));
  await browser.close(); server.close();
  console.log("OK");
})().catch(async (e) => {
  console.error("FALLO:", e.message);
  if (guardado && paginaGlobal) {
    try {
      await paginaGlobal.click("#btn-deshacer", { timeout: 10000 });
      await paginaGlobal.waitForTimeout(3000);
      console.error("lote de prueba deshecho tras el fallo");
    } catch (err) {
      console.error("NO se pudo deshacer el lote de prueba:", err.message);
    }
  }
  process.exit(1);
});
