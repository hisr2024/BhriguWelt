'use client';

import Link from "next/link";
import { motion, useReducedMotion } from "@/lib/framer-motion";
import { useI18n } from "@/lib/i18n";

const engines = [
  {
    title: "Horoscope",
    icon: "🌙",
    description: "Personalized birth chart insights with Saka-ready alignment and narrative clarity.",
    features: ["Birth data capture", "Interpretation output", "Voice-ready summaries"],
    href: "/horoscope",
  },
  {
    title: "Matchmaking",
    icon: "💞",
    description: "Compatibility scoring across traits, doshas, and remedies in one clean view.",
    features: ["Partner alignment", "Dosha diagnostics", "Remedy overview"],
    href: "/matchmaking",
  },
  {
    title: "Future",
    icon: "✨",
    description: "Forward-looking predictions mapped to cycles, dashas, and milestones.",
    features: ["Dasha timelines", "Key windows", "Highlights + cautions"],
    href: "/future",
  },
  {
    title: "Past Lives",
    icon: "🪷",
    description: "Past-life narratives and karmic patterns with calm, minimal delivery.",
    features: ["Karmic themes", "Narrative threads", "Healing focus"],
    href: "/past-life",
  },
  {
    title: "Core Wisdom",
    icon: "📜",
    description: "Repository-backed teachings distilled into concise, actionable guidance.",
    features: ["Bhrigu corpus", "Quick insights", "Remedy guidance"],
    href: "/core-wisdom",
  },
  {
    title: "Calendar",
    icon: "🗓️",
    description: "Śaka calendar references, tithis, and event overlays in a clean timeline.",
    features: ["Saka conversion", "Festival markers", "Daily alignment"],
    href: "/calendar",
  },
];

export default function HomePage() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const baseTransition = reduceMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 pb-16 pt-12 sm:px-8">
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={baseTransition}
          className="flex flex-col gap-6"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
            <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.85)]" aria-hidden />
            {t("hero.eyebrow", "BhriguWelt Engines")}
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
              {t("hero.title", "A minimalist hub for every astrology engine.")}
            </h1>
            <p className="max-w-3xl text-base text-slate-300 sm:text-lg">
              {t(
                "hero.body",
                "Explore each experience with smooth motion, quick context, and direct links. Everything is mobile-ready and stripped of clutter.",
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {t("nav.dashboard", "Open dashboard")}
            </Link>
            <Link
              href="/studio"
              className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300"
            >
              {t("nav.cta", "Enter the studio")}
            </Link>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...baseTransition, delay: 0.1 }}
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {engines.map((engine, index) => (
            <motion.article
              key={engine.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...baseTransition, delay: 0.08 * index }}
              whileHover={reduceMotion ? undefined : { y: -6 }}
              className="group flex h-full flex-col gap-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6 shadow-[0_24px_50px_rgba(15,23,42,0.35)] backdrop-blur transition hover:border-slate-600"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-2xl shadow-inner">
                  <span aria-hidden>{engine.icon}</span>
                </div>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Engine
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-white">{engine.title}</h2>
                <p className="text-sm text-slate-300">{engine.description}</p>
              </div>
              <ul className="space-y-2 text-sm text-slate-300">
                {engine.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                <Link
                  href={engine.href}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white transition group-hover:gap-3"
                >
                  {t("nav.explore", "Explore")} <span aria-hidden>→</span>
                </Link>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
