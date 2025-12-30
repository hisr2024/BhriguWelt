"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "@/lib/framer-motion";
import {
  ArrowUpRight,
  Cpu,
  Globe,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import AnalyticsCharts from "./AnalyticsCharts";
import AnalyticsExportBar from "./AnalyticsExportBar";
import AnalyticsFilters from "./AnalyticsFilters";
import AnalyticsMetricGrid from "./AnalyticsMetricGrid";
import AnalyticsRealtimePanel from "./AnalyticsRealtimePanel";
import type { FilterState, InsightItem, MetricCard, RealtimePulse } from "./types";

const initialFilters: FilterState = {
  range: "30d",
  segment: "all",
  region: "global",
  engines: ["Cosmic Chat", "Kundli", "Matchmaking", "Transit"],
};

const feedTemplates = [
  "New Kundli session launched in Mumbai",
  "Cosmic Chat asked about career timing",
  "Transit engine spiked during evening ritual",
  "Matchmaking compatibility scored 92%",
  "Past Life prompt saved as highlight",
  "Core Wisdom insight shared on socials",
];

const insightsBase: InsightItem[] = [
  {
    label: "Peak interest",
    value: "82%",
    description: "Rise in curiosity around career moves and cosmic alignment.",
    delta: "+12%",
  },
  {
    label: "Session depth",
    value: "68%",
    description: "Gen Z sessions are lasting longer with more follow-up prompts.",
    delta: "+6%",
  },
  {
    label: "Emotional resonance",
    value: "74%",
    description: "Sentiment stays positive across late-night queries.",
    delta: "+9%",
  },
];

export default function AnalyticsDashboard() {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [tick, setTick] = useState(0);
  const [realtime, setRealtime] = useState<RealtimePulse>({
    activeUsers: 12842,
    sessions: 936,
    sentiment: 82,
    syncHealth: 96,
  });
  const [feed, setFeed] = useState<string[]>(feedTemplates.slice(0, 4));

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
      setRealtime((prev) => ({
        activeUsers: Math.max(9800, prev.activeUsers + Math.floor(Math.random() * 300 - 120)),
        sessions: Math.max(640, prev.sessions + Math.floor(Math.random() * 60 - 20)),
        sentiment: Math.min(96, Math.max(64, prev.sentiment + Math.floor(Math.random() * 6 - 3))),
        syncHealth: Math.min(100, Math.max(88, prev.syncHealth + Math.floor(Math.random() * 4 - 2))),
      }));
      setFeed((prev) => {
        const next = feedTemplates[Math.floor(Math.random() * feedTemplates.length)];
        return [next, ...prev].slice(0, 5);
      });
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  const labels = useMemo(() => {
    switch (filters.range) {
      case "7d":
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      case "90d":
        return ["Month 1", "Month 2", "Month 3"];
      default:
        return ["Week 1", "Week 2", "Week 3", "Week 4"];
    }
  }, [filters.range]);

  const activitySeries = useMemo(() => {
    const base =
      filters.range === "7d"
        ? [42, 48, 52, 57, 55, 63, 70]
        : filters.range === "90d"
          ? [62, 71, 78]
          : [55, 62, 68, 73];
    return base.map((value, index) => value + ((tick + index) % 3));
  }, [filters.range, tick]);

  const sessionSeries = useMemo(() => {
    const base =
      filters.range === "7d"
        ? [28, 34, 36, 41, 40, 46, 51]
        : filters.range === "90d"
          ? [44, 52, 58]
          : [36, 42, 47, 52];
    return base.map((value, index) => value + ((tick + index) % 2));
  }, [filters.range, tick]);

  const engineUsage = useMemo(() => {
    const allEngines = [
      { label: "Cosmic Chat", value: 38 },
      { label: "Kundli", value: 24 },
      { label: "Matchmaking", value: 18 },
      { label: "Transit", value: 15 },
      { label: "Past Life", value: 12 },
      { label: "Career", value: 10 },
    ];
    return allEngines
      .filter((engine) => filters.engines.includes(engine.label))
      .map((engine) => ({ ...engine, value: engine.value + (tick % 4) }));
  }, [filters.engines, tick]);

  const personaMix = useMemo(
    () => [
      { label: "Late-night seekers", value: 34 },
      { label: "Goal setters", value: 28 },
      { label: "Creators", value: 22 },
      { label: "Wellness explorers", value: 16 },
    ],
    [],
  );

  const metrics = useMemo<MetricCard[]>(
    () => [
      {
        label: "Active Gen Z",
        value: realtime.activeUsers.toLocaleString(),
        delta: "+4.6%",
        trend: "up",
        helper: "Daily active users across all engines.",
        icon: Users,
      },
      {
        label: "Engagement lift",
        value: `${realtime.sentiment}%`,
        delta: "+2.1%",
        trend: "up",
        helper: "Sentiment-based engagement velocity.",
        icon: TrendingUp,
      },
      {
        label: "Engine sync",
        value: `${realtime.syncHealth}%`,
        delta: "-0.4%",
        trend: "down",
        helper: "Realtime engine health and latency.",
        icon: Cpu,
      },
      {
        label: "Global momentum",
        value: filters.region.toUpperCase(),
        delta: "+6.9%",
        trend: "up",
        helper: "Top performing region this week.",
        icon: Globe,
      },
    ],
    [filters.region, realtime.activeUsers, realtime.sentiment, realtime.syncHealth],
  );

  const insights = useMemo<InsightItem[]>(
    () =>
      insightsBase.map((item, index) => ({
        ...item,
        value: `${Math.min(92, parseInt(item.value, 10) + ((tick + index) % 4))}%`,
      })),
    [tick],
  );

  const handleExport = (format: "csv" | "json") => {
    const payload = {
      filters,
      metrics,
      activitySeries,
      sessionSeries,
      engineUsage,
      personaMix,
      generatedAt: new Date().toISOString(),
    };

    const blob =
      format === "json"
        ? new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
        : new Blob([
            [
              "metric,value,delta",
              ...metrics.map((metric) => `${metric.label},${metric.value},${metric.delta}`),
            ].join("\n"),
          ], { type: "text/csv" });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bhriguwelt-genz-analytics.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const lastUpdated = useMemo(() => {
    const timestamp = new Date();
    return timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }, [tick]);

  return (
    <div className="space-y-10">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-950/70 to-indigo-950/60 p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_55%)]" />
        <div className="relative space-y-4">
          <div className="chip">Gen Z Analytics</div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                BhriguWelt Gen Z Insights Hub
              </h1>
              <p className="max-w-2xl text-sm text-slate-300">
                Animated analytics, live engine performance, and behavioral signals across the entire Gen Z
                journey. Swipe, scroll, or pinch to explore deeper.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-xs uppercase tracking-[0.2em] text-slate-200">
              <Sparkles className="h-4 w-4 text-indigo-300" />
              Live refresh enabled
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              "User insights",
              "Engine usage",
              "Behavioral intent",
              "Realtime updates",
              "Export-ready",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      <AnalyticsFilters filters={filters} onChange={setFilters} />

      <AnalyticsMetricGrid metrics={metrics} />

      <AnalyticsCharts
        labels={labels}
        activitySeries={activitySeries}
        sessionSeries={sessionSeries}
        engineUsage={engineUsage}
        personaMix={personaMix}
      />

      <AnalyticsExportBar lastUpdated={lastUpdated} onExport={handleExport} />

      <AnalyticsRealtimePanel insights={insights} realtime={realtime} feed={feed} />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Next actions</p>
            <p className="text-lg font-semibold text-white">Push insights to your growth squad</p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-indigo-400/70 bg-indigo-500/20 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100"
          >
            <Zap className="h-4 w-4" />
            Trigger growth sprint
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Personalize engine nudges",
              description: "Deliver follow-up prompts based on late-night sessions.",
            },
            {
              title: "Amplify social sharing",
              description: "Boost Gen Z highlight exports to reels & stories.",
            },
            {
              title: "Rebalance engine load",
              description: "Shift compute to peak-hour engines to keep latency low.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-xs text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
