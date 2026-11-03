// Service worker de Science (cubre /science/ y sus subcarpetas alumno y
// padre). El Cache Storage es compartido por todo el origen github.io: el
// prefijo "science-" y el cleanup de "activate" solo tocan cachés de esta app.
const CACHE_PREFIX = "science-shell-";
const CACHE_NAME = `${CACHE_PREFIX}__BUILD_ID__`;
const SHELL = ["./", "./index.html", "./alumno/", "./alumno/index.html", "./padre/", "./padre/index.html",
  "./manifest.json", "./config.js", "./comun.css", "./comun.js", "./banco.js", "./vendor/supabase.min.js",
  "./img/cells/plant.png", "./img/cells/plant-map.png", "./img/cells/animal.png", "./img/cells/animal-map.png",
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
  if (new URL(request.url).origin !== self.location.origin) return;
  // Red primero (siempre la última versión); caché solo sin conexión. Las
  // imágenes quedan guardadas al verlas, así funciona también sin red.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }))
  );
});
