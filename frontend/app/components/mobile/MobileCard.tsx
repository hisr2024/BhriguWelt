'use client';

import { forwardRef, useState, useCallback } from 'react';
import { motion, HTMLMotionProps, PanInfo } from 'framer-motion';
import { ChevronRight, MoreVertical } from 'lucide-react';

// Card variants
type CardVariant = 'default' | 'glass' | 'elevated' | 'outline' | 'gradient' | 'neon';

interface MobileCardProps extends HTMLMotionProps<'div'> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg' | 'xl';
  pressable?: boolean;
  swipeable?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onPress?: () => void;
  hapticFeedback?: boolean;
}

export const MobileCard = forwardRef<HTMLDivElement, MobileCardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      rounded = 'lg',
      pressable = false,
      swipeable = false,
      onSwipeLeft,
      onSwipeRight,
      onPress,
      hapticFeedback = true,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isPressed, setIsPressed] = useState(false);

    const variants: Record<CardVariant, string> = {
      default: `
        bg-dark-card/80 border border-white/10
        backdrop-blur-sm
      `,
      glass: `
        bg-white/5 border border-white/10
        backdrop-blur-xl
      `,
      elevated: `
        bg-dark-elevated shadow-mobile-lg
        border border-white/5
      `,
      outline: `
        bg-transparent border-2 border-white/20
      `,
      gradient: `
        bg-gradient-to-br from-dark-surface/80 to-dark-elevated/80
        border border-white/10 backdrop-blur-xl
      `,
      neon: `
        bg-dark-card/50 border-2 border-genz-electric-blue/30
        backdrop-blur-xl
        hover:border-genz-electric-blue/50 hover:shadow-neon-cyan
      `,
    };

    const paddings: Record<string, string> = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    const roundedness: Record<string, string> = {
      sm: 'rounded-lg',
      md: 'rounded-xl',
      lg: 'rounded-2xl',
      xl: 'rounded-3xl',
    };

    const handleDragEnd = useCallback(
      (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100;
        const velocity = info.velocity.x;
        const offset = info.offset.x;

        if (velocity < -500 || offset < -threshold) {
          if (hapticFeedback && 'vibrate' in navigator) navigator.vibrate(15);
          onSwipeLeft?.();
        } else if (velocity > 500 || offset > threshold) {
          if (hapticFeedback && 'vibrate' in navigator) navigator.vibrate(15);
          onSwipeRight?.();
        }
      },
      [onSwipeLeft, onSwipeRight, hapticFeedback]
    );

    const handlePress = useCallback(() => {
      if (hapticFeedback && 'vibrate' in navigator) navigator.vibrate(10);
      onPress?.();
    }, [onPress, hapticFeedback]);

    return (
      <motion.div
        ref={ref}
        whileTap={pressable ? { scale: 0.98 } : undefined}
        drag={swipeable ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragEnd={swipeable ? handleDragEnd : undefined}
        onTapStart={() => pressable && setIsPressed(true)}
        onTap={() => {
          setIsPressed(false);
          pressable && handlePress();
        }}
        onTapCancel={() => setIsPressed(false)}
        className={`
          ${variants[variant]}
          ${paddings[padding]}
          ${roundedness[rounded]}
          ${pressable ? 'cursor-pointer touch-manipulation select-none' : ''}
          transition-all duration-200
          ${isPressed ? 'brightness-95' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

MobileCard.displayName = 'MobileCard';

// List Item Card
interface MobileListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  leftIcon?: React.ReactNode;
  leftImage?: string;
  rightIcon?: React.ReactNode;
  rightText?: string;
  showChevron?: boolean;
  showMore?: boolean;
  badge?: React.ReactNode;
  onPress?: () => void;
  onMorePress?: () => void;
  disabled?: boolean;
  className?: string;
}

export function MobileListItem({
  title,
  subtitle,
  description,
  leftIcon,
  leftImage,
  rightIcon,
  rightText,
  showChevron = true,
  showMore = false,
  badge,
  onPress,
  onMorePress,
  disabled = false,
  className = '',
}: MobileListItemProps) {
  return (
    <MobileCard
      variant="default"
      padding="none"
      pressable={!!onPress && !disabled}
      onPress={onPress}
      className={`
        ${disabled ? 'opacity-50' : ''}
        ${className}
      `}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Left content */}
        {(leftIcon || leftImage) && (
          <div className="flex-shrink-0">
            {leftImage ? (
              <img
                src={leftImage}
                alt=""
                className="w-12 h-12 rounded-xl object-cover bg-white/5"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-genz-electric-blue/10 flex items-center justify-center text-genz-electric-blue">
                {leftIcon}
              </div>
            )}
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white truncate">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-genz-electric-blue truncate">{subtitle}</p>
          )}
          {description && (
            <p className="text-sm text-white/60 truncate mt-0.5">{description}</p>
          )}
        </div>

        {/* Right content */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {rightText && (
            <span className="text-sm text-white/60">{rightText}</span>
          )}
          {rightIcon}
          {showMore && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMorePress?.();
              }}
              className="btn-touch p-2 -mr-2 rounded-lg hover:bg-white/5"
            >
              <MoreVertical className="w-5 h-5 text-white/40" />
            </button>
          )}
          {showChevron && !showMore && (
            <ChevronRight className="w-5 h-5 text-white/40" />
          )}
        </div>
      </div>
    </MobileCard>
  );
}

// Feature Card with icon
interface MobileFeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconColor?: string;
  badge?: string;
  onPress?: () => void;
  className?: string;
}

export function MobileFeatureCard({
  title,
  description,
  icon,
  iconColor = 'from-genz-electric-blue to-genz-purple-haze',
  badge,
  onPress,
  className = '',
}: MobileFeatureCardProps) {
  return (
    <MobileCard
      variant="glass"
      pressable={!!onPress}
      onPress={onPress}
      className={`group ${className}`}
    >
      {badge && (
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 text-xs font-bold rounded-full bg-genz-electric-blue/20 text-genz-electric-blue">
            {badge}
          </span>
        </div>
      )}

      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${iconColor} flex items-center justify-center mb-4 shadow-neon-cyan group-hover:scale-110 transition-transform`}>
        {icon}
      </div>

      <h3 className="text-lg font-display font-bold text-white mb-2 group-hover:text-genz-electric-blue transition-colors">
        {title}
      </h3>

      <p className="text-sm text-white/60 line-clamp-2">
        {description}
      </p>

      <div className="flex items-center text-genz-electric-blue font-semibold mt-4 text-sm">
        Explore
        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </div>
    </MobileCard>
  );
}

// Stat Card
interface MobileStatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onPress?: () => void;
  className?: string;
}

export function MobileStatCard({
  value,
  label,
  icon,
  trend,
  onPress,
  className = '',
}: MobileStatCardProps) {
  return (
    <MobileCard
      variant="gradient"
      pressable={!!onPress}
      onPress={onPress}
      className={`text-center ${className}`}
    >
      {icon && (
        <div className="flex justify-center mb-3 text-genz-electric-blue">
          {icon}
        </div>
      )}

      <div className="text-3xl font-display font-extrabold bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze bg-clip-text text-transparent mb-1">
        {value}
      </div>

      <div className="text-sm text-white/60 font-medium">{label}</div>

      {trend && (
        <div className={`text-xs font-semibold mt-2 ${trend.isPositive ? 'text-genz-neon-green' : 'text-red-400'}`}>
          {trend.isPositive ? '+' : ''}{trend.value}%
        </div>
      )}
    </MobileCard>
  );
}

// Card Stack (swipeable cards)
interface MobileCardStackProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => React.ReactNode;
  onSwipeLeft?: (item: T) => void;
  onSwipeRight?: (item: T) => void;
  className?: string;
}

export function MobileCardStack<T>({
  items,
  renderCard,
  onSwipeLeft,
  onSwipeRight,
  className = '',
}: MobileCardStackProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const item = items[currentIndex];
      if (direction === 'left') {
        onSwipeLeft?.(item);
      } else {
        onSwipeRight?.(item);
      }
      setCurrentIndex(prev => Math.min(prev + 1, items.length - 1));
    },
    [currentIndex, items, onSwipeLeft, onSwipeRight]
  );

  return (
    <div className={`relative h-[400px] ${className}`}>
      {items.slice(currentIndex, currentIndex + 3).map((item, idx) => {
        const isTop = idx === 0;

        return (
          <motion.div
            key={currentIndex + idx}
            className="absolute inset-0"
            style={{
              zIndex: 3 - idx,
              scale: 1 - idx * 0.05,
              y: idx * 10,
            }}
            drag={isTop ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              if (info.offset.x > 100) handleSwipe('right');
              else if (info.offset.x < -100) handleSwipe('left');
            }}
          >
            {renderCard(item, currentIndex + idx)}
          </motion.div>
        );
      })}
    </div>
  );
}

export default MobileCard;
