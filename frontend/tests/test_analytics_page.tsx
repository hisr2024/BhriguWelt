import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AnalyticsPage from '../app/analytics/page';

const mockLoadCurrentProfile = jest.fn();
const mockCalculateBirthChart = jest.fn();
const mockGetAnalyticsCache = jest.fn();
const mockSetAnalyticsCache = jest.fn();
const mockClearAnalyticsCache = jest.fn();
const mockCountItems = jest.fn();

jest.mock('@/lib/context/EncryptionContext', () => ({
  useEncryption: () => ({
    encryptionKey: 'test-key',
    isSetup: true,
    isLoading: false,
    isUnlocked: true,
  }),
}));

jest.mock('@/lib/profileHelpers', () => ({
  loadCurrentProfile: (...args: any[]) => mockLoadCurrentProfile(...args),
}));

jest.mock('@/lib/api', () => ({
  astrologyAPI: {
    calculateBirthChart: (...args: any[]) => mockCalculateBirthChart(...args),
  },
}));

jest.mock('@/lib/storage', () => ({
  countItems: (...args: any[]) => mockCountItems(...args),
  getAnalyticsCache: (...args: any[]) => mockGetAnalyticsCache(...args),
  setAnalyticsCache: (...args: any[]) => mockSetAnalyticsCache(...args),
  clearAnalyticsCache: (...args: any[]) => mockClearAnalyticsCache(...args),
  STORES: {
    PROFILES: 'profiles',
    REPORTS: 'reports',
    ANALYTICS: 'analytics',
  },
}));

describe('AnalyticsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadCurrentProfile.mockResolvedValue({
      id: 'profile-1',
      dateOfBirth: '1990-01-01',
      timeOfBirth: '10:00',
      placeOfBirth: 'Delhi',
      latitude: 28.6,
      longitude: 77.2,
    });
    mockCountItems.mockResolvedValue(1);
  });

  it('updates drag state when interacting with the timeline slider', async () => {
    mockGetAnalyticsCache.mockResolvedValue({
      analytics: {
        strengths: ['Strong foundation'],
        challenges: ['Growth opportunities'],
        opportunities: ['Life mastery'],
        karmaScore: 70,
        dharmaScore: 65,
        mokshaScore: 60,
      },
      chartData: {},
      cachedAt: new Date().toISOString(),
      source: 'cache',
    });

    render(<AnalyticsPage />);

    const dragStatus = await screen.findByTestId('timeline-drag-status');
    expect(dragStatus).toHaveTextContent('Timeline drag: idle');

    expect(screen.getByTestId('timeline-granularity-label')).toHaveTextContent('Granularity: Monthly');

    const slider = screen.getByTestId('timeline-slider');
    fireEvent.mouseDown(slider);
    expect(screen.getByTestId('timeline-drag-status')).toHaveTextContent('Timeline drag: active');

    fireEvent.mouseUp(slider);
    expect(screen.getByTestId('timeline-drag-status')).toHaveTextContent('Timeline drag: idle');

    fireEvent.click(screen.getByRole('button', { name: 'Yearly' }));
    expect(screen.getByTestId('timeline-granularity-label')).toHaveTextContent('Granularity: Yearly');
  });

  it('renders analytics from IndexedDB cache when available', async () => {
    mockGetAnalyticsCache.mockResolvedValue({
      analytics: {
        strengths: ['Cached strength'],
        challenges: ['Cached challenge'],
        opportunities: ['Cached opportunity'],
        karmaScore: 62,
        dharmaScore: 58,
        mokshaScore: 54,
      },
      chartData: {},
      cachedAt: new Date().toISOString(),
      source: 'cache',
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('analytics-data-source')).toHaveTextContent('Source: Cached');
    });

    expect(mockCalculateBirthChart).not.toHaveBeenCalled();
  });

  it('falls back to API data when analytics cache is empty', async () => {
    mockGetAnalyticsCache.mockResolvedValue(null);
    mockCalculateBirthChart.mockResolvedValue({
      data: { planets: [] },
    });

    render(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('analytics-data-source')).toHaveTextContent('Source: Live API');
    });

    expect(mockSetAnalyticsCache).toHaveBeenCalled();
  });
});
