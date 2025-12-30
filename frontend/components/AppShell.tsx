'use client';

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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
import GdprConsentBanner from "@/components/GdprConsentBanner";
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

const easeOutCurve: [number, number, number, number] = [0, 0, 0.58, 1];

function ThemeToggle() {
  const { mode, cycleMode } = useThemeMode();
  const Icon = mode === "light" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={cycleMode}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200 transition hover:border-white/30 hover:text-white dark:text-slate-200"
      aria-label="Toggle theme"
    >
      <Icon className="h-4 w-4" />
      {mode === "light" ? "Light" : mode === "high-contrast" ? "Focus" : "Dark"}
    </button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-xs font-bold shadow-glow">
              BW
            </span>
            BhriguWelt
          </Link>
          <nav className="hidden items-center gap-2 lg:flex" aria-label="Primary">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10 lg:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: easeOutCurve }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <GdprConsentBanner />

      <footer className="border-t border-white/10 bg-slate-950/70">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-12 text-sm text-slate-300 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <p className="chip">Astrology Intelligence</p>
            <h3 className="text-2xl font-semibold text-white">A dark-first workspace for every BhriguWelt engine.</h3>
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
