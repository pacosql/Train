// Prueba de humo de la app Negocios en Chromium (Playwright) contra el
// Supabase real. Uso, desde la raíz del repo:
//
//   node negocios/test/smoke.js
//
// Particularidades del entorno de Claude Code en la nube:
// - El navegador no llega al CDN de supabase-js ni verifica la CA del
//   proxy para *.supabase.co. Por eso supabase-js se sirve desde una copia
//   local (se descarga de npm la primera vez) y las llamadas a Supabase se
//   encaminan por curl (route.js), que sí verifica TLS.
// - Playwright está instalado globalmente en /opt/node22/lib/node_modules.
//
// La prueba NO crea comentarios ni audios; solo lee, navega, etiqueta una
// ficha y deshace la etiqueta, dejando los datos como estaban.
const fs = require("fs"), path = require("path"), http = require("http"), os = require("os");
const { execSync } = require("child_process");
const root = path.resolve(__dirname, "..", "..");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "negocios-smoke-"));

function playwright() {
  try { return require("playwright"); } catch {}
  return require("/opt/node22/lib/node_modules/playwright");
}
function supabaseJs() {
  const cached = path.join(os.tmpdir(), "supabase-js-umd.js");
  if (!fs.existsSync(cached)) {
    execSync("npm pack @supabase/supabase-js@2 --silent && tar -xzf supabase-supabase-js-*.tgz package/dist/umd/supabase.js", { cwd: dir, stdio: "ignore" });
    fs.copyFileSync(path.join(dir, "package/dist/umd/supabase.js"), cached);
  }
  return cached;
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
  const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/ERR_FAILED|fonts\.googleapis/.test(m.text())) errors.push("console: " + m.text()); });
  await page.route("**/supabase-js@2/dist/umd/supabase.js", (r) => r.fulfill({ path: supabaseJs(), contentType: "text/javascript" }));
  await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await require("./route.js")(page, dir);
  await page.goto(`http://localhost:${port}/negocios/`, { waitUntil: "networkidle" });
  await page.waitForSelector("#view .card, #view .item, #view .empty", { timeout: 20000 });
  const t = async (sel) => ((await page.textContent(sel)) || "").trim();
  const n = (id) => page.textContent("#n-" + id).then((x) => parseInt(x, 10));
  console.log("pendientes:", await n("pendiente"), "gusta:", await n("gusta"), "no:", await n("no_gusta"), "definitivo:", await n("definitivo"));

  // recorrer pestañas
  for (const tab of ["gusta", "no_gusta", "definitivo", "pendiente"]) {
    await page.click(`.tab[data-tab="${tab}"]`);
    await page.waitForSelector("#view .card, #view .item, #view .empty");
  }
  // etiquetar la primera pendiente (si la hay) y deshacer
  if ((await n("pendiente")) > 0) {
    const before = await n("pendiente"), name = await t("h1");
    await page.click("#btn-gusta");
    await page.waitForFunction((b) => parseInt(document.querySelector("#n-pendiente").textContent, 10) === b - 1, before);
    await page.click("#toast-undo");
    await page.waitForFunction((b) => parseInt(document.querySelector("#n-pendiente").textContent, 10) === b, before);
    console.log("etiquetar + deshacer OK en:", name);
  }
  // abrir el detalle de una decidida (si la hay)
  for (const tab of ["gusta", "no_gusta", "definitivo"]) {
    if ((await n(tab)) > 0) {
      await page.click(`.tab[data-tab="${tab}"]`); await page.waitForSelector(".item"); await page.click(".item");
      await page.waitForSelector("#btn-reabrir"); console.log("detalle OK en pestaña", tab); break;
    }
  }
  await page.screenshot({ path: path.join(dir, "smoke.png"), fullPage: true });
  console.log("captura:", path.join(dir, "smoke.png"));
  await browser.close(); server.close();
  if (errors.length) { console.error("ERRORES:", errors); process.exit(1); }
  console.log("smoke OK, sin errores de consola");
})().catch((e) => { console.error("FALLO:", e); process.exit(1); });
