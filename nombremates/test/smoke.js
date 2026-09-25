// Prueba de humo de Nombre Mates en Chromium (Playwright) contra el
// Supabase real. Uso, desde la raíz del repo:
//
//   node nombremates/test/smoke.js
//
// En el entorno de Claude Code en la nube el navegador no verifica la CA
// del proxy para *.supabase.co, así que las llamadas a Supabase se
// encaminan por curl (route.js). Playwright está instalado globalmente.
//
// Decide el primer nombre de la cola como "me gusta" con un comentario,
// comprueba que aparece en la lista y lo deshace, dejando los datos como
// estaban.
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

(async () => {
  const port = server.address().port;
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  await require("./route.js")(page, dir);
  await page.goto(`http://localhost:${port}/nombremates/`, { waitUntil: "networkidle" });
  await page.waitForSelector(".swipe-card, #swipe-area .empty", { timeout: 20000 });
  const cola = () => page.textContent("#cola-count").then((x) => parseInt(x, 10));
  const antes = await cola();
  console.log("por decidir:", antes);
  if (!(await page.locator("#error-banner").isHidden())) throw new Error("banner de error visible");

  if (antes > 0) {
    const nombre = (await page.textContent(".swipe-card .name-text")).trim();
    await page.fill(".swipe-card .nota-input", "prueba automática");
    await page.click(".swipe-card .btn-like");
    await page.waitForFunction((b) => parseInt(document.querySelector("#cola-count").textContent, 10) === b - 1, antes);
    const enLista = await page.locator("#lista-me-gusta .name-text", { hasText: nombre }).count();
    if (!enLista) throw new Error(`${nombre} no aparece en Me gusta`);
    await page.click("#btn-deshacer");
    await page.waitForFunction((b) => parseInt(document.querySelector("#cola-count").textContent, 10) === b, antes);
    const vuelve = (await page.textContent(".swipe-card .name-text")).trim();
    if (vuelve !== nombre) throw new Error(`tras deshacer se esperaba ${nombre} y sale ${vuelve}`);
    console.log("me gusta + comentario + deshacer OK en:", nombre);
  }
  await page.screenshot({ path: path.join(dir, "nombremates.png"), fullPage: true });
  console.log("captura:", path.join(dir, "nombremates.png"));
  if (errors.length) throw new Error(errors.join("\n"));
  await browser.close(); server.close();
  console.log("OK");
})().catch((e) => { console.error("FALLO:", e.message); process.exit(1); });
