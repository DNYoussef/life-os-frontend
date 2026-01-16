/**
 * useOfflineQueue - React hook for managing offline captures
 *
 * Provides offline-first capture queue with automatic sync when coming back online.
 * Uses IndexedDB as primary storage with localStorage fallback.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============ TYPES ============

export type CaptureType = 'text' | 'voice';
export type QueueItemStatus = 'pending' | 'syncing' | 'failed';

/**
 * Text capture request payload
 */
export interface TextCaptureRequest {
  content: string;
  title?: string;
  tags?: string[];
  project_id?: number;
  category?: 'note' | 'idea' | 'task';
}

/**
 * Voice capture metadata (FormData stored separately)
 */
export interface VoiceCaptureMetadata {
  filename: string;
  mimeType: string;
  duration?: number;
  transcription?: string;
}

/**
 * Queued capture item stored in IndexedDB/localStorage
 */
export interface QueuedCapture {
  id: string;
  type: CaptureType;
  data: TextCaptureRequest | VoiceCaptureMetadata;
  /** Base64-encoded audio data for voice captures */
  audioData?: string;
  timestamp: number;
  retryCount: number;
  status: QueueItemStatus;
  error?: string;
}

/**
 * Hook return type
 */
export interface UseOfflineQueueResult {
  isOnline: boolean;
  pendingCount: number;
  pendingItems: QueuedCapture[];
  addToQueue: (capture: Omit<QueuedCapture, 'id' | 'timestamp' | 'retryCount' | 'status'>) => Promise<string>;
  syncQueue: () => Promise<SyncResult>;
  removeFromQueue: (id: string) => Promise<void>;
  clearQueue: () => Promise<void>;
  getQueueItem: (id: string) => Promise<QueuedCapture | null>;
  updateQueueItem: (id: string, updates: Partial<QueuedCapture>) => Promise<void>;
}

/**
 * Sync result summary
 */
export interface SyncResult {
  synced: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

// ============ CONSTANTS ============

const DB_NAME = 'life-os-offline-queue';
const DB_VERSION = 1;
const STORE_NAME = 'captures';
const LOCALSTORAGE_KEY = 'life-os-offline-queue-fallback';
const MAX_RETRY_COUNT = 3;
const SYNC_DEBOUNCE_MS = 1000;

// ============ INDEXEDDB HELPERS ============

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase | null> | null = null;

/**
 * Initialize IndexedDB connection
 */
function initDB(): Promise<IDBDatabase | null> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve) => {
    // Check if IndexedDB is available
    if (typeof indexedDB === 'undefined') {
      console.warn('[useOfflineQueue] IndexedDB not available, using localStorage fallback');
      resolve(null);
      return;
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.warn('[useOfflineQueue] IndexedDB error, using localStorage fallback');
        resolve(null);
      };

      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }
      };
    } catch {
      console.warn('[useOfflineQueue] IndexedDB init failed, using localStorage fallback');
      resolve(null);
    }
  });

  return dbInitPromise;
}

/**
 * Get all items from IndexedDB
 */
async function getAllFromDB(): Promise<QueuedCapture[]> {
  const db = await initDB();
  if (!db) return getFromLocalStorage();

  return new Promise((resolve, _reject) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.warn('[useOfflineQueue] IndexedDB getAll failed, using localStorage');
        resolve(getFromLocalStorage());
      };
    } catch {
      resolve(getFromLocalStorage());
    }
  });
}

/**
 * Get single item from IndexedDB
 */
async function getFromDB(id: string): Promise<QueuedCapture | null> {
  const db = await initDB();
  if (!db) {
    const items = getFromLocalStorage();
    return items.find((item) => item.id === id) || null;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Add or update item in IndexedDB
 */
async function putToDB(item: QueuedCapture): Promise<void> {
  const db = await initDB();
  if (!db) {
    putToLocalStorage(item);
    return;
  }

  return new Promise((resolve, _reject) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn('[useOfflineQueue] IndexedDB put failed, using localStorage');
        putToLocalStorage(item);
        resolve();
      };
    } catch {
      putToLocalStorage(item);
      resolve();
    }
  });
}

/**
 * Delete item from IndexedDB
 */
async function deleteFromDB(id: string): Promise<void> {
  const db = await initDB();
  if (!db) {
    deleteFromLocalStorage(id);
    return;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        deleteFromLocalStorage(id);
        resolve();
      };
    } catch {
      deleteFromLocalStorage(id);
      resolve();
    }
  });
}

/**
 * Clear all items from IndexedDB
 */
async function clearDB(): Promise<void> {
  const db = await initDB();
  if (!db) {
    clearLocalStorage();
    return;
  }

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        clearLocalStorage();
        resolve();
      };
    } catch {
      clearLocalStorage();
      resolve();
    }
  });
}

// ============ LOCALSTORAGE FALLBACK ============

function getFromLocalStorage(): QueuedCapture[] {
  try {
    const data = localStorage.getItem(LOCALSTORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function putToLocalStorage(item: QueuedCapture): void {
  try {
    const items = getFromLocalStorage();
    const index = items.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      items[index] = item;
    } else {
      items.push(item);
    }
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('[useOfflineQueue] localStorage put failed:', error);
  }
}

function deleteFromLocalStorage(id: string): void {
  try {
    const items = getFromLocalStorage();
    const filtered = items.filter((i) => i.id !== id);
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[useOfflineQueue] localStorage delete failed:', error);
  }
}

function clearLocalStorage(): void {
  try {
    localStorage.removeItem(LOCALSTORAGE_KEY);
  } catch (error) {
    console.error('[useOfflineQueue] localStorage clear failed:', error);
  }
}

// ============ UUID GENERATOR ============

function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============ SYNC LOGIC ============

const API_BASE = import.meta.env.VITE_API_URL || 'https://life-os-dashboard-production.up.railway.app';

/**
 * Sync a single capture to the server
 */
async function syncCapture(capture: QueuedCapture): Promise<void> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (capture.type === 'text') {
    const textData = capture.data as TextCaptureRequest;
    const category = textData.category || 'note';

    // Route to appropriate endpoint based on category
    let endpoint = '/api/v1/notes';
    if (category === 'idea') {
      endpoint = '/api/v1/ideas';
    } else if (category === 'task') {
      endpoint = '/api/v1/tasks';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: textData.title || 'Captured Note',
        content: textData.content,
        tags: textData.tags || [],
        project_id: textData.project_id,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
  } else if (capture.type === 'voice') {
    const voiceData = capture.data as VoiceCaptureMetadata;

    // Convert base64 audio back to Blob
    if (!capture.audioData) {
      throw new Error('Voice capture missing audio data');
    }

    const binaryString = atob(capture.audioData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: voiceData.mimeType });

    const formData = new FormData();
    formData.append('audio', audioBlob, voiceData.filename);
    if (voiceData.duration) {
      formData.append('duration', String(voiceData.duration));
    }
    if (voiceData.transcription) {
      formData.append('transcription', voiceData.transcription);
    }

    const response = await fetch(`${API_BASE}/api/v1/captures/voice`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
  }
}

// ============ HOOK ============

/**
 * useOfflineQueue - Manage offline captures with automatic sync
 *
 * @example
 * ```tsx
 * const { isOnline, pendingCount, addToQueue, syncQueue } = useOfflineQueue();
 *
 * // Add a text capture
 * await addToQueue({
 *   type: 'text',
 *   data: { content: 'My note', category: 'note' }
 * });
 *
 * // Manually trigger sync
 * const result = await syncQueue();
 * console.log(`Synced: ${result.synced}, Failed: ${result.failed}`);
 * ```
 */
export function useOfflineQueue(): UseOfflineQueueResult {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingItems, setPendingItems] = useState<QueuedCapture[]>([]);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  // Load initial queue state
  useEffect(() => {
    let mounted = true;

    async function loadQueue() {
      const items = await getAllFromDB();
      if (mounted) {
        setPendingItems(items);
      }
    }

    loadQueue();

    return () => {
      mounted = false;
    };
  }, []);

  // Online/offline event listeners
  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when coming back online (debounced)
  useEffect(() => {
    if (isOnline && pendingItems.length > 0) {
      // Clear existing timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Debounce sync to avoid rapid firing
      syncTimeoutRef.current = setTimeout(() => {
        syncQueue();
      }, SYNC_DEBOUNCE_MS);
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  /**
   * Add a capture to the offline queue
   */
  const addToQueue = useCallback(
    async (
      capture: Omit<QueuedCapture, 'id' | 'timestamp' | 'retryCount' | 'status'>
    ): Promise<string> => {
      const id = generateUUID();
      const queuedCapture: QueuedCapture = {
        ...capture,
        id,
        timestamp: Date.now(),
        retryCount: 0,
        status: 'pending',
      };

      await putToDB(queuedCapture);
      setPendingItems((prev) => [...prev, queuedCapture]);

      // Try immediate sync if online
      if (isOnline && !isSyncingRef.current) {
        // Debounce to batch rapid additions
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(() => {
          syncQueue();
        }, SYNC_DEBOUNCE_MS);
      }

      return id;
    },
    [isOnline]
  );

  /**
   * Sync all pending items in the queue
   */
  const syncQueue = useCallback(async (): Promise<SyncResult> => {
    if (isSyncingRef.current || !isOnline) {
      return { synced: 0, failed: 0, errors: [] };
    }

    isSyncingRef.current = true;
    const result: SyncResult = { synced: 0, failed: 0, errors: [] };

    try {
      const items = await getAllFromDB();
      const pendingOrFailed = items.filter(
        (item) => item.status === 'pending' || (item.status === 'failed' && item.retryCount < MAX_RETRY_COUNT)
      );

      for (const item of pendingOrFailed) {
        // Update status to syncing
        const syncingItem: QueuedCapture = { ...item, status: 'syncing' };
        await putToDB(syncingItem);
        setPendingItems((prev) =>
          prev.map((p) => (p.id === item.id ? syncingItem : p))
        );

        try {
          await syncCapture(item);

          // Success - remove from queue
          await deleteFromDB(item.id);
          setPendingItems((prev) => prev.filter((p) => p.id !== item.id));
          result.synced++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          // Failure - update retry count and status
          const failedItem: QueuedCapture = {
            ...item,
            status: 'failed',
            retryCount: item.retryCount + 1,
            error: errorMessage,
          };
          await putToDB(failedItem);
          setPendingItems((prev) =>
            prev.map((p) => (p.id === item.id ? failedItem : p))
          );
          result.failed++;
          result.errors.push({ id: item.id, error: errorMessage });
        }
      }
    } finally {
      isSyncingRef.current = false;
    }

    return result;
  }, [isOnline]);

  /**
   * Remove a specific item from the queue
   */
  const removeFromQueue = useCallback(async (id: string): Promise<void> => {
    await deleteFromDB(id);
    setPendingItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /**
   * Clear all items from the queue
   */
  const clearQueue = useCallback(async (): Promise<void> => {
    await clearDB();
    setPendingItems([]);
  }, []);

  /**
   * Get a specific queue item by ID
   */
  const getQueueItem = useCallback(async (id: string): Promise<QueuedCapture | null> => {
    return getFromDB(id);
  }, []);

  /**
   * Update a specific queue item
   */
  const updateQueueItem = useCallback(
    async (id: string, updates: Partial<QueuedCapture>): Promise<void> => {
      const existing = await getFromDB(id);
      if (existing) {
        const updated: QueuedCapture = { ...existing, ...updates, id }; // Ensure ID doesn't change
        await putToDB(updated);
        setPendingItems((prev) =>
          prev.map((p) => (p.id === id ? updated : p))
        );
      }
    },
    []
  );

  return {
    isOnline,
    pendingCount: pendingItems.filter((i) => i.status !== 'syncing').length,
    pendingItems,
    addToQueue,
    syncQueue,
    removeFromQueue,
    clearQueue,
    getQueueItem,
    updateQueueItem,
  };
}

export default useOfflineQueue;
