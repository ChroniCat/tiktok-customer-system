// TikTok Customer System Service Worker
// 基础Service Worker用于GitHub Pages部署

const CACHE_NAME = 'tiktok-customer-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin.html',
  '/styles.css',
  '/script.js'
];

// 安装事件
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache.map(url => {
          // 处理相对路径，添加仓库名前缀
          if (url.startsWith('/') && url !== '/') {
            return '/tiktok-customer-system' + url;
          } else if (url === '/') {
            return '/tiktok-customer-system/';
          }
          return url;
        }));
      })
      .catch(function(error) {
        console.log('Service Worker缓存失败:', error);
        // 即使缓存失败也继续安装
        return Promise.resolve();
      })
  );
});

// 获取事件
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // 如果缓存中有响应，返回缓存的版本
        if (response) {
          return response;
        }
        // 否则从网络获取
        return fetch(event.request);
      })
      .catch(function(error) {
        console.log('Service Worker fetch失败:', error);
        // 返回网络请求
        return fetch(event.request);
      })
  );
});

// 激活事件
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 错误处理
self.addEventListener('error', function(event) {
  console.log('Service Worker错误:', event.error);
});

console.log('TikTok Customer Service Worker 已加载');
