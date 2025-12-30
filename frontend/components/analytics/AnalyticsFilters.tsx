"use client";

import { motion } from "@/lib/framer-motion";
import { Filter, Sparkles } from "lucide-react";
import type { FilterState } from "./types";

const ranges = [
  { value: "7d" as const, label: "Last 7 days" },
  { value: "30d" as const, label: "Last 30 days" },
  { value: "90d" as const, label: "Last 90 days" },
];

const segments = [
  { value: "all" as const, label: "All Gen Z" },
  { value: "students" as const, label: "Students" },
  { value: "creators" as const, label: "Creators" },
  { value: "seekers" as const, label: "Spiritual seekers" },
];

const regions = [
  { value: "global" as const, label: "Global" },
  { value: "americas" as const, label: "Americas" },
  { value: "emea" as const, label: "EMEA" },
  { value: "apac" as const, label: "APAC" },
];

type AnalyticsFiltersProps = {
  filters: FilterState;
  onChange: (next: FilterState) => void;
};

export default function AnalyticsFilters({ filters, onChange }: AnalyticsFiltersProps) {
  const toggleEngine = (engine: string) => {
    const engines = filters.engines.includes(engine)
      ? filters.engines.filter((item) => item !== engine)
      : [...filters.engines, engine];
    onChange({ ...filters, engines });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            <Filter className="h-4 w-4" />
            Filters & segments
          </div>
          <p className="text-sm text-slate-300">
            Tune the pulse for a Gen Z-only slice, regional focus, or specific engines.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-200">
          <Sparkles className="h-4 w-4 text-indigo-300" />
          Auto-refresh on
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr]">
        <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Time range
          <select
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-medium text-slate-100 shadow-sm outline-none transition focus:border-indigo-400"
            value={filters.range}
            onChange={(event) => onChange({ ...filters, range: event.target.value as FilterState["range"] })}
          >
            {ranges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Segment
          <select
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-medium text-slate-100 shadow-sm outline-none transition focus:border-indigo-400"
            value={filters.segment}
            onChange={(event) => onChange({ ...filters, segment: event.target.value as FilterState["segment"] })}
          >
            {segments.map((segment) => (
              <option key={segment.value} value={segment.value}>
                {segment.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Region
          <select
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-medium text-slate-100 shadow-sm outline-none transition focus:border-indigo-400"
            value={filters.region}
            onChange={(event) => onChange({ ...filters, region: event.target.value as FilterState["region"] })}
          >
            {regions.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Engine focus</p>
        <div className="flex flex-wrap gap-2">
          {[
            "Cosmic Chat",
            "Kundli",
            "Matchmaking",
            "Transit",
            "Past Life",
            "Career",
          ].map((engine) => {
            const isActive = filters.engines.includes(engine);
            return (
              <button
                key={engine}
                type="button"
                onClick={() => toggleEngine(engine)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                  isActive
                    ? "border-indigo-400 bg-indigo-500/20 text-indigo-100"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-indigo-300/60"
                }`}
              >
                {engine}
              </button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
