'use client';

import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ReactNode, useState, useRef } from 'react';
import {
  ChevronDown, Share2, Download, Bookmark,
  BookmarkCheck, Copy, Check, Sparkles, Eye, EyeOff
} from 'lucide-react';
import GenZButton from './GenZButton';

// Section accordion for mobile predictions
interface MobilePredictionSectionProps {
  title: string;
  icon?: ReactNode;
  color?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  badge?: string;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

export function MobilePredictionSection({
  title,
  icon,
  color = 'cyan',
  children,
  defaultExpanded = false,
  badge,
  onBookmark,
  isBookmarked = false,
}: MobilePredictionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const colorVariants: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    cyan: {
      bg: 'from-cyan-500/20 to-cyan-600/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-400',
      glow: 'shadow-[0_0_20px_rgba(0,217,255,0.2)]',
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-600/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    },
    pink: {
      bg: 'from-pink-500/20 to-pink-600/10',
      border: 'border-pink-500/30',
      text: 'text-pink-400',
      glow: 'shadow-[0_0_20px_rgba(236,72,153,0.2)]',
    },
    amber: {
      bg: 'from-amber-500/20 to-amber-600/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    },
    emerald: {
      bg: 'from-emerald-500/20 to-emerald-600/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]',
    },
    indigo: {
      bg: 'from-indigo-500/20 to-indigo-600/10',
      border: 'border-indigo-500/30',
      text: 'text-indigo-400',
      glow: 'shadow-[0_0_20px_rgba(99,102,241,0.2)]',
    },
    rose: {
      bg: 'from-rose-500/20 to-rose-600/10',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.2)]',
    },
  };

  const variant = colorVariants[color] || colorVariants.cyan!;

  return (
    <motion.div
      className={`rounded-2xl border ${variant.border} bg-dark-surface/50 backdrop-blur-xl overflow-hidden mb-4 ${
        isExpanded ? variant.glow : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <button
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(5);
          setIsExpanded(!isExpanded);
        }}
        className="w-full flex items-center gap-3 p-4 text-left touch-manipulation"
      >
        {/* Icon */}
        {icon && (
          <motion.div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${variant.bg} flex items-center justify-center ${variant.text}`}
            animate={{ rotate: isExpanded ? 5 : 0 }}
          >
            {icon}
          </motion.div>
        )}

        {/* Title and badge */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate">{title}</h3>
          {badge && (
            <span className="text-xs text-white/50">{badge}</span>
          )}
        </div>

        {/* Bookmark button */}
        {onBookmark && (
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              if (navigator.vibrate) navigator.vibrate(10);
              onBookmark();
            }}
            className={`p-2 rounded-lg ${isBookmarked ? variant.text : 'text-white/40'} hover:bg-white/5`}
            whileTap={{ scale: 0.9 }}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-5 h-5" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </motion.button>
        )}

        {/* Expand indicator */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-white/40"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-4 pb-4 border-t border-white/10 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Quick action bar for predictions
interface PredictionActionsProps {
  onShare?: () => void;
  onDownload?: () => void;
  onCopy?: () => void;
  onToggleReadMode?: () => void;
  isReadMode?: boolean;
}

export function PredictionActions({
  onShare,
  onDownload,
  onCopy,
  onToggleReadMode,
  isReadMode = false,
}: PredictionActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (onCopy) {
      onCopy();
      setCopied(true);
      if (navigator.vibrate) navigator.vibrate([10, 50, 10]);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center gap-2 p-3 bg-dark-surface/50 backdrop-blur-xl rounded-2xl border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {onToggleReadMode && (
        <motion.button
          onClick={onToggleReadMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
            isReadMode
              ? 'bg-genz-electric-blue/20 text-genz-electric-blue'
              : 'bg-white/5 text-white/60 hover:text-white'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          {isReadMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span className="text-sm font-medium">{isReadMode ? 'Exit Read' : 'Read Mode'}</span>
        </motion.button>
      )}

      {onCopy && (
        <motion.button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:text-white transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy'}</span>
        </motion.button>
      )}

      {onShare && (
        <motion.button
          onClick={onShare}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:text-white transition-colors"
          whileTap={{ scale: 0.95 }}
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-medium">Share</span>
        </motion.button>
      )}

      {onDownload && (
        <motion.button
          onClick={onDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze text-white"
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">PDF</span>
        </motion.button>
      )}
    </motion.div>
  );
}

// Prediction category selector (horizontal scroll)
interface CategorySelectorProps {
  categories: { id: string; label: string; icon: ReactNode }[];
  activeCategory: string;
  onSelect: (id: string) => void;
}

export function CategorySelector({ categories, activeCategory, onSelect }: CategorySelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {categories.map((category) => {
        const isActive = category.id === activeCategory;

        return (
          <motion.button
            key={category.id}
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(5);
              onSelect(category.id);
            }}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-200 touch-manipulation ${
              isActive
                ? 'bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze text-white shadow-genz-glow'
                : 'bg-dark-surface/50 border border-white/10 text-white/60 hover:text-white hover:border-white/20'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {category.icon}
            <span className="text-sm font-medium whitespace-nowrap">{category.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

// Wisdom card component for insights
interface WisdomCardProps {
  title: string;
  content: string;
  icon?: ReactNode;
  color?: 'cyan' | 'purple' | 'pink' | 'amber';
}

export function WisdomCard({ title, content, icon, color = 'cyan' }: WisdomCardProps) {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
    pink: 'from-pink-500/20 to-pink-600/5 border-pink-500/30',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
  };

  return (
    <motion.div
      className={`p-5 rounded-2xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-xl`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
            {icon}
          </div>
        )}
        <div>
          <h4 className="font-bold text-white mb-2">{title}</h4>
          <p className="text-white/70 text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Swipeable insight cards
interface InsightCardsProps {
  insights: { title: string; content: string; icon?: ReactNode }[];
}

export function SwipeableInsightCards({ insights }: InsightCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (info.offset.x < -threshold && currentIndex < insights.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-4"
        animate={{ x: -currentIndex * 100 + '%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            className="flex-shrink-0 w-full"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
          >
            <WisdomCard
              title={insight.title}
              content={insight.content}
              icon={insight.icon || <Sparkles className="w-5 h-5" />}
              color={['cyan', 'purple', 'pink', 'amber'][index % 4] as 'cyan' | 'purple' | 'pink' | 'amber'}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-4">
        {insights.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'w-6 bg-genz-electric-blue'
                : 'bg-white/20 hover:bg-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Mobile prediction header
interface PredictionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: string;
  onBack?: () => void;
}

export function PredictionHeader({ title, subtitle, icon, badge }: PredictionHeaderProps) {
  return (
    <motion.div
      className="flex items-center gap-4 mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {icon && (
        <motion.div
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-genz-electric-blue to-genz-purple-haze flex items-center justify-center shadow-genz-glow"
          animate={{
            boxShadow: [
              '0 0 20px rgba(0, 217, 255, 0.3)',
              '0 0 40px rgba(185, 131, 255, 0.3)',
              '0 0 20px rgba(0, 217, 255, 0.3)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {icon}
        </motion.div>
      )}

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {badge && (
            <span className="px-2 py-1 text-xs font-bold bg-genz-hot-pink/20 text-genz-hot-pink rounded-full">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-white/60 text-sm mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

// Empty state for predictions
export function PredictionEmptyState({
  message = 'No predictions available',
  action,
  actionLabel = 'Generate Prediction',
}: {
  message?: string;
  action?: () => void;
  actionLabel?: string;
}) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <motion.div
        className="w-20 h-20 rounded-full bg-gradient-to-br from-genz-electric-blue/20 to-genz-purple-haze/20 flex items-center justify-center mb-6"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <Sparkles className="w-10 h-10 text-genz-electric-blue" />
      </motion.div>

      <p className="text-white/60 text-lg mb-6">{message}</p>

      {action && (
        <GenZButton variant="primary" onClick={action}>
          {actionLabel}
        </GenZButton>
      )}
    </motion.div>
  );
}

// Prediction text content with read mode
interface PredictionContentProps {
  content: string;
  isReadMode?: boolean;
}

export function PredictionContent({ content, isReadMode = false }: PredictionContentProps) {
  return (
    <motion.div
      className={`prose prose-invert max-w-none ${
        isReadMode ? 'text-lg leading-relaxed' : 'text-base'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div
        className={`text-white/80 ${isReadMode ? 'tracking-wide' : ''}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </motion.div>
  );
}
