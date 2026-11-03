// Science — utilidades comunes de alumno y padre: Supabase, texto con
// palabras en inglés, voz, motor de progreso (qué sabe y qué toca ahora) y
// los componentes de dibujo (célula de la ficha con zoom, resaltado y
// toque; célula numerada del libro). Se carga después de config.js,
// supabase-js y banco.js.
(function () {
  const CFG = window.SCIENCE_CONFIG;
  const sb = window.supabase.createClient(CFG.url, CFG.anonKey, { auth: { persistSession: false } });
  const S = window.SCI;
  const IMG = S.IMG;

  // ---------------------------------------------------------------- utilidades
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} };
  const must = ({ data, error }) => { if (error) throw error; return data; };
  async function all(query) {
    const out = []; const step = 1000;
    for (let from = 0; ; from += step) {
      const { data, error } = await query().range(from, from + step - 1);
      if (error) throw error;
      out.push(...data);
      if (data.length < step) return out;
    }
  }

  // Texto con [[palabras en inglés]]: se ven en azul y se tocan para oírlas.
  // (span y no button: así las frases largas se parten en líneas como texto normal).
  const rich = (t) => esc(t).replace(/\[\[(.+?)\]\]/g, (_, w) => `<span class="en" role="button" tabindex="0" data-say="${w}">${w}</span>`);
  const plain = (t) => String(t ?? "").replace(/\[\[(.+?)\]\]/g, "$1");

  // ---------------------------------------------------------------- voz
  let voices = [];
  const loadVoices = () => { try { voices = speechSynthesis.getVoices(); } catch {} };
  try { loadVoices(); speechSynthesis.addEventListener("voiceschanged", loadVoices); } catch {}
  const voiceFor = (lang) => {
    const pref = lang === "en" ? ["en-GB", "en_GB", "en-US", "en"] : ["es-ES", "es_ES", "es"];
    for (const p of pref) { const v = voices.find((x) => x.lang && x.lang.replace("_", "-").startsWith(p.replace("_", "-"))); if (v) return v; }
    return null;
  };
  const sinEmoji = (t) => t.replace(/[\p{Extended_Pictographic}️‍]/gu, "").replace(/[«»"]/g, "").replace(/\s+/g, " ").trim();
  function say(text, lang = "en", queue = false) {
    try {
      if (!queue) speechSynthesis.cancel();
      const t = sinEmoji(text);
      if (!t) return;
      const u = new SpeechSynthesisUtterance(t);
      u.lang = lang === "en" ? "en-GB" : "es-ES";
      const v = voiceFor(lang); if (v) u.voice = v;
      u.rate = lang === "en" ? 0.85 : 0.95;
      speechSynthesis.speak(u);
    } catch {}
  }
  // Lee un texto mezclado: español con voz española y [[inglés]] con voz inglesa.
  function sayRich(text) {
    try { speechSynthesis.cancel(); } catch {}
    String(text).split(/(\[\[.+?\]\])/).forEach((seg) => {
      const m = seg.match(/^\[\[(.+)\]\]$/);
      if (m) say(m[1], "en", true); else if (seg.trim()) say(seg, "es", true);
    });
  }
  // Delegación: cualquier .en o [data-say] habla al tocarlo.
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-say]");
    if (b) { e.preventDefault(); say(b.dataset.say, b.dataset.lang || "en"); }
  });

  // ---------------------------------------------------------------- sonido y confeti
  let actx = null;
  const soundOn = () => get("science_sound") !== "off";
  function beep(ok) {
    if (!soundOn()) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t = actx.currentTime;
      (ok ? [660, 880, 1175] : [330, 262]).forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = "sine"; o.frequency.value = f;
        const t0 = t + i * 0.11;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(ok ? 0.16 : 0.1, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
        o.connect(g).connect(actx.destination);
        o.start(t0); o.stop(t0 + 0.32);
      });
    } catch {}
  }
  function confetti(n = 80) {
    const cols = ["#f7b267", "#7bd389", "#a78bfa", "#f9d65c", "#6cb4ee", "#f28482"];
    for (let i = 0; i < n; i++) {
      const d = document.createElement("i");
      d.className = "confeti";
      d.style.left = Math.random() * 100 + "vw";
      d.style.background = cols[i % cols.length];
      d.style.animationDelay = Math.random() * 0.7 + "s";
      d.style.animationDuration = 1.8 + Math.random() * 1.5 + "s";
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 4200);
    }
  }

  // ---------------------------------------------------------------- progreso
  // Estado de cada concepto a partir de las respuestas. «dominado» = las
  // últimas `need` respuestas seguidas bien (2, o 3 en los de dibujos y
  // los de dos opciones, donde acertar por suerte es fácil).
  function states(answers) {
    const st = {};
    for (const c of S.CONCEPTS) st[c.id] = { n: 0, ok: 0, wrongs: 0, streak: 0, last: null, lastAt: 0, lastQ: null, asked: {}, need: c.need,
      must: c.must ? `${c.id}#${c.must}` : null, mustOk: !c.must };
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
      if (a.correct && a.question_id === s.must) s.mustOk = true;
    }
    for (const id in st) {
      const s = st[id];
      s.status = s.n === 0 ? "nuevo" : !s.last ? "flojo" : s.streak >= s.need && s.mustOk ? "dominado" : "aprendiendo";
    }
    return st;
  }
  const STATUS = { nuevo: "Sin ver", flojo: "Lo falla", aprendiendo: "Aprendiendo", dominado: "Lo sabe" };
  function topicSummary(st) {
    return S.TOPICS.map((t) => {
      const cs = S.CONCEPTS.filter((c) => c.topic === t.id);
      const count = { nuevo: 0, flojo: 0, aprendiendo: 0, dominado: 0 };
      cs.forEach((c) => count[st[c.id].status]++);
      const f = count.dominado / cs.length;
      return { ...t, total: cs.length, count, f, stars: f >= 1 ? 3 : f >= 0.66 ? 2 : f >= 0.33 ? 1 : 0 };
    });
  }
  const overall = (st) => {
    const dom = S.CONCEPTS.filter((c) => st[c.id].status === "dominado").length;
    return { dom, total: S.CONCEPTS.length, f: dom / S.CONCEPTS.length };
  };
  const stackBar = (count, total) => `<div class="stack">${["dominado", "aprendiendo", "flojo"].map((k) =>
    `<i class="${k}" style="width:${(count[k] * 100) / total}%"></i>`).join("")}</div>`;

  // Siguiente concepto en el juego infinito. ctx: {topic, qn, retry:[{cid,at,qid}], recent:[cid]}.
  // Devuelve {cid, avoid} o {lesson: topic} si toca enseñar antes un tema nuevo.
  function nextConcept(st, ctx, seen) {
    const order = S.PATH || S.TOPICS.map((t) => t.id);
    const pool = S.CONCEPTS.filter((c) => !ctx.topic || c.topic === ctx.topic);
    const due = ctx.retry.find((r) => r.at <= ctx.qn);
    if (due) { ctx.retry = ctx.retry.filter((r) => r !== due); return { cid: due.cid, avoid: due.qid }; }
    const recent = new Set(ctx.recent.slice(-2));
    const stt = (c) => st[c.id].status;
    const openAll = pool.filter((c) => stt(c) === "flojo" || stt(c) === "aprendiendo");
    const open = openAll.filter((c) => !recent.has(c.id));
    const nuevos = pool.filter((c) => stt(c) === "nuevo" && !recent.has(c.id))
      .sort((a, b) => order.indexOf(a.topic) - order.indexOf(b.topic));
    const dom = pool.filter((c) => stt(c) === "dominado" && !recent.has(c.id));
    if (nuevos.length && (openAll.length < 4 || !open.length)) {
      const c = nuevos[0];
      if (!seen.has(c.topic) && !ctx.noLessons) return { lesson: c.topic };
      return { cid: c.id };
    }
    if (dom.length && (Math.random() < 0.18 || !open.length)) {
      const old = [...dom].sort((a, b) => st[a.id].lastAt - st[b.id].lastAt).slice(0, 4);
      return { cid: old[Math.floor(Math.random() * old.length)].id };
    }
    if (open.length) {
      const c = [...open].sort((a, b) => (stt(a) === "flojo" ? 0 : 1) - (stt(b) === "flojo" ? 0 : 1) || st[a.id].lastAt - st[b.id].lastAt)[0];
      return { cid: c.id };
    }
    const rest = pool.filter((c) => !recent.has(c.id));
    return { cid: (rest[Math.floor(Math.random() * rest.length)] || pool[0]).id };
  }

  // Variante de pregunta: la menos preguntada, sin repetir la última. Las de
  // escribir la palabra salen cuando ya la ha reconocido al menos una vez.
  function pickQuestion(c, s, avoid, exam) {
    if (!exam && s.must && !s.mustOk && s.streak >= 1 && avoid !== s.must) return S.qById[s.must];
    let qs = c.qs.filter((q) => q.qid !== avoid && q.qid !== s.lastQ);
    if (!exam && s.streak < 1 && s.status !== "dominado") qs = qs.filter((q) => q.k !== "write");
    if (exam) { const hard = qs.filter((q) => ["label", "write", "num", "tap", "order", "pics"].includes(q.k) || (q.o && q.o.length >= 3)); if (hard.length) qs = hard; }
    if (!qs.length) qs = c.qs;
    return qs.map((q) => ({ q, n: s.asked[q.qid] || 0, r: Math.random() })).sort((a, b) => a.n - b.n || a.r - b.r)[0].q;
  }

  // Examen de prueba: preguntas repartidas por temas, como un examen de verdad.
  const EXAM = { living: 2, vital: 2, cells: 1, plantcell: 3, animalcell: 2, compare: 1, levels: 1, kingdoms: 2 };
  // Como en el examen de verdad: en las células, escribir y elegir la etiqueta
  // del dibujo de la ficha y tocar la parte; en seres vivos y funciones
  // vitales, siempre una pregunta con dibujo.
  const EXAM_KINDS = { plantcell: ["write", "label", "tap"], animalcell: ["write", "label"] };
  const EXAM_PIC = { living: "items.", vital: "pic." };
  function examQuestions(st) {
    const out = [];
    const any = (c) => pickQuestion(c, st[c.id], null, true);
    for (const [t, n] of Object.entries(EXAM)) {
      const all = S.CONCEPTS.filter((c) => c.topic === t);
      if (EXAM_KINDS[t]) {
        const parts = shuffle(all.filter((c) => c.must));
        EXAM_KINDS[t].slice(0, n).forEach((k, i) => {
          const c = parts[i];
          out.push(c.qs.find((q) => q.k === k) || c.qs.find((q) => q.k === "num") || any(c));
        });
      } else if (EXAM_PIC[t]) {
        const pic = shuffle(all.filter((c) => c.id.startsWith(EXAM_PIC[t])))[0];
        const rest = shuffle(all.filter((c) => !c.id.startsWith(EXAM_PIC[t]))).slice(0, n - 1);
        out.push(shuffle(pic.qs)[0], ...rest.map(any));
      } else {
        out.push(...shuffle(all).slice(0, n).map(any));
      }
    }
    return out;
  }

  // ---------------------------------------------------------------- célula de la ficha
  const PCOL = { wall: [196, 120, 50], membrane: [236, 64, 150], chloroplast: [46, 170, 70], nucleus: [140, 90, 220],
    vacuole: [60, 150, 235], mitochondria: [245, 160, 30], vesicle: [110, 195, 220], ok: [46, 170, 100], bad: [217, 83, 75] };
  const maps = {};
  function loadMap(cell) {
    if (maps[cell]) return maps[cell];
    maps[cell] = new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement("canvas");
        cv.width = img.naturalWidth; cv.height = img.naturalHeight;
        const ctx = cv.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
        const ids = new Uint8Array(cv.width * cv.height);
        for (let i = 0; i < ids.length; i++) ids[i] = Math.round(d[i * 4] / 25);
        res({ w: cv.width, h: cv.height, ids, layers: {} });
      };
      img.onerror = rej;
      img.src = IMG(S.CELLS[cell].map);
    });
    return maps[cell];
  }
  // Capa de color de una parte (a mitad de resolución; la membrana, engordada para que se vea).
  async function layer(cell, partName, col) {
    const m = await loadMap(cell);
    const id = S.CELLS[cell].ids[partName];
    const key = partName + col;
    if (m.layers[key]) return m.layers[key];
    const W = m.w >> 1, H = m.h >> 1, grow = partName === "membrane" || partName === "wall" ? 2 : 0;
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d");
    const im = ctx.createImageData(W, H);
    const [r, g, b] = PCOL[col] || PCOL[partName];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let hit = m.ids[(y * 2) * m.w + x * 2] === id;
      if (!hit && grow) {
        for (let dy = -grow; dy <= grow && !hit; dy++) for (let dx = -grow; dx <= grow && !hit; dx++) {
          const yy = (y + dy) * 2, xx = (x + dx) * 2;
          if (yy >= 0 && yy < m.h && xx >= 0 && xx < m.w && m.ids[yy * m.w + xx] === id) hit = true;
        }
      }
      if (hit) { const k = (y * W + x) * 4; im.data[k] = r; im.data[k + 1] = g; im.data[k + 2] = b; im.data[k + 3] = 200; }
    }
    ctx.putImageData(im, 0, 0);
    return (m.layers[key] = cv.toDataURL());
  }
  // Parte que hay en (fx, fy) (0-1), o la más cercana a menos de ~1 dedo.
  async function partAt(cell, fx, fy) {
    const m = await loadMap(cell);
    const x0 = Math.round(fx * m.w), y0 = Math.round(fy * m.h);
    const R = Math.round(m.w * 0.032);
    const name = (id) => Object.keys(S.CELLS[cell].ids).find((k) => S.CELLS[cell].ids[k] === id) || "none";
    const at = (x, y) => (x >= 0 && y >= 0 && x < m.w && y < m.h ? m.ids[y * m.w + x] : 0);
    if (at(x0, y0)) return name(at(x0, y0));
    let best = 0, bd = Infinity;
    for (let dy = -R; dy <= R; dy += 2) for (let dx = -R; dx <= R; dx += 2) {
      const d = dx * dx + dy * dy;
      if (d > R * R || d >= bd) continue;
      const id = at(x0 + dx, y0 + dy);
      if (id) { best = id; bd = d; }
    }
    return name(best);
  }
  const partPoint = (cell, p) => {
    const C = S.CELLS[cell];
    return C.dots[p] || null;
  };

  // Dibuja la célula en `el`. o: {labels: "all"|"blank"|"none", ask: parte con «?», tap: fn(parte, fx, fy)}.
  function cellView(el, cell, o = {}) {
    const C = S.CELLS[cell];
    const labels = o.labels || "blank";
    el.innerHTML = `<div class="cv${o.tap ? " cv-tap" : ""}" style="aspect-ratio:${C.w}/${C.h}"><div class="cv-in">
      <img src="${IMG(C.img)}" alt="${cell} cell" draggable="false" />
      <div class="cv-hls"></div>
      ${labels === "none" ? "" : Object.entries(C.boxes).map(([p, b]) => `<div class="cv-box" data-part="${p}" style="left:${b[0] * 100}%;top:${b[1] * 100}%;width:${b[2] * 100}%;height:${b[3] * 100}%">${labels === "all" ? esc(S.LABEL[cell][p]) : ""}</div>`).join("")}
      <div class="cv-marks"></div></div></div>`;
    const root = el.firstElementChild, inner = root.firstElementChild;
    const fit = () => { root.style.fontSize = Math.max(7, root.clientWidth * 0.03) + "px"; };
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(root);
    loadMap(cell).catch(() => {});
    const api = {
      root,
      box(p, text, cls) {
        const b = $(`.cv-box[data-part="${p}"]`, root);
        if (!b) return;
        if (text != null) b.textContent = text;
        b.className = "cv-box" + (cls ? " " + cls : "");
      },
      async highlight(p, col, pulse = true) {
        const src = await layer(cell, p, col || p);
        const im = document.createElement("img");
        im.className = "cv-hl" + (pulse ? " pulse" : "");
        im.src = src; im.dataset.part = p;
        $(".cv-hls", root).appendChild(im);
      },
      clear() { $(".cv-hls", root).innerHTML = ""; $(".cv-marks", root).innerHTML = ""; },
      dot(p) {
        const pts = [C.dots[p], p === "vacuole" ? C.dots.vacuole2 : null].filter(Boolean);
        $(".cv-marks", root).insertAdjacentHTML("beforeend", pts.map(([x, y]) => `<i class="cv-dot" style="left:${x * 100}%;top:${y * 100}%"></i>`).join(""));
      },
      mark(fx, fy, ok) {
        $(".cv-marks", root).insertAdjacentHTML("beforeend", `<i class="cv-x${ok == null ? " neutral" : ok ? " ok" : ""}" style="left:${fx * 100}%;top:${fy * 100}%"></i>`);
      },
      zoom(fx, fy, s) {
        const tx = Math.min(0, Math.max(100 - 100 * s, 50 - fx * 100 * s));
        const ty = Math.min(0, Math.max(100 - 100 * s, 50 - fy * 100 * s));
        inner.style.transform = `translate(${tx}%, ${ty}%) scale(${s})`;
      },
      zoomPart(p, s) {
        const pt = partPoint(cell, p);
        if (pt) api.zoom(pt[0], pt[1], s || (p === "wall" || p === "membrane" ? 2.4 : 2));
      },
      unzoom() { inner.style.transform = ""; },
    };
    if (o.ask) { api.box(o.ask, "?", "q"); api.dot(o.ask); }
    if (o.tap) {
      root.addEventListener("click", async (e) => {
        const r = root.getBoundingClientRect();
        const fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
        o.tap(await partAt(cell, fx, fy), fx, fy);
      });
    }
    return api;
  }

  // Célula del libro con sus números (pág. 11). o: {ring: n, to: n}.
  function bookView(el, cell, o = {}) {
    const B = S.BOOK[cell];
    const ring = o.ring ? B.n[o.ring] : null, to = o.to ? B.n[o.to] : null;
    el.innerHTML = `<div class="bv"><img src="${IMG(B.img)}" alt="${cell} cell (book)" />
      ${ring ? `<i class="bv-ring" style="left:${ring.at[0] * 100}%;top:${ring.at[1] * 100}%"></i>` : ""}
      ${to ? `<i class="bv-to" style="left:${to.to[0] * 100}%;top:${to.to[1] * 100}%"></i>` : ""}</div>`;
  }

  // Las dos células, una al lado de la otra.
  function bothView(el, hl) {
    el.innerHTML = `<div class="both"><div><div class="p"></div><div class="cap">Plant cell</div></div><div><div class="a"></div><div class="cap">Animal cell</div></div></div>`;
    const p = cellView($(".p", el), "plant", { labels: "all" }), a = cellView($(".a", el), "animal", { labels: "all" });
    if (hl) { p.highlight("wall"); p.highlight("chloroplast"); }
    return { p, a };
  }

  // Tabla comparativa.
  const compareTable = () => `<table class="tabla"><tr><th></th><th>🌿 Plant cell</th><th>🐾 Animal cell</th></tr>
    <tr><td>cell wall</td><td>✅</td><td>❌</td></tr><tr><td>chloroplasts</td><td>✅</td><td>❌</td></tr>
    <tr><td>cell membrane</td><td>✅</td><td>✅</td></tr><tr><td>nucleus</td><td>✅</td><td>✅</td></tr>
    <tr><td>vacuoles</td><td>✅ large</td><td>✅ small</td></tr><tr><td>shape</td><td>regular</td><td>rectangular, oval or irregular</td></tr></table>`;

  const gallery = (items) => `<div class="gal${items.length === 2 || items.length === 4 ? " g2" : ""}">${items.map(([img, en, es]) =>
    `<figure><img src="${IMG(img)}" alt="${esc(en)}" loading="lazy" />${en ? `<figcaption>${esc(en)}${es ? `<span>${esc(es)}</span>` : ""}</figcaption>` : ""}</figure>`).join("")}</div>`;

  // ---------------------------------------------------------------- textos de pregunta
  const TAP_TXT = {
    plant: { wall: ["Tap the cell wall.", "Toca la pared celular."], membrane: ["Tap the cell membrane.", "Toca la membrana celular."],
      chloroplast: ["Tap a chloroplast.", "Toca un cloroplasto."], nucleus: ["Tap the nucleus.", "Toca el núcleo."], vacuole: ["Tap the vacuole.", "Toca la vacuola."] },
    animal: { membrane: ["Tap the cell membrane.", "Toca la membrana celular."], nucleus: ["Tap the nucleus.", "Toca el núcleo."], vacuole: ["Tap a vacuole.", "Toca una vacuola."] },
  };
  const TAP = (cell, p) => TAP_TXT[cell][p];
  // Enunciado en inglés y español de cualquier pregunta.
  function qText(q) {
    switch (q.k) {
      case "label": return ["Which word goes in the yellow box?", "¿Qué palabra va en la caja amarilla?"];
      case "write": return ["Write the word for the yellow box.", "Escribe la palabra de la caja amarilla."];
      case "tap": return TAP(q.cell, q.part);
      case "num": return [`What is number ${q.n}?`, `¿Qué es el número ${q.n}?`];
      case "tf": return [q.q, q.es];
      default: return [q.q, q.es];
    }
  }
  // Respuesta correcta en texto.
  function answerText(q) {
    switch (q.k) {
      case "label": case "write": case "tap": return S.LABEL[q.cell][q.part];
      case "num": { const n = S.BOOK[q.cell].n[q.n]; return S.BOOK[q.cell].names[n.part]; }
      case "tf": return q.a ? "True" : "False";
      case "pics": return "(dibujo " + (q.a + 1) + ")";
      case "order": return q.o.join(" → ");
      default: return q.o[q.a];
    }
  }
  // Descripción corta para el padre.
  function describe(q) {
    const [en] = qText(q);
    const extra = q.k === "label" || q.k === "write" || q.k === "tap" ? ` (${q.cell === "plant" ? "célula vegetal" : "célula animal"}, ficha)` :
      q.k === "num" ? ` (${q.cell === "plant" ? "célula vegetal" : "célula animal"}, libro)` : q.cap ? ` — ${q.cap}` : "";
    return en + extra;
  }

  const K = {
    sb, S, IMG, $, $$, esc, shuffle, get, set, must, all, rich, plain, say, sayRich, beep, confetti, soundOn,
    t: (name) => sb.from(CFG.tablePrefix + name),
    states, STATUS, topicSummary, overall, stackBar, nextConcept, pickQuestion, examQuestions, EXAM,
    cellView, bookView, bothView, compareTable, gallery, partAt, layer, qText, answerText, describe,
    pct: (x) => Math.round((x || 0) * 100) + "%",
    stars: (n) => `<span class="on">${"★".repeat(n)}</span><span class="off">${"★".repeat(3 - n)}</span>`,
  };
  window.K = K;
  if ("serviceWorker" in navigator) {
    const base = document.querySelector('link[rel="manifest"]')?.href.replace(/manifest\.json$/, "") || "./";
    navigator.serviceWorker.register(base + "sw.js", { scope: base }).catch(() => {});
  }
})();
