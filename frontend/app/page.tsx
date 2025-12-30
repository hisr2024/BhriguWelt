"use client";

import Link from "next/link";
import { motion, type Easing, type Transition } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Compass,
  Flame,
  MessageCircle,
  Radar,
  ShieldCheck,
  Sparkles,
  Stars,
  Users,
} from "lucide-react";
import { engineCards } from "@/lib/engineConfig";
import CosmicBackground from "@/components/CosmicBackground";
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

const highlightCards = [
  {
    title: "Signal-ready engines",
    description: "Every BhriguWelt engine is tuned for short, dopamine-hit insights with deeper routes one tap away.",
    icon: Sparkles,
  },
  {
    title: "Guardrails on every insight",
    description: "Contextual nudges and trusted remedy cues keep guidance grounded and actionable.",
    icon: ShieldCheck,
  },
  {
    title: "Community-backed rituals",
    description: "See what the collective is doing this week and mirror rituals with the highest impact.",
    icon: Users,
  },
];

const socialProof = [
  {
    quote: "“Feels like Spotify Wrapped for my soul. The previews are so addictive.”",
    name: "Aanya · Mumbai",
  },
  {
    quote: "“We ran matchmaking + timeline in one sitting and got a full plan.”",
    name: "Karan · London",
  },
  {
    quote: "“The dashboard is giving main character energy with real insights.”",
    name: "Imani · NYC",
  },
];

const analyticsHighlights = [
  { label: "Engagement", value: "+22%" },
  { label: "Ritual streaks", value: "4.2x" },
  { label: "Alerts resolved", value: "94%" },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
        className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/80 p-8 sm:p-12"
      >
        <CosmicBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/50 to-transparent" aria-hidden />
        <div className="relative grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: easeOutCurve }}
                className="relative flex h-14 w-14 items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-indigo-400/40"
                />
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 3, ease: easeOutCurve }}
                  className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500/60 via-sky-400/40 to-fuchsia-500/60"
                />
                <span className="relative text-lg font-semibold text-white">BW</span>
              </motion.div>
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-slate-400">BhriguWelt</p>
                <h1 className="text-4xl font-semibold text-white sm:text-5xl">
                  Gen Z astro HQ for every engine, every vibe.
                </h1>
              </div>
            </div>
            <p className="max-w-2xl text-base text-slate-300">
              Animated previews, swipeable engines, and instant rituals. Jump from daily pulse to deep chart work without losing
              the glow.
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
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/40"
              >
                Ask the oracle
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <Stars className="h-4 w-4 text-indigo-300" />
                13 live engines
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <Sparkles className="h-4 w-4 text-indigo-300" />
                Motion-first insights
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                <MessageCircle className="h-4 w-4 text-indigo-300" />
                Instant guidance
              </span>
            </div>
          </div>
          <div className="relative space-y-5 rounded-3xl border border-white/10 bg-slate-950/70 p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Today’s pulse</p>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200">Live</span>
            </div>
            <h2 className="text-2xl font-semibold text-white">Lunar clarity, spotlighted for your week.</h2>
            <p className="text-sm text-slate-300">
              Quick previews from every engine keep you synced with transits, remedies, and micro-rituals.
            </p>
            <div className="space-y-3">
              {quickAccess.slice(0, 4).map((engine) => (
                <div key={engine.href} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <span className="text-sm text-slate-200">{engine.label}</span>
                  <ArrowUpRight className="h-4 w-4 text-slate-400" />
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">System sync</p>
              <div className="mt-3 h-2 rounded-full bg-white/5">
                <div className="h-2 w-11/12 rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-fuchsia-400" />
              </div>
              <p className="mt-2 text-xs text-slate-400">13 engines live · 4 rituals queued</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">All engines, one scroll</h2>
            <p className="text-sm text-slate-400">Swipe on mobile, hover on desktop. Every engine stays discoverable.</p>
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
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible xl:grid-cols-3">
          {engineCards.map((engine, index) => {
            const Icon = engine.icon;
            return (
              <motion.div
                key={engine.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.5 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="snap-start min-w-[260px] rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-lg shadow-indigo-500/10 transition md:min-w-0"
              >
                <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${engine.accent} p-3 text-white`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">{engine.title}</h3>
                  <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{engine.category}</span>
                </div>
                <p className="mt-2 text-sm text-slate-300">{engine.description}</p>
                <div className="mt-4 space-y-2 text-xs text-slate-300">
                  {engine.preview.map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                      <span>{item}</span>
                      <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                  {engine.features.map((feature) => (
                    <span key={feature} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                      {feature}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/${engine.slug}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 transition hover:text-indigo-100"
                >
                  Open engine
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Analytics snapshot</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Your cosmic dashboard, but make it data.</h2>
              <p className="mt-2 text-sm text-slate-300">
                Track growth, rituals, and engine momentum with a feed designed for quick flex checks.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300">
              <BarChart3 className="h-4 w-4 text-indigo-300" />
              Live tracking
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {analyticsHighlights.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
                <div className="mt-3 h-2 rounded-full bg-white/5">
                  <div className="h-2 rounded-full bg-gradient-to-r from-indigo-400 via-sky-400 to-fuchsia-400" style={{ width: item.label === "Engagement" ? "72%" : item.label === "Ritual streaks" ? "88%" : "64%" }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
              <span>Engine heatmap</span>
              <span className="text-emerald-300">+6 engines trending</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {["Horoscope", "Matchmaking", "Transits"].map((label) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between">
                    <span>{label}</span>
                    <ArrowUpRight className="h-4 w-4 text-emerald-300" />
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white/5">
                    <div className="h-2 w-4/5 rounded-full bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {highlightCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="rounded-3xl border border-white/10 bg-slate-950/70 p-6">
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-white/5 p-3">
                    <Icon className="h-5 w-5 text-indigo-200" />
                  </span>
                  <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                </div>
                <p className="mt-3 text-sm text-slate-300">{card.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Feature glow-up</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Everything you need to keep the vibe aligned.</h2>
          <p className="mt-2 text-sm text-slate-300">
            From ritual tracking to cosmic alerts, every feature is optimized for quick glances and deep dives.
          </p>
          <div className="mt-6 space-y-4">
            {["Swipeable engine previews", "AI-assisted ritual prompts", "Real-time cosmic alerts"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                <Flame className="h-4 w-4 text-rose-300" />
                {item}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <Radar className="h-4 w-4 text-indigo-300" />
              Signal radar
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <Compass className="h-4 w-4 text-indigo-300" />
              Ritual guidance
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
              <BarChart3 className="h-4 w-4 text-indigo-300" />
              Trend tracking
            </span>
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-indigo-500/10 via-slate-950/70 to-fuchsia-500/10 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Social proof</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Gen Z testers are obsessed.</h2>
          <p className="mt-2 text-sm text-slate-300">Proof that the engines hit different when the UX is this clean.</p>
          <div className="mt-6 space-y-4">
            {socialProof.map((item) => (
              <div key={item.name} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <p className="text-sm text-slate-200">{item.quote}</p>
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                  <span>{item.name}</span>
                  <span className="flex items-center gap-1">
                    {[0, 1, 2, 3, 4].map((star) => (
                      <Stars key={`${item.name}-${star}`} className="h-3.5 w-3.5 text-indigo-300" />
                    ))}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Launch the vibe
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/analytics"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/40"
            >
              See analytics
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <OnboardingTour />
    </div>
  );
}
