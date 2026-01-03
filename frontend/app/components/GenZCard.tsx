'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GenZCardProps {
  children: ReactNode;
  variant?: 'default' | 'glass' | 'neon' | 'gradient';
  className?: string;
  onClick?: () => void;
  animate?: boolean;
  hoverEffect?: boolean;
}

export default function GenZCard({
  children,
  variant = 'default',
  className = '',
  onClick,
  animate = true,
  hoverEffect = true,
}: GenZCardProps) {
  const baseClass = 'rounded-3xl p-6 transition-all duration-300';

  const variantClasses = {
    default: 'genz-card',
    glass: 'genz-card-glass',
    neon: 'genz-card-neon',
    gradient: 'bg-gradient-to-br from-genz-purple-haze/20 to-genz-electric-blue/20 backdrop-blur-xl border border-white/10 shadow-glass-lg',
  };

  const hoverClass = hoverEffect ? 'hover:scale-[1.02] hover:shadow-genz-glow cursor-pointer' : '';

  const CardWrapper = animate ? motion.div : 'div';

  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        whileHover: hoverEffect ? { scale: 1.02, y: -4 } : {},
        whileTap: onClick ? { scale: 0.98 } : {},
        transition: { duration: 0.3 },
      }
    : {};

  return (
    <CardWrapper
      className={`${baseClass} ${variantClasses[variant]} ${hoverClass} ${className} haptic-feedback`}
      onClick={onClick}
      {...animationProps}
    >
      {children}
    </CardWrapper>
  );
}

export function GenZCardGradient({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-3xl p-6 ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-genz-electric-blue/20 via-genz-purple-haze/20 to-genz-hot-pink/20" />
      <div className="absolute inset-0 bg-mesh-gradient opacity-30" />
      <div className="absolute inset-0 backdrop-blur-xl" />

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
