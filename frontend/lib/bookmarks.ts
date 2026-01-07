/**
 * Bookmarks System
 * Allows users to bookmark reports, wisdom cards, and pages for quick access
 */

import { initDB, STORES } from './storage';

export interface Bookmark {
  id?: number;
  type: 'report' | 'wisdom-card' | 'page' | 'prediction';
  title: string;
  description?: string;
  url: string;
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt: string;
  lastAccessedAt?: string;
  accessCount?: number;
}

const BOOKMARK_STORE = 'bookmarks';

/**
 * Initialize bookmarks store if it doesn't exist
 */
async function ensureBookmarkStore(): Promise<IDBDatabase> {
  const db = await initDB();

  // Check if bookmarks store exists
  if (!db.objectStoreNames.contains(BOOKMARK_STORE)) {
    // Close and reopen with new version to add the store
    db.close();

    return new Promise((resolve, reject) => {
      const currentVersion = db.version;
      const request = indexedDB.open(db.name, currentVersion + 1);

      request.onerror = () => reject(new Error('Failed to upgrade database'));
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;

        if (!database.objectStoreNames.contains(BOOKMARK_STORE)) {
          const store = database.createObjectStore(BOOKMARK_STORE, {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('url', 'url', { unique: false });
          store.createIndex('tags', 'tags', { unique: false, multiEntry: true });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  return db;
}

/**
 * Add a bookmark
 */
export async function addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<number> {
  const db = await ensureBookmarkStore();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOOKMARK_STORE, 'readwrite');
    const store = transaction.objectStore(BOOKMARK_STORE);

    const newBookmark: Bookmark = {
      ...bookmark,
      createdAt: new Date().toISOString(),
      accessCount: 0,
    };

    const request = store.add(newBookmark);

    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(new Error('Failed to add bookmark'));
  });
}

/**
 * Get all bookmarks
 */
export async function getAllBookmarks(): Promise<Bookmark[]> {
  const db = await ensureBookmarkStore();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOOKMARK_STORE, 'readonly');
    const store = transaction.objectStore(BOOKMARK_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get bookmarks'));
  });
}

/**
 * Get bookmarks by type
 */
export async function getBookmarksByType(type: Bookmark['type']): Promise<Bookmark[]> {
  const db = await ensureBookmarkStore();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOOKMARK_STORE, 'readonly');
    const store = transaction.objectStore(BOOKMARK_STORE);
    const index = store.index('type');
    const request = index.getAll(type);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get bookmarks by type'));
  });
}

/**
 * Get bookmark by ID
 */
export async function getBookmark(id: number): Promise<Bookmark | null> {
  const db = await ensureBookmarkStore();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOOKMARK_STORE, 'readonly');
    const store = transaction.objectStore(BOOKMARK_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Failed to get bookmark'));
  });
}

/**
 * Update bookmark
 */
export async function updateBookmark(id: number, updates: Partial<Bookmark>): Promise<void> {
  const db = await ensureBookmarkStore();

  return new Promise(async (resolve, reject) => {
    const bookmark = await getBookmark(id);
    if (!bookmark) {
      reject(new Error('Bookmark not found'));
      return;
    }

    const transaction = db.transaction(BOOKMARK_STORE, 'readwrite');
    const store = transaction.objectStore(BOOKMARK_STORE);

    const updatedBookmark = {
      ...bookmark,
      ...updates,
      id, // Ensure ID doesn't change
    };

    const request = store.put(updatedBookmark);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to update bookmark'));
  });
}

/**
 * Delete bookmark
 */
export async function deleteBookmark(id: number): Promise<void> {
  const db = await ensureBookmarkStore();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOOKMARK_STORE, 'readwrite');
    const store = transaction.objectStore(BOOKMARK_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete bookmark'));
  });
}

/**
 * Check if URL is bookmarked
 */
export async function isBookmarked(url: string): Promise<boolean> {
  const db = await ensureBookmarkStore();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(BOOKMARK_STORE, 'readonly');
    const store = transaction.objectStore(BOOKMARK_STORE);
    const index = store.index('url');
    const request = index.getAll(url);

    request.onsuccess = () => resolve(request.result.length > 0);
    request.onerror = () => reject(new Error('Failed to check bookmark'));
  });
}

/**
 * Track bookmark access
 */
export async function trackBookmarkAccess(id: number): Promise<void> {
  const bookmark = await getBookmark(id);
  if (!bookmark) return;

  await updateBookmark(id, {
    lastAccessedAt: new Date().toISOString(),
    accessCount: (bookmark.accessCount || 0) + 1,
  });
}

/**
 * Search bookmarks
 */
export async function searchBookmarks(query: string): Promise<Bookmark[]> {
  const allBookmarks = await getAllBookmarks();
  const lowerQuery = query.toLowerCase();

  return allBookmarks.filter(bookmark =>
    bookmark.title.toLowerCase().includes(lowerQuery) ||
    bookmark.description?.toLowerCase().includes(lowerQuery) ||
    bookmark.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get recently accessed bookmarks
 */
export async function getRecentBookmarks(limit: number = 10): Promise<Bookmark[]> {
  const allBookmarks = await getAllBookmarks();

  return allBookmarks
    .filter(b => b.lastAccessedAt)
    .sort((a, b) => {
      const dateA = new Date(a.lastAccessedAt!).getTime();
      const dateB = new Date(b.lastAccessedAt!).getTime();
      return dateB - dateA;
    })
    .slice(0, limit);
}

/**
 * Get most accessed bookmarks
 */
export async function getPopularBookmarks(limit: number = 10): Promise<Bookmark[]> {
  const allBookmarks = await getAllBookmarks();

  return allBookmarks
    .sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0))
    .slice(0, limit);
}
