/**
 * Profile Creation Progress Component
 * Displays real-time progress during profile creation
 */

'use client';

import { useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import type { ProfileCreationProgress } from '@/lib/services/profileCreationService';

interface ProfileCreationProgressProps {
  progress: ProfileCreationProgress;
  error?: string;
  onRetry?: () => void;
}

const STEP_LABELS = {
  validating: 'Validating Birth Details',
  geocoding: 'Finding Location',
  calculating: 'Calculating Birth Chart',
  encrypting: 'Encrypting Data',
  saving: 'Saving Profile',
  complete: 'Complete',
};

const STEP_ICONS = {
  validating: '🔍',
  geocoding: '🌍',
  calculating: '✨',
  encrypting: '🔐',
  saving: '💾',
  complete: '✅',
};

export default function ProfileCreationProgress({ progress, error, onRetry }: ProfileCreationProgressProps) {
  const steps = ['validating', 'geocoding', 'calculating', 'encrypting', 'saving', 'complete'] as const;
  const currentStepIndex = steps.indexOf(progress.step);
  const startTimeRef = useRef<number | null>(null);

  if (startTimeRef.current === null && progress.progress > 0 && progress.progress < 100) {
    startTimeRef.current = Date.now();
  }

  if (progress.progress >= 100 || error) {
    startTimeRef.current = null;
  }

  const estimatedSecondsRemaining = useMemo(() => {
    if (!startTimeRef.current || progress.progress <= 0 || progress.progress >= 100) {
      return null;
    }
    const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
    const completionRatio = progress.progress / 100;
    if (completionRatio <= 0) {
      return null;
    }
    const estimatedTotalSeconds = elapsedSeconds / completionRatio;
    const remainingSeconds = Math.max(0, estimatedTotalSeconds - elapsedSeconds);
    return Math.round(remainingSeconds);
  }, [progress.progress]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      role="status"
      aria-live="polite"
      aria-label="Profile creation progress"
    >
      {/* Progress Bar */}
      <div className="relative" role="progressbar" aria-valuenow={progress.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Profile creation progress: ${progress.progress}%`}>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
          <motion.div
            className="h-full bg-gradient-to-r from-genz-electric-blue via-genz-purple-haze to-genz-hot-pink"
            initial={{ width: 0 }}
            animate={{ width: `${progress.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 text-xs font-bold text-white bg-genz-electric-blue px-2 py-1 rounded-full shadow-genz-glow"
          initial={{ left: 0 }}
          animate={{ left: `${Math.max(0, progress.progress - 5)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {progress.progress}%
        </motion.div>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2" role="list" aria-label="Creation steps">
        {steps.map((step, index) => {
          const isComplete = index < currentStepIndex || progress.step === 'complete';
          const isCurrent = index === currentStepIndex && progress.step !== 'complete';

          return (
            <motion.div
              key={step}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                isComplete
                  ? 'bg-genz-neon-green/20 border-2 border-genz-neon-green/50'
                  : isCurrent
                  ? 'bg-genz-electric-blue/20 border-2 border-genz-electric-blue shadow-genz-glow'
                  : 'bg-white/5 border-2 border-white/20'
              }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="relative">
                <div className="text-2xl" role="img" aria-label={STEP_LABELS[step]}>
                  {STEP_ICONS[step]}
                </div>
                {isComplete && (
                  <motion.div
                    className="absolute -top-1 -right-1 bg-genz-neon-green rounded-full p-0.5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    <Check className="w-3 h-3 text-black" />
                  </motion.div>
                )}
                {isCurrent && (
                  <motion.div
                    className="absolute -top-1 -right-1 bg-genz-electric-blue rounded-full p-0.5"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </div>
              <div
                className={`text-xs font-medium text-center leading-tight ${
                  isComplete
                    ? 'text-genz-neon-green'
                    : isCurrent
                    ? 'text-genz-electric-blue'
                    : 'text-white/50'
                }`}
              >
                {STEP_LABELS[step]}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Current Message */}
      <AnimatePresence mode="wait">
        <motion.div
          key={progress.message}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border-2 border-white/20"
        >
          <div className="flex items-center gap-3">
            {error ? (
              <>
                <AlertCircle className="w-5 h-5 text-genz-hot-pink flex-shrink-0" />
                <p className="text-white font-medium">{error}</p>
              </>
            ) : (
              <>
                <Loader2 className="w-5 h-5 text-genz-electric-blue animate-spin flex-shrink-0" />
                <p className="text-white font-medium">{progress.message}</p>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Helpful Tips */}
      {!error && progress.step !== 'complete' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="bg-genz-cyber-yellow/10 backdrop-blur-xl rounded-xl p-4 border border-genz-cyber-yellow/30"
        >
          <p className="text-sm text-white/80 text-center">
            {progress.step === 'validating' && '✨ Checking your birth details for accuracy...'}
            {progress.step === 'geocoding' && '🌍 Finding precise coordinates for your birthplace...'}
            {progress.step === 'calculating' && '🔮 Calculating planetary positions at your birth time...'}
            {progress.step === 'encrypting' && '🔐 Preparing encrypted storage for your profile...'}
            {progress.step === 'saving' && '🔒 Encrypting and saving your profile securely...'}
          </p>
        </motion.div>
      )}

      {/* Estimated time remaining */}
      {!error && estimatedSecondsRemaining !== null && progress.step !== 'complete' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-white/70"
        >
          Estimated time remaining: <span className="text-white font-semibold">{estimatedSecondsRemaining}s</span>
        </motion.div>
      )}

      {/* Success Message */}
      {progress.step === 'complete' && !error && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="bg-gradient-to-r from-genz-neon-green/20 to-genz-mint-fresh/20 backdrop-blur-xl rounded-2xl p-6 border-2 border-genz-neon-green shadow-genz-glow text-center"
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 0.6 }}
          >
            🎉
          </motion.div>
          <h3 className="text-2xl font-display font-bold text-white mb-2">Profile Created!</h3>
          <p className="text-white/80">Your cosmic journey begins now...</p>
        </motion.div>
      )}

      {/* Retry Action */}
      {error && onRetry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <button
            type="button"
            onClick={onRetry}
            className="px-5 py-2 rounded-full bg-genz-electric-blue text-white font-semibold shadow-genz-glow hover:bg-genz-purple-haze transition-colors"
          >
            Retry profile creation
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
