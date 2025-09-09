// 优化的PWA Service Worker
// 缓存版本控制
const CACHE_VERSION = 'v1.2.0';
const CACHE_NAME = `pwa-cache-${CACHE_VERSION}`;
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// 静态资源列表（缓存优先策略）
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/styles.css',
    '/script.js',
    '/qrcode.min.js',
    '/local-qrcode.js',
    // 添加其他静态资源
    '/assets/',
    '/favicon.ico',
    '/icons/'
];

// 客户数据API路径（网络优先，永不缓存）
const CUSTOMER_DATA_PATTERNS = [
    '/api/customers',
    '/api/customer',
    '/api/data',
    '/admin',
    '/api/admin',
    'customer-data',
    'user-data'
];

// 离线页面
const OFFLINE_PAGE = '/offline.html';

// Service Worker 安装事件
self.addEventListener('install', (event) => {
    console.log('[SW] 安装中...', CACHE_VERSION);
    
    event.waitUntil(
        Promise.all([
            // 预缓存静态资源
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('[SW] 预缓存静态资源');
                return cache.addAll(STATIC_ASSETS.map(url => new Request(url, {
                    cache: 'reload'
                })));
            }),
            // 缓存离线页面
            caches.open(CACHE_NAME).then((cache) => {
                return cache.add(OFFLINE_PAGE);
            })
        ]).then(() => {
            // 强制激活新的 Service Worker
            return self.skipWaiting();
        })
    );
});

// Service Worker 激活事件
self.addEventListener('activate', (event) => {
    console.log('[SW] 激活中...', CACHE_VERSION);
    
    event.waitUntil(
        Promise.all([
            // 清理旧版本缓存
            cleanupOldCaches(),
            // 立即控制所有客户端
            self.clients.claim()
        ])
    );
});

// 清理旧版本缓存
async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const currentCaches = [CACHE_NAME, STATIC_CACHE, API_CACHE];
    
    return Promise.all(
        cacheNames.map(cacheName => {
            if (!currentCaches.some(current => cacheName.includes(current.split('-')[0]))) {
                console.log('[SW] 删除旧缓存:', cacheName);
                return caches.delete(cacheName);
            }
        })
    );
}

// 网络请求拦截
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // 只处理HTTP(S)请求
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // 客户数据请求 - 网络优先，永不缓存
    if (isCustomerDataRequest(request)) {
        event.respondWith(handleCustomerDataRequest(request));
        return;
    }
    
    // 静态资源请求 - 缓存优先策略
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticAssetRequest(request));
        return;
    }
    
    // API请求 - 网络优先，带缓存降级
    if (isApiRequest(request)) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // 默认处理 - 缓存优先
    event.respondWith(handleDefaultRequest(request));
});

// 判断是否为客户数据请求
function isCustomerDataRequest(request) {
    const url = request.url.toLowerCase();
    return CUSTOMER_DATA_PATTERNS.some(pattern => 
        url.includes(pattern) || request.url.includes(pattern)
    );
}

// 判断是否为静态资源
function isStaticAsset(request) {
    const url = new URL(request.url);
    const extension = url.pathname.split('.').pop()?.toLowerCase();
    const staticExtensions = ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'woff', 'woff2', 'ttf', 'ico'];
    
    return staticExtensions.includes(extension) || 
           STATIC_ASSETS.some(asset => request.url.includes(asset));
}

// 判断是否为API请求
function isApiRequest(request) {
    return request.url.includes('/api/') && !isCustomerDataRequest(request);
}

// 处理客户数据请求 - 网络优先，永不缓存
async function handleCustomerDataRequest(request) {
    try {
        console.log('[SW] 客户数据请求 - 网络优先:', request.url);
        
        // 添加no-cache头确保不被缓存
        const networkRequest = new Request(request.url, {
            method: request.method,
            headers: {
                ...Object.fromEntries(request.headers.entries()),
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            },
            body: request.method !== 'GET' ? await request.blob() : undefined
        });
        
        const response = await fetch(networkRequest);
        
        // 确保响应也不被缓存
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        responseHeaders.set('Pragma', 'no-cache');
        responseHeaders.set('Expires', '0');
        
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders
        });
        
    } catch (error) {
        console.error('[SW] 客户数据请求失败:', error);
        
        // 返回错误响应，不提供离线降级
        return new Response(JSON.stringify({
            error: '网络连接失败，客户数据需要网络连接',
            offline: true,
            timestamp: new Date().toISOString()
        }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}

// 处理静态资源请求 - 缓存优先策略
async function handleStaticAssetRequest(request) {
    try {
        console.log('[SW] 静态资源请求 - 缓存优先:', request.url);
        
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('[SW] 从缓存返回静态资源:', request.url);
            
            // 后台更新缓存
            fetch(request).then(response => {
                if (response.ok) {
                    cache.put(request, response.clone());
                }
            }).catch(() => {
                // 网络错误忽略
            });
            
            return cachedResponse;
        }
        
        // 缓存中没有，从网络获取
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // 缓存新的响应
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('[SW] 静态资源请求失败:', error);
        
        // 尝试从缓存中获取
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // 如果是HTML页面请求且没有缓存，返回离线页面
        if (request.destination === 'document') {
            const offlineResponse = await cache.match(OFFLINE_PAGE);
            if (offlineResponse) {
                return offlineResponse;
            }
        }
        
        throw error;
    }
}

// 处理API请求 - 网络优先，带缓存降级
async function handleApiRequest(request) {
    try {
        console.log('[SW] API请求 - 网络优先:', request.url);
        
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // 缓存成功的GET请求响应
            if (request.method === 'GET') {
                const cache = await caches.open(API_CACHE);
                cache.put(request, networkResponse.clone());
            }
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('[SW] API请求失败:', error);
        
        // 只对GET请求提供缓存降级
        if (request.method === 'GET') {
            const cache = await caches.open(API_CACHE);
            const cachedResponse = await cache.match(request);
            
            if (cachedResponse) {
                console.log('[SW] 使用缓存降级:', request.url);
                
                // 添加离线标识头
                const headers = new Headers(cachedResponse.headers);
                headers.set('X-Served-By', 'ServiceWorker-Cache');
                headers.set('X-Cache-Date', new Date().toISOString());
                
                return new Response(cachedResponse.body, {
                    status: cachedResponse.status,
                    statusText: cachedResponse.statusText,
                    headers: headers
                });
            }
        }
        
        throw error;
    }
}

// 默认请求处理 - 缓存优先
async function handleDefaultRequest(request) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            // 后台更新
            fetch(request).then(response => {
                if (response.ok) {
                    cache.put(request, response.clone());
                }
            }).catch(() => {});
            
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.error('[SW] 默认请求失败:', error);
        
        // 尝试从任何缓存中获取
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // 如果是文档请求，返回离线页面
        if (request.destination === 'document') {
            const offlineResponse = await cache.match(OFFLINE_PAGE);
            if (offlineResponse) {
                return offlineResponse;
            }
        }
        
        throw error;
    }
}

// 离线状态检测
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: CACHE_VERSION,
            caches: {
                static: STATIC_CACHE,
                api: API_CACHE,
                main: CACHE_NAME
            }
        });
    }
    
    if (event.data && event.data.type === 'CLEAN_CACHE') {
        event.waitUntil(cleanupOldCaches());
        event.ports[0].postMessage({ success: true });
    }
});

// 后台同步（如果支持）
if ('sync' in self.registration) {
    self.addEventListener('sync', (event) => {
        if (event.tag === 'background-sync') {
            event.waitUntil(doBackgroundSync());
        }
    });
}

// 后台同步处理
async function doBackgroundSync() {
    try {
        console.log('[SW] 执行后台同步');
        
        // 这里可以添加需要同步的数据处理逻辑
        // 例如：同步离线时产生的数据
        
        // 通知客户端同步完成
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'BACKGROUND_SYNC_SUCCESS'
            });
        });
        
    } catch (error) {
        console.error('[SW] 后台同步失败:', error);
    }
}

// 推送通知（如果需要）
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body || '您有新的消息',
            icon: '/favicon-192x192.png',
            badge: '/favicon-192x192.png',
            tag: data.tag || 'default',
            requireInteraction: true,
            actions: [
                {
                    action: 'open',
                    title: '查看'
                },
                {
                    action: 'close',
                    title: '关闭'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'TikTok客户系统', options)
        );
    }
});

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

console.log('[SW] Service Worker已加载，版本:', CACHE_VERSION);