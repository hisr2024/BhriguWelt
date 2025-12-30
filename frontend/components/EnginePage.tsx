"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { EngineConfig, EngineResult } from "@/lib/engineConfig";
import EngineForm from "@/components/EngineForm";
import ErrorBoundary from "@/components/ErrorBoundary";

const transition = { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] };

type EnginePageProps = {
  config: EngineConfig;
};

export default function EnginePage({ config }: EnginePageProps) {
  const Icon = config.icon;

  const result = useMemo<EngineResult>(
    () => ({
      title: config.resultTitle,
      summary: config.resultSummary,
      highlights: config.resultHighlights,
      nextSteps: config.nextSteps,
    }),
    [config],
  );

  const handleSubmit = async () => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return result;
  };

  return (
    <div className="space-y-10">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
        className={`glass-panel relative overflow-hidden p-8 bg-gradient-to-br `}
      >
        <div className="absolute inset-0 bg-result-gradient opacity-60" aria-hidden />
        <div className="relative space-y-6">
          <div className="chip">{config.title}</div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">{config.description}</h1>
              <p className="max-w-2xl text-sm text-slate-300">{config.cardDescription}</p>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Icon className="h-6 w-6" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {config.features.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...transition, delay: 0.08 }}
        className="glass-panel p-8"
      >
        <div className="mb-6 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{config.formTitle}</p>
          <h2 className="text-2xl font-semibold text-white">{config.formDescription}</h2>
        </div>
        <ErrorBoundary>
          <EngineForm
            fields={config.fields}
            onSubmit={handleSubmit}
            submitLabel={`Generate ${config.title} insight`}
          />
        </ErrorBoundary>
      </motion.section>
    </div>
  );
}
