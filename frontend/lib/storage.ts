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
const DB_VERSION = 1;

// Store names
export const STORES = {
  PROFILES: 'profiles',
  REPORTS: 'reports',
  WISDOM_CARDS: 'wisdomCards',
  SETTINGS: 'settings',
  METADATA: 'metadata',
} as const;

// IndexedDB connection
let db: IDBDatabase | null = null;

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

      // Create object stores if they don't exist
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
    };
  });
}

/**
 * Close the database connection
 */
export function closeDB(): void {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Clear all data from the database (for testing or reset)
 */
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
  });
}

/**
 * Secure wipe - completely destroys all data and encryption setup
 * WARNING: This is irreversible and will delete ALL user data
 */
export async function secureWipe(): Promise<void> {
  try {
    // Clear all data from IndexedDB
    await clearDB();

    // Close the database connection
    closeDB();

    // Delete the entire database
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

/**
 * Reset encryption - clears encryption metadata but preserves unencrypted data
 * Use this to change passcode or reset encryption setup
 */
export async function resetEncryption(): Promise<void> {
  try {
    await deleteItem(STORES.METADATA, 'encryptionSalt');
    await deleteItem(STORES.METADATA, 'encryptionTest');
    await deleteItem(STORES.METADATA, 'passcodeHash');
    await deleteItem(STORES.METADATA, 'setupComplete');
  } catch (error) {
    throw new Error(`Failed to reset encryption: ${error}`);
  }
}

/**
 * Store encrypted data
 */
export async function setItem(
  storeName: string,
  key: string,
  data: any,
  encryptionKey?: CryptoKey
): Promise<void> {
  const database = await initDB();

  return new Promise(async (resolve, reject) => {
    try {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      // Encrypt data if encryption key is provided
      const valueToStore = encryptionKey
        ? await encryptForStorage(data, encryptionKey)
        : data;

      const item = {
        ...data,
        key,
        value: valueToStore,
        encrypted: !!encryptionKey,
        updatedAt: new Date().toISOString(),
      };

      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store item'));
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Retrieve and decrypt data
 */
export async function getItem(
  storeName: string,
  key: string | number,
  encryptionKey?: CryptoKey
): Promise<any> {
  const database = await initDB();

  return new Promise(async (resolve, reject) => {
    try {
      const transaction = database.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = async () => {
        const item = request.result;

        if (!item) {
          resolve(null);
          return;
        }

        // Decrypt if encrypted
        if (item.encrypted && encryptionKey) {
          try {
            const decrypted = await decryptFromStorage(item.value, encryptionKey);
            resolve(decrypted);
          } catch (error) {
            reject(new Error('Failed to decrypt item - incorrect key?'));
          }
        } else {
          resolve(item);
        }
      };

      request.onerror = () => reject(new Error('Failed to retrieve item'));
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get all items from a store
 */
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
          resolve([]);
          return;
        }

        // Decrypt items if encrypted
        if (encryptionKey) {
          try {
            const decrypted = await Promise.all(
              items.map((item) => {
                if (item.encrypted) {
                  return decryptFromStorage(item.value, encryptionKey);
                }
                return item;
              })
            );
            resolve(decrypted);
          } catch (error) {
            reject(new Error('Failed to decrypt items - incorrect key?'));
          }
        } else {
          resolve(items);
        }
      };

      request.onerror = () => reject(new Error('Failed to retrieve items'));
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Delete an item
 */
export async function deleteItem(
  storeName: string,
  key: string | number
): Promise<void> {
  const database = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete item'));
  });
}

/**
 * Count items in a store
 */
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

/**
 * Setup encryption (store salt for key derivation)
 */
export async function setupEncryption(passcode: string): Promise<void> {
  const salt = generateSalt();
  const saltBase64 = uint8ArrayToBase64(salt);

  // Store salt in metadata
  await setItem(STORES.METADATA, 'encryptionSalt', { value: saltBase64 });

  // Derive and test the key
  const key = await deriveKey(passcode, salt);

  // Store a test encrypted value to verify key works
  const testData = { test: 'encryption setup successful' };
  await setItem(STORES.METADATA, 'encryptionTest', testData, key);
}

/**
 * Get encryption key from passcode
 */
export async function getEncryptionKey(passcode: string): Promise<CryptoKey> {
  const saltItem = await getItem(STORES.METADATA, 'encryptionSalt');

  if (!saltItem || !saltItem.value) {
    throw new Error('Encryption not set up - salt not found');
  }

  const salt = base64ToUint8Array(saltItem.value);
  return deriveKey(passcode, salt);
}

/**
 * Verify passcode by attempting to decrypt test data
 */
export async function verifyEncryptionKey(passcode: string): Promise<boolean> {
  try {
    const key = await getEncryptionKey(passcode);
    const testItem = await getItem(STORES.METADATA, 'encryptionTest', key);
    return testItem && testItem.test === 'encryption setup successful';
  } catch (error) {
    return false;
  }
}

/**
 * Check if encryption is set up
 */
export async function isEncryptionSetup(): Promise<boolean> {
  try {
    const saltItem = await getItem(STORES.METADATA, 'encryptionSalt');
    return !!saltItem;
  } catch (error) {
    return false;
  }
}

/**
 * Export database to JSON (for backup)
 */
export async function exportDatabase(encryptionKey?: CryptoKey): Promise<string> {
  const database = await initDB();
  const exportData: any = {};

  for (const storeName of Object.values(STORES)) {
    exportData[storeName] = await getAllItems(storeName, encryptionKey);
  }

  return JSON.stringify(exportData);
}

/**
 * Import database from JSON (for restore)
 */
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
