// App de reservas de "Eduardo Carrillo Tenis & Pádel Club".
//
// Prototipo sin autenticación: cualquier visitante puede leer/crear/cancelar
// reservas (RLS de Supabase abierta a "anon"). Para producción real haría
// falta login y políticas RLS por usuario; aquí "Mis reservas" se resuelve
// guardando el id + un "cancel_token" en localStorage del propio navegador.

const OPEN_HOUR = 9; // 9:00
const CLOSE_HOUR = 23; // 23:00
const SLOT_MINUTES = 30;
const DURATIONS = [60, 90, 120];
const DAYS_AHEAD = 14;
const MIS_RESERVAS_KEY = "pistas_mis_reservas";
const LAST_CUSTOMER_KEY = "pistas_last_customer";

const COURT_TYPES = {
  tenis_dura: { label: "Tenis · pista dura", color: "#2f6fed" },
  tenis_tierra: { label: "Tenis · tierra batida", color: "#b5652d" },
  tenis_cesped: { label: "Tenis · hierba", color: "#2f9e44" },
  padel: { label: "Pádel", color: "#8b5cf6" },
};
const TYPE_ORDER = ["tenis_dura", "tenis_tierra", "tenis_cesped", "padel"];

const { url, anonKey } = window.PISTAS_CONFIG;
const client = supabase.createClient(url, anonKey);

const state = {
  courts: [],
  reservas: [], // reservas del día seleccionado
  dayOffset: 0,
  duration: 60,
  startMinutes: null, // minutos desde medianoche
};

// ---------- Utilidades de fecha/hora ----------

function dateForOffset(offset) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

function dateWithMinutes(baseDate, minutes) {
  const d = new Date(baseDate);
  d.setHours(0, minutes, 0, 0);
  return d;
}

function fmtMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function fmtDayChip(offset) {
  const d = dateForOffset(offset);
  const sub = d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  if (offset === 0) return { top: "Hoy", sub };
  if (offset === 1) return { top: "Mañana", sub };
  return { top: d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", ""), sub };
}

function fmtShortDate(date) {
  return date.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "");
}

function fmtLongDate(date) {
  return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function nowRoundedMinutes() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return Math.ceil(mins / SLOT_MINUTES) * SLOT_MINUTES;
}

// Un hueco de hoy que ya ha empezado se enseña (el día se ve completo desde
// la apertura) pero no se puede reservar.
function isPastSlot(offset, minutes) {
  return offset === 0 && minutes < nowRoundedMinutes();
}

function validStartMinutes(duration) {
  const openMin = OPEN_HOUR * 60;
  const lastStart = CLOSE_HOUR * 60 - duration;
  const list = [];
  for (let m = openMin; m <= lastStart; m += SLOT_MINUTES) list.push(m);
  return list;
}

function selectableStartMinutes(duration, offset) {
  return validStartMinutes(duration).filter((m) => !isPastSlot(offset, m));
}

// ---------- Carga de datos ----------

async function loadCourts() {
  const { data, error } = await client
    .from("pistas_courts")
    .select("id,name,type,sort_order")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error(error);
    document.getElementById("courts-map").innerHTML =
      '<p class="map-msg">No se pudo cargar la lista de pistas. Comprueba la conexión y recarga.</p>';
    return;
  }
  state.courts = data;
}

async function loadReservasForDay(offset) {
  const dayStart = dateForOffset(offset);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const { data, error } = await client
    .from("pistas_reservas")
    .select("id,court_id,start_time,end_time")
    .lt("start_time", dayEnd.toISOString())
    .gt("end_time", dayStart.toISOString())
    .order("start_time", { ascending: true });
  if (error) {
    console.error(error);
    state.reservas = [];
    return;
  }
  state.reservas = data.map((r) => ({ ...r, start: new Date(r.start_time), end: new Date(r.end_time) }));
}

// ---------- Disponibilidad ----------

function reservasForCourt(courtId) {
  return state.reservas.filter((r) => r.court_id === courtId);
}

function isRangeFree(courtId, start, end) {
  return reservasForCourt(courtId).every((r) => end <= r.start || start >= r.end);
}

// Minutos libres consecutivos desde `startMinutes` para esa pista, tope 120.
function freeRunMinutes(courtId, startMinutes, dayOffset) {
  const base = dateForOffset(dayOffset);
  const closeMin = CLOSE_HOUR * 60;
  let m = startMinutes;
  while (m < closeMin && m - startMinutes < 120) {
    const cellStart = dateWithMinutes(base, m);
    const cellEnd = dateWithMinutes(base, m + SLOT_MINUTES);
    if (!isRangeFree(courtId, cellStart, cellEnd)) break;
    m += SLOT_MINUTES;
  }
  return m - startMinutes;
}

function availableDurationsAt(courtId, startMinutes, dayOffset) {
  const closeMin = CLOSE_HOUR * 60;
  const free = freeRunMinutes(courtId, startMinutes, dayOffset);
  return DURATIONS.filter((d) => startMinutes + d <= closeMin && d <= free);
}

// ---------- Render: filtros ----------

function renderDayChips() {
  const wrap = document.getElementById("day-chips");
  wrap.innerHTML = "";
  for (let offset = 0; offset < DAYS_AHEAD; offset++) {
    const { top, sub } = fmtDayChip(offset);
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (offset === state.dayOffset ? " active" : "");
    chip.innerHTML = `${top}<span class="chip-sub">${sub}</span>`;
    chip.addEventListener("click", () => selectDay(offset));
    wrap.appendChild(chip);
  }
}

function renderDurationChips() {
  const wrap = document.getElementById("duration-chips");
  wrap.innerHTML = "";
  for (const d of DURATIONS) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (d === state.duration ? " active" : "");
    chip.textContent = `${d} min`;
    chip.addEventListener("click", () => selectDuration(d));
    wrap.appendChild(chip);
  }
}

function renderTimeChips() {
  const wrap = document.getElementById("time-chips");
  wrap.innerHTML = "";
  const all = validStartMinutes(state.duration);
  const selectable = selectableStartMinutes(state.duration, state.dayOffset);

  if (!selectable.includes(state.startMinutes)) {
    state.startMinutes = selectable[0] ?? null;
  }

  for (const m of all) {
    const past = isPastSlot(state.dayOffset, m);
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (m === state.startMinutes ? " active" : "") + (past ? " past" : "");
    chip.disabled = past;
    chip.textContent = fmtMinutes(m);
    if (!past) chip.addEventListener("click", () => selectStart(m));
    wrap.appendChild(chip);
  }
  scrollActiveChipIntoView(wrap);
}

function scrollActiveChipIntoView(wrap) {
  const chip = wrap.querySelector(".chip.active");
  if (!chip || wrap.clientWidth === 0) return;
  // Deja asomar el hueco anterior (tachado si ya pasó) para que se vea que
  // la fila empieza en la apertura, no en la hora actual.
  const left = chip.getBoundingClientRect().left - wrap.getBoundingClientRect().left + wrap.scrollLeft;
  wrap.scrollLeft = Math.max(0, left - 64);
}

function selectDay(offset) {
  state.dayOffset = offset;
  renderDayChips();
  loadReservasForDay(offset).then(() => {
    renderTimeChips();
    renderCourtsMap();
  });
}

function selectDuration(d) {
  state.duration = d;
  renderDurationChips();
  renderTimeChips();
  renderCourtsMap();
}

function selectStart(m) {
  state.startMinutes = m;
  renderTimeChips();
  renderCourtsMap();
}

// ---------- Render: mapa de pistas ----------

function courtSvg(type, color, busy) {
  const fill = color;
  const cross = busy
    ? `<g fill="none" stroke-linecap="round"><g stroke="rgba(255,255,255,0.75)" stroke-width="4.5"><line x1="7" y1="7" x2="113" y2="65" /><line x1="113" y1="7" x2="7" y2="65" /></g><g stroke="#e5484d" stroke-width="1.8"><line x1="7" y1="7" x2="113" y2="65" /><line x1="113" y1="7" x2="7" y2="65" /></g></g>`
    : "";
  if (type === "padel") {
    // Pista de pádel: más pequeña (20x10 m), cerrada por paredes de cristal
    // con malla metálica en el centro de los laterales, sin líneas de
    // dobles: solo dos líneas de saque y la línea central entre ellas.
    return `<svg class="court-mini" viewBox="0 0 120 72" aria-hidden="true">
      <rect x="2" y="2" width="116" height="68" rx="6" fill="#e6ebe3" />
      <rect x="18" y="14" width="84" height="44" fill="${fill}" />
      <g fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round">
        <line x1="30" y1="14" x2="30" y2="58" /><line x1="90" y1="14" x2="90" y2="58" />
        <line x1="30" y1="36" x2="90" y2="36" />
      </g>
      <line x1="60" y1="12" x2="60" y2="60" stroke="#fff" stroke-width="2.2" stroke-dasharray="3 2" />
      <g fill="none" stroke="rgba(120,190,235,0.9)" stroke-width="3.5">
        <line x1="18" y1="14" x2="18" y2="58" /><line x1="102" y1="14" x2="102" y2="58" />
        <line x1="18" y1="14" x2="36" y2="14" /><line x1="84" y1="14" x2="102" y2="14" />
        <line x1="18" y1="58" x2="36" y2="58" /><line x1="84" y1="58" x2="102" y2="58" />
      </g>
      <g fill="none" stroke="rgba(70,80,90,0.7)" stroke-width="3.5" stroke-dasharray="1.5 2">
        <line x1="36" y1="14" x2="84" y2="14" /><line x1="36" y1="58" x2="84" y2="58" />
      </g>
      ${cross}
    </svg>`;
  }
  return `<svg class="court-mini" viewBox="0 0 120 72" aria-hidden="true">
    <rect x="2" y="2" width="116" height="68" rx="6" fill="${fill}" />
    <g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round">
      <rect x="12" y="9" width="96" height="54" />
      <line x1="12" y1="16" x2="108" y2="16" /><line x1="12" y1="56" x2="108" y2="56" />
      <line x1="36" y1="16" x2="36" y2="56" /><line x1="84" y1="16" x2="84" y2="56" />
      <line x1="36" y1="36" x2="84" y2="36" />
    </g>
    <line x1="60" y1="5" x2="60" y2="67" stroke="#fff" stroke-width="2.4" stroke-dasharray="3 2" />
    ${cross}
  </svg>`;
}

function renderCourtsMap() {
  const wrap = document.getElementById("courts-map");
  const summary = document.getElementById("map-summary");
  wrap.innerHTML = "";

  if (state.startMinutes == null) {
    summary.textContent = "";
    wrap.innerHTML =
      '<p class="map-msg">Hoy ya no quedan huecos para esta duración. ' +
      '<button type="button" class="link-btn" id="go-tomorrow">Ver mañana</button></p>';
    document.getElementById("go-tomorrow").addEventListener("click", () => selectDay(1));
    return;
  }

  const base = dateForOffset(state.dayOffset);
  const start = dateWithMinutes(base, state.startMinutes);
  const end = dateWithMinutes(base, state.startMinutes + state.duration);
  let freeCount = 0;

  for (const type of TYPE_ORDER) {
    const courts = state.courts.filter((c) => c.type === type);
    if (courts.length === 0) continue;
    const meta = COURT_TYPES[type];

    const group = document.createElement("div");
    group.className = "type-group";
    group.innerHTML = `<h4><span class="dot" style="background:${meta.color}"></span>${meta.label}</h4>`;

    const grid = document.createElement("div");
    grid.className = "court-grid";

    for (const court of courts) {
      const free = isRangeFree(court.id, start, end);
      if (free) freeCount++;

      const card = document.createElement("button");
      card.type = "button";
      card.className = "court-card " + (free ? "is-free" : "is-busy");
      card.innerHTML = `
        ${courtSvg(type, meta.color, !free)}
        <span class="name">${escapeHtml(court.name)}</span>
        <span class="status ${free ? "free" : "busy"}">${free ? "Libre" : "Ocupada"}</span>
        <span class="schedule-link">Ver horario del día</span>
      `;
      card.addEventListener("click", (ev) => {
        if (free && !ev.target.classList.contains("schedule-link")) {
          openBooking(court, state.startMinutes);
        } else {
          openSchedule(court);
        }
      });
      grid.appendChild(card);
    }

    group.appendChild(grid);
    wrap.appendChild(group);
  }

  summary.textContent =
    `${freeCount} de ${state.courts.length} pistas libres · ${fmtShortDate(base)} · ` +
    `${fmtMinutes(state.startMinutes)}–${fmtMinutes(state.startMinutes + state.duration)}`;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Dialog: horario del día ----------

const dlgSchedule = document.getElementById("dlg-schedule");

function openSchedule(court) {
  document.getElementById("sched-title").textContent = court.name;
  document.getElementById("sched-summary").textContent = fmtLongDate(dateForOffset(state.dayOffset));

  const grid = document.getElementById("sched-grid");
  grid.innerHTML = "";
  const openMin = OPEN_HOUR * 60;
  const closeMin = CLOSE_HOUR * 60;
  const base = dateForOffset(state.dayOffset);

  for (let m = openMin; m < closeMin; m += SLOT_MINUTES) {
    const cellStart = dateWithMinutes(base, m);
    const cellEnd = dateWithMinutes(base, m + SLOT_MINUTES);
    const free = isRangeFree(court.id, cellStart, cellEnd);
    const past = isPastSlot(state.dayOffset, m);

    const cell = document.createElement("div");
    cell.className = "day-cell " + (free ? "free" : "busy") + (past ? " past" : "");
    cell.textContent = fmtMinutes(m);
    if (free && !past) {
      cell.addEventListener("click", () => {
        dlgSchedule.close();
        selectStart(m);
        openBooking(court, m);
      });
    }
    grid.appendChild(cell);
  }
  dlgSchedule.showModal();
}

// ---------- Dialog: confirmar reserva ----------

const dlgBooking = document.getElementById("dlg-booking");
let bookingCourt = null;
let bookingStart = null;

function getLastCustomer() {
  try {
    return JSON.parse(localStorage.getItem(LAST_CUSTOMER_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveLastCustomer(name, phone) {
  try {
    localStorage.setItem(LAST_CUSTOMER_KEY, JSON.stringify({ name, phone }));
  } catch {
    /* noop */
  }
}

function openBooking(court, startMinutes) {
  bookingCourt = court;
  bookingStart = startMinutes;

  const options = availableDurationsAt(court.id, startMinutes, state.dayOffset);
  const durationSelect = document.getElementById("booking-duration");
  durationSelect.innerHTML = options.map((d) => `<option value="${d}">${d} min</option>`).join("");
  durationSelect.value = options.includes(state.duration) ? String(state.duration) : String(options[0]);

  updateBookingSummary();
  durationSelect.onchange = updateBookingSummary;

  const last = getLastCustomer();
  document.getElementById("booking-name").value = last.name || "";
  document.getElementById("booking-phone").value = last.phone || "";
  document.getElementById("booking-msg").textContent = "";
  document.getElementById("booking-msg").className = "form-msg";
  dlgBooking.showModal();
}

function updateBookingSummary() {
  const duration = Number(document.getElementById("booking-duration").value);
  const end = bookingStart + duration;
  const meta = COURT_TYPES[bookingCourt.type];
  document.getElementById("booking-summary").innerHTML =
    `<span class="dot" style="background:${meta.color}"></span>` +
    `<strong>${escapeHtml(bookingCourt.name)}</strong> · ${fmtLongDate(dateForOffset(state.dayOffset))}, ` +
    `${fmtMinutes(bookingStart)}–${fmtMinutes(end)} (${duration} min)`;
}

document.getElementById("booking-confirm").addEventListener("click", async () => {
  const duration = Number(document.getElementById("booking-duration").value);
  const name = document.getElementById("booking-name").value.trim();
  const phone = document.getElementById("booking-phone").value.trim();
  const msg = document.getElementById("booking-msg");

  if (!name) {
    msg.textContent = "Escribe tu nombre para reservar.";
    msg.className = "form-msg err";
    document.getElementById("booking-name").focus();
    return;
  }

  const base = dateForOffset(state.dayOffset);
  const start = dateWithMinutes(base, bookingStart);
  const end = dateWithMinutes(base, bookingStart + duration);

  const confirmBtn = document.getElementById("booking-confirm");
  confirmBtn.disabled = true;
  msg.textContent = "Reservando…";
  msg.className = "form-msg";

  const { data, error } = await client
    .from("pistas_reservas")
    .insert({
      court_id: bookingCourt.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: duration,
      customer_name: name,
      customer_phone: phone || null,
    })
    .select("id,cancel_token,start_time,end_time")
    .single();

  confirmBtn.disabled = false;

  if (error) {
    if (error.code === "23P01") {
      msg.textContent = "Uy, alguien ha reservado ese hueco justo ahora. Elige otro horario.";
    } else {
      msg.textContent = `No se pudo reservar: ${error.message}`;
    }
    msg.className = "form-msg err";
    await loadReservasForDay(state.dayOffset);
    renderCourtsMap();
    return;
  }

  saveLastCustomer(name, phone);
  saveMisReserva({
    id: data.id,
    cancel_token: data.cancel_token,
    court_name: bookingCourt.name,
    court_type: bookingCourt.type,
    start: data.start_time,
    end: data.end_time,
  });
  renderMisReservasBadge();

  msg.textContent = "¡Reserva confirmada! 🎾";
  msg.className = "form-msg ok";
  await loadReservasForDay(state.dayOffset);
  renderCourtsMap();
  showToast(`Pista reservada: ${bookingCourt.name} a las ${fmtMinutes(bookingStart)}`);
  setTimeout(() => dlgBooking.close(), 900);
});

// ---------- Mis reservas (localStorage) ----------

function getMisReservas() {
  try {
    return JSON.parse(localStorage.getItem(MIS_RESERVAS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveMisReserva(entry) {
  try {
    const list = getMisReservas();
    list.push(entry);
    localStorage.setItem(MIS_RESERVAS_KEY, JSON.stringify(list));
  } catch {
    // localStorage no disponible (modo privado, etc.) — no es crítico.
  }
}

function removeMisReserva(id) {
  try {
    const list = getMisReservas().filter((r) => r.id !== id);
    localStorage.setItem(MIS_RESERVAS_KEY, JSON.stringify(list));
  } catch {
    /* noop */
  }
}

function renderMisReservasBadge() {
  const now = new Date();
  const upcoming = getMisReservas().filter((r) => new Date(r.end) > now).length;
  const badge = document.getElementById("mis-reservas-badge");
  badge.textContent = String(upcoming);
  badge.hidden = upcoming === 0;
}

const dlgMisReservas = document.getElementById("dlg-mis-reservas");

function renderMisReservas() {
  const listEl = document.getElementById("mis-reservas-list");
  const list = getMisReservas().sort((a, b) => new Date(a.start) - new Date(b.start));
  listEl.innerHTML = "";

  if (list.length === 0) {
    listEl.innerHTML = '<li class="empty">Todavía no has reservado ninguna pista.</li>';
    return;
  }

  const now = new Date();
  for (const r of list) {
    const start = new Date(r.start);
    const end = new Date(r.end);
    const past = end < now;
    const color = (COURT_TYPES[r.court_type] || {}).color || "var(--muted)";
    const li = document.createElement("li");
    if (past) li.classList.add("past");
    li.innerHTML = `
      <div class="meta">
        <strong><span class="dot" style="background:${color}"></span>${escapeHtml(r.court_name)}</strong>
        <span>${fmtShortDate(start)} · ${start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}–${end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}${past ? " · finalizada" : ""}</span>
      </div>
    `;
    if (!past) {
      const btn = document.createElement("button");
      btn.className = "btn danger";
      btn.style.flex = "none";
      btn.textContent = "Cancelar";
      btn.addEventListener("click", () => cancelMisReserva(r));
      li.appendChild(btn);
    }
    listEl.appendChild(li);
  }
}

async function cancelMisReserva(r) {
  if (!confirm(`¿Cancelar la reserva de ${r.court_name}?`)) return;
  const { error } = await client
    .from("pistas_reservas")
    .delete()
    .eq("id", r.id)
    .eq("cancel_token", r.cancel_token);
  if (error) {
    alert(`No se pudo cancelar: ${error.message}`);
    return;
  }
  removeMisReserva(r.id);
  renderMisReservas();
  renderMisReservasBadge();
  await loadReservasForDay(state.dayOffset);
  renderCourtsMap();
  showToast("Reserva cancelada");
}

// ---------- Toast ----------

function showToast(text) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

// ---------- Wiring general ----------

for (const dlg of document.querySelectorAll("dialog")) {
  dlg.addEventListener("click", (ev) => {
    if (ev.target === dlg) dlg.close();
  });
  dlg.querySelectorAll("[data-close]").forEach((btn) => btn.addEventListener("click", () => dlg.close()));
}

document.getElementById("btn-reservar").addEventListener("click", () => {
  document.getElementById("cover").hidden = true;
  document.getElementById("app").hidden = false;
  window.scrollTo(0, 0);
  scrollActiveChipIntoView(document.getElementById("time-chips"));
});

document.getElementById("btn-back").addEventListener("click", () => {
  document.getElementById("app").hidden = true;
  document.getElementById("cover").hidden = false;
});

document.getElementById("btn-mis-reservas").addEventListener("click", () => {
  renderMisReservas();
  dlgMisReservas.showModal();
});

// ---------- Portada (catálogo + selector) ----------

const COVER_KEY = "pistas_cover";
const COVERS = window.PISTAS_COVERS;
let currentCoverIndex = 0;

function applyCover(id) {
  const idx = Math.max(0, COVERS.findIndex((c) => c.id === id));
  const c = COVERS[idx];
  currentCoverIndex = idx;
  const cover = document.getElementById("cover");
  cover.className = `font-${c.font} layout-${c.layout}${c.light ? " is-light" : ""}`;
  cover.style.setProperty("--cv-bg", c.vars.bg);
  cover.style.setProperty("--cv-text", c.vars.text);
  cover.style.setProperty("--cv-sub", c.vars.sub);
  cover.style.setProperty("--cv-btn", c.vars.btn);
  cover.style.setProperty("--cv-btn-text", c.vars.btnText);
  document.getElementById("cover-bg").innerHTML = c.art();
  document.getElementById("picker-label").innerHTML =
    `<strong>${escapeHtml(c.name)}</strong>${idx + 1} / ${COVERS.length}`;
}

function getSavedCoverLocal() {
  try {
    return localStorage.getItem(COVER_KEY);
  } catch {
    return null;
  }
}

async function loadSavedCover() {
  const { data, error } = await client.from("pistas_config").select("value").eq("key", "cover").maybeSingle();
  if (error || !data || !data.value || !data.value.id) return;
  if (data.value.id !== COVERS[currentCoverIndex].id && !document.body.classList.contains("picking")) {
    applyCover(data.value.id);
  }
  try {
    localStorage.setItem(COVER_KEY, data.value.id);
  } catch {
    /* noop */
  }
}

let pickerWired = false;

function openCoverPicker() {
  document.body.classList.add("picking");
  document.getElementById("cover-picker").hidden = false;
  applyCover(COVERS[currentCoverIndex].id);
  if (pickerWired) return;
  pickerWired = true;

  const go = (delta) => applyCover(COVERS[(currentCoverIndex + delta + COVERS.length) % COVERS.length].id);
  document.getElementById("picker-prev").addEventListener("click", () => go(-1));
  document.getElementById("picker-next").addEventListener("click", () => go(1));
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "ArrowLeft") go(-1);
    if (ev.key === "ArrowRight") go(1);
  });

  document.getElementById("picker-select").addEventListener("click", async () => {
    const btn = document.getElementById("picker-select");
    const id = COVERS[currentCoverIndex].id;
    btn.disabled = true;
    btn.textContent = "Guardando…";
    const { error } = await client
      .from("pistas_config")
      .upsert({ key: "cover", value: { id }, updated_at: new Date().toISOString() });
    btn.disabled = false;
    btn.textContent = "Seleccionar esta portada";
    if (error) {
      alert(`No se pudo guardar la portada: ${error.message}`);
      return;
    }
    try {
      localStorage.setItem(COVER_KEY, id);
    } catch {
      /* noop */
    }
    document.body.classList.remove("picking");
    document.getElementById("cover-picker").hidden = true;
    history.replaceState(null, "", location.pathname);
    showToast(`Portada "${COVERS[currentCoverIndex].name}" guardada para todos`);
  });
}

function setupCoverPicker() {
  document.getElementById("open-picker").addEventListener("click", openCoverPicker);
  if (new URLSearchParams(location.search).has("portadas") || location.hash === "#portadas") openCoverPicker();
}

async function init() {
  applyCover(getSavedCoverLocal() || COVERS[0].id);
  setupCoverPicker();
  loadSavedCover();

  // Si hoy ya no queda ningún hueco reservable, arranca en mañana.
  state.dayOffset = selectableStartMinutes(state.duration, 0).length > 0 ? 0 : 1;
  state.startMinutes = selectableStartMinutes(state.duration, state.dayOffset)[0] ?? null;

  await loadCourts();
  await loadReservasForDay(state.dayOffset);

  renderDayChips();
  renderDurationChips();
  renderTimeChips();
  renderCourtsMap();
  renderMisReservasBadge();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
