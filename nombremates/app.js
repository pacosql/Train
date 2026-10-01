// Nombre Mates — buscador de nombres para una app de matemáticas para
// niños en España (sucesora de la idea "mates10.com").
//
// Todo nombre que llega a "pendiente" ya viene vetado desde fuera:
// .com libre comprobado vía RDAP de Verisign + cribado de notoriedad
// (App Store España, Wikipedia es/en, .net/.org registrados). Este
// front-end nunca lanza esa comprobación: solo pinta lo que ya viene
// verificado y recoge decisiones y comentarios.
//
// Al entrar se elige revisar de 1 en 1 o de 10 en 10 (numerados; con el
// modo conversación se dicen los números y «siguiente»). En lotes, lo
// marcado 👍/⭐ queda como me_gusta / favorito y el resto pasa a
// no_me_gusta con un solo botón. Comentario opcional por nombre
// (escrito o dictado por voz) que alimenta la siguiente tanda.
// Los comentarios generales van a nombremates_sugerencias.

const CFG = window.NOMBREMATES_CONFIG;
const REST = `${CFG.url}/rest/v1`;
const TABLE = `${CFG.tablePrefix}ideas`;
const TABLE_SUG = `${CFG.tablePrefix}sugerencias`;

const HEADERS = {
  apikey: CFG.anonKey,
  Authorization: `Bearer ${CFG.anonKey}`,
  "Content-Type": "application/json",
};

const dominio = (row) => `${row.nombre.toLowerCase()}.com`;

const officialLinks = (row) => [
  { label: "OEPM · marcas (España)", url: "https://consultas2.oepm.es/LocalizadorWeb/" },
  { label: "EUIPO · marcas UE", url: `https://www.tmdn.org/tmview/#/tmview/results?page=1&pageSize=30&criteria=C&basicSearch=${encodeURIComponent(row.nombre)}` },
  { label: `Comprar ${dominio(row)}`, url: `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(dominio(row))}` },
  { label: `Buscar "${row.nombre}" en Google`, url: `https://www.google.com/search?q=%22${encodeURIComponent(row.nombre)}%22` },
];

let cola = [];
let gustados = []; // me_gusta + favorito, para el ranking de marca
let ultimaDecision = null; // [{ id, notaAnterior }] del último lote, para deshacer
let ocupado = false; // evita que un doble toque mande dos decisiones

// ---- REST ----

async function apiGet(path) {
  const res = await fetch(`${REST}/${path}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.json();
}

async function apiPatch(path, fields) {
  const res = await fetch(`${REST}/${path}`, {
    method: "PATCH",
    headers: { ...HEADERS, Prefer: "return=minimal" },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status}`);
}

async function apiPost(path, body) {
  const res = await fetch(`${REST}/${path}`, {
    method: "POST",
    headers: { ...HEADERS, Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}`);
}

// PostgREST devuelve como mucho 1000 filas por consulta: se piden solo las
// que se pintan y el total se saca con un recuento exacto (Content-Range).
async function fetchIdeas(status, orden = "id.asc", limite = 1000) {
  const path = `${TABLE}?status=eq.${status}&order=${orden}&select=*&limit=${limite}`;
  const res = await fetch(`${REST}/${path}`, { headers: { ...HEADERS, Prefer: "count=exact" } });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  const filas = await res.json();
  const total = parseInt((res.headers.get("content-range") || "").split("/")[1], 10);
  filas.total = Number.isFinite(total) ? total : filas.length;
  return filas;
}

// ---- Dictado por voz (Web Speech API) ----
//
// Convierte la voz en texto dentro del propio campo, así el comentario
// llega a la base de datos como texto que se puede revisar. Si el
// navegador no lo soporta, el botón se oculta y queda el micro del
// teclado del móvil, que hace lo mismo.

const Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
let dictadoActivo = null; // { rec, btn }

function pararDictado() {
  if (!dictadoActivo) return;
  try {
    dictadoActivo.rec.stop();
  } catch {}
  dictadoActivo.btn.classList.remove("escuchando");
  dictadoActivo = null;
}

function enlazarMic(btn, campo) {
  if (!Reconocimiento) {
    btn.hidden = true;
    return;
  }
  btn.addEventListener("click", () => {
    if (dictadoActivo && dictadoActivo.btn === btn) {
      pararDictado();
      return;
    }
    pararDictado();
    pararConversacion();
    const rec = new Reconocimiento();
    rec.lang = "es-ES";
    rec.continuous = true;
    rec.interimResults = true;
    const base = campo.value.trim();
    let finales = "";
    rec.onresult = (ev) => {
      let provisional = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) finales += t;
        else provisional += t;
      }
      campo.value = [base, (finales + provisional).trim()].filter(Boolean).join(" ");
    };
    rec.onerror = (ev) => {
      if (ev.error === "not-allowed") alert("Sin permiso de micrófono. Usa el micro del teclado.");
      pararDictado();
    };
    rec.onend = () => {
      if (dictadoActivo && dictadoActivo.rec === rec) pararDictado();
    };
    dictadoActivo = { rec, btn };
    btn.classList.add("escuchando");
    rec.start();
  });
}


// ---- Modo conversación (lotes de 10 sin tocar la pantalla) ----
//
// Escucha en continuo y entiende frases como «la 1 y la 3, siguiente»:
// los números dichos se marcan 👍 (⭐ si van tras «definitiva/estrella»),
// «ninguna» desmarca todo, «siguiente» guarda el lote y trae el siguiente,
// «deshacer» recupera el último lote y «parar» cierra el modo. Safari en
// iPhone corta el reconocimiento cada poco: se rearranca solo mientras el
// modo esté activo.

let conversacion = null; // { rec, parando }

const PALABRAS_NUM = {
  un: 1, uno: 1, una: 1, primera: 1, primero: 1,
  dos: 2, segunda: 2, segundo: 2,
  tres: 3, tercera: 3, tercero: 3,
  cuatro: 4, cuarta: 4, cuarto: 4,
  cinco: 5, quinta: 5, quinto: 5,
  seis: 6, sexta: 6, sexto: 6,
  siete: 7, septima: 7, septimo: 7,
  ocho: 8, octava: 8, octavo: 8,
  nueve: 9, novena: 9, noveno: 9,
  diez: 10, decima: 10, decimo: 10,
};

function convEstado(texto, aviso = false) {
  const el = document.getElementById("conv-estado");
  el.textContent = texto;
  el.classList.toggle("aviso", aviso);
  el.hidden = !conversacion && !aviso;
}

// Devuelve { marcas: Map(num -> "me_gusta"|"favorito"|null), ninguna, todas, siguiente, deshacer, parar }
function interpretaFrase(frase) {
  const limpio = frase
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ");
  const orden = { marcas: new Map(), ninguna: false, todas: false, siguiente: false, deshacer: false, parar: false, entendido: false };
  let modoMarca = "me_gusta";
  for (const tok of limpio.split(/\s+/).filter(Boolean)) {
    let nums = [];
    if (/^\d+$/.test(tok)) {
      const v = Number(tok);
      if (v >= 1 && v <= 10) nums = [v];
      // «1 y 3» a veces llega como «13»: si son cifras del 1 al 9, las separo
      else if (v > 10 && !tok.includes("0")) nums = tok.split("").map(Number);
    } else if (PALABRAS_NUM[tok]) {
      nums = [PALABRAS_NUM[tok]];
    } else if (/^(definitiv\w*|estrella\w*|favorit\w*|fija\w*)$/.test(tok)) {
      modoMarca = "favorito";
    } else if (/^(quita\w*|desmarca\w*|no)$/.test(tok)) {
      modoMarca = null;
    } else if (/^(gusta\w*|marca\w*)$/.test(tok)) {
      if (modoMarca === null) modoMarca = "me_gusta";
    } else if (/^(ningun\w*|nada)$/.test(tok)) {
      orden.ninguna = true; orden.entendido = true;
    } else if (/^tod[ao]s$/.test(tok)) {
      orden.todas = true; orden.entendido = true;
    } else if (/^(siguiente\w*|pasa\w*|vale|listo)$/.test(tok)) {
      orden.siguiente = true; orden.entendido = true;
    } else if (/^(deshacer|deshaz|atras|vuelve)$/.test(tok)) {
      orden.deshacer = true; orden.entendido = true;
    } else if (/^(parar|stop|apaga\w*|termina\w*|cierra\w*)$/.test(tok)) {
      orden.parar = true; orden.entendido = true;
    }
    for (const n of nums) { orden.marcas.set(n, modoMarca); orden.entendido = true; }
  }
  return orden;
}

async function ejecutaFrase(frase) {
  const o = interpretaFrase(frase);
  if (!o.entendido) {
    convEstado(`No he entendido «${frase.trim()}». Di p. ej. «la 1 y la 3, siguiente».`, true);
    return;
  }
  if (o.parar) { pararConversacion(); return; }
  if (o.deshacer) { convEstado("Deshaciendo el último lote…"); await deshacer(); return; }
  if (o.ninguna) for (const it of lote) it.marcar(null);
  if (o.todas) for (const it of lote) it.marcar("me_gusta");
  const resumen = [];
  for (const [n, m] of o.marcas) {
    const it = lote[n - 1];
    if (!it) { resumen.push(`${n}?`); continue; }
    it.marcar(m);
    resumen.push(m === "favorito" ? `⭐${n}` : m === "me_gusta" ? `👍${n}` : `✕${n}`);
  }
  const marcados = lote.filter((it) => it.marca).length;
  if (o.siguiente) {
    if (ocupado) { convEstado("Espera, todavía guardando el lote anterior…", true); return; }
    convEstado(`Guardando: ${marcados} 👍/⭐ y ${lote.length - marcados} 👎…`);
    await siguienteLote();
  } else {
    convEstado(`Oído: ${resumen.join(" ") || (o.ninguna ? "ninguna" : "todas")} · ${marcados} marcados`);
  }
}

function iniciarConversacion() {
  if (!Reconocimiento || conversacion) return;
  pararDictado();
  const rec = new Reconocimiento();
  rec.lang = "es-ES";
  rec.continuous = true;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  let pendiente = Promise.resolve();
  rec.onresult = (ev) => {
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      if (!ev.results[i].isFinal) continue;
      const frase = ev.results[i][0].transcript;
      pendiente = pendiente.then(() => ejecutaFrase(frase)).catch(mostrarError);
    }
  };
  rec.onerror = (ev) => {
    if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
      pararConversacion();
      convEstado("Sin permiso de micrófono: actívalo en los ajustes del navegador.", true);
    }
    // «no-speech», «network», «aborted»… → onend rearranca solo
  };
  rec.onend = () => {
    if (!conversacion || conversacion.rec !== rec || conversacion.parando) return;
    setTimeout(() => {
      if (!conversacion || conversacion.rec !== rec || conversacion.parando) return;
      try { rec.start(); } catch { pararConversacion(); convEstado("El micrófono se ha cerrado. Vuelve a activar el modo conversación.", true); }
    }, 300);
  };
  conversacion = { rec, parando: false };
  const btn = document.getElementById("btn-conversacion");
  btn.setAttribute("aria-pressed", "true");
  btn.textContent = "🔴 parar";
  document.body.classList.add("conversando");
  document.getElementById("modo-lote").scrollTop = 0; // el botón está debajo: se vuelve arriba a ver los 10
  pintaBotonLote();
  ajustaNombresLote();
  convEstado("Escuchando. Di p. ej. «el 3 y el 5, siguiente».");
  try { rec.start(); } catch (err) { pararConversacion(); mostrarError(err); }
}

function pararConversacion() {
  if (!conversacion) return;
  conversacion.parando = true;
  try { conversacion.rec.stop(); } catch {}
  conversacion = null;
  const btn = document.getElementById("btn-conversacion");
  btn.setAttribute("aria-pressed", "false");
  btn.textContent = "🎙️ Conversación";
  document.body.classList.remove("conversando");
  pintaBotonLote();
  ajustaNombresLote();
  const el = document.getElementById("conv-estado");
  el.hidden = true;
  el.classList.remove("aviso");
}

function alternarConversacion() {
  if (conversacion) pararConversacion();
  else iniciarConversacion();
}

// ---- Errores visibles ----

function mostrarError(err) {
  document.getElementById("error-texto").textContent =
    `No se pudo conectar con la base de datos (${err.message}).`;
  document.getElementById("error-banner").hidden = false;
}

function ocultarError() {
  document.getElementById("error-banner").hidden = true;
}

// ---- Pintado ----

function renderChecks(container, row) {
  container.innerHTML = "";
  const fecha = row.dominio_comprobado_at
    ? new Date(row.dominio_comprobado_at).toLocaleDateString("es-ES")
    : "";
  const filas = [
    row.com_libre === true
      ? ["ok", `${dominio(row)}: libre (verificado ${fecha})`]
      : ["bad", `${dominio(row)}: no verificado`],
  ];
  if (row.otros_tld) filas.push([row.otros_tld.includes("ocupado") ? "warn" : "ok", row.otros_tld]);
  for (const [estado, texto] of filas) {
    const fila = document.createElement("div");
    fila.className = "check-row";
    const punto = document.createElement("span");
    punto.className = `dot ${estado}`;
    fila.appendChild(punto);
    const span = document.createElement("span");
    span.textContent = texto;
    fila.appendChild(span);
    container.appendChild(fila);
  }
}

function pintaPorque(el, row) {
  if (!row.porque) {
    el.remove();
    return;
  }
  el.textContent = row.porque;
}

function renderColision(container, row) {
  if (row.status === "vetado" && row.veto_motivo) {
    container.textContent = `🚫 Vetado: ${row.veto_motivo}`;
    return;
  }
  container.textContent = row.colision_detalle
    ? `🔎 Notoriedad: ${row.colision_detalle}`
    : "🔎 Notoriedad: sin detalle registrado.";
}

// ---- Modo de revisión: de 1 en 1 o de 10 en 10 ----
//
// Al entrar se pregunta siempre; se puede cambiar en cualquier momento.

let modo = null; // "uno" | "lote"

function eligeModo(m) {
  modo = m;
  document.getElementById("elige-modo").hidden = m !== null;
  document.getElementById("zona-revision").hidden = m === null;
  document.getElementById("modo-uno").hidden = m !== "uno";
  document.getElementById("modo-lote").hidden = m !== "lote";
  document.getElementById("modo-texto").textContent = m === "uno" ? "Revisando de 1 en 1" : "Revisando de 10 en 10";
  document.body.classList.toggle("en-lote", m === "lote");
  document.getElementById("btn-conversacion").hidden = m !== "lote" || !Reconocimiento;
  if (m !== "lote") pararConversacion();
  // En el lote el «deshacer» va en la barra de arriba (pantalla completa, sin scroll).
  const deshacerBtn = document.getElementById("btn-deshacer");
  (m === "lote" ? document.getElementById("hueco-deshacer") : document.querySelector(".undo-row")).appendChild(deshacerBtn);
  if (m) pintaRevision();
  else window.scrollTo(0, 0);
}

function pintaRevision() {
  document.getElementById("cola-count").textContent = cola.total ?? cola.length;
  document.getElementById("lote-quedan").textContent = cola.total ?? cola.length;
  if (modo === "uno") pintaUno();
  else if (modo === "lote") pintaLote();
}

function pintaUno() {
  pararDictado();
  const area = document.getElementById("swipe-area");
  area.innerHTML = "";
  if (cola.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "No quedan nombres por decidir. Déjame un comentario aquí abajo y te busco otra tanda.";
    area.appendChild(p);
    return;
  }
  const item = cola[0];
  const node = document.getElementById("tpl-swipe-card").content.cloneNode(true);
  const tag = node.querySelector(".metodo-tag");
  if (item.metodo) tag.textContent = item.metodo;
  else tag.remove();
  node.querySelector(".name-text").textContent = item.nombre;
  { const ps = pastillaScore(item); if (ps) node.querySelector(".name-text").after(ps); }
  node.querySelector(".dominio").textContent = `${dominio(item)} libre`;
  pintaPorque(node.querySelector(".porque"), item);
  { const ts = textoScore(item); if (ts) { const p = document.createElement("p"); p.className = "marca-score"; p.textContent = ts; node.querySelector(".porque").after(p); } }
  if (item.medidas) node.querySelector(".nota-row").before(bloqueMedidas(item.medidas));
  renderChecks(node.querySelector(".checks"), item);
  renderColision(node.querySelector(".colision-info"), item);
  const notaInput = node.querySelector(".nota-input");
  enlazarMic(node.querySelector(".btn-mic"), notaInput);
  const botones = [...node.querySelectorAll(".swipe-actions button")];

  const decidir = (status) => async () => {
    if (ocupado) return;
    pararDictado();
    ocupado = true;
    botones.forEach((b) => (b.disabled = true));
    try {
      await apiPatch(`${TABLE}?id=eq.${item.id}`, {
        status,
        nota: notaInput.value.trim() || item.nota || null,
        decidido_at: new Date().toISOString(),
      });
      ultimaDecision = [{ id: item.id, notaAnterior: item.nota ?? null }];
      ocultarError();
      await recargarTodo();
    } catch (err) {
      mostrarError(err);
      botones.forEach((b) => (b.disabled = false));
    } finally {
      ocupado = false;
    }
  };
  node.querySelector(".btn-dislike").addEventListener("click", decidir("no_me_gusta"));
  node.querySelector(".btn-star").addEventListener("click", decidir("favorito"));
  node.querySelector(".btn-like").addEventListener("click", decidir("me_gusta"));
  area.appendChild(node);
}

// ---- Lote de 10 ----
//
// Se revisan de 10 en 10: lo que se marque 👍/⭐ se guarda como
// me_gusta/favorito y el resto pasa a no_me_gusta al pulsar "Siguiente".

const TAM_LOTE = 10;
let lote = []; // [{ row, num, marca: null|"me_gusta"|"favorito", campo, marcar }]
let pintaBotonLote = () => {}; // repinta el texto del botón «siguiente» del lote actual

function pintaLote() {
  pararDictado();
  const area = document.getElementById("lote-area");
  area.innerHTML = "";
  lote = [];
  const btn = document.getElementById("btn-siguiente");

  if (cola.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "No quedan nombres por decidir. Déjame un comentario aquí abajo y te busco otra tanda.";
    area.appendChild(p);
    btn.hidden = true;
    return;
  }
  btn.hidden = false;
  const n = Math.min(TAM_LOTE, cola.length);
  const pintaBoton = () => {
    const marcados = lote.filter((it) => it.marca).length;
    btn.classList.toggle("con-marcas", marcados > 0);
    btn.textContent = conversacion
      ? (marcados === 0 ? `👎 ${n} · siguiente` : `👍 ${marcados} · siguiente`)
      : marcados === 0
        ? `👎 No me gustan los ${n}`
        : `Guardar ${marcados} 👍 y descartar ${n - marcados} →`;
  };

  cola.slice(0, TAM_LOTE).forEach((row, idx) => {
    const node = document.getElementById("tpl-lote-fila").content.cloneNode(true);
    const fila = node.querySelector(".lote-fila");
    const item = { row, num: idx + 1, marca: null, campo: node.querySelector(".nota-input"), marcar: null };
    fila.querySelector(".lote-num").textContent = String(idx + 1);
    fila.querySelector(".name-text").textContent = row.nombre;
    { const ps = pastillaScore(row); if (ps) fila.querySelector(".name-text").after(ps); }
    pintaPorque(fila.querySelector(".porque"), row);
    const ts = textoScore(row);
    if (ts) { const p = document.createElement("p"); p.className = "marca-score"; p.textContent = ts; fila.querySelector(".porque").after(p); }
    if (row.medidas) fila.querySelector(".porque").parentNode.insertBefore(bloqueMedidas(row.medidas), fila.querySelector(".lote-grandes"));
    renderChecks(fila.querySelector(".checks"), row);
    renderColision(fila.querySelector(".colision-info"), row);
    enlazarMic(fila.querySelector(".btn-mic"), item.campo);

    const detalle = fila.querySelector(".lote-detalle");
    const toggle = fila.querySelector(".lote-nombre");
    toggle.addEventListener("click", () => {
      detalle.hidden = !detalle.hidden;
      toggle.setAttribute("aria-expanded", String(!detalle.hidden));
    });

    const bLike = fila.querySelector(".marca-like");
    const bStar = fila.querySelector(".marca-star");
    const gLike = fila.querySelector(".grande-like");
    const gStar = fila.querySelector(".grande-star");
    const pinta = () => {
      bLike.setAttribute("aria-pressed", String(item.marca === "me_gusta"));
      bStar.setAttribute("aria-pressed", String(item.marca === "favorito"));
      gLike.classList.toggle("activo", item.marca === "me_gusta");
      gStar.classList.toggle("activo", item.marca === "favorito");
      fila.classList.toggle("gusta", item.marca === "me_gusta");
      fila.classList.toggle("star", item.marca === "favorito");
      pintaBoton();
    };
    const alterna = (m) => () => { item.marca = item.marca === m ? null : m; pinta(); };
    bLike.addEventListener("click", alterna("me_gusta"));
    gLike.addEventListener("click", alterna("me_gusta"));
    bStar.addEventListener("click", alterna("favorito"));
    gStar.addEventListener("click", alterna("favorito"));
    item.marcar = (m) => { item.marca = m; pinta(); };

    lote.push(item);
    area.appendChild(node);
  });
  pintaBotonLote = pintaBoton;
  pintaBoton();
  document.getElementById("modo-lote").scrollTop = 0; // cada lote nuevo empieza arriba, con los 10 y el botón a la vista
  requestAnimationFrame(ajustaNombresLote);
  if (conversacion) convEstado(`Lote nuevo. Di los números que te gustan y «siguiente».`);
}

// Cada nombre en una sola línea: si no cabe al tamaño grande, se reduce
// la letra de ese nombre lo justo (sin cortar ni partir en dos líneas).
function ajustaNombresLote() {
  for (const el of document.querySelectorAll("#lote-area .lote-nombre .name-text")) {
    el.style.fontSize = "";
    let tam = parseFloat(getComputedStyle(el).fontSize);
    while (el.scrollWidth > el.clientWidth + 1 && tam > 13) { tam -= 1; el.style.fontSize = tam + "px"; }
  }
}
window.addEventListener("resize", () => { if (modo === "lote") ajustaNombresLote(); });
if (document.fonts) document.fonts.ready.then(() => { if (modo === "lote") ajustaNombresLote(); });

async function siguienteLote() {
  if (ocupado || lote.length === 0) return;
  pararDictado();
  ocupado = true;
  const btn = document.getElementById("btn-siguiente");
  btn.disabled = true;
  const ahora = new Date().toISOString();
  try {
    const grupos = { me_gusta: [], favorito: [], no_me_gusta: [] };
    for (const it of lote) {
      const nota = it.campo.value.trim();
      const status = it.marca || "no_me_gusta";
      if (nota) await apiPatch(`${TABLE}?id=eq.${it.row.id}`, { status, nota, decidido_at: ahora });
      else grupos[status].push(it.row.id);
    }
    for (const [status, ids] of Object.entries(grupos)) {
      if (ids.length) await apiPatch(`${TABLE}?id=in.(${ids.join(",")})`, { status, decidido_at: ahora });
    }
    ultimaDecision = lote.map((it) => ({ id: it.row.id, notaAnterior: it.row.nota ?? null }));
    ocultarError();
    await recargarTodo();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    mostrarError(err);
  } finally {
    btn.disabled = false;
    ocupado = false;
  }
}

function botonAccion(texto, clase, alPulsar) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = clase;
  b.textContent = texto;
  b.addEventListener("click", async () => {
    if (ocupado) return;
    ocupado = true;
    b.disabled = true;
    try {
      await alPulsar();
      ocultarError();
      await recargarTodo();
    } catch (err) {
      mostrarError(err);
      b.disabled = false;
    } finally {
      ocupado = false;
    }
  });
  return b;
}

function renderCard(container, row, acciones) {
  const node = document.getElementById("tpl-nombre-card").content.cloneNode(true);
  const card = node.querySelector(".name-card");
  card.querySelector(".name-text").textContent = row.nombre;
  { const ps = pastillaScore(row); if (ps) card.querySelector(".name-text").after(ps); }
  pintaPorque(card.querySelector(".porque"), row);

  const notaEl = card.querySelector(".nota-guardada");
  if (row.nota) notaEl.textContent = `📝 ${row.nota}`;
  else notaEl.remove();

  const zonaAcciones = card.querySelector(".head-actions");
  for (const a of acciones) {
    zonaAcciones.appendChild(
      botonAccion(a.texto, a.clase, () =>
        apiPatch(`${TABLE}?id=eq.${row.id}`, { status: a.status, decidido_at: new Date().toISOString() })
      )
    );
  }

  renderChecks(card.querySelector(".checks"), row);
  renderColision(card.querySelector(".colision-info"), row);

  // Comentario añadido a posteriori: se suma al que ya hubiera.
  const campo = card.querySelector(".nota-edit .nota-input");
  enlazarMic(card.querySelector(".nota-edit .btn-mic"), campo);
  const guardar = botonAccion("Guardar", "btn-mini", async () => {
    pararDictado();
    const nuevo = campo.value.trim();
    if (!nuevo) return;
    const nota = row.nota ? `${row.nota} · ${nuevo}` : nuevo;
    await apiPatch(`${TABLE}?id=eq.${row.id}`, { nota });
  });
  card.querySelector(".btn-guardar-nota").replaceWith(guardar);

  const linksEl = card.querySelector(".official-links");
  for (const l of officialLinks(row)) {
    const a = document.createElement("a");
    a.className = "btn-link";
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = l.label;
    linksEl.appendChild(a);
  }

  container.appendChild(node);
}

function pintaLista(idContenedor, idContador, filas, vacio, acciones) {
  const contenedor = document.getElementById(idContenedor);
  contenedor.innerHTML = "";
  const n = filas.total ?? filas.length;
  document.getElementById(idContador).textContent = n ? `(${n})` : "";
  if (filas.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = vacio;
    contenedor.appendChild(p);
    return;
  }
  for (const row of filas) renderCard(contenedor, row, acciones);
  if (n > filas.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = `Se muestran los ${filas.length} más recientes de ${n}.`;
    contenedor.appendChild(p);
  }
}

async function pintaSugerencias() {
  const filas = await apiGet(`${TABLE_SUG}?order=created_at.desc&select=*`);
  const wrap = document.getElementById("sug-lista-wrap");
  const lista = document.getElementById("sug-lista");
  document.getElementById("sug-count").textContent = filas.length;
  wrap.hidden = filas.length === 0;
  lista.innerHTML = "";
  for (const s of filas) {
    const li = document.createElement("li");
    li.textContent = s.atendida ? `${s.texto} ✓` : s.texto;
    lista.appendChild(li);
  }
}

async function recargarTodo() {
  try {
    const [pendientes, meGusta, favoritos, descartados, vetados] = await Promise.all([
      fetchIdeas("pendiente", "orden.asc.nullslast,id.asc", TAM_LOTE),
      fetchIdeas("me_gusta", "score.desc.nullslast,decidido_at.desc.nullslast"),
      fetchIdeas("favorito", "score.desc.nullslast,decidido_at.desc.nullslast"),
      fetchIdeas("no_me_gusta", "decidido_at.desc.nullslast", 100),
      fetchIdeas("vetado", "id.desc", 200),
    ]);

    cola = pendientes;
    const referencias = await apiGet(`${TABLE}?status=eq.vetado&score=not.is.null&select=*`);
    gustados = [...favoritos, ...meGusta, ...referencias];
    if (!document.getElementById("vista-ranking").hidden) pintaRanking();
    const decididos = meGusta.total + favoritos.total + descartados.total;
    const total = decididos + pendientes.total;
    document.getElementById("decididos-count").textContent = decididos;
    document.getElementById("barra-progreso").style.width = total ? `${(100 * decididos) / total}%` : "0%";
    pintaRevision();

    pintaLista("lista-definitivos", "count-definitivos", favoritos, "Todavía no hay ningún definitivo.", [
      { texto: "👍 Bajar a me gusta", clase: "btn-mini", status: "me_gusta" },
    ]);
    pintaLista("lista-me-gusta", "count-megusta", meGusta, "Nada todavía.", [
      { texto: "⭐ Definitivo", clase: "btn-mini btn-mini-star", status: "favorito" },
      { texto: "👎 Descartar", clase: "btn-mini", status: "no_me_gusta" },
    ]);
    pintaLista("lista-descartados", "count-descartados", descartados, "Ninguno todavía.", [
      { texto: "👍 Me gusta", clase: "btn-mini btn-mini-like", status: "me_gusta" },
      { texto: "↩️ A la cola", clase: "btn-mini", status: "pendiente" },
    ]);
    pintaLista("lista-vetados", "count-vetados", vetados, "Ninguno.", [
      { texto: "↩️ Rescatar", clase: "btn-mini", status: "pendiente" },
    ]);

    document.getElementById("btn-deshacer").hidden = ultimaDecision === null;
    await pintaSugerencias();
    ocultarError();
  } catch (err) {
    mostrarError(err);
  }
}


// ---- Ranking de marca (puntuación de Claude, columna score) ----

function claseScore(v) {
  return v >= 75 ? "alto" : v >= 55 ? "medio" : "bajo";
}

// Pastilla con la puntuación de marca de Claude, siempre al lado del nombre.
function pastillaScore(row) {
  if (row.score === null || row.score === undefined) return null;
  const sp = document.createElement("span");
  sp.className = `rk-score pill-score ${claseScore(row.score)}`;
  sp.textContent = Math.round(row.score);
  const motivo = (row.score_motivo || "").replace(/^(Claude|Rúbrica):\s*/, "");
  sp.title = `Marca ${Math.round(row.score)}/100${motivo ? " · " + motivo : ""}`;
  return sp;
}

function textoScore(row) {
  if (row.score === null || row.score === undefined) return null;
  const motivo = (row.score_motivo || "").replace(/^(Claude|Rúbrica):\s*/, "");
  return `🏆 marca ${Math.round(row.score)}/100${motivo ? " · " + motivo : ""}`;
}

function abrirRanking(abrir) {
  document.getElementById("vista-ranking").hidden = !abrir;
  document.querySelector(".wrap").hidden = abrir;
  if (abrir) { pararConversacion(); document.getElementById("vista-buscar").hidden = true; document.getElementById("vista-referencias").hidden = true; pintaRanking(); window.scrollTo(0, 0); }
}

function pintaRanking() {
  const cont = document.getElementById("lista-ranking");
  cont.innerHTML = "";
  // Solo los nombres puntuados con la metodología de las 6 medidas
  // (la misma de «📐 Buen nombre»), de mayor a menor.
  const filas = gustados
    .filter((r) => r.medidas && r.score !== null && r.score !== undefined)
    .sort((a, b) => b.score - a.score || a.nombre.localeCompare(b.nombre));
  if (filas.length === 0) {
    parrafo(cont, "Todavía no hay nombres puntuados con las 6 medidas.", "empty");
    return;
  }
  filas.forEach((row, i) => {
    const card = document.createElement("div");
    card.className = "ref-card rk-ficha";
    const cab = document.createElement("div");
    cab.className = "ref-cab";
    const n = document.createElement("span");
    n.className = "ref-nombre";
    n.textContent = `${i + 1}. ${row.nombre}`;
    const t = document.createElement("span");
    t.className = `rk-score ${claseScore(row.score)}`;
    t.textContent = Math.round(row.score);
    cab.append(n, t);
    card.appendChild(cab);
    const estado = row.status === "favorito" ? "⭐ Definitivo" : row.status === "vetado" ? "🚫 Vetado" : "👍 Me gusta";
    parrafo(card, [estado, row.medidas.tipo].filter(Boolean).join(" · "), "ref-sector");
    parrafo(card, (row.score_motivo || "").replace(/^(Claude|Rúbrica):\s*/, ""), "ref-porque");
    card.appendChild(bloqueMedidas(row.medidas));
    const acciones = row.status === "vetado"
      ? [{ texto: "↩️ Rescatar", clase: "btn-mini", status: "pendiente" }]
      : row.status === "favorito"
        ? [{ texto: "👍 Bajar a me gusta", clase: "btn-mini", status: "me_gusta" }, { texto: "👎 Descartar", clase: "btn-mini", status: "no_me_gusta" }]
        : [{ texto: "⭐ Definitivo", clase: "btn-mini btn-mini-star", status: "favorito" }, { texto: "👎 Descartar", clase: "btn-mini", status: "no_me_gusta" }];
    const zona = document.createElement("div");
    zona.className = "head-actions";
    for (const a of acciones) {
      zona.appendChild(botonAccion(a.texto, a.clase, () =>
        apiPatch(`${TABLE}?id=eq.${row.id}`, { status: a.status, decidido_at: new Date().toISOString() })
      ));
    }
    card.appendChild(zona);
    cont.appendChild(card);
  });
}


// ---- Buscador: ¿he probado este nombre? ¿por qué no está en la cola? ----

const slugNombre = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const capitaliza = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const ESTADOS = {
  pendiente: "⏳ En tu cola, sin decidir",
  me_gusta: "👍 Te gusta",
  favorito: "⭐ Definitivo",
  no_me_gusta: "👎 Lo descartaste tú",
  vetado: "🚫 Vetado por Claude",
};

function abrirBuscar(abrir) {
  document.getElementById("vista-buscar").hidden = !abrir;
  document.querySelector(".wrap").hidden = abrir;
  if (abrir) {
    pararConversacion();
    document.getElementById("vista-ranking").hidden = true;
    document.getElementById("vista-referencias").hidden = true;
    window.scrollTo(0, 0);
    document.getElementById("input-buscar").focus();
  }
}

// ---- ¿Qué es un buen nombre? (25 marcas de referencia para calibrar) ----
const TABLE_REF = `${CFG.tablePrefix}referencias`;
const MEDIDAS = [
  ["corto", "Corto"], ["facil", "Fácil"], ["memorable", "Memorable"],
  ["sugiere", "Sugiere"], ["distintivo", "Distintivo"], ["busqueda", "Búsqueda"],
];

function abrirReferencias(abrir) {
  document.getElementById("vista-referencias").hidden = !abrir;
  document.querySelector(".wrap").hidden = abrir;
  if (abrir) {
    pararConversacion();
    document.getElementById("vista-ranking").hidden = true;
    document.getElementById("vista-buscar").hidden = true;
    window.scrollTo(0, 0);
    pintaReferencias();
  }
}

async function pintaReferencias() {
  const cont = document.getElementById("lista-referencias");
  try {
    const filas = await apiGet(`${TABLE_REF}?select=*&order=orden.asc`);
    const hechas = filas.filter((r) => r.decision).length;
    const deAcuerdo = filas.filter((r) => r.decision === "de_acuerdo").length;
    document.getElementById("ref-progreso").textContent =
      `${hechas} de ${filas.length} revisadas · ${deAcuerdo} 👍 de acuerdo · ${hechas - deAcuerdo} 👎 no`;
    cont.innerHTML = "";
    for (const r of filas) cont.appendChild(fichaReferencia(r));
    ocultarError();
  } catch (err) {
    mostrarError(err);
  }
}

function bloqueMedidas(medidas) {
  const tabla = document.createElement("div");
  tabla.className = "ref-medidas";
  for (const [k, etiqueta] of MEDIDAS) {
    const m = (medidas || {})[k];
    if (!m) continue;
    const fila = document.createElement("div");
    fila.className = "ref-medida";
    const lab = document.createElement("span");
    lab.className = "ref-lab";
    lab.textContent = etiqueta;
    const barra = document.createElement("span");
    barra.className = "ref-barra";
    const relleno = document.createElement("i");
    relleno.style.width = `${m.nota * 10}%`;
    relleno.className = m.nota >= 8 ? "alto" : m.nota >= 5 ? "medio" : "bajo";
    barra.appendChild(relleno);
    const num = document.createElement("span");
    num.className = "ref-num";
    num.textContent = m.nota;
    const pq = document.createElement("span");
    pq.className = "ref-pq";
    pq.textContent = m.por_que;
    fila.append(lab, barra, num, pq);
    tabla.appendChild(fila);
  }
  return tabla;
}

function fichaReferencia(r) {
  const card = document.createElement("div");
  card.className = "ref-card" + (r.decision ? " " + r.decision : "");
  const cab = document.createElement("div");
  cab.className = "ref-cab";
  const n = document.createElement("span");
  n.className = "ref-nombre";
  n.textContent = r.nombre;
  const t = document.createElement("span");
  t.className = `rk-score ${claseScore(r.total)}`;
  t.textContent = r.total;
  cab.append(n, t);
  card.appendChild(cab);
  parrafo(card, `${r.sector} · ${r.tipo}`, "ref-sector");
  parrafo(card, r.por_que, "ref-porque");

  card.appendChild(bloqueMedidas(r.medidas));

  if (r.decision) {
    parrafo(card, r.decision === "de_acuerdo" ? "👍 Estás de acuerdo: es un buen nombre" : "👎 No te convence", "ref-estado");
  }
  if (r.nota) parrafo(card, `📝 ${r.nota}`, "ref-nota");

  const fila = document.createElement("div");
  fila.className = "nota-row";
  const campo = document.createElement("textarea");
  campo.className = "nota-input";
  campo.rows = 1;
  campo.maxLength = 1000;
  campo.placeholder = "¿por qué? (opcional)";
  const mic = document.createElement("button");
  mic.type = "button";
  mic.className = "btn-mic";
  mic.setAttribute("aria-label", "Dictar comentario por voz");
  mic.textContent = "🎙️";
  fila.append(campo, mic);
  card.appendChild(fila);
  enlazarMic(mic, campo);

  const acciones = document.createElement("div");
  acciones.className = "ref-acciones";
  const decide = (decision) => async () => {
    if (ocupado) return;
    ocupado = true;
    pararDictado();
    try {
      const nuevo = campo.value.trim();
      const nota = nuevo ? (r.nota ? `${r.nota} · ${nuevo}` : nuevo) : r.nota;
      await apiPatch(`${TABLE_REF}?id=eq.${r.id}`, { decision, nota: nota || null, decidido_at: new Date().toISOString() });
      await pintaReferencias();
    } catch (err) {
      mostrarError(err);
    } finally {
      ocupado = false;
    }
  };
  const si = document.createElement("button");
  si.type = "button";
  si.className = "grande grande-like";
  si.textContent = "👍 De acuerdo";
  si.addEventListener("click", decide("de_acuerdo"));
  const no = document.createElement("button");
  no.type = "button";
  no.className = "grande ref-no";
  no.textContent = "👎 No me convence";
  no.addEventListener("click", decide("no"));
  acciones.append(si, no);
  card.appendChild(acciones);
  return card;
}

function fechaCorta(iso) {
  return iso ? new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "";
}

function parrafo(cont, texto, clase = "") {
  const p = document.createElement("p");
  if (clase) p.className = clase;
  p.textContent = texto;
  cont.appendChild(p);
  return p;
}

// Botón que ejecuta una escritura y vuelve a buscar, para ver el estado nuevo.
function botonBuscar(texto, alPulsar, texto2) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "btn-mini";
  b.textContent = texto;
  b.addEventListener("click", async () => {
    if (ocupado) return;
    ocupado = true;
    b.disabled = true;
    try {
      await alPulsar();
      ocultarError();
      await recargarTodo();
      await buscarNombre(texto2);
    } catch (err) {
      mostrarError(err);
      b.disabled = false;
    } finally {
      ocupado = false;
    }
  });
  return b;
}

function explicaFila(cont, row, textoBuscado) {
  const cab = document.createElement("div");
  cab.className = "res-cab";
  const n = document.createElement("span");
  n.className = "name-text";
  n.textContent = row.nombre;
  cab.appendChild(n);
  { const ps = pastillaScore(row); if (ps) cab.appendChild(ps); }
  cont.appendChild(cab);
  parrafo(cont, ESTADOS[row.status] || row.status, "res-estado");
  const porque = [];
  if (row.status === "vetado") porque.push(`No entró en la cola porque ${(row.veto_motivo || "choca con una marca conocida").replace(/[.\s]+$/, "")}.`);
  if (row.status === "no_me_gusta") porque.push(`Lo descartaste${row.decidido_at ? " el " + fechaCorta(row.decidido_at) : ""}${row.nota ? " con el comentario «" + row.nota + "»" : ""}.`);
  if (row.status === "pendiente") porque.push("Está en la cola: te saldrá cuando le toque por su puntuación de marca.");
  if (row.status === "me_gusta" || row.status === "favorito") porque.push(`Lo decidiste${row.decidido_at ? " el " + fechaCorta(row.decidido_at) : ""}; está en el ranking de marca.`);
  if (row.porque) porque.push(`Por qué lo propuse: ${row.porque}`);
  if (row.metodo) porque.push(`Familia: ${row.metodo}${row.tanda ? " (tanda " + row.tanda + ")" : ""}.`);
  if (row.com_libre === false) porque.push(`El ${dominio(row)} está ocupado.`);
  else if (row.com_libre === true) porque.push(`El ${dominio(row)} estaba libre cuando lo comprobé.`);
  if (row.colision_detalle) porque.push(row.colision_detalle);
  for (const t of porque) parrafo(cont, t, "res-motivo");
  const sc = textoScore(row);
  if (sc) parrafo(cont, sc, "marca-score");
  const zona = document.createElement("div");
  zona.className = "head-actions";
  const patch = (fields) => () => apiPatch(`${TABLE}?id=eq.${row.id}`, { ...fields, decidido_at: new Date().toISOString() });
  if (row.status === "vetado" || row.status === "no_me_gusta") zona.appendChild(botonBuscar("↩️ A la cola, el primero", patch({ status: "pendiente", orden: -1 }), textoBuscado));
  if (row.status !== "favorito") zona.appendChild(botonBuscar("⭐ Definitivo", patch({ status: "favorito" }), textoBuscado));
  if (row.status !== "me_gusta" && row.status !== "favorito") zona.appendChild(botonBuscar("👍 Me gusta", patch({ status: "me_gusta" }), textoBuscado));
  if (row.status === "pendiente") zona.appendChild(botonBuscar("⬆️ Ponerlo el primero", () => apiPatch(`${TABLE}?id=eq.${row.id}`, { orden: -1 }), textoBuscado));
  cont.appendChild(zona);
}

async function buscarNombre(texto) {
  const cont = document.getElementById("resultado-buscar");
  cont.innerHTML = "";
  const palabras = texto.trim().split(/\s+/).filter(Boolean);
  const s = slugNombre(texto);
  if (s.length < 2) return;
  const variantes = [...new Set([s, slugNombre(palabras.slice().reverse().join(""))])];
  parrafo(cont, "Buscando…", "empty");
  try {
    const lista = variantes.map((v) => `nombre.ilike.${v}`).join(",");
    const [exactas, parecidas, comprobadas] = await Promise.all([
      apiGet(`${TABLE}?or=(${lista})&select=*`),
      apiGet(`${TABLE}?nombre=ilike.*${s}*&select=nombre,status,score&order=score.desc.nullslast&limit=12`),
      apiGet(`${CFG.tablePrefix}comprobados?nombre=in.(${variantes.join(",")})&select=*`),
    ]);
    cont.innerHTML = "";
    const exactasSet = new Set(exactas.map((r) => r.nombre.toLowerCase()));
    if (exactas.length) {
      for (const row of exactas) {
        const caja = document.createElement("div");
        caja.className = "res-caja";
        explicaFila(caja, row, texto);
        cont.appendChild(caja);
      }
    } else {
      const caja = document.createElement("div");
      caja.className = "res-caja";
      const nombre = capitaliza(s);
      const cab = document.createElement("div");
      cab.className = "res-cab";
      const n = document.createElement("span");
      n.className = "name-text";
      n.textContent = nombre;
      cab.appendChild(n);
      caja.appendChild(cab);
      const ocupadoCom = comprobadas.find((c) => c.com_libre === false);
      if (ocupadoCom) {
        parrafo(caja, "🌐 Probado: el .com está ocupado", "res-estado");
        parrafo(caja, `Comprobé ${ocupadoCom.nombre}.com el ${fechaCorta(ocupadoCom.checked_at)} y ya tiene dueño, así que no lo metí en la cola (solo cargo nombres con el .com libre).`, "res-motivo");
      } else {
        parrafo(caja, "🆕 Nunca lo he probado", "res-estado");
        parrafo(caja, "No está en ninguna tanda ni lo he comprobado. Si lo añades, entra el primero de tu cola y en la siguiente pasada compruebo el .com y le pongo puntuación de marca.", "res-motivo");
      }
      const zona = document.createElement("div");
      zona.className = "head-actions";
      zona.appendChild(botonBuscar("➕ Añadir a la cola, el primero", () => apiPost(TABLE, {
        nombre, status: "pendiente", tanda: 0, metodo: "Buscador: lo pediste tú",
        porque: `Lo escribiste en el buscador («${texto.trim()}»).`, com_libre: ocupadoCom ? false : null, orden: -1,
      }), texto));
      caja.appendChild(zona);
      cont.appendChild(caja);
    }
    const otras = parecidas.filter((r) => !exactasSet.has(r.nombre.toLowerCase()));
    if (otras.length) {
      parrafo(cont, "Parecidos que sí he probado:", "res-titulo");
      const ul = document.createElement("ul");
      ul.className = "res-parecidos";
      for (const r of otras) {
        const li = document.createElement("li");
        li.textContent = `${(ESTADOS[r.status] || r.status).slice(0, 2)} ${r.nombre}${r.score !== null && r.score !== undefined ? " · " + Math.round(r.score) : ""}`;
        li.title = ESTADOS[r.status] || r.status;
        li.addEventListener("click", () => { document.getElementById("input-buscar").value = r.nombre; buscarNombre(r.nombre); });
        ul.appendChild(li);
      }
      cont.appendChild(ul);
    }
  } catch (err) {
    cont.innerHTML = "";
    mostrarError(err);
  }
}

// ---- Comentarios generales ----

async function enviarSugerencia(ev) {
  ev.preventDefault();
  pararDictado();
  const input = document.getElementById("input-sugerencia");
  const msg = document.getElementById("sug-msg");
  const texto = input.value.trim();
  if (!texto) return;
  try {
    await apiPost(TABLE_SUG, [{ texto }]);
    input.value = "";
    msg.textContent = "✓ Guardado. Lo tendré en cuenta en la próxima tanda de nombres.";
    msg.hidden = false;
    await pintaSugerencias();
  } catch (err) {
    msg.textContent = `No se pudo guardar: ${err.message}`;
    msg.hidden = false;
  }
}

// ---- Deshacer ----

async function deshacer() {
  if (!ultimaDecision || ocupado) return;
  ocupado = true;
  const btn = document.getElementById("btn-deshacer");
  btn.disabled = true;
  try {
    const sinNota = ultimaDecision.filter((d) => d.notaAnterior === null).map((d) => d.id);
    if (sinNota.length) {
      await apiPatch(`${TABLE}?id=in.(${sinNota.join(",")})`, { status: "pendiente", nota: null, decidido_at: null });
    }
    for (const d of ultimaDecision.filter((d) => d.notaAnterior !== null)) {
      await apiPatch(`${TABLE}?id=eq.${d.id}`, { status: "pendiente", nota: d.notaAnterior, decidido_at: null });
    }
    ultimaDecision = null;
    await recargarTodo();
  } catch (err) {
    mostrarError(err);
  } finally {
    btn.disabled = false;
    ocupado = false;
  }
}

function init() {
  document.getElementById("form-sugerencia").addEventListener("submit", enviarSugerencia);
  document.getElementById("btn-deshacer").addEventListener("click", deshacer);
  document.getElementById("btn-siguiente").addEventListener("click", siguienteLote);
  document.getElementById("btn-conversacion").addEventListener("click", alternarConversacion);
  document.getElementById("btn-ranking").addEventListener("click", () => abrirRanking(true));
  document.getElementById("btn-volver").addEventListener("click", () => abrirRanking(false));
  document.getElementById("btn-buscar").addEventListener("click", () => abrirBuscar(true));
  document.getElementById("btn-volver-buscar").addEventListener("click", () => abrirBuscar(false));
  document.getElementById("btn-referencias").addEventListener("click", () => abrirReferencias(true));
  document.getElementById("btn-volver-referencias").addEventListener("click", () => abrirReferencias(false));
  document.getElementById("form-buscar").addEventListener("submit", (ev) => {
    ev.preventDefault();
    pararDictado();
    buscarNombre(document.getElementById("input-buscar").value);
  });
  enlazarMic(
    document.querySelector('[data-mic-for="input-buscar"]'),
    document.getElementById("input-buscar")
  );
  for (const b of document.querySelectorAll(".btn-modo")) {
    b.addEventListener("click", () => eligeModo(b.dataset.modo));
  }
  document.getElementById("btn-cambiar-modo").addEventListener("click", () => eligeModo(null));
  document.getElementById("btn-atras-lote").addEventListener("click", () => eligeModo(null));
  eligeModo(null);
  document.getElementById("btn-reintentar").addEventListener("click", recargarTodo);
  enlazarMic(
    document.querySelector('[data-mic-for="input-sugerencia"]'),
    document.getElementById("input-sugerencia")
  );

  recargarTodo();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
