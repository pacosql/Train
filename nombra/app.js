// Nombra — buscador de nombres de empresa (tenis / pádel)
//
// Todo nombre que llega a "pendiente" ya viene vetado (com_libre=true
// comprobado vía RDAP + cribado de colisión de marca/empresa en
// ES/EEUU). Este front-end nunca lanza esa comprobación: solo pinta lo
// que ya viene verificado y recoge decisiones.
//
// Decisiones: me_gusta / no_me_gusta / favorito, con comentario
// opcional que se guarda siempre (alimenta las siguientes rondas).
// Un descartado puede recuperarse desde su lista. Las sugerencias del
// usuario (p. ej. "Paco Play") van a nombra_sugerencias para generar
// nombres parecidos en la siguiente tanda.

const REST = `${window.NOMBRA_CONFIG.url}/rest/v1`;
const TABLE = `${window.NOMBRA_CONFIG.tablePrefix}ideas`;
const TABLE_SUG = `${window.NOMBRA_CONFIG.tablePrefix}sugerencias`;
const ANON = window.NOMBRA_CONFIG.anonKey;

const HEADERS = {
  apikey: ANON,
  Authorization: `Bearer ${ANON}`,
  "Content-Type": "application/json",
};

const officialLinks = (name) => [
  { label: "OEPM · marcas (España)", url: "https://www.oepm.es/es/signos_distintivos/" },
  { label: "Registro Mercantil (España)", url: "https://www.rmc.es/" },
  { label: "USPTO · marcas (EEUU)", url: "https://tmsearch.uspto.gov/" },
  { label: "Whois .es manual", url: "https://www.dominios.es/es/" },
  { label: `Buscar "${name}" en Google`, url: `https://www.google.com/search?q=%22${encodeURIComponent(name)}%22` },
];

let cola = [];
let ultimaDecision = null; // { id, statusAnterior, notaAnterior } para deshacer
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

const fetchIdeas = (status) =>
  apiGet(`${TABLE}?status=eq.${status}&order=created_at.asc&select=*`);

// ---- Errores visibles (antes fallaba en silencio y se quedaba en blanco) ----

function mostrarError(err) {
  const banner = document.getElementById("error-banner");
  document.getElementById("error-texto").textContent =
    `No se pudo conectar con la base de datos (${err.message}).`;
  banner.hidden = false;
}

function ocultarError() {
  document.getElementById("error-banner").hidden = true;
}

// ---- Pintado ----

function renderDominioChecks(container, row) {
  container.innerHTML = "";
  const filas = [
    row.com_libre === true ? ["ok", ".com: libre (verificado)"] : ["bad", ".com: no verificado"],
    row.es_libre === true
      ? ["ok", ".es: libre"]
      : ["warn", ".es: no comprobable en automático — usa el enlace manual"],
  ];
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

function renderColision(container, row) {
  container.textContent = row.colision_detalle
    ? `🔎 Cribado de colisión: ${row.colision_detalle}`
    : "🔎 Cribado de colisión: sin detalle registrado.";
}

function pintaSiguienteSwipe() {
  const area = document.getElementById("swipe-area");
  area.innerHTML = "";
  document.getElementById("cola-count").textContent = cola.length;

  if (cola.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "No quedan nombres por decidir. Déjame una sugerencia aquí abajo y te busco más.";
    area.appendChild(p);
    return;
  }

  const item = cola[0];
  const node = document.getElementById("tpl-swipe-card").content.cloneNode(true);
  node.querySelector(".name-text").textContent = item.nombre;
  renderDominioChecks(node.querySelector(".checks"), item);
  renderColision(node.querySelector(".colision-info"), item);

  const notaInput = node.querySelector(".nota-input");
  const botones = [...node.querySelectorAll(".swipe-actions button")];

  const decidir = (status) => async () => {
    if (ocupado) return;
    ocupado = true;
    botones.forEach((b) => (b.disabled = true));
    try {
      await apiPatch(`${TABLE}?id=eq.${item.id}`, {
        status,
        nota: notaInput.value.trim() || null,
      });
      ultimaDecision = { id: item.id, nombre: item.nombre, notaAnterior: item.nota ?? null };
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

  const notaEl = card.querySelector(".nota-guardada");
  if (row.nota) notaEl.textContent = `📝 ${row.nota}`;
  else notaEl.remove();

  const zonaAcciones = card.querySelector(".head-actions");
  for (const a of acciones) {
    zonaAcciones.appendChild(
      botonAccion(a.texto, a.clase, () => apiPatch(`${TABLE}?id=eq.${row.id}`, { status: a.status }))
    );
  }

  renderDominioChecks(card.querySelector(".checks"), row);
  renderColision(card.querySelector(".colision-info"), row);

  const linksEl = card.querySelector(".official-links");
  for (const l of officialLinks(row.nombre)) {
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
      fetchIdeas("me_gusta"),
      fetchIdeas("favorito"),
      fetchIdeas("no_me_gusta"),
    ]);

    cola = pendientes;
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

// ---- Sugerencias del usuario ----

async function enviarSugerencia(ev) {
  ev.preventDefault();
  const input = document.getElementById("input-sugerencia");
  const msg = document.getElementById("sug-msg");
  const texto = input.value.trim();
  if (!texto) return;
  try {
    await apiPost(TABLE_SUG, [{ texto }]);
    input.value = "";
    msg.textContent = "✓ Guardada. La usaré para buscarte nombres parecidos (ya verificados).";
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

  recargarTodo();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
