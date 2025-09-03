// Service Worker - 为全球用户提供离线访问和缓存优化
const CACHE_NAME = 'tiktok-customer-system-v1.0.0';
const urlsToCache = [
  '/',
  '/admin',
  '/assets/index-CLrEAVvh.css',
  '/assets/index-BAd5UGWB.js',
  '/manifest.json'
];

// 安装Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 获取缓存的资源
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // 如果缓存中有该资源，则返回缓存的版本
        if (response) {
          return response;
        }
        
        // 否则从网络获取
        return fetch(event.request).then(
          function(response) {
            // 检查我们是否收到了有效的响应
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // 克隆响应
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// 清理旧缓存
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});