// Life OS Service Worker v1.0.0
// Provides offline support with caching and background sync

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `life-os-cache-${CACHE_VERSION}`;
const API_CACHE_NAME = `life-os-api-cache-${CACHE_VERSION}`;

// Static assets to pre-cache (app shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/index.css',
  '/assets/index.js'
];

// API endpoints that should use network-first strategy
const API_PATTERNS = [
  '/api/',
  '/v1/',
  '/agents',
  '/workflow',
  '/productivity',
  '/ai/',
  '/memory/',
  '/qa/'
];

// Capture endpoints that need offline queue support
const CAPTURE_PATTERNS = [
  '/capture/',
  '/api/capture',
  '/v1/capture'
];

// IndexedDB configuration for offline queue
const DB_NAME = 'life-os-offline-db';
const DB_VERSION = 1;
const QUEUE_STORE = 'offline-queue';

// ============================================================================
// IndexedDB Helpers
// ============================================================================

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create offline queue store
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const store = db.createObjectStore(QUEUE_STORE, {
          keyPath: 'id',
          autoIncrement: true
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('url', 'url', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

async function addToQueue(request) {
  const db = await openDatabase();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);

  // Clone request data for storage
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: await request.clone().text(),
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0
  };

  return new Promise((resolve, reject) => {
    const addRequest = store.add(requestData);
    addRequest.onsuccess = () => resolve(addRequest.result);
    addRequest.onerror = () => reject(addRequest.error);
    tx.oncomplete = () => db.close();
  });
}

async function getQueuedRequests() {
  const db = await openDatabase();
  const tx = db.transaction(QUEUE_STORE, 'readonly');
  const store = tx.objectStore(QUEUE_STORE);
  const index = store.index('status');

  return new Promise((resolve, reject) => {
    const request = index.getAll('pending');
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function updateQueueItem(id, updates) {
  const db = await openDatabase();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        Object.assign(item, updates);
        const putRequest = store.put(item);
        putRequest.onsuccess = () => resolve(item);
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error('Item not found'));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
    tx.oncomplete = () => db.close();
  });
}

async function removeFromQueue(id) {
  const db = await openDatabase();
  const tx = db.transaction(QUEUE_STORE, 'readwrite');
  const store = tx.objectStore(QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function getQueueStats() {
  const db = await openDatabase();
  const tx = db.transaction(QUEUE_STORE, 'readonly');
  const store = tx.objectStore(QUEUE_STORE);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const items = request.result;
      const stats = {
        total: items.length,
        pending: items.filter(i => i.status === 'pending').length,
        failed: items.filter(i => i.status === 'failed').length,
        completed: items.filter(i => i.status === 'completed').length
      };
      db.close();
      resolve(stats);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

function isApiRequest(url) {
  return API_PATTERNS.some(pattern => url.includes(pattern));
}

function isCaptureRequest(url) {
  return CAPTURE_PATTERNS.some(pattern => url.includes(pattern));
}

function isStaticAsset(url) {
  const staticExtensions = ['.html', '.css', '.js', '.json', '.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => url.endsWith(ext)) || url.endsWith('/');
}

// ============================================================================
// Install Event - Pre-cache App Shell
// ============================================================================

self.addEventListener('install', (event) => {
  console.log(`[SW ${CACHE_VERSION}] Installing service worker...`);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log(`[SW ${CACHE_VERSION}] Pre-caching app shell...`);
        return cache.addAll(STATIC_ASSETS).catch((error) => {
          console.warn(`[SW ${CACHE_VERSION}] Some assets failed to cache:`, error);
          // Continue even if some assets fail
          return Promise.resolve();
        });
      })
      .then(() => {
        console.log(`[SW ${CACHE_VERSION}] App shell cached successfully`);
        // Force activation without waiting for existing clients to close
        return self.skipWaiting();
      })
  );
});

// ============================================================================
// Activate Event - Clean Up Old Caches
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log(`[SW ${CACHE_VERSION}] Activating service worker...`);

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old versioned caches
              return cacheName.startsWith('life-os-') &&
                     cacheName !== CACHE_NAME &&
                     cacheName !== API_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log(`[SW ${CACHE_VERSION}] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log(`[SW ${CACHE_VERSION}] Service worker activated`);
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// ============================================================================
// Fetch Event - Network/Cache Strategies
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP requests (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (isApiRequest(url.pathname)) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (isStaticAsset(url.pathname)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default: network-first for everything else
  event.respondWith(handleNetworkFirst(request));
});

// Network-first strategy for API calls
async function handleApiRequest(request) {
  const url = new URL(request.url);

  // Handle capture POST requests specially
  if (request.method === 'POST' && isCaptureRequest(url.pathname)) {
    return handleCaptureRequest(request);
  }

  try {
    // Try network first
    const networkResponse = await fetch(request.clone());

    // Cache successful GET responses
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log(`[SW ${CACHE_VERSION}] Network failed for API, checking cache:`, url.pathname);

    // Fall back to cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        console.log(`[SW ${CACHE_VERSION}] Returning cached API response`);
        return cachedResponse;
      }
    }

    // Return offline response for failed API calls
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are currently offline. This request has been queued.',
        cached: false
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle capture requests with offline queueing
async function handleCaptureRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request.clone());
    return networkResponse;
  } catch (error) {
    console.log(`[SW ${CACHE_VERSION}] Capture request failed, queuing for later...`);

    // Queue the request for later retry
    try {
      const queueId = await addToQueue(request);
      console.log(`[SW ${CACHE_VERSION}] Request queued with ID: ${queueId}`);

      // Register for background sync if supported
      if ('sync' in self.registration) {
        await self.registration.sync.register('sync-captures');
        console.log(`[SW ${CACHE_VERSION}] Background sync registered`);
      }

      // Return a response indicating the request was queued
      return new Response(
        JSON.stringify({
          queued: true,
          queueId: queueId,
          message: 'Request queued for sync when online'
        }),
        {
          status: 202,
          statusText: 'Accepted',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (queueError) {
      console.error(`[SW ${CACHE_VERSION}] Failed to queue request:`, queueError);
      return new Response(
        JSON.stringify({
          error: 'queue_failed',
          message: 'Failed to queue request for offline sync'
        }),
        {
          status: 500,
          statusText: 'Internal Server Error',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}

// Cache-first strategy for static assets
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Return cached version, but update cache in background
    fetchAndCache(request);
    return cachedResponse;
  }

  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log(`[SW ${CACHE_VERSION}] Static asset fetch failed:`, request.url);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/');
      if (offlinePage) return offlinePage;
    }

    return new Response('Offline', { status: 503 });
  }
}

// Network-first fallback strategy
async function handleNetworkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;

    // Return offline page for navigation
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/');
      if (offlinePage) return offlinePage;
    }

    return new Response('Offline', { status: 503 });
  }
}

// Background cache update
async function fetchAndCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse);
    }
  } catch (error) {
    // Silently fail - we already have cached version
  }
}

// ============================================================================
// Background Sync - Retry Queued Requests
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log(`[SW ${CACHE_VERSION}] Sync event triggered: ${event.tag}`);

  if (event.tag === 'sync-captures') {
    event.waitUntil(syncQueuedRequests());
  }
});

async function syncQueuedRequests() {
  console.log(`[SW ${CACHE_VERSION}] Syncing queued requests...`);

  const queuedRequests = await getQueuedRequests();
  console.log(`[SW ${CACHE_VERSION}] Found ${queuedRequests.length} queued requests`);

  const results = {
    success: 0,
    failed: 0,
    total: queuedRequests.length
  };

  for (const item of queuedRequests) {
    try {
      // Reconstruct the request
      const request = new Request(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body
      });

      const response = await fetch(request);

      if (response.ok) {
        // Remove from queue on success
        await removeFromQueue(item.id);
        results.success++;
        console.log(`[SW ${CACHE_VERSION}] Successfully synced request: ${item.url}`);
      } else {
        // Update retry count on failure
        await updateQueueItem(item.id, {
          retryCount: item.retryCount + 1,
          lastError: `HTTP ${response.status}`,
          lastAttempt: Date.now()
        });
        results.failed++;
        console.warn(`[SW ${CACHE_VERSION}] Failed to sync request: ${item.url} (HTTP ${response.status})`);
      }
    } catch (error) {
      // Network error - keep in queue for next sync
      await updateQueueItem(item.id, {
        retryCount: item.retryCount + 1,
        lastError: error.message,
        lastAttempt: Date.now(),
        status: item.retryCount >= 5 ? 'failed' : 'pending'
      });
      results.failed++;
      console.error(`[SW ${CACHE_VERSION}] Sync error for ${item.url}:`, error);
    }
  }

  // Notify clients of sync completion
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      results: results
    });
  });

  console.log(`[SW ${CACHE_VERSION}] Sync complete:`, results);
  return results;
}

// ============================================================================
// Message Handler - Manual Sync and Control
// ============================================================================

self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  console.log(`[SW ${CACHE_VERSION}] Message received: ${type}`);

  switch (type) {
    case 'MANUAL_SYNC':
      event.waitUntil(
        syncQueuedRequests().then(results => {
          event.ports[0]?.postMessage({ type: 'SYNC_RESULT', results });
        })
      );
      break;

    case 'GET_QUEUE_STATS':
      event.waitUntil(
        getQueueStats().then(stats => {
          event.ports[0]?.postMessage({ type: 'QUEUE_STATS', stats });
        })
      );
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys().then(names => {
          return Promise.all(names.map(name => caches.delete(name)));
        }).then(() => {
          event.ports[0]?.postMessage({ type: 'CACHE_CLEARED' });
        })
      );
      break;

    case 'GET_VERSION':
      event.ports[0]?.postMessage({ type: 'VERSION', version: CACHE_VERSION });
      break;

    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    default:
      console.warn(`[SW ${CACHE_VERSION}] Unknown message type: ${type}`);
  }
});

// ============================================================================
// Online/Offline Detection
// ============================================================================

self.addEventListener('online', () => {
  console.log(`[SW ${CACHE_VERSION}] Online detected, triggering sync...`);

  // Attempt to sync when coming back online
  if ('sync' in self.registration) {
    self.registration.sync.register('sync-captures');
  } else {
    // Fallback for browsers without background sync
    syncQueuedRequests();
  }
});

// ============================================================================
// Push Notifications (placeholder for future)
// ============================================================================

self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from Life OS',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Life OS', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Check if there's already a window open
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// ============================================================================
// Error Handling
// ============================================================================

self.addEventListener('error', (event) => {
  console.error(`[SW ${CACHE_VERSION}] Service worker error:`, event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error(`[SW ${CACHE_VERSION}] Unhandled promise rejection:`, event.reason);
});

console.log(`[SW ${CACHE_VERSION}] Service worker loaded`);
