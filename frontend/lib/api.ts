/**
 * API Client for BhriguWelt Backend
 */
import axios from 'axios';
import type {
  BirthDetails,
  BirthChartAPI,
  AIMode,
  AIBirthData,
  AIComposeRequest,
  AIChatRequest,
  AISummarizeRequest,
  PredictionResult,
} from './types';
import { normalizePredictionResponse } from './api/predictionResponse';
import { emitToast, buildIssueReportUrl } from './toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const AUTH_REFRESH_ENDPOINT = '/api/auth/refresh';
const API_TIMEOUT_MS = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '300000', 10); // 5 minutes (increased from 120000)
const MAX_REQUEST_BYTES = parseInt(process.env.NEXT_PUBLIC_MAX_REQUEST_BYTES || '1048576', 10);
const COMPRESSION_THRESHOLD_BYTES = parseInt(
  process.env.NEXT_PUBLIC_COMPRESSION_THRESHOLD_BYTES || '65536',
  10
);
const textEncoder = new TextEncoder();

const toBytes = (input: string): Uint8Array => {
  return textEncoder.encode(input);
};

const gzipCompress = async (data: Uint8Array): Promise<Uint8Array> => {
  const compressionStream = new CompressionStream('gzip');
  const writer = compressionStream.writable.getWriter();
  writer.write(data);
  writer.close();
  const compressed = await new Response(compressionStream.readable).arrayBuffer();
  return new Uint8Array(compressed);
};

export const api = axios.create({
  baseURL:  API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT_MS,  // 5 minutes - increased for AI-powered predictions
  withCredentials: true,  // Enable CORS credentials for cross-origin requests
  validateStatus: (status) => status < 500, // Don't throw on 4xx errors
});

const refreshClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
  withCredentials: true,
});

// Request interceptor for logging
api.interceptors.request.use(
  async (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    if (typeof navigator !== 'undefined') {
      config.headers = config.headers ?? {};
      config.headers['X-Client-Online'] = navigator.onLine ? 'true' : 'false';
    }

    if (config.data) {
      const isSerializableObject =
        typeof config.data === 'object' &&
        !ArrayBuffer.isView(config.data) &&
        !(config.data instanceof ArrayBuffer) &&
        !(config.data instanceof Blob) &&
        !(config.data instanceof FormData);

      const payloadString = typeof config.data === 'string'
        ? config.data
        : isSerializableObject
        ? JSON.stringify(config.data)
        : null;

      if (payloadString !== null) {
        const payloadBytes = toBytes(payloadString);
        if (payloadBytes.byteLength > MAX_REQUEST_BYTES) {
          const message = `Request payload exceeds ${MAX_REQUEST_BYTES} bytes. Please reduce the request size.`;
          emitToast({
            type: 'error',
            title: 'Request too large',
            message,
            errorCode: 'PAYLOAD_TOO_LARGE',
            details: { maxBytes: MAX_REQUEST_BYTES },
          });
          return Promise.reject(new Error(message));
        }

        if (payloadBytes.byteLength >= COMPRESSION_THRESHOLD_BYTES && typeof CompressionStream !== 'undefined') {
          const compressed = await gzipCompress(payloadBytes);
          config.data = new Blob([compressed], { type: 'application/json' });
          config.headers = config.headers ?? {};
          config.headers['Content-Encoding'] = 'gzip';
          config.headers['Content-Type'] = 'application/json';
          config.headers['X-Uncompressed-Content-Length'] = payloadBytes.byteLength.toString();
        }
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with enhanced retry logic
// Use WeakMap to track retry state without modifying config object
const retryState = new WeakMap<any, { count: number; inProgress: boolean }>();
const unauthorizedState = new WeakMap<any, { attempted: boolean }>();
const MAX_RETRIES = 3; // Max retry attempts
const BASE_RETRY_DELAY_MS = 2000; // Start with 2 seconds

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const redirectToUnlock = () => {
  if (typeof window !== 'undefined') {
    window.location.assign('/unlock');
  }
};

const tryRefreshSession = async () => {
  await refreshClient.post(AUTH_REFRESH_ENDPOINT);
};

/**
 * Determines if an error should be retried
 */
const shouldRetryError = (error: any, status?: number): boolean => {
  // Retry on network errors (no response)
  if (!error.response) {
    return true;
  }

  // Retry on timeout errors
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Retry on 5xx server errors
  if (status && status >= 500 && status < 600) {
    return true;
  }

  // Retry if backend explicitly marks as retryable
  if (error.response?.data?.retryable) {
    return true;
  }

  return false;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Initialize retry state for this config if not exists
    if (config && !retryState.has(config)) {
      retryState.set(config, { count: 0, inProgress: false });
    }

    const state = config ? retryState.get(config)! : undefined;
    const unauthorized = config ? unauthorizedState.get(config) : undefined;
    const status = error.response?.status;
    const responseData = error.response?.data ?? {};

    // Handle unauthorized responses with refresh/redirect flow
    if (status === 401 && config && config.url !== AUTH_REFRESH_ENDPOINT) {
      if (!unauthorized) {
        unauthorizedState.set(config, { attempted: true });
        try {
          await tryRefreshSession();
          return api(config);
        } catch (refreshError) {
          emitToast({
            type: 'error',
            title: 'Session expired',
            message: 'Your session has expired. Please unlock again to continue.',
            errorCode: 'UNAUTHORIZED',
          });
          redirectToUnlock();
          return Promise.reject(refreshError);
        }
      }

      emitToast({
        type: 'error',
        title: 'Session expired',
        message: 'Your session has expired. Please unlock again to continue.',
        errorCode: 'UNAUTHORIZED',
      });
      redirectToUnlock();
      return Promise.reject(error);
    }

    // Enhanced retry logic with exponential backoff
    if (state && !state.inProgress && state.count < MAX_RETRIES && shouldRetryError(error, status)) {
      state.count++;
      state.inProgress = true;

      // Exponential backoff: 2s, 4s, 8s
      const delayMs = BASE_RETRY_DELAY_MS * Math.pow(2, state.count - 1);

      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[API] Retrying request (attempt ${state.count}/${MAX_RETRIES}) after ${delayMs}ms`,
          { url: config?.url, method: config?.method, error: error.message }
        );
      }

      await delay(delayMs);

      state.inProgress = false;
      return api(config);
    }

    // Offline detection
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return Promise.reject(new Error('You are offline. Please check your connection.'));
    }

    const message = responseData?.message || error.message || 'Request failed';
    const errorCode = responseData?.error_code;
    const reportIssueUrl = buildIssueReportUrl({
      message,
      errorCode,
      details: responseData?.details,
      status,
      method: config?.method?.toUpperCase(),
      url: config?.url,
    });

    emitToast({
      type: 'error',
      title: 'Request failed',
      message,
      errorCode,
      details: responseData?.details,
      reportIssueUrl,
    });

    return Promise.reject(error);
  }
);

// Offline queue for failed requests
export const offlineQueue:  Array<() => Promise<any>> = [];

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ?  navigator.onLine :  true;
}

/**
 * Process queued requests when connection is restored
 */
export async function processOfflineQueue(): Promise<void> {
  while (offlineQueue.length > 0 && isOnline()) {
    const request = offlineQueue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
  }
}

// Re-export types for convenience
export type {
  BirthDetails,
  BirthChartAPI as BirthChart,
  AIMode,
  AIBirthData,
  AIComposeRequest,
  AIChatRequest,
  AISummarizeRequest,
  PredictionResult,
} from './types';

// API Methods
export const astrologyAPI = {
  calculateBirthChart: async (data: BirthDetails) => {
    const response = await api.post('/api/astrology/birth-chart', data);
    return response.data;
  },

  getZodiacAnalysis: async (data: BirthDetails) => {
    const response = await api.post('/api/astrology/zodiac-analysis', data);
    return response.data;
  },

  getPlanetaryPositions: async (data: BirthDetails) => {
    const response = await api.post('/api/astrology/planetary-positions', data);
    return response.data;
  },
};

export const birthChartAPI = {
  compute: async (data: Record<string, unknown>) => {
    const response = await api.post('/api/v1/birthchart/compute', data);
    return response.data;
  },
};

const extractPredictionPayload = <T = unknown>(response: any): T => {
  return normalizePredictionResponse<T>(response).prediction as T;
};

/**
 * @deprecated Use bhriguPredictionsAPI instead.
 */
export const karmicJourneyAPI = {
  getAnalysis: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getKarmicJourney(data);
    return extractPredictionPayload(response);
  },

  getSoulPurpose: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getKarmicJourney(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.soul_purpose ?? prediction;
  },

  getKarmicLessons: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getKarmicJourney(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.karmic_lessons ?? prediction;
  },

  getSoulEvolution: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getKarmicJourney(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.evolution_stage ?? prediction?.spiritual_gifts ?? prediction;
  },

  getDharmicPath: async (data:  BirthDetails) => {
    const response = await bhriguPredictionsAPI.getKarmicJourney(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.life_mission ?? prediction?.timing ?? prediction;
  },
};

/**
 * @deprecated Use bhriguPredictionsAPI instead.
 */
export const pastLivesAPI = {
  getAnalysis: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPastLives(data);
    return extractPredictionPayload(response);
  },

  getKarmicPatterns: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPastLives(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.karmic_patterns ?? prediction;
  },

  getPastRelationships: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPastLives(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.past_relationships ?? prediction;
  },

  getTalentsCarriedForward: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPastLives(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.past_skills ?? prediction;
  },

  getPastTraumas: async (data:  BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPastLives(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.traumas_healing ?? prediction;
  },
};

/**
 * @deprecated Use bhriguPredictionsAPI instead.
 */
export const futureLivesAPI = {
  getPrediction: async (data:  BirthDetails) => {
    const response = await bhriguPredictionsAPI.getFutureLives(data);
    return extractPredictionPayload(response);
  },

  getEvolutionPath: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getFutureLives(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.evolution_trajectory ?? prediction;
  },

  getMokshaTimeline: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getFutureLives(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.moksha_timeline ?? prediction;
  },

  getFutureMissions: async (data:  BirthDetails) => {
    const response = await bhriguPredictionsAPI.getFutureLives(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.bodhisattva_path ?? prediction;
  },

  getSoulAdvancement: async (data:  BirthDetails) => {
    const response = await bhriguPredictionsAPI.getFutureLives(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.ultimate_destiny ?? prediction;
  },
};

/**
 * @deprecated Use bhriguPredictionsAPI instead.
 */
export const presentLifeAPI = {
  getComprehensiveAnalysis:  async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPresentLife(data);
    return extractPredictionPayload(response);
  },

  getCareerGuidance: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPresentLife(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.career ?? prediction;
  },

  getRelationshipsAnalysis: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPresentLife(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.relationships ?? prediction;
  },

  getHealthWellness: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPresentLife(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.health ?? prediction;
  },

  getFinancialProspects: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPresentLife(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.finances ?? prediction;
  },

  getSpiritualGrowth: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPresentLife(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.spiritual_growth ?? prediction;
  },

  getCurrentDasha: async (data:  BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPresentLife(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.timing ?? prediction;
  },
};

/**
 * @deprecated Use bhriguPredictionsAPI instead.
 */
export const lifeEventsAPI = {
  getPrediction: async (data: BirthDetails & { years_ahead?:  number }) => {
    const response = await bhriguPredictionsAPI.getLifeEvents(data);
    return extractPredictionPayload(response);
  },

  getCareerMilestones: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getLifeEvents(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.career_milestones ?? prediction;
  },

  getRelationshipEvents: async (data:  BirthDetails) => {
    const response = await bhriguPredictionsAPI.getLifeEvents(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.marriage_timing ?? prediction?.children_family ?? prediction;
  },

  getFinancialEvents: async (data:  BirthDetails) => {
    const response = await bhriguPredictionsAPI.getLifeEvents(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.financial_events ?? prediction;
  },

  getHealthAlerts: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getLifeEvents(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.health_alerts ?? prediction;
  },

  getSpiritualBreakthroughs: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getLifeEvents(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.spiritual_milestones ?? prediction;
  },

  getAuspiciousTimings: async (data:  BirthDetails) => {
    const response = await bhriguPredictionsAPI.getLifeEvents(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.favorable_periods ?? prediction;
  },
};

/**
 * @deprecated Use bhriguPredictionsAPI instead.
 */
export const karmicRemediesAPI = {
  getComprehensive: async (data:  BirthDetails & { challenges?: string[] }) => {
    const response = await bhriguPredictionsAPI.getKarmicRemedies(data);
    return extractPredictionPayload(response);
  },

  getMantras: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getKarmicRemedies(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.mantras ?? prediction;
  },

  getGemstones: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getKarmicRemedies(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.gemstones ?? prediction;
  },

  getRituals: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getKarmicRemedies(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.planetary_rituals ?? prediction;
  },

  getCharitableActs: async (data:  BirthDetails) => {
    const response = await bhriguPredictionsAPI.getKarmicRemedies(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.charitable_activities ?? prediction;
  },

  getLifestyleModifications: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getKarmicRemedies(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.lifestyle ?? prediction;
  },

  getMeditationPractices: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getKarmicRemedies(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.meditation ?? prediction;
  },

  getYantraRecommendations: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getKarmicRemedies(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.yantras ?? prediction;
  },
};

/**
 * @deprecated Use bhriguPredictionsAPI instead.
 */
export const predictionsAPI = {
  getDaily: async (data:  BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPredictions(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.daily ?? prediction;
  },

  getWeekly: async (data:  BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPredictions(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.weekly ?? prediction;
  },

  getMonthly: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPredictions(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.monthly ?? prediction;
  },

  getYearly: async (data: BirthDetails) => {
    const response = await bhriguPredictionsAPI.getPredictions(data);
    const prediction = extractPredictionPayload<any>(response);
    return prediction?.yearly ?? prediction;
  },

  askQuestion: async (data: BirthDetails & { question: string }) => {
    const response = await bhriguPredictionsAPI.getPredictions(data);
    return extractPredictionPayload(response);
  },
};

export const aiAPI = {
  /**
   * Get AI consent information and requirements
   */
  getConsentInfo: async () => {
    const response = await api.get('/api/ai/consent');
    return response.data;
  },

  /**
   * Check AI service status
   */
  getStatus: async () => {
    const response = await api.get('/api/ai/status');
    return response.data;
  },

  /**
   * Refine report section using AI
   * Requires AI consent header
   */
  composeReport: async (data: AIComposeRequest, aiMode: AIMode) => {
    if (!aiMode.consent) {
      throw new Error('AI consent required');
    }
    
    const response = await api.post('/api/ai/compose', data, {
      headers:  {
        'X-AI-Consent': 'granted',
        'X-AI-Mode':  aiMode.mode
      }
    });
    return response.data;
  },

  /**
   * Chat about astrological report
   * Requires AI consent header
   */
  chat: async (data:  AIChatRequest, aiMode: AIMode) => {
    if (!aiMode.consent) {
      throw new Error('AI consent required');
    }
    
    if (aiMode.mode !== 'conversational') {
      throw new Error('Conversational mode required for chat');
    }
    
    const response = await api.post('/api/ai/chat', data, {
      headers:  {
        'X-AI-Consent': 'granted',
        'X-AI-Mode': 'conversational'
      }
    });
    return response.data;
  },

  /**
   * Summarize report using AI
   * Requires AI consent header
   */
  summarize: async (data:  AISummarizeRequest, aiMode:  AIMode) => {
    if (!aiMode.consent) {
      throw new Error('AI consent required');
    }

    const response = await api.post('/api/ai/summarize', data, {
      headers: {
        'X-AI-Consent': 'granted',
        'X-AI-Mode': aiMode.mode
      }
    });
    return response.data;
  },
};

/**
 * Bhrigu Predictions API
 * Comprehensive Bhrigu Samhita and Nadi Jyotisa predictions
 * All 8 categories with caching and wisdom database
 */
export const bhriguPredictionsAPI = {
  /**
   * Get Karmic Journey prediction
   * Discover soul's purpose and life mission
   */
  getKarmicJourney:  async (data: BirthDetails & { question?:  string; force_regenerate?: boolean }) => {
    const response = await api.post<PredictionResult>('/api/bhrigu-predictions/karmic-journey', data);
    return response.data;
  },

  /**
   * Get Past Lives analysis
   * Explore previous incarnations and karmic patterns
   */
  getPastLives: async (data: BirthDetails & { question?: string; force_regenerate?:  boolean }) => {
    const response = await api.post<PredictionResult>('/api/bhrigu-predictions/past-lives', data);
    return response.data;
  },

  /**
   * Get Future Lives prediction
   * Envision soul's evolution and future incarnations
   */
  getFutureLives: async (data: BirthDetails & { question?: string; force_regenerate?: boolean }) => {
    const response = await api.post<PredictionResult>('/api/bhrigu-predictions/future-lives', data);
    return response.data;
  },

  /**
   * Get Present Life analysis
   * Comprehensive current life opportunities and challenges
   */
  getPresentLife:  async (data: BirthDetails & { question?: string; force_regenerate?: boolean }) => {
    const response = await api.post<PredictionResult>('/api/bhrigu-predictions/present-life', data);
    return response.data;
  },

  /**
   * Get Life Events prediction
   * Major transitions with precision timing
   */
  getLifeEvents:  async (data: BirthDetails & { question?: string; force_regenerate?: boolean }) => {
    const response = await api.post<PredictionResult>('/api/bhrigu-predictions/life-events', data);
    return response.data;
  },

  /**
   * Get Karmic Remedies
   * Personalized spiritual practices for balance
   */
  getKarmicRemedies: async (data: BirthDetails & { question?:  string; force_regenerate?: boolean }) => {
    const response = await api.post<PredictionResult>('/api/bhrigu-predictions/karmic-remedies', data);
    return response.data;
  },

  /**
   * Get Relationships analysis
   * Soul connections and compatibility
   */
  getRelationships:  async (data: BirthDetails & { question?: string; force_regenerate?: boolean }) => {
    const response = await api.post<PredictionResult>('/api/bhrigu-predictions/relationships', data);
    return response.data;
  },

  /**
   * Get General Predictions
   * Daily, weekly, monthly, yearly forecasts
   */
  getPredictions: async (data: BirthDetails & { question?:  string; force_regenerate?: boolean }) => {
    const response = await api.post<PredictionResult>('/api/bhrigu-predictions/predictions', data);
    return response.data;
  },

  /**
   * Get Comprehensive prediction for ALL categories
   * Complete Bhrigu Samhita analysis covering all 8 aspects
   */
  getComprehensive:  async (data: BirthDetails & { force_regenerate?: boolean }) => {
    const response = await api.post<PredictionResult>('/api/bhrigu-predictions/comprehensive', data);
    return response.data;
  },

  /**
   * Search Bhrigu wisdom database
   * Access accumulated knowledge from previous predictions
   */
  searchWisdom:  async (params: {
    category?: string;
    zodiac_sign?: string;
    nakshatra?: string;
    limit?: number;
  }) => {
    const response = await api.post('/api/bhrigu-predictions/wisdom-search', params);
    return response.data;
  },

  /**
   * Get cache statistics
   * View accumulated prediction knowledge
   */
  getCacheStats: async () => {
    const response = await api.get('/api/bhrigu-predictions/cache-stats');
    return response.data;
  },

  /**
   * Start a new prediction session
   * Tracks user journey for analytics
   */
  startSession: async (user_hash?:  string) => {
    const response = await api.post('/api/bhrigu-predictions/session/start', { user_hash });
    return response.data;
  },
};

/**
 * Generate report with progress tracking
 * Provides real-time progress updates during report generation
 */
export async function generateReportWithProgress(
  data: BirthDetails,
  engine: string,
  onProgress?: (progress: number, message: string) => void
) {
  const response = await api.post(`/api/bhrigu-predictions/${engine}`, data, {
    responseType: 'text',
  });

  if (!response.data) {
    throw new Error('No response data');
  }

  // If the response is not streaming (no newlines), return it directly
  if (!response.data.includes('\n')) {
    try {
      return JSON.parse(response.data);
    } catch {
      return response.data;
    }
  }

  // Parse streaming response
  const lines = response.data.split('\n');
  let result: any = null;

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.progress !== undefined) {
          onProgress?.(data.progress, data.message || 'Generating...');
        }
        if (data.result) {
          result = data.result;
        }
      } catch (error) {
        console.error('Error parsing progress data:', error);
      }
    }
  }

  return result || JSON.parse(response.data);
}

/**
 * Matchmaking API
 * Kundali matching and compatibility analysis using Ashtakoot system
 */
export const matchmakingAPI = {
  /**
   * Calculate detailed compatibility between two individuals
   * Uses Ashtakoot (8-fold) Guna Milan system
   */
  calculateCompatibility:  async (data: {
    person1: BirthDetails & { name?:  string };
    person2: BirthDetails & { name?: string };
    mode?: 'online' | 'offline' | 'hybrid';
  }) => {
    const response = await api.post('/api/matchmaking/compatibility', data);
    return response.data;
  },

  /**
   * Get compatibility between two individuals (alias for calculateCompatibility)
   */
  getCompatibility: async (person1: BirthDetails, person2: BirthDetails) => {
    const response = await api.post('/api/matchmaking/compatibility', {
      person1,
      person2,
    });
    return response.data;
  },

  /**
   * Quick compatibility check using zodiac signs
   */
  quickMatch: async (data:  { zodiac1:  string; zodiac2: string }) => {
    const response = await api.post('/api/matchmaking/quick-match', data);
    return response.data;
  },

  /**
   * Check for marriage doshas (Mangal Dosha, etc.)
   */
  checkDoshas: async (data: BirthDetails) => {
    const response = await api.post('/api/matchmaking/doshas', data);
    return response.data;
  },

  /**
   * Get detailed Ashtakoot analysis
   */
  getAshtakootAnalysis: async (person1: BirthDetails, person2: BirthDetails) => {
    const response = await api.post('/api/matchmaking/ashtakoot', {
      person1,
      person2,
    });
    return response.data;
  },

  /**
   * Get remedies for improving compatibility
   */
  getRemedies: async (data: {
    compatibility_score:  number;
    doshas?:  string[];
    weak_kutas?: string[];
  }) => {
    const response = await api.post('/api/matchmaking/remedies', data);
    return response.data;
  },
};
