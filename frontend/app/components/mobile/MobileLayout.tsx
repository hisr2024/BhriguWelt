'use client';

import { ReactNode, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePullToRefresh, useScrollDirection, useMobileDetection } from './hooks';
import MobileHeader from './MobileHeader';
import { Loader2 } from 'lucide-react';

interface MobileLayoutProps {
  children: ReactNode;
  header?: {
    title?: string;
    subtitle?: string;
    showBack?: boolean;
    showMenu?: boolean;
    showSearch?: boolean;
    transparent?: boolean;
    hideOnScroll?: boolean;
    rightActions?: ReactNode;
    navItems?: any[];
    logo?: ReactNode;
  };
  showBottomNav?: boolean;
  enablePullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  className?: string;
  contentClassName?: string;
  padHeader?: boolean;
  padBottom?: boolean;
}

export default function MobileLayout({
  children,
  header,
  showBottomNav = true,
  enablePullToRefresh = false,
  onRefresh,
  className = '',
  contentClassName = '',
  padHeader = true,
  padBottom = true,
}: MobileLayoutProps) {
  const { isMobile } = useMobileDetection();
  const { direction, isAtTop } = useScrollDirection();

  // Pull to refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullProgress(0);
    }
  }, [onRefresh]);

  return (
    <div className={`min-h-screen-mobile flex flex-col ${className}`}>
      {/* Header */}
      {header && (
        <MobileHeader
          title={header.title}
          subtitle={header.subtitle}
          showBack={header.showBack}
          showMenu={header.showMenu}
          showSearch={header.showSearch}
          transparent={header.transparent}
          hideOnScroll={header.hideOnScroll}
          rightActions={header.rightActions}
          navItems={header.navItems}
          logo={header.logo}
        />
      )}

      {/* Pull to Refresh Indicator */}
      {enablePullToRefresh && (
        <AnimatePresence>
          {(pullProgress > 0 || isRefreshing) && (
            <motion.div
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="fixed top-16 left-0 right-0 z-30 flex justify-center"
            >
              <div className="bg-dark-elevated/90 backdrop-blur-xl rounded-full p-3 shadow-mobile-lg">
                {isRefreshing ? (
                  <Loader2 className="w-6 h-6 text-genz-electric-blue animate-spin" />
                ) : (
                  <motion.div
                    animate={{ rotate: pullProgress * 180 }}
                    className="w-6 h-6 border-2 border-genz-electric-blue/30 border-t-genz-electric-blue rounded-full"
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Main Content */}
      <div
        className={`
          flex-1 overflow-x-hidden
          ${padHeader && header ? 'pt-14' : ''}
          ${padBottom && showBottomNav && isMobile ? 'pb-nav-safe' : ''}
          ${contentClassName}
        `}
      >
        {children}
      </div>
    </div>
  );
}

// Container component for consistent padding
interface MobileContainerProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  className?: string;
}

export function MobileContainer({
  children,
  size = 'lg',
  padding = true,
  className = '',
}: MobileContainerProps) {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={`
        w-full mx-auto
        ${sizes[size]}
        ${padding ? 'px-4 sm:px-6 lg:px-8' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Section component for consistent spacing
interface MobileSectionProps {
  children: ReactNode;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  id?: string;
}

export function MobileSection({
  children,
  spacing = 'md',
  className = '',
  id,
}: MobileSectionProps) {
  const spacings = {
    sm: 'py-6 md:py-8',
    md: 'py-8 md:py-12',
    lg: 'py-12 md:py-16',
    xl: 'py-16 md:py-24',
  };

  return (
    <section id={id} className={`${spacings[spacing]} ${className}`}>
      {children}
    </section>
  );
}

// Grid component for responsive layouts
interface MobileGridProps {
  children: ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MobileGrid({
  children,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 'md',
  className = '',
}: MobileGridProps) {
  const gaps = {
    sm: 'gap-3',
    md: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8',
  };

  const gridCols = `
    grid-cols-${cols.default || 1}
    ${cols.sm ? `sm:grid-cols-${cols.sm}` : ''}
    ${cols.md ? `md:grid-cols-${cols.md}` : ''}
    ${cols.lg ? `lg:grid-cols-${cols.lg}` : ''}
  `;

  return (
    <div className={`grid ${gridCols} ${gaps[gap]} ${className}`}>
      {children}
    </div>
  );
}

// Stack component for vertical layouts
interface MobileStackProps {
  children: ReactNode;
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function MobileStack({
  children,
  spacing = 'md',
  className = '',
}: MobileStackProps) {
  const spacings = {
    xs: 'space-y-1',
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6',
    xl: 'space-y-8',
  };

  return (
    <div className={`flex flex-col ${spacings[spacing]} ${className}`}>
      {children}
    </div>
  );
}

// Row component for horizontal layouts
interface MobileRowProps {
  children: ReactNode;
  spacing?: 'xs' | 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  className?: string;
}

export function MobileRow({
  children,
  spacing = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
  className = '',
}: MobileRowProps) {
  const spacings = {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };

  const alignments = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  const justifications = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  };

  return (
    <div
      className={`
        flex
        ${spacings[spacing]}
        ${alignments[align]}
        ${justifications[justify]}
        ${wrap ? 'flex-wrap' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Divider component
interface MobileDividerProps {
  variant?: 'full' | 'inset' | 'middle';
  className?: string;
}

export function MobileDivider({ variant = 'full', className = '' }: MobileDividerProps) {
  const variants = {
    full: '',
    inset: 'ml-4',
    middle: 'mx-4',
  };

  return (
    <hr className={`border-t border-white/10 ${variants[variant]} ${className}`} />
  );
}

// Spacer component
interface MobileSpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function MobileSpacer({ size = 'md' }: MobileSpacerProps) {
  const sizes = {
    xs: 'h-2',
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-12',
    '2xl': 'h-16',
  };

  return <div className={sizes[size]} />;
}
