// Mates10 — utilidades comunes: cliente de Supabase y pequeñas ayudas de DOM.
// Se carga después de config.js y de supabase-js (CDN).
(function () {
  const C = window.MATES10_CONFIG;
  const sb = window.supabase.createClient(C.url, C.anonKey, { auth: { persistSession: false } });
  const P = C.tablePrefix;
  const M = {
    sb,
    t: (name) => sb.from(P + name),
    rpc: (fn, args) => sb.rpc(P + fn, args || {}),
    $: (sel, el) => (el || document).querySelector(sel),
    $$: (sel, el) => Array.from((el || document).querySelectorAll(sel)),
    esc: (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    async all(query) {
      // Pagina una consulta PostgREST hasta traer todas las filas.
      const out = []; const step = 1000;
      for (let from = 0; ; from += step) {
        const { data, error } = await query().range(from, from + step - 1);
        if (error) throw error;
        out.push(...data);
        if (data.length < step) return out;
      }
    },
    must({ data, error }) { if (error) throw error; return data; },
    pct: (x) => Math.round((x || 0) * 100) + "%",
  };
  window.M = M;
  if ("serviceWorker" in navigator) {
    const base = document.querySelector('link[rel="manifest"]')?.href.replace(/manifest\.json$/, "") || "./";
    navigator.serviceWorker.register(base + "sw.js", { scope: base }).catch(() => {});
  }
})();
