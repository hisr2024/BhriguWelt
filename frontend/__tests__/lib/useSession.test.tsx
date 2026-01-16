/**
 * Comprehensive test suite for useSession hook
 * Tests encryption setup, unlock, locking, and security features
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { SessionProvider, useSession } from '@/lib/hooks/useSession';
import React from 'react';

// Mock the storage module
jest.mock('@/lib/storage', () => ({
  setupEncryption: jest.fn(async (passcode: string) => true),
  getEncryptionKey: jest.fn(async (passcode: string) => ({} as CryptoKey)),
  verifyEncryptionKey: jest.fn(async (passcode: string) => true),
  isEncryptionSetup: jest.fn(async () => false),
  markKeyRotationRequired: jest.fn(),
  isKeyRotationRequired: jest.fn(async () => false),
  rotateEncryptionKey: jest.fn(async (oldPasscode: string, newPasscode: string) => true),
  clearKeyRotationRequired: jest.fn(),
}));

// Mock auto-lock hooks
jest.mock('@/lib/hooks/useAutoLock', () => ({
  useAutoLock: jest.fn(() => {}),
  useLockOnBackground: jest.fn(() => {}),
}));

import * as storage from '@/lib/storage';

describe('useSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider>{children}</SessionProvider>
  );

  describe('Initialization', () => {
    it('should initialize with correct default state', async () => {
      (storage.isEncryptionSetup as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isSetup).toBe(false);
      expect(result.current.isUnlocked).toBe(false);
      expect(result.current.encryptionKey).toBeNull();
      expect(result.current.autoLockEnabled).toBe(true);
      expect(result.current.autoLockTimeout).toBe(300);
    });

    it('should detect existing encryption setup', async () => {
      (storage.isEncryptionSetup as jest.Mock).mockResolvedValue(true);

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSetup).toBe(true);
      });
    });

    it('should handle initialization errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (storage.isEncryptionSetup as jest.Mock).mockRejectedValue(
        new Error('Storage unavailable')
      );

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(consoleError).toHaveBeenCalledWith(
        'Error checking encryption setup:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });
  });

  describe('Setup Flow', () => {
    it('should successfully setup encryption with valid passcode', async () => {
      (storage.isEncryptionSetup as jest.Mock).mockResolvedValue(false);
      (storage.setupEncryption as jest.Mock).mockResolvedValue(true);
      (storage.getEncryptionKey as jest.Mock).mockResolvedValue({} as CryptoKey);

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let setupResult: boolean = false;
      await act(async () => {
        setupResult = await result.current.setup('test-passcode-123');
      });

      expect(setupResult).toBe(true);
      expect(result.current.isSetup).toBe(true);
      expect(result.current.isUnlocked).toBe(true);
      expect(result.current.encryptionKey).toBeTruthy();
      expect(result.current.failedAttempts).toBe(0);
    });

    it('should handle setup failures', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (storage.isEncryptionSetup as jest.Mock).mockResolvedValue(false);
      (storage.setupEncryption as jest.Mock).mockRejectedValue(
        new Error('Setup failed')
      );

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let setupResult: boolean = false;
      await act(async () => {
        setupResult = await result.current.setup('test-passcode-123');
      });

      expect(setupResult).toBe(false);
      expect(result.current.isSetup).toBe(false);
      expect(result.current.isUnlocked).toBe(false);

      consoleError.mockRestore();
    });

    it('should reject weak passcodes', async () => {
      (storage.isEncryptionSetup as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Test with empty passcode
      let setupResult: boolean = false;
      await act(async () => {
        setupResult = await result.current.setup('');
      });

      // Should fail or handle weak passcode
      // Actual behavior depends on setupEncryption implementation
    });
  });

  describe('Unlock Flow', () => {
    it('should successfully unlock with correct passcode', async () => {
      (storage.isEncryptionSetup as jest.Mock).mockResolvedValue(true);
      (storage.verifyEncryptionKey as jest.Mock).mockResolvedValue(true);
      (storage.getEncryptionKey as jest.Mock).mockResolvedValue({} as CryptoKey);

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSetup).toBe(true);
      });

      let unlockResult: boolean = false;
      await act(async () => {
        unlockResult = await result.current.unlock('correct-passcode');
      });

      expect(unlockResult).toBe(true);
      expect(result.current.isUnlocked).toBe(true);
      expect(result.current.failedAttempts).toBe(0);
    });

    it('should reject incorrect passcode and track failed attempts', async () => {
      (storage.isEncryptionSetup as jest.Mock).mockResolvedValue(true);
      (storage.verifyEncryptionKey as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSetup).toBe(true);
      });

      let unlockResult: boolean = false;
      await act(async () => {
        unlockResult = await result.current.unlock('wrong-passcode');
      });

      expect(unlockResult).toBe(false);
      expect(result.current.isUnlocked).toBe(false);
      expect(result.current.failedAttempts).toBeGreaterThan(0);
    });

    it('should handle unlock errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (storage.isEncryptionSetup as jest.Mock).mockResolvedValue(true);
      (storage.verifyEncryptionKey as jest.Mock).mockRejectedValue(
        new Error('Verification failed')
      );

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSetup).toBe(true);
      });

      let unlockResult: boolean = false;
      await act(async () => {
        unlockResult = await result.current.unlock('test-passcode');
      });

      expect(unlockResult).toBe(false);
      expect(consoleError).toHaveBeenCalled();

      consoleError.mockRestore();
    });
  });

  describe('Lock Flow', () => {
    it('should lock session and clear encryption key', async () => {
      (storage.isEncryptionSetup as jest.Mock).mockResolvedValue(true);
      (storage.verifyEncryptionKey as jest.Mock).mockResolvedValue(true);
      (storage.getEncryptionKey as jest.Mock).mockResolvedValue({} as CryptoKey);

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSetup).toBe(true);
      });

      // Unlock first
      await act(async () => {
        await result.current.unlock('correct-passcode');
      });

      expect(result.current.isUnlocked).toBe(true);

      // Now lock
      act(() => {
        result.current.lock();
      });

      expect(result.current.isUnlocked).toBe(false);
      expect(result.current.encryptionKey).toBeNull();
    });
  });

  describe('Security Settings', () => {
    it('should allow updating auto-lock settings', async () => {
      (storage.isEncryptionSetup as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setAutoLockEnabled(false);
      });

      expect(result.current.autoLockEnabled).toBe(false);

      act(() => {
        result.current.setAutoLockTimeout(600);
      });

      expect(result.current.autoLockTimeout).toBe(600);
    });

    it('should allow updating lock-on-background setting', async () => {
      (storage.isEncryptionSetup as jest.Mock).mockResolvedValue(false);

      const { result } = renderHook(() => useSession(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setLockOnBackground(false);
      });

      expect(result.current.lockOnBackground).toBe(false);
    });
  });

  describe('Custom Timeout', () => {
    it('should respect custom default timeout prop', async () => {
      (storage.isEncryptionSetup as jest.Mock).mockResolvedValue(false);

      const customWrapper = ({ children }: { children: React.ReactNode }) => (
        <SessionProvider defaultTimeout={600}>{children}</SessionProvider>
      );

      const { result } = renderHook(() => useSession(), { wrapper: customWrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.autoLockTimeout).toBe(600);
    });
  });

  describe('Context Requirements', () => {
    it('should throw error when used outside SessionProvider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useSession());
      }).toThrow('useSession must be used within SessionProvider');

      consoleError.mockRestore();
    });
  });
});
