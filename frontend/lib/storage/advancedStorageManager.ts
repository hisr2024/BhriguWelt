/**
 * Advanced Storage Manager
 * Enhanced IndexedDB storage with monitoring, fallbacks, and comprehensive error handling
 */

import { MonitoringService } from '@/lib/monitoring';

export interface StorageConfig {
  dbName: string;
  version: number;
  stores: string[];
  maxRetries: number;
  retryDelay: number;
  enableFallbacks: boolean;
}

interface StorageRecord<T> {
  id: string;
  data: T;
  createdAt: string;
  updatedAt: string;
  version: string;
}

type MemoryStorage = Map<string, Map<string, unknown>>;

type WindowWithMemoryStorage = Window & {
  memoryStorage?: MemoryStorage;
};

export class AdvancedStorageManager {
  private static instance: AdvancedStorageManager;
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isInitializing = false;

  private config: StorageConfig = {
    dbName: 'BhriguWeltDB',
    version: 2,
    stores: ['profiles', 'reports', 'metadata', 'settings'],
    maxRetries: 3,
    retryDelay: 1000,
    enableFallbacks: true
  };

  static getInstance(): AdvancedStorageManager {
    if (!AdvancedStorageManager.instance) {
      AdvancedStorageManager.instance = new AdvancedStorageManager();
    }
    return AdvancedStorageManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.db || this.isInitializing) return;

    this.isInitializing = true;
    MonitoringService.getInstance().trackEvent('storage_initialization_started');

    try {
      await this.checkBrowserCompatibility();
      await this.checkStorageAvailability();
      this.db = await this.createDatabase();

      MonitoringService.getInstance().trackEvent('storage_initialization_success');
      console.log('✅ Advanced Storage Manager initialized successfully');

    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
      MonitoringService.getInstance().trackError(error as Error, { stage: 'storage_init' });

      if (this.config.enableFallbacks) {
        console.warn('🔄 Falling back to memory storage');
        this.initializeMemoryFallback();
      }

      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  private async checkBrowserCompatibility(): Promise<void> {
    if (!window.indexedDB) {
      throw new Error('IndexedDB not supported in this browser');
    }

    if (await this.isIncognitoMode()) {
      console.warn('⚠️ Incognito mode detected - storage may be limited');
      MonitoringService.getInstance().trackEvent('incognito_mode_detected');
    }

    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const available = (estimate.quota || 0) - (estimate.usage || 0);
      if (available < 10 * 1024 * 1024) {
        console.warn('⚠️ Low storage space available');
        MonitoringService.getInstance().trackEvent('low_storage_space', { available });
      }
    }
  }

  private async isIncognitoMode(): Promise<boolean> {
    return new Promise((resolve) => {
      const db = indexedDB.open('test');
      db.onerror = () => resolve(true);
      db.onsuccess = () => {
        indexedDB.deleteDatabase('test');
        resolve(false);
      };
    });
  }

  private async checkStorageAvailability(): Promise<void> {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (error) {
      throw new Error('LocalStorage not available');
    }
  }

  private async createDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        const db = request.result;
        console.log(`✅ Database opened: ${this.config.dbName} v${this.config.version}`);
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log(`🔄 Upgrading database to version ${this.config.version}`);

        this.config.stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('createdAt', 'createdAt', { unique: false });
            store.createIndex('updatedAt', 'updatedAt', { unique: false });
            console.log(`📦 Created store: ${storeName}`);
          }
        });
      };

      request.onblocked = () => {
        console.warn('⚠️ Database upgrade blocked - close other tabs');
        reject(new Error('Database upgrade blocked by other connections'));
      };
    });
  }

  private initializeMemoryFallback(): void {
    console.log('🔄 Initializing memory fallback storage');
    (window as WindowWithMemoryStorage).memoryStorage = new Map();
  }

  async setItem<T>(storeName: string, key: string, value: T): Promise<void> {
    await this.ensureInitialized();

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        const data: StorageRecord<T> = {
          id: key,
          data: value,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '2.0'
        };

        return new Promise((resolve, reject) => {
          const request = store.put(data);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(new Error(`Failed to store item: ${request.error?.message}`));
        });

      } catch (error) {
        console.warn(`Storage attempt ${attempt + 1} failed:`, error);

        if (attempt === this.config.maxRetries) {
          if (this.config.enableFallbacks) {
            console.warn('🔄 Using memory storage fallback');
            this.memorySetItem(storeName, key, value);
            return;
          }
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt)));
      }
    }
  }

  async getItem<T>(storeName: string, key: string): Promise<T | null> {
    await this.ensureInitialized();

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);

        return new Promise<T | null>((resolve, reject) => {
          const request = store.get(key);
          request.onsuccess = () => {
            const result = request.result as StorageRecord<T> | undefined;
            resolve(result ? result.data : null);
          };
          request.onerror = () => reject(new Error(`Failed to retrieve item: ${request.error?.message}`));
        });

      } catch (error) {
        if (attempt === this.config.maxRetries) {
          if (this.config.enableFallbacks) {
            return this.memoryGetItem(storeName, key);
          }
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * Math.pow(2, attempt)));
      }
    }

    return null;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.db && !this.isInitializing) {
      await this.initialize();
    }

    if (!this.db) {
      throw new Error('Database not initialized');
    }
  }

  private memoryGetItem<T>(store: string, key: string): T | null {
    const storeData = (window as WindowWithMemoryStorage).memoryStorage?.get(store);
    return (storeData?.get(key) as T | null) ?? null;
  }

  private memorySetItem<T>(store: string, key: string, value: T): void {
    let storeData = (window as WindowWithMemoryStorage).memoryStorage?.get(store);
    if (!storeData) {
      storeData = new Map();
      (window as WindowWithMemoryStorage).memoryStorage?.set(store, storeData);
    }
    storeData.set(key, value);
  }
}

// Export convenience functions
export const storageManager = AdvancedStorageManager.getInstance();

export const setItem = <T>(store: string, key: string, value: T) =>
  storageManager.setItem<T>(store, key, value);

export const getItem = <T>(store: string, key: string) =>
  storageManager.getItem<T>(store, key);

export const getItemSafe = async <T>(store: string, key: string): Promise<T | null> => {
  try {
    return await storageManager.getItem<T>(store, key);
  } catch {
    return null;
  }
};

// Initialize on import
if (typeof window !== 'undefined') {
  storageManager.initialize().catch(error => {
    console.error('Failed to initialize storage manager:', error);
  });
}
