'use client';

import GenZCard from './GenZCard';

type CardSkeletonProps = {
  className?: string;
};

export default function CardSkeleton({ className = '' }: CardSkeletonProps) {
  return (
    <GenZCard variant="glass" className={`animate-pulse ${className}`}>
      <div className="space-y-4">
        <div className="h-4 bg-white/10 rounded-full w-2/3" />
        <div className="h-6 bg-white/10 rounded-full w-4/5" />
        <div className="h-20 bg-white/10 rounded-2xl" />
      </div>
    </GenZCard>
  );
}
