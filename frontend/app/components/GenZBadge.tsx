'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GenZBadgeProps {
  children: ReactNode;
  variant?: 'default' | 'outline' | 'neon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: ReactNode;
  pulse?: boolean;
}

export default function GenZBadge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon,
  pulse = false,
}: GenZBadgeProps) {
  const variantClasses = {
    default: 'genz-badge',
    outline: 'genz-badge-outline',
    neon: 'genz-badge-neon',
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const pulseClass = pulse ? 'animate-pulse-glow' : '';

  return (
    <motion.span
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${pulseClass} ${className}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </motion.span>
  );
}

export function StatusBadge({
  status,
  className = '',
}: {
  status: 'active' | 'inactive' | 'pending' | 'success' | 'error';
  className?: string;
}) {
  const statusConfig = {
    active: {
      color: 'bg-genz-neon-green text-dark-base',
      icon: '●',
      label: 'Active',
    },
    inactive: {
      color: 'bg-white/20 text-white/60',
      icon: '●',
      label: 'Inactive',
    },
    pending: {
      color: 'bg-genz-cyber-yellow text-dark-base',
      icon: '●',
      label: 'Pending',
    },
    success: {
      color: 'bg-genz-mint-fresh text-dark-base',
      icon: '✓',
      label: 'Success',
    },
    error: {
      color: 'bg-genz-hot-pink text-white',
      icon: '✕',
      label: 'Error',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.color} ${className}`}
    >
      <span className="text-[10px]">{config.icon}</span>
      {config.label}
    </span>
  );
}
