'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Clock, Info } from 'lucide-react';
import { parsePrediction, validatePredictionContent } from '@/lib/utils/cleanPredictionContent';
import type { RawPrediction, ParsedPrediction, ShareMethod, ExportFormat } from '@/lib/types/predictions';

import PredictionHeader from './PredictionHeader';
import PredictionSection from './PredictionSection';
import PredictionActions from './PredictionActions';
import { exportPrediction } from '@/lib/utils/exportPrediction';

interface EnhancedPredictionDisplayProps {
  prediction: RawPrediction | ParsedPrediction | string | null;
  category: string;
  onRefresh?: () => void;
}

export default function EnhancedPredictionDisplay({
  prediction,
  category,
  onRefresh
}: EnhancedPredictionDisplayProps) {
  const [parsedData, setParsedData] = useState<ParsedPrediction | null>(null);
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    // If prediction is already a ParsedPrediction, use it directly
    if (prediction && typeof prediction === 'object' && 'sections' in prediction && Array.isArray((prediction as ParsedPrediction).sections)) {
      setParsedData(prediction as ParsedPrediction);

      const validation = validatePredictionContent(prediction as ParsedPrediction);
      if (!validation.isValid) {
        console.warn('Prediction quality issues:', validation.warnings);
      }
      return;
    }

    // Otherwise, parse the raw prediction
    const parsed = parsePrediction(prediction as RawPrediction | string | null, category);
    setParsedData(parsed);

    // Validate content quality
    if (parsed) {
      const validation = validatePredictionContent(parsed);
      if (!validation.isValid) {
        console.warn('Prediction quality issues:', validation.warnings);
      }
    }
  }, [prediction, category]);

  if (!parsedData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Info className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <p className="text-yellow-800 font-medium">No prediction data available</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-4 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Load Prediction
            </button>
          )}
        </div>
      </div>
    );
  }

  const { summary, sections, confidence, generatedAt } = parsedData;

  const handleShare = async (method: ShareMethod) => {
    if (method === 'whatsapp') {
      const text = encodeURIComponent(`${category}\n\n${summary}\n\n${window.location.href}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    } else if (method === 'email') {
      const subject = encodeURIComponent(category);
      const body = encodeURIComponent(`${summary}\n\nView full prediction:\n${window.location.href}`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }
  };

  const handleExport = (format: ExportFormat) => {
    exportPrediction(parsedData, format);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header */}
      <PredictionHeader
        category={category}
        confidence={confidence}
        generatedAt={generatedAt}
      />

      {/* Actions Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PredictionActions
          prediction={parsedData}
          onShare={handleShare}
          onExport={handleExport}
        />

        {sections.length > 0 && (
          <button
            onClick={() => setExpandAll(!expandAll)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
          >
            {expandAll ? 'Collapse All' : 'Expand All'}
          </button>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-600">
          <div className="flex items-start space-x-3 mb-3">
            <AlertCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
            <h2 className="text-xl font-bold text-gray-900">Key Insights</h2>
          </div>
          <div className="max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {summary}
            </p>
          </div>
        </div>
      )}

      {/* Detailed Sections */}
      {sections.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 px-2">
            Detailed Analysis
          </h2>
          {sections.map((section, index) => (
            <PredictionSection
              key={section.id}
              section={section}
              index={index}
              defaultExpanded={expandAll}
            />
          ))}
        </div>
      )}

      {/* Metadata Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>
            Generated on{' '}
            {new Date(generatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {parsedData.metadata?.model && (
          <div className="text-xs text-gray-400">
            Model: {parsedData.metadata.model} v{parsedData.metadata.version}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 print:break-before-page">
        <p className="text-xs text-amber-900 text-center leading-relaxed">
          <strong>Spiritual Guidance:</strong> These predictions are based on ancient Vedic astrology principles
          and are intended for self-reflection and spiritual growth. They should not replace professional advice
          for important life decisions.
        </p>
      </div>
    </div>
  );
}
