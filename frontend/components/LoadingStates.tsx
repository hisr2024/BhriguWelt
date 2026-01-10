// frontend/components/LoadingStates.tsx
'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * Spinner Component
 * Simple animated spinner for loading states
 */
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <Loader2
      className={`${sizeMap[size]} animate-spin text-blue-500 ${className}`}
      aria-label="Loading"
    />
  );
}

/**
 * Loading Overlay
 * Full-screen loading overlay with spinner
 */
interface LoadingOverlayProps {
  message?: string;
  show: boolean;
}

export function LoadingOverlay({ message = 'Loading...', show }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div className="bg-dark-elevated border border-genz-electric-blue/30 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-genz-glow">
        <Spinner size="xl" />
        <p className="text-white text-lg font-medium">{message}</p>
      </div>
    </motion.div>
  );
}

/**
 * Skeleton Components
 * Skeleton screens for content loading states
 */
export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white/10 rounded-lg animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCircle({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-white/10 rounded-full animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-dark-elevated border border-white/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-4">
        <SkeletonCircle className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-1/3" />
          <SkeletonLine className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonLine className="h-3 w-full" />
        <SkeletonLine className="h-3 w-5/6" />
        <SkeletonLine className="h-3 w-4/6" />
      </div>
    </div>
  );
}

/**
 * Profile Card Skeleton
 */
export function ProfileCardSkeleton() {
  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonCircle className="w-16 h-16" />
        <SkeletonLine className="h-8 w-24" />
      </div>
      <div className="space-y-2">
        <SkeletonLine className="h-6 w-1/2" />
        <SkeletonLine className="h-4 w-2/3" />
        <SkeletonLine className="h-4 w-1/2" />
      </div>
      <div className="flex gap-2">
        <SkeletonLine className="h-8 w-20" />
        <SkeletonLine className="h-8 w-20" />
        <SkeletonLine className="h-8 w-20" />
      </div>
    </div>
  );
}

/**
 * Report Skeleton
 */
export function ReportSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <SkeletonLine className="h-8 w-1/3" />
        <SkeletonLine className="h-4 w-1/2" />
      </div>

      {/* Content sections */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-dark-elevated border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <SkeletonCircle className="w-10 h-10" />
            <SkeletonLine className="h-5 w-1/4" />
          </div>
          <div className="space-y-2">
            <SkeletonLine className="h-4 w-full" />
            <SkeletonLine className="h-4 w-11/12" />
            <SkeletonLine className="h-4 w-10/12" />
            <SkeletonLine className="h-4 w-9/12" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * List Skeleton
 */
interface ListSkeletonProps {
  count?: number;
}

export function ListSkeleton({ count = 5 }: ListSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-dark-elevated border border-white/10 rounded-xl p-4 flex items-center gap-4"
        >
          <SkeletonCircle className="w-12 h-12" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-4 w-1/3" />
            <SkeletonLine className="h-3 w-2/3" />
          </div>
          <SkeletonLine className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

/**
 * Pulse Loading Animation
 * Subtle pulse animation for loading states
 */
export function PulseLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        className="w-2 h-2 bg-blue-500 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0,
        }}
      />
      <motion.div
        className="w-2 h-2 bg-purple-500 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0.2,
        }}
      />
      <motion.div
        className="w-2 h-2 bg-pink-500 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.5, 1],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: 0.4,
        }}
      />
    </div>
  );
}

/**
 * Progress Bar
 * Determinate progress indicator
 */
interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
  className = '',
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/80">{label}</span>
          {showPercentage && (
            <span className="text-white/60 font-mono">{clampedProgress}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/**
 * Shimmer Effect
 * Loading shimmer animation for placeholder content
 */
export function ShimmerEffect({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

/**
 * Button Loading State
 */
interface ButtonLoadingProps {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function ButtonWithLoading({
  loading,
  children,
  className = '',
  disabled = false,
  onClick,
}: ButtonLoadingProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`relative flex items-center justify-center gap-2 ${className}`}
    >
      {loading && (
        <Spinner size="sm" className="absolute left-4" />
      )}
      <span className={loading ? 'opacity-50' : ''}>{children}</span>
    </button>
  );
}

/**
 * Infinite Loading Indicator
 * For infinite scroll or continuous loading
 */
export function InfiniteLoadingIndicator({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-white/60 text-sm">Loading more...</p>
      </div>
    </div>
  );
}

/**
 * Empty State Component
 * For when there's no data to display
 */
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon && <div className="mb-4 text-white/40">{icon}</div>}
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-white/60 text-sm max-w-md mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/50 transition-all"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
