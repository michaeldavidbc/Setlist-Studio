const CACHE_NAME = 'cue-sheet-cache-v6';
const urlsToCache = [
  './',
  './index.html',
  './estilos.css',
  './app.js',
  './ui.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// Instala el service worker y guarda los archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta, instalando nueva versión...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forzar la activación del nuevo SW
  );
});

// Intercepta las peticiones y sirve desde la caché si es posible
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si está en caché, lo devuelve. Si no, lo busca en la red.
        return response || fetch(event.request);
      })
  );
});

// Limpia cachés antiguas y toma el control
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (cacheWhitelist.indexOf(cacheName) === -1) {
          console.log('Borrando caché antigua:', cacheName);
          return caches.delete(cacheName);
        }
      })
    )).then(() => self.clients.claim()) // Tomar control de las pestañas abiertas
  );
});