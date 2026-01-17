'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MarkdownRenderer, CompactMarkdownRenderer } from './MarkdownRenderer';
import type { PredictionSection } from '@/lib/predictionParser';

interface PredictionCardProps {
  title: string;
  icon: React.ReactNode;
  summary: string;
  sections: PredictionSection[];
  viewMode: 'layman' | 'astrologer';
  onViewMore?: () => void;
  defaultExpanded?: boolean;
  color?: string;
}

/**
 * PredictionCard Component
 * Displays a beautifully formatted prediction with sections
 */
export function PredictionCard({
  title,
  icon,
  summary,
  sections,
  viewMode,
  onViewMore,
  defaultExpanded = false,
  color = 'purple'
}: PredictionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const colorClasses = {
    purple: {
      border: 'border-purple-500/20',
      hoverBorder: 'hover:border-purple-500/40',
      gradient: 'from-purple-900/20 via-slate-900/40 to-blue-900/20',
      iconGradient: 'from-purple-400 to-purple-600',
      titleGradient: 'from-purple-300 to-blue-400',
      accentText: 'text-purple-300',
      buttonBg: 'bg-purple-600 hover:bg-purple-500',
      shadow: 'hover:shadow-purple-500/20'
    },
    cyan: {
      border: 'border-cyan-500/20',
      hoverBorder: 'hover:border-cyan-500/40',
      gradient: 'from-cyan-900/20 via-slate-900/40 to-blue-900/20',
      iconGradient: 'from-cyan-400 to-cyan-600',
      titleGradient: 'from-cyan-300 to-blue-400',
      accentText: 'text-cyan-300',
      buttonBg: 'bg-cyan-600 hover:bg-cyan-500',
      shadow: 'hover:shadow-cyan-500/20'
    },
    amber: {
      border: 'border-amber-500/20',
      hoverBorder: 'hover:border-amber-500/40',
      gradient: 'from-amber-900/20 via-slate-900/40 to-orange-900/20',
      iconGradient: 'from-amber-400 to-orange-500',
      titleGradient: 'from-amber-300 to-orange-400',
      accentText: 'text-amber-300',
      buttonBg: 'bg-amber-600 hover:bg-amber-500',
      shadow: 'hover:shadow-amber-500/20'
    }
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.purple;

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`group relative overflow-hidden rounded-2xl border ${colors.border} ${colors.hoverBorder}
                  bg-gradient-to-br ${colors.gradient} p-6 shadow-2xl backdrop-blur-sm
                  ${colors.shadow} transition-all duration-300`}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className={`rounded-xl bg-gradient-to-br ${colors.iconGradient} p-3 shadow-lg`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
          <h3 className={`text-2xl font-bold bg-gradient-to-r ${colors.titleGradient}
                         bg-clip-text text-transparent`}>
            {title}
          </h3>
        </div>

        {/* Summary */}
        {summary && summary.trim() !== '' && (
          <div className="mb-4">
            <CompactMarkdownRenderer content={summary} className="text-lg" />
          </div>
        )}

        {/* Section Preview (first 2 sections when collapsed) */}
        {!isExpanded && sections.length > 0 && (
          <div className="space-y-3 mb-4">
            {sections.slice(0, 2).map((section, index) => (
              <div
                key={`${section.key}-${index}`}
                className="rounded-lg bg-white/5 p-4 border border-white/10"
              >
                <h4 className={`mb-2 flex items-center gap-2 font-semibold ${colors.accentText}`}>
                  <span className="text-xs">●</span>
                  {section.title}
                </h4>
                <div className="text-slate-300 text-sm line-clamp-3">
                  <CompactMarkdownRenderer content={section.content} />
                </div>
              </div>
            ))}
            {sections.length > 2 && (
              <p className="text-sm text-slate-400 italic">
                +{sections.length - 2} more section{sections.length - 2 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        {/* All Sections (when expanded) */}
        <AnimatePresence>
          {isExpanded && sections.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 mb-4"
            >
              {sections.map((section, index) => (
                <div
                  key={`${section.key}-${index}`}
                  className="rounded-lg bg-white/5 p-4 border border-white/10"
                >
                  <h4 className={`mb-3 flex items-center gap-2 font-semibold text-lg ${colors.accentText}`}>
                    <span className="text-xs">●</span>
                    {section.title}
                  </h4>
                  <MarkdownRenderer
                    content={section.content}
                    viewMode={viewMode}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {sections.length > 0 && (
            <button
              onClick={toggleExpanded}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg ${colors.buttonBg}
                         py-3 px-4 font-medium text-white transition-all duration-200
                         hover:scale-[1.02] active:scale-[0.98]`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  View Full Analysis
                </>
              )}
            </button>
          )}

          {onViewMore && (
            <button
              onClick={onViewMore}
              className="rounded-lg bg-slate-700/50 hover:bg-slate-700 py-3 px-4
                       font-medium text-white transition-colors border border-slate-600/50"
            >
              Details
            </button>
          )}
        </div>

        {/* Section Count Badge */}
        {sections.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <div className="h-1 w-1 rounded-full bg-slate-400" />
            {sections.length} {sections.length === 1 ? 'section' : 'sections'}
            <div className="h-1 w-1 rounded-full bg-slate-400" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Compact version for grid layouts
 */
export function CompactPredictionCard({
  title,
  icon,
  summary,
  sectionCount = 0,
  onClick,
  color = 'purple'
}: {
  title: string;
  icon: React.ReactNode;
  summary: string;
  sectionCount?: number;
  onClick?: () => void;
  color?: string;
}) {
  const colorClasses = {
    purple: {
      border: 'border-purple-500/20',
      hoverBorder: 'hover:border-purple-500/40',
      gradient: 'from-purple-900/20 to-blue-900/20',
      iconGradient: 'from-purple-400 to-purple-600',
      titleGradient: 'from-purple-300 to-blue-400',
      shadow: 'hover:shadow-purple-500/20'
    },
    cyan: {
      border: 'border-cyan-500/20',
      hoverBorder: 'hover:border-cyan-500/40',
      gradient: 'from-cyan-900/20 to-blue-900/20',
      iconGradient: 'from-cyan-400 to-cyan-600',
      titleGradient: 'from-cyan-300 to-blue-400',
      shadow: 'hover:shadow-cyan-500/20'
    },
    amber: {
      border: 'border-amber-500/20',
      hoverBorder: 'hover:border-amber-500/40',
      gradient: 'from-amber-900/20 to-orange-900/20',
      iconGradient: 'from-amber-400 to-orange-500',
      titleGradient: 'from-amber-300 to-orange-400',
      shadow: 'hover:shadow-amber-500/20'
    }
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.purple;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`cursor-pointer overflow-hidden rounded-xl border ${colors.border} ${colors.hoverBorder}
                  bg-gradient-to-br ${colors.gradient} p-5 shadow-lg backdrop-blur-sm
                  ${colors.shadow} transition-all duration-300`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`rounded-lg bg-gradient-to-br ${colors.iconGradient} p-2.5 shadow-md flex-shrink-0`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <h3 className={`text-lg font-bold bg-gradient-to-r ${colors.titleGradient}
                       bg-clip-text text-transparent line-clamp-2`}>
          {title}
        </h3>
      </div>

      <div className="text-slate-300 text-sm line-clamp-3 mb-3">
        <CompactMarkdownRenderer content={summary} />
      </div>

      {sectionCount > 0 && (
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-slate-400" />
          {sectionCount} {sectionCount === 1 ? 'section' : 'sections'}
        </div>
      )}
    </motion.div>
  );
}
