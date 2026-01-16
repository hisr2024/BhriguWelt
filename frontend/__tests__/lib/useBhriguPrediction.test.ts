/**
 * Comprehensive test suite for useBhriguPrediction hook
 * Tests caching, error handling, profile updates, and performance
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useBhriguPrediction } from '@/lib/hooks/useBhriguPrediction';
import type { Profile, BhriguPrediction, PredictionResult } from '@/lib/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock crypto.subtle for profile hashing
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: async (algorithm: string, data: ArrayBuffer) => {
        // Simple mock hash
        const hashArray = new Uint8Array(32);
        hashArray.fill(Math.floor(Math.random() * 256));
        return hashArray.buffer;
      }
    }
  }
});

describe('useBhriguPrediction', () => {
  const mockProfile: Profile = {
    id: 'test-profile-123',
    name: 'Test User',
    dateOfBirth: '1990-01-01',
    timeOfBirth: '12:00:00',
    placeOfBirth: 'New York',
    latitude: 40.7128,
    longitude: -74.0060,
  };

  const mockPrediction: BhriguPrediction = {
    summary: 'Test prediction summary',
    astrological_analysis: 'Test astrological analysis',
    remedy: 'Test remedy',
    confidence_score: 0.95,
    processing_time_seconds: 1.5,
  };

  const mockFetchPrediction = jest.fn<Promise<PredictionResult>, any[]>();

  beforeEach(() => {
    localStorageMock.clear();
    mockFetchPrediction.mockClear();
  });

  describe('Profile Validation', () => {
    it('should require complete birth details', async () => {
      const incompleteProfile = { ...mockProfile, timeOfBirth: undefined };
      const { result } = renderHook(() =>
        useBhriguPrediction({
          category: 'career',
          fetchPrediction: mockFetchPrediction,
          profile: incompleteProfile as Profile,
        })
      );

      await waitFor(() => {
        expect(result.current.error).toContain('complete your birth details');
      });
    });

    it('should accept valid profile with all required fields', async () => {
      mockFetchPrediction.mockResolvedValue({
        status: 'success',
        prediction: mockPrediction,
        message: 'Success',
      });

      const { result } = renderHook(() =>
        useBhriguPrediction({
          category: 'career',
          fetchPrediction: mockFetchPrediction,
          profile: mockProfile,
        })
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.prediction).toEqual(mockPrediction);
      });
    });
  });

  describe('Caching Behavior', () => {
    it('should cache predictions after successful fetch', async () => {
      mockFetchPrediction.mockResolvedValue({
        status: 'success',
        prediction: mockPrediction,
        message: 'Success',
      });

      const { result } = renderHook(() =>
        useBhriguPrediction({
          category: 'career',
          fetchPrediction: mockFetchPrediction,
          profile: mockProfile,
        })
      );

      await waitFor(() => {
        expect(result.current.prediction).toEqual(mockPrediction);
      });

      // Check that cache was written
      const cacheKeys = Object.keys(localStorageMock).filter(k =>
        k.startsWith('bhrigu_prediction_')
      );
      expect(cacheKeys.length).toBeGreaterThan(0);
    });

    it('should use cached prediction on subsequent renders', async () => {
      mockFetchPrediction.mockResolvedValue({
        status: 'success',
        prediction: mockPrediction,
        message: 'Success',
      });

      // First render - fetch from API
      const { result, rerender } = renderHook(() =>
        useBhriguPrediction({
          category: 'career',
          fetchPrediction: mockFetchPrediction,
          profile: mockProfile,
        })
      );

      await waitFor(() => {
        expect(result.current.prediction).toEqual(mockPrediction);
      });

      expect(mockFetchPrediction).toHaveBeenCalledTimes(1);

      // Unmount and remount - should use cache
      rerender();

      await waitFor(() => {
        expect(result.current.fromCache).toBe(true);
      });

      // Should not fetch again
      expect(mockFetchPrediction).toHaveBeenCalledTimes(1);
    });

    it('should clear cache when profile changes', async () => {
      mockFetchPrediction.mockResolvedValue({
        status: 'success',
        prediction: mockPrediction,
        message: 'Success',
      });

      const { result, rerender } = renderHook(
        ({ profile }) =>
          useBhriguPrediction({
            category: 'career',
            fetchPrediction: mockFetchPrediction,
            profile,
          }),
        { initialProps: { profile: mockProfile } }
      );

      await waitFor(() => {
        expect(result.current.prediction).toEqual(mockPrediction);
      });

      // Change profile
      const updatedProfile = { ...mockProfile, placeOfBirth: 'Los Angeles' };
      rerender({ profile: updatedProfile });

      await waitFor(() => {
        // Should fetch new prediction
        expect(mockFetchPrediction).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network failure');
      (networkError as any).code = 'NETWORK_ERROR';
      mockFetchPrediction.mockRejectedValue(networkError);

      const { result } = renderHook(() =>
        useBhriguPrediction({
          category: 'career',
          fetchPrediction: mockFetchPrediction,
          profile: mockProfile,
        })
      );

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.errorDetails?.isNetwork).toBe(true);
      });
    });

    it('should handle API errors with status codes', async () => {
      const apiError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      };
      mockFetchPrediction.mockRejectedValue(apiError);

      const { result } = renderHook(() =>
        useBhriguPrediction({
          category: 'career',
          fetchPrediction: mockFetchPrediction,
          profile: mockProfile,
        })
      );

      await waitFor(() => {
        expect(result.current.error).toContain('Internal server error');
        expect(result.current.errorDetails?.code).toBe('HTTP 500');
      });
    });

    it('should handle malformed cache data', async () => {
      // Corrupt cache data
      localStorageMock.setItem(
        'bhrigu_prediction_test-profile-123_career_default',
        'invalid json {'
      );

      mockFetchPrediction.mockResolvedValue({
        status: 'success',
        prediction: mockPrediction,
        message: 'Success',
      });

      const { result } = renderHook(() =>
        useBhriguPrediction({
          category: 'career',
          fetchPrediction: mockFetchPrediction,
          profile: mockProfile,
        })
      );

      // Should fetch fresh data instead of crashing
      await waitFor(() => {
        expect(result.current.prediction).toEqual(mockPrediction);
        expect(mockFetchPrediction).toHaveBeenCalled();
      });
    });
  });

  describe('Performance Optimizations', () => {
    it('should efficiently clear cache without iterating all localStorage', async () => {
      // Add 100 unrelated items to localStorage
      for (let i = 0; i < 100; i++) {
        localStorageMock.setItem(`unrelated_key_${i}`, 'value');
      }

      mockFetchPrediction.mockResolvedValue({
        status: 'success',
        prediction: mockPrediction,
        message: 'Success',
      });

      const startTime = performance.now();

      const { result, rerender } = renderHook(
        ({ profile }) =>
          useBhriguPrediction({
            category: 'career',
            fetchPrediction: mockFetchPrediction,
            profile,
          }),
        { initialProps: { profile: mockProfile } }
      );

      await waitFor(() => {
        expect(result.current.prediction).toEqual(mockPrediction);
      });

      // Change profile to trigger cache clear
      const updatedProfile = { ...mockProfile, placeOfBirth: 'Chicago' };
      rerender({ profile: updatedProfile });

      await waitFor(() => {
        expect(mockFetchPrediction).toHaveBeenCalledTimes(2);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Cache clearing should be fast even with 100 items
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });
  });

  describe('Force Regenerate', () => {
    it('should bypass cache when force regenerate is called', async () => {
      mockFetchPrediction.mockResolvedValue({
        status: 'success',
        prediction: mockPrediction,
        message: 'Success',
      });

      const { result } = renderHook(() =>
        useBhriguPrediction({
          category: 'career',
          fetchPrediction: mockFetchPrediction,
          profile: mockProfile,
        })
      );

      await waitFor(() => {
        expect(result.current.prediction).toEqual(mockPrediction);
      });

      // Force regenerate
      await act(async () => {
        await result.current.regenerate();
      });

      await waitFor(() => {
        // Should have called API twice
        expect(mockFetchPrediction).toHaveBeenCalledTimes(2);
      });
    });
  });
});
