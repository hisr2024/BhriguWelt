"use client";

import Link from "next/link";
import { useMemo } from "react";
import { engineConfigs } from "@/lib/engineConfig";

const categories = ["Past", "Current", "Future"] as const;

type EngineSidebarNavProps = {
  currentSlug: string;
};

export default function EngineSidebarNav({ currentSlug }: EngineSidebarNavProps) {
  const grouped = useMemo(() => {
    return categories.map((category) => ({
      category,
      engines: engineConfigs.filter((engine) => engine.category === category),
    }));
  }, []);

  return (
    <aside className="hidden lg:block">
      <div className="glass-panel sticky top-28 space-y-6 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60">Engines</p>
        {grouped.map((group) => (
          <div key={group.category} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">{group.category}</p>
            <div className="grid gap-2">
              {group.engines.map((engine) => {
                const isActive = engine.slug === currentSlug;
                return (
                  <Link
                    key={engine.slug}
                    href={`/${engine.slug}`}
                    className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm transition ${
                      isActive
                        ? "border-neon-cyan/60 bg-neon-cyan/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/30"
                    }`}
                  >
                    {engine.title}
                    <span className="text-xs text-white/50">→</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
