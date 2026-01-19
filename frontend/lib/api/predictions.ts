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
import { generateRemediesPrediction } from '../engines/remediesEngine';
import {
  generateKarmicJourneyPrediction,
  type KarmicJourneyOptions,
} from '../engines/karmicJourneyEngine';
import { isSectionContentValid } from '../sectionParserConfig';

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

export interface HoroscopeCategoryData {
  rating: number;
  message: string;
  summary?: string;
  key_day?: string;
}

export interface HoroscopeLuckyElements {
  number: number;
  color: string;
  time: string;
  direction: string;
}

export interface HoroscopeResult {
  success: boolean;
  data: {
    date?: string;
    week_start?: string;
    week_end?: string;
    month?: string;
    year?: number;
    zodiac_sign: string;
    prediction?: string;
    daily_prediction?: string;
    weekly_prediction?: string;
    monthly_prediction?: string;
    yearly_prediction?: string;
    overall?: {
      energy: string;
      message: string;
      rating: number;
    };
    sections?: {
      love?: HoroscopeCategoryData;
      career?: HoroscopeCategoryData;
      health?: HoroscopeCategoryData;
      finance?: HoroscopeCategoryData;
      spiritual?: HoroscopeCategoryData;
    };
    ratings?: {
      overall: number;
      love: number;
      career: number;
      health: number;
      finance: number;
    };
    lucky_elements?: HoroscopeLuckyElements;
    daily_mantra?: string;
    bhrigu_guidance?: string;
    weekly_theme?: {
      title: string;
      summary: string;
      focus: string;
    };
    monthly_theme?: {
      title: string;
      summary: string;
      keywords: string[];
    };
    yearly_theme?: {
      title: string;
      summary: string;
      keywords: string[];
      ruling_energy: string;
    };
    quarters?: Array<{
      quarter: number;
      name: string;
      theme: string;
      summary: string;
      focus_areas: string[];
      growth_opportunity: string;
      energy: string;
    }>;
    daily_summaries?: Array<{
      date: string;
      day: string;
      energy: string;
      focus: string;
    }>;
    best_day?: string;
    challenging_day?: string;
    important_dates?: Array<{
      date: string;
      event: string;
      type: string;
    }>;
    power_days?: string[];
    caution_days?: string[];
    key_months?: Array<{
      month: string;
      theme: string;
      energy: string;
    }>;
    monthly_ritual?: {
      name: string;
      timing: string;
      mantra: string;
      offering: string;
      benefit: string;
    };
    annual_ritual?: {
      name: string;
      best_time: string;
      mantra: string;
      ritual: string;
      benefit: string;
    };
  };
  metadata?: {
    timeframe: string;
    zodiac_sign: string;
    moon_sign?: string;
    nakshatra?: string;
    dasha?: string;
    mode: string;
  };
  error?: string;
}

export type PredictionLanguage = 'en' | 'hi' | 'sa';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ViewMode = 'simple' | 'astrologer';

export interface TimePeriodPredictionRequest {
  useAI?: boolean;
  aiMode?: AIMode;
  language?: PredictionLanguage;
  time_period: TimePeriod;
  view_mode: ViewMode;
  mode?: 'online' | 'offline' | 'hybrid';
}

export interface GeneralPredictionRequest extends GeneralPredictionOptions {
  useAI?: boolean;
  aiMode?: AIMode;
  language?: PredictionLanguage;
}

export interface LifeEventsRequest {
  useAI?: boolean;
  aiMode?: AIMode;
  mode?: LifeEventsMode;
  language?: PredictionLanguage;
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

const getClientOnlineHeader = (): Record<string, string> =>
  typeof navigator !== 'undefined'
    ? { 'X-Client-Online': navigator.onLine ? 'true' : 'false' }
    : {};

const createAbortError = (): DOMException => new DOMException('Aborted', 'AbortError');

const sleep = (
  delayMs: number,
  signal?: AbortSignal,
  isCancelled?: () => boolean
): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted || isCancelled?.()) {
      reject(createAbortError());
      return;
    }

    const timeout = setTimeout(() => {
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      resolve();
    }, delayMs);

    const onAbort = (): void => {
      clearTimeout(timeout);
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      reject(createAbortError());
    };

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });

const retryWithBackoff = async (
  operation: (signal: AbortSignal) => Promise<Response>,
  options: {
    retries: number;
    baseDelayMs?: number;
    shouldRetry: (response: Response) => boolean;
    signal?: AbortSignal;
    isCancelled?: () => boolean;
  }
): Promise<Response> => {
  let attempt = 0;
  const fallbackController = options.signal ? null : new AbortController();
  const signal = options.signal ?? fallbackController!.signal;

  while (true) {
    if (signal.aborted || options.isCancelled?.()) {
      throw createAbortError();
    }

    const response = await operation(signal);

    if (!options.shouldRetry(response) || attempt >= options.retries) {
      return response;
    }

    const delayMs = (options.baseDelayMs ?? 500) * 2 ** attempt;
    attempt += 1;
    await sleep(delayMs, options.signal, options.isCancelled);
  }
};

export class PredictionsAPI {
  private baseURL: string;
  private apiKey?: string;
  private predictionAbortController: AbortController | null = null;
  private predictionRequestId = 0;

  constructor(baseURL: string = '/api', apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  private createPredictionRequestContext(cancelPrevious: boolean): {
    controller: AbortController;
    isCancelled: () => boolean;
  } {
    if (cancelPrevious) {
      if (this.predictionAbortController) {
        this.predictionAbortController.abort();
      }
      this.predictionAbortController = new AbortController();
      this.predictionRequestId += 1;
      const requestId = this.predictionRequestId;
      return {
        controller: this.predictionAbortController,
        isCancelled: () => this.predictionRequestId !== requestId,
      };
    }

    return {
      controller: new AbortController(),
      isCancelled: () => false,
    };
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...getClientOnlineHeader(),
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    return headers;
  }

  private async requestPrediction<T>(
    url: string,
    body: Record<string, unknown>,
    {
      cancelPrevious = true,
    }: {
      cancelPrevious?: boolean;
    } = {}
  ): Promise<T> {
    try {
      const { controller, isCancelled } = this.createPredictionRequestContext(cancelPrevious);
      const response = await retryWithBackoff(
        signal =>
          fetch(url, {
            method: 'POST',
            headers: this.buildHeaders(),
            body: JSON.stringify(body),
            signal,
          }),
        {
          retries: 2,
          baseDelayMs: 500,
          shouldRetry: response => response.status === 429 || response.status === 503,
          signal: controller.signal,
          isCancelled,
        }
      );

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        console.error(`API error [${response.status}]: ${errorText}`);
        throw new Error(`API error: ${response.statusText} (${response.status})`);
      }

      return response.json();
    } catch (error) {
      console.error('Request prediction failed:', {
        url,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async generatePredictionWithOptions(
    engine: PredictionEngine,
    birthData: ChartData,
    useAI: boolean = true,
    language: PredictionLanguage = 'en',
    cancelPrevious: boolean = true
  ): Promise<PredictionResult> {
    return this.requestPrediction(
      `${this.baseURL}/predictions/generate`,
      {
        engine,
        birth_data: birthData,
        use_ai: useAI,
        language,
      },
      { cancelPrevious }
    );
  }

  /**
   * Generate prediction for specified engine
   * Implements bulletproof fallback - never throws, always returns structured response
   */
  async generatePrediction(
    engine: PredictionEngine,
    birthData: ChartData,
    useAI: boolean = true,
    language: PredictionLanguage = 'en'
  ): Promise<PredictionResult> {
    try {
      return await this.generatePredictionWithOptions(engine, birthData, useAI, language, true);
    } catch (error) {
      console.error('Prediction generation failed, returning emergency fallback:', error);

      // Emergency fallback - return structured response instead of throwing
      return {
        engine,
        title: this.getEngineDisplayName(engine),
        success: false,
        error: error instanceof Error ? error.message : 'Prediction service temporarily unavailable',
        subcategories: {},
        metadata: {
          engine,
          zodiac_sign: birthData.zodiac_sign || 'Unknown',
          moon_sign: birthData.moon_sign || 'Unknown',
          ascendant: birthData.ascendant || 'Unknown',
          nakshatra: birthData.nakshatra || 'Unknown',
          ai_enhanced: false,
          tradition: 'Bhrigu Samhita & Nadi Jyotisa',
          calculation_method: 'emergency_fallback'
        },
        mode: 'offline',
        generated_at: new Date().toISOString()
      };
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
    options: { useAI?: boolean; mode?: 'offline' | 'online' | 'hybrid'; language?: PredictionLanguage } = {}
  ): Promise<PredictionResult> {
    try {
      return await this.requestPrediction(`${this.baseURL}/predictions/future-lives`, {
        birth_data: birthData,
        use_ai: options.useAI ?? true,
        mode: options.mode ?? 'offline',
        language: options.language ?? 'en',
      });
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
    options: { useAI?: boolean; mode?: 'offline' | 'online' | 'hybrid'; language?: PredictionLanguage } = {}
  ): Promise<PredictionResult> {
    try {
      return await this.requestPrediction(`${this.baseURL}/predictions/present-life`, {
        birth_data: birthData,
        use_ai: options.useAI ?? true,
        mode: options.mode ?? 'offline',
        language: options.language ?? 'en',
      });
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
   * Generate Daily Horoscope - timeframe-specific endpoint
   */
  async getDailyHoroscope(
    birthData: ChartData,
    options: { mode?: 'offline' | 'online' | 'hybrid' } = {}
  ): Promise<HoroscopeResult> {
    try {
      return await this.requestPrediction(`${this.baseURL}/predictions/daily`, {
        date_of_birth: birthData.date_of_birth,
        time_of_birth: birthData.time_of_birth,
        place_of_birth: birthData.place_of_birth,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone,
        mode: options.mode ?? 'hybrid',
        zodiac_sign: birthData.zodiac_sign,
        moon_sign: birthData.moon_sign,
        nakshatra: birthData.nakshatra,
        ascendant: birthData.ascendant,
      });
    } catch (error) {
      console.error('Daily horoscope API failed:', error);
      throw error;
    }
  }

  /**
   * Generate Weekly Horoscope - timeframe-specific endpoint
   */
  async getWeeklyHoroscope(
    birthData: ChartData,
    options: { mode?: 'offline' | 'online' | 'hybrid' } = {}
  ): Promise<HoroscopeResult> {
    try {
      return await this.requestPrediction(`${this.baseURL}/predictions/weekly`, {
        date_of_birth: birthData.date_of_birth,
        time_of_birth: birthData.time_of_birth,
        place_of_birth: birthData.place_of_birth,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone,
        mode: options.mode ?? 'hybrid',
        zodiac_sign: birthData.zodiac_sign,
        moon_sign: birthData.moon_sign,
        nakshatra: birthData.nakshatra,
      });
    } catch (error) {
      console.error('Weekly horoscope API failed:', error);
      throw error;
    }
  }

  /**
   * Generate Monthly Horoscope - timeframe-specific endpoint
   */
  async getMonthlyHoroscope(
    birthData: ChartData,
    options: { mode?: 'offline' | 'online' | 'hybrid' } = {}
  ): Promise<HoroscopeResult> {
    try {
      return await this.requestPrediction(`${this.baseURL}/predictions/monthly`, {
        date_of_birth: birthData.date_of_birth,
        time_of_birth: birthData.time_of_birth,
        place_of_birth: birthData.place_of_birth,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone,
        mode: options.mode ?? 'hybrid',
        zodiac_sign: birthData.zodiac_sign,
        moon_sign: birthData.moon_sign,
        nakshatra: birthData.nakshatra,
      });
    } catch (error) {
      console.error('Monthly horoscope API failed:', error);
      throw error;
    }
  }

  /**
   * Generate Yearly Horoscope - timeframe-specific endpoint
   */
  async getYearlyHoroscope(
    birthData: ChartData,
    options: { mode?: 'offline' | 'online' | 'hybrid' } = {}
  ): Promise<HoroscopeResult> {
    try {
      return await this.requestPrediction(`${this.baseURL}/predictions/yearly`, {
        date_of_birth: birthData.date_of_birth,
        time_of_birth: birthData.time_of_birth,
        place_of_birth: birthData.place_of_birth,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone,
        mode: options.mode ?? 'hybrid',
        zodiac_sign: birthData.zodiac_sign,
        moon_sign: birthData.moon_sign,
        nakshatra: birthData.nakshatra,
        dasha_period: birthData.dasha_period,
      });
    } catch (error) {
      console.error('Yearly horoscope API failed:', error);
      throw error;
    }
  }

  /**
   * Get horoscope for any timeframe
   */
  async getHoroscope(
    birthData: ChartData,
    timeframe: 'today' | 'week' | 'month' | 'year',
    options: { mode?: 'offline' | 'online' | 'hybrid' } = {}
  ): Promise<HoroscopeResult> {
    switch (timeframe) {
      case 'today':
        return this.getDailyHoroscope(birthData, options);
      case 'week':
        return this.getWeeklyHoroscope(birthData, options);
      case 'month':
        return this.getMonthlyHoroscope(birthData, options);
      case 'year':
        return this.getYearlyHoroscope(birthData, options);
      default:
        return this.getDailyHoroscope(birthData, options);
    }
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
          ...getClientOnlineHeader(),
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
      const acceptedRefined = isSectionContentValid(refined) ? refined : null;

      return {
        ...baseResult,
        ai_synthesis: acceptedRefined ?? undefined,
        metadata: baseResult.metadata
          ? { ...baseResult.metadata, ai_enhanced: Boolean(acceptedRefined) }
          : baseResult.metadata,
        mode: acceptedRefined ? options.aiMode.mode : baseResult.mode,
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
   * Generate time-period-specific prediction (daily, weekly, monthly, yearly)
   * with view mode support (simple or astrologer)
   */
  async generateTimePeriodPrediction(
    birthData: ChartData,
    options: TimePeriodPredictionRequest
  ): Promise<PredictionResult> {
    try {
      const response = await this.requestPrediction<{
        status: string;
        data: {
          prediction: string;
          metadata: Record<string, unknown>;
        };
      }>(`${this.baseURL}/predictions/predictions`, {
        date_of_birth: birthData.date_of_birth,
        time_of_birth: birthData.time_of_birth || '12:00',
        place_of_birth: birthData.place_of_birth || 'Unknown',
        timezone: birthData.timezone,
        time_period: options.time_period,
        view_mode: options.view_mode,
        mode: options.mode ?? 'hybrid',
        language: options.language ?? 'en',
      });

      // Transform backend response to PredictionResult format
      const prediction = response?.data?.prediction || '';
      const metadata = response?.data?.metadata || {};

      return {
        engine: 'predictions',
        title: `${options.time_period.charAt(0).toUpperCase() + options.time_period.slice(1)} Forecast`,
        success: true,
        subcategories: {
          [options.time_period]: {
            title: `${options.time_period.charAt(0).toUpperCase() + options.time_period.slice(1)} Forecast`,
            content: prediction,
          },
        },
        metadata: {
          engine: 'predictions',
          zodiac_sign: birthData.zodiac_sign || (metadata.zodiac_sign as string) || 'Unknown',
          moon_sign: birthData.moon_sign || (metadata.moon_sign as string) || 'Unknown',
          ascendant: birthData.ascendant || (metadata.ascendant as string) || 'Unknown',
          nakshatra: birthData.nakshatra || (metadata.nakshatra as string) || 'Unknown',
          ai_enhanced: (metadata.mode as string) === 'online',
          tradition: 'Bhrigu Samhita & Nadi Jyotisha',
          calculation_method: (metadata.source as string) || 'hybrid',
        },
        mode: (metadata.mode as string) || 'hybrid',
        generated_at: (metadata.timestamp as string) || new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Time-period prediction (${options.time_period}) failed:`, error);

      // Return fallback response
      return {
        engine: 'predictions',
        title: `${options.time_period.charAt(0).toUpperCase() + options.time_period.slice(1)} Forecast`,
        success: false,
        error: error instanceof Error ? error.message : 'Prediction service temporarily unavailable',
        subcategories: {},
        metadata: {
          engine: 'predictions',
          zodiac_sign: birthData.zodiac_sign || 'Unknown',
          moon_sign: birthData.moon_sign || 'Unknown',
          ascendant: birthData.ascendant || 'Unknown',
          nakshatra: birthData.nakshatra || 'Unknown',
          ai_enhanced: false,
          tradition: 'Bhrigu Samhita & Nadi Jyotisha',
          calculation_method: 'emergency_fallback',
        },
        mode: 'offline',
        generated_at: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate Daily prediction
   */
  async getDailyPrediction(
    birthData: ChartData,
    viewMode: ViewMode = 'simple',
    language: PredictionLanguage = 'en'
  ): Promise<PredictionResult> {
    return this.generateTimePeriodPrediction(birthData, {
      time_period: 'daily',
      view_mode: viewMode,
      language,
    });
  }

  /**
   * Generate Weekly prediction
   */
  async getWeeklyPrediction(
    birthData: ChartData,
    viewMode: ViewMode = 'simple',
    language: PredictionLanguage = 'en'
  ): Promise<PredictionResult> {
    return this.generateTimePeriodPrediction(birthData, {
      time_period: 'weekly',
      view_mode: viewMode,
      language,
    });
  }

  /**
   * Generate Monthly prediction
   */
  async getMonthlyPrediction(
    birthData: ChartData,
    viewMode: ViewMode = 'simple',
    language: PredictionLanguage = 'en'
  ): Promise<PredictionResult> {
    return this.generateTimePeriodPrediction(birthData, {
      time_period: 'monthly',
      view_mode: viewMode,
      language,
    });
  }

  /**
   * Generate Yearly prediction
   */
  async getYearlyPrediction(
    birthData: ChartData,
    viewMode: ViewMode = 'simple',
    language: PredictionLanguage = 'en'
  ): Promise<PredictionResult> {
    return this.generateTimePeriodPrediction(birthData, {
      time_period: 'yearly',
      view_mode: viewMode,
      language,
    });
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
      this.generatePredictionWithOptions(engine, birthData, useAI, 'en', false).catch(error => {
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
          ...getClientOnlineHeader(),
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
