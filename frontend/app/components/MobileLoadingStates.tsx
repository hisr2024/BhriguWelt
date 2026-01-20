'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';
import { Loader2, Sparkles, Moon, Sun, Star } from 'lucide-react';

// Premium skeleton component
export function Skeleton({
  className = '',
  variant = 'default',
  animate = true,
}: {
  className?: string;
  variant?: 'default' | 'text' | 'circular' | 'rounded';
  animate?: boolean;
}) {
  const variantClasses = {
    default: 'rounded-lg',
    text: 'rounded h-4',
    circular: 'rounded-full',
    rounded: 'rounded-2xl',
  };

  return (
    <div
      className={`
        ${variantClasses[variant]}
        ${animate ? 'skeleton-premium' : 'bg-white/5'}
        ${className}
      `}
    />
  );
}

// Skeleton card for loading states
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-3xl bg-dark-surface/50 backdrop-blur-xl border border-white/10 p-6 ${className}`}>
      <Skeleton className="w-16 h-16 mb-4" variant="rounded" />
      <Skeleton className="w-3/4 h-5 mb-3" variant="text" />
      <Skeleton className="w-full h-4 mb-2" variant="text" />
      <Skeleton className="w-2/3 h-4" variant="text" />
    </div>
  );
}

// Skeleton list item
export function SkeletonListItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl bg-dark-surface/50 backdrop-blur-xl border border-white/10 ${className}`}>
      <Skeleton className="w-12 h-12" variant="rounded" />
      <div className="flex-1">
        <Skeleton className="w-3/4 h-4 mb-2" variant="text" />
        <Skeleton className="w-1/2 h-3" variant="text" />
      </div>
      <Skeleton className="w-8 h-8" variant="circular" />
    </div>
  );
}

// Skeleton stats card
export function SkeletonStatsCard({ className = '' }: { className?: string }) {
  return (
    <div className={`text-center p-6 rounded-3xl bg-dark-surface/50 backdrop-blur-xl border border-white/10 ${className}`}>
      <Skeleton className="w-10 h-10 mx-auto mb-4" variant="circular" />
      <Skeleton className="w-20 h-8 mx-auto mb-2" variant="text" />
      <Skeleton className="w-16 h-3 mx-auto" variant="text" />
    </div>
  );
}

// Full page loading spinner
export function FullPageLoader({
  message = 'Loading...',
  submessage,
}: {
  message?: string;
  submessage?: string;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-dark-base"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-genz-electric-blue/10 via-transparent to-genz-purple-haze/10" />

      {/* Animated cosmic elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated spinner with glow */}
        <motion.div
          className="relative mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze rounded-full blur-xl opacity-50" />
          <div className="relative w-20 h-20 rounded-full border-4 border-white/10 border-t-genz-electric-blue">
            <motion.div
              className="absolute inset-2 rounded-full border-4 border-white/5 border-b-genz-purple-haze"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </motion.div>

        {/* OM Symbol */}
        <motion.div
          className="text-4xl mb-6 text-genz-electric-blue"
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          ॐ
        </motion.div>

        {/* Loading message */}
        <motion.p
          className="text-lg font-medium text-white mb-2"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
        </motion.p>

        {submessage && (
          <p className="text-sm text-white/60">{submessage}</p>
        )}

        {/* Progress dots */}
        <div className="flex gap-2 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-genz-electric-blue"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Inline loading spinner
export function InlineLoader({
  size = 'md',
  color = 'cyan',
}: {
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'purple' | 'pink' | 'white';
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const colorClasses = {
    cyan: 'text-genz-electric-blue',
    purple: 'text-genz-purple-haze',
    pink: 'text-genz-hot-pink',
    white: 'text-white',
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} />
  );
}

// Button loading state
export function ButtonLoader({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`flex items-center gap-2 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Loading...</span>
    </motion.div>
  );
}

// Content loading placeholder with cosmic theme
export function CosmicLoader({ message = 'Consulting the stars...' }: { message?: string }) {
  const icons = [Sparkles, Moon, Sun, Star];

  return (
    <div className="flex flex-col items-center justify-center p-12">
      <div className="relative w-24 h-24 mb-6">
        {icons.map((Icon, index) => (
          <motion.div
            key={index}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [0, 30 * Math.cos((index * Math.PI) / 2), 0],
              y: [0, 30 * Math.sin((index * Math.PI) / 2), 0],
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: index * 0.3,
              ease: 'easeInOut',
            }}
          >
            <Icon className="w-6 h-6 text-genz-electric-blue" />
          </motion.div>
        ))}

        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl"
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          ॐ
        </motion.div>
      </div>

      <motion.p
        className="text-white/80 text-center"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  );
}

// Progress bar with cosmic gradient
export function CosmicProgress({
  progress,
  showPercentage = true,
  className = '',
}: {
  progress: number;
  showPercentage?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-genz-electric-blue via-genz-purple-haze to-genz-hot-pink rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {showPercentage && (
        <motion.p
          className="text-sm text-white/60 mt-2 text-center"
          key={Math.floor(progress)}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {Math.floor(progress)}%
        </motion.p>
      )}
    </div>
  );
}

// Lazy load wrapper with loading state
export function LazyLoadWrapper({
  children,
  isLoading,
  skeleton,
  minHeight = 200,
}: {
  children: ReactNode;
  isLoading: boolean;
  skeleton?: ReactNode;
  minHeight?: number;
}) {
  return (
    <div style={{ minHeight }}>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {skeleton || (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Prediction loading state
export function PredictionLoader({ category = 'prediction' }: { category?: string }) {
  return (
    <div className="p-6 rounded-3xl bg-dark-surface/50 backdrop-blur-xl border border-white/10">
      <div className="flex items-center gap-4 mb-6">
        <motion.div
          className="w-12 h-12 rounded-xl bg-gradient-to-br from-genz-electric-blue to-genz-purple-haze flex items-center justify-center"
          animate={{
            boxShadow: [
              '0 0 20px rgba(0, 217, 255, 0.3)',
              '0 0 40px rgba(185, 131, 255, 0.3)',
              '0 0 20px rgba(0, 217, 255, 0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-6 h-6 text-white" />
        </motion.div>
        <div>
          <Skeleton className="w-40 h-5 mb-2" variant="text" />
          <Skeleton className="w-24 h-3" variant="text" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="w-full h-4" variant="text" />
        <Skeleton className="w-full h-4" variant="text" />
        <Skeleton className="w-3/4 h-4" variant="text" />
      </div>

      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex gap-4">
          <Skeleton className="flex-1 h-12" variant="rounded" />
          <Skeleton className="w-12 h-12" variant="rounded" />
        </div>
      </div>

      <motion.p
        className="text-center text-white/60 text-sm mt-6"
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Generating your {category}...
      </motion.p>
    </div>
  );
}

// Shimmer effect overlay
export function ShimmerOverlay({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none ${className}`}
      animate={{ x: ['-100%', '100%'] }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}
