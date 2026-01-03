'use client';

import { motion } from 'framer-motion';

export function GenZLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        {/* Outer ring */}
        <motion.div
          className="w-24 h-24 rounded-full border-4 border-genz-electric-blue/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />

        {/* Inner ring */}
        <motion.div
          className="absolute inset-2 rounded-full border-4 border-genz-purple-haze/30 border-t-genz-purple-haze"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />

        {/* Center dot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-genz-electric-blue to-genz-hot-pink shadow-genz-glow" />
        </motion.div>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="genz-card-glass animate-pulse">
      <div className="space-y-4">
        <div className="h-4 bg-white/10 rounded-full w-3/4" />
        <div className="h-4 bg-white/10 rounded-full w-1/2" />
        <div className="h-20 bg-white/10 rounded-2xl" />
        <div className="flex gap-2">
          <div className="h-8 bg-white/10 rounded-full w-20" />
          <div className="h-8 bg-white/10 rounded-full w-24" />
        </div>
      </div>
    </div>
  );
}

export function PulsingDot({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`w-2 h-2 rounded-full bg-genz-electric-blue ${className}`}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

export function DotsLoader() {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 rounded-full bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}
