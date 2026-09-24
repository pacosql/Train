// Generador de diseños para la app Logos (Mates 10).
//
// Convierte "specs" (descripción corta de un logo) en filas listas para
// insertar en logos_disenos. Lo usan la rutina y quien siembre diseños a
// mano:
//
//   node logos/tools/generar.js specs.json > filas.json
//   bash logos/tools/sb.sh POST logos_disenos filas.json
//
// specs.json es un array de objetos:
// {
//   "titulo": "1 inclinado y más alto que la M",      // obligatorio, corto
//   "concepto": "por qué / qué evoca",                // opcional
//   "marca":    [{"t":"M"},{"t":"1","i":1,"a":1,"s":1.2}],   // monograma del icono
//   "favicon":  [{"t":"M"}],                          // opcional: versión simplificada para 16-32 px
//   "wordmark": [{"t":"Mates "},{"t":"1","i":1,"a":1},{"t":"0"}],
//   "peso": 800, "wpeso": 800,                        // peso de marca / wordmark (400-900)
//   "tracking": -0.02, "wtracking": -0.02,            // en em
//   "tam": 0.62,                                      // cuánto ocupa la marca dentro del icono (0-1)
//   "colores": {"icono_fondo":"#141413","icono_tinta":"#FFFFFF","acento":"#2F5FE8","wordmark":"#141413"},
//   "padre": 6, "revision_nota": "He tenido en cuenta…",  // si es versión de otro diseño (nº)
//   "etiquetas": ["m1","inclinado"]
// }
//
// Para ideas que no son solo tipografía (formas, espacio negativo,
// construcciones geométricas…) se puede pasar el SVG directamente en
// "svg_marca" / "svg_favicon" / "svg_wordmark" en vez de piezas. Reglas:
// viewBox="0 0 100 100" en la marca, fill="currentColor" para la tinta,
// class="acento" (relleno) o "acento-trazo" (trazo) para el color de acento,
// class="fondo" para recortar con el color del fondo, sin ids ni <style>,
// y data-fit="marca" si quieres que la app lo centre y escale sola (con
// data-tam="0.6" para el tamaño). El texto dentro, siempre font-family="Poppins".
//
// Cada pieza {t} es un trozo de texto en Poppins con modificadores:
//   i: 1 cursiva · a: 1 color de acento · s: escala (1 = normal)
//   dy: desplazamiento vertical en em (negativo = sube, p. ej. exponente -0.45)
//   dx: separación extra antes de la pieza, en em (negativo = se acerca)
//   r: giro del glifo en grados (positivo = a la derecha) · w: peso propio
//   o: 1 solo contorno (trazo, sin relleno)
// Además hay piezas-forma, que se dibujan como texto para que el ajuste sea
// automático: {"f":"anillo"} (el 0 como anillo pequeño, °), {"f":"barra"} (/),
// {"f":"punto"} (·).
//
// La app encaja automáticamente cada SVG (atributo data-fit) midiendo el
// texto ya renderizado, así que aquí no hace falta calcular anchos.
const fs = require("fs");

const FORMAS = { anillo: "°", barra: "/", punto: "·" };
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function tspans(piezas, base) {
  let prevDy = 0;
  return piezas.map((p) => {
    const txt = p.f ? FORMAS[p.f] || "" : p.t || "";
    const a = [];
    const s = p.s || 1;
    if (s !== 1) a.push(`font-size="${+(base * s).toFixed(2)}"`);
    if (p.i) a.push(`font-style="italic"`);
    if (p.w) a.push(`font-weight="${p.w}"`);
    if (p.a) a.push(p.o ? `class="acento-trazo"` : `class="acento"`);
    if (p.o) a.push(`fill="none" stroke="${p.a ? "" : "currentColor"}" stroke-width="${+(base * 0.05).toFixed(2)}"`.replace(' stroke=""', ""));
    const dy = (p.dy || 0) - prevDy; prevDy = p.dy || 0;
    if (dy) a.push(`dy="${+(dy * base).toFixed(2)}"`);
    if (p.dx) a.push(`dx="${+(p.dx * base).toFixed(2)}"`);
    if (p.r) a.push(`rotate="${[...txt].map(() => p.r).join(" ")}"`);
    return `<tspan ${a.join(" ")}>${esc(txt)}</tspan>`.replace("<tspan >", "<tspan>");
  }).join("");
}

function svgTexto(piezas, { peso = 800, tracking = -0.02, fit, tam }) {
  const base = 40;
  const extra = fit === "marca" && tam ? ` data-tam="${tam}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" data-fit="${fit}"${extra}>` +
    `<text x="50" y="64" text-anchor="middle" font-family="Poppins" font-weight="${peso}" font-size="${base}" letter-spacing="${+(tracking * base).toFixed(2)}" fill="currentColor">` +
    tspans(piezas, base) + `</text></svg>`;
}

function fila(spec) {
  if (!spec.titulo || !(spec.marca || spec.svg_marca) || !(spec.wordmark || spec.svg_wordmark)) throw new Error("spec sin titulo/marca/wordmark: " + JSON.stringify(spec).slice(0, 120));
  const row = {
    titulo: spec.titulo,
    concepto: spec.concepto || null,
    svg_marca: spec.svg_marca || svgTexto(spec.marca, { peso: spec.peso || 800, tracking: spec.tracking ?? -0.02, fit: "marca", tam: spec.tam }),
    svg_favicon: spec.svg_favicon || (spec.favicon ? svgTexto(spec.favicon, { peso: spec.peso || 800, tracking: spec.tracking ?? -0.02, fit: "marca", tam: spec.tam_favicon || 0.7 }) : null),
    svg_wordmark: spec.svg_wordmark || svgTexto(spec.wordmark, { peso: spec.wpeso || spec.peso || 800, tracking: spec.wtracking ?? -0.02, fit: "wordmark" }),
    colores: { icono_fondo: "#141413", icono_tinta: "#FFFFFF", acento: "#2F5FE8", wordmark: "#141413", ...(spec.colores || {}) },
    etiquetas: spec.etiquetas || [],
    origen: spec.origen || "rutina",
    spec,
  };
  if (spec.revision_nota) row.revision_nota = spec.revision_nota;
  if (spec.padre_id) row.padre_id = spec.padre_id;
  if (spec.version) row.version = spec.version;
  return row;
}

if (require.main === module) {
  const specs = JSON.parse(fs.readFileSync(process.argv[2] || 0, "utf8"));
  process.stdout.write(JSON.stringify(specs.map(fila), null, 1));
}
module.exports = { fila };
