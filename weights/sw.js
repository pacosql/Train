// Service worker: sirve el shell de la app desde caché AL INSTANTE y
// comprueba por detrás si hay versión nueva (stale-while-revalidate).
//
// Historia: "caché primero" dejaba versiones viejas colgadas; "red
// primero" (lo anterior) obligaba a esperar a la red en cada apertura —
// en el wifi del gimnasio, segundos en blanco. Esto da lo mejor de las
// dos: abre al momento con lo que hay, y si el index.html del servidor
// es distinto, avisa a la página (mensaje "new-version") para recargar.
//
// Este repo aloja varias apps en subcarpetas; el Cache Storage es
// compartido por todo el origen, así que el nombre de caché lleva el
// prefijo "weights-" y el cleanup solo toca cachés con ese prefijo.
const CACHE_PREFIX = "weights-shell-";
const CACHE_NAME = `${CACHE_PREFIX}__BUILD_ID__`;
const SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./config.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

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

function isShell(request) {
  const u = new URL(request.url);
  return u.origin === self.location.origin && u.pathname.includes("/weights/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Nunca cachear Supabase ni scripts de terceros: datos siempre frescos.
  if (!isShell(request)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      const network = fetch(request)
        .then(async (response) => {
          if (!response || !response.ok) return response;
          const fresh = response.clone();
          // ¿Ha cambiado el index? Comparar con lo que había antes de
          // sobrescribir la caché, y avisar a las pestañas abiertas.
          if (cached && /\/(index\.html)?$/.test(new URL(request.url).pathname)) {
            const [a, b] = await Promise.all([cached.clone().text(), fresh.clone().text()]);
            if (a !== b) {
              const clients = await self.clients.matchAll({ type: "window" });
              clients.forEach((c) => c.postMessage({ type: "new-version" }));
            }
          }
          await cache.put(request, fresh);
          return response;
        })
        .catch(() => null);
      if (cached) {
        event.waitUntil(network);
        return cached;
      }
      return (await network) || new Response("Sin conexión", { status: 503 });
    })
  );
});
