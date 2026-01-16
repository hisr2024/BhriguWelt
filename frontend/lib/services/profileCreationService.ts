/**
 * Profile Creation Service
 * Handles profile creation with progress tracking, timeout handling, and retry logic
 */

import { astrologyAPI, type BirthDetails } from '@/lib/api';
import { setItem, STORES } from '@/lib/storage';
import { setCurrentProfileId } from '@/lib/profileHelpers';

export interface ProfileData extends BirthDetails {
  name: string;
  latitude?: number;
  longitude?: number;
}

export interface ProfileCreationProgress {
  step: 'validating' | 'geocoding' | 'calculating' | 'saving' | 'complete';
  progress: number; // 0-100
  message: string;
}

export interface ProfileCreationResult {
  success: boolean;
  profileId?: IDBValidKey;
  birthChartData?: any;
  error?: {
    type: 'validation' | 'timeout' | 'network' | 'server' | 'unknown';
    message: string;
    retryable: boolean;
  };
}

export interface ProfileCreationConfig {
  timeoutMs?: number;
  onProgress?: (progress: ProfileCreationProgress) => void;
  encryptionKey: CryptoKey;
}

const DEFAULT_TIMEOUT = 120000; // 120 seconds (matches API timeout)

/**
 * Validates profile data before creation
 */
function validateProfileData(data: ProfileData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 80) {
    errors.push('Name must be between 2 and 80 characters');
  }

  if (!data.date_of_birth) {
    errors.push('Date of birth is required');
  } else {
    const today = new Date().toISOString().split('T')[0];
    if (data.date_of_birth > today) {
      errors.push('Date of birth cannot be in the future');
    }
    if (data.date_of_birth < '1900-01-01') {
      errors.push('Date of birth must be after 1900');
    }
  }

  if (!data.time_of_birth || data.time_of_birth.length < 4) {
    errors.push('Valid time of birth is required');
  }

  if (!data.place_of_birth || !/[a-zA-Z]/.test(data.place_of_birth) || data.place_of_birth.trim().length < 2) {
    errors.push('Valid place of birth is required');
  }

  if (data.latitude !== undefined && (isNaN(data.latitude) || data.latitude < -90 || data.latitude > 90)) {
    errors.push('Latitude must be between -90 and 90');
  }

  if (data.longitude !== undefined && (isNaN(data.longitude) || data.longitude < -180 || data.longitude > 180)) {
    errors.push('Longitude must be between -180 and 180');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Classifies error type for better user messaging
 */
function classifyError(error: any): ProfileCreationResult['error'] {
  const status = error.response?.status;
  const message = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected error occurred';

  // Timeout errors
  if (error.code === 'ECONNABORTED' || message.toLowerCase().includes('timeout')) {
    return {
      type: 'timeout',
      message: 'Request timed out. The server took too long to respond. Please try again.',
      retryable: true,
    };
  }

  // Network errors
  if (error.code === 'ERR_NETWORK' || !status) {
    return {
      type: 'network',
      message: 'Network error. Please check your internet connection and try again.',
      retryable: true,
    };
  }

  // Server errors (5xx)
  if (status >= 500 && status < 600) {
    return {
      type: 'server',
      message: 'Server error. Our servers are experiencing issues. Please try again in a few moments.',
      retryable: true,
    };
  }

  // Validation errors (4xx)
  if (status >= 400 && status < 500) {
    return {
      type: 'validation',
      message: message || 'Invalid input. Please check your birth details and try again.',
      retryable: false,
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    message,
    retryable: true,
  };
}

/**
 * Creates a user profile with progress tracking
 *
 * Features:
 * - Step-by-step progress updates
 * - Automatic retry logic (handled by API client)
 * - Comprehensive error classification
 * - State persistence with encryption
 * - Timeout handling
 */
export async function createProfile(
  data: ProfileData,
  config: ProfileCreationConfig
): Promise<ProfileCreationResult> {
  const { timeoutMs = DEFAULT_TIMEOUT, onProgress, encryptionKey } = config;

  // Step 1: Validation (0-10%)
  onProgress?.({
    step: 'validating',
    progress: 5,
    message: 'Validating your birth details...',
  });

  const validation = validateProfileData(data);
  if (!validation.valid) {
    return {
      success: false,
      error: {
        type: 'validation',
        message: validation.errors.join('. '),
        retryable: false,
      },
    };
  }

  onProgress?.({
    step: 'validating',
    progress: 10,
    message: 'Birth details validated successfully',
  });

  try {
    // Step 2: Geocoding (10-30%) - if manual coordinates not provided
    if (data.latitude === undefined || data.longitude === undefined) {
      onProgress?.({
        step: 'geocoding',
        progress: 15,
        message: 'Finding geographic coordinates...',
      });
    }

    // Step 3: Calculate birth chart (30-70%)
    onProgress?.({
      step: 'calculating',
      progress: 30,
      message: 'Calculating your birth chart...',
    });

    // Build request data
    const requestData: BirthDetails = {
      date_of_birth: data.date_of_birth,
      time_of_birth: data.time_of_birth,
      place_of_birth: data.place_of_birth,
    };

    // Only add coordinates if both are present and valid
    if (
      data.latitude !== undefined &&
      data.longitude !== undefined &&
      !isNaN(data.latitude) &&
      !isNaN(data.longitude)
    ) {
      requestData.latitude = data.latitude;
      requestData.longitude = data.longitude;
    }

    onProgress?.({
      step: 'calculating',
      progress: 50,
      message: 'Calculating planetary positions...',
    });

    // Make API call (with automatic retry logic from API client)
    const result = await astrologyAPI.calculateBirthChart(requestData);

    onProgress?.({
      step: 'calculating',
      progress: 70,
      message: 'Birth chart calculated successfully',
    });

    // Step 4: Save profile (70-90%)
    onProgress?.({
      step: 'saving',
      progress: 75,
      message: 'Saving your profile securely...',
    });

    // Use geocoded coordinates from backend if manual coordinates weren't provided
    const finalLatitude = data.latitude !== undefined
      ? data.latitude
      : result.data?.birth_details?.latitude;
    const finalLongitude = data.longitude !== undefined
      ? data.longitude
      : result.data?.birth_details?.longitude;

    const profileData = {
      name: data.name,
      dateOfBirth: data.date_of_birth,
      timeOfBirth: data.time_of_birth,
      placeOfBirth: data.place_of_birth,
      latitude: finalLatitude,
      longitude: finalLongitude,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save profile with consistent key 'current_profile' for easy retrieval
    const profileId = await setItem(STORES.PROFILES, 'current_profile', profileData, encryptionKey);

    onProgress?.({
      step: 'saving',
      progress: 85,
      message: 'Profile saved successfully',
    });

    // Persist the profile ID to localStorage for quick future access
    if (profileId) {
      setCurrentProfileId(profileId as string | number);
    }

    // Save birth chart report
    const reportData = {
      profileId: profileId || 1,
      type: 'birth-chart',
      title: 'Birth Chart',
      data: result.data,
      generatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setItem(STORES.REPORTS, 'current_birth_chart', reportData, encryptionKey);

    // Step 5: Complete (90-100%)
    onProgress?.({
      step: 'complete',
      progress: 100,
      message: 'Your profile is ready!',
    });

    return {
      success: true,
      profileId,
      birthChartData: result.data,
    };
  } catch (err: any) {
    const error = classifyError(err);

    // Log error for debugging
    console.error('Profile creation failed:', {
      error: err,
      classified: error,
      data: {
        name: data.name,
        place: data.place_of_birth,
        // Don't log sensitive birth details
      },
    });

    return {
      success: false,
      error,
    };
  }
}

/**
 * Retry profile creation with exponential backoff
 * Note: The API client already handles retries, but this provides
 * an additional layer for UI-level retry logic
 */
export async function createProfileWithRetry(
  data: ProfileData,
  config: ProfileCreationConfig,
  maxRetries: number = 2
): Promise<ProfileCreationResult> {
  let lastError: ProfileCreationResult['error'] | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Wait before retrying (exponential backoff)
      const delayMs = 2000 * Math.pow(2, attempt - 1);
      config.onProgress?.({
        step: 'validating',
        progress: 0,
        message: `Retrying... (Attempt ${attempt + 1}/${maxRetries + 1})`,
      });
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    const result = await createProfile(data, config);

    if (result.success) {
      return result;
    }

    lastError = result.error;

    // Don't retry if error is not retryable
    if (result.error && !result.error.retryable) {
      break;
    }
  }

  return {
    success: false,
    error: lastError,
  };
}
