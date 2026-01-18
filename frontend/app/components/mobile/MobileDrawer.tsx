'use client';

import { useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  children?: React.ReactNode;
  width?: string;
  className?: string;
  showCloseButton?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export default function MobileDrawer({
  isOpen,
  onClose,
  position = 'left',
  children,
  width = '85%',
  className = '',
  showCloseButton = true,
  header,
  footer,
}: MobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle drag to close
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = 100;
      const velocity = position === 'left' ? info.velocity.x : -info.velocity.x;
      const offset = position === 'left' ? info.offset.x : -info.offset.x;

      if (velocity < -500 || offset < -threshold) {
        onClose();
      }
    },
    [onClose, position]
  );

  // Handle escape key and body scroll lock
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
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
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      const focusableElements = drawerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleTab = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTab);
      firstElement?.focus();

      return () => {
        document.removeEventListener('keydown', handleTab);
      };
    }
  }, [isOpen]);

  const slideVariants = {
    left: {
      initial: { x: '-100%' },
      animate: { x: 0 },
      exit: { x: '-100%' },
    },
    right: {
      initial: { x: '100%' },
      animate: { x: 0 },
      exit: { x: '100%' },
    },
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
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-drawer"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            initial={slideVariants[position].initial}
            animate={slideVariants[position].animate}
            exit={slideVariants[position].exit}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: position === 'left' ? -200 : 0, right: position === 'right' ? 200 : 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={`
              fixed top-0 bottom-0 z-drawer
              ${position === 'left' ? 'left-0' : 'right-0'}
              bg-dark-surface/95 backdrop-blur-2xl
              border-${position === 'left' ? 'r' : 'l'} border-white/10
              flex flex-col
              safe-y
              ${className}
            `}
            style={{ width, maxWidth: '320px' }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 safe-top">
              {header || <div />}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="btn-touch p-2 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-white/80" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain momentum-scroll p-4">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-4 border-t border-white/10 safe-bottom">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Navigation Drawer with pre-built nav items
export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeColor?: 'primary' | 'success' | 'warning' | 'error';
  children?: NavItem[];
}

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function MobileNavDrawer({
  isOpen,
  onClose,
  items,
  header,
  footer,
}: MobileNavDrawerProps) {
  const pathname = usePathname();

  const badgeColors = {
    primary: 'bg-genz-electric-blue text-dark-base',
    success: 'bg-genz-neon-green text-dark-base',
    warning: 'bg-genz-cyber-yellow text-dark-base',
    error: 'bg-genz-hot-pink text-white',
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const isActive = pathname === item.href;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.href}>
        <Link
          href={item.href}
          onClick={onClose}
          className={`
            flex items-center gap-3 btn-touch rounded-xl w-full
            transition-all duration-200
            ${depth > 0 ? 'pl-8' : ''}
            ${isActive
              ? 'bg-genz-electric-blue/10 text-genz-electric-blue border-l-2 border-genz-electric-blue'
              : 'text-white/80 hover:bg-white/5 hover:text-white active:bg-white/10'
            }
          `}
        >
          {item.icon && (
            <span className={`flex-shrink-0 ${isActive ? 'text-genz-electric-blue' : 'text-white/60'}`}>
              {item.icon}
            </span>
          )}
          <span className="flex-1 font-medium">{item.label}</span>
          {item.badge !== undefined && (
            <span className={`
              px-2 py-0.5 text-xs font-bold rounded-full
              ${badgeColors[item.badgeColor || 'primary']}
            `}>
              {item.badge}
            </span>
          )}
          {hasChildren && (
            <ChevronRight className="w-4 h-4 text-white/40" />
          )}
        </Link>

        {hasChildren && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <MobileDrawer
      isOpen={isOpen}
      onClose={onClose}
      position="left"
      header={header}
      footer={footer}
    >
      <nav className="space-y-1">
        {items.map(item => renderNavItem(item))}
      </nav>
    </MobileDrawer>
  );
}
