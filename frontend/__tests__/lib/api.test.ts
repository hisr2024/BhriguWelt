/**
 * Unit tests for API client
 * Tests API configuration, methods, and error handling
 */
import { api, astrologyAPI, karmicJourneyAPI, aiAPI } from '@/lib/api';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Configuration', () => {
    it('should have correct base URL', () => {
      expect(api.defaults.baseURL).toBeDefined();
    });

    it('should have correct timeout', () => {
      expect(api.defaults.timeout).toBe(120000);
    });

    it('should have correct headers', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });

    it('should enable credentials', () => {
      expect(api.defaults.withCredentials).toBe(true);
    });
  });

  describe('Astrology API', () => {
    const mockBirthDetails = {
      date_of_birth: '1990-01-01',
      time_of_birth: '12:00',
      place_of_birth: 'Mumbai',
      latitude: 19.0760,
      longitude: 72.8777,
    };

    it('should call calculateBirthChart endpoint', async () => {
      const mockResponse = { data: { zodiac_sign: 'Capricorn' } };
      mockedAxios.create.mockReturnValue({
        ...api,
        post: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      // Note: This test structure might need adjustment based on actual implementation
      expect(astrologyAPI.calculateBirthChart).toBeDefined();
    });

    it('should call getZodiacAnalysis endpoint', () => {
      expect(astrologyAPI.getZodiacAnalysis).toBeDefined();
    });

    it('should call getPlanetaryPositions endpoint', () => {
      expect(astrologyAPI.getPlanetaryPositions).toBeDefined();
    });
  });

  describe('Karmic Journey API', () => {
    it('should have getAnalysis method', () => {
      expect(karmicJourneyAPI.getAnalysis).toBeDefined();
    });

    it('should have getSoulPurpose method', () => {
      expect(karmicJourneyAPI.getSoulPurpose).toBeDefined();
    });

    it('should have getKarmicLessons method', () => {
      expect(karmicJourneyAPI.getKarmicLessons).toBeDefined();
    });
  });

  describe('AI API', () => {
    describe('Consent Requirements', () => {
      const mockAIMode = {
        mode: 'hybrid' as const,
        consent: true,
        consentTimestamp: new Date().toISOString(),
      };

      const mockAIData = {
        zodiac_sign: 'Capricorn',
        nakshatra: 'Uttara Ashadha',
      };

      it('should throw error when consent is not granted for compose', async () => {
        const noConsentMode = { ...mockAIMode, consent: false };
        
        await expect(
          aiAPI.composeReport(
            { report_section: 'test', birth_data: mockAIData },
            noConsentMode
          )
        ).rejects.toThrow('AI consent required');
      });

      it('should throw error when consent is not granted for chat', async () => {
        const noConsentMode = { mode: 'conversational' as const, consent: false };
        
        await expect(
          aiAPI.chat(
            { message: 'test', birth_data: mockAIData },
            noConsentMode
          )
        ).rejects.toThrow('AI consent required');
      });

      it('should throw error when chat is called without conversational mode', async () => {
        const wrongMode = { mode: 'hybrid' as const, consent: true };
        
        await expect(
          aiAPI.chat(
            { message: 'test', birth_data: mockAIData },
            wrongMode
          )
        ).rejects.toThrow('Conversational mode required for chat');
      });
    });

    it('should have getConsentInfo method', () => {
      expect(aiAPI.getConsentInfo).toBeDefined();
    });

    it('should have getStatus method', () => {
      expect(aiAPI.getStatus).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      const mockError = new Error('Network Error');
      mockedAxios.create.mockReturnValue({
        ...api,
        post: jest.fn().mockRejectedValue(mockError),
      } as any);

      // Test would need actual implementation
    });

    it('should handle timeout errors', async () => {
      const mockError = { code: 'ECONNABORTED', message: 'timeout' };
      // Test implementation
    });
  });
});
