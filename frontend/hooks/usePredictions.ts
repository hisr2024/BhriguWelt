/**
 * usePredictions Hook
 * React hook for managing prediction state and API calls
 */
import { useState, useCallback, useEffect } from 'react';
import {
  PredictionsAPI,
  PredictionEngine,
  PredictionResult,
  ChartData,
  BirthData,
} from '@/lib/api/predictions';

interface UsePredictionsOptions {
  baseURL?: string;
  apiKey?: string;
  autoCalculateChart?: boolean;
}

interface UsePredictionsReturn {
  // State
  prediction: PredictionResult | null;
  allPredictions: Record<PredictionEngine, PredictionResult> | null;
  chart: ChartData | null;
  loading: boolean;
  error: string | null;

  // Methods
  generatePrediction: (engine: PredictionEngine, birthData: ChartData, useAI?: boolean) => Promise<PredictionResult>;
  generateAllPredictions: (birthData: ChartData, useAI?: boolean) => Promise<Record<PredictionEngine, PredictionResult>>;
  calculateChart: (birthData: BirthData) => Promise<ChartData>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Hook for managing predictions
 */
export const usePredictions = (options: UsePredictionsOptions = {}): UsePredictionsReturn => {
  const { baseURL, apiKey, autoCalculateChart = true } = options;

  // Create API client
  const api = new PredictionsAPI(baseURL, apiKey);

  // State
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [allPredictions, setAllPredictions] = useState<Record<PredictionEngine, PredictionResult> | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Calculate birth chart
   */
  const calculateChart = useCallback(async (birthData: BirthData) => {
    setLoading(true);
    setError(null);

    try {
      const chartData = await api.calculateChart(birthData);
      setChart(chartData);
      return chartData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate chart';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  /**
   * Generate prediction for single engine
   */
  const generatePrediction = useCallback(async (
    engine: PredictionEngine,
    birthData: ChartData,
    useAI: boolean = true
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Auto-calculate chart if needed
      if (autoCalculateChart && !birthData.zodiac_sign) {
        const calculatedChart = await api.calculateChart(birthData);
        birthData = calculatedChart;
        setChart(calculatedChart);
      }

      const result = await api.generatePrediction(engine, birthData, useAI);
      setPrediction(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate prediction';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, autoCalculateChart]);

  /**
   * Generate all predictions
   */
  const generateAllPredictions = useCallback(async (
    birthData: ChartData,
    useAI: boolean = true
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Auto-calculate chart if needed
      if (autoCalculateChart && !birthData.zodiac_sign) {
        const calculatedChart = await api.calculateChart(birthData);
        birthData = calculatedChart;
        setChart(calculatedChart);
      }

      const results = await api.getAllPredictions(birthData, useAI);
      setAllPredictions(results);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate predictions';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api, autoCalculateChart]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setPrediction(null);
    setAllPredictions(null);
    setChart(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    // State
    prediction,
    allPredictions,
    chart,
    loading,
    error,

    // Methods
    generatePrediction,
    generateAllPredictions,
    calculateChart,
    clearError,
    reset,
  };
};

/**
 * Hook for specific prediction engine
 */
export const useKarmicJourney = (options?: UsePredictionsOptions) => {
  const { generatePrediction, ...rest } = usePredictions(options);

  const generateKarmicJourney = useCallback(
    (birthData: ChartData, useAI?: boolean) => {
      return generatePrediction('karmic_journey', birthData, useAI);
    },
    [generatePrediction]
  );

  return {
    ...rest,
    generateKarmicJourney,
  };
};

/**
 * Hook for Past Lives
 */
export const usePastLives = (options?: UsePredictionsOptions) => {
  const { generatePrediction, ...rest } = usePredictions(options);

  const generatePastLives = useCallback(
    (birthData: ChartData, useAI?: boolean) => {
      return generatePrediction('past_lives', birthData, useAI);
    },
    [generatePrediction]
  );

  return {
    ...rest,
    generatePastLives,
  };
};

/**
 * Hook for Future Lives
 */
export const useFutureLives = (options?: UsePredictionsOptions) => {
  const { generatePrediction, ...rest } = usePredictions(options);

  const generateFutureLives = useCallback(
    (birthData: ChartData, useAI?: boolean) => {
      return generatePrediction('future_lives', birthData, useAI);
    },
    [generatePrediction]
  );

  return {
    ...rest,
    generateFutureLives,
  };
};

/**
 * Hook for Present Life
 */
export const usePresentLife = (options?: UsePredictionsOptions) => {
  const { generatePrediction, ...rest } = usePredictions(options);

  const generatePresentLife = useCallback(
    (birthData: ChartData, useAI?: boolean) => {
      return generatePrediction('present_life', birthData, useAI);
    },
    [generatePrediction]
  );

  return {
    ...rest,
    generatePresentLife,
  };
};

/**
 * Hook for Life Events
 */
export const useLifeEvents = (options?: UsePredictionsOptions) => {
  const { generatePrediction, ...rest } = usePredictions(options);

  const generateLifeEvents = useCallback(
    (birthData: ChartData, useAI?: boolean) => {
      return generatePrediction('life_events', birthData, useAI);
    },
    [generatePrediction]
  );

  return {
    ...rest,
    generateLifeEvents,
  };
};

/**
 * Hook for Karmic Remedies
 */
export const useKarmicRemedies = (options?: UsePredictionsOptions) => {
  const { generatePrediction, ...rest } = usePredictions(options);

  const generateKarmicRemedies = useCallback(
    (birthData: ChartData, useAI?: boolean) => {
      return generatePrediction('karmic_remedies', birthData, useAI);
    },
    [generatePrediction]
  );

  return {
    ...rest,
    generateKarmicRemedies,
  };
};

/**
 * Hook for Relationships
 */
export const useRelationships = (options?: UsePredictionsOptions) => {
  const { generatePrediction, ...rest } = usePredictions(options);

  const generateRelationships = useCallback(
    (birthData: ChartData, useAI?: boolean) => {
      return generatePrediction('relationships', birthData, useAI);
    },
    [generatePrediction]
  );

  return {
    ...rest,
    generateRelationships,
  };
};

/**
 * Hook for General Predictions
 */
export const useGeneralPredictions = (options?: UsePredictionsOptions) => {
  const { generatePrediction, ...rest } = usePredictions(options);

  const generateGeneralPredictions = useCallback(
    (birthData: ChartData, useAI?: boolean) => {
      return generatePrediction('predictions', birthData, useAI);
    },
    [generatePrediction]
  );

  return {
    ...rest,
    generateGeneralPredictions,
  };
};

/**
 * Hook for managing prediction cache
 */
export const usePredictionCache = (storageKey: string = 'predictions_cache') => {
  const [cache, setCache] = useState<Record<string, PredictionResult>>({});

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setCache(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load prediction cache:', err);
    }
  }, [storageKey]);

  // Save to cache
  const saveToCache = useCallback((key: string, prediction: PredictionResult) => {
    setCache(prev => {
      const updated = { ...prev, [key]: prediction };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save to cache:', err);
      }
      return updated;
    });
  }, [storageKey]);

  // Get from cache
  const getFromCache = useCallback((key: string): PredictionResult | null => {
    return cache[key] || null;
  }, [cache]);

  // Clear cache
  const clearCache = useCallback(() => {
    setCache({});
    try {
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  }, [storageKey]);

  // Generate cache key
  const generateCacheKey = useCallback((engine: PredictionEngine, birthData: BirthData): string => {
    return `${engine}_${birthData.date_of_birth}_${birthData.time_of_birth || 'unknown'}`;
  }, []);

  return {
    cache,
    saveToCache,
    getFromCache,
    clearCache,
    generateCacheKey,
  };
};

export default usePredictions;
