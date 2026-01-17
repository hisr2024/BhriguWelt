/**
 * Unit tests for storage fallback functionality
 * Tests getItem cursor fallback and setItem ID return
 */

import { initDB, setItem, getItem, STORES } from '@/lib/storage';
import * as crypto from '@/lib/crypto';

// Mock crypto functions for testing
jest.mock('@/lib/crypto', () => ({
  encryptForStorage: jest.fn(async (data: any) => JSON.stringify(data)),
  decryptFromStorage: jest.fn(async (encrypted: string) => JSON.parse(encrypted)),
  generateSalt: jest.fn(() => new Uint8Array(16)),
  deriveKey: jest.fn(async () => ({} as CryptoKey)),
  uint8ArrayToBase64: jest.fn((arr: Uint8Array) => 'mockBase64'),
  base64ToUint8Array: jest.fn(() => new Uint8Array(16)),
}));

// Mock IndexedDB with proper cursor support
class MockIDBCursor {
  value: any;
  key: any;
  private index: number;
  private items: any[];

  constructor(items: any[], index: number = 0) {
    this.items = items;
    this.index = index;
    this.value = items[index];
    this.key = index;
  }

  continue() {
    this.index++;
    if (this.index < this.items.length) {
      this.value = this.items[this.index];
      this.key = this.index;
      return true;
    }
    return false;
  }
}

describe('Storage Fallback Tests', () => {
  let mockDatabase: any;
  let mockStore: any;
  let mockTransaction: any;
  let storedItems: Map<string | number, any>;

  beforeEach(() => {
    storedItems = new Map();

    mockStore = {
      put: jest.fn((item: any) => {
        const id = item.id || storedItems.size + 1;
        const itemWithId = { ...item, id };
        storedItems.set(id, itemWithId);
        return {
          result: id,
          onsuccess: null as any,
          onerror: null as any,
        };
      }),
      get: jest.fn((key: string | number) => {
        return {
          result: storedItems.get(key) || null,
          onsuccess: null as any,
          onerror: null as any,
        };
      }),
      openCursor: jest.fn(() => {
        return {
          onsuccess: null as any,
          onerror: null as any,
        };
      }),
      createIndex: jest.fn(),
    };

    mockTransaction = {
      objectStore: jest.fn(() => mockStore),
      oncomplete: null as any,
      onerror: null as any,
    };

    mockDatabase = {
      transaction: jest.fn(() => mockTransaction),
      createObjectStore: jest.fn(() => mockStore),
      objectStoreNames: {
        contains: jest.fn(() => false),
      },
      close: jest.fn(),
    };

    const mockRequest = {
      onsuccess: null as any,
      onerror: null as any,
      onupgradeneeded: null as any,
      result: mockDatabase,
    };

    global.indexedDB = {
      open: jest.fn(() => mockRequest),
      deleteDatabase: jest.fn(() => mockRequest),
    } as any;

    // Trigger onsuccess immediately for initDB
    setTimeout(() => {
      if (mockRequest.onsuccess) {
        mockRequest.onsuccess({ target: { result: mockDatabase } });
      }
    }, 0);
  });

  describe('setItem returns assigned ID', () => {
    it('should return the assigned ID when storing a new item', async () => {
      const testData = { name: 'Test Profile', value: 'test-value' };

      // Wait for database initialization
      await initDB();

      // Mock the put request to simulate ID assignment
      const putRequest = {
        result: 123,
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.put = jest.fn(() => putRequest);

      // Start the setItem operation
      const setItemPromise = setItem(STORES.PROFILES, 'test_key', testData);

      // Trigger onsuccess
      setTimeout(() => {
        if (putRequest.onsuccess) {
          putRequest.onsuccess();
        }
      }, 0);

      const returnedId = await setItemPromise;

      expect(returnedId).toBe(123);
      expect(mockStore.put).toHaveBeenCalled();
    });

    it('should return ID for encrypted items', async () => {
      const testData = { secret: 'encrypted-data' };
      const mockKey = {} as CryptoKey;

      await initDB();

      const putRequest = {
        result: 456,
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.put = jest.fn(() => putRequest);

      const setItemPromise = setItem(STORES.PROFILES, 'encrypted_key', testData, mockKey);

      setTimeout(() => {
        if (putRequest.onsuccess) {
          putRequest.onsuccess();
        }
      }, 0);

      const returnedId = await setItemPromise;

      expect(returnedId).toBe(456);
    });
  });

  describe('getItem fallback cursor lookup', () => {
    it('should find item by direct key match first', async () => {
      await initDB();

      const testItem = {
        id: 1,
        key: 'current_profile',
        value: { name: 'Direct Match' },
        encrypted: false,
      };

      const getRequest = {
        result: testItem,
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.get = jest.fn(() => getRequest);

      const getItemPromise = getItem(STORES.PROFILES, 'current_profile');

      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess();
        }
      }, 0);

      const result = await getItemPromise;

      expect(result).toEqual({ name: 'Direct Match' });
      expect(mockStore.openCursor).not.toHaveBeenCalled();
    });

    it('should use cursor fallback when direct match fails', async () => {
      await initDB();

      // Direct get returns null
      const getRequest = {
        result: null,
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.get = jest.fn(() => getRequest);

      // Setup cursor with legacy-shaped items
      const legacyItems = [
        {
          id: 1,
          key: 'other_profile',
          value: { name: 'Other' },
          encrypted: false,
        },
        {
          id: 2,
          key: 'current_profile',
          value: { name: 'Legacy Profile' },
          encrypted: false,
        },
      ];

      const cursorRequest = {
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.openCursor = jest.fn(() => cursorRequest);

      const getItemPromise = getItem(STORES.PROFILES, 'current_profile');

      // Trigger get onsuccess (returns null)
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess();
        }

        // Then trigger cursor onsuccess
        setTimeout(() => {
          if (cursorRequest.onsuccess) {
            // Simulate cursor iteration
            let currentIndex = 0;
            const mockCursor = {
              value: legacyItems[currentIndex],
              continue: function () {
                currentIndex++;
                if (currentIndex < legacyItems.length) {
                  this.value = legacyItems[currentIndex];
                  setTimeout(() => {
                    if (cursorRequest.onsuccess) {
                      cursorRequest.onsuccess({ target: { result: this } });
                    }
                  }, 0);
                } else {
                  setTimeout(() => {
                    if (cursorRequest.onsuccess) {
                      cursorRequest.onsuccess({ target: { result: null } });
                    }
                  }, 0);
                }
              },
            };

            cursorRequest.onsuccess({ target: { result: mockCursor } });
          }
        }, 0);
      }, 0);

      const result = await getItemPromise;

      expect(result).toEqual({ name: 'Legacy Profile' });
      expect(mockStore.openCursor).toHaveBeenCalled();
    });

    it('should handle encrypted items in fallback cursor', async () => {
      await initDB();

      const mockKey = {} as CryptoKey;

      const getRequest = {
        result: null,
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.get = jest.fn(() => getRequest);

      const encryptedItems = [
        {
          id: 1,
          key: 'current_profile',
          value: JSON.stringify({ name: 'Encrypted Profile' }),
          encrypted: true,
        },
      ];

      const cursorRequest = {
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.openCursor = jest.fn(() => cursorRequest);

      const getItemPromise = getItem(STORES.PROFILES, 'current_profile', mockKey);

      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess();
        }

        setTimeout(() => {
          if (cursorRequest.onsuccess) {
            const mockCursor = {
              value: encryptedItems[0],
              continue: jest.fn(),
            };
            cursorRequest.onsuccess({ target: { result: mockCursor } });
          }
        }, 0);
      }, 0);

      const result = await getItemPromise;

      expect(result).toEqual({ name: 'Encrypted Profile' });
    });

    it('should return null when no match found in cursor', async () => {
      await initDB();

      const getRequest = {
        result: null,
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.get = jest.fn(() => getRequest);

      const cursorRequest = {
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.openCursor = jest.fn(() => cursorRequest);

      const getItemPromise = getItem(STORES.PROFILES, 'nonexistent_profile');

      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess();
        }

        setTimeout(() => {
          if (cursorRequest.onsuccess) {
            // Cursor returns null (no items)
            cursorRequest.onsuccess({ target: { result: null } });
          }
        }, 0);
      }, 0);

      const result = await getItemPromise;

      expect(result).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('should handle missing encryptionKey gracefully', async () => {
      await initDB();

      const getRequest = {
        result: null,
        onsuccess: null as any,
        onerror: null as any,
      };

      const cursorRequest = {
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.get = jest.fn(() => getRequest);
      mockStore.openCursor = jest.fn(() => cursorRequest);

      const getItemPromise = getItem(STORES.PROFILES, 'test_profile', undefined);

      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess();
        }
        // Also trigger cursor request
        setTimeout(() => {
          if (cursorRequest.onsuccess) {
            cursorRequest.onsuccess({ target: { result: null } });
          }
        }, 0);
      }, 0);

      const result = await getItemPromise;

      expect(result).toBeNull();
    });

    it('should handle decryption failures in cursor fallback', async () => {
      const cryptoMock = crypto as jest.Mocked<typeof crypto>;
      cryptoMock.decryptFromStorage.mockRejectedValueOnce(new Error('Decryption failed'));

      await initDB();

      const mockKey = {} as CryptoKey;

      const getRequest = {
        result: null,
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.get = jest.fn(() => getRequest);

      const encryptedItems = [
        {
          id: 1,
          key: 'current_profile',
          value: 'corrupted_data',
          encrypted: true,
        },
      ];

      const cursorRequest = {
        onsuccess: null as any,
        onerror: null as any,
      };

      mockStore.openCursor = jest.fn(() => cursorRequest);

      const getItemPromise = getItem(STORES.PROFILES, 'current_profile', mockKey);

      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess();
        }

        setTimeout(async () => {
          if (cursorRequest.onsuccess) {
            const mockCursor = {
              value: encryptedItems[0],
              continue: jest.fn(),
            };
            // Use setImmediate to ensure async resolution happens
            await cursorRequest.onsuccess({ target: { result: mockCursor } });
          }
        }, 10);
      }, 0);

      const result = await getItemPromise;

      expect(result).toBeNull();
    });
  });
});
