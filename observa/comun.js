// Observa — utilidades comunes: cliente de Supabase, ayudas de DOM y el
// "motor" que calcula el estado de cada concepto a partir de las
// respuestas (lo usan igual alumno y padre). Se carga después de
// config.js, supabase-js y banco.js.
(function () {
  const C = window.OBSERVA_CONFIG;
  const sb = window.supabase.createClient(C.url, C.anonKey, { auth: { persistSession: false } });
  const P = C.tablePrefix;
  const CONCEPTS = window.OBSERVA_CONCEPTS;
  const TOPICS = window.OBSERVA_TOPICS;
  const byId = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));
  const topicById = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
  const STATUS = {
    nuevo: "Sin ver", flojo: "No lo sé", aprendiendo: "Aprendiendo", dominado: "Lo sé",
  };

  // Estado por concepto. "dominado": 2 aciertos seguidos, o acertado sin
  // haber fallado nunca. "flojo": la última respuesta fue fallo o "no lo sé".
  function states(answers) {
    const st = {};
    for (const c of CONCEPTS) st[c.id] = { n: 0, ok: 0, wrongs: 0, streak: 0, last: null, lastAt: 0, lastQ: null, asked: {} };
    const sorted = [...answers].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
    for (const a of sorted) {
      const s = st[a.concept_id];
      if (!s) continue;
      s.n++;
      if (a.correct) { s.ok++; s.streak++; } else { s.wrongs++; s.streak = 0; }
      s.last = a.correct;
      s.lastAt = Date.parse(a.created_at);
      s.lastQ = a.question_id;
      s.asked[a.question_id] = (s.asked[a.question_id] || 0) + 1;
    }
    for (const id in st) {
      const s = st[id];
      s.status = s.n === 0 ? "nuevo" : !s.last ? "flojo" : s.streak >= 2 || s.wrongs === 0 ? "dominado" : "aprendiendo";
    }
    return st;
  }

  function topicSummary(st) {
    return TOPICS.map((t) => {
      const cs = CONCEPTS.filter((c) => c.topic === t.id);
      const count = { nuevo: 0, flojo: 0, aprendiendo: 0, dominado: 0 };
      cs.forEach((c) => count[st[c.id].status]++);
      return { ...t, total: cs.length, count, score: (count.dominado + 0.5 * count.aprendiendo) / cs.length };
    });
  }

  function stackBar(count, total) {
    return `<div class="stack">${["dominado", "aprendiendo", "flojo"].map((k) =>
      `<i class="${k}" style="width:${(count[k] * 100) / total}%"></i>`).join("")}</div>`;
  }

  // Pregunta del concepto que menos se ha hecho, evitando repetir la última.
  function pickQuestion(c, s, avoid) {
    const qs = c.qs.map((q, i) => ({ qid: `${c.id}.${i + 1}`, i, n: s.asked[`${c.id}.${i + 1}`] || 0 }));
    const pool = qs.filter((q) => q.qid !== avoid && q.qid !== s.lastQ);
    const list = (pool.length ? pool : qs).sort((a, b) => a.n - b.n || Math.random() - 0.5);
    return list[0].qid;
  }

  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Reparte por temas para que el diagnóstico no sea un tema seguido.
  function roundRobin(cs) {
    const groups = TOPICS.map((t) => shuffle(cs.filter((c) => c.topic === t.id))).filter((g) => g.length);
    const out = [];
    while (groups.some((g) => g.length)) groups.forEach((g) => g.length && out.push(g.shift()));
    return out;
  }

  // Cola de una sesión: [{cid, qid, lesson}]. lesson = enseñar la
  // mini-lección antes de preguntar (conceptos que fallaste).
  function buildQueue(st, mode, topic, n = 10) {
    let cs = CONCEPTS.filter((c) => !topic || c.topic === topic);
    if (mode.startsWith("concept:")) cs = [byId[mode.slice(8)]];
    const of = (k) => cs.filter((c) => st[c.id].status === k).sort((a, b) => st[a.id].lastAt - st[b.id].lastAt);
    let picked = [];
    if (mode.startsWith("concept:")) {
      const c = cs[0];
      return c.qs.map((q, i) => ({ cid: c.id, qid: `${c.id}.${i + 1}`, lesson: i === 0 }));
    } else if (mode === "diag") {
      picked = roundRobin(of("nuevo")).slice(0, 12).map((c) => ({ c, lesson: false }));
    } else if (mode === "repaso") {
      picked = [...of("flojo").map((c) => ({ c, lesson: true })), ...of("aprendiendo").map((c) => ({ c, lesson: false }))].slice(0, n);
    } else {
      const day = 864e5, now = Date.now();
      const weak = of("flojo").slice(0, 4).map((c) => ({ c, lesson: true }));
      const learning = of("aprendiendo").slice(0, 3).map((c) => ({ c, lesson: false }));
      const review = of("dominado").filter((c) => now - st[c.id].lastAt > day).slice(0, 1).map((c) => ({ c, lesson: false }));
      const fresh = roundRobin(of("nuevo")).slice(0, Math.max(0, n - weak.length - learning.length - review.length)).map((c) => ({ c, lesson: false }));
      picked = [...weak, ...learning, ...fresh, ...review];
      if (picked.length < n) {
        const used = new Set(picked.map((p) => p.c.id));
        const more = of("dominado").filter((c) => !used.has(c.id)).slice(0, n - picked.length);
        picked.push(...more.map((c) => ({ c, lesson: false })));
      }
      // Mezcla suave: alterna repasos con conceptos nuevos.
      const a = picked.filter((p) => p.lesson || st[p.c.id].status !== "nuevo"), b = picked.filter((p) => !(p.lesson || st[p.c.id].status !== "nuevo"));
      picked = [];
      while (a.length || b.length) { if (a.length) picked.push(a.shift()); if (b.length) picked.push(b.shift()); }
    }
    return picked.map((p) => ({ cid: p.c.id, qid: pickQuestion(p.c, st[p.c.id]), lesson: p.lesson }));
  }

  function question(qid) {
    const k = qid.lastIndexOf(".");
    const c = byId[qid.slice(0, k)];
    return { c, q: c.qs[Number(qid.slice(k + 1)) - 1] };
  }

  const O = {
    sb, CONCEPTS, TOPICS, byId, topicById, STATUS,
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
    states, topicSummary, stackBar, buildQueue, question, shuffle,
    lessonHtml(c, withRelated) {
      const rel = (c.related || []).map((id) => byId[id]).filter(Boolean);
      return `<div class="lesson"><div class="lt">${O.esc(c.title)}</div><div>${O.esc(c.lesson)}</div>
        ${c.line ? `<div class="line">💬 ${O.esc(c.line)}</div>` : ""}
        ${withRelated && rel.length ? `<div class="small muted" style="margin-top:10px">Relacionado:</div><div class="chips">${rel.map((r) => `<button data-concept="${r.id}">${O.esc(r.title)}</button>`).join("")}</div>` : ""}</div>`;
    },
  };
  window.O = O;
  if ("serviceWorker" in navigator) {
    const base = document.querySelector('link[rel="manifest"]')?.href.replace(/manifest\.json$/, "") || "./";
    navigator.serviceWorker.register(base + "sw.js", { scope: base }).catch(() => {});
  }
})();
