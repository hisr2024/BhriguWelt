/**
 * Type definitions for offline storage
 */

// API Types for BhriguWelt Backend
export interface BirthDetails {
  date_of_birth: string;
  time_of_birth: string;
  place_of_birth: string;
  latitude?: number;
  longitude?: number;
}

export interface BirthChartAPI {
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

// AI Mode types
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

// Profile types
export interface Profile {
  id?: number;
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Report types
export type ReportType =
  | 'birth-chart'
  | 'karmic-journey'
  | 'past-lives'
  | 'future-lives'
  | 'present-life'
  | 'life-events'
  | 'karmic-remedies'
  | 'daily-prediction'
  | 'weekly-prediction'
  | 'monthly-prediction'
  | 'bhrigu-karmic-journey'
  | 'bhrigu-past-lives'
  | 'bhrigu-future-lives'
  | 'bhrigu-present-life'
  | 'bhrigu-life-events'
  | 'bhrigu-karmic-remedies'
  | 'bhrigu-relationships'
  | 'bhrigu-predictions'
  | 'bhrigu-comprehensive';

export interface Report {
  id?: number;
  profileId: number;
  type: ReportType;
  title: string;
  data: any; // Report-specific data
  generatedAt: string;
  aiMode?: 'offline' | 'hybrid' | 'chatbot';
  createdAt: string;
  updatedAt: string;
}

// Bhrigu Predictions
export interface BhriguPrediction {
  category: string;
  title: string;
  full_analysis: string;
  complete_analysis?: string;
  metadata?: {
    zodiac_sign?: string;
    nakshatra?: string;
    moon_sign?: string;
    ascendant?: string;
    tradition?: string;
    [key: string]: unknown;
  };
  generated_at?: string;
  [key: string]: unknown;
}

// Birth chart data
export interface BirthChart {
  birthDetails: {
    date: string;
    time: string;
    place: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  zodiacSign: string;
  moonSign: string;
  ascendant: string;
  nakshatra: string;
  element: string;
  planets: Record<string, any>;
  houses: string[];
  karmicNumber: number;
  soulNumber: number;
  dashaPeriod: {
    mahaDasha: string;
    yearsRemaining: number;
  };
}

// Karmic Journey data
export interface KarmicJourney {
  soulPurpose: string;
  karmicLessons: string[];
  soulEvolution: string;
  dharmicPath: string;
  karmicDebts: string[];
  soulGroupConnections: string[];
}

// Past Lives data
export interface PastLife {
  era: string;
  location: string;
  role: string;
  significantEvents: string[];
  karmicPatterns: string[];
  carriedTalents: string[];
  unresolvedIssues: string[];
}

// Wisdom Card types
export type WisdomCategory =
  | 'vedic-wisdom'
  | 'spiritual-practice'
  | 'karmic-healing'
  | 'meditation'
  | 'mantras'
  | 'remedies'
  | 'astrology'
  | 'philosophy'
  | 'general';

// Wisdom card structure matching the actual data in wisdom_cards.json
// IDs are strings (e.g., "wc001", "wc002") as defined in the JSON data
export interface WisdomCard {
  id?: string; // String ID matching data structure (e.g., "wc001")
  title: string;
  tradition?: string;
  category: WisdomCategory;
  tags: string[];
  content: string;
  interpretation?: string;
  remedy?: string;
  conditions?: {
    zodiac_signs?: string[];
    elements?: string[];
    planets?: string[];
    nakshatras?: string[];
    houses?: number[];
  };
  priority?: number;
  source?: string;
  author?: string;
  isFavorite?: boolean;
  readCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Settings types
export interface AppSettings {
  key: 'appSettings';
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  aiMode?: 'offline' | 'hybrid' | 'chatbot';
  autoLockTimeout?: number; // in minutes
  biometricEnabled?: boolean;
  notificationsEnabled?: boolean;
  syncEnabled?: boolean;
  lastSyncAt?: string;
  updatedAt: string;
}

// Metadata types
export interface EncryptionMetadata {
  key: 'encryptionSalt' | 'encryptionTest';
  value: string;
  createdAt: string;
}

export interface AppMetadata {
  key: string;
  value: any;
  createdAt: string;
  updatedAt: string;
}

// AI Mode selection
export interface AIModeConfig {
  mode: 'offline' | 'hybrid' | 'chatbot';
  description: string;
  dataTransmission: 'none' | 'minimal' | 'full';
  features: string[];
}

export const AI_MODES: Record<string, AIModeConfig> = {
  offline: {
    mode: 'offline',
    description: 'Pure offline mode - no AI assistance, all calculations local',
    dataTransmission: 'none',
    features: [
      'Birth chart calculations',
      'Traditional Vedic interpretations',
      'Offline wisdom cards',
      'Local report generation',
    ],
  },
  hybrid: {
    mode: 'hybrid',
    description: 'Best of both worlds - local calculations + optional AI insights',
    dataTransmission: 'minimal',
    features: [
      'All offline features',
      'Optional AI-enhanced predictions',
      'Personalized insights (opt-in)',
      'Smart recommendations',
    ],
  },
  chatbot: {
    mode: 'chatbot',
    description: 'Full AI assistant - interactive guidance and explanations',
    dataTransmission: 'full',
    features: [
      'All hybrid features',
      'Interactive AI chatbot',
      'Ask questions about your chart',
      'Personalized guidance',
      'Context-aware recommendations',
    ],
  },
};

// Sync types
export interface SyncStatus {
  lastSync: string | null;
  pendingChanges: number;
  status: 'idle' | 'syncing' | 'error';
  error?: string;
}

// Export types
export interface ExportData {
  version: string;
  exportedAt: string;
  profiles: Profile[];
  reports: Report[];
  wisdomCards: WisdomCard[];
  settings: AppSettings;
}
