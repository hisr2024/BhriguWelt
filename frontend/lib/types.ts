/**
 * Type definitions for offline storage
 */

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
  | 'monthly-prediction';

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
  unresolved Issues: string[];
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

export interface WisdomCard {
  id?: number;
  title: string;
  content: string;
  category: WisdomCategory;
  tags: string[];
  source?: string;
  author?: string;
  isFavorite?: boolean;
  readCount?: number;
  createdAt: string;
  updatedAt: string;
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
