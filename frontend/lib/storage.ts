/**
 * Encrypted IndexedDB storage for offline-first PWA
 * Stores profiles, reports, and wisdom cards with AES-GCM encryption
 */

import {
  deriveKey,
  generateSalt,
  encryptForStorage,
  decryptFromStorage,
  uint8ArrayToBase64,
  base64ToUint8Array,
} from './crypto';

// Database configuration
const DB_NAME = 'BhriguWeltDB';
const DB_VERSION = 2;
const METADATA_KEYS = {
  LEGACY_SALT: 'encryptionSalt',
  USER_ID: 'encryptionUserId',
} as const;

const getUserSaltKey = (userId: string) => `encryptionSalt:${userId}`;

// Store names
export const STORES = {
  PROFILES: 'profiles',
  REPORTS: 'reports',
  WISDOM_CARDS: 'wisdomCards',
  SETTINGS: 'settings',
  METADATA: 'metadata',
  ANALYTICS: 'analytics',
} as const;

const DEFAULT_ANALYTICS_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Check if debug mode is enabled
 */
const isDebugEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('storageDebug') === 'true';
};

/**
 * Enable verbose storage logging for debugging
 * Usage: window.enableStorageDebug()
 */
export const enableStorageDebug = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('storageDebug', 'true');
    console.log('✅ Storage debug logging enabled');
  }
};

/**
 * Disable verbose storage logging
 * Usage: window.disableStorageDebug()
 */
export const disableStorageDebug = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem('storageDebug');
    console.log('✅ Storage debug logging disabled');
  }
};

/**
 * Performance monitoring wrapper for storage operations
 * Only logs slow operations (>100ms) and errors
 */
const withPerformanceTracking = async <T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - startTime;

    // Only log slow operations (>100ms)
    if (duration > 100) {
      console.warn(`⚠️ Slow storage operation: ${operation} took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    console.error(`❌ Storage operation failed: ${operation} (${duration.toFixed(2)}ms)`, error);
    throw error;
  }
};

// IndexedDB connection
let db: IDBDatabase | null = null;

function generateUserId(): string {
  if (typeof window === 'undefined' || typeof window.crypto === 'undefined') {
    throw new Error('crypto is not available');
  }

  if ('randomUUID' in window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return uint8ArrayToBase64(window.crypto.getRandomValues(new Uint8Array(16)));
}

/**
 * Initialize the IndexedDB database
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open database'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(STORES.PROFILES)) {
        const profileStore = database.createObjectStore(STORES.PROFILES, {
          keyPath: 'id',
          autoIncrement: true,
        });
        profileStore.createIndex('name', 'name', { unique: false });
        profileStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.REPORTS)) {
        const reportStore = database.createObjectStore(STORES.REPORTS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        reportStore.createIndex('profileId', 'profileId', { unique: false });
        reportStore.createIndex('type', 'type', { unique: false });
        reportStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!database.objectStoreNames.contains(STORES.WISDOM_CARDS)) {
        const wisdomStore = database.createObjectStore(STORES.WISDOM_CARDS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        wisdomStore.createIndex('category', 'category', { unique: false });
        wisdomStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
      }

      if (!database.objectStoreNames.contains(STORES.SETTINGS)) {
        database.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      if (!database.objectStoreNames.contains(STORES.METADATA)) {
        database.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }

      if (!database.objectStoreNames.contains(STORES.ANALYTICS)) {
        const analyticsStore = database.createObjectStore(STORES.ANALYTICS, { keyPath: 'key' });
        analyticsStore.createIndex('profileId', 'profileId', { unique: false });
        analyticsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });
}

export function closeDB(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export async function clearDB(): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      Object.values(STORES),
      'readwrite'
    );

    transaction.onerror = () => reject(new Error('Failed to clear database'));
    transaction.oncomplete = () => resolve();

    Object.values(STORES).forEach((storeName) => {
      const store = transaction.objectStore(storeName);
      store.clear();
    });

    if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) {
      setTimeout(() => resolve(), 0);
    }
  });
}

export async function secureWipe(): Promise<void> {
  try {
    await clearDB();
    closeDB();

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);

      request.onsuccess = () => {
        console.log('Database deleted successfully');
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete database'));
      };

      request.onblocked = () => {
        console.warn('Database deletion blocked - close all tabs');
        reject(new Error('Database deletion blocked'));
      };
    });
  } catch (error) {
    throw new Error(`Secure wipe failed: ${error}`);
  }
}

export async function resetEncryption(): Promise<void> {
  try {
    const userId = await getItem(STORES.METADATA, METADATA_KEYS.USER_ID);
    if (userId && typeof userId === 'string') {
      await deleteItem(STORES.METADATA, getUserSaltKey(userId));
    }
    await deleteItem(STORES.METADATA, METADATA_KEYS.LEGACY_SALT);
    await deleteItem(STORES.METADATA, METADATA_KEYS.USER_ID);
    await deleteItem(STORES.METADATA, 'encryptionTest');
    await deleteItem(STORES.METADATA, 'passcodeHash');
    await deleteItem(STORES.METADATA, 'setupComplete');
  } catch (error) {
    throw new Error(`Failed to reset encryption: ${error}`);
  }
}

export async function setItem(
  storeName: string,
  key: string,
  data: any,
  encryptionKey?: CryptoKey
): Promise<IDBValidKey> {
  const database = await initDB();

  let item: any;

  if (encryptionKey) {
    const encryptedValue = await encryptForStorage(data, encryptionKey);
    item = {
      key,
      value: encryptedValue,
      encrypted: true,
      updatedAt: new Date().toISOString(),
    };
  } else {
    // Store data as the value (no extraction of nested properties)
    item = {
      key,
      value: data,
      encrypted: false,
      updatedAt: new Date().toISOString(),
    };
  }

  return new Promise((resolve, reject) => {
    try {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        // Silent success
        resolve(request.result);
      };

      request.onerror = () => {
        console.error(`Failed to set item (key="${key}", store="${storeName}"):`, request.error);
        reject(new Error(`Failed to store item: ${request.error}`));
      };
    } catch (error) {
      console.error(`Storage error in setItem (key="${key}", store="${storeName}"):`, error);
      reject(error);
    }
  });
}

export async function getItem(
  storeName: string,
  key: string | number,
  encryptionKey?: CryptoKey
): Promise<any> {
  const database = await initDB();

  return new Promise(async (resolve) => {
    try {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = async () => {
        const item = request.result;

        if (item) {
          // Direct match found
          if (item.encrypted && encryptionKey) {
            try {
              const decrypted = await decryptFromStorage(item.value, encryptionKey);
              resolve(decrypted);
            } catch (error) {
              console.error('Failed to decrypt item - incorrect key?', error);
              resolve(null);
            }
          } else {
            // Return just the value for unencrypted items
            resolve(item.value);
          }
          return;
        }

        // No direct match - try fallback cursor search for legacy-shaped records
        // Feature flag check (default: enabled)
        const fallbackEnabled = typeof process === 'undefined' ||
          process.env.FRONTEND_ENABLE_STORAGE_FALLBACK !== 'false';

        if (!fallbackEnabled) {
          resolve(null);
          return;
        }

        // Silently return null for missing items (not an error condition)
        // Only log if explicitly in debug mode
        if (isDebugEnabled()) {
          console.debug(`Storage: key="${key}" not found in store="${storeName}", checking legacy format`);
        }

        // Open cursor to search for matching records
        const cursorTransaction = database.transaction(storeName, 'readonly');
        const cursorStore = cursorTransaction.objectStore(storeName);
        const cursorRequest = cursorStore.openCursor();
        let matchFound = false;
        let recordsScanned = 0;
        const MAX_SCAN = 2000; // Safety limit to prevent infinite loops

        cursorRequest.onsuccess = async (event: any) => {
          try {
            const cursor = event.target.result;

            if (!cursor || matchFound || recordsScanned >= MAX_SCAN) {
              if (recordsScanned >= MAX_SCAN) {
                console.warn(`Storage fallback: scanned ${MAX_SCAN} records without finding match for key="${key}"`);
              }
              if (!matchFound) {
                resolve(null);
              }
              return;
            }

            recordsScanned++;
            const entry = cursor.value;

            // Check multiple match patterns for backward compatibility
            const keyMatch =
              entry.key === key ||
              entry.value?.key === key ||
              entry.value?.id === key;

            if (keyMatch) {
              matchFound = true;
              // Silent success - only log in debug mode
              if (isDebugEnabled()) {
                console.debug(`Storage: legacy record found at cursor position ${recordsScanned}`);
              }

              // Decrypt if necessary
              if (entry.encrypted && encryptionKey) {
                try {
                  const decrypted = await decryptFromStorage(entry.value, encryptionKey);
                  resolve(decrypted);
                } catch (error) {
                  console.error('Storage fallback: decryption failed', error);
                  resolve(null);
                }
              } else if (typeof entry.value === 'object' && entry.value !== null && 'value' in entry.value) {
                // Legacy shape: { key, value, encrypted }
                resolve(entry.value.value);
              } else {
                // Direct value
                resolve(entry.value);
              }
              return;
            }

            cursor.continue();
          } catch (error) {
            console.error('Storage fallback: cursor error', error);
            if (!matchFound) {
              resolve(null);
            }
          }
        };

        cursorRequest.onerror = () => {
          console.error('Storage fallback: cursor request failed');
          if (!matchFound) {
            resolve(null);
          }
        };
      };

      request.onerror = () => {
        console.error('Failed to retrieve item');
        resolve(null);
      };
    } catch (error) {
      console.error('getItem error:', error);
      resolve(null);
    }
  });
}

export interface AnalyticsCacheEntry {
  analytics: any;
  chartData?: any;
  profileId?: string | number;
  cachedAt: string;
  source?: 'api' | 'cache' | 'fallback';
}

export async function setAnalyticsCache(
  cacheKey: string,
  entry: Omit<AnalyticsCacheEntry, 'cachedAt'>,
  encryptionKey?: CryptoKey
): Promise<IDBValidKey> {
  const payload: AnalyticsCacheEntry = {
    ...entry,
    cachedAt: new Date().toISOString(),
  };

  return withPerformanceTracking('setAnalyticsCache', () =>
    setItem(STORES.ANALYTICS, cacheKey, payload, encryptionKey)
  );
}

export async function getAnalyticsCache(
  cacheKey: string,
  encryptionKey?: CryptoKey,
  maxAgeMs: number = DEFAULT_ANALYTICS_CACHE_TTL_MS
): Promise<AnalyticsCacheEntry | null> {
  return withPerformanceTracking('getAnalyticsCache', async () => {
    const cached = await getItem(STORES.ANALYTICS, cacheKey, encryptionKey);
    if (!cached) {
      return null;
    }

    const cachedAt = cached.cachedAt ?? cached.updatedAt;
    if (cachedAt) {
      const ageMs = Date.now() - new Date(cachedAt).getTime();
      if (Number.isFinite(ageMs) && ageMs > maxAgeMs) {
        await deleteItem(STORES.ANALYTICS, cacheKey);
        return null;
      }
    }

    return cached;
  });
}

export async function clearAnalyticsCache(cacheKey: string): Promise<void> {
  await deleteItem(STORES.ANALYTICS, cacheKey);
}

async function getRawItems(storeName: string): Promise<any[]> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(new Error('Failed to retrieve items'));
  });
}

async function putRawItems(storeName: string, items: any[]): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    items.forEach((item) => store.put(item));

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Failed to update items'));
  });
}

export async function getAllItems(
  storeName: string,
  encryptionKey?: CryptoKey
): Promise<any[]> {
  const database = await initDB();

  return new Promise(async (resolve, reject) => {
    try {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = async () => {
        const items = request.result;

        if (!items || items.length === 0) {
          // Silent success - empty result is not an error
          resolve([]);
          return;
        }

        if (encryptionKey) {
          try {
            const decrypted = await Promise.all(
              items.map(async (item) => {
                let data;
                if (item.encrypted) {
                  data = await decryptFromStorage(item.value, encryptionKey);
                } else {
                  // Return just the value for unencrypted items
                  data = item.value;
                }
                // Include the id from IndexedDB in the returned object
                return { ...data, id: item.id };
              })
            );
            // Silent success
            resolve(decrypted);
          } catch (error) {
            console.error(`Failed to decrypt items from store="${storeName}":`, error);
            reject(new Error('Failed to decrypt items - incorrect key?'));
          }
        } else {
          // Return values with their IDs for unencrypted items
          // Silent success
          resolve(items.map(item => ({ ...item.value, id: item.id })));
        }
      };

      request.onerror = () => {
        console.error(`Failed to get all items from store="${storeName}":`, request.error);
        reject(new Error(`Failed to retrieve items: ${request.error}`));
      };
    } catch (error) {
      console.error(`Storage error in getAllItems (store="${storeName}"):`, error);
      reject(error);
    }
  });
}

async function getActiveEncryptionUserId(): Promise<string | null> {
  const existing = await getItem(STORES.METADATA, METADATA_KEYS.USER_ID);
  if (existing && typeof existing === 'string') {
    return existing;
  }

  const legacySalt = await getItem(STORES.METADATA, METADATA_KEYS.LEGACY_SALT);
  if (legacySalt && typeof legacySalt === 'string') {
    const userId = generateUserId();
    await setItem(STORES.METADATA, METADATA_KEYS.USER_ID, userId);
    await setItem(STORES.METADATA, getUserSaltKey(userId), legacySalt);
    await deleteItem(STORES.METADATA, METADATA_KEYS.LEGACY_SALT);
    return userId;
  }

  return null;
}

async function ensureEncryptionUserId(): Promise<string> {
  const existing = await getActiveEncryptionUserId();
  if (existing) {
    return existing;
  }

  const userId = generateUserId();
  await setItem(STORES.METADATA, METADATA_KEYS.USER_ID, userId);
  return userId;
}

export async function deleteItem(
  storeName: string,
  key: string | number
): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    try {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        // Silent success
        resolve();
      };

      request.onerror = () => {
        console.error(`Failed to delete item (key="${key}", store="${storeName}"):`, request.error);
        reject(new Error(`Failed to delete item: ${request.error}`));
      };
    } catch (error) {
      console.error(`Storage error in deleteItem (key="${key}", store="${storeName}"):`, error);
      reject(error);
    }
  });
}

export async function countItems(storeName: string): Promise<number> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to count items'));
  });
}

export async function setupEncryption(passcode: string): Promise<CryptoKey> {
  const userId = await ensureEncryptionUserId();
  const salt = generateSalt();
  const saltBase64 = uint8ArrayToBase64(salt);

  // Store salt as a string value (not wrapped in an additional object)
  await deleteItem(STORES.METADATA, METADATA_KEYS.LEGACY_SALT);
  await setItem(STORES.METADATA, getUserSaltKey(userId), saltBase64);

  const key = await deriveKey(passcode, salt);

  const testData = { test: 'encryption setup successful' };
  await setItem(STORES.METADATA, 'encryptionTest', testData, key);

  return key;
}

export async function getEncryptionKey(passcode: string): Promise<CryptoKey> {
  const userId = await getActiveEncryptionUserId();
  if (!userId) {
    throw new Error('Encryption not set up - user not found');
  }

  const saltValue = await getItem(STORES.METADATA, getUserSaltKey(userId));

  if (!saltValue || typeof saltValue !== 'string') {
    throw new Error('Encryption not set up - salt not found or invalid');
  }

  const salt = base64ToUint8Array(saltValue);
  return deriveKey(passcode, salt);
}

export async function verifyEncryptionKey(passcode: string): Promise<boolean> {
  try {
    const key = await getEncryptionKey(passcode);
    const testItem = await getItem(STORES.METADATA, 'encryptionTest', key);
    return testItem && testItem.test === 'encryption setup successful';
  } catch (error) {
    return false;
  }
}

export async function isEncryptionSetup(): Promise<boolean> {
  try {
    const userId = await getActiveEncryptionUserId();
    if (!userId) {
      return false;
    }
    const saltValue = await getItem(STORES.METADATA, getUserSaltKey(userId));
    return !!saltValue && typeof saltValue === 'string';
  } catch (error) {
    return false;
  }
}

/**
 * Mark that encryption key rotation is required
 * Uses new location: SETTINGS store with key 'encryption_rotation_status'
 */
export async function markKeyRotationRequired(): Promise<void> {
  await setItem(STORES.SETTINGS, 'encryption_rotation_status', true);
}

/**
 * Check if encryption key rotation is required
 * Uses new location: SETTINGS store with key 'encryption_rotation_status'
 */
export async function isKeyRotationRequired(): Promise<boolean> {
  const value = await getItem(STORES.SETTINGS, 'encryption_rotation_status');
  return value === true;
}

/**
 * Clear the encryption key rotation required flag
 * Uses new location: SETTINGS store with key 'encryption_rotation_status'
 */
export async function clearKeyRotationRequired(): Promise<void> {
  await deleteItem(STORES.SETTINGS, 'encryption_rotation_status');
}

export async function rotateEncryptionKey(
  passcode: string,
  currentKey: CryptoKey
): Promise<CryptoKey> {
  const userId = await ensureEncryptionUserId();
  const newSalt = generateSalt();
  const newSaltBase64 = uint8ArrayToBase64(newSalt);
  const newKey = await deriveKey(passcode, newSalt);

  for (const storeName of Object.values(STORES)) {
    const items = await getRawItems(storeName);
    if (!items.length) {
      continue;
    }

    const updatedItems = await Promise.all(
      items.map(async (item) => {
        if (!item.encrypted) {
          return item;
        }
        const decrypted = await decryptFromStorage(item.value, currentKey);
        const encryptedValue = await encryptForStorage(decrypted, newKey);
        return {
          ...item,
          value: encryptedValue,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    await putRawItems(storeName, updatedItems);
  }

  await deleteItem(STORES.METADATA, METADATA_KEYS.LEGACY_SALT);
  await setItem(STORES.METADATA, getUserSaltKey(userId), newSaltBase64);
  const testData = { test: 'encryption setup successful' };
  await setItem(STORES.METADATA, 'encryptionTest', testData, newKey);

  return newKey;
}

export async function exportDatabase(encryptionKey?: CryptoKey): Promise<string> {
  const exportData: any = {};

  for (const storeName of Object.values(STORES)) {
    exportData[storeName] = await getAllItems(storeName, encryptionKey);
  }

  return JSON.stringify(exportData);
}

export async function importDatabase(
  jsonData: string,
  encryptionKey?: CryptoKey
): Promise<void> {
  const data = JSON.parse(jsonData);

  for (const storeName of Object.values(STORES)) {
    if (data[storeName]) {
      for (const item of data[storeName]) {
        await setItem(storeName, item.key || item.id, item, encryptionKey);
      }
    }
  }
}
