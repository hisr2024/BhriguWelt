"use client";

import Link from "next/link";
import { usePwaPrompt } from "@/components/hooks/usePwaPrompt";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/horoscope", label: "Horoscope" },
  { href: "/past-life", label: "Past Life" },
  { href: "/future", label: "Future" },
  { href: "/matchmaking", label: "Matchmaking" },
  { href: "/calendar", label: "Calendar" },
  { href: "/studio/insights", label: "Studio" },
];

type NavigationProps = {
  onOpenMenu: () => void;
};

export function Navigation({ onOpenMenu }: NavigationProps) {
  const { canInstall, promptInstall } = usePwaPrompt();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Button variant="subtle" className="lg:hidden" onClick={onOpenMenu} aria-label="Menu">
            ☰
          </Button>
          <Link href="/" className="text-lg font-semibold text-white">
            BhriguWelt
          </Link>
        </div>
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-semibold text-slate-300 lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-amber-200">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400" aria-label="Language toggle">
            <span className="hidden sm:inline">Language</span>
            <select className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs text-slate-100">
              <option>EN</option>
              <option>HI</option>
              <option>ES</option>
              <option>TA</option>
            </select>
          </label>
          {canInstall && (
            <Button variant="ghost" className="hidden sm:inline-flex" onClick={promptInstall}>
              Install App
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export { links as navigationLinks };
