// FLAMI CAM (versión definitiva): guarda la app para que abra rápido y funcione sin internet (después de la primera vez).
const VERSION = 'flami-cam-app-v15';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', '../icons/icon-180.png', '../icons/icon-192.png', '../icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('flami-cam-app-v') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' || url.origin === location.origin) {
    // La app: primero internet (para tener siempre la última versión), si no hay, la guardada.
    // cache:'no-cache' pide siempre la versión nueva a internet (sin la copia guardada del navegador).
    e.respondWith(fetch(req, {cache:'no-cache'}).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  // Librerías, modelos y fuentes de afuera: la copia guardada si existe, si no se descargan y se guardan.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
