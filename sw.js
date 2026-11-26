// Service Worker: Smart Balcony Unimap
// Sentiasa cuba rangkaian dahulu (versi terbaru); guna cache hanya jika telefon offline.
const CACHE = 'smartbalcony-v8';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './logo-unimap.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

// Padam semua cache lama (termasuk salinan lama yang mungkin rosak)
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Jangan sentuh trafik Firebase (data masa nyata & log masuk) atau fail APK
  if (/firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken/.test(url.hostname)) return;
  if (url.pathname.endsWith('.apk')) return;

  e.respondWith(
    fetch(req).then(res => {
      // Simpan hanya respons yang berjaya
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() =>
      caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
    )
  );
});
