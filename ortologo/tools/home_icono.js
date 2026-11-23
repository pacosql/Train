// Crea una página para añadir un logo a la pantalla de inicio del iPhone
// (Safari → Compartir → Añadir a pantalla de inicio) y verlo como si fuera
// la app instalada:  node ortologo/tools/home_icono.js 1968
// Deja ortologo/home/<nº>/ con index.html y los iconos PNG (a sangre: iOS
// redondea las esquinas solo).
const fs = require("fs"), path = require("path"), { execSync } = require("child_process");
const { chromium } = require("playwright");
const n = +process.argv[2]; if (!n) { console.error("uso: node home_icono.js <nº>"); process.exit(1); }
const d = JSON.parse(execSync(`bash ${JSON.stringify(path.join(__dirname, "sb.sh"))} GET 'ortologo_disenos?select=numero,titulo,svg_marca,colores&numero=eq.${n}'`).toString())[0];
if (!d) { console.error("no existe el nº " + n); process.exit(1); }
const c = d.colores, out = path.join(__dirname, "..", "home", String(n)); fs.mkdirSync(out, { recursive: true });
const svg = d.svg_marca.replace(/(fill|stroke)="currentColor"/g, `$1="${c.icono_tinta}"`).replace(/class="acento"/g, `fill="${c.acento}"`).replace(/class="acento-trazo"/g, `stroke="${c.acento}"`).replace(/class="fondo"/g, `fill="${c.icono_fondo}"`).replace(/class="fondo-trazo"/g, `stroke="${c.icono_fondo}"`);
const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const full = (px) => `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100"><rect width="100" height="100" fill="${c.icono_fondo}"/>${inner}</svg>`;
(async () => {
  const b = await chromium.launch();
  for (const px of [180, 192, 512, 1024]) {
    const p = await b.newPage({ viewport: { width: px, height: px } });
    await p.setContent(`<body style="margin:0">${full(px)}</body>`); await p.screenshot({ path: path.join(out, `icono-${px}.png`) }); await p.close();
  }
  await b.close();
  fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify({ name: "Ortografía10", short_name: "Ortografía10", start_url: "./", scope: "./", display: "standalone", background_color: c.icono_fondo, theme_color: c.icono_fondo,
    icons: [192, 512].map((s) => ({ src: `icono-${s}.png`, sizes: `${s}x${s}`, type: "image/png", purpose: "any" })) }, null, 2));
  fs.writeFileSync(path.join(out, "index.html"), `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Ortografía10</title>
<meta name="apple-mobile-web-app-title" content="Ortografía10">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="${c.icono_fondo}">
<link rel="apple-touch-icon" href="icono-180.png">
<link rel="apple-touch-icon" sizes="180x180" href="icono-180.png">
<link rel="icon" href="icono-192.png">
<link rel="manifest" href="manifest.json">
<link rel="stylesheet" href="../../fonts/poppins.css">
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;background:${c.icono_fondo};color:${c.icono_tinta};font-family:Poppins,system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center}
img{width:132px;height:132px;border-radius:22.5%;box-shadow:0 18px 40px rgba(0,0,0,.25)}h1{font-size:28px;margin:26px 0 8px}p{margin:0 0 6px;opacity:.85;max-width:340px;line-height:1.45}
ol{text-align:left;max-width:340px;line-height:1.5;padding-left:20px;margin:18px 0}.b{font-size:11px;opacity:.5;margin-top:24px}</style></head>
<body><img src="icono-512.png" alt="Ortografía10, propuesta nº ${n}"><h1>Ortografía10</h1><p>Propuesta nº ${n}: así se vería en tu pantalla de inicio.</p>
<ol><li>Abre esta página en <b>Safari</b>.</li><li>Toca <b>Compartir</b> (el cuadrado con la flecha).</li><li>Elige <b>Añadir a pantalla de inicio</b> y luego <b>Añadir</b>.</li></ol>
<p>Al abrirlo desde el icono se ve a pantalla completa, como una app.</p><div class="b">build __BUILD_ID__</div></body></html>
`);
  console.log("ok", out);
})();
