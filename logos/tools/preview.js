// Previsualiza la app Logos en Chromium (Playwright) contra el Supabase real
// y guarda capturas PNG para MIRARLAS antes de dar un diseño por bueno.
//
//   node logos/tools/preview.js                    # captura de «Por decidir»
//   node logos/tools/preview.js filas.json         # añade esas filas (sin guardarlas) arriba del todo
//   node logos/tools/preview.js --tab todos        # otra pestaña (gusta, no_gusta, definitivo, revisar, todos)
//
// Deja las capturas en /tmp/logos-preview/ (una por tarjeta: card-<nº>.png,
// y page.png con la página entera) y falla si hay errores de consola.
// Las filas de un fichero salen con números provisionales P1, P2…
const fs = require("fs"), path = require("path"), http = require("http"), os = require("os");
const { execSync } = require("child_process");
const root = path.resolve(__dirname, "..", "..");
const out = "/tmp/logos-preview";
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "logos-prev-"));
const args = process.argv.slice(2);
const tab = args.includes("--tab") ? args[args.indexOf("--tab") + 1] : "pendiente";
const file = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--tab");
const extra = file ? JSON.parse(fs.readFileSync(file, "utf8")).map((r, i) => ({ id: "00000000-0000-4000-8000-" + String(i).padStart(12, "0"), numero: 100000 + i, version: 1, created_at: new Date().toISOString(), decision: null, ...r, titulo: `[P${i + 1}] ` + r.titulo })) : [];

function playwright() { try { return require("playwright"); } catch {} return require("/opt/node22/lib/node_modules/playwright"); }
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
  const ct = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".css": "text/css", ".woff2": "font/woff2" }[path.extname(f)] || "application/octet-stream";
  res.writeHead(200, { "content-type": ct }); fs.createReadStream(f).pipe(res);
}).listen(0);

(async () => {
  const { chromium } = playwright();
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/ERR_FAILED|fonts\.googleapis|sw\.js/.test(m.text())) errors.push("console: " + m.text()); });
  await page.route("**/supabase-js@2/dist/umd/supabase.js", (r) => r.fulfill({ path: supabaseJs(), contentType: "text/javascript" }));
  await page.route("https://fonts.googleapis.com/**", (r) => r.abort());
  await require("./route.js")(page, dir);
  if (extra.length) {
    await page.route(/logos_disenos\?select=\*/, async (r) => {
      const body = execSync(`bash ${JSON.stringify(path.join(__dirname, "sb.sh"))} GET 'logos_disenos?select=*&order=numero.asc'`).toString();
      r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([...JSON.parse(body), ...extra]) });
    });
  }
  await page.goto(`http://localhost:${server.address().port}/logos/`, { waitUntil: "networkidle" });
  await page.waitForSelector("#view .card, #view .empty, #view .grid", { timeout: 20000 });
  if (tab !== "pendiente") { await page.click(`.tab[data-tab="${tab}"]`); await page.waitForTimeout(300); }
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/page.png`, fullPage: true });
  const cards = await page.$$("#view .card");
  for (const c of cards) {
    const n = await c.$eval(".num", (x) => x.textContent.trim());
    await c.screenshot({ path: `${out}/card-${+n >= 100000 ? "P" + (+n - 99999) : n}.png` });
  }
  // hojas de contacto: 12 tarjetas por imagen (sheet-1.png, sheet-2.png…) para revisarlas de un vistazo
  const imgs = fs.readdirSync(out).filter((f) => f.startsWith("card-")).sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  for (let i = 0; i < imgs.length; i += 12) {
    const html = `<body style="margin:0;display:grid;grid-template-columns:repeat(4,300px);gap:10px;background:#ddd">${imgs.slice(i, i + 12).map((f) => `<div style="background:#fff;height:420px;overflow:hidden"><img src="data:image/png;base64,${fs.readFileSync(path.join(out, f)).toString("base64")}" style="width:300px"></div>`).join("")}</body>`;
    await page.setViewportSize({ width: 1240, height: 800 });
    await page.setContent(html);
    await page.screenshot({ path: `${out}/sheet-${i / 12 + 1}.png`, fullPage: true });
  }
  console.log(`${cards.length} tarjetas capturadas en ${out} (hojas: sheet-*.png)`);
  await browser.close(); server.close();
  if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
})().catch((e) => { console.error(e); process.exit(1); });
