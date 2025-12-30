"use client";

import { motion, useReducedMotion } from "@/lib/framer-motion";
import type { MetricCard } from "./types";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

type AnalyticsMetricGridProps = {
  metrics: MetricCard[];
};

export default function AnalyticsMetricGrid({ metrics }: AnalyticsMetricGridProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-4 lg:grid-cols-4"
    >
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const deltaClass = metric.trend === "up" ? "text-emerald-300" : "text-rose-300";
        return (
          <motion.div
            key={metric.label}
            variants={itemVariants}
            whileHover={reduceMotion ? undefined : { y: -6 }}
            className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5"
          >
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
              {metric.label}
              <Icon className="h-4 w-4 text-indigo-300" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-white">{metric.value}</p>
            <div className="mt-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
              <span className={deltaClass}>{metric.delta}</span>
              <span className="text-slate-500">vs last sync</span>
            </div>
            {metric.helper ? <p className="mt-3 text-xs text-slate-400">{metric.helper}</p> : null}
          </motion.div>
        );
      })}
    </motion.section>
  );
}
