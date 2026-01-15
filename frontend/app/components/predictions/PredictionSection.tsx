'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Circle } from 'lucide-react';
import type { PredictionSection as PredictionSectionType } from '@/lib/types/predictions';

interface PredictionSectionProps {
  section: PredictionSectionType;
  defaultExpanded?: boolean;
  index: number;
}

export default function PredictionSection({
  section,
  defaultExpanded = false,
  index
}: PredictionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const gradientColors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
  ];

  const gradient = gradientColors[index % gradientColors.length];

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors group"
        aria-expanded={isExpanded}
        aria-controls={`section-content-${section.id}`}
      >
        <div className="flex items-center space-x-4 flex-1">
          {/* Gradient Circle Indicator */}
          <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${gradient} flex-shrink-0 group-hover:scale-110 transition-transform`} />

          {/* Title */}
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
            {section.title}
          </h3>
        </div>

        {/* Expand/Collapse Icon */}
        <div className="ml-4 flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div
          id={`section-content-${section.id}`}
          className="px-6 pb-6 pt-2 animate-fadeIn"
        >
          <div className="max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {section.content}
            </p>
          </div>

          {/* Confidence Badge (if available) */}
          {section.confidence && (
            <div className="mt-4 inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
              <Circle className="w-3 h-3 fill-current" />
              <span>{Math.round(section.confidence * 100)}% confidence</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
