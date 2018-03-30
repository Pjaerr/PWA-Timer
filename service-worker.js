var cacheName = 'timerPWA-1'; //The name of the cache, named so that different caches can be updated without breaking other caches.

/**All of the files that will be cached and loaded from cache when possible.*/
var filesToCache = [
    '/',
    '/index.html',
    '/PWA-Timer/index.html',
    '/app.js',
    '/background_process.js',
    '/materialize',
    '/alarm.mp3',
    '/manifest.json'
];

/**Service Worker Install event.*/
self.addEventListener('install', function (e)
{
    console.log('[ServiceWorker] Install');

    /**Opens the cache by cacheName and then adds all specified files
     * to the cache. Returns when finished.*/
    e.waitUntil(
        caches.open(cacheName).then(function (cache)
        {
            console.log('[ServiceWorker] Caching app shell');
            return cache.addAll(filesToCache);
        }).catch(e => { console.log(e); })
    );
});

/**Service Worker Activate event.*/
self.addEventListener('activate', function (e)
{
    /**When the service worker is activated, pass the name of the current cache as key
     * if that cache is not equal to the most up to cache (ie. cacheName has changed), then
     * update the current cache.*/
    console.log('[ServiceWorker] Activate');
    e.waitUntil(
        caches.keys().then(function (keyList)
        {
            return Promise.all(keyList.map(function (key)
            {
                if (key !== cacheName)
                {
                    console.log('[ServiceWorker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
    return self.clients.claim(); //Activate the service worker faster.
});

/**Service Worker Fetch event.*/
self.addEventListener('fetch', function (e)
{
    /**Evaluates the fetch request and checks to see if it is avaiable in the cache,
     * if it is, it will respond with the cached version, if not, it uses fetch to get
     * a copy from the network. The response is passed back to the webpage via event.respondWith()*/
    console.log('[ServiceWorker] Fetch', e.request.url);
    e.respondWith(
        caches.match(e.request).then(function (response)
        {
            return response || fetch(e.request);
        })
    );
});