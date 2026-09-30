// Uso: node shot.js URL salida.png [accion-js]  — captura una página en móvil y muestra errores de consola.
const { chromium } = require("/opt/node22/lib/node_modules/playwright");
(async () => {
  const [url, out, accion] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const p = await b.newPage({ ignoreHTTPSErrors: true, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  // Sirve el repo local en http://app.local/ interceptando peticiones (el proxy no deja pasar loopback).
  const path = require("path"), fs = require("fs");
  const ROOT = path.resolve(__dirname, "../../..");
  await p.route("http://app.local/**", (route) => {
    let f = decodeURIComponent(new URL(route.request().url()).pathname);
    if (f.endsWith("/")) f += "index.html";
    const fp = path.join(ROOT, f);
    if (!fs.existsSync(fp)) return route.fulfill({ status: 404, body: "no" });
    const ext = path.extname(fp).slice(1);
    const ct = { html: "text/html", js: "text/javascript", css: "text/css", json: "application/json", png: "image/png" }[ext] || "application/octet-stream";
    route.fulfill({ status: 200, contentType: ct, body: fs.readFileSync(fp) });
  });
  // El resto de https se reenvía desde Node (NODE_USE_ENV_PROXY=1), más fiable que Chromium con el proxy del entorno.
  await p.route(/^https:/, async (route) => {
    const r = route.request();
    for (let i = 0; i < 4; i++) {
      try {
        const h = { ...r.headers() }; delete h["accept-encoding"];
        const res = await fetch(r.url(), { method: r.method(), headers: h, body: r.postDataBuffer() || undefined });
        const body = Buffer.from(await res.arrayBuffer());
        const hh = Object.fromEntries(res.headers); delete hh["content-encoding"]; delete hh["content-length"];
        hh["access-control-allow-origin"] = "*";
        if (res.status >= 400) console.log("HTTP", res.status, r.url().slice(0, 400), body.toString().slice(0, 300));
        return route.fulfill({ status: res.status, headers: hh, body });
      } catch (e) { await new Promise((z) => setTimeout(z, 500 * (i + 1))); }
    }
    route.abort();
  });
  p.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE:", m.text()); });
  p.on("requestfailed", (r) => console.log("FAILED:", r.method(), r.url().slice(0, 150), r.failure()?.errorText));
  p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
  await p.goto(url, { waitUntil: "load" });
  if (accion) { await eval(`(async()=>{${accion}})()`); await p.waitForTimeout(2500); }
  await p.waitForTimeout(+(process.env.ESPERA||6000));
  console.log((await p.innerText("body")).slice(0, 1500));
  await p.screenshot({ path: out, fullPage: false });
  await b.close();
})();
