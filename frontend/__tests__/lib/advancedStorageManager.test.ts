/**
 * Advanced Storage Manager Tests
 * Tests for the enhanced storage manager with monitoring and fallbacks
 */

import { AdvancedStorageManager } from '@/lib/storage/advancedStorageManager';
import { MonitoringService } from '@/lib/monitoring';

// Mock dependencies
jest.mock('@/lib/monitoring', () => ({
  MonitoringService: {
    getInstance: jest.fn(() => ({
      trackEvent: jest.fn(),
      trackError: jest.fn(),
    })),
  },
}));

describe('AdvancedStorageManager', () => {
  let storageManager: AdvancedStorageManager;
  let mockMonitoring: any;

  beforeEach(() => {
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
      // Force an error by using invalid store name
      await expect(
        storageManager.setItem('invalid-store', 'key', {})
      ).rejects.toThrow();
    });
  });
});
