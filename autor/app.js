// Nombre Autor — nombres para la app de vocabulario y ortografía sacados de
// autores clásicos (Nebrija, Quevedo, Góngora, Cervantes…), las variantes de
// sus nombres y sus personajes (Dulcinea, Sancho, Mairena…).
//
// Cada nombre llega ya comprobado desde fuera (autor/tools/cargar.py): si
// base.com está libre se presenta tal cual («Quevedo»); si no, como
// «Proyecto Quevedo» o «Estudio Quevedo», el primero con el .com libre.
// La ficha cuenta quién es y qué relación tiene con la ortografía.
//
// Misma mecánica que Nombre Empresa: revisar de 1 en 1 o de 10 en 10 (con
// modo conversación), ⭐ / 👍 / 💚 / 👎 / 🙅, comentarios por nombre y
// generales (autor_sugerencias), buscador y deshacer.

const CFG = window.AUTOR_CONFIG;
const REST = `${CFG.url}/rest/v1`;
const TABLE = `${CFG.tablePrefix}ideas`;
const TABLE_SUG = `${CFG.tablePrefix}sugerencias`;

const HEADERS = {
  apikey: CFG.anonKey,
  Authorization: `Bearer ${CFG.anonKey}`,
  "Content-Type": "application/json",
};

const slugNombre = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const dominio = (row) => row.dominio || `${slugNombre(row.nombre)}.com`;

const officialLinks = (row) => [
  { label: `Comprar ${dominio(row)}`, url: `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(dominio(row))}` },
  { label: `Wikipedia: ${row.base}`, url: `https://es.wikipedia.org/w/index.php?search=${encodeURIComponent(row.base + " " + (row.de_quien || ""))}` },
  { label: `Buscar "${row.nombre}" en Google`, url: `https://www.google.com/search?q=%22${encodeURIComponent(row.nombre)}%22` },
  { label: "OEPM · marcas (España)", url: "https://consultas2.oepm.es/LocalizadorWeb/" },
  { label: "EUIPO · marcas UE", url: `https://www.tmdn.org/tmview/#/tmview/results?page=1&pageSize=30&criteria=C&basicSearch=${encodeURIComponent(row.nombre)}` },
];

let cola = [];
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
  if (row.otros_dominios) filas.push(["warn", row.otros_dominios]);
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

const ESTRELLAS = ["", "✍️", "✍️✍️", "✍️✍️✍️"];
const NIVEL_TXT = ["Sin relación conocida con la ortografía", "Relación indirecta con la lengua", "Relación clara con la escritura o la lengua", "La ortografía es parte de su historia"];

// Ficha: quién es (o de qué obra sale) y qué tiene que ver con la ortografía.
function pintaPorque(el, row) {
  el.textContent = row.ficha || "";
  const sub = document.createElement("p");
  sub.className = "de-quien";
  sub.textContent = [etiquetaTipo(row), row.epoca].filter(Boolean).join(" · ");
  el.before(sub);
  if (row.ortografia) {
    const o = document.createElement("p");
    o.className = `orto orto-${row.orto_nivel || 0}`;
    o.textContent = `${ESTRELLAS[row.orto_nivel || 0] || "·"} Ortografía: ${row.ortografia}`;
    o.title = NIVEL_TXT[row.orto_nivel || 0];
    el.after(o);
  }
}

function etiquetaTipo(row) {
  const t = { autor: "✒️ Autor", variante: "🔤 Variante de", personaje: "🎭 Personaje de", lugar: "📍 Lugar de", objeto: "📜 Obra de" }[row.tipo] || "";
  if (row.tipo === "autor") return `${t}: ${row.de_quien}`;
  return `${t} ${row.de_quien || ""}`.trim();
}

function renderColision(container, row) {
  if (row.status === "vetado" && row.veto_motivo) {
    container.textContent = `🚫 Vetado: ${row.veto_motivo}`;
    return;
  }
  container.textContent = "";
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
  tag.textContent = item.forma === "tal_cual" ? "🎯 .com tal cual" : item.forma === "proyecto" ? "Proyecto … (el .com solo estaba cogido)" : "Estudio … (el .com y Proyecto… estaban cogidos)";
  node.querySelector(".name-text").textContent = item.nombre;
  { const ps = pastillaScore(item); if (ps) node.querySelector(".name-text").after(ps); }
  node.querySelector(".dominio").textContent = `${dominio(item)} libre${item.base_com_libre === false ? ` · ${slugNombre(item.base)}.com ocupado` : ""}`;
  pintaPorque(node.querySelector(".porque"), item);
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
  node.querySelector(".btn-nada").addEventListener("click", decidir("nada"));
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
    const nNada = lote.filter((it) => it.marca === "nada").length;
    const marcados = lote.filter((it) => it.marca && it.marca !== "nada").length;
    btn.classList.toggle("con-marcas", marcados > 0);
    btn.textContent = conversacion
      ? (marcados === 0 ? `👎 ${n} · siguiente` : `👍 ${marcados} · siguiente`)
      : marcados === 0
        ? `👎 No me gustan los ${n}`
        : `Guardar ${marcados} 👍 y descartar ${n - marcados} →`;
    if (nNada && !conversacion) btn.textContent += ` (🙅 ${nNada})`;
  };

  cola.slice(0, TAM_LOTE).forEach((row, idx) => {
    const node = document.getElementById("tpl-lote-fila").content.cloneNode(true);
    const fila = node.querySelector(".lote-fila");
    const item = { row, num: idx + 1, marca: null, campo: node.querySelector(".nota-input"), marcar: null };
    fila.querySelector(".lote-num").textContent = String(idx + 1);
    fila.querySelector(".name-text").textContent = row.nombre;
    fila.querySelector(".lote-sub").textContent = [ESTRELLAS[row.orto_nivel || 0], row.tipo === "autor" ? `autor · ${row.epoca || ""}` : row.tipo === "variante" ? `= ${row.de_quien}` : row.de_quien].filter(Boolean).join(" ");
    pintaPorque(fila.querySelector(".porque"), row);
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
    const bNada = fila.querySelector(".marca-nada");
    const gNada = fila.querySelector(".grande-nada");
    const pinta = () => {
      bNada.setAttribute("aria-pressed", String(item.marca === "nada"));
      gNada.classList.toggle("activo", item.marca === "nada");
      fila.classList.toggle("nada", item.marca === "nada");
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
    bNada.addEventListener("click", alterna("nada"));
    gNada.addEventListener("click", alterna("nada"));
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
    while (el.scrollWidth > el.clientWidth + 1 && tam > 10) { tam -= 1; el.style.fontSize = tam + "px"; }
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
    const grupos = { me_gusta: [], favorito: [], no_me_gusta: [], nada: [] };
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

function renderCard(container, row, acciones, opciones = {}) {
  const node = document.getElementById("tpl-nombre-card").content.cloneNode(true);
  const card = node.querySelector(".name-card");
  card.querySelector(".name-text").textContent = (opciones.pos ? `${opciones.pos}. ` : "") + row.nombre;
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

function pintaLista(idContenedor, idContador, filas, vacio, acciones, opciones = {}) {
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
  filas.forEach((row, i) => renderCard(contenedor, row, acciones, opciones.ranking ? { pos: i + 1 } : {}));
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
    const [pendientes, meGusta, favoritos, descartados, vetados, nada, gustaDescartados] = await Promise.all([
      fetchIdeas("pendiente", "orden.asc.nullslast,id.asc", TAM_LOTE),
      fetchIdeas("me_gusta", "orto_nivel.desc.nullslast,decidido_at.desc.nullslast"),
      fetchIdeas("favorito", "orto_nivel.desc.nullslast,decidido_at.desc.nullslast"),
      fetchIdeas("no_me_gusta", "decidido_at.desc.nullslast", 100),
      fetchIdeas("vetado", "id.desc", 200),
      fetchIdeas("nada", "decidido_at.desc.nullslast", 200),
      fetchIdeas("me_gusta_descartado", "decidido_at.desc.nullslast"),
    ]);

    cola = pendientes;
    const decididos = meGusta.total + favoritos.total + descartados.total + nada.total + gustaDescartados.total;
    const total = decididos + pendientes.total;
    document.getElementById("decididos-count").textContent = decididos;
    document.getElementById("barra-progreso").style.width = total ? `${(100 * decididos) / total}%` : "0%";
    pintaRevision();

    pintaLista("lista-definitivos", "count-definitivos", favoritos, "Todavía no hay ningún definitivo.", [
      { texto: "👍 Bajar a me gusta", clase: "btn-mini", status: "me_gusta" },
      { texto: "💚 Me gusta, descartado", clase: "btn-mini", status: "me_gusta_descartado" },
    ], { ranking: true });
    pintaLista("lista-me-gusta", "count-megusta", meGusta, "Nada todavía.", [
      { texto: "⭐ Definitivo", clase: "btn-mini btn-mini-star", status: "favorito" },
      { texto: "💚 Me gusta, descartado", clase: "btn-mini", status: "me_gusta_descartado" },
      { texto: "👎 Descartar", clase: "btn-mini", status: "no_me_gusta" },
    ]);
    pintaLista("lista-megusta-descartados", "count-megusta-descartados", gustaDescartados, "Ninguno todavía.", [
      { texto: "👍 Volver a me gusta", clase: "btn-mini btn-mini-like", status: "me_gusta" },
      { texto: "⭐ Definitivo", clase: "btn-mini btn-mini-star", status: "favorito" },
    ]);
    pintaLista("lista-descartados", "count-descartados", descartados, "Ninguno todavía.", [
      { texto: "👍 Me gusta", clase: "btn-mini btn-mini-like", status: "me_gusta" },
      { texto: "↩️ A la cola", clase: "btn-mini", status: "pendiente" },
    ]);
    pintaLista("lista-nada", "count-nada", nada, "Ninguno.", [
      { texto: "👎 Solo este no", clase: "btn-mini", status: "no_me_gusta" },
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


// ---- Pastilla de ortografía al lado del nombre (✍️ = nivel 1-3) ----

function pastillaScore(row) {
  const n = row.orto_nivel || 0;
  if (!n) return null;
  const sp = document.createElement("span");
  sp.className = `rk-score pill-score pill-orto orto-${n}`;
  sp.textContent = ESTRELLAS[n];
  sp.title = NIVEL_TXT[n];
  return sp;
}

// ---- Buscador: ¿he probado este nombre? ¿por qué no está en la cola? ----

const capitaliza = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const ESTADOS = {
  pendiente: "⏳ En tu cola, sin decidir",
  me_gusta: "👍 Te gusta",
  favorito: "⭐ Definitivo",
  no_me_gusta: "👎 Lo descartaste tú",
  me_gusta_descartado: "💚 Te gusta, pero lo descartaste",
  nada: "🙅 Nada de este estilo (lo dijiste tú)",
  vetado: "🚫 Vetado por Claude",
};

function abrirBuscar(abrir) {
  document.getElementById("vista-buscar").hidden = !abrir;
  document.querySelector(".wrap").hidden = abrir;
  if (abrir) {
    pararConversacion();
    window.scrollTo(0, 0);
    document.getElementById("input-buscar").focus();
  }
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
  if (row.status === "pendiente") porque.push("Está en la cola: primero salen los que más tienen que ver con la ortografía.");
  if (row.status === "me_gusta_descartado") porque.push(`Te gusta, pero lo descartaste${row.decidido_at ? " el " + fechaCorta(row.decidido_at) : ""}: no va a ser el nombre.`);
  if (row.status === "me_gusta" || row.status === "favorito") porque.push(`Lo decidiste${row.decidido_at ? " el " + fechaCorta(row.decidido_at) : ""}.`);
  if (row.de_quien) porque.push(`${etiquetaTipo(row)}${row.epoca ? " (" + row.epoca + ")" : ""}.`);
  if (row.ficha) porque.push(row.ficha);
  if (row.ortografia) porque.push(`Ortografía: ${row.ortografia}`);
  if (row.otros_dominios) porque.push(row.otros_dominios);
  if (row.com_libre === false) porque.push(`El ${dominio(row)} está ocupado.`);
  else if (row.com_libre === true) porque.push(`El ${dominio(row)} estaba libre cuando lo comprobé.`);
  for (const t of porque) parrafo(cont, t, "res-motivo");
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
  const s = slugNombre(texto.replace(/^\s*(proyecto|estudio)\s+/i, ""));
  if (s.length < 2) return;
  const doms = [`${s}.com`, `proyecto${s}.com`, `estudio${s}.com`];
  parrafo(cont, "Buscando…", "empty");
  try {
    const [exactas, parecidas, comprobadas] = await Promise.all([
      apiGet(`${TABLE}?dominio=in.(${doms.join(",")})&select=*`),
      apiGet(`${TABLE}?dominio=ilike.*${s}*&select=nombre,status,orto_nivel&order=orto_nivel.desc.nullslast&limit=12`),
      apiGet(`${CFG.tablePrefix}comprobados?dominio=in.(${doms.join(",")})&select=*`),
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
      const base = texto.trim().replace(/^(proyecto|estudio)\s+/i, "").split(/\s+/).map(capitaliza).join(" ");
      const cab = document.createElement("div");
      cab.className = "res-cab";
      const n = document.createElement("span");
      n.className = "name-text";
      n.textContent = base;
      cab.appendChild(n);
      caja.appendChild(cab);
      const vistos = comprobadas.filter((c) => c.com_libre === false).map((c) => c.dominio);
      if (vistos.length === 3) {
        parrafo(caja, "🌐 Probado: los tres .com están ocupados", "res-estado");
        parrafo(caja, `${vistos.join(", ")} ya tienen dueño, así que no lo metí en la cola.`, "res-motivo");
      } else {
        parrafo(caja, vistos.length ? `🌐 Probado en parte: ${vistos.join(", ")} ocupado` : "🆕 Nunca lo he probado", "res-estado");
        parrafo(caja, "Si lo añades, entra el primero de tu cola y en la siguiente pasada compruebo el .com (tal cual, Proyecto… o Estudio…) y le escribo la ficha.", "res-motivo");
      }
      const zona = document.createElement("div");
      zona.className = "head-actions";
      zona.appendChild(botonBuscar("➕ Añadir a la cola, el primero", () => apiPost(TABLE, {
        nombre: base, base, dominio: `${s}.com`, forma: "tal_cual", status: "pendiente", tanda: 0, tipo: "pedido",
        de_quien: "lo pediste tú en el buscador", ficha: `Lo escribiste en el buscador («${texto.trim()}»). En la siguiente pasada compruebo el .com y escribo su ficha.`,
        com_libre: null, orden: -1000000,
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
        li.textContent = `${(ESTADOS[r.status] || r.status).split(" ")[0]} ${r.nombre}${r.orto_nivel ? " " + ESTRELLAS[r.orto_nivel] : ""}`;
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
  document.getElementById("btn-buscar").addEventListener("click", () => abrirBuscar(true));
  document.getElementById("btn-volver-buscar").addEventListener("click", () => abrirBuscar(false));
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
