"use client";

import Link from "next/link";
import { motion, type Easing, type Transition } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Compass,
  Fingerprint,
  Globe,
  Orbit,
  Sparkles,
  Stars,
} from "lucide-react";
import { engineCards } from "@/lib/engineConfig";

const easeOutCurve: Easing = [0.25, 0.46, 0.45, 0.94];
const transition: Transition = { duration: 0.5, ease: easeOutCurve };
const staggerChildren: Transition = { duration: 0.4, ease: easeOutCurve, staggerChildren: 0.08 };

const highlights = [
  {
    title: "Neon glassmorphism",
    description: "Layered glass panels, cinematic shadows, and neon accents built for premium clarity.",
    icon: Sparkles,
  },
  {
    title: "Instant ritual flow",
    description: "Swipeable inputs, guided next steps, and mobile-first motion across every engine.",
    icon: Fingerprint,
  },
  {
    title: "Global astro stack",
    description: "Precision routing, smart forms, and resilient API orchestration in every journey.",
    icon: Globe,
  },
];

const experienceBlocks = [
  {
    title: "Routing ready",
    description: "Jump between engines, dashboards, and alerts with zero friction or backtracking.",
    icon: Compass,
  },
  {
    title: "Forms that flow",
    description: "Multi-step, touch-friendly forms with real-time validation and instant previews.",
    icon: Fingerprint,
  },
  {
    title: "Signal sync",
    description: "Live health checks and offline fallbacks keep insights resilient and responsive.",
    icon: Orbit,
  },
];

const trustPoints = [
  "13 engines fully connected",
  "Multi-device responsive design",
  "Framer Motion micro-interactions",
  "Accessible focus + keyboard flows",
];

const stats = [
  { label: "Engines live", value: "13" },
  { label: "Avg response", value: "< 2.5s" },
  { label: "User rating", value: "4.9 ★" },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
        className="glass-panel relative overflow-hidden px-6 py-12 sm:px-10"
      >
        <div className="absolute inset-0 cosmic-grid opacity-[0.08]" aria-hidden />
        <div className="absolute -top-28 right-0 h-56 w-56 rounded-full bg-neon-pink/20 blur-[110px]" aria-hidden />
        <div className="absolute -bottom-28 left-0 h-56 w-56 rounded-full bg-neon-cyan/20 blur-[110px]" aria-hidden />

        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <motion.div
                className="relative flex h-16 w-16 items-center justify-center"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.div
                  className="absolute inset-0 rounded-3xl border border-white/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-1 rounded-3xl bg-gradient-to-br from-neon-cyan/70 via-neon-violet/70 to-neon-pink/70 shadow-neon"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="relative text-lg font-semibold text-white">BW</span>
              </motion.div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/60">BhriguWelt</p>
                <h1 className="text-4xl font-semibold text-white sm:text-5xl">
                  World-class astro intelligence. Designed for Gen Z.
                </h1>
              </div>
            </div>
            <p className="max-w-2xl text-base text-white/70">
              Dark cosmic surfaces, neon accents, and minimalist clarity. Explore 13 engines for horoscope, past life,
              matchmaking, analytics, and more—crafted for fast insight and deep focus.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="#engines"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-pink px-6 py-3 text-sm font-semibold text-slate-900 transition hover:opacity-90"
              >
                Explore engines
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40"
              >
                Open dashboard
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
              {stats.map((stat) => (
                <span key={stat.label} className="neon-pill">
                  {stat.value} · {stat.label}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-card relative space-y-6 p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Live control</p>
              <span className="neon-outline px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neon-cyan">
                Synced
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-white">Signal-ready engines with always-on routing.</h2>
            <p className="text-sm text-white/70">
              A premium workspace for real-time guidance, results, and next steps.
            </p>
            <div className="space-y-3">
              {trustPoints.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80">
                  <CheckCircle2 className="h-4 w-4 text-neon-cyan" />
                  {item}
                </div>
              ))}
            </div>
            <div className="gradient-divider" />
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">System pulse</p>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div className="h-2 w-11/12 rounded-full bg-gradient-to-r from-neon-cyan via-neon-violet to-neon-pink" />
              </div>
              <p className="mt-2 text-xs text-white/60">13 engines online · 4 rituals queued</p>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Design system</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Dark cosmic. Neon accents. Glass precision.</h2>
            <p className="mt-2 text-sm text-white/60">
              Inspired by the best modern interfaces—minimal, confident, and engineered for readability.
            </p>
          </div>
        </div>
        <motion.div
          className="grid gap-4 md:grid-cols-3"
          variants={staggerChildren}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {highlights.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
                className="glass-card space-y-4 p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Icon className="h-6 w-6 text-neon-cyan" />
                </div>
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                <p className="text-sm text-white/60">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <section id="engines" className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">13 engines</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Every engine on one premium runway.</h2>
            <p className="mt-2 text-sm text-white/60">
              Horoscope, past-life, future, matchmaking, calendar, timeline, varshaphal, transits, core-wisdom, chat,
              dashboard, alerts, analytics.
            </p>
          </div>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:border-white/40"
          >
            Ask the oracle
            <Stars className="h-4 w-4" />
          </Link>
        </div>
        <motion.div
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          variants={staggerChildren}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {engineCards.map((engine) => {
            const Icon = engine.icon;
            return (
              <motion.div
                key={engine.slug}
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                className="glass-card group flex h-full flex-col gap-4 p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-2xl bg-white/10 p-3 text-white">
                    <Icon className="h-5 w-5 text-neon-cyan" />
                  </span>
                  <span className="text-xs uppercase tracking-[0.3em] text-white/50">{engine.category}</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{engine.title}</h3>
                  <p className="mt-2 text-sm text-white/60">{engine.description}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.2em] text-white/50">
                  {engine.features.slice(0, 3).map((feature) => (
                    <span key={feature} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {feature}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/${engine.slug}`}
                  className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-neon-cyan transition group-hover:text-white"
                >
                  Launch engine
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <section className="glass-panel space-y-8 px-6 py-10 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Experience</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Flawless routing, forms, and API calls.</h2>
            <p className="mt-2 text-sm text-white/60">
              The core flow is optimized for instant guidance, backed by resilient services and clear progress states.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60">
            <Orbit className="h-4 w-4 text-neon-cyan" />
            Real-time sync
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {experienceBlocks.map((block) => {
            const Icon = block.icon;
            return (
              <div key={block.title} className="glass-card space-y-3 p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                  <Icon className="h-5 w-5 text-neon-pink" />
                </div>
                <h3 className="text-lg font-semibold text-white">{block.title}</h3>
                <p className="text-sm text-white/60">{block.description}</p>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink-900 transition hover:bg-slate-100"
          >
            View analytics
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link
            href="/calendar"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40"
          >
            Open calendar
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
