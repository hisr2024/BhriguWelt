import { useCallback, useEffect, useState } from 'react';
import type { Profile, BirthDetails, PredictionResult, BhriguPrediction } from '@/lib/types';
import { normalizePredictionResponse } from '@/lib/api/predictionResponse';

const PROFILE_HASH_PREFIX = 'profile_hash_';
const PREDICTION_CACHE_PREFIX = 'bhrigu_prediction_';

/**
 * Retry options for the retryWithBackoff helper
 */
interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

/**
 * Retry an async operation with exponential backoff
 * @param operation - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the operation
 */
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 2,
    baseDelay = 500, // 500ms - reduced for faster retries
    maxDelay = 3000, // 3 seconds max - reduced for faster recovery
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        break;
      }

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff + jitter
      const exponentialDelay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );
      // Add 0-30% random jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * exponentialDelay;
      const delay = exponentialDelay + jitter;

      // Call retry callback
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Request queue for limiting concurrent API requests
 * Prevents overloading the server with too many simultaneous requests
 */
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private active = 0;
  private maxConcurrent = 4; // Increased to 4 for faster parallel predictions

  /**
   * Enqueue an operation to be executed when a slot is available
   * @param operation - The async function to execute
   * @returns Promise that resolves with the operation result
   */
  async enqueue<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process queued operations up to the concurrency limit
   */
  private async processQueue() {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.active++;
    const operation = this.queue.shift();

    if (operation) {
      try {
        await operation();
      } finally {
        this.active--;
        this.processQueue();
      }
    }
  }
}

// Global request queue instance
const requestQueue = new RequestQueue();

interface ErrorDetails {
  code?: string;
  action: string;
  isNetwork: boolean;
  message: string;
}

interface UseBhriguPredictionArgs {
  category: string;
  fetchPrediction: (
    profileData: BirthDetails & { question?: string; force_regenerate?: boolean }
  ) => Promise<PredictionResult>;
  profile: Profile | null;
}

const hasRequiredProfileFields = (profile: Profile): boolean => {
  // Latitude and longitude are now optional - backend will geocode if not provided
  return Boolean(
    profile.dateOfBirth &&
      profile.timeOfBirth &&
      profile.placeOfBirth
  );
};

const getProfileHashKey = (profile: Profile) => `${PROFILE_HASH_PREFIX}${profile.id ?? 'current'}`;

const getPredictionCacheKey = (profile: Profile, category: string, question: string) => {
  const questionKey = question.trim() === '' ? 'default' : encodeURIComponent(question.trim());
  return `${PREDICTION_CACHE_PREFIX}${profile.id ?? 'current'}_${category}_${questionKey}`;
};

/**
 * Efficiently clear cached predictions for a profile
 * Uses a tracked key set to avoid O(n) localStorage iteration
 */
const clearCachedPredictions = (profile: Profile) => {
  if (typeof window === 'undefined') return;
  const prefix = `${PREDICTION_CACHE_PREFIX}${profile.id ?? 'current'}_`;

  // Get tracked keys from registry (much faster than iterating all localStorage)
  const trackedKeysKey = `${prefix}_registry`;
  try {
    const trackedKeysJson = localStorage.getItem(trackedKeysKey);
    if (trackedKeysJson) {
      const trackedKeys = JSON.parse(trackedKeysJson) as string[];
      trackedKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn('Failed to remove cached prediction:', e);
        }
      });
      localStorage.removeItem(trackedKeysKey);
      return;
    }
  } catch (e) {
    console.warn('Failed to use key registry, falling back to full scan:', e);
  }

  // Fallback: legacy behavior for existing caches without registry
  // Collect keys first to avoid mutation during iteration
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix) && key !== trackedKeysKey) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Failed to remove cached prediction:', e);
    }
  });
};

const getProfileHash = async (profile: Profile) => {
  const profilePayload = JSON.stringify({
    id: profile.id ?? null,
    name: profile.name ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    timeOfBirth: profile.timeOfBirth ?? '',
    placeOfBirth: profile.placeOfBirth ?? '',
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
  });
  const encoder = new TextEncoder();
  const data = encoder.encode(profilePayload);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const useBhriguPrediction = ({
  category,
  fetchPrediction,
  profile
}: UseBhriguPredictionArgs) => {
  const [prediction, setPrediction] = useState<BhriguPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [question, setQuestion] = useState('');
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [timeoutWarning, setTimeoutWarning] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const loadPrediction = useCallback(async (
    forceRegenerate = false,
    profileHash?: string
  ) => {
    if (!profile) return;

    if (!hasRequiredProfileFields(profile)) {
      setError('Please complete your birth details in your profile to generate predictions.');
      return;
    }

    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setFromCache(false);
    setTimeoutWarning(false);
    setRetryAttempt(0);

    try {
      const resolvedHash = profileHash ?? await getProfileHash(profile);
      const cacheKey = getPredictionCacheKey(profile, category, question);
      const cached = typeof window === 'undefined' ? null : localStorage.getItem(cacheKey);

      // Check cache first (fast path)
      if (!forceRegenerate && cached) {
        try {
          const parsed = JSON.parse(cached) as { profileHash: string; prediction: BhriguPrediction };
          if (parsed.profileHash === resolvedHash) {
            setPrediction(parsed.prediction);
            setFromCache(true);
            setLoading(false);
            return;
          }
          localStorage.removeItem(cacheKey);
        } catch (parseError) {
          localStorage.removeItem(cacheKey);
        }
      }

      if (forceRegenerate && typeof window !== 'undefined') {
        localStorage.removeItem(cacheKey);
      }

      const profileData = {
        date_of_birth: profile.dateOfBirth,
        time_of_birth: profile.timeOfBirth,
        place_of_birth: profile.placeOfBirth,
        latitude: profile.latitude,
        longitude: profile.longitude,
        question: question || undefined,
        force_regenerate: forceRegenerate
      };

      // Use request queue and retry logic for API call
      const response = await requestQueue.enqueue(() =>
        retryWithBackoff(
          () => fetchPrediction(profileData),
          {
            maxRetries: 2, // Retry up to 2 times (3 total attempts)
            baseDelay: 2000, // Start with 2 seconds
            shouldRetry: (error) => {
              // Retry on network errors, 5xx, or timeouts
              const status = error?.response?.status;
              return (
                !error.response || // Network error
                error.code === 'ECONNABORTED' || // Timeout
                error.code === 'ETIMEDOUT' || // Timeout
                (status && status >= 500 && status < 600) || // Server error
                error?.response?.data?.retryable === true // Explicit retry flag
              );
            },
            onRetry: (attempt, error) => {
              // Update UI to show retry progress
              setRetryAttempt(attempt);

              setErrorDetails({
                message: `Retrying... (attempt ${attempt}/2)`,
                isNetwork: !error.response,
                code: 'RETRY',
                action: 'Automatic retry in progress. Please wait...',
              });
            },
          }
        )
      );

      const normalized = normalizePredictionResponse<BhriguPrediction>(response);

      if (normalized.status === 'success') {
        setPrediction(normalized.prediction);
        setFromCache(Boolean(
          normalized.metadata?.from_cache ||
          normalized.metadata?.source === 'cache' ||
          normalized.message?.toLowerCase()?.includes('cache')
        ));

        // Cache the successful result
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                profileHash: resolvedHash,
                prediction: normalized.prediction,
              })
            );

            // Track this key in the registry for efficient clearing
            const registryKey = `${PREDICTION_CACHE_PREFIX}${profile.id ?? 'current'}__registry`;
            try {
              const existingKeysJson = localStorage.getItem(registryKey);
              const existingKeys = existingKeysJson ? JSON.parse(existingKeysJson) as string[] : [];
              if (!existingKeys.includes(cacheKey)) {
                existingKeys.push(cacheKey);
                localStorage.setItem(registryKey, JSON.stringify(existingKeys));
              }
            } catch (registryError) {
              console.warn('Failed to update cache registry:', registryError);
            }
          } catch (cacheError) {
            console.warn('Failed to cache prediction:', cacheError);
          }
        }
      } else {
        setError(normalized.message || 'Failed to generate prediction');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMessage = err?.response?.data?.message || err?.response?.data?.error;
      const message = apiMessage || err?.message || 'An error occurred';
      const isNetwork = !err?.response;
      const code = status ? `HTTP ${status}` : err?.code || err?.name;

      // Enhanced error messages based on error type
      let action: string;
      if (isNetwork) {
        action = 'Check your internet connection and try again. Cached data may be available.';
      } else if (err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT') {
        action = forceRegenerate
          ? 'Prediction generation is taking longer than expected. It may still be processing. Please check back in a few minutes.'
          : 'Request timed out. The server may be busy. Please try again in a moment.';
      } else if (status && status >= 500) {
        action = 'Server error detected. Our team has been notified. Please retry or use cached data if available.';
      } else if (status && status === 429) {
        action = 'Too many requests. Please wait a moment before trying again.';
      } else {
        action = 'Please review your inputs and try again, or use cached data if available.';
      }

      setError(message);
      setErrorDetails({
        code,
        action,
        isNetwork,
        message
      });
    } finally {
      setLoading(false);
      setRetryAttempt(0);
    }
  }, [category, fetchPrediction, profile, question]);

  // Timeout warning effect - show warning after 30 seconds of loading
  useEffect(() => {
    if (loading) {
      const warningTimer = setTimeout(() => {
        setTimeoutWarning(true);
      }, 30000); // Show warning after 30 seconds

      return () => {
        clearTimeout(warningTimer);
      };
    } else {
      setTimeoutWarning(false);
    }
    return undefined;
  }, [loading]);

  useEffect(() => {
    if (!profile || typeof window === 'undefined') {
      return;
    }

    const checkProfile = async () => {
      const currentHash = await getProfileHash(profile);
      const hashKey = getProfileHashKey(profile);
      const storedHash = localStorage.getItem(hashKey);
      const hasChanged = Boolean(storedHash && storedHash !== currentHash);

      if (hasChanged) {
        clearCachedPredictions(profile);
      }

      localStorage.setItem(hashKey, currentHash);
      setProfileUpdated(hasChanged);
      await loadPrediction(hasChanged, currentHash);
    };

    checkProfile();
  }, [loadPrediction, profile]);

  return {
    prediction,
    loading,
    error,
    errorDetails,
    fromCache,
    question,
    setQuestion,
    profileUpdated,
    loadPrediction,
    timeoutWarning,
    retryAttempt,
  };
};
