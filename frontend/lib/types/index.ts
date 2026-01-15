/**
 * BhriguWelt Central Type Definitions
 * Import with: import type { TypeName } from '@/lib/types'
 */

// ============================================================================
// BIRTH CHART TYPES
// ============================================================================

export interface PlanetPosition {
  name: string;
  longitude: number;
  latitude: number;
  speed: number;
  sign: string;
  signLord: string;
  nakshatra: string;
  nakshatraLord: string;
  house: number;
  degree: number;
  minute: number;
  second: number;
  retrograde: boolean;
}

export interface HouseData {
  number: number;
  sign: string;
  signLord: string;
  degree: number;
  cusp: number;
  planets: string[];
}

export interface AspectData {
  planet1: string;
  planet2: string;
  aspect: string;
  aspectType: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile';
  angle: number;
  orb: number;
  applying: boolean;
}

export interface NakshatraData {
  name: string;
  number: number;
  pada: number;
  ruler: string;
  deity: string;
  symbol: string;
  startDegree: number;
  endDegree: number;
}

export interface BirthChartData {
  name?: string;
  dateTime: string;
  timezone: string;
  latitude: number;
  longitude: number;
  planets: PlanetPosition[];
  houses: HouseData[];
  aspects: AspectData[];
  ascendant: string;
  midheaven: string;
  ayanamsa: number;
  moonSign: string;
  sunSign: string;
  nakshatras: NakshatraData[];
  chartType?: 'natal' | 'transit' | 'progression' | 'return';
  calculationMethod?: 'western' | 'vedic';
  houseSystem?: 'placidus' | 'whole-sign' | 'equal' | 'koch';
}

// ============================================================================
// PREDICTION TYPES
// ============================================================================

export interface PredictionSection {
  title: string;
  content: string;
  timestamp?: string;
  confidence?: number;
}

export interface BhriguPrediction {
  id: string;
  userId: string;
  category: string;
  sections: PredictionSection[];
  summary?: string;
  createdAt: string;
  updatedAt: string;
  status: 'generating' | 'partial' | 'complete' | 'error';
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
  };
}

export interface PredictionResponse {
  prediction: BhriguPrediction;
  error?: string;
  remaining?: number;
}

// ============================================================================
// USER & PROFILE TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  latitude: number;
  longitude: number;
  timezone: string;
  gender?: 'male' | 'female' | 'other';
  createdAt: string;
  updatedAt: string;
}

export interface BirthDetails {
  date: string;
  time: string;
  place: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

// ============================================================================
// AI CHAT TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    model?: string;
    tokens?: number;
    context?: string[];
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  context?: BirthChartData;
  createdAt: string;
  updatedAt: string;
}

export interface AIPreferences {
  model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'gemini-pro';
  temperature: number;
  maxTokens: number;
  language: string;
  consentGiven: boolean;
  dataSharing: boolean;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface AnalyticsEvent {
  eventName: string;
  eventCategory: string;
  eventData: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
}

export interface AnalyticsSummary {
  totalEvents: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  topEvents: Array<{
    name: string;
    count: number;
  }>;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  eventsOverTime: ChartDataPoint[];
  categoryBreakdown: ChartDataPoint[];
  userEngagement: ChartDataPoint[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// STORAGE & STATE TYPES
// ============================================================================

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  aiLanguage: string;
  notifications: boolean;
  autoSave: boolean;
  encryptionEnabled: boolean;
  offlineMode: boolean;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  data?: unknown;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  id?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ============================================================================
// FORM & VALIDATION TYPES
// ============================================================================

export interface FormField<T = string> {
  value: T;
  error?: string;
  touched: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
