'use client';

import { useState, useCallback, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';

interface HeartMoodCheckProps {
  onMoodSelect?: (mood: number) => void;
  initialMood?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

// Pre-calculate flame colors and heights to avoid recalculation
const FLAME_CONFIG = Array.from({ length: 10 }, (_, i) => {
  const index = i + 1;
  let colors: { from: string; to: string };
  if (index <= 3) {
    colors = { from: 'from-red-600', to: 'to-red-400' };
  } else if (index <= 6) {
    colors = { from: 'from-yellow-500', to: 'to-yellow-400' };
  } else {
    colors = { from: 'from-green-500', to: 'to-green-400' };
  }
  return {
    index,
    colors,
    height: 40 + index * 8,
  };
});

// Memoized flame component to prevent unnecessary re-renders
const FlameBar = memo(({ config, isActive, onClick }: {
  config: typeof FLAME_CONFIG[number];
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1 touch-manipulation min-w-[24px] md:min-w-[32px]"
    aria-label={`Select mood ${config.index}`}
    type="button"
  >
    <motion.div
      className={`w-5 sm:w-6 md:w-8 rounded-t-full bg-gradient-to-t ${config.colors.from} ${config.colors.to} cursor-pointer will-change-transform`}
      style={{
        height: `${config.height}px`,
        transform: 'translateZ(0)', // GPU acceleration
      }}
      initial={false}
      animate={{
        opacity: isActive ? 1 : 0.4,
        scale: isActive ? 1.1 : 1,
      }}
      transition={{ duration: 0.15 }}
      whileHover={{ scale: 1.15, opacity: 1 }}
      whileTap={{ scale: 0.95 }}
    />
    <span className={`text-xs ${isActive ? 'text-white font-bold' : 'text-white/50'}`}>
      {config.index}
    </span>
  </button>
));

FlameBar.displayName = 'FlameBar';

export function HeartMoodCheck({ onMoodSelect, initialMood = 5, timeOfDay = 'evening' }: HeartMoodCheckProps) {
  const [selectedMood, setSelectedMood] = useState(initialMood);

  // Memoize time-based messages
  const { message } = useMemo(() => {
    const messages = {
      morning: {
        greeting: 'Good morning',
        message: 'As the day begins, let your heart awaken too...',
      },
      afternoon: {
        greeting: 'Good afternoon',
        message: 'As the day unfolds, let your heart stay open...',
      },
      evening: {
        greeting: 'Gentle evening',
        message: 'As the day softens, let your heart soften too...',
      },
      night: {
        greeting: 'Peaceful night',
        message: 'As the day ends, let your heart rest in peace...',
      },
    };
    return messages[timeOfDay];
  }, [timeOfDay]);

  const handleMoodSelect = useCallback((mood: number) => {
    setSelectedMood(mood);
    // Use requestAnimationFrame to prevent UI blocking
    if (onMoodSelect) {
      requestAnimationFrame(() => {
        onMoodSelect(mood);
      });
    }
  }, [onMoodSelect]);

  return (
    <motion.div
      className="bg-gradient-to-br from-indigo-900/90 via-purple-900/90 to-indigo-800/90 rounded-2xl p-6 border border-purple-500/30 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-purple-600/50 flex items-center justify-center">
          <Heart className="w-5 h-5 text-purple-300" fill="currentColor" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">How is your heart?</h3>
          <p className="text-sm text-purple-300/80">Share your feelings with Krishna</p>
        </div>
      </div>

      {/* Breath prompt */}
      <p className="text-purple-200/80 italic text-center mb-2">*Take a gentle breath...*</p>

      {/* Time-based message */}
      <p className="text-white/90 text-center mb-4">{message}</p>

      {/* Question */}
      <h4 className="text-xl text-center text-purple-100 font-medium mb-6">
        How does your heart feel right now?
      </h4>

      {/* Mood slider visualization */}
      <div className="flex justify-center items-end gap-0.5 sm:gap-1 mb-4 h-32 px-2">
        {FLAME_CONFIG.map((config) => (
          <FlameBar
            key={config.index}
            config={config}
            isActive={config.index <= selectedMood}
            onClick={() => handleMoodSelect(config.index)}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="flex justify-between text-sm text-white/70 px-2">
        <span>Struggling</span>
        <span>Steady</span>
        <span>Radiant</span>
      </div>
    </motion.div>
  );
}

export default memo(HeartMoodCheck);
