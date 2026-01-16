/**
 * Enhanced Profile Creation Service Tests
 * Tests for ValidationError class and createEmergencyProfile function
 */

import {
  createProfile,
  createEmergencyProfile,
  ValidationError,
  type ProfileData,
  type ProfileCreationConfig,
} from '@/lib/services/profileCreationService';
import { astrologyAPI } from '@/lib/api';
import * as storage from '@/lib/storage';

// Mock dependencies
jest.mock('@/lib/api');
jest.mock('@/lib/storage');
jest.mock('@/lib/profileHelpers');

const mockAstrologyAPI = astrologyAPI as jest.Mocked<typeof astrologyAPI>;
const mockStorage = storage as jest.Mocked<typeof storage>;

describe('Enhanced Profile Creation Service', () => {
  let mockEncryptionKey: CryptoKey;
  let mockConfig: ProfileCreationConfig;

  beforeEach(() => {
    // Create a mock encryption key
    mockEncryptionKey = {} as CryptoKey;
    mockConfig = {
      encryptionKey: mockEncryptionKey,
      onProgress: jest.fn(),
    };

    jest.clearAllMocks();
  });

  describe('ValidationError', () => {
    test('creates ValidationError with error list', () => {
      const errors = ['Error 1', 'Error 2'];
      const error = new ValidationError('Validation failed', errors);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Validation failed');
      expect(error.errors).toEqual(errors);
    });

    test('is catchable as Error', () => {
      try {
        throw new ValidationError('Test', ['error']);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e).toBeInstanceOf(ValidationError);
      }
    });
  });

  describe('createEmergencyProfile', () => {
    beforeEach(() => {
      mockAstrologyAPI.calculateBirthChart.mockResolvedValue({
        success: true,
        data: {
          zodiac_sign: 'Leo',
          moon_sign: 'Cancer',
          ascendant: 'Virgo',
          birth_details: {
            date_of_birth: '1990-01-01',
            time_of_birth: '12:00',
            place_of_birth: 'Mumbai, India',
            latitude: 19.0760,
            longitude: 72.8777,
          },
        },
      });

      mockStorage.setItem.mockResolvedValue(1);
    });

    test('creates emergency profile with default values', async () => {
      const result = await createEmergencyProfile(mockConfig);

      expect(result.success).toBe(true);
      expect(mockConfig.onProgress).toHaveBeenCalled();
      expect(mockAstrologyAPI.calculateBirthChart).toHaveBeenCalledWith(
        expect.objectContaining({
          date_of_birth: '1990-01-01',
          time_of_birth: '12:00',
          place_of_birth: 'Mumbai, India',
          latitude: 19.0760,
          longitude: 72.8777,
        })
      );
    });

    test('tracks progress during creation', async () => {
      await createEmergencyProfile(mockConfig);

      expect(mockConfig.onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          step: 'validating',
          progress: 10,
          message: expect.any(String),
        })
      );
    });

    test('returns success with profile ID', async () => {
      const result = await createEmergencyProfile(mockConfig);

      expect(result).toEqual({
        success: true,
        profileId: expect.any(Number),
        birthChartData: expect.any(Object),
      });
    });

    test('handles API errors gracefully', async () => {
      mockAstrologyAPI.calculateBirthChart.mockRejectedValue(
        new Error('Network error')
      );

      const result = await createEmergencyProfile(mockConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.type).toBeTruthy();
    });

    test('requires encryption key', async () => {
      const configWithoutKey = {
        ...mockConfig,
        encryptionKey: undefined as any,
      };

      const result = await createEmergencyProfile(configWithoutKey);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('validation');
    });
  });

  describe('Profile Validation', () => {
    test('validates name requirements', async () => {
      const invalidProfile: ProfileData = {
        name: 'A', // Too short
        date_of_birth: '1990-01-01',
        time_of_birth: '12:00',
        place_of_birth: 'Mumbai',
      };

      const result = await createProfile(invalidProfile, mockConfig);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('validation');
      expect(result.error?.message).toContain('Name');
    });

    test('validates date of birth', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const invalidProfile: ProfileData = {
        name: 'Test User',
        date_of_birth: futureDate.toISOString().split('T')[0],
        time_of_birth: '12:00',
        place_of_birth: 'Mumbai',
      };

      const result = await createProfile(invalidProfile, mockConfig);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('validation');
    });

    test('validates place of birth', async () => {
      const invalidProfile: ProfileData = {
        name: 'Test User',
        date_of_birth: '1990-01-01',
        time_of_birth: '12:00',
        place_of_birth: '123', // No alphabetic characters
      };

      const result = await createProfile(invalidProfile, mockConfig);

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('validation');
    });
  });

  describe('Progress Tracking', () => {
    beforeEach(() => {
      mockAstrologyAPI.calculateBirthChart.mockResolvedValue({
        success: true,
        data: {
          zodiac_sign: 'Leo',
          moon_sign: 'Cancer',
          ascendant: 'Virgo',
        },
      });
      mockStorage.setItem.mockResolvedValue(1);
    });

    test('tracks all progress stages', async () => {
      const validProfile: ProfileData = {
        name: 'Test User',
        date_of_birth: '1990-01-01',
        time_of_birth: '12:00',
        place_of_birth: 'Mumbai, India',
      };

      await createProfile(validProfile, mockConfig);

      const progressCalls = (mockConfig.onProgress as jest.Mock).mock.calls;
      const steps = progressCalls.map((call) => call[0].step);

      expect(steps).toContain('validating');
      expect(steps).toContain('calculating');
      expect(steps).toContain('encrypting');
      expect(steps).toContain('saving');
      expect(steps).toContain('complete');
    });

    test('progress increases over time', async () => {
      const validProfile: ProfileData = {
        name: 'Test User',
        date_of_birth: '1990-01-01',
        time_of_birth: '12:00',
        place_of_birth: 'Mumbai, India',
      };

      await createProfile(validProfile, mockConfig);

      const progressCalls = (mockConfig.onProgress as jest.Mock).mock.calls;
      const progressValues = progressCalls.map((call) => call[0].progress);

      // Check that progress increases
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
      }

      // Check that final progress is 100
      expect(progressValues[progressValues.length - 1]).toBe(100);
    });
  });

  describe('Error Classification', () => {
    test('classifies network errors', async () => {
      const networkError = new Error('Network failed');
      (networkError as any).code = 'ERR_NETWORK';

      mockAstrologyAPI.calculateBirthChart.mockRejectedValue(networkError);

      const result = await createEmergencyProfile(mockConfig);

      expect(result.error?.type).toBe('network');
      expect(result.error?.retryable).toBe(true);
    });

    test('classifies timeout errors', async () => {
      const timeoutError = new Error('Request timed out');
      (timeoutError as any).code = 'ECONNABORTED';

      mockAstrologyAPI.calculateBirthChart.mockRejectedValue(timeoutError);

      const result = await createEmergencyProfile(mockConfig);

      expect(result.error?.type).toBe('timeout');
      expect(result.error?.retryable).toBe(true);
    });

    test('classifies server errors', async () => {
      const serverError: any = new Error('Server error');
      serverError.response = { status: 500 };

      mockAstrologyAPI.calculateBirthChart.mockRejectedValue(serverError);

      const result = await createEmergencyProfile(mockConfig);

      expect(result.error?.type).toBe('server');
      expect(result.error?.retryable).toBe(true);
    });

    test('marks validation errors as non-retryable', async () => {
      const validationError: any = new Error('Invalid input');
      validationError.response = { status: 400 };

      mockAstrologyAPI.calculateBirthChart.mockRejectedValue(validationError);

      const result = await createEmergencyProfile(mockConfig);

      expect(result.error?.type).toBe('validation');
      expect(result.error?.retryable).toBe(false);
    });
  });

  describe('Integration', () => {
    test('creates profile end-to-end', async () => {
      mockAstrologyAPI.calculateBirthChart.mockResolvedValue({
        success: true,
        data: {
          zodiac_sign: 'Leo',
          moon_sign: 'Cancer',
          ascendant: 'Virgo',
          birth_details: {
            latitude: 19.0760,
            longitude: 72.8777,
          },
        },
      });

      mockStorage.setItem.mockResolvedValue('profile_123');

      const result = await createEmergencyProfile(mockConfig);

      expect(result.success).toBe(true);
      expect(result.profileId).toBe('profile_123');
      expect(mockStorage.setItem).toHaveBeenCalledTimes(2); // Profile + report
    });
  });
});
