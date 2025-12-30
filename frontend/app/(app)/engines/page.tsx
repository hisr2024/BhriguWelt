import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { engineCards, engineConfigs } from "@/lib/engineConfig";

const categorySummary = [
  {
    title: "Past",
    description: "Ancestral narrative scans, soul contracts, and memory recovery.",
  },
  {
    title: "Current",
    description: "Daily alignment, relationship harmony, and mantra-ready guidance.",
  },
  {
    title: "Future",
    description: "Forecasting, timeline mapping, and predictive analysis surfaces.",
  },
];

export default function EnginesPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-12">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Engine directory</p>
          <h1 className="mt-4 text-fluid-2xl font-semibold">Choose your next studio engine.</h1>
          <p className="mt-4 text-sm text-white/70">
            Every engine lives inside the Studio UI—standardized inputs, guided outputs, and a
            consistent ritual experience across teams.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/60">
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
              {engineConfigs.length} engines · live & ready
            </span>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
              Studio shell · unified navigation
            </span>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-card-gradient p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">Intent presets</p>
          <div className="mt-5 space-y-4">
            {categorySummary.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold">{item.title} engines</p>
                <p className="mt-2 text-sm text-white/70">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
      </section>
    </div>
  );
}
