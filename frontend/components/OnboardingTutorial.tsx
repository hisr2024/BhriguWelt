// frontend/components/OnboardingTutorial.tsx
'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

// Move steps outside component to prevent recreation on each render
const TUTORIAL_STEPS = [
  {
    title: 'Welcome to BhriguWelt',
    content: 'Discover your soul journey with ancient Vedic astrology enhanced by AI.',
    emoji: '🙏',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    title: 'Enter Birth Details',
    content: 'Provide your date, time, and place of birth for accurate astrological charts.',
    emoji: '📝',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Choose Your Engine',
    content: 'Select from Karmic Journey, Past Lives, Present Life, or other powerful prediction engines.',
    emoji: '🎯',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    title: 'Generate Your Report',
    content: 'Get personalized insights and predictions powered by AI and Vedic wisdom.',
    emoji: '✨',
    gradient: 'from-lime-500 to-green-500',
  },
] as const;

// Memoized step indicator component
const StepIndicator = memo(({ index, isActive, onClick, title }: {
  index: number;
  isActive: boolean;
  onClick: () => void;
  title: string;
}) => (
  <button
    onClick={onClick}
    className="group flex items-center justify-center min-w-[44px] rounded-full transition-all"
    aria-label={`Go to step ${index + 1}: ${title}`}
  >
    <span
      className={`h-2 rounded-full transition-all ${
        isActive
          ? 'w-8 bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze'
          : 'w-2 bg-white/20 group-hover:bg-white/30'
      }`}
    />
  </button>
));

StepIndicator.displayName = 'StepIndicator';

// Memoized emoji icon component with stable animation
const AnimatedEmojiIcon = memo(({ emoji, gradient }: { emoji: string; gradient: string }) => (
  <motion.div
    className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-genz-glow will-change-transform`}
    animate={{
      scale: [1, 1.05, 1],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
      // Use consistent timing to prevent flickering
      repeatType: 'loop',
    }}
  >
    <span className="text-6xl">{emoji}</span>
  </motion.div>
));

AnimatedEmojiIcon.displayName = 'AnimatedEmojiIcon';

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [step, setStep] = useState(0);

  // Memoize current step data
  const currentStep = useMemo(() => TUTORIAL_STEPS[step], [step]);

  // Use callbacks to prevent function recreation
  const next = useCallback(() => {
    if (step < TUTORIAL_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const prev = useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
    }
  }, [step]);

  const skip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const goToStep = useCallback((index: number) => {
    setStep(index);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        className="bg-dark-elevated border border-genz-electric-blue/30 rounded-2xl max-w-2xl w-full overflow-hidden shadow-genz-glow"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-genz-electric-blue" />
            <h2 className="text-xl font-display font-bold text-white">Getting Started</h2>
          </div>
          <button
            onClick={skip}
            className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            aria-label="Close tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {/* Emoji with gradient background - using memoized component */}
              <AnimatedEmojiIcon emoji={currentStep.emoji} gradient={currentStep.gradient} />

              {/* Title */}
              <h3 className="text-3xl font-display font-bold mb-4 bg-gradient-to-r from-genz-electric-blue via-white to-genz-hot-pink bg-clip-text text-transparent">
                {currentStep.title}
              </h3>

              {/* Content */}
              <p className="text-lg text-white/80 mb-8 leading-relaxed max-w-lg mx-auto">
                {currentStep.content}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress indicators - using memoized components */}
          <div className="flex justify-center gap-2 mb-8">
            {TUTORIAL_STEPS.map((s, index) => (
              <StepIndicator
                key={index}
                index={index}
                isActive={index === step}
                onClick={() => goToStep(index)}
                title={s.title}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={prev}
              disabled={step === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                step === 0
                  ? 'text-white/30 cursor-not-allowed'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={skip}
              className="text-white/60 hover:text-white transition-colors font-medium"
            >
              Skip Tutorial
            </button>

            <button
              onClick={next}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze font-bold text-white hover:shadow-genz-glow transition-all"
            >
              {step === TUTORIAL_STEPS.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default OnboardingTutorial;
