// niwaLog. Service Worker
// 更新したら CACHE_VERSION の数字を必ず上げること（上げ忘れると古いキャッシュが使われ続ける）
const CACHE_VERSION = 'niwalog-v1';
const CACHE_NAME = CACHE_VERSION;

// キャッシュする初期URL（index.html自体。サブパスは環境によって変わるため自分自身の階層を基準にする）
const URLS = [
  './',
  './index.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(URLS))
  );
  // ここでは skipWaiting() を呼ばない。
  // 呼ぶと「インストール完了」と同時に即アクティブ化されてしまい、
  // HTML側の「確認してから更新」ダイアログが意味をなさなくなる。
  // アクティブ化はユーザーが確認した後、message イベント経由で行う。
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// HTML側から postMessage({type:'SKIP_WAITING'}) を受け取ったら待機中のSWを有効化する
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (e) => {
  // GET以外（POSTなど）はそのままネットワークへ
  if (e.request.method !== 'GET') return;

  e.respondWith(
    // Network First: まずネットワークから取得、失敗したらキャッシュにフォールバック
    fetch(e.request).then((res) => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
