/**
 * Prediction Engine Types
 * Comprehensive type system for all astrology engines.
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type PredictionMode = 'offline' | 'online' | 'hybrid' | 'auto';

export interface ChartData {
  date_of_birth: string;
  time_of_birth: string;
  place_of_birth: string;
  latitude: number;
  longitude: number;
  zodiac_sign?: string;
  moon_sign?: string;
  ascendant?: string;
  nakshatra?: string;
  houses?: string[];
  planets?: Record<string, { sign: string; longitude: number }>;
}

export interface PredictionMetadata {
  engine: string;
  zodiac_sign: string;
  moon_sign: string;
  ascendant: string;
  nakshatra: string;
  ai_enhanced: boolean;
  tradition: 'Bhrigu Samhita & Nadi Jyotisa';
  calculation_method: string;
}

export interface Subcategory {
  title: string;
  content: string;
  precision?: string;
  tags?: string[];
  data?: Record<string, unknown>;
}

export interface PredictionResult {
  engine: string;
  title: string;
  success: boolean;
  subcategories: Record<string, Subcategory>;
  ai_synthesis?: string;
  metadata: PredictionMetadata;
  generated_at: string;
  mode: PredictionMode;
  error?: string;
}

// ============================================================================
// KARMIC JOURNEY ENGINE TYPES
// ============================================================================

export type KarmicJourneyMode = 'offline' | 'online' | 'hybrid';

export interface KarmicRule {
  id: string;
  tradition: 'Bhrigu Samhita' | 'Nadi Jyotisa';
  text: string;
  tags: string[];
  source: string;
}

export interface KarmicCorpus {
  rules: KarmicRule[];
  summary: string;
  sources: string[];
  warnings: string[];
}

export interface KarmicJourneyNarrative {
  soulPurpose: string;
  karmicLessons: string;
  lifeMission: string;
  precisionNotes: string[];
  ruleRefs: KarmicRule[];
  complianceNote: string;
  aiSynthesis?: string;
}

export interface KarmicJourneyOptions {
  mode?: KarmicJourneyMode;
  useAI?: boolean;
  cacheTTLms?: number;
  language?: string;
  logger?: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;
}

// ============================================================================
// PAST LIVES ENGINE TYPES
// ============================================================================

export type PastLivesMode = 'offline' | 'online' | 'auto';
export type DiveLevel = 'basic' | 'intermediate' | 'comprehensive';

export interface PastLivesRule {
  text: string;
  tags: string[];
  source: string;
}

export interface PastLivesCorpus {
  rules: PastLivesRule[];
  summary: string;
  sources: string[];
}

export interface PastLivesNarrative {
  mostRecent: string;
  karmicPatterns: string;
  reincarnationCycle: string;
  karmicDebts: string;
  carryoverGifts: string;
  unfinishedVows: string;
  healingPath: string;
  aiSynthesis?: string;
}

export interface PastLivesOptions {
  mode?: PastLivesMode;
  aiEnabled?: boolean;
  cacheTTLms?: number;
  logger?: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;
  diveLevel?: DiveLevel;
}

// ============================================================================
// LIFE EVENTS ENGINE TYPES
// ============================================================================

export type LifeEventsMode = 'offline' | 'online' | 'hybrid';

export interface LifeEvent {
  period: string;
  timing: string;
  description: string;
  probability: string;
}

export interface LifeEventRule {
  id: string;
  source: string;
  text: string;
  tags: string[];
}

export interface LifeEventsCorpus {
  rules: LifeEventRule[];
  summaries: string[];
  sources: string[];
}

export interface LifeEventsOptions {
  mode?: LifeEventsMode;
  useAI?: boolean;
  language?: 'en' | 'hi' | 'sa';
  cacheTtlMs?: number;
  aiMode?: { mode: string; consent: boolean };
  logger?: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;
}

// ============================================================================
// RELATIONSHIPS ENGINE TYPES
// ============================================================================

export type RelationshipsMode = 'offline' | 'online' | 'hybrid';

export interface RelationshipRule {
  text: string;
  tags: string[];
  source: string;
}

export interface RelationshipCorpus {
  rules: RelationshipRule[];
  summary: string;
  sources: string[];
}

export interface RelationshipsOptions {
  mode?: RelationshipsMode;
  useAI?: boolean;
  language?: string;
  cacheTtlMs?: number;
  logger?: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>;
}
