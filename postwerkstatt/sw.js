/* Postwerkstatt – Service Worker
   Ziel: Die App startet auch ohne Netz. Beim nächsten Online-Start holt sie
   sich automatisch die neue Version von radlhias.tv.
   Bei Änderungen an index.html: CACHE hochzählen. */
const CACHE = "postwerkstatt-v4";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-maskable.svg"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Nur die eigenen Dateien anfassen. Alles andere auf radlhias.tv -- vor allem
  // /api/* -- geht unberührt ans Netz: Anmeldestatus und KI-Antworten haben im
  // Cache nichts verloren. Fremde Herkunft (Schriften) wird weiter gecacht.
  if (url.origin === location.origin && !url.pathname.startsWith("/postwerkstatt/")) return;

  const isDoc = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("index.html");

  if (isDoc) {
    // Netz zuerst, damit Updates ankommen – offline aus dem Cache.
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match("./index.html")))
    );
    return;
  }

  // Alles andere (Schriften, Icons): Cache zuerst, im Hintergrund nachladen.
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === "opaque")) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
