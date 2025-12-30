"use client";

import { motion } from "@/lib/framer-motion";
import { Download, Share2, TimerReset } from "lucide-react";

type AnalyticsExportBarProps = {
  lastUpdated: string;
  onExport: (format: "csv" | "json") => void;
};

export default function AnalyticsExportBar({ lastUpdated, onExport }: AnalyticsExportBarProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-white/10 bg-slate-950/70 p-5"
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Export & share</p>
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <TimerReset className="h-4 w-4 text-indigo-300" />
          Last updated {lastUpdated}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onExport("csv")}
          className="flex items-center gap-2 rounded-full border border-indigo-400/70 bg-indigo-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
        <button
          type="button"
          onClick={() => onExport("json")}
          className="flex items-center gap-2 rounded-full border border-sky-400/70 bg-sky-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-100"
        >
          <Download className="h-4 w-4" />
          Export JSON
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
        >
          <Share2 className="h-4 w-4" />
          Share live view
        </button>
      </div>
    </motion.section>
  );
}
