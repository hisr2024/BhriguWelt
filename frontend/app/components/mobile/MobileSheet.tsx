'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import { X } from 'lucide-react';

interface MobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  initialSnap?: number;
  showHandle?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
  preventClose?: boolean;
}

export default function MobileSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.5, 0.9],
  initialSnap = 0,
  showHandle = true,
  showCloseButton = true,
  className = '',
  overlayClassName = '',
  preventClose = false,
}: MobileSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);

  // Get window height for calculations
  const getWindowHeight = useCallback(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight;
    }
    return 800;
  }, []);

  // Calculate snap positions in pixels
  const getSnapPositions = useCallback(() => {
    const windowHeight = getWindowHeight();
    return snapPoints.map(snap => windowHeight * (1 - snap));
  }, [snapPoints, getWindowHeight]);

  // Handle drag end - snap to nearest point
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);
      const positions = getSnapPositions();
      const currentY = info.point.y;
      const velocity = info.velocity.y;

      // If dragged down fast, close the sheet
      if (velocity > 500 && !preventClose) {
        onClose();
        return;
      }

      // Find nearest snap point
      let nearestSnap = 0;
      let minDistance = Infinity;

      positions.forEach((pos, index) => {
        const distance = Math.abs(currentY - pos);
        if (distance < minDistance) {
          minDistance = distance;
          nearestSnap = index;
        }
      });

      // If dragged past the lowest snap point, close
      if (currentY > positions[0] + 100 && !preventClose) {
        onClose();
        return;
      }

      setCurrentSnap(nearestSnap);
      controls.start({
        y: positions[nearestSnap],
        transition: { type: 'spring', damping: 30, stiffness: 300 },
      });
    },
    [controls, getSnapPositions, onClose, preventClose]
  );

  // Initialize position when opened
  useEffect(() => {
    if (isOpen) {
      const positions = getSnapPositions();
      controls.start({
        y: positions[initialSnap],
        transition: { type: 'spring', damping: 30, stiffness: 300 },
      });
    }
  }, [isOpen, controls, getSnapPositions, initialSnap]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !preventClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, preventClose]);

  // Haptic feedback on drag start
  const handleDragStart = () => {
    setIsDragging(true);
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-sheet ${overlayClassName}`}
            onClick={() => !preventClose && onClose()}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={controls}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: getSnapPositions()[snapPoints.length - 1], bottom: getWindowHeight() }}
            dragElastic={0.1}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`
              fixed left-0 right-0 bottom-0 z-sheet
              bg-dark-elevated/95 backdrop-blur-2xl
              rounded-t-sheet border-t border-white/10
              shadow-mobile-sheet
              touch-pan-y
              ${className}
            `}
            style={{ height: '100vh', maxHeight: '95vh' }}
          >
            {/* Handle */}
            {showHandle && (
              <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                <div
                  className={`
                    w-10 h-1 rounded-full bg-white/30
                    transition-all duration-200
                    ${isDragging ? 'w-12 bg-genz-electric-blue' : ''}
                  `}
                />
              </div>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                {title && (
                  <h2 className="text-lg font-display font-bold text-white">
                    {title}
                  </h2>
                )}
                {showCloseButton && !preventClose && (
                  <button
                    onClick={onClose}
                    className="btn-touch p-2 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-white/80" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div
              className="overflow-y-auto overscroll-contain momentum-scroll"
              style={{ maxHeight: 'calc(95vh - 100px)' }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Action Sheet variant for quick actions
interface ActionSheetItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface MobileActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  items: ActionSheetItem[];
  showCancel?: boolean;
  cancelLabel?: string;
}

export function MobileActionSheet({
  isOpen,
  onClose,
  title,
  message,
  items,
  showCancel = true,
  cancelLabel = 'Cancel',
}: MobileActionSheetProps) {
  return (
    <MobileSheet
      isOpen={isOpen}
      onClose={onClose}
      snapPoints={[0.4]}
      showHandle={true}
      showCloseButton={false}
    >
      <div className="p-4 safe-bottom">
        {(title || message) && (
          <div className="text-center mb-4">
            {title && (
              <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
            )}
            {message && (
              <p className="text-sm text-white/60">{message}</p>
            )}
          </div>
        )}

        <div className="space-y-1">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                onClose();
              }}
              disabled={item.disabled}
              className={`
                w-full btn-touch rounded-xl text-left
                flex items-center gap-3
                transition-all duration-200
                ${item.destructive
                  ? 'text-red-400 hover:bg-red-500/10 active:bg-red-500/20'
                  : 'text-white hover:bg-white/5 active:bg-white/10'
                }
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {item.icon && (
                <span className="flex-shrink-0">{item.icon}</span>
              )}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {showCancel && (
          <button
            onClick={onClose}
            className="w-full btn-touch mt-4 rounded-xl bg-white/10 text-white font-semibold
              hover:bg-white/15 active:bg-white/20 transition-colors"
          >
            {cancelLabel}
          </button>
        )}
      </div>
    </MobileSheet>
  );
}
