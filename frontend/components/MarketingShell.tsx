import Link from "next/link";
import { PropsWithChildren } from "react";
import SkipLink from "@/app/components/SkipLink";

const marketingLinks = [
  { label: "Engines", href: "/engines" },
  { label: "Studio", href: "/studio/insights" },
  { label: "Dashboard", href: "/engines/dashboard" },
  { label: "Insights", href: "/engines/future" },
];

export default function MarketingShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-hero-gradient text-white">
      <SkipLink />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cosmic-radial text-xl">
              ॐ
            </span>
            <span>BhriguWelt</span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-medium md:flex">
            {marketingLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-200 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/engines"
              className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em]"
            >
              Browse engines
            </Link>
            <Link
              href="/studio/insights"
              className="hidden rounded-full bg-aurora px-4 py-2 text-xs font-semibold text-slate-900 md:inline-flex"
            >
              Open studio
            </Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-white/10 bg-slate-950/70 px-6 py-10 text-center text-xs text-white/40">
        BhriguWelt Studio · A unified space for cosmic intelligence and ritual-ready guidance.
      </footer>
    </div>
  );
}
