"use client";

import { AnimatePresence, motion } from "@/lib/framer-motion";
import { Activity, MessageCircle, Radar, SignalHigh } from "lucide-react";
import type { InsightItem, RealtimePulse } from "./types";

type AnalyticsRealtimePanelProps = {
  insights: InsightItem[];
  realtime: RealtimePulse;
  feed: string[];
};

export default function AnalyticsRealtimePanel({
  insights,
  realtime,
  feed,
}: AnalyticsRealtimePanelProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">User insights</p>
            <p className="text-lg font-semibold text-white">Gen Z sentiment & intent</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">
            <Radar className="h-4 w-4 text-indigo-300" />
            Live sync
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {insights.map((insight) => (
            <div key={insight.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-white">
                <span>{insight.label}</span>
                <span className="text-emerald-300">{insight.delta}</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">{insight.description}</p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span>Signal</span>
                  <span className="text-slate-200">{insight.value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/5">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400"
                    style={{ width: insight.value }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6"
      >
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Real-time</p>
          <p className="text-lg font-semibold text-white">Live heartbeat</p>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-slate-200">
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-300" />
              Active users
            </span>
            <span className="text-white">{realtime.activeUsers.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-indigo-300" />
              Live sessions
            </span>
            <span className="text-white">{realtime.sessions.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="flex items-center gap-2">
              <SignalHigh className="h-4 w-4 text-emerald-300" />
              Sentiment score
            </span>
            <span className="text-white">{realtime.sentiment}%</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Live feed</p>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {feed.map((item) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300"
                >
                  {item}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      </motion.div>
    </section>
  );
}
