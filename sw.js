/* Madani Courses PWA - app shell cache. Firebase (Firestore) ka data kabhi cache nahi hota. */
const VER = 'mc-v3';
const SHELL = ['./', './index.html', './admin.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
const CDN = /(^|\.)((cdn\.jsdelivr\.net)|(cdnjs\.cloudflare\.com)|(code\.jquery\.com)|(cdn\.datatables\.net)|(fonts\.googleapis\.com)|(fonts\.gstatic\.com)|(www\.gstatic\.com))$/;

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VER).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== VER; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/firestore\.googleapis\.com|firebaseio\.com|identitytoolkit|googleapis\.com\/(v1|v2)/.test(url.href)) return; // live data: seedha network
  if (url.origin === location.origin) {
    // Apni files: pehle network (update turant mile), na mile to cache
    e.respondWith(fetch(req).then(function (res) {
      if (res && res.ok) { const cp = res.clone(); caches.open(VER).then(function (c) { c.put(req, cp); }); }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (m) { return m || caches.match('./index.html'); });
    }));
    return;
  }
  if (CDN.test(url.hostname)) {
    // Libraries/fonts: cache se turant, background me update
    e.respondWith(caches.match(req).then(function (m) {
      const net = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) { const cp = res.clone(); caches.open(VER).then(function (c) { c.put(req, cp); }); }
        return res;
      }).catch(function () { return m; });
      return m || net;
    }));
  }
});
