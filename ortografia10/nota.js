// Ortografía 10 — pestaña «Nota»: una nota de 0 a 10 (con 2 decimales)
// por cada categoría de ortografía, calculada con las respuestas de Jugar.
//
// · Cada respuesta se asigna a una categoría por la competencia de Orto que
//   trabaja (ACE.HIATO → Acentuación, JS.PORQUE → Porque / por qué…). Si el
//   ejercicio no dice su competencia, se usa la categoría fija del tipo
//   (Pon la tilde → Acentuación, Comas y puntos → Puntuación…).
// · Nota = 10 × aciertos / respuestas, sobre las últimas ULTIMAS respuestas
//   de esa categoría (así la nota sube cuando mejoras, sin arrastrar fallos
//   antiguos para siempre). Con menos de MIN respuestas sale como provisional.
// · Nota global = media de las categorías con al menos MIN respuestas (si
//   aún no hay ninguna, la media de las que tengan algo, provisional).
// Todo vive en localStorage (o10.cat, o10.comp) y cada respuesta sube a
// Supabase con su categoría y competencia (ortografia10_respuestas).

export const ULTIMAS = 40, MIN = 5;

export const CATS = [
  ["ACE", "🗣️", "Acentuación", "Agudas, llanas, esdrújulas, hiatos y diptongos"],
  ["DIA", "´", "Tilde diacrítica", "tú / tu, sí / si, más / mas, qué / que, aún / aun…"],
  ["POR", "💡", "Porque, por qué, porqué", "Las cuatro formas y cuándo va cada una"],
  ["BV", "🅱️", "B y V", "mb, bl/br, -aba, -bir, -ivo…"],
  ["H", "🤫", "La h", "hie-/hue-, hum-, haber, hacer…"],
  ["GJ", "🦒", "G y J", "-gen, -ger/-gir, -aje, dije, traje…"],
  ["LLY", "🌧️", "Ll e Y", "-illo, y final, cayó, leyendo…"],
  ["LET", "🔤", "Otras letras", "r/rr, c/z/qu, -ción, x/s, sc…"],
  ["MAY", "🔠", "Mayúsculas", "Nombres propios, días, meses, cargos, siglas"],
  ["PUN", "❗", "Puntuación", "Comas, ¿? ¡!, dos puntos y punto y coma"],
  ["JS", "🔗", "Juntas o separadas", "a ver / haber, sino / si no, también / tan bien…"],
  ["HOM", "👂", "Homófonos", "hay / ahí / ay, hecho / echo, vaya / valla…"],
  ["ADU", "⚠️", "Las que más se escriben mal", "Palabras de uso frecuente con falta típica"],
];
const CAT = Object.fromEntries(CATS.map((c) => [c[0], c]));

const DIA = new Set(["ACE.DIAC_PRON", "ACE.DIAC_OTRAS", "ACE.INTERROG", "ACE.INTERROG_IND", "ACE.AUN", "ACE.SOLO", "ACE.MONOSILABOS"]);
// Categoría del tipo cuando la respuesta no trae competencia.
const POR_TIPO = {
  tilde: "ACE", tonica: "ACE", clase: "ACE", diptongo: "ACE", separa: "ACE", teoria: "ACE",
  puntua: "PUN", mayus: "MAY", junto: "JS", hueco: "HOM", parejas: "HOM",
};

// Tipos que siempre cuentan en la misma categoría (mezclan palabras de
// reglas distintas o trabajan la tilde con cualquier palabra).
const FIJO = { tilde: "ACE", tonica: "ACE", clase: "ACE", diptongo: "ACE", separa: "ACE", teoria: "ACE", puntua: "PUN", mayus: "MAY", reloj: "ADU", cuantas: "ADU", coma: "PUN", mismo: "PUN", cestas: "ACE", diana: "ACE" };

export function catDe(comp, tipo) {
  if (FIJO[tipo]) { const c = catDe(comp); return FIJO[tipo] === "ACE" && c === "DIA" ? "DIA" : FIJO[tipo]; }
  if (comp) {
    if (comp === "JS.PORQUE") return "POR";
    if (DIA.has(comp)) return "DIA";
    const b = comp.split(".")[0];
    if (CAT[b]) return b;
  }
  return POR_TIPO[tipo] || "ADU";
}

const ls = {
  get(k, d) { try { const v = localStorage.getItem("o10." + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("o10." + k, JSON.stringify(v)); } catch {} },
};

// Guarda una respuesta: historial reciente (1/0) por categoría y totales por competencia.
export function registrarNota(cat, comp, ok) {
  const c = ls.get("cat", {});
  (c[cat] = c[cat] || []).push(ok ? 1 : 0);
  if (c[cat].length > ULTIMAS) c[cat] = c[cat].slice(-ULTIMAS);
  ls.set("cat", c);
  if (comp && catDe(comp) === cat) {
    const k = ls.get("comp", {});
    const t = (k[comp] = k[comp] || [0, 0]); t[0]++; if (ok) t[1]++;
    ls.set("comp", k);
  }
}

// Una sola vez: aprovechar lo ya jugado en los tipos de categoría fija.
export function sembrarNota() {
  if (ls.get("catSeed", false)) return;
  const s = ls.get("stats", { tipos: {} }); const c = ls.get("cat", {});
  for (const [tipo, [n, ok]] of Object.entries(s.tipos || {})) {
    const cat = POR_TIPO[tipo]; if (!cat || !n) continue;
    const arr = Array.from({ length: n }, (_, i) => (i < ok ? 1 : 0));
    // Mezclar aciertos y fallos para que el recorte a las últimas no sesgue.
    for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    c[cat] = [...arr, ...(c[cat] || [])].slice(-ULTIMAS);
  }
  ls.set("cat", c); ls.set("catSeed", true);
}

const f2 = (x) => x.toFixed(2).replace(".", ",");

export function notas() {
  const c = ls.get("cat", {});
  const filas = CATS.map(([id, e, n, d]) => {
    const h = c[id] || []; const ok = h.reduce((s, x) => s + x, 0);
    return { id, e, n, d, total: h.length, ok, nota: h.length ? (10 * ok) / h.length : null };
  });
  const firmes = filas.filter((f) => f.total >= MIN), algo = filas.filter((f) => f.total);
  const base = firmes.length ? firmes : algo;
  const global = base.length ? base.reduce((s, f) => s + f.nota, 0) / base.length : null;
  return { filas, global, provisional: !firmes.length };
}

export function pintarNota($main, { COMP, esc, empezar }) {
  const { filas, global, provisional } = notas();
  const comp = ls.get("comp", {});
  const flojas = (cat) => Object.entries(comp)
    .filter(([k, [n, ok]]) => catDe(k) === cat && n - ok > 0)
    .sort((a, b) => a[1][1] / a[1][0] - b[1][1] / b[1][0]).slice(0, 2)
    .map(([k, [n, ok]]) => `${esc(COMP(k)[0])} (${ok}/${n})`);
  const ord = [...filas].sort((a, b) => (a.nota == null) - (b.nota == null) || (a.nota ?? 0) - (b.nota ?? 0));
  $main.innerHTML = `
    <h2>Tu nota de ortografía</h2>
    <p class="sub">Una nota de 0 a 10 por categoría, con tus últimas ${ULTIMAS} respuestas de cada una en «Jugar». Primero las que más tienes que repasar.</p>
    <div class="nota-global">
      <span>Nota global</span>
      <b>${global == null ? "—" : f2(global)}</b>
      <small>${global == null ? "Juega una ronda para tener nota." : `Media de ${filas.filter((f) => (provisional ? f.total : f.total >= MIN)).length} categorías${provisional ? " · provisional: aún hay pocas respuestas" : ""}`}</small>
    </div>
    ${ord.map((f) => {
      const fl = f.nota != null && f.nota < 10 ? flojas(f.id) : [];
      return `<div class="cat ${f.total && f.total < MIN ? "prov" : ""} ${f.total ? "" : "vacia"}">
        <div class="cat-top"><span class="cat-n">${f.e} ${esc(f.n)}</span><b class="cat-nota">${f.nota == null ? "—" : f2(f.nota)}</b></div>
        <div class="cat-bar"><i style="width:${f.nota == null ? 0 : f.nota * 10}%"></i></div>
        <div class="cat-pie">${f.total ? `${f.ok} de ${f.total} bien${f.total < MIN ? " · provisional" : ""}` : `Sin respuestas · ${esc(f.d)}`}</div>
        ${fl.length ? `<div class="cat-pie">Repasa: ${fl.join(" · ")}</div>` : ""}
      </div>`;
    }).join("")}
    <button class="btn neg big" id="go" style="margin-top:8px">Jugar para mejorar la nota</button>
    <p class="nota">Cada respuesta cuenta en la categoría de la regla que trabaja. Con menos de ${MIN} respuestas la nota es provisional y no entra en la global. Se guarda en este móvil y cada respuesta sube a Supabase con su categoría.</p>`;
  $main.querySelector("#go").onclick = () => empezar();
}
