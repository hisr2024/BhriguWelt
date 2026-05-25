/**
 * CrystalClearPrediction Component
 *
 * A professional, visually stunning component for displaying AI predictions
 * in a crystal-clear 3-section format with smooth animations and accessibility.
 *
 * Features:
 * - 3-section layout (Summary, Astrological Summary, Remedy)
 * - Soothing color gradients (blue/purple/green)
 * - Smooth Framer Motion animations
 * - Mobile-responsive design
 * - WCAG 2.1 AA accessibility compliance
 * - Loading states and error boundaries
 *
 * @author BhriguWelt Team
 * @version 2.0.0
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Heart,
  Lightbulb,
  Copy,
  Share2,
  Download,
  ChevronDown,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export interface PredictionSection {
  type: 'summary' | 'astrological' | 'remedy';
  title: string;
  content: string;
  icon?: React.ReactNode;
  gradient?: string;
}

export interface CrystalClearPredictionProps {
  prediction: {
    summary: string;
    astrologicalSummary: string;
    remedy: string;
  };
  category?: string;
  confidence?: number;
  loading?: boolean;
  error?: string;
  onCopy?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  className?: string;
}

const SECTION_GRADIENTS = {
  summary: 'from-blue-500/10 via-blue-600/10 to-blue-700/10',
  astrological: 'from-purple-500/10 via-purple-600/10 to-purple-700/10',
  remedy: 'from-green-500/10 via-green-600/10 to-green-700/10',
};

const SECTION_BORDER_COLORS = {
  summary: 'border-blue-500/30',
  astrological: 'border-purple-500/30',
  remedy: 'border-green-500/30',
};

const SECTION_ICONS = {
  summary: <Sparkles className="w-6 h-6" />,
  astrological: <Lightbulb className="w-6 h-6" />,
  remedy: <Heart className="w-6 h-6" />,
};

const SECTION_TITLES = {
  summary: 'Summary',
  astrological: 'Astrological Insights',
  remedy: 'Guidance & Remedies',
};

export default function CrystalClearPrediction({
  prediction,
  category = 'Prediction',
  confidence,
  loading = false,
  error,
  onCopy,
  onShare,
  onDownload,
  className = '',
}: CrystalClearPredictionProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['summary', 'astrological', 'remedy'])
  );
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const toggleSection = (sectionType: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionType)) {
        newSet.delete(sectionType);
      } else {
        newSet.add(sectionType);
      }
      return newSet;
    });
  };

  const handleCopySection = (sectionType: string, content: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content).then(() => {
        setCopiedSection(sectionType);
        setTimeout(() => setCopiedSection(null), 2000);
      });
    }
  };

  const sections: PredictionSection[] = [
    {
      type: 'summary',
      title: SECTION_TITLES.summary,
      content: prediction.summary,
      icon: SECTION_ICONS.summary,
      gradient: SECTION_GRADIENTS.summary,
    },
    {
      type: 'astrological',
      title: SECTION_TITLES.astrological,
      content: prediction.astrologicalSummary,
      icon: SECTION_ICONS.astrological,
      gradient: SECTION_GRADIENTS.astrological,
    },
    {
      type: 'remedy',
      title: SECTION_TITLES.remedy,
      content: prediction.remedy,
      icon: SECTION_ICONS.remedy,
      gradient: SECTION_GRADIENTS.remedy,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`} role="status" aria-live="polite" aria-label="Loading prediction">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border-2 border-white/10 bg-white/5 backdrop-blur-xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 animate-pulse" />
              <div className="flex-1">
                <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-2" />
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-white/10 rounded animate-pulse" />
              <div className="h-4 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-white/10 rounded animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl border-2 border-red-500/30 bg-red-500/10 backdrop-blur-xl p-6 ${className}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-red-300 mb-2">
              Unable to Load Prediction
            </h3>
            <p className="text-red-200/80">{error}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with actions */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-1">
            {category}
          </h2>
          {confidence !== undefined && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-white/70">
                  Confidence: {(confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onCopy && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCopy}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Copy prediction"
            >
              <Copy className="w-5 h-5 text-white" />
            </motion.button>
          )}
          {onShare && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onShare}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Share prediction"
            >
              <Share2 className="w-5 h-5 text-white" />
            </motion.button>
          )}
          {onDownload && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDownload}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Download prediction"
            >
              <Download className="w-5 h-5 text-white" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Prediction Sections */}
      <div className="space-y-4">
        {sections.map((section, index) => {
          const isExpanded = expandedSections.has(section.type);
          const isCopied = copiedSection === section.type;

          return (
            <motion.div
              key={section.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-2xl border-2 ${SECTION_BORDER_COLORS[section.type]} bg-gradient-to-br ${section.gradient} backdrop-blur-xl overflow-hidden`}
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.type)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                aria-expanded={isExpanded}
                aria-controls={`section-${section.type}`}
              >
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ rotate: isExpanded ? 0 : -10 }}
                    transition={{ duration: 0.3 }}
                    className={`p-3 rounded-xl ${
                      section.type === 'summary' ? 'bg-blue-500/20' :
                      section.type === 'astrological' ? 'bg-purple-500/20' :
                      'bg-green-500/20'
                    }`}
                  >
                    <div className={
                      section.type === 'summary' ? 'text-blue-400' :
                      section.type === 'astrological' ? 'text-purple-400' :
                      'text-green-400'
                    }>
                      {section.icon}
                    </div>
                  </motion.div>

                  <div>
                    <h3 className="text-xl font-display font-bold text-white mb-1">
                      {section.title}
                    </h3>
                    <p className="text-sm text-white/60">
                      {isExpanded ? 'Click to collapse' : 'Click to expand'}
                    </p>
                  </div>
                </div>

                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-6 h-6 text-white/60" />
                </motion.div>
              </button>

              {/* Section Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    id={`section-${section.type}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 border-t border-white/10">
                      <div className="mt-6 prose prose-invert max-w-none">
                        <p className="text-white/90 leading-relaxed whitespace-pre-wrap">
                          {section.content}
                        </p>
                      </div>

                      {/* Section Actions */}
                      <div className="mt-4 flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleCopySection(section.type, section.content)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            isCopied
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-white/10 text-white/80 hover:bg-white/20'
                          }`}
                          aria-label={`Copy ${section.title}`}
                        >
                          {isCopied ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span className="text-sm font-medium">Copy</span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-white/50 mt-6"
      >
        <p>This guidance is based on Vedic astrology principles and AI analysis.</p>
        <p className="mt-1">Use your own wisdom and judgment in applying this guidance.</p>
      </motion.div>
    </div>
  );
}
