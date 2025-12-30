import Link from "next/link";
import { Space_Grotesk, Manrope } from "next/font/google";
import { ArrowUpRight } from "lucide-react";
import { engineCards } from "@/lib/engineConfig";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export default function EnginesPage() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} min-h-screen bg-hero-gradient text-white`}>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">BhriguWelt Engines</p>
            <h1 className="mt-3 text-fluid-2xl font-semibold">Choose your next insight engine</h1>
            <p className="mt-4 max-w-2xl text-fluid-base text-white/70">
              Explore every workflow—from chart intelligence to voice-driven rituals—with
              precision, polish, and Gen Z-ready interactions.
            </p>
          </div>
          <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs">
            12 engines · live & ready
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {engineCards.map((engine) => {
            const Icon = engine.icon;
            return (
              <Link
                key={engine.slug}
                href={`/engines/${engine.slug}`}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-card-gradient p-6 transition hover:-translate-y-1 hover:border-white/30"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${engine.accent} opacity-0 transition group-hover:opacity-100`} />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em]">
                      {engine.category}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-white/70 transition group-hover:text-white" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                      <Icon className="h-5 w-5 text-aurora" />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold">{engine.title}</h2>
                      <p className="text-xs text-white/60">{engine.description}</p>
                    </div>
                  </div>
                  <div className="grid gap-2 text-xs text-white/70">
                    {engine.preview.map((line) => (
                      <span key={line} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {line}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-white/60">
                    {engine.features.map((feature) => (
                      <span key={feature} className="rounded-full border border-white/10 px-2 py-1">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
