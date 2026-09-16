// App de reservas de "Eduardo Carrillo Tenis y Pádel Club".
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

const COURT_TYPES = {
  tenis_dura: { label: "Tenis · pista rápida", color: "#2f6fed" },
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
  if (offset === 0) return { top: "Hoy", sub: d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) };
  if (offset === 1) return { top: "Mañana", sub: d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }) };
  return {
    top: d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", ""),
    sub: d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
  };
}

function fmtLongDate(date) {
  return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function nowRoundedMinutes() {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return Math.ceil(mins / SLOT_MINUTES) * SLOT_MINUTES;
}

function validStartMinutes(duration) {
  // El día se ve completo desde la apertura, aunque ya sea tarde: es un
  // horario de consulta/demo, no oculta huecos de la mañana solo porque
  // "ahora" sea otra hora.
  const openMin = OPEN_HOUR * 60;
  const closeMin = CLOSE_HOUR * 60;
  const lastStart = closeMin - duration;
  const list = [];
  for (let m = openMin; m <= lastStart; m += SLOT_MINUTES) list.push(m);
  return list;
}

// ---------- Carga de datos ----------

async function loadCourts() {
  const { data, error } = await client
    .from("pistas_courts")
    .select("id,name,type,sort_order")
    .order("sort_order", { ascending: true });
  if (error) {
    console.error(error);
    document.getElementById("courts-map").textContent = "No se pudo cargar la lista de pistas.";
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
    .select("id,court_id,start_time,end_time,customer_name")
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
  const list = validStartMinutes(state.duration);
  if (!list.includes(state.startMinutes)) {
    state.startMinutes = list[0] ?? null;
  }
  for (const m of list) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip" + (m === state.startMinutes ? " active" : "");
    chip.textContent = fmtMinutes(m);
    chip.addEventListener("click", () => selectStart(m));
    wrap.appendChild(chip);
  }
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

function renderCourtsMap() {
  const wrap = document.getElementById("courts-map");
  wrap.innerHTML = "";
  if (state.startMinutes == null) return;

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
      const base = dateForOffset(state.dayOffset);
      const start = dateWithMinutes(base, state.startMinutes);
      const end = dateWithMinutes(base, state.startMinutes + state.duration);
      const free = isRangeFree(court.id, start, end);

      const card = document.createElement("button");
      card.type = "button";
      card.className = "court-card";
      card.style.setProperty("--court-color", meta.color);
      card.innerHTML = `
        <span class="name">${escapeHtml(court.name)}</span>
        <span class="status ${free ? "free" : "busy"}">${free ? "Libre" : "Ocupada"}</span>
        <span class="schedule-link">Ver horario del día</span>
      `;
      card.addEventListener("click", (ev) => {
        if (ev.target.classList.contains("schedule-link")) {
          openSchedule(court);
        } else if (free) {
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
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Dialog: horario del día ----------

const dlgSchedule = document.getElementById("dlg-schedule");
let scheduleCourt = null;

function openSchedule(court) {
  scheduleCourt = court;
  document.getElementById("sched-title").textContent = court.name;
  document.getElementById("sched-summary").textContent = fmtLongDate(dateForOffset(state.dayOffset));

  const grid = document.getElementById("sched-grid");
  grid.innerHTML = "";
  const openMin = OPEN_HOUR * 60;
  const closeMin = CLOSE_HOUR * 60;
  const nowFloor = state.dayOffset === 0 ? nowRoundedMinutes() : -1;

  for (let m = openMin; m < closeMin; m += SLOT_MINUTES) {
    const base = dateForOffset(state.dayOffset);
    const cellStart = dateWithMinutes(base, m);
    const cellEnd = dateWithMinutes(base, m + SLOT_MINUTES);
    const free = isRangeFree(court.id, cellStart, cellEnd);
    const isPast = m < nowFloor;

    const cell = document.createElement("div");
    cell.className = "day-cell " + (isPast ? "past" : free ? "free" : "busy");
    cell.textContent = fmtMinutes(m);
    if (free && !isPast) {
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

function openBooking(court, startMinutes) {
  bookingCourt = court;
  bookingStart = startMinutes;

  const options = availableDurationsAt(court.id, startMinutes, state.dayOffset);
  const durationSelect = document.getElementById("booking-duration");
  durationSelect.innerHTML = options.map((d) => `<option value="${d}">${d} min</option>`).join("");
  durationSelect.value = options.includes(state.duration) ? String(state.duration) : String(options[0]);

  updateBookingSummary();
  durationSelect.onchange = updateBookingSummary;

  document.getElementById("booking-name").value = "";
  document.getElementById("booking-phone").value = "";
  document.getElementById("booking-msg").textContent = "";
  document.getElementById("booking-msg").className = "form-msg";
  dlgBooking.showModal();
}

function updateBookingSummary() {
  const duration = Number(document.getElementById("booking-duration").value);
  const end = bookingStart + duration;
  document.getElementById("booking-summary").textContent =
    `${bookingCourt.name} — ${fmtLongDate(dateForOffset(state.dayOffset))}, ` +
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

  saveMisReserva({
    id: data.id,
    cancel_token: data.cancel_token,
    court_name: bookingCourt.name,
    court_type: bookingCourt.type,
    start: data.start_time,
    end: data.end_time,
  });

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
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="meta">
        <strong>${escapeHtml(r.court_name)}</strong>
        <span>${start.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} · ${start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}–${end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}${past ? " · finalizada" : ""}</span>
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
});

document.getElementById("btn-back").addEventListener("click", () => {
  document.getElementById("app").hidden = true;
  document.getElementById("cover").hidden = false;
});

document.getElementById("btn-mis-reservas").addEventListener("click", () => {
  renderMisReservas();
  dlgMisReservas.showModal();
});

async function init() {
  state.dayOffset = 0;
  state.startMinutes = validStartMinutes(state.duration)[0];

  await loadCourts();
  await loadReservasForDay(state.dayOffset);

  renderDayChips();
  renderDurationChips();
  renderTimeChips();
  renderCourtsMap();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
