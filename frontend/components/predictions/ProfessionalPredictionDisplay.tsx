/**
 * ProfessionalPredictionDisplay - Enterprise-grade Prediction Display Component
 *
 * Features:
 * - Expandable sections with smooth animations
 * - Confidence indicators and citation displays
 * - Professional typography and spacing
 * - Mode switching (Online/Offline/Corpus-only)
 * - Regenerate functionality
 * - Export options
 * - Loading states and error handling
 *
 * @author BhriguWelt Team
 * @version 2.0.0
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  Download,
  Share2,
  Printer,
  BookOpen,
  Award,
  Clock,
  CheckCircle,
  Info,
  Globe,
  WifiOff,
  Database,
} from 'lucide-react';
import {
  DetailedInterpretationList,
  InterpretationSkeleton,
  InterpretationError,
  type InterpretationSection,
} from './DetailedInterpretationCard';

export interface PredictionSection {
  title: string;
  subtitle?: string;
  content: string;
  confidence: number;
  sources: string[];
  citations: string[];
  keywords: string[];
}

export interface ProfessionalPredictionDisplayProps {
  title: string;
  sections: PredictionSection[];
  sources: string[];
  mode: 'online' | 'offline' | 'corpus';
  generatedAt: Date;
  totalWordCount?: number;
  confidence?: number;
  onRegenerate?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onPrint?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function ProfessionalPredictionDisplay({
  title,
  sections,
  sources,
  mode,
  generatedAt,
  totalWordCount,
  confidence,
  onRegenerate,
  onExport,
  onShare,
  onPrint,
  isLoading = false,
  error = null,
  className = '',
}: ProfessionalPredictionDisplayProps) {
  const [expandedSection, setExpandedSection] = useState<number>(0);

  // Convert sections to interpretation format
  const interpretations: InterpretationSection[] = sections.map(section => ({
    title: section.title,
    subtitle: section.subtitle,
    content: section.content,
    wordCount: section.content.split(' ').length,
    confidence: section.confidence,
    sources: section.sources,
    citations: section.citations,
    keywords: section.keywords,
  }));

  const getModeIcon = () => {
    switch (mode) {
      case 'online':
        return <Globe className="w-4 h-4" />;
      case 'offline':
        return <WifiOff className="w-4 h-4" />;
      case 'corpus':
        return <Database className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'online':
        return 'AI-Enhanced';
      case 'offline':
        return 'Offline Mode';
      case 'corpus':
        return 'Corpus-Only';
      default:
        return 'Unknown';
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return 'text-green-400';
    if (conf >= 0.75) return 'text-blue-400';
    if (conf >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 animate-pulse" />
            <div className="flex-1">
              <div className="h-6 bg-white/10 rounded w-1/2 mb-2 animate-pulse" />
              <div className="h-4 bg-white/10 rounded w-1/3 animate-pulse" />
            </div>
          </div>
        </div>
        <InterpretationSkeleton count={3} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <InterpretationError
        message={error}
        onRetry={onRegenerate}
      />
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-xl p-6 shadow-xl"
      >
        {/* Title and Mode */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
                {title}
              </h2>
              <div className="flex flex-wrap gap-3 text-sm text-white/70">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10">
                  {getModeIcon()}
                  {getModeLabel()}
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10">
                  <Clock className="w-4 h-4" />
                  {formatDate(generatedAt)}
                </span>
                {totalWordCount && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10">
                    <BookOpen className="w-4 h-4" />
                    {totalWordCount} words
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                aria-label="Regenerate prediction"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
            {onExport && (
              <button
                onClick={onExport}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                aria-label="Export prediction"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
            {onShare && (
              <button
                onClick={onShare}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                aria-label="Share prediction"
              >
                <Share2 className="w-5 h-5" />
              </button>
            )}
            {onPrint && (
              <button
                onClick={onPrint}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 hover:scale-105 active:scale-95"
                aria-label="Print prediction"
              >
                <Printer className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Confidence and Sources */}
        {(confidence !== undefined || sources.length > 0) && (
          <>
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-6" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Overall Confidence */}
              {confidence !== undefined && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70 font-medium">Overall Confidence</span>
                    <span className={`text-sm font-bold ${getConfidenceColor(confidence)}`}>
                      {(confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${confidence * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        confidence >= 0.9
                          ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                          : confidence >= 0.75
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                          : confidence >= 0.6
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                          : 'bg-gradient-to-r from-orange-500 to-red-400'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Sources */}
              {sources.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-white/70 font-medium mb-2">
                    <Award className="w-4 h-4" />
                    <span>Primary Sources ({sources.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((source, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs rounded-full bg-white/10 text-white/80 border border-white/10"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Sections */}
      <DetailedInterpretationList
        interpretations={interpretations}
        expandedIndex={expandedSection}
        onExpandChange={setExpandedSection}
        showConfidence={true}
        showSources={true}
        showCitations={true}
      />

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-center"
      >
        <p className="text-sm text-white/60">
          {mode === 'corpus' && (
            <>
              <Info className="w-4 h-4 inline mr-2" />
              This analysis is based exclusively on traditional Vedic texts and does not use AI generation.
            </>
          )}
          {mode === 'online' && (
            <>
              <CheckCircle className="w-4 h-4 inline mr-2" />
              This analysis combines AI insights with traditional Vedic wisdom for enhanced accuracy.
            </>
          )}
          {mode === 'offline' && (
            <>
              <WifiOff className="w-4 h-4 inline mr-2" />
              This analysis uses locally stored knowledge and traditional calculation methods.
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}

/**
 * Compact Prediction Card - For list views
 */
export interface CompactPredictionCardProps {
  title: string;
  excerpt: string;
  mode: 'online' | 'offline' | 'corpus';
  confidence: number;
  generatedAt: Date;
  onClick?: () => void;
  className?: string;
}

export function CompactPredictionCard({
  title,
  excerpt,
  mode,
  confidence,
  generatedAt,
  onClick,
  className = '',
}: CompactPredictionCardProps) {
  const getModeIcon = () => {
    switch (mode) {
      case 'online':
        return <Globe className="w-3 h-3" />;
      case 'offline':
        return <WifiOff className="w-3 h-3" />;
      case 'corpus':
        return <Database className="w-3 h-3" />;
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 0.9) return 'text-green-400';
    if (conf >= 0.75) return 'text-blue-400';
    if (conf >= 0.6) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        w-full text-left rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4
        hover:bg-white/10 hover:border-white/20 transition-all duration-200
        ${className}
      `}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white mb-1 truncate">{title}</h3>
          <p className="text-sm text-white/70 line-clamp-2">{excerpt}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="flex items-center gap-1">
            {getModeIcon()}
            {mode}
          </span>
          <span>•</span>
          <span className={getConfidenceColor(confidence)}>
            {(confidence * 100).toFixed(0)}%
          </span>
        </div>
        <span className="text-xs text-white/50">
          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(generatedAt)}
        </span>
      </div>
    </motion.button>
  );
}
