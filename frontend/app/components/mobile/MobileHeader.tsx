'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Menu, ArrowLeft, Search, Bell, Settings, MoreVertical, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { MobileNavDrawer, NavItem } from './MobileDrawer';

interface MobileHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showMenu?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showSettings?: boolean;
  showMore?: boolean;
  onBackClick?: () => void;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
  onMoreClick?: () => void;
  leftAction?: React.ReactNode;
  rightActions?: React.ReactNode;
  centerContent?: React.ReactNode;
  className?: string;
  transparent?: boolean;
  hideOnScroll?: boolean;
  notificationCount?: number;
  navItems?: NavItem[];
  logo?: React.ReactNode;
}

export default function MobileHeader({
  title,
  subtitle,
  showBack = false,
  showMenu = true,
  showSearch = false,
  showNotifications = false,
  showSettings = false,
  showMore = false,
  onBackClick,
  onSearchClick,
  onNotificationsClick,
  onSettingsClick,
  onMoreClick,
  leftAction,
  rightActions,
  centerContent,
  className = '',
  transparent = false,
  hideOnScroll = false,
  notificationCount = 0,
  navItems = [],
  logo,
}: MobileHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 50], transparent ? [0, 1] : [1, 1]);
  const headerBlur = useTransform(scrollY, [0, 50], transparent ? [0, 12] : [12, 12]);

  // Hide on scroll behavior
  useEffect(() => {
    if (!hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;

      if (currentScrollY > 100) {
        setIsVisible(!isScrollingDown);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, hideOnScroll]);

  const handleBack = useCallback(() => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.back();
    }
  }, [onBackClick, router]);

  const handleSearch = useCallback(() => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      setIsSearchOpen(true);
    }
  }, [onSearchClick]);

  // Haptic feedback helper
  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  return (
    <>
      <motion.header
        className={`
          fixed top-0 left-0 right-0 z-header
          transition-transform duration-300
          ${isVisible ? 'translate-y-0' : '-translate-y-full'}
          ${className}
        `}
        style={{
          backgroundColor: transparent ? undefined : 'rgba(18, 18, 24, 0.85)',
        }}
      >
        <motion.div
          className="border-b border-white/10 safe-top"
          style={{
            opacity: headerOpacity,
            backdropFilter: useTransform(headerBlur, v => `blur(${v}px)`),
          }}
        >
          <div className="flex items-center justify-between h-14 px-4">
            {/* Left Section */}
            <div className="flex items-center gap-2 min-w-[60px]">
              {leftAction ? (
                leftAction
              ) : showBack ? (
                <button
                  onClick={() => { triggerHaptic(); handleBack(); }}
                  className="btn-touch p-2 -ml-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              ) : showMenu ? (
                <button
                  onClick={() => { triggerHaptic(); setIsDrawerOpen(true); }}
                  className="btn-touch p-2 -ml-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5 text-white" />
                </button>
              ) : logo ? (
                <Link href="/" className="flex items-center">
                  {logo}
                </Link>
              ) : null}
            </div>

            {/* Center Section */}
            <div className="flex-1 flex items-center justify-center min-w-0 px-2">
              {centerContent ? (
                centerContent
              ) : (title || subtitle) ? (
                <div className="text-center truncate">
                  {title && (
                    <h1 className="text-base font-display font-bold text-white truncate">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-xs text-white/60 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-1 min-w-[60px] justify-end">
              {rightActions ? (
                rightActions
              ) : (
                <>
                  {showSearch && (
                    <button
                      onClick={() => { triggerHaptic(); handleSearch(); }}
                      className="btn-touch p-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
                      aria-label="Search"
                    >
                      <Search className="w-5 h-5 text-white/80" />
                    </button>
                  )}

                  {showNotifications && (
                    <button
                      onClick={() => { triggerHaptic(); onNotificationsClick?.(); }}
                      className="btn-touch p-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors relative"
                      aria-label="Notifications"
                    >
                      <Bell className="w-5 h-5 text-white/80" />
                      {notificationCount > 0 && (
                        <span className="absolute top-1 right-1 w-4 h-4 bg-genz-hot-pink rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                      )}
                    </button>
                  )}

                  {showSettings && (
                    <button
                      onClick={() => { triggerHaptic(); onSettingsClick?.(); }}
                      className="btn-touch p-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
                      aria-label="Settings"
                    >
                      <Settings className="w-5 h-5 text-white/80" />
                    </button>
                  )}

                  {showMore && (
                    <button
                      onClick={() => { triggerHaptic(); onMoreClick?.(); }}
                      className="btn-touch p-2 -mr-2 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors"
                      aria-label="More options"
                    >
                      <MoreVertical className="w-5 h-5 text-white/80" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.header>

      {/* Spacer for fixed header */}
      <div className="h-14 safe-top" />

      {/* Navigation Drawer */}
      {navItems.length > 0 && (
        <MobileNavDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          items={navItems}
          header={logo}
        />
      )}

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-modal bg-dark-base/95 backdrop-blur-xl safe-top"
          >
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-full input-mobile pl-12"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                  className="btn-touch px-4 text-genz-electric-blue font-medium"
                >
                  Cancel
                </button>
              </div>

              {/* Search suggestions/results would go here */}
              <div className="mt-6">
                {searchQuery ? (
                  <p className="text-white/60 text-center py-8">
                    Searching for "{searchQuery}"...
                  </p>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-white/40 uppercase tracking-wider">
                      Recent Searches
                    </p>
                    {/* Recent searches list */}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Compact header variant for nested pages
interface CompactHeaderProps {
  title: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function MobileCompactHeader({ title, onBack, rightAction }: CompactHeaderProps) {
  const router = useRouter();

  return (
    <MobileHeader
      title={title}
      showBack={true}
      showMenu={false}
      onBackClick={onBack || (() => router.back())}
      rightActions={rightAction}
    />
  );
}
