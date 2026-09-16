// Service worker: cachea el shell de la app para que la PWA arranque
// instantáneamente y funcione (parcialmente) offline.
//
// Este repo aloja varias apps en subcarpetas distintas, cada una con su
// propio service worker, pero el Cache Storage es compartido por todo el
// origen (pacosql.github.io). Por eso el nombre de caché lleva el prefijo
// "pistas-" y el cleanup de "activate" solo toca cachés con ese prefijo,
// para no borrar nunca la caché de otra app del mismo hosting.
const CACHE_PREFIX = "pistas-shell-";
const CACHE_NAME = `${CACHE_PREFIX}__BUILD_ID__`;
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./config.js",
  "./app.js",
  "./styles.css",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Nunca cachear llamadas a Supabase: siempre queremos datos frescos.
  if (request.url.includes(".supabase.co")) return;

  const sameOrigin = new URL(request.url).origin === self.location.origin;
  if (sameOrigin) {
    // Shell propio: red primero, para que cada despliegue se vea a la primera
    // carga; la caché solo entra en juego sin conexión.
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
  } else {
    // Librerías de CDN con URL versionada: caché primero.
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
