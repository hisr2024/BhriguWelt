"use client";

import { motion, type Easing } from "framer-motion";
import { ArrowDownToLine, ArrowUpRight, FileSpreadsheet, Flame, ShieldCheck, Sparkles, Star, Wand2 } from "lucide-react";
import type { EngineResult } from "@/lib/engineConfig";
import Tooltip from "@/components/Tooltip";
import EngineInsightOrbit from "@/components/EngineInsightOrbit";
import EngineZoomChart from "@/components/EngineZoomChart";

const highlightIcons = [Sparkles, Flame, ShieldCheck, Star, Wand2];
const transition = { duration: 0.45, ease: [0.2, 0.65, 0.3, 0.9] as Easing };

type EngineResultPanelProps = {
  result: EngineResult;
  accent: string;
  engineTitle: string;
};

export default function EngineResultPanel({ result, accent, engineTitle }: EngineResultPanelProps) {
  return (
    <motion.aside
      key={result.title}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={transition}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-6">
        <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-70`} aria-hidden />
        <div className="relative space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">{engineTitle} results</p>
          <h3 className="text-2xl font-semibold text-white">{result.title}</h3>
          <p className="text-sm text-slate-100/80">{result.summary}</p>
        </div>
        <div className="relative mt-6 grid gap-4">
          {result.highlights.map((highlight, index) => {
            const Icon = highlightIcons[index % highlightIcons.length];
            const confidence = 70 + index * 8;
            return (
              <div key={highlight.label} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-300">
                      <Icon className="h-4 w-4 text-indigo-300" />
                      {highlight.label}
                      <Tooltip content="Highlighted from the engine signal blend." />
                    </div>
                    <p className="text-base font-semibold text-white">{highlight.value}</p>
                  </div>
                  <span className="text-xs font-semibold uppercase text-slate-300">{confidence}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/5">
                  <motion.div
                    className="h-2 rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-fuchsia-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence}%` }}
                    transition={transition}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <EngineInsightOrbit highlights={result.highlights} accent={accent} />

      <EngineZoomChart accent={accent} />

      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Recommended next steps</p>
        <ul className="mt-4 space-y-2 text-sm text-slate-200">
          {result.nextSteps.map((step) => (
            <li key={step} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400" aria-hidden />
              {step}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-indigo-400"
          >
            Save report
            <ArrowUpRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-white/30"
          >
            Share insights
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-white/30"
          >
            Export PDF
            <ArrowDownToLine className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-white/30"
          >
            Export CSV
            <FileSpreadsheet className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
