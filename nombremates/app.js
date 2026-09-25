// Nombre Mates — buscador de nombres para una app de matemáticas para
// niños en España (sucesora de la idea "mates10.com").
//
// Todo nombre que llega a "pendiente" ya viene vetado desde fuera:
// .com libre comprobado vía RDAP de Verisign + cribado de notoriedad
// (App Store España, Wikipedia es/en, .net/.org registrados). Este
// front-end nunca lanza esa comprobación: solo pinta lo que ya viene
// verificado y recoge decisiones y comentarios.
//
// Decisiones: me_gusta / no_me_gusta / favorito, con comentario
// opcional (escrito o dictado por voz) que alimenta la siguiente tanda.
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
let ultimaDecision = null; // { id, notaAnterior } para deshacer
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

const fetchIdeas = (status, orden = "id.asc") =>
  apiGet(`${TABLE}?status=eq.${status}&order=${orden}&select=*`);

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
  container.textContent = row.colision_detalle
    ? `🔎 Notoriedad: ${row.colision_detalle}`
    : "🔎 Notoriedad: sin detalle registrado.";
}

function pintaSiguienteSwipe() {
  pararDictado();
  const area = document.getElementById("swipe-area");
  area.innerHTML = "";
  document.getElementById("cola-count").textContent = cola.length;

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
  node.querySelector(".dominio").textContent = `${dominio(item)} libre`;
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
        nota: notaInput.value.trim() || null,
        decidido_at: new Date().toISOString(),
      });
      ultimaDecision = { id: item.id, notaAnterior: item.nota ?? null };
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
  document.getElementById(idContador).textContent = filas.length ? `(${filas.length})` : "";
  if (filas.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = vacio;
    contenedor.appendChild(p);
    return;
  }
  for (const row of filas) renderCard(contenedor, row, acciones);
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
    const [pendientes, meGusta, favoritos, descartados] = await Promise.all([
      fetchIdeas("pendiente"),
      fetchIdeas("me_gusta", "decidido_at.desc.nullslast"),
      fetchIdeas("favorito", "decidido_at.desc.nullslast"),
      fetchIdeas("no_me_gusta", "decidido_at.desc.nullslast"),
    ]);

    cola = pendientes;
    const decididos = meGusta.length + favoritos.length + descartados.length;
    const total = decididos + pendientes.length;
    document.getElementById("decididos-count").textContent = decididos;
    document.getElementById("barra-progreso").style.width = total ? `${(100 * decididos) / total}%` : "0%";
    pintaSiguienteSwipe();

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

    document.getElementById("btn-deshacer").hidden = ultimaDecision === null;
    await pintaSugerencias();
    ocultarError();
  } catch (err) {
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
    await apiPatch(`${TABLE}?id=eq.${ultimaDecision.id}`, {
      status: "pendiente",
      nota: ultimaDecision.notaAnterior,
      decidido_at: null,
    });
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
