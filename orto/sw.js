// Service worker de Orto. El Cache Storage es compartido por todo el origen
// github.io: el prefijo "orto-" y la limpieza de "activate" solo tocan
// cachés de esta app.
const CACHE_PREFIX = "orto-";
const CACHE_NAME = `${CACHE_PREFIX}__BUILD_ID__`;
const SHELL = ["./", "./index.html", "./manifest.json", "./config.js", "./css/orto.css",
  "./js/app.js", "./js/banco.js", "./js/db.js", "./js/mecanicas.js", "./js/modelo.js", "./js/silabas.js",
  "./datos/competencias.json", "./datos/pesos.json", "./datos/palabras.json", "./datos/frases.json",
  "./datos/manual/acentuacion.json", "./datos/manual/homofonos.json", "./datos/manual/puntuacion.json",
  "./datos/manual/adultos.json", "./datos/manual/pares_minimos.json",
  "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.url.includes(".supabase.co")) return;
  // Red primero; caché solo sin conexión.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
