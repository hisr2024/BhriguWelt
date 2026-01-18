/**
 * Prediction Response Normalizer
 *
 * Normalizes various prediction response formats (structured, unstructured, mixed)
 * into a consistent shape for frontend consumption.
 *
 * Handles:
 * - Structured JSON responses with sections map
 * - Free-text responses requiring splitting
 * - Category-specific field mapping (daily/weekly/monthly/yearly)
 * - Fallback synthesis for missing categories
 */

// Telemetry counter for fallback usage
let fallbackCounter = 0;

export interface NormalizedPrediction {
  daily?: string;
  weekly?: string;
  monthly?: string;
  yearly?: string;
  full_analysis?: string;
  sections?: Record<string, string>;
  metadata?: {
    ai_enhanced: boolean;
    source: string;
    fallback_used?: boolean;
  };
}

// Type alias for timeframe-specific string keys
type TimeframeKey = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RawPredictionResponse {
  success?: boolean;
  prediction?: any;
  data?: any;
  sections?: Record<string, string>;
  daily?: string;
  weekly?: string;
  monthly?: string;
  yearly?: string;
  full_analysis?: string;
  metadata?: any;
}

/**
 * Normalize a prediction response from the backend
 *
 * @param response - Raw prediction response from API
 * @returns Normalized prediction with category-specific fields
 */
export function normalizePredictionResponse(response: RawPredictionResponse): NormalizedPrediction {
  if (!response) {
    return getFallbackPrediction();
  }

  // Extract the core prediction data
  const predictionData = response.prediction || response.data || response;

  // Scenario 1: Already has category-specific fields
  if (hasCategorySpecificFields(predictionData)) {
    return {
      daily: predictionData.daily,
      weekly: predictionData.weekly,
      monthly: predictionData.monthly,
      yearly: predictionData.yearly,
      full_analysis: predictionData.full_analysis,
      sections: predictionData.sections,
      metadata: extractMetadata(response),
    };
  }

  // Scenario 2: Has structured sections map
  if (predictionData.sections && typeof predictionData.sections === 'object') {
    return normalizeFromSections(predictionData.sections, response);
  }

  // Scenario 3: Try JSON parsing if string (before treating as plain text)
  if (typeof predictionData === 'string') {
    try {
      const parsed = JSON.parse(predictionData);
      if (parsed.sections) {
        return normalizeFromSections(parsed.sections, response);
      }
      if (hasCategorySpecificFields(parsed)) {
        return {
          ...parsed,
          metadata: extractMetadata(response),
        };
      }
    } catch (e) {
      // Not JSON, treat as text below
    }
  }

  // Scenario 4: Has full_analysis text only
  if (predictionData.full_analysis || typeof predictionData === 'string') {
    return synthesizeFromFullText(
      predictionData.full_analysis || predictionData,
      response
    );
  }

  // Fallback
  logFallbackUsage('prediction_normalization_fallback');
  return {
    full_analysis: JSON.stringify(predictionData),
    metadata: {
      ...extractMetadata(response),
      fallback_used: true,
    },
  };
}

/**
 * Check if prediction has category-specific fields
 */
function hasCategorySpecificFields(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  const hasDaily = 'daily' in data;
  const hasWeekly = 'weekly' in data;
  const hasMonthly = 'monthly' in data;
  const hasYearly = 'yearly' in data;
  return hasDaily || hasWeekly || hasMonthly || hasYearly;
}

/**
 * Normalize from structured sections map
 */
function normalizeFromSections(
  sections: Record<string, string>,
  response: RawPredictionResponse
): NormalizedPrediction {
  const normalized: NormalizedPrediction = {
    sections,
    metadata: extractMetadata(response),
  };

  // Map common section keys to category-specific fields
  const keyMappings = {
    daily: ['daily', 'today', 'daily_forecast', 'day'],
    weekly: ['weekly', 'this_week', 'weekly_forecast', 'week'],
    monthly: ['monthly', 'this_month', 'monthly_forecast', 'month'],
    yearly: ['yearly', 'this_year', 'yearly_forecast', 'year', 'annual'],
  };

  for (const [targetKey, sourceKeys] of Object.entries(keyMappings)) {
    for (const sourceKey of sourceKeys) {
      if (sections[sourceKey]) {
        normalized[targetKey as TimeframeKey] = sections[sourceKey];
        break;
      }
    }
  }

  // If still missing category fields but have full content, synthesize
  if (!normalized.daily && !normalized.weekly && !normalized.monthly && !normalized.yearly) {
    const fullText = Object.values(sections).join('\n\n');
    return synthesizeFromFullText(fullText, response);
  }

  return normalized;
}

/**
 * Synthesize category-specific predictions from full text
 * Uses heuristics to split content by timeframe markers
 */
function synthesizeFromFullText(
  fullText: string,
  response: RawPredictionResponse
): NormalizedPrediction {
  if (!fullText) {
    return getFallbackPrediction();
  }

  logFallbackUsage('synthesis_from_full_text');

  const normalized: NormalizedPrediction = {
    full_analysis: fullText,
    metadata: {
      ...extractMetadata(response),
      fallback_used: true,
    },
  };

  // Try to extract sections using markers
  const sections = extractSectionsByMarkers(fullText);

  if (sections.daily) normalized.daily = sections.daily;
  if (sections.weekly) normalized.weekly = sections.weekly;
  if (sections.monthly) normalized.monthly = sections.monthly;
  if (sections.yearly) normalized.yearly = sections.yearly;

  // If no sections extracted, create generic fallback for each timeframe
  if (!sections.daily && !sections.weekly && !sections.monthly && !sections.yearly) {
    const preview = fullText.slice(0, 500);
    normalized.daily = `Today's insight: ${preview}... (See full analysis)`;
    normalized.weekly = `This week: ${preview}... (See full analysis)`;
    normalized.monthly = `This month: ${preview}... (See full analysis)`;
    normalized.yearly = `This year: ${preview}... (See full analysis)`;
  }

  return normalized;
}

/**
 * Extract sections from full text using timeframe markers
 */
function extractSectionsByMarkers(text: string): Partial<NormalizedPrediction> {
  const sections: Partial<NormalizedPrediction> = {};

  // Define patterns for each timeframe
  const patterns = {
    daily: [
      /##\s*daily/i,
      /##\s*today/i,
      /\n\*\*daily/i,
      /\n\*\*today/i,
      /daily\s*forecast/i,
    ],
    weekly: [
      /##\s*weekly/i,
      /##\s*this\s*week/i,
      /\n\*\*weekly/i,
      /weekly\s*forecast/i,
    ],
    monthly: [
      /##\s*monthly/i,
      /##\s*this\s*month/i,
      /\n\*\*monthly/i,
      /monthly\s*forecast/i,
    ],
    yearly: [
      /##\s*yearly/i,
      /##\s*this\s*year/i,
      /\n\*\*yearly/i,
      /yearly\s*forecast/i,
      /annual/i,
    ],
  };

  for (const [key, regexPatterns] of Object.entries(patterns)) {
    for (const pattern of regexPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Extract content after the marker until next section or end
        const startIndex = match.index! + match[0].length;
        const remainingText = text.slice(startIndex);

        // Find the next section marker or end of text
        const nextSectionMatch = remainingText.match(/\n##\s/);
        const endIndex = nextSectionMatch ? nextSectionMatch.index! : remainingText.length;

        sections[key as TimeframeKey] = remainingText
          .slice(0, endIndex)
          .trim();
        break;
      }
    }
  }

  return sections;
}

/**
 * Extract metadata from response
 */
function extractMetadata(response: RawPredictionResponse): any {
  const metadata = response.metadata || {};
  return {
    ai_enhanced: metadata.ai_enhanced ?? true,
    source: metadata.source || 'openai',
    ...metadata,
  };
}

/**
 * Get fallback prediction for errors
 */
function getFallbackPrediction(): NormalizedPrediction {
  const fallbackText =
    'Your prediction is being prepared. Please try refreshing or generating a new prediction.';

  return {
    daily: fallbackText,
    weekly: fallbackText,
    monthly: fallbackText,
    yearly: fallbackText,
    full_analysis: fallbackText,
    metadata: {
      ai_enhanced: false,
      source: 'fallback',
      fallback_used: true,
    },
  };
}

/**
 * Log telemetry event for fallback usage
 */
function logFallbackUsage(event: string): void {
  fallbackCounter++;

  // Log to console in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(`[Prediction Normalizer] Fallback used: ${event} (count: ${fallbackCounter})`);
  }

  // Send telemetry if Sentry or analytics available
  if (typeof window !== 'undefined') {
    try {
      // Check if analytics or Sentry is available
      if ((window as any).analytics) {
        (window as any).analytics.track('prediction_normalization_fallback', {
          event,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e) {
      // Silently fail telemetry
    }
  }
}

/**
 * Validate normalized prediction has required fields
 */
export function validateNormalizedPrediction(prediction: NormalizedPrediction): boolean {
  if (!prediction) return false;

  // Must have at least one of these fields
  return !!(
    prediction.daily ||
    prediction.weekly ||
    prediction.monthly ||
    prediction.yearly ||
    prediction.full_analysis ||
    (prediction.sections && Object.keys(prediction.sections).length > 0)
  );
}

/**
 * Get prediction for specific timeframe with fallback
 */
export function getPredictionForTimeframe(
  prediction: NormalizedPrediction,
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly'
): string {
  if (!prediction) return '';

  // Try direct field
  if (prediction[timeframe]) {
    return prediction[timeframe]!;
  }

  // Try sections map
  if (prediction.sections) {
    const sectionValue = prediction.sections[timeframe];
    if (sectionValue) return sectionValue;
  }

  // Fallback to full_analysis
  if (prediction.full_analysis) {
    return `${prediction.full_analysis.slice(0, 500)}... (Full analysis available)`;
  }

  return `${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} prediction not available. Please regenerate.`;
}
