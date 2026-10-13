// Orto — acceso a Supabase por REST (PostgREST), sin librerías.
const C = window.ORTO_CONFIG;
const H = { apikey: C.anonKey, Authorization: "Bearer " + C.anonKey, "Content-Type": "application/json" };
const T = (n) => C.tablePrefix + n;

async function req(ruta, opts = {}) {
  const r = await fetch(`${C.url}/rest/v1/${ruta}`, { ...opts, headers: { ...H, ...(opts.headers || {}) } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}

// Las escrituras van en cola (en orden) y no bloquean la partida; si una
// falla se reintenta una vez y se avisa con onError.
let cola = Promise.resolve();
export let onError = () => {};
export const setOnError = (f) => (onError = f);
function enCola(fn) {
  cola = cola.then(fn).catch(() => fn().catch((e) => onError(e)));
  return cola;
}
export const esperarCola = () => cola;

export const db = {
  usuarios: () => req(`${T("usuario")}?select=*&order=creado_en.desc`),
  usuario: (id) => req(`${T("usuario")}?id=eq.${id}&select=*`).then((r) => r[0]),
  crearUsuario: (nombre, edad) =>
    req(T("usuario"), { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ nombre, edad }) }).then((r) => r[0]),
  actualizarUsuario: (id, campos) => enCola(() => req(`${T("usuario")}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(campos) })),
  dominio: (id) => req(`${T("dominio")}?usuario_id=eq.${id}&select=*`),
  guardarDominio: (filas) =>
    enCola(() => req(`${T("dominio")}?on_conflict=usuario_id,competencia`, { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(filas) })),
  intento: (fila) => enCola(() => req(T("intento"), { method: "POST", body: JSON.stringify(fila) })),
  scores: (id) => req(`${T("score")}?usuario_id=eq.${id}&select=score,faltas,nivel,motivo,creado_en&order=creado_en.asc`),
  guardarScore: (fila) => enCola(() => req(T("score"), { method: "POST", body: JSON.stringify(fila) })),
  misIntentos: (id) => req(`${T("intento")}?usuario_id=eq.${id}&select=palabra,competencia,correcto,respuesta,creado_en&order=creado_en.desc&limit=3000`),
  // Respuestas de la prueba de nivel (para reanudarla donde se dejó).
  intentosPrueba: (id) => req(`${T("intento")}?usuario_id=eq.${id}&fase=eq.prueba&select=sesion,competencia,correcto&order=id.asc`),
  dificiles: () => req(`${T("palabras_dificiles")}?select=*&order=tasa.desc,intentos.desc&limit=60`),
};
