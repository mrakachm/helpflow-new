self.addEventListener("install", (event) => {
  ("Service Worker: install");
  event.waitUntil(
    caches.open("helpflow-cache").then((cache) =>
      cache.addAll([
        "/",
        "/favicon.ico",
        "/icon-192.png",
        "/icon-512.png",
        "/logo-helpflow.png"
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  ("Service Worker: activate");
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});