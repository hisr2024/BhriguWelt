/**
 * Offline Prediction Coordinator
 * Comprehensive engine that coordinates all prediction engines for offline-first predictions
 * Integrates with Bhrigu Samhita and Nadi Jyotisha wisdom
 */

import type { ChartData, PredictionResult } from '@/lib/api/predictions';

// Import all prediction engines
import { generateKarmicJourneyPredictions } from './karmicJourneyEngine';
import { generatePastLivesPredictions } from './pastLivesEngine';
import { generateFutureLivesPredictions } from './futureLivesEngine';
import { generatePresentLifePredictions } from './presentLifeEngine';
import { generateLifeEventsPredictions } from './lifeEventsEngine';
import { generateRelationshipsPredictions } from './relationshipsEngine';
import { generateRemediesPredictions } from './remediesEngine';
import { generateGeneralPredictions } from './generalPredictionsEngine';

export interface ComprehensivePredictions {
  karmicJourney: PredictionResult;
  pastLives: PredictionResult;
  futureLives: PredictionResult;
  presentLife: PredictionResult;
  lifeEvents: PredictionResult;
  relationships: PredictionResult;
  remedies: PredictionResult;
  general: PredictionResult;
  horoscope: {
    daily: string;
    weekly: string;
    monthly: string;
    yearly: string;
  };
  analytics: {
    strengths: string[];
    challenges: string[];
    opportunities: string[];
    karmaScore: number;
    dharmaScore: number;
    mokshaScore: number;
  };
}

export interface CoordinatorOptions {
  mode?: 'offline' | 'online' | 'hybrid';
  useAI?: boolean;
  cacheTTLms?: number;
  language?: string;
  includeAnalytics?: boolean;
}

const DEFAULT_OPTIONS: CoordinatorOptions = {
  mode: 'offline',
  useAI: false,
  cacheTTLms: 30 * 60 * 1000, // 30 minutes
  language: 'en',
  includeAnalytics: true,
};

/**
 * Generate comprehensive predictions using all engines
 */
export async function generateComprehensivePredictions(
  chartData: ChartData,
  options: CoordinatorOptions = {}
): Promise<ComprehensivePredictions> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  console.log('[OfflinePredictionCoordinator] Generating comprehensive predictions...');

  try {
    // Run all engines in parallel for maximum performance
    const [
      karmicJourney,
      pastLives,
      futureLives,
      presentLife,
      lifeEvents,
      relationships,
      remedies,
      general,
    ] = await Promise.all([
      generateKarmicJourneyPredictions(chartData, { mode: opts.mode, useAI: opts.useAI }),
      generatePastLivesPredictions(chartData, { mode: opts.mode, useAI: opts.useAI }),
      generateFutureLivesPredictions(chartData, { mode: opts.mode, useAI: opts.useAI }),
      generatePresentLifePredictions(chartData, { mode: opts.mode, useAI: opts.useAI }),
      generateLifeEventsPredictions(chartData, { mode: opts.mode, useAI: opts.useAI }),
      generateRelationshipsPredictions(chartData, { mode: opts.mode, useAI: opts.useAI }),
      generateRemediesPredictions(chartData, { mode: opts.mode, useAI: opts.useAI }),
      generateGeneralPredictions(chartData, { mode: opts.mode, useAI: opts.useAI }),
    ]);

    // Generate horoscope predictions
    const horoscope = generateHoroscopePredictions(chartData, presentLife, lifeEvents);

    // Generate analytics if requested
    const analytics = opts.includeAnalytics
      ? generateAnalytics(chartData, {
          karmicJourney,
          pastLives,
          futureLives,
          presentLife,
          lifeEvents,
          relationships,
          remedies,
          general,
        })
      : getDefaultAnalytics();

    console.log('[OfflinePredictionCoordinator] All predictions generated successfully');

    return {
      karmicJourney,
      pastLives,
      futureLives,
      presentLife,
      lifeEvents,
      relationships,
      remedies,
      general,
      horoscope,
      analytics,
    };
  } catch (error) {
    console.error('[OfflinePredictionCoordinator] Error generating predictions:', error);
    throw error;
  }
}

/**
 * Generate horoscope predictions for different time periods
 */
function generateHoroscopePredictions(
  chartData: ChartData,
  presentLife: PredictionResult,
  lifeEvents: PredictionResult
): ComprehensivePredictions['horoscope'] {
  // Extract current dasha information
  const currentDasha = chartData.vimshottari_dasha?.current_dasha || {};
  const dashaPlanet = currentDasha.maha_dasha || 'Unknown';

  // Get Moon sign and Nakshatra for daily predictions
  const moonSign = chartData.moon_sign || 'Unknown';
  const nakshatra = chartData.nakshatra || 'Unknown';

  // Daily prediction based on Moon and current planetary transits
  const daily = generateDailyPrediction(chartData, moonSign, nakshatra);

  // Weekly prediction based on current dasha
  const weekly = generateWeeklyPrediction(chartData, dashaPlanet);

  // Monthly prediction based on life events engine
  const monthly = generateMonthlyPrediction(chartData, lifeEvents);

  // Yearly prediction based on present life engine
  const yearly = generateYearlyPrediction(chartData, presentLife);

  return { daily, weekly, monthly, yearly };
}

function generateDailyPrediction(chartData: ChartData, moonSign: string, nakshatra: string): string {
  const predictions = {
    Aries: 'Today brings opportunities for new beginnings. Your natural leadership shines through. Focus on initiating projects.',
    Taurus: 'A day for consolidation and enjoying comforts. Financial matters favor you. Trust your practical instincts.',
    Gemini: 'Communication flows effortlessly today. Network and share ideas. Your curiosity leads to discoveries.',
    Cancer: 'Emotional connections deepen. Family matters require attention. Trust your intuition in relationships.',
    Leo: 'Your creative energy is at its peak. Take center stage. Recognition comes your way naturally.',
    Virgo: 'Focus on details and organization. Health and service activities favor you. Refine your skills.',
    Libra: 'Harmony in relationships is emphasized. Aesthetic pursuits bring joy. Balance is key today.',
    Scorpio: 'Transformation and deep insights emerge. Trust your power. Research and investigation favor you.',
    Sagittarius: 'Expansion and learning opportunities arise. Travel or education may call. Embrace adventure.',
    Capricorn: 'Career and responsibilities take focus. Your discipline pays off. Structure brings success.',
    Aquarius: 'Innovation and community connections strengthen. Your unique perspective matters. Embrace originality.',
    Pisces: 'Spiritual insights and compassion flow. Creative imagination heightens. Trust your dreams.',
  };

  return predictions[moonSign as keyof typeof predictions] ||
    'Cosmic energies are aligning in your favor. Stay open to the guidance of the universe.';
}

function generateWeeklyPrediction(chartData: ChartData, dashaPlanet: string): string {
  const dashaThemes = {
    Sun: 'This week emphasizes leadership, vitality, and self-expression. Your confidence attracts opportunities. Focus on personal goals and creative projects.',
    Moon: 'Emotional awareness and intuition guide you this week. Nurture relationships and trust your feelings. Home and family matters gain importance.',
    Mars: 'Action and courage define this week. Take initiative on challenging projects. Physical activity and assertive communication bring results.',
    Mercury: 'Communication, learning, and trade dominate. Network actively and refine your skills. Business transactions and intellectual pursuits favor you.',
    Jupiter: 'Wisdom and expansion characterize this week. Seek mentorship and embrace growth. Spiritual practices and education bring fulfillment.',
    Venus: 'Harmony, relationships, and beauty take focus. Artistic endeavors flourish. Social connections and romantic opportunities emerge.',
    Saturn: 'Discipline and responsibility guide you. Structure your efforts for long-term success. Patience and endurance are rewarded.',
    Rahu: 'Unconventional approaches and innovation lead the way. Embrace change and new perspectives. Technology and modern methods favor you.',
    Ketu: 'Detachment and spiritual insights emerge. Let go of what no longer serves. Inner clarity and meditation bring peace.',
  };

  return dashaThemes[dashaPlanet as keyof typeof dashaThemes] ||
    'This week brings a blend of opportunities and lessons. Stay aligned with your dharma and trust the cosmic timing.';
}

function generateMonthlyPrediction(chartData: ChartData, lifeEvents: PredictionResult): string {
  // Extract key themes from life events
  const themes = [];

  if (chartData.houses && chartData.houses[9]) {
    themes.push('spiritual growth and higher learning');
  }
  if (chartData.houses && chartData.houses[10]) {
    themes.push('career advancement and public recognition');
  }

  const themeText = themes.length > 0 ? themes.join(' and ') : 'personal development';

  return `This month brings focus on ${themeText}. Key life events may unfold in areas of ${
    chartData.ascendant || 'your chart'
  }. The planets support your evolution. Stay aligned with your higher purpose and take inspired action. Opportunities for growth appear in unexpected ways.`;
}

function generateYearlyPrediction(chartData: ChartData, presentLife: PredictionResult): string {
  const ascendant = chartData.ascendant || 'Unknown';
  const currentYear = new Date().getFullYear();

  const yearlyThemes = {
    Aries: 'A year of bold initiatives and leadership. Your pioneering spirit opens new paths.',
    Taurus: 'Financial stability and material growth mark this year. Build lasting foundations.',
    Gemini: 'Communication and learning expand. Your network grows significantly.',
    Cancer: 'Emotional depth and family connections strengthen. Home becomes a sanctuary.',
    Leo: 'Creative expression and recognition flourish. Your light shines brightly.',
    Virgo: 'Service and refinement bring fulfillment. Health and skills improve markedly.',
    Libra: 'Partnerships and balance define the year. Collaboration brings success.',
    Scorpio: 'Transformation and deep healing occur. Your power intensifies.',
    Sagittarius: 'Expansion and wisdom seeking characterize the year. Travel and education beckon.',
    Capricorn: 'Career achievement and authority grow. Your efforts bear substantial fruit.',
    Aquarius: 'Innovation and community impact expand. Your vision manifests.',
    Pisces: 'Spiritual evolution and compassion deepen. Creative dreams become reality.',
  };

  const theme = yearlyThemes[ascendant as keyof typeof yearlyThemes] ||
    'This year brings significant evolution and growth opportunities.';

  return `${currentYear} - ${theme} The planetary cycles support your soul's journey. Major life themes include personal transformation, relationship evolution, and karmic completion. Stay true to your dharma and embrace the lessons offered. This year sets the stage for your next chapter.`;
}

/**
 * Generate analytics from all prediction results
 */
function generateAnalytics(
  chartData: ChartData,
  predictions: Omit<ComprehensivePredictions, 'horoscope' | 'analytics'>
): ComprehensivePredictions['analytics'] {
  const strengths: string[] = [];
  const challenges: string[] = [];
  const opportunities: string[] = [];

  // Analyze planetary strengths
  const planets = chartData.planets || [];
  planets.forEach((planet: any) => {
    if (planet.is_exalted) {
      strengths.push(`${planet.name} in exaltation brings exceptional ${getPlanetTheme(planet.name)}`);
    }
    if (planet.is_debilitated) {
      challenges.push(`${planet.name} debilitated requires attention in ${getPlanetTheme(planet.name)}`);
    }
    if (planet.is_retrograde) {
      opportunities.push(`${planet.name} retrograde offers deep introspection in ${getPlanetTheme(planet.name)}`);
    }
  });

  // Calculate karma score (0-100)
  const karmaScore = calculateKarmaScore(chartData, predictions);

  // Calculate dharma score (0-100)
  const dharmaScore = calculateDharmaScore(chartData, predictions);

  // Calculate moksha score (0-100)
  const mokshaScore = calculateMokshaScore(chartData, predictions);

  return {
    strengths: strengths.length > 0 ? strengths : ['Strong foundation for growth'],
    challenges: challenges.length > 0 ? challenges : ['Minor obstacles to overcome'],
    opportunities: opportunities.length > 0 ? opportunities : ['Potential for transformation'],
    karmaScore,
    dharmaScore,
    mokshaScore,
  };
}

function getPlanetTheme(planet: string): string {
  const themes: Record<string, string> = {
    Sun: 'leadership and vitality',
    Moon: 'emotions and intuition',
    Mars: 'action and courage',
    Mercury: 'communication and intellect',
    Jupiter: 'wisdom and expansion',
    Venus: 'love and harmony',
    Saturn: 'discipline and responsibility',
    Rahu: 'innovation and ambition',
    Ketu: 'spirituality and detachment',
  };
  return themes[planet] || 'personal development';
}

function calculateKarmaScore(chartData: ChartData, predictions: any): number {
  let score = 50; // Base score

  // Analyze 6th house (karmic debts)
  if (chartData.houses && chartData.houses[5]) {
    score += 10;
  }

  // Analyze Saturn (karma)
  const saturn = chartData.planets?.find((p: any) => p.name === 'Saturn');
  if (saturn) {
    if (saturn.house === 10 || saturn.house === 1) score += 15;
    if (saturn.is_retrograde) score -= 10;
  }

  // Analyze Rahu-Ketu axis
  const rahu = chartData.planets?.find((p: any) => p.name === 'Rahu');
  if (rahu && (rahu.house === 6 || rahu.house === 8 || rahu.house === 12)) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateDharmaScore(chartData: ChartData, predictions: any): number {
  let score = 50; // Base score

  // Analyze 9th house (dharma)
  if (chartData.houses && chartData.houses[8]) {
    score += 15;
  }

  // Analyze Jupiter (dharma)
  const jupiter = chartData.planets?.find((p: any) => p.name === 'Jupiter');
  if (jupiter) {
    if (jupiter.is_exalted) score += 20;
    if (jupiter.house === 9 || jupiter.house === 1) score += 15;
  }

  // Analyze Sun (soul purpose)
  const sun = chartData.planets?.find((p: any) => p.name === 'Sun');
  if (sun && (sun.house === 10 || sun.house === 9)) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateMokshaScore(chartData: ChartData, predictions: any): number {
  let score = 50; // Base score

  // Analyze 12th house (moksha)
  if (chartData.houses && chartData.houses[11]) {
    score += 15;
  }

  // Analyze Ketu (spiritual liberation)
  const ketu = chartData.planets?.find((p: any) => p.name === 'Ketu');
  if (ketu) {
    if (ketu.house === 12 || ketu.house === 9) score += 20;
    if (ketu.house === 8) score += 15;
  }

  // Analyze Moon (spiritual awareness)
  const moon = chartData.planets?.find((p: any) => p.name === 'Moon');
  if (moon && (moon.house === 12 || moon.house === 9)) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

function getDefaultAnalytics(): ComprehensivePredictions['analytics'] {
  return {
    strengths: ['Natural resilience', 'Intuitive wisdom', 'Strong foundation'],
    challenges: ['Growth opportunities', 'Learning experiences', 'Character building'],
    opportunities: ['Transformation potential', 'Spiritual evolution', 'Life mastery'],
    karmaScore: 60,
    dharmaScore: 65,
    mokshaScore: 55,
  };
}

/**
 * Generate quick daily horoscope (lightweight version)
 */
export function generateQuickDailyHoroscope(moonSign: string): string {
  return generateDailyPrediction({} as ChartData, moonSign, '');
}

/**
 * Export prediction results to JSON
 */
export function exportPredictions(predictions: ComprehensivePredictions): string {
  return JSON.stringify(predictions, null, 2);
}

/**
 * Get prediction summary for quick overview
 */
export function getPredictionSummary(predictions: ComprehensivePredictions): string {
  return `
=== Bhrigu Welt Comprehensive Predictions ===

KARMIC JOURNEY: ${predictions.karmicJourney.summary}
PRESENT LIFE: ${predictions.presentLife.summary}
LIFE EVENTS: ${predictions.lifeEvents.summary}
RELATIONSHIPS: ${predictions.relationships.summary}

ANALYTICS:
- Karma Score: ${predictions.analytics.karmaScore}/100
- Dharma Score: ${predictions.analytics.dharmaScore}/100
- Moksha Score: ${predictions.analytics.mokshaScore}/100

STRENGTHS: ${predictions.analytics.strengths.join(', ')}
OPPORTUNITIES: ${predictions.analytics.opportunities.join(', ')}

HOROSCOPE:
Today: ${predictions.horoscope.daily.substring(0, 100)}...
This Year: ${predictions.horoscope.yearly.substring(0, 100)}...
  `.trim();
}
