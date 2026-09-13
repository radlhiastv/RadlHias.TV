/* Service Worker des Yepp-Timers.
   Zwei Aufgaben:
   1. Android verlangt einen Service Worker mit fetch-Handler, damit Chrome das
      Werkzeug als echte App installiert (WebAPK). Nur dann startet es im
      Vollbild ohne Adressleiste - eine blosse Verknuepfung oeffnet einen
      normalen Browser-Tab mitsamt Leiste.
   2. Nebeneffekt, der hier wirklich nuetzlich ist: das Werkzeug laeuft danach
      auch ohne Netz. Das Video liegt ohnehin lokal auf dem Geraet. */

const CACHE = 'yepp-timer-v2';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Netz zuerst, damit eine neue Version sofort ankommt; faellt auf den
  // Cache zurueck, wenn kein Netz da ist.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
