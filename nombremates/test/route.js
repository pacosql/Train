// Encamina las llamadas a Supabase por curl (que sí verifica la CA del
// proxy del entorno) y devuelve al navegador el cuerpo y las cabeceras que
// usa la app (Content-Range, para los recuentos exactos).
const { execFileSync } = require("child_process");
const fs = require("fs");
module.exports = async function routeSupabase(page, dir) {
  await page.route("**/*.supabase.co/**", (route) => {
    const req = route.request();
    const args = ["-s", "-X", req.method(), req.url(), "-o", dir + "/body.tmp", "-D", dir + "/head.tmp", "-w", "%{http_code}"];
    const h = req.headers();
    for (const k of ["apikey", "authorization", "content-type", "prefer", "accept", "accept-profile", "content-profile", "x-client-info", "x-upsert", "cache-control"]) if (h[k]) args.push("-H", `${k}: ${h[k]}`);
    const buf = req.postDataBuffer();
    if (buf) { fs.writeFileSync(dir + "/req.tmp", buf); args.push("--data-binary", "@" + dir + "/req.tmp"); }
    const status = parseInt(execFileSync("curl", args).toString(), 10);
    const headers = { "access-control-expose-headers": "content-range" };
    const m = fs.readFileSync(dir + "/head.tmp", "utf8").match(/^content-range:\s*(.+)$/im);
    if (m) headers["content-range"] = m[1].trim();
    route.fulfill({ status, contentType: "application/json", headers, body: fs.readFileSync(dir + "/body.tmp") });
  });
};
