/// <reference lib="webworker" />
/// <reference types="vite/client" />

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

interface SyncEvent extends ExtendableEvent {
  readonly tag: string;
  readonly lastChance: boolean;
}

interface SyncManager {
  register(tag: string): Promise<void>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  readonly sync: SyncManager;
}

const CACHE_NAME = 'mindshift-v1';
const DB_NAME = 'mindshift-clicks';
const STORE = 'pending';
const SYNC_TAG = 'sync-clicks';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// ── Cache static assets ───────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(self.__WB_MANIFEST.map((e) => e.url)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore(STORE, { autoIncrement: true });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueue(authHeader: string | null): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({ authHeader, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

type PendingClick = { key: IDBValidKey; authHeader: string | null };

async function getAll(): Promise<PendingClick[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const results: PendingClick[] = [];
    const req = tx.objectStore(STORE).openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        results.push({ key: cursor.key, ...(cursor.value as { authHeader: string | null }) });
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

async function deleteKey(key: IDBValidKey): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function broadcastCount(): Promise<void> {
  const items = await getAll();
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((c) => c.postMessage({ type: 'PENDING_COUNT', count: items.length }));
}

// ── Fetch interception ────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'POST' || !request.url.startsWith(API_URL) || url.pathname !== '/clicks') {
    return;
  }

  event.respondWith(
    fetch(request.clone()).catch(async () => {
      await enqueue(request.headers.get('Authorization'));
      if ('sync' in self.registration) {
        await (self.registration as ServiceWorkerRegistrationWithSync).sync.register(SYNC_TAG);
      }
      await broadcastCount();
      return new Response(JSON.stringify({ queued: true }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
  );
});

// ── Background Sync ───────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  const syncEvent = event as unknown as SyncEvent;
  if (syncEvent.tag === SYNC_TAG) {
    syncEvent.waitUntil(flush());
  }
});

async function flush(): Promise<void> {
  const items = await getAll();
  await Promise.all(
    items.map(async (item) => {
      try {
        const res = await fetch(`${API_URL}/clicks`, {
          method: 'POST',
          headers: item.authHeader ? { Authorization: item.authHeader } : {},
        });
        if (res.ok) await deleteKey(item.key);
      } catch {
        // Retry on next sync
      }
    }),
  );
  await broadcastCount();
}

// ── Responde GET_COUNT desde el app ───────────────────────────────────────────

self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_COUNT') {
    broadcastCount();
  }
});
