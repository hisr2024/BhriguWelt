'use client';

import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { ReactNode, useState, useCallback } from 'react';

interface GenZCardProps {
  children: ReactNode;
  variant?: 'default' | 'glass' | 'neon' | 'gradient' | 'premium';
  className?: string;
  onClick?: () => void;
  animate?: boolean;
  hoverEffect?: boolean;
  pressEffect?: boolean;
  glowOnHover?: boolean;
  delay?: number;
}

export default function GenZCard({
  children,
  variant = 'default',
  className = '',
  onClick,
  animate = true,
  hoverEffect = true,
  pressEffect = true,
  glowOnHover = false,
  delay = 0,
}: GenZCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number; id: number } | null>(null);

  // Touch/click ripple effect
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!onClick) return;

      // Get touch/click position
      let x: number, y: number;
      if ('touches' in e) {
        const rect = e.currentTarget.getBoundingClientRect();
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        const rect = e.currentTarget.getBoundingClientRect();
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      // Trigger haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(5);
      }

      setRipple({ x, y, id: Date.now() });
      setTimeout(() => setRipple(null), 600);

      onClick();
    },
    [onClick]
  );

  const baseClass = 'rounded-3xl p-6 transition-all duration-300 relative overflow-hidden';

  const variantClasses: Record<string, string> = {
    default: 'genz-card',
    glass: 'genz-card-glass',
    neon: 'genz-card-neon',
    gradient:
      'bg-gradient-to-br from-genz-purple-haze/20 to-genz-electric-blue/20 backdrop-blur-xl border border-white/10 shadow-glass-lg',
    premium: 'glass-premium',
  };

  const hoverClass = hoverEffect ? 'hover:scale-[1.02] cursor-pointer' : '';
  const pressClass = pressEffect && onClick ? 'active:scale-[0.98]' : '';
  const glowClass = glowOnHover ? 'hover:shadow-genz-glow' : '';

  // Motion variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  if (!animate) {
    return (
      <div
        className={`${baseClass} ${variantClasses[variant]} ${hoverClass} ${pressClass} ${glowClass} ${className}`}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={`${baseClass} ${variantClasses[variant]} ${hoverClass} ${pressClass} ${glowClass} ${className} touch-manipulation`}
      onClick={handleClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={hoverEffect ? { y: -4, scale: 1.02 } : {}}
      whileTap={pressEffect && onClick ? { scale: 0.98 } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* Ripple effect */}
      <AnimatePresence>
        {ripple && (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white/20 pointer-events-none"
            initial={{
              width: 0,
              height: 0,
              x: ripple.x,
              y: ripple.y,
              opacity: 0.5,
            }}
            animate={{
              width: 300,
              height: 300,
              x: ripple.x - 150,
              y: ripple.y - 150,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// Gradient card with animated background
export function GenZCardGradient({
  children,
  className = '',
  animateGradient = true,
}: {
  children: ReactNode;
  className?: string;
  animateGradient?: boolean;
}) {
  return (
    <motion.div
      className={`relative overflow-hidden rounded-3xl p-6 ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-genz-electric-blue/20 via-genz-purple-haze/20 to-genz-hot-pink/20"
        animate={
          animateGradient
            ? {
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }
            : {}
        }
        transition={
          animateGradient
            ? {
                duration: 10,
                repeat: Infinity,
                ease: 'linear',
              }
            : {}
        }
        style={{ backgroundSize: '200% 200%' }}
      />

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-30" />

      {/* Blur backdrop */}
      <div className="absolute inset-0 backdrop-blur-xl" />

      {/* Glow effect */}
      <div className="absolute inset-0 opacity-50 animate-pulse-glow pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// Interactive feature card with hover reveal
export function GenZFeatureCard({
  icon,
  title,
  description,
  badge,
  color = 'from-cyan-500 to-blue-500',
  onClick,
  href,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
  color?: string;
  onClick?: () => void;
  href?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const CardContent = () => (
    <>
      {/* Badge */}
      {badge && (
        <motion.div
          className="absolute top-4 right-4 z-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-genz-hot-pink to-genz-coral-pop text-white rounded-full shadow-lg">
            {badge}
          </span>
        </motion.div>
      )}

      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
        initial={{ x: '-100%' }}
        animate={{ x: isHovered ? '100%' : '-100%' }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />

      {/* Icon */}
      <motion.div
        className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-r ${color} flex items-center justify-center mb-5 shadow-genz-glow`}
        whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
        transition={{ duration: 0.5 }}
      >
        {icon}
      </motion.div>

      {/* Title */}
      <h3 className="text-lg md:text-xl font-display font-bold mb-3 text-white group-hover:text-genz-electric-blue transition-colors">
        {title}
      </h3>

      {/* Description */}
      <p className="text-white/70 text-sm md:text-base mb-5 line-clamp-3">{description}</p>

      {/* CTA */}
      <motion.div
        className="flex items-center text-genz-electric-blue font-bold text-sm"
        animate={{ x: isHovered ? 5 : 0 }}
      >
        Explore
        <motion.svg
          className="w-5 h-5 ml-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ x: isHovered ? 5 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </motion.svg>
      </motion.div>
    </>
  );

  return (
    <motion.div
      className="genz-card-glass group relative overflow-hidden cursor-pointer touch-manipulation"
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <CardContent />
    </motion.div>
  );
}

// Compact card for mobile lists
export function GenZCompactCard({
  icon,
  title,
  subtitle,
  rightContent,
  onClick,
  variant = 'default',
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'highlight' | 'success' | 'warning';
}) {
  const variantStyles = {
    default: 'border-white/10',
    highlight: 'border-genz-electric-blue/30 bg-genz-electric-blue/5',
    success: 'border-green-500/30 bg-green-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
  };

  return (
    <motion.button
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(5);
        onClick?.();
      }}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-dark-surface/50 backdrop-blur-xl border ${variantStyles[variant]} transition-all duration-200 touch-manipulation text-left hover:bg-white/5 active:scale-[0.98]`}
      whileTap={{ scale: 0.98 }}
    >
      {icon && (
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-genz-electric-blue/20 to-genz-purple-haze/20 flex items-center justify-center text-genz-electric-blue">
          {icon}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{title}</p>
        {subtitle && <p className="text-sm text-white/50 truncate">{subtitle}</p>}
      </div>

      {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
    </motion.button>
  );
}

// Stats card component
export function GenZStatsCard({
  value,
  label,
  icon,
  trend,
  trendValue,
}: {
  value: string | number;
  label: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-white/50',
  };

  return (
    <motion.div
      className="genz-card-glass text-center group"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex justify-center mb-4 text-genz-electric-blue group-hover:text-genz-hot-pink transition-colors"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
      >
        {icon}
      </motion.div>

      <div className="text-3xl md:text-4xl font-display font-extrabold bg-gradient-to-r from-genz-electric-blue via-genz-purple-haze to-genz-hot-pink bg-clip-text text-transparent mb-2">
        {value}
      </div>

      <div className="text-white/80 font-medium text-sm">{label}</div>

      {trend && trendValue && (
        <div className={`mt-2 text-xs font-medium ${trendColors[trend]}`}>
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {trendValue}
        </div>
      )}
    </motion.div>
  );
}
