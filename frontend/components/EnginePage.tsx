"use client";

import { useMemo } from "react";
import { motion, type Easing } from "framer-motion";
import { ArrowUpRight, Cpu, HelpCircle, Radar, Waves } from "lucide-react";
import { engineBySlug } from "@/lib/engineConfig";
import type { EngineResult } from "@/lib/engineConfig";
import EngineForm from "@/components/EngineForm";
import ErrorBoundary from "@/components/ErrorBoundary";
import CosmicBackground from "@/components/CosmicBackground";
import EngineBreadcrumbs from "@/components/EngineBreadcrumbs";
import EngineSidebarNav from "@/components/EngineSidebarNav";
import EngineBottomNav from "@/components/EngineBottomNav";
import EngineSwipeNavigator from "@/components/EngineSwipeNavigator";
import EngineStatusPanel from "@/components/EngineStatusPanel";
import EngineFeedbackForm from "@/components/EngineFeedbackForm";

const easeOutCurve: Easing = [0, 0, 0.58, 1];
const transition = { duration: 0.45, ease: easeOutCurve };
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition },
};

const engineStats = [
  { label: "Signal clarity", value: "92%", icon: Radar },
  { label: "Latency", value: "< 2.4s", icon: Cpu },
  { label: "Guidance depth", value: "Deep", icon: Waves },
];

type EnginePageProps = {
  slug: keyof typeof engineBySlug;
};

export default function EnginePage({ slug }: EnginePageProps) {
  const config = engineBySlug[slug];
  const Icon = config.icon;
  const shouldReduceMotion = useReducedMotion();

  const result = useMemo<EngineResult>(
    () => ({
      title: config.resultTitle,
      summary: config.resultSummary,
      highlights: config.resultHighlights,
      nextSteps: config.nextSteps,
    }),
    [config],
  );

  const handleSubmit = async (values: Record<string, string>) => {
    void values;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return {
        ...result,
        summary: `${result.summary} (Offline snapshot generated from cached models.)`,
      };
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
    return result;
  };

  return (
    <div className="space-y-10">
      <EngineBreadcrumbs />
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <EngineSidebarNav currentSlug={slug} />
        <div className="space-y-10">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transition}
            className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/80 p-8"
          >
            <CosmicBackground />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/40 to-transparent" aria-hidden />
            <div className="relative space-y-6">
              <div className="chip">{config.title} Engine</div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold text-white sm:text-4xl">{config.description}</h1>
                  <p className="max-w-2xl text-sm text-slate-300">{config.cardDescription}</p>
                </div>
                <motion.div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${config.accent}`}
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : {
                          y: [0, -6, 0],
                          rotate: [0, 4, 0],
                        }
                  }
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.06, rotate: 8 }}
                >
                  <Icon className="h-6 w-6 text-white" />
                </motion.div>
              </div>
              <motion.div
                className="flex flex-wrap gap-3"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {config.features.map((feature) => (
                  <motion.span
                    key={feature}
                    variants={staggerItem}
                    whileHover={shouldReduceMotion ? undefined : { y: -3, scale: 1.02 }}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200"
                  >
                    {feature}
                  </motion.span>
                ))}
              </motion.div>
              <motion.div
                className="grid gap-4 md:grid-cols-3"
                variants={staggerContainer}
                initial="hidden"
                animate="show"
              >
                {engineStats.map((stat) => {
                  const StatIcon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      variants={staggerItem}
                      whileHover={shouldReduceMotion ? undefined : { y: -4 }}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                        {stat.label}
                        <StatIcon className="h-4 w-4 text-indigo-300" />
                      </div>
                      <p className="mt-2 text-lg font-semibold text-white">{stat.value}</p>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.08 }}
            className="rounded-[2.5rem] border border-white/10 bg-slate-950/70 p-8"
          >
            <div className="mb-6 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{config.formTitle}</p>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-white">{config.formDescription}</h2>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-white/30"
                >
                  Quick tips
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <ErrorBoundary>
              <EngineForm
                fields={config.fields}
                onSubmit={handleSubmit}
                submitLabel={`Generate ${config.title} insight`}
                accent={config.accent}
                engineTitle={config.title}
              />
            </ErrorBoundary>
          </motion.section>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Guided support</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Need help completing the form?</h3>
              <p className="mt-2 text-sm text-slate-300">
                Look for help icons beside each field, or use the quick tips to capture precise data for the engine.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-indigo-300" />
                  Hover any label to reveal guidance and validation hints.
                </li>
                <li className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-indigo-300" />
                  Voice input is available for text fields on desktop.
                </li>
                <li className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-indigo-300" />
                  Offline mode will cache insights and sync later.
                </li>
              </ul>
            </div>
            <EngineStatusPanel />
          </div>

          <EngineFeedbackForm engineTitle={config.title} />
        </div>
      </div>
      <EngineBottomNav currentSlug={slug} />
      <EngineSwipeNavigator currentSlug={slug} />
    </div>
  );
}
