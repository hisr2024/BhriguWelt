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
      <div className="sticky top-28 space-y-6 rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Engines</p>
        {grouped.map((group) => (
          <div key={group.category} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{group.category}</p>
            <div className="grid gap-2">
              {group.engines.map((engine) => {
                const isActive = engine.slug === currentSlug;
                return (
                  <Link
                    key={engine.slug}
                    href={`/${engine.slug}`}
                    className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-sm transition ${
                      isActive
                        ? "border-indigo-400/60 bg-indigo-500/20 text-white"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-white/30"
                    }`}
                  >
                    {engine.title}
                    <span className="text-xs text-slate-400">→</span>
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
