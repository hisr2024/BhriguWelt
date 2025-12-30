"use client";

import Link from "next/link";

import AnimatedLogo from "@/components/AnimatedLogo";
import EngineGrid from "@/components/EngineGrid";
import { motion } from "@/lib/framer-motion";

const featureHighlights = [
  {
    title: "Glassmorphic Inputs",
    description: "Minimalist, touch-first forms designed for frictionless cosmic queries.",
  },
  {
    title: "Neon Results",
    description: "Readable output cards with spotlighted sutra insights and key takeaways.",
  },
  {
    title: "Ambient Motion",
    description: "Subtle motion cues powered by Framer Motion for modern engagement.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-20 pt-12">
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-neon-radial p-8 shadow-cosmic md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center"
        >
          <div>
            <div className="badge">Gen Z cosmic studio</div>
            <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">
              BhriguWelt is your neon portal to 13 celestial engines.
            </h1>
            <p className="mt-4 text-base text-white/70">
              Dark, cosmic, and crafted for modern seekers. Run your chart, map your future, match charts,
              and track every ritual in a single minimalist experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/horoscope"
                className="rounded-full bg-neon-cyan/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white shadow-neon transition hover:bg-neon-cyan/30"
              >
                Launch Engines
              </Link>
              <Link
                href="/chat"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-white/80 transition hover:border-white/40"
              >
                Talk to Bhrigu
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-center gap-6">
            <AnimatedLogo size="lg" />
            <div className="glass-panel w-full p-6 text-sm text-white/70">
              <p className="uppercase tracking-[0.3em] text-neon-cyan">Live snapshot</p>
              <p className="mt-3 text-base text-white">
                13 engines active · 5,421 insights cached · 0ms jitter for your next reading.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {featureHighlights.map((feature) => (
          <motion.div
            key={feature.title}
            className="glass-panel p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-lg font-semibold">{feature.title}</h3>
            <p className="mt-2 text-sm text-white/70">{feature.description}</p>
          </motion.div>
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/40">All engines</p>
            <h2 className="mt-2 text-3xl font-semibold">Explore every cosmic capability</h2>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-neon-cyan">
            View dashboard →
          </Link>
        </div>
        <EngineGrid />
      </section>

      <section className="glass-panel p-8 md:p-12">
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="badge">Full journey</p>
            <h2 className="mt-4 text-3xl font-semibold">Inputs. Outputs. Ritual-ready clarity.</h2>
            <p className="mt-4 text-sm text-white/70">
              Every engine is structured for clarity: clean input portals, instant API calls, and elegantly
              displayed responses. The experience remains performant across mobile, tablet, and widescreen
              formats.
            </p>
          </div>
          <div className="space-y-4">
            <div className="glass-panel p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">Inputs</p>
              <p className="mt-2 text-sm text-white/70">Names, dates, coordinates, and preferences captured in glass UI.</p>
            </div>
            <div className="glass-panel p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">Outputs</p>
              <p className="mt-2 text-sm text-white/70">Narratives, timelines, dashboards, and alerts styled for clarity.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
