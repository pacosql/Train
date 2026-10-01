// Service worker de Mates10 (cubre /mates10/ y sus subcarpetas alumno,
// padre, revisor y explorar). El Cache Storage es compartido por todo el
// origen github.io: el prefijo "mates10-" y el cleanup de "activate" solo
// tocan cachés de esta app.
const CACHE_PREFIX = "mates10-shell-";
const CACHE_NAME = `${CACHE_PREFIX}__BUILD_ID__`;
const SHELL = ["./", "./index.html", "./manifest.json", "./config.js", "./comun.css", "./comun.js",
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
