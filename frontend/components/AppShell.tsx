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
  Sparkles,
  Sun,
} from "lucide-react";
import BackendHealthNotice from "@/components/BackendHealthNotice";
import GdprConsentBanner from "@/components/GdprConsentBanner";
import { AnimatePresence, motion, useReducedMotion } from "@/lib/framer-motion";
import { getButtonMotion, pageTransition, pageVariants } from "@/lib/animations";
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
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-white/80 transition hover:border-white/40 hover:text-white"
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
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-cosmic-hero" aria-hidden />
      <div className="pointer-events-none fixed inset-0 -z-10 cosmic-grid opacity-[0.08]" aria-hidden />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-neon-cyan/90 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-900/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="group flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em]">
            <motion.div
              className="relative flex h-11 w-11 items-center justify-center"
              animate={shouldReduceMotion ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-0 rounded-2xl border border-white/30"
                animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="absolute inset-1 rounded-2xl bg-gradient-to-br from-neon-cyan/70 via-neon-violet/70 to-neon-pink/70 shadow-neon"
                animate={shouldReduceMotion ? undefined : { opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative text-sm font-semibold text-white">BW</span>
            </motion.div>
            <span className="text-white group-hover:text-neon-cyan">BhriguWelt</span>
          </Link>

          <nav className="hidden items-center gap-2 lg:flex" aria-label="Primary">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm transition ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-white/80 transition hover:border-white/30 hover:text-white lg:inline-flex"
            >
              <Sparkles className="h-4 w-4 text-neon-cyan" />
              Launch
            </Link>
            <ThemeToggle />
            <motion.button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10 lg:hidden"
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
          className={`border-t border-white/10 bg-ink-900/80 px-5 py-4 backdrop-blur-lg sm:px-8 lg:hidden ${
            menuOpen ? "block" : "hidden"
          }`}
        >
          <div className="grid gap-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white"
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
                <Link key={link.href} href={link.href} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/80">
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
          className="mx-auto w-full max-w-6xl px-5 pb-20 pt-10 sm:px-8"
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
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-ink-900/70 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden"
        aria-label="Primary mobile"
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-5 gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white/60">
          {navLinks.slice(0, 5).map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2 transition ${
                  isActive
                    ? "border-neon-cyan/60 bg-neon-cyan/20 text-white"
                    : "border-white/10 bg-white/5 text-white/70"
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

      <footer className="border-t border-white/10 bg-ink-900/80">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 text-sm text-white/70 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <p className="neon-pill">Cosmic OS</p>
            <h3 className="text-xl font-semibold text-white">A minimalist glassmorphism HQ for every BhriguWelt engine.</h3>
            <p className="text-white/60">
              Neon-accented surfaces, smooth routing, and a home for every ritual, alert, and insight.
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Core Engines</p>
            <div className="grid gap-2">
              {engineLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-white/70 transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Operations</p>
            <div className="grid gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="text-white/70 transition hover:text-white">
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
