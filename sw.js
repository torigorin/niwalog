// niwaLog. Service Worker [dev]
// dev環境: install時に即skipWaiting → confirmなしで自動更新される
const CACHE_VERSION = 'niwalog-dev-v2';
const CACHE_NAME = CACHE_VERSION;

const URLS = [
  './',
  './index.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // dev: no-cacheでCDNキャッシュをバイパスし常に最新を取得
  e.respondWith(
    fetch(new Request(e.request, {cache: 'no-cache'})).then((res) => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
