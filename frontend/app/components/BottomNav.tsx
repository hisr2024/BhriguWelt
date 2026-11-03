'use client';

import { Home, Sparkles, Calendar, User, Heart, Plus } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: number;
  color?: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', href: '/', color: 'from-cyan-400 to-blue-500' },
  { icon: Sparkles, label: 'Chart', href: '/birth-chart', color: 'from-purple-400 to-pink-500' },
  { icon: Calendar, label: 'Daily', href: '/daily-insights', color: 'from-amber-400 to-orange-500' },
  { icon: Heart, label: 'Match', href: '/matchmaking', color: 'from-pink-400 to-rose-500' },
  { icon: User, label: 'Profile', href: '/profile', color: 'from-emerald-400 to-teal-500' },
];

// Ripple effect component for touch feedback
function Ripple({ x, y }: { x: number; y: number }) {
  return (
    <motion.span
      className="absolute rounded-full bg-white/30 pointer-events-none"
      initial={{ width: 0, height: 0, x: x - 0, y: y - 0, opacity: 0.5 }}
      animate={{ width: 100, height: 100, x: x - 50, y: y - 50, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Progress indicator for active tab
  const progress = useMotionValue(0);
  const activeIndex = navItems.findIndex((item) => item.href === pathname);

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Handle navigation with ripple effect
  const handleNavClick = useCallback((href: string, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);

    // Trigger haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    // Animate progress
    animate(progress, 1, {
      duration: 0.3,
      onComplete: () => {
        progress.set(0);
        router.push(href);
      },
    });

    // Clean up ripple
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 500);
  }, [router, progress]);

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      initial={{ y: 100 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Frosted glass background */}
      <div className="absolute inset-0 bg-dark-elevated/80 backdrop-blur-2xl border-t border-white/10" />

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark-base/50 to-transparent pointer-events-none" />

      {/* Active indicator bar */}
      <motion.div
        className="absolute top-0 h-0.5 bg-gradient-to-r from-genz-electric-blue via-genz-purple-haze to-genz-hot-pink"
        initial={false}
        animate={{
          left: `${(activeIndex / navItems.length) * 100}%`,
          width: `${100 / navItems.length}%`,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />

      <div className="relative flex items-center justify-around px-2 pt-2 pb-2">
        {navItems.map((item, _index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <motion.button
              key={item.href}
              onClick={(e) => handleNavClick(item.href, e)}
              className="relative flex flex-col items-center justify-center min-w-[64px] min-h-[56px] rounded-2xl overflow-hidden touch-manipulation"
              whileTap={{ scale: 0.92 }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Ripple container */}
              <AnimatePresence>
                {ripples.map((ripple) => (
                  <Ripple key={ripple.id} x={ripple.x} y={ripple.y} />
                ))}
              </AnimatePresence>

              {/* Active background glow */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className={`absolute inset-1 rounded-2xl bg-gradient-to-br ${item.color} opacity-20`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 0.2 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon container with animation */}
              <motion.div
                className="relative z-10"
                animate={{
                  y: isActive ? -2 : 0,
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <motion.div
                  className={`p-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-br ${item.color} shadow-lg`
                      : 'bg-transparent'
                  }`}
                  animate={{
                    boxShadow: isActive
                      ? '0 4px 20px rgba(0, 217, 255, 0.4)'
                      : '0 0 0 rgba(0, 0, 0, 0)',
                  }}
                >
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive ? 'text-white' : 'text-white/50'
                    }`}
                  />
                </motion.div>

                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-genz-hot-pink text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.span>
                )}
              </motion.div>

              {/* Label */}
              <motion.span
                className={`text-[10px] font-semibold mt-1 transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-white/50'
                }`}
                animate={{
                  opacity: isActive ? 1 : 0.6,
                  y: isActive ? 0 : 2,
                }}
              >
                {item.label}
              </motion.span>

              {/* Active dot indicator */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-genz-electric-blue"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Safe area spacing for devices with home indicator */}
      <div
        className="bg-dark-elevated/80 backdrop-blur-2xl"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      />
    </motion.nav>
  );
}

// Floating Action Button for quick actions
export function MobileFloatingAction({
  onClick,
  icon: Icon = Plus,
  label = 'Quick action',
  color = 'from-genz-electric-blue to-genz-purple-haze',
}: {
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  label?: string;
  color?: string;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.button
      className={`fixed bottom-24 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-br ${color} shadow-genz-glow flex items-center justify-center md:hidden touch-manipulation`}
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      aria-label={label}
      initial={{ scale: 0, rotate: -180 }}
      animate={{
        scale: isPressed ? 0.9 : 1,
        rotate: 0,
        boxShadow: isPressed
          ? '0 2px 10px rgba(0, 217, 255, 0.3)'
          : '0 8px 30px rgba(0, 217, 255, 0.5)',
      }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      <Icon className="w-6 h-6 text-white" />
    </motion.button>
  );
}
