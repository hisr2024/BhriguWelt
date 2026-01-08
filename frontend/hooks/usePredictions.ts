/**
 * usePredictions Hook
 * React hook for managing prediction state and API calls
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  PredictionsAPI,
  PredictionEngine,
  PredictionResult,
  ChartData,
  BirthData,
  GeneralPredictionRequest,
} from '@/lib/api/predictions';
import { useToast } from '@/lib/context/ToastContext';

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
  generateGeneralPredictions: (
    birthData: ChartData,
    options?: GeneralPredictionRequest
  ) => Promise<PredictionResult>;
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
  const { addToast } = useToast();
  const latestRequestId = useRef(0);

  // State
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [allPredictions, setAllPredictions] = useState<Record<PredictionEngine, PredictionResult> | null>(null);
  const [chart, setChart] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRequest = useCallback(() => {
    latestRequestId.current += 1;
    return latestRequestId.current;
  }, []);

  const notifySuperseded = useCallback(() => {
    addToast('A newer request replaced the previous one.', { variant: 'warning' });
  }, [addToast]);

  /**
   * Calculate birth chart
   */
  const calculateChart = useCallback(async (birthData: BirthData) => {
    const requestId = startRequest();
    setLoading(true);
    setError(null);

    try {
      const chartData = await api.calculateChart(birthData);
      if (requestId === latestRequestId.current) {
        setChart(chartData);
      } else {
        notifySuperseded();
      }
      return chartData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate chart';
      if (requestId === latestRequestId.current) {
        setError(errorMessage);
      } else {
        notifySuperseded();
      }
      throw err;
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false);
      }
    }
  }, [api, notifySuperseded, startRequest]);

  /**
   * Generate prediction for single engine
   */
  const generatePrediction = useCallback(async (
    engine: PredictionEngine,
    birthData: ChartData,
    useAI: boolean = true
  ) => {
    const requestId = startRequest();
    setLoading(true);
    setError(null);

    try {
      // Auto-calculate chart if needed
      if (autoCalculateChart && !birthData.zodiac_sign) {
        const calculatedChart = await api.calculateChart(birthData);
        birthData = calculatedChart;
        if (requestId === latestRequestId.current) {
          setChart(calculatedChart);
        }
      }

      const result = await api.generatePrediction(engine, birthData, useAI);
      if (requestId === latestRequestId.current) {
        setPrediction(result);
      } else {
        notifySuperseded();
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate prediction';
      if (requestId === latestRequestId.current) {
        setError(errorMessage);
      } else {
        notifySuperseded();
      }
      throw err;
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false);
      }
    }
  }, [api, autoCalculateChart, notifySuperseded, startRequest]);

  /**
   * Generate all predictions
   */
  const generateAllPredictions = useCallback(async (
    birthData: ChartData,
    useAI: boolean = true
  ) => {
    const requestId = startRequest();
    setLoading(true);
    setError(null);

    try {
      // Auto-calculate chart if needed
      if (autoCalculateChart && !birthData.zodiac_sign) {
        const calculatedChart = await api.calculateChart(birthData);
        birthData = calculatedChart;
        if (requestId === latestRequestId.current) {
          setChart(calculatedChart);
        }
      }

      const results = await api.getAllPredictions(birthData, useAI);
      if (requestId === latestRequestId.current) {
        setAllPredictions(results);
      } else {
        notifySuperseded();
      }
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate predictions';
      if (requestId === latestRequestId.current) {
        setError(errorMessage);
      } else {
        notifySuperseded();
      }
      throw err;
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false);
      }
    }
  }, [api, autoCalculateChart, notifySuperseded, startRequest]);

  /**
   * Generate General Predictions using two-phase engine
   */
  const generateGeneralPredictions = useCallback(async (
    birthData: ChartData,
    options: GeneralPredictionRequest = {}
  ) => {
    const requestId = startRequest();
    setLoading(true);
    setError(null);

    try {
      if (autoCalculateChart && !birthData.zodiac_sign) {
        const calculatedChart = await api.calculateChart(birthData);
        birthData = calculatedChart;
        if (requestId === latestRequestId.current) {
          setChart(calculatedChart);
        }
      }

      const result = await api.generateGeneralPredictions(birthData, options);
      if (requestId === latestRequestId.current) {
        setPrediction(result);
      } else {
        notifySuperseded();
      }
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate general predictions';
      if (requestId === latestRequestId.current) {
        setError(errorMessage);
      } else {
        notifySuperseded();
      }
      throw err;
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false);
      }
    }
  }, [api, autoCalculateChart, notifySuperseded, startRequest]);

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
    generateGeneralPredictions,
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
  const { generateGeneralPredictions, ...rest } = usePredictions(options);

  const generateGeneralPredictionsWithOptions = useCallback(
    (birthData: ChartData, predictionOptions?: GeneralPredictionRequest) => {
      return generateGeneralPredictions(birthData, predictionOptions);
    },
    [generateGeneralPredictions]
  );

  return {
    ...rest,
    generateGeneralPredictions: generateGeneralPredictionsWithOptions,
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
