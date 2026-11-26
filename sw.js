// Service Worker: Smart Plant Weighing PWA
// Fail app disimpan (cache) supaya app dibuka pantas; data sentiasa diambil terus dari Firebase.
const CACHE = 'smartplant-v5';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './logo-unimap.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Jangan cache trafik Firebase (data masa nyata & log masuk)
  if (/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/.test(url.hostname)) return;

  if (url.origin === location.origin) {
    // Fail app: cuba rangkaian dahulu (dapat versi terbaru), guna cache jika offline
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
  } else {
    // Pustaka CDN & font: guna cache dahulu
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }))
    );
  }
});
