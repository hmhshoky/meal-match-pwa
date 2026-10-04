/* The cache name is generated from the release contents. */
const VERSION = 'v2-95e042655986ed70';
const BASE = new URL(self.registration.scope);
const PREFIX = 'meal-match-pwa:' + encodeURIComponent(BASE.pathname) + ':';
const CACHE = PREFIX + VERSION;
const FILES = ['index.html','pwa.js','manifest.webmanifest','icons/icon.svg','icons/icon-192.png','icons/icon-512.png','icons/icon-maskable.png','icons/apple-touch-icon.png'];
const URLS = FILES.map(path => new URL(path, BASE).href);
const SHELL = new URL('index.html', BASE).href;

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll(URLS.map(url => new Request(url, {cache:'reload'}))); }
    catch (error) { await caches.delete(CACHE); throw error; }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(PREFIX) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return;
  const entry = request.mode === 'navigate' && (url.pathname === BASE.pathname || url.pathname === new URL(SHELL).pathname);
  const canonical = new URL(url); canonical.search = ''; canonical.hash = '';
  if (!entry && !URLS.includes(canonical.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(entry ? SHELL : canonical.href);
    if (cached) return cached;
    return fetch(request);
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') { event.waitUntil(self.skipWaiting()); return; }
  if (event.data?.type === 'CACHE_STATUS' || event.data?.type === 'PREPARE_OFFLINE') {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE);
      if (event.data.type === 'PREPARE_OFFLINE') {
        try { await cache.addAll(URLS.map(url => new Request(url, {cache:'reload'}))); }
        catch (_) { /* Keep any existing assets when network preparation fails. */ }
      }
      const present = await Promise.all(URLS.map(url => cache.match(url)));
      event.ports?.[0]?.postMessage({ready:present.every(Boolean),version:VERSION});
    })());
  }
});
