// Hoja de contacto rápida de un fichero de filas (sin tocar Supabase), para
// MIRAR los diseños antes de insertarlos:
//
//   node ortologo/tools/hoja.js filas.json [salida.png]
//
// Por cada fila pinta: icono cuadrado, círculo, favicon 40/20, palabra,
// pegatina y hermano Mates10. Deja la imagen en /tmp/ortologo-hoja.png.
const fs = require("fs");
function playwright() { try { return require("playwright"); } catch {} return require("/opt/node22/lib/node_modules/playwright"); }
const rows = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const out = process.argv[3] || "/tmp/ortologo-hoja.png";
const ic = (r, svg, css) => `<div style="background:${r.colores.icono_fondo};color:${r.colores.icono_tinta};--a:${r.colores.acento};--f:${r.colores.icono_fondo};${css}">${svg || ""}</div>`;
const html = `<style>body{margin:0;font:12px sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:#ccc;padding:8px}
.c{background:#fff;padding:8px}.r{display:flex;gap:8px;align-items:center;margin-top:6px}svg{display:block;width:100%;height:100%}
.acento{fill:var(--a)}.acento-trazo{stroke:var(--a)}.fondo{fill:var(--f)}.fondo-trazo{stroke:var(--f)}.wm svg{height:100%;width:auto}</style>` +
  rows.map((r, i) => `<div class="c"><b>${i + 1}</b> ${r.titulo}<div class="r">
    ${ic(r, r.svg_marca, "width:110px;height:110px;border-radius:22%;overflow:hidden;flex:none")}
    ${ic(r, r.svg_marca, "width:80px;height:80px;border-radius:50%;overflow:hidden;flex:none")}
    ${ic(r, r.svg_favicon || r.svg_marca, "width:40px;height:40px;border-radius:22%;overflow:hidden;flex:none")}
    ${ic(r, r.svg_favicon || r.svg_marca, "width:20px;height:20px;border-radius:22%;overflow:hidden;flex:none")}
    ${r.svg_hermano ? ic(r, r.svg_hermano, "width:60px;height:60px;border-radius:22%;overflow:hidden;flex:none") : ""}
    <div style="width:120px;height:130px;flex:none;background:#e9e7e1;padding:6px;box-sizing:border-box">${r.svg_pegatina || ""}</div></div>
    <div class="wm" style="background:${r.colores.wordmark_fondo};color:${r.colores.wordmark};--a:${r.colores.acento};--f:${r.colores.wordmark_fondo};height:34px;padding:10px;margin-top:6px">${r.svg_wordmark}</div></div>`).join("");
(async () => {
  const { chromium } = playwright();
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1560, height: 900 } });
  await p.setContent(html);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
  console.log(rows.length + " diseños → " + out);
})();
