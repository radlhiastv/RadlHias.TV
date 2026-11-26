/* Service Worker: hält die App-Dateien offline bereit. Er speichert keine Einträge
   und schickt nichts weg. Bei Änderungen an den Dateien VERSION hochzählen. */
var VERSION = "aufgaben-tracker-1";
var DATEIEN = ["./", "index.html", "app.css", "app.js", "manifest.webmanifest", "datenschutz.html", "impressum.html",
  "icons/icon.svg", "icons/icon-192.png", "icons/apple-touch-icon.png",
  "fonts/Poppins-Regular.woff2", "fonts/Poppins-Medium.woff2", "fonts/Poppins-Bold.woff2"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(DATEIEN); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (k) {
    return Promise.all(k.filter(function (n) { return n !== VERSION; }).map(function (n) { return caches.delete(n); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (r) {
    return r || fetch(e.request).then(function (res) {
      if (res.ok) { var kopie = res.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, kopie); }); }
      return res;
    });
  }).catch(function () { return caches.match("index.html"); }));
});
