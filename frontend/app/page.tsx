"use client";

import Link from "next/link";
import { motion, type Easing, type Transition } from "framer-motion";
import { ArrowRight, ArrowUpRight, Sparkles, Stars } from "lucide-react";
import { engineCards } from "@/lib/engineConfig";
import CosmicBackground from "@/components/CosmicBackground";
import EngineCard from "@/components/EngineCard";
import EngineDiscovery from "@/components/EngineDiscovery";
import EngineFeedbackForm from "@/components/EngineFeedbackForm";
import OnboardingTour from "@/components/OnboardingTour";

const easeOutCurve: Easing = [0.25, 0.46, 0.45, 0.94];
const transition: Transition = { duration: 0.45, ease: easeOutCurve };

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
    <div className="space-y-14">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
        className="relative overflow-hidden z-hero z-hero--cosmic p-10"
      >
        <CosmicBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-950/30 to-transparent" aria-hidden />
        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <div className="chip">BhriguWelt Engines</div>
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">
              A cosmic command center for every BhriguWelt experience.
            </h1>
            <p className="max-w-2xl text-base text-slate-300">
              Fluid, minimalist workflows for 13 engines with immersive motion, glowing results, and intuitive interactions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Open dashboard
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30"
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
          </div>
          <div className="relative space-y-4 rounded-3xl border border-white/10 bg-slate-950/70 p-6">
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
          </div>
        </div>
      </motion.section>

      <section className="vibe-grid">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="vibe-chip">Live status</div>
            <h2 className="mt-3 text-2xl font-semibold text-white">Your cosmic control room is synced.</h2>
            <p className="text-sm text-slate-400">
              Track backend availability, engine readiness, and community feedback in one glow-forward hub.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="vibe-pill">Always on</span>
            <span className="vibe-pill">Mobile-first</span>
            <span className="vibe-pill">Gen Z glow</span>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="vibe-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Engine health</p>
                <h3 className="mt-2 text-xl font-semibold text-white">All engines are ready to glow.</h3>
              </div>
              <div className="vibe-outline text-xs uppercase tracking-[0.2em]">Live telemetry</div>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Error handling active · auto-retry enabled
              </p>
              <div className="vibe-stat flex items-center justify-between">
                <span>Signal latency</span>
                <span className="font-semibold text-white">&lt; 2.5s</span>
              </div>
              <div className="vibe-stat flex items-center justify-between">
                <span>Synced engines</span>
                <span className="font-semibold text-white">13/13</span>
              </div>
              <div className="vibe-stat flex items-center justify-between">
                <span>Mobile performance</span>
                <span className="font-semibold text-white">A+</span>
              </div>
            </div>
          </div>
          <EngineFeedbackForm engineTitle="BhriguWelt" />
        </div>
      </section>

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
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {engineCards.slice(0, 6).map((engine, index) => (
            <EngineCard key={engine.slug} engine={engine} index={index} />
          ))}
        </div>
      </section>

      <EngineDiscovery engines={engineCards} />

      <OnboardingTour />
    </div>
  );
}
