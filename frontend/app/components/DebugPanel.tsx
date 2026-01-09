'use client';

import type { BhriguPrediction } from '@/lib/types';

type DebugPanelProps = {
  prediction: BhriguPrediction;
  parsedFromFullAnalysis: Record<string, string>;
};

const DebugPanel = ({ prediction, parsedFromFullAnalysis }: DebugPanelProps) => (
  <div className="mt-8 pt-6 border-t border-red-500/30">
    <div className="bg-gray-900/50 border border-red-500/30 rounded-xl p-6">
      <h3 className="text-xl font-bold text-red-400 mb-4">🔧 Debug Mode - Raw API Response</h3>
      <div className="bg-black/50 rounded-lg p-4 overflow-auto max-h-96">
        <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
          {JSON.stringify(prediction, null, 2)}
        </pre>
      </div>
      <div className="mt-4 text-sm text-gray-400">
        <p className="mb-2">Section Keys Available:</p>
        <div className="flex flex-wrap gap-2">
          {Object.keys(prediction).map((key) => {
            const value = prediction[key as keyof typeof prediction];
            const isLongString = value && typeof value === 'string' && value.length > 100;
            return (
              <span
                key={key}
                className={`px-2 py-1 rounded ${
                  isLongString
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-700/50 text-gray-400'
                }`}
              >
                {key} ({typeof value === 'string' ? value.length : 'N/A'} chars)
              </span>
            );
          })}
        </div>
      </div>
      {/* Show parsed sections if fallback was used */}
      {Object.keys(parsedFromFullAnalysis).length > 0 && (
        <div className="mt-4 text-sm">
          <p className="text-yellow-400 mb-2">Client-side Parsed Sections:</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(parsedFromFullAnalysis).map((key) => (
              <span key={key} className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                {key} ({parsedFromFullAnalysis[key]?.length || 0} chars)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

export default DebugPanel;
