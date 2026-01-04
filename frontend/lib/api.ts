/**
 * API Client for BhriguWelt Backend
 */
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Types
export interface BirthDetails {
  date_of_birth: string;
  time_of_birth: string;
  place_of_birth: string;
  latitude?: number;
  longitude?: number;
}

export interface BirthChart {
  birth_details: {
    date: string;
    time: string;
    place: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  zodiac_sign: string;
  moon_sign: string;
  ascendant: string;
  nakshatra: string;
  element: string;
  planets: Record<string, any>;
  houses: string[];
  karmic_number: number;
  soul_number: number;
  dasha_period: {
    maha_dasha: string;
    years_remaining: number;
  };
}

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

export const karmicJourneyAPI = {
  getAnalysis: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-journey/analysis', data);
    return response.data;
  },

  getSoulPurpose: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-journey/soul-purpose', data);
    return response.data;
  },

  getKarmicLessons: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-journey/karmic-lessons', data);
    return response.data;
  },

  getSoulEvolution: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-journey/soul-evolution', data);
    return response.data;
  },

  getDharmicPath: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-journey/dharmic-path', data);
    return response.data;
  },
};

export const pastLivesAPI = {
  getAnalysis: async (data: BirthDetails) => {
    const response = await api.post('/api/past-lives/analysis', data);
    return response.data;
  },

  getKarmicPatterns: async (data: BirthDetails) => {
    const response = await api.post('/api/past-lives/karmic-patterns', data);
    return response.data;
  },

  getPastRelationships: async (data: BirthDetails) => {
    const response = await api.post('/api/past-lives/past-relationships', data);
    return response.data;
  },

  getTalentsCarriedForward: async (data: BirthDetails) => {
    const response = await api.post('/api/past-lives/talents-carried-forward', data);
    return response.data;
  },

  getPastTraumas: async (data: BirthDetails) => {
    const response = await api.post('/api/past-lives/past-traumas', data);
    return response.data;
  },
};

export const futureLivesAPI = {
  getPrediction: async (data: BirthDetails) => {
    const response = await api.post('/api/future-lives/prediction', data);
    return response.data;
  },

  getEvolutionPath: async (data: BirthDetails) => {
    const response = await api.post('/api/future-lives/evolution-path', data);
    return response.data;
  },

  getMokshaTimeline: async (data: BirthDetails) => {
    const response = await api.post('/api/future-lives/moksha-timeline', data);
    return response.data;
  },

  getFutureMissions: async (data: BirthDetails) => {
    const response = await api.post('/api/future-lives/future-missions', data);
    return response.data;
  },

  getSoulAdvancement: async (data: BirthDetails) => {
    const response = await api.post('/api/future-lives/soul-advancement', data);
    return response.data;
  },
};

export const presentLifeAPI = {
  getComprehensiveAnalysis: async (data: BirthDetails) => {
    const response = await api.post('/api/present-life/comprehensive-analysis', data);
    return response.data;
  },

  getCareerGuidance: async (data: BirthDetails) => {
    const response = await api.post('/api/present-life/career-guidance', data);
    return response.data;
  },

  getRelationshipsAnalysis: async (data: BirthDetails) => {
    const response = await api.post('/api/present-life/relationships', data);
    return response.data;
  },

  getHealthWellness: async (data: BirthDetails) => {
    const response = await api.post('/api/present-life/health-wellness', data);
    return response.data;
  },

  getFinancialProspects: async (data: BirthDetails) => {
    const response = await api.post('/api/present-life/financial-prospects', data);
    return response.data;
  },

  getSpiritualGrowth: async (data: BirthDetails) => {
    const response = await api.post('/api/present-life/spiritual-growth', data);
    return response.data;
  },

  getCurrentDasha: async (data: BirthDetails) => {
    const response = await api.post('/api/present-life/current-dasha', data);
    return response.data;
  },
};

export const lifeEventsAPI = {
  getPrediction: async (data: BirthDetails & { years_ahead?: number }) => {
    const response = await api.post('/api/life-events/prediction', data);
    return response.data;
  },

  getCareerMilestones: async (data: BirthDetails) => {
    const response = await api.post('/api/life-events/career-milestones', data);
    return response.data;
  },

  getRelationshipEvents: async (data: BirthDetails) => {
    const response = await api.post('/api/life-events/relationship-events', data);
    return response.data;
  },

  getFinancialEvents: async (data: BirthDetails) => {
    const response = await api.post('/api/life-events/financial-events', data);
    return response.data;
  },

  getHealthAlerts: async (data: BirthDetails) => {
    const response = await api.post('/api/life-events/health-alerts', data);
    return response.data;
  },

  getSpiritualBreakthroughs: async (data: BirthDetails) => {
    const response = await api.post('/api/life-events/spiritual-breakthroughs', data);
    return response.data;
  },

  getAuspiciousTimings: async (data: BirthDetails) => {
    const response = await api.post('/api/life-events/auspicious-timings', data);
    return response.data;
  },
};

export const karmicRemediesAPI = {
  getComprehensive: async (data: BirthDetails & { challenges?: string[] }) => {
    const response = await api.post('/api/karmic-remedies/comprehensive', data);
    return response.data;
  },

  getMantras: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-remedies/mantras', data);
    return response.data;
  },

  getGemstones: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-remedies/gemstones', data);
    return response.data;
  },

  getRituals: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-remedies/rituals', data);
    return response.data;
  },

  getCharitableActs: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-remedies/charitable-acts', data);
    return response.data;
  },

  getLifestyleModifications: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-remedies/lifestyle-modifications', data);
    return response.data;
  },

  getMeditationPractices: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-remedies/meditation-practices', data);
    return response.data;
  },

  getYantraRecommendations: async (data: BirthDetails) => {
    const response = await api.post('/api/karmic-remedies/yantra-recommendations', data);
    return response.data;
  },
};

export const predictionsAPI = {
  getDaily: async (data: BirthDetails) => {
    const response = await api.post('/api/predictions/daily', data);
    return response.data;
  },

  getWeekly: async (data: BirthDetails) => {
    const response = await api.post('/api/predictions/weekly', data);
    return response.data;
  },

  getMonthly: async (data: BirthDetails) => {
    const response = await api.post('/api/predictions/monthly', data);
    return response.data;
  },

  getYearly: async (data: BirthDetails) => {
    const response = await api.post('/api/predictions/yearly', data);
    return response.data;
  },

  askQuestion: async (data: BirthDetails & { question: string }) => {
    const response = await api.post('/api/predictions/question', data);
    return response.data;
  },
};

// AI Features API
export interface AIMode {
  mode: 'offline' | 'hybrid' | 'conversational';
  consent: boolean;
  consentTimestamp?: string;
}

export interface AIBirthData {
  zodiac_sign?: string;
  nakshatra?: string;
  moon_sign?: string;
  ascendant?: string;
  planetary_positions?: Record<string, any>;
  houses?: string[];
  dasha_period?: string;
  yogas?: string[];
  doshas?: string[];
  elements?: string;
  qualities?: string;
  karmic_number?: number;
}

export interface AIComposeRequest {
  report_section: string;
  birth_data: AIBirthData;
}

export interface AIChatRequest {
  message: string;
  birth_data: AIBirthData;
  conversation_history?: Array<{ role: string; content: string }>;
}

export interface AISummarizeRequest {
  report_data: string;
  birth_data: AIBirthData;
  summary_type?: 'overview' | 'key_insights' | 'action_items' | 'detailed';
}

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
      headers: {
        'X-AI-Consent': 'granted',
        'X-AI-Mode': aiMode.mode
      }
    });
    return response.data;
  },

  /**
   * Chat about astrological report
   * Requires AI consent header
   */
  chat: async (data: AIChatRequest, aiMode: AIMode) => {
    if (!aiMode.consent) {
      throw new Error('AI consent required');
    }
    
    if (aiMode.mode !== 'conversational') {
      throw new Error('Conversational mode required for chat');
    }
    
    const response = await api.post('/api/ai/chat', data, {
      headers: {
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
  summarize: async (data: AISummarizeRequest, aiMode: AIMode) => {
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
  getKarmicJourney: async (data: BirthDetails & { question?: string; force_regenerate?: boolean }) => {
    const response = await api.post('/api/bhrigu-predictions/karmic-journey', data);
    return response.data;
  },

  /**
   * Get Past Lives analysis
   * Explore previous incarnations and karmic patterns
   */
  getPastLives: async (data: BirthDetails & { question?: string; force_regenerate?: boolean }) => {
    const response = await api.post('/api/bhrigu-predictions/past-lives', data);
    return response.data;
  },

  /**
   * Get Future Lives prediction
   * Envision soul's evolution and future incarnations
   */
  getFutureLives: async (data: BirthDetails & { question?: string; force_regenerate?: boolean }) => {
    const response = await api.post('/api/bhrigu-predictions/future-lives', data);
    return response.data;
  },

  /**
   * Get Present Life analysis
   * Comprehensive current life opportunities and challenges
   */
  getPresentLife: async (data: BirthDetails & { question?: string; force_regenerate?: boolean }) => {
    const response = await api.post('/api/bhrigu-predictions/present-life', data);
    return response.data;
  },

  /**
   * Get Life Events prediction
   * Major transitions with precision timing
   */
  getLifeEvents: async (data: BirthDetails & { question?: string; force_regenerate?: boolean }) => {
    const response = await api.post('/api/bhrigu-predictions/life-events', data);
    return response.data;
  },

  /**
   * Get Karmic Remedies
   * Personalized spiritual practices for balance
   */
  getKarmicRemedies: async (data: BirthDetails & { question?: string; force_regenerate?: boolean }) => {
    const response = await api.post('/api/bhrigu-predictions/karmic-remedies', data);
    return response.data;
  },

  /**
   * Get Relationships analysis
   * Soul connections and compatibility
   */
  getRelationships: async (data: BirthDetails & { question?: string; force_regenerate?: boolean }) => {
    const response = await api.post('/api/bhrigu-predictions/relationships', data);
    return response.data;
  },

  /**
   * Get General Predictions
   * Daily, weekly, monthly, yearly forecasts
   */
  getPredictions: async (data: BirthDetails & { question?: string; force_regenerate?: boolean }) => {
    const response = await api.post('/api/bhrigu-predictions/predictions', data);
    return response.data;
  },

  /**
   * Get Comprehensive prediction for ALL categories
   * Complete Bhrigu Samhita analysis covering all 8 aspects
   */
  getComprehensive: async (data: BirthDetails & { force_regenerate?: boolean }) => {
    const response = await api.post('/api/bhrigu-predictions/comprehensive', data);
    return response.data;
  },

  /**
   * Search Bhrigu wisdom database
   * Access accumulated knowledge from previous predictions
   */
  searchWisdom: async (params: {
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
  startSession: async (user_hash?: string) => {
    const response = await api.post('/api/bhrigu-predictions/session/start', { user_hash });
    return response.data;
  },
};
