// service-worker.js

// Nome della cache e versione. Cambia la versione (es. 'v2') ogni volta che aggiorni i file della cache
const CACHE_NAME = 'DnD-Campaigns-cache-v1';

// Lista dei file essenziali che vogliamo mettere in cache all'installazione
// Assicurati che questi percorsi siano corretti per il tuo Project Page di GitHub Pages
const urlsToCache = [
    '/DnD-Campaigns/', // La root del tuo progetto, spesso un alias per index.html
    '/DnD-Campaigns/index.html',
    '/DnD-Campaigns/style.css',
    '/DnD-Campaigns/script.js',
    '/DnD-Campaigns/manifest.json',
    '/DnD-Campaigns/icons/icon-192x192.png', // Assicurati di avere la cartella 'icons'
    '/DnD-Campaigns/icons/icon-512x512.png'  // con questi file all'interno
    // Aggiungi qui altri asset statici (immagini, font, ecc.)
];

// Evento 'install': Il service worker si sta installando.
// Qui mettiamo in cache tutti i file essenziali.
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installazione avviata');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching files durante l\'installazione');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting()) // Forza l'attivazione immediata del nuovo SW
            .catch((error) => {
                console.error('[Service Worker] Errore durante il caching:', error);
            })
    );
});

// Evento 'activate': Il service worker è stato attivato.
// Qui puliamo le vecchie cache.
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Attivazione avviata');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Eliminazione vecchia cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
            .then(() => self.clients.claim()) // Prende il controllo delle pagine aperte
    );
});

// Evento 'fetch': Intercetta le richieste di rete.
// Serve i file dalla cache se disponibili, altrimenti li recupera dalla rete.
self.addEventListener('fetch', (event) => {
    // Ignoriamo le richieste che non sono HTTP/HTTPS (es. chrome-extension://)
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Se troviamo una corrispondenza nella cache, la serviamo
                if (response) {
                    console.log(`[Service Worker] Servito da cache: ${event.request.url}`);
                    return response;
                }

                // Altrimenti, proviamo a recuperare dalla rete
                console.log(`[Service Worker] Recupero da rete: ${event.request.url}`);
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Se la richiesta di rete è valida, la mettiamo in cache per usi futuri
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        }
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Errore di fetch dalla rete:', event.request.url, error);
                        // Qui potresti servire una pagina offline personalizzata
                        // return caches.match('/DnD-Campaigns/offline.html');
                    });
            })
    );
});