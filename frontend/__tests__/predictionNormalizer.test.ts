/**
 * Tests for Prediction Normalizer
 */

import {
  normalizePredictionResponse,
  validateNormalizedPrediction,
  getPredictionForTimeframe,
} from '../lib/predictionNormalizer';

describe('Prediction Normalizer', () => {
  describe('normalizePredictionResponse', () => {
    it('should handle response with category-specific fields', () => {
      const response = {
        success: true,
        prediction: {
          daily: 'Daily prediction text',
          weekly: 'Weekly prediction text',
          monthly: 'Monthly prediction text',
          yearly: 'Yearly prediction text',
        },
        metadata: {
          ai_enhanced: true,
          source: 'openai',
        },
      };

      const normalized = normalizePredictionResponse(response);

      expect(normalized.daily).toBe('Daily prediction text');
      expect(normalized.weekly).toBe('Weekly prediction text');
      expect(normalized.monthly).toBe('Monthly prediction text');
      expect(normalized.yearly).toBe('Yearly prediction text');
      expect(normalized.metadata?.ai_enhanced).toBe(true);
      expect(normalized.metadata?.source).toBe('openai');
    });

    it('should handle response with sections map', () => {
      const response = {
        success: true,
        prediction: {
          sections: {
            daily: 'Daily from sections',
            weekly: 'Weekly from sections',
            monthly: 'Monthly from sections',
            yearly: 'Yearly from sections',
          },
        },
      };

      const normalized = normalizePredictionResponse(response);

      expect(normalized.daily).toBe('Daily from sections');
      expect(normalized.weekly).toBe('Weekly from sections');
      expect(normalized.monthly).toBe('Monthly from sections');
      expect(normalized.yearly).toBe('Yearly from sections');
    });

    it('should handle JSON string response', () => {
      const response = {
        success: true,
        prediction: JSON.stringify({
          daily: 'Daily from JSON',
          weekly: 'Weekly from JSON',
        }),
      };

      const normalized = normalizePredictionResponse(response);

      expect(normalized.daily).toBe('Daily from JSON');
      expect(normalized.weekly).toBe('Weekly from JSON');
    });

    it('should synthesize from full_analysis text', () => {
      const response = {
        success: true,
        prediction: {
          full_analysis: '## Daily\nDaily content here\n\n## Weekly\nWeekly content here',
        },
      };

      const normalized = normalizePredictionResponse(response);

      expect(normalized.full_analysis).toBeTruthy();
      expect(normalized.metadata?.fallback_used).toBe(true);
    });

    it('should handle null/undefined response', () => {
      const normalized = normalizePredictionResponse(null as any);

      expect(normalized.daily).toBeTruthy();
      expect(normalized.metadata?.fallback_used).toBe(true);
    });

    it('should map alternative section key names', () => {
      const response = {
        success: true,
        prediction: {
          sections: {
            today: 'Today content',
            this_week: 'This week content',
            this_month: 'This month content',
            this_year: 'This year content',
          },
        },
      };

      const normalized = normalizePredictionResponse(response);

      expect(normalized.daily).toBe('Today content');
      expect(normalized.weekly).toBe('This week content');
      expect(normalized.monthly).toBe('This month content');
      expect(normalized.yearly).toBe('This year content');
    });
  });

  describe('validateNormalizedPrediction', () => {
    it('should validate prediction with category fields', () => {
      const prediction = {
        daily: 'Some text',
        weekly: 'Some text',
        monthly: 'Some text',
        yearly: 'Some text',
      };

      expect(validateNormalizedPrediction(prediction)).toBe(true);
    });

    it('should validate prediction with full_analysis', () => {
      const prediction = {
        full_analysis: 'Complete analysis text',
      };

      expect(validateNormalizedPrediction(prediction)).toBe(true);
    });

    it('should validate prediction with sections map', () => {
      const prediction = {
        sections: {
          section1: 'Content 1',
          section2: 'Content 2',
        },
      };

      expect(validateNormalizedPrediction(prediction)).toBe(true);
    });

    it('should reject empty prediction', () => {
      expect(validateNormalizedPrediction({} as any)).toBe(false);
      expect(validateNormalizedPrediction(null as any)).toBe(false);
    });
  });

  describe('getPredictionForTimeframe', () => {
    it('should get prediction for specific timeframe', () => {
      const prediction = {
        daily: 'Daily text',
        weekly: 'Weekly text',
        monthly: 'Monthly text',
        yearly: 'Yearly text',
      };

      expect(getPredictionForTimeframe(prediction, 'daily')).toBe('Daily text');
      expect(getPredictionForTimeframe(prediction, 'weekly')).toBe('Weekly text');
      expect(getPredictionForTimeframe(prediction, 'monthly')).toBe('Monthly text');
      expect(getPredictionForTimeframe(prediction, 'yearly')).toBe('Yearly text');
    });

    it('should fallback to sections map', () => {
      const prediction = {
        sections: {
          daily: 'Daily from sections',
        },
      };

      expect(getPredictionForTimeframe(prediction, 'daily')).toBe('Daily from sections');
    });

    it('should fallback to full_analysis', () => {
      const prediction = {
        full_analysis: 'Complete analysis with lots of text'.repeat(50),
      };

      const result = getPredictionForTimeframe(prediction, 'daily');
      expect(result).toContain('Complete analysis');
      expect(result).toContain('(Full analysis available)');
    });

    it('should handle missing prediction', () => {
      const prediction = {};

      const result = getPredictionForTimeframe(prediction, 'daily');
      expect(result).toContain('not available');
    });
  });
});
