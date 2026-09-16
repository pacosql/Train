// Nombra — buscador de nombres de empresa (tenis / pádel)
//
// Comprobación de .com: RDAP público de Verisign, consultado en directo
// desde el navegador de quien use la app (no desde ningún servidor
// nuestro). Comprobación de .es: se intenta vía el bootstrap público de
// rdap.org, pero el registro español no siempre expone RDAP, así que se
// degrada con gracia a un enlace manual si la consulta falla. La marca y
// el nombre de empresa (España/EEUU) no tienen API pública: solo se
// enlaza a los buscadores oficiales.

const supabase = window.supabase.createClient(
  window.NOMBRA_CONFIG.url,
  window.NOMBRA_CONFIG.anonKey
);
const TABLE = `${window.NOMBRA_CONFIG.tablePrefix}ideas`;

const SEED_NAMES = [
  { nombre: "padelium", nota: "pádel + sufijo de \"lugar/reino\" (como gimnasium)" },
  { nombre: "smashly", nota: "\"smash\" + terminación amistosa" },
  { nombre: "volea", nota: "el golpe de volea, tal cual, como marca corta" },
  { nombre: "rallypoint", nota: "punto de juego (\"rally\") en inglés" },
  { nombre: "padnet", nota: "pádel + red (net)" },
  { nombre: "tenisia", nota: "tenis + sufijo evocador de lugar/afición" },
  { nombre: "courtmates", nota: "compañeros de pista, en inglés" },
  { nombre: "smashbox", nota: "\"smash\" + \"box\", sonido de marca de producto" },
  { nombre: "padelnova", nota: "pádel + \"nova\" (nuevo)" },
  { nombre: "greypadel", nota: "juego con \"grip\" (agarre de la pala) + pádel" },
  { nombre: "matchup", nota: "\"match\" (partido) + \"up\"" },
  { nombre: "vibrapadel", nota: "vibración del golpe + pádel" },
];

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

async function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/rdap+json" } });
  } finally {
    clearTimeout(t);
  }
}

async function checkTld(slug, tld, url) {
  try {
    const res = await fetchWithTimeout(url, 6000);
    if (res.status === 404) return { state: "ok", label: `${tld}: libre` };
    if (res.status >= 200 && res.status < 300) return { state: "bad", label: `${tld}: registrado` };
    return { state: "warn", label: `${tld}: respuesta ${res.status}, comprueba a mano` };
  } catch (err) {
    return { state: "warn", label: `${tld}: no se pudo comprobar en vivo, comprueba a mano` };
  }
}

function checkCom(slug) {
  return checkTld(slug, ".com", `https://rdap.verisign.com/com/v1/domain/${slug}.com`);
}

function checkEs(slug) {
  return checkTld(slug, ".es", `https://rdap.org/domain/${slug}.es`);
}

function dot(state) {
  const span = document.createElement("span");
  span.className = `dot ${state}`;
  return span;
}

function renderCard(container, nombre, nota) {
  const tpl = document.getElementById("tpl-nombre-card");
  const node = tpl.content.cloneNode(true);
  const card = node.querySelector(".name-card");
  card.querySelector(".name-text").textContent = nombre;
  if (nota) {
    const sub = document.createElement("div");
    sub.className = "sub";
    sub.style.margin = "2px 0 0";
    sub.textContent = nota;
    card.querySelector(".name-head").after(sub);
  }

  const checksEl = card.querySelector(".checks");
  const linksEl = card.querySelector(".official-links");
  officialLinks(nombre).forEach((l) => {
    const a = document.createElement("a");
    a.className = "btn-link";
    a.href = l.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = l.label;
    linksEl.appendChild(a);
  });

  const btnCheck = card.querySelector(".btn-check");
  btnCheck.addEventListener("click", async () => {
    btnCheck.disabled = true;
    btnCheck.textContent = "Comprobando…";
    checksEl.innerHTML = "";
    const slug = slugify(nombre);
    const [com, es] = await Promise.all([checkCom(slug), checkEs(slug)]);
    for (const r of [com, es]) {
      const row = document.createElement("div");
      row.className = "check-row";
      row.appendChild(dot(r.state));
      const txt = document.createElement("span");
      txt.textContent = r.label;
      row.appendChild(txt);
      checksEl.appendChild(row);
    }
    btnCheck.disabled = false;
    btnCheck.textContent = "Volver a comprobar";
  });

  card.querySelector(".btn-save").addEventListener("click", () => saveIdea(nombre));

  container.appendChild(node);
}

async function saveIdea(nombre) {
  const { error } = await supabase.from(TABLE).insert({ nombre });
  if (error) {
    alert(`No se pudo guardar: ${error.message}`);
    return;
  }
  await loadSaved();
}

async function loadSaved() {
  const list = document.getElementById("lista-guardadas");
  list.innerHTML = "";
  const { data, error } = await supabase
    .from(TABLE)
    .select("nombre, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = `No se pudieron cargar las ideas guardadas (${error.message}).`;
    list.appendChild(p);
    return;
  }
  if (!data || data.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "Todavía no hay ninguna idea guardada.";
    list.appendChild(p);
    return;
  }
  const seen = new Set();
  for (const row of data) {
    if (seen.has(row.nombre)) continue;
    seen.add(row.nombre);
    renderCard(list, row.nombre, null);
  }
}

function init() {
  const listaNombres = document.getElementById("lista-nombres");
  for (const s of SEED_NAMES) renderCard(listaNombres, s.nombre, s.nota);

  document.getElementById("form-nuevo").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const input = document.getElementById("input-nombre");
    const nombre = slugify(input.value.trim());
    if (!nombre) return;
    renderCard(listaNombres, nombre, "añadido por ti");
    input.value = "";
    listaNombres.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  loadSaved();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
