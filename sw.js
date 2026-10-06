/* =========================================================
   オフラインで遊べるようにする仕組み（サービスワーカー）
   - 一度ひらいたファイルをタブレットの中に保存しておき、
     ネットがないときは保存したものを使う
   - アプリを更新したら VERSION の数字を1つ上げる
   ========================================================= */
const VERSION = 'v2';
const CACHE = 'keisan-' + VERSION;

const APP_FILES = [
  './',
  './index.html',
  './style.css',
  './game.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// インストール時：アプリのファイルをまとめて保存
// （ブラウザが手元に残している古いファイルを使わず、必ずサーバーから取り直す）
self.addEventListener('install', (e) => {
  const requests = APP_FILES.map((url) => new Request(url, { cache: 'reload' }));
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(requests)).then(() => self.skipWaiting()));
});

// 古いバージョンの保存データを消す
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 保存してあるものをすぐ返し、ネットがつながっていれば裏で新しいものに入れかえる
// （フォントもここで保存されるので、2回目からはオフラインでも同じ文字で表示される）
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      // アプリ自身のファイルは、毎回サーバーに「新しくなった？」と確かめてから取る
      const sameOrigin = new URL(e.request.url).origin === self.location.origin;
      const network = (sameOrigin ? fetch(e.request.url, { cache: 'no-cache' }) : fetch(e.request))
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
