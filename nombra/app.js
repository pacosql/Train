// Nombra — buscador de nombres de empresa (tenis / pádel)
//
// Flujo: cola de nombres "pendiente" -> swipe me_gusta/no_me_gusta ->
// cada "me gusta" genera variantes parecidas -> los mejores se marcan
// "favorito" (la shortlist definitiva). Todo el estado vive en la tabla
// nombra_ideas de Supabase (PostgREST directo, sin SDK) para que se
// pueda seguir la partida desde cualquier dispositivo o desde una
// futura rutina automática.
//
// La comprobación de .com/.es NO se hace desde este navegador: se llama
// a la función de Supabase "check-dominio", que corre en la
// infraestructura de Supabase (no tiene las restricciones de red de un
// sandbox ni las de CORS de un navegador) y guarda el resultado
// directamente en la fila correspondiente.

const REST = `${window.NOMBRA_CONFIG.url}/rest/v1`;
const FN_CHECK = `${window.NOMBRA_CONFIG.url}/functions/v1/check-dominio`;
const TABLE = `${window.NOMBRA_CONFIG.tablePrefix}ideas`;
const ANON = window.NOMBRA_CONFIG.anonKey;

const HEADERS = {
  apikey: ANON,
  Authorization: `Bearer ${ANON}`,
  "Content-Type": "application/json",
};

const ROOTS = ["pad", "padel", "smash", "volea", "rally", "court", "match", "net", "grip", "spin", "ace", "drive", "slice", "swing", "tenis", "raqueta", "bote", "golpe"];
const PREFIXES = ["vibra", "grey", "neo", "ultra", "pro", "play", "top", "full"];
const SUFFIXES = ["ly", "ium", "nova", "ia", "box", "up", "point", "mates", "io", "hub", "ista", "ola", "ino"];

const officialLinks = (name) => [
  { label: "OEPM · marcas (España)", url: "https://www.oepm.es/es/signos_distintivos/" },
  { label: "Registro Mercantil (España)", url: "https://www.rmc.es/" },
  { label: "USPTO · marcas (EEUU)", url: "https://tmsearch.uspto.gov/" },
  { label: "Whois .es manual", url: "https://www.dominios.es/es/" },
  { label: `Buscar "${name}" en Google`, url: `https://www.google.com/search?q=%22${encodeURIComponent(name)}%22` },
];

function slugify(raw) {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);
}

function generarParecidos(nombre, n = 3) {
  let raiz = nombre;
  for (const s of SUFFIXES) {
    if (nombre.endsWith(s) && nombre.length - s.length >= 3) {
      raiz = nombre.slice(0, -s.length);
      break;
    }
  }
  for (const p of PREFIXES) {
    if (nombre.startsWith(p) && nombre.length - p.length >= 3) {
      raiz = nombre.slice(p.length);
      break;
    }
  }
  const raices = [raiz, ...ROOTS.filter((r) => nombre.includes(r))];
  const out = new Set();
  let attempts = 0;
  while (out.size < n && attempts < 60) {
    attempts++;
    const r = raices[Math.floor(Math.random() * raices.length)];
    const usePrefix = Math.random() < 0.5;
    const piece = usePrefix
      ? PREFIXES[Math.floor(Math.random() * PREFIXES.length)]
      : SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
    const candidate = usePrefix ? `${piece}${r}` : `${r}${piece}`;
    if (candidate !== nombre && candidate.length >= 4 && candidate.length <= 24) out.add(candidate);
  }
  return [...out];
}

// ---- REST helpers ----

async function fetchIdeas(status) {
  const res = await fetch(`${REST}/${TABLE}?status=eq.${status}&order=created_at.asc&select=*`, { headers: HEADERS });
  if (!res.ok) return [];
  return res.json();
}

async function updateStatus(id, status) {
  await fetch(`${REST}/${TABLE}?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...HEADERS, Prefer: "return=minimal" },
    body: JSON.stringify({ status }),
  });
}

async function insertIdeas(rows) {
  await fetch(`${REST}/${TABLE}`, {
    method: "POST",
    headers: { ...HEADERS, Prefer: "return=minimal" },
    body: JSON.stringify(rows),
  }).catch(() => {});
}

async function checkDominio(nombre) {
  const res = await fetch(FN_CHECK, {
    method: "POST",
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" },
    body: JSON.stringify({ nombre }),
  });
  return res.json();
}

// ---- Render: cola de swipe ----

let cola = [];

function pintaSiguienteSwipe() {
  const area = document.getElementById("swipe-area");
  area.innerHTML = "";
  document.getElementById("cola-count").textContent = cola.length;
  if (cola.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "No hay más nombres pendientes. Añade uno abajo.";
    area.appendChild(p);
    return;
  }
  const item = cola[0];
  const tpl = document.getElementById("tpl-swipe-card");
  const node = tpl.content.cloneNode(true);
  node.querySelector(".name-text").textContent = item.nombre;
  node.querySelector(".nota").textContent = item.origen === "generado" ? "generado a partir de un me gusta" : item.origen === "manual" ? "añadido por ti" : "";

  node.querySelector(".btn-like").addEventListener("click", async () => {
    await updateStatus(item.id, "me_gusta");
    const parecidos = generarParecidos(slugify(item.nombre), 3).map((nombre) => ({
      nombre,
      origen: "generado",
      generado_de: item.id,
    }));
    await insertIdeas(parecidos);
    cola.shift();
    await recargarTodo();
  });
  node.querySelector(".btn-dislike").addEventListener("click", async () => {
    await updateStatus(item.id, "no_me_gusta");
    cola.shift();
    await recargarTodo();
  });

  area.appendChild(node);
}

// ---- Render: tarjetas con comprobación de dominio ----

function renderDominioChecks(container, row) {
  container.innerHTML = "";
  const rows = [
    row.com_libre === true
      ? ["ok", ".com: libre"]
      : row.com_libre === false
      ? ["bad", ".com: registrado"]
      : ["pending", ".com: sin comprobar"],
    row.es_libre === true
      ? ["ok", ".es: libre"]
      : row.es_libre === false
      ? ["bad", ".es: registrado"]
      : ["warn", row.es_detalle ? ".es: no comprobable automáticamente" : ".es: sin comprobar"],
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

function renderCard(container, row, opts) {
  const tpl = document.getElementById("tpl-nombre-card");
  const node = tpl.content.cloneNode(true);
  const card = node.querySelector(".name-card");
  card.querySelector(".name-text").textContent = row.nombre;

  const actions = card.querySelector(".head-actions");
  const btnCheck = document.createElement("button");
  btnCheck.className = "btn-check";
  btnCheck.type = "button";
  btnCheck.textContent = "Comprobar dominio";
  actions.appendChild(btnCheck);

  if (opts.marcarDefinitivo) {
    const btnStar = document.createElement("button");
    btnStar.className = "btn-save";
    btnStar.type = "button";
    btnStar.textContent = "⭐ Definitivo";
    btnStar.addEventListener("click", async () => {
      await updateStatus(row.id, "favorito");
      await recargarTodo();
    });
    actions.appendChild(btnStar);
  }

  const checksEl = card.querySelector(".checks");
  renderDominioChecks(checksEl, row);

  btnCheck.addEventListener("click", async () => {
    btnCheck.disabled = true;
    btnCheck.textContent = "Comprobando…";
    try {
      const result = await checkDominio(row.nombre);
      row.com_libre = result.com?.libre ?? null;
      row.es_libre = result.es?.libre ?? null;
      row.es_detalle = result.es?.detalle ?? null;
      renderDominioChecks(checksEl, row);
    } catch (err) {
      checksEl.innerHTML = `<p class="empty">No se pudo comprobar: ${err}</p>`;
    }
    btnCheck.disabled = false;
    btnCheck.textContent = "Volver a comprobar";
  });

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
  document.getElementById("form-nuevo").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const input = document.getElementById("input-nombre");
    const nombre = slugify(input.value.trim());
    if (!nombre) return;
    await insertIdeas([{ nombre, origen: "manual" }]);
    input.value = "";
    await recargarTodo();
  });

  recargarTodo();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
