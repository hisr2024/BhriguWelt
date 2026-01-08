import { generatePastLivesPrediction, type PastLivesEngineOptions } from '../engines/pastLivesEngine';
import {
  generateLifeEventsPrediction,
  type LifeEventsMode,
} from '../engines/lifeEventsEngine';

/**
 * Predictions API Client
 * TypeScript client for comprehensive prediction service
 */

import type { AIMode } from '../types';
import {
  generateGeneralPredictions,
  type GeneralPredictionOptions,
} from '../engines/generalPredictionsEngine';
import {
  generateRelationshipsPrediction,
  type RelationshipsEngineOptions,
} from '../engines/relationshipsEngine';

export type PredictionEngine =
  | 'karmic_journey'
  | 'past_lives'
  | 'future_lives'
  | 'present_life'
  | 'life_events'
  | 'karmic_remedies'
  | 'relationships'
  | 'predictions';

export interface BirthData {
  date_of_birth: string; // YYYY-MM-DD
  time_of_birth?: string; // HH:MM
  place_of_birth?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export interface ChartData extends BirthData {
  zodiac_sign?: string;
  moon_sign?: string;
  ascendant?: string;
  nakshatra?: string;
  planets?: Record<string, PlanetPosition>;
  houses?: string[];
  dasha_period?: {
    maha_dasha?: string;
    years_remaining?: number;
    antar_dasha?: string;
  };
}

export interface PlanetPosition {
  sign: string;
  longitude: number;
  latitude?: number;
}

export interface Subcategory {
  title: string;
  content: string;
  data?: any;
}

export interface PredictionResult {
  engine: string;
  title: string;
  success: boolean;
  subcategories: Record<string, Subcategory>;
  ai_synthesis?: string;
  metadata?: PredictionMetadata;
  generated_at?: string;
  mode?: string;
  error?: string;
}

export interface PredictionMetadata {
  engine: string;
  zodiac_sign: string;
  moon_sign: string;
  ascendant: string;
  nakshatra: string;
  ai_enhanced: boolean;
  tradition: string;
  calculation_method: string;
}

export interface GeneralPredictionRequest extends GeneralPredictionOptions {
  useAI?: boolean;
  aiMode?: AIMode;
  language?: string;
}

export interface LifeEventsRequest {
  useAI?: boolean;
  aiMode?: AIMode;
  mode?: LifeEventsMode;
  language?: string;
  cacheTtlMs?: number;
}

export interface DashaTimeline {
  maha_dasha_lord: string;
  start_date: string;
  end_date: string;
  duration_years: number;
  is_current: boolean;
  effects: string;
}

export interface LifeEvent {
  period: string;
  timing: string;
  description: string;
  probability: string;
  remedy?: string;
}

export interface RemedyData {
  mantras: Mantra[];
  gemstones: Gemstone[];
  yantras: Yantra[];
  charity: Charity[];
  rituals: Ritual[];
  lifestyle: LifestylePractice[];
}

export interface Mantra {
  planet: string;
  mantra: string;
  count: string;
  timing: string;
  benefits: string;
}

export interface Gemstone {
  ascendant: string;
  primary_stone: string;
  weight: string;
  metal: string;
  finger: string;
  day_to_wear: string;
  energizing: string;
}

export interface Yantra {
  type: string;
  purpose: string;
  material: string;
  placement: string;
  worship: string;
}

export interface Charity {
  day: string;
  items: string;
  recipients: string;
  planet: string;
}

export interface Ritual {
  ritual: string;
  frequency: string;
  benefits: string;
  when: string;
}

export interface LifestylePractice {
  practice: string;
  frequency: string;
  benefits: string;
  timing: string;
}

export class PredictionsAPI {
  private baseURL: string;
  private apiKey?: string;

  constructor(baseURL: string = '/api', apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  /**
   * Generate prediction for specified engine
   */
  async generatePrediction(
    engine: PredictionEngine,
    birthData: ChartData,
    useAI: boolean = true,
    language: string = 'en'
  ): Promise<PredictionResult> {
    try {
      const response = await fetch(`${this.baseURL}/predictions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify({
          engine,
          birth_data: birthData,
          use_ai: useAI,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data: PredictionResult = await response.json();
      return data;
    } catch (error) {
      console.error('Prediction generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate Karmic Journey prediction
   */
  async getKarmicJourney(birthData: ChartData, useAI: boolean = true): Promise<PredictionResult> {
    return this.generatePrediction('karmic_journey', birthData, useAI);
  }

  /**
   * Generate Karmic Journey prediction using two-phase engine
   */
  async generateKarmicJourney(
    birthData: ChartData,
    options: KarmicJourneyOptions = {}
  ): Promise<PredictionResult> {
    try {
      return await generateKarmicJourneyPrediction(birthData, {
        ...options,
        useAI: options.useAI ?? true,
      });
    } catch (error) {
      console.error('Karmic journey engine failed, falling back to API:', error);
      if (options.useAI ?? true) {
        return this.generatePrediction('karmic_journey', birthData, options.useAI ?? true);
      }
      throw error;
    }
  }

  /**
   * Generate Past Lives analysis
   */
  async getPastLives(birthData: ChartData, useAI: boolean = true): Promise<PredictionResult> {
    return this.generatePrediction('past_lives', birthData, useAI);
  }

  /**
   * Generate Past Lives analysis using two-phase engine
   */
  async generatePastLives(
    birthData: ChartData,
    useAI: boolean = true,
    options: PastLivesEngineOptions = {}
  ): Promise<PredictionResult> {
    return generatePastLivesPrediction(birthData, { ...options, aiEnabled: useAI });
  }

  /**
   * Generate Future Lives prediction
   */
  async getFutureLives(birthData: ChartData, useAI: boolean = true): Promise<PredictionResult> {
    return this.generatePrediction('future_lives', birthData, useAI);
  }

  /**
   * Generate Future Lives prediction using two-phase engine
   */
  async generateFutureLives(
    birthData: ChartData,
    options: { useAI?: boolean; mode?: 'offline' | 'online' | 'hybrid'; language?: string } = {}
  ): Promise<PredictionResult> {
    try {
      const response = await fetch(`${this.baseURL}/predictions/future-lives`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify({
          birth_data: birthData,
          use_ai: options.useAI ?? true,
          mode: options.mode ?? 'offline',
          language: options.language ?? 'en',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data: PredictionResult = await response.json();
      return data;
    } catch (error) {
      console.error('Future lives generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate Present Life analysis
   */
  async getPresentLife(birthData: ChartData, useAI: boolean = true): Promise<PredictionResult> {
    return this.generatePrediction('present_life', birthData, useAI);
  }

  /**
   * Generate Present Life analysis using two-phase engine
   */
  async generatePresentLife(
    birthData: ChartData,
    options: { useAI?: boolean; mode?: 'offline' | 'online' | 'hybrid'; language?: string } = {}
  ): Promise<PredictionResult> {
    try {
      const response = await fetch(`${this.baseURL}/predictions/present-life`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify({
          birth_data: birthData,
          use_ai: options.useAI ?? true,
          mode: options.mode ?? 'offline',
          language: options.language ?? 'en',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data: PredictionResult = await response.json();
      return data;
    } catch (error) {
      console.error('Present life generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate Life Events with timing
   */
  async getLifeEvents(birthData: ChartData, useAI: boolean = true): Promise<PredictionResult> {
    return this.generatePrediction('life_events', birthData, useAI);
  }

  /**
   * Generate Life Events using two-phase precision engine
   */
  async generateLifeEvents(
    birthData: ChartData,
    options: LifeEventsRequest = {}
  ): Promise<PredictionResult> {
    try {
      return await generateLifeEventsPrediction(birthData, {
        mode: options.mode ?? 'offline',
        useAI: options.useAI ?? false,
        language: options.language ?? 'en',
        aiMode: options.aiMode,
        cacheTtlMs: options.cacheTtlMs,
      });
    } catch (error) {
      console.error('Life events engine failed, falling back to API:', error);
      if (options.useAI ?? true) {
        return this.generatePrediction('life_events', birthData, true, options.language ?? 'en');
      }
      throw error;
    }
  }

  /**
   * Generate Karmic Remedies
   */
  async getKarmicRemedies(birthData: ChartData, useAI: boolean = true): Promise<PredictionResult> {
    return this.generateRemedies(birthData, useAI);
  }

  /**
   * Generate Karmic Remedies with two-phase validation
   */
  async generateRemedies(birthData: ChartData, useAI: boolean = true): Promise<PredictionResult> {
    try {
      return await generateRemediesPrediction(birthData, { useAI });
    } catch (error) {
      console.error('Remedies engine failed, falling back to API:', error);
      if (useAI) {
        return this.generatePrediction('karmic_remedies', birthData, useAI);
      }
      throw error;
    }
  }

  /**
   * Generate Relationships analysis
   */
  async getRelationships(birthData: ChartData, useAI: boolean = true): Promise<PredictionResult> {
    return this.generatePrediction('relationships', birthData, useAI);
  }

  /**
   * Generate Relationships analysis using two-phase engine
   */
  async generateRelationships(
    birthData: ChartData,
    options: RelationshipsEngineOptions = {}
  ): Promise<PredictionResult> {
    try {
      return await generateRelationshipsPrediction(birthData, options);
    } catch (error) {
      console.error('Relationships engine failed, falling back to API:', error);
      if (options.useAI ?? true) {
        return this.generatePrediction('relationships', birthData, options.useAI ?? true);
      }
      throw error;
    }
  }

  /**
   * Generate General Predictions
   */
  async getPredictions(birthData: ChartData, useAI: boolean = true): Promise<PredictionResult> {
    return this.generatePrediction('predictions', birthData, useAI);
  }

  /**
   * Generate General Predictions using offline engine with optional AI refinement
   */
  async generateGeneralPredictions(
    birthData: ChartData,
    options: GeneralPredictionRequest = {}
  ): Promise<PredictionResult> {
    const baseResult = await generateGeneralPredictions(birthData, {
      now: options.now,
      locale: options.locale,
    });

    if (!options.useAI || !options.aiMode?.consent) {
      return baseResult;
    }

    try {
      const response = await fetch(`${this.baseURL}/ai/compose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AI-Consent': 'granted',
          'X-AI-Mode': options.aiMode.mode,
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify({
          report_section: 'general_predictions',
          birth_data: {
            zodiac_sign: birthData.zodiac_sign,
            moon_sign: birthData.moon_sign,
            ascendant: birthData.ascendant,
            nakshatra: birthData.nakshatra,
            planetary_positions: birthData.planets,
            houses: birthData.houses,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`AI compose failed: ${response.statusText}`);
      }

      const aiResponse = await response.json();
      const refined = aiResponse?.data?.refined_section;

      return {
        ...baseResult,
        ai_synthesis: refined,
        metadata: baseResult.metadata
          ? { ...baseResult.metadata, ai_enhanced: true }
          : baseResult.metadata,
        mode: options.aiMode.mode,
      };
    } catch (error) {
      console.warn('AI refinement failed, returning offline result:', error);
      return {
        ...baseResult,
        error: baseResult.error ?? 'AI refinement unavailable; offline result provided.',
      };
    }
  }

  /**
   * Get all predictions for a chart
   */
  async getAllPredictions(birthData: ChartData, useAI: boolean = true): Promise<Record<PredictionEngine, PredictionResult>> {
    const engines: PredictionEngine[] = [
      'karmic_journey',
      'past_lives',
      'future_lives',
      'present_life',
      'life_events',
      'karmic_remedies',
      'relationships',
      'predictions',
    ];

    const promises = engines.map(engine =>
      this.generatePrediction(engine, birthData, useAI).catch(error => {
        console.error(`Failed to generate ${engine}:`, error);
        return {
          engine,
          title: `${engine.replace('_', ' ')} Analysis`,
          success: false,
          error: error.message,
          subcategories: {},
        };
      })
    );

    const results = await Promise.all(promises);

    return engines.reduce((acc, engine, index) => {
      acc[engine] = results[index];
      return acc;
    }, {} as Record<PredictionEngine, PredictionResult>);
  }

  /**
   * Calculate birth chart
   */
  async calculateChart(birthData: BirthData): Promise<ChartData> {
    try {
      const response = await fetch(`${this.baseURL}/chart/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify(birthData),
      });

      if (!response.ok) {
        throw new Error(`Chart calculation failed: ${response.statusText}`);
      }

      const data: ChartData = await response.json();
      return data;
    } catch (error) {
      console.error('Chart calculation failed:', error);
      throw error;
    }
  }

  /**
   * Get supported engines
   */
  getSupportedEngines(): PredictionEngine[] {
    return [
      'karmic_journey',
      'past_lives',
      'future_lives',
      'present_life',
      'life_events',
      'karmic_remedies',
      'relationships',
      'predictions',
    ];
  }

  /**
   * Get engine display name
   */
  getEngineDisplayName(engine: PredictionEngine): string {
    const names: Record<PredictionEngine, string> = {
      karmic_journey: 'Karmic Journey & Soul Purpose',
      past_lives: 'Past Lives Analysis',
      future_lives: 'Future Lives Prediction',
      present_life: 'Present Life Analysis',
      life_events: 'Life Events with Timing',
      karmic_remedies: 'Karmic Remedies',
      relationships: 'Relationships & Soul Connections',
      predictions: 'Astrological Predictions',
    };
    return names[engine] || engine;
  }

  /**
   * Get engine description
   */
  getEngineDescription(engine: PredictionEngine): string {
    const descriptions: Record<PredictionEngine, string> = {
      karmic_journey: 'Discover your soul\'s purpose, karmic lessons, and dharmic path',
      past_lives: 'Explore previous incarnations and karmic patterns carried forward',
      future_lives: 'Envision soul evolution and future incarnations',
      present_life: 'Comprehensive analysis of current life and opportunities',
      life_events: 'Predict major transitions with precise Dasha timing',
      karmic_remedies: 'Personalized mantras, gemstones, and spiritual practices',
      relationships: 'Soul connections, compatibility, and partnership guidance',
      predictions: 'Daily, weekly, monthly, and yearly forecasts',
    };
    return descriptions[engine] || '';
  }
}

// Export default instance
export const predictionsAPI = new PredictionsAPI();

// Export utility functions
export const formatPredictionDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export const extractSubcategoryContent = (
  result: PredictionResult,
  subcategoryKey: string
): string => {
  return result.subcategories[subcategoryKey]?.content || '';
};

export const getAllSubcategories = (result: PredictionResult): string[] => {
  return Object.keys(result.subcategories);
};

export const isSuccessful = (result: PredictionResult): boolean => {
  return result.success && !result.error;
};

export const getErrorMessage = (result: PredictionResult): string => {
  return result.error || 'Unknown error occurred';
};
