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
import { unwrapPredictionPayload } from './api/predictionResponse';
import { emitToast, buildIssueReportUrl } from './toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const MAX_REQUEST_BYTES = Number(process.env.NEXT_PUBLIC_MAX_REQUEST_BYTES ?? 1024 * 1024);
const COMPRESSION_THRESHOLD_BYTES = 64 * 1024;

const toBytes = (input: string): Uint8Array => new TextEncoder().encode(input);

const gzipCompress = async (payload: Uint8Array): Promise<Uint8Array> => {
  const stream = new Blob([payload]).stream().pipeThrough(new CompressionStream('gzip'));
  const buffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(buffer);
};

export const api = axios.create({
  baseURL:  API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,  // 120 seconds - increased for AI-powered predictions
  withCredentials: true,  // Enable CORS credentials for cross-origin requests
});

// Request interceptor for logging
api.interceptors.request.use(
  async (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[API] ${config.method?. toUpperCase()} ${config.url}`);
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

// Response interceptor with retry logic
// Use WeakMap to track retry state without modifying config object
const retryState = new WeakMap<any, { count: number; inProgress: boolean }>();
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Initialize retry state for this config if not exists
    if (config && !retryState.has(config)) {
      retryState.set(config, { count: 0, inProgress: false });
    }
    
    const state = config ? retryState.get(config)! : undefined;
    const status = error.response?.status;
    const responseData = error.response?.data ?? {};
    const retryable = Boolean(responseData?.retryable);
    
    // Retry logic for retryable responses or transient 5xx errors
    if (state && (retryable || (status >= 500 && status < 600)) && !state.inProgress && state.count < MAX_RETRIES) {
      state.count++;
      state.inProgress = true;
      
      // Exponential backoff
      const delayMs = BASE_RETRY_DELAY_MS * Math.pow(2, state.count - 1);
      await delay(delayMs);
      
      state.inProgress = false;
      return api(config);
    }
    
    // Offline detection
    if (typeof navigator !== 'undefined' && ! navigator.onLine) {
      return Promise.reject(new Error('You are offline.  Please check your connection. '));
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
  while (offlineQueue. length > 0 && isOnline()) {
    const request = offlineQueue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        console. error('Failed to process queued request:', error);
      }
    }
  }
}

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window. addEventListener('online', () => {
    console.log('Connection restored.  Processing offline queue.. .');
    processOfflineQueue();
  });

  window.addEventListener('offline', () => {
    console.warn('Connection lost.  Requests will be queued.');
  });
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
    const response = await api. post('/api/astrology/birth-chart', data);
    return response. data;
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

export const karmicJourneyAPI = {
  getAnalysis: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-journey/analysis', data);
    return unwrapPredictionPayload(response.data);
  },

  getSoulPurpose: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-journey/soul-purpose', data);
    return unwrapPredictionPayload(response.data);
  },

  getKarmicLessons: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-journey/karmic-lessons', data);
    return unwrapPredictionPayload(response.data);
  },

  getSoulEvolution: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-journey/soul-evolution', data);
    return unwrapPredictionPayload(response.data);
  },

  getDharmicPath: async (data:  BirthDetails) => {
    const response = await api. post('/api/karmic-journey/dharmic-path', data);
    return unwrapPredictionPayload(response.data);
  },
};

export const pastLivesAPI = {
  getAnalysis: async (data: BirthDetails) => {
    const response = await api.post('/api/past-lives/analysis', data);
    return unwrapPredictionPayload(response.data);
  },

  getKarmicPatterns: async (data: BirthDetails) => {
    const response = await api.post('/api/past-lives/karmic-patterns', data);
    return unwrapPredictionPayload(response.data);
  },

  getPastRelationships: async (data: BirthDetails) => {
    const response = await api.post('/api/past-lives/past-relationships', data);
    return unwrapPredictionPayload(response.data);
  },

  getTalentsCarriedForward: async (data: BirthDetails) => {
    const response = await api.post('/api/past-lives/talents-carried-forward', data);
    return unwrapPredictionPayload(response.data);
  },

  getPastTraumas: async (data:  BirthDetails) => {
    const response = await api. post('/api/past-lives/past-traumas', data);
    return unwrapPredictionPayload(response.data);
  },
};

export const futureLivesAPI = {
  getPrediction: async (data:  BirthDetails) => {
    const response = await api. post('/api/future-lives/prediction', data);
    return unwrapPredictionPayload(response.data);
  },

  getEvolutionPath: async (data: BirthDetails) => {
    const response = await api.post('/api/future-lives/evolution-path', data);
    return unwrapPredictionPayload(response.data);
  },

  getMokshaTimeline: async (data: BirthDetails) => {
    const response = await api.post('/api/future-lives/moksha-timeline', data);
    return unwrapPredictionPayload(response.data);
  },

  getFutureMissions: async (data:  BirthDetails) => {
    const response = await api. post('/api/future-lives/future-missions', data);
    return unwrapPredictionPayload(response.data);
  },

  getSoulAdvancement: async (data:  BirthDetails) => {
    const response = await api. post('/api/future-lives/soul-advancement', data);
    return unwrapPredictionPayload(response.data);
  },
};

export const presentLifeAPI = {
  getComprehensiveAnalysis:  async (data: BirthDetails) => {
    const response = await api.post('/api/present-life/comprehensive-analysis', data);
    return unwrapPredictionPayload(response.data);
  },

  getCareerGuidance: async (data: BirthDetails) => {
    const response = await api.post('/api/present-life/career-guidance', data);
    return unwrapPredictionPayload(response.data);
  },

  getRelationshipsAnalysis: async (data: BirthDetails) => {
    const response = await api.post('/api/present-life/relationships', data);
    return unwrapPredictionPayload(response.data);
  },

  getHealthWellness: async (data: BirthDetails) => {
    const response = await api.post('/api/present-life/health-wellness', data);
    return unwrapPredictionPayload(response.data);
  },

  getFinancialProspects: async (data: BirthDetails) => {
    const response = await api.post('/api/present-life/financial-prospects', data);
    return unwrapPredictionPayload(response.data);
  },

  getSpiritualGrowth: async (data: BirthDetails) => {
    const response = await api.post('/api/present-life/spiritual-growth', data);
    return unwrapPredictionPayload(response.data);
  },

  getCurrentDasha: async (data:  BirthDetails) => {
    const response = await api. post('/api/present-life/current-dasha', data);
    return unwrapPredictionPayload(response.data);
  },
};

export const lifeEventsAPI = {
  getPrediction: async (data: BirthDetails & { years_ahead?:  number }) => {
    const response = await api.post('/api/life-events/prediction', data);
    return unwrapPredictionPayload(response.data);
  },

  getCareerMilestones: async (data: BirthDetails) => {
    const response = await api.post('/api/life-events/career-milestones', data);
    return unwrapPredictionPayload(response.data);
  },

  getRelationshipEvents: async (data:  BirthDetails) => {
    const response = await api. post('/api/life-events/relationship-events', data);
    return unwrapPredictionPayload(response.data);
  },

  getFinancialEvents: async (data:  BirthDetails) => {
    const response = await api. post('/api/life-events/financial-events', data);
    return unwrapPredictionPayload(response.data);
  },

  getHealthAlerts: async (data: BirthDetails) => {
    const response = await api.post('/api/life-events/health-alerts', data);
    return unwrapPredictionPayload(response.data);
  },

  getSpiritualBreakthroughs: async (data: BirthDetails) => {
    const response = await api.post('/api/life-events/spiritual-breakthroughs', data);
    return unwrapPredictionPayload(response.data);
  },

  getAuspiciousTimings: async (data:  BirthDetails) => {
    const response = await api. post('/api/life-events/auspicious-timings', data);
    return unwrapPredictionPayload(response.data);
  },
};

export const karmicRemediesAPI = {
  getComprehensive: async (data:  BirthDetails & { challenges?: string[] }) => {
    const response = await api.post('/api/karmic-remedies/comprehensive', data);
    return unwrapPredictionPayload(response.data);
  },

  getMantras: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-remedies/mantras', data);
    return unwrapPredictionPayload(response.data);
  },

  getGemstones: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-remedies/gemstones', data);
    return unwrapPredictionPayload(response.data);
  },

  getRituals: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-remedies/rituals', data);
    return unwrapPredictionPayload(response.data);
  },

  getCharitableActs: async (data:  BirthDetails) => {
    const response = await api. post('/api/karmic-remedies/charitable-acts', data);
    return unwrapPredictionPayload(response.data);
  },

  getLifestyleModifications: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-remedies/lifestyle-modifications', data);
    return unwrapPredictionPayload(response.data);
  },

  getMeditationPractices: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-remedies/meditation-practices', data);
    return unwrapPredictionPayload(response.data);
  },

  getYantraRecommendations: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-remedies/yantra-recommendations', data);
    return unwrapPredictionPayload(response.data);
  },
};

export const predictionsAPI = {
  getDaily: async (data:  BirthDetails) => {
    const response = await api. post('/api/predictions/daily', data);
    return unwrapPredictionPayload(response.data);
  },

  getWeekly: async (data:  BirthDetails) => {
    const response = await api. post('/api/predictions/weekly', data);
    return unwrapPredictionPayload(response.data);
  },

  getMonthly: async (data: BirthDetails) => {
    const response = await api.post('/api/predictions/monthly', data);
    return unwrapPredictionPayload(response.data);
  },

  getYearly: async (data: BirthDetails) => {
    const response = await api.post('/api/predictions/yearly', data);
    return unwrapPredictionPayload(response.data);
  },

  askQuestion: async (data: BirthDetails & { question: string }) => {
    const response = await api. post('/api/predictions/question', data);
    return unwrapPredictionPayload(response.data);
  },
};

export const aiAPI = {
  /**
   * Get AI consent information and requirements
   */
  getConsentInfo: async () => {
    const response = await api. get('/api/ai/consent');
    return response. data;
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
    if (!aiMode. consent) {
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
    if (!aiMode. consent) {
      throw new Error('AI consent required');
    }
    
    if (aiMode.mode !== 'conversational') {
      throw new Error('Conversational mode required for chat');
    }
    
    const response = await api. post('/api/ai/chat', data, {
      headers:  {
        'X-AI-Consent': 'granted',
        'X-AI-Mode': 'conversational'
      }
    });
    return response. data;
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
        'X-AI-Mode': aiMode. mode
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
    return response. data;
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
    return response. data;
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
    return response. data;
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
    const response = await api. post('/api/matchmaking/compatibility', {
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
    return response. data;
  },

  /**
   * Get detailed Ashtakoot analysis
   */
  getAshtakootAnalysis: async (person1: BirthDetails, person2: BirthDetails) => {
    const response = await api. post('/api/matchmaking/ashtakoot', {
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
