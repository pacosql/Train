// Orto — la aplicación: perfiles, prueba de nivel, práctica adaptativa,
// competencias con estrellas, juegos, palabras difíciles y escala.
import { db, setOnError, esperarCola } from "./db.js";
import { cargarBanco, azar, barajar } from "./banco.js";
import { MECANICAS, hablar } from "./mecanicas.js";
import { crearModelo, actualizar, GUESS, estrellas, planPrueba, pasoPrueba, cerrarPrueba, elegirCompetencia, dificultadPara, prerrequisitoFlojo, scoreDeFaltas } from "./modelo.js";

const app = document.getElementById("app");
window.ORTO_DEBUG = /[?&]debug\b/.test(location.search);
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx".replace(/x/g, () => ((Math.random() * 16) | 0).toString(16)));
const fmt = (x, d = 1) => Number(x).toLocaleString("es-ES", { maximumFractionDigits: d, minimumFractionDigits: d });
const stars = (n) => (n == null ? '<span class="estr vacia">sin datos</span>' : `<span class="estr" title="${n} de 5">${"★".repeat(n)}<i>${"★".repeat(5 - n)}</i></span>`);

let banco, modelo, usuario = null;
let dom = {}, stats = {}, ultimo = {}; // por competencia
let historial = [];

setOnError((e) => aviso(`No se ha podido guardar en la nube (${e.message.slice(0, 60)}). Sigue jugando: se reintentará.`));
function aviso(t) {
  let a = $("#aviso");
  if (!a) { a = document.createElement("div"); a.id = "aviso"; document.body.appendChild(a); }
  a.textContent = t; a.classList.add("on"); clearTimeout(a._t); a._t = setTimeout(() => a.classList.remove("on"), 5000);
}

// ---------------------------------------------------------------- arranque
async function arrancar() {
  app.innerHTML = `<div class="cargando">Cargando…</div>`;
  banco = await cargarBanco("datos/");
  modelo = crearModelo(banco.comp, banco.pesos);
  const guardado = ls.get("orto_usuario");
  if (guardado) { try { await entrar(guardado); return; } catch {} }
  inicio();
}

async function inicio() {
  $("#quien").textContent = "";
  const lista = await db.usuarios().catch(() => []);
  app.innerHTML = `<h1>¿Quién eres?</h1>
    <div class="lista">${lista.map((u) => `<button class="fila-u" data-id="${u.id}"><b>${esc(u.nombre)}</b>${u.score != null ? `<span class="pill">OrtoScore ${u.score}</span>` : '<span class="pill">sin prueba</span>'}</button>`).join("") || '<p class="muted">Aún no hay nadie. Escribe tu nombre para empezar.</p>'}</div>
    <h3>Soy nuevo</h3>
    <div class="row"><input id="nombre" class="grow" placeholder="Tu nombre" maxlength="40" autocomplete="off" />
    <input id="edad" type="number" min="5" max="110" placeholder="Edad" style="width:90px" /></div>
    <p></p><button class="primary grande" id="crear">Empezar</button>
    <p class="small muted">La edad es opcional: sirve para decirte si tu nivel es el esperable.</p>`;
  $$(".fila-u").forEach((b) => (b.onclick = () => entrar(b.dataset.id)));
  $("#crear").onclick = async () => {
    const n = $("#nombre").value.trim();
    if (!n) return $("#nombre").focus();
    $("#crear").disabled = true;
    const e = parseInt($("#edad").value, 10);
    const u = await db.crearUsuario(n, Number.isFinite(e) ? e : null);
    entrar(u.id);
  };
}

async function entrar(id) {
  usuario = await db.usuario(id);
  if (!usuario) throw new Error("no existe");
  ls.set("orto_usuario", id);
  $("#quien").textContent = usuario.nombre;
  const filas = await db.dominio(id);
  dom = {}; stats = {}; ultimo = {};
  for (const f of filas) { dom[f.competencia] = +f.p; stats[f.competencia] = { n: f.intentos, ok: f.aciertos }; ultimo[f.competencia] = f.ultimo ? Date.parse(f.ultimo) : 0; }
  historial = await db.scores(id).catch(() => []);
  if (!usuario.prueba_hecha) return introPrueba();
  casa();
}

// ---------------------------------------------------------------- registro
function registrar(it, res, { fase, sesion, peso = 1 }) {
  const c = it.c;
  const g = GUESS[it.t] ?? 0.25;
  const antes = dom[c] ?? 0.5;
  dom[c] = actualizar(antes, res.correcto, g, peso);
  const s = (stats[c] ||= { n: 0, ok: 0 }); s.n++; if (res.correcto) s.ok++;
  ultimo[c] = Date.now();
  db.intento({ usuario_id: usuario.id, sesion, fase, competencia: c, item: it.id, mecanica: it.t, palabra: res.palabra || null, correcto: res.correcto, respuesta: (res.respuesta || "").slice(0, 200), ms: res.ms ?? null });
  return { antes, despues: dom[c] };
}
function guardarDominio(ids) {
  const filas = [...new Set(ids)].map((c) => ({ usuario_id: usuario.id, competencia: c, p: Math.round(dom[c] * 1e4) / 1e4, intentos: stats[c]?.n || 0, aciertos: stats[c]?.ok || 0, ultimo: new Date(ultimo[c] || Date.now()).toISOString() }));
  if (filas.length) db.guardarDominio(filas);
}
function guardarScore(motivo) {
  const r = modelo.resumen(dom);
  usuario.score = r.score; usuario.faltas = r.faltas; usuario.nivel = r.nivel.nombre;
  db.actualizarUsuario(usuario.id, { score: r.score, faltas: r.faltas, nivel: r.nivel.nombre, prueba_hecha: usuario.prueba_hecha });
  const fila = { usuario_id: usuario.id, score: r.score, faltas: r.faltas, nivel: r.nivel.nombre, motivo };
  db.guardarScore(fila); historial.push({ ...fila, creado_en: new Date().toISOString() });
  return r;
}

// ---------------------------------------------------------------- casa
function casa() {
  const r = modelo.resumen(dom);
  const gan = modelo.comps.filter((c) => c.r > 0 && (dom[c.id] ?? 0.5) < 0.9).map((c) => ({ c, g: modelo.ganancia(dom, c.id) })).sort((a, b) => b.g - a.g).slice(0, 3);
  const edadTxt = usuario.edad ? comparaEdad(usuario.edad, r) : "";
  app.innerHTML = `
    <div class="score-card">
      ${anillo(r.score)}
      <div class="score-txt">
        <div class="nivel">≈ ${esc(r.nivel.nombre)}</div>
        <div class="muted">Unas <b>${fmt(r.faltas)}</b> faltas por cada 100 palabras de un texto de periódico.</div>
        ${edadTxt ? `<div class="small">${edadTxt}</div>` : ""}
      </div>
    </div>
    ${historial.length > 1 ? sparkline(historial.map((h) => h.score)) : ""}
    <button class="primary grande" id="practicar">▶ Practicar</button>
    <div class="grid2">
      <button class="tile" id="comp">⭐ Mis competencias</button>
      <button class="tile" id="juegos">🎮 Juegos</button>
      <button class="tile" id="dificiles">🏆 Palabras difíciles</button>
      <button class="tile" id="escala">📏 La escala</button>
    </div>
    <h3>Lo que más te subiría la nota</h3>
    ${gan.map(({ c, g }) => `<button class="fila-c" data-id="${c.id}"><span>${esc(c.n)}</span><span class="dcha">${stars(estrellas(dom[c.id] ?? null))}<span class="pill acc">+${Math.max(1, Math.round(g))}</span></span></button>`).join("")}
    <p></p><button class="link" id="salir">No soy ${esc(usuario.nombre)}</button>`;
  $("#practicar").onclick = () => practicar();
  $("#comp").onclick = competencias;
  $("#juegos").onclick = juegos;
  $("#dificiles").onclick = dificiles;
  $("#escala").onclick = escala;
  $$(".fila-c").forEach((b) => (b.onclick = () => fichaCompetencia(b.dataset.id)));
  $("#salir").onclick = () => { ls.set("orto_usuario", null); usuario = null; inicio(); };
}

function comparaEdad(edad, r) {
  // Curso esperado por edad (6 años → 1º de primaria … 15 → 4º ESO; 16+ adulto).
  const n = edad < 6 ? 0 : Math.min(11, edad - 5);
  const ref = modelo.referencias.find((x) => x.n === n);
  if (!ref) return "";
  const d = r.score - ref.score;
  return `Con ${edad} años lo esperable es ${ref.score} (${ref.nombre}): ${d > 0 ? `vas <b>${d} puntos por encima</b>.` : d === 0 ? "estás <b>justo ahí</b>." : `te faltan <b>${-d} puntos</b>.`}`;
}

function anillo(score) {
  const R = 52, L = 2 * Math.PI * R, f = Math.max(0, Math.min(1, score / 100));
  const col = score >= 85 ? "var(--ok)" : score >= 65 ? "var(--accent)" : "var(--bad)";
  return `<svg class="anillo" viewBox="0 0 120 120" role="img" aria-label="OrtoScore ${score}">
    <circle cx="60" cy="60" r="${R}" fill="none" stroke="var(--line)" stroke-width="10"/>
    <circle cx="60" cy="60" r="${R}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${L * f} ${L}" transform="rotate(-90 60 60)"/>
    <text x="60" y="62" text-anchor="middle" class="anillo-n">${score}</text>
    <text x="60" y="82" text-anchor="middle" class="anillo-t">OrtoScore</text></svg>`;
}
function sparkline(vals) {
  const v = vals.slice(-30), W = 300, H = 44, min = Math.min(...v) - 2, max = Math.max(...v) + 2;
  const pts = v.map((x, i) => `${(i / Math.max(1, v.length - 1)) * W},${H - ((x - min) / (max - min || 1)) * H}`).join(" ");
  return `<div class="spark"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2"/></svg><div class="small muted">Evolución: ${v[0]} → ${v[v.length - 1]}</div></div>`;
}

// ---------------------------------------------------------------- ejercicio
// Muestra un ejercicio y, al responder, la corrección con su explicación.
// Devuelve el resultado cuando el usuario pulsa "Siguiente".
async function ejercicio(it, { cab = "", fase = "practica", sesion, rapido = false, peso = 1 } = {}) {
  const c = banco.compPorId[it.c];
  app.innerHTML = `${cab}<div class="row entre"><span class="pill">${esc(c?.n || it.c)}</span>${it.t !== "dictado" ? `<button class="oir" id="leer" title="Leer en voz alta">🔊</button>` : ""}</div>
    <div id="ej" class="ej"></div><div id="fb"></div>`;
  const leer = $("#leer");
  if (leer) leer.onclick = () => hablar(it.q ? it.q.replace("___", "…") : it.w || "");
  const t0 = performance.now();
  const res = await MECANICAS[it.t]($("#ej"), it, banco);
  res.ms = Math.round(performance.now() - t0);
  const cambio = registrar(it, res, { fase, sesion, peso });
  const fb = $("#fb");
  if (rapido) {
    fb.innerHTML = `<div class="fb ${res.correcto ? "ok" : "ko"}">${res.correcto ? "✓ Bien" : "✗ Era: <b>" + esc(res.solucion) + "</b>"}</div>`;
    await new Promise((r) => setTimeout(r, res.correcto ? 650 : 1500));
    return { ...res, cambio };
  }
  const expl = banco.explicar(it);
  const frases = ["¡Bien!", "¡Eso es!", "¡Correcto!", "¡Perfecto!", "¡Muy bien!"];
  fb.innerHTML = res.correcto
    ? `<div class="fb ok"><b>${azar(frases)}</b> <span class="small">${esc(expl)}</span></div>`
    : `<div class="fb ko"><p><b>Era: ${esc(res.solucion)}</b></p><p>${esc(expl)}</p>
        <button class="link" id="regla">📘 Ver la regla</button><div id="lecc"></div></div>`;
  if (!res.correcto) $("#regla").onclick = () => { $("#lecc").innerHTML = leccionHTML(c, true); $("#regla").remove(); };
  fb.insertAdjacentHTML("beforeend", `<button class="primary grande" id="sig">Siguiente</button>`);
  $("#sig").scrollIntoView({ block: "nearest", behavior: "smooth" });
  await new Promise((r) => ($("#sig").onclick = r));
  return { ...res, cambio };
}

function leccionHTML(c, compacta = false) {
  const L = c.lec;
  return `<div class="leccion ${compacta ? "compacta" : ""}">
    <p>${esc(L.regla)}</p>
    ${L.ej?.length ? `<p class="ejs">${L.ej.map((e) => `<span>${esc(e)}</span>`).join("")}</p>` : ""}
    ${L.exc?.length ? `<p class="small"><b>Ojo:</b> ${L.exc.map(esc).join(" ")}</p>` : ""}
    ${L.truco ? `<p class="truco">💡 ${esc(L.truco)}</p>` : ""}</div>`;
}
async function pantallaLeccion(c, intro = "Antes de practicar, la regla en 20 segundos:") {
  app.innerHTML = `<div class="etq">📘 Lección · ${esc(modelo.cursos[c.c])}</div><h2>${esc(c.n)}</h2><p class="muted">${esc(intro)}</p>${leccionHTML(c)}
    <button class="primary grande" id="vale">Entendido, a practicar</button>`;
  await new Promise((r) => ($("#vale").onclick = r));
}

// ---------------------------------------------------------------- prueba de nivel
function introPrueba() {
  app.innerHTML = `<h1>Hola, ${esc(usuario.nombre)}</h1>
    <p>Empezamos con una <b>prueba de nivel</b>: unas 40 preguntas de todo tipo (tildes, b/v, h, g/j, porque/por qué, comas…). Se adapta sobre la marcha: si aciertas sube, si fallas baja.</p>
    <p>Al final tendrás tu <b>OrtoScore</b> (0-100), las faltas que harías en un texto de periódico de 100 palabras y a qué curso equivale.</p>
    <p class="muted small">No hay explicaciones durante la prueba: eso viene después, al practicar.</p>
    <button class="primary grande" id="ir">Empezar la prueba</button>`;
  $("#ir").onclick = prueba;
}

async function prueba() {
  const sesion = uuid();
  const escaleras = barajar(planPrueba(modelo));
  const resultados = {};
  const total = escaleras.reduce((a, e) => a + e.max, 0);
  let hechas = 0;
  let vivas = escaleras.slice();
  while (vivas.length) {
    for (const e of vivas.slice()) {
      const c = e.lista[e.i];
      const it = banco.elegir(c.id, 2, "prueba");
      if (!it) { if (!pasoPrueba(e, true)) vivas = vivas.filter((x) => x !== e); continue; }
      hechas++;
      const cab = `<div class="prog"><div class="bar"><i style="width:${Math.min(100, (hechas / total) * 100)}%"></i></div><span class="small muted">${hechas}</span></div>`;
      const res = await ejercicio(it, { cab, fase: "prueba", sesion, rapido: true });
      (resultados[c.id] ||= []).push(res.correcto);
      if (!pasoPrueba(e, res.correcto)) vivas = vivas.filter((x) => x !== e);
    }
  }
  dom = { ...cerrarPrueba(modelo, escaleras, resultados), ...Object.fromEntries(Object.keys(dom).filter((k) => stats[k]?.n > 3).map((k) => [k, dom[k]])) };
  for (const c of modelo.comps) ultimo[c.id] ||= Date.now();
  usuario.prueba_hecha = true;
  guardarDominio(modelo.comps.map((c) => c.id));
  const r = guardarScore("prueba de nivel");
  await esperarCola();
  resultadoPrueba(r, resultados);
}

function resultadoPrueba(r, resultados) {
  const fuertes = Object.entries(resultados).filter(([, v]) => v.every(Boolean)).map(([k]) => modelo.porId[k]).sort((a, b) => b.c - a.c).slice(0, 4);
  const flojas = modelo.comps.filter((c) => c.r > 0).map((c) => ({ c, g: modelo.ganancia(dom, c.id) })).sort((a, b) => b.g - a.g).slice(0, 4);
  app.innerHTML = `<div class="etq">Resultado de la prueba</div>
    <div class="score-card">${anillo(r.score)}<div class="score-txt"><div class="nivel">≈ ${esc(r.nivel.nombre)}</div>
    <div class="muted">En un texto de periódico de 100 palabras harías unas <b>${fmt(r.faltas)}</b> faltas.</div>
    ${usuario.edad ? `<div class="small">${comparaEdad(usuario.edad, r)}</div>` : ""}</div></div>
    <p class="small muted">Es una estimación con unas 40 preguntas: cada ejercicio que hagas la afina.</p>
    ${fuertes.length ? `<h3>Lo que dominas</h3>${fuertes.map((c) => `<div class="fila-c"><span>${esc(c.n)}</span>${stars(estrellas(dom[c.id]))}</div>`).join("")}` : ""}
    <h3>Por dónde empezar (lo que más sube tu nota)</h3>${flojas.map(({ c, g }) => `<div class="fila-c"><span>${esc(c.n)}</span><span class="dcha">${stars(estrellas(dom[c.id]))}<span class="pill acc">+${Math.max(1, Math.round(g))}</span></span></div>`).join("")}
    <p></p><button class="primary grande" id="ya">Empezar a practicar</button><p></p><button class="grande" id="casa">Ir al inicio</button>`;
  $("#ya").onclick = () => practicar();
  $("#casa").onclick = casa;
}

// ---------------------------------------------------------------- práctica
// Bloques de 4 ejercicios por competencia. Si fallas dos seguidas y un
// prerrequisito está flojo, se baja a él unos ejercicios y luego se vuelve.
async function practicar({ solo = null, total = 15 } = {}) {
  const sesion = uuid();
  const antes = modelo.resumen(dom);
  const domAntes = { ...dom };
  const disponibles = banco.disponibles();
  const tocadas = [];
  const recientes = [];
  const vistas = new Set();
  let bloque = null;
  const pila = [];
  let n = 0, aciertos = 0, ultimaBien = true;
  const nuevoBloque = (id, restan = 4, extra = {}) => ({ id, restan, fallos: 0, ...extra });
  while (n < total || !ultimaBien) {
    if (!bloque || bloque.restan <= 0) {
      if (pila.length) { bloque = pila.pop(); bloque.restan = Math.max(bloque.restan, 2); }
      else {
        const id = solo || elegirCompetencia(modelo, { dom, ultimo, evitar: bloque ? [bloque.id] : [] }, { disponibles });
        if (!id) break;
        bloque = nuevoBloque(id, solo ? total : 4);
      }
      const c = modelo.porId[bloque.id];
      if (!vistas.has(c.id) && !(stats[c.id]?.n) && c.lec?.regla) { vistas.add(c.id); await pantallaLeccion(c); }
    }
    const c = modelo.porId[bloque.id];
    const d = n >= total ? 1 : dificultadPara(dom[c.id] ?? 0.5, recientes);
    const it = banco.elegir(c.id, d);
    if (!it) { bloque.restan = 0; continue; }
    n++;
    const cab = `<div class="prog"><div class="bar"><i style="width:${Math.min(100, (n / total) * 100)}%"></i></div><span class="small muted">${n}/${total}</span></div>${bloque.pre ? `<div class="etq bajada">↘ Paso atrás: ${esc(c.n)}</div>` : ""}`;
    const res = await ejercicio(it, { cab, sesion });
    tocadas.push(c.id);
    recientes.push(res.correcto); ultimaBien = res.correcto;
    if (res.correcto) { aciertos++; bloque.fallos = 0; } else bloque.fallos++;
    bloque.restan--;
    guardarDominio([c.id]);
    if (bloque.fallos >= 2 && !bloque.pre) {
      const pre = prerrequisitoFlojo(modelo, dom, c.id);
      if (pre) {
        const cp = modelo.porId[pre];
        app.innerHTML = `<div class="etq bajada">↘ Un paso atrás</div><h2>Antes de seguir con «${esc(c.n)}»…</h2>
          <p>Para acertar esto hace falta dominar <b>${esc(cp.n)}</b>. Vamos a asegurarlo con unos ejercicios y volvemos.</p>${leccionHTML(cp)}
          <button class="primary grande" id="vale">Vamos</button>`;
        await new Promise((r) => ($("#vale").onclick = r));
        bloque.fallos = 0; pila.push(bloque);
        bloque = nuevoBloque(pre, 4, { pre: true });
        vistas.add(pre);
      }
    }
    if (n > total + 6) break;
  }
  await esperarCola();
  const despues = guardarScore(solo ? `práctica: ${solo}` : "práctica");
  finSesion(antes, despues, domAntes, [...new Set(tocadas)], n, aciertos);
}

function finSesion(antes, despues, domAntes, tocadas, n, aciertos) {
  const d = despues.score - antes.score;
  app.innerHTML = `<div class="estrella">${d > 0 ? "📈" : "✍️"}</div><h1>¡Sesión terminada!</h1>
    <p>Has hecho <b>${n}</b> ejercicios y has acertado <b>${aciertos}</b>.</p>
    <div class="cambio"><span>OrtoScore</span><b>${antes.score} → ${despues.score}</b><span class="${d >= 0 ? "ok" : "bad"}">${d >= 0 ? "+" : ""}${d}</span></div>
    <h3>Lo que has trabajado</h3>
    ${tocadas.map((id) => `<div class="fila-c"><span>${esc(modelo.porId[id].n)}</span><span class="dcha">${stars(estrellas(domAntes[id] ?? null))} → ${stars(estrellas(dom[id]))}</span></div>`).join("")}
    <p class="muted">Lo mejor es parar aquí y volver mañana: así se fija más.</p>
    <button class="primary grande" id="otra">Otra sesión</button><p></p><button class="grande" id="casa">Inicio</button>`;
  $("#otra").onclick = () => practicar();
  $("#casa").onclick = casa;
}

// ---------------------------------------------------------------- competencias
function competencias() {
  const bloques = banco.comp.bloques;
  app.innerHTML = `<div class="row entre"><h1>Mis competencias</h1></div>
    <p class="muted small">Estrellas según lo que dominas (5 = dominada). El curso es cuando se enseña en el colegio. Toca una para ver la regla y practicarla.</p>
    ${bloques.map((b) => {
      const cs = modelo.comps.filter((c) => c.b === b.id);
      const media = cs.reduce((a, c) => a + (dom[c.id] ?? 0.5), 0) / cs.length;
      return `<details class="bloque" ${b.id === "ACE" ? "open" : ""}><summary><span>${b.e} ${esc(b.n)}</span>${stars(estrellas(media))}</summary>
        <table class="tabla"><tbody>${cs.map((c) => `<tr data-id="${c.id}"><td>${esc(c.n)}</td><td class="curso">${esc(abrev(modelo.cursos[c.c]))}</td><td>${stars(stats[c.id]?.n || dom[c.id] != null ? estrellas(dom[c.id] ?? 0.5) : null)}</td></tr>`).join("")}</tbody></table></details>`;
    }).join("")}
    <p></p><button class="grande" id="casa">Volver</button>`;
  $$("tr[data-id]").forEach((tr) => (tr.onclick = () => fichaCompetencia(tr.dataset.id)));
  $("#casa").onclick = casa;
}
const abrev = (c) => c.replace(" primaria", " P").replace("Bachillerato / adulto", "Adulto");

function fichaCompetencia(id) {
  const c = modelo.porId[id];
  const s = stats[id];
  const ej = (banco.porComp.get(id) || []).length;
  app.innerHTML = `<div class="etq">${esc(banco.comp.bloques.find((b) => b.id === c.b).n)} · ${esc(modelo.cursos[c.c])}</div>
    <h2>${esc(c.n)}</h2>
    <div class="row">${stars(estrellas(dom[id] ?? null))}<span class="muted small">${s?.n ? `${s.ok} de ${s.n} acertados` : "aún sin practicar"} · dominio ${Math.round((dom[id] ?? 0.5) * 100)} %</span></div>
    ${leccionHTML(c)}
    <p class="small muted">${ej ? `${ej} ejercicios en el banco` : "Ejercicios generados al momento"}${c.r ? ` · si la dominas del todo tu OrtoScore sube ${Math.max(0, Math.round(modelo.ganancia(dom, id)))} puntos` : ""}${c.pre.length ? ` · se apoya en: ${c.pre.map((p) => esc(modelo.porId[p].n)).join(", ")}` : ""}.</p>
    <button class="primary grande" id="prac">Practicar esto (8)</button><p></p><button class="grande" id="vol">Volver</button>`;
  $("#prac").onclick = () => practicar({ solo: id, total: 8 });
  $("#vol").onclick = competencias;
}

// ---------------------------------------------------------------- juegos
function flojas(n = 8) {
  return modelo.comps.filter((c) => c.r > 0 && banco.porComp.get(c.id)?.some((x) => x.k === "palabra")).map((c) => ({ id: c.id, g: modelo.ganancia(dom, c.id) + Math.random() })).sort((a, b) => b.g - a.g).slice(0, n).map((x) => x.id);
}
function juegos() {
  app.innerHTML = `<h1>Juegos</h1>
    <button class="juego" id="j1"><b>📰 Corrector de periódico</b><span>Un texto real de unas 100 palabras con las faltas que harías tú. Encuéntralas todas.</span></button>
    <button class="juego" id="j2"><b>🚦 Semáforo, 60 segundos</b><span>¿Bien o mal escrita? Contrarreloj con tus palabras flojas.</span></button>
    <button class="juego" id="j3"><b>🎧 Dictado</b><span>10 palabras al oído. Escríbelas sin ayuda.</span></button>
    <button class="juego" id="j4"><b>🃏 Parejas</b><span>Une homófonos con su significado: tuvo/tubo, vaya/valla…</span></button>
    <p></p><button class="grande" id="casa">Volver</button>`;
  $("#j1").onclick = corrector; $("#j2").onclick = semaforo; $("#j3").onclick = dictadoJuego; $("#j4").onclick = parejasJuego;
  $("#casa").onclick = casa;
}

async function corrector() {
  const r = modelo.resumen(dom);
  const n = Math.max(2, Math.min(6, Math.round(r.faltas + 1)));
  const p = banco.parrafo(n, flojas(10));
  if (!p) return aviso("No he podido montar un texto ahora. Prueba otra vez.");
  const sesion = uuid();
  const marcadas = new Set();
  const faltaEn = new Map(p.faltas.map((f) => [f.k, f]));
  const pinta = () => p.tokens.map((t, k) => {
    if (/^\s+$/.test(t)) return t;
    const f = faltaEn.get(k);
    const txt = f ? f.pre + f.mal + f.post : t;
    return `<span class="tk ${marcadas.has(k) ? "marc" : ""}" data-k="${k}">${esc(txt)}</span>`;
  }).join("");
  app.innerHTML = `<div class="etq">📰 Corrector de periódico</div><h2>Hay ${n} faltas escondidas</h2>
    <p class="muted small">Texto real de prensa española (${p.palabras} palabras). Toca las palabras mal escritas y pulsa «Corregir».</p>
    <div class="texto" id="txt">${pinta()}</div><button class="primary grande" id="fin">Corregir</button>`;
  $("#txt").onclick = (e) => { let k = e.target.dataset?.k; if (k == null) return; k = +k; marcadas.has(k) ? marcadas.delete(k) : marcadas.add(k); e.target.classList.toggle("marc"); };
  await new Promise((res) => ($("#fin").onclick = res));
  let encontradas = 0, falsas = 0;
  for (const f of p.faltas) {
    const ok = marcadas.has(f.k);
    if (ok) encontradas++;
    registrar({ ...f.it, t: "caza" }, { correcto: ok, respuesta: ok ? f.mal : "(no la vio)", palabra: f.it.w }, { fase: "juego", sesion });
  }
  for (const k of marcadas) if (!faltaEn.has(k)) falsas++;
  guardarDominio(p.faltas.map((f) => f.it.c));
  $("#txt").innerHTML = p.tokens.map((t, k) => {
    if (/^\s+$/.test(t)) return t;
    const f = faltaEn.get(k);
    if (f) return `<span class="tk ${marcadas.has(k) ? "bien" : "perdida"}"><s>${esc(f.mal)}</s> ${esc(f.pre + f.it.w + f.post)}</span>`;
    return `<span class="tk ${marcadas.has(k) ? "mal" : ""}">${esc(t)}</span>`;
  }).join("");
  $("#fin").remove();
  app.insertAdjacentHTML("beforeend", `<div class="fb ${encontradas === n ? "ok" : "ko"}"><b>Has encontrado ${encontradas} de ${n}</b>${falsas ? ` · y marcaste ${falsas} que estaban bien` : ""}.
    <ul class="small">${p.faltas.map((f) => `<li><b>${esc(f.it.w)}</b>: ${esc(banco.explicar(f.it))}</li>`).join("")}</ul></div>
    <button class="primary grande" id="otro">Otro texto</button><p></p><button class="grande" id="vol">Juegos</button>`);
  $("#otro").onclick = corrector; $("#vol").onclick = () => { guardarScore("juego: corrector"); juegos(); };
}

async function semaforo() {
  const sesion = uuid();
  const comps = flojas(8);
  let puntos = 0, fallos = 0, fin = false;
  const t0 = Date.now(), DUR = 60000;
  const log = [];
  app.innerHTML = `<div class="etq">🚦 Semáforo</div><div class="prog"><div class="bar"><i id="tiempo" style="width:100%"></i></div><b id="pts">0</b></div>
    <div class="semaforo"><div class="palabra grande" id="w"></div></div>
    <div class="ops dos"><button class="op si" id="bien">✓ Bien escrita</button><button class="op no" id="mal">✗ Mal escrita</button></div><div id="fbs" class="small centro"></div>`;
  const reloj = setInterval(() => { const q = 1 - (Date.now() - t0) / DUR; $("#tiempo") && ($("#tiempo").style.width = Math.max(0, q * 100) + "%"); if (q <= 0) { fin = true; clearInterval(reloj); } }, 200);
  while (!fin) {
    const c = azar(comps);
    const lista = banco.porComp.get(c).filter((x) => x.k === "palabra");
    const it = azar(lista);
    const correcta = Math.random() < 0.5;
    const mostrada = correcta ? it.w : azar(it.alts);
    $("#w").textContent = mostrada;
    const dijo = await new Promise((r) => { $("#bien").onclick = () => r(true); $("#mal").onclick = () => r(false); const chk = setInterval(() => { if (fin) { clearInterval(chk); r(null); } }, 200); });
    if (dijo === null) break;
    const ok = dijo === correcta;
    if (ok) puntos++; else fallos++;
    $("#pts").textContent = puntos;
    $("#fbs").innerHTML = ok ? `<span class="ok">✓</span>` : `<span class="bad">✗ Se escribe «${esc(it.w)}»</span>`;
    log.push({ it, mostrada, ok });
    registrar({ ...it, t: "semaforo" }, { correcto: ok, respuesta: `${mostrada}: ${dijo ? "bien" : "mal"}`, palabra: it.w }, { fase: "juego", sesion, peso: 0.5 });
  }
  clearInterval(reloj);
  guardarDominio(log.map((x) => x.it.c));
  guardarScore("juego: semáforo");
  const malos = log.filter((x) => !x.ok);
  app.innerHTML = `<div class="estrella">🚦</div><h1>${puntos} puntos</h1><p>${puntos + fallos} palabras, ${fallos} fallos.</p>
    ${malos.length ? `<h3>Repasa</h3>${malos.map((x) => `<div class="fila-c"><span><b>${esc(x.it.w)}</b> <span class="muted">(viste «${esc(x.mostrada)}»)</span></span></div>`).join("")}` : ""}
    <p></p><button class="primary grande" id="otra">Otra vez</button><p></p><button class="grande" id="vol">Juegos</button>`;
  $("#otra").onclick = semaforo; $("#vol").onclick = juegos;
}

async function dictadoJuego() {
  if (!banco.tts) return aviso("Este navegador no puede leer en voz alta.");
  const sesion = uuid();
  const comps = flojas(10);
  let ok = 0;
  for (let i = 0; i < 10; i++) {
    const c = azar(comps);
    const lista = banco.porComp.get(c).filter((x) => x.k === "palabra" && x.w.length >= 5);
    const it = { ...azar(lista), t: "dictado" };
    const cab = `<div class="etq">🎧 Dictado ${i + 1}/10</div>`;
    const r = await ejercicio(it, { cab, fase: "juego", sesion });
    if (r.correcto) ok++;
    guardarDominio([it.c]);
  }
  guardarScore("juego: dictado");
  app.innerHTML = `<div class="estrella">🎧</div><h1>${ok} de 10</h1><button class="primary grande" id="otra">Otro dictado</button><p></p><button class="grande" id="vol">Juegos</button>`;
  $("#otra").onclick = dictadoJuego; $("#vol").onclick = juegos;
}

async function parejasJuego() {
  const sesion = uuid();
  const todas = [...banco.porComp.values()].flat().filter((x) => x.t === "parejas");
  for (let i = 0; i < 3; i++) {
    const it = azar(todas);
    await ejercicio(it, { cab: `<div class="etq">🃏 Parejas ${i + 1}/3</div>`, fase: "juego", sesion });
    guardarDominio([it.c]);
  }
  juegos();
}

// ---------------------------------------------------------------- palabras difíciles
async function dificiles() {
  app.innerHTML = `<h1>Palabras difíciles</h1><div class="cargando">Cargando…</div>`;
  const [mios, todos] = await Promise.all([db.misIntentos(usuario.id).catch(() => []), db.dificiles().catch(() => [])]);
  const agg = new Map();
  for (const x of mios) { if (!x.palabra) continue; const a = agg.get(x.palabra) || { p: x.palabra, n: 0, mal: 0, c: x.competencia }; a.n++; if (!x.correcto) a.mal++; agg.set(x.palabra, a); }
  const mias = [...agg.values()].filter((a) => a.mal > 0).sort((a, b) => b.mal - a.mal || b.mal / b.n - a.mal / a.n).slice(0, 25);
  // A priori: las más traicioneras. Las de la lista de errores de adultos
  // más difíciles y, de cada regla, las dos palabras más raras en prensa.
  const prior = [];
  for (const [c, l] of banco.porComp) {
    const comp = modelo.porId[c];
    if (c === "ADU.FRECUENTES") { for (const it of l) if (it.t === "elige" && it.d >= 2) prior.push({ w: it.w, c, s: 1 + it.d }); continue; }
    const cands = l.filter((it) => it.k === "palabra" && it.f >= 0.5 && it.f <= 15).sort((a, b) => a.f - b.f).slice(0, 2);
    for (const it of cands) prior.push({ w: it.w, c, s: comp.r * 4 * (c.endsWith("MEMORIA") ? 1.5 : 1) + Math.random() * 0.3 });
  }
  const vistos = new Set();
  const top = prior.sort((a, b) => b.s - a.s).filter((x) => !vistos.has(x.w) && vistos.add(x.w)).slice(0, 50);
  app.innerHTML = `<h1>Palabras difíciles</h1>
    <div class="tabs"><button class="tab on" data-t="t1">Las que fallas tú</button><button class="tab" data-t="t2">Todos los usuarios</button><button class="tab" data-t="t3">Las más traicioneras</button></div>
    <div id="t1" class="tabc">${mias.length ? rank(mias.map((a) => [a.p, `${a.mal} de ${a.n}`, a.c])) : '<p class="muted">Aún no has fallado ninguna. ¡Juega un poco!</p>'}</div>
    <div id="t2" class="tabc oculto">${todos.length ? rank(todos.map((a) => [a.palabra, `${Math.round(a.tasa * 100)} % de ${a.intentos}`, a.competencia])) : '<p class="muted">Todavía no hay datos suficientes.</p>'}</div>
    <div id="t3" class="tabc oculto"><p class="small muted">Por la regla que las rige y lo raras que son en prensa (antes de que nadie juegue).</p>${rank(top.map((x) => [x.w, "", x.c]))}</div>
    <p></p><button class="grande" id="casa">Volver</button>`;
  $$(".tab").forEach((b) => (b.onclick = () => { $$(".tab").forEach((x) => x.classList.toggle("on", x === b)); $$(".tabc").forEach((x) => x.classList.toggle("oculto", x.id !== b.dataset.t)); }));
  $("#casa").onclick = casa;
}
function rank(filas) {
  return `<ol class="rank">${filas.map(([w, dato, c]) => `<li><b>${esc(w)}</b><span class="muted small">${esc(modelo.porId[c]?.n || "")}</span>${dato ? `<span class="pill">${esc(dato)}</span>` : ""}</li>`).join("")}</ol>`;
}

// ---------------------------------------------------------------- escala
function escala() {
  const r = modelo.resumen(dom);
  const filas = modelo.referencias.slice().reverse();
  app.innerHTML = `<h1>La escala</h1>
    <p class="muted small">OrtoScore = 100 · e<sup>−faltas/6</sup>, donde «faltas» son las que harías cada 100 palabras de un texto de periódico. Cada curso es el perfil típico de un alumno al acabarlo: lo de cursos anteriores, consolidado; lo de su curso, a medias; lo posterior, lo que se aprende leyendo. Las apariciones de cada regla se han contado en ${fmt(banco.pesos?.palabras / 1000, 0)} 000 palabras de prensa española de 2023.</p>
    <table class="tabla escala"><thead><tr><th>Nivel</th><th>OrtoScore</th><th>Faltas/100</th></tr></thead><tbody>
    ${filas.map((x) => `<tr class="${x.n === r.nivel.n ? "yo" : ""}"><td>${esc(x.nombre)}${x.n === r.nivel.n ? " ← tú" : ""}</td><td>${x.score}</td><td>${fmt(-6 * Math.log(x.score / 100))}</td></tr>`).join("")}
    </tbody></table>
    <p>Tú: <b>${r.score}</b> (${fmt(r.faltas)} faltas por cada 100 palabras).</p>
    <p></p><button class="grande" id="casa">Volver</button>`;
  $("#casa").onclick = casa;
}

window.addEventListener("error", (e) => aviso("Error: " + (e.message || "").slice(0, 80)));
arrancar().catch((e) => (app.innerHTML = `<p class="err">${esc(e.message)}</p>`));
