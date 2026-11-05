const { execFileSync } = require("child_process");
const fs = require("fs");
module.exports = async function routeSupabase(page, dir) {
  await page.route("**/*.supabase.co/**", (route) => {
    const req = route.request();
    const args = ["-s", "-X", req.method(), req.url(), "-o", dir + "/body.tmp", "-w", "%{http_code}"];
    const h = req.headers();
    for (const k of ["apikey", "authorization", "content-type", "prefer", "accept", "accept-profile", "content-profile", "x-client-info", "x-upsert", "cache-control"]) if (h[k]) args.push("-H", `${k}: ${h[k]}`);
    const buf = req.postDataBuffer();
    if (buf) { fs.writeFileSync(dir + "/req.tmp", buf); args.push("--data-binary", "@" + dir + "/req.tmp"); }
    const status = parseInt(execFileSync("curl", args).toString(), 10);
    route.fulfill({ status, contentType: "application/json", body: fs.readFileSync(dir + "/body.tmp") });
  });
};
