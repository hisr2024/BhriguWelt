"use client";

import Link from "next/link";
import { motion, type Easing, type Transition } from "framer-motion";
import { ArrowRight, ArrowUpRight, Sparkles, Stars } from "lucide-react";
import { engineCards } from "@/lib/engineConfig";
import CosmicBackground from "@/components/CosmicBackground";
import EngineCard from "@/components/EngineCard";
import EngineDiscovery from "@/components/EngineDiscovery";
import OnboardingTour from "@/components/OnboardingTour";

const easeOutCurve: Easing = [0.25, 0.46, 0.45, 0.94];
const transition: Transition = { duration: 0.45, ease: easeOutCurve };
const staggerChildren: Transition = { duration: 0.4, ease: easeOutCurve, staggerChildren: 0.1 };

const quickAccess = [
  { href: "/horoscope", label: "Horoscope" },
  { href: "/past-life", label: "Past Life" },
  { href: "/future", label: "Future" },
  { href: "/matchmaking", label: "Matchmaking" },
  { href: "/calendar", label: "Calendar" },
  { href: "/timeline", label: "Timeline" },
  { href: "/varshaphal", label: "Varshaphal" },
  { href: "/transits", label: "Transits" },
  { href: "/core-wisdom", label: "Core Wisdom" },
  { href: "/chat", label: "Chat" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/alerts", label: "Alerts" },
  { href: "/analytics", label: "Analytics" },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
        className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-slate-950/70 p-8 sm:p-10"
      >
        <CosmicBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-950/10 to-transparent" aria-hidden />
        <motion.div
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          initial="hidden"
          animate="show"
          transition={staggerChildren}
          className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
        >
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="space-y-6">
            <div className="chip">BhriguWelt Engines</div>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">
              A cosmic command center for a new generation of seekers.
            </h1>
            <p className="max-w-2xl text-base text-slate-300">
              Hyper-personalized rituals, immersive timelines, and AI-guided clarity across 13 engines — all in a glassy,
              neon-lit universe.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-teal-400 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Open dashboard
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30"
              >
                Start chat
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <Sparkles className="h-4 w-4 text-indigo-300" />
                Glassmorphism UI
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <Stars className="h-4 w-4 text-indigo-300" />
                Motion-driven insights
              </span>
            </div>
          </motion.div>
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="glass-card hover-glow relative space-y-4 p-6"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Today’s pulse</p>
            <h2 className="text-2xl font-semibold text-white">Lunar clarity with rising intuition.</h2>
            <p className="text-sm text-slate-300">
              Track live signals, transits, and personalized rituals across every engine with instant feedback.
            </p>
            <div className="grid gap-2 text-sm text-slate-200">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Next transit alert</span>
                <span className="font-semibold text-white">21:10 IST</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span>Daily remedy</span>
                <span className="font-semibold text-white">Water ritual</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">System readiness</p>
              <div className="mt-3 h-2 rounded-full bg-white/5">
                <div className="h-2 w-11/12 rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-fuchsia-400" />
              </div>
              <p className="mt-2 text-xs text-slate-400">13 engines live · all signals synced</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Quick launch</h2>
            <p className="text-sm text-slate-400">Jump into popular engines or swipe on mobile for instant access.</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {quickAccess.map((engine) => (
              <Link
                key={engine.href}
                href={engine.href}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-200 transition hover:border-white/30"
              >
                {engine.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 md:grid md:gap-6 md:overflow-visible md:grid-cols-2 xl:grid-cols-3">
          {engineCards.slice(0, 6).map((engine, index) => (
            <div key={engine.slug} className="min-w-[260px] flex-1 md:min-w-0">
              <EngineCard engine={engine} index={index} />
            </div>
          ))}
        </div>
      </section>

      <EngineDiscovery engines={engineCards} />

      <OnboardingTour />
    </div>
  );
}
