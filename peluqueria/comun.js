// Lógica compartida entre la vista de cliente y la de gestión.
(function () {
  const C = window.PELU_CONFIG;
  const T = (n) => C.tablePrefix + n;

  async function api(path, { method = "GET", body, prefer } = {}) {
    const headers = { apikey: C.anonKey, Authorization: "Bearer " + C.anonKey };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (prefer) headers.Prefer = prefer;
    const r = await fetch(`${C.url}/rest/v1/${path}`, {
      method, headers, body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const txt = await r.text();
    const data = txt ? JSON.parse(txt) : null;
    if (!r.ok) {
      const e = new Error((data && data.message) || "Error " + r.status);
      e.status = r.status; e.code = data && data.code;
      throw e;
    }
    return data;
  }

  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  const toHHMM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
  const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const DIAS_C = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

  function dias(n) {
    const out = [], base = new Date(); base.setHours(0, 0, 0, 0);
    for (let i = 0; i < n; i++) { const d = new Date(base); d.setDate(base.getDate() + i); out.push(d); }
    return out;
  }

  // Horas de inicio de cada hueco para una fecha, según el horario semanal.
  function huecos(ajustes, d, { soloFuturo = true } = {}) {
    const tramos = (ajustes.horario || {})[String(d.getDay())] || [];
    const dur = ajustes.duracion_min || 30, out = [];
    const now = new Date(), esHoy = ymd(d) === ymd(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    for (const [a, b] of tramos) {
      for (let m = toMin(a); m + dur <= toMin(b); m += dur) {
        if (soloFuturo && esHoy && m <= nowMin) continue;
        out.push(toHHMM(m));
      }
    }
    return out;
  }

  function etiquetaFecha(d) {
    const hoy = ymd(new Date()), man = new Date(); man.setDate(man.getDate() + 1);
    if (ymd(d) === hoy) return "Hoy";
    if (ymd(d) === ymd(man)) return "Mañana";
    return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
  }
  const parseYmd = (s) => { const [y, m, dd] = s.split("-").map(Number); return new Date(y, m - 1, dd); };

  async function cargar() {
    const ds = dias(C.diasVista);
    const [pel, aj, res] = await Promise.all([
      api(`${T("peluqueros")}?select=*&order=orden,id`),
      api(`${T("ajustes")}?select=*&id=eq.1`),
      api(`${T("reservas")}?select=*&fecha=gte.${ymd(ds[0])}&fecha=lte.${ymd(ds[ds.length - 1])}&order=fecha,hora`),
    ]);
    return { peluqueros: pel, ajustes: aj[0], reservas: res };
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function registrarSW(onNueva) {
    if (!("serviceWorker" in navigator)) return;
    window.addEventListener("load", () => navigator.serviceWorker.register(window.PELU_SW || "sw.js").catch(() => {}));
    navigator.serviceWorker.addEventListener("message", (e) => {
      if (e.data && e.data.type === "new-version") onNueva ? onNueva() : location.reload();
    });
  }

  window.Pelu = { api, T, ymd, toMin, toHHMM, dias, huecos, etiquetaFecha, parseYmd, cargar, esc, registrarSW, DIAS, DIAS_C, MESES };
})();
