// Nombra — buscador de nombres de empresa (tenis / pádel)
//
// Todo nombre que llega a "pendiente" ya ha sido vetado ANTES de
// insertarse (com_libre=true comprobado vía RDAP + cribado de colisión
// de marca/empresa en ES/EEUU) — este front-end nunca hace esa
// comprobación ni ofrece un botón para lanzarla; solo pinta lo que ya
// viene verificado. El vetado lo hace Claude con WebSearch + la función
// de Supabase "check-dominio" antes de insertar cada fila.
//
// Flujo deliberadamente mínimo: swipe me_gusta / no_me_gusta /
// definitivo sobre la cola "pendiente" — el comentario está siempre
// visible y se guarda pase lo que pase, para inspirar las siguientes
// rondas. El resto de información (checks, colisión, enlaces) vive
// plegada bajo "más información", nunca en primer plano. Todo el
// estado vive en nombra_ideas (PostgREST directo, sin SDK) para seguir
// la partida desde cualquier dispositivo.

const REST = `${window.NOMBRA_CONFIG.url}/rest/v1`;
const TABLE = `${window.NOMBRA_CONFIG.tablePrefix}ideas`;
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

// ---- REST helpers ----

async function fetchIdeas(status) {
  const res = await fetch(`${REST}/${TABLE}?status=eq.${status}&order=created_at.asc&select=*`, { headers: HEADERS });
  if (!res.ok) return [];
  return res.json();
}

async function updateIdea(id, fields) {
  await fetch(`${REST}/${TABLE}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...HEADERS, Prefer: "return=minimal" },
    body: JSON.stringify(fields),
  });
}

// ---- Render: cola de swipe ----

let cola = [];

function renderDominioChecks(container, row) {
  container.innerHTML = "";
  const rows = [
    row.com_libre === true ? ["ok", ".com: libre (verificado)"] : ["bad", ".com: no verificado"],
    row.es_libre === true
      ? ["ok", ".es: libre"]
      : ["warn", ".es: no comprobable en automático — usa el enlace manual"],
  ];
  for (const [state, label] of rows) {
    const div = document.createElement("div");
    div.className = "check-row";
    const dot = document.createElement("span");
    dot.className = `dot ${state}`;
    div.appendChild(dot);
    const span = document.createElement("span");
    span.textContent = label;
    div.appendChild(span);
    container.appendChild(div);
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
    p.textContent = "No hay más nombres pendientes por decidir.";
    area.appendChild(p);
    return;
  }
  const item = cola[0];
  const tpl = document.getElementById("tpl-swipe-card");
  const node = tpl.content.cloneNode(true);
  node.querySelector(".name-text").textContent = item.nombre;
  renderDominioChecks(node.querySelector(".checks"), item);
  renderColision(node.querySelector(".colision-info"), item);

  const notaInput = node.querySelector(".nota-input");
  const decide = (status) => async () => {
    await updateIdea(item.id, { status, nota: notaInput.value.trim() || null });
    cola.shift();
    await recargarTodo();
  };

  node.querySelector(".btn-like").addEventListener("click", decide("me_gusta"));
  node.querySelector(".btn-dislike").addEventListener("click", decide("no_me_gusta"));
  node.querySelector(".btn-star").addEventListener("click", decide("favorito"));

  area.appendChild(node);
}

// ---- Render: tarjetas de listas (me gusta / definitivos / revisar) ----

function renderCard(container, row, opts) {
  const tpl = document.getElementById("tpl-nombre-card");
  const node = tpl.content.cloneNode(true);
  const card = node.querySelector(".name-card");
  card.querySelector(".name-text").textContent = row.nombre;

  if (row.nota) {
    card.querySelector(".nota-guardada").textContent = `📝 ${row.nota}`;
  }

  const actions = card.querySelector(".head-actions");
  if (opts.marcarDefinitivo) {
    const btnStar = document.createElement("button");
    btnStar.className = "btn-save";
    btnStar.type = "button";
    btnStar.textContent = "⭐ Definitivo";
    btnStar.addEventListener("click", async () => {
      await updateIdea(row.id, { status: "favorito" });
      await recargarTodo();
    });
    actions.appendChild(btnStar);
  }

  renderDominioChecks(card.querySelector(".checks"), row);
  renderColision(card.querySelector(".colision-info"), row);

  const linksEl = card.querySelector(".official-links");
  officialLinks(row.nombre).forEach((l) => {
    const a = document.createElement("a");
    a.className = "btn-link";
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = l.label;
    linksEl.appendChild(a);
  });

  container.appendChild(node);
}

async function recargarTodo() {
  const [pendientes, meGusta, favoritos, descartados] = await Promise.all([
    fetchIdeas("pendiente"),
    fetchIdeas("me_gusta"),
    fetchIdeas("favorito"),
    fetchIdeas("no_me_gusta"),
  ]);

  cola = pendientes;
  pintaSiguienteSwipe();

  const listaMeGusta = document.getElementById("lista-me-gusta");
  listaMeGusta.innerHTML = "";
  if (meGusta.length === 0) listaMeGusta.innerHTML = '<p class="empty">Nada todavía.</p>';
  for (const row of meGusta) renderCard(listaMeGusta, row, { marcarDefinitivo: true });

  const listaDefinitivos = document.getElementById("lista-definitivos");
  listaDefinitivos.innerHTML = "";
  if (favoritos.length === 0) listaDefinitivos.innerHTML = '<p class="empty">Todavía no hay ningún definitivo.</p>';
  for (const row of favoritos) renderCard(listaDefinitivos, row, { marcarDefinitivo: false });

  const listaDescartados = document.getElementById("lista-descartados");
  listaDescartados.innerHTML = "";
  if (descartados.length === 0) listaDescartados.innerHTML = '<p class="empty">Ninguno todavía.</p>';
  for (const row of descartados) {
    const span = document.createElement("div");
    span.className = "name-card";
    span.textContent = row.nombre;
    listaDescartados.appendChild(span);
  }
}

function init() {
  recargarTodo();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
