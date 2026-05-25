'use client';

import { motion, AnimatePresence, useMotionValue, PanInfo } from 'framer-motion';
import { ReactNode, useState, useCallback, useRef } from 'react';
import { Loader2, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MobilePageWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  headerRight?: ReactNode;
  pullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  bottomPadding?: boolean;
  headerTransparent?: boolean;
  headerGradient?: string;
  className?: string;
}

export default function MobilePageWrapper({
  children,
  title,
  subtitle,
  showBackButton = false,
  onBack,
  headerRight,
  pullToRefresh = false,
  onRefresh,
  bottomPadding = true,
  headerTransparent = false,
  headerGradient,
  className = '',
}: MobilePageWrapperProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

  // Pull-to-refresh handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!pullToRefresh || !containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    if (scrollTop <= 0 && e.touches[0]) {
      startY.current = e.touches[0].clientY;
    }
  }, [pullToRefresh]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pullToRefresh || !containerRef.current || isRefreshing) return;
    const scrollTop = containerRef.current.scrollTop;
    if (scrollTop > 0) return;

    currentY.current = e.touches[0]?.clientY ?? currentY.current;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      const distance = Math.min(diff * 0.5, MAX_PULL);
      setPullDistance(distance);
    }
  }, [pullToRefresh, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pullToRefresh || isRefreshing) return;

    if (pullDistance >= PULL_THRESHOLD && onRefresh) {
      setIsRefreshing(true);
      // Trigger haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([10, 50, 10]);
      }
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pullToRefresh, pullDistance, onRefresh, isRefreshing]);

  const handleBack = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }, [onBack, router]);

  // Pull indicator rotation
  const pullRotation = Math.min((pullDistance / PULL_THRESHOLD) * 360, 360);
  const pullScale = Math.min(pullDistance / PULL_THRESHOLD, 1);

  return (
    <div className={`min-h-screen relative ${className}`}>
      {/* Header */}
      {(title || showBackButton || headerRight) && (
        <motion.header
          className={`fixed top-0 left-0 right-0 z-40 ${
            headerTransparent
              ? 'bg-transparent'
              : 'bg-dark-elevated/80 backdrop-blur-2xl border-b border-white/10'
          }`}
          style={headerGradient ? { background: headerGradient } : undefined}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Safe area top padding */}
          <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />

          <div className="flex items-center justify-between px-4 h-14">
            {/* Left section */}
            <div className="flex items-center gap-2 flex-1">
              {showBackButton && (
                <motion.button
                  onClick={handleBack}
                  className="p-2 -ml-2 rounded-xl hover:bg-white/10 active:bg-white/5 transition-colors touch-manipulation"
                  whileTap={{ scale: 0.9 }}
                  aria-label="Go back"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </motion.button>
              )}

              {title && (
                <div className="flex flex-col min-w-0">
                  <motion.h1
                    className="text-lg font-bold text-white truncate"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {title}
                  </motion.h1>
                  {subtitle && (
                    <motion.p
                      className="text-xs text-white/60 truncate"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      {subtitle}
                    </motion.p>
                  )}
                </div>
              )}
            </div>

            {/* Right section */}
            {headerRight && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                {headerRight}
              </motion.div>
            )}
          </div>
        </motion.header>
      )}

      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            className="fixed left-1/2 z-50 flex items-center justify-center"
            style={{
              top: `calc(env(safe-area-inset-top, 0px) + ${title ? '56px' : '0px'} + ${Math.min(pullDistance, MAX_PULL)}px - 20px)`,
            }}
            initial={{ opacity: 0, scale: 0, x: '-50%' }}
            animate={{
              opacity: 1,
              scale: pullScale,
              x: '-50%',
            }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <motion.div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isRefreshing || pullDistance >= PULL_THRESHOLD
                  ? 'bg-genz-electric-blue shadow-neon-cyan'
                  : 'bg-dark-elevated/90 backdrop-blur-xl border border-white/20'
              }`}
              animate={{
                rotate: isRefreshing ? 360 : pullRotation,
              }}
              transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
            >
              <Loader2 className={`w-5 h-5 ${
                isRefreshing || pullDistance >= PULL_THRESHOLD
                  ? 'text-white'
                  : 'text-white/60'
              }`} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.main
        ref={containerRef}
        className={`min-h-screen overflow-y-auto overscroll-contain ${
          title || showBackButton ? 'pt-14' : ''
        } ${bottomPadding ? 'pb-24 md:pb-8' : ''}`}
        style={{
          paddingTop: title || showBackButton
            ? `calc(env(safe-area-inset-top, 0px) + 56px)`
            : 'env(safe-area-inset-top, 0px)',
          transform: `translateY(${pullDistance * 0.3}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.main>
    </div>
  );
}

// Mobile header component for simpler use cases
export function MobileHeader({
  title,
  subtitle,
  leftAction,
  rightAction,
  transparent = false,
}: {
  title: string;
  subtitle?: string;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  transparent?: boolean;
}) {
  return (
    <header
      className={`sticky top-0 z-40 ${
        transparent
          ? 'bg-transparent'
          : 'bg-dark-elevated/80 backdrop-blur-2xl border-b border-white/10'
      }`}
    >
      <div style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} />
      <div className="flex items-center justify-between px-4 h-14">
        <div className="w-10">{leftAction}</div>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-white/60">{subtitle}</p>}
        </div>
        <div className="w-10">{rightAction}</div>
      </div>
    </header>
  );
}

// Bottom sheet component for mobile
export function MobileBottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.5, 0.9],
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[];
}) {
  const y = useMotionValue(0);
  const [currentSnap, setCurrentSnap] = useState(0);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (velocity > 500 || offset > 100) {
      onClose();
    } else if (velocity < -500) {
      setCurrentSnap(Math.min(currentSnap + 1, snapPoints.length - 1));
    }
  };

  const sheetHeight = typeof window !== 'undefined'
    ? window.innerHeight * (snapPoints[currentSnap] ?? 0.5)
    : 400;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-dark-elevated rounded-t-3xl overflow-hidden"
            style={{ y, maxHeight: '90vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0, height: sheetHeight }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-white/30 rounded-full" />
            </div>

            {/* Title */}
            {title && (
              <div className="px-6 pb-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">{title}</h2>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto overscroll-contain p-6" style={{ maxHeight: 'calc(100% - 60px)' }}>
              {children}
            </div>

            {/* Safe area bottom */}
            <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Swipeable card stack component
export function SwipeableCardStack({
  children,
  onSwipeLeft,
  onSwipeRight,
}: {
  children: ReactNode[];
  onSwipeLeft?: (index: number) => void;
  onSwipeRight?: (index: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, index: number) => {
    const threshold = 100;
    if (info.offset.x > threshold) {
      onSwipeRight?.(index);
      setCurrentIndex((prev) => Math.min(prev + 1, children.length - 1));
    } else if (info.offset.x < -threshold) {
      onSwipeLeft?.(index);
      setCurrentIndex((prev) => Math.min(prev + 1, children.length - 1));
    }
  };

  return (
    <div className="relative w-full h-[400px]">
      {children.map((child, index) => {
        if (index < currentIndex) return null;
        const isTop = index === currentIndex;

        return (
          <motion.div
            key={index}
            className="absolute inset-0"
            style={{
              zIndex: children.length - index,
            }}
            initial={{ scale: 0.95, y: 20 }}
            animate={{
              scale: isTop ? 1 : 0.95 - (index - currentIndex) * 0.05,
              y: isTop ? 0 : (index - currentIndex) * 10,
              opacity: index - currentIndex > 2 ? 0 : 1,
            }}
            drag={isTop ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, info) => handleDragEnd(e, info, index)}
            whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
          >
            {child}
          </motion.div>
        );
      })}
    </div>
  );
}
