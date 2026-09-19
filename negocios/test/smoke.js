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
  // "última visita" antigua para que todas las fichas cuenten como nuevas y se pueda probar el banner
  await page.addInitScript(() => { try { localStorage.setItem("negocios.ultimaVisita", "2020-01-01T00:00:00.000Z"); } catch {} });
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
    await page.waitForSelector("#motivos.show button[data-m]");
    const motivos = await page.locator("#motivos button[data-m]").count();
    await page.click("#motivos-skip");
    await page.waitForFunction(() => !document.querySelector("#motivos").classList.contains("show"));
    console.log("motivos rápidos OK:", motivos, "opciones");
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
  // vista Explorar: filtros, búsqueda, orden y detalle
  await page.click("#btn-explore");
  await page.waitForSelector("#ex-list .item, #ex-list .empty");
  const total = await t("#ex-count");
  await page.selectOption('select[data-f="venta"]', "desasistida");
  await page.waitForTimeout(100);
  const filtrado = await t("#ex-count");
  await page.fill('input[data-f="q"]', "zzzz-no-existe");
  await page.waitForSelector("#ex-list .empty");
  await page.fill('input[data-f="q"]', "");
  await page.selectOption('select[data-f="sort"]', "claude");
  await page.waitForSelector("#ex-list .item");
  await page.click("#ex-list .item");
  await page.waitForSelector("#back");
  await page.click("#back");
  await page.waitForSelector("#ex-list");
  await page.click("#ex-reset");
  await page.waitForSelector("#ex-list .item");
  console.log("explorar OK:", total, "→ venta desasistida:", filtrado);
  // resumen por sector: tocar un chip filtra; tocarlo otra vez quita el filtro
  const chips = await page.locator('#ex-summary button[data-k="familia"]').count();
  if (chips > 1) {
    await page.locator('#ex-summary button[data-k="familia"]').first().click();
    await page.waitForFunction(() => document.querySelector('#ex-summary button[data-k="familia"].on'));
    const porSector = await t("#ex-count");
    await page.locator('#ex-summary button[data-k="familia"].on').click();
    await page.waitForFunction(() => !document.querySelector('#ex-summary button[data-k="familia"].on'));
    console.log("resumen por sector OK:", chips, "sectores ·", porSector);
  }
  // fichas nuevas: el banner lleva a Explorar filtrado por novedad
  await page.click('.tab[data-tab="pendiente"]');
  await page.waitForSelector("#btn-nuevas");
  const bannerTxt = await t(".nuevas-bar span");
  await page.click("#btn-nuevas");
  await page.waitForSelector("#ex-list .item");
  const soloNuevas = await t("#ex-count");
  await page.click("#ex-reset");
  await page.waitForSelector("#ex-list .item");
  console.log("nuevas OK:", bannerTxt.slice(0, 40), "→", soloNuevas);
  // estado de las rutinas al pie
  await page.waitForSelector("#routines details");
  console.log("rutinas OK:", (await t("#routines summary")).slice(0, 80));
  // comparar: seleccionar 2 fichas y abrir la tabla
  const sels = await page.locator("#ex-list .sel").count();
  if (sels >= 2) {
    await page.locator("#ex-list .sel").nth(0).click();
    await page.locator("#ex-list .sel").nth(1).click();
    await page.waitForSelector("#cmp-go:not([disabled])");
    await page.click("#cmp-go");
    await page.waitForSelector("table.cmp");
    const cols = await page.locator("table.cmp thead th[data-id]").count();
    const filas = await page.locator("table.cmp tbody tr").count();
    await page.screenshot({ path: path.join(dir, "compare.png"), fullPage: true });
    await page.click("table.cmp thead th[data-id]");
    await page.waitForSelector("#btn-reabrir, #btn-gusta");   // detalle de la ficha
    await page.click("#back");                                // vuelve a la tabla
    await page.waitForSelector("table.cmp");
    await page.click("#back");                                // vuelve a Explorar
    await page.waitForSelector("#ex-list");
    await page.click("#cmp-clear");
    await page.waitForFunction(() => !document.querySelector("#cmp-go"));
    console.log("comparar OK:", cols, "columnas,", filas, "filas");
  }
  await page.screenshot({ path: path.join(dir, "smoke.png"), fullPage: true });
  console.log("captura:", path.join(dir, "smoke.png"));
  await browser.close(); server.close();
  if (errors.length) { console.error("ERRORES:", errors); process.exit(1); }
  console.log("smoke OK, sin errores de consola");
})().catch((e) => { console.error("FALLO:", e); process.exit(1); });
