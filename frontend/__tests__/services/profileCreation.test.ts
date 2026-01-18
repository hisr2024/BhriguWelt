/**
 * Profile Creation Service Tests
 * Tests core profile creation functionality
 */

import { createProfile, createProfileWithRetry, type ProfileData } from '@/lib/services/profileCreationService';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  astrologyAPI: {
    calculateBirthChart: jest.fn(),
  },
}));

jest.mock('@/lib/storage', () => ({
  setItem: jest.fn().mockResolvedValue('profile_123'),
  STORES: {
    PROFILES: 'profiles',
    REPORTS: 'reports',
  },
}));

jest.mock('@/lib/profileHelpers', () => ({
  setCurrentProfileId: jest.fn(),
}));

import { astrologyAPI } from '@/lib/api';
import { setItem } from '@/lib/storage';

describe('Profile Creation Service', () => {
  // Mock encryption key
  const mockEncryptionKey = {
    algorithm: { name: 'AES-GCM' },
    type: 'secret' as const,
    extractable: false,
    usages: ['encrypt', 'decrypt'] as KeyUsage[],
  } as CryptoKey;

  const validProfileData: ProfileData = {
    name: 'Test User',
    date_of_birth: '1990-01-01',
    time_of_birth: '12:00',
    place_of_birth: 'Mumbai, India',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validation', () => {
    it('should reject empty name', async () => {
      const invalidData = { ...validProfileData, name: '' };

      const result = await createProfile(invalidData, {
        encryptionKey: mockEncryptionKey,
      });

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('validation');
      expect(result.error?.message).toContain('Name');
    });

    it('should reject invalid date', async () => {
      const invalidData = { ...validProfileData, date_of_birth: '2050-01-01' };

      const result = await createProfile(invalidData, {
        encryptionKey: mockEncryptionKey,
      });

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('validation');
      expect(result.error?.message).toContain('future');
    });

    it('should reject invalid place', async () => {
      const invalidData = { ...validProfileData, place_of_birth: '1' };

      const result = await createProfile(invalidData, {
        encryptionKey: mockEncryptionKey,
      });

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('validation');
    });

    it('should accept valid data', async () => {
      (astrologyAPI.calculateBirthChart as jest.Mock).mockResolvedValue({
        data: {
          zodiac_sign: 'Capricorn',
          moon_sign: 'Taurus',
          ascendant: 'Virgo',
          birth_details: {
            latitude: 19.0760,
            longitude: 72.8777,
          },
        },
      });

      const result = await createProfile(validProfileData, {
        encryptionKey: mockEncryptionKey,
      });

      expect(result.success).toBe(true);
      expect(result.profileId).toBeDefined();
    });
  });

  describe('Progress Tracking', () => {
    it('should report progress during creation', async () => {
      const progressUpdates: any[] = [];

      (astrologyAPI.calculateBirthChart as jest.Mock).mockResolvedValue({
        data: {
          zodiac_sign: 'Capricorn',
          moon_sign: 'Taurus',
          ascendant: 'Virgo',
        },
      });

      await createProfile(validProfileData, {
        encryptionKey: mockEncryptionKey,
        onProgress: (progress) => {
          progressUpdates.push(progress);
        },
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].step).toBe('validating');
      expect(progressUpdates[progressUpdates.length - 1].step).toBe('complete');
      expect(progressUpdates[progressUpdates.length - 1].progress).toBe(100);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (astrologyAPI.calculateBirthChart as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      const result = await createProfile(validProfileData, {
        encryptionKey: mockEncryptionKey,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      (timeoutError as any).code = 'ECONNABORTED';

      (astrologyAPI.calculateBirthChart as jest.Mock).mockRejectedValue(timeoutError);

      const result = await createProfile(validProfileData, {
        encryptionKey: mockEncryptionKey,
      });

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('timeout');
      expect(result.error?.retryable).toBe(true);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).code = 'ERR_NETWORK';

      (astrologyAPI.calculateBirthChart as jest.Mock).mockRejectedValue(networkError);

      const result = await createProfile(validProfileData, {
        encryptionKey: mockEncryptionKey,
      });

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('network');
      expect(result.error?.retryable).toBe(true);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on retryable errors', async () => {
      let attempts = 0;

      (astrologyAPI.calculateBirthChart as jest.Mock).mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          const error = new Error('Temporary Error');
          (error as any).code = 'ERR_NETWORK';
          throw error;
        }
        return Promise.resolve({
          data: {
            zodiac_sign: 'Capricorn',
            moon_sign: 'Taurus',
            ascendant: 'Virgo',
          },
        });
      });

      const result = await createProfileWithRetry(
        validProfileData,
        { encryptionKey: mockEncryptionKey },
        2 // maxRetries
      );

      expect(attempts).toBe(3); // Initial + 2 retries
      expect(result.success).toBe(true);
    });

    it('should not retry on non-retryable errors', async () => {
      let attempts = 0;

      (astrologyAPI.calculateBirthChart as jest.Mock).mockImplementation(() => {
        attempts++;
        throw { response: { status: 400, data: { message: 'Bad Request' } } };
      });

      const result = await createProfileWithRetry(
        validProfileData,
        { encryptionKey: mockEncryptionKey },
        2
      );

      expect(attempts).toBe(1); // Should not retry
      expect(result.success).toBe(false);
      expect(result.error?.retryable).toBe(false);
    });
  });

  describe('Data Storage', () => {
    it('should store profile with encryption', async () => {
      (astrologyAPI.calculateBirthChart as jest.Mock).mockResolvedValue({
        data: {
          zodiac_sign: 'Capricorn',
          moon_sign: 'Taurus',
          ascendant: 'Virgo',
        },
      });

      await createProfile(validProfileData, {
        encryptionKey: mockEncryptionKey,
      });

      expect(setItem).toHaveBeenCalledWith(
        'profiles',
        'current_profile',
        expect.objectContaining({
          name: validProfileData.name,
          dateOfBirth: validProfileData.date_of_birth,
        }),
        mockEncryptionKey
      );
    });

    it('should store birth chart report', async () => {
      (astrologyAPI.calculateBirthChart as jest.Mock).mockResolvedValue({
        data: {
          zodiac_sign: 'Capricorn',
          moon_sign: 'Taurus',
          ascendant: 'Virgo',
        },
      });

      await createProfile(validProfileData, {
        encryptionKey: mockEncryptionKey,
      });

      expect(setItem).toHaveBeenCalledWith(
        'reports',
        'current_birth_chart',
        expect.objectContaining({
          type: 'birth-chart',
          title: 'Birth Chart',
        }),
        mockEncryptionKey
      );
    });
  });

  describe('Coordinates Handling', () => {
    it('should use manual coordinates when provided', async () => {
      const dataWithCoords: ProfileData = {
        ...validProfileData,
        latitude: 19.0760,
        longitude: 72.8777,
      };

      (astrologyAPI.calculateBirthChart as jest.Mock).mockResolvedValue({
        data: {
          zodiac_sign: 'Capricorn',
          moon_sign: 'Taurus',
          ascendant: 'Virgo',
        },
      });

      await createProfile(dataWithCoords, {
        encryptionKey: mockEncryptionKey,
      });

      expect(astrologyAPI.calculateBirthChart).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 19.0760,
          longitude: 72.8777,
        })
      );
    });

    it('should validate coordinate ranges', async () => {
      const invalidCoords: ProfileData = {
        ...validProfileData,
        latitude: 100, // Invalid
        longitude: 72.8777,
      };

      const result = await createProfile(invalidCoords, {
        encryptionKey: mockEncryptionKey,
      });

      expect(result.success).toBe(false);
      expect(result.error?.type).toBe('validation');
    });
  });
});

describe('Performance', () => {
  const validProfileData: ProfileData = {
    name: 'Test User',
    date_of_birth: '1990-01-01',
    time_of_birth: '12:00',
    place_of_birth: 'Mumbai, India',
  };

  it('should complete within reasonable time', async () => {
    const mockEncryptionKey = {} as CryptoKey;

    (astrologyAPI.calculateBirthChart as jest.Mock).mockResolvedValue({
      data: {
        zodiac_sign: 'Capricorn',
        moon_sign: 'Taurus',
        ascendant: 'Virgo',
      },
    });

    const startTime = Date.now();

    await createProfile(validProfileData, {
      encryptionKey: mockEncryptionKey,
    });

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  }, 10000);
});
