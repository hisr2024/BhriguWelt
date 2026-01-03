'use client';

import { Home, Sparkles, Calendar, User, Heart } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Sparkles, label: 'Chart', href: '/birth-chart' },
  { icon: Calendar, label: 'Daily', href: '/daily-insights' },
  { icon: Heart, label: 'Match', href: '/matchmaking' },
  { icon: User, label: 'Profile', href: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="bottom-nav-blur md:hidden">
      <div className="flex items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="relative flex flex-col items-center gap-1 haptic-feedback transition-transform active:scale-95"
            >
              <motion.div
                className={`p-2 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze shadow-genz-glow'
                    : 'bg-transparent'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-white' : 'text-white/60'
                  }`}
                />
              </motion.div>

              <span
                className={`text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-genz-electric-blue'
                    : 'text-white/60'
                }`}
              >
                {item.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-genz-electric-blue"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Safe area spacing for devices with notch */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
