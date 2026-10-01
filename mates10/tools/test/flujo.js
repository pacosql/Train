// Flujo real de la app del alumno: crear alumno, prueba de nivel (responde la 1.ª opción), sesión (2 ejercicios), progreso.
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
const path = require("path"), fs = require("fs");
(async () => {
  const S = process.argv[2];
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const ROOT = path.resolve(__dirname, "../../..");
  await p.route("http://app.local/**", (route) => {
    let f = decodeURIComponent(new URL(route.request().url()).pathname); if (f.endsWith("/")) f += "index.html";
    const fp = path.join(ROOT, f); if (!fs.existsSync(fp)) return route.fulfill({ status: 404, body: "no" });
    const ct = { html: "text/html", js: "text/javascript", css: "text/css", json: "application/json", png: "image/png" }[path.extname(fp).slice(1)] || "application/octet-stream";
    route.fulfill({ status: 200, contentType: ct, body: fs.readFileSync(fp) });
  });
  await p.route(/^https:/, async (route) => {
    const r = route.request();
    for (let i = 0; i < 4; i++) { try { const h = { ...r.headers() }; delete h["accept-encoding"];
      const res = await fetch(r.url(), { method: r.method(), headers: h, body: r.postDataBuffer() || undefined });
      const body = Buffer.from(await res.arrayBuffer()); const hh = Object.fromEntries(res.headers); delete hh["content-encoding"]; delete hh["content-length"]; hh["access-control-allow-origin"] = "*";
      return route.fulfill({ status: res.status, headers: hh, body }); } catch (e) { await new Promise((z) => setTimeout(z, 500)); } }
    route.abort();
  });
  p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  await p.goto("http://app.local/mates10/alumno/");
  await p.waitForSelector("#nombre", { timeout: 20000 });
  await p.fill("#nombre", "Prueba navegador"); await p.click("#crear");
  await p.waitForSelector("#ir", { timeout: 20000 }); await p.click("#ir");
  for (let i = 0; i < 25; i++) {
    const hay = await p.waitForSelector(".op, #c", { timeout: 30000 });
    if (await p.$("#c")) break;
    if (i === 0) await p.screenshot({ path: `${S}/prueba.png` });
    await p.click(".op >> nth=0"); await p.click("#ok"); await p.waitForTimeout(1500);
  }
  await p.screenshot({ path: `${S}/fin_prueba.png` });
  await p.click("#c"); await p.waitForSelector("#jugar"); await p.click("#jugar");
  for (let i = 0; i < 2; i++) {
    await p.waitForSelector(".op", { timeout: 30000 });
    await p.click(".op >> nth=1"); await p.click("#ok"); await p.waitForTimeout(2500);
    await p.screenshot({ path: `${S}/ej${i}.png` });
    const sig = await p.$("#sig, #otra"); if (sig) await sig.click();
    const paso = await p.$("#masPaso"); if (paso) { await paso.click(); await p.screenshot({ path: `${S}/expl.png` }); await p.click("#otra"); }
  }
  console.log("OK", (await p.innerText("body")).slice(0, 300));
  await b.close();
})();
