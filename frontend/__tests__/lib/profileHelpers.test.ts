/**
 * Unit tests for profile helper functions
 * Tests loadCurrentProfile with fallback strategies and setCurrentProfileId
 */

import {
  loadCurrentProfile,
  setCurrentProfileId,
  clearCurrentProfileId,
  getCurrentProfileId,
} from '@/lib/profileHelpers';
import * as storage from '@/lib/storage';

// Mock storage module
jest.mock('@/lib/storage', () => ({
  getItem: jest.fn(),
  initDB: jest.fn(async () => ({
    transaction: jest.fn(),
  })),
  STORES: {
    PROFILES: 'profiles',
    REPORTS: 'reports',
    WISDOM_CARDS: 'wisdomCards',
    SETTINGS: 'settings',
    METADATA: 'metadata',
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Profile Helpers', () => {
  let getItemMock: jest.Mock;
  const storageMock = storage as jest.Mocked<typeof storage>;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();

    getItemMock = storageMock.getItem as jest.Mock;
    // Fully reset so mockResolvedValueOnce queues never leak between tests
    // (jest.clearAllMocks clears call data but not queued once-values)
    getItemMock.mockReset();
  });

  describe('setCurrentProfileId', () => {
    it('should store profile ID as string in localStorage', () => {
      setCurrentProfileId(123);
      expect(localStorageMock.getItem('current_profile_id')).toBe('123');
    });

    it('should store string IDs', () => {
      setCurrentProfileId('abc-123');
      expect(localStorageMock.getItem('current_profile_id')).toBe('abc-123');
    });

    it('should handle errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = jest.fn(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => setCurrentProfileId(123)).not.toThrow();

      // Restore
      localStorageMock.setItem = originalSetItem;
    });
  });

  describe('getCurrentProfileId', () => {
    it('should retrieve stored profile ID', () => {
      localStorageMock.setItem('current_profile_id', '456');
      expect(getCurrentProfileId()).toBe('456');
    });

    it('should return null when no ID is stored', () => {
      expect(getCurrentProfileId()).toBeNull();
    });

    it('should handle errors gracefully', () => {
      // Mock localStorage to throw error
      const originalGetItem = localStorageMock.getItem;
      localStorageMock.getItem = jest.fn(() => {
        throw new Error('Storage access denied');
      });

      expect(getCurrentProfileId()).toBeNull();

      // Restore
      localStorageMock.getItem = originalGetItem;
    });
  });

  describe('clearCurrentProfileId', () => {
    it('should remove profile ID from localStorage', () => {
      localStorageMock.setItem('current_profile_id', '789');
      clearCurrentProfileId();
      expect(localStorageMock.getItem('current_profile_id')).toBeNull();
    });

    it('should handle errors gracefully', () => {
      const originalRemoveItem = localStorageMock.removeItem;
      localStorageMock.removeItem = jest.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => clearCurrentProfileId()).not.toThrow();

      localStorageMock.removeItem = originalRemoveItem;
    });
  });

  describe('loadCurrentProfile', () => {
    it('should load profile by ID from localStorage (strategy 1)', async () => {
      const mockProfile = {
        name: 'Test User',
        dateOfBirth: '1990-01-01',
      };

      localStorageMock.setItem('current_profile_id', '123');
      getItemMock.mockResolvedValueOnce(mockProfile);

      const result = await loadCurrentProfile();

      expect(result).toEqual(mockProfile);
      expect(getItemMock).toHaveBeenCalledWith('profiles', 123, undefined);
    });

    it('should load profile with encryption key', async () => {
      const mockProfile = { name: 'Encrypted User' };
      const mockKey = {} as CryptoKey;

      localStorageMock.setItem('current_profile_id', '456');
      getItemMock.mockResolvedValueOnce(mockProfile);

      const result = await loadCurrentProfile(mockKey);

      expect(result).toEqual(mockProfile);
      expect(getItemMock).toHaveBeenCalledWith('profiles', 456, mockKey);
    });

    it('should fall back to literal key when ID not found (strategy 2)', async () => {
      const mockProfile = { name: 'Fallback User' };

      localStorageMock.setItem('current_profile_id', '999');
      getItemMock
        .mockResolvedValueOnce(null) // ID lookup fails
        .mockResolvedValueOnce(mockProfile); // Literal key succeeds

      const result = await loadCurrentProfile();

      expect(result).toEqual(mockProfile);
      expect(getItemMock).toHaveBeenCalledWith('profiles', 999, undefined);
      expect(getItemMock).toHaveBeenCalledWith('profiles', 'current_profile', undefined);
      // Should clear stale ID
      expect(localStorageMock.getItem('current_profile_id')).toBeNull();
    });

    it('should scan for most recent profile when other strategies fail (strategy 3)', async () => {
      // Mock initDB to return database with transaction support
      const mockCursor = {
        value: {
          id: 5,
          value: {
            name: 'Most Recent User',
            createdAt: '2023-01-15T00:00:00Z',
          },
          encrypted: false,
        },
        continue: jest.fn(),
      };

      const mockStore = {
        openCursor: jest.fn(() => ({
          onsuccess: null as any,
          onerror: null as any,
        })),
      };

      const mockTransaction = {
        objectStore: jest.fn(() => mockStore),
      };

      const mockDatabase = {
        transaction: jest.fn(() => mockTransaction),
      };

      storageMock.initDB.mockResolvedValueOnce(mockDatabase);

      localStorageMock.setItem('current_profile_id', '888');
      getItemMock
        .mockResolvedValueOnce(null) // ID lookup fails
        .mockResolvedValueOnce(null); // Literal key fails

      const loadPromise = loadCurrentProfile();

      // Wait for cursor setup
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate cursor success
      const cursorRequest = mockStore.openCursor.mock.results[0].value;
      if (cursorRequest.onsuccess) {
        cursorRequest.onsuccess({ target: { result: mockCursor } });

        // Trigger continue
        setTimeout(() => {
          if (cursorRequest.onsuccess) {
            cursorRequest.onsuccess({ target: { result: null } });
          }
        }, 0);
      }

      const result = await loadPromise;

      expect(result).toEqual({
        name: 'Most Recent User',
        createdAt: '2023-01-15T00:00:00Z',
        id: 5,
      });

      // Should set the found ID
      expect(localStorageMock.getItem('current_profile_id')).toBe('5');
    });

    it('should return null when no profile found', async () => {
      getItemMock
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const cursorRequest = {
        onsuccess: null as any,
        onerror: null as any,
      };

      const mockDatabase = {
        transaction: jest.fn(() => ({
          objectStore: jest.fn(() => ({
            openCursor: jest.fn(() => cursorRequest),
          })),
        })),
      };

      storageMock.initDB.mockResolvedValueOnce(mockDatabase);

      const loadPromise = loadCurrentProfile();

      // Wait for cursor setup and trigger cursor completion
      await new Promise((resolve) => setTimeout(resolve, 10));

      if (cursorRequest.onsuccess) {
        cursorRequest.onsuccess({ target: { result: null } });
      }

      const result = await loadPromise;

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      getItemMock.mockRejectedValueOnce(new Error('Database error'));

      const result = await loadCurrentProfile();

      expect(result).toBeNull();
    });

    it('should parse numeric IDs from localStorage', async () => {
      const mockProfile = { name: 'Numeric ID User' };

      localStorageMock.setItem('current_profile_id', '42');
      getItemMock.mockResolvedValueOnce(mockProfile);

      await loadCurrentProfile();

      // Should parse as number
      expect(getItemMock).toHaveBeenCalledWith('profiles', 42, undefined);
    });

    it('should keep string IDs as strings', async () => {
      const mockProfile = { name: 'String ID User' };

      localStorageMock.setItem('current_profile_id', 'uuid-abc-123');
      getItemMock.mockResolvedValueOnce(mockProfile);

      await loadCurrentProfile();

      // Should keep as string
      expect(getItemMock).toHaveBeenCalledWith('profiles', 'uuid-abc-123', undefined);
    });
  });

  describe('findMostRecentProfile (integration)', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      localStorageMock.clear();
    });

    it('should select profile with most recent updatedAt', async () => {
      const profiles = [
        {
          id: 1,
          value: {
            name: 'Old Profile',
            createdAt: '2020-01-01T00:00:00Z',
            updatedAt: '2020-01-01T00:00:00Z',
          },
          encrypted: false,
        },
        {
          id: 2,
          value: {
            name: 'Recent Profile',
            createdAt: '2021-01-01T00:00:00Z',
            updatedAt: '2023-06-15T00:00:00Z',
          },
          encrypted: false,
        },
        {
          id: 3,
          value: {
            name: 'Middle Profile',
            createdAt: '2022-01-01T00:00:00Z',
            updatedAt: '2022-01-01T00:00:00Z',
          },
          encrypted: false,
        },
      ];

      let cursorIndex = 0;

      const cursorRequest = {
        onsuccess: null as any,
        onerror: null as any,
      };

      const mockStore = {
        openCursor: jest.fn(() => cursorRequest),
      };

      const mockTransaction = {
        objectStore: jest.fn(() => mockStore),
      };

      const mockDatabase = {
        transaction: jest.fn(() => mockTransaction),
      };

      storageMock.initDB.mockResolvedValueOnce(mockDatabase);

      getItemMock.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

      const loadPromise = loadCurrentProfile();

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate cursor iteration through all profiles
      const iterateCursor = () => {
        if (cursorIndex < profiles.length) {
          const mockCursor = {
            value: profiles[cursorIndex],
            continue: () => {
              cursorIndex++;
              setTimeout(iterateCursor, 0);
            },
          };
          if (cursorRequest.onsuccess) {
            cursorRequest.onsuccess({ target: { result: mockCursor } });
          }
        } else {
          if (cursorRequest.onsuccess) {
            cursorRequest.onsuccess({ target: { result: null } });
          }
        }
      };

      iterateCursor();

      const result = await loadPromise;

      expect(result?.name).toBe('Recent Profile');
      expect(result?.id).toBe(2);
    });
  });
});
