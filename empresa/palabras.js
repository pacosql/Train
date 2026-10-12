// 💡 Palabras: generador de ideas. Paco marca palabras sueltas que le
// gustan (o escribe las suyas) y la rutina combina las elegidas para
// proponer nombres (tools/combinar.py). Se proponen de 10 en 10: lo marcado
// 👍 queda en «tus palabras» y el resto pasa a no_me_gusta.
// Usa apiGet / apiPatch / apiPost / enlazarMic / mostrarError de app.js.

const TABLE_PAL = `${CFG.tablePrefix}palabras`;
let lotePal = []; // [{ row, marca }]

function abrirPalabras(abrir) {
  document.getElementById("vista-palabras").hidden = !abrir;
  if (abrir) {
    pararConversacion();
    document.querySelectorAll(".vista-ranking").forEach((v) => { if (v.id !== "vista-palabras") v.hidden = true; });
    document.querySelector(".wrap").hidden = true;
    window.scrollTo(0, 0);
    pintaPalabras();
  } else {
    document.querySelector(".wrap").hidden = false;
  }
}

async function pintaPalabras() {
  try {
    const [elegidas, pendientes] = await Promise.all([
      apiGet(`${TABLE_PAL}?status=eq.me_gusta&select=*&order=decidido_at.desc.nullslast,id.desc`),
      apiGet(`${TABLE_PAL}?status=eq.pendiente&select=*&order=orden.asc.nullslast,id.asc&limit=10`),
    ]);
    pintaElegidas(elegidas);
    lotePal = pendientes.map((row) => ({ row, marca: false }));
    pintaLotePal();
    ocultarError();
  } catch (err) {
    mostrarError(err);
  }
}

function pintaElegidas(elegidas) {
  const cont = document.getElementById("pal-elegidas");
  cont.innerHTML = "";
  document.getElementById("pal-count").textContent = elegidas.length;
  for (const r of elegidas) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "pal-chip";
    chip.title = "Quitar";
    chip.textContent = `${r.palabra} ✕`;
    chip.addEventListener("click", async () => {
      await apiPatch(`${TABLE_PAL}?id=eq.${r.id}`, { status: "no_me_gusta", decidido_at: new Date().toISOString() });
      pintaPalabras();
    });
    cont.appendChild(chip);
  }
  if (!elegidas.length) parrafo(cont, "Todavía ninguna.", "empty");
}

function pintaLotePal() {
  const cont = document.getElementById("pal-lote");
  cont.innerHTML = "";
  if (!lotePal.length) {
    parrafo(cont, "No quedan palabras por proponer: añade las tuyas abajo o espera a la rutina.", "empty");
  }
  lotePal.forEach((it) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "pal-op";
    b.setAttribute("aria-pressed", "false");
    const w = document.createElement("strong");
    w.textContent = it.row.palabra;
    const s = document.createElement("small");
    s.textContent = it.row.significado || "";
    b.append(w, s);
    b.addEventListener("click", () => {
      it.marca = !it.marca;
      b.setAttribute("aria-pressed", String(it.marca));
      pintaBotonPal();
    });
    cont.appendChild(b);
  });
  pintaBotonPal();
}

function pintaBotonPal() {
  const n = lotePal.filter((it) => it.marca).length;
  const btn = document.getElementById("pal-siguiente");
  btn.hidden = !lotePal.length;
  btn.textContent = n ? `Guardar ${n} 👍 y ver 10 más →` : "👎 Ninguna, ver 10 más →";
}

async function siguientePal() {
  const ahora = new Date().toISOString();
  const si = lotePal.filter((it) => it.marca).map((it) => it.row.id);
  const no = lotePal.filter((it) => !it.marca).map((it) => it.row.id);
  try {
    if (si.length) await apiPatch(`${TABLE_PAL}?id=in.(${si.join(",")})`, { status: "me_gusta", decidido_at: ahora });
    if (no.length) await apiPatch(`${TABLE_PAL}?id=in.(${no.join(",")})`, { status: "no_me_gusta", decidido_at: ahora });
    await pintaPalabras();
    window.scrollTo(0, 0);
  } catch (err) {
    mostrarError(err);
  }
}

async function anadirPalabras(ev) {
  ev.preventDefault();
  pararDictado();
  const input = document.getElementById("pal-input");
  // Varias a la vez: «azul, marea y stone» → Azul, Marea, Stone.
  const palabras = input.value.split(/[,;\n]|\sy\s|\sand\s/i).map((p) => p.trim()).filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  if (!palabras.length) return;
  const ahora = new Date().toISOString();
  try {
    for (const palabra of palabras) {
      const ya = await apiGet(`${TABLE_PAL}?palabra=ilike.${encodeURIComponent(palabra)}&select=id`);
      if (ya.length) await apiPatch(`${TABLE_PAL}?id=eq.${ya[0].id}`, { status: "me_gusta", origen: "paco", decidido_at: ahora });
      else await apiPost(TABLE_PAL, [{ palabra, origen: "paco", status: "me_gusta", decidido_at: ahora, significado: "la añadiste tú" }]);
    }
    input.value = "";
    await pintaPalabras();
  } catch (err) {
    mostrarError(err);
  }
}

document.getElementById("btn-palabras").addEventListener("click", () => abrirPalabras(true));
document.getElementById("btn-volver-palabras").addEventListener("click", () => abrirPalabras(false));
document.getElementById("pal-siguiente").addEventListener("click", siguientePal);
document.getElementById("form-palabras").addEventListener("submit", anadirPalabras);
// Abrir otra vista desde la cabecera cierra esta.
for (const id of ["btn-ranking", "btn-buscar", "btn-referencias"]) {
  document.getElementById(id).addEventListener("click", () => { document.getElementById("vista-palabras").hidden = true; });
}
enlazarMic(document.querySelector('[data-mic-for="pal-input"]'), document.getElementById("pal-input"));
