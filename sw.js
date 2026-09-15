// "Kill switch": este archivo sustituye al antiguo service worker que
// vivía en la raíz antes de mover Hello Supabase a weights/. Los
// navegadores que ya lo tenían instalado no detectan que el archivo
// desapareció (reciben 404 y simplemente no actualizan), así que se
// quedan sirviendo para siempre la página vieja cacheada.
//
// Al publicar de nuevo un sw.js aquí (con contenido distinto), el
// navegador sí detecta la actualización, instala esta versión, borra
// la caché huérfana ("hello-supabase-*") y se desregistra a sí mismo.
// La página raíz no necesita service worker: es solo un índice de apps.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith("hello-supabase-")).map((k) => caches.delete(k))
        )
      )
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((client) => client.navigate(client.url)))
  );
});
