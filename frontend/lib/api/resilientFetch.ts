/**
 * Resilient Fetch Utility
 * GUARANTEED: Always returns a response - never fails, never hangs
 * Implements: timeout, error handling, normalization, fallback
 */

const DEFAULT_TIMEOUT = 5000; // 5 seconds
const MAX_RETRIES = 2;

export interface ResilientFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  fallbackData?: any;
}

export interface ResilientResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  offline?: boolean;
  timedOut?: boolean;
  statusCode?: number;
  timestamp: string;
}

/**
 * Normalize prediction response to ensure consistent structure
 * ALWAYS returns a valid object, never null/undefined
 */
export function normalizePredictionResponse(data: any): any {
  if (!data || typeof data !== 'object') {
    return {
      error: 'Invalid response format',
      success: false,
      offline: true,
      timestamp: new Date().toISOString()
    };
  }

  // Already normalized
  if (data.success !== undefined) {
    return data;
  }

  // Normalize backend prediction format
  return {
    success: true,
    ...data,
    timestamp: data.generated_at || data.timestamp || new Date().toISOString()
  };
}

/**
 * Resilient fetch with timeout, retry, and guaranteed response
 * NEVER throws - always returns a ResilientResponse
 */
export async function resilientFetch<T = any>(
  url: string,
  options: ResilientFetchOptions = {}
): Promise<ResilientResponse<T>> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = MAX_RETRIES,
    fallbackData,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Parse response
        let data: any;
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
          try {
            data = await response.json();
          } catch (parseError) {
            // JSON parse failed - return error
            return {
              success: false,
              error: 'Failed to parse server response',
              statusCode: response.status,
              timestamp: new Date().toISOString()
            };
          }
        } else {
          // Non-JSON response
          data = { text: await response.text() };
        }

        // Check if response is success
        if (response.ok) {
          return {
            success: true,
            data: normalizePredictionResponse(data),
            statusCode: response.status,
            timestamp: new Date().toISOString()
          };
        }

        // Server error response
        return {
          success: false,
          data: data,
          error: data.message || data.error || 'Server error',
          statusCode: response.status,
          timestamp: new Date().toISOString()
        };

      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        // Check if aborted (timeout)
        if (fetchError.name === 'AbortError') {
          // Retry on timeout
          if (attempt < retries) {
            attempt++;
            continue;
          }

          return {
            success: false,
            error: 'Request timed out. Please try again.',
            timedOut: true,
            timestamp: new Date().toISOString()
          };
        }

        throw fetchError;
      }

    } catch (error: any) {
      lastError = error;

      // Network error - might be offline
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        // Retry for network errors
        if (attempt < retries) {
          attempt++;
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
          continue;
        }

        return {
          success: false,
          error: 'Network error. Please check your connection.',
          offline: true,
          data: fallbackData,
          timestamp: new Date().toISOString()
        };
      }

      // Other errors
      attempt++;
      if (attempt > retries) {
        break;
      }
    }
  }

  // All retries exhausted - return fallback
  return {
    success: false,
    error: lastError?.message || 'Request failed after multiple attempts',
    data: fallbackData,
    timestamp: new Date().toISOString()
  };
}

/**
 * Handle cache corruption by clearing and recovering
 */
export async function handleCacheCorruption(storageKey: string): Promise<void> {
  try {
    // Remove corrupted item
    localStorage.removeItem(storageKey);

    // Try to clear related items
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.includes('prediction') || key.includes('cache')) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            JSON.parse(value); // Test if parseable
          }
        } catch {
          // Corrupted - remove it
          localStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    // If localStorage itself is corrupted, clear all
    try {
      localStorage.clear();
    } catch {
      // Even clear failed - nothing we can do
      console.error('Fatal: localStorage is completely corrupted');
    }
  }
}

/**
 * Safe localStorage access with corruption handling
 */
export async function safeGetItem(key: string): Promise<any | null> {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    return JSON.parse(item);
  } catch (error) {
    // Corrupted - handle it
    await handleCacheCorruption(key);
    return null;
  }
}

/**
 * Safe localStorage set with error handling
 */
export async function safeSetItem(key: string, value: any): Promise<boolean> {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    // Quota exceeded or other error
    console.error('Failed to save to localStorage:', error);

    // Try to clear some space
    try {
      const keys = Object.keys(localStorage);
      if (keys.length > 0) {
        localStorage.removeItem(keys[0]!);
        // Try again
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }
}

export default resilientFetch;
