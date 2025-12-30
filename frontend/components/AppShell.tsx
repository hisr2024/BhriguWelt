'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChartLine,
  Compass,
  LayoutDashboard,
  MessageCircle,
  Moon,
  Sun,
} from "lucide-react";
import BackendHealthNotice from "@/components/BackendHealthNotice";
import GdprConsentBanner from "@/components/GdprConsentBanner";
import { AnimatePresence, motion, useReducedMotion } from "@/lib/framer-motion";
import { getButtonMotion, getFloatAnimation, pageTransition, pageVariants } from "@/lib/animations";
import { useThemeMode } from "@/lib/themeContext";
import { engineConfigs } from "@/lib/engineConfig";

const navLinks = [
  { href: "/", label: "Home", icon: Compass },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/analytics", label: "Analytics", icon: ChartLine },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
];

const engineLinks = engineConfigs.map((engine) => ({
  href: `/${engine.slug}`,
  label: engine.title,
}));

function ThemeToggle() {
  const { mode, cycleMode } = useThemeMode();
  const Icon = mode === "light" ? Sun : Moon;
  const shouldReduceMotion = useReducedMotion();
  const buttonMotion = getButtonMotion(shouldReduceMotion);

  return (
    <motion.button
      type="button"
      onClick={cycleMode}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200 transition hover:border-white/30 hover:text-white dark:text-slate-200"
      aria-label="Toggle theme"
      {...buttonMotion}
    >
      <Icon className="h-4 w-4" />
      {mode === "light" ? "Light" : mode === "high-contrast" ? "Focus" : "Dark"}
    </motion.button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const { animate: logoAnimation, transition: logoTransition } = getFloatAnimation(shouldReduceMotion, {
    y: 5,
    rotate: 4,
    duration: 5.4,
  });
  const { animate: navFloatAnimation, transition: navFloatTransition } = getFloatAnimation(shouldReduceMotion, {
    y: 3,
    rotate: 0,
    duration: 7,
    delay: 0.4,
  });

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Service worker registration is optional; ignore failure in unsupported contexts.
    });
  }, []);

  const mainKey = useMemo(() => pathname, [pathname]);

  return (
    <div className="min-h-screen bg-hero-gradient">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-indigo-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-white">
            <motion.span
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-xs font-bold shadow-glow"
              animate={logoAnimation}
              transition={logoTransition}
            >
              BW
            </motion.span>
            BhriguWelt
          </Link>
          <nav className="hidden items-center gap-2 lg:flex" aria-label="Primary">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <motion.div
                  key={link.href}
                  animate={navFloatAnimation}
                  transition={navFloatTransition}
                  whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <motion.button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10 lg:hidden touch-manipulation active:scale-95"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              whileTap={{ scale: 0.96 }}
            >
              {menuOpen ? "Close" : "Menu"}
            </motion.button>
          </div>
        </div>
        <div
          id="mobile-navigation"
          className={`border-t border-white/10 bg-slate-950/90 px-5 py-4 sm:px-8 lg:hidden ${
            menuOpen ? "block" : "hidden"
          }`}
        >
          <div className="grid gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white touch-manipulation active:scale-[0.99]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </span>
                  <span aria-hidden>→</span>
                </Link>
              );
            })}
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {engineLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.main
          key={mainKey}
          id="main"
          className="mx-auto w-full max-w-6xl px-5 pb-16 pt-10 sm:px-8"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <div className="mb-6">
            <BackendHealthNotice />
          </div>
          {children}
        </motion.main>
      </AnimatePresence>

      <GdprConsentBanner />

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/80 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden"
        aria-label="Primary mobile"
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-5 gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-300">
          {navLinks.slice(0, 5).map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 transition touch-manipulation active:scale-95 ${
                  isActive
                    ? "border-indigo-400 bg-indigo-500/20 text-white"
                    : "border-white/10 bg-white/5 text-slate-300"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <footer className="border-t border-white/10 bg-slate-950/70">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 text-sm text-slate-300 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <p className="chip">Astrology Intelligence</p>
            <h3 className="text-fluid-lg font-semibold text-white">
              A dark-first workspace for every BhriguWelt engine.
            </h3>
            <p className="text-slate-400">
              Seamless inputs, rich results, and a mobile-first surface that keeps guidance clear and focused.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Core Engines</p>
            <div className="grid gap-2">
              {engineLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-slate-300 transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Operations</p>
            <div className="grid gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-slate-300 transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
