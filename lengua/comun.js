// Lengua — utilidades comunes (alumno, padre y revisor): cliente de
// Supabase, áreas del examen y el modelo de nivel (el mismo que usa la
// rutina de 5 min en lengua_preparar(), ver supabase/002_preparar.sql).
(function () {
  const C = window.LENGUA_CONFIG;
  const sb = window.supabase.createClient(C.url, C.anonKey, { auth: { persistSession: false } });
  const P = C.tablePrefix;

  // Bloques del examen de Murcia y áreas de cada uno.
  const BLOQUES = [
    { id: "lit", name: "Comentario literario", short: "Ej. 1 · literario" },
    { id: "ling", name: "Comentario lingüístico y pragmático", short: "Ej. 2 · lingüístico" },
    { id: "tema", name: "Tema y corrección", short: "Tema · ortografía" },
  ];
  const AREAS = [
    { id: "epoca", name: "Época y movimiento", emoji: "🕰️", bloque: "lit" },
    { id: "autor", name: "Autores y obras", emoji: "✒️", bloque: "lit" },
    { id: "generos", name: "Géneros y narratología", emoji: "📖", bloque: "lit" },
    { id: "metrica", name: "Métrica", emoji: "🎼", bloque: "lit" },
    { id: "retorica", name: "Figuras retóricas", emoji: "🎭", bloque: "lit" },
    { id: "morfologia", name: "Morfología", emoji: "🧩", bloque: "ling" },
    { id: "sintaxis", name: "Sintaxis", emoji: "🌳", bloque: "ling" },
    { id: "lexico", name: "Léxico y semántica", emoji: "🔤", bloque: "ling" },
    { id: "texto", name: "Texto y pragmática", emoji: "🧭", bloque: "ling" },
    { id: "aula", name: "Didáctica y aula", emoji: "🏫", bloque: "ling" },
    { id: "historia", name: "Historia de la lengua", emoji: "🏛️", bloque: "tema" },
    { id: "norma", name: "Ortografía y norma", emoji: "✍️", bloque: "tema" },
  ];
  const areaById = Object.fromEntries(AREAS.map((a) => [a.id, a]));
  const NIVEL = { 1: "Básico", 2: "Medio", 3: "Examen" };

  // Nivel por área a partir de las respuestas (mismo cálculo que el SQL):
  //   acc     = aciertos suavizados de las 15 últimas del área
  //   dominio = aciertos ponderados por dificultad (nivel 3 = 1, nivel 1 = 1/3)
  //   obj     = dificultad que le toca ahora (1-3)
  function niveles(answers) {
    const by = Object.fromEntries(AREAS.map((a) => [a.id, []]));
    const sorted = [...answers].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    for (const r of sorted) if (by[r.area]) by[r.area].push(r);
    const out = {};
    for (const a of AREAS) {
      const all = by[a.id], rec = all.slice(0, 15);
      const ok = rec.filter((r) => r.correcta).length;
      const pts = rec.reduce((s, r) => s + (r.correcta ? r.nivel / 3 : 0), 0);
      const acc = (ok + 1) / (rec.length + 2);
      out[a.id] = {
        n: all.length, ok: all.filter((r) => r.correcta).length, rec: rec.length, recOk: ok,
        acc, dominio: (pts + 0.5) / (rec.length + 1.5),
        obj: rec.length < 4 ? 2 : acc < 0.55 ? 1 : acc < 0.8 ? 2 : 3,
      };
    }
    return out;
  }

  // Índice de preparación 0-10: dominio medio de las áreas, penalizando las
  // poco practicadas (hacen falta ~20 respuestas por área para fiarse).
  function preparacion(nv) {
    const parts = AREAS.map((a) => nv[a.id].dominio * Math.min(1, nv[a.id].n / 20));
    const idx = (10 * parts.reduce((s, x) => s + x, 0)) / AREAS.length;
    const cobertura = AREAS.reduce((s, a) => s + Math.min(1, nv[a.id].n / 20), 0) / AREAS.length;
    const flojas = AREAS.filter((a) => nv[a.id].n >= 8 && nv[a.id].dominio < 0.5);
    let estado, color;
    if (cobertura < 0.4) { estado = "Diagnóstico en curso"; color = "nuevo"; }
    else if (idx >= 7.5 && !flojas.length && cobertura >= 0.95) { estado = "Lista para el examen"; color = "dominado"; }
    else if (idx >= 6) { estado = "Casi lista"; color = "aprendiendo"; }
    else if (idx >= 4) { estado = "En camino"; color = "aprendiendo"; }
    else { estado = "Necesita base"; color = "flojo"; }
    return { idx, cobertura, flojas, estado, color };
  }

  const dayKey = (d) => new Date(d).toLocaleDateString("sv-SE");
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const L = {
    sb, AREAS, BLOQUES, areaById, NIVEL, niveles, preparacion, dayKey, shuffle,
    t: (name) => sb.from(P + name),
    $: (sel, el) => (el || document).querySelector(sel),
    $$: (sel, el) => Array.from((el || document).querySelectorAll(sel)),
    esc: (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),
    must({ data, error }) { if (error) throw error; return data; },
    async all(query) {
      const out = []; const step = 1000;
      for (let from = 0; ; from += step) {
        const { data, error } = await query().range(from, from + step - 1);
        if (error) throw error;
        out.push(...data);
        if (data.length < step) return out;
      }
    },
    pct: (x) => Math.round((x || 0) * 100) + "%",
    get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} },
    preguntas: () => L.all(() => L.t("pregunta").select("id,area,nivel,q,txt,o,a,why,activa,origen,version,created_at,updated_at").order("id")),
    respuestas: (alumno) => L.all(() => L.t("respuesta").select("id,pregunta_id,area,nivel,correcta,elegida,ms,repaso,created_at").eq("alumno_id", alumno).order("id")),
    hace(d) {
      const s = (Date.now() - Date.parse(d)) / 1000;
      if (s < 90) return "hace un momento";
      if (s < 3600) return `hace ${Math.round(s / 60)} min`;
      if (s < 86400) return `hace ${Math.round(s / 3600)} h`;
      return `hace ${Math.round(s / 86400)} d`;
    },
    // Racha: días seguidos (hasta hoy o ayer) cumpliendo el objetivo.
    racha(answers, objetivo) {
      const per = {};
      answers.forEach((a) => { const k = dayKey(a.created_at); per[k] = (per[k] || 0) + 1; });
      let n = 0, d = new Date();
      if ((per[dayKey(d)] || 0) < objetivo) d.setDate(d.getDate() - 1);
      while ((per[dayKey(d)] || 0) >= objetivo) { n++; d.setDate(d.getDate() - 1); }
      return n;
    },
  };
  window.L = L;
  if ("serviceWorker" in navigator) {
    const base = document.querySelector('link[rel="manifest"]')?.href.replace(/manifest\.json$/, "") || "./";
    navigator.serviceWorker.register(base + "sw.js", { scope: base }).catch(() => {});
  }
})();
