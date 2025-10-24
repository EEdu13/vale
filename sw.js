const CACHE_NAME = 'silvacollect-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png'
];

// Install Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: Instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Cache aberto');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.log('Erro ao abrir cache:', err))
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: Ativando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Limpando cache antigo');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch Strategy: Network First, fallback to Cache
self.addEventListener('fetch', event => {
    // Ignorar requisições de chrome-extension e outras não HTTP
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Só cachear respostas bem-sucedidas
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                // Clone the response
                const responseClone = response.clone();
                
                // Open cache and store the response
                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseClone);
                    })
                    .catch(err => console.log('Erro ao cachear:', err));
                
                return response;
            })
            .catch(error => {
                console.log('Fetch falhou, tentando cache:', event.request.url);
                
                // If network fails, try cache
                return caches.match(event.request)
                    .then(response => {
                        if (response) {
                            return response;
                        }
                        
                        // If not in cache, return offline page
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // Para outros recursos, retornar resposta vazia
                        return new Response('', {
                            status: 404,
                            statusText: 'Not Found'
                        });
                    });
            })
    );
});

// Background Sync for data synchronization
self.addEventListener('sync', event => {
    console.log('Service Worker: Background sync', event);
    
    if (event.tag === 'sync-apontamentos') {
        event.waitUntil(syncApontamentos());
    }
});

async function syncApontamentos() {
    // This would sync local data with server when online
    console.log('Sincronizando apontamentos com servidor...');
    
    try {
        // Here you would fetch local IndexedDB data and POST to your API
        // Example:
        // const localData = await getUnsyncedData();
        // await fetch('/api/apontamentos', {
        //     method: 'POST',
        //     body: JSON.stringify(localData)
        // });
        
        console.log('Sincronização concluída!');
    } catch (error) {
        console.error('Erro na sincronização:', error);
        throw error; // Retry sync
    }
}

// Push Notifications (optional)
self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'SilvaCollect';
    const options = {
        body: data.body || 'Nova notificação',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200]
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});
