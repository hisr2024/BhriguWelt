/**
 * DetailedInterpretationCard - Professional Interpretation Display Component
 *
 * Features:
 * - Expandable sections with smooth animations
 * - Confidence indicators with visual progress bars
 * - Citation displays with sources
 * - Professional typography and spacing
 * - Loading states and error handling
 * - Mobile-responsive design
 *
 * @author BhriguWelt Team
 * @version 2.0.0
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  BookOpen,
  Award,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';

export interface InterpretationSection {
  title: string;
  subtitle?: string;
  content: string;
  wordCount: number;
  confidence: number;
  sources: string[];
  citations: string[];
  keywords: string[];
}

export interface DetailedInterpretationCardProps {
  interpretation: InterpretationSection;
  isExpanded?: boolean;
  onToggle?: () => void;
  index?: number;
  showConfidence?: boolean;
  showSources?: boolean;
  showCitations?: boolean;
  className?: string;
}

export function DetailedInterpretationCard({
  interpretation,
  isExpanded: controlledExpanded,
  onToggle,
  index = 0,
  showConfidence = true,
  showSources = true,
  showCitations = true,
  className = '',
}: DetailedInterpretationCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.9) return 'text-green-400';
    if (confidence >= 0.75) return 'text-blue-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.75) return 'High';
    if (confidence >= 0.6) return 'Moderate';
    return 'Lower';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.75) return <CheckCircle className="w-4 h-4" />;
    if (confidence >= 0.6) return <Info className="w-4 h-4" />;
    return <AlertCircle className="w-4 h-4" />;
  };

  // Animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: index * 0.1,
        ease: 'easeOut',
      },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  const contentVariants = {
    collapsed: {
      height: 0,
      opacity: 0,
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeInOut' },
    },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`
        relative overflow-hidden rounded-2xl border border-white/10
        bg-gradient-to-br from-white/5 to-white/10
        backdrop-blur-xl shadow-xl
        hover:shadow-2xl hover:border-white/20
        transition-all duration-300
        ${className}
      `}
    >
      {/* Header */}
      <button
        onClick={handleToggle}
        className="w-full px-6 py-5 flex items-start justify-between gap-4 text-left hover:bg-white/5 transition-colors duration-200"
        aria-expanded={isExpanded}
        aria-controls={`interpretation-content-${index}`}
      >
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl sm:text-2xl font-display font-bold text-white truncate">
                {interpretation.title}
              </h3>
              {interpretation.subtitle && (
                <p className="text-sm text-white/60 truncate">
                  {interpretation.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Meta Information */}
          <div className="flex flex-wrap gap-3 text-sm text-white/70">
            <span className="flex items-center gap-1">
              <Award className="w-4 h-4" />
              {interpretation.wordCount} words
            </span>

            {showConfidence && interpretation.confidence > 0 && (
              <span className={`flex items-center gap-1 font-medium ${getConfidenceColor(interpretation.confidence)}`}>
                {getConfidenceIcon(interpretation.confidence)}
                {getConfidenceLabel(interpretation.confidence)} Confidence
              </span>
            )}

            {showSources && interpretation.sources.length > 0 && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                {interpretation.sources.length} source{interpretation.sources.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Keywords */}
          {interpretation.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {interpretation.keywords.slice(0, 4).map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0 mt-2">
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronDown className="w-5 h-5 text-white" />
          </motion.div>
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`interpretation-content-${index}`}
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-6">
              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Confidence Bar (if shown) */}
              {showConfidence && interpretation.confidence > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Analysis Confidence</span>
                    <span className={`font-bold ${getConfidenceColor(interpretation.confidence)}`}>
                      {(interpretation.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${interpretation.confidence * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        interpretation.confidence >= 0.9
                          ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                          : interpretation.confidence >= 0.75
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                          : interpretation.confidence >= 0.6
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                          : 'bg-gradient-to-r from-orange-500 to-red-400'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Main Content */}
              <div className="prose prose-invert prose-purple max-w-none">
                <div className="text-white/90 leading-relaxed whitespace-pre-line">
                  {interpretation.content}
                </div>
              </div>

              {/* Citations */}
              {showCitations && interpretation.citations.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Traditional Citations
                  </h4>
                  <div className="space-y-2">
                    {interpretation.citations.map((citation, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="pl-4 border-l-2 border-purple-500/30 py-2"
                      >
                        <p className="text-sm text-white/70 italic">
                          "{citation}"
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {showSources && interpretation.sources.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Sources
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {interpretation.sources.map((source, idx) => (
                      <motion.span
                        key={idx}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 * idx }}
                        className="px-3 py-1.5 text-sm rounded-lg bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        {source}
                      </motion.span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * DetailedInterpretationList - Container for multiple interpretation cards
 */
export interface DetailedInterpretationListProps {
  interpretations: InterpretationSection[];
  expandedIndex?: number;
  onExpandChange?: (index: number) => void;
  showConfidence?: boolean;
  showSources?: boolean;
  showCitations?: boolean;
  className?: string;
}

export function DetailedInterpretationList({
  interpretations,
  expandedIndex,
  onExpandChange,
  showConfidence = true,
  showSources = true,
  showCitations = true,
  className = '',
}: DetailedInterpretationListProps) {
  const [internalExpandedIndex, setInternalExpandedIndex] = useState<number | null>(null);
  const currentExpandedIndex = expandedIndex !== undefined ? expandedIndex : internalExpandedIndex;

  const handleToggle = (index: number) => {
    if (onExpandChange) {
      onExpandChange(index);
    } else {
      setInternalExpandedIndex(currentExpandedIndex === index ? null : index);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {interpretations.map((interpretation, index) => (
        <DetailedInterpretationCard
          key={index}
          interpretation={interpretation}
          isExpanded={currentExpandedIndex === index}
          onToggle={() => handleToggle(index)}
          index={index}
          showConfidence={showConfidence}
          showSources={showSources}
          showCitations={showCitations}
        />
      ))}
    </div>
  );
}

/**
 * InterpretationSkeleton - Loading state component
 */
export function InterpretationSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-white/10 rounded-lg w-3/4" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-6 bg-white/10 rounded-full w-20" />
                <div className="h-6 bg-white/10 rounded-full w-24" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * InterpretationError - Error state component
 */
export interface InterpretationErrorProps {
  message?: string;
  onRetry?: () => void;
}

export function InterpretationError({
  message = 'Failed to load interpretation',
  onRetry,
}: InterpretationErrorProps) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Error Loading Interpretation</h3>
      <p className="text-white/70 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
