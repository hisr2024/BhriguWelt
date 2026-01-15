'use client';

import { Sparkles, TrendingUp } from 'lucide-react';

interface PredictionHeaderProps {
  category: string;
  confidence: number;
  generatedAt?: string;
}

export default function PredictionHeader({
  category,
  confidence,
  generatedAt
}: PredictionHeaderProps) {
  const confidenceColor = confidence >= 0.9
    ? 'from-green-600 to-emerald-600'
    : confidence >= 0.75
    ? 'from-blue-600 to-cyan-600'
    : 'from-purple-600 to-pink-600';

  const confidenceLabel = confidence >= 0.9
    ? 'Very High Confidence'
    : confidence >= 0.75
    ? 'High Confidence'
    : 'Moderate Confidence';

  return (
    <div className={`bg-gradient-to-r ${confidenceColor} rounded-xl p-6 md:p-8 text-white shadow-xl`}>
      {/* Title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {category}
            </h1>
            {generatedAt && (
              <p className="text-sm text-white/80 mt-1">
                Generated {new Date(generatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confidence Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">{confidenceLabel}</span>
          </div>
          <span className="font-bold">{Math.round(confidence * 100)}%</span>
        </div>

        <div className="relative h-2 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
          <div
            className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${confidence * 100}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
