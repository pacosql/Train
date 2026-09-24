// Prueba de humo de Logos en Chromium contra el Supabase real:
//   node logos/test/smoke.js
// Vota «me gusta» en la primera tarjeta, comprueba que se guarda, lo deshace
// (dejando los datos como estaban), abre comentarios y kit y exporta un PNG.
const fs = require("fs"), path = require("path"), http = require("http"), os = require("os");
const { execSync } = require("child_process");
const root = path.resolve(__dirname, "..", "..");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "logos-smoke-"));
const sb = (q) => JSON.parse(execSync(`bash ${path.join(root, "logos/tools/sb.sh")} GET '${q}'`).toString());
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
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/ERR_FAILED|fonts\.googleapis/.test(m.text())) errors.push("console: " + m.text()); });
  await page.route("**/supabase-js@2/dist/umd/supabase.js", (r) => r.fulfill({ path: supabaseJs(), contentType: "text/javascript" }));
  await require("../tools/route.js")(page, dir);
  await page.goto(`http://localhost:${server.address().port}/logos/`, { waitUntil: "networkidle" });
  await page.waitForSelector("#view .card, #view .empty");
  const n = await page.textContent("#n-pendiente");
  console.log("por decidir:", n, "· total:", await page.textContent("#n-todos"));
  const card = page.locator("#view .card").first();
  const id = await card.getAttribute("data-id"), num = await card.locator(".num").textContent();
  await card.locator('.acts button[data-d="gusta"]').click();
  await page.waitForTimeout(1500);
  if (sb(`logos_disenos?select=decision&id=eq.${id}`)[0].decision !== "gusta") throw new Error("no se guardó el me gusta");
  await page.click("#toast-undo");
  await page.waitForTimeout(1500);
  if (sb(`logos_disenos?select=decision&id=eq.${id}`)[0].decision !== null) throw new Error("no se deshizo");
  console.log(`me gusta + deshacer OK en nº ${num}`);
  const c2 = page.locator("#view .card").first();
  await c2.locator('[data-panel="coment"] summary').click();
  await c2.locator("[data-nota]").waitFor();
  await c2.locator('[data-panel="kit"] summary').click();
  const [dl] = await Promise.all([page.waitForEvent("download"), c2.locator('[data-png="sq:512"]').click()]);
  const f = path.join(dir, dl.suggestedFilename()); await dl.saveAs(f);
  console.log("PNG exportado:", dl.suggestedFilename(), fs.statSync(f).size, "bytes");
  fs.copyFileSync(f, "/tmp/logos-export.png");
  await page.click('.tab[data-tab="todos"]'); await page.waitForSelector(".g-item");
  await page.click(".g-item"); await page.waitForSelector("#back");
  console.log("galería + detalle OK");
  await browser.close(); server.close();
  if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
  console.log("OK");
})().catch((e) => { console.error(e); process.exit(1); });
