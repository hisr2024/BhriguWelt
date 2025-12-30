"use client";

import type { Easing } from "framer-motion";
import { ArrowDownToLine, ArrowUpRight, FileSpreadsheet, Flame, ShieldCheck, Sparkles, Star, Wand2 } from "lucide-react";
import type { EngineResult } from "@/lib/engineConfig";
import Tooltip from "@/components/Tooltip";
import EngineInsightOrbit from "@/components/EngineInsightOrbit";
import EngineZoomChart from "@/components/EngineZoomChart";
import { motion, useReducedMotion } from "@/lib/framer-motion";

const highlightIcons = [Sparkles, Flame, ShieldCheck, Star, Wand2];
const easeStandard: [number, number, number, number] = [0.2, 0.65, 0.3, 0.9];
const transition = { duration: 0.45, ease: easeStandard };
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition },
};

type EngineResultPanelProps = {
  result: EngineResult;
  accent: string;
  engineTitle: string;
};

export default function EngineResultPanel({ result, accent, engineTitle }: EngineResultPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.aside
      key={result.title}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={transition}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-6 sm:p-8">
        <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-70`} aria-hidden />
        <div className="relative space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">{engineTitle} results</p>
          <h3 className="text-2xl font-semibold text-white">{result.title}</h3>
          <p className="max-w-2xl text-sm text-slate-100/80">{result.summary}</p>
          <div className="flex flex-wrap gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-slate-200/80">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Priority insights</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Readable view</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Action-ready</span>
          </div>
        </div>
        <motion.div className="relative mt-6 grid gap-4" variants={staggerContainer} initial="hidden" animate="show">
          {result.highlights.map((highlight, index) => {
            const Icon = highlightIcons[index % highlightIcons.length];
            const confidence = 70 + index * 8;
            return (
              <motion.div
                key={highlight.label}
                variants={staggerItem}
                whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-300">
                      <Icon className="h-4 w-4 text-indigo-300" aria-hidden />
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
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <EngineInsightOrbit highlights={result.highlights} accent={accent} />

      <EngineZoomChart accent={accent} />

      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Recommended next steps</p>
        <motion.ul
          className="mt-4 grid gap-3 text-sm text-slate-200 md:grid-cols-2"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {result.nextSteps.map((step) => (
            <motion.li key={step} variants={staggerItem} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400" aria-hidden />
              {step}
            </motion.li>
          ))}
        </motion.ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_14px_26px_rgba(79,70,229,0.45)] transition hover:bg-indigo-400"
            aria-label="Save report"
          >
            Save report
            <ArrowUpRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100 transition hover:border-white/30"
            aria-label="Share insights"
          >
            Share insights
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100 transition hover:border-white/30"
            aria-label="Export results as PDF"
          >
            Export PDF
            <ArrowDownToLine className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100 transition hover:border-white/30"
            aria-label="Export results as CSV"
          >
            Export CSV
            <FileSpreadsheet className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
