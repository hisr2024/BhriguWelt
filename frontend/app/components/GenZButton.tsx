'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface GenZButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'outline' | 'pill' | 'neon' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export default function GenZButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  fullWidth = false,
  type = 'button',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: GenZButtonProps) {
  const baseClass = 'font-bold transition-all duration-300 haptic-feedback inline-flex min-h-[44px] items-center justify-center gap-2 py-3 focus:outline-none focus:ring-4 focus:ring-genz-electric-blue/50 focus-visible:ring-4 focus-visible:ring-genz-electric-blue';

  const variantClasses = {
    primary: 'genz-button',
    outline: 'genz-button-outline',
    pill: 'genz-button-pill',
    neon: 'genz-button-neon',
    ghost: 'bg-transparent text-white hover:bg-white/10 rounded-2xl',
  };

  const sizeClasses = {
    sm: 'px-4 text-sm rounded-xl',
    md: 'px-6 text-base rounded-2xl',
    lg: 'px-8 text-lg rounded-2xl',
  };

  const disabledClass = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      type={type}
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClass} ${widthClass} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.05 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.95 } : {}}
      transition={{ duration: 0.2 }}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
      {children}
    </motion.button>
  );
}

export function FloatingActionButton({
  children,
  onClick,
  className = '',
  'aria-label': ariaLabel = 'Action button',
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <motion.button
      className={`fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze rounded-full shadow-genz-glow flex items-center justify-center z-40 haptic-feedback focus:outline-none focus:ring-4 focus:ring-genz-electric-blue ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      whileHover={{ scale: 1.1, rotate: 90 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {children}
    </motion.button>
  );
}
