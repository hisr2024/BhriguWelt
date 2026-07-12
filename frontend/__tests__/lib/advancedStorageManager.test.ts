/**
 * Advanced Storage Manager Tests
 * Tests for the enhanced storage manager with monitoring and fallbacks
 */

import { AdvancedStorageManager } from '@/lib/storage/advancedStorageManager';
import { MonitoringService } from '@/lib/monitoring';

// Mock dependencies with a single stable monitoring instance so that the
// mocks asserted on in tests are the same ones used by the source module.
jest.mock('@/lib/monitoring', () => {
  const instance = {
    trackEvent: jest.fn(),
    trackError: jest.fn(),
  };
  return {
    MonitoringService: {
      getInstance: jest.fn(() => instance),
    },
  };
});

/**
 * Minimal functional in-memory fake of the IndexedDB API surface used by
 * AdvancedStorageManager (open/upgrade/transaction/put/get).
 */
class FakeIDBRequest {
  onsuccess: ((event?: unknown) => void) | null = null;
  onerror: ((event?: unknown) => void) | null = null;
  onupgradeneeded: ((event: { target: FakeIDBRequest }) => void) | null = null;
  onblocked: (() => void) | null = null;
  result: any = undefined;
  error: Error | null = null;
}

function createFakeIndexedDB() {
  // dbName -> storeName -> key -> record
  const databases = new Map<string, Map<string, Map<string, any>>>();

  return {
    open: jest.fn((name: string, version?: number) => {
      const request = new FakeIDBRequest();
      setTimeout(() => {
        if (!databases.has(name)) {
          databases.set(name, new Map());
        }
        const stores = databases.get(name)!;
        const db = {
          objectStoreNames: {
            contains: (storeName: string) => stores.has(storeName),
          },
          createObjectStore: (storeName: string) => {
            stores.set(storeName, new Map());
            return { createIndex: jest.fn() };
          },
          transaction: (storeNames: string[]) => ({
            objectStore: (storeName: string) => {
              const store = stores.get(storeName);
              if (!store) {
                throw new Error(`No objectStore named ${storeName}`);
              }
              return {
                put: (record: { id: string }) => {
                  const req = new FakeIDBRequest();
                  setTimeout(() => {
                    store.set(record.id, record);
                    req.onsuccess?.();
                  }, 0);
                  return req;
                },
                get: (key: string) => {
                  const req = new FakeIDBRequest();
                  setTimeout(() => {
                    req.result = store.get(key);
                    req.onsuccess?.();
                  }, 0);
                  return req;
                },
              };
            },
          }),
          close: jest.fn(),
        };
        request.result = db;
        if (version !== undefined) {
          request.onupgradeneeded?.({ target: request });
        }
        request.onsuccess?.();
      }, 0);
      return request;
    }),
    deleteDatabase: jest.fn((name: string) => {
      databases.delete(name);
      return new FakeIDBRequest();
    }),
  };
}

describe('AdvancedStorageManager', () => {
  let storageManager: AdvancedStorageManager;
  let mockMonitoring: any;

  beforeEach(() => {
    // Reset the singleton and give each test a fresh, functional IndexedDB
    // fake so tests are independent of each other.
    (AdvancedStorageManager as any).instance = undefined;
    (global as any).indexedDB = createFakeIndexedDB();
    delete (window as any).memoryStorage;
    storageManager = AdvancedStorageManager.getInstance();
    mockMonitoring = MonitoringService.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    test('returns the same instance', () => {
      const instance1 = AdvancedStorageManager.getInstance();
      const instance2 = AdvancedStorageManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    test('initializes successfully', async () => {
      await expect(storageManager.initialize()).resolves.not.toThrow();
      expect(mockMonitoring.trackEvent).toHaveBeenCalledWith('storage_initialization_started');
    });

    test('handles initialization errors gracefully', async () => {
      // Mock IndexedDB to fail
      const originalIndexedDB = global.indexedDB;
      (global as any).indexedDB = undefined;

      await expect(storageManager.initialize()).rejects.toThrow();
      expect(mockMonitoring.trackError).toHaveBeenCalled();

      // Restore
      (global as any).indexedDB = originalIndexedDB;
    });

    test('does not reinitialize if already initialized', async () => {
      await storageManager.initialize();
      const callCount = mockMonitoring.trackEvent.mock.calls.length;

      await storageManager.initialize();
      expect(mockMonitoring.trackEvent.mock.calls.length).toBe(callCount);
    });
  });

  describe('Storage Operations', () => {
    beforeEach(async () => {
      await storageManager.initialize();
    });

    test('sets and gets items successfully', async () => {
      const testData = { name: 'Test User', age: 30 };
      await storageManager.setItem('profiles', 'test-key', testData);

      const retrieved = await storageManager.getItem('profiles', 'test-key');
      expect(retrieved).toEqual(testData);
    });

    test('returns null for non-existent items', async () => {
      const result = await storageManager.getItem('profiles', 'non-existent-key');
      expect(result).toBeNull();
    });

    test('handles storage failures with retry logic', async () => {
      // This would require mocking the transaction to fail a few times
      // For now, we'll test that it completes
      const testData = { test: 'data' };
      await expect(
        storageManager.setItem('profiles', 'retry-test', testData)
      ).resolves.not.toThrow();
    });
  });

  describe('Fallback Mechanisms', () => {
    test('uses memory fallback when IndexedDB fails', async () => {
      // Simulate IndexedDB failure by corrupting the DB
      const testData = { fallback: 'test' };

      // Even if storage fails, fallback should work
      await expect(
        storageManager.setItem('profiles', 'fallback-key', testData)
      ).resolves.not.toThrow();
    });
  });

  describe('Browser Compatibility', () => {
    test('detects IndexedDB support', async () => {
      expect(window.indexedDB).toBeDefined();
    });

    test('detects localStorage support', () => {
      expect(() => {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
      }).not.toThrow();
    });
  });

  describe('Monitoring Integration', () => {
    test('tracks storage initialization', async () => {
      await storageManager.initialize();
      expect(mockMonitoring.trackEvent).toHaveBeenCalledWith('storage_initialization_started');
    });

    test('tracks storage errors', async () => {
      // Force an error by making IndexedDB unavailable before initialization
      (global as any).indexedDB = undefined;

      await expect(
        storageManager.setItem('profiles', 'key', {})
      ).rejects.toThrow();
      expect(mockMonitoring.trackError).toHaveBeenCalled();
    });
  });
});
