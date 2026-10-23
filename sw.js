/* CinemaTheatre: оболочка приложения работает без сети. Каталог хранится в localStorage, его service worker не трогает.
   Запросы к Apps Script и постеры идут мимо кеша. Новая версия: поменять VERSION. */
const VERSION = 'ct-1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;   // таблица, шрифты, постеры — напрямую
  // сначала сеть (свежая версия), без сети — из кеша; «Поделиться» открывает ./?text=… — отдаём index.html
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      if (res.ok) caches.open(VERSION).then(c => c.put(url.search ? './' : e.request, copy));
      return res;
    }).catch(() => caches.match(url.search ? './' : e.request).then(r => r || caches.match('./')))
  );
});
