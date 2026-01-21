'use client';

import { motion } from 'framer-motion';
import { useMemo, memo } from 'react';

// Pre-generate particle positions to avoid re-renders causing position changes
const PARTICLE_POSITIONS = Array.from({ length: 15 }, (_, i) => ({
  id: i,
  left: `${(i * 7 + 5) % 100}%`,
  top: `${(i * 11 + 3) % 100}%`,
  duration: 4 + (i % 3),
  delay: (i % 5) * 0.5,
}));

// Memoized animated orb component for better performance
const AnimatedOrb = memo(({
  className,
  color,
  animate,
  duration,
}: {
  className: string;
  color: string;
  animate: { scale: number[]; x: number[]; y: number[] };
  duration: number;
}) => (
  <motion.div
    className={`${className} will-change-transform`}
    style={{
      background: color,
      transform: 'translateZ(0)', // Force GPU acceleration
    }}
    animate={animate}
    transition={{
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
      repeatType: 'loop',
    }}
  />
));

AnimatedOrb.displayName = 'AnimatedOrb';

// Memoized particle component
const Particle = memo(({
  left,
  top,
  duration,
  delay,
}: {
  left: string;
  top: string;
  duration: number;
  delay: number;
}) => (
  <motion.div
    className="absolute w-1 h-1 bg-white rounded-full will-change-transform"
    style={{
      left,
      top,
      transform: 'translateZ(0)',
    }}
    animate={{
      y: [0, -30, 0],
      opacity: [0.2, 0.8, 0.2],
    }}
    transition={{
      duration,
      repeat: Infinity,
      delay,
      repeatType: 'loop',
    }}
  />
));

Particle.displayName = 'Particle';

function AnimatedBackground() {
  // Memoize particles to prevent flickering from re-renders
  const particles = useMemo(() => (
    PARTICLE_POSITIONS.map((p) => (
      <Particle
        key={p.id}
        left={p.left}
        top={p.top}
        duration={p.duration}
        delay={p.delay}
      />
    ))
  ), []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient background */}
      <div className="absolute inset-0 genz-mesh-bg" />

      {/* Animated orbs - use GPU acceleration */}
      <AnimatedOrb
        className="absolute top-20 left-20 w-64 md:w-96 h-64 md:h-96 rounded-full opacity-20 blur-3xl"
        color="radial-gradient(circle, rgba(0, 217, 255, 0.4) 0%, transparent 70%)"
        animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
        duration={8}
      />

      <AnimatedOrb
        className="absolute top-1/2 right-20 w-56 md:w-80 h-56 md:h-80 rounded-full opacity-20 blur-3xl"
        color="radial-gradient(circle, rgba(185, 131, 255, 0.4) 0%, transparent 70%)"
        animate={{ scale: [1, 1.3, 1], x: [0, -30, 0], y: [0, 50, 0] }}
        duration={10}
      />

      <AnimatedOrb
        className="absolute bottom-20 left-1/3 w-48 md:w-72 h-48 md:h-72 rounded-full opacity-20 blur-3xl"
        color="radial-gradient(circle, rgba(255, 0, 110, 0.4) 0%, transparent 70%)"
        animate={{ scale: [1, 1.1, 1], x: [0, 40, 0], y: [0, -40, 0] }}
        duration={12}
      />

      {/* Floating particles - memoized to prevent flickering */}
      {particles}

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
    </div>
  );
}

export default memo(AnimatedBackground);

// Memoized floating element component
const FloatingEmoji = memo(({
  className,
  emoji,
  yAnimation,
  rotateAnimation,
  duration,
}: {
  className: string;
  emoji: string;
  yAnimation: number[];
  rotateAnimation: number[];
  duration: number;
}) => (
  <motion.div
    className={`${className} will-change-transform`}
    style={{ transform: 'translateZ(0)' }}
    animate={{
      y: yAnimation,
      rotate: rotateAnimation,
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
      repeatType: 'loop',
    }}
  >
    {emoji}
  </motion.div>
));

FloatingEmoji.displayName = 'FloatingEmoji';

export const FloatingElements = memo(function FloatingElements() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <FloatingEmoji
        className="absolute top-1/4 left-4 md:left-10 text-4xl md:text-6xl opacity-10"
        emoji="✨"
        yAnimation={[0, -20, 0]}
        rotateAnimation={[0, 10, 0]}
        duration={6}
      />

      <FloatingEmoji
        className="absolute top-1/2 right-4 md:right-20 text-3xl md:text-5xl opacity-10"
        emoji="🌙"
        yAnimation={[0, 20, 0]}
        rotateAnimation={[0, -10, 0]}
        duration={7}
      />

      <FloatingEmoji
        className="absolute bottom-1/4 left-1/3 text-2xl md:text-4xl opacity-10"
        emoji="⭐"
        yAnimation={[0, -15, 0]}
        rotateAnimation={[0, 15, 0]}
        duration={5}
      />

      <FloatingEmoji
        className="absolute top-1/3 right-1/4 text-3xl md:text-5xl opacity-10"
        emoji="🔮"
        yAnimation={[0, 15, 0]}
        rotateAnimation={[0, -15, 0]}
        duration={8}
      />
    </div>
  );
});
