"use client";

import { useMemo, useState, type ComponentType } from "react";
import { Search, Sparkles, X } from "lucide-react";
import EngineCard from "@/components/EngineCard";
import Tooltip from "@/components/Tooltip";

const categories = ["All", "Past", "Current", "Future"] as const;

type EngineDiscoveryProps = {
  engines: Array<{
    slug: string;
    title: string;
    description: string;
    category: string;
    preview: string[];
    features: string[];
    icon: ComponentType<{ className?: string }>;
    accent: string;
  }>;
};

export default function EngineDiscovery({ engines }: EngineDiscoveryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("All");

  const filteredEngines = useMemo(() => {
    const lowerQuery = query.toLowerCase().trim();
    return engines.filter((engine) => {
      const matchesCategory = category === "All" || engine.category === category;
      const matchesQuery =
        !lowerQuery ||
        engine.title.toLowerCase().includes(lowerQuery) ||
        engine.description.toLowerCase().includes(lowerQuery) ||
        engine.features.some((feature) => feature.toLowerCase().includes(lowerQuery));
      return matchesCategory && matchesQuery;
    });
  }, [category, engines, query]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">All engines</h2>
          <p className="text-sm text-white/60">Search, filter, and explore all 13 engines in seconds.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-white/70">
            <Sparkles className="h-4 w-4 text-neon-cyan" />
            {filteredEngines.length} engines ready
          </span>
          <Tooltip content="Search by name, feature, or intent to jump into an engine fast." />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <label className="glass-panel flex items-center gap-3 px-4 py-3 text-sm text-white/70">
          <Search className="h-4 w-4 text-white/50" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search engines, features, or outcomes"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            aria-label="Search engines"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/60 transition hover:border-white/30"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </label>
        <div className="flex w-full gap-2 overflow-x-auto pb-1 sm:flex-wrap">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition touch-manipulation active:scale-95 ${
                category === item
                  ? "border-neon-cyan bg-neon-cyan/20 text-white"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible xl:grid-cols-3">
        {filteredEngines.map((engine, index) => (
          <div key={engine.slug} className="snap-start min-w-[260px] flex-1 md:min-w-0">
            <EngineCard engine={engine} index={index} />
          </div>
        ))}
      </div>
      {filteredEngines.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 text-sm text-white/70">
          No engines match your filters. Try clearing the search or switching categories.
        </div>
      ) : null}
    </section>
  );
}
