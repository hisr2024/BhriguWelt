'use client';

import { forwardRef, useState, useCallback } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Button variants
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'neon';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface MobileButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  hapticFeedback?: boolean;
  ripple?: boolean;
}

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      loadingText,
      icon,
      iconPosition = 'left',
      hapticFeedback = true,
      ripple = true,
      children,
      disabled,
      onClick,
      className = '',
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

    const variants: Record<ButtonVariant, string> = {
      primary: `
        bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze
        text-white font-semibold
        hover:opacity-90 active:opacity-80
        shadow-neon-cyan
      `,
      secondary: `
        bg-white/10 text-white
        hover:bg-white/15 active:bg-white/20
        backdrop-blur-sm
      `,
      outline: `
        bg-transparent border-2 border-genz-electric-blue
        text-genz-electric-blue font-semibold
        hover:bg-genz-electric-blue/10 active:bg-genz-electric-blue/20
      `,
      ghost: `
        bg-transparent text-white/80
        hover:bg-white/5 active:bg-white/10
      `,
      danger: `
        bg-gradient-to-r from-red-500 to-red-600
        text-white font-semibold
        hover:opacity-90 active:opacity-80
        shadow-neon-pink
      `,
      success: `
        bg-gradient-to-r from-green-500 to-emerald-500
        text-white font-semibold
        hover:opacity-90 active:opacity-80
        shadow-neon-green
      `,
      neon: `
        bg-dark-surface border-2 border-genz-neon-green
        text-genz-neon-green font-bold
        hover:bg-genz-neon-green/10 active:bg-genz-neon-green/20
        hover:shadow-neon-green
      `,
    };

    const sizes: Record<ButtonSize, string> = {
      xs: 'min-h-[32px] text-xs px-3 py-1.5 rounded-lg gap-1',
      sm: 'min-h-[36px] text-sm px-4 py-2 rounded-xl gap-1.5',
      md: 'min-h-touch text-base px-5 py-3 rounded-xl gap-2',
      lg: 'min-h-touch-lg text-lg px-6 py-3.5 rounded-2xl gap-2',
      xl: 'min-h-touch-xl text-xl px-8 py-4 rounded-2xl gap-3',
    };

    const iconSizes: Record<ButtonSize, string> = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-7 h-7',
    };

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        // Haptic feedback
        if (hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(10);
        }

        // Ripple effect
        if (ripple && !disabled && !loading) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const id = Date.now();

          setRipples(prev => [...prev, { id, x, y }]);

          setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id));
          }, 600);
        }

        // Call original onClick
        if (onClick && !disabled && !loading) {
          onClick(e);
        }
      },
      [hapticFeedback, ripple, disabled, loading, onClick]
    );

    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          relative inline-flex items-center justify-center
          touch-manipulation no-tap-highlight select-none
          transition-all duration-200
          overflow-hidden
          ${variants[variant]}
          ${sizes[size]}
          ${fullWidth ? 'w-full' : ''}
          ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        {...props}
      >
        {/* Ripple effects */}
        {ripples.map(({ id, x, y }) => (
          <motion.span
            key={id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{
              left: x - 10,
              top: y - 10,
              width: 20,
              height: 20,
            }}
          />
        ))}

        {/* Content */}
        <span className="relative flex items-center justify-center gap-inherit">
          {loading ? (
            <>
              <Loader2 className={`animate-spin ${iconSizes[size]}`} />
              {loadingText && <span>{loadingText}</span>}
            </>
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <span className={iconSizes[size]}>{icon}</span>
              )}
              {children}
              {icon && iconPosition === 'right' && (
                <span className={iconSizes[size]}>{icon}</span>
              )}
            </>
          )}
        </span>
      </motion.button>
    );
  }
);

MobileButton.displayName = 'MobileButton';

// Icon Button variant
interface MobileIconButtonProps extends Omit<MobileButtonProps, 'icon' | 'iconPosition'> {
  'aria-label': string;
}

export const MobileIconButton = forwardRef<HTMLButtonElement, MobileIconButtonProps>(
  ({ size = 'md', className = '', children, ...props }, ref) => {
    const iconSizes: Record<ButtonSize, string> = {
      xs: 'w-8 h-8',
      sm: 'w-10 h-10',
      md: 'w-11 h-11',
      lg: 'w-12 h-12',
      xl: 'w-14 h-14',
    };

    return (
      <MobileButton
        ref={ref}
        size={size}
        className={`!p-0 ${iconSizes[size]} ${className}`}
        {...props}
      >
        {children}
      </MobileButton>
    );
  }
);

MobileIconButton.displayName = 'MobileIconButton';

// Floating Action Button
interface MobileFABProps extends Omit<MobileButtonProps, 'size' | 'fullWidth'> {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'md' | 'lg';
}

export const MobileFAB = forwardRef<HTMLButtonElement, MobileFABProps>(
  ({ position = 'bottom-right', size = 'lg', className = '', ...props }, ref) => {
    const positions = {
      'bottom-right': 'fixed bottom-24 right-4',
      'bottom-left': 'fixed bottom-24 left-4',
      'bottom-center': 'fixed bottom-24 left-1/2 -translate-x-1/2',
    };

    const sizes = {
      md: 'w-12 h-12',
      lg: 'w-14 h-14',
    };

    return (
      <MobileButton
        ref={ref}
        variant="primary"
        className={`
          ${positions[position]}
          ${sizes[size]}
          !rounded-full !p-0
          shadow-genz-glow z-40
          safe-bottom
          ${className}
        `}
        {...props}
      />
    );
  }
);

MobileFAB.displayName = 'MobileFAB';

// Button Group
interface MobileButtonGroupProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  fullWidth?: boolean;
  className?: string;
}

export function MobileButtonGroup({
  children,
  direction = 'horizontal',
  fullWidth = false,
  className = '',
}: MobileButtonGroupProps) {
  return (
    <div
      className={`
        flex gap-2
        ${direction === 'vertical' ? 'flex-col' : 'flex-row'}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Segmented Control (iOS-style toggle)
interface SegmentOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface MobileSegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: SegmentOption[];
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export function MobileSegmentedControl({
  value,
  onChange,
  options,
  size = 'md',
  fullWidth = false,
  className = '',
}: MobileSegmentedControlProps) {
  const sizes = {
    sm: 'min-h-[36px] text-sm',
    md: 'min-h-touch text-base',
    lg: 'min-h-touch-lg text-lg',
  };

  return (
    <div
      className={`
        inline-flex p-1 rounded-xl bg-dark-surface/50 border border-white/10
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <motion.button
            key={option.value}
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(10);
              onChange(option.value);
            }}
            className={`
              relative flex-1 flex items-center justify-center gap-2
              px-4 py-2 rounded-lg font-medium
              transition-colors duration-200
              ${sizes[size]}
              ${isActive ? 'text-white' : 'text-white/60 hover:text-white/80'}
            `}
          >
            {isActive && (
              <motion.div
                layoutId="segment-active"
                className="absolute inset-0 bg-genz-electric-blue/20 rounded-lg border border-genz-electric-blue/30"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {option.icon}
              {option.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

export default MobileButton;
