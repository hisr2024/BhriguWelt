'use client';

/**
 * CleanPredictionDisplay - Polished, minimal prediction presentation
 * Focuses on clear, precise output without unnecessary narration
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Star,
  Sparkles,
  Eye,
  User,
  Clock,
  Check,
  Copy
} from 'lucide-react';

export interface PredictionSection {
  id: string;
  title: string;
  content: string;
  summary?: string;
  rating?: number;
  icon?: React.ReactNode;
}

export interface CleanPredictionDisplayProps {
  title: string;
  zodiacSign?: string;
  sections: PredictionSection[];
  metadata?: {
    tradition?: string;
    generatedAt?: string;
    confidence?: number;
  };
  viewMode?: 'individual' | 'astrologer';
  className?: string;
}

const RatingDisplay = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${
          i < rating
            ? 'fill-amber-400 text-amber-400'
            : 'text-white/20'
        }`}
      />
    ))}
  </div>
);

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4 text-white/40 hover:text-white/70" />
      )}
    </button>
  );
};

const CollapsibleSection = ({
  section,
  isExpanded,
  onToggle,
  viewMode
}: {
  section: PredictionSection;
  isExpanded: boolean;
  onToggle: () => void;
  viewMode: 'individual' | 'astrologer';
}) => {
  const formatContent = (content: string) => {
    // Clean up any markdown-style formatting for clean display
    return content
      .replace(/^#+\s*/gm, '') // Remove markdown headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markers
      .replace(/^[-*]\s*/gm, '• ') // Convert list markers to bullets
      .trim();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.02]"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {section.icon && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
              {section.icon}
            </div>
          )}
          <div className="text-left">
            <h3 className="font-semibold text-white">{section.title}</h3>
            {section.summary && !isExpanded && (
              <p className="text-sm text-white/60 mt-0.5 line-clamp-1">
                {section.summary}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {section.rating && <RatingDisplay rating={section.rating} />}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-5 h-5 text-white/40" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              {viewMode === 'astrologer' && (
                <div className="flex justify-end mb-2">
                  <CopyButton text={section.content} />
                </div>
              )}
              <div className="text-white/80 leading-relaxed whitespace-pre-line text-sm">
                {formatContent(section.content)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export function CleanPredictionDisplay({
  title,
  zodiacSign,
  sections,
  metadata,
  viewMode = 'individual',
  className = ''
}: CleanPredictionDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(sections[0] ? [sections[0].id] : [])
  );

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(sections.map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 p-5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
              {zodiacSign && (
                <p className="text-white/60 text-sm">{zodiacSign}</p>
              )}
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => {}}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'individual'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Individual
            </button>
            <button
              onClick={() => {}}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'astrologer'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Astrologer
            </button>
          </div>
        </div>

        {/* Metadata */}
        {metadata && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-white/10">
            {metadata.tradition && (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Star className="w-3.5 h-3.5" />
                {metadata.tradition}
              </div>
            )}
            {metadata.generatedAt && (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Clock className="w-3.5 h-3.5" />
                {new Date(metadata.generatedAt).toLocaleDateString()}
              </div>
            )}
            {metadata.confidence !== undefined && (
              <div className="flex items-center gap-2 text-xs text-white/50">
                <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                    style={{ width: `${metadata.confidence}%` }}
                  />
                </div>
                {metadata.confidence}%
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Controls */}
      <div className="flex justify-end gap-2">
        <button
          onClick={expandAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Expand All
        </button>
        <button
          onClick={collapseAll}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          Collapse All
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section, _index) => (
          <CollapsibleSection
            key={section.id}
            section={section}
            isExpanded={expandedSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-xs text-white/40 py-2"
      >
        Based on Bhrigu Samhita & Nadi Jyotisha traditions
      </motion.div>
    </div>
  );
}

/**
 * SimplePredictionCard - For quick, single-category predictions
 */
export interface SimplePredictionCardProps {
  title: string;
  content: string;
  rating?: number;
  icon?: React.ReactNode;
  gradient?: string;
  className?: string;
}

export function SimplePredictionCard({
  title,
  content,
  rating,
  icon,
  gradient = 'from-purple-500/20 to-blue-500/20',
  className = ''
}: SimplePredictionCardProps) {
  const formatContent = (text: string) => {
    return text
      .replace(/^#+\s*/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^[-*]\s*/gm, '• ')
      .trim();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-white/10 bg-dark-card overflow-hidden ${className}`}
    >
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                {icon}
              </div>
            )}
            <h3 className="font-semibold text-white">{title}</h3>
          </div>
          {rating && <RatingDisplay rating={rating} />}
        </div>
        <p className="text-white/75 text-sm leading-relaxed">
          {formatContent(content)}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * CompactPredictionList - For displaying multiple predictions in a list
 */
export interface CompactPredictionListProps {
  predictions: Array<{
    id: string;
    title: string;
    summary: string;
    icon?: React.ReactNode;
  }>;
  onSelect?: (id: string) => void;
  className?: string;
}

export function CompactPredictionList({
  predictions,
  onSelect,
  className = ''
}: CompactPredictionListProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {predictions.map((prediction, index) => (
        <motion.button
          key={prediction.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelect?.(prediction.id)}
          className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10 transition-all text-left group"
        >
          {prediction.icon && (
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              {prediction.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white text-sm">{prediction.title}</h4>
            <p className="text-white/50 text-xs truncate">{prediction.summary}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-white/30 -rotate-90 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      ))}
    </div>
  );
}

export default CleanPredictionDisplay;
