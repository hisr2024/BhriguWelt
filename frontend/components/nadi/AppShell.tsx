'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentType } from 'react';
import { ChartIcon, LeafIcon, SelfIcon, SunIcon, UnionIcon } from './icons';

type Tab = {
  href: string;
  label: string;
  icon: ComponentType<{ size?: number }>;
  /** Other routes that belong to this tab. */
  match: string[];
};

export const TABS: Tab[] = [
  { href: '/dashboard', label: 'Today', icon: SunIcon, match: ['/dashboard', '/horoscope'] },
  { href: '/bhrigu-predictions', label: 'Readings', icon: LeafIcon, match: ['/bhrigu-predictions', '/ai-chat'] },
  { href: '/birth-chart', label: 'Chart', icon: ChartIcon, match: ['/birth-chart', '/analytics'] },
  { href: '/matchmaking', label: 'Match', icon: UnionIcon, match: ['/matchmaking'] },
  { href: '/profile', label: 'Me', icon: SelfIcon, match: ['/profile', '/settings'] },
];

/** Screens without app navigation: landing, onboarding, lock screens, legal. */
const BARE_ROUTES = ['/', '/get-started', '/setup-passcode', '/unlock', '/offline', '/privacy', '/terms', '/impressum'];

const isActive = (pathname: string, tab: Tab) =>
  tab.match.some((m) => pathname === m || pathname.startsWith(`${m}/`));

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const bare = BARE_ROUTES.includes(pathname);

  if (bare) return <>{children}</>;

  return (
    <>
      <header className="sticky top-0 z-40 hidden md:block border-b border-[color:var(--line)] bg-[rgba(7,8,15,0.88)] backdrop-blur-md">
        <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/dashboard" className="font-display text-xl uppercase tracking-[0.08em] text-gold-200">
            BhriguWelt
          </Link>
          <ul className="flex items-center gap-1">
            {TABS.map((tab) => {
              const active = isActive(pathname, tab);
              const Icon = tab.icon;
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex h-11 items-center gap-2 rounded-xl px-4 text-sm transition-colors ${
                      active ? 'bg-[rgba(212,175,95,0.1)] text-gold-200' : 'text-ivory-2 hover:text-ivory'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <div className="pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0">{children}</div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--line)] bg-[rgba(7,8,15,0.94)] backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="mx-auto flex h-[68px] max-w-md items-stretch justify-around">
          {TABS.map((tab) => {
            const active = isActive(pathname, tab);
            const Icon = tab.icon;
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex h-full flex-col items-center justify-center gap-1 text-[11px] ${
                    active ? 'text-gold-200' : 'text-ivory-muted'
                  }`}
                >
                  {active && <span aria-hidden className="absolute top-0 h-0.5 w-7 rounded bg-gold-400" />}
                  <Icon size={22} />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
