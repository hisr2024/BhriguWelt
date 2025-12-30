import Link from "next/link";
import { PropsWithChildren } from "react";
import { engineConfigs } from "@/lib/engineConfig";

const primaryLinks = [
  { label: "Studio overview", href: "/studio/insights" },
  { label: "Engine directory", href: "/engines" },
  { label: "Analytics", href: "/engines/analytics" },
  { label: "Alerts", href: "/engines/alerts" },
];

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col gap-8 border-r border-white/10 bg-slate-950/80 px-8 py-8 lg:flex">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cosmic-radial text-xl">
              ॐ
            </span>
            <span>Studio</span>
          </Link>
          <nav className="space-y-3 text-sm">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-2xl border border-transparent px-4 py-2 text-slate-200 transition hover:border-white/15 hover:bg-white/5"
              >
                <span>{link.label}</span>
                <span className="text-xs text-white/40">↗</span>
              </Link>
            ))}
          </nav>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Quick engines</p>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              {engineConfigs.slice(0, 5).map((engine) => (
                <Link
                  key={engine.slug}
                  href={`/engines/${engine.slug}`}
                  className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 transition hover:border-white/30"
                >
                  <span>{engine.title}</span>
                  <span className="text-xs text-white/40">{engine.category}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
            Studio status: all engines synced · last refresh 2 min ago.
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
                  BhriguWelt Studio
                </span>
                <span className="hidden text-sm text-white/50 md:inline">
                  Insight operations · unified engine workspace
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60 md:flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>Live sync</span>
                </div>
                <Link
                  href="/engines"
                  className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/80"
                >
                  Launch engine
                </Link>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/10 bg-slate-950/80 px-6 py-6 text-xs text-white/40">
            Crafted for seekers · Engine telemetry and ritual guidance update in real time.
          </footer>
        </div>
      </div>
    </div>
  );
}
