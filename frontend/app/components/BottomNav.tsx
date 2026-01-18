'use client';

import { useCallback, useState } from 'react';
import { Home, Sparkles, Calendar, User, Heart, Plus, Menu, X, Moon, Sun, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  activeIcon?: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
  special?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Sparkles, label: 'Chart', href: '/birth-chart' },
  { icon: Plus, label: 'Create', href: '/birth-chart/create', special: true },
  { icon: Calendar, label: 'Daily', href: '/daily-insights' },
  { icon: User, label: 'Profile', href: '/profile' },
];

interface BottomNavProps {
  showLabels?: boolean;
  variant?: 'default' | 'floating' | 'minimal';
  className?: string;
}

export default function BottomNav({
  showLabels = true,
  variant = 'default',
  className = '',
}: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);

  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  // Handle navigation
  const handleNavigation = useCallback((href: string, isSpecial?: boolean) => {
    triggerHaptic();

    if (isSpecial) {
      // For special buttons, we could open a quick action menu
      setIsQuickMenuOpen(!isQuickMenuOpen);
    } else {
      setIsQuickMenuOpen(false);
      router.push(href);
    }
  }, [router, triggerHaptic, isQuickMenuOpen]);

  // Check if route is active (including child routes)
  const isRouteActive = useCallback((href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }, [pathname]);

  // Variant styles
  const variantStyles = {
    default: 'bottom-0 left-0 right-0 bg-dark-elevated/90 backdrop-blur-2xl border-t border-white/10',
    floating: 'bottom-4 left-4 right-4 bg-dark-elevated/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-mobile-lg',
    minimal: 'bottom-0 left-0 right-0 bg-transparent',
  };

  return (
    <>
      {/* Quick Action Menu (for special button) */}
      <AnimatePresence>
        {isQuickMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsQuickMenuOpen(false)}
            />

            {/* Quick menu */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-24 left-4 right-4 z-50 md:hidden"
            >
              <div className="bg-dark-elevated/95 backdrop-blur-2xl rounded-2xl border border-white/10 p-4 shadow-mobile-lg">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Sparkles, label: 'Birth Chart', href: '/birth-chart/create', color: 'from-cyan-500 to-blue-500' },
                    { icon: Heart, label: 'Matchmaking', href: '/matchmaking', color: 'from-pink-500 to-rose-500' },
                    { icon: Moon, label: 'Horoscope', href: '/horoscope', color: 'from-purple-500 to-indigo-500' },
                  ].map((action, index) => (
                    <motion.button
                      key={action.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        triggerHaptic();
                        setIsQuickMenuOpen(false);
                        router.push(action.href);
                      }}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 transition-all"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                        <action.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-xs font-medium text-white/80">{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav
        className={`
          fixed z-40 md:hidden
          ${variantStyles[variant]}
          ${className}
        `}
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isRouteActive(item.href);
            const isSpecial = item.special;

            if (isSpecial) {
              // Special center button (Create/Plus)
              return (
                <motion.button
                  key={item.href}
                  onClick={() => handleNavigation(item.href, true)}
                  className="relative -mt-6"
                  whileTap={{ scale: 0.9 }}
                >
                  <motion.div
                    animate={{ rotate: isQuickMenuOpen ? 45 : 0 }}
                    className={`
                      w-14 h-14 rounded-full
                      bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze
                      flex items-center justify-center
                      shadow-genz-glow
                      border-4 border-dark-base
                    `}
                  >
                    <Plus className="w-7 h-7 text-white" />
                  </motion.div>

                  {/* Pulse effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-genz-electric-blue/30"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                </motion.button>
              );
            }

            return (
              <motion.button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className="relative flex flex-col items-center justify-center py-2 px-3 min-w-[60px]"
                whileTap={{ scale: 0.9 }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute top-0 w-8 h-1 rounded-full bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Icon */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  className={`
                    p-2 rounded-xl transition-all duration-200
                    ${isActive ? 'bg-genz-electric-blue/10' : ''}
                  `}
                >
                  <Icon
                    className={`
                      w-5 h-5 transition-colors duration-200
                      ${isActive ? 'text-genz-electric-blue' : 'text-white/50'}
                    `}
                  />
                </motion.div>

                {/* Label */}
                {showLabels && (
                  <span
                    className={`
                      text-[10px] font-medium mt-0.5 transition-colors duration-200
                      ${isActive ? 'text-genz-electric-blue' : 'text-white/50'}
                    `}
                  >
                    {item.label}
                  </span>
                )}

                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1 right-2 min-w-[16px] h-4 px-1 text-[10px] font-bold bg-genz-hot-pink text-white rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Safe area spacing */}
        <div className="safe-bottom" />
      </nav>
    </>
  );
}

// Minimal Floating Action Button variant
interface FloatingTabBarProps {
  className?: string;
}

export function FloatingTabBar({ className = '' }: FloatingTabBarProps) {
  return <BottomNav variant="floating" className={className} />;
}

// Minimal variant without labels
export function MinimalBottomNav({ className = '' }: FloatingTabBarProps) {
  return <BottomNav showLabels={false} variant="minimal" className={className} />;
}
