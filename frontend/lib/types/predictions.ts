/**
 * Enhanced Prediction Type System
 * Strict typing for all prediction-related data structures
 */

export interface PredictionSection {
  id: string;
  title: string;
  content: string;
  confidence?: number;
  metadata?: {
    sources?: string[];
    techniques?: string[];
    timestamp?: string;
  };
}

export interface ParsedPrediction {
  id: string;
  category: string;
  summary: string;
  sections: PredictionSection[];
  confidence: number;
  generatedAt: string;
  metadata?: {
    model?: string;
    version?: string;
    processingTime?: number;
  };
}

export interface RawPrediction {
  summary?: string;
  sections?: Record<string, string> | PredictionSection[];
  confidence?: number;
  [key: string]: unknown;
}

export interface PredictionDisplayProps {
  prediction: RawPrediction | ParsedPrediction | string | null;
  category: string;
  userId?: string;
  onRefresh?: () => void;
  onShare?: (method: ShareMethod) => void;
  onExport?: (format: ExportFormat) => void;
}

export type ShareMethod = 'native' | 'whatsapp' | 'email' | 'copy' | 'twitter';
export type ExportFormat = 'txt' | 'pdf' | 'json' | 'markdown';

export interface ContentCleaningOptions {
  removeIntroductions?: boolean;
  removeTechnicalTerms?: boolean;
  simplifyLanguage?: boolean;
  maxLength?: number;
}
